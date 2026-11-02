# PROJECT CONTEXT: NỀN TẢNG KHẢO SÁT & ĐỔI ĐIỂM KIẾM LỢI NHUẬN (VIBESURVEY)

> **Chính sách bảo trì file này (áp dụng từ 03-11-2026)**: Chỉ lưu giữ MỤC ĐÍCH, KIẾN TRÚC, GOTCHAS, HƯỚNG DẪN BÀN GIAO và CÁC VIỆC ĐANG MỞ. Mọi chi tiết sprint đã hoàn thành không ghi vào đây (git history là nơi lưu lịch sử). Việc nào giải quyết xong (user bảo xong / chuyển vấn đề khác) thì XÓA khỏi mục "Việc Đang Mở" ngay.

## 1. Mục Đích Cốt Lõi & Mô Hình Kinh Tế
- **Tên dự án**: **VibeSurvey / SurvHub** (Nền tảng Khảo sát Trực tuyến Kiếm Điểm & Lợi Nhuận). Trạng thái: DEMO, chưa có pháp nhân, chưa kinh doanh.
- **Mô hình thị trường 2 chiều**:
  1. **Respondent**: Làm khảo sát nhận Point (1 Point = 1 VNĐ), quy đổi thẻ cào / VietQR ngân hàng / MoMo / E-Voucher.
  2. **Creator / Doanh nghiệp**: Nạp Credit (1 Credit = 1 VNĐ, khóa van 1 chiều), ký quỹ Escrow theo 3 phân khúc (Sinh viên / Cá nhân / Doanh nghiệp) x độ dài form (Ngắn / Vừa / Dài).
- **Dòng tiền & Lợi nhuận sàn**: Spread margin giữa giá Creator trả và thù lao Respondent; Creator Boost chia 80/20 cố định (điền/sàn); phí rút: thẻ cào 10.000đ (0đ), ngân hàng/MoMo 50.000đ (2.000đ), từ 100.000đ miễn phí.
- **Anti-Fraud 5 chốt**: bẫy tốc độ, bẫy chú ý động, straight-lining, lọc tự luận (entropy), trust_score khởi điểm 85 (dưới 60 khóa quy đổi, dưới 40 auto-ban).

## 2. Kiến Trúc Hệ Thống & Cấu Trúc Thư Mục
- **Backend**: Node.js + Express, SQLite WAL (migration tự động khi khởi động), Transaction ACID, Double-Entry Ledger (`point_transactions`), Engine Anti-Fraud.
- **Frontend SPA**: Vanilla JS monolith (`public/app.js` ~20.6k dòng), Tailwind CSS CDN, Lucide Icons, Montserrat, palette Cam `#EA580C` / Trắng / Đen Obsidian (theo `DESIGN.md`).
- **Mobile**: Capacitor Android (`android/`), đồng bộ assets bằng `npm run sync:android`.
- **Bảo mật hiện hành**: bcrypt cost 10; JWT 7 ngày (localStorage); secrets fail-fast từ `.env` (`JWT_SECRET`, `PAYMENT_WEBHOOK_SECRET`, `PAYMENT_ACCOUNT_NUMBER`, `SEED_ACCOUNT_PASSWORDS`); CORS whitelist động (`CORS_ORIGINS`); rate-limit in-memory 300/phút API + 60/phút auth (`server/middlewares/rateLimit.js`, skip NODE_ENV=test); webhook ngân hàng so sánh `crypto.timingSafeEqual`.
- **Quyền riêng tư dữ liệu (audit 03-11-2026)**: EMAIL TÀI KHOẢN đáp viên là PII DUY NHẤT được chuyển giao creator, và chỉ khi khảo sát bật cờ `surveys.allow_email_collection` (mặc định TẮT). Demographics chỉ dùng nội bộ; helper `_stripPrivateProfileFields()` chặn mọi đường xuất (`surveyController.js`). Hiện đang dùng Gemini chỉ kiểm duyệt diễn đàn nội bộ (không trả nội dung AI cho user).

