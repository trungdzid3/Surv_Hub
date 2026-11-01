const formParserService = require('../server/services/formParserService');
const assert = require('assert');

console.log('--- TEST: RANGE VARIANTS & FORMPARSERSERVICE EXTENSIONS ---');

// 1. Test extractNumberRange
const cases = [
  { input: '20000000 ~ 20270000', expected: { min: 20000000, max: 20270000 } },
  { input: '20270000 ~ 20000000', expected: { min: 20000000, max: 20270000 } },
  { input: '20000000 ~ 202700000', expected: { min: 20000000, max: 202700000 } },
  { input: 'Số phải nằm trong khoảng từ 20000000 ~ 202700000', expected: { min: 20000000, max: 202700000 } },
  { input: '18 đến 60', expected: { min: 18, max: 60 } },
  { input: 'từ 100 đến 500', expected: { min: 100, max: 500 } },
  { input: 'Số phải nằm trong khoảng từ 100 đến 500', expected: { min: 100, max: 500 } },
  { input: '["20000000", "20270000"]', expected: { min: 20000000, max: 20270000 } },
  { input: [20000000, 20270000], expected: { min: 20000000, max: 20270000 } },
  { input: '{"min": 10, "max": 99}', expected: { min: 10, max: 99 } },
  { input: '{"minValue": "5", "maxValue": "15"}', expected: { min: 5, max: 15 } },
  { input: '{"lowerBound": 1, "upperBound": 10}', expected: { min: 1, max: 10 } },
  { input: '{"restrictionValue1": 50, "restrictionValue2": 80}', expected: { min: 50, max: 80 } },
  { input: '{"operand1": "100", "operand2": "200"}', expected: { min: 100, max: 200 } },
  { input: '{"value1": "20000000", "value2": "202700000"}', expected: { min: 20000000, max: 202700000 } },
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
const text = '1. Tuổi\nSố phải nằm trong khoảng từ 18 đến 60\n2. SĐT\nGiá trị phải là một số\n3. Mã số sinh viên *\nSố phải nằm trong khoảng từ 20000000 ~ 202700000';
const parsed = formParserService.parseSmartText(text);
assert.strictEqual(parsed.questions[0].validation?.rule, 'BETWEEN');
assert.strictEqual(parsed.questions[0].validation?.min, 18);
assert.strictEqual(parsed.questions[0].validation?.max, 60);
assert.strictEqual(parsed.questions[1].validation?.rule, 'IS_NUMBER');
assert.strictEqual(parsed.questions[2].validation?.rule, 'BETWEEN');
assert.strictEqual(parsed.questions[2].validation?.min, 20000000);
assert.strictEqual(parsed.questions[2].validation?.max, 202700000);
assert.strictEqual(parsed.questions[2].placeholder, 'Số phải nằm trong khoảng từ 20000000 ~ 202700000');
console.log('PASS: parseSmartText with exact user range passed!');

// 4. Test Microsoft Forms nested questionInfo Validation.Restrictions
// 4a. Operand1 / Operand2
const msQuestionOperand = {
  type: 'Question.TextField',
  title: 'Mã số sinh viên',
  required: true,
  questionInfo: JSON.stringify({
    Validation: {
      Restrictions: [
        { Type: 1, Operator: 7, Operand1: '20000000', Operand2: '202700000' }
      ]
    }
  })
};
const parsedMsOperand = formParserService._parseMicrosoftQuestion(msQuestionOperand, 3);
assert.strictEqual(parsedMsOperand.validation?.rule, 'BETWEEN');
assert.strictEqual(parsedMsOperand.validation?.min, 20000000);
assert.strictEqual(parsedMsOperand.validation?.max, 202700000);
assert.strictEqual(parsedMsOperand.placeholder, 'Số phải nằm trong khoảng từ 20000000 ~ 202700000');

// 4b. Value1 / Value2
const msQuestionValue = {
  type: 'Question.TextField',
  title: 'Mã số sinh viên',
  required: true,
  questionInfo: JSON.stringify({
    Validation: {
      Restrictions: [
        { Type: 1, Operator: 7, Value1: '20000000', Value2: '202700000' }
      ]
    }
  })
};
const parsedMsValue = formParserService._parseMicrosoftQuestion(msQuestionValue, 3);
assert.strictEqual(parsedMsValue.validation?.rule, 'BETWEEN');
assert.strictEqual(parsedMsValue.validation?.min, 20000000);
assert.strictEqual(parsedMsValue.validation?.max, 202700000);
assert.strictEqual(parsedMsValue.placeholder, 'Số phải nằm trong khoảng từ 20000000 ~ 202700000');

// 4c. Min / Max
const msQuestionMinMax = {
  type: 'Question.TextField',
  title: 'Mã số sinh viên',
  required: true,
  questionInfo: JSON.stringify({
    Validation: {
      Restrictions: [
        { Type: 1, Operator: 7, Min: 20000000, Max: 202700000 }
      ]
    }
  })
};
const parsedMsMinMax = formParserService._parseMicrosoftQuestion(msQuestionMinMax, 3);
assert.strictEqual(parsedMsMinMax.validation?.rule, 'BETWEEN');
assert.strictEqual(parsedMsMinMax.validation?.min, 20000000);
assert.strictEqual(parsedMsMinMax.validation?.max, 202700000);
assert.strictEqual(parsedMsMinMax.placeholder, 'Số phải nằm trong khoảng từ 20000000 ~ 202700000');

console.log('PASS: Microsoft Forms nested Validation.Restrictions passed (Operand1/2, Value1/2, Min/Max)!');

// 5. Test strict prevention of improper IS_NUMBER coercion when range is present
const msRangeWithIsNumberOp = {
  type: 'Question.TextField',
  title: 'Mã số sinh viên',
  description: 'Số phải nằm trong khoảng từ 20000000 ~ 202700000',
  questionInfo: JSON.stringify({
    Validation: {
      Restrictions: [
        { Type: 1, Operator: 9 } // Operator 9 is IS_NUMBER, but context has range
      ]
    }
  })
};
const parsedRangeWithIsNum = formParserService._parseMicrosoftQuestion(msRangeWithIsNumberOp, 5);
assert.strictEqual(parsedRangeWithIsNum.validation?.rule, 'BETWEEN');
assert.strictEqual(parsedRangeWithIsNum.validation?.min, 20000000);
assert.strictEqual(parsedRangeWithIsNum.validation?.max, 202700000);
assert.notStrictEqual(parsedRangeWithIsNum.validation?.rule, 'IS_NUMBER');

// Khi không có dải số, vẫn giữ chuẩn IS_NUMBER
const msPureIsNumber = {
  type: 'Question.TextField',
  title: 'Số điện thoại liên lạc',
  questionInfo: JSON.stringify({
    Validation: {
      Restrictions: [
        { Type: 1, Operator: 9 }
      ]
    }
  })
};
const parsedPureIsNum = formParserService._parseMicrosoftQuestion(msPureIsNumber, 6);
assert.strictEqual(parsedPureIsNum.validation?.rule, 'IS_NUMBER');
assert.strictEqual(parsedPureIsNum.placeholder, 'Giá trị phải là một số');
console.log('PASS: Strict prevention of improper IS_NUMBER coercion verified!');

