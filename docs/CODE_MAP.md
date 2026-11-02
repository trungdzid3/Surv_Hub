# CODE MAP - FRONTEND VIBESURVEY (WAVE 2/8 MODULAR)

Bản đồ điều hướng mã nguồn frontend cho AI và lập trình viên. Map theo SYMBOL (tên hàm/hằng), không map số dòng (số dòng thay đổi liên tục). Cập nhật lần cuối: Wave 2 modular hóa (cache-buster `4.9.7_modular_wave2`).

---

## 1. KIẾN TRÚC HIỆN TẠI

Thứ tự nạp trong `public/index.html` (trước `</body>`):

| # | File | Vai trò | Symbols chính | Exports |
|---|------|---------|---------------|---------|
| 1 | `public/js/data/catalogs.js` | Kho dữ liệu danh mục tĩnh (tỉnh thành, trường ĐH, ngành, voucher mặc định) | Hằng dữ liệu thuần | `window.VibeData` (freeze) + back-compat `window.VIBE_PROVINCES_34`, `window.VIBE_AGE_GROUPS`, `window.VIBE_OCCUPATIONS`, `window.VIBE_UNIVERSITIES_DATA`, `window.VIBE_34_PROVINCES`, `window.VIBE_SYSTEM_CATEGORIES`, `window.DEFAULT_STUDIO_CATALOG_VOUCHERS` |
| 2 | `public/js/utils.js` | Helper thuần dùng chung | `escapeHtml` (canonical), `formatVND`, `refreshIcons` | `window.VibeUtils` |
| 3 | `public/js/modules/customDropdown.js` | Dropdown Popover chuẩn DESIGN.md 5.3 | `initDropdownListeners`, `_activeDropdownId` | `window.CustomDropdownModule` + `Object.assign(window.VibeApp, ...)` |
| 4 | `public/js/modules/lightboxViewer.js` | Xem ảnh lightbox | viewer/lightbox handlers | `window.LightboxViewerModule` + VibeApp |
| 5 | `public/js/modules/bugReportModule.js` | Quy trình báo lỗi user/admin | `openBugReportModal`, `switchBugReportTab` | `window.BugReportModule` + VibeApp |
| 6 | `public/js/modules/adminAnalyticsModule.js` | Console logs + audit admin | `renderAdminConsoleLogs` liên quan audit | `window.AdminAnalyticsModule` + VibeApp |
| 7 | `public/js/modules/voucherMarket.js` (mới W1) | Chợ Voucher + Ví Voucher (VIEW 3-4) | `renderVoucherMarketView`, `redeemVoucher`, `renderMyVouchersView` | `window.VoucherMarketModule` + VibeApp |
| 8 | `public/js/modules/pushNotifications.js` (mới W1) | Push notification + Android Hybrid | `initPushNotifications`, `startNotificationPolling`, `showPushPopup`, `pollNotifications`, `_formatTimeAgo`, ... (19 hàm) | `window.PushNotificationsModule` + VibeApp |
| 9 | `public/js/modules/wallet-ledger.js` (mới W2) | Ví & Rút Tiền (VIEW 5): số dư Point/Credit, lịch sử giao dịch + sổ cái, payout (thẻ cào/bank/MoMo), swap Point sang Credit, nạp quỹ Creator VietQR + polling đơn nạp | `renderWalletView`, `switchWalletTab`, `filterWalletTransactions`, `renderTransactionRowHtml`, `renderWalletTransactionList`, `toggleWalletTimeDropdown`, `selectWalletTimeRange`, `openPayoutModal`, `updatePayoutUI`, `submitPayoutAction`, `openSwapPointsModal`, `updateSwapPointsPreview`, `submitSwapPoints`, `calculateDepositBonus`, `updateDepositCalc`, `setDepositPreset`, `openDepositModal`, `submitDepositAction`, `showVietQrPaymentModal`, `checkDepositStatus`, `simulatePaymentSuccess`, `toggleWalletLedgerAccordion` (22 hàm) | `window.WalletLedgerModule` + VibeApp |
| 10 | `public/app.js` (~18.4k dòng) | Object `window.VibeApp` trung tâm (state, api, render, studio, forum, admin, respondent runner) + `RestrictionEngine` (chống gian lận validation) | `VibeApp.init`, `VibeApp.api`, `VibeApp.navigate`, `renderSurveysView`, `renderCreatorSurveysView`, `renderForumView`, `renderCreateSurveyView`, `parseRawQuestionsText`, `escapeHtml` (alias ủy quyền về VibeUtils), `RestrictionEngine.extractNumberRange` | `window.VibeApp`, `window.RestrictionEngine` |

