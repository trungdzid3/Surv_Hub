# Báo cáo Rà soát Pháp lý Việt Nam — SurvHub / VibeSurvey

**Ngày audit:** 03/11/2026
**Phạm vi:** Toàn bộ source code tại `C:\Users\Lenovo\Downloads\Linh` (web SPA `public/`, backend `server/`, app Android `android/`)
**Trạng thái dự án:** Demo, chưa công khai, chưa có pháp nhân (theo ngữ cảnh chủ dự án)

**Kết quả quét (triage):** Mức 2-3 — nền tảng có tài khoản người dùng + nạp Credit/thưởng Point quy đổi tiền thật (VietQR, thẻ cào, MoMo, E-Voucher) + tính năng diễn đàn + app Android + AI backend (Gemini) + dịch vụ bên thứ ba nước ngoài (Brevo, Google, Oracle Cloud, Cloudflare).

**Phạm vi rà soát:** Checklist 01 (dữ liệu cá nhân), 02 (TMĐT), 03 (an ninh mạng), 04 (bảo vệ NTD), 06 (giao dịch điện tử), 07 (minh bạch AI), 09 (mobile app). Văn bản 05 (quảng cáo) không áp dụng — không có SDK quảng cáo, không có hệ thống quảng cáo trả phí.

Quy ước mức độ (thay cho ký hiệu màu của skill theo quy tắc workspace cấm emoji):
- **[CAN-XU-LY-NGAY]** = cần xử lý trước khi go-live
- **[CAI-THIEN]** = nên cải thiện
- **[DAT]** = đạt yêu cầu
- **[KO-AP-DUNG]** = không áp dụng

---

## Tong quan

| Lĩnh vực | Cần xử lý ngay | Nên cải thiện | Đạt |
|---|---|---|---|
| 01. Bảo vệ dữ liệu cá nhân | 5 | 5 | 1 |
| 02. Thương mại điện tử | 2 | 2 | 1 |
| 03. An ninh mạng | 1 | 3 | 1 |
| 04. Bảo vệ người tiêu dùng | 2 | 1 | 2 |
| 06. Giao dịch điện tử | 0 | 1 | 2 |
| 07. Minh bạch AI | 0 | 2 | 1 |
| 09. Mobile app | 1 | 1 | 2 |

---

## 01. BAO VE DU LIEU CA NHAN

Áp dụng: Luật BVDLCN 91/2025/QH15 (hiệu lực 01/01/2026), NĐ 356/2025/NĐ-CP (thay thế NĐ 13/2023), NĐ 330/2026/NĐ-CP (xử phạt, hiệu lực 19/08/2026).

### Cần xử lý ngay

1. **Không có trang Chính sách bảo mật riêng** — 3 link footer "Chính sách bảo mật dữ liệu", "Quy chế hoạt động", "Điều khoản dịch vụ" (`public/index.html:264-266`) đều trỏ về **cùng một modal điều khoản** (`openTermsModal`, `public/app.js:3177-3321`), trong đó phần dữ liệu cá nhân chỉ có 1 đoạn văn ngắn (`app.js:3280`). Thiếu hoàn toàn: danh mục loại dữ liệu thu thập (thực tế DB thu: email, họ tên, ngày sinh, giới tính, tỉnh, trường, ngành, **thu nhập hàng tháng**, SĐT/MST/doanh nghiệp — `server/db/database.js:444-469`), mục đích từng loại, thời gian lưu trữ, danh mục bên thứ ba, quyền của chủ thể dữ liệu, kênh + thời hạn thực hiện quyền. Căn cứ: Điều 4 Luật 91/2025; Điều 5 NĐ 356/2025 (thời hạn phản hồi 2 ngày / cung cấp-xóa 10-20 ngày).

2. **Dẫn chiếu văn bản đã hết hiệu lực** — Mục 5 điều khoản ghi "Bảo Vệ Dữ Liệu Cá Nhân (Nghị Định 13/2023/NĐ-CP)" (`public/app.js:3277`). NĐ 13/2023 đã hết hiệu lực từ 01/01/2026, thay bằng Luật 91/2025 + NĐ 356/2025.

3. **Đồng ý xử lý dữ liệu bị gộp vào đồng ý điều khoản** — Form đăng ký chỉ có 1 checkbox bắt buộc "đồng ý Điều khoản dịch vụ & Quy tắc nền tảng" (`public/app.js:2637`), không có ô đồng ý riêng cho xử lý dữ liệu cá nhân. Căn cứ: Điều 9 Luật 91/2025 (đồng ý tách theo từng mục đích); NĐ 356/2025 cấm gộp đồng ý dữ liệu vào đồng ý điều khoản (số điều CHƯA XÁC MINH — cần tra cứu).

