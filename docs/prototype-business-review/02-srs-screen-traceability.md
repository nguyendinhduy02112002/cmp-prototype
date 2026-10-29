# Ma trận truy vết SRS và màn hình Prototype

## 1. SRS → Prototype theo Functional Requirement

| SRS ID | Requirement | Expected screens | Current screen | Demo coverage | Missing interaction |
|---|---|---|---|---|---|
| FR-001 | Purpose/data catalog | 01-01/02/03 | `/purposes` | DEMO COMPLETE | — |
| FR-002 | Consent configuration | 02-01/02 | `/consents` | DEMO COMPLETE | Channel enforcement chưa minh họa |
| FR-003 | Notice version | 03-01/02/03 | `/notices` + Approval Dialog | DEMO COMPLETE | — |
| FR-004 | Re-consent rules/material label | 04-01, 03-03 | `/rules`, `/notices` | DEMO PARTIAL | Rule-set approval không đổi state |
| FR-005 | Dependency matrix | 05-01 | `/rules` | DEMO PARTIAL | Không có approval/return/active lifecycle |
| FR-006 | T3 application | 06-01/02 | `/integrations` App tab | UI ONLY | Create/edit/detail/test absent |
| FR-007 | Banner customization | 07-01 | `/banners`, `/banners/:code` | DEMO COMPLETE | — |
| FR-008 | Tenant/RBAC | 08-01/02/03 | `/users`, header scope | DEMO PARTIAL | Organization structure; invite result |
| FR-009 | Legacy import | 09-01/02 | `/import` | DEMO COMPLETE | — |
| FR-010 | Signing keys | 10-01 | `/settings` | UI ONLY | Rotate/revoke flow |
| FR-011 | Cookie choices | 11-01/02 | `/simulator` Cookie tab | DEMO COMPLETE | — |
| FR-012 | Accept via require | 12-01/02 | `/simulator` Form tab | DEMO COMPLETE | — |
| FR-013 | Reject | 13-01 | `/simulator` Form tab | DEMO COMPLETE | — |
| FR-014 | Sensitive consent | 14-01 | `/simulator` Form tab | DEMO COMPLETE | — |
| FR-016 | Re-consent | 16-01 | `/simulator`, `/notices` | DEMO COMPLETE | — |
| FR-017 | Offline consent | 17-01/02 | `/offline`, Evidence correction | DEMO COMPLETE | — |
| FR-018 | Identity link | Không có SCR trong phụ lục | `/simulator` Cookie tab | DEMO COMPLETE | Conflict example có thể rõ hơn |
| FR-019 | Preference Center | 19-01/02 | `/simulator` Preference tab | DEMO COMPLETE | — |
| FR-020 | Withdrawal | 20-01 | `/simulator` Preference tab | DEMO COMPLETE | — |
| FR-021 | Marketing channels | 21-01 | `/simulator` Preference tab | DEMO COMPLETE | — |
| FR-022 | Submit/track rights | 22-01/02 | `/rights` | UI ONLY | Form/lookup absent |
| FR-023 | Identity verification | 23-01 | `/rights` | MISSING | No verification interaction |
| FR-024 | Process/SLA | 24-01/02 | `/rights` | UI ONLY | Queue/detail/actions absent |
| FR-025 | Extension | 25-01 | `/rights` | MISSING | No extension dialog/approval |
| FR-026 | Downstream task | 26-01 | `/rights` | MISSING | No task flow |
| FR-027 | Decision API | Không có console SCR | `/simulator` API tab | DEMO COMPLETE | — |
| FR-028 | Receipt issue | Không có console SCR | Simulator log/Evidence | DEMO COMPLETE | Mock accepted by prototype scope |
| FR-029 | Receipt verification | Không có console SCR | Simulator result/log | DEMO PARTIAL | Không có invalid/expired receipt branch |
| FR-030 | Event/webhook | 30-01 | `/integrations` Event tab | DEMO PARTIAL | Retry does not change delivery state/detail |
| FR-031 | Connector sync | 31-01 | `/integrations` Connector tab | UI ONLY | Configure/test/sync result absent |
| FR-032 | Tag control | Không có console SCR | `/simulator` Cookie tab | DEMO COMPLETE | — |
| FR-033 | Cookie scanner | 33-01/02 | `/integrations` Scan tab | UI ONLY | Run/classify/approve absent |
| FR-036 | Consent history | 36-01/02 | `/records`, `/records/:subject`, `/evidence` | DEMO COMPLETE | — |
| FR-037 | Evidence export | 37-01/02 | Export dialog + package route | DEMO PARTIAL | No observable mock download |
| FR-038 | Dashboard | 38-01 | `/dashboard` | DEMO COMPLETE | — |
| FR-039 | Audit | 39-01 | `/audit` | DEMO COMPLETE | — |
| FR-040 | Alerts | 40-01/02 | `/notifications`, `/settings` | DEMO PARTIAL | Config not editable, no reopen/assign |
| FR-043 | Metering | 43-01 | `/settings` | UI ONLY | Filters/detail absent |

