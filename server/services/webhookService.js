/**
 * Dịch Vụ Đồng Bộ Webhook Thời Gian Thực (Google Sheets & External Integrations)
 * Chịu trách nhiệm chuyển tiếp câu trả lời của đáp viên sang Google Sheets Webhook (Google Apps Script)
 * theo cơ chế Bất đồng bộ Không chặn luồng (Non-blocking Fire-and-Forget).
 */
const dns = require('dns').promises;

class WebhookService {
  /**
   * Kiểm tra Hostname có phải địa chỉ Private / Loopback / Link-local không (Chặn SSRF)
   * @param {string} host
   * @returns {boolean}
   */
  isPrivateOrLoopbackHost(host) {
    if (!host || typeof host !== 'string') return true;
    let cleanHost = host.trim().toLowerCase();

    // Loại bỏ dấu ngoặc vuông IPv6 nếu có (ví dụ [::1])
    if (cleanHost.startsWith('[') && cleanHost.endsWith(']')) {
      cleanHost = cleanHost.slice(1, -1);
    }

    // Tên miền loopback / metadata / local
    if (
      cleanHost === 'localhost' ||
      cleanHost.endsWith('.localhost') ||
      cleanHost.endsWith('.local') ||
      cleanHost.endsWith('.internal') ||
      cleanHost.endsWith('.lan')
    ) {
      return true;
    }

    // IPv6 loopback / link-local / private
    if (
      cleanHost === '::1' ||
      cleanHost === '::' ||
      cleanHost === '0:0:0:0:0:0:0:1' ||
      cleanHost === '0:0:0:0:0:0:0:0' ||
      cleanHost.startsWith('fe80:') ||
      cleanHost.startsWith('fe8') ||
      cleanHost.startsWith('fe9') ||
      cleanHost.startsWith('fea') ||
      cleanHost.startsWith('feb') ||
      cleanHost.startsWith('fc') ||
      cleanHost.startsWith('fd')
    ) {
      return true;
    }

    // Kiểm tra IPv4-mapped IPv6 (ví dụ ::ffff:127.0.0.1 hoặc ::ffff:7f00:1)
    let ipv4Candidate = cleanHost;
    if (cleanHost.startsWith('::ffff:')) {
      const mapped = cleanHost.slice(7);
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(mapped)) {
        ipv4Candidate = mapped;
      } else {
        const hexParts = mapped.split(':');
        if (hexParts.length === 2 && /^[0-9a-f]{1,4}$/i.test(hexParts[0]) && /^[0-9a-f]{1,4}$/i.test(hexParts[1])) {
          const hi = parseInt(hexParts[0], 16);
          const lo = parseInt(hexParts[1], 16);
          ipv4Candidate = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
        } else {
          return true;
        }
      }
    }

    // IPv4 check
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ipv4Candidate.match(ipv4Regex);
    if (match) {
      const a = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      const c = parseInt(match[3], 10);
      const d = parseInt(match[4], 10);

      if (a > 255 || b > 255 || c > 255 || d > 255) return true;
      if (a === 0) return true; // 0.0.0.0/8
      if (a === 127) return true; // 127.0.0.0/8 Loopback
      if (a === 10) return true; // 10.0.0.0/8 Private RFC 1918
      if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 Private RFC 1918
      if (a === 192 && b === 168) return true; // 192.168.0.0/16 Private RFC 1918
      if (a === 169 && b === 254) return true; // 169.254.0.0/16 Link-local / Cloud Metadata (169.254.169.254)
      if (a >= 224) return true; // Multicast & Reserved
    }

