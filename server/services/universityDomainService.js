/**
 * universityDomainService.js - Danh mục tên miền email sinh viên mở rộng
 * Nguồn dữ liệu: server/config/universityEmailDomains.json (bóc tách từ tài liệu
 * tham chiếu cấu trúc email đại học Việt Nam; không chứa email cá nhân).
 *
 * Vai trò: bổ sung nhận diện tên miền ngoài .edu.vn / .ac.vn / .udn.vn cho
 * matchingService (xác thực email sinh viên + nhận diện trường từ email).
 *
 * @requires ../config/universityEmailDomains.json
 * @exports UniversityDomainService (singleton)
 */

const catalog = require('../config/universityEmailDomains.json');

const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

class UniversityDomainService {
  /**
   * @param {Object} [source] Catalog JSON (mặc định nạp từ config)
   */
  constructor(source = catalog) {
    /** @type {Map<string, Object>} */
    this.entries = new Map();
    /** @type {Set<string>} */
    this.studentDomainSet = new Set();

    const list = source && Array.isArray(source.domains) ? source.domains : [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const domain = this.normalizeDomain(item.domain);
      if (!domain || !DOMAIN_PATTERN.test(domain) || this.entries.has(domain)) continue;

      const entry = {
        domain,
        institution: item.institution || null,
        code: item.code || null,
        pattern: item.pattern || null,
        studentUsable: item.student_usable === true,
        sourceIndex: Number.isInteger(item.source_index) ? item.source_index : null
      };

      this.entries.set(domain, entry);
      if (entry.studentUsable) this.studentDomainSet.add(domain);
    }
  }

  /**
   * Chuẩn hóa tên miền: bỏ '@' đầu, khoảng trắng và dấu chấm cuối.
   * @param {string} value
   * @returns {string}
   */
  normalizeDomain(value) {
    if (!value || typeof value !== 'string') return '';
    return value.trim().toLowerCase().replace(/^@+/, '').replace(/\.+$/, '');
  }

  /**
   * Tên miền (hoặc tên miền con của nó) có được dùng để xác thực email sinh viên hay không.
   * @param {string} domain
   * @returns {boolean}
   */
  isKnownStudentDomain(domain) {
    const clean = this.normalizeDomain(domain);
    if (!clean) return false;
    if (this.studentDomainSet.has(clean)) return true;

    const labels = clean.split('.');
    for (let i = 1; i < labels.length - 1; i += 1) {
      if (this.studentDomainSet.has(labels.slice(i).join('.'))) return true;
    }
    return false;
  }

  /**
   * Tra cứu trường theo tên miền email (khớp chính xác trước, sau đó tới tên miền cha).
   * @param {string} domain
   * @returns {Object|null} Bản sao entry hoặc null
   */
  findInstitutionByDomain(domain) {
    const clean = this.normalizeDomain(domain);
    if (!clean) return null;
    if (this.entries.has(clean)) return { ...this.entries.get(clean) };

    const labels = clean.split('.');
    for (let i = 1; i < labels.length - 1; i += 1) {
      const parent = labels.slice(i).join('.');
      if (this.entries.has(parent)) return { ...this.entries.get(parent) };
    }
    return null;
  }

  /**
   * @returns {string[]} Danh sách tên miền dùng được để xác thực sinh viên
   */
  getStudentDomains() {
    return [...this.studentDomainSet];
  }

  /**
   * @returns {{domains:number, studentUsable:number, source:string|null, extractedAt:string|null}}
   */
  getStats() {
    return {
      domains: this.entries.size,
      studentUsable: this.studentDomainSet.size,
      source: catalog && catalog.meta ? catalog.meta.source_file : null,
      extractedAt: catalog && catalog.meta ? catalog.meta.extracted_at : null
    };
  }
}

module.exports = new UniversityDomainService();
