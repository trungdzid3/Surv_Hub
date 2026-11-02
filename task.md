# TASK: FIX MICROSOFT FORMS PARSER (SECTION DESCRIPTIVE QUESTIONS, BRANCH INFO & RESTRICTION BOUNDARIES)

## BẢNG MA TRẬN PHÂN QUYỀN VÀ KHÓA FILE (AGENT FILE LOCK & SKILL MATRIX)

- [x] Task 1: Nâng cấp Form Parser Service hỗ trợ URL DesignPageV2, bóc tách descriptiveQuestions làm SECTION_HEADER, trích xuất BranchInfo chính chủ và bóc tách numberMinBoundary/numberMaxBoundary cho dải số | [Agent: Subagent-BE-1] | [Skill: minimalist-ui] | [Locked Files: server/services/formParserService.js]
- [x] Task 2: Cập nhật Frontend Client hỗ trợ chuẩn hóa link DesignPageV2 sang ResponsePage và bảo toàn dải số khi import | [Agent: Subagent-FE-1] | [Skill: minimalist-ui] | [Locked Files: public/app.js]
- [x] Task 3: Chạy toàn bộ 17/17 test suites, kiểm thử import form thật Microsoft Forms và kiểm tra cú pháp node -c | [Agent: Subagent-QA-1] | [Skill: chrome-devtools] | [Locked Files: tests/test_full_msforms_branching.js]
