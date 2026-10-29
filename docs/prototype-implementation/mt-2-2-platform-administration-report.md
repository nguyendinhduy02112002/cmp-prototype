# MT-2.2 Platform Administration Report

**Ngày hoàn thành:** 28/10/2026  
**Trạng thái:** Implemented, automated checks pass, browser smoke UAT pass cho các luồng chính.

## 1. Architecture summary

MT-2.2 bổ sung một control-plane riêng bên cạnh tenant data-plane:

```text
CMP SaaS prototype
├── Platform Administration (/platform/*)
│   ├── platform identity + platform role
│   ├── tenant registry
│   ├── tenant lifecycle commands
│   └── platform audit + localStorage persistence
└── Tenant Workspace (existing routes)
    ├── tenant membership + effective role
    ├── TenantWorkspace business collections
    └── tenant notifications, approvals and audit
```

Platform routes dùng `PlatformLayout`, `PlatformSidebar`, `PlatformHeader` và platform guard riêng. Không gọi `useCan`/tenant permission matrix để quyết định platform access. Platform actor không được thêm vào tenant membership; liên kết về Tenant Workspace chỉ trở lại tenant persona đang tồn tại, không impersonate platform operator vào tenant.

Tenant registry là nguồn dùng chung cho platform dashboard/directory và danh sách tenant của tenant store. Platform snapshot persist trong `localStorage` key `cmp-platform-state-v1`. Tenant business data không được đưa vào platform snapshot.

## 2. Modified files

- `src/lib/types.ts`: mở rộng tenant metadata (`description`, `contactEmail`, `createdAt`, `updatedAt`).
- `src/lib/platform-data.ts`: platform types, actors, seed registry, storage validation/read/write.
- `src/lib/platform-store.ts`: Zustand platform store, permission resolver, tenant lifecycle và platform audit.
- `src/lib/store.ts`: đọc persisted tenant registry; factory workspace rỗng cho tenant provision mới.
- `src/components/platform-layout.tsx`: layout, navigation, header/persona selector và platform access-denied.
- `src/app/platform.tsx`: platform dashboard, tenant directory/create/edit/status, platform audit.
- `src/config/routes.tsx`: dedicated routes `/platform`, `/platform/tenants`, `/platform/audit`.
- `src/components/site-header.tsx`: entry point chuyển sang Platform Administration.
- `src/components/layouts/base-layout.tsx`: chặn Tenant Workspace khi active tenant bị suspend.
- `tests/platform-administration.test.ts`: automated TC-01..TC-15.
- `docs/prototype-implementation/mt-2-2-platform-administration-report.md`: báo cáo này.

Không thêm dependency. Không triển khai Application/Property CRUD, SDK hoặc Integration Code Generator.

## 3. Platform permission model

Platform roles tách hoàn toàn khỏi `Admin | DPO | Nhân viên`:

| Action | Platform Administrator | Platform Viewer |
|---|---:|---:|
| Dashboard | Có | Có |
| Tenant directory/detail | Có | Có |
| Tạo tenant | Có | Không |
| Sửa metadata | Có | Không |
| Activate/suspend | Có | Không |
| Platform audit | Có | Không |

`canPlatform(actor, action)` là resolver tập trung. Actor không có platform role fail-closed và nhận 403. Invalid actor persistence được thay bằng persona không có role, không fallback thành Administrator.

Platform role không tạo tenant membership và không ảnh hưởng `hasPermission()` của tenant store. Tenant effective-role switch không thay platform permissions.

## 4. Tenant lifecycle implementation

### Creation

- Required: tên tổ chức, tenant code.
- Optional: description, contact email.
- Code được uppercase và validate bằng format chữ/số/gạch ngang, bắt đầu bằng chữ.
- Enforce uniqueness case-insensitive trên registry.
- Tạo tenant `ACTIVE`, timestamps, workspace rỗng cho mọi collection và permission defaults.
- Không copy seed business data.
- Không tạo membership hoặc cấp quyền cho platform actor.
- Ghi `TENANT_CREATED` vào platform audit.

### Metadata update

- Cho sửa name, description, contact email; code bất biến.
- Validate required name và email format.
- Đồng bộ cùng registry cho platform và tenant switcher.
- Persist qua refresh và ghi `TENANT_UPDATED`.

### Activation/suspension

- Có confirmation dialog, success toast và trạng thái rõ ràng.
- Suspended tenant bị loại khỏi switch options và tenant layout fail-closed nếu đang active.
- Workspace không bị xóa hoặc thay thế.
- Activate cho phép membership hợp lệ truy cập lại.
- Ghi `TENANT_SUSPENDED`/`TENANT_ACTIVATED` trong platform audit.
- Không có permanent delete.

### Platform audit

Event gồm event ID, actor ID/name, platform role, lifecycle action, target tenant ID, timestamp và metadata. Metadata chỉ chứa code, organization name, status hoặc danh sách field thay đổi; không ghi contact email hay dữ liệu consent subject. Ledger này không xuất hiện trong tenant audit.

