/**
 * SurvHub - Forum Module (WAVE 4 MODULAR)
 * Gom cac doan tu public/app.js: "PHAN HE DIEN DAN THAO LUAN (COMMUNITY BOARD)"
 * (renderForumView, _renderForumLayout, _updateForumFeedInPlace, bo loc/sap xep/hub in-place),
 * hanh dong xoa bai viet dien dan tu Profile (deleteForumPostAction), phan doan WYSIWYG dien dan
 * (formatForumEditor, formatForumContent, _renderForumPostContentWithToggle, toggleForumPostContent)
 * va Gallery/Kho anh dinh kem (handleForumImagesSelected, removeForumAttachedImage,
 * _renderForumAttachedImagesPreview, _renderForumPostImagesHtml) cung toan bo tuong tac
 * like/binh luan/chia se (shareForumPost, toggleForumPostLike, toggleForumComments,
 * loadForumComments, submitForumComment, deleteForumPost, openCreateForumPostModal,
 * submitCreateForumPost).
 * Di chuyen nguyen van khong doi bat ky hanh vi render/nghiep vu nao.
 * Luu y: getForumCategoryMeta la ham cua chinh mien forum, di chuyen cung khoi (uy quyen
 * getCategoryMeta o app.js); cac phu thuoc goi qua this.* (api, state, showToast, showModal,
 * closeModal, haptic, escapeHtml, openAuthModal, isStudentUser, loadSurveys, normalizeCategoryCode,
 * getCategoryMeta, startSurveySession, _formatTimeAgo, compressImageFile, _formatFileSize,
 * renderProfileView) deu late-binding qua window.VibeApp.
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * @namespace window.VibeApp
 * @requires window.VibeApp (core: api, state, showToast, showModal, closeModal, haptic, escapeHtml,
 *           openAuthModal, isStudentUser, loadSurveys, normalizeCategoryCode, getCategoryMeta,
 *           startSurveySession, _formatTimeAgo, compressImageFile, _formatFileSize, renderProfileView,
 *           toggleCustomDropdown, closeAllCustomDropdowns), window.VIBE_SYSTEM_CATEGORIES, lucide (global)
 * @exports deleteForumPostAction, renderForumView, _renderForumLayout, _updateForumFeedInPlace,
 *          setForumHub, handleForumSearchInPlace, getForumCategoryMeta, selectForumPostCategoryTag,
 *          onForumAttachedSurveySelected, setForumCategoryFilter, setForumScopeFilter, setForumSort,
 *          resetForumFilters, renderForumPostCardHtml, openCreateForumPostModal, submitCreateForumPost,
 *          formatForumEditor, formatForumContent, _renderForumPostContentWithToggle, toggleForumPostContent,
 *          handleForumImagesSelected, removeForumAttachedImage, _renderForumAttachedImagesPreview,
 *          _renderForumPostImagesHtml, shareForumPost, deleteForumPost, toggleForumPostLike,
 *          toggleForumComments, loadForumComments, submitForumComment
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const ForumModule = {
  // ==================== XÓA BÀI VIẾT DIỄN ĐÀN THẬT HOẠT ĐỘNG HOÀN TOÀN ====================
  async deleteForumPostAction(postId) {
    if (!postId) return;
    const confirmDelete = confirm('Bạn có chắc chắn muốn xóa bài viết này trên diễn đàn không?');
    if (!confirmDelete) return;

    this.haptic('warning');
    this.showToast('Đang tiến hành xóa bài viết...', 'info');

    try {
      const res = await this.api('/forum/posts/' + postId, {
        method: 'DELETE'
      });

      if (res && res.success) {
        this.haptic('success');
        this.showToast(res.message || 'Đã xóa bài viết thành công!', 'success');
        // Nạp lại bài viết và render lại
        try {
          const postsRes = await this.api('/forum/posts');
          if (postsRes && postsRes.posts) {
            this.state.forumPosts = postsRes.posts;
          }
        } catch (e) {}
        const root = document.getElementById('app-root');
        await this.renderProfileView(root);
      } else {
        this.showToast((res && res.message) || 'Không thể xóa bài viết', 'error');
      }
    } catch (err) {
      this.showToast('Lỗi xóa bài viết: ' + err.message, 'error');
    }
  },

  // ==================== PHÂN HỆ DIỄN ĐÀN THẢO LUẬN (COMMUNITY BOARD) ====================
  async renderForumView(root) {
    if (!root) return;
    const user = this.state.currentUser;

    // Chỉ hiển thị skeleton loader lần đầu khi chưa có dữ liệu trong state
    if (!this.state.forumPosts || this.state.forumPosts.length === 0) {
      root.innerHTML = `
        <div class="py-16 flex flex-col items-center justify-center text-stone-400 space-y-2">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-stone-200 border-t-orange-600"></div>
          <p class="text-xs text-stone-500 font-medium">Đang nạp dữ liệu diễn đàn...</p>
        </div>
      `;
    }

    try {
      const [postsRes, lbRes] = await Promise.all([
        this.api('/forum/posts'),
        this.api('/forum/leaderboard').catch(() => ({ contributors: [], hotTopics: [] }))
      ]);
      this.state.forumPosts = (postsRes && postsRes.posts) || [];
      this.state.forumLeaderboard = (lbRes && lbRes.contributors) || [];
      this.state.forumHotTopics = (lbRes && lbRes.hotTopics) || [];
    } catch (err) {
      console.warn('Lỗi nạp bài viết diễn đàn:', err.message);
      if (!this.state.forumPosts) this.state.forumPosts = [];
    }

    // Nạp khảo sát nếu chưa có
    if (!this.state.surveys || this.state.surveys.length === 0) {
      try {
        await this.loadSurveys();
      } catch (e) {
        console.warn('Lỗi nạp khảo sát:', e.message);
      }
    }

    // Thiết lập trạng thái bộ lọc mặc định nếu chưa có
    if (!this.state.forumFilter) {
      this.state.forumFilter = {
        category: 'ALL',
        scope: 'ALL',
        status: 'ALL',
        sort: 'NEWEST',
        search: '',
        hub: 'ALL'
      };
    }

    this._renderForumLayout(root);
  },

  _renderForumLayout(root) {
    const user = this.state.currentUser;
    const isStudent = this.isStudentUser(user);
    const posts = this.state.forumPosts || [];
    const surveys = this.state.surveys || [];
    const filter = this.state.forumFilter || { category: 'ALL', scope: 'ALL', status: 'ALL', sort: 'NEWEST', search: '' };
    const leaderboard = this.state.forumLeaderboard || [];
    const hotTopics = this.state.forumHotTopics || [];

    // Các danh mục lĩnh vực nghiên cứu đa dạng
    const categories = [
      { id: 'ALL', label: 'Tất cả lĩnh vực' },
      ...(window.VIBE_SYSTEM_CATEGORIES || [])
    ];

    root.innerHTML = `
      <div class="space-y-6 max-w-6xl mx-auto pb-16 px-2 sm:px-4">
        
        <!-- 1. HEADER DIỄN ĐÀN: TINH GỌN CHUẨN DESIGN.MD -->
        <div class="bg-white dark:bg-[#18181B] rounded-3xl p-6 sm:p-7 border border-stone-200/80 dark:border-stone-800 shadow-xs relative overflow-hidden space-y-4">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div class="flex items-start sm:items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <i data-lucide="messages-square" class="w-6 h-6 stroke-[2.2]"></i>
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h1 class="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white">Diễn Đàn</h1>
                  <span id="forum-current-hub-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${filter.hub === 'STUDENT' ? 'bg-orange-600 text-white shadow-xs' : 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60'} uppercase">${filter.hub === 'STUDENT' ? 'Diễn Đàn Sinh Viên' : 'Góc Thảo Luận & Đề Tài'}</span>
                </div>
                <p id="forum-hub-description" class="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">${filter.hub === 'STUDENT' ? 'Không gian thảo luận học thuật, chia sẻ khảo sát nghiên cứu và hỗ trợ hoàn thành khóa luận tốt nghiệp.' : 'Không gian chia sẻ bối cảnh đề tài, trao đổi đáp viên tương hỗ và phản biện học thuật đa trường viện.'}</p>
              </div>
            </div>

            <div class="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
              ${isStudent ? `
                <!-- HUB SWITCH DÀNH RIÊNG CHO SINH VIÊN (GỌN GÀNG TRÊN HEADER) -->
                <div class="inline-flex items-center bg-stone-100 dark:bg-stone-900 p-1 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs shadow-2xs">
                  <button id="forum-hub-tab-community" onclick="VibeApp.setForumHub('COMMUNITY')" 
                          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter.hub !== 'STUDENT' ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-bold shadow-2xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium'}">
                    <i data-lucide="globe" class="w-3.5 h-3.5 ${filter.hub !== 'STUDENT' ? 'text-orange-600' : ''}"></i>
                    <span>Cộng Đồng</span>
                  </button>
                  <button id="forum-hub-tab-student" onclick="VibeApp.setForumHub('STUDENT')" 
                          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter.hub === 'STUDENT' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-bold shadow-2xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium'}">
                    <i data-lucide="graduation-cap" class="w-3.5 h-3.5 text-orange-600"></i>
                    <span>Góc Sinh Viên</span>
                    <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-extrabold border border-orange-200/60 dark:border-orange-800/60">Edu</span>
                  </button>
                </div>
              ` : ''}

              <button onclick="VibeApp.openCreateForumPostModal()" class="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-2 cursor-pointer">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>Đăng Bài Mới</span>
              </button>
            </div>
          </div>

          <!-- THỐNG KÊ NHANH THỰC TẾ -->
          <div class="pt-3 flex flex-wrap items-center gap-6 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-orange-500"></span>
              <span><strong id="forum-metric-posts" class="text-stone-800 dark:text-stone-200 font-bold">${posts.length}</strong> bài thảo luận</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i data-lucide="compass" class="w-4 h-4 text-orange-600"></i>
              <span><strong class="text-stone-800 dark:text-stone-200 font-bold">${surveys.length}</strong> đề tài khảo sát</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i data-lucide="shield-check" class="w-4 h-4 text-orange-600"></i>
              <span>Liêm chính học thuật & Chuẩn IRB</span>
            </div>
          </div>
        </div>

        <!-- 2. THANH BỘ LỌC TINH GỌN CHUẨN DESIGN.MD -->
        <div class="bg-white dark:bg-[#18181B] rounded-2xl p-2 sm:p-2.5 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          
          <!-- Khối Trái: Ô Tìm Kiếm + Phân Loại Phạm Vi -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
            <!-- Search Bar -->
            <div class="relative w-full sm:w-60 md:w-64 shrink-0">
              <i data-lucide="search" class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              <input type="text" 
                     id="forum-search-input"
                     value="${this.escapeHtml(filter.search || '')}"
                     oninput="VibeApp.handleForumSearchInPlace(this.value)"
                     placeholder="Tìm kiếm bài viết, đề tài..." 
                     class="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all">
              ${filter.search ? `
                <button onclick="document.getElementById('forum-search-input').value=''; VibeApp.handleForumSearchInPlace('')" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>

            <!-- Segmented Scope Tabs: Tất cả | Thảo luận | Khảo sát | Của tôi -->
            <div id="forum-scope-buttons-wrapper" class="flex items-center bg-stone-100 dark:bg-stone-900 p-1 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs overflow-x-auto no-scrollbar">
              <button data-scope="ALL" onclick="VibeApp.setForumScopeFilter('ALL')" 
                      class="px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter.scope === 'ALL' ? 'bg-white dark:bg-stone-800 text-orange-600 font-bold shadow-2xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium'}">
                Tất cả
              </button>
              <button data-scope="DISCUSSION_ONLY" onclick="VibeApp.setForumScopeFilter('DISCUSSION_ONLY')" 
                      class="px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter.scope === 'DISCUSSION_ONLY' ? 'bg-white dark:bg-stone-800 text-orange-600 font-bold shadow-2xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium'}">
                Thảo luận
              </button>
              <button data-scope="WITH_SURVEY" onclick="VibeApp.setForumScopeFilter('WITH_SURVEY')" 
                      class="px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter.scope === 'WITH_SURVEY' ? 'bg-white dark:bg-stone-800 text-orange-600 font-bold shadow-2xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium'}">
                Khảo sát
              </button>
              ${user ? `
                <button data-scope="MY_POSTS" onclick="VibeApp.setForumScopeFilter('MY_POSTS')" 
                        class="px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter.scope === 'MY_POSTS' ? 'bg-white dark:bg-stone-800 text-orange-600 font-bold shadow-2xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium'}">
                  Của tôi
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Khối Phải: Custom Dropdown Lĩnh Vực + Custom Dropdown Sắp Xếp + Nút Reset (Chuẩn Bento Mục 5.3) -->
          <div class="flex items-center gap-2 justify-end text-xs shrink-0 flex-wrap sm:flex-nowrap">
            ${(() => {
              const curCatObj = categories.find(c => c.id === filter.category);
              const curCatLabel = curCatObj ? (curCatObj.id === 'ALL' ? 'Tất cả lĩnh vực' : curCatObj.label) : 'Tất cả lĩnh vực';
              let curSortLabel = 'Mới nhất';
              if (filter.sort === 'MOST_LIKED') curSortLabel = 'Quan tâm nhiều';
              else if (filter.sort === 'MOST_COMMENTS') curSortLabel = 'Sôi nổi nhất';

              return `
                <!-- Dropdown Lĩnh Vực Chuẩn Bento -->
                <div class="relative flex-1 sm:flex-initial">
                  <button type="button" 
                          id="forum-cat-btn"
                          onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('forum-cat-dropdown-menu', 'forum-cat-icon', event)"
                          class="custom-dropdown-trigger w-full sm:w-auto h-9 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:border-orange-500 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs ${filter.category !== 'ALL' ? 'border-orange-500/80 bg-orange-50/50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : ''}">
                    <span id="forum-cat-label" class="truncate">${this.escapeHtml(curCatLabel)}</span>
                    <i data-lucide="chevron-down" id="forum-cat-icon" class="custom-dropdown-icon w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 pointer-events-none"></i>
                  </button>
                  <div id="forum-cat-dropdown-menu" class="custom-dropdown-menu hidden absolute left-0 sm:left-auto sm:right-0 top-[calc(100%+6px)] z-50 w-52 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-xl shadow-2xl p-1.5 space-y-0.5 max-h-[260px] overflow-y-auto scrollbar-thin text-left">
                    ${categories.map(c => {
                      const isCur = filter.category === c.id;
                      const label = c.id === 'ALL' ? 'Tất cả lĩnh vực' : c.label;
                      return `
                        <button type="button" 
                                onclick="VibeApp.setForumCategoryFilter('${c.id}'); VibeApp.closeAllCustomDropdowns();"
                                class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isCur ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                          <span class="truncate">${this.escapeHtml(label)}</span>
                          ${isCur ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600 shrink-0"></i>' : ''}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>

                <!-- Dropdown Sắp Xếp Chuẩn Bento -->
                <div class="relative flex-1 sm:flex-initial">
                  <button type="button" 
                          id="forum-sort-btn"
                          onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('forum-sort-dropdown-menu', 'forum-sort-icon', event)"
                          class="custom-dropdown-trigger w-full sm:w-auto h-9 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:border-orange-500 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs">
                    <span id="forum-sort-label" class="truncate">${this.escapeHtml(curSortLabel)}</span>
                    <i data-lucide="chevron-down" id="forum-sort-icon" class="custom-dropdown-icon w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 pointer-events-none"></i>
                  </button>
                  <div id="forum-sort-dropdown-menu" class="custom-dropdown-menu hidden absolute right-0 top-[calc(100%+6px)] z-50 w-44 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-xl shadow-2xl p-1.5 space-y-0.5 text-left">
                    ${[
                      { id: 'NEWEST', label: 'Mới nhất' },
                      { id: 'MOST_LIKED', label: 'Quan tâm nhiều' },
                      { id: 'MOST_COMMENTS', label: 'Sôi nổi nhất' }
                    ].map(item => {
                      const isCur = filter.sort === item.id;
                      return `
                        <button type="button" 
                                onclick="VibeApp.setForumSort('${item.id}'); VibeApp.closeAllCustomDropdowns();"
                                class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isCur ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                          <span class="truncate">${item.label}</span>
                          ${isCur ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600 shrink-0"></i>' : ''}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            })()}

            <!-- Nút Reset Filter -->
            <button id="forum-reset-filter-btn" 
                    onclick="VibeApp.resetForumFilters()" 
                    title="Đặt lại bộ lọc"
                    class="${(filter.category !== 'ALL' || filter.scope !== 'ALL' || filter.search) ? '' : 'hidden'} h-9 px-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors flex items-center justify-center shrink-0 cursor-pointer">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            </button>
          </div>

        </div>

        <!-- 3. MAIN LAYOUT: FEED THẬT (8 COLS) + SIDEBAR WIDGETS (4 COLS) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- CỘT CHÍNH: DANH SÁCH BÀI VIẾT THỰC TẾ (CẬP NHẬT MƯỢT MÀ KHÔNG RELOAD) -->
          <div class="lg:col-span-8 space-y-4" id="forum-posts-feed-container">
            <!-- Nội dung bài viết sẽ được render in-place qua _updateForumFeedInPlace() -->
          </div>

          <!-- CỘT BÊN PHẢI: BẢNG XẾP HẠNG & WIDGET CHUẨN DESIGN.MD (4 COLS) -->
          <aside class="lg:col-span-4 space-y-5">

            <!-- WIDGET 1: TOP HỖ TRỢ ĐIỀN FORM (BẢNG XẾP HẠNG ĐÓNG GÓP THỰC TẾ) -->
            <div class="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-stone-900 dark:text-white">
                  <div class="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <i data-lucide="award" class="w-4 h-4 stroke-[2.2]"></i>
                  </div>
                  <h3 class="text-xs font-bold uppercase tracking-wider">Top Hỗ Trợ Điền Form</h3>
                </div>
                <span class="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono">Bảng Đóng Góp</span>
              </div>

              <!-- Danh sách xếp hạng từ dữ liệu thật -->
              <div class="space-y-2.5 border-t border-stone-100 dark:border-stone-800/80 pt-3">
                ${leaderboard && leaderboard.length > 0 ? leaderboard.map((item, index) => {
                  const rank = index + 1;
                  let rankBadgeClass = 'w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ';
                  if (rank === 1) {
                    rankBadgeClass += 'bg-orange-600 text-white shadow-xs';
                  } else if (rank === 2) {
                    rankBadgeClass += 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white font-bold';
                  } else if (rank === 3) {
                    rankBadgeClass += 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold';
                  } else {
                    rankBadgeClass += 'bg-stone-100 dark:bg-stone-800 text-stone-500';
                  }

                  const universityLabel = item.university || (item.is_student_verified ? 'Sinh viên Edu' : 'Thành viên SurvHub');
                  const formsCount = item.completed_forms || 0;

                  return `
                    <div class="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50/70 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800/80 hover:border-orange-300 dark:hover:border-orange-800 transition-all">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="${rankBadgeClass}">${rank}</span>
                        <div class="min-w-0">
                          <h4 class="text-xs font-bold text-stone-900 dark:text-white truncate">${this.escapeHtml(item.name || 'Thành viên')}</h4>
                          <span class="text-[10.5px] text-stone-400 truncate block">${this.escapeHtml(universityLabel)}</span>
                        </div>
                      </div>
                      <div class="text-right shrink-0 font-mono">
                        <span class="text-xs font-bold text-orange-600 dark:text-orange-400">${formsCount}</span>
                        <span class="text-[10px] text-stone-400 block leading-tight">form</span>
                      </div>
                    </div>
                  `;
                }).join('') : `
                  <div class="text-center py-4 text-xs text-stone-400">Đang cập nhật xếp hạng đóng góp tuần...</div>
                `}
              </div>
            </div>

            <!-- WIDGET 2: ĐỀ TÀI HOT TUẦN NÀY (THỰC TẾ TỪ HỆ THỐNG) -->
            <div class="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-stone-900 dark:text-white">
                  <div class="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <i data-lucide="trending-up" class="w-4 h-4 stroke-[2.2]"></i>
                  </div>
                  <h3 class="text-xs font-bold uppercase tracking-wider">Đề Tài Hot Tuần Này</h3>
                </div>
                <span class="text-[10px] font-bold text-orange-600 uppercase">Sôi Nổi</span>
              </div>

              <div class="space-y-2 border-t border-stone-100 dark:border-stone-800/80 pt-3">
                ${hotTopics && hotTopics.length > 0 ? hotTopics.map(t => `
                  <div onclick="document.getElementById('forum-search-input').value='${this.escapeHtml(t.title)}'; VibeApp.handleForumSearchInPlace('${this.escapeHtml(t.title)}')" class="p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors cursor-pointer group space-y-1">
                    <h4 class="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                      ${this.escapeHtml(t.title)}
                    </h4>
                    <div class="flex items-center gap-3 text-[10.5px] text-stone-400 font-mono">
                      <span>${t.views_count || 0} xem</span>
                      <span>•</span>
                      <span>${t.likes_count || 0} thích</span>
                      <span>•</span>
                      <span>${t.comments_count || 0} thảo luận</span>
                    </div>
                  </div>
                `).join('') : `
                  <div class="text-center py-4 text-xs text-stone-400">Chưa có đề tài nổi bật trong tuần.</div>
                `}
              </div>
            </div>

            <!-- WIDGET 3: QUY CHUẨN ĐẠO ĐỨC HỌC THUẬT & LIÊM CHÍNH -->
            <div class="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div class="flex items-center gap-2 text-stone-900 dark:text-white">
                <div class="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0">
                  <i data-lucide="shield-check" class="w-4 h-4 stroke-[2.2]"></i>
                </div>
                <h3 class="text-xs font-bold uppercase tracking-wider">Liêm Chính Nghiên Cứu</h3>
              </div>
              <p class="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Tất cả bài khảo sát chia sẻ trên diễn đàn đều được thẩm định tự động, bảo vệ quyền riêng tư người điền và hỗ trợ đối soát chỉ số Cronbach Alpha.
              </p>
            </div>

          </aside>

        </div>

      </div>
    `;

    this._updateForumFeedInPlace();
    if (window.lucide) window.lucide.createIcons();
  },

  // ==================== CẬP NHẬT FEED BÀI VIẾT TẠI CHỖ (SMOOTH IN-PLACE FILTERING - ZERO JANK) ====================
  _updateForumFeedInPlace() {
    const container = document.getElementById('forum-posts-feed-container');
    if (!container) return;

    const posts = this.state.forumPosts || [];
    const filter = this.state.forumFilter || { category: 'ALL', scope: 'ALL', status: 'ALL', sort: 'NEWEST', search: '' };
    const user = this.state.currentUser;
    const openCommentIds = this.state.openCommentPostIds || [];

    const searchKeyword = (filter.search || '').toLowerCase().trim();

    // 1. Lọc theo từ khóa tìm kiếm
    let filtered = posts.filter(p => {
      if (!searchKeyword) return true;
      const t = (p.title || '').toLowerCase();
      const c = (p.content || '').toLowerCase();
      const a = (p.author && p.author.name || '').toLowerCase();
      const s = (p.survey && p.survey.title || '').toLowerCase();
      return t.includes(searchKeyword) || c.includes(searchKeyword) || a.includes(searchKeyword) || s.includes(searchKeyword);
    });

    // 1.5. Lọc theo Phân Khu (Hub)
    if (filter.hub === 'COMMUNITY') {
      filtered = filtered.filter(p => p.post_type !== 'STUDENT');
    } else if (filter.hub === 'STUDENT') {
      filtered = filtered.filter(p => p.post_type === 'STUDENT');
    }

    // 2. Lọc theo phạm vi (Scope)
    if (filter.scope === 'WITH_SURVEY') {
      filtered = filtered.filter(p => p.survey && p.survey.id);
    } else if (filter.scope === 'DISCUSSION_ONLY') {
      filtered = filtered.filter(p => !p.survey || !p.survey.id);
    } else if (filter.scope === 'EXCHANGE') {
      filtered = filtered.filter(p => p.post_type === 'STUDENT');
    } else if (filter.scope === 'MY_POSTS' && user) {
      filtered = filtered.filter(p => p.author && p.author.id === user.id);
    }

    // 3. Lọc theo lĩnh vực (Category Tag)
    if (filter.category && filter.category !== 'ALL') {
      const selectedCatCode = this.normalizeCategoryCode(filter.category);
      const catMeta = this.getCategoryMeta(selectedCatCode);
      const keywords = catMeta.keywords || [];
      filtered = filtered.filter(p => {
        // 1. Chuẩn hóa category của bài viết
        if (this.normalizeCategoryCode(p.category) === selectedCatCode) return true;
        // 2. Chuẩn hóa category của khảo sát đính kèm
        if (p.survey && this.normalizeCategoryCode(p.survey.category) === selectedCatCode) return true;
        // 3. Khớp từ khóa keywords trong tiêu đề, nội dung, category
        const text = `${p.title || ''} ${p.content || ''} ${p.category || ''} ${p.survey && p.survey.category || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });
    }

    // 4. Sắp xếp (Sort)
    if (filter.sort === 'MOST_LIKED') {
      filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (filter.sort === 'MOST_COMMENTS') {
      filtered.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
    } else {
      // Mới nhất (NEWEST)
      filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    // 5. Cập nhật số bài matching trên header metric
    const metricPosts = document.getElementById('forum-metric-posts');
    if (metricPosts) {
      metricPosts.textContent = `${filtered.length}/${posts.length}`;
    }

    // 6. Hiển thị / Ẩn nút Reset filter
    const resetBtn = document.getElementById('forum-reset-filter-btn');
    if (resetBtn) {
      if (filter.category !== 'ALL' || filter.scope !== 'ALL' || filter.search) {
        resetBtn.classList.remove('hidden');
      } else {
        resetBtn.classList.add('hidden');
      }
    }

    // 7. Render danh sách bài viết mượt mà không giật cục (Smooth Fade-in)
    if (filtered.length > 0) {
      container.innerHTML = filtered.map(post => this.renderForumPostCardHtml(post, openCommentIds.includes(post.id))).join('');
    } else {
      container.innerHTML = `
        <div class="bg-white dark:bg-[#18181B] rounded-3xl p-10 sm:p-12 border border-dashed border-stone-200 dark:border-stone-800 text-center space-y-4 transition-all">
          <div class="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center mx-auto">
            <i data-lucide="message-square-dashed" class="w-6 h-6 stroke-[1.8]"></i>
          </div>
          <div class="space-y-1.5 max-w-md mx-auto">
            <h3 class="text-sm font-bold text-stone-900 dark:text-white">Không có bài thảo luận phù hợp bộ lọc</h3>
            <p class="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              ${searchKeyword ? 'Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm.' : 'Không có bài thảo luận nào trong danh mục hoặc phạm vi đã chọn.'}
            </p>
          </div>
          <div class="pt-2 flex items-center justify-center gap-2">
            <button onclick="VibeApp.resetForumFilters()" class="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer">
              Đặt Lại Bộ Lọc
            </button>
            <button onclick="VibeApp.openCreateForumPostModal()" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer">
              Đăng Bài Mới
            </button>
          </div>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  },

  setForumHub(hubId) {
    this.haptic('light');
    this.state.forumFilter = this.state.forumFilter || { category: 'ALL', scope: 'ALL', status: 'ALL', sort: 'NEWEST', search: '', hub: 'COMMUNITY' };
    this.state.forumFilter.hub = hubId;

    const comBtn = document.getElementById('forum-hub-tab-community');
    const stuBtn = document.getElementById('forum-hub-tab-student');

    if (comBtn && stuBtn) {
      if (hubId === 'STUDENT') {
        stuBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-bold shadow-2xs';
        comBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium';
        const comIcon = comBtn.querySelector('i');
        if (comIcon) comIcon.classList.remove('text-orange-600');
        const stuIcon = stuBtn.querySelector('i');
        if (stuIcon) stuIcon.classList.add('text-orange-600');
      } else {
        comBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-bold shadow-2xs';
        stuBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium';
        const comIcon = comBtn.querySelector('i');
        if (comIcon) comIcon.classList.add('text-orange-600');
        const stuIcon = stuBtn.querySelector('i');
        if (stuIcon) stuIcon.classList.remove('text-orange-600');
      }
    }

    // Cập nhật tiêu đề phân khu trên header
    const hubBadge = document.getElementById('forum-current-hub-badge');
    if (hubBadge) {
      if (hubId === 'STUDENT') {
        hubBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white uppercase shadow-xs';
        hubBadge.textContent = 'Diễn Đàn Sinh Viên';
      } else {
        hubBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60 uppercase';
        hubBadge.textContent = 'Góc Thảo Luận & Đề Tài';
      }
    }

    const hubDesc = document.getElementById('forum-hub-description');
    if (hubDesc) {
      if (hubId === 'STUDENT') {
        hubDesc.textContent = 'Không gian thảo luận học thuật, chia sẻ khảo sát nghiên cứu và hỗ trợ hoàn thành khóa luận tốt nghiệp.';
      } else {
        hubDesc.textContent = 'Không gian chia sẻ bối cảnh đề tài, trao đổi đáp viên tương hỗ và phản biện học thuật đa trường viện.';
      }
    }

    this._updateForumFeedInPlace();
    if (window.lucide) window.lucide.createIcons();
  },

  handleForumSearchInPlace(val) {
    this.state.forumFilter = this.state.forumFilter || { category: 'ALL', scope: 'ALL', status: 'ALL', sort: 'NEWEST', search: '' };
    this.state.forumFilter.search = (val || '').trim();
    if (this._forumSearchTimeout) clearTimeout(this._forumSearchTimeout);
    this._forumSearchTimeout = setTimeout(() => {
      this._updateForumFeedInPlace();
    }, 150);
  },

  getForumCategoryMeta(catId) {
    return this.getCategoryMeta(catId);
  },

  selectForumPostCategoryTag(catId) {
    const input = document.getElementById('forum-post-category-select');
    if (input) input.value = catId;
    const pills = document.querySelectorAll('.forum-tag-pill');
    pills.forEach(pill => {
      const isSel = pill.getAttribute('data-cat-id') === catId;
      if (isSel) {
        pill.className = 'forum-tag-pill px-2.5 py-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer text-xs bg-orange-600 text-white font-bold border-orange-600 shadow-2xs';
        const icon = pill.querySelector('i');
        if (icon) {
          icon.classList.remove('text-stone-400');
          icon.classList.add('text-white');
        }
      } else {
        pill.className = 'forum-tag-pill px-2.5 py-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer text-xs bg-stone-50/70 dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-orange-500 font-medium';
        const icon = pill.querySelector('i');
        if (icon) {
          icon.classList.remove('text-white');
          icon.classList.add('text-stone-400');
        }
      }
    });
    if (window.lucide) window.lucide.createIcons();
  },

  onForumAttachedSurveySelected(surveyId) {
    if (!surveyId) return;
    const allSurveys = this.state.surveys || [];
    const found = allSurveys.find(s => s.id === surveyId);
    if (!found || !found.category) return;
    const matchedTagId = this.normalizeCategoryCode(found.category);
    this.selectForumPostCategoryTag(matchedTagId);
  },

  setForumCategoryFilter(catId) {
    this.haptic('light');
    this.state.forumFilter = this.state.forumFilter || { category: 'ALL', scope: 'ALL', status: 'ALL', sort: 'NEWEST', search: '' };
    this.state.forumFilter.category = catId;
    
    // Cập nhật nhãn và style trên custom dropdown trigger
    const catMeta = this.getForumCategoryMeta(catId);
    const catLabel = document.getElementById('forum-cat-label');
    const catBtn = document.getElementById('forum-cat-btn');
    if (catLabel) {
      catLabel.textContent = catId === 'ALL' ? 'Tất cả lĩnh vực' : catMeta.label;
    }
    if (catBtn) {
      if (catId !== 'ALL') {
        catBtn.classList.add('border-orange-500/80', 'bg-orange-50/50', 'dark:bg-orange-950/40', 'text-orange-600', 'dark:text-orange-400', 'font-bold');
      } else {
        catBtn.classList.remove('border-orange-500/80', 'bg-orange-50/50', 'dark:bg-orange-950/40', 'text-orange-600', 'dark:text-orange-400', 'font-bold');
      }
    }

    const catSelect = document.getElementById('forum-category-select');
    if (catSelect) {
      catSelect.value = catId;
    }
    this._updateForumFeedInPlace();
    if (window.lucide) window.lucide.createIcons();
  },

  setForumScopeFilter(scopeId) {
    this.haptic('light');
    this.state.forumFilter = this.state.forumFilter || { category: 'ALL', scope: 'ALL', status: 'ALL', sort: 'NEWEST', search: '' };
    this.state.forumFilter.scope = scopeId;
    
    // Cập nhật tab Scope tại chỗ
    const scopeContainer = document.getElementById('forum-scope-buttons-wrapper');
    if (scopeContainer) {
      const btns = scopeContainer.querySelectorAll('button[data-scope]');
      btns.forEach(btn => {
        const isAct = btn.getAttribute('data-scope') === scopeId;
        if (isAct) {
          btn.className = 'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap bg-white dark:bg-stone-800 text-orange-600 font-bold shadow-2xs';
        } else {
          btn.className = 'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium';
        }
      });
    }
    this._updateForumFeedInPlace();
  },

  setForumSort(sortVal) {
    this.haptic('light');
    this.state.forumFilter = this.state.forumFilter || { category: 'ALL', scope: 'ALL', status: 'ALL', sort: 'NEWEST', search: '' };
    this.state.forumFilter.sort = sortVal;
    this._updateForumFeedInPlace();
  },

  resetForumFilters() {
    this.haptic('light');
    this.state.forumFilter = { category: 'ALL', scope: 'ALL', status: 'ALL', sort: 'NEWEST', search: '', hub: 'COMMUNITY' };
    const searchInput = document.getElementById('forum-search-input');
    if (searchInput) searchInput.value = '';
    const catLabel = document.getElementById('forum-cat-label');
    if (catLabel) catLabel.textContent = 'Tất cả lĩnh vực';
    const catBtn = document.getElementById('forum-cat-btn');
    if (catBtn) {
      catBtn.classList.remove('border-orange-500/80', 'bg-orange-50/50', 'dark:bg-orange-950/40', 'text-orange-600', 'dark:text-orange-400', 'font-bold');
    }
    const sortLabel = document.getElementById('forum-sort-label');
    if (sortLabel) sortLabel.textContent = 'Mới nhất';
    const catSelect = document.getElementById('forum-category-select');
    if (catSelect) {
      catSelect.value = 'ALL';
      catSelect.classList.remove('border-orange-500/80', 'bg-orange-50/50', 'dark:bg-orange-950/40', 'text-orange-600', 'dark:text-orange-400', 'font-bold');
    }
    const sortSelect = document.getElementById('forum-sort-select');
    if (sortSelect) sortSelect.value = 'NEWEST';
    const scopeContainer = document.getElementById('forum-scope-buttons-wrapper');
    if (scopeContainer) {
      const btns = scopeContainer.querySelectorAll('button[data-scope]');
      btns.forEach(btn => {
        const isAct = btn.getAttribute('data-scope') === 'ALL';
        btn.className = isAct 
          ? 'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap bg-white dark:bg-stone-800 text-orange-600 font-bold shadow-2xs'
          : 'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium';
      });
    }
    const comBtn = document.getElementById('forum-hub-tab-community');
    const stuBtn = document.getElementById('forum-hub-tab-student');
    if (comBtn && stuBtn) {
      comBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-bold shadow-2xs';
      stuBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-stone-600 dark:text-stone-400 hover:text-stone-900 font-medium';
    }
    this._updateForumFeedInPlace();
    if (window.lucide) window.lucide.createIcons();
  },

  renderForumPostCardHtml(post, isOpenComments = false) {
    const user = this.state.currentUser;
    const isOwner = user && user.id === post.author.id;
    const isAdmin = user && user.role === 'ADMIN';
    const canDelete = isOwner || isAdmin;

    // Role badge
    let roleBadge = '';
    if (post.author.role === 'ADMIN') {
      roleBadge = '<span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900">Quản Trị</span>';
    } else if (post.author.is_student_verified) {
      roleBadge = '<span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60">Sinh Viên Edu</span>';
    } else if (post.author.role === 'CREATOR') {
      roleBadge = '<span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">Doanh Nghiệp</span>';
    }

    const firstLetter = (post.author.name || 'U').charAt(0).toUpperCase();
    const timeAgo = this._formatTimeAgo(post.created_at);

    // Survey data
    const s = post.survey || {};
    const collected = s.collected_responses || 0;
    const target = s.target_responses || 100;
    const progress = Math.min(100, Math.round((collected / target) * 100));
    const catMeta = this.getForumCategoryMeta(post.category);

    return `
      <div id="forum-post-${post.id}" class="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4 transition-all">
        
        <!-- HEADER BÀI VIẾT: TÁC GIẢ + ROLE + THỜI GIAN + NÚT XÓA -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl overflow-hidden bg-stone-900 text-white dark:bg-stone-700 flex items-center justify-center font-bold text-xs shrink-0">
              ${post.author && post.author.avatar_url ? `<img src="${post.author.avatar_url}" alt="Avatar" class="w-full h-full object-cover" onerror="this.onerror=null;this.parentElement.textContent='${firstLetter}';">` : firstLetter}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">${this.escapeHtml(post.author.name)}</span>
                ${roleBadge}
                ${post.post_type === 'STUDENT' ? `
                  <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60 flex items-center gap-0.5">
                    <i data-lucide="graduation-cap" class="w-3 h-3"></i>
                    <span>Góc Sinh Viên</span>
                  </span>
                ` : `
                  <span class="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                    Cộng Đồng
                  </span>
                `}
              </div>
              <span class="text-[11px] text-stone-400 font-medium block">${timeAgo}</span>
            </div>
          </div>

          ${canDelete ? `
            <button onclick="VibeApp.deleteForumPost('${post.id}')" class="w-8 h-8 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40 text-stone-400 hover:text-orange-600 transition-colors flex items-center justify-center shrink-0 cursor-pointer" title="Xóa bài viết này">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          ` : ''}
        </div>

        ${post.is_hidden ? `
          <div class="px-3.5 py-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-orange-700 dark:text-orange-400 text-xs flex items-center gap-2">
            <i data-lucide="shield-alert" class="w-4 h-4 shrink-0"></i>
            <span><strong>Tạm ẩn:</strong> Bài viết này đang bị ẩn khỏi cộng đồng do hệ thống Sentinel phát hiện dấu hiệu chia sẻ liên kết ngoài trá hình.</span>
          </div>
        ` : ''}

        <!-- TIÊU ĐỀ & NỘI DUNG CHIA SẺ -->
        <div class="space-y-2">
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" 
                    onclick="event.stopPropagation(); VibeApp.setForumCategoryFilter('${post.category || 'OTHER'}')"
                    title="Nhấn để lọc theo lĩnh vực ${this.escapeHtml(catMeta.label)}"
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-all cursor-pointer shadow-2xs">
              <i data-lucide="${catMeta.icon || 'tag'}" class="w-3 h-3 text-orange-600 dark:text-orange-400"></i>
              <span>${this.escapeHtml(catMeta.label)}</span>
            </button>
          </div>
          <h2 class="text-base sm:text-lg font-bold text-stone-900 dark:text-white leading-snug">
            ${this.escapeHtml(post.title)}
          </h2>
          ${this._renderForumPostContentWithToggle(post)}
          ${post.images && post.images.length > 0 ? this._renderForumPostImagesHtml(post.images, post.title) : ''}
        </div>

        <!-- THẺ KHẢO SÁT ĐÍNH KÈM HOẶC THÔNG TIN THẢO LUẬN TỰ DO -->
        ${post.survey && post.survey.id ? `
          <div class="p-3.5 sm:p-4 rounded-2xl bg-stone-50/90 dark:bg-[#151518] border border-stone-200/80 dark:border-stone-800 space-y-3">
            <div class="flex items-center justify-between gap-2 flex-wrap text-xs">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-[11px]">
                  ${this.escapeHtml(s.category || 'Khảo sát')}
                </span>
              </div>

              <div class="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                +${(s.reward_points_per_response || 0).toLocaleString('vi-VN')} Point
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h3 class="text-xs sm:text-sm font-bold text-stone-900 dark:text-white leading-snug truncate">
                  ${this.escapeHtml(s.title || 'Khảo sát đính kèm')}
                </h3>
                <p class="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                  ${this.escapeHtml(s.description || 'Tham gia làm bài để hỗ trợ tác giả thu thập dữ liệu.')}
                </p>
              </div>

              <button onclick="VibeApp.startSurveySession('${s.id}')" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer">
                <span>Tham Gia Khảo Sát</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- Tiến độ thu mẫu -->
            <div class="space-y-1 pt-1 border-t border-stone-200/60 dark:border-stone-800">
              <div class="flex items-center justify-between text-[10.5px] text-stone-500 font-semibold font-mono">
                <span>Thu thập: ${collected}/${target} mẫu</span>
                <span class="text-orange-600 dark:text-orange-400 font-bold">${progress}%</span>
              </div>
              <div class="w-full bg-stone-200/70 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-orange-600 h-full rounded-full transition-all duration-300" style="width: ${progress}%"></div>
              </div>
            </div>
          </div>
        ` : `
          <div class="p-3 sm:p-3.5 rounded-2xl bg-stone-50/70 dark:bg-[#151518] border border-dashed border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2 text-stone-500 dark:text-stone-400">
              <span class="w-2 h-2 rounded-full bg-orange-500"></span>
              <span class="text-[11px] font-medium">Chủ đề thảo luận cộng đồng mở • Phản hồi trực tiếp bên dưới</span>
            </div>
            <button onclick="VibeApp.toggleForumComments('${post.id}')" class="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-bold text-[11px] flex items-center gap-1 cursor-pointer">
              <span>Bình luận</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `}

        <!-- THANH HÀNH ĐỘNG TƯƠNG TÁC: LIKE + BÌNH LUẬN + LƯỢT XEM -->
        <div class="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div class="flex items-center gap-3">
            <!-- Nút Thả tim (Like) -->
            <button onclick="VibeApp.toggleForumPostLike('${post.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${post.is_liked
              ? 'border-orange-500/50 bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 font-bold'
              : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
            }">
              <i data-lucide="heart" class="w-3.5 h-3.5 ${post.is_liked ? 'fill-orange-600 text-orange-600 stroke-orange-600' : 'text-stone-500'}"></i>
              <span id="forum-post-like-count-${post.id}" class="font-mono">${post.likes_count || 0}</span>
            </button>

            <!-- Nút Bình luận -->
            <button onclick="VibeApp.toggleForumComments('${post.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-all active:scale-95 cursor-pointer">
              <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
              <span id="forum-post-comment-count-${post.id}" class="font-mono">${post.comments_count || 0}</span>
              <span class="hidden sm:inline">bình luận</span>
            </button>

            <!-- Nút Chia sẻ liên kết bài viết -->
            <button onclick="VibeApp.shareForumPost('${post.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-all active:scale-95 cursor-pointer" title="Sao chép liên kết chia sẻ">
              <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Chia sẻ</span>
            </button>
          </div>

          <div class="text-[11px] text-stone-400 flex items-center gap-1">
            <i data-lucide="eye" class="w-3 h-3"></i>
            <span>${post.views_count || 0} lượt xem</span>
          </div>
        </div>

        <!-- KHU VỰC BÌNH LUẬN (COLLAPSIBLE COMMENTS SECTION) -->
        <div id="forum-comments-container-${post.id}" class="${isOpenComments ? '' : 'hidden'} pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
          <div class="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
            <i data-lucide="messages-square" class="w-3.5 h-3.5 text-orange-600"></i>
            <span>Bình Luận & Thảo Luận</span>
          </div>

          <!-- Danh sách bình luận -->
          <div id="forum-comments-list-${post.id}" class="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div class="py-2 text-center text-xs text-stone-400">Đang tải bình luận...</div>
          </div>

          <!-- Khung nhập bình luận mới -->
          <div class="flex items-center gap-2 pt-2">
            <input type="text" 
                   id="forum-comment-input-${post.id}" 
                   placeholder="Viết bình luận, phản hồi đề tài..." 
                   onkeydown="if(event.key === 'Enter') VibeApp.submitForumComment('${post.id}')"
                   class="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-orange-500">
            <button onclick="VibeApp.submitForumComment('${post.id}')" class="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer shrink-0">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Gửi</span>
            </button>
          </div>
        </div>

      </div>
    `;
  },

  async openCreateForumPostModal() {
    this.haptic('light');
    if (!this.state.currentUser) {
      this.showToast('Vui lòng đăng nhập để tạo bài viết trên Diễn Đàn!', 'info');
      this.openAuthModal('login');
      return;
    }

    // Khởi tạo danh sách ảnh đính kèm sạch sẽ
    this.state.forumAttachedImages = [];

    const user = this.state.currentUser;
    const isEduUser = this.isStudentUser(user);

    let activeSurveys = [];
    try {
      const res = await this.api('/surveys?scope=created');
      const allMySurveys = (res && res.surveys) || [];
      activeSurveys = allMySurveys.filter(s => s.status === 'ACTIVE');
    } catch (e) {
      console.warn('Lỗi kiểm tra khảo sát của bạn:', e.message);
    }

    const defaultHub = this.state.forumFilter?.hub === 'STUDENT' && isEduUser ? 'STUDENT' : 'COMMUNITY';

    this.showModal({
      title: 'Đăng Bài Viết Lên Diễn Đàn SurvHub',
      maxWidth: 'max-w-2xl',
      content: `
        <form onsubmit="VibeApp.submitCreateForumPost(event)" class="space-y-4 text-xs">
          
          <!-- Chọn Phân Khu -->
          <div class="space-y-1.5">
            <label class="font-bold text-stone-800 dark:text-stone-200">Phân khu đăng bài (*):</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 cursor-pointer hover:border-orange-500 transition-all">
                <input type="radio" name="forum-hub-choice" value="COMMUNITY" ${defaultHub === 'COMMUNITY' ? 'checked' : ''} class="text-orange-600 focus:ring-orange-500">
                <div class="min-w-0">
                  <div class="font-bold text-stone-900 dark:text-white flex items-center gap-1">
                    <i data-lucide="globe" class="w-3.5 h-3.5 text-stone-600 dark:text-stone-300"></i>
                    <span>Cộng Đồng Chung</span>
                  </div>
                  <div class="text-[10px] text-stone-400">Thảo luận tự do & Mọi đối tượng</div>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 ${isEduUser ? 'cursor-pointer hover:border-orange-500' : 'opacity-50 cursor-not-allowed'} transition-all">
                <input type="radio" name="forum-hub-choice" value="STUDENT" ${defaultHub === 'STUDENT' ? 'checked' : ''} ${!isEduUser ? 'disabled' : ''} class="text-orange-600 focus:ring-orange-500">
                <div class="min-w-0">
                  <div class="font-bold text-stone-900 dark:text-white flex items-center gap-1">
                    <i data-lucide="graduation-cap" class="w-3.5 h-3.5 text-orange-600"></i>
                    <span>Góc Sinh Viên</span>
                  </div>
                  <div class="text-[10px] text-stone-400">${isEduUser ? 'NCKH & Luận văn' : 'Cần email trường .edu'}</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Tiêu đề bài viết -->
          <div class="space-y-1.5">
            <label class="font-bold text-stone-800 dark:text-stone-200">Tiêu đề bài viết (*):</label>
            <input type="text" id="forum-post-title-input" required 
                   placeholder="Ví dụ: Trao đổi về phương pháp nghiên cứu thị trường hoặc tìm đáp viên..." 
                   class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-orange-500">
          </div>

          <!-- Lĩnh vực & Tag đề tài bài viết (*) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="font-bold text-stone-800 dark:text-stone-200">Lĩnh vực & Thẻ đề tài (*):</label>
              <span class="text-[10.5px] text-stone-400">Chọn 1 lĩnh vực để người khác dễ dàng lọc & tìm kiếm</span>
            </div>

            <input type="hidden" id="forum-post-category-select" value="TECH">

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5" id="forum-post-tag-pills">
              ${(window.VIBE_SYSTEM_CATEGORIES || []).map(c => `
                <button type="button" 
                        onclick="VibeApp.selectForumPostCategoryTag('${c.id}')"
                        data-cat-id="${c.id}"
                        class="forum-tag-pill px-2.5 py-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer text-xs ${c.id === 'TECH' ? 'bg-orange-600 text-white font-bold border-orange-600 shadow-2xs' : 'bg-stone-50/70 dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-orange-500 font-medium'}">
                  <i data-lucide="${c.icon}" class="w-3.5 h-3.5 shrink-0 ${c.id === 'TECH' ? 'text-white' : 'text-stone-400'}"></i>
                  <span class="truncate">${this.escapeHtml(c.label)}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Chọn Khảo sát đính kèm (Hoàn toàn Tùy chọn) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="font-bold text-stone-800 dark:text-stone-200">Khảo sát đính kèm:</label>
              <span class="text-[10.5px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">Tùy chọn (Không bắt buộc)</span>
            </div>
            
            <input type="hidden" id="forum-post-survey-select" value="">
            <div class="relative">
              <button type="button" 
                      id="forum-post-survey-btn"
                      onclick="VibeApp.toggleCustomDropdown('forum-post-survey-menu', 'forum-post-survey-icon', event)"
                      class="custom-dropdown-trigger w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold text-stone-900 dark:text-white hover:border-orange-500 flex items-center justify-between text-left transition-all shadow-2xs cursor-pointer">
                <span id="forum-post-survey-label" class="truncate text-stone-600 dark:text-stone-300">-- Thảo luận tự do (Không đính kèm khảo sát) --</span>
                <i data-lucide="chevron-down" id="forum-post-survey-icon" class="custom-dropdown-icon w-3.5 h-3.5 text-stone-400 shrink-0 ml-2 transition-transform duration-200 pointer-events-none"></i>
              </button>
              <div id="forum-post-survey-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-xl shadow-2xl p-1.5 space-y-1 max-h-[220px] overflow-y-auto scrollbar-thin">
                <button type="button" 
                        onclick="document.getElementById('forum-post-survey-select').value = ''; document.getElementById('forum-post-survey-label').textContent = '-- Thảo luận tự do (Không đính kèm khảo sát) --'; VibeApp.closeAllCustomDropdowns();"
                        class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors hover:bg-stone-100 dark:hover:bg-[#24242A] text-left text-stone-800 dark:text-stone-200 font-medium">
                  <span>-- Thảo luận tự do (Không đính kèm khảo sát) --</span>
                  <i data-lucide="check" class="w-3.5 h-3.5 text-orange-600 shrink-0 ml-1.5"></i>
                </button>
                ${activeSurveys.map(s => {
                  const fullTitle = `${s.title} (${s.collected_responses || 0}/${s.target_responses} mẫu)`;
                  const safeFullTitle = (fullTitle).replace(/'/g, "\\'").replace(/"/g, '&quot;');
                  return `
                    <button type="button" 
                            onclick="document.getElementById('forum-post-survey-select').value = '${s.id}'; document.getElementById('forum-post-survey-label').textContent = '${safeFullTitle}'; VibeApp.onForumAttachedSurveySelected('${s.id}'); VibeApp.closeAllCustomDropdowns();"
                            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors hover:bg-stone-100 dark:hover:bg-[#24242A] text-left text-stone-800 dark:text-stone-200">
                      <span class="truncate">${this.escapeHtml(fullTitle)}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
            <p class="text-[10.5px] text-stone-500 dark:text-stone-400">Bạn không cần sở hữu khảo sát vẫn đăng bài trao đổi bình thường. Nếu muốn đính kèm để kêu gọi đáp viên, hãy chọn bài đang ACTIVE của bạn.</p>
          </div>

          <!-- Nội dung chia sẻ & Thanh công cụ Rich Text -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="font-bold text-stone-800 dark:text-stone-200">Nội dung chia sẻ & Thảo luận (*):</label>
              <span class="text-[10px] text-stone-400">Ctrl+B: In đậm • Ctrl+I: In nghiêng</span>
            </div>

            <!-- Thanh công cụ định dạng chữ và căn lề danh sách (Biểu tượng thuần túy, không nhãn chữ) -->
            <div class="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700/80 flex-wrap">
              <button type="button" onmousedown="event.preventDefault(); VibeApp.formatForumEditor('bold')" 
                      class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 hover:text-orange-600 transition-colors cursor-pointer shadow-2xs" 
                      title="In đậm (Ctrl+B)">
                <i data-lucide="bold" class="w-4 h-4 stroke-[2.5]"></i>
              </button>
              <button type="button" onmousedown="event.preventDefault(); VibeApp.formatForumEditor('italic')" 
                      class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 hover:text-orange-600 transition-colors cursor-pointer shadow-2xs" 
                      title="In nghiêng (Ctrl+I)">
                <i data-lucide="italic" class="w-4 h-4 stroke-[2.5]"></i>
              </button>
              <div class="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-0.5"></div>
              <button type="button" onmousedown="event.preventDefault(); VibeApp.formatForumEditor('insertUnorderedList')" 
                      class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 hover:text-orange-600 transition-colors cursor-pointer shadow-2xs" 
                      title="Danh sách dấu chấm">
                <i data-lucide="list" class="w-4 h-4 stroke-[2.2]"></i>
              </button>
              <button type="button" onmousedown="event.preventDefault(); VibeApp.formatForumEditor('cycleOrderedList')" 
                      class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 hover:text-orange-600 transition-colors cursor-pointer shadow-2xs" 
                      title="Đánh số thứ tự (Click 1: số 1,2,3... / Click 2: chữ cái a,b,c... / Click 3: tắt)">
                <i data-lucide="list-ordered" class="w-4 h-4 stroke-[2.2]"></i>
              </button>
              <div class="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-0.5"></div>
              <button type="button" onmousedown="event.preventDefault(); VibeApp.formatForumEditor('indent')" 
                      class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 hover:text-orange-600 transition-colors cursor-pointer shadow-2xs" 
                      title="Căn lề / Thụt dòng">
                <i data-lucide="indent" class="w-4 h-4 stroke-[2.2]"></i>
              </button>
            </div>

            <div id="forum-post-editor" 
                 contenteditable="true" 
                 role="textbox"
                 aria-multiline="true"
                 data-placeholder="Chia sẻ bối cảnh đề tài, câu hỏi thảo luận hoặc nội dung trao đổi... (Định dạng in đậm, in nghiêng hiển thị trực quan ngay lập tức)"
                 class="forum-rich-editor w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-orange-500 font-sans leading-relaxed"></div>
          </div>

          <!-- Đính Kèm Hình Ảnh Minh Họa (Tối đa 10 ảnh, tối đa 10MB/ảnh chuẩn Facebook) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <label class="font-bold text-stone-800 dark:text-stone-200">Hình ảnh minh họa:</label>
                <span id="forum-images-count-badge" class="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold font-mono">0/10 ảnh</span>
              </div>
              <span class="text-[10.5px] text-stone-400">Tối đa 10 ảnh • Chuẩn Facebook (&le;10MB/ảnh)</span>
            </div>

            <div class="space-y-2.5">
              <input type="file" id="forum-post-images-file-input" accept="image/png,image/jpeg,image/webp,image/jpg" multiple class="hidden" onchange="VibeApp.handleForumImagesSelected(this)">
              
              <div id="forum-attached-images-container" class="flex flex-wrap gap-2.5 empty:hidden"></div>

              <button type="button" 
                      id="forum-add-images-btn"
                      onclick="document.getElementById('forum-post-images-file-input').click()" 
                      class="w-full py-2.5 px-3 border border-dashed border-stone-300 dark:border-stone-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-xl bg-stone-50/50 dark:bg-stone-900/50 text-stone-600 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer group">
                <i data-lucide="image-plus" class="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform"></i>
                <span>Đính kèm hình ảnh minh họa (Chọn từ thiết bị)</span>
              </button>
            </div>
          </div>

          <div class="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200/80 dark:border-orange-900/60 text-[11px] text-orange-800 dark:text-orange-300 leading-relaxed space-y-1">
            <div class="font-bold flex items-center gap-1">
              <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
              <span>Quy tắc cộng đồng & Bảo mật</span>
            </div>
            <p>Hệ thống tự động ngăn chặn các liên kết ngoài trái phép. Mọi trao đổi tuân thủ chuẩn mực văn minh và bảo mật dữ liệu học thuật.</p>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button type="button" onclick="VibeApp.closeModal()" class="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800">
              Hủy
            </button>
            <button type="submit" id="forum-post-submit-btn" class="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>Đăng Bài Lên Diễn Đàn</span>
            </button>
          </div>

        </form>
      `
    });

    if (window.lucide) window.lucide.createIcons();
  },

  async submitCreateForumPost(event) {
    if (event) event.preventDefault();
    this.haptic('medium');

    const title = (document.getElementById('forum-post-title-input')?.value || '').trim();
    const category = (document.getElementById('forum-post-category-select')?.value || 'TECH').trim();
    const survey_id = (document.getElementById('forum-post-survey-select')?.value || '').trim() || null;
    const editor = document.getElementById('forum-post-editor');
    const content = editor ? editor.innerHTML.trim() : '';
    const plainText = editor ? (editor.innerText || editor.textContent || '').trim() : '';
    const hubRadio = document.querySelector('input[name="forum-hub-choice"]:checked');
    const post_type = hubRadio ? hubRadio.value : 'COMMUNITY';

    if (!title || !plainText) {
      this.showToast('Vui lòng điền đầy đủ tiêu đề và nội dung bài viết!', 'warning');
      return;
    }

    const btn = document.getElementById('forum-post-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Đang chuẩn bị đăng bài...</span>';
    }

    try {
      // 1. Upload hình ảnh minh họa đính kèm (nếu có)
      let uploadedImageUrls = [];
      const attachedImages = this.state.forumAttachedImages || [];
      if (attachedImages.length > 0) {
        if (btn) {
          btn.innerHTML = `<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Đang tải lên ${attachedImages.length} ảnh...</span>`;
        }
        for (let i = 0; i < attachedImages.length; i++) {
          const img = attachedImages[i];
          const uploadRes = await this.api('/upload/image', {
            method: 'POST',
            body: JSON.stringify({ image_data: img.dataUrl, type: 'forum' })
          });
          if (uploadRes && uploadRes.success && uploadRes.url) {
            uploadedImageUrls.push(uploadRes.url);
          }
        }
      }

      if (btn) {
        btn.innerHTML = '<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Đang lưu bài viết...</span>';
      }

      const res = await this.api('/forum/posts', {
        method: 'POST',
        body: JSON.stringify({ title, category, survey_id, content, images: uploadedImageUrls, post_type })
      });

      if (res && res.success) {
        this.haptic('success');
        this.showToast('Đăng bài viết lên diễn đàn thành công!', 'success');
        this.state.forumAttachedImages = [];
        this.closeModal();
        if (this.state.forumFilter) {
          this.state.forumFilter.hub = post_type;
        }
        await this.renderForumView(document.getElementById('app-root'));
      } else {
        this.showToast(res.message || 'Lỗi khi đăng bài', 'error');
      }
    } catch (err) {
      this.showToast(err.message || 'Lỗi đăng bài viết', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="send" class="w-3.5 h-3.5"></i><span>Đăng Bài Lên Diễn Đàn</span>';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  // ==================== SOẠN THẢO TRỰC QUAN WYSIWYG & ĐỊNH DẠNG DIỄN ĐÀN ====================
  formatForumEditor(cmd) {
    const editor = document.getElementById('forum-post-editor');
    if (!editor) return;
    editor.focus();

    if (cmd === 'cycleOrderedList') {
      const sel = window.getSelection();
      let parentOl = null;
      if (sel && sel.anchorNode) {
        let node = sel.anchorNode;
        while (node && node !== editor) {
          if (node.nodeName === 'OL') {
            parentOl = node;
            break;
          }
          node = node.parentNode;
        }
      }

      if (!parentOl) {
        // Click lần 1: Chưa có danh sách đánh số -> Đánh số theo thứ tự 1, 2, 3...
        document.execCommand('insertOrderedList', false, null);
        const newSel = window.getSelection();
        if (newSel && newSel.anchorNode) {
          let node = newSel.anchorNode;
          while (node && node !== editor) {
            if (node.nodeName === 'OL') {
              node.setAttribute('type', '1');
              node.classList.remove('list-alpha');
              break;
            }
            node = node.parentNode;
          }
        }
      } else {
        const currentType = parentOl.getAttribute('type');
        const isAlpha = currentType === 'a' || parentOl.classList.contains('list-alpha');

        if (!isAlpha) {
          // Click lần 2: Đang là số 1, 2, 3 -> Chuyển sang chữ cái abc (a, b, c...)
          parentOl.setAttribute('type', 'a');
          parentOl.classList.add('list-alpha');
        } else {
          // Click lần 3: Đang là chữ cái abc -> Tắt đánh số (quay về đoạn văn thường)
          document.execCommand('insertOrderedList', false, null);
        }
      }
    } else {
      document.execCommand(cmd, false, null);
    }
  },

  formatForumContent(raw) {
    if (!raw || typeof raw !== 'string') return '';

    // Nếu chứa HTML từ Rich Text Editor: làm sạch an toàn
    const hasHtmlTags = /<(?:strong|b|em|i|u|ul|ol|li|p|div|br|blockquote)[\s>]/i.test(raw);

    if (hasHtmlTags) {
      return raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '');
    }

    // Fallback cho bài viết cũ dạng Markdown:
    let escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-stone-900 dark:text-white">$1</strong>');
    escaped = escaped.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em class="italic">$2</em>');

    const lines = escaped.split('\n');
    const output = [];
    let currentListType = null; // 'ul', 'ol-num', 'ol-abc'

    const closeListIfOpen = () => {
      if (currentListType === 'ul') output.push('</ul>');
      else if (currentListType === 'ol-num' || currentListType === 'ol-abc') output.push('</ol>');
      currentListType = null;
    };

    for (let line of lines) {
      const isIndented = line.startsWith('    ') || line.startsWith('\t');
      let contentLine = isIndented ? line.replace(/^( {4}|\t)/, '') : line;

      const bulletMatch = contentLine.match(/^[•\-\*]\s+(.*)$/);
      const numMatch = contentLine.match(/^(\d+)\.\s+(.*)$/);
      const abcMatch = contentLine.match(/^([a-zA-Z])\.\s+(.*)$/);

      if (bulletMatch) {
        if (currentListType !== 'ul') {
          closeListIfOpen();
          output.push('<ul class="list-disc list-inside space-y-1 my-1 pl-1 text-stone-700 dark:text-stone-300">');
          currentListType = 'ul';
        }
        output.push(`<li class="leading-relaxed ${isIndented ? 'pl-4 border-l-2 border-stone-200 dark:border-stone-700' : ''}">${bulletMatch[1]}</li>`);
      } else if (numMatch) {
        if (currentListType !== 'ol-num') {
          closeListIfOpen();
          output.push('<ol class="list-decimal list-inside space-y-1 my-1 pl-1 text-stone-700 dark:text-stone-300">');
          currentListType = 'ol-num';
        }
        output.push(`<li class="leading-relaxed ${isIndented ? 'pl-4 border-l-2 border-stone-200 dark:border-stone-700' : ''}">${numMatch[2]}</li>`);
      } else if (abcMatch) {
        if (currentListType !== 'ol-abc') {
          closeListIfOpen();
          output.push('<ol class="list-[lower-alpha] list-inside space-y-1 my-1 pl-1 text-stone-700 dark:text-stone-300">');
          currentListType = 'ol-abc';
        }
        output.push(`<li class="leading-relaxed ${isIndented ? 'pl-4 border-l-2 border-stone-200 dark:border-stone-700' : ''}">${abcMatch[2]}</li>`);
      } else {
        closeListIfOpen();
        if (line.trim().length === 0) {
          output.push('<div class="h-2"></div>');
        } else if (isIndented) {
          output.push(`<div class="pl-4 my-1 border-l-2 border-orange-500/50 text-stone-700 dark:text-stone-300 italic">${contentLine}</div>`);
        } else {
          output.push(`<p class="leading-relaxed">${line}</p>`);
        }
      }
    }
    closeListIfOpen();

    return output.join('');
  },

  _renderForumPostContentWithToggle(post) {
    const formattedHtml = this.formatForumContent(post.content || '');

    // Đếm số từ thực tế của bài viết
    let plainText = '';
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedHtml;
      plainText = (tempDiv.innerText || tempDiv.textContent || '').trim();
    } else {
      plainText = formattedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const words = plainText.split(/\s+/).filter(Boolean);

    // Nếu bài viết dưới hoặc bằng 100 từ: hiển thị trọn vẹn
    if (words.length <= 100) {
      return `
        <div class="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed forum-post-body space-y-1">
          ${formattedHtml}
        </div>
      `;
    }

    // Nếu bài viết dài hơn 100 từ: cắt 100 từ đầu tiên
    const truncatedWords = words.slice(0, 100).join(' ');
    const shortHtml = this.formatForumContent(truncatedWords);

    return `
      <div id="forum-post-content-short-${post.id}" class="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed forum-post-body space-y-1">
        ${shortHtml}...
        <button type="button" onclick="VibeApp.toggleForumPostContent('${post.id}')" 
                class="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-bold text-xs inline-flex items-center gap-1 cursor-pointer ml-1 select-none">
          <span>Xem thêm</span>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
        </button>
      </div>

      <div id="forum-post-content-full-${post.id}" class="hidden text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed forum-post-body space-y-1">
        ${formattedHtml}
        <div class="pt-1.5">
          <button type="button" onclick="VibeApp.toggleForumPostContent('${post.id}')" 
                  class="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-bold text-xs inline-flex items-center gap-1 cursor-pointer select-none">
            <span>Thu gọn</span>
            <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  },

  toggleForumPostContent(postId) {
    const shortEl = document.getElementById(`forum-post-content-short-${postId}`);
    const fullEl = document.getElementById(`forum-post-content-full-${postId}`);
    if (shortEl && fullEl) {
      shortEl.classList.toggle('hidden');
      fullEl.classList.toggle('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  },

  // ==================== QUẢN LÝ ĐÍNH KÈM & GALLERY HÌNH ẢNH DIỄN ĐÀN ====================
  async handleForumImagesSelected(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const files = Array.from(input.files);
    input.value = '';

    if (!this.state.forumAttachedImages) {
      this.state.forumAttachedImages = [];
    }

    const maxImages = 10;
    const currentCount = this.state.forumAttachedImages.length;
    const availableSlots = maxImages - currentCount;

    if (availableSlots <= 0) {
      this.showToast('Bạn đã đính kèm tối đa 10 ảnh minh họa cho bài viết!', 'warning');
      return;
    }

    let filesToProcess = files;
    if (files.length > availableSlots) {
      this.showToast(`Chỉ có thể thêm tối đa ${availableSlots} ảnh nữa (tổng cộng tối đa 10 ảnh). Đã chọn ${availableSlots} ảnh đầu tiên.`, 'info');
      filesToProcess = files.slice(0, availableSlots);
    }

    // Quy định dung lượng tiêu chuẩn Facebook: tối đa 10MB mỗi ảnh
    const maxFileSizeBytes = 10 * 1024 * 1024;
    for (const file of filesToProcess) {
      if (file.size > maxFileSizeBytes) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        this.showToast(`Ảnh "${file.name}" dung lượng ${sizeMb}MB vượt quá giới hạn 10MB (quy định tiêu chuẩn Facebook).`, 'warning');
        return;
      }
    }

    this.showToast('Đang nén và tối ưu hóa ảnh...', 'info');

    for (const file of filesToProcess) {
      try {
        const compressed = await this.compressImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
        this.state.forumAttachedImages.push({
          name: file.name,
          size: file.size,
          compressedSize: compressed.compressedSize,
          dataUrl: compressed.dataUrl,
          width: compressed.width,
          height: compressed.height
        });
      } catch (err) {
        console.error('Lỗi nén ảnh:', err);
        this.showToast(`Không thể đọc ảnh "${file.name}": ${err.message}`, 'error');
      }
    }

    this._renderForumAttachedImagesPreview();
  },

  removeForumAttachedImage(index) {
    if (this.state.forumAttachedImages && index >= 0 && index < this.state.forumAttachedImages.length) {
      this.state.forumAttachedImages.splice(index, 1);
      this._renderForumAttachedImagesPreview();
    }
  },

  _renderForumAttachedImagesPreview() {
    const container = document.getElementById('forum-attached-images-container');
    const badge = document.getElementById('forum-images-count-badge');
    const addBtn = document.getElementById('forum-add-images-btn');
    const images = this.state.forumAttachedImages || [];

    if (badge) {
      badge.textContent = `${images.length}/10 ảnh`;
      if (images.length >= 10) {
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 font-bold font-mono';
      } else {
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold font-mono';
      }
    }

    if (addBtn) {
      if (images.length >= 10) {
        addBtn.classList.add('hidden');
      } else {
        addBtn.classList.remove('hidden');
      }
    }

    if (!container) return;

    if (images.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = images.map((img, idx) => `
      <div class="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 group shrink-0">
        <img src="${img.dataUrl}" alt="Ảnh minh họa ${idx + 1}" class="w-full h-full object-cover">
        <button type="button" onclick="VibeApp.removeForumAttachedImage(${idx})" 
                class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-orange-600 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                title="Gỡ ảnh này">
          <i data-lucide="x" class="w-3 h-3 stroke-[2.5]"></i>
        </button>
        <div class="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] font-mono text-white text-center py-0.5 truncate px-1">
          ${this._formatFileSize(img.compressedSize || img.size)}
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  _renderForumPostImagesHtml(images, title = 'Ảnh minh họa bài viết') {
    if (!images || !Array.isArray(images) || images.length === 0) return '';
    const safeTitle = this.escapeHtml(title).replace(/'/g, "\\'");
    const count = images.length;

    if (count === 1) {
      const img = images[0];
      return `
        <div class="mt-3 rounded-2xl overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 max-h-96 w-full flex items-center justify-center">
          <img src="${this.escapeHtml(img)}" 
               alt="${safeTitle}" 
               loading="lazy"
               onclick="VibeApp.previewFullImage('${this.escapeHtml(img)}', '${safeTitle}')"
               class="w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-95 transition-opacity">
        </div>
      `;
    }

    if (count === 2) {
      return `
        <div class="mt-3 grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
          ${images.map(img => `
            <div class="relative aspect-4/3 overflow-hidden rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-100 dark:bg-stone-900">
              <img src="${this.escapeHtml(img)}" 
                   alt="${safeTitle}" 
                   loading="lazy"
                   onclick="VibeApp.previewFullImage('${this.escapeHtml(img)}', '${safeTitle}')"
                   class="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform">
            </div>
          `).join('')}
        </div>
      `;
    }

    if (count === 3) {
      return `
        <div class="mt-3 grid grid-cols-3 gap-2 rounded-2xl overflow-hidden">
          ${images.map(img => `
            <div class="relative aspect-square overflow-hidden rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-100 dark:bg-stone-900">
              <img src="${this.escapeHtml(img)}" 
                   alt="${safeTitle}" 
                   loading="lazy"
                   onclick="VibeApp.previewFullImage('${this.escapeHtml(img)}', '${safeTitle}')"
                   class="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform">
            </div>
          `).join('')}
        </div>
      `;
    }

    // 4 ảnh trở lên (tối đa 10 ảnh)
    return `
      <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden">
        ${images.map(img => `
          <div class="relative aspect-square overflow-hidden rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-100 dark:bg-stone-900">
            <img src="${this.escapeHtml(img)}" 
                 alt="${safeTitle}" 
                 loading="lazy"
                 onclick="VibeApp.previewFullImage('${this.escapeHtml(img)}', '${safeTitle}')"
                 class="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform">
          </div>
        `).join('')}
      </div>
    `;
  },

  shareForumPost(postId) {
    this.haptic('light');
    const shareUrl = `${window.location.origin}?tab=forum#post-${postId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Đã sao chép liên kết bài viết vào bộ nhớ tạm!', 'success');
      }).catch(() => {
        this.showToast(`Liên kết bài viết: ${shareUrl}`, 'info');
      });
    } else {
      this.showToast(`Liên kết bài viết: ${shareUrl}`, 'info');
    }
  },

  async deleteForumPost(postId) {
    this.haptic('medium');
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này trên diễn đàn không?')) return;

    try {
      const res = await this.api(`/forum/posts/${postId}`, { method: 'DELETE' });
      if (res && res.success) {
        this.haptic('success');
        this.showToast('Đã xóa bài viết thành công!', 'success');
        await this.renderForumView(document.getElementById('app-root'));
      }
    } catch (err) {
      this.showToast(err.message || 'Lỗi khi xóa bài viết', 'error');
    }
  },

  async toggleForumPostLike(postId) {
    this.haptic('light');
    if (!this.state.currentUser) {
      this.showToast('Vui lòng đăng nhập để thích bài viết!', 'info');
      this.openAuthModal('login');
      return;
    }

    try {
      const res = await this.api(`/forum/posts/${postId}/like`, { method: 'POST' });
      if (res && res.success) {
        const countEl = document.getElementById(`forum-post-like-count-${postId}`);
        if (countEl) countEl.textContent = res.likes_count || 0;
        if (this.state.forumPosts) {
          const p = this.state.forumPosts.find(x => x.id === postId);
          if (p) {
            p.is_liked = res.is_liked;
            p.likes_count = res.likes_count;
          }
        }
        const postCard = document.getElementById(`forum-post-${postId}`);
        if (postCard) {
          const btn = postCard.querySelector(`button[onclick*="toggleForumPostLike('${postId}')"]`);
          if (btn) {
            if (res.is_liked) {
              btn.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer border-orange-500/50 bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 font-bold";
              const ic = btn.querySelector('i');
              if (ic) ic.className = "w-3.5 h-3.5 fill-orange-600 text-orange-600 stroke-orange-600";
            } else {
              btn.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300";
              const ic = btn.querySelector('i');
              if (ic) ic.className = "w-3.5 h-3.5 text-stone-500";
            }
          }
        }
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async toggleForumComments(postId) {
    this.haptic('light');
    if (!this.state.openCommentPostIds) this.state.openCommentPostIds = [];
    const container = document.getElementById(`forum-comments-container-${postId}`);
    if (!container) return;

    const isOpen = !container.classList.contains('hidden');
    if (isOpen) {
      container.classList.add('hidden');
      this.state.openCommentPostIds = this.state.openCommentPostIds.filter(id => id !== postId);
    } else {
      container.classList.remove('hidden');
      if (!this.state.openCommentPostIds.includes(postId)) {
        this.state.openCommentPostIds.push(postId);
      }
      await this.loadForumComments(postId);
    }
  },

  async loadForumComments(postId) {
    const listEl = document.getElementById(`forum-comments-list-${postId}`);
    if (!listEl) return;
    try {
      const res = await this.api(`/forum/posts/${postId}`);
      if (res && res.success && res.post) {
        const comments = res.post.comments || [];
        if (comments.length === 0) {
          listEl.innerHTML = `
            <div class="py-3 text-center text-xs text-stone-400">Chưa có bình luận nào. Hãy gửi bình luận đầu tiên!</div>
          `;
        } else {
          listEl.innerHTML = comments.map(c => {
            const letter = (c.author && c.author.name || 'U').charAt(0).toUpperCase();
            const timeStr = this._formatTimeAgo(c.created_at);
            return `
              <div class="p-2.5 rounded-xl bg-white dark:bg-[#1C1C20] border border-stone-200/70 dark:border-stone-800 flex items-start gap-2.5 text-xs">
                <div class="w-7 h-7 rounded-lg overflow-hidden bg-stone-800 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  ${c.author && c.author.avatar_url ? `<img src="${c.author.avatar_url}" alt="Avatar" class="w-full h-full object-cover" onerror="this.onerror=null;this.parentElement.textContent='${letter}';">` : letter}
                </div>
                <div class="flex-1 min-w-0 space-y-0.5">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-stone-900 dark:text-white">${this.escapeHtml(c.author ? c.author.name : 'Người dùng')}</span>
                    <span class="text-[10px] text-stone-400">${timeStr}</span>
                  </div>
                  <p class="text-stone-600 dark:text-stone-300 whitespace-pre-line leading-relaxed">${this.escapeHtml(c.content)}</p>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    } catch (err) {
      listEl.innerHTML = `<div class="py-2 text-center text-xs text-orange-500">${this.escapeHtml(err.message)}</div>`;
    }
    if (window.lucide) window.lucide.createIcons();
  },

  async submitForumComment(postId) {
    this.haptic('medium');
    if (!this.state.currentUser) {
      this.showToast('Vui lòng đăng nhập để bình luận!', 'info');
      this.openAuthModal('login');
      return;
    }

    const input = document.getElementById(`forum-comment-input-${postId}`);
    const content = (input?.value || '').trim();
    if (!content) {
      this.showToast('Vui lòng nhập nội dung bình luận!', 'warning');
      return;
    }

    try {
      const res = await this.api(`/forum/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });

      if (res && res.success) {
        if (input) input.value = '';
        this.haptic('success');
        this.showToast('Đã gửi bình luận thành công!', 'success');
        const countEl = document.getElementById(`forum-post-comment-count-${postId}`);
        if (countEl) {
          const cur = parseInt(countEl.textContent, 10) || 0;
          countEl.textContent = cur + 1;
        }
        await this.loadForumComments(postId);
      }
    } catch (err) {
      this.showToast(err.message || 'Lỗi gửi bình luận', 'error');
    }
  },
  };

  // Mo rong vao Namespace SSOT window.VibeApp
  Object.assign(window.VibeApp, ForumModule);
  window.ForumModule = ForumModule;
})();
