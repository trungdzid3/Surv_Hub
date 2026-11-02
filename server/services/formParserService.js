const url = require('url');
const net = require('net');
const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

class FormParserService {
  constructor() {
    // Whitelist các tên miền biểu mẫu an toàn chính chủ chống SSRF
    this.ALLOWED_FORM_DOMAINS = [
      'docs.google.com',
      'forms.gle',
      'forms.google.com',
      'drive.google.com',
      'forms.office.com',
      'forms.cloud.microsoft',
      'form.cloud.microsoft'
    ];

    // Bộ nhớ đệm xác thực Google Service Account & OAuth Token
    this._serviceAccountCache = null;
    this._accessTokenCache = null;
    this._accessTokenExpiry = 0;
  }

  /**
   * Helper kiểm tra xem một IP có thuộc dải mạng nội bộ / link-local / loopback / cloud metadata không
   */
  isPrivateOrInternalIp(ip) {
    if (!ip || typeof ip !== 'string') return false;

    // Chuẩn hóa IPv4-mapped IPv6 (ví dụ: ::ffff:127.0.0.1)
    let cleanIp = ip.trim();
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.substring(7);
    }

    // Nếu không phải là địa chỉ IP dạng số (nghĩa là tên miền như docs.google.com) -> Trả về false
    if (!net.isIP(cleanIp)) {
      return false;
    }

    // Kiểm tra IPv4
    if (net.isIPv4(cleanIp)) {
      const parts = cleanIp.split('.').map(p => parseInt(p, 10));
      if (parts.length !== 4 || parts.some(isNaN)) return true;

      const [b0, b1] = parts;

      // 0.0.0.0/8 (Mạng hiện tại / Unspecified)
      if (b0 === 0) return true;

      // 127.0.0.0/8 (Loopback: 127.0.0.1 - 127.255.255.255)
      if (b0 === 127) return true;

      // 10.0.0.0/8 (Dải mạng nội bộ Class A: 10.x.x.x)
      if (b0 === 10) return true;

      // 172.16.0.0/12 (Dải mạng nội bộ Class B: 172.16.x.x - 172.31.x.x)
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

      // 192.168.0.0/16 (Dải mạng nội bộ Class C: 192.168.x.x)
      if (b0 === 192 && b1 === 168) return true;

      // 169.254.0.0/16 (Link-Local & Cloud Metadata Service AWS/GCP/Azure 169.254.169.254)
      if (b0 === 169 && b1 === 254) return true;

      // 100.64.0.0/10 (Carrier-Grade NAT)
      if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

      // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
      if (b0 >= 224) return true;

      // Broadcast
      if (cleanIp === '255.255.255.255') return true;

      return false;
    }

    // Kiểm tra IPv6
    if (net.isIPv6(cleanIp)) {
      const lower = cleanIp.toLowerCase();
      // ::1 (Loopback), :: (Unspecified)
      if (lower === '::1' || lower === '::') return true;
      // fe80::/10 (Link-Local)
      if (/^fe[89ab][0-9a-f]:/i.test(lower)) return true;
      // fc00::/7 (Unique Local Address: fc00:: - fdff::)
      if (/^f[cd][0-9a-f]{2}:/i.test(lower)) return true;
      return false;
    }