## 5. Test results

Automated test được bundle bằng Vite SSR toolchain hiện có và chạy bằng Node; bundle tạm đã xóa sau test.

| TC | Kết quả | Bằng chứng |
|---|---|---|
| TC-01 Platform Admin access | PASS | Có toàn bộ platform actions. |
| TC-02 Viewer read-only | PASS | View dashboard/directory; create/edit denied. |
| TC-03 Tenant Admin no platform role | PASS | `tenant-only-admin` fail-closed. |
| TC-04 Platform actor no tenant membership | PASS | Platform actor IDs không tồn tại trong tenant memberships. |
| TC-05 Empty isolated workspace | PASS | Purpose/Consent/Event/Audit đều rỗng; không membership. |
| TC-06 Unique code | PASS | Duplicate `QA-TENANT` bị từ chối. |
| TC-07 Metadata persistence contract | PASS | Platform và tenant registries cập nhật cùng tenant; browser refresh verified. |
| TC-08 Suspended access | PASS | `switchTenant` từ chối; tenant layout chặn active suspended tenant. |
| TC-09 Suspension preserves data | PASS | Marker purpose còn nguyên; browser Retail dashboard trở lại 281 sau reactivation. |
| TC-10 Lifecycle audit | PASS | Created/updated/suspended/activated events. |
| TC-11 No personal data in audit | PASS | Contact email không có trong serialized audit. |
| TC-12 Context permission isolation | PASS | Đổi platform role không đổi tenant permissions. |
| TC-13 MT-1 isolation | PASS | Retail/Health workspaces vẫn là object/data scopes riêng. |
| TC-14 MT-2.1 effective role | PASS | Health DPO có setup approve, không có users edit. |
| TC-15 Invalid platform context | PASS | Invalid actor bị thay bằng no-role và deny dashboard. |

Output:

```text
TC-01..TC-15 platform administration checks passed
```

## 6. TypeScript, ESLint và production build

| Check | Result |
|---|---|
| `tsc --noEmit` | PASS |
| ESLint | PASS, 0 errors |
| Existing lint warnings | 12 `react-refresh/only-export-components`, không tăng |
| `npm run build` | PASS |
| Vite modules | 3,049 transformed |
| Build warning | Main bundle khoảng 1.42 MB; code-splitting chưa nằm trong scope |

## 7. Browser UAT status

Browser smoke UAT **đã thực thi** trên Codex in-app Chromium tại Vite dev server:

- Platform dashboard render KPI/chart từ registry: PASS.
- Viewer không thấy Create và Platform Audit: PASS.
- Tenant-only Admin nhận platform 403: PASS.
- Blank create form hiển thị required errors: PASS.
- Admin tạo `UAT-MT22`, sửa organization name và suspend: PASS.
- Platform audit hiển thị Create/Update/Suspend và không chứa contact email: PASS.
- Refresh giữ tenant mới, metadata, suspended status và platform actor: PASS.
- Suspend ABC Retail chặn Tenant Workspace: PASS.
- Reactivate ABC Retail khôi phục truy cập, dashboard vẫn có KPI 281: PASS.
- Browser console lượt cuối: không có application runtime error; chỉ Vite debug và React DevTools info.

Không có screenshot file được persist vào repository. Evidence là DOM/accessibility snapshots và command outputs trong phiên Codex.

## 8. Known limitations

1. Đây là frontend prototype. `localStorage` và client guards không phải production authorization hoặc durable storage.
2. Platform persona selector mô phỏng authentication/role assignment; không có SSO/backend identity.
3. MemoryRouter reset route về tenant dashboard sau full reload; platform state vẫn persist và được verified khi vào lại Platform Administration.
4. Tenant business data hiện chỉ in-memory. Registry/audit/status persist, nhưng business mutations không persist qua full reload như database thật.
5. Tenant creation không gán initial membership vì UI chưa có explicit membership configuration; đúng yêu cầu không auto-grant.
6. Contact email là platform tenant metadata nhưng không được đưa vào audit. Production cần encryption, retention và access controls phía server.
7. Không có delete/archive lifecycle, bulk actions, SSO configuration, tenant settings, application/property management hoặc SDK tooling.
8. Existing 12 Fast Refresh lint warnings và bundle-size warning chưa xử lý vì ngoài scope.

## 9. Readiness for MT-2.3

**Ready.** Platform control-plane, tenant registry/lifecycle, platform RBAC, audit separation và persistence đã có nền tảng đủ để bắt đầu MT-2.3 Tenant Settings.

MT-2.3 nên tiếp tục giữ tenant settings trong tenant scope, dùng tenant effective-role enforcement, và không đưa consent/evidence data vào platform store. Trước productionization cần backend authorization, immutable operator identity, server audit ledger và database transaction boundaries.
