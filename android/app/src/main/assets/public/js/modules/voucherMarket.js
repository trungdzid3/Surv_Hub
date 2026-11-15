/**
 * SurvHub - Voucher Market & My Vouchers Module (WAVE 1 MODULAR)
 * Gom doan "CHO VOUCHER THUONG HIEU" (VIEW 3) va "VI VOUCHER" (VIEW 4) tu public/app.js.
 * Di chuyen nguyen van khong doi bat ky hanh vi render/nghiep vu nao.
 * Cac phu thuoc goi qua this.* (api, state, showToast...) deu late-binding qua window.VibeApp.
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * @namespace window.VibeApp
 * @requires window.VibeApp (core: api, state, showToast, showModal, haptic, navigate, openAuthModal,
 *           applyUserInterface, getBrandLogoHtml, isEnterpriseUser, renderGuestLockedView),
 *           lucide (global)
 * @exports renderVoucherMarketView, redeemVoucher, renderMyVouchersView
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const refreshVoucherIcons = (scopeEl) => {
    if (window.VibeUtils && window.VibeUtils.refreshIcons) {
      window.VibeUtils.refreshIcons(scopeEl);
    } else if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  };

  const isUserTypingInRoot = (root) => {
    if (!root || typeof document === 'undefined') return false;
    const activeEl = document.activeElement;
    if (!activeEl || !root.contains(activeEl)) return false;
    const tag = activeEl.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(activeEl.isContentEditable);
  };

  const VoucherMarketModule = {
  // ==================== VIEW 3: CHỢ VOUCHER THƯƠNG HIỆU ====================
  _paintVoucherMarketView(root, vouchers = []) {
    if (!root) return;
    const user = this.state.currentUser;
    const isEnterprise = this.isEnterpriseUser();
    const userPoints = user ? user.point_balance : 0;

    root.innerHTML = `
      <div class="space-y-6">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Chợ Đổi E-Voucher Quà Tặng</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quy đổi điểm thưởng khảo sát lấy mã ưu đãi Shopee, Grab, Highlands Coffee, Phúc Long, CGV Cinemas, Starbucks.</p>
          </div>
          ${!isEnterprise ? `
            <div class="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 px-3.5 py-2 rounded-xl shadow-2xs self-start font-mono">
              Số dư khả dụng: <strong class="text-orange-600 dark:text-orange-400 font-bold">${(window.VibeUtils && window.VibeUtils.formatVND ? window.VibeUtils.formatVND(userPoints) : Number(userPoints || 0).toLocaleString('vi-VN'))}</strong> Điểm
            </div>
          ` : `
            <div class="text-xs font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3.5 py-2 rounded-xl self-start">
              Góc nhìn Doanh Nghiệp
            </div>
          `}
        </div>

        ${isEnterprise ? `
          <div class="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-xs text-orange-900 dark:text-orange-200 flex items-center gap-3">
            <i data-lucide="info" class="w-5 h-5 text-orange-600 shrink-0"></i>
            <div>
              <strong class="font-bold">Lưu ý cho Doanh Nghiệp:</strong> Tài khoản Doanh Nghiệp không tích lũy điểm thưởng khảo sát. Chợ E-Voucher quy đổi điểm chỉ dành riêng cho Người Điền hoàn thành bài khảo sát.
            </div>
          </div>
        ` : ''}

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          ${vouchers.map(v => {
      const isOutOfStock = (v.remaining_quantity || 0) <= 0;
      const canAfford = !isOutOfStock && (userPoints >= v.points_cost);
      let btnText = 'Đổi Voucher';
      let btnClass = 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs active:scale-95';

      if (isEnterprise) {
        btnText = 'Dành cho Người Điền';
        btnClass = 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed border border-stone-200/60 dark:border-stone-700/60';
      } else if (isOutOfStock) {
        btnText = 'Hết Mã';
        btnClass = 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed border border-stone-200/60 dark:border-stone-700/60';
      } else if (!canAfford) {
        btnText = 'Chưa đủ điểm';
        btnClass = 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed border border-stone-200/60 dark:border-stone-700/60';
      }

      return `
              <div class="bento-card p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        ${this.getBrandLogoHtml(v.brand_name, v.website_domain, v.brand_logo)}
                      </div>
                      <div>
                        <div class="font-bold text-sm text-stone-900 dark:text-stone-100 leading-snug truncate max-w-[150px]">
                          ${v.brand_name}
                        </div>
                        <span class="text-[11px] text-stone-400 font-mono">E-Voucher Chính Hãng</span>
                      </div>
                    </div>
                    <span class="font-mono text-[11px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${isOutOfStock
          ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-300 dark:border-stone-700'
          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200/60 dark:border-stone-700/60'
        }">
                      ${isOutOfStock ? 'Hết mã' : `Còn ${v.remaining_quantity} mã`}
                    </span>
                  </div>
                  <h3 class="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 leading-snug line-clamp-2">${v.title}</h3>
                  <p class="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">${v.instructions || 'Áp dụng trên toàn quốc'}</p>
                  
                  <div class="pt-1 text-xs text-stone-600 dark:text-stone-400 font-medium">
                    Trị giá: <strong class="text-stone-900 dark:text-stone-100 font-mono font-bold">${(window.VibeUtils && window.VibeUtils.formatVND ? window.VibeUtils.formatVND(v.face_value_vnd) : Number(v.face_value_vnd || 0).toLocaleString('vi-VN'))} VNĐ</strong>
                  </div>
                </div>

                <div class="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div class="text-xs">
                    <span class="text-stone-400 block font-normal text-[11px]">Chi phí đổi:</span>
                    <strong class="text-sm sm:text-base font-bold text-orange-600 dark:text-orange-500 font-mono">${(window.VibeUtils && window.VibeUtils.formatVND ? window.VibeUtils.formatVND(v.points_cost) : Number(v.points_cost || 0).toLocaleString('vi-VN'))} Điểm</strong>
                  </div>
                  <button onclick="VibeApp.redeemVoucher('${v.id}')" 
                          ${(isEnterprise || isOutOfStock || !canAfford) ? 'disabled' : ''}
                          class="h-9 px-4 rounded-lg text-xs font-bold transition-all ${btnClass}">
                    ${btnText}
                  </button>
                </div>
              </div>
            `;
    }).join('')}
        </div>

      </div>
    `;

    refreshVoucherIcons(root);
  },

  async renderVoucherMarketView(root) {
    if (!root) return;

    let hasCatalogCache = Array.isArray(this.state.voucherCatalog) && (this.state.voucherCatalog.length > 0 || Boolean(this._voucherCatalogLoaded));
    if (!hasCatalogCache) {
      try {
        const rawCatalog = sessionStorage.getItem('survhub_voucher_catalog_cache');
        if (rawCatalog) {
          const parsedCatalog = JSON.parse(rawCatalog);
          if (Array.isArray(parsedCatalog)) {
            this.state.voucherCatalog = parsedCatalog;
            hasCatalogCache = true;
          } else if (parsedCatalog && Array.isArray(parsedCatalog.vouchers)) {
            this.state.voucherCatalog = parsedCatalog.vouchers;
            hasCatalogCache = true;
          }
        }
      } catch (e) {}
    }

    if (!this.state.voucherDeals) {
      try {
        const rawDeals = sessionStorage.getItem('survhub_voucher_deals_cache');
        if (rawDeals) {
          const parsedDeals = JSON.parse(rawDeals);
          if (parsedDeals && (Array.isArray(parsedDeals) || typeof parsedDeals === 'object')) {
            this.state.voucherDeals = parsedDeals;
          }
        }
      } catch (e) {}
    }

    const prevSnapshot = JSON.stringify({
      vouchers: this.state.voucherCatalog || [],
      deals: this.state.voucherDeals || null
    });

    const reqToken = (this._voucherCatalogFetchSeq = (this._voucherCatalogFetchSeq || 0) + 1);

    if (hasCatalogCache) {
      this._paintVoucherMarketView(root, this.state.voucherCatalog || []);

      this.api('/vouchers/catalog')
        .then((res) => {
          if (reqToken !== this._voucherCatalogFetchSeq) return;
          const latestVouchers = (res && res.vouchers) || [];
          this.state.voucherCatalog = latestVouchers;
          this._voucherCatalogLoaded = true;
          try {
            sessionStorage.setItem('survhub_voucher_catalog_cache', JSON.stringify(latestVouchers));
            if (res && res.deals !== undefined) {
              this.state.voucherDeals = res.deals;
              sessionStorage.setItem('survhub_voucher_deals_cache', JSON.stringify(res.deals));
            }
          } catch (e) {}

          const nextSnapshot = JSON.stringify({
            vouchers: latestVouchers,
            deals: this.state.voucherDeals || null
          });
          if (nextSnapshot !== prevSnapshot && this.state.currentTab === 'voucher-market' && root.isConnected && !isUserTypingInRoot(root)) {
            this._paintVoucherMarketView(root, latestVouchers);
          }
        })
        .catch((err) => {
          console.warn('Lỗi đồng bộ chợ voucher nền:', err && err.message ? err.message : err);
        });
      return;
    }

    const res = await this.api('/vouchers/catalog');
    if (reqToken !== this._voucherCatalogFetchSeq) return;
    const vouchers = (res && res.vouchers) || [];
    this.state.voucherCatalog = vouchers;
    this._voucherCatalogLoaded = true;
    try {
      sessionStorage.setItem('survhub_voucher_catalog_cache', JSON.stringify(vouchers));
      if (res && res.deals !== undefined) {
        this.state.voucherDeals = res.deals;
        sessionStorage.setItem('survhub_voucher_deals_cache', JSON.stringify(res.deals));
      }
    } catch (e) {}

    if (root.isConnected && (!this.state.currentTab || this.state.currentTab === 'voucher-market')) {
      this._paintVoucherMarketView(root, vouchers);
    }
  },

  async redeemVoucher(campaignId) {
    if (this.isEnterpriseUser()) {
      this.showToast('Tài khoản Doanh Nghiệp không sử dụng điểm thưởng để đổi E-Voucher', 'info');
      return;
    }
    if (!this.state.currentUser) {
      this.showToast('Vui lòng đăng nhập để đổi voucher!', 'info');
      this.openAuthModal('login');
      return;
    }

    this.showToast('Đang xử lý đổi voucher...', 'info');

    try {
      const res = await this.api('/vouchers/redeem', {
        method: 'POST',
        body: JSON.stringify({ campaign_id: campaignId })
      });

      if (res.success) {
        this.haptic('success');
        if (this.state.currentUser && res.newPointBalance !== undefined) {
          this.state.currentUser.point_balance = res.newPointBalance;
        }
        if (Array.isArray(this.state.voucherCatalog)) {
          const item = this.state.voucherCatalog.find(v => v.id === campaignId);
          if (item && Number(item.remaining_quantity) > 0) {
            item.remaining_quantity = Number(item.remaining_quantity) - 1;
          }
          try {
            sessionStorage.setItem('survhub_voucher_catalog_cache', JSON.stringify(this.state.voucherCatalog));
          } catch (e) {}
        }
        if (res.voucher && this.state.currentUser) {
          const userId = String(this.state.currentUser.id || '');
          const nextItem = { claimed_at: new Date().toISOString(), ...res.voucher };
          if (Array.isArray(this.state.myVouchers)) {
            this.state.myVouchers = [nextItem, ...this.state.myVouchers];
          } else {
            this.state.myVouchers = [nextItem];
          }
          this._myVouchersOwnerId = userId;
          try {
            sessionStorage.setItem('survhub_my_vouchers_cache', JSON.stringify(this.state.myVouchers));
            if (userId) sessionStorage.setItem('survhub_my_vouchers_owner', userId);
          } catch (e) {}
        }
        this.applyUserInterface();

        this.showModal({
          title: 'Đổi Mã Thành Công',
          content: `
            <div class="space-y-4 py-2 text-center">
              <div class="w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-xs">
                ${this.getBrandLogoHtml(res.voucher.brand_name, res.voucher.website_domain, res.voucher.brand_logo)}
              </div>
              <div>
                <h4 class="text-base font-bold text-slate-900">${res.voucher.title}</h4>
                <p class="text-xs text-slate-500 mt-1">${res.voucher.instructions}</p>
              </div>
              <div class="p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-sm font-bold text-slate-900 flex justify-between items-center">
                <span class="tracking-wider">${res.voucher.code}</span>
                <button onclick="VibeApp.copyText('${res.voucher.code}')" class="px-3 py-1 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700">Sao chép</button>
              </div>
              <div class="flex gap-2 pt-1">
                <button onclick="VibeApp.closeModal(); VibeApp.navigate('my-vouchers')" class="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">
                  Xem Ví Voucher
                </button>
                <button onclick="VibeApp.closeModal()" class="py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                  Đóng
                </button>
              </div>
            </div>
          `
        });
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ==================== VIEW 4: VÍ VOUCHER ====================
  _paintMyVouchersView(root, vouchers = []) {
    if (!root) return;
    root.innerHTML = `
      <div class="space-y-6">
        
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">Ví Voucher Của Tôi</h1>
            <p class="text-xs text-slate-500 mt-0.5">Danh sách mã quà tặng đã nhận từ các khảo sát tài trợ hoặc đổi từ chợ.</p>
          </div>
          <button onclick="VibeApp.navigate('voucher-market')" class="px-4 py-2 bg-slate-900 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors">
            + Đổi thêm voucher
          </button>
        </div>

        ${vouchers.length === 0 ? `
          <div class="bento-card p-12 text-center space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <i data-lucide="ticket" class="w-6 h-6 stroke-[2]"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-800">Ví voucher của bạn đang trống</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">Hãy tham gia các khảo sát có quà hoặc dùng điểm thưởng để đổi voucher.</p>
            <button onclick="VibeApp.navigate('voucher-market')" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
              Đến Chợ Voucher
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${vouchers.map(v => `
              <div class="voucher-clean-card space-y-3">
                <div class="flex justify-between items-center text-xs">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                      ${this.getBrandLogoHtml(v.brand_name, v.website_domain, v.brand_logo)}
                    </div>
                    <div>
                      <span class="font-extrabold text-slate-900">${this.escapeHtml(v.brand_name || 'Voucher Quà')}</span>
                      <span class="block text-[10px] text-slate-400 font-mono">E-Voucher Chính Hãng</span>
                    </div>
                  </div>
                  <span class="text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-orange-200/60">Khả dụng</span>
                </div>
                <h3 class="text-sm font-extrabold text-slate-900">${this.escapeHtml(v.title)}</h3>
                
                <div class="p-3 bg-slate-50 rounded-xl font-mono text-xs font-bold text-slate-900 flex justify-between items-center border border-slate-200/60">
                  <span class="tracking-wider select-all">${this.escapeHtml(v.code)}</span>
                  <button type="button" data-copy-code="${this.escapeHtml(v.code)}" onclick="VibeApp.copyText(this.dataset.copyCode)" class="text-orange-600 text-xs font-bold hover:underline">Sao chép</button>
                </div>
                
                <div class="text-[11px] text-slate-400 font-medium">
                  Nhận lúc: ${v.claimed_at ? new Date(v.claimed_at).toLocaleDateString('vi-VN') : 'Gần đây'}
                </div>
              </div>
            `).join('')}
          </div>
        `}

      </div>
    `;

    refreshVoucherIcons(root);
  },

  async renderMyVouchersView(root) {
    if (!root) return;
    if (!this.state.currentUser) {
      this.renderGuestLockedView(root, 'Ví Voucher Của Tôi', 'Vui lòng đăng nhập để xem và sao chép các mã voucher quà tặng bạn đã đổi.');
      return;
    }

    const userId = String(this.state.currentUser.id || '');
    if (this._myVouchersOwnerId && userId && this._myVouchersOwnerId !== userId) {
      this.state.myVouchers = [];
      this._myVouchersLoaded = false;
    }

    let hasMyVouchersCache = Array.isArray(this.state.myVouchers) && (
      this.state.myVouchers.length > 0 || (Boolean(this._myVouchersLoaded) && this._myVouchersOwnerId === userId)
    );

    if (!hasMyVouchersCache) {
      try {
        const cachedOwner = sessionStorage.getItem('survhub_my_vouchers_owner');
        if (!cachedOwner || !userId || cachedOwner === userId) {
          const rawMyVouchers = sessionStorage.getItem('survhub_my_vouchers_cache');
          if (rawMyVouchers) {
            const parsedMyVouchers = JSON.parse(rawMyVouchers);
            if (Array.isArray(parsedMyVouchers)) {
              this.state.myVouchers = parsedMyVouchers;
              this._myVouchersOwnerId = userId;
              hasMyVouchersCache = true;
            }
          }
        } else {
          sessionStorage.removeItem('survhub_my_vouchers_cache');
          sessionStorage.removeItem('survhub_my_vouchers_owner');
        }
      } catch (e) {}
    }

    const prevJson = JSON.stringify(this.state.myVouchers || []);
    const reqToken = (this._myVouchersFetchSeq = (this._myVouchersFetchSeq || 0) + 1);

    if (hasMyVouchersCache) {
      this._paintMyVouchersView(root, this.state.myVouchers || []);

      this.api('/vouchers/my-vouchers')
        .then((res) => {
          if (reqToken !== this._myVouchersFetchSeq) return;
          const latestVouchers = (res && res.vouchers) || [];
          this.state.myVouchers = latestVouchers;
          this._myVouchersLoaded = true;
          this._myVouchersOwnerId = userId;
          const nextJson = JSON.stringify(latestVouchers);
          try {
            sessionStorage.setItem('survhub_my_vouchers_cache', nextJson);
            if (userId) sessionStorage.setItem('survhub_my_vouchers_owner', userId);
          } catch (e) {}

          if (nextJson !== prevJson && this.state.currentTab === 'my-vouchers' && root.isConnected && !isUserTypingInRoot(root)) {
            this._paintMyVouchersView(root, latestVouchers);
          }
        })
        .catch((err) => {
          console.warn('Lỗi đồng bộ ví voucher nền:', err && err.message ? err.message : err);
        });
      return;
    }

    const res = await this.api('/vouchers/my-vouchers');
    if (reqToken !== this._myVouchersFetchSeq) return;
    const vouchers = (res && res.vouchers) || [];
    this.state.myVouchers = vouchers;
    this._myVouchersLoaded = true;
    this._myVouchersOwnerId = userId;
    try {
      sessionStorage.setItem('survhub_my_vouchers_cache', JSON.stringify(vouchers));
      if (userId) sessionStorage.setItem('survhub_my_vouchers_owner', userId);
    } catch (e) {}

    if (root.isConnected && (!this.state.currentTab || this.state.currentTab === 'my-vouchers')) {
      this._paintMyVouchersView(root, vouchers);
    }
  },
  };

  // Mo rong vao Namespace SSOT window.VibeApp
  Object.assign(window.VibeApp, VoucherMarketModule);
  window.VoucherMarketModule = VoucherMarketModule;
})();
