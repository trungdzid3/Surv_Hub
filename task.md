# TASK: ĐẠI TU MODULAR HÓA app.js THEO MIỀN NGHIỆP VỤ (8 WAVE) - TIẾN ĐỘ ĐÊM 03-11-2026

## LOGIN 2FA HARDENING 03-11-2026
- [x] Task L5: Bổ sung tab cài đặt Bảo mật trong Profile, thiết lập secret TOTP thủ công, bật/tắt bằng mã xác thực và cập nhật trạng thái từ `/auth/me` | [Agent: frontend-security-settings] | [Skill: impeccable, hallmark, design-taste-frontend] | [Locked Files: public/js/modules/respondent.js]
- [x] Task L1: Triển khai email OTP sau mật khẩu và TOTP RFC6238 tùy chọn, token chỉ phát hành sau khi hoàn tất xác thực hai bước | [Agent: auth-2fa-backend-specialist] | [Skill: security-audit] | [Locked Files: server/controllers/authController.js, server/db/database.js, server/routes/api.js]
- [x] Task L2: Cập nhật giao diện đăng nhập để xử lý bước OTP, trạng thái 2FA và không lưu token trước khi xác minh | [Agent: auth-2fa-frontend-specialist] | [Skill: design-taste-frontend] | [Locked Files: public/js/modules/modalsTerms.js]
- [x] Task L3: Bổ sung kiểm thử hồi quy cho login OTP/TOTP, chạy syntax và kiểm tra browser flow | [Agent: auth-2fa-qa-specialist] | [Skill: security-audit] | [Locked Files: tests/test_auth_2fa.js]
- [x] Task L4: Tích hợp, cập nhật context/code map và nghiệm thu toàn bộ | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: PROJECT_CONTEXT.md, docs/CODE_MAP.md]

## SECURITY PATCH 03-11-2026
- [x] Task S1: Fail-closed payment webhook và xác minh số tiền giao dịch | [Agent: payment-webhook-specialist] | [Skill: security-audit] | [Locked Files: server/config/index.js, server/controllers/walletController.js]
- [x] Task S2: Bắt buộc ownership cho deposit-order lookup | [Agent: deposit-order-specialist] | [Skill: security-audit] | [Locked Files: server/routes/api.js, server/services/ledgerService.js]
- [x] Task S3: Tích hợp kiểm thử, cập nhật ngữ cảnh và xác minh diff | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: PROJECT_CONTEXT.md, tests/]

## ACCOUNT SECURITY HARDENING 03-11-2026
- [x] Task A1: Fail-closed JWT và kiểm tra session/token tại middleware | [Agent: account-session-specialist] | [Skill: security-audit] | [Locked Files: server/config/index.js, server/middlewares/auth.js]
- [x] Task A2: Hardening OTP đăng ký và xác minh auth flow | [Agent: otp-auth-specialist] | [Skill: security-audit] | [Locked Files: server/controllers/authController.js]
- [x] Task A3: Tin cậy IP và rate-limit chống brute force | [Agent: rate-limit-specialist] | [Skill: security-audit] | [Locked Files: server/middlewares/rateLimit.js, server/app.js]
- [x] Task A4: Tích hợp kiểm thử, cập nhật context và rà soát thay đổi | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: PROJECT_CONTEXT.md, tests/]

Kiến trúc đích: app.js còn ~4k dòng (core init, router, home, nav) + data/catalogs.js + utils.js + 7 module miền nghiệp vụ (creator-studio, respondent, wallet-ledger, admin-console, forum, modals-terms, notifications). Mỗi wave: node -c + npm test + sync:android + commit.

