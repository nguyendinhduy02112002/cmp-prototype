# MT-2 Preimplementation Assessment

## 1. Kết luận

Repository hiện là CMP Demo Prototype frontend-only chạy React, TypeScript, Vite, shadcn/ui, Tailwind CSS và Zustand. Kiến trúc SaaS multi-tenant nền tảng của MT-1 đã có trong source: ba tenant seed độc lập, membership theo tenant, permission matrix theo workspace, tenant switcher, persona switcher, store-level guards và dữ liệu nghiệp vụ tenant-scoped. Prompt 03 và Prompt 04A cũng hiện diện trong source.

MT-2 chưa được triển khai. Hiện không có Platform Administration Console, không có thao tác tạo/sửa/suspend tenant, không có Organization/Brand management, không có membership CRUD thực sự và không có tenant settings model. Màn Người dùng & phân quyền mới chỉ hỗ trợ đọc membership seed, chỉnh permission matrix và hiển thị hộp thoại mời dạng toast mô phỏng.

Application Registration và Integration Code Generator cũng chưa tồn tại. `/integrations` chỉ có bảng Application đọc từ workspace và các tab Event/Connector/Scanner chủ yếu mô phỏng. Các chức năng này phải tiếp tục được giữ ngoài MT-2 theo roadmap hiện tại.

## 2. Nguồn và mức xác minh

Đánh giá này đối chiếu:

- `docs/SRS_CMP_v1.3.docx`, đặc biệt mục 2.3, 4.2, 4.3, UC-06, UC-08, mục 5, 6 và 8.
- Toàn bộ `docs/prototype-business-review/`, ưu tiên báo cáo 09 về multi-tenant, Application, SDK và deployment.
- Các báo cáo Prompt 03, Prompt 04A và MT-1 trong `docs/prototype-implementation/`.
- Source hiện tại trong `src/`, là bằng chứng quyết định trạng thái triển khai.

Xác minh hiện tại:

| Kiểm tra | Kết quả |
|---|---|
| Source inspection | Verified |
| TypeScript `tsc --noEmit` | Pass |
| ESLint | Pass với 0 error, 12 warning Fast Refresh đã biết |
| Browser walkthrough MT-1 UAT-01..12 | Unverified |
| Automated regression tests | Missing |

Không chạy production build vì assessment không được sửa artifact/source. Không có Git metadata tại working directory để xác minh diff/history.

## 3. Kiến trúc ứng dụng hiện tại

### 3.1 Runtime và presentation

- `src/main.tsx` render `App` dưới React Strict Mode.
- `src/App.tsx` dùng `createMemoryRouter`; route mặc định là `/dashboard`. Router không phản chiếu route lên URL trình duyệt và có hook `window.__nav` cho automation.
- `AppLayout` bọc mọi màn nghiệp vụ bằng Sidebar, Header, permission gate, Approval Dialog, Compare Dialog và Guided Demo Dock.
- `src/config/routes.tsx` là route catalogue; `src/config/nav.ts` là menu catalogue và ánh xạ route sang permission module.
- `src/components/ui` chứa shadcn primitives; `src/components/cmp` chứa component nghiệp vụ dùng chung.

### 3.2 State và domain logic

`src/lib/store.ts` là một Zustand store lớn, đồng thời đóng vai trò:

- In-memory database.
- Tenant context manager.
- Domain service và command handler.
- Permission enforcement layer.
- Approval, notification và audit coordinator.

Không có backend, database, authentication, authorization server hoặc external API. State reset khi reload.

MT-1 dùng mô hình active workspace projection:

```text
Global context
├── tenants[]
├── memberships[]
├── currentTenantId
├── currentUserId
├── role
└── workspaces[tenantId]

Active projection
├── perm
├── applications / properties
├── purposes / consents / notices / banners
├── ruleSets / matrix
├── events / packages / outbox
├── approvals derived from domain state
├── notifications / alerts / audit
└── users / imports
```

Các screen/action cũ tiếp tục đọc field active ở root store. Khi đổi tenant, `switchTenant` snapshot active projection vào workspace cũ rồi deep-clone workspace đích vào projection trong một state update.

### 3.3 Tenant model