4. **Mâu thuẫn nghiêm trọng giữa cam kết điều khoản và hành vi code** — Điều khoản cam kết "dữ liệu phản hồi được chuyển giao cho Doanh Nghiệp dưới dạng báo cáo thống kê ẩn danh. Doanh Nghiệp không thể xem được họ tên, email..." (`app.js:3280-3281`). Thực tế code:
   - Tự ghim demographics của đáp viên vào answers (`__profile_gender/province/university/major/age` — `server/controllers/surveyController.js:1549-1555`, chú thích gốc "Auto-fill thông tin Profile ngầm") rồi gửi kèm webhook Google Sheets của creator (`surveyController.js:1869-1880`) mà không có thông báo/đồng thuận nào trong luồng nộp bài;
   - CSV export cho creator chứa **email, họ tên, giới tính, trường** đáp viên (`surveyController.js:2107-2113`, header 'Email Người Trả Lời' tại :2199-2213).
   Đây vừa vi phạm nguyên tắc đồng ý/minh bạch (Điều 9 Luật 91/2025) vừa là **thông tin sai sự thật trong hợp đồng theo mẫu** (Điều 10 khoản 1 Luật BVLNTD 19/2023). Phải chọn 1 hướng: ẩn danh thật (bỏ auto-fill, loại PII khỏi export) hoặc sửa điều khoản + xin đồng thuận riêng cho việc chuyển giao.

5. **Lỗ hổng bảo mật dữ liệu nghiêm trọng (nhóm hành vi bị cấm — Điều 7 khoản 7 Luật 91/2025: làm lộ dữ liệu)**:
   - Backdoor đăng nhập: khi mật khẩu sai, hệ thống thử thêm `'123456'`/`'password123'` đối chiếu lại (`server/controllers/authController.js:322-325`) — bất kỳ ai biết mật khẩu yếu chung đều đăng nhập được tài khoản;
   - `JWT_SECRET` và `WEBHOOK_SECRET` có giá trị mặc định hardcode trong source (`server/config/index.js:8,18`);
   - Mật khẩu admin ghi plain-text trong source (`server/db/database.js:766-818`);
   - OTP lưu plain-text, in ra console kèm email (`authController.js:97,564,1078`), trả thẳng trong API response khi không phải production (`authController.js:592-594`);
   - CORS `origin: '*'` (`server/app.js:67-71`) + JWT lưu localStorage không httpOnly (`public/app.js:430`) — mọi trang web khác đều gọi được API mang token.
   - Căn cứ: Luật An ninh mạng 116/2025 (biện pháp bảo vệ tương xứng); Điều 7 khoản 7 Luật 91/2025.

### Nên cải thiện

1. Không có bản ghi thời điểm/nội dung đồng ý (consent log) để kiểm chứng — NĐ 356/2025 (số điều CHƯA XÁC MINH).
2. Không có cơ chế rút lại đồng ý — Điều 10 Luật 91/2025.
3. Không cảnh báo độ tuổi khi đăng ký, trong khi bộ lọc khảo sát có nhóm "Dưới 18 tuổi" (`app.js:374`) → nếu trẻ em tham gia cần đồng ý người đại diện theo Điều 24 Luật 91/2025.
4. Chuyển dữ liệu xuyên biên giới đã xảy ra: Brevo (email chứa tên + OTP — `notificationService.js:190-212`), Google (Gemini nhận nội dung bài diễn đàn — `geminiSentinelService.js:86-88`, không có flag tắt lưu trữ), Google Sheets webhook, hosting Oracle Cloud/Cloudflare. Nghĩa vụ hồ sơ đánh giá tác động (Điều 20, 21 Luật 91/2025, gửi trong 60 ngày) **áp dụng nếu không thuộc diện miễn Điều 39** — dự án chưa có pháp nhân, cần xác định tư cách chủ thể trước.
5. Thiếu quy trình thông báo rò rỉ dữ liệu 72 giờ (Điều 23 Luật 91/2025) và nhân sự bảo vệ dữ liệu (Điều 33 — áp dụng nếu không miễn Điều 39).

### Đạt

- Không có script tracking bên thứ ba (GA/Pixel/Hotjar): grep bằng chứng 0 kết quả; script ngoài duy nhất là Google Sign-In, Tailwind CDN, Lucide → mục cookie/tracking đạt mức nền.

