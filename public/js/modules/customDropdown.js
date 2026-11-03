/**
 * SurvHub - Custom Dropdown Popover Module
 * Tuan thu DESIGN.md Muc 5.3: Quy Chuan Dropdown & Custom Selection System (Bento Modern)
 * Cam 100% the select nguyen thuy cua trinh duyet trong modal/quan tri.
 * TUYET DOI KHONG DUNG EMOJI.
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const CustomDropdownModule = {
    _activeDropdownId: null,
    _activeDropdownIconId: null,
    _activeDropdownTriggerId: null,
    _dropdownListenersInitialized: false,

    _getTrigger(dropdownId, triggerId, event) {
      const explicitTrigger = triggerId ? document.getElementById(triggerId) : null;
      if (explicitTrigger) return explicitTrigger;

      const eventTrigger = event && event.currentTarget && event.currentTarget !== document
        ? event.currentTarget
        : null;
      const targetTrigger = event && event.target && event.target.closest
        ? event.target.closest('.custom-dropdown-trigger, [aria-haspopup="listbox"]')
        : null;
      const resolvedEventTrigger = eventTrigger || targetTrigger;
      if (resolvedEventTrigger && (resolvedEventTrigger.matches('.custom-dropdown-trigger, [aria-haspopup="listbox"]') ||
        resolvedEventTrigger.getAttribute('aria-controls') === dropdownId)) {
        return resolvedEventTrigger;
      }

      const controlledTrigger = document.querySelector(`[aria-controls="${dropdownId}"]`);
      if (controlledTrigger) return controlledTrigger;

      const dropdown = document.getElementById(dropdownId);
      return dropdown && dropdown.parentElement
        ? dropdown.parentElement.querySelector('.custom-dropdown-trigger')
        : null;
    },

    _getOptions(dropdown) {
      if (!dropdown) return [];
      return Array.from(dropdown.querySelectorAll('[role="option"], button, [data-value], [onclick]'))
        .filter((option) => option.closest('[role="listbox"]') === dropdown &&
          !option.matches('[disabled], [aria-disabled="true"], .disabled'));
    },

    _isDisabled(option) {
      return !option || option.disabled === true ||
        option.getAttribute('aria-disabled') === 'true' ||
        option.classList.contains('disabled');
    },

    _prepareDropdown(dropdown, trigger) {
      if (!dropdown) return [];
      dropdown.setAttribute('role', 'listbox');
      dropdown.setAttribute('aria-orientation', 'vertical');
      if (trigger) {
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', dropdown.classList.contains('hidden') ? 'false' : 'true');
        if (!trigger.id) trigger.id = `custom-dropdown-trigger-${dropdown.id || Date.now()}`;
        if (!dropdown.id) dropdown.id = `${trigger.id}-listbox`;
        trigger.setAttribute('aria-controls', dropdown.id);
      }

      const options = Array.from(dropdown.querySelectorAll('[role="option"], button, [data-value], [onclick]'))
        .filter((option) => option.closest('[role="listbox"]') === dropdown);
      options.forEach((option) => {
        option.setAttribute('role', 'option');
        if (!option.id) option.id = `${dropdown.id}-option-${options.indexOf(option) + 1}`;
        if (!option.hasAttribute('aria-selected')) option.setAttribute('aria-selected', 'false');
        option.tabIndex = -1;
      });
      return options.filter((option) => !this._isDisabled(option));
    },

    _focusOption(dropdown, index) {
      const options = this._getOptions(dropdown);
      if (!options.length) return;
      const safeIndex = Math.max(0, Math.min(index, options.length - 1));
      options.forEach((option, optionIndex) => {
        option.tabIndex = optionIndex === safeIndex ? 0 : -1;
      });
      options[safeIndex].focus();
    },

    /**
     * Khoi tao su kien lang nghe click toan cuc de tu dong dong dropdown khi bam ra ngoai
     */
    initDropdownListeners() {
      if (this._dropdownListenersInitialized) return;
      this._dropdownListenersInitialized = true;

      document.addEventListener('click', (event) => {
        const option = event.target && event.target.closest
          ? event.target.closest('[role="option"]')
          : null;
        if (option && option.closest('[role="listbox"]')) {
          const menu = option.closest('[role="listbox"]');
          if (!this._isDisabled(option)) {
            menu.querySelectorAll('[role="option"]').forEach((item) => {
              item.setAttribute('aria-selected', item === option ? 'true' : 'false');
            });
          }
        }
        if (!this._activeDropdownId) return;

        const ddEl = document.getElementById(this._activeDropdownId);
        const triggerEl = this._activeDropdownTriggerId 
          ? document.getElementById(this._activeDropdownTriggerId) 
          : null;

        if (ddEl && !ddEl.contains(event.target) && (!triggerEl || !triggerEl.contains(event.target))) {
          this.closeAllCustomDropdowns();
        }
      });

      document.addEventListener('keydown', (event) => {
        const activeDropdown = this._activeDropdownId
          ? document.getElementById(this._activeDropdownId)
          : null;
        const activeTrigger = this._activeDropdownTriggerId
          ? document.getElementById(this._activeDropdownTriggerId)
          : null;

        if (!activeDropdown) {
          const trigger = event.target && event.target.closest
            ? event.target.closest('.custom-dropdown-trigger, [aria-haspopup="listbox"]')
            : null;
          const dropdownId = trigger ? trigger.getAttribute('aria-controls') : null;
          if (trigger && dropdownId && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
            event.preventDefault();
            this.toggleCustomDropdown(dropdownId, event, null, trigger.id || null);
            if (event.key === 'ArrowUp') {
              const dropdown = document.getElementById(dropdownId);
              const options = this._getOptions(dropdown);
              if (options.length) this._focusOption(dropdown, options.length - 1);
            }
          }
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          this.closeAllCustomDropdowns(true);
          if (activeTrigger && typeof activeTrigger.focus === 'function') activeTrigger.focus();
          return;
        }

        if (!activeDropdown || !activeDropdown.contains(event.target)) return;
        const options = this._getOptions(activeDropdown);
        if (!options.length) return;
        const currentIndex = options.indexOf(document.activeElement);
        let nextIndex = currentIndex;

        if (event.key === 'ArrowDown') nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        else if (event.key === 'ArrowUp') nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = options.length - 1;
        else if (event.key === 'Enter' || event.key === ' ') {
          if (currentIndex < 0) return;
          event.preventDefault();
          options[currentIndex].click();
          return;
        } else {
          return;
        }

        event.preventDefault();
        this._focusOption(activeDropdown, nextIndex);
      });
    },

    /**
     * Dong/mo mot Custom Dropdown Popover cu the (Chu ky ham linh hoat va an toan tuyet doi)
     */
    toggleCustomDropdown(dropdownId, arg2, arg3, arg4) {
      let iconId = null;
      let event = null;
      let triggerId = null;

      if (arg2 && typeof arg2.stopPropagation === 'function') {
        event = arg2;
        if (typeof arg4 === 'string') {
          triggerId = arg4;
        }
      } else if (typeof arg2 === 'string') {
        iconId = arg2;
        if (arg3 && typeof arg3.stopPropagation === 'function') {
          event = arg3;
        }
        if (typeof arg4 === 'string') {
          triggerId = arg4;
        }
      } else if (arg3 && typeof arg3.stopPropagation === 'function') {
        event = arg3;
      }

      if (event) {
        if (typeof event.stopPropagation === 'function') {
          event.stopPropagation();
        }
        if (typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        if (!triggerId && event.currentTarget && event.currentTarget.id) {
          triggerId = event.currentTarget.id;
        }
      }

      this.initDropdownListeners();

      const dd = document.getElementById(dropdownId);
      if (!dd) return;

      const isOpening = dd.classList.contains('hidden');
      const trigger = this._getTrigger(dropdownId, triggerId, event);

      // Dong cac dropdown khac truoc khi mo dropdown nay
      this.closeAllCustomDropdowns();

      if (isOpening) {
        dd.classList.remove('hidden');
        const options = this._prepareDropdown(dd, trigger);
        let icon = iconId ? document.getElementById(iconId) : null;
        if (!icon && dd.parentElement) {
          icon = dd.parentElement.querySelector('.dropdown-trigger-icon, .custom-dropdown-icon');
        }
        if (icon) icon.classList.add('rotate-180');

        this._activeDropdownId = dropdownId;
        this._activeDropdownIconId = iconId || (icon ? icon.id : null);
        this._activeDropdownTriggerId = trigger && trigger.id ? trigger.id : null;
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
        if (options.length) {
          const selectedIndex = options.findIndex((option) => option.getAttribute('aria-selected') === 'true');
          this._focusOption(dd, selectedIndex >= 0 ? selectedIndex : 0);
        }
      }
    },

    /**
     * Dong tat ca custom dropdowns dang mo tren man hinh
     */
    closeAllCustomDropdowns() {
      if (this._activeDropdownId) {
        const dd = document.getElementById(this._activeDropdownId);
        if (dd) dd.classList.add('hidden');
      }
      if (this._activeDropdownTriggerId) {
        const trigger = document.getElementById(this._activeDropdownTriggerId);
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
      if (this._activeDropdownIconId) {
        const icon = document.getElementById(this._activeDropdownIconId);
        if (icon) icon.classList.remove('rotate-180');
      }
      this._activeDropdownId = null;
      this._activeDropdownIconId = null;
      this._activeDropdownTriggerId = null;

      // Dong tat ca cac menu co class custom dropdown/popover
      document.querySelectorAll('.custom-dropdown-menu, .vibe-popover, .custom-dropdown-popover').forEach(d => d.classList.add('hidden'));
      document.querySelectorAll('.dropdown-trigger-icon, .custom-dropdown-icon').forEach(i => i.classList.remove('rotate-180'));

      // Danh sach cac ID menu/popover cu the trong toan bo ung dung
      const specificIds = [
        'studio-category-menu',
        'studio-gender-menu',
        'studio-age-menu',
        'studio-region-popover',
        'studio-region-menu',
        'studio-occ-menu',
        'studio-uni-popover',
        'studio-duration-menu',
        'demo-uni-popover',
        'demo-gender-menu',
        'demo-province-menu',
        'demo-occupation-menu',
        'demo-income-menu',
        'user-profile-dropdown',
        'header-notif-dropdown',
        'sort-dropdown-menu',
        'length-dropdown-menu',
        'payout-points-menu',
        'payout-method-menu',
        'payout-telco-menu',
        'redeem-custom-bank-menu',
        'redeem-custom-telco-menu',
        'fast-cat-dropdown-menu',
        'admin-payout-type-menu',
        'admin-payout-status-menu',
        'admin-payout-limit-menu',
        'admin-fraud-limit-menu',
        'admin-fraud-page-menu',
        'audit-action-dropdown',
        'forum-cat-dropdown-menu',
        'forum-sort-dropdown-menu',
        'forum-post-survey-menu'
      ];
      specificIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
    },

    /**
     * Helper dong/mo bo loc trang thai Admin Bug Reports
     */
    toggleAdminBugFilterDropdown(filterKey, event) {
      const dropdownId = `admin-bug-filter-${filterKey}-dropdown`;
      const iconId = `admin-bug-filter-${filterKey}-icon`;
      const triggerId = `admin-bug-filter-${filterKey}-btn`;
      this.toggleCustomDropdown(dropdownId, iconId, event, triggerId);
    },

    /**
     * Chon muc trong bo loc Admin Bug Reports va kich hoat loc du lieu
     */
    selectAdminBugFilter(filterKey, val, label) {
      this.closeAllCustomDropdowns();
      if (typeof this.setAdminBugFilter === 'function') {
        this.setAdminBugFilter(filterKey, val);
      }
    },

    /**
     * Chuyển đổi mã trạng thái sang tên tiếng Việt chuẩn mực để hiển thị trên Dropdown
     */
    getAdminBugFilterStatusLabel(val) {
      switch (val) {
        case 'PENDING': return 'Chờ tiếp nhận';
        case 'INVESTIGATING': return 'Đang kiểm tra';
        case 'RESOLVED': return 'Đã khắc phục';
        case 'REJECTED': return 'Đã đóng / Từ chối';
        default: return 'Tất cả trạng thái';
      }
    },

    /**
     * Chuyển đổi mã danh mục sang tên tiếng Việt chuẩn mực để hiển thị trên Dropdown
     */
    getAdminBugFilterCategoryLabel(val) {
      switch (val) {
        case 'UI_UX': return 'Giao diện (UI/UX)';
        case 'SURVEY': return 'Làm Khảo Sát';
        case 'CREATOR_STUDIO': return 'Thiết Kế Khảo Sát';
        case 'PAYMENT': return 'Ví & Nạp Rút Tiền';
        case 'AUTH': return 'Đăng Nhập / Hồ Sơ';
        case 'OTHER': return 'Sự Cố Khác';
        default: return 'Tất cả danh mục';
      }
    }
  };

  // Tu dong dang ky listener khi tai trang
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => CustomDropdownModule.initDropdownListeners());
    } else {
      CustomDropdownModule.initDropdownListeners();
    }
  }

  // Mo rong vao Namespace SSOT window.VibeApp
  Object.assign(window.VibeApp, CustomDropdownModule);
  window.CustomDropdownModule = CustomDropdownModule;
})();
