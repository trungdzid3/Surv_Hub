const assert = require('assert');
const fs = require('fs');

console.log('===============================================================');
console.log('KIEM THU: SINGLE-QUESTION STEPPER ROUTING & SMART BRANCHING');
console.log('Chuan Google Forms / Microsoft Forms Branching & Anti-Bleed');
console.log('===============================================================');

// Sau đại tu modular (wave 1-7): logic frontend tách thành nhiều module,
// đọc GỘP nguồn app.js + toàn bộ public/js/modules/*.js để test không phụ thuộc vị trí file.
const readFrontendSource = () => ['public/app.js']
  .concat(fs.readdirSync('public/js/modules').filter(f => f.endsWith('.js')).map(f => `public/js/modules/${f}`))
  .map(f => fs.readFileSync(f, 'utf8'))
  .join('\n');
const appJs = readFrontendSource();

// Mock DOM
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null
};
global.window = {
  scrollTo: () => {}
};

// 1. Kiểm tra sự hiện diện của _normalizeSmartText và _isSmartTextMatch
assert(appJs.includes('_normalizeSmartText('), 'Phai co _normalizeSmartText');
assert(appJs.includes('_isSmartTextMatch('), 'Phai co _isSmartTextMatch');
console.log('[PASS] 1. Helper _normalizeSmartText va _isSmartTextMatch da hien dien trong app.js');

// 2. Tạo mock VibeApp
const mockApp = {
  state: {
    activeSession: {
      surveyId: 'survey_test_1',
      questions: [],
      answers: {},
      currentIndex: 0,
      currentSectionIndex: 0,
      history: [],
      sectionHistory: []
    }
  },
  _saveActiveSessionToStorage: () => {},
  triggerPacingLock: () => {},
  showToast: (msg) => {},
  haptic: () => {},
  renderTakeSurveyView: () => {},
  submitted: false,
  async submitSurvey() {
    this.submitted = true;
  }
};

// Trích xuất _normalizeSmartText
const normMatch = appJs.match(/_normalizeSmartText\(str\)\s*\{([\s\S]*?)\n\s*\},/);
assert(normMatch, 'Phai trich xuat duoc _normalizeSmartText');
mockApp._normalizeSmartText = new Function('str', normMatch[1]).bind(mockApp);

// Trích xuất _isSmartTextMatch
const matchMatch = appJs.match(/_isSmartTextMatch\(haystack,\s*needle\)\s*\{([\s\S]*?)\n\s*\},/);
assert(matchMatch, 'Phai trich xuat duoc _isSmartTextMatch');
mockApp._isSmartTextMatch = new Function('haystack', 'needle', matchMatch[1]).bind(mockApp);

// Trích xuất buildSurveySections
const buildSectionsMatch = appJs.match(/buildSurveySections\(questions[\s\S]*?\) \{([\s\S]*?)\n\s*\},/);
assert(buildSectionsMatch, 'Phai trich xuat duoc buildSurveySections');
mockApp.buildSurveySections = new Function('questions', 'surveyMeta', 'this.state = this.state || {}; ' + buildSectionsMatch[1]).bind(mockApp);

// Trích xuất resolveSectionTarget
const resSecMatch = appJs.match(/resolveSectionTarget\(rawTarget,\s*sections[\s\S]*?\) \{([\s\S]*?)\n\s*\},/);
assert(resSecMatch, 'Phai trich xuat duoc resolveSectionTarget');
mockApp.resolveSectionTarget = new Function('rawTarget', 'sections', 'optText', resSecMatch[1]).bind(mockApp);

// Trích xuất nextQuestion
const nextQMatch = appJs.match(/async\s+nextQuestion\(\)\s*\{([\s\S]*?)\n\s*\},/);
assert(nextQMatch, 'Phai trich xuat duoc nextQuestion');
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
mockApp.nextQuestion = new AsyncFunction(nextQMatch[1]).bind(mockApp);

