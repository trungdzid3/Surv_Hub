# CODE MAP - FRONTEND VIBESURVEY (WAVE 5/8 MODULAR)

Bản đồ điều hướng mã nguồn frontend cho AI và lập trình viên. Map theo SYMBOL (tên hàm/hằng), không map số dòng (số dòng thay đổi liên tục). Cập nhật lần cuối: Wave 5 modular hóa (cache-buster `4.9.10_modular_wave5`).

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
| 10 | `public/js/modules/adminConsole.js` (mới W3) | Phân hệ Quản trị: Tổng quan kinh tế sàn (VIEW 8), Duyệt Payout (VIEW 9), Gian lận & Unban (VIEW 10), Admin Fast Command Console (terminal `/help`, `/stats`, `/naptien`...), Sub-Nav quản trị | `renderAdminOverviewView`, `renderAdminPayoutsView`, `setAdminPayoutFilter`, `setAdminPayoutPage`, `handleAdminPayout`, `renderAdminFraudView`, `setAdminFraudLogLimit`, `setAdminFraudLogPage`, `searchAdminFraudUser`, `clearAdminFraudSearch`, `unbanAdminUser`, `unbanIpAddress`, `isStudentUser`, `renderAdminConsoleLogs`, `quickAdminLogin`, `fillAdminConsoleCommand`, `clearAdminConsole`, `handleAdminConsoleKeyDown`, `submitAdminConsoleCommand`, `openAdminConsoleModal`, `renderAdminSubNav` + dữ liệu `_adminConsoleHistory`, `_adminConsoleHistoryIdx`, `_adminTerminalLogs` (21 hàm + 3 state) | `window.AdminConsoleModule` + VibeApp |
| 11 | `public/js/modules/forum.js` (mới W4) | Phân hệ Diễn Đàn Thảo Luận (COMMUNITY BOARD): view diễn đàn + feed in-place, bộ lọc/sắp xếp/hub (Cộng Đồng - Góc Sinh Viên), thẻ bài viết + khảo sát đính kèm, modal đăng bài, WYSIWYG editor + parser nội dung, gallery ảnh đính kèm (nén, preview, lightbox), like/bình luận/chia sẻ, xóa bài (cả hành động từ Profile `deleteForumPostAction`) | `deleteForumPostAction`, `renderForumView`, `_renderForumLayout`, `_updateForumFeedInPlace`, `setForumHub`, `handleForumSearchInPlace`, `getForumCategoryMeta` (ủy quyền `getCategoryMeta`), `selectForumPostCategoryTag`, `onForumAttachedSurveySelected`, `setForumCategoryFilter`, `setForumScopeFilter`, `setForumSort`, `resetForumFilters`, `renderForumPostCardHtml`, `openCreateForumPostModal`, `submitCreateForumPost`, `formatForumEditor`, `formatForumContent`, `_renderForumPostContentWithToggle`, `toggleForumPostContent`, `handleForumImagesSelected`, `removeForumAttachedImage`, `_renderForumAttachedImagesPreview`, `_renderForumPostImagesHtml`, `shareForumPost`, `deleteForumPost`, `toggleForumPostLike`, `toggleForumComments`, `loadForumComments`, `submitForumComment` (30 hàm) | `window.ForumModule` + VibeApp |
| 12 | `public/js/modules/modalsTerms.js` (mới W5) | Auth Modal + Google Auth + Điều khoản + Streak điểm danh (nằm lồng giữa cụm auth trong app.js nên di chuyển cùng khối) + tiện ích modal dùng chung toàn hệ: toast, modal hệ thống, copy | `openAuthModal`, `switchAuthTab`, `getAuthFormHtml`, `selectRegisterRole`, `togglePasswordVisibility`, `handleLoginSubmit`, `_startRegOtpCooldown`, `_updateRegOtpBtnState`, `sendRegistrationOtp`, `handleRegisterSubmit`, `loginWithGoogleQuick`, `linkGoogleAccount`, `showGoogleConfigGuideModal`, `openGoogleAuthPopup`, `closeGoogleAuthModal`, `toggleGoogleDropdown`, `switchGoogleAccount`, `promptCustomGoogleAccount`, `submitGoogleConsent`, `handleTermsCheckboxChange`, `openTermsModal`, `closeTermsModal`, `acceptTermsFromModal`, `fetchStreakInfo`, `updateStreakHeaderUI`, `openStreakModal`, `performCheckin`, `verifyEmailAccount`, `openEmailVerificationModal`, `handleEmailOtpSubmit`, `openSurveyPreviewModal`, `renderGuestLockedView`, `fallbackCopyText`, `showToast`, `showModal`, `closeModal`, `copyValue` (36 hàm) | `window.ModalsTermsModule` + VibeApp |
| 13 | `public/app.js` (~13.0k dòng) | Object `window.VibeApp` trung tâm (state, api, render, studio, respondent runner) + `RestrictionEngine` (chống gian lận validation); tiện ích dùng chung `getLucideSvg`, `escapeHtml` (alias ủy quyền về VibeUtils), `copyText` (sao chép mã ưu đãi - miền voucher) vẫn giữ tại đây | `VibeApp.init`, `VibeApp.api`, `VibeApp.navigate`, `renderSurveysView`, `renderCreatorSurveysView`, `renderProfileView`, `renderCreateSurveyView`, `parseRawQuestionsText`, `escapeHtml` (alias ủy quyền về VibeUtils), `getLucideSvg`, `getCategoryMeta`, `normalizeCategoryCode`, `compressImageFile`, `RestrictionEngine.extractNumberRange` | `window.VibeApp`, `window.RestrictionEngine` |

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

