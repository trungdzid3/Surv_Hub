// Bộ giới hạn tần suất đơn giản trong bộ nhớ (fixed window per IP) — không cần dependency ngoài
// Dùng cho lớp bảo vệ đầu tiên chống brute-force đăng nhập và làm cạn tài nguyên API
function createRateLimiter({ windowMs = 60000, max = 300, message = 'Quá nhiều yêu cầu từ địa chỉ IP của bạn. Vui lòng thử lại sau một phút.' } = {}) {
  const hits = new Map(); // key: ip, value: { count, windowStart }
  return function rateLimiter(req, res, next) {
    if (process.env.NODE_ENV === 'test') return next(); // Bỏ qua khi chạy bộ kiểm thử tự hành
    const rawIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    const now = Date.now();
    let entry = hits.get(rawIp);
    if (!entry || now - entry.windowStart >= windowMs) {
      entry = { count: 0, windowStart: now };
      hits.set(rawIp, entry);
    }
    entry.count += 1;
    // Dọn dẹp định kỳ các entry cũ để không rò rỉ bộ nhớ
    if (hits.size > 10000) {
      for (const [ip, e] of hits) { if (now - e.windowStart >= windowMs) hits.delete(ip); }
    }
    if (entry.count > max) {
      return res.status(429).json({ success: false, message });
    }
    return next();
  };
}

module.exports = { createRateLimiter };