---

## 02. THUONG MAI DIEN TU

Áp dụng: Luật TMĐT 122/2025/QH15 (hiệu lực 01/07/2026), NĐ 248/2026/NĐ-CP (hiệu lực 01/07/2026).

### Cần xử lý ngay

1. **Chưa thông báo/đăng ký với Bộ Công Thương** — không thấy logo/link xác nhận trỏ về online.gov.vn. Nền tảng có chức năng nạp tiền/thanh toán → thuộc diện phải **thông báo** (nền tảng bán trực tiếp) hoặc **đăng ký** (nếu xác định là nền tảng trung gian cho doanh nghiệp giao dịch). Điều kiện đăng ký trung gian: phải là **pháp nhân** — dự án chưa có pháp nhân, đây là chặn trước cùng lúc với việc thành lập ĐN/HKD. Căn cứ: Điều 14 Luật 122/2025.
2. **Thiếu công bố thông tin bắt buộc** — footer chỉ có tên thương hiệu, địa chỉ KTX B3 BKHN (link Google Maps) và 2 email Gmail (`index.html:244-266`); không có tên pháp nhân đầy đủ, mã số thuế/MSDN, số điện thoại, số GCNĐKKD. Căn cứ: Điều 11, Điều 15 Luật 122/2025.

### Nên cải thiện

1. Chưa tách riêng văn bản "Quy chế hoạt động" và "Chính sách bảo vệ dữ liệu cá nhân" thành tài liệu độc lập (đang gộp 1 modal).
2. Chính sách hoàn tiền: có hoàn escrow khi đóng khảo sát (`app.js:3253`) và hoàn rút bị từ chối (`ledgerService.js:724-738`) nhưng chưa có kịch bản hoàn tiền khi nạp sai/nạp lặp/lỗi hệ thống.
3. Định danh người bán (doanh nghiệp tạo khảo sát): đã có OTP email + trường tax_id/company_legal_name (`database.js:457-459`) — đạt một phần, cần quy trình lưu hồ sơ cung cấp cho cơ quan quản lý (Điều 17 Luật 122/2025).

### Đạt

- Bảng giá, phí, bonus nạp hiển thị rõ trước khi xác nhận (nạp: `app.js:9582-9602`; rút: `app.js:9176-9191`).

---

## 03. AN NINH MANG

Áp dụng: Luật An ninh mạng 116/2025/QH15 (hiệu lực 01/07/2026), NĐ 333/2026/NĐ-CP (hiệu lực 19/08/2026).

### Cần xử lý ngay

1. **Nhật ký hệ thống** — hiện chỉ console.log (không file, không winston/morgan), không đảm bảo lưu tối thiểu 12 tháng phục vụ điều tra (Điều 16, 20 NĐ 333/2026 — cần xác minh diện áp dụng). Đồng thời log console đang in PII (email + OTP — `authController.js:97`).

### Nên cải thiện

1. Không có rate limiting chung (chỉ cooldown riêng cho OTP — `authController.js:10-15`); helmet CSP dùng `unsafe-inline`/`unsafe-eval` (`server/app.js:16-19`).
2. SQLite không mã hóa; file DB + WAL nằm trong thư mục dự án (`server/db/vibesurvey.db`); `.env` và `google-service-account.json` nằm ở root (đã gitignore, xác nhận qua `git ls-files`).
3. Webhook đối soát ngân hàng xác thực bằng so sánh chuỗi secret, không HMAC/checksum, và bỏ kiểm ở NODE_ENV=test (`server/controllers/walletController.js:317-346`).
4. Chưa có quy trình văn bản xử lý yêu cầu gỡ nội dung 24h/06h của cơ quan chuyên trách (Điều 25 khoản 2 Luật 116/2025).

### Đạt

- Mật khẩu hash bcrypt cost 10; admin route bảo vệ 2 lớp (JWT + requireRole) có audit log; diễn đàn có cơ chế kiểm duyệt nội dung tự động (forumSentinel + Gemini, ẩn bài vi phạm).

---

## 04. BAO VE NGUOI TIEU DUNG

Áp dụng: Luật BVLNTD 19/2023/QH15, NĐ 98/2020/NĐ-CP sửa đổi NĐ 24/2025/NĐ-CP.

### Cần xử lý ngay

