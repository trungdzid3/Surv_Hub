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
- **Frontend SPA**: Vanilla JS modular (đại tu 03-11-2026): `public/app.js` ~3.7k dòng (core init, theme, router, home, danh sách khảo sát, tiện ích chung) + `public/js/data/catalogs.js` (hằng danh mục, Object.freeze) + `public/js/utils.js` (VibeUtils) + 8 module miền nghiệp vụ tại `public/js/modules/` (voucherMarket, pushNotifications, walletLedger, adminConsole, forum, modalsTerms, creatorStudio, respondent + 4 module cũ customDropdown/lightboxViewer/bugReport/adminAnalytics). `pushNotifications.js` phân nhánh nền tảng qua `_isAndroidCapacitor()` và cập nhật banner bằng `_configurePushBanner()`: Android chỉ xin quyền và phát thông báo qua Capacitor `LocalNotifications`, Web mới dùng Web Notification API. Banner giữ `id="push-permission-banner"` và nằm ngay sau `header`, dùng class CSS `.push-permission-banner`; nội dung động được thay qua selector `.push-banner-message`. CSS bố trí cân đối desktop theo hàng và mobile theo cột, có khoảng cách an toàn với mobile bottom nav. Pattern: `Object.assign(window.VibeApp, X)`, script thuần nạp trước app.js, late-binding qua window. Bản đồ chi tiết: `docs/CODE_MAP.md`. Tailwind CSS CDN, Lucide, Montserrat, palette Cam `#EA580C` / Trắng / Đen Obsidian (theo `DESIGN.md`).
- **Mobile**: Capacitor Android (`android/`), đồng bộ assets bằng `npm run sync:android`.
- **Bảo mật hiện hành**: bcrypt cost 10; login mật khẩu bắt buộc hoàn tất email OTP trước khi phát JWT, TOTP RFC6238 tùy chọn với secret mã hóa AES-GCM; JWT 7 ngày vẫn lưu localStorage; secrets có fallback mặc định tự sinh cho bản demo và ưu tiên đọc từ `.env` / Environment Variables trên hosting (`JWT_SECRET`, `PAYMENT_WEBHOOK_SECRET`, `PAYMENT_ACCOUNT_NUMBER`); CORS whitelist động (`CORS_ORIGINS`); rate-limit in-memory 300/phút API + 60/phút auth (`server/middlewares/rateLimit.js`, skip NODE_ENV=test); webhook ngân hàng so sánh `crypto.timingSafeEqual`.
- **Quyền riêng tư dữ liệu (audit 03-11-2026)**: EMAIL TÀI KHOẢN đáp viên là PII DUY NHẤT được chuyển giao creator, và chỉ khi khảo sát bật cờ `surveys.allow_email_collection` (mặc định TẮT). Demographics chỉ dùng nội bộ; helper `_stripPrivateProfileFields()` chặn mọi đường xuất (`surveyController.js`). Hiện đang dùng Gemini chỉ kiểm duyệt diễn đàn nội bộ (không trả nội dung AI cho user).

