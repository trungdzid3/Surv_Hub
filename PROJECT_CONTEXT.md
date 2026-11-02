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

## 3. Hiện Trạng Các Phân Hệ (bản liệt kê gọn)
- **Creator Studio**: tạo khảo sát 12 dạng câu hỏi + Smart Text Paste Parser + rẽ nhánh/stepper logic; bộ lọc đối tượng 34 tỉnh mới + trường ĐH; ký quỹ Escrow + bonus nạp theo bậc; Google Sheets Webhook đồng bộ; toggle "Thu thập email người trả lời" (v4.9.5).
- **Respondent**: làm bài + ví Point + lịch sử giao dịch; quy đổi thẻ cào/VietQR/MoMo/E-Voucher; hồ sơ 5 tab + xác thực sinh viên `.edu.vn` OTP; điểm danh chuỗi ngày; diễn đàn rich text + 10 ảnh (qua Sentinel Gemini kiểm duyệt ngầm).
- **Admin Console**: overview + tra cứu user + duyệt rút tiền + `/cleantest` thanh lọc dữ liệu test 8 hạng mục + audit log.
- **Ledger & Wallet**: sổ cái kép ACID 7 loại giao dịch; escrow hoàn tiền an toàn (trần số dư ký quỹ); nạp VietQR Napas247 + webhook đối soát ngân hàng timing-safe.
- **QA tự hành**: bộ test 17 tầng qua `npm test` (100% PASS là điều kiện bàn giao).

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