`Tenant` hiện chỉ có:

- `id`
- `code`
- `name`
- `status: ACTIVE | SUSPENDED`

Ba tenant seed là ABC Retail, ABC Finance và ABC Health. Tenant catalogue và membership catalogue nằm ngoài từng workspace; domain data và permission matrix nằm trong `TenantWorkspace`.

Finance và Health là deep clone từ dữ liệu Retail, sau đó đổi tên Application/Property, một số Purpose và rút gọn event history. Một số business code giống nhau giữa tenant để chứng minh uniqueness theo tenant.

Đây là isolation trong memory để demo, không phải security boundary production.

## 4. Màn hình và module hiện có

| Nhóm | Route | Trạng thái chính |
|---|---|---|
| Tổng quan | `/dashboard` | Dashboard KPI/chart từ tenant events |
| Tổng quan | `/notifications` | Approval queue, kết quả, alert |
| Cấu hình | `/purposes` | Purpose và data catalogue |
| Cấu hình | `/consents` | Consent configuration và assignment tới Application |
| Cấu hình | `/notices` | Notice version lifecycle |
| Cấu hình | `/banners`, `/banners/:code` | Banner/Popup list, editor, preview, approval |
| Cấu hình | `/rules` | Re-consent Rules và Dependency Matrix versioning/approval |
| Vận hành | `/records`, `/records/:subject` | Current state và subject history |
| Vận hành | `/evidence`, `/evidence/package/:id` | Evidence, correction, export package preview |
| Vận hành | `/offline` | Offline consent |
| Vận hành | `/import` | Legacy import demo |
| Vận hành | `/simulator` | Cookie/Form/Preference/Decision API simulation |
| Vận hành | `/rights` | Read-only placeholder/list; workflow còn thiếu |
| Hệ thống | `/users` | Tenant membership list projection và permission matrix |
| Hệ thống | `/audit` | Tenant audit list/detail |
| Hệ thống | `/integrations` | Event list và static/partial App, Connector, Scanner tabs |
| Hệ thống | `/settings` | Static/partial signing keys, alert config, usage |
| Supporting | permission gate, `*` | Forbidden và Not Found |

## 5. Trạng thái các milestone trước

### 5.1 Prompt 03 UX Clarity and Guided Demo

**Implemented**

- `BusinessContextHelp`, `RelationshipNote`, `SimulationNotice`, `WorkflowNextSteps` tồn tại và được dùng trên các màn chính.
- Sidebar có description/tooltip và nhãn mô phỏng.
- Cross-module next-step navigation đã được thêm.
- `GuidedDemoPanel` và global `GuidedDemoDock` tồn tại.
- Sáu scenario tồn tại: Accept, Reject, Withdraw, Re-consent, Sensitive Consent và CMP Unavailable.
- Guided Demo có Zustand UI store riêng; start/restart/exit không reset domain data.
- Event-based steps kiểm tra events mới; bước không thể tự kiểm chứng yêu cầu xác nhận thủ công.
- Tenant switch thoát Guided Demo để tránh baseline/object ID cũ.

**Partially implemented**

- Scenario CMP Unavailable chủ yếu là walkthrough; không có integration engine thật.
- Một số bước chỉ xác nhận thủ công, không chứng minh runtime behavior.

**Unverified**

- Sáu scenario chưa được browser UAT end-to-end sau MT-1.

### 5.2 Prompt 04A Rules and Matrix approval lifecycle

**Implemented**

- `ReconsentRuleVersion` và versioned `DependencyMatrix` có trạng thái Nháp, Chờ duyệt, Bị trả lại, Hoạt động, Thay thế.
- Rule và Matrix có create draft, save, submit, return, resubmit, withdraw và approve.
- Active version cũ giữ hiệu lực trong lúc revision draft/pending.
- Rule locked rows và default duration 1-120 tháng được guard ở store.
- Matrix validation kiểm tra consent bắt buộc có function, purpose tùy chọn không bị đánh Bắt buộc, function code/uniqueness và application ownership.
- Rule/Matrix đi qua common approval, notification và audit infrastructure.
- Simulator chỉ dùng Matrix `Hoạt động`.
- Compare/version history có UI.

