/**
 * VietQR Service (EMVCo QR Code Generator & Parser)
 * Zero external dependencies - pure Node.js implementation
 * Conforms to NAPAS247 and EMVCo Merchant-Presented QR Code specifications
 */

const QR_ALNUM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
const QR_ECC_M_BLOCKS = [
  null,
  [1, 16, 10, 0, 0],
  [1, 28, 16, 0, 0],
  [1, 44, 26, 0, 0],
  [2, 32, 18, 0, 0],
  [2, 43, 24, 0, 0],
  [4, 27, 16, 0, 0],
  [4, 31, 18, 0, 0],
  [2, 38, 22, 2, 39],
  [3, 36, 22, 2, 37],
  [4, 43, 26, 1, 44],
  [1, 50, 30, 4, 51],
  [6, 36, 22, 2, 37]
];
const QR_ALIGN_POS = [
  null,
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58]
];

const QR_GF_EXP = new Uint8Array(512);
const QR_GF_LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  QR_GF_EXP[i] = x;
  QR_GF_LOG[x] = i;
  x = (x << 1) ^ ((x & 0x80) ? 0x11d : 0);
}
for (let i = 255; i < 512; i++) {
  QR_GF_EXP[i] = QR_GF_EXP[i - 255];
}

const qrGfMul = (a, b) => (a === 0 || b === 0 ? 0 : QR_GF_EXP[QR_GF_LOG[a] + QR_GF_LOG[b]]);
const _rsGenCache = new Map();

function qrRsGenPoly(ecLen) {
  if (_rsGenCache.has(ecLen)) return _rsGenCache.get(ecLen);
  let gen = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(gen.length + 1).fill(0);
    const root = QR_GF_EXP[i];
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= qrGfMul(gen[j], root);
    }
    gen = next;
  }
  _rsGenCache.set(ecLen, gen);
  return gen;
}