### Cấu Trúc Thư Mục Chuẩn
```
c:\Users\Lenovo\Downloads\Linh\
├── .agent/                    # Cấu hình quy chuẩn và ngữ cảnh Agent (rules.md, GEMINI.md)
├── android/                   # Dự án Capacitor Android Native
├── public/                    # Tài nguyên tĩnh SPA (app.js, index.html, logo.svg, assets)
├── server/                    # Mã nguồn máy chủ Node.js & Express
│   ├── config/                # Cấu hình kinh tế + secrets (index.js), danh mục trường ĐH, tỉnh thành
│   ├── controllers/           # Auth, Survey, Wallet, Admin controllers
│   ├── repositories/          # Data Access Layer (surveyRepository.js)
│   ├── services/              # AntiFraud, Ledger, PricingEngine, FormParser, Webhook, Sentinel, AuditLog
│   ├── db/                    # Database init (database.js), SQLite DB file
│   ├── middlewares/           # Auth JWT, RateLimit, IpBan, Validation
│   └── app.js                 # Express bootstrap (helmet CSP, CORS whitelist, rate-limit)
├── tests/                     # Bộ kiểm thử tự hành 17 tầng (chạy `npm test`, NODE_ENV=test)
├── backups/                   # Bản sao lưu dự phòng khi đại tu (timestamp rõ ràng)
├── DESIGN.md                  # Quy chuẩn thiết kế giao diện (Design System SSOT)
├── BAO_CAO_AUDIT_PHAP_LY_VN.md # Báo cáo audit pháp lý VN 03-11-2026 (7 checklist)
├── PROJECT_CONTEXT.md         # Ngữ cảnh liên tục (SSOT tinh gọn - file này)
└── survey-platform.code-workspace
```

## 3. Bản Đồ Code (Định Vị Nhanh Khi Cần Sửa)

### 3.1 Backend — `server/`
| File | Vai trò | Hàm / điểm chính |
|---|---|---|
| `app.js` | Bootstrap Express | helmet CSP, CORS whitelist (~67), rate-limit mount (~91), SPA fallback, error handler, start Sentinel 1h/lần |
| `config/index.js` | Secrets + toàn bộ kinh tế | `JWT_SECRET`, `PAYMENT_GATEWAY` (fail-fast từ env), `ECONOMICS` (giá sàn 3 phân khúc, SLA tiers, deposit tiers, take rate), `ANTI_FRAUD` (ngưỡng trust, speed trap) |
| `routes/api.js` | Định tuyến v1 | `/auth/*`, `/surveys/*`, `/wallet/*`, `/vouchers/*`, `/users/*`, `/forum/*`, `/push/*`, `/admin/*` (admin bọc `authenticateToken` + `requireRole(['ADMIN'])` + `checkIpBannedMiddleware`) |
| `controllers/authController.js` | Đăng ký/đăng nhập/OTP | `sendRegistrationOtp` (~80), `login` (~300), `sendVerificationOtp` (~540), OTP sinh viên (~1040), Google OAuth, profile/avatar/enterprise-profile |
| `controllers/surveyController.js` | Lõi khảo sát (file lớn nhất ~2.4k dòng) | `createSurvey` (~683), `updateSurvey` (~938), `getSurvey` (~600, có cờ `allow_email_collection`), `startSession` (~1400), `submitSurvey` (~1500+: validate + anti-fraud + thưởng), `_stripPrivateProfileFields` (~1505), webhook Sheets 2 luồng (~1823 edit, ~1910 nộp mới), `exportSurveyData` (~2100, CSV/JSON theo cờ email), analytics, close/delete |
| `controllers/walletController.js` | Ví & thanh toán | `depositCredit` (admin, test-bypass), `createDepositOrder`, `handlePaymentWebhook` (~317, timing-safe), payouts, swap Point→Credit (+5%), VAT invoices |
| `controllers/adminController.js` | Quản trị | overview, `searchUsers`, `/execute-command` (gồm `/cleantest`), duyệt payouts, fraud logs, audit logs |
| `controllers/voucherController.js` / `forumController.js` / `userController.js` / `bugReportController.js` | E-Voucher, diễn đàn, streak/checkin, báo lỗi | — |
| `services/ledgerService.js` | Sổ cái kép ACID (1.267 dòng) | `depositCredit`, `createDepositOrder` (~897, VietQR), `completeDepositOrder`, `refundRemainingEscrow` (~408), refund payout từ chối (~724), `handlePaymentWebhook` (~1129, ghép nội dung `/VIBE\d{6}/`) |
| `services/antiFraudService.js` | 5 chốt chặn (841 dòng) | `evaluateSubmission` (~339: speed/attention/straight-lining/open-text), trust deltas (~283: +2/+0,2/−5/−12, <40 ban), auto-ban device ≥3 & IP ≥5 (~704-784), `trackAndVerifyDeviceIp` |
| `services/surveyPricingService.js` | Định giá (684 dòng) | Báo giá 3 phân khúc x độ dài, SLA multiplier, thù lao động, phụ phí lọc |
| `services/formParserService.js` | Parser (4.380 dòng) | Bóc tách Google Forms / MS Forms / Smart Text Paste → 12 dạng câu hỏi |
| `services/webhookService.js` | Đồng bộ Sheets | `dispatchGoogleSheetsSync`, `formatPayload`, guard SSRF (`isValidUrl`/`isSafeUrl`) |
| `services/notificationService.js` | Email đa kênh | `sendSmartEmail` (Resend → Brevo → SMTP), `buildOtpEmailTemplate`, log `email_notifications_log` |
| `services/forumSentinelService.js` + `geminiSentinelService.js` | Kiểm duyệt AI nội bộ | Quét diễn đàn định kỳ, `auditContent` (Gemini flash-lite, chỉ verdict JSON), ẩn bài + trừ trust ngầm |
| `services/matchingService.js` / `voucherService.js` / `pushNotificationService.js` / `auditLogService.js` / `logoCrawlerService.js` | Lọc đối tượng (504 dòng) / voucher (892) / web push / `logAction` admin / crawler logo | — |
| `middlewares/auth.js` / `ipBan.js` / `rateLimit.js` | JWT + role + chặn BANNED / IP cấm / fixed-window in-memory (skip `NODE_ENV=test`) | — |
| `db/database.js` | Schema + migrations | Bảng `migrations` idempotent (~380, try/catch từng câu), `ensureEssentialAccounts` (seed từ `SEED_ACCOUNT_PASSWORDS`) |