- [x] Wave 0: Dọn dẹp + bảo mật hygiene: untrack tài liệu tham chiếu cấu trúc email sinh viên (không phải PII - đã xác minh 03-11-2026), .gitignore chặn file dữ liệu, vệ sinh mật khẩu clean_database.js, xóa 10 script one-off + .archify + .pdf-build + backup cũ + PDF superseded | [Orchestrator + senior-coder]
- [x] Wave 0b: Test registry: xóa test chết/one-off/live-service, đăng ký 5 suite PASS (tầng 18-22), cơ chế tự dọn tests/reports/ khi PASS | [Orchestrator]
- [x] Wave 1: catalogs.js (7 hằng danh mục, Object.freeze) + utils.js (escapeHtml/formatVND/refreshIcons) + hợp nhất 3 cặp hàm trùng + voucherMarket.js + pushNotifications.js (fix rò rỉ visibilitychange) + docs/CODE_MAP.md + cache-buster 4.9.6. app.js 20.612 -> 19.685 dòng. npm test 22/22 PASS (18.96s) | [senior-coder + Orchestrator QA]
- [x] Wave 2: tách modules/wallet-ledger.js (1.331 dòng, 22 hàm) — app.js 18.387 | commit 5cf54d3
- [x] Wave 3: tách modules/adminConsole.js (2.005 dòng, 21 hàm + 3 state) — app.js 16.419 | commit 241256c
- [x] Wave 4: tách modules/forum.js (1.792 dòng, 30 hàm) — app.js 14.674 | commit 0a65b5b
- [x] Wave 5: tách modules/modalsTerms.js (1.766 dòng, 36 hàm: auth modal + điều khoản + streak + tiện ích modal) — app.js 12.963 | commit ba94d26
- [x] Wave 6: tách modules/creatorStudio.js (5.612 dòng, 113 hàm) — app.js 7.499 | commit 1374636
- [x] Wave 7: tách modules/respondent.js (3.824 dòng, 33 hàm: runner + review + hồ sơ) — app.js 3.736 ĐẠT KPI ~4k; fix test tầng 16 đọc nguồn gộp modules
- [x] Wave 8: QA tổng: npm test 22/22 PASS; QA bot headless Playwright 7/7 kịch bản PASS, 0 console error (auth, studio, làm bài, anti-fraud, ví, diễn đàn, responsive); sync android; PROJECT_CONTEXT + CODE_MAP chốt; push toàn bộ

## Sprint 03-11-2026 (Buổi 2): Fix layout filter bar + modal điều khoản read-only (phiên khác đã hoàn thành)

## SPRINT 03-11-2026 (BUOI 2): FIX LAYOUT FILTER BAR + MODAL DIEU KHOAN READ-ONLY

- [x] Task A: Sua loi thieu the </div> vung HANG 2 filter bar khao sat (public/app.js ~dong 5014-5114): them 1 the </div> truoc comment "Cum ben phai" (~dong 5089) de cum phai (Toggle "Hien bai da lam" + vach phan cach + Grid/List switcher) thanh sibling truc tiep, kich hoat justify-between -> don cum phai can bien phai doi xung voi cum trai | [Agent: layout-fixer (senior-coder)] | [Locked Files: public/app.js]
- [x] Task B: Modal Dieu khoan mo tu footer van hien nut dong y dang ky -> them che do read-only (an dong "Bang viec bam xac nhan..." + nut [Dong]/[Toi Dong Y Dieu Khoan], chi giu nut X); giu nguyen luong dang ky (link trong checkbox dong 2640 van che do consent) | [Agent: terms-modal-fixer (senior-coder)] | [Locked Files: public/index.html (sua ngay), public/app.js (CHI sua sau khi Task A xong - duoc Lead mo khoa)]
- [x] Task C: Tich hop nghiem thu: node -c, npm run sync:android, cap nhat PROJECT_CONTEXT.md, commit + push | [Agent: Lead Orchestrator] | [Locked Files: android/, PROJECT_CONTEXT.md]