    return false;
  }

  /**
   * Kiểm tra URL Webhook có hợp lệ về mặt cú pháp không
   * @param {string} url 
   * @returns {boolean}
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return false;
    }
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Kiểm tra URL Webhook an toàn, không trỏ vào mạng nội bộ (Chống SSRF)
   * @param {string} url
   * @returns {boolean}
   */
  isSafeUrl(url) {
    if (!this.isValidUrl(url)) return false;
    try {
      const parsed = new URL(url.trim());
      if (this.isPrivateOrLoopbackHost(parsed.hostname)) {
        return process.env.NODE_ENV === 'test';
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Kiểm tra URL Webhook an toàn bất đồng bộ (chống SSRF & DNS Rebinding)
   * Phân giải tên miền thành danh sách IP và đối chiếu dải IP thực tế.
   * Nếu bất kỳ IP nào là private, loopback, link-local hoặc cloud metadata, trả về false (trừ khi NODE_ENV === 'test').
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async isSafeUrlAsync(url) {
    if (!this.isValidUrl(url)) return false;
    try {
      const parsed = new URL(url.trim());
      if (this.isPrivateOrLoopbackHost(parsed.hostname)) {
        return process.env.NODE_ENV === 'test';
      }

      try {
        const addresses = await dns.lookup(parsed.hostname, { all: true });
        if (!addresses || addresses.length === 0) {
          return false;
        }
        for (const entry of addresses) {
          if (this.isPrivateOrLoopbackHost(entry.address)) {
            if (process.env.NODE_ENV === 'test') {
              return true;
            }
            return false;
          }
        }
      } catch (dnsErr) {
        if (process.env.NODE_ENV === 'test') {
          return true;
        }
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Chuẩn hóa Payload gửi sang Google Sheets theo đúng Đặc tả Mục 12
   * @param {object} responseData 
   * @returns {object}
   */
  formatPayload(responseData) {
    return {
      survey_id: responseData.survey_id || '',
      response_id: responseData.response_id || '',
      submitted_at: responseData.submitted_at || new Date().toISOString(),
      duration_sec: Math.max(0, parseInt(responseData.duration_sec, 10) || 0),
      quality_score: typeof responseData.quality_score === 'number' 
        ? Math.round(responseData.quality_score * 100) / 100 
        : 0,
      answers: (responseData.answers && typeof responseData.answers === 'object' && !Array.isArray(responseData.answers))
        ? responseData.answers
        : {}
    };
  }

  /**
   * Thực hiện gửi HTTP POST sang URL Webhook (Internal Async Worker)
   * @param {string} webhookUrl 
   * @param {object} payload 
   * @returns {Promise<{success: boolean, status?: number, message?: string}>}
   */
  async sendPayload(webhookUrl, payload) {
    try {
      if (!webhookUrl || typeof webhookUrl !== 'string') {
        return { success: false, message: 'URL webhook không hợp lệ' };
      }

      let parsed;
      try {
        parsed = new URL(webhookUrl.trim());
      } catch {
        return { success: false, message: 'URL webhook không hợp lệ' };
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { success: false, message: 'URL webhook không hợp lệ' };
      }

      const isSafe = await this.isSafeUrlAsync(webhookUrl);
      if (!isSafe) {
        console.warn(`[WebhookSync] Từ chối gửi: URL webhook không an toàn (SSRF / DNS Rebinding) - ${webhookUrl}`);
        return { success: false, message: 'URL webhook khong an toan (SSRF)' };
      }

      const postBody = JSON.stringify(payload);
      let currentUrl = webhookUrl.trim();
      let method = 'POST';
      let bodyToSend = postBody;
      let response = null;

      // Tự kiểm soát redirect (tối đa 3 hop) và xác thực lại SSRF cho mỗi URL đích
      for (let hop = 0; hop <= 3; hop++) {
        const hopSafe = await this.isSafeUrlAsync(currentUrl);
        if (!hopSafe) {
          console.warn(`[WebhookSync] Từ chối redirect sang URL không an toàn (SSRF): ${currentUrl}`);
          return { success: false, message: 'URL webhook redirect khong an toan (SSRF)' };
        }

        const headers = { 'User-Agent': 'SurvHub-Webhook-Engine/1.0' };
        if (method === 'POST') {
          headers['Content-Type'] = 'application/json';
        }

        response = await fetch(currentUrl, {
          method,
          headers,
          body: method === 'POST' ? bodyToSend : undefined,
          redirect: 'manual',
          signal: AbortSignal.timeout(10000)
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location || hop === 3) {
            return { success: false, status: response.status, message: 'Quá nhiều chuyển hướng Webhook' };
          }
          currentUrl = new URL(location, currentUrl).toString();
          if (response.status === 301 || response.status === 302 || response.status === 303) {
            method = 'GET';
            bodyToSend = undefined;
          }
          continue;
        }
        break;
      }

      if (!response || !response.ok) {
        const statusCode = response ? response.status : 0;
        console.warn(`[WebhookSync] Webhook nhận HTTP ${statusCode} từ ${webhookUrl}`);
        return { success: false, status: statusCode, message: `HTTP ${statusCode}` };
      }

      return { success: true, status: response.status };
    } catch (err) {
      console.warn(`[WebhookSync] Lỗi bắn dữ liệu sang Webhook: ${err.message}`);
      return { success: false, message: err.message };
    }
  }

  /**
   * Kích hoạt đồng bộ sang Google Sheets bất đồng bộ Non-blocking (Fire-and-Forget)
   * Đảm bảo KHÔNG làm trễ thời gian phản hồi API nộp bài của đáp viên.
   * 
   * @param {string} webhookUrl - URL Google Apps Script Web App
   * @param {object} responseData - Dữ liệu bài làm đã được kiểm duyệt VALIDATED
   * @returns {Promise<{success: boolean, status?: number, message?: string}>}
   */
  dispatchGoogleSheetsSync(webhookUrl, responseData) {
    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.trim()) {
      return Promise.resolve({ success: false, message: 'Không có Webhook URL' });
    }

    const payload = this.formatPayload(responseData);

    // Kích hoạt qua setImmediate để tách biệt hoàn toàn khỏi luồng xử lý HTTP request hiện tại
    const promise = new Promise((resolve) => {
      setImmediate(async () => {
        try {
          const result = await this.sendPayload(webhookUrl, payload);
          resolve(result);
        } catch (err) {
          console.warn('[WebhookSync] Lỗi ngoại lệ trong dispatch:', err.message);
          resolve({ success: false, message: err.message });
        }
      });
    });

    return promise;
  }
}

module.exports = new WebhookService();
