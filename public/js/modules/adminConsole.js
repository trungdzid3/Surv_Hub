/**
 * SurvHub - Admin Console & Governance Module (WAVE 3 MODULAR)
 * Gom cac doan tu public/app.js: "VIEW 8: ADMIN DASHBOARD & GOVERNANCE" (tong quan kinh te san),
 * "VIEW 9: ADMIN PAYOUTS & AUDIT" (duyet payout), "VIEW 10: ADMIN FRAUD & GOVERNANCE" (gian lan, unban),
 * "ADMIN FAST COMMAND CONSOLE" (terminal lenh nhanh: _adminConsoleHistory, _adminTerminalLogs,
 * submitAdminConsoleCommand, openAdminConsoleModal...) va thanh sub-nav quan tri (renderAdminSubNav).
 * Di chuyen nguyen van khong doi bat ky hanh vi render/nghiep vu nao.
 * Luu y: getLucideSvg va alias escapeHtml (uy quyen window.VibeUtils) la tien ich dung chung, GIU NGUYEN o app.js.
 * Cac phu thuoc goi qua this.* (api, state, showToast, navigate...) deu late-binding qua window.VibeApp.
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * @namespace window.VibeApp
 * @requires window.VibeApp (core: api, state, showToast, showModal, haptic, navigate, closeModal,
 *           getLucideSvg, escapeHtml, renderAdminBugReportsView (bugReportModule),
 *           renderAdminAuditLogsView, toggleAdminFullscreenTvMode (adminAnalyticsModule)),
 *           lucide (global)
 * @exports renderAdminOverviewView, renderAdminPayoutsView, setAdminPayoutFilter, setAdminPayoutPage,
 *          handleAdminPayout, renderAdminFraudView, setAdminFraudLogLimit, setAdminFraudLogPage,
 *          searchAdminFraudUser, clearAdminFraudSearch, unbanAdminUser, unbanIpAddress, isStudentUser,
 *          renderAdminConsoleLogs, quickAdminLogin, fillAdminConsoleCommand, clearAdminConsole,
 *          handleAdminConsoleKeyDown, submitAdminConsoleCommand, openAdminConsoleModal, renderAdminSubNav,
 *          _adminConsoleHistory, _adminConsoleHistoryIdx, _adminTerminalLogs
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const AdminConsoleModule = {
  // ==================== VIEW 8: ADMIN DASHBOARD & GOVERNANCE ====================
  async renderAdminOverviewView(root) {
    if (!this.state.currentUser || this.state.currentUser.role !== 'ADMIN') {
      this.showToast('Bạn không có quyền truy cập trang quản trị hệ thống', 'error');
      this.navigate('surveys');
      return;
    }

    try {
      const res = await this.api('/admin/overview');
      const fin = (res && res.overview && res.overview.financials) || {};
      const analytics = (res && res.overview && res.overview.analytics) || {
        activeUsersNow: 1,
        fillingFormsNow: 0,
        firstTimeRetentionRate: 0,
        repeatRetentionRate: 0,
        completionRatePct: 0,
        avgCompletionTimeSec: 0,
        avgTrustScore: 0,
        totalActiveUsersSample: 0,
        totalSessionsSample: 0
      };
      const dist = (res && res.overview && res.overview.surveyDistribution) || { student: 0, personal: 0, enterprise: 0, total: 0 };
      const ledger = (res && res.overview && res.overview.recentLedgerTransactions) || [];

      const totalSurveys = dist.total || (dist.student + dist.personal + dist.enterprise) || 1;
      const pctStudent = Math.round((dist.student / totalSurveys) * 100);
      const pctPersonal = Math.round((dist.personal / totalSurveys) * 100);
      const pctEnterprise = Math.max(0, 100 - pctStudent - pctPersonal);

      root.innerHTML = `
        <div class="space-y-5">
          ${this.renderAdminSubNav('admin-overview')}

          <!-- 1. Header Dashboard Tinh Gọn -->
          <div class="pb-3 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white">Tổng Quan Kinh Tế & Vận Hành Sàn</h1>
                <span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 text-[10px] font-mono font-bold rounded-md">LIVE</span>
              </div>
              <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Giám sát ký quỹ Escrow, công nợ điểm, biến động sổ cái kép và điều hành sàn.</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <button type="button" onclick="VibeApp.openAdminConsoleModal()" class="px-3 py-1.5 bg-stone-900 hover:bg-black dark:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs border border-stone-800">
                <i data-lucide="terminal" class="w-3.5 h-3.5 text-orange-500"></i>
                <span>Terminal (F2)</span>
              </button>
              <button type="button" onclick="VibeApp.toggleAdminFullscreenTvMode()" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs" title="Chế độ màn hình lớn TV phòng họp">
                <i data-lucide="tv" class="w-3.5 h-3.5 text-orange-600"></i>
                <span class="hidden sm:inline">Toàn Cảnh</span>
              </button>
              <button type="button" onclick="VibeApp.renderAdminOverviewView(document.getElementById('app-root'))" class="px-3 py-1.5 bg-white dark:bg-[#18181B] hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs" title="Làm mới số liệu">
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-stone-500"></i>
                <span class="hidden sm:inline">Làm Mới</span>
              </button>
              <span class="px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-[11px] font-mono font-bold rounded-xl flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-orange-600"></i>
                <span class="hidden md:inline">ACID WAL</span>
              </span>
            </div>
          </div>

          <!-- 2. Chỉ Số Tương Tác & Người Dùng Thời Gian Thực (Real-time Analytics & Retention) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block"></span>
                <span>Người Dùng Trực Tuyến & Tăng Trưởng Giữ Chân</span>
              </span>
              <span class="font-mono text-[10px] text-stone-400 font-normal">Cập nhật thời gian thực</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <!-- Metric 1: Số người đang dùng ngay lúc này -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/40 relative overflow-hidden">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Đang Dùng Lúc Này</span>
                  <span class="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 text-[9.5px] font-bold font-mono">
                    <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
                    <span>ONLINE</span>
                  </span>
                </div>
                <div class="text-xl sm:text-2xl font-black font-mono text-orange-600 dark:text-orange-400 mt-1.5 flex items-baseline gap-1">
                  <span>${analytics.activeUsersNow != null ? analytics.activeUsersNow : 0}</span>
                  <span class="text-xs font-normal text-stone-500 dark:text-stone-400 font-sans">người</span>
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Tương tác 30 phút qua</div>
              </div>

              <!-- Metric 2: Số người đang điền form -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/40 relative overflow-hidden">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Đang Điền Biểu Mẫu</span>
                  <i data-lucide="edit-3" class="w-4 h-4 text-orange-600"></i>
                </div>
                <div class="text-xl sm:text-2xl font-black font-mono text-orange-600 dark:text-orange-400 mt-1.5 flex items-baseline gap-1">
                  <span>${analytics.fillingFormsNow || 0}</span>
                  <span class="text-xs font-normal text-stone-500 dark:text-stone-400 font-sans">phiên</span>
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Đang làm bài chưa nộp</div>
              </div>

              <!-- Metric 3: Tỉ lệ quay lại sau khi dùng lần đầu -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/30 relative overflow-hidden">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Quay Lại Sau Lần Đầu</span>
                  <i data-lucide="user-check" class="w-4 h-4 text-stone-400"></i>
                </div>
                <div class="text-xl sm:text-2xl font-black font-mono text-stone-900 dark:text-white mt-1.5 flex items-baseline gap-1">
                  <span>${analytics.firstTimeRetentionRate != null ? analytics.firstTimeRetentionRate : 0}%</span>
                  <span class="text-xs font-normal text-orange-600 dark:text-orange-400 font-mono font-bold">Day 1</span>
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Tương tác lại sau lần đầu</div>
              </div>

              <!-- Metric 4: Tỉ lệ quay lại thường xuyên -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/30 relative overflow-hidden">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Quay Lại Thường Xuyên</span>
                  <i data-lucide="repeat" class="w-4 h-4 text-orange-600"></i>
                </div>
                <div class="text-xl sm:text-2xl font-black font-mono text-orange-600 dark:text-orange-400 mt-1.5 flex items-baseline gap-1">
                  <span>${analytics.repeatRetentionRate != null ? analytics.repeatRetentionRate : 0}%</span>
                  <span class="text-xs font-normal text-stone-500 dark:text-stone-400 font-mono">Stickiness</span>
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Tham gia từ 3 lần trở lên</div>
              </div>
            </div>

            <!-- Dải chip thống kê chất lượng phụ trợ (abc, v.v) -->
            <div class="flex items-center gap-2 flex-wrap pt-0.5 text-xs text-stone-600 dark:text-stone-400">
              <span class="px-2.5 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg flex items-center gap-1.5 font-medium">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-orange-600"></i>
                <span>Tỉ lệ hoàn thành form: <strong class="font-mono text-stone-900 dark:text-white font-bold">${analytics.completionRatePct != null ? analytics.completionRatePct : 0}%</strong></span>
              </span>
              <span class="px-2.5 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg flex items-center gap-1.5 font-medium">
                <i data-lucide="clock-3" class="w-3.5 h-3.5 text-stone-500"></i>
                <span>Thời gian điền TB: <strong class="font-mono text-stone-900 dark:text-white font-bold">${analytics.avgCompletionTimeSec > 0 ? (Math.floor(analytics.avgCompletionTimeSec / 60) + 'p ' + (analytics.avgCompletionTimeSec % 60) + 's') : '0s'}</strong></span>
              </span>
              <span class="px-2.5 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg flex items-center gap-1.5 font-medium">
                <i data-lucide="shield" class="w-3.5 h-3.5 text-orange-600"></i>
                <span>Điểm uy tín trung bình: <strong class="font-mono text-stone-900 dark:text-white font-bold">${analytics.avgTrustScore != null ? analytics.avgTrustScore : 0} / 100</strong></span>
              </span>
            </div>
          </div>

          <!-- Biểu Đồ Xu Hướng Sàn SVG -->
          <div class="bento-card p-4 sm:p-5 space-y-3">
            <div id="admin-trends-chart-container"></div>
          </div>

          <!-- 3. Lưới 8 Chỉ Số KPI Bento Gọn Gàng (Financial & Operational Metrics) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
              <span>Chỉ Số Kinh Tế & Nghĩa Vụ Tài Chính Sàn</span>
              <span class="font-mono text-[10px] text-stone-400 font-normal">Tỷ giá 1:1 VNĐ</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <!-- KPI 1: Tổng tiền nạp -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Tổng Tiền Nạp</span>
                  <i data-lucide="wallet" class="w-4 h-4 text-stone-400"></i>
                </div>
                <div class="text-lg sm:text-xl font-black font-mono ${(fin.totalDepositedVnd || 0) > 0 ? 'text-stone-900 dark:text-white' : 'text-stone-400 dark:text-stone-600'} mt-1.5">
                  ${(fin.totalDepositedVnd || 0).toLocaleString('vi-VN')} đ
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Sổ cái nạp Doanh Nghiệp</div>
              </div>

              <!-- KPI 2: Escrow đang khóa -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Escrow Đang Khóa</span>
                  <i data-lucide="lock" class="w-4 h-4 text-orange-600"></i>
                </div>
                <div class="text-lg sm:text-xl font-black font-mono ${(fin.escrowLockedBalance || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400 dark:text-stone-600'} mt-1.5">
                  ${(fin.escrowLockedBalance || 0).toLocaleString('vi-VN')} đ
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Khảo sát ACTIVE</div>
              </div>

              <!-- KPI 3: Đã chi trả cho đáp viên -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Chi Trả Đáp Viên</span>
                  <i data-lucide="gift" class="w-4 h-4 text-stone-400"></i>
                </div>
                <div class="text-lg sm:text-xl font-black font-mono ${(fin.totalRespondentEarnedVnd || 0) > 0 ? 'text-stone-900 dark:text-white' : 'text-stone-400 dark:text-stone-600'} mt-1.5">
                  ${(fin.totalRespondentEarnedVnd || 0).toLocaleString('vi-VN')} đ
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Thưởng mẫu VALIDATED</div>
              </div>

              <!-- KPI 4: Doanh thu & Lợi nhuận sàn -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Lợi Nhuận Thực Thu</span>
                  <i data-lucide="trending-up" class="w-4 h-4 text-orange-600"></i>
                </div>
                <div class="text-lg sm:text-xl font-black font-mono ${(fin.grossPlatformProfitVnd || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400 dark:text-stone-600'} mt-1.5">
                  ${(fin.grossPlatformProfitVnd || 0).toLocaleString('vi-VN')} đ
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Spread (${fin.actualTakeRatePct || 40}%) + Phí rút</div>
              </div>

              <!-- KPI 5: Điểm lưu hành -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Điểm Lưu Hành</span>
                  <i data-lucide="coins" class="w-4 h-4 text-stone-400"></i>
                </div>
                <div class="text-lg sm:text-xl font-black font-mono ${(fin.circulatingPointLiability || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400 dark:text-stone-600'} mt-1.5">
                  ${(fin.circulatingPointLiability || 0).toLocaleString('vi-VN')} pts
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Nợ: ${(fin.circulatingPointLiabilityVnd || 0).toLocaleString('vi-VN')} đ</div>
              </div>

              <!-- KPI 6: Rút tiền chờ duyệt -->
              <div onclick="VibeApp.navigate('admin-payouts')" class="cursor-pointer bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 hover:border-orange-500/50 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Rút Chờ Duyệt</span>
                  <i data-lucide="clock" class="w-4 h-4 text-orange-600"></i>
                </div>
                <div class="text-lg sm:text-xl font-black font-mono ${(fin.pendingPayoutVnd || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400 dark:text-stone-600'} mt-1.5">
                  ${(fin.pendingPayoutVnd || 0).toLocaleString('vi-VN')} đ
                </div>
                <div class="text-[10.5px] text-orange-600 dark:text-orange-400 mt-0.5 font-bold flex items-center gap-1">
                  <span>Xem duyệt ngay</span>
                  <i data-lucide="chevron-right" class="w-3 h-3"></i>
                </div>
              </div>

              <!-- KPI 7: Đã thanh toán thành công -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Đã Thanh Toán</span>
                  <i data-lucide="check-circle" class="w-4 h-4 text-stone-400"></i>
                </div>
                <div class="text-lg sm:text-xl font-black font-mono ${(fin.totalCompletedPayoutVnd || 0) > 0 ? 'text-stone-900 dark:text-white' : 'text-stone-400 dark:text-stone-600'} mt-1.5">
                  ${(fin.totalCompletedPayoutVnd || 0).toLocaleString('vi-VN')} đ
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Giải ngân hoàn tất</div>
              </div>

              <!-- KPI 8: Tái đầu tư Credit -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[10.5px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Tái Đầu Tư Credit</span>
                  <i data-lucide="repeat" class="w-4 h-4 text-stone-400"></i>
                </div>
                <div class="text-lg sm:text-xl font-black font-mono ${(fin.swappedCreditVnd || 0) > 0 ? 'text-stone-900 dark:text-white' : 'text-stone-400 dark:text-stone-600'} mt-1.5">
                  ${(fin.swappedCreditVnd || 0).toLocaleString('vi-VN')} đ
                </div>
                <div class="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">Thưởng nạp +5%</div>
              </div>
            </div>
          </div>

          <!-- 3. Khu Vực Vận Hành 2 Cột Đối Xứng Ngang Bằng Nhau (Equal Height Split Grid) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <!-- Cột Trái: Phân Bổ Khảo Sát & Sổ Cái Sàn (lg:col-span-7) -->
            <div class="lg:col-span-7 flex flex-col gap-4">
              <!-- Khối Phân Bổ Khảo Sát Theo Phân Khúc -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 shrink-0">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                      <i data-lucide="pie-chart" class="w-4 h-4 text-orange-600"></i>
                      <span>Phân Bổ Khảo Sát (3 Phân Khúc)</span>
                    </h2>
                  </div>
                  <span class="text-xs font-mono font-bold text-stone-700 dark:text-stone-300">Tổng: ${dist.total || (dist.student + dist.personal + dist.enterprise)} bài</span>
                </div>

                <!-- Thanh Swiss Bar -->
                <div class="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden flex">
                  <div style="width: ${pctStudent}%" class="bg-stone-400 dark:bg-stone-600 transition-all duration-300" title="Sinh viên: ${dist.student} (${pctStudent}%)"></div>
                  <div style="width: ${pctPersonal}%" class="bg-orange-500 transition-all duration-300" title="Cá nhân: ${dist.personal} (${pctPersonal}%)"></div>
                  <div style="width: ${pctEnterprise}%" class="bg-orange-600 transition-all duration-300" title="Doanh nghiệp: ${dist.enterprise} (${pctEnterprise}%)"></div>
                </div>

                <!-- 3 Thẻ Phân Khúc Gọn Gàng -->
                <div class="grid grid-cols-3 gap-2 pt-0.5">
                  <div class="p-2.5 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl space-y-0.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block"></span>
                        <span class="truncate">Sinh Viên</span>
                      </span>
                      <span class="text-[10px] font-mono font-bold text-stone-500">${pctStudent}%</span>
                    </div>
                    <div class="text-sm font-black font-mono text-stone-900 dark:text-white">${dist.student} bài</div>
                    <div class="text-[9.5px] text-stone-400 truncate">400đ - 600đ</div>
                  </div>

                  <div class="p-2.5 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl space-y-0.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
                        <span class="truncate">Cá Nhân</span>
                      </span>
                      <span class="text-[10px] font-mono font-bold text-orange-600">${pctPersonal}%</span>
                    </div>
                    <div class="text-sm font-black font-mono text-stone-900 dark:text-white">${dist.personal} bài</div>
                    <div class="text-[9.5px] text-stone-400 truncate">800đ - 1.200đ</div>
                  </div>

                  <div class="p-2.5 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl space-y-0.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-orange-600 inline-block"></span>
                        <span class="truncate">Doanh Nghiệp</span>
                      </span>
                      <span class="text-[10px] font-mono font-bold text-orange-600">${pctEnterprise}%</span>
                    </div>
                    <div class="text-sm font-black font-mono text-stone-900 dark:text-white">${dist.enterprise} bài</div>
                    <div class="text-[9.5px] text-stone-400 truncate">1.500đ - 2.500đ</div>
                  </div>
                </div>
              </div>

              <!-- Khối Bảng Biến Động Sổ Cái Sàn Gần Nhất (Co giãn flex-1 để ngang bằng đáy) -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs flex-1 flex flex-col min-h-0 space-y-3">
                <div class="flex items-center justify-between shrink-0">
                  <div>
                    <h2 class="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                      <i data-lucide="layers" class="w-4 h-4 text-orange-600"></i>
                      <span>Sổ Cái Sàn Gần Nhất (Ledger Stream)</span>
                    </h2>
                  </div>
                  <span class="text-[11px] text-stone-400 font-mono">${ledger.length} giao dịch gần nhất</span>
                </div>

                <div class="overflow-x-auto rounded-xl border border-stone-100 dark:border-stone-800 flex-1 min-h-[220px] max-h-[380px] overflow-y-auto scrollbar-thin">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-stone-50 dark:bg-stone-900/80 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100 dark:border-stone-800 sticky top-0 z-10 backdrop-blur-xs">
                      <tr>
                        <th class="p-2.5">Thời Gian</th>
                        <th class="p-2.5">Tài Khoản</th>
                        <th class="p-2.5">Nghiệp Vụ</th>
                        <th class="p-2.5 text-right">Biến Động</th>
                        <th class="p-2.5 text-right">Số Dư Sau</th>
                        <th class="p-2.5">Diễn Giải</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100 dark:divide-stone-800 font-normal">
                      ${ledger.length === 0 ? `
                        <tr><td colspan="6" class="p-6 text-center text-stone-400">Chưa có giao dịch sổ cái nào được ghi nhận.</td></tr>
                      ` : ledger.map(t => {
        const isPositive = t.amount > 0;
        const amountText = `${isPositive ? '+' : ''}${t.amount.toLocaleString('vi-VN')} ${t.currency}`;
        const colorClass = isPositive ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-stone-700 dark:text-stone-300 font-bold';

        let typeBadge = '';
        switch (t.tx_type) {
          case 'DEPOSIT_CREDIT':
            typeBadge = '<span class="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold rounded text-[9.5px]">NẠP CREDIT</span>';
            break;
          case 'ESCROW_LOCK':
            typeBadge = '<span class="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold rounded text-[9.5px]">KHÓA ESCROW</span>';
            break;
          case 'ESCROW_REFUND':
            typeBadge = '<span class="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold rounded text-[9.5px]">HOÀN ESCROW</span>';
            break;
          case 'SURVEY_REWARD':
            typeBadge = '<span class="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold rounded text-[9.5px]">TRẢ THƯỞNG</span>';
            break;
          case 'POINT_TO_CREDIT_SWAP':
            typeBadge = '<span class="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-bold rounded text-[9.5px]">ĐỔI CREDIT</span>';
            break;
          case 'PAYOUT_DEDUCT':
            typeBadge = '<span class="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold rounded text-[9.5px]">RÚT THƯỞNG</span>';
            break;
          case 'PAYOUT_REFUND':
            typeBadge = '<span class="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold rounded text-[9.5px]">HOÀN ĐIỂM</span>';
            break;
          default:
            typeBadge = `<span class="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold rounded text-[9.5px]">${t.tx_type}</span>`;
        }

        return `
                          <tr class="hover:bg-stone-50/50 dark:hover:bg-stone-900/40 transition-colors">
                            <td class="p-2.5 whitespace-nowrap">
                              <div class="font-mono text-stone-700 dark:text-stone-300 font-bold text-[11px]">${new Date(t.created_at).toLocaleTimeString('vi-VN')}</div>
                              <div class="font-mono text-[9px] text-stone-400">${new Date(t.created_at).toLocaleDateString('vi-VN')}</div>
                            </td>
                            <td class="p-2.5">
                              <div class="font-bold text-stone-800 dark:text-stone-200 truncate max-w-[110px]">${t.user_name || 'Hệ thống'}</div>
                              <div class="text-[10px] text-stone-400 truncate max-w-[110px]">${t.user_email || ''}</div>
                            </td>
                            <td class="p-2.5 whitespace-nowrap">${typeBadge}</td>
                            <td class="p-2.5 text-right font-mono text-[11px] whitespace-nowrap ${colorClass}">${amountText}</td>
                            <td class="p-2.5 text-right font-mono text-[10.5px] text-stone-600 dark:text-stone-400 whitespace-nowrap">${t.balance_after.toLocaleString('vi-VN')}</td>
                            <td class="p-2.5 text-stone-600 dark:text-stone-400 max-w-[140px] truncate text-[11px]" title="${t.description || ''}">${t.description || 'N/A'}</td>
                          </tr>
                        `;
      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Cột Phải: Admin Fast Command Console Ngang Bằng 100% (lg:col-span-5) -->
            <div class="lg:col-span-5 flex flex-col">
              <div class="admin-console-box bg-[#09090B] border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl flex-1 flex flex-col justify-between min-h-0 space-y-3 text-stone-200">
                <!-- Header Console -->
                <div class="flex items-center justify-between pb-2.5 border-b border-stone-800/80 shrink-0">
                  <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-orange-500/80 inline-block"></span>
                      <span class="w-2.5 h-2.5 rounded-full bg-orange-500/80 inline-block"></span>
                      <span class="w-2.5 h-2.5 rounded-full bg-orange-500/80 inline-block"></span>
                    </div>
                    <div class="h-3.5 w-px bg-stone-800 mx-0.5"></div>
                    <div class="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                      <i data-lucide="terminal" class="w-3.5 h-3.5 text-orange-500"></i>
                      <span>Fast CLI v3.0</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <button type="button" onclick="VibeApp.clearAdminConsole()" class="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 font-mono text-[10.5px] border border-stone-800 transition-colors">Clear</button>
                    <button type="button" onclick="VibeApp.openAdminConsoleModal()" class="px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-mono text-[10.5px] font-bold transition-all shadow-xs flex items-center gap-1" title="Phóng to toàn màn hình">
                      <i data-lucide="maximize-2" class="w-3 h-3"></i>
                      <span>F2</span>
                    </button>
                  </div>
                </div>

                <!-- Dải nút lệnh tắt 1 chạm -->
                <div class="flex items-center flex-wrap gap-1 text-[11px] font-mono shrink-0">
                  <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/help')" class="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors">/help</button>
                  <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/stats')" class="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors">/stats</button>
                  <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/naptien acc1 100000')" class="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-orange-400 border border-stone-800 transition-colors font-bold">+100k</button>
                  <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/congdiem acc1 500')" class="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-orange-400 border border-stone-800 transition-colors font-bold">+500pts</button>
                  <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/settier me STUDENT')" class="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors">SV</button>
                  <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/settier me PERSONAL')" class="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors">Cá nhân</button>
                  <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/resetpoint all')" class="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-orange-400 border border-stone-800 transition-colors">Reset</button>
                  <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/cleantest')" class="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-orange-400 border border-stone-800 transition-colors font-bold">Xóa Test</button>
                </div>

                <!-- Màn hình Terminal Output Tự Động Co Giãn Ngang Bằng Cột Trái -->
                <div id="adminConsoleOutput" class="admin-console-output bg-black/90 border border-stone-800/90 rounded-xl p-3 sm:p-4 flex-1 min-h-[220px] max-h-[420px] overflow-y-auto font-mono text-xs space-y-1.5 leading-relaxed scrollbar-thin scrollbar-thumb-stone-800">
                </div>

                <!-- Input Form Nhập Lệnh -->
                <form onsubmit="event.preventDefault(); VibeApp.submitAdminConsoleCommand(null, this);" class="flex items-center gap-1.5 pt-0.5 shrink-0">
                  <div class="flex-1 flex items-center gap-2 bg-black/90 border border-stone-800 focus-within:border-orange-600 rounded-xl px-3 py-2 sm:py-2.5 transition-all">
                    <span class="text-orange-500 font-mono font-black select-none text-xs">vibe:~$</span>
                    <input 
                      type="text" 
                      id="adminConsoleInput" 
                      autocomplete="off" 
                      spellcheck="false"
                      onkeydown="VibeApp.handleAdminConsoleKeyDown(event)"
                      placeholder="Lệnh (/naptien, /congdiem, /settier, /ban)..." 
                      class="flex-1 bg-transparent border-0 text-white font-mono text-xs placeholder:text-stone-600 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="button" 
                    onclick="VibeApp.submitAdminConsoleCommand(null, this.closest('form'))"
                    id="adminConsoleSubmitBtn"
                    class="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1 shadow-xs active:scale-95 whitespace-nowrap">
                    <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                    <span>Chạy</span>
                  </button>
                </form>
                <div class="flex items-center justify-between text-[10px] text-stone-500 font-mono px-0.5 shrink-0">
                  <span>Phím tắt: Enter chạy | ↑/↓ lịch sử</span>
                  <span>Nhấn F2 để phóng to</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      this.renderAdminConsoleLogs(document.getElementById('adminConsoleOutput'));
      this.loadAndRenderAdminTrendsChart('admin-trends-chart-container', (this._adminTrendsState && this._adminTrendsState.days) || 14);
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Lỗi renderAdminOverviewView:', err);
      this.showToast('Lỗi khi tải dữ liệu tổng quan kinh tế', 'error');
    }
  },

  // ==================== VIEW 9: ADMIN PAYOUTS & AUDIT ====================
  async renderAdminPayoutsView(root) {
    if (!this.state.currentUser || this.state.currentUser.role !== 'ADMIN') {
      this.showToast('Bạn không có quyền truy cập trang duyệt chi thưởng', 'error');
      this.navigate('surveys');
      return;
    }

    if (!this._adminPayoutsState) {
      this._adminPayoutsState = {
        status: '',
        type: '',
        page: 1,
        limit: 10
      };
    }

    const { status, type, page, limit } = this._adminPayoutsState;
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    if (status) queryParams.append('status', status);
    if (type) queryParams.append('type', type);

    try {
      const res = await this.api(`/admin/payouts?${queryParams.toString()}`);
      const payouts = (res && res.payouts) || [];
      const pagination = (res && res.pagination) || { page: 1, limit: 10, totalItems: payouts.length, totalPages: 1 };

      const totalPages = pagination.totalPages || 1;
      this._adminPayoutsState.totalPages = totalPages;
      if (this._adminPayoutsState.page > totalPages && totalPages > 0) {
        this._adminPayoutsState.page = totalPages;
      }

      // Xác định nhãn hiển thị cho 3 Custom Dropdown
      let typeLabel = 'Tất cả phương thức';
      if (type === 'BANK_TRANSFER') typeLabel = 'Ngân hàng';
      else if (type === 'MOMO') typeLabel = 'Ví MoMo';
      else if (type === 'PHONE_CARD') typeLabel = 'Thẻ Cào';

      let statusLabel = 'Tất cả trạng thái';
      if (status === 'PENDING') statusLabel = 'Chờ duyệt';
      else if (status === 'COMPLETED') statusLabel = 'Đã duyệt';
      else if (status === 'REJECTED') statusLabel = 'Đã từ chối';

      let limitLabel = `${limit} dòng`;

      root.innerHTML = `
        <div class="space-y-6">
          ${this.renderAdminSubNav('admin-payouts')}

          <div class="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Duyệt Yêu Cầu Rút Thưởng & Đối Soát</h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kiểm toán điểm uy tín (Trust Score), đối soát tài khoản nhận và giải ngân thanh toán.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 bg-zinc-50 dark:bg-zinc-950/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold rounded-lg">
                Tổng: ${pagination.totalItems} yêu cầu
              </span>
            </div>
          </div>

          <!-- Bộ lọc: Custom Dropdowns Tiêu Chuẩn & Phân Trang -->
          <div class="bento-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2.5">
              <!-- Custom Dropdown: Phương thức nhận -->
              <div class="relative">
                <button 
                  type="button" 
                  onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('admin-payout-type-menu', event)" 
                  class="custom-dropdown-trigger flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-xs">
                  <span class="text-stone-400 dark:text-stone-500 font-normal">Phương thức:</span>
                  <span class="font-bold text-slate-800 dark:text-slate-100">${typeLabel}</span>
                  <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3.5 h-3.5 stroke-[2] transition-transform duration-200 pointer-events-none text-slate-400"></i>
                </button>
                <div id="admin-payout-type-menu" class="custom-dropdown-menu hidden absolute left-0 z-50 mt-1.5 min-w-[220px] p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('type', '')" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${type === '' ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Tất cả phương thức</span>
                    ${type === '' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('type', 'BANK_TRANSFER')" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${type === 'BANK_TRANSFER' ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Chuyển khoản Ngân hàng</span>
                    ${type === 'BANK_TRANSFER' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('type', 'MOMO')" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${type === 'MOMO' ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Ví điện tử MoMo</span>
                    ${type === 'MOMO' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('type', 'PHONE_CARD')" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${type === 'PHONE_CARD' ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Thẻ cào (Viettel/Vina/Mobi)</span>
                    ${type === 'PHONE_CARD' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                </div>
              </div>

              <!-- Custom Dropdown: Trạng thái -->
              <div class="relative">
                <button 
                  type="button" 
                  onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('admin-payout-status-menu', event)" 
                  class="custom-dropdown-trigger flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-xs">
                  <span class="text-stone-400 dark:text-stone-500 font-normal">Trạng thái:</span>
                  <span class="font-bold text-slate-800 dark:text-slate-100">${statusLabel}</span>
                  <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3.5 h-3.5 stroke-[2] transition-transform duration-200 pointer-events-none text-slate-400"></i>
                </button>
                <div id="admin-payout-status-menu" class="custom-dropdown-menu hidden absolute left-0 z-50 mt-1.5 min-w-[200px] p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('status', '')" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${status === '' ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Tất cả trạng thái</span>
                    ${status === '' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('status', 'PENDING')" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${status === 'PENDING' ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Chờ duyệt (PENDING)</span>
                    ${status === 'PENDING' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('status', 'COMPLETED')" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${status === 'COMPLETED' ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Đã duyệt (COMPLETED)</span>
                    ${status === 'COMPLETED' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('status', 'REJECTED')" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${status === 'REJECTED' ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>Đã từ chối (REJECTED)</span>
                    ${status === 'REJECTED' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                </div>
              </div>

              <!-- Custom Dropdown: Số lượng dòng/trang -->
              <div class="relative">
                <button 
                  type="button" 
                  onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('admin-payout-limit-menu', event)" 
                  class="custom-dropdown-trigger flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-xs">
                  <span class="text-stone-400 dark:text-stone-500 font-normal">Dòng/trang:</span>
                  <span class="font-bold text-slate-800 dark:text-slate-100">${limitLabel}</span>
                  <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3.5 h-3.5 stroke-[2] transition-transform duration-200 pointer-events-none text-slate-400"></i>
                </button>
                <div id="admin-payout-limit-menu" class="custom-dropdown-menu hidden absolute left-0 z-50 mt-1.5 min-w-[140px] p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('limit', 10)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${limit == 10 ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>10 dòng</span>
                    ${limit == 10 ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('limit', 20)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${limit == 20 ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>20 dòng</span>
                    ${limit == 20 ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                  <div onclick="event.stopPropagation(); VibeApp.setAdminPayoutFilter('limit', 50)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${limit == 50 ? 'text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-stone-800' : 'text-slate-700 dark:text-slate-200'}">
                    <span>50 dòng</span>
                    ${limit == 50 ? '<i data-lucide="check" class="w-3.5 h-3.5 text-zinc-600"></i>' : ''}
                  </div>
                </div>
              </div>
            </div>

            <!-- Điều hướng phân trang nhanh -->
            <div class="flex items-center gap-2 text-xs font-mono">
              <span class="text-slate-500 font-medium">Trang ${pagination.page} / ${totalPages}</span>
              <button 
                type="button"
                onclick="VibeApp.setAdminPayoutPage(-1)" 
                ${pagination.page <= 1 ? 'disabled class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg cursor-not-allowed font-bold text-xs"' : 'class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs transition-all shadow-xs"'}>
                &lt; Trước
              </button>
              <button 
                type="button"
                onclick="VibeApp.setAdminPayoutPage(1)" 
                ${pagination.page >= totalPages ? 'disabled class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg cursor-not-allowed font-bold text-xs"' : 'class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs transition-all shadow-xs"'}>
                Sau &gt;
              </button>
            </div>
          </div>

          <!-- Bảng danh sách yêu cầu rút tiền -->
          <div class="bento-card p-5 space-y-4">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th class="p-3">Người Yêu Cầu</th>
                    <th class="p-3">Điểm Uy Tín & Rủi Ro</th>
                    <th class="p-3">Số Tiền & Phí</th>
                    <th class="p-3">Phương Thức & Người Nhận</th>
                    <th class="p-3">Trạng Thái / Thời Gian</th>
                    <th class="p-3 text-right whitespace-nowrap min-w-[200px]">Thao Tác Quyết Định</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  ${payouts.length === 0 ? `
                    <tr><td colspan="6" class="p-8 text-center text-slate-400">Không tìm thấy yêu cầu rút tiền nào phù hợp với bộ lọc.</td></tr>
                  ` : payouts.map(p => {
        const trust = parseFloat(p.trust_score !== undefined && p.trust_score !== null ? p.trust_score : 100);

        let trustBadge = '';
        if (trust < 60) {
          trustBadge = `
                        <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 font-bold rounded text-[11px]">
                          <i data-lucide="alert-octagon" class="w-3 h-3 text-orange-600"></i>
                          <span>RỦI RO CAO (${trust}đ)</span>
                        </div>
                        <div class="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5 font-bold">Không khuyến nghị duyệt tự động</div>
                      `;
        } else if (trust < 80) {
          trustBadge = `
                        <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 font-bold rounded text-[11px]">
                          <i data-lucide="alert-triangle" class="w-3 h-3 text-orange-600"></i>
                          <span>CẦN LƯU Ý (${trust}đ)</span>
                        </div>
                        <div class="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5">Kiểm tra kỹ lịch sử khảo sát</div>
                      `;
        } else {
          trustBadge = `
                        <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 font-bold rounded text-[11px]">
                          <i data-lucide="shield-check" class="w-3 h-3 text-orange-600"></i>
                          <span>UY TÍN CAO (${trust}đ)</span>
                        </div>
                        <div class="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5">Hồ sơ khảo sát trung thực</div>
                      `;
        }

        // Phân tích thông tin người nhận
        let recipientInfo = null;
        try {
          recipientInfo = typeof p.recipient_info_json === 'string' ? JSON.parse(p.recipient_info_json) : p.recipient_info_json;
        } catch (e) {
          recipientInfo = {};
        }

        let methodDisplay = '';
        switch (p.payout_method) {
          case 'BANK_TRANSFER':
            methodDisplay = `
                          <div class="font-bold text-zinc-600 dark:text-zinc-400">Ngân hàng: ${recipientInfo.bank_name || recipientInfo.bank || 'NH'}</div>
                          <div class="font-mono text-slate-800 dark:text-slate-200">STK: ${recipientInfo.account_number || recipientInfo.accountNumber || 'N/A'}</div>
                          <div class="text-slate-500 uppercase text-[10px]">Chủ TK: ${recipientInfo.account_holder || recipientInfo.accountHolder || ''}</div>
                        `;
            break;
          case 'MOMO':
            methodDisplay = `
                          <div class="font-bold text-orange-600 dark:text-orange-400">Ví MoMo</div>
                          <div class="font-mono text-slate-800 dark:text-slate-200">SĐT: ${recipientInfo.phone || recipientInfo.phone_number || 'N/A'}</div>
                          <div class="text-slate-500 text-[10px]">${recipientInfo.name || ''}</div>
                        `;
            break;
          case 'PHONE_CARD':
            methodDisplay = `
                          <div class="font-bold text-orange-600 dark:text-orange-400">Thẻ Cào: ${recipientInfo.carrier || 'Nhà mạng'}</div>
                          <div class="font-mono text-slate-800 dark:text-slate-200">Mệnh giá: ${(p.fiat_amount_vnd || p.net_amount_vnd).toLocaleString()}đ</div>
                        `;
            break;
          default:
            methodDisplay = `<div class="font-mono">${p.payout_method}</div>`;
        }

        let statusBadge = '';
        switch (p.status) {
          case 'PENDING':
            statusBadge = '<span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold rounded text-[10px]">CHỜ DUYỆT</span>';
            break;
          case 'COMPLETED':
            statusBadge = '<span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold rounded text-[10px]">ĐÃ THANH TOÁN</span>';
            break;
          case 'REJECTED':
            statusBadge = '<span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold rounded text-[10px]">BỊ TỪ CHỐI</span>';
            break;
          default:
            statusBadge = `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">${p.status}</span>`;
        }

        return `
                      <tr>
                        <!-- Cột 1: Người yêu cầu -->
                        <td class="p-3">
                          <div class="font-bold text-slate-900 dark:text-white">${p.user_name}</div>
                          <div class="text-[11px] font-mono text-slate-500">${p.user_email}</div>
                          <div class="text-[10px] font-mono text-slate-400">ID: ${p.id.slice(0, 10)}...</div>
                        </td>

                        <!-- Cột 2: Điểm uy tín -->
                        <td class="p-3">${trustBadge}</td>

                        <!-- Cột 3: Số tiền & Phí -->
                        <td class="p-3">
                          <div class="text-sm font-bold font-mono text-slate-900 dark:text-white">${p.net_amount_vnd.toLocaleString('vi-VN')} đ</div>
                          <div class="text-[11px] font-mono text-slate-500">Đổi: ${p.points_amount.toLocaleString()} pts</div>
                          ${p.fee_vnd > 0 ? `<div class="text-[10px] text-slate-400 font-mono">Phí: ${p.fee_vnd.toLocaleString()}đ</div>` : ''}
                        </td>

                        <!-- Cột 4: Phương thức & Người nhận -->
                        <td class="p-3">${methodDisplay}</td>

                        <!-- Cột 5: Trạng thái & Thời gian -->
                        <td class="p-3">
                          <div>${statusBadge}</div>
                          <div class="font-mono text-[11px] text-slate-500 mt-1">${new Date(p.created_at).toLocaleString('vi-VN')}</div>
                          ${p.admin_note ? `<div class="text-[10px] text-slate-400 italic mt-0.5">Ghi chú: ${p.admin_note}</div>` : ''}
                        </td>

                        <!-- Cột 6: Thao tác -->
                        <td class="p-3 text-right whitespace-nowrap min-w-[200px]">
                          ${p.status === 'PENDING' ? `
                            <div class="inline-flex items-center justify-end gap-2">
                              <button 
                                type="button"
                                onclick="VibeApp.handleAdminPayout('${p.id}', true)" 
                                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs shadow-orange-600/20 whitespace-nowrap cursor-pointer"
                                title="Duyệt chi trả yêu cầu rút tiền này">
                                <i data-lucide="check" class="w-3.5 h-3.5 stroke-[2.5]"></i>
                                <span>Duyệt</span>
                              </button>
                              <button 
                                type="button"
                                onclick="VibeApp.handleAdminPayout('${p.id}', false)" 
                                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
                                title="Từ chối yêu cầu và hoàn trả điểm thưởng">
                                <i data-lucide="x" class="w-3.5 h-3.5 stroke-[2.5]"></i>
                                <span>Từ chối</span>
                              </button>
                            </div>
                          ` : (p.status === 'COMPLETED' ? `
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 font-mono">
                              <i data-lucide="check-check" class="w-3.5 h-3.5 stroke-[2.2]"></i>
                              <span>Đã thanh toán</span>
                            </span>
                          ` : `
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-stone-400 dark:text-stone-500 font-mono">
                              <i data-lucide="ban" class="w-3.5 h-3.5 stroke-[2]"></i>
                              <span>Đã từ chối</span>
                            </span>
                          `)}
                        </td>
                      </tr>
                    `;
      }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Phân trang đáy bảng -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span class="text-slate-500 font-medium">
                Hiển thị trang <strong>${pagination.page}</strong> trên tổng số <strong>${totalPages}</strong> trang (Tổng <strong>${pagination.totalItems}</strong> yêu cầu)
              </span>
              <div class="flex items-center gap-2 font-mono">
                <button 
                  type="button"
                  onclick="VibeApp.setAdminPayoutPage(-1)" 
                  ${pagination.page <= 1 ? 'disabled class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800/60 text-stone-400 dark:text-stone-600 rounded-xl cursor-not-allowed font-bold text-xs"' : 'class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-xl font-bold text-xs transition-all shadow-2xs active:scale-95 cursor-pointer"'}>
                  <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                  <span>Trang Trước</span>
                </button>
                <button 
                  type="button"
                  onclick="VibeApp.setAdminPayoutPage(1)" 
                  ${pagination.page >= totalPages ? 'disabled class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800/60 text-stone-400 dark:text-stone-600 rounded-xl cursor-not-allowed font-bold text-xs"' : 'class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-xl font-bold text-xs transition-all shadow-2xs active:scale-95 cursor-pointer"'}>
                  <span>Trang Sau</span>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Lỗi renderAdminPayoutsView:', err);
      this.showToast('Lỗi khi tải danh sách yêu cầu rút tiền', 'error');
    }
  },

  setAdminPayoutFilter(key, value) {
    if (!this._adminPayoutsState) {
      this._adminPayoutsState = { status: '', type: '', page: 1, limit: 10 };
    }
    this._adminPayoutsState[key] = value;
    this._adminPayoutsState.page = 1; // Reset về trang 1 khi đổi bộ lọc
    this.closeAllCustomDropdowns();
    const root = document.getElementById('app-root');
    if (root) this.renderAdminPayoutsView(root);
  },

  setAdminPayoutPage(delta) {
    if (!this._adminPayoutsState) return;
    this.haptic('light');
    const maxPages = this._adminPayoutsState.totalPages || 1;
    const currentPage = this._adminPayoutsState.page || 1;
    const targetPage = Math.min(maxPages, Math.max(1, currentPage + delta));
    if (targetPage === currentPage) return;
    this._adminPayoutsState.page = targetPage;
    const root = document.getElementById('app-root');
    if (root) this.renderAdminPayoutsView(root);
  },

  async handleAdminPayout(payoutId, isApproved) {
    const action = isApproved ? 'APPROVE' : 'REJECT';
    if (!isApproved) {
      const confirmReject = confirm('Bạn có chắc chắn muốn TỪ CHỐI yêu cầu rút thưởng này không?\n\nSố điểm thưởng sẽ được hoàn trả tự động lại ví của người dùng.');
      if (!confirmReject) return;
    }
    this.haptic('medium');
    try {
      await this.api(`/admin/payouts/${payoutId}/action`, {
        method: 'POST',
        body: JSON.stringify({
          is_approved: Boolean(isApproved),
          action,
          admin_note: isApproved ? 'Đã duyệt qua ngân hàng / cổng thanh toán' : 'Từ chối giải ngân và hoàn trả điểm thưởng'
        })
      });
      this.haptic('success');
      this.showToast(isApproved ? 'Đã phê duyệt lệnh rút thưởng!' : 'Đã từ chối lệnh rút thưởng và hoàn điểm', 'success');
      const root = document.getElementById('app-root');
      if (root) this.renderAdminPayoutsView(root);
    } catch (e) {
      this.haptic('error');
      this.showToast(e.message, 'error');
    }
  },

  // ==================== VIEW 10: ADMIN FRAUD & GOVERNANCE ====================
  async renderAdminFraudView(root) {
    if (!this.state.currentUser || this.state.currentUser.role !== 'ADMIN') {
      this.showToast('Bạn không có quyền truy cập trang quản trị gian lận', 'error');
      this.navigate('surveys');
      return;
    }

    try {
      const [resStats, resLogs, resBanned] = await Promise.all([
        this.api('/admin/fraud-stats').catch(() => ({ stats: { traps: {} } })),
        this.api('/admin/fraud-logs').catch(() => ({ logs: [] })),
        this.api('/admin/banned-ips').catch(() => ({ bannedIps: [] }))
      ]);

      const stats = (resStats && resStats.stats) || { traps: {} };
      const traps = stats.traps || {};
      const logs = (resLogs && resLogs.logs) || [];
      const bannedIps = (resBanned && resBanned.bannedIps) || [];

      // Kiểm tra xem có kết quả tìm kiếm user đang được lưu tạm không
      const searchResults = this._adminSearchedUsers || null;

      // Phân trang cho bảng Nhật ký cảnh báo khả nghi & gian lận (Mặc định 5 dòng/trang theo chuẩn tối giản)
      const fraudLimit = Number(this.state.fraudLogLimit) || 5;
      const totalFraudLogs = logs.length;
      const totalFraudPages = Math.max(1, Math.ceil(totalFraudLogs / fraudLimit));
      if (!this.state.fraudLogPage || this.state.fraudLogPage < 1) {
        this.state.fraudLogPage = 1;
      } else if (this.state.fraudLogPage > totalFraudPages) {
        this.state.fraudLogPage = totalFraudPages;
      }
      this._lastFraudLogsCount = totalFraudLogs;

      const startFraudIdx = (this.state.fraudLogPage - 1) * fraudLimit;
      const pagedLogs = logs.slice(startFraudIdx, startFraudIdx + fraudLimit);

      root.innerHTML = `
        <div class="space-y-6">
          ${this.renderAdminSubNav('admin-fraud')}

          <div class="pb-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Kiểm Soát Gian Lận & An Ninh Đa Tầng</h1>
              <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Giám sát 5 loại bẫy kỹ thuật, điều tra tài khoản người dùng và quản trị an ninh hệ thống.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1.5 ${bannedIps.length > 0 ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60' : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'} text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs">
                <i data-lucide="shield-alert" class="w-3.5 h-3.5 ${bannedIps.length > 0 ? 'text-orange-600' : 'text-stone-400'}"></i>
                <span>${bannedIps.length} IP Đang Bị Cấm</span>
              </span>
              <span class="px-3 py-1.5 bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold rounded-xl shadow-xs flex items-center gap-1.5">
                <i data-lucide="user-x" class="w-3.5 h-3.5 text-orange-600"></i>
                <span>${stats.bannedUsersCount || 0} User Bị Khóa</span>
              </span>
            </div>
          </div>

          <!-- Khối 1: Thống kê số lượng vi phạm theo 5 loại bẫy kỹ thuật (Bento Grid chuẩn DESIGN.MD) -->
          <div>
            <div class="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2.5">
              Thống Kê Vi Phạm Theo 5 Loại Bẫy Kỹ Thuật (Anti-Fraud Traps Breakdown)
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <!-- Bẫy 1: Speed Trap -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs relative overflow-hidden transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-black text-stone-600 dark:text-stone-300 uppercase tracking-wider">1. Bẫy Tốc Độ</span>
                  <i data-lucide="gauge" class="w-3.5 h-3.5 text-stone-400"></i>
                </div>
                <div class="text-[10px] text-stone-400 font-mono mt-0.5">Speed Trap</div>
                <div class="text-2xl font-black font-mono ${traps.speedTrap > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400 dark:text-stone-600'} mt-2">
                  ${traps.speedTrap || 0}
                </div>
                <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-medium">&lt; 35% thời lượng đọc chuẩn</div>
              </div>

              <!-- Bẫy 2: Attention Check -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs relative overflow-hidden transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-black text-stone-600 dark:text-stone-300 uppercase tracking-wider">2. Bẫy Tập Trung</span>
                  <i data-lucide="eye" class="w-3.5 h-3.5 text-stone-400"></i>
                </div>
                <div class="text-[10px] text-stone-400 font-mono mt-0.5">Attention Check</div>
                <div class="text-2xl font-black font-mono ${traps.attentionCheck > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400 dark:text-stone-600'} mt-2">
                  ${traps.attentionCheck || 0}
                </div>
                <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-medium">Sai câu bẫy chú ý 2 lần</div>
              </div>

              <!-- Bẫy 3: Straight-lining -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs relative overflow-hidden transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-black text-stone-600 dark:text-stone-300 uppercase tracking-wider">3. Thẳng Hàng</span>
                  <i data-lucide="align-justify" class="w-3.5 h-3.5 text-stone-400"></i>
                </div>
                <div class="text-[10px] text-stone-400 font-mono mt-0.5">Straight-lining</div>
                <div class="text-2xl font-black font-mono ${traps.straightLining > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400 dark:text-stone-600'} mt-2">
                  ${traps.straightLining || 0}
                </div>
                <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-medium">Phương sai sigma^2 = 0</div>
              </div>

              <!-- Bẫy 4: Open-Text Filter -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs relative overflow-hidden transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-black text-stone-600 dark:text-stone-300 uppercase tracking-wider">4. Tự Luận Rác</span>
                  <i data-lucide="file-text" class="w-3.5 h-3.5 text-stone-400"></i>
                </div>
                <div class="text-[10px] text-stone-400 font-mono mt-0.5">Open-Text Filter</div>
                <div class="text-2xl font-black font-mono ${traps.openTextFilter > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400 dark:text-stone-600'} mt-2">
                  ${traps.openTextFilter || 0}
                </div>
                <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-medium">Spam phím, entropy thấp</div>
              </div>

              <!-- Bẫy 5: Duplicate Fingerprint -->
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs relative overflow-hidden transition-all hover:border-orange-500/30">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-black text-stone-600 dark:text-stone-300 uppercase tracking-wider">5. Trùng Thiết Bị</span>
                  <i data-lucide="smartphone" class="w-3.5 h-3.5 text-stone-400"></i>
                </div>
                <div class="text-[10px] text-stone-400 font-mono mt-0.5">Multi-Account/IP</div>
                <div class="text-2xl font-black font-mono ${traps.duplicateFingerprint > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400 dark:text-stone-600'} mt-2">
                  ${traps.duplicateFingerprint || 0}
                </div>
                <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-medium">&gt;= 3 tài khoản / thiết bị</div>
              </div>
            </div>
          </div>

          <!-- Khối 2: Tra cứu tài khoản & Mở khóa (Unban) -->
          <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 class="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                  <i data-lucide="search" class="w-4 h-4 text-orange-600"></i>
                  <span>Tra Cứu Tài Khoản, Lịch Sử Khảo Sát & Mở Khóa (Unban)</span>
                </h2>
                <p class="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Tìm kiếm theo Email hoặc Google ID để kiểm tra điểm uy tín, lịch sử làm bài và gỡ cấm tài khoản.</p>
              </div>
            </div>

            <!-- Form tìm kiếm -->
            <form onsubmit="event.preventDefault(); VibeApp.searchAdminFraudUser();" class="flex gap-2">
              <div class="relative flex-1">
                <input 
                  type="text" 
                  id="adminUserSearchInput"
                  value="${this._adminFraudSearchQuery || ''}"
                  placeholder="Nhập Email hoặc Google ID cần tra cứu (ví dụ: user@survhub.vn)..."
                  class="w-full px-3 py-2.5 pl-9 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                />
                <i data-lucide="search" class="w-4 h-4 text-stone-400 absolute left-3 top-3"></i>
              </div>
              <button 
                type="submit" 
                class="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs active:scale-95">
                <i data-lucide="search" class="w-3.5 h-3.5 stroke-[2.2]"></i>
                <span>Tra Cứu</span>
              </button>
              ${searchResults ? `
                <button 
                  type="button"
                  onclick="VibeApp.clearAdminFraudSearch()" 
                  class="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all">
                  Đóng
                </button>
              ` : ''}
            </form>

            <!-- Kết quả tìm kiếm -->
            ${searchResults ? `
              <div class="space-y-4 pt-2">
                ${searchResults.length === 0 ? `
                  <div class="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400">
                    Không tìm thấy tài khoản nào khớp với từ khóa "${this._adminFraudSearchQuery}".
                  </div>
                ` : searchResults.map(u => {
        const isBanned = u.status === 'BANNED';
        const isSuspended = u.status === 'SUSPENDED';
        const trust = parseFloat(u.trust_score || 100);

        let trustBadge = '';
        if (trust >= 80) {
          trustBadge = `<span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold rounded text-[11px]">Uy Tín Cao (${trust}đ)</span>`;
        } else if (trust >= 60) {
          trustBadge = `<span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold rounded text-[11px]">Cần Lưu Ý (${trust}đ)</span>`;
        } else {
          trustBadge = `<span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold rounded text-[11px]">Rủi Ro Cao (${trust}đ)</span>`;
        }

        let statusBadge = '';
        if (isBanned) {
          statusBadge = '<span class="px-2 py-0.5 bg-orange-600 text-white font-bold rounded text-[11px]">BANNED (BỊ KHÓA)</span>';
        } else if (isSuspended) {
          statusBadge = '<span class="px-2 py-0.5 bg-orange-500 text-white font-bold rounded text-[11px]">SUSPENDED</span>';
        } else {
          statusBadge = '<span class="px-2 py-0.5 bg-orange-600 text-white font-bold rounded text-[11px]">ACTIVE (HOẠT ĐỘNG)</span>';
        }

        const responses = u.responses || [];

        return `
                    <div class="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div class="space-y-1">
                          <div class="flex items-center gap-2">
                            <span class="font-bold text-sm text-slate-900 dark:text-white">${u.name}</span>
                            ${statusBadge}
                            ${trustBadge}
                            <span class="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded text-[10px]">${u.role}</span>
                            ${u.account_tier ? `<span class="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-bold rounded text-[10px]">${u.account_tier}</span>` : ''}
                          </div>
                          <div class="text-xs font-mono text-slate-500 flex flex-wrap gap-x-4">
                            <span>Email: <strong class="text-slate-700 dark:text-slate-300">${u.email}</strong></span>
                            ${u.google_id ? `<span>Google ID: <strong class="text-slate-700 dark:text-slate-300">${u.google_id}</strong></span>` : ''}
                            <span>Số dư điểm: <strong class="text-slate-700 dark:text-slate-300">${(u.point_balance || 0).toLocaleString()} pts</strong></span>
                          </div>
                          ${(isBanned || isSuspended) ? `
                            <div class="text-xs text-orange-600 dark:text-orange-400 font-bold pt-1">
                              Lý do khóa: ${u.ban_reason || 'Vi phạm chính sách an ninh / Điểm uy tín quá thấp'}
                              ${u.banned_at ? ` | Thời điểm: ${new Date(u.banned_at).toLocaleString('vi-VN')}` : ''}
                            </div>
                          ` : ''}
                        </div>

                        <div class="flex items-center gap-2">
                          ${(isBanned || isSuspended || trust < 80) ? `
                            <button 
                              type="button"
                              onclick="VibeApp.unbanAdminUser('${u.id}')"
                              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-orange-600/20 whitespace-nowrap cursor-pointer">
                              <i data-lucide="unlock" class="w-3.5 h-3.5 stroke-[2.2]"></i>
                              <span>Mở Khóa Tài Khoản (Unban)</span>
                            </button>
                          ` : `
                            <span class="text-xs text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1">
                              <i data-lucide="check" class="w-3.5 h-3.5"></i>
                              <span>Tài khoản bình thường</span>
                            </span>
                          `}
                        </div>
                      </div>

                      <!-- Bảng lịch sử khảo sát đã làm -->
                      <div>
                        <div class="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Lịch Sử Các Bài Khảo Sát Đã Làm (${responses.length} bài)</div>
                        ${responses.length === 0 ? `
                          <div class="text-xs text-slate-400 italic py-2">Người dùng này chưa tham gia bài khảo sát nào.</div>
                        ` : `
                          <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs">
                              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                  <th class="p-2.5">Tên Bài Khảo Sát</th>
                                  <th class="p-2.5">Thời Gian / Thời Lượng</th>
                                  <th class="p-2.5">Trạng Thái Phản Hồi</th>
                                  <th class="p-2.5 text-center">Điểm Chất Lượng</th>
                                  <th class="p-2.5 text-right">Điểm Thưởng</th>
                                </tr>
                              </thead>
                              <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                                ${responses.map(r => {
          let statusColor = 'text-slate-600';
          let statusLabel = r.response_status;
          let trustImpact = '';

          switch (r.response_status) {
            case 'VALIDATED':
              statusColor = 'text-orange-600 dark:text-orange-400 font-bold';
              statusLabel = 'HỢP LỆ (VALIDATED)';
              trustImpact = '<span class="text-[10px] text-orange-600 font-mono ml-1">(+2.0 uy tín)</span>';
              break;
            case 'REJECTED_FRAUD':
              statusColor = 'text-orange-600 dark:text-orange-400 font-bold';
              statusLabel = 'TỪ CHỐI GIAN LẬN';
              trustImpact = '<span class="text-[10px] text-orange-600 font-mono ml-1">(-12.0 uy tín)</span>';
              break;
            case 'FLAGGED_MANUAL':
              statusColor = 'text-orange-600 dark:text-orange-400 font-bold';
              statusLabel = 'NGHI VẤN (FLAGGED)';
              trustImpact = '<span class="text-[10px] text-orange-600 font-mono ml-1">(-5.0 uy tín)</span>';
              break;
            case 'SCREENED_OUT':
              statusColor = 'text-slate-500 font-bold';
              statusLabel = 'BỊ LỌC (SCREENED)';
              trustImpact = '<span class="text-[10px] text-slate-400 font-mono ml-1">(0 uy tín)</span>';
              break;
          }

          return `
                                    <tr>
                                      <td class="p-2.5">
                                        <div class="font-bold text-slate-800 dark:text-slate-200">${r.survey_title}</div>
                                        <div class="text-[10px] text-slate-400 font-mono">ID: ${r.survey_id.slice(0, 10)}... | ${r.survey_category || 'Khảo sát'}</div>
                                      </td>
                                      <td class="p-2.5 font-mono text-slate-500">
                                        <div>${r.submitted_at ? new Date(r.submitted_at).toLocaleString('vi-VN') : new Date(r.started_at).toLocaleString('vi-VN')}</div>
                                        <div class="text-[10px] text-slate-400">Thời lượng: ${r.duration_sec || 0}s</div>
                                      </td>
                                      <td class="p-2.5">
                                        <span class="${statusColor}">${statusLabel}</span>
                                        ${trustImpact}
                                      </td>
                                      <td class="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                        ${(r.quality_score !== null && r.quality_score !== undefined) ? r.quality_score : 'N/A'}
                                      </td>
                                      <td class="p-2.5 text-right font-mono font-bold text-orange-600 dark:text-orange-400">
                                        +${(r.points_rewarded || 0).toLocaleString()} pts
                                      </td>
                                    </tr>
                                  `;
        }).join('')}
                              </tbody>
                            </table>
                          </div>
                        `}
                      </div>
                    </div>
                  `;
      }).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Khối 3: Danh sách IP bị Khóa tự động -->
          <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                <i data-lucide="ban" class="w-4 h-4 text-orange-600"></i>
                <span>Danh Sách IP Bị Khóa Tự Động (Auto-Banned IPs)</span>
              </h2>
              <span class="text-[11px] text-stone-400 font-mono">Tự động ban khi có &gt;= 5 tài khoản/thiết bị</span>
            </div>

            ${bannedIps.length === 0 ? `
              <div class="p-6 text-center text-xs text-stone-400 dark:text-stone-500 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                Hiện tại không có địa chỉ IP nào bị khóa.
              </div>
            ` : `
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-stone-50 dark:bg-stone-900/60 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100 dark:border-stone-800">
                    <tr>
                      <th class="p-3">Địa Chỉ IP</th>
                      <th class="p-3">Lý Do Khóa</th>
                      <th class="p-3">Thời Điểm</th>
                      <th class="p-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
                    ${bannedIps.map(b => `
                      <tr>
                        <td class="p-3 font-mono font-bold text-orange-600 dark:text-orange-400">${b.ip_address}</td>
                        <td class="p-3 text-stone-700 dark:text-stone-300 font-medium">${b.reason}</td>
                        <td class="p-3 font-mono text-stone-400">${new Date(b.banned_at).toLocaleString('vi-VN')}</td>
                        <td class="p-3 text-right whitespace-nowrap">
                          <button 
                            type="button"
                            onclick="VibeApp.unbanIpAddress('${b.ip_address}')" 
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-orange-600 hover:text-white text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap">
                            <i data-lucide="unlock" class="w-3.5 h-3.5 stroke-[2]"></i>
                            <span>Gỡ Cấm IP</span>
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- Khối 4: Lịch sử Nhật Ký Gian Lận & Cảnh Báo Khả Nghi -->
          <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 class="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                  <i data-lucide="activity" class="w-4 h-4 text-orange-600"></i>
                  <span>Nhật Ký Cảnh Báo Khả Nghi & Gian Lận Gần Nhất</span>
                </h2>
                <div class="text-[11px] text-stone-400 font-mono mt-0.5">
                  Tổng cộng ${totalFraudLogs} sự kiện được ghi nhận trên toàn hệ thống
                </div>
              </div>

              <!-- Thanh công cụ phân trang chuẩn: Dropdown Dòng/trang + Chuyển trang -->
              <div class="flex items-center flex-wrap gap-2">
                <!-- Dropdown tiêu chuẩn: Số dòng / trang -->
                <div class="relative">
                  <button 
                    type="button" 
                    onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('admin-fraud-limit-menu', event)" 
                    class="custom-dropdown-trigger flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 transition-all shadow-xs">
                    <span class="text-stone-400 dark:text-stone-500 font-normal">Hiển thị:</span>
                    <span class="font-bold text-stone-900 dark:text-white">${fraudLimit} dòng</span>
                    <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3.5 h-3.5 stroke-[2] transition-transform duration-200 pointer-events-none text-stone-400"></i>
                  </button>
                  <div id="admin-fraud-limit-menu" class="custom-dropdown-menu hidden absolute right-0 z-50 mt-1.5 min-w-[150px] p-1.5 rounded-xl bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                    <div onclick="event.stopPropagation(); VibeApp.setAdminFraudLogLimit(5)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${fraudLimit === 5 ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                      <span>5 dòng (Ngắn gọn)</span>
                      ${fraudLimit === 5 ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                    </div>
                    <div onclick="event.stopPropagation(); VibeApp.setAdminFraudLogLimit(10)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${fraudLimit === 10 ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                      <span>10 dòng (Tiêu chuẩn)</span>
                      ${fraudLimit === 10 ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                    </div>
                    <div onclick="event.stopPropagation(); VibeApp.setAdminFraudLogLimit(20)" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${fraudLimit === 20 ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                      <span>20 dòng (Đầy đủ)</span>
                      ${fraudLimit === 20 ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                    </div>
                  </div>
                </div>

                <!-- Dropdown chọn trang trực tiếp (nếu có > 1 trang) -->
                ${totalFraudPages > 1 ? `
                  <div class="relative">
                    <button 
                      type="button" 
                      onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('admin-fraud-page-menu', event)" 
                      class="custom-dropdown-trigger flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 transition-all shadow-xs">
                      <span class="text-stone-400 dark:text-stone-500 font-normal">Trang:</span>
                      <span class="font-bold text-stone-900 dark:text-white">${this.state.fraudLogPage} / ${totalFraudPages}</span>
                      <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3.5 h-3.5 stroke-[2] transition-transform duration-200 pointer-events-none text-stone-400"></i>
                    </button>
                    <div id="admin-fraud-page-menu" class="custom-dropdown-menu hidden absolute right-0 z-50 mt-1.5 min-w-[130px] max-h-56 overflow-y-auto p-1.5 rounded-xl bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                      ${Array.from({ length: totalFraudPages }, (_, i) => i + 1).map(p => `
                        <div onclick="event.stopPropagation(); VibeApp.setAdminFraudLogPage(${p}, true)" class="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${p === this.state.fraudLogPage ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                          <span>Trang ${p}</span>
                          ${p === this.state.fraudLogPage ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Các nút điều hướng Trước / Sau -->
                <div class="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onclick="VibeApp.setAdminFraudLogPage(-1)" 
                    ${this.state.fraudLogPage <= 1 ? 'disabled class="px-3 py-1.5 bg-stone-100 dark:bg-stone-800/60 text-stone-400 rounded-xl cursor-not-allowed text-xs font-bold"' : 'class="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-orange-600 hover:text-white text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"'}>
                    &lt; Trước
                  </button>
                  <button 
                    type="button"
                    onclick="VibeApp.setAdminFraudLogPage(1)" 
                    ${this.state.fraudLogPage >= totalFraudPages ? 'disabled class="px-3 py-1.5 bg-stone-100 dark:bg-stone-800/60 text-stone-400 rounded-xl cursor-not-allowed text-xs font-bold"' : 'class="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-orange-600 hover:text-white text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"'}>
                    Sau &gt;
                  </button>
                </div>
              </div>
            </div>

            <!-- Bảng danh sách nhật ký -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-stone-50 dark:bg-stone-900/60 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100 dark:border-stone-800">
                  <tr>
                    <th class="p-3">Thời Gian</th>
                    <th class="p-3">Tài Khoản</th>
                    <th class="p-3">Sự Kiện & Phân Loại</th>
                    <th class="p-3">IP / Thiết Bị</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
                  ${pagedLogs.length === 0 ? `
                    <tr><td colspan="4" class="p-8 text-center text-stone-400">Không có nhật ký cảnh báo gian lận nào được ghi nhận.</td></tr>
                  ` : pagedLogs.map(l => {
        const isMultiAccAlert = l.reason === 'CANH_BAO_KHA_NGHI_MULTI_ACCOUNT';
        const isAutoBan = l.reason === 'AUTO_BAN_IP_MULTI_ACCOUNT_BREACH' || l.reason === 'AUTO_BAN_DEVICE_MULTI_ACCOUNT_BREACH';
        return `
                      <tr class="${isAutoBan ? 'bg-orange-50/50 dark:bg-orange-950/20' : (isMultiAccAlert ? 'bg-orange-50/40 dark:bg-orange-950/20' : '')}">
                        <td class="p-3 font-mono text-stone-400">${new Date(l.created_at).toLocaleString('vi-VN')}</td>
                        <td class="p-3 font-bold text-stone-800 dark:text-stone-200">${l.user_name || 'Khách/Ẩn danh'}</td>
                        <td class="p-3">
                          ${isAutoBan ? `
                            <span class="px-2 py-0.5 bg-orange-600 text-white font-bold rounded text-[10px]">AUTO-BAN</span>
                            <span class="text-orange-700 dark:text-orange-400 font-bold ml-1">${l.reason}</span>
                          ` : (isMultiAccAlert ? `
                            <span class="px-2 py-0.5 bg-orange-600 text-white font-bold rounded text-[10px]">CẢNH BÁO</span>
                            <span class="text-orange-600 dark:text-orange-400 font-bold ml-1">Phát hiện &gt;= 3 tài khoản trên 1 thiết bị</span>
                          ` : `
                            <span class="text-stone-700 dark:text-stone-300 font-medium">${l.reason}</span>
                          `)}
                        </td>
                        <td class="p-3 font-mono text-stone-400">${l.ip_address || '127.0.0.1'}</td>
                      </tr>
                    `;
      }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Footer phân trang tinh gọn -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
              <span class="text-stone-400 dark:text-stone-500 font-medium">
                Hiển thị dòng <strong>${totalFraudLogs === 0 ? 0 : startFraudIdx + 1} - ${Math.min(startFraudIdx + fraudLimit, totalFraudLogs)}</strong> trên tổng số <strong>${totalFraudLogs}</strong> sự kiện
              </span>
              <div class="text-stone-400 font-mono text-[11px]">
                Trang <strong>${this.state.fraudLogPage}</strong> / <strong>${totalFraudPages}</strong> (${fraudLimit} dòng/trang)
              </div>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Lỗi renderAdminFraudView:', err);
      this.showToast('Lỗi khi tải trang quản trị gian lận', 'error');
    }
  },

  setAdminFraudLogLimit(limit) {
    this.haptic('light');
    this.state.fraudLogLimit = Number(limit) || 5;
    this.state.fraudLogPage = 1;
    const root = document.getElementById('app-root');
    if (root) this.renderAdminFraudView(root);
  },

  setAdminFraudLogPage(pageOrDelta, isAbsolute = false) {
    this.haptic('light');
    const totalLogs = this._lastFraudLogsCount || 0;
    const limit = Number(this.state.fraudLogLimit) || 5;
    const totalPages = Math.max(1, Math.ceil(totalLogs / limit));
    let targetPage = this.state.fraudLogPage || 1;
    if (isAbsolute) {
      targetPage = Number(pageOrDelta) || 1;
    } else {
      targetPage += Number(pageOrDelta) || 0;
    }
    targetPage = Math.min(totalPages, Math.max(1, targetPage));
    if (targetPage === this.state.fraudLogPage && !isAbsolute) return;
    this.state.fraudLogPage = targetPage;
    const root = document.getElementById('app-root');
    if (root) this.renderAdminFraudView(root);
  },

  async searchAdminFraudUser() {
    const input = document.getElementById('adminUserSearchInput');
    const query = input ? input.value.trim() : '';
    if (!query) {
      this.showToast('Vui lòng nhập Email hoặc Google ID để tra cứu', 'warning');
      return;
    }

    this._adminFraudSearchQuery = query;
    try {
      const res = await this.api(`/admin/users/search?q=${encodeURIComponent(query)}`);
      this._adminSearchedUsers = res.users || [];
      const root = document.getElementById('app-root');
      if (root) await this.renderAdminFraudView(root);
    } catch (err) {
      this.showToast(err.message || 'Lỗi khi tra cứu tài khoản', 'error');
    }
  },

  clearAdminFraudSearch() {
    this._adminSearchedUsers = null;
    this._adminFraudSearchQuery = '';
    const root = document.getElementById('app-root');
    if (root) this.renderAdminFraudView(root);
  },

  async unbanAdminUser(userId) {
    if (!userId) return;
    try {
      const res = await this.api(`/admin/users/${userId}/unban`, {
        method: 'POST'
      });
      this.showToast(res.message || 'Đã mở khóa tài khoản thành công!', 'success');
      // Tải lại kết quả tìm kiếm nếu đang tra cứu
      if (this._adminFraudSearchQuery) {
        const searchRes = await this.api(`/admin/users/search?q=${encodeURIComponent(this._adminFraudSearchQuery)}`);
        this._adminSearchedUsers = searchRes.users || [];
      }
      const root = document.getElementById('app-root');
      if (root) await this.renderAdminFraudView(root);
    } catch (err) {
      this.showToast(err.message || 'Lỗi khi mở khóa tài khoản', 'error');
    }
  },

  async unbanIpAddress(ip) {
    this.haptic('medium');
    try {
      const res = await this.api('/admin/unban-ip', {
        method: 'POST',
        body: JSON.stringify({ ip_address: ip })
      });
      this.showToast(res.message || 'Đã gỡ cấm IP thành công', 'success');
      this.navigate('admin-fraud');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ==================== ADMIN FAST COMMAND CONSOLE ====================
  _adminConsoleHistory: [],
  _adminConsoleHistoryIdx: -1,
  _adminTerminalLogs: [
    { type: 'info', text: 'SurvHub Enterprise Control Engine v3.0 [Ready • Expanded Console]' },
    { type: 'info', text: 'Gõ <strong class="text-orange-500">/help</strong> để xem toàn bộ cú pháp hoặc nhập trực tiếp ví dụ: <span class="text-orange-400 font-bold">/naptien acc1 100000</span> hoặc <span class="text-orange-400 font-bold">/settier me STUDENT</span>.' }
  ],
  isStudentUser(user = this.state.currentUser) {
    if (!user) return false;
    // 1. Phân khúc Người Điền Thường / Cá Nhân (PERSONAL) hoặc Doanh Nghiệp (ENTERPRISE)
    // -> BẮT BUỘC là Người thường / Doanh nghiệp, TUYỆT ĐỐI KHÔNG PHẢI SINH VIÊN
    if (user.account_tier === 'PERSONAL' || user.account_tier === 'ENTERPRISE') {
      return false;
    }
    // 2. Chỉ là sinh viên khi phân khúc thực tế là STUDENT hoặc role STUDENT
    if (user.account_tier === 'STUDENT' || user.role === 'STUDENT') {
      return true;
    }
    // 3. Đã xác thực sinh viên kèm email trường hợp lệ
    if ((user.is_student_verified === 1 || user.is_student_verified === '1' || user.is_student_verified === true) && 
        ((user.student_email && (user.student_email.includes('.edu.vn') || user.student_email.includes('.ac.vn'))) || 
         (user.email && (user.email.includes('.edu.vn') || user.email.includes('.ac.vn'))))) {
      return true;
    }
    return false;
  },

  renderAdminConsoleLogs(targetOutput) {
    try {
      const outputs = targetOutput
        ? [targetOutput]
        : document.querySelectorAll('.admin-console-output, #adminConsoleOutput, #modalAdminConsoleOutput');

      outputs.forEach(output => {
        if (!output) return;
        output.innerHTML = '';
        if (!this._adminTerminalLogs || this._adminTerminalLogs.length === 0) {
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'text-stone-500 italic';
          emptyDiv.textContent = 'Console trống. Gõ /help để bắt đầu.';
          output.appendChild(emptyDiv);
          return;
        }
        this._adminTerminalLogs.forEach(item => {
          const line = document.createElement('div');
          if (item.type === 'cmd') {
            line.className = 'pt-2.5 flex items-start gap-2 text-stone-200 font-bold border-t border-stone-800/60 first:border-0';

            const prefix = document.createElement('span');
            prefix.className = 'text-orange-500 select-none font-mono font-black';
            prefix.textContent = '>';

            const cmdText = document.createElement('span');
            cmdText.className = 'font-mono text-white text-sm break-all flex-1';
            cmdText.textContent = item.text || '';

            const timeSpan = document.createElement('span');
            timeSpan.className = 'text-[10px] text-stone-500 font-mono ml-auto select-none whitespace-nowrap pl-2';
            timeSpan.textContent = item.time || '';

            line.appendChild(prefix);
            line.appendChild(cmdText);
            line.appendChild(timeSpan);
          } else if (item.type === 'loading') {
            line.className = 'pl-4 py-1.5 text-orange-400 font-mono text-xs flex items-center gap-2 animate-pulse';

            const dot = document.createElement('span');
            dot.className = 'inline-block w-2 h-2 rounded-full bg-orange-500 animate-ping';

            const loadText = document.createElement('span');
            loadText.textContent = item.text || 'Đang xử lý...';

            line.appendChild(dot);
            line.appendChild(loadText);
          } else if (item.type === 'error') {
            line.className = 'pl-4 pb-2 text-orange-400 whitespace-pre-wrap font-mono text-xs sm:text-[13px] font-medium leading-relaxed';
            line.textContent = item.text || '';
          } else if (item.type === 'help') {
            line.className = 'pl-4 pb-2 text-stone-300 whitespace-pre-wrap font-mono text-xs sm:text-[13px] leading-relaxed';
            line.textContent = item.text || '';
          } else if (item.type === 'info') {
            line.className = 'text-stone-400 font-mono text-xs';
            line.innerHTML = item.text || '';
          } else {
            // success
            line.className = 'pl-4 pb-2 whitespace-pre-wrap font-mono text-xs sm:text-[13px] leading-relaxed text-orange-400 font-medium';
            line.textContent = item.text || '';
          }
          output.appendChild(line);
        });
        output.scrollTop = output.scrollHeight;
      });
    } catch (renderErr) {
      console.error('Lỗi trong renderAdminConsoleLogs:', renderErr);
    }
  },

  async quickAdminLogin() {
    this.haptic('medium');
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@survhub.vn', password: 'admin123' })
      });
      const data = await res.json();
      if (data.token) {
        this.state.token = data.token;
        this.state.currentUser = data.user;
        localStorage.setItem('survhub_token', data.token);
        localStorage.setItem('survhub_cached_user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Lỗi auto login admin:', err);
      return false;
    }
  },

  fillAdminConsoleCommand(cmd, targetInputId) {
    this.haptic('light');
    let input = targetInputId ? document.getElementById(targetInputId) : null;
    if (!input) {
      const modalContainer = document.getElementById('modal-container');
      const isModalOpen = modalContainer && !modalContainer.classList.contains('hidden');
      input = isModalOpen
        ? (document.getElementById('modalAdminConsoleInput') || document.getElementById('adminConsoleInput'))
        : (document.getElementById('adminConsoleInput') || document.getElementById('modalAdminConsoleInput'));
    }
    if (input) {
      input.value = cmd;
      input.focus();
      input.setSelectionRange(cmd.length, cmd.length);
    }
  },

  clearAdminConsole(targetOutput) {
    this.haptic('light');
    this._adminTerminalLogs = [
      { type: 'info', text: 'SurvHub Enterprise Control Engine v3.0 [Screen Cleared]' },
      { type: 'info', text: 'Gõ <strong class="text-orange-500">/help</strong> để xem cú pháp hoặc nhập trực tiếp các lệnh quản trị.' }
    ];
    this.renderAdminConsoleLogs(targetOutput);
  },

  handleAdminConsoleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const form = event.target.closest('form');
      this.submitAdminConsoleCommand(null, form || event.target);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this._adminConsoleHistory || this._adminConsoleHistory.length === 0) return;
      if (this._adminConsoleHistoryIdx === -1) {
        this._adminConsoleHistoryIdx = this._adminConsoleHistory.length - 1;
      } else if (this._adminConsoleHistoryIdx > 0) {
        this._adminConsoleHistoryIdx--;
      }
      const cmd = this._adminConsoleHistory[this._adminConsoleHistoryIdx] || '';
      event.target.value = cmd;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this._adminConsoleHistory || this._adminConsoleHistory.length === 0) return;
      if (this._adminConsoleHistoryIdx !== -1) {
        if (this._adminConsoleHistoryIdx < this._adminConsoleHistory.length - 1) {
          this._adminConsoleHistoryIdx++;
          event.target.value = this._adminConsoleHistory[this._adminConsoleHistoryIdx] || '';
        } else {
          this._adminConsoleHistoryIdx = -1;
          event.target.value = '';
        }
      }
    }
  },

  async submitAdminConsoleCommand(customCmd, formOrInput) {
    try {
      let input = null;
      let submitBtn = null;

      if (formOrInput) {
        if (formOrInput.tagName === 'INPUT' || formOrInput.tagName === 'TEXTAREA') {
          input = formOrInput;
          const form = input.closest('form');
          if (form) submitBtn = form.querySelector('button[type="submit"], button#adminConsoleSubmitBtn, button#modalAdminConsoleSubmitBtn');
        } else if (formOrInput.tagName === 'FORM') {
          input = formOrInput.querySelector('input');
          submitBtn = formOrInput.querySelector('button[type="submit"], button#adminConsoleSubmitBtn, button#modalAdminConsoleSubmitBtn');
        }
      }

      if (!input) {
        const modalContainer = document.getElementById('modal-container');
        const isModalOpen = modalContainer && !modalContainer.classList.contains('hidden');
        if (isModalOpen) {
          input = document.getElementById('modalAdminConsoleInput') || document.getElementById('adminConsoleInput');
        } else {
          input = document.getElementById('adminConsoleInput') || document.getElementById('modalAdminConsoleInput');
        }
      }

      // Fallback: nếu vẫn chưa có input, tìm bất kỳ ô console input nào trên trang
      if (!input) {
        input = document.querySelector('#modalAdminConsoleInput, #adminConsoleInput, input[id*="ConsoleInput"]');
      }

      const command = (customCmd !== undefined && customCmd !== null && customCmd !== ''
        ? customCmd
        : (input ? input.value : '')
      ).trim();

      if (!command) {
        this.haptic('error');
        if (input) input.focus();
        return;
      }

      if (!this._adminConsoleHistory) this._adminConsoleHistory = [];
      this._adminConsoleHistory.push(command);
      this._adminConsoleHistoryIdx = -1;

      if (input) input.value = '';

      // Lệnh /clear thực thi ngay tại client
      if (command.toLowerCase() === '/clear') {
        this.clearAdminConsole();
        return;
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Đẩy dòng lệnh vào persistent log
      this._adminTerminalLogs.push({
        type: 'cmd',
        text: command,
        time: timeStr
      });

      // Thêm dòng loading tạm thời
      this._adminTerminalLogs.push({
        type: 'loading',
        text: 'Đang gửi lệnh đến máy chủ và cập nhật sổ cái...',
        loading: true
      });

      this.renderAdminConsoleLogs();
      if (submitBtn) submitBtn.disabled = true;

      // Tự động kiểm tra quyền Admin hoặc auto-auth nếu cần
      if (!this.state.token || this.state.currentUser?.role !== 'ADMIN') {
        await this.quickAdminLogin();
      }

      try {
        this.haptic('light');
        const res = await this.api('/admin/execute-command', {
          method: 'POST',
          body: JSON.stringify({ command })
        });

        // Xóa dòng loading
        this._adminTerminalLogs = this._adminTerminalLogs.filter(item => !item.loading);

        const resType = res.type === 'HELP' ? 'help' : 'success';
        const resText = res.output || res.message || 'Thực thi lệnh thành công';

        this._adminTerminalLogs.push({
          type: resType,
          text: resText,
          time: timeStr
        });

        this.renderAdminConsoleLogs();
        this.showToast(res.output ? (res.output.length > 80 ? 'Lệnh đã thực thi thành công' : res.output) : 'Thực thi lệnh thành công', 'success');

        // Tự động làm mới dữ liệu tổng quan nếu lệnh thay đổi tiền, điểm hoặc dọn dẹp dữ liệu test
        const isCleanCmd = ['/cleantest', '/clean-test-data', '/xoadatatest'].some(k => command.toLowerCase().startsWith(k));
        const isBalanceCmd = ['/naptien', '/congdiem', '/trudiem', '/trutien', '/resetpoint', '/resetcredit', '/ban', '/unban', '/settier'].some(k => command.toLowerCase().startsWith(k));

        if (isCleanCmd || isBalanceCmd) {
          setTimeout(async () => {
            try {
              const meRes = await this.api('/auth/me');
              if (meRes && meRes.user) {
                this.state.currentUser = meRes.user;
                localStorage.setItem('survhub_cached_user', JSON.stringify(meRes.user));
              }
            } catch (authErr) {}

            const root = document.getElementById('app-root');
            if (root) {
              if (this.state.currentTab === 'admin-overview') {
                await this.renderAdminOverviewView(root);
                this.renderAdminConsoleLogs();
              } else if (this.state.currentTab === 'surveys') {
                await this.renderSurveysView(root);
              } else if (this.state.currentTab === 'my-surveys' || this.state.currentTab === 'created-surveys') {
                await this.renderMySurveysView(root);
              } else if (this.state.currentTab === 'wallet' || this.state.currentTab === 'profile') {
                await this.renderProfileView(root);
              } else if (this.state.currentTab === 'forum') {
                await this.renderForumView(root);
              }
            }
          }, 600);
        }
      } catch (err) {
        // Xóa dòng loading
        this._adminTerminalLogs = this._adminTerminalLogs.filter(item => !item.loading);

        let errMsg = 'Lỗi: ' + (err.message || 'Không thể thực thi lệnh');
        if (err.status === 401 || err.status === 403 || (err.message && err.message.includes('Quản trị viên'))) {
          errMsg += '\n[Mẹo: Tài khoản hiện tại có thể chưa có quyền Admin hoặc phiên đã hết hạn. Vui lòng đăng nhập tài khoản Quản trị viên].';
        }

        this._adminTerminalLogs.push({
          type: 'error',
          text: errMsg,
          time: timeStr
        });

        this.renderAdminConsoleLogs();
        this.showToast(err.message || 'Lỗi thực thi lệnh console', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        const activeInput = document.getElementById('modalAdminConsoleInput') || document.getElementById('adminConsoleInput');
        if (activeInput) activeInput.focus();
      }
    } catch (topLevelErr) {
      console.error('Ngoại lệ cấp cao submitAdminConsoleCommand:', topLevelErr);
      this._adminTerminalLogs.push({
        type: 'error',
        text: 'Ngoại lệ client: ' + topLevelErr.message,
        time: new Date().toLocaleTimeString('vi-VN')
      });
      this.renderAdminConsoleLogs();
      this.showToast('Lỗi: ' + topLevelErr.message, 'error');
    }
  },

  openAdminConsoleModal() {
    this.haptic('light');
    const container = document.getElementById('modal-container');
    const card = document.getElementById('modal-card');
    if (!container || !card) return;

    card.className = "bg-[#09090B] text-stone-200 rounded-3xl max-w-6xl w-[98vw] h-[92vh] max-h-[920px] p-5 sm:p-7 shadow-2xl border border-stone-800 transform transition-all relative font-mono text-xs admin-console-box flex flex-col justify-between";
    card.innerHTML = `
      <div class="flex items-center justify-between pb-3.5 border-b border-stone-800/80 mb-3 flex-shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-orange-500/80 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-orange-500/80 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-orange-500/80 inline-block"></span>
          </div>
          <div class="h-4 w-px bg-stone-800 mx-1"></div>
          <div class="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <i data-lucide="terminal" class="w-4 h-4 text-orange-600"></i>
            <span>Admin Fast Command Console [Expanded View]</span>
          </div>
          <span class="px-2 py-0.5 bg-orange-950/80 border border-orange-800/60 text-orange-400 text-[10.5px] font-bold rounded">Fast CLI v3.0</span>
        </div>
        <button type="button" onclick="VibeApp.closeModal()" class="w-8 h-8 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Quick Action Chips (Bấm một chạm chạy ngay hoặc tự động điền) -->
      <div class="flex items-center flex-wrap gap-1.5 pb-3 text-xs flex-shrink-0">
        <span class="text-stone-500 text-[11px] mr-1 select-none">Thực thi nhanh:</span>
        <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/help')" class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors">/help</button>
        <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/stats')" class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors">/stats</button>
        <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/naptien acc1 100000')" class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-orange-400 border border-stone-800 font-bold transition-colors">/naptien acc1 100k</button>
        <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/congdiem acc1 500')" class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-orange-400 border border-stone-800 font-bold transition-colors">/congdiem acc1 500</button>
        <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/settier me STUDENT')" class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-orange-400 border border-stone-800 transition-colors">/settier me STUDENT</button>
        <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/settier me PERSONAL')" class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors">/settier me PERSONAL</button>
        <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/resetpoint all')" class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-orange-400 border border-stone-800 transition-colors">/resetpoint all</button>
        <button type="button" onclick="VibeApp.submitAdminConsoleCommand('/cleantest')" class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-orange-400 border border-stone-800 font-bold transition-colors">/cleantest</button>
        <button type="button" onclick="VibeApp.clearAdminConsole()" class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-800 transition-colors">Clear</button>
      </div>

      <!-- Output Screen Siêu To Rộng Rãi Toàn Cảnh -->
      <div id="modalAdminConsoleOutput" class="admin-console-output flex-1 bg-black/95 border border-stone-800/90 rounded-2xl p-4 sm:p-6 min-h-[380px] max-h-[580px] overflow-y-auto space-y-2 leading-relaxed scrollbar-thin scrollbar-thumb-stone-800 mb-3 font-mono text-xs sm:text-[13px]">
      </div>

      <!-- Input Form -->
      <form onsubmit="event.preventDefault(); VibeApp.submitAdminConsoleCommand(null, this);" class="flex items-center gap-2 pt-1 flex-shrink-0">
        <div class="flex-1 flex items-center gap-2.5 bg-black/90 border border-stone-800 focus-within:border-orange-600 rounded-2xl px-4 py-3 sm:py-3.5 transition-all">
          <span class="text-orange-600 font-mono font-black select-none text-sm">vibe:~$</span>
          <input 
            type="text" 
            id="modalAdminConsoleInput" 
            autocomplete="off" 
            spellcheck="false"
            onkeydown="VibeApp.handleAdminConsoleKeyDown(event)"
            placeholder="Nhập lệnh quản trị (/naptien acc1 100k, /congdiem, /settier, /resetpoint, /ban)..." 
            class="flex-1 bg-transparent border-0 text-white font-mono text-sm placeholder:text-stone-600 focus:outline-none"
          />
        </div>
        <button 
          type="button" 
          onclick="VibeApp.submitAdminConsoleCommand(null, this.closest('form'))"
          id="modalAdminConsoleSubmitBtn"
          class="px-6 sm:px-7 py-3 sm:py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-bold font-sans transition-all flex items-center gap-2 shadow-xs active:scale-95 whitespace-nowrap">
          <i data-lucide="play" class="w-4 h-4 fill-current"></i>
          <span>Thực Thi</span>
        </button>
      </form>
      <div class="flex items-center justify-between text-[11px] text-stone-500 pt-2 px-1 flex-shrink-0">
        <span>Phím tắt: <strong class="text-stone-400">↑ / ↓</strong> Lịch sử lệnh</span>
        <span>Nhấn <strong class="text-stone-400">Enter</strong> hoặc bấm Thực Thi để chạy</span>
      </div>
    `;

    container.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
    this.renderAdminConsoleLogs(document.getElementById('modalAdminConsoleOutput'));
    const input = document.getElementById('modalAdminConsoleInput');
    if (input) setTimeout(() => input.focus(), 100);
  },

  /**
   * Thanh điều hướng phụ phân hệ Quản Trị (Sub-Navigation Segmented Tabs SSOT)
   */
  renderAdminSubNav(activeSubTab) {
    const items = [
      { id: 'admin-overview', label: 'Tổng Quan', icon: 'pie-chart' },
      { id: 'admin-payouts', label: 'Duyệt Tiền', icon: 'check-circle' },
      { id: 'admin-fraud', label: 'Gian Lận', icon: 'shield-alert' },
      { id: 'admin-bug-reports', label: 'Báo Lỗi', icon: 'bug' },
      { id: 'admin-audit-logs', label: 'Kiểm Toán', icon: 'clipboard-list' }
    ];

    return `
      <!-- Segmented Admin Sub-Navigation SSOT -->
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-[#2E2E36] pb-3">
        <div class="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-[#161619] rounded-xl border border-stone-200/80 dark:border-[#2E2E36] overflow-x-auto scrollbar-none">
          ${items.map(it => {
      const isActive = it.id === activeSubTab;
      return `
              <button type="button" onclick="VibeApp.navigate('${it.id}')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${isActive
          ? 'bg-orange-600 text-white shadow-2xs'
          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#222228]'
        }">
                <i data-lucide="${it.icon}" class="w-3.5 h-3.5 stroke-[2.2]"></i>
                <span>${it.label}</span>
              </button>
            `;
    }).join('')}
        </div>
        <div class="hidden sm:flex items-center gap-2 text-xs text-stone-400 font-medium">
          <span class="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span>Phân hệ Quản trị SurvHub</span>
        </div>
      </div>
    `;
  }
  };

  // Mo rong vao Namespace SSOT window.VibeApp
  Object.assign(window.VibeApp, AdminConsoleModule);
  window.AdminConsoleModule = AdminConsoleModule;
})();
