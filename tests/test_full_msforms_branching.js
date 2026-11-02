const assert = require('assert');
const fps = require('../server/services/formParserService');

// Mẫu dữ liệu thực tế rút gọn từ biểu mẫu của người dùng
const sampleFormText = `Đơn tuyển Tình nguyện viên Mạng lưới Câu lạc bộ Sinh viên Nghiên cứu khoa học Gen 3.0 (Sao chép)
Mục 1
THÔNG TIN CƠ BẢN
1.Họ và tênBắt buộc trả lời. Văn bản một dòng.
Nhập câu trả lời của bạn
2.Email HUSTBắt buộc trả lời. Văn bản một dòng.
Vui lòng nhập email
3.Mã số sinh viênBắt buộc trả lời. Văn bản một dòng.
Số phải nằm trong khoảng từ 20000000 ~ 202700000
4.Số điện thoại (thường xuyên liên lạc)Văn bản một dòng.
Giá trị phải là một số
5.Khoa/Viện/Trường đang theo họcBắt buộc trả lời. Một lựa chọn.
Chọn câu trả lời của bạn
6.Lớp - Khóa (theo eHUST) (VD: Thực phẩm 06 - K69)Bắt buộc trả lời. Văn bản một dòng.
Nhập câu trả lời của bạn
Mục 2
Thông tin chung
7.Vì sao bạn mong muốn trở thành tình nguyện viên Mạng lưới CLB SVNCKH?Bắt buộc trả lời. Văn bản Nhiều Dòng.
Nhập câu trả lời của bạn
8.Mạng lưới yêu cầu tối thiểu 1 buổi trực sáng/chiều mỗi tuần?Bắt buộc trả lời. Một lựa chọn.
Có
Không
9.Bạn muốn trở thành thành viên tiểu ban nào (Nguyện vọng 1)?Bắt buộc trả lời. Một lựa chọn.
Truyền thông
Hợp tác - Đối ngoại
Sự kiện
Học thuật
Cơ sở vật chất
Mục 3
NGUYỆN VỌNG 2
10.Bạn muốn trở thành thành viên tiểu ban nào (Nguyện vọng 2)?Bắt buộc trả lời. Một lựa chọn.
Chỉ muốn tham gia tiểu ban ở NV1
Truyền thông
Hợp tác - Đối ngoại
Sự kiện
Học thuật
Cơ sở vật chất
Mục 4
Câu hỏi ứng tuyển - Tiểu ban Truyền thông (NV1)
11.Vì sao bạn cảm thấy bản thân là mảnh ghép phù hợp cho tiểu ban Truyền thông?Bắt buộc trả lời. Văn bản Nhiều Dòng.
Nhập câu trả lời của bạn
12.Bạn muốn tham gia hoạt động nào trong tiểu ban Truyền thông?Bắt buộc trả lời. Một lựa chọn.
Edit/Design
Media
Viết content
Mục 5
Câu hỏi ứng tuyển - Tiểu ban Truyền thông (NV2)
13.Vì sao bạn cảm thấy bản thân là mảnh ghép phù hợp cho tiểu ban Truyền thông?Bắt buộc trả lời. Văn bản Nhiều Dòng.
Nhập câu trả lời của bạn
Mục 6
Câu hỏi ứng tuyển - Tiểu ban Hợp tác - Đối ngoại (NV1)
14.Động lực ứng tuyển Đối ngoại NV1?Bắt buộc trả lời. Văn bản một dòng.
Mục 7
Câu hỏi ứng tuyển - Tiểu ban Hợp tác - Đối ngoại (NV2)
15.Động lực ứng tuyển Đối ngoại NV2?Bắt buộc trả lời. Văn bản một dòng.
Mục 8
Thông tin chung cuối cùng
16.Lời nhắn gửi tới Ban điều hành?Văn bản một dòng.`;

console.log('=== BẮT ĐẦU TEST PHÂN NHÁNH VÀ BÓC TÁCH KHOẢNG SỐ ===');

const parseResult = fps.parseSmartText(sampleFormText);
const questions = parseResult.questions;

// 1. Kiểm tra Câu 3: Mã số sinh viên
const qMssv = questions.find(q => q.content.includes('Mã số sinh viên'));
assert(qMssv, 'Không tìm thấy câu hỏi Mã số sinh viên');
console.log('[PASS 1] Tiêu đề sạch:', qMssv.content);
assert.strictEqual(qMssv.content, 'Mã số sinh viên', 'Tiêu đề câu hỏi chưa được làm sạch nhãn MS Forms');
assert.strictEqual(qMssv.is_required, 1, 'Câu hỏi bắt buộc trả lời');
assert(qMssv.validation, 'Thiếu cấu hình validation');
assert.strictEqual(qMssv.validation.type, 'NUMBER', 'Loại validation phải là NUMBER');
assert.strictEqual(qMssv.validation.rule, 'BETWEEN', 'Quy tắc validation phải là BETWEEN');
assert.strictEqual(qMssv.validation.min, 20000000, 'Min phải là 20000000');
assert.strictEqual(qMssv.validation.max, 202700000, 'Max phải là 202700000');
console.log('[PASS 2] Quét khoảng số BETWEEN:', qMssv.validation);

