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


// 6. Test Google Forms structured operators must NEVER be overridden to BETWEEN
const gfGt = formParserService._extractValidationRule({
  title: 'Câu 1: Tuổi của bạn (18 đến 60 tuổi)',
  rawValidationArray: [[1, 1, ['18'], 'Tuổi phải lớn hơn 18']] // opType 1: Greater than 18
});
assert.strictEqual(gfGt.type, 'NUMBER');
assert.strictEqual(gfGt.rule, 'GREATER_THAN');
assert.strictEqual(gfGt.min, 18);
assert.notStrictEqual(gfGt.rule, 'BETWEEN');

const gfLt = formParserService._extractValidationRule({
  title: 'Số lượng xe (0 đến 10)',
  rawValidationArray: [[1, 3, ['5'], 'Tối đa 5 xe']] // opType 3: Less than 5
});
assert.strictEqual(gfLt.type, 'NUMBER');
assert.strictEqual(gfLt.rule, 'LESS_THAN');
assert.strictEqual(gfLt.max, 5);

const gfEq = formParserService._extractValidationRule({
  title: 'Điểm chuẩn (1 đến 100)',
  rawValidationArray: [[1, 5, ['100'], 'Bắt buộc 100']] // opType 5: Equal 100
});
assert.strictEqual(gfEq.type, 'NUMBER');
assert.strictEqual(gfEq.rule, 'EQUAL');
assert.strictEqual(gfEq.value, 100);

const gfInt = formParserService._extractValidationRule({
  title: 'Số con trong gia đình (1 - 5 con)',
  rawValidationArray: [[1, 10, [], 'Phải là số nguyên']] // opType 10: Whole number
});
assert.strictEqual(gfInt.type, 'NUMBER');
assert.strictEqual(gfInt.rule, 'INTEGER');
console.log('PASS: Google Forms structured operators correctly preserved without improper BETWEEN coercion!');

// 7. Test Microsoft Forms structured operators must NEVER be overridden to BETWEEN
const msGtQuestion = {
  type: 'Question.TextField',
  title: 'Câu 1: Bạn bao nhiêu tuổi? (18 đến 60)',
  questionInfo: JSON.stringify({
    Validation: {
      Restrictions: [
        { Type: 1, Operator: 1, Operand1: '18' } // Greater than 18
      ]
    }
  })
};
const parsedMsGt = formParserService._parseMicrosoftQuestion(msGtQuestion, 1);
assert.strictEqual(parsedMsGt.validation?.rule, 'GREATER_THAN');
assert.strictEqual(parsedMsGt.validation?.min, 18);
assert.notStrictEqual(parsedMsGt.validation?.rule, 'BETWEEN');

const msLtQuestion = {
  type: 'Question.TextField',
  title: 'Số lượng vé (1 đến 20)',
  questionInfo: JSON.stringify({
    Validation: {
      Restrictions: [
        { Type: 1, Operator: 3, Operand1: '5' } // Less than 5
      ]
    }
  })
};
const parsedMsLt = formParserService._parseMicrosoftQuestion(msLtQuestion, 2);
assert.strictEqual(parsedMsLt.validation?.rule, 'LESS_THAN');
assert.strictEqual(parsedMsLt.validation?.max, 5);

const msGteQuestion = {
  type: 'Question.TextField',
  title: 'Số năm kinh nghiệm',
  questionInfo: JSON.stringify({
    Validation: {
      Restrictions: [
        { Type: 1, Operator: 2, Operand1: '3' } // Greater than or equal 3
      ]
    }
  })
};
const parsedMsGte = formParserService._parseMicrosoftQuestion(msGteQuestion, 3);
assert.strictEqual(parsedMsGte.validation?.rule, 'GREATER_THAN_OR_EQUAL');
assert.strictEqual(parsedMsGte.validation?.min, 3);

console.log('PASS: Microsoft Forms structured operators correctly preserved without improper BETWEEN coercion!');

// 8. Test date strings in metadata must NEVER be recognized as number range
assert.strictEqual(formParserService.extractNumberRange('createdAt: 2026-11-02T05:28:42Z'), null);
assert.strictEqual(formParserService.extractNumberRange('Ngày sinh: 15/08/2000'), null);
assert.strictEqual(formParserService.extractNumberRange('Thời gian: 12:30:45'), null);
console.log('PASS: Date strings and timestamps sanitization verified!');

console.log('--- ALL EXTENDED TESTS PASSED (100% SUCCESS) ---');
