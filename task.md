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
- [ ] Task F1: Tái cấu trúc CSS mobile bottom navigation (`public/styles.css`): chuyển sang Đảo Nổi (Floating Island Dock) bo cong hoàn toàn (`border-radius: 9999px`), frosted glass, bóng đổ nổi khối, nút CTA tròn cam nổi thay vì ô vuông, active indicator bo cong và hiệu ứng chuyển động mượt mà | [Agent: Subagent-FloatingNavStyles] | [Skill: design-taste-frontend, impeccable, hallmark] | [Locked Files: public/styles.css]
- [ ] Task F2: Tinh chỉnh container và markup mobile bottom shell (`public/index.html`, `public/app.js`): bố cục đảo nổi căn giữa, nâng đệm safe-area và class active mượt mà | [Agent: Subagent-FloatingNavMarkup] | [Skill: design-taste-frontend, hallmark] | [Locked Files: public/index.html, public/app.js]
- [ ] Task F3: Lead Orchestrator kiểm tra cú pháp, đồng bộ Capacitor Android (`npm run sync:android`), chạy test hồi quy và commit Git | [Agent: Lead Orchestrator] | [Skill: security-audit] | [Locked Files: PROJECT_CONTEXT.md, task.md]
