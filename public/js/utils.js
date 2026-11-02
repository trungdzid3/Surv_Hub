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
 * @exports escapeHtml, formatVND, refreshIcons
 */

(function () {
  'use strict';

  window.VibeUtils = window.VibeUtils || {};

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
   * Helper moi (WAVE 1): dich ky vong dai thay dan 66 cho window.lucide.createIcons() lap lai trong app.js.
   * @returns {void}
   */
  window.VibeUtils.refreshIcons = function () {
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  };
})();
