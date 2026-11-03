/**
 * SurvHub - Noi dung van ban phap ly (SSOT)
 * Gom 03 van ban doc lap, hien thi trong cung mot modal co tab:
 *   1. Dieu khoan dich vu (terms)
 *   2. Chinh sach bao ve du lieu ca nhan (privacy)
 *   3. Quy che hoat dong (rules)
 *
 * Nguyen tac bien soan:
 * - Bao dam dung so lieu dang van hanh trong ma nguon (trust score, nguong rut, phi, escrow, bao hanh).
 * - Dan chieu dung van ban phap luat Viet Nam hien hanh.
 * - Khong su dung emoji/icon mau; chi dung the HTML va ten icon Lucide.
 * - Khong cong bo thong tin phap nhan/MST/so dien thoai vi san pham dang o giai doan thu nghiem.
 *
 * @namespace window.SURVHUB_POLICY_DOCS
 */
(function () {
  'use strict';

  window.SURVHUB_POLICY_DOCS = {
    meta: {
      version: '4.0.0',
      effectiveDate: '03/11/2026',
      lastUpdated: '03/11/2026',
      owner: 'SurvHub'
    },

    docs: [
      /* ==================================================================
       * VAN BAN 1: DIEU KHOAN DICH VU
       * ================================================================== */
      {
        id: 'terms',
        label: 'Điều khoản dịch vụ',
        shortLabel: 'Điều khoản',
        icon: 'file-text',
        title: 'Điều Khoản Dịch Vụ SurvHub',
        subtitle: 'Thỏa thuận ràng buộc giữa SurvHub và Người dùng (Đáp viên và Nhà tạo khảo sát)',
        sections: [
          {
            title: '1. Căn cứ pháp lý và phạm vi áp dụng',
            icon: 'scale',
            html: `
              <p>Điều khoản dịch vụ này (“Điều khoản”) là thỏa thuận pháp lý giữa bạn và SurvHub về việc sử dụng nền tảng khảo sát trực tuyến, ví điểm thưởng, ví Credit và các dịch vụ liên quan. Bằng việc đăng ký tài khoản, truy cập hoặc sử dụng bất kỳ chức năng nào của SurvHub, bạn xác nhận đã đọc, hiểu và đồng ý bị ràng buộc bởi Điều khoản này, Quy chế hoạt động và Chính sách bảo vệ dữ liệu cá nhân.</p>
              <p>Điều khoản được xây dựng phù hợp với các văn bản pháp luật Việt Nam hiện hành, bao gồm:</p>
              <ul>
                <li>Bộ luật Dân sự số 91/2015/QH13;</li>
                <li>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, có hiệu lực từ ngày 01/01/2026;</li>
                <li>Nghị định số 356/2025/NĐ-CP quy định chi tiết thi hành Luật Bảo vệ dữ liệu cá nhân, có hiệu lực từ ngày 01/01/2026 (thay thế Nghị định số 13/2023/NĐ-CP);</li>
                <li>Nghị định số 330/2026/NĐ-CP quy định xử phạt vi phạm hành chính về bảo vệ dữ liệu cá nhân;</li>
                <li>Luật Thương mại điện tử số 122/2025/QH15, có hiệu lực từ ngày 01/07/2026;</li>
                <li>Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15;</li>
                <li>Luật Giao dịch điện tử số 20/2023/QH15;</li>
                <li>Luật Kế toán số 88/2015/QH13 và các văn bản hướng dẫn;</li>
                <li>Nghị định số 52/2024/NĐ-CP về thanh toán không dùng tiền mặt và các văn bản pháp luật có liên quan khác.</li>
              </ul>
              <p>Thứ tự ưu tiên áp dụng khi có khác biệt: (i) quy định bắt buộc của pháp luật; (ii) Chính sách bảo vệ dữ liệu cá nhân đối với nội dung xử lý dữ liệu cá nhân; (iii) Điều khoản dịch vụ; (iv) Quy chế hoạt động; (v) các hướng dẫn, thông báo vận hành khác. Bản tiếng Việt là bản gốc có giá trị áp dụng.</p>
            `
          },
          {
            title: '2. Giải thích từ ngữ',
            icon: 'book-open',
            html: `
              <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr class="border-b border-stone-300 dark:border-stone-700">
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Thuật ngữ</th>
                      <th class="py-1.5 font-extrabold text-stone-900 dark:text-white">Nội dung</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">SurvHub / Nền tảng</td><td class="py-1.5">Hệ thống khảo sát trực tuyến do SurvHub vận hành, bao gồm website, ứng dụng di động và các dịch vụ kỹ thuật liên quan.</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Đáp viên</td><td class="py-1.5">Cá nhân sử dụng tài khoản để tham gia trả lời khảo sát và nhận điểm thưởng.</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Nhà tạo khảo sát / Creator</td><td class="py-1.5">Cá nhân, hộ kinh doanh hoặc doanh nghiệp sử dụng Credit để tạo, tài trợ và thu thập dữ liệu khảo sát.</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Point (Điểm)</td><td class="py-1.5">Đơn vị ghi nhận thù lao khảo sát của Đáp viên, quy ước 1 Point = 1 VNĐ khi đổi thưởng.</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Credit</td><td class="py-1.5">Đơn vị số dư nạp vào ví Nhà tạo khảo sát, quy ước 1 Credit = 1 VNĐ, chỉ dùng trong Nền tảng và không rút ra tiền mặt.</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Escrow (Ký quỹ)</td><td class="py-1.5">Khoản Credit được khóa tại thời điểm xuất bản khảo sát để bảo đảm khả năng chi trả thù lao cho Đáp viên.</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Trust Score (Điểm uy tín)</td><td class="py-1.5">Chỉ số từ 0 đến 100 phản ánh chất lượng, mức độ trung thực và lịch sử tham gia của Đáp viên.</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Screen-out</td><td class="py-1.5">Trường hợp Đáp viên không thuộc nhóm đối tượng mục tiêu của khảo sát và được kết thúc sớm, không nhận thù lao.</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Validated</td><td class="py-1.5">Bài làm đã vượt qua toàn bộ kiểm duyệt chất lượng và được ghi nhận hợp lệ để trả thưởng.</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Người chưa thành niên</td><td class="py-1.5">Người chưa đủ 18 tuổi theo quy định tại Điều 20 Bộ luật Dân sự số 91/2015/QH13.</td></tr>
                    <tr><td class="py-1.5 pr-3 font-bold">Ngày làm việc</td><td class="py-1.5">Ngày từ thứ Hai đến thứ Sáu, không bao gồm ngày lễ, Tết theo quy định của pháp luật Việt Nam.</td></tr>
                  </tbody>
                </table>
              </div>
            `
          },
          {
            title: '3. Giai đoạn thử nghiệm và bản chất dịch vụ',
            icon: 'flask-conical',
            html: `
              <p>SurvHub hiện đang trong giai đoạn thử nghiệm (demo), chưa thành lập pháp nhân và chưa hoàn tất thủ tục thông báo hoặc đăng ký nền tảng thương mại điện tử với Bộ Công Thương theo Luật Thương mại điện tử số 122/2025/QH15. Trong giai đoạn này:</p>
              <ul>
                <li>Point và Credit chỉ là đơn vị ghi nhận nội bộ, <strong>không phải phương tiện thanh toán</strong>, không phải tiền gửi, không phải công cụ tài chính và không được sử dụng để thanh toán cho bên thứ ba;</li>
                <li>Nền tảng có thể tạm dừng, điều chỉnh hoặc đặt lại dữ liệu thử nghiệm sau khi thông báo trước 07 ngày, trừ trường hợp cần thiết để bảo vệ người dùng hoặc tuân thủ pháp luật;</li>
                <li>SurvHub không huy động vốn, không nhận tiền gửi và không trả lãi cho bất kỳ khoản Point hoặc Credit nào;</li>
                <li>Khi chính thức đi vận hành, SurvHub sẽ công bố đầy đủ thông tin chủ sở hữu, mã số thuế, địa chỉ, số điện thoại và trạng thái thông báo/đăng ký với cơ quan quản lý theo quy định.</li>
              </ul>
            `
          },
          {
            title: '4. Điều kiện sử dụng và người chưa thành niên',
            icon: 'users',
            html: `
              <p>SurvHub cho phép cả người chưa thành niên sử dụng với các điều kiện bảo vệ chặt chẽ theo pháp luật Việt Nam:</p>
              <ul>
                <li><strong>Người từ đủ 18 tuổi trở lên:</strong> có đầy đủ năng lực hành vi dân sự, tự mình xác lập và thực hiện các giao dịch trên Nền tảng.</li>
                <li><strong>Người từ đủ 15 tuổi đến dưới 18 tuổi:</strong> được đăng ký và sử dụng khi có sự đồng ý của cha, mẹ hoặc người đại diện theo pháp luật. Mọi giao dịch đổi thưởng, rút tiền hoặc thay đổi thông tin thanh toán phải được người đại diện theo pháp luật xác nhận.</li>
                <li><strong>Người dưới 15 tuổi:</strong> không tự đăng ký tài khoản. Việc sử dụng chỉ được thực hiện thông qua tài khoản do cha, mẹ hoặc người đại diện theo pháp luật đăng ký, quản lý và trực tiếp thực hiện các giao dịch.</li>
              </ul>
              <p>Khi đăng ký, bạn tuyên bố rằng bạn đủ tuổi hoặc đã có sự đồng ý hợp pháp của người đại diện. SurvHub có quyền yêu cầu xác minh độ tuổi, xác minh sự đồng ý của người đại diện và tạm dừng tài khoản cho đến khi nhận được thông tin xác minh. Nếu phát hiện tài khoản của người chưa thành niên không có sự đồng ý của người đại diện, SurvHub sẽ khóa tài khoản, bảo lưu số dư hợp lệ và hướng dẫn người đại diện thực hiện quyền theo quy định.</p>
              <p>Nghiêm cấm lợi dụng người chưa thành niên, người mất năng lực hành vi dân sự hoặc người hạn chế năng lực hành vi dân sự để tạo tài khoản, trục lợi điểm thưởng hoặc thu thập dữ liệu trái phép.</p>
            `
          },
          {
            title: '5. Tài khoản người dùng',
            icon: 'user-check',
            html: `
              <ul>
                <li><strong>Một người một tài khoản:</strong> Mỗi cá nhân chỉ được sử dụng duy nhất 01 tài khoản gắn với 01 địa chỉ email và thông tin xác thực của chính mình. Nghiêm cấm tạo nhiều tài khoản trên cùng thiết bị, cùng số điện thoại hoặc cùng dấu vết thiết bị để trục lợi ưu đãi, lượt làm bài hoặc điểm thưởng.</li>
                <li><strong>Thông tin chính xác:</strong> Bạn cam kết cung cấp họ tên, email, số điện thoại và thông tin hồ sơ trung thực, cập nhật khi có thay đổi. SurvHub có quyền yêu cầu xác minh lại khi cần thiết.</li>
                <li><strong>Bảo mật tài khoản:</strong> Bạn có trách nhiệm bảo quản mật khẩu, mã OTP và không chia sẻ quyền truy cập cho người khác. Mọi hành vi phát sinh từ tài khoản của bạn được coi là do bạn thực hiện, trừ khi bạn đã thông báo kịp thời về việc bị chiếm đoạt.</li>
                <li><strong>Xác thực email:</strong> Tài khoản phải được xác thực bằng mã OTP gửi tới email đăng ký. Mã OTP có hiệu lực 10 phút và không được chia sẻ.</li>
                <li><strong>Quyền của SurvHub:</strong> Từ chối đăng ký, tạm khóa hoặc chấm dứt tài khoản khi phát hiện thông tin giả mạo, hành vi gian lận, vi phạm pháp luật hoặc gây ảnh hưởng đến người dùng khác.</li>
              </ul>
            `
          },
          {
            title: '6. Point, Credit và bản chất pháp lý của số dư',
            icon: 'wallet',
            html: `
              <ul>
                <li><strong>Tỷ giá minh bạch:</strong> 1 Point = 1 VNĐ khi đổi thưởng; 1 Credit = 1 VNĐ khi nạp vào ví Nhà tạo khảo sát. Nền tảng không sử dụng token ảo, không áp dụng tỷ giá ẩn và không thu phí chuyển đổi ngoài các khoản đã công bố.</li>
                <li><strong>Tính chất của Point:</strong> Point là quyền nhận thưởng có điều kiện, phát sinh từ bài làm hợp lệ. Point không phải tiền gửi, không sinh lãi, không được chuyển nhượng cho người khác và không được dùng để thanh toán bên ngoài Nền tảng.</li>
                <li><strong>Tính chất của Credit:</strong> Credit là số dư dịch vụ dùng để tạo khảo sát. Credit không rút được ra tiền mặt, không chuyển nhượng và không được hoàn lại sau khi đã sử dụng, trừ trường hợp pháp luật bắt buộc hoặc theo chính sách hoàn ký quỹ tại Mục 9.</li>
                <li><strong>Đổi Point sang Credit:</strong> Đáp viên có thể đổi tối thiểu 1.000 Point sang Credit và nhận thêm 5% giá trị Credit (ví dụ 1.000 Point nhận 1.050 Credit). Số Credit này chỉ dùng để tạo khảo sát.</li>
                <li><strong>Thay đổi tỷ giá:</strong> Mọi thay đổi tỷ giá hoặc đơn vị tính sẽ được thông báo trước ít nhất 07 ngày trên Nền tảng và không áp dụng hồi tố đối với số dư đã phát sinh.</li>
              </ul>
            `
          },
          {
            title: '7. Nghĩa vụ của Đáp viên và tiêu chuẩn trả lời',
            icon: 'clipboard-check',
            html: `
              <p>Đáp viên có nghĩa vụ trả lời trung thực, độc lập và dựa trên trải nghiệm thực tế của mình. Cụ thể:</p>
              <ul>
                <li>Đọc kỹ câu hỏi, trả lời đầy đủ các câu bắt buộc và không bỏ qua câu hỏi kiểm tra chất lượng;</li>
                <li>Không sử dụng bot, script, tiện ích mở rộng tự động, trí tuệ nhân tạo tạo câu trả lời thay hoặc các công cụ can thiệp vào quá trình làm bài;</li>
                <li>Không sao chép, mua bán, trao đổi đáp án hoặc chia sẻ liên kết khảo sát độc quyền cho người không có quyền tham gia;</li>
                <li>Không cung cấp thông tin sai lệch về độ tuổi, giới tính, khu vực, nghề nghiệp, thu nhập hoặc các tiêu chí sàng lọc;</li>
                <li>Không đăng tải, gửi hoặc lan truyền nội dung vi phạm pháp luật, xâm phạm quyền của người khác hoặc chứa mã độc;</li>
                <li>Không thu thập, lưu trữ hoặc sử dụng dữ liệu của Đáp viên khác ngoài phạm vi khảo sát.</li>
              </ul>
              <p><strong>Screen-out:</strong> Nếu bạn không thuộc nhóm đối tượng mục tiêu, bài làm sẽ kết thúc sớm và bạn không nhận Point cho khảo sát đó. Bạn không bị mất tiền, không bị phạt và Điểm uy tín được cộng 0,2 điểm cho mỗi lần screen-out hợp lệ.</p>
            `
          },
          {
            title: '8. Hệ thống chống gian lận và Điểm uy tín',
            icon: 'shield-alert',
            html: `
              <p>SurvHub áp dụng 05 chốt chặn kỹ thuật tự động nhằm bảo vệ chất lượng dữ liệu và quyền lợi của Đáp viên trung thực:</p>
              <ul>
                <li><strong>Chốt 1 - Bẫy tốc độ:</strong> Hệ thống tính thời gian chuẩn của bài khảo sát. Bài làm dưới 35% thời gian chuẩn bị đánh giá là gian lận và bị từ chối; từ 35% đến dưới 60% bị đánh dấu nghi vấn.</li>
                <li><strong>Chốt 2 - Bẫy chú ý:</strong> Câu hỏi kiểm tra được chèn ngẫu nhiên. Nếu trả lời sai lần đầu, hệ thống tạo cơ hội thứ hai; vượt qua cơ hội thứ hai vẫn được ghi nhận hợp lệ và không bị trừ điểm.</li>
                <li><strong>Chốt 3 - Phương sai đường thẳng:</strong> Hệ thống phát hiện việc chọn cùng một đáp án cho toàn bộ chuỗi câu hỏi thang đo hoặc ma trận (straight-lining).</li>
                <li><strong>Chốt 4 - Bộ lọc tự luận rác:</strong> Hệ thống loại bỏ chuỗi ký tự vô nghĩa, chuỗi lặp ký tự và nội dung không liên quan. Câu trả lời ngắn hợp lệ như “0”, “Không”, “Có”, “Chưa” vẫn được chấp nhận.</li>
                <li><strong>Chốt 5 - Điểm uy tín:</strong> Điểm uy tín khởi tạo là 100,0 điểm và được điều chỉnh theo từng bài làm.</li>
              </ul>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr class="border-b border-stone-300 dark:border-stone-700">
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Sự kiện</th>
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Thay đổi điểm</th>
                      <th class="py-1.5 font-extrabold text-stone-900 dark:text-white">Hệ quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Bài làm hợp lệ (VALIDATED)</td><td class="py-1.5 pr-3">+2,0</td><td class="py-1.5">Nhận 100% thù lao</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Screen-out hợp lệ</td><td class="py-1.5 pr-3">+0,2</td><td class="py-1.5">Không nhận thù lao, không bị phạt</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Nghi vấn / chờ kiểm duyệt thủ công</td><td class="py-1.5 pr-3">-5,0</td><td class="py-1.5">Bài làm bị giữ để xem xét</td></tr>
                    <tr><td class="py-1.5 pr-3">Từ chối / gian lận</td><td class="py-1.5 pr-3">-12,0</td><td class="py-1.5">Không nhận thù lao</td></tr>
                  </tbody>
                </table>
              </div>
              <p><strong>Mức chi trả theo Điểm uy tín:</strong></p>
              <ul>
                <li>Từ 80,0 đến 100: nhận 100% thù lao gốc;</li>
                <li>Từ 40,0 đến dưới 80,0: khấu trừ 1% cho mỗi điểm dưới 80, tối đa 40% (mức thấp nhất còn 60% thù lao);</li>
                <li>Dưới 60,0: tạm khóa quyền tạo lệnh rút thưởng cho đến khi Điểm uy tín đạt lại từ 60,0 trở lên;</li>
                <li>Dưới 40,0: không nhận thù lao cho bài làm vi phạm và tài khoản bị tự động khóa (BANNED) để bảo vệ Nền tảng.</li>
              </ul>
              <p><strong>Không tịch thu số dư hợp lệ:</strong> Việc khóa tài khoản không làm mất các Point đã được ghi nhận hợp lệ trước thời điểm vi phạm. SurvHub tạm giữ số dư để đối soát và sẽ hoàn trả cho người dùng nếu kết quả kiểm tra lại xác định không có vi phạm. Trường hợp số dư phát sinh trực tiếp từ hành vi gian lận, SurvHub có quyền thu hồi đúng phần phát sinh đó theo nguyên tắc tương xứng.</p>
              <p><strong>Quyền giải trình:</strong> Trong vòng 15 ngày kể từ khi nhận thông báo, bạn có quyền yêu cầu con người xem xét lại quyết định tự động. SurvHub phản hồi trong 03 ngày làm việc và ra quyết định cuối cùng trong 15 ngày.</p>
            `
          },
          {
            title: '9. Nghĩa vụ của Nhà tạo khảo sát, ký quỹ và hoàn tiền',
            icon: 'layers',
            html: `
              <ul>
                <li><strong>Nội dung hợp pháp:</strong> Nhà tạo khảo sát chịu trách nhiệm về tính hợp pháp, chính xác và không gây nhầm lẫn của nội dung khảo sát. Nghiêm cấm khảo sát vi phạm pháp luật, đồi trụy, cờ bạc, lừa đảo, xâm phạm quyền riêng tư hoặc yêu cầu cung cấp mật khẩu ngân hàng, mã OTP, số CCCD, thông tin thẻ và các dữ liệu nhạy cảm không cần thiết.</li>
                <li><strong>Ký quỹ Escrow:</strong> Khi xuất bản khảo sát, ngân sách được khóa trong quỹ Escrow. Hệ thống chỉ giải ngân thù lao cho các bài làm đã được thẩm định hợp lệ.</li>
                <li><strong>Hoàn tiền khi đóng khảo sát:</strong> Khi khảo sát kết thúc, đóng hoặc hủy, SurvHub hoàn lại <strong>toàn bộ số dư ký quỹ còn lại chưa giải ngân</strong> vào ví Credit của Nhà tạo khảo sát. Số tiền đã trả cho các bài làm hợp lệ không được hoàn lại. SurvHub không cam kết hoàn 100% tổng ngân sách ban đầu nếu đã có mẫu hợp lệ được thu thập.</li>
                <li><strong>Miễn phí thử nghiệm:</strong> Tài khoản mới được cấp 25 lượt tạo khảo sát miễn phí (tương đương 50.000 VNĐ). Lượt miễn phí chưa sử dụng được hoàn lại khi khảo sát chưa thu được mẫu nào.</li>
                <li><strong>Bảo hành dữ liệu:</strong> Gói Doanh nghiệp được bảo hành 1 đổi 1 trong 07 ngày kể từ khi hoàn thành hoặc đủ mẫu, với hạn mức tối đa 15% tổng số mẫu đã thu thập. Bảo hành chỉ áp dụng cho mẫu không đúng phân khúc mục tiêu hoặc không đạt tiêu chuẩn chất lượng đã công bố, không áp dụng cho việc thay đổi nhu cầu nghiên cứu hoặc đánh giá chủ quan.</li>
                <li><strong>Dữ liệu trả về:</strong> Nhà tạo khảo sát chỉ nhận dữ liệu cấp phản hồi (response-level) gồm mã phản hồi, câu trả lời, thời gian làm bài, điểm chất lượng và thù lao. Họ tên, giới tính, khu vực, trường, ngành, độ tuổi và thu nhập của Đáp viên không được xuất ra ngoài. Địa chỉ email chỉ được chia sẻ khi Nhà tạo khảo sát bật chế độ thu thập email và Đáp viên đã được thông báo trước khi làm bài.</li>
                <li><strong>Không tái định danh:</strong> Nhà tạo khảo sát không được dùng dữ liệu nhận được để tái định danh, liên hệ ngoài phạm vi khảo sát, bán lại hoặc chuyển giao cho bên thứ ba khi chưa có căn cứ pháp lý và sự đồng ý của Đáp viên.</li>
              </ul>
            `
          },
          {
            title: '10. Nạp Credit, đổi thưởng và các khoản phí',
            icon: 'banknote',
            html: `
              <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr class="border-b border-stone-300 dark:border-stone-700">
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Giao dịch</th>
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Mức tối thiểu</th>
                      <th class="py-1.5 font-extrabold text-stone-900 dark:text-white">Phí xử lý</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Nạp Credit bằng VietQR</td><td class="py-1.5 pr-3">20.000 VNĐ</td><td class="py-1.5">0 VNĐ</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Đổi thẻ cào điện thoại - lần đầu</td><td class="py-1.5 pr-3">10.000 VNĐ</td><td class="py-1.5">0 VNĐ</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Đổi thẻ cào điện thoại - từ lần thứ hai</td><td class="py-1.5 pr-3">20.000 VNĐ</td><td class="py-1.5">0 VNĐ</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Rút về ngân hàng hoặc ví MoMo</td><td class="py-1.5 pr-3">50.000 VNĐ</td><td class="py-1.5">2.000 VNĐ nếu dưới 100.000 VNĐ; 0 VNĐ từ 100.000 VNĐ</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Đổi Point sang Credit</td><td class="py-1.5 pr-3">1.000 Point</td><td class="py-1.5">0 VNĐ, nhận thêm 5% Credit</td></tr>
                    <tr><td class="py-1.5 pr-3">Nạp Credit tối đa mỗi giao dịch</td><td class="py-1.5 pr-3">-</td><td class="py-1.5">1.000.000.000 VNĐ</td></tr>
                  </tbody>
                </table>
              </div>
              <ul>
                <li><strong>Điều kiện rút thưởng:</strong> Điểm uy tín phải đạt tối thiểu 60,0; thông tin định danh và tài khoản nhận tiền phải trùng khớp với chủ tài khoản.</li>
                <li><strong>Thời gian xử lý:</strong> Lệnh đổi thưởng được kiểm duyệt và chuyển trong 24 đến 48 giờ làm việc. Chuyển khoản ngân hàng có thể mất thêm tối đa 03 ngày làm việc tùy ngân hàng nhận.</li>
                <li><strong>Giao dịch lỗi:</strong> Nếu chuyển thưởng thất bại do sai thông tin hoặc lỗi hệ thống, Point được hoàn vào ví trong 07 ngày làm việc và SurvHub thông báo lý do.</li>
                <li><strong>Thuế:</strong> Người dùng có trách nhiệm kê khai và nộp thuế thu nhập cá nhân (nếu có) theo quy định pháp luật. SurvHub thực hiện khấu trừ hoặc cung cấp chứng từ khi pháp luật yêu cầu.</li>
                <li><strong>Chống rửa tiền:</strong> SurvHub có quyền yêu cầu xác minh danh tính, từ chối hoặc tạm hoãn giao dịch có dấu hiệu bất thường theo quy định pháp luật.</li>
              </ul>
            `
          },
          {
            title: '11. Hành vi bị cấm và chế tài',
            icon: 'ban',
            html: `
              <p>Các hành vi sau bị nghiêm cấm đối với tất cả người dùng:</p>
              <ul>
                <li>Tạo nhiều tài khoản, mua bán tài khoản, cho thuê tài khoản hoặc giả mạo danh tính;</li>
                <li>Sử dụng bot, script, phần mềm tự động, công cụ gian lận hoặc can thiệp trái phép vào hệ thống;</li>
                <li>Dùng trí tuệ nhân tạo để tạo câu trả lời thay cho trải nghiệm thực tế của Đáp viên;</li>
                <li>Mua bán, trao đổi, công khai dữ liệu khảo sát hoặc đáp án độc quyền;</li>
                <li>Đăng tải nội dung vi phạm pháp luật, xúc phạm, quấy rối, phân biệt đối xử, đồi trụy, cờ bạc, lừa đảo hoặc xâm phạm quyền riêng tư;</li>
                <li>Thu thập mật khẩu, mã OTP, số CCCD, thông tin thẻ ngân hàng hoặc dữ liệu nhạy cảm không cần thiết;</li>
                <li>Mua bán, chia sẻ hoặc sử dụng dữ liệu cá nhân trái phép theo Điều 7 Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15;</li>
                <li>Cản trở, phá hoại, tấn công hoặc gây quá tải hệ thống.</li>
              </ul>
              <p><strong>Chế tài:</strong> Tùy mức độ, SurvHub áp dụng một hoặc nhiều biện pháp: cảnh cáo, yêu cầu chỉnh sửa, từ chối bài làm, trừ Điểm uy tín, tạm khóa tính năng, tạm khóa tài khoản, khóa vĩnh viễn, thu hồi số dư phát sinh từ vi phạm, gỡ nội dung và chuyển hồ sơ cho cơ quan có thẩm quyền. Chế tài được áp dụng theo nguyên tắc công khai, khách quan, tương xứng và có cơ chế giải trình.</p>
            `
          },
          {
            title: '12. Sở hữu trí tuệ',
            icon: 'copyright',
            html: `
              <ul>
                <li>SurvHub sở hữu toàn bộ quyền đối với tên thương mại, nhãn hiệu, logo, giao diện, mã nguồn, cơ sở dữ liệu và tài liệu hướng dẫn của Nền tảng.</li>
                <li>Đáp viên giữ quyền đối với nội dung câu trả lời do mình tạo ra và cấp cho SurvHub quyền sử dụng cần thiết để vận hành, kiểm duyệt, tổng hợp và cung cấp dữ liệu cho Nhà tạo khảo sát theo phạm vi đã thông báo.</li>
                <li>Nhà tạo khảo sát giữ quyền đối với nội dung khảo sát do mình tạo và cấp cho SurvHub quyền lưu trữ, hiển thị, kiểm duyệt và xử lý để cung cấp dịch vụ.</li>
                <li>Nghiêm cấm sao chép, sửa đổi, phân phối, bán lại hoặc khai thác thương mại bất kỳ phần nào của Nền tảng khi chưa có văn bản đồng ý của SurvHub.</li>
              </ul>
            `
          },
          {
            title: '13. Giới hạn trách nhiệm',
            icon: 'shield',
            html: `
              <ul>
                <li>SurvHub là nền tảng trung gian kết nối Đáp viên và Nhà tạo khảo sát. SurvHub không kiểm soát và không chịu trách nhiệm về tính chính xác, đầy đủ hoặc tính phù hợp của nội dung khảo sát do Nhà tạo khảo sát cung cấp.</li>
                <li>SurvHub không bảo đảm Nền tảng hoạt động liên tục, không có lỗi hoặc không bị gián đoạn. SurvHub nỗ lực khắc phục sự cố trong thời gian hợp lý và thông báo khi có ảnh hưởng đáng kể.</li>
                <li>SurvHub không chịu trách nhiệm đối với thiệt hại gián tiếp, mất lợi nhuận, mất cơ hội kinh doanh hoặc thiệt hại do sự kiện bất khả kháng, trừ trường hợp pháp luật có quy định khác.</li>
                <li>Trong mọi trường hợp, tổng trách nhiệm của SurvHub đối với một người dùng không vượt quá tổng số tiền mà người dùng đó đã thanh toán cho SurvHub trong 12 tháng liền trước hoặc giá trị số dư hợp lệ của người dùng, tùy mức nào cao hơn.</li>
                <li>Không nội dung nào trong Điều khoản này loại trừ hoặc hạn chế quyền của người tiêu dùng theo Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15, bao gồm quyền khiếu nại, khởi kiện và yêu cầu bồi thường thiệt hại.</li>
              </ul>
            `
          },
          {
            title: '14. Chấm dứt và xóa tài khoản',
            icon: 'log-out',
            html: `
              <ul>
                <li><strong>Người dùng chấm dứt:</strong> Bạn có thể yêu cầu xóa tài khoản qua kênh liên hệ tại Mục 17. SurvHub xác nhận và xử lý trong thời hạn quy định tại Chính sách bảo vệ dữ liệu cá nhân.</li>
                <li><strong>SurvHub chấm dứt:</strong> SurvHub có quyền tạm khóa hoặc chấm dứt tài khoản khi người dùng vi phạm Điều khoản, Quy chế hoạt động, pháp luật hoặc gây ảnh hưởng đến an toàn hệ thống.</li>
                <li><strong>Hệ quả:</strong> Khi tài khoản bị chấm dứt, quyền truy cập bị thu hồi; số dư hợp lệ được xử lý theo quy định tại Mục 8 và Mục 10; dữ liệu giao dịch, sổ cái và chứng từ được lưu theo thời hạn pháp luật yêu cầu.</li>
                <li><strong>Nghĩa vụ còn hiệu lực:</strong> Các điều khoản về sở hữu trí tuệ, bảo mật, giới hạn trách nhiệm, giải quyết tranh chấp và các nghĩa vụ đã phát sinh vẫn tiếp tục có hiệu lực sau khi chấm dứt.</li>
              </ul>
            `
          },
          {
            title: '15. Thay đổi Điều khoản',
            icon: 'refresh-cw',
            html: `
              <p>SurvHub có thể cập nhật Điều khoản để phù hợp với thay đổi pháp luật, tính năng hoặc mô hình vận hành. Phiên bản mới được công bố trên Nền tảng kèm số phiên bản và ngày hiệu lực. Thay đổi quan trọng ảnh hưởng đến quyền và nghĩa vụ của người dùng được thông báo trước ít nhất 07 ngày qua email hoặc thông báo trong ứng dụng. Việc tiếp tục sử dụng dịch vụ sau ngày hiệu lực đồng nghĩa bạn chấp nhận phiên bản mới. Nếu không đồng ý, bạn có quyền ngừng sử dụng và yêu cầu xóa tài khoản.</p>
            `
          },
          {
            title: '16. Luật áp dụng và giải quyết tranh chấp',
            icon: 'landmark',
            html: `
              <ul>
                <li>Điều khoản này được điều chỉnh bởi pháp luật Việt Nam.</li>
                <li>Khi phát sinh tranh chấp, các bên ưu tiên thương lượng trong 30 ngày kể từ ngày một bên gửi thông báo tranh chấp.</li>
                <li>Nếu không thương lượng được, tranh chấp được giải quyết tại Tòa án nhân dân có thẩm quyền theo quy định của Bộ luật Tố tụng dân sự. Người tiêu dùng có quyền khởi kiện tại Tòa án nơi mình cư trú hoặc nơi xảy ra tranh chấp theo quy định pháp luật.</li>
                <li>Trước khi khởi kiện, người dùng có thể gửi khiếu nại đến cơ quan quản lý nhà nước có thẩm quyền về bảo vệ dữ liệu cá nhân, thương mại điện tử hoặc bảo vệ người tiêu dùng.</li>
              </ul>
            `
          },
          {
            title: '17. Thông tin liên hệ',
            icon: 'mail',
            html: `
              <p>Trong giai đoạn thử nghiệm, SurvHub chưa có pháp nhân và chưa có tổng đài điện thoại. Mọi câu hỏi, yêu cầu hỗ trợ, khiếu nại hoặc yêu cầu liên quan đến dữ liệu cá nhân vui lòng gửi tới:</p>
              <ul>
                <li>Hỗ trợ Đáp viên: <a class="font-bold text-orange-600 dark:text-orange-400 hover:underline" href="mailto:linharmykxbnvn@gmail.com">linharmykxbnvn@gmail.com</a></li>
                <li>Phản ánh chất lượng và khiếu nại: <a class="font-bold text-orange-600 dark:text-orange-400 hover:underline" href="mailto:ngthtrung.son@gmail.com">ngthtrung.son@gmail.com</a></li>
                <li>Hợp tác doanh nghiệp: <a class="font-bold text-orange-600 dark:text-orange-400 hover:underline" href="mailto:linharmykxbnvn@gmail.com">linharmykxbnvn@gmail.com</a></li>
              </ul>
              <p>Thời gian phản hồi: trong 02 ngày làm việc kể từ khi nhận được yêu cầu hợp lệ.</p>
            `
          }
        ]
      },

      /* ==================================================================
       * VAN BAN 2: CHINH SACH BAO VE DU LIEU CA NHAN
       * ================================================================== */
      {
        id: 'privacy',
        label: 'Chính sách bảo mật',
        shortLabel: 'Bảo mật',
        icon: 'lock',
        title: 'Chính Sách Bảo Vệ Dữ Liệu Cá Nhân',
        subtitle: 'Công bố loại dữ liệu, mục đích, thời hạn lưu trữ, bên chia sẻ và quyền của chủ thể dữ liệu',
        sections: [
          {
            title: '1. Mở đầu và phạm vi áp dụng',
            icon: 'info',
            html: `
              <p>SurvHub tôn trọng và bảo vệ quyền riêng tư của người dùng. Chính sách này giải thích cách SurvHub thu thập, sử dụng, lưu trữ, chia sẻ và bảo vệ dữ liệu cá nhân khi bạn sử dụng website, ứng dụng di động và các dịch vụ liên quan.</p>
              <p>Chính sách áp dụng cho tất cả người dùng, bao gồm Đáp viên, Nhà tạo khảo sát, người truy cập diễn đàn và người gửi yêu cầu hỗ trợ. Chính sách không áp dụng cho dữ liệu do bên thứ ba xử lý theo chính sách riêng của họ.</p>
              <p>Bằng việc tích chọn đồng ý hoặc tiếp tục sử dụng dịch vụ, bạn xác nhận đã đọc và hiểu Chính sách này. Đối với người chưa thành niên, sự đồng ý phải được thực hiện theo Mục 8.</p>
            `
          },
          {
            title: '2. Căn cứ pháp lý',
            icon: 'scale',
            html: `
              <ul>
                <li>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, có hiệu lực từ ngày 01/01/2026;</li>
                <li>Nghị định số 356/2025/NĐ-CP quy định chi tiết một số điều và biện pháp thi hành Luật Bảo vệ dữ liệu cá nhân, có hiệu lực từ ngày 01/01/2026;</li>
                <li>Nghị định số 330/2026/NĐ-CP quy định xử phạt vi phạm hành chính về bảo vệ dữ liệu cá nhân;</li>
                <li>Luật Giao dịch điện tử số 20/2023/QH15;</li>
                <li>Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15;</li>
                <li>Bộ luật Dân sự số 91/2015/QH13 và các văn bản pháp luật có liên quan.</li>
              </ul>
              <p>SurvHub xác định mình là Bên kiểm soát dữ liệu cá nhân đối với dữ liệu do Nền tảng thu thập và quyết định mục đích, phương tiện xử lý. Trong giai đoạn thử nghiệm chưa thành lập pháp nhân, SurvHub chịu trách nhiệm với vai trò đơn vị vận hành nền tảng theo quy định pháp luật.</p>
            `
          },
          {
            title: '3. Dữ liệu cá nhân được thu thập',
            icon: 'database',
            html: `
              <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr class="border-b border-stone-300 dark:border-stone-700">
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Nhóm dữ liệu</th>
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Chi tiết</th>
                      <th class="py-1.5 font-extrabold text-stone-900 dark:text-white">Bắt buộc</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Định danh tài khoản</td><td class="py-1.5 pr-3">Họ tên, địa chỉ email, mật khẩu đã mã hóa, ảnh đại diện, mã Google (nếu liên kết), trạng thái xác thực email</td><td class="py-1.5">Có</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Liên hệ</td><td class="py-1.5 pr-3">Số điện thoại, email nhận thông báo, email người đại diện (nếu là người chưa thành niên)</td><td class="py-1.5">Tùy chức năng</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Nhân khẩu học</td><td class="py-1.5 pr-3">Ngày sinh, giới tính, khu vực, trường học, ngành học, nghề nghiệp, thu nhập hàng tháng, tình trạng hôn nhân (nếu khảo sát yêu cầu)</td><td class="py-1.5">Tùy khảo sát</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Tài chính và giao dịch</td><td class="py-1.5 pr-3">Số dư Point, số dư Credit, lịch sử nạp/rút/đổi thưởng, tên và số tài khoản ngân hàng hoặc ví điện tử khi yêu cầu rút, mã giao dịch, hóa đơn VAT</td><td class="py-1.5">Khi giao dịch</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Kỹ thuật và nhật ký</td><td class="py-1.5 pr-3">Địa chỉ IP, dấu vết thiết bị (device fingerprint), loại trình duyệt, hệ điều hành, thời gian đăng nhập, nhật ký thao tác, lịch sử làm bài, thời lượng làm bài, điểm chất lượng</td><td class="py-1.5">Có</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3 font-bold">Nội dung người dùng</td><td class="py-1.5 pr-3">Câu trả lời khảo sát, bài đăng và bình luận diễn đàn, báo lỗi, hình ảnh hoặc tệp tải lên</td><td class="py-1.5">Tùy chức năng</td></tr>
                    <tr><td class="py-1.5 pr-3 font-bold">Dữ liệu cá nhân nhạy cảm</td><td class="py-1.5 pr-3">Thông tin tài khoản ngân hàng, thông tin thẻ, dữ liệu theo dõi hành vi trực tuyến, quan điểm chính trị, tôn giáo, sức khỏe, đời sống riêng tư hoặc dữ liệu khác được pháp luật xác định là nhạy cảm nếu người dùng tự nguyện cung cấp trong khảo sát</td><td class="py-1.5">Chỉ khi cần và có đồng ý riêng</td></tr>
                  </tbody>
                </table>
              </div>
              <p><strong>Nguyên tắc tối thiểu:</strong> SurvHub chỉ thu thập dữ liệu cần thiết cho mục đích đã công bố, không thu thập dữ liệu nhạy cảm nếu không có sự đồng ý riêng và không yêu cầu người dùng cung cấp mật khẩu, mã OTP hoặc số CCCD đầy đủ trong khảo sát.</p>
            `
          },
          {
            title: '4. Mục đích và căn cứ xử lý',
            icon: 'target',
            html: `
              <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr class="border-b border-stone-300 dark:border-stone-700">
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Mục đích</th>
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Dữ liệu sử dụng</th>
                      <th class="py-1.5 font-extrabold text-stone-900 dark:text-white">Căn cứ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Tạo, xác thực và quản lý tài khoản</td><td class="py-1.5 pr-3">Định danh, liên hệ, nhật ký đăng nhập</td><td class="py-1.5">Thực hiện hợp đồng và sự đồng ý</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Ghép cặp khảo sát phù hợp với hồ sơ</td><td class="py-1.5 pr-3">Nhân khẩu học, lịch sử tham gia</td><td class="py-1.5">Sự đồng ý</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Trả thưởng, nạp Credit, đổi thưởng, xuất hóa đơn</td><td class="py-1.5 pr-3">Tài chính, giao dịch, định danh</td><td class="py-1.5">Thực hiện hợp đồng và nghĩa vụ pháp lý</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Chống gian lận, bảo vệ chất lượng dữ liệu</td><td class="py-1.5 pr-3">IP, dấu vết thiết bị, lịch sử làm bài, Điểm uy tín</td><td class="py-1.5">Sự đồng ý và lợi ích chính đáng theo pháp luật</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Kiểm duyệt nội dung diễn đàn</td><td class="py-1.5 pr-3">Tiêu đề, nội dung bài đăng, bình luận</td><td class="py-1.5">Sự đồng ý và nghĩa vụ pháp lý</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Hỗ trợ, khiếu nại, giải quyết tranh chấp</td><td class="py-1.5 pr-3">Định danh, nội dung yêu cầu, nhật ký giao dịch</td><td class="py-1.5">Thực hiện hợp đồng và nghĩa vụ pháp lý</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Thống kê nội bộ, cải thiện sản phẩm</td><td class="py-1.5 pr-3">Dữ liệu đã tổng hợp, loại bỏ thông tin định danh</td><td class="py-1.5">Sự đồng ý</td></tr>
                    <tr><td class="py-1.5 pr-3">Tuân thủ pháp luật, bảo vệ quyền lợi hợp pháp</td><td class="py-1.5 pr-3">Dữ liệu cần thiết theo yêu cầu cơ quan có thẩm quyền</td><td class="py-1.5">Nghĩa vụ pháp lý</td></tr>
                  </tbody>
                </table>
              </div>
              <p>SurvHub không sử dụng dữ liệu cá nhân để gửi quảng cáo của bên thứ ba, không bán dữ liệu và không dùng dữ liệu nhạy cảm cho mục đích tiếp thị.</p>
            `
          },
          {
            title: '5. Nguồn thu thập dữ liệu',
            icon: 'download',
            html: `
              <ul>
                <li><strong>Do bạn cung cấp trực tiếp:</strong> khi đăng ký, cập nhật hồ sơ, trả lời khảo sát, đăng bài diễn đàn, gửi báo lỗi hoặc yêu cầu hỗ trợ.</li>
                <li><strong>Thu thập tự động:</strong> địa chỉ IP, dấu vết thiết bị, nhật ký truy cập, thời gian làm bài và các chỉ số kỹ thuật phục vụ bảo mật, chống gian lận và vận hành.</li>
                <li><strong>Từ Google:</strong> khi bạn chọn đăng nhập bằng Google, SurvHub nhận họ tên, email, mã định danh Google và ảnh đại diện theo phạm vi bạn cấp quyền.</li>
                <li><strong>Từ đối tác thanh toán:</strong> trạng thái giao dịch, mã đơn hàng và thông tin cần thiết để đối soát nạp/rút tiền.</li>
                <li><strong>Từ Nhà tạo khảo sát:</strong> nội dung khảo sát và tiêu chí sàng lọc do họ thiết lập; SurvHub không nhận dữ liệu cá nhân của bạn từ nguồn này ngoài nội dung bạn tự trả lời.</li>
              </ul>
            `
          },
          {
            title: '6. Sự đồng ý và cách ghi nhận',
            icon: 'check-circle',
            html: `
              <ul>
                <li>Sự đồng ý phải tự nguyện, rõ ràng, cụ thể theo từng mục đích và được thể hiện bằng hành động tích chọn, không dùng ô tích sẵn, không gộp vào điều khoản dịch vụ và không dùng im lặng hoặc không phản hồi làm căn cứ đồng ý.</li>
                <li>Khi đăng ký, bạn được yêu cầu đồng ý riêng với: (i) Điều khoản dịch vụ và Quy chế hoạt động; (ii) Chính sách bảo vệ dữ liệu cá nhân và việc xử lý dữ liệu nhạy cảm (nếu có).</li>
                <li>SurvHub ghi nhận phiên bản văn bản, thời điểm đồng ý và phương thức đồng ý để có thể kiểm chứng khi cần. Bạn có quyền yêu cầu cung cấp thông tin về phạm vi đồng ý của mình.</li>
                <li>Bạn có quyền rút lại sự đồng ý bất kỳ lúc nào bằng văn bản hoặc hình thức điện tử qua kênh liên hệ tại Mục 20. Việc rút đồng ý không làm mất hiệu lực của việc xử lý đã thực hiện trước đó nhưng SurvHub sẽ dừng xử lý cho mục đích tương ứng, trừ khi pháp luật yêu cầu tiếp tục lưu trữ.</li>
                <li>Bạn có thể từ chối hoặc tắt thông báo đẩy, email tiếp thị mà vẫn sử dụng được các chức năng chính của Nền tảng.</li>
              </ul>
            `
          },
          {
            title: '7. Dữ liệu cá nhân của người chưa thành niên',
            icon: 'baby',
            html: `
              <p>SurvHub cho phép người chưa thành niên sử dụng với cơ chế bảo vệ tăng cường theo Điều 24 Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và pháp luật về trẻ em:</p>
              <ul>
                <li><strong>Nguyên tắc lợi ích tốt nhất:</strong> Mọi quyết định liên quan đến dữ liệu của người chưa thành niên phải ưu tiên lợi ích tốt nhất của người đó.</li>
                <li><strong>Sự đồng ý của người đại diện:</strong> Người từ đủ 15 tuổi đến dưới 18 tuổi cần sự đồng ý của cha, mẹ hoặc người đại diện theo pháp luật. Người dưới 15 tuổi chỉ sử dụng thông qua tài khoản do người đại diện theo pháp luật đăng ký và quản lý.</li>
                <li><strong>Công bố thông tin đời sống riêng tư:</strong> Đối với người từ đủ 07 tuổi, việc công bố hoặc tiết lộ thông tin về đời sống riêng tư cần sự đồng ý của cả người chưa thành niên và người đại diện theo pháp luật.</li>
                <li><strong>Giới hạn xử lý:</strong> Không sử dụng dữ liệu của người chưa thành niên cho quảng cáo hành vi, không bán, không chia sẻ cho bên thứ ba vì mục đích thương mại và không thu thập dữ liệu nhạy cảm ngoài phạm vi cần thiết.</li>
                <li><strong>Đổi thưởng:</strong> Giao dịch đổi thưởng của người chưa thành niên phải được người đại diện theo pháp luật xác nhận và thực hiện qua tài khoản thanh toán của người đại diện.</li>
                <li><strong>Ưu tiên xóa:</strong> Yêu cầu xóa dữ liệu của người chưa thành niên được ưu tiên xử lý trong thời hạn ngắn nhất theo quy định.</li>
              </ul>
              <p>Nếu bạn là cha, mẹ hoặc người đại diện và phát hiện người chưa thành niên đã cung cấp dữ liệu mà không có sự đồng ý của bạn, vui lòng liên hệ ngay để SurvHub tạm khóa và xóa dữ liệu theo yêu cầu.</p>
            `
          },
          {
            title: '8. Chia sẻ dữ liệu với bên thứ ba',
            icon: 'share-2',
            html: `
              <p>SurvHub chỉ chia sẻ dữ liệu ở mức tối thiểu cần thiết và yêu cầu bên nhận bảo mật, không sử dụng ngoài mục đích đã thông báo. Các bên thứ ba chính gồm:</p>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr class="border-b border-stone-300 dark:border-stone-700">
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Bên nhận</th>
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Mục đích</th>
                      <th class="py-1.5 font-extrabold text-stone-900 dark:text-white">Dữ liệu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Brevo</td><td class="py-1.5 pr-3">Gửi email xác thực OTP và thông báo hệ thống</td><td class="py-1.5">Email, họ tên, nội dung thông báo</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Google Gemini API</td><td class="py-1.5 pr-3">Kiểm duyệt nội dung diễn đàn</td><td class="py-1.5">Tiêu đề và nội dung bài đăng, bình luận</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Oracle Cloud</td><td class="py-1.5 pr-3">Lưu trữ máy chủ và cơ sở dữ liệu</td><td class="py-1.5">Toàn bộ dữ liệu vận hành</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Cloudflare</td><td class="py-1.5 pr-3">CDN, bảo mật và đường truyền</td><td class="py-1.5">Địa chỉ IP, dữ liệu kỹ thuật</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Google Sheets</td><td class="py-1.5 pr-3">Đồng bộ kết quả khảo sát khi Nhà tạo khảo sát bật webhook</td><td class="py-1.5">Dữ liệu cấp phản hồi đã loại bỏ hồ sơ cá nhân</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Đối tác thanh toán</td><td class="py-1.5 pr-3">Nạp Credit, chuyển thưởng, phát hành thẻ cào</td><td class="py-1.5">Thông tin giao dịch và tài khoản nhận tiền</td></tr>
                    <tr><td class="py-1.5 pr-3">Cơ quan nhà nước có thẩm quyền</td><td class="py-1.5 pr-3">Tuân thủ yêu cầu hợp pháp</td><td class="py-1.5">Dữ liệu theo đúng phạm vi yêu cầu</td></tr>
                  </tbody>
                </table>
              </div>
              <p>SurvHub không bán, cho thuê hoặc trao đổi dữ liệu cá nhân vì mục đích thương mại. Trường hợp chia sẻ cho Nhà tạo khảo sát, dữ liệu chỉ ở cấp phản hồi và email chỉ được chia sẻ khi khảo sát bật chế độ thu thập email và Đáp viên đã được thông báo trước khi làm bài.</p>
            `
          },
          {
            title: '9. Chuyển dữ liệu xuyên biên giới',
            icon: 'globe',
            html: `
              <p>Một số nhà cung cấp dịch vụ của SurvHub có hệ thống đặt ngoài lãnh thổ Việt Nam (Oracle Cloud, Cloudflare, Brevo, Google Gemini). Theo Điều 20 Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, việc chuyển dữ liệu ra nước ngoài hoặc sử dụng nền tảng nước ngoài để xử lý dữ liệu được xem là chuyển dữ liệu xuyên biên giới.</p>
              <ul>
                <li>SurvHub xác định phạm vi, mục đích và loại dữ liệu chuyển giao; chỉ chuyển dữ liệu cần thiết cho việc vận hành, gửi email, kiểm duyệt nội dung và lưu trữ.</li>
                <li>SurvHub áp dụng biện pháp bảo vệ theo Điều 20 Luật số 91/2025/QH15, ký kết hoặc áp dụng điều khoản ràng buộc với bên nhận và yêu cầu bên nhận bảo mật dữ liệu.</li>
                <li>Trường hợp thuộc diện phải lập hồ sơ đánh giá tác động chuyển dữ liệu xuyên biên giới, SurvHub lập hồ sơ theo Mẫu 09 ban hành kèm Nghị định số 356/2025/NĐ-CP và gửi cơ quan chuyên trách trong thời hạn 60 ngày kể từ lần chuyển đầu tiên.</li>
                <li>SurvHub theo dõi các trường hợp được miễn trừ theo Điều 20 khoản 6 Luật số 91/2025/QH15 và Điều 39 Luật số 91/2025/QH15 (hộ kinh doanh, doanh nghiệp siêu nhỏ, doanh nghiệp nhỏ và khởi nghiệp sáng tạo trong thời hạn luật định).</li>
                <li>Bạn có quyền yêu cầu cung cấp thông tin về biện pháp bảo vệ áp dụng cho việc chuyển dữ liệu xuyên biên giới.</li>
              </ul>
            `
          },
          {
            title: '10. Thời hạn lưu trữ dữ liệu',
            icon: 'clock',
            html: `
              <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr class="border-b border-stone-300 dark:border-stone-700">
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Loại dữ liệu</th>
                      <th class="py-1.5 font-extrabold text-stone-900 dark:text-white">Thời hạn lưu trữ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Thông tin tài khoản và hồ sơ</td><td class="py-1.5">Trong thời gian tài khoản hoạt động và 24 tháng sau khi tài khoản bị đóng hoặc xóa, trừ khi pháp luật yêu cầu lâu hơn</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Câu trả lời khảo sát và dữ liệu cấp phản hồi</td><td class="py-1.5">24 tháng kể từ ngày nộp bài hoặc theo thỏa thuận với Nhà tạo khảo sát, tối đa không quá 36 tháng</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Nhật ký giao dịch, sổ cái, chứng từ kế toán</td><td class="py-1.5">10 năm theo Luật Kế toán số 88/2015/QH13 và quy định pháp luật về kế toán, thuế</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Nhật ký kỹ thuật, IP, dấu vết thiết bị</td><td class="py-1.5">12 tháng kể từ ngày ghi nhận, trừ trường hợp đang điều tra vi phạm</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Mã OTP</td><td class="py-1.5">10 phút kể từ khi phát hành hoặc đến khi sử dụng thành công</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Nhật ký đồng ý</td><td class="py-1.5">Trong thời gian tài khoản hoạt động và 05 năm sau khi rút đồng ý để chứng minh tính tuân thủ</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Nội dung diễn đàn, báo lỗi</td><td class="py-1.5">Đến khi người dùng xóa hoặc yêu cầu xóa, trừ khi cần lưu để giải quyết tranh chấp</td></tr>
                    <tr><td class="py-1.5 pr-3">Dữ liệu ẩn danh, tổng hợp</td><td class="py-1.5">Không giới hạn thời hạn vì không còn khả năng định danh cá nhân</td></tr>
                  </tbody>
                </table>
              </div>
              <p>Hết thời hạn lưu trữ, SurvHub xóa hoặc ẩn danh hóa dữ liệu bằng biện pháp không thể khôi phục, trừ trường hợp pháp luật yêu cầu tiếp tục lưu giữ.</p>
            `
          },
          {
            title: '11. Quyền của chủ thể dữ liệu và thời hạn xử lý',
            icon: 'user-cog',
            html: `
              <p>Theo Điều 4 Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, bạn có các quyền sau:</p>
              <ul>
                <li><strong>Quyền được biết:</strong> biết về hoạt động xử lý dữ liệu cá nhân của mình.</li>
                <li><strong>Quyền đồng ý và rút lại sự đồng ý:</strong> đồng ý hoặc rút lại sự đồng ý bất kỳ lúc nào.</li>
                <li><strong>Quyền xem và yêu cầu cung cấp dữ liệu:</strong> xem, yêu cầu cung cấp bản sao dữ liệu cá nhân.</li>
                <li><strong>Quyền chỉnh sửa:</strong> yêu cầu sửa dữ liệu không chính xác hoặc không đầy đủ.</li>
                <li><strong>Quyền xóa dữ liệu:</strong> yêu cầu xóa dữ liệu khi không còn cần thiết hoặc việc xử lý không còn căn cứ pháp lý.</li>
                <li><strong>Quyền hạn chế xử lý:</strong> yêu cầu hạn chế xử lý trong các trường hợp pháp luật quy định.</li>
                <li><strong>Quyền phản đối xử lý:</strong> phản đối việc xử lý dữ liệu vì mục đích cụ thể.</li>
                <li><strong>Quyền khiếu nại, tố cáo, khởi kiện:</strong> khiếu nại, tố cáo hành vi vi phạm và khởi kiện theo quy định.</li>
                <li><strong>Quyền yêu cầu bồi thường thiệt hại:</strong> yêu cầu bồi thường khi quyền và lợi ích hợp pháp bị xâm phạm.</li>
                <li><strong>Quyền tự bảo vệ:</strong> áp dụng các biện pháp theo quy định pháp luật để bảo vệ quyền của mình.</li>
              </ul>
              <p><strong>Thời hạn phản hồi theo Điều 5 Nghị định số 356/2025/NĐ-CP:</strong></p>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr class="border-b border-stone-300 dark:border-stone-700">
                      <th class="py-1.5 pr-3 font-extrabold text-stone-900 dark:text-white">Yêu cầu</th>
                      <th class="py-1.5 font-extrabold text-stone-900 dark:text-white">Thời hạn tối đa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Xác nhận đã nhận yêu cầu</td><td class="py-1.5">02 ngày làm việc</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Xem, chỉnh sửa, cung cấp dữ liệu</td><td class="py-1.5">10 ngày</td></tr>
                    <tr class="border-b border-stone-200 dark:border-stone-800"><td class="py-1.5 pr-3">Rút đồng ý, hạn chế xử lý, phản đối xử lý</td><td class="py-1.5">15 ngày</td></tr>
                    <tr><td class="py-1.5 pr-3">Xóa dữ liệu</td><td class="py-1.5">20 ngày</td></tr>
                  </tbody>
                </table>
              </div>
              <p>Thời hạn trên có thể kéo dài trong trường hợp phức tạp hoặc cần xác minh danh tính, nhưng SurvHub sẽ thông báo lý do và thời hạn dự kiến. SurvHub có thể từ chối yêu cầu trái pháp luật, xâm phạm quyền của người khác hoặc ảnh hưởng đến điều tra của cơ quan có thẩm quyền, và sẽ nêu rõ căn cứ.</p>
            `
          },
          {
            title: '12. Cách thực hiện quyền',
            icon: 'send',
            html: `
              <p>Bạn gửi yêu cầu tới một trong các kênh sau:</p>
              <ul>
                <li>Email bảo vệ dữ liệu: <a class="font-bold text-orange-600 dark:text-orange-400 hover:underline" href="mailto:ngthtrung.son@gmail.com">ngthtrung.son@gmail.com</a></li>
                <li>Email hỗ trợ: <a class="font-bold text-orange-600 dark:text-orange-400 hover:underline" href="mailto:linharmykxbnvn@gmail.com">linharmykxbnvn@gmail.com</a></li>
              </ul>
              <p>Yêu cầu cần nêu rõ: họ tên, email đăng ký, quyền muốn thực hiện, phạm vi dữ liệu và thông tin cần thiết để xác minh danh tính. Đối với người chưa thành niên, yêu cầu phải có xác nhận của người đại diện theo pháp luật. SurvHub không thu phí xử lý yêu cầu hợp lệ lần đầu; có thể thu phí hợp lý cho các yêu cầu lặp lại quá mức theo quy định pháp luật.</p>
            `
          },
          {
            title: '13. Cookie, lưu trữ cục bộ và thông báo đẩy',
            icon: 'cookie',
            html: `
              <ul>
                <li><strong>Lưu trữ cục bộ thiết yếu:</strong> SurvHub dùng localStorage để lưu token đăng nhập, thông tin người dùng đã mã hóa và tùy chọn giao diện. Các dữ liệu này cần thiết để duy trì phiên đăng nhập và không dùng cho quảng cáo.</li>
                <li><strong>Cookie của bên thứ ba:</strong> Nền tảng có thể tải thư viện giao diện và biểu tượng từ CDN bên ngoài; các nhà cung cấp này có thể ghi nhận địa chỉ IP và thông tin kỹ thuật theo chính sách của họ.</li>
                <li><strong>Không quảng cáo hành vi:</strong> SurvHub không triển khai pixel quảng cáo, không bán dữ liệu hành vi và không dùng dữ liệu theo dõi để cá nhân hóa quảng cáo bên thứ ba. Nếu trong tương lai triển khai cookie không thiết yếu, SurvHub sẽ xin đồng ý trước khi nạp và cho phép từ chối mà không mất chức năng chính.</li>
                <li><strong>Thông báo đẩy:</strong> SurvHub chỉ gửi thông báo đẩy sau khi bạn cấp quyền trên trình duyệt hoặc thiết bị. Bạn có thể thu hồi quyền này bất kỳ lúc nào trong cài đặt thiết bị.</li>
                <li><strong>Email:</strong> Email xác thực OTP là bắt buộc để bảo mật tài khoản. Email tiếp thị hoặc nhắc nhở chỉ được gửi khi bạn đồng ý và có thể hủy đăng ký bất kỳ lúc nào.</li>
              </ul>
            `
          },
          {
            title: '14. Bảo mật dữ liệu và thông báo vi phạm',
            icon: 'shield-check',
            html: `
              <ul>
                <li>Dữ liệu được truyền qua kết nối mã hóa TLS; mật khẩu được lưu dưới dạng băm có muối, không lưu mật khẩu gốc.</li>
                <li>Hệ thống áp dụng phân quyền truy cập, nguyên tắc tối thiểu quyền, nhật ký thao tác quản trị và sao lưu định kỳ.</li>
                <li>Nhân sự có quyền truy cập dữ liệu phải ký cam kết bảo mật và chỉ truy cập khi cần thiết cho công việc.</li>
                <li>Khi phát hiện hành vi vi phạm hoặc rò rỉ dữ liệu, SurvHub thông báo cho cơ quan chuyên trách và người bị ảnh hưởng theo Điều 23 Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, chậm nhất 72 giờ kể từ khi phát hiện, và áp dụng biện pháp khắc phục.</li>
                <li>Bạn có trách nhiệm bảo mật mật khẩu, mã OTP và thông báo ngay cho SurvHub khi nghi ngờ tài khoản bị xâm nhập.</li>
              </ul>
            `
          },
          {
            title: '15. Minh bạch về trí tuệ nhân tạo và quyết định tự động',
            icon: 'cpu',
            html: `
              <ul>
                <li><strong>Kiểm duyệt nội dung:</strong> SurvHub sử dụng Google Gemini (mô hình Gemini 3.5 Flash Lite) để hỗ trợ kiểm duyệt tiêu đề, nội dung bài đăng và bình luận trên diễn đàn nhằm phát hiện nội dung vi phạm. Nội dung gửi đi chỉ gồm văn bản cần kiểm duyệt, không kèm thông tin thanh toán hay dữ liệu nhạy cảm không cần thiết.</li>
                <li><strong>Điểm uy tín:</strong> Điểm uy tín được tính bằng thuật toán xác định (rule-based) dựa trên thời gian làm bài, câu hỏi bẫy, phương sai câu trả lời và chất lượng tự luận; không phải quyết định của trí tuệ nhân tạo.</li>
                <li><strong>Quyết định tự động:</strong> Việc từ chối bài làm, trừ điểm uy tín hoặc tự động khóa tài khoản là quyết định tự động có ảnh hưởng đến quyền lợi của bạn. Bạn có quyền yêu cầu con người xem xét lại trong 15 ngày kể từ khi nhận thông báo; SurvHub phản hồi trong 03 ngày làm việc và ra quyết định cuối cùng trong 15 ngày.</li>
                <li><strong>Không huấn luyện mô hình:</strong> SurvHub không sử dụng dữ liệu cá nhân của bạn để huấn luyện mô hình trí tuệ nhân tạo của mình. Nhà cung cấp mô hình có thể xử lý dữ liệu theo điều khoản riêng của họ; SurvHub ưu tiên cấu hình không lưu hoặc không dùng dữ liệu gửi đi để huấn luyện khi nhà cung cấp hỗ trợ.</li>
                <li><strong>Không phân biệt đối xử:</strong> SurvHub không dùng trí tuệ nhân tạo để đưa ra quyết định dựa trên các đặc điểm bị pháp luật cấm phân biệt đối xử.</li>
              </ul>
            `
          },
          {
            title: '16. Dữ liệu trong khảo sát và quyền của Nhà tạo khảo sát',
            icon: 'clipboard-list',
            html: `
              <ul>
                <li>Câu trả lời khảo sát thuộc quyền của Đáp viên; Nhà tạo khảo sát nhận quyền sử dụng dữ liệu cấp phản hồi cho mục đích nghiên cứu đã công bố.</li>
                <li>Nhà tạo khảo sát không được yêu cầu dữ liệu nhạy cảm không cần thiết, không được thu thập mật khẩu, mã OTP, số CCCD đầy đủ hoặc thông tin thẻ thanh toán.</li>
                <li>SurvHub loại bỏ họ tên, giới tính, khu vực, trường, ngành, độ tuổi và thu nhập khỏi dữ liệu xuất cho Nhà tạo khảo sát. Email chỉ được chia sẻ khi Nhà tạo khảo sát bật chế độ thu thập email và Đáp viên đã được thông báo trước khi bắt đầu làm bài.</li>
                <li>Nếu phát hiện khảo sát vi phạm, Đáp viên có thể báo cáo qua kênh hỗ trợ. SurvHub có quyền tạm dừng khảo sát, gỡ nội dung và xử lý Nhà tạo khảo sát theo Quy chế hoạt động.</li>
              </ul>
            `
          },
          {
            title: '17. Khiếu nại và cơ quan quản lý',
            icon: 'message-square-warning',
            html: `
              <p>Nếu bạn cho rằng quyền dữ liệu cá nhân bị xâm phạm, vui lòng liên hệ SurvHub trước để được giải quyết. Nếu không đồng ý với kết quả, bạn có quyền khiếu nại hoặc tố cáo tới cơ quan nhà nước có thẩm quyền, bao gồm:</p>
              <ul>
                <li>Cơ quan chuyên trách bảo vệ dữ liệu cá nhân thuộc Bộ Công an (Cục An ninh mạng và phòng chống tội phạm sử dụng công nghệ cao - A05);</li>
                <li>Cơ quan quản lý thương mại điện tử thuộc Bộ Công Thương đối với các vấn đề về nền tảng thương mại điện tử;</li>
                <li>Cơ quan bảo vệ người tiêu dùng có thẩm quyền đối với các vấn đề về quyền lợi người tiêu dùng.</li>
              </ul>
              <p>SurvHub hợp tác đầy đủ với cơ quan có thẩm quyền trong quá trình giải quyết khiếu nại, tố cáo.</p>
            `
          },
          {
            title: '18. Thay đổi Chính sách',
            icon: 'refresh-cw',
            html: `
              <p>SurvHub có thể cập nhật Chính sách này khi có thay đổi về pháp luật, công nghệ hoặc hoạt động xử lý dữ liệu. Phiên bản mới được công bố kèm số phiên bản và ngày hiệu lực. Thay đổi quan trọng được thông báo trước ít nhất 07 ngày qua email hoặc thông báo trong ứng dụng. Nếu bạn không đồng ý với thay đổi, bạn có quyền ngừng sử dụng dịch vụ và yêu cầu xóa dữ liệu.</p>
            `
          },
          {
            title: '19. Liên hệ về dữ liệu cá nhân',
            icon: 'mail',
            html: `
              <ul>
                <li>Phụ trách bảo vệ dữ liệu cá nhân: <a class="font-bold text-orange-600 dark:text-orange-400 hover:underline" href="mailto:ngthtrung.son@gmail.com">ngthtrung.son@gmail.com</a></li>
                <li>Hỗ trợ người dùng: <a class="font-bold text-orange-600 dark:text-orange-400 hover:underline" href="mailto:linharmykxbnvn@gmail.com">linharmykxbnvn@gmail.com</a></li>
              </ul>
              <p>Thời gian phản hồi xác nhận: 02 ngày làm việc. Thời hạn giải quyết từng loại yêu cầu theo Mục 11.</p>
            `
          }
        ]
      },

      /* ==================================================================
       * VAN BAN 3: QUY CHE HOAT DONG
       * ================================================================== */
      {
        id: 'rules',
        label: 'Quy chế hoạt động',
        shortLabel: 'Quy chế',
        icon: 'list-checks',
        title: 'Quy Chế Hoạt Động Nền Tảng SurvHub',
        subtitle: 'Quy trình đăng ký, tạo khảo sát, ký quỹ, làm bài, đổi thưởng, khiếu nại và xử lý vi phạm',
        sections: [
          {
            title: '1. Mục đích và phạm vi',
            icon: 'flag',
            html: `
              <p>Quy chế này quy định quy trình vận hành, quyền và nghĩa vụ của các bên tham gia Nền tảng SurvHub, bao gồm Đáp viên, Nhà tạo khảo sát và SurvHub. Quy chế được công bố công khai theo quy định của Luật Thương mại điện tử số 122/2025/QH15 và là một phần không tách rời của Điều khoản dịch vụ.</p>
              <p>Quy chế áp dụng cho toàn bộ giao dịch phát sinh trên website, ứng dụng di động và các kênh kỹ thuật khác của SurvHub.</p>
            `
          },
          {
            title: '2. Vai trò của các bên',
            icon: 'users',
            html: `
              <ul>
                <li><strong>SurvHub:</strong> đơn vị vận hành nền tảng, cung cấp hạ tầng kỹ thuật, ví điểm, ví Credit, quỹ ký quỹ, hệ thống chống gian lận và kênh giải quyết khiếu nại.</li>
                <li><strong>Đáp viên:</strong> người tham gia trả lời khảo sát, nhận Point và thực hiện quyền đổi thưởng theo quy định.</li>
                <li><strong>Nhà tạo khảo sát:</strong> người nạp Credit, thiết kế khảo sát, lựa chọn đối tượng mục tiêu và nhận dữ liệu cấp phản hồi.</li>
              </ul>
              <p>SurvHub không phải là bên bán hàng hóa, không phải người sử dụng lao động của Đáp viên và không bảo đảm kết quả nghiên cứu của Nhà tạo khảo sát.</p>
            `
          },
          {
            title: '3. Đăng ký, xác thực và bảo mật tài khoản',
            icon: 'user-plus',
            html: `
              <ol>
                <li>Người dùng đăng ký bằng họ tên, email, mật khẩu tối thiểu 06 ký tự và lựa chọn vai trò (Cá nhân hoặc Doanh nghiệp).</li>
                <li>Hệ thống gửi mã OTP 06 số tới email đăng ký. Mã có hiệu lực 10 phút; người dùng phải nhập đúng mã để hoàn tất đăng ký.</li>
                <li>Người dùng phải tích chọn đồng ý với Điều khoản dịch vụ, Quy chế hoạt động và Chính sách bảo vệ dữ liệu cá nhân; đồng thời tuyên bố đủ tuổi hoặc có sự đồng ý của người đại diện theo pháp luật.</li>
                <li>Hệ thống ghi nhận địa chỉ IP, dấu vết thiết bị và thời điểm đăng ký để phục vụ bảo mật, chống gian lận và chứng minh sự đồng ý.</li>
                <li>Tài khoản bị tạm khóa khi có dấu hiệu bất thường; người dùng phải xác minh lại để mở khóa.</li>
              </ol>
            `
          },
          {
            title: '4. Quy trình tạo và xuất bản khảo sát',
            icon: 'file-plus',
            html: `
              <ol>
                <li><strong>Bước 1 - Tạo nháp:</strong> Nhà tạo khảo sát nhập tiêu đề, mô tả, danh mục, số mẫu mục tiêu, đối tượng mục tiêu và thiết kế câu hỏi.</li>
                <li><strong>Bước 2 - Chọn gói và ngân sách:</strong> Hệ thống tính chi phí theo phân khúc (Sinh viên, Cá nhân, Doanh nghiệp), độ dài khảo sát và các tùy chọn lọc sâu. Chi phí được hiển thị rõ trước khi xác nhận.</li>
                <li><strong>Bước 3 - Ký quỹ:</strong> Hệ thống khóa số Credit tương ứng vào quỹ Escrow. Khảo sát chỉ được xuất bản khi ký quỹ thành công.</li>
                <li><strong>Bước 4 - Kiểm duyệt:</strong> Khảo sát được kiểm tra tự động và có thể được kiểm duyệt thủ công về nội dung, tính hợp pháp và mức thù lao hợp lý.</li>
                <li><strong>Bước 5 - Xuất bản:</strong> Khảo sát hiển thị tới Đáp viên phù hợp. Nhà tạo khảo sát có thể tạm dừng, chỉnh sửa hoặc đóng khảo sát theo quy định.</li>
                <li><strong>Bước 6 - Thu mẫu và giải ngân:</strong> Mỗi bài làm hợp lệ được giải ngân thù lao từ Escrow cho Đáp viên và ghi nhận vào sổ cái.</li>
                <li><strong>Bước 7 - Kết thúc:</strong> Khi đủ mẫu, hết hạn hoặc Nhà tạo khảo sát đóng khảo sát, số dư Escrow còn lại được hoàn về ví Credit.</li>
              </ol>
            `
          },
          {
            title: '5. Ký quỹ, giải ngân và hoàn tiền',
            icon: 'landmark',
            html: `
              <ul>
                <li>Escrow được khóa riêng cho từng khảo sát và không được dùng cho khảo sát khác.</li>
                <li>Thù lao được giải ngân khi bài làm đạt trạng thái VALIDATED; bài làm bị từ chối không được giải ngân.</li>
                <li>Khi đóng khảo sát, SurvHub hoàn toàn bộ số dư Escrow còn lại chưa giải ngân về ví Credit của Nhà tạo khảo sát.</li>
                <li>Trường hợp khảo sát bị gỡ do vi phạm pháp luật hoặc nội dung bị cấm, số dư còn lại được xử lý theo mức độ vi phạm; phần đã trả cho Đáp viên hợp lệ không bị thu hồi.</li>
                <li>Mọi bút toán được ghi nhận theo nguyên tắc kế toán kép, có mã giao dịch và nhật ký đối soát.</li>
              </ul>
            `
          },
          {
            title: '6. Quy trình làm bài, kiểm duyệt và screen-out',
            icon: 'clipboard-check',
            html: `
              <ol>
                <li>Đáp viên mở khảo sát, xem thông tin về thời lượng, thù lao và cảnh báo quyền riêng tư (nếu khảo sát thu thập email).</li>
                <li>Hệ thống kiểm tra điều kiện tham gia, số lượt còn lại và trạng thái tài khoản.</li>
                <li>Đáp viên trả lời câu hỏi. Hệ thống ghi nhận thời gian, thao tác và câu trả lời.</li>
                <li>Khi nộp bài, hệ thống chạy 05 chốt chặn chống gian lận và phân loại: VALIDATED, FLAGGED_MANUAL, REJECTED_FRAUD hoặc SCREENED_OUT.</li>
                <li>Bài VALIDATED được cộng Point theo mức thù lao và Điểm uy tín; bài screen-out không nhận Point nhưng được cộng 0,2 Điểm uy tín; bài vi phạm bị trừ điểm và có thể bị khóa tài khoản.</li>
                <li>Đáp viên có quyền giải trình và yêu cầu xem xét lại trong 15 ngày.</li>
              </ol>
            `
          },
          {
            title: '7. Quy trình đổi thưởng',
            icon: 'banknote',
            html: `
              <ol>
                <li>Đáp viên chọn hình thức đổi thưởng: thẻ cào điện thoại, chuyển khoản ngân hàng hoặc ví MoMo.</li>
                <li>Hệ thống kiểm tra số dư, Điểm uy tín tối thiểu 60,0, ngưỡng tối thiểu và thông tin nhận tiền.</li>
                <li>Đáp viên xác nhận giao dịch; hệ thống tạo lệnh và trừ Point tương ứng.</li>
                <li>Bộ phận vận hành kiểm duyệt và chuyển thưởng trong 24 đến 48 giờ làm việc.</li>
                <li>Giao dịch thất bại được hoàn Point trong 07 ngày làm việc kèm thông báo lý do.</li>
                <li>Khiếu nại về giao dịch được tiếp nhận trong 30 ngày kể từ ngày giao dịch.</li>
              </ol>
              <p>Ngưỡng và phí áp dụng theo Mục 10 Điều khoản dịch vụ.</p>
            `
          },
          {
            title: '8. Bảo hành dữ liệu',
            icon: 'shield-check',
            html: `
              <ul>
                <li><strong>Đối tượng:</strong> chỉ áp dụng cho Gói Doanh nghiệp (Enterprise).</li>
                <li><strong>Thời hạn:</strong> 07 ngày kể từ khi khảo sát hoàn thành hoặc thu đủ mẫu.</li>
                <li><strong>Hạn mức:</strong> tối đa 15% tổng số mẫu đã thu thập, tính theo số mẫu được đổi thực tế.</li>
                <li><strong>Điều kiện:</strong> mẫu không đúng phân khúc mục tiêu hoặc không đạt tiêu chuẩn chất lượng đã công bố; có mã phản hồi và bằng chứng kèm theo.</li>
                <li><strong>Không áp dụng:</strong> thay đổi nhu cầu nghiên cứu, đánh giá chủ quan về nội dung câu trả lời, mẫu đã được sử dụng cho mục đích khác hoặc yêu cầu vượt hạn mức.</li>
                <li><strong>Xử lý:</strong> SurvHub mở lại khảo sát để thu bù mẫu mới và ghi nhận vào bảng warranty_claims.</li>
              </ul>
            `
          },
          {
            title: '9. Tiếp nhận và giải quyết khiếu nại',
            icon: 'message-circle',
            html: `
              <ol>
                <li><strong>Tiếp nhận:</strong> qua email hỗ trợ hoặc biểu mẫu báo lỗi trong ứng dụng.</li>
                <li><strong>Xác nhận:</strong> trong 02 ngày làm việc kể từ khi nhận được thông tin hợp lệ.</li>
                <li><strong>Điều tra:</strong> đối chiếu sổ cái, nhật ký hệ thống, dữ liệu bài làm và phản hồi của các bên.</li>
                <li><strong>Kết quả:</strong> thông báo trong 03 ngày làm việc đối với khiếu nại thông thường; tối đa 15 ngày đối với trường hợp phức tạp.</li>
                <li><strong>Kháng nghị:</strong> người dùng có thể yêu cầu xem xét lại lần hai trong 15 ngày kể từ ngày nhận kết quả.</li>
                <li><strong>Chuyển cơ quan:</strong> nếu không giải quyết được, các bên có quyền gửi cơ quan quản lý nhà nước hoặc khởi kiện theo quy định.</li>
              </ol>
              <p>Sổ cái giao dịch kép và nhật ký máy chủ là căn cứ đối soát chính. Người dùng có quyền yêu cầu cung cấp thông tin giao dịch liên quan đến mình.</p>
            `
          },
          {
            title: '10. Cơ chế chống gian lận',
            icon: 'shield-alert',
            html: `
              <p>Hệ thống chống gian lận gồm 05 lớp, vận hành tự động và có sự giám sát của bộ phận vận hành:</p>
              <ol>
                <li><strong>Kiểm tra thời gian:</strong> so sánh thời lượng làm bài với thời gian chuẩn theo loại câu hỏi. Dưới 35% bị từ chối; từ 35% đến dưới 60% bị đánh dấu nghi vấn.</li>
                <li><strong>Kiểm tra độ chú ý:</strong> câu hỏi bẫy được chèn ngẫu nhiên, có cơ chế sửa sai lần hai.</li>
                <li><strong>Kiểm tra phương sai:</strong> phát hiện chọn cùng một đáp án cho toàn bộ chuỗi thang đo hoặc ma trận.</li>
                <li><strong>Kiểm tra tự luận:</strong> phát hiện chuỗi ký tự vô nghĩa, lặp ký tự và nội dung không liên quan; vẫn chấp nhận câu trả lời ngắn hợp lệ.</li>
                <li><strong>Điểm uy tín và dấu vết thiết bị:</strong> theo dõi lịch sử, địa chỉ IP và dấu vết thiết bị để phát hiện nhiều tài khoản, dùng chung thiết bị hoặc hành vi bất thường.</li>
              </ol>
              <div class="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60">
                <p class="font-bold text-orange-900 dark:text-orange-200">Nguyên tắc bảo vệ người dùng trung thực</p>
                <p>Không khóa tài khoản chỉ dựa trên một chỉ dấu duy nhất. Trước khi khóa vĩnh viễn, hệ thống ghi nhận nhật ký, cho phép giải trình và xem xét bởi con người khi có yêu cầu. Số dư hợp lệ không bị tịch thu.</p>
              </div>
            `
          },
          {
            title: '11. Nội dung và hành vi bị cấm',
            icon: 'ban',
            html: `
              <p>SurvHub nghiêm cấm mọi nội dung và hành vi sau:</p>
              <ul>
                <li>Vi phạm pháp luật Việt Nam, kích động bạo lực, thù địch, phân biệt đối xử hoặc xâm phạm an ninh quốc gia;</li>
                <li>Đồi trụy, khiêu dâm, cờ bạc, ma túy, mại dâm, mua bán người hoặc các hoạt động bị pháp luật cấm;</li>
                <li>Lừa đảo, đa cấp trái phép, huy động vốn trái phép, tín dụng đen hoặc rửa tiền;</li>
                <li>Thu thập mật khẩu, mã OTP, số CCCD đầy đủ, thông tin thẻ ngân hàng hoặc dữ liệu nhạy cảm không cần thiết;</li>
                <li>Mua bán, trao đổi, công khai dữ liệu cá nhân của người khác khi chưa có sự đồng ý;</li>
                <li>Spam, quảng cáo trái phép, phát tán mã độc, tấn công hoặc gây quá tải hệ thống;</li>
                <li>Sử dụng bot, script, công cụ tự động hoặc trí tuệ nhân tạo để gian lận bài làm;</li>
                <li>Mạo danh SurvHub, nhân viên hoặc người dùng khác.</li>
              </ul>
            `
          },
          {
            title: '12. Xử lý vi phạm',
            icon: 'gavel',
            html: `
              <p>SurvHub áp dụng biện pháp xử lý theo 03 mức, căn cứ tính chất, mức độ và hậu quả của vi phạm:</p>
              <ul>
                <li><strong>Mức 1 - Nhắc nhở và chấn chỉnh:</strong> cảnh cáo, yêu cầu chỉnh sửa nội dung, từ chối bài làm, trừ Điểm uy tín theo khung -5 hoặc -12 điểm.</li>
                <li><strong>Mức 2 - Hạn chế quyền:</strong> tạm khóa tính năng tạo khảo sát hoặc đổi thưởng, tạm dừng khảo sát, yêu cầu xác minh lại danh tính.</li>
                <li><strong>Mức 3 - Chấm dứt:</strong> khóa tài khoản có thời hạn hoặc vĩnh viễn, gỡ nội dung, thu hồi số dư phát sinh từ vi phạm, chuyển hồ sơ cho cơ quan có thẩm quyền.</li>
              </ul>
              <p>Người bị xử lý có quyền giải trình trong 15 ngày. Quyết định cuối cùng được ban hành sau khi xem xét giải trình và bằng chứng, trừ trường hợp khẩn cấp cần ngăn chặn thiệt hại.</p>
            `
          },
          {
            title: '13. Quyền và nghĩa vụ của các bên',
            icon: 'handshake',
            html: `
              <p><strong>SurvHub có quyền:</strong> kiểm duyệt nội dung, tạm dừng khảo sát, khóa tài khoản vi phạm, thu phí theo bảng giá công bố, thay đổi tính năng sau khi thông báo và yêu cầu xác minh danh tính khi cần.</p>
              <p><strong>SurvHub có nghĩa vụ:</strong> vận hành ổn định, bảo mật dữ liệu, công khai giá và phí, giải quyết khiếu nại đúng hạn, bảo vệ quyền lợi người tiêu dùng và tuân thủ pháp luật.</p>
              <p><strong>Đáp viên có quyền:</strong> được thông tin về khảo sát, nhận thù lao cho bài làm hợp lệ, đổi thưởng theo quy định, khiếu nại và yêu cầu xem xét lại quyết định tự động.</p>
              <p><strong>Đáp viên có nghĩa vụ:</strong> trả lời trung thực, bảo mật tài khoản, không gian lận, không xâm phạm dữ liệu người khác và tuân thủ Điều khoản dịch vụ.</p>
              <p><strong>Nhà tạo khảo sát có quyền:</strong> nhận dữ liệu cấp phản hồi, tạm dừng/đóng khảo sát, yêu cầu bảo hành theo chính sách và khiếu nại về chất lượng mẫu.</p>
              <p><strong>Nhà tạo khảo sát có nghĩa vụ:</strong> nạp đủ Credit, thiết kế khảo sát hợp pháp, không thu thập dữ liệu nhạy cảm không cần thiết, không tái định danh và không sử dụng dữ liệu ngoài mục đích nghiên cứu.</p>
            `
          },
          {
            title: '14. Công bố thông tin và minh bạch giá',
            icon: 'receipt',
            html: `
              <ul>
                <li>Giá dịch vụ, phí nạp/rút, tỷ giá Point/Credit và các khoản phụ phí được công bố trước khi người dùng xác nhận giao dịch.</li>
                <li>Không có phí ẩn, không tự động gia hạn, không dùng đồng hồ đếm ngược giả hoặc thông tin sai lệch để thúc ép giao dịch.</li>
                <li>Hóa đơn VAT được cung cấp khi Nhà tạo khảo sát yêu cầu và cung cấp đủ thông tin theo quy định pháp luật về hóa đơn.</li>
                <li>Thông tin về chủ sở hữu, trạng thái thông báo/đăng ký nền tảng thương mại điện tử sẽ được công bố khi SurvHub hoàn tất thủ tục pháp lý.</li>
              </ul>
            `
          },
          {
            title: '15. Bảo vệ người tiêu dùng',
            icon: 'heart-handshake',
            html: `
              <ul>
                <li>Người dùng được cung cấp thông tin đầy đủ trước khi xác nhận giao dịch và có quyền từ chối giao dịch mà không bị phạt.</li>
                <li>Không sử dụng các điều khoản loại trừ toàn bộ trách nhiệm, hạn chế quyền khởi kiện hoặc gây bất lợi trái pháp luật cho người tiêu dùng theo Điều 25 Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15.</li>
                <li>Người tiêu dùng có quyền khiếu nại, yêu cầu bồi thường và khởi kiện theo quy định tại Điều 31 Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15.</li>
                <li>Giao dịch từ xa và giao dịch trên không gian mạng được thực hiện theo Điều 37 đến Điều 40 Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15.</li>
              </ul>
            `
          },
          {
            title: '16. Liên hệ và thời gian làm việc',
            icon: 'mail',
            html: `
              <ul>
                <li>Hỗ trợ Đáp viên: <a class="font-bold text-orange-600 dark:text-orange-400 hover:underline" href="mailto:linharmykxbnvn@gmail.com">linharmykxbnvn@gmail.com</a></li>
                <li>Khiếu nại và phản ánh chất lượng: <a class="font-bold text-orange-600 dark:text-orange-400 hover:underline" href="mailto:ngthtrung.son@gmail.com">ngthtrung.son@gmail.com</a></li>
                <li>Hợp tác doanh nghiệp: <a class="font-bold text-orange-600 dark:text-orange-400 hover:underline" href="mailto:linharmykxbnvn@gmail.com">linharmykxbnvn@gmail.com</a></li>
              </ul>
              <p>Thời gian tiếp nhận: thứ Hai đến thứ Sáu, từ 08:00 đến 17:30 (giờ Việt Nam), trừ ngày lễ, Tết. Yêu cầu gửi ngoài giờ được xử lý vào ngày làm việc kế tiếp.</p>
            `
          }
        ]
      }
    ]
  };
})();