**Unverified**

- Browser flow submit → return/resubmit → approve, concurrent approval simulation và Simulator-before/after-approval chưa được walkthrough theo checklist.

### 5.3 MT-1 SaaS Multi-tenant Foundation

**Implemented**

- Ba tenant seed với `TenantWorkspace` độc lập.
- Tenant switcher chỉ liệt kê tenant mà current user có active membership.
- Persona switcher chỉ liệt kê membership trong active tenant.
- Một user có thể có role khác nhau giữa các tenant.
- Permission matrix là tenant-scoped.
- Application và Property được lấy từ active workspace.
- Purpose, Consent, Notice, Banner, Rule, Matrix, Events, Evidence, Import, Outbox, Notification, Alert và Audit là tenant-scoped.
- Store actions chính có permission guard và ownership checks trên active workspace.
- Approval list được derive từ active domain arrays.
- Tenant switch đóng approval/compare, reset Guided Demo và đưa các detail route nhạy cảm về list an toàn.
- Records, Evidence, Dashboard và Simulator đọc active workspace.
- TypeScript và ESLint hiện pass như ghi ở mục 2.

**Partially implemented**

- `TenantProperty` hiện tham chiếu `applicationId`, trong khi SRS mô tả Property thuộc Organization/Brand và Application chọn Property. Model này chưa đủ cho MT-2/MT-3.
- Scope Organization/Brand/Property chưa nằm trong membership và chưa được enforce.
- Tenant status có `SUSPENDED`, nhưng không có UI/action lifecycle; chỉ `switchTenant` từ chối tenant không Active.
- `users` vẫn tồn tại trong workspace nhưng `/users` dựng danh sách từ global memberships; hai nguồn dễ lệch nhau.
- User invite chỉ hiện toast, không tạo membership/user.
- Notification và pending approval lưu người nhận/người gửi bằng display name thay vì immutable user ID.

**Unverified**

- MT-1 manual UAT-01..12 chưa chạy trên browser.
- Negative tests cho stale reference, cross-tenant mutation và same-code isolation chưa có automated coverage.

## 6. Membership và permission resolution

`currentMembership` lấy active membership theo `currentTenantId + currentUserId + ACTIVE`.

`hasPermission(state, module, action)` trả true nếu **bất kỳ role nào** trong membership có quyền tương ứng trong permission matrix của active tenant. Đây là permission union.

`setPersona` đổi user trong cùng tenant và chọn role đầu tiên của membership. `setRole` chỉ cho chọn role thuộc membership.

Điểm cần chốt trước MT-2: `setRole` thay đổi field `role`, nhưng `hasPermission` vẫn union tất cả role trong membership. Vì vậy “Vai trò hiệu lực” hiện không thực sự giới hạn quyền; nó chủ yếu ảnh hưởng nhãn UI/audit và alert targeting. Ví dụ membership Admin + DPO vẫn có quyền hợp của cả hai dù header hiển thị một role. MT-2 phải chọn rõ:

1. Union roles là mô hình chính thức và bỏ/đổi tên selector “Vai trò hiệu lực”; hoặc
2. Role selector là impersonation/effective-role mode và permission phải chỉ dùng selected role.

Ngoài ra, `setPerm` kiểm tra membership có role Admin, không kiểm tra selected role. Nhóm `users` bị khóa cố định trong matrix. Admin mặc định không có approve; DPO mặc định có approve.

Maker-checker so sánh display name của submitter với `currentActor`, không so sánh nhãn role. Đổi role của cùng persona không bypass tự duyệt, nhưng immutable user ID vẫn cần cho model bền vững.

## 7. Scope của approval notification và audit

### Approval

- Approval không có collection riêng; `getApprovals` tổng hợp pending request từ Purpose, Consent, Notice, Banner, Import, Rule và Matrix của active projection.
- Approve/reject lookup lại request tại thời điểm action; request không còn pending bị từ chối.
- Approver phải có permission union `approve` trong active tenant và không cùng actor display name với submitter.
- Vì chỉ active arrays được lookup/mutate, approval của tenant khác không xuất hiện sau tenant switch.

### Notification

