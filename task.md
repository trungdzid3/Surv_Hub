# TASK: TỐI ƯU HÓA TOKEN & MODULAR HÓA - DỌN DẸP DỮ LIỆU THỪA - KIỂM TOÁN BẢO MẬT & REVIEW FRONTEND

Ngày tạo: 03-11-2026. Orchestrator điều phối theo mô hình Subagent-Driven (AGENTS.md Mục 5).

## BẢNG MA TRẬN PHÂN QUYỀN VÀ KHÓA FILE (AGENT FILE LOCK & SKILL MATRIX)

- [ ] Task 1: Nạp ngữ cảnh + khảo sát nhanh cấu trúc, xác định file khổng lồ (app.js 20.571 dòng, PROJECT_CONTEXT.md 2.961 dòng), phát hiện PII bị git track | [Agent: Lead Orchestrator] | [Locked Files: task.md]
- [ ] Task 2: Chiến lược modular hóa + tối ưu token từ Gemini 4 Argon (KHÔNG code, chỉ vạch hướng) | [Agent: ask-argon (Gemini 4 Argon)] | [Skills: ask-argon] | [Locked Files: (read-only)]
- [ ] Task 3: Trinh sát sâu: bản đồ line-range app.js, cơ chế load script, mirror android assets, đăng ký test trong run_all_tests.js, rác trong scripts/, cấu trúc PROJECT_CONTEXT.md | [Agent: code-researcher] | [Locked Files: (read-only)]
- [ ] Task 4: Kiểm toán bảo mật tập trung (security-audit guidance mode): auth/JWT/admin/upload/SQL/PII in git | [Agent: security-auditor] | [Skills: security-audit] | [Locked Files: (read-only)]
- [ ] Task 5: Review frontend READ-ONLY theo DESIGN.md + hallmark + taste-skill + impeccable (KHÔNG sửa code, chỉ báo cáo) | [Agent: frontend-reviewer] | [Skills: hallmark, design-taste-frontend, impeccable] | [Locked Files: (read-only)]
- [ ] Task 6: Dọn dẹp tệp thừa/cũ: untrack PII docx, xóa backups cũ, .archify cũ, script one-off, test mồ côi; bổ sung cơ chế tự dọn khi test xong | [Agent: Lead Orchestrator + senior-coder] | [Locked Files: .gitignore, tests/*, scripts/*]
- [ ] Task 7: Modular hóa app.js + sinh CODE_MAP (truy tìm nhanh vị trí sửa) theo chiến lược Argon | [Agent: senior-coder] | [Locked Files: public/app.js, public/js/modules/, public/index.html, android mirror]
- [ ] Task 8: Nén gọn PROJECT_CONTEXT.md (SSOT tinh gọn), lưu trữ phần lịch sử | [Agent: Lead Orchestrator] | [Locked Files: PROJECT_CONTEXT.md, docs/]
- [ ] Task 9: Kiểm thử: node -c toàn bộ JS đã sửa, npm test hồi quy, đồng bộ android assets | [Agent: autonomous-qa] | [Locked Files: tests/]
- [ ] Task 10: Cập nhật PROJECT_CONTEXT.md, commit + push (auto_github_sync), tổng hợp báo cáo nghiệm thu 3 luồng | [Agent: Lead Orchestrator] | [Locked Files: PROJECT_CONTEXT.md]

## SPRINT 03-11-2026 (BUOI 2): FIX LAYOUT FILTER BAR + MODAL DIEU KHOAN READ-ONLY

- [x] Task A: Sua loi thieu the </div> vung HANG 2 filter bar khao sat (public/app.js ~dong 5014-5114): them 1 the </div> truoc comment "Cum ben phai" (~dong 5089) de cum phai (Toggle "Hien bai da lam" + vach phan cach + Grid/List switcher) thanh sibling truc tiep, kich hoat justify-between -> don cum phai can bien phai doi xung voi cum trai | [Agent: layout-fixer (senior-coder)] | [Locked Files: public/app.js]
- [x] Task B: Modal Dieu khoan mo tu footer van hien nut dong y dang ky -> them che do read-only (an dong "Bang viec bam xac nhan..." + nut [Dong]/[Toi Dong Y Dieu Khoan], chi giu nut X); giu nguyen luong dang ky (link trong checkbox dong 2640 van che do consent) | [Agent: terms-modal-fixer (senior-coder)] | [Locked Files: public/index.html (sua ngay), public/app.js (CHI sua sau khi Task A xong - duoc Lead mo khoa)]
- [x] Task C: Tich hop nghiem thu: node -c, npm run sync:android, cap nhat PROJECT_CONTEXT.md, commit + push | [Agent: Lead Orchestrator] | [Locked Files: android/, PROJECT_CONTEXT.md]
