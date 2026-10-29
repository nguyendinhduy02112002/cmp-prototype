# MT-2.1 Effective Role Enforcement Report

## 1. Kết luận

Đã sửa RBAC để mọi permission check của session hiện hành được tính theo đúng bộ ba:

```text
Active Tenant + Active Membership + Selected Effective Role
```

Không còn tính quyền session bằng hợp quyền của tất cả role trong membership. Role không thuộc active membership bị từ chối; context membership/role không hợp lệ trả quyền deny-all. Tenant switch giữ effective role hiện tại chỉ khi role đó được gán trong tenant đích, nếu không chọn role hợp lệ đầu tiên của membership đích.

Không triển khai Platform Administration, Application Registration, Property CRUD hoặc Integration Code Generator. Không thêm dependency.

## 2. Root cause

Root cause nằm ở hai resolver song song trong `src/lib/store.ts`:

- `hasPermission()` dùng `membership.roles.some(...)`.
- `useCan()` lặp lại cùng phép union.

Do đó `setRole()` chỉ đổi `state.role` để hiển thị/audit, còn Sidebar, route gate, buttons, store guards và approval vẫn nhận hợp quyền của mọi role được gán.

Một bypass liên quan tồn tại ở `setPerm()`: action chỉ kiểm tra membership có role Admin, không kiểm tra Admin có phải effective role hay không. Màn Notice cũng có một permission check trực tiếp `perm[role]` thay vì dùng resolver chung.

## 3. Centralized effective permission resolver

Resolver mới nằm trong `src/lib/perm.ts`:

- `resolveEffectivePermissions(membership, effectiveRole, matrix)`:
  - Membership phải tồn tại và Active.
  - Effective role phải thuộc `membership.roles`.
  - Trả đúng permission set của một role duy nhất.
  - Trả deny-all khi membership/role không hợp lệ hoặc stale.
- `resolveEffectiveRole(membership, requestedRole)`:
  - Giữ requested role nếu được gán.
  - Nếu không, chọn role đầu tiên được gán.
  - Trả `null` khi không có active membership/role hợp lệ.
- `canWithEffectiveRole(...)`:
  - API boolean duy nhất cho module/action checks.

`hasPermission()` và `useCan()` đều gọi resolver này. Vì thế Sidebar, route gate, page actions, store actions, approval dialog, Notification Center và các component dùng `useCan`/`hasPermission` tự động nhận cùng semantics.

`notifyApprovers()` vẫn tìm mọi user có ít nhất một assigned role có thể được kích hoạt để approve. Đây là recipient discovery cho người chưa đăng nhập, không phải union quyền của active session; việc kiểm tra từng role cũng đi qua resolver chung.

## 4. Tenant và role switching

### Role switching

`setRole()` hiện:

1. Resolve active membership.
2. Xác minh requested role thuộc membership.
3. Chỉ cập nhật role nếu hợp lệ.
4. Trả `{ ok, msg }` cho UI.
5. Ghi failed audit khi có yêu cầu role không hợp lệ.

Header hiển thị kết quả đổi role. Browser storage hiện không lưu role, nhưng resolver vẫn fail-closed nếu state được hydrate hoặc can thiệp với role stale trong tương lai.

### Tenant switching

`switchTenant()` hiện:

1. Kiểm tra tenant Active.
2. Tìm active membership của current user trong tenant đích.
3. Tải đúng workspace tenant đích.
4. Giữ effective role hiện tại nếu target membership có role đó.
5. Nếu không, chọn role hợp lệ đầu tiên của target membership.
6. Từ chối switch nếu membership không có role hợp lệ.
7. Nạp workspace và effective role trong cùng state update.

Persona switching dùng cùng role resolution để không giữ role không được gán cho persona mới.

## 5. Permission consumers

Đã rà các consumer sau:

- Sidebar navigation và badge counts.
- Route permission gate trong `AppLayout`.
- Purpose, Consent, Notice và Banner actions.
- Rules và Dependency Matrix.
- Records, Evidence và evidence export.
- Offline consent và Import.
- Simulator actions.
- Users/RBAC matrix edits.
- Approval approve/reject actions và common dialog.
- Notification Center và bell.
- Integration actions.
- Business-context next-step links.

Kết quả:

- Consumer dùng `useCan()` hoặc `hasPermission()` đã nhận resolver mới mà không cần logic cục bộ.
- Direct Notice permission check đã chuyển sang `useCan()`.
- `setPerm()` đã chuyển sang store guard `allowed("users", "edit", ...)`, nên chỉ effective role có quyền quản trị user/RBAC mới sửa được matrix.
- Approval `approve()` và `reject()` tiếp tục kiểm tra tại thời điểm action, nay theo effective role duy nhất.

## 6. Audit integrity

Mọi audit event mới tạo qua `log()` hoặc failed permission guard hiện ghi:

- `tenantId`
- `userId`
- `role` là selected effective role
- action/object/result
- UTC timestamp hiện hành

Audit detail UI hiển thị Tenant ID và User ID khi có.

Các seed/historical records cũ không bị rewrite; `tenantId` và `userId` là optional để giữ nguyên lịch sử trước thay đổi. Việc đổi effective role không sửa audit record cũ.

