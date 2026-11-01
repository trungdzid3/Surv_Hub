const fs = require('fs');
const assert = require('assert');

console.log('--- TEST: RESTRICTIONS & PLACEHOLDERS (MICROSOFT FORMS STANDARDS) ---');

const appJs = fs.readFileSync('public/app.js', 'utf8');

// 1. RestrictionEngine
const match = appJs.match(/window\.RestrictionEngine\s*=\s*\{([\s\S]*?)\n\};/);
assert(match, 'window.RestrictionEngine must match');
const engine = eval('({' + match[1] + '})');

const emailRes = engine.inferValidationFromTitle('Email HUST');
assert.strictEqual(emailRes.type, 'EMAIL');
assert.strictEqual(emailRes.placeholder, 'Vui lòng nhập email');

// MSSV không kèm dải số -> Phải là IS_NUMBER (không tự gán cứng dải số)
const mssvRes = engine.inferValidationFromTitle('Mã số sinh viên');
assert.strictEqual(mssvRes.type, 'NUMBER');
assert.strictEqual(mssvRes.rule, 'IS_NUMBER');
assert.strictEqual(mssvRes.placeholder, 'Giá trị phải là một số');

// Form quy định dải số cụ thể -> Mới là BETWEEN theo đúng số form quy định
const mssvRangeRes = engine.inferValidationFromTitle('Mã số sinh viên (20000000 ~ 20270000)');
assert.strictEqual(mssvRangeRes.type, 'NUMBER');
assert.strictEqual(mssvRangeRes.rule, 'BETWEEN');
assert.strictEqual(mssvRangeRes.min, 20000000);
assert.strictEqual(mssvRangeRes.max, 20270000);
assert.strictEqual(mssvRangeRes.placeholder, 'Số phải nằm trong khoảng từ 20000000 ~ 20270000');

// Form quy định độ tuổi 18 đến 60 -> Lấy đúng 18 và 60
const ageRangeRes = engine.inferValidationFromTitle('Độ tuổi từ 18 đến 60');
assert.strictEqual(ageRangeRes.type, 'NUMBER');
assert.strictEqual(ageRangeRes.rule, 'BETWEEN');
assert.strictEqual(ageRangeRes.min, 18);
assert.strictEqual(ageRangeRes.max, 60);
assert.strictEqual(ageRangeRes.placeholder, 'Số phải nằm trong khoảng từ 18 ~ 60');

const sdtRes = engine.inferValidationFromTitle('Số điện thoại');
assert.strictEqual(sdtRes.type, 'NUMBER');
assert.strictEqual(sdtRes.rule, 'IS_NUMBER');
assert.strictEqual(sdtRes.placeholder, 'Giá trị phải là một số');

const urlRes = engine.inferValidationFromTitle('Website trường');
assert.strictEqual(urlRes.type, 'URL');
assert.strictEqual(urlRes.placeholder, 'Vui lòng nhập URL hợp lệ');

const classRes = engine.inferValidationFromTitle('Lớp - Khóa');
assert.strictEqual(classRes, null);
console.log('PASS: RestrictionEngine.inferValidationFromTitle works for all patterns');

// 2. Placeholder checks in renderQuestionOptions
assert(!appJs.includes('<p class="text-[11px] text-stone-400 font-medium">${placeholder}</p>'), 'Redundant placeholder paragraph must be removed');
assert(appJs.includes('Chọn câu trả lời của bạn'), 'Dropdown default label must be "Chọn câu trả lời của bạn"');
assert(appJs.includes('Nhập câu trả lời của bạn'), 'Default text placeholder must be "Nhập câu trả lời của bạn"');
console.log('PASS: Placeholders and clean UI verified');

// 3. Studio preview and action bar
assert(appJs.includes('studio-preview-input-${qIdx}'), 'Studio preview input must exist');
assert(appJs.includes('restrictionBadgeHtml'), 'restrictionBadgeHtml must exist');
assert(appJs.includes('toggleStudioLongAnswer'), 'toggleStudioLongAnswer must exist');
console.log('PASS: Studio preview input, restriction badges and long answer toggle verified');

// 4. Test parseRawQuestionsText with Microsoft Forms copied layout
const parseMethodMatch = appJs.match(/parseRawQuestionsText\(text\)\s*\{([\s\S]*?)\n  \},/);
assert(parseMethodMatch, 'parseRawQuestionsText method must exist');
const parseRawQuestionsText = new Function('text', parseMethodMatch[1]);

