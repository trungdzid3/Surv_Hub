/**
 * SurvHub - Contextual Spotlight Onboarding Tour Module
 * Huong dan tuong tac chi tiet theo ngu canh tung tab voi Spotlight, Step Jumper & Popover.
 * Tuan thu DESIGN.md (Cam #EA580C, Trang #FFFFFF/#FAFAFA, Den Obsidian #121214/#1C1C20, Montserrat).
 * TUYET DOI KHONG DUNG EMOJI.
 *
 * @namespace window.VibeApp
 * @requires window.VibeApp (state, showToast, closeAllCustomDropdowns, setStudioSidebarSubTab),
 *           window.VibeUtils (refreshIcons), lucide (global)
 * @exports triggerAutoTourForTab, startContextualTour, nextTourStep, prevTourStep,
 *          jumpToTourStep, closeOnboardingTour, disableAllAutoTours
 */

(function () {
  'use strict';

  window.VibeApp = window.VibeApp || {};

  const STORAGE_SEEN_KEY = 'survhub_tour_seen_v2';
  const STORAGE_DISABLED_KEY = 'survhub_tour_disabled_v1';
  const AUTO_TRIGGER_DELAY_MS = 380;
  const VIEWPORT_MARGIN = 12;
  const MOBILE_BOTTOM_NAV_RESERVE = 76;
  const SPOTLIGHT_PADDING = 6;
  const POPOVER_GAP = 12;

  const GUEST_LOCKED_TABS = [
    'create-survey',
    'wallet',
    'profile',
    'creator-surveys',
    'my-vouchers'
  ];

  const STUDIO_MODE_TABS = ['BUILDER', 'SMART_PASTE', 'EXTERNAL_URL'];
  const PROFILE_MAIN_TABS = ['overview', 'surveys', 'forum-posts', 'security'];
  const PROFILE_ALL_TABS = ['overview', 'surveys', 'forum-posts', 'security', 'STUDENT', 'ENTERPRISE'];

  const STUDIO_MODE_ACTIVE_CLASSES = [
    'bg-white',
    'dark:bg-stone-900',
    'text-orange-600',
    'dark:text-orange-400',
    'shadow-xs'
  ];
  const STUDIO_MODE_INACTIVE_CLASSES = [
    'text-stone-600',
    'dark:text-stone-400',
    'hover:text-stone-900',
    'dark:hover:text-stone-200'
  ];

  const PROFILE_TAB_ACTIVE_CLASSES = [
    'bg-white',
    'dark:bg-stone-800',
    'text-orange-600',
    'dark:text-orange-400',
    'font-black',
    'shadow-xs',
    'ring-1',
    'ring-stone-900/5',
    'dark:ring-stone-700/60'
  ];
  const PROFILE_TAB_INACTIVE_CLASSES = [
    'text-stone-500',
    'hover:text-stone-900',
    'dark:hover:text-stone-200',
    'hover:bg-white/60',
    'dark:hover:bg-stone-800/50'
  ];

  function normalizeTourTabId(tabId) {
    if (!tabId || typeof tabId !== 'string') return 'home';
    const aliases = {
      'fast-create': 'create-survey',
      'my-surveys': 'creator-surveys',
      analytics: 'creator-surveys',
      'my-vouchers': 'voucher-market',
      'admin-payouts': 'admin-overview',
      'admin-fraud': 'admin-overview',
      'admin-bugs': 'admin-overview',
      'admin-bug-reports': 'admin-overview',
      'admin-audit': 'admin-overview',
      'admin-audit-logs': 'admin-overview'
    };
    return aliases[tabId] || tabId;
  }

  function setClassGroup(el, addClasses, removeClasses) {
    if (!el || !el.classList) return;
    if (Array.isArray(removeClasses)) {
      removeClasses.forEach((cls) => el.classList.remove(cls));
    }
    if (Array.isArray(addClasses)) {
      addClasses.forEach((cls) => el.classList.add(cls));
    }
  }

  function setStudioTourState(app, opts = {}) {
    if (!app || !app.state) return;

    if (opts.createSurveyTab && STUDIO_MODE_TABS.includes(opts.createSurveyTab)) {
      app.state.createSurveyTab = opts.createSurveyTab;

      STUDIO_MODE_TABS.forEach((mode) => {
        const panel = document.getElementById(`create-tab-content-${mode}`);
        if (panel) {
          panel.classList.toggle('hidden', mode !== opts.createSurveyTab);
        }
      });

      const modeButtons = {
        BUILDER:
          document.getElementById('studio-tab-btn-builder') ||
          document.querySelector('#app-root button[onclick*="switchCreateSurveyTab(\'BUILDER\')"]'),
        SMART_PASTE:
          document.getElementById('studio-tab-btn-smart-paste') ||
          document.querySelector('#app-root button[onclick*="switchCreateSurveyTab(\'SMART_PASTE\')"]'),
        EXTERNAL_URL:
          document.getElementById('studio-tab-btn-external-url') ||
          document.querySelector('#app-root button[onclick*="switchCreateSurveyTab(\'EXTERNAL_URL\')"]')
      };

      STUDIO_MODE_TABS.forEach((mode) => {
        const btn = modeButtons[mode];
        if (!btn) return;
        const isSelected = mode === opts.createSurveyTab;
        setClassGroup(
          btn,
          isSelected ? STUDIO_MODE_ACTIVE_CLASSES : STUDIO_MODE_INACTIVE_CLASSES,
          isSelected ? STUDIO_MODE_INACTIVE_CLASSES : STUDIO_MODE_ACTIVE_CLASSES
        );
      });
    }

    if (opts.mobileTab && window.innerWidth < 1024) {
      const targetMobileTab = opts.mobileTab === 'SIDEBAR' ? 'SIDEBAR' : 'CANVAS';
      app.state.mobileStudioActiveTab = targetMobileTab;

      const canvasEl = document.getElementById('studio-canvas-scroll');
      const sidebarEl = document.getElementById('studio-sidebar-root');

      if (canvasEl) {
        canvasEl.classList.toggle('block', targetMobileTab === 'CANVAS');
        canvasEl.classList.toggle('hidden', targetMobileTab !== 'CANVAS');
      }
      if (sidebarEl) {
        sidebarEl.classList.toggle('block', targetMobileTab === 'SIDEBAR');
        sidebarEl.classList.toggle('hidden', targetMobileTab !== 'SIDEBAR');
      }

      const mobileCanvasBtn = document.querySelector('#app-root button[onclick*="setMobileStudioTab(\'CANVAS\')"]');
      const mobileSidebarBtn = document.querySelector('#app-root button[onclick*="setMobileStudioTab(\'SIDEBAR\')"]');
      if (mobileCanvasBtn) {
        setClassGroup(
          mobileCanvasBtn,
          targetMobileTab === 'CANVAS' ? STUDIO_MODE_ACTIVE_CLASSES : STUDIO_MODE_INACTIVE_CLASSES,
          targetMobileTab === 'CANVAS' ? STUDIO_MODE_INACTIVE_CLASSES : STUDIO_MODE_ACTIVE_CLASSES
        );
      }
      if (mobileSidebarBtn) {
        setClassGroup(
          mobileSidebarBtn,
          targetMobileTab === 'SIDEBAR' ? STUDIO_MODE_ACTIVE_CLASSES : STUDIO_MODE_INACTIVE_CLASSES,
          targetMobileTab === 'SIDEBAR' ? STUDIO_MODE_INACTIVE_CLASSES : STUDIO_MODE_ACTIVE_CLASSES
        );
      }
    }

    if (opts.sidebarSubTab && app.state.studioSidebarSubTab !== opts.sidebarSubTab) {
      if (
        document.getElementById('studio-sidebar-root') &&
        typeof app.setStudioSidebarSubTab === 'function'
      ) {
        app.setStudioSidebarSubTab(opts.sidebarSubTab);
      } else {
        app.state.studioSidebarSubTab = opts.sidebarSubTab;
      }
    }
  }

  function setProfileTourSubTab(app, subTab) {
    if (!app || !app.state || !subTab) return;
    app.state.profileTab = subTab;

    PROFILE_ALL_TABS.forEach((tab) => {
      const panel = document.getElementById(`profile-tab-${tab}`);
      if (panel) {
        panel.classList.toggle('hidden', tab !== subTab);
      }
    });

    PROFILE_MAIN_TABS.forEach((tab) => {
      const btn = document.querySelector(`#app-root button[onclick*="switchProfileTab('${tab}')"]`);
      if (!btn) return;
      const isSelected = tab === subTab;
      setClassGroup(
        btn,
        isSelected ? PROFILE_TAB_ACTIVE_CLASSES : PROFILE_TAB_INACTIVE_CLASSES,
        isSelected ? PROFILE_TAB_INACTIVE_CLASSES : PROFILE_TAB_ACTIVE_CLASSES
      );
    });
  }

  const TOUR_SCENARIOS = {
    surveys: [
      {
        selectors: [
          '#app-root .grid.grid-cols-1.md\\:grid-cols-2',
          '#header-streak-btn',
          '#user-profile-btn',
          '#guest-auth-actions'
        ],
        sectionTag: 'KHẢO SÁT • TIẾN ĐỘ',
        title: 'Số dư tích lũy & chuỗi điểm danh 7 ngày',
        description:
          'Theo dõi nhanh điểm thưởng hiện có cùng lộ trình điểm danh hàng ngày để tối ưu thu nhập.',
        bullets: [
          'Thanh tiến độ hiển thị khoảng cách tới mốc 10.000đ thẻ cào hoặc 50.000đ rút VietQR/MoMo.',
          'Điểm danh liên tục T1-T7 để nhận thêm Point thưởng và hộp quà ngày thứ 7 (tài khoản Doanh nghiệp hiển thị Quỹ Credit & Vé Hỏa Tốc).'
        ]
      },
      {
        selectors: ['#survey-search-input'],
        sectionTag: 'KHẢO SÁT • BỘ LỌC NHANH',
        title: 'Tìm kiếm từ khóa & chip lọc nhanh',
        description:
          'Thu hẹp danh sách khảo sát theo chủ đề bạn quan tâm hoặc các tiêu chí ưu tiên thưởng.',
        bullets: [
          'Gõ từ khóa trực tiếp vào ô tìm kiếm để lọc tức thì không cần tải lại trang.',
          'Chọn nhanh các chip Thưởng cao, Làm nhanh, Dưới 10 câu hoặc Voucher.'
        ]
      },
      {
        selectors: [
          '#app-root .allow-overflow .inline-flex',
          '#app-root button[onclick*="setSurveyStatusFilter"]',
          '#survey-search-input'
        ],
        sectionTag: 'KHẢO SÁT • TRẠNG THÁI',
        title: 'Phân loại Tất cả, Chưa làm & Đã làm',
        description:
          'Chuyển đổi trạng thái bài khảo sát để tập trung làm các bài mới hoặc xem lại lịch sử đã nộp.',
        bullets: [
          'Tab Chưa làm hiển thị các khảo sát còn suất mà bạn chưa tham gia.',
          'Tab Đã làm cho phép mở lại bài đã hoàn thành để xem chi tiết câu trả lời (nếu tác giả cho phép).'
        ]
      },
      {
        selectors: ['#survey-cat-btn', '#sort-dropdown-label'],
        sectionTag: 'KHẢO SÁT • SẮP XẾP',
        title: 'Lọc theo lĩnh vực & sắp xếp ưu tiên',
        description:
          'Chọn chuyên ngành phù hợp với hồ sơ của bạn hoặc ưu tiên hiển thị theo mức thưởng và tốc độ.',
        bullets: [
          'Menu Lĩnh vực giúp lọc theo Kinh doanh, Công nghệ, Giáo dục, Y tế và nhiều ngành khác.',
          'Menu Sắp xếp hỗ trợ: Mặc định (Sắp đầy & Mới), Điểm thưởng cao nhất, Ít câu hỏi nhất, Gần đủ suất nhất.'
        ]
      },
      {
        selectors: ['#hide-completed-switch', '#view-btn-grid', '#view-btn-list'],
        sectionTag: 'KHẢO SÁT • HIỂN THỊ',
        title: 'Ẩn/hiện bài đã làm & đổi kiểu Lưới/Danh sách',
        description:
          'Tùy biến không gian duyệt khảo sát theo thói quen sử dụng trên cả máy tính và điện thoại.',
        bullets: [
          'Gạt công tắc Hiện bài đã làm để ẩn bớt các bài đã hoàn tất hoặc đã đủ suất.',
          'Chuyển giữa dạng Lưới trực quan và dạng Danh sách gọn để quét nhanh thông số.'
        ]
      },
      {
        selectors: ['.surveys-grid-section', '#app-root'],
        sectionTag: 'KHẢO SÁT • CHỐNG GIAN LẬN',
        title: 'Làm bài trung thực & 5 chốt Anti-Fraud',
        description:
          'Các bài ghim VIP nằm ở đầu danh sách; mọi bài nộp hợp lệ đều được kiểm duyệt minh bạch.',
        bullets: [
          'Hệ thống kiểm tra 5 chốt: tốc độ làm bài (0s với câu tự luận), bẫy tập trung động (+1 cơ hội), phương sai đường thẳng, bộ lọc tự luận rác và điểm uy tín trust_score.',
          'Hoàn thành hợp lệ nhận Point ngay; nếu bị sàng lọc screen-out ở câu lọc đầu sẽ dừng sớm ở mức 0đ.'
        ],
        tip: 'Mẹo: Cập nhật đầy đủ hồ sơ nhân khẩu học để hệ thống ghép đúng các khảo sát có mức thưởng cao.'
      }
    ],

    'create-survey': [
      {
        beforeStep(app) {
          setStudioTourState(app, { createSurveyTab: 'BUILDER', mobileTab: 'CANVAS' });
        },
        selectors: ['#studio-header-card', '#fast-title', '#fast-desc', '#fast-category-display'],
        sectionTag: 'STUDIO • BƯỚC 1/10',
        title: 'Thiết lập tiêu đề, mô tả & lĩnh vực',
        description:
          'Bắt đầu chiến dịch bằng thẻ thông tin chung của biểu mẫu ở đầu khung soạn thảo.',
        bullets: [
          'Nhập tiêu đề rõ ràng, mô tả mục tiêu nghiên cứu và lưu ý bảo mật cho đáp viên.',
          'Chọn đúng lĩnh vực chuyên môn và thêm ảnh bìa để tăng tỉ lệ nhấp vào làm bài.'
        ],
        tip: 'Tiêu đề ngắn gọn, nêu rõ đối tượng mục tiêu giúp thu mẫu nhanh hơn đáng kể.'
      },
      {
        beforeStep(app) {
          setStudioTourState(app, { createSurveyTab: 'BUILDER', mobileTab: 'CANVAS' });
        },
        selectors: [
          '#studio-mode-switcher',
          '#studio-tab-btn-builder',
          '#studio-tab-btn-smart-paste',
          '#studio-header-card'
        ],
        sectionTag: 'STUDIO • BƯỚC 2/10',
        title: 'Chuyển đổi linh hoạt 3 chế độ tạo form',
        description:
          'Studio cung cấp 3 cách dựng bảng hỏi song song, có thể chuyển qua lại bất kỳ lúc nào.',
        bullets: [
          'Soạn Trực Tiếp: kéo thả, chỉnh sửa từng câu hỏi với đầy đủ 12 định dạng.',
          'Dán Text Nhanh (Smart Paste) và Google / MS Forms: nhập hàng loạt câu hỏi sẵn có trong vài giây.'
        ]
      },
      {
        beforeStep(app) {
          setStudioTourState(app, { createSurveyTab: 'BUILDER', mobileTab: 'CANVAS' });
        },
        selectors: ['#studio-q-card-0', '#builder-questions-list', '#create-tab-content-BUILDER'],
        sectionTag: 'STUDIO • BƯỚC 3/10',
        title: 'Thẻ câu hỏi & 12 định dạng chuẩn Google Forms',
        description:
          'Mỗi thẻ câu hỏi cho phép tùy biến sâu cấu trúc, ràng buộc dữ liệu và luồng điều hướng.',
        bullets: [
          'Hỗ trợ 12 định dạng: Trắc nghiệm, Hộp kiểm, Dropdown, Tự luận, Thang tuyến tính, Lưới ma trận, Đánh giá sao, Tải tệp, Ngày/Giờ.',
          'Tích hợp chip Sàng lọc, Rẽ nhánh logic theo đáp án, Thêm giới hạn và công tắc Bắt buộc.'
        ],
        tip: 'Nên đặt câu Sàng lọc ở đầu biểu mẫu để chỉ thu thập đúng tệp đáp viên đạt điều kiện.'
      },
      {
        beforeStep(app) {
          setStudioTourState(app, { createSurveyTab: 'BUILDER', mobileTab: 'CANVAS' });
        },
        selectors: [
          '#studio-add-question-btn',
          '#create-tab-content-BUILDER button[onclick*="addBuilderQuestion"]',
          '#builder-questions-list'
        ],
        sectionTag: 'STUDIO • BƯỚC 4/10',
        title: 'Thêm câu hỏi, ảnh, video & ngắt phân đoạn',
        description:
          'Mở rộng bảng hỏi dễ dàng bằng nút thêm câu hỏi bên dưới hoặc thanh công cụ nổi bên cạnh mỗi thẻ.',
        bullets: [
          'Chèn thêm câu hỏi mới, khối tiêu đề mô tả, ảnh minh họa, video YouTube hoặc phân đoạn chuyển trang.',
          'Số lượng câu hỏi tự động xác định độ dài form: Ngắn (<=10 câu), Vừa (11-25 câu), Dài (>25 câu).'
        ]
      },
      {
        beforeStep(app) {
          setStudioTourState(app, { createSurveyTab: 'SMART_PASTE', mobileTab: 'CANVAS' });
        },
        selectors: ['#smart-paste-input', '#create-tab-content-SMART_PASTE'],
        sectionTag: 'STUDIO • BƯỚC 5/10',
        title: 'Dán văn bản thông minh từ Word, Notion & Docs',
        description:
          'Sao chép toàn bộ đề cương câu hỏi từ tài liệu soạn thảo và dán vào khung Smart Paste.',
        bullets: [
          'Hệ thống tự nhận diện số thứ tự câu, phương án A/B/C/D, hộp kiểm hoặc thang Likert 1-5.',
          'Sau khi bấm nhận diện, toàn bộ câu hỏi sẽ nạp vào Canvas để bạn tinh chỉnh thêm.'
        ],
        tip: 'Mỗi lựa chọn nên xuống dòng riêng để bộ phân tích nhận diện chính xác 100%.'
      },
      {
        beforeStep(app) {
          setStudioTourState(app, { createSurveyTab: 'EXTERNAL_URL', mobileTab: 'CANVAS' });
        },
        selectors: ['#create-tab-content-EXTERNAL_URL', '#fast-form-url', '#fast-google-sheets-url'],
        sectionTag: 'STUDIO • BƯỚC 6/10',
        title: 'Đồng bộ Google / MS Forms & Webhook Sheets',
        description:
          'Dán đường dẫn biểu mẫu ngoài để bóc tách tự động và kết nối đồng bộ dữ liệu phản hồi.',
        bullets: [
          'Hỗ trợ link rút gọn forms.gle, /viewform, /edit của Google Forms và biểu mẫu Microsoft Forms.',
          'Tùy chọn gắn Google Sheets Webhook URL để đổ dữ liệu về trang tính và bật thu thập email có đồng ý.'
        ],
        tip: 'Nếu form giới hạn trong tổ chức, hệ thống sẽ hướng dẫn thêm email Bot hoặc ủy quyền OAuth 1 chạm.'
      },
      {
        beforeStep(app) {
          setStudioTourState(app, {
            createSurveyTab: 'BUILDER',
            mobileTab: 'SIDEBAR',
            sidebarSubTab: 'BUDGET'
          });
        },
        selectors: [
          '#fast-target-count',
          '#sidebar-floor-indicator',
          '#fast-survey-duration',
          '#studio-sidebar-root'
        ],
        sectionTag: 'STUDIO • BƯỚC 7/10',
        title: 'Thiết lập quy mô mẫu, giá sàn & thời hạn treo',
        description:
          'Cột bên phải (hoặc tab Cài Đặt & Ngân Sách trên di động) tính toán ký quỹ theo thời gian thực.',
        bullets: [
          'Áp dụng đơn giá sàn theo phân khúc: Sinh viên (400-600đ), Cá nhân (800-1.200đ), Doanh nghiệp (1.500-2.500đ/mẫu).',
          'Chỉnh số mẫu mục tiêu và thời hạn treo sàn từ 1 đến 90 ngày; mẫu chưa thu đủ khi hết hạn được hoàn 100%.'
        ]
      },
      {
        beforeStep(app) {
          setStudioTourState(app, {
            createSurveyTab: 'BUILDER',
            mobileTab: 'SIDEBAR',
            sidebarSubTab: 'BUDGET'
          });
        },
        selectors: ['#studio-sla-card-RECOMMENDED', '#studio-boost-slider', '#studio-sidebar-root'],
        sectionTag: 'STUDIO • BƯỚC 8/10',
        title: 'Chọn gói tốc độ thu mẫu (SLA) & Tăng thưởng',
        description:
          'Cân đối giữa ngân sách tiết kiệm và tốc độ hoàn thành chiến dịch thông qua 3 nấc SLA.',
        bullets: [
          'Chọn Mức Sàn Tiết Kiệm, Mức Đề Xuất (+25% ưu tiên) hoặc Mức Hỏa Tốc (+60%).',
          'Thanh trượt Tăng Thưởng Tự Do chuyển 80% phần tiền tăng thêm trực tiếp vào Point cho đáp viên.'
        ],
        tip: 'Mức thưởng cao hơn giá sàn giúp bài khảo sát nổi bật và thu hút người điền ưu tiên làm trước.'
      },
      {
        beforeStep(app) {
          setStudioTourState(app, {
            createSurveyTab: 'BUILDER',
            mobileTab: 'SIDEBAR',
            sidebarSubTab: 'SETTINGS'
          });
        },
        selectors: ['#studio-has-targeting', '#studio-is-pinned', '#studio-sidebar-root'],
        sectionTag: 'STUDIO • BƯỚC 9/10',
        title: 'Bộ lọc 34 tỉnh/293 trường ĐH & Ghim VIP',
        description:
          'Chuyển sang tab Bộ Lọc & Cài Đặt để nhắm đúng nhân khẩu học và bật ưu tiên hiển thị.',
        bullets: [
          'Bật bộ lọc đối tượng để chọn giới tính, độ tuổi, nghề nghiệp, 34 tỉnh thành mới và 293 trường ĐH.',
          'Bật Ghim Vị Trí VIP đầu trang (sử dụng Vé Hỏa Tốc hoặc phí dịch vụ) và thiết lập quyền xem lại bài làm.'
        ],
        tip: 'Tài khoản Doanh nghiệp được miễn phí 100% phí lọc đối tượng và có thể đính kèm E-Voucher tài trợ.'
      },
      {
        beforeStep(app) {
          setStudioTourState(app, {
            createSurveyTab: 'BUILDER',
            mobileTab: 'SIDEBAR',
            sidebarSubTab: 'BUDGET'
          });
        },
        selectors: ['#studio-sidebar-publish-btn', '#studio-top-publish-btn', '#sidebar-escrow-amount'],
        sectionTag: 'STUDIO • BƯỚC 10/10',
        title: 'Kiểm tra tổng ký quỹ & xuất bản chiến dịch',
        description:
          'Đối chiếu tổng Credit cần khóa sau khi khấu trừ lượt miễn phí và phát hành bài khảo sát lên sàn.',
        bullets: [
          'Nếu chưa đủ Credit, bạn có thể nhấn Lưu Bản Nháp hoặc bấm Nạp Quỹ ngay tại đây.',
          'Bấm Xuất Bản & Khóa Quỹ Ký Quỹ để mở chiến dịch; dùng nút Hướng dẫn Studio khi cần xem lại.'
        ]
      }
    ],

    'voucher-market': [
      {
        selectors: ['#app-root h1', '#app-root'],
        sectionTag: 'VOUCHER • QUY ĐỔI',
        title: 'Chợ E-Voucher chính hãng ngang giá 1:1',
        description:
          'Quy đổi Point tích lũy từ khảo sát (1 Point = 1 VNĐ) lấy mã ưu đãi từ các thương hiệu lớn.',
        bullets: [
          'Hỗ trợ Shopee, Grab, Highlands Coffee, Phúc Long, CGV Cinemas, Starbucks.',
          'Tài khoản Doanh nghiệp chỉ xem góc nhìn tài trợ, không tích lũy và đổi Point.'
        ]
      },
      {
        selectors: ['#app-root > div > div:first-child', '#app-root .bento-card', '#app-root'],
        sectionTag: 'VOUCHER • TỒN KHO',
        title: 'Theo dõi số dư khả dụng & số lượng mã còn lại',
        description:
          'Kiểm tra số dư Point hiện tại ở góc trên và lượng mã tồn kho thực tế trên từng thẻ voucher.',
        bullets: [
          'Mỗi thẻ ghi rõ trị giá quy đổi VNĐ, điều kiện áp dụng và số lượng mã khả dụng.',
          'Chi phí Point được niêm yết minh bạch ngay cạnh nút đổi thưởng.'
        ]
      },
      {
        selectors: ['#app-root button[onclick*="redeemVoucher"]', '#app-root .bento-card', '#app-root'],
        sectionTag: 'VOUCHER • ĐIỀU KIỆN',
        title: 'Đổi mã tức thì & điều kiện uy tín >= 60',
        description:
          'Nhấn Đổi Voucher để nhận mã ngay lập tức vào Ví Voucher khi đủ số dư và đạt chuẩn uy tín.',
        bullets: [
          'Yêu cầu điểm uy tín trust_score >= 60 để đảm bảo tài khoản tham gia khảo sát trung thực.',
          'Mã sau khi đổi hiển thị ngay trong hộp thoại và có nút sao chép 1 chạm.'
        ]
      },
      {
        selectors: ['[data-tour-nav="wallet"]', '[data-tour-mobile-nav="wallet"]', '#user-profile-btn', '#app-root'],
        sectionTag: 'VOUCHER • VÍ TIỀN',
        title: 'Quản lý mã đã đổi & rút tiền mặt tại Ví',
        description:
          'Xem lại toàn bộ mã đã sở hữu trong Ví Voucher Của Tôi hoặc chuyển sang Ví để rút tiền mặt.',
        bullets: [
          'Ngoài E-Voucher, bạn có thể đổi Point lấy thẻ cào từ 10.000đ hoặc rút VietQR/MoMo từ 50.000đ.'
        ]
      }
    ],

    wallet: [
      {
        selectors: ['#app-root button[onclick*="openPayoutModal"]', '#app-root .grid > div:first-child', '#app-root'],
        sectionTag: 'VÍ • POINT ĐỔI THƯỞNG',
        title: 'Thẻ Point & các mốc rút thưởng linh hoạt',
        description:
          'Quản lý số dư điểm thưởng nhận được từ khảo sát và điểm danh (1 Point = 1 VNĐ).',
        bullets: [
          'Từ 10.000đ: đổi thẻ cào điện thoại nhanh chóng.',
          'Từ 50.000đ: rút về ngân hàng VietQR hoặc ví MoMo; từ 100.000đ: miễn phí rút tiền.'
        ]
      },
      {
        selectors: ['#app-root button[onclick*="openDepositModal"]', '#app-root .grid > div:nth-child(2)', '#app-root'],
        sectionTag: 'VÍ • CREDIT KÝ QUỸ',
        title: 'Thẻ Credit: Nạp VietQR & đổi Point nhận +5%',
        description:
          'Credit dùng riêng để ký quỹ tạo khảo sát và tài trợ E-Voucher (van 1 chiều, không rút ngược tiền mặt).',
        bullets: [
          'Nạp trực tiếp bằng mã VietQR EMVCo Timo với tỷ lệ 1 Credit = 1 VNĐ.',
          'Có thể đổi Point sang Credit ngay trong ví để nhận thêm +5% giá trị thưởng điền chéo.'
        ]
      },
      {
        selectors: ['#tab-tx-all', '#wallet-time-dropdown-label', '#wallet-tx-history-section'],
        sectionTag: 'VÍ • BỘ LỌC GIAO DỊCH',
        title: 'Lọc giao dịch theo loại & mốc thời gian',
        description:
          'Tìm nhanh biến động ví theo từng nhóm nghiệp vụ hoặc khoảng thời gian cần đối soát.',
        bullets: [
          'Chuyển nhanh giữa các tab: Tất cả, Nhận thưởng, Đổi Credit và Rút tiền.',
          'Menu thời gian hỗ trợ 7 ngày, 30 ngày, 90 ngày gần đây hoặc toàn bộ lịch sử.'
        ]
      },
      {
        selectors: ['#wallet-tx-list-container', '#wallet-tx-history-section'],
        sectionTag: 'VÍ • BIẾN ĐỘNG CHI TIẾT',
        title: 'Theo dõi trạng thái xử lý từng giao dịch',
        description:
          'Mỗi dòng hiển thị rõ nội dung, thời gian phát sinh, số tiền tăng/giảm và trạng thái hoàn tất.',
        bullets: [
          'Ghi nhận đầy đủ tiền thưởng khảo sát, điểm danh, đổi thưởng, ký quỹ và hoàn tiền mẫu dư.'
        ]
      },
      {
        selectors: ['#wallet-ledger-card'],
        sectionTag: 'VÍ • SỔ CÁI KÉP',
        title: 'Sổ cái đối soát kép minh bạch (Double-Entry)',
        description:
          'Mở rộng bảng Sổ cái để kiểm tra mã giao dịch và số dư trước/sau trên từng bút toán.',
        tip: 'Mọi giao dịch tài chính đều chạy trong transaction ACID để bảo toàn số dư tuyệt đối.'
      }
    ],

    forum: [
      {
        selectors: ['#forum-hub-tab-community', '#forum-current-hub-badge'],
        sectionTag: 'DIỄN ĐÀN • KHÔNG GIAN',
        title: 'Chuyển đổi Cộng Đồng & Góc Sinh Viên',
        description:
          'Khám phá các chủ đề nghiên cứu chung hoặc không gian học thuật dành riêng cho sinh viên.',
        bullets: [
          'Tài khoản đã xác thực email .edu.vn có thể chuyển qua lại giữa Cộng Đồng và Góc Sinh Viên.',
          'Phù hợp để trao đổi kinh nghiệm thiết kế bảng hỏi, chạy SPSS/SmartPLS và điền chéo mẫu.'
        ]
      },
      {
        selectors: ['#app-root button[onclick*="openCreateForumPostModal"]', '#app-root'],
        sectionTag: 'DIỄN ĐÀN • ĐÓNG GÓP',
        title: 'Đăng bài mới & đính kèm khảo sát mời điền',
        description:
          'Tạo bài thảo luận mới để xin góp ý cấu trúc câu hỏi hoặc kêu gọi đáp viên đúng đối tượng.',
        bullets: [
          'Có thể gắn trực tiếp một bài khảo sát của bạn vào bài đăng để mọi người truy cập nhanh.'
        ]
      },
      {
        selectors: ['#forum-search-input', '#forum-scope-buttons-wrapper'],
        sectionTag: 'DIỄN ĐÀN • TÌM KIẾM',
        title: 'Tìm kiếm từ khóa & lọc phạm vi bài viết',
        description:
          'Khoanh vùng nhanh bài đăng theo từ khóa đề tài hoặc phân loại nội dung đang quan tâm.',
        bullets: [
          'Chuyển nhanh phạm vi: Tất cả, Thảo luận, Khảo sát (có form đính kèm) hoặc Của tôi.'
        ]
      },
      {
        selectors: ['#forum-cat-btn', '#forum-sort-btn', '#app-root aside'],
        sectionTag: 'DIỄN ĐÀN • LIÊM CHÍNH IRB',
        title: 'Bộ lọc chuyên ngành & kiểm duyệt chuẩn IRB',
        description:
          'Sắp xếp bài viết theo độ quan tâm, thảo luận sôi nổi và chuyên ngành nghiên cứu.',
        bullets: [
          'Cột bên hiển thị bảng xếp hạng đóng góp điền form, đề tài nổi bật tuần và quy chuẩn đạo đức IRB.',
          'Nội dung đăng tải được kiểm duyệt tự động nhằm giữ môi trường trao đổi sạch và học thuật.'
        ]
      },
      {
        selectors: ['#forum-posts-feed-container', '#app-root'],
        sectionTag: 'DIỄN ĐÀN • TƯƠNG TÁC',
        title: 'Thảo luận & mở khảo sát đính kèm ngay trên feed',
        description:
          'Thả tim, bình luận phản biện thang đo hoặc nhấn vào thẻ khảo sát gắn trong bài để tham gia.',
        tip: 'Góp ý tích cực giúp tăng độ uy tín trong cộng đồng và thu hút nhiều đáp viên hơn cho đề tài của bạn.'
      }
    ],

    'creator-surveys': [
      {
        selectors: ['#app-root h1', '#app-root'],
        sectionTag: 'QUẢN LÝ • CHIẾN DỊCH',
        title: 'Trung tâm quản lý khảo sát đã tạo',
        description:
          'Theo dõi toàn bộ danh sách chiến dịch bạn đang vận hành hoặc lưu dưới dạng bản nháp.',
        bullets: [
          'Quản lý tập trung trạng thái, tiến độ thu thập phản hồi và các thao tác xuất bản/chỉnh sửa.'
        ]
      },
      {
        selectors: [
          '#app-root button[onclick*="openCreateSurveyModal"]',
          '#app-root button[onclick*="openDepositModal"]',
          '#app-root'
        ],
        sectionTag: 'QUẢN LÝ • KHỞI TẠO',
        title: 'Tạo chiến dịch mới & nạp quỹ nhanh',
        description:
          'Mở Form Studio để tạo thêm bảng hỏi hoặc nạp Credit bổ sung trước khi phát hành chiến dịch lớn.',
        bullets: [
          'Nút + Nạp Quỹ giúp bổ sung ngân sách Credit qua VietQR mà không rời khỏi màn hình quản lý.'
        ]
      },
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'QUẢN LÝ • TIẾN ĐỘ',
        title: 'Theo dõi trạng thái DRAFT/PUBLISHED & thanh tiến độ',
        description:
          'Quan sát ngay số lượng mẫu hợp lệ đã thu được trên tổng mục tiêu của từng bài khảo sát.',
        bullets: [
          'Hiển thị rõ huy hiệu trạng thái DRAFT / PUBLISHED, nhãn Ghim VIP và chỉ số phần trăm hoàn thành.'
        ]
      },
      {
        selectors: [
          '#app-root button[onclick*="openEditSurvey"]',
          '#app-root button[onclick*="pinSurveyAction"]',
          '#app-root button[onclick*="confirmDeleteSurvey"]',
          '#app-root .bento-card',
          '#app-root'
        ],
        sectionTag: 'QUẢN LÝ • THAO TÁC',
        title: 'Chỉnh sửa, Ghim VIP & Xóa hoàn quỹ 100%',
        description:
          'Điều chỉnh chiến dịch linh hoạt ngay trên từng thẻ quản lý theo diễn biến thu mẫu thực tế.',
        bullets: [
          'Nút Sửa đưa biểu mẫu vào lại Studio; Ghim VIP giúp đẩy khảo sát lên vị trí đầu trang.',
          'Khi xóa khảo sát, toàn bộ tiền ký quỹ của số mẫu chưa thu được sẽ tự động hoàn 100% về ví.'
        ]
      },
      {
        selectors: [
          '#app-root button[onclick*="navigate(\'analytics\'"]',
          '#app-root button[onclick*="exportSurvey"]',
          '#app-root .bento-card',
          '#app-root'
        ],
        sectionTag: 'QUẢN LÝ • DỮ LIỆU',
        title: 'Xem báo cáo Analytics & xuất dữ liệu CSV',
        description:
          'Phân tích kết quả trực quan theo từng câu hỏi và tải file dữ liệu thô để xử lý chuyên sâu.',
        bullets: [
          'Bấm Báo cáo để mở biểu đồ thống kê, hoặc nhấn biểu tượng Tải xuống để xuất CSV chuẩn hóa.'
        ]
      }
    ],

    profile: [
      {
        beforeStep(app) {
          setProfileTourSubTab(app, 'overview');
        },
        selectors: ['#app-root .grid.grid-cols-1.sm\\:grid-cols-3', '#app-root h1', '#app-root'],
        sectionTag: 'HỒ SƠ • TỔNG QUAN',
        title: 'Thông tin tài khoản & 3 chỉ số cốt lõi',
        description:
          'Theo dõi nhanh phân hạng tài khoản cùng bộ 3 chỉ số quan trọng ngay phần đầu hồ sơ.',
        bullets: [
          'Hiển thị Điểm Uy Tín (/100), Mẫu Miễn Phí khả dụng và Số dư Ví Xu / Credit quy đổi tương đương.',
          'Bạn có thể bấm vào biểu tượng máy ảnh trên avatar để cập nhật ảnh đại diện cá nhân.'
        ]
      },
      {
        beforeStep(app) {
          setProfileTourSubTab(app, 'overview');
        },
        selectors: [
          '#app-root button[onclick*="switchProfileTab(\'STUDENT\')"]',
          '#app-root button[onclick*="switchProfileTab(\'ENTERPRISE\')"]',
          '#app-root h1'
        ],
        sectionTag: 'HỒ SƠ • XÁC THỰC PHÂN HẠNG',
        title: 'Xác thực Sinh viên .edu.vn hoặc Doanh nghiệp',
        description:
          'Mở khóa quyền lợi và mức giá sàn chuyên biệt tương ứng với vai trò sử dụng của bạn.',
        bullets: [
          'Sinh viên xác thực email .edu.vn/.ac.vn được hưởng giá sàn 400-600đ/mẫu và 30 lượt mẫu miễn phí/tháng.',
          'Doanh nghiệp khai báo thương hiệu cấp 1 và pháp nhân/MST cấp 2 để xuất hóa đơn VAT điện tử.'
        ]
      },
      {
        beforeStep(app) {
          setProfileTourSubTab(app, 'overview');
        },
        selectors: ['#profile-tab-overview > div:first-child', '#profile-tab-overview'],
        sectionTag: 'HỒ SƠ • ĐỘ TIN CẬY',
        title: 'Chỉ số chính trực 85 điểm & 5 chốt Anti-Fraud',
        description:
          'Hệ thống khởi tạo trust_score ở mức 85 và đánh giá chất lượng trả lời qua 5 lớp kiểm soát.',
        bullets: [
          'Kiểm tra tốc độ hoàn thành, bẫy tập trung động, phương sai đường thẳng, tự luận rác và điểm uy tín.',
          'Giữ điểm uy tín >= 60 để đổi E-Voucher và nhận ưu tiên phân phối các khảo sát thù lao cao.'
        ]
      },
      {
        beforeStep(app) {
          setProfileTourSubTab(app, 'overview');
        },
        selectors: ['#profile-tab-overview > div:nth-child(2)', '#demo-gender-label', '#profile-tab-overview'],
        sectionTag: 'HỒ SƠ • NHÂN KHẨU HỌC',
        title: 'Khai báo nhân khẩu học & cơ chế khóa 90 ngày',
        description:
          'Cập nhật thông tin tỉnh thành, thu nhập, nghề nghiệp, trường ĐH và ngành học để ghép mẫu chính xác.',
        bullets: [
          'Sau khi lưu, thông tin cốt lõi được khóa an toàn trong 90 ngày để chống giả mạo đối tượng nghiên cứu.'
        ]
      },
      {
        beforeStep(app) {
          setProfileTourSubTab(app, 'surveys');
        },
        selectors: [
          '#profile-tab-surveys',
          '#profile-tab-forum-posts',
          '#app-root button[onclick*="switchProfileTab(\'surveys\')"]'
        ],
        sectionTag: 'HỒ SƠ • LỊCH SỬ HOẠT ĐỘNG',
        title: 'Quản lý khảo sát & bài viết diễn đàn của bạn',
        description:
          'Chuyển đổi nhanh giữa tab Quản Lý Khảo Sát (Form Đã Tạo / Đã Tham Gia) và Bài Viết Diễn Đàn.',
        bullets: [
          'Tra cứu lại lịch sử bài đã điền, điểm thưởng từng bài và quản lý các bài thảo luận đã đăng.'
        ]
      },
      {
        beforeStep(app) {
          setProfileTourSubTab(app, 'security');
        },
        selectors: ['#profile-tab-security', '#app-root'],
        sectionTag: 'HỒ SƠ • BẢO MẬT & PHÁP LÝ',
        title: 'Xác thực TOTP 6 số, APK Android & Quyền DLCN',
        description:
          'Bảo vệ tài khoản đa lớp và thực thi đầy đủ quyền kiểm soát dữ liệu cá nhân của bạn.',
        bullets: [
          'Bật xác thực 2 lớp TOTP (mã 6 số mỗi 30 giây) song song với Email OTP khi đăng nhập.',
          'Hỗ trợ tải APK Android chính thức và thực thi quyền Dữ liệu cá nhân theo Luật 91/2025/QH15.'
        ]
      }
    ],

    'admin-overview': [
      {
        selectors: ['#app-root .mb-5.flex', '#app-root h1', '#app-root'],
        sectionTag: 'QUẢN TRỊ • ĐIỀU HƯỚNG',
        title: 'Phân hệ Quản Trị hợp nhất 5 công cụ',
        description:
          'Chuyển đổi nhanh giữa Tổng Quan, Duyệt Tiền, Gian Lận, Báo Lỗi và Kiểm Toán trong cùng thanh điều hướng phụ.',
        bullets: [
          'Giám sát luồng tiền ký quỹ Escrow, duyệt yêu cầu rút tiền VietQR/thẻ cào và xử lý vi phạm.'
        ]
      },
      {
        selectors: ['#app-root .grid.grid-cols-2', '#app-root'],
        sectionTag: 'QUẢN TRỊ • CHỈ SỐ SÀN',
        title: 'Theo dõi chỉ số kinh tế & người dùng trực tuyến',
        description:
          'Quan sát số phiên đang hoạt động, tỉ lệ giữ chân, phân bổ nguồn khảo sát và biến động sổ cái.',
        bullets: [
          'Hỗ trợ chế độ Toàn Cảnh TV phòng họp và Terminal lệnh nhanh (phím tắt F2).'
        ]
      }
    ]
  };

  const GUEST_LOCKED_SCENARIOS = {
    'create-survey': [
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'TẠO KHẢO SÁT • MỞ KHÓA',
        title: 'Đăng nhập để mở khóa Form Studio',
        description:
          'Tạo khảo sát yêu cầu tài khoản để lưu bản nháp, ký quỹ Credit và quản lý dữ liệu thu thập an toàn.',
        bullets: [
          'Hỗ trợ đăng nhập nhanh hoặc tạo tài khoản mới chỉ trong 30 giây.'
        ]
      },
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'TẠO KHẢO SÁT • 12 ĐỊNH DẠNG',
        title: 'Thiết kế biểu mẫu 12 loại câu hỏi chuyên sâu',
        description:
          'Form Studio cung cấp đầy đủ công cụ soạn thảo từ cơ bản đến nghiên cứu học thuật nâng cao.',
        bullets: [
          'Hỗ trợ trắc nghiệm, hộp kiểm, lưới ma trận, thang Likert, tải tệp, ngày/giờ.',
          'Cho phép chèn ảnh minh họa, video YouTube, phân đoạn trang và rẽ nhánh logic theo đáp án.'
        ]
      },
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'TẠO KHẢO SÁT • NHẬP NHANH',
        title: 'Smart Paste từ Word/Docs & đồng bộ Google/MS Forms',
        description:
          'Không cần nhập tay từng câu nếu bạn đã có sẵn nội dung bảng hỏi bên ngoài.',
        bullets: [
          'Smart Paste tự động bóc tách đề cương dán từ Word, Notion hoặc Google Docs.',
          'Đồng bộ trực tiếp link Google Forms / Microsoft Forms và tự đẩy kết quả về Google Sheets Webhook.'
        ]
      },
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'TẠO KHẢO SÁT • BẢNG GIÁ & LỌC',
        title: 'Định giá 3 phân khúc, SLA & Bộ lọc 34 tỉnh/trường ĐH',
        description:
          'Chi phí minh bạch theo nhóm Sinh viên (.edu.vn), Cá nhân và Doanh nghiệp kèm cam kết hoàn tiền 100% mẫu dư.',
        bullets: [
          'Tùy chọn gói tốc độ thu mẫu (SLA Tiết Kiệm / Đề Xuất / Hỏa Tốc) và thanh tăng thưởng thu hút đáp viên.',
          'Lọc chính xác theo 34 tỉnh thành mới, 293 trường đại học, độ tuổi và ngành nghề.'
        ]
      },
      {
        selectors: [
          '#app-root button[onclick*="openAuthModal(\'login\')"]',
          '#guest-auth-actions',
          '#app-root .bento-card'
        ],
        sectionTag: 'TẠO KHẢO SÁT • BẮT ĐẦU',
        title: 'Nhấn Đăng Nhập Ngay để vào Studio',
        description:
          'Sau khi đăng nhập và mở lại mục Tạo Khảo Sát, hệ thống sẽ tự động bật hướng dẫn chi tiết 10 bước ngay bên trong Studio.',
        tip: 'Sinh viên xác thực email .edu.vn được nhận 30 lượt mẫu miễn phí mỗi tháng và giá sàn ưu đãi.'
      }
    ],

    wallet: [
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'VÍ TIỀN • ĐỔI THƯỞNG',
        title: 'Ví Point & Credit tách biệt minh bạch',
        description:
          'Đăng nhập để quản lý Point kiếm được từ khảo sát (1 Point = 1 VNĐ) và Credit dùng tài trợ chiến dịch.',
        bullets: [
          'Rút thẻ cào từ 10.000đ, rút ngân hàng VietQR/MoMo từ 50.000đ và miễn phí từ 100.000đ.'
        ]
      },
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'VÍ TIỀN • NẠP & ĐỔI CHÉO',
        title: 'Nạp Credit VietQR & thưởng +5% khi đổi Point',
        description:
          'Chuyển đổi Point sang Credit để được cộng thêm +5% ngân sách tạo khảo sát và theo dõi sổ cái đối soát kép.',
        bullets: [
          'Lưu giữ toàn bộ lịch sử giao dịch và mã đối soát theo thời gian thực.'
        ]
      },
      {
        selectors: [
          '#app-root button[onclick*="openAuthModal(\'login\')"]',
          '#guest-auth-actions',
          '#app-root .bento-card'
        ],
        sectionTag: 'VÍ TIỀN • ĐĂNG NHẬP',
        title: 'Đăng nhập để mở khóa Ví & Rút Tiền',
        description:
          'Nhấn Đăng Nhập Ngay để xem số dư thực tế, lịch sử giao dịch và hướng dẫn chi tiết bên trong Ví.'
      }
    ],

    profile: [
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'HỒ SƠ • ĐỊNH DANH',
        title: 'Quản lý hồ sơ & chỉ số uy tín cá nhân',
        description:
          'Đăng nhập để cập nhật nhân khẩu học, theo dõi điểm trust_score (khởi tạo 85) và quản lý khảo sát đã tham gia.',
        bullets: [
          'Hồ sơ đầy đủ giúp bạn nhận được nhiều khảo sát phù hợp với thù lao cao hơn.'
        ]
      },
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'HỒ SƠ • XÁC THỰC & BẢO MẬT',
        title: 'Xác thực .edu.vn, TOTP 2FA & khóa 90 ngày',
        description:
          'Hỗ trợ xác thực email sinh viên, hồ sơ Doanh nghiệp VAT, bảo mật TOTP 6 số và quyền dữ liệu theo Luật 91/2025/QH15.'
      },
      {
        selectors: [
          '#app-root button[onclick*="openAuthModal(\'login\')"]',
          '#guest-auth-actions',
          '#app-root .bento-card'
        ],
        sectionTag: 'HỒ SƠ • ĐĂNG NHẬP',
        title: 'Đăng nhập để truy cập Hồ Sơ Tài Khoản',
        description:
          'Nhấn Đăng Nhập Ngay hoặc Tạo Tài Khoản để thiết lập hồ sơ nghiên cứu của riêng bạn.'
      }
    ],

    'creator-surveys': [
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'KHẢO SÁT CỦA TÔI • QUẢN LÝ',
        title: 'Theo dõi chiến dịch & tiến độ thu mẫu',
        description:
          'Đăng nhập để quản lý toàn bộ khảo sát bạn đã tạo hoặc lưu nháp trên một màn hình tập trung.',
        bullets: [
          'Theo dõi số phản hồi đã thu, trạng thái DRAFT/PUBLISHED và tiến độ hoàn thành theo thời gian thực.'
        ]
      },
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'KHẢO SÁT CỦA TÔI • PHÂN TÍCH',
        title: 'Ghim VIP, Analytics trực quan & Xuất CSV',
        description:
          'Hỗ trợ sửa câu hỏi, bật Ghim VIP đầu trang, xem biểu đồ phân tích và tải dữ liệu CSV sạch.'
      },
      {
        selectors: [
          '#app-root button[onclick*="openAuthModal(\'login\')"]',
          '#guest-auth-actions',
          '#app-root .bento-card'
        ],
        sectionTag: 'KHẢO SÁT CỦA TÔI • ĐĂNG NHẬP',
        title: 'Đăng nhập để xem chiến dịch của bạn',
        description:
          'Nhấn Đăng Nhập Ngay để mở danh sách khảo sát đã tạo và xem hướng dẫn quản lý chi tiết.'
      }
    ],

    'my-vouchers': [
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'VÍ VOUCHER • QUÀ TẶNG',
        title: 'Lưu trữ toàn bộ mã E-Voucher đã sở hữu',
        description:
          'Đăng nhập để xem lại các mã ưu đãi đã đổi từ Chợ Voucher hoặc nhận thưởng từ khảo sát tài trợ.',
        bullets: [
          'Hỗ trợ sao chép mã nhanh 1 chạm và theo dõi ngày nhận chi tiết.'
        ]
      },
      {
        selectors: ['#app-root .bento-card', '#app-root'],
        sectionTag: 'VÍ VOUCHER • CHỢ ĐỔI THƯỞNG',
        title: 'Kết nối trực tiếp với Chợ Voucher 1:1',
        description:
          'Dùng Point tích lũy từ việc hoàn thành khảo sát để đổi lấy thẻ quà tặng Shopee, Grab, Highlands, CGV.'
      },
      {
        selectors: [
          '#app-root button[onclick*="openAuthModal(\'login\')"]',
          '#guest-auth-actions',
          '#app-root .bento-card'
        ],
        sectionTag: 'VÍ VOUCHER • ĐĂNG NHẬP',
        title: 'Đăng nhập để mở Ví Voucher Của Tôi',
        description:
          'Nhấn Đăng Nhập Ngay để truy cập kho mã quà tặng cá nhân.'
      }
    ]
  };

  let autoTourTimer = null;
  let rafId = null;
  let activeTour = null;
  let boundHandlers = null;
  let capturedInitialState = null;

  function readSeenMap() {
    try {
      const raw = localStorage.getItem(STORAGE_SEEN_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeSeenTab(seenKey) {
    if (!seenKey) return;
    try {
      const map = readSeenMap();
      map[seenKey] = true;
      localStorage.setItem(STORAGE_SEEN_KEY, JSON.stringify(map));
    } catch (_) {
      // Bo qua neu localStorage bi chan
    }
  }

  function isAutoTourDisabled() {
    try {
      return localStorage.getItem(STORAGE_DISABLED_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findVisibleTarget(selectors) {
    if (!Array.isArray(selectors)) return null;
    for (let i = 0; i < selectors.length; i += 1) {
      const sel = selectors[i];
      if (!sel || typeof sel !== 'string') continue;
      let nodes;
      try {
        nodes = document.querySelectorAll(sel);
      } catch (_) {
        continue;
      }
      for (let j = 0; j < nodes.length; j += 1) {
        if (isElementVisible(nodes[j])) {
          return nodes[j];
        }
      }
    }
    return null;
  }

  function resolveStepTarget(step) {
    if (!step) return null;
    return findVisibleTarget(step.selectors);
  }

  function resolveTourContext(app, rawTabId) {
    const state = (app && app.state) || (window.VibeApp && window.VibeApp.state) || {};
    const rawTab = rawTabId || state.currentTab || 'home';
    const normalizedTab = normalizeTourTabId(rawTab);

    if (['home', 'take-survey', 'review-survey'].includes(normalizedTab)) {
      return {
        isGuestLocked: false,
        targetTab: normalizedTab,
        seenKey: normalizedTab,
        scenario: null
      };
    }

    const isLoggedIn = Boolean(state.currentUser);
    const guestCandidate = rawTab === 'my-vouchers' ? 'my-vouchers' : normalizedTab;

    if (!isLoggedIn && GUEST_LOCKED_TABS.includes(guestCandidate)) {
      return {
        isGuestLocked: true,
        targetTab: guestCandidate,
        seenKey: `guest_${guestCandidate}`,
        scenario: GUEST_LOCKED_SCENARIOS[guestCandidate] || []
      };
    }

    if (TOUR_SCENARIOS[normalizedTab]) {
      return {
        isGuestLocked: false,
        targetTab: normalizedTab,
        seenKey: normalizedTab,
        scenario: TOUR_SCENARIOS[normalizedTab]
      };
    }

    return {
      isGuestLocked: false,
      targetTab: normalizedTab,
      seenKey: normalizedTab,
      scenario: null
    };
  }

  function resolveStepsForTab(tabId, stepsConfig) {
    const scenario = Array.isArray(stepsConfig) ? stepsConfig : TOUR_SCENARIOS[tabId] || [];
    const deferTargetResolution = tabId === 'create-survey' || tabId === 'profile';
    const resolved = [];

    for (let i = 0; i < scenario.length; i += 1) {
      const step = scenario[i];
      const hasBeforeStep = typeof step.beforeStep === 'function';
      const target = hasBeforeStep ? null : findVisibleTarget(step.selectors);

      if (target || hasBeforeStep || deferTargetResolution) {
        resolved.push({
          selectors: step.selectors,
          sectionTag: step.sectionTag || '',
          title: step.title,
          description: step.description,
          bullets: Array.isArray(step.bullets) ? step.bullets : [],
          tip: step.tip || '',
          beforeStep: hasBeforeStep ? step.beforeStep : null,
          target: target || null
        });
      }
    }
    return resolved;
  }

  function captureInitialViewState(tabId) {
    const app = window.VibeApp;
    const state = app && app.state ? app.state : null;
    if (!state || !state.currentUser) {
      capturedInitialState = null;
      return null;
    }

    if (tabId === 'create-survey') {
      capturedInitialState = {
        tabId: 'create-survey',
        createSurveyTab: state.createSurveyTab || 'BUILDER',
        studioSidebarSubTab: state.studioSidebarSubTab || 'BUDGET',
        mobileStudioActiveTab: state.mobileStudioActiveTab || 'CANVAS'
      };
      return capturedInitialState;
    }

    if (tabId === 'profile') {
      capturedInitialState = {
        tabId: 'profile',
        profileTab: state.profileTab || 'overview'
      };
      return capturedInitialState;
    }

    capturedInitialState = null;
    return null;
  }

  function restoreInitialViewState() {
    const snapshot = capturedInitialState;
    capturedInitialState = null;
    if (!snapshot) return;

    const app = window.VibeApp;
    if (!app || !app.state || !app.state.currentUser) return;

    const currentNormalized = normalizeTourTabId(app.state.currentTab || '');
    if (snapshot.tabId === 'create-survey') {
      const hasStudioDom =
        Boolean(document.getElementById('studio-canvas-scroll')) ||
        Boolean(document.getElementById('studio-sidebar-root'));
      if (!hasStudioDom || (currentNormalized && currentNormalized !== 'create-survey')) return;

      setStudioTourState(app, {
        createSurveyTab: snapshot.createSurveyTab,
        sidebarSubTab: snapshot.studioSidebarSubTab,
        mobileTab: snapshot.mobileStudioActiveTab
      });
    } else if (snapshot.tabId === 'profile') {
      const hasProfileDom = Boolean(document.getElementById('profile-tab-overview'));
      if (!hasProfileDom || (currentNormalized && currentNormalized !== 'profile')) return;

      setProfileTourSubTab(app, snapshot.profileTab);
    }
  }

  function getBottomSafeMargin() {
    return window.innerWidth < 768
      ? VIEWPORT_MARGIN + MOBILE_BOTTOM_NAV_RESERVE
      : VIEWPORT_MARGIN;
  }

  function ensureRootContainer() {
    let root = document.getElementById('survhub-onboarding-root');
    if (root) return root;

    root = document.createElement('div');
    root.id = 'survhub-onboarding-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Hướng dẫn sử dụng theo ngữ cảnh');

    root.innerHTML = [
      '<div class="survhub-tour-backdrop" data-tour-action="close"></div>',
      '<div class="survhub-tour-spotlight" aria-hidden="true"></div>',
      '<div class="survhub-tour-popover" tabindex="-1"></div>'
    ].join('');

    root.addEventListener('click', (event) => {
      const actionEl = event.target.closest('[data-tour-action]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-tour-action');
      if (action === 'close') {
        OnboardingTourModule.closeOnboardingTour.call(window.VibeApp, true);
      } else if (action === 'next') {
        OnboardingTourModule.nextTourStep.call(window.VibeApp);
      } else if (action === 'prev') {
        OnboardingTourModule.prevTourStep.call(window.VibeApp);
      } else if (action === 'disable') {
        OnboardingTourModule.disableAllAutoTours.call(window.VibeApp);
      } else if (action === 'jump') {
        const idx = parseInt(actionEl.getAttribute('data-tour-step-idx'), 10);
        if (!Number.isNaN(idx)) {
          OnboardingTourModule.jumpToTourStep.call(window.VibeApp, idx);
        }
      }
    });

    document.body.appendChild(root);
    return root;
  }

  function refreshIcons() {
    if (window.VibeUtils && typeof window.VibeUtils.refreshIcons === 'function') {
      window.VibeUtils.refreshIcons();
    } else if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function renderCurrentPopover() {
    if (!activeTour) return;
    const root = ensureRootContainer();
    const popoverEl = root.querySelector('.survhub-tour-popover');
    if (!popoverEl) return;

    const total = activeTour.steps.length;
    const index = activeTour.stepIndex;
    const step = activeTour.steps[index];
    const isFirst = index === 0;
    const isLast = index === total - 1;

    const jumperHtml =
      total > 1
        ? `
          <div class="survhub-tour-step-jumper" role="tablist" aria-label="Chọn nhanh bước hướng dẫn">
            ${activeTour.steps
              .map(
                (_, idx) => `
                <button type="button"
                        class="survhub-tour-step-pill ${idx === index ? 'is-active' : ''}"
                        data-tour-action="jump"
                        data-tour-step-idx="${idx}"
                        aria-label="Đến bước ${idx + 1}"
                        ${idx === index ? 'aria-current="step"' : ''}>
                  ${idx + 1}
                </button>
              `
              )
              .join('')}
          </div>
        `
        : '';

    const bulletsHtml =
      Array.isArray(step.bullets) && step.bullets.length > 0
        ? `
          <ul class="survhub-tour-bullets">
            ${step.bullets
              .map(
                (item) => `
                <li class="survhub-tour-bullet-item">
                  <span class="survhub-tour-bullet-dot" aria-hidden="true"></span>
                  <span>${escapeHtml(item)}</span>
                </li>
              `
              )
              .join('')}
          </ul>
        `
        : '';

    const tipHtml = step.tip
      ? `
        <div class="survhub-tour-tip">
          <i data-lucide="info" class="w-3.5 h-3.5 shrink-0"></i>
          <span>${escapeHtml(step.tip)}</span>
        </div>
      `
      : '';

    popoverEl.innerHTML = `
      <div class="survhub-tour-popover-header">
        <div class="survhub-tour-header-meta">
          <span class="survhub-tour-step-badge">${index + 1}/${total}</span>
          ${
            step.sectionTag
              ? `<span class="survhub-tour-section-tag">${escapeHtml(step.sectionTag)}</span>`
              : ''
          }
        </div>
        <button type="button" class="survhub-tour-close-btn" data-tour-action="close" aria-label="Đóng hướng dẫn">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
      <div class="survhub-tour-popover-body">
        ${jumperHtml}
        <h3 class="survhub-tour-title">${escapeHtml(step.title)}</h3>
        <p class="survhub-tour-desc">${escapeHtml(step.description)}</p>
        ${bulletsHtml}
        ${tipHtml}
      </div>
      <div class="survhub-tour-popover-footer">
        <div class="survhub-tour-footer-links">
          <button type="button" class="survhub-tour-link-btn" data-tour-action="disable">Tắt tự động</button>
          <button type="button" class="survhub-tour-link-btn" data-tour-action="close">Bỏ qua</button>
        </div>
        <div class="survhub-tour-footer-nav">
          <button type="button" class="survhub-tour-btn-secondary" data-tour-action="prev" ${isFirst ? 'disabled' : ''}>
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
            <span>Quay lại</span>
          </button>
          <button type="button" class="survhub-tour-btn-primary" data-tour-action="next">
            <span>${isLast ? 'Hoàn tất' : 'Tiếp theo'}</span>
            <i data-lucide="${isLast ? 'check' : 'chevron-right'}" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    refreshIcons();
  }

  function updateSpotlightAndPopoverPosition() {
    if (!activeTour) return;
    const root = document.getElementById('survhub-onboarding-root');
    if (!root) return;

    const spotlightEl = root.querySelector('.survhub-tour-spotlight');
    const popoverEl = root.querySelector('.survhub-tour-popover');
    if (!spotlightEl || !popoverEl) return;

    const step = activeTour.steps[activeTour.stepIndex];
    let target = step ? step.target : null;
    if (step && !isElementVisible(target)) {
      target = resolveStepTarget(step);
      if (target) {
        step.target = target;
      }
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bottomSafe = getBottomSafeMargin();

    if (!target) {
      spotlightEl.style.opacity = '0';
      const popRect = popoverEl.getBoundingClientRect();
      const left = Math.max(VIEWPORT_MARGIN, (vw - popRect.width) / 2);
      const top = Math.max(VIEWPORT_MARGIN, (vh - bottomSafe - popRect.height) / 2);
      popoverEl.style.left = `${Math.round(left)}px`;
      popoverEl.style.top = `${Math.round(top)}px`;
      return;
    }

    const rawRect = target.getBoundingClientRect();
    const spotLeft = Math.max(4, rawRect.left - SPOTLIGHT_PADDING);
    const spotTop = Math.max(4, rawRect.top - SPOTLIGHT_PADDING);
    const spotRight = Math.min(vw - 4, rawRect.right + SPOTLIGHT_PADDING);
    const spotBottom = Math.min(vh - 4, rawRect.bottom + SPOTLIGHT_PADDING);
    const spotWidth = Math.max(24, spotRight - spotLeft);
    const spotHeight = Math.max(24, spotBottom - spotTop);

    spotlightEl.style.opacity = '1';
    spotlightEl.style.left = `${Math.round(spotLeft)}px`;
    spotlightEl.style.top = `${Math.round(spotTop)}px`;
    spotlightEl.style.width = `${Math.round(spotWidth)}px`;
    spotlightEl.style.height = `${Math.round(spotHeight)}px`;

    const popRect = popoverEl.getBoundingClientRect();
    const popWidth = popRect.width || Math.min(430, vw - VIEWPORT_MARGIN * 2);
    const popHeight = popRect.height || 260;

    const maxLeft = Math.max(VIEWPORT_MARGIN, vw - popWidth - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, vh - popHeight - bottomSafe);

    let popLeft = rawRect.left + (rawRect.width - popWidth) / 2;
    popLeft = Math.min(Math.max(VIEWPORT_MARGIN, popLeft), maxLeft);

    const spaceBelow = vh - bottomSafe - (spotTop + spotHeight + POPOVER_GAP);
    const spaceAbove = spotTop - POPOVER_GAP - VIEWPORT_MARGIN;
    const spaceRight = vw - VIEWPORT_MARGIN - (spotLeft + spotWidth + POPOVER_GAP);
    const spaceLeft = spotLeft - POPOVER_GAP - VIEWPORT_MARGIN;

    let popTop;
    if (spaceBelow >= popHeight) {
      popTop = spotTop + spotHeight + POPOVER_GAP;
    } else if (spaceAbove >= popHeight) {
      popTop = spotTop - POPOVER_GAP - popHeight;
    } else if (spaceRight >= popWidth) {
      popLeft = Math.min(spotLeft + spotWidth + POPOVER_GAP, maxLeft);
      popTop = Math.min(Math.max(VIEWPORT_MARGIN, spotTop), maxTop);
    } else if (spaceLeft >= popWidth) {
      popLeft = Math.max(VIEWPORT_MARGIN, spotLeft - POPOVER_GAP - popWidth);
      popTop = Math.min(Math.max(VIEWPORT_MARGIN, spotTop), maxTop);
    } else {
      popTop = (vh - bottomSafe - popHeight) / 2;
    }

    popTop = Math.min(Math.max(VIEWPORT_MARGIN, popTop), maxTop);

    popoverEl.style.left = `${Math.round(popLeft)}px`;
    popoverEl.style.top = `${Math.round(popTop)}px`;
  }

  function schedulePositionUpdate() {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      updateSpotlightAndPopoverPosition();
    });
  }

  function scrollTargetIntoViewIfNeeded(target) {
    if (!target || typeof target.scrollIntoView !== 'function') return;
    const rect = target.getBoundingClientRect();
    const vh = window.innerHeight;
    const topSafe = Math.max(VIEWPORT_MARGIN, 72);
    const bottomSafe = getBottomSafeMargin();
    const isLargeContainer = rect.height > vh * 0.72;

    if (isLargeContainer) {
      if (rect.bottom < topSafe + 40 || rect.top > vh - bottomSafe - 40) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      }
      return;
    }

    let clippedByScrollParent = false;
    let parent = target.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      if (/(auto|scroll)/.test(style.overflowY || '') && parent.scrollHeight > parent.clientHeight) {
        const pRect = parent.getBoundingClientRect();
        if (rect.top < pRect.top + 8 || rect.bottom > pRect.bottom - 8) {
          clippedByScrollParent = true;
          break;
        }
      }
      parent = parent.parentElement;
    }

    const inView = !clippedByScrollParent && rect.top >= topSafe && rect.bottom <= vh - bottomSafe;
    if (!inView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }

  function bindGlobalListeners() {
    if (boundHandlers) return;
    const onResizeOrScroll = () => {
      schedulePositionUpdate();
    };
    const onKeyDown = (event) => {
      if (!activeTour) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        OnboardingTourModule.closeOnboardingTour.call(window.VibeApp, true);
        return;
      }

      const tag = event.target && event.target.tagName ? event.target.tagName.toUpperCase() : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (event.target && event.target.isContentEditable)) {
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        OnboardingTourModule.nextTourStep.call(window.VibeApp);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        OnboardingTourModule.prevTourStep.call(window.VibeApp);
      }
    };

    window.addEventListener('resize', onResizeOrScroll, { passive: true });
    window.addEventListener('scroll', onResizeOrScroll, { passive: true, capture: true });
    document.addEventListener('keydown', onKeyDown);

    boundHandlers = { onResizeOrScroll, onKeyDown };
  }

  function unbindGlobalListeners() {
    if (!boundHandlers) return;
    window.removeEventListener('resize', boundHandlers.onResizeOrScroll, { passive: true });
    window.removeEventListener('scroll', boundHandlers.onResizeOrScroll, { passive: true, capture: true });
    document.removeEventListener('keydown', boundHandlers.onKeyDown);
    boundHandlers = null;
  }

  function renderCurrentStep() {
    if (!activeTour) return;
    const step = activeTour.steps[activeTour.stepIndex];
    if (!step) return;

    if (typeof step.beforeStep === 'function') {
      try {
        step.beforeStep(window.VibeApp);
      } catch (_) {
        // Bo qua loi chuyen sub-tab de khong lam gian doan tour
      }
    }

    const target = resolveStepTarget(step);
    step.target = target;

    if (target) {
      scrollTargetIntoViewIfNeeded(target);
    }

    renderCurrentPopover();
    updateSpotlightAndPopoverPosition();

    window.setTimeout(() => {
      if (!activeTour) return;
      const currentStep = activeTour.steps[activeTour.stepIndex];
      if (currentStep === step) {
        const refreshedTarget = resolveStepTarget(step);
        if (refreshedTarget) {
          step.target = refreshedTarget;
        }
        updateSpotlightAndPopoverPosition();
      }
    }, 240);
  }

  const OnboardingTourModule = {
    triggerAutoTourForTab(tabId) {
      if (!tabId || ['home', 'take-survey', 'review-survey'].includes(normalizeTourTabId(tabId))) {
        return;
      }
      if (isAutoTourDisabled()) return;

      const context = resolveTourContext(this, tabId);
      if (!context.scenario || context.scenario.length === 0) return;

      const seenMap = readSeenMap();
      if (seenMap[context.seenKey]) return;

      if (autoTourTimer !== null) {
        window.clearTimeout(autoTourTimer);
        autoTourTimer = null;
      }

      autoTourTimer = window.setTimeout(() => {
        autoTourTimer = null;
        if (typeof this.startContextualTour === 'function') {
          this.startContextualTour(false, tabId);
        }
      }, AUTO_TRIGGER_DELAY_MS);
    },

    startContextualTour(forceManual = true, tabId = null) {
      const context = resolveTourContext(this, tabId);
      if (!context.scenario || context.scenario.length === 0) {
        if (forceManual && typeof this.showToast === 'function') {
          this.showToast('Trang chủ giới thiệu không có hướng dẫn. Hãy mở Khảo Sát, Tạo Khảo Sát hoặc các mục chức năng để xem hướng dẫn chi tiết.', 'info');
        }
        return;
      }

      if (typeof this.closeAllCustomDropdowns === 'function') {
        this.closeAllCustomDropdowns();
      }

      if (activeTour) {
        this.closeOnboardingTour(false);
      }

      const steps = resolveStepsForTab(context.targetTab, context.scenario);
      if (steps.length === 0) {
        if (forceManual && typeof this.showToast === 'function') {
          this.showToast('Không có mục hướng dẫn khả dụng trên màn hình này.', 'info');
        }
        return;
      }

      if (!context.isGuestLocked) {
        captureInitialViewState(context.targetTab);
      } else {
        capturedInitialState = null;
      }

      activeTour = {
        tabId: context.targetTab,
        seenKey: context.seenKey,
        isGuestLocked: context.isGuestLocked,
        steps,
        stepIndex: 0
      };

      bindGlobalListeners();
      renderCurrentStep();
    },

    nextTourStep() {
      if (!activeTour) return;
      if (activeTour.stepIndex < activeTour.steps.length - 1) {
        activeTour.stepIndex += 1;
        renderCurrentStep();
      } else {
        this.closeOnboardingTour(true);
      }
    },

    prevTourStep() {
      if (!activeTour) return;
      if (activeTour.stepIndex > 0) {
        activeTour.stepIndex -= 1;
        renderCurrentStep();
      }
    },

    jumpToTourStep(stepIdx) {
      if (!activeTour) return;
      const idx = Number(stepIdx);
      if (!Number.isInteger(idx) || idx < 0 || idx >= activeTour.steps.length) return;
      if (idx === activeTour.stepIndex) return;
      activeTour.stepIndex = idx;
      renderCurrentStep();
    },

    closeOnboardingTour(markSeen = true) {
      if (autoTourTimer !== null) {
        window.clearTimeout(autoTourTimer);
        autoTourTimer = null;
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }

      if (markSeen && activeTour && activeTour.seenKey) {
        writeSeenTab(activeTour.seenKey);
      }

      activeTour = null;
      unbindGlobalListeners();

      const root = document.getElementById('survhub-onboarding-root');
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }

      restoreInitialViewState();
    },

    disableAllAutoTours() {
      try {
        localStorage.setItem(STORAGE_DISABLED_KEY, '1');
      } catch (_) {
        // Bo qua neu localStorage bi chan
      }
      this.closeOnboardingTour(true);
      if (typeof this.showToast === 'function') {
        this.showToast('Đã tắt hướng dẫn tự động. Bạn vẫn có thể mở lại từ nút Hướng dẫn.', 'info');
      }
    }
  };

  Object.assign(window.VibeApp, OnboardingTourModule);
  window.OnboardingTourModule = OnboardingTourModule;
})();
