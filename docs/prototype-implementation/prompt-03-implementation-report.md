# Báo cáo triển khai Prompt 03 — UX Clarity & Guided Demo

## 1. Tóm tắt triển khai

Prompt 03 đã bổ sung một lớp hướng dẫn nghiệp vụ trên Prototype CMP hiện tại mà không thay đổi business rules, domain types, routes, mock relationships hoặc các action nghiệp vụ trong Zustand store.

- 11 màn hình/ngữ cảnh nghiệp vụ chính được cải thiện: Purpose, Consent Configuration, Notice, Banner (danh sách và editor), Rules & Dependency Matrix, Consent Records, Evidence, Collection Simulator, Rights Management và Integrations.
- 6 reusable UI components được bổ sung qua 2 file mới.
- 6 kịch bản Guided Demo được đưa vào Collection Simulator.
- 13 liên kết điều hướng theo bước nghiệp vụ được bổ sung.
- Không bổ sung backend, database, API thật, authentication server hoặc external integration.

## 2. File đã thay đổi

### File mới

- `src/components/cmp/business-context-help.tsx`
- `src/components/cmp/guided-demo.tsx`
- `docs/prototype-implementation/prompt-03-plan.md`
- `docs/prototype-implementation/prompt-03-implementation-report.md`

### File cập nhật

- `src/config/nav.ts`
- `src/components/app-sidebar.tsx`
- `src/components/layouts/base-layout.tsx`
- `src/app/simulator.tsx`
- `src/app/purposes.tsx`
- `src/app/consents.tsx`
- `src/app/notices.tsx`
- `src/app/banners.tsx`
- `src/app/rules.tsx`
- `src/app/records.tsx`
- `src/app/evidence.tsx`
- `src/app/p3.tsx`

## 3. Components đã tạo

| Component | Vai trò |
|---|---|
| `BusinessContextHelp` | Dialog giải thích mục đích, actor, input, output, thời điểm sử dụng, quan hệ module và ví dụ nghiệp vụ. |
| `RelationshipNote` | Giải thích ngắn các cặp khái niệm dễ nhầm như Purpose–Consent, Notice–Banner và Records–Evidence. |
| `SimulationNotice` | Cảnh báo minh bạch rằng chức năng bảo mật/tích hợp đang được mô phỏng. |
| `WorkflowNextSteps` | Hiển thị next-step có kiểm tra permission hiện hành, chỉ điều hướng và không tạo dữ liệu. |
| `GuidedDemoPanel` | Chọn scenario và hướng dẫn từng bước ngay trong Collection Simulator. |
| `GuidedDemoDock` | Giữ hướng dẫn trong phiên khi người dùng rời Simulator để kiểm tra Records, Evidence hoặc Dashboard. |

## 4. Cải thiện Business Clarity và UX

- Sidebar có mô tả ngắn cho từng module; tooltip cho biết mục đích thay vì chỉ lặp lại tên menu.
- Nhãn kỹ thuật được giữ nguyên khi cần tương thích nghiệp vụ, đồng thời bổ sung tên/mô tả tiếng Việt dễ hiểu.
- Các nhãn `P3` được trình bày thành `Mô phỏng`; khu vực P3 giải thích rõ chưa phải tích hợp production.
- Các mô phỏng WORM, hash, JWS/JWE, KMS/HSM, webhook, email, SSO và external integration được gắn cảnh báo phù hợp tại các ngữ cảnh liên quan.
- Simulator phân biệt rõ các vai trò: Khách hàng, Nhân viên cấu hình/DPO, Ứng dụng tích hợp và Hệ thống mô phỏng.
- Mỗi tab Simulator có mô tả mục đích, input/output và thao tác khởi đầu.
- Các mối quan hệ Purpose → Consent, Consent → Notice → Banner và Records ↔ Evidence được diễn giải tại màn hình liên quan.

## 5. Cross-module navigation

Các liên kết mới chỉ xuất hiện khi phù hợp với trạng thái màn hình và permission hiện có; không tự động thay đổi state.

- Purpose → Consent Configuration: 1.
- Consent Configuration → Notice: 1.
- Notice → Banner: 1.
- Banner list/editor → Collection Simulator: 2.
- Collection Simulator → Records, Evidence, Dashboard, Audit: 4.
- Records → Evidence, Dashboard: 2.
- Evidence → Records, Audit: 2.

Tổng cộng: **13 liên kết**.

## 6. Guided Demo architecture

Guided Demo dùng một Zustand store riêng chỉ lưu trạng thái UI của hướng dẫn: scenario đang chọn, bước hiện tại, baseline event count và xác nhận thủ công. Store này không ghi hoặc reset consent, evidence, audit history hay domain data.

Các bước nghiệp vụ yêu cầu người dùng thao tác trên UI hiện hữu. Với bước có thể quan sát được, hướng dẫn kiểm tra event mới trong domain store. Với bước chưa thể kiểm chứng chắc chắn từ state, UI hiển thị cơ chế **Cần xác nhận thủ công** thay vì giả định thành công.

Khi điều hướng sang màn hình khác, `GuidedDemoDock` giữ scenario và progress trong phiên ứng dụng. Không yêu cầu persistence qua browser reload.