Quy tắc giao tiếp: window globals + `this.*` late-binding. Module mới mở rộng bằng `Object.assign(window.VibeApp, {...})` trong IIFE `'use strict'`, có JSDoc banner `@namespace/@requires/@exports`.

---

## 2. CÁCH TÌM NHANH

- Tìm định nghĩa hàm: `grep -n "  tenHam(" public/app.js` (2 space indent = property của VibeApp) hoặc grep trong `public/js/modules/*.js`.
- Tìm hằng dữ liệu danh mục: luôn ở `public/js/data/catalogs.js` (không còn trong app.js, chỉ còn dòng destructure).
- Helper dùng chung: `public/js/utils.js` - KHÔNG định nghĩa lại `escapeHtml` ở nơi khác.
- Quy tắc thêm module mới: tạo file trong `public/js/modules/`, IIFE + `Object.assign(window.VibeApp, ModuleObj)`, thêm `<script>` vào nhóm module trong index.html (TRƯỚC app.js), đặt cache-buster `?v=...`, JSDoc banner đầy đủ. Không gọi hàm module lúc load-time (chỉ gọi trong runtime qua `this.`/`VibeApp.`).

---

## 3. LỊCH SỬ HỢP NHẤT (WAVE 1)

| Cặp trùng | Xử lý | Lý do |
|-----------|-------|-------|
| `VibeApp.closeAllCustomDropdowns` (2 bản) | Xóa bản cũ lạc hậu; giữ bản sau trong object (đầy đủ hơn: thêm class `.custom-dropdown-popover`, icon `.custom-dropdown-icon`, 3 ID admin, reset trạng thái `CustomDropdownModule._active*`) | Bản sau ghi đè bản trước từ trước nên bản cũ là dead code; hành vi giữ nguyên 100% |
| `VibeApp.getForumCategoryMeta` (2 bản) | Xóa bản trước; giữ bản sau | Hai bản giống hệt nhau (`return this.getCategoryMeta(catId);`) |
| `RestrictionEngine.extractNumberRange` vs `VibeApp.extractNumberRange` | KHÔNG đụng | Không phải trùng lặp: bản VibeApp đã là wrapper ủy quyền về `RestrictionEngine.extractNumberRange` sẵn (kèm nhánh fallback chết trong `parseRawQuestionsText`, không bao giờ chạy vì property luôn tồn tại) |

---

## 4. KẾ HOẠCH WAVE 3-8 (KIẾN TRÚC ĐÍCH CHIA MIỀN NGHIỆP VỤ)

Thứ tự tách tiếp theo (mỗi file là 1 module `public/js/modules/`, nạp trước app.js, `Object.assign(window.VibeApp, ...)`):

1. **admin-console.js** (~2k dòng): toàn bộ phân hệ quản trị (`renderAdmin*`, fraud, payout duyệt...).
2. **forum.js** (~1.8k dòng): diễn đàn cộng đồng (`renderForumView`, post, comment, leaderboard...).
3. **modals-terms.js** (~1.7k dòng): auth modal + Google auth + điều khoản + toast/modal hệ thống.
4. **creator-studio.js** (~4.8k dòng, tách CUỐI): studio tạo khảo sát (builder, preview, settings, catalog voucher).
5. **respondent.js** (~3.9k dòng, tách CUỐI): runner làm khảo sát + hồ sơ đáp viên (`renderSurveyRunner*`, profile...).

Wave đã hoàn tất: **Wave 2 - wallet-ledger.js** (~1.3k dòng verbatim từ app.js: ví + payout + swap + deposit VietQR; app.js giữ lại comment marker "VIEW 5 ... ĐÃ TÁCH RA").

Follow-up đã ghi nhận (không làm trong Wave 1 để giữ diff tối thiểu):
- Thay dần **84 chỗ** `.toLocaleString('vi-VN')` bằng `VibeUtils.formatVND(...)`.
- Thay dần **66 chỗ** `window.lucide.createIcons()` bằng `VibeUtils.refreshIcons()`.
- KPI đích: `public/app.js` còn **~4.000 dòng** (hiện ~18.4k sau Wave 2; 19.7k sau Wave 1, 20.6k ban đầu).
- Android/Capacitor: QA đồng bộ assets sau khi toàn bộ wave xong (`npm run sync:android`).
- Backup an toàn: `backups/backup_pre_modular_20261103-025845/` (md5 app.js gốc khớp 100% trước khi tách).