## 2. Tất cả Screen ID trong Phụ lục C

| SRS Screen ID | Tên SRS | Current representation | Coverage |
|---|---|---|---|
| SCR-AP-01 | Trung tâm thông báo | `/notifications`, global Approval Dialog | Complete |
| SCR-01-01 | Danh sách mục đích | `/purposes` tab Purpose | Complete |
| SCR-01-02 | Tạo/sửa mục đích | Purpose Form dialog | Complete |
| SCR-01-03 | Đề nghị ngừng | Stop Dialog | Complete |
| SCR-02-01 | Danh sách consent | `/consents` | Complete |
| SCR-02-02 | Tạo/sửa consent | Consent form/dialog | Complete |
| SCR-03-01 | Danh sách notice version | `/notices` | Complete |
| SCR-03-02 | Soạn notice | Notice editor dialog | Complete |
| SCR-03-03 | Duyệt/xuất bản | Approval Dialog | Complete |
| SCR-04-01 | Re-consent rules | `/rules` Rule tab | Partial |
| SCR-05-01 | Dependency matrix | `/rules` Matrix tab | Partial |
| SCR-06-01 | T3 app list | `/integrations` App tab | UI only |
| SCR-06-02 | T3 app detail | Gộp App tab, không có detail | Missing interaction |
| SCR-07-01 | Banner editor | `/banners/:code` | Complete |
| SCR-08-01 | Organization structure | Header scope chỉ minh họa một org | Missing |
| SCR-08-02 | Users/roles | `/users` Users tab | Partial |
| SCR-08-03 | Permission matrix | `/users` Permission tab | Complete |
| SCR-09-01 | Batch import/mapping | `/import` | Complete |
| SCR-09-02 | Batch validation result | `/import` detail | Complete |
| SCR-10-01 | Signing key/rotation | `/settings` key table | UI only |
| SCR-11-01 | Cookie banner layer 1 | Simulator/preview | Complete |
| SCR-11-02 | Cookie customization | Simulator/preview | Complete |
| SCR-12-01 | Business form popup | Simulator Form tab | Complete |
| SCR-12-02 | Popup states | Simulator Form result/log | Complete |
| SCR-13-01 | Reject result | Simulator Form result | Complete |
| SCR-14-01 | Sensitive popup | Simulator Form mode | Complete |
| SCR-16-01 | Re-consent popup | Simulator Form mode | Complete |
| SCR-17-01 | Offline list | `/offline` | Complete |
| SCR-17-02 | Offline capture | Offline dialog | Complete |
| SCR-19-01 | Preference OTP | Simulator Preference tab | Complete |
| SCR-19-02 | My consents | Simulator Preference tab | Complete |
| SCR-20-01 | Withdraw confirmation/result | Simulator Preference tab | Complete |
| SCR-21-01 | Contact channels | Simulator Preference tab | Complete |
| SCR-22-01 | Rights request form | Không có | Missing |
| SCR-22-02 | Rights status lookup | Không có | Missing |
| SCR-23-01 | Identity verification | Không có | Missing |
| SCR-24-01 | Rights work queue | `/rights` read-only table | UI only |
| SCR-24-02 | Rights detail | Không có | Missing |
| SCR-25-01 | Extension request | Không có | Missing |
| SCR-26-01 | Downstream task | Không có | Missing |
| SCR-30-01 | Event history/detail | `/integrations` Event tab | Partial |
| SCR-31-01 | CRM/CDP/ESP connector | Connector tab | UI only |
| SCR-33-01 | Scan runs | Không có; chỉ cookie result list | Missing |
| SCR-33-02 | Scan result/classification | Scan tab static table | UI only |
| SCR-36-01 | Search history | `/records`, `/evidence` | Complete |
| SCR-36-02 | Evidence detail | Evidence Sheet | Complete |
| SCR-37-01 | Export evidence dialog | Export Dialog | Complete |
| SCR-37-02 | Evidence package PDF sample | `/evidence/package/:id` | Partial |
| SCR-38-01 | Dashboard | `/dashboard` | Complete |
| SCR-39-01 | Audit log | `/audit` | Complete |
| SCR-40-01 | Operational alerts | Notification alert dialog | Partial |
| SCR-40-02 | Alert configuration | `/settings` static table | UI only |
| SCR-43-01 | Usage metering | `/settings` KPI | UI only |