## SPRINT 04-11-2026: SURVHUB TIMO VIETQR & WEBHOOK AUTOMATION
- [x] Task T1: Xây dựng module vietQrService.js sinh mã VietQR NAPAS247 chuẩn EMVCo TLV + CRC16-CCITT in-process | [Agent: Subagent-VietQrCore] | [Skill: security-audit] | [Locked Files: server/services/vietQrService.js]
- [x] Task T2: Cập nhật config Timo (BIN 963388, STK 9021773148754, NGUYEN THANH TRUNG) và nâng cấp ledgerService.js tiền tố SURV, regex webhook và giữ nút nạp test | [Agent: Subagent-LedgerTimo] | [Skill: security-audit] | [Locked Files: server/config/index.js, server/services/ledgerService.js]
- [x] Task T3: Đảm bảo giao diện ví wallet-ledger.js hiển thị đúng thông tin Timo, mã SURV, nhúng logo SurvHub ở tâm QR, xử lý PENDING_MISMATCH và giữ nguyên nút nạp test mô phỏng | [Agent: Subagent-WalletUI] | [Skill: design-taste-frontend] | [Locked Files: public/js/modules/wallet-ledger.js]
- [x] Task T4: Viết bộ kiểm thử hồi quy tests/test_timo_vietqr_webhook.js kiểm tra sinh mã VietQR, tạo đơn SURV, webhook khớp lệnh và nút nạp test | [Agent: Subagent-QA] | [Skill: security-audit] | [Locked Files: tests/test_timo_vietqr_webhook.js]
- [x] Task T5: Lead Orchestrator: Syntax verification, npm test 25 tầng (100% PASS), sync Android, cập nhật PROJECT_CONTEXT.md và xuất tài liệu hướng dẫn cấu hình Render/Google Apps Script | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: PROJECT_CONTEXT.md, task.md]

## SPRINT 04-11-2026: CORE ADMIN AUTONOMOUS BOOTSTRAP & GOOGLE OAUTH ROLE HARDENING
- [x] Task AD1: Khắc phục ensureEssentialAccounts trong database.js đảm bảo các tài khoản Admin cốt lõi luôn được tạo/khôi phục role='ADMIN' và is_google_linked=1 kể cả khi vắng mặt SEED_ACCOUNT_PASSWORDS | [Agent: Subagent-AdminDB] | [Skill: security-audit] | [Locked Files: server/db/database.js]
- [x] Task AD2: Bổ sung chốt chặn CORE_ADMIN_EMAILS tại googleAuth và handleGoogleOAuthCallback trong authController.js đảm bảo email admin không bao giờ bị hạ xuống RESPONDENT | [Agent: Subagent-AdminAuth] | [Skill: security-audit] | [Locked Files: server/controllers/authController.js]
- [x] Task AD3: Kiểm tra cú pháp node -c, chạy npm test, đồng bộ khôi phục tài khoản trong CSDL thực tế và nghiệm thu | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: task.md, PROJECT_CONTEXT.md]

## SPRINT 04-11-2026: DEMO PERFORMANCE OPTIMIZATION (GZIP COMPRESSION & SWR CACHE)
- [x] Task P1: Tối ưu backend server/app.js (Bật nén Gzip tích hợp bằng module zlib chuẩn Node.js không cài thư viện mới; thêm HTTP Cache-Control và maxAge cho express.static giảm 70% băng thông tải) | [Agent: Subagent-BackendPerf] | [Skill: security-audit] | [Locked Files: server/app.js]
- [x] Task P2: Tối ưu frontend public/js/modules/pushNotifications.js và public/app.js (Triển khai Stale-While-Revalidate cho Thông Báo và Khảo Sát: render tức thì từ cache < 10ms, âm thầm fetch ngầm ở background, xóa bỏ trạng thái treo 'Đang tải thông báo...', bổ sung hàm loadSurveys) | [Agent: Subagent-FrontendSWR] | [Skill: design-taste-frontend] | [Locked Files: public/js/modules/pushNotifications.js, public/app.js]
- [x] Task P3: Lead Orchestrator: Bump cache-buster index.html, kiểm tra cú pháp, chạy 25 suites npm test, sync Android và commit Git auto_github_sync | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: public/index.html, task.md]

