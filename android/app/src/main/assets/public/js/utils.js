/**
 * SurvHub - Utils Module (WAVE 1 MODULAR)
 * Tap hop cac helper thuan (khong trang thai) dung chung tren nhieu module.
 * escapeHtml la ban canonical duoc di chuyen tu public/app.js (VibeApp.escapeHtml);
 * app.js gi lai mot alias uy quan ve day de giu nguyen vi tri property trong object.
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * Thu tu nap: sau js/data/catalogs.js, truoc cac module va truoc public/app.js.
 *
 * @namespace window.VibeUtils
 * @requires lucide (global, tuy chon - chi dung trong refreshIcons)
 * @exports escapeHtml, formatVND, refreshIcons, beginLatestAction, isLatestAction
 */

(function () {
  'use strict';

  window.VibeUtils = window.VibeUtils || {};

  const _actionSeqMap = new Map();
  const _actionControllers = new Map();

  /**
   * Bat dau mot thao tac moi theo co che Latest-Action-Wins.
   * Huy AbortController truoc do (neu co) va tra ve token kiem tra thao tac moi nhat.
   * @param {string} actionKey - Dinh danh nhom thao tac (vd: 'router:navigate')
   * @param {boolean} [abortPrevious=true] - Co huy request/controller truoc do hay khong
   * @returns {{ seq: number, signal: (AbortSignal|undefined), isLatest: function(): boolean }}
   */
  window.VibeUtils.beginLatestAction = function (actionKey, abortPrevious = true) {
    const seq = (_actionSeqMap.get(actionKey) || 0) + 1;
    _actionSeqMap.set(actionKey, seq);

    if (abortPrevious && _actionControllers.has(actionKey)) {
      const prevController = _actionControllers.get(actionKey);
      if (prevController) {
        try {
          prevController.abort();
        } catch (e) {
          // Bo qua loi abort neu controller da dong
        }
      }
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    _actionControllers.set(actionKey, controller);

    return {
      seq,
      signal: controller ? controller.signal : undefined,
      isLatest: () => _actionSeqMap.get(actionKey) === seq
    };
  };

  /**
   * Kiem tra xem seq co phai la thao tac moi nhat cua actionKey hay khong.
   * @param {string} actionKey - Dinh danh nhom thao tac
   * @param {number} seq - So thu tu cua thao tac can kiem tra
   * @returns {boolean}
   */
  window.VibeUtils.isLatestAction = function (actionKey, seq) {
    return _actionSeqMap.get(actionKey) === seq;
  };

  /**
   * Ma hoa chuoi thanh an toan khi chen vao innerHTML (chong XSS).
   * Ban canonical di chuyen nguyen van tu VibeApp.escapeHtml (public/app.js).
   * @param {*} str - Gia tri bat ky can ma hoa
   * @returns {string} Chuoi da ma hoa thuc the HTML
   */
  window.VibeUtils.escapeHtml = function (str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  /**
   * Dinh dang so theo chuan Viet Nam (dau cham ngan cach nghin).
   * Helper moi (WAVE 1): dich ky vong dai thay dan 84 cho .toLocaleString('vi-VN') lap lai trong app.js.
   * @param {*} n - So (hoac chuoi so) can dinh dang
   * @returns {string} Chuoi da dinh dang vi-VN
   */
  window.VibeUtils.formatVND = function (n) {
    return Number(n || 0).toLocaleString('vi-VN');
  };

  /**
   * Lam moi bo icon Lucide sau khi render HTML dong.
   * Khi co rootEl thi chi quet ben trong rootEl (fallback ve quet toan trang neu loi).
   * @param {Element|Document} [rootEl] - Phan tu goc can quet icon (tuy chon)
   * @returns {void}
   */
  window.VibeUtils.refreshIcons = function (rootEl) {
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;
    const scope = (rootEl && typeof rootEl.querySelector === 'function') ? rootEl : document;
    if (!scope.querySelector('i[data-lucide]')) return;
    if (rootEl) {
      try {
        window.lucide.createIcons({ root: rootEl });
        return;
      } catch (err) {
        // Fallback ve quet toan trang neu tuy chon root khong hop le hoac khong duoc ho tro
      }
    }
    try {
      window.lucide.createIcons();
    } catch (err) {
      // Bo qua loi render icon tranh gian doan luong UI
    }
  };
})();
