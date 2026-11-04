const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const db = require('../db/database');
const antiFraudService = require('../services/antiFraudService');

// Bộ nhớ đệm kiểm soát tần suất gửi OTP đăng ký theo IP (Tối đa 5 lần / 10 phút)
const registrationIpRateLimiter = new Map();
// Schema hiện tại chưa có cột đếm lần thử; giữ invariant tối đa 5 lần thử cho mỗi OTP trong process.
const registrationOtpAttempts = new Map();
const studentOtpAttempts = new Map();
const emailOtpAttempts = new Map();

function hashRegistrationOtp(otp) {
  return crypto.createHmac('sha256', config.JWT_SECRET).update(String(otp)).digest('hex');
}

function secureOtpEquals(expectedHash, otp) {
  const actualHash = Buffer.from(hashRegistrationOtp(otp), 'hex');
  const storedHash = Buffer.from(String(expectedHash), 'hex');
  return actualHash.length === storedHash.length && crypto.timingSafeEqual(actualHash, storedHash);
}

function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  return `${local.slice(0, 2)}***${local.length > 3 ? local.slice(-1) : ''}@${domain}`;
}

/**
 * Kiểm tra Magic Bytes cho tệp ảnh nhị phân được upload:
 * - JPEG: 3 byte đầu là FF D8 FF
 * - PNG: 4 byte đầu là 89 50 4E 47
 * - GIF: 4 byte đầu là 47 49 46 38 ('GIF8')
 * - WebP: byte 0..3 là 52 49 46 46 ('RIFF') và byte 8..11 là 57 42 45 50 ('WEBP')
 * @param {Buffer} buffer
 * @returns {'jpg' | 'png' | 'gif' | 'webp' | null}
 */
function verifyImageMagicBytes(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 3) {
    return null;
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpg';
  }
  if (buffer.length < 4) return null;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'png';
  }
  // GIF: 47 49 46 38 ('GIF8')
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'gif';
  }
  // WebP: byte 0..3 là 'RIFF' (52 49 46 46) và byte 8..11 là 'WEBP' (57 42 45 50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x42 && buffer[10] === 0x45 && buffer[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

function hashLoginOtp(otp) {
  return crypto.createHmac('sha256', config.JWT_SECRET).update(String(otp)).digest('hex');
}

function secureHashEquals(expectedHash, value) {
  const expected = Buffer.from(String(expectedHash || ''), 'hex');
  const actual = Buffer.from(hashLoginOtp(value), 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input) {
  const normalized = String(input || '').toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const output = [];
  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) throw new Error('Secret TOTP không hợp lệ');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function encryptTotpSecret(secret) {
  const key = crypto.createHash('sha256').update(config.JWT_SECRET).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptTotpSecret(payload) {
  const [ivPart, tagPart, dataPart] = String(payload || '').split('.');
  if (!ivPart || !tagPart || !dataPart) throw new Error('Secret TOTP không hợp lệ');
  const key = crypto.createHash('sha256').update(config.JWT_SECRET).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataPart, 'base64url')), decipher.final()]).toString('utf8');
}

