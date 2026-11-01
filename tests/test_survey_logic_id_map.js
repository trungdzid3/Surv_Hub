/**
 * Kiem thu Ban do chuyen doi ID (ID Map) & Bao toan logic targets trong surveyRepository
 */

const assert = require('assert');
const crypto = require('crypto');
const db = require('../server/db/database');
const surveyRepository = require('../server/repositories/surveyRepository');

async function run() {
  console.log('===============================================================');
  console.log('KIỂM THỬ: ID MAP & LOGIC TARGET MAPPING TRONG SURVEY REPOSITORY');
  console.log('===============================================================');

  const testCreatorId = 'creator_idmap_' + crypto.randomUUID();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, status)
    VALUES (?, ?, 'hash', 'ID Map Tester', 'CREATOR', 'ACTIVE')
  `).run(testCreatorId, `idmap_${Date.now()}@test.local`);

  const surveyId1 = 'survey_idmap_1_' + crypto.randomUUID();

  // -------------------------------------------------------------
  // TEST 1: createSurveyTransaction / createSurvey remap logic targets
  // -------------------------------------------------------------
  const questionsData = [
    {
      id: 'q_branch_start',
      type: 'SINGLE_CHOICE',
      content: 'Bạn là học sinh hay sinh viên?',
      options: ['Học sinh', 'Sinh viên', 'Đã đi làm', 'Khác'],
      is_required: 1,
      logic: {
        enabled: true,
        options: {
          '0': 'q_student_section', // Trỏ theo oldId của câu 1
          'Học sinh': 'q_student_section',
          '1': '2', // Trỏ theo 0-based index của câu 2
          'Sinh viên': '2',
          '2': 'SUBMIT', // Từ khóa SUBMIT
          '3': 'NEXT' // Từ khóa NEXT
        }
      }
    },
    {
      id: 'q_student_section',
      type: 'SECTION_HEADER',
      content: 'Phần dành cho Học sinh',
      is_required: 0,
      logic: {
        default_action: 'q_final_feedback' // Trỏ theo oldId của câu 3
      }
    },
    {
      id: 'q_uni_name',
      type: 'SHORT_TEXT',
      content: 'Tên trường Đại học của bạn',
      is_required: 1,
      validation: {
        type: 'TEXT',
        rule: 'MIN_LENGTH',
        min: 2
      }
    },
    {
      id: 'q_final_feedback',
      type: 'PARAGRAPH',
      content: 'Góp ý thêm cho chương trình',
      is_required: 0
    }
  ];

  const result1 = surveyRepository.createSurveyTransaction({
    id: surveyId1,
    creator_id: testCreatorId,
    title: 'Khảo sát test ID Map Logic Branching',
    target_responses: 10
  }, questionsData);

  assert.strictEqual(result1.surveyId, surveyId1);
  assert.strictEqual(result1.questionsCount, 4);

  // Truy van qua getQuestionsBySurveyId
  const fetchedQuestions = surveyRepository.getQuestionsBySurveyId(surveyId1);
  assert.strictEqual(fetchedQuestions.length, 4);

  const q0 = fetchedQuestions[0];
  const q1 = fetchedQuestions[1];
  const q2 = fetchedQuestions[2];
  const q3 = fetchedQuestions[3];

  // Kiểm tra ID mới không còn là oldId
  assert.notStrictEqual(q0.id, 'q_branch_start');
  assert.notStrictEqual(q1.id, 'q_student_section');
  assert.notStrictEqual(q2.id, 'q_uni_name');
  assert.notStrictEqual(q3.id, 'q_final_feedback');

  // Kiểm tra UUID hợp lệ
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.ok(uuidRegex.test(q0.id), 'q0.id phải là UUID hợp lệ');
  assert.ok(uuidRegex.test(q1.id), 'q1.id phải là UUID hợp lệ');
  assert.ok(uuidRegex.test(q2.id), 'q2.id phải là UUID hợp lệ');
  assert.ok(uuidRegex.test(q3.id), 'q3.id phải là UUID hợp lệ');

  // Kiểm tra logic_json đã remap sang newUUID
  assert.ok(q0.logic, 'q0 phải có logic');
  assert.strictEqual(q0.logic.options['0'], q1.id, 'Target q_student_section phải được remap sang q1.id');
  assert.strictEqual(q0.logic.options['Học sinh'], q1.id, 'Target "Học sinh" phải được remap sang q1.id');
  assert.strictEqual(q0.logic.options['1'], q2.id, 'Target index 2 phải được remap sang q2.id');
  assert.strictEqual(q0.logic.options['Sinh viên'], q2.id, 'Target "Sinh viên" phải được remap sang q2.id');
  assert.strictEqual(q0.logic.options['2'], 'SUBMIT', 'Từ khóa SUBMIT phải được giữ nguyên');
  assert.strictEqual(q0.logic.options['3'], 'NEXT', 'Từ khóa NEXT phải được giữ nguyên');

  // Kiểm tra SECTION_HEADER logic default_action
  assert.ok(q1.logic, 'q1 (SECTION_HEADER) phải có logic');
  assert.strictEqual(q1.logic.default_action, q3.id, 'default_action q_final_feedback phải được remap sang q3.id');

  // Kiểm tra Runner resolveTarget giả lập
  const mockResolve = (targetVal) => {
    if (targetVal === 'SUBMIT') return 'SUBMIT';
    if (targetVal === 'NEXT') return 'NEXT';
    const parsed = parseInt(targetVal, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < fetchedQuestions.length && String(parsed) === String(targetVal)) return parsed;
    const foundIdx = fetchedQuestions.findIndex(item => String(item.id) === String(targetVal));
    if (foundIdx !== -1) return foundIdx;
    return null;
  };

  assert.strictEqual(mockResolve(q0.logic.options['Học sinh']), 1, 'Runner phải tìm thấy đúng index 1');
  assert.strictEqual(mockResolve(q0.logic.options['Sinh viên']), 2, 'Runner phải tìm thấy đúng index 2');
  assert.strictEqual(mockResolve(q1.logic.default_action), 3, 'Runner phải tìm thấy đúng index 3');

  console.log('  [PASS] 1. createSurveyTransaction: ID Map remap chính xác oldId và orderIndex sang newUUID');

  // -------------------------------------------------------------
  // TEST 2: updateSurveyTransaction / updateSurvey remap logic targets
  // -------------------------------------------------------------
  const newQuestions = [
    {
      id: 'temp_q_1',
      type: 'SINGLE_CHOICE',
      content: 'Bạn đã tốt nghiệp chưa?',
      options: ['Chưa', 'Rồi'],
      is_required: 1,
      logic: {
        enabled: true,
        options: {
          '0': 'temp_q_2', // Trỏ câu 1
          '1': 'temp_q_3'  // Trỏ câu 2
        }
      }
    },
    {
      id: 'temp_q_2',
      type: 'SHORT_TEXT',
      content: 'Năm dự kiến tốt nghiệp',
      is_required: 1
    },
    {
      id: 'temp_q_3',
      type: 'SHORT_TEXT',
      content: 'Công ty đang làm việc',
      is_required: 1
    }
  ];

  surveyRepository.updateSurveyTransaction(surveyId1, { title: 'Khảo sát đã cập nhật' }, newQuestions);

  const updatedQuestions = surveyRepository.getQuestionsBySurveyId(surveyId1);
  assert.strictEqual(updatedQuestions.length, 3);
  assert.ok(uuidRegex.test(updatedQuestions[0].id));
  assert.ok(uuidRegex.test(updatedQuestions[1].id));
  assert.ok(uuidRegex.test(updatedQuestions[2].id));

  assert.strictEqual(updatedQuestions[0].logic.options['0'], updatedQuestions[1].id);
  assert.strictEqual(updatedQuestions[0].logic.options['1'], updatedQuestions[2].id);

  console.log('  [PASS] 2. updateSurveyTransaction: ID Map remap câu hỏi mới chính xác');

  // -------------------------------------------------------------
  // TEST 3: Đảm bảo getQuestionsBySurveyId trả về logic đầy đủ
  // -------------------------------------------------------------
  const finalQuestions = surveyRepository.getQuestionsBySurveyId(surveyId1, true);
  assert.ok(Array.isArray(finalQuestions));
  finalQuestions.forEach((q) => {
    assert.ok(q.id);
    assert.ok(typeof q.order_index === 'number');
    assert.ok(q.hasOwnProperty('logic'));
    assert.ok(q.hasOwnProperty('validation'));
  });

  console.log('  [PASS] 3. getQuestionsBySurveyId: Trả về đầy đủ logic và validation');

  // Cleanup
  db.prepare('DELETE FROM questions WHERE survey_id = ?').run(surveyId1);
  db.prepare('DELETE FROM surveys WHERE id = ?').run(surveyId1);
  db.prepare('DELETE FROM users WHERE id = ?').run(testCreatorId);

  console.log('---------------------------------------------------------------');
  console.log('KẾT QUẢ: TOÀN BỘ 3/3 BÀI TEST ID MAP & LOGIC TARGET PASS 100%');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('[FAIL] Kiểm thử thất bại:', err);
  process.exit(1);
});
