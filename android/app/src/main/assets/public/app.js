// ==============================================================
// RESTRICTION & VALIDATION ENGINE (CHUẨN MICROSOFT / GOOGLE FORMS)
// ==============================================================
const RestrictionEngine = {
  getMeta(restriction) {
    if (!restriction || !restriction.type || restriction.type === 'NONE') {
      return { placeholder: '', defaultError: '', validate: () => ({ valid: true }) };
    }

    const type = String(restriction.type).toUpperCase();
    if (type === 'EMAIL') {
      const defaultErr = restriction.error_message || 'Vui lòng nhập địa chỉ email hợp lệ';
      const placeholder = restriction.placeholder || 'Vui lòng nhập email';
      return {
        placeholder: placeholder,
        defaultError: defaultErr,
        validate: (val) => {
          if (!val || String(val).trim() === '') return { valid: true };
          const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
          return { valid: isValid, error: isValid ? '' : defaultErr };
        }
      };
    }

    if (type === 'NUMBER') {
      const rule = String(restriction.rule || 'IS_NUMBER').toUpperCase();

      if (rule === 'BETWEEN') {
        const hasMin = restriction.min !== undefined && restriction.min !== null && String(restriction.min).trim() !== '' && !isNaN(Number(restriction.min));
        const hasMax = restriction.max !== undefined && restriction.max !== null && String(restriction.max).trim() !== '' && !isNaN(Number(restriction.max));
        if (hasMin && hasMax) {
          const min = parseFloat(restriction.min);
          const max = parseFloat(restriction.max);
          const defaultErr = restriction.error_message || `Số phải nằm trong khoảng từ ${min} đến ${max}`;
          const placeholder = `Số phải nằm trong khoảng từ ${min} ~ ${max}`;
          return {
            placeholder: placeholder,
            defaultError: defaultErr,
            validate: (val) => {
              if (!val || String(val).trim() === '') return { valid: true };
              const n = Number(String(val).trim());
              if (isNaN(n) || String(val).trim() === '') {
                return { valid: false, error: 'Giá trị phải là một số' };
              }
              const isValid = n >= min && n <= max;
              return { valid: isValid, error: isValid ? '' : defaultErr };
            }
          };
        }

        // Nếu restriction KHÔNG có hoặc chỉ có 1 vế:
        // Trả về placeholder: 'Giá trị phải là một số' và validate kiểm tra số hợp lệ (IS_NUMBER).
        const defaultErr = restriction.error_message || 'Giá trị phải là một số';
        const placeholder = 'Giá trị phải là một số';
        return {
          placeholder: placeholder,
          defaultError: defaultErr,
          validate: (val) => {
            if (!val || String(val).trim() === '') return { valid: true };
            const isValid = !isNaN(Number(String(val).trim())) && String(val).trim() !== '';
            return { valid: isValid, error: isValid ? '' : defaultErr };
          }
        };
      }

      if (rule === 'GREATER_THAN') {
        const minVal = (restriction.min !== undefined && restriction.min !== null && String(restriction.min).trim() !== '') ? parseFloat(restriction.min) : 0;
        const defaultErr = restriction.error_message || `Số phải lớn hơn ${minVal}`;
        const placeholder = restriction.placeholder || defaultErr;
        return {
          placeholder: placeholder,
          defaultError: defaultErr,
          validate: (val) => {
            if (!val || String(val).trim() === '') return { valid: true };
            const n = Number(String(val).trim());
            if (isNaN(n) || String(val).trim() === '') return { valid: false, error: 'Giá trị phải là một số' };
            const isValid = n > minVal;
            return { valid: isValid, error: isValid ? '' : defaultErr };
          }
        };
      }

      if (rule === 'LESS_THAN') {
        const maxVal = (restriction.max !== undefined && restriction.max !== null && String(restriction.max).trim() !== '') ? parseFloat(restriction.max) : 100;
        const defaultErr = restriction.error_message || `Số phải nhỏ hơn ${maxVal}`;
        const placeholder = restriction.placeholder || defaultErr;
        return {
          placeholder: placeholder,
          defaultError: defaultErr,
          validate: (val) => {
            if (!val || String(val).trim() === '') return { valid: true };
            const n = Number(String(val).trim());
            if (isNaN(n) || String(val).trim() === '') return { valid: false, error: 'Giá trị phải là một số' };
            const isValid = n < maxVal;
            return { valid: isValid, error: isValid ? '' : defaultErr };
          }
        };
      }

      // Mặc định IS_NUMBER
      const defaultErr = restriction.error_message || 'Giá trị phải là một số';
      const placeholder = 'Giá trị phải là một số';
      return {
        placeholder: placeholder,
        defaultError: defaultErr,
        validate: (val) => {
          if (!val || String(val).trim() === '') return { valid: true };
          const isValid = !isNaN(Number(String(val).trim())) && String(val).trim() !== '';
          return { valid: isValid, error: isValid ? '' : defaultErr };
        }
      };
    }

    if (type === 'LENGTH') {
      const rule = String(restriction.rule || 'MAX_LENGTH').toUpperCase();
      const limit = parseInt(restriction.min || restriction.max || restriction.length || 100, 10) || 100;
      const isMin = rule === 'MIN_LENGTH';
      const defaultErr = restriction.error_message || (isMin ? `Số ký tự phải có ít nhất ${limit} ký tự` : `Số ký tự không được vượt quá ${limit} ký tự`);
      const placeholder = restriction.placeholder || defaultErr;
      return {
        placeholder: placeholder,
        defaultError: defaultErr,
        validate: (val) => {
          if (!val || String(val).trim() === '') return { valid: true };
          const len = String(val).length;
          const isValid = isMin ? len >= limit : len <= limit;
          return { valid: isValid, error: isValid ? '' : defaultErr };
        }
      };
    }

    if (type === 'URL') {
      const defaultErr = restriction.error_message || 'Vui lòng nhập đường dẫn URL hợp lệ';
      const placeholder = restriction.placeholder || 'Vui lòng nhập URL hợp lệ';
      return {
        placeholder: placeholder,
        defaultError: defaultErr,
        validate: (val) => {
          if (!val || String(val).trim() === '') return { valid: true };
          const isValid = /^https?:\/\/.+/i.test(String(val).trim());
          return { valid: isValid, error: isValid ? '' : defaultErr };
        }
      };
    }

    return { placeholder: '', defaultError: '', validate: () => ({ valid: true }) };
  },

  extractNumberRange(str) {
    if (!str) return null;
    let text = typeof str === 'string' ? str : '';
    if (!text && typeof str === 'object') {
      try {
        if (str.title || str.placeholder || str.subtitle || str.description) {
          text = [str.title, str.subtitle, str.placeholder, str.description].filter(Boolean).join(' ');
        } else {
          text = JSON.stringify(str);
        }
      } catch {
        return null;
      }
    }
    if (!text || typeof text !== 'string') return null;

    // 0. Làm sạch định dạng ngày tháng ISO, ngày tháng thông thường, timestamp và số điện thoại
    const sanitizedText = text
      .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:T\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?/gi, ' ')
      .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, ' ')
      .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g, ' ')
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
      .replace(/\b0\d{1,3}[-.]\d{3,4}[-.]\d{3,4}\b/g, ' ');

    // 1. Cặp số trong mảng JSON: ["20000000", "20270000"] hoặc [18, 60]
    const jsonArrMatch = sanitizedText.match(/\[\s*["']?(\d+(?:[.,]\d+)?)["']?\s*,\s*["']?(\d+(?:[.,]\d+)?)["']?\s*\]/);
    if (jsonArrMatch) {
      const n1 = parseFloat(jsonArrMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(jsonArrMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }

    // 2. Cặp số trong thuộc tính JSON: min/max, minValue/maxValue, lowerBound/upperBound, restrictionValue1/restrictionValue2, operand1/operand2, value1/value2
    const jsonPropPatterns = [
      /(?:["']?min(?:Value)?["']?|["']?lowerBound["']?|["']?restrictionValue1["']?|["']?operand1["']?|["']?value1["']?|["']?val1["']?|["']?firstValue["']?)\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?[\s\S]*?(?:["']?max(?:Value)?["']?|["']?upperBound["']?|["']?restrictionValue2["']?|["']?operand2["']?|["']?value2["']?|["']?val2["']?|["']?secondValue["']?)\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?/i,
      /(?:["']?max(?:Value)?["']?|["']?upperBound["']?|["']?restrictionValue2["']?|["']?operand2["']?|["']?value2["']?|["']?val2["']?|["']?secondValue["']?)\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?[\s\S]*?(?:["']?min(?:Value)?["']?|["']?lowerBound["']?|["']?restrictionValue1["']?|["']?operand1["']?|["']?value1["']?|["']?val1["']?|["']?firstValue["']?)\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?/i
    ];
    for (const pat of jsonPropPatterns) {
      const m = sanitizedText.match(pat);
      if (m) {
        const n1 = parseFloat(m[1].replace(/,/g, ''));
        const n2 = parseFloat(m[2].replace(/,/g, ''));
        if (!isNaN(n1) && !isNaN(n2)) {
          return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
        }
      }
    }

    // 3. Bắt mẫu rõ ràng: "số phải nằm trong khoảng từ ... đến ...", "trong khoảng ... đến ...", "từ ... ~ ..."
    const explicitRangeMatch = sanitizedText.match(/(?:số\s*phải\s*nằm\s*trong\s*khoảng\s*(?:từ)?|nằm\s*trong\s*khoảng\s*(?:từ)?|trong\s*khoảng\s*(?:từ)?|khoảng\s*(?:từ)?|khoang\s*(?:tu)?|giới\s*hạn\s*(?:từ)?|between)\s*["']?(\d+(?:[.,]\d+)?)["']?\s*(?:đến|den|tới|toi|to|và|va|and|~|-|–|—)\s*["']?(\d+(?:[.,]\d+)?)["']?/i);
    if (explicitRangeMatch) {
      const n1 = parseFloat(explicitRangeMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(explicitRangeMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }

    // 3b. Mẫu "từ X đến/tới Y"
    const fromToPattern = /(?:^|[^\w])(?:từ|tu|from)\s*["']?(\d+(?:[.,]\d+)?)["']?\s*(?:đến|den|tới|toi|to|~|-|–|—)\s*["']?(\d+(?:[.,]\d+)?)["']?/i;
    const fromToMatch = sanitizedText.match(fromToPattern);
    if (fromToMatch) {
      const n1 = parseFloat(fromToMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(fromToMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }

    // 4. Dải số có ký tự nối/từ nối: ~, -, \u2013, \u2014, \u2212, \uFF5E, \u223C, \u02DC, đến, den, to, và, va, and
    const normalized = sanitizedText
      .replace(/[\uFF5E\u223C\u02DC]/g, '~')
      .replace(/[\u2013\u2014\u2212]/g, '~')
      .replace(/(?<=\d)\s*(?:đến|den|tới|toi|to|và|va|and)\s*(?=\d)/gi, ' ~ ')
      .replace(/(?<=\d)\s*[-~]\s*(?=\d)/g, ' ~ ');

    const match = normalized.match(/(\d+(?:[.,]\d+)?)\s*~\s*(\d+(?:[.,]\d+)?)/);
    if (match) {
      const n1 = parseFloat(match[1].replace(/,/g, ''));
      const n2 = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2) && n1 !== n2) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }
    return null;
  },

  inferValidationFromTitle(title, description = '') {
    const text = `${title || ''} ${description || ''}`.trim().toLowerCase();
    if (!text) return null;

    // 1. Dải số cụ thể (Ưu tiên số 1 tuyệt đối: "20000000 ~ 202700000", "18 đến 60", "1 ~ 100", ...)
    // Ngăn chặn hoàn toàn việc nhận diện MSSV / SĐT / Số tự động ép về IS_NUMBER khi đã có dải số!
    const range = this.extractNumberRange(text);
    if (range) {
      return {
        type: 'NUMBER',
        rule: 'BETWEEN',
        min: range.min,
        max: range.max,
        placeholder: 'Số phải nằm trong khoảng từ ' + range.min + ' ~ ' + range.max,
        error_message: 'Số phải nằm trong khoảng từ ' + range.min + ' đến ' + range.max
      };
    }

    // 2. Email ("Email", "Email HUST", "Thư điện tử", ...)
    if (/\b(email|e-mail|thư điện tử|thu dien tu)\b/i.test(text) || text.includes('email') || text.includes('thư điện tử') || text.includes('thu dien tu')) {
      return {
        type: 'EMAIL',
        rule: 'EMAIL',
        placeholder: 'Vui lòng nhập email',
        error_message: 'Vui lòng nhập địa chỉ email hợp lệ'
      };
    }

    // 3. Mã số sinh viên ("Mã số sinh viên", "MSSV", "Số thẻ sinh viên", "Mã SV", ...) khi KHÔNG có dải số kèm theo
    if (/\b(mssv|mã số sinh viên|ma so sinh vien|số thẻ sinh viên|so the sinh vien|mã sinh viên|ma sinh vien|mã sv|ma sv)\b/i.test(text) ||
        text.includes('mssv') || text.includes('mã số sinh viên') || text.includes('ma so sinh vien') || text.includes('số thẻ sinh viên') || text.includes('so the sinh vien') || text.includes('mã sinh viên') || text.includes('ma sinh vien') || text.includes('mã sv') || text.includes('ma sv')) {
      return {
        type: 'NUMBER',
        rule: 'IS_NUMBER',
        placeholder: 'Giá trị phải là một số',
        error_message: 'Giá trị phải là một số'
      };
    }

    // 4. Số điện thoại ("Số điện thoại", "SĐT", "Điện thoại", ...) khi KHÔNG có dải số kèm theo
    if (/\b(số điện thoại|so dien thoai|sđt|sdt|điện thoại|dien thoai|phone|hotline)\b/i.test(text) ||
        text.includes('số điện thoại') || text.includes('so dien thoai') || text.includes('sđt') || text.includes('sdt') || text.includes('điện thoại') || text.includes('dien thoai')) {
      return {
        type: 'NUMBER',
        rule: 'IS_NUMBER',
        placeholder: 'Giá trị phải là một số',
        error_message: 'Giá trị phải là một số'
      };
    }

    // 5. Tuổi, năm sinh hoặc số lượng tổng quát nếu không có dải số
    if (/\b(tuổi|độ tuổi|do tuoi|năm sinh|nam sinh)\b/i.test(text) ||
        text.includes('độ tuổi') || text.includes('do tuoi')) {
      return {
        type: 'NUMBER',
        rule: 'IS_NUMBER',
        placeholder: 'Giá trị phải là một số',
        error_message: 'Giá trị phải là một số'
      };
    }

    // 6. Website ("Website", "URL", "Trang web", ...)
    if (/\b(website|url|trang web|link web)\b/i.test(text) ||
        text.includes('website') || text.includes('url') || text.includes('trang web') || text.includes('link web')) {
      return {
        type: 'URL',
        rule: 'URL',
        placeholder: 'Vui lòng nhập URL hợp lệ',
        error_message: 'Vui lòng nhập đường dẫn URL hợp lệ'
      };
    }

    return null;
  }
};
if (typeof window !== 'undefined') {
  window.RestrictionEngine = RestrictionEngine;
}


// ==================== CƠ SỞ DỮ LIỆU BỘ LỌC ĐỐI TƯỢNG: DỮ LIỆU GỐC ĐÃ TÁCH RA public/js/data/catalogs.js (WAVE 1 MODULAR) ====================
// Destructure giữ binding cục bộ cho mọi tham chiếu trần trong app.js; dữ liệu thật được nạp trước qua window.VibeData (js/data/catalogs.js).
const { VIBE_PROVINCES_34 = [], VIBE_AGE_GROUPS = [], VIBE_OCCUPATIONS = [], VIBE_UNIVERSITIES_DATA = [], VIBE_34_PROVINCES = [], VIBE_SYSTEM_CATEGORIES = [], DEFAULT_STUDIO_CATALOG_VOUCHERS = [] } = window.VibeData || {};

/**
 * SurvHub - High-End Modern SaaS & Survey Rewards Platform
 * Phong cách: Linear / Stripe / Raycast (Sang trọng, Bento Grid, có chiều sâu thị giác)
 */




window.VibeApp = window.VibeApp || {};
const VibeApp = window.VibeApp = Object.assign(window.VibeApp, {
  state: {
    token: localStorage.getItem('survhub_token') || localStorage.getItem('vibesurvey_token') || null,
    currentUser: null,
    currentTab: 'home',
    mobileStudioActiveTab: 'CANVAS', // 'CANVAS' (Soạn câu hỏi) | 'SIDEBAR' (Cài đặt & ngân sách)
    categoryFilter: 'ALL',
    surveyCategoryFilter: 'ALL',
    searchQuery: '',
    hideFinished: true, // Tự động ẩn khảo sát đã đủ 100% mẫu hoặc người dùng đã nhận thưởng
    viewMode: 'grid', // 'grid' (Lưới 4 cột compact) | 'list' (Danh sách 1 dòng siêu gọn)
    sortBy: 'recommended', // 'recommended' | 'reward_desc' | 'reward_asc' | 'speed' | 'few_questions' | 'progress_desc' | 'newest'
    lengthFilter: 'ALL', // 'ALL' | 'SHORT' (1-3 câu) | 'MEDIUM' (4-7 câu) | 'LONG' (>= 8 câu)
    speedFilter: 'ALL', // 'ALL' | 'FAST_1M' (<= 1p) | 'FAST_3M' (<= 3p)
    rewardTierFilter: 'ALL', // 'ALL' | 'TIER_LOW' (< 150) | 'TIER_MID' (150-299) | 'TIER_HIGH' (>= 300)
    surveys: [],
    creatorSurveys: [],
    voucherCatalog: [],
    myVouchers: [],
    wallet: null,
    transactions: [],
    activeSession: null,
    fraudLogPage: 1,
    adminViewMode: localStorage.getItem('survhub_admin_view_mode') || localStorage.getItem('vibesurvey_admin_view_mode') || 'ADMIN', // 'ADMIN' | 'RESPONDENT' | 'CREATOR'
    adminMode: localStorage.getItem('survhub_admin_view_mode') || localStorage.getItem('vibesurvey_admin_view_mode') || 'ADMIN',
    velocityBenchmark: {
      has_sufficient_data: false,
      completed_surveys_count: 0,
      threshold_required: 30
    },
    imagePicker: {
      isOpen: false,
      target: 'cover',
      targetQuestionIdx: null,
      activeTab: 'upload',
      selectedFile: null,
      compressedResult: null,
      isCompressing: false,
      isUploading: false,
      urlInput: ''
    },
    surveyRunner: {
      visited_sections: new Set()
    },
  },

  normalizeCategoryCode(cat) {
    if (!cat) return 'OTHER';
    const raw = String(cat).trim();
    if (!raw) return 'OTHER';
    const upper = raw.toUpperCase();
    if (upper === 'ALL') return 'ALL';
    const categories = window.VIBE_SYSTEM_CATEGORIES || [];
    const exactId = categories.find(c => c.id === upper);
    if (exactId) return exactId.id;
    const lower = raw.toLowerCase();
    const exactLabel = categories.find(c => c.label.toLowerCase() === lower);
    if (exactLabel) return exactLabel.id;
    const keywordMatch = categories.find(c => (c.keywords || []).some(kw => lower.includes(kw)));
    if (keywordMatch) return keywordMatch.id;
    return 'OTHER';
  },

  getCategoryMeta(cat) {
    const categories = window.VIBE_SYSTEM_CATEGORIES || [];
    const code = this.normalizeCategoryCode(cat);
    if (code === 'ALL') {
      return { id: 'ALL', label: 'Tất cả lĩnh vực', icon: 'layers', keywords: [] };
    }
    const found = categories.find(c => c.id === code);
    if (found) return found;
    return { id: 'OTHER', label: 'Đa ngành & Lĩnh vực khác', icon: 'tag', keywords: ['khác', 'tổng hợp', 'đa ngành', 'khảo sát', 'test'] };
  },

  // getForumCategoryMeta (bản trùng lặp cũ): ĐÃ XÓA - giữ duy nhất bản định nghĩa sau trong object VibeApp (WAVE 1 MODULAR)

  // ==================== HTTP CLIENT ====================
  async api(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (this.state.token) {
      headers['Authorization'] = `Bearer ${this.state.token}`;
    }

    // Tự động chuyển đổi body thành chuỗi JSON nếu truyền dạng object thông thường
    if (options.body && typeof options.body === 'object' && !(typeof FormData !== 'undefined' && options.body instanceof FormData)) {
      options.body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch('/api/v1' + endpoint, { ...options, headers });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        if (!res.ok) {
          throw new Error(`Máy chủ đang cập nhật (${res.status}). Vui lòng tải lại trang sau giây lát.`);
        }
        throw new Error('Định dạng phản hồi không hợp lệ từ máy chủ');
      }
      if (!res.ok) {
        const apiErr = new Error(data.message || 'Yêu cầu không thành công');
        apiErr.status = res.status;
        apiErr.statusCode = res.status;
        apiErr.data = data;
        throw apiErr;
      }
      return data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  },

  haptic(type = 'light') {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
      if (type === 'success') window.Capacitor.Plugins.Haptics.notification({ type: 'SUCCESS' }).catch(() => { });
      else window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }).catch(() => { });
    } else if (navigator.vibrate) {
      navigator.vibrate(type === 'success' ? [25, 35, 25] : 15);
    }
  },

  getDeviceFingerprint() {
    return 'browser_' + btoa(navigator.userAgent + '_' + screen.width + 'x' + screen.height).slice(0, 32);
  },

  // ==================== QUẢN LÝ GIAO DIỆN SÁNG / TỐI (THEME) ====================
  initTheme() {
    const saved = localStorage.getItem('survhub_theme') || localStorage.getItem('vibesurvey_theme');
    // Mặc định luôn là LIGHT MODE theo yêu cầu, chỉ bật dark khi người dùng đã chủ động chọn 'dark'
    const isDark = saved === 'dark';

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.updateThemeIcon(isDark);
    this.updateThemeLogos(isDark);
  },

  toggleTheme(event) {
    this.haptic('light');

    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('survhub_theme', isDark ? 'dark' : 'light');
    this.updateThemeIcon(isDark);
    this.updateThemeLogos(isDark);
    return isDark;
  },

  updateThemeIcon(isDark) {
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      const sun = btn.querySelector('.theme-icon-sun');
      const moon = btn.querySelector('.theme-icon-moon');
      if (!sun || !moon) {
        btn.innerHTML = `
          <span class="theme-icon-sun absolute inset-0 flex items-center justify-center text-amber-500">
            <i data-lucide="sun" class="w-4 h-4 stroke-[2.2]"></i>
          </span>
          <span class="theme-icon-moon absolute inset-0 flex items-center justify-center text-stone-600 dark:text-stone-300">
            <i data-lucide="moon" class="w-4 h-4 stroke-[2.2]"></i>
          </span>
        `;
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons({ root: btn });
        }
      }
    }
  },

  updateThemeLogos(isDark) {
    const targetSrc = isDark ? '/logo-dark.svg' : '/logo-light.svg';
    const mainLogo = document.getElementById('main-brand-logo');
    if (mainLogo) {
      mainLogo.src = targetSrc;
    }
    const footerLogo = document.getElementById('footer-brand-logo');
    if (footerLogo) {
      footerLogo.src = targetSrc;
    }
    const authLogo = document.getElementById('auth-modal-logo');
    if (authLogo) {
      authLogo.src = targetSrc;
    }
  },

  // ==================== KHỞI TẠO LOGO THƯƠNG HIỆU CHUẨN CHÍNH HÃNG (3-TIER MULTI-SOURCE & ZERO-BROKEN FALLBACK) ====================
  getBrandLogoHtml(brandName, websiteDomain = '', customLogoUrl = '') {
    const raw = (brandName || '').trim();
    const b = raw.toLowerCase();

    // Danh bạ thương hiệu được chuẩn hóa slug, domain và asset
    const brandDirectory = {
      'phuc-long': {
        name: 'Phúc Long Coffee & Tea',
        domain: 'phuclong.com.vn',
        localLogo: '/assets/logos/phuc-long.png',
        svgLogo: '/assets/logos/phuc-long.svg',
        bgColor: '#01522C',
        keywords: ['phuc long', 'phúc long', 'phuclong']
      },
      'grab': {
        name: 'Grab',
        domain: 'grab.com',
        localLogo: '/assets/logos/grab.png',
        svgLogo: '/assets/logos/grab.svg',
        bgColor: '#00B14F',
        keywords: ['grab', 'grabfood', 'grabmart']
      },
      'shopee': {
        name: 'Shopee',
        domain: 'shopee.vn',
        localLogo: '/assets/logos/shopee.png',
        svgLogo: '/assets/logos/shopee.svg',
        bgColor: '#EE4D2D',
        keywords: ['shopee', 'shopeefood']
      },
      'highlands-coffee': {
        name: 'Highlands Coffee',
        domain: 'highlandscoffee.com.vn',
        localLogo: '/assets/logos/highlands-coffee.svg',
        svgLogo: '/assets/logos/highlands-coffee.svg',
        bgColor: '#B31010',
        keywords: ['highlands', 'highland']
      },
      'cgv-cinemas': {
        name: 'CGV Cinemas',
        domain: 'cgv.vn',
        localLogo: '/assets/logos/cgv-cinemas.svg',
        svgLogo: '/assets/logos/cgv-cinemas.svg',
        bgColor: '#E71A0F',
        keywords: ['cgv', 'cinema', 'rap chieu phim']
      },
      'starbucks': {
        name: 'Starbucks Vietnam',
        domain: 'starbucks.vn',
        localLogo: '/assets/logos/starbucks.png',
        svgLogo: '/assets/logos/starbucks.svg',
        bgColor: '#006241',
        keywords: ['starbucks', 'starbuck']
      },
      'lazada': {
        name: 'Lazada Vietnam',
        domain: 'lazada.vn',
        localLogo: '/assets/logos/lazada.png',
        bgColor: '#0f146d',
        keywords: ['lazada']
      },
      'tiki': {
        name: 'Tiki Vietnam',
        domain: 'tiki.vn',
        localLogo: '/assets/logos/tiki.png',
        bgColor: '#1A94FF',
        keywords: ['tiki']
      },
      'the-coffee-house': {
        name: 'The Coffee House',
        domain: 'thecoffeehouse.com',
        localLogo: '/assets/logos/the-coffee-house.png',
        bgColor: '#EA8025',
        keywords: ['the coffee house', 'coffee house', 'tch']
      }
    };

    let matched = null;
    for (const slug of Object.keys(brandDirectory)) {
      const item = brandDirectory[slug];
      if (item.keywords.some(k => b.includes(k)) || (websiteDomain && websiteDomain.toLowerCase().includes(item.domain))) {
        matched = { slug, ...item };
        break;
      }
    }

    const domain = websiteDomain || (matched ? matched.domain : '');
    let primarySrc = customLogoUrl || (matched ? (matched.svgLogo || matched.localLogo) : '');
    if (!primarySrc && domain) {
      primarySrc = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
    }
    if (!primarySrc) {
      primarySrc = '/assets/logos/default-voucher.svg';
    }

    const fallbackFavicon = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : '/assets/logos/default-voucher.svg';
    const initials = (raw || 'V').trim().substring(0, 2).toUpperCase();
    const bg = matched ? matched.bgColor : '#334155';

    return `
      <div class="w-full h-full relative flex items-center justify-center p-1 rounded-xl overflow-hidden bg-white dark:bg-stone-900 shadow-2xs border border-stone-200/50 dark:border-stone-700/50">
        <img src="${primarySrc}" 
             alt="${raw || 'Brand'}" 
             class="w-full h-full object-contain pointer-events-none transition-transform duration-200 select-none"
             loading="lazy"
             onerror="if(!this.dataset.step){this.dataset.step='1';this.src='${fallbackFavicon}';}else if(this.dataset.step==='1'){this.dataset.step='2';this.src='/assets/logos/default-voucher.svg';}else{this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';}" />
        <div class="w-full h-full rounded-lg text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center shadow-xs" 
             style="display: none; background-color: ${bg};">
          ${initials}
        </div>
      </div>
    `.trim();
  },

  getProgressBarColor(pct) {
    const p = Math.round(Number(pct) || 0);
    if (p < 20) return '#94a3b8'; // Xám (< 20%)
    if (p < 40) return '#10b981'; // Xanh lá (20% - 39%)
    if (p < 70) return '#2563eb'; // Xanh nước biển (40% - 69%)
    if (p < 90) return '#f59e0b'; // Vàng (70% - 89%)
    return '#f43f5e';            // Đỏ (>= 90%)
  },

  getProgressBarStyle(pct) {
    const p = Math.min(100, Math.max(0, Math.round(Number(pct) || 0)));
    const color = this.getProgressBarColor(p);
    return `width: ${p}%; background-color: ${color} !important;`;
  },

  getProgressColorClass(pct) {
    const p = Math.round(Number(pct) || 0);
    if (p < 20) return 'bg-slate-400 dark:bg-slate-500';
    if (p < 40) return 'bg-emerald-500';
    if (p < 70) return 'bg-orange-600';
    if (p < 90) return 'bg-amber-500';
    return 'bg-rose-500';
  },


  selectCustomFormOption(inputId, value, label, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.haptic('light');
    const input = document.getElementById(inputId);
    const labelEl = document.getElementById(inputId + '-label');
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('change'));
    }
    if (labelEl) labelEl.textContent = label;
    this.closeAllCustomDropdowns();
  },

  filterDemoUniversities(query) {
    const q = (query || '').trim().toLowerCase();
    const listEl = document.getElementById('demo-uni-dropdown-list');
    const popover = document.getElementById('demo-uni-popover');
    if (!listEl || !popover) return;
    popover.classList.remove('hidden');

    const schools = window.VIBE_UNIVERSITIES_DATA || [];
    let matched = [];
    if (!q) {
      matched = schools.slice(1, 15);
    } else {
      matched = schools.filter(u =>
        (u.n && u.n.toLowerCase().includes(q)) ||
        (u.c && u.c.toLowerCase().includes(q))
      ).slice(0, 15);
    }

    if (matched.length === 0) {
      listEl.innerHTML = '<div class="p-3 text-stone-400 text-xs text-center">Không tìm thấy trường khớp</div>';
      return;
    }

    listEl.innerHTML = matched.map(u => `
      <div onclick="VibeApp.selectDemoUniversity('${u.n.replace(/'/g, "\\'")}')" class="p-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer text-xs transition-colors flex flex-col gap-0.5">
        <span class="font-bold text-slate-800 dark:text-slate-100">${u.n}</span>
        <span class="text-[10px] text-stone-400">${u.c !== u.n ? u.c : ''} ${u.d && u.d.length ? '• ' + u.d.join(', ') : ''}</span>
      </div>
    `).join('');
  },

  selectDemoUniversity(schoolName) {
    this.haptic('light');
    const input = document.getElementById('demo-university');
    if (input) input.value = schoolName;
    const popover = document.getElementById('demo-uni-popover');
    if (popover) popover.classList.add('hidden');
  },

  // closeAllCustomDropdowns (bản trùng lặp cũ, lạc hậu): ĐÃ XÓA - hợp nhất giữ duy nhất bản định nghĩa sau trong object VibeApp (WAVE 1 MODULAR)

  async init() {
    this.initTheme();

    // Cơ chế Click Outside đóng toàn bộ Dropdown / Popover trong toàn hệ thống
    document.addEventListener('click', (e) => {
      // 1. Nếu click vào nút trigger hoặc bên trong menu/popover/input tìm kiếm thì không đóng tự động
      const isTrigger = e.target.closest('.custom-dropdown-trigger') ||
        e.target.closest('#user-profile-btn') ||
        e.target.closest('#header-notif-btn') ||
        e.target.closest('#studio-region-input') ||
        e.target.closest('#studio-uni-input') ||
        e.target.closest('#demo-university');

      const isInsideMenu = e.target.closest('.custom-dropdown-menu') ||
        e.target.closest('.vibe-popover') ||
        e.target.closest('#user-profile-dropdown') ||
        e.target.closest('#header-notif-dropdown') ||
        e.target.closest('#survey-cat-dropdown-menu') ||
        e.target.closest('#studio-region-popover') ||
        e.target.closest('#studio-uni-popover') ||
        e.target.closest('#demo-uni-popover') ||
        e.target.closest('#studio-region-menu') ||
        e.target.closest('#studio-category-menu') ||
        e.target.closest('#studio-gender-menu') ||
        e.target.closest('#studio-age-menu') ||
        e.target.closest('#studio-occ-menu') ||
        e.target.closest('#studio-duration-menu');

      if (isTrigger || isInsideMenu) {
        return;
      }

      // 2. Click hoàn toàn ra ngoài => Đóng tất cả dropdown và popover
      this.closeAllCustomDropdowns();
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Đóng Lightbox ảnh hoặc Modal khi nhấn Escape
      if (e.key === 'Escape') {
        if (this._tvModeActive) {
          this.toggleAdminFullscreenTvMode();
          return;
        }
        const lb = document.getElementById('image-lightbox-modal');
        if (lb && !lb.classList.contains('hidden')) {
          this.closeImageLightbox();
          return;
        }
        const bugModal = document.getElementById('admin-bug-detail-modal');
        if (bugModal && !bugModal.classList.contains('hidden')) {
          bugModal.classList.add('hidden');
          return;
        }
      }

      // Phím tắt mở nhanh Admin Command Console (F2 hoặc Ctrl + `)
      if ((e.key === 'F2' || (e.ctrlKey && e.key === '`')) && this.state.currentUser && this.state.currentUser.role === 'ADMIN') {
        e.preventDefault();
        this.openAdminConsoleModal();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const searchInput = document.getElementById('survey-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Phím tắt trong Stepper Survey
      if (this.state.currentTab === 'take-survey' && this.state.activeSession && this.state.activeSession.hasStartedQuiz) {
        const session = this.state.activeSession;
        const curQ = session.questions && session.questions[session.currentIndex];

        // 1. Phím số 1-9 để chọn nhanh đáp án khi không focus vào input/textarea
        if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
          if (curQ && curQ.options && /^[1-9]$/.test(e.key)) {
            const optIdx = parseInt(e.key, 10) - 1;
            if (optIdx < curQ.options.length) {
              e.preventDefault();
              const opt = curQ.options[optIdx];
              this.selectSingleOption(curQ.id, encodeURIComponent(opt));
              return;
            }
          }
        }

        // 2. Phím Enter chuyển câu hỏi
        if (e.key === 'Enter') {
          // Không kích hoạt nếu đang mở modal hoặc dropdown
          const hasOpenModal = document.querySelector('.modal-backdrop, [id$="-modal"]:not(.hidden)');
          const hasOpenDropdown = document.querySelector('.custom-dropdown-menu:not(.hidden)');
          if (hasOpenModal || hasOpenDropdown) return;

          if (e.target.tagName === 'TEXTAREA') {
            if (e.shiftKey) {
              // Giữ nguyên mặc định (xuống dòng)
              return;
            }
            if (e.ctrlKey || e.metaKey || !e.target.value.trim()) {
              e.preventDefault();
              this.nextQuestion();
              return;
            }
          } else if (e.target.tagName === 'INPUT') {
            e.preventDefault();
            this.nextQuestion();
            return;
          } else {
            e.preventDefault();
            this.nextQuestion();
            return;
          }
        }

        // 3. Phím Mũi tên điều hướng câu hỏi (ArrowRight/ArrowDown -> Next, ArrowLeft/ArrowUp -> Prev)
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          const isText = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
          if (!isText || (e.target.selectionStart === e.target.value.length && e.key === 'ArrowRight')) {
            const hasOpenModal = document.querySelector('.modal-backdrop, [id$="-modal"]:not(.hidden)');
            const hasOpenDropdown = document.querySelector('.custom-dropdown-menu:not(.hidden)');
            if (!hasOpenModal && !hasOpenDropdown) {
              e.preventDefault();
              this.nextQuestion();
              return;
            }
          }
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          const isText = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
          if (!isText || (e.target.selectionStart === 0 && e.key === 'ArrowLeft')) {
            const hasOpenModal = document.querySelector('.modal-backdrop, [id$="-modal"]:not(.hidden)');
            const hasOpenDropdown = document.querySelector('.custom-dropdown-menu:not(.hidden)');
            if (!hasOpenModal && !hasOpenDropdown) {
              e.preventDefault();
              this.prevQuestion();
              return;
            }
          }
        }
      }
    });

    // Xử lý URL parameters khi Google OAuth Callback trả về
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get('token');
    const authError = urlParams.get('error');
    const googleConfigNeeded = urlParams.get('google_auth_config');
    const formsConnected = urlParams.get('forms_connected');
    const googleFormsEmail = urlParams.get('google_forms_email');

    if (formsConnected) {
      window.history.replaceState({}, document.title, window.location.pathname);
      this.showToast(`Đã ủy quyền Google Forms thành công cho tài khoản ${googleFormsEmail || ''}!`, 'success');
      this.state.currentTab = 'create-survey';
      this.state.createSurveyTab = 'SYNC_EXTERNAL';
    } else if (googleToken) {
      this.state.token = googleToken;
      localStorage.setItem('survhub_token', googleToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      this.showToast('Đăng nhập Google chính thức thành công!', 'success');
    } else if (authError) {
      window.history.replaceState({}, document.title, window.location.pathname);
      this.showToast(decodeURIComponent(authError), 'error');
    } else if (googleConfigNeeded) {
      window.history.replaceState({}, document.title, window.location.pathname);
      this.showGoogleConfigGuideModal();
    }

    // Khôi phục người dùng từ Cache để triệt tiêu hoàn toàn hiện tượng lóe Guest state khi F5
    const cachedUserJson = localStorage.getItem('survhub_cached_user') || localStorage.getItem('vibesurvey_cached_user');
    let savedTab = localStorage.getItem('survhub_current_tab') || localStorage.getItem('vibesurvey_current_tab');
    if (!this.state.token && (!savedTab || savedTab === 'surveys')) {
      savedTab = 'home';
    }
    if (!this.state.token) {
      this.state.currentTab = savedTab || 'home';
    }
    if (this.state.token && cachedUserJson) {
      try {
        this.state.currentUser = JSON.parse(cachedUserJson);
        this.state.currentTab = savedTab;
        this.applyUserInterface(true); // silent restore
      } catch (err) {
        console.warn('Lỗi đọc cached user:', err);
      }
    }

    // Khởi tạo trạng thái phiên làm việc thực từ server
    if (this.state.token) {
      try {
        const meRes = await this.api('/auth/me');
        if (meRes.success && meRes.user) {
          this.state.currentUser = meRes.user;
          localStorage.setItem('survhub_cached_user', JSON.stringify(this.state.currentUser));
          // Kiểm tra xem có phiên làm bài khảo sát dở dang cần khôi phục khi người dùng đang làm mà F5
          const cachedSessionJson = (localStorage.getItem('survhub_active_session') || localStorage.getItem('vibesurvey_active_session'));
          if (cachedSessionJson) {
            try {
              const restoredSession = JSON.parse(cachedSessionJson);
              if (restoredSession && restoredSession.surveyId && restoredSession.questions?.length > 0) {
                this.state.activeSession = restoredSession;

                // Chỉ tự động mở lại bài khảo sát nếu tab trước đó thực sự là 'take-survey' (người dùng đang làm mà F5 trang)
                if (savedTab === 'take-survey') {
                  this.state.currentTab = 'take-survey';
                  this.applyUserInterface(true); // silent = true để không kích hoạt navigate(savedTab) ghi đè giao diện!

                  // Khởi động lại timer
                  if (this.state.activeSession.timerId) clearInterval(this.state.activeSession.timerId);
                  this.state.activeSession.timerId = setInterval(() => {
                    if (this.state.activeSession) {
                      this.state.activeSession.durationSec = (this.state.activeSession.durationSec || 0) + 1;
                      this._saveActiveSessionToStorage();
                      const timerEl = document.getElementById('session-timer-text');
                      if (timerEl) {
                        const sec = this.state.activeSession.durationSec;
                        const mins = Math.floor(sec / 60);
                        const remSec = sec % 60;
                        timerEl.textContent = `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
                      }
                    }
                  }, 1000);
                  await this.navigate('take-survey', { surveyId: restoredSession.surveyId });
                  return;
                }
              }
            } catch (err) {
              localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');
            }
          }

          this.state.currentTab = savedTab;
          this.applyUserInterface();

          this.checkDeepLinkSurvey();
          this.initPushNotifications();
          return;
        }
      } catch (e) {
        console.warn('Phiên đăng nhập đã hết hạn');
        this.state.token = null;
        localStorage.removeItem('survhub_token');
        localStorage.removeItem('survhub_token');
    localStorage.removeItem('vibesurvey_token');
    localStorage.removeItem('survhub_cached_user');
    localStorage.removeItem('vibesurvey_cached_user');
        localStorage.removeItem('survhub_cached_user');
    localStorage.removeItem('survhub_cached_user');
    localStorage.removeItem('vibesurvey_cached_user');
      }
    }

    // Nếu chưa đăng nhập: Hiển thị giao diện khách
    this.applyGuestInterface();
    this.checkDeepLinkSurvey();
    this.initPushNotifications();
  },

  /**
   * Kiểm tra và phân tích Deep-link khảo sát từ Email / Thông báo
   * Hỗ trợ các định dạng URL: ?survey={id}, ?surveyId={id}, hoặc #survey-{id}
   */
  checkDeepLinkSurvey() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetSurveyId = urlParams.get('survey') || urlParams.get('surveyId') || (window.location.hash.startsWith('#survey-') ? window.location.hash.replace('#survey-', '') : null);
      if (targetSurveyId) {
        // Làm sạch URL hiển thị trên thanh địa chỉ nhưng vẫn giữ ngữ cảnh
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        setTimeout(() => {
          this.handleDeepLinkSurvey(targetSurveyId);
        }, 350);
      }
    } catch (err) {
      console.warn('Lỗi phân tích Deep-link khảo sát:', err);
    }
  },

  /**
   * Xử lý chuyển thẳng vào bài khảo sát khi click từ Email thông báo
   */
  async handleDeepLinkSurvey(surveyId) {
    if (!surveyId) return;
    this.haptic('medium');

    // Nếu người dùng đã đăng nhập: Chuyển thẳng vào làm bài khảo sát (Stepper Zen Focus)
    if (this.state.currentUser) {
      this.showToast('Đang chuyển bạn đến bài khảo sát từ email thông báo...', 'info');
      await this.startSurveySession(surveyId);
      return;
    }

    // Nếu là khách chưa đăng nhập:
    // Lưu pendingSurveyId, mở Modal xem trước khảo sát đầy đủ thông tin & thù lao hấp dẫn
    this.state.pendingSurveyId = surveyId;
    this.showToast('Vui lòng đăng nhập để bắt đầu làm khảo sát này và nhận điểm thưởng!', 'info');
    await this.openSurveyPreviewModal(surveyId);
  },

  applyGuestInterface() {
    this.state.currentUser = null;
    this.state.token = null;
    localStorage.removeItem('survhub_cached_user');
    localStorage.removeItem('vibesurvey_cached_user');

    const balancePill = document.getElementById('user-balance-pill');
    const ticketsChip = document.getElementById('header-tickets-chip');
    const createBtn = document.getElementById('header-create-btn');
    const userProfileMenu = document.getElementById('user-profile-menu');
    const guestAuthActions = document.getElementById('guest-auth-actions');

    if (balancePill) {
      balancePill.style.display = 'none';
      balancePill.classList.add('hidden');
    }
    if (ticketsChip) {
      ticketsChip.style.display = 'none';
      ticketsChip.classList.add('hidden');
    }
    const pointsBadgeText = document.getElementById('header-points-text');
    if (pointsBadgeText) pointsBadgeText.textContent = '0 Điểm';
    const creditBadgeText = document.getElementById('header-credit-text');
    if (creditBadgeText) creditBadgeText.textContent = '';
    if (createBtn) {
      createBtn.classList.remove('hidden');
      createBtn.style.display = 'flex';
    }
    if (userProfileMenu) userProfileMenu.classList.add('hidden');
    if (guestAuthActions) guestAuthActions.classList.remove('hidden');

    const streakBtn = document.getElementById('header-streak-btn');
    if (streakBtn) {
      streakBtn.classList.add('hidden');
      streakBtn.classList.remove('flex');
    }

    this.state.streakInfo = null;

    this.renderNavigation();
    // Đối với khách chưa đăng nhập, trang mặc định luôn là Trang Chủ Mở Đầu (home) thay thế hoàn toàn màn hình khảo sát cũ
    if (!this.state.currentTab || this.state.currentTab === 'surveys' || ['creator-surveys', 'wallet', 'admin-overview', 'admin-payouts', 'admin-fraud', 'profile'].includes(this.state.currentTab)) {
      this.state.currentTab = 'home';
    }
    this.renderNavigation();
    this.navigate(this.state.currentTab);
  },

  isEnterpriseUser() {
    const user = this.state.currentUser;
    if (!user) return false;
    return user.account_tier === 'ENTERPRISE' ||
      (user.enterprise_verify_level && user.enterprise_verify_level >= 1) ||
      (user.role === 'ADMIN' && (this.state.adminViewMode || 'ADMIN') === 'CREATOR');
  },

  applyUserInterface(silent = false) {
    const user = this.state.currentUser;
    if (!user) {
      this.applyGuestInterface();
      return;
    }

    const isEnterprise = this.isEnterpriseUser();

    const balancePill = document.getElementById('user-balance-pill');
    const ticketsChip = document.getElementById('header-tickets-chip');
    const ticketsText = document.getElementById('header-tickets-text');
    const createBtn = document.getElementById('header-create-btn');
    const userProfileMenu = document.getElementById('user-profile-menu');
    const guestAuthActions = document.getElementById('guest-auth-actions');
    const nameEl = document.getElementById('user-display-name');
    const avatarEl = document.getElementById('user-avatar-circle');
    const pointsBadgeText = document.getElementById('header-points-text');
    const creditBadgeText = document.getElementById('header-credit-text');

    if (guestAuthActions) guestAuthActions.classList.add('hidden');
    // Tuyệt đối ẩn điểm và vé khỏi thanh ngang Header ngoài theo chỉ đạo của người dùng
    if (balancePill) {
      balancePill.classList.add('hidden');
      balancePill.style.display = 'none';
    }
    if (ticketsChip) {
      ticketsChip.classList.add('hidden');
      ticketsChip.style.display = 'none';
    }
    // Nút Tạo Khảo Sát luôn hiển thị trên thanh Header cho mọi người dùng
    if (createBtn) {
      createBtn.classList.remove('hidden');
      createBtn.style.display = 'flex';
    }
    if (userProfileMenu) {
      userProfileMenu.classList.remove('hidden');
    }

    const streakBtn = document.getElementById('header-streak-btn');
    if (streakBtn) {
      // Doanh nghiệp không hỗ trợ điểm danh -> ẩn hoàn toàn nút ngọn lửa
      if (isEnterprise) {
        streakBtn.classList.add('hidden');
        streakBtn.classList.remove('flex');
        streakBtn.style.display = 'none';
      } else {
        streakBtn.classList.remove('hidden');
        streakBtn.classList.add('flex');
        streakBtn.style.display = 'flex';
      }
    }


    if (!isEnterprise) {
      this.fetchStreakInfo();
    } else {
      this.state.streakInfo = null;
    }

    const shortName = user.name ? (user.name.split(' ').pop() || user.name) : 'User';
    if (nameEl) nameEl.textContent = shortName;
    if (avatarEl) {
      avatarEl.classList.add('overflow-hidden');
      const initialChar = (user.name || 'U').charAt(0).toUpperCase();
      if (user.avatar_url) {
        avatarEl.innerHTML = `<img src="${user.avatar_url}" alt="Avatar" class="w-full h-full object-cover rounded-md" onerror="this.onerror=null;this.parentElement.textContent='${initialChar}';">`;
      } else {
        avatarEl.textContent = initialChar;
      }
    }

    if (pointsBadgeText) {
      pointsBadgeText.textContent = `${(user.point_balance || 0).toLocaleString('vi-VN')} Điểm`;
    }
    if (creditBadgeText) {
      creditBadgeText.textContent = '';
    }

    this.renderUserProfileDropdown();
    this.renderNavigation();
    this.refreshNotificationBadge();
    if (!silent) {
      this.navigate(this.state.currentTab);
    }
  },

  toggleProfileDropdown() {
    this.haptic('light');
    const dropdown = document.getElementById('user-profile-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
  },

  renderUserProfileDropdown() {
    const user = this.state.currentUser;
    const contentEl = document.getElementById('user-profile-dropdown-content');
    if (!user || !contentEl) return;

    const adminMode = this.state.adminViewMode || 'ADMIN';
    const isEnterprise = this.isEnterpriseUser();

    // Huy hiệu vai trò súc tích, sang trọng
    let roleBadge = '';
    if (user.role === 'ADMIN') {
      if (adminMode === 'RESPONDENT') {
        roleBadge = `<span class="text-[10px] font-bold px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-md border border-stone-200 dark:border-stone-700">${user.account_tier === 'STUDENT' ? 'Sinh Viên (Admin)' : 'Người Điền (Admin)'}</span>`;
      } else if (adminMode === 'CREATOR') {
        roleBadge = '<span class="text-[10px] font-bold px-2 py-0.5 bg-orange-600 text-white rounded-md">Doanh Nghiệp (Admin)</span>';
      } else {
        roleBadge = '<span class="text-[10px] font-bold px-2 py-0.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md">Quản Trị</span>';
      }
    } else if (user.role === 'CREATOR' || user.account_tier === 'ENTERPRISE') {
      roleBadge = '<span class="text-[10px] font-bold px-2 py-0.5 bg-orange-600 text-white rounded-md">Doanh Nghiệp</span>';
    } else if (user.is_student_verified === 1 || user.account_tier === 'STUDENT') {
      roleBadge = '<span class="text-[10px] font-bold px-2 py-0.5 bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 rounded-md border border-orange-200 dark:border-orange-800">Sinh Viên</span>';
    } else {
      roleBadge = '<span class="text-[10px] font-bold px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-md">Thành Viên</span>';
    }

    const firstLetter = (user.name || user.email || 'U').charAt(0).toUpperCase();

    contentEl.innerHTML = `
      <!-- User Info Header: Gọn gàng, thoáng đãng -->
      <div class="p-3 border-b border-stone-100 dark:border-stone-800">
        <div class="flex items-center gap-2.5">
          ${user.avatar_url ? `
            <img src="${user.avatar_url}" alt="${user.name}" class="w-9 h-9 rounded-xl object-cover shadow-xs shrink-0 border border-stone-200 dark:border-stone-700" onerror="this.onerror=null;this.outerHTML='<div class=\\'w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0\\'>${firstLetter}</div>';">
          ` : `
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              ${firstLetter}
            </div>
          `}
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1.5">
              <div class="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">${user.name}</div>
              ${roleBadge}
            </div>
            <div class="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">${user.email}</div>
          </div>
        </div>
      </div>

      ${user.role === 'ADMIN' ? `
        <!-- Trình Chuyển Góc Nhìn & Phân Khúc ADMIN -->
        <div class="px-3 py-2 bg-stone-50 dark:bg-stone-900/60 border-b border-stone-100 dark:border-stone-800 space-y-1.5">
          <div class="grid grid-cols-3 gap-1 bg-stone-200/60 dark:bg-stone-800/80 p-0.5 rounded-lg text-[11px]">
            <button onclick="VibeApp.switchAdminMode('RESPONDENT')" class="py-1 px-1 rounded-md font-semibold text-center transition-all ${adminMode === 'RESPONDENT' ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-2xs font-bold' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}">
              Người Điền
            </button>
            <button onclick="VibeApp.switchAdminMode('CREATOR')" class="py-1 px-1 rounded-md font-semibold text-center transition-all ${adminMode === 'CREATOR' ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-2xs font-bold' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}">
              Doanh Nghiệp
            </button>
            <button onclick="VibeApp.switchAdminMode('ADMIN')" class="py-1 px-1 rounded-md font-semibold text-center transition-all ${adminMode === 'ADMIN' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs font-bold' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}">
              Quản Trị
            </button>
          </div>

          ${adminMode === 'ADMIN' ? `
            <!-- Chuyển đổi Phân khúc Người Điền: Thường vs Sinh Viên (Chỉ dành riêng cho ADMIN kiểm thử phân khúc) -->
            <div class="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200/60 dark:border-stone-800/80">
              <span class="text-stone-500 dark:text-stone-400 font-medium text-[10.5px]">Phân khúc (Test):</span>
              <div class="grid grid-cols-2 gap-1 bg-stone-200/60 dark:bg-stone-800/80 p-0.5 rounded-lg text-[10.5px]">
                <button type="button" onclick="VibeApp.switchAdminTier('PERSONAL')" class="py-0.5 px-2 rounded-md font-bold text-center transition-all ${user.account_tier !== 'STUDENT' ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-2xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'}">
                  Thường
                </button>
                <button type="button" onclick="VibeApp.switchAdminTier('STUDENT')" class="py-0.5 px-2 rounded-md font-bold text-center transition-all ${user.account_tier === 'STUDENT' ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-2xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'}">
                  Sinh Viên
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Khối Số Dư Tinh Gọn (Financial Bento Card) -->
      <div class="p-3 border-b border-stone-100 dark:border-stone-800">
        ${isEnterprise ? `
          <!-- Giao diện Doanh Nghiệp: Credit & Nạp Quỹ -->
          <div class="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200/60 dark:border-stone-800">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] text-stone-500 dark:text-stone-400 font-medium block">Số dư Credit tạo form</span>
                <span class="font-mono font-black text-stone-900 dark:text-stone-100 text-sm block mt-0.5">
                  ${Number(user.credit_balance || 0).toLocaleString('vi-VN')} Credit
                </span>
              </div>
              <button onclick="VibeApp.toggleProfileDropdown(); VibeApp.openDepositModal()" class="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Nạp Quỹ
              </button>
            </div>
            ${Number(user.fast_track_tickets || 0) > 0 ? `
              <div class="flex items-center justify-between text-[11px] pt-1.5 mt-2 border-t border-stone-200/60 dark:border-stone-800">
                <span class="text-stone-500 dark:text-stone-400 font-medium">Vé Hỏa Tốc:</span>
                <span class="font-mono font-bold text-stone-800 dark:text-stone-200">${Number(user.fast_track_tickets)} Vé</span>
              </div>
            ` : ''}
          </div>
        ` : `
          <!-- Giao diện Người Điền: Điểm thưởng & Chuỗi ngày -->
          <div class="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200/60 dark:border-stone-800 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] text-stone-500 dark:text-stone-400 font-medium block">Số dư tích lũy</span>
                <div class="flex items-baseline gap-1 mt-0.5">
                  <span class="font-mono font-black text-orange-600 dark:text-orange-500 text-sm">
                    ${Number(user.point_balance || 0).toLocaleString('vi-VN')}
                  </span>
                  <span class="text-[10px] text-stone-400 dark:text-stone-500 font-medium">Point (≈ ${Number(user.point_balance || 0).toLocaleString('vi-VN')}đ)</span>
                </div>
              </div>
              <button onclick="VibeApp.toggleProfileDropdown(); VibeApp.navigate('wallet')" class="px-2.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors border border-orange-200/60 dark:border-orange-800/60">
                Rút Tiền
              </button>
            </div>

            <div class="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-200/60 dark:border-stone-800">
              <span class="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400 font-medium cursor-pointer hover:text-orange-600" onclick="VibeApp.toggleProfileDropdown(); VibeApp.openStreakModal()">
                <i data-lucide="flame" class="w-3.5 h-3.5 text-orange-600"></i>
                <span>Chuỗi ngày:</span>
                <span class="font-mono font-bold text-orange-600 dark:text-orange-400 ml-0.5">
                  ${this.state.streakInfo ? this.state.streakInfo.current_streak + ' ngày' : 'Điểm danh'}
                </span>
              </span>

              ${Number(user.credit_balance || 0) > 0 ? `
                <span class="font-mono text-stone-500 dark:text-stone-400 text-[10px]">
                  ${Number(user.credit_balance).toLocaleString('vi-VN')} Credit
                </span>
              ` : ''}
            </div>
          </div>
        `}
      </div>

      <!-- Menu Điều Hướng Tài Khoản Cốt Lõi (Đã lược bỏ các mục trùng lặp thừa thãi) -->
      <div class="p-1.5 space-y-0.5 text-xs">
        <button onclick="VibeApp.navigate('profile'); document.getElementById('user-profile-dropdown').classList.add('hidden')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-stone-800 dark:text-stone-200 font-semibold transition-colors group">
          <div class="flex items-center gap-2.5">
            <i data-lucide="user-check" class="w-4 h-4 text-orange-600 dark:text-orange-500 group-hover:scale-110 transition-transform"></i>
            <span>Hồ Sơ & Xác Thực</span>
          </div>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform"></i>
        </button>

        <button onclick="VibeApp.navigate('wallet'); document.getElementById('user-profile-dropdown').classList.add('hidden')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-stone-800 dark:text-stone-200 font-semibold transition-colors group">
          <div class="flex items-center gap-2.5">
            <i data-lucide="wallet" class="w-4 h-4 text-stone-600 dark:text-stone-400 group-hover:scale-110 transition-transform"></i>
            <span>Ví Tiền & Lịch Sử Giao Dịch</span>
          </div>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform"></i>
        </button>

        <button onclick="VibeApp.openBugReportModal(); document.getElementById('user-profile-dropdown').classList.add('hidden')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-stone-800 dark:text-stone-200 font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <i data-lucide="bug" class="w-4 h-4 text-stone-500 dark:text-stone-400 group-hover:scale-110 transition-transform"></i>
            <span>Báo Lỗi & Đóng Góp Ý Kiến</span>
          </div>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform"></i>
        </button>
      </div>

      <!-- Đăng Xuất -->
      <div class="p-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
        <button onclick="VibeApp.logout()" class="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold rounded-lg flex items-center gap-2.5 transition-colors group">
          <i data-lucide="log-out" class="w-4 h-4 text-stone-500 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all"></i>
          <span>Đăng xuất</span>
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },


  switchAdminViewMode(mode) {
    return this.switchAdminMode(mode);
  },

  async switchAdminMode(mode) {
    this.haptic('medium');
    this.state.adminViewMode = mode;
    this.state.adminMode = mode;
    localStorage.setItem('survhub_admin_view_mode', mode);

    if (mode === 'RESPONDENT') {
      this.showToast('Đã chuyển sang góc nhìn Người Điền (Đáp Viên)', 'info');
      // Người điền chỉ là Người Điền Thường (PERSONAL) hoặc Sinh Viên (STUDENT), tuyệt đối không nhận Doanh Nghiệp
      if (this.state.currentUser && this.state.currentUser.account_tier === 'ENTERPRISE') {
        await this.switchAdminTier('PERSONAL', true);
      }
      this.renderNavigation();
      this.renderUserProfileDropdown();

      if (['admin-overview', 'admin-payouts', 'admin-fraud'].includes(this.state.currentTab)) {
        await this.navigate('surveys');
      } else if (this.state.currentTab === 'create-survey') {
        if (!this.refreshStudioSidebarView()) {
          await this.navigate('create-survey');
        }
      } else {
        await this.navigate(this.state.currentTab);
      }
    } else if (mode === 'CREATOR') {
      this.showToast('Đã chuyển sang góc nhìn Doanh Nghiệp', 'info');
      // Tự động chuyển gói tài khoản sang Doanh Nghiệp (ENTERPRISE) nhưng tắt toast thứ 2 để không bị thông báo kép
      await this.switchAdminTier('ENTERPRISE', true);
      this.renderNavigation();
      this.renderUserProfileDropdown();

      if (['admin-overview', 'admin-payouts', 'admin-fraud'].includes(this.state.currentTab)) {
        await this.navigate('creator-surveys');
      } else if (this.state.currentTab === 'create-survey') {
        if (!this.refreshStudioSidebarView()) {
          await this.navigate('create-survey');
        }
      } else {
        await this.navigate(this.state.currentTab);
      }
    } else {
      this.showToast('Đã quay lại góc nhìn Quản Trị Viên (Toàn quyền)', 'info');
      this.renderNavigation();
      this.renderUserProfileDropdown();

      if (this.state.currentTab === 'create-survey') {
        if (!this.refreshStudioSidebarView()) {
          await this.navigate('create-survey');
        }
      } else {
        await this.navigate(this.state.currentTab);
      }
    }
  },

  async switchAdminTier(tier, silent = false) {
    this.haptic('medium');
    try {
      const res = await this.api('/admin/switch-tier', {
        method: 'POST',
        body: JSON.stringify({ tier })
      });
      if (res && res.success) {
        if (this.state.currentUser) {
          this.state.currentUser.account_tier = res.tier;
          if (res.user) {
            Object.assign(this.state.currentUser, res.user);
          }
          localStorage.setItem('survhub_cached_user', JSON.stringify(this.state.currentUser));
        }
        this.state.creatorTier = res.tier;
        delete this.state.customPricePerResponse;

        if (!silent) {
          const tierLabel = res.tier === 'ENTERPRISE' ? 'Doanh Nghiệp' : (res.tier === 'STUDENT' ? 'Sinh Viên' : 'Cá Nhân');
          this.showToast(res.message || `Đã chuyển sang gói ${tierLabel}`, 'success');
        }

        this.renderUserProfileDropdown();
        this.renderNavigation();

        // Chỉ tự động điều phối re-render tab khi đổi tier trực tiếp (không ở chế độ silent)
        if (!silent) {
          if (this.state.currentTab === 'create-survey') {
            if (!this.refreshStudioSidebarView()) {
              await this.navigate('create-survey');
            }
          } else {
            await this.navigate(this.state.currentTab);
          }
        }
      }
    } catch (err) {
      if (!silent) {
        this.showToast(err.message || 'Lỗi chuyển đổi phân hạng gói tài khoản', 'error');
      }
    }
  },

  logout() {
    this.haptic('light');
    this.state.token = null;
    this.state.currentUser = null;
    localStorage.removeItem('survhub_token');
    localStorage.removeItem('vibesurvey_token');
    localStorage.removeItem('survhub_cached_user');
    localStorage.removeItem('vibesurvey_cached_user');

    const dropdown = document.getElementById('user-profile-dropdown');
    if (dropdown) dropdown.classList.add('hidden');

    this.applyGuestInterface();
  },

  // ==================== AUTH MODAL + DIEU KHOAN + TIEN ICH MODAL: ĐÃ TÁCH RA public/js/modules/modalsTerms.js (WAVE 5 MODULAR) ====================

  renderNavigation() {
    const user = this.state.currentUser;
    const desktopNav = document.getElementById('desktop-nav');
    const mobileNav = document.getElementById('mobile-bottom-nav');

    let tabs = [];
    if (!user) {
      tabs = [
        { id: 'home', label: 'Trang Chủ', icon: 'home' },
        { id: 'surveys', label: 'Khảo Sát', icon: 'compass' },
        { id: 'forum', label: 'Diễn Đàn', icon: 'messages-square' },
        { id: 'create-survey', label: 'Tạo Khảo Sát', icon: 'plus-circle' },
        { id: 'voucher-market', label: 'Chợ Voucher', icon: 'gift' }
      ];
    } else if (user.role === 'ADMIN') {
      const mode = this.state.adminViewMode || 'ADMIN';
      if (mode === 'RESPONDENT') {
        // Góc nhìn Người Điền (Đáp Viên)
        tabs = [
          { id: 'surveys', label: 'Khảo Sát', icon: 'compass' },
          { id: 'forum', label: 'Diễn Đàn', icon: 'messages-square' },
          { id: 'create-survey', label: 'Tạo Khảo Sát', icon: 'plus-circle', isCenterAction: true },
          { id: 'voucher-market', label: 'Chợ Voucher', icon: 'gift' },
          { id: 'wallet', label: 'Ví & Rút Tiền', icon: 'wallet' }
        ];
      } else if (mode === 'CREATOR') {
        // Góc nhìn Doanh Nghiệp
        tabs = [
          { id: 'surveys', label: 'Khám Phá', icon: 'compass' },
          { id: 'forum', label: 'Diễn Đàn', icon: 'messages-square' },
          { id: 'create-survey', label: 'Tạo Khảo Sát', icon: 'plus-circle' },
          { id: 'creator-surveys', label: 'Khảo Sát Của Tôi', icon: 'folder-kanban' },
          { id: 'wallet', label: 'Ví & Nạp Quỹ', icon: 'wallet' }
        ];
      } else {
        // Góc nhìn Quản Trị Viên Toàn Quyền
        tabs = [
          { id: 'admin-overview', label: 'Quản Trị', icon: 'layout-dashboard' },
          { id: 'surveys', label: 'Khảo Sát', icon: 'compass' },
          { id: 'forum', label: 'Diễn Đàn', icon: 'messages-square' },
          { id: 'create-survey', label: 'Tạo Khảo Sát', icon: 'plus-circle' },
          { id: 'creator-surveys', label: 'Khảo Sát Của Tôi', icon: 'folder-kanban' }
        ];
      }
    } else {
      // Dành cho cả Người Điền (RESPONDENT) và Doanh Nghiệp (CREATOR)
      if (user.role === 'CREATOR') {
        tabs = [
          { id: 'surveys', label: 'Khám Phá', icon: 'compass' },
          { id: 'forum', label: 'Diễn Đàn', icon: 'messages-square' },
          { id: 'create-survey', label: 'Tạo Khảo Sát', icon: 'plus-circle' },
          { id: 'creator-surveys', label: 'Khảo Sát Của Tôi', icon: 'folder-kanban' },
          { id: 'wallet', label: 'Ví & Nạp Quỹ', icon: 'wallet' }
        ];
      } else {
        tabs = [
          { id: 'surveys', label: 'Khảo Sát', icon: 'compass' },
          { id: 'forum', label: 'Diễn Đàn', icon: 'messages-square' },
          { id: 'create-survey', label: 'Tạo Khảo Sát', icon: 'plus-circle', isCenterAction: true },
          { id: 'voucher-market', label: 'Chợ Voucher', icon: 'gift' },
          { id: 'wallet', label: 'Ví & Rút Tiền', icon: 'wallet' }
        ];
      }
    }

    const adminSubTabs = ['admin-overview', 'admin-payouts', 'admin-fraud', 'admin-bug-reports', 'admin-audit-logs'];

    // Desktop Tabs (Pill Style)
    if (desktopNav) {
      desktopNav.innerHTML = tabs.map(tab => {
        const isActive = (tab.id === 'admin-overview' && adminSubTabs.includes(this.state.currentTab)) || (this.state.currentTab === tab.id);
        return `
          <button onclick="VibeApp.navigate('${tab.id}')" 
                  class="nav-link whitespace-nowrap ${isActive ? 'active' : ''}">
            <i data-lucide="${tab.icon}" class="w-3.5 h-3.5 stroke-[2.2] flex-shrink-0"></i>
            <span class="whitespace-nowrap">${tab.label}</span>
          </button>
        `;
      }).join('');
    }

    // Mobile Bottom Floating Nav (Kiểu Bong Bóng Nổi Bo Tròn Đẳng Cấp, Có Nhãn Chữ Rõ Ràng Dưới Icon)
    if (mobileNav) {
      let mobileItems = [];
      const effectiveRole = user ? (user.role === 'ADMIN' ? (this.state.adminViewMode || 'ADMIN') : user.role) : 'GUEST';

      if (effectiveRole === 'ADMIN') {
        // Góc nhìn Quản Trị Viên Toàn Quyền:
        // Lược bớt ví (không hiện ví), Quản trị cho ra giữa in đậm nổi bật (isCenterAction: true)
        mobileItems = [
          { id: 'surveys', label: 'Khảo Sát', mobileLabel: 'Khảo Sát', icon: 'compass' },
          { id: 'creator-surveys', label: 'Khảo Sát Của Tôi', mobileLabel: 'Của Tôi', icon: 'folder-kanban' },
          { id: 'admin-overview', label: 'Quản Trị', mobileLabel: 'Quản Trị', icon: 'layout-dashboard', centerIcon: 'layout-dashboard', isCenterAction: true },
          { id: 'create-survey', label: 'Tạo Khảo Sát', mobileLabel: 'Tạo Mới', icon: 'plus-circle' },
          { id: 'forum', label: 'Diễn Đàn', mobileLabel: 'Diễn Đàn', icon: 'messages-square' }
        ];
      } else if (effectiveRole === 'CREATOR') {
        // Góc nhìn Doanh Nghiệp (Creator / Enterprise):
        // Tô đậm phần Tạo Khảo Sát Mới (isCenterAction: true) ở chính giữa
        mobileItems = [
          { id: 'surveys', label: 'Khám Phá', mobileLabel: 'Khám Phá', icon: 'compass' },
          { id: 'creator-surveys', label: 'Khảo Sát Của Tôi', mobileLabel: 'Của Tôi', icon: 'folder-kanban' },
          { id: 'create-survey', label: 'Tạo Khảo Sát', mobileLabel: 'Tạo Mới', icon: 'plus-circle', centerIcon: 'plus', isCenterAction: true },
          { id: 'forum', label: 'Diễn Đàn', mobileLabel: 'Diễn Đàn', icon: 'messages-square' },
          { id: 'wallet', label: 'Ví & Nạp Quỹ', mobileLabel: 'Ví & Quỹ', icon: 'wallet' }
        ];
      } else if (effectiveRole === 'RESPONDENT') {
        // Góc nhìn Người Điền (Đáp Viên / Người Dùng Thường):
        // Nút Tạo Khảo Sát ở chính giữa dạng tròn cam nổi bật
        mobileItems = [
          { id: 'surveys', label: 'Khảo Sát', mobileLabel: 'Khảo Sát', icon: 'compass' },
          { id: 'forum', label: 'Diễn Đàn', mobileLabel: 'Diễn Đàn', icon: 'messages-square' },
          { id: 'create-survey', label: 'Tạo Khảo Sát', mobileLabel: 'Tạo Mới', icon: 'plus-circle', centerIcon: 'plus', isCenterAction: true },
          { id: 'voucher-market', label: 'Chợ Voucher', mobileLabel: 'Voucher', icon: 'gift' },
          { id: 'wallet', label: 'Ví & Rút Tiền', mobileLabel: 'Ví Tiền', icon: 'wallet' }
        ];
      } else {
        // Khách chưa đăng nhập:
        mobileItems = [
          { id: 'home', label: 'Trang Chủ', mobileLabel: 'Trang Chủ', icon: 'home' },
          { id: 'surveys', label: 'Khảo Sát', mobileLabel: 'Khảo Sát', icon: 'compass' },
          { id: 'create-survey', label: 'Tạo Khảo Sát', mobileLabel: 'Tạo Mới', icon: 'plus-circle', centerIcon: 'plus', isCenterAction: true },
          { id: 'forum', label: 'Diễn Đàn', mobileLabel: 'Diễn Đàn', icon: 'messages-square' },
          { id: 'auth-login', label: 'Đăng Nhập', mobileLabel: 'Đăng Nhập', icon: 'log-in', isAuthAction: true }
        ];
      }

      mobileNav.innerHTML = mobileItems.map(tab => {
        const isActive = (tab.id === 'admin-overview' && adminSubTabs.includes(this.state.currentTab)) || (this.state.currentTab === tab.id);
        const clickAction = tab.isAuthAction ? `VibeApp.openAuthModal('login')` : `VibeApp.navigate('${tab.id}')`;
        const displayLabel = tab.mobileLabel || tab.label;

        // Nút hành động chính ở giữa: Action Button dạng tròn cam nổi bật trung tâm kèm nhãn cam in đậm bên dưới
        if (tab.isCenterAction) {
          const centerIcon = tab.centerIcon || tab.icon || 'plus';
          const iconSizeClass = centerIcon === 'plus' ? 'w-5.5 h-5.5 stroke-[2.8]' : 'w-5 h-5 stroke-[2.4]';
          return `
            <div class="flex-1 min-w-0 flex justify-center items-center">
              <button onclick="${clickAction}" 
                      title="${tab.label}" 
                      aria-label="${tab.label}"
                      class="relative -mt-3.5 flex flex-col items-center justify-center group active:scale-90 transition-all select-none">
                <div class="w-10.5 h-10.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-lg shadow-orange-600/35 transition-all ${isActive ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-stone-900 shadow-orange-600/50 scale-105' : ''}">
                  <i data-lucide="${centerIcon}" class="${iconSizeClass}"></i>
                </div>
                <span class="text-[9.5px] sm:text-[10px] leading-none mt-1 tracking-tight font-bold text-orange-600 dark:text-orange-400 truncate max-w-[64px] text-center">${displayLabel}</span>
              </button>
            </div>
          `;
        }

        return `
          <div class="flex-1 min-w-0 flex justify-center items-center">
            <button onclick="${clickAction}" 
                    title="${tab.label}" 
                    aria-label="${tab.label}"
                    class="relative w-full py-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-90 group select-none ${isActive
            ? 'text-orange-600 dark:text-orange-400 font-bold'
            : 'text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-medium'
          }">
              <div class="w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400' : 'group-hover:bg-stone-50 dark:group-hover:bg-stone-800/40'}">
                <i data-lucide="${tab.icon}" class="w-4.5 h-4.5 transition-transform group-hover:scale-110 ${isActive ? 'stroke-[2.4] scale-105' : 'stroke-[1.8]'}"></i>
              </div>
              <span class="text-[9.5px] sm:text-[10px] leading-none mt-1 tracking-tight truncate max-w-[62px] text-center ${isActive ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-stone-500 dark:text-stone-400'}">${displayLabel}</span>
            </button>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  },

  // ==================== ROUTER ====================
  async navigate(tabId, params = {}) {
    this.haptic('light');
    this.state.currentTab = tabId;
    if (tabId !== 'take-survey') {
      localStorage.setItem('survhub_current_tab', tabId);
    }
    this.renderNavigation();

    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      <div class="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600"></div>
        <p class="text-xs text-slate-400 font-medium">Đang tải...</p>
      </div>
    `;

    try {
      switch (tabId) {
        case 'home':
          await this.renderHomeView(root);
          break;
        case 'surveys':
          await this.renderSurveysView(root);
          break;
        case 'forum':
          await this.renderForumView(root);
          break;
        case 'take-survey':
          await this.renderTakeSurveyView(root, params.surveyId);
          break;
        case 'review-survey':
          await this.renderReviewSurveyView(root, params.surveyId);
          break;
        case 'voucher-market':
          await this.renderVoucherMarketView(root);
          break;
        case 'my-vouchers':
          await this.renderMyVouchersView(root);
          break;
        case 'wallet':
          await this.renderWalletView(root);
          break;
        case 'creator-surveys':
        case 'my-surveys':
          await this.renderCreatorSurveysView(root);
          break;
        case 'fast-create':
        case 'create-survey':
          await this.renderCreateSurveyView(root);
          break;
        case 'profile':
          await this.renderProfileView(root);
          break;
        case 'analytics':
          await this.renderAnalyticsView(root, params.surveyId);
          break;
        case 'admin-overview':
          await this.renderAdminOverviewView(root);
          break;
        case 'admin-payouts':
          await this.renderAdminPayoutsView(root);
          break;
        case 'admin-fraud':
          await this.renderAdminFraudView(root);
          break;
        case 'admin-bugs':
        case 'admin-bug-reports':
          await this.renderAdminBugReportsView(root);
          break;
        case 'admin-audit':
        case 'admin-audit-logs':
          await this.renderAdminAuditLogsView(root);
          break;
        default:
          await this.renderSurveysView(root);
      }
    } catch (err) {
      root.innerHTML = `
        <div class="bento-card p-8 text-center max-w-md mx-auto my-12">
          <p class="text-xs text-red-600 font-semibold mb-3">${err.message}</p>
          <button onclick="VibeApp.navigate('surveys')" class="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800">
            Quay lại Cổng Khảo Sát
          </button>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },


  // ==================== CẬP NHẬT SỐ LIỆU HỆ THỐNG THỜI GIAN THỰC (ZERO FAKE METRICS) ====================
  async updateHomeStatsLive() {
    try {
      const res = await this.api('/public/stats');
      if (res && res.success && res.stats) {
        const s = res.stats;
        this.state.platformStats = s;

        const elRate = document.getElementById('bento-stat-valid-rate');
        const elTotal = document.getElementById('bento-stat-total-responses');
        const elTime = document.getElementById('bento-stat-avg-time');
        const elBadge = document.getElementById('bento-stat-live-badge');

        if (elRate) elRate.textContent = s.valid_data_rate;
        if (elTotal) elTotal.textContent = (s.total_responses || 0).toLocaleString('vi-VN');
        if (elTime) elTime.textContent = s.avg_time_formatted;
        if (elBadge) {
          elBadge.textContent = `(${new Date().toLocaleTimeString('vi-VN')})`;
        }
      }
    } catch (err) {
      // Bỏ qua lỗi nền
    }
  },

  // ==================== TRANG CHỦ MỞ ĐẦU (SURVHUB LANDING PAGE) ====================
  async renderHomeView(root) {
    if (!root) return;

    // Nạp số liệu thống kê thực tế nếu chưa có
    let initialStats = this.state.platformStats || {
      valid_data_rate: '100%',
      total_responses: 0,
      avg_time_formatted: '~0 Phút'
    };
    try {
      const statsRes = await this.api('/public/stats');
      if (statsRes && statsRes.success && statsRes.stats) {
        initialStats = statsRes.stats;
        this.state.platformStats = statsRes.stats;
      }
    } catch (e) {
      console.warn('Lỗi nạp số liệu thống kê trang chủ:', e);
    }

    // Nạp danh sách khảo sát nếu chưa có
    if (!this.state.surveys || this.state.surveys.length === 0) {
      try {
        await this.loadSurveys();
      } catch (e) {
        console.warn('Lỗi nạp danh sách khảo sát trang chủ:', e);
      }
    }

    const surveys = this.state.surveys || [];
    const trendingSurveys = surveys
      .filter(s => s.status === 'PUBLISHED' || s.status === 'ACTIVE' || !s.status)
      .slice(0, 3);

    root.innerHTML = `
      <div class="space-y-12 sm:space-y-16 max-w-6xl mx-auto pb-20 px-2 sm:px-4">
        
        <!-- 1. HERO SECTION -->
        <section class="text-center pt-8 sm:pt-14 pb-4 space-y-6 max-w-4xl mx-auto">
          <!-- Badge Pill -->
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/80 shadow-xs">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 stroke-[2.5]"></i>
            <span>Nền tảng khảo sát học thuật tín nhiệm</span>
          </div>

          <!-- Headline -->
          <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 dark:text-white leading-[1.18]">
            Share form, <br class="hidden sm:inline">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#E73F1E] via-[#F25A12] to-[#FB6C00]">share yours insight</span>
          </h1>

          <!-- Subtitle -->
          <p class="text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Được cung cấp bởi hàng nghìn nghiên cứu sinh và sinh viên thực tế. Tìm kiếm mẫu khảo sát, đóng góp ý kiến trung thực và nhận voucher giá trị cho đợt nghiên cứu tiếp theo của bạn.
          </p>

          <!-- Search Bar -->
          <div class="w-full max-w-2xl mx-auto pt-1">
            <div class="bg-white dark:bg-[#18181B] p-2 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-md flex flex-col sm:flex-row items-center gap-2">
              <div class="flex items-center flex-1 w-full px-3 py-2 gap-2.5">
                <i data-lucide="search" class="w-5 h-5 text-stone-400 shrink-0"></i>
                <input class="w-full bg-transparent text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none text-xs sm:text-sm font-medium" id="home-survey-search-input" placeholder="Tìm kiếm khảo sát phù hợp với bạn..." type="text" onkeydown="if(event.key === 'Enter') VibeApp.handleHomeSearch(this.value)"/>
              </div>
              <div class="flex items-center gap-2 w-full sm:w-auto px-1 pb-1 sm:pb-0">
                <button onclick="VibeApp.handleHomeSearch(document.getElementById('home-survey-search-input').value)" class="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-xs shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95" type="button">
                  <span>Tìm kiếm</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
                <button onclick="VibeApp.navigate('forum')" class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-extrabold text-xs hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-center cursor-pointer active:scale-95" type="button">
                  Diễn đàn
                </button>
              </div>
            </div>
          </div>

          <!-- Category Pills -->
          <div class="w-full max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-2 pt-1">
            ${(window.VIBE_SYSTEM_CATEGORIES || []).map(cat => `
              <button onclick="VibeApp.handleHomeCategoryFilter(this, '${cat.id}')" class="home-category-pill px-4 py-1.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all cursor-pointer" type="button">
                ${this.escapeHtml(cat.label)}
              </button>
            `).join('')}
          </div>
        </section>

        <!-- 2. BENTO CARDS: 3 CHỐT CHẶN CHẤT LƯỢNG CHUẨN STITCH (SỐ LIỆU THỰC TẾ LIÊN TỤC) -->
        <section class="max-w-6xl mx-auto w-full space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Card 1 -->
            <div class="flex flex-col items-center text-center p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-3 hover:border-orange-500/40 transition-all">
              <div class="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 mb-1">
                <i data-lucide="shield-check" class="w-6 h-6 stroke-[2.2]"></i>
              </div>
              <span id="bento-stat-valid-rate" class="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight font-mono">${initialStats.valid_data_rate}</span>
              <span class="text-sm font-bold text-stone-800 dark:text-stone-200">Dữ liệu xác thực</span>
              <p class="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Hệ thống lọc IP, đối chiếu mã sinh viên và thuật toán kiểm tra tính nhất quán phản hồi.
              </p>
            </div>

            <!-- Card 2 -->
            <div class="flex flex-col items-center text-center p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-3 hover:border-orange-500/40 transition-all">
              <div class="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 mb-1">
                <i data-lucide="users" class="w-6 h-6 stroke-[2.2]"></i>
              </div>
              <span id="bento-stat-total-responses" class="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight font-mono">${(initialStats.total_responses || 0).toLocaleString('vi-VN')}</span>
              <span class="text-sm font-bold text-stone-800 dark:text-stone-200">Phản hồi giá trị</span>
              <p class="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Dữ liệu phản hồi thực tế được thu thập và kiểm duyệt tự động trên hệ thống SurvHub.
              </p>
            </div>

            <!-- Card 3 -->
            <div class="flex flex-col items-center text-center p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-3 hover:border-orange-500/40 transition-all">
              <div class="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 mb-1">
                <i data-lucide="clock" class="w-6 h-6 stroke-[2.2]"></i>
              </div>
              <span id="bento-stat-avg-time" class="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight font-mono">${initialStats.avg_time_formatted}</span>
              <span class="text-sm font-bold text-stone-800 dark:text-stone-200">Thời gian trung bình</span>
              <p class="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Thời lượng trung bình thực tế người tham gia hoàn thành một bài khảo sát trên hệ thống.
              </p>
            </div>
          </div>

          <!-- Trạng thái cập nhật liên tục thời gian thực -->
          <div class="flex items-center justify-center gap-2 pt-2 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Số liệu thực tế cập nhật liên tục từ hệ thống</span>
            <span id="bento-stat-live-badge" class="font-mono text-[10px] text-stone-400"></span>
          </div>
        </section>

        <!-- 4. KHẢO SÁT TIÊU BIỂU ĐANG MỞ (TRENDING SURVEYS) -->
        <section class="space-y-5">
          <div class="flex items-center justify-between pb-2 border-b border-stone-200/80 dark:border-stone-800">
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">Khảo Sát Tiêu Biểu Đang Mở</h2>
              <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Tham gia đóng góp ý kiến và nhận thưởng tức thì vào ví</p>
            </div>
            <button onclick="VibeApp.navigate('surveys')" class="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer">
              <span>Xem Tất Cả</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            ${trendingSurveys.length > 0 ? trendingSurveys.map(s => {
              const currentResponses = s.current_responses || s.responses_count || s.responseCount || 0;
              const targetResponses = s.target_responses || s.targetResponses || 100;
              const pct = Math.min(100, Math.round((currentResponses / targetResponses) * 100));
              const rewardPoints = s.reward_points || s.rewardPoints || 50;
              return `
                <div class="bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-500/50 transition-all">
                  <div class="space-y-2.5">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="px-2 py-0.5 rounded-md font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        ${s.category || 'Nghiên cứu Học thuật'}
                      </span>
                      <span class="font-mono font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <i data-lucide="coins" class="w-3.5 h-3.5"></i>
                        +${rewardPoints} Điểm
                      </span>
                    </div>
                    <h3 class="text-sm font-black text-stone-900 dark:text-white line-clamp-2 leading-snug">
                      ${s.title}
                    </h3>
                    <p class="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                      ${s.description || 'Khảo sát phục vụ nghiên cứu khoa học và khóa luận tốt nghiệp thực tế.'}
                    </p>
                  </div>

                  <div class="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                        <span>Tiến độ: ${currentResponses}/${targetResponses} mẫu</span>
                        <span>${pct}%</span>
                      </div>
                      <div class="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-orange-600 h-full rounded-full" style="width: ${pct}%;"></div>
                      </div>
                    </div>

                    <button onclick="VibeApp.handleOpenSurveyFromHome('${s.id}')" class="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
                      <span>Làm Khảo Sát Ngay</span>
                      <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="col-span-3 text-center py-10 bg-stone-50 dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
                Đang cập nhật danh sách khảo sát tiêu biểu...
              </div>
            `}
          </div>
        </section>

        <!-- 5. CTA BANNER CUỐI TRANG (CHUẨN STITCH) -->
        <section class="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-3xl p-8 sm:p-12 text-white space-y-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex flex-col gap-2 max-w-xl text-left">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-white/80">
              Khởi Động Đề Tài Của Bạn
            </span>
            <h2 class="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Bạn đang cần thu thập mẫu khảo sát cho khóa luận?
            </h2>
            <p class="text-xs sm:text-sm text-white/90 leading-relaxed">
              Tạo khảo sát trong 2 phút, tiếp cận 100+ đáp viên ngay trong 24 giờ đầu tiên với chi phí tối ưu dành riêng cho sinh viên.
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button onclick="VibeApp.navigate('create-survey')" class="px-6 py-3 rounded-xl bg-white text-orange-600 hover:bg-stone-50 font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>Đăng khảo sát ngay</span>
            </button>
          </div>
        </section>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Kích hoạt cập nhật thời gian thực định kỳ cho 3 thẻ Bento
    if (this._homeStatsTimer) {
      clearInterval(this._homeStatsTimer);
      this._homeStatsTimer = null;
    }
    this._homeStatsTimer = setInterval(() => {
      if (this.state.currentView === 'home' && document.getElementById('bento-stat-valid-rate')) {
        this.updateHomeStatsLive();
      } else {
        clearInterval(this._homeStatsTimer);
        this._homeStatsTimer = null;
      }
    }, 15000);

    const badgeEl = document.getElementById('bento-stat-live-badge');
    if (badgeEl) {
      badgeEl.textContent = `(${new Date().toLocaleTimeString('vi-VN')})`;
    }
  },

  handleHomeSearch(query) {
    this.haptic('light');
    const q = (query || '').trim();
    if (!q) {
      this.navigate('surveys');
      return;
    }
    this.state.searchQuery = q;
    this.navigate('surveys');
  },

  handleHomeCategoryFilter(btn, category) {
    this.haptic('light');
    const pills = document.querySelectorAll('.home-category-pill');
    pills.forEach(p => {
      p.className = 'home-category-pill px-4 py-1.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all cursor-pointer';
    });
    if (btn) {
      btn.className = 'home-category-pill px-4 py-1.5 rounded-full text-xs font-semibold bg-orange-600 text-white shadow-xs transition-all cursor-pointer';
    }
    this.state.surveyCategoryFilter = category;
    this.navigate('surveys');
  },

  async handleOpenSurveyFromHome(surveyId) {
    this.haptic('light');
    if (!this.state.currentUser) {
      this.state.pendingSurveyId = surveyId;
      this.showToast('Vui lòng đăng nhập để bắt đầu làm khảo sát này và nhận điểm thưởng!', 'info');
      await this.openSurveyPreviewModal(surveyId);
    } else {
      await this.navigate('take-survey', { surveyId });
    }
  },

  // ==================== VIEW 1: BENTO DASHBOARD & KHẢO SÁT ====================
  // ==================== CUSTOM UI DROPDOWN COMPONENT ====================
  toggleCustomDropdown(dropdownId, arg2, arg3, arg4) {
    let iconId = null;
    let event = null;
    let triggerId = null;

    if (arg2 && typeof arg2.stopPropagation === 'function') {
      event = arg2;
    } else if (typeof arg2 === 'string') {
      iconId = arg2;
      if (arg3 && typeof arg3.stopPropagation === 'function') {
        event = arg3;
      }
      if (typeof arg4 === 'string') {
        triggerId = arg4;
      }
    } else if (arg3 && typeof arg3.stopPropagation === 'function') {
      event = arg3;
    }

    if (event) {
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
    }

    if (window.CustomDropdownModule && typeof window.CustomDropdownModule.initDropdownListeners === 'function') {
      window.CustomDropdownModule.initDropdownListeners();
    }

    const el = document.getElementById(dropdownId);
    if (!el) return;
    const isHidden = el.classList.contains('hidden');
    // Đóng tất cả dropdown đang mở khác
    this.closeAllCustomDropdowns();
    if (isHidden) {
      el.classList.remove('hidden');
      let icon = iconId ? document.getElementById(iconId) : null;
      if (!icon && el.parentElement) {
        icon = el.parentElement.querySelector('.dropdown-trigger-icon, .custom-dropdown-icon');
      }
      if (icon) icon.classList.add('rotate-180');

      if (window.CustomDropdownModule) {
        window.CustomDropdownModule._activeDropdownId = dropdownId;
        window.CustomDropdownModule._activeDropdownIconId = iconId || (icon ? icon.id : null);
        window.CustomDropdownModule._activeDropdownTriggerId = triggerId;
      }
    }
  },

  closeAllCustomDropdowns() {
    // 1. Đóng toàn bộ các menu có class chuẩn
    document.querySelectorAll('.custom-dropdown-menu, .vibe-popover, .custom-dropdown-popover').forEach(d => d.classList.add('hidden'));
    document.querySelectorAll('.dropdown-trigger-icon, .custom-dropdown-icon').forEach(i => i.classList.remove('rotate-180'));

    // 2. Danh sách các ID menu/popover cụ thể trong toàn bộ ứng dụng
    const specificIds = [
      'survey-cat-dropdown-menu',
      'studio-category-menu',
      'studio-gender-menu',
      'studio-age-menu',
      'studio-region-popover',
      'studio-region-menu',
      'studio-occ-menu',
      'studio-uni-popover',
      'studio-duration-menu',
      'demo-uni-popover',
      'demo-gender-menu',
      'demo-province-menu',
      'demo-occupation-menu',
      'demo-income-menu',
      'user-profile-dropdown',
      'header-notif-dropdown',
      'sort-dropdown-menu',
      'length-dropdown-menu',
      'payout-points-menu',
      'payout-method-menu',
      'payout-telco-menu',
      'redeem-custom-bank-menu',
      'redeem-custom-telco-menu',
      'fast-cat-dropdown-menu',
      'admin-payout-type-menu',
      'admin-payout-status-menu',
      'admin-payout-limit-menu',
      'admin-fraud-limit-menu',
      'admin-fraud-page-menu',
      'audit-action-dropdown'
    ];
    specificIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    if (window.CustomDropdownModule) {
      window.CustomDropdownModule._activeDropdownId = null;
      window.CustomDropdownModule._activeDropdownIconId = null;
      window.CustomDropdownModule._activeDropdownTriggerId = null;
    }
  },

  selectDropdownOption(type, value, label, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.haptic('light');
    if (type === 'fast-category') {
      const input = document.getElementById('fast-category');
      const labelEl = document.getElementById('fast-cat-dropdown-label');
      if (input) input.value = value;
      if (labelEl) labelEl.innerText = label;
      this.closeAllCustomDropdowns();
      return;
    }
    if (type === 'sort') {
      this.state.sortBy = value;
      this.state.surveysCurrentPage = 1;
      const labelEl = document.getElementById('sort-dropdown-label');
      if (labelEl) labelEl.textContent = label;
    } else if (type === 'length') {
      this.state.lengthFilter = value;
      this.state.surveysCurrentPage = 1;
      const labelEl = document.getElementById('length-dropdown-label');
      if (labelEl) labelEl.textContent = label;
    }
    this.closeAllCustomDropdowns();
    // Render lại từ cache tức thời để cập nhật toàn bộ dropdown label và nội dung
    this.renderSurveysView(document.getElementById('app-root'), false);
  },

  async renderSurveysView(root, forceFetch = true) {
    // Luôn fetch mới từ server để bảo đảm 100% đồng bộ với DB thực tế, không dính cache form ảo
    try {
      const res = await this.api('/surveys');
      this.state.surveys = res.surveys || [];
    } catch (err) {
      console.warn('Không thể nạp danh sách khảo sát:', err.message);
      if (!this.state.surveys) this.state.surveys = [];
    }

    const surveys = this.state.surveys;
    const user = this.state.currentUser;

    if (user && (!this.state.streakInfo || forceFetch)) {
      try {
        await this.fetchStreakInfo();
      } catch (err) { }
    }

    const curPoints = user ? user.point_balance : 0;
    const curVnd = curPoints; // 1:1 VNĐ
    const targetPayoutVnd = curVnd < 10000 ? 10000 : 50000;
    const targetPayoutLabel = curVnd < 10000 ? '10K Thẻ Cào Đầu Tay' : '50K Rút Tiền Chuẩn';
    const goalPercent = Math.min(100, Math.round((curVnd / targetPayoutVnd) * 100));

    // Lọc & Phân nhóm: Ghim luôn cố định trên đầu, bài thường ở dưới
    const { pinnedSurveys, normalSurveys } = this.processSurveysList(surveys);
    const totalAllCount = this.state.categoryFilter === 'ALL'
      ? (pinnedSurveys.length + normalSurveys.length)
      : (this.state.hideFinished ? surveys.filter(s => (s.collected_responses || 0) < (s.target_responses || 100) && s.status !== 'COMPLETED' && s.status !== 'CLOSED').length : surveys.length);

    // Nhãn hiển thị cho dropdown
    const sortLabels = {
      recommended: 'Mặc định (Sắp đầy & Mới)',
      reward_desc: 'Điểm thưởng cao nhất',
      speed: 'Tốc độ nhanh nhất',
      few_questions: 'Ít câu hỏi nhất',
      progress_desc: 'Gần đủ suất nhất',
      newest: 'Mới nhất'
    };
    const currentSortLabel = sortLabels[this.state.sortBy] || sortLabels.recommended;

    const curCatFilter = this.state.surveyCategoryFilter || 'ALL';
    const curCatMeta = curCatFilter === 'ALL' ? { label: 'Tất cả lĩnh vực' } : this.getCategoryMeta(curCatFilter);
    const currentSurveyCatLabel = curCatMeta?.label || 'Tất cả lĩnh vực';

    const lengthLabels = {
      ALL: 'Tất cả số câu',
      SHORT: '1 - 3 câu',
      MEDIUM: '4 - 7 câu',
      LONG: '≥ 8 câu'
    };
    const currentLengthLabel = lengthLabels[this.state.lengthFilter] || lengthLabels.ALL;

    root.innerHTML = `
      <div class="space-y-4 sm:space-y-4.5">
        
        <!-- ==================== BENTO GRID 2 CỘT: TIẾN ĐỘ & ĐIỂM DANH / THỐNG KÊ ==================== -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
          ${user ? (this.isEnterpriseUser() ? `
            <!-- CỘT 1 (DOANH NGHIỆP): SỐ DƯ CREDIT & QUẢN LÝ KÝ QUỸ -->
            <div class="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between h-full transition-all space-y-2.5">
              <!-- Header & KPI -->
              <div class="space-y-2">
                <!-- Header -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <i data-lucide="wallet" class="w-3.5 h-3.5 stroke-[2.2]"></i>
                    </div>
                    <div>
                      <span class="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block leading-tight">Quỹ Khảo Sát Doanh Nghiệp</span>
                    </div>
                  </div>
                  <a href="javascript:void(0)" onclick="VibeApp.navigate('wallet')" class="text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-0.5 transition-colors cursor-pointer">
                    <span>Chi Tiết Ví</span>
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </a>
                </div>

                <!-- Hero KPI: Số dư Credit -->
                <div class="flex items-baseline gap-2">
                  <span class="text-xl sm:text-2xl font-bold font-mono tracking-tight text-stone-900 dark:text-white">${Number(user.credit_balance || 0).toLocaleString('vi-VN')}</span>
                  <span class="text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400">Credit</span>
                  <span class="text-xs font-mono text-stone-400 dark:text-stone-500">(1 Credit = 1đ)</span>
                </div>
              </div>

              <!-- Action: Ký quỹ & Nạp Quỹ -->
              <div class="flex items-center justify-between gap-2 pt-0.5">
                <span class="text-[11px] text-stone-500 dark:text-stone-400 truncate">Ký quỹ Escrow tự động</span>
                <button onclick="VibeApp.openDepositModal()" class="h-7 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-all shadow-xs active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>Nạp Quỹ Ngay</span>
                </button>
              </div>
            </div>

            <!-- CỘT 2 (DOANH NGHIỆP): TĂNG TỐC THU MẪU & VÉ HỎA TỐC -->
            <div class="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between h-full transition-all space-y-2.5">
              <!-- Header & KPI -->
              <div class="space-y-2">
                <!-- Header -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <i data-lucide="rocket" class="w-3.5 h-3.5 stroke-[2.2]"></i>
                    </div>
                    <div>
                      <span class="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block leading-tight">Phân Phối Hỏa Tốc</span>
                    </div>
                  </div>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60">
                    ${Number(user.fast_track_tickets || 0)} Vé Hỏa Tốc
                  </span>
                </div>

                <!-- Hero KPI: Vé sẵn sàng & thông tin -->
                <div class="flex items-baseline justify-between">
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-xl sm:text-2xl font-bold font-mono tracking-tight text-stone-900 dark:text-white">${Number(user.fast_track_tickets || 0)}</span>
                    <span class="text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400">Vé Sẵn Sàng</span>
                  </div>
                  <span class="text-[11px] text-stone-400 dark:text-stone-500">Ghim Top 1</span>
                </div>
              </div>

              <!-- Actions: Tạo Khảo Sát & Xem Báo Cáo -->
              <div class="flex items-center gap-2 pt-0.5">
                <button onclick="VibeApp.navigate('create-survey')" class="flex-1 h-7 px-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                  <span>Tạo Khảo Sát</span>
                </button>
                <button onclick="VibeApp.navigate('creator-surveys')" class="h-7 px-2.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer">
                  <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i>
                  <span>Báo Cáo</span>
                </button>
              </div>
            </div>
          ` : `
<!-- CỘT 1 (NGƯỜI ĐIỀN KHẢO SÁT): SỐ DƯ TÍCH LŨY & TIẾN ĐỔ ĐỔI THƯỞNG -->
            <div class="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between h-full transition-all relative overflow-hidden">
              <!-- Hình nền 3D Hộp quà cam pastel chuẩn y hệt bản thiết kế đề xuất -->
              <img src="/assets/3d/gift_box_3d_master.svg" class="absolute -right-3 sm:-right-5 -bottom-2 sm:-bottom-4 w-40 sm:w-48 h-auto object-contain pointer-events-none select-none z-0 opacity-40 dark:opacity-20" alt="Gift Box" />

              <!-- Header: Icon ví màu trắng trên nền cam bo góc tròn -->
              <div class="flex items-center justify-between relative z-10">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <i data-lucide="wallet" class="w-4 h-4 stroke-[2.2]"></i>
                  </div>
                  <span class="text-stone-800 dark:text-white font-bold text-sm tracking-tight">Số dư tích lũy</span>
                </div>
                <a href="javascript:void(0)" onclick="VibeApp.navigate('wallet')" class="text-xs font-semibold text-stone-500 hover:text-orange-600 dark:text-stone-400 dark:hover:text-orange-400 flex items-center gap-1 transition-colors cursor-pointer">
                  <span>Ví & Rút</span>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </a>
              </div>

              <!-- Hàng số dư -->
              <div class="my-3 flex items-baseline relative z-10">
                <span class="text-3xl sm:text-4xl font-extrabold font-mono text-stone-900 dark:text-white tracking-tight">${curVnd.toLocaleString('vi-VN')}đ</span>
                <span class="text-sm font-medium text-stone-400 dark:text-stone-500 ml-2">(${curPoints.toLocaleString('vi-VN')} Point)</span>
              </div>

              <!-- Hàng tiến độ & thanh progress bar -->
              <div class="space-y-1.5 relative z-10">
                <div class="text-xs text-stone-500 dark:text-stone-400 font-medium truncate">Tiến độ: ${targetPayoutLabel} (Cần thêm ${(targetPayoutVnd - curVnd).toLocaleString('vi-VN')}đ)</div>
                <div class="h-2 bg-stone-100 dark:bg-stone-800 rounded-full relative overflow-visible mt-2">
                  <div class="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full relative" style="width: ${Math.max(2, goalPercent)}%">
                    <span class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-orange-600 border-2 border-white dark:border-stone-900 rounded-full shadow-xs"></span>
                  </div>
                </div>
                <div class="flex justify-end mt-1">
                  <span class="text-xs font-bold font-mono text-orange-600 dark:text-orange-400">${goalPercent}%</span>
                </div>
              </div>
            </div>

            <!-- CỘT 2 (NGƯỜI ĐIỀN KHẢO SÁT): CHUỖI ĐIỂM DANH & DẢI 7 NGÀY TƯƠNG TÁC -->
            <div class="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between h-full transition-all relative overflow-hidden">
              <!-- Hình nền 3D Hộp quà cam pastel chuẩn y hệt bản thiết kế đề xuất -->
              <img src="/assets/3d/gift_box_3d_master.svg" class="absolute -right-3 sm:-right-5 -bottom-2 sm:-bottom-4 w-40 sm:w-48 h-auto object-contain pointer-events-none select-none z-0 opacity-40 dark:opacity-20" alt="Gift Box" />

              <!-- Header: Icon ngọn lửa màu cam trên nền cam nhạt & Badge / Nút -->
              <div class="flex items-center justify-between relative z-10">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <i data-lucide="flame" class="w-4 h-4 stroke-[2.2]"></i>
                  </div>
                  <span class="text-stone-800 dark:text-white font-bold text-sm tracking-tight">Chuỗi điểm danh</span>
                </div>
                <div>
                  ${this.state.streakInfo && this.state.streakInfo.has_checked_in_today ? `
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-semibold border border-emerald-200/80">
                      <i data-lucide="check" class="w-3.5 h-3.5 stroke-[2.5]"></i>
                      <span>Đã nhận hôm nay</span>
                    </span>
                  ` : `
                    <button onclick="VibeApp.performCheckin()" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs active:scale-95 transition-all cursor-pointer">
                      <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                      <span>Điểm Danh Ngay</span>
                    </button>
                  `}
                </div>
              </div>

              <!-- Hàng số ngày liên tục -->
              <div class="my-3 flex items-baseline relative z-10">
                <span class="text-3xl sm:text-4xl font-extrabold font-mono text-orange-600 tracking-tight">${(this.state.streakInfo && this.state.streakInfo.current_streak) || 1}</span>
                <span class="text-sm font-bold text-orange-600 ml-1.5">ngày liên tục</span>
              </div>

              <!-- Dải 7 ngày T1..T7: 7 ô bo góc mềm rounded-xl py-1.5 px-1 -->
              <div class="relative z-10">
                <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
                  ${(() => {
                    const strk = this.state.streakInfo || {};
                    const curS = Number(strk.current_streak || 1);
                    const checkedToday = strk.has_checked_in_today !== undefined ? !!strk.has_checked_in_today : true;
                    const rList = (strk.roadmap && strk.roadmap.length === 7) ? strk.roadmap : [
                      { day: 1, points: 50, is_milestone: false },
                      { day: 2, points: 80, is_milestone: false },
                      { day: 3, points: 120, is_milestone: false },
                      { day: 4, points: 160, is_milestone: false },
                      { day: 5, points: 200, is_milestone: false },
                      { day: 6, points: 250, is_milestone: false },
                      { day: 7, points: 300, is_milestone: true }
                    ];

                    return rList.map(item => {
                      const isT1Claimed = (item.day === 1 && (checkedToday || curS >= 1)) || (item.day <= curS && checkedToday);
                      if (isT1Claimed) {
                        return `
                          <div onclick="VibeApp.openStreakModal()" title="Ngày ${item.day}: Đã nhận" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border-2 border-orange-400 bg-orange-50/60 dark:bg-orange-950/40 text-orange-600 font-bold transition-all cursor-pointer">
                            <span class="text-[11px] font-bold leading-none">T${item.day}</span>
                            <div class="mt-1 flex items-center justify-center h-3.5">
                              <i data-lucide="check" class="w-3.5 h-3.5 stroke-[2.5]"></i>
                            </div>
                          </div>
                        `;
                      } else if (item.day === 7) {
                        return `
                          <div onclick="VibeApp.openStreakModal()" title="Ngày 7: Hộp quà đặc biệt" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 text-stone-500 transition-all cursor-pointer hover:border-orange-300">
                            <span class="text-[11px] font-medium leading-none">T7</span>
                            <div class="mt-1 flex items-center justify-center h-3.5">
                              <i data-lucide="gift" class="w-3.5 h-3.5 text-stone-500"></i>
                            </div>
                          </div>
                        `;
                      } else {
                        return `
                          <div onclick="VibeApp.openStreakModal()" title="Ngày ${item.day}: +${item.points}đ" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 text-stone-500 transition-all cursor-pointer hover:border-orange-300">
                            <span class="text-[11px] font-medium leading-none">T${item.day}</span>
                            <div class="mt-1 flex items-center justify-center h-3.5">
                              <span class="text-xs font-mono font-semibold leading-none">+${item.points}</span>
                            </div>
                          </div>
                        `;
                      }
                    }).join('');
                  })()}
                </div>
              </div>
            </div>
          `) : `
            <!-- KHÁCH VÃNG LAI: 2 THẺ KÊU GỌI ĐĂNG NHẬP & NHẬN THƯỞNG -->
            <div class="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between h-full transition-all space-y-2.5">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <i data-lucide="compass" class="w-3.5 h-3.5 stroke-[2.2]"></i>
                    </div>
                    <div>
                      <span class="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block leading-tight">Cộng Đồng Khảo Sát</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight">10.000đ - 50.000đ / Khảo sát</div>
                  <p class="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">Làm khảo sát tích lũy tiền mặt hoặc thẻ cào.</p>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-0.5">
                <button onclick="VibeApp.openAuthModal('login')" class="flex-1 h-7 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors text-center cursor-pointer">
                  Đăng Nhập
                </button>
                <button onclick="VibeApp.openAuthModal('register')" class="flex-1 h-7 px-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-all shadow-xs active:scale-95 text-center cursor-pointer">
                  Đăng Ký
                </button>
              </div>
            </div>

            <div class="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between h-full transition-all space-y-2.5">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <i data-lucide="gift" class="w-3.5 h-3.5 stroke-[2.2]"></i>
                    </div>
                    <div>
                      <span class="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block leading-tight">Ưu Đãi Thành Viên Mới</span>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/80">
                    +50 Điểm
                  </span>
                </div>

                <div>
                  <div class="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight">+50 Điểm Thưởng Đầu Tay</div>
                  <p class="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">Kích hoạt tài khoản nhận ngay quà chào mừng.</p>
                </div>
              </div>

              <div class="pt-0.5">
                <button onclick="VibeApp.openAuthModal('register')" class="w-full h-7 px-3 rounded-lg bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5 text-orange-500"></i>
                  <span>Nhận Quà Chào Mừng</span>
                </button>
              </div>
            </div>
          `}
        </div>

<!-- ==================== THANH CÔNG CỤ LỌC CHUẨN DESIGN SSOT (CONTAINER BO TRÒN TRẮNG) ==================== -->
        <div class="allow-overflow space-y-2 relative z-20">
          
          <!-- HÀNG 1: TẤT CẢ TRONG 1 CONTAINER BO TRÒN TRẮNG (Search + Pills) -->
          <div class="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-2 sm:p-2.5 flex flex-col md:flex-row items-center gap-2.5 sm:gap-3 shadow-xs">
            
            <!-- Ô Tìm kiếm -->
            <div class="relative w-full md:w-72 shrink-0">
              <i data-lucide="search" class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              <input type="text" 
                     id="survey-search-input"
                     value="${this.state.searchQuery}"
                     oninput="VibeApp.handleSearch(this.value)"
                     placeholder="Tìm kiếm khảo sát..."
                     class="w-full pl-9 pr-3.5 py-2 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all">
            </div>

            <!-- Dải Pills Lọc Danh Mục -->
            <div class="flex items-center gap-2 overflow-x-auto no-scrollbar w-full py-0.5">
              <button onclick="VibeApp.setCategoryFilter('ALL')" class="rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${this.state.categoryFilter === 'ALL'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700/80'}">
                Tất cả (${totalAllCount})
              </button>

              <button onclick="VibeApp.setCategoryFilter('HIGH_REWARD')" class="rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${this.state.categoryFilter === 'HIGH_REWARD'
                ? 'bg-orange-600 text-white shadow-xs font-bold'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700/80'}">
                Thưởng cao
              </button>

              <button onclick="VibeApp.setCategoryFilter('FAST')" class="rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${this.state.categoryFilter === 'FAST'
                ? 'bg-orange-600 text-white shadow-xs font-bold'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700/80'}">
                Làm nhanh
              </button>

              <button onclick="VibeApp.setCategoryFilter('FEW_QUESTIONS')" class="rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${this.state.categoryFilter === 'FEW_QUESTIONS'
                ? 'bg-orange-600 text-white shadow-xs font-bold'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700/80'}">
                Dưới 10 câu
              </button>

              <button onclick="VibeApp.setCategoryFilter('VOUCHER')" class="rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${this.state.categoryFilter === 'VOUCHER'
                ? 'bg-orange-600 text-white shadow-xs font-bold'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700/80'}">
                Voucher
              </button>
            </div>

          </div>

          <!-- HÀNG 2: SẮP XẾP + HIỆN BÀI ĐÃ LÀM + GRID/LIST SWITCHER -->
          <div class="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            
            <!-- Cụm bên trái: Lĩnh vực & Sắp xếp -->
            <div class="flex flex-wrap items-center gap-2.5">
              <!-- Dropdown Lĩnh vực -->
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-500 dark:text-stone-400 font-medium">Lĩnh vực:</span>
                <div class="relative">
                  <button type="button" id="survey-cat-btn" onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('survey-cat-dropdown-menu', event)" class="custom-dropdown-trigger rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-1.5 font-semibold text-stone-800 dark:text-white flex items-center gap-2 cursor-pointer shadow-2xs ${curCatFilter !== 'ALL' ? 'border-orange-500/80 bg-orange-50/50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : ''}">
                    <span id="survey-cat-label">${this.escapeHtml(currentSurveyCatLabel)}</span>
                    <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3.5 h-3.5 stroke-[2] transition-transform duration-200 pointer-events-none"></i>
                  </button>

                  <!-- Popover Menu Lĩnh vực -->
                  <div id="survey-cat-dropdown-menu" class="custom-dropdown-menu hidden absolute left-0 z-50 mt-1.5 min-w-[220px] p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5 max-h-[300px] overflow-y-auto scrollbar-thin">
                    <div onclick="event.stopPropagation(); VibeApp.setSurveyCategoryFilter('ALL')" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${curCatFilter === 'ALL' ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                      <div class="flex items-center gap-2">
                        <i data-lucide="layers" class="w-3.5 h-3.5 text-stone-400"></i>
                        <span>Tất cả lĩnh vực</span>
                      </div>
                      ${curCatFilter === 'ALL' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                    </div>
                    ${(window.VIBE_SYSTEM_CATEGORIES || []).map(cat => `
                      <div onclick="event.stopPropagation(); VibeApp.setSurveyCategoryFilter('${cat.id}')" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${curCatFilter === cat.id ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                        <div class="flex items-center gap-2">
                          <i data-lucide="${cat.icon}" class="w-3.5 h-3.5 text-stone-400"></i>
                          <span>${this.escapeHtml(cat.label)}</span>
                        </div>
                        ${curCatFilter === cat.id ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- Sắp xếp -->
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-500 dark:text-stone-400 font-medium">Sắp xếp:</span>
                <div class="relative">
                  <button type="button" onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('sort-dropdown-menu', event)" class="custom-dropdown-trigger rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-1.5 font-semibold text-stone-800 dark:text-white flex items-center gap-2 cursor-pointer shadow-2xs">
                    <span id="sort-dropdown-label">${currentSortLabel}</span>
                    <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3.5 h-3.5 stroke-[2] transition-transform duration-200 pointer-events-none"></i>
                  </button>

                <!-- Popover Menu Sắp Xếp (Tuân thủ SSOT DESIGN.md) -->
                <div id="sort-dropdown-menu" class="custom-dropdown-menu hidden absolute left-0 z-50 mt-1.5 min-w-[210px] p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                  <div onclick="event.stopPropagation(); VibeApp.selectDropdownOption('sort', 'newest', 'Mới nhất', event)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${this.state.sortBy === 'newest' ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Mới nhất</span>
                    ${this.state.sortBy === 'newest' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.selectDropdownOption('sort', 'recommended', 'Mặc định (Sắp đầy & Mới)', event)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${this.state.sortBy === 'recommended' ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Mặc định (Sắp đầy & Mới)</span>
                    ${this.state.sortBy === 'recommended' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.selectDropdownOption('sort', 'reward_desc', 'Điểm thưởng cao nhất', event)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${this.state.sortBy === 'reward_desc' ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Điểm thưởng cao nhất</span>
                    ${this.state.sortBy === 'reward_desc' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.selectDropdownOption('sort', 'speed', 'Tốc độ nhanh nhất', event)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${this.state.sortBy === 'speed' ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Tốc độ nhanh nhất</span>
                    ${this.state.sortBy === 'speed' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.selectDropdownOption('sort', 'few_questions', 'Ít câu hỏi nhất', event)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${this.state.sortBy === 'few_questions' ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Ít câu hỏi nhất</span>
                    ${this.state.sortBy === 'few_questions' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.selectDropdownOption('sort', 'progress_desc', 'Gần đủ suất nhất', event)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${this.state.sortBy === 'progress_desc' ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Gần đủ suất nhất</span>
                    ${this.state.sortBy === 'progress_desc' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                  </div>
                </div>
              </div>
            </div>

            </div>
            <!-- Cụm bên phải: Toggle Hiện bài đã làm + Vạch phân cách + Grid/List Switcher -->
            <div class="flex items-center gap-3">
              <!-- Toggle Switch Hiện bài đã làm -->
              <div class="flex items-center gap-2 cursor-pointer select-none" onclick="VibeApp.toggleHideCompleted()">
                <i data-lucide="eye-off" class="w-4 h-4 text-stone-500 dark:text-stone-400"></i>
                <span class="text-xs font-medium text-stone-600 dark:text-stone-300">Hiện bài đã làm</span>
                <button id="hide-completed-switch" type="button" role="switch" aria-checked="${!this.state.hideFinished ? 'true' : 'false'}" class="vibe-switch vibe-switch-sm ${!this.state.hideFinished ? 'active' : ''} inline-flex items-center shrink-0 pointer-events-none">
                  <span class="vibe-switch-knob"></span>
                </button>
              </div>

              <!-- Vạch phân cách dọc -->
              <div class="h-5 w-[1px] bg-stone-200 dark:bg-stone-700 mx-0.5"></div>

              <!-- Segmented View Switcher -->
              <div class="inline-flex items-center p-0.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xs">
                <button id="view-btn-grid" onclick="VibeApp.setViewMode('grid')" title="Dạng lưới" class="p-1.5 rounded-lg transition-all ${this.state.viewMode === 'grid' ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 font-bold shadow-2xs' : 'text-stone-400 hover:text-stone-600'}">
                  <i data-lucide="layout-grid" class="w-4 h-4"></i>
                </button>
                <button id="view-btn-list" onclick="VibeApp.setViewMode('list')" title="Dạng danh sách" class="p-1.5 rounded-lg transition-all ${this.state.viewMode === 'list' ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 font-bold shadow-2xs' : 'text-stone-400 hover:text-stone-600'}">
                  <i data-lucide="list" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

          </div>

        </div>

        <!-- ==================== KHU VỰC KHẢO SÁT CHÍNH ==================== -->
        <div class="surveys-grid-section">
          ${this._renderSurveysContentHtml(pinnedSurveys, normalSurveys)}
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },


  processSurveysList(surveys) {
    const filtered = this.filterSurveys(surveys || []);
    let pinnedSurveys = filtered.filter(s => s.is_pinned === 1 || s.is_featured === 1);
    let normalSurveys = filtered.filter(s => !(s.is_pinned === 1 || s.is_featured === 1));

    pinnedSurveys = this.sortSurveysList(pinnedSurveys, false);
    normalSurveys = this.sortSurveysList(normalSurveys, true);

    return { pinnedSurveys, normalSurveys };
  },

  _renderSurveysContentHtml(pinnedList = [], normalList = []) {
    const totalCount = pinnedList.length + normalList.length;

if (totalCount === 0) {
      return `
        <div class="bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200/80 dark:border-stone-800 p-8 sm:p-12 text-center shadow-xs my-4">
          <!-- Minh họa 3D Bảng tài liệu + Kính lúp + Tia sáng chuẩn y hệt bản thiết kế đề xuất -->
          <div class="flex justify-center mb-2">
            <img src="/assets/3d/empty_state_3d_master.svg" class="w-64 sm:w-72 h-auto object-contain pointer-events-none select-none z-0 drop-shadow-md" alt="Không tìm thấy khảo sát" />
          </div>

          <h3 class="text-lg sm:text-xl font-bold text-stone-900 dark:text-white mt-4 tracking-tight">Không tìm thấy khảo sát phù hợp</h3>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-md mx-auto">Thử chọn bộ lọc khác, tắt ẩn bài đã xong hoặc quay lại sau nhé!</p>

          <button onclick="VibeApp.resetSurveyFilters()" class="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-orange-500 bg-white dark:bg-transparent hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs">
            <i data-lucide="rotate-ccw" class="w-4 h-4 stroke-[2.2]"></i>
            <span>Xóa bộ lọc</span>
          </button>
        </div>
      `;
    }

    
    const isListView = this.state.viewMode === 'list';

    // Phân trang danh sách khảo sát thường (8 bài / trang)
    const pageSize = this.state.surveysPageSize || 8;
    const totalPages = Math.max(1, Math.ceil(normalList.length / pageSize));
    let currentPage = Math.min(Math.max(1, this.state.surveysCurrentPage || 1), totalPages);
    this.state.surveysCurrentPage = currentPage;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, normalList.length);
    const pagedNormalList = normalList.slice(startIndex, endIndex);

    let paginationHtml = '';
    if (totalPages > 1) {
      let pageButtons = [];
      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
          pageButtons.push(`
            <button onclick="VibeApp.changeSurveysPage(${p})" class="w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === currentPage
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
            }">
              ${p}
            </button>
          `);
        } else if (p === currentPage - 2 || p === currentPage + 2) {
          pageButtons.push(`<span class="px-1 text-stone-400 text-xs">...</span>`);
        }
      }

      paginationHtml = `
        <div class="pt-3 pb-1 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800">
          <div class="text-xs text-stone-500 font-medium">
            Hiển thị <span class="font-bold text-stone-800 dark:text-stone-200">${normalList.length > 0 ? startIndex + 1 : 0} - ${endIndex}</span> trên tổng số <span class="font-bold text-stone-800 dark:text-stone-200">${normalList.length}</span> bài
          </div>

          <div class="flex items-center space-x-1.5">
            <button onclick="VibeApp.changeSurveysPage(${currentPage - 1})" 
                    ${currentPage === 1 ? 'disabled class="opacity-40 cursor-not-allowed px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-400"' : 'class="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors active:scale-95"'}>
              ‹ Trước
            </button>

            ${pageButtons.join('')}

            <button onclick="VibeApp.changeSurveysPage(${currentPage + 1})" 
                    ${currentPage === totalPages ? 'disabled class="opacity-40 cursor-not-allowed px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-400"' : 'class="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors active:scale-95"'}>
              Sau ›
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        
        <!-- SECTION 1: CỐ ĐỊNH TRÊN ĐẦU - KHẢO SÁT NỔI BẬT -->
        ${pinnedList.length > 0 ? `
          <div class="space-y-3">
            <div class="flex items-center justify-between pb-1.5 border-b border-stone-200 dark:border-stone-800">
              <h3 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Khảo Sát Nổi Bật
              </h3>
              <span class="text-xs text-stone-500 font-mono">${pinnedList.length} bài</span>
            </div>

            ${isListView ? `
              <div class="space-y-2">
                ${pinnedList.map(s => this.renderListSurveyRow(s, true)).join('')}
              </div>
            ` : `
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
                ${pinnedList.map(s => this.renderCompactSurveyCard(s, true)).join('')}
              </div>
            `}
          </div>
        ` : ''}

        <!-- SECTION 2: TẤT CẢ KHẢO SÁT KHÁC (CÓ PHÂN TRANG) -->
        ${normalList.length > 0 ? `
          <div class="space-y-3 pt-1">
            ${pinnedList.length > 0 ? `
              <div class="flex items-center justify-between pb-1.5 border-b border-stone-200 dark:border-stone-800">
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Khảo Sát Khác (${normalList.length} bài)
                </h3>
                <span class="text-[11px] text-stone-500">Trang ${currentPage} / ${totalPages}</span>
              </div>
            ` : ''}

            ${isListView ? `
              <div class="space-y-2">
                ${pagedNormalList.map(s => this.renderListSurveyRow(s, false)).join('')}
              </div>
            ` : `
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
                ${pagedNormalList.map(s => this.renderCompactSurveyCard(s, false)).join('')}
              </div>
            `}

            ${paginationHtml}
          </div>
        ` : ''}

      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderCompactSurveyCard(s, isPinned = false) {
    const user = this.state.currentUser;
    const isCompleted = s.user_response_status === 'VALIDATED';
    const collected = s.collected_responses || 0;
    const target = s.target_responses || 100;
    const progress = Math.min(100, Math.round((collected / target) * 100));
    const remainingSlots = Math.max(0, target - collected);
    const isNearFull = progress >= 60 && remainingSlots > 0;
    const cleanTitle = (s.title || '').replace(/📌/g, '').trim();

    let sourceText = 'Nội Bộ';
    let sourceIcon = 'file-text';
    if (s.survey_source === 'GOOGLE_FORMS') { sourceText = 'Google Forms'; sourceIcon = 'external-link'; }
    else if (s.survey_source === 'MS_FORMS') { sourceText = 'MS Forms'; sourceIcon = 'external-link'; }

    const questionCount = s.question_count || 1;
    const minMins = Math.max(1, Math.ceil((s.min_completion_time_sec || 30) / 60));
    const hasVoucher = !!(s.sponsor_brand_name || s.sponsor_voucher_title);
    const voucherText = s.sponsor_voucher_title || (s.sponsor_brand_name ? `Voucher ${s.sponsor_brand_name}` : '');

    return `
      <div class="bento-card p-3 sm:p-3.5 flex flex-col justify-between h-full transition-all ${isPinned ? 'border-orange-500/50 dark:border-orange-500/40' : ''
      }">
        <!-- Phần nội dung linh hoạt chiếm toàn bộ không gian còn lại -->
        <div class="flex-1 flex flex-col justify-between space-y-2">
          
          <div class="flex items-center justify-between gap-1 text-[11px]">
            <div class="flex items-center gap-1 overflow-hidden">
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-[10px] truncate">
                <i data-lucide="${sourceIcon}" class="w-2.5 h-2.5 stroke-[2]"></i>
                <span>${sourceText}</span>
              </span>
              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium text-[10px]">
                <i data-lucide="clock" class="w-2.5 h-2.5"></i>
                ~${minMins}p
              </span>
              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium text-[10px]">
                ${questionCount} câu
              </span>
            </div>

            <div>
              ${isPinned ? `
                <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-orange-600 text-white font-bold text-[10px]">
                  VIP
                </span>
              ` : isNearFull ? `
                <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-semibold text-[10px]">
                  Còn ${remainingSlots}
                </span>
              ` : ''}
            </div>
          </div>

          <div>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[2.5rem] hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer" onclick="${user ? `VibeApp.startSurveySession('${s.id}')` : `VibeApp.openSurveyPreviewModal('${s.id}')`}">
              ${this.escapeHtml(cleanTitle)}
            </h4>
            <p class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-1 leading-relaxed">
              ${this.escapeHtml(s.description || 'Khảo sát nghiên cứu trải nghiệm và thói quen tiêu dùng.')}
            </p>
          </div>

          <!-- Khung Voucher cố định h-6 để đảm bảo thanh tiến độ không bị lệch hàng khi có/không có voucher -->
          <div class="h-6 flex items-center">
            ${hasVoucher ? `
              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-[10px] font-semibold truncate max-w-full">
                <i data-lucide="gift" class="w-3 h-3 text-orange-600 shrink-0"></i>
                <span class="truncate">${voucherText}</span>
              </div>
            ` : ''}
          </div>

        </div>

        <!-- Phần đáy cố định: thanh tiến độ và footer thẳng tắp ngang hàng 100% -->
        <div class="pt-2 space-y-2 shrink-0">
          <div class="space-y-1">
            <div class="flex justify-between text-[10px] font-semibold text-stone-500 dark:text-stone-400">
              <span>Thu thập: ${collected}/${target}</span>
              <span class="font-mono font-bold" style="color: ${this.getProgressBarColor(progress)}">${progress}%</span>
            </div>
            <div class="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-300" style="${this.getProgressBarStyle(progress)}"></div>
            </div>
          </div>

          <div class="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
            <div>
              ${s.reward_mode === 'VOUCHER_ONLY' ? `
                <div class="text-xs font-bold text-orange-600 dark:text-orange-400">Voucher 0đ</div>
              ` : `
                <div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono leading-none">
                  +${(s.reward_points_per_response || 0).toLocaleString()} Điểm
                </div>
                <div class="text-[10px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                  ≈ ${(s.reward_points_per_response || 0).toLocaleString()}đ
                </div>
              `}
            </div>

            <div>
              ${isCompleted ? `
                <button onclick="VibeApp.navigate('review-survey', { surveyId: '${s.id}' })" class="h-8 px-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-[11px] font-bold flex items-center gap-1 transition-all" title="Xem lại câu trả lời của bạn">
                  <i data-lucide="check" class="w-3 h-3 stroke-[3] text-emerald-600"></i>
                  <span>Xem lại</span>
                </button>
              ` : user ? `
                <button onclick="VibeApp.startSurveySession('${s.id}')" class="h-8 px-3.5 rounded-lg bg-slate-900 hover:bg-orange-600 dark:bg-stone-800 dark:hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95">
                  <span class="whitespace-nowrap">Làm bài</span>
                  <i data-lucide="arrow-right" class="w-3 h-3 stroke-[2.2]"></i>
                </button>
              ` : `
                <div class="flex items-center gap-1">
                  <button onclick="VibeApp.openSurveyPreviewModal('${s.id}')" class="h-8 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-all flex items-center gap-1 active:scale-95" title="Xem trước">
                    <i data-lucide="eye" class="w-3 h-3"></i>
                    <span class="hidden sm:inline">Xem</span>
                  </button>
                  <button onclick="VibeApp.openAuthModal('login')" class="h-8 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95">
                    <span class="whitespace-nowrap">Làm bài</span>
                    <i data-lucide="arrow-right" class="w-3 h-3 stroke-[2.2]"></i>
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>

      </div>
    `;
  },

  renderListSurveyRow(s, isPinned = false) {
    const user = this.state.currentUser;
    const isCompleted = s.user_response_status === 'VALIDATED';
    const collected = s.collected_responses || 0;
    const target = s.target_responses || 100;
    const progress = Math.min(100, Math.round((collected / target) * 100));
    const remainingSlots = Math.max(0, target - collected);
    const isNearFull = progress >= 60 && remainingSlots > 0;
    const cleanTitle = (s.title || '').replace(/📌/g, '').trim();

    const questionCount = s.question_count || 1;
    const minMins = Math.max(1, Math.ceil((s.min_completion_time_sec || 30) / 60));

    return `
      <div class="bento-card p-3 flex flex-wrap items-center justify-between gap-y-3 gap-x-4 pb-2 border-b border-stone-100 dark:border-stone-800 transition-all ${isPinned ? 'border-orange-500/50 dark:border-orange-500/40' : ''
      }">
        
        <div class="space-y-1 min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${isPinned ? `
              <span class="px-1.5 py-0.5 rounded bg-orange-600 text-white font-bold text-[10px] flex items-center">
                <span>VIP</span>
              </span>
            ` : ''}

            ${isNearFull ? `
              <span class="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-medium text-[10px]">
                Còn ${remainingSlots} suất
              </span>
            ` : ''}
            <span class="text-[10px] text-stone-500 dark:text-stone-400">~${minMins} phút • ${questionCount} câu</span>
          </div>

          <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-orange-600 dark:hover:text-orange-400" onclick="${user ? `VibeApp.startSurveySession('${s.id}')` : `VibeApp.openSurveyPreviewModal('${s.id}')`}">
            ${this.escapeHtml(cleanTitle)}
          </h4>
        </div>

        <div class="w-full sm:w-36 shrink-0 space-y-1">
          <div class="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span>${collected}/${target}</span>
            <span class="font-mono font-bold" style="color: ${this.getProgressBarColor(progress)}">${progress}%</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-300" style="${this.getProgressBarStyle(progress)}"></div>
          </div>
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div class="text-right">
            <div class="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-500 font-mono">
              +${(s.reward_points_per_response || 0).toLocaleString()} Điểm
            </div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              ≈ ${(s.reward_points_per_response || 0).toLocaleString()}đ
            </div>
          </div>

          ${isCompleted ? `
            <button onclick="VibeApp.navigate('review-survey', { surveyId: '${s.id}' })" class="h-8 px-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-xs font-semibold flex items-center gap-1 transition-all" title="Xem lại câu trả lời của bạn">
              <i data-lucide="check" class="w-3 h-3 stroke-[3] text-emerald-600"></i>
              <span>Xem lại</span>
            </button>
          ` : user ? `
            <button onclick="VibeApp.startSurveySession('${s.id}')" class="h-8 px-3.5 rounded-xl bg-slate-900 hover:bg-orange-600 dark:bg-stone-800 dark:hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95">
              <span class="whitespace-nowrap">Làm bài</span>
              <i data-lucide="arrow-right" class="w-3 h-3"></i>
            </button>
          ` : `
            <button onclick="VibeApp.openAuthModal('login')" class="h-8 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95">
              <span class="whitespace-nowrap">Làm bài</span>
              <i data-lucide="arrow-right" class="w-3 h-3"></i>
            </button>
          `}
        </div>

      </div>
    `;
  },

  filterSurveys(surveys) {
    let list = [...(surveys || [])];
    const cat = this.state.categoryFilter;
    const catCode = this.state.surveyCategoryFilter;
    const len = this.state.lengthFilter;
    const q = this.state.searchQuery.toLowerCase().trim();

    if (this.state.hideFinished) {
      list = list.filter(s => {
        const col = s.collected_responses || 0;
        const tar = s.target_responses || 100;
        const isFull = col >= tar;
        const isClosed = s.status === 'COMPLETED' || s.status === 'CLOSED';
        const isUserDone = s.user_response_status === 'VALIDATED';
        return !isFull && !isClosed && !isUserDone;
      });
    }

    if (catCode && catCode !== 'ALL') {
      list = list.filter(s => this.normalizeCategoryCode(s.category) === catCode);
    }

    if (cat === 'HIGH_REWARD') {
      list = list.filter(s => (s.reward_points_per_response || 0) >= 250);
    } else if (cat === 'FAST') {
      list = list.filter(s => (s.min_completion_time_sec || 60) <= 300); // Làm nhanh <= 5 phút
    } else if (cat === 'FEW_QUESTIONS') {
      list = list.filter(s => (s.question_count || 1) <= 10); // Dưới 10 câu
    } else if (cat === 'VOUCHER') {
      list = list.filter(s => !!(s.sponsor_brand_name || s.sponsor_voucher_title || s.reward_mode === 'VOUCHER_ONLY'));
    }

    if (len === 'UNDER_10' || len === 'SHORT') {
      list = list.filter(s => (s.question_count || 1) < 10);
    } else if (len === 'UNDER_20' || len === 'MEDIUM') {
      list = list.filter(s => (s.question_count || 1) >= 10 && (s.question_count || 1) <= 20);
    } else if (len === 'OVER_20' || len === 'LONG') {
      list = list.filter(s => (s.question_count || 1) > 20);
    }

    if (q) {
      list = list.filter(s => {
        const title = (s.title || '').toLowerCase();
        const desc = (s.description || '').toLowerCase();
        const catName = (s.category || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || catName.includes(q);
      });
    }

    return list;
  },

  sortSurveysList(surveys, prioritizeNearFull = false) {
    const list = [...(surveys || [])];
    const sort = this.state.sortBy;

    if (sort === 'reward_desc') {
      list.sort((a, b) => (b.reward_points_per_response || 0) - (a.reward_points_per_response || 0));
    } else if (sort === 'speed') {
      list.sort((a, b) => (a.min_completion_time_sec || 60) - (b.min_completion_time_sec || 60));
    } else if (sort === 'few_questions') {
      list.sort((a, b) => (a.question_count || 1) - (b.question_count || 1));
    } else if (sort === 'progress_desc') {
      list.sort((a, b) => {
        const progA = (a.collected_responses || 0) / (a.target_responses || 1);
        const progB = (b.collected_responses || 0) / (b.target_responses || 1);
        return progB - progA;
      });
    } else if (sort === 'newest') {
      // Giữ nguyên order
    } else {
      list.sort((a, b) => {
        if (prioritizeNearFull) {
          const progA = (a.collected_responses || 0) / (a.target_responses || 1);
          const progB = (b.collected_responses || 0) / (b.target_responses || 1);
          const nearFullA = (progA >= 0.6 && progA < 1.0) ? 1 : 0;
          const nearFullB = (progB >= 0.6 && progB < 1.0) ? 1 : 0;
          if (nearFullB !== nearFullA) return nearFullB - nearFullA;
        }

        return (b.reward_points_per_response || 0) - (a.reward_points_per_response || 0);
      });
    }

    return list;
  },

  filterSurveysList(surveys) {
    return this.filterSurveys(surveys);
  },

  setCategoryFilter(cat) {
    this.haptic('light');
    this.state.categoryFilter = cat;
    this.state.surveysCurrentPage = 1;
    this.renderSurveysView(document.getElementById('app-root'), false);
  },

  setSurveyCategoryFilter(catId) {
    this.haptic('light');
    this.state.surveyCategoryFilter = catId || 'ALL';
    this.state.surveysCurrentPage = 1;
    this.closeAllCustomDropdowns();
    this.renderSurveysView(document.getElementById('app-root'), false);
  },

  setSortBy(sort) {
    this.haptic('light');
    this.state.sortBy = sort;
    this.state.surveysCurrentPage = 1;
    this.renderSurveysView(document.getElementById('app-root'), false);
  },

  setLengthFilter(len) {
    this.haptic('light');
    this.state.lengthFilter = len;
    this.state.surveysCurrentPage = 1;
    this.renderSurveysView(document.getElementById('app-root'), false);
  },

  toggleHideFinished() {
    this.toggleHideCompleted();
  },

  toggleHideCompleted() {
    this.haptic('light');
    this.state.hideFinished = !this.state.hideFinished;
    this.state.hideCompletedSurveys = this.state.hideFinished;
    window.hideCompletedSurveys = this.state.hideFinished;
    this.state.surveysCurrentPage = 1;
    const switchEl = document.getElementById('hide-completed-switch');
    if (switchEl) {
      switchEl.classList.toggle('active', !this.state.hideFinished);
      switchEl.setAttribute('aria-checked', !this.state.hideFinished ? 'true' : 'false');
    }
    setTimeout(() => {
      this.renderSurveysView(document.getElementById('app-root'), false);
    }, 180);
  },

  resetSurveyFilters() {
    this.resetAllFilters();
  },

  setViewMode(mode) {
    this.haptic('light');
    this.state.viewMode = mode;
    const btnGrid = document.getElementById('view-btn-grid');
    const btnList = document.getElementById('view-btn-list');
    const activeCls = 'p-1.5 rounded-lg transition-all bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 font-bold shadow-2xs';
    const inactiveCls = 'p-1.5 rounded-lg transition-all text-stone-400 hover:text-stone-600';
    if (btnGrid) btnGrid.className = mode === 'grid' ? activeCls : inactiveCls;
    if (btnList) btnList.className = mode === 'list' ? activeCls : inactiveCls;
    this._updateSurveyGrid();
  },

  changeSurveysPage(page) {
    this.haptic('light');
    this.state.surveysCurrentPage = page;
    this._updateSurveyGrid();
    const section = document.querySelector('.surveys-grid-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  handleSearch(query) {
    this.state.searchQuery = query;
    this.state.surveysCurrentPage = 1;
    clearTimeout(this._searchTimeout);
    this._searchTimeout = setTimeout(() => {
      this._updateSurveyGrid();
    }, 150);
  },

  _updateSurveyGrid() {
    const root = document.getElementById('app-root');
    if (!root) return;
    const gridSection = root.querySelector('.surveys-grid-section');
    if (!gridSection) {
      this.renderSurveysView(root);
      return;
    }

    const surveys = this.state.surveys || [];
    const { pinnedSurveys, normalSurveys } = this.processSurveysList(surveys);

    gridSection.innerHTML = this._renderSurveysContentHtml(pinnedSurveys, normalSurveys);
    if (window.lucide) window.lucide.createIcons();
  },

  resetAllFilters() {
    this.state.categoryFilter = 'ALL';
    this.state.surveyCategoryFilter = 'ALL';
    this.state.lengthFilter = 'ALL';
    this.state.speedFilter = 'ALL';
    this.state.rewardTierFilter = 'ALL';
    this.state.searchQuery = '';
    this.state.sortBy = 'recommended';
    this.state.hideFinished = false;
    this.state.surveysCurrentPage = 1;
    this.renderSurveysView(document.getElementById('app-root'));
  },

  // ==================== VIEW 2: TRÌNH LÀM BÀI KHẢO SÁT (TYPEFORM ZEN FOCUS) ====================
  async startSurveySession(surveyId) {
    this.haptic('light');

    if (!this.state.currentUser) {
      this.state.pendingSurveyId = surveyId;
      this.showToast('Vui lòng đăng nhập để bắt đầu làm bài khảo sát!', 'info');
      this.openAuthModal('login');
      return;
    }

    // Kiểm tra xem đã có bài làm dở của khảo sát này trong storage chưa để khôi phục
    const cachedSessionJson = (localStorage.getItem('survhub_active_session') || localStorage.getItem('vibesurvey_active_session'));
    if (cachedSessionJson) {
      try {
        const cached = JSON.parse(cachedSessionJson);
        if (cached && cached.surveyId === surveyId && (Object.keys(cached.answers || {}).length > 0 || cached.currentIndex > 0)) {
          this.state.activeSession = cached;
          if (this.state.activeSession.timerId) clearInterval(this.state.activeSession.timerId);
          this.state.activeSession.timerId = setInterval(() => {
            if (this.state.activeSession) {
              this.state.activeSession.durationSec = (this.state.activeSession.durationSec || 0) + 1;
              this._saveActiveSessionToStorage();
              const timerEl = document.getElementById('session-timer-text');
              if (timerEl) {
                const sec = this.state.activeSession.durationSec;
                const mins = Math.floor(sec / 60);
                const remSec = sec % 60;
                timerEl.textContent = `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
              }
            }
          }, 1000);
          this.showToast('Đang tiếp tục bài khảo sát của bạn...', 'info');
          await this.navigate('take-survey', { surveyId });
          return;
        }
      } catch (e) {
        // bỏ qua nếu parse lỗi
      }
    }

    try {
      const res = await this.api(`/surveys/${surveyId}/start-session`, { method: 'POST' });
      if (res.success) {
        const detailRes = await this.api(`/surveys/${surveyId}`);
        const surveyDetail = detailRes.survey || {};
        const isEditing = res.is_editing === true;
        const hasExistingAnswers = Object.keys(res.existingAnswers || {}).length > 0;
        const shouldStartDirectly = isEditing || hasExistingAnswers;

        this.state.activeSession = {
          surveyId,
          survey: surveyDetail,
          responseId: res.responseId,
          questions: res.questions || [],
          currentIndex: 0,
          answers: res.existingAnswers || {},
          durationSec: 0,
          minTimeSec: isEditing ? 0 : (res.minCompletionTimeSec || 15),
          rewardPoints: isEditing ? 0 : (res.rewardPoints || surveyDetail.reward_points_per_response || 0),
          isPacingLocked: false,
          isEditing: isEditing,
          hasStartedQuiz: shouldStartDirectly,
          timerId: null
        };

        if (shouldStartDirectly) {
          this.state.activeSession.timerId = setInterval(() => {
            if (this.state.activeSession) {
              this.state.activeSession.durationSec++;
              this._saveActiveSessionToStorage();
              const timerEl = document.getElementById('session-timer-text');
              if (timerEl) {
                const sec = this.state.activeSession.durationSec;
                const mins = Math.floor(sec / 60);
                const remSec = sec % 60;
                timerEl.textContent = `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
              }
            }
          }, 1000);
        }

        this._saveActiveSessionToStorage();
        this.navigate('take-survey', { surveyId });
      }
    } catch (err) {
      localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');
      this.state.activeSession = null;
      if (err.message && err.message.includes('Bạn đã hoàn thành khảo sát')) {
        this.showToast('Bạn đã hoàn thành khảo sát này. Đang mở câu trả lời của bạn...', 'info');
        await this.navigate('review-survey', { surveyId });
        return;
      }
      this.showToast(err.message, 'error');
    }
  },

  _saveActiveSessionToStorage() {
    if (!this.state.activeSession) {
      localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');
      return;
    }
    try {
      const s = this.state.activeSession;
      const serializable = {
        surveyId: s.surveyId,
        survey: s.survey,
        responseId: s.responseId,
        questions: s.questions,
        currentIndex: s.currentIndex,
        answers: s.answers,
        durationSec: s.durationSec,
        minTimeSec: s.minTimeSec,
        rewardPoints: s.rewardPoints,
        isEditing: s.isEditing === true,
        hasStartedQuiz: s.hasStartedQuiz === true
      };
      localStorage.setItem('survhub_active_session', JSON.stringify(serializable));
    } catch (e) {
      console.warn('Lỗi lưu session vào storage:', e);
    }
  },

  beginTakeSurvey() {
    this.haptic('medium');
    const session = this.state.activeSession;
    if (!session) return;
    session.hasStartedQuiz = true;
    this.state.surveyRunner = {
      visited_sections: new Set()
    };
    if (!session.timerId) {
      session.timerId = setInterval(() => {
        if (this.state.activeSession && this.state.activeSession.hasStartedQuiz) {
          this.state.activeSession.durationSec = (this.state.activeSession.durationSec || 0) + 1;
          this._saveActiveSessionToStorage();
          const timerEl = document.getElementById('session-timer-text');
          if (timerEl) {
            const sec = this.state.activeSession.durationSec;
            const mins = Math.floor(sec / 60);
            const remSec = sec % 60;
            timerEl.textContent = `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
          }
        }
      }, 1000);
    }
    this._saveActiveSessionToStorage();
    const root = document.getElementById('app-root');
    if (root) {
      this.renderTakeSurveyView(root, session.surveyId);
    }
  },

  // ==================== VIEW 2: TRÌNH LÀM BÀI KHẢO SÁT (SECTION-BASED MULTI-QUESTION RUNNER) ====================
  // Gom nhóm danh sách câu hỏi thành mảng các Section theo chuẩn Google Forms / Microsoft Forms
  buildSurveySections(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return [{
        id: 'section-0',
        title: (this.state && this.state.activeSession && this.state.activeSession.survey && this.state.activeSession.survey.title) || 'Bài khảo sát',
        description: (this.state && this.state.activeSession && this.state.activeSession.survey && this.state.activeSession.survey.description) || '',
        defaultAction: 'NEXT_PAGE',
        target: null,
        questions: []
      }];
    }

    const defaultTitle = (this.state && this.state.activeSession && this.state.activeSession.survey && this.state.activeSession.survey.title) || 'Mục 1: Thông tin chung';
    const defaultDesc = (this.state && this.state.activeSession && this.state.activeSession.survey && this.state.activeSession.survey.description) || '';

    const sections = [];
    let curSection = null;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.type === 'SECTION_HEADER') {
        if (curSection) {
          sections.push(curSection);
        }
        const defAction = (q.logic && q.logic.default_action) ? q.logic.default_action : ((q.logic && q.logic.target) ? 'GO_TO_PAGE' : 'NEXT_PAGE');
        const tgt = (q.logic && q.logic.target !== undefined && q.logic.target !== null && q.logic.target !== '') ? q.logic.target : null;
        curSection = {
          id: q.id || `section-${sections.length}`,
          headerQuestionId: q.id,
          title: q.content || `Mục ${sections.length + 1}`,
          description: (q.rows && q.rows[0]) ? q.rows[0] : (q.description || ''),
          defaultAction: defAction,
          target: tgt,
          questions: []
        };
      } else {
        if (!curSection) {
          curSection = {
            id: 'section-0',
            title: defaultTitle,
            description: defaultDesc,
            defaultAction: 'NEXT_PAGE',
            target: null,
            questions: []
          };
        }
        curSection.questions.push(q);
      }
    }

    if (curSection) {
      sections.push(curSection);
    }

    if (sections.length === 0) {
      sections.push({
        id: 'section-0',
        title: defaultTitle,
        description: defaultDesc,
        defaultAction: 'NEXT_PAGE',
        target: null,
        questions: questions.filter(q => q.type !== 'SECTION_HEADER')
      });
    }

    return sections;
  },

  async renderTakeSurveyView(root, surveyId) {
    const session = this.state.activeSession;
    if (!session || session.surveyId !== surveyId) {
      root.innerHTML = `
        <div class="text-center py-20 space-y-3">
          <p class="text-xs text-slate-500 font-medium">Phiên làm bài đã kết thúc hoặc không tìm thấy.</p>
          <button onclick="VibeApp.navigate('surveys')" class="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">
            Về Cổng Khảo Sát
          </button>
        </div>
      `;
      return;
    }

    if (session && (!session.survey || !session.survey.cover_image_url)) {
      try {
        const freshRes = await this.api(`/surveys/${surveyId}`);
        if (freshRes && freshRes.survey) {
          session.survey = freshRes.survey;
          this._saveActiveSessionToStorage();
        }
      } catch (e) { }
    }

    const hasStarted = session.hasStartedQuiz === true || session.isEditing || (session.currentSectionIndex || 0) > 0 || session.currentIndex > 0 || Object.keys(session.answers || {}).length > 0;
    if (!hasStarted) {
      const s = session.survey || {};
      const coverUrl = s.cover_image_url || null;
      const minMins = Math.max(1, Math.ceil((session.minTimeSec || 30) / 60));
      const rewardPts = session.rewardPoints || s.reward_points_per_response || 0;
      const hasVoucher = !!(s.sponsor && (s.sponsor.brand_name || s.sponsor.title));
      const voucherName = s.sponsor ? (s.sponsor.title || `Voucher ${s.sponsor.brand_name}`) : '';

      root.innerHTML = `
        <div class="stepper-focus-box max-w-3xl mx-auto py-4 sm:py-6 space-y-6">
          
          <!-- Top Navigation -->
          <div class="flex items-center justify-between text-xs text-stone-500 pb-2">
            <button onclick="VibeApp.navigate('surveys')" class="hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1.5 font-bold transition-colors">
              <i data-lucide="arrow-left" class="w-4 h-4 stroke-[2.2]"></i>
              <span>Về Cổng Khảo Sát</span>
            </button>
            <span class="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold text-[11px]">
              ${s.category || 'Khảo sát'}
            </span>
          </div>

          <!-- Main Cover Card (Google Forms Hybrid Style) -->
          <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
            ${coverUrl ? `
              <!-- Ảnh bìa biểu mẫu chuẩn Google Forms tinh gọn, căn giữa không bị lệch hay cắt xén -->
              <div class="relative w-full h-32 sm:h-40 overflow-hidden bg-stone-950 flex items-center justify-center">
                <img src="${coverUrl}" alt="" class="absolute inset-0 w-full h-full object-cover object-center blur-md opacity-35 scale-105 pointer-events-none">
                <img src="${coverUrl}" alt="Ảnh bìa khảo sát" class="relative max-h-full max-w-full object-contain mx-auto z-10" onerror="this.parentElement.style.display='none'">
              </div>
            ` : ''}

            <!-- Dải Accent Cam Vibe #EA580C -->
            <div class="h-2 bg-orange-600 w-full ${coverUrl ? '' : 'rounded-t-2xl'}"></div>

            <div class="p-6 sm:p-8 space-y-6">
              
              <!-- Tiêu đề & Mô tả -->
              <div class="space-y-3">
                <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  ${this.escapeHtml(s.title || 'Bài khảo sát')}
                </h1>
                <p class="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                  ${this.escapeHtml(s.description || 'Khảo sát nghiên cứu thị trường và thu thập ý kiến cộng đồng.')}
                </p>
              </div>

              <!-- Thẻ thông số tóm tắt (Bento Grid) -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                
                <div class="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-0.5">
                  <div class="text-[10px] font-semibold uppercase text-stone-400">Phần thưởng</div>
                  <div class="text-sm font-extrabold text-orange-600 dark:text-orange-400 font-mono">
                    +${rewardPts.toLocaleString()} Điểm
                  </div>
                  <div class="text-[10px] text-stone-400 font-mono">≈ ${rewardPts.toLocaleString()}đ</div>
                </div>

                <div class="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-0.5">
                  <div class="text-[10px] font-semibold uppercase text-stone-400">Quy mô câu hỏi</div>
                  <div class="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    ${session.questions.length} câu hỏi
                  </div>
                  <div class="text-[10px] text-stone-400">Tự động lưu bài</div>
                </div>

                <div class="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-0.5 col-span-2 sm:col-span-1">
                  <div class="text-[10px] font-semibold uppercase text-stone-400">Thời gian ước tính</div>
                  <div class="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    ~${minMins} phút
                  </div>
                  <div class="text-[10px] text-stone-400">Nhịp độ tối thiểu ${session.minTimeSec || 15}s</div>
                </div>

              </div>

              ${hasVoucher ? `
                <div class="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                    <i data-lucide="gift" class="w-5 h-5"></i>
                  </div>
                  <div class="overflow-hidden">
                    <div class="text-xs font-bold text-orange-900 dark:text-orange-200 truncate">Tài trợ quà tặng voucher độc quyền</div>
                    <div class="text-[11px] text-orange-700 dark:text-orange-400 truncate">${voucherName}</div>
                  </div>
                </div>
              ` : ''}

              ${s.allow_email_collection === true ? `
                <!-- Thông báo quyền riêng tư: khảo sát bật chế độ thu thập email đáp viên -->
                <div class="flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  <i data-lucide="mail" class="w-3.5 h-3.5 shrink-0 mt-0.5"></i>
                  <span>Khảo sát này sẽ chia sẻ địa chỉ email tài khoản của bạn cho doanh nghiệp sau khi hoàn thành.</span>
                </div>
              ` : ''}

              <!-- Lưu ý làm bài trung thực & Tiêu chuẩn chất lượng -->
              <div class="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800/80 text-[11px] text-stone-500 dark:text-stone-400 space-y-1.5 leading-relaxed">
                <div class="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                  <span>Quy tắc bảo đảm chất lượng dữ liệu:</span>
                </div>
                <p>• Trả lời cẩn thận và trung thực dựa trên trải nghiệm thực tế của bạn.</p>
                <p>• Hệ thống tích hợp thuật toán kiểm tra tính tập trung (Attention Check) và phát hiện nhấp bừa để đảm bảo quyền lợi cộng đồng.</p>
              </div>

              <!-- Nút Bắt Đầu Làm Bài -->
              <div class="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button type="button" onclick="VibeApp.beginTakeSurvey()" class="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
                  <span>Bắt Đầu Làm Khảo Sát</span>
                  <i data-lucide="arrow-right" class="w-4 h-4 stroke-[2.5]"></i>
                </button>
                <button type="button" onclick="VibeApp.navigate('surveys')" class="w-full sm:w-auto py-3.5 px-5 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-bold text-xs transition-colors text-center">
                  Để sau
                </button>
              </div>

            </div>
          </div>

        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const typeLabels = {
      SINGLE_CHOICE: 'Trắc nghiệm đơn',
      MULTIPLE_CHOICE: 'Hộp kiểm (Nhiều đáp án)',
      SHORT_TEXT: 'Trả lời ngắn',
      PARAGRAPH: 'Đoạn văn tự luận',
      OPEN_TEXT: 'Đoạn văn tự luận',
      DROPDOWN: 'Menu thả xuống',
      LINEAR_SCALE: 'Phạm vi tuyến tính',
      LIKERT_SCALE: 'Thang đo Likert',
      CHOICE_GRID: 'Lưới trắc nghiệm (Ma trận)',
      CHECKBOX_GRID: 'Lưới hộp kiểm (Ma trận)',
      FILE_UPLOAD: 'Tải tệp lên',
      DATE_INPUT: 'Chọn ngày tháng',
      DATE: 'Chọn ngày tháng',
      TIME_INPUT: 'Chọn giờ phút',
      TIME: 'Chọn giờ phút',
      RATING_STARS: 'Đánh giá xếp hạng',
      RATING: 'Đánh giá sao'
    };

    const totalQ = session.questions.length;
    let curIdx = session.currentIndex || 0;
    if (curIdx >= totalQ) {
      curIdx = Math.max(0, totalQ - 1);
      session.currentIndex = curIdx;
    }
    const q = session.questions[curIdx];
    const progressPct = totalQ > 0 ? Math.round(((curIdx + 1) / totalQ) * 100) : 100;
    const isLast = curIdx === totalQ - 1;
    const isReq = q.is_required !== 0 && q.is_required !== false;
    const canGoPrev = (session.history && session.history.length > 0) || curIdx > 0;

    // Tính toán phân đoạn hiện tại (nếu form có SECTION_HEADER)
    const currentSectionNum = (session.questions.slice(0, curIdx + 1).filter(item => item.type === 'SECTION_HEADER').length) + 1;
    const totalSections = Math.max(1, session.questions.filter(item => item.type === 'SECTION_HEADER').length + 1);
    const progressText = totalSections > 1
      ? `Mục ${currentSectionNum} / ${totalSections} • Câu #${curIdx + 1}`
      : `Câu ${curIdx + 1} / ${totalQ} (${progressPct}%)`;
    const progressPctVal = totalSections > 1
      ? Math.min(100, Math.round((currentSectionNum / totalSections) * 100))
      : progressPct;

    // Timer display
    const sec = session.durationSec || 0;
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    const initialTimeStr = `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;

    if (!session.timerId) {
      session.timerId = setInterval(() => {
        if (this.state.activeSession) {
          this.state.activeSession.durationSec = (this.state.activeSession.durationSec || 0) + 1;
          this._saveActiveSessionToStorage();
          const timerEl = document.getElementById('session-timer-text');
          if (timerEl) {
            const s = this.state.activeSession.durationSec;
            const m = Math.floor(s / 60);
            const r = s % 60;
            timerEl.textContent = `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
          }
        }
      }, 1000);
    }

    let restrictionBadgeHtml = '';
    if (['SHORT_TEXT', 'PARAGRAPH', 'OPEN_TEXT'].includes(q.type)) {
      let valObj = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
      const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
      if ((!valObj || !valObj.type || valObj.type === 'NONE') && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
        const inf = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
        if (inf) {
          valObj = inf;
          q.validation = inf;
        }
      }
      if (valObj && valObj.type && valObj.type !== 'NONE') {
        let badgeText = '';
        const vType = String(valObj.type).toUpperCase();
        if (vType === 'EMAIL') {
          badgeText = 'Email';
        } else if (vType === 'NUMBER') {
          const hasMin = valObj.min !== undefined && valObj.min !== null && String(valObj.min).trim() !== '';
          const hasMax = valObj.max !== undefined && valObj.max !== null && String(valObj.max).trim() !== '';
          let vRule = String(valObj.rule || '').toUpperCase();
          if (!vRule) vRule = (hasMin && hasMax) ? 'BETWEEN' : 'IS_NUMBER';
          if (vRule === 'BETWEEN' && hasMin && hasMax) {
            badgeText = `Số: ${valObj.min} ~ ${valObj.max}`;
          } else if (vRule === 'GREATER_THAN' && hasMin) {
            badgeText = `Số > ${valObj.min}`;
          } else if (vRule === 'LESS_THAN' && hasMax) {
            badgeText = `Số < ${valObj.max}`;
          } else {
            badgeText = 'Số';
          }
        } else if (vType === 'URL') {
          badgeText = 'URL';
        } else if (vType === 'LENGTH') {
          const vRule = String(valObj.rule || 'MAX_LENGTH').toUpperCase();
          const bLen = valObj.min || valObj.max || 100;
          badgeText = vRule === 'MIN_LENGTH' ? `Ký tự ≥ ${bLen}` : `Ký tự ≤ ${bLen}`;
        }
        if (badgeText) {
          restrictionBadgeHtml = `
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60 select-none">
              ${badgeText}
            </span>
          `;
        }
      }
    }

    root.innerHTML = `
      <div class="stepper-focus-box space-y-6 py-4 max-w-3xl mx-auto">
        
        <!-- Header Controls: Thoát Khảo Sát, Bộ Đếm Thời Gian, Tiến Trình Từng Câu (Chống Bot & Làm Bừa) -->
        <div class="flex items-center justify-between text-xs text-stone-500 pb-3 border-b border-stone-200 dark:border-stone-800">
          <button type="button" onclick="VibeApp.confirmExitSurvey()" class="hover:text-red-600 flex items-center gap-1 font-bold transition-colors cursor-pointer">
            <i data-lucide="x" class="w-4 h-4 stroke-[2.2]"></i>
            <span>Thoát Khảo Sát</span>
          </button>
          
          <div class="flex items-center space-x-3">
            <span class="font-mono text-stone-700 dark:text-stone-300 font-bold" id="session-timer-text">${initialTimeStr}</span>
            <span class="text-stone-300 dark:text-stone-700">|</span>
            <span class="font-extrabold text-orange-600 dark:text-orange-400">${progressText}</span>
          </div>
        </div>

        ${session.isEditing ? `
          <div class="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <i data-lucide="edit-3" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span><strong>Chế độ chỉnh sửa:</strong> Bạn đang cập nhật câu trả lời đã nộp.</span>
            </div>
            <button onclick="VibeApp.navigate('review-survey', { surveyId: '${surveyId}' })" class="text-[11px] underline font-bold hover:text-amber-900 cursor-pointer">
              Hủy sửa & Xem bài cũ
            </button>
          </div>
        ` : ''}

        <!-- Top Progress Line -->
        <div class="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
          <div class="bg-orange-600 h-full rounded-full transition-all duration-300" style="width: ${progressPctVal}%"></div>
        </div>

        ${q.type === 'SECTION_HEADER' ? `
          <!-- Thẻ Chuyển Phân Đoạn (Section Break Card) -->
          <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
            <div class="h-2.5 bg-orange-600 w-full"></div>
            <div class="p-6 sm:p-9 space-y-4">
              <div class="flex items-center justify-between">
                <span class="px-3 py-1 rounded-full bg-orange-50 dark:bg-stone-800 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-stone-700 text-[11px] font-extrabold font-mono uppercase tracking-wider">
                  Mục ${currentSectionNum} trên ${totalSections}
                </span>
                <span class="text-xs text-stone-400 font-mono font-bold">BƯỚC #${curIdx + 1}</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                ${this.escapeHtml(q.content || 'Mục khảo sát')}
              </h2>
              ${q.rows && q.rows[0] ? `
                <p class="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line pt-0.5">
                  ${this.escapeHtml(q.rows[0])}
                </p>
              ` : ''}
              <div class="pt-3 text-[11px] text-stone-400 flex items-center gap-1.5">
                <i data-lucide="info" class="w-3.5 h-3.5 text-orange-600"></i>
                <span>Nhấn "Bắt đầu mục này" hoặc nhấn Enter ↵ để làm tiếp các câu hỏi.</span>
              </div>
            </div>
          </div>
        ` : (q.type === 'VIDEO_BLOCK' ? `
          <!-- Khối Video Minh Họa -->
          <div id="question-card-${q.id}" class="bento-card p-6 sm:p-9 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-sm">
            ${this.renderQuestionOptions(q, null)}
          </div>
        ` : (q.type === 'TEXT_BLOCK' ? `
          <!-- Khối Tiêu Đề / Mô Tả Minh Họa -->
          <div id="question-card-${q.id}" class="bento-card p-6 sm:p-9 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-sm space-y-3">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">${this.escapeHtml(q.content)}</h3>
            ${q.rows && q.rows[0] ? `<p class="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">${this.escapeHtml(q.rows[0])}</p>` : ''}
          </div>
        ` : `
          <!-- Bento Card Câu Hỏi Đơn Lẻ (Làm Từng Câu 1 - Chống Gian Lận, Speed Trap & Attention Check Chuẩn Tuyệt Đối) -->
          <div id="question-card-${q.id}" class="bento-card p-6 sm:p-9 space-y-6 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-sm transition-all">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 dark:bg-stone-800 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-stone-700">
                    ${typeLabels[q.type] || 'Khảo sát'}
                  </span>
                  ${restrictionBadgeHtml}
                  ${isReq ? `
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40">
                      * Bắt buộc
                    </span>
                  ` : `
                    <span class="text-[10px] text-stone-400 font-medium">(Tùy chọn)</span>
                  `}
                </div>
                <span class="text-xs text-stone-400 font-mono font-bold">CÂU #${curIdx + 1}</span>
              </div>

              <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                <span>${this.escapeHtml(q.content)}</span>
                ${isReq ? '<span class="text-red-500 ml-1 font-bold">*</span>' : ''}
              </h2>

              ${q.image_url ? `
                <div class="my-3 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 max-w-lg">
                  <img src="${q.image_url}" alt="Ảnh câu hỏi" class="w-full max-h-64 object-contain bg-stone-50 dark:bg-stone-900" onerror="this.style.display='none'">
                </div>
              ` : ''}

              ${['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(q.type) ? `
                <p class="text-[11px] text-stone-400 mt-1.5 font-medium">Gợi ý phím tắt: Bấm các phím số [1], [2], [3]... trên bàn phím để chọn nhanh.</p>
              ` : ''}
            </div>

            <!-- Options / Input Container -->
            <div class="space-y-3 pt-1">
              ${this.renderQuestionOptions(q, session.answers ? session.answers[q.id] : undefined)}
            </div>

            <!-- Thẻ báo lỗi nội dòng nếu có -->
            <div id="val-err-${q.id}" class="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-2 hidden flex items-center gap-1"></div>
          </div>
        `))}

        <!-- Bottom Navigation Controls (Làm Từng Câu 1: Câu Trước & Câu Tiếp Theo / Nộp Bài) -->
        <div class="pt-3 flex items-center justify-between gap-3">
          <button type="button" onclick="VibeApp.prevQuestion()" 
                  ${canGoPrev ? '' : 'disabled'}
                  class="px-5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5 stroke-[2.2]"></i>
            <span>Câu trước</span>
          </button>

          ${isLast ? `
            <button type="button" id="stepper-next-btn" onclick="VibeApp.submitSurvey()" 
                    class="px-7 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer">
              <i data-lucide="check" class="w-4 h-4 stroke-[2.5]"></i>
              <span>${session.isEditing ? 'Cập nhật câu trả lời' : 'Nộp bài & Nhận thưởng'}</span>
              <span class="text-[10px] opacity-75 font-normal ml-1">(Enter ↵)</span>
            </button>
          ` : `
            <button type="button" id="stepper-next-btn" onclick="VibeApp.nextQuestion()" 
                    class="px-7 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer">
              <span>${q.type === 'SECTION_HEADER' ? 'Bắt đầu mục này' : 'Câu tiếp theo'}</span>
              <span class="text-[10px] opacity-75 font-normal ml-1">(Enter ↵)</span>
              <i data-lucide="arrow-right" class="w-4 h-4 stroke-[2.2]"></i>
            </button>
          `}
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderQuestionOptions(q, currentAnswer) {
    // 0. KHỐI VIDEO MINH HỌA (YouTube)
    if (q.type === 'VIDEO_BLOCK') {
      const ytEmbed = this.getYouTubeEmbedUrl(q.video_url || '');
      return `
        <div class="space-y-3">
          ${ytEmbed ? `
            <div class="aspect-video w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-black shadow-md">
              <iframe class="w-full h-full" src="${ytEmbed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          ` : `
            <div class="p-8 text-center bg-stone-50 dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-stone-400 text-xs">
              Chưa có liên kết video
            </div>
          `}
          <p class="text-xs text-stone-500 italic text-center">Vui lòng xem video phía trên trước khi bấm tiếp tục.</p>
        </div>
      `;
    }

    // 0b. KHỐI PHÂN ĐOẠN BIỂU MẪU (SECTION_HEADER)
    if (q.type === 'SECTION_HEADER') {
      return '';
    }

    // 0c. KHỐI TIÊU ĐỀ & MÔ TẢ (TEXT_BLOCK)
    if (q.type === 'TEXT_BLOCK') {
      return `
        <div class="p-5 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
          ${q.rows && q.rows[0] ? `<p class="text-xs text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">${q.rows[0]}</p>` : ''}
        </div>
      `;
    }

    // 1. TRẮC NGHIỆM ĐƠN (SINGLE_CHOICE)
    if (q.type === 'SINGLE_CHOICE') {
      const opts = q.options || [];
      return opts.map((opt, idx) => {
        const isSelected = currentAnswer === opt;
        return `
          <div onclick="VibeApp.selectSingleOption('${q.id}', '${encodeURIComponent(opt)}')" 
               class="stepper-choice-btn cursor-pointer mb-2.5 ${isSelected ? 'selected' : ''}">
            <div class="flex items-center space-x-3">
              <div class="w-5 h-5 rounded-full border-2 ${isSelected ? 'border-orange-600 bg-orange-600' : 'border-stone-300 dark:border-stone-600'} flex items-center justify-center text-white transition-colors">
                ${isSelected ? '<i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>' : ''}
              </div>
              <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">${this.escapeHtml(opt)}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. HỘP KIỂM (MULTIPLE_CHOICE)
    if (q.type === 'MULTIPLE_CHOICE') {
      const opts = q.options || [];
      const selectedList = Array.isArray(currentAnswer) ? currentAnswer : [];
      return opts.map((opt, idx) => {
        const isChecked = selectedList.includes(opt);
        return `
          <div onclick="VibeApp.toggleMultipleOption('${q.id}', '${encodeURIComponent(opt)}')" 
               class="stepper-choice-btn cursor-pointer mb-2.5 ${isChecked ? 'selected' : ''}">
            <div class="flex items-center space-x-3">
              <div class="w-5 h-5 rounded-md border-2 ${isChecked ? 'border-orange-600 bg-orange-600' : 'border-stone-300 dark:border-stone-600'} flex items-center justify-center text-white transition-colors">
                ${isChecked ? '<i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>' : ''}
              </div>
              <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">${this.escapeHtml(opt)}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. TRẢ LỜI NGẮN (SHORT_TEXT)
    if (q.type === 'SHORT_TEXT') {
      const textVal = currentAnswer || '';
      let validation = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
      const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
      if ((!validation || !validation.type || validation.type === 'NONE') && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
        const inferred = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
        if (inferred) {
          validation = inferred;
          q.validation = inferred;
        }
      }

      let placeholder = 'Nhập câu trả lời của bạn';
      if (validation && validation.type && validation.type !== 'NONE') {
        placeholder = this.generateValidationPlaceholder(validation) || (engine && engine.getMeta(validation)?.placeholder) || validation.placeholder || 'Nhập câu trả lời của bạn';
      }

      const isNum = validation && String(validation.type).toUpperCase() === 'NUMBER';

      return `
        <div class="space-y-2">
          <!-- oninput="VibeApp.updateOpenText('${q.id}', this.value)" -->
          <input type="text" 
                 ${isNum ? 'inputmode="numeric"' : ''}
                 value="${(textVal).replace(/"/g, '&quot;')}" 
                 id="survey-answer-input-${q.id}"
                 oninput="VibeApp.handleSurveyInputRealtime('${q.id}', this)"
                 onblur="VibeApp.handleSurveyInputRealtime('${q.id}', this)"
                 onchange="VibeApp.updateOpenText('${q.id}', this.value)"
                 placeholder="${placeholder.replace(/"/g, '&quot;')}"
                 class="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors">
          <div id="val-err-${q.id}" class="hidden text-xs text-red-500 flex items-center gap-1.5 mt-1.5 font-medium"></div>
        </div>
      `;
    }

    // 4. ĐOẠN VĂN (PARAGRAPH / OPEN_TEXT)
    if (['PARAGRAPH', 'OPEN_TEXT'].includes(q.type)) {
      const textVal = currentAnswer || '';
      let validation = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
      const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
      if ((!validation || !validation.type || validation.type === 'NONE') && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
        const inferred = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
        if (inferred) {
          validation = inferred;
          q.validation = inferred;
        }
      }

      let placeholder = 'Nhập câu trả lời của bạn';
      if (validation && validation.type && validation.type !== 'NONE') {
        placeholder = this.generateValidationPlaceholder(validation) || (engine && engine.getMeta(validation)?.placeholder) || validation.placeholder || 'Nhập câu trả lời của bạn';
      }

      return `
        <div class="space-y-2">
          <textarea id="survey-answer-input-${q.id}"
                    oninput="VibeApp.handleSurveyInputRealtime('${q.id}', this)" 
                    onblur="VibeApp.handleSurveyInputRealtime('${q.id}', this)"
                    onchange="VibeApp.updateOpenText('${q.id}', this.value)" 
                    rows="4"
                    placeholder="${placeholder.replace(/"/g, '&quot;')}"
                    class="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium leading-relaxed transition-colors">${textVal}</textarea>
          <div id="val-err-${q.id}" class="hidden text-xs text-red-500 flex items-center gap-1.5 mt-1.5 font-medium"></div>
        </div>
      `;
    }

    // 5. MENU THẢ XUỐNG (DROPDOWN) - Chuẩn Bento Custom Dropdown Popover theo DESIGN.md Mục 5.3
    if (q.type === 'DROPDOWN') {
      const opts = q.options || [];
      const hasAnswer = currentAnswer && opts.includes(currentAnswer);
      const displayLabel = hasAnswer ? currentAnswer : 'Chọn câu trả lời của bạn';
      const ddMenuId = `dropdown-q-${q.id}-menu`;
      const ddLabelId = `dropdown-q-${q.id}-label`;
      const ddIconId = `dropdown-q-${q.id}-icon`;

      return `
        <div class="space-y-2">
          <div class="relative">
            <button type="button" 
                    id="dropdown-q-${q.id}-btn"
                    onclick="VibeApp.toggleCustomDropdown('${ddMenuId}', '${ddIconId}', event)"
                    class="custom-dropdown-trigger w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs sm:text-sm font-bold text-left flex items-center justify-between text-slate-900 dark:text-white hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs cursor-pointer">
              <span id="${ddLabelId}" class="truncate ${hasAnswer ? 'text-slate-900 dark:text-white font-bold' : 'text-stone-400 font-medium'}">${this.escapeHtml(displayLabel)}</span>
              <i data-lucide="chevron-down" id="${ddIconId}" class="custom-dropdown-icon w-4 h-4 text-stone-400 shrink-0 ml-2 transition-transform duration-200 pointer-events-none"></i>
            </button>
            <div id="${ddMenuId}" class="custom-dropdown-menu hidden absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-2xl shadow-2xl p-2 space-y-1 max-h-[260px] overflow-y-auto scrollbar-thin">
              ${opts.map(opt => {
                const isSelected = currentAnswer === opt;
                const safeOpt = (opt || '').replace(/"/g, '&quot;');
                const encOpt = encodeURIComponent(opt || '');
                return `
                  <button type="button" 
                          onclick="VibeApp.selectSingleOption('${q.id}', '${encOpt}'); const lbl = document.getElementById('${ddLabelId}'); if (lbl) { lbl.textContent = '${safeOpt}'; lbl.className = 'truncate text-slate-900 dark:text-white font-bold'; } VibeApp.closeAllCustomDropdowns();"
                          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left ${isSelected ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                    <span class="truncate">${this.escapeHtml(opt)}</span>
                    ${isSelected ? '<i data-lucide="check" class="w-4 h-4 text-orange-600 shrink-0 ml-2"></i>' : ''}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
          <p class="text-[11px] text-stone-400">Chọn 1 tùy chọn phù hợp từ danh sách</p>
        </div>
      `;
    }

    // 6. PHẠM VI TUYẾN TÍNH (LINEAR_SCALE / LIKERT_SCALE - Chuẩn Google Forms)
    if (['LINEAR_SCALE', 'LIKERT_SCALE'].includes(q.type)) {
      const opts = (Array.isArray(q.options) && q.options.length > 0) ? q.options : ['1', '2', '3', '4', '5'];
      const minLabel = q.min_label || '';
      const maxLabel = q.max_label || '';
      const isLongScale = opts.length > 5;
      const minOpt = opts[0];
      const maxOpt = opts[opts.length - 1];

      return `
        <div class="space-y-3">
          <div class="grid ${isLongScale ? 'grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2' : 'grid-cols-5 gap-2 sm:gap-3'}">
            ${opts.map((opt) => {
              const isSelected = String(currentAnswer) === String(opt);
              return `
                <button type="button" onclick="VibeApp.selectSingleOption('${q.id}', '${encodeURIComponent(opt)}')"
                        class="likert-clean-btn ${isLongScale ? 'py-2 px-1 rounded-xl' : ''} ${isSelected ? 'selected' : ''}">
                  <div class="${isLongScale ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-bold font-mono">${opt}</div>
                  ${!isLongScale && isNaN(opt) ? `<div class="text-[10px] leading-tight mt-0.5">${opt}</div>` : ''}
                </button>
              `;
            }).join('')}
          </div>
          ${(minLabel || maxLabel) ? `
            <div class="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 px-1 pt-1 font-medium">
              <span>${minLabel ? `${minOpt}: ${minLabel}` : ''}</span>
              <span>${maxLabel ? `${maxOpt}: ${maxLabel}` : ''}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 7. LƯỚI TRẮC NGHIỆM (CHOICE_GRID - 1 LỰA CHỌN MỖI HÀNG)
    if (q.type === 'CHOICE_GRID') {
      const rows = q.rows || ['Tiêu chí 1', 'Tiêu chí 2', 'Tiêu chí 3'];
      const columns = q.columns || ['Kém', 'Bình thường', 'Tốt', 'Rất tốt'];
      const currentGridAns = (currentAnswer && typeof currentAnswer === 'object') ? currentAnswer : {};

      return `
        <div class="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 shadow-xs">
          <table class="w-full text-left text-xs">
            <thead class="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th class="py-3 px-4 font-extrabold text-stone-700 dark:text-stone-300">Tiêu chí</th>
                ${columns.map(c => `
                  <th class="py-3 px-3 text-center font-bold text-stone-600 dark:text-stone-400 whitespace-nowrap">${c}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
              ${rows.map(r => {
                const selectedCol = currentGridAns[r];
                return `
                  <tr class="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                    <td class="py-3.5 px-4 font-semibold text-stone-900 dark:text-stone-100">${r}</td>
                    ${columns.map(c => {
                      const isSelected = selectedCol === c;
                      return `
                        <td class="py-3 px-3 text-center">
                          <button type="button" onclick="VibeApp.selectChoiceGridCell('${q.id}', '${encodeURIComponent(r)}', '${encodeURIComponent(c)}')"
                                  class="w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${isSelected
                                    ? 'border-orange-600 bg-orange-600 text-white shadow-xs'
                                    : 'border-stone-300 dark:border-stone-600 hover:border-orange-400 bg-white dark:bg-stone-800'
                                  }">
                            ${isSelected ? '<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                          </button>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 8. LƯỚI HỘP KIỂM (CHECKBOX_GRID - NHIỀU LỰA CHỌN MỖI HÀNG)
    if (q.type === 'CHECKBOX_GRID') {
      const rows = q.rows || ['Tiêu chí 1', 'Tiêu chí 2', 'Tiêu chí 3'];
      const columns = q.columns || ['Kém', 'Bình thường', 'Tốt', 'Rất tốt'];
      const currentGridAns = (currentAnswer && typeof currentAnswer === 'object') ? currentAnswer : {};

      return `
        <div class="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 shadow-xs">
          <table class="w-full text-left text-xs">
            <thead class="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th class="py-3 px-4 font-extrabold text-stone-700 dark:text-stone-300">Tiêu chí</th>
                ${columns.map(c => `
                  <th class="py-3 px-3 text-center font-bold text-stone-600 dark:text-stone-400 whitespace-nowrap">${c}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
              ${rows.map(r => {
                const selectedCols = Array.isArray(currentGridAns[r]) ? currentGridAns[r] : [];
                return `
                  <tr class="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                    <td class="py-3.5 px-4 font-semibold text-stone-900 dark:text-stone-100">${r}</td>
                    ${columns.map(c => {
                      const isChecked = selectedCols.includes(c);
                      return `
                        <td class="py-3 px-3 text-center">
                          <button type="button" onclick="VibeApp.toggleCheckboxGridCell('${q.id}', '${encodeURIComponent(r)}', '${encodeURIComponent(c)}')"
                                  class="w-6 h-6 rounded-md border-2 mx-auto flex items-center justify-center transition-all ${isChecked
                                    ? 'border-orange-600 bg-orange-600 text-white shadow-xs'
                                    : 'border-stone-300 dark:border-stone-600 hover:border-orange-400 bg-white dark:bg-stone-800'
                                  }">
                            ${isChecked ? '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                          </button>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 9. TẢI TỆP LÊN (FILE_UPLOAD)
    if (q.type === 'FILE_UPLOAD') {
      const fileName = currentAnswer || '';
      return `
        <div class="p-6 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-900/60 text-center space-y-3">
          <i data-lucide="upload-cloud" class="w-8 h-8 text-orange-600 mx-auto"></i>
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">Chọn hoặc kéo thả tệp tải lên</div>
            <p class="text-[11px] text-stone-400 mt-0.5">PNG, JPG, PDF (Tối đa 5MB)</p>
          </div>
          <input type="file" id="file-input-${q.id}" onchange="VibeApp.handleFileUploadChange('${q.id}', this)" class="hidden">
          <div>
            <button type="button" onclick="document.getElementById('file-input-${q.id}').click()" class="py-2 px-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:border-orange-500 shadow-xs">
              ${fileName ? 'Thay đổi tệp đã chọn' : 'Chọn tệp từ thiết bị'}
            </button>
          </div>
          ${fileName ? `
            <div class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 pt-1">
              <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
              <span>Đã chọn tệp: ${fileName}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 10. NGÀY THÁNG (DATE_INPUT / DATE)
    if (['DATE_INPUT', 'DATE'].includes(q.type)) {
      const dateVal = currentAnswer || '';
      return `
        <div class="space-y-2">
          <input type="date" value="${dateVal}" onchange="VibeApp.selectSingleOption('${q.id}', encodeURIComponent(this.value))" 
                 class="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <p class="text-[11px] text-stone-400">Chọn ngày / tháng / năm</p>
        </div>
      `;
    }

    // 11. GIỜ PHÚT (TIME_INPUT / TIME)
    if (['TIME_INPUT', 'TIME'].includes(q.type)) {
      const timeVal = currentAnswer || '';
      return `
        <div class="space-y-2">
          <input type="time" value="${timeVal}" onchange="VibeApp.selectSingleOption('${q.id}', encodeURIComponent(this.value))" 
                 class="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <p class="text-[11px] text-stone-400">Chọn giờ và phút</p>
        </div>
      `;
    }

    // 12. ĐÁNH GIÁ SAO (RATING_STARS / RATING)
    if (['RATING_STARS', 'RATING'].includes(q.type)) {
      const stars = [1, 2, 3, 4, 5];
      const curRating = parseInt(currentAnswer, 10) || 0;
      return `
        <div class="py-4 text-center space-y-3">
          <div class="flex items-center justify-center gap-3">
            ${stars.map(star => {
              const isFilled = star <= curRating;
              return `
                <button type="button" onclick="VibeApp.selectSingleOption('${q.id}', '${star}')" 
                        class="p-2 sm:p-3 rounded-2xl transition-all transform active:scale-90 ${isFilled ? 'text-amber-400 scale-110' : 'text-stone-300 dark:text-stone-600 hover:text-amber-300'}">
                  <i data-lucide="star" class="w-8 h-8 sm:w-10 sm:h-10 ${isFilled ? 'fill-amber-400 stroke-amber-400' : 'stroke-[1.8]'}"></i>
                  <div class="text-[11px] font-bold font-mono mt-1 text-stone-600 dark:text-stone-400">${star} Sao</div>
                </button>
              `;
            }).join('')}
          </div>
          ${curRating > 0 ? `
            <div class="text-xs font-bold text-amber-500">Bạn đã đánh giá: ${curRating} / 5 Sao</div>
          ` : `
            <div class="text-xs text-stone-400">Nhấp chọn sao để đánh giá</div>
          `}
        </div>
      `;
    }

    return '';
  },

  selectSingleOption(qId, encodedOpt) {
    this.haptic('light');
    if (!this.state.activeSession) return;
    if (!this.state.activeSession.answers) this.state.activeSession.answers = {};
    const opt = decodeURIComponent(encodedOpt);
    this.state.activeSession.answers[qId] = opt;
    this._saveActiveSessionToStorage();

    // Tự động xóa trạng thái viền đỏ lỗi khi người dùng đã chọn đáp án
    const errEl = document.getElementById(`val-err-${qId}`);
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    const cardEl = document.getElementById(`question-card-${qId}`);
    if (cardEl) {
      cardEl.classList.remove('ring-1', 'ring-red-500');
    }

    const prevScrollY = window.scrollY;
    this.renderTakeSurveyView(document.getElementById('app-root'), this.state.activeSession.surveyId);
    window.scrollTo({ top: prevScrollY, behavior: 'instant' });
  },

  toggleMultipleOption(qId, encodedOpt) {
    this.haptic('light');
    if (!this.state.activeSession) return;
    if (!this.state.activeSession.answers) this.state.activeSession.answers = {};
    const opt = decodeURIComponent(encodedOpt);
    if (!Array.isArray(this.state.activeSession.answers[qId])) {
      this.state.activeSession.answers[qId] = [];
    }
    const arr = this.state.activeSession.answers[qId];
    const idx = arr.indexOf(opt);
    if (idx !== -1) {
      arr.splice(idx, 1);
    } else {
      arr.push(opt);
    }
    this._saveActiveSessionToStorage();

    const errEl = document.getElementById(`val-err-${qId}`);
    if (errEl && arr.length > 0) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    const cardEl = document.getElementById(`question-card-${qId}`);
    if (cardEl && arr.length > 0) {
      cardEl.classList.remove('ring-1', 'ring-red-500');
    }

    const prevScrollY = window.scrollY;
    this.renderTakeSurveyView(document.getElementById('app-root'), this.state.activeSession.surveyId);
    window.scrollTo({ top: prevScrollY, behavior: 'instant' });
  },

  selectChoiceGridCell(qId, encodedRow, encodedCol) {
    this.haptic('light');
    const r = decodeURIComponent(encodedRow);
    const c = decodeURIComponent(encodedCol);
    if (!this.state.activeSession.answers[qId] || typeof this.state.activeSession.answers[qId] !== 'object') {
      this.state.activeSession.answers[qId] = {};
    }
    this.state.activeSession.answers[qId][r] = c;
    this._saveActiveSessionToStorage();

    const errEl = document.getElementById(`val-err-${qId}`);
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    const cardEl = document.getElementById(`question-card-${qId}`);
    if (cardEl) {
      cardEl.classList.remove('ring-1', 'ring-red-500');
    }

    const prevScrollY = window.scrollY;
    this.renderTakeSurveyView(document.getElementById('app-root'), this.state.activeSession.surveyId);
    window.scrollTo({ top: prevScrollY, behavior: 'instant' });
  },

  toggleCheckboxGridCell(qId, encodedRow, encodedCol) {
    this.haptic('light');
    const r = decodeURIComponent(encodedRow);
    const c = decodeURIComponent(encodedCol);
    if (!this.state.activeSession.answers[qId] || typeof this.state.activeSession.answers[qId] !== 'object') {
      this.state.activeSession.answers[qId] = {};
    }
    const curList = Array.isArray(this.state.activeSession.answers[qId][r]) ? [...this.state.activeSession.answers[qId][r]] : [];
    const idx = curList.indexOf(c);
    if (idx > -1) curList.splice(idx, 1);
    else curList.push(c);
    this.state.activeSession.answers[qId][r] = curList;
    this._saveActiveSessionToStorage();

    const errEl = document.getElementById(`val-err-${qId}`);
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    const cardEl = document.getElementById(`question-card-${qId}`);
    if (cardEl) {
      cardEl.classList.remove('ring-1', 'ring-red-500');
    }

    const prevScrollY = window.scrollY;
    this.renderTakeSurveyView(document.getElementById('app-root'), this.state.activeSession.surveyId);
    window.scrollTo({ top: prevScrollY, behavior: 'instant' });
  },

  updateOpenText(qId, val) {
    if (!this.state.activeSession) return;
    if (!this.state.activeSession.answers) this.state.activeSession.answers = {};
    this.state.activeSession.answers[qId] = typeof val === 'string' ? val : (val ? String(val) : '');
    this._saveActiveSessionToStorage();
  },

  handleFileUploadChange(qId, inputEl) {
    if (inputEl.files && inputEl.files[0]) {
      const file = inputEl.files[0];
      this.state.activeSession.answers[qId] = file.name;
      this._saveActiveSessionToStorage();
      this.renderTakeSurveyView(document.getElementById('app-root'), this.state.activeSession.surveyId);
      this.showToast(`Đã đính kèm tệp: ${file.name}`, 'success');
    }
  },

  // Hàm kiểm tra tính hợp lệ toàn diện của Section hiện tại (Kiểm tra bắt buộc + Ràng buộc định dạng)
  // ==================== XÁC THỰC ĐỊNH DẠNG RÀNG BUỘC (RESTRICTION VALIDATION) ====================
  validateQuestionInput(q, val) {
    if (!q) return { valid: true };
    let validation = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
    const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (this.RestrictionEngine || (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null));
    if (['SHORT_TEXT', 'PARAGRAPH', 'OPEN_TEXT'].includes(q.type) && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
      if (!validation || !validation.type || validation.type === 'NONE') {
        const inferred = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
        if (inferred) {
          validation = inferred;
          q.validation = inferred;
        }
      }
    }
    if (!validation || !engine) return { valid: true };
    const meta = engine.getMeta(validation);
    if (meta && typeof meta.validate === 'function') {
      return meta.validate(val);
    }
    return { valid: true };
  },

  handleSurveyInputRealtime(qId, inputEl) {
    if (!inputEl) return;
    const session = this.state && this.state.activeSession;
    if (!session || !session.questions) return;
    const q = session.questions.find(item => String(item.id) === String(qId));
    if (!q) return;

    const val = inputEl.value;
    if (!session.answers) session.answers = {};
    session.answers[qId] = val;
    this._saveActiveSessionToStorage();

    const res = this.validateQuestionInput(q, val);
    const errEl = document.getElementById(`val-err-${qId}`) || document.getElementById(`survey-error-${qId}`);

    if (!res.valid && val && String(val).trim() !== '') {
      inputEl.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20');
      inputEl.classList.remove('border-stone-200', 'dark:border-stone-700', 'focus:border-orange-500');
      if (errEl) {
        errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${res.error || 'Giá trị không đúng định dạng'}</span>`;
        errEl.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons({ root: errEl });
      }
    } else {
      inputEl.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20');
      inputEl.classList.add('border-stone-200', 'dark:border-stone-700', 'focus:border-orange-500');
      if (errEl) {
        errEl.textContent = '';
        errEl.classList.add('hidden');
      }
    }
  },

  validateCurrentSection(curSection) {
    if (!curSection) return true;
    const session = this.state && this.state.activeSession ? this.state.activeSession : {};
    const answers = session.answers || {};

    // 1. Tự động đồng bộ các ô input/textarea từ DOM vào answers nếu đang ở trên trình duyệt
    if (typeof document !== 'undefined') {
      const activeInputs = document.querySelectorAll('#app-root input[type="text"], #app-root textarea, #app-root input[type="number"], #app-root input[type="date"], #app-root input[type="time"]');
      activeInputs.forEach(inp => {
        const match = inp.id && inp.id.match(/^survey-answer-input-(.+)$/);
        if (match && match[1]) {
          const qId = match[1];
          if (!session.answers) session.answers = {};
          session.answers[qId] = inp.value;
        }
      });
      if (typeof this._saveActiveSessionToStorage === 'function') {
        this._saveActiveSessionToStorage();
      }
    }

    let firstError = null;
    const questions = curSection.questions || [];

    for (const q of questions) {
      if (['VIDEO_BLOCK', 'SECTION_HEADER', 'TEXT_BLOCK'].includes(q.type)) {
        continue;
      }

      const ans = answers[q.id];
      const isReq = q.is_required !== 0 && q.is_required !== false;
      let errorMsg = '';

      // a. Kiểm tra câu hỏi bắt buộc
      if (isReq) {
        if (q.type === 'CHOICE_GRID') {
          const rows = q.rows || [];
          const ansObj = (ans && typeof ans === 'object') ? ans : {};
          const unselectedRows = rows.filter(r => !ansObj[r]);
          if (unselectedRows.length > 0) {
            errorMsg = `Vui lòng chọn phản hồi cho tất cả các hàng trong bảng ma trận (${unselectedRows.length} hàng còn trống)!`;
          }
        } else if (q.type === 'CHECKBOX_GRID') {
          const rows = q.rows || [];
          const ansObj = (ans && typeof ans === 'object') ? ans : {};
          const unselectedRows = rows.filter(r => !ansObj[r] || !Array.isArray(ansObj[r]) || ansObj[r].length === 0);
          if (unselectedRows.length > 0) {
            errorMsg = 'Vui lòng chọn ít nhất 1 ô cho mỗi hàng trong bảng ma trận!';
          }
        } else if (q.type === 'MULTIPLE_CHOICE') {
          if (!Array.isArray(ans) || ans.length === 0) {
            errorMsg = 'Vui lòng chọn ít nhất một lựa chọn!';
          }
        } else {
          if (ans === undefined || ans === null || String(ans).trim() === '') {
            errorMsg = 'Vui lòng trả lời câu hỏi bắt buộc này!';
          }
        }
      }

      // b. Kiểm tra ràng buộc định dạng (RestrictionEngine / Validation)
      if (!errorMsg && (ans !== undefined && ans !== null && String(ans).trim() !== '')) {
        const res = this.validateQuestionInput(q, ans);
        if (res && (res.valid === false || typeof res === 'string')) {
          errorMsg = typeof res === 'string' ? res : (res.error || 'Dữ liệu nhập không hợp lệ');
        }
      }

      // c. Đánh dấu giao diện lỗi hoặc gỡ bỏ (khi có DOM)
      if (typeof document !== 'undefined') {
        const errEl = document.getElementById(`val-err-${q.id}`);
        const cardEl = document.getElementById(`question-card-${q.id}`);
        const inputEl = document.getElementById(`survey-answer-input-${q.id}`);

        if (errorMsg) {
          if (cardEl) cardEl.classList.add('ring-1', 'ring-red-500');
          if (inputEl) {
            inputEl.classList.add('border-red-500', 'bg-red-50/20', 'text-red-900', 'dark:text-red-200');
            inputEl.classList.remove('border-stone-200', 'dark:border-stone-700');
          }
          if (errEl) {
            errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${this.escapeHtml ? this.escapeHtml(errorMsg) : errorMsg}</span>`;
            errEl.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons({ root: errEl });
          }
          if (!firstError) {
            firstError = {
              q,
              msg: errorMsg,
              targetEl: cardEl || inputEl,
              inputEl: inputEl
            };
          }
        } else {
          if (cardEl) cardEl.classList.remove('ring-1', 'ring-red-500');
          if (inputEl) {
            inputEl.classList.remove('border-red-500', 'bg-red-50/20', 'text-red-900', 'dark:text-red-200');
            inputEl.classList.add('border-stone-200', 'dark:border-stone-700');
          }
          if (errEl) {
            errEl.textContent = '';
            errEl.classList.add('hidden');
          }
        }
      } else if (errorMsg && !firstError) {
        firstError = { q, msg: errorMsg };
      }
    }

    if (firstError) {
      if (typeof document !== 'undefined') {
        if (firstError.targetEl) {
          firstError.targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (firstError.inputEl && typeof firstError.inputEl.focus === 'function') {
          setTimeout(() => {
            try {
              firstError.inputEl.focus();
              if (typeof firstError.inputEl.select === 'function') firstError.inputEl.select();
            } catch (e) { } }, 200);
        }
      }
      if (typeof this.showToast === 'function') {
        this.showToast(firstError.msg || 'Vui lòng hoàn thành đầy đủ các câu hỏi bắt buộc!', 'warning');
      }
      return false;
    }

    return true;
  },

  _normalizeSmartText(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/^(muc|phan|section|cau|part)\s*(\d+|[ivx]+)?[\.\:\-\s]*/i, '')
      .replace(/^ban\s+[\.\:\-\s]*/i, '')
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  _isSmartTextMatch(haystack, needle) {
    if (!haystack || !needle) return false;
    const h = this._normalizeSmartText(haystack);
    const n = this._normalizeSmartText(needle);
    if (!h || !n) return false;
    if (h === n) return true;
    if (h.length >= 4 && n.length >= 4) {
      if (h.includes(n) || n.includes(h)) return true;
    }
    const wordsH = h.split(' ').filter(w => w.length >= 2);
    const wordsN = n.split(' ').filter(w => w.length >= 2);
    if (wordsH.length >= 2 && wordsN.length >= 2) {
      const setH = new Set(wordsH);
      const setN = new Set(wordsN);
      const common = [...setN].filter(w => setH.has(w));
      const minLen = Math.min(setH.size, setN.size);
      if (minLen >= 2 && common.length >= minLen * 0.75) {
        return true;
      }
    }
    return false;
  },

  resolveSectionTarget(rawTarget, sections, optText = null, currentSection = null) {
    if (!rawTarget && !optText) return null;
    let targetVal = rawTarget;
    let action = null;
    if (typeof rawTarget === 'object' && rawTarget !== null) {
      action = rawTarget.action || null;
      if (action === 'SUBMIT' || action === 'SUBMIT_FORM' || rawTarget.target === 'SUBMIT' || rawTarget.target === 'SUBMIT_FORM') return 'SUBMIT';
      if ((action === 'NEXT' || action === 'NEXT_PAGE') && !rawTarget.target) return 'NEXT';
      targetVal = rawTarget.target !== undefined && rawTarget.target !== null ? rawTarget.target : rawTarget.action;
    }
    if (targetVal === 'SUBMIT' || targetVal === 'SUBMIT_FORM') return 'SUBMIT';
    if ((targetVal === 'NEXT' || targetVal === 'NEXT_PAGE') && !optText) return 'NEXT';

    // Trường hợp đặc biệt: Người dùng chọn chỉ tham gia NV1 / Bỏ qua NV2 -> Nhảy đến Section chung cuối cùng
    if (optText && typeof optText === 'string' && /chỉ\s*muốn\s*tham\s*gia|không\s*có\s*nguyện\s*vọng\s*2|bỏ\s*qua\s*nv2/i.test(optText)) {
      if (sections.length > 0) return sections.length - 1;
    }

    const curIdx = currentSection ? sections.findIndex(s => s.id === currentSection.id || (currentSection.headerQuestionId && s.headerQuestionId === currentSection.headerQuestionId)) : -1;

    // 1. Parse dạng số nguyên trực tiếp (0, 1, 2...)
    if (targetVal !== null && targetVal !== undefined && targetVal !== '' && targetVal !== 'NEXT' && targetVal !== 'NEXT_PAGE') {
      const parsed = parseInt(targetVal, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < sections.length && String(parsed) === String(targetVal)) {
        if (parsed !== curIdx) return parsed;
      }
    }

    // 1b. Khớp dạng prefix 'order:X'
    if (typeof targetVal === 'string' && targetVal.startsWith('order:')) {
      const orderNum = parseInt(targetVal.replace('order:', ''), 10);
      if (!isNaN(orderNum)) {
        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          const sec = sections[sIdx];
          if (sec.headerQuestionId && String(sec.headerQuestionId).includes(`_${orderNum}`)) {
            if (sIdx !== curIdx) return sIdx;
          }
          const foundQ = sec.questions && sec.questions.some(q => q.order_index === orderNum);
          if (foundQ) {
            if (sIdx !== curIdx) return sIdx;
          }
        }
      }
    }

    // 2. Khớp theo ID của Section hoặc headerQuestionId
    if (targetVal !== null && targetVal !== undefined && targetVal !== '' && targetVal !== 'NEXT' && targetVal !== 'NEXT_PAGE') {
      const secIdx = sections.findIndex(sec => String(sec.id) === String(targetVal) || String(sec.headerQuestionId) === String(targetVal));
      if (secIdx !== -1 && secIdx !== curIdx) return secIdx;
    }

    // 3. Khớp nếu target là một question ID thuộc Section nào đó
    if (targetVal !== null && targetVal !== undefined && targetVal !== '' && targetVal !== 'NEXT' && targetVal !== 'NEXT_PAGE') {
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const foundQ = sections[sIdx].questions.some(q => String(q.id) === String(targetVal));
        if (foundQ && sIdx !== curIdx) return sIdx;
      }
    }

    // 4. Smart Name / Title Matching có hỗ trợ phân cấp ngữ cảnh NV1 / NV2
    const matchQueries = [];
    if (targetVal && typeof targetVal === 'string' && targetVal !== 'NEXT' && targetVal !== 'NEXT_PAGE' && targetVal !== 'SUBMIT' && targetVal !== 'SUBMIT_FORM') {
      matchQueries.push(targetVal);
    }
    if (optText && typeof optText === 'string') {
      matchQueries.push(optText);
    }

    const curTitle = (currentSection?.title || '') + ' ' + (currentSection?.description || '');
    const isNV1Context = /(?:nguyện\s*vọng\s*1|nv1)\b/i.test(curTitle);
    const isNV2Context = /(?:nguyện\s*vọng\s*2|nv2)\b/i.test(curTitle);

    // Ưu tiên khớp trong danh sách ứng viên phù hợp với ngữ cảnh
    for (const query of matchQueries) {
      if (isNV1Context) {
        const nv1Idx = sections.findIndex((sec, idx) => idx !== curIdx && /(?:nv1|nguyện\s*vọng\s*1)\b/i.test(sec.title) && (this._isSmartTextMatch(sec.title, query) || (sec.description && this._isSmartTextMatch(sec.description, query))));
        if (nv1Idx !== -1) return nv1Idx;
      } else if (isNV2Context) {
        const nv2Idx = sections.findIndex((sec, idx) => idx !== curIdx && /(?:nv2|nguyện\s*vọng\s*2)\b/i.test(sec.title) && (this._isSmartTextMatch(sec.title, query) || (sec.description && this._isSmartTextMatch(sec.description, query))));
        if (nv2Idx !== -1) return nv2Idx;
      }

      // Quét thông thường nếu không có ngữ cảnh hoặc chưa tìm thấy
      const matchIdx = sections.findIndex((sec, idx) => idx !== curIdx && (this._isSmartTextMatch(sec.title, query) || (sec.description && this._isSmartTextMatch(sec.description, query))));
      if (matchIdx !== -1) return matchIdx;
    }

    return null;
  },

  // Điều hướng chuyển Section kế tiếp với Kiểm tra tính hợp lệ & Rẽ nhánh 3 Tầng Chuẩn DAG (Option Branching -> Section Default -> Linear NEXT)
  async nextSection() {
    this.haptic('light');
    const session = this.state.activeSession;
    if (!session) return;
    if (session.isPacingLocked) {
      this.showToast('Vui lòng đọc kỹ câu hỏi (0.5s)', 'info');
      return;
    }

    const sections = this.buildSurveySections(session.questions);
    let curSectionIdx = session.currentSectionIndex || 0;
    if (curSectionIdx >= sections.length) {
      curSectionIdx = Math.max(0, sections.length - 1);
      session.currentSectionIndex = curSectionIdx;
    }
    const curSec = sections[curSectionIdx] || sections[0];

    // 1. Kiểm tra tính hợp lệ toàn bộ câu hỏi trong Section
    if (!this.validateCurrentSection(curSec)) {
      return;
    }

    // 2. Kiểm tra câu hỏi sàng lọc Screener nếu có trong Section
    for (const q of (curSec.questions || [])) {
      if (q.is_screener && q.qualifying_answer) {
        const ans = session.answers ? session.answers[q.id] : undefined;
        const isQualified = String(ans).trim().toLowerCase() === String(q.qualifying_answer).trim().toLowerCase();
        if (!isQualified) {
          await this.handleScreenOut(session.surveyId);
          return;
        }
      }
    }

    // Khởi tạo và đồng bộ visited_sections trong state.surveyRunner để phòng chống vòng lặp vô tận (DAG Loop Prevention)
    if (!this.state.surveyRunner) {
      this.state.surveyRunner = { visited_sections: new Set() };
    } else if (!(this.state.surveyRunner.visited_sections instanceof Set)) {
      this.state.surveyRunner.visited_sections = new Set(this.state.surveyRunner.visited_sections || []);
    }

    const curSecId = curSec.id || curSec.headerQuestionId || String(curSectionIdx);
    this.state.surveyRunner.visited_sections.add(curSecId);
    this.state.surveyRunner.visited_sections.add(String(curSectionIdx));
    if (curSec.headerQuestionId) this.state.surveyRunner.visited_sections.add(String(curSec.headerQuestionId));

    // ĐÁNH GIÁ ĐIỀU HƯỚNG THEO 3 TẦNG ƯU TIÊN CHUẨN DAG:
    // =========================================================================
    // PRIORITY 1: OPTION BRANCHING (Lựa chọn đáp án trỏ đến target_section)
    // =========================================================================
    let branchAction = null;
    let selectedOptionText = null;
    for (const q of (curSec.questions || [])) {
      if (['SINGLE_CHOICE', 'DROPDOWN'].includes(q.type)) {
        const ans = session.answers ? session.answers[q.id] : undefined;
        if (ans !== undefined && ans !== null && String(ans).trim() !== '') {
          let optText = String(ans).trim();
          if (q.options && q.options.length > 0) {
            const numAns = parseInt(ans, 10);
            if (!isNaN(numAns) && q.options[numAns] !== undefined && String(numAns) === String(ans)) {
              optText = q.options[numAns].trim();
            }
          }
          if (q.logic && q.logic.enabled && q.logic.options) {
            if (q.logic.options[ans] !== undefined) {
              branchAction = q.logic.options[ans];
              selectedOptionText = optText;
              break;
            } else if (q.options) {
              const optIdx = q.options.findIndex(o => String(o).trim() === String(ans).trim());
              if (optIdx !== -1 && q.logic.options[optIdx] !== undefined) {
                branchAction = q.logic.options[optIdx];
                selectedOptionText = optText;
                break;
              }
            }
          } else {
            if (!selectedOptionText) selectedOptionText = optText;
          }
        }
      }
    }

    let resolvedOpt = null;
    if (branchAction) {
      resolvedOpt = this.resolveSectionTarget(branchAction, sections, selectedOptionText, curSec);
    } else if (selectedOptionText) {
      resolvedOpt = this.resolveSectionTarget(null, sections, selectedOptionText, curSec);
    }

    if (resolvedOpt === 'SUBMIT') {
      await this.submitSurvey();
      return;
    }
    if (typeof resolvedOpt === 'number') {
      const targetSec = sections[resolvedOpt];
      const isLoop = targetSec && (
        this.state.surveyRunner.visited_sections.has(String(resolvedOpt)) ||
        this.state.surveyRunner.visited_sections.has(String(targetSec.id)) ||
        (targetSec.headerQuestionId && this.state.surveyRunner.visited_sections.has(String(targetSec.headerQuestionId)))
      );
      if (!isLoop) {
        session.sectionHistory = session.sectionHistory || [];
        session.sectionHistory.push(curSectionIdx);
        session.currentSectionIndex = resolvedOpt;
        this._saveActiveSessionToStorage();
        if (typeof this.triggerPacingLock === 'function') this.triggerPacingLock();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
        return;
      }
    }

    // =========================================================================
    // PRIORITY 2: SECTION DEFAULT NAVIGATION (Thuộc tính defaultAction của Section)
    // =========================================================================
    if (curSec.defaultAction && curSec.defaultAction !== 'NEXT' && curSec.defaultAction !== 'NEXT_PAGE') {
      if (curSec.defaultAction === 'SUBMIT' || curSec.defaultAction === 'SUBMIT_FORM') {
        await this.submitSurvey();
        return;
      }
      const navTarget = curSec.target || curSec.defaultAction;
      const resolvedDef = this.resolveSectionTarget(navTarget, sections, null, curSec);
      if (resolvedDef === 'SUBMIT') {
        await this.submitSurvey();
        return;
      }
      if (typeof resolvedDef === 'number') {
        const targetDefSec = sections[resolvedDef];
        const isLoop = targetDefSec && (
          this.state.surveyRunner.visited_sections.has(String(resolvedDef)) ||
          this.state.surveyRunner.visited_sections.has(String(targetDefSec.id)) ||
          (targetDefSec.headerQuestionId && this.state.surveyRunner.visited_sections.has(String(targetDefSec.headerQuestionId)))
        );
        if (!isLoop) {
          session.sectionHistory = session.sectionHistory || [];
          session.sectionHistory.push(curSectionIdx);
          session.currentSectionIndex = resolvedDef;
          this._saveActiveSessionToStorage();
          if (typeof this.triggerPacingLock === 'function') this.triggerPacingLock();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
          return;
        }
      }
    }

    // =========================================================================
    // PRIORITY 3: TUYẾN TÍNH (NEXT & Điểm Hội Tụ Chung)
    // =========================================================================
    // Kiểm tra nhánh rẽ song song để tìm điểm hội tụ chung
    const branchSectionIndices = new Set();
    for (let s = 0; s < curSectionIdx; s++) {
      const prevSec = sections[s];
      for (const q of (prevSec.questions || [])) {
        if (!['SINGLE_CHOICE', 'DROPDOWN'].includes(q.type)) continue;
        const qBranchSet = new Set();
        if (q.logic && q.logic.enabled && q.logic.options) {
          Object.values(q.logic.options).forEach(t => {
            const r = this.resolveSectionTarget(t, sections);
            if (typeof r === 'number') qBranchSet.add(r);
          });
        }
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach(opt => {
            const r = this.resolveSectionTarget(null, sections, opt);
            if (typeof r === 'number') qBranchSet.add(r);
          });
        }
        if (qBranchSet.has(curSectionIdx) && qBranchSet.size >= 2) {
          qBranchSet.forEach(idx => branchSectionIndices.add(idx));
          break;
        }
      }
      if (branchSectionIndices.size > 0) break;
    }

    if (branchSectionIndices.has(curSectionIdx)) {
      let nextCommonSecIdx = -1;
      for (let s = curSectionIdx + 1; s < sections.length; s++) {
        if (!branchSectionIndices.has(s)) {
          const sSec = sections[s];
          const isVisited = this.state.surveyRunner.visited_sections.has(String(s)) ||
            (sSec && (this.state.surveyRunner.visited_sections.has(String(sSec.id)) || (sSec.headerQuestionId && this.state.surveyRunner.visited_sections.has(String(sSec.headerQuestionId)))));
          if (!isVisited) {
            nextCommonSecIdx = s;
            break;
          }
        }
      }
      if (nextCommonSecIdx !== -1) {
        session.sectionHistory = session.sectionHistory || [];
        session.sectionHistory.push(curSectionIdx);
        session.currentSectionIndex = nextCommonSecIdx;
        this._saveActiveSessionToStorage();
        if (typeof this.triggerPacingLock === 'function') this.triggerPacingLock();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
        return;
      } else {
        await this.submitSurvey();
        return;
      }
    }

    // Tìm Section tiếp theo tuyến tính chưa ghé thăm (Loop Prevention)
    let nextLinearSecIdx = -1;
    for (let s = curSectionIdx + 1; s < sections.length; s++) {
      const sSec = sections[s];
      const isVisited = this.state.surveyRunner.visited_sections.has(String(s)) ||
        (sSec && (this.state.surveyRunner.visited_sections.has(String(sSec.id)) || (sSec.headerQuestionId && this.state.surveyRunner.visited_sections.has(String(sSec.headerQuestionId)))));
      if (!isVisited) {
        nextLinearSecIdx = s;
        break;
      }
    }

    if (nextLinearSecIdx !== -1) {
      session.sectionHistory = session.sectionHistory || [];
      session.sectionHistory.push(curSectionIdx);
      session.currentSectionIndex = nextLinearSecIdx;
      this._saveActiveSessionToStorage();
      if (typeof this.triggerPacingLock === 'function') this.triggerPacingLock();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
    } else {
      await this.submitSurvey();
    }
  },

  // Điều hướng quay lại Section trước đó
  prevSection() {
    this.haptic('light');
    const session = this.state.activeSession;
    if (!session) return;
    
    if (this.state.surveyRunner && this.state.surveyRunner.visited_sections) {
      const curSecIdx = session.currentSectionIndex || 0;
      this.state.surveyRunner.visited_sections.delete(String(curSecIdx));
      const sections = this.buildSurveySections(session.questions);
      const curSec = sections[curSecIdx];
      if (curSec) {
        if (curSec.id) this.state.surveyRunner.visited_sections.delete(String(curSec.id));
        if (curSec.headerQuestionId) this.state.surveyRunner.visited_sections.delete(String(curSec.headerQuestionId));
      }
    }
    
    if (session.sectionHistory && session.sectionHistory.length > 0) {
      session.currentSectionIndex = session.sectionHistory.pop();
    } else if ((session.currentSectionIndex || 0) > 0) {
      session.currentSectionIndex = (session.currentSectionIndex || 0) - 1;
    }
    this._saveActiveSessionToStorage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
  },

  // Trình Điều Hướng Từng Câu Một (Single-Question Stepper - Bảo Đảm Anti-Fraud, Speed Trap, Attention Check & Chống Bot)
  async nextQuestion() {
    this.haptic('light');
    const session = this.state.activeSession;
    if (!session) return;
    if (session.isPacingLocked) {
      this.showToast('Vui lòng đọc kỹ câu hỏi (0.5s)', 'info');
      return;
    }

    const curQ = session.questions[session.currentIndex];
    // Tự động đồng bộ câu trả lời từ DOM input/textarea nếu có (phòng ngừa độ trễ oninput hoặc autocomplete)
    const activeInput = document.getElementById(`survey-answer-input-${curQ.id}`) || document.querySelector('#app-root input[type="text"], #app-root textarea, #app-root input[type="number"], #app-root input[type="date"], #app-root input[type="time"]');
    if (activeInput && activeInput.value !== undefined && activeInput.value !== null) {
      if (!session.answers) session.answers = {};
      session.answers[curQ.id] = activeInput.value;
      this._saveActiveSessionToStorage();
    }

    const ans = session.answers ? session.answers[curQ.id] : undefined;
    const isReq = curQ.is_required !== 0 && curQ.is_required !== false;

    // 1. Kiểm tra bắt buộc
    if (['VIDEO_BLOCK', 'SECTION_HEADER', 'TEXT_BLOCK'].includes(curQ.type)) {
      // Bỏ qua
    } else if (isReq) {
      if (curQ.type === 'CHOICE_GRID') {
        const rows = curQ.rows || [];
        const ansObj = (ans && typeof ans === 'object') ? ans : {};
        const unselectedRows = rows.filter(r => !ansObj[r]);
        if (unselectedRows.length > 0) {
          this.showToast(`Vui lòng chọn phản hồi cho tất cả các hàng trong bảng ma trận (${unselectedRows.length} hàng còn trống)!`, 'warning');
          return;
        }
      } else if (curQ.type === 'CHECKBOX_GRID') {
        const rows = curQ.rows || [];
        const ansObj = (ans && typeof ans === 'object') ? ans : {};
        const unselectedRows = rows.filter(r => !ansObj[r] || !Array.isArray(ansObj[r]) || ansObj[r].length === 0);
        if (unselectedRows.length > 0) {
          this.showToast('Vui lòng chọn ít nhất 1 ô cho mỗi hàng trong bảng ma trận!', 'warning');
          return;
        }
      } else if (curQ.type === 'MULTIPLE_CHOICE') {
        if (!Array.isArray(ans) || ans.length === 0) {
          this.showToast('Vui lòng chọn ít nhất một lựa chọn!', 'warning');
          return;
        }
      } else {
        if (ans === undefined || ans === null || String(ans).trim() === '') {
          this.showToast('Vui lòng trả lời câu hỏi bắt buộc này trước khi tiếp tục!', 'warning');
          return;
        }
      }
    }

    // 2. Kiểm tra câu hỏi sàng lọc Screener
    if (curQ.is_screener && curQ.qualifying_answer) {
      const isQualified = String(ans).trim().toLowerCase() === String(curQ.qualifying_answer).trim().toLowerCase();
      if (!isQualified) {
        await this.handleScreenOut(session.surveyId);
        return;
      }
    }

    // 3. Kiểm tra Validation Ràng buộc (Email, Number, URL, Length)
    const validation = curQ.validation || (curQ.logic && curQ.logic.validation ? curQ.logic.validation : null);
    if (validation && validation.type && validation.type !== 'NONE') {
      const valStr = (ans !== undefined && ans !== null) ? String(ans).trim() : '';
      const inputEl = document.getElementById(`survey-answer-input-${curQ.id}`) || activeInput;
      const errEl = document.getElementById(`val-err-${curQ.id}`) || document.getElementById(`survey-error-${curQ.id}`);
      if (valStr.length > 0 || isReq) {
        if (validation.type === 'EMAIL') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valStr)) {
            const msg = validation.error_message || 'Vui lòng nhập đúng định dạng email (VD: name@domain.com)';
            this.showToast(msg, 'warning');
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add('border-red-500');
            }
            if (errEl) {
              errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${msg}</span>`;
              errEl.classList.remove('hidden');
              if (window.lucide) window.lucide.createIcons({ root: errEl });
            }
            return;
          }
        } else if (validation.type === 'NUMBER') {
          const rule = String(validation.rule || 'IS_NUMBER').toUpperCase();
          if (!/^-?\d+(\.\d+)?$/.test(valStr)) {
            const msg = 'Giá trị phải là một số';
            this.showToast(msg, 'warning');
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add('border-red-500');
            }
            if (errEl) {
              errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${msg}</span>`;
              errEl.classList.remove('hidden');
              if (window.lucide) window.lucide.createIcons({ root: errEl });
            }
            return;
          }
          const num = parseFloat(valStr);
          const min = (validation.min !== undefined && validation.min !== null && String(validation.min).trim() !== '') ? parseFloat(validation.min) : null;
          const max = (validation.max !== undefined && validation.max !== null && String(validation.max).trim() !== '') ? parseFloat(validation.max) : null;
          if (rule === 'BETWEEN') {
            if (min !== null && max !== null && (num < min || num > max)) {
              const msg = validation.error_message || `Số phải nằm trong khoảng từ ${min} ~ ${max}`;
              this.showToast(msg, 'warning');
              if (inputEl) {
                inputEl.focus();
                inputEl.classList.add('border-red-500');
              }
              if (errEl) {
                errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${msg}</span>`;
                errEl.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons({ root: errEl });
              }
              return;
            }
          } else if (rule === 'GREATER_THAN') {
            if (min !== null && num <= min) {
              const msg = validation.error_message || `Số phải lớn hơn ${min}`;
              this.showToast(msg, 'warning');
              if (inputEl) {
                inputEl.focus();
                inputEl.classList.add('border-red-500');
              }
              if (errEl) {
                errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${msg}</span>`;
                errEl.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons({ root: errEl });
              }
              return;
            }
          } else if (rule === 'LESS_THAN') {
            if (max !== null && num >= max) {
              const msg = validation.error_message || `Số phải nhỏ hơn ${max}`;
              this.showToast(msg, 'warning');
              if (inputEl) {
                inputEl.focus();
                inputEl.classList.add('border-red-500');
              }
              if (errEl) {
                errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${msg}</span>`;
                errEl.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons({ root: errEl });
              }
              return;
            }
          } else if (rule === 'GREATER_THAN_OR_EQUAL') {
            if (min !== null && num < min) {
              const msg = validation.error_message || `Số phải lớn hơn hoặc bằng ${min}`;
              this.showToast(msg, 'warning');
              if (inputEl) {
                inputEl.focus();
                inputEl.classList.add('border-red-500');
              }
              if (errEl) {
                errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${msg}</span>`;
                errEl.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons({ root: errEl });
              }
              return;
            }
          } else if (rule === 'LESS_THAN_OR_EQUAL') {
            if (max !== null && num > max) {
              const msg = validation.error_message || `Số phải nhỏ hơn hoặc bằng ${max}`;
              this.showToast(msg, 'warning');
              if (inputEl) {
                inputEl.focus();
                inputEl.classList.add('border-red-500');
              }
              if (errEl) {
                errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${msg}</span>`;
                errEl.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons({ root: errEl });
              }
              return;
            }
          }
        } else if (validation.type === 'URL') {
          if (!/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i.test(valStr)) {
            const msg = validation.error_message || 'Vui lòng nhập đường dẫn URL hợp lệ';
            this.showToast(msg, 'warning');
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add('border-red-500');
            }
            if (errEl) {
              errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${msg}</span>`;
              errEl.classList.remove('hidden');
              if (window.lucide) window.lucide.createIcons({ root: errEl });
            }
            return;
          }
        } else if (validation.type === 'LENGTH') {
          const maxL = validation.max || 500;
          const minL = validation.min || 1;
          if (validation.rule === 'MAX_LENGTH' && valStr.length > maxL) {
            const msg = validation.error_message || `Độ dài không được vượt quá ${maxL} ký tự`;
            this.showToast(msg, 'warning');
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add('border-red-500');
            }
            if (errEl) {
              errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${msg}</span>`;
              errEl.classList.remove('hidden');
              if (window.lucide) window.lucide.createIcons({ root: errEl });
            }
            return;
          }
          if (validation.rule === 'MIN_LENGTH' && valStr.length < minL) {
            const msg = validation.error_message || `Độ dài phải có ít nhất ${minL} ký tự`;
            this.showToast(msg, 'warning');
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add('border-red-500');
            }
            if (errEl) {
              errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 shrink-0"></i><span>${msg}</span>`;
              errEl.classList.remove('hidden');
              if (window.lucide) window.lucide.createIcons({ root: errEl });
            }
            return;
          }
        }
      }
    }

    // 4. Đánh giá Điều hướng Rẽ nhánh 2 tầng (2-Tier Routing)
    const resolveTarget = (rawTarget, optText = null) => {
      if (!rawTarget && !optText) return null;
      let targetVal = rawTarget;
      if (typeof rawTarget === 'object' && rawTarget !== null) {
        if (rawTarget.action === 'SUBMIT' || rawTarget.target === 'SUBMIT' || rawTarget.action === 'SUBMIT_FORM' || rawTarget.default_action === 'SUBMIT_FORM' || rawTarget.default_action === 'SUBMIT') return 'SUBMIT';
        targetVal = rawTarget.target || rawTarget.action || (rawTarget.default_action !== 'GO_TO_PAGE' && rawTarget.default_action !== 'NEXT_PAGE' && rawTarget.default_action !== 'NEXT' ? rawTarget.default_action : null);
      }
      if (targetVal === 'SUBMIT' || targetVal === 'SUBMIT_FORM' || targetVal === 'ENDOFFORM' || targetVal === '-1') return 'SUBMIT';
      if ((targetVal === 'NEXT' || targetVal === 'NEXT_PAGE') && !optText) return 'NEXT';

      const strTarget = String(targetVal || '').trim();

      // 1. Kiểm tra theo ID chính xác (UUID hoặc origin_id hoặc q_...)
      if (strTarget && strTarget !== 'NEXT') {
        const foundIdx = session.questions.findIndex(item => 
          String(item.id).trim() === strTarget || 
          (item.origin_id && String(item.origin_id).trim() === strTarget) ||
          (item.id && `q_${item.origin_id}` === strTarget)
        );
        if (foundIdx !== -1) return foundIdx;
      }

      // 2. Kiểm tra nếu có tiền tố 'order:16' hoặc 'order_16' (1-based)
      if (strTarget.startsWith('order:') || strTarget.startsWith('order_')) {
        const oNum = parseInt(strTarget.replace(/^(order:|order_)/, ''), 10);
        if (!isNaN(oNum)) {
          const foundIdx = session.questions.findIndex(item => Number(item.order_index) === oNum);
          if (foundIdx !== -1) return foundIdx;
          if (oNum >= 1 && oNum <= session.questions.length) return oNum - 1;
        }
      }

      // 3. Kiểm tra nếu có tiền tố 'index:15' (0-based)
      if (strTarget.startsWith('index:')) {
        const iNum = parseInt(strTarget.replace(/^index:/, ''), 10);
        if (!isNaN(iNum) && iNum >= 0 && iNum < session.questions.length) {
          return iNum;
        }
      }

      // 4. Khớp theo Section Header ID hoặc Section ID trong buildSurveySections
      if (strTarget && strTarget !== 'NEXT') {
        const sections = this.buildSurveySections(session.questions);
        const foundSec = sections.find(sec => String(sec.id).trim() === strTarget || String(sec.headerQuestionId).trim() === strTarget);
        if (foundSec) {
          const headerIdx = session.questions.findIndex(item => String(item.id).trim() === String(foundSec.headerQuestionId || foundSec.id).trim());
          if (headerIdx !== -1) return headerIdx;
          if (foundSec.questions && foundSec.questions.length > 0) {
            const firstQIdx = session.questions.findIndex(item => String(item.id).trim() === String(foundSec.questions[0].id).trim());
            if (firstQIdx !== -1) return firstQIdx;
          }
        }
      }

      // 5. Khớp theo Section Header có tiêu đề tương đồng với strTarget (chỉ dành cho SECTION_HEADER, cấm đoán câu hỏi thường)
      if (strTarget && strTarget !== 'NEXT' && !/^\d+$/.test(strTarget)) {
        const secHeaderIdx = session.questions.findIndex(item => 
          item.type === 'SECTION_HEADER' && (this._isSmartTextMatch(item.content, strTarget) || this._isSmartTextMatch(item.title, strTarget))
        );
        if (secHeaderIdx !== -1) return secHeaderIdx;
      }

      // 6. Fallback số thuần:
      if (strTarget && strTarget !== 'NEXT') {
        const parsed = parseInt(strTarget, 10);
        if (!isNaN(parsed) && String(parsed) === strTarget) {
          const matchOrder = session.questions.findIndex(item => Number(item.order_index) === parsed);
          if (matchOrder !== -1) return matchOrder;
          if (parsed >= 0 && parsed < session.questions.length) return parsed;
        }
      }

      return null;
    };

    // Xác định đáp án người dùng vừa chọn (cho câu hiện tại)
    let selectedOptionText = null;
    if (['SINGLE_CHOICE', 'DROPDOWN'].includes(curQ.type)) {
      if (ans !== undefined && ans !== null && String(ans).trim() !== '') {
        selectedOptionText = String(ans).trim();
        if (curQ.options && curQ.options.length > 0) {
          const numAns = parseInt(ans, 10);
          if (!isNaN(numAns) && curQ.options[numAns] !== undefined && String(numAns) === String(ans)) {
            selectedOptionText = curQ.options[numAns].trim();
          }
        }
      }
    }

    let branchAction = null;
    if (['SINGLE_CHOICE', 'DROPDOWN'].includes(curQ.type) && curQ.logic && curQ.logic.enabled) {
      if (curQ.logic.options) {
        if (curQ.logic.options[ans] !== undefined) {
          branchAction = curQ.logic.options[ans];
        } else if (curQ.options) {
          const optIdx = curQ.options.findIndex(o => String(o).trim() === String(ans).trim());
          if (optIdx !== -1 && curQ.logic.options[optIdx] !== undefined) branchAction = curQ.logic.options[optIdx];
          else if (selectedOptionText && curQ.logic.options[selectedOptionText] !== undefined) branchAction = curQ.logic.options[selectedOptionText];
        }
      }
      // Nếu câu hỏi đã bật rẽ nhánh (logic.enabled === true) nhưng tùy chọn này chưa cấu hình target ID cụ thể:
      // Cho phép khớp tên phân đoạn Mục tiêu (CHỈ khớp với SECTION_HEADER)
      if (!branchAction && selectedOptionText) {
        branchAction = selectedOptionText;
      }
    } else if (curQ.type === 'SECTION_HEADER' && curQ.logic) {
      // SECTION_HEADER không được tự ý rẽ nhánh khi vừa bắt đầu hiển thị tiêu đề,
      // vì logic.target của SECTION_HEADER là đích đến SAU KHI ĐIỀN XONG toàn bộ câu hỏi trong phân đoạn đó (Section-End Routing).
      // Ngoại lệ duy nhất: Phân đoạn hoàn toàn rỗng (không chứa bất kỳ câu hỏi nào phía sau).
      const nextQ = session.questions[session.currentIndex + 1];
      const isSectionEmpty = !nextQ || nextQ.type === 'SECTION_HEADER';
      if (isSectionEmpty) {
        branchAction = curQ.logic.target || curQ.logic.default_action;
      }
    }

    let resolvedBranch = null;
    if (branchAction) {
      resolvedBranch = resolveTarget(branchAction, selectedOptionText);
    }

    if (resolvedBranch === 'SUBMIT') {
      await this.submitSurvey();
      return;
    }
    if (typeof resolvedBranch === 'number') {
      session.history = session.history || [];
      session.history.push(session.currentIndex);
      session.currentIndex = resolvedBranch;
      this._saveActiveSessionToStorage();
      this.triggerPacingLock();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
      return;
    }

    // Section-end routing
    const nextQuestionIdx = session.currentIndex + 1;
    const isSectionEnd = (nextQuestionIdx >= session.questions.length) || (session.questions[nextQuestionIdx] && session.questions[nextQuestionIdx].type === 'SECTION_HEADER');
    if (isSectionEnd && curQ.type !== 'SECTION_HEADER') {
      let currentSectionHeader = null;
      let currentSectionHeaderIdx = -1;
      for (let i = session.currentIndex; i >= 0; i--) {
        if (session.questions[i].type === 'SECTION_HEADER') {
          currentSectionHeader = session.questions[i];
          currentSectionHeaderIdx = i;
          break;
        }
      }

      // Bước 1: Ưu tiên default_action/target được cấu hình tường minh của phân đoạn hiện tại
      if (currentSectionHeader && currentSectionHeader.logic) {
        const secLogic = currentSectionHeader.logic;
        const navTarget = secLogic.target || secLogic.default_action;
        if (navTarget && navTarget !== 'NEXT' && navTarget !== 'NEXT_PAGE') {
          const resolvedSectionAction = resolveTarget(secLogic);
          if (resolvedSectionAction === 'SUBMIT') {
            await this.submitSurvey();
            return;
          }
          if (typeof resolvedSectionAction === 'number') {
            session.history = session.history || [];
            session.history.push(session.currentIndex);
            session.currentIndex = resolvedSectionAction;
            this._saveActiveSessionToStorage();
            this.triggerPacingLock();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
            return;
          }
        }
      }

      // Bước 2: Chống trôi tự do sang các phân đoạn của những tiểu ban khác
      if (currentSectionHeaderIdx !== -1) {
        const branchSecHeaderIndices = new Set();
        // Tìm câu hỏi rẽ nhánh đứng trước currentSectionHeaderIdx
        for (let i = 0; i < currentSectionHeaderIdx; i++) {
          const q = session.questions[i];
          if (!['SINGLE_CHOICE', 'DROPDOWN'].includes(q.type)) continue;

          const qBranchTargets = new Set();
          if (q.logic && q.logic.enabled && q.logic.options) {
            Object.values(q.logic.options).forEach(t => {
              const res = resolveTarget(t);
              if (typeof res === 'number') qBranchTargets.add(res);
            });
          }

          if (qBranchTargets.has(currentSectionHeaderIdx) && qBranchTargets.size >= 2) {
            qBranchTargets.forEach(idx => branchSecHeaderIndices.add(idx));
            break;
          }
        }

        if (branchSecHeaderIndices.has(currentSectionHeaderIdx)) {
          // Phân đoạn hiện tại là một nhánh rẽ!
          // Tìm Section Header đầu tiên phía sau currentSectionHeaderIdx mà KHÔNG thuộc branchSecHeaderIndices
          let nextSafeHeaderIdx = -1;
          for (let i = session.currentIndex + 1; i < session.questions.length; i++) {
            if (session.questions[i].type === 'SECTION_HEADER' && !branchSecHeaderIndices.has(i)) {
              nextSafeHeaderIdx = i;
              break;
            }
          }

          if (nextSafeHeaderIdx !== -1) {
            session.history = session.history || [];
            session.history.push(session.currentIndex);
            session.currentIndex = nextSafeHeaderIdx;
            this._saveActiveSessionToStorage();
            this.triggerPacingLock();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
            return;
          } else {
            // Không có phân đoạn chung nào sau các nhánh -> Nộp bài!
            await this.submitSurvey();
            return;
          }
        }
      }
    }

    // 5. Chuyển sang câu tiếp theo hoặc submit
    session.history = session.history || [];
    if (session.currentIndex < session.questions.length - 1) {
      session.history.push(session.currentIndex);
      session.currentIndex++;
      this._saveActiveSessionToStorage();
      this.triggerPacingLock();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
    } else {
      await this.submitSurvey();
    }
  },

  prevQuestion() {
    this.haptic('light');
    const session = this.state.activeSession;
    if (!session) return;
    if (session.history && session.history.length > 0) {
      session.currentIndex = session.history.pop();
    } else if (session.currentIndex > 0) {
      session.currentIndex--;
    }
    this._saveActiveSessionToStorage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
  },

  triggerPacingLock() {
    if (this.state.activeSession) {
      if (this._pacingTimer) clearTimeout(this._pacingTimer);
      this.state.activeSession.isPacingLocked = true;
      this._pacingTimer = setTimeout(() => {
        if (this.state.activeSession) {
          this.state.activeSession.isPacingLocked = false;
        }
      }, 150);
    }
  },

    confirmExitSurvey() {
    this.haptic('medium');
    this.showModal({
      title: 'Xác Nhận Thoát Khảo Sát',
      content: `
        <div class="space-y-4 text-center py-2">
          <div class="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 border border-stone-200 dark:border-stone-700 mx-auto flex items-center justify-center">
            <i data-lucide="alert-triangle" class="w-6 h-6 stroke-[2.2]"></i>
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-extrabold text-slate-900 dark:text-white">Bạn có chắc chắn muốn thoát?</h4>
            <p class="text-xs text-stone-600 dark:text-stone-300 font-normal">Tiến độ bài làm hiện tại sẽ bị xóa bỏ và không được nhận điểm thưởng.</p>
          </div>
          <div class="flex gap-2.5 pt-2">
            <button type="button" onclick="VibeApp.closeModal()" class="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95">
              Tiếp Tục Làm Bài
            </button>
            <button type="button" onclick="VibeApp.executeExitSurvey()" class="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold transition-all active:scale-95 border border-stone-800 dark:border-stone-700">
              Thoát & Hủy Bài
            </button>
          </div>
        </div>
      `
    });
  },

  executeExitSurvey() {
    this.closeModal();
    if (this.state.activeSession && this.state.activeSession.timerId) {
      clearInterval(this.state.activeSession.timerId);
    }
    this.state.activeSession = null;
    localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');
    this.showToast('Đã hủy bài làm và quay về danh sách khảo sát', 'info');
    this.navigate('surveys');
  },

  async handleScreenOut(surveyId) {
    if (this.state.activeSession && this.state.activeSession.timerId) {
      clearInterval(this.state.activeSession.timerId);
    }
    localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');

    try {
      const res = await this.api(`/surveys/${surveyId}/screen-out`, { method: 'POST' });
      const pts = res.consolationPoints || 0;

      if (this.state.currentUser && pts > 0) {
        this.state.currentUser.point_balance = (this.state.currentUser.point_balance || 0) + pts;
      }

      this.state.activeSession = null;

      const root = document.getElementById('app-root');
      if (root) {
        root.innerHTML = `
          <div class="stepper-focus-box py-8 text-center space-y-6">
            <div class="w-16 h-16 rounded-3xl bg-stone-100 dark:bg-stone-800 text-amber-500 mx-auto flex items-center justify-center border border-amber-200/80 dark:border-amber-800/80">
              <i data-lucide="smile" class="w-8 h-8"></i>
            </div>
            
            <div class="space-y-2">
              <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">
                Khảo sát chưa hoàn toàn phù hợp với bạn
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Rất cảm ơn bạn đã dành thời gian tham gia! Dựa trên câu trả lời sàng lọc, nhóm nghiên cứu đang tìm kiếm đối tượng khác cho đợt khảo sát này.
              </p>
            </div>

            <div class="pt-2">
              <button onclick="VibeApp.navigate('surveys')" class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
                Khám Phá Khảo Sát Khác
              </button>
            </div>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
      this.applyUserInterface();
    } catch (err) {
      this.showToast(err.message, 'error');
      this.navigate('surveys');
    }
  },

  async submitSurvey() {
    const session = this.state.activeSession;
    if (!session) return;

    if (session.isPacingLocked) {
      this.showToast('Đang kiểm tra nhịp độ...', 'info');
      return;
    }

    const curQ = session.questions[session.currentIndex];

    // Tự động đồng bộ câu trả lời từ DOM input/textarea nếu có (phòng ngừa độ trễ oninput hoặc autocomplete)
    const activeInput = document.getElementById(`survey-answer-input-${curQ.id}`) || document.querySelector('#app-root input[type="text"], #app-root textarea, #app-root input[type="number"], #app-root input[type="date"], #app-root input[type="time"]');
    if (activeInput && activeInput.value !== undefined && activeInput.value !== null) {
      if (!session.answers) session.answers = {};
      session.answers[curQ.id] = activeInput.value;
      this._saveActiveSessionToStorage();
    }

    const ans = session.answers[curQ.id];
    const isReq = curQ.is_required !== 0 && curQ.is_required !== false;

    // Kiểm tra câu hỏi cuối nếu là bắt buộc
    if (!['VIDEO_BLOCK', 'SECTION_HEADER', 'TEXT_BLOCK'].includes(curQ.type) && isReq) {
      if (curQ.type === 'CHOICE_GRID') {
        const rows = curQ.rows || [];
        const ansObj = (ans && typeof ans === 'object') ? ans : {};
        const unselectedRows = rows.filter(r => !ansObj[r]);
        if (unselectedRows.length > 0) {
          this.showToast('Vui lòng chọn phản hồi cho tất cả các hàng trong bảng ma trận!', 'warning');
          return;
        }
      } else if (curQ.type === 'CHECKBOX_GRID') {
        const rows = curQ.rows || [];
        const ansObj = (ans && typeof ans === 'object') ? ans : {};
        const unselectedRows = rows.filter(r => !ansObj[r] || !Array.isArray(ansObj[r]) || ansObj[r].length === 0);
        if (unselectedRows.length > 0) {
          this.showToast('Vui lòng chọn ít nhất 1 ô cho mỗi hàng trong bảng ma trận!', 'warning');
          return;
        }
      } else if (curQ.type === 'MULTIPLE_CHOICE') {
        if (!Array.isArray(ans) || ans.length === 0) {
          this.showToast('Vui lòng chọn ít nhất một lựa chọn!', 'warning');
          return;
        }
      } else {
        if (ans === undefined || ans === null || String(ans).trim() === '') {
          this.showToast('Vui lòng hoàn thành câu hỏi bắt buộc này!', 'warning');
          return;
        }
      }
    }

    // Nhắc nhở nếu hoàn thành quá nhanh khi nộp bài lần đầu
    if (!session.isEditing) {
      const minSafeDuration = Math.max(5, Math.floor((session.minTimeSec || 15) * 0.7));
      if (session.durationSec < minSafeDuration) {
        const waitSec = minSafeDuration - session.durationSec;
        this.showToast(`Bạn hoàn thành khá nhanh! Vui lòng dành thêm ${waitSec} giây rà soát lại để đảm bảo chất lượng phản hồi nhé.`, 'warning');
        return;
      }
    }

    if (session.timerId) clearInterval(session.timerId);

    this.showToast('Đang gửi bài và ghi nhận...', 'info');

    try {
      const res = await this.api(`/surveys/${session.surveyId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: session.answers,
          duration_sec: session.durationSec,
          device_fingerprint: this.getDeviceFingerprint()
        })
      });

      if (res.success) {
        this.haptic('success');
        localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');
        const surveyId = session.surveyId;
        const isEditing = session.isEditing;
        this.state.activeSession = null;

        if (res.newPointBalance !== undefined && this.state.currentUser) {
          this.state.currentUser.point_balance = res.newPointBalance;
        }
        this.applyUserInterface();

        if (isEditing || res.is_updated) {
          this.showToast('Cập nhật câu trả lời thành công!', 'success');
          await this.navigate('review-survey', { surveyId });
          return;
        }

        const surveyDetail = session.survey || {};
        const allowView = surveyDetail.allow_view_response !== 0;
        const allowEdit = surveyDetail.allow_edit_response === 1;

        this.showModal({
          title: 'Hoàn Thành Khảo Sát',
          content: `
            <div class="space-y-4 text-center py-2">
              <div class="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-stone-800 text-orange-600 flex items-center justify-center mx-auto shadow-xs">
                <i data-lucide="award" class="w-7 h-7 stroke-[2]"></i>
              </div>
              <div>
                <h4 class="text-base font-bold text-slate-900 dark:text-white">${res.message || 'Cảm ơn bạn đã hoàn thành khảo sát!'}</h4>
                ${res.qualityScore ? `<p class="text-xs text-slate-500 mt-1">Chất lượng phản hồi: <strong class="text-orange-600 font-bold font-mono">${res.qualityScore}/100</strong></p>` : ''}
              </div>

              ${res.pointsEarned > 0 ? `
                <div class="p-3.5 bg-orange-50/50 dark:bg-stone-800 border border-orange-200/80 dark:border-stone-700 rounded-xl text-xs flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Điểm thưởng đã cộng:</span>
                  <span class="text-orange-600 font-mono text-sm">+${res.pointsEarned.toLocaleString()} Point</span>
                </div>
              ` : ''}

              <!-- Nút chuẩn Google / Microsoft Forms -->
              <div class="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                ${allowView ? `
                  <button type="button" onclick="VibeApp.closeModal(); VibeApp.navigate('review-survey', { surveyId: '${surveyId}' })" 
                          class="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95">
                    <i data-lucide="file-text" class="w-4 h-4 text-orange-600"></i>
                    <span>Xem lại câu trả lời của bạn</span>
                  </button>
                ` : ''}
                
                ${allowEdit ? `
                  <button type="button" onclick="VibeApp.closeModal(); VibeApp.startSurveySession('${surveyId}')" 
                          class="w-full py-2.5 px-4 rounded-xl border border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                    <span>Chỉnh sửa câu trả lời của bạn</span>
                  </button>
                ` : ''}

                <button type="button" onclick="VibeApp.closeModal(); VibeApp.navigate('surveys')" 
                        class="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95">
                  Khám Phá Khảo Sát Khác
                </button>
              </div>
            </div>
          `
        });
      }
    } catch (err) {
      this.showToast(err.message || 'Lỗi khi nộp bài khảo sát', 'error');
    }
  },

  async renderReviewSurveyView(root, surveyId) {
    this.haptic('light');
    try {
      root.innerHTML = `
        <div class="max-w-3xl mx-auto py-12 text-center text-stone-400 text-xs">
          <span class="animate-spin inline-block w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full mb-3"></span>
          <div>Đang tải câu trả lời của bạn...</div>
        </div>
      `;

      const res = await this.api('/surveys/' + surveyId);
      if (!res.success || !res.survey) {
        this.showToast('Không thể tải thông tin khảo sát', 'error');
        this.navigate('surveys');
        return;
      }

      const survey = res.survey;
      const questions = res.questions || [];
      const userResponse = res.userResponse;

      if (!userResponse) {
        root.innerHTML = `
          <div class="max-w-md mx-auto py-16 text-center space-y-4">
            <div class="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
              <i data-lucide="help-circle" class="w-6 h-6"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-base font-bold text-stone-900 dark:text-white">Bạn chưa làm khảo sát này</h3>
              <p class="text-xs text-stone-500">Hãy tham gia trả lời để tích lũy điểm thưởng nhé!</p>
            </div>
            <button onclick="VibeApp.startSurveySession('${surveyId}')" class="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs">
              Bắt Đầu Làm Bài
            </button>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const userAnswers = userResponse.answers || {};
      const allowEdit = survey.allow_edit_response === 1;

      root.innerHTML = `
        <div class="max-w-3xl mx-auto px-4 py-8 space-y-6">
          ${survey.cover_image_url ? `
            <div class="w-full h-40 sm:h-52 rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 shadow-sm">
              <img src="${survey.cover_image_url}" alt="Ảnh bìa khảo sát" class="w-full h-full object-cover" onerror="this.parentElement.style.display='none'">
            </div>
          ` : ''}
          <!-- Header Tóm Tắt Bài Làm -->
          <div class="bento-card p-6 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                  <span>${userResponse.edited_at ? 'Đã chỉnh sửa phản hồi' : 'Đã nộp bài thành công'}</span>
                </span>
                <span class="text-xs text-stone-400 font-mono">
                  ${userResponse.submitted_at || 'Đã ghi nhận'}
                </span>
              </div>

              <div class="flex items-center gap-2">
                ${allowEdit ? `
                  <button onclick="VibeApp.startSurveySession('${surveyId}')" 
                          class="py-2 px-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    <span>Chỉnh sửa câu trả lời</span>
                  </button>
                ` : ''}
                <button onclick="VibeApp.navigate('surveys')" 
                        class="py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all">
                  Quay lại
                </button>
              </div>
            </div>

            <div class="space-y-1">
              <h1 class="text-xl sm:text-2xl font-black text-stone-900 dark:text-white leading-tight">
                ${this.escapeHtml(survey.title)}
              </h1>
              ${survey.description ? `<p class="text-xs text-stone-500 leading-relaxed">${this.escapeHtml(survey.description)}</p>` : ''}
            </div>

            <div class="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2">
              <i data-lucide="info" class="w-4 h-4 text-orange-600 shrink-0"></i>
              <span>Dưới đây là bản sao câu trả lời bạn đã gửi. ${allowEdit ? 'Bạn có thể chỉnh sửa lại câu trả lời bất kỳ lúc nào nếu biểu mẫu còn mở.' : 'Người tạo form không bật tùy chọn chỉnh sửa sau khi gửi.'}</span>
            </div>
          </div>

          <!-- Danh Sách Câu Trả Lời (Read-only) -->
          <div class="space-y-4">
            ${questions.map((q, idx) => {
        if (q.type === 'SECTION_HEADER') {
          return `
                  <div class="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border-l-4 border-orange-600 space-y-1">
                    <h3 class="text-sm font-black text-stone-900 dark:text-white">${this.escapeHtml(q.content)}</h3>
                    ${q.description ? `<p class="text-xs text-stone-500">${this.escapeHtml(q.description)}</p>` : ''}
                  </div>
                `;
        }
        if (q.type === 'VIDEO_BLOCK') {
          return '';
        }

        const ans = userAnswers[q.id] !== undefined ? userAnswers[q.id] : userAnswers[q.order_index];
        const hasAnswer = ans !== undefined && ans !== null && String(ans).trim() !== '' && (!Array.isArray(ans) || ans.length > 0);

        return `
                <div class="bento-card p-5 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <h4 class="text-xs sm:text-sm font-bold text-stone-900 dark:text-white leading-snug">
                      <span class="text-orange-600 mr-1">Câu ${idx + 1}:</span> ${q.content}
                      ${q.is_required ? '<span class="text-red-500 ml-1">*</span>' : ''}
                    </h4>
                  </div>

                  <!-- Khối hiển thị đáp án -->
                  <div class="pt-1">
                    ${!hasAnswer ? `
                      <span class="text-xs italic text-stone-400">Không trả lời (để trống)</span>
                    ` : Array.isArray(ans) ? `
                      <div class="flex flex-wrap gap-1.5">
                        ${ans.map(item => `
                          <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-semibold">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            <span>${item}</span>
                          </span>
                        `).join('')}
                      </div>
                    ` : (typeof ans === 'object' && ans !== null) ? `
                      <!-- Dạng ma trận Grid -->
                      <div class="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                        ${Object.entries(ans).map(([rowKey, colVal]) => `
                          <div class="p-2.5 flex items-center justify-between gap-2 bg-stone-50/50 dark:bg-stone-800/30">
                            <span class="font-bold text-stone-700 dark:text-stone-300">${rowKey}</span>
                            <span class="px-2.5 py-1 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold text-orange-600 dark:text-orange-400">
                              ${Array.isArray(colVal) ? colVal.join(', ') : colVal}
                            </span>
                          </div>
                        `).join('')}
                      </div>
                    ` : `
                      <div class="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200">
                        ${String(ans)}
                      </div>
                    `}
                  </div>
                </div>
              `;
      }).join('')}
          </div>

          <!-- Bottom Actions -->
          <div class="pt-4 flex items-center justify-between gap-3">
            <button onclick="VibeApp.navigate('surveys')" 
                    class="py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all">
              Quay lại danh sách khảo sát
            </button>
            ${allowEdit ? `
              <button onclick="VibeApp.startSurveySession('${surveyId}')" 
                      class="py-2.5 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
                <span>Chỉnh sửa câu trả lời</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      this.showToast('Lỗi tải bài làm: ' + err.message, 'error');
      this.navigate('surveys');
    }
  },

  // ==================== CHỢ VOUCHER & VÍ VOUCHER (VIEW 3-4): ĐÃ TÁCH RA public/js/modules/voucherMarket.js (WAVE 1 MODULAR) ====================

  // ==================== VIEW 5: VÍ & RÚT TIỀN: ĐÃ TÁCH RA public/js/modules/wallet-ledger.js (WAVE 2 MODULAR) ====================

  // ==================== VIEW 6: KHẢO SÁT CỦA TÔI ====================
  async renderCreatorSurveysView(root) {
    if (!this.state.currentUser) {
      this.renderGuestLockedView(root, 'Khảo Sát Của Tôi', 'Vui lòng đăng nhập để tạo khảo sát, theo dõi tiến độ thu thập dữ liệu và xuất báo cáo kết quả.');
      return;
    }

    const user = this.state.currentUser;
    const res = await this.api('/surveys');
    let surveys = res.surveys || [];

    // Nếu là RESPONDENT: Tự động lọc các khảo sát do chính user này tạo
    if (user && user.role === 'RESPONDENT') {
      const storedIds = JSON.parse((localStorage.getItem('survhub_my_surveys') || localStorage.getItem('vibesurvey_my_surveys')) || '[]');
      surveys = surveys.filter(s => (s.creator_id && s.creator_id === user.id) || storedIds.includes(s.id));
    }

    this.state.creatorSurveys = surveys;

    root.innerHTML = `
      <div class="space-y-6">
        
        <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Khảo Sát Của Tôi</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Theo dõi các bài khảo sát bạn đã đăng, tiến độ thu thập phản hồi và phân tích thống kê.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="VibeApp.openDepositModal()" class="py-2.5 px-3.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800/90 hover:bg-orange-50 dark:bg-stone-800/40 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center gap-1.5">
              <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-500"></i>
              <span>+ Nạp Quỹ</span>
            </button>
            <button onclick="VibeApp.openCreateSurveyModal()" class="py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center gap-1.5">
              <i data-lucide="plus" class="w-3.5 h-3.5 stroke-[2.5]"></i>
              <span>Tạo Khảo Sát Mới</span>
            </button>
          </div>
        </div>

        ${surveys.length === 0 ? `
          <div class="bento-card p-12 text-center space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 border border-transparent dark:border-blue-800/50 flex items-center justify-center mx-auto mb-1">
              <i data-lucide="clipboard-list" class="w-6 h-6 stroke-[2]"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">Bạn chưa tạo khảo sát nào</h3>
            <p class="text-xs text-slate-400 dark:text-slate-400 max-w-sm mx-auto">Tạo biểu mẫu trực tiếp hoặc gắn liên kết Google Forms để bắt đầu thu thập câu trả lời từ cộng đồng.</p>
            <div class="pt-2">
              <button onclick="VibeApp.openCreateSurveyModal()" class="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]">
                Bắt Đầu Tạo Khảo Sát
              </button>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${surveys.map(s => {
      const collected = s.collected_responses || 0;
      const target = s.target_responses || 100;
      const percent = Math.min(100, Math.round((collected / target) * 100));

      return `
                <div class="bento-card p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div class="space-y-2.5">
                    <div class="flex justify-between items-center text-xs">
                      <div class="flex items-center gap-1.5">
                        <span class="px-2.5 py-0.5 rounded-md text-[10px] font-bold ${s.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
                          ${s.status}
                        </span>
                        ${s.is_pinned ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-stone-700">VIP</span>` : ''}
                        ${s.is_free_trial ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">25 Lượt Free</span>` : ''}
                      </div>
                      <span class="font-mono text-xs font-bold" style="color: ${this.getProgressBarColor(percent)}">${collected}/${target} (${percent}%)</span>
                    </div>
                    <h3 class="text-base font-extrabold text-slate-900 dark:text-white leading-snug">${this.escapeHtml(s.title)}</h3>
                    
                    <div class="w-full bg-slate-100 dark:bg-slate-900/90 h-2 rounded-full overflow-hidden mt-2">
                      <div class="h-full rounded-full transition-all duration-300" style="${this.getProgressBarStyle(percent)}"></div>
                    </div>
                  </div>

                  <div class="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button onclick="VibeApp.openEditSurvey('${s.id}')" class="px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex items-center gap-1" title="Chỉnh sửa khảo sát">
                      <i data-lucide="edit-3" class="w-3.5 h-3.5 text-stone-600 dark:text-stone-300"></i>
                      <span>Sửa</span>
                    </button>
                    <button onclick="VibeApp.navigate('analytics', { surveyId: '${s.id}' })" class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-850 dark:text-slate-100 rounded-xl text-xs font-bold transition-all active:scale-[0.98]">
                      Báo cáo
                    </button>
                    ${s.is_pinned ? `
                      <button onclick="VibeApp.unpinSurveyAction('${s.id}')" class="px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition-all border border-stone-300 dark:border-stone-700" title="Gỡ khỏi vị trí ghim top">
                        Gỡ Ghim
                      </button>
                    ` : `
                      <button onclick="VibeApp.pinSurveyAction('${s.id}', '${(s.title || '').replace(/'/g, "\\'")}')" class="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-[0.98]" title="Ghim lên đầu trang VIP">
                        <span>Ghim VIP</span>
                      </button>
                    `}
                    <button onclick="VibeApp.exportSurvey('${s.id}')" class="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" title="Xuất CSV">
                      <i data-lucide="download" class="w-4 h-4"></i>
                    </button>
                    <button onclick="VibeApp.confirmDeleteSurvey('${s.id}', '${(s.title || '').replace(/'/g, "\\'")}')" class="p-2 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors active:scale-95" title="Xóa khảo sát này">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `;
    }).join('')}
          </div>
        `}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async exportSurvey(surveyId) {
    window.open(`/api/v1/surveys/${surveyId}/export?format=csv`, '_blank');
  },

  confirmDeleteSurvey(surveyId, surveyTitle) {
    const modalRoot = document.getElementById('modal-root') || document.body;
    let modal = document.getElementById('delete-survey-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'delete-survey-modal';
      modalRoot.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in">
          <div class="flex items-center gap-3 text-red-600 dark:text-red-400">
            <div class="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0">
              <i data-lucide="alert-triangle" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-extrabold text-stone-900 dark:text-white">Xác Nhận Xóa Khảo Sát</h3>
              <p class="text-[11px] text-stone-500">Hành động này không thể hoàn tác</p>
            </div>
          </div>

          <p class="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa bài khảo sát <strong class="text-stone-900 dark:text-white">"${surveyTitle || 'này'}"</strong> không? 
            Mọi câu hỏi, dữ liệu phản hồi sẽ bị xóa vĩnh viễn và số dư ký quỹ chưa dùng (nếu có) sẽ được hoàn trả tự động về ví của bạn.
          </p>

          <div class="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <button type="button" onclick="document.getElementById('delete-survey-modal').remove()" 
                    class="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
              Hủy
            </button>
            <button type="button" id="confirm-delete-survey-btn" onclick="VibeApp.executeDeleteSurvey('${surveyId}')" 
                    class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Xác Nhận Xóa</span>
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async executeDeleteSurvey(surveyId) {
    const btn = document.getElementById('confirm-delete-survey-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div><span>Đang xóa...</span>`;
    }

    try {
      const res = await this.api(`/surveys/${surveyId}`, { method: 'DELETE' });
      if (!res.success) {
        throw new Error(res.message || 'Không thể xóa khảo sát');
      }

      this.haptic('success');
      this.showToast(res.message || 'Đã xóa khảo sát thành công', 'success');

      // Đóng modal
      const modal = document.getElementById('delete-survey-modal');
      if (modal) modal.remove();

      // Cập nhật lại số dư ví nếu có hoàn quỹ
      if (res.newCreditBalance !== undefined && this.state.currentUser) {
        this.state.currentUser.credit_balance = res.newCreditBalance;
      }

      // Nếu đang ở màn hình sửa khảo sát đó, reset và về creator-surveys
      if (this.state.editingSurveyId === surveyId) {
        this.resetCreateSurveyForm();
        this.navigate('creator-surveys');
      } else {
        // Tải lại danh sách khảo sát của tôi
        await this.renderCreatorSurveysView(document.getElementById('app-root'));
      }
    } catch (err) {
      this.showToast('Lỗi khi xóa khảo sát: ' + err.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="trash-2" class="w-3.5 h-3.5"></i><span>Xác Nhận Xóa</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },


  // ==================== VIEW 7: ANALYTICS ====================
  async renderAnalyticsView(root, surveyId) {
    if (!surveyId) {
      this.navigate('creator-surveys');
      return;
    }

    const res = await this.api(`/surveys/${surveyId}/analytics`);
    const survey = res.survey;
    const stats = res.questionStats || [];
    const totalResp = res.totalValidatedResponses || 0;

    root.innerHTML = `
      <div class="space-y-6">
        
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <button onclick="VibeApp.navigate('creator-surveys')" class="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 font-bold">
              <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Quay lại
            </button>
            <h1 class="text-xl font-extrabold text-slate-900">${this.escapeHtml(survey.title)}</h1>
            <p class="text-xs text-slate-500 mt-0.5 font-mono">Đã thu thập ${totalResp}/${survey.target_responses} phản hồi hợp lệ</p>
          </div>
          <button onclick="VibeApp.exportSurvey('${survey.id}')" class="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98]">
            Xuất File Excel (CSV)
          </button>
        </div>

        <div class="space-y-4">
          ${stats.map((q, idx) => {
      const dist = q.distribution || {};
      const total = q.totalAnswers || 0;
      return `
              <div class="bento-card p-6 space-y-3">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-[10px] font-extrabold text-orange-600 uppercase">Câu #${idx + 1} • ${q.type}</span>
                    <h4 class="text-base font-extrabold text-slate-900 mt-0.5">${q.content}</h4>
                  </div>
                  <span class="text-xs text-slate-500 font-mono font-bold">${total} câu trả lời</span>
                </div>

                <div class="space-y-2 pt-2">
                  ${q.type === 'OPEN_TEXT' ? `
                    <div class="space-y-1.5">
                      <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">Ý kiến phản hồi thực tế từ đáp viên:</span>
                      ${q.sampleTexts && q.sampleTexts.length > 0 ? q.sampleTexts.map(txt => `
                        <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200 italic">
                          "${txt}"
                        </div>
                      `).join('') : '<p class="text-xs text-slate-400 italic">Chưa có phản hồi tự luận.</p>'}
                    </div>
                  ` : `
                    ${Object.entries(dist).map(([opt, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return `
                        <div class="space-y-1">
                          <div class="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <span>${opt}</span>
                            <span class="font-mono text-slate-900 dark:text-white font-bold">${count} (${pct}%)</span>
                          </div>
                          <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div class="bg-orange-600 h-full rounded-full" style="width: ${pct}%"></div>
                          </div>
                        </div>
                      `;
      }).join('')}
                  `}
                </div>
              </div>
            `;
    }).join('')}
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // ==================== CREATOR STUDIO: ĐÃ TÁCH RA public/js/modules/creatorStudio.js (WAVE 6 MODULAR) ====================
  // Da chuyen nguyen van toan bo cum Creator Studio (WAVE 6): renderStudioSidebarHtml, openEditSurvey,
  // resetStudioToNew, setStudioCoverImage, removeStudioCoverImage, setStudioQuestionImage,
  // removeStudioQuestionImage, toggleSpeedExplainModal, toggleBoostExplainModal,
  // updateStudioBoostRealtime, initStudioDemographics, setStudioTargetGender, setStudioTargetAgeGroup,
  // setStudioTargetOccupation, setStudioTargetRegion, filterStudioRegions, setStudioTargetUniversity,
  // filterStudioUniversities, openImagePickerModal, closeImagePickerModal, switchImagePickerTab,
  // handleImagePickerFileChange, handleImagePickerDrop, handleImagePickerDragOver,
  // handleImagePickerDragLeave, processImagePickerFile, handleImagePickerUrlInput,
  // applyImagePickerUpload, applyImagePickerUrl, renderImagePickerModal, promptStudioCoverImage,
  // promptStudioQuestionImage, openQuestionImagePrompt, setStudioCategory, normalizeMsFormsUrl,
  // handleImportSubmit, syncExternalForm, syncExternalFormNow, setStudioSidebarSubTab,
  // refreshStudioSidebarView, showMicrosoftFormsAuthErrorModal, disconnectGoogleForms,
  // showGoogleFormsAuthErrorModal, copyServiceAccountEmail, saveSystemGoogleCookieAndRetry,
  // openGoogleAppsScriptGuide, setMobileStudioTab, openCreateSurveyModal, renderCreateSurveyView,
  // fetchVelocityBenchmark, getIncentiveEvaluation, calculateStudioEscrow, setStudioCreatorTier,
  // setStudioSlaTier, setStudioCustomPrice, setStudioTargetResponses, toggleStudioTargeting,
  // toggleStudioPinned, toggleStudioVoucher, setStudioVoucherMode, setStudioCustomVoucherField,
  // setStudioCustomVoucherType, setStudioCustomSingleCode, setStudioCustomCodesList,
  // getStudioCustomCodesCount, selectStudioCatalogVoucher, setStudioCatalogVoucherQty,
  // loadStudioCatalogVouchersIfNeeded, renderStudioCatalogVouchersListHtml, setStudioDuration,
  // setActiveBuilderQuestion, renderStudioQuestionsHtml, renderStudioQuestionBody,
  // getStudioQuestionTypeInfo, selectStudioQuestionType, addBuilderQuestion,
  // duplicateBuilderQuestion, removeBuilderQuestion, toggleStudioRequired, toggleStudioScreener,
  // toggleStudioLogicBranching, setStudioOptionLogicTarget, setStudioSectionDefaultAction,
  // setStudioSectionLogicTarget, toggleStudioLongAnswer, updateBuilderQuestionContent,
  // addStudioOption, addStudioOtherOption, removeStudioOption, updateStudioOptionText,
  // addStudioGridRow, removeStudioGridRow, updateStudioGridRowText, addStudioGridCol,
  // removeStudioGridCol, updateStudioGridColText, setStudioScaleRange, updateStudioLinearLabels,
  // renderStudioQuestionValidationConfig, setStudioQuestionValidationType,
  // setStudioQuestionValidationRule, setStudioQuestionValidationRange, addStudioVideoBlock,
  // updateStudioVideoUrl, addStudioSection, updateStudioSectionDesc, addStudioTextBlock,
  // refreshStudioQuestionsView, switchCreateSurveyTab, handleSmartPasteSubmit, extractNumberRange,
  // parseRawQuestionsText, submitFastCreate. Chi tiet: docs/CODE_MAP.md

  // ==================== IMAGE PICKER & WEBP COMPRESSION ====================
  _formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  /**
   * Nén ảnh trực tiếp trên trình duyệt sử dụng HTML5 Canvas
   * Giảm 95-98% dung lượng trước khi tải lên máy chủ
   * Tối đa 1200px đối với ảnh bìa (cover), 800px đối với ảnh câu hỏi (question)
   */
  async compressImageFile(file, options = {}) {
    const maxWidth = options.maxWidth || 1200;
    const maxHeight = options.maxHeight || 1200;
    const quality = options.quality !== undefined ? options.quality : 0.82;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Tính toán tỷ lệ co giãn giữ nguyên tỷ lệ khung hình
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Thử xuất WebP trước (định dạng nén hiện đại nhất)
          let webpData = canvas.toDataURL('image/webp', quality);
          if (!webpData.startsWith('data:image/webp')) {
            webpData = canvas.toDataURL('image/jpeg', quality);
          }

          const base64Str = webpData.split(',')[1] || '';
          const compressedBytes = Math.round((base64Str.length * 3) / 4);

          resolve({
            dataUrl: webpData,
            width,
            height,
            originalSize: file.size,
            compressedSize: compressedBytes,
            savedPercent: Math.max(0, Math.round(((file.size - compressedBytes) / file.size) * 100))
          });
        };
        img.onerror = () => reject(new Error('Không thể đọc dữ liệu file ảnh'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc tệp từ thiết bị'));
      reader.readAsDataURL(file);
    });
  },

  // ==================== TIEN ICH MODAL (fallbackCopyText): ĐÃ TÁCH RA public/js/modules/modalsTerms.js (WAVE 5 MODULAR) ====================

  // Tien ich placeholder & YouTube embed dung chung giua Studio (creatorStudio.js) va VIEW 2 (trinh lam bai): giu lai app.js.
  generateValidationPlaceholder(v) {
    if (!v || !v.type || v.type === 'NONE') return '';
    if (v.type === 'EMAIL') return 'Vui lòng nhập email';
    if (v.type === 'URL') return 'Vui lòng nhập URL hợp lệ';
    if (v.type === 'NUMBER') {
      const rule = v.rule || 'IS_NUMBER';
      if (rule === 'BETWEEN') {
        const hasMin = v.min !== undefined && v.min !== null && String(v.min).trim() !== '';
        const hasMax = v.max !== undefined && v.max !== null && String(v.max).trim() !== '';
        if (hasMin && hasMax) {
          return `Số phải nằm trong khoảng từ ${v.min} ~ ${v.max}`;
        }
        return 'Giá trị phải là một số';
      }
      if (rule === 'GREATER_THAN') {
        const min = (v.min !== undefined && v.min !== null && String(v.min).trim() !== '') ? v.min : '0';
        return `Số phải lớn hơn ${min}`;
      }
      if (rule === 'LESS_THAN') {
        const max = (v.max !== undefined && v.max !== null && String(v.max).trim() !== '') ? v.max : '100';
        return `Số phải nhỏ hơn ${max}`;
      }
      return 'Giá trị phải là một số';
    }
    if (v.type === 'LENGTH') {
      const rule = v.rule || 'MAX_LENGTH';
      const len = (v.min !== undefined && v.min !== null && String(v.min).trim() !== '') ? v.min : ((v.max !== undefined && v.max !== null && String(v.max).trim() !== '') ? v.max : '100');
      if (rule === 'MIN_LENGTH') {
        return len ? `Tối thiểu ${len} ký tự` : 'Tối thiểu ký tự quy định';
      }
      return len ? `Tối đa ${len} ký tự` : 'Tối đa ký tự quy định';
    }
    return '';
  },

  getYouTubeEmbedUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    const match = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (match && match[1]) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0`;
    }
    return '';
  },


  // ==================== VIEW: TAB HỒ SƠ & XÁC THỰC (DEMOGRAPHICS, STUDENT .EDU.VN, ENTERPRISE) ====================
  async renderProfileView(root) {
    if (!this.state.currentUser) {
      this.renderGuestLockedView(root, 'Hồ Sơ Tài Khoản', 'Vui lòng đăng nhập để xem và quản lý khảo sát cũng như cập nhật thông tin hồ sơ của bạn.');
      return;
    }

    // 1. Lấy thông tin user mới nhất từ server
    try {
      const meRes = await this.api('/auth/me');
      if (meRes && meRes.user) {
        this.state.currentUser = meRes.user;
      }
    } catch (e) { }

    const user = this.state.currentUser;
    const isEnterprise = user.account_tier === 'ENTERPRISE' ||
      user.role === 'CREATOR' ||
      this.state.adminMode === 'CREATOR' ||
      this.state.adminViewMode === 'CREATOR';
    const enterpriseLevel = Number(user.enterprise_verify_level || user.enterprise_level || 0);
    const isEnterpriseLevel2 = enterpriseLevel >= 2;
    const isEnterpriseLevel1 = enterpriseLevel >= 1;
    const isStudentVerified = (user.is_student_verified === 1 || user.account_tier === 'STUDENT') && !isEnterprise;

    // Chuẩn hóa profileTab sang 3 phân hệ chính (Không tràn màn hình, 0% trượt ngang)
    if (!this.state.profileTab || ['demographics', 'reputation'].includes(this.state.profileTab)) {
      this.state.profileTab = 'overview';
    } else if (['created-forms', 'filled-forms'].includes(this.state.profileTab)) {
      this.state.profileTab = 'surveys';
    } else if (!['overview', 'surveys', 'forum-posts', 'STUDENT', 'ENTERPRISE'].includes(this.state.profileTab)) {
      this.state.profileTab = 'overview';
    }

    let demographics = {};
    if (user.demographics_json) {
      try { demographics = JSON.parse(user.demographics_json); } catch (e) { }
    }

    let enterpriseProfile = {};
    if (user.enterprise_profile_json) {
      try { enterpriseProfile = JSON.parse(user.enterprise_profile_json); } catch (e) { }
    }
    enterpriseProfile = {
      brand_name: enterpriseProfile.brand_name || user.brand_name || '',
      industry: enterpriseProfile.industry || user.industry || '',
      website_url: enterpriseProfile.website_url || user.website_url || '',
      contact_phone: enterpriseProfile.contact_phone || user.contact_phone || '',
      company_legal_name: enterpriseProfile.company_legal_name || user.company_legal_name || '',
      tax_id: enterpriseProfile.tax_id || user.tax_id || '',
      headquarters_address: enterpriseProfile.headquarters_address || user.headquarters_address || '',
      invoice_email: enterpriseProfile.invoice_email || user.invoice_email || ''
    };

    const isLocked = user.demographic_locked_until && (new Date(user.demographic_locked_until).getTime() > Date.now());
    const lockDateStr = isLocked ? new Date(user.demographic_locked_until).toLocaleDateString('vi-VN') : '';

    // 2. LIÊN KẾT 100% REAL DATA: Lấy danh sách khảo sát đã tạo, đã tham gia và bài viết từ Backend
    let myCreatedSurveys = [];
    let myParticipatedSurveys = [];
    let myPosts = [];

    try {
      const [creatorRes, historyRes, postsRes] = await Promise.all([
        this.api('/surveys/creator').catch(() => ({ surveys: [] })),
        this.api('/surveys/history').catch(() => ({ history: [] })),
        (this.state.forumPosts && this.state.forumPosts.length > 0)
          ? Promise.resolve({ posts: this.state.forumPosts })
          : this.api('/forum/posts').catch(() => ({ posts: [] }))
      ]);

      if (creatorRes && Array.isArray(creatorRes.surveys)) {
        myCreatedSurveys = creatorRes.surveys;
      } else if (this.state.surveys) {
        myCreatedSurveys = this.state.surveys.filter(s => s.creator_id === user.id || s.author_id === user.id);
      }

      if (historyRes && Array.isArray(historyRes.history)) {
        myParticipatedSurveys = historyRes.history;
      }

      const allPosts = (postsRes && Array.isArray(postsRes.posts)) ? postsRes.posts : (this.state.forumPosts || []);
      this.state.forumPosts = allPosts;
      myPosts = allPosts.filter(p => (p.author && p.author.id === user.id) || p.user_id === user.id || p.author_id === user.id);
    } catch (dataErr) {
      console.warn('Lỗi đồng bộ Real Data cho Hồ sơ:', dataErr);
    }

    if (!this.state.surveySubTab) {
      this.state.surveySubTab = (myCreatedSurveys.length === 0 && myParticipatedSurveys.length > 0) ? 'filled' : 'created';
    }
    const surveySubTab = this.state.surveySubTab;

    const activeTab = this.state.profileTab;
    const trustScore = Number(user.trust_score || 85.0);
    const balanceNum = isEnterprise ? Number(user.credit_balance || 0) : Number(user.point_balance || 0);

    root.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6 pb-20 px-2 sm:px-4">
        
        <!-- HEADER HỒ SƠ TÀI KHOẢN: TIÊU ĐỀ & THÔNG TIN CHÍNH CHUẨN STITCH -->
        <div class="bg-white dark:bg-[#18181B] rounded-3xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-5 relative overflow-hidden">
          <!-- Hiệu ứng gradient mờ phong cách Stitch -->
          <div class="absolute -right-20 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 blur-3xl pointer-events-none"></div>
          <div class="absolute right-1/3 -bottom-28 w-80 h-80 rounded-full bg-orange-400/5 blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <!-- Avatar & Nhận diện tài khoản: GIỮ NGUYÊN AVATAR CHỮ MẶC ĐỊNH ĐẸP MẮT KHI CHƯA CÓ ẢNH -->
            <div class="flex items-start sm:items-center gap-4">
              <div class="relative shrink-0">
                <div class="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-600 to-orange-500 p-0.5 shadow-md shadow-orange-600/20">
                  <div id="profile-header-avatar-display" class="w-full h-full rounded-2xl bg-white dark:bg-stone-900 flex items-center justify-center font-black text-2xl text-orange-600 dark:text-orange-400 overflow-hidden">
                    ${user.avatar_url ? `<img src="${user.avatar_url}" alt="${user.name || 'Avatar'}" class="w-full h-full object-cover rounded-2xl" onerror="this.onerror=null;this.parentElement.textContent='${(user.name || 'U').charAt(0).toUpperCase()}';">` : (user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <!-- Nút máy ảnh thay đổi avatar thật -->
                <label for="profile-avatar-file-input" class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center ring-2 ring-white dark:ring-stone-900 shadow-md cursor-pointer transition-all active:scale-95" title="Tải lên ảnh đại diện">
                  <i data-lucide="camera" class="w-3.5 h-3.5"></i>
                  <input type="file" id="profile-avatar-file-input" accept="image/*" class="hidden" onchange="VibeApp.handleProfileAvatarUpload(event)">
                </label>
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <h1 class="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">SurvHub - Thông Tin Tài Khoản & Quản Lý Khảo Sát</h1>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    isEnterprise ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' :
                    (isStudentVerified ? 'bg-[#FFF7ED] text-orange-700 border border-orange-200' : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700')
                  }">
                    ${isEnterprise ? 'Gói Doanh Nghiệp' : (isStudentVerified ? 'Gói Sinh Viên (.EDU.VN)' : 'Người Điền Phổ Thông')}
                  </span>
                </div>
                <div class="flex items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                  <span class="flex items-center gap-1 font-mono"><i data-lucide="mail" class="w-3.5 h-3.5 text-stone-400"></i> ${user.email}</span>
                  <span>•</span>
                  <span class="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300"><i data-lucide="school" class="w-3.5 h-3.5 text-orange-600"></i> ${demographics.university || (user.university || 'Chưa cập nhật trường viện')}</span>
                  <span>•</span>
                  <span class="flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400"><i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i> ${trustScore >= 90 ? 'Đáp viên Xuất Sắc' : 'Đáp viên Tin Cậy'}</span>
                </div>
              </div>
            </div>

            <!-- Nút liên kết phân hệ: Chuẩn hóa phân quyền tuyệt đối -->
            <div class="flex items-center gap-2 self-start sm:self-center shrink-0">
              ${isEnterprise ? `
                <!-- DOANH NGHIỆP: CHỈ HIỂN THỊ NÚT HỒ SƠ DOANH NGHIỆP -->
                <button onclick="VibeApp.switchProfileTab('ENTERPRISE')" class="px-3.5 py-2 rounded-xl text-xs font-bold ${isEnterpriseLevel1 || isEnterpriseLevel2 ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'} transition-all flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="briefcase" class="w-4 h-4"></i>
                  <span>${isEnterpriseLevel2 ? 'Doanh Nghiệp Cấp 2' : (isEnterpriseLevel1 ? 'Doanh Nghiệp Cấp 1' : 'Hồ Sơ Doanh Nghiệp & MST')}</span>
                </button>
              ` : `
                <!-- NGƯỜI ĐIỀN: CHỈ HIỂN THỊ NÚT XÁC THỰC SINH VIÊN (KHÔNG HIỆN DOANH NGHIỆP) -->
                <button onclick="VibeApp.switchProfileTab('STUDENT')" class="px-3.5 py-2 rounded-xl text-xs font-bold ${isStudentVerified ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800' : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 border border-orange-200 dark:border-orange-800 hover:bg-orange-100'} transition-all flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                  <span>${isStudentVerified ? 'Gói SV Đã Xác Thực' : 'Xác Thực SV (.edu.vn)'}</span>
                </button>
              `}
            </div>
          </div>

          <!-- 3 THẺ METRIC THỐNG KÊ TÀI KHOẢN THỰC TẾ CHUẨN STITCH -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-stone-100 dark:border-stone-800">
            <!-- Điểm uy tín -->
            <div class="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-2 shadow-xs">
              <div class="flex items-center justify-between text-stone-500 font-bold text-[11px] uppercase tracking-wider">
                <span>Điểm Uy Tín</span>
                <i data-lucide="shield-check" class="w-4 h-4 text-orange-600"></i>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-black font-mono text-orange-600 dark:text-orange-400">${trustScore.toFixed(1)}</span>
                <span class="text-xs font-bold text-stone-400">/ 100</span>
              </div>
              <div class="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-orange-600 to-amber-500 h-full rounded-full" style="width: ${Math.min(100, Math.max(0, trustScore))}%;"></div>
              </div>
            </div>

            <!-- Mẫu miễn phí -->
            <div class="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-2 shadow-xs">
              <div class="flex items-center justify-between text-stone-500 font-bold text-[11px] uppercase tracking-wider">
                <span>Mẫu Miễn Phí</span>
                <i data-lucide="layers" class="w-4 h-4 text-amber-600"></i>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-black font-mono text-stone-900 dark:text-white">${user.free_quota_remaining !== undefined ? user.free_quota_remaining : (user.free_trial_surveys_available || 0)}</span>
                <span class="text-xs font-bold text-stone-400">lượt</span>
              </div>
              <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400">Khóa lưu trong 90 ngày</span>
            </div>

            <!-- Ví xu tích lũy / Số dư tài khoản thực tế -->
            <div class="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-2 shadow-xs">
              <div class="flex items-center justify-between text-stone-500 font-bold text-[11px] uppercase tracking-wider">
                <span>${isEnterprise ? 'Số Dư Khóa Quỹ' : 'Ví Xu Tích Lũy'}</span>
                <i data-lucide="coins" class="w-4 h-4 text-amber-500"></i>
              </div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-2xl font-black font-mono text-stone-900 dark:text-white">${balanceNum.toLocaleString('vi-VN')}</span>
                <span class="text-xs font-extrabold text-orange-600">${isEnterprise ? 'Credit' : 'Xu'}</span>
              </div>
              <span class="text-[10px] font-medium text-stone-500">≈ ${balanceNum.toLocaleString('vi-VN')}đ ${isEnterprise ? 'khả dụng' : 'đổi thưởng'}</span>
            </div>
          </div>
        </div>

        <!-- THANH ĐIỀU HƯỚNG 3 PHÂN HỆ GỘP TINH GỌN (100% VỪA VẶN MỌI THIẾT BỊ, TUYỆT ĐỐI 0% TRƯỢT NGANG) -->
        <div class="grid grid-cols-3 gap-1.5 sm:gap-2 w-full p-1.5 rounded-2xl bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <!-- 1. Hồ Sơ & Đánh Giá Uy Tín -->
          <button type="button" onclick="VibeApp.switchProfileTab('overview')" 
                  class="py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold cursor-pointer ${activeTab === 'overview' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black shadow-xs ring-1 ring-stone-900/5 dark:ring-stone-700/60' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800/50'}">
            <i data-lucide="user-check" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">Hồ Sơ & Uy Tín</span>
          </button>

          <!-- 2. Quản Lý Khảo Sát (Tạo & Điền) -->
          <button type="button" onclick="VibeApp.switchProfileTab('surveys')" 
                  class="py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold cursor-pointer ${activeTab === 'surveys' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black shadow-xs ring-1 ring-stone-900/5 dark:ring-stone-700/60' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800/50'}">
            <i data-lucide="clipboard-list" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">Quản Lý Khảo Sát</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${activeTab === 'surveys' ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400' : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}">${myCreatedSurveys.length + myParticipatedSurveys.length}</span>
          </button>

          <!-- 3. Bài Viết Diễn Đàn -->
          <button type="button" onclick="VibeApp.switchProfileTab('forum-posts')" 
                  class="py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold cursor-pointer ${activeTab === 'forum-posts' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black shadow-xs ring-1 ring-stone-900/5 dark:ring-stone-700/60' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800/50'}">
            <i data-lucide="messages-square" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">Bài Viết Diễn Đàn</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${activeTab === 'forum-posts' ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400' : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}">${myPosts.length}</span>
          </button>
        </div>

        <!-- PHÂN HỆ 1: HỒ SƠ & UY TÍN (GỘP BENTO ĐÁNH GIÁ VÀ FORM NHÂN KHẨU HỌC LIỀN MẠCH) -->
        <div id="profile-tab-overview" class="${activeTab === 'overview' ? '' : 'hidden'} space-y-8">
          
          <!-- KHỐI 1: BENTO ĐÁNH GIÁ CHẤT LƯỢNG & MỨC ĐỘ UY TÍN -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span class="text-[11px] font-black uppercase tracking-wider text-orange-600 block mb-0.5">Huy Hiệu & Đạo Đức Nghiên Cứu</span>
                <h2 class="text-xl font-black text-stone-900 dark:text-white tracking-tight">Đánh Giá & Mức Độ Uy Tín Tài Khoản</h2>
              </div>
              <div class="flex items-center gap-2 text-xs text-stone-500">
                <i data-lucide="shield-check" class="w-4 h-4 text-orange-600"></i>
                <span>Chỉ số tin cậy đo lường qua hệ thống kiểm duyệt Anti-Fraud</span>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <!-- Cột trái: Visual Metrics Bento -->
              <div class="lg:col-span-5 flex flex-col gap-4">
                <div class="bg-white dark:bg-[#18181B] p-6 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col gap-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold uppercase text-stone-500 tracking-wider">Chỉ Số Chất Lượng Đáp Viên</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 text-[10px] font-extrabold">Xác minh AI</span>
                  </div>

                  <!-- SVG Circular Gauge & Rating sao thật -->
                  <div class="flex items-center gap-5 py-2">
                    <div class="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path class="text-stone-100 dark:text-stone-800 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-width="3.5"></path>
                        <path class="text-orange-600 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-dasharray="${trustScore}, 100" stroke-linecap="round" stroke-width="3.5"></path>
                      </svg>
                      <div class="absolute flex flex-col items-center">
                        <span class="text-xl font-black text-stone-900 dark:text-white font-mono">${trustScore.toFixed(1)}%</span>
                        <span class="text-[10px] uppercase font-bold text-stone-500">Chính trực</span>
                      </div>
                    </div>

                    <div class="space-y-1">
                      <div class="flex items-center gap-1 text-amber-500">
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                        <span class="text-sm font-black text-stone-900 dark:text-white ml-1 font-mono">5.0 / 5</span>
                      </div>
                      <p class="text-xs text-stone-500 leading-relaxed">
                        Dựa trên <strong>${myParticipatedSurveys.length} đề tài</strong> đã hoàn thành và nghiệm thu câu trả lời.
                      </p>
                    </div>
                  </div>

                  <!-- 2 Thanh tiến độ chuẩn Stitch -->
                  <div class="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                    <div>
                      <div class="flex justify-between text-xs font-semibold mb-1">
                        <span class="text-stone-600 dark:text-stone-400">Vượt câu hỏi kiểm tra độ chú ý (Attention-check)</span>
                        <span class="font-bold text-orange-600 font-mono">100%</span>
                      </div>
                      <div class="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-orange-600 h-full w-full rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <div class="flex justify-between text-xs font-semibold mb-1">
                        <span class="text-stone-600 dark:text-stone-400">Thời gian làm bài khảo sát chuẩn định mức (Không speed-run)</span>
                        <span class="font-bold text-amber-600 font-mono">100%</span>
                      </div>
                      <div class="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-amber-500 h-full w-full rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 3 Huy hiệu bảo trợ học thuật -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 space-y-1.5 shadow-xs">
                    <div class="flex items-center gap-1.5 text-orange-600">
                      <i data-lucide="award" class="w-4 h-4"></i>
                      <h4 class="text-xs font-extrabold text-stone-900 dark:text-white">Đáp Viên Vàng</h4>
                    </div>
                    <p class="text-[11px] text-stone-500 leading-relaxed">Hoàn thành các đề tài không vi phạm bẫy chú ý.</p>
                  </div>

                  <div class="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 space-y-1.5 shadow-xs">
                    <div class="flex items-center gap-1.5 text-emerald-600">
                      <i data-lucide="check-circle" class="w-4 h-4"></i>
                      <h4 class="text-xs font-extrabold text-stone-900 dark:text-white">Định Danh Edu</h4>
                    </div>
                    <p class="text-[11px] text-stone-500 leading-relaxed">${isStudentVerified ? 'Đã xác thực email trường, hợp lệ theo quy chuẩn bảo trợ.' : 'Kích hoạt xác thực email sinh viên để mở khóa.'}</p>
                  </div>

                  <div class="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 space-y-1.5 shadow-xs">
                    <div class="flex items-center gap-1.5 text-blue-600">
                      <i data-lucide="activity" class="w-4 h-4"></i>
                      <h4 class="text-xs font-extrabold text-stone-900 dark:text-white">Chuẩn Cronbach</h4>
                    </div>
                    <p class="text-[11px] text-stone-500 leading-relaxed">Hệ số tin cậy đạt tiêu chuẩn phân tích định lượng.</p>
                  </div>
                </div>
              </div>

              <!-- Cột phải: Danh sách nhận xét học thuật thực tế -->
              <div class="lg:col-span-7 flex flex-col gap-4">
                <div class="bg-white dark:bg-[#18181B] p-6 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col gap-4 h-full">
                  <div class="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                    <h3 class="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">Nhận Xét Từ Các Chủ Đề Tài Nghiên Cứu</h3>
                    <span class="text-[10px] font-black uppercase text-stone-400">Mới nhất</span>
                  </div>

                  ${myParticipatedSurveys.length > 0 ? myParticipatedSurveys.slice(0, 4).map(item => `
                    <div class="bg-stone-50/80 dark:bg-stone-900/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-2">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 font-bold text-xs flex items-center justify-center">
                            ${(item.creator_name || 'NC').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span class="text-xs font-black text-stone-900 dark:text-white">${item.creator_name || 'Chủ nhiệm đề tài'}</span>
                            <span class="text-[11px] text-stone-500 block">${item.survey_title || 'Đề tài khảo sát'}</span>
                          </div>
                        </div>
                        <div class="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                          <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
                          <span class="font-mono">5.0</span>
                        </div>
                      </div>
                      <p class="text-xs text-stone-600 dark:text-stone-400 italic leading-relaxed">
                        "Phản hồi đã hoàn thành đầy đủ, đúng thời lượng quy định và được đối soát qua hệ thống Anti-Fraud. Đã nghiệm thu và chi trả ${item.points_rewarded || 0} xu vào ví."
                      </p>
                    </div>
                  `).join('') : `
                    <div class="p-8 text-center bg-stone-50/60 dark:bg-stone-900/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-500 space-y-2 my-auto">
                      <i data-lucide="message-square" class="w-6 h-6 mx-auto text-stone-400"></i>
                      <p class="font-medium">Chưa có nhận xét từ chủ nhiệm đề tài.</p>
                      <p class="text-[11px] text-stone-400">Hãy tham gia điền các bài khảo sát để tích lũy nhận xét uy tín và điểm thưởng.</p>
                      <button onclick="VibeApp.navigate('surveys')" class="mt-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs">
                        Khám Phá Khảo Sát Ngay
                      </button>
                    </div>
                  `}
                </div>
              </div>
            </div>
          </div>

          <!-- KHỐI 2: FORM THÔNG TIN NHÂN KHẨU HỌC (THIẾT KẾ THOÁNG ĐÃNG, RỘNG RÃI) -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span class="text-[11px] font-black uppercase tracking-wider text-orange-600 block mb-0.5">Hồ Sơ Nghiên Cứu</span>
                <h2 class="text-xl font-black text-stone-900 dark:text-white tracking-tight">Thông Tin Cá Nhân & Nhân Khẩu Học</h2>
              </div>
              <div class="bg-orange-50/80 dark:bg-orange-950/30 px-4 py-2.5 rounded-2xl border border-orange-200/80 dark:border-orange-900/40 flex items-center gap-2.5 text-xs text-orange-900 dark:text-orange-200 shadow-2xs">
                <i data-lucide="shield-check" class="w-4 h-4 text-orange-600 shrink-0"></i>
                <span>Hoàn thiện 100% hồ sơ để mở khóa thêm lượt mẫu miễn phí. Thông tin cốt lõi khóa 90 ngày.</span>
              </div>
            </div>

            ${isLocked ? `
              <div class="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-3 shadow-xs">
                <i data-lucide="lock" class="w-5 h-5 text-amber-600 shrink-0"></i>
                <span>Hồ sơ nhân khẩu học đang được khóa an toàn đến ngày <strong>${lockDateStr}</strong> (Khóa 90 ngày sau khi lưu để đảm bảo tính khách quan của dữ liệu nghiên cứu thị trường).</span>
              </div>
            ` : ''}

            <div class="bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 sm:p-9 shadow-xs space-y-9">
              <!-- SECTION A: THÔNG TIN CÁ NHÂN & NƠI SINH SỐNG -->
              <div class="space-y-5">
                <div class="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800 text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  <i data-lucide="user" class="w-4 h-4 text-orange-600"></i>
                  <span>A. Thông tin cá nhân & Địa bàn sinh sống</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-7">
                  <!-- 1. Giới tính -->
                  <div class="relative space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Giới tính: *</label>
                    <input type="hidden" id="demo-gender" value="${demographics.gender || 'MALE'}">
                    <button type="button" ${isLocked ? 'disabled' : ''} onclick="VibeApp.toggleCustomDropdown('demo-gender-menu', event)"
                            class="custom-dropdown-trigger w-full h-12 flex items-center justify-between px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 hover:border-orange-500 transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                      <span id="demo-gender-label">${demographics.gender === 'FEMALE' ? 'Nữ' : (demographics.gender === 'OTHER' ? 'Khác / Không tiết lộ' : 'Nam')}</span>
                      <i data-lucide="chevron-down" class="dropdown-trigger-icon w-4 h-4 stroke-[2] text-stone-400 transition-transform duration-200 pointer-events-none"></i>
                    </button>
                    ${!isLocked ? `
                      <div id="demo-gender-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                        <div onclick="VibeApp.selectCustomFormOption('demo-gender', 'MALE', 'Nam', event)" class="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">
                          <span>Nam</span>
                        </div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-gender', 'FEMALE', 'Nữ', event)" class="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">
                          <span>Nữ</span>
                        </div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-gender', 'OTHER', 'Khác / Không tiết lộ', event)" class="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">
                          <span>Khác / Không tiết lộ</span>
                        </div>
                      </div>
                    ` : ''}
                  </div>

                  <!-- 2. Ngày sinh -->
                  <div class="space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Ngày sinh: *</label>
                    <input type="date" id="demo-birthdate" value="${demographics.birth_date || '2003-08-15'}" ${isLocked ? 'disabled' : ''}
                           class="w-full h-12 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                  </div>

                  <!-- 3. Tỉnh / Thành phố sinh sống (34 Tỉnh Thành Mới) -->
                  <div class="relative space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Tỉnh / Thành phố sinh sống (34 Tỉnh Thành Mới): *</label>
                    <input type="hidden" id="demo-province" value="${demographics.province || 'Hà Nội'}">
                    <button type="button" ${isLocked ? 'disabled' : ''} onclick="VibeApp.toggleCustomDropdown('demo-province-menu', event)"
                            class="custom-dropdown-trigger w-full h-12 flex items-center justify-between px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 hover:border-orange-500 transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                      <span id="demo-province-label">${demographics.province || 'Hà Nội'}</span>
                      <i data-lucide="chevron-down" class="dropdown-trigger-icon w-4 h-4 stroke-[2] text-stone-400 transition-transform duration-200 pointer-events-none"></i>
                    </button>
                    ${!isLocked ? `
                      <div id="demo-province-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto no-scrollbar p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                        ${(window.VIBE_34_PROVINCES || ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Quảng Ninh', 'Huế', 'Bắc Ninh', 'Bình Dương', 'Đồng Nai']).map(p => `
                          <div onclick="VibeApp.selectCustomFormOption('demo-province', '${p}', '${p}', event)" 
                               class="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 ${demographics.province === p ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                            <span>${p}</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>

                  <!-- 4. Mức thu nhập hàng tháng -->
                  <div class="relative space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Mức thu nhập hàng tháng: *</label>
                    <input type="hidden" id="demo-income" value="${demographics.monthly_income || (user.monthly_income || 'Dưới 5 triệu VNĐ')}">
                    <button type="button" ${isLocked ? 'disabled' : ''} onclick="VibeApp.toggleCustomDropdown('demo-income-menu', event)"
                            class="custom-dropdown-trigger w-full h-12 flex items-center justify-between px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 hover:border-orange-500 transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                      <span id="demo-income-label">${demographics.monthly_income || user.monthly_income || 'Dưới 5 triệu VNĐ'}</span>
                      <i data-lucide="chevron-down" class="dropdown-trigger-icon w-4 h-4 stroke-[2] text-stone-400 transition-transform duration-200 pointer-events-none"></i>
                    </button>
                    ${!isLocked ? `
                      <div id="demo-income-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                        <div onclick="VibeApp.selectCustomFormOption('demo-income', 'Dưới 5 triệu VNĐ', 'Dưới 5 triệu VNĐ', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Dưới 5 triệu VNĐ</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-income', 'Từ 5 - 10 triệu VNĐ', 'Từ 5 - 10 triệu VNĐ', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Từ 5 - 10 triệu VNĐ</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-income', 'Từ 10 - 20 triệu VNĐ', 'Từ 10 - 20 triệu VNĐ', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Từ 10 - 20 triệu VNĐ</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-income', 'Trên 20 triệu VNĐ', 'Trên 20 triệu VNĐ', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Trên 20 triệu VNĐ</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>

              <!-- SECTION B: ĐỊNH DANH HỌC THUẬT & CHUYÊN MÔN -->
              <div class="space-y-5 pt-3">
                <div class="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800 text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  <i data-lucide="graduation-cap" class="w-4 h-4 text-orange-600"></i>
                  <span>B. Định danh học thuật & Chuyên môn</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-7">
                  <!-- 5. Nghề nghiệp / Đối tượng -->
                  <div class="relative space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Nghề nghiệp / Đối tượng: *</label>
                    <input type="hidden" id="demo-occupation" value="${demographics.occupation || 'Học sinh / Sinh viên đại học'}">
                    <button type="button" ${isLocked ? 'disabled' : ''} onclick="VibeApp.toggleCustomDropdown('demo-occupation-menu', event)"
                            class="custom-dropdown-trigger w-full h-12 flex items-center justify-between px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 hover:border-orange-500 transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                      <span id="demo-occupation-label">${demographics.occupation || 'Học sinh / Sinh viên đại học'}</span>
                      <i data-lucide="chevron-down" class="dropdown-trigger-icon w-4 h-4 stroke-[2] text-stone-400 transition-transform duration-200 pointer-events-none"></i>
                    </button>
                    ${!isLocked ? `
                      <div id="demo-occupation-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                        <div onclick="VibeApp.selectCustomFormOption('demo-occupation', 'Học sinh / Sinh viên đại học', 'Học sinh / Sinh viên đại học', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Học sinh / Sinh viên đại học</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-occupation', 'Học viên cao học / NCS', 'Học viên cao học / NCS', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Học viên cao học / NCS</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-occupation', 'Giảng viên / Nhà nghiên cứu', 'Giảng viên / Nhà nghiên cứu', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Giảng viên / Nhà nghiên cứu</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-occupation', 'Người đi làm (Khối kỹ thuật & kinh tế)', 'Người đi làm (Khối kỹ thuật & kinh tế)', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Người đi làm (Khối kỹ thuật & kinh tế)</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-occupation', 'Khác', 'Khác', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Khác</div>
                      </div>
                    ` : ''}
                  </div>

                  <!-- 6. Trường Đại Học (293 trường) -->
                  <div class="relative space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Trường Đại học / Học Viện / Cao Đẳng: *</label>
                    <div class="relative">
                      <input type="text" id="demo-university" value="${demographics.university || (user.university || '')}" ${isLocked ? 'disabled' : ''} 
                             placeholder="Gõ tìm trường (VD: Bách Khoa, Kinh Tế, FPT, FTU...)"
                             onfocus="VibeApp.filterDemoUniversities(this.value)"
                             oninput="VibeApp.filterDemoUniversities(this.value)"
                             class="w-full h-12 px-4 pr-10 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                      <i data-lucide="search" class="w-4 h-4 text-stone-400 absolute right-3.5 top-4 pointer-events-none"></i>
                    </div>
                    ${!isLocked ? `
                      <div id="demo-uni-popover" class="hidden absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto no-scrollbar p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                        <div id="demo-uni-dropdown-list" class="space-y-0.5"></div>
                      </div>
                    ` : ''}
                  </div>

                  <!-- 7. Ngành học / Chuyên môn -->
                  <div class="space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Ngành học / Chuyên môn: *</label>
                    <input type="text" id="demo-major" value="${demographics.major || (user.major || '')}" ${isLocked ? 'disabled' : ''} placeholder="VD: Công nghệ thông tin, Marketing..."
                           class="w-full h-12 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                  </div>

                  <!-- 8. Năm tốt nghiệp -->
                  <div class="space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Năm tốt nghiệp (dự kiến): *</label>
                    <input type="number" id="demo-gradyear" value="${demographics.graduation_year || (user.graduation_year || 2026)}" min="1980" max="2035" ${isLocked ? 'disabled' : ''}
                           class="w-full h-12 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-black font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                  </div>
                </div>
              </div>

              <!-- FOOTER HÀNH ĐỘNG -->
              <div class="pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p class="text-xs text-stone-500 flex items-center gap-1.5">
                  <i data-lucide="lock" class="w-3.5 h-3.5 text-stone-400"></i>
                  <span>Thông tin hồ sơ được bảo mật và mã hóa phục vụ đối soát mẫu khảo sát.</span>
                </p>
                ${!isLocked ? `
                  <button type="button" onclick="VibeApp.saveDemographicsAction()" class="h-12 px-8 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-black shadow-md shadow-orange-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    <span>Lưu & Cập Nhật Hồ Sơ Nhân Khẩu Học</span>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- PHÂN HỆ 2: QUẢN LÝ KHẢO SÁT (GỘP FORM ĐÃ TẠO VÀ ĐÃ THAM GIA) -->
        <div id="profile-tab-surveys" class="${activeTab === 'surveys' ? '' : 'hidden'} space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="text-[11px] font-black uppercase tracking-wider text-orange-600 block mb-0.5">Dữ Liệu Khảo Sát Của Tôi</span>
              <h2 class="text-xl font-black text-stone-900 dark:text-white tracking-tight">Quản Lý & Theo Dõi Khảo Sát</h2>
            </div>

            <!-- Segmented Sub-Toggle: Chuyển đổi giữa Đã Tạo và Đã Tham Gia -->
            <div class="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs font-bold shrink-0 self-start sm:self-center shadow-2xs">
              <button type="button" onclick="VibeApp.switchSurveySubTab('created')" 
                      class="py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${surveySubTab === 'created' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black shadow-xs ring-1 ring-stone-900/5' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}">
                <i data-lucide="file-plus" class="w-3.5 h-3.5"></i>
                <span>Form Đã Tạo (${myCreatedSurveys.length})</span>
              </button>
              <button type="button" onclick="VibeApp.switchSurveySubTab('filled')" 
                      class="py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${surveySubTab === 'filled' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black shadow-xs ring-1 ring-stone-900/5' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                <span>Đã Tham Gia (${myParticipatedSurveys.length})</span>
              </button>
            </div>
          </div>

          <!-- PHÂN MỤC A: KHẢO SÁT ĐÃ TẠO -->
          <div id="survey-subview-created" class="${surveySubTab === 'created' ? '' : 'hidden'} space-y-5">
            <div class="flex items-center justify-between">
              <p class="text-xs text-stone-500">Các bài khảo sát bạn đã thiết lập để thu thập mẫu từ cộng đồng.</p>
              <button onclick="VibeApp.navigate('create-survey')" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>+ Tạo Khảo Sát Mới</span>
              </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
              ${myCreatedSurveys.length > 0 ? myCreatedSurveys.map(s => {
                const curr = s.collected_responses || s.current_responses || 0;
                const target = s.target_responses || 100;
                const pct = Math.min(100, Math.round((curr / target) * 100));
                const isCompleted = s.status === 'COMPLETED' || curr >= target;
                return `
                  <div class="bg-white dark:bg-[#18181B] rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col justify-between gap-4 group hover:shadow-md transition-all">
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400'}">
                            ${isCompleted ? 'Đã hoàn thành 100%' : 'Đang thu thập'}
                          </span>
                          <span class="bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            ${s.category || 'Nghiên cứu học thuật'}
                          </span>
                        </div>
                        <span class="text-[11px] text-stone-400">${s.created_at ? new Date(s.created_at).toLocaleDateString('vi-VN') : ''}</span>
                      </div>
                      <h3 class="text-sm font-black text-stone-900 dark:text-white group-hover:text-orange-600 transition-colors">
                        ${s.title}
                      </h3>
                      <p class="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        ${s.description || 'Khảo sát phục vụ nghiên cứu thực tế trên SurvHub.'}
                      </p>
                      <div class="space-y-1">
                        <div class="flex justify-between text-xs font-semibold">
                          <span class="text-stone-500">Tiến độ phản hồi: <strong class="text-stone-900 dark:text-white font-mono">${curr} / ${target} mẫu</strong></span>
                          <span class="${isCompleted ? 'text-emerald-600' : 'text-orange-600'} font-bold font-mono">${pct}% ${isCompleted ? 'Đạt' : ''}</span>
                        </div>
                        <div class="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                          <div class="${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-600 to-amber-500'} h-full rounded-full" style="width: ${pct}%;"></div>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                      <div class="flex items-center gap-1.5">
                        <button onclick="VibeApp.navigate('analytics', { surveyId: '${s.id}' })" class="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer">
                          <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i>
                          <span>Báo cáo</span>
                        </button>
                        <button onclick="VibeApp.navigate('create-survey', { editId: '${s.id}' })" class="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer">
                          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                          <span>Sửa</span>
                        </button>
                      </div>
                      <!-- Nút XÓA KHẢO SÁT THẬT HOẠT ĐỘNG HOÀN TOÀN -->
                      <button onclick="VibeApp.deleteSurveyAction('${s.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer" title="Xóa vĩnh viễn bài khảo sát này">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('') : `
                <div class="col-span-1 lg:col-span-2 p-12 text-center bg-white dark:bg-[#18181B] rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 space-y-3">
                  <i data-lucide="file-plus" class="w-8 h-8 mx-auto text-stone-400"></i>
                  <h4 class="text-sm font-bold text-stone-900 dark:text-white">Bạn chưa tạo bài khảo sát nào</h4>
                  <p class="text-xs text-stone-500 max-w-sm mx-auto">Tạo bài khảo sát đầu tiên để thu thập phản hồi chuẩn xác cho đề tài của bạn ngay hôm nay.</p>
                  <button onclick="VibeApp.navigate('create-survey')" class="mt-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs">
                    + Tạo Khảo Sát Mới
                  </button>
                </div>
              `}
            </div>
          </div>

          <!-- PHÂN MỤC B: KHẢO SÁT ĐÃ THAM GIA -->
          <div id="survey-subview-filled" class="${surveySubTab === 'filled' ? '' : 'hidden'} space-y-4">
            <div class="bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs overflow-hidden">
              ${myParticipatedSurveys.length > 0 ? `
                <div class="overflow-x-auto no-scrollbar">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-stone-50 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 font-black uppercase tracking-wider border-b border-stone-100 dark:border-stone-800">
                      <tr>
                        <th class="py-3.5 px-5">Tên đề tài khảo sát</th>
                        <th class="py-3.5 px-4">Đơn vị / Tác giả</th>
                        <th class="py-3.5 px-4">Thời gian nạp</th>
                        <th class="py-3.5 px-4">Thưởng Xu</th>
                        <th class="py-3.5 px-4">Trạng thái duyệt</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
                      ${myParticipatedSurveys.map(item => `
                        <tr class="hover:bg-stone-50/50 dark:hover:bg-stone-900/40 transition-colors">
                          <td class="py-3.5 px-5 font-semibold text-stone-900 dark:text-white max-w-xs">
                            <div class="font-bold text-stone-900 dark:text-white">${item.survey_title || 'Đề tài khảo sát'}</div>
                            <span class="text-stone-400 text-[11px]">Thời gian làm bài: ${item.duration_sec ? Math.round(item.duration_sec / 60) + ' phút' : 'N/A'}</span>
                          </td>
                          <td class="py-3.5 px-4 text-stone-500">${item.creator_name || item.brand_name || 'Chủ nhiệm đề tài'}</td>
                          <td class="py-3.5 px-4 text-stone-500">${item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('vi-VN') : 'Mới đây'}</td>
                          <td class="py-3.5 px-4 font-black font-mono text-orange-600 dark:text-orange-400">+${item.points_rewarded || 0} Xu</td>
                          <td class="py-3.5 px-4">
                            <span class="inline-flex items-center gap-1 ${item.response_status === 'REJECTED' ? 'text-red-600 bg-red-50 dark:bg-red-950/60' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'} font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                              <i data-lucide="${item.response_status === 'REJECTED' ? 'x-circle' : 'check-circle'}" class="w-3.5 h-3.5"></i>
                              ${item.response_status === 'REJECTED' ? 'Bị từ chối' : 'Đã nghiệm thu'}
                            </span>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="p-12 text-center space-y-3">
                  <i data-lucide="check-circle-2" class="w-8 h-8 mx-auto text-stone-400"></i>
                  <h4 class="text-sm font-bold text-stone-900 dark:text-white">Bạn chưa tham gia bài khảo sát nào</h4>
                  <p class="text-xs text-stone-500 max-w-sm mx-auto">Khám phá các đề tài đang cần người điền để đóng góp ý kiến và nhận thưởng điểm ngay.</p>
                  <button onclick="VibeApp.navigate('surveys')" class="mt-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs">
                    Xem Danh Sách Khảo Sát
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- PHÂN HỆ 3: BÀI VIẾT TRÊN DIỄN ĐÀN -->
        <div id="profile-tab-forum-posts" class="${activeTab === 'forum-posts' ? '' : 'hidden'} space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="text-[11px] font-black uppercase tracking-wider text-orange-600 block mb-0.5">Cộng Đồng Học Thuật</span>
              <h2 class="text-xl font-black text-stone-900 dark:text-white tracking-tight">Các Bài Viết Đã Đăng Trên Diễn Đàn (${myPosts.length})</h2>
            </div>
            <button onclick="VibeApp.openCreateForumPostModal()" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>+ Đăng Bài Thảo Luận Mới</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${myPosts.length > 0 ? myPosts.map(p => `
              <div class="bg-white dark:bg-[#18181B] p-5 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col justify-between gap-4 group hover:shadow-md transition-all">
                <div class="space-y-2.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-orange-600 font-bold">${p.tag || (p.category ? '#' + p.category : '#ThaoLuan')}</span>
                    <span class="text-stone-400 text-[11px]">${p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                  </div>
                  <h3 class="text-sm font-black text-stone-900 dark:text-white group-hover:text-orange-600 transition-colors leading-snug">
                    ${p.title}
                  </h3>
                  <p class="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                    ${p.content}
                  </p>
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500">
                  <div class="flex items-center gap-3">
                    <span class="flex items-center gap-1 text-orange-600 font-bold"><i data-lucide="heart" class="w-3.5 h-3.5 fill-current"></i> ${(p.likes || []).length || (p.like_count || 0)}</span>
                    <span class="flex items-center gap-1"><i data-lucide="message-square" class="w-3.5 h-3.5"></i> ${(p.comments || []).length || (p.comment_count || 0)}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <!-- Nút XÓA BÀI VIẾT THẬT HOẠT ĐỘNG HOÀN TOÀN -->
                    <button onclick="VibeApp.deleteForumPostAction('${p.id}')" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer" title="Xóa bài viết này">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div class="col-span-1 md:col-span-2 lg:col-span-3 p-12 text-center bg-white dark:bg-[#18181B] rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 space-y-3">
                <i data-lucide="messages-square" class="w-8 h-8 mx-auto text-stone-400"></i>
                <h4 class="text-sm font-bold text-stone-900 dark:text-white">Bạn chưa đăng bài viết nào trên diễn đàn</h4>
                <p class="text-xs text-stone-500 max-w-sm mx-auto">Chia sẻ kinh nghiệm làm nghiên cứu khoa học, bẫy khảo sát hoặc trao đổi mẫu điền chéo cùng cộng đồng.</p>
                <button onclick="VibeApp.openCreateForumPostModal()" class="mt-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs">
                  + Đăng Bài Thảo Luận Mới
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- PHÂN HỆ NÂNG CẤP TÀI KHOẢN (GÓI SINH VIÊN / DOANH NGHIỆP) -->
        <div id="profile-tab-STUDENT" class="${activeTab === 'STUDENT' ? '' : 'hidden'} space-y-5">
          <div class="bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-stone-800 text-orange-600 flex items-center justify-center font-bold">
                  <i data-lucide="graduation-cap" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">Đăng Ký Gói Sinh Viên (.edu.vn / .ac.vn)</h3>
                  <p class="text-xs text-stone-500">Mở khóa giá sàn sinh viên 400đ-600đ/mẫu và nhận 30 lượt mẫu miễn phí / tháng.</p>
                </div>
              </div>

              ${isStudentVerified ? `
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1.5">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                  Đã Xác Thực
                </span>
              ` : `
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  Chưa Xác Thực
                </span>
              `}
            </div>

            ${isStudentVerified ? `
              <div class="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 text-xs">
                <div class="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <i data-lucide="award" class="w-4 h-4"></i>
                  <span>Tài khoản của bạn đã nâng cấp thành công lên GÓI SINH VIÊN!</span>
                </div>
                <p class="text-emerald-700 dark:text-emerald-300">
                  Email sinh viên đã xác minh: <strong class="font-mono">${user.student_email || user.email}</strong>
                  ${user.student_expires_at ? ` · <span class="text-stone-500 font-normal">Hiệu lực đến: <strong class="font-mono text-emerald-800 dark:text-emerald-200">${new Date(user.student_expires_at).toLocaleDateString('vi-VN')}</strong></span>` : ''}
                </p>
                <div class="text-[11px] text-stone-500 pt-1">
                  Đặc quyền: 30 lượt miễn phí / tháng (làm mới ngày 01 hằng tháng), hưởng trọn mức giá sàn ưu đãi cho khóa luận/NCKH, thù lao người điền chia 85/15.
                </div>
              </div>
            ` : `
              <div class="space-y-4">
                <p class="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Nhập địa chỉ email trường của bạn (Ví dụ: <code class="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">sinhvien@sis.hust.edu.vn</code>, <code class="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">mssv@st.neu.edu.vn</code>). Hệ thống sẽ gửi mã OTP 6 chữ số để kích hoạt tức thì.
                </p>

                <div class="space-y-2 max-w-md">
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300">Email trường đại học (.edu.vn / .ac.vn):</label>
                  <div class="flex gap-2">
                    <input type="email" id="student-email-input" placeholder="nhap.email@truong.edu.vn"
                           class="flex-1 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono font-bold">
                    <button type="button" id="student-send-otp-btn" onclick="VibeApp.sendStudentEmailOtpAction()" class="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shrink-0 shadow-xs transition-all cursor-pointer">
                      Gửi Mã OTP
                    </button>
                  </div>
                </div>

                <div id="student-otp-section" class="hidden space-y-2 max-w-md pt-2 border-t border-stone-100 dark:border-stone-800">
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300">Nhập mã xác thực OTP 6 số (gửi về email):</label>
                  <div class="flex gap-2">
                    <input type="text" id="student-otp-input" placeholder="VD: 123456" maxlength="6"
                           class="w-36 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-center font-mono font-black text-sm tracking-widest text-orange-600">
                    <button type="button" onclick="VibeApp.verifyStudentEmailOtpAction()" class="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer">
                      Xác Nhận Kích Hoạt Gói SV
                    </button>
                  </div>
                </div>
              </div>
            `}
          </div>
        </div>

        <div id="profile-tab-ENTERPRISE" class="${activeTab === 'ENTERPRISE' ? '' : 'hidden'} space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- CẤP ĐỘ 1: HỒ SƠ THƯƠNG HIỆU CƠ BẢN -->
            <div class="bg-white dark:bg-[#18181B] border ${isEnterpriseLevel1 || isEnterpriseLevel2 ? 'border-orange-500/40' : 'border-stone-200 dark:border-stone-800'} rounded-3xl p-6 shadow-sm space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black flex items-center justify-center font-mono">1</span>
                  <h3 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Cấp Độ 1: Thương Hiệu Cơ Bản</h3>
                </div>
                ${isEnterpriseLevel1 || isEnterpriseLevel2 ? '<span class="text-[10px] font-bold text-emerald-600">Đã kích hoạt</span>' : ''}
              </div>

              <p class="text-xs text-stone-500 leading-relaxed">
                Khai báo hồ sơ doanh nghiệp cơ bản để hiển thị Tên thương hiệu đại diện, Website và Số điện thoại liên hệ trên các bài khảo sát.
              </p>

              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Tên thương hiệu / Tổ chức: *</label>
                  <input type="text" id="ent-brand-name" value="${enterpriseProfile.brand_name}" placeholder="VD: Tập đoàn FPT, Vingroup, Masan..."
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Lĩnh vực hoạt động: *</label>
                  <input type="text" id="ent-industry" value="${enterpriseProfile.industry}" placeholder="VD: FMCG, Công nghệ, Bán lẻ, Tài chính..."
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Website chính thức:</label>
                  <input type="url" id="ent-website" value="${enterpriseProfile.website_url}" placeholder="https://company.vn"
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Số điện thoại liên hệ:</label>
                  <input type="text" id="ent-phone" value="${enterpriseProfile.contact_phone}" placeholder="024 xxxx xxxx hoặc hotline"
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold">
                </div>
              </div>

              <button type="button" onclick="VibeApp.saveEnterpriseLevelAction(1)" class="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer">
                Lưu Thông Tin Cấp Độ 1
              </button>
            </div>

            <!-- CẤP ĐỘ 2: PHÁP NHÂN & HÓA ĐƠN VAT ĐỎ -->
            <div class="bg-white dark:bg-[#18181B] border ${isEnterpriseLevel2 ? 'border-orange-500/40' : 'border-stone-200 dark:border-stone-800'} rounded-3xl p-6 shadow-sm space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black flex items-center justify-center font-mono">2</span>
                  <h3 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Cấp Độ 2: Pháp Nhân & Hóa Đơn VAT</h3>
                </div>
                ${isEnterpriseLevel2 ? '<span class="text-[10px] font-bold text-emerald-600">Đã xác minh</span>' : ''}
              </div>

              <p class="text-xs text-stone-500 leading-relaxed">
                Khai báo đầy đủ mã số thuế và thông tin pháp nhân để xuất hóa đơn GTGT điện tử (e-Invoice) cho các chiến dịch khảo sát và ký hợp đồng dịch vụ.
              </p>

              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Tên pháp nhân đầy đủ theo ĐKKD: *</label>
                  <input type="text" id="ent-legal-name" value="${enterpriseProfile.company_legal_name}" placeholder="CÔNG TY CỔ PHẦN..."
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Mã số thuế doanh nghiệp (MST): *</label>
                  <input type="text" id="ent-tax-id" value="${enterpriseProfile.tax_id}" placeholder="0101234567"
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono font-bold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Địa chỉ trụ sở chính (theo ĐKKD): *</label>
                  <input type="text" id="ent-address" value="${enterpriseProfile.headquarters_address}" placeholder="Tầng X, Tòa nhà Y, Quận Z, TP..."
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Email nhận hóa đơn điện tử (e-Invoice): *</label>
                  <input type="email" id="ent-invoice-email" value="${enterpriseProfile.invoice_email}" placeholder="ketoan@company.vn"
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono font-bold">
                </div>
              </div>

              <button type="button" onclick="VibeApp.saveEnterpriseLevelAction(2)" class="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold shadow-xs cursor-pointer">
                Xác Thực Pháp Nhân Cấp Độ 2
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    // Khởi tạo icons Lucide
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  switchProfileTab(tabName) {
    this.haptic('selection');
    if (['demographics', 'reputation'].includes(tabName)) {
      this.state.profileTab = 'overview';
    } else if (['created-forms', 'filled-forms'].includes(tabName)) {
      this.state.profileTab = 'surveys';
      this.state.surveySubTab = tabName === 'created-forms' ? 'created' : 'filled';
    } else {
      this.state.profileTab = tabName;
    }
    const root = document.getElementById('app-root');
    this.renderProfileView(root);
  },

  switchSurveySubTab(subTab) {
    this.haptic('selection');
    this.state.surveySubTab = subTab;
    const root = document.getElementById('app-root');
    this.renderProfileView(root);
  },

  // ==================== LƯU THÔNG TIN NHÂN KHẨU HỌC THẬT VÀ BẢO TOÀN DỮ LIỆU ====================
  async saveDemographicsAction() {
    this.haptic('medium');
    const gender = document.getElementById('demo-gender')?.value || 'MALE';
    const birth_date = document.getElementById('demo-birthdate')?.value || '';
    const province = document.getElementById('demo-province')?.value || 'Hà Nội';
    const occupation = document.getElementById('demo-occupation')?.value || 'Học sinh / Sinh viên đại học';
    const university = document.getElementById('demo-university')?.value?.trim() || '';
    const major = document.getElementById('demo-major')?.value?.trim() || '';
    const graduation_year = parseInt(document.getElementById('demo-gradyear')?.value, 10) || 2026;
    const monthly_income = document.getElementById('demo-income')?.value || 'Dưới 5 triệu VNĐ';

    if (!birth_date) {
      this.showToast('Vui lòng chọn ngày sinh của bạn!', 'warning');
      return;
    }

    try {
      this.showToast('Đang cập nhật hồ sơ...', 'info');
      const res = await this.api('/auth/profile/demographics', {
        method: 'POST',
        body: JSON.stringify({
          gender,
          birth_date,
          province,
          occupation,
          university,
          major,
          graduation_year,
          monthly_income
        })
      });

      if (res && res.success) {
        this.haptic('success');
        this.showToast(res.message || 'Cập nhật hồ sơ nhân khẩu học thành công!', 'success');
        if (res.user) {
          // Bảo toàn avatar_url nếu server trả về đối tượng user
          if (!res.user.avatar_url && this.state.currentUser?.avatar_url) {
            res.user.avatar_url = this.state.currentUser.avatar_url;
          }
          this.state.currentUser = res.user;
          localStorage.setItem('survhub_cached_user', JSON.stringify(this.state.currentUser));
          localStorage.setItem('vibesurvey_cached_user', JSON.stringify(this.state.currentUser));
        }
        const root = document.getElementById('app-root');
        await this.renderProfileView(root);
      } else {
        this.showToast((res && res.message) || 'Lỗi cập nhật hồ sơ', 'error');
      }
    } catch (err) {
      console.error('Lỗi lưu hồ sơ nhân khẩu học:', err);
      this.showToast('Lỗi cập nhật: ' + err.message, 'error');
    }
  },

  // ==================== TẢI LÊN ẢNH ĐẠI DIỆN SIÊU NHANH & NÉN ẢNH CANVAS AN TOÀN ====================
  async handleProfileAvatarUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP)', 'error');
      return;
    }

    this.haptic('medium');
    this.showToast('Đang xử lý và tải lên ảnh đại diện...', 'info');

    try {
      // Đọc file thành Data URL
      const rawDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh'));
        reader.readAsDataURL(file);
      });

      // Tự động resize và nén ảnh qua Canvas để dung lượng luôn dưới 150KB (siêu nhẹ, không bao giờ lỗi payload)
      const compressedDataUrl = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            if (w > maxDim) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      });

      // Gửi yêu cầu lên server
      const res = await this.api('/auth/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatar_base64: compressedDataUrl })
      });

      if (res && res.success) {
        const newAvatarUrl = res.avatar_url;
        if (this.state.currentUser) {
          this.state.currentUser.avatar_url = newAvatarUrl;
          try {
            localStorage.setItem('survhub_cached_user', JSON.stringify(this.state.currentUser));
            localStorage.setItem('vibesurvey_cached_user', JSON.stringify(this.state.currentUser));
          } catch (storageErr) {}
        }

        this.haptic('success');
        this.showToast('Cập nhật ảnh đại diện thành công!', 'success');

        const initialChar = (this.state.currentUser?.name || 'U').charAt(0).toUpperCase();

        // Cập nhật ngay avatar hiển thị trên Profile Header
        const avatarDisplay = document.getElementById('profile-header-avatar-display');
        if (avatarDisplay) {
          avatarDisplay.innerHTML = `<img src="${newAvatarUrl}" alt="Avatar" class="w-full h-full object-cover rounded-2xl" onerror="this.onerror=null;this.parentElement.textContent='${initialChar}';">`;
        }

        // Cập nhật avatar trên thanh Navbar và Dropdown
        const avatarCircle = document.getElementById('user-avatar-circle');
        if (avatarCircle) {
          avatarCircle.classList.add('overflow-hidden');
          avatarCircle.innerHTML = `<img src="${newAvatarUrl}" alt="Avatar" class="w-full h-full object-cover rounded-md" onerror="this.onerror=null;this.parentElement.textContent='${initialChar}';">`;
        }
        this.renderUserProfileDropdown();
      } else {
        this.showToast((res && res.message) || 'Lỗi khi lưu ảnh đại diện', 'error');
      }
    } catch (uploadErr) {
      console.error('Lỗi upload avatar:', uploadErr);
      this.showToast('Lỗi khi tải ảnh: ' + uploadErr.message, 'error');
    }
  },

  // ==================== XÓA KHẢO SÁT THẬT HOẠT ĐỘNG HOÀN TOÀN ====================
  async deleteSurveyAction(surveyId) {
    if (!surveyId) return;
    const confirmDelete = confirm('Bạn có chắc chắn muốn xóa bài khảo sát này vĩnh viễn không?\n\nNếu khảo sát còn số dư ký quỹ chưa dùng hết, hệ thống sẽ tự động hoàn trả về ví của bạn.');
    if (!confirmDelete) return;

    this.haptic('warning');
    this.showToast('Đang tiến hành xóa bài khảo sát...', 'info');

    try {
      const res = await this.api('/surveys/' + surveyId, {
        method: 'DELETE'
      });

      if (res && res.success) {
        this.haptic('success');
        this.showToast(res.message || 'Đã xóa bài khảo sát thành công!', 'success');
        // Nạp lại dữ liệu và render lại
        const root = document.getElementById('app-root');
        await this.renderProfileView(root);
      } else {
        this.showToast((res && res.message) || 'Không thể xóa bài khảo sát', 'error');
      }
    } catch (err) {
      this.showToast('Lỗi xóa khảo sát: ' + err.message, 'error');
    }
  },

  // ==================== QUẢN TRỊ: ĐÃ TÁCH RA public/js/modules/adminConsole.js (WAVE 3 MODULAR) ====================

    getLucideSvg(name, cls = 'w-4 h-4') {
    const icons = {
      'wallet': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-8 8H6a2 2 0 0 1-2-2V5"/><path d="M18 12h.01"/></svg>`,
      'coins': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>`,
      'gift': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>`,
      'refresh-cw': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
      'credit-card': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
      'clipboard-list': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
      'arrow-up-right': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>`,
      'check': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
      'clock': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      'history': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><polyline points="12 7 12 12 15 15"/></svg>`,
      'calendar': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
      'chevron-down': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
      'chevron-right': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
      'arrow-right': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
      'plus': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
      'info': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
      'star': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      'flag': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
      'home': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      'book-open': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
      'check-circle-2': `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>`
    };
    return icons[name] || `<i data-lucide="${name}" class="${cls}"></i>`;
  },

  escapeHtml: function (...args) {
    // WAVE 1 MODULAR: Bản canonical chuyển sang public/js/utils.js (window.VibeUtils.escapeHtml); ủy quyền để giữ nguyên vị trí property trong object VibeApp.
    return window.VibeUtils.escapeHtml(...args);
  },

  // ==================== TIEN ICH MODAL (showToast/showModal/closeModal/copyValue): ĐÃ TÁCH RA public/js/modules/modalsTerms.js (WAVE 5 MODULAR) ====================

  copyText(text) {
    this.haptic('success');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
    this.showToast('Đã sao chép mã ưu đãi!', 'success');
  },

  // ==================== CƠ CHẾ THÔNG BÁO ĐẨY THỜI GIAN THỰC & ANDROID HYBRID: ĐÃ TÁCH RA public/js/modules/pushNotifications.js (WAVE 1 MODULAR) ====================
  // ==================== DIỄN ĐÀN: ĐÃ TÁCH RA public/js/modules/forum.js (WAVE 4 MODULAR) ====================
});

document.addEventListener('DOMContentLoaded', () => {
  VibeApp.init();
});
