/**
 * TEST SUITE: TIMO VIETQR & PAYMENT WEBHOOK INTEGRATION
 * Muc tieu kiem thu:
 * 1. vietQrService: Sinh EMVCo TLV, CRC16, link anh fallback va parsePayload.
 * 2. ledgerService.createDepositOrder: Sinh ma don SURVxxxxxx, thong tin Timo (BIN 963388, STK 9021773148754, NGUYEN THANH TRUNG).
 * 3. ledgerService.completeDepositOrder & handlePaymentWebhook:
 *    - Khop chinh xac so tien: COMPLETED, cong Credit, ghi Double-Entry Ledger.
 *    - Lech so tien: PENDING_MISMATCH, chan cong Credit, giu an toan tai chinh.
 *    - Ho tro ca ma don moi SURVxxxxxx va ma don cu VIBExxxxxx.
 * 4. ledgerService.simulatePaymentSuccess: Mo phong thanh toan dev/staging.
 */

const assert = require('assert');
const crypto = require('crypto');
const db = require('../server/db/database');
const ledgerService = require('../server/services/ledgerService');
const vietQrService = require('../server/services/vietQrService');
const config = require('../server/config');

async function runTimoVietQrWebhookTests() {
  console.log('===============================================================');
  console.log('BAT DAU KIEM THU: CONG THANH TOAN TIMO VIETQR VA PAYMENT WEBHOOK');
  console.log('===============================================================');

  // Thiet lap cau hinh Timo VietQR chuan cho moi truong kiem thu
  const originalGatewayConfig = { ...config.PAYMENT_GATEWAY };
  config.PAYMENT_GATEWAY.BANK_ID = 'TIMO';
  config.PAYMENT_GATEWAY.BANK_BIN = '963388';
  config.PAYMENT_GATEWAY.BANK_NAME = 'Ngân hàng số Timo by BVBank';
  config.PAYMENT_GATEWAY.ACCOUNT_NUMBER = '9021773148754';
  config.PAYMENT_GATEWAY.ACCOUNT_NAME = 'NGUYEN THANH TRUNG';
  config.PAYMENT_GATEWAY.TEMPLATE = 'compact';

  const testUserId = 'test_timo_user_' + crypto.randomUUID();
  const testUserEmail = `timo_test_${Date.now()}@test.local`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, credit_balance, point_balance, fast_track_tickets, trust_score, status)
    VALUES (?, ?, 'dummy_hash', 'Nguyen Van Test', 'CREATOR', 0.0, 0, 0, 100.0, 'ACTIVE')
  `).run(testUserId, testUserEmail);

  try {
    // -------------------------------------------------------------
    // PHAN 1: KIEM TRA VIETQR SERVICE
    // -------------------------------------------------------------
    console.log('\n--- 1. Kiem tra vietQrService (EMVCo TLV, CRC16, parsePayload) ---');

    const qrParams = {
      bankBin: '963388',
      accountNumber: '9021773148754',
      accountName: 'NGUYEN THANH TRUNG',
      orderCode: 'SURV123456',
      amount: 50000,
      isDynamic: true
    };

    // 1.1 Sinh payload EMVCo
    const payload = vietQrService.generatePayload(qrParams);
    assert(typeof payload === 'string', 'Payload phai la string');
    assert(payload.startsWith('00020101021238'), 'Payload bat dau bang Tag 00 va Tag 01 dynamic (12)');
    assert(payload.includes('A000000727'), 'Chua Napas GUID A000000727');
    assert(payload.includes('963388'), 'Chua Bank BIN 963388');
    assert(payload.includes('9021773148754'), 'Chua STK 9021773148754');
    assert(payload.includes('50000'), 'Chua so tien 50000');
    assert(payload.includes('SURV123456'), 'Chua ma don SURV123456');
    assert(payload.includes('NGUYEN THANH TRUNG'), 'Chua ten chu tai khoan');
    assert(payload.includes('6304'), 'Chua tag 63 do dai 04');

    // Kiem tra tinh hop le cua CRC16 o cuoi payload
    const crcReported = payload.slice(-4);
    const crcCalculated = vietQrService.calculateCrc16(payload.slice(0, -4));
    assert.strictEqual(crcReported, crcCalculated, 'CRC16 cua payload phai khop voi gia tri tinh toan');
    console.log('  [PASS] 1.1 Sinh payload EMVCo hop le va dung chuan CRC16-CCITT');

    // 1.2 Sinh URL fallback
    const qrUrl = vietQrService.generateQrUrl(qrParams);
    assert(qrUrl.includes('api.vietqr.io/image/963388-9021773148754-compact.jpg'), 'URL chua dung endpoint va template compact');
    assert(qrUrl.includes('amount=50000'), 'URL fallback chua dung so tien');
    assert(qrUrl.includes('addInfo=SURV123456'), 'URL fallback chua ma don');
    assert(qrUrl.includes('accountName=NGUYEN%20THANH%20TRUNG'), 'URL fallback chua ten chu tai khoan');
    console.log('  [PASS] 1.2 Sinh link anh QR URL fallback chinh xac');

    // 1.3 Kiem tra parsePayload
    const parsed = vietQrService.parsePayload(payload);
    assert.strictEqual(parsed.isValid, true, 'Ket qua parse phai hop le');
    assert.strictEqual(parsed.isValidCrc, true, 'CRC phai hop le');
    assert.strictEqual(parsed.bankBin, '963388', 'bankBin boc tach phai la 963388');
    assert.strictEqual(parsed.accountNumber, '9021773148754', 'STK boc tach phai la 9021773148754');
    assert.strictEqual(parsed.amount, 50000, 'So tien boc tach phai la 50000');
    assert.strictEqual(parsed.orderCode, 'SURV123456', 'orderCode boc tach phai la SURV123456');
    assert.strictEqual(parsed.accountName, 'NGUYEN THANH TRUNG', 'Ten chu tai khoan boc tach phai dung');
    assert.strictEqual(parsed.currency, '704', 'Ma tien te phai la 704 (VND)');
    assert.strictEqual(parsed.countryCode, 'VN', 'Ma quoc gia phai la VN');
    console.log('  [PASS] 1.3 parsePayload boc tach day du va chinh xac du lieu');

    // -------------------------------------------------------------
    // PHAN 2: KIEM TRA CREATE DEPOSIT ORDER
    // -------------------------------------------------------------
    console.log('\n--- 2. Kiem tra ledgerService.createDepositOrder ---');

    const depositAmount = 50000;
    const orderResult = ledgerService.createDepositOrder(testUserId, depositAmount);

    assert.strictEqual(orderResult.success, true, 'createDepositOrder phai thanh cong');
    assert(orderResult.orderId, 'Phai co orderId');
    assert(typeof orderResult.orderCode === 'string', 'orderCode phai la string');
    assert(/^SURV\d{6}$/.test(orderResult.orderCode), `Ma don [${orderResult.orderCode}] phai co tien to SURV + 6 chu so`);
    assert.strictEqual(orderResult.amountVnd, depositAmount, 'So tien VND phai la 50000');
    assert(orderResult.qrUrl && orderResult.qrUrl.includes('963388'), 'qrUrl phai chua bankBin');
    assert(orderResult.qrPayload && orderResult.qrPayload.includes(orderResult.orderCode), 'qrPayload phai chua orderCode');

    // Kiem tra bankAccountInfo
    const bankInfo = orderResult.bankAccountInfo;
    assert.strictEqual(bankInfo.bank_bin || bankInfo.bankBin, '963388', 'Bank BIN phai la 963388');
    assert.strictEqual(bankInfo.account_number || bankInfo.accountNumber, '9021773148754', 'STK phai la 9021773148754');
    assert.strictEqual(bankInfo.account_name || bankInfo.accountName, 'NGUYEN THANH TRUNG', 'Ten phai la NGUYEN THANH TRUNG');
    assert.strictEqual(bankInfo.order_code || bankInfo.orderCode, orderResult.orderCode, 'orderCode trong bankInfo phai khop');

    // Kiem tra CSDL deposit_orders
    const dbOrder = db.prepare('SELECT * FROM deposit_orders WHERE id = ?').get(orderResult.orderId);
    assert(dbOrder, 'Don nap phai duoc luu trong bang deposit_orders');
    assert.strictEqual(dbOrder.status, 'PENDING', 'Trang thai khoi tao phai la PENDING');
    assert.strictEqual(dbOrder.order_code, orderResult.orderCode);
    assert.strictEqual(dbOrder.amount_vnd, depositAmount);

    console.log(`  [PASS] 2. Tao don nap tien thanh cong voi ma ${orderResult.orderCode} va thong tin ngan hang Timo`);

    // -------------------------------------------------------------
    // PHAN 3: KIEM TRA COMPLETE DEPOSIT ORDER VA WEBHOOK
    // -------------------------------------------------------------
    console.log('\n--- 3. Kiem tra completeDepositOrder va handlePaymentWebhook ---');

    // 3.1 Truong hop lech so tien tren completeDepositOrder
    console.log('  3.1 Kiem tra lech so tien -> PENDING_MISMATCH');
    const orderMismatch = ledgerService.createDepositOrder(testUserId, 100000);

    // Thu xac nhan voi so tien 80.000d (thieu)
    let caughtError = null;
    try {
      ledgerService.completeDepositOrder(orderMismatch.orderCode, 80000);
    } catch (err) {
      caughtError = err;
    }
    assert(caughtError, 'Phai nem ra ngoai le khi so tien khong khop');
    assert(caughtError.message.includes('khong khop'), 'Thong bao loi phai canh bao khong khop so tien');

    // Kiem tra trang thai don trong DB phai la PENDING_MISMATCH
    const dbOrderMismatch = db.prepare('SELECT * FROM deposit_orders WHERE id = ?').get(orderMismatch.orderId);
    assert.strictEqual(dbOrderMismatch.status, 'PENDING_MISMATCH', 'Trang thai don phai chuyen sang PENDING_MISMATCH');

    // Kiem tra so du vi cua user KHONG bi cong credit
    const userAfterMismatch = db.prepare('SELECT credit_balance FROM users WHERE id = ?').get(testUserId);
    assert.strictEqual(userAfterMismatch.credit_balance, 0, 'So du Credit van phai bang 0, khong duoc cong khi lech tien');
    console.log('  [PASS] 3.1 Bat ngoai le lech tien thanh cong, don chuyen sang PENDING_MISMATCH va khong cong Credit');

    // 3.2 Khop chinh xac so tien tren completeDepositOrder (sau khi da o PENDING_MISMATCH hoac PENDING)
    console.log('  3.2 Kiem tra khop chinh xac so tien -> COMPLETED va Double-Entry Ledger');
    const completeRes = ledgerService.completeDepositOrder(orderMismatch.orderCode, 100000, 'Test khop tien');
    assert.strictEqual(completeRes.success, true);
    assert.strictEqual(completeRes.orderCode, orderMismatch.orderCode);

    // Kiem tra DB don da COMPLETED
    const dbOrderCompleted = db.prepare('SELECT * FROM deposit_orders WHERE id = ?').get(orderMismatch.orderId);
    assert.strictEqual(dbOrderCompleted.status, 'COMPLETED', 'Don phai chuyen sang COMPLETED');
    assert(dbOrderCompleted.paid_at, 'Phai co moc thoi gian paid_at');

    // Kiem tra so du user: 100k nap + bonus 3% (3.000) = 103.000 Credit
    const userAfterCompleted = db.prepare('SELECT credit_balance FROM users WHERE id = ?').get(testUserId);
    assert.strictEqual(userAfterCompleted.credit_balance, 103000, 'So du phai duoc cong dung amount + bonus');

    // Kiem tra Double-Entry Ledger (point_transactions)
    const ledgerTxs = db.prepare(`
      SELECT * FROM point_transactions 
      WHERE user_id = ? AND tx_type = 'DEPOSIT_CREDIT' AND currency = 'VND'
      ORDER BY created_at ASC
    `).all(testUserId);
    assert(ledgerTxs.length >= 1, 'Phai co ban ghi ledger DEPOSIT_CREDIT');
    const baseTx = ledgerTxs.find(tx => tx.reference_id === null);
    assert(baseTx, 'Phai co giao dich nap goc');
    assert.strictEqual(baseTx.amount, 100000, 'So tien goc trong ledger phai la 100000');
    const bonusTx = ledgerTxs.find(tx => tx.reference_id === baseTx.id);
    assert(bonusTx, 'Phai co giao dich thuong bonus Credit');
    assert.strictEqual(bonusTx.amount, 3000, 'So tien bonus trong ledger phai la 3000');
    assert.strictEqual(bonusTx.balance_after, 103000, 'So du sau giao dich trong ledger phai la 103000');

    // Goi lai completeDepositOrder lan nua de kiem tra tinh idempotent
    const duplicateRes = ledgerService.completeDepositOrder(orderMismatch.orderCode, 100000);
    assert.strictEqual(duplicateRes.alreadyCompleted, true, 'Goi lai phai tra ve alreadyCompleted: true');
    const userAfterDup = db.prepare('SELECT credit_balance FROM users WHERE id = ?').get(testUserId);
    assert.strictEqual(userAfterDup.credit_balance, 103000, 'So du khong duoc cong them lan 2');
    console.log('  [PASS] 3.2 Khop dung so tien: Don COMPLETED, cong Credit, ghi Double-Entry Ledger va idempotent');

    // 3.3 Kiem tra handlePaymentWebhook voi ma don moi SURVxxxxxx
    console.log('  3.3 Kiem tra handlePaymentWebhook voi dinh dang SURVxxxxxx');
    const webhookSecret = config.PAYMENT_GATEWAY.WEBHOOK_SECRET || 'test_webhook_secret';
    config.PAYMENT_GATEWAY.WEBHOOK_SECRET = webhookSecret;

    // Kiem tra chan webhook khi sai secret trong che do production
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    assert.throws(() => {
      ledgerService.handlePaymentWebhook({ content: 'test' }, 'invalid_token');
    }, /Chữ ký hoặc mã xác thực webhook không hợp lệ/);
    process.env.NODE_ENV = oldEnv;

    const orderSurvWebhook = ledgerService.createDepositOrder(testUserId, 50000);

    const prevCredit = db.prepare('SELECT credit_balance FROM users WHERE id = ?').get(testUserId).credit_balance;

    const survWebhookPayload = {
      content: `Thanh toan don nap ${orderSurvWebhook.orderCode} qua Napas247`,
      transferAmount: 50000,
      referenceCode: 'FT2611049988',
      secure_token: webhookSecret
    };

    const survWebhookRes = ledgerService.handlePaymentWebhook(survWebhookPayload, webhookSecret);
    assert.strictEqual(survWebhookRes.success, true);
    assert.strictEqual(survWebhookRes.results.length, 1);
    assert.strictEqual(survWebhookRes.results[0].success, true);
    assert.strictEqual(survWebhookRes.results[0].orderCode, orderSurvWebhook.orderCode);

    const dbSurvOrder = db.prepare('SELECT status FROM deposit_orders WHERE id = ?').get(orderSurvWebhook.orderId);
    assert.strictEqual(dbSurvOrder.status, 'COMPLETED', 'Don SURV tu webhook phai thanh COMPLETED');

    const expectedBonus50k = 50000 * 0.02; // 1.000 Credit
    const expectedCreditAfterSurv = prevCredit + 50000 + expectedBonus50k;
    const userAfterSurvWebhook = db.prepare('SELECT credit_balance FROM users WHERE id = ?').get(testUserId);
    assert.strictEqual(userAfterSurvWebhook.credit_balance, expectedCreditAfterSurv, 'So du phai duoc cong chinh xac sau webhook SURV');
    console.log('  [PASS] 3.3 handlePaymentWebhook xu ly thanh cong ma don SURVxxxxxx va xac thuc token');

    // 3.4 Kiem tra handlePaymentWebhook tuong thich nguoc voi ma don cu VIBExxxxxx
    console.log('  3.4 Kiem tra handlePaymentWebhook tuong thich nguoc ma don VIBExxxxxx');
    const legacyOrderCode = 'VIBE' + Math.floor(100000 + Math.random() * 900000);
    const legacyOrderId = 'dep_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO deposit_orders (
        id, user_id, order_code, amount_vnd, credit_amount, bonus_credit_vnd, status, payment_method, expires_at
      ) VALUES (?, ?, ?, 60000, 60000, 0, 'PENDING', 'VIETQR', datetime('now', '+15 minutes'))
    `).run(legacyOrderId, testUserId, legacyOrderCode);

    const legacyWebhookPayload = {
      description: `MBVCB.78910.CT TU NGUYEN A ${legacyOrderCode}`,
      amount: 60000,
      secure_token: webhookSecret
    };

    const legacyWebhookRes = ledgerService.handlePaymentWebhook(legacyWebhookPayload, webhookSecret);
    assert.strictEqual(legacyWebhookRes.success, true);
    assert.strictEqual(legacyWebhookRes.results.length, 1);
    assert.strictEqual(legacyWebhookRes.results[0].success, true);
    assert.strictEqual(legacyWebhookRes.results[0].orderCode, legacyOrderCode);

    const dbLegacyOrder = db.prepare('SELECT status FROM deposit_orders WHERE id = ?').get(legacyOrderId);
    assert.strictEqual(dbLegacyOrder.status, 'COMPLETED', 'Don cu VIBE phai hoan tat COMPLETED');
    console.log('  [PASS] 3.4 handlePaymentWebhook tuong thich nguoc 100% voi ma don VIBExxxxxx');

    // 3.5 Kiem tra handlePaymentWebhook khi gap giao dich lech so tien
    console.log('  3.5 Kiem tra handlePaymentWebhook khi thuc chuyen lech so tien');
    const orderMismatchWebhook = ledgerService.createDepositOrder(testUserId, 200000);

    const creditBeforeMismatchHook = db.prepare('SELECT credit_balance FROM users WHERE id = ?').get(testUserId).credit_balance;

    const mismatchHookPayload = {
      content: `Nap ${orderMismatchWebhook.orderCode}`,
      transferAmount: 150000, // Thieu 50k
      secure_token: webhookSecret
    };

    const mismatchHookRes = ledgerService.handlePaymentWebhook(mismatchHookPayload, webhookSecret);
    assert.strictEqual(mismatchHookRes.success, true, 'Webhook tra ve ket qua tong quan');
    assert.strictEqual(mismatchHookRes.results.length, 1);
    assert.strictEqual(mismatchHookRes.results[0].success, false, 'Giao dich lech tien phai danh dau that bai');
    assert(mismatchHookRes.results[0].error.includes('khong khop'), 'Loi phai thong bao lech tien');

    const dbMismatchOrder = db.prepare('SELECT status FROM deposit_orders WHERE id = ?').get(orderMismatchWebhook.orderId);
    assert.strictEqual(dbMismatchOrder.status, 'PENDING_MISMATCH', 'Trang thai don phai la PENDING_MISMATCH');

    const creditAfterMismatchHook = db.prepare('SELECT credit_balance FROM users WHERE id = ?').get(testUserId).credit_balance;
    assert.strictEqual(creditAfterMismatchHook, creditBeforeMismatchHook, 'So du vi tuyet doi khong duoc thay doi khi webhook lech tien');
    console.log('  [PASS] 3.5 Webhook lech so tien xu ly an toan: ghi nhan PENDING_MISMATCH va bao toan so du');

    // -------------------------------------------------------------
    // PHAN 4: KIEM TRA MO PHONG THANH TOAN (SIMULATE PAYMENT SUCCESS)
    // -------------------------------------------------------------
    console.log('\n--- 4. Kiem tra ledgerService.simulatePaymentSuccess ---');

    const orderSimulate = ledgerService.createDepositOrder(testUserId, 70000);

    const simCreditBefore = db.prepare('SELECT credit_balance FROM users WHERE id = ?').get(testUserId).credit_balance;

    const simRes = ledgerService.simulatePaymentSuccess(orderSimulate.orderCode, testUserId);
    assert.strictEqual(simRes.success, true);
    assert.strictEqual(simRes.orderCode, orderSimulate.orderCode);

    const dbSimOrder = db.prepare('SELECT status FROM deposit_orders WHERE id = ?').get(orderSimulate.orderId);
    assert.strictEqual(dbSimOrder.status, 'COMPLETED', 'Don nap mo phong phai chuyen sang COMPLETED');

    const bonus70k = 70000 * 0.02; // Moc 50k - duoi 100k: 2% = 1.400 Credit
    const expectedSimCredit = simCreditBefore + 70000 + bonus70k;
    const simCreditAfter = db.prepare('SELECT credit_balance FROM users WHERE id = ?').get(testUserId).credit_balance;
    assert.strictEqual(simCreditAfter, expectedSimCredit, 'So du sau simulate phai duoc cong day du');

    // Kiem tra bat loi khi don khong ton tai
    assert.throws(() => {
      ledgerService.simulatePaymentSuccess('SURV999999', testUserId);
    }, /Don nap tien khong ton tai/);

    console.log('  [PASS] 4. Mo phong thanh toan simulatePaymentSuccess hoat dong dung quy trinh va bao mat');

    console.log('\n===============================================================');
    console.log('TAT CA CAC BAI KIEM THU TIMO VIETQR & PAYMENT WEBHOOK DAT 100% PASS!');
    console.log('===============================================================');
  } finally {
    // Khoi phuc config goc
    Object.assign(config.PAYMENT_GATEWAY, originalGatewayConfig);

    // Don dep du lieu kiem thu de tranh lam rac CSDL
    console.log('\n--- Don dep du lieu test ---');
    try {
      db.prepare('DELETE FROM deposit_orders WHERE user_id = ?').run(testUserId);
      db.prepare('DELETE FROM point_transactions WHERE user_id = ?').run(testUserId);
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(testUserId);
      db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
      console.log('  [PASS] Da don dep sach du lieu test tam thoi.');
    } catch (cleanErr) {
      console.error('Loi khi don dep du lieu test:', cleanErr.message);
    }
  }
}

if (require.main === module) {
  runTimoVietQrWebhookTests().catch(err => {
    console.error('Loi test:', err);
    process.exit(1);
  });
}

module.exports = runTimoVietQrWebhookTests;
