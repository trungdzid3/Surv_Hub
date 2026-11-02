const assert = require('assert');
const db = require('../server/db/database');
const surveyRepository = require('../server/repositories/surveyRepository');
const formParserService = require('../server/services/formParserService');

console.log('--- TEST: SURVEY FULL FLOW - VALIDATION & SMART BRANCHING ---');

// 1. Test FormParserService bóc tách dải số và gán target
const sampleText = `
3. Mã số sinh viên *
Số phải nằm trong khoảng từ 20000000 ~ 20270000

14. Bạn muốn trở thành thành viên tiểu ban nào (Nguyện vọng 1)? *
- Truyền thông
- Hợp tác - Đối ngoại
- Sự kiện
- Học thuật
- Cơ sở vật chất

15. Mục: Tiểu ban Truyền thông
Mô tả tiểu ban Truyền thông

16. Vì sao bạn cảm thấy bản thân là mảnh ghép phù hợp cho tiểu ban Truyền thông? *
Nhập câu trả lời của bạn

17. Mục: Tiểu ban Hợp tác - Đối ngoại
Mô tả tiểu ban Đối ngoại

18. Vì sao bạn chọn tiểu ban Hợp tác - Đối ngoại? *
Nhập câu trả lời của bạn
`;

const parsed = formParserService.parseSmartText(sampleText);
console.log('Parsed questions count:', parsed.questions.length);

// Kiểm tra câu 3 (MSSV) có validation BETWEEN
const qMssv = parsed.questions.find(q => q.content.includes('Mã số sinh viên'));
assert(qMssv, 'Phải có câu Mã số sinh viên');
assert.strictEqual(qMssv.validation?.type, 'NUMBER');
assert.strictEqual(qMssv.validation?.rule, 'BETWEEN');
assert.strictEqual(qMssv.validation?.min, 20000000);
assert.strictEqual(qMssv.validation?.max, 20270000);
console.log('PASS: Q3 (MSSV) validation rule is BETWEEN 20000000 ~ 20270000');

// Kiểm tra câu 14 có logic options trỏ đến đúng Section
const qNv1 = parsed.questions.find(q => q.content.includes('Nguyện vọng 1'));
assert(qNv1, 'Phải có câu Nguyện vọng 1');
assert(qNv1.logic && qNv1.logic.options, 'Câu NV1 phải có logic.options');
console.log('Q14 logic options:', qNv1.logic.options);

// 2. Test lưu vào DB và đọc ra từ surveyRepository
const testSurveyId = 'test_survey_' + Date.now();
const testCreatorId = 'user_test_' + Date.now();

// Tạo user test trước
db.prepare("INSERT INTO users (id, email, name, password_hash, role, status) VALUES (?, ?, 'Creator Test', 'hash', 'CREATOR', 'ACTIVE')")
  .run(testCreatorId, `creator_${Date.now()}@vibe.vn`);

const { preparedQuestions, idMap } = surveyRepository._buildQuestionIdMap(parsed.questions);
const insertQStmt = db.prepare(`
  INSERT INTO questions (
    id, survey_id, order_index, type, content, 
    options_json, rows_json, columns_json, logic_json, is_required, 
    min_label, max_label, image_url, video_url,
    is_attention_check, expected_answer, is_screener, qualifying_answer
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.prepare(`
  INSERT INTO surveys (id, creator_id, title, status, cost_per_response, reward_points_per_response, duration_days, expires_at)
  VALUES (?, ?, 'Khảo sát tuyển thành viên test', 'ACTIVE', 500, 400, 14, datetime('now', '+14 days'))
`).run(testSurveyId, testCreatorId);

for (let i = 0; i < preparedQuestions.length; i++) {
  const { q, qId } = preparedQuestions[i];
  const processed = surveyRepository._processQuestionForInsert(q, qId, i, idMap, parsed.questions.length);
  insertQStmt.run(
    processed.qId,
    testSurveyId,
    processed.orderIndex,
    processed.type,
    processed.content,
    processed.optionsJson,
    processed.rowsJson,
    processed.colsJson,
    processed.logicJson,
    processed.isReq,
    processed.minLabel,
    processed.maxLabel,
    processed.imageUrl,
    processed.videoUrl,
    processed.isAttentionCheck,
    processed.expectedAnswer,
    processed.isScreener,
    processed.qualifyingAnswer
  );
}

// Đọc lại từ CSDL
const retrievedQuestions = surveyRepository.getQuestionsBySurveyId(testSurveyId, true);
assert.strictEqual(retrievedQuestions.length, parsed.questions.length);

const dbMssv = retrievedQuestions.find(q => q.content.includes('Mã số sinh viên'));
assert(dbMssv.validation, 'Câu MSSV từ DB phải có validation');
assert.strictEqual(dbMssv.validation.type, 'NUMBER');
assert.strictEqual(dbMssv.validation.rule, 'BETWEEN');
assert.strictEqual(dbMssv.validation.min, 20000000);
assert.strictEqual(dbMssv.validation.max, 20270000);
console.log('PASS: Database retrieves validation from logic_json with 100% fidelity!');

const dbNv1 = retrievedQuestions.find(q => q.content.includes('Nguyện vọng 1'));
assert(dbNv1.logic && dbNv1.logic.options, 'Câu NV1 từ DB phải có logic.options');
console.log('PASS: Database retrieves logic.options from logic_json successfully!');

// Dọn dẹp test data
db.prepare('DELETE FROM questions WHERE survey_id = ?').run(testSurveyId);
db.prepare('DELETE FROM surveys WHERE id = ?').run(testSurveyId);
db.prepare('DELETE FROM users WHERE id = ?').run(testCreatorId);

console.log('ALL SURVEY FULL FLOW TESTS PASSED 100%!');