function qrRsEncode(data, ecLen) {
  const gen = qrRsGenPoly(ecLen);
  const res = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.copyWithin(0, 1);
    res[ecLen - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecLen; j++) {
        res[j] ^= qrGfMul(gen[j + 1], factor);
      }
    }
  }
  return res;
}

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
   * Generate direct img.vietqr.io SVG URL (bypassing 301 redirect hops)
   * @param {Object} options
   * @returns {string} Direct image URL
   */
  generateFastQrUrl({ bankBin, accountNumber, amount, orderCode, accountName }) {
    const cleanBin = encodeURIComponent(String(bankBin || '').trim());
    const cleanAccount = encodeURIComponent(String(accountNumber || '').trim());
    const cleanAmount = amount ? Math.round(Number(amount)) : 0;
    const cleanCode = encodeURIComponent(this.normalizeText(orderCode || ''));
    const cleanName = encodeURIComponent(this.normalizeText(accountName || '').toUpperCase());

    return `https://img.vietqr.io/image/${cleanBin}-${cleanAccount}-qr_only.svg?amount=${cleanAmount}&addInfo=${cleanCode}&accountName=${cleanName}`;
  }

  /**
   * Encode text into an ISO/IEC 18004 QR bit matrix (ECC Level M, Versions 1-12)
   * Uses Alphanumeric mode automatically for uppercase EMVCo payloads for larger modules
   * @param {string} text Input string to encode
   * @returns {Uint8Array[]} Square QR module matrix (1 = dark, 0 = light)
   */
  encodeQrMatrix(text) {
    const str = String(text || '');
    if (!str) {
      throw new Error('QR payload string is required');
    }

    const isAlnum = /^[0-9A-Z $%*+\-./:]+$/.test(str);
    const bytes = isAlnum ? null : Buffer.from(str, 'utf8');
    const payloadBitsLen = isAlnum
      ? Math.floor(str.length / 2) * 11 + (str.length % 2) * 6
      : bytes.length * 8;

    let ver = 1;
    while (ver < QR_ECC_M_BLOCKS.length) {
      const [g1, c1, , g2, c2] = QR_ECC_M_BLOCKS[ver];
      const totalData = g1 * c1 + g2 * c2;
      const lenBits = isAlnum ? (ver <= 9 ? 9 : 11) : (ver <= 9 ? 8 : 16);
      if (4 + lenBits + payloadBitsLen <= totalData * 8) break;
      ver++;
    }
    if (ver >= QR_ECC_M_BLOCKS.length) {
      throw new Error('QR payload exceeds supported Version 12 capacity');
    }

    const [g1, c1, ecLen, g2, c2] = QR_ECC_M_BLOCKS[ver];
    const totalData = g1 * c1 + g2 * c2;
    const bits = [];
    const pushBits = (val, n) => {
      for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };

    if (isAlnum) {
      pushBits(0b0010, 4);
      pushBits(str.length, ver <= 9 ? 9 : 11);
      for (let i = 0; i < str.length; i += 2) {
        if (i + 1 < str.length) {
          pushBits(QR_ALNUM_CHARS.indexOf(str[i]) * 45 + QR_ALNUM_CHARS.indexOf(str[i + 1]), 11);
        } else {
          pushBits(QR_ALNUM_CHARS.indexOf(str[i]), 6);
        }
      }
    } else {
      pushBits(0b0100, 4);
      pushBits(bytes.length, ver <= 9 ? 8 : 16);
      for (const b of bytes) pushBits(b, 8);
    }

    const rem = Math.min(4, totalData * 8 - bits.length);
    for (let i = 0; i < rem; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const dataWords = new Uint8Array(totalData);
    for (let i = 0; i < bits.length / 8; i++) {
      let w = 0;
      for (let b = 0; b < 8; b++) w = (w << 1) | bits[i * 8 + b];
      dataWords[i] = w;
    }
    for (let i = bits.length / 8, p = 0; i < totalData; i++, p ^= 1) {
      dataWords[i] = p ? 0x11 : 0xEC;
    }

    const dBlocks = [];
    const eBlocks = [];
    let offset = 0;
    for (let i = 0; i < g1; i++) {
      const b = dataWords.slice(offset, offset + c1);
      dBlocks.push(b);
      eBlocks.push(qrRsEncode(b, ecLen));
      offset += c1;
    }
    for (let i = 0; i < g2; i++) {
      const b = dataWords.slice(offset, offset + c2);
      dBlocks.push(b);
      eBlocks.push(qrRsEncode(b, ecLen));
      offset += c2;
    }

    const codewords = [];
    const maxD = Math.max(c1, c2);
    for (let i = 0; i < maxD; i++) {
      for (const b of dBlocks) if (i < b.length) codewords.push(b[i]);
    }
    for (let i = 0; i < ecLen; i++) {
      for (const b of eBlocks) codewords.push(b[i]);
    }

    const size = 17 + ver * 4;
    const mat = Array.from({ length: size }, () => new Uint8Array(size));
    const isFunc = Array.from({ length: size }, () => new Uint8Array(size));
    const setFunc = (r, c, val) => {
      mat[r][c] = val ? 1 : 0;
      isFunc[r][c] = 1;
    };

    const drawFinder = (r0, c0) => {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const r = r0 + dr;
          const c = c0 + dc;
          if (r < 0 || r >= size || c < 0 || c >= size) continue;
          const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
          const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          setFunc(r, c, inOuter && (onBorder || inInner));
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    for (let i = 8; i < size - 8; i++) {
      setFunc(6, i, i % 2 === 0);
      setFunc(i, 6, i % 2 === 0);
    }

    const aligns = QR_ALIGN_POS[ver];
    for (const r0 of aligns) {
      for (const c0 of aligns) {
        if ((r0 === 6 && c0 === 6) || (r0 === 6 && c0 === size - 7) || (r0 === size - 7 && c0 === 6)) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            setFunc(r0 + dr, c0 + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
          }
        }
      }
    }

    setFunc(size - 8, 8, 1);
    for (let i = 0; i < 9; i++) {
      if (i !== 6) {
        isFunc[8][i] = 1;
        isFunc[i][8] = 1;
      }
    }
    for (let i = 0; i < 8; i++) {
      isFunc[8][size - 1 - i] = 1;
      isFunc[size - 1 - i][8] = 1;
    }

    if (ver >= 7) {
      let remV = ver;
      for (let i = 0; i < 12; i++) remV = (remV << 1) ^ ((remV >>> 11) * 0x1F25);
      const vInfo = (ver << 12) | remV;
      for (let i = 0; i < 18; i++) {
        const bit = (vInfo >>> i) & 1;
        const a = size - 11 + (i % 3);
        const b = Math.floor(i / 3);
        setFunc(a, b, bit);
        setFunc(b, a, bit);
      }
    }

    const allBits = [];
    for (const cw of codewords) {
      for (let b = 7; b >= 0; b--) allBits.push((cw >>> b) & 1);
    }

    let bitIdx = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        const r = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        for (let j = 0; j < 2; j++) {
          const c = right - j;
          if (!isFunc[r][c]) {
            mat[r][c] = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          }
        }
      }
    }

    const masks = [
      (r, c) => (r + c) % 2 === 0,
      (r, c) => r % 2 === 0,
      (r, c) => c % 3 === 0,
      (r, c) => (r + c) % 3 === 0,
      (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
      (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
      (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
      (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
    ];

    const drawFormat = (m, maskIdx) => {
      const data = (0b00 << 3) | maskIdx; // ECC Level M = 00
      let remF = data;
      for (let i = 0; i < 10; i++) remF = (remF << 1) ^ ((remF >>> 9) * 0x537);
      const bits15 = ((data << 10) | remF) ^ 0x5412;
      for (let i = 0; i <= 5; i++) m[8][i] = (bits15 >>> (14 - i)) & 1;
      m[8][7] = (bits15 >>> 8) & 1;
      m[8][8] = (bits15 >>> 7) & 1;
      m[7][8] = (bits15 >>> 6) & 1;
      for (let i = 0; i <= 5; i++) m[i][8] = (bits15 >>> i) & 1;
      for (let i = 0; i < 7; i++) m[size - 1 - i][8] = (bits15 >>> (14 - i)) & 1;
      for (let i = 0; i < 8; i++) m[8][size - 8 + i] = (bits15 >>> (7 - i)) & 1;
    };

    const penalty = (m) => {
      let p = 0;
      const finderMatch = (arr) => {
        let count = 0;
        for (let i = 0; i <= size - 11; i++) {
          const p1 = arr[i] === 1 && arr[i + 1] === 0 && arr[i + 2] === 1 && arr[i + 3] === 1 && arr[i + 4] === 1 && arr[i + 5] === 0 && arr[i + 6] === 1 && arr[i + 7] === 0 && arr[i + 8] === 0 && arr[i + 9] === 0 && arr[i + 10] === 0;
          const p2 = arr[i] === 0 && arr[i + 1] === 0 && arr[i + 2] === 0 && arr[i + 3] === 0 && arr[i + 4] === 1 && arr[i + 5] === 0 && arr[i + 6] === 1 && arr[i + 7] === 1 && arr[i + 8] === 1 && arr[i + 9] === 0 && arr[i + 10] === 1;
          if (p1 || p2) count++;
        }
        return count * 40;
      };

      for (let r = 0; r < size; r++) {
        let runLen = 1;
        for (let c = 1; c < size; c++) {
          if (m[r][c] === m[r][c - 1]) {
            runLen++;
            if (runLen === 5) p += 3;
            else if (runLen > 5) p += 1;
          } else {
            runLen = 1;
          }
        }
        p += finderMatch(m[r]);
      }

      const col = new Uint8Array(size);
      for (let c = 0; c < size; c++) {
        let runLen = 1;
        for (let r = 0; r < size; r++) col[r] = m[r][c];
        for (let r = 1; r < size; r++) {
          if (col[r] === col[r - 1]) {
            runLen++;
            if (runLen === 5) p += 3;
            else if (runLen > 5) p += 1;
          } else {
            runLen = 1;
          }
        }
        p += finderMatch(col);
      }

      for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size - 1; c++) {
          const v = m[r][c];
          if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) p += 3;
        }
      }

      let dark = 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (m[r][c]) dark++;
        }
      }
      const total = size * size;
      const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
      if (k > 0) p += k * 10;
      return p;
    };

    let bestMat = null;
    let bestPen = Infinity;
    for (let mIdx = 0; mIdx < 8; mIdx++) {
      const copy = mat.map((row) => new Uint8Array(row));
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!isFunc[r][c] && masks[mIdx](r, c)) copy[r][c] ^= 1;
        }
      }
      drawFormat(copy, mIdx);
      const pen = penalty(copy);
      if (pen < bestPen) {
        bestPen = pen;
        bestMat = copy;
      }
    }

    return bestMat;
  }

  /**
   * Generate local crisp SVG markup for an EMVCo QR payload (< 2ms, zero network)
   * @param {string} payloadString EMVCo QR payload string
   * @param {Object} [options]
   * @param {number} [options.size=200] SVG width/height in pixels
   * @param {number} [options.margin=1] Quiet zone in modules
   * @returns {string} Compact SVG markup
   */
  generateQrSvg(payloadString, options = {}) {
    const sizePx = Number(options.size) > 0 ? Math.round(Number(options.size)) : 200;
    const margin = Number.isFinite(Number(options.margin)) && Number(options.margin) >= 0 ? Math.round(Number(options.margin)) : 1;
    const mat = this.encodeQrMatrix(payloadString);
    const matSize = mat.length;
    const dim = matSize + margin * 2;
    let pathD = '';

    for (let r = 0; r < matSize; r++) {
      let curX = 0;
      let firstInRow = true;
      let c = 0;
      while (c < matSize) {
        if (!mat[r][c]) {
          c++;
          continue;
        }
        let len = 1;
        while (c + len < matSize && mat[r][c + len]) len++;
        const xStart = c + margin;
        if (firstInRow) {
          pathD += `M${xStart} ${r + margin + 0.5}h${len}`;
          firstInRow = false;
        } else {
          pathD += `m${xStart - curX} 0h${len}`;
        }
        curX = xStart + len;
        c += len;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges"><path fill="#ffffff" d="M0 0h${dim}v${dim}H0z"/><path stroke="#000000" d="${pathD}"/></svg>`;
  }

  /**
   * Generate UTF-8 SVG Data URI ready for instant <img> rendering
   * @param {string} payloadString EMVCo QR payload string
   * @param {Object} [options]
   * @returns {string} data:image/svg+xml;utf8,... URI
   */
  generateQrDataUrl(payloadString, options = {}) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(this.generateQrSvg(payloadString, options));
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
