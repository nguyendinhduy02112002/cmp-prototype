# Đối chiếu SRS và Prototype CMP

## 1. Executive Summary

Ma trận dưới đây đánh giá 38 SRS-FR cấp use case. Theo tiêu chí nghiêm ngặt của SRS, không gán `Implemented` chỉ vì UI hoạt động trong memory. Kết quả: 26 `Partially Implemented`, 12 `UI Only`, 0 `Implemented`, 0 `Not Implemented` ở cấp use case vì mọi UC đều có ít nhất representation trong source. NFR/API security được tách là `Not Verifiable`.

## 2. Requirements Traceability Matrix

| Requirement | Prototype module/current implementation | Status | Evidence | Gap chính |
|---|---|---|---|---|
| FR-001 Purpose/catalog | CRUD, approval, stop, catalog import simulation | Partially Implemented | `app/purposes.tsx`, `lib/store.ts` | import/version compare/external persistence |
| FR-002 Consent | CRUD and validation for purpose/channel/app/duration | Partially Implemented | `app/consents.tsx` | runtime channel/app enforcement |
| FR-003 Notice | version authoring, approval, scheduling | Partially Implemented | `app/notices.tsx`, `store.ts` | persistence/concurrency/full compare |
| FR-004 Re-consent rules | static rule UI and material approval behavior | Partially Implemented | `app/rules.tsx`, `components/cmp/approval.tsx` | editable/versioned/approved rule set incomplete |
| FR-005 Matrix | editable cells and simulator use | Partially Implemented | `app/rules.tsx`, `store.ts` | applies immediately; no approval lifecycle |
| FR-006 T3 app | read-only app table | UI Only | `app/p3.tsx`, `lib/mock.ts` | no CRUD/origin/key/webhook/test |
| FR-007 Banner | editor, version, checks, approval, preview | Partially Implemented | `app/banners.tsx`, `banner-renderer.tsx` | no SDK deployment/effect |
| FR-008 Tenant/RBAC | users and permission matrix | Partially Implemented | `app/admin.tsx`, `lib/perm.ts` | no tenant/org structure/server authorization |
| FR-009 Legacy import | batch/risk/approval simulation | Partially Implemented | `app/admin.tsx`, `store.ts` | no actual upload/parser/job/API |
| FR-010 Signing key | static keys/settings | UI Only | `app/p3.tsx`, `mock.ts` | no rotation/JWKS/KMS lifecycle |
| FR-011 Cookie choices | interactive simulator and renderer | Partially Implemented | `app/simulator.tsx`, `banner-renderer.tsx` | no production SDK/storage |
| FR-012 Accept | records event and simulated receipt/outbox | Partially Implemented | `app/simulator.tsx`, `store.ts` | no API/transaction/idempotency |
| FR-013 Reject | records simulated rejection | Partially Implemented | same | no API/receipt cryptography |
| FR-014 Sensitive | explicit confirmation simulation | Partially Implemented | `app/simulator.tsx`, `app/consents.tsx` | no enforceable backend guard |
| FR-016 Re-consent | demo state and next popup | Partially Implemented | `store.ts`, `simulator.tsx` | expiry scheduler/backend absent |
| FR-017 Offline | form, metadata, correction event | Partially Implemented | `app/offline.tsx`, `evidence.tsx` | no file storage/hash/WORM |
| FR-018 Identity link | cookie→subject simulation | Partially Implemented | `app/simulator.tsx`, `mock.ts` | identity service/conflict processing not real |
| FR-019 Preference | OTP and choices simulation | Partially Implemented | `app/simulator.tsx` | fixed OTP, no identity provider/rate limit |
| FR-020 Withdrawal | state/event/outbox simulation | Partially Implemented | `app/simulator.tsx`, `store.ts` | no downstream delivery guarantee |
| FR-021 Marketing channels | preference UI and withdraw-all | Partially Implemented | `app/simulator.tsx` | no channel system integration |
| FR-022 Submit rights | static rights list only | UI Only | `app/p3.tsx` | form and tracking absent |
| FR-023 Verify requester | description only | UI Only | `app/p3.tsx` | verification screen/flow absent |
| FR-024 Process/SLA | static rows/status | UI Only | `app/p3.tsx`, `mock.ts` | queue/detail/assign/actions absent |
| FR-025 Extension | text only | UI Only | `app/p3.tsx` | request/approval/new SLA absent |
| FR-026 Downstream tasks | text only | UI Only | `app/p3.tsx` | task lifecycle absent |
| FR-027 Decision API | interactive calculation display | Partially Implemented | `app/simulator.tsx` | no HTTP/gRPC endpoint/auth/SLA |
| FR-028 Receipt issuance | metadata object generated | Partially Implemented | `lib/mock.ts`, `store.ts`, `evidence.tsx` | no JWS/JWE/KMS/replay implementation |
| FR-029 Receipt verification | success wording in simulator | Partially Implemented | `app/simulator.tsx` | no verification/error endpoint |
| FR-030 Event/webhook | in-memory outbox display/retry toast | UI Only | `app/p3.tsx`, `store.ts` | payload/signature/order/retry worker absent |
| FR-031 CRM/CDP/ESP | static connector list | UI Only | `app/p3.tsx`, `mock.ts` | config/mapping/test/sync absent |
| FR-032 Tag control | consent-based tag display simulation | Partially Implemented | `app/simulator.tsx` | no GTM integration |
| FR-033 Scanner | static cookie list | UI Only | `app/p3.tsx`, `mock.ts` | scan run/results/classification approval absent |
| FR-036 History | search/current state/detail/masking | Partially Implemented | `records.tsx`, `evidence.tsx` | server query/access controls/paging |
| FR-037 Evidence export | dialog, package object and preview | Partially Implemented | `evidence.tsx`, `store.ts` | no real PDF/JSON/signature/download |
| FR-038 Dashboard | filters/KPI/charts derived from mock events | Partially Implemented | `dashboard.tsx` | API aggregation/export/freshness not real |
| FR-039 Audit | log/filter/detail and view logging | Partially Implemented | `admin.tsx`, `store.ts` | mutable client memory; failed access incomplete |
| FR-040 Alerts | alerts inside notification and static config | UI Only | `notifications.tsx`, `p3.tsx` | rule engine/config/escalation absent |
| FR-043 Metering | static usage cards | UI Only | `app/p3.tsx` | collection/dimensions/reconciliation absent |