1. ~~**admin-console.js** (~2k dòng): toàn bộ phân hệ quản trị (`renderAdmin*`, fraud, payout duyệt...)~~ - HOÀN TẤT Wave 3.
2. ~~**forum.js** (~1.8k dòng): diễn đàn cộng đồng (`renderForumView`, post, comment, leaderboard...)~~ - HOÀN TẤT Wave 4.
3. ~~**modals-terms.js** (~1.7k dòng): auth modal + Google auth + điều khoản + toast/modal hệ thống~~ - HOÀN TẤT Wave 5 (file thực tế: `modalsTerms.js`).
4. **creator-studio.js** (~4.8k dòng, tách CUỐI): studio tạo khảo sát (builder, preview, settings, catalog voucher).
5. **respondent.js** (~3.9k dòng, tách CUỐI): runner làm khảo sát + hồ sơ đáp viên (`renderSurveyRunner*`, profile...).

Wave đã hoàn tất:
- **Wave 5 - modalsTerms.js** (~1.7k dòng verbatim từ app.js, 3 khối: (a) phân đoạn AUTH MODAL + GOOGLE AUTH + ĐIỀU KHOẢN + STREAK từ banner "AUTHENTICATION MODAL" đến trước `renderNavigation` (gồm `openAuthModal`, form đăng nhập/đăng ký + cooldown OTP, `openGoogleAuthPopup` + dropdown tài khoản Google, `openTermsModal`/`acceptTermsFromModal`, nhóm STREAK `fetchStreakInfo`/`updateStreakHeaderUI`/`openStreakModal`/`performCheckin` - nằm lồng giữa cụm auth nên di chuyển cùng khối, `verifyEmailAccount` + `openEmailVerificationModal`, `openSurveyPreviewModal`, `renderGuestLockedView`); (b) `fallbackCopyText` (trích riêng khỏi cụm Google Forms Studio); (c) tiện ích UI dùng chung toàn hệ `showToast`/`showModal`/`closeModal`/`copyValue` từ banner "TIỆN ÍCH THÔNG BÁO CAO CẤP". app.js giữ lại 3 marker "ĐÃ TÁCH RA modalsTerms.js (WAVE 5 MODULAR)" tại 3 vị trí cũ; `copyText` (sao chép mã ưu đãi - miền voucher) GIỮ LẠI app.js. Toàn bộ module khác gọi `showToast`/`showModal`/... chỉ trong hàm (không có gọi top-level lúc load) nên nạp `modalsTerms.js` trước app.js là an toàn; phụ thuộc `api`/`haptic`/`applyUserInterface`/`isEnterpriseUser`/`renderSurveysView`/`renderUserProfileDropdown`/`startSurveySession` late-binding qua `window.VibeApp`).
- **Wave 4 - forum.js** (~1.75k dòng verbatim từ app.js: PHÂN HỆ DIỄN ĐÀN THẢO LUẬN (COMMUNITY BOARD) gồm view + feed in-place + filter/hub + modal đăng bài + WYSIWYG + gallery ảnh đính kèm + like/comment/share + `deleteForumPostAction` (hành động xóa bài từ Profile tab `forum-posts`); `getForumCategoryMeta` là hàm của chính miền forum, di chuyển cùng khối; app.js giữ lại marker "DIỄN ĐÀN: ĐÃ TÁCH RA" tại vị trí banner cũ và các tham chiếu late-binding `this.renderForumView(root)` trong router, `VibeApp.openCreateForumPostModal()`/`VibeApp.deleteForumPostAction()` trong HTML profile).
- **Wave 3 - adminConsole.js** (~1.97k dòng verbatim từ app.js: VIEW 8 Tổng quan + VIEW 9 Payout + VIEW 10 Gian lận + Admin Fast Command Console + `renderAdminSubNav`; app.js giữ lại marker "QUẢN TRỊ ... ĐÃ TÁCH RA" và tiện ích dùng chung `getLucideSvg`, `escapeHtml` alias).
- **Wave 2 - wallet-ledger.js** (~1.3k dòng verbatim từ app.js: ví + payout + swap + deposit VietQR; app.js giữ lại comment marker "VIEW 5 ... ĐÃ TÁCH RA").

Follow-up đã ghi nhận (không làm trong Wave 1 để giữ diff tối thiểu):
- Thay dần **84 chỗ** `.toLocaleString('vi-VN')` bằng `VibeUtils.formatVND(...)`.
- Thay dần **66 chỗ** `window.lucide.createIcons()` bằng `VibeUtils.refreshIcons()`.
- KPI đích: `public/app.js` còn **~4.000 dòng** (hiện ~13.0k sau Wave 5; ~14.7k sau Wave 4, ~16.4k sau Wave 3, ~18.4k sau Wave 2, 19.7k sau Wave 1, 20.6k ban đầu).
- Android/Capacitor: QA đồng bộ assets sau khi toàn bộ wave xong (`npm run sync:android`).
- Backup an toàn: `backups/backup_pre_modular_20261103-025845/` (md5 app.js gốc khớp 100% trước khi tách); `backups/app.js.wave4_pre_forum_split.bak` (ảnh chụp ngay trước Wave 4, dùng để diff verbatim hai khối forum); `backups/app.js.wave5_pre_modalsTerms_split.bak` (ảnh chụp ngay trước Wave 5, dùng để diff verbatim 3 khối auth/fallback/tiện ích).