function hotp(secret, counter) {
  const key = base32Decode(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 15;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return String(code).padStart(6, '0');
}

function verifyTotp(secret, token, timestamp = Date.now()) {
  if (!/^\d{6}$/.test(String(token || ''))) return false;
  const counter = Math.floor(timestamp / 30000);
  for (let drift = -1; drift <= 1; drift += 1) {
    const expected = Buffer.from(hotp(secret, counter + drift));
    const actual = Buffer.from(String(token));
    if (crypto.timingSafeEqual(expected, actual)) return true;
  }
  return false;
}

class AuthController {
  /**
   * Gửi mã OTP xác thực trước khi đăng ký tài khoản (Đa kênh: Resend -> Brevo -> SMTP)
   */
  async sendRegistrationOtp(req, res) {
    try {
      const { email, name } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email hợp lệ' });
      }

      const cleanEmail = email.toLowerCase().trim();

      // Kiểm tra email đã tồn tại trong hệ thống chưa
      const existing = db.prepare('SELECT id, is_google_linked FROM users WHERE email = ?').get(cleanEmail);
      if (existing) {
        if (existing.is_google_linked === 1) {
          return res.status(409).json({ 
            success: false, 
            message: 'Email này đã được đăng ký và liên kết với Google. Vui lòng bấm "Đăng nhập bằng Google" để truy cập tài khoản.' 
          });
        }
        return res.status(409).json({ 
          success: false, 
          message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' 
        });
      }

      // Kiểm tra tần suất gửi mã (Cooldown 60 giây) chống spam bấm liên tục
      const lastOtpRecord = db.prepare('SELECT created_at FROM registration_otps WHERE email = ?').get(cleanEmail);
      if (lastOtpRecord && lastOtpRecord.created_at) {
        const lastSentTime = new Date(lastOtpRecord.created_at + 'Z').getTime();
        const now = Date.now();
        const secondsElapsed = Math.floor((now - lastSentTime) / 1000);
        if (secondsElapsed >= 0 && secondsElapsed < 60) {
          const waitSeconds = 60 - secondsElapsed;
          return res.status(429).json({
            success: false,
            message: `Vui lòng đợi thêm ${waitSeconds} giây trước khi yêu cầu gửi lại mã OTP mới`,
            retryAfter: waitSeconds
          });
        }
      }

      // Khống chế tần suất gửi OTP theo địa chỉ IP (Tối đa 5 lần / 10 phút) để chặn bot quét tự động
      const isInternalTest = process.env.NODE_ENV === 'test';

      const rawIp = req.ip;
      if (!isInternalTest && rawIp) {
        const clientIp = String(rawIp).split(',')[0].trim();
        const nowMs = Date.now();
        const windowMs = 10 * 60 * 1000; // 10 phút
        const maxPerIp = 5;

        const timestamps = (registrationIpRateLimiter.get(clientIp) || []).filter(t => nowMs - t < windowMs);
        if (timestamps.length >= maxPerIp) {
          return res.status(429).json({
            success: false,
            message: 'Địa chỉ IP của bạn đã gửi quá nhiều yêu cầu mã OTP. Vui lòng chờ 10 phút trước khi thử lại.'
          });
        }
        timestamps.push(nowMs);
        registrationIpRateLimiter.set(clientIp, timestamps);
      }

      // Tạo mã OTP ngẫu nhiên 6 chữ số (mỗi lần sinh mã mới sẽ hủy bỏ hoàn toàn mã cũ)
      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 phút

      // Lưu hoặc cập nhật ghi đè OTP vào bảng registration_otps (Hủy mã cũ ngay lập tức)
      db.prepare(`
        INSERT INTO registration_otps (email, otp, expires_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET otp = excluded.otp, expires_at = excluded.expires_at, created_at = CURRENT_TIMESTAMP
      `).run(cleanEmail, hashRegistrationOtp(otp), expiresAt);
      registrationOtpAttempts.delete(cleanEmail);

      // Che một phần địa chỉ email trước khi ghi log (không bao giờ in mã OTP ra console)
      const parts = cleanEmail.split('@');
      const maskedEmail = parts[0].slice(0, 2) + '***' + (parts[0].length > 3 ? parts[0].slice(-1) : '') + '@' + parts[1];

      console.log(`\n=======================================================\n[REGISTRATION OTP] Gửi mã xác thực đăng ký đến: ${maskedEmail} | Mã có hiệu lực trong 10 phút\n=======================================================\n`);

      // Gửi email qua Bộ điều phối thông minh đa kênh (Resend -> Brevo -> SMTP)
      let emailSent = false;
      let emailError = null;
      let emailMode = null;
      const notificationService = require('../services/notificationService');

      const emailSubject = `[SurvHub] Mã xác thực đăng ký tài khoản của bạn: ${otp}`;
      const emailHtml = notificationService.buildOtpEmailTemplate({
        title: 'XÁC THỰC ĐĂNG KÝ TÀI KHOẢN',
        name: name || 'Bạn',
        otp,
        validMinutes: 10,
        actionDescription: 'đăng ký tài khoản mới & nhận 25 lượt khảo sát miễn phí',
        note: 'Tuyệt đối không cung cấp mã OTP này cho bất kỳ ai.'
      });

      try {
        const sendResult = await notificationService.sendSmartEmail({
          toEmail: cleanEmail,
          toName: name || 'Người dùng mới',
          subject: emailSubject,
          htmlContent: emailHtml,
          textContent: `Mã OTP xác thực đăng ký tài khoản SurvHub của bạn là: ${otp}. Có hiệu lực trong 10 phút.`
        });
        emailSent = sendResult && sendResult.success;
        emailMode = sendResult && sendResult.mode;
      } catch (err) {
        console.warn('Lỗi gửi Registration OTP đa kênh:', err.message);
        emailError = err.message;
      }

      const isTestEnv = process.env.NODE_ENV === 'test';
      if (!emailSent && !isTestEnv) {
        db.prepare('DELETE FROM registration_otps WHERE email = ?').run(cleanEmail);
        registrationOtpAttempts.delete(cleanEmail);
        return res.status(503).json({
          success: false,
          message: 'Không thể gửi mã xác thực lúc này. Vui lòng thử lại sau.',
          maskedEmail,
          quotaExceeded: true,
          channel: emailMode
        });
      }

      let responseMessage = `Mã xác thực gồm 6 chữ số đã được gửi đến hộp thư ${maskedEmail}. Vui lòng nhập mã để hoàn tất đăng ký!`;
      if (isTestEnv && emailMode === 'MOCK_TEST_SKIPPED') {
        responseMessage = `[Chế độ Thử Nghiệm] Mã xác thực đăng ký của bạn là: ${otp}`;
      }

      return res.json({
        success: true,
        message: responseMessage,
        maskedEmail,
        debugOtp: isTestEnv ? otp : undefined,
        quotaExceeded: !emailSent,
        channel: emailMode
      });
    } catch (err) {
      console.error('Lỗi sendRegistrationOtp:', err);
      return res.status(500).json({ success: false, message: 'Lỗi gửi mã xác thực: ' + err.message });
    }
  }

  register(req, res) {
    try {
      const { email, password, name, role = 'RESPONDENT', google_id, otp } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên' });
      }

      if (!['RESPONDENT', 'CREATOR'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Vai trò chỉ có thể là RESPONDENT hoặc CREATOR' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const cleanName = name.trim();

      // Nếu tạo tài khoản thường bằng email (không qua Google), kiểm tra mã xác thực OTP
      const googleId = (google_id && typeof google_id === 'string') ? google_id.trim() : null;
      let isEmailVerified = 0;

      // Chỉ cho phép bỏ qua OTP đăng ký trong môi trường kiểm thử tự động (NODE_ENV === 'test')
      const isTestEnv = process.env.NODE_ENV === 'test';

      if (googleId) {
        isEmailVerified = 1;
      } else if (isTestEnv && !otp) {
        // Cho phép automated test runner chạy kiểm thử tự động
        isEmailVerified = 0;
      } else {
        // Bắt buộc 100% người dùng thực tế trên trình duyệt phải nhập mã xác thực OTP gửi qua email
        if (!otp || typeof otp !== 'string' || !otp.trim()) {
          return res.status(400).json({ 
            success: false, 
            message: 'Vui lòng bấm "Gửi mã" và nhập mã xác thực OTP 6 chữ số gửi qua email của bạn để hoàn tất đăng ký.' 
          });
        }

        const cleanOtp = String(otp).trim();
        const otpRecord = db.prepare('SELECT otp, expires_at FROM registration_otps WHERE email = ?').get(cleanEmail);
        if (!otpRecord) {
          return res.status(400).json({ 
            success: false, 
            message: 'Mã xác thực không tồn tại hoặc chưa được gửi. Vui lòng bấm "Gửi mã" để nhận OTP qua email.' 
          });
        }
        if (Date.now() > Number(otpRecord.expires_at)) {
          registrationOtpAttempts.delete(cleanEmail);
          return res.status(400).json({ 
            success: false, 
            message: 'Mã xác thực OTP đã hết hạn (sau 10 phút). Vui lòng bấm "Gửi mã" để nhận mã mới.' 
          });
        }
        const attempts = registrationOtpAttempts.get(cleanEmail) || 0;
        if (attempts >= 5) {
          return res.status(429).json({
            success: false,
            message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng bấm "Gửi mã" để nhận mã mới.'
          });
        }
        if (!secureOtpEquals(otpRecord.otp, cleanOtp)) {
          registrationOtpAttempts.set(cleanEmail, attempts + 1);
          if (attempts + 1 >= 5) {
            return res.status(429).json({
              success: false,
              message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng bấm "Gửi mã" để nhận mã mới.'
            });
          }
          return res.status(400).json({ 
            success: false, 
            message: 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại hộp thư email.' 
          });
        }

        // Khớp OTP -> Đánh dấu email đã xác thực 100% và xóa OTP đã dùng
        isEmailVerified = 1;
        db.prepare('DELETE FROM registration_otps WHERE email = ?').run(cleanEmail);
        registrationOtpAttempts.delete(cleanEmail);
      }

      const rawIp = req.ip;
      const deviceFingerprint = req.body.device_fingerprint || req.headers['x-device-fingerprint'] || null;

      // 1. Kiểm tra an ninh IP & Thiết bị (Chặn Ban IP / Multi-Account)
      try {
        antiFraudService.trackAndVerifyDeviceIp({ userId: null, rawIp, deviceFingerprint, action: 'REGISTER_PRECHECK' });
      } catch (abuseErr) {
        return res.status(403).json({ success: false, isBanned: true, message: abuseErr.message });
      }

      const existing = db.prepare('SELECT id, is_google_linked FROM users WHERE email = ?').get(cleanEmail);
      if (existing) {
        if (existing.is_google_linked === 1) {
          return res.status(409).json({ 
            success: false, 
            message: 'Email này đã được đăng ký bằng Google. Vui lòng sử dụng nút "Đăng nhập bằng Google" để đăng nhập!' 
          });
        }
        return res.status(409).json({ success: false, message: 'Email này đã được đăng ký trong hệ thống. Vui lòng đăng nhập.' });
      }

      if (googleId) {
        const existingGoogle = db.prepare('SELECT id FROM users WHERE google_id = ?').get(googleId);
        if (existingGoogle) {
          return res.status(409).json({ success: false, message: 'Tài khoản Google này đã được liên kết với một tài khoản khác trong hệ thống' });
        }
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const userId = crypto.randomUUID();

      const demographicsPayload = req.body.demographics && typeof req.body.demographics === 'object'
        ? JSON.stringify(req.body.demographics)
        : null;

      const isGoogleLinked = googleId ? 1 : 0;

      db.prepare(`
        INSERT INTO users (
          id, email, password_hash, name, role, credit_balance, point_balance, 
          trust_score, status, free_trial_surveys_available, is_google_linked, google_id, is_email_verified, demographics_json
        )
        VALUES (?, ?, ?, ?, ?, 0.0, 0, 100.0, 'ACTIVE', 1, ?, ?, ?, ?)
      `).run(userId, cleanEmail, passwordHash, cleanName, role, isGoogleLinked, googleId, isEmailVerified, demographicsPayload);

      // Ghi nhận nhật ký IP liên kết với User mới tạo
      antiFraudService.trackAndVerifyDeviceIp({ userId, rawIp, deviceFingerprint, action: 'REGISTER' });

      const token = jwt.sign(
        { id: userId, email: email.toLowerCase().trim(), role },
        config.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        token,
        user: {
          id: userId,
          email: email.toLowerCase().trim(),
          name: name.trim(),
          role,
          avatar_url: null,
          credit_balance: 0.0,
          point_balance: 0,
          student_karma: 0,
          account_tier: 'PERSONAL',
          is_student_verified: 0,
          trust_score: 100.0,
          free_trial_surveys_available: 1,
          is_google_linked: isGoogleLinked,
          is_email_verified: isEmailVerified,
          demographics: req.body.demographics || null
        }
      });
    } catch (err) {
      if (err.message && (err.message.includes('khóa') || err.message.includes('cấm') || err.message.includes('bị khóa'))) {
        return res.status(403).json({ success: false, isBanned: true, message: err.message });
      }
      console.error('Lỗi register:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
      }

      if (user.status === 'BANNED') {
        return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa do gian lận' });
      }

      let isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
      }

      const rawIp = req.ip;
      const deviceFingerprint = req.body.device_fingerprint || req.headers['x-device-fingerprint'] || null;

      // Giám sát an ninh IP & Thiết bị
      try {
        antiFraudService.trackAndVerifyDeviceIp({ userId: user.id, rawIp, deviceFingerprint, action: 'LOGIN' });
      } catch (abuseErr) {
        return res.status(403).json({ success: false, isBanned: true, message: abuseErr.message });
      }

      const challengeId = crypto.randomUUID();
      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      db.prepare(`
        UPDATE login_challenges SET consumed_at = ? WHERE user_id = ? AND consumed_at IS NULL
      `).run(Date.now(), user.id);
      db.prepare(`
        INSERT INTO login_challenges (id, user_id, otp_hash, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(challengeId, user.id, hashLoginOtp(otp), expiresAt);

      const notificationService = require('../services/notificationService');
      const maskedEmail = maskEmail(user.email);
      let emailSent = false;
      try {
        const result = await notificationService.sendSmartEmail({
          toEmail: user.email,
          toName: user.name,
          subject: '[SurvHub] Mã OTP đăng nhập của bạn',
          htmlContent: notificationService.buildOtpEmailTemplate({
            title: 'XÁC THỰC ĐĂNG NHẬP',
            name: user.name || 'Bạn',
            otp,
            validMinutes: 10,
            actionDescription: 'đăng nhập vào tài khoản SurvHub',
            note: 'Mã chỉ dùng một lần và tuyệt đối không chia sẻ cho bất kỳ ai.'
          }),
          textContent: `Mã OTP đăng nhập SurvHub của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`
        });
        emailSent = Boolean(result && result.success);
      } catch (emailError) {
        console.warn('Lỗi gửi Login OTP:', emailError.message);
      }
      const isTestEnv = process.env.NODE_ENV === 'test';
      if (!emailSent && !isTestEnv) {
        db.prepare('DELETE FROM login_challenges WHERE id = ?').run(challengeId);
        return res.status(503).json({ success: false, message: 'Không thể gửi mã xác thực lúc này. Vui lòng thử lại sau.' });
      }

      return res.json({
        success: true,
        message: `Mã xác thực đã được gửi đến ${maskedEmail}`,
        challengeId,
        maskedEmail,
        requiresOtp: true,
        requiresTotp: Boolean(user.totp_enabled),
        debugOtp: isTestEnv ? otp : undefined
      });
    } catch (err) {
      if (err.message && (err.message.includes('khóa') || err.message.includes('cấm') || err.message.includes('bị khóa'))) {
        return res.status(403).json({ success: false, isBanned: true, message: err.message });
      }
      console.error('Lỗi login:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
  }

  verifyLoginOtp(req, res) {
    try {
      const { challengeId, otp, totp } = req.body;
      if (!challengeId || !/^\d{6}$/.test(String(otp || ''))) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp challengeId và mã OTP 6 số' });
      }
      const challenge = db.prepare(`
        SELECT c.*, u.email, u.role, u.name, u.status, u.totp_enabled, u.totp_secret_encrypted
        FROM login_challenges c JOIN users u ON u.id = c.user_id WHERE c.id = ?
      `).get(challengeId);
      if (!challenge || challenge.consumed_at || challenge.expires_at <= Date.now()) {
        return res.status(401).json({ success: false, message: 'Mã xác thực đã hết hạn hoặc không còn hiệu lực' });
      }
      if (challenge.attempts >= 5) {
        db.prepare('UPDATE login_challenges SET consumed_at = ? WHERE id = ?').run(Date.now(), challengeId);
        return res.status(429).json({ success: false, message: 'Challenge đã bị vô hiệu hóa do quá nhiều lần thử' });
      }
      if (!secureHashEquals(challenge.otp_hash, otp)) {
        const attempts = challenge.attempts + 1;
        db.prepare('UPDATE login_challenges SET attempts = ?, consumed_at = CASE WHEN ? >= 5 THEN ? ELSE consumed_at END WHERE id = ?')
          .run(attempts, attempts, attempts >= 5 ? Date.now() : null, challengeId);
        return res.status(401).json({ success: false, message: 'Mã xác thực không chính xác', remainingAttempts: Math.max(0, 5 - attempts) });
      }
      if (challenge.totp_enabled) {
        let validTotp = false;
        try {
          validTotp = verifyTotp(decryptTotpSecret(challenge.totp_secret_encrypted), totp);
        } catch (_) {}
        if (!validTotp) {
          const attempts = challenge.attempts + 1;
          db.prepare('UPDATE login_challenges SET attempts = ?, consumed_at = CASE WHEN ? >= 5 THEN ? ELSE consumed_at END WHERE id = ?')
            .run(attempts, attempts, attempts >= 5 ? Date.now() : null, challengeId);
          return res.status(401).json({
            success: false,
            message: 'Vui lòng cung cấp mã TOTP hợp lệ',
            requiresTotp: true,
            remainingAttempts: Math.max(0, 5 - attempts)
          });
        }
      }

      db.prepare('UPDATE login_challenges SET consumed_at = ? WHERE id = ?').run(Date.now(), challengeId);
      const token = jwt.sign(
        { id: challenge.user_id, email: challenge.email, role: challenge.role },
        config.JWT_SECRET,
        { expiresIn: '7d' }
      );
      const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(challenge.user_id);
      delete freshUser.password_hash;
      delete freshUser.totp_secret_encrypted;
      delete freshUser.totp_pending_secret_encrypted;
      return res.json({ success: true, message: 'Đăng nhập thành công', token, user: freshUser });
    } catch (err) {
      console.error('Lỗi verifyLoginOtp:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
  }

  setupTotp(req, res) {
    try {
      const user = db.prepare('SELECT email, totp_enabled FROM users WHERE id = ?').get(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      if (user.totp_enabled) return res.status(409).json({ success: false, message: 'TOTP đã được bật' });
      const secret = base32Encode(crypto.randomBytes(20));
      db.prepare('UPDATE users SET totp_pending_secret_encrypted = ? WHERE id = ?')
        .run(encryptTotpSecret(secret), req.user.id);
      const issuer = 'VibeSurvey';
      const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
      return res.json({ success: true, secret, otpauthUri });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Không thể khởi tạo TOTP' });
    }
  }

  enableTotp(req, res) {
    try {
      const { token } = req.body;
      const user = db.prepare('SELECT totp_pending_secret_encrypted FROM users WHERE id = ?').get(req.user.id);
      if (!user || !user.totp_pending_secret_encrypted || !verifyTotp(decryptTotpSecret(user.totp_pending_secret_encrypted), token)) {
        return res.status(400).json({ success: false, message: 'Mã TOTP không hợp lệ hoặc phiên thiết lập đã hết hạn' });
      }
      db.prepare('UPDATE users SET totp_secret_encrypted = ?, totp_pending_secret_encrypted = NULL, totp_enabled = 1 WHERE id = ?')
        .run(user.totp_pending_secret_encrypted, req.user.id);
      return res.json({ success: true, enabled: true, message: 'Đã bật xác thực TOTP' });
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Không thể bật TOTP' });
    }
  }

  disableTotp(req, res) {
    try {
      const { token } = req.body;
      const user = db.prepare('SELECT totp_secret_encrypted, totp_enabled FROM users WHERE id = ?').get(req.user.id);
      if (!user || !user.totp_enabled || !verifyTotp(decryptTotpSecret(user.totp_secret_encrypted), token)) {
        return res.status(401).json({ success: false, message: 'Mã TOTP không hợp lệ' });
      }
      db.prepare('UPDATE users SET totp_secret_encrypted = NULL, totp_pending_secret_encrypted = NULL, totp_enabled = 0 WHERE id = ?')
        .run(req.user.id);
      return res.json({ success: true, enabled: false, message: 'Đã tắt xác thực TOTP' });
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Không thể tắt TOTP' });
    }
  }

  verifyTotp(req, res) {
    try {
      const { token } = req.body;
      const user = db.prepare('SELECT totp_secret_encrypted, totp_enabled FROM users WHERE id = ?').get(req.user.id);
      const valid = Boolean(user && user.totp_enabled && verifyTotp(decryptTotpSecret(user.totp_secret_encrypted), token));
      return res.status(valid ? 200 : 401).json({ success: valid, valid, message: valid ? 'Mã TOTP hợp lệ' : 'Mã TOTP không hợp lệ' });
    } catch (err) {
      return res.status(401).json({ success: false, valid: false, message: 'Mã TOTP không hợp lệ' });
    }
  }

  getMe(req, res) {
    let demographics = null;
    const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) || req.user;
    delete freshUser.password_hash;
    delete freshUser.email_otp;
    delete freshUser.student_otp;

    // Tự động kiểm tra thời hạn gói Sinh Viên: nếu hết hạn thì tự động về gói Thường (PERSONAL)
    if (freshUser.account_tier === 'STUDENT' || freshUser.is_student_verified === 1) {
      let isExpired = false;
      if (freshUser.student_expires_at && new Date(freshUser.student_expires_at).getTime() < Date.now()) {
        isExpired = true;
      } else if (freshUser.graduation_year && new Date().getFullYear() > Number(freshUser.graduation_year)) {
        isExpired = true;
      }
      if (isExpired) {
        db.prepare("UPDATE users SET is_student_verified = 0, account_tier = 'PERSONAL' WHERE id = ?").run(freshUser.id);
        freshUser.is_student_verified = 0;
        freshUser.account_tier = 'PERSONAL';
      }
    }

    if (freshUser.demographics_json) {
      try { demographics = JSON.parse(freshUser.demographics_json); } catch (e) {}
    }
    return res.json({
      success: true,
      user: {
        ...freshUser,
        demographics
      }
    });
  }

  updateProfile(req, res) {
    try {
      const user = req.user;
      const { name, demographics } = req.body;

      let demographicsJson = (user.demographics_json !== undefined && user.demographics_json !== null) ? user.demographics_json : null;
      if (demographics && typeof demographics === 'object') {
        demographicsJson = JSON.stringify(demographics);
      }

      const newName = (name && typeof name === 'string' && name.trim()) ? name.trim() : user.name;

      db.prepare(`
        UPDATE users 
        SET name = ?, demographics_json = ? 
        WHERE id = ?
      `).run(newName, demographicsJson, user.id);

      const updatedUser = db.prepare('SELECT id, email, name, role, avatar_url, credit_balance, point_balance, student_karma, is_student_verified, account_tier, trust_score, status, free_trial_surveys_available, free_quota_remaining, fast_track_tickets, demographics_json FROM users WHERE id = ?').get(user.id);

      let parsedDemo = null;
      if (updatedUser.demographics_json) {
        try { parsedDemo = JSON.parse(updatedUser.demographics_json); } catch (e) {}
      }

      return res.json({
        success: true,
        message: 'Cập nhật thông tin hồ sơ và nhân khẩu học thành công',
        user: {
          ...updatedUser,
          demographics: parsedDemo
        }
      });
    } catch (err) {
      console.error('Lỗi updateProfile:', err);
      return res.status(500).json({ success: false, message: 'Lỗi cập nhật hồ sơ' });
    }
  }

  /**
   * Liên kết tài khoản Google để kích hoạt ưu đãi người mới
   * Chặn trùng Google ID giữa các tài khoản khác nhau (Anti-Sybil)
   */
  linkGoogle(req, res) {
    try {
      const user = req.user;
      const { google_id, google_email } = req.body;

      if (!google_id || typeof google_id !== 'string') {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã định danh Google hợp lệ' });
      }

      const cleanGoogleId = google_id.trim();
      const existing = db.prepare('SELECT id, email FROM users WHERE google_id = ? AND id != ?').get(cleanGoogleId, user.id);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Tài khoản Google này đã được liên kết với một tài khoản khác trong hệ thống. Mỗi tài khoản Google chỉ được nhận ưu đãi 1 lần.'
        });
      }

      db.prepare('UPDATE users SET is_google_linked = 1, google_id = ? WHERE id = ?').run(cleanGoogleId, user.id);

      const updatedUser = db.prepare('SELECT id, email, name, role, avatar_url, credit_balance, point_balance, trust_score, status, free_trial_surveys_available, is_google_linked, is_email_verified FROM users WHERE id = ?').get(user.id);

      return res.json({
        success: true,
        message: 'Liên kết tài khoản Google thành công! Tài khoản của bạn đã đủ điều kiện kích hoạt 25 lượt khảo sát dùng thử miễn phí.',
        user: updatedUser
      });
    } catch (err) {
      console.error('Lỗi linkGoogle:', err);
      return res.status(500).json({ success: false, message: 'Lỗi liên kết tài khoản Google' });
    }
  }

  /**
   * Xác thực Email tài khoản
   * Bắt buộc phải có mã OTP hợp lệ và còn hạn, chỉ cho phép bypass trực tiếp khi process.env.NODE_ENV === 'test'
   */
  verifyEmail(req, res) {
    if (req.body && req.body.otp) {
      return this.verifyEmailOtp(req, res);
    }
    // Chỉ hỗ trợ test runner tự động khi process.env.NODE_ENV === 'test' và không truyền OTP
    if (process.env.NODE_ENV === 'test' && (!req.body || !req.body.otp)) {
      try {
        const user = req.user;
        if (!user) {
          return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
        }
        db.prepare('UPDATE users SET is_email_verified = 1 WHERE id = ?').run(user.id);
        return res.json({
          success: true,
          message: 'Email đã được xác thực thành công'
        });
      } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp mã xác thực OTP gửi qua email'
    });
  }

  /**
   * Gửi mã OTP xác thực email thực tế
   */
  async sendVerificationOtp(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
      }

      // Kiểm tra tần suất gửi mã (Cooldown 60 giây)
      const currentUserRow = db.prepare('SELECT email_otp_sent_at FROM users WHERE id = ?').get(user.id);
      if (currentUserRow && currentUserRow.email_otp_sent_at) {
        const lastSentTime = Number(currentUserRow.email_otp_sent_at);
        const now = Date.now();
        const secondsElapsed = Math.floor((now - lastSentTime) / 1000);
        if (secondsElapsed >= 0 && secondsElapsed < 60) {
          const waitSeconds = 60 - secondsElapsed;
          return res.status(429).json({
            success: false,
            message: `Vui lòng đợi thêm ${waitSeconds} giây trước khi yêu cầu gửi lại mã OTP mới`,
            retryAfter: waitSeconds
          });
        }
      }

      // Tạo mã OTP ngẫu nhiên 6 chữ số (ghi đè và hủy mã cũ)
      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // Có hiệu lực trong 10 phút
      const sentAt = Date.now();

      db.prepare('UPDATE users SET email_otp = ?, email_otp_expires_at = ?, email_otp_sent_at = ? WHERE id = ?').run(hashRegistrationOtp(otp), expiresAt, sentAt, user.id);
      emailOtpAttempts.delete(user.id);

      // Che một phần địa chỉ email trước khi ghi log (không bao giờ in mã OTP ra console)
      const parts = user.email.split('@');
      const maskedEmail = parts[0].slice(0, 2) + '***' + (parts[0].length > 3 ? parts[0].slice(-1) : '') + '@' + parts[1];

      console.log(`\n=======================================================\n[EMAIL OTP SERVICE] Gửi mã xác thực đến: ${maskedEmail} | Mã có hiệu lực trong 10 phút\n=======================================================\n`);

      // Bắn email thật qua bộ điều phối thông minh đa kênh (Resend -> Brevo -> SMTP)
      const notificationService = require('../services/notificationService');
      const emailSubject = `[SurvHub] Mã xác thực tài khoản của bạn: ${otp}`;
      const emailHtml = notificationService.buildOtpEmailTemplate({
        title: 'XÁC THỰC TÀI KHOẢN & ĐẶT LẠI MẬT KHẨU',
        name: user.name || 'Bạn',
        otp,
        validMinutes: 10,
        actionDescription: 'xác thực tài khoản và đặt lại mật khẩu',
        note: 'Nếu bạn không gửi yêu cầu này, vui lòng đổi mật khẩu ngay để bảo vệ tài khoản.'
      });

      let emailResult = { success: false };
      try {
        emailResult = await notificationService.sendSmartEmail({
          toEmail: user.email,
          toName: user.name,
          subject: emailSubject,
          htmlContent: emailHtml,
          textContent: `Mã xác thực OTP của bạn là: ${otp}. Mã có hiệu lực trong 10 phút.`
        }) || emailResult;
      } catch (e) {
        console.warn('Lỗi gửi OTP Verification đa kênh:', e.message);
      }

      if (!emailResult.success && process.env.NODE_ENV !== 'test') {
        db.prepare('UPDATE users SET email_otp = NULL, email_otp_expires_at = NULL, email_otp_sent_at = NULL WHERE id = ?').run(user.id);
        emailOtpAttempts.delete(user.id);
        return res.status(503).json({
          success: false,
          message: 'Không thể gửi mã xác thực lúc này. Vui lòng thử lại sau.',
          maskedEmail
        });
      }

      return res.json({
        success: true,
        message: `Mã xác thực gồm 6 chữ số đã được gửi đến hộp thư ${maskedEmail}. Vui lòng kiểm tra email của bạn!`,
        maskedEmail,
        debugOtp: process.env.NODE_ENV === 'test' ? otp : undefined
      });
    } catch (err) {
      console.error('Lỗi sendVerificationOtp:', err);
      return res.status(500).json({ success: false, message: 'Không thể gửi mã xác thực email' });
    }
  }

  /**
   * Xác thực mã OTP email do người dùng nhập
   */
  verifyEmailOtp(req, res) {
    try {
      const user = req.user;
      const { otp } = req.body;

      if (!otp || typeof otp !== 'string' || !otp.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mã xác thực OTP 6 số' });
      }

      const cleanOtp = otp.trim();
      const row = db.prepare('SELECT email_otp, email_otp_expires_at FROM users WHERE id = ?').get(user.id);

      if (!row || !row.email_otp) {
        return res.status(400).json({ success: false, message: 'Chưa có mã xác thực nào được gửi. Vui lòng bấm "Gửi mã xác thực"' });
      }

      if (Date.now() > Number(row.email_otp_expires_at)) {
        emailOtpAttempts.delete(user.id);
        return res.status(400).json({ success: false, message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã OTP mới' });
      }

      const attempts = emailOtpAttempts.get(user.id) || 0;
      if (attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới'
        });
      }

      if (!secureOtpEquals(row.email_otp, cleanOtp)) {
        emailOtpAttempts.set(user.id, attempts + 1);
        if (attempts + 1 >= 5) {
          return res.status(429).json({
            success: false,
            message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới'
          });
        }
        return res.status(400).json({ success: false, message: 'Mã xác thực không chính xác. Vui lòng kiểm tra lại' });
      }

      // Khớp OTP -> Cập nhật trạng thái
      db.prepare('UPDATE users SET is_email_verified = 1, email_otp = NULL, email_otp_expires_at = NULL WHERE id = ?').run(user.id);
      emailOtpAttempts.delete(user.id);

      const updatedUser = db.prepare('SELECT id, email, name, role, avatar_url, credit_balance, point_balance, trust_score, status, free_trial_surveys_available, is_google_linked, is_email_verified FROM users WHERE id = ?').get(user.id);

      return res.json({
        success: true,
        message: 'Email của bạn đã được xác thực thành công! Bạn đã đủ điều kiện kích hoạt 25 lượt khảo sát dùng thử miễn phí.',
        user: updatedUser
      });
    } catch (err) {
      console.error('Lỗi verifyEmailOtp:', err);
      return res.status(500).json({ success: false, message: 'Lỗi xác minh mã OTP' });
    }
  }

  /**
   * Đăng nhập / Đăng ký bằng Google thực tế (Google Identity Services hoặc OAuth token)
   * Kiểm tra tính hợp lệ của token Google, loại bỏ fallback nhận google_id/email trần ở production/dev
   */
  async googleAuth(req, res) {
    try {
      const { credential, google_id, email, name, role = 'RESPONDENT' } = req.body;

      let extractedGoogleId = null;
      let extractedEmail = null;
      let extractedName = null;

      if (credential && typeof credential === 'string') {
        // Có credential token từ Google
        if (process.env.NODE_ENV === 'test') {
          // Trong test suite: giải mã trực tiếp JWT payload
          try {
            const parts = credential.split('.');
            if (parts.length === 3) {
              const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
              const googlePayload = JSON.parse(payloadJson);
              extractedGoogleId = googlePayload.sub ? String(googlePayload.sub).trim() : null;
              extractedEmail = googlePayload.email ? String(googlePayload.email).trim().toLowerCase() : null;
              extractedName = googlePayload.name ? String(googlePayload.name).trim() : (extractedEmail ? extractedEmail.split('@')[0] : 'Google User');
            }
          } catch (jwtErr) {
            console.warn('Lỗi giải mã Google JWT trong test suite:', jwtErr.message);
          }
        } else {
          // Trong production/dev: xác thực token qua Google tokeninfo API
          try {
            const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
            const verifyRes = await fetch(googleVerifyUrl);
            if (!verifyRes.ok) {
              return res.status(401).json({
                success: false,
                message: 'Google ID token không hợp lệ hoặc đã hết hạn từ Google Identity Services'
              });
            }
            const tokenInfo = await verifyRes.json();
            if (!tokenInfo || !tokenInfo.sub || !tokenInfo.email) {
              return res.status(401).json({
                success: false,
                message: 'Thông tin định danh từ Google token không hợp lệ hoặc thiếu email'
              });
            }
            extractedGoogleId = String(tokenInfo.sub).trim();
            extractedEmail = String(tokenInfo.email).trim().toLowerCase();
            extractedName = tokenInfo.name ? String(tokenInfo.name).trim() : extractedEmail.split('@')[0];
          } catch (fetchErr) {
            console.error('Lỗi kết nối Google tokeninfo API:', fetchErr.message);
            return res.status(502).json({
              success: false,
              message: 'Không thể kết nối đến máy chủ xác thực Google: ' + fetchErr.message
            });
          }
        }
      } else if (process.env.NODE_ENV === 'test' && google_id && email) {
        // Chỉ chấp nhận fallback không có credential khi đang chạy test suite tự động
        extractedGoogleId = String(google_id).trim();
        extractedEmail = String(email).trim().toLowerCase();
        extractedName = name ? String(name).trim() : extractedEmail.split('@')[0];
      } else {
        // Nghiêm cấm nhận google_id và email trần trong môi trường production / dev
        return res.status(400).json({
          success: false,
          message: 'Yêu cầu cung cấp mã xác thực Google (credential token) hợp lệ'
        });
      }

      if (!extractedGoogleId || !extractedEmail) {
        return res.status(400).json({ success: false, message: 'Thông tin xác thực Google không hợp lệ hoặc thiếu email' });
      }

      const rawIp = req.ip;
      const deviceFingerprint = req.body.device_fingerprint || req.headers['x-device-fingerprint'] || null;

      // Kiểm tra xem đã có user nào liên kết với google_id này chưa
      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(extractedGoogleId);

      // Nếu chưa có, kiểm tra theo email
      if (!user) {
        user = db.prepare('SELECT * FROM users WHERE email = ?').get(extractedEmail);
        if (user) {
          // Email đã tồn tại -> Tự động liên kết Google ID
          db.prepare('UPDATE users SET is_google_linked = 1, google_id = ?, is_email_verified = 1 WHERE id = ?').run(extractedGoogleId, user.id);
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
        }
      }

      // Nếu vẫn chưa có user -> Đăng ký tài khoản mới tự động bằng Google
      if (!user) {
        // Kiểm tra an ninh IP/Thiết bị
        try {
          antiFraudService.trackAndVerifyDeviceIp({ userId: null, rawIp, deviceFingerprint, action: 'GOOGLE_REGISTER' });
        } catch (abuseErr) {
          return res.status(403).json({ success: false, isBanned: true, message: abuseErr.message });
        }

        const userId = crypto.randomUUID();
        const randomPass = crypto.randomBytes(16).toString('hex');
        const passwordHash = bcrypt.hashSync(randomPass, 10);
        const displayName = extractedName || extractedEmail.split('@')[0];
        const assignedRole = ['RESPONDENT', 'CREATOR'].includes(role) ? role : 'RESPONDENT';

        db.prepare(`
          INSERT INTO users (
            id, email, password_hash, name, role, credit_balance, point_balance, 
            trust_score, status, free_trial_surveys_available, is_google_linked, google_id, is_email_verified
          )
          VALUES (?, ?, ?, ?, ?, 0.0, 0, 100.0, 'ACTIVE', 1, 1, ?, 1)
        `).run(userId, extractedEmail, passwordHash, displayName, assignedRole, extractedGoogleId);

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      }

      if (user.status === 'BANNED') {
        return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa do gian lận' });
      }

      // Giám sát an ninh
      try {
        antiFraudService.trackAndVerifyDeviceIp({ userId: user.id, rawIp, deviceFingerprint, action: 'GOOGLE_LOGIN' });
      } catch (abuseErr) {
        return res.status(403).json({ success: false, isBanned: true, message: abuseErr.message });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Đăng nhập Google thành công',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar_url: user.avatar_url || null,
          credit_balance: user.credit_balance,
          point_balance: user.point_balance,
          trust_score: user.trust_score,
          free_trial_surveys_available: user.free_trial_surveys_available,
          is_student_verified: user.is_student_verified || 0,
          student_karma: user.student_karma || 0,
          account_tier: user.account_tier || 'PERSONAL',
          is_google_linked: 1,
          is_email_verified: 1,
          status: user.status
        }
      });
    } catch (err) {
      console.error('Lỗi googleAuth:', err);
      return res.status(500).json({ success: false, message: 'Lỗi xác thực Google' });
    }
  }

  // Helper xác định callback URL động (tự động tương thích cả Render lẫn Localhost)
  getGoogleCallbackUrl(req) {
    if (process.env.GOOGLE_CALLBACK_URL) {
      return process.env.GOOGLE_CALLBACK_URL;
    }
    const host = req.get('host');
    const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    return `${proto}://${host}/api/v1/auth/google/callback`;
  }

  // Khởi tạo luồng OAuth cấp quyền đọc Google Forms cá nhân (forms.body.readonly)
  initiateGoogleFormsConnect(req, res) {
    const clientId = config.GOOGLE.CLIENT_ID;
    if (!clientId) {
      return res.redirect('/?google_auth_config=needed');
    }

    const callbackUrl = this.getGoogleCallbackUrl(req);
    const userId = req.user ? req.user.id : (req.query.userId || '');
    const redirectUri = encodeURIComponent(callbackUrl);
    const scope = encodeURIComponent('openid email profile https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/drive.readonly');
    const state = encodeURIComponent(JSON.stringify({ mode: 'FORMS_SYNC', userId, callbackUrl, ts: Date.now() }));

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent%20select_account&state=${state}`;

    return res.redirect(googleAuthUrl);
  }

  // Hủy kết nối quyền Google Forms cá nhân
  disconnectGoogleForms(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
      }
      db.prepare(`
        UPDATE users 
        SET google_forms_access_token = NULL, 
            google_forms_refresh_token = NULL, 
            google_forms_email = NULL, 
            google_forms_connected_at = NULL 
        WHERE id = ?
      `).run(req.user.id);

      return res.json({ success: true, message: 'Đã hủy kết nối tài khoản Google Forms thành công' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Lấy trạng thái kết nối Google Forms
  getGoogleFormsStatus(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
      }
      const u = db.prepare('SELECT google_forms_access_token, google_forms_email, google_forms_connected_at FROM users WHERE id = ?').get(req.user.id);
      return res.json({
        success: true,
        connected: !!(u && u.google_forms_access_token),
        email: u ? u.google_forms_email : null,
        connectedAt: u ? u.google_forms_connected_at : null
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Chuyển hướng trình duyệt đến máy chủ OAuth 2.0 chính thức của Google
  initiateGoogleOAuth(req, res) {
    const clientId = config.GOOGLE.CLIENT_ID;
    if (!clientId) {
      return res.redirect('/?google_auth_config=needed');
    }

    const callbackUrl = this.getGoogleCallbackUrl(req);
    const mode = req.query.mode || 'login';
    const redirectUri = encodeURIComponent(callbackUrl);
    const scope = encodeURIComponent('openid email profile');
    const state = encodeURIComponent(JSON.stringify({ mode, callbackUrl, ts: Date.now() }));

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent%20select_account&state=${state}`;

    return res.redirect(googleAuthUrl);
  }

  // Tiếp nhận kết quả ủy quyền từ Google và cấp phiên làm việc
  async handleGoogleOAuthCallback(req, res) {
    try {
      const { code, error, state } = req.query;
      if (error) {
        return res.redirect(`/?error=${encodeURIComponent('Đã hủy ủy quyền Google: ' + error)}`);
      }
      if (!code) {
        return res.redirect('/?error=missing_google_code');
      }

      // Xác định lại redirect_uri đã dùng khi yêu cầu ủy quyền
      let callbackUrl = this.getGoogleCallbackUrl(req);
      if (state) {
        try {
          const parsedState = JSON.parse(decodeURIComponent(state));
          if (parsedState.callbackUrl) callbackUrl = parsedState.callbackUrl;
        } catch (_) {}
      }

      // Đổi mã code lấy tokens từ Google
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.GOOGLE.CLIENT_ID,
          client_secret: config.GOOGLE.CLIENT_SECRET,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error('Lỗi đổi token từ Google:', tokenData);
        return res.redirect(`/?error=${encodeURIComponent(tokenData.error_description || 'Không thể lấy token xác thực từ Google')}`);
      }

      // Lấy thông tin tài khoản người dùng từ Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const googleUser = await userInfoResponse.json();

      // Kiểm tra nếu đây là luồng kết nối quyền Google Forms (FORMS_SYNC)
      let parsedState = null;
      if (state) {
        try {
          parsedState = JSON.parse(decodeURIComponent(state));
        } catch (_) {}
      }

      if (parsedState && parsedState.mode === 'FORMS_SYNC') {
        let targetUser = null;
        if (parsedState.userId) {
          targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(parsedState.userId);
        }
        if (!targetUser) {
          targetUser = db.prepare('SELECT id FROM users WHERE email = ?').get(String(googleUser.email).trim().toLowerCase());
        }

        if (targetUser) {
          db.prepare(`
            UPDATE users 
            SET google_forms_access_token = ?, 
                google_forms_refresh_token = COALESCE(?, google_forms_refresh_token), 
                google_forms_email = ?, 
                google_forms_connected_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).run(
            tokenData.access_token, 
            tokenData.refresh_token || null, 
            String(googleUser.email).trim().toLowerCase(), 
            targetUser.id
          );

          return res.redirect(`/?forms_connected=1&google_forms_email=${encodeURIComponent(googleUser.email)}`);
        }
      }

      const googleId = googleUser.sub;
      const email = String(googleUser.email).trim().toLowerCase();
      const name = googleUser.name || email.split('@')[0];

      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
      if (!user) {
        user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (user) {
          db.prepare('UPDATE users SET is_google_linked = 1, google_id = ?, is_email_verified = 1 WHERE id = ?').run(googleId, user.id);
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
        }
      }

      if (!user) {
        const userId = crypto.randomUUID();
        const randomPass = crypto.randomBytes(16).toString('hex');
        const passwordHash = bcrypt.hashSync(randomPass, 10);

        db.prepare(`
          INSERT INTO users (
            id, email, password_hash, name, role, credit_balance, point_balance, 
            trust_score, status, free_trial_surveys_available, is_google_linked, google_id, is_email_verified
          )
          VALUES (?, ?, ?, ?, 'RESPONDENT', 0.0, 0, 100.0, 'ACTIVE', 1, 1, ?, 1)
        `).run(userId, email, passwordHash, name, googleId);

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      }

      const sessionToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.redirect(`/?token=${sessionToken}&auth_success=google`);
    } catch (err) {
      console.error('Lỗi Google OAuth Callback:', err);
      return res.redirect(`/?error=${encodeURIComponent('Lỗi hệ thống trong quá trình đăng nhập Google')}`);
    }
  }

  /**
   * Gửi mã OTP xác thực email sinh viên (.edu.vn / .ac.vn)
   */
  async sendStudentEmailOtp(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để thực hiện thao tác này' });
      }

      const { student_email, university_code } = req.body;
      if (!student_email || typeof student_email !== 'string' || !student_email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email sinh viên hợp lệ' });
      }

      const cleanEmail = student_email.toLowerCase().trim();
      const matchingService = require('../services/matchingService');

      // Kiểm tra tính hợp lệ của email sinh viên (cú pháp username, loại trừ tài khoản hệ thống & tên miền trường)
      const isValidDomain = matchingService.isStudentEmailValid(cleanEmail, university_code);
      if (!isValidDomain) {
        return res.status(400).json({
          success: false,
          message: 'Email sinh viên không hợp lệ (phải có đuôi tên miền .edu.vn hoặc .ac.vn của trường đại học/cao đẳng hợp lệ)'
        });
      }

      // Kiểm tra email sinh viên đã được tài khoản khác xác thực chưa
      const existing = db.prepare('SELECT id FROM users WHERE student_email = ? AND id != ? AND is_student_verified = 1').get(cleanEmail, user.id);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email sinh viên này đã được xác thực bởi một tài khoản khác trong hệ thống'
        });
      }

      // Kiểm tra cooldown gửi mã OTP (60 giây)
      const currentUserRow = db.prepare('SELECT student_otp_sent_at FROM users WHERE id = ?').get(user.id);
      if (currentUserRow && currentUserRow.student_otp_sent_at) {
        const lastSentTime = Number(currentUserRow.student_otp_sent_at);
        const now = Date.now();
        const secondsElapsed = Math.floor((now - lastSentTime) / 1000);
        if (secondsElapsed >= 0 && secondsElapsed < 60) {
          const waitSeconds = 60 - secondsElapsed;
          return res.status(429).json({
            success: false,
            message: `Vui lòng đợi thêm ${waitSeconds} giây trước khi yêu cầu gửi lại mã OTP mới`,
            retryAfter: waitSeconds
          });
        }
      }

      // Sinh OTP 6 chữ số ngẫu nhiên (hết hạn sau 5 phút)
      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const sentAt = Date.now();

      db.prepare(`
        UPDATE users 
        SET student_email = ?, student_otp = ?, student_otp_expires_at = ?, student_otp_sent_at = ? 
        WHERE id = ?
      `).run(cleanEmail, hashRegistrationOtp(otp), expiresAt, sentAt, user.id);
      studentOtpAttempts.delete(user.id);

      // Che một phần địa chỉ email trước khi ghi log (không bao giờ in mã OTP ra console)
      const parts = cleanEmail.split('@');
      const maskedEmail = parts[0].slice(0, 2) + '***' + (parts[0].length > 3 ? parts[0].slice(-1) : '') + '@' + parts[1];

      console.log(`[STUDENT OTP] Gui ma xac thuc sinh vien den: ${maskedEmail} | Ma co hieu luc 5 phut`);

      // Gửi email qua sendSmartEmail
      const notificationService = require('../services/notificationService');
      const emailSubject = `[SurvHub] Mã xác thực email sinh viên của bạn: ${otp}`;
      const emailHtml = notificationService.buildOtpEmailTemplate({
        title: 'XÁC THỰC EMAIL SINH VIÊN',
        name: user.name || 'Bạn sinh viên',
        otp,
        validMinutes: 5,
        actionDescription: 'xác minh email trường để kích hoạt Gói Sinh Viên và định mức 30 lượt free/tháng',
        note: 'Mã có hiệu lực trong 5 phút. Vui lòng nhập mã để hoàn tất xác thực sinh viên.'
      });

      // Phải chờ kết quả gửi thật: nếu thất bại thì không được báo "đã gửi" cho người dùng
      let emailSendResult = { success: false, reason: 'Không có phản hồi từ dịch vụ email' };
      try {
        emailSendResult = await notificationService.sendSmartEmail({
          toEmail: cleanEmail,
          toName: user.name || 'Sinh viên',
          subject: emailSubject,
          htmlContent: emailHtml,
          textContent: `Ma xac thuc email sinh vien cua ban la: ${otp}. Ma co hieu luc trong 5 phut.`
        }) || emailSendResult;
      } catch (e) {
        console.warn('Loi gui Student Email OTP:', e.message);
        emailSendResult = { success: false, reason: e.message };
      }

      if (!emailSendResult.success) {
        // Hủy mã vừa tạo để người dùng được yêu cầu lại ngay, không bị kẹt cooldown 60 giây
        db.prepare('UPDATE users SET student_otp = NULL, student_otp_expires_at = NULL, student_otp_sent_at = NULL WHERE id = ?').run(user.id);
        studentOtpAttempts.delete(user.id);
        const failReason = emailSendResult.reason || emailSendResult.error || 'Không rõ nguyên nhân';
        console.warn(`[STUDENT OTP] Gui that bai toi ${maskedEmail}: ${JSON.stringify(failReason).slice(0, 300)}`);

        return res.status(503).json({
          success: false,
          message: 'Hệ thống chưa gửi được email xác thực tới hộp thư của bạn. Vui lòng thử lại sau ít phút hoặc liên hệ bộ phận hỗ trợ.',
          maskedEmail,
          debugOtp: process.env.NODE_ENV === 'test' ? otp : undefined
        });
      }

      return res.json({
        success: true,
        message: `Mã xác thực gồm 6 chữ số đã được gửi đến email ${maskedEmail}. Vui lòng nhập mã để hoàn tất!`,
        maskedEmail,
        channel: emailSendResult.mode || undefined,
        debugOtp: process.env.NODE_ENV === 'test' ? otp : undefined
      });
    } catch (err) {
      console.error('Lỗi sendStudentEmailOtp:', err);
      return res.status(500).json({ success: false, message: 'Lỗi gửi mã xác thực sinh viên: ' + err.message });
    }
  }

  /**
   * Xác nhận OTP email sinh viên, kích hoạt account_tier = 'STUDENT'
   */
  async verifyStudentEmailOtp(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để thực hiện thao tác này' });
      }

      const { otp } = req.body;
      if (!otp || typeof otp !== 'string' || !otp.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mã xác thực OTP 6 số' });
      }

      const cleanOtp = otp.trim();
      const row = db.prepare('SELECT student_email, student_otp, student_otp_expires_at, profile_completed, free_quota_remaining, account_tier FROM users WHERE id = ?').get(user.id);

      if (!row || !row.student_otp) {
        return res.status(400).json({ success: false, message: 'Chưa có mã xác thực nào được gửi hoặc mã đã được sử dụng' });
      }

      if (Date.now() > Number(row.student_otp_expires_at)) {
        studentOtpAttempts.delete(user.id);
        return res.status(400).json({ success: false, message: 'Mã xác thực OTP đã hết hạn (sau 5 phút). Vui lòng yêu cầu mã mới' });
      }

      const attempts = studentOtpAttempts.get(user.id) || 0;
      if (attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới'
        });
      }

      if (!secureOtpEquals(row.student_otp, cleanOtp)) {
        studentOtpAttempts.set(user.id, attempts + 1);
        if (attempts + 1 >= 5) {
          return res.status(429).json({
            success: false,
            message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới'
          });
        }
        return res.status(400).json({ success: false, message: 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại' });
      }

      // Khớp OTP: cập nhật account_tier = 'STUDENT', is_student_verified = 1
      // Nếu đã xong profile (profile_completed = 1) thì kích hoạt free_quota_remaining = 30
      let newFreeQuota = row.free_quota_remaining || 0;
      if (row.profile_completed === 1) {
        newFreeQuota = Math.max(newFreeQuota, 30);
      }

      // Thiết lập thời hạn sinh viên: 1 năm (365 ngày) kể từ thời điểm xác thực
      const nowIso = new Date().toISOString();
      const expiresIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      db.prepare(`
        UPDATE users 
        SET is_student_verified = 1,
            account_tier = 'STUDENT',
            student_verified_at = ?,
            student_expires_at = ?,
            student_otp = NULL,
            student_otp_expires_at = NULL,
            free_quota_remaining = ?
        WHERE id = ?
      `).run(nowIso, expiresIso, newFreeQuota, user.id);
      studentOtpAttempts.delete(user.id);

      const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      delete updatedUser.password_hash;
      delete updatedUser.email_otp;
      delete updatedUser.student_otp;

      return res.json({
        success: true,
        message: 'Xác thực email sinh viên thành công! Tài khoản đã được nâng cấp lên Gói Sinh Viên.',
        user: updatedUser
      });
    } catch (err) {
      console.error('Lỗi verifyStudentEmailOtp:', err);
      return res.status(500).json({ success: false, message: 'Lỗi xác nhận mã sinh viên: ' + err.message });
    }
  }

  /**
   * Cập nhật hồ sơ cá nhân và nhân khẩu học
   * Nhận các trường: gender, birth_date, province, occupation, university, major, graduation_year, monthly_income
   * Kiểm tra khóa 90 ngày: demographic_locked_until
   * Cấp 25 lượt free (Cá nhân) hoặc 30 lượt free/tháng (Sinh viên) khi hoàn thiện 100%
   */
  async updateDemographicProfile(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để cập nhật hồ sơ' });
      }

      const {
        gender,
        birth_date,
        province,
        occupation,
        university,
        major,
        graduation_year,
        monthly_income
      } = req.body;

      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      if (!userRow) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
      }

      // Kiểm tra khóa 90 ngày cho các trường nhân khẩu học cốt lõi (birth_date, gender, university, major)
      const isLocked = userRow.demographic_locked_until && (new Date(userRow.demographic_locked_until).getTime() > Date.now());

      if (isLocked) {
        const hasCoreChange = 
          (birth_date !== undefined && userRow.birth_date && birth_date !== userRow.birth_date) ||
          (gender !== undefined && userRow.gender && gender !== userRow.gender) ||
          (university !== undefined && userRow.university && university !== userRow.university) ||
          (major !== undefined && userRow.major && major !== userRow.major);

        if (hasCoreChange) {
          return res.status(403).json({
            success: false,
            message: `Hồ sơ nhân khẩu học cốt lõi (Ngày sinh, Giới tính, Trường học, Ngành học) đang bị khóa đến ${userRow.demographic_locked_until} để đảm bảo tính trung thực của dữ liệu khảo sát. Bạn chỉ có thể cập nhật các thông tin khác.`
          });
        }
      }

      // Chuẩn bị dữ liệu cập nhật
      const newGender = gender !== undefined ? String(gender).trim() : userRow.gender;
      const newBirthDate = birth_date !== undefined ? String(birth_date).trim() : userRow.birth_date;
      const newProvince = province !== undefined ? String(province).trim() : userRow.province;
      const newOccupation = occupation !== undefined ? String(occupation).trim() : userRow.occupation;
      const newUniversity = university !== undefined ? String(university).trim() : userRow.university;
      const newMajor = major !== undefined ? String(major).trim() : userRow.major;
      const newGradYear = graduation_year !== undefined ? Number(graduation_year) || null : userRow.graduation_year;
      const newMonthlyIncome = monthly_income !== undefined ? String(monthly_income).trim() : userRow.monthly_income;

      // Kiểm tra xem đã điền đủ 100% các trường chưa
      const isComplete = Boolean(
        newGender &&
        newBirthDate &&
        newProvince &&
        newOccupation &&
        newUniversity &&
        newMajor &&
        newGradYear &&
        newMonthlyIncome
      );

      let profileCompleted = userRow.profile_completed || 0;
      let demographicLockedUntil = userRow.demographic_locked_until;
      let freeQuotaRemaining = userRow.free_quota_remaining || 0;
      let rewardGranted = false;
      let rewardMessage = '';

      // Khi điền đủ 100% các trường:
      if (isComplete) {
        profileCompleted = 1;
        const lockDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        demographicLockedUntil = lockDate.toISOString();

        // Cấp lượt miễn phí nếu lần đầu tiên hoàn tất (profile_completed chuyển từ 0 lên 1)
        if (userRow.profile_completed !== 1) {
          rewardGranted = true;
          if (userRow.account_tier === 'STUDENT') {
            freeQuotaRemaining = Math.max(freeQuotaRemaining, 30);
            rewardMessage = 'Bạn đã hoàn thiện 100% hồ sơ và được mở khóa 30 lượt điền form miễn phí/tháng của Gói Sinh Viên!';
          } else {
            // PERSONAL hoặc mặc định
            freeQuotaRemaining = Math.max(freeQuotaRemaining, 25);
            rewardMessage = 'Bạn đã hoàn thiện 100% hồ sơ và được mở khóa 25 lượt điền form miễn phí đầu tay của Gói Cá Nhân!';
          }
        }
      }

      // Cập nhật cả demographics_json để tương thích ngược
      const demographicsObj = {
        gender: newGender,
        birth_date: newBirthDate,
        birth_year: newBirthDate ? parseInt(newBirthDate.split('-')[0]) : null,
        province: newProvince,
        province_code: newProvince,
        occupation: newOccupation,
        university: newUniversity,
        university_code: newUniversity,
        major: newMajor,
        major_category: newMajor,
        graduation_year: newGradYear,
        monthly_income: newMonthlyIncome
      };

      db.prepare(`
        UPDATE users 
        SET gender = ?,
            birth_date = ?,
            province = ?,
            occupation = ?,
            university = ?,
            major = ?,
            graduation_year = ?,
            monthly_income = ?,
            profile_completed = ?,
            demographic_locked_until = ?,
            free_quota_remaining = ?,
            demographics_json = ?
        WHERE id = ?
      `).run(
        newGender,
        newBirthDate,
        newProvince,
        newOccupation,
        newUniversity,
        newMajor,
        newGradYear,
        newMonthlyIncome,
        profileCompleted,
        demographicLockedUntil,
        freeQuotaRemaining,
        JSON.stringify(demographicsObj),
        user.id
      );

      const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      delete updatedUser.password_hash;
      delete updatedUser.email_otp;
      delete updatedUser.student_otp;

      return res.json({
        success: true,
        message: rewardGranted 
          ? `Cập nhật hồ sơ thành công! ${rewardMessage}` 
          : 'Cập nhật hồ sơ nhân khẩu học thành công',
        isComplete,
        rewardGranted,
        user: {
          ...updatedUser,
          demographics: demographicsObj
        }
      });
    } catch (err) {
      console.error('Lỗi updateDemographicProfile:', err);
      return res.status(500).json({ success: false, message: 'Lỗi cập nhật hồ sơ cá nhân: ' + err.message });
    }
  }

  /**
   * Đăng ký / Nâng cấp Hồ sơ Doanh nghiệp 2 Cấp độ
   * Cấp độ 1: Hồ sơ thương hiệu cơ bản (brand_name, industry, website_url, contact_phone) -> Kích hoạt ngay lập tức
   * Cấp độ 2: Định danh pháp nhân & thuế (company_legal_name, tax_id, headquarters_address, invoice_email) -> Mở quyền xuất VAT
   */
  async registerEnterpriseProfile(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để cập nhật hồ sơ doanh nghiệp' });
      }

      const {
        level = 1,
        brand_name,
        industry,
        website_url,
        contact_phone,
        company_legal_name,
        tax_id,
        headquarters_address,
        invoice_email
      } = req.body;

      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      if (!userRow) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }

      const targetLevel = Number(level) || 1;

      if (targetLevel === 2) {
        // Cấp độ 2: Định danh pháp nhân & thuế
        if (!company_legal_name || !tax_id || !headquarters_address || !invoice_email) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp đầy đủ: Tên pháp nhân công ty, Mã số thuế, Địa chỉ trụ sở và Email nhận hóa đơn'
          });
        }

        const cleanTaxId = String(tax_id).trim().replace(/\s+/g, '');
        // Kiểm tra định dạng MST: 10 chữ số hoặc 13 chữ số (VD: 0101234567 hoặc 0101234567-001 hoặc 0101234567001)
        const taxIdRegex = /^(\d{10}|\d{13}|\d{10}-\d{3})$/;
        if (!taxIdRegex.test(cleanTaxId)) {
          return res.status(400).json({
            success: false,
            message: 'Mã số thuế không hợp lệ. Mã số thuế doanh nghiệp phải gồm 10 hoặc 13 chữ số.'
          });
        }

        const cleanInvoiceEmail = String(invoice_email).trim().toLowerCase();
        if (!cleanInvoiceEmail.includes('@')) {
          return res.status(400).json({
            success: false,
            message: 'Email nhận hóa đơn điện tử không hợp lệ'
          });
        }

        db.prepare(`
          UPDATE users 
          SET account_tier = 'ENTERPRISE',
              enterprise_verify_level = 2,
              has_vip_enterprise = 1,
              company_legal_name = ?,
              tax_id = ?,
              headquarters_address = ?,
              invoice_email = ?,
              brand_name = COALESCE(?, brand_name, ?),
              industry = COALESCE(?, industry, 'Khác'),
              website_url = COALESCE(?, website_url),
              contact_phone = COALESCE(?, contact_phone)
          WHERE id = ?
        `).run(
          String(company_legal_name).trim(),
          cleanTaxId,
          String(headquarters_address).trim(),
          cleanInvoiceEmail,
          brand_name ? String(brand_name).trim() : null,
          String(company_legal_name).trim(),
          industry ? String(industry).trim() : null,
          website_url ? String(website_url).trim() : null,
          contact_phone ? String(contact_phone).trim() : null,
          user.id
        );

        const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
        delete updatedUser.password_hash;
        delete updatedUser.email_otp;
        delete updatedUser.student_otp;

        return res.json({
          success: true,
          message: 'Xác thực hồ sơ doanh nghiệp Cấp độ 2 thành công! Đã kích hoạt quyền xuất hóa đơn VAT và mở khóa toàn diện Gói Doanh Nghiệp.',
          enterprise_level: 2,
          user: updatedUser
        });
      }

      // Cấp độ 1: Hồ sơ thương hiệu cơ bản
      if (!brand_name || !industry) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp Tên thương hiệu/Tổ chức và Lĩnh vực hoạt động'
        });
      }

      const currentVerifyLevel = Math.max(userRow.enterprise_verify_level || 0, 1);

      db.prepare(`
        UPDATE users 
        SET account_tier = 'ENTERPRISE',
            enterprise_verify_level = ?,
            has_vip_enterprise = 1,
            brand_name = ?,
            industry = ?,
            website_url = ?,
            contact_phone = ?
        WHERE id = ?
      `).run(
        currentVerifyLevel,
        String(brand_name).trim(),
        String(industry).trim(),
        website_url ? String(website_url).trim() : null,
        contact_phone ? String(contact_phone).trim() : null,
        user.id
      );

      const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      delete updatedUser.password_hash;
      delete updatedUser.email_otp;
      delete updatedUser.student_otp;

      return res.json({
        success: true,
        message: 'Kích hoạt hồ sơ doanh nghiệp Cấp độ 1 thành công! Bạn có thể sử dụng đầy đủ các tính năng của Gói Doanh Nghiệp ngay bây giờ.',
        enterprise_level: currentVerifyLevel,
        user: updatedUser
      });
    } catch (err) {
      console.error('Lỗi registerEnterpriseProfile:', err);
      return res.status(500).json({ success: false, message: 'Lỗi đăng ký hồ sơ doanh nghiệp: ' + err.message });
    }
  }

  /**
   * Tải lên và cập nhật ảnh đại diện người dùng
   * POST /api/v1/auth/avatar
   */
  uploadAvatar(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
      }

      const rawInput = req.body.avatar_base64 || req.body.avatar || req.body.image;
      if (!rawInput || typeof rawInput !== 'string') {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp dữ liệu ảnh' });
      }

      const cleanInput = rawInput.trim();
      let buffer = null;
      let ext = 'png';

      const matches = cleanInput.match(/^data:([A-Za-z0-9\-+\/\.]+);base64,([\s\S]+)$/);

      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('png')) ext = 'png';
        else if (mime.includes('gif')) ext = 'gif';
        else {
          return res.status(400).json({ success: false, message: 'Định dạng ảnh không hỗ trợ. Vui lòng chọn PNG, JPG, GIF hoặc WebP' });
        }
        buffer = Buffer.from(matches[2], 'base64');
      } else if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://') || cleanInput.startsWith('/uploads/') || cleanInput.startsWith('/api/v1/media/')) {
        db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(cleanInput, user.id);
        const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
        delete updatedUser.password_hash;
        delete updatedUser.email_otp;
        delete updatedUser.student_otp;
        if (updatedUser.demographics_json) {
          try { updatedUser.demographics = JSON.parse(updatedUser.demographics_json); } catch (e) {}
        }
        return res.json({
          success: true,
          message: 'Cập nhật ảnh đại diện thành công',
          avatar_url: cleanInput,
          user: updatedUser
        });
      } else {
        // Hỗ trợ trường hợp base64 thuần (không có tiền tố data URI)
        try {
          buffer = Buffer.from(cleanInput, 'base64');
          if (!buffer || buffer.length === 0) {
            return res.status(400).json({ success: false, message: 'Dữ liệu ảnh không hợp lệ' });
          }

        } catch (e) {
          return res.status(400).json({ success: false, message: 'Dữ liệu ảnh không hợp lệ' });
        }
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ success: false, message: 'Dữ liệu ảnh không hợp lệ' });
      }

      const detectedType = verifyImageMagicBytes(buffer);
      if (!detectedType) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung tệp không phải là định dạng hình ảnh hợp lệ (Magic byte mismatch)'
        });
      }
      ext = detectedType === 'jpg' ? 'jpg' : detectedType;

      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'Dung lượng ảnh tối đa 5MB' });
      }

      const mediaId = 'avatar_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const mimeType = ext === 'jpg' ? 'image/jpeg' : (ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/gif'));

      // Chèn nhị phân buffer trực tiếp vào CSDL Turso (media_storage)
      db.prepare('INSERT INTO media_storage (id, mime_type, file_data, file_size) VALUES (?, ?, ?, ?)').run(mediaId, mimeType, buffer, buffer.length);

      // Giữ ghi một bản sao đĩa nếu thư mục tồn tại (để tương thích ngược)
      try {
        const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        // Dọn dẹp avatar cũ của người dùng để tránh tích tụ file thừa
        const existingFiles = fs.readdirSync(uploadDir);
        for (const file of existingFiles) {
          if (file.startsWith(`avatar_${user.id}_`)) {
            try { fs.unlinkSync(path.join(uploadDir, file)); } catch (_) {}
          }
        }
        const fileName = `${mediaId}.${ext}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
      } catch (_) {}

      const publicUrl = '/api/v1/media/' + mediaId;
      db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(publicUrl, user.id);

      const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      delete updatedUser.password_hash;
      delete updatedUser.email_otp;
      delete updatedUser.student_otp;
      if (updatedUser.demographics_json) {
        try { updatedUser.demographics = JSON.parse(updatedUser.demographics_json); } catch (e) {}
      }

      return res.json({
        success: true,
        message: 'Cập nhật ảnh đại diện thành công',
        avatar_url: publicUrl,
        user: updatedUser
      });
    } catch (err) {
      console.error('Lỗi uploadAvatar:', err);
      return res.status(500).json({ success: false, message: 'Lỗi tải lên ảnh đại diện: ' + err.message });
    }
  }
}

module.exports = new AuthController();