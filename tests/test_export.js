/**
 * Bo kiem thu: Export Survey Data Unit & Route Test
 * Kiem tra cac tinh nang xuat du lieu khao sat (CSV & JSON) cho Creator & Admin
 */

process.env.NODE_ENV = 'test';
process.env.DISABLE_REAL_EMAIL = 'true';

const assert = require('node:assert');
const crypto = require('node:crypto');
const surveyController = require('../server/controllers/surveyController');
const db = require('../server/db/database');
const { cleanAllTestData } = require('./test_cleanup_helper');

console.log('===============================================================');
console.log('BAT DAU KIEM THU TINH NANG XUAT DU LIEU (CSV & JSON EXPORT)');
console.log('===============================================================');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`     Chi tiet loi: ${err.message}`);
    throw err;
  }
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(content) {
      this.body = content;
      return this;
    }
  };
  return res;
}

const uniqueSuffix = Date.now() + '_' + crypto.randomBytes(4).toString('hex');
const creatorId = 'export_creator_' + uniqueSuffix;
const respondentId = 'export_resp_' + uniqueSuffix;
const adminId = 'export_admin_' + uniqueSuffix;
const surveyId = 'export_survey_' + uniqueSuffix;
const questionId = 'export_q1_' + uniqueSuffix;
const testRespId = 'export_response_' + uniqueSuffix;

try {
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, status)
    VALUES (?, ?, 'hash', 'Export Creator', 'CREATOR', 'ACTIVE')
  `).run(creatorId, `export_creator_${uniqueSuffix}@test.local`);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, status)
    VALUES (?, ?, 'hash', 'Export Respondent', 'RESPONDENT', 'ACTIVE')
  `).run(respondentId, `export_resp_${uniqueSuffix}@test.local`);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, status)
    VALUES (?, ?, 'hash', 'Export Admin', 'ADMIN', 'ACTIVE')
  `).run(adminId, `export_admin_${uniqueSuffix}@test.local`);

  db.prepare(`
    INSERT INTO surveys (id, creator_id, title, description, category, target_responses, cost_per_response, reward_points_per_response, escrow_locked_balance, status)
    VALUES (?, ?, 'Export Test Survey', 'Mo ta test export', 'Thị trường', 10, 1000, 500, 10000, 'ACTIVE')
  `).run(surveyId, creatorId);

  db.prepare(`
    INSERT INTO questions (id, survey_id, order_index, type, content, options_json)
    VALUES (?, ?, 1, 'SINGLE_CHOICE', 'Ban thich san thuong mai nao?', '["Shopee","Lazada"]')
  `).run(questionId, surveyId);

  const creatorUser = { id: creatorId, role: 'CREATOR' };
  const otherCreator = { id: 'fake-other-creator-id', role: 'CREATOR' };
  const respondentUser = { id: respondentId, role: 'RESPONDENT' };
  const adminUser = { id: adminId, role: 'ADMIN' };

  test('1. Bao loi 404 khi khao sat khong ton tai', () => {
    const req = {
      params: { id: 'non-existent-survey-id' },
      query: { format: 'csv' },
      user: adminUser
    };
    const res = createMockRes();
    surveyController.exportSurveyData(req, res);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /không tồn tại/i);
  });

  test('2. Chan quyen Respondent tai du lieu (403 Forbidden)', () => {
    const req = {
      params: { id: surveyId },
      query: { format: 'csv' },
      user: respondentUser
    };
    const res = createMockRes();
    surveyController.exportSurveyData(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
  });

  test('3. Chan Creator la khong phai chu so huu khao sat (403 Forbidden)', () => {
    const req = {
      params: { id: surveyId },
      query: { format: 'csv' },
      user: otherCreator
    };
    const res = createMockRes();
    surveyController.exportSurveyData(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
  });

  test('4. Xuat du lieu dinh dang CSV co UTF-8 BOM va headers day du cho Creator', () => {
    const req = {
      params: { id: surveyId },
      query: { format: 'csv' },
      user: creatorUser
    };
    const res = createMockRes();
    surveyController.exportSurveyData(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['Content-Type'], 'text/csv; charset=utf-8');
    assert.match(res.headers['Content-Disposition'], /attachment; filename="survey_.*\.csv"/);
    assert.ok(res.body.startsWith('\uFEFF'), 'Noi dung CSV phai bat dau bang UTF-8 BOM');
    assert.ok(res.body.includes('Mã Phản Hồi (Response ID)'));
    assert.ok(res.body.includes('Mã Ứng Viên (Respondent ID)'));
    assert.ok(res.body.includes('Điểm Chất Lượng (%)'));
    assert.ok(res.body.includes('Thời Gian Làm Bài (Giây)'));
  });

  test('5. Xuat du lieu dinh dang JSON cau truc hop le cho Admin', () => {
    const req = {
      params: { id: surveyId },
      query: { format: 'json' },
      user: adminUser
    };
    const res = createMockRes();
    surveyController.exportSurveyData(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['Content-Type'], 'application/json; charset=utf-8');
    assert.match(res.headers['Content-Disposition'], /attachment; filename="survey_.*\.json"/);

    const parsed = JSON.parse(res.body);
    assert.ok(parsed.survey);
    assert.strictEqual(parsed.survey.id, surveyId);
    assert.ok(Array.isArray(parsed.questions));
    assert.ok(Array.isArray(parsed.responses));
    assert.strictEqual(typeof parsed.totalValidatedResponses, 'number');
  });

  test('6. Thoat ky tu CSV an toan khi cau tra loi co dau phay hoac ngoac kep', () => {
    const complexAnswer = {};
    complexAnswer[questionId] = 'Toi thich, "Shopee" va Lazada';

    db.prepare(`
      INSERT OR REPLACE INTO responses (id, survey_id, respondent_id, status, started_at, submitted_at, duration_sec, quality_score, points_rewarded, answers_payload)
      VALUES (?, ?, ?, 'VALIDATED', datetime('now', '-10 minutes'), datetime('now'), 120, 0.95, 500, ?)
    `).run(testRespId, surveyId, respondentId, JSON.stringify(complexAnswer));

    const req = {
      params: { id: surveyId },
      query: { format: 'csv' },
      user: creatorUser
    };
    const res = createMockRes();
    surveyController.exportSurveyData(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('""Shopee""'), 'Dau ngoac kep trong CSV phai duoc nhan doi');
  });

  console.log('---------------------------------------------------------------');
  console.log(`KET QUA KIEM THU: ${passedTests}/${totalTests} BAI THANH CONG (100% PASS)`);
  console.log('===============================================================');
} finally {
  try {
    db.exec('PRAGMA foreign_keys = OFF;');
    db.prepare('DELETE FROM responses WHERE id = ?').run(testRespId);
    db.prepare('DELETE FROM questions WHERE survey_id = ?').run(surveyId);
    db.prepare('DELETE FROM surveys WHERE id = ?').run(surveyId);
    db.prepare('DELETE FROM users WHERE id IN (?, ?, ?)').run(creatorId, respondentId, adminId);
    db.exec('PRAGMA foreign_keys = ON;');
  } catch (e) {
    console.warn('Loi don dep cuc bo:', e.message);
  }
  cleanAllTestData({ verbose: false });
}
