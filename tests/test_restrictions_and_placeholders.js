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

console.log('ALL RESTRICTION & PLACEHOLDER TESTS PASSED 100%!');