- `nlog` và `alerts` nằm trong `TenantWorkspace`.
- `notifyApprovers` lọc memberships theo active tenant và role có approve permission trong active permission matrix.
- Bell và Notification Center derive từ active approvals, active `nlog`, active `alerts`.
- Kết quả approval được gửi tới submitter bằng display name.

### Audit

- `audit` nằm trong `TenantWorkspace`.
- `allowed` ghi failed audit entry khi store action bị từ chối quyền.
- Permission changes, approval lifecycle và nhiều domain actions ghi audit trước/sau.
- `/audit` chỉ đọc active audit array; mở màn hình cũng ghi một entry “Xem nhật ký”.

**Rủi ro:** recipient/actor dùng tên hiển thị có thể va chạm hoặc thay đổi. MT-2 nên chuyển internal references sang user ID, chỉ resolve display name khi render.

## 8. Tenant Application và integration UI hiện tại

### Tenant Creation hoặc Tenant Management

**Missing**

- Không có Platform Administration route, sidebar group hoặc console riêng.
- Không có create/update/suspend/reactivate/archive tenant action.
- Không có Organization detail, provisioning workflow, tenant settings, SSO settings, data residency view, primary admin assignment hoặc operator audit.
- Tenant catalogue là constant seed và tenant switcher chỉ chuyển context.

**Partially implemented**

- Tenant name/code/status đã có trong type và seed.
- `switchTenant` chặn tenant không Active.
- `/users` có list membership tenant hiện tại và permission matrix.

SRS UC-08 nói Organization và SSO configuration được đội vận hành CMP tạo khi khởi tạo tenant. Roadmap MT-2 yêu cầu đề xuất Platform Administration interface để tạo/quản lý Organization. Vì vậy đây là platform extension cần đặc tả riêng, không nên nhét vào tenant Admin console.

### Application Registration

**Missing**

- Không có create/edit/detail/activate/deactivate Application.
- Không có origin, public key, webhook hoặc connectivity test model/action.
- Không có SCR-06-02 equivalent.

**Partially implemented**

- `TenantApplication` có `id`, `name`, `property` và nằm trong workspace.
- Consent có Application assignment.
- Matrix theo Application.
- `/integrations` có read-only Application table.

### Integration Code Generator

**Missing**

- Không có deployment target/config ID.
- Không có platform/framework selector.
- Không có generated snippet, copy action, installation checklist hoặc sandbox gắn deployment target.
- Không có shared SDK runtime implementation.

Điều này phù hợp roadmap: Application management thuộc MT-3; generator/shared runtime demo thuộc MT-4.

## 9. Component và pattern có thể tái sử dụng cho MT-2

### Layout và navigation

- `AppLayout`, `SidebarProvider`, `SiteHeader`, `AppSidebar`.
- `NAV`/`ROUTE_MOD` pattern cho route permission mapping.
- Với Platform Administration, nên tái sử dụng visual primitives nhưng tạo layout/context riêng; không nên dùng tenant workspace navigation mặc định vì platform operator không mặc nhiên có quyền xem tenant personal data.

### Page composition

- `PageHeader`, `Section`, `Kpi`, `Pill`, `StatusBadge`, `Note`, `Mono`, `KV`.
- `DataTable`, pagination và column header.
- `Tabs`, `Dialog`, `Sheet`, `Card`, `Table`, `FormField`, `NativeSelect`, `Checkbox`.
- `Empty`, `JsonBlock`, toast helper `msg`.

### Governance UX

- Users/RBAC matrix table là nền tảng tốt cho tenant role permissions.
- `ApprovalDialog` và `CompareDialog` có thể tái sử dụng nếu tenant settings nào thực sự cần maker-checker; tenant provisioning cấp platform không nên tự động dùng approval tenant-level.
- Notification Bell/Center và Audit list/detail có pattern tái sử dụng, nhưng platform events phải có platform-owned store/audit riêng.
- `BusinessContextHelp`, `RelationshipNote`, `SimulationNotice`, `WorkflowNextSteps` phù hợp để giải thích ranh giới Platform Admin và Tenant Admin.

### State patterns

