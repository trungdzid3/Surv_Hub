/**
 * VibeSurvey - Respondent Module (WAVE 7 MODULAR)
 * Gom toan bo mien RESPONDENT tu public/app.js (di chuyen nguyen van, khong doi hanh vi), gom 2 nhom:
 * (a) RUNNER LAM BAI KHAO SAT PHAN DOAN + REVIEW (TYPEFORM ZEN FOCUS - VIEW 2):
 *     startSurveySession, _saveActiveSessionToStorage, beginTakeSurvey, buildSurveySections,
 *     renderTakeSurveyView, renderQuestionOptions, selectSingleOption, toggleMultipleOption,
 *     selectChoiceGridCell, toggleCheckboxGridCell, updateOpenText, handleFileUploadChange,
 *     validateQuestionInput, handleSurveyInputRealtime, validateCurrentSection,
 *     _normalizeSmartText, _isSmartTextMatch, resolveSectionTarget, nextSection, prevSection,
 *     nextQuestion, prevQuestion, triggerPacingLock, executeExitSurvey, handleScreenOut,
 *     submitSurvey, renderReviewSurveyView.
 * (b) HO SO 5 TAB + NHAN KHAU HOC + AVATAR + XOA DU LIEU (VIEW TAB HO SO & XAC THUC):
 *     renderProfileView, switchProfileTab, switchSurveySubTab, saveDemographicsAction,
 *     handleProfileAvatarUpload, deleteSurveyAction.
 *
 * Giu lai app.js (core, KHONG thuoc rieng Respondent): RestrictionEngine, init/theme/logo/dropdown/state,
 * router navigate, home, danh sach khao sat (renderSurveysView, renderCompactSurveyCard,
 * renderListSurveyRow, bo loc), renderNavigation, metrics, renderCreatorSurveysView, renderAnalyticsView
 * va cac tien ich dung chung (_formatFileSize, compressImageFile, generateValidationPlaceholder,
 * getYouTubeEmbedUrl, getLucideSvg, escapeHtml alias, copyText, switchAdmin*).
 *
 * Cac phu thuoc goi qua this.* (state, api, haptic, navigate, escapeHtml, showToast/showModal/closeModal,
 * generateValidationPlaceholder, getYouTubeEmbedUrl, getDeviceFingerprint, applyUserInterface,
 * renderUserProfileDropdown, renderGuestLockedView, openAuthModal...) deu late-binding qua window.VibeApp
 * nen van hoat dong dung sau khi Object.assign; module duoc nap TRUOC app.js. RestrictionEngine la global
 * script-scoped trong app.js; cac ham su dung pattern an toan san co (window.RestrictionEngine +
 * typeof guard) nen giu nguyen van khi di chuyen. Hang window.VIBE_34_PROVINCES (catalogs.js) truy cap
 * qua window.* theo san. Timer _pacingTimer la property dong tren VibeApp, tu chua trong module nay.
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * @namespace window.VibeApp
 * @requires window.VibeApp (core: state, api, haptic, navigate, escapeHtml,
 *           showToast/showModal/closeModal [modalsTerms.js], renderGuestLockedView,
 *           generateValidationPlaceholder, getYouTubeEmbedUrl, getDeviceFingerprint,
 *           applyUserInterface, renderUserProfileDropdown, openAuthModal [app.js]),
 *           window.RestrictionEngine (app.js, typeof-guard), window.VIBE_34_PROVINCES (catalogs.js),
 *           lucide (global), DOM: app-root
 * @exports startSurveySession, _saveActiveSessionToStorage, beginTakeSurvey, buildSurveySections,
 *          renderTakeSurveyView, renderQuestionOptions, selectSingleOption, toggleMultipleOption,
 *          selectChoiceGridCell, toggleCheckboxGridCell, updateOpenText, handleFileUploadChange,
 *          validateQuestionInput, handleSurveyInputRealtime, validateCurrentSection,
 *          _normalizeSmartText, _isSmartTextMatch, resolveSectionTarget, nextSection, prevSection,
 *          nextQuestion, prevQuestion, triggerPacingLock, executeExitSurvey, handleScreenOut,
 *          submitSurvey, renderReviewSurveyView, renderProfileView, switchProfileTab,
 *          switchSurveySubTab, saveDemographicsAction, handleProfileAvatarUpload, deleteSurveyAction
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const RespondentModule = {
  // ==================== VIEW 2: TRÌNH LÀM BÀI KHẢO SÁT (TYPEFORM ZEN FOCUS) ====================
  async startSurveySession(surveyId) {
    this.haptic('light');

    if (!this.state.currentUser) {
      this.state.pendingSurveyId = surveyId;
      this.showToast('Vui lòng đăng nhập để bắt đầu làm bài khảo sát!', 'info');
      this.openAuthModal('login');
      return;
    }

    // Kiểm tra xem đã có bài làm dở của khảo sát này trong storage chưa để khôi phục
    const cachedSessionJson = (localStorage.getItem('survhub_active_session') || localStorage.getItem('vibesurvey_active_session'));
    if (cachedSessionJson) {
      try {
        const cached = JSON.parse(cachedSessionJson);
        if (cached && cached.surveyId === surveyId && (Object.keys(cached.answers || {}).length > 0 || cached.currentIndex > 0)) {
          this.state.activeSession = cached;
          if (this.state.activeSession.timerId) clearInterval(this.state.activeSession.timerId);
          this.state.activeSession.timerId = setInterval(() => {
            if (this.state.activeSession) {
              this.state.activeSession.durationSec = (this.state.activeSession.durationSec || 0) + 1;
              this._saveActiveSessionToStorage();
              const timerEl = document.getElementById('session-timer-text');
              if (timerEl) {
                const sec = this.state.activeSession.durationSec;
                const mins = Math.floor(sec / 60);
                const remSec = sec % 60;
                timerEl.textContent = `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
              }
            }
          }, 1000);
          this.showToast('Đang tiếp tục bài khảo sát của bạn...', 'info');
          await this.navigate('take-survey', { surveyId });
          return;
        }
      } catch (e) {
        // bỏ qua nếu parse lỗi
      }
    }

    try {
      const res = await this.api(`/surveys/${surveyId}/start-session`, { method: 'POST' });
      if (res.success) {
        const detailRes = await this.api(`/surveys/${surveyId}`);
        const surveyDetail = detailRes.survey || {};
        const isEditing = res.is_editing === true;
        const hasExistingAnswers = Object.keys(res.existingAnswers || {}).length > 0;
        const shouldStartDirectly = isEditing || hasExistingAnswers;

        this.state.activeSession = {
          surveyId,
          survey: surveyDetail,
          responseId: res.responseId,
          questions: res.questions || [],
          currentIndex: 0,
          answers: res.existingAnswers || {},
          durationSec: 0,
          minTimeSec: isEditing ? 0 : (res.minCompletionTimeSec || 15),
          rewardPoints: isEditing ? 0 : (res.rewardPoints || surveyDetail.reward_points_per_response || 0),
          isPacingLocked: false,
          isEditing: isEditing,
          hasStartedQuiz: shouldStartDirectly,
          timerId: null
        };

        if (shouldStartDirectly) {
          this.state.activeSession.timerId = setInterval(() => {
            if (this.state.activeSession) {
              this.state.activeSession.durationSec++;
              this._saveActiveSessionToStorage();
              const timerEl = document.getElementById('session-timer-text');
              if (timerEl) {
                const sec = this.state.activeSession.durationSec;
                const mins = Math.floor(sec / 60);
                const remSec = sec % 60;
                timerEl.textContent = `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
              }
            }
          }, 1000);
        }

        this._saveActiveSessionToStorage();
        this.navigate('take-survey', { surveyId });
      }
    } catch (err) {
      localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');
      this.state.activeSession = null;
      if (err.message && err.message.includes('Bạn đã hoàn thành khảo sát')) {
        this.showToast('Bạn đã hoàn thành khảo sát này. Đang mở câu trả lời của bạn...', 'info');
        await this.navigate('review-survey', { surveyId });
        return;
      }
      this.showToast(err.message, 'error');
    }
  },

  _saveActiveSessionToStorage() {
    if (!this.state.activeSession) {
      localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');
      return;
    }
    try {
      const s = this.state.activeSession;
      const serializable = {
        surveyId: s.surveyId,
        survey: s.survey,
        responseId: s.responseId,
        questions: s.questions,
        currentIndex: s.currentIndex,
        answers: s.answers,
        durationSec: s.durationSec,
        minTimeSec: s.minTimeSec,
        rewardPoints: s.rewardPoints,
        isEditing: s.isEditing === true,
        hasStartedQuiz: s.hasStartedQuiz === true
      };
      localStorage.setItem('survhub_active_session', JSON.stringify(serializable));
    } catch (e) {
      console.warn('Lỗi lưu session vào storage:', e);
    }
  },

  beginTakeSurvey() {
    this.haptic('medium');
    const session = this.state.activeSession;
    if (!session) return;
    session.hasStartedQuiz = true;
    this.state.surveyRunner = {
      visited_sections: new Set()
    };
    if (!session.timerId) {
      session.timerId = setInterval(() => {
        if (this.state.activeSession && this.state.activeSession.hasStartedQuiz) {
          this.state.activeSession.durationSec = (this.state.activeSession.durationSec || 0) + 1;
          this._saveActiveSessionToStorage();
          const timerEl = document.getElementById('session-timer-text');
          if (timerEl) {
            const sec = this.state.activeSession.durationSec;
            const mins = Math.floor(sec / 60);
            const remSec = sec % 60;
            timerEl.textContent = `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
          }
        }
      }, 1000);
    }
    this._saveActiveSessionToStorage();
    const root = document.getElementById('app-root');
    if (root) {
      this.renderTakeSurveyView(root, session.surveyId);
    }
  },

  // ==================== VIEW 2: TRÌNH LÀM BÀI KHẢO SÁT (SECTION-BASED MULTI-QUESTION RUNNER) ====================
  // Gom nhóm danh sách câu hỏi thành mảng các Section theo chuẩn Google Forms / Microsoft Forms
  buildSurveySections(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return [{
        id: 'section-0',
        title: (this.state && this.state.activeSession && this.state.activeSession.survey && this.state.activeSession.survey.title) || 'Bài khảo sát',
        description: (this.state && this.state.activeSession && this.state.activeSession.survey && this.state.activeSession.survey.description) || '',
        defaultAction: 'NEXT_PAGE',
        target: null,
        questions: []
      }];
    }

    const defaultTitle = (this.state && this.state.activeSession && this.state.activeSession.survey && this.state.activeSession.survey.title) || 'Mục 1: Thông tin chung';
    const defaultDesc = (this.state && this.state.activeSession && this.state.activeSession.survey && this.state.activeSession.survey.description) || '';

    const sections = [];
    let curSection = null;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.type === 'SECTION_HEADER') {
        if (curSection) {
          sections.push(curSection);
        }
        const defAction = (q.logic && q.logic.default_action) ? q.logic.default_action : ((q.logic && q.logic.target) ? 'GO_TO_PAGE' : 'NEXT_PAGE');
        const tgt = (q.logic && q.logic.target !== undefined && q.logic.target !== null && q.logic.target !== '') ? q.logic.target : null;
        curSection = {
          id: q.id || `section-${sections.length}`,
          headerQuestionId: q.id,
          title: q.content || `Mục ${sections.length + 1}`,
          description: (q.rows && q.rows[0]) ? q.rows[0] : (q.description || ''),
          defaultAction: defAction,
          target: tgt,
          questions: []
        };
      } else {
        if (!curSection) {
          curSection = {
            id: 'section-0',
            title: defaultTitle,
            description: defaultDesc,
            defaultAction: 'NEXT_PAGE',
            target: null,
            questions: []
          };
        }
        curSection.questions.push(q);
      }
    }

    if (curSection) {
      sections.push(curSection);
    }

    if (sections.length === 0) {
      sections.push({
        id: 'section-0',
        title: defaultTitle,
        description: defaultDesc,
        defaultAction: 'NEXT_PAGE',
        target: null,
        questions: questions.filter(q => q.type !== 'SECTION_HEADER')
      });
    }

    return sections;
  },

  async renderTakeSurveyView(root, surveyId) {
    const session = this.state.activeSession;
    if (!session || session.surveyId !== surveyId) {
      root.innerHTML = `
        <div class="text-center py-20 space-y-3">
          <p class="text-xs text-slate-500 font-medium">Phiên làm bài đã kết thúc hoặc không tìm thấy.</p>
          <button onclick="VibeApp.navigate('surveys')" class="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">
            Về Cổng Khảo Sát
          </button>
        </div>
      `;
      return;
    }

    if (session && (!session.survey || !session.survey.cover_image_url)) {
      try {
        const freshRes = await this.api(`/surveys/${surveyId}`);
        if (freshRes && freshRes.survey) {
          session.survey = freshRes.survey;
          this._saveActiveSessionToStorage();
        }
      } catch (e) { }
    }

    const hasStarted = session.hasStartedQuiz === true || session.isEditing || (session.currentSectionIndex || 0) > 0 || session.currentIndex > 0 || Object.keys(session.answers || {}).length > 0;
    if (!hasStarted) {
      const s = session.survey || {};
      const coverUrl = s.cover_image_url || null;
      const minMins = Math.max(1, Math.ceil((session.minTimeSec || 30) / 60));
      const rewardPts = session.rewardPoints || s.reward_points_per_response || 0;
      const hasVoucher = !!(s.sponsor && (s.sponsor.brand_name || s.sponsor.title));
      const voucherName = s.sponsor ? (s.sponsor.title || `Voucher ${s.sponsor.brand_name}`) : '';

      root.innerHTML = `
        <div class="stepper-focus-box max-w-3xl mx-auto py-4 sm:py-6 space-y-6">
          
          <!-- Top Navigation -->
          <div class="flex items-center justify-between text-xs text-stone-500 pb-2">
            <button onclick="VibeApp.navigate('surveys')" class="hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1.5 font-bold transition-colors">
              <i data-lucide="arrow-left" class="w-4 h-4 stroke-[2.2]"></i>
              <span>Về Cổng Khảo Sát</span>
            </button>
            <span class="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold text-[11px]">
              ${s.category || 'Khảo sát'}
            </span>
          </div>

          <!-- Main Cover Card (Google Forms Hybrid Style) -->
          <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
            ${coverUrl ? `
              <!-- Ảnh bìa biểu mẫu chuẩn Google Forms tinh gọn, căn giữa không bị lệch hay cắt xén -->
              <div class="relative w-full h-32 sm:h-40 overflow-hidden bg-stone-950 flex items-center justify-center">
                <img src="${coverUrl}" alt="" class="absolute inset-0 w-full h-full object-cover object-center blur-md opacity-35 scale-105 pointer-events-none">
                <img src="${coverUrl}" alt="Ảnh bìa khảo sát" class="relative max-h-full max-w-full object-contain mx-auto z-10" onerror="this.parentElement.style.display='none'">
              </div>
            ` : ''}

            <!-- Dải Accent Cam Vibe #EA580C -->
            <div class="h-2 bg-orange-600 w-full ${coverUrl ? '' : 'rounded-t-2xl'}"></div>

            <div class="p-6 sm:p-8 space-y-6">
              
              <!-- Tiêu đề & Mô tả -->
              <div class="space-y-3">
                <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  ${this.escapeHtml(s.title || 'Bài khảo sát')}
                </h1>
                <p class="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                  ${this.escapeHtml(s.description || 'Khảo sát nghiên cứu thị trường và thu thập ý kiến cộng đồng.')}
                </p>
              </div>

              <!-- Thẻ thông số tóm tắt (Bento Grid) -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                
                <div class="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-0.5">
                  <div class="text-[10px] font-semibold uppercase text-stone-400">Phần thưởng</div>
                  <div class="text-sm font-extrabold text-orange-600 dark:text-orange-400 font-mono">
                    +${rewardPts.toLocaleString()} Điểm
                  </div>
                  <div class="text-[10px] text-stone-400 font-mono">≈ ${rewardPts.toLocaleString()}đ</div>
                </div>

                <div class="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-0.5">
                  <div class="text-[10px] font-semibold uppercase text-stone-400">Quy mô câu hỏi</div>
                  <div class="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    ${session.questions.length} câu hỏi
                  </div>
                  <div class="text-[10px] text-stone-400">Tự động lưu bài</div>
                </div>

                <div class="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-0.5 col-span-2 sm:col-span-1">
                  <div class="text-[10px] font-semibold uppercase text-stone-400">Thời gian ước tính</div>
                  <div class="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    ~${minMins} phút
                  </div>
                  <div class="text-[10px] text-stone-400">Nhịp độ tối thiểu ${session.minTimeSec || 15}s</div>
                </div>

              </div>

              ${hasVoucher ? `
                <div class="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                    <i data-lucide="gift" class="w-5 h-5"></i>
                  </div>
                  <div class="overflow-hidden">
                    <div class="text-xs font-bold text-orange-900 dark:text-orange-200 truncate">Tài trợ quà tặng voucher độc quyền</div>
                    <div class="text-[11px] text-orange-700 dark:text-orange-400 truncate">${voucherName}</div>
                  </div>
                </div>
              ` : ''}

              ${s.allow_email_collection === true ? `
                <!-- Thông báo quyền riêng tư: khảo sát bật chế độ thu thập email đáp viên -->
                <div class="flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  <i data-lucide="mail" class="w-3.5 h-3.5 shrink-0 mt-0.5"></i>
                  <span>Khảo sát này sẽ chia sẻ địa chỉ email tài khoản của bạn cho doanh nghiệp sau khi hoàn thành.</span>
                </div>
              ` : ''}

              <!-- Lưu ý làm bài trung thực & Tiêu chuẩn chất lượng -->
              <div class="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800/80 text-[11px] text-stone-500 dark:text-stone-400 space-y-1.5 leading-relaxed">
                <div class="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-3.5 h-3.5 text-orange-600"></i>
                  <span>Quy tắc bảo đảm chất lượng dữ liệu:</span>
                </div>
                <p>• Trả lời cẩn thận và trung thực dựa trên trải nghiệm thực tế của bạn.</p>
                <p>• Hệ thống tích hợp thuật toán kiểm tra tính tập trung (Attention Check) và phát hiện nhấp bừa để đảm bảo quyền lợi cộng đồng.</p>
              </div>

              <!-- Nút Bắt Đầu Làm Bài -->
              <div class="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button type="button" onclick="VibeApp.beginTakeSurvey()" class="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
                  <span>Bắt Đầu Làm Khảo Sát</span>
                  <i data-lucide="arrow-right" class="w-4 h-4 stroke-[2.5]"></i>
                </button>
                <button type="button" onclick="VibeApp.navigate('surveys')" class="w-full sm:w-auto py-3.5 px-5 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-bold text-xs transition-colors text-center">
                  Để sau
                </button>
              </div>

            </div>
          </div>

        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const typeLabels = {
      SINGLE_CHOICE: 'Trắc nghiệm đơn',
      MULTIPLE_CHOICE: 'Hộp kiểm (Nhiều đáp án)',
      SHORT_TEXT: 'Trả lời ngắn',
      PARAGRAPH: 'Đoạn văn tự luận',
      OPEN_TEXT: 'Đoạn văn tự luận',
      DROPDOWN: 'Menu thả xuống',
      LINEAR_SCALE: 'Phạm vi tuyến tính',
      LIKERT_SCALE: 'Thang đo Likert',
      CHOICE_GRID: 'Lưới trắc nghiệm (Ma trận)',
      CHECKBOX_GRID: 'Lưới hộp kiểm (Ma trận)',
      FILE_UPLOAD: 'Tải tệp lên',
      DATE_INPUT: 'Chọn ngày tháng',
      DATE: 'Chọn ngày tháng',
      TIME_INPUT: 'Chọn giờ phút',
      TIME: 'Chọn giờ phút',
      RATING_STARS: 'Đánh giá xếp hạng',
      RATING: 'Đánh giá sao'
    };

    const totalQ = session.questions.length;
    let curIdx = session.currentIndex || 0;
    if (curIdx >= totalQ) {
      curIdx = Math.max(0, totalQ - 1);
      session.currentIndex = curIdx;
    }
    const q = session.questions[curIdx];
    const progressPct = totalQ > 0 ? Math.round(((curIdx + 1) / totalQ) * 100) : 100;
    const isLast = curIdx === totalQ - 1;
    const isReq = q.is_required !== 0 && q.is_required !== false;
    const canGoPrev = (session.history && session.history.length > 0) || curIdx > 0;

    // Tính toán phân đoạn hiện tại (nếu form có SECTION_HEADER)
    const currentSectionNum = (session.questions.slice(0, curIdx + 1).filter(item => item.type === 'SECTION_HEADER').length) + 1;
    const totalSections = Math.max(1, session.questions.filter(item => item.type === 'SECTION_HEADER').length + 1);
    const progressText = totalSections > 1
      ? `Mục ${currentSectionNum} / ${totalSections} • Câu #${curIdx + 1}`
      : `Câu ${curIdx + 1} / ${totalQ} (${progressPct}%)`;
    const progressPctVal = totalSections > 1
      ? Math.min(100, Math.round((currentSectionNum / totalSections) * 100))
      : progressPct;

    // Timer display
    const sec = session.durationSec || 0;
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    const initialTimeStr = `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;

    if (!session.timerId) {
      session.timerId = setInterval(() => {
        if (this.state.activeSession) {
          this.state.activeSession.durationSec = (this.state.activeSession.durationSec || 0) + 1;
          this._saveActiveSessionToStorage();
          const timerEl = document.getElementById('session-timer-text');
          if (timerEl) {
            const s = this.state.activeSession.durationSec;
            const m = Math.floor(s / 60);
            const r = s % 60;
            timerEl.textContent = `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
          }
        }
      }, 1000);
    }

    let restrictionBadgeHtml = '';
    if (['SHORT_TEXT', 'PARAGRAPH', 'OPEN_TEXT'].includes(q.type)) {
      let valObj = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
      const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
      if ((!valObj || !valObj.type || valObj.type === 'NONE') && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
        const inf = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
        if (inf) {
          valObj = inf;
          q.validation = inf;
        }
      }
      if (valObj && valObj.type && valObj.type !== 'NONE') {
        let badgeText = '';
        const vType = String(valObj.type).toUpperCase();
        if (vType === 'EMAIL') {
          badgeText = 'Email';
        } else if (vType === 'NUMBER') {
          const hasMin = valObj.min !== undefined && valObj.min !== null && String(valObj.min).trim() !== '';
          const hasMax = valObj.max !== undefined && valObj.max !== null && String(valObj.max).trim() !== '';
          let vRule = String(valObj.rule || '').toUpperCase();
          if (!vRule) vRule = (hasMin && hasMax) ? 'BETWEEN' : 'IS_NUMBER';
          if (vRule === 'BETWEEN' && hasMin && hasMax) {
            badgeText = `Số: ${valObj.min} ~ ${valObj.max}`;
          } else if (vRule === 'GREATER_THAN' && hasMin) {
            badgeText = `Số > ${valObj.min}`;
          } else if (vRule === 'LESS_THAN' && hasMax) {
            badgeText = `Số < ${valObj.max}`;
          } else {
            badgeText = 'Số';
          }
        } else if (vType === 'URL') {
          badgeText = 'URL';
        } else if (vType === 'LENGTH') {
          const vRule = String(valObj.rule || 'MAX_LENGTH').toUpperCase();
          const bLen = valObj.min || valObj.max || 100;
          badgeText = vRule === 'MIN_LENGTH' ? `Ký tự ≥ ${bLen}` : `Ký tự ≤ ${bLen}`;
        }
        if (badgeText) {
          restrictionBadgeHtml = `
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60 select-none">
              ${badgeText}
            </span>
          `;
        }
      }
    }

    root.innerHTML = `
      <div class="stepper-focus-box space-y-6 py-4 max-w-3xl mx-auto">
        
        <!-- Header Controls: Thoát Khảo Sát, Bộ Đếm Thời Gian, Tiến Trình Từng Câu (Chống Bot & Làm Bừa) -->
        <div class="flex items-center justify-between text-xs text-stone-500 pb-3 border-b border-stone-200 dark:border-stone-800">
          <button type="button" onclick="VibeApp.confirmExitSurvey()" class="hover:text-orange-600 flex items-center gap-1 font-bold transition-colors cursor-pointer">
            <i data-lucide="x" class="w-4 h-4 stroke-[2.2]"></i>
            <span>Thoát Khảo Sát</span>
          </button>
          
          <div class="flex items-center space-x-3">
            <span class="font-mono text-stone-700 dark:text-stone-300 font-bold" id="session-timer-text">${initialTimeStr}</span>
            <span class="text-stone-300 dark:text-stone-700">|</span>
            <span class="font-extrabold text-orange-600 dark:text-orange-400">${progressText}</span>
          </div>
        </div>

        ${session.isEditing ? `
          <div class="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl text-xs text-orange-800 dark:text-orange-300 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <i data-lucide="edit-3" class="w-4 h-4 text-orange-600 shrink-0"></i>
              <span><strong>Chế độ chỉnh sửa:</strong> Bạn đang cập nhật câu trả lời đã nộp.</span>
            </div>
            <button onclick="VibeApp.navigate('review-survey', { surveyId: '${surveyId}' })" class="text-[11px] underline font-bold hover:text-orange-900 cursor-pointer">
              Hủy sửa & Xem bài cũ
            </button>
          </div>
        ` : ''}

        <!-- Top Progress Line -->
        <div class="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
          <div class="bg-orange-600 h-full rounded-full transition-all duration-300" style="width: ${progressPctVal}%"></div>
        </div>

        ${q.type === 'SECTION_HEADER' ? `
          <!-- Thẻ Chuyển Phân Đoạn (Section Break Card) -->
          <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
            <div class="h-2.5 bg-orange-600 w-full"></div>
            <div class="p-6 sm:p-9 space-y-4">
              <div class="flex items-center justify-between">
                <span class="px-3 py-1 rounded-full bg-orange-50 dark:bg-stone-800 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-stone-700 text-[11px] font-extrabold font-mono uppercase tracking-wider">
                  Mục ${currentSectionNum} trên ${totalSections}
                </span>
                <span class="text-xs text-stone-400 font-mono font-bold">BƯỚC #${curIdx + 1}</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                ${this.escapeHtml(q.content || 'Mục khảo sát')}
              </h2>
              ${q.rows && q.rows[0] ? `
                <p class="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line pt-0.5">
                  ${this.escapeHtml(q.rows[0])}
                </p>
              ` : ''}
              <div class="pt-3 text-[11px] text-stone-400 flex items-center gap-1.5">
                <i data-lucide="info" class="w-3.5 h-3.5 text-orange-600"></i>
                <span>Nhấn "Bắt đầu mục này" hoặc nhấn Enter ↵ để làm tiếp các câu hỏi.</span>
              </div>
            </div>
          </div>
        ` : (q.type === 'VIDEO_BLOCK' ? `
          <!-- Khối Video Minh Họa -->
          <div id="question-card-${q.id}" class="bento-card p-6 sm:p-9 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-sm">
            ${this.renderQuestionOptions(q, null)}
          </div>
        ` : (q.type === 'TEXT_BLOCK' ? `
          <!-- Khối Tiêu Đề / Mô Tả Minh Họa -->
          <div id="question-card-${q.id}" class="bento-card p-6 sm:p-9 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-sm space-y-3">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">${this.escapeHtml(q.content)}</h3>
            ${q.rows && q.rows[0] ? `<p class="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">${this.escapeHtml(q.rows[0])}</p>` : ''}
          </div>
        ` : `
          <!-- Bento Card Câu Hỏi Đơn Lẻ (Làm Từng Câu 1 - Chống Gian Lận, Speed Trap & Attention Check Chuẩn Tuyệt Đối) -->
          <div id="question-card-${q.id}" class="bento-card p-6 sm:p-9 space-y-6 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-sm transition-all">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 dark:bg-stone-800 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-stone-700">
                    ${typeLabels[q.type] || 'Khảo sát'}
                  </span>
                  ${restrictionBadgeHtml}
                  ${isReq ? `
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/40">
                      * Bắt buộc
                    </span>
                  ` : `
                    <span class="text-[10px] text-stone-400 font-medium">(Tùy chọn)</span>
                  `}
                </div>
                <span class="text-xs text-stone-400 font-mono font-bold">CÂU #${curIdx + 1}</span>
              </div>

              <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                <span>${this.escapeHtml(q.content)}</span>
                ${isReq ? '<span class="text-orange-500 ml-1 font-bold">*</span>' : ''}
              </h2>

              ${q.image_url ? `
                <div class="my-3 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 max-w-lg">
                  <img src="${q.image_url}" alt="Ảnh câu hỏi" class="w-full max-h-64 object-contain bg-stone-50 dark:bg-stone-900" onerror="this.style.display='none'">
                </div>
              ` : ''}

              ${['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(q.type) ? `
                <p class="text-[11px] text-stone-400 mt-1.5 font-medium">Gợi ý phím tắt: Bấm các phím số [1], [2], [3]... trên bàn phím để chọn nhanh.</p>
              ` : ''}
            </div>

            <!-- Options / Input Container -->
            <div class="space-y-3 pt-1">
              ${this.renderQuestionOptions(q, session.answers ? session.answers[q.id] : undefined)}
            </div>

            <!-- Thẻ báo lỗi nội dòng nếu có -->
            <div id="val-err-${q.id}" class="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-2 hidden flex items-center gap-1"></div>
          </div>
        `))}

        <!-- Bottom Navigation Controls (Làm Từng Câu 1: Câu Trước & Câu Tiếp Theo / Nộp Bài) -->
        <div class="pt-3 flex items-center justify-between gap-3">
          <button type="button" onclick="VibeApp.prevQuestion()" 
                  ${canGoPrev ? '' : 'disabled'}
                  class="px-5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5 stroke-[2.2]"></i>
            <span>Câu trước</span>
          </button>

          ${isLast ? `
            <button type="button" id="stepper-next-btn" onclick="VibeApp.submitSurvey()" 
                    class="px-7 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer">
              <i data-lucide="check" class="w-4 h-4 stroke-[2.5]"></i>
              <span>${session.isEditing ? 'Cập nhật câu trả lời' : 'Nộp bài & Nhận thưởng'}</span>
              <span class="text-[10px] opacity-75 font-normal ml-1">(Enter ↵)</span>
            </button>
          ` : `
            <button type="button" id="stepper-next-btn" onclick="VibeApp.nextQuestion()" 
                    class="px-7 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer">
              <span>${q.type === 'SECTION_HEADER' ? 'Bắt đầu mục này' : 'Câu tiếp theo'}</span>
              <span class="text-[10px] opacity-75 font-normal ml-1">(Enter ↵)</span>
              <i data-lucide="arrow-right" class="w-4 h-4 stroke-[2.2]"></i>
            </button>
          `}
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderQuestionOptions(q, currentAnswer) {
    // 0. KHỐI VIDEO MINH HỌA (YouTube)
    if (q.type === 'VIDEO_BLOCK') {
      const ytEmbed = this.getYouTubeEmbedUrl(q.video_url || '');
      return `
        <div class="space-y-3">
          ${ytEmbed ? `
            <div class="aspect-video w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-black shadow-md">
              <iframe class="w-full h-full" src="${ytEmbed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          ` : `
            <div class="p-8 text-center bg-stone-50 dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-stone-400 text-xs">
              Chưa có liên kết video
            </div>
          `}
          <p class="text-xs text-stone-500 italic text-center">Vui lòng xem video phía trên trước khi bấm tiếp tục.</p>
        </div>
      `;
    }

    // 0b. KHỐI PHÂN ĐOẠN BIỂU MẪU (SECTION_HEADER)
    if (q.type === 'SECTION_HEADER') {
      return '';
    }

    // 0c. KHỐI TIÊU ĐỀ & MÔ TẢ (TEXT_BLOCK)
    if (q.type === 'TEXT_BLOCK') {
      return `
        <div class="p-5 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
          ${q.rows && q.rows[0] ? `<p class="text-xs text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">${q.rows[0]}</p>` : ''}
        </div>
      `;
    }

    // 1. TRẮC NGHIỆM ĐƠN (SINGLE_CHOICE)
    if (q.type === 'SINGLE_CHOICE') {
      const opts = q.options || [];
      return opts.map((opt, idx) => {
        const isSelected = currentAnswer === opt;
        return `
          <div onclick="VibeApp.selectSingleOption('${q.id}', '${encodeURIComponent(opt)}')" 
               class="stepper-choice-btn cursor-pointer mb-2.5 ${isSelected ? 'selected' : ''}">
            <div class="flex items-center space-x-3">
              <div class="w-5 h-5 rounded-full border-2 ${isSelected ? 'border-orange-600 bg-orange-600' : 'border-stone-300 dark:border-stone-600'} flex items-center justify-center text-white transition-colors">
                ${isSelected ? '<i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>' : ''}
              </div>
              <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">${this.escapeHtml(opt)}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. HỘP KIỂM (MULTIPLE_CHOICE)
    if (q.type === 'MULTIPLE_CHOICE') {
      const opts = q.options || [];
      const selectedList = Array.isArray(currentAnswer) ? currentAnswer : [];
      return opts.map((opt, idx) => {
        const isChecked = selectedList.includes(opt);
        return `
          <div onclick="VibeApp.toggleMultipleOption('${q.id}', '${encodeURIComponent(opt)}')" 
               class="stepper-choice-btn cursor-pointer mb-2.5 ${isChecked ? 'selected' : ''}">
            <div class="flex items-center space-x-3">
              <div class="w-5 h-5 rounded-md border-2 ${isChecked ? 'border-orange-600 bg-orange-600' : 'border-stone-300 dark:border-stone-600'} flex items-center justify-center text-white transition-colors">
                ${isChecked ? '<i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>' : ''}
              </div>
              <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">${this.escapeHtml(opt)}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. TRẢ LỜI NGẮN (SHORT_TEXT)
    if (q.type === 'SHORT_TEXT') {
      const textVal = currentAnswer || '';
      let validation = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
      const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
      if ((!validation || !validation.type || validation.type === 'NONE') && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
        const inferred = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
        if (inferred) {
          validation = inferred;
          q.validation = inferred;
        }
      }

      let placeholder = 'Nhập câu trả lời của bạn';
      if (validation && validation.type && validation.type !== 'NONE') {
        placeholder = this.generateValidationPlaceholder(validation) || (engine && engine.getMeta(validation)?.placeholder) || validation.placeholder || 'Nhập câu trả lời của bạn';
      }

      const isNum = validation && String(validation.type).toUpperCase() === 'NUMBER';

      return `
        <div class="space-y-2">
          <!-- oninput="VibeApp.updateOpenText('${q.id}', this.value)" -->
          <input type="text" 
                 ${isNum ? 'inputmode="numeric"' : ''}
                 value="${(textVal).replace(/"/g, '&quot;')}" 
                 id="survey-answer-input-${q.id}"
                 oninput="VibeApp.handleSurveyInputRealtime('${q.id}', this)"
                 onblur="VibeApp.handleSurveyInputRealtime('${q.id}', this)"
                 onchange="VibeApp.updateOpenText('${q.id}', this.value)"
                 placeholder="${placeholder.replace(/"/g, '&quot;')}"
                 class="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors">
          <div id="val-err-${q.id}" class="hidden text-xs text-orange-500 flex items-center gap-1.5 mt-1.5 font-medium"></div>
        </div>
      `;
    }

    // 4. ĐOẠN VĂN (PARAGRAPH / OPEN_TEXT)
    if (['PARAGRAPH', 'OPEN_TEXT'].includes(q.type)) {
      const textVal = currentAnswer || '';
      let validation = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
      const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
      if ((!validation || !validation.type || validation.type === 'NONE') && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
        const inferred = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
        if (inferred) {
          validation = inferred;
          q.validation = inferred;
        }
      }

      let placeholder = 'Nhập câu trả lời của bạn';
      if (validation && validation.type && validation.type !== 'NONE') {
        placeholder = this.generateValidationPlaceholder(validation) || (engine && engine.getMeta(validation)?.placeholder) || validation.placeholder || 'Nhập câu trả lời của bạn';
      }

      return `
        <div class="space-y-2">
          <textarea id="survey-answer-input-${q.id}"
                    oninput="VibeApp.handleSurveyInputRealtime('${q.id}', this)" 
                    onblur="VibeApp.handleSurveyInputRealtime('${q.id}', this)"
                    onchange="VibeApp.updateOpenText('${q.id}', this.value)" 
                    rows="4"
                    placeholder="${placeholder.replace(/"/g, '&quot;')}"
                    class="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium leading-relaxed transition-colors">${textVal}</textarea>
          <div id="val-err-${q.id}" class="hidden text-xs text-orange-500 flex items-center gap-1.5 mt-1.5 font-medium"></div>
        </div>
      `;
    }

    // 5. MENU THẢ XUỐNG (DROPDOWN) - Chuẩn Bento Custom Dropdown Popover theo DESIGN.md Mục 5.3
    if (q.type === 'DROPDOWN') {
      const opts = q.options || [];
      const hasAnswer = currentAnswer && opts.includes(currentAnswer);
      const displayLabel = hasAnswer ? currentAnswer : 'Chọn câu trả lời của bạn';
      const ddMenuId = `dropdown-q-${q.id}-menu`;
      const ddLabelId = `dropdown-q-${q.id}-label`;
      const ddIconId = `dropdown-q-${q.id}-icon`;

      return `
        <div class="space-y-2">
          <div class="relative">
            <button type="button" 
                    id="dropdown-q-${q.id}-btn"
                    onclick="VibeApp.toggleCustomDropdown('${ddMenuId}', '${ddIconId}', event)"
                    class="custom-dropdown-trigger w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs sm:text-sm font-bold text-left flex items-center justify-between text-slate-900 dark:text-white hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs cursor-pointer">
              <span id="${ddLabelId}" class="truncate ${hasAnswer ? 'text-slate-900 dark:text-white font-bold' : 'text-stone-400 font-medium'}">${this.escapeHtml(displayLabel)}</span>
              <i data-lucide="chevron-down" id="${ddIconId}" class="custom-dropdown-icon w-4 h-4 text-stone-400 shrink-0 ml-2 transition-transform duration-200 pointer-events-none"></i>
            </button>
            <div id="${ddMenuId}" class="custom-dropdown-menu hidden absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-2xl shadow-2xl p-2 space-y-1 max-h-[260px] overflow-y-auto scrollbar-thin">
              ${opts.map(opt => {
                const isSelected = currentAnswer === opt;
                const safeOpt = (opt || '').replace(/"/g, '&quot;');
                const encOpt = encodeURIComponent(opt || '');
                return `
                  <button type="button" 
                          onclick="VibeApp.selectSingleOption('${q.id}', '${encOpt}'); const lbl = document.getElementById('${ddLabelId}'); if (lbl) { lbl.textContent = '${safeOpt}'; lbl.className = 'truncate text-slate-900 dark:text-white font-bold'; } VibeApp.closeAllCustomDropdowns();"
                          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left ${isSelected ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                    <span class="truncate">${this.escapeHtml(opt)}</span>
                    ${isSelected ? '<i data-lucide="check" class="w-4 h-4 text-orange-600 shrink-0 ml-2"></i>' : ''}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
          <p class="text-[11px] text-stone-400">Chọn 1 tùy chọn phù hợp từ danh sách</p>
        </div>
      `;
    }

    // 6. PHẠM VI TUYẾN TÍNH (LINEAR_SCALE / LIKERT_SCALE - Chuẩn Google Forms)
    if (['LINEAR_SCALE', 'LIKERT_SCALE'].includes(q.type)) {
      const opts = (Array.isArray(q.options) && q.options.length > 0) ? q.options : ['1', '2', '3', '4', '5'];
      const minLabel = q.min_label || '';
      const maxLabel = q.max_label || '';
      const isLongScale = opts.length > 5;
      const minOpt = opts[0];
      const maxOpt = opts[opts.length - 1];

      return `
        <div class="space-y-3">
          <div class="grid ${isLongScale ? 'grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2' : 'grid-cols-5 gap-2 sm:gap-3'}">
            ${opts.map((opt) => {
              const isSelected = String(currentAnswer) === String(opt);
              return `
                <button type="button" onclick="VibeApp.selectSingleOption('${q.id}', '${encodeURIComponent(opt)}')"
                        class="likert-clean-btn ${isLongScale ? 'py-2 px-1 rounded-xl' : ''} ${isSelected ? 'selected' : ''}">
                  <div class="${isLongScale ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-bold font-mono">${opt}</div>
                  ${!isLongScale && isNaN(opt) ? `<div class="text-[10px] leading-tight mt-0.5">${opt}</div>` : ''}
                </button>
              `;
            }).join('')}
          </div>
          ${(minLabel || maxLabel) ? `
            <div class="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 px-1 pt-1 font-medium">
              <span>${minLabel ? `${minOpt}: ${minLabel}` : ''}</span>
              <span>${maxLabel ? `${maxOpt}: ${maxLabel}` : ''}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 7. LƯỚI TRẮC NGHIỆM (CHOICE_GRID - 1 LỰA CHỌN MỖI HÀNG)
    if (q.type === 'CHOICE_GRID') {
      const rows = q.rows || ['Tiêu chí 1', 'Tiêu chí 2', 'Tiêu chí 3'];
      const columns = q.columns || ['Kém', 'Bình thường', 'Tốt', 'Rất tốt'];
      const currentGridAns = (currentAnswer && typeof currentAnswer === 'object') ? currentAnswer : {};

      return `
        <div class="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 shadow-xs">
          <table class="w-full text-left text-xs">
            <thead class="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th class="py-3 px-4 font-extrabold text-stone-700 dark:text-stone-300">Tiêu chí</th>
                ${columns.map(c => `
                  <th class="py-3 px-3 text-center font-bold text-stone-600 dark:text-stone-400 whitespace-nowrap">${c}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
              ${rows.map(r => {
                const selectedCol = currentGridAns[r];
                return `
                  <tr class="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                    <td class="py-3.5 px-4 font-semibold text-stone-900 dark:text-stone-100">${r}</td>
                    ${columns.map(c => {
                      const isSelected = selectedCol === c;
                      return `
                        <td class="py-3 px-3 text-center">
                          <button type="button" onclick="VibeApp.selectChoiceGridCell('${q.id}', '${encodeURIComponent(r)}', '${encodeURIComponent(c)}')"
                                  class="w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${isSelected
                                    ? 'border-orange-600 bg-orange-600 text-white shadow-xs'
                                    : 'border-stone-300 dark:border-stone-600 hover:border-orange-400 bg-white dark:bg-stone-800'
                                  }">
                            ${isSelected ? '<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                          </button>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 8. LƯỚI HỘP KIỂM (CHECKBOX_GRID - NHIỀU LỰA CHỌN MỖI HÀNG)
    if (q.type === 'CHECKBOX_GRID') {
      const rows = q.rows || ['Tiêu chí 1', 'Tiêu chí 2', 'Tiêu chí 3'];
      const columns = q.columns || ['Kém', 'Bình thường', 'Tốt', 'Rất tốt'];
      const currentGridAns = (currentAnswer && typeof currentAnswer === 'object') ? currentAnswer : {};

      return `
        <div class="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 shadow-xs">
          <table class="w-full text-left text-xs">
            <thead class="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th class="py-3 px-4 font-extrabold text-stone-700 dark:text-stone-300">Tiêu chí</th>
                ${columns.map(c => `
                  <th class="py-3 px-3 text-center font-bold text-stone-600 dark:text-stone-400 whitespace-nowrap">${c}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
              ${rows.map(r => {
                const selectedCols = Array.isArray(currentGridAns[r]) ? currentGridAns[r] : [];
                return `
                  <tr class="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                    <td class="py-3.5 px-4 font-semibold text-stone-900 dark:text-stone-100">${r}</td>
                    ${columns.map(c => {
                      const isChecked = selectedCols.includes(c);
                      return `
                        <td class="py-3 px-3 text-center">
                          <button type="button" onclick="VibeApp.toggleCheckboxGridCell('${q.id}', '${encodeURIComponent(r)}', '${encodeURIComponent(c)}')"
                                  class="w-6 h-6 rounded-md border-2 mx-auto flex items-center justify-center transition-all ${isChecked
                                    ? 'border-orange-600 bg-orange-600 text-white shadow-xs'
                                    : 'border-stone-300 dark:border-stone-600 hover:border-orange-400 bg-white dark:bg-stone-800'
                                  }">
                            ${isChecked ? '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                          </button>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 9. TẢI TỆP LÊN (FILE_UPLOAD)
    if (q.type === 'FILE_UPLOAD') {
      const fileName = currentAnswer || '';
      return `
        <div class="p-6 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-900/60 text-center space-y-3">
          <i data-lucide="upload-cloud" class="w-8 h-8 text-orange-600 mx-auto"></i>
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">Chọn hoặc kéo thả tệp tải lên</div>
            <p class="text-[11px] text-stone-400 mt-0.5">PNG, JPG, PDF (Tối đa 5MB)</p>
          </div>
          <input type="file" id="file-input-${q.id}" onchange="VibeApp.handleFileUploadChange('${q.id}', this)" class="hidden">
          <div>
            <button type="button" onclick="document.getElementById('file-input-${q.id}').click()" class="py-2 px-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:border-orange-500 shadow-xs">
              ${fileName ? 'Thay đổi tệp đã chọn' : 'Chọn tệp từ thiết bị'}
            </button>
          </div>
          ${fileName ? `
            <div class="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1.5 pt-1">
              <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
              <span>Đã chọn tệp: ${fileName}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 10. NGÀY THÁNG (DATE_INPUT / DATE)
    if (['DATE_INPUT', 'DATE'].includes(q.type)) {
      const dateVal = currentAnswer || '';
      return `
        <div class="space-y-2">
          <input type="date" value="${dateVal}" onchange="VibeApp.selectSingleOption('${q.id}', encodeURIComponent(this.value))" 
                 class="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <p class="text-[11px] text-stone-400">Chọn ngày / tháng / năm</p>
        </div>
      `;
    }

    // 11. GIỜ PHÚT (TIME_INPUT / TIME)
    if (['TIME_INPUT', 'TIME'].includes(q.type)) {
      const timeVal = currentAnswer || '';
      return `
        <div class="space-y-2">
          <input type="time" value="${timeVal}" onchange="VibeApp.selectSingleOption('${q.id}', encodeURIComponent(this.value))" 
                 class="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <p class="text-[11px] text-stone-400">Chọn giờ và phút</p>
        </div>
      `;
    }

    // 12. ĐÁNH GIÁ SAO (RATING_STARS / RATING)
    if (['RATING_STARS', 'RATING'].includes(q.type)) {
      const stars = [1, 2, 3, 4, 5];
      const curRating = parseInt(currentAnswer, 10) || 0;
      return `
        <div class="py-4 text-center space-y-3">
          <div class="flex items-center justify-center gap-3">
            ${stars.map(star => {
              const isFilled = star <= curRating;
              return `
                <button type="button" onclick="VibeApp.selectSingleOption('${q.id}', '${star}')" 
                        class="p-2 sm:p-3 rounded-2xl transition-all transform active:scale-90 ${isFilled ? 'text-orange-400 scale-110' : 'text-stone-300 dark:text-stone-600 hover:text-orange-300'}">
                  <i data-lucide="star" class="w-8 h-8 sm:w-10 sm:h-10 ${isFilled ? 'fill-orange-400 stroke-orange-400' : 'stroke-[1.8]'}"></i>
                  <div class="text-[11px] font-bold font-mono mt-1 text-stone-600 dark:text-stone-400">${star} Sao</div>
                </button>
              `;
            }).join('')}
          </div>
          ${curRating > 0 ? `
            <div class="text-xs font-bold text-orange-500">Bạn đã đánh giá: ${curRating} / 5 Sao</div>
          ` : `
            <div class="text-xs text-stone-400">Nhấp chọn sao để đánh giá</div>
          `}
        </div>
      `;
    }

    return '';
  },

  selectSingleOption(qId, encodedOpt) {
    this.haptic('light');
    if (!this.state.activeSession) return;
    if (!this.state.activeSession.answers) this.state.activeSession.answers = {};
    const opt = decodeURIComponent(encodedOpt);
    this.state.activeSession.answers[qId] = opt;
    this._saveActiveSessionToStorage();

    // Tự động xóa trạng thái viền đỏ lỗi khi người dùng đã chọn đáp án
    const errEl = document.getElementById(`val-err-${qId}`);
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    const cardEl = document.getElementById(`question-card-${qId}`);
    if (cardEl) {
      cardEl.classList.remove('ring-1', 'ring-orange-500');
    }

    const prevScrollY = window.scrollY;
    this.renderTakeSurveyView(document.getElementById('app-root'), this.state.activeSession.surveyId);
    window.scrollTo({ top: prevScrollY, behavior: 'instant' });
  },

  toggleMultipleOption(qId, encodedOpt) {
    this.haptic('light');
    if (!this.state.activeSession) return;
    if (!this.state.activeSession.answers) this.state.activeSession.answers = {};
    const opt = decodeURIComponent(encodedOpt);
    if (!Array.isArray(this.state.activeSession.answers[qId])) {
      this.state.activeSession.answers[qId] = [];
    }
    const arr = this.state.activeSession.answers[qId];
    const idx = arr.indexOf(opt);
    if (idx !== -1) {
      arr.splice(idx, 1);
    } else {
      arr.push(opt);
    }
    this._saveActiveSessionToStorage();

    const errEl = document.getElementById(`val-err-${qId}`);
    if (errEl && arr.length > 0) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    const cardEl = document.getElementById(`question-card-${qId}`);
    if (cardEl && arr.length > 0) {
      cardEl.classList.remove('ring-1', 'ring-orange-500');
    }

    const prevScrollY = window.scrollY;
    this.renderTakeSurveyView(document.getElementById('app-root'), this.state.activeSession.surveyId);
    window.scrollTo({ top: prevScrollY, behavior: 'instant' });
  },

  selectChoiceGridCell(qId, encodedRow, encodedCol) {
    this.haptic('light');
    const r = decodeURIComponent(encodedRow);
    const c = decodeURIComponent(encodedCol);
    if (!this.state.activeSession.answers[qId] || typeof this.state.activeSession.answers[qId] !== 'object') {
      this.state.activeSession.answers[qId] = {};
    }
    this.state.activeSession.answers[qId][r] = c;
    this._saveActiveSessionToStorage();

    const errEl = document.getElementById(`val-err-${qId}`);
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    const cardEl = document.getElementById(`question-card-${qId}`);
    if (cardEl) {
      cardEl.classList.remove('ring-1', 'ring-orange-500');
    }

    const prevScrollY = window.scrollY;
    this.renderTakeSurveyView(document.getElementById('app-root'), this.state.activeSession.surveyId);
    window.scrollTo({ top: prevScrollY, behavior: 'instant' });
  },

  toggleCheckboxGridCell(qId, encodedRow, encodedCol) {
    this.haptic('light');
    const r = decodeURIComponent(encodedRow);
    const c = decodeURIComponent(encodedCol);
    if (!this.state.activeSession.answers[qId] || typeof this.state.activeSession.answers[qId] !== 'object') {
      this.state.activeSession.answers[qId] = {};
    }
    const curList = Array.isArray(this.state.activeSession.answers[qId][r]) ? [...this.state.activeSession.answers[qId][r]] : [];
    const idx = curList.indexOf(c);
    if (idx > -1) curList.splice(idx, 1);
    else curList.push(c);
    this.state.activeSession.answers[qId][r] = curList;
    this._saveActiveSessionToStorage();

    const errEl = document.getElementById(`val-err-${qId}`);
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    const cardEl = document.getElementById(`question-card-${qId}`);
    if (cardEl) {
      cardEl.classList.remove('ring-1', 'ring-orange-500');
    }

    const prevScrollY = window.scrollY;
    this.renderTakeSurveyView(document.getElementById('app-root'), this.state.activeSession.surveyId);
    window.scrollTo({ top: prevScrollY, behavior: 'instant' });
  },

  updateOpenText(qId, val) {
    if (!this.state.activeSession) return;
    if (!this.state.activeSession.answers) this.state.activeSession.answers = {};
    this.state.activeSession.answers[qId] = typeof val === 'string' ? val : (val ? String(val) : '');
    this._saveActiveSessionToStorage();
  },

  handleFileUploadChange(qId, inputEl) {
    if (inputEl.files && inputEl.files[0]) {
      const file = inputEl.files[0];
      this.state.activeSession.answers[qId] = file.name;
      this._saveActiveSessionToStorage();
      this.renderTakeSurveyView(document.getElementById('app-root'), this.state.activeSession.surveyId);
      this.showToast(`Đã đính kèm tệp: ${file.name}`, 'success');
    }
  },

  // Hàm kiểm tra tính hợp lệ toàn diện của Section hiện tại (Kiểm tra bắt buộc + Ràng buộc định dạng)
  // ==================== XÁC THỰC ĐỊNH DẠNG RÀNG BUỘC (RESTRICTION VALIDATION) ====================
  validateQuestionInput(q, val) {
    if (!q) return { valid: true };
    let validation = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
    const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (this.RestrictionEngine || (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null));
    if (['SHORT_TEXT', 'PARAGRAPH', 'OPEN_TEXT'].includes(q.type) && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
      if (!validation || !validation.type || validation.type === 'NONE') {
        const inferred = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
        if (inferred) {
          validation = inferred;
          q.validation = inferred;
        }
      }
    }
    if (!validation || !engine) return { valid: true };
    const meta = engine.getMeta(validation);
    if (meta && typeof meta.validate === 'function') {
      return meta.validate(val);
    }
    return { valid: true };
  },

  handleSurveyInputRealtime(qId, inputEl) {
    if (!inputEl) return;
    const session = this.state && this.state.activeSession;
    if (!session || !session.questions) return;
    const q = session.questions.find(item => String(item.id) === String(qId));
    if (!q) return;

    const val = inputEl.value;
    if (!session.answers) session.answers = {};
    session.answers[qId] = val;
    this._saveActiveSessionToStorage();

    const res = this.validateQuestionInput(q, val);
    const errEl = document.getElementById(`val-err-${qId}`) || document.getElementById(`survey-error-${qId}`);

    if (!res.valid && val && String(val).trim() !== '') {
      inputEl.classList.add('border-orange-500', 'focus:border-orange-500', 'focus:ring-orange-500/20');
      inputEl.classList.remove('border-stone-200', 'dark:border-stone-700', 'focus:border-orange-500');
      if (errEl) {
        errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${res.error || 'Giá trị không đúng định dạng'}</span>`;
        errEl.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons({ root: errEl });
      }
    } else {
      inputEl.classList.remove('border-orange-500', 'focus:border-orange-500', 'focus:ring-orange-500/20');
      inputEl.classList.add('border-stone-200', 'dark:border-stone-700', 'focus:border-orange-500');
      if (errEl) {
        errEl.textContent = '';
        errEl.classList.add('hidden');
      }
    }
  },

  validateCurrentSection(curSection) {
    if (!curSection) return true;
    const session = this.state && this.state.activeSession ? this.state.activeSession : {};
    const answers = session.answers || {};

    // 1. Tự động đồng bộ các ô input/textarea từ DOM vào answers nếu đang ở trên trình duyệt
    if (typeof document !== 'undefined') {
      const activeInputs = document.querySelectorAll('#app-root input[type="text"], #app-root textarea, #app-root input[type="number"], #app-root input[type="date"], #app-root input[type="time"]');
      activeInputs.forEach(inp => {
        const match = inp.id && inp.id.match(/^survey-answer-input-(.+)$/);
        if (match && match[1]) {
          const qId = match[1];
          if (!session.answers) session.answers = {};
          session.answers[qId] = inp.value;
        }
      });
      if (typeof this._saveActiveSessionToStorage === 'function') {
        this._saveActiveSessionToStorage();
      }
    }

    let firstError = null;
    const questions = curSection.questions || [];

    for (const q of questions) {
      if (['VIDEO_BLOCK', 'SECTION_HEADER', 'TEXT_BLOCK'].includes(q.type)) {
        continue;
      }

      const ans = answers[q.id];
      const isReq = q.is_required !== 0 && q.is_required !== false;
      let errorMsg = '';

      // a. Kiểm tra câu hỏi bắt buộc
      if (isReq) {
        if (q.type === 'CHOICE_GRID') {
          const rows = q.rows || [];
          const ansObj = (ans && typeof ans === 'object') ? ans : {};
          const unselectedRows = rows.filter(r => !ansObj[r]);
          if (unselectedRows.length > 0) {
            errorMsg = `Vui lòng chọn phản hồi cho tất cả các hàng trong bảng ma trận (${unselectedRows.length} hàng còn trống)!`;
          }
        } else if (q.type === 'CHECKBOX_GRID') {
          const rows = q.rows || [];
          const ansObj = (ans && typeof ans === 'object') ? ans : {};
          const unselectedRows = rows.filter(r => !ansObj[r] || !Array.isArray(ansObj[r]) || ansObj[r].length === 0);
          if (unselectedRows.length > 0) {
            errorMsg = 'Vui lòng chọn ít nhất 1 ô cho mỗi hàng trong bảng ma trận!';
          }
        } else if (q.type === 'MULTIPLE_CHOICE') {
          if (!Array.isArray(ans) || ans.length === 0) {
            errorMsg = 'Vui lòng chọn ít nhất một lựa chọn!';
          }
        } else {
          if (ans === undefined || ans === null || String(ans).trim() === '') {
            errorMsg = 'Vui lòng trả lời câu hỏi bắt buộc này!';
          }
        }
      }

      // b. Kiểm tra ràng buộc định dạng (RestrictionEngine / Validation)
      if (!errorMsg && (ans !== undefined && ans !== null && String(ans).trim() !== '')) {
        const res = this.validateQuestionInput(q, ans);
        if (res && (res.valid === false || typeof res === 'string')) {
          errorMsg = typeof res === 'string' ? res : (res.error || 'Dữ liệu nhập không hợp lệ');
        }
      }

      // c. Đánh dấu giao diện lỗi hoặc gỡ bỏ (khi có DOM)
      if (typeof document !== 'undefined') {
        const errEl = document.getElementById(`val-err-${q.id}`);
        const cardEl = document.getElementById(`question-card-${q.id}`);
        const inputEl = document.getElementById(`survey-answer-input-${q.id}`);

        if (errorMsg) {
          if (cardEl) cardEl.classList.add('ring-1', 'ring-orange-500');
          if (inputEl) {
            inputEl.classList.add('border-orange-500', 'bg-orange-50/20', 'text-orange-900', 'dark:text-orange-200');
            inputEl.classList.remove('border-stone-200', 'dark:border-stone-700');
          }
          if (errEl) {
            errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${this.escapeHtml ? this.escapeHtml(errorMsg) : errorMsg}</span>`;
            errEl.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons({ root: errEl });
          }
          if (!firstError) {
            firstError = {
              q,
              msg: errorMsg,
              targetEl: cardEl || inputEl,
              inputEl: inputEl
            };
          }
        } else {
          if (cardEl) cardEl.classList.remove('ring-1', 'ring-orange-500');
          if (inputEl) {
            inputEl.classList.remove('border-orange-500', 'bg-orange-50/20', 'text-orange-900', 'dark:text-orange-200');
            inputEl.classList.add('border-stone-200', 'dark:border-stone-700');
          }
          if (errEl) {
            errEl.textContent = '';
            errEl.classList.add('hidden');
          }
        }
      } else if (errorMsg && !firstError) {
        firstError = { q, msg: errorMsg };
      }
    }

    if (firstError) {
      if (typeof document !== 'undefined') {
        if (firstError.targetEl) {
          firstError.targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (firstError.inputEl && typeof firstError.inputEl.focus === 'function') {
          setTimeout(() => {
            try {
              firstError.inputEl.focus();
              if (typeof firstError.inputEl.select === 'function') firstError.inputEl.select();
            } catch (e) { } }, 200);
        }
      }
      if (typeof this.showToast === 'function') {
        this.showToast(firstError.msg || 'Vui lòng hoàn thành đầy đủ các câu hỏi bắt buộc!', 'warning');
      }
      return false;
    }

    return true;
  },

  _normalizeSmartText(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/^(muc|phan|section|cau|part)\s*(\d+|[ivx]+)?[\.\:\-\s]*/i, '')
      .replace(/^ban\s+[\.\:\-\s]*/i, '')
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  _isSmartTextMatch(haystack, needle) {
    if (!haystack || !needle) return false;
    const h = this._normalizeSmartText(haystack);
    const n = this._normalizeSmartText(needle);
    if (!h || !n) return false;
    if (h === n) return true;
    if (h.length >= 4 && n.length >= 4) {
      if (h.includes(n) || n.includes(h)) return true;
    }
    const wordsH = h.split(' ').filter(w => w.length >= 2);
    const wordsN = n.split(' ').filter(w => w.length >= 2);
    if (wordsH.length >= 2 && wordsN.length >= 2) {
      const setH = new Set(wordsH);
      const setN = new Set(wordsN);
      const common = [...setN].filter(w => setH.has(w));
      const minLen = Math.min(setH.size, setN.size);
      if (minLen >= 2 && common.length >= minLen * 0.75) {
        return true;
      }
    }
    return false;
  },

  resolveSectionTarget(rawTarget, sections, optText = null, currentSection = null) {
    if (!rawTarget && !optText) return null;
    let targetVal = rawTarget;
    let action = null;
    if (typeof rawTarget === 'object' && rawTarget !== null) {
      action = rawTarget.action || null;
      if (action === 'SUBMIT' || action === 'SUBMIT_FORM' || rawTarget.target === 'SUBMIT' || rawTarget.target === 'SUBMIT_FORM') return 'SUBMIT';
      if ((action === 'NEXT' || action === 'NEXT_PAGE') && !rawTarget.target) return 'NEXT';
      targetVal = rawTarget.target !== undefined && rawTarget.target !== null ? rawTarget.target : rawTarget.action;
    }
    if (targetVal === 'SUBMIT' || targetVal === 'SUBMIT_FORM') return 'SUBMIT';
    if ((targetVal === 'NEXT' || targetVal === 'NEXT_PAGE') && !optText) return 'NEXT';

    // Trường hợp đặc biệt: Người dùng chọn chỉ tham gia NV1 / Bỏ qua NV2 -> Nhảy đến Section chung cuối cùng
    if (optText && typeof optText === 'string' && /chỉ\s*muốn\s*tham\s*gia|không\s*có\s*nguyện\s*vọng\s*2|bỏ\s*qua\s*nv2/i.test(optText)) {
      if (sections.length > 0) return sections.length - 1;
    }

    const curIdx = currentSection ? sections.findIndex(s => s.id === currentSection.id || (currentSection.headerQuestionId && s.headerQuestionId === currentSection.headerQuestionId)) : -1;

    // 1. Parse dạng số nguyên trực tiếp (0, 1, 2...)
    if (targetVal !== null && targetVal !== undefined && targetVal !== '' && targetVal !== 'NEXT' && targetVal !== 'NEXT_PAGE') {
      const parsed = parseInt(targetVal, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < sections.length && String(parsed) === String(targetVal)) {
        if (parsed !== curIdx) return parsed;
      }
    }

    // 1b. Khớp dạng prefix 'order:X'
    if (typeof targetVal === 'string' && targetVal.startsWith('order:')) {
      const orderNum = parseInt(targetVal.replace('order:', ''), 10);
      if (!isNaN(orderNum)) {
        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          const sec = sections[sIdx];
          if (sec.headerQuestionId && String(sec.headerQuestionId).includes(`_${orderNum}`)) {
            if (sIdx !== curIdx) return sIdx;
          }
          const foundQ = sec.questions && sec.questions.some(q => q.order_index === orderNum);
          if (foundQ) {
            if (sIdx !== curIdx) return sIdx;
          }
        }
      }
    }

    // 2. Khớp theo ID của Section hoặc headerQuestionId
    if (targetVal !== null && targetVal !== undefined && targetVal !== '' && targetVal !== 'NEXT' && targetVal !== 'NEXT_PAGE') {
      const secIdx = sections.findIndex(sec => String(sec.id) === String(targetVal) || String(sec.headerQuestionId) === String(targetVal));
      if (secIdx !== -1 && secIdx !== curIdx) return secIdx;
    }

    // 3. Khớp nếu target là một question ID thuộc Section nào đó
    if (targetVal !== null && targetVal !== undefined && targetVal !== '' && targetVal !== 'NEXT' && targetVal !== 'NEXT_PAGE') {
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const foundQ = sections[sIdx].questions.some(q => String(q.id) === String(targetVal));
        if (foundQ && sIdx !== curIdx) return sIdx;
      }
    }

    // 4. Smart Name / Title Matching có hỗ trợ phân cấp ngữ cảnh NV1 / NV2
    const matchQueries = [];
    if (targetVal && typeof targetVal === 'string' && targetVal !== 'NEXT' && targetVal !== 'NEXT_PAGE' && targetVal !== 'SUBMIT' && targetVal !== 'SUBMIT_FORM') {
      matchQueries.push(targetVal);
    }
    if (optText && typeof optText === 'string') {
      matchQueries.push(optText);
    }

    const curTitle = (currentSection?.title || '') + ' ' + (currentSection?.description || '');
    const isNV1Context = /(?:nguyện\s*vọng\s*1|nv1)\b/i.test(curTitle);
    const isNV2Context = /(?:nguyện\s*vọng\s*2|nv2)\b/i.test(curTitle);

    // Ưu tiên khớp trong danh sách ứng viên phù hợp với ngữ cảnh
    for (const query of matchQueries) {
      if (isNV1Context) {
        const nv1Idx = sections.findIndex((sec, idx) => idx !== curIdx && /(?:nv1|nguyện\s*vọng\s*1)\b/i.test(sec.title) && (this._isSmartTextMatch(sec.title, query) || (sec.description && this._isSmartTextMatch(sec.description, query))));
        if (nv1Idx !== -1) return nv1Idx;
      } else if (isNV2Context) {
        const nv2Idx = sections.findIndex((sec, idx) => idx !== curIdx && /(?:nv2|nguyện\s*vọng\s*2)\b/i.test(sec.title) && (this._isSmartTextMatch(sec.title, query) || (sec.description && this._isSmartTextMatch(sec.description, query))));
        if (nv2Idx !== -1) return nv2Idx;
      }

      // Quét thông thường nếu không có ngữ cảnh hoặc chưa tìm thấy
      const matchIdx = sections.findIndex((sec, idx) => idx !== curIdx && (this._isSmartTextMatch(sec.title, query) || (sec.description && this._isSmartTextMatch(sec.description, query))));
      if (matchIdx !== -1) return matchIdx;
    }

    return null;
  },

  // Điều hướng chuyển Section kế tiếp với Kiểm tra tính hợp lệ & Rẽ nhánh 3 Tầng Chuẩn DAG (Option Branching -> Section Default -> Linear NEXT)
  async nextSection() {
    this.haptic('light');
    const session = this.state.activeSession;
    if (!session) return;
    if (session.isPacingLocked) {
      this.showToast('Vui lòng đọc kỹ câu hỏi (0.5s)', 'info');
      return;
    }

    const sections = this.buildSurveySections(session.questions);
    let curSectionIdx = session.currentSectionIndex || 0;
    if (curSectionIdx >= sections.length) {
      curSectionIdx = Math.max(0, sections.length - 1);
      session.currentSectionIndex = curSectionIdx;
    }
    const curSec = sections[curSectionIdx] || sections[0];

    // 1. Kiểm tra tính hợp lệ toàn bộ câu hỏi trong Section
    if (!this.validateCurrentSection(curSec)) {
      return;
    }

    // 2. Kiểm tra câu hỏi sàng lọc Screener nếu có trong Section
    for (const q of (curSec.questions || [])) {
      if (q.is_screener && q.qualifying_answer) {
        const ans = session.answers ? session.answers[q.id] : undefined;
        const isQualified = String(ans).trim().toLowerCase() === String(q.qualifying_answer).trim().toLowerCase();
        if (!isQualified) {
          await this.handleScreenOut(session.surveyId);
          return;
        }
      }
    }

    // Khởi tạo và đồng bộ visited_sections trong state.surveyRunner để phòng chống vòng lặp vô tận (DAG Loop Prevention)
    if (!this.state.surveyRunner) {
      this.state.surveyRunner = { visited_sections: new Set() };
    } else if (!(this.state.surveyRunner.visited_sections instanceof Set)) {
      this.state.surveyRunner.visited_sections = new Set(this.state.surveyRunner.visited_sections || []);
    }

    const curSecId = curSec.id || curSec.headerQuestionId || String(curSectionIdx);
    this.state.surveyRunner.visited_sections.add(curSecId);
    this.state.surveyRunner.visited_sections.add(String(curSectionIdx));
    if (curSec.headerQuestionId) this.state.surveyRunner.visited_sections.add(String(curSec.headerQuestionId));

    // ĐÁNH GIÁ ĐIỀU HƯỚNG THEO 3 TẦNG ƯU TIÊN CHUẨN DAG:
    // =========================================================================
    // PRIORITY 1: OPTION BRANCHING (Lựa chọn đáp án trỏ đến target_section)
    // =========================================================================
    let branchAction = null;
    let selectedOptionText = null;
    for (const q of (curSec.questions || [])) {
      if (['SINGLE_CHOICE', 'DROPDOWN'].includes(q.type)) {
        const ans = session.answers ? session.answers[q.id] : undefined;
        if (ans !== undefined && ans !== null && String(ans).trim() !== '') {
          let optText = String(ans).trim();
          if (q.options && q.options.length > 0) {
            const numAns = parseInt(ans, 10);
            if (!isNaN(numAns) && q.options[numAns] !== undefined && String(numAns) === String(ans)) {
              optText = q.options[numAns].trim();
            }
          }
          if (q.logic && q.logic.enabled && q.logic.options) {
            if (q.logic.options[ans] !== undefined) {
              branchAction = q.logic.options[ans];
              selectedOptionText = optText;
              break;
            } else if (q.options) {
              const optIdx = q.options.findIndex(o => String(o).trim() === String(ans).trim());
              if (optIdx !== -1 && q.logic.options[optIdx] !== undefined) {
                branchAction = q.logic.options[optIdx];
                selectedOptionText = optText;
                break;
              }
            }
          } else {
            if (!selectedOptionText) selectedOptionText = optText;
          }
        }
      }
    }

    let resolvedOpt = null;
    if (branchAction) {
      resolvedOpt = this.resolveSectionTarget(branchAction, sections, selectedOptionText, curSec);
    } else if (selectedOptionText) {
      resolvedOpt = this.resolveSectionTarget(null, sections, selectedOptionText, curSec);
    }

    if (resolvedOpt === 'SUBMIT') {
      await this.submitSurvey();
      return;
    }
    if (typeof resolvedOpt === 'number') {
      const targetSec = sections[resolvedOpt];
      const isLoop = targetSec && (
        this.state.surveyRunner.visited_sections.has(String(resolvedOpt)) ||
        this.state.surveyRunner.visited_sections.has(String(targetSec.id)) ||
        (targetSec.headerQuestionId && this.state.surveyRunner.visited_sections.has(String(targetSec.headerQuestionId)))
      );
      if (!isLoop) {
        session.sectionHistory = session.sectionHistory || [];
        session.sectionHistory.push(curSectionIdx);
        session.currentSectionIndex = resolvedOpt;
        this._saveActiveSessionToStorage();
        if (typeof this.triggerPacingLock === 'function') this.triggerPacingLock();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
        return;
      }
    }

    // =========================================================================
    // PRIORITY 2: SECTION DEFAULT NAVIGATION (Thuộc tính defaultAction của Section)
    // =========================================================================
    if (curSec.defaultAction && curSec.defaultAction !== 'NEXT' && curSec.defaultAction !== 'NEXT_PAGE') {
      if (curSec.defaultAction === 'SUBMIT' || curSec.defaultAction === 'SUBMIT_FORM') {
        await this.submitSurvey();
        return;
      }
      const navTarget = curSec.target || curSec.defaultAction;
      const resolvedDef = this.resolveSectionTarget(navTarget, sections, null, curSec);
      if (resolvedDef === 'SUBMIT') {
        await this.submitSurvey();
        return;
      }
      if (typeof resolvedDef === 'number') {
        const targetDefSec = sections[resolvedDef];
        const isLoop = targetDefSec && (
          this.state.surveyRunner.visited_sections.has(String(resolvedDef)) ||
          this.state.surveyRunner.visited_sections.has(String(targetDefSec.id)) ||
          (targetDefSec.headerQuestionId && this.state.surveyRunner.visited_sections.has(String(targetDefSec.headerQuestionId)))
        );
        if (!isLoop) {
          session.sectionHistory = session.sectionHistory || [];
          session.sectionHistory.push(curSectionIdx);
          session.currentSectionIndex = resolvedDef;
          this._saveActiveSessionToStorage();
          if (typeof this.triggerPacingLock === 'function') this.triggerPacingLock();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
          return;
        }
      }
    }

    // =========================================================================
    // PRIORITY 3: TUYẾN TÍNH (NEXT & Điểm Hội Tụ Chung)
    // =========================================================================
    // Kiểm tra nhánh rẽ song song để tìm điểm hội tụ chung
    const branchSectionIndices = new Set();
    for (let s = 0; s < curSectionIdx; s++) {
      const prevSec = sections[s];
      for (const q of (prevSec.questions || [])) {
        if (!['SINGLE_CHOICE', 'DROPDOWN'].includes(q.type)) continue;
        const qBranchSet = new Set();
        if (q.logic && q.logic.enabled && q.logic.options) {
          Object.values(q.logic.options).forEach(t => {
            const r = this.resolveSectionTarget(t, sections);
            if (typeof r === 'number') qBranchSet.add(r);
          });
        }
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach(opt => {
            const r = this.resolveSectionTarget(null, sections, opt);
            if (typeof r === 'number') qBranchSet.add(r);
          });
        }
        if (qBranchSet.has(curSectionIdx) && qBranchSet.size >= 2) {
          qBranchSet.forEach(idx => branchSectionIndices.add(idx));
          break;
        }
      }
      if (branchSectionIndices.size > 0) break;
    }

    if (branchSectionIndices.has(curSectionIdx)) {
      let nextCommonSecIdx = -1;
      for (let s = curSectionIdx + 1; s < sections.length; s++) {
        if (!branchSectionIndices.has(s)) {
          const sSec = sections[s];
          const isVisited = this.state.surveyRunner.visited_sections.has(String(s)) ||
            (sSec && (this.state.surveyRunner.visited_sections.has(String(sSec.id)) || (sSec.headerQuestionId && this.state.surveyRunner.visited_sections.has(String(sSec.headerQuestionId)))));
          if (!isVisited) {
            nextCommonSecIdx = s;
            break;
          }
        }
      }
      if (nextCommonSecIdx !== -1) {
        session.sectionHistory = session.sectionHistory || [];
        session.sectionHistory.push(curSectionIdx);
        session.currentSectionIndex = nextCommonSecIdx;
        this._saveActiveSessionToStorage();
        if (typeof this.triggerPacingLock === 'function') this.triggerPacingLock();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
        return;
      } else {
        await this.submitSurvey();
        return;
      }
    }

    // Tìm Section tiếp theo tuyến tính chưa ghé thăm (Loop Prevention)
    let nextLinearSecIdx = -1;
    for (let s = curSectionIdx + 1; s < sections.length; s++) {
      const sSec = sections[s];
      const isVisited = this.state.surveyRunner.visited_sections.has(String(s)) ||
        (sSec && (this.state.surveyRunner.visited_sections.has(String(sSec.id)) || (sSec.headerQuestionId && this.state.surveyRunner.visited_sections.has(String(sSec.headerQuestionId)))));
      if (!isVisited) {
        nextLinearSecIdx = s;
        break;
      }
    }

    if (nextLinearSecIdx !== -1) {
      session.sectionHistory = session.sectionHistory || [];
      session.sectionHistory.push(curSectionIdx);
      session.currentSectionIndex = nextLinearSecIdx;
      this._saveActiveSessionToStorage();
      if (typeof this.triggerPacingLock === 'function') this.triggerPacingLock();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
    } else {
      await this.submitSurvey();
    }
  },

  // Điều hướng quay lại Section trước đó
  prevSection() {
    this.haptic('light');
    const session = this.state.activeSession;
    if (!session) return;
    
    if (this.state.surveyRunner && this.state.surveyRunner.visited_sections) {
      const curSecIdx = session.currentSectionIndex || 0;
      this.state.surveyRunner.visited_sections.delete(String(curSecIdx));
      const sections = this.buildSurveySections(session.questions);
      const curSec = sections[curSecIdx];
      if (curSec) {
        if (curSec.id) this.state.surveyRunner.visited_sections.delete(String(curSec.id));
        if (curSec.headerQuestionId) this.state.surveyRunner.visited_sections.delete(String(curSec.headerQuestionId));
      }
    }
    
    if (session.sectionHistory && session.sectionHistory.length > 0) {
      session.currentSectionIndex = session.sectionHistory.pop();
    } else if ((session.currentSectionIndex || 0) > 0) {
      session.currentSectionIndex = (session.currentSectionIndex || 0) - 1;
    }
    this._saveActiveSessionToStorage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
  },

  // Trình Điều Hướng Từng Câu Một (Single-Question Stepper - Bảo Đảm Anti-Fraud, Speed Trap, Attention Check & Chống Bot)
  async nextQuestion() {
    this.haptic('light');
    const session = this.state.activeSession;
    if (!session) return;
    if (session.isPacingLocked) {
      this.showToast('Vui lòng đọc kỹ câu hỏi (0.5s)', 'info');
      return;
    }

    const curQ = session.questions[session.currentIndex];
    // Tự động đồng bộ câu trả lời từ DOM input/textarea nếu có (phòng ngừa độ trễ oninput hoặc autocomplete)
    const activeInput = document.getElementById(`survey-answer-input-${curQ.id}`) || document.querySelector('#app-root input[type="text"], #app-root textarea, #app-root input[type="number"], #app-root input[type="date"], #app-root input[type="time"]');
    if (activeInput && activeInput.value !== undefined && activeInput.value !== null) {
      if (!session.answers) session.answers = {};
      session.answers[curQ.id] = activeInput.value;
      this._saveActiveSessionToStorage();
    }

    const ans = session.answers ? session.answers[curQ.id] : undefined;
    const isReq = curQ.is_required !== 0 && curQ.is_required !== false;

    // 1. Kiểm tra bắt buộc
    if (['VIDEO_BLOCK', 'SECTION_HEADER', 'TEXT_BLOCK'].includes(curQ.type)) {
      // Bỏ qua
    } else if (isReq) {
      if (curQ.type === 'CHOICE_GRID') {
        const rows = curQ.rows || [];
        const ansObj = (ans && typeof ans === 'object') ? ans : {};
        const unselectedRows = rows.filter(r => !ansObj[r]);
        if (unselectedRows.length > 0) {
          this.showToast(`Vui lòng chọn phản hồi cho tất cả các hàng trong bảng ma trận (${unselectedRows.length} hàng còn trống)!`, 'warning');
          return;
        }
      } else if (curQ.type === 'CHECKBOX_GRID') {
        const rows = curQ.rows || [];
        const ansObj = (ans && typeof ans === 'object') ? ans : {};
        const unselectedRows = rows.filter(r => !ansObj[r] || !Array.isArray(ansObj[r]) || ansObj[r].length === 0);
        if (unselectedRows.length > 0) {
          this.showToast('Vui lòng chọn ít nhất 1 ô cho mỗi hàng trong bảng ma trận!', 'warning');
          return;
        }
      } else if (curQ.type === 'MULTIPLE_CHOICE') {
        if (!Array.isArray(ans) || ans.length === 0) {
          this.showToast('Vui lòng chọn ít nhất một lựa chọn!', 'warning');
          return;
        }
      } else {
        if (ans === undefined || ans === null || String(ans).trim() === '') {
          this.showToast('Vui lòng trả lời câu hỏi bắt buộc này trước khi tiếp tục!', 'warning');
          return;
        }
      }
    }

    // 2. Kiểm tra câu hỏi sàng lọc Screener
    if (curQ.is_screener && curQ.qualifying_answer) {
      const isQualified = String(ans).trim().toLowerCase() === String(curQ.qualifying_answer).trim().toLowerCase();
      if (!isQualified) {
        await this.handleScreenOut(session.surveyId);
        return;
      }
    }

    // 3. Kiểm tra Validation Ràng buộc (Email, Number, URL, Length)
    const validation = curQ.validation || (curQ.logic && curQ.logic.validation ? curQ.logic.validation : null);
    if (validation && validation.type && validation.type !== 'NONE') {
      const valStr = (ans !== undefined && ans !== null) ? String(ans).trim() : '';
      const inputEl = document.getElementById(`survey-answer-input-${curQ.id}`) || activeInput;
      const errEl = document.getElementById(`val-err-${curQ.id}`) || document.getElementById(`survey-error-${curQ.id}`);
      if (valStr.length > 0 || isReq) {
        if (validation.type === 'EMAIL') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valStr)) {
            const msg = validation.error_message || 'Vui lòng nhập đúng định dạng email (VD: name@domain.com)';
            this.showToast(msg, 'warning');
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add('border-orange-500');
            }
            if (errEl) {
              errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${msg}</span>`;
              errEl.classList.remove('hidden');
              if (window.lucide) window.lucide.createIcons({ root: errEl });
            }
            return;
          }
        } else if (validation.type === 'NUMBER') {
          const rule = String(validation.rule || 'IS_NUMBER').toUpperCase();
          if (!/^-?\d+(\.\d+)?$/.test(valStr)) {
            const msg = 'Giá trị phải là một số';
            this.showToast(msg, 'warning');
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add('border-orange-500');
            }
            if (errEl) {
              errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${msg}</span>`;
              errEl.classList.remove('hidden');
              if (window.lucide) window.lucide.createIcons({ root: errEl });
            }
            return;
          }
          const num = parseFloat(valStr);
          const min = (validation.min !== undefined && validation.min !== null && String(validation.min).trim() !== '') ? parseFloat(validation.min) : null;
          const max = (validation.max !== undefined && validation.max !== null && String(validation.max).trim() !== '') ? parseFloat(validation.max) : null;
          if (rule === 'BETWEEN') {
            if (min !== null && max !== null && (num < min || num > max)) {
              const msg = validation.error_message || `Số phải nằm trong khoảng từ ${min} ~ ${max}`;
              this.showToast(msg, 'warning');
              if (inputEl) {
                inputEl.focus();
                inputEl.classList.add('border-orange-500');
              }
              if (errEl) {
                errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${msg}</span>`;
                errEl.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons({ root: errEl });
              }
              return;
            }
          } else if (rule === 'GREATER_THAN') {
            if (min !== null && num <= min) {
              const msg = validation.error_message || `Số phải lớn hơn ${min}`;
              this.showToast(msg, 'warning');
              if (inputEl) {
                inputEl.focus();
                inputEl.classList.add('border-orange-500');
              }
              if (errEl) {
                errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${msg}</span>`;
                errEl.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons({ root: errEl });
              }
              return;
            }
          } else if (rule === 'LESS_THAN') {
            if (max !== null && num >= max) {
              const msg = validation.error_message || `Số phải nhỏ hơn ${max}`;
              this.showToast(msg, 'warning');
              if (inputEl) {
                inputEl.focus();
                inputEl.classList.add('border-orange-500');
              }
              if (errEl) {
                errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${msg}</span>`;
                errEl.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons({ root: errEl });
              }
              return;
            }
          } else if (rule === 'GREATER_THAN_OR_EQUAL') {
            if (min !== null && num < min) {
              const msg = validation.error_message || `Số phải lớn hơn hoặc bằng ${min}`;
              this.showToast(msg, 'warning');
              if (inputEl) {
                inputEl.focus();
                inputEl.classList.add('border-orange-500');
              }
              if (errEl) {
                errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${msg}</span>`;
                errEl.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons({ root: errEl });
              }
              return;
            }
          } else if (rule === 'LESS_THAN_OR_EQUAL') {
            if (max !== null && num > max) {
              const msg = validation.error_message || `Số phải nhỏ hơn hoặc bằng ${max}`;
              this.showToast(msg, 'warning');
              if (inputEl) {
                inputEl.focus();
                inputEl.classList.add('border-orange-500');
              }
              if (errEl) {
                errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${msg}</span>`;
                errEl.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons({ root: errEl });
              }
              return;
            }
          }
        } else if (validation.type === 'URL') {
          if (!/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i.test(valStr)) {
            const msg = validation.error_message || 'Vui lòng nhập đường dẫn URL hợp lệ';
            this.showToast(msg, 'warning');
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add('border-orange-500');
            }
            if (errEl) {
              errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${msg}</span>`;
              errEl.classList.remove('hidden');
              if (window.lucide) window.lucide.createIcons({ root: errEl });
            }
            return;
          }
        } else if (validation.type === 'LENGTH') {
          const maxL = validation.max || 500;
          const minL = validation.min || 1;
          if (validation.rule === 'MAX_LENGTH' && valStr.length > maxL) {
            const msg = validation.error_message || `Độ dài không được vượt quá ${maxL} ký tự`;
            this.showToast(msg, 'warning');
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add('border-orange-500');
            }
            if (errEl) {
              errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${msg}</span>`;
              errEl.classList.remove('hidden');
              if (window.lucide) window.lucide.createIcons({ root: errEl });
            }
            return;
          }
          if (validation.rule === 'MIN_LENGTH' && valStr.length < minL) {
            const msg = validation.error_message || `Độ dài phải có ít nhất ${minL} ký tự`;
            this.showToast(msg, 'warning');
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add('border-orange-500');
            }
            if (errEl) {
              errEl.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i><span>${msg}</span>`;
              errEl.classList.remove('hidden');
              if (window.lucide) window.lucide.createIcons({ root: errEl });
            }
            return;
          }
        }
      }
    }

    // 4. Đánh giá Điều hướng Rẽ nhánh 2 tầng (2-Tier Routing)
    const resolveTarget = (rawTarget, optText = null) => {
      if (!rawTarget && !optText) return null;
      let targetVal = rawTarget;
      if (typeof rawTarget === 'object' && rawTarget !== null) {
        if (rawTarget.action === 'SUBMIT' || rawTarget.target === 'SUBMIT' || rawTarget.action === 'SUBMIT_FORM' || rawTarget.default_action === 'SUBMIT_FORM' || rawTarget.default_action === 'SUBMIT') return 'SUBMIT';
        targetVal = rawTarget.target || rawTarget.action || (rawTarget.default_action !== 'GO_TO_PAGE' && rawTarget.default_action !== 'NEXT_PAGE' && rawTarget.default_action !== 'NEXT' ? rawTarget.default_action : null);
      }
      if (targetVal === 'SUBMIT' || targetVal === 'SUBMIT_FORM' || targetVal === 'ENDOFFORM' || targetVal === '-1') return 'SUBMIT';
      if ((targetVal === 'NEXT' || targetVal === 'NEXT_PAGE') && !optText) return 'NEXT';

      const strTarget = String(targetVal || '').trim();

      // 1. Kiểm tra theo ID chính xác (UUID hoặc origin_id hoặc q_...)
      if (strTarget && strTarget !== 'NEXT') {
        const foundIdx = session.questions.findIndex(item => 
          String(item.id).trim() === strTarget || 
          (item.origin_id && String(item.origin_id).trim() === strTarget) ||
          (item.id && `q_${item.origin_id}` === strTarget)
        );
        if (foundIdx !== -1) return foundIdx;
      }

      // 2. Kiểm tra nếu có tiền tố 'order:16' hoặc 'order_16' (1-based)
      if (strTarget.startsWith('order:') || strTarget.startsWith('order_')) {
        const oNum = parseInt(strTarget.replace(/^(order:|order_)/, ''), 10);
        if (!isNaN(oNum)) {
          const foundIdx = session.questions.findIndex(item => Number(item.order_index) === oNum);
          if (foundIdx !== -1) return foundIdx;
          if (oNum >= 1 && oNum <= session.questions.length) return oNum - 1;
        }
      }

      // 3. Kiểm tra nếu có tiền tố 'index:15' (0-based)
      if (strTarget.startsWith('index:')) {
        const iNum = parseInt(strTarget.replace(/^index:/, ''), 10);
        if (!isNaN(iNum) && iNum >= 0 && iNum < session.questions.length) {
          return iNum;
        }
      }

      // 4. Khớp theo Section Header ID hoặc Section ID trong buildSurveySections
      if (strTarget && strTarget !== 'NEXT') {
        const sections = this.buildSurveySections(session.questions);
        const foundSec = sections.find(sec => String(sec.id).trim() === strTarget || String(sec.headerQuestionId).trim() === strTarget);
        if (foundSec) {
          const headerIdx = session.questions.findIndex(item => String(item.id).trim() === String(foundSec.headerQuestionId || foundSec.id).trim());
          if (headerIdx !== -1) return headerIdx;
          if (foundSec.questions && foundSec.questions.length > 0) {
            const firstQIdx = session.questions.findIndex(item => String(item.id).trim() === String(foundSec.questions[0].id).trim());
            if (firstQIdx !== -1) return firstQIdx;
          }
        }
      }

      // 5. Khớp theo Section Header có tiêu đề tương đồng với strTarget (chỉ dành cho SECTION_HEADER, cấm đoán câu hỏi thường)
      if (strTarget && strTarget !== 'NEXT' && !/^\d+$/.test(strTarget)) {
        const secHeaderIdx = session.questions.findIndex(item => 
          item.type === 'SECTION_HEADER' && (this._isSmartTextMatch(item.content, strTarget) || this._isSmartTextMatch(item.title, strTarget))
        );
        if (secHeaderIdx !== -1) return secHeaderIdx;
      }

      // 6. Fallback số thuần:
      if (strTarget && strTarget !== 'NEXT') {
        const parsed = parseInt(strTarget, 10);
        if (!isNaN(parsed) && String(parsed) === strTarget) {
          const matchOrder = session.questions.findIndex(item => Number(item.order_index) === parsed);
          if (matchOrder !== -1) return matchOrder;
          if (parsed >= 0 && parsed < session.questions.length) return parsed;
        }
      }

      return null;
    };

    // Xác định đáp án người dùng vừa chọn (cho câu hiện tại)
    let selectedOptionText = null;
    if (['SINGLE_CHOICE', 'DROPDOWN'].includes(curQ.type)) {
      if (ans !== undefined && ans !== null && String(ans).trim() !== '') {
        selectedOptionText = String(ans).trim();
        if (curQ.options && curQ.options.length > 0) {
          const numAns = parseInt(ans, 10);
          if (!isNaN(numAns) && curQ.options[numAns] !== undefined && String(numAns) === String(ans)) {
            selectedOptionText = curQ.options[numAns].trim();
          }
        }
      }
    }

    let branchAction = null;
    if (['SINGLE_CHOICE', 'DROPDOWN'].includes(curQ.type) && curQ.logic && curQ.logic.enabled) {
      if (curQ.logic.options) {
        if (curQ.logic.options[ans] !== undefined) {
          branchAction = curQ.logic.options[ans];
        } else if (curQ.options) {
          const optIdx = curQ.options.findIndex(o => String(o).trim() === String(ans).trim());
          if (optIdx !== -1 && curQ.logic.options[optIdx] !== undefined) branchAction = curQ.logic.options[optIdx];
          else if (selectedOptionText && curQ.logic.options[selectedOptionText] !== undefined) branchAction = curQ.logic.options[selectedOptionText];
        }
      }
      // Nếu câu hỏi đã bật rẽ nhánh (logic.enabled === true) nhưng tùy chọn này chưa cấu hình target ID cụ thể:
      // Cho phép khớp tên phân đoạn Mục tiêu (CHỈ khớp với SECTION_HEADER)
      if (!branchAction && selectedOptionText) {
        branchAction = selectedOptionText;
      }
    } else if (curQ.type === 'SECTION_HEADER' && curQ.logic) {
      // SECTION_HEADER không được tự ý rẽ nhánh khi vừa bắt đầu hiển thị tiêu đề,
      // vì logic.target của SECTION_HEADER là đích đến SAU KHI ĐIỀN XONG toàn bộ câu hỏi trong phân đoạn đó (Section-End Routing).
      // Ngoại lệ duy nhất: Phân đoạn hoàn toàn rỗng (không chứa bất kỳ câu hỏi nào phía sau).
      const nextQ = session.questions[session.currentIndex + 1];
      const isSectionEmpty = !nextQ || nextQ.type === 'SECTION_HEADER';
      if (isSectionEmpty) {
        branchAction = curQ.logic.target || curQ.logic.default_action;
      }
    }

    let resolvedBranch = null;
    if (branchAction) {
      resolvedBranch = resolveTarget(branchAction, selectedOptionText);
    }

    if (resolvedBranch === 'SUBMIT') {
      await this.submitSurvey();
      return;
    }
    if (typeof resolvedBranch === 'number') {
      session.history = session.history || [];
      session.history.push(session.currentIndex);
      session.currentIndex = resolvedBranch;
      this._saveActiveSessionToStorage();
      this.triggerPacingLock();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
      return;
    }

    // Section-end routing
    const nextQuestionIdx = session.currentIndex + 1;
    const isSectionEnd = (nextQuestionIdx >= session.questions.length) || (session.questions[nextQuestionIdx] && session.questions[nextQuestionIdx].type === 'SECTION_HEADER');
    if (isSectionEnd && curQ.type !== 'SECTION_HEADER') {
      let currentSectionHeader = null;
      let currentSectionHeaderIdx = -1;
      for (let i = session.currentIndex; i >= 0; i--) {
        if (session.questions[i].type === 'SECTION_HEADER') {
          currentSectionHeader = session.questions[i];
          currentSectionHeaderIdx = i;
          break;
        }
      }

      // Bước 1: Ưu tiên default_action/target được cấu hình tường minh của phân đoạn hiện tại
      if (currentSectionHeader && currentSectionHeader.logic) {
        const secLogic = currentSectionHeader.logic;
        const navTarget = secLogic.target || secLogic.default_action;
        if (navTarget && navTarget !== 'NEXT' && navTarget !== 'NEXT_PAGE') {
          const resolvedSectionAction = resolveTarget(secLogic);
          if (resolvedSectionAction === 'SUBMIT') {
            await this.submitSurvey();
            return;
          }
          if (typeof resolvedSectionAction === 'number') {
            session.history = session.history || [];
            session.history.push(session.currentIndex);
            session.currentIndex = resolvedSectionAction;
            this._saveActiveSessionToStorage();
            this.triggerPacingLock();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
            return;
          }
        }
      }

      // Bước 2: Chống trôi tự do sang các phân đoạn của những tiểu ban khác
      if (currentSectionHeaderIdx !== -1) {
        const branchSecHeaderIndices = new Set();
        // Tìm câu hỏi rẽ nhánh đứng trước currentSectionHeaderIdx
        for (let i = 0; i < currentSectionHeaderIdx; i++) {
          const q = session.questions[i];
          if (!['SINGLE_CHOICE', 'DROPDOWN'].includes(q.type)) continue;

          const qBranchTargets = new Set();
          if (q.logic && q.logic.enabled && q.logic.options) {
            Object.values(q.logic.options).forEach(t => {
              const res = resolveTarget(t);
              if (typeof res === 'number') qBranchTargets.add(res);
            });
          }

          if (qBranchTargets.has(currentSectionHeaderIdx) && qBranchTargets.size >= 2) {
            qBranchTargets.forEach(idx => branchSecHeaderIndices.add(idx));
            break;
          }
        }

        if (branchSecHeaderIndices.has(currentSectionHeaderIdx)) {
          // Phân đoạn hiện tại là một nhánh rẽ!
          // Tìm Section Header đầu tiên phía sau currentSectionHeaderIdx mà KHÔNG thuộc branchSecHeaderIndices
          let nextSafeHeaderIdx = -1;
          for (let i = session.currentIndex + 1; i < session.questions.length; i++) {
            if (session.questions[i].type === 'SECTION_HEADER' && !branchSecHeaderIndices.has(i)) {
              nextSafeHeaderIdx = i;
              break;
            }
          }

          if (nextSafeHeaderIdx !== -1) {
            session.history = session.history || [];
            session.history.push(session.currentIndex);
            session.currentIndex = nextSafeHeaderIdx;
            this._saveActiveSessionToStorage();
            this.triggerPacingLock();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
            return;
          } else {
            // Không có phân đoạn chung nào sau các nhánh -> Nộp bài!
            await this.submitSurvey();
            return;
          }
        }
      }
    }

    // 5. Chuyển sang câu tiếp theo hoặc submit
    session.history = session.history || [];
    if (session.currentIndex < session.questions.length - 1) {
      session.history.push(session.currentIndex);
      session.currentIndex++;
      this._saveActiveSessionToStorage();
      this.triggerPacingLock();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
    } else {
      await this.submitSurvey();
    }
  },

  prevQuestion() {
    this.haptic('light');
    const session = this.state.activeSession;
    if (!session) return;
    if (session.history && session.history.length > 0) {
      session.currentIndex = session.history.pop();
    } else if (session.currentIndex > 0) {
      session.currentIndex--;
    }
    this._saveActiveSessionToStorage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderTakeSurveyView(document.getElementById('app-root'), session.surveyId);
  },

  triggerPacingLock() {
    if (this.state.activeSession) {
      if (this._pacingTimer) clearTimeout(this._pacingTimer);
      this.state.activeSession.isPacingLocked = true;
      this._pacingTimer = setTimeout(() => {
        if (this.state.activeSession) {
          this.state.activeSession.isPacingLocked = false;
        }
      }, 150);
    }
  },

    confirmExitSurvey() {
    this.haptic('medium');
    this.showModal({
      title: 'Xác Nhận Thoát Khảo Sát',
      content: `
        <div class="space-y-4 text-center py-2">
          <div class="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 border border-stone-200 dark:border-stone-700 mx-auto flex items-center justify-center">
            <i data-lucide="alert-triangle" class="w-6 h-6 stroke-[2.2]"></i>
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-extrabold text-slate-900 dark:text-white">Bạn có chắc chắn muốn thoát?</h4>
            <p class="text-xs text-stone-600 dark:text-stone-300 font-normal">Tiến độ bài làm hiện tại sẽ bị xóa bỏ và không được nhận điểm thưởng.</p>
          </div>
          <div class="flex gap-2.5 pt-2">
            <button type="button" onclick="VibeApp.closeModal()" class="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95">
              Tiếp Tục Làm Bài
            </button>
            <button type="button" onclick="VibeApp.executeExitSurvey()" class="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold transition-all active:scale-95 border border-stone-800 dark:border-stone-700">
              Thoát & Hủy Bài
            </button>
          </div>
        </div>
      `
    });
  },

  executeExitSurvey() {
    this.closeModal();
    if (this.state.activeSession && this.state.activeSession.timerId) {
      clearInterval(this.state.activeSession.timerId);
    }
    this.state.activeSession = null;
    localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');
    this.showToast('Đã hủy bài làm và quay về danh sách khảo sát', 'info');
    this.navigate('surveys');
  },

  async handleScreenOut(surveyId) {
    if (this.state.activeSession && this.state.activeSession.timerId) {
      clearInterval(this.state.activeSession.timerId);
    }
    localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');

    try {
      const res = await this.api(`/surveys/${surveyId}/screen-out`, { method: 'POST' });
      const pts = res.consolationPoints || 0;

      if (this.state.currentUser && pts > 0) {
        this.state.currentUser.point_balance = (this.state.currentUser.point_balance || 0) + pts;
      }

      this.state.activeSession = null;

      const root = document.getElementById('app-root');
      if (root) {
        root.innerHTML = `
          <div class="stepper-focus-box py-8 text-center space-y-6">
            <div class="w-16 h-16 rounded-3xl bg-stone-100 dark:bg-stone-800 text-orange-500 mx-auto flex items-center justify-center border border-orange-200/80 dark:border-orange-800/80">
              <i data-lucide="smile" class="w-8 h-8"></i>
            </div>
            
            <div class="space-y-2">
              <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">
                Khảo sát chưa hoàn toàn phù hợp với bạn
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Rất cảm ơn bạn đã dành thời gian tham gia! Dựa trên câu trả lời sàng lọc, nhóm nghiên cứu đang tìm kiếm đối tượng khác cho đợt khảo sát này.
              </p>
            </div>

            <div class="pt-2">
              <button onclick="VibeApp.navigate('surveys')" class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
                Khám Phá Khảo Sát Khác
              </button>
            </div>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
      this.applyUserInterface();
    } catch (err) {
      this.showToast(err.message, 'error');
      this.navigate('surveys');
    }
  },

  async submitSurvey() {
    const session = this.state.activeSession;
    if (!session) return;

    if (session.isPacingLocked) {
      this.showToast('Đang kiểm tra nhịp độ...', 'info');
      return;
    }

    const curQ = session.questions[session.currentIndex];

    // Tự động đồng bộ câu trả lời từ DOM input/textarea nếu có (phòng ngừa độ trễ oninput hoặc autocomplete)
    const activeInput = document.getElementById(`survey-answer-input-${curQ.id}`) || document.querySelector('#app-root input[type="text"], #app-root textarea, #app-root input[type="number"], #app-root input[type="date"], #app-root input[type="time"]');
    if (activeInput && activeInput.value !== undefined && activeInput.value !== null) {
      if (!session.answers) session.answers = {};
      session.answers[curQ.id] = activeInput.value;
      this._saveActiveSessionToStorage();
    }

    const ans = session.answers[curQ.id];
    const isReq = curQ.is_required !== 0 && curQ.is_required !== false;

    // Kiểm tra câu hỏi cuối nếu là bắt buộc
    if (!['VIDEO_BLOCK', 'SECTION_HEADER', 'TEXT_BLOCK'].includes(curQ.type) && isReq) {
      if (curQ.type === 'CHOICE_GRID') {
        const rows = curQ.rows || [];
        const ansObj = (ans && typeof ans === 'object') ? ans : {};
        const unselectedRows = rows.filter(r => !ansObj[r]);
        if (unselectedRows.length > 0) {
          this.showToast('Vui lòng chọn phản hồi cho tất cả các hàng trong bảng ma trận!', 'warning');
          return;
        }
      } else if (curQ.type === 'CHECKBOX_GRID') {
        const rows = curQ.rows || [];
        const ansObj = (ans && typeof ans === 'object') ? ans : {};
        const unselectedRows = rows.filter(r => !ansObj[r] || !Array.isArray(ansObj[r]) || ansObj[r].length === 0);
        if (unselectedRows.length > 0) {
          this.showToast('Vui lòng chọn ít nhất 1 ô cho mỗi hàng trong bảng ma trận!', 'warning');
          return;
        }
      } else if (curQ.type === 'MULTIPLE_CHOICE') {
        if (!Array.isArray(ans) || ans.length === 0) {
          this.showToast('Vui lòng chọn ít nhất một lựa chọn!', 'warning');
          return;
        }
      } else {
        if (ans === undefined || ans === null || String(ans).trim() === '') {
          this.showToast('Vui lòng hoàn thành câu hỏi bắt buộc này!', 'warning');
          return;
        }
      }
    }

    // Nhắc nhở nếu hoàn thành quá nhanh khi nộp bài lần đầu
    if (!session.isEditing) {
      const minSafeDuration = Math.max(5, Math.floor((session.minTimeSec || 15) * 0.7));
      if (session.durationSec < minSafeDuration) {
        const waitSec = minSafeDuration - session.durationSec;
        this.showToast(`Bạn hoàn thành khá nhanh! Vui lòng dành thêm ${waitSec} giây rà soát lại để đảm bảo chất lượng phản hồi nhé.`, 'warning');
        return;
      }
    }

    if (session.timerId) clearInterval(session.timerId);

    this.showToast('Đang gửi bài và ghi nhận...', 'info');

    try {
      const res = await this.api(`/surveys/${session.surveyId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: session.answers,
          duration_sec: session.durationSec,
          device_fingerprint: this.getDeviceFingerprint()
        })
      });

      if (res.success) {
        this.haptic('success');
        localStorage.removeItem('survhub_active_session'); localStorage.removeItem('vibesurvey_active_session');
        const surveyId = session.surveyId;
        const isEditing = session.isEditing;
        this.state.activeSession = null;

        if (res.newPointBalance !== undefined && this.state.currentUser) {
          this.state.currentUser.point_balance = res.newPointBalance;
        }
        this.applyUserInterface();

        if (isEditing || res.is_updated) {
          this.showToast('Cập nhật câu trả lời thành công!', 'success');
          await this.navigate('review-survey', { surveyId });
          return;
        }

        const surveyDetail = session.survey || {};
        const allowView = surveyDetail.allow_view_response !== 0;
        const allowEdit = surveyDetail.allow_edit_response === 1;

        this.showModal({
          title: 'Hoàn Thành Khảo Sát',
          content: `
            <div class="space-y-4 text-center py-2">
              <div class="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-stone-800 text-orange-600 flex items-center justify-center mx-auto shadow-xs">
                <i data-lucide="award" class="w-7 h-7 stroke-[2]"></i>
              </div>
              <div>
                <h4 class="text-base font-bold text-slate-900 dark:text-white">${res.message || 'Cảm ơn bạn đã hoàn thành khảo sát!'}</h4>
                ${res.qualityScore ? `<p class="text-xs text-slate-500 mt-1">Chất lượng phản hồi: <strong class="text-orange-600 font-bold font-mono">${res.qualityScore}/100</strong></p>` : ''}
              </div>

              ${res.pointsEarned > 0 ? `
                <div class="p-3.5 bg-orange-50/50 dark:bg-stone-800 border border-orange-200/80 dark:border-stone-700 rounded-xl text-xs flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Điểm thưởng đã cộng:</span>
                  <span class="text-orange-600 font-mono text-sm">+${res.pointsEarned.toLocaleString()} Point</span>
                </div>
              ` : ''}

              <!-- Nút chuẩn Google / Microsoft Forms -->
              <div class="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                ${allowView ? `
                  <button type="button" onclick="VibeApp.closeModal(); VibeApp.navigate('review-survey', { surveyId: '${surveyId}' })" 
                          class="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95">
                    <i data-lucide="file-text" class="w-4 h-4 text-orange-600"></i>
                    <span>Xem lại câu trả lời của bạn</span>
                  </button>
                ` : ''}
                
                ${allowEdit ? `
                  <button type="button" onclick="VibeApp.closeModal(); VibeApp.startSurveySession('${surveyId}')" 
                          class="w-full py-2.5 px-4 rounded-xl border border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                    <span>Chỉnh sửa câu trả lời của bạn</span>
                  </button>
                ` : ''}

                <button type="button" onclick="VibeApp.closeModal(); VibeApp.navigate('surveys')" 
                        class="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95">
                  Khám Phá Khảo Sát Khác
                </button>
              </div>
            </div>
          `
        });
      }
    } catch (err) {
      this.showToast(err.message || 'Lỗi khi nộp bài khảo sát', 'error');
    }
  },

  async renderReviewSurveyView(root, surveyId) {
    this.haptic('light');
    try {
      root.innerHTML = `
        <div class="max-w-3xl mx-auto py-12 text-center text-stone-400 text-xs">
          <span class="animate-spin inline-block w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full mb-3"></span>
          <div>Đang tải câu trả lời của bạn...</div>
        </div>
      `;

      const res = await this.api('/surveys/' + surveyId);
      if (!res.success || !res.survey) {
        this.showToast('Không thể tải thông tin khảo sát', 'error');
        this.navigate('surveys');
        return;
      }

      const survey = res.survey;
      const questions = res.questions || [];
      const userResponse = res.userResponse;

      if (!userResponse) {
        root.innerHTML = `
          <div class="max-w-md mx-auto py-16 text-center space-y-4">
            <div class="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
              <i data-lucide="help-circle" class="w-6 h-6"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-base font-bold text-stone-900 dark:text-white">Bạn chưa làm khảo sát này</h3>
              <p class="text-xs text-stone-500">Hãy tham gia trả lời để tích lũy điểm thưởng nhé!</p>
            </div>
            <button onclick="VibeApp.startSurveySession('${surveyId}')" class="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs">
              Bắt Đầu Làm Bài
            </button>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const userAnswers = userResponse.answers || {};
      const allowEdit = survey.allow_edit_response === 1;

      root.innerHTML = `
        <div class="max-w-3xl mx-auto px-4 py-8 space-y-6">
          ${survey.cover_image_url ? `
            <div class="w-full h-40 sm:h-52 rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 shadow-sm">
              <img src="${survey.cover_image_url}" alt="Ảnh bìa khảo sát" class="w-full h-full object-cover" onerror="this.parentElement.style.display='none'">
            </div>
          ` : ''}
          <!-- Header Tóm Tắt Bài Làm -->
          <div class="bento-card p-6 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                  <span>${userResponse.edited_at ? 'Đã chỉnh sửa phản hồi' : 'Đã nộp bài thành công'}</span>
                </span>
                <span class="text-xs text-stone-400 font-mono">
                  ${userResponse.submitted_at || 'Đã ghi nhận'}
                </span>
              </div>

              <div class="flex items-center gap-2">
                ${allowEdit ? `
                  <button onclick="VibeApp.startSurveySession('${surveyId}')" 
                          class="py-2 px-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    <span>Chỉnh sửa câu trả lời</span>
                  </button>
                ` : ''}
                <button onclick="VibeApp.navigate('surveys')" 
                        class="py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all">
                  Quay lại
                </button>
              </div>
            </div>

            <div class="space-y-1">
              <h1 class="text-xl sm:text-2xl font-black text-stone-900 dark:text-white leading-tight">
                ${this.escapeHtml(survey.title)}
              </h1>
              ${survey.description ? `<p class="text-xs text-stone-500 leading-relaxed">${this.escapeHtml(survey.description)}</p>` : ''}
            </div>

            <div class="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2">
              <i data-lucide="info" class="w-4 h-4 text-orange-600 shrink-0"></i>
              <span>Dưới đây là bản sao câu trả lời bạn đã gửi. ${allowEdit ? 'Bạn có thể chỉnh sửa lại câu trả lời bất kỳ lúc nào nếu biểu mẫu còn mở.' : 'Người tạo form không bật tùy chọn chỉnh sửa sau khi gửi.'}</span>
            </div>
          </div>

          <!-- Danh Sách Câu Trả Lời (Read-only) -->
          <div class="space-y-4">
            ${questions.map((q, idx) => {
        if (q.type === 'SECTION_HEADER') {
          return `
                  <div class="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border-l-4 border-orange-600 space-y-1">
                    <h3 class="text-sm font-black text-stone-900 dark:text-white">${this.escapeHtml(q.content)}</h3>
                    ${q.description ? `<p class="text-xs text-stone-500">${this.escapeHtml(q.description)}</p>` : ''}
                  </div>
                `;
        }
        if (q.type === 'VIDEO_BLOCK') {
          return '';
        }

        const ans = userAnswers[q.id] !== undefined ? userAnswers[q.id] : userAnswers[q.order_index];
        const hasAnswer = ans !== undefined && ans !== null && String(ans).trim() !== '' && (!Array.isArray(ans) || ans.length > 0);

        return `
                <div class="bento-card p-5 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <h4 class="text-xs sm:text-sm font-bold text-stone-900 dark:text-white leading-snug">
                      <span class="text-orange-600 mr-1">Câu ${idx + 1}:</span> ${q.content}
                      ${q.is_required ? '<span class="text-orange-500 ml-1">*</span>' : ''}
                    </h4>
                  </div>

                  <!-- Khối hiển thị đáp án -->
                  <div class="pt-1">
                    ${!hasAnswer ? `
                      <span class="text-xs italic text-stone-400">Không trả lời (để trống)</span>
                    ` : Array.isArray(ans) ? `
                      <div class="flex flex-wrap gap-1.5">
                        ${ans.map(item => `
                          <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-semibold">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            <span>${item}</span>
                          </span>
                        `).join('')}
                      </div>
                    ` : (typeof ans === 'object' && ans !== null) ? `
                      <!-- Dạng ma trận Grid -->
                      <div class="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                        ${Object.entries(ans).map(([rowKey, colVal]) => `
                          <div class="p-2.5 flex items-center justify-between gap-2 bg-stone-50/50 dark:bg-stone-800/30">
                            <span class="font-bold text-stone-700 dark:text-stone-300">${rowKey}</span>
                            <span class="px-2.5 py-1 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold text-orange-600 dark:text-orange-400">
                              ${Array.isArray(colVal) ? colVal.join(', ') : colVal}
                            </span>
                          </div>
                        `).join('')}
                      </div>
                    ` : `
                      <div class="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200">
                        ${String(ans)}
                      </div>
                    `}
                  </div>
                </div>
              `;
      }).join('')}
          </div>

          <!-- Bottom Actions -->
          <div class="pt-4 flex items-center justify-between gap-3">
            <button onclick="VibeApp.navigate('surveys')" 
                    class="py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all">
              Quay lại danh sách khảo sát
            </button>
            ${allowEdit ? `
              <button onclick="VibeApp.startSurveySession('${surveyId}')" 
                      class="py-2.5 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
                <span>Chỉnh sửa câu trả lời</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      this.showToast('Lỗi tải bài làm: ' + err.message, 'error');
      this.navigate('surveys');
    }
  },

  // ==================== VIEW: TAB HỒ SƠ & XÁC THỰC (DEMOGRAPHICS, STUDENT .EDU.VN, ENTERPRISE) ====================
  async renderProfileView(root) {
    if (!this.state.currentUser) {
      this.renderGuestLockedView(root, 'Hồ Sơ Tài Khoản', 'Vui lòng đăng nhập để xem và quản lý khảo sát cũng như cập nhật thông tin hồ sơ của bạn.');
      return;
    }

    // 1. Lấy thông tin user mới nhất từ server
    try {
      const meRes = await this.api('/auth/me');
      if (meRes && meRes.user) {
        this.state.currentUser = meRes.user;
      }
    } catch (e) { }

    const user = this.state.currentUser;
    const isEnterprise = user.account_tier === 'ENTERPRISE' ||
      user.role === 'CREATOR' ||
      this.state.adminMode === 'CREATOR' ||
      this.state.adminViewMode === 'CREATOR';
    const enterpriseLevel = Number(user.enterprise_verify_level || user.enterprise_level || 0);
    const isEnterpriseLevel2 = enterpriseLevel >= 2;
    const isEnterpriseLevel1 = enterpriseLevel >= 1;
    const isStudentVerified = (user.is_student_verified === 1 || user.account_tier === 'STUDENT') && !isEnterprise;

    // Chuẩn hóa profileTab sang 3 phân hệ chính (Không tràn màn hình, 0% trượt ngang)
    if (!this.state.profileTab || ['demographics', 'reputation'].includes(this.state.profileTab)) {
      this.state.profileTab = 'overview';
    } else if (['created-forms', 'filled-forms'].includes(this.state.profileTab)) {
      this.state.profileTab = 'surveys';
    } else if (!['overview', 'surveys', 'forum-posts', 'STUDENT', 'ENTERPRISE'].includes(this.state.profileTab)) {
      this.state.profileTab = 'overview';
    }

    let demographics = {};
    if (user.demographics_json) {
      try { demographics = JSON.parse(user.demographics_json); } catch (e) { }
    }

    let enterpriseProfile = {};
    if (user.enterprise_profile_json) {
      try { enterpriseProfile = JSON.parse(user.enterprise_profile_json); } catch (e) { }
    }
    enterpriseProfile = {
      brand_name: enterpriseProfile.brand_name || user.brand_name || '',
      industry: enterpriseProfile.industry || user.industry || '',
      website_url: enterpriseProfile.website_url || user.website_url || '',
      contact_phone: enterpriseProfile.contact_phone || user.contact_phone || '',
      company_legal_name: enterpriseProfile.company_legal_name || user.company_legal_name || '',
      tax_id: enterpriseProfile.tax_id || user.tax_id || '',
      headquarters_address: enterpriseProfile.headquarters_address || user.headquarters_address || '',
      invoice_email: enterpriseProfile.invoice_email || user.invoice_email || ''
    };

    const isLocked = user.demographic_locked_until && (new Date(user.demographic_locked_until).getTime() > Date.now());
    const lockDateStr = isLocked ? new Date(user.demographic_locked_until).toLocaleDateString('vi-VN') : '';

    // 2. LIÊN KẾT 100% REAL DATA: Lấy danh sách khảo sát đã tạo, đã tham gia và bài viết từ Backend
    let myCreatedSurveys = [];
    let myParticipatedSurveys = [];
    let myPosts = [];

    try {
      const [creatorRes, historyRes, postsRes] = await Promise.all([
        this.api('/surveys/creator').catch(() => ({ surveys: [] })),
        this.api('/surveys/history').catch(() => ({ history: [] })),
        (this.state.forumPosts && this.state.forumPosts.length > 0)
          ? Promise.resolve({ posts: this.state.forumPosts })
          : this.api('/forum/posts').catch(() => ({ posts: [] }))
      ]);

      if (creatorRes && Array.isArray(creatorRes.surveys)) {
        myCreatedSurveys = creatorRes.surveys;
      } else if (this.state.surveys) {
        myCreatedSurveys = this.state.surveys.filter(s => s.creator_id === user.id || s.author_id === user.id);
      }

      if (historyRes && Array.isArray(historyRes.history)) {
        myParticipatedSurveys = historyRes.history;
      }

      const allPosts = (postsRes && Array.isArray(postsRes.posts)) ? postsRes.posts : (this.state.forumPosts || []);
      this.state.forumPosts = allPosts;
      myPosts = allPosts.filter(p => (p.author && p.author.id === user.id) || p.user_id === user.id || p.author_id === user.id);
    } catch (dataErr) {
      console.warn('Lỗi đồng bộ Real Data cho Hồ sơ:', dataErr);
    }

    if (!this.state.surveySubTab) {
      this.state.surveySubTab = (myCreatedSurveys.length === 0 && myParticipatedSurveys.length > 0) ? 'filled' : 'created';
    }
    const surveySubTab = this.state.surveySubTab;

    const activeTab = this.state.profileTab;
    const trustScore = Number(user.trust_score || 85.0);
    const balanceNum = isEnterprise ? Number(user.credit_balance || 0) : Number(user.point_balance || 0);

    root.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6 pb-20 px-2 sm:px-4">
        
        <!-- HEADER HỒ SƠ TÀI KHOẢN: TIÊU ĐỀ & THÔNG TIN CHÍNH CHUẨN STITCH -->
        <div class="bg-white dark:bg-[#18181B] rounded-3xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-5 relative overflow-hidden">
          <!-- Hiệu ứng gradient mờ phong cách Stitch -->
          <div class="absolute -right-20 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/10 to-orange-500/10 blur-3xl pointer-events-none"></div>
          <div class="absolute right-1/3 -bottom-28 w-80 h-80 rounded-full bg-orange-400/5 blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <!-- Avatar & Nhận diện tài khoản: GIỮ NGUYÊN AVATAR CHỮ MẶC ĐỊNH ĐẸP MẮT KHI CHƯA CÓ ẢNH -->
            <div class="flex items-start sm:items-center gap-4">
              <div class="relative shrink-0">
                <div class="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-600 to-orange-500 p-0.5 shadow-md shadow-orange-600/20">
                  <div id="profile-header-avatar-display" class="w-full h-full rounded-2xl bg-white dark:bg-stone-900 flex items-center justify-center font-black text-2xl text-orange-600 dark:text-orange-400 overflow-hidden">
                    ${user.avatar_url ? `<img src="${user.avatar_url}" alt="${user.name || 'Avatar'}" class="w-full h-full object-cover rounded-2xl" onerror="this.onerror=null;this.parentElement.textContent='${(user.name || 'U').charAt(0).toUpperCase()}';">` : (user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <!-- Nút máy ảnh thay đổi avatar thật -->
                <label for="profile-avatar-file-input" class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center ring-2 ring-white dark:ring-stone-900 shadow-md cursor-pointer transition-all active:scale-95" title="Tải lên ảnh đại diện">
                  <i data-lucide="camera" class="w-3.5 h-3.5"></i>
                  <input type="file" id="profile-avatar-file-input" accept="image/*" class="hidden" onchange="VibeApp.handleProfileAvatarUpload(event)">
                </label>
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <h1 class="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">SurvHub - Thông Tin Tài Khoản & Quản Lý Khảo Sát</h1>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    isEnterprise ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' :
                    (isStudentVerified ? 'bg-[#FFF7ED] text-orange-700 border border-orange-200' : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700')
                  }">
                    ${isEnterprise ? 'Gói Doanh Nghiệp' : (isStudentVerified ? 'Gói Sinh Viên (.EDU.VN)' : 'Người Điền Phổ Thông')}
                  </span>
                </div>
                <div class="flex items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                  <span class="flex items-center gap-1 font-mono"><i data-lucide="mail" class="w-3.5 h-3.5 text-stone-400"></i> ${user.email}</span>
                  <span>•</span>
                  <span class="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300"><i data-lucide="school" class="w-3.5 h-3.5 text-orange-600"></i> ${demographics.university || (user.university || 'Chưa cập nhật trường viện')}</span>
                  <span>•</span>
                  <span class="flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400"><i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i> ${trustScore >= 90 ? 'Đáp viên Xuất Sắc' : 'Đáp viên Tin Cậy'}</span>
                </div>
              </div>
            </div>

            <!-- Nút liên kết phân hệ: Chuẩn hóa phân quyền tuyệt đối -->
            <div class="flex items-center gap-2 self-start sm:self-center shrink-0">
              ${isEnterprise ? `
                <!-- DOANH NGHIỆP: CHỈ HIỂN THỊ NÚT HỒ SƠ DOANH NGHIỆP -->
                <button onclick="VibeApp.switchProfileTab('ENTERPRISE')" class="px-3.5 py-2 rounded-xl text-xs font-bold ${isEnterpriseLevel1 || isEnterpriseLevel2 ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'} transition-all flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="briefcase" class="w-4 h-4"></i>
                  <span>${isEnterpriseLevel2 ? 'Doanh Nghiệp Cấp 2' : (isEnterpriseLevel1 ? 'Doanh Nghiệp Cấp 1' : 'Hồ Sơ Doanh Nghiệp & MST')}</span>
                </button>
              ` : `
                <!-- NGƯỜI ĐIỀN: CHỈ HIỂN THỊ NÚT XÁC THỰC SINH VIÊN (KHÔNG HIỆN DOANH NGHIỆP) -->
                <button onclick="VibeApp.switchProfileTab('STUDENT')" class="px-3.5 py-2 rounded-xl text-xs font-bold ${isStudentVerified ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 border border-orange-200 dark:border-orange-800' : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 border border-orange-200 dark:border-orange-800 hover:bg-orange-100'} transition-all flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                  <span>${isStudentVerified ? 'Gói SV Đã Xác Thực' : 'Xác Thực SV (.edu.vn)'}</span>
                </button>
              `}
            </div>
          </div>

          <!-- 3 THẺ METRIC THỐNG KÊ TÀI KHOẢN THỰC TẾ CHUẨN STITCH -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-stone-100 dark:border-stone-800">
            <!-- Điểm uy tín -->
            <div class="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-2 shadow-xs">
              <div class="flex items-center justify-between text-stone-500 font-bold text-[11px] uppercase tracking-wider">
                <span>Điểm Uy Tín</span>
                <i data-lucide="shield-check" class="w-4 h-4 text-orange-600"></i>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-black font-mono text-orange-600 dark:text-orange-400">${trustScore.toFixed(1)}</span>
                <span class="text-xs font-bold text-stone-400">/ 100</span>
              </div>
              <div class="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-orange-600 to-orange-500 h-full rounded-full" style="width: ${Math.min(100, Math.max(0, trustScore))}%;"></div>
              </div>
            </div>

            <!-- Mẫu miễn phí -->
            <div class="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-2 shadow-xs">
              <div class="flex items-center justify-between text-stone-500 font-bold text-[11px] uppercase tracking-wider">
                <span>Mẫu Miễn Phí</span>
                <i data-lucide="layers" class="w-4 h-4 text-orange-600"></i>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-black font-mono text-stone-900 dark:text-white">${user.free_quota_remaining !== undefined ? user.free_quota_remaining : (user.free_trial_surveys_available || 0)}</span>
                <span class="text-xs font-bold text-stone-400">lượt</span>
              </div>
              <span class="text-[10px] font-bold text-orange-600 dark:text-orange-400">Khóa lưu trong 90 ngày</span>
            </div>

            <!-- Ví xu tích lũy / Số dư tài khoản thực tế -->
            <div class="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-2 shadow-xs">
              <div class="flex items-center justify-between text-stone-500 font-bold text-[11px] uppercase tracking-wider">
                <span>${isEnterprise ? 'Số Dư Khóa Quỹ' : 'Ví Xu Tích Lũy'}</span>
                <i data-lucide="coins" class="w-4 h-4 text-orange-500"></i>
              </div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-2xl font-black font-mono text-stone-900 dark:text-white">${balanceNum.toLocaleString('vi-VN')}</span>
                <span class="text-xs font-extrabold text-orange-600">${isEnterprise ? 'Credit' : 'Xu'}</span>
              </div>
              <span class="text-[10px] font-medium text-stone-500">≈ ${balanceNum.toLocaleString('vi-VN')}đ ${isEnterprise ? 'khả dụng' : 'đổi thưởng'}</span>
            </div>
          </div>
        </div>

        <!-- THANH ĐIỀU HƯỚNG 3 PHÂN HỆ GỘP TINH GỌN (100% VỪA VẶN MỌI THIẾT BỊ, TUYỆT ĐỐI 0% TRƯỢT NGANG) -->
        <div class="grid grid-cols-3 gap-1.5 sm:gap-2 w-full p-1.5 rounded-2xl bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <!-- 1. Hồ Sơ & Đánh Giá Uy Tín -->
          <button type="button" onclick="VibeApp.switchProfileTab('overview')" 
                  class="py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold cursor-pointer ${activeTab === 'overview' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black shadow-xs ring-1 ring-stone-900/5 dark:ring-stone-700/60' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800/50'}">
            <i data-lucide="user-check" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">Hồ Sơ & Uy Tín</span>
          </button>

          <!-- 2. Quản Lý Khảo Sát (Tạo & Điền) -->
          <button type="button" onclick="VibeApp.switchProfileTab('surveys')" 
                  class="py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold cursor-pointer ${activeTab === 'surveys' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black shadow-xs ring-1 ring-stone-900/5 dark:ring-stone-700/60' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800/50'}">
            <i data-lucide="clipboard-list" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">Quản Lý Khảo Sát</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${activeTab === 'surveys' ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400' : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}">${myCreatedSurveys.length + myParticipatedSurveys.length}</span>
          </button>

          <!-- 3. Bài Viết Diễn Đàn -->
          <button type="button" onclick="VibeApp.switchProfileTab('forum-posts')" 
                  class="py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold cursor-pointer ${activeTab === 'forum-posts' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black shadow-xs ring-1 ring-stone-900/5 dark:ring-stone-700/60' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800/50'}">
            <i data-lucide="messages-square" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">Bài Viết Diễn Đàn</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${activeTab === 'forum-posts' ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400' : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}">${myPosts.length}</span>
          </button>
        </div>

        <!-- PHÂN HỆ 1: HỒ SƠ & UY TÍN (GỘP BENTO ĐÁNH GIÁ VÀ FORM NHÂN KHẨU HỌC LIỀN MẠCH) -->
        <div id="profile-tab-overview" class="${activeTab === 'overview' ? '' : 'hidden'} space-y-8">
          
          <!-- KHỐI 1: BENTO ĐÁNH GIÁ CHẤT LƯỢNG & MỨC ĐỘ UY TÍN -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span class="text-[11px] font-black uppercase tracking-wider text-orange-600 block mb-0.5">Huy Hiệu & Đạo Đức Nghiên Cứu</span>
                <h2 class="text-xl font-black text-stone-900 dark:text-white tracking-tight">Đánh Giá & Mức Độ Uy Tín Tài Khoản</h2>
              </div>
              <div class="flex items-center gap-2 text-xs text-stone-500">
                <i data-lucide="shield-check" class="w-4 h-4 text-orange-600"></i>
                <span>Chỉ số tin cậy đo lường qua hệ thống kiểm duyệt Anti-Fraud</span>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <!-- Cột trái: Visual Metrics Bento -->
              <div class="lg:col-span-5 flex flex-col gap-4">
                <div class="bg-white dark:bg-[#18181B] p-6 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col gap-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold uppercase text-stone-500 tracking-wider">Chỉ Số Chất Lượng Đáp Viên</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 text-[10px] font-extrabold">Xác minh AI</span>
                  </div>

                  <!-- SVG Circular Gauge & Rating sao thật -->
                  <div class="flex items-center gap-5 py-2">
                    <div class="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path class="text-stone-100 dark:text-stone-800 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-width="3.5"></path>
                        <path class="text-orange-600 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-dasharray="${trustScore}, 100" stroke-linecap="round" stroke-width="3.5"></path>
                      </svg>
                      <div class="absolute flex flex-col items-center">
                        <span class="text-xl font-black text-stone-900 dark:text-white font-mono">${trustScore.toFixed(1)}%</span>
                        <span class="text-[10px] uppercase font-bold text-stone-500">Chính trực</span>
                      </div>
                    </div>

                    <div class="space-y-1">
                      <div class="flex items-center gap-1 text-orange-500">
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                        <span class="text-sm font-black text-stone-900 dark:text-white ml-1 font-mono">5.0 / 5</span>
                      </div>
                      <p class="text-xs text-stone-500 leading-relaxed">
                        Dựa trên <strong>${myParticipatedSurveys.length} đề tài</strong> đã hoàn thành và nghiệm thu câu trả lời.
                      </p>
                    </div>
                  </div>

                  <!-- 2 Thanh tiến độ chuẩn Stitch -->
                  <div class="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                    <div>
                      <div class="flex justify-between text-xs font-semibold mb-1">
                        <span class="text-stone-600 dark:text-stone-400">Vượt câu hỏi kiểm tra độ chú ý (Attention-check)</span>
                        <span class="font-bold text-orange-600 font-mono">100%</span>
                      </div>
                      <div class="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-orange-600 h-full w-full rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <div class="flex justify-between text-xs font-semibold mb-1">
                        <span class="text-stone-600 dark:text-stone-400">Thời gian làm bài khảo sát chuẩn định mức (Không speed-run)</span>
                        <span class="font-bold text-orange-600 font-mono">100%</span>
                      </div>
                      <div class="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-orange-500 h-full w-full rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 3 Huy hiệu bảo trợ học thuật -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 space-y-1.5 shadow-xs">
                    <div class="flex items-center gap-1.5 text-orange-600">
                      <i data-lucide="award" class="w-4 h-4"></i>
                      <h4 class="text-xs font-extrabold text-stone-900 dark:text-white">Đáp Viên Vàng</h4>
                    </div>
                    <p class="text-[11px] text-stone-500 leading-relaxed">Hoàn thành các đề tài không vi phạm bẫy chú ý.</p>
                  </div>

                  <div class="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 space-y-1.5 shadow-xs">
                    <div class="flex items-center gap-1.5 text-orange-600">
                      <i data-lucide="check-circle" class="w-4 h-4"></i>
                      <h4 class="text-xs font-extrabold text-stone-900 dark:text-white">Định Danh Edu</h4>
                    </div>
                    <p class="text-[11px] text-stone-500 leading-relaxed">${isStudentVerified ? 'Đã xác thực email trường, hợp lệ theo quy chuẩn bảo trợ.' : 'Kích hoạt xác thực email sinh viên để mở khóa.'}</p>
                  </div>

                  <div class="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 space-y-1.5 shadow-xs">
                    <div class="flex items-center gap-1.5 text-zinc-600">
                      <i data-lucide="activity" class="w-4 h-4"></i>
                      <h4 class="text-xs font-extrabold text-stone-900 dark:text-white">Chuẩn Cronbach</h4>
                    </div>
                    <p class="text-[11px] text-stone-500 leading-relaxed">Hệ số tin cậy đạt tiêu chuẩn phân tích định lượng.</p>
                  </div>
                </div>
              </div>

              <!-- Cột phải: Danh sách nhận xét học thuật thực tế -->
              <div class="lg:col-span-7 flex flex-col gap-4">
                <div class="bg-white dark:bg-[#18181B] p-6 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col gap-4 h-full">
                  <div class="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                    <h3 class="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">Nhận Xét Từ Các Chủ Đề Tài Nghiên Cứu</h3>
                    <span class="text-[10px] font-black uppercase text-stone-400">Mới nhất</span>
                  </div>

                  ${myParticipatedSurveys.length > 0 ? myParticipatedSurveys.slice(0, 4).map(item => `
                    <div class="bg-stone-50/80 dark:bg-stone-900/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-2">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 font-bold text-xs flex items-center justify-center">
                            ${(item.creator_name || 'NC').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span class="text-xs font-black text-stone-900 dark:text-white">${item.creator_name || 'Chủ nhiệm đề tài'}</span>
                            <span class="text-[11px] text-stone-500 block">${item.survey_title || 'Đề tài khảo sát'}</span>
                          </div>
                        </div>
                        <div class="flex items-center text-orange-500 text-xs font-bold gap-0.5">
                          <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
                          <span class="font-mono">5.0</span>
                        </div>
                      </div>
                      <p class="text-xs text-stone-600 dark:text-stone-400 italic leading-relaxed">
                        "Phản hồi đã hoàn thành đầy đủ, đúng thời lượng quy định và được đối soát qua hệ thống Anti-Fraud. Đã nghiệm thu và chi trả ${item.points_rewarded || 0} xu vào ví."
                      </p>
                    </div>
                  `).join('') : `
                    <div class="p-8 text-center bg-stone-50/60 dark:bg-stone-900/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-500 space-y-2 my-auto">
                      <i data-lucide="message-square" class="w-6 h-6 mx-auto text-stone-400"></i>
                      <p class="font-medium">Chưa có nhận xét từ chủ nhiệm đề tài.</p>
                      <p class="text-[11px] text-stone-400">Hãy tham gia điền các bài khảo sát để tích lũy nhận xét uy tín và điểm thưởng.</p>
                      <button onclick="VibeApp.navigate('surveys')" class="mt-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs">
                        Khám Phá Khảo Sát Ngay
                      </button>
                    </div>
                  `}
                </div>
              </div>
            </div>
          </div>

          <!-- KHỐI 2: FORM THÔNG TIN NHÂN KHẨU HỌC (THIẾT KẾ THOÁNG ĐÃNG, RỘNG RÃI) -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span class="text-[11px] font-black uppercase tracking-wider text-orange-600 block mb-0.5">Hồ Sơ Nghiên Cứu</span>
                <h2 class="text-xl font-black text-stone-900 dark:text-white tracking-tight">Thông Tin Cá Nhân & Nhân Khẩu Học</h2>
              </div>
              <div class="bg-orange-50/80 dark:bg-orange-950/30 px-4 py-2.5 rounded-2xl border border-orange-200/80 dark:border-orange-900/40 flex items-center gap-2.5 text-xs text-orange-900 dark:text-orange-200 shadow-2xs">
                <i data-lucide="shield-check" class="w-4 h-4 text-orange-600 shrink-0"></i>
                <span>Hoàn thiện 100% hồ sơ để mở khóa thêm lượt mẫu miễn phí. Thông tin cốt lõi khóa 90 ngày.</span>
              </div>
            </div>

            ${isLocked ? `
              <div class="p-4 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-2xl text-xs text-orange-900 dark:text-orange-200 flex items-center gap-3 shadow-xs">
                <i data-lucide="lock" class="w-5 h-5 text-orange-600 shrink-0"></i>
                <span>Hồ sơ nhân khẩu học đang được khóa an toàn đến ngày <strong>${lockDateStr}</strong> (Khóa 90 ngày sau khi lưu để đảm bảo tính khách quan của dữ liệu nghiên cứu thị trường).</span>
              </div>
            ` : ''}

            <div class="bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 sm:p-9 shadow-xs space-y-9">
              <!-- SECTION A: THÔNG TIN CÁ NHÂN & NƠI SINH SỐNG -->
              <div class="space-y-5">
                <div class="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800 text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  <i data-lucide="user" class="w-4 h-4 text-orange-600"></i>
                  <span>A. Thông tin cá nhân & Địa bàn sinh sống</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-7">
                  <!-- 1. Giới tính -->
                  <div class="relative space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Giới tính: *</label>
                    <input type="hidden" id="demo-gender" value="${demographics.gender || 'MALE'}">
                    <button type="button" ${isLocked ? 'disabled' : ''} onclick="VibeApp.toggleCustomDropdown('demo-gender-menu', event)"
                            class="custom-dropdown-trigger w-full h-12 flex items-center justify-between px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 hover:border-orange-500 transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                      <span id="demo-gender-label">${demographics.gender === 'FEMALE' ? 'Nữ' : (demographics.gender === 'OTHER' ? 'Khác / Không tiết lộ' : 'Nam')}</span>
                      <i data-lucide="chevron-down" class="dropdown-trigger-icon w-4 h-4 stroke-[2] text-stone-400 transition-transform duration-200 pointer-events-none"></i>
                    </button>
                    ${!isLocked ? `
                      <div id="demo-gender-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                        <div onclick="VibeApp.selectCustomFormOption('demo-gender', 'MALE', 'Nam', event)" class="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">
                          <span>Nam</span>
                        </div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-gender', 'FEMALE', 'Nữ', event)" class="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">
                          <span>Nữ</span>
                        </div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-gender', 'OTHER', 'Khác / Không tiết lộ', event)" class="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">
                          <span>Khác / Không tiết lộ</span>
                        </div>
                      </div>
                    ` : ''}
                  </div>

                  <!-- 2. Ngày sinh -->
                  <div class="space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Ngày sinh: *</label>
                    <input type="date" id="demo-birthdate" value="${demographics.birth_date || '2003-08-15'}" ${isLocked ? 'disabled' : ''}
                           class="w-full h-12 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                  </div>

                  <!-- 3. Tỉnh / Thành phố sinh sống (34 Tỉnh Thành Mới) -->
                  <div class="relative space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Tỉnh / Thành phố sinh sống (34 Tỉnh Thành Mới): *</label>
                    <input type="hidden" id="demo-province" value="${demographics.province || 'Hà Nội'}">
                    <button type="button" ${isLocked ? 'disabled' : ''} onclick="VibeApp.toggleCustomDropdown('demo-province-menu', event)"
                            class="custom-dropdown-trigger w-full h-12 flex items-center justify-between px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 hover:border-orange-500 transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                      <span id="demo-province-label">${demographics.province || 'Hà Nội'}</span>
                      <i data-lucide="chevron-down" class="dropdown-trigger-icon w-4 h-4 stroke-[2] text-stone-400 transition-transform duration-200 pointer-events-none"></i>
                    </button>
                    ${!isLocked ? `
                      <div id="demo-province-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto no-scrollbar p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                        ${(window.VIBE_34_PROVINCES || ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Quảng Ninh', 'Huế', 'Bắc Ninh', 'Bình Dương', 'Đồng Nai']).map(p => `
                          <div onclick="VibeApp.selectCustomFormOption('demo-province', '${p}', '${p}', event)" 
                               class="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 ${demographics.province === p ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                            <span>${p}</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>

                  <!-- 4. Mức thu nhập hàng tháng -->
                  <div class="relative space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Mức thu nhập hàng tháng: *</label>
                    <input type="hidden" id="demo-income" value="${demographics.monthly_income || (user.monthly_income || 'Dưới 5 triệu VNĐ')}">
                    <button type="button" ${isLocked ? 'disabled' : ''} onclick="VibeApp.toggleCustomDropdown('demo-income-menu', event)"
                            class="custom-dropdown-trigger w-full h-12 flex items-center justify-between px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 hover:border-orange-500 transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                      <span id="demo-income-label">${demographics.monthly_income || user.monthly_income || 'Dưới 5 triệu VNĐ'}</span>
                      <i data-lucide="chevron-down" class="dropdown-trigger-icon w-4 h-4 stroke-[2] text-stone-400 transition-transform duration-200 pointer-events-none"></i>
                    </button>
                    ${!isLocked ? `
                      <div id="demo-income-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                        <div onclick="VibeApp.selectCustomFormOption('demo-income', 'Dưới 5 triệu VNĐ', 'Dưới 5 triệu VNĐ', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Dưới 5 triệu VNĐ</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-income', 'Từ 5 - 10 triệu VNĐ', 'Từ 5 - 10 triệu VNĐ', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Từ 5 - 10 triệu VNĐ</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-income', 'Từ 10 - 20 triệu VNĐ', 'Từ 10 - 20 triệu VNĐ', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Từ 10 - 20 triệu VNĐ</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-income', 'Trên 20 triệu VNĐ', 'Trên 20 triệu VNĐ', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Trên 20 triệu VNĐ</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>

              <!-- SECTION B: ĐỊNH DANH HỌC THUẬT & CHUYÊN MÔN -->
              <div class="space-y-5 pt-3">
                <div class="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800 text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  <i data-lucide="graduation-cap" class="w-4 h-4 text-orange-600"></i>
                  <span>B. Định danh học thuật & Chuyên môn</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-7">
                  <!-- 5. Nghề nghiệp / Đối tượng -->
                  <div class="relative space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Nghề nghiệp / Đối tượng: *</label>
                    <input type="hidden" id="demo-occupation" value="${demographics.occupation || 'Học sinh / Sinh viên đại học'}">
                    <button type="button" ${isLocked ? 'disabled' : ''} onclick="VibeApp.toggleCustomDropdown('demo-occupation-menu', event)"
                            class="custom-dropdown-trigger w-full h-12 flex items-center justify-between px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 hover:border-orange-500 transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                      <span id="demo-occupation-label">${demographics.occupation || 'Học sinh / Sinh viên đại học'}</span>
                      <i data-lucide="chevron-down" class="dropdown-trigger-icon w-4 h-4 stroke-[2] text-stone-400 transition-transform duration-200 pointer-events-none"></i>
                    </button>
                    ${!isLocked ? `
                      <div id="demo-occupation-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 z-50 mt-1 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                        <div onclick="VibeApp.selectCustomFormOption('demo-occupation', 'Học sinh / Sinh viên đại học', 'Học sinh / Sinh viên đại học', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Học sinh / Sinh viên đại học</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-occupation', 'Học viên cao học / NCS', 'Học viên cao học / NCS', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Học viên cao học / NCS</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-occupation', 'Giảng viên / Nhà nghiên cứu', 'Giảng viên / Nhà nghiên cứu', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Giảng viên / Nhà nghiên cứu</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-occupation', 'Người đi làm (Khối kỹ thuật & kinh tế)', 'Người đi làm (Khối kỹ thuật & kinh tế)', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Người đi làm (Khối kỹ thuật & kinh tế)</div>
                        <div onclick="VibeApp.selectCustomFormOption('demo-occupation', 'Khác', 'Khác', event)" class="px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200">Khác</div>
                      </div>
                    ` : ''}
                  </div>

                  <!-- 6. Trường Đại Học (293 trường) -->
                  <div class="relative space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Trường Đại học / Học Viện / Cao Đẳng: *</label>
                    <div class="relative">
                      <input type="text" id="demo-university" value="${demographics.university || (user.university || '')}" ${isLocked ? 'disabled' : ''} 
                             placeholder="Gõ tìm trường (VD: Bách Khoa, Kinh Tế, FPT, FTU...)"
                             onfocus="VibeApp.filterDemoUniversities(this.value)"
                             oninput="VibeApp.filterDemoUniversities(this.value)"
                             class="w-full h-12 px-4 pr-10 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                      <i data-lucide="search" class="w-4 h-4 text-stone-400 absolute right-3.5 top-4 pointer-events-none"></i>
                    </div>
                    ${!isLocked ? `
                      <div id="demo-uni-popover" class="hidden absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto no-scrollbar p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl space-y-0.5">
                        <div id="demo-uni-dropdown-list" class="space-y-0.5"></div>
                      </div>
                    ` : ''}
                  </div>

                  <!-- 7. Ngành học / Chuyên môn -->
                  <div class="space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Ngành học / Chuyên môn: *</label>
                    <input type="text" id="demo-major" value="${demographics.major || (user.major || '')}" ${isLocked ? 'disabled' : ''} placeholder="VD: Công nghệ thông tin, Marketing..."
                           class="w-full h-12 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                  </div>

                  <!-- 8. Năm tốt nghiệp -->
                  <div class="space-y-2">
                    <label class="block text-xs font-black text-stone-800 dark:text-stone-200">Năm tốt nghiệp (dự kiến): *</label>
                    <input type="number" id="demo-gradyear" value="${demographics.graduation_year || (user.graduation_year || 2026)}" min="1980" max="2035" ${isLocked ? 'disabled' : ''}
                           class="w-full h-12 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 text-xs sm:text-sm font-black font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}">
                  </div>
                </div>
              </div>

              <!-- FOOTER HÀNH ĐỘNG -->
              <div class="pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p class="text-xs text-stone-500 flex items-center gap-1.5">
                  <i data-lucide="lock" class="w-3.5 h-3.5 text-stone-400"></i>
                  <span>Thông tin hồ sơ được bảo mật và mã hóa phục vụ đối soát mẫu khảo sát.</span>
                </p>
                ${!isLocked ? `
                  <button type="button" onclick="VibeApp.saveDemographicsAction()" class="h-12 px-8 rounded-xl bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white text-xs font-black shadow-md shadow-orange-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    <span>Lưu & Cập Nhật Hồ Sơ Nhân Khẩu Học</span>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- PHÂN HỆ 2: QUẢN LÝ KHẢO SÁT (GỘP FORM ĐÃ TẠO VÀ ĐÃ THAM GIA) -->
        <div id="profile-tab-surveys" class="${activeTab === 'surveys' ? '' : 'hidden'} space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="text-[11px] font-black uppercase tracking-wider text-orange-600 block mb-0.5">Dữ Liệu Khảo Sát Của Tôi</span>
              <h2 class="text-xl font-black text-stone-900 dark:text-white tracking-tight">Quản Lý & Theo Dõi Khảo Sát</h2>
            </div>

            <!-- Segmented Sub-Toggle: Chuyển đổi giữa Đã Tạo và Đã Tham Gia -->
            <div class="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs font-bold shrink-0 self-start sm:self-center shadow-2xs">
              <button type="button" onclick="VibeApp.switchSurveySubTab('created')" 
                      class="py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${surveySubTab === 'created' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black shadow-xs ring-1 ring-stone-900/5' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}">
                <i data-lucide="file-plus" class="w-3.5 h-3.5"></i>
                <span>Form Đã Tạo (${myCreatedSurveys.length})</span>
              </button>
              <button type="button" onclick="VibeApp.switchSurveySubTab('filled')" 
                      class="py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${surveySubTab === 'filled' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black shadow-xs ring-1 ring-stone-900/5' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                <span>Đã Tham Gia (${myParticipatedSurveys.length})</span>
              </button>
            </div>
          </div>

          <!-- PHÂN MỤC A: KHẢO SÁT ĐÃ TẠO -->
          <div id="survey-subview-created" class="${surveySubTab === 'created' ? '' : 'hidden'} space-y-5">
            <div class="flex items-center justify-between">
              <p class="text-xs text-stone-500">Các bài khảo sát bạn đã thiết lập để thu thập mẫu từ cộng đồng.</p>
              <button onclick="VibeApp.navigate('create-survey')" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>+ Tạo Khảo Sát Mới</span>
              </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
              ${myCreatedSurveys.length > 0 ? myCreatedSurveys.map(s => {
                const curr = s.collected_responses || s.current_responses || 0;
                const target = s.target_responses || 100;
                const pct = Math.min(100, Math.round((curr / target) * 100));
                const isCompleted = s.status === 'COMPLETED' || curr >= target;
                return `
                  <div class="bg-white dark:bg-[#18181B] rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col justify-between gap-4 group hover:shadow-md transition-all">
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${isCompleted ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400'}">
                            ${isCompleted ? 'Đã hoàn thành 100%' : 'Đang thu thập'}
                          </span>
                          <span class="bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            ${s.category || 'Nghiên cứu học thuật'}
                          </span>
                        </div>
                        <span class="text-[11px] text-stone-400">${s.created_at ? new Date(s.created_at).toLocaleDateString('vi-VN') : ''}</span>
                      </div>
                      <h3 class="text-sm font-black text-stone-900 dark:text-white group-hover:text-orange-600 transition-colors">
                        ${s.title}
                      </h3>
                      <p class="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        ${s.description || 'Khảo sát phục vụ nghiên cứu thực tế trên SurvHub.'}
                      </p>
                      <div class="space-y-1">
                        <div class="flex justify-between text-xs font-semibold">
                          <span class="text-stone-500">Tiến độ phản hồi: <strong class="text-stone-900 dark:text-white font-mono">${curr} / ${target} mẫu</strong></span>
                          <span class="${isCompleted ? 'text-orange-600' : 'text-orange-600'} font-bold font-mono">${pct}% ${isCompleted ? 'Đạt' : ''}</span>
                        </div>
                        <div class="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                          <div class="${isCompleted ? 'bg-orange-500' : 'bg-gradient-to-r from-orange-600 to-orange-500'} h-full rounded-full" style="width: ${pct}%;"></div>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                      <div class="flex items-center gap-1.5">
                        <button onclick="VibeApp.navigate('analytics', { surveyId: '${s.id}' })" class="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer">
                          <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i>
                          <span>Báo cáo</span>
                        </button>
                        <button onclick="VibeApp.navigate('create-survey', { editId: '${s.id}' })" class="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer">
                          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                          <span>Sửa</span>
                        </button>
                      </div>
                      <!-- Nút XÓA KHẢO SÁT THẬT HOẠT ĐỘNG HOÀN TOÀN -->
                      <button onclick="VibeApp.deleteSurveyAction('${s.id}')" class="px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer" title="Xóa vĩnh viễn bài khảo sát này">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('') : `
                <div class="col-span-1 lg:col-span-2 p-12 text-center bg-white dark:bg-[#18181B] rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 space-y-3">
                  <i data-lucide="file-plus" class="w-8 h-8 mx-auto text-stone-400"></i>
                  <h4 class="text-sm font-bold text-stone-900 dark:text-white">Bạn chưa tạo bài khảo sát nào</h4>
                  <p class="text-xs text-stone-500 max-w-sm mx-auto">Tạo bài khảo sát đầu tiên để thu thập phản hồi chuẩn xác cho đề tài của bạn ngay hôm nay.</p>
                  <button onclick="VibeApp.navigate('create-survey')" class="mt-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs">
                    + Tạo Khảo Sát Mới
                  </button>
                </div>
              `}
            </div>
          </div>

          <!-- PHÂN MỤC B: KHẢO SÁT ĐÃ THAM GIA -->
          <div id="survey-subview-filled" class="${surveySubTab === 'filled' ? '' : 'hidden'} space-y-4">
            <div class="bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs overflow-hidden">
              ${myParticipatedSurveys.length > 0 ? `
                <div class="overflow-x-auto no-scrollbar">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-stone-50 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 font-black uppercase tracking-wider border-b border-stone-100 dark:border-stone-800">
                      <tr>
                        <th class="py-3.5 px-5">Tên đề tài khảo sát</th>
                        <th class="py-3.5 px-4">Đơn vị / Tác giả</th>
                        <th class="py-3.5 px-4">Thời gian nạp</th>
                        <th class="py-3.5 px-4">Thưởng Xu</th>
                        <th class="py-3.5 px-4">Trạng thái duyệt</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
                      ${myParticipatedSurveys.map(item => `
                        <tr class="hover:bg-stone-50/50 dark:hover:bg-stone-900/40 transition-colors">
                          <td class="py-3.5 px-5 font-semibold text-stone-900 dark:text-white max-w-xs">
                            <div class="font-bold text-stone-900 dark:text-white">${item.survey_title || 'Đề tài khảo sát'}</div>
                            <span class="text-stone-400 text-[11px]">Thời gian làm bài: ${item.duration_sec ? Math.round(item.duration_sec / 60) + ' phút' : 'N/A'}</span>
                          </td>
                          <td class="py-3.5 px-4 text-stone-500">${item.creator_name || item.brand_name || 'Chủ nhiệm đề tài'}</td>
                          <td class="py-3.5 px-4 text-stone-500">${item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('vi-VN') : 'Mới đây'}</td>
                          <td class="py-3.5 px-4 font-black font-mono text-orange-600 dark:text-orange-400">+${item.points_rewarded || 0} Xu</td>
                          <td class="py-3.5 px-4">
                            <span class="inline-flex items-center gap-1 ${item.response_status === 'REJECTED' ? 'text-orange-600 bg-orange-50 dark:bg-orange-950/60' : 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60'} font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                              <i data-lucide="${item.response_status === 'REJECTED' ? 'x-circle' : 'check-circle'}" class="w-3.5 h-3.5"></i>
                              ${item.response_status === 'REJECTED' ? 'Bị từ chối' : 'Đã nghiệm thu'}
                            </span>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="p-12 text-center space-y-3">
                  <i data-lucide="check-circle-2" class="w-8 h-8 mx-auto text-stone-400"></i>
                  <h4 class="text-sm font-bold text-stone-900 dark:text-white">Bạn chưa tham gia bài khảo sát nào</h4>
                  <p class="text-xs text-stone-500 max-w-sm mx-auto">Khám phá các đề tài đang cần người điền để đóng góp ý kiến và nhận thưởng điểm ngay.</p>
                  <button onclick="VibeApp.navigate('surveys')" class="mt-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs">
                    Xem Danh Sách Khảo Sát
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- PHÂN HỆ 3: BÀI VIẾT TRÊN DIỄN ĐÀN -->
        <div id="profile-tab-forum-posts" class="${activeTab === 'forum-posts' ? '' : 'hidden'} space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="text-[11px] font-black uppercase tracking-wider text-orange-600 block mb-0.5">Cộng Đồng Học Thuật</span>
              <h2 class="text-xl font-black text-stone-900 dark:text-white tracking-tight">Các Bài Viết Đã Đăng Trên Diễn Đàn (${myPosts.length})</h2>
            </div>
            <button onclick="VibeApp.openCreateForumPostModal()" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>+ Đăng Bài Thảo Luận Mới</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${myPosts.length > 0 ? myPosts.map(p => `
              <div class="bg-white dark:bg-[#18181B] p-5 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col justify-between gap-4 group hover:shadow-md transition-all">
                <div class="space-y-2.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-orange-600 font-bold">${p.tag || (p.category ? '#' + p.category : '#ThaoLuan')}</span>
                    <span class="text-stone-400 text-[11px]">${p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                  </div>
                  <h3 class="text-sm font-black text-stone-900 dark:text-white group-hover:text-orange-600 transition-colors leading-snug">
                    ${p.title}
                  </h3>
                  <p class="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                    ${p.content}
                  </p>
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500">
                  <div class="flex items-center gap-3">
                    <span class="flex items-center gap-1 text-orange-600 font-bold"><i data-lucide="heart" class="w-3.5 h-3.5 fill-current"></i> ${(p.likes || []).length || (p.like_count || 0)}</span>
                    <span class="flex items-center gap-1"><i data-lucide="message-square" class="w-3.5 h-3.5"></i> ${(p.comments || []).length || (p.comment_count || 0)}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <!-- Nút XÓA BÀI VIẾT THẬT HOẠT ĐỘNG HOÀN TOÀN -->
                    <button onclick="VibeApp.deleteForumPostAction('${p.id}')" class="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer" title="Xóa bài viết này">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div class="col-span-1 md:col-span-2 lg:col-span-3 p-12 text-center bg-white dark:bg-[#18181B] rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 space-y-3">
                <i data-lucide="messages-square" class="w-8 h-8 mx-auto text-stone-400"></i>
                <h4 class="text-sm font-bold text-stone-900 dark:text-white">Bạn chưa đăng bài viết nào trên diễn đàn</h4>
                <p class="text-xs text-stone-500 max-w-sm mx-auto">Chia sẻ kinh nghiệm làm nghiên cứu khoa học, bẫy khảo sát hoặc trao đổi mẫu điền chéo cùng cộng đồng.</p>
                <button onclick="VibeApp.openCreateForumPostModal()" class="mt-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs">
                  + Đăng Bài Thảo Luận Mới
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- PHÂN HỆ NÂNG CẤP TÀI KHOẢN (GÓI SINH VIÊN / DOANH NGHIỆP) -->
        <div id="profile-tab-STUDENT" class="${activeTab === 'STUDENT' ? '' : 'hidden'} space-y-5">
          <div class="bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-stone-800 text-orange-600 flex items-center justify-center font-bold">
                  <i data-lucide="graduation-cap" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">Đăng Ký Gói Sinh Viên (.edu.vn / .ac.vn)</h3>
                  <p class="text-xs text-stone-500">Mở khóa giá sàn sinh viên 400đ-600đ/mẫu và nhận 30 lượt mẫu miễn phí / tháng.</p>
                </div>
              </div>

              ${isStudentVerified ? `
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 flex items-center gap-1.5">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                  Đã Xác Thực
                </span>
              ` : `
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  Chưa Xác Thực
                </span>
              `}
            </div>

            ${isStudentVerified ? `
              <div class="p-4 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl space-y-2 text-xs">
                <div class="font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <i data-lucide="award" class="w-4 h-4"></i>
                  <span>Tài khoản của bạn đã nâng cấp thành công lên GÓI SINH VIÊN!</span>
                </div>
                <p class="text-orange-700 dark:text-orange-300">
                  Email sinh viên đã xác minh: <strong class="font-mono">${user.student_email || user.email}</strong>
                  ${user.student_expires_at ? ` · <span class="text-stone-500 font-normal">Hiệu lực đến: <strong class="font-mono text-orange-800 dark:text-orange-200">${new Date(user.student_expires_at).toLocaleDateString('vi-VN')}</strong></span>` : ''}
                </p>
                <div class="text-[11px] text-stone-500 pt-1">
                  Đặc quyền: 30 lượt miễn phí / tháng (làm mới ngày 01 hằng tháng), hưởng trọn mức giá sàn ưu đãi cho khóa luận/NCKH, thù lao người điền chia 85/15.
                </div>
              </div>
            ` : `
              <div class="space-y-4">
                <p class="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Nhập địa chỉ email trường của bạn (Ví dụ: <code class="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">sinhvien@sis.hust.edu.vn</code>, <code class="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">mssv@st.neu.edu.vn</code>). Hệ thống sẽ gửi mã OTP 6 chữ số để kích hoạt tức thì.
                </p>

                <div class="space-y-2 max-w-md">
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300">Email trường đại học (.edu.vn / .ac.vn):</label>
                  <div class="flex gap-2">
                    <input type="email" id="student-email-input" placeholder="nhap.email@truong.edu.vn"
                           class="flex-1 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono font-bold">
                    <button type="button" id="student-send-otp-btn" onclick="VibeApp.sendStudentEmailOtpAction()" class="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shrink-0 shadow-xs transition-all cursor-pointer">
                      Gửi Mã OTP
                    </button>
                  </div>
                </div>

                <div id="student-otp-section" class="hidden space-y-2 max-w-md pt-2 border-t border-stone-100 dark:border-stone-800">
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300">Nhập mã xác thực OTP 6 số (gửi về email):</label>
                  <div class="flex gap-2">
                    <input type="text" id="student-otp-input" placeholder="VD: 123456" maxlength="6"
                           class="w-36 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-center font-mono font-black text-sm tracking-widest text-orange-600">
                    <button type="button" onclick="VibeApp.verifyStudentEmailOtpAction()" class="py-2.5 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer">
                      Xác Nhận Kích Hoạt Gói SV
                    </button>
                  </div>
                </div>
              </div>
            `}
          </div>
        </div>

        <div id="profile-tab-ENTERPRISE" class="${activeTab === 'ENTERPRISE' ? '' : 'hidden'} space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- CẤP ĐỘ 1: HỒ SƠ THƯƠNG HIỆU CƠ BẢN -->
            <div class="bg-white dark:bg-[#18181B] border ${isEnterpriseLevel1 || isEnterpriseLevel2 ? 'border-orange-500/40' : 'border-stone-200 dark:border-stone-800'} rounded-3xl p-6 shadow-sm space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black flex items-center justify-center font-mono">1</span>
                  <h3 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Cấp Độ 1: Thương Hiệu Cơ Bản</h3>
                </div>
                ${isEnterpriseLevel1 || isEnterpriseLevel2 ? '<span class="text-[10px] font-bold text-orange-600">Đã kích hoạt</span>' : ''}
              </div>

              <p class="text-xs text-stone-500 leading-relaxed">
                Khai báo hồ sơ doanh nghiệp cơ bản để hiển thị Tên thương hiệu đại diện, Website và Số điện thoại liên hệ trên các bài khảo sát.
              </p>

              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Tên thương hiệu / Tổ chức: *</label>
                  <input type="text" id="ent-brand-name" value="${enterpriseProfile.brand_name}" placeholder="VD: Tập đoàn FPT, Vingroup, Masan..."
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Lĩnh vực hoạt động: *</label>
                  <input type="text" id="ent-industry" value="${enterpriseProfile.industry}" placeholder="VD: FMCG, Công nghệ, Bán lẻ, Tài chính..."
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Website chính thức:</label>
                  <input type="url" id="ent-website" value="${enterpriseProfile.website_url}" placeholder="https://company.vn"
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Số điện thoại liên hệ:</label>
                  <input type="text" id="ent-phone" value="${enterpriseProfile.contact_phone}" placeholder="024 xxxx xxxx hoặc hotline"
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold">
                </div>
              </div>

              <button type="button" onclick="VibeApp.saveEnterpriseLevelAction(1)" class="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer">
                Lưu Thông Tin Cấp Độ 1
              </button>
            </div>

            <!-- CẤP ĐỘ 2: PHÁP NHÂN & HÓA ĐƠN VAT ĐỎ -->
            <div class="bg-white dark:bg-[#18181B] border ${isEnterpriseLevel2 ? 'border-orange-500/40' : 'border-stone-200 dark:border-stone-800'} rounded-3xl p-6 shadow-sm space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black flex items-center justify-center font-mono">2</span>
                  <h3 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Cấp Độ 2: Pháp Nhân & Hóa Đơn VAT</h3>
                </div>
                ${isEnterpriseLevel2 ? '<span class="text-[10px] font-bold text-orange-600">Đã xác minh</span>' : ''}
              </div>

              <p class="text-xs text-stone-500 leading-relaxed">
                Khai báo đầy đủ mã số thuế và thông tin pháp nhân để xuất hóa đơn GTGT điện tử (e-Invoice) cho các chiến dịch khảo sát và ký hợp đồng dịch vụ.
              </p>

              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Tên pháp nhân đầy đủ theo ĐKKD: *</label>
                  <input type="text" id="ent-legal-name" value="${enterpriseProfile.company_legal_name}" placeholder="CÔNG TY CỔ PHẦN..."
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Mã số thuế doanh nghiệp (MST): *</label>
                  <input type="text" id="ent-tax-id" value="${enterpriseProfile.tax_id}" placeholder="0101234567"
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono font-bold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Địa chỉ trụ sở chính (theo ĐKKD): *</label>
                  <input type="text" id="ent-address" value="${enterpriseProfile.headquarters_address}" placeholder="Tầng X, Tòa nhà Y, Quận Z, TP..."
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Email nhận hóa đơn điện tử (e-Invoice): *</label>
                  <input type="email" id="ent-invoice-email" value="${enterpriseProfile.invoice_email}" placeholder="ketoan@company.vn"
                         class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono font-bold">
                </div>
              </div>

              <button type="button" onclick="VibeApp.saveEnterpriseLevelAction(2)" class="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold shadow-xs cursor-pointer">
                Xác Thực Pháp Nhân Cấp Độ 2
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    // Khởi tạo icons Lucide
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  switchProfileTab(tabName) {
    this.haptic('selection');
    if (['demographics', 'reputation'].includes(tabName)) {
      this.state.profileTab = 'overview';
    } else if (['created-forms', 'filled-forms'].includes(tabName)) {
      this.state.profileTab = 'surveys';
      this.state.surveySubTab = tabName === 'created-forms' ? 'created' : 'filled';
    } else {
      this.state.profileTab = tabName;
    }
    const root = document.getElementById('app-root');
    this.renderProfileView(root);
  },

  switchSurveySubTab(subTab) {
    this.haptic('selection');
    this.state.surveySubTab = subTab;
    const root = document.getElementById('app-root');
    this.renderProfileView(root);
  },

  // ==================== LƯU THÔNG TIN NHÂN KHẨU HỌC THẬT VÀ BẢO TOÀN DỮ LIỆU ====================
  async saveDemographicsAction() {
    this.haptic('medium');
    const gender = document.getElementById('demo-gender')?.value || 'MALE';
    const birth_date = document.getElementById('demo-birthdate')?.value || '';
    const province = document.getElementById('demo-province')?.value || 'Hà Nội';
    const occupation = document.getElementById('demo-occupation')?.value || 'Học sinh / Sinh viên đại học';
    const university = document.getElementById('demo-university')?.value?.trim() || '';
    const major = document.getElementById('demo-major')?.value?.trim() || '';
    const graduation_year = parseInt(document.getElementById('demo-gradyear')?.value, 10) || 2026;
    const monthly_income = document.getElementById('demo-income')?.value || 'Dưới 5 triệu VNĐ';

    if (!birth_date) {
      this.showToast('Vui lòng chọn ngày sinh của bạn!', 'warning');
      return;
    }

    try {
      this.showToast('Đang cập nhật hồ sơ...', 'info');
      const res = await this.api('/auth/profile/demographics', {
        method: 'POST',
        body: JSON.stringify({
          gender,
          birth_date,
          province,
          occupation,
          university,
          major,
          graduation_year,
          monthly_income
        })
      });

      if (res && res.success) {
        this.haptic('success');
        this.showToast(res.message || 'Cập nhật hồ sơ nhân khẩu học thành công!', 'success');
        if (res.user) {
          // Bảo toàn avatar_url nếu server trả về đối tượng user
          if (!res.user.avatar_url && this.state.currentUser?.avatar_url) {
            res.user.avatar_url = this.state.currentUser.avatar_url;
          }
          this.state.currentUser = res.user;
          localStorage.setItem('survhub_cached_user', JSON.stringify(this.state.currentUser));
          localStorage.setItem('vibesurvey_cached_user', JSON.stringify(this.state.currentUser));
        }
        const root = document.getElementById('app-root');
        await this.renderProfileView(root);
      } else {
        this.showToast((res && res.message) || 'Lỗi cập nhật hồ sơ', 'error');
      }
    } catch (err) {
      console.error('Lỗi lưu hồ sơ nhân khẩu học:', err);
      this.showToast('Lỗi cập nhật: ' + err.message, 'error');
    }
  },

  // ==================== TẢI LÊN ẢNH ĐẠI DIỆN SIÊU NHANH & NÉN ẢNH CANVAS AN TOÀN ====================
  async handleProfileAvatarUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP)', 'error');
      return;
    }

    this.haptic('medium');
    this.showToast('Đang xử lý và tải lên ảnh đại diện...', 'info');

    try {
      // Đọc file thành Data URL
      const rawDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh'));
        reader.readAsDataURL(file);
      });

      // Tự động resize và nén ảnh qua Canvas để dung lượng luôn dưới 150KB (siêu nhẹ, không bao giờ lỗi payload)
      const compressedDataUrl = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            if (w > maxDim) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      });

      // Gửi yêu cầu lên server
      const res = await this.api('/auth/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatar_base64: compressedDataUrl })
      });

      if (res && res.success) {
        const newAvatarUrl = res.avatar_url;
        if (this.state.currentUser) {
          this.state.currentUser.avatar_url = newAvatarUrl;
          try {
            localStorage.setItem('survhub_cached_user', JSON.stringify(this.state.currentUser));
            localStorage.setItem('vibesurvey_cached_user', JSON.stringify(this.state.currentUser));
          } catch (storageErr) {}
        }

        this.haptic('success');
        this.showToast('Cập nhật ảnh đại diện thành công!', 'success');

        const initialChar = (this.state.currentUser?.name || 'U').charAt(0).toUpperCase();

        // Cập nhật ngay avatar hiển thị trên Profile Header
        const avatarDisplay = document.getElementById('profile-header-avatar-display');
        if (avatarDisplay) {
          avatarDisplay.innerHTML = `<img src="${newAvatarUrl}" alt="Avatar" class="w-full h-full object-cover rounded-2xl" onerror="this.onerror=null;this.parentElement.textContent='${initialChar}';">`;
        }

        // Cập nhật avatar trên thanh Navbar và Dropdown
        const avatarCircle = document.getElementById('user-avatar-circle');
        if (avatarCircle) {
          avatarCircle.classList.add('overflow-hidden');
          avatarCircle.innerHTML = `<img src="${newAvatarUrl}" alt="Avatar" class="w-full h-full object-cover rounded-md" onerror="this.onerror=null;this.parentElement.textContent='${initialChar}';">`;
        }
        this.renderUserProfileDropdown();
      } else {
        this.showToast((res && res.message) || 'Lỗi khi lưu ảnh đại diện', 'error');
      }
    } catch (uploadErr) {
      console.error('Lỗi upload avatar:', uploadErr);
      this.showToast('Lỗi khi tải ảnh: ' + uploadErr.message, 'error');
    }
  },

  // ==================== XÁC THỰC EMAIL SINH VIÊN (OTP) ====================
  /**
   * Đặt lại trạng thái nút gửi OTP về mặc định.
   */
  _resetStudentOtpButton() {
    const btn = document.getElementById('student-send-otp-btn');
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
    btn.innerText = 'Gửi Mã OTP';
  },

  /**
   * Gửi mã OTP xác thực email trường tới hộp thư sinh viên.
   * Chặn gửi lại trong 60 giây và giới hạn 5 lần / 10 phút.
   */
  async sendStudentEmailOtpAction() {
    this.haptic('medium');
    const email = document.getElementById('student-email-input')?.value?.trim();
    if (!email || !email.includes('@')) {
      this.showToast('Vui lòng nhập địa chỉ email sinh viên hợp lệ (.edu.vn / .ac.vn)!', 'warning');
      return;
    }

    if (this.state.studentOtpCooldown > 0) {
      this.showToast(`Vui lòng đợi ${this.state.studentOtpCooldown} giây trước khi gửi lại mã!`, 'warning');
      return;
    }

    const now = Date.now();
    if (!this.state.otpSendHistory) this.state.otpSendHistory = [];
    this.state.otpSendHistory = this.state.otpSendHistory.filter(t => now - t < 10 * 60 * 1000);
    if (this.state.otpSendHistory.length >= 5) {
      this.showToast('Bạn đã gửi mã quá 5 lần trong 10 phút. Vui lòng thử lại sau ít phút để bảo vệ hệ thống!', 'error');
      return;
    }

    const btn = document.getElementById('student-send-otp-btn');
    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      btn.innerText = 'Đang gửi...';
    }

    try {
      const res = await this.api('/auth/student/send-otp', {
        method: 'POST',
        body: JSON.stringify({ student_email: email })
      });

      if (res && res.success) {
        this.haptic('success');
        this.showToast(res.message || 'Mã OTP đã được gửi đến email trường của bạn!', 'success');
        const otpSec = document.getElementById('student-otp-section');
        if (otpSec) otpSec.classList.remove('hidden');
        if (res.debugOtp) {
          console.log('[DEBUG OTP Sinh Viên]:', res.debugOtp);
        }

        this.state.otpSendHistory.push(now);
        this.startStudentOtpCooldown(60);
      } else {
        this._resetStudentOtpButton();
      }
    } catch (err) {
      this.showToast(err.message, 'error');
      this._resetStudentOtpButton();
    }
  },

  /**
   * Đếm ngược thời gian được phép gửi lại OTP và cập nhật nhãn nút.
   * @param {number} seconds Số giây cooldown
   */
  startStudentOtpCooldown(seconds) {
    this.state.studentOtpCooldown = seconds;
    if (this._studentOtpCooldownTimer) clearInterval(this._studentOtpCooldownTimer);

    const updateButton = () => {
      const btn = document.getElementById('student-send-otp-btn');
      if (!btn) return;
      if (this.state.studentOtpCooldown > 0) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.innerText = `Gửi lại sau (${this.state.studentOtpCooldown}s)`;
      } else {
        this._resetStudentOtpButton();
        clearInterval(this._studentOtpCooldownTimer);
      }
    };

    updateButton();
    this._studentOtpCooldownTimer = setInterval(() => {
      this.state.studentOtpCooldown--;
      updateButton();
      if (this.state.studentOtpCooldown <= 0) {
        clearInterval(this._studentOtpCooldownTimer);
      }
    }, 1000);
  },

  /**
   * Xác nhận mã OTP email trường và nâng cấp tài khoản lên Gói Sinh Viên.
   */
  async verifyStudentEmailOtpAction() {
    this.haptic('medium');
    const otp = document.getElementById('student-otp-input')?.value?.trim();
    if (!otp || otp.length < 4) {
      this.showToast('Vui lòng nhập mã OTP xác thực!', 'warning');
      return;
    }

    try {
      const res = await this.api('/auth/student/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otp })
      });

      if (res && res.success) {
        this.haptic('success');
        this.showToast('Xác thực Sinh viên thành công! Tài khoản đã nâng cấp Gói Sinh Viên.', 'success');
        if (res.user) {
          if (!res.user.avatar_url && this.state.currentUser?.avatar_url) {
            res.user.avatar_url = this.state.currentUser.avatar_url;
          }
          this.state.currentUser = res.user;
        }
        this.state.studentOtpCooldown = 0;
        await this.renderProfileView(document.getElementById('app-root'));
        this.renderNavigation();
        this.renderUserProfileDropdown();
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ==================== XÓA KHẢO SÁT THẬT HOẠT ĐỘNG HOÀN TOÀN ====================
  async deleteSurveyAction(surveyId) {
    if (!surveyId) return;
    const confirmDelete = confirm('Bạn có chắc chắn muốn xóa bài khảo sát này vĩnh viễn không?\n\nNếu khảo sát còn số dư ký quỹ chưa dùng hết, hệ thống sẽ tự động hoàn trả về ví của bạn.');
    if (!confirmDelete) return;

    this.haptic('warning');
    this.showToast('Đang tiến hành xóa bài khảo sát...', 'info');

    try {
      const res = await this.api('/surveys/' + surveyId, {
        method: 'DELETE'
      });

      if (res && res.success) {
        this.haptic('success');
        this.showToast(res.message || 'Đã xóa bài khảo sát thành công!', 'success');
        // Nạp lại dữ liệu và render lại
        const root = document.getElementById('app-root');
        await this.renderProfileView(root);
      } else {
        this.showToast((res && res.message) || 'Không thể xóa bài khảo sát', 'error');
      }
    } catch (err) {
      this.showToast('Lỗi xóa khảo sát: ' + err.message, 'error');
    }
  },

  };

  // Mo rong vao Namespace SSOT window.VibeApp
  Object.assign(window.VibeApp, RespondentModule);
  window.RespondentModule = RespondentModule;
})();
