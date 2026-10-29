# Kế hoạch triển khai Prompt 03

## 1. Phạm vi

Chỉ bổ sung UX guidance, business context, cross-module navigation và Guided Demo. Không thay đổi business rules, domain transitions, routes, mock relationships hoặc triển khai các workflow thuộc Prompt 04.

## 2. Tài liệu đầu vào đã kiểm tra

- SRS gốc: `D:\vagoge\cmp\doc\SRS_CMP_v1.3.docx`.
- 5 tài liệu trong `docs/prototype-assessment`.
- 7 tài liệu trong `docs/prototype-business-review`.
- Không thiếu tài liệu được yêu cầu.

## 3. Files dự kiến tạo

- `src/components/cmp/business-context-help.tsx`: help dialog, relationship explanation, next-step links và simulation notice tái sử dụng.
- `src/components/cmp/guided-demo.tsx`: scenario catalog, Zustand UI-only progress store, panel trong Simulator và dock toàn cục.
- `docs/prototype-implementation/prompt-03-implementation-report.md`: báo cáo sau triển khai.

## 4. Files dự kiến chỉnh sửa

- `src/config/nav.ts`: business-friendly labels/descriptions, giải thích P3.
- `src/components/app-sidebar.tsx`: tooltip mô tả module và nhãn trạng thái prototype rõ hơn.
- `src/components/layouts/base-layout.tsx`: render Guided Demo dock toàn cục để progress tiếp tục khi sang Records/Evidence.
- `src/app/purposes.tsx`, `consents.tsx`, `notices.tsx`, `banners.tsx`, `rules.tsx`, `records.tsx`, `evidence.tsx`, `simulator.tsx`, `p3.tsx`: business help, relationship explanation, next-step navigation và simulation labels ở vị trí phù hợp.

Không dự kiến sửa `src/lib/store.ts`, `src/lib/types.ts`, route definitions hoặc mock data.

## 5. Guided Demo architecture

- Một Zustand store riêng chỉ giữ trạng thái hướng dẫn: scenario ID, step index, baseline event count và manual confirmations.
- Store không gọi mutation nghiệp vụ và không reset dữ liệu domain.
- Sáu scenario: Accept, Reject, Withdraw, Re-consent, Sensitive Consent, CMP Unavailable.
- Step có route/tab, explanation, expected action/result và verification mode.
- Verification tự động chỉ đọc event mới từ existing `useStore`; các bước không thể kiểm tra bằng state hiển thị “Cần xác nhận thủ công”.
- `GuidedDemoPanel` nằm trong Simulator để chọn/start scenario.
- `GuidedDemoDock` nằm ở AppLayout và chỉ hiện khi demo active; nhờ vậy progress được giữ khi điều hướng sang Records/Evidence/Dashboard/Integrations.
- Navigation dùng React Router hiện tại; không thay router.

## 6. Cross-module navigation

- Purpose Active → Consent.
- Consent Active → Notice.
- Notice Published → Banner.
- Banner Active → Simulator.
- Simulator → Records, Evidence, Dashboard, Integrations.
- Evidence → Records và Audit nếu role có quyền.

Links chỉ xuất hiện khi trạng thái phù hợp và được lọc bằng `useCan`; không tạo hoặc thay đổi dữ liệu.

## 7. Screens cải thiện

Ưu tiên Purpose, Consent, Notice, Banner, Rules/Matrix, Records, Evidence, Simulator, Integrations và Rights. Các page descriptions hiện đã rõ sẽ được giữ; help bổ sung nằm trong dialog/collapsible để tránh lặp và làm rối.

## 8. Validation

- `npm run build`/`tsc -b`.
- ESLint hiện có.
- Tìm và chạy test nếu repository có test.
- Browser walkthrough nếu môi trường cho phép: start/exit demo, manual/auto step, navigate Records/Evidence và quay lại Simulator; smoke test các workflow hiện hữu.

## 9. Regression risks

- Guided store vô tình tác động domain store: phòng tránh bằng store riêng và read-only checks.
- Panel làm Simulator quá dài: dùng compact card/dialog/dock.
- Permission leak qua links: lọc bằng existing `useCan`.
- Hooks/order hoặc circular import: guided component chỉ import public store/router/UI primitives.
- Fast Refresh warnings: constants/store đặt file component có thể tạo warning; chấp nhận warning cũ hoặc tách definitions nếu warning mới xuất hiện.

## 10. Điểm chưa rõ và quyết định an toàn

- Simulator có phải product feature lâu dài chưa được BA chốt; Prompt 03 yêu cầu triển khai Guided Demo nên giữ như demo utility.
- Console bilingual chưa được chốt; không triển khai i18n trong Prompt 03.
- Không triển khai Rights/App/Connector/Scanner/Key/Metering workflow; chỉ giải thích mức mô phỏng và dependency Prompt 04.
- Không thay tên enum/status nội bộ; chỉ thay display labels/descriptions.
