const assert = require('assert');
const formParserService = require('../server/services/formParserService');

console.log('--- TEST: RANGE SANITIZATION & HYPHEN PARSING ---');

const tests = [
  { input: '20000000 - 20270000', expected: { min: 20000000, max: 20270000 } },
  { input: '20000000 - 202700000', expected: { min: 20000000, max: 202700000 } },
  { input: 'Mã số sinh viên (20000000 - 20270000)', expected: { min: 20000000, max: 20270000 } },
  { input: 'Mã số sinh viên (20000000-20270000)', expected: { min: 20000000, max: 20270000 } },
  { input: '18 - 60', expected: { min: 18, max: 60 } },
  { input: '18-60', expected: { min: 18, max: 60 } },
  { input: '18 đến 60', expected: { min: 18, max: 60 } },
  { input: 'từ 18 đến 60', expected: { min: 18, max: 60 } },
  { input: '1 - 100', expected: { min: 1, max: 100 } },
  { input: 'createdAt: 2026-11-02T05:28:42Z', expected: null },
  { input: '2026-11-02', expected: null },
  { input: 'Ngày sinh: 15/08/2000', expected: null },
  { input: '0912-345-678', expected: null },
  { input: 'Lớp - Khóa', expected: null }
];

for (const t of tests) {
  const res = formParserService.extractNumberRange(t.input);
  if (t.expected === null) {
    assert.strictEqual(res, null, 'Phải trả về null cho chuỗi: ' + t.input);
  } else {
    assert.deepStrictEqual(res, t.expected, 'Sai kết quả cho chuỗi: ' + t.input);
  }
}

console.log('PASS: Toàn bộ 14 ca kiểm thử dải số và làm sạch ISO date / timestamp / số điện thoại đều thành công 100%!');
