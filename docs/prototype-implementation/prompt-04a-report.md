# Báo cáo triển khai Prompt 04A — Rules và Matrix Approval Lifecycle

## 1. Kết quả

Đã hoàn thiện workflow demo có tương tác cho UC-04 và UC-05 trên frontend Zustand hiện hữu. Rules và Matrix hiện có draft/version riêng, đi qua common approval dialog, Notification Center, permission matrix và audit log. Draft hoặc pending revision không thay thế cấu hình đang có hiệu lực.

Không bổ sung backend, database, API thật, authentication mới hoặc external service.

## 2. SRS traceability

| SRS | Nội dung | Triển khai |
|---|---|---|
| SRS-FR-004, UC-04 | Versioned re-consent rules | Rule version Rn có Nháp, Chờ duyệt, Bị trả lại, Hoạt động, Thay thế |
| BR-UC04-01, 03 | Các thay đổi tối thiểu và dữ liệu nhạy cảm luôn Trọng yếu | Dòng tương ứng bị khóa và được kiểm tra lại trong store |
| BR-UC04-05 | Default duration 1–120 tháng | Kiểm tra khi lưu và gửi duyệt; dùng giá trị demo đã được gắn nhãn là cấu hình |
| BR-UC04-04 | Lưu rule version | Rule history giữ Rn, approver và thời điểm |
| SRS-FR-005, UC-05 | Matrix theo version/application | Mỗi application có active version và draft/pending revision riêng |
| BR-UC05-01 | Chỉ một current matrix | Approval chuyển active cũ sang Thay thế và revision thành Hoạt động |
| BR-UC05-03 | Optional purpose không được required | UI không cho cycle tới Bắt buộc và store chặn submit sai |
| BR-UC05-04 | Không block toàn application | Chỉ có hai hành vi đúng SRS: chặn function hoặc function với alternate flow |
| SRS-FR-005-05 | Kiểm tra EX-01/EX-02 | Validation panel và submit guard |
| AF-02 UC-05 | So sánh version | Dùng common CompareDialog với snapshot từng matrix version |
| BR-AP-01, 02 | Permission và maker-checker một cấp | Common ApprovalDialog/store kiểm tra quyền và submitter khác approver |
| BR-AP-03 | Return reason >= 10 ký tự | Common reject action giữ validation hiện hữu |
| BR-AP-04 | Pending lock và withdrawal | Editor khóa khi pending; submitter mở approval để rút lại |
| BR-AP-05 | Active giữ hiệu lực khi revision pending | Active và proposal là hai version độc lập |
| BR-AP-06 | Audit | Create/save/submit/approve/return/withdraw ghi actor, role, time và transition |
| BR-AP-07 | Notification | Submit hiện tại chuông/Notification Center; approve/return thông báo submitter |
| BR-AP-08 | Concurrent handling | Action kiểm tra approval item còn pending; action đến sau nhận trạng thái không còn chờ |
| BR-AP-09 | Không auto approval | Không có auto approval; tham số `[N]` không được tự đặt giá trị production |

## 3. Files đã thay đổi

- `src/lib/types.ts`
- `src/lib/mock.ts`
- `src/lib/store.ts`
- `src/components/cmp/approval.tsx`
- `src/app/rules.tsx`
- `src/app/simulator.tsx`
- `docs/prototype-implementation/prompt-04a-plan.md`
- `docs/prototype-implementation/prompt-04a-report.md`

## 4. State transitions

### Rules

| From | Action | To | Hệ quả |
|---|---|---|---|
| Hoạt động | Đề nghị sửa | Nháp mới | Active cũ giữ hiệu lực |
| Nháp/Bị trả lại | Gửi duyệt | Chờ duyệt | Khóa editor, tạo notification/audit |
| Chờ duyệt | Phê duyệt | Hoạt động | Active cũ thành Thay thế |
| Chờ duyệt | Trả lại | Bị trả lại | Giữ active cũ, lưu lý do/history |
| Chờ duyệt | Người gửi rút | Nháp | Mở lại editor |
| Bị trả lại | Sửa và gửi | Chờ duyệt | Tạo lần gửi mới trong history |

### Matrix

| From | Action | To | Hệ quả |
|---|---|---|---|
| Hiện hành | Tạo phiên bản mới | Nháp mới | Clone current version |
| Nháp/Bị trả lại | Gửi duyệt | Chờ duyệt | Chỉ gửi nếu EX-01/EX-02 đạt |
| Chờ duyệt | Phê duyệt | Hoạt động mới | Active cũ thành Thay thế; Simulator dùng bản mới |
| Chờ duyệt | Trả lại | Bị trả lại | Current matrix không đổi |
| Chờ duyệt | Người gửi rút | Nháp | Cho phép sửa tiếp |

## 5. Approval và permission

- Nhân viên và Admin dùng quyền `setup.edit` để tạo/sửa/gửi.
- DPO mặc định có `setup.approve`.
- Admin mặc định không có approve; khi Admin bật quyền approve tại permission matrix, common dialog cho phép duyệt request của người khác.
- Submitter không thể tự approve hoặc return request của mình.
- Return yêu cầu lý do tối thiểu 10 ký tự.
- Pending request chỉ đọc; submitter vẫn có nút Rút lại yêu cầu trong common approval dialog.
- Common approval lookup được đánh giá lại ở thời điểm action, nên request đã xử lý không thể được duyệt lần hai.

## 6. Notification và audit