Tổng cộng: 53 Screen ID trong Phụ lục C.

## 3. Prototype → SRS

| Prototype screen | Route | Business purpose | SRS reference | Necessity | Recommendation |
|---|---|---|---|---|---|
| Dashboard | `/dashboard` | Operational overview | FR-038/SCR-38-01 | Required | Keep |
| Notification Center | `/notifications` | Approval/alert work queue | SCR-AP-01, FR-040 | Required | Keep; confirm merge |
| Purpose/Data | `/purposes` | Configuration foundation | FR-001 | Required | Keep |
| Consent | `/consents` | Define collectable choices | FR-002 | Required | Improve channel demo |
| Notices | `/notices` | Version subject information | FR-003/004 | Required | Keep |
| Banner list | `/banners` | Entry to multiple configs | Supports FR-007 | Supporting | Keep |
| Banner editor | `/banners/:code` | Compliant collection UI | FR-007 | Required | Keep |
| Rules/Matrix | `/rules` | Re-consent and function dependency | FR-004/005 | Required | Improve workflow |
| Records | `/records` | Current consent states | FR-036 | Required | Keep |
| Subject history | `/records/:subject` | Explain state timeline | FR-036 | Required | Keep |
| Evidence | `/evidence` | Prove decisions | FR-036/037 | Required | Keep |
| Evidence package | `/evidence/package/:id` | Show inspection output | FR-037 | Required | Improve result |
| Offline | `/offline` | Capture non-digital consent | FR-017 | Required | Keep |
| Import | `/import` | Migrate legacy consent | FR-009 | Required | Keep |
| Simulator | `/simulator` | Demonstrate subject/runtime flows | Multiple FR; no direct SCR | Demo utility | Keep/improve guidance |
| Rights | `/rights` | Rights operations | FR-022..026 | Required | Split/improve |
| Users/RBAC | `/users` | Access governance | FR-008 | Required | Improve org/invite |
| Audit | `/audit` | Accountability | FR-039 | Required | Keep |
| Integrations | `/integrations` | App/event/connector/scanner | FR-006/030/031/033 | Required aggregate | Split/improve |
| Settings | `/settings` | Keys/alerts/metering | FR-010/040/043 | Required aggregate | Split/improve |
| Forbidden | conditional | Explain denied access | IF-04 | Supporting | Keep |
| Not Found | `*` | Navigation recovery | No direct SRS | Supporting | Keep |
