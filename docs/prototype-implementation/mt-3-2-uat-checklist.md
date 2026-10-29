# MT-3.2 Property Management — UAT Checklist

Environment: Windows, Vite development server, in-app Chromium browser, synthetic data only. Automated checks used Vite SSR bundles and Node.

| ID | Scenario / precondition | Steps | Expected result | Actual result | Status / evidence |
|---|---|---|---|---|---|
| TC-01 | Admin, active tenant/application | Create WEB Property | Correct tenant and Application ownership | Created and resolved under parent | PASS — automated + browser |
| TC-02 | Admin | Create Android Property; test invalid package | Valid package accepted; invalid rejected | As expected | PASS — automated |
| TC-03 | Create form | Submit missing/invalid values | Field validation blocks save | Errors returned | PASS — automated |
| TC-04 | Existing code in same Application | Create duplicate | Rejected | Rejected | PASS — automated |
| TC-05 | Two active Applications | Reuse code in second Application | Accepted | Accepted | PASS — automated |
| TC-06 | Property in Tenant A | Switch to Tenant B | Property absent | Health UAT Property absent in Retail | PASS — automated + browser |
| TC-07 | Tenant B active | Mutate Tenant A ID | Rejected | Rejected | PASS — automated |
| TC-08 | Property under App A1 | Mutate through App A2 | Rejected | Rejected | PASS — automated |
| TC-09 | Default roles | Admin manages; DPO/Staff read | Mutations follow effective permission | DPO had no create/edit/status actions | PASS — automated + browser |
| TC-10 | Existing Property | Edit metadata | ID/owners unchanged; data persists | As expected | PASS — automated + browser |
| TC-11 | Existing Property | Deactivate then activate | Status changes; history preserved | INACTIVE/UNAVAILABLE then ACTIVE/AVAILABLE | PASS — automated + browser |
| TC-12 | Active child | Deactivate parent | Child status retained; effective unavailable | As expected | PASS — automated |
| TC-13 | Suspended tenant | Invoke mutation | Rejected; data preserved | Rejected | PASS — automated |
| TC-14 | Open context from Tenant A | Switch tenant then submit | Stale operation rejected | Rejected | PASS — automated |
| TC-15 | Created Property | Reopen browser context | Property survives | `WEB-UAT-32` remained visible | PASS — automated + browser |
| TC-16 | Empty new workspace | Inspect Properties | No auto-created Property | Empty array | PASS — automated |
| TC-17 | Property mutations | Inspect Tenant Audit | Tenant/user/role/app/property present | Four lifecycle rows visible | PASS — automated + browser DOM |
| TC-18 | Property mutations | Compare Platform Audit | No platform event | Unchanged | PASS — automated |
| TC-19 | Existing CMP relationships | Edit/status Property | Consent/Matrix/Event/Banner references intact | Snapshots unchanged | PASS — automated |
| TC-20 | MT-3.1 Application | Update/status/detail regression | Existing Application flow works | Automated suite passed | PASS — automated |
| TC-21 | Existing CMP modules | Inspect data and run regression suites | No loss/regression | Purpose/Consent/Notice/Banner/Matrix/Event data retained; prior suites pass | PASS — automated; full manual module-by-module UAT not repeated |
| TC-22 | Property screens | Exercise list/forms/detail; inspect console | No infinite update/runtime error | Browser error log `[]` | PASS — browser |

## Browser execution trail

1. ABC Health / Admin opened Application Directory and `ABC Health Website`.
2. Created `Website UAT MT-3.2` (`WEB-UAT-32`, `https://uat32.abchealth.example`).
3. Verified Property Detail and stable generated ID.
4. Edited description.
5. Deactivated and reactivated; availability reflected the combined status.
6. Opened a new browser context and verified Property persistence.
7. Switched to ABC Retail; Health Property was not visible.
8. Returned to ABC Health as DPO; mutation controls were absent.
9. Inspected Tenant Audit in the original session; create/update/stop/activate rows were present.
10. Browser console errors: none.

No screenshots were exported. Browser verification evidence consists of live DOM snapshots, status assertions and console-log inspection performed during this implementation session.

## Not verified / deferred

- Production backend authorization and concurrent sessions: out of scope.
- Real SDK/runtime availability enforcement: deferred to MT-4.
- Consent/Banner assignment by stable Property ID: deferred to MT-3.3.
- Audit persistence after full reload: not available in the existing tenant audit store.
