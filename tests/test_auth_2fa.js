/**
 * Regression suite cho login OTP-aware.
 * NODE_ENV=test dùng debugOtp từ response, không đọc secret hoặc OTP từ DB.
 */

const assert = require('node:assert');
const crypto = require('node:crypto');
const app = require('../server/app');
const db = require('../server/db/database');

function deriveWrongOtp(otp) {
  const value = Number(otp);
  return String((value + 1) % 1000000).padStart(6, '0');
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { response, data: await response.json() };
}

async function runAuth2faTests() {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  const suffix = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const email = `auth_2fa_${suffix}@example.com`;
  const password = 'SecurePassword123!';
  let userId = null;

  try {
    const registration = await postJson(`${baseUrl}/auth/register`, {
      email,
      password,
      name: 'OTP Regression User',
      role: 'RESPONDENT'
    });
    assert.strictEqual(registration.response.status, 201);
    assert(registration.data.user);
    userId = registration.data.user.id;

    const firstLogin = await postJson(`${baseUrl}/auth/login`, { email, password });
    assert.strictEqual(firstLogin.response.status, 200);
    assert.strictEqual(firstLogin.data.token, undefined);
    assert.strictEqual(firstLogin.data.requiresOtp, true);
    assert(firstLogin.data.challengeId);
    assert(/^\d{6}$/.test(firstLogin.data.debugOtp));

    const wrongOtp = deriveWrongOtp(firstLogin.data.debugOtp);
    for (let attempt = 1; attempt <= 4; attempt++) {
      const wrong = await postJson(`${baseUrl}/auth/verify-login-otp`, {
        challengeId: firstLogin.data.challengeId,
        otp: wrongOtp
      });
      assert.strictEqual(wrong.response.status, 401);
      assert.strictEqual(wrong.data.token, undefined);
    }
    const limited = await postJson(`${baseUrl}/auth/verify-login-otp`, {
      challengeId: firstLogin.data.challengeId,
      otp: wrongOtp
    });
    assert.strictEqual(limited.response.status, 401);
    assert.strictEqual(limited.data.token, undefined);
    const blockedAfterLimit = await postJson(`${baseUrl}/auth/verify-login-otp`, {
      challengeId: firstLogin.data.challengeId,
      otp: firstLogin.data.debugOtp
    });
    assert.strictEqual(blockedAfterLimit.response.status, 401);
    assert.strictEqual(blockedAfterLimit.data.token, undefined);

    const validLogin = await postJson(`${baseUrl}/auth/login`, { email, password });
    assert.strictEqual(validLogin.response.status, 200);
    const verified = await postJson(`${baseUrl}/auth/verify-login-otp`, {
      challengeId: validLogin.data.challengeId,
      otp: validLogin.data.debugOtp
    });
    assert.strictEqual(verified.response.status, 200);
    assert(verified.data.token);

    const reused = await postJson(`${baseUrl}/auth/verify-login-otp`, {
      challengeId: validLogin.data.challengeId,
      otp: validLogin.data.debugOtp
    });
    assert.strictEqual(reused.response.status, 401);
    assert.strictEqual(reused.data.token, undefined);

    const expiringLogin = await postJson(`${baseUrl}/auth/login`, { email, password });
    assert.strictEqual(expiringLogin.response.status, 200);
    db.prepare('UPDATE login_challenges SET expires_at = ? WHERE id = ?')
      .run(Date.now() - 1, expiringLogin.data.challengeId);
    const expired = await postJson(`${baseUrl}/auth/verify-login-otp`, {
      challengeId: expiringLogin.data.challengeId,
      otp: expiringLogin.data.debugOtp
    });
    assert.strictEqual(expired.response.status, 401);
    assert.strictEqual(expired.data.token, undefined);

    console.log('PASS: login không phát token trước OTP; OTP sai bị giới hạn; OTP đúng cấp token; challenge single-use/expiry.');
  } finally {
    if (userId) {
      db.prepare('DELETE FROM login_challenges WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM device_ip_logs WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    }
    server.close();
  }
}

if (require.main === module) {
  runAuth2faTests().catch((error) => {
    console.error('FAIL: Auth 2FA regression:', error);
    process.exit(1);
  });
}

module.exports = runAuth2faTests;