Maker-checker hiện vẫn nhận diện submitter bằng display name theo model cũ. Đây là limitation đã biết; effective-role switching không bypass maker-checker, nhưng production model nên dùng immutable user ID.

## 7. Modified files

- `src/lib/perm.ts`
  - Thêm centralized resolver và deny-all behavior.
- `src/lib/store.ts`
  - Thay union permission bằng effective-role permission.
  - Validate tenant/persona/role transitions.
  - Enforce effective role khi sửa permission matrix.
  - Bổ sung tenant/user audit metadata.
- `src/lib/types.ts`
  - Bổ sung `tenantId` và `userId` cho audit entries mới, giữ tương thích history cũ.
- `src/components/site-header.tsx`
  - Xử lý kết quả validation khi đổi effective role.
- `src/app/notices.tsx`
  - Loại direct matrix lookup, dùng centralized resolver.
- `src/app/admin.tsx`
  - Hiển thị Tenant ID và User ID trong audit detail.
- `tests/effective-role-enforcement.test.ts`
  - Automated store/resolver checks cho TC-01..TC-10.
- `docs/prototype-implementation/mt-2-1-effective-role-enforcement-report.md`
  - Báo cáo này.

## 8. Test results TC-01 through TC-10

Test được bundle bằng Vite SSR toolchain hiện có và chạy bằng Node trong process riêng. Không thêm test framework/dependency. Bundle tạm đã được xóa sau khi chạy.

| Test | Kết quả | Bằng chứng |
|---|---|---|
| TC-01 Multi-role chọn Auditor | Pass with project-role mapping | Project chỉ có Admin/DPO/Nhân viên; dùng DPO làm non-admin review role tương đương. DPO có `setup.approve`, không có `users.edit`. Không thêm role Auditor trái domain model hiện tại. |
| TC-02 Auditor → Privacy Officer | Pass with Admin/DPO mapping | Chuyển DPO ↔ Admin cập nhật ngay `setup.approve` và `users.edit`; không còn union. |
| TC-03 Tenant A → Tenant B | Pass | Role stale không thuộc target membership bị thay bằng target role hợp lệ; permission tenant trước không còn hiệu lực. |
| TC-04 Invalid role selection | Pass | `setRole()` trả fail và giữ effective role hợp lệ hiện tại. |
| TC-05 Stale role restored | Pass | Resolver trả deny-all cho role không thuộc active membership. |
| TC-06 Approval effective role | Pass | Admin effective role không approve setup; cùng multi-role user đổi sang DPO mới approve được request của người khác. |
| TC-07 Audit role integrity | Pass | Audit event mới ghi đúng `tenant-health`, `user-health-admin`, effective role `DPO`. |
| TC-08 No target membership | Pass | Tenant switch bị từ chối và active tenant không đổi. |
| TC-09 Single-role regression | Pass | Staff giữ đúng edit/view permissions, không có approve/users access. |
| TC-10 Role switch data safety | Pass | Purpose, Consent và Event data không thay đổi qua role switches. |

Automated check output:

```text
TC-01..TC-10 effective-role enforcement checks passed
```

## 9. Static validation

| Check | Result |
|---|---|
| TypeScript `tsc --noEmit` | Pass |
| ESLint | Pass, 0 errors |
| Existing ESLint warnings | 12 Fast Refresh warnings, unchanged |
| Effective-role automated checks | 10/10 pass |
| Browser UAT | Not performed / Unverified |

Production application build không được dùng để tuyên bố browser behavior. Browser UAT chưa chạy, do đó navigation rendering và interactive dialogs vẫn cần manual walkthrough trước MT-2.

## 10. Known limitations

- Đây vẫn là client-side prototype enforcement, không phải production authorization boundary.
- Browser UAT chưa được thực hiện.
- Domain hiện chỉ có Admin, DPO và Nhân viên; Auditor/Privacy Officer trong ví dụ yêu cầu không được thêm thành duplicate role model.
- Pending approval và notification vẫn lưu actor/recipient bằng display name.
- Historical audit seed không có tenant/user IDs và được giữ nguyên theo yêu cầu không rewrite history.
- Không có browser persistence cho effective role; stale hydration được resolver xử lý fail-closed nếu bổ sung persistence sau này.
- Recipient discovery cho notification xét các role được gán vì recipient chưa có active session role; action approve vẫn bắt buộc effective role hợp lệ khi thực hiện.
- Không có backend/API authorization; production phải enforce tenant, membership, effective role và object ownership phía server.

## 11. Readiness for MT-2

**Ready with one verification gate.** Effective-role enforcement prerequisite đã được sửa nhất quán và automated store-level scenarios pass. Có thể bắt đầu thiết kế/triển khai MT-2 sau khi chạy browser regression tối thiểu cho:

1. Multi-role user đổi Admin ↔ DPO và quan sát Sidebar/actions.
2. Approval dialog theo từng effective role.
3. Tenant switch với role hợp lệ/không hợp lệ ở tenant đích.
4. Audit detail ghi đúng tenant/user/effective role.
5. MT-1 UAT-01..12, ưu tiên UAT-03, UAT-04, UAT-05, UAT-06 và UAT-07.

MT-2 Platform Administration vẫn phải giữ platform context tách khỏi tenant roles và không cấp quyền xem dữ liệu cá nhân tenant theo mặc định.
