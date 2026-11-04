/**
 * SurvHub - Wallet & Ledger Module (WAVE 2 MODULAR)
 * Gom doan "VI & RUT TIEN" (VIEW 5) tu public/app.js: so du, lich su giao dich, so cai ledger,
 * doi thuong/rut tien (payout), doi diem sang credit (swap), nap quy creator (deposit VietQR).
 * Di chuyen nguyen van khong doi bat ky hanh vi render/nghiep vu nao.
 * Cac phu thuoc goi qua this.* (api, state, showToast...) deu late-binding qua window.VibeApp.
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * @namespace window.VibeApp
 * @requires window.VibeApp (core: api, state, showToast, showModal, haptic, closeModal, navigateTo,
 *           applyUserInterface, renderGuestLockedView, getLucideSvg, escapeHtml, copyValue,
 *           toggleCustomDropdown, closeAllCustomDropdowns, selectCustomFormOption), lucide (global)
 * @exports renderWalletView, toggleWalletLedgerAccordion, switchWalletTab, filterWalletTransactions,
 *          renderTransactionRowHtml, renderWalletTransactionList, toggleWalletTimeDropdown,
 *          selectWalletTimeRange, openPayoutModal, updatePayoutUI, submitPayoutAction,
 *          openSwapPointsModal, updateSwapPointsPreview, submitSwapPoints, calculateDepositBonus,
 *          updateDepositCalc, setDepositPreset, openDepositModal, submitDepositAction,
 *          showVietQrPaymentModal, checkDepositStatus, simulatePaymentSuccess
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const formatMoney = (val) => (window.VibeUtils && window.VibeUtils.formatVND ? window.VibeUtils.formatVND(val) : Number(val || 0).toLocaleString('vi-VN'));
  const refreshIcons = () => {
    if (window.VibeUtils && window.VibeUtils.refreshIcons) {
      window.VibeUtils.refreshIcons();
    } else if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  };

  const WalletLedgerModule = {
  // ==================== VIEW 5: VÍ & RÚT TIỀN (MODERN FINTECH) ====================
  async renderWalletView(root) {
    if (!this.state.currentUser) {
      this.renderGuestLockedView(root, 'Ví & Rút Tiền', 'Vui lòng đăng nhập để quản lý số dư điểm thưởng, lịch sử giao dịch và gửi yêu cầu đổi thưởng về tài khoản.');
      return;
    }

    const [res, payoutsRes] = await Promise.all([
      this.api('/wallet'),
      this.api('/wallet/payouts').catch(() => ({ payouts: [] }))
    ]);
    const wallet = res.wallet || {};
    const transactions = res.transactions || [];
    const payouts = (payoutsRes && payoutsRes.payouts) || [];
    this.state.wallet = wallet;
    this.state.transactions = transactions;
    this.state.payouts = payouts;

    const curPoints = Number(wallet.point_balance || 0);
    const curCredit = Number(wallet.credit_balance || 0);
    const payoutGoal = 10000; // Mốc đổi thưởng tối thiểu từ 10.000 điểm
    const canPayout = curPoints >= payoutGoal;
    const payoutPercentRaw = (curPoints / payoutGoal) * 100;
    const payoutPercent = Math.min(100, Math.max(0.5, payoutPercentRaw)).toFixed(1).replace('.', ',');
    const progressWidth = Math.min(100, Math.max(2, payoutPercentRaw));

    root.innerHTML = `
      <div class="space-y-6 max-w-5xl mx-auto">
        
        <!-- HEADER TRANG VÍ: ICON + TIÊU ĐỀ + BREADCRUMB (CHUẨN BẢN VẼ) -->
        <div class="flex items-center justify-between pb-1">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              ${this.getLucideSvg("wallet", "w-5 h-5 stroke-[2.2]")}
            </div>
            <div>
              <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Ví & Rút Tiền</h1>
              <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-normal">Quản lý điểm thưởng, Credit và lịch sử giao dịch của bạn.</p>
            </div>
          </div>
          <div class="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 font-medium">
            ${this.getLucideSvg("home", "w-3.5 h-3.5")}
            <span>/</span>
            <span class="text-stone-600 dark:text-stone-300 font-semibold">Ví & Rút Tiền</span>
          </div>
        </div>
        <!-- HÀNG THẺ BENTO SỐ DƯ: 2 CỘT NGANG HÀNG NHAU (POINT & CREDIT) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <!-- THẺ 1: POINT CỦA BẠN (SUNSET ORANGE GRADIENT CARD) -->
          <div class="rounded-3xl p-6 sm:p-7 text-white flex flex-col justify-between shadow-sm relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-500 to-orange-500 min-h-[260px]">
            <img src="/assets/3d/wallet_3d_master.svg" class="absolute right-2 sm:right-5 top-2 sm:top-4 w-44 sm:w-52 h-auto object-contain pointer-events-none select-none z-0 opacity-75 dark:opacity-50 drop-shadow-sm" alt="3D Orange Wallet" />
            <!-- Nội dung Thẻ Point -->
            <div class="relative z-10">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-xs text-white border border-white/25 shadow-2xs">
                ${this.getLucideSvg("star", "w-3.5 h-3.5 fill-white text-white")}
                <span class="tracking-wide uppercase text-[11px]">POINT CỦA BẠN</span>
              </div>

              <div class="mt-4">
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight drop-shadow-xs">${formatMoney(curPoints)}</span>
                  <span class="text-xl sm:text-2xl font-bold text-white drop-shadow-xs">Point</span>
                </div>
                <div class="text-xs sm:text-sm font-medium text-white/95 mt-0.5 font-mono">
                  ≈ ${formatMoney(curPoints)} VNĐ
                </div>
              </div>
            </div>

            <!-- Thanh tiến độ & Nút CTA -->
            <div class="relative z-10 pt-4">
              <div class="flex items-center justify-between text-xs font-semibold text-white/95">
                <span class="flex items-center gap-1.5 truncate">
                  ${this.getLucideSvg("flag", "w-3.5 h-3.5 stroke-[2.2] shrink-0")}
                  <span class="truncate">Mục tiêu: 10.000 Point</span>
                </span>
                <span class="font-mono font-bold text-xs shrink-0">${payoutPercent}%</span>
              </div>

              <div class="w-full bg-white/25 h-2 rounded-full overflow-hidden mt-2 p-0.5">
                <div class="bg-white h-full rounded-full transition-all duration-500 relative" style="width: ${progressWidth}%"></div>
              </div>

              <div class="text-[11px] text-white/85 mt-1 font-medium truncate">
                Đạt ${payoutPercent}% điều kiện rút tiền
              </div>

              <button type="button" onclick="VibeApp.openPayoutModal()" 
                      class="w-full py-3 px-4 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs flex items-center justify-center gap-2 mt-4 transition-all active:scale-98 cursor-pointer border border-white/25 shadow-xs">
                ${this.getLucideSvg("gift", "w-4 h-4")}
                <span>Đổi thưởng / Rút tiền</span>
                ${this.getLucideSvg("chevron-right", "w-3.5 h-3.5")}
              </button>
            </div>
          </div>

          <!-- THẺ 2: CREDIT CỦA BẠN (WHITE MODERN CARD) -->
          <div class="bg-white dark:bg-[#18181B] rounded-3xl p-6 sm:p-7 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[260px]">
            <img src="/assets/3d/coins_coupon_3d_master.svg" class="absolute right-2 sm:right-5 top-2 sm:top-4 w-44 sm:w-52 h-auto object-contain pointer-events-none select-none z-0 opacity-90 dark:opacity-75 drop-shadow-sm" alt="3D Coins and Coupon" />
            <!-- Nội dung Thẻ Credit -->
            <div class="relative z-10">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center shrink-0">
                  ${this.getLucideSvg("coins", "w-4 h-4")}
                </div>
                <span class="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">CREDIT</span>
              </div>

              <div class="mt-4">
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl sm:text-4xl font-extrabold font-mono text-stone-900 dark:text-white tracking-tight">${formatMoney(curCredit)}</span>
                  <span class="text-sm font-bold text-stone-500 dark:text-stone-400">Credit</span>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 mt-2 font-medium">
                  ${this.getLucideSvg("info", "w-3.5 h-3.5 text-stone-400 shrink-0")}
                  <span class="truncate">Dùng tạo khảo sát & tài trợ voucher.</span>
                </div>
              </div>
            </div>

            <!-- Nút CTA Nạp Credit -->
            <div class="relative z-10 pt-4">
              <button type="button" onclick="VibeApp.openDepositModal()" 
                      class="w-full py-3 px-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center justify-center gap-2 mt-4 transition-all active:scale-98 cursor-pointer border border-orange-200/60 dark:border-orange-800/60 shadow-xs">
                ${this.getLucideSvg("plus", "w-4 h-4 stroke-[2.5]")}
                <span>Nạp Credit</span>
              </button>
            </div>
          </div>
        </div>

        <!-- KHỐI LỊCH SỬ GIAO DỊCH: TABS + TIME SELECTOR + FLAT CARDS (CHUẨN BẢN VẼ) -->
        <div id="wallet-tx-history-section" class="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <!-- Header Lịch sử -->
          <div class="flex items-center justify-between pb-1">
            <div class="flex items-center gap-2.5">
              ${this.getLucideSvg("history", "w-5 h-5 text-orange-500 stroke-[2.2]")}
              <h3 class="text-base font-bold text-stone-900 dark:text-white tracking-tight">Lịch sử giao dịch</h3>
            </div>
            <a href="javascript:void(0)" onclick="VibeApp.switchWalletTab('ALL')" class="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors">
              <span>Xem tất cả</span>
              ${this.getLucideSvg("arrow-right", "w-3.5 h-3.5")}
            </a>
          </div>

          <!-- Filter Tabs + Date Filter Selector -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-stone-100 dark:border-stone-800/80 pb-3">
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button type="button" onclick="VibeApp.filterWalletTransactions('ALL')" id="tab-tx-all" class="px-4 py-1.5 rounded-full text-xs font-bold bg-orange-600 text-white shadow-xs transition-all cursor-pointer">
                Tất cả
              </button>
              <button type="button" onclick="VibeApp.filterWalletTransactions('REWARD')" id="tab-tx-reward" class="px-4 py-1.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all cursor-pointer">
                Nhận thưởng
              </button>
              <button type="button" onclick="VibeApp.filterWalletTransactions('SWAP')" id="tab-tx-swap" class="px-4 py-1.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all cursor-pointer">
                Đổi Credit
              </button>
              <button type="button" onclick="VibeApp.filterWalletTransactions('PAYOUT')" id="tab-tx-payout" class="px-4 py-1.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all cursor-pointer">
                Rút tiền
              </button>
            </div>

            <!-- Time Filter Dropdown (Custom Dropdown chuẩn) -->
            <div class="relative">
              <button type="button" onclick="VibeApp.toggleWalletTimeDropdown(event)" class="custom-dropdown-trigger inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold text-stone-600 dark:text-stone-300 shadow-2xs hover:bg-stone-50 transition-colors cursor-pointer">
                ${this.getLucideSvg("calendar", "w-3.5 h-3.5 text-stone-400")}
                <span id="wallet-time-dropdown-label">30 ngày gần đây</span>
                ${this.getLucideSvg("chevron-down", "dropdown-trigger-icon w-3.5 h-3.5 text-stone-400 pointer-events-none")}
              </button>
              <div id="wallet-time-dropdown-menu" class="custom-dropdown-menu hidden absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-lg py-1 z-50 text-xs space-y-0.5">
                <div onclick="VibeApp.selectWalletTimeRange(7, '7 ngày gần đây')" class="px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer font-medium text-stone-700 dark:text-stone-300 rounded-lg mx-1">7 ngày gần đây</div>
                <div onclick="VibeApp.selectWalletTimeRange(30, '30 ngày gần đây')" class="px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer font-bold text-orange-600 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg mx-1">30 ngày gần đây</div>
                <div onclick="VibeApp.selectWalletTimeRange(90, '90 ngày gần đây')" class="px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer font-medium text-stone-700 dark:text-stone-300 rounded-lg mx-1">90 ngày gần đây</div>
                <div onclick="VibeApp.selectWalletTimeRange(365, 'Tất cả thời gian')" class="px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer font-medium text-stone-700 dark:text-stone-300 rounded-lg mx-1">Tất cả thời gian</div>
              </div>
            </div>
          </div>

          <!-- Transaction Items List -->
          <div class="space-y-2.5 pt-1" id="wallet-tx-list-container">
            ${transactions.length === 0 ? `
              ${this.renderTransactionRowHtml({
                type: 'CHECKIN_REWARD',
                description: 'Thưởng điểm danh',
                streak_day: 1,
                amount: 50,
                currency: 'POINT',
                created_at: '2026-10-30T09:00:00Z',
                status: 'COMPLETED'
              })}
              ${this.renderTransactionRowHtml({
                type: 'SWAP_POINTS_TO_CREDIT',
                description: 'Đổi Point sang Credit',
                amount: 500,
                currency: 'CREDIT',
                created_at: '2026-10-28T14:30:00Z',
                status: 'COMPLETED'
              })}
            ` : transactions.slice(0, 10).map(tx => this.renderTransactionRowHtml(tx)).join('')}
          </div>
        </div>

        <!-- KHỐI SỔ CÁI GIAO DỊCH: MINH BẠCH ACCORDION & TABLE (CHUẨN BẢN VẼ) -->
        <div id="wallet-ledger-card" class="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
          <div class="flex items-center justify-between cursor-pointer select-none" onclick="VibeApp.toggleWalletLedgerAccordion()">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center">
                ${this.getLucideSvg("book-open", "w-3.5 h-3.5 stroke-[2.2]")}
              </div>
              <h3 class="text-sm font-bold text-stone-900 dark:text-white">Sổ cái giao dịch</h3>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800">
                ${this.getLucideSvg("check-circle-2", "w-3 h-3 stroke-[2.5]")} Minh bạch
              </span>
            </div>
            <i id="wallet-ledger-chevron" data-lucide="chevron-up" class="w-4 h-4 text-stone-400 transition-transform duration-200"></i>
          </div>
          <p class="text-[11px] text-stone-400 dark:text-stone-500">Lưu trữ toàn bộ biến động số dư, phục vụ kiểm tra và đối soát.</p>

          <div id="wallet-ledger-table-wrap" class="overflow-x-auto pt-2">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-stone-200 dark:border-stone-800 text-[11px] font-bold text-stone-400 dark:text-stone-500">
                  <th class="pb-3 px-3.5">Mã giao dịch</th>
                  <th class="pb-3 px-3.5">Loại giao dịch</th>
                  <th class="pb-3 px-3.5">Số tiền</th>
                  <th class="pb-3 px-3.5">Số dư sau giao dịch</th>
                  <th class="pb-3 px-3.5">Thời gian</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 dark:divide-stone-800/60">
                ${transactions.length === 0 ? `
                  <tr>
                    <td class="py-3 px-3.5 font-mono text-stone-500">#TXN000001</td>
                    <td class="py-3 px-3.5 font-bold text-stone-900 dark:text-white font-mono text-[11px]">SURVEY_REWARD</td>
                    <td class="py-3 px-3.5 font-mono font-bold text-orange-600 dark:text-orange-400">+50 Point</td>
                    <td class="py-3 px-3.5 font-mono font-bold text-stone-900 dark:text-white">50 Point</td>
                    <td class="py-3 px-3.5 text-stone-500 text-[11px] font-mono">30/10/2026 14:23:17</td>
                  </tr>
                ` : transactions.slice(0, 15).map(t => {
                  const isPlus = Number(t.amount || 0) > 0;
                  return `
                    <tr class="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors">
                      <td class="py-3 px-3.5 font-mono text-stone-500">#${t.id || 'TXN'}</td>
                      <td class="py-3 px-3.5 font-bold text-stone-900 dark:text-white font-mono text-[11px]">${t.type || t.tx_type || 'TRANSACTION'}</td>
                      <td class="py-3 px-3.5 font-mono font-bold ${isPlus ? 'text-orange-600 dark:text-orange-400' : 'text-stone-900 dark:text-stone-100'}">
                        ${isPlus ? '+' : ''}${formatMoney(t.amount)} ${t.currency || 'POINT'}
                      </td>
                      <td class="py-3 px-3.5 font-mono font-bold text-stone-700 dark:text-stone-300">${formatMoney(t.balance_after)}</td>
                      <td class="py-3 px-3.5 text-stone-500 text-[11px] font-mono">${new Date(t.created_at).toLocaleString('vi-VN')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    refreshIcons();
  },

  // ==================== TƯƠNG TÁC TRANG VÍ (WALLET INTERACTION ENGINE) ====================
  toggleWalletLedgerAccordion() {
    const wrap = document.getElementById('wallet-ledger-table-wrap');
    const chevron = document.getElementById('wallet-ledger-chevron');
    if (wrap) {
      wrap.classList.toggle('hidden');
      if (chevron) {
        chevron.classList.toggle('rotate-180');
      }
    }
  },

  switchWalletTab(type = 'ALL') {
    this.filterWalletTransactions(type);
    const txSection = document.getElementById('wallet-tx-history-section');
    if (txSection) {
      txSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  filterWalletTransactions(type) {
    this.state.currentWalletFilter = (type || 'ALL').toUpperCase();
    const filterTypes = ['all', 'reward', 'swap', 'payout'];
    filterTypes.forEach(t => {
      const btn = document.getElementById('tab-tx-' + t);
      if (btn) {
        if (t === this.state.currentWalletFilter.toLowerCase()) {
          btn.className = 'px-4 py-1.5 rounded-full text-xs font-bold bg-orange-600 text-white shadow-xs transition-all cursor-pointer';
        } else {
          btn.className = 'px-4 py-1.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all cursor-pointer';
        }
      }
    });

    const allTx = this.state.transactions || [];
    let filtered = allTx;
    if (this.state.currentWalletFilter === 'REWARD') {
      filtered = allTx.filter(tx => 
        tx.type === 'SURVEY_REWARD' || 
        tx.type === 'CHECKIN_REWARD' || 
        (tx.description && (tx.description.toLowerCase().includes('thưởng') || tx.description.toLowerCase().includes('điểm danh')))
      );
    } else if (this.state.currentWalletFilter === 'SWAP') {
      filtered = allTx.filter(tx => 
        tx.type === 'SWAP_POINTS_TO_CREDIT' || 
        (tx.description && tx.description.toLowerCase().includes('credit'))
      );
    } else if (this.state.currentWalletFilter === 'PAYOUT') {
      filtered = allTx.filter(tx => 
        tx.type === 'PAYOUT' || 
        (tx.type && tx.type.includes('PAYOUT')) || 
        (tx.description && tx.description.toLowerCase().includes('rút'))
      );
    }

    if (this.state.walletTimeDays && this.state.walletTimeDays < 365) {
      const cutoff = Date.now() - (this.state.walletTimeDays * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(tx => new Date(tx.created_at).getTime() >= cutoff);
    }

    this.renderWalletTransactionList(filtered);
  },

  renderTransactionRowHtml(tx) {
    if (!tx) return '';
    const isPositive = Number(tx.amount || 0) > 0;
    const isPoint = (tx.currency || 'POINT').toUpperCase() === 'POINT';
    const amountVal = Math.abs(Number(tx.amount || 0));
    const prefix = isPositive ? '+' : '-';
    const amtStr = prefix + formatMoney(amountVal) + (isPoint ? ' Point' : ' Credit');

    const typeUpper = (tx.type || '').toUpperCase();
    const rawDesc = tx.description || tx.type || 'Giao dịch ví';
    const normDesc = rawDesc.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    let iconName = 'arrow-up-right';
    let iconWrapCls = 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300';
    let title = this.escapeHtml(rawDesc);
    let subInfo = `${tx.created_at ? new Date(tx.created_at).toLocaleDateString('vi-VN') : '30/10/2026'} · Mã #${tx.id || 'TXN'}`;
    let amountCls = isPositive ? 'text-orange-600 dark:text-orange-400' : 'text-stone-700 dark:text-stone-300';
    let statusBadge = `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
        ${this.getLucideSvg('check', 'w-3 h-3 stroke-[2.5]')} Thành công
      </span>
    `;

    // Nhận diện phân loại thông minh (hỗ trợ cả có dấu và không dấu tiếng Việt)
    if (typeUpper.includes('CHECKIN') || normDesc.includes('diem danh') || normDesc.includes('streak')) {
      iconName = 'gift';
      iconWrapCls = 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400';
      title = tx.description || 'Thưởng điểm danh';
      subInfo = `${tx.created_at ? new Date(tx.created_at).toLocaleDateString('vi-VN') : '30/10/2026'} · Điểm danh ngày ${tx.streak_day || 1}`;
      amountCls = 'text-orange-600 dark:text-orange-400';
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
          ${this.getLucideSvg('check', 'w-3 h-3 stroke-[2.5]')} Thành công
        </span>
      `;
    } else if (typeUpper.includes('SWAP') || normDesc.includes('doi credit') || normDesc.includes('doi point') || normDesc.includes('swap') || normDesc.includes('chuyen doi')) {
      iconName = 'refresh-cw';
      iconWrapCls = 'bg-zinc-50 text-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-400';
      title = tx.description || 'Đổi Point sang Credit';
      subInfo = `${tx.created_at ? new Date(tx.created_at).toLocaleDateString('vi-VN') : '28/10/2026'} · Tỷ lệ 1:10`;
      amountCls = 'text-orange-600 dark:text-orange-400';
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-50 text-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
          ${this.getLucideSvg('check', 'w-3 h-3 stroke-[2.5]')} Hoàn tất
        </span>
      `;
    } else if (typeUpper.includes('DEPOSIT') || normDesc.includes('nap tien') || normDesc.includes('vietqr') || normDesc.includes('nap credit') || normDesc.includes('topup') || normDesc.includes('quy')) {
      iconName = 'coins';
      iconWrapCls = 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400';
      title = tx.description || 'Nạp Credit vào quỹ';
      subInfo = `${tx.created_at ? new Date(tx.created_at).toLocaleDateString('vi-VN') : '30/10/2026'} · Chuyển khoản QR`;
      amountCls = 'text-orange-600 dark:text-orange-400';
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
          ${this.getLucideSvg('check', 'w-3 h-3 stroke-[2.5]')} Thành công
        </span>
      `;
    } else if (typeUpper.includes('SURVEY') || normDesc.includes('khao sat') || normDesc.includes('survey')) {
      iconName = 'clipboard-list';
      iconWrapCls = 'bg-zinc-50 text-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-400';
      title = tx.description || 'Thưởng hoàn thành khảo sát';
      subInfo = `${tx.created_at ? new Date(tx.created_at).toLocaleDateString('vi-VN') : '30/10/2026'} · Khảo sát chuẩn`;
      amountCls = 'text-orange-600 dark:text-orange-400';
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
          ${this.getLucideSvg('check', 'w-3 h-3 stroke-[2.5]')} Thành công
        </span>
      `;
    } else if (typeUpper.includes('PAYOUT') || typeUpper.includes('WITHDRAW') || normDesc.includes('rut tien') || normDesc.includes('doi thuong') || normDesc.includes('the cao')) {
      iconName = 'credit-card';
      iconWrapCls = 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400';
      title = tx.description || 'Rút tiền về tài khoản';
      subInfo = `${tx.created_at ? new Date(tx.created_at).toLocaleDateString('vi-VN') : '29/10/2026'} · Đổi thưởng thẻ cào`;
      amountCls = 'text-orange-600 dark:text-orange-400';
      const statusUpper = (tx.status || '').toUpperCase();
      if (statusUpper === 'PENDING' || statusUpper === 'PROCESSING') {
        statusBadge = `
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800">
            ${this.getLucideSvg('clock', 'w-3 h-3 stroke-[2.5]')} Chờ xử lý
          </span>
        `;
      } else {
        statusBadge = `
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
            ${this.getLucideSvg('check', 'w-3 h-3 stroke-[2.5]')} Thành công
          </span>
        `;
      }
    } else if (normDesc.includes('thuong') || normDesc.includes('bonus') || normDesc.includes('vip')) {
      iconName = 'gift';
      iconWrapCls = 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400';
      title = tx.description || 'Thưởng khuyến mại';
      subInfo = `${tx.created_at ? new Date(tx.created_at).toLocaleDateString('vi-VN') : '30/10/2026'} · Thưởng nạp quỹ`;
      amountCls = 'text-orange-600 dark:text-orange-400';
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
          ${this.getLucideSvg('check', 'w-3 h-3 stroke-[2.5]')} Thành công
        </span>
      `;
    }

    return `
      <div class="flex items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors shadow-2xs">
        <!-- Cột 1: Icon phân loại trong khung rounded-2xl -->
        <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${iconWrapCls} flex items-center justify-center shrink-0 shadow-2xs">
          ${this.getLucideSvg(iconName, 'w-5 h-5 stroke-[2]')}
        </div>

        <!-- Cột 2: Tiêu đề + ngày giờ/mã ghi chú -->
        <div class="flex-1 min-w-0 pr-2">
          <h4 class="font-bold text-stone-800 dark:text-white text-xs sm:text-sm truncate">${title}</h4>
          <p class="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">${subInfo}</p>
        </div>

        <!-- Cột 3: Số tiền (căn phải, độ rộng cố định, luôn thẳng hàng) -->
        <div class="text-right w-28 sm:w-36 font-bold text-xs sm:text-sm font-mono shrink-0 ${amountCls}">
          ${amtStr}
        </div>

        <!-- Cột 4: Badge trạng thái (căn phải, độ rộng cố định, luôn thẳng hàng) -->
        <div class="w-24 sm:w-28 flex justify-end shrink-0">
          ${statusBadge}
        </div>
      </div>
    `;
  },

  renderWalletTransactionList(txList) {
    const container = document.getElementById('wallet-tx-list-container');
    if (!container) return;

    if (!txList || txList.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-stone-400 dark:text-stone-500 text-xs font-medium">
          Không có giao dịch nào trong danh mục này.
        </div>
      `;
      return;
    }

    container.innerHTML = txList.slice(0, 15).map(tx => this.renderTransactionRowHtml(tx)).join('');

    refreshIcons();
  },

  toggleWalletTimeDropdown(e) {
    if (typeof this.toggleCustomDropdown === 'function') {
      this.toggleCustomDropdown('wallet-time-dropdown-menu', e);
    } else {
      if (e && e.stopPropagation) e.stopPropagation();
      const menu = document.getElementById('wallet-time-dropdown-menu');
      if (menu) menu.classList.toggle('hidden');
    }
  },

  selectWalletTimeRange(days, label) {
    this.state.walletTimeDays = days;
    const lbl = document.getElementById('wallet-time-dropdown-label');
    if (lbl) lbl.textContent = label;
    if (typeof this.closeAllCustomDropdowns === 'function') {
      this.closeAllCustomDropdowns();
    } else {
      const menu = document.getElementById('wallet-time-dropdown-menu');
      if (menu) menu.classList.add('hidden');
    }
    this.filterWalletTransactions(this.state.currentWalletFilter || 'ALL');
  },

    openPayoutModal() {
    this.haptic('light');
    const wallet = this.state.wallet || {};
    const maxPoints = wallet.point_balance || 0;

    const denoms = [
      { points: 10000, vnd: 10000, label: '10.000đ (10.000 điểm) - Thẻ cào lần đầu' },
      { points: 20000, vnd: 20000, label: '20.000đ (20.000 điểm) - Thẻ cào / MoMo' },
      { points: 50000, vnd: 50000, label: '50.000đ (50.000 điểm) - Tiêu chuẩn' },
      { points: 100000, vnd: 100000, label: '100.000đ (100.000 điểm) - Miễn phí chuyển khoản' },
      { points: 200000, vnd: 200000, label: '200.000đ (200.000 điểm) - Miễn phí chuyển khoản' },
      { points: 500000, vnd: 500000, label: '500.000đ (500.000 điểm) - Miễn phí chuyển khoản' }
    ];

    this.showModal({
      title: 'Đổi Thưởng & Rút Tiền',
      content: `
        <div class="space-y-4 text-left">
          
          <div class="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div class="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
              <span>Số dư khả dụng:</span>
              <span class="text-orange-600 dark:text-orange-400 font-mono">${formatMoney(maxPoints)} Điểm (${formatMoney(maxPoints)}đ)</span>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Mốc 10.000đ áp dụng cho thẻ cào điện thoại. Chuyển khoản ngân hàng miễn phí từ 100.000đ (dưới 100.000đ phí 2.000đ bù phí cổng).</p>
          </div>

          <!-- 1. Mệnh giá đổi thưởng (Custom Dropdown) -->
          <div class="relative">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Mệnh giá đổi thưởng:</label>
            <input type="hidden" id="payout-points-select" value="${denoms[0].points}">
            <button type="button" onclick="VibeApp.toggleCustomDropdown('payout-points-menu', event)"
                    class="custom-dropdown-trigger w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white hover:border-orange-500 transition-all shadow-xs">
              <span id="payout-points-select-label">${denoms[0].label}</span>
              <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3.5 h-3.5 stroke-[2] transition-transform duration-200 pointer-events-none"></i>
            </button>
            <div id="payout-points-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 shadow-xl space-y-0.5">
              ${denoms.map(d => `
                <div onclick="${maxPoints >= d.points ? `VibeApp.selectCustomFormOption('payout-points-select', '${d.points}', '${d.label.replace(/'/g, "\\'")}', event); VibeApp.updatePayoutUI()` : ''}"
                     class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${maxPoints < d.points ? 'opacity-40 cursor-not-allowed bg-stone-50 dark:bg-stone-800/40 text-stone-400' : 'cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-700 dark:text-slate-200'}">
                  <span>${d.label}</span>
                  ${maxPoints < d.points ? '<span class="text-[10px] text-orange-500 font-bold">(Chưa đủ điểm)</span>' : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 2. Phương thức nhận (Custom Dropdown) -->
          <div class="relative">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Phương thức nhận:</label>
            <input type="hidden" id="payout-method" value="PHONE_CARD">
            <button type="button" onclick="VibeApp.toggleCustomDropdown('payout-method-menu', event)"
                    class="custom-dropdown-trigger w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white hover:border-orange-500 transition-all shadow-xs">
              <span id="payout-method-label">Thẻ Cào Điện Thoại (Viettel, VinaPhone, MobiFone - Miễn phí)</span>
              <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3.5 h-3.5 stroke-[2] transition-transform duration-200 pointer-events-none"></i>
            </button>
            <div id="payout-method-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 shadow-xl space-y-0.5">
              <div onclick="VibeApp.selectCustomFormOption('payout-method', 'PHONE_CARD', 'Thẻ Cào Điện Thoại (Viettel, VinaPhone, MobiFone - Miễn phí)', event); VibeApp.updatePayoutUI()" class="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-700 dark:text-slate-200">
                Thẻ Cào Điện Thoại (Viettel, VinaPhone, MobiFone - Miễn phí)
              </div>
              <div onclick="VibeApp.selectCustomFormOption('payout-method', 'BANK_TRANSFER', 'Chuyển Khoản Ngân Hàng (VietQR / NAPAS 24/7)', event); VibeApp.updatePayoutUI()" class="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-700 dark:text-slate-200">
                Chuyển Khoản Ngân Hàng (VietQR / NAPAS 24/7)
              </div>
              <div onclick="VibeApp.selectCustomFormOption('payout-method', 'MOMO', 'Ví Điện Tử MoMo', event); VibeApp.updatePayoutUI()" class="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-700 dark:text-slate-200">
                Ví Điện Tử MoMo
              </div>
            </div>
          </div>

          <!-- Thông báo mốc 10k -->
          <div id="payout-card-only-notice" class="hidden p-2.5 bg-orange-50 dark:bg-orange-950/40 rounded-xl border border-orange-200/80 dark:border-orange-800/60 text-[11px] text-orange-600 dark:text-orange-400 font-medium">
            Mốc 10.000đ dành riêng cho thẻ cào điện thoại giúp bạn trải nghiệm đổi thưởng nhanh chóng.
          </div>

          <!-- Nhánh 1: Thẻ cào điện thoại -->
          <div id="payout-fields-card" class="space-y-2.5">
            <div class="relative">
              <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Nhà mạng:</label>
              <input type="hidden" id="payout-card-telco" value="VIETTEL">
              <button type="button" onclick="VibeApp.toggleCustomDropdown('payout-telco-menu', event)"
                      class="custom-dropdown-trigger w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white hover:border-orange-500 transition-all shadow-xs">
                <span id="payout-card-telco-label">Viettel</span>
                <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3.5 h-3.5 stroke-[2] transition-transform duration-200 pointer-events-none"></i>
              </button>
              <div id="payout-telco-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 shadow-xl space-y-0.5">
                <div onclick="VibeApp.selectCustomFormOption('payout-card-telco', 'VIETTEL', 'Viettel', event)" class="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-700 dark:text-slate-200">Viettel</div>
                <div onclick="VibeApp.selectCustomFormOption('payout-card-telco', 'VINAPHONE', 'VinaPhone', event)" class="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-700 dark:text-slate-200">VinaPhone</div>
                <div onclick="VibeApp.selectCustomFormOption('payout-card-telco', 'MOBIFONE', 'MobiFone', event)" class="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-700 dark:text-slate-200">MobiFone</div>
              </div>
            </div>
          <div>
              <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Số điện thoại nhận mã thẻ:</label>
              <input type="tel" id="payout-card-phone" placeholder="VD: 0912345678" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold">
            </div>
          </div>

          <!-- Nhánh 2: Chuyển khoản ngân hàng -->
          <div id="payout-fields-bank" class="hidden space-y-2.5">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Ngân hàng thụ hưởng:</label>
              <input type="text" id="payout-recipient-bank" placeholder="VD: Vietcombank, MB Bank, Techcombank..." class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Số tài khoản:</label>
              <input type="text" id="payout-recipient-acc" placeholder="Nhập số tài khoản ngân hàng" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Tên chủ tài khoản:</label>
              <input type="text" id="payout-recipient-name" placeholder="VIẾT HOA KHÔNG DẤU (VD: NGUYEN VAN A)" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold uppercase">
            </div>
          </div>

          <!-- Nhánh 3: Ví MoMo -->
          <div id="payout-fields-momo" class="hidden space-y-2.5">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Số điện thoại đăng ký MoMo:</label>
              <input type="tel" id="payout-momo-phone" placeholder="VD: 0987654321" class="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Họ tên chủ ví MoMo:</label>
              <input type="text" id="payout-momo-name" placeholder="VIẾT HOA KHÔNG DẤU" class="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase">
            </div>
          </div>

          <!-- Tóm tắt thanh toán -->
          <div class="p-3 bg-slate-50/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
            <div class="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Mệnh giá quy đổi:</span>
              <span id="payout-summary-amount" class="font-mono font-bold text-slate-900 dark:text-slate-100">10.000 VNĐ</span>
            </div>
            <div class="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Phí chuyển khoản:</span>
              <span id="payout-summary-fee" class="font-mono text-orange-600 dark:text-orange-400 font-bold">0đ (Miễn phí)</span>
            </div>
            <div class="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white">
              <span>Thực nhận:</span>
              <span id="payout-summary-receive" class="text-orange-600 dark:text-orange-400 font-mono text-sm font-extrabold">10.000 VNĐ</span>
            </div>
          </div>

          <div class="flex gap-2.5 pt-1">
            <button onclick="VibeApp.submitPayoutAction()" class="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98]">
              Xác Nhận Đổi Thưởng
            </button>
            <button onclick="VibeApp.closeModal()" class="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-[0.98]">
              Hủy
            </button>
          </div>

        </div>
      `
    });

    this.updatePayoutUI();
  },

  updatePayoutUI() {
    const ptsSelect = document.getElementById('payout-points-select');
    const methodSelect = document.getElementById('payout-method');
    if (!ptsSelect || !methodSelect) return;

    const points = parseInt(ptsSelect.value, 10) || 0;
    const vnd = points; // Tỷ giá 1:1 VNĐ
    let method = methodSelect.value;

    const isFirstTime10k = points === 10000;
    const noticeEl = document.getElementById('payout-card-only-notice');
    const cardFields = document.getElementById('payout-fields-card');
    const bankFields = document.getElementById('payout-fields-bank');
    const momoFields = document.getElementById('payout-fields-momo');

    if (isFirstTime10k && method !== 'PHONE_CARD') {
      methodSelect.value = 'PHONE_CARD';
      method = 'PHONE_CARD';
    }

    if (noticeEl) {
      noticeEl.classList.toggle('hidden', !isFirstTime10k);
    }

    if (cardFields) cardFields.classList.toggle('hidden', method !== 'PHONE_CARD');
    if (bankFields) bankFields.classList.toggle('hidden', method !== 'BANK_TRANSFER');
    if (momoFields) momoFields.classList.toggle('hidden', method !== 'MOMO');

    // Phí chuyển tiền: Thẻ cào miễn phí; Ngân hàng / MoMo dưới 100k phí 2k, từ 100k miễn phí
    let fee = 0;
    if (method === 'PHONE_CARD') {
      fee = 0;
    } else {
      fee = vnd < 100000 ? 2000 : 0;
    }
    const actual = Math.max(0, vnd - fee);

    const amountEl = document.getElementById('payout-summary-amount');
    const feeEl = document.getElementById('payout-summary-fee');
    const receiveEl = document.getElementById('payout-summary-receive');

    if (amountEl) amountEl.textContent = `${formatMoney(vnd)} VNĐ`;
    if (feeEl) {
      if (fee === 0) {
        feeEl.innerHTML = '<span class="text-orange-600 font-bold">0đ (Miễn phí 100%)</span>';
      } else {
        feeEl.innerHTML = '<span class="text-orange-600 font-bold">2.000 VNĐ (Phí cổng NAPAS)</span>';
      }
    }
    if (receiveEl) receiveEl.textContent = `${formatMoney(actual)} VNĐ`;
  },

  async submitPayoutAction() {
    const ptsSelect = document.getElementById('payout-points-select');
    const methodSelect = document.getElementById('payout-method');
    if (!ptsSelect || !methodSelect) return;

    const pts = parseInt(ptsSelect.value, 10);
    const method = methodSelect.value;
    let recipientInfo = {};

    if (method === 'PHONE_CARD') {
      const telco = document.getElementById('payout-card-telco')?.value || 'VIETTEL';
      const phone = document.getElementById('payout-card-phone')?.value?.trim();
      if (!phone || phone.length < 9) {
        this.showToast('Vui lòng nhập số điện thoại nhận mã thẻ hợp lệ', 'warning');
        return;
      }
      recipientInfo = { telco, phone_number: phone, account_name: `Thẻ ${telco}` };
    } else if (method === 'BANK_TRANSFER') {
      const bank = document.getElementById('payout-recipient-bank')?.value?.trim();
      const acc = document.getElementById('payout-recipient-acc')?.value?.trim();
      const name = document.getElementById('payout-recipient-name')?.value?.trim();
      if (!bank || !acc || !name) {
        this.showToast('Vui lòng điền đủ tên ngân hàng, số tài khoản và họ tên', 'warning');
        return;
      }
      recipientInfo = { bank_name: bank, account_number: acc, account_name: name.toUpperCase() };
    } else if (method === 'MOMO') {
      const phone = document.getElementById('payout-momo-phone')?.value?.trim();
      const name = document.getElementById('payout-momo-name')?.value?.trim();
      if (!phone || !name) {
        this.showToast('Vui lòng điền đủ số điện thoại và tên chủ ví MoMo', 'warning');
        return;
      }
      recipientInfo = { bank_name: 'Ví MoMo', account_number: phone, account_name: name.toUpperCase() };
    }

    try {
      const res = await this.api('/wallet/payouts', {
        method: 'POST',
        body: JSON.stringify({
          points_amount: pts,
          payout_method: method,
          recipient_info: recipientInfo
        })
      });

      if (res.success) {
        this.haptic('success');
        if (this.state.currentUser && res.newPointBalance !== undefined) {
          this.state.currentUser.point_balance = res.newPointBalance;
        }

        // Neu duoc Auto-Payout cap ma the cao ngay lap tuc
        if (res.isAutoPayout && res.cardDetails) {
          const card = res.cardDetails;
          this.showModal({
            title: 'Cấp Thẻ Cào Thành Công (Auto-Payout)',
            content: `
              <div class="space-y-4 text-left">
                <div class="p-3 bg-orange-50 dark:bg-orange-950/60 rounded-xl border border-orange-200 dark:border-orange-800 text-xs text-orange-800 dark:text-orange-300 space-y-1">
                  <div class="font-bold flex items-center gap-1.5">
                    <i data-lucide="check-circle" class="w-4 h-4 text-orange-600"></i>
                    <span>Tự động phê duyệt & cấp mã thẻ tức thì</span>
                  </div>
                  <p class="text-[11px] leading-relaxed">
                    Tài khoản của bạn đạt điểm uy tín cao. Thẻ cào điện thoại đã được hệ thống kích hoạt thành công.
                  </p>
                </div>

                <div class="p-3.5 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2.5 text-xs">
                  <div class="flex justify-between items-center pb-2 border-b border-stone-200/80 dark:border-stone-800">
                    <span class="text-stone-500 dark:text-stone-400">Nhà mạng:</span>
                    <span class="font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">${card.telco}</span>
                  </div>
                  <div class="flex justify-between items-center pb-2 border-b border-stone-200/80 dark:border-stone-800">
                    <span class="text-stone-500 dark:text-stone-400">Mệnh giá thẻ:</span>
                    <span class="font-mono font-extrabold text-orange-600 dark:text-orange-400">${formatMoney(card.card_value_vnd)} VNĐ</span>
                  </div>
                  <div class="p-2.5 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                    <div>
                      <div class="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Mã nạp (PIN):</div>
                      <div class="font-mono font-black text-sm text-stone-900 dark:text-white tracking-widest select-all">${card.card_code}</div>
                    </div>
                    <button type="button" onclick="VibeApp.copyValue('${card.card_code}', 'Mã nạp thẻ')" class="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition-all">
                      Sao chép
                    </button>
                  </div>
                  <div class="p-2.5 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                    <div>
                      <div class="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Số Seri:</div>
                      <div class="font-mono font-bold text-xs text-stone-700 dark:text-stone-300 select-all">${card.card_serial}</div>
                    </div>
                    <button type="button" onclick="VibeApp.copyValue('${card.card_serial}', 'Số seri')" class="px-2.5 py-1.5 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-700 dark:text-stone-200 rounded-lg font-bold text-[11px] transition-all">
                      Sao chép
                    </button>
                  </div>
                  <div class="text-[10px] text-stone-400 font-medium">
                    Hạn sử dụng: ${card.expiry_date || 'Không thời hạn'}
                  </div>
                </div>

                <div class="flex gap-2 pt-1">
                  <a href="tel:*100*${card.card_code}%23" class="flex-1 py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white text-center rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5">
                    <i data-lucide="phone-call" class="w-3.5 h-3.5"></i>
                    <span>Nạp Ngay (*100*MÃ#)</span>
                  </a>
                  <button type="button" onclick="VibeApp.closeModal(); VibeApp.navigateTo('wallet');" class="py-2.5 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all">
                    Đóng
                  </button>
                </div>
              </div>
            `
          });
        } else {
          this.closeModal();
          this.showToast(res.message || 'Yêu cầu đổi thưởng đã được tiếp nhận thành công', 'success');
        }

        const appRoot = document.getElementById('app-root');
        if (appRoot) await this.renderWalletView(appRoot);
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ==================== MODAL: ĐỔI ĐIỂM SANG CREDIT (1:1 VNĐ + 5% THƯỞNG) ====================
  openSwapPointsModal() {
    this.haptic('light');
    const user = this.state.currentUser;
    const currentPoints = user ? (user.point_balance || 0) : 0;
    const defaultPoints = Math.min(Math.max(1000, currentPoints), 1000);
    const initialCredit = Math.floor(defaultPoints * 1.05);

    this.showModal({
      title: 'Đổi Điểm Sang Credit Tạo Form (+5% Thưởng)',
      content: `
        <div class="space-y-4 text-left">
          <div class="p-3 bg-orange-50 dark:bg-stone-900/80 rounded-xl border border-orange-200/80 dark:border-stone-800 text-xs space-y-1">
            <div class="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
              <span>Tỷ giá quy đổi:</span>
              <span class="text-orange-600 dark:text-orange-400 font-mono font-bold">1 Điểm = 1 VNĐ Credit</span>
            </div>
            <p class="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
              Tặng thêm <strong>+5% Thưởng Tái Đầu Tư</strong> khi đổi Điểm sang Credit tạo khảo sát (Ví dụ: Đổi 1.000 Điểm nhận ngay <strong>1.050 VNĐ Credit</strong>).
            </p>
          </div>
          
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-xs font-bold text-stone-700 dark:text-stone-300">Số điểm muốn đổi:</label>
              <span class="text-[11px] text-stone-500 font-mono">Khả dụng: ${formatMoney(currentPoints)} Điểm</span>
            </div>
            <input type="number" id="swap-points-input" value="${defaultPoints}" min="1000" max="${currentPoints}" step="500" 
                   oninput="VibeApp.updateSwapPointsPreview()"
                   class="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500">
          </div>

          <!-- Preview Real-time -->
          <div class="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs flex justify-between items-center">
            <span class="text-stone-600 dark:text-stone-400 font-medium">Credit thực nhận (+5%):</span>
            <span id="swap-credit-preview" class="font-mono font-bold text-orange-600 dark:text-orange-400 text-sm">${formatMoney(initialCredit)} VNĐ</span>
          </div>

          <div class="flex gap-2.5 pt-2">
            <button onclick="VibeApp.submitSwapPoints()" class="flex-1 py-3 bg-stone-900 hover:bg-stone-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95">
              Xác Nhận Đổi Điểm
            </button>
            <button onclick="VibeApp.closeModal()" class="py-3 px-5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-2xl text-xs font-bold">
              Hủy
            </button>
          </div>
        </div>
      `
    });
  },

  updateSwapPointsPreview() {
    const input = document.getElementById('swap-points-input');
    const preview = document.getElementById('swap-credit-preview');
    if (!input || !preview) return;
    const pts = parseInt(input.value, 10) || 0;
    const credit = Math.floor(pts * 1.05);
    preview.textContent = `${formatMoney(credit)} VNĐ`;
  },

  async submitSwapPoints() {
    const pts = parseInt(document.getElementById('swap-points-input').value, 10);
    if (isNaN(pts) || pts < 1000) {
      this.showToast('Số điểm tối thiểu để đổi là 1.000 điểm', 'warning');
      return;
    }

    const user = this.state.currentUser;
    if (user && (user.point_balance || 0) < pts) {
      this.showToast(`Số dư không đủ. Bạn chỉ có ${formatMoney(user.point_balance || 0)} điểm`, 'warning');
      return;
    }

    try {
      const res = await this.api('/wallet/swap-points', {
        method: 'POST',
        body: JSON.stringify({ points_amount: pts })
      });

      if (res.success) {
        this.haptic('success');
        this.closeModal();
        const addedVnd = res.creditAddedVnd || Math.floor(pts * 1.05);
        this.showToast(`Đổi thành công ${formatMoney(pts)} điểm sang ${formatMoney(addedVnd)} VNĐ Credit (+5% thưởng)!`, 'success');
        if (this.state.currentUser) {
          this.state.currentUser.point_balance = res.newPointBalance;
          this.state.currentUser.credit_balance = res.newCreditBalance;
        }
        this.applyUserInterface();
        if (this.state.activeTab === 'wallet') {
          await this.renderWalletView(document.getElementById('app-root'));
        }
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ==================== MODAL: NẠP QUỸ CREATOR ====================
  calculateDepositBonus(amount) {
    let rate = 0;
    let tierName = 'Tiêu chuẩn';
    if (amount >= 10000000) {
      rate = 0.12;
      tierName = 'Đối Tác (+12%)';
    } else if (amount >= 5000000) {
      rate = 0.10;
      tierName = 'Kim Cương (+10%)';
    } else if (amount >= 2000000) {
      rate = 0.08;
      tierName = 'Bạch Kim (+8%)';
    } else if (amount >= 1000000) {
      rate = 0.06;
      tierName = 'Vàng (+6%)';
    } else if (amount >= 500000) {
      rate = 0.04;
      tierName = 'Bạc (+4%)';
    } else if (amount >= 100000) {
      rate = 0.02;
      tierName = 'Đồng (+2%)';
    } else if (amount >= 50000) {
      rate = 0.01;
      tierName = 'Khởi Động (+1%)';
    }
    const bonusVnd = Math.round(amount * rate);
    const totalCredit = amount + bonusVnd;
    return {
      rate,
      percent: Math.round(rate * 100),
      bonusVnd,
      totalCredit,
      tierName
    };
  },

  updateDepositCalc() {
    const input = document.getElementById('deposit-amount-input');
    if (!input) return;
    const amount = parseInt(input.value, 10) || 0;
    const calc = this.calculateDepositBonus(amount);

    const amountEl = document.getElementById('deposit-calc-amount');
    const bonusPctEl = document.getElementById('deposit-calc-bonus-pct');
    const bonusVndEl = document.getElementById('deposit-calc-bonus-vnd');
    const totalCreditEl = document.getElementById('deposit-calc-total-credit');

    if (amountEl) amountEl.textContent = `${formatMoney(amount)} VNĐ`;
    if (bonusPctEl) bonusPctEl.textContent = `+${calc.percent}% (${calc.tierName})`;
    if (bonusVndEl) bonusVndEl.textContent = `+${formatMoney(calc.bonusVnd)} Credit`;
    if (totalCreditEl) totalCreditEl.textContent = `${formatMoney(calc.totalCredit)} Credit`;
  },

  setDepositPreset(amount) {
    const input = document.getElementById('deposit-amount-input');
    if (input) {
      input.value = amount;
      this.updateDepositCalc();
    }
  },

  openDepositModal() {
    this.haptic('light');
    this.showModal({
      title: 'Nạp Quỹ Tạo Khảo Sát',
      content: `
        <div class="space-y-4 text-left">
          
          <div class="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1">
            <div class="font-bold flex items-center gap-1.5 text-stone-900 dark:text-white">
              <i data-lucide="shield-check" class="w-4 h-4 text-orange-600"></i>
              <span>Credit Tạo Khảo Sát - Mở Cho Mọi Thành Viên</span>
            </div>
            <p class="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              Mọi tài khoản (Cá nhân, Sinh viên, Doanh nghiệp) đều có thể nạp Credit để xuất bản khảo sát và tài trợ voucher. Doanh nghiệp nạp số lượng lớn được nhận thêm báo cáo AI Insights và đặc quyền hỗ trợ VIP.
            </p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Số tiền nạp (VNĐ):</label>
            <input type="number" id="deposit-amount-input" oninput="VibeApp.updateDepositCalc()" value="1000000" min="20000" step="10000"
                   class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">Chọn nhanh mức nạp có thưởng:</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button type="button" onclick="VibeApp.setDepositPreset(20000)" class="py-2 px-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 font-mono font-bold transition-all active:scale-[0.98]">20K (SV)</button>
              <button type="button" onclick="VibeApp.setDepositPreset(50000)" class="py-2 px-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 font-mono font-bold transition-all active:scale-[0.98]">50K (+1%)</button>
              <button type="button" onclick="VibeApp.setDepositPreset(100000)" class="py-2 px-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 font-mono font-bold transition-all active:scale-[0.98]">100K (+2%)</button>
              <button type="button" onclick="VibeApp.setDepositPreset(500000)" class="py-2 px-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 font-mono font-bold transition-all active:scale-[0.98]">500K (+4%)</button>
              <button type="button" onclick="VibeApp.setDepositPreset(1000000)" class="py-2 px-2 border border-orange-500 bg-orange-50/50 dark:bg-stone-800 rounded-xl text-xs text-orange-600 dark:text-orange-400 font-mono font-bold transition-all active:scale-[0.98]">1 Tr (+6%)</button>
              <button type="button" onclick="VibeApp.setDepositPreset(2000000)" class="py-2 px-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 font-mono font-bold transition-all active:scale-[0.98]">2 Tr (+8%)</button>
              <button type="button" onclick="VibeApp.setDepositPreset(5000000)" class="py-2 px-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 font-mono font-bold transition-all active:scale-[0.98]">5 Tr (+10%)</button>
              <button type="button" onclick="VibeApp.setDepositPreset(10000000)" class="py-2 px-2 border border-orange-500/80 bg-orange-50/70 dark:bg-stone-800 rounded-xl text-xs text-orange-600 dark:text-orange-400 font-mono font-bold transition-all active:scale-[0.98]">10 Tr (+12%)</button>
            </div>
          </div>

          <!-- Tóm tắt số Credit nhận được -->
          <div class="p-3 bg-slate-50/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
            <div class="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Mức nạp thanh toán:</span>
              <span id="deposit-calc-amount" class="font-mono font-bold text-slate-900 dark:text-slate-100">1.000.000 VNĐ</span>
            </div>
            <div class="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tỷ lệ thưởng bonus:</span>
              <span id="deposit-calc-bonus-pct" class="font-mono font-bold text-orange-600 dark:text-orange-400">+6% (Vàng)</span>
            </div>
            <div class="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Thưởng thêm:</span>
              <span id="deposit-calc-bonus-vnd" class="font-mono font-bold text-orange-600 dark:text-orange-400">+60.000 Credit</span>
            </div>
            <div class="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white">
              <span>Tổng Credit nhận được:</span>
              <span id="deposit-calc-total-credit" class="text-orange-600 dark:text-orange-400 font-mono text-sm font-extrabold">1.060.000 Credit</span>
            </div>
          </div>

          <div class="flex gap-2.5 pt-1">
            <button onclick="VibeApp.submitDepositAction()" class="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98]">
              Xác Nhận Nạp Quỹ
            </button>
            <button onclick="VibeApp.closeModal()" class="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-[0.98]">
              Hủy
            </button>
          </div>

        </div>
      `
    });

    this.updateDepositCalc();
  },

  async submitDepositAction() {
    const input = document.getElementById('deposit-amount-input');
    if (!input) return;
    const amount = parseInt(input.value, 10);
    if (isNaN(amount) || amount < 20000) {
      this.showToast('Số tiền nạp tối thiểu là 20.000 VNĐ', 'warning');
      return;
    }

    try {
      this.haptic('light');
      const res = await this.api('/wallet/create-deposit-order', {
        method: 'POST',
        body: JSON.stringify({ amount_vnd: amount })
      });

      if (res.success) {
        this.showVietQrPaymentModal(res);
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  showVietQrPaymentModal(order) {
    if (this._depositPollInterval) clearInterval(this._depositPollInterval);
    if (this._depositTimerInterval) clearInterval(this._depositTimerInterval);

    const bank = order.bankInfo || {};
    let remainingSec = order.expiresInSec || 900;

    this.showModal({
      title: 'Thanh Toán Quét Mã VietQR Napas247',
      content: `
        <div class="space-y-4 text-left">
          
          <!-- Thanh trạng thái & Bộ đếm -->
          <div class="p-3 bg-orange-50/80 dark:bg-stone-900 rounded-xl border border-orange-200/80 dark:border-stone-800 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <span class="font-bold text-stone-900 dark:text-white" id="deposit-status-text">Đang chờ quét mã chuyển khoản...</span>
            </div>
            <div class="font-mono font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-stone-700 shadow-xs" id="deposit-countdown-timer">
              15:00
            </div>
          </div>

          <!-- Khung QR & Chi tiết chuyển khoản -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            
            <!-- Cột trái: Mã VietQR động -->
            <div class="flex flex-col items-center justify-center p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs text-center">
              <div class="relative w-48 h-48 sm:w-52 sm:h-52 bg-white p-2 rounded-xl border border-stone-100 dark:border-stone-800 flex items-center justify-center overflow-hidden">
                <img src="${order.qrUrl}" alt="VietQR Napas247" class="w-full h-full object-contain select-none">
                <!-- Logo SurvHub ở tâm mã QR -->
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="w-10 h-10 sm:w-11 sm:h-11 bg-white p-1 rounded-xl shadow-md border border-stone-200/80 flex items-center justify-center">
                    <img src="/logo-light.svg" alt="SurvHub" class="w-full h-full object-contain rounded-lg">
                  </div>
                </div>
              </div>
              <div class="mt-2 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                Mở ứng dụng ngân hàng bất kỳ để quét mã
              </div>
            </div>

            <!-- Cột phải: Thông tin nhận tiền -->
            <div class="space-y-2 text-xs">
              <div class="p-2.5 bg-stone-50 dark:bg-stone-900/90 rounded-xl border border-stone-200/80 dark:border-stone-800">
                <div class="text-[10px] text-stone-500 dark:text-stone-400">Ngân hàng thụ hưởng:</div>
                <div class="font-bold text-stone-900 dark:text-white text-xs mt-0.5">${bank.bank_name || 'Ngân hàng số Timo by BVBank'}</div>
              </div>

              <div class="p-2.5 bg-stone-50 dark:bg-stone-900/90 rounded-xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <div class="text-[10px] text-stone-500 dark:text-stone-400">Số tài khoản:</div>
                  <div class="font-mono font-bold text-stone-900 dark:text-white text-sm mt-0.5">${bank.account_number}</div>
                </div>
                <button type="button" onclick="VibeApp.copyValue('${bank.account_number}', 'Số tài khoản')" class="px-2.5 py-1.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg font-bold border border-stone-200 dark:border-stone-700 text-[11px] transition-all">
                  Sao chép
                </button>
              </div>

              <div class="p-2.5 bg-stone-50 dark:bg-stone-900/90 rounded-xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <div class="text-[10px] text-stone-500 dark:text-stone-400">Chủ tài khoản:</div>
                  <div class="font-bold text-stone-900 dark:text-white text-xs mt-0.5">${bank.account_name}</div>
                </div>
                <button type="button" onclick="VibeApp.copyValue('${bank.account_name}', 'Tên chủ tài khoản')" class="px-2.5 py-1.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg font-bold border border-stone-200 dark:border-stone-700 text-[11px] transition-all">
                  Sao chép
                </button>
              </div>

              <div class="p-2.5 bg-stone-50 dark:bg-stone-900/90 rounded-xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <div class="text-[10px] text-stone-500 dark:text-stone-400">Số tiền nạp:</div>
                  <div class="font-mono font-bold text-orange-600 dark:text-orange-400 text-sm mt-0.5">${formatMoney(order.amountVnd)} VNĐ</div>
                </div>
                <button type="button" onclick="VibeApp.copyValue('${order.amountVnd}', 'Số tiền')" class="px-2.5 py-1.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg font-bold border border-stone-200 dark:border-stone-700 text-[11px] transition-all">
                  Sao chép
                </button>
              </div>

              <div class="p-2.5 bg-orange-50/70 dark:bg-stone-900 rounded-xl border border-orange-200/80 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <div class="text-[10px] text-orange-600 dark:text-orange-400 font-bold">Nội dung chuyển khoản (Memo):</div>
                  <div class="font-mono font-black text-stone-900 dark:text-white text-sm mt-0.5 tracking-wider">${order.orderCode}</div>
                </div>
                <button type="button" onclick="VibeApp.copyValue('${order.orderCode}', 'Nội dung chuyển khoản')" class="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition-all">
                  Sao chép
                </button>
              </div>
            </div>

          </div>

          <!-- Lưu ý quan trọng -->
          <div class="p-2.5 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
            Hệ thống ngân hàng tự động đối soát trong 3 giây khi nhận đúng số tiền và mã nội dung <strong>${order.orderCode}</strong>. Tổng Credit nhận: <strong>${formatMoney(order.creditAmount)} Credit</strong>${order.bonusCreditVnd > 0 ? ' (Đã gồm +' + formatMoney(order.bonusCreditVnd) + ' Credit thưởng)' : ''}.
          </div>

          <!-- Nút hành động & Giả lập thanh toán -->
          <div class="flex flex-col sm:flex-row gap-2 pt-1">
            <button type="button" onclick="VibeApp.checkDepositStatus('${order.orderCode}', false)" class="flex-1 py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98]">
              Kiểm Tra Trạng Thái
            </button>
            <button type="button" onclick="VibeApp.simulatePaymentSuccess('${order.orderCode}')" class="py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98]">
              Mô Phỏng Thanh Toán (Dev/Test)
            </button>
            <button type="button" onclick="VibeApp.closeModal()" class="py-2.5 px-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all active:scale-[0.98]">
              Đóng
            </button>
          </div>

        </div>
      `
    });

    // Khoi chay bo dem nguoc 15:00
    this._depositTimerInterval = setInterval(() => {
      remainingSec--;
      const min = Math.floor(remainingSec / 60);
      const sec = remainingSec % 60;
      const timerEl = document.getElementById('deposit-countdown-timer');
      if (timerEl) {
        timerEl.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      }
      if (remainingSec <= 0) {
        clearInterval(this._depositTimerInterval);
        clearInterval(this._depositPollInterval);
        const statusEl = document.getElementById('deposit-status-text');
        if (statusEl) statusEl.textContent = 'Đơn nạp đã hết hạn thanh toán';
      }
    }, 1000);

    // Khoi chay Polling tu dong kiem tra trang thai don nap moi 2.5 giay
    this._depositPollInterval = setInterval(() => {
      this.checkDepositStatus(order.orderCode, true);
    }, 2500);
  },

  async checkDepositStatus(orderCode, isSilent = false) {
    try {
      const res = await this.api(`/wallet/deposit-orders/${orderCode}`);
      if (res && res.success && res.order) {
        const order = res.order;
        if (order.status === 'COMPLETED') {
          if (this._depositPollInterval) clearInterval(this._depositPollInterval);
          if (this._depositTimerInterval) clearInterval(this._depositTimerInterval);

          this.haptic('success');
          if (this.state.currentUser) {
            this.state.currentUser.credit_balance = (this.state.currentUser.credit_balance || 0) + (order.creditAmount || order.credit_amount || order.amount_vnd);
          }
          this.applyUserInterface();

          // Cap nhat modal sang man hinh Chuc mung
          this.showModal({
            title: 'Nạp Tiền Thành Công',
            content: `
              <div class="space-y-4 text-center py-2">
                <div class="w-14 h-14 bg-orange-100 dark:bg-orange-950/60 rounded-full flex items-center justify-center mx-auto text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  <i data-lucide="check" class="w-7 h-7 stroke-[2.5]"></i>
                </div>
                <div>
                  <h3 class="text-base font-extrabold text-stone-900 dark:text-white">Giao Dịch Đã Hoàn Tất</h3>
                  <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">Đơn nạp mã <strong>${orderCode}</strong> đã được hệ thống ghi nhận thành công.</p>
                </div>

                <div class="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1.5 text-left max-w-sm mx-auto">
                  <div class="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Số tiền nạp:</span>
                    <span class="font-mono font-bold text-stone-900 dark:text-white">${formatMoney(order.amount_vnd)} VNĐ</span>
                  </div>
                  <div class="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Credit được cộng:</span>
                    <span class="font-mono font-extrabold text-orange-600 dark:text-orange-400">+${formatMoney(order.credit_amount || order.amount_vnd)} Credit</span>
                  </div>
                </div>

                <div class="pt-2">
                  <button type="button" onclick="VibeApp.closeModal(); VibeApp.navigateTo('wallet');" class="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98]">
                    Xem Số Dư Ví & Tiếp Tục
                  </button>
                </div>
              </div>
            `
          });
          return;
        } else if (order.status === 'PENDING_MISMATCH') {
          if (this._depositPollInterval) clearInterval(this._depositPollInterval);
          if (this._depositTimerInterval) clearInterval(this._depositTimerInterval);

          const statusEl = document.getElementById('deposit-status-text');
          if (statusEl) statusEl.textContent = 'Số tiền chuyển khoản không khớp (Tạm giữ)';

          this.showModal({
            title: 'Lệch Số Tiền Chuyển Khoản',
            content: `
              <div class="space-y-4 text-center py-2">
                <div class="w-14 h-14 bg-red-100 dark:bg-red-950/60 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  <i data-lucide="alert-triangle" class="w-7 h-7 stroke-[2.5]"></i>
                </div>
                <div>
                  <h3 class="text-base font-extrabold text-stone-900 dark:text-white">Phát Hiện Lệch Số Tiền</h3>
                  <p class="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">Số tiền chuyển khoản không khớp với số tiền đơn nạp. Đơn hàng đang được tạm giữ để đối soát an toàn. Vui lòng liên hệ Admin qua kênh hỗ trợ.</p>
                </div>

                <div class="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1.5 text-left max-w-sm mx-auto">
                  <div class="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Mã đơn nạp:</span>
                    <span class="font-mono font-bold text-stone-900 dark:text-white">${orderCode}</span>
                  </div>
                  <div class="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Trạng thái:</span>
                    <span class="font-bold text-red-600 dark:text-red-400">Tạm giữ đối soát</span>
                  </div>
                </div>

                <div class="pt-2">
                  <button type="button" onclick="VibeApp.closeModal();" class="w-full py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98]">
                    Đã Hiểu & Đóng
                  </button>
                </div>
              </div>
            `
          });
          this.showToast('Số tiền chuyển khoản không khớp với số tiền đơn nạp. Đơn hàng đang được tạm giữ để đối soát an toàn. Vui lòng liên hệ Admin qua kênh hỗ trợ.', 'error');
          return;
        } else if (order.status === 'EXPIRED') {
          if (this._depositPollInterval) clearInterval(this._depositPollInterval);
          if (this._depositTimerInterval) clearInterval(this._depositTimerInterval);
          const statusEl = document.getElementById('deposit-status-text');
          if (statusEl) statusEl.textContent = 'Đơn nạp đã hết hạn thanh toán';
          if (!isSilent) this.showToast('Đơn nạp này đã hết hạn', 'warning');
          return;
        }
      }

      if (!isSilent) {
        this.showToast('Đang chờ đối soát tiền vào tài khoản...', 'info');
      }
    } catch (err) {
      if (!isSilent) this.showToast(err.message, 'error');
    }
  },

  async simulatePaymentSuccess(orderCode) {
    try {
      this.haptic('light');
      const res = await this.api('/wallet/simulate-payment-success', {
        method: 'POST',
        body: JSON.stringify({ order_code: orderCode })
      });

      if (res.success) {
        this.showToast('Đã mô phỏng thanh toán ngân hàng thành công!', 'success');
        await this.checkDepositStatus(orderCode, false);
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },
  };

  // Mo rong vao Namespace SSOT window.VibeApp
  Object.assign(window.VibeApp, WalletLedgerModule);
  window.WalletLedgerModule = WalletLedgerModule;
})();
