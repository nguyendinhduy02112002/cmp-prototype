# MT-3.1 Application Registration and Management Architecture Plan

## 1. Scope and requirement baseline

MT-3.1 turns the existing tenant-scoped Application seed data into a functional directory and lifecycle workflow. The implementation follows SRS-FR-006/UC-06 for tenant Admin ownership, view-only access for DPO and Staff, Inactive/Active lifecycle, stable `app_id`, Property ownership, audit, and no DPO approval. The prompt decision limits this milestone to Application identity and metadata; origin, public key, webhook, Consent/Banner assignment, configuration publishing and SDK are deferred.

## 2. Existing architecture to preserve

- `TenantWorkspace.applications` and `TenantWorkspace.properties` are already isolated by tenant.
- The active workspace projection keeps existing Consent, Matrix, Simulator and Evidence references compatible.
- Effective permissions are resolved centrally from active membership plus effective role.
- Tenant audit uses the existing append-only `AuditEntry` ledger.
- Platform lifecycle registry is separate and controls ACTIVE/SUSPENDED tenant access.

## 3. Domain model

`TenantApplication` keeps the existing stable `id`, `name` and legacy `property` display field, and adds tenant ownership, immutable code, type, Property ID, status and creation/update metadata. Supported types are WEB, SYSTEM and MOBILE. WEB and SYSTEM come from UC-06; MOBILE is retained for existing prototype relationships and the current mobile demo application.

New Applications start INACTIVE. Deactivation preserves the object and every ID-based relationship. Application code is unique inside a tenant; the SRS name uniqueness rule is enforced inside the selected Property.

## 4. Store and isolation design

Store actions accept an expected tenant ID captured by the UI. Before mutation they verify:

1. Active tenant matches the captured tenant.
2. Tenant exists and is ACTIVE.
3. Active membership/effective role has `integ.edit`.
4. Property and Application resolve inside the active workspace.
5. Validation and uniqueness constraints pass.

This rejects stale dialogs after tenant switching and cross-tenant IDs even when a caller bypasses the UI.

## 5. Persistence

Application arrays are persisted under a dedicated versioned localStorage key, keyed by immutable tenant ID. Seed Applications are normalized once and overlaid only by valid persisted entries. New tenants remain empty. This does not persist other business modules and does not introduce a parallel Zustand store.

## 6. UI and routing

- `/applications`: searchable, filterable, paginated tenant Application directory.
- `/applications/:applicationId`: tenant-resolved detail with metadata, status and edit actions.
- Sidebar uses the existing `integ` permission module.
- The existing Integrations hub remains for event, connector and scanner demonstrations; Application management moves to the dedicated route.

## 7. RBAC and audit

- Admin: view and edit by default through `integ` permission.
- DPO and Staff: view-only by the default matrix; tenant matrix customization remains authoritative.
- Every successful create/update/status action writes Tenant Audit with tenant ID, immutable user ID, effective role, Application ID and non-sensitive changed-field metadata.
- Denied store mutations use the existing failed-access audit convention.
- No Platform Audit event is created.

## 8. Implementation order

1. Extend and normalize the Application model without changing IDs.
2. Add versioned tenant-keyed persistence and validation helpers.
3. Add guarded store actions.
4. Add directory/detail routes and navigation.
5. Update the Integrations hub to point to the functional directory.
6. Add automated TC-01 through TC-18 coverage.
7. Run TypeScript, ESLint, build and browser UAT.

## 9. Deferred work

- MT-3.2 Property CRUD.
- MT-3.3 Consent and Banner assignment.
- MT-3.4 configuration publishing.
- MT-4 origin, keys, webhook, SDK and generated installation code.