## SPRINT 04-11-2026: SURVHUB REBRANDING & OPENCODE CLI FIRST POLICY
- [x] Task N1: Cập nhật C:\Users\Lenovo\.gemini\GEMINI.md bổ sung quy tắc ưu tiên OpenCode CLI hơn hết (CLI First) và chỉ định 2 họ model cho phép: DeepSeek và GLM 5.3 Flash, đồng bộ tên dự án SurvHub | [Agent: Subagent-GlobalRuleSync] | [Skill: writing-guidelines] | [Locked Files: C:/Users/Lenovo/.gemini/GEMINI.md]
- [x] Task N2: Đồng bộ tên dự án SurvHub và quy tắc OpenCode CLI First (DeepSeek / GLM 5.3 Flash) trong PROJECT_CONTEXT.md và .agent/GEMINI.md | [Agent: Subagent-ContextSurvHubSync] | [Skill: writing-guidelines] | [Locked Files: PROJECT_CONTEXT.md, .agent/GEMINI.md]
- [x] Task N3: Đồng bộ tên dự án SurvHub và quy tắc OpenCode CLI First trong AGENTS.md, .agent/rules.md và DESIGN.md | [Agent: Subagent-WorkspaceSurvHubSync] | [Skill: writing-guidelines] | [Locked Files: AGENTS.md, .agent/rules.md, DESIGN.md]
- [x] Task N4: Lead Orchestrator tích hợp, rà soát diff, kiểm tra cú pháp và commit GitHub theo auto_github_sync | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: task.md]

## SPRINT 04-11-2026: GLOBAL & WORKSPACE RULES UNIFICATION
- [x] Task R1: Đồng bộ các phần bổ sung từ .agent/GEMINI.md lên C:\Users\Lenovo\.gemini\GEMINI.md toàn cục (Multi-Agent CLI qua OpenCode/Antigravity D:\AI-CLIs\, nguyên tắc chọn worker cho Lead Orchestrator, và Major Overhaul Backup Protocol) | [Agent: Subagent-GlobalRuleSync] | [Skill: writing-guidelines] | [Locked Files: C:/Users/Lenovo/.gemini/GEMINI.md]
- [x] Task R2: Cập nhật PROJECT_CONTEXT.md và tinh chỉnh .agent/GEMINI.md chỉ thị rõ thứ bậc SSOT và các tệp rule mà AI bắt buộc phải đọc | [Agent: Subagent-ContextRuleDoc] | [Skill: writing-guidelines] | [Locked Files: PROJECT_CONTEXT.md, .agent/GEMINI.md]
- [x] Task R3: Tích hợp, rà soát diff, kiểm tra cú pháp và commit GitHub theo auto_github_sync | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: task.md]

## SPRINT 04-11-2026 (BUOI 2): TURSO CLOUD PERSISTENT MEDIA STORAGE (PHƯƠNG ÁN LƯU ẢNH LÊN TURSO)
- [x] Task M1: Tạo bảng media_storage trong database.js và khai báo route GET /media/:id trong api.js | [Agent: Subagent-MediaDB] | [Skill: security-audit] | [Locked Files: server/db/database.js, server/routes/api.js]
- [x] Task M2: Tích hợp uploadImage/getMedia trong surveyController.js và uploadAvatar trong authController.js lưu/đọc BLOB trực tiếp từ Turso media_storage | [Agent: Subagent-MediaController] | [Skill: security-audit] | [Locked Files: server/controllers/surveyController.js, server/controllers/authController.js]
- [x] Task M3: Lead Orchestrator: Kiểm tra cú pháp, chạy toàn bộ 24 suite npm test, cập nhật PROJECT_CONTEXT.md và push GitHub | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: PROJECT_CONTEXT.md, task.md]

## SPRINT 04-11-2026: RUNTIME SECURITY HARDENING & FRONTEND POLISH (PHẦN 1, 2, 5)
- [x] Task SEC-1: Vá triệt để DNS Rebinding SSRF trong webhookService, thêm magic bytes validation cho upload ảnh trong surveyController/authController, và khóa cứng ENABLE_TEST_HOOKS fail-closed trên production | [Agent: Subagent-SecBackend] | [Skill: security-audit] | [Locked Files: server/services/webhookService.js, server/controllers/surveyController.js, server/controllers/authController.js, server/config/index.js]
- [x] Task FE-1: Chuẩn hóa formatVND và refreshIcons trong các module ví/voucher, tinh chỉnh CSS gradient/glow card và bump cache-buster trong index.html | [Agent: Subagent-FrontendPolish] | [Skill: design-taste-frontend] | [Locked Files: public/styles.css, public/js/modules/wallet-ledger.js, public/js/modules/voucherMarket.js, public/index.html]
- [x] Task QA-1: Tích hợp, syntax verification, npm test 24/24 suites, sync Android, cập nhật PROJECT_CONTEXT.md và push GitHub | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: PROJECT_CONTEXT.md, task.md]

