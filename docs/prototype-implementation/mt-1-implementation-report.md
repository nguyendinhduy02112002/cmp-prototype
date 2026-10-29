# Báo cáo triển khai MT-1 SaaS Multi-tenant

## 1. Kết luận

MT-1 đã triển khai nền tảng multi-tenant frontend cho CMP Demo Prototype với ba tenant độc lập, membership và role theo tenant, permission matrix riêng, tenant-aware Application/Property, và isolation cho toàn bộ state nghiệp vụ hiện hữu. Các workflow cũ tiếp tục dùng cùng action/domain state; không có backend, database, API thật hoặc thư viện mới.

Build và TypeScript đã pass. Lint có 0 error và 12 warning Fast Refresh đã tồn tại ở cấu trúc component/helper. Dev server trả HTTP 200. Walkthrough bằng browser chưa thể thực hiện do browser automation không khả dụng, vì vậy các luồng UI được ghi là NOT VERIFIED cho đến khi chạy checklist UAT.

## 2. Architecture decisions

### IMPLEMENTED — Active workspace projection

Store có `workspaces: Record<TenantId, TenantWorkspace>` và một active projection giữ nguyên tên field cũ. Trước khi đổi tenant, store snapshot toàn bộ active workspace; sau đó nạp workspace đích trong một state update. Cách này bảo toàn component/action hiện hữu và ngăn action tìm thấy object của tenant khác.

### IMPLEMENTED — Membership-aware identity

`currentUserId` và `TenantMembership` tách identity khỏi role. Cùng user có thể là Nhân viên ở Retail và Admin ở Finance. Persona switch mô phỏng đổi người dùng; role switch chỉ chọn role thuộc membership hiện tại. Maker-checker tiếp tục so sánh actor thực tế nên không thể bypass chỉ bằng đổi role.

### IMPLEMENTED — Permission composition

Permission hiệu lực là hợp quyền của tất cả role trong membership, trên matrix của active tenant. Admin chỉ sửa matrix khi membership hiện tại có role Admin. Permission matrix được lưu trong từng workspace.

### IMPLEMENTED — Store-level protection

Các action chính cho configuration, Rule, Matrix, Banner, Import, Offline, Evidence và Simulator kiểm tra permission tại store. Relationship validation chặn Consent tham chiếu Purpose/Application ngoài workspace, Banner dùng Property ngoài workspace, Matrix dùng Application ngoài workspace, và Simulator ghi decision với Consent/Application không thuộc workspace.

## 3. Tenant model và demo data

Ba tenant được seed:

| Tenant | Code | Đặc điểm demo |
|---|---|---|
| ABC Retail | ABC-RETAIL | Giữ nguyên toàn bộ dữ liệu prototype trước MT-1 |
| ABC Finance | ABC-FIN | Application/Property tài chính, history rút gọn, workspace độc lập |
| ABC Health | ABC-HEALTH | Application/Property y tế, sensitive-consent context, workspace độc lập |

Các tenant có chủ đích dùng một số Purpose/Consent code giống nhau. Bản sao sâu và snapshot riêng bảo đảm cấu hình, record và evidence không dùng chung reference.

## 4. UI và navigation

### IMPLEMENTED

- Tenant Switcher ở header chỉ hiển thị tenant mà current user có active membership.
- Hiển thị tên/code tenant, persona hiện tại và role/roles.
- Persona switch được ghi rõ là mô phỏng đổi người dùng.
- Sidebar hiển thị tenant hiện hành.
- Application/Property tại Dashboard, Consent, Banner, Records, Evidence, Matrix, Integrations và Settings đọc từ active workspace.
- Khi đổi tenant, approval/compare dialog đóng, Guided Demo reset và detail route Banner/Record/Evidence chuyển về list an toàn.
- Main route subtree remount theo `tenantId:role`, loại bỏ local selection cũ.

## 5. Approval, notification và audit isolation

### IMPLEMENTED

- Approval được tổng hợp từ domain arrays của active workspace; stale request ID không tồn tại sau tenant switch.
- Approver phải có active membership và approve permission trong active tenant.
- Notification approver chỉ tạo cho active membership đủ quyền trong đúng tenant.
- Bell count, Notification Center và Audit đọc active workspace.
- Permission denial tại store tạo audit entry thất bại trong tenant hiện hành.
- Rule/Matrix active version và pending revision vẫn dùng logic Prompt 04A, không bị thay thế khi pending.

### NOT VERIFIED