### Cấu Trúc Thư Mục Chuẩn
```
c:\Users\Lenovo\Downloads\Linh\
├── .agent/                    # Cấu hình quy chuẩn và ngữ cảnh Agent (rules.md, GEMINI.md)
├── android/                   # Dự án Capacitor Android Native
├── public/                    # Tài nguyên tĩnh SPA (app.js, index.html, logo.svg, assets)
├── server/                    # Mã nguồn máy chủ Node.js & Express
│   ├── config/                # Cấu hình kinh tế + secrets (index.js), danh mục tên miền email sinh viên (universityEmailDomains.json), tỉnh thành
│   ├── controllers/           # Auth, Survey, Wallet, Admin controllers
│   ├── repositories/          # Data Access Layer (surveyRepository.js)
│   ├── services/              # AntiFraud, Ledger, PricingEngine, FormParser, Webhook, Sentinel, AuditLog
│   ├── db/                    # Database init (database.js), SQLite DB file
│   ├── middlewares/           # Auth JWT, RateLimit, IpBan, Validation
│   └── app.js                 # Express bootstrap (helmet CSP, CORS whitelist, rate-limit)
├── tests/                     # Bộ kiểm thử tự hành 23 tầng (chạy `npm test`, NODE_ENV=test)
├── backups/                   # Bản sao lưu dự phòng khi đại tu (timestamp rõ ràng)
├── docs/architecture/         # Sơ đồ kiến trúc Archify (HTML standalone + JSON nguồn)
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
| `config/index.js` | Secrets + toàn bộ kinh tế | `JWT_SECRET`, `PAYMENT_GATEWAY` (fallback demo an toàn, ưu tiên env), `ECONOMICS` (giá sàn 3 phân khúc, SLA tiers, deposit tiers, take rate), `ANTI_FRAUD` (ngưỡng trust, speed trap) |
| `routes/api.js` | Định tuyến v1 | `/auth/*`, `/surveys/*`, `/wallet/*`, `/vouchers/*`, `/users/*`, `/forum/*`, `/push/*`, `/admin/*`, `GET /media/:id` (stream ảnh công khai với Cache-Control 1 năm) |
| `controllers/authController.js` | Đăng ký/đăng nhập/OTP/2FA | `sendRegistrationOtp` (~80), `login` + login challenge/OTP (~300), TOTP setup/enable/disable/verify, `sendVerificationOtp` (~540), OTP sinh viên (~1040), Google OAuth, profile/avatar (lưu BLOB Turso `media_storage` bền vững)/enterprise-profile |
| `controllers/surveyController.js` | Lõi khảo sát (file lớn nhất ~2.4k dòng) | `createSurvey` (~683), `updateSurvey` (~938), `getSurvey` (~600, có cờ `allow_email_collection`), `startSession` (~1400), `submitSurvey` (~1500+: validate + anti-fraud + thưởng), `_stripPrivateProfileFields` (~1505), webhook Sheets 2 luồng (~1823 edit, ~1910 nộp mới), `exportSurveyData` (~2100, CSV/JSON theo cờ email), `uploadImage` (lưu BLOB Turso `media_storage`), `getMedia` (stream ảnh HTTP cache), analytics, close/delete |
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
| `services/matchingService.js` / `voucherService.js` / `pushNotificationService.js` / `auditLogService.js` / `logoCrawlerService.js` | Lọc đối tượng (504 dòng) / voucher (892, seed idempotent không transaction toàn cục, atomic conditional point deduction) / web push / `logAction` admin / crawler logo | `isStudentEmailValid` (~427: chuẩn `.edu.vn`/`.ac.vn`/`.udn.vn` + `emailSuffix` của `UNIVERSITIES` + catalog mở rộng), `detectUniversityFromEmail` (~482: danh bạ cũ trước, fallback `source: 'CATALOG'`) |
| `config/universityEmailDomains.json` + `services/universityDomainService.js` | Danh mục 320 tên miền email sinh viên (316 `student_usable`) bóc tách từ tài liệu tham chiếu cấu trúc email ĐH; không chứa email cá nhân; thay thế `config/vietnam_colleges_universities.json` (293 entry legacy, không code nào dùng) | `normalizeDomain`, `isKnownStudentDomain` (khớp cả subdomain), `findInstitutionByDomain`, `getStudentDomains`, `getStats` |
| `middlewares/auth.js` / `ipBan.js` / `rateLimit.js` | JWT + role + chặn BANNED / IP cấm / fixed-window in-memory (skip `NODE_ENV=test`) | — |
| `routes/api.js` | Auth route contract | `/auth/login`, `/auth/login/verify-otp` và alias `/auth/verify-login-otp`, TOTP setup/enable/disable/verify |
| `db/database.js` | Schema + migrations + Turso Embedded Replica | Bảng `migrations` idempotent (~380, try/catch từng câu), `createTursoDatabase` hỗ trợ libSQL Embedded Replica (`syncUrl`, `syncPeriod`, `USE_EMBEDDED_REPLICA`) bảo toàn ACID transaction đồng bộ trên local replica, `ensureEssentialAccounts` (seed từ `SEED_ACCOUNT_PASSWORDS`) |

### 3.2 Frontend — kiến trúc modular (đại tu Wave 1-7 ngày 03-11-2026)
Chi tiết đầy đủ theo Symbol: `docs/CODE_MAP.md` (SSOT điều hướng frontend — đọc file này trước khi sửa UI).
| File | Vai trò |
|---|---|
| `public/app.js` (~3.7k dòng) | RestrictionEngine, core init/theme/logo/dropdown/state, router `navigate`, home, danh sách khảo sát + bộ lọc, renderNavigation, metrics, tiện ích chung (`_formatFileSize`, `compressImageFile`, `generateValidationPlaceholder`, `getYouTubeEmbedUrl`, `getLucideSvg`, alias `escapeHtml`, `copyText`) |
| `public/js/data/catalogs.js` | `window.VibeData` (Object.freeze): 7 hằng danh mục (tỉnh thành, trường ĐH, categories, voucher catalog); back-compat `window.VIBE_*` |
| `public/js/data/policyContent.js` | `window.SURVHUB_POLICY_DOCS` (Object.freeze): SSOT nội dung 03 văn bản pháp lý `terms` / `privacy` / `rules` (meta `version` + `effectiveDate`), nạp ngay trước `modalsTerms.js` |
| `public/js/utils.js` | `window.VibeUtils`: `escapeHtml` canonical, `formatVND`, `refreshIcons` |
| `modules/creatorStudio.js` (~5.6k) | Studio soạn khảo sát: question builder 12 dạng, Smart Paste, escrow, image picker, forms auth |
| `modules/respondent.js` (~3.9k) | Runner làm bài phân đoạn + rẽ nhánh + review + hồ sơ 6 tab; hồ sơ có tab Bảo mật với thiết lập/bật/tắt TOTP thủ công (`startTotpSetup` ~3680, `enableTotpAction` ~3750, `disableTotpAction` ~3785, `copyTotpValue` ~3810) và xác thực email sinh viên qua OTP |
| `modules/adminConsole.js` (~2k) | Admin overview/payouts/fraud + Fast Command Console |
| `modules/forum.js` (~1.8k) | Diễn đàn + WYSIWYG + đính kèm + share |
| `modules/modalsTerms.js` (~1.8k) | Auth modal, Google auth, khung hiển thị 03 văn bản pháp lý dạng tab (nội dung đọc từ `policyContent.js`), streak, toast/modal/copy tiện ích |
| `modules/wallet-ledger.js` (~1.3k) | Ví, swap Point→Credit, nạp VietQR, payout |
| `modules/voucherMarket.js`, `pushNotifications.js`, `bugReportModule.js`, `adminAnalyticsModule.js`, `customDropdown.js`, `lightboxViewer.js` | Các miền nhỏ còn lại |
- Quy ước module mới: Object.assign(window.VibeApp, X) + JSDoc banner + nạp trước app.js trong index.html + bump cache-buster.

### 3.3 CSDL — `server/db/vibesurvey.db` (SQLite WAL)
`users` (PII: `demographics_json`, OTP cột, trust_score) · `surveys` (+ `allow_email_collection`) · `questions` (logic_json, is_attention_check) · `responses` (`answers_payload`, quality_score) · `point_transactions` (sổ cái kép, 7 loại tx) · `deposit_orders` · `payout_requests` · `fraud_logs` / `device_ip_logs` / `banned_ips` · `registration_otps` · `voucher_campaigns` / `voucher_codes` · `forum_posts` / `forum_comments` / `forum_post_likes` · `notifications` / `push_subscriptions` / `daily_streaks` · `admin_audit_logs` / `bug_reports` / `warranty_claims` / `email_notifications_log` / `vat_invoices`.

### 3.4 Kiểm thử
`npm test` = `tests/run_all_tests.js` fork 24 suite với `NODE_ENV=test` + `DISABLE_REAL_EMAIL=true`; tầng 24 = `tests/test_auth_2fa.js` (login token gating, OTP brute-force, single-use, expiry); `tests/test_cleanup_helper.js` dọn dữ liệu test 8 hạng mục (chạy qua lệnh admin `/cleantest`).
- Sơ đồ luồng xác thực email sinh viên: `docs/architecture/student-email-domain-validation.html` (nguồn `.archify/architecture-student-email-domains-*/candidate.json`).
- Bản đồ code frontend chi tiết: `docs/CODE_MAP.md`.

## 4. Các Lưu Ý Kỹ Thuật Bắt Buộc (Technical Gotchas)
1. **Bảo mật câu hỏi bẫy**: API trả câu hỏi cho người điền phải bóc tách 100% `is_attention_check` và `expected_answer`.
2. **Double-entry Ledger**: mọi biến động số dư bọc Transaction ACID với kiểm tra số dư nguyên tử.
3. **Safe Escrow Refund**: hoàn tiền giới hạn bởi trần ký quỹ thực tế `Math.min(escrow_locked_balance, Math.max(0, TotalEscrow - (collected * effectivePrice)))`.
4. **Creator Boost 80/20 cố định** trên toàn hệ thống, không phân biệt gói.
5. **`normalizeFormUrl()`**: loại query rác (`?usp=sf_link`, `?fbclid`) trước khi kiểm tra trùng biểu mẫu.
6. **Bảo vệ Admin**: mọi logic tự động khóa phải có `AND role != 'ADMIN'`.
7. **Sau mỗi lần sửa `public/app.js` hoặc module**: BẮT BUỘC nâng cache-buster tại `public/index.html` (khối script cuối ~dòng 555-575, hiện `4.9.13_student_otp_fix`) + chạy `npm run sync:android`. Sửa file module nào thì bump buster của chính file đó.
8. **Modal văn bản pháp lý 3 tab, 2 chế độ**: `openTermsModal(event, isReadOnly, initialDocId)` — `initialDocId` nhận `terms` / `privacy` / `rules`; anchor ngoài luồng đăng ký (footer, Google OAuth modal, link trong hồ sơ) phải truyền `isReadOnly = true` để ẩn nút "Tôi Đồng Ý". Nội dung lấy từ `window.SURVHUB_POLICY_DOCS`; thiếu dữ liệu thì báo toast lỗi thay vì render rỗng.
9. **Test bypass chỉ khi `NODE_ENV==='test'`**: `debugOtp`, webhook payment, `depositCredit` admin check — không mở rộng bỏ kiểm sang môi trường khác.
10. **Ràng buộc pháp lý trong code**: không được tái lập bất kỳ đường xuất dữ liệu nào đưa demographics (`__profile_*`) hoặc thông tin ngoài email (khi bật cờ) cho creator — xem mục 2 Quyền riêng tư.
11. **Major Overhaul Backup Protocol**: đại tu layout/design system/logic cốt lõi/schema → backup vào `backups/` với timestamp trước khi sửa; sửa nhỏ < 30 dòng thì không cần.
12. **Render free tier chặn outbound cổng 25/465/587** (từ 26-09-2025): 2 kênh SMTP (Gmail/Outlook) sẽ treo rồi timeout trên Render. `sendSmartEmail` tự bỏ qua SMTP khi `process.env.RENDER === 'true'` (bật lại bằng `ENABLE_SMTP_ON_RENDER=true` nếu dùng instance trả phí); kênh khả dụng duy nhất là Brevo REST API. Sender Brevo phải là email đã xác thực trong tài khoản Brevo, nếu không API trả 400 và không gửi được mail.
13. **OTP sinh viên phải phản ánh đúng kết quả gửi**: `authController.sendStudentEmailOtp` `await` `sendSmartEmail`, trả HTTP 503 + hủy `student_otp*` (reset cooldown) khi gửi thất bại; không được báo "đã gửi" khi chưa gửi. Cả 2 hàm SMTP có timeout 10 giây để không treo request.
14. **Dọn tài khoản test**: `tests/test_cleanup_helper.js` nhận diện thêm `matched_*`, `unmatched_*`, `t_<timestamp>@v.com`; nếu bảng xếp hạng diễn đàn hiện tên lạ 0 form thì kiểm tra tài khoản rác trong `users` trước khi sửa UI.
15. **Tài nguyên 3D phải nằm trong `public/assets/3d/`**: commit `921bceb` (Wave 1) đã xóa trắng thư mục này khỏi bản web (chỉ còn bản Android) khiến ảnh ví/coin/gift vỡ 404 trên web; đã khôi phục rồi dọn còn đúng 4 file SVG đang được tham chiếu: `wallet_3d_master.svg` (thẻ Point), `coins_coupon_3d_master.svg` (thẻ Credit), `gift_box_3d_master.svg`, `empty_state_3d_master.svg`; 29 file `_clean`/`_full`/`_exact`/`_master.png` đã xóa vì không nơi nào dùng. Khi thêm ảnh/icon mới, luôn đặt trong `public/` rồi chạy `npm run sync:android`, không làm ngược lại. Kiểm tra nhanh: liệt kê mọi đường dẫn `/assets/...` trong `public/js/**` và đối chiếu sự tồn tại trước khi commit.

## 5. Hướng Dẫn Bàn Giao Cho Phiên Tiếp Theo
- Trước khi bắt đầu: đọc `PROJECT_CONTEXT.md` này + `DESIGN.md` + `AGENTS.md`.
- Kiểm tra toàn vẹn: chạy `npm test` (23 tầng, phải 100% PASS).
- Sau khi chỉnh sửa code: `node -c <file>`, nâng cache-buster nếu đụng app.js, `npm run sync:android`, cập nhật mục "Việc Đang Mở" trong file này, commit + push (auto_github_sync: true).
- Giao tiếp tiếng Việt, cấm emoji/icon màu trong mọi đầu ra.

## 6. Thông Tin Liên Hệ Thực Tế (Sản Phẩm Demo — Chưa Kinh Doanh)
- Chưa có pháp nhân; footer KHÔNG đưa MSDN/MST/trụ sở/kênh MXH giả định cho đến khi có thực tế.
- Địa chỉ: Kí túc xá B3, Đại học Bách khoa Hà Nội (link Google Maps `https://maps.app.goo.gl/dGL8PMp5K2o9yYz68`).
- Hỗ trợ đáp viên & Hợp tác doanh nghiệp: `linharmykxbnvn@gmail.com`; Email phản ánh: `ngthtrung.son@gmail.com`.

## 7. Việc Đang Mở (Open Issues — xong việc nào xóa việc đó)
1. **Hạng mục pháp lý dồn sang giai đoạn production** (theo chỉ đạo — đang demo nên chưa làm): thành lập pháp nhân + công bố MST/SĐT footer + thông báo/đăng ký Bộ Công Thương; API tự phục vụ xóa tài khoản/xuất dữ liệu + consent log phía server (hiện đồng ý mới ghi nhận ở client, văn bản pháp lý đã mở kênh yêu cầu qua email); nhật ký hệ thống ≥ 12 tháng; chi tiết tại `BAO_CAO_AUDIT_PHAP_LY_VN.md`. Ba văn bản pháp lý (Điều khoản / Bảo vệ dữ liệu cá nhân / Quy chế hoạt động) đã viết lại và hiển thị trong ứng dụng.
