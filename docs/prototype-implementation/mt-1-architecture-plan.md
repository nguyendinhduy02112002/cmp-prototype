# Kế hoạch kiến trúc MT-1 SaaS Multi-tenant

## 1. Phạm vi và căn cứ

MT-1 chuyển CMP Demo Prototype từ một workspace toàn cục sang ba workspace tenant độc lập, vẫn dùng React, TypeScript, Zustand và mock data trong bộ nhớ. Kế hoạch căn cứ vào SRS CMP v1.3, đặc biệt các mục 2.3, 4.2, 4.3, UC-08, mô hình trạng thái và quy tắc audit/notification; các quyết định PO trong MT-1 được áp dụng cho hành vi SaaS chưa được SRS đặc tả.

Không có mâu thuẫn chặn triển khai. SRS mô tả vai trò theo Organization; quyết định PO chuẩn hóa một Organization thành một Tenant độc lập. Đây là phần mở rộng kiến trúc demo, không thêm vai trò nghiệp vụ thứ tư.

## 2. Hiện trạng

- `src/lib/store.ts` chứa một Zustand store toàn cục; tất cả Purpose, Consent, Notice, Banner, Rule, Matrix, Event, Evidence, Approval, Notification, Audit và permission dùng chung.
- Người dùng demo được suy ra từ role bằng `persona(role)`. Đổi role đồng thời đổi danh tính, chưa biểu diễn membership.
- Application và Property lấy trực tiếp từ `src/lib/mock.ts`, nên chưa thể thay đổi theo tenant.
- Approval được tổng hợp từ domain state; maker-checker so sánh tên người gửi với persona hiện tại.
- Guided Demo có UI state riêng và giữ object/event baseline khi chuyển ngữ cảnh.

## 3. Kiến trúc đề xuất

```text
MultiTenantState
├── tenants[]                         platform-level demo catalogue
├── memberships[]                    user × tenant × roles
├── currentTenantId/currentUserId    active context
├── workspaces[tenantId]             durable in-memory tenant snapshots
└── active workspace fields          compatibility projection
    ├── permission matrix
    ├── applications/properties
    ├── configurations
    ├── approvals via domain state
    ├── notifications/audit
    └── records/evidence/simulator data
```

Các field workspace hiện hành tiếp tục xuất hiện ở cấp store để không phải viết lại mọi màn hình. Khi chuyển tenant, store lưu snapshot tenant hiện tại, kiểm tra membership và trạng thái tenant, rồi nạp snapshot tenant đích bằng một cập nhật nguyên tử. Vì action chỉ truy cập active projection, ID cũ của tenant trước không thể tìm thấy và không thể mutate tenant khác.

## 4. Domain model

- `Tenant`: ID ổn định, code, name, status `ACTIVE | SUSPENDED`.
- `TenantMembership`: userId, tenantId, roles, status; cùng user có thể có role khác nhau ở các tenant.
- `TenantApplication` và `TenantProperty`: thuộc workspace; Property tham chiếu Application cùng tenant.
- `TenantWorkspace`: toàn bộ dữ liệu nghiệp vụ tenant-owned và permission matrix độc lập.
- UI state, dialog, route selection và Guided Demo progress không nằm trong workspace; chúng được đóng/reset khi tenant đổi.

## 5. Membership và permission resolution

Permission hiệu lực là hợp của các role trong active membership trên permission matrix của active tenant. `setRole` chỉ cho chọn role có trong membership; `setPersona` mô phỏng đổi sang user khác trong cùng tenant. Maker-checker so sánh danh tính user/persona, không so sánh nhãn role, nên đổi role của cùng user không thể tự duyệt.

Admin mặc định không có quyền approve; DPO giữ quyền approve mặc định theo SRS. `setPerm` chỉ cập nhật matrix của workspace hiện hành.

## 6. Chiến lược dữ liệu

- Tenant Retail nhận nguyên trạng dữ liệu single-tenant hiện tại.
- Tenant Finance và Health dùng bản sao sâu độc lập, sau đó đổi định danh hiển thị Application/Property, cấu hình tiêu biểu và rút gọn event history.
- Một số business code được giữ giống nhau giữa tenant có chủ đích để chứng minh uniqueness theo tenant, không theo platform.
- Mọi dữ liệu là giả lập; subject ID giống nhau ở hai workspace không tạo quan hệ.

## 7. Thứ tự migration

1. Bổ sung tenant/application/property types.
2. Tạo workspace factory và state context trong store.
3. Chuyển permission/maker-checker sang membership-aware helpers.
4. Thêm Tenant Switcher và persona switcher; đóng dialog/reset Guided Demo khi đổi tenant.
5. Thay các tham chiếu trực tiếp `mock.APPS/PROPERTIES` bằng active workspace selectors.
6. Bảo vệ mutation theo active workspace và ownership của relationship.
7. Kiểm tra approval, notification, audit, simulator, records/evidence.

## 8. Rủi ro regression và kiểm soát

- **Stale dialog/ID:** đóng approval/compare, reset Guided Demo và chuyển detail route về list an toàn.
- **Maker-checker bị bypass:** identity lấy từ membership/user, không lấy từ role label.
- **Action cập nhật nhầm tenant:** switching nguyên tử và action chỉ tìm object trong active arrays.
- **Mock helper dùng dữ liệu Retail:** chuyển Application/Property runtime sang store; các helper tạo snapshot ban đầu vẫn được phép dùng mock gốc.
- **Current workspace snapshot lỗi thời:** snapshot được cập nhật trước mỗi tenant switch; selector workspace hiện hành tạo snapshot từ active projection.
- **Runtime chưa kiểm chứng:** build/lint không được dùng thay cho UAT; checklist thủ công sẽ đánh dấu riêng.

## 9. Acceptance criteria áp dụng

Áp dụng AC-01 đến AC-18 của MT-1. Ưu tiên kiểm tra isolation, membership/permission, approval maker-checker, notification/audit, subject/event isolation, route safety, Simulator và sáu Guided Demo scenarios.

## 10. Câu hỏi mở không chặn MT-1

- Phạm vi Brand/Property của từng membership chưa có UI enforcement đầy đủ; MT-1 chỉ thực thi tenant boundary.
- Hành vi platform operator khi tenant suspended được hoãn vì không có Platform Administration Console.
- Persistence sau reload không thuộc prototype; mọi workspace quay về mock seed khi tải lại.
- Application Registration CRUD và Integration Code Generator thuộc giai đoạn sau.