Toàn bộ chuỗi Staff submit → DPO approve/return → Staff resubmit trên browser sau refactor chưa được walkthrough tự động.

## 6. Simulator, Records, Evidence và Guided Demo

### IMPLEMENTED

- Simulator đọc Consent, Notice, Banner, Matrix, Application và event của active workspace.
- `recordDecision` xác thực Consent/Application ownership trước khi ghi.
- Subject ID và current state được tính chỉ từ active tenant events.
- Offline consent, import events, evidence packages và outbox nằm trong TenantWorkspace.
- Guided Demo đọc active event state; tenant switch thoát scenario để không giữ baseline/object ID cũ và không xóa domain data.

### NOT VERIFIED

Sáu Guided Demo scenarios và negative scenario chuyển tenant cần chạy checklist UAT-08, UAT-09 và UAT-12 trên browser.

## 7. SRS traceability

| SRS/Decision | Implementation |
|---|---|
| SRS 2.3, UC-08 — role gán theo Organization | TenantMembership và Users screen theo active tenant |
| SRS 4.2 — permission matrix mặc định/cấu hình | Matrix riêng mỗi TenantWorkspace, permission union theo membership |
| SRS 4.3, BR-AP-01 | Actor theo user; maker-checker không phụ thuộc role label |
| SRS 8 — notification/audit | Tenant-owned `nlog`, `alerts`, `audit`; approver targeting theo membership |
| SRS 5/9 — state và data management | TenantWorkspace chứa version, event, record/evidence source state |
| PO MT-1 — one Organization = one Tenant | Ba workspace độc lập, không hierarchy/inheritance |
| PO MT-1 — subject tenant-scoped | Current state/query chỉ chạy trên active workspace events |
| PO MT-1 — no Platform Admin bypass | Không thêm role/persona Platform Admin |

## 8. Files modified

- `src/lib/types.ts`
- `src/lib/store.ts`
- `src/components/site-header.tsx`
- `src/components/app-sidebar.tsx`
- `src/components/layouts/base-layout.tsx`
- `src/components/cmp/approval.tsx`
- `src/components/cmp/notifs.tsx`
- `src/app/admin.tsx`
- `src/app/banners.tsx`
- `src/app/consents.tsx`
- `src/app/dashboard.tsx`
- `src/app/evidence.tsx`
- `src/app/offline.tsx`
- `src/app/p3.tsx`
- `src/app/records.tsx`
- `src/app/rules.tsx`
- `docs/prototype-implementation/mt-1-architecture-plan.md`
- `docs/prototype-implementation/mt-1-uat-checklist.md`
- `docs/prototype-implementation/mt-1-implementation-report.md`

## 9. Validation results

| Check | Result | Classification |
|---|---|---|
| `npm.cmd run build` | PASS; TypeScript và Vite build thành công | VERIFIED |
| `npm.cmd run lint` | 0 error, 12 warning Fast Refresh | VERIFIED WITH WARNINGS |
| Dev server HTTP | `HTTP/1.1 200 OK` | VERIFIED |
| Automated tests | Không có test runner/script trong repository | NOT VERIFIED |
| Browser automation | IAB browser không khả dụng | NOT VERIFIED |
| Manual UAT | Checklist đã tạo, chưa thực thi | NOT VERIFIED |

Build còn warning bundle trên 500 kB; đây là technical debt cũ/ngoài mục tiêu isolation và không chặn demo.

## 10. Known limitations

- Frontend isolation là mô phỏng, không phải production security boundary.
- State reset khi browser reload; không có persistence.
- Brand/Property scope trong một tenant chưa được enforce chi tiết theo membership; MT-1 chỉ enforce tenant boundary.
- Existing mock data Finance/Health là bản sao sâu được đổi context và rút gọn, chưa phải catalogue nghiệp vụ riêng hoàn chỉnh.
- Route safety chủ yếu dựa trên active workspace resolution và reset các detail route đã có; không có URL tenant slug.
- PendingRequest hiện lưu actor display name theo mô hình cũ; demo identities có tên duy nhất, nhưng production cần immutable user ID.
- Suspended tenant được chặn trong switch action; không có lifecycle console để thay đổi status trong UI.

## 11. Deferred

- Platform Administration Console và Tenant CRUD.
- Application Registration và Application Detail tabs.
- Integration Code Generator, shared SDK runtime và API thật.
- Rights, Connector, Cookie Scanner, Signing Keys và Metering workflows.
- Production authentication, authorization server, database isolation và observability.

