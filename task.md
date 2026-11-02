# TASK: ĐẠI TU MODULAR HÓA app.js THEO MIỀN NGHIỆP VỤ (8 WAVE) - TIẾN ĐỘ ĐÊM 03-11-2026

Kiến trúc đích: app.js còn ~4k dòng (core init, router, home, nav) + data/catalogs.js + utils.js + 7 module miền nghiệp vụ (creator-studio, respondent, wallet-ledger, admin-console, forum, modals-terms, notifications). Mỗi wave: node -c + npm test + sync:android + commit.

- [x] Wave 0: Dọn dẹp + bảo mật hygiene: untrack PII docx (KHẨN - repo GitHub public), .gitignore chặn PII, vệ sinh mật khẩu clean_database.js, xóa 10 script one-off + .archify + .pdf-build + backup cũ + PDF superseded | [Orchestrator + senior-coder]
- [x] Wave 0b: Test registry: xóa test chết/one-off/live-service, đăng ký 5 suite PASS (tầng 18-22), cơ chế tự dọn tests/reports/ khi PASS | [Orchestrator]
- [x] Wave 1: catalogs.js (7 hằng danh mục, Object.freeze) + utils.js (escapeHtml/formatVND/refreshIcons) + hợp nhất 3 cặp hàm trùng + voucherMarket.js + pushNotifications.js (fix rò rỉ visibilitychange) + docs/CODE_MAP.md + cache-buster 4.9.6. app.js 20.612 -> 19.685 dòng. npm test 22/22 PASS (18.96s) | [senior-coder + Orchestrator QA]
- [ ] Wave 2: tách modules/wallet-ledger.js (~1.3k: ví, swap, nạp VietQR) | [senior-coder] | [Locked: public/app.js, public/js/modules/wallet-ledger.js, public/index.html, docs/CODE_MAP.md]
- [ ] Wave 3: tách modules/admin-console.js (~2k: overview, payouts, fraud, console) | [senior-coder]
- [ ] Wave 4: tách modules/forum.js (~1.8k: diễn đàn + WYSIWYG + đính kèm + admin sub-nav) | [senior-coder]
- [ ] Wave 5: tách modules/modals-terms.js (~1.7k: auth modal, google auth, điều khoản, toast/modal utils) | [senior-coder]
- [ ] Wave 6: tách modules/creator-studio.js (~4.8k: studio, image picker, forms auth, escrow, builder, smart paste) | [senior-coder]
- [ ] Wave 7: tách modules/respondent.js (~3.9k: runner + review + hồ sơ 5 tab) | [senior-coder]
- [ ] Wave 8: QA tổng + CODE_MAP chốt + PROJECT_CONTEXT cập nhật + báo cáo nghiệm thu | [Orchestrator]

## Sprint 03-11-2026 (Buổi 2): Fix layout filter bar + modal điều khoản read-only (phiên khác đã hoàn thành)

## SPRINT 03-11-2026 (BUOI 2): FIX LAYOUT FILTER BAR + MODAL DIEU KHOAN READ-ONLY

- [x] Task A: Sua loi thieu the </div> vung HANG 2 filter bar khao sat (public/app.js ~dong 5014-5114): them 1 the </div> truoc comment "Cum ben phai" (~dong 5089) de cum phai (Toggle "Hien bai da lam" + vach phan cach + Grid/List switcher) thanh sibling truc tiep, kich hoat justify-between -> don cum phai can bien phai doi xung voi cum trai | [Agent: layout-fixer (senior-coder)] | [Locked Files: public/app.js]
- [x] Task B: Modal Dieu khoan mo tu footer van hien nut dong y dang ky -> them che do read-only (an dong "Bang viec bam xac nhan..." + nut [Dong]/[Toi Dong Y Dieu Khoan], chi giu nut X); giu nguyen luong dang ky (link trong checkbox dong 2640 van che do consent) | [Agent: terms-modal-fixer (senior-coder)] | [Locked Files: public/index.html (sua ngay), public/app.js (CHI sua sau khi Task A xong - duoc Lead mo khoa)]
- [x] Task C: Tich hop nghiem thu: node -c, npm run sync:android, cap nhat PROJECT_CONTEXT.md, commit + push | [Agent: Lead Orchestrator] | [Locked Files: android/, PROJECT_CONTEXT.md]
