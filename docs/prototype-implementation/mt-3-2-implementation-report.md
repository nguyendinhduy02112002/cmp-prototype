# MT-3.2 Property Management — Implementation Report

## 1. Status and implemented scope

**IMPLEMENTED and VERIFIED.** Property Management is available inside Application Detail. Authorized tenant administrators can list, search, filter, create, view, edit, activate and deactivate tenant/application-owned Properties. Direct detail resolution and every mutation enforce Tenant → Application → Property ownership.

**DEFERRED.** Consent/Banner assignment (MT-3.3), configuration publishing (MT-3.4), deployment IDs, SDK code and runtime (MT-4) are not implemented.

## 2. Architecture decisions

The explicit PO hierarchy makes Application the Property parent. This differs from the direction implied by SRS UC-06/UC-08, which describes Organization → Brand → Property and an Application referencing a Property. The approved MT-3 hierarchy is used for this prototype; Brand remains an open product decision.

Legacy `Application.propertyId/property` fields remain optional compatibility metadata. `TenantProperty.applicationId` and `tenantId` are now the ownership source of truth. Existing IDs `property-1..3`, Application IDs, Consent/Application references, Matrix references, Banner site names and Event property names are preserved.

## 3. Files changed for MT-3.2

- `src/lib/types.ts`: extended tenant-owned Property model; made legacy Application Property link optional.
- `src/lib/property-data.ts`: validation and tenant-keyed persistence.
- `src/lib/application-data.ts`: Applications no longer require a Property at registration.
- `src/lib/store.ts`: migration, persistence overlay and guarded Property actions.
- `src/app/properties.tsx`: Property directory, form, detail and lifecycle UI.
- `src/app/applications.tsx`: Properties section and removal of the old Property selector from Application form.
- `src/config/routes.tsx`: Property Detail route.
- `tests/property-management.test.ts`: MT-3.2 acceptance checks.
- `tests/application-management.test.ts`: MT-3.1 regression updated for zero-Property Applications.
- MT-3.2 plan, report and UAT checklist under `docs/prototype-implementation/`.

Previously modified Banner/Simulator files in the working tree were preserved and were not rewritten for MT-3.2.

## 4. Property model and types

Property has a stable internal ID, `tenantId`, immutable `applicationId`, name, application-scoped code, type, technical identifier, description, status, timestamps and immutable actor IDs. Supported types are:

- `WEB`: requires an HTTPS origin without path/query/fragment.
- `ANDROID`: requires a reverse-domain package name.
- `IOS`: requires a reverse-domain bundle ID.

WEB is aligned with the SRS technical origin concept. ANDROID/IOS are approved prototype extensions, not asserted as explicit SRS requirements.

## 5. Validation and ownership enforcement

- Name: required, maximum 100 characters, unique inside the owning Application.
- Code: required, maximum 50 characters, uppercase letter/number/hyphen format, unique inside the owning Application.
- The same code can exist in another Application or Tenant.
- Technical identifiers are unique within a tenant.
- Description: maximum 500 characters.
- Create requires an ACTIVE Tenant, ACTIVE parent Application and `integ.edit`.
- Edit/status require active tenant, `integ.edit`, matching active tenant, captured tenant/application context, real parent Application and matching Property ownership.
- Cross-tenant, cross-application and stale-dialog mutations fail closed in the Zustand action, not only in the UI.

Effective demo availability is `Tenant ACTIVE && Application ACTIVE && Property ACTIVE`. Parent deactivation does not rewrite child status.

## 6. RBAC and audit

MT-3.2 reuses the centralized effective-role resolver through `integ.view/edit`:

- Admin: view and manage by default.
- DPO: view-only by default.
- Staff: view-only by default.
- Platform roles do not grant tenant access.

Tenant Audit records create, update, activate and deactivate with tenant ID, immutable actor ID, effective role, Application ID, Property ID and non-sensitive changed-field metadata. No Property action writes Platform Audit.

## 7. Persistence and migration

`cmp-tenant-properties-v1` stores tenant-keyed Property arrays in the existing localStorage prototype style. Seed data is deterministically normalized and persisted tenant data overlays it. Unknown parent references are rejected during hydration. New tenant workspaces remain empty; creating an Application does not create a Property.

Property changes survive browser reopening/refresh. Existing Tenant Audit remains session-scoped because the current tenant audit mechanism is not persisted; this is an existing prototype limitation.

## 8. SRS traceability

- UC-06: stable Application context, technical origin, tenant/RBAC/audit constraints.
- UC-08: tenant isolation, Admin management, name length/parent uniqueness and audit.
- Common RBAC/audit rules: centralized effective-role permissions and append-only tenant audit behavior.
- PO override: Application → Property ownership and ACTIVE/INACTIVE lifecycle for MT-3.2.

The SRS archival rule involving Active Applications cannot be applied literally after reversing the ownership direction. MT-3.2 therefore implements non-destructive ACTIVE/INACTIVE status and documents archival policy as unresolved.

## 9. Automated and technical results

| Check | Result |
|---|---|
| Property TC-01..TC-22 | PASS |
| Effective-role TC-01..TC-10 | PASS |
| Platform Administration TC-01..TC-15 | PASS |
| Tenant Settings TC-01..TC-18 | PASS |
| Application Management TC-01..TC-18 | PASS |
| TypeScript `tsc --noEmit` | PASS |
| ESLint changed MT-3.2 files | PASS, 0 errors |
| Full repository ESLint | PASS, 0 errors; 12 pre-existing Fast Refresh warnings |
| Production build | PASS |

The production build retains the existing non-blocking chunk-size warning (`~1.47 MB` main JS before gzip, `~435 KB` gzip).

## 10. Browser UAT

**VERIFIED** on 29 October 2026 using the in-app Chromium browser against Vite at `http://127.0.0.1:5173`.

Executed: open Application Directory; open Application Detail; create Website Property `WEB-UAT-32`; view detail; edit metadata; deactivate; reactivate; reopen browser context; verify persistence; switch ABC Health → ABC Retail and verify isolation; switch back; verify DPO read-only behavior; inspect Tenant Audit; inspect browser error log.

Results: all executed flows PASS. Browser console error log was empty. DOM evidence showed create/update/deactivate/activate audit rows with the correct Admin persona. No screenshot files were exported; evidence is the executed browser session and DOM/console captures.

## 11. Known limitations and risks

- Tenant Audit dynamic events reset after a full reload; Property data itself persists.
- Banner and Event legacy relationships use Property display names, not stable Property IDs. MT-3.3 must migrate assignments carefully.
- Brand is not modeled.
- Technical identifier changes do not invalidate a deployment because deployment does not exist yet.
- Inactive status is an administrative prototype state, not production runtime enforcement.
- MemoryRouter remains unchanged; browser address-bar deep links are not production URLs.

## 12. Readiness

MT-3.2 is ready for MT-3.3 design, provided MT-3.3 uses stable `property.id`, explicitly migrates Banner/site-name relationships, and resolves the Brand and archival-policy questions before claiming full UC-08 conformance.