- Deep-clone seed factory và active workspace initialization có thể dùng làm prototype provisioning helper.
- `allowed`, `log`, `notify`, immutable array updates và ownership validation là pattern tham khảo.
- Không nên tiếp tục mở rộng một `store.ts` duy nhất cho toàn bộ Platform Administration; nên tách platform catalogue/actions/selectors khỏi tenant workspace domain.

## 10. MT-2 implementation prerequisites

1. **Chốt ranh giới actor.** Platform Operator là platform persona/capability, không phải role thứ tư trong ba tenant business roles. Không cấp data-plane access mặc định.
2. **Chốt surface.** Platform Administration nên là route/layout riêng hay mode riêng, không chỉ là tab trong `/users`.
3. **Chốt tenant lifecycle.** Tối thiểu Draft/Provisioning/Active/Suspended/Archived hoặc giữ `ACTIVE/SUSPENDED`; quy định rõ tác động lên login, switching và dữ liệu.
4. **Mở rộng Tenant model.** Cần organization profile, status metadata, locale/timezone, data residency display, SSO domain/config summary, createdAt/createdBy và primary contacts/admins ở mức prototype.
5. **Thiết kế provisioning.** Tạo tenant phải tạo workspace hoàn chỉnh, permission defaults, ít nhất một Admin membership và seed/empty-data policy nhất quán.
6. **Chốt role semantics.** Permission union hay selected effective role như mục 6.
7. **Chốt membership scope.** Organization/Brand/Property scope là yêu cầu UC-08 nhưng chưa có model. Phải quyết định MT-2 làm đầy đủ hay chỉ Organization scope và defer Brand/Property enforcement sang MT-3.
8. **Thống nhất user source.** Loại bỏ lệch giữa `workspace.users` và global `memberships`; xác định user identity catalogue, tenant membership và invitation state.
9. **Dùng immutable IDs.** Pending request, notification và audit actor/recipient nên tham chiếu user ID; display name là presentation only.
10. **Tách platform và tenant audit.** Platform create/suspend tenant phải ghi platform audit mà không đưa vào audit ledger của tenant hoặc đọc tenant data.
11. **Chốt reset/default behavior.** SRS yêu cầu “Khôi phục mặc định” permission matrix; UI/action hiện chưa có.
12. **Chuẩn bị UAT.** Chạy baseline MT-1 UAT trước thay đổi và bổ sung test cases platform/tenant boundary.

## 11. Rủi ro và regression trước MT-2

| Rủi ro | Tác động | Kiểm soát đề xuất |
|---|---|---|
| Active projection và `workspaces` có hai biểu diễn | Provision/update tenant dễ tạo snapshot thiếu field hoặc stale | Tạo một workspace factory duy nhất và invariant tests |
| Platform Admin bị mô hình hóa như tenant role | Có thể vô tình thấy Records/Evidence của khách hàng | Platform context/store/layout riêng; deny data-plane by default |
| Permission union khác “vai trò hiệu lực” | UI/audit hiển thị role không phản ánh quyền thật | Chốt semantics và sửa selector/label trước RBAC UX |
| Actor/recipient lưu bằng display name | Va chạm tên, rename làm hỏng maker-checker/notification | Lưu immutable user ID trong request/notification/audit |
| User data có hai nguồn | Membership list và workspace users lệch nhau | Chuẩn hóa identity + membership model |
| Tenant creation không khởi tạo đủ workspace fields | Runtime crash hoặc data bleed khi switch | Workspace schema factory, validation, empty-state coverage |
| Membership không có scope | Không đáp ứng Organization/Brand/Property enforcement | Bổ sung scope model hoặc ghi rõ MT-2 chỉ Organization scope |
| Property đang phụ thuộc Application | Xung đột SRS và MT-3 model | Không mở rộng model tạm thời; chốt ownership trước MT-3 |
| Tenant switch dùng current user membership | Platform operator không thể provision/inspect catalogue theo cách hiện tại | Tách platform navigation khỏi tenant switcher |
| Local component state sau context change | Stale dialog/form/route có thể mutate tenant mới | Duy trì remount/reset và thêm route-specific tests |
| Không có persistence/transaction | Reload mất tenant mới; multi-step provisioning có thể dở dang | Gắn nhãn demo, atomic Zustand action và deterministic seed |
| Không có automated tests | Regression isolation/maker-checker khó phát hiện | Thêm ít nhất store-level tests nếu scope cho phép; nếu không, bắt buộc UAT checklist |
| MemoryRouter | Không deep-link/share Platform Admin route thật | Xác nhận đây vẫn là constraint prototype |
| `store.ts` tiếp tục phình lớn | Coupling và review risk tăng | Tách platform slice/selectors/actions và shared factories |