## 3. Interface and NFR Traceability Summary

| IDs | Status | Evidence/Gap |
|---|---|---|
| IF-01 | Partially Implemented | Notice/banner bilingual; console not bilingual; WCAG not audited |
| IF-02 | Partially Implemented | Renderer enforces equal button styling/no pre-check; runtime not independently tested |
| IF-03 | Partially Implemented | Preference simulation aims equal step count |
| IF-04 | Partially Implemented | UI permission gate exists; server check absent |
| IF-05..07 | Not Verifiable | No network/backend implementation |
| IF-08 | Partially Implemented | Shared sidebar/header/status components |
| IF-09 | Partially Implemented | Approval diff exists; cannot select arbitrary versions for all entities |
| NFR-01..06 | Not Verifiable | No deployed API/load/availability/DR evidence |
| NFR-10..17 | Not Verifiable | No authentication/security infrastructure; only labels/mock metadata |
| NFR-20..25 | Not Verifiable | In-memory data is not WORM/tenant-isolated/residency evidence |
| NFR-30..35 | Not Verifiable | Partial UI indications; compatibility/deployment/monitoring not demonstrated |

## 4. Implemented Requirements

Không có requirement cấp SRS-FR nào được đánh dấu `Implemented` theo định nghĩa “đáp ứng đầy đủ acceptance criteria có thể kiểm chứng”. Điều này không có nghĩa prototype không hoạt động; nó phản ánh ranh giới giữa prototype in-memory và hệ thống end-to-end.

## 5. Partially Implemented Requirements

26 FR có logic tương tác thật trong browser: FR-001..005, 007..009, 011..021, 027..029, 032, 036..039. Nhóm mạnh nhất là configuration, collection simulation, consent records và evidence presentation.

## 6. UI-only Requirements

12 FR: FR-006, 010, 022..026, 030, 031, 033, 040, 043. Các trang `p3.tsx` tự ghi rõ là trang giữ chỗ chỉ xem và đặc tả đầy đủ nằm ở SRS.

## 7. Missing Screens and Flows

- SCR-08-01 organization structure.
- SCR-22-01/02, SCR-23-01, SCR-24-01/02, SCR-25-01, SCR-26-01 rights workflow.
- Full SCR-06-02 app details/config actions.
- SCR-10-01 rotate-key dialog behavior.
- SCR-30-01 event detail, SCR-31-01 connector configuration.
- SCR-33-01/02 scan run/results/classification.
- Full SCR-40-02 alert configuration.
- Detailed/filterable SCR-43-01 metering.

## 8. Features Outside or Beyond Explicit SRS Presentation

| Feature | Classification | BA confirmation |
|---|---|---|
| Global role switcher in header | Prototype convenience | Không phải authentication; giữ cho demo? |
| `window.__nav` navigation hook | Test/demo utility | Chỉ bật development/test? |
| Dark/light/system theme | Template-derived useful feature | Có thuộc product scope không? |
| Memory router for artifact/static frame | Prototype infrastructure | SRS không yêu cầu; deep-link expectation cần chốt |
| Simulator combining many subject flows | Useful demonstration module | Production console có cần module sandbox tương tự? |
| Toast/UI primitives/sidebar behavior | Template-derived | Không phải domain requirement độc lập |

## 9. Gap Summary

- Functional: rights, app/integration, scanner, keys, alerts, metering.
- Workflow: matrix/rule approval, arbitrary version compare, optimistic approval locking.
- Architecture: no tenant context, API, auth, services, persistence or async error model.
- Evidence/security: cryptographic and immutable claims are simulated.
- UX: console bilingual/accessibility not demonstrated; memory routing prevents shareable deep links.
