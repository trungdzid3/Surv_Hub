const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/database');

function verifyJwt(token, callback) {
  jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }, callback);
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== 'string') return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) return null;
  return parts[1];
}

function isRevokedToken(decoded, user) {
  if (!decoded || !decoded.iat || !user.banned_at) return false;
  const bannedAt = Date.parse(user.banned_at);
  return Number.isFinite(bannedAt) && decoded.iat * 1000 <= bannedAt;
}

function isBlockedUser(user) {
  return ['SUSPENDED', 'BANNED'].includes(String(user.status || '').toUpperCase());
}

function sanitizeUser(user) {
  delete user.password_hash;
  delete user.email_otp;
  delete user.student_otp;
  return user;
}

function authenticateToken(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Yêu cầu token hợp lệ để truy cập tài nguyên này' });
  }

  verifyJwt(token, (err, decoded) => {
    if (err || !decoded || typeof decoded.id !== 'string') {
      return res.status(403).json({ success: false, message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại' });
    }
    if (isRevokedToken(decoded, user)) {
      return res.status(403).json({ success: false, message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
    }
    if (isBlockedUser(user)) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn không ở trạng thái hoạt động và hiện không được phép truy cập' });
    }

    sanitizeUser(user);
    db.prepare("UPDATE users SET last_active_at = datetime('now') WHERE id = ?").run(user.id);
    req.user = user;
    next();
  });
}

function optionalAuthenticateToken(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  verifyJwt(token, (err, decoded) => {
    if (err || !decoded || typeof decoded.id !== 'string') {
      req.user = null;
      return next();
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (user && !isBlockedUser(user) && !isRevokedToken(decoded, user)) {
      req.user = sanitizeUser(user);
    } else {
      req.user = null;
    }
    next();
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện hành động này. Yêu cầu vai trò: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  requireRole
};