## 12. Missing requirements và quyết định chưa chốt

- Platform operator identity, authentication và permission model.
- Ai được tạo, suspend, reactivate hoặc archive Organization.
- Platform operator có được xem metadata nào của tenant; mặc định không được xem personal data.
- Tenant lifecycle và hành vi session khi suspended.
- Empty tenant hay tenant có demo seed sau provisioning.
- Primary Tenant Admin invitation/activation flow và invariant “ít nhất một Admin”.
- Xử lý khi không còn người có quyền approve.
- SSO/MFA chỉ hiển thị settings mô phỏng hay có interaction state.
- Organization profile khác gì Tenant; có Brand trong MT-2 hay defer sang MT-3.
- Membership scope enforcement theo Organization/Brand/Property.
- Permission union hay effective-role mode.
- Có cần Platform Administration approval/maker-checker hay không.
- Platform audit retention và separation với tenant audit.
- Tenant settings nào thuộc MT-2, tránh lấn sang MT-3 Application/Property và MT-4 SDK/deployment.
- SRS gọi tenant provisioning là công việc đội vận hành CMP nhưng không đặc tả Platform Admin screens; screen mới cần PO-approved product behavior.

## 13. Recommended implementation order

1. **Baseline verification:** chạy MT-1 UAT-01..12 và lưu kết quả trước khi sửa.
2. **Decision record:** chốt platform actor/context, tenant lifecycle, permission semantics, membership scope và MT-2/MT-3 boundary.
3. **Domain model:** mở rộng Tenant/Organization metadata, user identity, membership scope/status và platform audit types.
4. **Store architecture:** tạo platform catalogue/actions và canonical `createTenantWorkspace` factory; giữ tenant data-plane tách biệt.
5. **Platform Administration shell:** route/layout riêng, Organization list/detail/create/suspend UI; không expose tenant Records/Evidence.
6. **Provisioning workflow:** atomic create Organization + workspace + primary Admin membership + default permission matrix.
7. **Tenant Settings:** organization profile và settings đã được chốt; chưa làm Application/Property CRUD hoặc code generator.
8. **Users and memberships:** invite/activate/revoke/change roles/scope với invariants và audit; thay toast-only flow.
9. **RBAC UX:** permission matrix, restore defaults, warning khi không còn approver; thống nhất union/effective role behavior.
10. **Isolation hardening:** stale route/dialog reset, suspended tenant behavior, immutable actor IDs, platform-vs-tenant audit tests.
11. **Regression validation:** TypeScript, lint, build, MT-1 regression UAT và MT-2 UAT; ghi rõ browser-verified versus source-only.

## 14. Phân loại tổng hợp

| Capability | Trạng thái |
|---|---|
| Three tenant workspaces và tenant switch | Implemented |
| Tenant membership và role-per-tenant | Implemented |
| Tenant-scoped permission matrix | Implemented |
| Tenant-scoped domain data, approvals, notifications, audit | Implemented; browser UAT unverified |
| Prompt 03 clarity và six Guided Demo scenarios | Implemented; runtime partially manual/unverified |
| Prompt 04A Rule/Matrix lifecycle | Implemented; browser UAT unverified |
| User list từ membership | Implemented read-only projection |
| Invite user | Partially implemented, toast only |
| Membership CRUD, revoke, role/scope management | Missing |
| Organization/Brand/Property structure management | Missing |
| Tenant settings | Missing |
| Platform Administration và tenant creation/management | Missing |
| Application registration/detail | Missing; static list only |
| Integration Code Generator/shared SDK deployment UI | Missing, deferred MT-4 |
| Automated isolation/regression tests | Missing |

