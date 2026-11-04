# KẾ HOẠCH TRIỂN KHAI: HỆ THỐNG ƯU ĐÃI & ĐẶC QUYỀN CHUỖI ĐIỂM DANH TIKTOK STREAK
**Dự án**: SurvHub Platform (Web SPA & Android Native Capacitor)  
**Tài liệu tham chiếu**: `DESIGN.md`, `PROJECT_CONTEXT.md`, `public/js/modules/modalsTerms.js`  
**Trạng thái**: Đã chốt đặc tả nghiệp vụ, sẵn sàng bàn giao cho IDE/Worker triển khai code.

---

## 1. MỤC TIÊU & BÀI TOÁN KINH TẾ (UNIT ECONOMICS)

1. **Mục tiêu**:
   - Tối đa hóa tỷ lệ giữ chân đáp viên (Retention rate D7, D30, D90).
   - Kích thích người dùng tích cực điền khảo sát chất lượng cao mỗi ngày thay vì chỉ vào điểm danh nhận điểm thụ động.
   - Giữ chân người dùng dài hạn thông qua cơ chế chống mất chuỗi (Streak Freeze).
2. **Kỷ luật Kinh tế học (Ledger Safety)**:
   - Các khoản thưởng thêm % khảo sát (`+3%` đến `+10%`) được kích hoạt khi có lượt làm bài thực tế, trích từ phí dịch vụ gia tăng (`Take Rate 10%-36%`) do tần suất quay lại của người dùng cao hơn, không gây thâm hụt ngân sách sàn.
   - Thưởng mốc lớn (Hộp quà cột mốc) được khống chế số lượng 1 lần duy nhất cho mỗi tài khoản thông qua trường `claimed_milestones_json`.

---

## 2. PHÂN TẦNG CẤP BẬC & HỆ SỐ THƯỞNG KHẢO SÁT (+% POINT MULTIPLIER)

Hệ thống ngọn lửa TikTok Streak gắn liền với hệ số thưởng trực tiếp khi hoàn thành khảo sát:

| Cấp Bậc Ngọn Lửa | Mốc Chuỗi Ngày | Màu Sắc Nhận Diện | Hệ Số Thưởng Khảo Sát | Quyền Lợi Đi Kèm |
|---|---|---|---|---|
| **Cấp 1: Lửa Khởi Động** | 1 - 10 ngày | Hổ phách ấm (`#F59E0B`) | `+0%` (Gốc) | Điểm danh nhận thưởng thang 7 ngày chuẩn |
| **Cấp 2: Lửa Bùng Cháy** | 11 - 50 ngày | Đỏ hoàng hôn (`#EF4444` -> `#F97316`) | **`+3% Point`** | Hộp quà Mốc 10 ngày (+1,000đ + Huy hiệu) |
| **Cấp 3: Hồng Neon Tím TikTok** | 51 - 100 ngày | Hồng Neon TikTok (`#FE2C55` -> `#D946EF`) | **`+5% Point`** | Hộp quà Mốc 50 ngày (+3,000đ + 01 Vé Cứu Chuỗi) |
| **Cấp 4: Băng Hỏa Điện Quang** | 101 - 200 ngày | Xanh băng Cyber Ice Cyan (`#00F2FE` -> `#06B6D4`) | **`+8% Point`** | Hộp quà Mốc 100 ngày (+10,000đ + 01 Vé Cứu Chuỗi + Khung Avatar Neon) |
| **Cấp 5: Thần Thoại Hoàng Kim** | Từ 201 ngày trở lên | Vàng kim thạch anh (`#F59E0B` -> `#EC4899`) | **`+10% Point`** | Hộp quà Mốc 200 ngày (+25,000đ + Danh hiệu Vĩnh viễn + Ưu tiên duyệt rút) |

---

## 3. CƠ CHẾ HỘP QUÀ CỘT MỐC & VÉ ĐÓNG BĂNG CHUỖI (STREAK FREEZE)

### 3.1. Danh mục Hộp Quà Cột Mốc (Nhận 1 lần duy nhất)
- **Cột mốc 10 Ngày**: +1,000 Point + Huy hiệu "Tân Binh Bền Bỉ" trên hồ sơ cá nhân.
- **Cột mốc 50 Ngày**: +3,000 Point + **01 Vé Đóng Băng Chuỗi (Streak Freeze)**.
- **Cột mốc 100 Ngày**: +10,000 Point + **01 Vé Đóng Băng Chuỗi** + Khung viền Avatar phát sáng Neon trên Diễn đàn.
- **Cột mốc 200 Ngày**: +25,000 Point + **01 Vé Đóng Băng Chuỗi** + Danh hiệu "Thần Thoại SurvHub" + Ưu tiên phê duyệt lệnh rút tiền siêu tốc trong 15 phút.

### 3.2. Thuật toán Vận hành Vé Đóng Băng Chuỗi (Streak Freeze Engine)
- Mỗi người dùng có thể tích lũy tối đa **02 Vé Đóng Băng** cùng lúc (tránh lạm dụng).
- **Cơ chế Tự động Kích hoạt (Auto-Protection Trigger)**:
  - Khi người dùng đăng nhập hoặc hệ thống kiểm tra tại mốc chuyển ngày:
    - Nếu hôm qua người dùng KHÔNG điểm danh:
      - `IF` (số vé `streak_freezes_count > 0`):
        -> Khấu trừ 1 vé: `streak_freezes_count = streak_freezes_count - 1`.
        -> Bảo toàn chuỗi: Giữ nguyên `current_streak` như cũ, KHÔNG reset về ngày 1.
        -> Ghi nhận `last_freeze_used_at = CURRENT_TIMESTAMP`.
        -> Gửi thông báo Push & In-App Notification: *"SurvHub đã tự động sử dụng 01 Vé Cứu Chuỗi để bảo vệ ngọn lửa [Cấp bậc] của bạn!"*.
      - `ELSE`:
        -> `current_streak = 0` (Bị đứt chuỗi và reset về ban đầu).

