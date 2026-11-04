# GEMINI CONTEXT - SURVHUB PLATFORM (WEB & ANDROID NATIVE)

> **Thông Báo Phân Định Thứ Bậc Rules**:
> Tệp Quy tắc Toàn cục cao nhất (Global Rules SSOT) được lưu tại `C:\Users\Lenovo\.gemini\GEMINI.md` áp dụng bắt buộc cho mọi phiên làm việc của AI Agent.
> Tệp `.agent/GEMINI.md` này đóng vai trò ngữ cảnh nghiệp vụ chuyên biệt của riêng dự án SurvHub (Web SPA & Android Native Capacitor).

## Tổng quan dự án
Nền tảng khảo sát trực tuyến kiếm lợi nhuận hai chiều **SurvHub** (Web Responsive & Android Capacitor Native):
1. **Dành cho Người trả lời (Respondent)**: Làm khảo sát nhận điểm thưởng (`1 Point = 1 VNĐ`), quy đổi thẻ cào điện thoại, ngân hàng VietQR/MoMo hoặc E-Voucher thương hiệu ngang giá.
2. **Dành cho Người tạo khảo sát (Creator / Doanh nghiệp)**: Nạp `Credit` (`1 Credit = 1 VNĐ`, khóa van 1 chiều không rút ra tiền mặt), khóa quỹ ký quỹ (`Escrow`) theo 3 phân khúc rõ ràng (Sinh viên / Cá nhân / Doanh nghiệp) x 3 mức độ dài form (Ngắn / Vừa / Dài), thiết kế bài khảo sát với 12 loại câu hỏi, lọc đối tượng và đồng bộ Google Sheets webhook.
3. **Mô hình Kinh tế học & Lợi nhuận (Unit Economics)**:
   - Sàn thu phí dịch vụ (`Take Rate`): Sinh viên cố định 10%-12%, Cá nhân 25%, Doanh nghiệp 33%-36%.
   - Thù lao đáp viên được tính động từ số Credit thực thu sau khi trừ lượt miễn phí: `Reward = floor(TotalEscrow * (1 - TakeRate) / N)`.
   - Đổi `Point -> Credit` thưởng +5% kích thích điền chéo; Screen-out = 0đ (không mất tiền mặt).
4. **Hệ thống Chống Gian lận (Anti-Fraud Engine)**: 5 chốt chặn: Bẫy tốc độ (0s cho câu tự luận), Bẫy tập trung động (chèn ngẫu nhiên + thêm 1 cơ hội), Phương sai đường thẳng (Likert, Single Choice, Dropdown), Bộ lọc tự luận rác (chấp nhận số 0 và từ ngắn), Điểm uy tín `trust_score` (khởi tạo 85, khấu trừ lũy tiến, Auto-Ban theo `device_fingerprint`).
5. **Kiến trúc Kỹ thuật**:
   - Backend: Node.js 24, Express, SQLite WAL mode với Transaction ACID & Double-Entry Ledger.
   - Frontend: Vanilla JS SPA, Tailwind CSS, Typography Montserrat 4 phân cấp, bảng màu 3 màu Cam/Trắng/Đen theo `DESIGN.md`.
   - Di động: Capacitor Android Native (Assets đồng bộ sẵn sàng build APK).
   - Hạ tầng: Oracle Cloud Always Free (2 OCPU / 6GB ARM64) + Cloudflare Tunnel + Tên miền miễn phí DigitalPlat.

## Quy Chuẩn Sao Lưu Dự Phòng Khi Đại Tu (Major Overhaul Backup Protocol)
- **Bắt buộc sao lưu khi Đại tu**: Các đợt thay đổi lớn về giao diện/layout, màu sắc/design system, tái cấu trúc logic chính (pricing, ledger, anti-fraud, auth, routing), nâng cấp CSDL hoặc schema/API contracts trọng yếu. Bắt buộc tạo bản sao lưu file/module/DB vào `backups/` hoặc file có timestamp trước khi sửa.
- **Không áp dụng khi Sửa nhỏ lẻ**: Hotfix dưới 30 dòng hoặc tinh chỉnh nhẹ không tạo backup để tránh rác workspace.
- **Kỷ luật Dọn dẹp & Rollback**: Chủ động kiểm tra và xóa/dọn dẹp các bản backup cũ trùng lặp; luôn đảm bảo phương án Rollback nguyên trạng ngay lập tức nếu gặp sự cố.

## Bảng Phân Bổ Đội Hình Tác Tử (Antigravity Specialist Roster)
- `pricing-economist`: Phụ trách `server/config/index.js`, `server/services/pricingService.js`.
- `fintech-ledger-engineer`: Phụ trách `server/services/ledgerService.js`, `server/controllers/walletController.js`.
- `auth-profile-specialist`: Phụ trách `server/controllers/authController.js`, `server/services/matchingService.js`.
- `form-parser-specialist`: Phụ trách `server/services/formParserService.js`.
- `anti-fraud-specialist`: Phụ trách `server/services/antiFraudService.js`.