// --- KIEM THU 1: SMART TEXT NORMALIZATION & MATCHING ---
console.log('\n--- KIEM THU 1: SMART TEXT NORMALIZATION & MATCHING ---');
assert.strictEqual(mockApp._normalizeSmartText('Mục 3: Ban Hợp tác - Đối ngoại'), 'hop tac doi ngoai');
assert.strictEqual(mockApp._normalizeSmartText('Hợp tác - Đối ngoại'), 'hop tac doi ngoai');
assert.strictEqual(mockApp._isSmartTextMatch('Mục 3: Ban Hợp tác - Đối ngoại', 'Hợp tác - Đối ngoại'), true);
assert.strictEqual(mockApp._isSmartTextMatch('Hợp tác - Đối ngoại', 'Mục 3: Ban Hợp tác - Đối ngoại'), true);
assert.strictEqual(mockApp._isSmartTextMatch('Phần 2: Học thuật và Nghiên cứu', 'Học thuật - Nghiên cứu'), true);
console.log('[PASS] Smart Text Normalization & Matching: Khử dấu, bỏ tiền tố Mục/Phần/Section và so khớp chính xác.');

// --- KIEM THU 2: RESOLVETARGET TRONG SINGLE-QUESTION STEPPER ---
console.log('\n--- KIEM THU 2: RESOLVETARGET DIEU HUONG RE NHANH ---');

const testQuestions = [
  // 0: Câu hỏi thông tin chung
  { id: 'q_name', type: 'SHORT_TEXT', content: 'Họ và tên', is_required: 1 },
  // 1: Câu 14 rẽ nhánh
  {
    id: 'q14',
    type: 'SINGLE_CHOICE',
    content: 'Bạn muốn ứng tuyển vào ban nào?',
    options: ['Học thuật - Nghiên cứu', 'Hợp tác - Đối ngoại', 'Truyền thông - Sự kiện'],
    is_required: 1,
    logic: {
      enabled: true,
      options: {
        'Học thuật - Nghiên cứu': 'sec_hocthuat',
        // 'Hợp tác - Đối ngoại' cố tình để null hoặc target dạng text để test Smart Matching
        'Hợp tác - Đối ngoại': 'Mục 3: Ban Hợp tác - Đối ngoại',
        'Truyền thông - Sự kiện': 6 // Test index
      }
    }
  },
  // 2: Phân đoạn Ban Học thuật
  { id: 'sec_hocthuat', type: 'SECTION_HEADER', content: 'Mục 2: Ban Học thuật - Nghiên cứu', rows: ['Câu hỏi chuyên môn'], logic: { default_action: 'sec_common_end' } },
  // 3: Câu của Ban Học thuật
  { id: 'q_ht1', type: 'SHORT_TEXT', content: 'Kinh nghiệm nghiên cứu', is_required: 0 },
  // 4: Phân đoạn Ban Hợp tác - Đối ngoại
  { id: 'sec_doingoai', type: 'SECTION_HEADER', content: 'Mục 3: Ban Hợp tác - Đối ngoại', rows: ['Câu hỏi đối ngoại'] },
  // 5: Câu của Ban Hợp tác - Đối ngoại
  { id: 'q_dn1', type: 'SHORT_TEXT', content: 'Kinh nghiệm đối ngoại', is_required: 0 },
  // 6: Phân đoạn Ban Truyền thông
  { id: 'sec_truyenthong', type: 'SECTION_HEADER', content: 'Mục 4: Ban Truyền thông - Sự kiện', rows: [] },
  // 7: Câu của Ban Truyền thông
  { id: 'q_tt1', type: 'SHORT_TEXT', content: 'Kỹ năng thiết kế', is_required: 0 },
  // 8: Phân đoạn chung sau cùng
  { id: 'sec_common_end', type: 'SECTION_HEADER', content: 'Mục 5: Thông tin xác nhận sau cùng', rows: [] },
  // 9: Câu hỏi chung sau cùng
  { id: 'q_final', type: 'SHORT_TEXT', content: 'Link CV hoặc Portfolio', is_required: 0 }
];