### 3.2 Frontend — `public/app.js` (monolith ~20.6k dòng, đối tượng `VibeApp`)
Khoảng dòng mang tính tham khảo tại v4.9.5 — tìm theo **tên hàm** chính xác hơn:
| Khu vực | Dòng ~ | Hàm chính |
|---|---|---|
| Validation engine + core | 2-500 | `getDeviceFingerprint` (~556), `api()` (~430, token từ localStorage `survhub_token`) |
| Menu tài khoản | 1311 | `renderUserProfileDropdown` |
| Auth + điều khoản | 2410-3400 | `openAuthModal` (form đăng ký ~2548, checkbox điều khoản ~2637), `openTermsModal(event, isReadOnly)` 3177 (điều khoản v3.2, mục 5 dữ liệu cá nhân ~3278) |
| Điều hướng + Home | 3932-4639 | `renderNavigation`, `renderHomeView`, `handleOpenSurveyFromHome` |
| Danh sách khảo sát | 4639-5900 | `renderSurveysView` (phân trang 8 bài), `renderCompactSurveyCard`, `renderListSurveyRow` |
| Luồng làm bài | 5921-8300 | `renderTakeSurveyView` (intro + thông báo email ~6040), `renderQuestionOptions` (6332, 12 dạng), rẽ nhánh logic (~7275+), `renderReviewSurveyView` (8150) |
| Ví & quy đổi | 8329-9500 | `renderVoucherMarketView`, `renderWalletView` (8567), `openSwapPointsModal` (9396) |
| Nạp Credit | 9555 | `openDepositModal` (VietQR Napas247, bonus theo bậc) |
| Creator + analytics | 9867-11500 | `renderCreatorSurveysView`, `renderAnalyticsView` (10075), `openEditSurvey` (10156, điền lại toggle email) |
| Studio soạn khảo sát | 11571-15000 | `renderCreateSurveyView` (11576), editor câu hỏi (12400-14200), settings: webhook + toggle email (~11907), save payload POST/PUT (~14896, kèm `allow_email_collection`) |
| Hồ sơ 5 tab | 14989-16100 | `renderProfileView`, xác thực sinh viên `.edu.vn` (~14950+) |
| Admin | 16157-18800 | `renderAdminOverviewView` (16157), `renderAdminPayoutsView` (16645), `renderAdminFraudView` (17065), `openAdminConsoleModal` (18046) |
| Diễn đàn | 18860-20600 | `renderForumView`, `openCreateForumPostModal` (19734), render ảnh đính kèm |
- **`public/js/modules/`**: `customDropdown.js` (dropdown SSOT — cấm `<select>` thô), `adminAnalyticsModule.js`, `bugReportModule.js`, `lightboxViewer.js`.
- **`public/index.html`**: shell + footer liên hệ (244-266, 3 link pháp lý trỏ `openTermsModal`) + **cache-buster app.js dòng 554**.

### 3.3 CSDL — `server/db/vibesurvey.db` (SQLite WAL)
`users` (PII: `demographics_json`, OTP cột, trust_score) · `surveys` (+ `allow_email_collection`) · `questions` (logic_json, is_attention_check) · `responses` (`answers_payload`, quality_score) · `point_transactions` (sổ cái kép, 7 loại tx) · `deposit_orders` · `payout_requests` · `fraud_logs` / `device_ip_logs` / `banned_ips` · `registration_otps` · `voucher_campaigns` / `voucher_codes` · `forum_posts` / `forum_comments` / `forum_post_likes` · `notifications` / `push_subscriptions` / `daily_streaks` · `admin_audit_logs` / `bug_reports` / `warranty_claims` / `email_notifications_log` / `vat_invoices`.

### 3.4 Kiểm thử
`npm test` = `tests/run_all_tests.js` fork 17 suite với `NODE_ENV=test` + `DISABLE_REAL_EMAIL=true`; `tests/test_cleanup_helper.js` dọn dữ liệu test 8 hạng mục (chạy qua lệnh admin `/cleantest`).