## SPRINT 04-11-2026: TURSO EMBEDDED REPLICA & VOUCHER DEMO HARDENING
- [x] Task V1: Idempotent voucher demo seed, loại bỏ transaction monolithic trong initCatalogVouchers, hoàn thiện rollback an toàn và Atomic Conditional Update cho voucherService | [Agent: Subagent-Voucher] | [Skill: security-audit] | [Locked Files: server/services/voucherService.js]
- [x] Task D1: Triển khai adapter libSQL Embedded Replica trong database.js và cấu hình config/index.js (đồng bộ 2 chiều Turso qua syncUrl/authToken, bảo toàn ACID transaction đồng bộ) | [Agent: Subagent-Database] | [Skill: security-audit] | [Locked Files: server/db/database.js, server/config/index.js]
- [x] Task Q1: Tích hợp, syntax verification node -c, kiểm thử hồi quy npm test và cập nhật PROJECT_CONTEXT.md | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: PROJECT_CONTEXT.md, task.md]

## SPRINT 03-11-2026 (BUOI 3): KẾ HOẠCH HẠ TẦNG LƯU TRỮ BỀN VỮNG (PERSISTENT DATA & AVATAR STORAGE)

- [x] Task 1: Bổ sung chi tiết Kế hoạch Lưu trữ Dữ liệu Bền vững (Persistent Storage cho SQLite DB & Avatar/Uploads) vào KE_HOACH_TONG_THE.md và đối chiếu TUONG_LAI_HE_THONG.md | [Agent: Subagent-Planner] | [Skill: writing-guidelines] | [Locked Files: KE_HOACH_TONG_THE.md, TUONG_LAI_HE_THONG.md]

## SPRINT 04-11-2026: FLOATING ISLAND MOBILE BOTTOM NAVIGATION
- [x] Task F1: Tái cấu trúc CSS mobile bottom navigation (`public/styles.css`): chuyển sang Đảo Nổi (Floating Island Dock) bo cong hoàn toàn (`border-radius: 9999px`), frosted glass, bóng đổ nổi khối, nút CTA tròn cam nổi thay vì ô vuông, active indicator bo cong và hiệu ứng chuyển động mượt mà | [Agent: Subagent-FloatingNavStyles] | [Skill: design-taste-frontend, impeccable, hallmark] | [Locked Files: public/styles.css]
- [x] Task F2: Tinh chỉnh container và markup mobile bottom shell (`public/index.html`, `public/app.js`): bố cục đảo nổi căn giữa, nâng đệm safe-area và class active mượt mà | [Agent: Subagent-FloatingNavMarkup] | [Skill: design-taste-frontend, hallmark] | [Locked Files: public/index.html, public/app.js]
- [x] Task F3: Lead Orchestrator kiểm tra cú pháp, đồng bộ Capacitor Android (`npm run sync:android`), chạy test hồi quy và commit Git | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: PROJECT_CONTEXT.md, task.md]

## SPRINT 04-11-2026: FORM STUDIO REBRAND & HEADER LAYOUT POLISH
- [x] Task FS1: Cải tiến bố cục Top Action Header trong `public/js/modules/creatorStudio.js`, đổi tên 'Google Forms Studio' thành 'Form Studio', cắt giảm chữ giải thích thừa, bố trí cụm nút hành động tinh gọn không bị bẻ dòng gãy chữ trên mobile/tablet | [Agent: Subagent-FormStudioHeader] | [Skill: design-taste-frontend, impeccable, hallmark] | [Locked Files: public/js/modules/creatorStudio.js]
- [x] Task FS2: Lead Orchestrator: Bump cache-buster `public/index.html`, kiểm tra cú pháp, chạy sync Android, test hồi quy và commit | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: public/index.html, PROJECT_CONTEXT.md, task.md]