1. **Điều khoản "tịch thu số dư"** — "dưới 40.0 điểm bị khóa tài khoản vĩnh viễn và **tịch thu số dư vi phạm**" (`app.js:3241`; cơ chế auto-ban tại `antiFraudService.js:303-308` chỉ UPDATE status, giữ nguyên dữ liệu/số dư). Credit nạp bằng tiền thật nhưng bị tịch thu không hoàn — điều khoản hợp đồng theo mẫu có nguy cơ rơi vào nhóm điều khoản bị cấm (Điều 25 Luật 19/2023: hạn chế quyền của NTD) và dễ bị tòa/UBND TT handled bất lợi. Đề xuất: chuyển sang cơ chế "tạm khóa quy đổi + quyền phản đối/khiếu nại + hoàn phần Credit chưa dùng sai phạm" — cần luật sư chốt câu chữ.
2. **Thiếu quyền đơn phương hủy/chấm dứt giao dịch** — điều khoản không quy định quyền hủy nạp tiền nhầm, hoàn tiền lỗi hệ thống, chấm dứt dịch vụ (Điều 37-40 Luật 19/2023; nội dung cụ thể quyền trả/hủy: CHƯA XÁC MINH — cần tra cứu).

### Nên cải thiện

1. Kênh khiếu nại chỉ có email, không có số điện thoại; cam kết xử lý 3 ngày làm việc (`app.js:3291`) là điểm cộng nhưng chưa nêu bước khiếu nại lên bên thứ ba/cơ quan quản lý.

### Đạt

- Xác nhận giao dịch 2 bước rõ ràng (bảng tóm tắt tiền + phí trước nút xác nhận).
- Không có thủ thuật áp lực mua (đếm ngược giả, khan hiếm giả).

---

## 06. GIAO DICH DIEN TU

Áp dụng: Luật GDTĐ 20/2023/QH15.

### Đạt

1. Quy trình giao dịch có đề nghị + chấp thuận rõ ràng ("Xác Nhận Nạp Quỹ" `app.js:9602`, "Xác Nhận Đổi Thưởng" `app.js:9191`).
2. Hồ sơ giao dịch lưu đầy đủ có timestamps + metadata (`point_transactions` — `server/db/database.js:99-110`, sổ cái kép `ledgerService.js`).

### Nên cải thiện

1. Thời hạn lưu hồ sơ giao dịch theo pháp luật kế toán/thuế chưa quy định nội bộ (Điều 13 Luật GDTĐ) — cần khi có doanh thu thật.

### Không áp dụng

- Chữ ký số chuyên dùng, dịch vụ tin cậy (nền tảng không chứng thực giao dịch cho bên thứ ba).

---

## 07. MINH BACH AI

Áp dụng: Luật Trí tuệ nhân tạo 134/2025/QH15 (hiệu lực 01/03/2026), NĐ 142/2026/NĐ-CP (Điều 18 về gắn nhãn).

### Đạt

1. Gemini chỉ dùng kiểm duyệt nội bộ diễn đàn, output là JSON verdict không trả cho người dùng cuối (`geminiSentinelService.js:32-39`) → thuộc nhóm **không cần gắn nhãn** (dùng nội bộ). Không có nội dung AI-generated nào hiển thị cho user (grep bằng chứng 0 kết quả).

### Nên cải thiện

1. **Quyết định tự động ảnh hưởng quyền lợi không minh bạch**: AI ẩn bài + trừ trust_score -15/-10 ngầm (`forumSentinelService.js:234-250,330-337`) mà không thông báo cho tác giả, không có kênh khiếu nại/xem xét lại bởi con người (Luật 134/2025 — cơ chế khiếu nại quyết định AI: CHƯA XÁC MINH số điều).
2. Nội dung user (tiêu đề + bài đăng, có thể chứa PII tự viết) gửi lên Google AI (nước ngoài) — liên kết mục D checklist 01: cần ràng buộc xử lý dữ liệu + đánh giá chuyển giao xuyên biên giới.

---

## 09. MOBILE APP (Android/Capacitor)

### Cần xử lý ngay

1. **Không có chức năng xóa tài khoản** cả trên web lẫn app (grep `deleteAccount` = 0 kết quả ở cả 2; menu tài khoản `app.js:1313-1486` không có mục này). Vi phạm quyền yêu cầu xóa — Điều 14 Luật 91/2025; thời hạn xử lý 20 ngày, phản hồi 2 ngày làm việc (Điều 5 NĐ 356/2025). Khi bị BANNED dữ liệu cũng giữ nguyên (`antiFraudService.js:303-308`).

### Nên cải thiện