// Test Case 2.1: Target là UUID ID
async function testUUIDTarget() {
  mockApp.state.activeSession.questions = testQuestions;
  mockApp.state.activeSession.currentIndex = 1;
  mockApp.state.activeSession.answers = { 'q14': 'Học thuật - Nghiên cứu' };
  mockApp.submitted = false;

  await mockApp.nextQuestion();
  assert.strictEqual(mockApp.state.activeSession.currentIndex, 2, 'Phải nhảy đến Section Header có ID sec_hocthuat (index 2)');
  console.log('[PASS] 2.1 Target la ID UUID: Nhay chinh xac den cau hoi / Section Header co ID tuong ung.');

  // Test Case 2.1b: Tiếp tục ấn Next trên Section Header sec_hocthuat (index 2) phải vào câu hỏi q_ht1 (index 3), KHÔNG ĐƯỢC NHẢY CÓC!
  await mockApp.nextQuestion();
  assert.strictEqual(mockApp.state.activeSession.currentIndex, 3, 'Từ Section Header, ấn Tiếp tục phải vào câu hỏi đầu tiên của phân đoạn đó (index 3)');
  console.log('[PASS] 2.1b Section Header Navigation: An Tiep tren Section Header vao dung cau hoi con cua phan doan, khong bi bo qua noi dung.');
}

// Test Case 2.2: Target là số index
async function testIndexTarget() {
  mockApp.state.activeSession.questions = testQuestions;
  mockApp.state.activeSession.currentIndex = 1;
  mockApp.state.activeSession.answers = { 'q14': 'Truyền thông - Sự kiện' };
  mockApp.submitted = false;

  await mockApp.nextQuestion();
  assert.strictEqual(mockApp.state.activeSession.currentIndex, 6, 'Phải nhảy đến index 6 (sec_truyenthong)');
  console.log('[PASS] 2.2 Target la so index: Nhay chinh xac den cau hoi tai index do.');
}

// Test Case 2.3: Target chua match UUID -> Smart Name / Title Matching
async function testSmartNameMatching() {
  mockApp.state.activeSession.questions = testQuestions;
  mockApp.state.activeSession.currentIndex = 1;
  mockApp.state.activeSession.answers = { 'q14': 'Hợp tác - Đối ngoại' };
  mockApp.submitted = false;

  await mockApp.nextQuestion();
  assert.strictEqual(mockApp.state.activeSession.currentIndex, 4, 'Phải nhảy đến Section Header Mục 3: Ban Hợp tác - Đối ngoại (index 4) qua Smart Matching');
  console.log('[PASS] 2.3 Smart Name / Title Matching: Nhay chinh xac den Section Header co ten tuong dong voi lua chon da chon.');
}

// Test Case 2.4: Lua chon khong co trong logic.options nhung ten lua chon tuong dong voi Section Header
async function testImplicitSmartBranching() {
  // Tao ban sao cau hoi q14 khong co logic.options cho 'Hợp tác - Đối ngoại'
  const customQuestions = JSON.parse(JSON.stringify(testQuestions));
  delete customQuestions[1].logic.options['Hợp tác - Đối ngoại'];

  mockApp.state.activeSession.questions = customQuestions;
  mockApp.state.activeSession.currentIndex = 1;
  mockApp.state.activeSession.answers = { 'q14': 'Hợp tác - Đối ngoại' };
  mockApp.submitted = false;

  await mockApp.nextQuestion();
  assert.strictEqual(mockApp.state.activeSession.currentIndex, 4, 'Du khong co logic.options, he thong van tu dong match Smart Name den Section 4');
  console.log('[PASS] 2.4 Smart Branching tu dong: Nhan dien lua chon khop Section Header ngay ca khi thieu cau hinh ID truc tiep.');
}

// --- KIEM THU 3: SECTION-END ROUTING & ANTI-BLEED (CHONG TROI TU DO) ---
console.log('\n--- KIEM THU 3: SECTION-END ROUTING & CHONG TROI TU DO ---');