## SPRINT 04-11-2026: ANDROID APK DISTRIBUTION & IN-APP UPDATE SYSTEM
- [x] Task APK1: Xây dựng cấu hình APP_RELEASE trong server/config/index.js và 2 API GET /api/v1/app/version, GET /api/v1/app/download trong server/routes/api.js | [Agent: Subagent-BackendApk] | [Skill: security-audit] | [Locked Files: server/config/index.js, server/routes/api.js]
- [x] Task APK2: Bổ sung Smart App Banner Android, khối tải APK ở Footer trong public/index.html, logic phát hiện Android browser & In-App update check trong public/app.js, cùng mục quản lý App Android trong public/js/modules/respondent.js | [Agent: Subagent-FrontendApk] | [Skill: design-taste-frontend, minimalist-ui] | [Locked Files: public/index.html, public/app.js, public/js/modules/respondent.js]
- [x] Task APK3: Bổ sung bộ kiểm thử tự động tests/test_app_version.js, chạy syntax verification node -c, npm test 26 tầng, sync Capacitor Android và cập nhật PROJECT_CONTEXT.md | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: tests/test_app_version.js, PROJECT_CONTEXT.md, task.md]

## SPRINT 04-11-2026: UI REFINEMENT - ELEGANT FOOTER APK & FLOATING ALERT BUTTON
- [x] Task UI-REF1: Tinh chỉnh Footer (bỏ nút cam cột 3, thêm link APK tinh tế tại Bottom Bar ẩn mobile), gỡ banner mobile, cập nhật nút báo lỗi thành biểu tượng tam giác alert-triangle dạng chấm tròn trên mobile trong public/index.html và public/app.js | [Agent: Subagent-UIRefine] | [Skill: design-taste-frontend, impeccable, hallmark] | [Locked Files: public/index.html, public/app.js]
- [x] Task UI-REF2: Chuẩn hóa mục riêng Ứng dụng Di động & Cập nhật trong public/js/modules/respondent.js cho điện thoại và app APK | [Agent: Subagent-RespondentApp] | [Skill: design-taste-frontend] | [Locked Files: public/js/modules/respondent.js]
- [x] Task UI-REF3: Lead Orchestrator: Syntax verification, sync Capacitor Android, chạy test hồi quy và commit Git | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: PROJECT_CONTEXT.md, task.md]

## SPRINT 04-11-2026 (BUỔI 3): ƯU ĐÃI CHUỖI ĐIỂM DANH (BONUS KHẢO SÁT + HỘP QUÀ CỘT MỐC + VÉ CỨU CHUỖI)

Nguồn đặc tả: `docs/plans/KE_HOACH_UU_DAI_CHUOI_DIEM_DANH.md`. Phân tích kinh tế Lead: bonus tối đa 10% x reward luôn nhỏ hơn biên take rate thấp nhất 12.5% (giá sàn sinh viên) => an toàn; rò rỉ "check-in farmer" ~79k/200 ngày bị chặn bằng gate hoạt động khảo sát.