## Multi-Agent CLI qua OpenCode & Nguyên Tắc CLI First
- **Nguyên tắc CLI First**: Ưu tiên hàng đầu việc sử dụng OpenCode CLI làm AI worker subprocess độc lập bất cứ khi nào CLI đảm bảo xử lý ổn định trong mức chấp nhận được, dù tốc độ phản hồi có thể chậm hơn một chút.
- **Chỉ định Model cho phép**: Tuyệt đối không tùy tiện dùng model ngoài danh mục. CHỈ ĐƯỢC PHÉP sử dụng 2 họ model sau khi chạy OpenCode CLI:
  1. Họ model **DeepSeek** (ví dụ: `opencode/deepseek-v4.1-flash-free`).
  2. Họ model **GLM 5.3 Flash** (`opencode/glm-5.3-flash-free`).
- **CLI OpenCode portable**: `D:\AI-CLIs\OpenCode\opencode.exe`.
- **CLI Antigravity portable**: `D:\AI-CLIs\Antigravity\agy.exe`.
- **Mục đích**: Dùng OpenCode như một worker AI subprocess độc lập để xử lý task được Lead Orchestrator phân công; không tự ý giao việc trùng file cho nhiều worker.
- **Lệnh tự động chuẩn trên Windows PowerShell**:
  ```powershell
  & 'D:\AI-CLIs\OpenCode\opencode.exe' run --model "opencode/deepseek-v4.1-flash-free" "Nội dung task cụ thể"
  ```
- **Quy tắc prompt**: Prompt phải nêu rõ mục tiêu, repository, file được khóa, giới hạn không sửa file ngoài phạm vi, yêu cầu kiểm tra và định dạng báo cáo ngắn.
- **Giao tiếp qua subprocess**: Có thể gọi executable bằng `System.Diagnostics.Process` hoặc Python `subprocess.Popen`, truyền prompt qua `stdin`, đọc `stdout` và `stderr`; phải đặt timeout và xử lý exit code khác `0`.
- **Mở rộng thư mục CLI**: Các CLI AI khác đặt trong thư mục con riêng dưới `D:\AI-CLIs\` (ví dụ `D:\AI-CLIs\Gemini\`, `D:\AI-CLIs\Claude\`). Mỗi CLI phải được kiểm tra bằng lệnh `--help` hoặc lệnh tương đương trước khi đưa vào workflow.
- **Lệnh Antigravity**:
  ```powershell
  & 'D:\AI-CLIs\Antigravity\agy.exe' --version
  ```
- **An toàn**: Không truyền secret, token, cookie, dữ liệu cá nhân hoặc nội dung nhạy cảm vào prompt subprocess. Không tự động cài package hay sửa biến môi trường hệ thống nếu chưa được người dùng cho phép.

## Vai trò Lead Orchestrator và nguyên tắc chọn worker
- Lead Orchestrator chỉ đóng vai trò bộ não và điều phối: tự quyết định dùng subagent nội bộ, OpenCode CLI ưu tiên, hoặc subagent bên trong CLI dựa trên loại vấn đề, ưu nhược điểm giữa Desktop và CLI, cùng yêu cầu về thời lượng và môi trường thực thi.
- **Ưu tiên OpenCode CLI (CLI First)**: Lựa chọn ưu tiên hàng đầu cho coding chuyên sâu, refactor, kiểm thử dài hạn, tác vụ cần subprocess hoặc tiến trình độc lập, miễn là CLI đảm bảo chạy ổn định trong mức chấp nhận được (dù độ trễ có thể cao hơn đôi chút). Bắt buộc chỉ dùng 2 họ model: DeepSeek hoặc GLM 5.3 Flash.
- **Ưu tiên subagent nội bộ**: Cho phân tích cô lập, review, truy vết logic, hoặc các nhiệm vụ cần trả về một kết luận tập trung mà không cần tương tác môi trường bên ngoài.
- **Ưu tiên Antigravity/Desktop**: Cho tương tác UI/browser, kiểm thử trực quan, thao tác cần session, hoặc các tác vụ phụ thuộc ngữ cảnh giao diện đang mở.
- Lead chịu trách nhiệm phân rã task, chốt contract, khóa file theo phạm vi, giao việc không trùng lặp, tổng hợp kết quả, kiểm tra syntax/QA và quyết định tích hợp cuối cùng. Không giao hai worker cùng một phạm vi hoặc cùng sửa một file đồng thời.
