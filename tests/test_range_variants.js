const formParserService = require('../server/services/formParserService');
const assert = require('assert');

console.log('--- TEST: RANGE VARIANTS & FORMPARSERSERVICE EXTENSIONS ---');

// 1. Test extractNumberRange
const cases = [
  { input: '20000000 ~ 20270000', expected: { min: 20000000, max: 20270000 } },
  { input: '20270000 ~ 20000000', expected: { min: 20000000, max: 20270000 } },
  { input: '18 đến 60', expected: { min: 18, max: 60 } },
  { input: 'Số phải nằm trong khoảng từ 100 đến 500', expected: { min: 100, max: 500 } },
  { input: '["20000000", "20270000"]', expected: { min: 20000000, max: 20270000 } },
  { input: [20000000, 20270000], expected: { min: 20000000, max: 20270000 } },
  { input: '{"min": 10, "max": 99}', expected: { min: 10, max: 99 } },
  { input: '{"minValue": "5", "maxValue": "15"}', expected: { min: 5, max: 15 } },
  { input: '{"lowerBound": 1, "upperBound": 10}', expected: { min: 1, max: 10 } },
  { input: '{"restrictionValue1": 50, "restrictionValue2": 80}', expected: { min: 50, max: 80 } },
  { input: '{"operand1": "100", "operand2": "200"}', expected: { min: 100, max: 200 } },
  { input: '10 \u2013 20', expected: { min: 10, max: 20 } },
  { input: '10 \uFF5E 20', expected: { min: 10, max: 20 } },
  { input: 'Số điện thoại', expected: null },
  { input: 'Lớp - Khóa', expected: null }
];

for (const c of cases) {
  const res = formParserService.extractNumberRange(c.input);
  if (c.expected === null) {
    assert.strictEqual(res, null, 'Failed on: ' + JSON.stringify(c.input));
  } else {
    assert.deepStrictEqual(res, c.expected, 'Failed on: ' + JSON.stringify(c.input) + ', got: ' + JSON.stringify(res));
  }
}
console.log('PASS: All extractNumberRange test cases passed!');

// 2. Test Google Forms vType === 1 with earlyRange
const gfValidation = formParserService._extractValidationRule({
  title: 'Mã số sinh viên (20000000 ~ 20270000)',
  rawValidationArray: [[1, 9, [], '']] // IS_NUMBER in Google Form but earlyRange exists
});
assert.strictEqual(gfValidation.type, 'NUMBER');
assert.strictEqual(gfValidation.rule, 'BETWEEN');
assert.strictEqual(gfValidation.min, 20000000);
assert.strictEqual(gfValidation.max, 20270000);
console.log('PASS: Google Forms vType 1 with earlyRange returns BETWEEN!');

// 3. Test parseSmartText with range line
const text = '1. Tuổi\nSố phải nằm trong khoảng từ 18 đến 60\n2. SĐT\nGiá trị phải là một số';
const parsed = formParserService.parseSmartText(text);
assert.strictEqual(parsed.questions[0].validation?.rule, 'BETWEEN');
assert.strictEqual(parsed.questions[0].validation?.min, 18);
assert.strictEqual(parsed.questions[0].validation?.max, 60);
assert.strictEqual(parsed.questions[1].validation?.rule, 'IS_NUMBER');
console.log('PASS: parseSmartText with range and is_number passed!');
