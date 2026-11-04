/**
 * VibeSurvey - Creator Studio Module (WAVE 6 MODULAR)
 * Gom toan bo cum CREATOR STUDIO tu public/app.js (di chuyen nguyen van, khong doi hanh vi):
 * (a) Studio Sidebar (khu vuc core UI cua app.js, truoc phan doan AUTH MODAL):
 *     renderStudioSidebarHtml - khung sidebar 2 tab BUDGET/SETTINGS cua man hinh tao khao sat,
 *     goi calculateStudioEscrow, bo loc doi tuong va voucher catalog.
 * (b) VIEW: TRANG TAO KHAO SAT CHUYEN DUNG (GOOGLE FORMS STUDIO 2 COT): openEditSurvey,
 *     resetStudioToNew, setStudioCoverImage, removeStudioCoverImage, setStudioQuestionImage,
 *     removeStudioQuestionImage, toggleSpeedExplainModal, toggleBoostExplainModal,
 *     updateStudioBoostRealtime.
 * (c) BO LOC DOI TUONG NANG CAO (STUDIO): initStudioDemographics, setStudioTargetGender,
 *     setStudioTargetAgeGroup, setStudioTargetOccupation, setStudioTargetRegion,
 *     filterStudioRegions, setStudioTargetUniversity, filterStudioUniversities.
 * (d) IMAGE PICKER & WEBP + FORMS SYNC + AUTH ERROR MODALS: openImagePickerModal,
 *     closeImagePickerModal, switchImagePickerTab, handleImagePickerFileChange,
 *     handleImagePickerDrop, handleImagePickerDragOver, handleImagePickerDragLeave,
 *     processImagePickerFile, handleImagePickerUrlInput, applyImagePickerUpload,
 *     applyImagePickerUrl, renderImagePickerModal, promptStudioCoverImage,
 *     promptStudioQuestionImage, openQuestionImagePrompt, setStudioCategory,
 *     normalizeMsFormsUrl, handleImportSubmit, syncExternalForm, syncExternalFormNow,
 *     setStudioSidebarSubTab, refreshStudioSidebarView, showMicrosoftFormsAuthErrorModal,
 *     disconnectGoogleForms, showGoogleFormsAuthErrorModal, copyServiceAccountEmail,
 *     saveSystemGoogleCookieAndRetry, openGoogleAppsScriptGuide.
 * (e) KINH TE KY QUY & VOUCHER & LAYOUT 2 COT: setMobileStudioTab, openCreateSurveyModal,
 *     renderCreateSurveyView, fetchVelocityBenchmark, getIncentiveEvaluation,
 *     calculateStudioEscrow, setStudioCreatorTier, setStudioSlaTier, setStudioCustomPrice,
 *     setStudioTargetResponses, toggleStudioTargeting, toggleStudioPinned, toggleStudioVoucher,
 *     setStudioVoucherMode, setStudioCustomVoucherField, setStudioCustomVoucherType,
 *     setStudioCustomSingleCode, setStudioCustomCodesList, getStudioCustomCodesCount,
 *     selectStudioCatalogVoucher, setStudioCatalogVoucherQty, loadStudioCatalogVouchersIfNeeded,
 *     renderStudioCatalogVouchersListHtml, setStudioDuration.
 * (f) QUESTION BUILDER + SMART PASTE: setActiveBuilderQuestion, renderStudioQuestionsHtml,
 *     renderStudioQuestionBody, getStudioQuestionTypeInfo, selectStudioQuestionType,
 *     addBuilderQuestion, duplicateBuilderQuestion, removeBuilderQuestion, toggleStudioRequired,
 *     toggleStudioScreener, toggleStudioLogicBranching, setStudioOptionLogicTarget,
 *     setStudioSectionDefaultAction, setStudioSectionLogicTarget, toggleStudioLongAnswer,
 *     updateBuilderQuestionContent, addStudioOption, addStudioOtherOption, removeStudioOption,
 *     updateStudioOptionText, addStudioGridRow, removeStudioGridRow, updateStudioGridRowText,
 *     addStudioGridCol, removeStudioGridCol, updateStudioGridColText, setStudioScaleRange,
 *     updateStudioLinearLabels, renderStudioQuestionValidationConfig, setStudioQuestionValidationType,
 *     setStudioQuestionValidationRule, setStudioQuestionValidationRange, addStudioVideoBlock,
 *     updateStudioVideoUrl, addStudioSection, updateStudioSectionDesc, addStudioTextBlock,
 *     refreshStudioQuestionsView, switchCreateSurveyTab, handleSmartPasteSubmit,
 *     extractNumberRange, parseRawQuestionsText, submitFastCreate.
 *
 * Giu lai app.js (tien ich dung chung, KHONG thuoc rieng Studio):
 * - _formatFileSize, compressImageFile: dung chung voi forum.js va bugReportModule.js (nen anh).
 * - generateValidationPlaceholder, getYouTubeEmbedUrl: dung chung voi VIEW 2 (trinh lam bai).
 *
 * Cac phu thuoc goi qua this.* (state, api, haptic, showToast, showModal, closeModal, navigate,
 * escapeHtml, isEnterpriseUser, fallbackCopyText, closeAllCustomDropdowns, renderGuestLockedView,
 * compressImageFile, _formatFileSize, generateValidationPlaceholder, getYouTubeEmbedUrl...)
 * deu late-binding qua window.VibeApp nen van hoat dong dung sau khi Object.assign; module duoc
 * nap TRUOC app.js. RestrictionEngine la global script-scoped trong app.js; cac ham su dung pattern
 * an toan (window.RestrictionEngine + typeof guard) san co nen giu nguyen van khi di chuyen.
 * Hang VIBE_* va DEFAULT_STUDIO_CATALOG_VOUCHERS (catalogs.js) truy cap qua window.* theo san.
 * Timer _ytTimer (updateStudioVideoUrl) la property dong tren VibeApp, tu chua trong module nay.
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * @namespace window.VibeApp
 * @requires window.VibeApp (core: state, api, haptic, navigate, escapeHtml, isEnterpriseUser,
 *           showToast/showModal/closeModal [modalsTerms.js], fallbackCopyText [modalsTerms.js],
 *           closeAllCustomDropdowns [customDropdown.js], renderGuestLockedView, compressImageFile,
 *           _formatFileSize, generateValidationPlaceholder, getYouTubeEmbedUrl),
 *           window.RestrictionEngine (app.js), window.VIBE_* + window.DEFAULT_STUDIO_CATALOG_VOUCHERS
 *           (catalogs.js), lucide (global), DOM: app-root, modal-container
 * @exports renderStudioSidebarHtml, openEditSurvey, resetStudioToNew, setStudioCoverImage,
 *          removeStudioCoverImage, setStudioQuestionImage, removeStudioQuestionImage,
 *          toggleSpeedExplainModal, toggleBoostExplainModal, updateStudioBoostRealtime,
 *          initStudioDemographics, setStudioTargetGender, setStudioTargetAgeGroup,
 *          setStudioTargetOccupation, setStudioTargetRegion, filterStudioRegions,
 *          setStudioTargetUniversity, filterStudioUniversities, openImagePickerModal,
 *          closeImagePickerModal, switchImagePickerTab, handleImagePickerFileChange,
 *          handleImagePickerDrop, handleImagePickerDragOver, handleImagePickerDragLeave,
 *          processImagePickerFile, handleImagePickerUrlInput, applyImagePickerUpload,
 *          applyImagePickerUrl, renderImagePickerModal, promptStudioCoverImage,
 *          promptStudioQuestionImage, openQuestionImagePrompt, setStudioCategory,
 *          normalizeMsFormsUrl, handleImportSubmit, syncExternalForm, syncExternalFormNow,
 *          setStudioSidebarSubTab, refreshStudioSidebarView, showMicrosoftFormsAuthErrorModal,
 *          disconnectGoogleForms, showGoogleFormsAuthErrorModal, copyServiceAccountEmail,
 *          saveSystemGoogleCookieAndRetry, openGoogleAppsScriptGuide, setMobileStudioTab,
 *          openCreateSurveyModal, renderCreateSurveyView, fetchVelocityBenchmark,
 *          getIncentiveEvaluation, calculateStudioEscrow, setStudioCreatorTier, setStudioSlaTier,
 *          setStudioCustomPrice, setStudioTargetResponses, toggleStudioTargeting, toggleStudioPinned,
 *          toggleStudioVoucher, setStudioVoucherMode, setStudioCustomVoucherField,
 *          setStudioCustomVoucherType, setStudioCustomSingleCode, setStudioCustomCodesList,
 *          getStudioCustomCodesCount, selectStudioCatalogVoucher, setStudioCatalogVoucherQty,
 *          loadStudioCatalogVouchersIfNeeded, renderStudioCatalogVouchersListHtml, setStudioDuration,
 *          setActiveBuilderQuestion, renderStudioQuestionsHtml, renderStudioQuestionBody,
 *          getStudioQuestionTypeInfo, selectStudioQuestionType, addBuilderQuestion,
 *          duplicateBuilderQuestion, removeBuilderQuestion, toggleStudioRequired, toggleStudioScreener,
 *          toggleStudioLogicBranching, setStudioOptionLogicTarget, setStudioSectionDefaultAction,
 *          setStudioSectionLogicTarget, toggleStudioLongAnswer, updateBuilderQuestionContent,
 *          addStudioOption, addStudioOtherOption, removeStudioOption, updateStudioOptionText,
 *          addStudioGridRow, removeStudioGridRow, updateStudioGridRowText, addStudioGridCol,
 *          removeStudioGridCol, updateStudioGridColText, setStudioScaleRange, updateStudioLinearLabels,
 *          renderStudioQuestionValidationConfig, setStudioQuestionValidationType,
 *          setStudioQuestionValidationRule, setStudioQuestionValidationRange, addStudioVideoBlock,
 *          updateStudioVideoUrl, addStudioSection, updateStudioSectionDesc, addStudioTextBlock,
 *          refreshStudioQuestionsView, switchCreateSurveyTab, handleSmartPasteSubmit,
 *          extractNumberRange, parseRawQuestionsText, submitFastCreate
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const CreatorStudioModule = {
  renderStudioSidebarHtml() {
    const user = this.state.currentUser;
    const userCredit = Number(user?.credit_balance || 0);
    const calc = this.calculateStudioEscrow();
    let activeSlaTier = this.state.selectedSla || 'RECOMMENDED';
    if (this.state.customPricePerResponse !== undefined && this.state.customPricePerResponse !== null) {
      if (this.state.customPricePerResponse >= calc.slaPrices.RUSH) {
        activeSlaTier = 'RUSH';
      } else if (this.state.customPricePerResponse >= calc.slaPrices.RECOMMENDED) {
        activeSlaTier = 'RECOMMENDED';
      } else {
        activeSlaTier = 'FLOOR';
      }
    }
    const hasTargeting = this.state.hasTargeting === true;
    const targetDemo = this.state.targetDemographics || {
      gender: 'ALL',
      region: 'ALL',
      university: 'ALL',
      age_group: 'ALL',
      occupation: 'ALL'
    };

    const card3Html = `
      <!-- CARD 3: BỘ LỌC ĐỐI TƯỢNG MỤC TIÊU -->
      <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div class="flex items-center gap-1.5">
            <i data-lucide="filter" class="w-4 h-4 text-orange-600"></i>
            <span class="studio-card-title text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">Bộ Lọc Đối Tượng</span>
          </div>
          <span class="text-[11px] font-bold text-orange-600 dark:text-orange-400 font-mono">${calc.targetingFeeText}</span>
        </div>

        <!-- Toggle Bật/Tắt Bộ Lọc -->
        <label class="flex items-start justify-between gap-3 cursor-pointer select-none" onclick="VibeApp.toggleStudioTargeting(!VibeApp.state.hasTargeting)">
          <div class="space-y-0.5">
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">Kích hoạt bộ lọc đối tượng</div>
            <div class="text-[10px] text-stone-500 leading-tight">Chỉ phân phối bài làm đến đúng tệp nhân khẩu học được chọn</div>
          </div>
          <button id="studio-has-targeting" type="button" role="switch" aria-checked="${hasTargeting ? 'true' : 'false'}" 
                  class="vibe-switch vibe-switch-sm ${hasTargeting ? 'active' : ''} inline-flex items-center shrink-0 pointer-events-none">
            <span class="vibe-switch-knob"></span>
          </button>
        </label>

        ${hasTargeting ? `
          <div class="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3.5">
            
            <!-- 1. Giới tính -->
            <div>
              <label class="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1.5">Giới tính mục tiêu:</label>
              <div class="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl text-xs font-bold">
                <button type="button" onclick="VibeApp.setStudioTargetGender('ALL')" 
                        class="py-1.5 rounded-lg transition-all ${targetDemo.gender === 'ALL' || !targetDemo.gender ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs' : 'text-stone-600 dark:text-stone-400'}">
                  Tất cả
                </button>
                <button type="button" onclick="VibeApp.setStudioTargetGender('MALE')" 
                        class="py-1.5 rounded-lg transition-all ${targetDemo.gender === 'MALE' ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs' : 'text-stone-600 dark:text-stone-400'}">
                  Nam
                </button>
                <button type="button" onclick="VibeApp.setStudioTargetGender('FEMALE')" 
                        class="py-1.5 rounded-lg transition-all ${targetDemo.gender === 'FEMALE' ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs' : 'text-stone-600 dark:text-stone-400'}">
                  Nữ
                </button>
              </div>
            </div>

            <!-- 2. Độ tuổi -->
            <div>
              <label class="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1.5">Độ tuổi mục tiêu:</label>
              <div class="grid grid-cols-2 gap-1.5 text-xs font-bold">
                <button type="button" onclick="VibeApp.setStudioTargetAgeGroup('ALL')" 
                        class="p-2 rounded-xl border text-center transition-all ${targetDemo.age_group === 'ALL' || !targetDemo.age_group ? 'border-orange-600 bg-orange-50/50 dark:bg-stone-800 text-orange-600 dark:text-orange-400' : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'}">
                  Mọi lứa tuổi
                </button>
                <button type="button" onclick="VibeApp.setStudioTargetAgeGroup('18_22')" 
                        class="p-2 rounded-xl border text-center transition-all ${targetDemo.age_group === '18_22' ? 'border-orange-600 bg-orange-50/50 dark:bg-stone-800 text-orange-600 dark:text-orange-400' : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'}">
                  18 – 22 tuổi
                </button>
                <button type="button" onclick="VibeApp.setStudioTargetAgeGroup('23_29')" 
                        class="p-2 rounded-xl border text-center transition-all ${targetDemo.age_group === '23_29' ? 'border-orange-600 bg-orange-50/50 dark:bg-stone-800 text-orange-600 dark:text-orange-400' : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'}">
                  23 – 29 tuổi
                </button>
                <button type="button" onclick="VibeApp.setStudioTargetAgeGroup('30_45')" 
                        class="p-2 rounded-xl border text-center transition-all ${targetDemo.age_group === '30_45' ? 'border-orange-600 bg-orange-50/50 dark:bg-stone-800 text-orange-600 dark:text-orange-400' : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'}">
                  30 tuổi trở lên
                </button>
              </div>
            </div>

            <!-- 3. Khu vực / 34 Tỉnh Thành Mới -->
            <div>
              <label class="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1.5">Khu vực sinh sống (34 tỉnh thành mới):</label>
              <div class="relative">
                <button type="button" onclick="VibeApp.toggleCustomDropdown('studio-region-menu', event); VibeApp.filterStudioRegions('');" 
                        class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between shadow-xs">
                  <span class="truncate">${targetDemo.region === 'ALL' || !targetDemo.region ? 'Toàn quốc (Tất cả 34 tỉnh thành mới)' : targetDemo.region}</span>
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1"></i>
                </button>
                <div id="studio-region-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-40 p-2 space-y-1.5 text-xs">
                  <div class="relative">
                    <input type="text" placeholder="Tìm kiếm trong 34 tỉnh thành..." 
                           oninput="VibeApp.filterStudioRegions(this.value)"
                           onclick="event.stopPropagation()"
                           class="w-full p-2 pl-7 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs focus:border-orange-600 focus:outline-none">
                    <i data-lucide="search" class="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2.5"></i>
                  </div>
                  <div id="studio-region-dropdown-list" class="max-h-48 overflow-y-auto space-y-1 pr-1">
                    <!-- Nạp động qua filterStudioRegions() -->
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Lĩnh vực / Nghề nghiệp mục tiêu -->
            <div>
              <label class="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1.5">Lĩnh vực / Nghề nghiệp:</label>
              <div class="relative">
                <button type="button" onclick="VibeApp.toggleCustomDropdown('studio-occ-menu', event)" 
                        class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between shadow-xs">
                  <span class="truncate">${targetDemo.occupation === 'ALL' || !targetDemo.occupation ? 'Tất cả ngành nghề / lĩnh vực' : targetDemo.occupation}</span>
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1"></i>
                </button>
                <div id="studio-occ-menu" class="custom-dropdown-menu hidden absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-40 p-2 space-y-1 max-h-48 overflow-y-auto text-xs">
                  ${(window.VIBE_OCCUPATIONS || []).map(o => `
                    <div onclick="VibeApp.setStudioTargetOccupation('${o.name.replace(/'/g, "\\'")}')" 
                         class="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer font-medium ${(targetDemo.occupation === o.name || (o.code === 'ALL' && (!targetDemo.occupation || targetDemo.occupation === 'ALL'))) ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-800 dark:text-stone-200'}">
                      ${o.name}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 5. Trường Đại học / Cao đẳng mục tiêu -->
            <div>
              <label class="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1.5">Trường Đại học / Học viện mục tiêu:</label>
              <div class="relative">
                <button type="button" onclick="VibeApp.toggleCustomDropdown('studio-uni-popover', event); VibeApp.filterStudioUniversities('');" 
                        class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between shadow-xs">
                  <span class="truncate">${targetDemo.university === 'ALL' || !targetDemo.university ? 'Tất cả trường ĐH / Học viện (293 trường)' : targetDemo.university}</span>
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1"></i>
                </button>
                <div id="studio-uni-popover" class="custom-dropdown-menu hidden absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-40 p-2 space-y-1.5 text-xs">
                  <div class="relative">
                    <input type="text" placeholder="Gõ tên trường hoặc viết tắt (Bách khoa, NEU, UEH...)..." 
                           oninput="VibeApp.filterStudioUniversities(this.value)"
                           onclick="event.stopPropagation()"
                           class="w-full p-2 pl-7 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs focus:border-orange-600 focus:outline-none">
                    <i data-lucide="search" class="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2.5"></i>
                  </div>
                  <div id="studio-uni-dropdown-list" class="max-h-48 overflow-y-auto space-y-1 pr-1">
                    <!-- Nạp động qua filterStudioUniversities() -->
                  </div>
                </div>
              </div>
            </div>

          </div>
        ` : `
          <div class="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-[11px] text-stone-400 leading-relaxed">
            Khảo sát sẽ được mở cho toàn bộ cộng đồng đáp viên SurvHub trên toàn quốc.
          </div>
        `}
      </div>
    `;

    return `
      <!-- Segmented Switcher chuyển đổi 2 Tab Cột Phải: BUDGET & SETTINGS -->
      <div class="flex items-center p-1 bg-stone-100 dark:bg-stone-800/90 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs">
        <button type="button" onclick="VibeApp.setStudioSidebarSubTab('BUDGET')" 
                class="flex-1 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${(this.state.studioSidebarSubTab || 'BUDGET') === 'BUDGET'
        ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-sm'
        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
      }">
          <i data-lucide="wallet" class="w-3.5 h-3.5 shrink-0"></i>
          <span>Ngân Sách & Giá</span>
        </button>
        <button type="button" onclick="VibeApp.setStudioSidebarSubTab('SETTINGS')" 
                class="flex-1 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${this.state.studioSidebarSubTab === 'SETTINGS'
        ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-sm'
        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
      }">
          <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5 shrink-0"></i>
          <span>Bộ Lọc & Cài Đặt</span>
        </button>
      </div>

      ${(this.state.studioSidebarSubTab || 'BUDGET') === 'BUDGET' ? `
        <!-- TAB 1: NGÂN SÁCH & BẢNG GIÁ -->
        <!-- CARD 1: PHÂN KHÚC & QUY MÔ MẪU -->
        <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <span class="studio-card-title text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">1. Phân Khúc & Mẫu</span>
            <span class="text-[11px] font-mono font-bold text-orange-600 dark:text-orange-400" id="sidebar-floor-indicator">Sàn: ${calc.floorPrice.toLocaleString('vi-VN')}đ/mẫu</span>
          </div>

          <!-- Phân khúc tài khoản (Tự động nhận diện, tinh gọn không khung viền) -->
          <div class="flex items-center justify-between text-xs pt-0.5">
            <span class="text-stone-500 dark:text-stone-400 font-medium text-[11px]">Phân khúc:</span>
            <span class="font-bold text-stone-900 dark:text-white text-[11px]">
              ${this.state.creatorTier === 'STUDENT' ? 'Sinh Viên' : (this.state.creatorTier === 'ENTERPRISE' ? 'Doanh Nghiệp' : 'Cá Nhân')}
            </span>
          </div>



          <!-- Nhập số lượng mẫu -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-200">
              <label>Số mẫu:</label>
              <span class="text-[11px] font-mono text-stone-500">${this.state.creatorTier === 'STUDENT' ? 'Max 300 mẫu' : (this.state.creatorTier === 'PERSONAL' ? 'Max 500 mẫu' : 'Không giới hạn')}</span>
            </div>
            <input type="number" id="fast-target-count" value="${this.state.targetResponses}" min="10" step="5" oninput="VibeApp.setStudioTargetResponses(this.value)" autocomplete="off" spellcheck="false"
                   class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500">
          </div>

          <!-- Thời hạn treo khảo sát trên sàn (Tự do chỉnh số ngày) -->
          <div class="space-y-1.5 pt-2.5 border-t border-stone-100 dark:border-stone-800">
            <div class="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-200">
              <label for="fast-survey-duration" class="cursor-pointer">Thời hạn treo sàn:</label>
              <div class="flex items-center gap-1.5 font-mono">
                <input type="number" id="fast-survey-duration" value="${this.state.surveyDurationDays || 14}" min="1" max="90" step="1" 
                       oninput="VibeApp.setStudioDuration(this.value, true)" autocomplete="off" spellcheck="false"
                       class="w-16 py-1 px-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-extrabold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500 text-center">
                <span class="text-xs text-stone-600 dark:text-stone-400 font-bold">ngày</span>
              </div>
            </div>
            <p class="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
              Tự do chỉnh từ 1 – 90 ngày. Khảo sát dừng khi đủ mẫu hoặc hết thời hạn. Tiền mẫu chưa thu được hoàn 100%.
            </p>
          </div>
        </div>

        <!-- CARD 2: MỨC THƯỞNG & TỐC ĐỘ -->
        <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800 relative">
            <span class="studio-card-title text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">2. Mức Thưởng & Tốc Độ</span>
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] font-bold text-stone-500">Tốc độ ước tính</span>
              <button type="button" 
                      onmouseenter="VibeApp.toggleSpeedExplainModal(true)"
                      onmouseleave="VibeApp.toggleSpeedExplainModal(false)"
                      onclick="VibeApp.toggleSpeedExplainModal()"
                      class="w-3.5 h-3.5 rounded-full bg-stone-200/80 hover:bg-orange-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 hover:text-orange-600 dark:text-stone-300 dark:hover:text-orange-400 border border-stone-300/80 dark:border-stone-700 text-[9.5px] font-bold font-mono inline-flex items-center justify-center transition-colors focus:outline-none" aria-label="Giải thích tốc độ ước tính">
                ?
              </button>
            </div>

            <!-- Popover giải thích tốc độ ước tính -->
            <div id="speed-explain-popover" 
                 onmouseenter="VibeApp.toggleSpeedExplainModal(true)"
                 onmouseleave="VibeApp.toggleSpeedExplainModal(false)"
                 class="hidden absolute left-0 right-0 top-full mt-2 z-50 p-3.5 bg-white dark:bg-[#18181B] text-stone-700 dark:text-stone-300 rounded-2xl shadow-2xl border border-stone-200/90 dark:border-stone-800 text-[11px] leading-relaxed transition-all">
              <div class="flex items-center justify-between font-bold text-orange-600 dark:text-orange-400 mb-1.5 pb-1 border-b border-stone-100 dark:border-stone-800">
                <span class="flex items-center gap-1">
                  <i data-lucide="info" class="w-3.5 h-3.5"></i>
                  <span>Tốc độ hoàn thành ước tính</span>
                </span>
                <button type="button" onclick="VibeApp.toggleSpeedExplainModal(false)" class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1 font-bold">✕</button>
              </div>
              <div class="space-y-1.5 text-stone-600 dark:text-stone-300">
                <div class="flex items-start gap-1.5">
                  <span class="text-orange-600 font-bold shrink-0">•</span>
                  <span>Thời gian ước tính dựa trên tốc độ hoàn thành khảo sát tương đương trên sàn.</span>
                </div>
                <div class="flex items-start gap-1.5">
                  <span class="text-orange-600 font-bold shrink-0">•</span>
                  <span>Tiền cọc các mẫu chưa thu được hoàn trả 100% khi kết thúc.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3 Nấc Lựa Chọn Mức Thưởng & Độ Ưu Tiên Phân Phối -->
          <div class="space-y-2">
            <!-- Nấc 1: Sàn Tiết kiệm -->
            <div id="studio-sla-card-FLOOR" onclick="VibeApp.setStudioSlaTier('FLOOR')" 
                 class="p-3 rounded-xl border cursor-pointer transition-all ${activeSlaTier === 'FLOOR' ? 'border-orange-600 bg-orange-50/50 dark:bg-stone-800/80 ring-1 ring-orange-500/30' : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'}">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div id="studio-sla-radio-FLOOR" class="w-3.5 h-3.5 rounded-full border-2 ${activeSlaTier === 'FLOOR' ? 'border-orange-600 bg-orange-600' : 'border-stone-300'} flex items-center justify-center">
                    ${activeSlaTier === 'FLOOR' ? '<div class="w-1.5 h-1.5 rounded-full bg-white"></div>' : ''}
                  </div>
                  <span class="text-xs font-bold text-stone-900 dark:text-white">Mức Sàn Tiết Kiệm</span>
                </div>
                <span class="font-mono text-xs font-extrabold text-stone-900 dark:text-white">${calc.slaPrices.FLOOR.toLocaleString('vi-VN')}đ</span>
              </div>
              <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 pl-5.5 flex items-center justify-between">
                ${calc.isDataDriven ? `
                  <span>Dự kiến: <strong class="text-stone-700 dark:text-stone-300 font-bold">${calc.actualEtaFloor}</strong></span>
                  <span class="text-stone-400">Tối ưu chi phí</span>
                ` : `
                  <span>Hàng chờ tiêu chuẩn</span>
                  <span class="text-stone-400">Tối ưu chi phí</span>
                `}
              </div>
            </div>

            <!-- Nấc 2: Đề Xuất (Mặc định) -->
            <div id="studio-sla-card-RECOMMENDED" onclick="VibeApp.setStudioSlaTier('RECOMMENDED')" 
                 class="p-3 rounded-xl border cursor-pointer transition-all ${activeSlaTier === 'RECOMMENDED' ? 'border-orange-600 bg-orange-50/50 dark:bg-stone-800/80 ring-1 ring-orange-500/30' : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'}">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div id="studio-sla-radio-RECOMMENDED" class="w-3.5 h-3.5 rounded-full border-2 ${activeSlaTier === 'RECOMMENDED' ? 'border-orange-600 bg-orange-600' : 'border-stone-300'} flex items-center justify-center">
                    ${activeSlaTier === 'RECOMMENDED' ? '<div class="w-1.5 h-1.5 rounded-full bg-white"></div>' : ''}
                  </div>
                  <span class="text-xs font-bold text-stone-900 dark:text-white">Mức Đề Xuất</span>
                </div>
                <span class="font-mono text-xs font-extrabold text-orange-600 dark:text-orange-400">${calc.slaPrices.RECOMMENDED.toLocaleString('vi-VN')}đ</span>
              </div>
              <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 pl-5.5 flex items-center justify-between">
                ${calc.isDataDriven ? `
                  <span>Dự kiến: <strong class="text-orange-600 dark:text-orange-400 font-bold">${calc.actualEtaRecommended}</strong></span>
                  <span class="text-orange-600 dark:text-orange-400 font-semibold">Thu hút đáp viên</span>
                ` : `
                  <span class="text-orange-600 dark:text-orange-400 font-medium">Ưu tiên hiển thị (+25%)</span>
                  <span class="text-orange-600 dark:text-orange-400 font-semibold">Thu hút đáp viên</span>
                `}
              </div>
            </div>

            <!-- Nấc 3: Hỏa tốc -->
            <div id="studio-sla-card-RUSH" onclick="VibeApp.setStudioSlaTier('RUSH')" 
                 class="p-3 rounded-xl border cursor-pointer transition-all ${activeSlaTier === 'RUSH' ? 'border-orange-600 bg-orange-50/50 dark:bg-stone-800/80 ring-1 ring-orange-500/30' : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'}">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div id="studio-sla-radio-RUSH" class="w-3.5 h-3.5 rounded-full border-2 ${activeSlaTier === 'RUSH' ? 'border-orange-600 bg-orange-600' : 'border-stone-300'} flex items-center justify-center">
                    ${activeSlaTier === 'RUSH' ? '<div class="w-1.5 h-1.5 rounded-full bg-white"></div>' : ''}
                  </div>
                  <span class="text-xs font-bold text-stone-900 dark:text-white">Mức Hỏa Tốc</span>
                </div>
                <span class="font-mono text-xs font-extrabold text-orange-600 dark:text-orange-400">${calc.slaPrices.RUSH.toLocaleString('vi-VN')}đ</span>
              </div>
              <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 pl-5.5 flex items-center justify-between">
                ${calc.isDataDriven ? `
                  <span>Dự kiến: <strong class="text-orange-600 dark:text-orange-400 font-bold">${calc.actualEtaRush}</strong></span>
                  <span class="text-orange-600 dark:text-orange-400 font-semibold">Gom mẫu nhanh</span>
                ` : `
                  <span class="text-orange-600 dark:text-orange-400 font-medium">Ưu tiên tối đa (+60%)</span>
                  <span class="text-orange-600 dark:text-orange-400 font-semibold">Gom mẫu nhanh</span>
                `}
              </div>
            </div>
          </div>

          <!-- Thanh trượt Tăng Thưởng Tự Do -->
          <div class="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2.5 relative">
            <div class="flex items-center justify-between text-xs gap-2">
              <span class="font-bold text-stone-700 dark:text-stone-300 inline-flex items-center gap-1.5 leading-normal">
                <span>Tăng Thưởng Tự Do</span>
                <button type="button" 
                        onmouseenter="VibeApp.toggleBoostExplainModal(true)"
                        onmouseleave="VibeApp.toggleBoostExplainModal(false)"
                        onclick="VibeApp.toggleBoostExplainModal()"
                        class="w-3.5 h-3.5 rounded-full bg-stone-200/80 hover:bg-orange-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 hover:text-orange-600 dark:text-stone-300 dark:hover:text-orange-400 border border-stone-300/80 dark:border-stone-700 text-[9.5px] font-bold font-mono inline-flex items-center justify-center transition-colors focus:outline-none" aria-label="Giải thích cơ chế tiền thêm">
                  ?
                </button>
              </span>
              <span id="boost-price-display" class="font-mono font-bold text-orange-600 dark:text-orange-400 shrink-0 whitespace-nowrap">${calc.effectivePrice.toLocaleString('vi-VN')} VNĐ / mẫu</span>
            </div>

            <!-- Popover vừa vặn 100% chiều ngang card Studio, không bao giờ bị cắt bên trái hay tràn bên phải -->
            <div id="boost-explain-popover" 
                 onmouseenter="VibeApp.toggleBoostExplainModal(true)"
                 onmouseleave="VibeApp.toggleBoostExplainModal(false)"
                 class="hidden absolute left-0 right-0 bottom-full mb-2 z-50 p-3.5 bg-white dark:bg-[#18181B] text-stone-700 dark:text-stone-300 rounded-2xl shadow-2xl border border-stone-200/90 dark:border-stone-800 text-[11px] leading-relaxed transition-all">
              <div class="flex items-center justify-between font-bold text-orange-600 dark:text-orange-400 mb-1.5 pb-1 border-b border-stone-100 dark:border-stone-800">
                <span class="flex items-center gap-1">
                  <i data-lucide="info" class="w-3.5 h-3.5"></i>
                  <span>Cơ chế phân bổ ngân sách tăng thêm</span>
                </span>
                <button type="button" onclick="VibeApp.toggleBoostExplainModal(false)" class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1 font-bold">✕</button>
              </div>
              <div class="space-y-1.5 text-stone-600 dark:text-stone-300">
                <div class="flex items-start gap-1.5">
                  <span class="text-orange-600 font-bold shrink-0">•</span>
                  <span><strong class="text-stone-900 dark:text-white">80% tiền thêm</strong>: Chuyển đổi trực tiếp thành Điểm thưởng thực nhận cho đáp viên, tạo lực hút thù lao vượt trội để người điền ưu tiên làm bài của bạn trước.</span>
                </div>
                <div class="flex items-start gap-1.5">
                  <span class="text-orange-600 font-bold shrink-0">•</span>
                  <span><strong class="text-stone-900 dark:text-white">20% còn lại</strong>: Phí vận hành hạ tầng tăng tốc của sàn (kích hoạt luồng thông báo ưu tiên và kiểm duyệt dữ liệu hỏa tốc).</span>
                </div>
              </div>
              <div class="mt-2 pt-1.5 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-400 dark:text-stone-500">
                Đảm bảo khảo sát hoàn thành nhanh nhất với chất lượng phản hồi cao nhất.
              </div>
            </div>
            <input type="range" id="studio-boost-slider" min="${calc.floorPrice}" max="${calc.floorPrice * 3}" step="50" value="${calc.effectivePrice}" oninput="VibeApp.updateStudioBoostRealtime(this.value)"
                   class="w-full accent-orange-600 cursor-pointer">

            <!-- Thẻ đánh giá thù lao thực tế -->
            <div class="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 text-[11px] space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-stone-600 dark:text-stone-400 flex items-center gap-1 font-medium">
                  <i data-lucide="zap" class="w-3.5 h-3.5 text-orange-600"></i>
                  Thù lao so với giá sàn:
                </span>
                <span id="boost-incentive-diff" class="font-bold text-orange-600 dark:text-orange-400 font-mono">+${calc.incentiveCurrent.delta.toLocaleString('vi-VN')}đ (+${calc.incentiveCurrent.pct}%)</span>
              </div>
              <div class="text-[10.5px] text-stone-500 pt-1 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
                <span>Phân phối: <strong id="boost-incentive-priority" class="${calc.incentiveCurrent.badgeClass}">${calc.incentiveCurrent.queuePriority}</strong></span>
                <span class="text-stone-400 truncate max-w-[180px]">${calc.targetingSummaryText}</span>
              </div>
            </div>
            
            <!-- Tỷ lệ phân chia Boost (Đã ẩn hoàn toàn theo yêu cầu người dùng) -->
            <div id="boost-split-box" class="hidden p-2.5 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 text-[11px] space-y-1.5">
              <div class="flex items-center justify-between text-stone-600 dark:text-stone-400">
                <span>Phân chia thưởng Boost (+${Math.max(0, calc.effectivePrice - calc.floorPrice).toLocaleString('vi-VN')}đ):</span>
                <span id="boost-share-text" class="font-bold text-orange-600 dark:text-orange-400">80% điền / 20% sàn</span>
              </div>
              <div class="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-800 font-semibold">
                <span>Đáp viên nhận: <strong id="boost-respondent-reward" class="text-stone-900 dark:text-white font-mono">${calc.respondentReward.toLocaleString('vi-VN')} Point</strong> <span id="boost-resp-pct" class="text-[10px] text-stone-400 font-normal">(${calc.effectivePrice > 0 ? ((calc.respondentReward / calc.effectivePrice) * 100).toFixed(1) : 0}%)</span></span>
                <span>Sàn thu: <strong id="boost-platform-fee" class="text-stone-900 dark:text-white font-mono">${calc.platformFee.toLocaleString('vi-VN')} Credit</strong> <span id="boost-plat-pct" class="text-[10px] text-stone-400 font-normal">(${calc.effectivePrice > 0 ? ((calc.platformFee / calc.effectivePrice) * 100).toFixed(1) : 0}%)</span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD 3: VOUCHER QUÀ TẶNG KÈM THEO (CHỈ HIỂN THỊ VỚI DOANH NGHIỆP) -->
        ${!this.isEnterpriseUser() ? '' : `
          <!-- CARD 3: VOUCHER QUÀ TẶNG KÈM THEO (DÀNH CHO DOANH NGHIỆP) -->
          <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div class="flex items-center gap-1.5">
                <i data-lucide="gift" class="w-4 h-4 text-orange-600 dark:text-orange-400"></i>
                <span class="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-2">3. Quà Tặng & Voucher</span>
              </div>
              <span class="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${this.state.studioHasVoucher ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/80' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700'}">
                ${this.state.studioHasVoucher ? 'Đang Bật' : 'Tùy Chọn'}
              </span>
            </div>

            <!-- Toggle Switch Bật / Tắt Voucher quà tặng kiểu iOS / Bento -->
            <div class="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#161619] border border-stone-200/80 dark:border-stone-800 transition-all">
              <div class="space-y-1">
                <div class="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>Tặng E-Voucher cho người hoàn thành bài</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">Gấp 2X Gom Mẫu</span>
                </div>
                <p class="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">Mỗi người hoàn thành bài sẽ nhận được mã ưu đãi vào Ví Voucher, giúp tăng tốc độ phản hồi vượt bậc.</p>
              </div>
              <button id="studio-voucher-switch" type="button" role="switch" aria-checked="${this.state.studioHasVoucher ? 'true' : 'false'}"
                      onclick="VibeApp.toggleStudioVoucher(!${this.state.studioHasVoucher ? 'true' : 'false'})"
                      class="vibe-switch ${this.state.studioHasVoucher ? 'active' : ''} inline-flex items-center shrink-0"
                      title="${this.state.studioHasVoucher ? 'Bấm để tắt tặng Voucher' : 'Bấm để bật tặng Voucher'}">
                <span class="vibe-switch-knob"></span>
              </button>
            </div>

            ${this.state.studioHasVoucher ? `
              <div class="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-4">
                <!-- Segmented Control chọn 2 Chế độ -->
                <div class="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl text-xs font-bold border border-stone-200/60 dark:border-stone-800">
                  <button type="button" onclick="VibeApp.setStudioVoucherMode('CUSTOM')" 
                          class="py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${(this.state.studioVoucherMode || 'CUSTOM') === 'CUSTOM'
              ? 'bg-white dark:bg-[#1C1C20] text-orange-600 dark:text-orange-400 shadow-xs border border-stone-200/50 dark:border-stone-700/60'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }">
                    <i data-lucide="tag" class="w-3.5 h-3.5"></i>
                    <span>Tự Thêm Voucher Riêng (0đ)</span>
                  </button>
                  <button type="button" onclick="VibeApp.setStudioVoucherMode('CATALOG')" 
                          class="py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${this.state.studioVoucherMode === 'CATALOG'
              ? 'bg-white dark:bg-[#1C1C20] text-orange-600 dark:text-orange-400 shadow-xs border border-stone-200/50 dark:border-stone-700/60'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }">
                    <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
                    <span>Mua Voucher Từ Sàn</span>
                  </button>
                </div>

                ${(this.state.studioVoucherMode || 'CUSTOM') === 'CUSTOM' ? `
                  <!-- KHỐI 1: TỰ THÊM VOUCHER RIÊNG (MIỄN PHÍ SÀN 0Đ) -->
                  <div class="space-y-3 p-3.5 bg-stone-50/80 dark:bg-stone-900/60 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-stone-800 dark:text-stone-200">Thông tin ưu đãi tài trợ:</span>
                      <span class="text-[11px] font-bold text-orange-600 dark:text-orange-400 font-mono">Phí sàn: 0đ (Miễn phí)</span>
                    </div>

                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-stone-600 dark:text-stone-400">Tên thương hiệu tài trợ (*):</label>
                      <input type="text" id="studio-custom-voucher-brand" 
                             value="${(this.state.studioCustomVoucherBrand || '').replace(/"/g, '&quot;')}" 
                             oninput="VibeApp.setStudioCustomVoucherField('brand', this.value)" 
                             placeholder="Ví dụ: Highlands Coffee, Shopee, Quán Cafe X..." 
                             class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-orange-500">
                    </div>

                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-stone-600 dark:text-stone-400">Tiêu đề quà tặng / ưu đãi (*):</label>
                      <input type="text" id="studio-custom-voucher-title" 
                             value="${(this.state.studioCustomVoucherTitle || '').replace(/"/g, '&quot;')}" 
                             oninput="VibeApp.setStudioCustomVoucherField('title', this.value)" 
                             placeholder="Ví dụ: Giảm 30% hóa đơn từ 100K hoặc Tặng 1 ly trà sữa..." 
                             class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-orange-500">
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div class="space-y-1">
                        <label class="text-[11px] font-bold text-stone-600 dark:text-stone-400">Trị giá quy đổi (VNĐ):</label>
                        <input type="number" id="studio-custom-voucher-val" 
                               value="${this.state.studioCustomVoucherVal || 50000}" 
                               oninput="VibeApp.setStudioCustomVoucherField('val', this.value)" 
                               placeholder="50000" step="5000" min="0"
                               class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:border-orange-500">
                      </div>
                      <div class="space-y-1">
                        <label class="text-[11px] font-bold text-stone-600 dark:text-stone-400">Hạn sử dụng:</label>
                        <input type="date" id="studio-custom-voucher-expiry" 
                               value="${this.state.studioCustomVoucherExpiry || '2026-12-31'}" 
                               oninput="VibeApp.setStudioCustomVoucherField('expiry', this.value)" 
                               class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-orange-500">
                      </div>
                    </div>

                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-stone-600 dark:text-stone-400">Hướng dẫn sử dụng mã:</label>
                      <input type="text" id="studio-custom-voucher-inst" 
                             value="${(this.state.studioCustomVoucherInst || '').replace(/"/g, '&quot;')}" 
                             oninput="VibeApp.setStudioCustomVoucherField('inst', this.value)" 
                             placeholder="Đưa mã cho thu ngân tại quầy hoặc áp dụng tại giỏ hàng online..." 
                             class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-orange-500">
                    </div>

                    <!-- Cơ chế nạp mã -->
                    <div class="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="font-bold text-stone-700 dark:text-stone-300">Cơ chế phát mã:</span>
                        <div class="flex items-center gap-2">
                          <label class="inline-flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="studio-voucher-code-type" value="SINGLE" 
                                   ${(this.state.studioCustomVoucherType || 'SINGLE') === 'SINGLE' ? 'checked' : ''} 
                                   onchange="VibeApp.setStudioCustomVoucherType('SINGLE')" 
                                   class="accent-orange-600">
                            <span class="text-[11px] font-semibold text-stone-700 dark:text-stone-300">1 Mã Dùng Chung</span>
                          </label>
                          <label class="inline-flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="studio-voucher-code-type" value="LIST" 
                                   ${this.state.studioCustomVoucherType === 'LIST' ? 'checked' : ''} 
                                   onchange="VibeApp.setStudioCustomVoucherType('LIST')" 
                                   class="accent-orange-600">
                            <span class="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Danh Sách Mã Riêng</span>
                          </label>
                        </div>
                      </div>

                      ${(this.state.studioCustomVoucherType || 'SINGLE') === 'SINGLE' ? `
                        <div class="space-y-1">
                          <input type="text" id="studio-custom-voucher-single-code" 
                                 value="${(this.state.studioCustomSingleCode || 'VOUCHERVIP').replace(/"/g, '&quot;')}" 
                                 oninput="VibeApp.setStudioCustomSingleCode(this.value)" 
                                 placeholder="Ví dụ: SALE50K, CHAOBANMOI, KHUYENMAI2026..." 
                                 class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500">
                          <p class="text-[10px] text-stone-500">Mã này sẽ được cấp tự động cho mọi người làm đạt chuẩn sau khi nộp bài.</p>
                        </div>
                      ` : `
                        <div class="space-y-1">
                          <textarea id="studio-custom-voucher-codes-list" rows="3" 
                                    oninput="VibeApp.setStudioCustomCodesList(this.value)" 
                                    placeholder="Nhập hoặc dán danh sách mã vào đây (mỗi dòng 1 mã):&#10;VOUCHER-001&#10;VOUCHER-002&#10;VOUCHER-003" 
                                    class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono text-stone-900 dark:text-white focus:outline-none focus:border-orange-500">${this.state.studioCustomCodesList || ''}</textarea>
                          <div class="flex items-center justify-between text-[10px] text-stone-500">
                            <span>Mỗi người làm nhận 1 mã riêng biệt.</span>
                            <span class="font-bold text-orange-600">Đã nhập: ${this.getStudioCustomCodesCount()} mã</span>
                          </div>
                        </div>
                      `}
                    </div>
                  </div>
                ` : `
                  <!-- KHỐI 2: MUA VOUCHER TỪ KHO SÀN BẰNG CREDIT -->
                  <div class="space-y-3 p-3.5 bg-stone-50/80 dark:bg-stone-900/60 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-stone-800 dark:text-stone-200">Chọn Voucher từ kho sàn:</span>
                      <span class="text-[11px] font-bold text-orange-600 dark:text-orange-400 font-mono">Dùng số dư Credit</span>
                    </div>

                    <!-- Danh sách các voucher sàn có sẵn -->
                    <div class="space-y-2">
                      ${this.renderStudioCatalogVouchersListHtml()}
                    </div>

                    <!-- Số lượng mã cần mua -->
                    <div class="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
                      <div class="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        <label>Số lượng mã cần mua:</label>
                        <button type="button" onclick="VibeApp.setStudioCatalogVoucherQty(${calc.targetN})" 
                                class="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline">
                          Bằng số mẫu (${calc.targetN} mã)
                        </button>
                      </div>
                      <div class="flex items-center gap-2">
                        <input type="number" id="studio-catalog-voucher-qty" 
                               value="${this.state.studioCatalogVoucherQty || calc.targetN}" 
                               min="1" max="1000" step="5"
                               oninput="VibeApp.setStudioCatalogVoucherQty(this.value)" 
                               class="flex-1 p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:border-orange-500">
                        <span class="text-xs font-bold text-stone-500">mã</span>
                      </div>
                      <div class="p-2.5 bg-orange-50 dark:bg-stone-900/90 rounded-lg border border-orange-200/80 dark:border-stone-800 flex items-center justify-between text-xs">
                        <span class="text-stone-600 dark:text-stone-400 font-medium">Chi phí mua voucher:</span>
                        <span class="font-mono font-black text-orange-600 dark:text-orange-400">
                          ${calc.voucherCostCredit.toLocaleString('vi-VN')} Credit
                        </span>
                      </div>
                      <p class="text-[10px] text-stone-500 leading-tight">
                        * Chi phí mua voucher được cộng tự động vào Tổng Ký Quỹ Escrow và giữ chỗ ngay khi xuất bản.
                      </p>
                    </div>
                  </div>
                `}
              </div>
            ` : `
              <div class="p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#161619] border border-stone-200/80 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed flex items-start gap-2.5">
                <i data-lucide="info" class="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5"></i>
                <span>Bạn có thể tự đính kèm voucher riêng của thương hiệu (0đ phí) hoặc mua voucher Shopee, Grab, Highlands... từ kho sàn để thu hút người tham gia hoàn thành bài nhanh gấp đôi.</span>
              </div>
            `}
          </div>
        `}

        <!-- CARD 4: THANH TOÁN & NÚT XUẤT BẢN -->
        <div class="bg-white dark:bg-[#18181B] border-2 border-orange-500/40 dark:border-orange-500/30 rounded-2xl p-5 shadow-md space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div class="flex items-center gap-1.5">
              <i data-lucide="shield-check" class="w-4 h-4 text-orange-600"></i>
              <span class="studio-card-title text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">4. Thanh Toán</span>
            </div>
          </div>

          <!-- Bảng tóm tắt số liệu -->
          <div class="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
            <div class="flex justify-between">
              <span>Số mẫu:</span>
              <span class="font-mono font-bold text-stone-900 dark:text-white">${this.state.targetResponses} mẫu</span>
            </div>
            <div class="flex justify-between">
              <span>Đơn giá:</span>
              <span id="sidebar-effective-price" class="font-mono font-bold text-stone-900 dark:text-white">${calc.effectivePrice.toLocaleString('vi-VN')} Credit/mẫu</span>
            </div>
            ${calc.freeDeductionSamples > 0 ? `
              <div class="flex justify-between text-orange-600 dark:text-orange-400 font-semibold">
                <span>Lượt miễn phí:</span>
                <span class="font-mono font-bold">-${calc.freeDeductionSamples} mẫu (-${calc.freeDeductionVnd.toLocaleString('vi-VN')}đ)</span>
              </div>
            ` : ''}
            ${calc.targetingFeeVnd > 0 ? `
              <div class="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Phí bộ lọc:</span>
                <span class="font-mono font-bold">+${calc.targetingFeeVnd.toLocaleString('vi-VN')} Credit</span>
              </div>
            ` : ''}
            ${calc.pinFeeVnd > 0 ? `
              <div class="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Phí ghim VIP:</span>
                <span class="font-mono font-bold">+${calc.pinFeeVnd.toLocaleString('vi-VN')} Credit</span>
              </div>
            ` : ''}
            ${calc.hasVoucher ? `
              <div class="flex justify-between text-orange-600 dark:text-orange-400 font-semibold">
                <span class="flex items-center gap-1">
                  <i data-lucide="gift" class="w-3.5 h-3.5"></i>
                  <span>Voucher:</span>
                </span>
                <span class="font-mono font-bold">${calc.voucherCostCredit > 0 ? `+${calc.voucherCostCredit.toLocaleString('vi-VN')} Credit` : '0đ (Tự cấp)'}</span>
              </div>
            ` : ''}
            
            <div class="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-baseline justify-between">
              <span class="font-bold text-stone-900 dark:text-white">Tổng thanh toán:</span>
              <div class="text-right">
                <span id="sidebar-escrow-amount" class="text-xl sm:text-2xl font-black font-mono text-orange-600 dark:text-orange-400">
                  ${calc.finalEscrowCredit.toLocaleString('vi-VN')} Credit
                </span>
                <div id="sidebar-escrow-vnd" class="text-[10px] text-stone-400 font-mono">(=${calc.finalEscrowCredit.toLocaleString('vi-VN')} VNĐ)</div>
              </div>
            </div>
          </div>

          <!-- Số dư ví hiện có -->
          <div class="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs">
            <span class="text-stone-500">Số dư khả dụng:</span>
            <span class="font-mono font-bold ${userCredit >= calc.finalEscrowCredit ? 'text-orange-600 dark:text-orange-400' : 'text-orange-500'}">
              ${userCredit.toLocaleString('vi-VN')} Credit
            </span>
          </div>

          <!-- Nút hành động -->
          <div class="space-y-2 pt-1">
            <button type="button" onclick="VibeApp.submitFastCreate(false)" id="studio-sidebar-publish-btn"
                    class="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold tracking-wide shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <i data-lucide="send" class="w-4 h-4"></i>
              <span>${calc.isZeroCost ? 'Xuất Bản Miễn Phí (0đ)' : 'Xuất Bản & Khóa Quỹ Ký Quỹ'}</span>
            </button>
            <div class="flex gap-2">
              <button type="button" onclick="VibeApp.submitFastCreate(true)" class="flex-1 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all">
                Lưu Bản Nháp
              </button>
              <button type="button" onclick="VibeApp.openDepositModal()" class="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>Nạp Quỹ</span>
              </button>
            </div>
            ${this.state.editingSurveyId ? `
              <button type="button" onclick="VibeApp.confirmDeleteSurvey('${this.state.editingSurveyId}', '${(this.state.draftTitle || '').replace(/'/g, "\\'")}')" 
                      class="w-full py-2.5 px-3 rounded-xl border border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Xóa Khảo Sát Này</span>
              </button>
            ` : ''}
          </div>

        </div>
      ` : `
        <!-- TAB 2: BỘ LỌC & CÀI ĐẶT -->
        ${card3Html}

        <!-- CARD 4: CÀI ĐẶT VẬN HÀNH -->
        <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-3.5">
          <div class="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <span class="studio-card-title text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">Cài Đặt Vận Hành</span>
            <span class="text-[11px] font-bold text-stone-500">Thời hạn & Ghim VIP</span>
          </div>

          <!-- Thời hạn treo khảo sát trên sàn (Tự do chỉnh số ngày) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-200">
              <label for="tab2-survey-duration" class="cursor-pointer">Thời Hạn Treo Trên Sàn (Tự Do):</label>
              <div class="flex items-center gap-1.5 font-mono">
                <input type="number" id="tab2-survey-duration" value="${this.state.surveyDurationDays || 14}" min="1" max="90" step="1" 
                       oninput="VibeApp.setStudioDuration(this.value, true)" autocomplete="off" spellcheck="false"
                       class="w-16 py-1 px-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-extrabold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500 text-center">
                <span class="text-xs text-stone-600 dark:text-stone-400 font-bold">ngày</span>
              </div>
            </div>
            <p class="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
              Tự do chỉnh từ 1 – 90 ngày. Khảo sát dừng khi đủ mẫu hoặc hết thời hạn. Tiền mẫu chưa thu được hoàn 100%.
            </p>
          </div>

          <!-- Ghim VIP nổi bật -->
          <label class="flex items-start justify-between gap-2.5 cursor-pointer pt-2 border-t border-stone-100 dark:border-stone-800 text-xs select-none" onclick="VibeApp.toggleStudioPinned(!VibeApp.state.isPinnedSurvey)">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-slate-800 dark:text-slate-200">Ghim Vị Trí VIP Đầu Trang</span>
                <span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-orange-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">GẤP 3X</span>
              </div>
              <p class="text-[11px] text-stone-500 leading-tight">
                ${(user.fast_track_tickets || 0) > 0 ? `Trừ 1 vé VIP (Bạn có ${user.fast_track_tickets} vé)` : `+${this.state.creatorTier === 'STUDENT' ? '15.000đ' : '40.000đ'} phí dịch vụ`}
              </p>
            </div>
            <button id="studio-is-pinned" type="button" role="switch" aria-checked="${this.state.isPinnedSurvey ? 'true' : 'false'}"
                    class="vibe-switch vibe-switch-sm ${this.state.isPinnedSurvey ? 'active' : ''} inline-flex items-center shrink-0 pointer-events-none">
              <span class="vibe-switch-knob"></span>
            </button>
          </label>
        </div>

        <!-- CARD CÀI ĐẶT PHẢN HỒI -->
        <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-3.5">
          <div class="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <i data-lucide="settings-2" class="w-4 h-4 text-orange-600"></i>
            <span class="studio-card-title text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Cài Đặt Phản Hồi</span>
          </div>
          
          <div class="space-y-3 pt-1">
            <!-- Xem lại câu trả lời -->
            <label class="flex items-start justify-between gap-2 cursor-pointer select-none">
              <div class="space-y-0.5">
                <div class="text-xs font-bold text-stone-800 dark:text-stone-200">Xem lại bài làm sau khi gửi</div>
                <div class="text-[11px] text-stone-500 leading-tight">Cho phép người điền xem lại câu trả lời đã nộp</div>
              </div>
              <input type="checkbox" id="studio-allow-view-response" 
                     ${this.state.allowViewResponse !== false ? 'checked' : ''} 
                     onchange="VibeApp.state.allowViewResponse = this.checked"
                     class="w-4 h-4 mt-0.5 accent-orange-600 rounded">
            </label>

            <div class="border-t border-stone-100 dark:border-stone-800"></div>

            <!-- Chỉnh sửa câu trả lời -->
            <label class="flex items-start justify-between gap-2 cursor-pointer select-none">
              <div class="space-y-0.5">
                <div class="text-xs font-bold text-stone-800 dark:text-stone-200">Cho phép sửa sau khi gửi</div>
                <div class="text-[10px] text-stone-500 leading-tight">Người điền có thể mở lại biểu mẫu để sửa đáp án</div>
              </div>
              <input type="checkbox" id="studio-allow-edit-response" 
                     ${this.state.allowEditResponse ? 'checked' : ''} 
                     onchange="VibeApp.state.allowEditResponse = this.checked"
                     class="w-4 h-4 mt-0.5 accent-orange-600 rounded">
            </label>
          </div>
        </div>
      `}
    `;
  },

  // ==================== VIEW: TRANG TẠO KHẢO SÁT CHUYÊN DỤNG (GOOGLE FORMS STUDIO 2 CỘT) ====================

  async openEditSurvey(surveyId) {
    try {
      this.showToast('Đang tải dữ liệu khảo sát...', 'info');
      const res = await this.api(`/surveys/${surveyId}`);
      if (!res.survey) {
        this.showToast('Không tìm thấy thông tin khảo sát!', 'error');
        return;
      }

      const survey = res.survey;
      const questions = res.questions || [];

      this.state.editingSurveyId = survey.id;
      this.state.draftTitle = survey.title || '';
      this.state.draftDesc = survey.description || '';
      this.state.draftCategory = survey.category || 'Kinh doanh & Thị trường';
      this.state.draftCoverImageUrl = survey.cover_image_url || '';
      this.state.targetResponses = survey.target_responses || 100;
      this.state.creatorTier = survey.package_type || (this.state.currentUser?.account_tier === 'STUDENT' ? 'STUDENT' : 'PERSONAL');
      this.state.isPinnedSurvey = survey.is_pinned === 1;
      this.state.allowEditResponse = survey.allow_edit_response === 1;
      this.state.allowViewResponse = survey.allow_view_response !== 0;
      this.state.studioAllowEmailCollection = survey.allow_email_collection === 1;

      if (survey.survey_source === 'GOOGLE_FORMS' || survey.survey_source === 'MS_FORMS') {
        this.state.createSurveyTab = 'EXTERNAL_URL';
        this.state.externalFormUrl = survey.external_form_url || '';
        this.state.googleSheetsUrl = survey.google_sheets_webhook_url || '';
      } else {
        this.state.createSurveyTab = 'BUILDER';
        this.state.builderQuestions = questions.map((q, idx) => {
          let opts = [];
          if (Array.isArray(q.options)) {
            opts = q.options;
          } else if (q.options_json) {
            try { opts = JSON.parse(q.options_json); } catch (e) { opts = []; }
          }

          let rows = [];
          if (Array.isArray(q.rows)) {
            rows = q.rows;
          } else if (q.rows_json) {
            try { rows = JSON.parse(q.rows_json); } catch (e) { rows = []; }
          }

          let cols = [];
          if (Array.isArray(q.columns)) {
            cols = q.columns;
          } else if (q.columns_json) {
            try { cols = JSON.parse(q.columns_json); } catch (e) { cols = []; }
          }

          return {
            id: q.id || `q_${idx + 1}`,
            type: q.type || 'SINGLE_CHOICE',
            content: q.content || '',
            options: Array.isArray(opts) ? opts : [],
            rows: Array.isArray(rows) ? rows : [],
            columns: Array.isArray(cols) ? cols : [],
            is_required: q.is_required !== 0 && q.is_required !== false,
            is_screener: q.is_screener === 1 || q.is_screener === true,
            qualifying_answer: q.qualifying_answer || null,
            image_url: q.image_url || null,
            min_label: q.min_label || null,
            max_label: q.max_label || null,
            logic: (q.logic_json ? (typeof q.logic_json === 'string' ? JSON.parse(q.logic_json) : q.logic_json) : (q.logic || null)),
            validation: q.validation || ((q.logic_json ? (typeof q.logic_json === 'string' ? JSON.parse(q.logic_json) : q.logic_json) : (q.logic || null))?.validation || null)
          };
        });
      }

      this.haptic('light');
      this.navigate('create-survey');
      this.showToast('Đã nạp khảo sát để chỉnh sửa!', 'success');
    } catch (err) {
      this.showToast('Lỗi khi tải khảo sát: ' + err.message, 'error');
    }
  },

  resetStudioToNew(renderNow = true) {
    this.state.editingSurveyId = null;
    this.state.draftTitle = '';
    this.state.draftDesc = '';
    this.state.draftCoverImageUrl = '';
    this.state.draftCategory = 'Kinh doanh & Thị trường';
    this.state.externalFormUrl = '';
    this.state.allowEditResponse = false;
    this.state.allowViewResponse = true;
    this.state.studioAllowEmailCollection = false;
    this.state.builderQuestions = null;
    this.state.createSurveyTab = 'BUILDER';
    this.state.studioHasVoucher = false;
    this.state.studioVoucherMode = 'CUSTOM';
    this.state.studioCustomVoucherBrand = '';
    this.state.studioCustomVoucherTitle = '';
    this.state.studioCustomVoucherVal = 50000;
    this.state.studioCustomVoucherExpiry = '2026-12-31';
    this.state.studioCustomVoucherInst = '';
    this.state.studioCustomVoucherType = 'SINGLE';
    this.state.studioCustomSingleCode = '';
    this.state.studioCustomCodesList = '';
    this.state.studioSelectedCatalogId = null;
    this.state.studioCatalogVoucher = null;
    this.state.studioCatalogVoucherQty = null;
    if (renderNow) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setStudioCoverImage(url) {
    this.state.draftCoverImageUrl = (url || '').trim();
    this.renderCreateSurveyView(document.getElementById('app-root'));
  },

  removeStudioCoverImage() {
    this.state.draftCoverImageUrl = '';
    this.renderCreateSurveyView(document.getElementById('app-root'));
  },

  setStudioQuestionImage(qIdx, url) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      this.state.builderQuestions[qIdx].image_url = (url || '').trim();
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  removeStudioQuestionImage(qIdx) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      this.state.builderQuestions[qIdx].image_url = null;
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  toggleSpeedExplainModal(forceState) {
    const el = document.getElementById('speed-explain-popover');
    if (!el) return;
    if (typeof forceState === 'boolean') {
      if (forceState) el.classList.remove('hidden');
      else el.classList.add('hidden');
    } else {
      el.classList.toggle('hidden');
    }
  },

  toggleBoostExplainModal(forceState) {
    const el = document.getElementById('boost-explain-popover');
    if (!el) return;
    if (typeof forceState === 'boolean') {
      if (forceState) el.classList.remove('hidden');
      else el.classList.add('hidden');
    } else {
      el.classList.toggle('hidden');
    }
  },

  updateStudioBoostRealtime(val) {
    const numVal = parseInt(val, 10);
    this.state.customPricePerResponse = numVal;
    const calc = this.calculateStudioEscrow();
    let activeTier = 'RECOMMENDED';
    if (numVal >= calc.slaPrices.RUSH) {
      activeTier = 'RUSH';
    } else if (numVal >= calc.slaPrices.RECOMMENDED) {
      activeTier = 'RECOMMENDED';
    } else {
      activeTier = 'FLOOR';
    }
    this.state.selectedSla = activeTier;

    const tiers = ['FLOOR', 'RECOMMENDED', 'RUSH'];
    tiers.forEach(tier => {
      const cardEl = document.getElementById(`studio-sla-card-${tier}`);
      const radioEl = document.getElementById(`studio-sla-radio-${tier}`);
      if (cardEl && radioEl) {
        if (tier === activeTier) {
          cardEl.className = 'p-3 rounded-xl border cursor-pointer transition-all border-orange-600 bg-orange-50/50 dark:bg-stone-800/80 ring-1 ring-orange-500/30';
          radioEl.className = 'w-3.5 h-3.5 rounded-full border-2 border-orange-600 bg-orange-600 flex items-center justify-center';
          radioEl.innerHTML = '<div class="w-1.5 h-1.5 rounded-full bg-white"></div>';
        } else {
          cardEl.className = 'p-3 rounded-xl border cursor-pointer transition-all border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700';
          radioEl.className = 'w-3.5 h-3.5 rounded-full border-2 border-stone-300 flex items-center justify-center';
          radioEl.innerHTML = '';
        }
      }
    });

    const boostPriceEl = document.getElementById('boost-price-display');
    if (boostPriceEl) boostPriceEl.innerText = `${numVal.toLocaleString('vi-VN')} VNĐ / mẫu`;

    const boostShareEl = document.getElementById('boost-share-text');
    if (boostShareEl) boostShareEl.innerText = calc.boostShareText;

    const boostRespEl = document.getElementById('boost-respondent-reward');
    if (boostRespEl) boostRespEl.innerText = `${calc.respondentReward.toLocaleString('vi-VN')} Point`;

    const boostPlatEl = document.getElementById('boost-platform-fee');
    if (boostPlatEl) boostPlatEl.innerText = `${calc.platformFee.toLocaleString('vi-VN')} Credit`;

    const boostRespPctEl = document.getElementById('boost-resp-pct');
    if (boostRespPctEl) boostRespPctEl.innerText = `(${calc.effectivePrice > 0 ? ((calc.respondentReward / calc.effectivePrice) * 100).toFixed(1) : 0}%)`;

    const boostPlatPctEl = document.getElementById('boost-plat-pct');
    if (boostPlatPctEl) boostPlatPctEl.innerText = `(${calc.effectivePrice > 0 ? ((calc.platformFee / calc.effectivePrice) * 100).toFixed(1) : 0}%)`;

    const boostDiffEl = document.getElementById('boost-incentive-diff');
    if (boostDiffEl && calc.incentiveCurrent) {
      boostDiffEl.innerText = `+${calc.incentiveCurrent.delta.toLocaleString('vi-VN')}đ (+${calc.incentiveCurrent.pct}%)`;
    }

    const boostPrioEl = document.getElementById('boost-incentive-priority');
    if (boostPrioEl && calc.incentiveCurrent) {
      boostPrioEl.innerText = calc.incentiveCurrent.queuePriority;
      boostPrioEl.className = calc.incentiveCurrent.badgeClass;
    }

    const sidebarPriceEl = document.getElementById('sidebar-effective-price');
    if (sidebarPriceEl) sidebarPriceEl.innerText = `${calc.effectivePrice.toLocaleString('vi-VN')} Credit/mẫu`;

    const sidebarEscrowEl = document.getElementById('sidebar-escrow-amount');
    if (sidebarEscrowEl) sidebarEscrowEl.innerText = `${calc.finalEscrowCredit.toLocaleString('vi-VN')} Credit`;

    const sidebarEscrowVndEl = document.getElementById('sidebar-escrow-vnd');
    if (sidebarEscrowVndEl) sidebarEscrowVndEl.innerText = `(=${calc.finalEscrowCredit.toLocaleString('vi-VN')} VNĐ)`;

    const topPublishBtn = document.getElementById('studio-top-publish-btn');
    if (topPublishBtn) {
      const span = topPublishBtn.querySelector('span');
      if (span) span.innerText = calc.isZeroCost ? 'Xuất Bản Miễn Phí (0đ)' : 'Xuất Bản & Ký Quỹ';
    }

    const sidePublishBtn = document.getElementById('studio-sidebar-publish-btn');
    if (sidePublishBtn) {
      const span = sidePublishBtn.querySelector('span');
      if (span) span.innerText = calc.isZeroCost ? 'Xuất Bản Miễn Phí (0đ)' : 'Xuất Bản & Khóa Quỹ Ký Quỹ';
    }
  },

  // ==================== BỘ LỌC ĐỐI TƯỢNG NÂNG CAO (STUDIO) ====================
  initStudioDemographics() {
    if (!this.state.targetDemographics) {
      this.state.targetDemographics = {
        gender: 'ALL',
        region: 'ALL',
        university: 'ALL',
        age_group: 'ALL',
        occupation: 'ALL'
      };
    }
  },

  setStudioTargetGender(gender) {
    this.initStudioDemographics();
    this.state.targetDemographics.gender = gender;
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setStudioTargetAgeGroup(age) {
    this.initStudioDemographics();
    this.state.targetDemographics.age_group = age;
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setStudioTargetOccupation(occ) {
    this.initStudioDemographics();
    this.state.targetDemographics.occupation = occ;
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setStudioTargetRegion(region) {
    this.initStudioDemographics();
    this.state.targetDemographics.region = region;
    const popover = document.getElementById('studio-region-popover');
    if (popover) popover.classList.add('hidden');
    this.closeAllCustomDropdowns();
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  filterStudioRegions(query) {
    const q = (query || '').trim().toLowerCase();
    const listEl = document.getElementById('studio-region-dropdown-list');
    const popover = document.getElementById('studio-region-popover');
    if (!listEl) return;
    if (popover) popover.classList.remove('hidden');

    const allRegions = window.VIBE_PROVINCES_34 || [];
    let matched = [];
    if (!q) {
      matched = allRegions;
    } else {
      matched = allRegions.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.code && r.code.toLowerCase().includes(q))
      );
    }

    if (matched.length === 0) {
      listEl.innerHTML = '<div class="p-3 text-stone-400 text-xs text-center font-medium">Không tìm thấy tỉnh thành hoặc vùng miền khớp</div>';
      return;
    }

    const currentRegion = this.state.targetDemographics?.region || 'ALL';

    listEl.innerHTML = matched.map(r => {
      const isSelected = currentRegion === r.name || currentRegion === r.code;
      const isZone = ['ALL', 'MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM'].includes(r.code);
      return `
        <div onclick="VibeApp.setStudioTargetRegion('${r.name.replace(/'/g, "\\'")}')" 
             class="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer text-xs transition-colors flex items-center justify-between ${isSelected ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-800 dark:text-stone-200'
        }">
          <span class="${isZone ? 'font-black text-slate-900 dark:text-white' : 'font-medium'}">${r.name}</span>
          ${isSelected ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600 flex-shrink-0"></i>' : ''}
        </div>
      `;
    }).join('');

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: listEl });
    }
  },

  setStudioTargetUniversity(uniName) {
    this.initStudioDemographics();
    this.state.targetDemographics.university = uniName;
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  filterStudioUniversities(query) {
    const q = (query || '').trim().toLowerCase();
    const listEl = document.getElementById('studio-uni-dropdown-list');
    if (!listEl) return;

    if (!q) {
      listEl.innerHTML = `
        <div onclick="VibeApp.setStudioTargetUniversity('ALL')" class="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer text-stone-900 dark:text-stone-100 font-bold flex items-center justify-between">
          <span>Tất cả trường đại học / học viện</span>
          <i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const matched = (window.VIBE_UNIVERSITIES_DATA || []).filter(u =>
      u.n.toLowerCase().includes(q) || u.s.toLowerCase().includes(q) || u.c.toLowerCase().includes(q)
    ).slice(0, 10);

    if (matched.length === 0) {
      listEl.innerHTML = `
        <div class="p-3 text-stone-400 text-center">Không tìm thấy trường nào khớp với "${query}"</div>
      `;
      return;
    }

    listEl.innerHTML = matched.map(u => `
      <div onclick="VibeApp.setStudioTargetUniversity('${u.n.replace(/'/g, "\\'")}')" class="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer text-stone-800 dark:text-stone-200 text-xs transition-colors">
        <div class="font-bold text-slate-900 dark:text-white leading-tight">${u.n}</div>
        <div class="text-[10px] text-stone-500 font-mono mt-0.5">${u.s}</div>
      </div>
    `).join('');
  },

  openImagePickerModal(target = 'cover', qIdx = null) {
    if (!this.state.imagePicker) {
      this.state.imagePicker = {};
    }
    const currentUrl = target === 'cover'
      ? (this.state.draftCoverImageUrl || '')
      : (this.state.builderQuestions && this.state.builderQuestions[qIdx] ? (this.state.builderQuestions[qIdx].image_url || '') : '');

    this.state.imagePicker = {
      isOpen: true,
      target, // 'cover' | 'question'
      targetQuestionIdx: qIdx,
      activeTab: 'upload', // 'upload' | 'url'
      selectedFile: null,
      compressedResult: null,
      isCompressing: false,
      isUploading: false,
      urlInput: currentUrl
    };

    this.renderImagePickerModal();
    const modalEl = document.getElementById('image-picker-modal');
    if (modalEl) modalEl.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  closeImagePickerModal() {
    if (this.state.imagePicker) {
      this.state.imagePicker.isOpen = false;
    }
    const modalEl = document.getElementById('image-picker-modal');
    if (modalEl) modalEl.classList.add('hidden');
  },

  switchImagePickerTab(tab) {
    if (!this.state.imagePicker) return;
    this.state.imagePicker.activeTab = tab;
    this.renderImagePickerModal();
    if (window.lucide) window.lucide.createIcons();
  },

  async handleImagePickerFileChange(fileInput) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    await this.processImagePickerFile(file);
  },

  async handleImagePickerDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = document.getElementById('image-picker-dropzone');
    if (dropzone) dropzone.classList.remove('border-orange-500', 'bg-orange-50/20');

    const files = event.dataTransfer && event.dataTransfer.files;
    if (files && files.length > 0) {
      await this.processImagePickerFile(files[0]);
    }
  },

  handleImagePickerDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = document.getElementById('image-picker-dropzone');
    if (dropzone) dropzone.classList.add('border-orange-500', 'bg-orange-50/20');
  },

  handleImagePickerDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = document.getElementById('image-picker-dropzone');
    if (dropzone) dropzone.classList.remove('border-orange-500', 'bg-orange-50/20');
  },

  async processImagePickerFile(file) {
    if (!file.type.startsWith('image/')) {
      this.showToast('Vui lòng chọn tệp định dạng hình ảnh (JPG, PNG, WebP)', 'warning');
      return;
    }

    const target = this.state.imagePicker.target;
    const maxDimension = target === 'cover' ? 1200 : 800;

    this.state.imagePicker.selectedFile = file;
    this.state.imagePicker.isCompressing = true;
    this.renderImagePickerModal();
    if (window.lucide) window.lucide.createIcons();

    try {
      const result = await this.compressImageFile(file, {
        maxWidth: maxDimension,
        maxHeight: maxDimension,
        quality: 0.82
      });
      this.state.imagePicker.compressedResult = result;
      this.state.imagePicker.isCompressing = false;
      this.renderImagePickerModal();
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Lỗi khi nén ảnh:', err);
      this.state.imagePicker.isCompressing = false;
      this.showToast('Không thể xử lý ảnh: ' + err.message, 'error');
      this.renderImagePickerModal();
      if (window.lucide) window.lucide.createIcons();
    }
  },

  handleImagePickerUrlInput(val) {
    if (!this.state.imagePicker) return;
    this.state.imagePicker.urlInput = val;
    const previewEl = document.getElementById('image-picker-url-preview');
    const imgEl = document.getElementById('image-picker-url-img');
    const cleanVal = val.trim();
    if (previewEl && imgEl) {
      if (cleanVal) {
        imgEl.src = cleanVal;
        previewEl.classList.remove('hidden');
      } else {
        previewEl.classList.add('hidden');
      }
    }
  },

  async applyImagePickerUpload() {
    const picker = this.state.imagePicker;
    if (!picker || !picker.compressedResult || !picker.compressedResult.dataUrl) {
      this.showToast('Vui lòng chọn ảnh trước khi tải lên', 'warning');
      return;
    }

    picker.isUploading = true;
    this.renderImagePickerModal();
    if (window.lucide) window.lucide.createIcons();

    try {
      const payload = {
        image_data: picker.compressedResult.dataUrl,
        type: picker.target
      };

      const res = await this.api('/upload/image', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.success || !res.url) {
        throw new Error(res.message || 'Lỗi khi lưu trữ ảnh');
      }

      const uploadedUrl = res.url;
      if (picker.target === 'cover') {
        this.state.draftCoverImageUrl = uploadedUrl;
        this.showToast('Đã tải lên và áp dụng ảnh bìa thành công!', 'success');
      } else if (picker.target === 'question' && picker.targetQuestionIdx !== null) {
        const qIdx = picker.targetQuestionIdx;
        if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
          this.state.builderQuestions[qIdx].image_url = uploadedUrl;
          this.showToast('Đã thêm ảnh minh họa vào câu hỏi thành công!', 'success');
        }
      }

      this.closeImagePickerModal();
      this.renderCreateSurveyView(document.getElementById('app-root'));
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
      picker.isUploading = false;
      this.showToast('Tải ảnh thất bại: ' + (err.message || 'Vui lòng thử lại'), 'error');
      this.renderImagePickerModal();
      if (window.lucide) window.lucide.createIcons();
    }
  },

  applyImagePickerUrl() {
    const picker = this.state.imagePicker;
    if (!picker) return;
    const url = (picker.urlInput || '').trim();

    if (picker.target === 'cover') {
      this.state.draftCoverImageUrl = url;
      if (url) this.showToast('Đã áp dụng liên kết ảnh bìa!', 'success');
      else this.showToast('Đã xóa ảnh bìa', 'info');
    } else if (picker.target === 'question' && picker.targetQuestionIdx !== null) {
      const qIdx = picker.targetQuestionIdx;
      if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
        this.state.builderQuestions[qIdx].image_url = url || null;
        if (url) this.showToast('Đã thêm ảnh vào câu hỏi!', 'success');
        else this.showToast('Đã gỡ ảnh câu hỏi', 'info');
      }
    }

    this.closeImagePickerModal();
    this.renderCreateSurveyView(document.getElementById('app-root'));
  },

  renderImagePickerModal() {
    const modalEl = document.getElementById('image-picker-modal');
    if (!modalEl) return;

    const picker = this.state.imagePicker || {};
    const isCover = picker.target === 'cover';
    const targetTitle = isCover ? 'Ảnh Bìa Biểu Mẫu' : ('Ảnh Minh Họa Câu Hỏi #' + ((picker.targetQuestionIdx || 0) + 1));
    const activeTab = picker.activeTab || 'upload';
    const compressed = picker.compressedResult;

    modalEl.innerHTML = `
      <div class="bg-white dark:bg-[#18181B] text-slate-800 dark:text-stone-100 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 dark:border-stone-800 transform transition-all relative">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3.5 border-b border-stone-100 dark:border-stone-800">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <i data-lucide="image" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">${targetTitle}</h3>
              <p class="text-[11px] text-stone-500">Tải ảnh từ máy tính hoặc dán liên kết ảnh trực tiếp</p>
            </div>
          </div>
          <button type="button" onclick="VibeApp.closeImagePickerModal()" class="w-8 h-8 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center justify-center transition-colors">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 mt-4 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl">
          <button type="button" onclick="VibeApp.switchImagePickerTab('upload')" class="flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'upload' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}">
            <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>
            <span>Tải Lên Từ Máy (Nén WebP Siêu Nhẹ)</span>
          </button>
          <button type="button" onclick="VibeApp.switchImagePickerTab('url')" class="flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'url' ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}">
            <i data-lucide="link-2" class="w-3.5 h-3.5"></i>
            <span>Dán Link URL (0 Byte Máy Chủ)</span>
          </button>
        </div>

        <!-- Tab Body -->
        <div class="mt-4">
          ${activeTab === 'upload' ? `
            <!-- TAB 1: UPLOAD TỪ MÁY VỚI NÉN CLIENT CANVAS WEBP -->
            <div class="space-y-3.5">
              
              ${picker.isCompressing ? `
                <div class="py-12 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50/50 dark:bg-stone-900/30">
                  <div class="animate-spin rounded-full h-8 w-8 border-2 border-orange-600 border-t-transparent"></div>
                  <span class="text-xs font-bold text-stone-600 dark:text-stone-300">Đang tối ưu & nén sang định dạng WebP...</span>
                </div>
              ` : (compressed ? `
                <!-- Preview ảnh và thẻ thống kê nén -->
                <div class="space-y-3">
                  <div class="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-950 flex items-center justify-center max-h-56">
                    <img src="${compressed.dataUrl}" alt="Xem trước ảnh" class="max-h-56 w-auto object-contain mx-auto">
                    <div class="absolute bottom-2 right-2 px-2.5 py-1 bg-black/75 backdrop-blur-sm rounded-lg text-[10px] text-white font-mono font-bold">
                      ${compressed.width} x ${compressed.height} px
                    </div>
                  </div>

                  <!-- Thẻ số liệu tối ưu dung lượng -->
                  <div class="p-3 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 rounded-xl">
                    <div class="flex items-center justify-between text-xs mb-1.5">
                      <span class="font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1">
                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-orange-600"></i>
                        Đã tối ưu hóa siêu nhẹ bằng WebP
                      </span>
                      <span class="font-mono font-black text-orange-600 dark:text-orange-400">
                        Giảm ${compressed.savedPercent}%
                      </span>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-center pt-2 border-t border-orange-200/60 dark:border-orange-800/30">
                      <div>
                        <div class="text-[10px] text-stone-500">Kích thước gốc</div>
                        <div class="font-mono text-xs font-bold text-stone-700 dark:text-stone-300">${this._formatFileSize(compressed.originalSize)}</div>
                      </div>
                      <div>
                        <div class="text-[10px] text-stone-500">Sau nén WebP</div>
                        <div class="font-mono text-xs font-bold text-orange-700 dark:text-orange-300">${this._formatFileSize(compressed.compressedSize)}</div>
                      </div>
                      <div>
                        <div class="text-[10px] text-stone-500">Định dạng</div>
                        <div class="font-mono text-xs font-bold text-stone-700 dark:text-stone-300">image/webp</div>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-1">
                    <button type="button" onclick="document.getElementById('image-picker-file-input').click()" class="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-bold underline transition-colors">
                      Chọn ảnh khác từ máy
                    </button>
                    <input type="file" id="image-picker-file-input" accept="image/*" class="hidden" onchange="VibeApp.handleImagePickerFileChange(this)">
                  </div>
                </div>
              ` : `
                <!-- Dropzone kéo thả -->
                <div id="image-picker-dropzone" 
                     onclick="document.getElementById('image-picker-file-input').click()"
                     ondragover="VibeApp.handleImagePickerDragOver(event)"
                     ondragleave="VibeApp.handleImagePickerDragLeave(event)"
                     ondrop="VibeApp.handleImagePickerDrop(event)"
                     class="py-10 px-4 border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-orange-500 dark:hover:border-orange-500 rounded-2xl bg-stone-50/50 dark:bg-stone-900/30 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group">
                  <div class="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 group-hover:text-orange-600 group-hover:scale-105 transition-all flex items-center justify-center">
                    <i data-lucide="upload-cloud" class="w-6 h-6 stroke-[1.8]"></i>
                  </div>
                  <div>
                    <div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Nhấp để chọn ảnh từ máy hoặc kéo thả vào đây</div>
                    <div class="text-[11px] text-stone-500 mt-0.5">Hỗ trợ JPG, PNG, WEBP, GIF. Giới hạn gốc 15MB.</div>
                  </div>
                  <span class="inline-block mt-1 px-3 py-1 rounded-full bg-orange-50 dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-bold text-[10px]">
                    Tự động nén WebP giảm 95%–98% trước khi lưu
                  </span>
                  <input type="file" id="image-picker-file-input" accept="image/*" class="hidden" onchange="VibeApp.handleImagePickerFileChange(this)">
                </div>
              `)}

              <!-- Actions tab upload -->
              <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button type="button" onclick="VibeApp.closeImagePickerModal()" class="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors">
                  Hủy
                </button>
                <button type="button" 
                        onclick="VibeApp.applyImagePickerUpload()" 
                        ${!compressed || picker.isUploading ? 'disabled' : ''}
                        class="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5">
                  ${picker.isUploading ? `
                    <div class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                    <span>Đang tải lên...</span>
                  ` : `
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    <span>Tải Lên & Áp Dụng</span>
                  `}
                </button>
              </div>

            </div>
          ` : `
            <!-- TAB 2: DÁN LIÊN KẾT URL (0 BYTE MÁY CHỦ) -->
            <div class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Đường dẫn ảnh (URL):</label>
                <input type="url" 
                       value="${(picker.urlInput || '').replace(/"/g, '&quot;')}"
                       oninput="VibeApp.handleImagePickerUrlInput(this.value)"
                       placeholder="https://images.unsplash.com/... hoặc link ảnh bất kỳ"
                       class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200 focus:border-orange-600 focus:outline-none">
                <p class="text-[11px] text-stone-400 mt-1">Dán liên kết từ Unsplash, Imgur, Cloudinary hoặc máy chủ riêng. Hệ thống không tốn dung lượng lưu trữ.</p>
              </div>

              <!-- Preview khi nhập link -->
              <div id="image-picker-url-preview" class="${picker.urlInput ? '' : 'hidden'} rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-900 max-h-48 flex items-center justify-center">
                <img id="image-picker-url-img" src="${picker.urlInput || ''}" alt="Xem trước" class="max-h-48 w-auto object-contain mx-auto" onerror="this.onerror=null; this.alt='Không thể tải ảnh từ link này';">
              </div>

              <!-- Actions tab url -->
              <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button type="button" onclick="VibeApp.closeImagePickerModal()" class="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors">
                  Hủy
                </button>
                <button type="button" onclick="VibeApp.applyImagePickerUrl()" class="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  <span>Áp Dụng Liên Kết</span>
                </button>
              </div>
            </div>
          `}
        </div>

        <!-- Technical Storage Architecture Guide Box -->
        <div class="mt-4 p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/80 dark:border-stone-800 text-[11px] text-stone-500 space-y-1">
          <div class="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-orange-600"></i>
            <span>Cơ chế lưu trữ ảnh siêu nhẹ của hệ thống</span>
          </div>
          <p class="leading-relaxed">1. <strong>Nén Client-side WebP:</strong> Ảnh 5MB–10MB từ máy được Canvas chuyển đổi trực tiếp thành WebP (~35KB–65KB), giảm 95%–98% băng thông.</p>
          <p class="leading-relaxed">2. <strong>Tách biệt File tĩnh & CSDL:</strong> Tệp ảnh được lưu vào thư mục tĩnh, SQLite chỉ lưu chuỗi đường dẫn text ngắn gọn (~35 ký tự), giữ database luôn nhẹ dưới vài MB.</p>
          <p class="leading-relaxed">3. <strong>Tùy chọn 0 Byte máy chủ:</strong> Sử dụng tab "Dán Link URL" để tiêu tốn 0 byte lưu trữ máy chủ.</p>
        </div>

      </div>
    `;
  },

  promptStudioCoverImage() {
    this.openImagePickerModal('cover');
  },

  promptStudioQuestionImage(qIdx) {
    this.openImagePickerModal('question', qIdx);
  },

  openQuestionImagePrompt(qIdx) {
    this.openImagePickerModal('question', qIdx);
  },

  setStudioCategory(cat) {
    this.state.draftCategory = cat;
    const el = document.getElementById('fast-category-display');
    if (el) el.innerText = cat;
    const menu = document.getElementById('studio-category-menu');
    if (menu) menu.classList.add('hidden');
  },

  normalizeMsFormsUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
    const trimmed = rawUrl.trim();
    if (/(?:DesignPageV2\.aspx|DesignPage\.aspx)/i.test(trimmed)) {
      let formId = null;
      try {
        const u = new URL(trimmed);
        formId = u.searchParams.get('id');
        if (!formId && u.hash) {
          const hashParams = new URLSearchParams(u.hash.replace(/^#/, ''));
          formId = hashParams.get('id');
        }
      } catch (e) {
        // Fallback regex
      }
      if (!formId) {
        const match = trimmed.match(/[?&#]id=([^&#]+)/i);
        if (match) formId = decodeURIComponent(match[1]);
      }
      if (formId) {
        return `https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=${formId}`;
      }
    }
    return trimmed;
  },

  async handleImportSubmit(customUrl) {
    const urlInput = document.getElementById('fast-form-url');
    let raw = (typeof customUrl === 'string' && customUrl.trim()) ? customUrl.trim() : (urlInput?.value?.trim() || this.state.externalFormUrl || '');
    if (raw) {
      const normalized = this.normalizeMsFormsUrl(raw);
      this.state.externalFormUrl = normalized;
      if (urlInput) urlInput.value = normalized;
    }
    return this.syncExternalForm();
  },

  async syncExternalForm() {
    const urlInput = document.getElementById('fast-form-url');
    let url = urlInput?.value?.trim() || this.state.externalFormUrl;
    if (!url) {
      this.showToast('Vui lòng dán đường link Google Forms hoặc Microsoft Forms vào ô!', 'warning');
      urlInput?.focus();
      return;
    }

    url = this.normalizeMsFormsUrl(url);
    if (urlInput) urlInput.value = url;
    this.state.externalFormUrl = url;

    const btn = document.getElementById('sync-external-form-btn');
    const oldBtnHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent shrink-0"></div><span class="truncate">Đang đồng bộ...</span>`;
    }

    const isMs = url.includes('office.com') || url.includes('microsoft.com') || url.includes('forms.office') || url.includes('forms.cloud.microsoft') || url.includes('form.cloud.microsoft');
    const serviceName = isMs ? 'Microsoft Forms' : 'Google Forms';

    try {
      this.showToast(`Đang kết nối máy chủ ${serviceName} để bóc tách câu hỏi...`, 'info');
      const googleCookie = localStorage.getItem('vibe_google_cookie') || '';
      const res = await this.api('/surveys/parse-external', {
        method: 'POST',
        body: JSON.stringify({ url, googleCookie })
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Không thể bóc tách nội dung biểu mẫu');
      }

      const data = res.data;
      if (data.title && data.title !== 'Microsoft Forms') {
        this.state.draftTitle = data.title;
      }
      if (data.description) this.state.draftDesc = data.description;
      this.state.externalFormUrl = url;

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        this.state.builderQuestions = data.questions.map((q, idx) => {
          let validation = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
          if (validation) {
            validation = { ...validation };
            const vRule = String(validation.rule || '').toUpperCase();
            if (vRule === 'BETWEEN' || (validation.min !== undefined && validation.max !== undefined && validation.min !== null && validation.max !== null && String(validation.min).trim() !== '' && String(validation.max).trim() !== '')) {
              validation.type = 'NUMBER';
              validation.rule = 'BETWEEN';
            }
          }

          let logic = q.logic ? { ...q.logic } : {};
          if (validation) {
            logic.validation = { ...validation };
          }

          let rows = Array.isArray(q.rows) ? [...q.rows] : [];
          if (q.type === 'SECTION_HEADER' && rows.length === 0) {
            if (q.description) rows = [q.description];
            else if (q.subtitle) rows = [q.subtitle];
          }

          return {
            id: q.id || `q_${idx + 1}`,
            type: q.type || 'SINGLE_CHOICE',
            content: q.content || '',
            options: Array.isArray(q.options) ? q.options : [],
            rows,
            columns: Array.isArray(q.columns) ? q.columns : [],
            min_label: (q.min_label !== undefined && q.min_label !== null) ? q.min_label : (q.type === 'LINEAR_SCALE' ? 'Rất không hài lòng' : null),
            max_label: (q.max_label !== undefined && q.max_label !== null) ? q.max_label : (q.type === 'LINEAR_SCALE' ? 'Rất hài lòng' : null),
            is_required: q.type === 'SECTION_HEADER' ? false : (q.is_required !== 0 && q.is_required !== false),
            is_screener: false,
            qualifying_answer: null,
            image_url: q.image_url || null,
            placeholder: q.placeholder || null,
            description: q.description || (q.type === 'SECTION_HEADER' && rows.length > 0 ? rows[0] : null),
            validation: validation || null,
            logic: Object.keys(logic).length > 0 ? logic : null
          };
        });

        this.haptic('success');
        this.showToast(`Đã đồng bộ thành công ${this.state.builderQuestions?.length || 0} câu hỏi từ ${serviceName}!`, 'success');

        // Tự động chuyển sang Canvas để người dùng xem và chỉnh sửa câu hỏi trực quan
        this.state.createSurveyTab = 'BUILDER';
        this.renderCreateSurveyView(document.getElementById('app-root'));
      } else {
        this.haptic('warning');
        this.showToast(`Đã nhận diện liên kết ${serviceName}! Khảo sát sẽ được thiết lập ở chế độ Liên Kết Ngoài (External Link). Bạn có thể bấm "Tạo Khảo Sát" ngay hoặc dùng "Dán Text Nhanh" để nạp chi tiết câu hỏi.`, 'warning');
        this.renderCreateSurveyView(document.getElementById('app-root'));
      }
    } catch (err) {
      const isAuthError = err.status === 401 || err.statusCode === 401 || err.isAuthRequired ||
        err.code === 'SERVICE_ACCOUNT_PERMISSION_DENIED' || err.code === 'USER_OAUTH_UNAUTHORIZED' ||
        err.data?.isAuthRequired || err.data?.code === 'SERVICE_ACCOUNT_PERMISSION_DENIED' ||
        (err.message && (
          err.message.includes('Yêu cầu đăng nhập') ||
          err.message.includes('Giới hạn trong tổ chức') ||
          err.message.includes('chưa được cấp quyền') ||
          err.message.includes('cộng tác viên') ||
          err.message.includes('Service Account') ||
          err.message.includes('401')
        ));

      if (isAuthError) {
        if (isMs || err.isMicrosoft || err.data?.isMicrosoft || (err.message && err.message.includes('Microsoft Forms'))) {
          this.showToast('Biểu mẫu Microsoft Forms yêu cầu đăng nhập tài khoản (401)', 'warning');
          this.showMicrosoftFormsAuthErrorModal(err);
        } else {
          this.showToast('Biểu mẫu Google Forms yêu cầu cấp quyền (401)', 'warning');
          this.showGoogleFormsAuthErrorModal(err);
        }
      } else {
        this.showToast('Lỗi đồng bộ biểu mẫu: ' + err.message, 'error');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldBtnHtml;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },


  async syncExternalFormNow() {
    return this.syncExternalForm();
  },

  setStudioSidebarSubTab(tab) {
    this.haptic('light');
    this.state.studioSidebarSubTab = tab;
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  refreshStudioSidebarView() {
    const sidebarRoot = document.getElementById('studio-sidebar-root');
    if (sidebarRoot) {
      sidebarRoot.innerHTML = this.renderStudioSidebarHtml();
      if (window.lucide) window.lucide.createIcons();
      return true;
    }
    return false;
  },

  showMicrosoftFormsAuthErrorModal(authErr) {
    this.haptic('warning');

    this.showModal({
      title: 'Biểu Mẫu Microsoft Forms Bị Giới Hạn Quyền (Lỗi 401)',
      content: `
        <div class="space-y-4 text-left max-h-[75vh] overflow-y-auto pr-1">
          <div class="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 flex items-start gap-3">
            <i data-lucide="shield-alert" class="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5"></i>
            <div class="space-y-1 text-xs text-orange-900 dark:text-orange-200 leading-relaxed">
              <div class="font-extrabold text-sm">Microsoft Forms đang bật chế độ bảo vệ / yêu cầu đăng nhập</div>
              <p>Biểu mẫu hiện đang bật chế độ <strong>"Chỉ người trong tổ chức có thể phản hồi"</strong> hoặc <strong>"Ghi lại tên (Record name)"</strong>. Máy chủ công khai không thể truy cập để tự động bóc tách danh sách câu hỏi.</p>
            </div>
          </div>

          <div class="space-y-3 text-xs text-stone-700 dark:text-stone-300">
            <div class="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              <i data-lucide="check-circle-2" class="w-4 h-4 text-orange-600"></i>
              <span>Chọn một trong các giải pháp xử lý bên dưới:</span>
            </div>

            <!-- PHƯƠNG ÁN 1 (KHUYÊN DÙNG): MỞ QUYỀN CÔNG KHAI -->
            <div class="p-3.5 bg-gradient-to-br from-orange-50/70 to-orange-50/40 dark:from-stone-900 dark:to-orange-950/20 rounded-xl border-2 border-orange-300 dark:border-orange-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="font-black text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                  <i data-lucide="unlock" class="w-4 h-4 text-orange-600"></i>
                  <span>Phương án 1 (Khuyên dùng): Mở quyền "Bất kỳ ai cũng có thể phản hồi"</span>
                </span>
                <span class="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-black rounded-md uppercase">3 Giây Xong</span>
              </div>
              <p class="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                Để máy chủ bóc tách câu hỏi và người khảo sát có thể điền bài:
              </p>
              <div class="text-[11px] text-stone-600 dark:text-stone-400 space-y-1 pl-1">
                <div>1. Mở khảo sát trên <strong>Microsoft Forms</strong>.</div>
                <div>2. Nhấn nút <strong>"Thu thập phản hồi" (Collect responses)</strong> ở góc trên bên phải.</div>
                <div>3. Chọn tùy chọn <strong>"Bất kỳ ai cũng có thể phản hồi" (Anyone can respond)</strong>.</div>
                <div>4. Bỏ tích chọn <strong>"Ghi lại tên" (Record name)</strong> nếu đang bật.</div>
                <div>5. Quay lại đây và nhấn nút <strong>"Đã Cập Nhật & Đồng Bộ Lại"</strong> bên dưới.</div>
              </div>
              <div class="pt-1">
                <button type="button" onclick="VibeApp.closeModal(); VibeApp.syncExternalForm()" 
                        class="w-full py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-black text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5">
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  <span>Đã Cập Nhật & Đồng Bộ Lại</span>
                </button>
              </div>
            </div>

            <!-- PHƯƠNG ÁN 2: DÁN TEXT NHANH -->
            <div class="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1.5 leading-relaxed">
              <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <i data-lucide="file-text" class="w-3.5 h-3.5 text-stone-500"></i>
                <span>Phương án 2: Dán Văn Bản Thông Minh (Smart Paste)</span>
              </div>
              <p class="text-[11px] text-stone-500 dark:text-stone-400">
                Nếu bạn không có quyền sửa cài đặt form, chỉ cần sao chép toàn bộ nội dung câu hỏi từ Word, Docs hoặc trên trang web rồi dán vào tab <strong>"Dán Văn Bản Thông Minh"</strong>. Hệ thống tự động nhận diện 100% câu hỏi trong 1 giây.
              </p>
            </div>

            <!-- PHƯƠNG ÁN 3: DÙNG DẠNG LIÊN KẾT NGOÀI -->
            <div class="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1.5 leading-relaxed">
              <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <i data-lucide="external-link" class="w-3.5 h-3.5 text-stone-500"></i>
                <span>Phương án 3: Tiếp tục tạo khảo sát ở chế độ Liên Kết Ngoài (External Form)</span>
              </div>
              <p class="text-[11px] text-stone-500 dark:text-stone-400">
                Hệ thống sẽ lưu đường link Microsoft Forms của bạn. Người tham gia khảo sát sẽ mở trực tiếp biểu mẫu Microsoft Forms trong tab mới để điền, sau đó quay lại xác nhận hoàn thành để nhận điểm thưởng.
              </p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-2 pt-2">
            <button type="button" onclick="VibeApp.closeModal(); VibeApp.switchCreateSurveyTab('SMART_PASTE')" 
                    class="flex-1 py-2 px-3 rounded-xl bg-orange-600/10 hover:bg-orange-600/20 text-orange-700 dark:text-orange-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-orange-200 dark:border-orange-800/60">
              <i data-lucide="sparkles" class="w-4 h-4 text-orange-500"></i>
              <span>Dán Text Nhanh (1 Giây)</span>
            </button>
            <button type="button" onclick="VibeApp.closeModal(); VibeApp.switchCreateSurveyTab('EXTERNAL_URL')" 
                    class="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-black text-white dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-stone-800 dark:border-stone-700">
              <i data-lucide="check" class="w-4 h-4 text-orange-400"></i>
              <span>Tạo Dạng Liên Kết Ngoài</span>
            </button>
          </div>
        </div>
      `
    });
    if (window.lucide) window.lucide.createIcons();
  },

  async disconnectGoogleForms() {
    try {
      await this.api('/auth/google/forms-disconnect', { method: 'POST' });
      this.showToast('Đã hủy kết nối tài khoản Google Forms thành công!', 'success');
      this.closeModal();
      this.syncExternalForm();
    } catch (err) {
      this.showToast(err.message || 'Lỗi khi hủy kết nối', 'error');
    }
  },

  showGoogleFormsAuthErrorModal(authErr) {
    this.haptic('warning');
    const saEmail = authErr?.serviceAccountEmail || authErr?.data?.serviceAccountEmail || 'vibesurvey-forms-sync@vibesurvey-512517.iam.gserviceaccount.com';
    const hasOAuth = !!(authErr?.data?.hasGoogleFormsOAuth || authErr?.hasGoogleFormsOAuth);
    const oauthEmail = authErr?.data?.googleFormsEmail || authErr?.googleFormsEmail || '';

    this.showModal({
      title: 'Mở Quyền Truy Cập Biểu Mẫu Google Forms',
      maxWidth: 'max-w-4xl',
      content: `
        <div class="space-y-6 text-left">
          <!-- Top alert banner: Tinh tế, thoáng đãng, phân cấp rõ -->
          <div class="p-4 sm:p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <i data-lucide="lock" class="w-5 h-5"></i>
            </div>
            <div class="space-y-1">
              <div class="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Biểu mẫu đang bật chế độ bảo mật yêu cầu đăng nhập
              </div>
              <p class="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                Google Forms hiện đang bật "Yêu cầu đăng nhập tài khoản Google" hoặc "Giới hạn trong tổ chức". Vui lòng chọn 1 trong 2 giải pháp bên dưới để mở quyền đồng bộ câu hỏi vào Studio:
              </p>
            </div>
          </div>

          <!-- Bento Grid 2 cột cân xứng (Side by side on >= md screens) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <!-- CARD 1: THÊM EMAIL BOT SERVICE ACCOUNT -->
            <div class="p-5 sm:p-6 rounded-2xl bg-stone-50/80 dark:bg-stone-900/80 border-2 border-orange-500/40 dark:border-orange-500/30 flex flex-col justify-between space-y-4 shadow-sm hover:border-orange-500 transition-colors">
              <div class="space-y-3.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-orange-600/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <i data-lucide="bot" class="w-4 h-4"></i>
                    </div>
                    <span class="text-sm font-black text-slate-900 dark:text-white">Giải Pháp 1: Thêm Email Bot</span>
                  </div>
                  <span class="px-2.5 py-1 bg-orange-600 text-white text-[10.5px] font-black rounded-lg uppercase tracking-wider">Khuyên Dùng</span>
                </div>
                
                <p class="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Thêm email bot hệ thống làm cộng tác viên trên Google Forms để máy chủ tự động bóc tách câu hỏi mà <strong>không cần bạn đăng nhập</strong>:
                </p>

                <!-- Hộp Email Bot & Nút Sao Chép -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Email Bot Hệ Thống:</label>
                  <div class="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs">
                    <span class="flex-1 font-mono text-xs text-slate-900 dark:text-slate-100 font-bold select-all truncate pl-1" id="modal-sa-email">${saEmail}</span>
                    <button type="button" onclick="VibeApp.copyServiceAccountEmail('${saEmail}')" 
                            class="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shrink-0 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm">
                      <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                      <span>Sao Chép</span>
                    </button>
                  </div>
                </div>

                <!-- 3 Bước Hướng Dẫn -->
                <div class="p-3.5 rounded-xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2 text-xs text-stone-600 dark:text-stone-300">
                  <div class="font-extrabold text-slate-900 dark:text-white text-[11.5px] uppercase tracking-wider">3 Bước Thao Tác Nhanh:</div>
                  <div class="flex items-start gap-2">
                    <span class="w-4 h-4 rounded-full bg-orange-600/10 text-orange-600 dark:text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>Mở Google Forms > Bấm menu <strong>3 chấm</strong> ở góc trên bên phải.</span>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="w-4 h-4 rounded-full bg-orange-600/10 text-orange-600 dark:text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>Chọn <strong>Thêm cộng tác viên</strong> (Add collaborators).</span>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="w-4 h-4 rounded-full bg-orange-600/10 text-orange-600 dark:text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>Dán email bot ở trên với quyền <strong>Biên tập viên</strong> > Bấm Gửi.</span>
                  </div>
                </div>
              </div>

              <div class="pt-2">
                <button type="button" onclick="VibeApp.closeModal(); VibeApp.syncExternalForm()" 
                        class="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
                  <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                  <span>Đã Thêm Email > Đồng Bộ Lại Ngay</span>
                </button>
              </div>
            </div>

            <!-- CARD 2: ỦY QUYỀN GOOGLE OAUTH 2.0 1-CLICK -->
            <div class="p-5 sm:p-6 rounded-2xl bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 flex flex-col justify-between space-y-4 shadow-sm hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
              <div class="space-y-3.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-stone-200 dark:bg-stone-800 text-slate-800 dark:text-stone-200 flex items-center justify-center">
                      <i data-lucide="shield-check" class="w-4 h-4"></i>
                    </div>
                    <span class="text-sm font-black text-slate-900 dark:text-white">Giải Pháp 2: Ủy Quyền 1-Click</span>
                  </div>
                  <span class="px-2.5 py-1 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-[10.5px] font-black rounded-lg uppercase tracking-wider">OAuth 2.0</span>
                </div>

                <p class="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Google sẽ hiển thị màn hình cấp quyền chính thức. Hệ thống chỉ yêu cầu quyền xem cấu trúc biểu mẫu (<strong>forms.body.readonly</strong>):
                </p>

                <!-- Lợi ích bảo mật -->
                <div class="p-3.5 rounded-xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2 text-xs text-stone-600 dark:text-stone-300">
                  <div class="font-extrabold text-slate-900 dark:text-white text-[11.5px] uppercase tracking-wider">Cam Kết Bảo Mật:</div>
                  <div class="flex items-center gap-2">
                    <i data-lucide="check" class="w-3.5 h-3.5 text-orange-600 shrink-0"></i>
                    <span>Không lưu mật khẩu, không yêu cầu chia sẻ Cookie cá nhân.</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i data-lucide="check" class="w-3.5 h-3.5 text-orange-600 shrink-0"></i>
                    <span>Chỉ đọc tiêu đề, câu hỏi & các lựa chọn để nạp vào Studio.</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i data-lucide="check" class="w-3.5 h-3.5 text-orange-600 shrink-0"></i>
                    <span>Có thể hủy quyền kết nối bất cứ lúc nào với 1 chạm.</span>
                  </div>
                </div>

                ${hasOAuth && oauthEmail ? `
                  <div class="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2 truncate">
                      <i data-lucide="check-circle-2" class="w-4 h-4 text-orange-600 shrink-0"></i>
                      <span class="font-bold text-orange-900 dark:text-orange-200 truncate">Đã kết nối: ${oauthEmail}</span>
                    </div>
                    <button type="button" onclick="VibeApp.disconnectGoogleForms()" class="text-orange-600 dark:text-orange-400 hover:underline font-extrabold text-xs shrink-0 ml-2">Hủy kết nối</button>
                  </div>
                ` : ''}
              </div>

              <div class="pt-2">
                ${hasOAuth && oauthEmail ? `
                  <button type="button" onclick="VibeApp.closeModal(); VibeApp.syncExternalForm()" 
                          class="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
                    <i data-lucide="refresh-cw" class="w-4 h-4 text-orange-400"></i>
                    <span>Đồng Bộ Bằng Tài Khoản Đã Kết Nối</span>
                  </button>
                ` : `
                  <a href="/api/v1/auth/google/forms-connect" 
                     class="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-black shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2">
                    <i data-lucide="shield-check" class="w-4 h-4 text-orange-400"></i>
                    <span>Ủy Quyền 1-Click Qua Google</span>
                  </a>
                `}
              </div>
            </div>

          </div>

          <!-- Footer Info & Alternative Actions -->
          <div class="pt-3 border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="text-[11.5px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <i data-lucide="info" class="w-3.5 h-3.5 text-stone-400 shrink-0"></i>
              <span>Mẹo: Bạn cũng có thể mở công khai form trong <strong>Cài đặt</strong> > tắt <em>"Giới hạn ở 1 câu trả lời"</em>.</span>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button type="button" onclick="VibeApp.closeModal(); VibeApp.switchCreateSurveyTab('SMART_PASTE')" 
                      class="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <i data-lucide="file-text" class="w-4 h-4 text-orange-500"></i>
                <span>Dán Text Nhanh</span>
              </button>
              <button type="button" onclick="VibeApp.closeModal()" 
                      class="py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold transition-all">
                <span>Đóng</span>
              </button>
            </div>
          </div>
        </div>
      `
    });
  },

  copyServiceAccountEmail(email) {
    const textToCopy = email || 'vibesurvey-forms-sync@vibesurvey-512517.iam.gserviceaccount.com';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.haptic('success');
        this.showToast('Đã sao chép email bot vào bộ nhớ tạm!', 'success');
      }).catch(() => {
        this.fallbackCopyText(textToCopy);
      });
    } else {
      this.fallbackCopyText(textToCopy);
    }
  },

  saveSystemGoogleCookieAndRetry() {
    const input = document.getElementById('system-google-cookie-input');
    const cookie = input?.value?.trim() || '';
    if (cookie) {
      localStorage.setItem('vibe_google_cookie', cookie);
      this.showToast('Đã lưu Cookie Google hệ thống!', 'success');
    } else {
      localStorage.removeItem('vibe_google_cookie');
      this.showToast('Đã xóa Cookie Google hệ thống!', 'info');
    }
    this.closeModal();
    this.syncExternalForm();
  },

  openGoogleAppsScriptGuide() {
    this.haptic('light');
    const scriptCode = `function exportFormQuestions() {
  var form = FormApp.getActiveForm();
  var items = form.getItems();
  var text = form.getTitle() + "\\n\\n";
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    text += (i + 1) + ". " + item.getTitle() + "\\n";
    var type = item.getType();
    if (type == FormApp.ItemType.MULTIPLE_CHOICE) {
      var choices = item.asMultipleChoiceItem().getChoices();
      for (var j = 0; j < choices.length; j++) text += "- " + choices[j].getValue() + "\\n";
    } else if (type == FormApp.ItemType.CHECKBOX) {
      var choices = item.asCheckboxItem().getChoices();
      for (var j = 0; j < choices.length; j++) text += "[ ] " + choices[j].getValue() + "\\n";
    }
    text += "\\n";
  }
  Logger.log(text);
}`;

    this.showModal({
      title: 'Hướng Dẫn Trích Xuất Bằng Google Apps Script',
      content: `
        <div class="space-y-4 text-left">
          <div class="space-y-2 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            <div class="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1.5">
              <div class="font-bold text-slate-900 dark:text-white">3 bước lấy toàn bộ câu hỏi (kể cả form nội bộ):</div>
              <ol class="list-decimal pl-4 space-y-1 text-stone-600 dark:text-stone-300">
                <li>Mở biểu mẫu Google Form của bạn ở chế độ Chỉnh sửa (Edit).</li>
                <li>Bấm vào biểu tượng <strong>Ba chấm (...)</strong> ở góc trên bên phải > Chọn <strong>Trình chỉnh sửa tập lệnh (Apps Script)</strong>.</li>
                <li>Dán đoạn mã bên dưới vào khung soạn thảo, bấm <strong>Lưu</strong> rồi bấm <strong>Chạy (Run)</strong>. Kết quả danh sách câu hỏi sẽ xuất hiện ngay trong cửa sổ nhật ký (Execution log).</li>
              </ol>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-stone-700 dark:text-stone-300">Mã Google Apps Script:</span>
              <button type="button" onclick="VibeApp.copyText(\`${scriptCode.replace(/\\/g, '\\\\').replace(/\`/g, '\\\`')}\`)" 
                      class="text-orange-600 dark:text-orange-400 font-bold hover:underline flex items-center gap-1">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>Sao Chép Mã</span>
              </button>
            </div>
            <pre class="p-3 rounded-xl bg-stone-900 text-stone-200 font-mono text-[11px] overflow-x-auto max-h-48 border border-stone-800 select-all leading-normal">${scriptCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>

          <div class="flex gap-2.5 pt-2">
            <button type="button" onclick="VibeApp.closeModal(); VibeApp.switchCreateSurveyTab('SMART_PASTE')" 
                    class="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
              <i data-lucide="clipboard-paste" class="w-4 h-4"></i>
              <span>Đến Khung Dán Text Nhanh</span>
            </button>
            <button type="button" onclick="VibeApp.closeModal()" 
                    class="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all active:scale-95">
              Đóng
            </button>
          </div>
        </div>
      `
    });
  },

  setMobileStudioTab(tab) {
    this.haptic('light');
    this.state.mobileStudioActiveTab = tab;
    this.renderCreateSurveyView(document.getElementById('app-root'));
  },

  openCreateSurveyModal() {
    this.resetStudioToNew(false);
    this.navigate('create-survey');
  },

  async renderCreateSurveyView(root) {
    if (!this.state.velocityBenchmark || this.state.velocityBenchmark.completed_surveys_count === undefined) {
      await this.fetchVelocityBenchmark();
    }
    if (!this.state.currentUser) {
      this.renderGuestLockedView(root, 'Tạo Khảo Sát', 'Vui lòng đăng nhập để bắt đầu thiết kế biểu mẫu khảo sát và thu thập dữ liệu từ cộng đồng.');
      return;
    }

    const user = this.state.currentUser;
    const userCredit = Number(user?.credit_balance || 0);

    // Khởi tạo các biến trạng thái Studio nếu chưa có
    if (!this.state.createSurveyTab) this.state.createSurveyTab = 'BUILDER';
    if (!this.state.studioSidebarSubTab) this.state.studioSidebarSubTab = 'BUDGET';
    if (this.state.activeQuestionIdx === undefined) this.state.activeQuestionIdx = 0;
    if (!this.state.creatorTier || this.state.adminViewMode === 'CREATOR') {
      if (this.state.adminViewMode === 'CREATOR') {
        this.state.creatorTier = 'ENTERPRISE';
      } else {
        this.state.creatorTier = user?.account_tier === 'STUDENT' ? 'STUDENT' : (user?.account_tier === 'ENTERPRISE' ? 'ENTERPRISE' : 'PERSONAL');
      }
    }
    if (!this.state.selectedSla) this.state.selectedSla = 'RECOMMENDED';
    if (!this.state.targetResponses) {
      this.state.targetResponses = this.state.creatorTier === 'STUDENT' ? 50 : 100;
    }
    if (this.state.hasTargeting === undefined) this.state.hasTargeting = false;
    if (this.state.isPinnedSurvey === undefined) this.state.isPinnedSurvey = false;
    if (this.state.surveyDurationDays === undefined) this.state.surveyDurationDays = 14;
    this.loadStudioCatalogVouchersIfNeeded();

    // Khởi tạo danh sách câu hỏi mặc định chuẩn Google Forms nếu chưa có
    if (!this.state.builderQuestions || !Array.isArray(this.state.builderQuestions) || this.state.builderQuestions.length === 0) {
      this.state.builderQuestions = [
        {
          id: 'q_init_1',
          type: 'SINGLE_CHOICE',
          content: 'Bạn đánh giá thế nào về chất lượng và độ tiện ích của dịch vụ này?',
          options: ['Rất hài lòng', 'Hài lòng', 'Bình thường', 'Cần cải thiện thêm'],
          is_required: true,
          is_screener: false
        },
        {
          id: 'q_init_2',
          type: 'CHOICE_GRID',
          content: 'Đánh giá chi tiết các khía cạnh trải nghiệm của bạn:',
          rows: ['Giao diện người dùng', 'Tốc độ xử lý hệ thống', 'Mức độ bảo mật dữ liệu', 'Chất lượng hỗ trợ đáp viên'],
          columns: ['Kém', 'Trung bình', 'Khá', 'Tốt', 'Rất tốt'],
          is_required: true,
          is_screener: false
        },
        {
          id: 'q_init_3',
          type: 'LINEAR_SCALE',
          content: 'Mức độ sẵn sàng giới thiệu nền tảng này cho bạn bè hoặc đồng nghiệp?',
          options: ['1', '2', '3', '4', '5'],
          min_label: 'Hoàn toàn không sẵn sàng',
          max_label: 'Cực kỳ sẵn sàng',
          is_required: false,
          is_screener: false
        }
      ];
    }

    const calc = this.calculateStudioEscrow();

    root.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-5 pb-16">
        
        <!-- Top Action Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-stone-200/80 dark:border-stone-800">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-orange-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-stone-700">
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                <span>Form Studio</span>
              </span>
              <span class="text-xs text-stone-500 dark:text-stone-400">• 12 định dạng</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">${this.state.editingSurveyId ? 'Chỉnh Sửa Khảo Sát' : 'Thiết Kế Khảo Sát Mới'}</h1>
            <p class="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">Soạn thảo trực quan & tính ký quỹ real-time.</p>
          </div>

          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            ${this.state.editingSurveyId ? `
              <button onclick="VibeApp.resetStudioToNew()" class="h-9 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5" title="Thoát chế độ sửa và tạo khảo sát mới">
                <i data-lucide="plus-circle" class="w-4 h-4 text-orange-600"></i>
                <span>Tạo Mới Khác</span>
              </button>
            ` : ''}
            <button onclick="VibeApp.navigate('creator-surveys')" class="h-9 px-3 sm:px-3.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
              <span>Khảo Sát Của Tôi</span>
            </button>
            <button onclick="VibeApp.submitFastCreate(true)" class="h-9 px-3 sm:px-3.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 shadow-xs">
              <i data-lucide="save" class="w-4 h-4 text-stone-500"></i>
              <span>Lưu Bản Nháp</span>
            </button>
            <button onclick="VibeApp.submitFastCreate(false)" id="studio-top-publish-btn" class="h-9 px-4 sm:px-4.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold whitespace-nowrap shadow-sm hover:shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2">
              <i data-lucide="send" class="w-4 h-4"></i>
              <span>${calc.isZeroCost ? 'Xuất Bản Miễn Phí (0đ)' : 'Xuất Bản & Ký Quỹ'}</span>
            </button>
          </div>
        </div>

        <!-- THANH ĐIỀU HƯỚNG MOBILE STUDIO (SEGMENTED CONTROL) -->
        <div class="lg:hidden flex items-center p-1.5 bg-stone-100 dark:bg-stone-800/90 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs mb-4">
          <button type="button" onclick="VibeApp.setMobileStudioTab('CANVAS')" 
                  class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${(this.state.mobileStudioActiveTab || 'CANVAS') === 'CANVAS'
        ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-sm'
        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
      }">
            <i data-lucide="file-text" class="w-4 h-4"></i>
            <span>Soạn Câu Hỏi (${this.state.builderQuestions ? this.state.builderQuestions.length : 0})</span>
          </button>
          <button type="button" onclick="VibeApp.setMobileStudioTab('SIDEBAR')" 
                  class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${this.state.mobileStudioActiveTab === 'SIDEBAR'
        ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-sm'
        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
      }">
            <i data-lucide="sliders-horizontal" class="w-4 h-4"></i>
            <span>Cài Đặt & Ngân Sách (${calc?.isZeroCost ? '0đ' : `${(calc?.finalEscrowCredit || 0).toLocaleString('vi-VN')}đ`})</span>
          </button>
        </div>

        <!-- TWO-COLUMN STUDIO GRID (2 CỘT CUỘN ĐỘC LẬP RIÊNG BIỆT) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-x-hidden w-full">
          
          <!-- CỘT TRÁI (~65% Canvas Soạn Thảo - Khung Cuộn Độc Lập): lg:col-span-8 -->
          <div id="studio-canvas-scroll" class="${(this.state.mobileStudioActiveTab || 'CANVAS') === 'CANVAS' ? 'block' : 'hidden'} lg:block lg:col-span-8 space-y-5 lg:border-r lg:border-stone-200 dark:lg:border-stone-800 pr-10 sm:pr-12 lg:pr-12 xl:pr-14 lg:h-[calc(100vh-175px)] overflow-x-hidden overflow-y-auto overscroll-contain pb-8">
            
            <!-- THẺ TIÊU ĐỀ BIỂU MẪU (FORM HEADER CARD CHUẨN GOOGLE FORMS) -->
            <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm relative overflow-visible">
              ${this.state.draftCoverImageUrl ? `
                <!-- Ảnh bìa biểu mẫu (Form Cover Banner) -->
                <div class="relative w-full h-32 sm:h-40 rounded-t-2xl overflow-hidden group bg-stone-950 flex items-center justify-center">
                  <img src="${this.state.draftCoverImageUrl}" alt="" class="absolute inset-0 w-full h-full object-cover object-center blur-md opacity-35 scale-105 pointer-events-none">
                  <img src="${this.state.draftCoverImageUrl}" alt="Ảnh bìa khảo sát" class="relative max-h-full max-w-full object-contain mx-auto z-10">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                    <button type="button" onclick="VibeApp.promptStudioCoverImage()" class="px-3 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold hover:bg-stone-100 flex items-center gap-1 shadow-md">
                      <i data-lucide="image" class="w-3.5 h-3.5 text-orange-600"></i>
                      <span>Đổi ảnh bìa</span>
                    </button>
                    <button type="button" onclick="VibeApp.removeStudioCoverImage()" class="px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 flex items-center gap-1 shadow-md">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      <span>Gỡ ảnh</span>
                    </button>
                  </div>
                </div>
              ` : ''}
              <!-- Top Accent Strip màu Cam Vibe #EA580C -->
              <div class="h-2.5 bg-orange-600 w-full ${this.state.draftCoverImageUrl ? '' : 'rounded-t-2xl'}"></div>

              <div class="p-6 sm:p-7 space-y-5">
                ${!this.state.draftCoverImageUrl ? `
                  <!-- Nút thêm ảnh bìa biểu mẫu dạng Ghost Button Notion tinh tế -->
                  <div class="flex items-center justify-end -mb-2">
                    <button type="button" onclick="VibeApp.promptStudioCoverImage()" 
                            class="px-2.5 py-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium transition-colors flex items-center gap-1.5 active:scale-95">
                      <i data-lucide="image-plus" class="w-3.5 h-3.5 stroke-[1.8]"></i>
                      <span>Thêm ảnh bìa</span>
                    </button>
                  </div>
                ` : ''}

                <div>
                  <input type="text" id="fast-title" placeholder="Tiêu đề biểu mẫu khảo sát..." value="${this.state.draftTitle || ''}" oninput="VibeApp.state.draftTitle = this.value" autocomplete="off" spellcheck="false"
                         class="w-full text-xl sm:text-2xl font-black text-slate-900 dark:text-white placeholder:text-stone-400 bg-transparent border-0 border-b-2 border-stone-200 dark:border-stone-800 focus:border-orange-600 focus:outline-none pb-2 transition-colors">
                </div>

                <div>
                  <textarea id="fast-desc" rows="2" placeholder="Mô tả mục đích biểu mẫu khảo sát, hướng dẫn đối tượng làm bài..." oninput="VibeApp.state.draftDesc = this.value" autocomplete="off" spellcheck="false"
                            class="w-full text-xs sm:text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400 bg-transparent border-0 focus:outline-none focus:ring-0 transition-colors resize-none leading-relaxed">${this.state.draftDesc || ''}</textarea>
                </div>

                <!-- Thanh chuyển 3 chế độ nhập liệu -->
                <div class="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-stone-500 dark:text-stone-400">Chế độ tạo:</span>
                    <div class="inline-flex p-1 bg-stone-100 dark:bg-stone-800/90 rounded-xl text-xs font-bold">
                      <button type="button" onclick="VibeApp.switchCreateSurveyTab('BUILDER')" class="py-1.5 px-3 rounded-lg transition-all ${this.state.createSurveyTab === 'BUILDER' ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}">
                        Soạn Trực Tiếp
                      </button>
                      <button type="button" onclick="VibeApp.switchCreateSurveyTab('SMART_PASTE')" class="py-1.5 px-3 rounded-lg transition-all ${this.state.createSurveyTab === 'SMART_PASTE' ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}">
                        Dán Text Nhanh
                      </button>
                      <button type="button" onclick="VibeApp.switchCreateSurveyTab('EXTERNAL_URL')" class="py-1.5 px-3 rounded-lg transition-all ${this.state.createSurveyTab === 'EXTERNAL_URL' ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}">
                        Google / MS Forms
                      </button>
                    </div>
                  </div>

                  <!-- Dropdown Lĩnh Vực -->
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-stone-500 dark:text-stone-400">Lĩnh vực:</span>
                    <div class="relative">
                      <button type="button" onclick="VibeApp.toggleCustomDropdown('studio-category-menu', event)" class="custom-dropdown-trigger py-1.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-xs">
                        <span id="fast-category-display">${this.escapeHtml(this.state.draftCategory || 'Kinh doanh & Thị trường')}</span>
                        <i data-lucide="chevron-down" class="dropdown-trigger-icon w-3 h-3 text-stone-400 transition-transform duration-200"></i>
                      </button>
                      <div id="studio-category-menu" class="custom-dropdown-menu hidden absolute right-0 top-full mt-1 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-30 p-1 space-y-0.5 w-64 max-h-[300px] overflow-y-auto scrollbar-thin">
                        ${(window.VIBE_SYSTEM_CATEGORIES || []).map(cat => `
                          <div onclick="VibeApp.setStudioCategory('${this.escapeHtml(cat.label)}')" class="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer text-xs font-medium flex items-center justify-between text-stone-700 dark:text-stone-300 ${this.state.draftCategory === cat.label ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : ''}">
                            <div class="flex items-center gap-2">
                              <i data-lucide="${cat.icon}" class="w-3.5 h-3.5 text-stone-400"></i>
                              <span>${this.escapeHtml(cat.label)}</span>
                            </div>
                            ${this.state.draftCategory === cat.label ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- TAB 1: NỘI DUNG SOẠN THẢO TRỰC TIẾP (BUILDER) -->
            <div id="create-tab-content-BUILDER" class="${this.state.createSurveyTab === 'BUILDER' ? '' : 'hidden'} space-y-4">
              
              <!-- DANH SÁCH CÂU HỎI STUDIO (Thanh công cụ nổi bên phải đã có đầy đủ chức năng) -->
              <div id="builder-questions-list" class="space-y-4">
                ${this.renderStudioQuestionsHtml()}
              </div>

              <div class="pt-1 flex justify-center">
                <button type="button" onclick="VibeApp.addBuilderQuestion('SINGLE_CHOICE')" class="py-2 px-4 bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-xl text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-orange-600 flex items-center gap-1.5 transition-all shadow-xs">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-orange-600"></i>
                  <span>Thêm câu hỏi mới vào cuối biểu mẫu</span>
                </button>
              </div>

            </div>

            <!-- TAB 2: SMART TEXT PASTE -->
            <div id="create-tab-content-SMART_PASTE" class="${this.state.createSurveyTab === 'SMART_PASTE' ? '' : 'hidden'} space-y-4">
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div class="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
                  <i data-lucide="file-text" class="w-4 h-4 text-orange-600"></i>
                  <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">Dán Văn Bản Thông Minh (Word / Notion / Docs)</h3>
                </div>
                <p class="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Sao chép toàn bộ câu hỏi và đáp án từ tài liệu Word, Notion, Excel hoặc Google Docs rồi dán vào đây. Hệ thống tự động nhận diện câu hỏi, các lựa chọn A, B, C, D hoặc thang điểm Likert 1-5 và cấu trúc hàng cột.
                </p>
                <textarea id="smart-paste-input" rows="9" placeholder="Câu 1: Bạn thường sử dụng thiết bị nào khi học tập và làm việc?&#10;A. Máy tính xách tay (Laptop)&#10;B. Điện thoại thông minh&#10;C. Máy tính để bàn (PC)&#10;&#10;Câu 2: Bạn hài lòng với tốc độ đường truyền internet hiện tại không?&#10;1 - Rất tệ&#10;2 - Tệ&#10;3 - Bình thường&#10;4 - Tốt&#10;5 - Rất tốt"
                          autocomplete="off" spellcheck="false"
                          class="w-full p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-slate-900 dark:text-white text-xs font-mono leading-relaxed focus:ring-1 focus:ring-orange-500 focus:border-orange-500"></textarea>
                <button type="button" onclick="VibeApp.handleSmartPasteSubmit()" class="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                  <i data-lucide="sparkles" class="w-4 h-4"></i>
                  <span>Tự Động Nhận Diện & Nạp Vào Form Studio</span>
                </button>
              </div>
            </div>

            <!-- TAB 3: EXTERNAL URL (GOOGLE & MS FORMS) -->
            <div id="create-tab-content-EXTERNAL_URL" class="${this.state.createSurveyTab === 'EXTERNAL_URL' ? '' : 'hidden'} space-y-4">
              <div class="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
                <div class="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-orange-600/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <i data-lucide="link-2" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <h3 class="text-sm sm:text-base font-black text-slate-900 dark:text-white">Đồng Bộ Khảo Sát Bằng Link Ngoài</h3>
                      <p class="text-xs text-stone-500 dark:text-stone-400">Trích xuất tự động 100% câu hỏi, thang điểm và cờ bắt buộc từ Google Forms & Microsoft Forms</p>
                    </div>
                  </div>
                  <span class="hidden sm:inline-flex px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10.5px] font-bold rounded-lg">Auto Parser v2.5</span>
                </div>
                
                <div class="space-y-3">
                  <label class="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Đường dẫn biểu mẫu Google Forms hoặc Microsoft Forms *</label>
                  <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div class="relative flex-1">
                      <i data-lucide="link" class="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                      <input type="url" id="fast-form-url" 
                             placeholder="Dán liên kết: https://docs.google.com/forms/d/... hoặc forms.gle/..." 
                             value="${this.state.externalFormUrl || ''}"
                             oninput="VibeApp.state.externalFormUrl = this.value"
                             onchange="this.value = VibeApp.normalizeMsFormsUrl ? VibeApp.normalizeMsFormsUrl(this.value) : this.value; VibeApp.state.externalFormUrl = this.value"
                             onpaste="setTimeout(() => { if (VibeApp.normalizeMsFormsUrl) { this.value = VibeApp.normalizeMsFormsUrl(this.value); VibeApp.state.externalFormUrl = this.value; } }, 10)"
                             autocomplete="off" spellcheck="false"
                             class="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                    </div>
                    <button type="button" id="sync-external-form-btn" onclick="VibeApp.syncExternalFormNow()" 
                            class="w-[160px] min-w-[160px] max-w-[160px] py-3 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap shrink-0">
                      <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                      <span>Đồng Bộ Ngay</span>
                    </button>
                  </div>
                </div>

                <!-- 2 Thẻ Giới Thiệu Khả Năng Đồng Bộ -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div class="p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-1">
                    <div class="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                      <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-orange-600"></i>
                      <span>Nhận diện đa dạng định dạng</span>
                    </div>
                    <p class="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      Hỗ trợ link rút gọn forms.gle, link công khai /viewform và cả link chỉnh sửa /edit của Google Forms.
                    </p>
                  </div>
                  <div class="p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-1">
                    <div class="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                      <i data-lucide="shield-check" class="w-3.5 h-3.5 text-orange-600"></i>
                      <span>Mở khóa form giới hạn nội bộ</span>
                    </div>
                    <p class="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      Hỗ trợ đồng bộ biểu mẫu yêu cầu đăng nhập qua Bot Service Account hoặc ủy quyền Google OAuth 2.0 an toàn.
                    </p>
                  </div>
                </div>

                <div class="space-y-2.5 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Google Sheets Webhook URL (Tùy chọn):</label>
                    <button type="button" onclick="VibeApp.openGoogleAppsScriptGuide()" class="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1">
                      <i data-lucide="code" class="w-3.5 h-3.5"></i>
                      <span>Xem mã Apps Script (1-Click)</span>
                    </button>
                  </div>
                  <input type="url" id="fast-google-sheets-url" placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                         autocomplete="off" spellcheck="false"
                         class="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-xs font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                  <p class="text-[11px] text-stone-400">Tự động đồng bộ câu trả lời trực tiếp về trang tính Google Sheets của bạn khi có bài làm hợp lệ.</p>
                </div>

                <!-- Quyền riêng tư: Chế độ thu thập email đáp viên (Email Consent Toggle) -->
                <div class="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 transition-all">
                  <div class="space-y-1">
                    <div class="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <i data-lucide="mail" class="w-4 h-4 text-orange-600 dark:text-orange-400"></i>
                      <span>Thu thập email người trả lời</span>
                    </div>
                    <p class="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">Bật: bạn nhận thêm địa chỉ email tài khoản của người trả lời sau khi họ hoàn thành — đây là thông tin cá nhân duy nhất được chia sẻ. Tắt (mặc định): bài làm hoàn toàn ẩn danh.</p>
                  </div>
                  <input type="checkbox" id="survey-allow-email-collection"
                         ${this.state.studioAllowEmailCollection ? 'checked' : ''}
                         onchange="VibeApp.state.studioAllowEmailCollection = this.checked; if (this.nextElementSibling) { this.nextElementSibling.classList.toggle('active', this.checked); }"
                         class="sr-only peer">
                  <label for="survey-allow-email-collection"
                         class="vibe-switch ${this.state.studioAllowEmailCollection ? 'active' : ''} inline-flex items-center shrink-0"
                         title="${this.state.studioAllowEmailCollection ? 'Bấm để tắt thu thập email' : 'Bấm để bật thu thập email'}">
                    <span class="vibe-switch-knob"></span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          <!-- CỘT PHẢI (~35% Cài Đặt & Ngân Sách - Khung Cuộn Độc Lập): lg:col-span-4 -->
          <div id="studio-sidebar-root" class="${this.state.mobileStudioActiveTab === 'SIDEBAR' ? 'block' : 'hidden'} lg:block lg:col-span-4 space-y-4 lg:pl-2 lg:h-[calc(100vh-175px)] lg:overflow-y-auto overscroll-contain pb-28">
            ${this.renderStudioSidebarHtml()}
          </div>

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async fetchVelocityBenchmark() {
    try {
      const res = await this.api('/surveys/velocity-benchmark');
      if (res && res.success) {
        this.state.velocityBenchmark = {
          has_sufficient_data: res.has_sufficient_data === true,
          completed_surveys_count: res.completed_surveys_count || 0,
          threshold_required: res.threshold_required || 30,
          benchmark: res.benchmark || null
        };
      }
    } catch (e) {
      // Giữ mặc định Cold Start nếu lỗi mạng
      this.state.velocityBenchmark = {
        has_sufficient_data: false,
        completed_surveys_count: 0,
        threshold_required: 30
      };
    }
  },

  getIncentiveEvaluation(effectivePrice, floorPrice) {
    const delta = Math.max(0, effectivePrice - floorPrice);
    const pct = floorPrice > 0 ? Math.round((delta / floorPrice) * 100) : 0;

    let levelText = 'Mức thù lao cơ bản theo quy định sàn';
    let badgeClass = 'text-stone-500 dark:text-stone-400';
    let queuePriority = 'Hàng chờ tiêu chuẩn';

    if (pct === 0) {
      levelText = 'Mức thù lao tiêu chuẩn (Phân phối theo thứ tự tự nhiên)';
      badgeClass = 'text-stone-500 dark:text-stone-400';
      queuePriority = 'Hàng chờ tiêu chuẩn';
    } else if (pct <= 30) {
      levelText = 'Mức thù lao tốt (Ưu tiên hiển thị nổi bật trên danh sách)';
      badgeClass = 'text-orange-600 dark:text-orange-400';
      queuePriority = 'Ưu tiên hiển thị nổi bật';
    } else if (pct <= 70) {
      levelText = 'Mức thù lao cao (Gắn huy hiệu [Thưởng Cao], đáp viên làm trước)';
      badgeClass = 'text-orange-600 dark:text-orange-400';
      queuePriority = 'Đẩy luồng ưu tiên cao';
    } else {
      levelText = 'Mức thù lao vượt trội (Đẩy luồng tối đa, kích thích gom mẫu tức thì)';
      badgeClass = 'text-orange-600 dark:text-orange-400 font-bold';
      queuePriority = 'Ưu tiên tối đa toàn sàn';
    }

    return {
      delta,
      pct,
      levelText,
      badgeClass,
      queuePriority
    };
  },

  calculateStudioEscrow() {
    const user = this.state.currentUser;
    const questions = this.state.builderQuestions || [];
    const qCount = questions.length;

    let lengthCategory = 'SHORT';
    let lengthBadge = 'Ngắn (<=10 câu)';
    if (qCount <= 10) {
      lengthCategory = 'SHORT';
      lengthBadge = 'Ngắn (<=10 câu)';
    } else if (qCount <= 25) {
      lengthCategory = 'MEDIUM';
      lengthBadge = 'Vừa (11–25 câu)';
    } else {
      lengthCategory = 'LONG';
      lengthBadge = 'Dài (>25 câu)';
    }

    const targetN = parseInt(this.state.targetResponses, 10) || 100;
    const tier = this.state.creatorTier || 'PERSONAL';

    const floorMap = {
      STUDENT: { SHORT: 400, MEDIUM: 500, LONG: 600 },
      PERSONAL: { SHORT: 800, MEDIUM: 1000, LONG: 1200 },
      ENTERPRISE: { SHORT: 1500, MEDIUM: 2000, LONG: 2500 }
    };

    const rewardFloorMap = {
      STUDENT: { SHORT: 350, MEDIUM: 450, LONG: 540 },
      PERSONAL: { SHORT: 600, MEDIUM: 750, LONG: 900 },
      ENTERPRISE: { SHORT: 1000, MEDIUM: 1300, LONG: 1600 }
    };

    const floorPrice = floorMap[tier]?.[lengthCategory] || 1000;
    const rewardFloor = rewardFloorMap[tier]?.[lengthCategory] || 750;

    const slaPrices = {
      FLOOR: floorPrice,
      RECOMMENDED: Math.round(floorPrice * 1.25),
      RUSH: Math.round(floorPrice * 1.60)
    };

    let effectivePrice = slaPrices[this.state.selectedSla] || slaPrices.RECOMMENDED;
    if (this.state.customPricePerResponse && this.state.customPricePerResponse >= floorPrice) {
      effectivePrice = this.state.customPricePerResponse;
    }

    // Delta P & Creator Boost Share (Chuẩn 80% điền / 20% sàn)
    const deltaP = Math.max(0, effectivePrice - floorPrice);
    const alpha = 0.80;
    const boostShareText = '80% điền / 20% sàn';
    const boostRespondent = Math.floor(alpha * deltaP);
    const boostPlatform = deltaP - boostRespondent;

    const respondentReward = rewardFloor + boostRespondent;
    const platformFee = (floorPrice - rewardFloor) + boostPlatform;

    // Targeting fee
    const hasTargeting = this.state.hasTargeting === true;
    let targetingFeePerSample = 0;
    let targetingFeeText = 'Miễn phí';
    if (hasTargeting) {
      if (tier === 'STUDENT') {
        targetingFeePerSample = 100;
        targetingFeeText = '+100đ / mẫu';
      } else if (tier === 'PERSONAL') {
        targetingFeePerSample = 200;
        targetingFeeText = '+200đ / mẫu';
      } else {
        targetingFeePerSample = 0;
        targetingFeeText = 'Miễn phí 100% (DN)';
      }
    }


    const demo = this.state.targetDemographics || {};
    let targetFiltersCount = 0;
    if (demo.gender && demo.gender !== 'ALL') targetFiltersCount++;
    if (demo.age_group && demo.age_group !== 'ALL') targetFiltersCount++;
    if (demo.region && demo.region !== 'ALL') targetFiltersCount++;
    if (demo.occupation && demo.occupation !== 'ALL') targetFiltersCount++;
    if (demo.university && demo.university !== 'ALL') targetFiltersCount++;

    // Đánh giá Mức Độ Sẵn Sàng Dữ Liệu & Lực Hút Thù Lao (Adaptive SLA Engine)
    const benchmarkInfo = this.state.velocityBenchmark || { has_sufficient_data: false, completed_surveys_count: 0, threshold_required: 30 };
    const isDataDriven = benchmarkInfo.has_sufficient_data === true;
    const completedSurveysCount = benchmarkInfo.completed_surveys_count || 0;
    const thresholdRequired = benchmarkInfo.threshold_required || 30;

    const incentiveFloor = this.getIncentiveEvaluation(slaPrices.FLOOR, floorPrice);
    const incentiveRecommended = this.getIncentiveEvaluation(slaPrices.RECOMMENDED, floorPrice);
    const incentiveRush = this.getIncentiveEvaluation(slaPrices.RUSH, floorPrice);
    const incentiveCurrent = this.getIncentiveEvaluation(effectivePrice, floorPrice);

    // Tính toán thời gian thực tế NẾU đã đủ dữ liệu (isDataDriven = true)
    let actualEtaFloor = '~2 – 3 ngày';
    let actualEtaRecommended = '~24 – 36 giờ';
    let actualEtaRush = '~6 – 12 giờ';
    let actualEtaCurrent = '~24 – 36 giờ';

    if (isDataDriven && benchmarkInfo.benchmark && benchmarkInfo.benchmark.tierSpeeds) {
      const speeds = benchmarkInfo.benchmark.tierSpeeds;
      const hFloor = Math.max(1, Math.round((speeds.FLOOR.avgHoursPer100 * targetN) / 100));
      const hRec = Math.max(1, Math.round((speeds.RECOMMENDED.avgHoursPer100 * targetN) / 100));
      const hRush = Math.max(1, Math.round((speeds.RUSH.avgHoursPer100 * targetN) / 100));

      actualEtaFloor = hFloor >= 24 ? `~${Math.round(hFloor / 24)} ngày` : `~${hFloor} giờ`;
      actualEtaRecommended = hRec >= 24 ? `~${Math.round(hRec / 24)} ngày` : `~${hRec} giờ`;
      actualEtaRush = hRush >= 24 ? `~${Math.round(hRush / 24)} ngày` : `~${hRush} giờ`;

      const curRatio = Math.max(1, effectivePrice / floorPrice);
      const hCur = Math.max(1, Math.round((speeds.RECOMMENDED.avgHoursPer100 * targetN) / (100 * curRatio)));
      actualEtaCurrent = hCur >= 24 ? `~${Math.round(hCur / 24)} ngày` : `~${hCur} giờ`;
    }

    let targetingSummaryText = 'Mở toàn quốc (Không lọc)';
    if (hasTargeting) {
      if (targetFiltersCount === 0) targetingSummaryText = 'Đang bật bộ lọc (Chưa chọn tiêu chí)';
      else targetingSummaryText = `Đang lọc ${targetFiltersCount} tiêu chí nhân khẩu học`;
    }

    // Pin fee
    let pinFeeVnd = 0;
    if (this.state.isPinnedSurvey) {
      const tickets = (user?.fast_track_tickets || 0);
      if (tickets <= 0) {
        pinFeeVnd = tier === 'STUDENT' ? 15000 : 40000;
      }
    }

    // Voucher quà tặng kèm theo (Chỉ áp dụng cho Doanh Nghiệp)
    let voucherCostCredit = 0;
    let voucherSummaryText = '';
    const hasVoucher = this.isEnterpriseUser() && this.state.studioHasVoucher === true;
    const voucherMode = this.state.studioVoucherMode || 'CUSTOM';

    if (hasVoucher) {
      if (voucherMode === 'CATALOG' && this.state.studioCatalogVoucher) {
        const cat = this.state.studioCatalogVoucher;
        const qty = parseInt(this.state.studioCatalogVoucherQty, 10) || targetN;
        const faceVal = Number(cat.face_value_vnd) || 0;
        voucherCostCredit = qty * faceVal;
        voucherSummaryText = `${cat.brand_name} x ${qty} mã`;
      } else if (voucherMode === 'CUSTOM') {
        const customBrand = this.state.studioCustomVoucherBrand || 'Doanh Nghiệp';
        voucherSummaryText = `${customBrand} (Tự cấp - 0đ)`;
      }
    }

    // Free Quota deduction
    let freeDeductionSamples = 0;
    const userFreeQuota = user ? (user.free_quota_remaining !== undefined ? user.free_quota_remaining : 0) : 0;
    const userFreeTrials = user ? (user.free_trial_surveys_available || 0) : 0;

    if (tier === 'STUDENT' && user?.account_tier === 'STUDENT') {
      // 30 lượt/tháng: trừ tối đa 10 lượt cho mỗi 50 mẫu đăng
      const studentQuota = userFreeQuota > 0 ? userFreeQuota : (userFreeTrials > 0 ? 30 : 0);
      const batches = Math.floor(targetN / 50);
      const maxEligible = Math.min(30, batches * 10);
      freeDeductionSamples = Math.min(studentQuota, maxEligible);
    } else if (userFreeQuota > 0 || userFreeTrials > 0) {
      const quota = userFreeQuota > 0 ? userFreeQuota : 25;
      freeDeductionSamples = Math.min(targetN, Math.min(quota, 25));
    }

    const freeDeductionVnd = freeDeductionSamples * effectivePrice;
    const payableSamples = Math.max(0, targetN - freeDeductionSamples);
    const targetingFeeVnd = payableSamples * targetingFeePerSample;

    const finalEscrowCredit = Math.max(0, (payableSamples * effectivePrice) + targetingFeeVnd + pinFeeVnd + voucherCostCredit);
    const isZeroCost = finalEscrowCredit === 0;

    return {
      tier,
      qCount,
      questionCount: qCount,
      lengthCategory,
      lengthBadge,
      floorPrice,
      slaPrices,
      effectivePrice,
      boostShareText,
      respondentReward,
      platformFee,
      hasTargeting,
      targetingFeePerSample,
      targetingFeeText,
      targetingFeeVnd,
      pinFeeVnd,
      hasVoucher,
      voucherMode,
      voucherCostCredit,
      voucherSummaryText,
      freeDeductionSamples,
      freeDeductionVnd,
      finalEscrowCredit,
      isZeroCost,
      targetN,
      targetFiltersCount,
      targetingSummaryText,
      incentiveFloor,
      incentiveRecommended,
      incentiveRush,
      incentiveCurrent,
      isDataDriven,
      completedSurveysCount,
      thresholdRequired,
      actualEtaFloor,
      actualEtaRecommended,
      actualEtaRush,
      actualEtaCurrent
    };
  },

  setStudioCreatorTier(tier) {
    this.haptic('light');
    this.state.creatorTier = tier;
    if (this.state.customPricePerResponse) {
      delete this.state.customPricePerResponse;
    }
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setStudioSlaTier(slaKey) {
    this.haptic('light');
    this.state.selectedSla = slaKey;
    const calc = this.calculateStudioEscrow();
    this.state.customPricePerResponse = calc.slaPrices[slaKey] || calc.floorPrice;
    const slider = document.getElementById('studio-boost-slider') || document.querySelector('input[type="range"][oninput*="updateStudioBoostRealtime"]');
    if (slider) slider.value = this.state.customPricePerResponse;
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setStudioCustomPrice(val) {
    this.state.selectedSla = 'CUSTOM';
    this.state.customPricePerResponse = parseInt(val, 10);
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setStudioTargetResponses(val) {
    this.state.targetResponses = parseInt(val, 10) || 10;
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  toggleStudioTargeting(isChecked) {
    this.haptic('light');
    this.state.hasTargeting = !!isChecked;
    const switchEl = document.getElementById('studio-has-targeting');
    if (switchEl) {
      switchEl.classList.toggle('active', !!isChecked);
      switchEl.setAttribute('aria-checked', isChecked ? 'true' : 'false');
    }
    setTimeout(() => {
      if (!this.refreshStudioSidebarView()) {
        this.renderCreateSurveyView(document.getElementById('app-root'));
      }
    }, 180);
  },

  toggleStudioPinned(isChecked) {
    this.haptic('light');
    this.state.isPinnedSurvey = !!isChecked;
    const switchEl = document.getElementById('studio-is-pinned');
    if (switchEl) {
      switchEl.classList.toggle('active', !!isChecked);
      switchEl.setAttribute('aria-checked', isChecked ? 'true' : 'false');
    }
    setTimeout(() => {
      if (!this.refreshStudioSidebarView()) {
        this.renderCreateSurveyView(document.getElementById('app-root'));
      }
    }, 180);
  },

  toggleStudioVoucher(isChecked) {
    this.haptic('light');
    if (isChecked && !this.isEnterpriseUser()) {
      this.state.studioHasVoucher = false;
      this.showToast('Tính năng đính kèm E-Voucher quà tặng chỉ hỗ trợ gói tài khoản Doanh Nghiệp (Enterprise)', 'warning');
      if (!this.refreshStudioSidebarView()) {
        this.renderCreateSurveyView(document.getElementById('app-root'));
      }
      return;
    }
    this.state.studioHasVoucher = isChecked;
    if (isChecked) {
      if (!this.state.studioVoucherMode) {
        this.state.studioVoucherMode = 'CUSTOM';
      }
      this.loadStudioCatalogVouchersIfNeeded();
    }
    const switchEl = document.getElementById('studio-voucher-switch');
    if (switchEl) {
      switchEl.classList.toggle('active', !!isChecked);
      switchEl.setAttribute('aria-checked', isChecked ? 'true' : 'false');
    }
    setTimeout(() => {
      if (!this.refreshStudioSidebarView()) {
        this.renderCreateSurveyView(document.getElementById('app-root'));
      }
    }, 180);
  },

  setStudioVoucherMode(mode) {
    this.haptic('light');
    this.state.studioVoucherMode = mode;
    if (mode === 'CATALOG') {
      this.loadStudioCatalogVouchersIfNeeded();
    }
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setStudioCustomVoucherField(field, val) {
    if (field === 'brand') this.state.studioCustomVoucherBrand = val;
    if (field === 'title') this.state.studioCustomVoucherTitle = val;
    if (field === 'val') {
      this.state.studioCustomVoucherVal = parseInt(val, 10) || 0;
      this.refreshStudioSidebarView();
      return;
    }
    if (field === 'expiry') this.state.studioCustomVoucherExpiry = val;
    if (field === 'inst') this.state.studioCustomVoucherInst = val;
  },

  setStudioCustomVoucherType(type) {
    this.haptic('light');
    this.state.studioCustomVoucherType = type;
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setStudioCustomSingleCode(code) {
    this.state.studioCustomSingleCode = (code || '').trim().toUpperCase();
  },

  setStudioCustomCodesList(text) {
    this.state.studioCustomCodesList = text || '';
  },

  getStudioCustomCodesCount() {
    const raw = this.state.studioCustomCodesList || '';
    return raw.split(/[\r\n,]+/).map(c => c.trim()).filter(Boolean).length;
  },

  selectStudioCatalogVoucher(catId) {
    this.haptic('light');
    this.state.studioSelectedCatalogId = catId;
    const list = this.state.studioCatalogVouchers || window.DEFAULT_STUDIO_CATALOG_VOUCHERS || [];
    const found = list.find(c => c.id === catId);
    if (found) {
      this.state.studioCatalogVoucher = found;
    }
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setStudioCatalogVoucherQty(val) {
    const q = parseInt(val, 10) || 1;
    this.state.studioCatalogVoucherQty = Math.max(1, q);
    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  async loadStudioCatalogVouchersIfNeeded() {
    if (this.state.studioCatalogVouchers && this.state.studioCatalogVouchers.length > 0) {
      return;
    }
    try {
      const res = await this.api('/vouchers/catalog');
      const list = res.catalog || res.vouchers || [];
      if (list.length > 0) {
        this.state.studioCatalogVouchers = list;
        if (!this.state.studioSelectedCatalogId) {
          this.state.studioSelectedCatalogId = list[0].id;
          this.state.studioCatalogVoucher = list[0];
        }
        this.refreshStudioSidebarView();
      }
    } catch (e) {
      if (!this.state.studioCatalogVouchers) {
        this.state.studioCatalogVouchers = window.DEFAULT_STUDIO_CATALOG_VOUCHERS || [];
        if (!this.state.studioSelectedCatalogId && this.state.studioCatalogVouchers.length > 0) {
          this.state.studioSelectedCatalogId = this.state.studioCatalogVouchers[0].id;
          this.state.studioCatalogVoucher = this.state.studioCatalogVouchers[0];
        }
      }
    }
  },

  renderStudioCatalogVouchersListHtml() {
    const list = this.state.studioCatalogVouchers || window.DEFAULT_STUDIO_CATALOG_VOUCHERS || [];
    if (list.length === 0) {
      return `
        <div class="p-3 text-center text-xs text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-xl">
          Đang tải danh mục voucher từ kho sàn...
        </div>
      `;
    }

    const selectedId = this.state.studioSelectedCatalogId || (list[0] && list[0].id);
    if (!this.state.studioCatalogVoucher && list.length > 0) {
      this.state.studioCatalogVoucher = list.find(c => c.id === selectedId) || list[0];
      this.state.studioSelectedCatalogId = this.state.studioCatalogVoucher.id;
    }

    return `
      <div class="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
        ${list.map(c => {
      const isSelected = c.id === selectedId;
      const faceVal = Number(c.face_value_vnd || 0);
      return `
            <div onclick="VibeApp.selectStudioCatalogVoucher('${c.id}')" 
                 class="p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${isSelected
          ? 'border-orange-600 bg-orange-50/60 dark:bg-stone-800 ring-1 ring-orange-500/40'
          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900'
        }">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 border border-stone-200/60 dark:border-stone-700 overflow-hidden">
                  ${c.brand_logo ? `<img src="${c.brand_logo}" alt="${c.brand_name}" class="w-6 h-6 object-contain" onerror="this.onerror=null;this.src='/assets/logos/default-voucher.svg';">` : `<i data-lucide="tag" class="w-4 h-4 text-orange-600"></i>`}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-stone-900 dark:text-white truncate">${c.brand_name}</span>
                    <span class="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">${c.remaining_quantity || 0} mã sẵn</span>
                  </div>
                  <div class="text-[10px] text-stone-500 truncate">${c.title || 'Voucher quà tặng'}</div>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs font-mono font-black text-orange-600 dark:text-orange-400">${faceVal.toLocaleString('vi-VN')} Credit</span>
                <div class="w-4 h-4 rounded-full border-2 ${isSelected ? 'border-orange-600 bg-orange-600' : 'border-stone-300 dark:border-stone-600'} flex items-center justify-center">
                  ${isSelected ? '<div class="w-1.5 h-1.5 rounded-full bg-white"></div>' : ''}
                </div>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  },

  setStudioDuration(days, preserveFocus = false) {
    const val = parseInt(days, 10);
    this.state.surveyDurationDays = (isNaN(val) || val <= 0) ? 14 : Math.min(90, Math.max(1, val));

    if (preserveFocus) {
      const input1 = document.getElementById('fast-survey-duration');
      if (input1 && parseInt(input1.value, 10) !== this.state.surveyDurationDays) {
        input1.value = this.state.surveyDurationDays;
      }
      const input2 = document.getElementById('tab2-survey-duration');
      if (input2 && parseInt(input2.value, 10) !== this.state.surveyDurationDays) {
        input2.value = this.state.surveyDurationDays;
      }
      return;
    }

    if (!this.refreshStudioSidebarView()) {
      this.renderCreateSurveyView(document.getElementById('app-root'));
    }
  },

  setActiveBuilderQuestion(qIdx) {
    if (this.state.activeQuestionIdx === qIdx) return;
    this.state.activeQuestionIdx = qIdx;

    // Cập nhật viền trực tiếp không làm re-render DOM gây mất focus
    const cards = document.querySelectorAll('.studio-question-card');
    cards.forEach((card, idx) => {
      if (idx === qIdx) {
        card.classList.add('border-l-4', 'border-l-orange-600', 'border-stone-300', 'dark:border-stone-700', 'shadow-md', 'ring-1', 'ring-orange-500/10');
        card.classList.remove('border-l-transparent', 'border-stone-200', 'dark:border-stone-800', 'hover:border-stone-300', 'dark:hover:border-stone-700', 'shadow-xs');
      } else {
        card.classList.remove('border-l-4', 'border-l-orange-600', 'border-stone-300', 'dark:border-stone-700', 'shadow-md', 'ring-1', 'ring-orange-500/10');
        card.classList.add('border-l-4', 'border-l-transparent', 'border-stone-200', 'dark:border-stone-800', 'hover:border-stone-300', 'dark:hover:border-stone-700', 'shadow-xs');
      }
    });
  },

  renderStudioQuestionsHtml() {
    const list = this.state.builderQuestions || [];
    if (list.length === 0) {
      return `
        <div class="text-center py-10 bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl text-stone-400 text-xs">
          Biểu mẫu chưa có câu hỏi nào. Bấm nút <strong>"+ Thêm Câu Hỏi"</strong> để bắt đầu soạn!
        </div>
      `;
    }

    const activeIdx = this.state.activeQuestionIdx !== undefined ? this.state.activeQuestionIdx : 0;

    return list.map((q, qIdx) => {
      const isActive = qIdx === activeIdx;
      const typeInfo = this.getStudioQuestionTypeInfo(q.type);
      const isReq = q.is_required !== 0 && q.is_required !== false;

      let valObj = null;
      let restrictionBadgeHtml = '';
      if (['SHORT_TEXT', 'PARAGRAPH'].includes(q.type)) {
        valObj = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
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

            const detectedRange = engine ? engine.extractNumberRange(`${q.placeholder || ''} ${q.description || ''} ${q.content || ''} ${valObj?.placeholder || ''}`) : null;
            if (vRule === 'BETWEEN' && hasMin && hasMax) {
              badgeText = `Số: ${valObj.min} ~ ${valObj.max}`;
            } else if (detectedRange) {
              badgeText = `Số: ${detectedRange.min} ~ ${detectedRange.max}`;
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
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-[10px] font-bold tracking-tight shrink-0 shadow-2xs select-none" title="Ràng buộc: ${badgeText}">
                <i data-lucide="shield-alert" class="w-2.5 h-2.5"></i>
                <span>[${badgeText}]</span>
              </span>
            `;
          }
        }
      }

      return `
      <!-- Question Card #${qIdx + 1} (Google Forms Style) -->
      <div id="studio-q-card-${qIdx}" 
           onclick="VibeApp.setActiveBuilderQuestion(${qIdx})" 
           class="studio-question-card group/card bg-white dark:bg-[#18181B] border rounded-2xl p-5 sm:p-6 space-y-4 text-xs transition-all cursor-pointer relative overflow-visible ${isActive
          ? 'border-l-4 border-l-orange-600 border-stone-300 dark:border-stone-700 shadow-md ring-1 ring-orange-500/10'
          : 'border-l-4 border-l-transparent border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 shadow-xs'
        }">
        
        <!-- Thanh Công Cụ Nổi Dọc Google Forms (Floating Action Toolbar) Tự Động Hiện Theo Con Trỏ Chuột Hover -->
        <div class="studio-floating-toolbar hidden sm:flex flex-col items-center gap-0.5 p-1 absolute left-[calc(100%+6px)] top-2 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-700/80 rounded-2xl shadow-lg z-30 select-none opacity-0 pointer-events-none group-hover/card:opacity-100 group-hover/card:pointer-events-auto transition-all duration-150 before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4">
          
          <!-- 1. Thêm câu hỏi (+) -->
          <button type="button" onclick="event.stopPropagation(); VibeApp.addBuilderQuestion('SINGLE_CHOICE', ${qIdx})" 
                  class="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-stone-800 transition-colors relative group/btn" 
                  title="Thêm câu hỏi">
            <i data-lucide="plus-circle" class="w-4 h-4 stroke-[2]"></i>
            <span class="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none shadow-md z-40">
              Thêm câu hỏi
            </span>
          </button>

          <!-- 2. Nhập câu hỏi (Import questions) -->
          <button type="button" onclick="event.stopPropagation(); VibeApp.switchCreateSurveyTab('SMART_PASTE')" 
                  class="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-stone-800 transition-colors relative group/btn" 
                  title="Nhập câu hỏi từ văn bản">
            <i data-lucide="file-input" class="w-4 h-4 stroke-[2]"></i>
            <span class="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none shadow-md z-40">
              Nhập câu hỏi
            </span>
          </button>

          <!-- 3. Thêm tiêu đề và mô tả (Tt) -->
          <button type="button" onclick="event.stopPropagation(); VibeApp.addStudioTextBlock(${qIdx})" 
                  class="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-stone-800 transition-colors relative group/btn" 
                  title="Thêm tiêu đề và mô tả">
            <i data-lucide="type" class="w-4 h-4 stroke-[2]"></i>
            <span class="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none shadow-md z-40">
              Thêm tiêu đề và mô tả
            </span>
          </button>

          <!-- 4. Thêm hình ảnh -->
          <button type="button" onclick="event.stopPropagation(); VibeApp.openImagePickerModal('question', ${qIdx})" 
                  class="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-stone-800 transition-colors relative group/btn" 
                  title="Thêm hình ảnh">
            <i data-lucide="image" class="w-4 h-4 stroke-[2]"></i>
            <span class="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none shadow-md z-40">
              Thêm hình ảnh
            </span>
          </button>

          <!-- 5. Thêm video (YouTube) -->
          <button type="button" onclick="event.stopPropagation(); VibeApp.addStudioVideoBlock(${qIdx})" 
                  class="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-stone-800 transition-colors relative group/btn" 
                  title="Thêm video">
            <i data-lucide="video" class="w-4 h-4 stroke-[2]"></i>
            <span class="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none shadow-md z-40">
              Thêm video
            </span>
          </button>

          <!-- 6. Thêm phần (Add Section ==) -->
          <button type="button" onclick="event.stopPropagation(); VibeApp.addStudioSection(${qIdx})" 
                  class="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-stone-800 transition-colors relative group/btn" 
                  title="Thêm phần">
            <i data-lucide="split" class="w-4 h-4 stroke-[2]"></i>
            <span class="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none shadow-md z-40">
              Thêm phần
            </span>
          </button>

        </div>
        
        <!-- 6-Dots Drag Handle At Center Top -->
        <div class="flex justify-center text-stone-300 dark:text-stone-600 -mt-2 cursor-grab select-none">
          <svg class="w-6 h-3.5 fill-current" viewBox="0 0 24 14">
            <circle cx="5" cy="4" r="1.8"/>
            <circle cx="12" cy="4" r="1.8"/>
            <circle cx="19" cy="4" r="1.8"/>
            <circle cx="5" cy="10" r="1.8"/>
            <circle cx="12" cy="10" r="1.8"/>
            <circle cx="19" cy="10" r="1.8"/>
          </svg>
        </div>

        <!-- Question Header Row -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div class="flex-1 flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
              ${qIdx + 1}
            </span>
            <input type="text" value="${(q.content || '').replace(/"/g, '&quot;')}" 
                   onclick="event.stopPropagation()"
                   oninput="VibeApp.updateBuilderQuestionContent(${qIdx}, this.value)" 
                   autocomplete="off" spellcheck="false"
                   placeholder="Nhập tiêu đề câu hỏi..."
                   class="flex-1 p-2 bg-transparent border-0 border-b border-stone-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-orange-600 focus:outline-none transition-colors">
            ${restrictionBadgeHtml}
          </div>

          <!-- Menu Chọn 1 trong 12 định dạng chuẩn Google Forms -->
          <div class="shrink-0 relative">
            <button type="button" onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('studio-q-type-${qIdx}')"
                    class="h-9 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5 shadow-xs hover:border-orange-500 transition-all">
              <i data-lucide="${typeInfo.icon}" class="w-3.5 h-3.5 text-orange-600 shrink-0"></i>
              <span class="whitespace-nowrap">${typeInfo.label}</span>
              <i data-lucide="chevron-down" class="w-3 h-3 text-stone-400 shrink-0"></i>
            </button>

            <!-- Dropdown 12 Định Dạng -->
            <div id="studio-q-type-${qIdx}" class="custom-dropdown-menu hidden absolute right-0 z-50 mt-1.5 min-w-[280px] max-h-[360px] sm:max-h-[390px] overflow-y-auto overscroll-contain p-2 rounded-2xl bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] shadow-2xl space-y-0.5 scrollbar-thin">
              
              <div class="px-2.5 py-1 text-[9.5px] font-bold uppercase text-stone-400 dark:text-stone-500 tracking-wider">1. Lựa chọn (Choice)</div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'SINGLE_CHOICE')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'SINGLE_CHOICE' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="circle-dot" class="w-3.5 h-3.5"></i> Trắc nghiệm (1 đáp án)</span>
              </div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'MULTIPLE_CHOICE')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'MULTIPLE_CHOICE' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="check-square" class="w-3.5 h-3.5"></i> Hộp kiểm (Nhiều đáp án)</span>
              </div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'DROPDOWN')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'DROPDOWN' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="chevron-down-circle" class="w-3.5 h-3.5"></i> Menu thả xuống (Dropdown)</span>
              </div>

              <div class="px-2.5 pt-2 pb-1 text-[9.5px] font-bold uppercase text-stone-400 dark:text-stone-500 tracking-wider border-t border-stone-100 dark:border-stone-800">2. Văn bản (Text)</div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'SHORT_TEXT')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'SHORT_TEXT' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="minus" class="w-3.5 h-3.5"></i> Trả lời ngắn (1 dòng)</span>
              </div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'PARAGRAPH')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'PARAGRAPH' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="align-left" class="w-3.5 h-3.5"></i> Đoạn văn (Tự luận dài)</span>
              </div>

              <div class="px-2.5 pt-2 pb-1 text-[9.5px] font-bold uppercase text-stone-400 dark:text-stone-500 tracking-wider border-t border-stone-100 dark:border-stone-800">3. Thang đo & Lưới Ma Trận (Grid)</div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'LINEAR_SCALE')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'LINEAR_SCALE' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="sliders" class="w-3.5 h-3.5"></i> Phạm vi tuyến tính</span>
              </div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'CHOICE_GRID')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'CHOICE_GRID' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="grid-2x2" class="w-3.5 h-3.5"></i> Lưới trắc nghiệm (Radio Grid)</span>
              </div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'CHECKBOX_GRID')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'CHECKBOX_GRID' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="layout-grid" class="w-3.5 h-3.5"></i> Lưới hộp kiểm (Checkbox Grid)</span>
              </div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'RATING_STARS')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'RATING_STARS' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="star" class="w-3.5 h-3.5"></i> Đánh giá sao (1–5 Sao)</span>
              </div>

              <div class="px-2.5 pt-2 pb-1 text-[9.5px] font-bold uppercase text-stone-400 dark:text-stone-500 tracking-wider border-t border-stone-100 dark:border-stone-800">4. Tệp & Thời gian</div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'FILE_UPLOAD')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'FILE_UPLOAD' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i> Tải tệp lên (File Upload)</span>
              </div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'DATE_INPUT')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'DATE_INPUT' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> Chọn ngày tháng (Date)</span>
              </div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'TIME_INPUT')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'TIME_INPUT' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="clock" class="w-3.5 h-3.5"></i> Chọn giờ phút (Time)</span>
              </div>

              <div class="px-2.5 pt-2 pb-1 text-[9.5px] font-bold uppercase text-stone-400 dark:text-stone-500 tracking-wider border-t border-stone-100 dark:border-stone-800">5. Phân đoạn & Đa phương tiện</div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'VIDEO_BLOCK')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'VIDEO_BLOCK' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="video" class="w-3.5 h-3.5"></i> Video minh họa (YouTube)</span>
              </div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'SECTION_HEADER')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'SECTION_HEADER' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="split" class="w-3.5 h-3.5"></i> Phân đoạn (Thêm phần)</span>
              </div>
              <div onclick="event.stopPropagation(); VibeApp.selectStudioQuestionType(${qIdx}, 'TEXT_BLOCK')" class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer ${q.type === 'TEXT_BLOCK' ? 'text-orange-600 font-bold bg-orange-50 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-200'}">
                <span class="flex items-center gap-2"><i data-lucide="type" class="w-3.5 h-3.5"></i> Tiêu đề & mô tả (Tt)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Question Image Preview in Studio -->
        ${q.image_url ? `
          <div class="relative group my-3 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 shadow-xs" onclick="event.stopPropagation()">
            <img src="${q.image_url}" alt="Ảnh minh họa câu hỏi" class="w-full max-h-72 object-contain bg-black/5 dark:bg-black/40 mx-auto" onerror="this.onerror=null; this.src=''; this.parentElement.classList.add('border-orange-300');">
            <div class="p-2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
              <span class="text-[11px] text-stone-500 font-mono truncate max-w-[200px] sm:max-w-[320px]">${q.image_url}</span>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" onclick="event.stopPropagation(); VibeApp.openImagePickerModal('question', ${qIdx})" class="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-bold transition-colors">
                  Đổi ảnh
                </button>
                <button type="button" onclick="event.stopPropagation(); VibeApp.removeStudioQuestionImage(${qIdx})" class="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[11px] font-bold transition-colors">
                  Gỡ ảnh
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Question Body Content Editor -->
        <div class="pt-2" onclick="event.stopPropagation()">
          ${this.renderStudioQuestionBody(q, qIdx)}
        </div>

        <!-- Question Footer: Duplicate, Trash, Required Switch, Screener & Branching -->
        <div class="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2.5 text-xs" onclick="event.stopPropagation()">
          ${q.type === 'SECTION_HEADER' ? `
            <div class="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium italic">
              <i data-lucide="split" class="w-3.5 h-3.5 text-orange-500/70"></i>
              <span>Phân đoạn biểu mẫu (Chuyển tiếp trang)</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" onclick="event.stopPropagation(); VibeApp.duplicateBuilderQuestion(${qIdx})" class="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1" title="Nhân đôi phân đoạn này">
                <i data-lucide="copy" class="w-4 h-4"></i>
              </button>
              ${list.length > 1 ? `
                <button type="button" onclick="event.stopPropagation(); VibeApp.removeBuilderQuestion(${qIdx})" class="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1" title="Xóa phân đoạn này">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>
          ` : `
          <!-- Tùy chọn ngữ cảnh tinh gọn (Chips/Badges) -->
          <div class="flex flex-wrap items-center gap-1.5">
            <!-- Chip Sàng lọc đối tượng -->
            <button type="button" 
                    onclick="event.stopPropagation(); VibeApp.toggleStudioScreener(${qIdx}, ${!q.is_screener})" 
                    class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${q.is_screener ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 shadow-2xs' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'}">
              <i data-lucide="filter" class="w-3 h-3"></i>
              <span>Sàng lọc</span>
            </button>

            <!-- Nếu là Short Text / Paragraph và chưa có validation: nút thêm giới hạn -->
            ${['SHORT_TEXT', 'PARAGRAPH'].includes(q.type) && (!valObj || !valObj.type || valObj.type === 'NONE') ? `
              <button type="button" 
                      onclick="event.stopPropagation(); VibeApp.setStudioQuestionValidationType(${qIdx}, 'NUMBER')" 
                      class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="shield" class="w-3 h-3"></i>
                <span>Thêm giới hạn</span>
              </button>
            ` : ''}

            <!-- Nếu là Single Choice / Dropdown: Chip Rẽ nhánh logic -->
            ${['SINGLE_CHOICE', 'DROPDOWN'].includes(q.type) ? `
              <button type="button" 
                      onclick="event.stopPropagation(); VibeApp.toggleStudioLogicBranching(${qIdx}, ${!(q.logic && q.logic.enabled)})" 
                      class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${q.logic && q.logic.enabled ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 shadow-2xs' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'}">
                <i data-lucide="git-fork" class="w-3 h-3"></i>
                <span>Rẽ nhánh</span>
              </button>
            ` : ''}
          </div>

          <!-- Actions toolbar: Nhân đôi, Xóa, Bắt buộc -->
          <div class="flex items-center gap-2">
            <button type="button" onclick="event.stopPropagation(); VibeApp.duplicateBuilderQuestion(${qIdx})" class="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1" title="Nhân đôi câu hỏi">
              <i data-lucide="copy" class="w-4 h-4"></i>
            </button>

            ${list.length > 1 ? `
              <button type="button" onclick="event.stopPropagation(); VibeApp.removeBuilderQuestion(${qIdx})" class="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1" title="Xóa câu hỏi">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            ` : ''}

            <span class="h-3.5 w-px bg-stone-200 dark:bg-stone-800 mx-1"></span>

            <!-- Required Switch -->
            <div id="req-toggle-wrap-${qIdx}" onclick="event.stopPropagation(); VibeApp.toggleStudioRequired(${qIdx}, ${!isReq})" class="flex items-center gap-1.5 cursor-pointer select-none">
              <span class="font-semibold text-stone-600 dark:text-stone-400 text-[11px]">
                ${['CHOICE_GRID', 'CHECKBOX_GRID'].includes(q.type) ? 'Yêu cầu mỗi hàng' : 'Bắt buộc'}
              </span>
              <button id="req-btn-${qIdx}" type="button" role="switch" aria-checked="${isReq ? 'true' : 'false'}" class="vibe-switch vibe-switch-xs ${isReq ? 'active' : ''} inline-flex items-center shrink-0 pointer-events-none">
                <span class="vibe-switch-knob"></span>
              </button>
            </div>
          </div>
          `}
        </div>

      </div>
      `;
    }).join('');
  },

  renderStudioQuestionBody(q, qIdx) {
    // 0. KHỐI VIDEO MINH HỌA (YouTube)
    if (q.type === 'VIDEO_BLOCK') {
      const ytEmbed = this.getYouTubeEmbedUrl(q.video_url || '');
      return `
        <div class="p-4 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300">
            <i data-lucide="video" class="w-4 h-4 text-orange-600"></i>
            <span>Đường dẫn Video YouTube:</span>
          </div>
          <div class="flex gap-2">
            <input type="url" value="${(q.video_url || '').replace(/"/g, '&quot;')}" 
                   onclick="event.stopPropagation()"
                   oninput="VibeApp.updateStudioVideoUrl(${qIdx}, this.value)" 
                   autocomplete="off" spellcheck="false"
                   placeholder="Dán link YouTube (VD: https://www.youtube.com/watch?v=... hoặc youtu.be/...)"
                   class="flex-1 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium focus:border-orange-600 focus:outline-none">
          </div>
          ${ytEmbed ? `
            <div class="aspect-video w-full rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-black shadow-sm mt-2">
              <iframe class="w-full h-full" src="${ytEmbed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          ` : `
            <div class="py-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-[11px] text-stone-400">
              Dán đường link YouTube vào ô trên để nhúng video trực tiếp vào bài khảo sát
            </div>
          `}
        </div>
      `;
    }

    // 0b. KHỐI PHÂN ĐOẠN (SECTION_HEADER - Thêm phần ==)
    if (q.type === 'SECTION_HEADER') {
      const allQuestions = this.state.builderQuestions || [];
      const totalSections = allQuestions.filter(item => item.type === 'SECTION_HEADER').length;
      const currentSectionNum = allQuestions.slice(0, qIdx + 1).filter(item => item.type === 'SECTION_HEADER').length;

      // Danh sách các Section khác trong toàn bộ biểu mẫu
      const otherSections = allQuestions.map((item, idx) => ({ item, idx }))
        .filter(entry => entry.idx !== qIdx && entry.item.type === 'SECTION_HEADER')
        .map(entry => {
          const secNum = allQuestions.slice(0, entry.idx + 1).filter(item => item.type === 'SECTION_HEADER').length;
          const secTitle = (entry.item.content || '').trim() || `Mục ${secNum}`;
          return {
            id: entry.item.id,
            num: secNum,
            title: secTitle,
            idx: entry.idx,
            item: entry.item
          };
        });

      const curAction = (q.logic && q.logic.default_action) ? q.logic.default_action : ((q.logic && q.logic.target) ? 'GO_TO_PAGE' : 'NEXT_PAGE');
      const curTarget = (q.logic && q.logic.target) || null;

      let curSecLabel = 'Tiếp tục sang phần tiếp theo';
      if (curAction === 'SUBMIT_FORM' || curAction === 'SUBMIT') {
        curSecLabel = 'Gửi biểu mẫu';
      } else if (curAction === 'GO_TO_PAGE' && curTarget) {
        const found = otherSections.find(s => 
          String(s.id) === String(curTarget) || 
          String(s.idx) === String(curTarget) || 
          (s.item && String(s.item.order_index) === String(curTarget)) || 
          (s.item && String(s.item.origin_id) === String(curTarget)) || 
          String(curTarget).endsWith(`:${s.idx}`) || 
          String(curTarget).endsWith(`:${s.item?.order_index}`)
        );
        if (found) {
          curSecLabel = `Chuyển đến Mục ${found.num}: ${found.title}`;
        }
      }

      return `
        <div class="p-4 sm:p-5 bg-gradient-to-r from-orange-50/60 to-transparent dark:from-stone-900 dark:to-transparent rounded-2xl border-2 border-orange-500/40 dark:border-stone-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full bg-orange-600 text-white font-mono text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <i data-lucide="split" class="w-3.5 h-3.5"></i>
              <span>Mục ${currentSectionNum} trên ${Math.max(currentSectionNum, totalSections || 1)}</span>
            </span>
            <span class="text-[11px] text-stone-400 font-medium">Phân đoạn chuyển trang biểu mẫu</span>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-stone-500 mb-1">Mô tả phân đoạn (Tùy chọn):</label>
            <textarea onclick="event.stopPropagation()"
                      oninput="VibeApp.updateStudioSectionDesc(${qIdx}, this.value)" 
                      autocomplete="off" spellcheck="false"
                      placeholder="Nhập phần giải thích, hướng dẫn hoặc lưu ý cho đáp viên khi bắt đầu phần này..." 
                      class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200 focus:border-orange-600 focus:outline-none h-16 resize-none">${(q.rows && q.rows[0]) ? q.rows[0].replace(/"/g, '&quot;') : (q.description ? q.description.replace(/"/g, '&quot;') : '')}</textarea>
          </div>

          <!-- Thanh Cấu Hình Điều Hướng Chân Phân Đoạn Chuẩn Microsoft / Google Forms -->
          <div class="pt-3 border-t border-orange-200/60 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div class="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">
              <i data-lucide="corner-down-right" class="w-3.5 h-3.5 text-orange-600 shrink-0"></i>
              <span>Sau phần ${currentSectionNum}:</span>
            </div>

            <div class="relative">
              <button type="button" 
                      id="sec-nav-btn-${qIdx}"
                      onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('sec-nav-menu-${qIdx}', 'sec-nav-icon-${qIdx}', event)"
                      class="custom-dropdown-trigger h-8 px-3 text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 hover:border-orange-500 flex items-center justify-between gap-2 max-w-[280px] sm:max-w-[340px] truncate shadow-2xs cursor-pointer">
                <span id="sec-nav-label-${qIdx}" class="truncate">${this.escapeHtml(curSecLabel)}</span>
                <i data-lucide="chevron-down" id="sec-nav-icon-${qIdx}" class="custom-dropdown-icon w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 pointer-events-none"></i>
              </button>
              
              <div id="sec-nav-menu-${qIdx}" class="custom-dropdown-menu hidden absolute right-0 top-[calc(100%+4px)] z-50 w-72 sm:w-80 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-xl shadow-2xl p-1.5 space-y-0.5 max-h-[260px] overflow-y-auto scrollbar-thin text-left">
                <!-- 1. Tiếp tục sang phần tiếp theo -->
                <button type="button" 
                        onclick="event.stopPropagation(); VibeApp.setStudioSectionDefaultAction(${qIdx}, 'NEXT_PAGE', null); VibeApp.closeAllCustomDropdowns();"
                        class="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${curAction === 'NEXT_PAGE' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                  <span class="truncate">Tiếp tục sang phần tiếp theo</span>
                  ${curAction === 'NEXT_PAGE' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600 shrink-0"></i>' : ''}
                </button>

                <!-- 2. Danh sách các Mục khác -->
                ${otherSections.map(sec => {
                  const isCur = curAction === 'GO_TO_PAGE' && (
                    String(curTarget) === String(sec.id) || 
                    String(curTarget) === String(sec.idx) || 
                    (sec.item && String(sec.item.order_index) === String(curTarget)) || 
                    (sec.item && String(sec.item.origin_id) === String(curTarget)) || 
                    String(curTarget).endsWith(`:${sec.idx}`) || 
                    String(curTarget).endsWith(`:${sec.item?.order_index}`)
                  );
                  const optText = `Chuyển đến Mục ${sec.num}: ${sec.title}`;
                  return `
                    <button type="button" 
                            onclick="event.stopPropagation(); VibeApp.setStudioSectionDefaultAction(${qIdx}, 'GO_TO_PAGE', '${sec.id}'); VibeApp.closeAllCustomDropdowns();"
                            class="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${isCur ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                      <span class="truncate">${this.escapeHtml(optText)}</span>
                      ${isCur ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600 shrink-0"></i>' : ''}
                    </button>
                  `;
                }).join('')}

                <!-- 3. Gửi biểu mẫu -->
                <button type="button" 
                        onclick="event.stopPropagation(); VibeApp.setStudioSectionDefaultAction(${qIdx}, 'SUBMIT_FORM', null); VibeApp.closeAllCustomDropdowns();"
                        class="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${curAction === 'SUBMIT_FORM' || curAction === 'SUBMIT' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                  <span class="truncate">Gửi biểu mẫu</span>
                  ${curAction === 'SUBMIT_FORM' || curAction === 'SUBMIT' ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600 shrink-0"></i>' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 0c. KHỐI TIÊU ĐỀ & MÔ TẢ (TEXT_BLOCK - Tt)
    if (q.type === 'TEXT_BLOCK') {
      return `
        <div class="p-4 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
          <label class="block text-[11px] font-bold text-stone-500">Nội dung chi tiết:</label>
          <textarea onclick="event.stopPropagation()"
                    oninput="VibeApp.updateStudioSectionDesc(${qIdx}, this.value)" 
                    autocomplete="off" spellcheck="false"
                    placeholder="Nhập thông tin giới thiệu, hướng dẫn hoặc quy định làm bài..." 
                    class="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200 focus:border-orange-600 focus:outline-none h-20 resize-none">${(q.rows && q.rows[0]) ? q.rows[0].replace(/"/g, '&quot;') : ''}</textarea>
        </div>
      `;
    }

    // 1. Trắc nghiệm / Hộp kiểm / Menu thả xuống
    if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(q.type)) {
      const opts = q.options || ['Lựa chọn 1', 'Lựa chọn 2', 'Lựa chọn 3'];
      const iconType = q.type === 'SINGLE_CHOICE' ? 'circle' : (q.type === 'MULTIPLE_CHOICE' ? 'square' : 'chevron-down');
      const isLogicEnabled = ['SINGLE_CHOICE', 'DROPDOWN'].includes(q.type) && q.logic && q.logic.enabled;
      const allQuestions = this.state.builderQuestions || [];

      return `
        <div class="space-y-2 pl-2">
          ${opts.map((opt, optIdx) => {
            const curTarget = (q.logic && q.logic.options && (q.logic.options[optIdx] !== undefined ? q.logic.options[optIdx] : q.logic.options[opt])) || 'NEXT';
            let curOptTargetLabel = 'Tiếp tục câu tiếp theo';
            if (curTarget === 'SUBMIT') {
              curOptTargetLabel = 'Gửi biểu mẫu (Kết thúc)';
            } else if (curTarget !== 'NEXT') {
              const tIdxNum = parseInt(curTarget, 10);
              if (!isNaN(tIdxNum) && allQuestions[tIdxNum]) {
                const tQ = allQuestions[tIdxNum];
                const cleanT = (tQ.content || '').trim();
                const shortT = cleanT.length > 15 ? cleanT.slice(0, 15) + '...' : (cleanT || `(Không tiêu đề)`);
                curOptTargetLabel = tQ.type === 'SECTION_HEADER' ? `Phân đoạn: ${shortT}` : `Câu ${tIdxNum + 1}: ${shortT}`;
              }
            }

            return `
            <div class="flex items-center gap-2">
              <i data-lucide="${iconType}" class="w-3.5 h-3.5 text-stone-400 shrink-0"></i>
              <input type="text" value="${(opt || '').replace(/"/g, '&quot;')}" 
                     onclick="event.stopPropagation()"
                     oninput="VibeApp.updateStudioOptionText(${qIdx}, ${optIdx}, this.value)" 
                     autocomplete="off" spellcheck="false"
                     placeholder="Lựa chọn ${optIdx + 1}..."
                     class="flex-1 p-1.5 bg-transparent border-0 border-b border-stone-200 dark:border-stone-800 focus:border-orange-600 focus:outline-none text-xs text-stone-800 dark:text-stone-200">
              
              ${isLogicEnabled ? `
                <div class="relative shrink-0">
                  <button type="button" 
                          id="opt-logic-btn-${qIdx}-${optIdx}"
                          onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('opt-logic-menu-${qIdx}-${optIdx}', 'opt-logic-icon-${qIdx}-${optIdx}', event)"
                          class="custom-dropdown-trigger h-7 px-2 text-[11px] font-medium bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300 hover:border-orange-500 flex items-center justify-between gap-1 max-w-[180px] sm:max-w-[210px] truncate shadow-2xs cursor-pointer">
                    <span id="opt-logic-label-${qIdx}-${optIdx}" class="truncate">${this.escapeHtml(curOptTargetLabel)}</span>
                    <i data-lucide="chevron-down" id="opt-logic-icon-${qIdx}-${optIdx}" class="custom-dropdown-icon w-3 h-3 text-stone-400 shrink-0 transition-transform duration-200 pointer-events-none"></i>
                  </button>
                  <div id="opt-logic-menu-${qIdx}-${optIdx}" class="custom-dropdown-menu hidden absolute right-0 top-[calc(100%+4px)] z-50 w-56 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-xl shadow-2xl p-1 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin text-left">
                    <button type="button" 
                            onclick="event.stopPropagation(); VibeApp.setStudioOptionLogicTarget(${qIdx}, ${optIdx}, 'NEXT'); const el = document.getElementById('opt-logic-label-${qIdx}-${optIdx}'); if (el) el.textContent = 'Tiếp tục câu tiếp theo'; VibeApp.closeAllCustomDropdowns();"
                            class="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-colors ${curTarget === 'NEXT' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                      <span class="truncate">Tiếp tục câu tiếp theo</span>
                      ${curTarget === 'NEXT' ? '<i data-lucide="check" class="w-3 h-3 text-orange-600 shrink-0"></i>' : ''}
                    </button>
                    ${allQuestions.map((tQ, tIdx) => {
                      if (tIdx === qIdx) return '';
                      const cleanTitle = (tQ.content || '').trim();
                      const shortTitle = cleanTitle.length > 20 ? cleanTitle.slice(0, 20) + '...' : (cleanTitle || `(Không tiêu đề)`);
                      const isSec = tQ.type === 'SECTION_HEADER';
                      const optTitle = isSec ? `Chuyển đến Phân đoạn: ${shortTitle}` : `Chuyển đến Câu ${tIdx + 1}: ${shortTitle}`;
                      const isCur = String(curTarget) === String(tIdx);
                      const safeTargetText = (isSec ? 'Phân đoạn: ' : 'Câu ' + (tIdx + 1) + ': ') + shortTitle;
                      const safeEsc = safeTargetText.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                      return `
                        <button type="button" 
                                onclick="event.stopPropagation(); VibeApp.setStudioOptionLogicTarget(${qIdx}, ${optIdx}, '${tIdx}'); const el = document.getElementById('opt-logic-label-${qIdx}-${optIdx}'); if (el) el.textContent = '${safeEsc}'; VibeApp.closeAllCustomDropdowns();"
                                class="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-colors ${isCur ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                          <span class="truncate">${this.escapeHtml(optTitle)}</span>
                          ${isCur ? '<i data-lucide="check" class="w-3 h-3 text-orange-600 shrink-0"></i>' : ''}
                        </button>
                      `;
                    }).join('')}
                    <button type="button" 
                            onclick="event.stopPropagation(); VibeApp.setStudioOptionLogicTarget(${qIdx}, ${optIdx}, 'SUBMIT'); const el = document.getElementById('opt-logic-label-${qIdx}-${optIdx}'); if (el) el.textContent = 'Gửi biểu mẫu (Kết thúc)'; VibeApp.closeAllCustomDropdowns();"
                            class="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-colors ${curTarget === 'SUBMIT' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                      <span class="truncate">Gửi biểu mẫu (Kết thúc)</span>
                      ${curTarget === 'SUBMIT' ? '<i data-lucide="check" class="w-3 h-3 text-orange-600 shrink-0"></i>' : ''}
                    </button>
                  </div>
                </div>
              ` : ''}

              ${opts.length > 2 ? `
                <button type="button" onclick="event.stopPropagation(); VibeApp.removeStudioOption(${qIdx}, ${optIdx})" class="p-1 text-stone-400 hover:text-orange-500 shrink-0" title="Xóa tùy chọn">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>
            `;
          }).join('')}

          <div class="pt-1 flex items-center gap-3 text-[11px]">
            <button type="button" onclick="event.stopPropagation(); VibeApp.addStudioOption(${qIdx})" class="text-orange-600 dark:text-orange-400 font-bold hover:underline flex items-center gap-1">
              <i data-lucide="plus" class="w-3 h-3"></i>
              <span>Thêm tùy chọn</span>
            </button>
            <span class="text-stone-400">hoặc</span>
            <button type="button" onclick="event.stopPropagation(); VibeApp.addStudioOtherOption(${qIdx})" class="text-stone-600 dark:text-stone-400 font-medium hover:underline">
              Thêm "Khác..."
            </button>
          </div>
        </div>
      `;
    }

    // 2. Trả lời ngắn
    if (q.type === 'SHORT_TEXT') {
      let val = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
      const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
      if ((!val || !val.type || val.type === 'NONE') && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
        const inf = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
        if (inf) {
          val = inf;
          q.validation = inf;
        }
      }

      let previewPlaceholder = 'Nhập câu trả lời của bạn';
      if (val && val.type && val.type !== 'NONE') {
        previewPlaceholder = this.generateValidationPlaceholder(val) || (engine && engine.getMeta(val)?.placeholder) || val.placeholder || 'Nhập câu trả lời của bạn';
      }
      const detectedRange = engine ? engine.extractNumberRange(`${q.placeholder || ''} ${q.description || ''} ${q.content || ''} ${val?.placeholder || ''}`) : null;
      if (detectedRange) {
        previewPlaceholder = `Số phải nằm trong khoảng từ ${detectedRange.min} ~ ${detectedRange.max}`;
      }

      return `
        <div>
          <input type="text" disabled value="" 
                 id="studio-preview-input-${qIdx}"
                 placeholder="${this.escapeHtml(previewPlaceholder)}"
                 class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700/60 bg-stone-50/50 dark:bg-stone-900/30 text-stone-400 dark:text-stone-500 text-xs sm:text-sm font-medium cursor-not-allowed">
        </div>
        ${this.renderStudioQuestionValidationConfig(q, qIdx)}
      `;
    }

    // 3. Đoạn văn
    if (q.type === 'PARAGRAPH') {
      let val = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
      const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
      if ((!val || !val.type || val.type === 'NONE') && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
        const inf = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
        if (inf) {
          val = inf;
          q.validation = inf;
        }
      }

      let previewPlaceholder = 'Nhập câu trả lời của bạn';
      if (val && val.type && val.type !== 'NONE') {
        previewPlaceholder = this.generateValidationPlaceholder(val) || (engine && engine.getMeta(val)?.placeholder) || val.placeholder || 'Nhập câu trả lời của bạn';
      }
      const detectedRange = engine ? engine.extractNumberRange(`${q.placeholder || ''} ${q.description || ''} ${q.content || ''} ${val?.placeholder || ''}`) : null;
      if (detectedRange) {
        previewPlaceholder = `Số phải nằm trong khoảng từ ${detectedRange.min} ~ ${detectedRange.max}`;
      }

      return `
        <div>
          <textarea disabled rows="2"
                    id="studio-preview-input-${qIdx}"
                    placeholder="${this.escapeHtml(previewPlaceholder)}"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700/60 bg-stone-50/50 dark:bg-stone-900/30 text-stone-400 dark:text-stone-500 text-xs sm:text-sm font-medium cursor-not-allowed resize-none"></textarea>
        </div>
        ${this.renderStudioQuestionValidationConfig(q, qIdx)}
      `;
    }

    // 4. Phạm vi tuyến tính (Linear Scale - Chuẩn Google Forms)
    if (q.type === 'LINEAR_SCALE') {
      const opts = (Array.isArray(q.options) && q.options.length > 0) ? q.options : ['1', '2', '3', '4', '5'];
      const minOpt = parseInt(opts[0], 10) || 0;
      const maxOpt = parseInt(opts[opts.length - 1], 10) || 5;
      const minLabel = (q.min_label !== undefined && q.min_label !== null) ? q.min_label : '';
      const maxLabel = (q.max_label !== undefined && q.max_label !== null) ? q.max_label : '';

      return `
        <div class="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
          <!-- Hàng chọn thang đo chuẩn Google Forms: [ 1 v ] đến [ 5 v ] (Custom Dropdown Bento) -->
          <div class="flex items-center gap-3 text-xs text-stone-700 dark:text-stone-300">
            <!-- Min Opt Custom Dropdown -->
            <div class="relative">
              <button type="button" 
                      id="scale-min-btn-${qIdx}"
                      onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('scale-min-menu-${qIdx}', 'scale-min-icon-${qIdx}', event)"
                      class="custom-dropdown-trigger bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-1.5 min-w-[56px] text-xs font-semibold text-stone-800 dark:text-stone-200 hover:border-orange-500 flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs">
                <span>${minOpt}</span>
                <i data-lucide="chevron-down" id="scale-min-icon-${qIdx}" class="custom-dropdown-icon w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 pointer-events-none"></i>
              </button>
              <div id="scale-min-menu-${qIdx}" class="custom-dropdown-menu hidden absolute left-0 top-[calc(100%+4px)] z-50 w-24 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-xl shadow-2xl p-1 space-y-0.5">
                ${[0, 1].map(v => `
                  <button type="button" 
                          onclick="event.stopPropagation(); VibeApp.setStudioScaleRange(${qIdx}, ${v}, ${maxOpt}); VibeApp.closeAllCustomDropdowns();"
                          class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${minOpt === v ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                    <span>${v}</span>
                    ${minOpt === v ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                  </button>
                `).join('')}
              </div>
            </div>

            <span class="text-xs text-stone-500 font-medium">đến</span>

            <!-- Max Opt Custom Dropdown -->
            <div class="relative">
              <button type="button" 
                      id="scale-max-btn-${qIdx}"
                      onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('scale-max-menu-${qIdx}', 'scale-max-icon-${qIdx}', event)"
                      class="custom-dropdown-trigger bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-1.5 min-w-[56px] text-xs font-semibold text-stone-800 dark:text-stone-200 hover:border-orange-500 flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs">
                <span>${maxOpt}</span>
                <i data-lucide="chevron-down" id="scale-max-icon-${qIdx}" class="custom-dropdown-icon w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 pointer-events-none"></i>
              </button>
              <div id="scale-max-menu-${qIdx}" class="custom-dropdown-menu hidden absolute left-0 top-[calc(100%+4px)] z-50 w-24 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-xl shadow-2xl p-1 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                ${[2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => `
                  <button type="button" 
                          onclick="event.stopPropagation(); VibeApp.setStudioScaleRange(${qIdx}, ${minOpt}, ${val}); VibeApp.closeAllCustomDropdowns();"
                          class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${maxOpt === val ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                    <span>${val}</span>
                    ${maxOpt === val ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- 2 Hàng nhập nhãn đầu mút chuẩn Google Forms: [số] [Nhãn (tùy chọn)] -->
          <div class="space-y-3 pt-1">
            <div class="flex items-center gap-3">
              <span class="w-5 text-center text-xs font-bold text-stone-500 dark:text-stone-400 font-mono">${minOpt}</span>
              <input type="text" value="${minLabel.replace(/"/g, '&quot;')}" onclick="event.stopPropagation()" oninput="VibeApp.updateStudioLinearLabels(${qIdx}, this.value, null)"
                     autocomplete="off" spellcheck="false"
                     placeholder="Nhãn (tùy chọn)" 
                     class="flex-1 py-1.5 px-0 bg-transparent border-0 border-b border-stone-200 dark:border-stone-700 focus:border-stone-800 dark:focus:border-stone-200 focus:outline-none text-xs text-stone-800 dark:text-stone-200 placeholder-stone-400 transition-colors">
            </div>
            <div class="flex items-center gap-3">
              <span class="w-5 text-center text-xs font-bold text-stone-500 dark:text-stone-400 font-mono">${maxOpt}</span>
              <input type="text" value="${maxLabel.replace(/"/g, '&quot;')}" onclick="event.stopPropagation()" oninput="VibeApp.updateStudioLinearLabels(${qIdx}, null, this.value)"
                     autocomplete="off" spellcheck="false"
                     placeholder="Nhãn (tùy chọn)" 
                     class="flex-1 py-1.5 px-0 bg-transparent border-0 border-b border-stone-200 dark:border-stone-700 focus:border-stone-800 dark:focus:border-stone-200 focus:outline-none text-xs text-stone-800 dark:text-stone-200 placeholder-stone-400 transition-colors">
            </div>
          </div>

          <!-- Xem trước trực quan chuẩn Google Forms (Radio buttons nằm ngang) -->
          <div class="pt-3 border-t border-stone-200/60 dark:border-stone-800/60">
            <div class="flex items-end justify-between gap-2 overflow-x-auto py-2 px-1">
              ${minLabel ? `<div class="text-[11px] font-medium text-stone-500 dark:text-stone-400 pb-1 max-w-[120px] text-left leading-tight shrink-0">${minLabel}</div>` : '<div class="shrink-0"></div>'}
              <div class="flex items-center justify-center gap-3 sm:gap-4 shrink-0 mx-auto">
                ${opts.map(num => `
                  <div class="flex flex-col items-center gap-1.5">
                    <span class="text-[11px] font-mono font-medium text-stone-600 dark:text-stone-400">${num}</span>
                    <div class="w-5 h-5 rounded-full border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 flex items-center justify-center">
                    </div>
                  </div>
                `).join('')}
              </div>
              ${maxLabel ? `<div class="text-[11px] font-medium text-stone-500 dark:text-stone-400 pb-1 max-w-[120px] text-right leading-tight shrink-0">${maxLabel}</div>` : '<div class="shrink-0"></div>'}
            </div>
          </div>
        </div>
      `;
    }

    // 5 & 6. LƯỚI TRẮC NGHIỆM (CHOICE_GRID) & LƯỚI HỘP KIỂM (CHECKBOX_GRID)
    if (['CHOICE_GRID', 'CHECKBOX_GRID'].includes(q.type)) {
      const rows = q.rows || ['Tiêu chí 1', 'Tiêu chí 2', 'Tiêu chí 3'];
      const columns = q.columns || ['Kém', 'Bình thường', 'Tốt', 'Rất tốt'];
      const isChoice = q.type === 'CHOICE_GRID';

      return `
        <div class="p-3.5 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
          <div class="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 flex items-center justify-between">
            <span>Thiết kế Ma trận ${isChoice ? 'Lưới Trắc Nghiệm' : 'Lưới Hộp Kiểm'}:</span>
            <span class="text-stone-400 font-normal">${rows.length} Hàng x ${columns.length} Cột</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Danh sách Hàng (Rows) -->
            <div class="space-y-2 border-r border-stone-200/60 dark:border-stone-800 pr-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                <span>Hàng (Các tiêu chí con):</span>
                <button type="button" onclick="event.stopPropagation(); VibeApp.addStudioGridRow(${qIdx})" class="text-orange-600 text-[11px] font-bold hover:underline">
                  + Thêm hàng
                </button>
              </div>
              <div class="space-y-1.5 max-h-48 overflow-y-auto">
                ${rows.map((r, rIdx) => `
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] text-stone-400 font-mono w-4">${rIdx + 1}.</span>
                    <input type="text" value="${(r || '').replace(/"/g, '&quot;')}" 
                           onclick="event.stopPropagation()"
                           oninput="VibeApp.updateStudioGridRowText(${qIdx}, ${rIdx}, this.value)"
                           autocomplete="off" spellcheck="false"
                           placeholder="Tiêu chí ${rIdx + 1}..." class="flex-1 p-1 bg-transparent border-0 border-b border-stone-200 dark:border-stone-800 focus:border-orange-600 focus:outline-none text-xs text-stone-800 dark:text-stone-200">
                    ${rows.length > 1 ? `
                      <button type="button" onclick="event.stopPropagation(); VibeApp.removeStudioGridRow(${qIdx}, ${rIdx})" class="text-stone-400 hover:text-orange-500 p-0.5">
                        <i data-lucide="x" class="w-3 h-3"></i>
                      </button>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Danh sách Cột (Columns) -->
            <div class="space-y-2 pl-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                <span>Cột (Thang đánh giá):</span>
                <button type="button" onclick="event.stopPropagation(); VibeApp.addStudioGridCol(${qIdx})" class="text-orange-600 text-[11px] font-bold hover:underline">
                  + Thêm cột
                </button>
              </div>
              <div class="space-y-1.5 max-h-48 overflow-y-auto">
                ${columns.map((c, cIdx) => `
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] text-stone-400 font-mono w-4">${String.fromCharCode(65 + cIdx)}.</span>
                    <input type="text" value="${(c || '').replace(/"/g, '&quot;')}" 
                           onclick="event.stopPropagation()"
                           oninput="VibeApp.updateStudioGridColText(${qIdx}, ${cIdx}, this.value)"
                           autocomplete="off" spellcheck="false"
                           placeholder="Cột ${cIdx + 1}..." class="flex-1 p-1 bg-transparent border-0 border-b border-stone-200 dark:border-stone-800 focus:border-orange-600 focus:outline-none text-xs text-stone-800 dark:text-stone-200">
                    ${columns.length > 1 ? `
                      <button type="button" onclick="event.stopPropagation(); VibeApp.removeStudioGridCol(${qIdx}, ${cIdx})" class="text-stone-400 hover:text-orange-500 p-0.5">
                        <i data-lucide="x" class="w-3 h-3"></i>
                      </button>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>

          </div>

          <!-- Bảng xem trước Ma Trận thu nhỏ -->
          <div class="pt-2 border-t border-stone-200/60 dark:border-stone-800 overflow-x-auto">
            <div class="text-[10px] text-stone-400 font-bold uppercase mb-1">Xem trước bảng ma trận:</div>
            <table class="w-full text-left text-[11px] border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
              <thead class="bg-stone-100 dark:bg-stone-800">
                <tr>
                  <th class="p-2 font-bold text-stone-600 dark:text-stone-400">Tiêu chí</th>
                  ${columns.map((c, cIdx) => `<th id="grid-preview-col-${qIdx}-${cIdx}" class="p-2 text-center font-bold text-stone-600 dark:text-stone-400">${c}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
                ${rows.map((r, rIdx) => `
                  <tr>
                    <td id="grid-preview-row-${qIdx}-${rIdx}" class="p-2 font-medium text-stone-800 dark:text-stone-200">${r}</td>
                    ${columns.map(() => `
                      <td class="p-2 text-center">
                        <div class="w-3.5 h-3.5 mx-auto rounded-${isChoice ? 'full' : 'sm'} border border-stone-300 dark:border-stone-600"></div>
                      </td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // 7. Tải tệp lên (File Upload)
    if (q.type === 'FILE_UPLOAD') {
      return `
        <div class="p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-2">
          <i data-lucide="upload-cloud" class="w-6 h-6 text-orange-600 mx-auto"></i>
          <div class="text-xs font-bold text-stone-800 dark:text-stone-200">Cho phép người làm bài tải tệp minh chứng lên</div>
          <p class="text-[11px] text-stone-400">Hỗ trợ các định dạng: PNG, JPG, JPEG, PDF (Dung lượng an toàn tối đa 5MB/tệp).</p>
        </div>
      `;
    }

    // 8. Ngày tháng
    if (q.type === 'DATE_INPUT') {
      return `
        <div class="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2 text-stone-500 text-xs">
          <i data-lucide="calendar" class="w-4 h-4 text-orange-600"></i>
          <span>Hiển thị bộ chọn Ngày / Tháng / Năm thông minh khi người dùng làm bài.</span>
        </div>
      `;
    }

    // 9. Giờ phút
    if (q.type === 'TIME_INPUT') {
      return `
        <div class="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2 text-stone-500 text-xs">
          <i data-lucide="clock" class="w-4 h-4 text-orange-600"></i>
          <span>Hiển thị bộ chọn Giờ : Phút chính xác.</span>
        </div>
      `;
    }

    // 10. Đánh giá sao
    if (q.type === 'RATING_STARS') {
      return `
        <div class="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-center space-y-2">
          <div class="flex items-center justify-center gap-2 text-orange-500">
            ${[1, 2, 3, 4, 5].map(() => `<i data-lucide="star" class="w-6 h-6 fill-orange-400 text-orange-400"></i>`).join('')}
          </div>
          <div class="text-[11px] text-stone-500">Thang đánh giá từ 1 đến 5 sao theo tiêu chuẩn quốc tế.</div>
        </div>
      `;
    }

    return '';
  },

  getStudioQuestionTypeInfo(type) {
    const map = {
      SINGLE_CHOICE: { label: 'Trắc nghiệm (1 đáp án)', icon: 'circle-dot' },
      MULTIPLE_CHOICE: { label: 'Hộp kiểm (Nhiều đáp án)', icon: 'check-square' },
      SHORT_TEXT: { label: 'Trả lời ngắn (1 dòng)', icon: 'minus' },
      PARAGRAPH: { label: 'Đoạn văn (Tự luận dài)', icon: 'align-left' },
      DROPDOWN: { label: 'Menu thả xuống (Dropdown)', icon: 'chevron-down-circle' },
      LINEAR_SCALE: { label: 'Phạm vi tuyến tính', icon: 'sliders' },
      CHOICE_GRID: { label: 'Lưới trắc nghiệm (Radio Grid)', icon: 'grid-2x2' },
      CHECKBOX_GRID: { label: 'Lưới hộp kiểm (Checkbox Grid)', icon: 'layout-grid' },
      FILE_UPLOAD: { label: 'Tải tệp lên (File Upload)', icon: 'upload-cloud' },
      DATE_INPUT: { label: 'Chọn ngày tháng (Date)', icon: 'calendar' },
      TIME_INPUT: { label: 'Chọn giờ phút (Time)', icon: 'clock' },
      RATING_STARS: { label: 'Đánh giá sao (1–5 Sao)', icon: 'star' },
      VIDEO_BLOCK: { label: 'Video minh họa (YouTube)', icon: 'video' },
      SECTION_HEADER: { label: 'Phân đoạn (Thêm phần)', icon: 'split' },
      TEXT_BLOCK: { label: 'Tiêu đề & Mô tả (Tt)', icon: 'type' }
    };
    return map[type] || map.SINGLE_CHOICE;
  },

  selectStudioQuestionType(qIdx, newType) {
    this.haptic('light');
    this.closeAllCustomDropdowns();
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      const q = this.state.builderQuestions[qIdx];
      q.type = newType;
      if (['CHOICE_GRID', 'CHECKBOX_GRID'].includes(newType)) {
        if (!q.rows || q.rows.length === 0) q.rows = ['Tiêu chí 1', 'Tiêu chí 2', 'Tiêu chí 3'];
        if (!q.columns || q.columns.length === 0) q.columns = ['Kém', 'Bình thường', 'Tốt', 'Rất tốt'];
      } else if (newType === 'LINEAR_SCALE') {
        q.options = ['1', '2', '3', '4', '5'];
        q.min_label = q.min_label || 'Rất không hài lòng';
        q.max_label = q.max_label || 'Rất hài lòng';
      } else if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(newType)) {
        if (!q.options || q.options.length < 2) q.options = ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C'];
      }
      this.refreshStudioQuestionsView();
    }
  },

  addBuilderQuestion(type = 'SINGLE_CHOICE', afterIdx = null) {
    this.haptic('light');
    if (!this.state.builderQuestions) this.state.builderQuestions = [];
    const newQ = {
      id: 'q_' + Date.now(),
      type: type,
      content: '',
      is_required: true,
      is_screener: false
    };
    if (['CHOICE_GRID', 'CHECKBOX_GRID'].includes(type)) {
      newQ.rows = ['Tiêu chí 1', 'Tiêu chí 2', 'Tiêu chí 3'];
      newQ.columns = ['Kém', 'Bình thường', 'Tốt', 'Rất tốt'];
    } else if (type === 'LINEAR_SCALE') {
      newQ.options = ['1', '2', '3', '4', '5'];
      newQ.min_label = 'Rất không hài lòng';
      newQ.max_label = 'Rất hài lòng';
    } else if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(type)) {
      newQ.options = ['Lựa chọn 1', 'Lựa chọn 2', 'Lựa chọn 3'];
    }
    const insertAt = (afterIdx !== null && afterIdx !== undefined) ? (afterIdx + 1) : this.state.builderQuestions.length;
    this.state.builderQuestions.splice(insertAt, 0, newQ);
    this.state.activeQuestionIdx = insertAt;
    this.refreshStudioQuestionsView();
    setTimeout(() => {
      const newCard = document.getElementById(`studio-q-card-${insertAt}`);
      if (newCard) newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  },

  duplicateBuilderQuestion(qIdx) {
    this.haptic('light');
    if (!this.state.builderQuestions || !this.state.builderQuestions[qIdx]) return;
    const original = this.state.builderQuestions[qIdx];
    const clone = JSON.parse(JSON.stringify(original));
    clone.id = 'q_' + Date.now();
    clone.content = (clone.content || '') + ' (Bản sao)';
    this.state.builderQuestions.splice(qIdx + 1, 0, clone);
    this.state.activeQuestionIdx = qIdx + 1;
    this.renderCreateSurveyView(document.getElementById('app-root'));
    this.showToast('Đã nhân đôi câu hỏi!', 'info');
  },

  removeBuilderQuestion(qIdx) {
    this.haptic('light');
    if (this.state.builderQuestions && this.state.builderQuestions.length > 1) {
      this.state.builderQuestions.splice(qIdx, 1);
      if (this.state.activeQuestionIdx >= this.state.builderQuestions.length) {
        this.state.activeQuestionIdx = this.state.builderQuestions.length - 1;
      }
      this.renderCreateSurveyView(document.getElementById('app-root'));
    } else {
      this.showToast('Khảo sát cần có ít nhất 1 câu hỏi!', 'info');
    }
  },

  toggleStudioRequired(qIdx, isRequired) {
    this.haptic('light');
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      this.state.builderQuestions[qIdx].is_required = !!isRequired;
      if (window.currentStudioSurvey && window.currentStudioSurvey.questions && window.currentStudioSurvey.questions[qIdx]) {
        window.currentStudioSurvey.questions[qIdx].required = !!isRequired;
        window.currentStudioSurvey.questions[qIdx].is_required = !!isRequired;
      }
      const wrap = document.getElementById(`req-toggle-wrap-${qIdx}`);
      const btn = document.getElementById(`req-btn-${qIdx}`);
      if (wrap) {
        wrap.setAttribute('onclick', `event.stopPropagation(); VibeApp.toggleStudioRequired(${qIdx}, ${!isRequired})`);
      }
      if (btn) {
        btn.classList.toggle('active', !!isRequired);
        btn.setAttribute('aria-checked', isRequired ? 'true' : 'false');
      }
    }
  },

  toggleStudioScreener(qIdx, isChecked) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      this.state.builderQuestions[qIdx].is_screener = isChecked;
      this.refreshStudioQuestionsView();
    }
  },

  toggleStudioLogicBranching(qIdx, isChecked) {
    this.haptic('light');
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      const q = this.state.builderQuestions[qIdx];
      if (!q.logic) q.logic = {};
      q.logic.enabled = !!isChecked;
      if (!q.logic.options) q.logic.options = {};
      this.refreshStudioQuestionsView();
    }
  },

  setStudioOptionLogicTarget(qIdx, optIdx, target) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      const q = this.state.builderQuestions[qIdx];
      if (!q.logic) q.logic = { enabled: true, options: {} };
      if (!q.logic.options) q.logic.options = {};
      q.logic.options[optIdx] = target;
      if (q.options && q.options[optIdx]) {
        q.logic.options[q.options[optIdx]] = target;
      }
    }
  },

  setStudioSectionDefaultAction(qIdx, action, target = null) {
    this.haptic('light');
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      const q = this.state.builderQuestions[qIdx];
      if (!q.logic) q.logic = {};
      q.logic.default_action = action;
      q.logic.target = target;
      this.refreshStudioQuestionsView();
    }
  },

  setStudioSectionLogicTarget(qIdx, target) {
    if (target === 'NEXT' || target === 'NEXT_PAGE') {
      this.setStudioSectionDefaultAction(qIdx, 'NEXT_PAGE', null);
    } else if (target === 'SUBMIT' || target === 'SUBMIT_FORM') {
      this.setStudioSectionDefaultAction(qIdx, 'SUBMIT_FORM', null);
    } else {
      this.setStudioSectionDefaultAction(qIdx, 'GO_TO_PAGE', target);
    }
  },

  toggleStudioLongAnswer(qIdx, isLong) {
    this.haptic('light');
    const q = this.state.builderQuestions && this.state.builderQuestions[qIdx];
    if (!q) return;
    q.type = isLong ? 'PARAGRAPH' : 'SHORT_TEXT';
    this.refreshStudioQuestionsView();
  },

  updateBuilderQuestionContent(qIdx, val) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      const q = this.state.builderQuestions[qIdx];
      q.content = val;

      if (['SHORT_TEXT', 'PARAGRAPH'].includes(q.type)) {
        const curVal = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
        const curType = curVal?.type;
        const curRule = curVal?.rule ? String(curVal.rule).toUpperCase() : '';
        // Bảo toàn dải số BETWEEN đã có, không bao giờ bị ghi đè thành IS_NUMBER
        if (curType === 'NUMBER' && (curRule === 'BETWEEN' || (curVal.min !== undefined && curVal.max !== undefined && String(curVal.min).trim() !== '' && String(curVal.max).trim() !== ''))) {
          return;
        }
        const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
        if (engine && typeof engine.inferValidationFromTitle === 'function') {
          const inferred = engine.inferValidationFromTitle(val, (q.placeholder || q.description || ''));
          // Tự động gán nếu chưa có validation, hoặc đang NONE, hoặc đang IS_NUMBER mà gõ MSSV/dải số
          if (!curType || curType === 'NONE' || (curType === 'NUMBER' && (curRule === 'IS_NUMBER' || !curRule) && inferred && inferred.rule === 'BETWEEN')) {
            if (inferred) {
              q.validation = { ...inferred };
              if (!q.logic) q.logic = {};
              q.logic.validation = { ...inferred };

              const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
              const isCurrentInput = activeEl && activeEl.matches && activeEl.matches(`input[oninput*="updateBuilderQuestionContent(${qIdx}"]`);
              const selStart = isCurrentInput ? activeEl.selectionStart : null;
              const selEnd = isCurrentInput ? activeEl.selectionEnd : null;

              this.refreshStudioQuestionsView();

              if (isCurrentInput) {
                const newInputs = document.querySelectorAll(`input[oninput*="updateBuilderQuestionContent(${qIdx}"]`);
                if (newInputs && newInputs[0]) {
                  newInputs[0].focus();
                  if (selStart !== null && selEnd !== null) {
                    try { newInputs[0].setSelectionRange(selStart, selEnd); } catch (e) {}
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  addStudioOption(qIdx) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      if (!this.state.builderQuestions[qIdx].options) this.state.builderQuestions[qIdx].options = [];
      const len = this.state.builderQuestions[qIdx].options.length;
      this.state.builderQuestions[qIdx].options.push(`Lựa chọn ${len + 1}`);
      this.refreshStudioQuestionsView();
    }
  },

  addStudioOtherOption(qIdx) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      if (!this.state.builderQuestions[qIdx].options) this.state.builderQuestions[qIdx].options = [];
      this.state.builderQuestions[qIdx].options.push('Khác...');
      this.refreshStudioQuestionsView();
    }
  },

  removeStudioOption(qIdx, optIdx) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx] && this.state.builderQuestions[qIdx].options) {
      this.state.builderQuestions[qIdx].options.splice(optIdx, 1);
      this.refreshStudioQuestionsView();
    }
  },

  updateStudioOptionText(qIdx, optIdx, val) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx] && this.state.builderQuestions[qIdx].options) {
      this.state.builderQuestions[qIdx].options[optIdx] = val;
    }
  },

  addStudioGridRow(qIdx) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      if (!this.state.builderQuestions[qIdx].rows) this.state.builderQuestions[qIdx].rows = [];
      const len = this.state.builderQuestions[qIdx].rows.length;
      this.state.builderQuestions[qIdx].rows.push(`Tiêu chí ${len + 1}`);
      this.refreshStudioQuestionsView();
    }
  },

  removeStudioGridRow(qIdx, rIdx) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx] && this.state.builderQuestions[qIdx].rows) {
      this.state.builderQuestions[qIdx].rows.splice(rIdx, 1);
      this.refreshStudioQuestionsView();
    }
  },

  updateStudioGridRowText(qIdx, rIdx, val) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx] && this.state.builderQuestions[qIdx].rows) {
      this.state.builderQuestions[qIdx].rows[rIdx] = val;
      const previewCell = document.getElementById(`grid-preview-row-${qIdx}-${rIdx}`);
      if (previewCell) {
        previewCell.textContent = val || `Tiêu chí ${rIdx + 1}`;
      }
    }
  },

  addStudioGridCol(qIdx) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      if (!this.state.builderQuestions[qIdx].columns) this.state.builderQuestions[qIdx].columns = [];
      const len = this.state.builderQuestions[qIdx].columns.length;
      this.state.builderQuestions[qIdx].columns.push(`Mức ${len + 1}`);
      this.refreshStudioQuestionsView();
    }
  },

  removeStudioGridCol(qIdx, cIdx) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx] && this.state.builderQuestions[qIdx].columns) {
      this.state.builderQuestions[qIdx].columns.splice(cIdx, 1);
      this.refreshStudioQuestionsView();
    }
  },

  updateStudioGridColText(qIdx, cIdx, val) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx] && this.state.builderQuestions[qIdx].columns) {
      this.state.builderQuestions[qIdx].columns[cIdx] = val;
      const previewCell = document.getElementById(`grid-preview-col-${qIdx}-${cIdx}`);
      if (previewCell) {
        previewCell.textContent = val || `Cột ${cIdx + 1}`;
      }
    }
  },

  setStudioScaleRange(qIdx, min, max) {
    this.haptic('light');
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      const q = this.state.builderQuestions[qIdx];
      const parsedMin = parseInt(min, 10);
      let parsedMax = parseInt(max, 10);
      if (isNaN(parsedMin)) min = 1;
      else min = parsedMin;
      if (isNaN(parsedMax)) max = 5;
      else max = parsedMax;
      if (min >= max) max = min + 1;

      const opts = [];
      for (let i = min; i <= max; i++) opts.push(String(i));
      q.options = opts;
      this.refreshStudioQuestionsView();
    }
  },

  updateStudioLinearLabels(qIdx, minLabel, maxLabel) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      if (minLabel !== null) this.state.builderQuestions[qIdx].min_label = minLabel;
      if (maxLabel !== null) this.state.builderQuestions[qIdx].max_label = maxLabel;
    }
  },

  renderStudioQuestionValidationConfig(q, qIdx) {
    let val = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
    const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
    if ((!val || !val.type || val.type === 'NONE') && engine && typeof engine.inferValidationFromTitle === 'function' && q.content) {
      const inf = engine.inferValidationFromTitle(q.content, (q.placeholder || q.description || ''));
      if (inf) {
        val = { ...inf };
        q.validation = val;
        if (!q.logic) q.logic = {};
        q.logic.validation = { ...val };
      }
    }
    if (!val) val = { type: 'NONE' };

    const detectedRange = engine ? engine.extractNumberRange(`${q.placeholder || ''} ${q.description || ''} ${q.content || ''} ${val?.placeholder || ''}`) : null;
    if (detectedRange && val.type !== 'NONE' && (val.type === 'NUMBER' || !val.type)) {
      val.type = 'NUMBER';
      val.rule = 'BETWEEN';
      val.min = (val.min !== undefined && val.min !== null && String(val.min).trim() !== '') ? val.min : detectedRange.min;
      val.max = (val.max !== undefined && val.max !== null && String(val.max).trim() !== '') ? val.max : detectedRange.max;
      val.placeholder = `Số phải nằm trong khoảng từ ${val.min} ~ ${val.max}`;
      val.error_message = `Số phải nằm trong khoảng từ ${val.min} đến ${val.max}`;
      q.validation = { ...val };
      if (!q.logic) q.logic = {};
      q.logic.validation = { ...val };
    }

    const valType = val.type || 'NONE';
    if (valType === 'NONE') return '';

    const hasMin = val.min !== undefined && val.min !== null && String(val.min).trim() !== '';
    const hasMax = val.max !== undefined && val.max !== null && String(val.max).trim() !== '';
    let valRule = val.rule ? String(val.rule).toUpperCase() : '';
    if (valType === 'NUMBER') {
      if (detectedRange) {
        valRule = 'BETWEEN';
      } else if (valRule === 'BETWEEN' || (hasMin && hasMax)) {
        valRule = 'BETWEEN';
      } else if (!valRule) {
        valRule = 'IS_NUMBER';
      }
    } else if (valType === 'LENGTH') {
      if (!valRule) valRule = 'MAX_LENGTH';
    }
    const valMin = hasMin ? val.min : (detectedRange ? detectedRange.min : '');
    const valMax = hasMax ? val.max : (detectedRange ? detectedRange.max : '');

    // Đồng bộ ngược lại object câu hỏi để tránh mất min/max/rule khi render
    if (valType === 'NUMBER' && valRule === 'BETWEEN') {
      val.type = 'NUMBER';
      val.rule = 'BETWEEN';
      if (valMin !== '') val.min = valMin;
      if (valMax !== '') val.max = valMax;
      if (!val.placeholder || val.placeholder === 'Giá trị phải là một số') {
        val.placeholder = this.generateValidationPlaceholder(val);
      }
      q.validation = { ...val };
      if (!q.logic) q.logic = {};
      q.logic.validation = { ...val };
    }

    const valTypeMap = {
      NONE: 'Không giới hạn',
      EMAIL: 'Email',
      NUMBER: 'Số',
      URL: 'URL',
      LENGTH: 'Độ dài'
    };
    const valRuleNumberMap = {
      IS_NUMBER: 'Là số',
      BETWEEN: 'Trong khoảng',
      GREATER_THAN: 'Lớn hơn',
      LESS_THAN: 'Nhỏ hơn'
    };
    const valRuleLengthMap = {
      MAX_LENGTH: 'Tối đa ký tự',
      MIN_LENGTH: 'Tối thiểu ký tự'
    };

    return `
      <div class="mt-2.5 px-3 py-1.5 bg-stone-50/90 dark:bg-stone-900/70 rounded-xl border border-stone-200/80 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 shrink-0">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
            <span>Giới hạn:</span>
          </div>

          <!-- Dropdown Loại giới hạn -->
          <div class="relative">
            <button type="button" 
                    id="val-type-btn-${qIdx}"
                    onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('val-type-menu-${qIdx}', 'val-type-icon-${qIdx}', event)"
                    class="custom-dropdown-trigger h-7 px-2 text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-200 hover:border-orange-500 flex items-center justify-between gap-1 cursor-pointer shadow-2xs">
              <span>${valTypeMap[valType] || 'Không giới hạn'}</span>
              <i data-lucide="chevron-down" id="val-type-icon-${qIdx}" class="custom-dropdown-icon w-3 h-3 text-stone-400 shrink-0 pointer-events-none"></i>
            </button>
            <div id="val-type-menu-${qIdx}" class="custom-dropdown-menu hidden absolute left-0 top-[calc(100%+4px)] z-50 w-36 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-xl shadow-2xl p-1 space-y-0.5 text-left">
              ${Object.entries(valTypeMap).map(([typeKey, typeLabel]) => {
                const isCur = valType === typeKey;
                return `
                  <button type="button" 
                          onclick="event.stopPropagation(); VibeApp.setStudioQuestionValidationType(${qIdx}, '${typeKey}'); VibeApp.closeAllCustomDropdowns();"
                          class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${isCur ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                    <span>${typeLabel}</span>
                    ${isCur ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          ${valType === 'NUMBER' ? `
            <!-- Dropdown Điều kiện Số -->
            <div class="relative">
              <button type="button" 
                      id="val-rule-btn-${qIdx}"
                      onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('val-rule-menu-${qIdx}', 'val-rule-icon-${qIdx}', event)"
                      class="custom-dropdown-trigger h-7 px-2 text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-200 hover:border-orange-500 flex items-center justify-between gap-1 cursor-pointer shadow-2xs">
                <span>${valRuleNumberMap[valRule] || 'Là số'}</span>
                <i data-lucide="chevron-down" id="val-rule-icon-${qIdx}" class="custom-dropdown-icon w-3 h-3 text-stone-400 shrink-0 pointer-events-none"></i>
              </button>
              <div id="val-rule-menu-${qIdx}" class="custom-dropdown-menu hidden absolute left-0 top-[calc(100%+4px)] z-50 w-36 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-xl shadow-2xl p-1 space-y-0.5 text-left">
                ${Object.entries(valRuleNumberMap).map(([ruleKey, ruleLabel]) => {
                  const isCur = valRule === ruleKey;
                  return `
                    <button type="button" 
                            onclick="event.stopPropagation(); VibeApp.setStudioQuestionValidationRule(${qIdx}, '${ruleKey}'); VibeApp.closeAllCustomDropdowns();"
                            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${isCur ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                      <span>${ruleLabel}</span>
                      ${isCur ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            ${valRule === 'BETWEEN' ? `
              <div class="flex items-center gap-1.5">
                <input type="number" value="${valMin}" 
                       onclick="event.stopPropagation()"
                       oninput="VibeApp.setStudioQuestionValidationRange(${qIdx}, this.value, document.getElementById('val-max-${qIdx}') ? document.getElementById('val-max-${qIdx}').value : '')"
                       id="val-min-${qIdx}"
                       placeholder="Min"
                       class="w-24 h-7 px-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:border-orange-500 focus:outline-none font-mono">
                <span class="text-stone-400 text-xs font-semibold">~</span>
                <input type="number" value="${valMax}" 
                       onclick="event.stopPropagation()"
                       oninput="VibeApp.setStudioQuestionValidationRange(${qIdx}, document.getElementById('val-min-${qIdx}') ? document.getElementById('val-min-${qIdx}').value : '', this.value)"
                       id="val-max-${qIdx}"
                       placeholder="Max"
                       class="w-24 h-7 px-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:border-orange-500 focus:outline-none font-mono">
              </div>
            ` : ''}

            ${valRule === 'GREATER_THAN' ? `
              <div class="flex items-center gap-1.5">
                <span class="text-stone-400 text-xs font-semibold">></span>
                <input type="number" value="${valMin}" 
                       onclick="event.stopPropagation()"
                       oninput="VibeApp.setStudioQuestionValidationRange(${qIdx}, this.value, null)"
                       placeholder="Min"
                       class="w-24 h-7 px-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:border-orange-500 focus:outline-none font-mono">
              </div>
            ` : ''}

            ${valRule === 'LESS_THAN' ? `
              <div class="flex items-center gap-1.5">
                <span class="text-stone-400 text-xs font-semibold"><</span>
                <input type="number" value="${valMax}" 
                       onclick="event.stopPropagation()"
                       oninput="VibeApp.setStudioQuestionValidationRange(${qIdx}, null, this.value)"
                       placeholder="Max"
                       class="w-24 h-7 px-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:border-orange-500 focus:outline-none font-mono">
              </div>
            ` : ''}
          ` : ''}

          ${valType === 'LENGTH' ? `
            <div class="relative">
              <button type="button" 
                      id="val-len-rule-btn-${qIdx}"
                      onclick="event.stopPropagation(); VibeApp.toggleCustomDropdown('val-len-rule-menu-${qIdx}', 'val-len-rule-icon-${qIdx}', event)"
                      class="custom-dropdown-trigger h-7 px-2 text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-200 hover:border-orange-500 flex items-center justify-between gap-1 cursor-pointer shadow-2xs">
                <span>${valRuleLengthMap[valRule] || 'Tối đa ký tự'}</span>
                <i data-lucide="chevron-down" id="val-len-rule-icon-${qIdx}" class="custom-dropdown-icon w-3 h-3 text-stone-400 shrink-0 pointer-events-none"></i>
              </button>
              <div id="val-len-rule-menu-${qIdx}" class="custom-dropdown-menu hidden absolute left-0 top-[calc(100%+4px)] z-50 w-36 bg-white dark:bg-[#1C1C20] border border-stone-200 dark:border-[#2E2E36] rounded-xl shadow-2xl p-1 space-y-0.5 text-left">
                ${Object.entries(valRuleLengthMap).map(([lenKey, lenLabel]) => {
                  const isCur = valRule === lenKey;
                  return `
                    <button type="button" 
                            onclick="event.stopPropagation(); VibeApp.setStudioQuestionValidationRule(${qIdx}, '${lenKey}'); VibeApp.closeAllCustomDropdowns();"
                            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${isCur ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold' : 'hover:bg-stone-100 dark:hover:bg-[#24242A] text-stone-700 dark:text-stone-200'}">
                      <span>${lenLabel}</span>
                      ${isCur ? '<i data-lucide="check" class="w-3.5 h-3.5 text-orange-600"></i>' : ''}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
            <input type="number" value="${valMin || valMax}" 
                   onclick="event.stopPropagation()"
                   oninput="VibeApp.setStudioQuestionValidationRange(${qIdx}, this.value, this.value)"
                   placeholder="Số ký tự"
                   class="w-20 h-7 px-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:border-orange-500 focus:outline-none font-mono">
          ` : ''}
        </div>

        <!-- Nút gỡ giới hạn (X) -->
        <button type="button" 
                onclick="event.stopPropagation(); VibeApp.setStudioQuestionValidationType(${qIdx}, 'NONE')" 
                class="p-1 rounded-md text-stone-400 hover:text-orange-500 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors shrink-0"
                title="Gỡ giới hạn này">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
  },

  setStudioQuestionValidationType(qIdx, type) {
    this.haptic('light');
    const q = this.state.builderQuestions && this.state.builderQuestions[qIdx];
    if (!q) return;
    if (!q.validation) q.validation = {};
    q.validation.type = type;
    if (type === 'NUMBER') {
      if (!['IS_NUMBER', 'BETWEEN', 'GREATER_THAN', 'LESS_THAN'].includes(q.validation.rule)) {
        q.validation.rule = 'IS_NUMBER';
      }
    } else if (type === 'LENGTH') {
      if (!['MAX_LENGTH', 'MIN_LENGTH'].includes(q.validation.rule)) {
        q.validation.rule = 'MAX_LENGTH';
      }
      if (!q.validation.min && !q.validation.max) {
        q.validation.min = '100';
        q.validation.max = '100';
      }
    }
    q.validation.placeholder = this.generateValidationPlaceholder(q.validation);
    if (!q.logic) q.logic = {};
    q.logic.validation = { ...q.validation };
    this.refreshStudioQuestionsView();
  },

  setStudioQuestionValidationRule(qIdx, rule) {
    this.haptic('light');
    const q = this.state.builderQuestions && this.state.builderQuestions[qIdx];
    if (!q) return;
    if (!q.validation) q.validation = { type: 'NUMBER' };
    q.validation.rule = rule;
    if (rule === 'BETWEEN') {
      // Người tạo tự nhập min và max, nếu chưa có thì để trống, không tự gán cứng mặc định
    } else if (rule === 'IS_NUMBER') {
      delete q.validation.min;
      delete q.validation.max;
    } else if (rule === 'GREATER_THAN') {
      if (!q.validation.min) q.validation.min = '0';
      delete q.validation.max;
    } else if (rule === 'LESS_THAN') {
      if (!q.validation.max) q.validation.max = '100';
      delete q.validation.min;
    }
    q.validation.placeholder = this.generateValidationPlaceholder(q.validation);
    if (!q.logic) q.logic = {};
    q.logic.validation = { ...q.validation };
    this.refreshStudioQuestionsView();
  },

  setStudioQuestionValidationRange(qIdx, min, max) {
    const q = this.state.builderQuestions && this.state.builderQuestions[qIdx];
    if (!q) return;
    if (!q.validation) q.validation = { type: 'NUMBER', rule: 'BETWEEN' };
    if (min !== undefined && min !== null) q.validation.min = min;
    if (max !== undefined && max !== null) q.validation.max = max;
    q.validation.placeholder = this.generateValidationPlaceholder(q.validation);
    if (!q.logic) q.logic = {};
    q.logic.validation = { ...q.validation };
    const previewEl = document.getElementById(`validation-preview-${qIdx}`);
    if (previewEl) {
      previewEl.textContent = `"${q.validation.placeholder}"`;
    }
    const inputPreview = document.getElementById(`studio-preview-input-${qIdx}`);
    if (inputPreview) {
      inputPreview.placeholder = q.validation.placeholder || 'Nhập câu trả lời của bạn';
    }
  },

  addStudioVideoBlock(afterIdx = null) {
    this.haptic('light');
    const newQ = {
      id: `q_video_${Date.now()}`,
      type: 'VIDEO_BLOCK',
      content: 'Video minh họa / Giới thiệu',
      video_url: '',
      options: null,
      rows: null,
      columns: null,
      is_required: false,
      is_screener: false
    };
    const insertAt = afterIdx !== null ? afterIdx + 1 : this.state.builderQuestions.length;
    this.state.builderQuestions.splice(insertAt, 0, newQ);
    this.state.activeQuestionIdx = insertAt;
    this.refreshStudioQuestionsView();
    this.showToast('Đã thêm khối Video YouTube vào biểu mẫu!', 'success');
  },

  updateStudioVideoUrl(qIdx, url) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      this.state.builderQuestions[qIdx].video_url = url ? url.trim() : '';
      const card = document.getElementById(`studio-q-card-${qIdx}`);
      // Debounce refresh preview iframe nếu cần
      clearTimeout(this._ytTimer);
      this._ytTimer = setTimeout(() => {
        this.refreshStudioQuestionsView();
      }, 500);
    }
  },

  addStudioSection(afterIdx = null) {
    this.haptic('light');
    const count = (this.state.builderQuestions || []).filter(q => q.type === 'SECTION_HEADER').length + 1;
    const newQ = {
      id: `q_sec_${Date.now()}`,
      type: 'SECTION_HEADER',
      content: `Phần ${count + 1}: Tiêu đề phân đoạn mới`,
      rows: ['Mô tả phân đoạn này (tùy chọn)'],
      options: null,
      columns: null,
      is_required: false,
      is_screener: false
    };
    const insertAt = afterIdx !== null ? afterIdx + 1 : this.state.builderQuestions.length;
    this.state.builderQuestions.splice(insertAt, 0, newQ);
    this.state.activeQuestionIdx = insertAt;
    this.refreshStudioQuestionsView();
    this.showToast('Đã thêm phân đoạn mới (Section) vào biểu mẫu!', 'success');
  },

  updateStudioSectionDesc(qIdx, text) {
    if (this.state.builderQuestions && this.state.builderQuestions[qIdx]) {
      this.state.builderQuestions[qIdx].rows = [text || ''];
      this.state.builderQuestions[qIdx].description = text || '';
    }
  },

  addStudioTextBlock(afterIdx = null) {
    this.haptic('light');
    const newQ = {
      id: `q_text_${Date.now()}`,
      type: 'TEXT_BLOCK',
      content: 'Tiêu đề khối thông tin',
      rows: ['Nội dung mô tả chi tiết...'],
      options: null,
      columns: null,
      is_required: false,
      is_screener: false
    };
    const insertAt = afterIdx !== null ? afterIdx + 1 : this.state.builderQuestions.length;
    this.state.builderQuestions.splice(insertAt, 0, newQ);
    this.state.activeQuestionIdx = insertAt;
    this.refreshStudioQuestionsView();
    this.showToast('Đã thêm khối Tiêu đề & Mô tả (Tt)!', 'success');
  },

  refreshStudioQuestionsView() {
    const container = document.getElementById('builder-questions-list');
    const countEl = document.getElementById('builder-q-count');
    if (container) {
      container.innerHTML = this.renderStudioQuestionsHtml();
      if (window.lucide) window.lucide.createIcons();
    }
    if (countEl) {
      countEl.innerText = `${(this.state.builderQuestions || []).length} câu`;
    }
  },

  switchCreateSurveyTab(tab) {
    this.haptic('light');
    this.state.createSurveyTab = tab;
    ['BUILDER', 'SMART_PASTE', 'EXTERNAL_URL'].forEach(t => {
      const el = document.getElementById(`create-tab-content-${t}`);
      if (el) {
        if (t === tab) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });
    this.renderCreateSurveyView(document.getElementById('app-root'));
  },

  handleSmartPasteSubmit() {
    this.haptic('medium');
    const rawText = document.getElementById('smart-paste-input')?.value?.trim();
    if (!rawText) {
      this.showToast('Vui lòng dán nội dung văn bản câu hỏi vào khung!', 'warning');
      return;
    }
    const parsed = this.parseRawQuestionsText(rawText);
    if (!parsed || parsed.length === 0) {
      this.showToast('Không nhận diện được câu hỏi nào từ văn bản. Vui lòng kiểm tra lại định dạng!', 'error');
      return;
    }

    if (parsed.formTitle) {
      const titleInput = document.getElementById('fast-title');
      if (titleInput && (!titleInput.value || titleInput.value.trim() === 'Biểu mẫu chưa đặt tiêu đề' || titleInput.value.trim() === 'Khảo sát mới')) {
        titleInput.value = parsed.formTitle;
        this.state.draftTitle = parsed.formTitle;
      }
    }
    if (parsed.formDesc) {
      const descInput = document.getElementById('fast-desc');
      if (descInput && !descInput.value) {
        descInput.value = parsed.formDesc;
        this.state.draftDesc = parsed.formDesc;
      }
    }

    this.state.builderQuestions = parsed;
    this.state.activeQuestionIdx = 0;
    this.showToast(`Đã nhận diện thành công ${parsed.length} câu hỏi theo đúng định dạng!`, 'success');
    this.switchCreateSurveyTab('BUILDER');
  },

  extractNumberRange(str) {
    const engine = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
    if (engine && typeof engine.extractNumberRange === 'function') {
      return engine.extractNumberRange(str);
    }
    return null;
  },

  parseRawQuestionsText(text) {
    if (typeof this !== 'undefined' && typeof this.extractNumberRange !== 'function') {
      const eng = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
      this.extractNumberRange = (str) => {
        if (eng && typeof eng.extractNumberRange === 'function') return eng.extractNumberRange(str);
        if (!str || typeof str !== 'string') return null;
        const sanitizedText = str
          .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:T\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?/gi, ' ')
          .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, ' ')
          .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g, ' ')
          .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
          .replace(/\b0\d{1,3}[-.]\d{3,4}[-.]\d{3,4}\b/g, ' ');
        const norm = sanitizedText
          .replace(/[\uFF5E\u223C\u02DC]/g, '~')
          .replace(/[\u2013\u2014\u2212]/g, '~')
          .replace(/(?<=\d)\s*(?:đến|den|tới|toi|to|và|va|and)\s*(?=\d)/gi, ' ~ ')
          .replace(/(?<=\d)\s*[-~]\s*(?=\d)/g, ' ~ ');
        const m = norm.match(/(\d+(?:[.,]\d+)?)\s*~\s*(\d+(?:[.,]\d+)?)/);
        if (m) {
          const a = parseFloat(m[1].replace(/,/g, ''));
          const b = parseFloat(m[2].replace(/,/g, ''));
          if (!isNaN(a) && !isNaN(b) && a !== b) return { min: Math.min(a, b), max: Math.max(a, b) };
        }
        return null;
      };
    }
    // Tự động gỡ bỏ dấu nháy kép hoặc nháy đơn bao quanh toàn bộ văn bản nếu người dùng copy từ đoạn trích
    const cleanText = (text || '').replace(/^['"\s]+|['"\s]+$/g, '');
    const lines = cleanText.split('\n').map(l => l.trim().replace(/^['"]+|['"]+$/g, '')).filter(Boolean);
    const items = [];
    let formTitle = null;
    let formDesc = null;
    let currentItem = null;

    const isSectionHeader = (line) => {
      return /^(?:\d+[\.\/\:\)]\s*)?(?:mục|phần|section)\s*(\d+|[ivx]+)?[\.\:\-\s]*(.*)/i.test(line);
    };

    const isQuestionStart = (line) => {
      return /^(?:câu\s*hỏi|câu|question|q)\s*(\d+)[\.\/\:\)\-\s]*(.*)/i.test(line) ||
        /^(\d+)[\.\/\:\)](.*)/.test(line);
    };

    const isPlaceholderOrInstruction = (line) => {
      return /^(nhập câu trả lời|vui lòng nhập|nhập phản hồi|your answer|tùy chọn khác|khác\.\.\.|chọn ngày|dd\/mm\/yyyy|yyyy-mm-dd)/i.test(line);
    };

    const detectTypeAndClean = (rawTitle) => {
      let title = rawTitle.trim();
      let isRequired = false;
      let detectedType = null;
      let minLabel = null;
      let maxLabel = null;

      // Bóc tách nhãn Bắt buộc trả lời của Microsoft Forms / Google Forms
      if (/bắt\s*buộc\s*trả\s*lời\.?|bắt\s*buộc\.?|\(\s*bắt\s*buộc\s*\)|\[\s*bắt\s*buộc\s*\]|\*+/i.test(title)) {
        isRequired = true;
        title = title
          .replace(/bắt\s*buộc\s*trả\s*lời\.?/gi, '')
          .replace(/\(\s*bắt\s*buộc\s*\)|\[\s*bắt\s*buộc\s*\]/gi, '')
          .replace(/\s*\*+\s*$/, '')
          .trim();
      }

      // 0. Bóc tách nhãn loại câu hỏi đặc thù của Microsoft Forms
      if (/văn\s*bản\s*nhiều\s*dòng\.?/i.test(title)) {
        detectedType = 'PARAGRAPH';
        title = title.replace(/văn\s*bản\s*nhiều\s*dòng\.?/gi, '').trim();
      } else if (/văn\s*bản\s*một\s*dòng\.?/i.test(title)) {
        detectedType = 'SHORT_TEXT';
        title = title.replace(/văn\s*bản\s*một\s*dòng\.?/gi, '').trim();
      } else if (/nhiều\s*lựa\s*chọn\.?/i.test(title)) {
        detectedType = 'MULTIPLE_CHOICE';
        title = title.replace(/nhiều\s*lựa\s*chọn\.?/gi, '').trim();
      } else if (/một\s*lựa\s*chọn\.?/i.test(title)) {
        detectedType = 'SINGLE_CHOICE';
        title = title.replace(/một\s*lựa\s*chọn\.?/gi, '').trim();
      } else if (/xếp\s*loại\.?|đánh\s*giá\s*sao\.?/i.test(title)) {
        detectedType = 'RATING_STARS';
        title = title.replace(/xếp\s*loại\.?|đánh\s*giá\s*sao\.?/gi, '').trim();
      }

      // 1. Net Promoter Score / NPS
      if (!detectedType && (/Net\s*Promoter\s*Score|NPS/i.test(title))) {
        detectedType = 'LINEAR_SCALE';
        title = title.replace(/(?:\.|\s)*Net\s*Promoter\s*Score[\.\s]*$/i, '').trim();
        minLabel = 'Hoàn toàn không có khả năng';
        maxLabel = 'Rất có khả năng';
      }
      // 2. Văn bản nhiều dòng / Đoạn văn (Paragraph)
      else if (!detectedType && (/văn\s*bản\s*nhiều\s*dòng|đoạn\s*văn|paragraph|long\s*text/i.test(title))) {
        detectedType = 'PARAGRAPH';
        title = title.replace(/(?:\.|\s)*(?:văn\s*bản\s*nhiều\s*dòng|đoạn\s*văn|paragraph|long\s*text)[\.\s]*$/i, '').trim();
      }
      // 3. Xếp loại / Rating stars
      else if (!detectedType && (/xếp\s*loại|đánh\s*giá\s*sao|rating|stars?/i.test(title))) {
        detectedType = 'RATING_STARS';
        title = title.replace(/(?:\.|\s)*(?:xếp\s*loại|đánh\s*giá\s*sao|rating|stars?)[\.\s]*$/i, '').trim();
      }
      // 4. Ngày tháng (Date)
      else if (!detectedType && (/ngày\s*tháng|ngày|date/i.test(title) && !/ngày\s*sinh\s*của/i.test(title))) {
        detectedType = 'DATE_INPUT';
        title = title.replace(/(?:\.|\s)*(?:ngày\s*tháng|ngày|date)[\.\s]*$/i, '').trim();
      }
      // 5. Giờ phút (Time)
      else if (!detectedType && (/giờ\s*phút|thời\s*gian|time/i.test(title))) {
        detectedType = 'TIME_INPUT';
        title = title.replace(/(?:\.|\s)*(?:giờ\s*phút|thời\s*gian|time)[\.\s]*$/i, '').trim();
      }
      // 6. Likert / Grid
      else if (!detectedType && (/likert|lưới\s*trắc\s*nghiệm|choice\s*grid|ma\s*trận/i.test(title))) {
        detectedType = 'CHOICE_GRID';
        title = title.replace(/(?:\.|\s)*(?:likert|lưới\s*trắc\s*nghiệm|choice\s*grid|ma\s*trận)[\.\s]*$/i, '').trim();
      }
      // 7. Lưới hộp kiểm (Checkbox Grid)
      else if (!detectedType && (/lưới\s*hộp\s*kiểm|checkbox\s*grid/i.test(title))) {
        detectedType = 'CHECKBOX_GRID';
        title = title.replace(/(?:\.|\s)*(?:lưới\s*hộp\s*kiểm|checkbox\s*grid)[\.\s]*$/i, '').trim();
      }
      // 8. Nhiều lựa chọn (Checkbox)
      else if (!detectedType && (/nhiều\s*lựa\s*chọn|hộp\s*kiểm|checkbox|multiple\s*choice|chọn\s*nhiều/i.test(title))) {
        detectedType = 'MULTIPLE_CHOICE';
        title = title.replace(/(?:\.|\s)*(?:nhiều\s*lựa\s*chọn|hộp\s*kiểm|checkbox|multiple\s*choice|chọn\s*nhiều)[\.\s]*$/i, '').trim();
      }
      // 9. Xếp thứ tự (Ranking)
      else if (!detectedType && (/xếp\s*thứ\s*tự|thứ\s*tự\s*ưu\s*tiên|ranking|thứ\s*tự/i.test(title))) {
        detectedType = 'SINGLE_CHOICE';
        title = title.replace(/(?:\.|\s)*(?:xếp\s*thứ\s*tự|thứ\s*tự\s*ưu\s*tiên|ranking|thứ\s*tự)[\.\s]*$/i, '').trim();
      }
      // 10. Trắc nghiệm đơn
      else if (!detectedType && (/một\s*lựa\s*chọn|trắc\s*nghiệm|single\s*choice/i.test(title))) {
        detectedType = 'SINGLE_CHOICE';
        title = title.replace(/(?:\.|\s)*(?:một\s*lựa\s*chọn|trắc\s*nghiệm|single\s*choice)[\.\s]*$/i, '').trim();
      }
      // 11. Trả lời ngắn / Văn bản 1 dòng
      else if (!detectedType && (/văn\s*bản|trả\s*lời\s*ngắn|short\s*text/i.test(title))) {
        detectedType = 'SHORT_TEXT';
        title = title.replace(/(?:\.|\s)*(?:văn\s*bản|trả\s*lời\s*ngắn|short\s*text)[\.\s]*$/i, '').trim();
      }

      // Làm sạch ký tự thừa ở cuối: dấu chấm, hai chấm, gạch ngang, dấu hoa thị bắt buộc (*)
      title = title.replace(/[\.\:\-\*]+$/, '').trim();

      return { title, detectedType, minLabel, maxLabel, isRequired };
    };

    let hasMetQuestion = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Phát hiện Tiêu đề / Mô tả Form ở đầu văn bản trước khi gặp câu hỏi hoặc section đầu tiên
      if (!hasMetQuestion && !isSectionHeader(line) && !isQuestionStart(line)) {
        if (!formTitle) {
          formTitle = line;
        } else if (!formDesc) {
          formDesc = line;
        }
        continue;
      }

      // Phát hiện Section Header (Mục 1, Phần 2:..., 15. Mục:...)
      if (isSectionHeader(line)) {
        hasMetQuestion = true;
        if (currentItem) items.push(currentItem);

        const secMatch = /^(?:\d+[\.\/\:\)]\s*)?(mục|phần|section)\s*(\d+|[ivx]+)?[\.\:\-\s]*(.*)/i.exec(line);
        const secNum = secMatch && secMatch[2] ? ' ' + secMatch[2] : '';
        const secTitle = secMatch && secMatch[3] ? (secMatch[3].startsWith(':') ? secMatch[3] : ': ' + secMatch[3]) : '';
        const secName = `Mục${secNum}${secTitle}`.trim() || line;

        currentItem = {
          id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: 'SECTION_HEADER',
          content: secName.trim(),
          rows: [''],
          options: null,
          columns: null,
          is_required: false,
          is_screener: false
        };
        continue;
      }

      // Phát hiện Question Header
      if (isQuestionStart(line)) {
        hasMetQuestion = true;
        if (currentItem) items.push(currentItem);

        let cleanLine = line.replace(/^(?:câu\s*hỏi|câu|question|q)\s*\d+[\.\/\:\)\-\s]*/i, '');
        if (cleanLine === line) {
          cleanLine = line.replace(/^\d+[\.\/\:\)]\s*/, '');
        }

        const { title, detectedType, minLabel, maxLabel, isRequired } = detectTypeAndClean(cleanLine);

        currentItem = {
          id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: detectedType || 'UNKNOWN',
          content: title || 'Câu hỏi',
          options: [],
          rows: [],
          columns: [],
          min_label: minLabel,
          max_label: maxLabel,
          is_required: isRequired !== undefined ? isRequired : true,
          is_screener: false
        };
        continue;
      }

      if (!currentItem) continue;

      // Nếu đang trong SECTION_HEADER: các dòng tiếp theo là mô tả của section
      if (currentItem.type === 'SECTION_HEADER') {
        if (currentItem.rows && currentItem.rows[0]) {
          currentItem.rows[0] += '\n' + line;
        } else {
          currentItem.rows = [line];
        }
        continue;
      }

      // Nếu là dòng placeholder hoặc hướng dẫn hệ thống, kiểm tra để trích xuất validation/placeholder
      const range = this.extractNumberRange(line);
      if (range) {
        currentItem.type = 'SHORT_TEXT';
        currentItem.validation = {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: range.min,
          max: range.max,
          placeholder: `Số phải nằm trong khoảng từ ${range.min} ~ ${range.max}`,
          error_message: `Số phải nằm trong khoảng từ ${range.min} đến ${range.max}`
        };
        currentItem.placeholder = `Số phải nằm trong khoảng từ ${range.min} ~ ${range.max}`;
        continue;
      }

      if (/(?:vui\s*lòng\s*nhập\s*email|email\s*hợp\s*lệ|nhập\s*email|please\s*enter\s*email)/i.test(line)) {
        currentItem.type = 'SHORT_TEXT';
        currentItem.validation = {
          type: 'EMAIL',
          rule: 'EMAIL',
          placeholder: 'Vui lòng nhập email',
          error_message: 'Vui lòng nhập địa chỉ email hợp lệ'
        };
        currentItem.placeholder = 'Vui lòng nhập email';
        continue;
      }

      if (/(?:giá\s*trị\s*phải\s*là\s*(?:một\s*)?số|phải\s*là\s*(?:một\s*)?số|value\s*must\s*be\s*a\s*number|giới\s*hạn\s*số)/i.test(line)) {
        // Chỉ gán IS_NUMBER nếu chưa có ràng buộc dải số BETWEEN
        if (!currentItem.validation || currentItem.validation.rule !== 'BETWEEN') {
          currentItem.type = 'SHORT_TEXT';
          currentItem.validation = {
            type: 'NUMBER',
            rule: 'IS_NUMBER',
            placeholder: 'Giá trị phải là một số',
            error_message: 'Giá trị phải là một số'
          };
          currentItem.placeholder = 'Giá trị phải là một số';
        }
        continue;
      }

      if (/(?:chọn\s*câu\s*trả\s*lời\s*của\s*bạn|select\s*your\s*answer)/i.test(line)) {
        currentItem.type = 'DROPDOWN';
        currentItem.placeholder = 'Chọn câu trả lời của bạn';
        continue;
      }

      if (/(?:nhập\s*câu\s*trả\s*lời\s*của\s*bạn|enter\s*your\s*answer)/i.test(line)) {
        currentItem.placeholder = 'Nhập câu trả lời của bạn';
        continue;
      }

      if (isPlaceholderOrInstruction(line)) {
        continue;
      }

      // Xử lý các dòng con theo từng loại câu hỏi:
      // A. LINEAR_SCALE / NPS
      if (currentItem.type === 'LINEAR_SCALE') {
        if (!currentItem.min_label || currentItem.min_label === 'Hoàn toàn không có khả năng') {
          if (/không\s*có\s*khả\s*năng|rất\s*tệ|không\s*hài\s*lòng/i.test(line)) {
            currentItem.min_label = line;
            continue;
          }
        }
        if (!currentItem.max_label || currentItem.max_label === 'Rất có khả năng') {
          if (/có\s*khả\s*năng|rất\s*tốt|rất\s*hài\s*lòng/i.test(line)) {
            currentItem.max_label = line;
            continue;
          }
        }
        continue;
      }

      // B. CHOICE_GRID (Likert)
      if (currentItem.type === 'CHOICE_GRID' || currentItem.type === 'CHECKBOX_GRID') {
        const isCol = /^tùy\s*chọn\s*\d+/i.test(line) || /^option\s*\d+/i.test(line) || /^(rất\s*không|không|bình\s*thường|đồng\s*ý|rất\s*đồng\s*ý)/i.test(line);
        const isRow = /^câu\s*trình\s*bày\s*\d+/i.test(line) || /^phát\s*biểu\s*\d+/i.test(line) || /^mệnh\s*đề\s*\d+/i.test(line);

        if (isCol) {
          currentItem.columns.push(line);
        } else if (isRow) {
          currentItem.rows.push(line);
        } else {
          if (currentItem.columns.length < 5 && currentItem.rows.length === 0) {
            currentItem.columns.push(line);
          } else {
            currentItem.rows.push(line);
          }
        }
        continue;
      }

      // C. CÂU HỎI TỰ LUẬN / NGÀY / GIỜ / ĐÁNH GIÁ SAO
      if (['PARAGRAPH', 'SHORT_TEXT', 'DATE_INPUT', 'TIME_INPUT', 'RATING_STARS'].includes(currentItem.type)) {
        continue;
      }

      // D. CÁC CÂU HỎI LỰA CHỌN (SINGLE_CHOICE, MULTIPLE_CHOICE, UNKNOWN)
      const optMatch = /^([a-zA-Z0-9][\.\)\:\/\-]|•|\*|\-|\[\s*\]|\(\s*\)|o)\s*(.+)/.exec(line);
      const optText = optMatch ? optMatch[2].trim() : line.trim();

      if (optText) {
        currentItem.options.push(optText);
      }
    }

    if (currentItem) items.push(currentItem);

    // Hậu xử lý (Post-process) cho từng câu hỏi
    const questions = items.map((q) => {
      if (q.type === 'SECTION_HEADER') {
        return {
          id: q.id,
          type: 'SECTION_HEADER',
          content: q.content,
          rows: q.rows && q.rows[0] ? q.rows : [''],
          options: null,
          columns: null,
          is_required: false,
          is_screener: false
        };
      }

      if (q.type === 'UNKNOWN') {
        if (q.options && q.options.length >= 2) {
          const hasMultiKw = /(những|các|liệt kê|chọn tất cả|chọn nhiều)/i.test(q.content);
          q.type = hasMultiKw ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE';
        } else {
          const isLongText = /(chi tiết|nêu ý kiến|tại sao|như thế nào|chia sẻ|cảm nhận|đóng góp)/i.test(q.content);
          const isDate = /(ngày sinh|ngày cấp|hạn sử dụng|vào ngày nào)/i.test(q.content);
          const isRating = /(mức độ hài lòng|chấm điểm|đánh giá)/i.test(q.content);

          if (isLongText) q.type = 'PARAGRAPH';
          else if (isDate) q.type = 'DATE_INPUT';
          else if (isRating) q.type = 'RATING_STARS';
          else q.type = 'SHORT_TEXT';
        }
      }

      if (q.type === 'LINEAR_SCALE') {
        const isNps = /Net\s*Promoter\s*Score|NPS/i.test(q.content) ||
          /không\s*có\s*khả\s*năng|rất\s*có\s*khả\s*năng/i.test((q.min_label || '') + (q.max_label || ''));
        if (isNps) {
          q.options = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
          q.min_label = q.min_label || 'Hoàn toàn không có khả năng';
          q.max_label = q.max_label || 'Rất có khả năng';
        } else {
          q.options = (q.options && q.options.length >= 2) ? q.options : ['1', '2', '3', '4', '5'];
          q.min_label = q.min_label || 'Rất không hài lòng';
          q.max_label = q.max_label || 'Rất hài lòng';
        }
        q.rows = null;
        q.columns = null;
      } else if (q.type === 'CHOICE_GRID' || q.type === 'CHECKBOX_GRID') {
        if (!q.columns || q.columns.length === 0) {
          q.columns = ['Rất không đồng ý', 'Không đồng ý', 'Bình thường', 'Đồng ý', 'Rất đồng ý'];
        }
        if (!q.rows || q.rows.length === 0) {
          q.rows = ['Tiêu chí đánh giá 1', 'Tiêu chí đánh giá 2'];
        }
        q.options = null;
      } else if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(q.type)) {
        if (!q.options || q.options.length < 2) {
          q.options = q.options && q.options.length === 1 ? [q.options[0], 'Tùy chọn 2'] : ['Tùy chọn 1', 'Tùy chọn 2'];
        }
        q.rows = null;
        q.columns = null;
      } else if (['SHORT_TEXT', 'PARAGRAPH', 'RATING_STARS', 'DATE_INPUT', 'TIME_INPUT', 'FILE_UPLOAD'].includes(q.type)) {
        q.options = null;
        q.rows = null;
        q.columns = null;
      }

      if (q.validation) {
        if (!q.logic) q.logic = {};
        q.logic.validation = q.validation;
      } else if (['SHORT_TEXT', 'PARAGRAPH'].includes(q.type) && q.content) {
        const eng = (typeof window !== 'undefined' && window.RestrictionEngine) ? window.RestrictionEngine : (typeof RestrictionEngine !== 'undefined' ? RestrictionEngine : null);
        if (eng && typeof eng.inferValidationFromTitle === 'function') {
          const inf = eng.inferValidationFromTitle(q.content, q.placeholder || '');
          if (inf) {
            q.validation = { ...inf };
            if (!q.logic) q.logic = {};
            q.logic.validation = { ...inf };
            if (inf.placeholder) q.placeholder = inf.placeholder;
          }
        }
      }

      return q;
    });

    // Tự động suy luận Branching Logic & Điểm hội tụ cho Client Parser
    const sectionHeaders = questions.filter(q => q.type === 'SECTION_HEADER');
    if (sectionHeaders.length >= 2) {
      const cleanFuzzy = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
      const getSecText = (s) => `${s.content || ''} ${Array.isArray(s.rows) ? s.rows.join(' ') : ''}`.trim();

      for (const q of questions) {
        if (!['SINGLE_CHOICE', 'DROPDOWN'].includes(q.type) || !Array.isArray(q.options) || q.options.length < 2) continue;
        const qContext = q.content || '';
        const isNV1 = /(?:nguyện\s*vọng\s*1|nv1)\b/i.test(qContext);
        const isNV2 = /(?:nguyện\s*vọng\s*2|nv2)\b/i.test(qContext);

        let candidateSecs = sectionHeaders;
        if (isNV1) {
          const nv1Secs = sectionHeaders.filter(s => /(?:nv1|nguyện\s*vọng\s*1)\b/i.test(getSecText(s)));
          if (nv1Secs.length > 0) candidateSecs = nv1Secs;
        } else if (isNV2) {
          const nv2Secs = sectionHeaders.filter(s => /(?:nv2|nguyện\s*vọng\s*2)\b/i.test(getSecText(s)));
          if (nv2Secs.length > 0) candidateSecs = nv2Secs;
        }

        const logicOpts = {};
        let matched = 0;
        for (let i = 0; i < q.options.length; i++) {
          const opt = q.options[i];
          if (/chỉ\s*muốn\s*tham\s*gia|không\s*có\s*nguyện\s*vọng\s*2|bỏ\s*qua\s*nv2/i.test(opt)) {
            const lastSec = sectionHeaders[sectionHeaders.length - 1];
            logicOpts[opt] = { action: 'GO_TO_PAGE', target: lastSec.id };
            logicOpts[i] = { action: 'GO_TO_PAGE', target: lastSec.id };
            matched++;
            continue;
          }
          const optFuzzy = cleanFuzzy(opt);
          if (optFuzzy.length < 3) continue;

          let targetSec = candidateSecs.find(s => cleanFuzzy(getSecText(s)).includes(optFuzzy));
          if (!targetSec && candidateSecs !== sectionHeaders) {
            targetSec = sectionHeaders.find(s => cleanFuzzy(getSecText(s)).includes(optFuzzy));
          }
          if (targetSec && targetSec.id !== q.id) {
            logicOpts[opt] = { action: 'GO_TO_PAGE', target: targetSec.id };
            logicOpts[i] = { action: 'GO_TO_PAGE', target: targetSec.id };
            matched++;
          }
        }

        if (matched >= 2) {
          q.logic = q.logic || {};
          q.logic.enabled = true;
          q.logic.options = logicOpts;
        }
      }

      // Tự động gắn điểm hội tụ
      const secNV2 = sectionHeaders.find(s => /(?:nguyện\s*vọng\s*2|nv2)\b/i.test(getSecText(s)));
      const secEnd = sectionHeaders[sectionHeaders.length - 1];

      for (const sec of sectionHeaders) {
        const secText = getSecText(sec);
        const isNV1Sec = /(?:nv1|nguyện\s*vọng\s*1)\b/i.test(secText);
        const isNV2Sec = /(?:nv2|nguyện\s*vọng\s*2)\b/i.test(secText) && sec !== secNV2;

        if (isNV1Sec && secNV2) {
          sec.logic = sec.logic || {};
          sec.logic.default_action = 'GO_TO_PAGE';
          sec.logic.target = secNV2.id;
        } else if (isNV2Sec && secEnd && secEnd !== sec) {
          sec.logic = sec.logic || {};
          sec.logic.default_action = 'GO_TO_PAGE';
          sec.logic.target = secEnd.id;
        }
      }
    }

    questions.formTitle = formTitle;
    questions.formDesc = formDesc;
    return questions;
  },

  async submitFastCreate(isDraftOnly = false) {
    const title = document.getElementById('fast-title')?.value?.trim() || this.state.draftTitle || '';
    const desc = document.getElementById('fast-desc')?.value?.trim() || this.state.draftDesc || '';
    const category = document.getElementById('fast-category')?.value || this.state.draftCategory || 'Kinh doanh & Thị trường';
    let formUrl = document.getElementById('fast-form-url')?.value?.trim();
    if (formUrl) {
      formUrl = this.normalizeMsFormsUrl(formUrl);
      const urlInput = document.getElementById('fast-form-url');
      if (urlInput) urlInput.value = formUrl;
      this.state.externalFormUrl = formUrl;
    }
    const webhookUrl = document.getElementById('fast-google-sheets-url')?.value?.trim();
    const currentTab = this.state.createSurveyTab || 'BUILDER';
    const calc = this.calculateStudioEscrow();

    if (!title) {
      this.showToast('Vui lòng nhập tiêu đề khảo sát!', 'warning');
      document.getElementById('fast-title')?.focus();
      return;
    }

    let effectiveFormUrl = (formUrl || this.state.externalFormUrl || '').trim();
    let source = 'INTERNAL_BUILDER';
    let externalUrl = null;
    let questionsPayload = [];

    if (effectiveFormUrl) {
      externalUrl = effectiveFormUrl;
      source = (effectiveFormUrl.includes('google.com') || effectiveFormUrl.includes('forms.gle')) ? 'GOOGLE_FORMS' : 'MS_FORMS';
    }

    if (currentTab === 'EXTERNAL_URL') {
      if (!externalUrl) {
        this.showToast('Vui lòng nhập đường link Google Forms hoặc MS Forms!', 'warning');
        return;
      }
      if (this.state.builderQuestions && this.state.builderQuestions.length > 0 && this.state.builderQuestions[0].id !== 'q_init_1') {
        questionsPayload = this.state.builderQuestions;
      } else {
        questionsPayload = [
          {
            id: 'q_ext_1',
            type: 'SINGLE_CHOICE',
            content: 'Bạn đã hoàn thành việc điền biểu mẫu liên kết ngoài chưa?',
            options: ['Tôi đã điền và nộp biểu mẫu thành công', 'Tôi đang điền biểu mẫu'],
            is_required: true,
            is_screener: false
          }
        ];
      }
    } else {
      if (!externalUrl) {
        source = 'INTERNAL_BUILDER';
      }
      const rawQuestions = this.state.builderQuestions || [];
      const cleanQuestions = [];

      for (let i = 0; i < rawQuestions.length; i++) {
        const q = rawQuestions[i];
        const content = (q.content || '').trim();
        if (!content) continue;

        let validOptions = null;
        if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN', 'LINEAR_SCALE'].includes(q.type)) {
          validOptions = (q.options || []).map(o => (o || '').trim()).filter(Boolean);
        }

        let validRows = null;
        let validCols = null;
        if (['CHOICE_GRID', 'CHECKBOX_GRID'].includes(q.type)) {
          validRows = (q.rows || []).map(r => (r || '').trim()).filter(Boolean);
          validCols = (q.columns || []).map(c => (c || '').trim()).filter(Boolean);
        } else if (['SECTION_HEADER', 'TEXT_BLOCK'].includes(q.type)) {
          validRows = (q.rows || []).map(r => (r || '').trim()).filter(Boolean);
          if (validRows.length === 0 && q.description) {
            validRows = [String(q.description).trim()];
          }
        }

        const validationPayload = q.validation || (q.logic && q.logic.validation ? q.logic.validation : null);
        const logicPayload = q.logic ? { ...q.logic } : (validationPayload ? {} : null);
        if (validationPayload && logicPayload) {
          logicPayload.validation = validationPayload;
        }

        cleanQuestions.push({
          id: q.id || `q_custom_${i + 1}`,
          type: q.type || 'SINGLE_CHOICE',
          content: content,
          options: validOptions,
          rows: validRows,
          columns: validCols,
          is_required: q.type === 'SECTION_HEADER' ? false : (q.is_required !== 0 && q.is_required !== false),
          is_screener: q.is_screener === true,
          qualifying_answer: q.qualifying_answer || null,
          min_label: q.min_label || null,
          max_label: q.max_label || null,
          video_url: q.video_url || null,
          image_url: q.image_url || null,
          logic: logicPayload,
          validation: validationPayload
        });
      }

      if (cleanQuestions.length === 0) {
        this.showToast('Khảo sát cần có ít nhất 1 câu hỏi có tiêu đề!', 'warning');
        return;
      }
      questionsPayload = cleanQuestions;
    }

    try {
      this.showToast(isDraftOnly ? 'Đang lưu bản nháp...' : 'Đang xử lý xuất bản & ký quỹ...', 'info');

      const targetDemographics = this.state.hasTargeting ? {
        gender: this.state.targetDemographics?.gender || 'ALL',
        region: this.state.targetDemographics?.region || 'ALL',
        provinces: [this.state.targetDemographics?.region || 'ALL'],
        university: this.state.targetDemographics?.university || 'ALL',
        universities: [this.state.targetDemographics?.university || 'ALL'],
        age_group: this.state.targetDemographics?.age_group || 'ALL',
        occupation: this.state.targetDemographics?.occupation || 'ALL'
      } : null;

      // Chuẩn bị dữ liệu Voucher tài trợ nếu có kích hoạt (Chỉ hỗ trợ Doanh Nghiệp)
      let voucherPayload = null;
      if (!this.isEnterpriseUser()) {
        this.state.studioHasVoucher = false;
      }
      if (this.state.studioHasVoucher) {
        if ((this.state.studioVoucherMode || 'CUSTOM') === 'CUSTOM') {
          const brand = (document.getElementById('studio-custom-voucher-brand')?.value || this.state.studioCustomVoucherBrand || '').trim();
          const titleV = (document.getElementById('studio-custom-voucher-title')?.value || this.state.studioCustomVoucherTitle || '').trim();
          const valV = parseInt(document.getElementById('studio-custom-voucher-val')?.value || this.state.studioCustomVoucherVal, 10) || 50000;
          const expV = document.getElementById('studio-custom-voucher-expiry')?.value || this.state.studioCustomVoucherExpiry || null;
          const instV = (document.getElementById('studio-custom-voucher-inst')?.value || this.state.studioCustomVoucherInst || '').trim();

          if (!brand || !titleV) {
            this.showToast('Vui lòng nhập tên thương hiệu và tiêu đề voucher riêng!', 'warning');
            return;
          }

          let codesArray = [];
          if ((this.state.studioCustomVoucherType || 'SINGLE') === 'SINGLE') {
            const singleCode = (document.getElementById('studio-custom-voucher-single-code')?.value || this.state.studioCustomSingleCode || 'VOUCHERVIP').trim().toUpperCase();
            const targetCount = parseInt(this.state.targetResponses, 10) || 100;
            // Nhân bản mã dùng chung cho đủ số lượng mẫu
            for (let i = 0; i < targetCount; i++) {
              codesArray.push(singleCode);
            }
          } else {
            const rawList = document.getElementById('studio-custom-voucher-codes-list')?.value || this.state.studioCustomCodesList || '';
            codesArray = rawList.split(/[\r\n,]+/).map(c => c.trim()).filter(Boolean);
            if (codesArray.length === 0) {
              this.showToast('Vui lòng nhập ít nhất 1 mã voucher riêng vào danh sách!', 'warning');
              return;
            }
          }

          voucherPayload = {
            mode: 'CUSTOM',
            brand_name: brand,
            title: titleV,
            face_value_vnd: valV,
            expiry_date: expV,
            instructions: instV,
            voucher_codes: codesArray
          };
        } else if (this.state.studioVoucherMode === 'CATALOG') {
          const cat = this.state.studioCatalogVoucher || (this.state.studioCatalogVouchers && this.state.studioCatalogVouchers[0]);
          if (!cat) {
            this.showToast('Vui lòng chọn 1 loại voucher từ kho sàn!', 'warning');
            return;
          }
          const catQty = parseInt(document.getElementById('studio-catalog-voucher-qty')?.value || this.state.studioCatalogVoucherQty, 10) || parseInt(this.state.targetResponses, 10) || 100;
          voucherPayload = {
            mode: 'CATALOG',
            catalog_campaign_id: cat.id,
            quantity: catQty
          };
        }
      }

      const isEditing = !!this.state.editingSurveyId;
      const apiUrl = isEditing ? `/surveys/${this.state.editingSurveyId}` : '/surveys';
      const apiMethod = isEditing ? 'PUT' : 'POST';

      // Quyền riêng tư: đọc trạng thái thu thập email từ toggle (fallback về state nếu panel chưa render)
      const emailCollectionEl = document.getElementById('survey-allow-email-collection');
      const allowEmailCollection = emailCollectionEl ? (emailCollectionEl.checked ? 1 : 0) : (this.state.studioAllowEmailCollection ? 1 : 0);

      const createRes = await this.api(apiUrl, {
        method: apiMethod,
        body: JSON.stringify({
          title,
          description: desc || 'Khảo sát nghiên cứu thị trường và trải nghiệm người dùng.',
          category: category,
          cover_image_url: this.state.draftCoverImageUrl || null,
          target_responses: parseInt(this.state.targetResponses, 10) || 100,
          survey_source: source,
          external_form_url: externalUrl,
          google_sheets_webhook_url: webhookUrl || null,
          reward_mode: voucherPayload ? 'HYBRID_POINTS_AND_VOUCHER' : 'POINTS_ONLY',
          voucher_data: voucherPayload,
          reward_points_per_response: calc.respondentReward,
          is_pinned: this.state.isPinnedSurvey === true,
          is_student_exchange: 0,
          duration_days: parseInt(this.state.surveyDurationDays, 10) || 14,
          allow_edit_response: this.state.allowEditResponse ? 1 : 0,
          allow_view_response: this.state.allowViewResponse !== false ? 1 : 0,
          allow_email_collection: allowEmailCollection,
          target_demographics: targetDemographics,
          questions: questionsPayload
        })
      });

      const surveyId = isEditing ? this.state.editingSurveyId : createRes?.surveyId;

      if (surveyId) {
        // Lưu surveyId vào localStorage
        const storedIds = JSON.parse((localStorage.getItem('survhub_my_surveys') || localStorage.getItem('vibesurvey_my_surveys')) || '[]');
        if (!storedIds.includes(surveyId)) {
          storedIds.push(surveyId);
          localStorage.setItem('survhub_my_surveys', JSON.stringify(storedIds));
        }

        if (isDraftOnly) {
          this.haptic('success');
          this.showToast(isEditing ? 'Đã cập nhật bản nháp khảo sát thành công!' : 'Đã lưu bản nháp khảo sát thành công!', 'success');
          this.resetStudioToNew(false);
          this.navigate('creator-surveys');
          return;
        }

        // Xuất bản và Khóa Ký Quỹ
        try {
          const pubRes = await this.api(`/surveys/${surveyId}/publish`, {
            method: 'POST',
            body: JSON.stringify({ 
              use_free_trial: calc.freeDeductionSamples > 0,
              is_student_exchange: 0
            })
          });

          this.haptic('success');
          this.showToast(pubRes.isFreeTrial ? 'Kích hoạt thành công khảo sát Miễn Phí!' : 'Xuất bản và ký quỹ khảo sát thành công!', 'success');
          if (this.state.currentUser) {
            if (pubRes.newCreditBalance !== undefined) this.state.currentUser.credit_balance = pubRes.newCreditBalance;
            if (pubRes.freeTrialSurveysAvailable !== undefined) this.state.currentUser.free_trial_surveys_available = pubRes.freeTrialSurveysAvailable;
            if (pubRes.freeQuotaRemaining !== undefined) this.state.currentUser.free_quota_remaining = pubRes.freeQuotaRemaining;
          }
          // Xóa ngay cache danh sách khảo sát để khảo sát mới tự động xuất hiện trên giao diện
          try { sessionStorage.removeItem('survhub_surveys_cache'); } catch (e) {}
          this.api('/surveys').then(sRes => {
            if (sRes && Array.isArray(sRes.surveys)) {
              this.state.surveys = sRes.surveys;
              try { sessionStorage.setItem('survhub_surveys_cache', JSON.stringify(sRes.surveys)); } catch (e) {}
            }
          }).catch(() => {});
          this.resetStudioToNew(false);
          this.navigate('creator-surveys');
        } catch (pubErr) {
          this.resetStudioToNew(false);
          this.navigate('creator-surveys');
          if (pubErr.message && pubErr.message.includes('Số dư không đủ')) {
            this.showToast('Đã lưu bản nháp! Bạn cần nạp thêm Credit để ký quỹ xuất bản khảo sát này.', 'warning');
            setTimeout(() => VibeApp.openDepositModal(), 600);
          } else {
            this.showToast(pubErr.message, 'error');
          }
        }
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },
  };

  // Mo rong vao Namespace SSOT window.VibeApp
  Object.assign(window.VibeApp, CreatorStudioModule);
  window.CreatorStudioModule = CreatorStudioModule;
})();
