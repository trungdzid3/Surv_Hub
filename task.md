# TASK: ĐẠI TU MODULAR HÓA app.js THEO MIỀN NGHIỆP VỤ (8 WAVE) - TIẾN ĐỘ ĐÊM 03-11-2026

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

## SPRINT 03-11-2026 (BUOI 3): KẾ HOẠCH HẠ TẦNG LƯU TRỮ BỀN VỮNG (PERSISTENT DATA & AVATAR STORAGE)

- [x] Task 1: Bổ sung chi tiết Kế hoạch Lưu trữ Dữ liệu Bền vững (Persistent Storage cho SQLite DB & Avatar/Uploads) vào KE_HOACH_TONG_THE.md và đối chiếu TUONG_LAI_HE_THONG.md | [Agent: Subagent-Planner] | [Skill: writing-guidelines] | [Locked Files: KE_HOACH_TONG_THE.md, TUONG_LAI_HE_THONG.md]

