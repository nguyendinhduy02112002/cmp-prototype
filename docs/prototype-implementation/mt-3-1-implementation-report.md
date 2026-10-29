# MT-3.1 Application Registration and Management Implementation Report

## 1. Outcome

MT-3.1 is implemented as a tenant-scoped functional Application Directory and Application Detail workflow. Authorized tenant users can register, view, edit, activate and deactivate Applications without changing stable Application IDs or existing Consent, Matrix, Simulator and Evidence relationships. No backend, database, dependency, Property CRUD, assignment, publishing or SDK feature was added.

## 2. Scope implemented

- Dedicated `/applications` directory with search, type/status filters, sorting and pagination.
- Create form with required fields, format/length validation, same-tenant code uniqueness and SRS name uniqueness inside Property.
- Tenant-resolved `/applications/:applicationId` detail.
- Metadata edit with stable ID and tenant ownership.
- ACTIVE/INACTIVE lifecycle with confirmation and data preservation.
- Empty state for newly provisioned tenants.
- Store-level RBAC, active-tenant, suspended-tenant, relationship and stale-context guards.
- Tenant Audit for create, update, activate, deactivate and denied mutations.
- Versioned localStorage persistence keyed by tenant ID.
- Existing Integration hub links to the functional Application Directory and uses the extended Application model.

## 3. Architecture decisions

The existing `TenantWorkspace.applications` array remains the runtime source used by Consent, Matrix, Simulator and Integration screens. The model was extended in place instead of introducing a second Application store. Persistence stores only the Application arrays keyed by immutable tenant ID and overlays normalized seeds during initialization.

Every mutation receives `expectedTenantId` captured when its dialog opens. The action fails if the active tenant changed, the tenant is suspended, the effective role lacks `integ.edit`, the Property is not in the active workspace, or the Application ID cannot be found in the active workspace.

Application configuration is self-managed by Admin and does not enter the common DPO approval queue, as required by BR-UC06-07.

## 4. Source files changed

- `src/lib/types.ts`
- `src/lib/application-data.ts`
- `src/lib/store.ts`
- `src/app/applications.tsx`
- `src/app/p3.tsx`
- `src/config/routes.tsx`
- `src/config/nav.ts`
- `tests/application-management.test.ts`
- `docs/prototype-implementation/mt-3-1-architecture-plan.md`
- `docs/prototype-implementation/mt-3-1-implementation-report.md`
- `docs/prototype-implementation/mt-3-1-uat-checklist.md`

No dependency was added.

## 5. Application model

```ts
interface TenantApplication {
  id: string
  tenantId: string
  name: string
  code: string
  type: "WEB" | "SYSTEM" | "MOBILE"
  description?: string
  propertyId: string
  property: string
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy?: string
  activatedAt?: string
}
```

WEB and SYSTEM trace to UC-06. MOBILE is retained because the existing prototype already has a mobile Application referenced by tenant data. Existing `app_7Q2K9M`, `app_3HX81P` and `app_5MB20R` IDs remain unchanged.

New Applications start INACTIVE. Codes are unique inside one tenant and may repeat in another tenant. Names are unique inside the selected Property. Type becomes immutable after first activation, following SCR-06-02.

## 6. Tenant ownership enforcement

UI lists and resolves only the active workspace array. Store actions additionally verify active tenant identity, tenant ACTIVE status, active Property ownership, Application ownership and the captured dialog tenant. A Tenant A Application ID cannot resolve or mutate from Tenant B. Switching tenant preserves both workspaces and closes access to IDs absent from the target workspace.

This is frontend prototype isolation and is not production authorization.

## 7. RBAC mapping

Application management reuses the existing `integ` module:

| Effective role | View | Create edit status |
|---|---:|---:|
| Admin default | Yes | Yes |
| DPO default | Yes | No |
| Staff default | Yes | No |

The tenant permission matrix remains authoritative; there is no role-name check inside the UI or store action. Platform role does not create tenant membership or Application access.

## 8. Audit behavior

Successful actions write Tenant Audit with tenant ID, immutable user ID, effective role, action, Application ID, timestamp and non-sensitive metadata. Denied store mutations use the existing failed-access audit convention. Application actions do not write Platform Audit. No secret, key, webhook value or personal consent data is logged.

