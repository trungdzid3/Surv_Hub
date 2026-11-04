/**
 * TEST SUITE TANG 27: STREAK BENEFITS (KE_HOACH_UU_DAI_CHUOI_DIEM_DANH.md)
 * Muc tieu kiem thu:
 * 1. Migration: daily_streaks co 3 cot moi (streak_freezes_count, claimed_milestones_json, last_freeze_used_at),
 *    CHECK point_transactions da mo rong STREAK_MILESTONE_REWARD / STREAK_SURVEY_BONUS.
 * 2. Config ECONOMICS.STREAK: BONUS_TIERS, MILESTONES, MAX_FREEZE_TICKETS dung contract.
 * 3. userController.checkin: Freeze Engine lazy — gap 1 noi chuan, gap 2 tru 1 ve, gap 3 tru 2 ve,
 *    thieu ve / gap > 3 reset ve Ngay 1, khong tra ve khi gap qua dai.
 * 4. userController.getStreakInfo: contract moi (multiplier_percent, tier, tickets, milestones, gate, pending preview).
 * 5. userController.claimMilestone: ENTERPRISE 403, mốc sai 400, gate VALIDATED 403, nhan thanh cong ACID, idempotent, cap ticket.
 * 6. ledgerService.rewardStreakMilestone: cong Point, tang ve khong vuot tran, ghi STREAK_MILESTONE_REWARD.
 * 7. ledgerService.rewardSurveyCompletion: bonus cung transaction, 2 dong tx, points_rewarded = base + bonus,
 *    escrow chi giam dung cost_per_response, tuong thich nguoc khi khong truyen bonus.
 */

const assert = require('assert');
const crypto = require('crypto');
const db = require('../server/db/database');
const ledgerService = require('../server/services/ledgerService');
const config = require('../server/config');
const userController = require('../server/controllers/userController');

// Helper ngay VN (dong bo voi userController)
function vnTodayStr() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}
function vnDateOffset(dateStr, offsetDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + offsetDays);
  return dt.toISOString().slice(0, 10);
}

// Mock req/res cho controller
function mockReq(user, body) {
  return { user: { id: user.id, role: user.role }, body: body || {}, ip: '127.0.0.1' };
}
function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; }
  };
}

