# Báo cáo hiện trạng Prototype CMP

## 1. Executive Summary

Prototype CMP là ứng dụng frontend đơn trang dùng để trình diễn nghiệp vụ Consent and Privacy Management Platform cho tenant minh họa ABC Retail. Ứng dụng đã thay đổi đáng kể so với dashboard template ban đầu: bổ sung mô hình dữ liệu CMP, 20 route, workflow phê duyệt, RBAC, simulator thu thập consent, consent ledger, evidence, dashboard và dữ liệu minh họa liên kết giữa các màn hình.

Ứng dụng không có backend, database, authentication hoặc API integration. Dữ liệu nằm trong Zustand in-memory store và bị khởi tạo lại khi reload. Vì vậy các hành vi được mô tả là WORM, JWS/JWE, KMS/HSM, webhook, email, SSO hoặc SHA-256 chỉ là mô phỏng giao diện/nghiệp vụ.

## 2. Project Overview

- Tên package: `shadcn-dashboard-vite`; tên sản phẩm trong README: `CMP Console Prototype`.
- Mục tiêu: prototype giao diện CMP Console theo SRS CMP v1.3, dùng dữ liệu giả định ABC Retail.
- Nền tảng ban đầu: shadcn dashboard landing template; source hiện tại đã loại bỏ nội dung landing/upgrade và thay bằng domain CMP.
- Entry point: `src/main.tsx` → `src/App.tsx` → memory router → `AppLayout`.
- Phạm vi runtime: browser-only, một tenant ngầm định, không persistence nghiệp vụ.

## 3. Technology Stack

| Hạng mục | Công nghệ | Trạng thái sử dụng | Bằng chứng |
|---|---|---|---|
| Framework | React 19 | Đang dùng | `src/main.tsx`, toàn bộ `.tsx` |
| Ngôn ngữ | TypeScript 6 | Đang dùng | `tsconfig*.json`, source `.ts/.tsx` |
| Build tool | Vite 8 | Đang dùng | `vite.config.ts`, scripts `dev/build/preview` |
| Styling | Tailwind CSS 4 | Đang dùng | `src/index.css`, `@tailwindcss/vite` |
| UI library | shadcn-style components, Base UI, Lucide | Đang dùng | `src/components/ui`, imports `lucide-react` |
| Routing | React Router DOM 7, `createMemoryRouter` | Đang dùng | `src/App.tsx`, `src/config/routes.tsx` |
| State | Zustand 5 | Đang dùng | `src/lib/store.ts` |
| Table | TanStack React Table | Đang dùng | `src/components/data-table/*`, `src/lib/data-table.ts` |
| Charts | Recharts | Đang dùng | `src/app/dashboard.tsx` |
| Theme | next-themes được cài; project dùng theme provider riêng | Một phần | `src/components/theme-provider.tsx`; `next-themes` không được import trực tiếp |
| Form | React Hook Form | Đã cài, chưa dùng | Không có import trong `src` |
| Validation | Zod, hookform resolvers | Đã cài, chưa dùng | Không có import trong `src` |
| Drag and drop | dnd-kit | Đã cài, chưa dùng | Không có import trong `src` |
| Date | date-fns | Không thấy dùng trực tiếp | Không có import trong source nghiệp vụ |
| Authentication | Không có | Chưa triển khai | Role được đổi trực tiếp trong header/store |
| API client | Không có | Chưa triển khai | Không có `fetch`, Axios hoặc service API |
| Database | Không có | Chưa triển khai | Dữ liệu từ `mock.ts` và Zustand |

