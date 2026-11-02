const fs = require('fs');

function extractNumberRange(str) {
  if (!str) return null;
  let text = typeof str === 'string' ? str : '';
  if (!text && typeof str === 'object') {
    try {
      if (str.title || str.placeholder || str.subtitle || str.description) {
        text = [str.title, str.subtitle, str.placeholder, str.description].filter(Boolean).join(' ');
      } else {
        text = JSON.stringify(str);
      }
    } catch (e) {
      return null;
    }
  }
  if (!text || typeof text !== 'string') return null;

  // 0. Làm sạch định dạng ngày tháng ISO, ngày tháng thông thường, timestamp và số điện thoại
  const sanitizedText = text
    .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:T\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?/gi, ' ')
    .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, ' ')
    .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\b0\d{1,3}[-.]\d{3,4}[-.]\d{3,4}\b/g, ' ');

  // 1. Cặp số trong mảng JSON
  const jsonArrMatch = sanitizedText.match(/\[\s*["']?(\d+(?:[.,]\d+)?)["']?\s*,\s*["']?(\d+(?:[.,]\d+)?)["']?\s*\]/);
  if (jsonArrMatch) {
    const n1 = parseFloat(jsonArrMatch[1].replace(/,/g, ''));
    const n2 = parseFloat(jsonArrMatch[2].replace(/,/g, ''));
    if (!isNaN(n1) && !isNaN(n2)) {
      return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
    }
  }

  // 2. Cặp số trong thuộc tính JSON
  const propPairs = [
    {
      min: /["']?(?:min|minValue|lowerBound|restrictionValue1|restrictionOperand1|operand1|value1|val1|firstValue)["']?\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?/i,
      max: /["']?(?:max|maxValue|upperBound|restrictionValue2|restrictionOperand2|operand2|value2|val2|secondValue)["']?\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?/i
    },
    {
      min: /["']?(?:max|maxValue|upperBound|restrictionValue2|restrictionOperand2|operand2|value2|val2|secondValue)["']?\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?/i,
      max: /["']?(?:min|minValue|lowerBound|restrictionValue1|restrictionOperand1|operand1|value1|val1|firstValue)["']?\s*[:=]\s*["']?(\d+(?:[.,]\d+)?)["']?/i
    }
  ];
  for (const pair of propPairs) {
    const mMin = sanitizedText.match(pair.min);
    const mMax = sanitizedText.match(pair.max);
    if (mMin && mMax) {
      const n1 = parseFloat(mMin[1].replace(/,/g, ''));
      const n2 = parseFloat(mMax[1].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }
  }

  // 3. Mẫu tiếng Việt / tự nhiên
  const vnPattern = /(?:số\s*phải\s*nằm\s*trong\s*khoảng\s*(?:từ)?|nằm\s*trong\s*khoảng\s*(?:từ)?|trong\s*khoảng\s*(?:từ)?|khoảng\s*(?:từ)?|khoang\s*(?:tu)?|giới\s*hạn\s*(?:từ)?|between)\s*["']?(\d+(?:[.,]\d+)?)["']?\s*(?:đến|den|tới|toi|và|va|to|and|~|-|–|—)\s*["']?(\d+(?:[.,]\d+)?)["']?/i;
  const vnMatch = sanitizedText.match(vnPattern);
  if (vnMatch) {
    const n1 = parseFloat(vnMatch[1].replace(/,/g, ''));
    const n2 = parseFloat(vnMatch[2].replace(/,/g, ''));
    if (!isNaN(n1) && !isNaN(n2)) {
      return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
    }
  }

  // 3b. Mẫu từ X đến Y
  const fromToPattern = /(?:^|[^\w])(?:từ|tu|from)\s*["']?(\d+(?:[.,]\d+)?)["']?\s*(?:đến|den|tới|toi|to|~|-|–|—)\s*["']?(\d+(?:[.,]\d+)?)["']?/i;
  const fromToMatch = sanitizedText.match(fromToPattern);
  if (fromToMatch) {
    const n1 = parseFloat(fromToMatch[1].replace(/,/g, ''));
    const n2 = parseFloat(fromToMatch[2].replace(/,/g, ''));
    if (!isNaN(n1) && !isNaN(n2)) {
      return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
    }
  }

  // 4. Chuẩn hóa các dấu nối dải số thành '~'
  const normalized = sanitizedText
    .replace(/[\uFF5E\u223C\u02DC]/g, '~')
    .replace(/[\u2013\u2014\u2212]/g, '~')
    .replace(/(?<=\d)\s*(?:đến|den|tới|toi|to)\s*(?=\d)/gi, ' ~ ')
    .replace(/(?<=\d)\s*[-~]\s*(?=\d)/g, ' ~ ');

  const matchTilde = normalized.match(/(\d+(?:[.,]\d+)?)\s*~\s*(\d+(?:[.,]\d+)?)/);
  if (matchTilde) {
    const n1 = parseFloat(matchTilde[1].replace(/,/g, ''));
    const n2 = parseFloat(matchTilde[2].replace(/,/g, ''));
    if (!isNaN(n1) && !isNaN(n2) && n1 !== n2) {
      return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
    }
  }

  return null;
}

const tests = [
  '20000000 - 20270000',
  '20000000 - 202700000',
  'Mã số sinh viên (20000000 - 20270000)',
  'Mã số sinh viên (20000000-20270000)',
  '18 - 60',
  '18-60',
  '18 đến 60',
  'từ 18 đến 60',
  '1 - 100',
  'createdAt: 2026-11-02T05:28:42Z',
  '2026-11-02',
  'Ngày sinh: 15/08/2000',
  '0912-345-678',
  'Lớp - Khóa'
];
tests.forEach(t => console.log(t, '===>', extractNumberRange(t)));
