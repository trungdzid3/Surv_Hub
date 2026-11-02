const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'server', 'services', 'formParserService.js');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Cập nhật extractNumberRange
const oldExtractRangeStart = '  extractNumberRange(str) {';
const oldExtractRangeEnd = '  _extractValidationRule({';

const newExtractRangeCode = `  extractNumberRange(str) {
    if (!str) return null;
    let text = typeof str === 'string' ? str : '';
    if (!text && typeof str === 'object') {
      try {
        if (str.title || str.placeholder || str.subtitle || str.description) {
          text = \`\${str.title || ''} \${str.subtitle || ''} \${str.placeholder || ''} \${str.description || ''}\`.trim();
        } else {
          text = JSON.stringify(str);
        }
      } catch (e) {
        return null;
      }
    }
    if (!text || typeof text !== 'string') return null;

    // 0. Làm sạch định dạng ngày tháng và timestamp để không bị bắt nhầm dấu '-' thành khoảng số
    const sanitizedText = text
      .replace(/\\b\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}\\b/g, ' ')
      .replace(/\\b\\d{1,2}[-/]\\d{1,2}[-/]\\d{4}\\b/g, ' ')
      .replace(/\\b\\d{1,2}:\\d{2}(?::\\d{2})?\\b/g, ' ');

    // 1. Cặp số trong mảng JSON: ["20000000", "20270000"] hoặc [20000000, 20270000]
    const jsonArrMatch = sanitizedText.match(/\\[\\s*["']?(\\d+(?:[.,]\\d+)?)["']?\\s*,\\s*["']?(\\d+(?:[.,]\\d+)?)["']?\\s*\\]/);
    if (jsonArrMatch) {
      const n1 = parseFloat(jsonArrMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(jsonArrMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }

    // 2. Cặp số trong thuộc tính JSON: min/max, minValue/maxValue, lowerBound/upperBound, restrictionValue1/restrictionValue2, operand1/operand2, value1/value2
    const propPairs = [
      {
        min: /["']?(?:min|minValue|lowerBound|restrictionValue1|restrictionOperand1|operand1|value1|val1|firstValue)["']?\\s*[:=]\\s*["']?(\\d+(?:[.,]\\d+)?)["']?/i,
        max: /["']?(?:max|maxValue|upperBound|restrictionValue2|restrictionOperand2|operand2|value2|val2|secondValue)["']?\\s*[:=]\\s*["']?(\\d+(?:[.,]\\d+)?)["']?/i
      },
      {
        min: /["']?(?:max|maxValue|upperBound|restrictionValue2|restrictionOperand2|operand2|value2|val2|secondValue)["']?\\s*[:=]\\s*["']?(\\d+(?:[.,]\\d+)?)["']?/i,
        max: /["']?(?:min|minValue|lowerBound|restrictionValue1|restrictionOperand1|operand1|value1|val1|firstValue)["']?\\s*[:=]\\s*["']?(\\d+(?:[.,]\\d+)?)["']?/i
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

    // 3. Bắt trọn mẫu tiếng Việt & tự nhiên: "số phải nằm trong khoảng từ ... đến ...", "trong khoảng ... đến ...", "từ ... ~ ..."
    const vnPattern = /(?:số\\s*phải\\s*nằm\\s*trong\\s*khoảng\\s*(?:từ)?|nằm\\s*trong\\s*khoảng\\s*(?:từ)?|trong\\s*khoảng\\s*(?:từ)?|khoảng\\s*(?:từ)?|khoang\\s*(?:tu)?|giới\\s*hạn\\s*(?:từ)?|between)\\s*["']?(\\d+(?:[.,]\\d+)?)["']?\\s*(?:đến|den|tới|toi|và|va|to|and|~|-|–|—)\\s*["']?(\\d+(?:[.,]\\d+)?)["']?/i;
    const vnMatch = sanitizedText.match(vnPattern);
    if (vnMatch) {
      const n1 = parseFloat(vnMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(vnMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }

    // 3b. Mẫu "từ X đến/tới Y"
    const fromToPattern = /(?:^|[^\\w])(?:từ|tu|from)\\s*["']?(\\d+(?:[.,]\\d+)?)["']?\\s*(?:đến|den|tới|toi|to|~|–|—)\\s*["']?(\\d+(?:[.,]\\d+)?)["']?/i;
    const fromToMatch = sanitizedText.match(fromToPattern);
    if (fromToMatch) {
      const n1 = parseFloat(fromToMatch[1].replace(/,/g, ''));
      const n2 = parseFloat(fromToMatch[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }

    // 4. Dải số có ký tự nối hoặc từ nối rõ ràng: ~, \\u2013, \\u2014, \\u2212, \\uFF5E, \\u223C, \\u02DC, hoặc "X đến Y"
    const normalized = sanitizedText
      .replace(/[\\uFF5E\\u223C\\u02DC]/g, '~')
      .replace(/[\\u2013\\u2014\\u2212]/g, '~')
      .replace(/(?<=\\d)\\s*(?:đến|den|tới|toi|to)\\s*(?=\\d)/gi, ' ~ ');

    const matchTilde = normalized.match(/(\\d+(?:[.,]\\d+)?)\\s*~\\s*(\\d+(?:[.,]\\d+)?)/);
    if (matchTilde) {
      const n1 = parseFloat(matchTilde[1].replace(/,/g, ''));
      const n2 = parseFloat(matchTilde[2].replace(/,/g, ''));
      if (!isNaN(n1) && !isNaN(n2)) {
        return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
      }
    }

    return null;
  }

`;

