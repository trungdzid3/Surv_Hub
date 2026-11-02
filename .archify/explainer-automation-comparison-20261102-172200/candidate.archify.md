# So sánh Kiến trúc Kiểm thử AI: Playwright + Browser-Use với Muse AI {#ai-testing-comparison}

Playwright kết hợp Browser-Use là bộ công cụ mã nguồn mở tối ưu cho kiểm thử E2E nội bộ với chi phí 0 đồng. Trong khi đó, Muse AI là nền tảng đám mây trọn gói hướng tới tự động hóa toàn bộ vòng đời phần mềm.

- Playwright + Browser-Use chạy cục bộ, nhúng trực tiếp vào Pytest và tận dụng mô hình Gemini 3.5 Flash Lite.
- Toàn bộ mã nguồn, dữ liệu người dùng và phiên kiểm thử được lưu trữ nội bộ an toàn.
- Muse AI cung cấp môi trường máy ảo khép kín, phù hợp cho thẩm định mã nguồn từ xa nhưng chi phí cao hơn.
- Khả năng can thiệp sâu vào DOM và mô phỏng bẫy chống gian lận vượt trội trên giải pháp tự lưu trữ.

@answer scope="Kiểm thử tự động hóa AI · Playwright + Browser-Use vs Muse AI"
@meta locale=en quality_profile=showcase style=swiss

## Kiến trúc tương tác tuần tự của Playwright và Browser-Use {#browser-use-flow}

@sequence id=bu-seq title="Chu kỳ tương tác giữa Playwright và Browser-Use"
| actor tester | Tester / Pytest | external |
| actor agent | Browser-Use Agent | backend |
| actor pw | Playwright Driver | backend |
| actor llm | Gemini 3.5 Flash Lite | cloud |
| actor app | Giao diện VibeSurvey | frontend |
| tester | agent | Yêu cầu kịch bản kiểm thử |
| agent | pw | Yêu cầu trích xuất DOM và ảnh |
| pw | app | Đọc DOM và cây Accessibility |
| app | pw | Cấu trúc trang web hiện tại | return |
| pw | agent | Trả về ngữ cảnh giao diện | return |
| agent | llm | Gửi ngữ cảnh DOM và mục tiêu |
| llm | agent | JSON hành động (Click, Type) | return |
| agent | pw | Gửi lệnh thực thi |
| pw | app | Thao tác nhập liệu trực tiếp |

@steps id=execution-steps
| step1 | Nạp kịch bản | Tester mô tả luồng kiểm thử bằng văn bản tự nhiên trong kịch bản Pytest. | bu-seq | tester |
| step2 | Đọc trạng thái DOM | Playwright trích xuất cây Accessibility và ảnh chụp màn hình gửi tới Agent. | bu-seq | pw |
| step3 | Suy luận hành động | Gemini 3.5 Flash Lite phân tích mục tiêu và quyết định phần tử cần thao tác. | bu-seq | llm |
| step4 | Thực thi giao diện | Driver thực hiện click, nhập biểu mẫu hoặc cuộn trang trực tiếp trên web. | bu-seq | app |

## So sánh đối đầu giữa hai giải pháp {#head-to-head}

| Tiêu chí kỹ thuật | Playwright + Browser-Use | Muse AI Platform |
| --- | --- | --- |
| Mô hình triển khai | Mã nguồn mở tự lưu trữ cục bộ {good:Toàn quyền kiểm soát} | Nền tảng đám mây khép kín {caution:Phụ thuộc nhà cung cấp} |
| Tích hợp CI/CD | Nhúng sâu vào Pytest, Jest, GitHub Actions {good:Linh hoạt cao} | Vận hành qua giao diện chat hoặc webhook {caution:Khó tùy biến sâu} |
| Chi phí vận hành | Miễn phí khi dùng Gemini Flash Lite hoặc Local LLM {good:Tối ưu chi phí} | Thu phí thuê bao định kỳ theo hạn mức tác vụ {bad:Chi phí cao} |
| Bảo mật dữ liệu | Dữ liệu kiểm thử lưu trữ 100% nội bộ {good:An toàn tuyệt đối} | Mã nguồn và dữ liệu phải gửi lên máy ảo đám mây {caution:Rủi ro lộ lọt} |
| Khả năng can thiệp DOM | Can thiệp trực tiếp vào từng selector, cookie, header {good:Chính xác cao} | Bị giới hạn trong wrapper đóng gói sẵn của máy ảo {caution:Khó can thiệp sâu} |
| Khả năng tự sửa code | Hỗ trợ cơ bản, tập trung vào vượt qua giao diện {caution:Cần lập trình viên hỗ trợ} | Tự đọc hiểu repository và tạo pull request sửa lỗi {good:Tự hành toàn diện} |

## Lộ trình ứng dụng cho nền tảng VibeSurvey {#vibesurvey-roadmap}

@callout id=recommendation level=note title="Định hướng triển khai tối ưu"
Với kiến trúc Node.js, SQLite WAL và Anti-Fraud của VibeSurvey, giải pháp Playwright và Browser-Use là lựa chọn tối ưu. Hệ thống sẽ kết hợp trực tiếp 3 khóa Gemini 3.5 Flash Lite đã tích hợp sẵn.

- [ ] Thiết lập môi trường Python 3.12 và thư viện `browser-use` cùng `playwright`.
- [ ] Tích hợp 3 API keys Gemini 3.5 Flash Lite với cơ chế cân bằng tải xoay vòng đã thiết lập.
- [ ] Viết kịch bản kiểm thử tự hành luồng khảo sát: Đăng nhập, mở form, điền đáp án và kiểm tra điểm thưởng.
- [ ] Mô phỏng các hành vi gian lận (bẫy tốc độ, thẳng hàng Likert, chèn link ngoài) để xác thực độ nhạy của Sentinel.
- [ ] Tích hợp vào quy trình kiểm chuẩn trước khi triển khai bản dựng APK Android Capacitor.