// Test Case 3.1: Section-End co default_action tuong minh
async function testSectionEndExplicitDefaultAction() {
  // Đang ở câu q_ht1 (index 3, câu cuối của Ban Học thuật)
  mockApp.state.activeSession.questions = testQuestions;
  mockApp.state.activeSession.currentIndex = 3;
  mockApp.state.activeSession.answers = { 'q_ht1': 'Da co 2 nam' };
  mockApp.submitted = false;

  // sec_hocthuat (index 2) co logic.default_action = 'sec_common_end' (index 8)
  await mockApp.nextQuestion();
  assert.strictEqual(mockApp.state.activeSession.currentIndex, 8, 'Phải nhảy thẳng đến sec_common_end (index 8), bo qua Ban Hop tac va Ban Truyen thong');
  console.log('[PASS] 3.1 Section-End co default_action: Chuyen chinh xac den phan doan chung sau cung, khong troi sang tieu ban khac.');
}

// Test Case 3.2: Section-End KHONG co default_action (hoac default_action = NEXT)
// Phai tu dong nhan dien Ban Hop tac la mot nhanh song song va nhay den phan doan chung (sec_common_end),
// TUYET DOI KHONG TROI VAO BAN TRUYEN THONG!
async function testSectionEndAntiBleed() {
  // Đang ở câu q_dn1 (index 5, câu cuối của Ban Hợp tác - Đối ngoại)
  // sec_doingoai (index 4) KHONG CO default_action!
  // Câu tiếp theo trong mảng là sec_truyenthong (index 6 - Ban Truyền thông)
  mockApp.state.activeSession.questions = testQuestions;
  mockApp.state.activeSession.currentIndex = 5;
  mockApp.state.activeSession.answers = { 'q_dn1': 'Da tung lam MC va doi ngoai' };
  mockApp.submitted = false;

  await mockApp.nextQuestion();
  assert.strictEqual(mockApp.state.activeSession.currentIndex, 8, 'Anti-Bleed Engine: Phải tự động nhảy qua Ban Truyền thông (index 6) để vào phân đoạn chung index 8!');
  console.log('[PASS] 3.2 Section-End Anti-Bleed: Tu dong chan troi tu do sang phan doan cua tieu ban khac khi ket thuc phan doan nhanh.');
}

// Test Case 3.3: Section-End khong co phan doan chung sau cung -> Submit ngay
async function testSectionEndSubmitWhenNoCommonSection() {
  // Tạo form không có Mục 5 sau cùng (Mục 4 Ban Truyền thông là mục cuối)
  const noEndQuestions = testQuestions.slice(0, 8); // từ 0 đến 7
  // Đang ở câu q_dn1 (index 5)
  mockApp.state.activeSession.questions = noEndQuestions;
  mockApp.state.activeSession.currentIndex = 5;
  mockApp.state.activeSession.answers = { 'q_dn1': 'Xong ban doi ngoai' };
  mockApp.submitted = false;

  await mockApp.nextQuestion();
  assert.strictEqual(mockApp.submitted, true, 'Anti-Bleed Engine: Vi khong con phan doan chung nao sau cac nhanh, he thong phai tu dong nop bai!');
  console.log('[PASS] 3.3 Section-End Auto-Submit: Tu dong nop bai khi ket thuc nhanh va khong co phan doan chung sau cung.');
}

// Chạy tuần tự các tests
async function runAll() {
  await testUUIDTarget();
  await testIndexTarget();
  await testSmartNameMatching();
  await testImplicitSmartBranching();
  await testSectionEndExplicitDefaultAction();
  await testSectionEndAntiBleed();
  await testSectionEndSubmitWhenNoCommonSection();

  console.log('\n===============================================================');
  console.log('KET QUA: 7/7 BAI KIEM THU ROUTING & ANTI-BLEED DA PASS 100%!');
  console.log('===============================================================');
}

runAll().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