    return false;
  }

  /**
   * 1. Kiểm tra an toàn URL chống SSRF (Đồng bộ)
   * Chặn triệt để IP nội bộ (127.0.0.1, localhost, 10.x, 192.168.x, 169.254.x)
   * Chỉ cho phép Whitelist domain chính chủ: docs.google.com, forms.gle, forms.office.com, forms.cloud.microsoft
   */
  validateFormUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new Error('Vui lòng cung cấp đường dẫn URL biểu mẫu hợp lệ');
    }

    let parsed;
    try {
      parsed = new URL(rawUrl.trim());
    } catch (e) {
      throw new Error('Định dạng URL không hợp lệ');
    }

    // 1. Chỉ cho phép giao thức HTTPS và HTTP chuẩn
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Giao thức URL không an toàn (chỉ hỗ trợ https/http)');
    }

    // 2. Chặn các cổng bất thường (chỉ cho phép cổng mặc định 443 và 80)
    if (parsed.port && parsed.port !== '443' && parsed.port !== '80') {
      throw new Error(`Cổng "${parsed.port}" không được phép vì lý do an toàn mạng`);
    }

    const hostname = parsed.hostname.toLowerCase();

    // 3. Chặn triệt để hostname cục bộ / private network / link-local / cloud metadata
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.lan') ||
      hostname === '0.0.0.0' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      this.isPrivateOrInternalIp(hostname)
    ) {
      throw new Error('Truy cập địa chỉ nội bộ bị từ chối');
    }

    // 4. Kiểm tra Whitelist domain chính chủ nghiêm ngặt (Strict Whitelist Check)
    const isAllowed = this.ALLOWED_FORM_DOMAINS.includes(hostname);

    if (!isAllowed) {
      throw new Error(`Tên miền "${hostname}" không được hỗ trợ. Hệ thống chỉ hỗ trợ Google Forms (docs.google.com, forms.gle) và Microsoft Forms (forms.office.com, forms.cloud.microsoft, form.cloud.microsoft).`);
    }

    return {
      isValid: true,
      url: parsed.href,
      hostname,
      isGoogle: hostname === 'docs.google.com' || hostname === 'forms.gle' || hostname === 'forms.google.com' || hostname === 'drive.google.com',
      isMicrosoft: hostname === 'forms.office.com' || hostname === 'forms.cloud.microsoft' || hostname === 'form.cloud.microsoft'
    };
  }

  /**
   * 1b. Kiểm tra bất đồng bộ URL chống SSRF qua DNS Rebinding
   * Phân giải IP thực tế của hostname trước khi thực hiện kết nối HTTP
   */
  async validateFormUrlAsync(rawUrl) {
    const valid = this.validateFormUrl(rawUrl);

    // Kiểm tra DNS Rebinding: Phân giải tên miền và đối chiếu dải IP thực tế
    try {
      const addresses = await dns.lookup(valid.hostname, { all: true });
      for (const entry of addresses) {
        if (this.isPrivateOrInternalIp(entry.address)) {
          throw new Error(`Tên miền "${valid.hostname}" phân giải về địa chỉ IP nội bộ (${entry.address}). Truy cập bị từ chối chống SSRF.`);
        }
      }
    } catch (dnsErr) {
      if (dnsErr.message.includes('SSRF') || dnsErr.message.includes('nội bộ')) {
        throw dnsErr;
      }
      throw new Error(`Không thể phân giải địa chỉ máy chủ "${valid.hostname}": ${dnsErr.message}`);
    }

    return valid;
  }

  /**
   * 2. Bóc tách Google Forms từ HTML public (FB_PUBLIC_LOAD_DATA_)
   * Ánh xạ chuẩn 12 dạng câu hỏi theo mã item[3]:
   *  0 -> SHORT_TEXT
   *  1 -> PARAGRAPH
   *  2 -> SINGLE_CHOICE (đọc options từ item[4][0][1])
   *  3 -> DROPDOWN (đọc options từ item[4][0][1])
   *  4 -> MULTIPLE_CHOICE (đọc options từ item[4][0][1])
   *  5 -> LINEAR_SCALE (đọc thang từ item[4][0][1], nhãn từ item[4][0][3])
   *  7 -> LƯỚI MA TRẬN: rows từ item[4].map(r => r[3][0]), columns từ item[4][0][1].map(c => c[0])
   *       loại checkbox (item[4][0][11] === 1) -> CHECKBOX_GRID, ngược lại -> CHOICE_GRID
   *       cờ bắt buộc: item[4][0][2] === 1 -> is_required = 1
   *  9 -> DATE_INPUT
   * 10 -> TIME_INPUT
   * 13 -> FILE_UPLOAD
   * 18 -> RATING_STARS
   * Cờ bắt buộc is_required câu thường: item[4][0][2] === 1 -> is_required = 1, ngược lại 0.
   */
  parseGoogleFormsHtml(html, originalUrl) {
    let title = 'Khảo sát Google Form';
    let description = '';
    const questions = [];

    // Tìm thẻ title
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) || 
                       html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/ - Google (Forms|Biểu mẫu)$/i, '').trim();
    }

    const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i);
    if (descMatch && descMatch[1]) {
      description = descMatch[1].trim();
    }

    // Trích xuất biến dữ liệu cốt lõi FB_PUBLIC_LOAD_DATA_
    const dataMatch = html.match(/var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/);
    if (dataMatch && dataMatch[1]) {
      try {
        const formData = JSON.parse(dataMatch[1]);
        if (formData && Array.isArray(formData[1])) {
          if (formData[1][8]) title = formData[1][8];
          if (formData[1][0]) description = formData[1][0];

          const items = formData[1][1] || [];
          let qIndex = 1;

          for (const item of items) {
            if (!item || !Array.isArray(item)) continue;
            const qTitle = item[1] || (item[3] === 8 ? 'Mục không có tiêu đề' : '');
            const qDesc = item[2] ? String(item[2]).trim() : '';
            const qTypeNum = item[3];
            const qSubArray = item[4];
            const qData = qSubArray && qSubArray[0];

            if (!qTitle && qTypeNum !== 8 && qTypeNum !== 6) continue;

            let questionType = 'SINGLE_CHOICE';
            let options = null;
            let rows = null;
            let columns = null;
            let logic = null;
            let isRequired = 0;
            let minLabel = null;
            let maxLabel = null;
            let videoUrl = null;
            let imageUrl = null;

            // Trích xuất cờ bắt buộc is_required từ item[4][0][2] === 1
            if (qData && qData[2] === 1) {
              isRequired = 1;
            }

            switch (qTypeNum) {
              case 0: // SHORT_TEXT
                questionType = 'SHORT_TEXT';
                options = null;
                break;

              case 1: // PARAGRAPH
                questionType = 'PARAGRAPH';
                options = null;
                break;

              case 2: // SINGLE_CHOICE
              case 3: { // DROPDOWN
                questionType = qTypeNum === 2 ? 'SINGLE_CHOICE' : 'DROPDOWN';
                let rawOpts = null;
                if (qData && Array.isArray(qData[1])) {
                  rawOpts = qData[1];
                } else if (qData && Array.isArray(qData[0]) && Array.isArray(qData[0][1])) {
                  rawOpts = qData[0][1];
                } else if (Array.isArray(qSubArray)) {
                  for (const sub of qSubArray) {
                    if (sub && Array.isArray(sub[1])) {
                      rawOpts = sub[1];
                      break;
                    }
                  }
                }

                if (Array.isArray(rawOpts)) {
                  const logicOptions = {};
                  let hasLogic = false;

                  options = rawOpts.map(opt => {
                    const optVal = Array.isArray(opt) ? String(opt[0] || '').trim() : String(opt || '').trim();
                    if (Array.isArray(opt)) {
                      // Trích xuất điều hướng: opt[2] (action) hoặc opt[3]/opt[4] (target)
                      const rawAction = opt[2];
                      let rawTarget = (opt[3] !== undefined && opt[3] !== null && opt[3] !== '') ? opt[3] : (opt[4] !== undefined && opt[4] !== null && opt[4] !== '' ? opt[4] : null);

                      if (!rawTarget) {
                        for (let i = 2; i < opt.length; i++) {
                          const el = opt[i];
                          if ((typeof el === 'number' && el > 1000) || (typeof el === 'string' && el.length >= 4 && !/^(true|false)$/i.test(el))) {
                            rawTarget = el;
                            break;
                          }
                        }
                      }

                      if (rawAction !== undefined && rawAction !== null && rawAction !== '' && rawAction !== 0) {
                        let actionStr = rawAction;
                        if (rawAction === 1 || rawAction === '1') actionStr = 'NEXT_PAGE';
                        else if (rawAction === 2 || rawAction === '2') actionStr = 'GO_TO_PAGE';
                        else if (rawAction === 3 || rawAction === '3') actionStr = 'SUBMIT_FORM';
                        else if (rawAction === 4 || rawAction === '4') actionStr = 'RESTART_FORM';

                        hasLogic = true;
                        logicOptions[optVal] = {
                          action: actionStr,
                          target: (actionStr === 'SUBMIT_FORM' || actionStr === 'NEXT_PAGE' || actionStr === 'RESTART_FORM') ? null : (rawTarget ? String(rawTarget) : null)
                        };
                      } else if (rawTarget !== null && rawTarget !== undefined && rawTarget !== '') {
                        hasLogic = true;
                        logicOptions[optVal] = {
                          action: 'GO_TO_PAGE',
                          target: String(rawTarget)
                        };
                      }
                    }
                    return optVal;
                  }).filter(Boolean);

                  if (hasLogic) {
                    logic = {
                      enabled: true,
                      options: logicOptions
                    };
                  }
                }
                break;
              }

              case 4: // MULTIPLE_CHOICE
                questionType = 'MULTIPLE_CHOICE';
                if (qData && Array.isArray(qData[1])) {
                  options = qData[1].map(opt => String(opt[0] || '').trim()).filter(Boolean);
                }
                break;

              case 5: { // LINEAR_SCALE (Phạm vi tuyến tính)
                questionType = 'LINEAR_SCALE';
                
                // 1. Trích xuất nhãn hai đầu từ qData[3] (Vị trí chuẩn trong Google Forms)
                if (qData && Array.isArray(qData[3])) {
                  if (qData[3][0] !== undefined && qData[3][0] !== null && String(qData[3][0]).trim() !== '') {
                    minLabel = String(qData[3][0]).trim();
                  }
                  if (qData[3][1] !== undefined && qData[3][1] !== null && String(qData[3][1]).trim() !== '') {
                    maxLabel = String(qData[3][1]).trim();
                  }
                }

                // 2. Quét dự phòng trong toàn bộ mảng qData nếu chưa tìm thấy nhãn
                if ((!minLabel || !maxLabel) && qData && Array.isArray(qData)) {
                  for (let i = 1; i < qData.length; i++) {
                    const el = qData[i];
                    if (Array.isArray(el) && el.length >= 2) {
                      const str0 = String(el[0] || '').trim();
                      const str1 = String(el[1] || '').trim();
                      if (str0 && str1 && !/^\d+$/.test(str0) && !/^\d+$/.test(str1)) {
                        if (!minLabel) minLabel = str0;
                        if (!maxLabel) maxLabel = str1;
                        break;
                      }
                    }
                  }
                }

                // 3. Quét trong mảng qSubArray
                if ((!minLabel || !maxLabel) && Array.isArray(qSubArray)) {
                  for (const sub of qSubArray) {
                    if (Array.isArray(sub) && Array.isArray(sub[3])) {
                      if (!minLabel && sub[3][0]) minLabel = String(sub[3][0]).trim();
                      if (!maxLabel && sub[3][1]) maxLabel = String(sub[3][1]).trim();
                    }
                  }
                }

                // 4. Trích xuất thang điểm (1 đến 5 hoặc 0 đến 10)
                if (qData && Array.isArray(qData[1]) && qData[1].length > 0) {
                  options = qData[1].map(opt => Array.isArray(opt) ? String(opt[0] || '').trim() : String(opt || '').trim()).filter(Boolean);
                } else if (qData && Array.isArray(qData[4]) && qData[4].length === 2 && typeof qData[4][0] === 'number') {
                  const start = qData[4][0];
                  const end = qData[4][1];
                  options = [];
                  for (let n = start; n <= end; n++) options.push(String(n));
                }

                if (!options || options.length === 0) {
                  options = ['1', '2', '3', '4', '5'];
                }
                break;
              }

              case 7: { // LƯỚI MA TRẬN: CHOICE_GRID hoặc CHECKBOX_GRID
                if (Array.isArray(qSubArray)) {
                  // rows từ item[4].map(r => r[3][0])
                  rows = qSubArray.map(r => {
                    if (r && Array.isArray(r[3]) && r[3][0]) return String(r[3][0]).trim();
                    if (r && r[1]) return String(r[1]).trim();
                    return '';
                  }).filter(Boolean);

                  // columns từ item[4][0][1].map(c => c[0])
                  if (qSubArray[0] && Array.isArray(qSubArray[0][1])) {
                    columns = qSubArray[0][1].map(c => {
                      if (Array.isArray(c)) return String(c[0] || '').trim();
                      return String(c || '').trim();
                    }).filter(Boolean);
                  }

                  // Cờ bắt buộc mỗi hàng đọc từ item[4][0][2] === 1
                  if (qSubArray[0] && qSubArray[0][2] === 1) {
                    isRequired = 1;
                  } else if (qSubArray.some(r => r && r[2] === 1)) {
                    isRequired = 1;
                  }

                  // Checkbox grid nếu item[4][0][11] === 1
                  const isCheckbox = qSubArray[0] && (qSubArray[0][11] === 1 || qSubArray[0][11] === true);
                  questionType = isCheckbox ? 'CHECKBOX_GRID' : 'CHOICE_GRID';
                  options = columns;
                } else {
                  questionType = 'CHOICE_GRID';
                }
                break;
              }

              case 9: // DATE_INPUT
                questionType = 'DATE_INPUT';
                options = null;
                break;

              case 10: // TIME_INPUT
                questionType = 'TIME_INPUT';
                options = null;
                break;

              case 13: // FILE_UPLOAD
                questionType = 'FILE_UPLOAD';
                options = null;
                break;

              case 6: // TITLE & DESCRIPTION BLOCK (Tt)
                questionType = 'TEXT_BLOCK';
                options = null;
                break;

              case 8: { // SECTION HEADER (== Thêm Phần)
                questionType = 'SECTION_HEADER';
                options = null;
                // Trích xuất điều hướng mặc định của phân đoạn nếu có
                try {
                  let defaultAction = null;
                  let targetSection = null;

                  const flat = [];
                  const walk = (x) => {
                    if (Array.isArray(x)) {
                      for (const itm of x) walk(itm);
                    } else if (x !== null && x !== undefined) {
                      flat.push(x);
                    }
                  };
                  walk([qData, item[4], item[5]]);

                  for (const val of flat) {
                    if (val === 1 || val === '1') {
                      if (!defaultAction) defaultAction = 'NEXT_PAGE';
                    } else if (val === 2 || val === '2') {
                      if (!defaultAction) defaultAction = 'GO_TO_PAGE';
                    } else if (val === 3 || val === '3') {
                      defaultAction = 'SUBMIT_FORM';
                    } else if (val === 4 || val === '4') {
                      defaultAction = 'RESTART_FORM';
                    } else if ((typeof val === 'number' && val > 1000) || (typeof val === 'string' && val.length >= 4 && !/^(true|false)$/i.test(val))) {
                      if (!targetSection) targetSection = String(val);
                    }
                  }

                  if (defaultAction || targetSection) {
                    logic = {
                      default_action: defaultAction || (targetSection ? 'GO_TO_PAGE' : 'NEXT_PAGE'),
                      target: targetSection
                    };
                  }
                } catch (e) {}
                break;
              }

              case 11: // IMAGE BLOCK
                questionType = 'IMAGE_BLOCK';
                options = null;
                break;

              case 12: { // VIDEO BLOCK (YouTube)
                questionType = 'VIDEO_BLOCK';
                options = null;
                // Trích xuất YouTube video id / url nếu có trong payload
                try {
                  const videoPayload = JSON.stringify(item);
                  const ytMatch = videoPayload.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
                  if (ytMatch && ytMatch[1]) {
                    videoUrl = `https://www.youtube.com/watch?v=${ytMatch[1]}`;
                  }
                } catch(e) {}
                break;
              }

              case 18: // RATING_STARS
                questionType = 'RATING_STARS';
                options = ['1', '2', '3', '4', '5'];
                break;

              default:
                // Fallback nếu có options thì trắc nghiệm, ngược lại trả lời ngắn
                if (qData && Array.isArray(qData[1]) && qData[1].length > 0) {
                  questionType = 'SINGLE_CHOICE';
                  options = qData[1].map(opt => String(opt[0] || '').trim()).filter(Boolean);
                } else {
                  questionType = 'SHORT_TEXT';
                  options = null;
                }
                break;
            }

            const qObj = {
              order_index: qIndex++,
              type: questionType,
              content: (qTitle || (questionType === 'SECTION_HEADER' ? 'Mục' : '')).trim(),
              is_required: isRequired,
              options: options && options.length > 0 ? options : null
            };

            if (item[0] !== undefined && item[0] !== null) {
              qObj.origin_id = String(item[0]);
            }
            qObj.id = `q_${qObj.origin_id || qObj.order_index}`;

            if (qDesc) qObj.description = qDesc;
            if (logic) qObj.logic = logic;
            if (minLabel) qObj.min_label = minLabel;
            if (maxLabel) qObj.max_label = maxLabel;
            if (videoUrl) qObj.video_url = videoUrl;
            if (imageUrl) qObj.image_url = imageUrl;
            if (rows && rows.length > 0) qObj.rows = rows;
            if (columns && columns.length > 0) qObj.columns = columns;

            // Trích xuất validation cho câu hỏi Text / Paragraph từ Google Forms
            if (questionType === 'SHORT_TEXT' || questionType === 'PARAGRAPH') {
              const rawValidationArray = (qData && Array.isArray(qData[4])) ? qData[4] : null;
              const validation = this._extractValidationRule({
                title: qTitle,
                description: qDesc,
                subtitle: qDesc,
                rawValidationArray
              });
              if (validation) {
                qObj.validation = validation;
                qObj.logic = qObj.logic || {};
                qObj.logic.validation = validation;
              }
            }

            questions.push(qObj);
          }
        }
      } catch (err) {
        console.warn('[FormParserService] Không thể parse FB_PUBLIC_LOAD_DATA_ JSON:', err.message);
      }
    }

    // Ánh xạ Branching Logic đích đến đúng order_index của Section Header / Câu hỏi
    if (questions.length > 0) {
      this._resolveAndMapBranchingTargets(questions);
    }

    // Tạo link embed an toàn
    let embedUrl = originalUrl;
    if (embedUrl.includes('/viewform')) {
      embedUrl = embedUrl.replace('/viewform', '/viewform?embedded=true');
    } else if (!embedUrl.includes('embedded=true')) {
      embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'embedded=true';
    }

    return {
      source: 'GOOGLE_FORM',
      title,
      description,
      originalUrl,
      embedUrl,
      questions,
      questionCount: questions.length
    };
  }

  /**
   * 2b. Kiểm tra xem hệ thống đã được cấu hình Google Service Account hay chưa
   */
  hasServiceAccountConfigured() {
    return !!this.getServiceAccountCredentials();
  }

  /**
   * Lấy thông tin xác thực Google Service Account từ tệp JSON hoặc biến môi trường
   */
  getServiceAccountCredentials() {
    if (this._serviceAccountCache) {
      return this._serviceAccountCache;
    }

    try {
      // 1. Kiểm tra biến môi trường JSON trực tiếp (dành cho Render / Cloud Host)
      if (config.GOOGLE && config.GOOGLE.SERVICE_ACCOUNT_JSON && config.GOOGLE.SERVICE_ACCOUNT_JSON.trim()) {
        const parsed = JSON.parse(config.GOOGLE.SERVICE_ACCOUNT_JSON.trim());
        if (parsed.client_email && parsed.private_key) {
          this._serviceAccountCache = parsed;
          return parsed;
        }
      }

      // 2. Kiểm tra đường dẫn tệp cấu hình trên ổ đĩa
      const possiblePaths = [
        config.GOOGLE && config.GOOGLE.SERVICE_ACCOUNT_KEY_PATH,
        path.join(__dirname, '../config/google-service-account.json'),
        path.join(process.cwd(), 'google-service-account.json'),
        path.join(process.cwd(), 'server/config/google-service-account.json')
      ].filter(Boolean);

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed.client_email && parsed.private_key) {
            this._serviceAccountCache = parsed;
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('[FormParserService] Lỗi đọc tệp Google Service Account:', err.message);
    }

    return null;
  }

  /**
   * Lấy địa chỉ email của Google Service Account (để hiển thị cho người dùng thêm làm cộng tác viên)
   */
  getServiceAccountEmail() {
    const creds = this.getServiceAccountCredentials();
    if (creds && creds.client_email) {
      return creds.client_email;
    }
    return (config.GOOGLE && config.GOOGLE.SERVICE_ACCOUNT_EMAIL) ? config.GOOGLE.SERVICE_ACCOUNT_EMAIL : null;
  }

  /**
   * Tạo Access Token OAuth 2.0 từ Service Account bằng RS256 JWT (Thư viện Node.js thuần, 0 dependency)
   */
  async getGoogleServiceAccountAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    // Nếu token còn hạn ít nhất 60 giây thì dùng lại bộ nhớ đệm
    if (this._accessTokenCache && this._accessTokenExpiry > (now + 60)) {
      return this._accessTokenCache;
    }

    const creds = this.getServiceAccountCredentials();
    if (!creds || !creds.client_email || !creds.private_key) {
      throw new Error('Chưa cấu hình Google Service Account. Vui lòng thêm tệp google-service-account.json hoặc biến môi trường GOOGLE_SERVICE_ACCOUNT_JSON.');
    }

    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const payload = {
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/drive.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const base64UrlEncode = (str) => {
      return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    signer.end();
    const signature = signer.sign(creds.private_key);
    const encodedSignature = signature
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const jwt = `${signatureInput}.${encodedSignature}`;

    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(jwt)}`
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Không thể xác thực Google Service Account (${resp.status}): ${errText}`);
    }

    const tokenData = await resp.json();
    if (!tokenData.access_token) {
      throw new Error('Google OAuth không trả về access_token hợp lệ');
    }

    this._accessTokenCache = tokenData.access_token;
    this._accessTokenExpiry = now + (tokenData.expires_in || 3600);
    return tokenData.access_token;
  }

  /**
   * Trích xuất Form ID từ đường dẫn Google Forms (hỗ trợ cả dạng /d/ID, /d/e/ID/viewform hoặc link chỉnh sửa /edit)
   */
  extractGoogleFormId(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();

    // 1. Dạng /forms/d/e/<ID>/viewform
    const matchPub = trimmed.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]+)/i);
    if (matchPub && matchPub[1]) {
      return { formId: matchPub[1], isPublished: true };
    }

    // 2. Dạng /forms/d/<ID>/edit hoặc /forms/d/<ID>/viewform
    const matchDoc = trimmed.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/i);
    if (matchDoc && matchDoc[1] && matchDoc[1] !== 'e') {
      return { formId: matchDoc[1], isPublished: false };
    }

    // 3. Chuỗi thuần form ID
    if (/^[a-zA-Z0-9_-]{20,80}$/.test(trimmed)) {
      return { formId: trimmed, isPublished: false };
    }

    return null;
  }

  /**
   * Bóc tách dữ liệu JSON từ Google Forms API v1 sang cấu trúc chuẩn 12 câu hỏi của SurvHub
   */
  parseGoogleFormsApiResponse(apiData, originalUrl) {
    if (!apiData) {
      throw new Error('Dữ liệu phản hồi từ Google Forms API không hợp lệ');
    }

    const title = (apiData.info && apiData.info.title) ? apiData.info.title.trim() : 'Khảo sát Google Forms';
    const description = (apiData.info && apiData.info.description) ? apiData.info.description.trim() : '';
    const questions = [];
    const items = apiData.items || [];
    let qIndex = 1;

    for (const item of items) {
      if (!item) continue;
      const itemTitle = (item.title || '').trim();
      const itemDesc = (item.description || '').trim();

      // 1. Câu hỏi đơn (questionItem)
      if (item.questionItem && item.questionItem.question) {
        const q = item.questionItem.question;
        const isRequired = q.required ? 1 : 0;
        let questionType = 'SINGLE_CHOICE';
        let options = null;
        let minLabel = null;
        let maxLabel = null;
        let imageUrl = null;

        if (item.questionItem.image && item.questionItem.image.sourceUri) {
          imageUrl = item.questionItem.image.sourceUri;
        }

        // Choice Question (Radio, Checkbox, Dropdown)
        let logic = null;
        if (q.choiceQuestion) {
          const cType = q.choiceQuestion.type;
          if (cType === 'CHECKBOX') {
            questionType = 'MULTIPLE_CHOICE';
          } else if (cType === 'DROP_DOWN') {
            questionType = 'DROPDOWN';
          } else {
            questionType = 'SINGLE_CHOICE';
          }

          if (Array.isArray(q.choiceQuestion.options)) {
            const logicOptions = {};
            let hasLogic = false;

            options = q.choiceQuestion.options.map(opt => {
              const optVal = opt.isOther ? 'Khác...' : (opt.value || '').trim();
              const goToAction = opt.goToAction || null;
              const goToSectionId = opt.goToSectionId || null;
              if (goToAction || goToSectionId) {
                hasLogic = true;
                logicOptions[optVal] = {
                  action: goToAction,
                  target: goToSectionId
                };
              }
              return optVal;
            }).filter(Boolean);

            if (hasLogic) {
              logic = {
                enabled: true,
                options: logicOptions
              };
            }
          }
        }
        // Text Question (Short Text hoặc Paragraph)
        else if (q.textQuestion) {
          questionType = q.textQuestion.paragraph ? 'PARAGRAPH' : 'SHORT_TEXT';
          options = null;
        }
        // Scale Question (Linear Scale)
        else if (q.scaleQuestion) {
          questionType = 'LINEAR_SCALE';
          const low = q.scaleQuestion.low !== undefined ? q.scaleQuestion.low : 1;
          const high = q.scaleQuestion.high !== undefined ? q.scaleQuestion.high : 5;
          minLabel = q.scaleQuestion.lowLabel || null;
          maxLabel = q.scaleQuestion.highLabel || null;
          options = [];
          for (let n = low; n <= high; n++) {
            options.push(String(n));
          }
        }
        // Date Question
        else if (q.dateQuestion) {
          questionType = 'DATE_INPUT';
          options = null;
        }
        // Time Question
        else if (q.timeQuestion) {
          questionType = 'TIME_INPUT';
          options = null;
        }
        // Rating Question
        else if (q.ratingQuestion) {
          questionType = 'RATING_STARS';
          const scale = q.ratingQuestion.ratingScaleLevel || 5;
          options = [];
          for (let n = 1; n <= scale; n++) {
            options.push(String(n));
          }
        }
        // File Upload Question
        else if (q.fileUploadQuestion) {
          questionType = 'FILE_UPLOAD';
          options = null;
        }

        const qObj = {
          order_index: qIndex++,
          type: questionType,
          content: itemTitle || `Câu hỏi ${qIndex - 1}`,
          is_required: isRequired,
          options: (options && options.length > 0) ? options : null
        };
        if (item.itemId) qObj.origin_id = String(item.itemId);

        if (itemDesc) qObj.description = itemDesc;
        if (logic) qObj.logic = logic;
        if (minLabel) qObj.min_label = minLabel;
        if (maxLabel) qObj.max_label = maxLabel;
        if (imageUrl) qObj.image_url = imageUrl;

        // Trích xuất validation cho câu hỏi Text / Paragraph từ Google Forms API
        if (questionType === 'SHORT_TEXT' || questionType === 'PARAGRAPH') {
          const validation = this._extractValidationRule({
            title: itemTitle,
            description: itemDesc,
            subtitle: itemDesc
          });
          if (validation) {
            qObj.validation = validation;
            qObj.logic = qObj.logic || {};
            qObj.logic.validation = validation;
          }
        }

        questions.push(qObj);
      }
      // 2. Nhóm câu hỏi ma trận Lưới (questionGroupItem)
      else if (item.questionGroupItem) {
        const qGroup = item.questionGroupItem;
        const grid = qGroup.grid || {};
        const isCheckbox = grid.columns && grid.columns.type === 'CHECKBOX';
        const questionType = isCheckbox ? 'CHECKBOX_GRID' : 'CHOICE_GRID';

        let columns = [];
        if (grid.columns && Array.isArray(grid.columns.options)) {
          columns = grid.columns.options.map(c => (c.value || '').trim()).filter(Boolean);
        }

        let rows = [];
        let isRequired = 0;
        if (Array.isArray(qGroup.questions)) {
          rows = qGroup.questions.map(subQ => {
            if (subQ.required) isRequired = 1;
            return (subQ.rowQuestion && subQ.rowQuestion.title) ? subQ.rowQuestion.title.trim() : '';
          }).filter(Boolean);
        }

        const qObj = {
          order_index: qIndex++,
          type: questionType,
          content: itemTitle || `Bảng câu hỏi lưới ${qIndex - 1}`,
          is_required: isRequired,
          options: columns.length > 0 ? columns : null,
          columns: columns.length > 0 ? columns : null,
          rows: rows.length > 0 ? rows : null
        };
        if (item.itemId) qObj.origin_id = String(item.itemId);

        if (itemDesc) qObj.description = itemDesc;
        questions.push(qObj);
      }
      // 3. Phân đoạn trang / Tiêu đề mục chuyển tiếp (pageBreakItem)
      else if (item.pageBreakItem) {
        const pb = item.pageBreakItem;
        const goToAction = pb.goToAction || item.goToAction || null;
        const goToSectionId = pb.goToSectionId || item.goToSectionId || null;

        let logic = null;
        if (goToAction || goToSectionId) {
          let actStr = goToAction;
          if (goToAction === 'SUBMIT_FORM') actStr = 'SUBMIT_FORM';
          else if (goToAction === 'NEXT_SECTION') actStr = 'NEXT_PAGE';
          else if (goToAction === 'RESTART_FORM') actStr = 'RESTART_FORM';
          else if (goToSectionId || goToAction === 'GO_TO_PAGE') actStr = 'GO_TO_PAGE';

          logic = {
            default_action: actStr || 'GO_TO_PAGE',
            target: goToSectionId ? String(goToSectionId) : null
          };
        }

        const qObj = {
          order_index: qIndex++,
          type: 'SECTION_HEADER',
          content: itemTitle || `Mục ${qIndex - 1}`,
          is_required: 0,
          options: null
        };
        if (item.itemId) qObj.origin_id = String(item.itemId);

        if (itemDesc) qObj.description = itemDesc;
        if (logic) qObj.logic = logic;

        questions.push(qObj);
      }
      // 4. Khối văn bản / Tiêu đề phụ (textItem)
      else if (item.textItem) {
        const qObj = {
          order_index: qIndex++,
          type: 'TEXT_BLOCK',
          content: itemTitle || `Nội dung ${qIndex - 1}`,
          is_required: 0,
          options: null
        };
        if (item.itemId) qObj.origin_id = String(item.itemId);

        if (itemDesc) qObj.description = itemDesc;
        questions.push(qObj);
      }
    }

    // Ánh xạ Branching Logic đích đến đúng order_index của Section Header / Câu hỏi
    if (questions.length > 0) {
      this._resolveAndMapBranchingTargets(questions);
    }

    // Embed URL
    let embedUrl = originalUrl || `https://docs.google.com/forms/d/${apiData.formId}/viewform`;
    if (embedUrl.includes('/viewform')) {
      embedUrl = embedUrl.replace('/viewform', '/viewform?embedded=true');
    } else if (!embedUrl.includes('embedded=true')) {
      embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'embedded=true';
    }

    return {
      source: 'GOOGLE_FORMS_API',
      title,
      description,
      originalUrl,
      embedUrl,
      questions,
      questionCount: questions.length
    };
  }

  /**
   * Gọi Google Forms API v1 để lấy cấu trúc biểu mẫu bằng Google Service Account hoặc User OAuth Access Token
   */
  async fetchFromGoogleFormsApi(formId, originalUrl, userAccessToken = null) {
    if (!formId) {
      throw new Error('Mã biểu mẫu Google Forms (Form ID) không hợp lệ');
    }

    const token = userAccessToken || (await this.getGoogleServiceAccountAccessToken());
    const apiUrl = `https://forms.googleapis.com/v1/forms/${encodeURIComponent(formId)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let resp;
    try {
      resp = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Thời gian kết nối Google Forms API vượt quá 10 giây');
      }
      throw new Error(`Lỗi kết nối Google Forms API: ${err.message}`);
    }
    clearTimeout(timeoutId);

    if (!resp.ok) {
      if (userAccessToken && (resp.status === 401 || resp.status === 403)) {
        const authErr = new Error('Tài khoản Google của bạn chưa được cấp quyền xem biểu mẫu này hoặc phiên làm việc đã hết hạn. Vui lòng kết nối lại tài khoản Google.');
        authErr.status = 401;
        authErr.statusCode = 401;
        authErr.code = 'USER_OAUTH_UNAUTHORIZED';
        throw authErr;
      }

      const saEmail = this.getServiceAccountEmail() || 'Service Account';
      if (resp.status === 403 || resp.status === 404) {
        const authErr = new Error(`Biểu mẫu Google Forms chưa được cấp quyền cho Service Account (${saEmail}). Vui lòng mở Google Forms > bấm biểu tượng Thêm cộng tác viên (Add collaborators) > Thêm email "${saEmail}" với quyền Biên tập viên (Editor), hoặc kết nối trực tiếp tài khoản Google của bạn.`);
        authErr.status = 401;
        authErr.statusCode = 401;
        authErr.serviceAccountEmail = saEmail;
        authErr.code = 'SERVICE_ACCOUNT_PERMISSION_DENIED';
        throw authErr;
      }

      const errText = await resp.text();
      throw new Error(`Google Forms API trả về lỗi ${resp.status}: ${errText}`);
    }

    const apiData = await resp.json();
    return this.parseGoogleFormsApiResponse(apiData, originalUrl);
  }

  /**
   * Helper an toan parse JSON hoac JavaScript Object Literal
   */
  _safeParseJsonOrObject(str) {
    if (!str || typeof str !== 'string') return null;
    try {
      return JSON.parse(str);
    } catch (e1) {
      try {
        const jsonStr = str
          .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
          .replace(/:\s*'([^']*)'/g, ':"$1"')
          .replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(jsonStr);
      } catch (e2) {
        try {
          const fn = new Function(`return (${str});`);
          return fn();
        } catch (e3) {
          return null;
        }
      }
    }
  }

  /**
   * Helper trich xuat JSON hoac JS object literal theo bien bang thuat toan brace-matching
   */
  _extractJsonObject(html, varName) {
    const regex = new RegExp(`(?:var|let|const|window\\.)\\s*${varName}\\s*=\\s*`, 'i');
    const match = regex.exec(html);
    if (!match) return null;

    const startIdx = match.index + match[0].length;
    let openBraces = 0;
    let foundFirst = false;
    let jsonStart = -1;
    let inString = false;
    let stringChar = '';

    for (let i = startIdx; i < html.length; i++) {
      const ch = html[i];
      const prevCh = html[i - 1];

      if (inString) {
        if (ch === stringChar && prevCh !== '\\') {
          inString = false;
        }
        continue;
      }

      if (ch === '"' || ch === "'" || ch === '`') {
        inString = true;
        stringChar = ch;
        continue;
      }

      if (ch === '{') {
        if (!foundFirst) {
          foundFirst = true;
          jsonStart = i;
        }
        openBraces++;
      } else if (ch === '}') {
        openBraces--;
        if (foundFirst && openBraces === 0) {
          const rawStr = html.substring(jsonStart, i + 1);
          return this._safeParseJsonOrObject(rawStr);
        }
      }
    }
    return null;
  }

  /**
   * Helper trích xuất cấu trúc form JSON từ HTML Microsoft Forms
   */
  _extractMicrosoftFormData(html) {
    if (!html || typeof html !== 'string') return null;

    const candidateVars = ['runtimeForms', 'OfficeFormServerInfo', 'formContext', 'formData', 'formInfo'];
    for (const v of candidateVars) {
      const obj = this._extractJsonObject(html, v);
      if (obj) {
        if (obj.form) return obj.form;
        return obj;
      }
    }

    // Mẫu 4: <script id="__NEXT_DATA__" type="application/json">...</script>
    const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      const parsed = this._safeParseJsonOrObject(nextDataMatch[1]);
      if (parsed?.props?.pageProps?.form) return parsed.props.pageProps.form;
    }

    return null;
  }

  /**
   * Helper ánh xạ một câu hỏi Microsoft Forms
   * Choice: single -> SINGLE_CHOICE, multi -> MULTIPLE_CHOICE, dropdown -> DROPDOWN
   * TextField: multiline -> PARAGRAPH, ngược lại -> SHORT_TEXT
   * Rating: sao -> RATING_STARS, số/NPS -> LINEAR_SCALE
   * MatrixChoiceGroup / Likert -> CHOICE_GRID / CHECKBOX_GRID
   * DateTime -> DATE_INPUT, FileUpload -> FILE_UPLOAD
   * Cờ question.required === true -> is_required = 1
   */
  extractNumberRange(str) {
    if (!str) return null;
    let text = typeof str === 'string' ? str : '';
    if (!text && typeof str === 'object') {
      try {
        text = JSON.stringify(str);
      } catch (e) {
        return null;
      }
    }
    if (!text || typeof text !== 'string') return null;

    // 1. Cặp số trong mảng JSON: ["20000000", "20270000"] hoặc [20000000, 20270000]
    const jsonArrMatch = text.match(/\[\s*["']?(\d+(?:[.,]\d+)?)["']?\s*,\s*["']?(\d+(?:[.,]\d+)?)["']?\s*\]/);
    if (jsonArrMatch) {
      const n1 = parseFloat(jsonArrMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(jsonArrMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }

    // 2. Cặp số trong thuộc tính JSON: min/max, minValue/maxValue, lowerBound/upperBound, restrictionValue1/restrictionValue2, operand1/operand2, value1/value2
    const propPairs = [
      {
        min: /["']?(?:min|minValue|lowerBound|restrictionValue1|restrictionOperand1|operand1|value1|val1|firstValue)["']?\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?/i,
        max: /["']?(?:max|maxValue|upperBound|restrictionValue2|restrictionOperand2|operand2|value2|val2|secondValue)["']?\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?/i
      },
      {
        min: /["']?(?:max|maxValue|upperBound|restrictionValue2|restrictionOperand2|operand2|value2|val2|secondValue)["']?\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?/i,
        max: /["']?(?:min|minValue|lowerBound|restrictionValue1|restrictionOperand1|operand1|value1|val1|firstValue)["']?\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?/i
      }
    ];
    for (const pair of propPairs) {
      const mMin = text.match(pair.min);
      const mMax = text.match(pair.max);
      if (mMin && mMax) {
        const n1 = parseFloat(mMin[1].replace(/,/g, ''));
        const n2 = parseFloat(mMax[1].replace(/,/g, ''));
        if (!isNaN(n1) && !isNaN(n2)) {
          return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
        }
      }
    }

    // 3. Bắt trọn mẫu tiếng Việt & tự nhiên: "số phải nằm trong khoảng từ ... đến ...", "trong khoảng ... đến ...", "từ ... ~ ..."
    const vnPattern = /(?:số\s*phải\s*nằm\s*trong\s*khoảng\s*(?:từ)?|nằm\s*trong\s*khoảng\s*(?:từ)?|trong\s*khoảng\s*(?:từ)?|khoảng\s*(?:từ)?|khoang\s*(?:tu)?|giới\s*hạn\s*(?:từ)?|between|từ)\s*["']?(\d+(?:[.,]\d+)?)["']?\s*(?:đến|den|tới|toi|và|va|to|and|~|-|–|—)\s*["']?(\d+(?:[.,]\d+)?)["']?/i;
    const vnMatch = text.match(vnPattern);
    if (vnMatch) {
      const n1 = parseFloat(vnMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(vnMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }

    // 4. Dải số có ký tự nối hoặc từ nối: ~, -, \u2013, \u2014, \u2212, \uFF5E, \u223C, \u02DC, đến, den, to, và, va, and
    const normalized = text
      .replace(/[\uFF5E\u223C\u02DC]/g, '~')
      .replace(/[\u2013\u2014\u2212]/g, '-')
      .replace(/(?<=\d)\s*(?:đến|den|tới|toi|to|và|va|and)\s*(?=\d)/gi, ' ~ ')
      .replace(/(?<=\d)\s*[-~]\s*(?=\d)/g, ' ~ ');

    const match = normalized.match(/(\d+(?:[.,]\d+)?)\s*~\s*(\d+(?:[.,]\d+)?)/);
    if (match) {
      const n1 = parseFloat(match[1].replace(/,/g, ''));
      const n2 = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }

    return null;
  }

  /**
   * Helper trích xuất các quy tắc giới hạn (Validation / Restrictions)
   * Áp dụng cho cả Microsoft Forms (q.questionInfo, Subtitle, Placeholder, Restrictions) và Google Forms
   */
  _extractValidationRule({ title = '', subtitle = '', placeholder = '', description = '', questionInfoObj = null, rawRestrictions = null, rawValidationArray = null, rawQuestion = null }) {
    const allContextText = `${title || ''} ${subtitle || ''} ${placeholder || ''} ${description || ''} ${questionInfoObj ? JSON.stringify(questionInfoObj) : ''} ${rawRestrictions ? JSON.stringify(rawRestrictions) : ''} ${rawQuestion ? JSON.stringify(rawQuestion) : ''}`;
    const earlyRange = this.extractNumberRange(allContextText);

    // 1. Nếu có rawValidationArray từ Google Forms (FB_PUBLIC_LOAD_DATA_ qData[4])
    if (Array.isArray(rawValidationArray) && rawValidationArray.length > 0) {
      for (const ruleItem of rawValidationArray) {
        if (!Array.isArray(ruleItem)) continue;
        const vType = ruleItem[0];
        const opType = ruleItem[1];
        const operands = Array.isArray(ruleItem[2]) ? ruleItem[2] : [];
        const customMsg = typeof ruleItem[3] === 'string' && ruleItem[3].trim() ? ruleItem[3].trim() : '';

        // 1.1 Number
        if (vType === 1) {
          if (earlyRange) {
            return {
              type: 'NUMBER',
              rule: 'BETWEEN',
              min: earlyRange.min,
              max: earlyRange.max,
              placeholder: `Số phải nằm trong khoảng từ ${earlyRange.min} ~ ${earlyRange.max}`,
              error_message: customMsg || `Số phải nằm trong khoảng từ ${earlyRange.min} đến ${earlyRange.max}`
            };
          }
          if (opType === 7) { // Between
            const n1 = parseFloat(operands[0]);
            const n2 = parseFloat(operands[1]);
            if (!isNaN(n1) && !isNaN(n2)) {
              const minVal = Math.min(n1, n2);
              const maxVal = Math.max(n1, n2);
              return {
                type: 'NUMBER',
                rule: 'BETWEEN',
                min: minVal,
                max: maxVal,
                placeholder: `Số phải nằm trong khoảng từ ${minVal} ~ ${maxVal}`,
                error_message: customMsg || `Số phải nằm trong khoảng từ ${minVal} đến ${maxVal}`
              };
            }
          }
          if (opType === 8) { // Not between
            const n1 = parseFloat(operands[0]);
            const n2 = parseFloat(operands[1]);
            if (!isNaN(n1) && !isNaN(n2)) {
              const minVal = Math.min(n1, n2);
              const maxVal = Math.max(n1, n2);
              return {
                type: 'NUMBER',
                rule: 'NOT_BETWEEN',
                min: minVal,
                max: maxVal,
                placeholder: `Không nằm trong khoảng từ ${minVal} ~ ${maxVal}`,
                error_message: customMsg || `Không nằm trong khoảng từ ${minVal} đến ${maxVal}`
              };
            }
          }
          if (opType === 9) { // Is number
            return {
              type: 'NUMBER',
              rule: 'IS_NUMBER',
              placeholder: 'Giá trị phải là một số',
              error_message: customMsg || 'Giá trị phải là một số'
            };
          }
          if (opType === 1) { // Greater than
            const min = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'GREATER_THAN',
              min,
              placeholder: `Lớn hơn ${min}`,
              error_message: customMsg || `Giá trị phải lớn hơn ${min}`
            };
          }
          if (opType === 2) { // Greater than or equal
            const min = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'GREATER_THAN_OR_EQUAL',
              min,
              placeholder: `Lớn hơn hoặc bằng ${min}`,
              error_message: customMsg || `Giá trị phải lớn hơn hoặc bằng ${min}`
            };
          }
          if (opType === 3) { // Less than
            const max = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'LESS_THAN',
              max,
              placeholder: `Nhỏ hơn ${max}`,
              error_message: customMsg || `Giá trị phải nhỏ hơn ${max}`
            };
          }
          if (opType === 4) { // Less than or equal
            const max = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'LESS_THAN_OR_EQUAL',
              max,
              placeholder: `Nhỏ hơn hoặc bằng ${max}`,
              error_message: customMsg || `Giá trị phải nhỏ hơn hoặc bằng ${max}`
            };
          }
          if (opType === 5) { // Equal
            const val = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'EQUAL',
              value: val,
              placeholder: `Bằng ${val}`,
              error_message: customMsg || `Giá trị phải bằng ${val}`
            };
          }
          if (opType === 6) { // Not equal
            const val = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'NOT_EQUAL',
              value: val,
              placeholder: `Không bằng ${val}`,
              error_message: customMsg || `Giá trị không được bằng ${val}`
            };
          }
          if (opType === 10) { // Whole number
            return {
              type: 'NUMBER',
              rule: 'INTEGER',
              placeholder: 'Giá trị phải là số nguyên',
              error_message: customMsg || 'Giá trị phải là số nguyên'
            };
          }
        }

        // 1.2 Text (Email / URL)
        if (vType === 2) {
          if (opType === 3) { // Email
            return {
              type: 'EMAIL',
              rule: 'EMAIL',
              placeholder: 'Vui lòng nhập email',
              error_message: customMsg || 'Vui lòng nhập địa chỉ email hợp lệ'
            };
          }
          if (opType === 4) { // URL
            return {
              type: 'URL',
              rule: 'URL',
              placeholder: 'Vui lòng nhập URL hợp lệ',
              error_message: customMsg || 'Vui lòng nhập đường dẫn URL hợp lệ'
            };
          }
        }

        // 1.3 Length
        if (vType === 3) {
          if (opType === 1) { // Max char count
            const maxLen = parseInt(operands[0], 10) || 500;
            return {
              type: 'LENGTH',
              rule: 'MAX_LENGTH',
              max: maxLen,
              placeholder: `Tối đa ${maxLen} ký tự`,
              error_message: customMsg || `Độ dài không được vượt quá ${maxLen} ký tự`
            };
          }
          if (opType === 2) { // Min char count
            const minLen = parseInt(operands[0], 10) || 1;
            return {
              type: 'LENGTH',
              rule: 'MIN_LENGTH',
              min: minLen,
              placeholder: `Tối thiểu ${minLen} ký tự`,
              error_message: customMsg || `Độ dài phải có ít nhất ${minLen} ký tự`
            };
          }
        }
      }
    }

    // 2. Thu thập và bóc tách cấu trúc Restrictions từ Microsoft Forms & Google Forms
    const restrictionsList = [];
    const collectRestrictions = (target, depth = 0) => {
      if (!target || depth > 4) return;
      if (typeof target === 'string') {
        try {
          const parsed = JSON.parse(target);
          collectRestrictions(parsed, depth + 1);
        } catch (e) {
          const parsed = this._safeParseJsonOrObject(target);
          if (parsed && typeof parsed === 'object') collectRestrictions(parsed, depth + 1);
        }
        return;
      }
      if (Array.isArray(target)) {
        for (const item of target) collectRestrictions(item, depth + 1);
        return;
      }
      if (typeof target === 'object') {
        if (target.Restrictions) collectRestrictions(target.Restrictions, depth + 1);
        if (target.restrictions) collectRestrictions(target.restrictions);
        if (target.Validation) collectRestrictions(target.Validation, depth + 1);
        if (target.validation) collectRestrictions(target.validation);
        if (target.Rules) collectRestrictions(target.Rules, depth + 1);
        if (target.rules) collectRestrictions(target.rules);
        if (target.CustomProperties) collectRestrictions(target.CustomProperties, depth + 1);
        if (target.customProperties) collectRestrictions(target.customProperties);

        const hasOp = target.RestrictionOperator !== undefined || target.restrictionOperator !== undefined ||
          target.Operator !== undefined || target.operator !== undefined ||
          target.Rule !== undefined || target.rule !== undefined || target.op !== undefined;
        const hasType = target.RestrictionType !== undefined || target.restrictionType !== undefined ||
          target.Type !== undefined || target.type !== undefined;
        const hasVal = target.RestrictionValue1 !== undefined || target.Operand1 !== undefined ||
          target.Value1 !== undefined || target.Min !== undefined || target.min !== undefined ||
          target.Operands !== undefined || target.operands !== undefined;
        if (hasOp || (hasType && hasVal) || target.Type === 1 || target.type === 1 || target.type === 'NUMBER') {
          restrictionsList.push(target);
        }
      }
    };

    if (questionInfoObj) collectRestrictions(questionInfoObj);
    if (rawRestrictions) collectRestrictions(rawRestrictions);
    if (rawQuestion) {
      if (rawQuestion.restrictions) collectRestrictions(rawQuestion.restrictions);
      if (rawQuestion.Restrictions) collectRestrictions(rawQuestion.Restrictions);
      if (rawQuestion.validation) collectRestrictions(rawQuestion.validation);
      if (rawQuestion.Validation) collectRestrictions(rawQuestion.Validation);
    }

    // Helper trích xuất giá trị toán hạng val1 và val2 từ một restriction object
    const extractOperandsFromR = (r) => {
      let v1 = undefined;
      let v2 = undefined;

      const getVal1 = (obj) => obj.RestrictionValue1 ?? obj.restrictionValue1 ?? obj.RestrictionOperand1 ?? obj.restrictionOperand1 ??
        obj.Min ?? obj.min ?? obj.MinValue ?? obj.minValue ?? obj.lowerBound ?? obj.LowerBound ??
        obj.Operand1 ?? obj.operand1 ?? obj.Value1 ?? obj.value1 ?? obj.Value ?? obj.value ?? obj.FirstValue ?? obj.firstValue;
      const getVal2 = (obj) => obj.RestrictionValue2 ?? obj.restrictionValue2 ?? obj.RestrictionOperand2 ?? obj.restrictionOperand2 ??
        obj.Max ?? obj.max ?? obj.MaxValue ?? obj.maxValue ?? obj.upperBound ?? obj.UpperBound ??
        obj.Operand2 ?? obj.operand2 ?? obj.Value2 ?? obj.value2 ?? obj.SecValue ?? obj.secValue ??
        obj.SecondaryValue ?? obj.secondaryValue ?? obj.SecondValue ?? obj.secondValue;

      v1 = getVal1(r);
      v2 = getVal2(r);

      // 2. Quét r.Operands / r.operands
      const rawOps = r.Operands !== undefined ? r.Operands : r.operands;
      if (rawOps !== undefined && rawOps !== null) {
        let ops = rawOps;
        if (typeof ops === 'string') {
          try { ops = JSON.parse(ops); } catch (e) {
            ops = this._safeParseJsonOrObject(ops);
          }
        }
        if (Array.isArray(ops)) {
          if (v1 === undefined && ops[0] !== undefined) v1 = ops[0];
          if (v2 === undefined && ops[1] !== undefined) v2 = ops[1];
        }
      }

      // 3. Quét r.Parameters / r.parameters
      const rawParams = r.Parameters !== undefined ? r.Parameters : (r.parameters !== undefined ? r.parameters : (r.Args !== undefined ? r.Args : r.args));
      if (rawParams !== undefined && rawParams !== null) {
        let params = rawParams;
        if (typeof params === 'string') {
          try {
            params = JSON.parse(params);
          } catch (e) {
            const pObj = this._safeParseJsonOrObject(params);
            if (pObj) {
              params = pObj;
            } else {
              const parts = params.split(/[,;\s~-]+/).map(s => s.trim()).filter(Boolean);
              if (parts.length >= 2) {
                if (v1 === undefined) v1 = parts[0];
                if (v2 === undefined) v2 = parts[1];
              } else if (parts.length === 1 && v1 === undefined) {
                v1 = parts[0];
              }
            }
          }
        }
        if (Array.isArray(params)) {
          if (v1 === undefined && params[0] !== undefined) v1 = params[0];
          if (v2 === undefined && params[1] !== undefined) v2 = params[1];
        } else if (params && typeof params === 'object') {
          if (v1 === undefined) v1 = getVal1(params);
          if (v2 === undefined) v2 = getVal2(params);
        }
      }

      // 4. Nếu vẫn thiếu toán hạng, quét chính r qua extractNumberRange
      if (v1 === undefined || v2 === undefined) {
        const rRange = this.extractNumberRange(r);
        if (rRange) {
          if (v1 === undefined) v1 = rRange.min;
          if (v2 === undefined) v2 = rRange.max;
        }
      }

      return { val1: v1, val2: v2 };
    };

    let fallbackIsNumber = false;

    for (const r of restrictionsList) {
      if (!r || typeof r !== 'object') continue;

      const rawOp = r.RestrictionOperator !== undefined ? r.RestrictionOperator : (
        r.operator !== undefined ? r.operator : (
          r.Operator !== undefined ? r.Operator : (
            r.restrictionOperator !== undefined ? r.restrictionOperator : (
              r.Rule !== undefined ? r.Rule : (
                r.rule !== undefined ? r.rule : (
                  r.op !== undefined ? r.op : ''
                )
              )
            )
          )
        )
      );
      const opStr = String(rawOp).toLowerCase().trim();

      const rawType = r.RestrictionType !== undefined ? r.RestrictionType : (
        r.restrictionType !== undefined ? r.restrictionType : (
          r.type !== undefined ? r.type : (
            r.Type !== undefined ? r.Type : ''
          )
        )
      );
      const typeStr = String(rawType).toLowerCase().trim();

      const { val1, val2 } = extractOperandsFromR(r);

      // 2.1 Email
      if (opStr.includes('email') || typeStr.includes('email')) {
        return {
          type: 'EMAIL',
          rule: 'EMAIL',
          placeholder: 'Vui lòng nhập email',
          error_message: 'Vui lòng nhập địa chỉ email hợp lệ'
        };
      }

      // 2.2 URL
      if (opStr.includes('url') || typeStr.includes('url')) {
        return {
          type: 'URL',
          rule: 'URL',
          placeholder: 'Vui lòng nhập URL hợp lệ',
          error_message: 'Vui lòng nhập đường dẫn URL hợp lệ'
        };
      }

      // Nếu có earlyRange, luôn ưu tiên trả về BETWEEN
      if (earlyRange) {
        return {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: earlyRange.min,
          max: earlyRange.max,
          placeholder: `Số phải nằm trong khoảng từ ${earlyRange.min} ~ ${earlyRange.max}`,
          error_message: `Số phải nằm trong khoảng từ ${earlyRange.min} đến ${earlyRange.max}`
        };
      }

      // 2.3 BETWEEN (Toán tử 7 hoặc chuỗi chứa 'between' hoặc khi có earlyRange)
      const isBetween = rawOp === 7 || rawOp === '7' || opStr === 'between' || opStr.includes('between');
      if (isBetween || earlyRange) {
        let n1 = parseFloat(val1);
        let n2 = parseFloat(val2);

        if (isNaN(n1) || isNaN(n2)) {
          if (earlyRange) {
            n1 = earlyRange.min;
            n2 = earlyRange.max;
          } else {
            const rangeFromScan = this.extractNumberRange(`${placeholder} ${subtitle} ${description}`);
            if (rangeFromScan) {
              n1 = rangeFromScan.min;
              n2 = rangeFromScan.max;
            }
          }
        }

        if (!isNaN(n1) && !isNaN(n2)) {
          const actualMin = Math.min(n1, n2);
          const actualMax = Math.max(n1, n2);
          return {
            type: 'NUMBER',
            rule: 'BETWEEN',
            min: actualMin,
            max: actualMax,
            placeholder: `Số phải nằm trong khoảng từ ${actualMin} ~ ${actualMax}`,
            error_message: `Số phải nằm trong khoảng từ ${actualMin} đến ${actualMax}`
          };
        }
      }

      // 2.4 Nếu có cả 2 toán hạng val1 và val2 hợp lệ
      if (val1 !== undefined && val1 !== null && val2 !== undefined && val2 !== null) {
        const n1 = parseFloat(val1);
        const n2 = parseFloat(val2);
        if (!isNaN(n1) && !isNaN(n2)) {
          const actualMin = Math.min(n1, n2);
          const actualMax = Math.max(n1, n2);
          return {
            type: 'NUMBER',
            rule: 'BETWEEN',
            min: actualMin,
            max: actualMax,
            placeholder: `Số phải nằm trong khoảng từ ${actualMin} ~ ${actualMax}`,
            error_message: `Số phải nằm trong khoảng từ ${actualMin} đến ${actualMax}`
          };
        }
      }

      // 2.5 NOT BETWEEN (Toán tử 8)
      const isNotBetween = rawOp === 8 || rawOp === '8' || opStr.includes('notbetween');
      if (isNotBetween) {
        const n1 = parseFloat(val1);
        const n2 = parseFloat(val2);
        if (!isNaN(n1) && !isNaN(n2)) {
          const actualMin = Math.min(n1, n2);
          const actualMax = Math.max(n1, n2);
          return {
            type: 'NUMBER',
            rule: 'NOT_BETWEEN',
            min: actualMin,
            max: actualMax,
            placeholder: `Không nằm trong khoảng từ ${actualMin} ~ ${actualMax}`,
            error_message: `Không nằm trong khoảng từ ${actualMin} đến ${actualMax}`
          };
        }
      }

      // 2.6 GREATER THAN OR EQUAL (Toán tử 2)
      const isGte = rawOp === 2 || rawOp === '2' || opStr.includes('greaterthanorequal') || opStr.includes('>=') || opStr.includes('atleast');
      if (isGte) {
        const minVal = parseFloat(val1 !== undefined && val1 !== null ? val1 : val2) || 0;
        return {
          type: 'NUMBER',
          rule: 'GREATER_THAN_OR_EQUAL',
          min: minVal,
          placeholder: `Lớn hơn hoặc bằng ${minVal}`,
          error_message: `Giá trị phải lớn hơn hoặc bằng ${minVal}`
        };
      }

      // 2.7 GREATER THAN (Toán tử 1)
      const isGt = rawOp === 1 || rawOp === '1' || (opStr.includes('greaterthan') && !opStr.includes('equal')) || (opStr.includes('>') && !opStr.includes('='));
      if (isGt) {
        const minVal = parseFloat(val1 !== undefined && val1 !== null ? val1 : val2) || 0;
        return {
          type: 'NUMBER',
          rule: 'GREATER_THAN',
          min: minVal,
          placeholder: `Lớn hơn ${minVal}`,
          error_message: `Giá trị phải lớn hơn ${minVal}`
        };
      }

      // 2.8 LESS THAN OR EQUAL (Toán tử 4)
      const isLte = rawOp === 4 || rawOp === '4' || opStr.includes('lessthanorequal') || opStr.includes('<=') || opStr.includes('atmost');
      if (isLte) {
        const maxVal = parseFloat(val1 !== undefined && val1 !== null ? val1 : val2) || 0;
        return {
          type: 'NUMBER',
          rule: 'LESS_THAN_OR_EQUAL',
          max: maxVal,
          placeholder: `Nhỏ hơn hoặc bằng ${maxVal}`,
          error_message: `Giá trị phải nhỏ hơn hoặc bằng ${maxVal}`
        };
      }

      // 2.9 LESS THAN (Toán tử 3)
      const isLt = rawOp === 3 || rawOp === '3' || (opStr.includes('lessthan') && !opStr.includes('equal')) || (opStr.includes('<') && !opStr.includes('='));
      if (isLt) {
        const maxVal = parseFloat(val1 !== undefined && val1 !== null ? val1 : val2) || 0;
        return {
          type: 'NUMBER',
          rule: 'LESS_THAN',
          max: maxVal,
          placeholder: `Nhỏ hơn ${maxVal}`,
          error_message: `Giá trị phải nhỏ hơn ${maxVal}`
        };
      }

      // 2.10 EQUAL (Toán tử 5)
      const isEq = rawOp === 5 || rawOp === '5' || (opStr.includes('equal') && !opStr.includes('not') && !opStr.includes('than'));
      if (isEq) {
        const val = parseFloat(val1) || 0;
        return {
          type: 'NUMBER',
          rule: 'EQUAL',
          value: val,
          placeholder: `Bằng ${val}`,
          error_message: `Giá trị phải bằng ${val}`
        };
      }

      // 2.11 NOT EQUAL (Toán tử 6)
      const isNeq = rawOp === 6 || rawOp === '6' || opStr.includes('notequal');
      if (isNeq) {
        const val = parseFloat(val1) || 0;
        return {
          type: 'NUMBER',
          rule: 'NOT_EQUAL',
          value: val,
          placeholder: `Không bằng ${val}`,
          error_message: `Giá trị không được bằng ${val}`
        };
      }

      // 2.12 IS_NUMBER
      const isNum = rawOp === 9 || rawOp === '9' || opStr.includes('isnumber') || opStr === 'number' || ((typeStr.includes('number') || typeStr === '1' || typeStr === 1) && !opStr);
      if (isNum) {
        if (earlyRange) {
          return {
            type: 'NUMBER',
            rule: 'BETWEEN',
            min: earlyRange.min,
            max: earlyRange.max,
            placeholder: `Số phải nằm trong khoảng từ ${earlyRange.min} ~ ${earlyRange.max}`,
            error_message: `Số phải nằm trong khoảng từ ${earlyRange.min} đến ${earlyRange.max}`
          };
        }
        fallbackIsNumber = true;
      }

      // 2.13 MAX_LENGTH / LENGTH
      if (opStr.includes('maxlength') || opStr.includes('length')) {
        const maxLen = parseInt(val1 !== undefined && val1 !== null ? val1 : val2, 10) || 500;
        return {
          type: 'LENGTH',
          rule: 'MAX_LENGTH',
          max: maxLen,
          placeholder: `Tối đa ${maxLen} ký tự`,
          error_message: `Độ dài không được vượt quá ${maxLen} ký tự`
        };
      }
    }

    // 3. Phân tích trực tiếp từ Placeholder (Đặc thù tự động của Microsoft Forms khi thiết lập Restrictions)
    if (placeholder && typeof placeholder === 'string') {
      const trimmedPlaceholder = placeholder.trim();

      // 3.1 Dải số Between từ Placeholder
      const rangeFromPh = this.extractNumberRange(trimmedPlaceholder);
      if (rangeFromPh) {
        return {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: rangeFromPh.min,
          max: rangeFromPh.max,
          placeholder: `Số phải nằm trong khoảng từ ${rangeFromPh.min} ~ ${rangeFromPh.max}`,
          error_message: `Số phải nằm trong khoảng từ ${rangeFromPh.min} đến ${rangeFromPh.max}`
        };
      }

      // 3.2 Is Number từ Placeholder
      if (/(?:giá\s*trị\s*phải\s*là\s*(?:một\s*)?số|gia\s*tri\s*phai\s*la\s*(?:mot\s*)?so|phải\s*là\s*(?:một\s*)?số|phai\s*la\s*(?:mot\s*)?so|value\s*must\s*be\s*a\s*number|must\s*be\s*a\s*number|phải\s*là\s*số)/i.test(trimmedPlaceholder)) {
        return {
          type: 'NUMBER',
          rule: 'IS_NUMBER',
          placeholder: 'Giá trị phải là một số',
          error_message: 'Giá trị phải là một số'
        };
      }

      // 3.3 Lớn hơn hoặc bằng từ Placeholder
      const phGte = trimmedPlaceholder.match(/(?:lớn\s*hơn\s*hoặc\s*bằng|greater\s*than\s*or\s*equal\s*to|at\s*least|>=)\s*([0-9.,]+)/i);
      if (phGte) {
        const minVal = parseFloat(phGte[1].replace(/,/g, '')) || 0;
        return {
          type: 'NUMBER',
          rule: 'GREATER_THAN_OR_EQUAL',
          min: minVal,
          placeholder: `Lớn hơn hoặc bằng ${minVal}`,
          error_message: `Giá trị phải lớn hơn hoặc bằng ${minVal}`
        };
      }

      // 3.4 Lớn hơn từ Placeholder
      const phGt = trimmedPlaceholder.match(/(?:lớn\s*hơn|greater\s*than|>)\s*([0-9.,]+)/i);
      if (phGt) {
        const minVal = parseFloat(phGt[1].replace(/,/g, '')) || 0;
        return {
          type: 'NUMBER',
          rule: 'GREATER_THAN',
          min: minVal,
          placeholder: `Lớn hơn ${minVal}`,
          error_message: `Giá trị phải lớn hơn ${minVal}`
        };
      }

      // 3.5 Nhỏ hơn hoặc bằng từ Placeholder
      const phLte = trimmedPlaceholder.match(/(?:nhỏ\s*hơn\s*hoặc\s*bằng|less\s*than\s*or\s*equal\s*to|at\s*most|<=)\s*([0-9.,]+)/i);
      if (phLte) {
        const maxVal = parseFloat(phLte[1].replace(/,/g, '')) || 100;
        return {
          type: 'NUMBER',
          rule: 'LESS_THAN_OR_EQUAL',
          max: maxVal,
          placeholder: `Nhỏ hơn hoặc bằng ${maxVal}`,
          error_message: `Giá trị phải nhỏ hơn hoặc bằng ${maxVal}`
        };
      }

      // 3.6 Nhỏ hơn từ Placeholder
      const phLt = trimmedPlaceholder.match(/(?:nhỏ\s*hơn|less\s*than|<)\s*([0-9.,]+)/i);
      if (phLt) {
        const maxVal = parseFloat(phLt[1].replace(/,/g, '')) || 100;
        return {
          type: 'NUMBER',
          rule: 'LESS_THAN',
          max: maxVal,
          placeholder: `Nhỏ hơn ${maxVal}`,
          error_message: `Giá trị phải nhỏ hơn ${maxVal}`
        };
      }
    }

    if (earlyRange) {
      return {
        type: 'NUMBER',
        rule: 'BETWEEN',
        min: earlyRange.min,
        max: earlyRange.max,
        placeholder: `Số phải nằm trong khoảng từ ${earlyRange.min} ~ ${earlyRange.max}`,
        error_message: `Số phải nằm trong khoảng từ ${earlyRange.min} đến ${earlyRange.max}`
      };
    }

    const lateRange = this.extractNumberRange(allContextText);
    if (lateRange) {
      return {
        type: 'NUMBER',
        rule: 'BETWEEN',
        min: lateRange.min,
        max: lateRange.max,
        placeholder: `Số phải nằm trong khoảng từ ${lateRange.min} ~ ${lateRange.max}`,
        error_message: `Số phải nằm trong khoảng từ ${lateRange.min} đến ${lateRange.max}`
      };
    }

    if (fallbackIsNumber) {
      return {
        type: 'NUMBER',
        rule: 'IS_NUMBER',
        placeholder: 'Giá trị phải là một số',
        error_message: 'Giá trị phải là một số'
      };
    }

    // 4. Phân tích ngữ cảnh văn bản (Text / Subtitle / Placeholder / Title / Description)
    const combinedText = `${title} ${subtitle} ${placeholder} ${description}`.trim();
    if (!combinedText) return null;

    // 4.1 Ưu tiên quét dải số BETWEEN rõ ràng từ combinedText
    const betweenMatch = combinedText.match(/(?:số\s+phải\s+nằm\s+trong\s+khoảng\s+từ|so\s+phai\s+nam\s+trong\s+khoang\s+tu|nằm\s+trong\s+khoảng\s+từ|nam\s+trong\s+khoang\s+tu|trong\s+khoảng\s+từ|trong\s+khoang\s+tu|khoảng\s+từ|khoang\s+tu|between|number\s+must\s+be\s+between)\s*([0-9.,]+)\s*(?:đến|và|~|-|den|va|to|and)\s*([0-9.,]+)/i) ||
                         combinedText.match(/(?:^|[\s(:])(\d+(?:[.,]\d+)?)\s*(?:~|đến|den)\s*(\d+(?:[.,]\d+)?)(?:[\s):]|$)/i);
    if (betweenMatch) {
      const n1 = parseFloat(betweenMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(betweenMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        const minVal = Math.min(n1, n2);
        const maxVal = Math.max(n1, n2);
        return {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: minVal,
          max: maxVal,
          placeholder: `Số phải nằm trong khoảng từ ${minVal} ~ ${maxVal}`,
          error_message: `Số phải nằm trong khoảng từ ${minVal} đến ${maxVal}`
        };
      }
    }

    // 4.2 Email
    if (/(?:\bemail(?:\s+hust)?\b|thư\s*điện\s*tử|địa\s*chỉ\s*email)/i.test(combinedText)) {
      return {
        type: 'EMAIL',
        rule: 'EMAIL',
        placeholder: 'Vui lòng nhập email',
        error_message: 'Vui lòng nhập địa chỉ email hợp lệ'
      };
    }

    // 4.3 Website / URL
    if (/(?:\burl\b|liên\s*kết|trang\s*web|website|\blink\b|https?:\/\/)/i.test(combinedText)) {
      return {
        type: 'URL',
        rule: 'URL',
        placeholder: 'Vui lòng nhập URL hợp lệ',
        error_message: 'Vui lòng nhập đường dẫn URL hợp lệ'
      };
    }

    // 4.4 Mã số sinh viên: Tuyệt đối KHÔNG gán cứng min=20000000, max=20270000 nếu form không quy định
    if (/(?:mã\s*số\s*sinh\s*viên|ma\s*so\s*sinh\s*vien|\bmssv\b|số\s*thẻ\s*sinh\s*viên|so\s*the\s*sinh\s*vien|mã\s*sinh\s*viên|ma\s*sinh\s*vien)/i.test(combinedText)) {
      const rangeMatch = combinedText.match(/(\d+)\s*(?:đến|và|~|-|den|va|to)\s*(\d+)/i);
      if (rangeMatch) {
        const n1 = parseInt(rangeMatch[1], 10);
        const n2 = parseInt(rangeMatch[2], 10);
        if (!isNaN(n1) && !isNaN(n2)) {
          const minVal = Math.min(n1, n2);
          const maxVal = Math.max(n1, n2);
          return {
            type: 'NUMBER',
            rule: 'BETWEEN',
            min: minVal,
            max: maxVal,
            placeholder: `Số phải nằm trong khoảng từ ${minVal} ~ ${maxVal}`,
            error_message: `Số phải nằm trong khoảng từ ${minVal} đến ${maxVal}`
          };
        }
      }
      return {
        type: 'NUMBER',
        rule: 'IS_NUMBER',
        placeholder: 'Giá trị phải là một số',
        error_message: 'Giá trị phải là một số'
      };
    }

    // 4.5 Số điện thoại, số lượng & các trường số
    if (/(?:giá\s*trị\s*phải\s*là\s*(?:một\s*)?số|gia\s*tri\s*phai\s*la\s*(?:mot\s*)?so|phải\s*là\s*(?:một\s*)?số|phai\s*la\s*(?:mot\s*)?so|số\s*điện\s*thoại|so\s*dien\s*thoai|\bsđt\b|\bsdt\b|điện\s*thoại|dien\s*thoai|phone\s*number|số\s*lượng|so\s*luong|độ\s*tuổi|do\s*tuoi|\btuổi\b|\btuoi\b|năm\s*sinh|nam\s*sinh|điểm\s*số|diem\s*so|thứ\s*hạng|thu\s*hang|thu\s*nhập|thu\s*nhap|số\s*tiền|so\s*tien)/i.test(combinedText)) {
      const rangeMatch = combinedText.match(/(\d+)\s*(?:đến|và|~|-|den|va|to)\s*(\d+)/i);
      if (rangeMatch) {
        const n1 = parseInt(rangeMatch[1], 10);
        const n2 = parseInt(rangeMatch[2], 10);
        if (!isNaN(n1) && !isNaN(n2)) {
          const minVal = Math.min(n1, n2);
          const maxVal = Math.max(n1, n2);
          return {
            type: 'NUMBER',
            rule: 'BETWEEN',
            min: minVal,
            max: maxVal,
            placeholder: `Số phải nằm trong khoảng từ ${minVal} ~ ${maxVal}`,
            error_message: `Số phải nằm trong khoảng từ ${minVal} đến ${maxVal}`
          };
        }
      }
      return {
        type: 'NUMBER',
        rule: 'IS_NUMBER',
        placeholder: 'Giá trị phải là một số',
        error_message: 'Giá trị phải là một số'
      };
    }

    // 4.6 Độ dài (Length)
    const maxLenMatch = combinedText.match(/(?:tối\s*đa|không\s*quá|dưới)\s*(\d+)\s*ký\s*tự/i) || combinedText.match(/độ\s*dài\s*(?:tối\s*đa)?\s*(\d+)/i);
    if (maxLenMatch) {
      const maxLen = parseInt(maxLenMatch[1], 10);
      return {
        type: 'LENGTH',
        rule: 'MAX_LENGTH',
        max: maxLen,
        placeholder: `Tối đa ${maxLen} ký tự`,
        error_message: `Độ dài không được vượt quá ${maxLen} ký tự`
      };
    }

    const minLenMatch = combinedText.match(/(?:ít\s*nhất|tối\s*thiểu|từ)\s*(\d+)\s*ký\s*tự/i);
    if (minLenMatch) {
      const minLen = parseInt(minLenMatch[1], 10);
      return {
        type: 'LENGTH',
        rule: 'MIN_LENGTH',
        min: minLen,
        placeholder: `Tối thiểu ${minLen} ký tự`,
        error_message: `Độ dài phải có ít nhất ${minLen} ký tự`
      };
    }

    return null;
  }

  /**
   * Helper ánh xạ một câu hỏi Microsoft Forms
   * Hỗ trợ đầy đủ cả runtimeForms cũ và SPA REST API hiện đại (q.questionInfo JSON & choices displayText)
   */
  _parseMicrosoftQuestion(q, orderIndex) {
    const rawType = String(q.type || q.questionType || '');
    const title = String(q.title || q.name || q.prompt || `Câu hỏi ${orderIndex}`).trim();
    const isRequired = (q.required === true || q.isRequired === true) ? 1 : 0;

    const getChoiceLabel = (c) => {
      if (!c) return '';
      if (typeof c === 'string') return c.trim();
      return String(c.displayText || c.Description || c.description || c.title || c.name || c.text || '').trim();
    };

    let questionInfoObj = null;
    const rawQuestionInfo = q.questionInfo || q.QuestionInfo || q.info || q.Info || q.Settings || q.settings || null;
    if (rawQuestionInfo) {
      if (typeof rawQuestionInfo === 'string') {
        try {
          questionInfoObj = JSON.parse(rawQuestionInfo);
        } catch (e1) {
          questionInfoObj = this._safeParseJsonOrObject(rawQuestionInfo);
        }
      } else if (typeof rawQuestionInfo === 'object') {
        questionInfoObj = rawQuestionInfo;
      }
    }

    let choicesList = [];
    if (Array.isArray(q.choices) && q.choices.length > 0) {
      choicesList = q.choices.map(getChoiceLabel).filter(Boolean);
    } else if (questionInfoObj && Array.isArray(questionInfoObj.Choices)) {
      choicesList = questionInfoObj.Choices.map(getChoiceLabel).filter(Boolean);
    }

    const isMulti = q.allowMultipleValues === true || q.isMultiChoice === true || q.multiSelection === true || q.multiSelect === true || questionInfoObj?.ChoiceType === 2;
    const isDropdown = q.isDropdown === true || q.subType === 'Dropdown' || q.displayType === 'Dropdown' || questionInfoObj?.OptionDisplayStyle === 'Dropdown';

    let questionType = 'SINGLE_CHOICE';
    let options = null;
    let rows = null;
    let columns = null;
    let minLabel = null;
    let maxLabel = null;

    const lowerType = rawType.toLowerCase();

    // 1. MatrixChoiceGroup / Likert
    if (lowerType.includes('matrix') || lowerType.includes('likert')) {
      questionType = isMulti ? 'CHECKBOX_GRID' : 'CHOICE_GRID';

      const rawRows = q.rows || q.subQuestions || q.questions || [];
      const rawCols = q.columns || (choicesList.length > 0 ? choicesList : (q.choices || q.options || []));

      rows = rawRows.map(r => typeof r === 'string' ? r.trim() : (r.title || r.name || r.text || String(r))).filter(Boolean);
      columns = rawCols.map(getChoiceLabel).filter(Boolean);
      options = columns;
    }
    // 2. Choice
    else if (lowerType.includes('choice')) {
      if (isMulti) {
        questionType = 'MULTIPLE_CHOICE';
      } else if (isDropdown) {
        questionType = 'DROPDOWN';
      } else {
        questionType = 'SINGLE_CHOICE';
      }

      options = choicesList;
    }
    // 3. TextField
    else if (lowerType.includes('text') || lowerType.includes('string')) {
      const isMultiline = q.isMultiline === true || q.isLongText === true || q.subType === 'MultiLine' || questionInfoObj?.Multiline === true;
      questionType = isMultiline ? 'PARAGRAPH' : 'SHORT_TEXT';
      options = null;
    }
    // 4. Rating & Net Promoter Score (NPS)
    else if (lowerType.includes('nps') || lowerType.includes('netpromoter')) {
      questionType = 'LINEAR_SCALE';
      options = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      minLabel = questionInfoObj?.LeftDescription || 'Hoàn toàn không có khả năng';
      maxLabel = questionInfoObj?.RightDescription || 'Rất có khả năng';
    }
    else if (lowerType.includes('rating') || lowerType.includes('score')) {
      const ratingType = String(q.ratingType || q.subType || q.iconType || '').toLowerCase();
      const maxLevel = parseInt(questionInfoObj?.RatingLevel || q.maxRating || q.ratingLevel || q.levelCount || 5, 10);
      const safeMax = Math.min(10, Math.max(2, isNaN(maxLevel) ? 5 : maxLevel));
      
      if (ratingType.includes('number') || ratingType.includes('linear')) {
        questionType = 'LINEAR_SCALE';
        options = [];
        for (let i = 1; i <= safeMax; i++) options.push(String(i));
      } else {
        questionType = 'RATING_STARS';
        options = [];
        for (let i = 1; i <= safeMax; i++) options.push(String(i));
      }
    }
    // 5. Ranking (Xếp thứ tự)
    else if (lowerType.includes('ranking') || lowerType.includes('rank') || lowerType.includes('order')) {
      questionType = 'RANKING';
      options = choicesList;
    }
    // 6. Section / Mục (Phân đoạn)
    else if (lowerType.includes('section') || lowerType.includes('page') || lowerType.includes('group')) {
      questionType = 'SECTION_HEADER';
      options = null;
    }
    // 7. DateTime
    else if (lowerType.includes('date')) {
      questionType = 'DATE_INPUT';
      options = null;
    }
    // 8. Time
    else if (lowerType.includes('time')) {
      questionType = 'TIME_INPUT';
      options = null;
    }
    // 9. FileUpload
    else if (lowerType.includes('file')) {
      questionType = 'FILE_UPLOAD';
      options = null;
    }
    // Fallback
    else {
      if (choicesList.length > 0) {
        questionType = isMulti ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE';
        options = choicesList;
      } else {
        questionType = 'SHORT_TEXT';
      }
    }

    const subtitle = String(
      q.subtitle ||
      q.Subtitle ||
      q.description ||
      q.Description ||
      questionInfoObj?.Subtitle ||
      questionInfoObj?.subtitle ||
      questionInfoObj?.Description ||
      questionInfoObj?.description ||
      ''
    ).trim();

    const placeholder = String(
      q.placeholder ||
      q.Placeholder ||
      questionInfoObj?.Placeholder ||
      questionInfoObj?.placeholder ||
      q.watermark ||
      q.Watermark ||
      q.hint ||
      q.Hint ||
      ''
    ).trim();

    const rawRestrictions = q.restrictions || q.Restrictions || q.restriction || q.Restriction ||
      q.validation || q.Validation || q.rules || q.Rules || q.rule || q.Rule ||
      questionInfoObj?.Restrictions || questionInfoObj?.restrictions ||
      questionInfoObj?.Validation?.Restrictions || questionInfoObj?.validation?.restrictions ||
      questionInfoObj?.Validation || questionInfoObj?.validation ||
      questionInfoObj?.Rules || questionInfoObj?.rules ||
      questionInfoObj?.Restriction || questionInfoObj?.restriction ||
      questionInfoObj?.CustomProperties || questionInfoObj?.customProperties || null;

    const res = {
      order_index: orderIndex,
      type: questionType,
      content: title,
      is_required: isRequired,
      options: options && options.length > 0 ? options : null
    };

    const qId = q.id || q.Id || q.questionId || q.QuestionId || questionInfoObj?.Id || questionInfoObj?.id || null;
    if (qId !== null && qId !== undefined && qId !== '') {
      res.origin_id = String(qId);
    }
    res.id = `q_${res.origin_id || res.order_index}`;

    if (subtitle) res.description = subtitle;
    if (placeholder) res.placeholder = placeholder;
    if (minLabel) res.min_label = minLabel;
    if (maxLabel) res.max_label = maxLabel;
    if (rows && rows.length > 0) res.rows = rows;
    if (columns && columns.length > 0) res.columns = columns;

    // Trích xuất Branching Logic cho câu hỏi Choice (SINGLE_CHOICE / DROPDOWN)
    if (questionType === 'SINGLE_CHOICE' || questionType === 'DROPDOWN') {
      const rawChoices = (Array.isArray(q.choices) && q.choices.length > 0)
        ? q.choices
        : (questionInfoObj && Array.isArray(questionInfoObj.Choices) ? questionInfoObj.Choices : []);

      const rawRules = q.branchRules || q.BranchRules || questionInfoObj?.BranchRules || questionInfoObj?.branchRules || [];
      const rulesList = Array.isArray(rawRules) ? rawRules : [];

      const logicOptions = {};
      let hasLogic = false;

      rawChoices.forEach((c, idx) => {
        const optLabel = getChoiceLabel(c);
        if (!optLabel) return;

        let target = c.nextQuestionId ?? c.NextQuestionId ?? c.branchTo ?? c.BranchTo ?? c.targetQuestionId ?? c.TargetQuestionId ?? c.target ?? c.Target ?? null;

        if (target === null || target === undefined || target === '') {
          const choiceId = c.id ?? c.Id;
          for (const rule of rulesList) {
            if (!rule || typeof rule !== 'object') continue;
            const rChoiceId = rule.ChoiceId ?? rule.choiceId ?? rule.SourceChoiceId ?? rule.sourceChoiceId;
            const rIdx = rule.OptionIndex ?? rule.optionIndex ?? rule.ChoiceIndex ?? rule.choiceIndex;
            const rVal = rule.SourceValue ?? rule.sourceValue ?? rule.Choice ?? rule.choice;

            const matchId = choiceId !== undefined && rChoiceId !== undefined && String(choiceId) === String(rChoiceId);
            const matchIdx = rIdx !== undefined && Number(rIdx) === idx;
            const matchVal = rVal !== undefined && String(rVal).trim().toLowerCase() === optLabel.toLowerCase();

            if (matchId || matchIdx || matchVal) {
              target = rule.NextQuestionId ?? rule.nextQuestionId ?? rule.TargetQuestionId ?? rule.targetQuestionId ?? rule.BranchTo ?? rule.branchTo ?? rule.NextQuestion ?? rule.nextQuestion;
              break;
            }
          }
        }

        if (target !== null && target !== undefined && target !== '') {
          hasLogic = true;
          const tgtStr = String(target).trim();
          if (tgtStr === '-1' || tgtStr.toLowerCase() === 'submit' || tgtStr.toLowerCase() === 'endofform') {
            logicOptions[optLabel] = {
              action: 'SUBMIT_FORM',
              target: null
            };
          } else {
            logicOptions[optLabel] = {
              action: 'GO_TO_PAGE',
              target: tgtStr
            };
          }
        }
      });

      if (hasLogic) {
        res.logic = res.logic || {};
        res.logic.enabled = true;
        res.logic.options = logicOptions;
      }
    }

    // Trích xuất điều hướng mặc định cho SECTION_HEADER trong Microsoft Forms
    if (questionType === 'SECTION_HEADER') {
      const nextQId = q.nextQuestionId ?? q.NextQuestionId ?? questionInfoObj?.NextQuestionId ?? questionInfoObj?.nextQuestionId ?? null;
      if (nextQId !== null && nextQId !== undefined && nextQId !== '') {
        const tgtStr = String(nextQId).trim();
        if (tgtStr === '-1' || tgtStr.toLowerCase() === 'submit' || tgtStr.toLowerCase() === 'endofform') {
          res.logic = res.logic || {};
          res.logic.default_action = 'SUBMIT_FORM';
          res.logic.target = null;
        } else {
          res.logic = res.logic || {};
          res.logic.default_action = 'GO_TO_PAGE';
          res.logic.target = tgtStr;
        }
      }
    }

    // Trích xuất validation cho câu hỏi Microsoft Forms
    const validation = this._extractValidationRule({
      title,
      subtitle,
      placeholder,
      description: subtitle,
      questionInfoObj,
      rawRestrictions,
      rawQuestion: q
    });

    if (validation) {
      res.validation = validation;
      res.logic = res.logic || {};
      res.logic.validation = validation;
      if (validation.placeholder) {
        res.placeholder = validation.placeholder;
      }
    }

    return res;
  }

  /**
   * 3a. Bóc tách Microsoft Forms hiện đại (Async với SPA API Runtime & prefetchFormUrl)
   */
  async parseMicrosoftForms(html, originalUrl) {
    let title = 'Khảo sát Microsoft Forms';
    let description = '';
    const questions = [];

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const extractedTitle = titleMatch[1].replace(/ - Microsoft Forms$/i, '').trim();
      if (extractedTitle && extractedTitle !== 'Microsoft Forms') {
        title = extractedTitle;
      }
    }

    const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i);
    if (descMatch && descMatch[1]) {
      description = descMatch[1].trim();
    }

    // Chuẩn hóa link embed Microsoft Forms
    let embedUrl = originalUrl;
    if (!embedUrl.includes('embed=true')) {
      embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'embed=true';
    }

    // 1. Kiểm tra cấu hình OfficeFormServerInfo (SPA Runtime của Microsoft Forms hiện đại)
    const serverInfo = this._extractJsonObject(html, 'OfficeFormServerInfo');
    if (serverInfo && serverInfo.prefetchFormUrl) {
      try {
        await this.validateFormUrlAsync(serverInfo.prefetchFormUrl);

        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'antiForgeryToken': serverInfo.antiForgeryToken || '',
          'x-ms-form-request-ring': serverInfo.ring || 'business',
          'x-ms-form-request-datacenter': serverInfo.datacenter || 'sea'
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const prefetchResp = await fetch(serverInfo.prefetchFormUrl, {
          method: 'GET',
          headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (prefetchResp.status === 401) {
          const authErr = new Error("Biểu mẫu Microsoft Forms này đang bật chế độ 'Yêu cầu đăng nhập tài khoản Microsoft' hoặc 'Chỉ người trong tổ chức mới có thể phản hồi'. Vui lòng mở Microsoft Forms > Thu thập phản hồi (Collect responses) > Chọn 'Bất kỳ ai cũng có thể phản hồi' (Anyone can respond) và bỏ chọn 'Ghi lại tên' (Record name), hoặc sử dụng tính năng Dán Văn Bản Thông Minh (Smart Paste).");
          authErr.status = 401;
          authErr.statusCode = 401;
          authErr.isMicrosoft = true;
          throw authErr;
        }

        if (prefetchResp.ok) {
          const apiData = await prefetchResp.json();
          if (apiData) {
            if (apiData.error || apiData.code === '701' || (apiData.message && apiData.message.includes('Required user login'))) {
              const authErr = new Error("Biểu mẫu Microsoft Forms này đang bật chế độ 'Yêu cầu đăng nhập tài khoản Microsoft' hoặc 'Chỉ người trong tổ chức mới có thể phản hồi'. Vui lòng mở Microsoft Forms > Thu thập phản hồi (Collect responses) > Chọn 'Bất kỳ ai cũng có thể phản hồi' (Anyone can respond) và bỏ chọn 'Ghi lại tên' (Record name), hoặc sử dụng tính năng Dán Văn Bản Thông Minh (Smart Paste).");
              authErr.status = 401;
              authErr.statusCode = 401;
              authErr.isMicrosoft = true;
              throw authErr;
            }

            if (apiData.title) title = apiData.title;
            if (apiData.description) description = apiData.description;

            const rawQuestions = [...(apiData.questions || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
            const getChoiceLabel = (c) => {
              if (!c) return '';
              if (typeof c === 'string') return c.trim();
              return String(c.displayText || c.Description || c.description || c.title || c.name || c.text || '').trim();
            };

            // Quét trước để gom nhóm Ma trận Lưới Likert (MatrixChoiceGroup + MatrixChoice)
            const matrixGroups = new Map();
            for (const q of rawQuestions) {
              const typeStr = String(q.type || q.questionType || '').toLowerCase();
              if (typeStr.includes('matrixchoicegroup') || (typeStr.includes('matrix') && !q.groupId)) {
                const gId = q.id || q.groupId || 'matrix_group';
                let cols = [];
                if (Array.isArray(q.choices)) {
                  cols = q.choices.map(getChoiceLabel).filter(Boolean);
                }
                if (cols.length === 0 && q.questionInfo) {
                  try {
                    const qi = typeof q.questionInfo === 'string' ? JSON.parse(q.questionInfo) : q.questionInfo;
                    if (Array.isArray(qi.Choices)) {
                      cols = qi.Choices.map(getChoiceLabel).filter(Boolean);
                    }
                  } catch(e) {}
                }
                matrixGroups.set(gId, {
                  id: gId,
                  title: (q.title || 'Ma trận đánh giá').trim(),
                  columns: cols,
                  rows: [],
                  required: q.required === true,
                  isMultiChoice: q.isMultiChoice === true || q.allowMultipleValues === true
                });
              }
            }

            for (const q of rawQuestions) {
              const typeStr = String(q.type || q.questionType || '').toLowerCase();
              if (q.groupId && (typeStr.includes('matrix') || typeStr.includes('likert'))) {
                if (!matrixGroups.has(q.groupId)) {
                  matrixGroups.set(q.groupId, {
                    id: q.groupId,
                    title: 'Ma trận đánh giá',
                    columns: [],
                    rows: [],
                    required: false,
                    isMultiChoice: false
                  });
                }
                const grp = matrixGroups.get(q.groupId);
                const rowName = (q.title || q.name || '').trim();
                if (rowName && !grp.rows.includes(rowName)) {
                  grp.rows.push(rowName);
                }
                if (q.required) grp.required = true;
              }
            }

            let qIndex = 1;
            const processedMatrixGroupIds = new Set();

            for (const q of rawQuestions) {
              if (!q) continue;

              const typeStr = String(q.type || q.questionType || '').toLowerCase();
              const gId = q.groupId || (typeStr.includes('matrixchoicegroup') ? q.id : null);

              if (gId && matrixGroups.has(gId)) {
                if (!processedMatrixGroupIds.has(gId)) {
                  processedMatrixGroupIds.add(gId);
                  const grp = matrixGroups.get(gId);
                  questions.push({
                    order_index: qIndex++,
                    type: grp.isMultiChoice ? 'CHECKBOX_GRID' : 'CHOICE_GRID',
                    content: grp.title || 'Ma trận đánh giá',
                    is_required: grp.required ? 1 : 0,
                    rows: grp.rows.length > 0 ? grp.rows : ['Tiêu chí 1'],
                    columns: grp.columns.length > 0 ? grp.columns : ['Mức 1', 'Mức 2', 'Mức 3'],
                    options: grp.columns.length > 0 ? grp.columns : ['Mức 1', 'Mức 2', 'Mức 3']
                  });
                }
                continue;
              }

              const parsedQ = this._parseMicrosoftQuestion(q, qIndex++);
              if (parsedQ) {
                questions.push(parsedQ);
              }
            }

            if (questions.length > 0) {
              this._resolveAndMapBranchingTargets(questions);
              return {
                source: 'MICROSOFT_FORM',
                title,
                description,
                originalUrl,
                embedUrl,
                questions,
                questionCount: questions.length,
                note: `Đã bóc tách thành công ${questions.length} câu hỏi từ Microsoft Forms.`
              };
            }
          }
        }
      } catch (err) {
        if (err.status === 401 || err.statusCode === 401) {
          throw err;
        }
        console.warn('[FormParserService] Lỗi khi gọi prefetchFormUrl của Microsoft Forms:', err.message);
      }
    }

    // 2. Fallback sang parse tĩnh từ HTML (runtimeForms nhúng cũ hoặc mock test)
    const fallbackResult = this.parseMicrosoftFormsHtml(html, originalUrl);
    if (fallbackResult.questionCount > 0) {
      return fallbackResult;
    }

    return fallbackResult;
  }

  /**
   * 3. Bóc tách Microsoft Forms từ HTML public (runtimeForms / OfficeFormServerInfo)
   */
  parseMicrosoftFormsHtml(html, originalUrl) {
    let title = 'Khảo sát Microsoft Forms';
    let description = '';
    const questions = [];

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/ - Microsoft Forms$/i, '').trim();
    }

    const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i);
    if (descMatch && descMatch[1]) {
      description = descMatch[1].trim();
    }

    // Bóc tách JSON nếu có trong HTML
    const formData = this._extractMicrosoftFormData(html);

    if (formData) {
      if (formData.title) title = formData.title;
      if (formData.description) description = formData.description;

      const rawQuestions = formData.questions || formData.items || [];
      const groupedMatrix = new Map();
      let qIndex = 1;

      for (const q of rawQuestions) {
        if (!q) continue;

        const typeStr = String(q.type || q.questionType || '').toLowerCase();
        const groupId = q.groupId || q.matrixGroupId;

        // Nếu là Likert/Matrix được chia thành các câu con có chung groupId
        if (groupId && (typeStr.includes('matrix') || typeStr.includes('likert'))) {
          if (!groupedMatrix.has(groupId)) {
            groupedMatrix.set(groupId, {
              order_index: qIndex++,
              type: (q.isMultiChoice || q.multiSelection) ? 'CHECKBOX_GRID' : 'CHOICE_GRID',
              content: q.groupTitle || q.matrixTitle || 'Ma trận đánh giá',
              is_required: (q.required === true || q.isRequired === true) ? 1 : 0,
              rows: [],
              columns: [],
              options: []
            });
          }
          const group = groupedMatrix.get(groupId);
          const rowTitle = q.title || q.name || q.prompt;
          if (rowTitle && !group.rows.includes(rowTitle)) {
            group.rows.push(rowTitle);
          }
          if (Array.isArray(q.choices) && group.columns.length === 0) {
            group.columns = q.choices.map(c => typeof c === 'string' ? c : (c.description || c.title || c.name || String(c))).filter(Boolean);
            group.options = group.columns;
          }
          continue;
        }

        const parsedQ = this._parseMicrosoftQuestion(q, qIndex++);
        if (parsedQ) {
          questions.push(parsedQ);
        }
      }

      for (const group of groupedMatrix.values()) {
        questions.push(group);
      }

      if (questions.length > 0) {
        this._resolveAndMapBranchingTargets(questions);
      }
    }

    // Chuẩn hóa link embed Microsoft Forms
    let embedUrl = originalUrl;
    if (!embedUrl.includes('embed=true')) {
      embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'embed=true';
    }

    return {
      source: 'MICROSOFT_FORM',
      title,
      description,
      originalUrl,
      embedUrl,
      questions,
      questionCount: questions.length,
      note: questions.length > 0
        ? `Đã bóc tách thành công ${questions.length} câu hỏi từ Microsoft Forms.`
        : 'Microsoft Forms là Single-Page-App được render phía client. Đã trích xuất tiêu đề & embedUrl sẵn sàng hiển thị qua khung tương tác trực tiếp.'
    };
  }

  /**
   * 4. Bóc tách biểu mẫu từ URL ngoại vi (Google Forms / Microsoft Forms)
   * Chống SSRF toàn diện: Giám sát từng bước chuyển hướng (Redirect Validation), chặn IP nội bộ & giới hạn dung lượng
   */
  async parseFromUrl(rawUrl, customCookie = null, userAccessToken = null) {
    let currentUrl = (rawUrl || '').trim();

    const formIdInfo = this.extractGoogleFormId(currentUrl);

    // 0. Nếu người dùng đã cấp quyền OAuth cá nhân, ưu tiên gọi thẳng Google Forms API
    if (formIdInfo && formIdInfo.formId && userAccessToken) {
      try {
        return await this.fetchFromGoogleFormsApi(formIdInfo.formId, currentUrl, userAccessToken);
      } catch (userOAuthErr) {
        if (userOAuthErr.code === 'USER_OAUTH_UNAUTHORIZED' || userOAuthErr.code === 'SERVICE_ACCOUNT_PERMISSION_DENIED') {
          throw userOAuthErr;
        }
        console.warn('[FormParserService] User OAuth Forms API thất bại, chuyển sang quét fallback:', userOAuthErr.message);
      }
    }

    // 1. Nếu là Google Forms và URL ở dạng chỉnh sửa (/edit), ưu tiên dùng Google Forms API nếu có Service Account
    if (formIdInfo && formIdInfo.formId && (this.hasServiceAccountConfigured() || userAccessToken)) {
      if (currentUrl.includes('/edit')) {
        try {
          return await this.fetchFromGoogleFormsApi(formIdInfo.formId, currentUrl, userAccessToken);
        } catch (saErr) {
          if (saErr.code === 'SERVICE_ACCOUNT_PERMISSION_DENIED' || saErr.code === 'USER_OAUTH_UNAUTHORIZED' || saErr.status === 401) {
            throw saErr;
          }
          console.warn('[FormParserService] Gọi Google Forms API thất bại cho link /edit, chuyển sang fallback:', saErr.message);
        }
      }
    }

    let redirectCount = 0;
    const MAX_REDIRECTS = 3;
    let finalHtml = '';
    let finalValid = null;

    while (redirectCount <= MAX_REDIRECTS) {
      // Xác thực an toàn URL & DNS ở từng chặng (hop)
      const valid = await this.validateFormUrlAsync(currentUrl);
      finalValid = valid;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const reqHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        };

        // Sử dụng cookie từ client gửi lên (customCookie) hoặc cấu hình hệ thống (GOOGLE_SYNC_COOKIE)
        const cookieToUse = (customCookie && typeof customCookie === 'string' && customCookie.trim()) 
          ? customCookie.trim() 
          : (config.GOOGLE && config.GOOGLE.SYNC_COOKIE ? config.GOOGLE.SYNC_COOKIE : '');

        if (cookieToUse) {
          reqHeaders['Cookie'] = cookieToUse;
        }

        const resp = await fetch(valid.url, {
          method: 'GET',
          headers: reqHeaders,
          redirect: 'manual', // Chặn tự động chuyển hướng không kiểm soát chống SSRF
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Xử lý chuyển hướng an toàn (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(resp.status)) {
          const location = resp.headers.get('location');
          if (!location) {
            throw new Error('Máy chủ phản hồi chuyển hướng nhưng thiếu tiêu đề Location');
          }

          // Phát hiện biểu mẫu Google Forms bật chế độ đăng nhập hoặc giới hạn tổ chức chuyển hướng đến Accounts
          if (location.includes('accounts.google.com') || location.includes('ServiceLogin')) {
            // Thử đồng bộ trực tiếp qua Google Forms API bằng Service Account hoặc User OAuth
            if (this.hasServiceAccountConfigured() || userAccessToken) {
              const fInfo = this.extractGoogleFormId(currentUrl) || this.extractGoogleFormId(rawUrl);
              if (fInfo && fInfo.formId) {
                try {
                  return await this.fetchFromGoogleFormsApi(fInfo.formId, currentUrl, userAccessToken);
                } catch (saErr) {
                  if (saErr.code === 'SERVICE_ACCOUNT_PERMISSION_DENIED' || saErr.code === 'USER_OAUTH_UNAUTHORIZED' || saErr.status === 401) {
                    throw saErr;
                  }
                }
              }
            }

            const saEmail = this.getServiceAccountEmail();
            let msg = "Biểu mẫu Google Forms này đang bật chế độ 'Yêu cầu đăng nhập tài khoản Google' hoặc 'Giới hạn trong tổ chức'.";
            if (saEmail) {
              msg += ` Vui lòng mở Google Forms > Thêm cộng tác viên (Add collaborators) > Thêm email: "${saEmail}" với quyền Biên tập viên, hoặc ủy quyền tài khoản Google để đồng bộ.`;
            } else {
              msg += " Vui lòng mở Google Forms > Cài đặt (Settings) > Tắt 'Giới hạn ở 1 câu trả lời' và cấp quyền công khai, hoặc ủy quyền tài khoản Google.";
            }

            const authErr = new Error(msg);
            authErr.status = 401;
            authErr.statusCode = 401;
            authErr.serviceAccountEmail = saEmail;
            authErr.code = 'SERVICE_ACCOUNT_PERMISSION_DENIED';
            throw authErr;
          }

          const nextUrl = new URL(location, currentUrl).href;
          redirectCount++;
          if (redirectCount > MAX_REDIRECTS) {
            throw new Error('Số lần chuyển hướng vượt quá giới hạn an toàn (tối đa 3 lần)');
          }

          // Chuyển hướng sang URL mới, vòng lặp tiếp theo sẽ kiểm tra validateFormUrlAsync(nextUrl)
          currentUrl = nextUrl;
          continue;
        }

        if (!resp.ok) {
          if (resp.status === 401) {
            if (this.hasServiceAccountConfigured() || userAccessToken) {
              const fInfo = this.extractGoogleFormId(currentUrl) || this.extractGoogleFormId(rawUrl);
              if (fInfo && fInfo.formId) {
                try {
                  return await this.fetchFromGoogleFormsApi(fInfo.formId, currentUrl, userAccessToken);
                } catch (saErr) {
                  if (saErr.code === 'SERVICE_ACCOUNT_PERMISSION_DENIED' || saErr.code === 'USER_OAUTH_UNAUTHORIZED' || saErr.status === 401) {
                    throw saErr;
                  }
                }
              }
            }

            const saEmail = this.getServiceAccountEmail();
            let msg = "Biểu mẫu Google Forms này đang bật chế độ 'Yêu cầu đăng nhập tài khoản Google' hoặc 'Giới hạn trong tổ chức'.";
            if (saEmail) {
              msg += ` Vui lòng mở Google Forms > Thêm cộng tác viên (Add collaborators) > Thêm email: "${saEmail}" với quyền Biên tập viên, hoặc ủy quyền tài khoản Google để đồng bộ.`;
            } else {
              msg += " Vui lòng mở Google Forms > Cài đặt (Settings) > Tắt 'Giới hạn ở 1 câu trả lời' và cấp quyền công khai, hoặc ủy quyền tài khoản Google.";
            }

            const authErr = new Error(msg);
            authErr.status = 401;
            authErr.statusCode = 401;
            authErr.serviceAccountEmail = saEmail;
            authErr.code = 'SERVICE_ACCOUNT_PERMISSION_DENIED';
            throw authErr;
          }
          throw new Error(`Máy chủ biểu mẫu trả về mã phản hồi ${resp.status}`);
        }

        // Kiểm tra dung lượng phản hồi (chặn HTTP response bomb / DoS bộ nhớ, giới hạn tối đa 5MB)
        const contentLength = parseInt(resp.headers.get('content-length'), 10);
        if (!isNaN(contentLength) && contentLength > 5 * 1024 * 1024) {
          throw new Error('Dung lượng trang biểu mẫu vượt quá giới hạn an toàn 5MB');
        }

        finalHtml = await resp.text();
        if (finalHtml.length > 5 * 1024 * 1024) {
          throw new Error('Dung lượng trang biểu mẫu vượt quá giới hạn an toàn 5MB');
        }

        break;
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error('Thời gian tải biểu mẫu vượt quá 8 giây. Vui lòng kiểm tra lại URL hoặc dùng tính năng Dán Văn Bản Thông Minh (Smart Paste).');
        }
        if (err.status === 401 || err.statusCode === 401 || err.code === 'SERVICE_ACCOUNT_PERMISSION_DENIED' || err.code === 'USER_OAUTH_UNAUTHORIZED' || err.isAuthRequired) {
          throw err;
        }
        throw new Error('Không thể tải nội dung biểu mẫu từ URL: ' + err.message);
      }
    }

    if (finalValid.isGoogle) {
      return this.parseGoogleFormsHtml(finalHtml, currentUrl);
    } else {
      return await this.parseMicrosoftForms(finalHtml, currentUrl);
    }
  }

  /**
   * 5. Smart Text Paste Parser: Tự động nhận diện câu hỏi từ văn bản thô (Word, Notion, Google Docs)
   * Nhận diện chuẩn xác:
   * - Trắc nghiệm (A, B, C hoặc -, *)
   * - Hộp kiểm ([ ])
   * - Ma trận Lưới (Hàng: ... | Cột: ...)
   * - Cờ bắt buộc is_required qua dấu * cuối câu hoặc cụm (bắt buộc)
   */
  parseSmartText(rawText) {
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      throw new Error('Vui lòng dán nội dung văn bản khảo sát');
    }

    const lines = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      throw new Error('Văn bản không có nội dung hợp lệ');
    }

    let title = 'Khảo sát mới';
    let description = '';
    const questions = [];

    // Mẫu regex nhận diện bắt đầu câu hỏi
    const questionStartRegex = /^(?:câu\s*(\d+)[:.]?|question\s*(\d+)[:.]?|q(\d+)[:.]?|(\d+)[.)/:-])\s*(.*)$/i;

    // Mẫu regex nhận diện đáp án trắc nghiệm
    const optionLetterRegex = /^[A-Za-z][.)/:-]\s*(.*)$/;
    const optionBulletRegex = /^[-*•–—]\s*(.*)$/;
    const optionCheckboxRegex = /^\[[ xX]?\]\s*(.*)$/;

    let currentQuestion = null;
    let readingMode = null; // 'ROWS' | 'COLUMNS' | null

    // Xử lý tiêu đề ở đầu văn bản (nếu dòng đầu không phải là câu hỏi)
    let startIndex = 0;
    if (!questionStartRegex.test(lines[0])) {
      title = lines[0]
        .replace(/^(?:tiêu đề|khảo sát|survey|tên bài)[:：]\s*/i, '')
        .trim() || lines[0].trim();
      startIndex = 1;

      // Nếu dòng thứ hai cũng không phải câu hỏi, có thể là mô tả
      if (lines[1] && !questionStartRegex.test(lines[1]) && !optionLetterRegex.test(lines[1])) {
        description = lines[1]
          .replace(/^(?:mô tả|giới thiệu|description)[:：]\s*/i, '')
          .trim();
        startIndex = 2;
      }
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      const qMatch = line.match(questionStartRegex);

      if (qMatch) {
        // Lưu câu hỏi trước đó nếu có
        if (currentQuestion) {
          questions.push(this._finalizeQuestion(currentQuestion, questions.length + 1));
        }

        const rawContent = qMatch[5] ? qMatch[5].trim() : line;
        currentQuestion = {
          content: rawContent || `Câu hỏi ${questions.length + 1}`,
          rawOptions: [],
          rows: null,
          columns: null,
          hasCheckboxOptions: false
        };
        readingMode = null;
        continue;
      }

      if (currentQuestion) {
        // 1. Kiểm tra dòng chuyển chế độ Hàng / Cột cho Ma trận
        if (/^(?:hàng|rows)[:：]?$/i.test(line)) {
          readingMode = 'ROWS';
          if (!currentQuestion.rows) currentQuestion.rows = [];
          continue;
        }

        if (/^(?:cột|columns)[:：]?$/i.test(line)) {
          readingMode = 'COLUMNS';
          if (!currentQuestion.columns) currentQuestion.columns = [];
          continue;
        }

        // Kiểm tra dòng chứa cả Hàng và Cột: "Hàng: A, B | Cột: X, Y"
        const inlineMatrixMatch = line.match(/^(?:hàng|rows)[:：]\s*([^|]+)\s*\|\s*(?:cột|columns)[:：]\s*(.*)$/i);
        if (inlineMatrixMatch) {
          currentQuestion.rows = inlineMatrixMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
          currentQuestion.columns = inlineMatrixMatch[2].split(/[,;]/).map(s => s.trim()).filter(Boolean);
          continue;
        }

        // Kiểm tra dòng chỉ có "Hàng: A, B, C"
        const inlineRowsMatch = line.match(/^(?:hàng|rows)[:：]\s*(.+)$/i);
        if (inlineRowsMatch) {
          currentQuestion.rows = inlineRowsMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
          continue;
        }

        // Kiểm tra dòng chỉ có "Cột: X, Y, Z"
        const inlineColsMatch = line.match(/^(?:cột|columns)[:：]\s*(.+)$/i);
        if (inlineColsMatch) {
          currentQuestion.columns = inlineColsMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
          continue;
        }

        // Nếu đang ở chế độ đọc ROWS
        if (readingMode === 'ROWS') {
          const bullet = line.match(optionBulletRegex) || line.match(optionLetterRegex);
          const val = bullet ? bullet[1].trim() : line;
          if (val) {
            if (!currentQuestion.rows) currentQuestion.rows = [];
            currentQuestion.rows.push(val);
          }
          continue;
        }

        // Nếu đang ở chế độ đọc COLUMNS
        if (readingMode === 'COLUMNS') {
          const bullet = line.match(optionBulletRegex) || line.match(optionLetterRegex);
          const val = bullet ? bullet[1].trim() : line;
          if (val) {
            if (!currentQuestion.columns) currentQuestion.columns = [];
            currentQuestion.columns.push(val);
          }
          continue;
        }

        // 1.5 Kiểm tra dòng placeholder hoặc hướng dẫn ràng buộc định dạng chuẩn Microsoft Forms / Google Forms
        const isLikelyOption = (optionLetterRegex.test(line) || optionBulletRegex.test(line) || optionCheckboxRegex.test(line)) &&
          !/(?:số\s*phải|nằm\s*trong\s*khoảng|khoảng\s*từ|between|giới\s*hạn)/i.test(line);

        if (!isLikelyOption) {
          const range = this.extractNumberRange(line);
          if (range) {
            currentQuestion.validation = {
              type: 'NUMBER',
              rule: 'BETWEEN',
              min: range.min,
              max: range.max,
              placeholder: `Số phải nằm trong khoảng từ ${range.min} ~ ${range.max}`,
              error_message: `Số phải nằm trong khoảng từ ${range.min} đến ${range.max}`
            };
            currentQuestion.placeholder = `Số phải nằm trong khoảng từ ${range.min} ~ ${range.max}`;
            continue;
          }
        }

        if (/(?:vui\s*lòng\s*nhập\s*email|email\s*hợp\s*lệ|nhập\s*email|please\s*enter\s*email)/i.test(line)) {
          currentQuestion.validation = {
            type: 'EMAIL',
            rule: 'EMAIL',
            placeholder: 'Vui lòng nhập email',
            error_message: 'Vui lòng nhập địa chỉ email hợp lệ'
          };
          currentQuestion.placeholder = 'Vui lòng nhập email';
          continue;
        }

        if (/(?:giá\s*trị\s*phải\s*là\s*(?:một\s*)?số|phải\s*là\s*(?:một\s*)?số|value\s*must\s*be\s*a\s*number|giới\s*hạn\s*số)/i.test(line)) {
          currentQuestion.validation = {
            type: 'NUMBER',
            rule: 'IS_NUMBER',
            placeholder: 'Giá trị phải là một số',
            error_message: 'Giá trị phải là một số'
          };
          currentQuestion.placeholder = 'Giá trị phải là một số';
          continue;
        }

        if (/(?:chọn\s*câu\s*trả\s*lời\s*của\s*bạn|select\s*your\s*answer)/i.test(line)) {
          currentQuestion.forceType = 'DROPDOWN';
          currentQuestion.placeholder = 'Chọn câu trả lời của bạn';
          continue;
        }

        if (/(?:nhập\s*câu\s*trả\s*lời\s*của\s*bạn|enter\s*your\s*answer)/i.test(line)) {
          currentQuestion.placeholder = 'Nhập câu trả lời của bạn';
          continue;
        }

        // 2. Kiểm tra phương án trắc nghiệm
        const checkMatch = line.match(optionCheckboxRegex);
        if (checkMatch) {
          currentQuestion.hasCheckboxOptions = true;
          currentQuestion.rawOptions.push(checkMatch[1].trim());
          continue;
        }

        const letterMatch = line.match(optionLetterRegex);
        if (letterMatch) {
          currentQuestion.rawOptions.push(letterMatch[1].trim());
          continue;
        }

        const bulletMatch = line.match(optionBulletRegex);
        if (bulletMatch) {
          currentQuestion.rawOptions.push(bulletMatch[1].trim());
          continue;
        }

        // Nếu câu hỏi đã có options và dòng ngắn -> option tiếp theo
        if (currentQuestion.rawOptions.length > 0 && line.length < 100 && !line.includes('?')) {
          currentQuestion.rawOptions.push(line);
          continue;
        }

        // Nếu là dòng chú thích thêm cho câu hỏi
        if (currentQuestion.rawOptions.length === 0) {
          currentQuestion.content += ' ' + line;
        }
      } else {
        if (!description) {
          description = line;
        }
      }
    }

    // Đẩy câu hỏi cuối cùng
    if (currentQuestion) {
      questions.push(this._finalizeQuestion(currentQuestion, questions.length + 1));
    }

    // Nếu văn bản không theo định dạng số, thử tách theo mỗi dòng có dấu ?
    if (questions.length === 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('?') || line.length > 10) {
          questions.push(this._finalizeQuestion({
            content: line,
            rawOptions: [],
            rows: null,
            columns: null,
            hasCheckboxOptions: false
          }, questions.length + 1));
        }
      }
    }

    // Ánh xạ Branching Logic đích đến đúng order_index của Section Header / Câu hỏi
    if (questions.length > 0) {
      this._resolveAndMapBranchingTargets(questions);
    }

    return {
      source: 'SMART_PASTE',
      title: title || 'Khảo sát mới',
      description: description || '',
      questions,
      questionCount: questions.length
    };
  }

  /**
   * Helper xác định loại câu hỏi từ nội dung và options trong Smart Text
   */
  _finalizeQuestion(rawQ, orderIndex) {
    let content = rawQ.content.trim();
    let isRequired = 0;

    // Kiểm tra cờ bắt buộc qua dấu * cuối câu hoặc cụm (bắt buộc)
    if (/\*$/.test(content) || /\*\s*$/.test(content) || /\(\s*bắt\s*buộc\s*\)|\[\s*bắt\s*buộc\s*\]|\(\s*required\s*\)/i.test(content)) {
      isRequired = 1;
      content = content.replace(/\s*\*+\s*$/, '').replace(/\(\s*bắt\s*buộc\s*\)|\[\s*bắt\s*buộc\s*\]|\(\s*required\s*\)/gi, '').trim();
    }

    let rows = rawQ.rows;
    let columns = rawQ.columns;

    // Kiểm tra nếu trong content có cú pháp ma trận Hàng x Cột: (Hàng: ... | Cột: ...)
    if (!rows && !columns) {
      const matrixMatch = content.match(/(?:hàng|rows)[:：]\s*([^|]+)\s*\|\s*(?:cột|columns)[:：]\s*(.*)$/i);
      if (matrixMatch) {
        rows = matrixMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
        columns = matrixMatch[2].split(/[,;]/).map(s => s.trim()).filter(Boolean);
        content = content.replace(/(?:\(|\[)?\s*(?:hàng|rows)[:：][^)]*(?:\)|\])?/gi, '').trim();
      }
    }

    // 1. Nếu có ma trận Hàng x Cột -> CHOICE_GRID hoặc CHECKBOX_GRID
    if (rows && columns && rows.length > 0 && columns.length > 0) {
      const isCheckbox = /hộp\s*kiểm|checkbox|nhiều/i.test(content) || /hộp\s*kiểm|checkbox/i.test(rawQ.content);
      const qType = isCheckbox ? 'CHECKBOX_GRID' : 'CHOICE_GRID';
      return {
        order_index: orderIndex,
        type: qType,
        content,
        is_required: isRequired,
        rows,
        columns,
        options: columns
      };
    }

    const options = rawQ.rawOptions.map(opt => opt.trim()).filter(Boolean);
    const hasCheckboxOptions = rawQ.hasCheckboxOptions || options.some(opt => /^\[[ xX]?\]/.test(opt));
    const cleanOptions = options.map(opt => opt.replace(/^\[[ xX]?\]\s*/, '').trim());

    // 2. Xếp hạng sao (RATING_STARS)
    if (/đánh\s*giá\s*sao|xếp\s*hạng\s*sao|số\s*sao|star\s*rating|(?:từ\s*)?1\s*(?:đến|-|–)\s*5\s*sao/i.test(content)) {
      return {
        order_index: orderIndex,
        type: 'RATING_STARS',
        content,
        is_required: isRequired,
        options: ['1', '2', '3', '4', '5']
      };
    }

    // 3. Thang đo tuyến tính (LINEAR_SCALE)
    const isLinear = /thang\s*(?:đo|điểm)|likert|(?:từ\s*)?1\s*(?:đến|-|–)\s*(?:5|10)|đánh\s*giá\s*mức\s*độ|rất\s*đồng\s*ý|mức\s*độ\s*hài\s*lòng/i.test(content);
    if (isLinear && cleanOptions.length <= 2) {
      const minLab = cleanOptions[0] || (/hài\s*lòng/i.test(content) ? 'Rất không hài lòng' : 'Hoàn toàn không đồng ý');
      const maxLab = cleanOptions[1] || (/hài\s*lòng/i.test(content) ? 'Rất hài lòng' : 'Hoàn toàn đồng ý');
      return {
        order_index: orderIndex,
        type: 'LINEAR_SCALE',
        content,
        is_required: isRequired,
        min_label: minLab,
        max_label: maxLab,
        options: ['1', '2', '3', '4', '5']
      };
    }

    // 3.5 Bắt buộc kiểu DROPDOWN nếu có dòng gợi ý "Chọn câu trả lời của bạn"
    if (rawQ.forceType === 'DROPDOWN') {
      return {
        order_index: orderIndex,
        type: 'DROPDOWN',
        content,
        is_required: isRequired,
        options: cleanOptions,
        placeholder: rawQ.placeholder || 'Chọn câu trả lời của bạn'
      };
    }

    // 4. Không có options -> Xét các dạng tự luận / input đặc thù
    if (cleanOptions.length === 0) {
      if (/ngày\s*(?:sinh|tháng|bắt\s*đầu|kết\s*thúc)|chọn\s*ngày|date/i.test(content)) {
        return { order_index: orderIndex, type: 'DATE_INPUT', content, is_required: isRequired, options: null };
      }
      if (/giờ|thời\s*gian\s*\((?:giờ|phút)\)|time/i.test(content)) {
        return { order_index: orderIndex, type: 'TIME_INPUT', content, is_required: isRequired, options: null };
      }
      if (/tải\s*(?:lên\s*)?tệp|đính\s*kèm\s*file|upload\s*file|tải\s*ảnh/i.test(content)) {
        return { order_index: orderIndex, type: 'FILE_UPLOAD', content, is_required: isRequired, options: null };
      }
      if (/đoạn\s*văn|tự\s*luận\s*dài|chia\s*sẻ\s*chi\s*tiết|mô\s*tả\s*cụ\s*thể|paragraph/i.test(content)) {
        const validation = rawQ.validation || this._extractValidationRule({ title: content, placeholder: rawQ.placeholder || '' });
        const qRes = { order_index: orderIndex, type: 'PARAGRAPH', content, is_required: isRequired, options: null };
        if (validation) {
          qRes.validation = validation;
          qRes.logic = { validation };
          qRes.placeholder = validation.placeholder || rawQ.placeholder || 'Nhập câu trả lời của bạn';
        } else if (rawQ.placeholder) {
          qRes.placeholder = rawQ.placeholder;
        }
        return qRes;
      }
      const validation = rawQ.validation || this._extractValidationRule({ title: content, placeholder: rawQ.placeholder || '' });
      const qRes = { order_index: orderIndex, type: 'SHORT_TEXT', content, is_required: isRequired, options: null };
      if (validation) {
        qRes.validation = validation;
        qRes.logic = { validation };
        qRes.placeholder = validation.placeholder || rawQ.placeholder || 'Nhập câu trả lời của bạn';
      } else if (rawQ.placeholder) {
        qRes.placeholder = rawQ.placeholder;
      }
      return qRes;
    }

    // 5. Menu thả xuống (DROPDOWN)
    if (/menu\s*thả\s*xuống|dropdown|danh\s*sách\s*thả/i.test(content)) {
      return {
        order_index: orderIndex,
        type: 'DROPDOWN',
        content,
        is_required: isRequired,
        options: cleanOptions
      };
    }

    // 6. Trắc nghiệm chọn nhiều (MULTIPLE_CHOICE)
    const isMultiple = hasCheckboxOptions || /chọn\s*nhiều|nhiều\s*đáp\s*án|chọn\s*tất\s*cả|các\s*lựa\s*chọn\s*phù\s*hợp|hộp\s*kiểm|multiple/i.test(content);
    if (isMultiple) {
      return {
        order_index: orderIndex,
        type: 'MULTIPLE_CHOICE',
        content,
        is_required: isRequired,
        options: cleanOptions
      };
    }

    // 7. Mặc định là Trắc nghiệm 1 lựa chọn (SINGLE_CHOICE)
    return {
      order_index: orderIndex,
      type: 'SINGLE_CHOICE',
      content,
      is_required: isRequired,
      options: cleanOptions
    };
  }

  /**
   * Hậu xử lý và ánh xạ toàn diện Branching Logic (Rẽ nhánh điều hướng)
   * Chuẩn hóa các target từ Google Section ID, Microsoft Question ID, hoặc Tên phân đoạn
   * về đúng order_index của Section Header / Câu hỏi đích trong danh sách questions của VibeSurvey.
   */
  _resolveAndMapBranchingTargets(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return questions;
    }

    // 1. Thu thập danh sách Section Headers và lập các bản đồ chỉ mục
    const sectionHeaders = [];
    const originIdMap = new Map();
    const orderIndexMap = new Map();

    for (const q of questions) {
      if (!q) continue;
      if (q.origin_id !== undefined && q.origin_id !== null && q.origin_id !== '') {
        originIdMap.set(String(q.origin_id).trim(), q);
      }
      if (q.order_index !== undefined && q.order_index !== null) {
        orderIndexMap.set(Number(q.order_index), q);
      }
      if (q.type === 'SECTION_HEADER') {
        sectionHeaders.push(q);
      }
    }

    // Helper chuẩn hóa chuỗi để so sánh linh hoạt (bỏ dấu tiếng Việt, ký tự đặc biệt, khoảng trắng thừa)
    const cleanFuzzy = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const cleanStrict = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str.toLowerCase().replace(/\s+/g, ' ').trim();
    };

    // Helper tìm câu hỏi / phân đoạn đích
    const findTargetQuestion = (rawTarget, optLabel) => {
      // 1. Kiểm tra rawTarget trực tiếp
      if (rawTarget !== null && rawTarget !== undefined && rawTarget !== '') {
        const targetStr = String(rawTarget).trim();

        // 1.1 Khớp theo origin_id (Google Section ID, Microsoft Question ID)
        if (originIdMap.has(targetStr)) {
          return originIdMap.get(targetStr);
        }

        // 1.2 Khớp nếu rawTarget là số thứ tự order_index hợp lệ
        const numTgt = parseInt(targetStr, 10);
        if (!isNaN(numTgt) && orderIndexMap.has(numTgt)) {
          return orderIndexMap.get(numTgt);
        }

        // 1.3 Khớp theo tiêu đề Section Header
        const targetStrict = cleanStrict(targetStr);
        const targetFuzzy = cleanFuzzy(targetStr);

        for (const sec of sectionHeaders) {
          const secContent = sec.content || '';
          const secStrict = cleanStrict(secContent);
          const secFuzzy = cleanFuzzy(secContent);

          if (secStrict === targetStrict || secFuzzy === targetFuzzy) {
            return sec;
          }
          if (targetFuzzy.length >= 3 && (secFuzzy.includes(targetFuzzy) || targetFuzzy.includes(secFuzzy))) {
            return sec;
          }
        }
      }

      // 2. Nếu chưa tìm được bằng rawTarget, thử khớp với optLabel (nhãn của lựa chọn)
      if (optLabel && typeof optLabel === 'string') {
        const optStrict = cleanStrict(optLabel);
        const optFuzzy = cleanFuzzy(optLabel);

        // 2.1 Khớp chính xác hoàn toàn với tiêu đề Section
        for (const sec of sectionHeaders) {
          const secContent = sec.content || '';
          if (cleanStrict(secContent) === optStrict || cleanFuzzy(secContent) === optFuzzy) {
            return sec;
          }
        }

        // 2.2 Tên Section chứa tên lựa chọn (ví dụ: optLabel = "Truyền thông", sec.content = "Tiểu ban Truyền thông")
        if (optFuzzy.length >= 3) {
          for (const sec of sectionHeaders) {
            const secFuzzy = cleanFuzzy(sec.content || '');
            if (secFuzzy.includes(optFuzzy)) {
              return sec;
            }
          }
        }

        // 2.3 Tên lựa chọn chứa tên Section (ví dụ: optLabel = "Chuyển đến phần Thông tin liên hệ", sec.content = "Thông tin liên hệ")
        for (const sec of sectionHeaders) {
          const secFuzzy = cleanFuzzy(sec.content || '');
          if (secFuzzy.length >= 3 && optFuzzy.includes(secFuzzy)) {
            return sec;
          }
        }
      }

      return null;
    };

    // Helper kiểm tra hành động kết thúc nộp bài
    const isSubmitAction = (action, target) => {
      const actStr = String(action || '').toUpperCase();
      const tgtStr = String(target || '').toUpperCase();
      return (
        actStr === 'SUBMIT_FORM' ||
        actStr === 'SUBMIT' ||
        actStr === '3' ||
        tgtStr === 'SUBMIT' ||
        tgtStr === 'SUBMIT_FORM' ||
        tgtStr === '-1' ||
        tgtStr === 'ENDOFFORM'
      );
    };

    // Helper kiểm tra hành động chuyển sang trang tiếp theo
    const isNextPageAction = (action, target) => {
      const actStr = String(action || '').toUpperCase();
      const tgtStr = String(target || '').toUpperCase();
      return (
        actStr === 'NEXT_PAGE' ||
        actStr === 'NEXT_SECTION' ||
        actStr === 'NEXT' ||
        actStr === '1' ||
        tgtStr === 'NEXT'
      );
    };

    // Helper kiểm tra hành động làm lại từ đầu
    const isRestartAction = (action) => {
      const actStr = String(action || '').toUpperCase();
      return actStr === 'RESTART_FORM' || actStr === 'RESTART' || actStr === '4';
    };

    // 2. Duyệt từng câu hỏi để xử lý Branching Logic
    for (const q of questions) {
      if (!q) continue;

      // A. Xử lý cho câu hỏi Choice có logic.options
      if (['SINGLE_CHOICE', 'DROPDOWN'].includes(q.type)) {
        // Tự động suy luận logic rẽ nhánh nếu các lựa chọn khớp với các Section Headers
        if ((!q.logic || !q.logic.options) && Array.isArray(q.options) && q.options.length >= 2 && sectionHeaders.length >= 2) {
          const inferredOptions = {};
          let matchedCount = 0;
          const matchedSecOrders = new Set();

          for (let i = 0; i < q.options.length; i++) {
            const opt = q.options[i];
            const matchedSec = findTargetQuestion(null, opt);
            if (matchedSec && matchedSec.order_index !== q.order_index) {
              inferredOptions[opt] = {
                action: 'GO_TO_PAGE',
                target: matchedSec.order_index
              };
              matchedCount++;
              matchedSecOrders.add(matchedSec.order_index);
            }
          }

          // Nếu có ít nhất 2 options trỏ đến 2 phân đoạn khác nhau -> Kích hoạt logic tự động
          if (matchedCount >= 2 && matchedSecOrders.size >= 2) {
            q.logic = q.logic || {};
            q.logic.enabled = true;
            q.logic.options = inferredOptions;
          }
        }

        // Xử lý và chuẩn hóa các logic.options hiện có
        if (q.logic && q.logic.options && typeof q.logic.options === 'object') {
          const resolvedOptions = {};

          for (const [key, rawRule] of Object.entries(q.logic.options)) {
            if (!rawRule) continue;

            let rawAction = typeof rawRule === 'object' ? rawRule.action : rawRule;
            let rawTarget = typeof rawRule === 'object' ? rawRule.target : null;

            // Nếu rawRule là chuỗi đơn (ví dụ: "SUBMIT" hoặc "5" hoặc ID)
            if (typeof rawRule === 'string') {
              if (isSubmitAction(rawRule, rawRule)) {
                rawAction = 'SUBMIT_FORM';
                rawTarget = null;
              } else if (isNextPageAction(rawRule, rawRule)) {
                rawAction = 'NEXT_PAGE';
                rawTarget = null;
              } else {
                rawAction = 'GO_TO_PAGE';
                rawTarget = rawRule;
              }
            }

            if (isSubmitAction(rawAction, rawTarget)) {
              resolvedOptions[key] = {
                action: 'SUBMIT_FORM',
                target: null
              };
              continue;
            }

            if (isRestartAction(rawAction)) {
              resolvedOptions[key] = {
                action: 'RESTART_FORM',
                target: null
              };
              continue;
            }

            // Tìm câu hỏi / Section Header đích
            const targetQ = findTargetQuestion(rawTarget, key);
            if (targetQ) {
              resolvedOptions[key] = {
                action: 'GO_TO_PAGE',
                target: targetQ.order_index
              };
            } else if (isNextPageAction(rawAction, rawTarget)) {
              resolvedOptions[key] = {
                action: 'NEXT_PAGE',
                target: null
              };
            } else if (rawTarget !== null && rawTarget !== undefined && rawTarget !== '') {
              const numVal = parseInt(rawTarget, 10);
              resolvedOptions[key] = {
                action: 'GO_TO_PAGE',
                target: !isNaN(numVal) ? numVal : String(rawTarget)
              };
            }
          }

          if (Object.keys(resolvedOptions).length > 0) {
            q.logic.enabled = true;
            q.logic.options = resolvedOptions;

            // Đồng bộ thêm cả key theo số thứ tự (index 0, 1, 2) nếu có mảng options
            if (Array.isArray(q.options)) {
              q.options.forEach((optText, optIdx) => {
                if (resolvedOptions[optText] && resolvedOptions[optIdx] === undefined) {
                  resolvedOptions[optIdx] = resolvedOptions[optText];
                }
              });
            }
          }
        }
      }

      // B. Xử lý điều hướng cuối phân đoạn của SECTION_HEADER
      if (q.type === 'SECTION_HEADER' && q.logic) {
        const rawDefAction = q.logic.default_action || q.logic.action;
        const rawTarget = q.logic.target;

        if (isSubmitAction(rawDefAction, rawTarget)) {
          q.logic.default_action = 'SUBMIT_FORM';
          q.logic.target = null;
        } else if (isRestartAction(rawDefAction)) {
          q.logic.default_action = 'RESTART_FORM';
          q.logic.target = null;
        } else if (rawTarget !== null && rawTarget !== undefined && rawTarget !== '') {
          const targetQ = findTargetQuestion(rawTarget, null);
          if (targetQ) {
            q.logic.default_action = 'GO_TO_PAGE';
            q.logic.target = targetQ.order_index;
          } else if (isNextPageAction(rawDefAction, rawTarget)) {
            q.logic.default_action = 'NEXT_PAGE';
            q.logic.target = null;
          }
        } else if (isNextPageAction(rawDefAction, null)) {
          q.logic.default_action = 'NEXT_PAGE';
          q.logic.target = null;
        }
      }
    }

    return questions;
  }
}

module.exports = new FormParserService();
