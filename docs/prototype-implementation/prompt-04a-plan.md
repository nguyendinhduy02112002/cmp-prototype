# Kế hoạch triển khai Prompt 04A — Rules và Matrix Approval Lifecycle

## 1. Phạm vi và ánh xạ SRS

| Phạm vi | SRS | Nội dung triển khai |
|---|---|---|
| Quy tắc tái đồng ý | SRS-FR-004, UC-04, SCR-04-01 | Draft, submit, pending, return, resubmit, approve, active version, history |
| Ma trận phụ thuộc | SRS-FR-005, UC-05, SCR-05-01 | Draft theo application, validation, submit, approval, version history, compare |
| Phê duyệt chung | Mục 4.2, 4.3; BR-AP-01..09 | Permission, maker-checker, return reason, withdraw, notification, audit, optimistic state check |

## 2. Hiện trạng

### Rules

- UI hiển thị một bộ rule tĩnh RS-3 và cho chỉnh local state.
- Nút gửi duyệt chỉ ghi audit và toast; không tạo pending request, notification hay approval history.
- Chưa có draft/version/history/return/resubmit.

### Matrix

- Store chỉ giữ một matrix cho mỗi application.
- `saveMatrix` ghi đè và áp dụng ngay; chưa có draft/pending/approval/version history.
- Simulator đọc matrix đầu tiên theo application.
- Chưa có validation EX-01/EX-02, approval item hay compare version.

### Approval infrastructure có thể tái sử dụng

- `ApprovalDialog`, `getApprovals`, Notification Center và notification bell.
- Permission matrix `setup.edit/approve`.
- Maker-checker, return reason tối thiểu 10 ký tự, withdraw, audit và notification cho các loại object hiện tại.
- Kiểm tra lại approval item trước khi xử lý đã mô phỏng optimistic concurrency: request xử lý sau không còn tồn tại và bị từ chối.

## 3. State transitions đề xuất

### Rule version

`Hoạt động → tạo bản Nháp → Chờ duyệt → Hoạt động mới`

- Return: `Chờ duyệt → Bị trả lại`.
- Withdraw: `Chờ duyệt → Nháp`.
- Resubmit: `Bị trả lại → Chờ duyệt`.
- Bản Hoạt động cũ giữ hiệu lực tới lúc bản mới được duyệt, sau đó chuyển `Thay thế`.

### Matrix version theo application

`Hiện hành → tạo bản Nháp → Chờ duyệt → Hiện hành mới`

- Return: `Chờ duyệt → Bị trả lại`.
- Withdraw: `Chờ duyệt → Nháp`.
- Resubmit: `Bị trả lại → Chờ duyệt`.
- Bản hiện hành cũ không bị sửa khi draft/pending tồn tại và được giữ trong version history sau approval.

## 4. Validation

### UC-04

- Default duration bắt buộc là số nguyên từ 1 đến 120 tháng.
- Các dòng tối thiểu theo BR-UC04-01 và dữ liệu nhạy cảm theo BR-UC04-03 luôn khóa ở Trọng yếu.
- Pending version bị khóa chỉnh sửa.

### UC-05

- `FN-nn` duy nhất trong application.
- Mục đích thuộc consent Tùy chọn không thể được đánh Bắt buộc.
- Mỗi consent Bắt buộc gán application phải có ít nhất một purpose được liên kết với một function trước khi submit.
- Pending version bị khóa chỉnh sửa.
- Không có lựa chọn chặn toàn bộ application.

## 5. Files dự kiến thay đổi

- `src/lib/types.ts`: version/state/history models cho rule và matrix.
- `src/lib/mock.ts`: active rule version và matrix version history khởi tạo.
- `src/lib/store.ts`: draft/save/submit actions; mở rộng approval, return, withdraw, notification và audit.
- `src/components/cmp/approval.tsx`: đưa rule/matrix vào approval list và common dialog.
- `src/app/rules.tsx`: editor, status, approval history, matrix validation/history/compare.
- `src/app/simulator.tsx`: bảo đảm chỉ đọc matrix `Hiện hành`.
- Tài liệu plan và report Prompt 04A.

## 6. Cách giữ compatibility

- Giữ route `/rules`.
- Giữ Zustand in-memory và permission model hiện tại.
- Simulator tiếp tục dùng approved matrix; pending version không ảnh hưởng kết quả.
- Guided Demo, consent actions và các module ngoài UC-04/UC-05 không đổi.
- Approval UI hiện có tiếp tục là điểm xử lý chung.

## 7. Regression risks

- Thay đổi shape `DependencyMatrix` có thể làm Simulator đọc nhầm draft thay vì active.
- Approval union mở rộng có thể ảnh hưởng Notification Center.
- Chuyển version phải bảo đảm chỉ một active/current version cho mỗi application.
- Local editor state phải được đồng bộ khi đổi application hoặc request được xử lý ở vai trò khác.

## 8. Điểm chưa rõ và quyết định demo

- BR-AP-09 dùng `[N]` ngày làm việc chưa được chốt. Prompt 04A không tạo scheduler; UI giữ nhãn tham số demo và không phát minh giá trị production.
- SRS mô tả email notification nhưng prototype chỉ có in-app notification; không bổ sung email thật.
- Concurrent approval được mô phỏng bằng kiểm tra request còn pending tại thời điểm action; không có backend locking thực.