const sampleSmartPaste = `
2. Email HUST *
Vui lòng nhập email

3. Mã số sinh viên *
Số phải nằm trong khoảng từ 20000000 ~ 20270000

4. Số điện thoại (thường xuyên liên lạc)
Giá trị phải là một số

5. Khoa/Viện/Trường đang theo học *
Chọn câu trả lời của bạn
- Viện CNTT
- Viện Cơ khí

6. Lớp - Khóa (theo eHUST) (VD: Thực phẩm 06 - K69) *
Nhập câu trả lời của bạn
`;

const parsedQs = parseRawQuestionsText(sampleSmartPaste);
assert.strictEqual(parsedQs.length, 5);

// Câu 2: Email
assert.strictEqual(parsedQs[0].content, 'Email HUST');
assert.strictEqual(parsedQs[0].type, 'SHORT_TEXT');
assert.strictEqual(parsedQs[0].validation?.type, 'EMAIL');
assert.strictEqual(parsedQs[0].placeholder, 'Vui lòng nhập email');

// Câu 3: MSSV - Số trong khoảng 20000000 đến 20270000 do form quy định
assert.strictEqual(parsedQs[1].content, 'Mã số sinh viên');
assert.strictEqual(parsedQs[1].type, 'SHORT_TEXT');
assert.strictEqual(parsedQs[1].validation?.type, 'NUMBER');
assert.strictEqual(parsedQs[1].validation?.rule, 'BETWEEN');
assert.strictEqual(parsedQs[1].validation?.min, 20000000);
assert.strictEqual(parsedQs[1].validation?.max, 20270000);
assert.strictEqual(parsedQs[1].placeholder, 'Số phải nằm trong khoảng từ 20000000 ~ 20270000');

// Câu 4: SĐT - Là số
assert.strictEqual(parsedQs[2].content, 'Số điện thoại (thường xuyên liên lạc)');
assert.strictEqual(parsedQs[2].type, 'SHORT_TEXT');
assert.strictEqual(parsedQs[2].validation?.type, 'NUMBER');
assert.strictEqual(parsedQs[2].validation?.rule, 'IS_NUMBER');
assert.strictEqual(parsedQs[2].placeholder, 'Giá trị phải là một số');

// Câu 5: Dropdown
assert.strictEqual(parsedQs[3].content, 'Khoa/Viện/Trường đang theo học');
assert.strictEqual(parsedQs[3].type, 'DROPDOWN');
assert.strictEqual(parsedQs[3].options.length, 2);

// Câu 6: Text thuần
assert.strictEqual(parsedQs[4].type, 'SHORT_TEXT');
assert.strictEqual(parsedQs[4].placeholder, 'Nhập câu trả lời của bạn');
console.log('PASS: parseRawQuestionsText correctly extracts form-defined restrictions and placeholders');

// 5. Test Backend formParserService with Microsoft Forms Parameters & Placeholder
const formParserService = require('../server/services/formParserService');

const msBetweenQ = formParserService._parseMicrosoftQuestion({
  title: 'Mã số sinh viên',
  type: 'Question.TextField',
  placeholder: 'Số phải nằm trong khoảng từ 20000000 ~ 20270000',
  questionInfo: JSON.stringify({
    Restrictions: [
      {
        RestrictionType: 1,
        RestrictionOperator: 7,
        Parameters: ['20000000', '20270000']
      }
    ]
  })
}, 3);

assert.strictEqual(msBetweenQ.validation?.type, 'NUMBER');
assert.strictEqual(msBetweenQ.validation?.rule, 'BETWEEN');
assert.strictEqual(msBetweenQ.validation?.min, 20000000);
assert.strictEqual(msBetweenQ.validation?.max, 20270000);
assert.strictEqual(msBetweenQ.placeholder, 'Số phải nằm trong khoảng từ 20000000 ~ 20270000');

const msIsNumQ = formParserService._parseMicrosoftQuestion({
  title: 'Số điện thoại (thường xuyên liên lạc)',
  type: 'Question.TextField',
  placeholder: 'Giá trị phải là một số',
  questionInfo: JSON.stringify({
    Restrictions: [
      {
        RestrictionType: 1,
        RestrictionOperator: 9
      }
    ]
  })
}, 4);

assert.strictEqual(msIsNumQ.validation?.type, 'NUMBER');
assert.strictEqual(msIsNumQ.validation?.rule, 'IS_NUMBER');
assert.strictEqual(msIsNumQ.placeholder, 'Giá trị phải là một số');
console.log('PASS: formParserService._parseMicrosoftQuestion correctly parses min/max and is_number');

console.log('ALL RESTRICTION & PLACEHOLDER TESTS PASSED 100%!');
