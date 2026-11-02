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
   * Helper loại bỏ dấu tiếng Việt chuẩn
   */
  _stripAccents(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  /**
   * Tự động nhận diện và phân loại khảo sát sang 8 danh mục chuẩn dựa trên tiêu đề, mô tả và nội dung câu hỏi:
   * 1. 'Công nghệ & AI' (TECH)
   * 2. 'Kinh doanh & Thị trường' (BUSINESS)
   * 3. 'Tài chính & Ngân hàng' (FINANCE)
   * 4. 'Khoa học Xã hội & Tâm lý' (SOCIAL)
   * 5. 'Y tế & Sức khỏe' (HEALTH)
   * 6. 'Giáo dục & Học thuật' (EDU)
   * 7. 'Thiết kế & Trải nghiệm UX' (DESIGN)
   * 8. 'Đa ngành & Lĩnh vực khác' (OTHER)
   * @param {string} title Tiêu đề khảo sát
   * @param {string} [description=''] Mô tả khảo sát
   * @param {Array} [questions=[]] Danh sách câu hỏi
   * @returns {string} Tên danh mục chuẩn
   */
  detectCategory(title = '', description = '', questions = []) {
    const titleStr = typeof title === 'string' ? title.trim() : '';
    const descStr = typeof description === 'string' ? description.trim() : '';
    let questionsText = '';
    if (Array.isArray(questions) && questions.length > 0) {
      questionsText = questions
        .slice(0, 15)
        .map(q => {
          if (!q) return '';
          const c = q.content || q.title || '';
          const opts = Array.isArray(q.options) ? q.options.join(' ') : '';
          return `${c} ${opts}`;
        })
        .join(' ');
    }

    const tLower = titleStr.toLowerCase();
    const dLower = descStr.toLowerCase();
    const qLower = questionsText.toLowerCase();

    const tNoAccent = this._stripAccents(titleStr);
    const dNoAccent = this._stripAccents(descStr);
    const qNoAccent = this._stripAccents(questionsText);

    // Định nghĩa tập regex và từ khóa chuyên biệt cho 7 nhóm lĩnh vực (hỗ trợ cả tiếng Việt có dấu và không dấu)
    const rules = [
      {
        category: 'Công nghệ & AI',
        patterns: [
          /\b(?:ai|trí tuệ nhân tạo|tri tue nhan tao|chatgpt|gpt|gemini|copilot|claude|deepseek|llm|genai|prompt)\b/i,
          /\b(?:công nghệ|cong nghe|phần mềm|phan mem|lập trình|lap trinh|developer|coder|source code|mã nguồn|it|cntt|khoa học máy tính|khoa hoc may tinh|computer science)\b/i,
          /\b(?:thuật toán|thuat toan|algorithm|machine learning|học máy|hoc may|deep learning|data science|khoa học dữ liệu|khoa hoc du lieu|big data|dữ liệu lớn|du lieu lon|cloud computing|điện toán đám mây|cybersecurity|an ninh mạng|an ninh mang|an toàn thông tin|blockchain|web3|iot|internet vạn vật)\b/i,
          /\b(?:ứng dụng số|ung dung so|chuyển đổi số|chuyen doi so|app di động|app di dong|mobile app|hệ điều hành|operating system|database|cơ sở dữ liệu)\b/i
        ]
      },
      {
        category: 'Tài chính & Ngân hàng',
        patterns: [
          /\b(?:tài chính|tai chinh|ngân hàng|ngan hang|banking|bank|fintech|ví điện tử|vi dien tu|momo|zalopay|vnpay|shopeepay|vietqr)\b/i,
          /\b(?:thanh toán số|thanh toan so|chuyển tiền|chuyen tien|tín dụng|tin dung|thẻ tín dụng|the tin dung|credit card|cho vay|khoản vay|khoan vay|vay vốn|vay von|lãi suất|lai suat|tiết kiệm|tiet kiem|gửi tiết kiệm)\b/i,
          /\b(?:đầu tư|dau tu|chứng khoán|chung khoan|cổ phiếu|co phieu|trái phiếu|trai phieu|crypto|tiền mã hóa|tien ma hoa|tiền số|tien so|bitcoin|ethereum|bảo hiểm|bao hiem|bảo hiểm nhân thọ)\b/i,
          /\b(?:quản lý chi tiêu|quan ly chi tieu|thu nhập cá nhân|thu nhap ca nhan|tài chính cá nhân|tai chinh ca nhan|tài chính doanh nghiệp)\b/i
        ]
      },
      {
        category: 'Y tế & Sức khỏe',
        patterns: [
          /\b(?:y tế|y te|sức khỏe|suc khoe|chăm sóc sức khỏe|cham soc suc khoe|healthcare|medical|bệnh viện|benh vien|phòng khám|phong kham|bác sĩ|bac si|y tá|y ta|điều dưỡng|dieu duong)\b/i,
          /\b(?:khám chữa bệnh|kham chua benh|điều trị|dieu tri|bệnh nhân|benh nhan|dược phẩm|duoc pham|nhà thuốc|nha thuoc|thuốc tây|thuoc tay|vắc xin|vac xin|tiêm chủng|tiem chung|dịch bệnh|dich benh|covid)\b/i,
          /\b(?:dinh dưỡng|dinh duong|thực phẩm chức năng|thuc pham chuc nang|chế độ ăn|che do an|ăn kiêng|an kieng|thể dục|the duc|thể thao|the thao|gym|fitness|yoga|giấc ngủ|giac ngu|thị lực|thi luc|nha khoa|răng miệng|rang mieng|tâm thần|tam than|thể chất|the chat)\b/i
        ]
      },
      {
        category: 'Thiết kế & Trải nghiệm UX',
        patterns: [
          /\b(?:thiết kế|thiet ke|design|ui|ux|ui\/ux|giao diện|giao dien|trải nghiệm người dùng|trai nghiem nguoi dung|user experience|user interface)\b/i,
          /\b(?:đồ họa|do hoa|graphic design|figma|adobe|photoshop|illustrator|prototype|mockup|wireframe|tính khả dụng|tinh kha dung|usability|thẩm mỹ|tham my|phối màu|phoi mau|typography)\b/i
        ]
      },
      {
        category: 'Khoa học Xã hội & Tâm lý',
        patterns: [
          /\b(?:khoa học xã hội|khoa hoc xa hoi|xã hội học|xa hoi hoc|tâm lý|tam ly|tâm lý học|tam ly hoc|psychology|stress|căng thẳng|cang thang|trầm cảm|tram cam|lo âu|lo au|cảm xúc|cam xuc|sức khỏe tinh thần|suc khoe tinh than|mental health)\b/i,
          /\b(?:hành vi xã hội|hanh vi xa hoi|mối quan hệ|moi quan he|gia đình|gia dinh|bạn bè|ban be|tình cảm|tinh cam|hôn nhân|hon nhan|cộng đồng|cong dong|bình đẳng giới|binh dang gioi|nhận thức xã hội|nhan thuc xa hoi|văn hóa xã hội|van hoa xa hoi|mạng xã hội|mang xa hoi)\b/i
        ]
      },
      {
        category: 'Giáo dục & Học thuật',
        patterns: [
          /\b(?:giáo dục|giao duc|học thuật|hoc thuat|trường học|truong hoc|đại học|dai hoc|cao đẳng|cao dang|sinh viên|sinh vien|học sinh|hoc sinh|giảng viên|giang vien|giáo viên|giao vien|thầy cô|thay co|nghiên cứu khoa học|nghien cuu khoa hoc|nckh)\b/i,
          /\b(?:luận văn|luan van|khóa luận|khoa luan|đồ án|do an|tiểu luận|tieu luan|học tập|hoc tap|học kỳ|hoc ky|ôn thi|on thi|thi cử|thi cu|điểm số|diem so|học bổng|hoc bong|phương pháp học|phuong phap hoc|elearning|e-learning|đào tạo|dao tao|edtech|học trực tuyến|tốt nghiệp|tot nghiep)\b/i
        ]
      },
      {
        category: 'Kinh doanh & Thị trường',
        patterns: [
          /\b(?:kinh doanh|thị trường|thi truong|thương mại|thuong mai|fmcg|bán lẻ|ban le|retail|tiêu dùng|tieu dung|người tiêu dùng|nguoi tieu dung|khách hàng|khach hang|hành vi mua sắm|hanh vi mua sam|hành vi tiêu dùng|hanh vi tieu dung|thói quen tiêu dùng|thoi quen tieu dung)\b/i,
          /\b(?:thương hiệu|thuong hieu|brand|marketing|quảng cáo|quang cao|tiếp thị|tiep thi|bán hàng|ban hang|sales|doanh nghiệp|doanh nghiep|công ty|cong ty|startup|khởi nghiệp|khoi nghiep|chuỗi cung ứng|chuoi cung ung|supply chain|xuất nhập khẩu|xuat nhap khau|thương mại điện tử|thuong mai dien tu|e-commerce|shopee|lazada|tiki|tiktok shop|ẩm thực|thức uống|trà sữa|tra sua|cà phê|ca phe|dịch vụ|dich vu|sản phẩm|san pham)\b/i
        ]
      }
    ];

    // Chấm điểm cho từng danh mục: Tiêu đề x5 điểm, Mô tả x2 điểm, Câu hỏi x1 điểm
    let bestCategory = null;
    let highestScore = 0;

    for (const rule of rules) {
      let score = 0;
      for (const p of rule.patterns) {
        if (p.test(tLower) || p.test(tNoAccent)) score += 5;
        if (p.test(dLower) || p.test(dNoAccent)) score += 2;
        if ((qLower && p.test(qLower)) || (qNoAccent && p.test(qNoAccent))) score += 1;
      }
      if (score > highestScore) {
        highestScore = score;
        bestCategory = rule.category;
      }
    }

    if (highestScore > 0 && bestCategory) {
      return bestCategory;
    }

    // Mặc định thông minh khi không có điểm vượt trội
    const fullCombined = `${tLower} ${dLower} ${tNoAccent} ${dNoAccent}`;
    if (/(?:sinh viên|sinh vien|học sinh|hoc sinh|học thuật|hoc thuat|luận văn|luan van|đồ án|do an|đại học|dai hoc|nghiên cứu|nghien cuu)/i.test(fullCombined)) {
      return 'Giáo dục & Học thuật';
    }
    if (/(?:kinh doanh|thị trường|thi truong|tiêu dùng|tieu dung|sản phẩm|san pham|khách hàng|khach hang|thương hiệu|thuong hieu)/i.test(fullCombined)) {
      return 'Kinh doanh & Thị trường';
    }

    // Nếu tiêu đề rỗng hoặc hoàn toàn chung chung
    if (!titleStr) {
      return 'Đa ngành & Lĩnh vực khác';
    }

    return 'Kinh doanh & Thị trường';
  }

  /**
   * Chuẩn hóa danh mục đầu vào sang 8 danh mục chuẩn của hệ thống VibeSurvey
   * @param {string} [category] Danh mục đầu vào hoặc mã phân loại
   * @param {string} [title=''] Tiêu đề khảo sát (dùng để suy luận tự động)
   * @param {string} [description=''] Mô tả khảo sát
   * @param {Array} [questions=[]] Danh sách câu hỏi
   * @returns {string} Tên danh mục chuẩn
   */
  normalizeCategory(category, title = '', description = '', questions = []) {
    const raw = (category && typeof category === 'string') ? category.trim() : '';

    const STANDARD_LIST = [
      'Công nghệ & AI',
      'Kinh doanh & Thị trường',
      'Tài chính & Ngân hàng',
      'Khoa học Xã hội & Tâm lý',
      'Y tế & Sức khỏe',
      'Giáo dục & Học thuật',
      'Thiết kế & Trải nghiệm UX',
      'Đa ngành & Lĩnh vực khác'
    ];

    // 1. Nếu đã thuộc danh mục chuẩn
    if (STANDARD_LIST.includes(raw)) {
      return raw;
    }

    const upper = raw.toUpperCase();

    // 2. Ánh xạ từ mã code chuẩn
    const codeMap = {
      'TECH': 'Công nghệ & AI',
      'IT': 'Công nghệ & AI',
      'AI': 'Công nghệ & AI',
      'BUSINESS': 'Kinh doanh & Thị trường',
      'MARKET': 'Kinh doanh & Thị trường',
      'FMCG': 'Kinh doanh & Thị trường',
      'FINANCE': 'Tài chính & Ngân hàng',
      'BANKING': 'Tài chính & Ngân hàng',
      'SOCIAL': 'Khoa học Xã hội & Tâm lý',
      'PSYCHOLOGY': 'Khoa học Xã hội & Tâm lý',
      'HEALTH': 'Y tế & Sức khỏe',
      'MEDICAL': 'Y tế & Sức khỏe',
      'EDU': 'Giáo dục & Học thuật',
      'ACADEMIC': 'Giáo dục & Học thuật',
      'EDUCATION': 'Giáo dục & Học thuật',
      'DESIGN': 'Thiết kế & Trải nghiệm UX',
      'UIUX': 'Thiết kế & Trải nghiệm UX',
      'UI_UX': 'Thiết kế & Trải nghiệm UX',
      'OTHER': 'Đa ngành & Lĩnh vực khác',
      'GENERAL': 'Đa ngành & Lĩnh vực khác',
      'ALL': 'Đa ngành & Lĩnh vực khác'
    };

    if (codeMap[upper]) {
      return codeMap[upper];
    }

    const lower = raw.toLowerCase();

    // 3. Nếu là giá trị cũ 'Thị trường' hoặc không truyền danh mục:
    // Thử phân tích ngữ nghĩa thông minh từ tiêu đề/mô tả trước
    if (!raw || lower === 'thị trường' || lower === 'thi truong') {
      const detected = this.detectCategory(title, description, questions);
      if (detected) {
        return detected;
      }
      return 'Kinh doanh & Thị trường';
    }

    // 4. Ánh xạ các biến thể tiếng Việt cũ
    if (lower.includes('công nghệ') || lower.includes('phần mềm') || lower.includes('trí tuệ nhân tạo') || lower.includes('khoa học máy tính')) {
      return 'Công nghệ & AI';
    }
    if (lower.includes('tài chính') || lower.includes('ngân hàng')) {
      return 'Tài chính & Ngân hàng';
    }
    if (lower.includes('xã hội') || lower.includes('tâm lý')) {
      return 'Khoa học Xã hội & Tâm lý';
    }
    if (lower.includes('sức khỏe') || lower.includes('y tế') || lower.includes('đời sống')) {
      return 'Y tế & Sức khỏe';
    }
    if (lower.includes('thiết kế') || lower.includes('trải nghiệm ux') || lower.includes('sản phẩm ux') || lower.includes('ui')) {
      return 'Thiết kế & Trải nghiệm UX';
    }
    if (lower.includes('học thuật') || lower.includes('giáo dục') || lower.includes('sinh viên') || lower.includes('luận văn') || lower.includes('đào tạo')) {
      return 'Giáo dục & Học thuật';
    }
    if (lower.includes('kinh doanh') || lower.includes('thương mại') || lower.includes('thị trường') || lower.includes('fmcg') || lower.includes('kinh tế') || lower.includes('quản trị') || lower.includes('bán lẻ')) {
      return 'Kinh doanh & Thị trường';
    }
    if (lower.includes('khác') || lower.includes('đa ngành')) {
      return 'Đa ngành & Lĩnh vực khác';
    }

    // 5. Fallback cuối cùng dựa trên nội dung biểu mẫu
    return this.detectCategory(title || raw, description, questions);
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
   * Chuẩn hóa URL biểu mẫu:
   * Chuyển đổi link thiết kế / chia sẻ Microsoft Forms (DesignPageV2.aspx, DesignPage.aspx, ShareFormPage)
   * sang đường dẫn phản hồi công khai chuẩn: ResponsePage.aspx?id=...
   */
  normalizeFormUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
    try {
      const trimmed = rawUrl.trim();
      const parsed = new URL(trimmed);
      const lowerHref = parsed.href.toLowerCase();
      const lowerPath = (parsed.pathname || '').toLowerCase();
      if (
        lowerPath.includes('designpagev2.aspx') ||
        lowerPath.includes('designpage.aspx') ||
        lowerHref.includes('shareformpage') ||
        lowerHref.includes('designpage')
      ) {
        const formId = parsed.searchParams.get('id');
        if (formId) {
          const hostname = parsed.hostname.toLowerCase();
          const targetHost = (hostname === 'forms.office.com') ? 'forms.office.com' : 'forms.cloud.microsoft';
          return `https://${targetHost}/Pages/ResponsePage.aspx?id=${formId}`;
        }
      }
      return trimmed;
    } catch (e) {
      return rawUrl;
    }
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

    const normalizedUrl = this.normalizeFormUrl(rawUrl);

    let parsed;
    try {
      parsed = new URL(normalizedUrl.trim());
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

    const category = this.detectCategory(title, description, questions);

    return {
      source: 'GOOGLE_FORM',
      title,
      description,
      category,
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

    const category = this.detectCategory(title, description, questions);

    return {
      source: 'GOOGLE_FORMS_API',
      title,
      description,
      category,
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
        if (str.title || str.placeholder || str.subtitle || str.description) {
          text = `${str.title || ''} ${str.subtitle || ''} ${str.placeholder || ''} ${str.description || ''}`.trim();
        } else {
          text = JSON.stringify(str);
        }
      } catch (e) {
        return null;
      }
    }
    if (!text || typeof text !== 'string') return null;

    const makeRange = (n1, n2) => {
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
    };

    // 0. Làm sạch định dạng ngày tháng ISO, ngày tháng thông thường, timestamp và số điện thoại
    const sanitizedText = text
      .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:T\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?/gi, ' ')
      .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, ' ')
      .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g, ' ')
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
      .replace(/\b0\d{1,3}[-.]\d{3,4}[-.]\d{3,4}\b/g, ' ');

    // 1. Cặp số trong mảng JSON: ["20000000", "20270000"] hoặc [20000000, 20270000]
    const jsonArrMatch = sanitizedText.match(/\[\s*["']?(\d+(?:[.,]\d+)?)["']?\s*,\s*["']?(\d+(?:[.,]\d+)?)["']?\s*\]/);
    if (jsonArrMatch) {
      const n1 = parseFloat(jsonArrMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(jsonArrMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return makeRange(n1, n2);
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
      const mMin = sanitizedText.match(pair.min);
      const mMax = sanitizedText.match(pair.max);
      if (mMin && mMax) {
        const n1 = parseFloat(mMin[1].replace(/,/g, ''));
        const n2 = parseFloat(mMax[1].replace(/,/g, ''));
        if (!isNaN(n1) && !isNaN(n2)) {
          return makeRange(n1, n2);
        }
      }
    }

    // 3. Bắt trọn mẫu tiếng Việt & tự nhiên: "số phải nằm trong khoảng từ ... đến ...", "trong khoảng ... đến ...", "từ ... ~ ..."
    const vnPattern = /(?:số\s*phải\s*nằm\s*trong\s*khoảng\s*(?:từ)?|nằm\s*trong\s*khoảng\s*(?:từ)?|trong\s*khoảng\s*(?:từ)?|khoảng\s*(?:từ)?|khoang\s*(?:tu)?|giới\s*hạn\s*(?:từ)?|between)\s*["']?(\d+(?:[.,]\d+)?)["']?\s*(?:đến|den|tới|toi|và|va|to|and|~|-|–|—)\s*["']?(\d+(?:[.,]\d+)?)["']?/i;
    const vnMatch = sanitizedText.match(vnPattern);
    if (vnMatch) {
      const n1 = parseFloat(vnMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(vnMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return makeRange(n1, n2);
      }
    }

    // 3b. Mẫu "từ X đến/tới Y"
    const fromToPattern = /(?:^|[^\w])(?:từ|tu|from)\s*["']?(\d+(?:[.,]\d+)?)["']?\s*(?:đến|den|tới|toi|to|~|-|–|—)\s*["']?(\d+(?:[.,]\d+)?)["']?/i;
    const fromToMatch = sanitizedText.match(fromToPattern);
    if (fromToMatch) {
      const n1 = parseFloat(fromToMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(fromToMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return makeRange(n1, n2);
      }
    }

    // 4. Dải số có ký tự nối hoặc từ nối rõ ràng: ~, -, \u2013, \u2014, \u2212, \uFF5E, \u223C, \u02DC, hoặc "X đến Y"
    const normalized = sanitizedText
      .replace(/[\uFF5E\u223C\u02DC]/g, '~')
      .replace(/[\u2013\u2014\u2212]/g, '~')
      .replace(/(?<=\d)\s*(?:đến|den|tới|toi|to)\s*(?=\d)/gi, ' ~ ')
      .replace(/(?<=\d)\s*[-~]\s*(?=\d)/g, ' ~ ');

    const matchTilde = normalized.match(/(\d+(?:[.,]\d+)?)\s*~\s*(\d+(?:[.,]\d+)?)/);
    if (matchTilde) {
      const n1 = parseFloat(matchTilde[1].replace(/,/g, ''));
      const n2 = parseFloat(matchTilde[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2) && n1 !== n2) {
        return makeRange(n1, n2);
      }
    }

    return null;
  }

  /**
   * Suy luận quy tắc xác thực (Validation) từ tiêu đề và ngữ cảnh câu hỏi
   * BẢO TOÀN DẢI SỐ: Ưu tiên tuyệt đối dải số trước, không bao giờ fallback về IS_NUMBER nếu text có dải số.
   * KHÓA DẢI SỐ: Nếu đối tượng đã có type === 'NUMBER' và rule === 'BETWEEN', không ghi đè thành IS_NUMBER.
   */
  inferValidationFromTitle(titleOrQ, context = '') {
    if (!titleOrQ) return null;

    // 1. Khóa dải số: Nếu truyền vào là question object hoặc validation object đã có NUMBER BETWEEN
    if (typeof titleOrQ === 'object') {
      const existingVal = titleOrQ.validation || (titleOrQ.rule ? titleOrQ : null);
      if (existingVal && existingVal.type === 'NUMBER' && existingVal.rule === 'BETWEEN') {
        return existingVal;
      }
      const titleText = titleOrQ.content || titleOrQ.title || '';
      const contextText = `${titleOrQ.placeholder || ''} ${titleOrQ.description || ''} ${titleOrQ.subtitle || ''} ${context || ''}`.trim();
      return this.inferValidationFromTitle(titleText, contextText);
    }

    const titleStr = typeof titleOrQ === 'string' ? titleOrQ.trim() : '';
    const contextStr = typeof context === 'string' ? context.trim() : (context ? JSON.stringify(context) : '');
    const combined = `${titleStr} ${contextStr}`.trim();
    if (!combined) return null;

    // 2. ƯU TIÊN TUYỆT ĐỐI DẢI SỐ TRƯỚC: Nếu có dải số trong combined text
    const range = this.extractNumberRange(combined);
    if (range) {
      return {
        type: 'NUMBER',
        rule: 'BETWEEN',
        min: range.min,
        max: range.max,
        placeholder: range.placeholder || `Số phải nằm trong khoảng từ ${range.min} ~ ${range.max}`,
        error_message: range.error_message || `Số phải nằm trong khoảng từ ${range.min} đến ${range.max}`
      };
    }

    // 3. Phân tích các quy tắc khác thông qua _extractValidationRule
    const val = this._extractValidationRule({
      title: titleStr,
      placeholder: contextStr,
      description: contextStr
    });

    // 4. Chốt chặn chống ghi đè: Nếu val là IS_NUMBER nhưng text có dải số thì luôn chuyển sang BETWEEN
    if (val && val.rule === 'IS_NUMBER') {
      const doubleCheck = this.extractNumberRange(combined);
      if (doubleCheck) {
        return {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: doubleCheck.min,
          max: doubleCheck.max,
          placeholder: doubleCheck.placeholder || `Số phải nằm trong khoảng từ ${doubleCheck.min} ~ ${doubleCheck.max}`,
          error_message: doubleCheck.error_message || `Số phải nằm trong khoảng từ ${doubleCheck.min} đến ${doubleCheck.max}`
        };
      }
    }

    return val;
  }

  _extractValidationRule({ title = '', subtitle = '', placeholder = '', description = '', questionInfoObj = null, rawRestrictions = null, rawValidationArray = null, rawQuestion = null }) {
    // Chỉ phân tích chuỗi người dùng nhìn thấy được, tuyệt đối không stringify rawQuestion chứa metadata ngày tháng / ID
    const userFacingText = `${title || ''} ${subtitle || ''} ${placeholder || ''} ${description || ''}`.trim();

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
          if (opType === 7) { // Between
            let n1 = parseFloat(operands[0]);
            let n2 = parseFloat(operands[1]);
            if (isNaN(n1) || isNaN(n2)) {
              const r = this.extractNumberRange(userFacingText);
              if (r) { n1 = r.min; n2 = r.max; }
            }
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
            let n1 = parseFloat(operands[0]);
            let n2 = parseFloat(operands[1]);
            if (isNaN(n1) || isNaN(n2)) {
              const r = this.extractNumberRange(userFacingText);
              if (r) { n1 = r.min; n2 = r.max; }
            }
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
          if (opType === 9) { // Is number
            // Chỉ khi tiêu đề hoặc placeholder có bẫy dải số tường minh rõ ràng
            const explicitRange = this.extractNumberRange(userFacingText);
            if (explicitRange) {
              return {
                type: 'NUMBER',
                rule: 'BETWEEN',
                min: explicitRange.min,
                max: explicitRange.max,
                placeholder: `Số phải nằm trong khoảng từ ${explicitRange.min} ~ ${explicitRange.max}`,
                error_message: customMsg || `Số phải nằm trong khoảng từ ${explicitRange.min} đến ${explicitRange.max}`
              };
            }
            return {
              type: 'NUMBER',
              rule: 'IS_NUMBER',
              placeholder: 'Giá trị phải là một số',
              error_message: customMsg || 'Giá trị phải là một số'
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

    // 2. Thu thập và bóc tách cấu trúc Restrictions từ Microsoft Forms
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
          target.Rule !== undefined || target.rule !== undefined || target.op !== undefined ||
          target.NumberValidationRule !== undefined || target.numberValidationRule !== undefined;
        const hasType = target.RestrictionType !== undefined || target.restrictionType !== undefined ||
          target.Type !== undefined || target.type !== undefined;
        const hasVal = target.RestrictionValue1 !== undefined || target.Operand1 !== undefined ||
          target.Value1 !== undefined || target.Min !== undefined || target.min !== undefined ||
          target.Operands !== undefined || target.operands !== undefined ||
          target.numberMinBoundary !== undefined || target.NumberMinBoundary !== undefined ||
          target.numberMaxBoundary !== undefined || target.NumberMaxBoundary !== undefined;
        if (hasOp || (hasType && hasVal) || target.Type === 1 || target.type === 1 || target.type === 'NUMBER' || target.IsNumber === true || target.isNumber === true) {
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

      const getVal1 = (obj) => obj.numberMinBoundary ?? obj.NumberMinBoundary ??
        obj.RestrictionValue1 ?? obj.restrictionValue1 ?? obj.RestrictionOperand1 ?? obj.restrictionOperand1 ??
        obj.Min ?? obj.min ?? obj.MinValue ?? obj.minValue ?? obj.lowerBound ?? obj.LowerBound ??
        obj.Operand1 ?? obj.operand1 ?? obj.Value1 ?? obj.value1 ?? obj.Value ?? obj.value ?? obj.FirstValue ?? obj.firstValue;
      const getVal2 = (obj) => obj.numberMaxBoundary ?? obj.NumberMaxBoundary ??
        obj.RestrictionValue2 ?? obj.restrictionValue2 ?? obj.RestrictionOperand2 ?? obj.restrictionOperand2 ??
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
                  r.NumberValidationRule !== undefined ? r.NumberValidationRule : (
                    r.numberValidationRule !== undefined ? r.numberValidationRule : (
                      r.op !== undefined ? r.op : ''
                    )
                  )
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

      // 2.3 BETWEEN (Toán tử 7 hoặc chuỗi chứa 'between' và không phải 'notbetween')
      const isBetween = rawOp === 7 || rawOp === '7' || (opStr.includes('between') && !opStr.includes('not'));
      if (isBetween) {
        let n1 = parseFloat(val1);
        let n2 = parseFloat(val2);

        if (isNaN(n1) || isNaN(n2)) {
          const rangeFromScan = this.extractNumberRange(userFacingText);
          if (rangeFromScan) {
            n1 = rangeFromScan.min;
            n2 = rangeFromScan.max;
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

      // 2.4 NOT BETWEEN (Toán tử 8 hoặc chuỗi chứa 'notbetween')
      const isNotBetween = rawOp === 8 || rawOp === '8' || opStr.includes('notbetween');
      if (isNotBetween) {
        let n1 = parseFloat(val1);
        let n2 = parseFloat(val2);
        if (isNaN(n1) || isNaN(n2)) {
          const rangeFromScan = this.extractNumberRange(userFacingText);
          if (rangeFromScan) {
            n1 = rangeFromScan.min;
            n2 = rangeFromScan.max;
          }
        }
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

      // 2.5 GREATER THAN OR EQUAL (Toán tử 2)
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

      // 2.6 GREATER THAN (Toán tử 1)
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

      // 2.7 LESS THAN OR EQUAL (Toán tử 4)
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

      // 2.8 LESS THAN (Toán tử 3)
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

      // 2.9 EQUAL (Toán tử 5)
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

      // 2.10 NOT EQUAL (Toán tử 6)
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

      // 2.11 IS_NUMBER (Toán tử 9)
      const isNum = rawOp === 9 || rawOp === '9' || opStr.includes('isnumber') || opStr === 'number' || ((typeStr.includes('number') || typeStr === '1' || typeStr === 1) && !opStr);
      if (isNum) {
        // BẢO TOÀN DẢI SỐ: Ưu tiên dải số nếu trong userFacingText hoặc placeholder có dải số tường minh
        const rangeInContext = this.extractNumberRange(userFacingText || placeholder || subtitle || description);
        if (rangeInContext) {
          return {
            type: 'NUMBER',
            rule: 'BETWEEN',
            min: rangeInContext.min,
            max: rangeInContext.max,
            placeholder: rangeInContext.placeholder || `Số phải nằm trong khoảng từ ${rangeInContext.min} ~ ${rangeInContext.max}`,
            error_message: rangeInContext.error_message || `Số phải nằm trong khoảng từ ${rangeInContext.min} đến ${rangeInContext.max}`
          };
        }
        fallbackIsNumber = true;
      }

      // 2.12 MAX_LENGTH / LENGTH
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
          placeholder: rangeFromPh.placeholder || `Số phải nằm trong khoảng từ ${rangeFromPh.min} ~ ${rangeFromPh.max}`,
          error_message: rangeFromPh.error_message || `Số phải nằm trong khoảng từ ${rangeFromPh.min} đến ${rangeFromPh.max}`
        };
      }

      // 3.2 Is Number từ Placeholder
      if (/(?:giá\s*trị\s*phải\s*là\s*(?:một\s*)?số|gia\s*tri\s*phai\s*la\s*(?:mot\s*)?so|phải\s*là\s*(?:một\s*)?số|phai\s*la\s*(?:mot\s*)?so|value\s*must\s*be\s*a\s*number|must\s*be\s*a\s*number|phải\s*là\s*số)/i.test(trimmedPlaceholder)) {
        // Kiểm tra lại nếu userFacingText chứa dải số thì ưu tiên BETWEEN
        const explicitRange = this.extractNumberRange(userFacingText);
        if (explicitRange) {
          return {
            type: 'NUMBER',
            rule: 'BETWEEN',
            min: explicitRange.min,
            max: explicitRange.max,
            placeholder: explicitRange.placeholder || `Số phải nằm trong khoảng từ ${explicitRange.min} ~ ${explicitRange.max}`,
            error_message: explicitRange.error_message || `Số phải nằm trong khoảng từ ${explicitRange.min} đến ${explicitRange.max}`
          };
        }
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

    // 4. Nếu có fallbackIsNumber từ structured metadata: Ưu tiên kiểm tra dải số trước
    if (fallbackIsNumber) {
      const explicitRange = this.extractNumberRange(userFacingText);
      if (explicitRange) {
        return {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: explicitRange.min,
          max: explicitRange.max,
          placeholder: explicitRange.placeholder || `Số phải nằm trong khoảng từ ${explicitRange.min} ~ ${explicitRange.max}`,
          error_message: explicitRange.error_message || `Số phải nằm trong khoảng từ ${explicitRange.min} đến ${explicitRange.max}`
        };
      }
      return {
        type: 'NUMBER',
        rule: 'IS_NUMBER',
        placeholder: 'Giá trị phải là một số',
        error_message: 'Giá trị phải là một số'
      };
    }

    // 5. Heuristic Fallback: Phân tích văn bản hiển thị thuần túy (userFacingText)
    if (userFacingText) {
      const textRange = this.extractNumberRange(userFacingText);
      if (textRange) {
        return {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: textRange.min,
          max: textRange.max,
          placeholder: textRange.placeholder || `Số phải nằm trong khoảng từ ${textRange.min} ~ ${textRange.max}`,
          error_message: textRange.error_message || `Số phải nằm trong khoảng từ ${textRange.min} đến ${textRange.max}`
        };
      }
    }
    // 6. Phân tích ngữ cảnh văn bản kết hợp (combinedText)
    const combinedText = `${title} ${subtitle} ${placeholder} ${description}`.trim();
    if (!combinedText) return null;

    // 6.1 Ưu tiên quét dải số BETWEEN rõ ràng từ combinedText
    const rangeInCombined = this.extractNumberRange(combinedText);
    if (rangeInCombined) {
      return {
        type: 'NUMBER',
        rule: 'BETWEEN',
        min: rangeInCombined.min,
        max: rangeInCombined.max,
        placeholder: rangeInCombined.placeholder || `Số phải nằm trong khoảng từ ${rangeInCombined.min} ~ ${rangeInCombined.max}`,
        error_message: rangeInCombined.error_message || `Số phải nằm trong khoảng từ ${rangeInCombined.min} đến ${rangeInCombined.max}`
      };
    }

    // 6.2 Email
    if (/(?:\bemail(?:\s+hust)?\b|thư\s*điện\s*tử|địa\s*chỉ\s*email)/i.test(combinedText)) {
      return {
        type: 'EMAIL',
        rule: 'EMAIL',
        placeholder: 'Vui lòng nhập email',
        error_message: 'Vui lòng nhập địa chỉ email hợp lệ'
      };
    }

    // 6.3 Website / URL
    if (/(?:\burl\b|liên\s*kết|trang\s*web|website|\blink\b|https?:\/\/)/i.test(combinedText)) {
      return {
        type: 'URL',
        rule: 'URL',
        placeholder: 'Vui lòng nhập URL hợp lệ',
        error_message: 'Vui lòng nhập đường dẫn URL hợp lệ'
      };
    }

    // 6.4 Mã số sinh viên: Tuyệt đối KHÔNG gán cứng min=20000000, max=20270000 nếu form không quy định
    if (/(?:mã\s*số\s*sinh\s*viên|ma\s*so\s*sinh\s*vien|\bmssv\b|số\s*thẻ\s*sinh\s*viên|so\s*the\s*sinh\s*vien|mã\s*sinh\s*viên|ma\s*sinh\s*vien)/i.test(combinedText)) {
      const rangeMatch = this.extractNumberRange(combinedText);
      if (rangeMatch) {
        return {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: rangeMatch.min,
          max: rangeMatch.max,
          placeholder: rangeMatch.placeholder || `Số phải nằm trong khoảng từ ${rangeMatch.min} ~ ${rangeMatch.max}`,
          error_message: rangeMatch.error_message || `Số phải nằm trong khoảng từ ${rangeMatch.min} đến ${rangeMatch.max}`
        };
      }
      return {
        type: 'NUMBER',
        rule: 'IS_NUMBER',
        placeholder: 'Giá trị phải là một số',
        error_message: 'Giá trị phải là một số'
      };
    }

    // 6.5 Số điện thoại, số lượng & các trường số
    if (/(?:giá\s*trị\s*phải\s*là\s*(?:một\s*)?số|gia\s*tri\s*phai\s*la\s*(?:mot\s*)?so|phải\s*là\s*(?:một\s*)?số|phai\s*la\s*(?:mot\s*)?so|số\s*điện\s*thoại|so\s*dien\s*thoai|\bsđt\b|\bsdt\b|điện\s*thoại|dien\s*thoai|phone\s*number|số\s*lượng|so\s*luong|độ\s*tuổi|do\s*tuoi|\btuổi\b|\btuoi\b|năm\s*sinh|nam\s*sinh|điểm\s*số|diem\s*so|thứ\s*hạng|thu\s*hang|thu\s*nhập|thu\s*nhap|số\s*tiền|so\s*tien)/i.test(combinedText)) {
      const rangeMatch = this.extractNumberRange(combinedText);
      if (rangeMatch) {
        return {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: rangeMatch.min,
          max: rangeMatch.max,
          placeholder: rangeMatch.placeholder || `Số phải nằm trong khoảng từ ${rangeMatch.min} ~ ${rangeMatch.max}`,
          error_message: rangeMatch.error_message || `Số phải nằm trong khoảng từ ${rangeMatch.min} đến ${rangeMatch.max}`
        };
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
    else if (lowerType.includes('section') || lowerType.includes('page') || lowerType.includes('group') || lowerType.includes('columngroup')) {
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

        let target = c.BranchInfo?.TargetQuestionId ?? c.branchInfo?.targetQuestionId ??
          c.nextQuestionId ?? c.NextQuestionId ?? c.branchTo ?? c.BranchTo ??
          c.targetQuestionId ?? c.TargetQuestionId ?? c.target ?? c.Target ?? null;

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
      res.is_required = 0;
      res.rows = [subtitle || ''];

      const branchTarget = questionInfoObj?.BranchInfo?.TargetQuestionId ??
                           questionInfoObj?.branchInfo?.targetQuestionId ??
                           q.nextQuestionId ?? q.NextQuestionId ??
                           questionInfoObj?.NextQuestionId ?? questionInfoObj?.nextQuestionId ?? null;
      if (branchTarget !== null && branchTarget !== undefined && branchTarget !== '') {
        const tgtStr = String(branchTarget).trim();
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

            const rawQuestions = [
              ...(Array.isArray(apiData.descriptiveQuestions) ? apiData.descriptiveQuestions : []),
              ...(Array.isArray(apiData.questions) ? apiData.questions : [])
            ].sort((a, b) => (a.order || 0) - (b.order || 0));
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
              const category = this.detectCategory(title, description, questions);
              return {
                source: 'MICROSOFT_FORM',
                title,
                description,
                category,
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

      const rawQuestions = [
        ...(Array.isArray(formData.descriptiveQuestions) ? formData.descriptiveQuestions : []),
        ...(Array.isArray(formData.questions) ? formData.questions : (formData.items || []))
      ].sort((a, b) => (a.order || 0) - (b.order || 0));
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

    const category = this.detectCategory(title, description, questions);

    return {
      source: 'MICROSOFT_FORM',
      title,
      description,
      category,
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
    let currentUrl = this.normalizeFormUrl(rawUrl || '').trim();

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
          currentUrl = this.normalizeFormUrl(nextUrl);
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

      // 0. Kiểm tra Section Header (Mục 1, Phần 2:..., 15. Mục: ...)
      const secMatch = line.match(/^(?:\d+[.)/:-]\s*)?(?:mục|phần|section)\s*(\d+|[ivx]+)?[:：\-\.]?\s*(.*)$/i);
      if (secMatch && (secMatch[1] || secMatch[2])) {
        if (currentQuestion) {
          questions.push(this._finalizeQuestion(currentQuestion, questions.length + 1));
        }
        const secNum = secMatch[1] ? ` ${secMatch[1]}` : '';
        const secTitle = secMatch[2] ? (secMatch[2].startsWith(':') ? secMatch[2] : `: ${secMatch[2]}`) : '';
        const fullSecName = `Mục${secNum}${secTitle}`.trim() || line;
        currentQuestion = {
          isSection: true,
          content: fullSecName,
          rawOptions: [],
          rows: null,
          columns: null,
          hasCheckboxOptions: false
        };
        readingMode = null;
        continue;
      }

      const qMatch = line.match(questionStartRegex);

      if (qMatch) {
        // Lưu câu hỏi trước đó nếu có
        if (currentQuestion) {
          questions.push(this._finalizeQuestion(currentQuestion, questions.length + 1));
        }

        let contentClean = (qMatch[5] ? qMatch[5].trim() : line).trim();
        let isReq = false;
        let forcedType = null;

        // Cắt bỏ nhãn "Bắt buộc trả lời" của Microsoft Forms / Google Forms
        if (/bắt\s*buộc\s*trả\s*lời\.?|bắt\s*buộc\.?|\(\s*bắt\s*buộc\s*\)|\[\s*bắt\s*buộc\s*\]|\*+/i.test(contentClean)) {
          isReq = true;
          contentClean = contentClean
            .replace(/bắt\s*buộc\s*trả\s*lời\.?/gi, '')
            .replace(/\(\s*bắt\s*buộc\s*\)|\[\s*bắt\s*buộc\s*\]/gi, '')
            .replace(/\s*\*+\s*$/, '')
            .trim();
        }

        // Cắt bỏ nhãn loại câu hỏi của Microsoft Forms
        if (/văn\s*bản\s*nhiều\s*dòng\.?/i.test(contentClean)) {
          forcedType = 'PARAGRAPH';
          contentClean = contentClean.replace(/văn\s*bản\s*nhiều\s*dòng\.?/gi, '').trim();
        } else if (/văn\s*bản\s*một\s*dòng\.?/i.test(contentClean)) {
          forcedType = 'SHORT_TEXT';
          contentClean = contentClean.replace(/văn\s*bản\s*một\s*dòng\.?/gi, '').trim();
        } else if (/nhiều\s*lựa\s*chọn\.?/i.test(contentClean)) {
          forcedType = 'MULTIPLE_CHOICE';
          contentClean = contentClean.replace(/nhiều\s*lựa\s*chọn\.?/gi, '').trim();
        } else if (/một\s*lựa\s*chọn\.?/i.test(contentClean)) {
          forcedType = 'SINGLE_CHOICE';
          contentClean = contentClean.replace(/một\s*lựa\s*chọn\.?/gi, '').trim();
        } else if (/xếp\s*loại\.?|đánh\s*giá\s*sao\.?/i.test(contentClean)) {
          forcedType = 'RATING_STARS';
          contentClean = contentClean.replace(/xếp\s*loại\.?|đánh\s*giá\s*sao\.?/gi, '').trim();
        }

        currentQuestion = {
          content: contentClean || `Câu hỏi ${questions.length + 1}`,
          rawOptions: [],
          rows: null,
          columns: null,
          hasCheckboxOptions: false,
          isRequired: isReq ? 1 : 0,
          forceType: forcedType
        };
        readingMode = null;
        continue;
      }

      if (currentQuestion) {
        // Nếu đang trong Section Header, dòng đầu tiên nếu chưa có tiêu đề chi tiết sẽ là tiêu đề của Section
        if (currentQuestion.isSection) {
          if (!currentQuestion.rows || currentQuestion.rows.length === 0) {
            if (/^(?:mục|phần|section)\s*(\d+|[ivx]+)?$/i.test(currentQuestion.content)) {
              currentQuestion.content += ': ' + line;
              continue;
            }
          }
          if (!currentQuestion.rows) currentQuestion.rows = [];
          currentQuestion.rows.push(line);
          continue;
        }

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
          // BẢO TOÀN DẢI SỐ: Nếu đã có rule BETWEEN hoặc trong tiêu đề/placeholder có dải số thì không ghi đè thành IS_NUMBER
          const hasExistingRange = (currentQuestion.validation && currentQuestion.validation.rule === 'BETWEEN') ||
            this.extractNumberRange(currentQuestion.content) ||
            this.extractNumberRange(currentQuestion.placeholder);
          if (!hasExistingRange) {
            currentQuestion.validation = {
              type: 'NUMBER',
              rule: 'IS_NUMBER',
              placeholder: 'Giá trị phải là một số',
              error_message: 'Giá trị phải là một số'
            };
            currentQuestion.placeholder = 'Giá trị phải là một số';
          }
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

        // 3. Xử lý các lựa chọn của câu hỏi trắc nghiệm (đặc biệt khi copy từ Microsoft / Google Forms không có bullet A, B, C)
        const isChoiceMode = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(currentQuestion.forceType);
        if (isChoiceMode && line.length < 150 && !line.includes('?')) {
          currentQuestion.rawOptions.push(line);
          continue;
        }

        // Nếu câu hỏi đã có options và dòng ngắn -> option tiếp theo
        if (currentQuestion.rawOptions.length > 0 && line.length < 100 && !line.includes('?')) {
          currentQuestion.rawOptions.push(line);
          continue;
        }

        // Nếu tiêu đề câu hỏi đã kết thúc bằng dấu hỏi (?) và dòng tiếp theo là dòng ngắn -> lựa chọn đầu tiên
        if (currentQuestion.rawOptions.length === 0 && currentQuestion.content.trim().endsWith('?') && line.length < 80 && !line.includes('?')) {
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

    // Ánh xạ Branching Logic đích đến đúng order_index của Section Header / Câu hỏi (Bật allowInference cho Smart Paste)
    if (questions.length > 0) {
      this._resolveAndMapBranchingTargets(questions, true);
    }

    const category = this.detectCategory(title || 'Khảo sát mới', description || '', questions);

    return {
      source: 'SMART_PASTE',
      title: title || 'Khảo sát mới',
      description: description || '',
      category,
      questions,
      questionCount: questions.length
    };
  }

  /**
   * Helper xác định loại câu hỏi từ nội dung và options trong Smart Text
   */
  _finalizeQuestion(rawQ, orderIndex) {
    let content = rawQ.content.trim();
    let isRequired = rawQ.isRequired !== undefined ? (rawQ.isRequired ? 1 : 0) : 0;

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

    // 0. Phân đoạn biểu mẫu (SECTION_HEADER)
    if (rawQ.isSection || /^(?:mục|phần|section)\s*(\d+|[ivx]+)?[:：\-\.]/i.test(content) || /^(?:mục|phần|section)\s*\d+/i.test(content)) {
      return {
        order_index: orderIndex,
        id: rawQ.id || `q_${orderIndex}`,
        type: 'SECTION_HEADER',
        content,
        is_required: 0,
        options: null,
        rows: rawQ.rows && rawQ.rows.length > 0 ? rawQ.rows : null
      };
    }

    // 0.5 Ưu tiên kiểu ép buộc nếu có forceType từ nhãn Microsoft Forms
    if (rawQ.forceType === 'PARAGRAPH') {
      const validation = (rawQ.validation && rawQ.validation.rule === 'BETWEEN')
        ? rawQ.validation
        : (rawQ.validation || this.inferValidationFromTitle(content, rawQ.placeholder || ''));
      const qRes = { order_index: orderIndex, id: rawQ.id || `q_${orderIndex}`, type: 'PARAGRAPH', content, is_required: isRequired, options: null };
      if (validation) {
        qRes.validation = validation;
        qRes.logic = { validation };
        qRes.placeholder = validation.placeholder || rawQ.placeholder || 'Nhập câu trả lời của bạn';
      } else if (rawQ.placeholder) {
        qRes.placeholder = rawQ.placeholder;
      }
      return qRes;
    }
    if (rawQ.forceType === 'SHORT_TEXT') {
      const validation = (rawQ.validation && rawQ.validation.rule === 'BETWEEN')
        ? rawQ.validation
        : (rawQ.validation || this.inferValidationFromTitle(content, rawQ.placeholder || ''));
      const qRes = { order_index: orderIndex, id: rawQ.id || `q_${orderIndex}`, type: 'SHORT_TEXT', content, is_required: isRequired, options: null };
      if (validation) {
        qRes.validation = validation;
        qRes.logic = { validation };
        qRes.placeholder = validation.placeholder || rawQ.placeholder || 'Nhập câu trả lời của bạn';
      } else if (rawQ.placeholder) {
        qRes.placeholder = rawQ.placeholder;
      }
      return qRes;
    }

    // 1. Nếu có ma trận Hàng x Cột -> CHOICE_GRID hoặc CHECKBOX_GRID
    if (rows && columns && rows.length > 0 && columns.length > 0) {
      const isCheckbox = /hộp\s*kiểm|checkbox|nhiều/i.test(content) || /hộp\s*kiểm|checkbox/i.test(rawQ.content);
      const qType = isCheckbox ? 'CHECKBOX_GRID' : 'CHOICE_GRID';
      return {
        order_index: orderIndex,
        id: rawQ.id || `q_${orderIndex}`,
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

    if (rawQ.forceType === 'MULTIPLE_CHOICE' && cleanOptions.length > 0) {
      return { order_index: orderIndex, id: rawQ.id || `q_${orderIndex}`, type: 'MULTIPLE_CHOICE', content, is_required: isRequired, options: cleanOptions };
    }
    if (rawQ.forceType === 'SINGLE_CHOICE' && cleanOptions.length > 0) {
      return { order_index: orderIndex, id: rawQ.id || `q_${orderIndex}`, type: 'SINGLE_CHOICE', content, is_required: isRequired, options: cleanOptions };
    }
    if (rawQ.forceType === 'RATING_STARS') {
      return { order_index: orderIndex, id: rawQ.id || `q_${orderIndex}`, type: 'RATING_STARS', content, is_required: isRequired, options: ['1', '2', '3', '4', '5'] };
    }

    // 2. Xếp hạng sao (RATING_STARS)
    if (/đánh\s*giá\s*sao|xếp\s*hạng\s*sao|số\s*sao|star\s*rating|(?:từ\s*)?1\s*(?:đến|-|–)\s*5\s*sao/i.test(content)) {
      return {
        order_index: orderIndex,
        id: rawQ.id || `q_${orderIndex}`,
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
        id: rawQ.id || `q_${orderIndex}`,
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
        id: rawQ.id || `q_${orderIndex}`,
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
        return { order_index: orderIndex, id: rawQ.id || `q_${orderIndex}`, type: 'DATE_INPUT', content, is_required: isRequired, options: null };
      }
      if (/giờ|thời\s*gian\s*\((?:giờ|phút)\)|time/i.test(content)) {
        return { order_index: orderIndex, id: rawQ.id || `q_${orderIndex}`, type: 'TIME_INPUT', content, is_required: isRequired, options: null };
      }
      if (/tải\s*(?:lên\s*)?tệp|đính\s*kèm\s*file|upload\s*file|tải\s*ảnh/i.test(content)) {
        return { order_index: orderIndex, id: rawQ.id || `q_${orderIndex}`, type: 'FILE_UPLOAD', content, is_required: isRequired, options: null };
      }
      if (/đoạn\s*văn|tự\s*luận\s*dài|chia\s*sẻ\s*chi\s*tiết|mô\s*tả\s*cụ\s*thể|paragraph/i.test(content)) {
        const validation = (rawQ.validation && rawQ.validation.rule === 'BETWEEN')
          ? rawQ.validation
          : (rawQ.validation || this.inferValidationFromTitle(content, rawQ.placeholder || ''));
        const qRes = { order_index: orderIndex, id: rawQ.id || `q_${orderIndex}`, type: 'PARAGRAPH', content, is_required: isRequired, options: null };
        if (validation) {
          qRes.validation = validation;
          qRes.logic = { validation };
          qRes.placeholder = validation.placeholder || rawQ.placeholder || 'Nhập câu trả lời của bạn';
        } else if (rawQ.placeholder) {
          qRes.placeholder = rawQ.placeholder;
        }
        return qRes;
      }
      const validation = (rawQ.validation && rawQ.validation.rule === 'BETWEEN')
        ? rawQ.validation
        : (rawQ.validation || this.inferValidationFromTitle(content, rawQ.placeholder || ''));
      const qRes = { order_index: orderIndex, id: rawQ.id || `q_${orderIndex}`, type: 'SHORT_TEXT', content, is_required: isRequired, options: null };
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
        id: rawQ.id || `q_${orderIndex}`,
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
        id: rawQ.id || `q_${orderIndex}`,
        type: 'MULTIPLE_CHOICE',
        content,
        is_required: isRequired,
        options: cleanOptions
      };
    }

    // 7. Mặc định là Trắc nghiệm 1 lựa chọn (SINGLE_CHOICE)
    return {
      order_index: orderIndex,
      id: rawQ.id || `q_${orderIndex}`,
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
   * Áp dụng giải thuật phân cụm theo thứ tự xuất hiện (Cluster Matching) và đồ thị DAG tổng quát.
   */
  _resolveAndMapBranchingTargets(questions, allowInference = false) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return questions;
    }

    // 1. Thu thập danh sách Section Headers và lập các bản đồ chỉ mục
    const sectionHeaders = [];
    const originIdMap = new Map();
    const orderIndexMap = new Map();
    const idMap = new Map();
    const questionParentSecMap = new Map();

    let curSec = null;
    for (const q of questions) {
      if (!q) continue;
      if (q.id) {
        idMap.set(String(q.id).trim(), q);
      }
      if (q.origin_id !== undefined && q.origin_id !== null && q.origin_id !== '') {
        originIdMap.set(String(q.origin_id).trim(), q);
      }
      if (q.order_index !== undefined && q.order_index !== null) {
        orderIndexMap.set(Number(q.order_index), q);
      }
      if (q.type === 'SECTION_HEADER') {
        sectionHeaders.push(q);
        curSec = q;
      } else if (curSec) {
        questionParentSecMap.set(q, curSec);
      }
    }

    // Gán chỉ số thứ tự trong danh sách Section Header cho từng Section
    sectionHeaders.forEach((sec, idx) => {
      sec._secIndex = idx;
    });

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

    const getSecText = (s) => `${s.content || ''} ${Array.isArray(s.rows) ? s.rows.join(' ') : ''}`.trim();

    // Helper trích xuất các Qualifiers (chỉ số nguyện vọng, giai đoạn, vòng, đợt) từ văn bản
    const extractContextQualifiers = (text) => {
      if (!text || typeof text !== 'string') return { nvList: [], numList: [] };
      const cleaned = cleanFuzzy(text);
      const nvList = [];
      const numList = [];

      // Nhận diện NV1, NV2, Nguyện vọng 1, Nguyện vọng 2, Vòng 1, Vòng 2, Đợt 1, Đợt 2, Lần 1...
      const nvRegex = /\b(?:nv|nguyen\s*vong|nguyenvong|dot|vong|lan|buoc|phase|round|stage|uu\s*tien)\s*[:#-]?\s*([0-9]+|[a-z]|i{1,3}|iv|v)\b/gi;
      let m;
      while ((m = nvRegex.exec(cleaned)) !== null) {
        let val = m[1].toLowerCase();
        if (val === 'i') val = '1';
        else if (val === 'ii') val = '2';
        else if (val === 'iii') val = '3';
        else if (val === 'iv') val = '4';
        else if (val === 'v') val = '5';
        nvList.push(val);
      }

      // Pattern (1), (2), (nv1), (nv2)...
      const parenRegex = /\((?:nv\s*)?([0-9]+|i{1,3}|iv|v)\)/gi;
      while ((m = parenRegex.exec(cleaned)) !== null) {
        let val = m[1].toLowerCase();
        if (val === 'i') val = '1';
        else if (val === 'ii') val = '2';
        else if (val === 'iii') val = '3';
        else if (val === 'iv') val = '4';
        else if (val === 'v') val = '5';
        nvList.push(val);
      }

      // Pattern nv1, nv2 dính liền
      const joinedRegex = /\bnv([0-9]+)\b/gi;
      while ((m = joinedRegex.exec(cleaned)) !== null) {
        nvList.push(m[1]);
      }

      const numRegex = /\b([0-9]+)\b/g;
      while ((m = numRegex.exec(cleaned)) !== null) {
        numList.push(m[1]);
      }

      return {
        nvList: [...new Set(nvList)],
        numList: [...new Set(numList)]
      };
    };

    // Helper tìm câu hỏi / phân đoạn đích áp dụng Relevance Scoring & Context Matching
    const findTargetQuestion = (rawTarget, optLabel, qContext, currentQOrder = 0, currentQ = null) => {
      // 1. Kiểm tra rawTarget trực tiếp
      if (rawTarget !== null && rawTarget !== undefined && rawTarget !== '') {
        const targetStr = String(rawTarget).trim();

        // 1.1 Khớp theo id chuẩn (q_1, ...)
        if (idMap.has(targetStr)) {
          return idMap.get(targetStr);
        }

        // 1.2 Khớp theo origin_id (Google Section ID, Microsoft Question ID)
        if (originIdMap.has(targetStr)) {
          return originIdMap.get(targetStr);
        }

        // 1.3 Khớp nếu rawTarget là số thứ tự order_index hợp lệ
        const numTgt = parseInt(targetStr, 10);
        if (!isNaN(numTgt) && orderIndexMap.has(numTgt)) {
          return orderIndexMap.get(numTgt);
        }

        // 1.4 Khớp theo tiêu đề Section Header
        const targetStrict = cleanStrict(targetStr);
        const targetFuzzy = cleanFuzzy(targetStr);

        for (const sec of sectionHeaders) {
          const secText = getSecText(sec);
          const secStrict = cleanStrict(secText);
          const secFuzzy = cleanFuzzy(secText);

          if (secStrict === targetStrict || secFuzzy === targetFuzzy) {
            return sec;
          }
          if (targetFuzzy.length >= 3 && (secFuzzy.includes(targetFuzzy) || targetFuzzy.includes(secFuzzy))) {
            return sec;
          }
        }
      }

      // 2. Khớp với optLabel áp dụng Relevance Scoring & Sequence Matching
      if (optLabel && typeof optLabel === 'string') {
        const optStrict = cleanStrict(optLabel);
        const optFuzzy = cleanFuzzy(optLabel);

        if (optFuzzy.length < 2) return null;

        // Thu thập toàn bộ Section candidates phù hợp với tên của optLabel
        const candidates = [];
        for (const sec of sectionHeaders) {
          const secText = getSecText(sec);
          const secStrict = cleanStrict(secText);
          const secFuzzy = cleanFuzzy(secText);

          let matchType = 0;
          if (secStrict === optStrict || secFuzzy === optFuzzy) {
            matchType = 3; // Khớp chính xác
          } else if (secFuzzy.includes(optFuzzy)) {
            matchType = 2; // Section chứa tên option
          } else if (optFuzzy.length >= 3 && optFuzzy.includes(secFuzzy)) {
            matchType = 1; // Option chứa tên Section
          }

          if (matchType > 0) {
            candidates.push({ sec, matchType });
          }
        }

        if (candidates.length === 0) {
          return null;
        }

        // Nếu chỉ có 1 candidate duy nhất: kiểm tra tính hợp lý
        if (candidates.length === 1) {
          return candidates[0].sec;
        }

        // Nếu có nhiều candidates: Tính điểm phù hợp ngữ cảnh (Relevance Scoring)
        const parentSec = currentQ ? questionParentSecMap.get(currentQ) : null;
        const fullQContext = `${parentSec ? getSecText(parentSec) : ''} ${qContext || (currentQ ? currentQ.content : '')}`.trim();
        const qQuals = extractContextQualifiers(fullQContext);

        // Đếm thứ tự xuất hiện của câu hỏi trong số các câu hỏi có cùng option này
        let qIndexInSimilar = 0;
        let countSimilar = 0;
        for (const otherQ of questions) {
          if (!otherQ || !Array.isArray(otherQ.options)) continue;
          if (otherQ.options.some(o => cleanFuzzy(o) === optFuzzy)) {
            if (otherQ === currentQ || otherQ.order_index === currentQOrder) {
              qIndexInSimilar = countSimilar;
            }
            countSimilar++;
          }
        }

        const scoredCandidates = candidates.map((item, candIdx) => {
          const candSec = item.sec;
          const candText = getSecText(candSec);
          const candQuals = extractContextQualifiers(candText);
          let score = 0;

          // Điểm khớp tên cơ bản
          if (item.matchType === 3) score += 300;
          else if (item.matchType === 2) score += 150;
          else if (item.matchType === 1) score += 100;

          // Ưu tiên downstream (xuất hiện sau câu hỏi hiện tại)
          if (candSec.order_index > currentQOrder) {
            score += 100;
          } else {
            score -= 200; // Tránh nhảy ngược lên trước câu hỏi đang hỏi
          }

          // So khớp Qualifiers (NV1 vs NV2, Vòng 1 vs Vòng 2, v.v.)
          if (qQuals.nvList.length > 0 && candQuals.nvList.length > 0) {
            const hasCommonNV = qQuals.nvList.some(v => candQuals.nvList.includes(v));
            if (hasCommonNV) {
              score += 1000; // Điểm cộng quyết định khi trùng khớp chỉ số nguyện vọng/đợt!
            } else {
              score -= 1000; // Phạt nặng nếu xung đột nguyện vọng (ví dụ NV2 match NV1)!
            }
          } else if (qQuals.numList.length > 0 && candQuals.numList.length > 0) {
            const hasCommonNum = qQuals.numList.some(n => candQuals.numList.includes(n));
            if (hasCommonNum) {
              score += 400;
            } else {
              score -= 200;
            }
          }

          // Phân cụm tuần tự (Sequence Cluster Matching): Nếu nhiều câu hỏi có cùng options
          // Câu hỏi thứ k ưu tiên candidate thứ k
          if (countSimilar > 1 && candIdx === qIndexInSimilar) {
            score += 250;
          }

          // Ưu tiên khoảng cách gần hơn nếu điểm bằng nhau
          if (candSec.order_index > currentQOrder) {
            score += Math.max(0, 50 - Math.min(50, Math.floor((candSec.order_index - currentQOrder) / 2)));
          }

          return { sec: candSec, score };
        });

        scoredCandidates.sort((a, b) => b.score - a.score);

        return scoredCandidates[0].score > 0 ? scoredCandidates[0].sec : null;
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
        // Tự động suy luận logic rẽ nhánh nếu các lựa chọn khớp với các Section Headers (CHỈ áp dụng cho SMART_PASTE văn bản thô)
        if (allowInference && (!q.logic || !q.logic.options) && Array.isArray(q.options) && q.options.length >= 2 && sectionHeaders.length >= 2) {
          const inferredOptions = {};
          let matchedCount = 0;
          const matchedSecOrders = new Set();

          for (let i = 0; i < q.options.length; i++) {
            const opt = q.options[i];
            const matchedSec = findTargetQuestion(null, opt, q.content, q.order_index, q);
            if (matchedSec && matchedSec.order_index !== q.order_index) {
              inferredOptions[opt] = {
                action: 'GO_TO_PAGE',
                target: matchedSec.id || (matchedSec.origin_id ? String(matchedSec.origin_id) : `order:${matchedSec.order_index}`)
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
            const targetQ = findTargetQuestion(rawTarget, key, q.content, q.order_index, q);
            if (targetQ) {
              resolvedOptions[key] = {
                action: 'GO_TO_PAGE',
                target: targetQ.id || (targetQ.origin_id ? String(targetQ.origin_id) : `order:${targetQ.order_index}`)
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
      if (q.type === 'SECTION_HEADER') {
        q.logic = q.logic || {};
        const rawDefAction = q.logic.default_action || q.logic.action;
        const rawTarget = q.logic.target;

        if (isSubmitAction(rawDefAction, rawTarget)) {
          q.logic.default_action = 'SUBMIT_FORM';
          q.logic.target = null;
        } else if (isRestartAction(rawDefAction)) {
          q.logic.default_action = 'RESTART_FORM';
          q.logic.target = null;
        } else if (rawTarget !== null && rawTarget !== undefined && rawTarget !== '') {
          const targetQ = findTargetQuestion(rawTarget, null, q.content, q.order_index, q);
          if (targetQ) {
            q.logic.default_action = 'GO_TO_PAGE';
            q.logic.target = targetQ.id || (targetQ.origin_id ? String(targetQ.origin_id) : `order:${targetQ.order_index}`);
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

    // 3. TỔNG QUÁT HÓA PHÂN CỤM ĐỒ THỊ RẼ NHÁNH: HỒI QUY VÀ HỘI TỤ (DAG LOOP & CONVERGENCE)
    // Mỗi Section Header là 1 Node trong đồ thị DAG
    // Khi câu hỏi rẽ nhánh trỏ đến các Section nhánh con (Branch Nodes):
    // - Nếu có Section luồng chính nằm giữa Section câu hỏi và các nhánh con: các nhánh con tự động HỒI QUY (Return) về Section luồng chính đó.
    // - Nếu không có: các nhánh con tự động HỘI TỤ (Convergence) về Section chung kế tiếp sau cụm nhánh con.
    const helperResolveSection = (tgt) => {
      if (!tgt) return null;
      const tgtStr = String(tgt);
      if (idMap.has(tgtStr)) {
        const item = idMap.get(tgtStr);
        if (item.type === 'SECTION_HEADER') return item;
      }
      if (originIdMap.has(tgtStr)) {
        const item = originIdMap.get(tgtStr);
        if (item.type === 'SECTION_HEADER') return item;
      }
      const num = parseInt(tgtStr, 10);
      if (!isNaN(num) && orderIndexMap.has(num)) {
        const item = orderIndexMap.get(num);
        if (item.type === 'SECTION_HEADER') return item;
      }
      for (const s of sectionHeaders) {
        if (s.id === tgtStr || String(s.origin_id) === tgtStr || `order:${s.order_index}` === tgtStr) {
          return s;
        }
      }
      return null;
    };

    // Thu thập tất cả các Section được trỏ tới bởi bất kỳ câu hỏi rẽ nhánh nào
    const allBranchTargetSecIndices = new Set();
    const branchMapByQuestion = new Map();

    for (const q of questions) {
      if (!q || !q.logic || !q.logic.options) continue;

      const targetSecList = [];
      for (const rule of Object.values(q.logic.options)) {
        if (!rule || rule.action !== 'GO_TO_PAGE' || !rule.target) continue;
        const resolvedSec = helperResolveSection(rule.target);
        if (resolvedSec && resolvedSec._secIndex !== undefined) {
          targetSecList.push(resolvedSec);
          allBranchTargetSecIndices.add(resolvedSec._secIndex);
        }
      }

      if (targetSecList.length > 0) {
        branchMapByQuestion.set(q, targetSecList);
      }
    }

    // Duyệt từng câu hỏi rẽ nhánh để thiết lập điểm Hồi Quy (Return) hoặc Hội Tụ (Convergence)
    for (const [q, targetSecList] of branchMapByQuestion.entries()) {
      if (!targetSecList || targetSecList.length === 0) continue;

      // Xác định Section cha chứa câu hỏi q
      let parentSec = questionParentSecMap.get(q);
      if (!parentSec) {
        for (let i = sectionHeaders.length - 1; i >= 0; i--) {
          if (sectionHeaders[i].order_index <= q.order_index) {
            parentSec = sectionHeaders[i];
            break;
          }
        }
      }
      const parentSecIdx = parentSec ? parentSec._secIndex : -1;

      const branchSecIndices = targetSecList.map(s => s._secIndex);
      const minBranchIdx = Math.min(...branchSecIndices);
      const maxBranchIdx = Math.max(...branchSecIndices);

      // 1. Tìm Điểm Hồi Quy (Return Node):
      // Section luồng chính nằm giữa parentSec và minBranchIdx
      let returnSec = null;
      if (parentSecIdx >= 0) {
        for (let idx = parentSecIdx + 1; idx < minBranchIdx; idx++) {
          const candidateMainSec = sectionHeaders[idx];
          if (candidateMainSec && !allBranchTargetSecIndices.has(candidateMainSec._secIndex)) {
            returnSec = candidateMainSec;
            break;
          }
        }
      }

      // 2. Tìm Điểm Hội Tụ (Convergence Node):
      // Section đầu tiên nằm sau toàn bộ cụm nhánh con mà không phải là nhánh con
      let convSec = null;
      for (let idx = maxBranchIdx + 1; idx < sectionHeaders.length; idx++) {
        const candidateConv = sectionHeaders[idx];
        if (candidateConv && !allBranchTargetSecIndices.has(candidateConv._secIndex)) {
          convSec = candidateConv;
          break;
        }
      }
      if (!convSec && maxBranchIdx + 1 < sectionHeaders.length) {
        convSec = sectionHeaders[maxBranchIdx + 1];
      }

      // 3. Tự động gán default_action cho các Section nhánh con của câu hỏi này
      for (const bSec of targetSecList) {
        if (!bSec) continue;

        bSec.logic = bSec.logic || {};
        const currentAction = bSec.logic.default_action;

        // Chỉ gán nếu chưa có điều hướng tường minh hoặc đang là NEXT_PAGE / NEXT
        if (!currentAction || currentAction === 'NEXT_PAGE' || currentAction === 'NEXT') {
          if (returnSec) {
            bSec.logic.default_action = 'GO_TO_PAGE';
            bSec.logic.target = returnSec.id || (returnSec.origin_id ? String(returnSec.origin_id) : `order:${returnSec.order_index}`);
          } else if (convSec) {
            bSec.logic.default_action = 'GO_TO_PAGE';
            bSec.logic.target = convSec.id || (convSec.origin_id ? String(convSec.origin_id) : `order:${convSec.order_index}`);
          } else {
            bSec.logic.default_action = 'SUBMIT_FORM';
            bSec.logic.target = null;
          }
        }
      }

      // 4. Tự động trỏ các lựa chọn mang ý nghĩa bỏ qua / không tham gia
      const skipTargetSec = returnSec || convSec;

      for (const [optKey, optRule] of Object.entries(q.logic.options)) {
        if (/^(?:không|khong|bỏ\s*qua|bo\s*qua|skip|none|thoát|exit|chỉ\s*muốn|chi\s*muon|không\s*có|khong\s*co|không\s*tham\s*gia|khong\s*tham\s*gia)\b/i.test(optKey)) {
          if (skipTargetSec) {
            q.logic.options[optKey] = {
              action: 'GO_TO_PAGE',
              target: skipTargetSec.id || (skipTargetSec.origin_id ? String(skipTargetSec.origin_id) : `order:${skipTargetSec.order_index}`)
            };
          } else {
            q.logic.options[optKey] = {
              action: 'SUBMIT_FORM',
              target: null
            };
          }
        }
      }

      // Quét thêm cả các lựa chọn trong q.options nếu chưa có trong logic.options
      if (Array.isArray(q.options)) {
        q.options.forEach((optText, optIdx) => {
          if (/^(?:không|khong|bỏ\s*qua|bo\s*qua|skip|none|thoát|exit|chỉ\s*muốn|chi\s*muon|không\s*có|khong\s*co|không\s*tham\s*gia|khong\s*tham\s*gia)\b/i.test(optText)) {
            const rule = skipTargetSec ? {
              action: 'GO_TO_PAGE',
              target: skipTargetSec.id || (skipTargetSec.origin_id ? String(skipTargetSec.origin_id) : `order:${skipTargetSec.order_index}`)
            } : {
              action: 'SUBMIT_FORM',
              target: null
            };
            q.logic.options[optText] = rule;
            q.logic.options[optIdx] = rule;
          }
        });
      }
    }

    // 4. Section cuối cùng của form nếu chưa có logic điều hướng thì mặc định là SUBMIT_FORM
    if (sectionHeaders.length > 0) {
      const lastSec = sectionHeaders[sectionHeaders.length - 1];
      lastSec.logic = lastSec.logic || {};
      if (!lastSec.logic.default_action || lastSec.logic.default_action === 'NEXT_PAGE' || lastSec.logic.default_action === 'NEXT') {
        lastSec.logic.default_action = 'SUBMIT_FORM';
        lastSec.logic.target = null;
      }
    }

    return questions;
  }
}

module.exports = new FormParserService();
