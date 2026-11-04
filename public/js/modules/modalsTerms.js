/**
 * VibeSurvey - Modals Terms Module (WAVE 5 MODULAR)
 * Gom cac doan tu public/app.js (di chuyen nguyen van, khong doi hanh vi):
 * (a) Phan doan AUTH MODAL + GOOGLE AUTH + DIEU KHOAN + STREAK (tuan tu banner
 *     "AUTHENTICATION MODAL" den truoc renderNavigation): openAuthModal, switchAuthTab,
 *     getAuthFormHtml, selectRegisterRole, togglePasswordVisibility, handleLoginSubmit,
 *     cooldown OTP dang ky (_startRegOtpCooldown, _updateRegOtpBtnState, sendRegistrationOtp),
 *     handleRegisterSubmit, loginWithGoogleQuick, linkGoogleAccount, showGoogleConfigGuideModal,
 *     openGoogleAuthPopup, closeGoogleAuthModal, toggleGoogleDropdown, switchGoogleAccount,
 *     promptCustomGoogleAccount, submitGoogleConsent, handleTermsCheckboxChange, openTermsModal,
 *     closeTermsModal, acceptTermsFromModal, STREAK diem danh nhan thuong (fetchStreakInfo,
 *     updateStreakHeaderUI, openStreakModal, performCheckin - nam long giua cum auth modal trong
 *     app.js nen di chuyen cung khoi theo phan dinh WAVE 5), verifyEmailAccount,
 *     openEmailVerificationModal, handleEmailOtpSubmit, openSurveyPreviewModal,
 *     renderGuestLockedView.
 * (b) fallbackCopyText (sao chep du phong khi clipboard API khong kha dung).
 * (c) TIEN ICH UI DUNG CHUNG TOAN HE: showToast, showModal, closeModal, copyValue.
 * Cac phu thuoc goi qua this.* (api, state, haptic, applyUserInterface, isEnterpriseUser,
 * renderSurveysView, renderUserProfileDropdown, startSurveySession) deu late-binding qua
 * window.VibeApp nen van hoat dong dung sau khi Object.assign.
 * Luu y: showToast/showModal/closeModal/copyValue la tien ich dung chung toan he; cac module
 * khac chi goi chung ben trong ham (khong co goi top-level luc khoi tao) nen nap modalsTerms.js
 * truoc app.js la du an toan.
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * @namespace window.VibeApp
 * @requires window.VibeApp (core: api, state, haptic, applyUserInterface, isEnterpriseUser,
 *           renderSurveysView, renderUserProfileDropdown, startSurveySession), lucide (global),
 *           DOM: modal-container, modal-card, toast-container, google-oauth-modal (index.html)
 * @exports openAuthModal, switchAuthTab, getAuthFormHtml, selectRegisterRole, togglePasswordVisibility,
 *          handleLoginSubmit, _startRegOtpCooldown, _updateRegOtpBtnState, sendRegistrationOtp,
 *          handleRegisterSubmit, loginWithGoogleQuick, linkGoogleAccount, showGoogleConfigGuideModal,
 *          openGoogleAuthPopup, closeGoogleAuthModal, toggleGoogleDropdown, switchGoogleAccount,
 *          promptCustomGoogleAccount, submitGoogleConsent, handleTermsCheckboxChange, openTermsModal,
 *          closeTermsModal, acceptTermsFromModal, fetchStreakInfo, updateStreakHeaderUI, openStreakModal,
 *          performCheckin, verifyEmailAccount, openEmailVerificationModal, handleEmailOtpSubmit,
 *          openSurveyPreviewModal, renderGuestLockedView, fallbackCopyText, showToast, showModal,
 *          closeModal, copyValue
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const ModalsTermsModule = {
  // ==================== AUTHENTICATION MODAL ====================
  openAuthModal(initialTab = 'login') {
    this.haptic('light');
    const container = document.getElementById('modal-container');
    const card = document.getElementById('modal-card');
    if (!container || !card) return;

    this._activeAuthTab = initialTab;

    // Responsive: Tab đăng ký có nhiều trường hơn nên mở rộng chiều ngang (max-w-2xl) trên màn hình md trở lên
    const cardMaxWidth = initialTab === 'register' ? 'max-w-2xl' : 'max-w-lg';
    card.className = `bg-white dark:bg-[#18181B] text-slate-800 dark:text-stone-100 rounded-2xl ${cardMaxWidth} w-full p-6 sm:p-7 shadow-2xl border border-stone-100 dark:border-stone-800 transform transition-all relative max-h-[92vh] overflow-y-auto`;

    const logoSrc = document.documentElement.classList.contains('dark') ? '/logo-dark.svg' : '/logo-light.svg';

    card.innerHTML = `
      <div class="relative">
        <!-- Close Button -->
        <button onclick="VibeApp.closeModal()" class="absolute -top-1 -right-1 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <i data-lucide="x" class="w-4 h-4 stroke-[2.2]"></i>
        </button>

        <!-- Brand Header -->
        <div class="text-center pb-5 pt-1">
          <div class="inline-flex w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-sm mb-3">
            <img id="auth-modal-logo" src="${logoSrc}" alt="SurvHub Logo" class="w-12 h-12 rounded-2xl object-contain">
          </div>
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Chào Mừng Đến SurvHub</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Nền tảng nghiên cứu & khảo sát trực tuyến hàng đầu</p>
        </div>

        <!-- Auth Tabs Switcher -->
        <div class="flex items-center p-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl mb-5">
          <button id="auth-tab-btn-login" onclick="VibeApp.switchAuthTab('login')" class="flex-1 py-2 text-xs font-bold rounded-lg transition-all ${initialTab === 'login' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-500 shadow-xs border border-stone-200 dark:border-stone-700' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-transparent'}">
            Đăng Nhập
          </button>
          <button id="auth-tab-btn-register" onclick="VibeApp.switchAuthTab('register')" class="flex-1 py-2 text-xs font-bold rounded-lg transition-all ${initialTab === 'register' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-500 shadow-xs border border-stone-200 dark:border-stone-700' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-transparent'}">
            Đăng Ký Tài Khoản
          </button>
        </div>

        <!-- Error Message Alert -->
        <div id="auth-error-alert" class="hidden mb-4 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/80 text-orange-700 dark:text-orange-300 text-xs font-semibold flex items-center gap-2">
          <i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0"></i>
          <span id="auth-error-text">Lỗi đăng nhập</span>
        </div>

        <!-- Form Container -->
        <div id="auth-form-body">
          ${this.getAuthFormHtml(initialTab)}
        </div>
      </div>
    `;

    container.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  switchAuthTab(tab) {
    this.haptic('light');
    this._activeAuthTab = tab;
    const card = document.getElementById('modal-card');
    const loginBtn = document.getElementById('auth-tab-btn-login');
    const regBtn = document.getElementById('auth-tab-btn-register');
    const formBody = document.getElementById('auth-form-body');
    const errorAlert = document.getElementById('auth-error-alert');

    if (errorAlert) errorAlert.classList.add('hidden');

    // Chuyển đổi độ rộng modal tương ứng với số lượng trường
    if (card) {
      const cardMaxWidth = tab === 'register' ? 'max-w-2xl' : 'max-w-lg';
      card.className = `bg-white dark:bg-[#131B2E] text-slate-800 dark:text-slate-100 rounded-3xl ${cardMaxWidth} w-full p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 transform transition-all relative max-h-[92vh] overflow-y-auto`;
    }

    const activeTabCls = 'flex-1 py-2 text-xs font-bold rounded-lg transition-all bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-500 shadow-xs border border-stone-200 dark:border-stone-700';
    const inactiveTabCls = 'flex-1 py-2 text-xs font-bold rounded-lg transition-all text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-transparent';

    if (tab === 'login') {
      loginBtn.className = activeTabCls;
      regBtn.className = inactiveTabCls;
    } else {
      regBtn.className = activeTabCls;
      loginBtn.className = inactiveTabCls;
    }

    if (formBody) {
      formBody.innerHTML = this.getAuthFormHtml(tab);
      if (window.lucide) window.lucide.createIcons();
      if (tab === 'register') {
        this._updateRegOtpBtnState();
      }
    }
  },

  getAuthFormHtml(tab) {
    if (tab === 'login') {
      return `
        <form onsubmit="VibeApp.handleLoginSubmit(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email tài khoản</label>
            <div class="relative">
              <i data-lucide="mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input type="email" id="auth-email" required placeholder="nhap-email@gmail.com" 
                     class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all">
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-slate-700 dark:text-slate-300">Mật khẩu</label>
            </div>
            <div class="relative">
              <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input type="password" id="auth-password" required placeholder="Nhập mật khẩu của bạn" 
                     class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all">
              <button type="button" onclick="VibeApp.togglePasswordVisibility('auth-password')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <button type="submit" id="auth-submit-btn" class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="log-in" class="w-4 h-4"></i>
            Đăng Nhập
          </button>

          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
            <div class="relative flex justify-center text-[11px]"><span class="px-2 bg-white dark:bg-[#131B2E] text-slate-400">hoặc</span></div>
          </div>

          <button type="button" onclick="VibeApp.loginWithGoogleQuick()" class="w-full py-2.5 border border-slate-200/90 dark:border-slate-700/90 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Đăng nhập nhanh với Google
          </button>
        </form>
      `;
    } else {
      return `
        <form onsubmit="VibeApp.handleRegisterSubmit(event)" class="space-y-3.5">
          <!-- Bố cục 2 cột trên màn hình md trở lên -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <!-- Cột 1: Thông tin cơ bản -->
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Họ và Tên</label>
                <div class="relative">
                  <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input type="text" id="auth-reg-name" required placeholder="Nguyễn Văn A" 
                         class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <div class="relative">
                  <i data-lucide="mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input type="email" id="auth-reg-email" required placeholder="nhap-email@gmail.com" 
                         class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
                <div class="relative">
                  <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input type="password" id="auth-reg-password" required minlength="6" placeholder="Tối thiểu 6 ký tự" 
                         class="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all">
                  <button type="button" onclick="VibeApp.togglePasswordVisibility('auth-reg-password')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Cột 2: Xác thực OTP & Diện tài khoản -->
            <div class="space-y-3">
              <!-- Mã xác thực Email OTP (Gửi qua Brevo) -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Xác thực Email (OTP 6 số)</label>
                  <button type="button" id="btn-send-reg-otp" onclick="VibeApp.sendRegistrationOtp()" class="text-[11px] font-bold text-orange-600 dark:text-orange-500 hover:underline flex items-center gap-1">
                    <i data-lucide="send" class="w-3 h-3"></i>
                    <span id="reg-otp-btn-text">Gửi mã</span>
                  </button>
                </div>
                <div class="relative">
                  <i data-lucide="shield-check" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input type="text" id="auth-reg-otp" required maxlength="6" pattern="[0-9]{6}" placeholder="Nhập mã OTP 6 số bắt buộc..." 
                         class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono font-bold tracking-widest text-slate-900 dark:text-white placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all">
                </div>
                <p class="text-[10px] text-slate-400 mt-1">Bấm <strong>"Gửi mã"</strong> để nhận mã OTP qua hòm thư.</p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Diện tài khoản</label>
                <div class="grid grid-cols-2 gap-2.5">
                  <label class="relative flex flex-col p-2.5 rounded-xl border-2 border-orange-500 bg-orange-50/60 dark:bg-stone-900 cursor-pointer transition-all role-select-card" id="role-card-respondent">
                    <input type="radio" name="auth-reg-role" value="RESPONDENT" checked class="sr-only" onchange="VibeApp.selectRegisterRole('RESPONDENT')">
                    <span class="text-xs font-bold text-orange-600 dark:text-orange-500 flex items-center gap-1.5" id="role-title-respondent">
                      <i data-lucide="user-check" class="w-3.5 h-3.5"></i> Cá Nhân
                    </span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Làm khảo sát nhận thưởng</span>
                  </label>
                  <label class="relative flex flex-col p-2.5 rounded-xl border-2 border-slate-200 dark:border-stone-700 hover:border-slate-300 dark:hover:border-stone-600 bg-white/50 dark:bg-stone-800/40 cursor-pointer transition-all role-select-card" id="role-card-creator">
                    <input type="radio" name="auth-reg-role" value="CREATOR" class="sr-only" onchange="VibeApp.selectRegisterRole('CREATOR')">
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5" id="role-title-creator">
                      <i data-lucide="building-2" class="w-3.5 h-3.5"></i> Doanh Nghiệp
                    </span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Tạo & nghiên cứu khảo sát</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Free Trial Perk Notice -->
          <div class="p-2.5 rounded-xl bg-orange-50/50 dark:bg-stone-900 border border-orange-200 dark:border-stone-700 text-xs text-orange-950 dark:text-orange-200 flex items-center gap-2">
            <i data-lucide="gift" class="w-4 h-4 text-orange-600 shrink-0"></i>
            <div class="leading-relaxed">
              <span class="font-bold">Ưu đãi tài khoản mới:</span> Tặng ngay <strong>25 lượt tạo khảo sát miễn phí</strong> (trị giá 50.000 VNĐ)!
            </div>
          </div>

          <!-- Quy tắc, Điều khoản & Đồng ý dữ liệu cá nhân (tách riêng từng mục đích) -->
          <div class="space-y-2">
            <div class="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 transition-all" id="auth-reg-terms-wrapper">
              <label class="flex items-start gap-2.5 cursor-pointer select-none group">
                <input type="checkbox" id="auth-reg-terms" required class="mt-0.5 w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600 shrink-0" onchange="VibeApp.handleTermsCheckboxChange(this.checked)">
                <span class="text-[11px] leading-snug text-stone-600 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
                  Tôi đã đọc, hiểu và đồng ý với
                  <a href="javascript:void(0)" onclick="VibeApp.openTermsModal(event, false, 'terms')" class="font-bold text-orange-600 dark:text-orange-500 hover:underline">Điều khoản dịch vụ</a>
                  và
                  <a href="javascript:void(0)" onclick="VibeApp.openTermsModal(event, false, 'rules')" class="font-bold text-orange-600 dark:text-orange-500 hover:underline">Quy chế hoạt động</a>.
                  Tôi xác nhận mình từ đủ 18 tuổi, hoặc nếu dưới 18 tuổi thì đã có sự đồng ý của cha, mẹ hoặc người đại diện theo pháp luật.
                </span>
              </label>
            </div>

            <div class="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 transition-all" id="auth-reg-privacy-wrapper">
              <label class="flex items-start gap-2.5 cursor-pointer select-none group">
                <input type="checkbox" id="auth-reg-privacy" required class="mt-0.5 w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600 shrink-0">
                <span class="text-[11px] leading-snug text-stone-600 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
                  Tôi đồng ý để SurvHub xử lý dữ liệu cá nhân của mình, bao gồm dữ liệu cá nhân nhạy cảm nếu tôi tự nguyện cung cấp, theo
                  <a href="javascript:void(0)" onclick="VibeApp.openTermsModal(event, false, 'privacy')" class="font-bold text-orange-600 dark:text-orange-500 hover:underline">Chính sách bảo vệ dữ liệu cá nhân</a>.
                  Tôi hiểu rằng mình có thể rút lại sự đồng ý bất kỳ lúc nào.
                </span>
              </label>
            </div>
          </div>

          <button type="submit" id="auth-submit-btn" class="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            Tạo Tài Khoản & Bắt Đầu
          </button>
        </form>
      `;
    }
  },

  _renderLoginChallenge(response, email, password) {
    const formBody = document.getElementById('auth-form-body');
    const errorAlert = document.getElementById('auth-error-alert');
    if (!formBody) return;

    this._loginChallenge = {
      challengeId: response.challengeId,
      maskedEmail: response.maskedEmail || '',
      verifyEndpoint: response.verifyEndpoint || '/auth/login/verify-otp',
      resendEndpoint: response.resendEndpoint || '/auth/login/resend-otp',
      requiresTotp: Boolean(response.requiresTotp),
      email,
      password
    };
    if (errorAlert) errorAlert.classList.add('hidden');

    const challenge = this._loginChallenge;
    formBody.innerHTML = `
      <form onsubmit="VibeApp.verifyLoginOtp(event)" class="space-y-4" novalidate>
        <div class="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/70 text-orange-800 dark:text-orange-200 text-xs leading-relaxed" role="status">
          ${challenge.requiresTotp
            ? 'Nhập mã 6 số từ ứng dụng xác thực để hoàn tất đăng nhập.'
            : `Mã xác thực đã được gửi đến <strong>${this._escapeAuthHtml(challenge.maskedEmail || 'email của bạn')}</strong>.`}
        </div>
        <div>
          <label for="auth-login-otp" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            ${challenge.requiresTotp ? 'Mã authenticator (6 số)' : 'Mã OTP (6 số)'}
          </label>
          <input type="text" id="auth-login-otp" inputmode="numeric" autocomplete="one-time-code"
                 maxlength="6" pattern="[0-9]{6}" required autofocus
                 aria-describedby="auth-login-otp-help"
                 placeholder="Nhập 6 chữ số"
                 class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-center text-lg font-mono font-bold tracking-[0.35em] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all">
          <p id="auth-login-otp-help" class="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
            Mã chỉ gồm 6 chữ số. Không chia sẻ mã này với người khác.
          </p>
        </div>
        <button type="submit" id="auth-login-otp-submit" class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2">
          <i data-lucide="shield-check" class="w-4 h-4"></i> Xác minh và đăng nhập
        </button>
        <div class="flex items-center justify-between gap-3 text-[11px]">
          <button type="button" id="btn-resend-login-otp" onclick="VibeApp.resendLoginOtp()" class="font-bold text-orange-600 dark:text-orange-500 hover:underline">
            <span id="login-otp-resend-text">Gửi lại mã</span>
          </button>
          <button type="button" onclick="VibeApp.cancelLoginChallenge()" class="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
            Quay lại đăng nhập
          </button>
        </div>
      </form>
    `;
    if (window.lucide) window.lucide.createIcons();
    this._startLoginOtpCooldown(Number(response.resendAfter || 60));
    document.getElementById('auth-login-otp')?.focus();
  },

  _escapeAuthHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  },

  _showLoginChallengeError(message) {
    const errorAlert = document.getElementById('auth-error-alert');
    const errorText = document.getElementById('auth-error-text');
    if (errorAlert && errorText) {
      errorText.textContent = message;
      errorAlert.classList.remove('hidden');
    }
  },

  _startLoginOtpCooldown(seconds = 60) {
    if (this._loginOtpTimer) clearInterval(this._loginOtpTimer);
    this._loginOtpCooldownEndTime = Date.now() + Math.max(0, seconds) * 1000;
    this._updateLoginOtpCooldown();
    this._loginOtpTimer = setInterval(() => {
      this._updateLoginOtpCooldown();
      if (Date.now() >= this._loginOtpCooldownEndTime) {
        clearInterval(this._loginOtpTimer);
        this._loginOtpTimer = null;
      }
    }, 1000);
  },

  _updateLoginOtpCooldown() {
    const button = document.getElementById('btn-resend-login-otp');
    const text = document.getElementById('login-otp-resend-text');
    if (!button || !text) return;
    const remaining = Math.max(0, Math.ceil((this._loginOtpCooldownEndTime - Date.now()) / 1000));
    button.disabled = remaining > 0;
    button.classList.toggle('opacity-50', remaining > 0);
    button.classList.toggle('cursor-not-allowed', remaining > 0);
    text.textContent = remaining > 0 ? `Gửi lại mã (${remaining}s)` : 'Gửi lại mã';
  },

  async resendLoginOtp() {
    const challenge = this._loginChallenge;
    if (!challenge || Date.now() < this._loginOtpCooldownEndTime) return;
    const button = document.getElementById('btn-resend-login-otp');
    if (button) button.disabled = true;
    try {
      const response = await this.api(challenge.resendEndpoint, {
        method: 'POST',
        body: JSON.stringify({ challengeId: challenge.challengeId, email: challenge.email })
      });
      if (response.challengeId) challenge.challengeId = response.challengeId;
      if (response.maskedEmail) challenge.maskedEmail = response.maskedEmail;
      this._startLoginOtpCooldown(Number(response.resendAfter || 60));
      this._showLoginChallengeError('');
      document.getElementById('auth-error-alert')?.classList.add('hidden');
      this.showToast('Mã xác thực mới đã được gửi.', 'success');
    } catch (error) {
      this._showLoginChallengeError(error.message || 'Không thể gửi lại mã xác thực. Vui lòng thử lại sau.');
      if (button) button.disabled = false;
    }
  },

  cancelLoginChallenge() {
    if (this._loginOtpTimer) clearInterval(this._loginOtpTimer);
    this._loginOtpTimer = null;
    this._loginChallenge = null;
    const formBody = document.getElementById('auth-form-body');
    if (formBody) {
      formBody.innerHTML = this.getAuthFormHtml('login');
      if (window.lucide) window.lucide.createIcons();
    }
  },

  async verifyLoginOtp(event) {
    if (event) event.preventDefault();
    const challenge = this._loginChallenge;
    const otpInput = document.getElementById('auth-login-otp');
    const submitButton = document.getElementById('auth-login-otp-submit');
    const otp = otpInput?.value.trim();
    if (!challenge || !/^\d{6}$/.test(otp || '')) {
      this._showLoginChallengeError('Vui lòng nhập đúng mã gồm 6 chữ số.');
      otpInput?.focus();
      return;
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Đang xác minh...';
    }
    try {
      const response = await this.api(challenge.verifyEndpoint, {
        method: 'POST',
        body: JSON.stringify({ challengeId: challenge.challengeId, otp, code: otp })
      });
      if (!response.success || !response.token) throw new Error(response.message || 'Mã xác thực không hợp lệ.');
      this._completeLogin(response);
    } catch (error) {
      const message = error.message || 'Mã xác thực không hợp lệ.';
      const errorCode = String(error.code || error.data?.code || error.data?.error || '').toUpperCase();
      this._showLoginChallengeError(/expired|hết hạn|EXPIRED/i.test(message) || errorCode.includes('EXPIRED')
        ? 'Mã xác thực đã hết hạn. Vui lòng gửi lại mã.'
        : /too many|quá nhiều|attempt/i.test(message) || errorCode.includes('TOO_MANY') || errorCode.includes('ATTEMPTS')
          ? 'Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã hoặc thử lại sau.'
          : message);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i data-lucide="shield-check" class="w-4 h-4"></i> Xác minh và đăng nhập';
        if (window.lucide) window.lucide.createIcons();
      }
      otpInput?.focus();
    }
  },

  _completeLogin(response) {
    this.state.token = response.token;
    this.state.currentUser = response.user;
    localStorage.setItem('survhub_token', response.token);
    localStorage.setItem('survhub_cached_user', JSON.stringify(response.user));
    localStorage.setItem('vibesurvey_cached_user', JSON.stringify(response.user));
    this._loginChallenge = null;
    this.closeModal();
    this.showToast(`Chào mừng ${response.user.name}! Đăng nhập thành công.`, 'success');
    this.applyUserInterface();
    if (this.state.pendingSurveyId) {
      const pendingId = this.state.pendingSurveyId;
      this.state.pendingSurveyId = null;
      setTimeout(() => this.startSurveySession(pendingId), 350);
    }
  },

  selectRegisterRole(role) {
    const cardResp = document.getElementById('role-card-respondent');
    const cardCreator = document.getElementById('role-card-creator');
    const titleResp = document.getElementById('role-title-respondent');
    const titleCreator = document.getElementById('role-title-creator');
    if (!cardResp || !cardCreator) return;

    const activeCardClass = 'relative flex flex-col p-2.5 rounded-xl border-2 border-orange-500 dark:border-orange-500 bg-orange-50/60 dark:bg-stone-800/60 cursor-pointer transition-all role-select-card';
    const inactiveCardClass = 'relative flex flex-col p-2.5 rounded-xl border-2 border-slate-200 dark:border-stone-700 hover:border-slate-300 dark:hover:border-stone-600 bg-white/50 dark:bg-stone-800/30 cursor-pointer transition-all role-select-card';

    if (role === 'RESPONDENT') {
      cardResp.className = activeCardClass;
      cardCreator.className = inactiveCardClass;
      if (titleResp) titleResp.className = 'text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5';
      if (titleCreator) titleCreator.className = 'text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5';
    } else {
      cardCreator.className = activeCardClass;
      cardResp.className = inactiveCardClass;
      if (titleCreator) titleCreator.className = 'text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5';
      if (titleResp) titleResp.className = 'text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5';
    }
    if (window.lucide) window.lucide.createIcons();
  },

  togglePasswordVisibility(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
  },

  async handleLoginSubmit(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('auth-email')?.value.trim();
    const password = document.getElementById('auth-password')?.value;
    const errorAlert = document.getElementById('auth-error-alert');
    const errorText = document.getElementById('auth-error-text');
    const submitBtn = document.getElementById('auth-submit-btn');

    if (!email || !password) {
      if (errorAlert && errorText) {
        errorText.textContent = 'Vui lòng nhập đầy đủ email và mật khẩu';
        errorAlert.classList.remove('hidden');
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Đang đăng nhập...';
    }

    try {
      const res = await this.api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if ((res.requiresOtp || res.requiresTotp) && res.challengeId) {
        this._renderLoginChallenge(res, email, password);
      } else if (res.success && res.token) {
          this._completeLogin(res);
      } else {
        throw new Error(res.message || 'Phản hồi đăng nhập không hợp lệ.');
      }
    } catch (err) {
      if (errorAlert && errorText) {
        errorText.textContent = err.message || 'Email hoặc mật khẩu không chính xác';
        errorAlert.classList.remove('hidden');
      }
      this.showToast(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="log-in" class="w-4 h-4"></i> Đăng Nhập';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  _startRegOtpCooldown(seconds = 60) {
    if (this._regOtpTimer) clearInterval(this._regOtpTimer);
    this._regOtpCooldownEndTime = Date.now() + seconds * 1000;
    this._updateRegOtpBtnState();
    this._regOtpTimer = setInterval(() => {
      const remaining = Math.ceil((this._regOtpCooldownEndTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(this._regOtpTimer);
        this._regOtpTimer = null;
        this._regOtpCooldownEndTime = 0;
      }
      this._updateRegOtpBtnState();
    }, 1000);
  },

  _updateRegOtpBtnState() {
    const btn = document.getElementById('btn-send-reg-otp');
    const btnText = document.getElementById('reg-otp-btn-text');
    if (!btn || !btnText) return;

    if (this._regOtpCooldownEndTime && Date.now() < this._regOtpCooldownEndTime) {
      const secondsLeft = Math.ceil((this._regOtpCooldownEndTime - Date.now()) / 1000);
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
      btnText.textContent = `Gửi lại (${secondsLeft}s)`;
    } else {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
      btnText.textContent = this._regOtpCooldownEndTime === 0 ? 'Gửi lại mã OTP' : 'Gửi mã';
    }
  },

  async sendRegistrationOtp() {
    this.haptic('light');
    const email = document.getElementById('auth-reg-email')?.value?.trim();
    const name = document.getElementById('auth-reg-name')?.value?.trim();
    const btn = document.getElementById('btn-send-reg-otp');
    const btnText = document.getElementById('reg-otp-btn-text');
    const errorAlert = document.getElementById('auth-error-alert');
    const errorText = document.getElementById('auth-error-text');

    // Kiểm tra cooldown ở client
    if (this._regOtpCooldownEndTime && Date.now() < this._regOtpCooldownEndTime) {
      const wait = Math.ceil((this._regOtpCooldownEndTime - Date.now()) / 1000);
      this.showToast(`Vui lòng đợi thêm ${wait}s trước khi gửi lại`, 'warning');
      return;
    }

    if (!email || !email.includes('@')) {
      if (errorAlert && errorText) {
        errorText.textContent = 'Vui lòng nhập địa chỉ email hợp lệ trước khi bấm gửi mã';
        errorAlert.classList.remove('hidden');
      }
      this.showToast('Vui lòng nhập địa chỉ email hợp lệ', 'warning');
      return;
    }

    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = 'Đang gửi mã...';

    try {
      const res = await this.api('/auth/send-registration-otp', {
        method: 'POST',
        body: JSON.stringify({ email, name })
      });

      if (res.success) {
        this.showToast(res.message || 'Mã xác thực 6 số đã được gửi vào email!', 'success');
        if (errorAlert) errorAlert.classList.add('hidden');

        // Kích hoạt bộ đếm ngược 60s có thể duy trì cả khi chuyển tab
        this._startRegOtpCooldown(60);

        // Focus vào ô OTP
        const otpInput = document.getElementById('auth-reg-otp');
        if (otpInput) otpInput.focus();
      }
    } catch (err) {
      if (errorAlert && errorText) {
        errorText.textContent = err.message || 'Không thể gửi mã xác thực';
        errorAlert.classList.remove('hidden');
      }
      this.showToast(err.message, 'error');

      // Nếu server trả về 429 Too Many Requests kèm retryAfter
      if (err.status === 429 || (err.message && err.message.includes('đợi thêm'))) {
        const match = err.message && err.message.match(/(\d+)\s*giây/);
        const retrySec = match ? parseInt(match[1], 10) : 60;
        this._startRegOtpCooldown(retrySec);
      } else {
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = 'Gửi mã qua Email';
      }
    }
  },

  async handleRegisterSubmit(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('auth-reg-name')?.value.trim();
    const email = document.getElementById('auth-reg-email')?.value.trim();
    const password = document.getElementById('auth-reg-password')?.value;
    const errorAlert = document.getElementById('auth-error-alert');
    const errorText = document.getElementById('auth-error-text');
    const submitBtn = document.getElementById('auth-submit-btn');

    if (!name || !email || !password) {
      if (errorAlert && errorText) {
        errorText.textContent = 'Vui lòng điền đầy đủ họ tên, email và mật khẩu';
        errorAlert.classList.remove('hidden');
      }
      return;
    }

    if (password.length < 6) {
      if (errorAlert && errorText) {
        errorText.textContent = 'Mật khẩu phải có tối thiểu 6 ký tự';
        errorAlert.classList.remove('hidden');
      }
      return;
    }

    const role = document.querySelector('input[name="auth-reg-role"]:checked')?.value || 'RESPONDENT';
    const otp = document.getElementById('auth-reg-otp')?.value?.trim();

    if (!otp) {
      if (errorAlert && errorText) {
        errorText.textContent = 'Vui lòng bấm "Gửi mã" và nhập mã xác thực OTP 6 số để tạo tài khoản';
        errorAlert.classList.remove('hidden');
      }
      const otpInput = document.getElementById('auth-reg-otp');
      if (otpInput) {
        otpInput.focus();
        otpInput.classList.add('ring-2', 'ring-orange-500', 'border-orange-500');
        setTimeout(() => otpInput.classList.remove('ring-2', 'ring-orange-500', 'border-orange-500'), 3000);
      }
      return;
    }

    const termsCheckbox = document.getElementById('auth-reg-terms');
    const privacyCheckbox = document.getElementById('auth-reg-privacy');

    if (termsCheckbox && !termsCheckbox.checked) {
      if (errorAlert && errorText) {
        errorText.textContent = 'Vui lòng đọc và tích chọn đồng ý với Điều khoản dịch vụ và Quy chế hoạt động để tạo tài khoản';
        errorAlert.classList.remove('hidden');
      }
      const termsWrapper = document.getElementById('auth-reg-terms-wrapper');
      if (termsWrapper) {
        termsWrapper.classList.add('border-orange-500', 'bg-orange-50/70', 'dark:bg-orange-950/40');
        setTimeout(() => {
          if (termsWrapper) termsWrapper.classList.remove('border-orange-500', 'bg-orange-50/70', 'dark:bg-orange-950/40');
        }, 3000);
      }
      termsCheckbox.focus();
      return;
    }

    if (privacyCheckbox && !privacyCheckbox.checked) {
      if (errorAlert && errorText) {
        errorText.textContent = 'Vui lòng tích chọn đồng ý để SurvHub xử lý dữ liệu cá nhân theo Chính sách bảo vệ dữ liệu cá nhân';
        errorAlert.classList.remove('hidden');
      }
      const privacyWrapper = document.getElementById('auth-reg-privacy-wrapper');
      if (privacyWrapper) {
        privacyWrapper.classList.add('border-orange-500', 'bg-orange-50/70', 'dark:bg-orange-950/40');
        setTimeout(() => {
          if (privacyWrapper) privacyWrapper.classList.remove('border-orange-500', 'bg-orange-50/70', 'dark:bg-orange-950/40');
        }, 3000);
      }
      privacyCheckbox.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Đang tạo tài khoản...';
    }

    try {
      const res = await this.api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, otp })
      });

      if (res.success) {
        this.state.token = res.token;
        this.state.currentUser = res.user;
        localStorage.setItem('survhub_token', res.token);
        this.closeModal();
        this.showToast(`Chào mừng ${res.user.name}! Đăng ký thành công. Nhận ngay 25 lượt free!`, 'success');
        this.applyUserInterface();

        // Tự động chuyển thẳng vào làm bài nếu đến từ Deep-link Email
        if (this.state.pendingSurveyId) {
          const pendingId = this.state.pendingSurveyId;
          this.state.pendingSurveyId = null;
          setTimeout(() => {
            this.startSurveySession(pendingId);
          }, 350);
        }
      }
    } catch (err) {
      if (errorAlert && errorText) {
        errorText.textContent = err.message || 'Không thể tạo tài khoản';
        errorAlert.classList.remove('hidden');
      }
      this.showToast(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="user-plus" class="w-4 h-4"></i> Tạo Tài Khoản & Bắt Đầu';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  async loginWithGoogleQuick() {
    this.haptic('light');
    // Chuyển hướng trực tiếp tới máy chủ Google OAuth chính thức
    window.location.href = '/api/v1/auth/google?mode=login';
  },

  async linkGoogleAccount() {
    this.haptic('light');
    if (!this.state.currentUser) {
      this.openAuthModal('login');
      return;
    }
    // Chuyển hướng trực tiếp tới máy chủ Google OAuth chính thức
    window.location.href = '/api/v1/auth/google?mode=link';
  },

  showGoogleConfigGuideModal() {
    this.showModal({
      title: 'Thiết Lập Google OAuth 2.0 Client ID',
      content: `
        <div class="space-y-4 text-xs">
          <div class="p-3.5 bg-orange-50 dark:bg-orange-950/40 border border-stone-200 dark:border-stone-700 rounded-2xl flex items-start gap-2.5">
            <i data-lucide="info" class="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"></i>
            <div class="leading-relaxed text-orange-900 dark:text-orange-200">
              Để mở <strong>cửa sổ đăng nhập chính thức từ máy chủ Google (accounts.google.com)</strong> như trong ảnh chụp, hệ thống cần mã <code>GOOGLE_CLIENT_ID</code> từ Google Cloud Console.
            </div>
          </div>

          <div class="space-y-2.5">
            <h4 class="font-extrabold text-slate-900 dark:text-white text-sm">3 Bước Lấy Client ID Nhanh (Hoàn Toàn Miễn Phí):</h4>
            <ol class="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                Truy cập <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="text-orange-600 dark:text-orange-400 font-bold underline">Google Cloud Console Credentials</a>.
              </li>
              <li>
                Bấm <strong>+ CREATE CREDENTIALS</strong> &rarr; Chọn <strong>OAuth client ID</strong> &rarr; Chọn Application type là <strong>Web application</strong>.
              </li>
              <li>
                Điền 2 đường dẫn sau:
                <ul class="list-disc list-inside pl-4 mt-1.5 space-y-1 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  <li>Authorized JavaScript origins: <code class="text-orange-600 dark:text-orange-400">http://localhost:3000</code></li>
                  <li>Authorized redirect URIs: <code class="text-orange-600 dark:text-orange-400">http://localhost:3000/api/v1/auth/google/callback</code></li>
                </ul>
              </li>
            </ol>
          </div>

          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p class="text-slate-500 dark:text-slate-400 mb-2 font-medium">Sau khi tạo, chỉ cần dán vào file <code>.env</code>:</p>
            <div class="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed select-all">
              GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com<br>
              GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button onclick="VibeApp.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs">
              Đóng
            </button>
            <button onclick="VibeApp.openGoogleAuthPopup('AUTH')" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs">
              Mở Hộp Thoại Mô Phỏng
            </button>
          </div>
        </div>
      `
    });
  },

  openGoogleAuthPopup(mode = 'AUTH') {
    this.haptic('light');
    this.state.googleAuthMode = mode;
    this.closeModal(); // Đóng modal auth thông thường nếu có

    const modal = document.getElementById('google-oauth-modal');
    if (!modal) return;

    // Cập nhật tiêu đề theo ngữ cảnh
    const headingEl = document.getElementById('google-dialog-heading');
    if (headingEl) {
      headingEl.textContent = (mode === 'LINK') ? 'Ủy quyền liên kết SurvHub' : 'Đăng nhập vào SurvHub';
    }

    // Chọn mặc định tài khoản Trung Nguyễn Thành giống hệt thiết kế
    this.switchGoogleAccount('trungdzid3@gmail.com', 'Trung Nguyễn Thành', 'T', 'bg-zinc-600');

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeGoogleAuthModal() {
    this.haptic('light');
    const modal = document.getElementById('google-oauth-modal');
    if (modal) modal.classList.add('hidden');
    document.getElementById('google-dropdown-menu')?.classList.add('hidden');
    document.body.style.overflow = '';
  },

  toggleGoogleDropdown() {
    this.haptic('light');
    const menu = document.getElementById('google-dropdown-menu');
    if (menu) menu.classList.toggle('hidden');
  },

  switchGoogleAccount(email, name, initial = 'G', bgClass = 'bg-orange-600') {
    this.haptic('light');
    this.state.selectedGoogleAccount = { email, name, initial, bgClass };

    // Cập nhật Cột Trái (Pill Button)
    const avatarEl = document.getElementById('google-active-avatar');
    if (avatarEl) {
      avatarEl.textContent = initial;
      avatarEl.className = `w-6 h-6 rounded-full ${bgClass} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`;
    }
    const emailEl = document.getElementById('google-active-email');
    if (emailEl) emailEl.textContent = email;

    // Cập nhật Cột Phải (Danh Sách Quyền Hạn)
    const permNameEl = document.getElementById('google-perm-name');
    if (permNameEl) permNameEl.textContent = name;
    const permEmailEl = document.getElementById('google-perm-email');
    if (permEmailEl) permEmailEl.textContent = email;

    // Đóng Dropdown
    document.getElementById('google-dropdown-menu')?.classList.add('hidden');
  },

  promptCustomGoogleAccount() {
    this.haptic('light');
    document.getElementById('google-dropdown-menu')?.classList.add('hidden');

    const customEmail = window.prompt('Nhập địa chỉ email Google của bạn:', '');
    if (!customEmail || !customEmail.trim()) return;

    const email = customEmail.trim().toLowerCase();
    const defaultName = email.split('@')[0];
    const customName = window.prompt('Nhập họ và tên tài khoản Google:', defaultName) || defaultName;
    const initial = (customName.trim()[0] || 'G').toUpperCase();

    this.switchGoogleAccount(email, customName.trim(), initial, 'bg-zinc-600');
  },

  async submitGoogleConsent() {
    this.haptic('medium');
    const selected = this.state.selectedGoogleAccount || {
      email: 'trungdzid3@gmail.com',
      name: 'Trung Nguyễn Thành'
    };
    const { email, name } = selected;
    const mode = this.state.googleAuthMode || 'AUTH';
    const submitBtn = document.getElementById('google-auth-submit-btn');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-2"></span> Đang xác thực...';
    }

    const googleId = '10' + Math.abs(Array.from(email).reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0)).toString().padStart(12, '8');

    try {
      if (mode === 'LINK') {
        const res = await this.api('/auth/link-google', {
          method: 'POST',
          body: JSON.stringify({ google_id: googleId, google_email: email })
        });
        if (res.success) {
          this.closeGoogleAuthModal();
          this.showToast(res.message || 'Đã liên kết tài khoản Google thành công!', 'success');
          if (this.state.currentUser) {
            this.state.currentUser.is_google_linked = 1;
            this.state.currentUser.google_id = googleId;
          }
          this.applyUserInterface();
        }
      } else {
        const res = await this.api('/auth/google-auth', {
          method: 'POST',
          body: JSON.stringify({
            google_id: googleId,
            email,
            name: name || email.split('@')[0],
            role: 'RESPONDENT'
          })
        });
        if (res.success) {
          this.state.token = res.token;
          this.state.currentUser = res.user;
          localStorage.setItem('survhub_token', res.token);
          localStorage.setItem('survhub_cached_user', JSON.stringify(res.user));
          localStorage.setItem('vibesurvey_cached_user', JSON.stringify(res.user));
          this.closeGoogleAuthModal();
          this.showToast(`Chào mừng ${res.user.name}! Đăng nhập Google thành công.`, 'success');
          this.applyUserInterface();

          // Tự động chuyển thẳng vào làm bài nếu đến từ Deep-link Email
          if (this.state.pendingSurveyId) {
            const pendingId = this.state.pendingSurveyId;
            this.state.pendingSurveyId = null;
            setTimeout(() => {
              this.startSurveySession(pendingId);
            }, 350);
          } else {
            this.renderSurveysView(document.getElementById('app-root'));
          }
        }
      }
    } catch (err) {
      this.showToast(err.message || 'Lỗi kết nối xác thực Google', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Tiếp tục</span>';
      }
    }
  },

  handleTermsCheckboxChange(checked) {
    this.haptic('light');
    const errorAlert = document.getElementById('auth-error-alert');
    const errorText = document.getElementById('auth-error-text');
    if (checked && errorAlert && errorText && errorText.textContent.includes('Điều khoản')) {
      errorAlert.classList.add('hidden');
    }
    const termsWrapper = document.getElementById('auth-reg-terms-wrapper');
    if (termsWrapper) {
      if (checked) {
        termsWrapper.classList.add('border-orange-500/40', 'bg-orange-50/40', 'dark:bg-stone-900/80');
      } else {
        termsWrapper.classList.remove('border-orange-500/40', 'bg-orange-50/40', 'dark:bg-stone-900/80');
      }
    }
  },

  openTermsModal(event, isReadOnly = false, initialDocId = 'terms') {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.haptic('light');

    const modal = document.getElementById('terms-modal');
    if (!modal) return;

    const policy = window.SURVHUB_POLICY_DOCS;
    if (!policy || !Array.isArray(policy.docs) || policy.docs.length === 0) {
      this.showToast('Không thể tải văn bản pháp lý. Vui lòng tải lại trang và thử lại.', 'error');
      return;
    }

    const docs = policy.docs;
    const activeDoc = docs.find(d => d.id === initialDocId) || docs[0];
    this._termsReadOnly = Boolean(isReadOnly);
    this._termsActiveDoc = activeDoc.id;

    const tabsHtml = docs.map(doc => {
      const isActive = doc.id === activeDoc.id;
      const stateCls = isActive
        ? 'bg-orange-600 text-white shadow-sm'
        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800';
      return `
        <button type="button"
          onclick="VibeApp.openTermsModal(event, ${isReadOnly ? 'true' : 'false'}, '${doc.id}')"
          class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${stateCls}">
          <i data-lucide="${doc.icon}" class="w-3.5 h-3.5"></i>
          <span>${doc.label}</span>
        </button>`;
    }).join('');

    const sectionsHtml = activeDoc.sections.map(sec => `
      <section class="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2">
        <h4 class="flex items-start gap-2 text-stone-900 dark:text-white font-extrabold text-xs uppercase tracking-wide leading-snug">
          <i data-lucide="${sec.icon}" class="w-4 h-4 text-orange-600 shrink-0 mt-0.5"></i>
          <span>${sec.title}</span>
        </h4>
        <div class="policy-doc-body text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">${sec.html}</div>
      </section>`).join('');

    modal.innerHTML = `
      <div class="bg-white dark:bg-[#18181B] text-slate-900 dark:text-stone-100 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-stone-200 dark:border-stone-800 transform transition-all relative flex flex-col max-h-[94vh]">

        <!-- Header -->
        <div class="flex items-start justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800 flex-shrink-0">
          <div class="space-y-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-400">
                <i data-lucide="shield-check" class="w-3 h-3"></i>
                Văn bản pháp lý
              </span>
              <span class="text-[10px] font-mono font-medium text-stone-400 dark:text-stone-500">v${policy.meta.version}</span>
              <span class="text-[10px] font-medium text-stone-400 dark:text-stone-500">Hiệu lực ${policy.meta.effectiveDate}</span>
            </div>
            <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              ${activeDoc.title}
            </h3>
            <p class="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              ${activeDoc.subtitle}
            </p>
          </div>
          <button onclick="VibeApp.closeTermsModal()" aria-label="Đóng văn bản pháp lý" class="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors -mr-1 -mt-1 shrink-0">
            <i data-lucide="x" class="w-5 h-5 stroke-[2.2]"></i>
          </button>
        </div>

        <!-- Tab chọn văn bản -->
        <div class="flex flex-col sm:flex-row gap-1.5 py-3 flex-shrink-0">
          ${tabsHtml}
        </div>

        <!-- Scrollable Body Content -->
        <div class="flex-1 overflow-y-auto pr-1.5 py-1 space-y-3">
          ${sectionsHtml}
          <div class="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60">
            <p class="text-[11px] text-orange-900 dark:text-orange-200 leading-relaxed">
              <strong>Lưu ý:</strong> Bạn đang đọc phiên bản ${policy.meta.version}, cập nhật ngày ${policy.meta.lastUpdated}. Khi có thay đổi quan trọng, SurvHub thông báo trước ít nhất 07 ngày. Việc tiếp tục sử dụng dịch vụ sau ngày hiệu lực đồng nghĩa bạn chấp nhận văn bản mới.
            </p>
          </div>
        </div>

        ${isReadOnly ? `
        <!-- Footer Actions (che do chi doc) -->
        <div class="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5 flex-shrink-0">
          <button type="button" onclick="VibeApp.closeTermsModal()" class="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold transition-all active:scale-95">
            Đóng
          </button>
        </div>
        ` : `
        <!-- Footer Actions -->
        <div class="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <p class="text-[11px] text-stone-500 dark:text-stone-400 text-center sm:text-left leading-relaxed">
            Bằng việc bấm xác nhận, bạn cam kết đã đọc và tuân thủ Điều khoản dịch vụ, Quy chế hoạt động và Chính sách bảo vệ dữ liệu cá nhân.
          </p>
          <div class="flex items-center gap-2.5 w-full sm:w-auto">
            <button type="button" onclick="VibeApp.closeTermsModal()" class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all active:scale-95">
              Đóng
            </button>
            <button type="button" onclick="VibeApp.acceptTermsFromModal()" class="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5">
              <i data-lucide="check" class="w-4 h-4 stroke-[2.5]"></i>
              <span>Tôi Đồng Ý</span>
            </button>
          </div>
        </div>
        `}

      </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons();
  },

  closeTermsModal() {
    this.haptic('light');
    const modal = document.getElementById('terms-modal');
    if (modal) modal.classList.add('hidden');
    const modalContainer = document.getElementById('modal-container');
    const googleModal = document.getElementById('google-oauth-modal');
    const hasOtherModal = (modalContainer && !modalContainer.classList.contains('hidden')) ||
      (googleModal && !googleModal.classList.contains('hidden'));
    if (!hasOtherModal) {
      document.body.style.overflow = '';
    }
  },

  acceptTermsFromModal() {
    this.haptic('success');
    const activeDoc = this._termsActiveDoc || 'terms';
    this.closeTermsModal();

    if (activeDoc === 'privacy') {
      const privacyCheckbox = document.getElementById('auth-reg-privacy');
      if (privacyCheckbox) {
        privacyCheckbox.checked = true;
        this.showToast('Đã xác nhận đồng ý xử lý dữ liệu cá nhân theo Chính sách bảo vệ dữ liệu cá nhân!', 'success');
      } else {
        this.showToast('Đã ghi nhận bạn đồng ý với Chính sách bảo vệ dữ liệu cá nhân của SurvHub!', 'success');
      }
      return;
    }

    const termsCheckbox = document.getElementById('auth-reg-terms');
    if (termsCheckbox) {
      termsCheckbox.checked = true;
      this.handleTermsCheckboxChange(true);
      this.showToast('Đã xác nhận đồng ý với Điều khoản dịch vụ và Quy chế hoạt động!', 'success');
    } else {
      this.showToast('Đã ghi nhận bạn đồng ý với văn bản pháp lý của SurvHub!', 'success');
    }
  },

  /**
   * Lấy dữ liệu chuỗi điểm danh của người dùng hiện tại
   */
  async fetchStreakInfo() {
    if (!this.state.token) return null;
    try {
      const res = await this.api('/users/streak-info');
      if (res && res.success && res.streak) {
        this.state.streakInfo = res.streak;
        this.updateStreakHeaderUI(res.streak);
        return res.streak;
      }
    } catch (err) {
      console.warn('Không thể nạp thông tin chuỗi ngày:', err.message);
    }
    return null;
  },

  /**
   * Tính toán Cấp bậc và Phong cách Màu sắc TikTok Streak
   * - Level 0: Chuỗi = 0 -> Bạc xám tối giản (Inactive)
   * - Level Risk: Chuỗi >= 1 nhưng Chưa điểm danh hôm nay -> Nguy cơ đứt chuỗi (Than hồng nhấp nháy Amber pulse)
   * - Level 1: Chuỗi 1 - 2 ngày -> Lửa Hổ Phách Khởi Động (Amber Fire)
   * - Level 2: Chuỗi 3 - 6 ngày -> Lửa Đỏ Rực Cháy (Crimson Sunset Flame)
   * - Level 3: Chuỗi 7 - 29 ngày -> Siêu Chuỗi TikTok Neon (Iconic Electric Magenta & Hot Pink Neon)
   * - Level 4: Chuỗi 30 - 99 ngày -> Lửa Băng Điện Quang (Cyber Ice Cyan & Blue)
   * - Level 5: Chuỗi 100+ ngày -> Huyền Thoại Hoàng Kim Thạch Anh (Mythic Prismatic Gold & Violet)
   */
  getStreakTierInfo(streakCount, hasCheckedIn) {
    const count = Number(streakCount) || 0;

    // 1. Chuỗi = 0: Chưa kích hoạt
    if (count <= 0) {
      return {
        id: 'dormant',
        level: 0,
        name: 'Chưa Thắp Lửa',
        shortBadge: 'Chưa Bật Lửa',
        desc: 'Điểm danh để bắt đầu chuỗi ngày nhận thưởng',
        btnClass: 'h-8 flex items-center gap-1.5 px-2.5 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-800/60 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700 transition-all active:scale-95 flex-shrink-0 cursor-pointer select-none text-xs font-mono font-bold',
        flameSvg: '<i data-lucide="flame" class="w-3.5 h-3.5 stroke-[2] text-stone-400 dark:text-stone-500"></i>',
        headerIconClass: 'w-11 h-11 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 flex-shrink-0 shadow-xs',
        headerIconSvg: '<i data-lucide="flame" class="w-6 h-6 stroke-[2.2]"></i>',
        textClass: 'text-stone-400 dark:text-stone-500',
        modalBadge: '<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">Chưa Bật Lửa</span>',
        bentoBorder: 'border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300',
        bentoFlame: '<i data-lucide="flame" class="w-4 h-4 text-stone-400"></i>',
        bentoText: 'text-slate-800 dark:text-stone-200',
        title: 'Điểm danh hàng ngày (Bấm để nhận 50 điểm)'
      };
    }

    // 2. Chuỗi >= 1 nhưng HÔM NAY CHƯA ĐIỂM DANH: Than hồng nhấp nháy, cảnh báo giữ chuỗi
    if (!hasCheckedIn) {
      return {
        id: 'risk',
        level: -1,
        name: 'Nguy Cơ Mất Chuỗi',
        shortBadge: 'Cần Giữ Chuỗi',
        desc: 'Hôm nay chưa điểm danh, chuỗi có nguy cơ bị reset về 0 lúc 00:00',
        btnClass: 'h-8 flex items-center gap-1.5 px-2.5 rounded-full border border-amber-500/90 dark:border-amber-500/90 bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.28)] hover:shadow-[0_0_16px_rgba(245,158,11,0.45)] transition-all active:scale-95 flex-shrink-0 cursor-pointer select-none text-xs font-mono font-black animate-pulse',
        flameSvg: '<i data-lucide="flame" class="w-4 h-4 stroke-[2.4] text-amber-600 dark:text-amber-400 animate-pulse"></i>',
        headerIconClass: 'w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 shadow-xs animate-pulse',
        headerIconSvg: '<i data-lucide="flame" class="w-6 h-6 stroke-[2.2]"></i>',
        textClass: 'text-amber-600 dark:text-amber-400 font-black',
        modalBadge: '<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">Cần Giữ Chuỗi</span>',
        bentoBorder: 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
        bentoFlame: '<i data-lucide="flame" class="w-4 h-4 text-amber-600 animate-pulse"></i>',
        bentoText: 'text-amber-600 dark:text-amber-400',
        title: `Chuỗi: ${count} ngày (Chưa điểm danh hôm nay - Bấm để giữ chuỗi!)`
      };
    }

    // 3. ĐÃ ĐIỂM DANH HÔM NAY - PHÂN CẤP TIKTOK STREAK TIERS:

    // Tier 1: Chuỗi 1 - 10 ngày (Lửa Hổ Phách Khởi Động)
    if (count <= 10) {
      return {
        id: 'amber',
        level: 1,
        name: 'Lửa Khởi Động',
        shortBadge: 'Cấp 1 - Lửa Khởi Động',
        desc: 'Bước đầu tạo thói quen khảo sát liên tiếp (1 - 10 ngày)',
        btnClass: 'h-8 flex items-center gap-1.5 px-2.5 rounded-full border border-amber-400/90 dark:border-amber-500/90 bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-95 flex-shrink-0 cursor-pointer select-none text-xs font-mono font-black',
        flameSvg: '<i data-lucide="flame" class="w-4 h-4 fill-amber-500 text-amber-500 stroke-amber-600 drop-shadow-xs"></i>',
        headerIconClass: 'w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 shadow-xs',
        headerIconSvg: '<i data-lucide="flame" class="w-6 h-6 fill-amber-500 stroke-amber-600"></i>',
        textClass: 'text-amber-600 dark:text-amber-400 font-black',
        modalBadge: '<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80">Cấp 1 - Lửa Khởi Động</span>',
        bentoBorder: 'border-amber-300/80 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20',
        bentoFlame: '<i data-lucide="flame" class="w-4 h-4 fill-amber-500 text-amber-500 stroke-amber-600"></i>',
        bentoText: 'text-amber-600 dark:text-amber-400',
        title: `Chuỗi: ${count} ngày (Lửa Khởi Động - Đã điểm danh)`
      };
    }

    // Tier 2: Chuỗi 11 - 50 ngày (Lửa Đỏ Rực Cháy - Crimson Sunset)
    if (count <= 50) {
      return {
        id: 'crimson',
        level: 2,
        name: 'Lửa Bùng Cháy',
        shortBadge: 'Cấp 2 - Lửa Bùng Cháy',
        desc: 'Chuỗi ngày rực lửa bền bỉ (11 - 50 ngày)',
        btnClass: 'h-8 flex items-center gap-1.5 px-2.5 rounded-full border border-rose-500/90 dark:border-rose-500/90 bg-gradient-to-r from-orange-500/15 via-red-500/15 to-rose-500/15 dark:from-orange-950/40 dark:via-red-950/40 dark:to-rose-950/40 text-rose-600 dark:text-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.32)] hover:shadow-[0_0_18px_rgba(244,63,94,0.48)] transition-all active:scale-95 flex-shrink-0 cursor-pointer select-none text-xs font-mono font-black',
        flameSvg: '<i data-lucide="flame" class="w-4 h-4 fill-rose-500 text-rose-500 stroke-rose-600 drop-shadow-xs"></i>',
        headerIconClass: 'w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0 shadow-xs',
        headerIconSvg: '<i data-lucide="flame" class="w-6 h-6 fill-rose-500 stroke-rose-600"></i>',
        textClass: 'text-rose-600 dark:text-rose-400 font-black',
        modalBadge: '<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/80">Cấp 2 - Lửa Bùng Cháy</span>',
        bentoBorder: 'border-rose-300/80 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20',
        bentoFlame: '<i data-lucide="flame" class="w-4 h-4 fill-rose-500 text-rose-500 stroke-rose-600"></i>',
        bentoText: 'text-rose-600 dark:text-rose-400',
        title: `Chuỗi: ${count} ngày (Lửa Bùng Cháy - Đã điểm danh)`
      };
    }

    // Tier 3: Chuỗi 51 - 100 ngày (Siêu Chuỗi TikTok Neon Tím Hồng - Iconic Magenta & Hot Pink)
    if (count <= 100) {
      return {
        id: 'neon_tiktok',
        level: 3,
        name: 'Hồng Neon Tím TikTok',
        shortBadge: 'Cấp 3 - Hồng Neon Tím',
        desc: 'Hào quang neon rực sáng đặc trưng phong cách TikTok (51 - 100 ngày)',
        btnClass: 'h-8 flex items-center gap-1.5 px-2.5 rounded-full border border-fuchsia-500/90 dark:border-fuchsia-400/90 bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-fuchsia-500/15 dark:from-pink-950/40 dark:via-purple-950/40 dark:to-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-300 shadow-[0_0_16px_rgba(217,70,239,0.4)] hover:shadow-[0_0_22px_rgba(217,70,239,0.6)] transition-all active:scale-95 flex-shrink-0 cursor-pointer select-none text-xs font-mono font-black',
        flameSvg: '<i data-lucide="flame" class="w-4 h-4 fill-fuchsia-500 text-fuchsia-500 stroke-fuchsia-600 drop-shadow-[0_0_6px_rgba(217,70,239,0.6)]"></i>',
        headerIconClass: 'w-11 h-11 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/50 border border-fuchsia-200 dark:border-fuchsia-800 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-300 flex-shrink-0 shadow-[0_0_15px_rgba(217,70,239,0.25)]',
        headerIconSvg: '<i data-lucide="flame" class="w-6 h-6 fill-fuchsia-500 stroke-fuchsia-600 drop-shadow-[0_0_6px_rgba(217,70,239,0.6)]"></i>',
        textClass: 'text-fuchsia-600 dark:text-fuchsia-300 font-black drop-shadow-xs',
        modalBadge: '<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-fuchsia-700 dark:text-fuchsia-200 border border-fuchsia-400/70 dark:border-fuchsia-500/70 shadow-[0_0_10px_rgba(217,70,239,0.25)]">Cấp 3 - Hồng Neon Tím</span>',
        bentoBorder: 'border-fuchsia-400/70 dark:border-fuchsia-700/80 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-fuchsia-500/5 dark:from-pink-950/25 dark:to-purple-950/25',
        bentoFlame: '<i data-lucide="flame" class="w-4 h-4 fill-fuchsia-500 text-fuchsia-500 stroke-fuchsia-600"></i>',
        bentoText: 'text-fuchsia-600 dark:text-fuchsia-300',
        title: `Hồng Neon Tím TikTok: ${count} ngày liên tiếp`
      };
    }

    // Tier 4: Chuỗi 101 - 200 ngày (Lửa Băng Điện Quang - Cyber Ice Blue & Cyan)
    if (count <= 200) {
      return {
        id: 'cyber_cyan',
        level: 4,
        name: 'Băng Hỏa Điện Quang',
        shortBadge: 'Cấp 4 - Băng Hỏa Điện Quang',
        desc: 'Đẳng cấp chuyên gia khảo sát, ngọn lửa xanh lam băng giá siêu hiếm (101 - 200 ngày)',
        btnClass: 'h-8 flex items-center gap-1.5 px-2.5 rounded-full border border-cyan-400/90 dark:border-cyan-400/90 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-teal-500/15 dark:from-cyan-950/40 dark:via-blue-950/40 dark:to-teal-950/40 text-cyan-600 dark:text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.45)] hover:shadow-[0_0_24px_rgba(6,182,212,0.65)] transition-all active:scale-95 flex-shrink-0 cursor-pointer select-none text-xs font-mono font-black',
        flameSvg: '<i data-lucide="flame" class="w-4 h-4 fill-cyan-400 text-cyan-400 stroke-cyan-600 drop-shadow-[0_0_6px_rgba(6,182,212,0.7)]"></i>',
        headerIconClass: 'w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-300 flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
        headerIconSvg: '<i data-lucide="flame" class="w-6 h-6 fill-cyan-400 stroke-cyan-600 drop-shadow-[0_0_6px_rgba(6,182,212,0.7)]"></i>',
        textClass: 'text-cyan-600 dark:text-cyan-300 font-black',
        modalBadge: '<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-700 dark:text-cyan-200 border border-cyan-400/70 dark:border-cyan-500/70 shadow-[0_0_12px_rgba(6,182,212,0.3)]">Cấp 4 - Băng Hỏa Điện Quang</span>',
        bentoBorder: 'border-cyan-400/70 dark:border-cyan-700/80 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 dark:from-cyan-950/25 dark:to-blue-950/25',
        bentoFlame: '<i data-lucide="flame" class="w-4 h-4 fill-cyan-400 text-cyan-400 stroke-cyan-600"></i>',
        bentoText: 'text-cyan-600 dark:text-cyan-300',
        title: `Chuỗi Băng Hỏa Điện Quang: ${count} ngày`
      };
    }

    // Tier 5: Chuỗi 201+ ngày (Thần Thoại Hoàng Kim - Mythic Prismatic Gold & Violet)
    return {
      id: 'mythic_gold',
      level: 5,
      name: 'Thần Thoại Hoàng Kim',
      shortBadge: 'Cấp 5 - Thần Thoại Hoàng Kim',
      desc: 'Cột mốc thần thoại từ 201 ngày trở lên, ngọn lửa vàng thạch anh quý phái nhất sàn',
      btnClass: 'h-8 flex items-center gap-1.5 px-2.5 rounded-full border border-amber-300/95 dark:border-amber-400/95 bg-gradient-to-r from-amber-400/20 via-pink-500/15 to-purple-500/20 dark:from-amber-950/50 dark:via-purple-950/50 dark:to-pink-950/50 text-amber-600 dark:text-amber-300 shadow-[0_0_22px_rgba(245,158,11,0.5)] hover:shadow-[0_0_28px_rgba(245,158,11,0.75)] transition-all active:scale-95 flex-shrink-0 cursor-pointer select-none text-xs font-mono font-black',
      flameSvg: '<i data-lucide="flame" class="w-4 h-4 fill-amber-400 text-amber-400 stroke-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"></i>',
      headerIconClass: 'w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-300 flex-shrink-0 shadow-[0_0_18px_rgba(245,158,11,0.35)]',
      headerIconSvg: '<i data-lucide="flame" class="w-6 h-6 fill-amber-400 stroke-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"></i>',
      textClass: 'text-amber-600 dark:text-amber-300 font-black',
      modalBadge: '<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400/25 via-pink-500/20 to-purple-500/25 text-amber-700 dark:text-amber-200 border border-amber-400/90 shadow-[0_0_15px_rgba(245,158,11,0.4)]">Cấp 5 - Thần Thoại Hoàng Kim</span>',
      bentoBorder: 'border-amber-400/80 dark:border-amber-600 bg-gradient-to-br from-amber-500/10 via-pink-500/5 to-purple-500/10',
      bentoFlame: '<i data-lucide="flame" class="w-4 h-4 fill-amber-400 text-amber-400 stroke-amber-500"></i>',
      bentoText: 'text-amber-600 dark:text-amber-300',
      title: `Chuỗi Thần Thoại Hoàng Kim: ${count} ngày`
    };
  },

  /**
   * Cập nhật hiển thị Widget Streak trên Header (Phong cách TikTok Streak đa tầng màu sắc)
   */
  updateStreakHeaderUI(streak) {
    const streakBtn = document.getElementById('header-streak-btn');
    const streakText = document.getElementById('header-streak-text');
    const streakFlame = document.getElementById('header-streak-flame');
    const streakDot = document.getElementById('header-streak-dot');
    if (!streakBtn || !streakText) return;

    if (!this.state.currentUser) {
      streakBtn.classList.add('hidden');
      streakBtn.classList.remove('flex');
      return;
    }

    streakBtn.classList.remove('hidden');
    streakBtn.classList.add('flex');

    const streakCount = streak ? (streak.current_streak || 0) : 0;
    const hasCheckedIn = streak ? streak.has_checked_in_today : false;

    // Luôn ẩn hoàn toàn chấm đỏ nhấp nháy theo chỉ đạo của người dùng
    if (streakDot) {
      streakDot.classList.add('hidden');
      streakDot.style.display = 'none';
    }

    streakText.textContent = streakCount;

    // Lấy thông tin Visual Tier theo TikTok Streak
    const tierInfo = this.getStreakTierInfo(streakCount, hasCheckedIn);

    // Áp dụng class nút, ngọn lửa và title tooltip
    streakBtn.className = tierInfo.btnClass;
    if (streakFlame) {
      streakFlame.innerHTML = tierInfo.flameSvg;
    }
    streakBtn.title = tierInfo.title;

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Mở Modal Điểm Danh Hàng Ngày & Lộ Trình 7 Ngày (Chuẩn UI/UX Pro Max)
   */
  async openStreakModal() {
    this.haptic('light');
    if (this.isEnterpriseUser()) {
      this.showToast('Chương trình điểm danh nhận thưởng chỉ áp dụng cho Người Điền', 'info');
      return;
    }
    if (!this.state.currentUser) {
      this.openAuthModal('login');
      return;
    }

    const container = document.getElementById('modal-container');
    const card = document.getElementById('modal-card');
    if (!container || !card) return;

    if (!this.state.streakInfo) {
      card.className = 'bg-white dark:bg-[#18181B] text-slate-800 dark:text-stone-100 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-stone-100 dark:border-stone-800 transform transition-all relative text-center py-12';
      card.innerHTML = `
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 dark:border-stone-700 border-t-orange-600 mx-auto mb-3"></div>
        <p class="text-xs text-stone-500 dark:text-stone-400">Đang tải thông tin chuỗi ngày...</p>
      `;
      container.classList.remove('hidden');
      await this.fetchStreakInfo();
    }

    const streak = this.state.streakInfo || {
      current_streak: 0,
      max_streak: 0,
      total_points_earned: 0,
      has_checked_in_today: false,
      today_reward_points: 50,
      roadmap: [
        { day: 1, points: 50, status: 'TODAY', is_milestone: false },
        { day: 2, points: 80, status: 'LOCKED', is_milestone: false },
        { day: 3, points: 120, status: 'LOCKED', is_milestone: false },
        { day: 4, points: 160, status: 'LOCKED', is_milestone: false },
        { day: 5, points: 200, status: 'LOCKED', is_milestone: false },
        { day: 6, points: 250, status: 'LOCKED', is_milestone: false },
        { day: 7, points: 500, status: 'LOCKED', is_milestone: true, badge: 'Badge Tích Cực' }
      ]
    };

    card.className = 'bg-white dark:bg-[#18181B] text-slate-900 dark:text-stone-100 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200/80 dark:border-stone-800 transform transition-all relative max-h-[92vh] overflow-y-auto no-scrollbar';

    const tierInfo = this.getStreakTierInfo(streak.current_streak, streak.has_checked_in_today);

    const roadmapHtml = (streak.roadmap || []).map(r => {
      // 1. Ngày 7: Mốc Vàng Đặc Biệt (Đặt chip bên trong card, tuyệt đối không bị đè chữ)
      if (r.is_milestone) {
        let milestoneClasses = 'border-orange-400/80 bg-gradient-to-b from-orange-50/80 to-orange-50/40 dark:from-orange-950/30 dark:to-orange-950/20 text-orange-700 dark:text-orange-400';
        let iconHtml = '<i data-lucide="crown" class="w-4 h-4 stroke-[2.2] text-orange-600 dark:text-orange-400"></i>';
        let statusText = 'Mốc Vàng';

        if (r.status === 'CLAIMED') {
          milestoneClasses = 'border-orange-300 dark:border-orange-800 bg-orange-50/60 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400';
          iconHtml = '<i data-lucide="check-circle-2" class="w-4 h-4 stroke-[2.5] text-orange-600 dark:text-orange-400"></i>';
          statusText = 'Đã nhận';
        } else if (r.status === 'TODAY') {
          milestoneClasses = 'border-2 border-orange-500 bg-white dark:bg-stone-900 ring-4 ring-orange-500/20 shadow-md text-orange-600 dark:text-orange-400';
          iconHtml = '<i data-lucide="flame" class="w-4 h-4 stroke-[2.5] text-orange-600 animate-pulse"></i>';
          statusText = 'Hôm nay';
        }

        return `
          <div class="flex flex-col items-center justify-between p-2 rounded-2xl border ${milestoneClasses} transition-all relative overflow-hidden group">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-300/60 dark:border-orange-700/60 mb-0.5 whitespace-nowrap">
              Mốc Vàng
            </span>
            <span class="text-[11px] font-bold text-stone-600 dark:text-stone-300">Ngày ${r.day}</span>
            <div class="my-1 flex items-center justify-center">
              ${iconHtml}
            </div>
            <span class="font-mono font-black text-xs text-orange-700 dark:text-orange-300">
              +${r.points}
            </span>
            <span class="text-[9px] font-bold text-orange-600/80 dark:text-orange-400/80 mt-0.5">${statusText}</span>
          </div>
        `;
      }

      // 2. Các ngày 1 - 6
      let statusClasses = 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200/70 dark:border-stone-800 text-stone-400 dark:text-stone-600';
      let iconHtml = '<i data-lucide="lock" class="w-3.5 h-3.5 stroke-[2] text-stone-400/70 dark:text-stone-600"></i>';
      let statusText = 'Khóa';

      if (r.status === 'CLAIMED') {
        statusClasses = 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/80 dark:border-orange-800/60 text-orange-700 dark:text-orange-400';
        iconHtml = '<i data-lucide="check" class="w-3.5 h-3.5 stroke-[2.5] text-orange-600 dark:text-orange-400"></i>';
        statusText = 'Đã nhận';
      } else if (r.status === 'TODAY') {
        statusClasses = 'bg-white dark:bg-stone-900 border-2 border-orange-600 text-orange-600 dark:text-orange-500 shadow-md ring-4 ring-orange-500/15';
        iconHtml = '<i data-lucide="flame" class="w-4 h-4 stroke-[2.2] text-orange-600 animate-pulse"></i>';
        statusText = 'Hôm nay';
      }

      return `
        <div class="flex flex-col items-center justify-between p-2.5 rounded-2xl border ${statusClasses} transition-all">
          <span class="text-[11px] font-bold text-stone-500 dark:text-stone-400">Ngày ${r.day}</span>
          <div class="my-1.5 flex items-center justify-center">
            ${iconHtml}
          </div>
          <span class="font-mono font-black text-xs ${r.status === 'TODAY' ? 'text-orange-600 dark:text-orange-400' : (r.status === 'CLAIMED' ? 'text-orange-700 dark:text-orange-400' : 'text-slate-800 dark:text-stone-200')}">
            +${r.points}
          </span>
          <span class="text-[9px] font-semibold text-stone-400 dark:text-stone-500 mt-0.5">${statusText}</span>
        </div>
      `;
    }).join('');

    // Danh sách 5 Cấp Bậc Ngọn Lửa TikTok Streak để hiển thị bảng vinh danh
    const tiersList = [
      { level: 1, name: 'Khởi Động', range: '1-10 ngày', color: 'text-amber-500', flame: '<i data-lucide="flame" class="w-3 h-3 fill-amber-500 text-amber-500"></i>', border: 'border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20' },
      { level: 2, name: 'Bùng Cháy', range: '11-50 ngày', color: 'text-rose-500', flame: '<i data-lucide="flame" class="w-3 h-3 fill-rose-500 text-rose-500"></i>', border: 'border-rose-300 dark:border-rose-700/80 bg-rose-50/40 dark:bg-rose-950/20' },
      { level: 3, name: 'TikTok Neon', range: '51-100 ngày', color: 'text-fuchsia-500', flame: '<i data-lucide="flame" class="w-3 h-3 fill-fuchsia-500 text-fuchsia-500"></i>', border: 'border-fuchsia-400 dark:border-fuchsia-700/80 bg-fuchsia-50/40 dark:bg-fuchsia-950/20' },
      { level: 4, name: 'Băng Hỏa', range: '101-200 ngày', color: 'text-cyan-500', flame: '<i data-lucide="flame" class="w-3 h-3 fill-cyan-400 text-cyan-400"></i>', border: 'border-cyan-300 dark:border-cyan-700/80 bg-cyan-50/40 dark:bg-cyan-950/20' },
      { level: 5, name: 'Hoàng Kim', range: '201+ ngày', color: 'text-amber-400', flame: '<i data-lucide="flame" class="w-3 h-3 fill-amber-400 text-amber-400"></i>', border: 'border-amber-400 dark:border-amber-600/80 bg-amber-50/50 dark:bg-amber-950/30' }
    ];

    const tiersGuideHtml = tiersList.map(t => {
      const isCurrent = (tierInfo.level === t.level);
      return `
        <div class="flex flex-col items-center justify-between p-1.5 rounded-xl border ${isCurrent ? `${t.border} ring-2 ring-orange-500/30 shadow-xs font-bold` : 'border-stone-200/60 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 opacity-70'} text-center transition-all">
          <div class="flex items-center gap-0.5 my-0.5">
            ${t.flame}
            <span class="text-[10px] ${t.color} font-black">${t.name}</span>
          </div>
          <span class="text-[9px] text-stone-500 dark:text-stone-400 font-mono">${t.range}</span>
          ${isCurrent ? '<span class="text-[8px] font-black uppercase text-orange-600 dark:text-orange-400 mt-0.5">Hiện tại</span>' : ''}
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <div class="relative space-y-5">
        <!-- Close Button -->
        <button onclick="VibeApp.closeModal()" class="absolute -top-1.5 -right-1.5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer" title="Đóng">
          <i data-lucide="x" class="w-4 h-4 stroke-[2.2]"></i>
        </button>

        <!-- Header: Minimalist Modern Gamification -->
        <div class="flex items-center gap-3 pr-8">
          <div class="${tierInfo.headerIconClass}">
            ${tierInfo.headerIconSvg}
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">Điểm Danh Chuỗi Ngày</h3>
              ${tierInfo.modalBadge}
            </div>
            <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">${tierInfo.desc}</p>
          </div>
        </div>

        <!-- 3 Bento Stat Cards (Chuẩn UI/UX Pro Max) -->
        <div class="grid grid-cols-3 gap-2 sm:gap-2.5">
          <!-- Card 1: Chuỗi Hiện Tại (Phản ánh cấp bậc màu sắc) -->
          <div class="p-3 rounded-2xl ${tierInfo.bentoBorder} border transition-all text-center">
            <span class="block text-[11px] font-medium opacity-80">Chuỗi Hiện Tại</span>
            <div class="flex items-center justify-center gap-1.5 mt-0.5">
              ${tierInfo.bentoFlame}
              <span class="font-mono font-black text-lg ${tierInfo.bentoText}">${streak.current_streak}</span>
              <span class="text-xs font-semibold opacity-75">ngày</span>
            </div>
          </div>

          <!-- Card 2: Kỷ Lục -->
          <div class="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 text-center">
            <span class="block text-[11px] text-stone-500 dark:text-stone-400 font-medium">Kỷ Lục Chuỗi</span>
            <div class="flex items-center justify-center gap-1 mt-0.5">
              <i data-lucide="trophy" class="w-4 h-4 text-stone-500"></i>
              <span class="font-mono font-black text-lg text-slate-800 dark:text-stone-200">${streak.max_streak}</span>
              <span class="text-xs font-semibold text-stone-500">ngày</span>
            </div>
          </div>

          <!-- Card 3: Tổng Điểm -->
          <div class="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 text-center">
            <span class="block text-[11px] text-stone-500 dark:text-stone-400 font-medium">Tổng Đã Tích Lũy</span>
            <div class="flex items-center justify-center gap-1 mt-0.5">
              <i data-lucide="coins" class="w-4 h-4 text-orange-600"></i>
              <span class="font-mono font-black text-lg text-orange-600 dark:text-orange-400">+${(streak.total_points_earned || 0).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>

        <!-- Cấp Bậc Ngọn Lửa TikTok Streak (Tier Visual Guide) -->
        <div class="p-3 rounded-2xl bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/70 dark:border-stone-800 space-y-2">
          <div class="flex items-center justify-between text-xs px-0.5">
            <span class="font-bold text-slate-800 dark:text-stone-200 text-[11px] flex items-center gap-1.5">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-orange-500"></i>
              <span>Cấp Bậc Đổi Màu Ngọn Lửa TikTok</span>
            </span>
            <span class="text-[10px] text-stone-500 dark:text-stone-400">Càng duy trì lâu, màu càng ngầu</span>
          </div>
          <div class="grid grid-cols-5 gap-1.5">
            ${tiersGuideHtml}
          </div>
        </div>

        <!-- 7-Day Visual Roadmap (Lộ trình chuẩn 7 ngày) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs px-0.5">
            <span class="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-orange-600"></i>
              <span>Lộ Trình Thưởng 7 Ngày</span>
            </span>
            <span class="text-stone-500 dark:text-stone-400 text-[11px] font-mono font-semibold">Chuỗi 7 ngày = +1.560 Point</span>
          </div>
          <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
            ${roadmapHtml}
          </div>
        </div>

        <!-- Checkin Action Button -->
        <div class="pt-0.5">
          ${!streak.has_checked_in_today ? `
            <button id="streak-modal-action-btn" onclick="VibeApp.performCheckin()" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 via-rose-500 to-orange-600 hover:from-orange-700 hover:to-rose-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="zap" class="w-4 h-4 fill-white"></i>
              <span>Điểm Danh Ngay (+${streak.today_reward_points} Điểm)</span>
            </button>
          ` : `
            <div class="w-full py-3.5 px-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 border border-orange-200 dark:border-orange-800/80">
              <i data-lucide="check-circle" class="w-4 h-4 text-orange-600"></i>
              <span>Đã Điểm Danh Hôm Nay (+${streak.today_reward_points} Điểm vào ví)</span>
            </div>
          `}
        </div>

        <!-- Rules & Guidelines (Tip Card gọn gàng) -->
        <div class="p-3.5 bg-stone-50/70 dark:bg-stone-900/40 rounded-2xl border border-stone-200/70 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 space-y-1.5 leading-relaxed">
          <div class="font-bold text-slate-800 dark:text-stone-200 text-xs flex items-center gap-1.5">
            <i data-lucide="info" class="w-3.5 h-3.5 text-stone-400"></i>
            <span>Quy chế chuỗi điểm danh:</span>
          </div>
          <ul class="space-y-0.5 list-disc pl-4 text-[11px]">
            <li>Thang thưởng: Ngày 1 (+50đ), Ngày 2 (+80đ), Ngày 3 (+120đ), Ngày 4 (+160đ), Ngày 5 (+200đ), Ngày 6 (+250đ).</li>
            <li><span class="font-bold text-orange-600 dark:text-orange-400">Ngày 7 (Mốc Vàng)</span>: Thưởng lớn <span class="font-bold font-mono">+500 Point</span> và mở khóa <span class="font-bold">Badge Tích Cực</span>.</li>
            <li>Duy trì từ Ngày 8 trở đi: Nhận cố định <span class="font-bold font-mono">+200 Point/ngày</span>. Nếu đứt chuỗi 1 ngày, chuỗi quay về Ngày 1.</li>
            <li>Thời gian làm mới: <span class="font-bold">00:00 hàng ngày</span> theo giờ Việt Nam (UTC+7).</li>
          </ul>
        </div>
      </div>
    `;

    container.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  /**
   * Thực hiện điểm danh nhận thưởng Point
   */
  async performCheckin() {
    this.haptic('medium');
    if (this.isEnterpriseUser()) {
      this.showToast('Chương trình điểm danh nhận thưởng chỉ áp dụng cho Người Điền', 'info');
      return;
    }
    const btn = document.getElementById('streak-modal-action-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
        <span>Đang xử lý điểm danh...</span>
      `;
    }

    try {
      const res = await this.api('/users/checkin', { method: 'POST' });
      if (!res || !res.success) {
        throw new Error((res && res.message) || 'Không thể thực hiện điểm danh');
      }

      this.haptic('success');
      this.showToast(res.message, 'success');

      // Cập nhật số dư điểm người dùng trong state
      if (this.state.currentUser && res.streak && typeof res.streak.new_point_balance === 'number') {
        this.state.currentUser.point_balance = res.streak.new_point_balance;
      }

      // Nạp lại thông tin streak
      await this.fetchStreakInfo();

      // Cập nhật UI Header
      const pointsBadgeText = document.getElementById('header-points-text');
      if (pointsBadgeText && this.state.currentUser) {
        pointsBadgeText.textContent = `${(this.state.currentUser.point_balance || 0).toLocaleString('vi-VN')} Điểm`;
      }
      this.renderUserProfileDropdown();

      // Nếu đang mở Modal, re-render modal với trạng thái mới
      const container = document.getElementById('modal-container');
      if (container && !container.classList.contains('hidden')) {
        this.openStreakModal();
      }

      // Nếu đang ở màn hình surveys, re-render lại để cập nhật card streak và số dư
      if (this.state.currentTab === 'surveys') {
        const root = document.getElementById('app-root');
        if (root) this.renderSurveysView(root, false);
      }
    } catch (err) {
      this.haptic('error');
      this.showToast(err.message || 'Lỗi xử lý điểm danh', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <i data-lucide="zap" class="w-4 h-4"></i>
          <span>Điểm Danh Ngay</span>
        `;
        if (window.lucide) lucide.createIcons();
      }
    }
  },

  async verifyEmailAccount() {
    this.haptic('light');
    if (!this.state.currentUser) {
      this.openAuthModal('login');
      return;
    }

    try {
      const res = await this.api('/auth/send-verification-otp', { method: 'POST' });
      if (res.success) {
        this.openEmailVerificationModal(res.maskedEmail || this.state.currentUser.email, res.debugOtp);
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openEmailVerificationModal(maskedEmail, debugOtp) {
    this.showModal({
      title: 'Xác Thực Email Tài Khoản',
      content: `
        <form onsubmit="VibeApp.handleEmailOtpSubmit(event)" class="space-y-4">
          <div class="text-center space-y-1">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-orange-50 dark:bg-stone-800 text-orange-600 flex items-center justify-center">
              <i data-lucide="mail-check" class="w-6 h-6"></i>
            </div>
            <h4 class="text-sm font-extrabold text-slate-900 dark:text-white">Kiểm tra hộp thư điện tử</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Hệ thống đã gửi mã OTP 6 chữ số đến: <strong class="text-slate-800 dark:text-slate-200 font-mono">${maskedEmail}</strong>
            </p>
            ${debugOtp ? `
              <div class="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-orange-600 text-xs font-mono font-bold border border-stone-200 dark:border-stone-700">
                Mã xác thực gửi về: ${debugOtp}
              </div>
            ` : ''}
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
              Nhập mã xác thực (OTP 6 số)
            </label>
            <input type="text" id="email-otp-input" maxlength="6" required pattern="[0-9]{6}" placeholder="Ví dụ: 839210" 
                   class="w-full text-center text-xl font-mono font-extrabold tracking-[0.3em] py-3 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
          </div>

          <div id="otp-error-alert" class="hidden text-xs text-orange-600 font-semibold text-center"></div>

          <button type="submit" id="otp-submit-btn" class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="check" class="w-4 h-4"></i>
            Xác Thực Ngay & Kích Hoạt Ưu Đãi
          </button>

          <div class="text-center pt-1">
            <button type="button" onclick="VibeApp.verifyEmailAccount()" class="text-xs font-bold text-orange-600 hover:underline">
              Chưa nhận được mã? Gửi lại mã OTP
            </button>
          </div>
        </form>
      `
    });
  },

  async handleEmailOtpSubmit(event) {
    if (event) event.preventDefault();
    const otp = document.getElementById('email-otp-input')?.value.trim();
    const errorEl = document.getElementById('otp-error-alert');
    const submitBtn = document.getElementById('otp-submit-btn');

    if (!otp || otp.length !== 6) {
      if (errorEl) {
        errorEl.textContent = 'Vui lòng nhập đúng mã OTP gồm 6 chữ số';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Đang xác minh...';
    }

    try {
      const res = await this.api('/auth/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({ otp })
      });

      if (res.success) {
        this.closeModal();
        this.showToast(res.message, 'success');
        if (this.state.currentUser) {
          this.state.currentUser.is_email_verified = 1;
        }
        this.applyUserInterface();
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Mã xác thực không chính xác hoặc đã hết hạn';
        errorEl.classList.remove('hidden');
      }
      this.showToast(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Xác Thực Ngay & Kích Hoạt Ưu Đãi';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  async openSurveyPreviewModal(surveyId) {
    this.haptic('light');
    try {
      const res = await this.api('/surveys/' + surveyId);
      if (!res.success || !res.survey) {
        this.showToast('Không thể tải thông tin khảo sát', 'error');
        return;
      }
      const s = res.survey;
      const questions = s.questions || [];

      this.showModal({
        title: s.title,
        content: `
          <div class="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            ${s.cover_image_url ? `
              <div class="relative w-full h-32 sm:h-36 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-950 flex items-center justify-center -mt-1 mb-2">
                <img src="${s.cover_image_url}" alt="" class="absolute inset-0 w-full h-full object-cover object-center blur-md opacity-35 scale-105 pointer-events-none">
                <img src="${s.cover_image_url}" alt="Ảnh bìa khảo sát" class="relative max-h-full max-w-full object-contain mx-auto z-10" onerror="this.parentElement.style.display='none'">
              </div>
            ` : ''}
            <!-- Meta Bar -->
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-bold">
                ${s.category || 'Khảo sát'}
              </span>
              <span class="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold font-mono">
                +${(s.reward_points_per_response || 0).toLocaleString()} Điểm (≈ ${(s.reward_points_per_response || 0).toLocaleString()}đ)
              </span>
              <span class="text-slate-500 dark:text-slate-400 font-medium">
                ~${Math.ceil((s.min_completion_time_sec || 15) / 60)} phút • ${questions.length} câu hỏi
              </span>
            </div>

            <!-- Description -->
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              ${s.description || 'Khảo sát nghiên cứu thị trường và thu thập ý kiến cộng đồng.'}
            </p>

            <!-- Questions Preview List -->
            <div class="space-y-2.5 pt-1">
              <div class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Nội dung các câu hỏi trong khảo sát:</span>
                <span class="text-[11px] text-slate-400 font-normal">Chế độ xem trước</span>
              </div>
              ${questions.map((q, idx) => `
                <div class="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 space-y-1.5 text-xs">
                  <div class="flex items-start gap-2">
                    <span class="font-bold text-orange-600 dark:text-orange-400 font-mono">#${idx + 1}</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200">${q.content}</span>
                  </div>
                  ${q.options && q.options.length ? `
                    <div class="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      ${q.options.map(opt => `<div>• ${opt}</div>`).join('')}
                    </div>
                  ` : (q.type === 'RATING_STARS' ? `
                    <div class="pl-6 text-[11px] text-orange-500 font-medium">★ Đánh giá 1 đến 5 sao</div>
                  ` : (q.type === 'NUMBER_INPUT' ? `
                    <div class="pl-6 text-[11px] text-slate-400 italic">Nhập số liệu [123]</div>
                  ` : (q.type === 'DATE_INPUT' ? `
                    <div class="pl-6 text-[11px] text-slate-400 italic">Chọn ngày [YYYY-MM-DD]</div>
                  ` : '')))}
                </div>
              `).join('')}
            </div>

            <!-- CTA Banner -->
            <div class="p-4 rounded-2xl bg-orange-600 text-white space-y-2 text-center mt-3">
              <div class="text-xs font-extrabold">Đăng nhập tài khoản để làm khảo sát và nhận ngay +${(s.reward_points_per_response || 0).toLocaleString()} Điểm</div>
              <p class="text-[11px] text-zinc-100">Điểm thưởng có thể quy đổi sang thẻ cào Viettel, Vina, Mobi hoặc rút về tài khoản ngân hàng.</p>
              <div class="flex items-center justify-center gap-2 pt-1">
                <button onclick="VibeApp.closeModal(); VibeApp.openAuthModal('login')" class="px-5 py-2 bg-white text-orange-700 hover:bg-orange-50 dark:bg-stone-800 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95">
                  Đăng Nhập Để Làm Bài
                </button>
                <button onclick="VibeApp.closeModal(); VibeApp.openAuthModal('register')" class="px-5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all active:scale-95">
                  Đăng Ký Tài Khoản Mới
                </button>
              </div>
            </div>
          </div>
        `
      });
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  renderGuestLockedView(root, title, desc) {
    root.innerHTML = `
      <div class="bento-card p-10 sm:p-14 text-center max-w-lg mx-auto my-12 space-y-5">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-stone-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20 shadow-xs">
          <i data-lucide="shield-check" class="w-8 h-8 stroke-[2.2]"></i>
        </div>
        <div class="space-y-2">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">${title}</h3>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">${desc}</p>
        </div>
        <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onclick="VibeApp.openAuthModal('login')" class="w-full sm:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="log-in" class="w-4 h-4"></i>
            Đăng Nhập Ngay
          </button>
          <button onclick="VibeApp.openAuthModal('register')" class="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            Tạo Tài Khoản
          </button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },
  fallbackCopyText(text) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      this.haptic('success');
      this.showToast('Đã sao chép email bot vào bộ nhớ tạm!', 'success');
    } catch (err) {
      this.showToast('Không thể tự động sao chép. Vui lòng bôi đen email và nhấn Ctrl+C', 'warning');
    }
  },
  // ==================== TIỆN ÍCH THÔNG BÁO CAO CẤP (UI-UX-PRO-MAX) ====================
  showToast(messageOrConfig, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    let title = '';
    let description = '';

    if (typeof messageOrConfig === 'object' && messageOrConfig !== null) {
      title = messageOrConfig.title || '';
      description = messageOrConfig.description || messageOrConfig.message || '';
      if (messageOrConfig.type) type = messageOrConfig.type;
    } else {
      const msg = String(messageOrConfig || '');

      // Bộ phân loại ngôn ngữ thông minh (Smart Humanized Parser)
      if (msg.includes('không có quyền') || msg.includes('Yêu cầu vai trò') || msg.includes('không thuộc quyền')) {
        type = 'error';
        title = 'Yêu Cầu Quyền Hạn';
        description = msg.includes('Yêu cầu vai trò')
          ? 'Thao tác này yêu cầu tài khoản phù hợp hoặc phiên làm việc tương ứng.'
          : msg;
      } else if (type === 'error') {
        title = 'Có Lỗi Xảy Ra';
        description = msg;
      } else if (msg.includes('Số dư không đủ') || msg.includes('không đủ để ký quỹ')) {
        type = 'warning';
        title = 'Số Dư Chưa Đủ Ký Quỹ';
        description = msg;
      } else if (type === 'success' || msg.includes('Chào mừng') || msg.includes('thành công') || msg.includes('Thành công')) {
        type = 'success';
        title = 'Thao Tác Thành Công';
        description = msg;
      } else if (type === 'info' && (msg.includes('Vui lòng') || msg.includes('cảnh báo') || msg.includes('chú ý'))) {
        type = 'warning';
        title = 'Lưu Ý Thao Tác';
        description = msg;
      } else {
        title = type === 'success' ? 'Thành Công' :
          type === 'error' ? 'Có Lỗi Xảy Ra' :
            type === 'warning' ? 'Thông Báo Cần Lưu Ý' : 'Thông Tin';
        description = msg;
      }
    }

    // Chống lặp thông báo giống nhau liên tiếp trong vòng 2.5 giây
    const toastKey = `${type}:${description}`;
    const now = Date.now();
    if (this._lastToastKey === toastKey && now - (this._lastToastTime || 0) < 2500) {
      return;
    }
    this._lastToastKey = toastKey;
    this._lastToastTime = now;

    // Giữ tối đa 2 toast hiển thị đồng thời ở góc dưới để tránh choán màn hình
    while (container.children.length >= 2) {
      const oldest = container.firstElementChild;
      if (oldest) oldest.remove();
    }

    // Cấu hình theme màu & Icon SVG Lucide cao cấp
    const themeConfig = {
      success: {
        icon: 'check-circle-2',
        iconBg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60',
        progressBar: 'bg-orange-500',
        accentBorder: 'border-l-4 border-l-orange-500'
      },
      error: {
        icon: 'alert-circle',
        iconBg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60',
        progressBar: 'bg-orange-500',
        accentBorder: 'border-l-4 border-l-orange-500'
      },
      warning: {
        icon: 'alert-triangle',
        iconBg: 'bg-stone-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60',
        progressBar: 'bg-orange-500',
        accentBorder: 'border-l-4 border-l-orange-500'
      },
      info: {
        icon: 'sparkles',
        iconBg: 'bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-800/60',
        progressBar: 'bg-zinc-500',
        accentBorder: 'border-l-4 border-l-zinc-500'
      }
    };

    const cfg = themeConfig[type] || themeConfig.info;
    const durationMs = 2800;

    const toast = document.createElement('div');
    toast.className = `toast-pro-card ${cfg.accentBorder}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    toast.innerHTML = `
      <div class="w-8 h-8 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
        <i data-lucide="${cfg.icon}" class="w-4 h-4 stroke-[2.4]"></i>
      </div>
      <div class="flex-1 min-w-0 pr-1">
        <h4 class="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">${title}</h4>
        <p class="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5 break-words">${description}</p>
      </div>
      <button type="button" class="toast-close-btn p-1 -mr-1 -mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex-shrink-0" title="Đóng thông báo">
        <i data-lucide="x" class="w-3.5 h-3.5 stroke-[2.2]"></i>
      </button>
      <div class="toast-progress-bar ${cfg.progressBar}" style="animation-duration: ${durationMs}ms;"></div>
    `;

    const closeBtn = toast.querySelector('.toast-close-btn');
    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.95)';
      toast.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => toast.remove(), 200);
    };

    if (closeBtn) closeBtn.onclick = dismiss;

    let dismissTimer = setTimeout(dismiss, durationMs);
    toast.onmouseenter = () => clearTimeout(dismissTimer);
    toast.onmouseleave = () => { dismissTimer = setTimeout(dismiss, 1400); };

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    this.haptic(type === 'error' ? 'warning' : type === 'success' ? 'success' : 'light');
  },

  showModal({ title, content, maxWidth = 'max-w-lg' }) {
    const container = document.getElementById('modal-container');
    const card = document.getElementById('modal-card');
    if (!container || !card) return;

    card.className = `bg-white dark:bg-[#18181B] text-slate-800 dark:text-stone-100 rounded-3xl ${maxWidth} w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 transform transition-all relative my-auto max-h-[92vh] flex flex-col`;

    card.innerHTML = `
      <div class="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-5 flex-shrink-0">
        <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">${title}</h3>
        <button type="button" onclick="VibeApp.closeModal()" class="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white flex items-center justify-center transition-colors">
          <i data-lucide="x" class="w-4 h-4 stroke-[2]"></i>
        </button>
      </div>
      <div class="overflow-y-auto pr-1 flex-1">${content}</div>
    `;

    container.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  closeModal() {
    if (this._depositPollInterval) {
      clearInterval(this._depositPollInterval);
      this._depositPollInterval = null;
    }
    if (this._depositTimerInterval) {
      clearInterval(this._depositTimerInterval);
      this._depositTimerInterval = null;
    }
    const container = document.getElementById('modal-container');
    const card = document.getElementById('modal-card');
    if (container) container.classList.add('hidden');
    if (card) {
      card.className = "bg-white dark:bg-[#18181B] text-slate-800 dark:text-stone-100 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 transform transition-all relative my-auto max-h-[92vh] flex flex-col";
    }
  },

  copyValue(text, label = 'nội dung') {
    this.haptic('success');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(String(text));
    }
    this.showToast(`Đã sao chép ${label}!`, 'success');
  },
  };

  // Mo rong vao Namespace SSOT window.VibeApp
  Object.assign(window.VibeApp, ModalsTermsModule);
  window.ModalsTermsModule = ModalsTermsModule;
})();
