// Bộ giới hạn tần suất đơn giản trong bộ nhớ (fixed window per IP) — không cần dependency ngoài
// Dùng cho lớp bảo vệ đầu tiên chống brute-force đăng nhập và làm cạn tài nguyên API
function createRateLimiter({ windowMs = 60000, max = 300, message = 'Quá nhiều yêu cầu từ địa chỉ IP của bạn. Vui lòng thử lại sau một phút.' } = {}) {
  const hits = new Map(); // key: ip, value: { count, windowStart }
  let lastCleanup = 0;

  return function rateLimiter(req, res, next) {
    if (process.env.NODE_ENV === 'test') return next(); // Bỏ qua khi chạy bộ kiểm thử tự hành
    // Chỉ dùng req.ip sau khi app đã cấu hình trust proxy. Không đọc XFF trực tiếp,
    // vì header này có thể do client tự gửi khi proxy chưa được tin cậy.
    const rawIp = String(req.ip || (req.socket && req.socket.remoteAddress) || 'unknown').trim();
    const key = rawIp || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || now - entry.windowStart >= windowMs) {
      entry = { count: 0, windowStart: now };
      hits.set(key, entry);
    }
    entry.count += 1;
    // Dọn dẹp định kỳ các entry cũ để không rò rỉ bộ nhớ, kể cả khi chưa vượt ngưỡng.
    if (now - lastCleanup >= windowMs || hits.size > 10000) {
      for (const [ip, e] of hits) {
        if (now - e.windowStart >= windowMs) hits.delete(ip);
      }
      lastCleanup = now;
    }
    if (entry.count > max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((windowMs - (now - entry.windowStart)) / 1000))));
      return res.status(429).json({ success: false, message, retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - entry.windowStart)) / 1000)) });
    }
    return next();
  };
}

module.exports = { createRateLimiter };
