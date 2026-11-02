# TASK: TÁI THIẾT KẾ HỒ SƠ TÀI KHOẢN, TẢI LÊN AVATAR, GỠ BỎ TOÀN BỘ DỮ LIỆU DEMO & SỬA LỖI PHÂN QUYỀN

## BẢNG PHÂN BỔ ĐỘI HÌNH TÁC TỬ CHUYÊN BIỆT (MULTI-AGENT ROSTER)

### 1. `backend_auth_specialist` (Backend & Role/Auth Specialist)
- **File sở hữu**: `server/controllers/adminController.js`, `server/controllers/authController.js`, `server/routes/api.js`
- **Nhiệm vụ**:
  - [x] Hoàn thiện endpoint `POST /api/v1/auth/avatar` lưu trữ file ảnh đại diện và cập nhật `avatar_url` vào bảng `users`.
  - [x] Khắc phục triệt để logic `switchAdminTier`: khi chuyển sang `PERSONAL` (Người thường) thì bắt buộc đặt `is_student_verified = 0`, khi chuyển `STUDENT` thì `is_student_verified = 1`, khi chuyển `ENTERPRISE` thì `is_student_verified = 0`.
  - [x] Đồng bộ trả về trường `avatar_url` trong `getMe` và `updateProfile`.
  - [x] Đặt lại tài khoản admin `trungdzid3@gmail.com` về trạng thái chuẩn khi xem ở góc nhìn Người điền thường.
  - [x] Chạy kiểm tra cú pháp `node -c` toàn bộ file backend phụ trách.

### 2. `ui_profile_specialist` (UI/UX & Profile Frontend Specialist)
- **File sở hữu**: `public/app.js`, `public/index.html`
- **Nhiệm vụ**:
  - [x] Đơn giản hóa toàn diện giao diện `renderProfileView` thành 3 Tab tinh gọn:
    * Tab 1: `demographics` (Thông tin cá nhân & Nhân khẩu học thực tế + Tùy chọn xác thực Sinh viên đối với người điền / Hồ sơ Doanh nghiệp đối với Doanh nghiệp).
    * Tab 2: `surveys` (Khảo sát của tôi: Gồm Form đã tạo & Form đã tham gia, 100% dữ liệu thực từ API backend, hỗ trợ nút Xóa khảo sát thật).
    * Tab 3: `forum-posts` (Bài viết diễn đàn của tôi: 100% dữ liệu thực, hỗ trợ nút Xóa bài viết thật).
  - [x] Xóa bỏ triệt để Tab "Đánh giá & Mức độ uy tín" cùng toàn bộ các nhận xét giả (GS. Đặng Minh Tuấn, TS. Vũ Thị Hoàng Yến, HV. Nguyễn Thu Thảo) và các chỉ số ảo (99.8%, 186 chủ nhiệm đề tài).
  - [x] Xóa bỏ triệt để các form demo tĩnh (2 form demo), khảo sát đã tham gia giả (5 dòng demo + số 52) và 3 bài viết demo diễn đàn.
  - [x] Triển khai tính năng Tải Lên Ảnh Đại Diện (Avatar Upload): Nút camera tại avatar, chọn ảnh từ thiết bị, đọc base64, gọi `POST /api/v1/auth/avatar`, cập nhật ngay lập tức avatar trên Profile, Header và User Dropdown mà không reload trang.
  - [x] Chuẩn hóa phân quyền nút/huy hiệu trên Header:
    * Người điền phổ thông: Huy hiệu "Người Điền Phổ Thông", nút "Xác Thực Sinh Viên (.edu.vn)". Tuyệt đối KHÔNG hiển thị nút "Hồ Sơ Doanh Nghiệp".
    * Sinh viên: Huy hiệu "Gói Sinh Viên (.edu.vn) Đã Xác Thực". Tuyệt đối KHÔNG hiển thị nút "Hồ Sơ Doanh Nghiệp".
    * Doanh nghiệp: Huy hiệu "Gói Doanh Nghiệp", nút "Hồ Sơ Doanh Nghiệp & MST". Tuyệt đối KHÔNG hiển thị nút Gói Sinh Viên.
  - [x] Cài đặt hàm `deleteSurveyAction(id)` và `deleteForumPostAction(id)` có popup xác nhận và gọi API thật.
  - [x] Nâng cache-buster trong `public/index.html` và kiểm tra cú pháp `node -c public/app.js`.

### 3. `qa_verification_specialist` (Autonomous QA & Integration Specialist)
- **Nhiệm vụ**:
  - [x] Chạy bộ kiểm thử tự hành toàn diện `npm test` bảo đảm 16/16 tầng PASS 100%.
  - [x] Chạy đồng bộ tài nguyên sang Android Capacitor (`npm run sync:android`).
  - [x] Cập nhật nhật ký tiến trình vào `PROJECT_CONTEXT.md`.
  - [x] Thực hiện Git Auto-Sync: Commit chuẩn mực và push mã nguồn lên GitHub repository.