const idxExtractStart = code.indexOf(oldExtractRangeStart);
const idxExtractEnd = code.indexOf(oldExtractRangeEnd);

if (idxExtractStart === -1 || idxExtractEnd === -1) {
  console.error('Không tìm thấy extractNumberRange trong formParserService.js');
  process.exit(1);
}

code = code.substring(0, idxExtractStart) + newExtractRangeCode + code.substring(idxExtractEnd);

// 2. Cập nhật _extractValidationRule
const oldRuleStart = '  _extractValidationRule({';
const oldRuleEnd = '    // 4. Phân tích ngữ cảnh văn bản (Text / Subtitle / Placeholder / Title / Description)';

const newRuleCode = `  _extractValidationRule({ title = '', subtitle = '', placeholder = '', description = '', questionInfoObj = null, rawRestrictions = null, rawValidationArray = null, rawQuestion = null }) {
    // Chỉ phân tích chuỗi người dùng nhìn thấy được, tuyệt đối không stringify rawQuestion chứa metadata ngày tháng / ID
    const userFacingText = \`\${title || ''} \${subtitle || ''} \${placeholder || ''} \${description || ''}\`.trim();

    // 1. Nếu có rawValidationArray từ Google Forms (FB_PUBLIC_LOAD_DATA_ qData[4])
    if (Array.isArray(rawValidationArray) && rawValidationArray.length > 0) {
      for (const ruleItem of rawValidationArray) {
        if (!Array.isArray(ruleItem)) continue;
        const vType = ruleItem[0];
        const opType = ruleItem[1];
        const operands = Array.isArray(ruleItem[2]) ? ruleItem[2] : [];
        const customMsg = typeof ruleItem[3] === 'string' && ruleItem[3].trim() ? ruleItem[3].trim() : '';

        // 1.1 Number
        if (vType === 1) {
          if (opType === 7) { // Between
            let n1 = parseFloat(operands[0]);
            let n2 = parseFloat(operands[1]);
            if (isNaN(n1) || isNaN(n2)) {
              const r = this.extractNumberRange(userFacingText);
              if (r) { n1 = r.min; n2 = r.max; }
            }
            if (!isNaN(n1) && !isNaN(n2)) {
              const minVal = Math.min(n1, n2);
              const maxVal = Math.max(n1, n2);
              return {
                type: 'NUMBER',
                rule: 'BETWEEN',
                min: minVal,
                max: maxVal,
                placeholder: \`Số phải nằm trong khoảng từ \${minVal} ~ \${maxVal}\`,
                error_message: customMsg || \`Số phải nằm trong khoảng từ \${minVal} đến \${maxVal}\`
              };
            }
          }
          if (opType === 8) { // Not between
            let n1 = parseFloat(operands[0]);
            let n2 = parseFloat(operands[1]);
            if (isNaN(n1) || isNaN(n2)) {
              const r = this.extractNumberRange(userFacingText);
              if (r) { n1 = r.min; n2 = r.max; }
            }
            if (!isNaN(n1) && !isNaN(n2)) {
              const minVal = Math.min(n1, n2);
              const maxVal = Math.max(n1, n2);
              return {
                type: 'NUMBER',
                rule: 'NOT_BETWEEN',
                min: minVal,
                max: maxVal,
                placeholder: \`Không nằm trong khoảng từ \${minVal} ~ \${maxVal}\`,
                error_message: customMsg || \`Không nằm trong khoảng từ \${minVal} đến \${maxVal}\`
              };
            }
          }
          if (opType === 1) { // Greater than
            const min = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'GREATER_THAN',
              min,
              placeholder: \`Lớn hơn \${min}\`,
              error_message: customMsg || \`Giá trị phải lớn hơn \${min}\`
            };
          }
          if (opType === 2) { // Greater than or equal
            const min = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'GREATER_THAN_OR_EQUAL',
              min,
              placeholder: \`Lớn hơn hoặc bằng \${min}\`,
              error_message: customMsg || \`Giá trị phải lớn hơn hoặc bằng \${min}\`
            };
          }
          if (opType === 3) { // Less than
            const max = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'LESS_THAN',
              max,
              placeholder: \`Nhỏ hơn \${max}\`,
              error_message: customMsg || \`Giá trị phải nhỏ hơn \${max}\`
            };
          }
          if (opType === 4) { // Less than or equal
            const max = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'LESS_THAN_OR_EQUAL',
              max,
              placeholder: \`Nhỏ hơn hoặc bằng \${max}\`,
              error_message: customMsg || \`Giá trị phải nhỏ hơn hoặc bằng \${max}\`
            };
          }
          if (opType === 5) { // Equal
            const val = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'EQUAL',
              value: val,
              placeholder: \`Bằng \${val}\`,
              error_message: customMsg || \`Giá trị phải bằng \${val}\`
            };
          }
          if (opType === 6) { // Not equal
            const val = parseFloat(operands[0]) || 0;
            return {
              type: 'NUMBER',
              rule: 'NOT_EQUAL',
              value: val,
              placeholder: \`Không bằng \${val}\`,
              error_message: customMsg || \`Giá trị không được bằng \${val}\`
            };
          }
          if (opType === 9) { // Is number
            // Chỉ khi tiêu đề hoặc placeholder có bẫy dải số tường minh rõ ràng
            const explicitRange = this.extractNumberRange(userFacingText);
            if (explicitRange) {
              return {
                type: 'NUMBER',
                rule: 'BETWEEN',
                min: explicitRange.min,
                max: explicitRange.max,
                placeholder: \`Số phải nằm trong khoảng từ \${explicitRange.min} ~ \${explicitRange.max}\`,
                error_message: customMsg || \`Số phải nằm trong khoảng từ \${explicitRange.min} đến \${explicitRange.max}\`
              };
            }
            return {
              type: 'NUMBER',
              rule: 'IS_NUMBER',
              placeholder: 'Giá trị phải là một số',
              error_message: customMsg || 'Giá trị phải là một số'
            };
          }
          if (opType === 10) { // Whole number
            return {
              type: 'NUMBER',
              rule: 'INTEGER',
              placeholder: 'Giá trị phải là số nguyên',
              error_message: customMsg || 'Giá trị phải là số nguyên'
            };
          }
        }

        // 1.2 Text (Email / URL)
        if (vType === 2) {
          if (opType === 3) { // Email
            return {
              type: 'EMAIL',
              rule: 'EMAIL',
              placeholder: 'Vui lòng nhập email',
              error_message: customMsg || 'Vui lòng nhập địa chỉ email hợp lệ'
            };
          }
          if (opType === 4) { // URL
            return {
              type: 'URL',
              rule: 'URL',
              placeholder: 'Vui lòng nhập URL hợp lệ',
              error_message: customMsg || 'Vui lòng nhập đường dẫn URL hợp lệ'
            };
          }
        }

        // 1.3 Length
        if (vType === 3) {
          if (opType === 1) { // Max char count
            const maxLen = parseInt(operands[0], 10) || 500;
            return {
              type: 'LENGTH',
              rule: 'MAX_LENGTH',
              max: maxLen,
              placeholder: \`Tối đa \${maxLen} ký tự\`,
              error_message: customMsg || \`Độ dài không được vượt quá \${maxLen} ký tự\`
            };
          }
          if (opType === 2) { // Min char count
            const minLen = parseInt(operands[0], 10) || 1;
            return {
              type: 'LENGTH',
              rule: 'MIN_LENGTH',
              min: minLen,
              placeholder: \`Tối thiểu \${minLen} ký tự\`,
              error_message: customMsg || \`Độ dài phải có ít nhất \${minLen} ký tự\`
            };
          }
        }
      }
    }

    // 2. Thu thập và bóc tách cấu trúc Restrictions từ Microsoft Forms
    const restrictionsList = [];
    const collectRestrictions = (target, depth = 0) => {
      if (!target || depth > 4) return;
      if (typeof target === 'string') {
        try {
          const parsed = JSON.parse(target);
          collectRestrictions(parsed, depth + 1);
        } catch (e) {
          const parsed = this._safeParseJsonOrObject(target);
          if (parsed && typeof parsed === 'object') collectRestrictions(parsed, depth + 1);
        }
        return;
      }
      if (Array.isArray(target)) {
        for (const item of target) collectRestrictions(item, depth + 1);
        return;
      }
      if (typeof target === 'object') {
        if (target.Restrictions) collectRestrictions(target.Restrictions, depth + 1);
        if (target.restrictions) collectRestrictions(target.restrictions);
        if (target.Validation) collectRestrictions(target.Validation, depth + 1);
        if (target.validation) collectRestrictions(target.validation);
        if (target.Rules) collectRestrictions(target.Rules, depth + 1);
        if (target.rules) collectRestrictions(target.rules);
        if (target.CustomProperties) collectRestrictions(target.CustomProperties, depth + 1);
        if (target.customProperties) collectRestrictions(target.customProperties);

        const hasOp = target.RestrictionOperator !== undefined || target.restrictionOperator !== undefined ||
          target.Operator !== undefined || target.operator !== undefined ||
          target.Rule !== undefined || target.rule !== undefined || target.op !== undefined;
        const hasType = target.RestrictionType !== undefined || target.restrictionType !== undefined ||
          target.Type !== undefined || target.type !== undefined;
        const hasVal = target.RestrictionValue1 !== undefined || target.Operand1 !== undefined ||
          target.Value1 !== undefined || target.Min !== undefined || target.min !== undefined ||
          target.Operands !== undefined || target.operands !== undefined;
        if (hasOp || (hasType && hasVal) || target.Type === 1 || target.type === 1 || target.type === 'NUMBER') {
          restrictionsList.push(target);
        }
      }
    };

    if (questionInfoObj) collectRestrictions(questionInfoObj);
    if (rawRestrictions) collectRestrictions(rawRestrictions);
    if (rawQuestion) {
      if (rawQuestion.restrictions) collectRestrictions(rawQuestion.restrictions);
      if (rawQuestion.Restrictions) collectRestrictions(rawQuestion.Restrictions);
      if (rawQuestion.validation) collectRestrictions(rawQuestion.validation);
      if (rawQuestion.Validation) collectRestrictions(rawQuestion.Validation);
    }

    // Helper trích xuất giá trị toán hạng val1 và val2 từ một restriction object
    const extractOperandsFromR = (r) => {
      let v1 = undefined;
      let v2 = undefined;

      const getVal1 = (obj) => obj.RestrictionValue1 ?? obj.restrictionValue1 ?? obj.RestrictionOperand1 ?? obj.restrictionOperand1 ??
        obj.Min ?? obj.min ?? obj.MinValue ?? obj.minValue ?? obj.lowerBound ?? obj.LowerBound ??
        obj.Operand1 ?? obj.operand1 ?? obj.Value1 ?? obj.value1 ?? obj.Value ?? obj.value ?? obj.FirstValue ?? obj.firstValue;
      const getVal2 = (obj) => obj.RestrictionValue2 ?? obj.restrictionValue2 ?? obj.RestrictionOperand2 ?? obj.restrictionOperand2 ??
        obj.Max ?? obj.max ?? obj.MaxValue ?? obj.maxValue ?? obj.upperBound ?? obj.UpperBound ??
        obj.Operand2 ?? obj.operand2 ?? obj.Value2 ?? obj.value2 ?? obj.SecValue ?? obj.secValue ??
        obj.SecondaryValue ?? obj.secondaryValue ?? obj.SecondValue ?? obj.secondValue;

      v1 = getVal1(r);
      v2 = getVal2(r);

      // 2. Quét r.Operands / r.operands
      const rawOps = r.Operands !== undefined ? r.Operands : r.operands;
      if (rawOps !== undefined && rawOps !== null) {
        let ops = rawOps;
        if (typeof ops === 'string') {
          try { ops = JSON.parse(ops); } catch (e) {
            ops = this._safeParseJsonOrObject(ops);
          }
        }
        if (Array.isArray(ops)) {
          if (v1 === undefined && ops[0] !== undefined) v1 = ops[0];
          if (v2 === undefined && ops[1] !== undefined) v2 = ops[1];
        }
      }

      // 3. Quét r.Parameters / r.parameters
      const rawParams = r.Parameters !== undefined ? r.Parameters : (r.parameters !== undefined ? r.parameters : (r.Args !== undefined ? r.Args : r.args));
      if (rawParams !== undefined && rawParams !== null) {
        let params = rawParams;
        if (typeof params === 'string') {
          try {
            params = JSON.parse(params);
          } catch (e) {
            const pObj = this._safeParseJsonOrObject(params);
            if (pObj) {
              params = pObj;
            } else {
              const parts = params.split(/[,;\\s~-]+/).map(s => s.trim()).filter(Boolean);
              if (parts.length >= 2) {
                if (v1 === undefined) v1 = parts[0];
                if (v2 === undefined) v2 = parts[1];
              } else if (parts.length === 1 && v1 === undefined) {
                v1 = parts[0];
              }
            }
          }
        }
        if (Array.isArray(params)) {
          if (v1 === undefined && params[0] !== undefined) v1 = params[0];
          if (v2 === undefined && params[1] !== undefined) v2 = params[1];
        } else if (params && typeof params === 'object') {
          if (v1 === undefined) v1 = getVal1(params);
          if (v2 === undefined) v2 = getVal2(params);
        }
      }

      // 4. Nếu vẫn thiếu toán hạng, quét chính r qua extractNumberRange
      if (v1 === undefined || v2 === undefined) {
        const rRange = this.extractNumberRange(r);
        if (rRange) {
          if (v1 === undefined) v1 = rRange.min;
          if (v2 === undefined) v2 = rRange.max;
        }
      }

      return { val1: v1, val2: v2 };
    };

    let fallbackIsNumber = false;

    for (const r of restrictionsList) {
      if (!r || typeof r !== 'object') continue;

      const rawOp = r.RestrictionOperator !== undefined ? r.RestrictionOperator : (
        r.operator !== undefined ? r.operator : (
          r.Operator !== undefined ? r.Operator : (
            r.restrictionOperator !== undefined ? r.restrictionOperator : (
              r.Rule !== undefined ? r.Rule : (
                r.rule !== undefined ? r.rule : (
                  r.op !== undefined ? r.op : ''
                )
              )
            )
          )
        )
      );
      const opStr = String(rawOp).toLowerCase().trim();

      const rawType = r.RestrictionType !== undefined ? r.RestrictionType : (
        r.restrictionType !== undefined ? r.restrictionType : (
          r.type !== undefined ? r.type : (
            r.Type !== undefined ? r.Type : ''
          )
        )
      );
      const typeStr = String(rawType).toLowerCase().trim();

      const { val1, val2 } = extractOperandsFromR(r);

      // 2.1 Email
      if (opStr.includes('email') || typeStr.includes('email')) {
        return {
          type: 'EMAIL',
          rule: 'EMAIL',
          placeholder: 'Vui lòng nhập email',
          error_message: 'Vui lòng nhập địa chỉ email hợp lệ'
        };
      }

      // 2.2 URL
      if (opStr.includes('url') || typeStr.includes('url')) {
        return {
          type: 'URL',
          rule: 'URL',
          placeholder: 'Vui lòng nhập URL hợp lệ',
          error_message: 'Vui lòng nhập đường dẫn URL hợp lệ'
        };
      }

      // 2.3 BETWEEN (Toán tử 7 hoặc chuỗi chứa 'between' và không phải 'notbetween')
      const isBetween = rawOp === 7 || rawOp === '7' || (opStr.includes('between') && !opStr.includes('not'));
      if (isBetween) {
        let n1 = parseFloat(val1);
        let n2 = parseFloat(val2);

        if (isNaN(n1) || isNaN(n2)) {
          const rangeFromScan = this.extractNumberRange(userFacingText);
          if (rangeFromScan) {
            n1 = rangeFromScan.min;
            n2 = rangeFromScan.max;
          }
        }

        if (!isNaN(n1) && !isNaN(n2)) {
          const actualMin = Math.min(n1, n2);
          const actualMax = Math.max(n1, n2);
          return {
            type: 'NUMBER',
            rule: 'BETWEEN',
            min: actualMin,
            max: actualMax,
            placeholder: \`Số phải nằm trong khoảng từ \${actualMin} ~ \${actualMax}\`,
            error_message: \`Số phải nằm trong khoảng từ \${actualMin} đến \${actualMax}\`
          };
        }
      }

      // 2.4 NOT BETWEEN (Toán tử 8 hoặc chuỗi chứa 'notbetween')
      const isNotBetween = rawOp === 8 || rawOp === '8' || opStr.includes('notbetween');
      if (isNotBetween) {
        let n1 = parseFloat(val1);
        let n2 = parseFloat(val2);
        if (isNaN(n1) || isNaN(n2)) {
          const rangeFromScan = this.extractNumberRange(userFacingText);
          if (rangeFromScan) {
            n1 = rangeFromScan.min;
            n2 = rangeFromScan.max;
          }
        }
        if (!isNaN(n1) && !isNaN(n2)) {
          const actualMin = Math.min(n1, n2);
          const actualMax = Math.max(n1, n2);
          return {
            type: 'NUMBER',
            rule: 'NOT_BETWEEN',
            min: actualMin,
            max: actualMax,
            placeholder: \`Không nằm trong khoảng từ \${actualMin} ~ \${actualMax}\`,
            error_message: \`Không nằm trong khoảng từ \${actualMin} đến \${actualMax}\`
          };
        }
      }

      // 2.5 GREATER THAN OR EQUAL (Toán tử 2)
      const isGte = rawOp === 2 || rawOp === '2' || opStr.includes('greaterthanorequal') || opStr.includes('>=') || opStr.includes('atleast');
      if (isGte) {
        const minVal = parseFloat(val1 !== undefined && val1 !== null ? val1 : val2) || 0;
        return {
          type: 'NUMBER',
          rule: 'GREATER_THAN_OR_EQUAL',
          min: minVal,
          placeholder: \`Lớn hơn hoặc bằng \${minVal}\`,
          error_message: \`Giá trị phải lớn hơn hoặc bằng \${minVal}\`
        };
      }

      // 2.6 GREATER THAN (Toán tử 1)
      const isGt = rawOp === 1 || rawOp === '1' || (opStr.includes('greaterthan') && !opStr.includes('equal')) || (opStr.includes('>') && !opStr.includes('='));
      if (isGt) {
        const minVal = parseFloat(val1 !== undefined && val1 !== null ? val1 : val2) || 0;
        return {
          type: 'NUMBER',
          rule: 'GREATER_THAN',
          min: minVal,
          placeholder: \`Lớn hơn \${minVal}\`,
          error_message: \`Giá trị phải lớn hơn \${minVal}\`
        };
      }

      // 2.7 LESS THAN OR EQUAL (Toán tử 4)
      const isLte = rawOp === 4 || rawOp === '4' || opStr.includes('lessthanorequal') || opStr.includes('<=') || opStr.includes('atmost');
      if (isLte) {
        const maxVal = parseFloat(val1 !== undefined && val1 !== null ? val1 : val2) || 0;
        return {
          type: 'NUMBER',
          rule: 'LESS_THAN_OR_EQUAL',
          max: maxVal,
          placeholder: \`Nhỏ hơn hoặc bằng \${maxVal}\`,
          error_message: \`Giá trị phải nhỏ hơn hoặc bằng \${maxVal}\`
        };
      }

      // 2.8 LESS THAN (Toán tử 3)
      const isLt = rawOp === 3 || rawOp === '3' || (opStr.includes('lessthan') && !opStr.includes('equal')) || (opStr.includes('<') && !opStr.includes('='));
      if (isLt) {
        const maxVal = parseFloat(val1 !== undefined && val1 !== null ? val1 : val2) || 0;
        return {
          type: 'NUMBER',
          rule: 'LESS_THAN',
          max: maxVal,
          placeholder: \`Nhỏ hơn \${maxVal}\`,
          error_message: \`Giá trị phải nhỏ hơn \${maxVal}\`
        };
      }

      // 2.9 EQUAL (Toán tử 5)
      const isEq = rawOp === 5 || rawOp === '5' || (opStr.includes('equal') && !opStr.includes('not') && !opStr.includes('than'));
      if (isEq) {
        const val = parseFloat(val1) || 0;
        return {
          type: 'NUMBER',
          rule: 'EQUAL',
          value: val,
          placeholder: \`Bằng \${val}\`,
          error_message: \`Giá trị phải bằng \${val}\`
        };
      }

      // 2.10 NOT EQUAL (Toán tử 6)
      const isNeq = rawOp === 6 || rawOp === '6' || opStr.includes('notequal');
      if (isNeq) {
        const val = parseFloat(val1) || 0;
        return {
          type: 'NUMBER',
          rule: 'NOT_EQUAL',
          value: val,
          placeholder: \`Không bằng \${val}\`,
          error_message: \`Giá trị không được bằng \${val}\`
        };
      }

      // 2.11 IS_NUMBER (Toán tử 9)
      const isNum = rawOp === 9 || rawOp === '9' || opStr.includes('isnumber') || opStr === 'number' || ((typeStr.includes('number') || typeStr === '1' || typeStr === 1) && !opStr);
      if (isNum) {
        // Chỉ khi trong placeholder hoặc userFacingText có dải số tường minh rõ ràng
        const rangeInContext = this.extractNumberRange(placeholder || subtitle || description);
        if (rangeInContext) {
          return {
            type: 'NUMBER',
            rule: 'BETWEEN',
            min: rangeInContext.min,
            max: rangeInContext.max,
            placeholder: \`Số phải nằm trong khoảng từ \${rangeInContext.min} ~ \${rangeInContext.max}\`,
            error_message: \`Số phải nằm trong khoảng từ \${rangeInContext.min} đến \${rangeInContext.max}\`
          };
        }
        fallbackIsNumber = true;
      }

      // 2.12 MAX_LENGTH / LENGTH
      if (opStr.includes('maxlength') || opStr.includes('length')) {
        const maxLen = parseInt(val1 !== undefined && val1 !== null ? val1 : val2, 10) || 500;
        return {
          type: 'LENGTH',
          rule: 'MAX_LENGTH',
          max: maxLen,
          placeholder: \`Tối đa \${maxLen} ký tự\`,
          error_message: \`Độ dài không được vượt quá \${maxLen} ký tự\`
        };
      }
    }

    // 3. Phân tích trực tiếp từ Placeholder (Đặc thù tự động của Microsoft Forms khi thiết lập Restrictions)
    if (placeholder && typeof placeholder === 'string') {
      const trimmedPlaceholder = placeholder.trim();

      // 3.1 Dải số Between từ Placeholder
      const rangeFromPh = this.extractNumberRange(trimmedPlaceholder);
      if (rangeFromPh) {
        return {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: rangeFromPh.min,
          max: rangeFromPh.max,
          placeholder: \`Số phải nằm trong khoảng từ \${rangeFromPh.min} ~ \${rangeFromPh.max}\`,
          error_message: \`Số phải nằm trong khoảng từ \${rangeFromPh.min} đến \${rangeFromPh.max}\`
        };
      }

      // 3.2 Is Number từ Placeholder
      if (/(?:giá\\s*trị\\s*phải\\s*là\\s*(?:một\\s*)?số|gia\\s*tri\\s*phai\\s*la\\s*(?:mot\\s*)?so|phải\\s*là\\s*(?:một\\s*)?số|phai\\s*la\\s*(?:mot\\s*)?so|value\\s*must\\s*be\\s*a\\s*number|must\\s*be\\s*a\\s*number|phải\\s*là\\s*số)/i.test(trimmedPlaceholder)) {
        return {
          type: 'NUMBER',
          rule: 'IS_NUMBER',
          placeholder: 'Giá trị phải là một số',
          error_message: 'Giá trị phải là một số'
        };
      }

      // 3.3 Lớn hơn hoặc bằng từ Placeholder
      const phGte = trimmedPlaceholder.match(/(?:lớn\\s*hơn\\s*hoặc\\s*bằng|greater\\s*than\\s*or\\s*equal\\s*to|at\\s*least|>=)\\s*([0-9.,]+)/i);
      if (phGte) {
        const minVal = parseFloat(phGte[1].replace(/,/g, '')) || 0;
        return {
          type: 'NUMBER',
          rule: 'GREATER_THAN_OR_EQUAL',
          min: minVal,
          placeholder: \`Lớn hơn hoặc bằng \${minVal}\`,
          error_message: \`Giá trị phải lớn hơn hoặc bằng \${minVal}\`
        };
      }

      // 3.4 Lớn hơn từ Placeholder
      const phGt = trimmedPlaceholder.match(/(?:lớn\\s*hơn|greater\\s*than|>)\\s*([0-9.,]+)/i);
      if (phGt) {
        const minVal = parseFloat(phGt[1].replace(/,/g, '')) || 0;
        return {
          type: 'NUMBER',
          rule: 'GREATER_THAN',
          min: minVal,
          placeholder: \`Lớn hơn \${minVal}\`,
          error_message: \`Giá trị phải lớn hơn \${minVal}\`
        };
      }

      // 3.5 Nhỏ hơn hoặc bằng từ Placeholder
      const phLte = trimmedPlaceholder.match(/(?:nhỏ\\s*hơn\\s*hoặc\\s*bằng|less\\s*than\\s*or\\s*equal\\s*to|at\\s*most|<=)\\s*([0-9.,]+)/i);
      if (phLte) {
        const maxVal = parseFloat(phLte[1].replace(/,/g, '')) || 100;
        return {
          type: 'NUMBER',
          rule: 'LESS_THAN_OR_EQUAL',
          max: maxVal,
          placeholder: \`Nhỏ hơn hoặc bằng \${maxVal}\`,
          error_message: \`Giá trị phải nhỏ hơn hoặc bằng \${maxVal}\`
        };
      }

      // 3.6 Nhỏ hơn từ Placeholder
      const phLt = trimmedPlaceholder.match(/(?:nhỏ\\s*hơn|less\\s*than|<)\\s*([0-9.,]+)/i);
      if (phLt) {
        const maxVal = parseFloat(phLt[1].replace(/,/g, '')) || 100;
        return {
          type: 'NUMBER',
          rule: 'LESS_THAN',
          max: maxVal,
          placeholder: \`Nhỏ hơn \${maxVal}\`,
          error_message: \`Giá trị phải nhỏ hơn \${maxVal}\`
        };
      }
    }

    // 4. Nếu có fallbackIsNumber từ structured metadata mà không có range cụ thể
    if (fallbackIsNumber) {
      return {
        type: 'NUMBER',
        rule: 'IS_NUMBER',
        placeholder: 'Giá trị phải là một số',
        error_message: 'Giá trị phải là một số'
      };
    }

    // 5. Heuristic Fallback cuối cùng: Phân tích văn bản hiển thị thuần túy (userFacingText)
    if (userFacingText) {
      const textRange = this.extractNumberRange(userFacingText);
      if (textRange) {
        return {
          type: 'NUMBER',
          rule: 'BETWEEN',
          min: textRange.min,
          max: textRange.max,
          placeholder: \`Số phải nằm trong khoảng từ \${textRange.min} ~ \${textRange.max}\`,
          error_message: \`Số phải nằm trong khoảng từ \${textRange.min} đến \${textRange.max}\`
        };
      }
    }
`;

const idxRuleStart = code.indexOf(oldRuleStart);
const idxRuleEnd = code.indexOf(oldRuleEnd);

if (idxRuleStart === -1 || idxRuleEnd === -1) {
  console.error('Không tìm thấy _extractValidationRule trong formParserService.js');
  process.exit(1);
}

code = code.substring(0, idxRuleStart) + newRuleCode + code.substring(idxRuleEnd);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Đã cập nhật formParserService.js thành công!');
