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

    // IPv4 check
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = cleanHost.match(ipv4Regex);
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
      
      // Node.js 18+ native fetch với timeout 10s và theo dõi redirect (Google Apps Script trả về 302 redirect)
      const response = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SurvHub-Webhook-Engine/1.0'
        },
        body: postBody,
        redirect: 'follow',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.warn(`[WebhookSync] Webhook nhận HTTP ${response.status} từ ${webhookUrl}`);
        return { success: false, status: response.status, message: `HTTP ${response.status}` };
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
