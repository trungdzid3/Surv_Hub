# BÁO CÁO REVIEW FRONTEND VIBESURVEY (READ-ONLY — CHƯA SỬA)

Ngày kiểm: 03-11-2026. Phạm vi: `public/index.html`, `public/styles.css`, `public/app.js` (thời điểm 20.612 dòng) + `public/js/modules/`.
Nguồn chân lý đối chiếu: `DESIGN.md` (bảng màu Cam #EA580C/Trắng/Đen Obsidian, Montserrat 4 phân cấp, Lucide, cấm emoji, Custom Dropdown Popover, phân trang 8 bài).
Checklist áp dụng: hallmark Floor 15 điều, taste-skill house rules + app-screen rules, impeccable audit 5 chiều.
LƯU Ý VỊ TRÍ: Báo cáo kiểm trước đại tu modular — từ 03-11-2026 đêm app.js đã tách thành module (`docs/CODE_MAP.md`). Vị trí dưới đây ghi kèm nơi chứa mới khi đã xác định được.

## P0 — Vỡ chức năng / vi phạm SSOT nghiêm trọng

**P0-1. Cụm ~700 lớp màu semantic ngoài palette, light mode hiển thị đa sắc trực diện**
- Bằng chứng: `text-emerald-600` x50, `text-emerald-400` x50, `text-red-500` x25, `text-red-600` x24, `text-amber-600` x21, `text-amber-400` x20, `text-indigo-600` x24, `bg-emerald-950` x29, `bg-red-950` x17, `bg-amber-950` x14, cùng blue/rose/purple/green/cyan rải rác (lúc kiểm nằm trong app.js — sau Wave 1-7 phân bố vào các module: wallet-ledger.js, adminConsole.js, forum.js, respondent.js...). Gradient `via-rose-500/10` (app.js cũ 3408 — nay trong modalsTerms.js), `to-amber-500` x7.
- Mô tả: DESIGN.md mục 2.4 cấm xanh lá/xanh dương/đỏ/vàng. Dark mode được vá về cam bằng remap `!important` (styles.css:1039-1064) nhưng light mode KHÔNG có lớp vá — badge/chip thành công-cảnh báo-lỗi hiện xanh lá/đỏ/vàng/tím nguyên bản.
- Hướng sửa: chốt kiến trúc 1 lần — (a) refactor các lớp semantic về dải cam chuẩn `#EA580C/#F97316/#C2410C/#FFF7ED` theo DESIGN.md, hoặc (b) cập nhật DESIGN.md công nhận semantic colors rồi bỏ lớp remap `!important` (cách vá hiện tại là drift kép: render lệch + CSS vá lại).

**P0-2. Tương phản WCAG AA vi phạm hệ thống trên màu thương hiệu**
- Bằng chứng: "Đăng Ký" trắng trên `#EA580C` = 3.6:1 (index.html nút đăng ký, link cam trên trắng 3.6:1); `text-orange-600` dùng làm chữ 436 chỗ (phân bố toàn các module sau đại tu).
- Mô tả: `#EA580C` trên nền trắng chỉ đạt 3.6:1, dưới 4.5:1 cho text nhỏ (12px) — mọi link/chữ cam cỡ nhỏ vi phạm WCAG AA.
- Hướng sửa: `#C2410C` (orange-700, ~5.3:1) cho text cam cỡ nhỏ trên nền sáng; giữ `#EA580C` cho CTA nền đặc cỡ lớn (đạt 3:1 large-text) hoặc tăng cỡ/độ đậm.

## P1 — Vi phạm DESIGN.md rõ ràng

**P1-1. Gradient trên CTA, card, blob trang trí + glow neon**
- Bằng chứng: 17 chỗ `bg-gradient-to-*` (nay rải các module — tiêu biểu gradient cam→amber trên nút chính); `.fintech-card-bg` gradient + glow `0 16px 36px -10px rgba(234,88,12,0.45)` tại styles.css:646-648; blob blur-3xl 850x550 tại index.html:84; glow `shadow-[0_0_12px_rgba(249,115,22,0.2)]`; hex ngoài palette `#E73F1E/#F25A12/#FB6C00`.
- Hướng sửa: phẳng hóa CTA thành `bg-orange-600 hover:bg-orange-700`; card fintech nền phẳng + viền 1px; xóa/giảm blob còn 1 lớp tint tĩnh.

**P1-2. Token gốc dùng gray/slate thay vì chuẩn zinc trong DESIGN.md**
- Bằng chứng: styles.css:205-208 — `--text-main: #111827`, `--text-body: #374151`, `--text-muted: #6B7280`, `--text-subtle: #9CA3AF`; border slate alpha (201-202, 213-214); `#1e293b/#475569/#cbd5e1/#f8fafc` (1146-1261); `text-slate-900` footer (index.html:240,251,262).
- Hướng sửa: đổi token :root sang zinc theo DESIGN.md (`#09090B/#18181B`, muted `#71717A/#52525B`) — sửa 6 biến lan toàn hệ; xóa hex slate lẻ trong custom-checkbox.

**P1-3. Dropdown tùy chỉnh thiếu điều hướng bàn phím và ARIA**
- Bằng chứng: `public/js/modules/customDropdown.js:38-42` — chỉ xử lý Escape; không ArrowUp/Down, không roving focus, không `role="listbox"/aria-expanded/aria-haspopup`. Module này là chuẩn bắt buộc toàn dự án (thay `<select>`).
- Hướng sửa: thêm mũi tên + Enter, roving focus, aria-expanded trên trigger, role="option" trên item, Escape trả focus về trigger.

**P1-4. Nút icon-only thiếu accessible name**
- Bằng chứng: nút chuông thông báo index.html:159 dùng `title` thay `aria-label`; tổng 5 `aria-label` toàn dự án trong khi ~500 icon `data-lucide`.
- Hướng sửa: rà nút icon-only (chuông, đóng modal, menu, kebab) thêm `aria-label` tiếng Việt; `title` chỉ làm tooltip bổ sung.

## P2 — Anti-pattern kỹ thuật / hiệu năng

**P2-1. `transition: all`** — styles.css dòng 517, 563, 598, 635, 1152, 1170 (6 chỗ); 341 class `transition-all` trong template (nay rải modules; adminAnalyticsModule x7, bugReportModule x21). Sửa: chỉ định `transition-property` đúng (colors/transform/opacity/box-shadow).

**P2-2. Rò rỉ listener `visibilitychange`** — `app.js:18427-18443` cũ (nay `pushNotifications.js`): thêm listener mỗi lần gọi `startNotificationPolling()` mà không gỡ → N lần điều hướng = N lần poll khi quay lại tab. **TRẠNG THÁI: ĐÃ FIX trong Wave 1 (03-11 đêm)** — handler lưu `this._visibilityHandler` + `removeEventListener` trước khi add.

**P2-3. Kiến trúc render innerHTML + onclick inline** — 107 chỗ innerHTML, 474 handler `onclick="VibeApp.*"`. Không tích tụ listener (điểm cộng) nhưng khó audit XSS khi nội dung user nhúng chuỗi — phải tin escaping thủ công từng chỗ. Đường dài: template function + textContent cho dữ liệu user; ngắn hạn: kiểm mọi `${user.*}` đã qua escape.

**P2-4. Không có `prefers-reduced-motion`** — grep 0 kết quả (Floor 7 hallmark). Sửa: 1 block `@media (prefers-reduced-motion: reduce)` tắt transform/animation toàn cục.

**P2-5. Micro-label uppercase tracking + cuộn ngang mobile + body 12px (landing)** — footer `text-xs uppercase tracking-wider` x3 (index.html:240,251,262); inspector FAIL overflow 15px tại 390px do blob fixed (+230px) và nút Đăng Ký chạm mép phải; FAIL body-size 12px + 19 khối text dưới 13px. Sửa: sentence case footer headings; `overflow-x: clip` cho html,body (Floor 4); nâng body landing 14px.

## P3 — Đề xuất

1. Ký tự `✕` (nay quanh modalsTerms.js) và `★` (kèm text-amber-500) → thay bằng icon Lucide `x`/`star`.
2. `closeAllCustomDropdowns()` hardcode 33 ID menu (customDropdown.js:121-154) — nên dùng class/data-attribute chung.
3. `h-screen` index.html:82 → `h-[100svh]` chống nhảy thanh địa chỉ mobile.
4. Logo nghi vấn broken `/logo-light.svg` x2 (index.html:119, 230) — SVG hợp lệ, nhiều khả năng artifact tool chụp; xác minh 1 lần khi chạy server thật, nếu 404 thật thì nâng P0.
5. Touch targets `h-7/h-8` (28-32px) đạt chuẩn desktop nhưng mobile cần vùng chạm >=44px.

## Điểm cộng (giữ nguyên, nhân rộng)

- 0 thẻ `<select>` nguyên thủy toàn frontend — tuân thủ 100% DESIGN.md 5.3.
- Phân trang đúng 8 bài/trang; `font-mono` x313 cho số liệu đúng mục 3.
- Emoji sạch: index.html = 0; chỉ còn lọc đầu vào người dùng.
- 10 setInterval đều có cặp clearInterval + null-out (trừ case P2-2 đã fix).
- Dark mode token đúng chuẩn Obsidian; Montserrat 100%; breakpoints 640/768/1024 phủ đủ 3 vùng yêu cầu.

## Đánh giá tổng quan 3 góc nhìn

| Góc nhìn | Kết luận |
|---|---|
| Hallmark (slop check) | Không phải slop: không invented metrics, không emoji-icon, không gradient tím-xanh, không card-in-card. Phá 3 điều Floor: `transition: all` (10a), thiếu `:focus-visible` phổ quát + `prefers-reduced-motion` (6, 7), micro-label tracked caps (9). |
| Taste house rules (app screen) | Là Operate mode nhưng dùng trang trí kiểu landing: gradient CTA, glow, blob — màu nằm trên chrome chứ không trên data. Điểm mạnh: type 100% Montserrat, số liệu mono, nền chuẩn. |
| Impeccable audit | A11y 1/4 · Performance 2/4 · Theming 2/4 · Responsive 3/4 · Integrity 2/4 — 10/20, Acceptable: SSOT rõ, tuân thủ ở tầng cấu trúc (dropdown, phân trang, icon), nhưng tầng màu semantic drift nặng và bị vá `!important` thay vì sửa gốc. |

## Thứ tự xử lý đề xuất (khi được duyệt)

1. P0-1 — chốt chính sách semantic màu (quyết định kiến trúc, sửa 1 lần lan toàn hệ)
2. P0-2 + P1-2 — token + tương phản (sửa ở tầng token, không phải từng chỗ)
3. P1-3 + P1-4 — a11y keyboard + accessible name
4. P2-1 + P2-4 + P2-5 — dọn kỹ thuật (transition, reduced-motion, overflow)
