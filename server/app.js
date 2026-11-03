const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes/api');
const { createRateLimiter } = require('./middlewares/rateLimit');

const app = express();

// Cloudflare Tunnel kết nối vào localhost. Chỉ tin proxy loopback để req.ip
// được suy ra từ X-Forwarded-For; client truy cập trực tiếp không thể tự chọn IP.
app.set('trust proxy', (ip) => ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1');

// Bao mat voi Helmet (cau hinh cho phep SPA, CDN va nhung assets/iframe an toan)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://accounts.google.com',
          'https://cdn.tailwindcss.com',
          'https://unpkg.com'
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com'
        ],
        fontSrc: [
          "'self'",
          'data:',
          'https://fonts.gstatic.com'
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:'
        ],
        mediaSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:'
        ],
        frameSrc: [
          "'self'",
          'https://accounts.google.com',
          'https://docs.google.com',
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com'
        ],
        connectSrc: [
          "'self'",
          'https://accounts.google.com',
          'https:'
        ]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Bật CORS cho cả Web Browser và Capacitor Native Mobile App (capacitor://localhost hoặc http://localhost)
// Whitelist động: chỉ cấp header CORS cho domain tin cậy, origin lạ sẽ bị trình duyệt tự chặn
const allowedOrigins = String(process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const capacitorOrigins = ['capacitor://localhost', 'http://localhost', 'https://localhost'];
const appUrlOrigin = (() => { try { return new URL(config.APP_URL).origin; } catch (e) { return null; } })();
const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
app.use(cors({
  origin: (origin, callback) => {
    // Yêu cầu same-origin/curl/mobile webview không gửi Origin: cho qua
    if (!origin) return callback(null, true);
    if (origin === appUrlOrigin || capacitorOrigins.includes(origin) || isLocalOrigin(origin) || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false); // Không cấp header CORS cho origin lạ (trình duyệt tự chặn)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Fingerprint', 'Idempotency-Key']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Phục vụ tài nguyên tĩnh của Frontend
app.use(express.static(path.join(__dirname, '../public')));
app.use('/src', express.static(path.join(__dirname, '../src')));

// Rate limit tổng cho toàn bộ API v1, sau đó limiter hẹp hơn riêng cho luồng xác thực
// (mount theo thứ tự: limiter tổng trước, limiter auth hẹp hơn sau, cả 2 đều trước router)
app.use('/api/v1', createRateLimiter({ windowMs: 60000, max: 300 }));
app.use('/api/v1/auth', createRateLimiter({ windowMs: 60000, max: 60, message: 'Quá nhiều thao tác xác thực. Vui lòng thử lại sau một phút.' }));
app.use('/api/v1/auth/login', createRateLimiter({
  windowMs: 60000,
  max: 10,
  message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau một phút.'
}));
app.use('/api/v1/auth/register', createRateLimiter({
  windowMs: 60000,
  max: 10,
  message: 'Quá nhiều yêu cầu tạo tài khoản. Vui lòng thử lại sau một phút.'
}));
app.use('/api/v1/auth/send-registration-otp', createRateLimiter({
  windowMs: 60000,
  max: 5,
  message: 'Quá nhiều yêu cầu gửi mã xác thực. Vui lòng thử lại sau một phút.'
}));

// Mount API v1
app.use('/api/v1', apiRoutes);

// Tuyến đường kiểm tra sức khỏe hệ thống (Health Check)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    service: 'SurvHub Platform Backend'
  });
});

// SPA Fallback: Trả về index.html cho các route phía Client
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Middleware xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi máy chủ nội bộ',
    error: config.NODE_ENV === 'development' ? err.message : undefined
  });
});

const forumSentinelService = require('./services/forumSentinelService');

if (require.main === module) {
  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`[MAY CHU] SurvHub Server dang chay tai: http://localhost:${PORT}`);
    console.log(`[THIET BI] Hybrid Mobile App san sang qua Capacitor Android`);
    console.log(`[BAO MAT] Anti-Fraud Engine va Double-Entry Ledger: KICH HOAT`);
    console.log(`[GIAM SAT] Micro AI Sentinel quet dinh ky Dien Dan: KICH HOAT`);
    console.log(`=======================================================`);
    // Khoi dong tien trinh quet ngam dinh ky dien dan (1 gio / lan)
    forumSentinelService.startPeriodicScan(3600000);
  });
}

module.exports = app;