- Rule/Matrix submit được đưa vào `getApprovals`, do đó xuất hiện ở chuông và bộ lọc Chờ tôi duyệt/Đề nghị của tôi.
- Submit tạo notification tới mọi persona có quyền approve trong permission matrix, trừ chính submitter.
- Approve/return tạo notification kết quả cho submitter.
- Audit ghi create draft, save, submit, approve, return và withdraw; approve/return/withdraw có before/after status.
- Version card trên `/rules` hiển thị approval history gần nhất, approver và thời điểm.

## 7. Matrix versioning và Simulator

- `DependencyMatrix` có status, request metadata, approver, approved time và history.
- Store giữ nhiều version cho cùng application.
- Simulator lọc rõ `status === "Hoạt động"`; draft, returned và pending version không ảnh hưởng kết quả function dependency.
- Khi approval thành công, active cũ được giữ ở trạng thái `Thay thế` để compare/history.

## 8. Validation results

- `tsc --noEmit`: PASS.
- `npm run build`: PASS.
- `npm run lint`: PASS, 0 errors; còn 12 Fast Refresh warnings đã tồn tại ở các file cũ.
- Automated tests: repository không có test/spec và không có test runner phù hợp; không bổ sung framework mới.
- Dev server `/rules`: HTTP 200.
- Browser walkthrough tự động: chưa xác minh do môi trường không cung cấp browser automation surface.
- Vite còn cảnh báo bundle lớn hơn 500 kB; không chặn demo workflow.

## 9. Regression assessment

| Khu vực | Đánh giá |
|---|---|
| Existing approval types | Giữ nguyên handlers Purpose, Consent, Notice, Banner và Import; union chỉ được mở rộng |
| Notification Center | Dùng cùng `useApprovals`; Rule/Matrix không tạo notification subsystem riêng |
| Simulator | Được bảo vệ để chỉ đọc approved/active matrix |
| Guided Demo | Không thay đổi guided state hoặc scenario catalog |
| Consent/Notice/Banner workflows | Không sửa store action/domain behavior liên quan |
| Routes | Không thêm, xóa hoặc đổi route |

## 10. Known limitations

- Frontend-only optimistic concurrency chỉ mô phỏng bằng kiểm tra request còn pending; không thay thế database row version.
- Email notification theo BR-AP-07 không được gửi thật; in-app notification là bằng chứng demo.
- BR-AP-09 `[N]` ngày làm việc chưa có giá trị chốt và không có scheduler trong prototype.
- Runtime browser walkthrough chưa được thực hiện trong môi trường hiện tại.
- Matrix editor hỗ trợ thêm, sửa và đánh dấu Ngừng function trong revision; không triển khai Application Registration ngoài phạm vi Prompt 04A.

## 11. Manual UAT

### UAT-04A-01 Rules approve

1. Chuyển vai trò sang Nhân viên.
2. Mở `/rules`, tab Quy tắc tái đồng ý.
3. Chọn Đề nghị sửa; xác nhận R mới ở Nháp trong khi R cũ vẫn Hoạt động.
4. Thay một dòng không khóa hoặc default months, Lưu nháp và Gửi duyệt.
5. Xác nhận revision Chờ duyệt và editor bị khóa.
6. Mở Chuông/Notification Center: Nhân viên thấy Đề nghị của tôi.
7. Chuyển DPO: xác nhận request ở Chờ tôi duyệt.
8. Mở dialog, xem diff và Phê duyệt.
9. Quay lại Rules: R mới Hoạt động, R cũ Thay thế; history và Audit có action.

### UAT-04A-02 Rules return/resubmit

1. Tạo và gửi một revision mới bằng Nhân viên.
2. Chuyển DPO, thử Trả lại với lý do dưới 10 ký tự: phải bị chặn.
3. Nhập lý do hợp lệ và trả lại.
4. Chuyển Nhân viên: thấy notification kết quả và trạng thái Bị trả lại.
5. Sửa, lưu và gửi lại; DPO phê duyệt.

### UAT-04A-03 Maker-checker và Admin permission

1. Nhân viên gửi request rồi mở dialog bằng chính Nhân viên: nút Approve/Return bị khóa.
2. Chuyển Admin mặc định: nút Approve bị khóa vì `setup.approve = false`.
3. Tại Users & RBAC, bật quyền approve nhóm setup cho Admin.
4. Admin mở lại request của Nhân viên: có thể approve.
5. Nếu Admin là người gửi request, Admin vẫn không tự approve request đó.

### UAT-04A-04 Matrix active preservation

1. Nhân viên mở Matrix và ghi lại active version.
2. Tạo phiên bản mới, sửa dependency và gửi duyệt.
3. Trước approval, mở Collection Simulator và kiểm tra hành vi vẫn theo active version cũ.
4. Chuyển DPO, xem diff và approve.
5. Quay lại Matrix: version mới Hoạt động, version cũ Thay thế.
6. Mở Compare để so sánh hai version; Simulator từ lần đọc tiếp theo dùng version mới.

### UAT-04A-05 Matrix validation

1. Tạo matrix draft.
2. Loại bỏ mọi liên kết của một consent Bắt buộc: Gửi duyệt bị khóa/chặn với MSG-05-02.
3. Với purpose của consent Tùy chọn, cycle chỉ đi Không liên quan ↔ Không bắt buộc, không tới Bắt buộc.
4. Tạo hai function trùng mã hoặc mã sai định dạng: Lưu nháp bị chặn.

### UAT-04A-06 Concurrent approval simulation

1. Mở cùng approval request ở hai điểm UI.
2. Approve tại dialog thứ nhất.
3. Thao tác tại dialog thứ hai phải trả về “Đề nghị không còn chờ duyệt” và không tạo approval thứ hai.