Package manager thực tế là pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml`), dù scripts cũng chạy được bằng npm khi `node_modules` đã tồn tại.

## 4. Architecture Overview

```text
main.tsx
  └─ App.tsx
      ├─ Theme/Tooltip/Toast providers
      └─ createMemoryRouter(routes)
          └─ AppLayout
              ├─ AppSidebar + SiteHeader
              ├─ route-level permission check
              ├─ Outlet → src/app/*
              └─ global Approval/Compare dialogs

src/app + src/components/cmp
  └─ useStore / useCan
      ├─ Zustand state and domain actions
      └─ cloned data from src/lib/mock.ts
```

### Data flow

1. Mock data được clone khi store khởi tạo.
2. Component đọc slice bằng `useStore`.
3. User action gọi mutation trong store.
4. Mutation cập nhật state, audit và notification in-memory.
5. Các màn hình khác tự render lại từ cùng store.

Không có service layer, repository layer, API boundary, asynchronous request state hoặc centralized error boundary. Lỗi nghiệp vụ chủ yếu trả `{ok, msg}` hoặc hiển thị toast; form validation thực hiện thủ công tại component.

## 5. Project Structure

| Thư mục/file | Vai trò |
|---|---|
| `src/app` | Page-level components theo route/domain |
| `src/components/ui` | UI primitives kế thừa/phát triển từ shadcn template |
| `src/components/cmp` | Component domain CMP: approval, notification, renderer, kit |
| `src/components/layouts` | App shell và route permission gate |
| `src/components/data-table` | Table, pagination, column header tái sử dụng |
| `src/config/routes.tsx` | Route definitions |
| `src/config/nav.ts` | Sidebar groups và route-to-permission mapping |
| `src/lib/types.ts` | Domain types |
| `src/lib/store.ts` | State và phần lớn business mutations |
| `src/lib/mock.ts` | Seed data và event generator |
| `src/lib/perm.ts` | Module/action permission matrix |
| `src/lib/fmt.ts`, `utils.ts` | Format, ID/hash giả và CSS utilities |
| `src/hooks`, `src/contexts` | Mobile/theme helpers |
| `public` | Chỉ còn asset Vite mặc định; không có asset CMP đáng kể |

Không có thư mục `services`, `api`, `repositories`, test hoặc backend.

## 6. Module Inventory

| ID | Module | Route | Main components | Features chính | Data source | Status | Evidence |
|---|---|---|---|---|---|---|---|
| MOD-01 | Dashboard | `/dashboard` | `DashboardPage` | KPI, charts, filters, drill-down | Store/mock | Partially Functional | `src/app/dashboard.tsx` |
| MOD-02 | Notification & Approval | `/notifications` | `NotificationsPage`, `ApprovalDialog` | Inbox, alert, approve/reject/withdraw | Store | Partially Functional | `src/app/notifications.tsx`, `src/components/cmp/approval.tsx` |
| MOD-03 | Purpose & Data Catalog | `/purposes` | `PurposesPage` | CRUD draft, submit, stop, catalog import simulation | Store/mock | Partially Functional | `src/app/purposes.tsx` |
| MOD-04 | Consent Configuration | `/consents` | `ConsentsPage` | consent code, purpose, channel, app, duration, approval | Store/mock | Partially Functional | `src/app/consents.tsx` |
| MOD-05 | Notice Version | `/notices` | `NoticesPage` | bilingual content, material label, schedule/publish | Store/mock | Partially Functional | `src/app/notices.tsx` |
| MOD-06 | Banner & Popup | `/banners`, `/banners/:code` | `BannersPage`, `BannerEditorPage`, `BannerRenderer` | version, compliance checks, preview, approval | Store/mock | Partially Functional | `src/app/banners.tsx` |
| MOD-07 | Rules & Dependency Matrix | `/rules` | `RulesPage` | re-consent rules, purpose/function matrix | Store/static | Partially Functional | `src/app/rules.tsx` |
| MOD-08 | Consent Records | `/records`, `/records/:subject` | `RecordsPage`, `SubjectHistoryPage` | current state, filters, subject history | Derived store events | Partially Functional | `src/app/records.tsx`, `src/app/evidence.tsx` |
| MOD-09 | Evidence | `/evidence`, `/evidence/package/:id` | `EvidencePage`, `PackagePage` | evidence details, receipt, correction, package preview | Store/mock | UI Simulation | `src/app/evidence.tsx` |
| MOD-10 | Offline Consent | `/offline` | `OfflinePage` | create offline evidence, attachments metadata, correction | Store/mock | UI Simulation | `src/app/offline.tsx` |
| MOD-11 | Legacy Import | `/import` | `ImportPage` | batch, mapping, risk decisions, approval | Store/mock | UI Simulation | `src/app/admin.tsx` |
| MOD-12 | Collection Simulator | `/simulator` | `SimulatorPage` | cookie/form/preference/API flows | Store/mock | UI Simulation | `src/app/simulator.tsx` |
| MOD-13 | Rights Requests | `/rights` | `RightsPage` | read-only list | Static mock | Placeholder | `src/app/p3.tsx` |
| MOD-14 | Users & RBAC | `/users` | `UsersPage` | users, invite dialog, permission matrix | Store/mock | Partially Functional | `src/app/admin.tsx`, `src/lib/perm.ts` |
| MOD-15 | Audit | `/audit` | `AuditPage` | filters, details, access log | Store/mock | Partially Functional | `src/app/admin.tsx` |
| MOD-16 | Integrations | `/integrations` | `IntegrationsPage` | outbox, apps, connectors, scan tabs | Static/store mock | Placeholder/UI Only | `src/app/p3.tsx` |
| MOD-17 | Settings | `/settings` | `SettingsPage` | signing keys, alerts, usage display | Static mock | Placeholder/UI Only | `src/app/p3.tsx` |

## 7. Screen Inventory

| Screen ID | Screen/route | Actions và fields chính | Validation/behavior | Missing |
|---|---|---|---|---|
| UI-01 | Dashboard `/dashboard` | period/app/consent filters, chart click | Derived synchronously | API, loading/error/export |
| UI-02 | Notifications `/notifications` | filter, open approval, mark/read, resolve | Approval rules partly checked | email, concurrency, overdue escalation |
| UI-03 | Purposes `/purposes` | code/name/legal basis/items/recipients/flags | manual required/code checks | arbitrary version comparison, real catalog file import |
| UI-04 | Consents `/consents` | code/name/purposes/type/channels/apps/duration | manual purpose/app checks | runtime channel authorization |
| UI-05 | Notices `/notices` | consent, VI/EN content, material label, effective date | required content and approval checks | rich editor, full version compare |
| UI-06 | Banner list/editor | kind/site/layout/text/look/consents | compliance checklist | real deployment/SDK config |
| UI-07 | Rules `/rules` | defaults and matrix cells | basic UI restrictions | approval lifecycle for matrix/rules |
| UI-08 | Records `/records` | search/filter/row navigation | current state derived from latest event | server paging/export |
| UI-09 | Subject history | evidence list/export dialog | store-only | real identity lookup |
| UI-10 | Evidence `/evidence` | filters/detail/receipt/correction/export | role-based masking | real WORM/file/hash/signature |
| UI-11 | Evidence package | preview | synthetic hash | actual PDF/JSON download |
| UI-12 | Offline `/offline` | subject/consent/decision/time/files/version | manual checks, file metadata only | upload/storage/virus scan |
| UI-13 | Import `/import` | batch, mapping, risk decision | approval simulation | real parser/file upload/job |
| UI-14 | Simulator `/simulator` | cookie/form/preference/API | stateful simulation | actual SDK/API/OTP |
| UI-15 | Rights `/rights` | none beyond list | static | all UC-22..26 actions/details |
| UI-16 | Users `/users` | role matrix, invite dialog | UI permission check | organization structure; invite does not persist |
| UI-17 | Audit `/audit` | search/filter/detail | adds view log | immutable backend/export |
| UI-18 | Integrations `/integrations` | tabs, retry toast | mostly display | CRUD/detail/test/config workflows |
| UI-19 | Settings `/settings` | display sections | static | rotate key/configure alert/usage filters |
| UI-20 | Forbidden/Not Found | back navigation | route fallback | access denial audit |

## 8. Feature Status Rules

- **Fully Functional:** không ghi nhận feature end-to-end nào vì không có persistence/API để kiểm chứng toàn bộ acceptance criteria.
- **Partially Functional:** mutation thực sự thay đổi Zustand state và phản ánh liên màn hình, nhưng chỉ trong phiên browser.
- **UI Simulation:** có state/action minh họa nhưng external effect được giả lập.
- **Static UI:** render mock data, không có mutation đáng kể.
- **Placeholder:** trang tự ghi rõ ngoài đợt prototype hoặc chỉ giữ chỗ sitemap.

## 9. Data Sources

- `src/lib/mock.ts`: purposes, consents, notices, banners, users, events, applications, connectors, keys, rights requests.
- `src/lib/store.ts`: clone dữ liệu mock; tạo state phát sinh trong phiên.
- Static constants trong page: rule text, labels, demo threshold.
- `localStorage`: chỉ lưu theme, không lưu nghiệp vụ.
- Cookie: chỉ lưu trạng thái sidebar.
- Không có network/API/database.

## 10. Known Limitations and Validation

- Một tenant ngầm định ABC Retail; không có `tenantId` hoặc tenant switcher.
- `createMemoryRouter` không đồng bộ URL/deep link dù README mô tả hash URL.
- Không test tự động.
- `npm run build`: thành công; bundle JS khoảng 1.34 MB minified/401.51 KB gzip, có cảnh báo chunk >500 KB.
- ESLint: 0 error, 12 warning `react-refresh/only-export-components`.
- TypeScript được kiểm tra trong `tsc -b` của build và thành công.
- Static validation không phải runtime/UAT verification.
