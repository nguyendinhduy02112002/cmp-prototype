# MT-3.1 Application Registration and Management UAT Checklist

## 1. Environment

- Application: local Vite development server.
- Browser: ChatGPT in-app browser.
- Tenant under test: ABC Retail; isolation comparison: ABC Health.
- Admin: Trần Hoàng Long; unauthorized comparison: Nguyễn Minh Thu as DPO.
- Date: 29 October 2026.

## 2. Automated acceptance cases

| Test | Result | Evidence |
|---|---|---|
| TC-01 Application Creation | VERIFIED PASS | Admin creates tenant-owned INACTIVE Application |
| TC-02 Required Fields | VERIFIED PASS | Validator rejects missing name, code and Property |
| TC-03 Duplicate Code | VERIFIED PASS | Same-tenant duplicate rejected |
| TC-04 Cross-tenant Code | VERIFIED PASS | Same code created in Retail and Finance |
| TC-05 Directory Isolation | VERIFIED PASS | Active workspace contains only target tenant apps |
| TC-06 Cross-tenant Detail | VERIFIED PASS | Foreign ID absent from active workspace |
| TC-07 Cross-tenant Mutation | VERIFIED PASS | Store returns failure and audits denial |
| TC-08 Role Permissions | VERIFIED PASS | Admin edit; DPO view-only |
| TC-09 Tenant Switching | VERIFIED PASS | Both workspaces preserved |
| TC-10 Refresh Persistence | VERIFIED PASS | Tenant-keyed persisted snapshot contains new app |
| TC-11 Tenant Audit | VERIFIED PASS | Tenant/user/role/action/Application ID recorded |
| TC-12 Platform Audit Isolation | VERIFIED PASS | Platform audit count unchanged |
| TC-13 Suspended Tenant | VERIFIED PASS | Mutation rejected |
| TC-14 Existing Relationships | VERIFIED PASS | Consent, Matrix and Event references unchanged |
| TC-15 Existing Workflow Regression | VERIFIED PASS | Effective-role, Platform and Settings suites pass; TypeScript/build pass |
| TC-16 New Tenant Empty State | VERIFIED PASS | Empty workspace contains no Application |
| TC-17 Stale UI Context | VERIFIED PASS | Captured Tenant A context rejected under Tenant B |
| TC-18 Application Status | VERIFIED PASS | Deactivation preserves ID, activation history and relationships |

## 3. Browser UAT

| Step | Result | Notes |
|---|---|---|
| Open Application Directory | VERIFIED PASS | Dedicated sidebar item and tenant data shown |
| Create Application | VERIFIED PASS | `BROWSER-UAT` created |
| View Application Detail | VERIFIED PASS | Stable ID, code, Property and metadata shown |
| Edit Application | VERIFIED PASS | Name and description updated |
| Activate Application | VERIFIED PASS | Status changed to Active through confirmation |
| Switch tenant | VERIFIED PASS | Retail Application absent in ABC Health |
| Switch back | VERIFIED PASS | Retail Application restored |
| Refresh persistence | VERIFIED PASS | Updated Application remained after reload |
| Unauthorized access | VERIFIED PASS | DPO saw directory but no create action |
| Tenant Audit | VERIFIED PASS | Updated action and Application ID displayed |
| Runtime errors | VERIFIED PASS | Browser console contained no errors |
| Direct address-bar detail URL | NOT VERIFIED | MemoryRouter always initializes at Dashboard; internal detail navigation works |

## 4. Regression checklist

- [x] Existing Application IDs remain unchanged.
- [x] Consent `apps[]` references remain unchanged.
- [x] Dependency Matrix Application references remain unchanged.
- [x] Simulator and Event Application references remain unchanged by create/edit/status.
- [x] Effective-role regression suite passed.
- [x] Platform Administration regression suite passed.
- [x] Tenant Settings regression suite passed.
- [x] Production build passed.
- [ ] Full manual browser walkthrough of every Purpose, Consent, Banner, Rule, Matrix and Simulator path was not repeated; automated/static regression is the evidence for this delivery.

## 5. Known UAT constraints

- Frontend-only authorization is demonstrative, not a security boundary.
- No real Application API, SDK, origin check, key, webhook or runtime call exists.
- Tenant audit additions reset after a full reload under the existing workspace persistence model.
- New tenant Application creation requires a Property; creating Properties is MT-3.2.