## 9. Persistence behavior

Storage key: `cmp-tenant-applications-v1`.

The payload is `Record<tenantId, TenantApplication[]>` and is sanitized before overlaying seed data. A missing or invalid entry falls back safely to the tenant seed. New tenant workspaces remain empty. Existing IDs and references are preserved. Tenant Audit still follows the existing in-memory workspace behavior and therefore newly added audit rows reset on full browser reload; this is a known prototype limitation.

## 10. UC-06 traceability

| UC-06 requirement | MT-3.1 result |
|---|---|
| SCR-06-01 list | IMPLEMENTED as Application Directory |
| SCR-06-02 identity/detail | IMPLEMENTED for identity, Property, type, status and metadata |
| Admin manage; DPO/Staff view | IMPLEMENTED through `integ` effective permissions |
| Stable app_id | IMPLEMENTED; generated once and preserved |
| Initial Inactive then Active/Inactive | IMPLEMENTED |
| Name 1–100, unique in Property | IMPLEMENTED |
| Type immutable after first Active | IMPLEMENTED |
| Audit every change | IMPLEMENTED in Tenant Audit |
| No DPO approval | IMPLEMENTED |
| Origin, client_id, S2S, key, JWE, webhook | DEFERRED to technical integration milestone |
| Runtime 403 for Inactive/origin mismatch | DEFERRED; no real API/SDK in prototype |

## 11. Automated test results

`tests/application-management.test.ts` covers TC-01 through TC-18 and passed. It verifies creation, validation, duplicate and cross-tenant code rules, directory/detail/mutation isolation, permission enforcement, switching, persistence snapshot, Tenant/Platform audit separation, suspension, existing relationships, empty new workspace, stale UI context and lifecycle preservation.

Regression suites also passed:

- Effective-role enforcement TC-01..TC-10.
- Platform Administration TC-01..TC-15.
- Tenant Settings TC-01..TC-18.
- Application management TC-01..TC-18.

## 12. Technical validation

| Check | Result |
|---|---|
| TypeScript `tsc --noEmit` | VERIFIED PASS |
| ESLint | VERIFIED PASS with 0 errors and 12 pre-existing Fast Refresh warnings |
| Production build | VERIFIED PASS |
| Browser console during MT-3.1 UAT | VERIFIED, no errors |

The existing bundle-size warning above 500 kB remains and is outside MT-3.1.

## 13. Browser UAT

VERIFIED in the in-app browser on the local Vite prototype:

- Opened Application Directory for ABC Retail.
- Created `BROWSER-UAT` and reached Application Detail.
- Edited metadata and activated the Application.
- Switched to ABC Health and confirmed the Retail Application was absent.
- Switched back and confirmed it returned.
- Reloaded and confirmed the Application and updated metadata persisted.
- Switched to DPO and confirmed the create action was unavailable.
- Updated the Application and confirmed `Cập nhật ứng dụng` in Tenant Audit.
- Confirmed no runtime console error.

Direct address-bar navigation is NOT VERIFIED because the prototype intentionally uses `createMemoryRouter` with `/dashboard` as its initial entry. Internal navigation to detail is verified; cross-tenant detail/mutation rejection is verified by automated store tests.

## 14. Known limitations

- No production authorization, API or database.
- Newly provisioned tenants have no Property; UC-06 creation correctly cannot complete until MT-3.2 provides Property Management.
- Activation is administrative prototype state only. It does not validate origin, public key, webhook or block a real runtime.
- Tenant audit rows are not persisted across full reload under the current workspace architecture.
- MemoryRouter prevents address-bar deep-link UAT.
- MOBILE is a compatibility extension beyond the two UC-06 types Web and System.

## 15. Deferred milestones

- MT-3.2: Property CRUD and ownership model refinement.
- MT-3.3: Consent and Banner assignment.
- MT-3.4: configuration publishing and runtime eligibility checks.
- MT-4: origin, keys, webhook, shared SDK and Integration Code Generator.

## 16. Readiness assessment

MT-3.1 is ready for MT-3.2. The stable tenant-owned Application identity and guarded mutations provide the required parent model for Property Management. MT-3.2 should resolve the current legacy inverse `TenantProperty.applicationId` relationship before allowing multiple Applications and Properties to be rearranged freely.