### CONTRACT ĐÃ CHỐT (các Subagent lập trình theo đúng contract, cấm tự ý đổi)
- Config `ECONOMICS.STREAK` (server/config/index.js): `BONUS_TIERS` [{minDay:201,percent:10,tierLevel:5,tierName:'Thần Thoại Hoàng Kim'},{minDay:101,percent:8,tierLevel:4,tierName:'Băng Hỏa Điện Quang'},{minDay:51,percent:5,tierLevel:3,tierName:'Hồng Neon Tím TikTok'},{minDay:11,percent:3,tierLevel:2,tierName:'Lửa Bùng Cháy'},{minDay:1,percent:0,tierLevel:1,tierName:'Lửa Khởi Động'}], `MAX_FREEZE_TICKETS: 2`, `MILESTONES` {10:{points:1000,freezeTickets:0,badge:'Tân Binh Bền Bỉ'},50:{points:3000,freezeTickets:1},100:{points:10000,freezeTickets:1,avatarFrame:'NEON'},200:{points:25000,freezeTickets:1,badge:'Thần Thoại SurvHub',fastTrackPayout:true}}, `MILESTONE_ACTIVITY_GATE_DAYS: 7`.
- Migration idempotent: `daily_streaks` +3 cột (`streak_freezes_count INTEGER NOT NULL DEFAULT 0`, `claimed_milestones_json TEXT NOT NULL DEFAULT '[]'`, `last_freeze_used_at TEXT`) vào cả CREATE TABLE lẫn migrations ALTER; `point_transactions` mở CHECK thêm `STREAK_MILESTONE_REWARD`, `STREAK_SURVEY_BONUS` bằng rebuild có guard (đọc sqlite_master, chỉ rebuild khi chưa chứa type mới; CREATE mới -> INSERT SELECT -> DROP -> RENAME trong transaction).
- `GET /users/streak-info` giữ nguyên trường cũ, bổ sung: `streak_freezes_count`, `multiplier_percent`, `tier_level`, `tier_name`, `claimed_milestones`, `eligible_unclaimed_milestone` (mốc đạt chưa nhận CAO NHẤT), `milestone_gate_passed` (>=1 response VALIDATED trong 7 ngày), `pending_freeze_consumption` (preview 0/1/2, KHÔNG ghi DB).
- `POST /users/streak-claim-milestone` body `{milestone_day}`: 200 => `{success,message,milestone_day,points_awarded,freeze_tickets_awarded,badge,new_point_balance,streak:{current_streak,streak_freezes_count,claimed_milestones}}`; 400 mốc sai/chưa đủ/đã nhận; 403 gate chưa đạt hoặc role ENTERPRISE. ACID + ledger idempotent qua `claimed_milestones_json`.
- `POST /users/checkin` bổ sung trong `streak`: `freeze_used` 0/1/2, `freeze_remaining`; freeze dùng khi gap=2 trừ 1 vé, gap=3 trừ 2 vé, gap>3 hoặc thiếu vé => reset Ngày 1; trừ vé UPDATE điều kiện nguyên tử; có thông báo `notifications` khi dùng vé.
- Submit khảo sát VALIDATED bổ sung response: `base_points_earned`, `streak_bonus_points` (floor(reward x percent/100), 0 nếu tier 1), `streak_tier_name` (null nếu không bonus); `pointsEarned` giữ = tổng (tương thích ngược). Escrow vẫn giảm đúng `cost_per_response` (bonus ăn vào biên sàn); cộng điểm + 2 dòng ledger (`SURVEY_REWARD` + `STREAK_SURVEY_BONUS`) cùng transaction trong `rewardSurveyCompletion(surveyId, respondentId, responseId, pointsReward, costPerResponseVnd, streakBonusPoints = 0, streakTierName = null)`.

