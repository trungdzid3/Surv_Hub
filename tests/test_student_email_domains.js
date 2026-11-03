/**
 * Kiem thu danh muc ten mien email sinh vien mo rong
 * (server/config/universityEmailDomains.json + universityDomainService + matchingService)
 */

const assert = require('assert');
const catalog = require('../server/config/universityEmailDomains.json');
const universityDomainService = require('../server/services/universityDomainService');
const matchingService = require('../server/services/matchingService');

let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log('  [PASS] ' + name);
  } catch (err) {
    failed += 1;
    console.error('  [FAIL] ' + name + ' :: ' + err.message);
  }
}

function run() {
  console.log('===============================================================');
  console.log('KIEM THU: DANH MUC TEN MIEN EMAIL SINH VIEN MO RONG');
  console.log('===============================================================');

  const entries = Array.isArray(catalog.domains) ? catalog.domains : [];

  check('Catalog co toi thieu 300 ten mien', () => {
    assert.ok(entries.length >= 300, 'Chi co ' + entries.length + ' ten mien');
  });

  check('Moi entry co domain hop le va khong trung lap', () => {
    const seen = new Set();
    for (const entry of entries) {
      assert.ok(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(entry.domain), 'Domain sai dinh dang: ' + entry.domain);
      assert.ok(!seen.has(entry.domain), 'Domain trung lap: ' + entry.domain);
      seen.add(entry.domain);
    }
  });

  check('Catalog khong chua dia chi email ca nhan', () => {
    const raw = JSON.stringify(catalog);
    const hits = raw.match(/[a-z0-9][a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
    assert.strictEqual(hits.length, 0, 'Phat hien ' + hits.length + ' chuoi giong email ca nhan');
  });

  check('Meta thong ke khop voi du lieu thuc te', () => {
    assert.strictEqual(catalog.meta.domains_total, entries.length);
    assert.strictEqual(catalog.meta.student_usable_total, entries.filter(e => e.student_usable).length);
  });

  check('Moi ten mien trong danh muc deu duoc chap nhan boi quy tac hien hanh', () => {
    const rejected = entries.filter(e => !matchingService.isStudentEmailValid('sinhvien@' + e.domain));
    assert.deepStrictEqual(rejected.map(e => e.domain), [], 'Ten mien bi tu choi: ' + rejected.map(e => e.domain).join(', '));
  });

  check('Service nap dung so luong domain va domain sinh vien', () => {
    const stats = universityDomainService.getStats();
    assert.strictEqual(stats.domains, entries.length);
    assert.strictEqual(stats.studentUsable, entries.filter(e => e.student_usable).length);
  });

  check('Chuan hoa ten mien: bo @, khoang trang, chu hoa', () => {
    assert.strictEqual(universityDomainService.normalizeDomain('  @Student.HIU.VN. '), 'student.hiu.vn');
    assert.strictEqual(universityDomainService.normalizeDomain(null), '');
  });

  check('Nhan dien ten mien con cua domain sinh vien', () => {
    assert.strictEqual(universityDomainService.isKnownStudentDomain('student.hiu.vn'), true);
    assert.strictEqual(universityDomainService.isKnownStudentDomain('mail.student.hiu.vn'), true);
    assert.strictEqual(universityDomainService.isKnownStudentDomain('hiu.vn'), false);
  });

  check('Email sinh vien tren ten mien mo rong duoc chap nhan', () => {
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@student.hiu.vn'), true);
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@vanlanguni.vn'), true);
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@hcmcons.vn'), true);
  });

  check('Danh muc danh dau ten mien goc la khong dung cho sinh vien', () => {
    assert.strictEqual(universityDomainService.isKnownStudentDomain('hiu.vn'), false);
    assert.strictEqual(universityDomainService.isKnownStudentDomain('vast.vn'), false);
  });

  check('Danh muc khong lam mat quyen chap nhan cua danh ba cu', () => {
    // hiu.vn / vast.vn da nam trong UNIVERSITIES truoc day, hanh vi phai giu nguyen
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@hiu.vn'), true);
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@vast.vn'), true);
  });

  check('Ten mien ngoai danh muc bi tu choi', () => {
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@gmail.com'), false);
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@example.com'), false);
  });

  check('Quy tac cu van giu nguyen: .edu.vn hop le, admin bi chan', () => {
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@vnu.edu.vn'), true);
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@truongmoi.edu.vn'), true);
    assert.strictEqual(matchingService.isStudentEmailValid('admin@vnu.edu.vn'), false);
  });

  check('Email sai cu phap bi tu choi', () => {
    assert.strictEqual(matchingService.isStudentEmailValid('a@b'), false);
    assert.strictEqual(matchingService.isStudentEmailValid('ab..cd@vnu.edu.vn'), false);
    assert.strictEqual(matchingService.isStudentEmailValid('.abc@vnu.edu.vn'), false);
    assert.strictEqual(matchingService.isStudentEmailValid(''), false);
    assert.strictEqual(matchingService.isStudentEmailValid(null), false);
  });

  check('Rang buoc university_code van hieu luc', () => {
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@sis.hust.edu.vn', 'HUST'), true);
    assert.strictEqual(matchingService.isStudentEmailValid('sinhvien@vnu.edu.vn', 'HUST'), false);
  });

  check('detectUniversityFromEmail uu tien danh ba cu (HUST)', () => {
    const uni = matchingService.detectUniversityFromEmail('sinhvien@sis.hust.edu.vn');
    assert.ok(uni, 'Khong nhan dien duoc HUST');
    assert.strictEqual(uni.code, 'HUST');
  });

  check('detectUniversityFromEmail fallback sang danh muc mo rong', () => {
    const haiQuan = matchingService.detectUniversityFromEmail('sinhvien@hocvienhaiquan.edu.vn');
    assert.ok(haiQuan, 'Khong nhan dien duoc Hoc vien Hai quan');
    assert.ok(/Hải quân/.test(haiQuan.name), 'Ten truong khong dung: ' + haiQuan.name);
    assert.strictEqual(haiQuan.source, 'CATALOG');

    const ngoQuyen = matchingService.detectUniversityFromEmail('sinhvien@sqcb.edu.vn');
    assert.ok(ngoQuyen, 'Khong nhan dien duoc Truong Si quan Cong binh');
    assert.ok(/Ngô Quyền/.test(ngoQuyen.name), 'Ten truong khong dung: ' + ngoQuyen.name);
  });

  check('detectUniversityFromEmail tra null voi ten mien la', () => {
    assert.strictEqual(matchingService.detectUniversityFromEmail('sinhvien@gmail.com'), null);
    assert.strictEqual(matchingService.detectUniversityFromEmail('khong-hop-le'), null);
  });

  check('UI ho so co du ham xu ly OTP sinh vien (chong hoi quy)', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '../public/js/modules/respondent.js'), 'utf8');
    const handlers = ['sendStudentEmailOtpAction', 'startStudentOtpCooldown', 'verifyStudentEmailOtpAction'];
    for (const name of handlers) {
      const defined = new RegExp('(?:async\\s+)?' + name + '\\s*\\(').test(source);
      assert.ok(defined, 'Thieu dinh nghia ham ' + name + ' trong respondent.js');
    }
    for (const name of ['sendStudentEmailOtpAction', 'verifyStudentEmailOtpAction']) {
      assert.ok(source.includes('VibeApp.' + name + '()'), 'Nut bam khong goi ' + name);
    }
  });

  if (failed > 0) {
    console.error('\nKET QUA: ' + failed + ' bai test THAT BAI');
    process.exit(1);
  }
  console.log('\nKET QUA: TOAN BO BAI TEST DANH MUC TEN MIEN EMAIL SINH VIEN PASS 100%');
  console.log('===============================================================');
  process.exit(0);
}

run();
