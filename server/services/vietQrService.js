/**
 * VietQR Service (EMVCo QR Code Generator & Parser)
 * Zero external dependencies - pure Node.js implementation
 * Conforms to NAPAS247 and EMVCo Merchant-Presented QR Code specifications
 */

class VietQrService {
  /**
   * Calculate CRC16-CCITT checksum according to EMVCo standard
   * Polynomial: 0x1021, Initial value: 0xFFFF, No bit reversal
   * @param {string} data Input data string
   * @returns {string} 4-character uppercase hexadecimal string
   */
  calculateCrc16(data) {
    let crc = 0xFFFF;
    const len = data.length;

    for (let i = 0; i < len; i++) {
      const code = data.charCodeAt(i);
      crc ^= (code << 8);
      for (let bit = 0; bit < 8; bit++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Format a single TLV (Tag-Length-Value) block
   * Length is always 2 digits padded with leading zeros
   * @param {string|number} tag Tag identifier (e.g. '00', '38', '54')
   * @param {string|number} value Data value
   * @returns {string} Formatted TLV string or empty string if value is empty/null/undefined
   */
  formatTlv(tag, value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const tagStr = String(tag).padStart(2, '0');
    const valStr = String(value);
    const lengthStr = String(Buffer.byteLength(valStr, 'utf8')).padStart(2, '0');
    return `${tagStr}${lengthStr}${valStr}`;
  }

  /**
   * Helper to strip Vietnamese diacritics and special characters for standard banking compliance
   * @param {string} str
   * @returns {string}
   */
  normalizeText(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .trim();
  }

  /**
   * Generate raw EMVCo payload string for VietQR / NAPAS 247 transfer
   * @param {Object} options
   * @param {string} options.bankBin 6-digit Bank BIN code (e.g. '970422', '963388')
   * @param {string} options.accountNumber Bank account number
   * @param {number} [options.amount] Transfer amount in VND
   * @param {string} [options.orderCode] Payment purpose / Order reference code (e.g. 'SURV123456')
   * @param {string} [options.accountName] Beneficiary account name
   * @param {boolean} [options.isDynamic=true] Dynamic QR (includes amount/order) or Static QR
   * @returns {string} Complete EMVCo QR code string
   */
  generatePayload({ bankBin, accountNumber, amount, orderCode, accountName, isDynamic = true }) {
    if (!bankBin || !accountNumber) {
      throw new Error('bankBin and accountNumber are required to generate VietQR payload');
    }

    const cleanBin = String(bankBin).trim();
    const cleanAccount = String(accountNumber).trim();

    // Tag 00: Payload Format Indicator (Fixed '01')
    let payload = this.formatTlv('00', '01');

    // Tag 01: Point of Initiation Method ('11': Static, '12': Dynamic)
    payload += this.formatTlv('01', isDynamic ? '12' : '11');

    // Tag 38: Consumer Account Information (NAPAS 247)
    // Subtag 00: NAPAS Application ID (Fixed 'A000000727')
    const sub00 = this.formatTlv('00', 'A000000727');
    // Subtag 01: Beneficiary Bank (Subtag 00: BIN, Subtag 01: Account Number)
    const beneficiarySub = this.formatTlv('00', cleanBin) + this.formatTlv('01', cleanAccount);
    const sub01 = this.formatTlv('01', beneficiarySub);
    // Subtag 02: Service Code ('QRIBFTTA': Fast transfer to Account)
    const sub02 = this.formatTlv('02', 'QRIBFTTA');
    const tag38Value = sub00 + sub01 + sub02;
    payload += this.formatTlv('38', tag38Value);

    // Tag 53: Transaction Currency Code ('704' = VND)
    payload += this.formatTlv('53', '704');

    // Tag 54: Transaction Amount
    const numericAmount = amount ? Math.round(Number(amount)) : 0;
    if (numericAmount > 0) {
      payload += this.formatTlv('54', String(numericAmount));
    }

    // Tag 58: Country Code ('VN')
    payload += this.formatTlv('58', 'VN');

    // Tag 59: Beneficiary Account Name / Merchant Name (Optional)
    if (accountName) {
      const cleanName = this.normalizeText(accountName).toUpperCase().slice(0, 25);
      if (cleanName) {
        payload += this.formatTlv('59', cleanName);
      }
    }

    // Tag 62: Additional Data Field Template
    if (orderCode) {
      const cleanCode = this.normalizeText(orderCode).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 25);
      if (cleanCode) {
        // Subtag 08: Purpose of Transaction / Reference Label
        const sub08 = this.formatTlv('08', cleanCode);
        payload += this.formatTlv('62', sub08);
      }
    }

    // Tag 63: CRC16 Checksum
    // The CRC is calculated over the entire payload plus '6304'
    const crcInput = payload + '6304';
    const crc = this.calculateCrc16(crcInput);

    return crcInput + crc;
  }

  /**
   * Generate VietQR API image URL as fallback
   * @param {Object} options
   * @param {string} options.bankBin Bank BIN code
   * @param {string} options.accountNumber Bank account number
   * @param {number} [options.amount] Transfer amount
   * @param {string} [options.orderCode] Payment description
   * @param {string} [options.accountName] Beneficiary name
   * @param {string} [options.template='compact'] Image template ('compact', 'compact2', 'qr_only', 'print')
   * @returns {string} Image URL
   */
  generateQrUrl({ bankBin, accountNumber, amount, orderCode, accountName, template = 'compact' }) {
    const cleanBin = encodeURIComponent(String(bankBin || '').trim());
    const cleanAccount = encodeURIComponent(String(accountNumber || '').trim());
    const cleanAmount = amount ? Math.round(Number(amount)) : 0;
    const cleanCode = encodeURIComponent(this.normalizeText(orderCode || ''));
    const cleanName = encodeURIComponent(this.normalizeText(accountName || '').toUpperCase());

    return `https://api.vietqr.io/image/${cleanBin}-${cleanAccount}-${template}.jpg?amount=${cleanAmount}&addInfo=${cleanCode}&accountName=${cleanName}`;
  }

  /**
   * Parse helper: split TLV string into key-value map
   * @param {string} data
   * @returns {Object<string, string>}
   */
  parseTlvs(data) {
    const result = {};
    if (!data || typeof data !== 'string') return result;

    let index = 0;
    while (index < data.length) {
      if (index + 4 > data.length) break;
      const tag = data.substring(index, index + 2);
      const len = parseInt(data.substring(index + 2, index + 4), 10);
      if (isNaN(len) || index + 4 + len > data.length) break;

      const val = data.substring(index + 4, index + 4 + len);
      result[tag] = val;
      index += 4 + len;
    }
    return result;
  }

  /**
   * Parse EMVCo / VietQR payload string into structured object
   * @param {string} qrString Raw EMVCo QR code string
   * @returns {Object} Decoded information
   */
  parsePayload(qrString) {
    if (!qrString || typeof qrString !== 'string' || qrString.length < 10) {
      return { isValid: false, error: 'Invalid or empty QR string' };
    }

    try {
      const rootTlvs = this.parseTlvs(qrString);

      // Validate CRC if present
      const reportedCrc = rootTlvs['63'];
      let isValidCrc = false;
      if (reportedCrc && qrString.length >= 8) {
        const dataWithoutCrc = qrString.slice(0, -4);
        const expectedCrc = this.calculateCrc16(dataWithoutCrc);
        isValidCrc = reportedCrc.toUpperCase() === expectedCrc.toUpperCase();
      }

      // Parse Tag 38 (Consumer Account Info)
      let bankBin = null;
      let accountNumber = null;
      let serviceCode = null;
      let guid = null;

      if (rootTlvs['38']) {
        const tag38Tlvs = this.parseTlvs(rootTlvs['38']);
        guid = tag38Tlvs['00'] || null;
        serviceCode = tag38Tlvs['02'] || null;

        if (tag38Tlvs['01']) {
          const beneficiaryTlvs = this.parseTlvs(tag38Tlvs['01']);
          bankBin = beneficiaryTlvs['00'] || null;
          accountNumber = beneficiaryTlvs['01'] || null;
        }
      }

      // Parse Tag 62 (Additional Data)
      let orderCode = null;
      if (rootTlvs['62']) {
        const tag62Tlvs = this.parseTlvs(rootTlvs['62']);
        orderCode = tag62Tlvs['08'] || null;
      }

      const amount = rootTlvs['54'] ? Number(rootTlvs['54']) : null;
      const accountName = rootTlvs['59'] || null;
      const isDynamic = rootTlvs['01'] === '12';
      const currency = rootTlvs['53'] || null;
      const countryCode = rootTlvs['58'] || null;

      return {
        isValid: isValidCrc,
        isValidCrc,
        bankBin,
        accountNumber,
        amount,
        orderCode,
        accountName,
        isDynamic,
        currency,
        countryCode,
        guid,
        serviceCode,
        crc: reportedCrc || null,
        raw: qrString
      };
    } catch (err) {
      return {
        isValid: false,
        error: err.message,
        raw: qrString
      };
    }
  }
}

const vietQrServiceInstance = new VietQrService();

// Export singleton as default, and class as named export
module.exports = vietQrServiceInstance;
module.exports.VietQrService = VietQrService;