### PHÂN CÔNG
- [x] Task SB1: Migration 3 cột daily_streaks + rebuild CHECK point_transactions + config ECONOMICS.STREAK | [Agent: Subagent-BE] | [Skill: none] | [Locked Files: server/db/database.js, server/config/index.js]
- [x] Task SB2: Ledger `rewardStreakMilestone` + tham số bonus trong `rewardSurveyCompletion` (2 dòng tx cùng ACID) | [Agent: Subagent-BE] | [Skill: none] | [Locked Files: server/services/ledgerService.js]
- [x] Task SB3: Freeze Engine checkin + streak-info mở rộng + endpoint claim-milestone + route | [Agent: Subagent-BE] | [Skill: none] | [Locked Files: server/controllers/userController.js, server/routes/api.js]
- [x] Task SB4: Tích hợp bonus vào submitSurvey (surveyController) | [Agent: Subagent-BE] | [Skill: none] | [Locked Files: server/controllers/surveyController.js]
- [x] Task SB5: Suite tầng 27 tests/test_streak_benefits.js + đăng ký run_all_tests | [Agent: Subagent-BE] | [Skill: none] | [Locked Files: tests/test_streak_benefits.js, tests/run_all_tests.js]
- [x] Task SF1: Modal streak (badge Vé Cứu Chuỗi, dòng đặc quyền multiplier, khối Hộp Quà 4 mốc + nút Mở Quà Ngay gọi claim API, xử lý gate 403) + màn hoàn thành khảo sát tách 2 dòng thưởng (base + streak bonus) | [Agent: Subagent-FE] | [Skill: minimalist-ui] | [Locked Files: public/js/modules/modalsTerms.js, public/js/modules/respondent.js]
- [x] Task SI1: Bump cache-buster 2 module trong index.html, npm test 27/27, sync:android, cập nhật PROJECT_CONTEXT + tài liệu kế hoạch, commit + push | [Agent: Lead Orchestrator] | [Skill: none] | [Locked Files: public/index.html, PROJECT_CONTEXT.md, docs/plans/KE_HOACH_UU_DAI_CHUOI_DIEM_DANH.md]

### KẾT QUẢ NGHIỆM THU (04-11-2026)
- Backend: SB1-SB5 hoàn tất — migration rebuild point_transactions idempotent, ECONOMICS.STREAK, ledger 2 dòng tx ACID, Freeze Engine lazy (gap 2/3), claim-milestone gate chống farm, bonus submitSurvey. node -c PASS toàn bộ.
- Frontend: SF1 hoàn tất — badge Vé Cứu Chuỗi, dòng đặc quyền %, khối Hộp Quà 4 mốc + claimStreakMilestone, cảnh báo pending freeze, quy chế mới; respondent.js tách 2 dòng thưởng (base + streak bonus + tổng). cache-buster 4.9.21_streak_benefits.
- Kiểm thử: suite tầng 27 tests/test_streak_benefits.js 22 bài PASS; npm test 27/27 Suites 100% PASS (36.4s); npm run sync:android thành công.
- Tham vấn Argon: 4 lần gọi đều thất bại do bridge (400 no Gemini models -> DNS no such host -> bridge chết -> refusal sai route); cầu chì 3 lần chạm ngưỡng => triển khai theo phân tích kinh tế tự kiểm chứng của Lead (biên take rate thấp nhất 12.5% > bonus tối đa 10% x reward; gate VALIDATED 7 ngày chặn farmer 79k/200 ngày; lazy freeze loại race condition, không cần cron).

## SPRINT 05-11-2026: SỬA LỖI ĐỒNG BỘ SURVEY DRAFT, THÙ LAO VÀ VÍ FINTECH
### CONTRACT & PHÂN QUYỀN WORKER ĐỘC LẬP
- [x] Task FIX-1: Sửa mất trắng hàng/cột câu hỏi lưới khi lưu nháp và sửa kẹt trạng thái DRAFT khi xuất bản form từ bản nháp | [Agent: Subagent-Studio] | [Skill: none] | [Locked Files: public/js/modules/creatorStudio.js]
- [x] Task FIX-2: Đồng bộ thù lao khảo sát theo tier kinh tế học backend và mở quyền xem khảo sát công khai toàn sàn cho CREATOR | [Agent: Subagent-SurveyBackend] | [Skill: none] | [Locked Files: server/controllers/surveyController.js]
- [x] Task FIX-3: Sửa lỗi modal nạp tiền thành công hiện 0 VNĐ / +0 Credit, đồng bộ mức thưởng nạp 50K (+2% = 51.000 Credit) và thêm cảnh báo demo trong modal VietQR | [Agent: Subagent-WalletLedger] | [Skill: none] | [Locked Files: public/js/modules/wallet-ledger.js]
- [x] Task FIX-4: Lead Orchestrator: Bump cache-buster index.html, kiểm tra cú pháp, chạy npm test 27 suite, sync Android và cập nhật PROJECT_CONTEXT.md | [Agent: Lead Orchestrator] | [Skill: none] | [Locked Files: public/index.html, PROJECT_CONTEXT.md, task.md]
