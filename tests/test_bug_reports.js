process.env.NODE_ENV = 'test';
process.env.DISABLE_REAL_EMAIL = 'true';

const assert = require('node:assert');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const app = require('../server/app');
const db = require('../server/db/database');
const config = require('../server/config');
const { cleanAllTestData } = require('./test_cleanup_helper');

async function runTests() {
  console.log('=== BAT DAU KIEM THU HE THONG BAO LOI & DANG TAI MINH CHUNG ===');

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  const uniqueSuffix = Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  const adminId = 'bugtest_admin_' + crypto.randomUUID();
  const adminEmail = `admin_bugtest_${uniqueSuffix}@test.local`;
  let reportId = null;
  let uploadedMediaId = null;

  try {
    // 1. Tao tai khoan Admin test tam thoi va sinh JWT hop le
    console.log('1. Khoi tao tai khoan Admin test tam thoi...');
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, status, is_email_verified, trust_score)
      VALUES (?, ?, ?, 'Admin Bug Tester', 'ADMIN', 'ACTIVE', 1, 100)
    `).run(adminId, adminEmail, 'test_hash_' + crypto.randomBytes(8).toString('hex'));

    const adminToken = jwt.sign(
      { id: adminId, email: adminEmail, role: 'ADMIN' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('  PASS: Tao tai khoan Admin test tam thoi thanh cong!');

    // 2. Gui anh chup man hinh minh chung len /api/v1/upload/image
    console.log('2. Tai anh chup man hinh minh chung len /api/v1/upload/image...');
    const dummy1x1Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await fetch(`${baseUrl}/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        image_data: dummy1x1Png,
        type: 'bug'
      })
    });
    const uploadBody = await uploadRes.json();
    assert.strictEqual(uploadRes.status, 201, 'Upload anh that bai: ' + JSON.stringify(uploadBody));
    assert.ok(uploadBody.url, 'Phai tra ve URL anh');
    const imageUrl = uploadBody.url;
    const matchMedia = imageUrl.match(/\/media\/([^/?#]+)/);
    if (matchMedia) uploadedMediaId = matchMedia[1];
    console.log('  PASS: Tai anh thanh cong ->', imageUrl);

    // 3. Gui bao cao su co (Bug Report)
    console.log('3. Gui bao cao loi co dinh kem anh...');
    const createReportRes = await fetch(`${baseUrl}/bug-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Loi vo layout khi co man hinh tren Galaxy Fold',
        description: 'Khi gap man hinh dien thoai vao che do hep 320px, thanh tab studio bi tran sang phai.',
        category: 'UI_UX',
        severity: 'HIGH',
        image_url: imageUrl,
        device_info: {
          userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile Safari/537.36',
          screen: '320x800 (DPR: 3)',
          url: `http://127.0.0.1:${port}/#create-survey`
        }
      })
    });
    const createReportBody = await createReportRes.json();
    assert.strictEqual(createReportRes.status, 201, 'Gui bao loi that bai: ' + JSON.stringify(createReportBody));
    assert.ok(createReportBody.reportId, 'Phai tra ve reportId');
    reportId = createReportBody.reportId;
    console.log('  PASS: Gui bao loi thanh cong! Report ID ->', reportId);

    // 4. Kiem tra API lich su cua nguoi dung
    console.log('4. Kiem tra GET /api/v1/bug-reports/my...');
    const myReportsRes = await fetch(`${baseUrl}/bug-reports/my`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const myReportsBody = await myReportsRes.json();
    assert.strictEqual(myReportsRes.status, 200, 'Lay lich su bao loi that bai');
    assert.ok(Array.isArray(myReportsBody.reports));
    const myReport = myReportsBody.reports.find(r => r.id === reportId);
    assert.ok(myReport, 'Khong tim thay bao cao vua gui trong danh sach cua toi');
    console.log('  PASS: Bao cao hien thi trong lich su o trang thai ->', myReport.status);

    // 5. Kiem tra API Quan tri vien Admin
    console.log('5. Kiem tra GET /api/v1/admin/bug-reports...');
    const adminReportsRes = await fetch(`${baseUrl}/admin/bug-reports`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminReportsBody = await adminReportsRes.json();
    assert.strictEqual(adminReportsRes.status, 200, 'Admin lay danh sach bao loi that bai');
    assert.ok(Array.isArray(adminReportsBody.reports));
    console.log('  PASS: Admin lay danh sach thanh cong, tong so bao cao:', adminReportsBody.stats.total);

    // 6. Admin cap nhat trang thai & gui loi nhan cho nguoi dung
    console.log('6. Admin cap nhat trang thai PATCH /api/v1/admin/bug-reports/:id...');
    const patchRes = await fetch(`${baseUrl}/admin/bug-reports/${reportId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        admin_notes: 'Doi ngu ky thuat da toi uu lai CSS overflow cho man hinh gap 320px.'
      })
    });
    assert.strictEqual(patchRes.status, 200, 'Cap nhat trang thai that bai');
    console.log('  PASS: Admin cap nhat trang thai -> RESOLVED thanh cong!');

    // 7. Kiem tra bao cao da duoc cap nhat RESOLVED & API thong bao hoat dong
    console.log('7. Kiem tra trang thai RESOLVED trong /bug-reports/my va API /notifications...');
    const updatedMyRes = await fetch(`${baseUrl}/bug-reports/my`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const updatedMyBody = await updatedMyRes.json();
    assert.strictEqual(updatedMyRes.status, 200);
    const updatedReport = (updatedMyBody.reports || []).find(r => r.id === reportId);
    assert.ok(updatedReport, 'Phai tim thay bao cao sau khi cap nhat');
    assert.strictEqual(updatedReport.status, 'RESOLVED', 'Trang thai bao cao phai la RESOLVED');

    const notifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const notifBody = await notifRes.json();
    assert.strictEqual(notifRes.status, 200, 'Lay thong bao that bai');
    assert.ok(Array.isArray(notifBody.notifications));
    console.log('  PASS: Bao cao da cap nhat RESOLVED va API /notifications hoat dong binh thuong.');

    console.log('\n=== TAT CA 7/7 KIEM THU TINH NANG BAO LOI DEU DAT PASS 100%! ===');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    try {
      db.exec('PRAGMA foreign_keys = OFF;');
      if (reportId) db.prepare('DELETE FROM bug_reports WHERE id = ?').run(reportId);
      if (uploadedMediaId) db.prepare('DELETE FROM media_storage WHERE id = ?').run(uploadedMediaId);
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(adminId);
      db.prepare('DELETE FROM admin_audit_logs WHERE admin_id = ?').run(adminId);
      db.prepare('DELETE FROM users WHERE id = ?').run(adminId);
      db.exec('PRAGMA foreign_keys = ON;');
    } catch (cleanErr) {
      console.warn('Loi don dep cuc bo:', cleanErr.message);
    }
    cleanAllTestData({ verbose: false });
  }
}

runTests().catch(err => {
  console.error('\nFAIL:', err);
  process.exit(1);
});