async function runStreakBenefitsTests() {
  console.log('===============================================================');
  console.log('BAT DAU KIEM THU: STREAK BENEFITS (BONUS + HOP QUA + VE CUU CHUOI)');
  console.log('===============================================================');

  const today = vnTodayStr();
  const testUserIds = [];
  const testSurveyIds = [];

  function createTestUser(role) {
    const id = 'test_streak_user_' + crypto.randomUUID();
    const email = `streak_test_${Date.now()}_${Math.floor(Math.random() * 100000)}@test.local`;
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, point_balance, trust_score, status)
      VALUES (?, ?, 'dummy_hash', 'Nguoi Dien Test', ?, 0, 100.0, 'ACTIVE')
    `).run(id, email, role || 'RESPONDENT');
    testUserIds.push(id);
    return { id, role: role || 'RESPONDENT' };
  }

  function setStreakState(userId, { currentStreak, lastCheckinDate, freezes, claimed }) {
    db.prepare(`
      INSERT INTO daily_streaks (user_id, current_streak, max_streak, last_checkin_date, total_points_earned, streak_freezes_count, claimed_milestones_json)
      VALUES (?, ?, ?, ?, 0, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        current_streak = excluded.current_streak,
        max_streak = excluded.max_streak,
        last_checkin_date = excluded.last_checkin_date,
        streak_freezes_count = excluded.streak_freezes_count,
        claimed_milestones_json = excluded.claimed_milestones_json
    `).run(userId, currentStreak, currentStreak, lastCheckinDate, freezes || 0, JSON.stringify(claimed || []));
  }

  try {
    // -------------------------------------------------------------
    // PHAN 1: MIGRATION & CONFIG CONTRACT
    // -------------------------------------------------------------
    console.log('\n--- 1. Migration & Config contract ---');

    const cols = db.prepare("PRAGMA table_info(daily_streaks)").all().map(c => c.name);
    assert(cols.includes('streak_freezes_count'), 'Thieu cot streak_freezes_count');
    assert(cols.includes('claimed_milestones_json'), 'Thieu cot claimed_milestones_json');
    assert(cols.includes('last_freeze_used_at'), 'Thieu cot last_freeze_used_at');
    console.log('  [PASS] 1.1 daily_streaks co du 3 cot moi');

    const txTable = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'point_transactions'").get();
    assert(txTable.sql.includes('STREAK_MILESTONE_REWARD'), 'CHECK tx_type thieu STREAK_MILESTONE_REWARD');
    assert(txTable.sql.includes('STREAK_SURVEY_BONUS'), 'CHECK tx_type thieu STREAK_SURVEY_BONUS');
    console.log('  [PASS] 1.2 CHECK point_transactions da mo rong 2 tx_type Streak');

    const streakCfg = config.ECONOMICS.STREAK;
    assert(streakCfg.MAX_FREEZE_TICKETS === 2, 'MAX_FREEZE_TICKETS phai bang 2');
    assert(streakCfg.MILESTONES[10].points === 1000, 'Moc 10 ngay phai 1000 Point');
    assert(streakCfg.MILESTONES[50].points === 3000 && streakCfg.MILESTONES[50].freezeTickets === 1, 'Moc 50 ngay phai 3000 Point + 1 ve');
    assert(streakCfg.MILESTONES[100].points === 10000 && streakCfg.MILESTONES[100].freezeTickets === 1, 'Moc 100 ngay phai 10000 Point + 1 ve');
    assert(streakCfg.MILESTONES[200].points === 25000 && streakCfg.MILESTONES[200].freezeTickets === 1, 'Moc 200 ngay phai 25000 Point + 1 ve');
    const tier201 = streakCfg.BONUS_TIERS.find(t => t.minDay === 201);
    const tier11 = streakCfg.BONUS_TIERS.find(t => t.minDay === 11);
    assert(tier201.percent === 10 && tier11.percent === 3, 'He so bonus phai la 3/5/8/10 theo cap');
    console.log('  [PASS] 1.3 ECONOMICS.STREAK dung contract (bonus 3/5/8/10, moc 1k/3k/10k/25k, tran 2 ve)');

    // -------------------------------------------------------------
    // PHAN 2: FREEZE ENGINE TRONG CHECKIN
    // -------------------------------------------------------------
    console.log('\n--- 2. Freeze Engine (userController.checkin) ---');

    // 2.1 Diem danh lan dau
    const uA = createTestUser('RESPONDENT');
    let res = mockRes();
    userController.checkin(mockReq(uA), res);
    assert.strictEqual(res.statusCode, 200, 'Checkin lan dau phai tra 200');
    assert.strictEqual(res.body.success, true, 'Checkin lan dau that bai');
    assert.strictEqual(res.body.streak.current_streak, 1, 'Lan dau phai la Ngay 1');
    assert.strictEqual(res.body.streak.freeze_used, 0, 'Khong duoc dung ve khi bat dau chuoi');
    console.log('  [PASS] 2.1 Checkin lan dau: Ngay 1, khong dung ve');

    // 2.2 Gap 1 ngay: noi chuan
    const uB = createTestUser('RESPONDENT');
    setStreakState(uB.id, { currentStreak: 10, lastCheckinDate: vnDateOffset(today, -1), freezes: 1 });
    res = mockRes();
    userController.checkin(mockReq(uB), res);
    assert.strictEqual(res.body.success, true, 'Checkin gap 1 that bai');
    assert.strictEqual(res.body.streak.current_streak, 11, 'Gap 1 phai noi chuoi 10 -> 11');
    assert.strictEqual(res.body.streak.freeze_used, 0, 'Gap 1 khong duoc dung ve');
    assert.strictEqual(res.body.streak.freeze_remaining, 1, 'Ve phai duoc giu nguyen');
    console.log('  [PASS] 2.2 Gap 1 ngay: noi chuoi 10 -> 11 khong phai ve');

    // 2.3 Gap 2 ngay co 1 ve: dung 1 ve bao toan chuoi
    const uC = createTestUser('RESPONDENT');
    setStreakState(uC.id, { currentStreak: 10, lastCheckinDate: vnDateOffset(today, -2), freezes: 1 });
    res = mockRes();
    userController.checkin(mockReq(uC), res);
    assert.strictEqual(res.body.success, true, 'Checkin gap 2 that bai');
    assert.strictEqual(res.body.streak.current_streak, 11, 'Gap 2 + 1 ve phai bao toan chuoi 10 -> 11');
    assert.strictEqual(res.body.streak.freeze_used, 1, 'Gap 2 phai tru dung 1 ve');
    assert.strictEqual(res.body.streak.freeze_remaining, 0, 'Sau khi tru con 0 ve');
    const dbFreezeC = db.prepare('SELECT streak_freezes_count FROM daily_streaks WHERE user_id = ?').get(uC.id);
    assert.strictEqual(dbFreezeC.streak_freezes_count, 0, 'DB phai ghi nhan 0 ve con lai');
    console.log('  [PASS] 2.3 Gap 2 ngay: tru 1 ve, bao toan chuoi');

    // 2.4 Gap 3 ngay co 2 ve: dung 2 ve
    const uD = createTestUser('RESPONDENT');
    setStreakState(uD.id, { currentStreak: 12, lastCheckinDate: vnDateOffset(today, -3), freezes: 2 });
    res = mockRes();
    userController.checkin(mockReq(uD), res);
    assert.strictEqual(res.body.streak.current_streak, 13, 'Gap 3 + 2 ve phai bao toan chuoi 12 -> 13');
    assert.strictEqual(res.body.streak.freeze_used, 2, 'Gap 3 phai tru dung 2 ve');
    assert.strictEqual(res.body.streak.freeze_remaining, 0, 'Sau khi tru con 0 ve');
    console.log('  [PASS] 2.4 Gap 3 ngay: tru 2 ve, bao toan chuoi');

    // 2.5 Gap 3 ngay chi co 1 ve: thieu ve -> reset, KHONG tra ve
    const uE = createTestUser('RESPONDENT');
    setStreakState(uE.id, { currentStreak: 12, lastCheckinDate: vnDateOffset(today, -3), freezes: 1 });
    res = mockRes();
    userController.checkin(mockReq(uE), res);
    assert.strictEqual(res.body.streak.current_streak, 1, 'Gap 3 + 1 ve phai reset ve Ngay 1');
    assert.strictEqual(res.body.streak.freeze_used, 0, 'Khong duoc tru ve khi khong du so luong');
    const dbFreezeE = db.prepare('SELECT streak_freezes_count FROM daily_streaks WHERE user_id = ?').get(uE.id);
    assert.strictEqual(dbFreezeE.streak_freezes_count, 1, 'Ve phai duoc giu nguyen khi reset');
    console.log('  [PASS] 2.5 Gap 3 ngay thieu ve: reset Ngay 1, giu nguyen ve');

    // 2.6 Gap > 3 ngay co du 2 ve: van reset (khong cuu duoc)
    const uF = createTestUser('RESPONDENT');
    setStreakState(uF.id, { currentStreak: 30, lastCheckinDate: vnDateOffset(today, -6), freezes: 2 });
    res = mockRes();
    userController.checkin(mockReq(uF), res);
    assert.strictEqual(res.body.streak.current_streak, 1, 'Gap > 3 phai reset ve Ngay 1');
    assert.strictEqual(res.body.streak.freeze_used, 0, 'Gap > 3 khong tra ve (khong cuu duoc)');
    console.log('  [PASS] 2.6 Gap > 3 ngay: reset bo chuoi du co du ve');

    // -------------------------------------------------------------
    // PHAN 3: STREAK-INFO CONTRACT MOI
    // -------------------------------------------------------------
    console.log('\n--- 3. GET /users/streak-info contract moi ---');

    const uG = createTestUser('RESPONDENT');
    setStreakState(uG.id, { currentStreak: 60, lastCheckinDate: today, freezes: 1, claimed: [10] });
    res = mockRes();
    userController.getStreakInfo(mockReq(uG), res);
    assert.strictEqual(res.body.success, true, 'getStreakInfo that bai');
    const sInfo = res.body.streak;
    assert.strictEqual(sInfo.streak_freezes_count, 1, 'streak_freezes_count sai');
    assert.strictEqual(sInfo.multiplier_percent, 5, 'Chuoi 60 ngay phai nhan +5%');
    assert.strictEqual(sInfo.tier_level, 3, 'Chuoi 60 ngay phai tier 3');
    assert.strictEqual(sInfo.tier_name, 'Hồng Neon Tím TikTok', 'Ten tier 3 sai');
    assert.deepStrictEqual(sInfo.claimed_milestones, [10], 'claimed_milestones sai');
    assert.strictEqual(sInfo.eligible_unclaimed_milestone, 50, 'Chuoi 60 da nhan moc 10 phai chot moc 50 cao nhat chua nhan');
    assert(typeof sInfo.milestone_gate_passed === 'boolean', 'Thieu milestone_gate_passed');
    assert(typeof sInfo.pending_freeze_consumption === 'number', 'Thieu pending_freeze_consumption');
    assert(Array.isArray(sInfo.milestones) && sInfo.milestones.length === 4, 'Thieu danh sach milestones');
    console.log('  [PASS] 3.1 Contract moi day du: multiplier/tier/tickets/milestones/gate');

    // 3.2 Pending freeze preview: gap 2 con 1 ve -> preview se tru 1
    const uH = createTestUser('RESPONDENT');
    setStreakState(uH.id, { currentStreak: 15, lastCheckinDate: vnDateOffset(today, -2), freezes: 1 });
    res = mockRes();
    userController.getStreakInfo(mockReq(uH), res);
    assert.strictEqual(res.body.streak.pending_freeze_consumption, 1, 'Preview gap 2 phai la 1 ve');
    const beforeCheckinH = db.prepare('SELECT streak_freezes_count FROM daily_streaks WHERE user_id = ?').get(uH.id);
    assert.strictEqual(beforeCheckinH.streak_freezes_count, 1, 'getStreakInfo tuyet doi khong ghi DB (non-destructive)');
    console.log('  [PASS] 3.2 Preview pending_freeze_consumption khong pha DB');

    // 3.3 Chuoi 5 ngay: multiplier 0%, tier 1
    const uI = createTestUser('RESPONDENT');
    setStreakState(uI.id, { currentStreak: 5, lastCheckinDate: today });
    res = mockRes();
    userController.getStreakInfo(mockReq(uI), res);
    assert.strictEqual(res.body.streak.multiplier_percent, 0, 'Chuoi 5 ngay phai 0% bonus');
    assert.strictEqual(res.body.streak.tier_level, 1, 'Chuoi 5 ngay phai tier 1');
    console.log('  [PASS] 3.3 Chuoi nhan: 0% bonus, tier 1');

    // -------------------------------------------------------------
    // PHAN 4: CLAIM MILESTONE (CONTROLLER + LEDGER)
    // -------------------------------------------------------------
    console.log('\n--- 4. POST /users/streak-claim-milestone ---');

    // 4.1 CREATOR (Doanh nghiep) bi chan 403
    const uJ = createTestUser('CREATOR');
    setStreakState(uJ.id, { currentStreak: 100, lastCheckinDate: today });
    res = mockRes();
    userController.claimMilestone(mockReq(uJ, { milestone_day: 10 }), res);
    assert.strictEqual(res.statusCode, 403, 'CREATOR phai bi chan 403');
    console.log('  [PASS] 4.1 CREATOR (Doanh nghiep) bi chan 403');

    // 4.2 Moc khong hop le 400
    const uK = createTestUser('RESPONDENT');
    setStreakState(uK.id, { currentStreak: 12, lastCheckinDate: today });
    res = mockRes();
    userController.claimMilestone(mockReq(uK, { milestone_day: 35 }), res);
    assert.strictEqual(res.statusCode, 400, 'Moc 35 ngay phai 400');
    console.log('  [PASS] 4.2 Moc khong ton tai 400');

    // 4.3 Chua du chuoi 400
    res = mockRes();
    userController.claimMilestone(mockReq(uK, { milestone_day: 50 }), res);
    assert.strictEqual(res.statusCode, 400, 'Chuoi 12 ngay xin moc 50 phai 400');
    console.log('  [PASS] 4.3 Chua du chuoi 400');

    // 4.4 Gate VALIDATED: chua co phan hoi -> 403
    res = mockRes();
    userController.claimMilestone(mockReq(uK, { milestone_day: 10 }), res);
    assert.strictEqual(res.statusCode, 403, 'Chua co phan hoi VALIDATED phai 403');
    console.log('  [PASS] 4.4 Gate hoat dong that: khong co phan hoi VALIDATED -> 403');

    // 4.5 Them phan hoi VALIDATED trong 7 ngay -> nhan thanh cong moc 10
    const surveyId = 'test_streak_survey_' + crypto.randomUUID();
    testSurveyIds.push(surveyId);
    db.prepare(`
      INSERT INTO surveys (id, creator_id, title, description, category, target_responses, collected_responses,
                           cost_per_response, reward_points_per_response, escrow_locked_balance, min_completion_time_sec, status)
      VALUES (?, ?, 'Survey Streak Test', 'Desc', 'Test', 100, 0, 3000, 180, 300000, 15, 'ACTIVE')
    `).run(surveyId, uK.id);
    const respId = 'test_streak_resp_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO responses (id, survey_id, respondent_id, status, submitted_at, started_at)
      VALUES (?, ?, ?, 'VALIDATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(respId, surveyId, uK.id);

    const balanceBefore = db.prepare('SELECT point_balance FROM users WHERE id = ?').get(uK.id).point_balance;
    res = mockRes();
    userController.claimMilestone(mockReq(uK, { milestone_day: 10 }), res);
    assert.strictEqual(res.statusCode, 200, 'Nhan moc 10 hop le phai 200');
    assert.strictEqual(res.body.points_awarded, 1000, 'Moc 10 phai tang 1000 Point');
    assert.strictEqual(res.body.badge, 'Tân Binh Bền Bỉ', 'Moc 10 phai tang huy hieu Tan Binh Ben Bi');
    const balanceAfter = db.prepare('SELECT point_balance FROM users WHERE id = ?').get(uK.id).point_balance;
    assert.strictEqual(balanceAfter - balanceBefore, 1000, 'So du phai tang dung 1000');
    const claimedJson = JSON.parse(db.prepare('SELECT claimed_milestones_json FROM daily_streaks WHERE user_id = ?').get(uK.id).claimed_milestones_json);
    assert(claimedJson.includes(10), 'claimed_milestones_json phai ghi nhan moc 10');
    const txRow = db.prepare("SELECT amount FROM point_transactions WHERE user_id = ? AND tx_type = 'STREAK_MILESTONE_REWARD' AND reference_id = ?").get(uK.id, 'streak_milestone_10');
    assert(txRow && txRow.amount === 1000, 'Thieu dong so cai STREAK_MILESTONE_REWARD');
    console.log('  [PASS] 4.5 Nhan moc 10 thanh cong: +1000 Point, badge, so cai kep');

    // 4.6 Idempotent: nhan lai moc 10 -> 400
    res = mockRes();
    userController.claimMilestone(mockReq(uK, { milestone_day: 10 }), res);
    assert.strictEqual(res.statusCode, 400, 'Nhan lai moc 10 phai 400');
    const balanceIdem = db.prepare('SELECT point_balance FROM users WHERE id = ?').get(uK.id).point_balance;
    assert.strictEqual(balanceIdem, balanceAfter, 'Khong duoc cong diem lan thu hai');
    console.log('  [PASS] 4.6 Chong nhan trung: lan 2 ve moc da nhan 400');

    // 4.7 Tran ve: dang co 2 ve, nhan moc 50 (tang 1 ve) -> van gioi han 2
    const uL = createTestUser('RESPONDENT');
    setStreakState(uL.id, { currentStreak: 60, lastCheckinDate: today, freezes: 2, claimed: [10] });
    const respIdL = 'test_streak_resp_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO responses (id, survey_id, respondent_id, status, submitted_at, started_at)
      VALUES (?, ?, ?, 'VALIDATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(respIdL, surveyId, uL.id);
    res = mockRes();
    userController.claimMilestone(mockReq(uL, { milestone_day: 50 }), res);
    assert.strictEqual(res.statusCode, 200, 'Nhan moc 50 phai 200');
    assert.strictEqual(res.body.freeze_tickets_awarded, 0, 'Tran 2 ve phai khong tang them');
    const freezeL = db.prepare('SELECT streak_freezes_count FROM daily_streaks WHERE user_id = ?').get(uL.id);
    assert.strictEqual(freezeL.streak_freezes_count, 2, 'So ve phai dung tran 2');
    console.log('  [PASS] 4.7 Tran MAX_FREEZE_TICKETS=2 duoc bao toan');

    // -------------------------------------------------------------
    // PHAN 5: BONUS SURVEY TRONG REWARDSURVEYCOMPLETION
    // -------------------------------------------------------------
    console.log('\n--- 5. ledgerService.rewardSurveyCompletion (Streak Bonus) ---');

    const uM = createTestUser('RESPONDENT');
    const surveyIdM = 'test_streak_survey_' + crypto.randomUUID();
    testSurveyIds.push(surveyIdM);
    db.prepare(`
      INSERT INTO surveys (id, creator_id, title, description, category, target_responses, collected_responses,
                           cost_per_response, reward_points_per_response, escrow_locked_balance, min_completion_time_sec, status)
      VALUES (?, ?, 'Survey Bonus Test', 'Desc', 'Test', 100, 0, 3000, 180, 300000, 15, 'ACTIVE')
    `).run(surveyIdM, uM.id);

    // 5.1 Co bonus: user nhan 180 + 14 = 194, 2 dong tx, escrow giam dung 3000
    const respIdM1 = 'test_streak_resp_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO responses (id, survey_id, respondent_id, status, started_at)
      VALUES (?, ?, ?, 'IN_PROGRESS', CURRENT_TIMESTAMP)
    `).run(respIdM1, surveyIdM, uM.id);
    const balM0 = db.prepare('SELECT point_balance FROM users WHERE id = ?').get(uM.id).point_balance;

    const reward1 = ledgerService.rewardSurveyCompletion(surveyIdM, uM.id, respIdM1, 180, 3000, 14, 'Băng Hỏa Điện Quang');
    assert.strictEqual(reward1.success, true, 'rewardSurveyCompletion that bai');
    assert.strictEqual(reward1.streakBonusPoints, 14, 'Bonus tra ve phai la 14');
    const balM1 = db.prepare('SELECT point_balance FROM users WHERE id = ?').get(uM.id).point_balance;
    assert.strictEqual(balM1 - balM0, 194, 'User phai nhan dung 180 + 14 = 194');
    const respM1 = db.prepare('SELECT points_rewarded FROM responses WHERE id = ?').get(respIdM1);
    assert.strictEqual(respM1.points_rewarded, 194, 'points_rewarded phai ghi tong 194');
    const escrowM = db.prepare('SELECT escrow_locked_balance FROM surveys WHERE id = ?').get(surveyIdM);
    assert.strictEqual(escrowM.escrow_locked_balance, 297000, 'Escrow phai chi giam dung 3000 (khong phu thuoc bonus)');
    const txsM1 = db.prepare("SELECT tx_type, amount, balance_after FROM point_transactions WHERE user_id = ? AND reference_id = ? ORDER BY created_at").all(uM.id, respIdM1);
    assert.strictEqual(txsM1.length, 2, 'Phai co dung 2 dong so cai');
    assert(txsM1.some(t => t.tx_type === 'SURVEY_REWARD' && t.amount === 180), 'Thieu SURVEY_REWARD 180');
    assert(txsM1.some(t => t.tx_type === 'STREAK_SURVEY_BONUS' && t.amount === 14), 'Thieu STREAK_SURVEY_BONUS 14');
    const txBase = txsM1.find(t => t.tx_type === 'SURVEY_REWARD');
    assert.strictEqual(txBase.balance_after, balM1 - 14, 'balance_after cua dong goc phai tru truoc bonus');
    console.log('  [PASS] 5.1 Bonus cung ACID: 194 diem, 2 dong tx, escrow giam dung cost');

    // 5.2 Khong truyen bonus (tuong thich nguoc): chi 1 dong tx (dang vien thu 2)
    const uN = createTestUser('RESPONDENT');
    const respIdM2 = 'test_streak_resp_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO responses (id, survey_id, respondent_id, status, started_at)
      VALUES (?, ?, ?, 'IN_PROGRESS', CURRENT_TIMESTAMP)
    `).run(respIdM2, surveyIdM, uN.id);
    const reward2 = ledgerService.rewardSurveyCompletion(surveyIdM, uN.id, respIdM2, 180, 3000);
    assert.strictEqual(reward2.streakBonusPoints, 0, 'Khong truyen bonus phai la 0');
    const txsM2 = db.prepare("SELECT tx_type FROM point_transactions WHERE user_id = ? AND reference_id = ?").all(uN.id, respIdM2);
    assert.strictEqual(txsM2.length, 1, 'Khong bonus chi duoc 1 dong tx');
    assert.strictEqual(txsM2[0].tx_type, 'SURVEY_REWARD', 'Dong duy nhat phai la SURVEY_REWARD');
    console.log('  [PASS] 5.2 Tuong thich nguoc: khong bonus thi 1 dong tx duy nhat');

    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log('TAT CA BAI KIEM THU STREAK BENEFITS DAT 100% PASS!');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL] Loi kiem thu Streak Benefits:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    // -------------------------------------------------------------
    // DON DEP DU LIEU TEST
    // -------------------------------------------------------------
    console.log('\n--- Don dep du lieu test ---');
    try {
      for (const uid of testUserIds) {
        db.prepare("DELETE FROM point_transactions WHERE user_id = ?").run(uid);
        db.prepare("DELETE FROM daily_streaks WHERE user_id = ?").run(uid);
        db.prepare("DELETE FROM responses WHERE respondent_id = ?").run(uid);
        db.prepare("DELETE FROM notifications WHERE user_id = ?").run(uid);
        db.prepare("DELETE FROM users WHERE id = ?").run(uid);
      }
      for (const sid of testSurveyIds) {
        db.prepare("DELETE FROM responses WHERE survey_id = ?").run(sid);
        db.prepare("DELETE FROM surveys WHERE id = ?").run(sid);
      }
      console.log('  [PASS] Da don dep du lieu test tam thoi.');
    } catch (cleanErr) {
      console.error('  [WARN] Loi don dep (khong anh huong ket qua):', cleanErr.message);
    }
  }
}

runStreakBenefitsTests();