## 4. Các Lưu Ý Kỹ Thuật Bắt Buộc (Technical Gotchas)
1. **Bảo mật câu hỏi bẫy**: API trả câu hỏi cho người điền phải bóc tách 100% `is_attention_check` và `expected_answer`.
2. **Double-entry Ledger**: mọi biến động số dư bọc Transaction ACID với kiểm tra số dư nguyên tử.
3. **Safe Escrow Refund**: hoàn tiền giới hạn bởi trần ký quỹ thực tế `Math.min(escrow_locked_balance, Math.max(0, TotalEscrow - (collected * effectivePrice)))`.
4. **Creator Boost 80/20 cố định** trên toàn hệ thống, không phân biệt gói.
5. **`normalizeFormUrl()`**: loại query rác (`?usp=sf_link`, `?fbclid`) trước khi kiểm tra trùng biểu mẫu.
6. **Bảo vệ Admin**: mọi logic tự động khóa phải có `AND role != 'ADMIN'`.
7. **Sau mỗi lần sửa `public/app.js`**: BẮT BUỘC nâng cache-buster tại `public/index.html` (~dòng 554, hiện `4.9.5_email_consent_security`) + chạy `npm run sync:android`.
8. **Modal điều khoản 2 chế độ**: `openTermsModal(event, isReadOnly)` — anchor ngoài luồng đăng ký (footer, trang auth) phải truyền `true`.
9. **Test bypass chỉ khi `NODE_ENV==='test'`**: `debugOtp`, webhook payment, `depositCredit` admin check — không mở rộng bỏ kiểm sang môi trường khác.
10. **Ràng buộc pháp lý trong code**: không được tái lập bất kỳ đường xuất dữ liệu nào đưa demographics (`__profile_*`) hoặc thông tin ngoài email (khi bật cờ) cho creator — xem mục 2 Quyền riêng tư.
11. **Major Overhaul Backup Protocol**: đại tu layout/design system/logic cốt lõi/schema → backup vào `backups/` với timestamp trước khi sửa; sửa nhỏ < 30 dòng thì không cần.

## 5. Hướng Dẫn Bàn Giao Cho Phiên Tiếp Theo
- Trước khi bắt đầu: đọc `PROJECT_CONTEXT.md` này + `DESIGN.md` + `AGENTS.md`.
- Kiểm tra toàn vẹn: chạy `npm test` (17 tầng, phải 100% PASS).
- Sau khi chỉnh sửa code: `node -c <file>`, nâng cache-buster nếu đụng app.js, `npm run sync:android`, cập nhật mục "Việc Đang Mở" trong file này, commit + push (auto_github_sync: true).
- Giao tiếp tiếng Việt, cấm emoji/icon màu trong mọi đầu ra.

## 6. Thông Tin Liên Hệ Thực Tế (Sản Phẩm Demo — Chưa Kinh Doanh)
- Chưa có pháp nhân; footer KHÔNG đưa MSDN/MST/trụ sở/kênh MXH giả định cho đến khi có thực tế.
- Địa chỉ: KTX B3, ĐH Bách Khoa Hà Nội (link Google Maps `https://share.google/dPIe7cYsGVPNhs4vC`).
- Hỗ trợ đáp viên & Hợp tác doanh nghiệp: `linharmykxbnvn@gmail.com`; Email phản ánh: `ngthtrung.son@gmail.com`.

## 7. Việc Đang Mở (Open Issues — xong việc nào xóa việc đó)
1. **Điều khoản mục 2 "tịch thu số dư" trong `public/app.js` (~dòng 3241)** — CHỜ USER CHỐT CÂU CHỮ theo bản mẫu Argon (kết hợp A+B+C bỏ D, 3 khoản mẫu + 3 rủi ro production đã lưu trong git history commit 35b32b5): tạm ngưng quyền quy đổi khi trust < 40; hủy thù lao từng giao dịch REJECTED_FRAUD theo sổ cái; bảo lưu + quyền quyết toán phần dư; khiếu nại 07 ngày làm việc.
2. **Kỹ nợ chấp nhận**: JWT lưu localStorage (đại tu auth riêng khi lên production); DB cũ còn `__profile_*` trong `answers_payload` (đã chặn xuất bằng strip runtime).
3. **Hạng mục pháp lý dồn sang giai đoạn production** (theo chỉ đạo — đang demo nên chưa làm): thành lập pháp nhân + công bố MST/SĐT footer + thông báo/đăng ký Bộ Công Thương; trang Chính sách bảo mật riêng; API xóa tài khoản/xuất dữ liệu; nhật ký hệ thống ≥ 12 tháng; chi tiết tại `BAO_CAO_AUDIT_PHAP_LY_VN.md`.
