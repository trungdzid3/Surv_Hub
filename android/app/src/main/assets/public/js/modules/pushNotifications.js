/**
 * SurvHub - Push Notification & Android Hybrid Module (WAVE 1 MODULAR)
 * Gom doan "CO CHE THONG BAO DAY THOI GIAN THUC & ANDROID HYBRID" tu public/app.js.
 * Di chuyen nguyen van, kem mot fix ro ri bo nghe duy nhat: startNotificationPolling
 * truoc day them moi listener visibilitychange moi lan goi ma khong go handler cu.
 * Cac phu thuoc goi qua this.* deu late-binding qua window.VibeApp.
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * @namespace window.VibeApp
 * @requires window.VibeApp (core: api, state, haptic, showToast, navigate, closeAllCustomDropdowns,
 *           handleDeepLinkSurvey, escapeHtml, openBugReportModal, switchBugReportTab, openAdminBugDetailModal),
 *           Notification API (Web), Capacitor LocalNotifications (tuy chon), lucide (global)
 * @exports initPushNotifications, dismissPushBanner, requestPushPermission, syncPushSubscriptionToServer,
 *          startNotificationPolling, pollNotifications, triggerAlertArrival, ringNotificationBell,
 *          updateNotificationBadge, refreshNotificationBadge, showPushPopup, dismissPushPopup,
 *          handlePushAction, toggleNotificationsDropdown, loadNotificationsList, clickNotificationItem,
 *          openAdminBugDetailById, markAllNotificationsAsRead, _formatTimeAgo
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const PushNotificationsModule = {
  // ==================== CƠ CHẾ THÔNG BÁO ĐẨY THỜI GIAN THỰC & ANDROID HYBRID ====================

  /**
   * Khởi tạo cơ chế thông báo đẩy (Web Push API & Capacitor LocalNotifications)
   */
  initPushNotifications() {
    this._shownAlerts = this._shownAlerts || new Set();
    this._lastAlertCheckTime = Date.now();

    // 1. Hiển thị banner theo nền tảng: Android dùng LocalNotifications, Web dùng Notification API.
    const bannerDismissed = (localStorage.getItem('survhub_push_banner_dismissed') || localStorage.getItem('vibesurvey_push_banner_dismissed')) === '1';
    const bannerEl = document.getElementById('push-permission-banner');
    const isAndroidCapacitor = this._isAndroidCapacitor();

    this._configurePushBanner(isAndroidCapacitor);

    if (isAndroidCapacitor) {
      window.Capacitor.Plugins.LocalNotifications.checkPermissions().then((permission) => {
        if (permission && permission.display === 'granted') {
          this.syncPushSubscriptionToServer().catch(() => { });
        } else if (!bannerDismissed && bannerEl) {
          bannerEl.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }
      }).catch(() => {
        if (!bannerDismissed && bannerEl) bannerEl.classList.remove('hidden');
      });
    } else if ('Notification' in window) {
      if (Notification.permission === 'default' && !bannerDismissed && bannerEl) {
        bannerEl.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      } else if (Notification.permission === 'granted') {
        // Tự động đồng bộ endpoint lên server
        this.syncPushSubscriptionToServer().catch(() => { });
      }
    }

    // 2. Tương thích Android Capacitor LocalNotifications
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
      try {
        window.Capacitor.Plugins.LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
          const surveyId = action?.notification?.extra?.surveyId;
          if (surveyId) {
            this.handleDeepLinkSurvey(surveyId);
          }
        });
      } catch (capErr) {
        console.warn('Lỗi lắng nghe sự kiện Capacitor LocalNotifications:', capErr);
      }
    }

    // 3. Khởi động chu kỳ Polling thông báo thời gian thực
    this.startNotificationPolling();

    // 4. Lấy số lượng thông báo chưa đọc khởi tạo
    this.refreshNotificationBadge();
  },

  /**
   * Đóng và ghi nhớ trạng thái từ chối banner cấp quyền thông báo
   */
  dismissPushBanner() {
    localStorage.setItem('survhub_push_banner_dismissed', '1');
    const bannerEl = document.getElementById('push-permission-banner');
    if (bannerEl) bannerEl.classList.add('hidden');
  },

  /**
   * Yêu cầu cấp quyền nhận thông báo trên trình duyệt hoặc Android App
   */
  async requestPushPermission() {
    this.haptic('light');

    // Android Capacitor chỉ dùng quyền LocalNotifications, tuyệt đối không gọi Web Notification API.
    if (this._isAndroidCapacitor()) {
      try {
        const permission = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
        this.dismissPushBanner();
        if (permission && permission.display === 'granted') {
          await this.syncPushSubscriptionToServer();
          this.showToast('Đã bật quyền thông báo Android. Bạn sẽ nhận tin ngay khi có khảo sát thưởng cao.', 'success');
        } else {
          this.showToast('Bạn đã từ chối quyền thông báo Android. Có thể bật lại trong cài đặt ứng dụng.', 'info');
        }
      } catch (err) {
        console.warn('Yêu cầu quyền Android LocalNotifications:', err);
        this.dismissPushBanner();
      }
      return;
    }

    // Web dùng Web Notification API.
    if ('Notification' in window) {
      try {
        if (Notification.permission === 'denied') {
          this.dismissPushBanner();
          this.showToast('Thông báo đang bị chặn cho trang này. Hãy mở biểu tượng khóa cạnh địa chỉ trang, cho phép Thông báo rồi tải lại trang.', 'info');
          return;
        }

        const perm = await Notification.requestPermission();
        this.dismissPushBanner();
        if (perm === 'granted') {
          await this.syncPushSubscriptionToServer();
          this.showToast('Bật thông báo thành công! Bạn sẽ nhận tin ngay khi có khảo sát thưởng cao.', 'success');
        } else {
          this.showToast('Thông báo chưa được bật. Bạn có thể cho phép lại trong cài đặt trang web.', 'info');
        }
      } catch (permErr) {
        console.warn('Lỗi gọi Notification.requestPermission:', permErr);
        this.dismissPushBanner();
      }
    } else {
      this.dismissPushBanner();
      this.showToast('Trình duyệt hiện tại chưa hỗ trợ API thông báo đẩy Web Notification.', 'info');
    }
  },

  _isAndroidCapacitor() {
    return Boolean(
      window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.LocalNotifications &&
      typeof window.Capacitor.getPlatform === 'function' &&
      window.Capacitor.getPlatform() === 'android'
    );
  },

  _configurePushBanner(isAndroidCapacitor) {
    const bannerEl = document.getElementById('push-permission-banner');
    if (!bannerEl) return;

    const messageEl = bannerEl.querySelector('.push-banner-message');
    const actionEl = bannerEl.querySelector('button[onclick*="requestPushPermission"]');
    if (isAndroidCapacitor) {
      if (messageEl) messageEl.textContent = 'Cho phép thông báo Android để nhận khảo sát thưởng cao.';
      if (actionEl) actionEl.textContent = 'Bật thông báo Android';
    } else {
      if (messageEl) messageEl.textContent = 'Bật thông báo để nhận khảo sát thưởng cao.';
      if (actionEl) actionEl.textContent = 'Bật thông báo Web';
    }
  },

  /**
   * Đồng bộ Endpoint thiết bị / trình duyệt lên máy chủ lưu vào push_subscriptions
   */
  async syncPushSubscriptionToServer() {
    try {
      let endpoint = localStorage.getItem('survhub_push_endpoint') || localStorage.getItem('vibesurvey_push_endpoint');
      if (!endpoint) {
        const devicePrefix = window.Capacitor ? 'android' : 'web';
        const randomId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        endpoint = `survhub://${devicePrefix}/${randomId}`;
        localStorage.setItem('survhub_push_endpoint', endpoint);
      }

      await this.api('/notifications/subscribe-push', {
        method: 'POST',
        body: JSON.stringify({
          endpoint,
          device_type: window.Capacitor ? 'ANDROID' : 'WEB'
        })
      });
    } catch (err) {
      console.warn('Lỗi đồng bộ push subscription lên server:', err.message);
    }
  },

  /**
   * Bắt đầu vòng lặp định kỳ lấy thông báo chưa đọc và tin phát sóng thời gian thực
   */
  startNotificationPolling() {
    if (this._notifPollInterval) {
      clearInterval(this._notifPollInterval);
    }

    // Lặp mỗi 20 giây để cập nhật tin phát sóng và đếm số thông báo chưa đọc
    this._notifPollInterval = setInterval(() => {
      this.pollNotifications();
    }, 20000);

    // Kích hoạt tức thì khi người dùng quay lại tab trình duyệt
    // FIX RO RI BO NGHE (WAVE 1): startNotificationPolling co the duoc goi lai nhieu lan,
    // phai go bo handler cu truoc khi dang ky moi de tranh cong don listener visibilitychange (ro ri bo nho).
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
    }
    this._visibilityHandler = () => {
      if (!document.hidden) {
        this.pollNotifications();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
  },

  /**
   * Thực hiện một lần kiểm tra thông báo và tin phát sóng
   */
  async pollNotifications() {
    try {
      const since = this._lastAlertCheckTime || (Date.now() - 30000);
      this._lastAlertCheckTime = Date.now();

      if (this.state.token) {
        const res = await this.api(`/notifications/unread-count?since=${since}`);
        if (res && res.success) {
          this.updateNotificationBadge(res.unreadCount);

          if (Array.isArray(res.recentBroadcasts) && res.recentBroadcasts.length > 0) {
            for (const alert of res.recentBroadcasts) {
              if (!this._shownAlerts.has(alert.id)) {
                this._shownAlerts.add(alert.id);
                this.triggerAlertArrival(alert);
              }
            }
          }
        }
      } else {
        // Khách vãng lai: Kiểm tra các tin phát sóng khảo sát hỏa tốc công khai
        const res = await this.api(`/notifications/realtime-alerts?since=${since}`);
        if (res && res.success && Array.isArray(res.alerts)) {
          for (const alert of res.alerts) {
            if (!this._shownAlerts.has(alert.id)) {
              this._shownAlerts.add(alert.id);
              this.triggerAlertArrival(alert);
            }
          }
        }
      }
    } catch (err) {
      // Bỏ qua lỗi mạng nền khi polling
    }
  },

  /**
   * Kích hoạt toàn bộ hiệu ứng khi có thông báo thưởng cao mới đến
   */
  triggerAlertArrival(alert) {
    // 1. Rung chuông thông báo trên thanh Header
    this.ringNotificationBell();

    // 2. Hiển thị Popup đẩy thông báo ở góc màn hình
    this.showPushPopup(alert);

    // 3. Web Notification chỉ chạy trên web, không chạy trong Android Capacitor.
    if (!this._isAndroidCapacitor() && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(alert.title || 'Khảo sát mới trên SurvHub', {
          body: alert.body || 'Có khảo sát mới phù hợp với bạn trên SurvHub.',
          icon: '/logo.svg',
          badge: '/logo.svg',
          tag: 'survey-' + (alert.survey_id || 'new')
        });
        n.onclick = () => {
          window.focus();
          if (alert.survey_id) this.handleDeepLinkSurvey(alert.survey_id);
          n.close();
        };
      } catch (e) { }
    }

    // 4. Native Notification chỉ chạy trên Android Capacitor.
    if (this._isAndroidCapacitor()) {
      try {
        window.Capacitor.Plugins.LocalNotifications.schedule({
          notifications: [{
            title: alert.title || '[HỎA TỐC] Khảo sát thưởng cao',
            body: alert.body || 'Bấm để tham gia nhận thưởng ngay.',
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 300) },
            extra: { surveyId: alert.survey_id }
          }]
        }).catch(() => { });
      } catch (capErr) { }
    }
  },

  /**
   * Hiệu ứng rung chuông trên Header và rung thiết bị di động
   */
  ringNotificationBell() {
    this.haptic('success');
    if (navigator.vibrate) {
      try { navigator.vibrate([120, 60, 120]); } catch (e) { }
    }

    const bellIcon = document.getElementById('header-bell-icon');
    if (bellIcon) {
      bellIcon.classList.remove('animate-bell-ring');
      void bellIcon.offsetWidth; // Trigger reflow
      bellIcon.classList.add('animate-bell-ring');

      setTimeout(() => {
        bellIcon.classList.remove('animate-bell-ring');
      }, 3500);
    }
  },

  /**
   * Cập nhật số đếm thông báo chưa đọc trên chuông Header
   */
  updateNotificationBadge(count = 0) {
    const badgeEl = document.getElementById('header-notif-badge');
    if (!badgeEl) return;

    const num = parseInt(count, 10) || 0;
    if (num > 0) {
      badgeEl.textContent = num > 99 ? '99+' : String(num);
      badgeEl.classList.remove('hidden');
      badgeEl.classList.add('flex');
    } else {
      badgeEl.classList.add('hidden');
      badgeEl.classList.remove('flex');
    }
  },

  /**
   * Làm mới số đếm thông báo chưa đọc từ server
   */
  async refreshNotificationBadge() {
    if (!this.state.token) {
      this.updateNotificationBadge(0);
      return;
    }
    try {
      const res = await this.api('/notifications/unread-count');
      if (res && res.success) {
        this.updateNotificationBadge(res.unreadCount);
      }
    } catch (e) { }
  },

  /**
   * Hiển thị Popup đẩy thông báo ở góc màn hình (Floating Banner)
   */
  showPushPopup(alert) {
    const container = document.getElementById('push-popup-container');
    if (!container) return;

    const popupId = 'popup-' + (alert.id || Math.random().toString(36).substring(2));
    const titleClean = (alert.title || 'Khảo sát thưởng cao').replace(/^\[HỎA TỐC\]\s*/i, '');
    const pointsText = alert.reward_points ? `+${Number(alert.reward_points).toLocaleString('vi-VN')} Điểm` : '';

    const card = document.createElement('div');
    card.id = popupId;
    card.className = 'pointer-events-auto bg-white dark:bg-[#18181B] border border-orange-500/40 rounded-2xl p-4 shadow-2xl max-w-sm w-full push-popup-enter transition-all select-none';

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 flex items-center justify-center shrink-0 text-orange-600">
            <i data-lucide="zap" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                [HỎA TỐC]
              </span>
              ${pointsText ? `<span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">${pointsText}</span>` : ''}
            </div>
            <h4 class="text-xs font-bold text-stone-900 dark:text-white mt-1 leading-snug line-clamp-2">
              ${titleClean}
            </h4>
            <p class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
              ${alert.body || ''}
            </p>
            <div class="mt-2.5 flex items-center gap-2">
              <button onclick="VibeApp.handlePushAction('${alert.survey_id}', '${popupId}')" class="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1">
                <span>Làm Khảo Sát Ngay</span>
                <i data-lucide="arrow-right" class="w-3 h-3"></i>
              </button>
              <button onclick="VibeApp.dismissPushPopup('${popupId}')" class="px-2 py-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-[11px] font-medium transition-colors">
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
        <button onclick="VibeApp.dismissPushPopup('${popupId}')" class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 flex-shrink-0" title="Đóng">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    container.appendChild(card);
    if (window.lucide) window.lucide.createIcons();

    // Tự động đóng sau 12 giây
    setTimeout(() => {
      this.dismissPushPopup(popupId);
    }, 12000);
  },

  /**
   * Đóng một popup thông báo đẩy
   */
  dismissPushPopup(popupId) {
    const el = document.getElementById(popupId);
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateX(100%)';
      setTimeout(() => el.remove(), 250);
    }
  },

  /**
   * Xử lý nút hành động trên Popup thông báo
   */
  handlePushAction(surveyId, popupId) {
    this.dismissPushPopup(popupId);
    const dd = document.getElementById('header-notif-dropdown');
    if (dd) dd.classList.add('hidden');
    if (surveyId) {
      this.handleDeepLinkSurvey(surveyId);
    }
  },

  /**
   * Bật / tắt hiển thị Dropdown danh sách thông báo trên Header
   */
  toggleNotificationsDropdown() {
    this.haptic('light');
    const dropdown = document.getElementById('header-notif-dropdown');
    if (!dropdown) return;

    const isHidden = dropdown.classList.contains('hidden');
    this.closeAllCustomDropdowns();

    if (isHidden) {
      dropdown.classList.remove('hidden');
      this.loadNotificationsList();
    }
  },

  /**
   * Nạp và hiển thị danh sách thông báo trong dropdown
   */
  async loadNotificationsList() {
    const listEl = document.getElementById('header-notif-list');
    if (!listEl) return;

    if (!this.state.token) {
      listEl.innerHTML = `
        <div class="py-6 px-4 text-center space-y-2">
          <p class="text-stone-500 dark:text-stone-400 text-xs">Vui lòng đăng nhập để xem thông báo cá nhân và khảo sát dành riêng cho bạn.</p>
          <button onclick="VibeApp.toggleNotificationsDropdown(); VibeApp.openAuthModal('login')" class="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold">
            Đăng Nhập Ngay
          </button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '<div class="py-6 text-center text-stone-400 text-xs">Đang tải thông báo...</div>';

    try {
      const res = await this.api('/notifications');
      const notifications = (res && res.notifications) || [];

      if (notifications.length === 0) {
        listEl.innerHTML = `
          <div class="py-8 text-center text-stone-400 dark:text-stone-500 space-y-1">
            <div class="w-8 h-8 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
              <i data-lucide="bell-off" class="w-4 h-4"></i>
            </div>
            <p class="text-xs font-medium">Hiện chưa có thông báo mới</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      listEl.innerHTML = notifications.map(n => {
        const isUnread = n.is_read === 0;
        const timeAgo = this._formatTimeAgo(n.created_at);
        const reward = n.reward_points_per_response ? `+${n.reward_points_per_response.toLocaleString('vi-VN')} Điểm` : '';

        return `
          <div onclick="VibeApp.clickNotificationItem('${n.id}', '${n.survey_id || ''}', '${n.type || ''}', '${this.escapeHtml(n.title)}')" class="p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 cursor-pointer transition-colors flex items-start gap-2.5 ${isUnread ? 'bg-orange-50/40 dark:bg-orange-950/20' : ''}">
            <div class="w-7 h-7 rounded-lg ${isUnread ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'} flex items-center justify-center shrink-0 mt-0.5">
              <i data-lucide="${isUnread ? 'zap' : 'bell'}" class="w-3.5 h-3.5"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <span class="text-xs font-bold text-stone-900 dark:text-white truncate ${isUnread ? 'text-orange-600 dark:text-orange-400 font-extrabold' : ''}">
                  ${this.escapeHtml(n.title)}
                </span>
                <span class="text-[10px] text-stone-400 whitespace-nowrap">${timeAgo}</span>
              </div>
              <p class="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2 mt-0.5">
                ${this.escapeHtml(n.message)}
              </p>
              ${reward ? `
                <div class="mt-1.5 flex items-center gap-1.5">
                  <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200/60 dark:border-emerald-900/40">
                    ${reward}
                  </span>
                  <span class="text-[10px] text-orange-600 hover:underline font-bold">Làm khảo sát ngay</span>
                </div>
              ` : ''}
            </div>
            ${isUnread ? '<span class="w-2 h-2 rounded-full bg-orange-600 mt-2 shrink-0"></span>' : ''}
          </div>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      listEl.innerHTML = '<div class="py-6 text-center text-red-500 text-xs">Không thể tải danh sách thông báo</div>';
    }
  },

  /**
   * Xử lý khi người dùng bấm vào một thông báo cụ thể
   */
  async clickNotificationItem(notificationId, surveyId, notifType = '', notifTitle = '') {
    try {
      await this.api(`/notifications/${notificationId}/read`, { method: 'PUT' });
      this.refreshNotificationBadge();
    } catch (e) { }

    const dd = document.getElementById('header-notif-dropdown');
    if (dd) dd.classList.add('hidden');

    const titleLower = (notifTitle || '').toLowerCase();
    const isBugRelated = notifType === 'BUG_REPORT' || notifType === 'BUG_UPDATE' || titleLower.includes('sự cố') || titleLower.includes('báo lỗi');

    if (isBugRelated) {
      if (this.state.currentUser && this.state.currentUser.role === 'ADMIN') {
        if (surveyId) {
          await this.openAdminBugDetailById(surveyId);
        } else {
          this.navigate('admin-bug-reports');
        }
      } else {
        this.openBugReportModal();
        this.switchBugReportTab('history');
      }
    } else if (surveyId) {
      this.handleDeepLinkSurvey(surveyId);
    }
  },

  /**
   * Mở trực tiếp Modal Chi tiết Báo lỗi Admin từ thông báo Push/In-app
   */
  async openAdminBugDetailById(bugId) {
    try {
      this.haptic('light');
      let bug = null;
      if (this._lastAdminBugReports && this._lastAdminBugReports.length) {
        bug = this._lastAdminBugReports.find(r => r.id === bugId);
      }
      if (!bug) {
        const res = await this.api(`/admin/bug-reports/${bugId}`);
        if (res && res.success && res.report) {
          bug = res.report;
          if (!this._lastAdminBugReports) this._lastAdminBugReports = [];
          this._lastAdminBugReports.unshift(bug);
        }
      }
      if (bug) {
        this.openAdminBugDetailModal(bug.id);
        if (this.state.currentTab !== 'admin-bug-reports' && this.state.currentTab !== 'admin-overview') {
          this.navigate('admin-bug-reports');
        }
      } else {
        this.navigate('admin-bug-reports');
      }
    } catch (err) {
      console.error('Lỗi openAdminBugDetailById:', err);
      this.navigate('admin-bug-reports');
    }
  },

  /**
   * Đánh dấu toàn bộ thông báo của người dùng là đã đọc
   */
  async markAllNotificationsAsRead() {
    this.haptic('light');
    try {
      await this.api('/notifications/read-all', { method: 'PUT' });
      this.updateNotificationBadge(0);
      this.loadNotificationsList();
      this.showToast('Đã đánh dấu tất cả thông báo là đã đọc.', 'success');
    } catch (err) {
      this.showToast('Lỗi cập nhật thông báo: ' + err.message, 'error');
    }
  },

  /**
   * Helper định dạng thời gian tương đối
   */
  _formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    try {
      const dt = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
      const diffMs = Date.now() - dt.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Vừa xong';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} giờ trước`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay} ngày trước`;
    } catch (e) {
      return '';
    }
  },
  };

  // Mo rong vao Namespace SSOT window.VibeApp
  Object.assign(window.VibeApp, PushNotificationsModule);
  window.PushNotificationsModule = PushNotificationsModule;
})();