---

## 4. THAY ĐỔI CƠ SỞ DỮ LIỆU & SCHEMA (SQLITE WAL)

Cần cập nhật cấu trúc bảng `daily_streaks` trong CSDL `server/db/vibesurvey.db`:

```sql
-- Bổ sung các cột phục vụ vé cứu chuỗi và hộp quà cột mốc
ALTER TABLE daily_streaks ADD COLUMN streak_freezes_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_streaks ADD COLUMN claimed_milestones_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE daily_streaks ADD COLUMN last_freeze_used_at DATETIME DEFAULT NULL;
```

---

## 5. API CONTRACTS & LOGIC BACKEND

### 5.1. Cập nhật `GET /api/v1/users/streak-info`
Trả về bổ sung các trường thông tin:
```json
{
  "success": true,
  "streak": {
    "current_streak": 52,
    "max_streak": 52,
    "has_checked_in_today": true,
    "streak_freezes_count": 1,
    "multiplier_percent": 5,
    "claimed_milestones": [10, 50],
    "eligible_unclaimed_milestone": null,
    "tier_level": 3,
    "tier_name": "Hồng Neon Tím TikTok"
  }
}
```

### 5.2. Endpoint mới: `POST /api/v1/users/streak-claim-milestone`
- **Request Body**: `{ "milestone_day": 50 }`
- **Xử lý ACID Transaction**:
  1. Kiểm tra `streak.current_streak >= milestone_day`.
  2. Kiểm tra `milestone_day` chưa nằm trong `claimed_milestones_json`.
  3. Cộng Point thưởng tương ứng vào tài khoản và ghi nhận sổ cái Double-Entry Ledger:
     - `category: 'STREAK_MILESTONE_REWARD'`
     - `amount`: theo định mức mốc.
  4. Nếu mốc có tặng Vé: `streak_freezes_count = Math.min(2, streak_freezes_count + 1)`.
  5. Cập nhật `claimed_milestones_json`.
- **Response**: Trả về số dư mới, số vé mới và thông báo chúc mừng.

### 5.3. Tích hợp Hệ số Thưởng Khảo sát tại `server/controllers/surveyController.js`
Trong hàm xử lý nộp bài khảo sát (`submitResponse`):
```javascript
// Tính thù lao gốc từ Escrow
const baseReward = Math.floor((survey.total_escrow_amount * (1 - takeRate)) / survey.target_respondent_count);

// Lấy hệ số thưởng theo chuỗi ngày của User
let bonusPercent = 0;
if (userStreak >= 201) bonusPercent = 0.10;
else if (userStreak >= 101) bonusPercent = 0.08;
else if (userStreak >= 51) bonusPercent = 0.05;
else if (userStreak >= 11) bonusPercent = 0.03;

const streakBonusPoints = Math.floor(baseReward * bonusPercent);
const totalCreditToUser = baseReward + streakBonusPoints;

// Ghi nhận vào Ledger và cộng số dư ví
```

---

## 6. GIAO DIỆN NGƯỜI DÙNG (FRONTEND UI/UX)

1. **Trong Modal Điểm Danh (`public/js/modules/modalsTerms.js` - `openStreakModal`)**:
   - Thêm badge hiển thị: `[01 Vé Cứu Chuỗi]` cạnh nút đóng.
   - Thêm dòng thông tin đặc quyền dưới thẻ Bento Chuỗi Hiện Tại:
     *"Đặc quyền hiện tại: Thưởng thêm +5% Point trên mọi bài khảo sát"*.
   - Khối "Hộp Quà Cột Mốc": Hiển thị các hộp quà mốc 10, 50, 100, 200 ngày. Hộp quà nào đủ điều kiện nhưng chưa nhận sẽ có nút "Mở Quà Ngay".
2. **Màn hình Hoàn thành Khảo sát**:
   - Khi đáp viên điền xong khảo sát, popup chúc mừng tách rõ 2 dòng:
     - Thù lao khảo sát: `+X Point`
     - Thưởng Chuỗi [Tên Cấp Ngọn Lửa] (+Y%): `+Z Point`
   - Hiệu ứng này tạo cảm giác cực kỳ phấn khích và thôi thúc người dùng giữ chuỗi mỗi ngày.

---

## 7. CHECKLIST NGHIỆM THU CHO WORKER / IDE TIẾP THEO

- [ ] 1. Chạy migration thêm 3 cột vào bảng `daily_streaks` trong `server/database.js`.
- [ ] 2. Viết hàm kiểm tra và kích hoạt Vé Đóng Băng Tự Động (Auto-Freeze) khi user login/check-in.
- [ ] 3. Tạo endpoint `POST /users/streak-claim-milestone` với kiểm soát Transaction ACID và Ledger chống nhận trùng.
- [ ] 4. Bổ sung `bonusPercent` trong luồng cộng điểm hoàn thành khảo sát tại `surveyController.js`.
- [ ] 5. Cập nhật UI Modal `openStreakModal` hiển thị Vé Cứu Chuỗi và danh sách Hộp Quà Cột Mốc.
- [ ] 6. Chạy `npm test` (đảm bảo vượt qua 26/26 Suites), chạy `npm run sync:android`, bump cache-buster và commit Git.
