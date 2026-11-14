/**
 * SurvHub - Contextual Spotlight Onboarding Tour Module
 * Huong dan tuong tac theo ngu canh tung tab voi Spotlight & Popover.
 * Tuan thu DESIGN.md (Cam #EA580C, Trang #FFFFFF/#FAFAFA, Den Obsidian #121214/#1C1C20, Montserrat).
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * @namespace window.VibeApp
 * @requires window.VibeApp (state, showToast, closeAllCustomDropdowns),
 *           window.VibeUtils (refreshIcons), lucide (global)
 * @exports triggerAutoTourForTab, startContextualTour, nextTourStep, prevTourStep,
 *          closeOnboardingTour, disableAllAutoTours
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const STORAGE_SEEN_KEY = 'survhub_tour_seen_v1';
  const STORAGE_DISABLED_KEY = 'survhub_tour_disabled_v1';
  const AUTO_TRIGGER_DELAY_MS = 380;
  const VIEWPORT_MARGIN = 12;
  const MOBILE_BOTTOM_NAV_RESERVE = 76;
  const SPOTLIGHT_PADDING = 6;
  const POPOVER_GAP = 12;

  const TOUR_SCENARIOS = {
    home: [
      {
        selectors: ['#home-survey-search-input', '#app-root section:first-of-type'],
        title: 'Khám phá & tìm nhanh khảo sát',
        description: 'Nhập từ khóa hoặc lướt nhanh khu vực trang chủ để tìm các bài khảo sát phù hợp và bắt đầu tích điểm.'
      },
      {
        selectors: ['[data-tour-nav="surveys"]', '[data-tour-mobile-nav="surveys"]'],
        title: 'Kho khảo sát đang mở',
        description: 'Chuyển sang mục Khảo Sát để lọc theo danh mục, mức thưởng và tham gia điền biểu mẫu nhận Point.'
      },
      {
        selectors: ['[data-tour-nav="create-survey"]', '[data-tour-mobile-nav="create-survey"]'],
        title: 'Tạo khảo sát cho nghiên cứu',
        description: 'Mở Studio tạo khảo sát để thiết lập câu hỏi, cấu hình đối tượng và ký quỹ minh bạch bằng Credit.'
      },
      {
        selectors: ['#header-guide-btn'],
        title: 'Mở lại hướng dẫn bất kỳ lúc nào',
        description: 'Bạn có thể nhấn nút Hướng dẫn trên thanh tiêu đề để xem lại tour theo đúng màn hình đang mở.'
      }
    ],
    surveys: [
      {
        selectors: ['#survey-search-input'],
        title: 'Tìm kiếm khảo sát theo nhu cầu',
        description: 'Gõ chủ đề hoặc từ khóa để lọc nhanh các bài khảo sát đang hoạt động trong hệ thống.'
      },
      {
        selectors: ['#survey-cat-btn', '#sort-dropdown-label'],
        title: 'Lọc danh mục & sắp xếp thông minh',
        description: 'Chọn lĩnh vực quan tâm hoặc sắp xếp theo mức thưởng cao nhất và thời gian mới nhất.'
      },
      {
        selectors: ['#header-streak-btn', '#user-profile-btn', '#guest-auth-actions'],
        title: 'Theo dõi chuỗi điểm danh & tài khoản',
        description: 'Kiểm tra chuỗi điểm danh, số dư điểm thưởng và trạng thái tài khoản ngay trên thanh điều hướng.'
      }
    ],
    'create-survey': [
      {
        selectors: [
          '#app-root button[onclick*="SMART_PASTE"]',
          '#app-root button[onclick*="SYNC_EXTERNAL"]',
          '#app-root'
        ],
        title: 'Nhập nhanh hoặc đồng bộ biểu mẫu',
        description: 'Dán nhanh danh sách câu hỏi bằng Smart Paste hoặc đồng bộ từ nguồn ngoài để dựng khảo sát trong vài giây.'
      },
      {
        selectors: ['#fast-target-count', '#sidebar-floor-indicator'],
        title: 'Thiết lập số lượng mẫu & mức sàn',
        description: 'Điều chỉnh số lượng phản hồi mục tiêu và theo dõi chi phí sàn tối thiểu theo thời gian thực.'
      },
      {
        selectors: [
          '#studio-sla-card-RECOMMENDED',
          '#studio-sla-card-FLOOR',
          '#studio-boost-slider'
        ],
        title: 'Chọn gói tốc độ thu mẫu (SLA)',
        description: 'Cân bằng giữa ngân sách tối ưu và tốc độ hoàn thành bằng các gói SLA hoặc thanh tăng tốc phân phối.'
      }
    ],
    'voucher-market': [
      {
        selectors: ['#app-root h1'],
        title: 'Chợ Voucher thương hiệu',
        description: 'Quy đổi điểm thưởng Point tích lũy từ khảo sát sang các mã ưu đãi và thẻ quà tặng giá trị.'
      },
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        title: 'Chọn thẻ quà & đổi mã tức thì',
        description: 'Kiểm tra điều kiện áp dụng trên từng thẻ voucher và nhấn đổi thưởng khi bạn đã đủ số dư Point.'
      }
    ],
    wallet: [
      {
        selectors: [
          '#app-root button[onclick*="openPayoutModal"]',
          '#app-root button[onclick*="openDepositModal"]',
          '#app-root'
        ],
        title: 'Rút thưởng & nạp Credit nhanh',
        description: 'Thực hiện rút tiền từ Point hoặc nạp Credit để tài trợ cho các chiến dịch khảo sát của bạn.'
      },
      {
        selectors: ['#wallet-tx-history-section'],
        title: 'Lịch sử giao dịch chi tiết',
        description: 'Theo dõi toàn bộ trạng thái nạp, rút và quy đổi điểm minh bạch theo thời gian.'
      },
      {
        selectors: ['#wallet-ledger-card'],
        title: 'Sổ cái đối soát tài chính',
        description: 'Mọi biến động số dư Point và Credit đều được ghi nhận rõ ràng giúp bạn kiểm tra bất kỳ lúc nào.'
      }
    ],
    forum: [
      {
        selectors: ['#forum-hub-tab-community', '#forum-current-hub-badge'],
        title: 'Chuyển đổi không gian thảo luận',
        description: 'Theo dõi các chủ đề cộng đồng và cập nhật trao đổi giữa người tạo khảo sát với người tham gia.'
      },
      {
        selectors: ['#app-root button[onclick*="openCreateForumPostModal"]', '#app-root'],
        title: 'Đăng bài trao đổi mới',
        description: 'Chia sẻ kinh nghiệm thiết kế bảng hỏi, đặt câu hỏi hoặc thảo luận về chất lượng khảo sát.'
      }
    ],
    'creator-surveys': [
      {
        selectors: ['#app-root'],
        title: 'Quản lý chiến dịch khảo sát của bạn',
        description: 'Theo dõi tiến độ thu thập mẫu, tạm dừng hoặc xem báo cáo dữ liệu từ các bài khảo sát đã phát hành.'
      }
    ],
    profile: [
      {
        selectors: ['#app-root'],
        title: 'Hồ sơ & chỉ số uy tín cá nhân',
        description: 'Cập nhật thông tin nhân khẩu học để nhận nhiều khảo sát phù hợp hơn và theo dõi điểm tin cậy tài khoản.'
      }
    ]
  };

  let autoTourTimer = null;
  let rafId = null;
  let activeTour = null;
  let boundHandlers = null;

  function readSeenMap() {
    try {
      const raw = localStorage.getItem(STORAGE_SEEN_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeSeenTab(tabId) {
    if (!tabId) return;
    try {
      const map = readSeenMap();
      map[tabId] = true;
      localStorage.setItem(STORAGE_SEEN_KEY, JSON.stringify(map));
    } catch (_) {
      // Bo qua neu localStorage bi chan
    }
  }

  function isAutoTourDisabled() {
    try {
      return localStorage.getItem(STORAGE_DISABLED_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findVisibleTarget(selectors) {
    if (!Array.isArray(selectors)) return null;
    for (let i = 0; i < selectors.length; i += 1) {
      const sel = selectors[i];
      if (!sel || typeof sel !== 'string') continue;
      let nodes;
      try {
        nodes = document.querySelectorAll(sel);
      } catch (_) {
        continue;
      }
      for (let j = 0; j < nodes.length; j += 1) {
        if (isElementVisible(nodes[j])) {
          return nodes[j];
        }
      }
    }
    return null;
  }

  function resolveStepsForTab(tabId) {
    const scenario = TOUR_SCENARIOS[tabId] || [];
    const resolved = [];
    for (let i = 0; i < scenario.length; i += 1) {
      const step = scenario[i];
      const target = findVisibleTarget(step.selectors);
      if (target) {
        resolved.push({
          selectors: step.selectors,
          title: step.title,
          description: step.description,
          target
        });
      }
    }
    return resolved;
  }

  function getBottomSafeMargin() {
    return window.innerWidth < 768
      ? VIEWPORT_MARGIN + MOBILE_BOTTOM_NAV_RESERVE
      : VIEWPORT_MARGIN;
  }

  function ensureRootContainer() {
    let root = document.getElementById('survhub-onboarding-root');
    if (root) return root;

    root = document.createElement('div');
    root.id = 'survhub-onboarding-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Hướng dẫn sử dụng theo ngữ cảnh');

    root.innerHTML = [
      '<div class="survhub-tour-backdrop" data-tour-action="close"></div>',
      '<div class="survhub-tour-spotlight" aria-hidden="true"></div>',
      '<div class="survhub-tour-popover" tabindex="-1"></div>'
    ].join('');

    root.addEventListener('click', (event) => {
      const actionEl = event.target.closest('[data-tour-action]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-tour-action');
      if (action === 'close') {
        OnboardingTourModule.closeOnboardingTour.call(window.VibeApp, true);
      } else if (action === 'next') {
        OnboardingTourModule.nextTourStep.call(window.VibeApp);
      } else if (action === 'prev') {
        OnboardingTourModule.prevTourStep.call(window.VibeApp);
      } else if (action === 'disable') {
        OnboardingTourModule.disableAllAutoTours.call(window.VibeApp);
      }
    });

    document.body.appendChild(root);
    return root;
  }

  function refreshIcons() {
    if (window.VibeUtils && typeof window.VibeUtils.refreshIcons === 'function') {
      window.VibeUtils.refreshIcons();
    } else if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function renderCurrentPopover() {
    if (!activeTour) return;
    const root = ensureRootContainer();
    const popoverEl = root.querySelector('.survhub-tour-popover');
    if (!popoverEl) return;

    const total = activeTour.steps.length;
    const index = activeTour.stepIndex;
    const step = activeTour.steps[index];
    const isFirst = index === 0;
    const isLast = index === total - 1;

    popoverEl.innerHTML = `
      <div class="survhub-tour-popover-header">
        <span class="survhub-tour-step-badge">${index + 1}/${total}</span>
        <button type="button" class="survhub-tour-close-btn" data-tour-action="close" aria-label="Đóng hướng dẫn">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
      <div class="survhub-tour-popover-body">
        <h3 class="survhub-tour-title">${escapeHtml(step.title)}</h3>
        <p class="survhub-tour-desc">${escapeHtml(step.description)}</p>
      </div>
      <div class="survhub-tour-popover-footer">
        <div class="survhub-tour-footer-links">
          <button type="button" class="survhub-tour-link-btn" data-tour-action="disable">Tắt tự động</button>
          <button type="button" class="survhub-tour-link-btn" data-tour-action="close">Bỏ qua</button>
        </div>
        <div class="survhub-tour-footer-nav">
          <button type="button" class="survhub-tour-btn-secondary" data-tour-action="prev" ${isFirst ? 'disabled' : ''}>
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
            <span>Quay lại</span>
          </button>
          <button type="button" class="survhub-tour-btn-primary" data-tour-action="next">
            <span>${isLast ? 'Hoàn tất' : 'Tiếp theo'}</span>
            <i data-lucide="${isLast ? 'check' : 'chevron-right'}" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    refreshIcons();
  }

  function updateSpotlightAndPopoverPosition() {
    if (!activeTour) return;
    const root = document.getElementById('survhub-onboarding-root');
    if (!root) return;

    const spotlightEl = root.querySelector('.survhub-tour-spotlight');
    const popoverEl = root.querySelector('.survhub-tour-popover');
    if (!spotlightEl || !popoverEl) return;

    const step = activeTour.steps[activeTour.stepIndex];
    let target = step.target;
    if (!isElementVisible(target)) {
      target = findVisibleTarget(step.selectors);
      if (target) {
        step.target = target;
      }
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bottomSafe = getBottomSafeMargin();

    if (!target) {
      spotlightEl.style.opacity = '0';
      const popRect = popoverEl.getBoundingClientRect();
      const left = Math.max(VIEWPORT_MARGIN, (vw - popRect.width) / 2);
      const top = Math.max(VIEWPORT_MARGIN, (vh - bottomSafe - popRect.height) / 2);
      popoverEl.style.left = `${Math.round(left)}px`;
      popoverEl.style.top = `${Math.round(top)}px`;
      return;
    }

    const rawRect = target.getBoundingClientRect();
    const spotLeft = Math.max(4, rawRect.left - SPOTLIGHT_PADDING);
    const spotTop = Math.max(4, rawRect.top - SPOTLIGHT_PADDING);
    const spotRight = Math.min(vw - 4, rawRect.right + SPOTLIGHT_PADDING);
    const spotBottom = Math.min(vh - 4, rawRect.bottom + SPOTLIGHT_PADDING);
    const spotWidth = Math.max(24, spotRight - spotLeft);
    const spotHeight = Math.max(24, spotBottom - spotTop);

    spotlightEl.style.opacity = '1';
    spotlightEl.style.left = `${Math.round(spotLeft)}px`;
    spotlightEl.style.top = `${Math.round(spotTop)}px`;
    spotlightEl.style.width = `${Math.round(spotWidth)}px`;
    spotlightEl.style.height = `${Math.round(spotHeight)}px`;

    const popRect = popoverEl.getBoundingClientRect();
    const popWidth = popRect.width || Math.min(340, vw - VIEWPORT_MARGIN * 2);
    const popHeight = popRect.height || 200;

    const maxLeft = Math.max(VIEWPORT_MARGIN, vw - popWidth - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, vh - popHeight - bottomSafe);

    let popLeft = rawRect.left + (rawRect.width - popWidth) / 2;
    popLeft = Math.min(Math.max(VIEWPORT_MARGIN, popLeft), maxLeft);

    const spaceBelow = vh - bottomSafe - (spotTop + spotHeight + POPOVER_GAP);
    const spaceAbove = spotTop - POPOVER_GAP - VIEWPORT_MARGIN;

    let popTop;
    if (spaceBelow >= popHeight) {
      popTop = spotTop + spotHeight + POPOVER_GAP;
    } else if (spaceAbove >= popHeight) {
      popTop = spotTop - POPOVER_GAP - popHeight;
    } else {
      popTop = (vh - bottomSafe - popHeight) / 2;
    }

    popTop = Math.min(Math.max(VIEWPORT_MARGIN, popTop), maxTop);

    popoverEl.style.left = `${Math.round(popLeft)}px`;
    popoverEl.style.top = `${Math.round(popTop)}px`;
  }

  function schedulePositionUpdate() {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      updateSpotlightAndPopoverPosition();
    });
  }

  function scrollTargetIntoViewIfNeeded(target) {
    if (!target || typeof target.scrollIntoView !== 'function') return;
    const rect = target.getBoundingClientRect();
    const vh = window.innerHeight;
    const bottomSafe = getBottomSafeMargin();
    const isLargeContainer = rect.height > vh * 0.72;
    const inView = rect.top >= VIEWPORT_MARGIN && rect.bottom <= vh - bottomSafe;

    if (!inView && !isLargeContainer) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }

  function bindGlobalListeners() {
    if (boundHandlers) return;
    const onResizeOrScroll = () => {
      schedulePositionUpdate();
    };
    const onKeyDown = (event) => {
      if (!activeTour) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        OnboardingTourModule.closeOnboardingTour.call(window.VibeApp, true);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        OnboardingTourModule.nextTourStep.call(window.VibeApp);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        OnboardingTourModule.prevTourStep.call(window.VibeApp);
      }
    };

    window.addEventListener('resize', onResizeOrScroll, { passive: true });
    window.addEventListener('scroll', onResizeOrScroll, { passive: true, capture: true });
    document.addEventListener('keydown', onKeyDown);

    boundHandlers = { onResizeOrScroll, onKeyDown };
  }

  function unbindGlobalListeners() {
    if (!boundHandlers) return;
    window.removeEventListener('resize', boundHandlers.onResizeOrScroll, { passive: true });
    window.removeEventListener('scroll', boundHandlers.onResizeOrScroll, { passive: true, capture: true });
    document.removeEventListener('keydown', boundHandlers.onKeyDown);
    boundHandlers = null;
  }

  function renderCurrentStep() {
    if (!activeTour) return;
    const step = activeTour.steps[activeTour.stepIndex];
    if (step && step.target) {
      scrollTargetIntoViewIfNeeded(step.target);
    }
    renderCurrentPopover();
    updateSpotlightAndPopoverPosition();
    window.setTimeout(() => {
      updateSpotlightAndPopoverPosition();
    }, 240);
  }

  const OnboardingTourModule = {
    triggerAutoTourForTab(tabId) {
      if (!tabId || !TOUR_SCENARIOS[tabId]) return;
      if (isAutoTourDisabled()) return;

      const seenMap = readSeenMap();
      if (seenMap[tabId]) return;

      if (autoTourTimer !== null) {
        window.clearTimeout(autoTourTimer);
        autoTourTimer = null;
      }

      autoTourTimer = window.setTimeout(() => {
        autoTourTimer = null;
        if (typeof this.startContextualTour === 'function') {
          this.startContextualTour(false, tabId);
        }
      }, AUTO_TRIGGER_DELAY_MS);
    },

    startContextualTour(forceManual = true, tabId = null) {
      let targetTab = tabId || (this.state && this.state.currentTab) || 'home';
      if (!TOUR_SCENARIOS[targetTab]) {
        if (!forceManual) return;
        targetTab = 'home';
      }

      if (typeof this.closeAllCustomDropdowns === 'function') {
        this.closeAllCustomDropdowns();
      }

      const steps = resolveStepsForTab(targetTab);
      if (steps.length === 0) {
        if (forceManual && typeof this.showToast === 'function') {
          this.showToast('Không có mục hướng dẫn khả dụng trên màn hình này.', 'info');
        }
        return;
      }

      if (activeTour) {
        this.closeOnboardingTour(false);
      }

      activeTour = {
        tabId: targetTab,
        steps,
        stepIndex: 0
      };

      bindGlobalListeners();
      renderCurrentStep();
    },

    nextTourStep() {
      if (!activeTour) return;
      if (activeTour.stepIndex < activeTour.steps.length - 1) {
        activeTour.stepIndex += 1;
        renderCurrentStep();
      } else {
        this.closeOnboardingTour(true);
      }
    },

    prevTourStep() {
      if (!activeTour) return;
      if (activeTour.stepIndex > 0) {
        activeTour.stepIndex -= 1;
        renderCurrentStep();
      }
    },

    closeOnboardingTour(markSeen = true) {
      if (autoTourTimer !== null) {
        window.clearTimeout(autoTourTimer);
        autoTourTimer = null;
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }

      if (markSeen && activeTour && activeTour.tabId) {
        writeSeenTab(activeTour.tabId);
      }

      activeTour = null;
      unbindGlobalListeners();

      const root = document.getElementById('survhub-onboarding-root');
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
    },

    disableAllAutoTours() {
      try {
        localStorage.setItem(STORAGE_DISABLED_KEY, '1');
      } catch (_) {
        // Bo qua neu localStorage bi chan
      }
      this.closeOnboardingTour(true);
      if (typeof this.showToast === 'function') {
        this.showToast('Đã tắt hướng dẫn tự động. Bạn vẫn có thể mở lại từ nút Hướng dẫn.', 'info');
      }
    }
  };

  Object.assign(window.VibeApp, OnboardingTourModule);
  window.OnboardingTourModule = OnboardingTourModule;
})();
