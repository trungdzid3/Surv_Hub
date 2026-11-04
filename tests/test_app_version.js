/**
 * Bộ kiểm thử Tầng 26: Android APK Release & In-App Update API Suite
 * Kiểm tra các endpoint phiên bản ứng dụng, chuyển hướng tải APK và hợp đồng dữ liệu
 */

const assert = require('node:assert');
const app = require('../server/app');
const config = require('../server/config');

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`     Chi tiết lỗi: ${err.message}`);
    throw err;
  }
}

async function runSuite() {
  console.log('===============================================================');
  console.log(' KIEM THU TANG 26: ANDROID APK RELEASE & IN-APP UPDATE API');
  console.log('===============================================================');

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    // 1. Kiểm tra cấu hình config.APP_RELEASE
    await runTest('Cấu hình APP_RELEASE có đầy đủ các trường bắt buộc', async () => {
      assert(config.APP_RELEASE, 'Thiếu config.APP_RELEASE');
      assert.strictEqual(typeof config.APP_RELEASE.VERSION, 'string');
      assert.strictEqual(typeof config.APP_RELEASE.VERSION_CODE, 'number');
      assert.strictEqual(typeof config.APP_RELEASE.APK_DOWNLOAD_URL, 'string');
      assert(config.APP_RELEASE.APK_DOWNLOAD_URL.startsWith('http'), 'APK_DOWNLOAD_URL phải là URL hợp lệ');
    });

    // 2. Kiểm tra GET /api/v1/app/version
    await runTest('GET /api/v1/app/version trả về JSON hợp lệ với status 200', async () => {
      const res = await fetch(`${baseUrl}/app/version`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert(body.data, 'Thiếu data object');
      assert.strictEqual(body.data.version, config.APP_RELEASE.VERSION);
      assert.strictEqual(body.data.versionCode, config.APP_RELEASE.VERSION_CODE);
      assert.strictEqual(body.data.apkDownloadUrl, config.APP_RELEASE.APK_DOWNLOAD_URL);
    });

    // 3. Kiểm tra alias GET /api/v1/app-version
    await runTest('GET /api/v1/app-version (alias) hoạt động tương thích', async () => {
      const res = await fetch(`${baseUrl}/app-version`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.version, config.APP_RELEASE.VERSION);
    });

    // 4. Kiểm tra GET /api/v1/app/download?json=1
    await runTest('GET /api/v1/app/download?json=1 trả về JSON link tải', async () => {
      const res = await fetch(`${baseUrl}/app/download?json=1`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      const actualUrl = body.data?.apkDownloadUrl || body.apkDownloadUrl;
      assert.strictEqual(actualUrl, config.APP_RELEASE.APK_DOWNLOAD_URL);
    });

    // 5. Kiểm tra GET /api/v1/app/download chuyển hướng 302
    await runTest('GET /api/v1/app/download chuyển hướng HTTP 302', async () => {
      const res = await fetch(`${baseUrl}/app/download`, { redirect: 'manual' });
      assert.strictEqual(res.status, 302);
      const location = res.headers.get('location');
      assert.strictEqual(location, config.APP_RELEASE.APK_DOWNLOAD_URL);
    });

    console.log(`\n Ket qua Tang 26: Hoan thanh ${passedTests}/${totalTests} bai kiem tra thanh cong.\n`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

if (require.main === module) {
  runSuite().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = { runSuite };