## 7. Trạng thái Guided Demo scenarios

| Scenario | Implemented | Runtime Verified | Giới hạn |
|---|---|---|---|
| Customer Accepts Consent | Có | Chưa | Action Accept dùng UI hiện có; event mới được kiểm tra từ store. Các bước điều hướng/quan sát cần xác nhận thủ công. |
| Customer Rejects Consent | Có | Chưa | Action Reject dùng UI hiện có; tác động Rule/Matrix được hướng dẫn quan sát, không tạo rule mới. |
| Customer Withdraws Consent | Có | Chưa | Cần subject đã Accepted. Withdraw dùng Preference Center hiện có và kiểm tra event mới. |
| Re-consent | Có | Chưa | Cần consent nền phù hợp; dùng Re-consent Simulator hiện có, không bổ sung lifecycle mới. |
| Sensitive Consent | Có | Chưa | Dựa trên consent nhạy cảm có sẵn trong mock data; kiểm tra event có `sensitive` và `explicit`. |
| CMP Unavailable | Có | Chưa | Là walkthrough giải thích/quan sát thủ công; không giả lập thêm fail-closed business engine. |

Tất cả 6 scenario có UI chọn kịch bản, business objective, actor, SRS reference, số bước, progress, expected action/result và các điều khiển Start/Next/Previous/Restart/Exit.

## 8. Business rules được giữ nguyên

- Không chỉnh sửa `src/store/cmp-store.ts`, domain types, mock data hoặc route definitions.
- Guided Demo không tự động gọi Accept/Reject/Withdraw khi bấm Next.
- Start, Restart và Exit chỉ thay đổi UI progress; không reset domain history.
- Permission navigation tiếp tục sử dụng permission model hiện có.
- Không bypass validation, approval hoặc state transition đang tồn tại.
- Không triển khai các workflow Prompt 04.

## 9. Validation

### Source inspection

- Đã kiểm tra routes, navigation, page components, Simulator, Zustand store, mock data và permission helper trước khi triển khai.
- Không tìm thấy file test/spec trong source (loại trừ `node_modules`).

### Static validation

- `npm run build`: **PASS**.
- TypeScript compilation trong Vite build: **PASS**.
- `npm run lint`: **PASS, 0 errors**; còn 12 Fast Refresh warnings đã tồn tại ở các file UI/store cũ, không có warning mới từ phần triển khai Prompt 03.
- Build còn cảnh báo bundle chunk lớn khoảng 1.37 MB; đây là technical debt hiện hữu, không chặn prototype demo.

### Runtime verification

- Dev server phản hồi `HTTP 200` tại `http://127.0.0.1:5173/`.
- Không thể thực hiện browser walkthrough tự động vì môi trường phiên làm việc không cung cấp browser automation surface. Do đó không tuyên bố các scenario đã được runtime verified.

## 10. Regression assessment

| Workflow hiện hữu | Mức kiểm tra | Kết quả |
|---|---|---|
| Purpose → Consent | Build + source inspection | Không thay đổi action/store; bổ sung help và navigation. |
| Consent → Notice → Banner | Build + source inspection | Không thay đổi lifecycle; bổ sung relationship explanation và next-step. |
| Banner → Accept/Reject → Records | Build + source inspection | Logic cũ được giữ; Guided Demo chỉ quan sát event. Runtime chưa xác minh. |
| Preference Center → Withdraw | Build + source inspection | Logic cũ được giữ; Runtime chưa xác minh. |
| Re-consent → New Decision | Build + source inspection | Logic cũ được giữ; Runtime chưa xác minh. |
| Offline Consent → Evidence | Build + source inspection | Không chỉnh sửa màn hình/action nghiệp vụ. Runtime chưa xác minh. |
| Evidence → Audit → Reporting | Build + source inspection | Không chỉnh sửa evidence/audit data flow; chỉ thêm help/navigation. Runtime chưa xác minh. |

## 11. Known limitations

- Runtime interaction chưa được browser-verified trong môi trường hiện tại.
- Guided Demo xác minh được những quyết định tạo event mới; các bước thiên về quan sát hoặc navigation vẫn cần người demo xác nhận thủ công.
- Scenario CMP Unavailable chưa có business engine để kiểm chứng fail-closed; UI không giả lập kết quả thành công sai lệch.
- Scenario Re-consent và Withdraw phụ thuộc precondition của mock data/state hiện hành.
- Một số khu vực trong `p3.tsx` vẫn là UI-level simulation theo đúng giới hạn Prompt 03.
- Guided progress chỉ tồn tại trong memory và mất khi reload, đúng yêu cầu prototype.

## 12. Công việc chuyển sang Prompt 04

- Rights Management workflow hoàn chỉnh.
- Application Registration và Consent Assignment.
- Connector Configuration và delivery simulation chi tiết.
- Cookie Scanner workflow.
- Signing Key Rotation.
- Metering workflow.
- Hoàn thiện Rule/Matrix approval lifecycle.
- Xử lý các câu hỏi BA/PO chưa chốt trong `docs/prototype-business-review/06-ba-po-clarification.md` trước khi mở rộng business behavior.