// 2. Kiểm tra Câu 9: Nguyện vọng 1
const qNV1 = questions.find(q => q.content.includes('Nguyện vọng 1'));
assert(qNV1, 'Không tìm thấy câu hỏi Nguyện vọng 1');
assert(qNV1.logic && qNV1.logic.enabled, 'Thiếu logic rẽ nhánh cho Nguyện vọng 1');
console.log('[PASS 3] Logic rẽ nhánh NV1:', qNV1.logic.options);

// Kiểm tra lựa chọn 'Truyền thông' ở NV1 phải trỏ tới Mục 4 (Truyền thông NV1)
const tgtNV1_TT = qNV1.logic.options['Truyền thông'];
assert(tgtNV1_TT, 'Thiếu target cho lựa chọn Truyền thông ở NV1');
const sec4 = questions.find(q => q.type === 'SECTION_HEADER' && q.content.includes('Mục 4'));
assert(tgtNV1_TT.target === sec4.id || tgtNV1_TT.target === sec4.order_index, 'Lựa chọn Truyền thông ở NV1 phải trỏ tới Mục 4');
console.log('[PASS 4] Lựa chọn Truyền thông NV1 trỏ chính xác Mục 4');

// 3. Kiểm tra Câu 10: Nguyện vọng 2
const qNV2 = questions.find(q => q.content.includes('Nguyện vọng 2'));
assert(qNV2, 'Không tìm thấy câu hỏi Nguyện vọng 2');
assert(qNV2.logic && qNV2.logic.enabled, 'Thiếu logic rẽ nhánh cho Nguyện vọng 2');
console.log('[PASS 5] Logic rẽ nhánh NV2:', qNV2.logic.options);

// Kiểm tra lựa chọn 'Truyền thông' ở NV2 phải trỏ tới Mục 5 (Truyền thông NV2), KHÔNG BỊ match nhầm Mục 4!
const tgtNV2_TT = qNV2.logic.options['Truyền thông'];
assert(tgtNV2_TT, 'Thiếu target cho lựa chọn Truyền thông ở NV2');
const sec5 = questions.find(q => q.type === 'SECTION_HEADER' && q.content.includes('Mục 5'));
assert(tgtNV2_TT.target === sec5.id || tgtNV2_TT.target === sec5.order_index, 'Lựa chọn Truyền thông ở NV2 phải trỏ tới Mục 5 (NV2), không được match nhầm Mục 4!');
console.log('[PASS 6] Lựa chọn Truyền thông NV2 trỏ chính xác Mục 5 (NV2), không bị lặp lại!');

// Kiểm tra lựa chọn 'Chỉ muốn tham gia tiểu ban ở NV1' phải trỏ tới Mục 8 (Mục cuối cùng)
const tgtNV2_Skip = qNV2.logic.options['Chỉ muốn tham gia tiểu ban ở NV1'];
assert(tgtNV2_Skip, 'Thiếu target cho lựa chọn Chỉ muốn tham gia tiểu ban ở NV1');
const secEnd = questions.find(q => q.type === 'SECTION_HEADER' && q.content.includes('Mục 8'));
assert(tgtNV2_Skip.target === secEnd.id || tgtNV2_Skip.target === secEnd.order_index, 'Chỉ muốn tham gia NV1 phải trỏ tới Mục chung cuối cùng!');
console.log('[PASS 7] Lựa chọn Chỉ muốn tham gia NV1 trỏ thẳng Mục cuối cùng');

// 4. Kiểm tra Điểm Hội Tụ tự động cho các Section Header
// Mục 4 (Truyền thông NV1) phải có default_action trỏ về Mục 3 (NV2)
const sec3 = questions.find(q => q.type === 'SECTION_HEADER' && q.content.includes('Mục 3'));
assert(sec4.logic && sec4.logic.default_action === 'GO_TO_PAGE', 'Mục 4 phải có logic default_action GO_TO_PAGE');
assert(sec4.logic.target === sec3.id || sec4.logic.target === `order:${sec3.order_index}`, 'Mục 4 sau khi điền xong phải tự động quay về Mục 3 (NV2)');
console.log('[PASS 8] Điểm hồi quy: Mục 4 (NV1) điền xong tự động quay về Mục 3 (NV2)');

// Mục 5 (Truyền thông NV2) phải có default_action trỏ về Mục 8 (Mục chung cuối)
assert(sec5.logic && sec5.logic.default_action === 'GO_TO_PAGE', 'Mục 5 phải có logic default_action GO_TO_PAGE');
assert(sec5.logic.target === secEnd.id || sec5.logic.target === `order:${secEnd.order_index}`, 'Mục 5 sau khi điền xong phải tự động chuyển đến Mục cuối cùng');
console.log('[PASS 9] Điểm hội tụ: Mục 5 (NV2) điền xong tự động hội tụ về Mục cuối cùng');

console.log('=== TOÀN BỘ 9 CHỐT CHẶN KIỂM THỬ ĐÃ PASS 100% ===');