1. Diễn đàn trong app = tính năng cộng đồng: nếu xác định thuộc mạng xã hội/truyền thông trực tuyến, NĐ 147/2024/NĐ-CP yêu cầu xác thực tài khoản bằng SĐT Việt Nam trước khi đăng bài/bình luận — hiện chỉ xác thực email (cần xác minh diện áp dụng với nền tảng quy mô nhỏ chưa công khai).

### Đạt

1. Manifest chỉ xin 3 quyền tối thiểu (INTERNET, ACCESS_NETWORK_STATE, VIBRATE — `android/app/src/main/AndroidManifest.xml:6-10`), không xin camera/vị trí/danh bạ; không SDK tracking, không SDK quảng cáo; app.js trong app đồng bộ 100% với web (cùng MD5).
2. UI tiếng Việt hoàn toàn, link chính sách mở được từ trong app (cùng footer web).

---

## MUC PHAT THAM KHAO (chi cho cac muc can xu ly ngay)

| Hành vi tiềm ẩn | Mức tối đa theo quy định | Căn cứ |
|---|---|---|
| Xử lý dữ liệu không có sự đồng ý | 30-50 triệu đồng | NĐ 330/2026/NĐ-CP (số điều CHƯA XÁC MINH) |
| Coi im lặng là đồng ý / tiếp tục xử lý khi đã yêu cầu dừng | 50-70 triệu đồng | NĐ 330/2026/NĐ-CP |
| Chuyển dữ liệu xuyên biên giới sai phạm | Tới 5% doanh thu năm liền trước | Điều 8 khoản 4 Luật 91/2025 |
| Vi phạm khác trong lĩnh vực BVDLCN | Tới 3 tỷ đồng (tổ chức) | Điều 8 khoản 5 Luật 91/2025 |

Không dùng các con số này để kết luận nền tảng sẽ bị phạt — phụ thuộc tình tiết, chủ thể và thời điểm vi phạm.

---

## UU TIEN XU LY DE XUAT (thu tu go-live)

1. **An ninh khẩn cấp** (không tốn chi phí pháp lý): bỏ backdoor `123456/password123`, xóa mật khẩu admin hardcode, bắt buộc `JWT_SECRET`/`WEBHOOK_SECRET` từ env, thu hẹp CORS, bỏ `debugOtp`, bỏ console.log OTP, thêm HMAC cho webhook ngân hàng, thêm rate-limit.
2. **Pháp lý dữ liệu**: tách checkbox đồng ý dữ liệu riêng; viết trang Chính sách bảo mật độc lập (liệt kê đúng loại dữ liệu DB đang thu, bên thứ ba: Brevo/Google/Oracle, thời hạn lưu, quyền + thời hạn xử lý theo Điều 5 NĐ 356/2025); cập nhật dẫn chiếu NĐ 13/2023 → Luật 91/2025 + NĐ 356/2025; quyết định hướng xử lý demographics/CSV (ẩn danh thật hoặc công bố + đồng thuận riêng); thêm API xóa tài khoản + xuất dữ liệu; consent log.
3. **Pháp nhân & TMĐT**: thành lập doanh nghiệp/hộ kinh doanh → công bố đủ tên pháp nhân + MST + SĐT ở footer → thông báo/đăng ký nền tảng với Bộ Công Thương (online.gov.vn) trước khi nhận tiền thật.
4. **Điều khoản**: soạn lại điều khoản "tịch thu số dư" và bổ sung quyền hủy/hoàn tiền — tham vấn luật sư.
5. **Vận hành**: nhật ký hệ thống ≥ 12 tháng, quy trình gỡ nội dung 24h, quy trình báo cáo sự cố 72h.

---

## Gioi han & Khuyen nghi

Báo cáo này do AI tạo dựa trên bộ checklist tổng hợp từ văn bản pháp luật công khai, **không phải ý kiến tư vấn pháp lý chính thức**. Khung pháp lý Việt Nam về dữ liệu cá nhân, TMĐT và an ninh mạng vừa thay đổi lớn trong 2025-2026 (Luật 91/2025, 122/2025, 116/2025, 134/2025 và các nghị định hướng dẫn); nhiều số điều trong checklist ghi rõ CHƯA XÁC MINH và chỉ nêu tên văn bản. Trước khi quyết định, xác minh lại từng văn bản tại thuvienphapluat.vn hoặc vbpl.vn và **tham vấn luật sư**, đặc biệt với các mục cần xử lý ngay liên quan điều khoản tịch thu số dư và chuyển giao dữ liệu đáp viên cho doanh nghiệp.
