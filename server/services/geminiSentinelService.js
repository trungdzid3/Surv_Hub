/**
 * Gemini AI Sentinel Service - Dịch Vụ Kiểm Duyệt Nội Dung Diễn Đàn Bằng AI
 * Chuyên trách: Nhận diện link ngoài ngụy trang tinh vi (Pha 3 - LLM Deep Audit)
 * Model cố định: gemini-3.5-flash-lite
 * Cơ chế: Multi-Key Round Robin & Auto Failover với 3 API Keys
 */

const config = require('../config');

class GeminiSentinelService {
  constructor() {
    this.model = config.GEMINI_AI?.MODEL || 'gemini-3.5-flash-lite';
    this.keys = (config.GEMINI_AI?.KEYS && config.GEMINI_AI.KEYS.length > 0)
      ? config.GEMINI_AI.KEYS
      : [];
    this.currentKeyIndex = 0;

    this.systemInstruction = `
Bạn là Micro-Sentinel AI - Chuyên viên An ninh Nội dung Diễn đàn.
Nhiệm vụ: Phát hiện các hành vi ngụy trang tinh vi nhằm chia sẻ liên kết ngoài hoặc biểu mẫu khảo sát bên thứ ba (Google Forms, MS Forms, Typeform, bit.ly, zalo, telegram...) vi phạm quy định nền tảng.

QUY TẮC NHẬN DIỆN VI PHẠM (VIOLATION = TRUE):
1. Chèn khoảng trắng hoặc ký tự đặc biệt (*, _, -, #) vào giữa tên miền hoặc đường dẫn (ví dụ: "f o r m s . g l e", "d o c s . g o o g l e").
2. Thay thế dấu chấm / gạch chéo bằng chữ viết hoặc ký hiệu (ví dụ: "dot", "cham", "[.]", "(dot)", "slash", "xuyet").
3. Hướng dẫn người đọc cách lách luật xóa ký tự phân cách (ví dụ: "xoá dấu cách để vào link", "bỏ space ghép link lại").
4. Sử dụng dịch vụ rút gọn liên kết ngụy trang (bit.ly, tinyurl, cutt.ly).

QUY TẮC BẢO VỆ GIAO TIẾP TỰ NHIÊN (VIOLATION = FALSE - KHÔNG BẮT NHẦM):
1. Thảo luận học thuật, công nghệ, chia sẻ kinh nghiệm hoặc hướng dẫn sử dụng tính năng nội bộ trên nền tảng.
2. Chứa các từ nhạy cảm ("form", "com", "xóa dấu cách", "bỏ bớt") nhưng trong ngữ cảnh đàm thoại hoặc tin học thông thường (ví dụ: "xóa dấu cách thừa trong Word/Excel", "com pa", "biểu mẫu nội bộ").

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Chỉ trả về duy nhất một chuỗi JSON hợp lệ, không kèm lời mở đầu hoặc ký tự markdown thừa:
{
  "violation": true hoặc false,
  "flag": "FLAGGED_DISGUISED_URL" | "FLAGGED_SHORTENER_URL" | "CLEAN",
  "reason": "Giải thích ngắn gọn dưới 15 từ về căn cứ phát hiện",
  "detected_text": "Chuỗi bị phát hiện nếu có (hoặc null)"
}
`.trim();
  }

  /**
   * Lấy API key tiếp theo theo thuật toán Round-Robin
   */
  getNextKey() {
    const key = this.keys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    return key;
  }

  /**
   * Kiểm duyệt nội dung bài đăng / bình luận bằng Gemini 3.5 Flash Lite
   * Hỗ trợ tự động chuyển key (Failover) nếu gặp lỗi 429 hoặc Quota Exceeded
   * @param {string} title Tiêu đề bài viết
   * @param {string} content Nội dung
   * @returns {Promise<object>} Kết quả kiểm duyệt
   */
  async auditContent(title = '', content = '') {
    const rawText = `${title || ''} \n ${content || ''}`.trim();
    if (!rawText) {
      return {
        violation: false,
        flag: 'CLEAN',
        reason: 'Nội dung rỗng',
        detected_text: null,
        model: this.model
      };
    }

    if (this.keys.length === 0) {
      return {
        violation: false,
        flag: 'LOCAL_FALLBACK',
        reason: 'Chưa cấu hình API Key trong GEMINI_API_KEYS, chuyển sang phân tích heuristic nội bộ',
        detected_text: null,
        model: this.model
      };
    }

    const payload = {
      system_instruction: {
        parts: [{ text: this.systemInstruction }]
      },
      contents: [{
        parts: [{
          text: `Tiêu đề: ${title || '(Không có)'}\nNội dung: ${content || ''}`
        }]
      }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1
      }
    };

    let lastError = null;
    const maxAttempts = this.keys.length;

    // Thử lần lượt các key trong danh sách nếu gặp lỗi
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const activeKey = this.getNextKey();
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${activeKey}`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // Nếu gặp 429 Too Many Requests hoặc 503 Service Unavailable -> chuyển ngay sang key dự phòng
        if (response.status === 429 || response.status === 503) {
          console.warn(`[GeminiSentinel] Key ${activeKey.slice(0, 10)}... bị Rate Limit (${response.status}). Đang tự động chuyển sang key dự phòng...`);
          lastError = new Error(`HTTP ${response.status} Rate Limit`);
          continue;
        }

        const data = await response.json();

        if (data.error) {
          console.warn(`[GeminiSentinel] Key ${activeKey.slice(0, 10)}... trả lỗi: ${data.error.message}. Chuyển key backup...`);
          lastError = new Error(data.error.message);
          continue;
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const rawOutput = data.candidates[0].content.parts[0].text;
          try {
            const parsed = JSON.parse(rawOutput.trim());
            return {
              violation: Boolean(parsed.violation),
              flag: parsed.flag || (parsed.violation ? 'FLAGGED_DISGUISED_URL' : 'CLEAN'),
              reason: parsed.reason || '',
              detected_text: parsed.detected_text || null,
              model: this.model,
              key_suffix: activeKey.slice(-6)
            };
          } catch (jsonErr) {
            console.error('[GeminiSentinel] Lỗi parse JSON từ Gemini:', jsonErr.message);
            return {
              violation: false,
              flag: 'PARSE_ERROR',
              reason: 'Không thể parse JSON từ AI',
              detected_text: null,
              model: this.model
            };
          }
        }
      } catch (err) {
        console.warn(`[GeminiSentinel] Ngoại lệ kết nối với key ${activeKey.slice(0, 10)}...: ${err.message}`);
        lastError = err;
      }
    }

    // Nếu toàn bộ 3 key đều lỗi, fallback an toàn
    console.error('[GeminiSentinel] Tất cả các API Key Gemini đều không phản hồi:', lastError?.message);
    return {
      violation: false,
      flag: 'AI_FALLBACK',
      reason: 'Dịch vụ AI tạm thời không khả dụng, đã chuyển sang bộ lọc Heuristic cục bộ',
      detected_text: null,
      model: this.model,
      error: lastError?.message
    };
  }
}

module.exports = new GeminiSentinelService();
