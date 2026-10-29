# Phân tích yêu cầu SRS CMP v1.3

## 1. SRS Overview

Nguồn: `D:\vagoge\cmp\doc\SRS_CMP_v1.3.docx`, phiên bản v1.3. SRS mô tả CMP quản lý cấu hình consent, thu thập và thay đổi lựa chọn, quyền chủ thể, Decision/Receipt API, event/connector, cookie scan, evidence, dashboard, audit, alert và usage metering.

Phạm vi MVP gồm 38 functional use case cấp cao, 9 interface requirements `SRS-IF-01..09`, 26 NFR và business rules/acceptance criteria chi tiết cho từng use case. Báo cáo giữ nguyên ID cấp cao; các requirement con `SRS-FR-nnn-mm`, BR, MSG, SCR và AC được xem là tiêu chí chi tiết của requirement cha.

## 2. Actors, Roles and Stakeholders

- Admin: quản trị tenant, user, permission, application/integration/settings; mặc định không approve.
- DPO: approve/return, evidence export, audit và privacy operations.
- Nhân viên: tạo/sửa/gửi duyệt, offline/import, tra cứu giới hạn.
- Data Subject: tương tác banner, Preference Center và rights request.
- Third-party application/backend: gọi SDK/API, xác minh Receipt, nhận event.
- CRM/CDP/ESP và processor: nhận đồng bộ hoặc downstream task.
- Stakeholder suy ra trực tiếp từ SRS: Product Owner, BA, Privacy/Legal/DPO, Operations, integration teams; SRS không cung cấp danh sách cá nhân.

## 3. Business Requirements and Scope

- Quản lý lifecycle purpose, consent, notice, rule, matrix và banner.
- Maker-checker cho đối tượng tuân thủ.
- Thu thập consent minh bạch, không pre-tick, Accept/Reject ngang hàng.
- Cho phép xem, thay đổi và withdraw không khó hơn accept.
- Evidence append-only, truy xuất đúng version nội dung đã hiển thị.
- Rights workflow có verification, SLA, extension và downstream tasks.
- API/Receipt/event đảm bảo hệ thống T3 thực thi đúng trạng thái consent.
- Dashboard, audit, alert và metering phục vụ vận hành.

## 4. Functional Requirement Inventory

| Requirement ID | Module | Requirement tóm tắt | Priority | Acceptance focus | SRS reference |
|---|---|---|---|---|---|
| SRS-FR-001 | Configuration | Purpose và data catalog | MVP | CRUD/version/approval/stop | 4.4.1 |
| SRS-FR-002 | Configuration | Consent configuration | MVP | code/type/purpose/channel/app/duration | 4.4.2 |
| SRS-FR-003 | Notice | Author/approve/publish notice version | MVP | lifecycle/content/effective time | 4.4.3 |
| SRS-FR-004 | Re-consent | Rules và material-change label | MVP | suggestion/DPO decision/re-consent | 4.4.4 |
| SRS-FR-005 | Matrix | Purpose-dependency matrix | MVP | version/approval/runtime effect | 4.4.5 |
| SRS-FR-006 | Application | Third-party app registration | MVP | origin/key/webhook/config | 4.4.6 |
| SRS-FR-007 | Banner | Compliant customization | MVP | no pre-tick/equal controls/version | 4.4.7 |
| SRS-FR-008 | Administration | Tenant and RBAC | MVP | organization/user/permission | 4.4.8 |
| SRS-FR-009 | Migration | Legacy consent import | MVP | mapping/check/risk/DPO/write | 4.4.9 |
| SRS-FR-010 | Signing | Signing key rotation | MVP | lifecycle/JWKS/old key verification | 4.4.10 |
| SRS-FR-011 | Cookie | Cookie banner choices | MVP | layer 1/customization/essential | 4.5.1 |
| SRS-FR-012 | Collection | Accept via `CMP.require` | MVP | decision/evidence/Receipt/result | 4.5.2 |
| SRS-FR-013 | Collection | Reject | MVP | reject evidence/Receipt/result | 4.5.3 |
| SRS-FR-014 | Sensitive data | Explicit sensitive consent | MVP | separate flow/explicit confirmation | 4.5.4 |
| SRS-FR-016 | Re-consent | Version/expiry re-consent | MVP | state and next require flow | 4.5.5 |
| SRS-FR-017 | Offline | Offline evidence capture | MVP | actual time/files/hash/correction | 4.5.6 |
| SRS-FR-018 | Identity | Anonymous-enterprise identity link | MVP | link evidence/conflict rule | 4.5.7 |
| SRS-FR-019 | Preference | View/change preferences | MVP | OTP/current choices/change | 4.6.1 |
| SRS-FR-020 | Withdrawal | Withdraw consent | MVP | no harder than accept/immediate effect | 4.6.2 |
| SRS-FR-021 | Marketing | Marketing channel preferences | MVP | channel/all marketing/transactional exclusion | 4.6.3 |
| SRS-FR-022 | Rights | Submit and track rights request | MVP | form/code/status | 4.6.4 |
| SRS-FR-023 | Rights | Identity verification | MVP | secure verification/no enumeration | 4.6.5 |
| SRS-FR-024 | Rights | Process request and SLA | MVP | queue/detail/assign/close approval | 4.6.6 |
| SRS-FR-025 | Rights | One-time extension | MVP | reason/new due/DPO approval | 4.6.7 |
| SRS-FR-026 | Rights | Processor downstream tasks | MVP | create/track/complete tasks | 4.6.8 |
| SRS-FR-027 | API | Decision API | MVP | ALLOWED/DENIED/UNKNOWN/version/expiry | 4.7.1 |
| SRS-FR-028 | Receipt | Issue Consent Receipt | MVP | signed/encrypted metadata and replay fields | 4.7.2 |
| SRS-FR-029 | Receipt | Verify Receipt and execute operation | MVP | validation/error behavior | 4.7.3 |
| SRS-FR-030 | Event | Emit consent events/webhooks | MVP | order/retry/signature/history | 4.7.4 |
| SRS-FR-031 | Connector | CRM/CDP/ESP synchronization | MVP | connector/suppression/status | 4.7.5 |
| SRS-FR-032 | Tag control | Allow/block tags | MVP | default block and consent mapping | 4.7.6 |
| SRS-FR-033 | Scanner | Cookie/tracker scanning | MVP | runs/results/classification/approval | 4.7.7 |
| SRS-FR-036 | Evidence | Search consent history | MVP | search/detail/masking/audit | 4.8.1 |
| SRS-FR-037 | Evidence | Export inspection package | MVP | scope/reason/PDF+JSON/hash/audit | 4.8.2 |
| SRS-FR-038 | Reporting | Consent dashboard | MVP | metrics/filters/privacy threshold | 4.8.3 |
| SRS-FR-039 | Audit | Audit-log viewing | MVP | append-only/filter/detail/access logging | 4.8.4 |
| SRS-FR-040 | Operations | Operational alerts | MVP | detection/list/config/resolve | 4.8.5 |
| SRS-FR-043 | Metering | Usage metering | MVP | metric dimensions/period/detail | 4.8.6 |

## 5. Interface Requirements

| ID | Requirement | Reference |
|---|---|---|
| SRS-IF-01 | Vietnamese and English; target WCAG level TBD | 3.1 |
| SRS-IF-02 | No preselected choice; Accept/Reject equal prominence | 3.1 |
| SRS-IF-03 | Withdrawal no more steps than consent | 3.1 |
| SRS-IF-04 | Role-aware console; server API enforces permission | 3.1 |
| SRS-IF-05 | TLS for all channels | 3.3 |
| SRS-IF-06 | HMAC webhook and JWKS Receipt verification | 3.3 |
| SRS-IF-07 | REST and gRPC for SDK/backend/T3 | 3.3 |
| SRS-IF-08 | Consistent sidebar/header/status layout | 3.1 |
| SRS-IF-09 | Compare any two versions with add/remove/change highlighting | 3.1 |

External software interfaces IF-01..IF-14 are detailed in section 3.2; implementation depends on backend/integration architecture and is not independently verifiable in this frontend repository.

## 6. Non-Functional Requirements

| Group | IDs | Requirement summary |
|---|---|---|
| Performance/availability | NFR-01..06 | latency, availability, throughput, DR, fail-closed |
| Security | NFR-10..17 | OAuth/OIDC, SSO/MFA, TLS, KMS/HSM, WAF, signing/encryption, rotation, anti-enumeration |
| Integrity/privacy | NFR-20..25 | WORM, audit, server UTC, minimization, Vietnam residency, tenant isolation |
| Usability/compatibility | NFR-30..35 | bilingual/WCAG, SDK/browser, SaaS/on-prem, monitoring, maintainability, sandbox/docs |

Tổng cộng 26 NFR. Nhiều target trong SRS mang nhãn `[TBD]`, nên ngay cả sản phẩm hoàn chỉnh cũng cần BA/PO/Operations chốt trước khi nghiệm thu định lượng.

## 7. Common Business Rules

- BR-AP-01..09: maker-checker, one-level approval, return reason, lock/withdraw, active revision, audit, notification, optimistic locking, overdue alert.
- Lifecycle chuẩn: Draft → Pending → Active/Returned; stop request có lifecycle riêng.
- BRL nhấn mạnh evidence append-only, withdrawal effect, identity minimization, receipt/event security và retention.
- Không kết luận tuân thủ pháp luật chỉ từ mô tả SRS hoặc UI.

## 8. Acceptance Criteria and Constraints

Mỗi UC trong SRS có main flow, alternate/exception flow, BR, system requirements, screen reference, messages và AC. Báo cáo gap dùng các trọng điểm AC sau:

- state transition đúng và actor có quyền;
- validation bắt buộc trước submit/approve;
- immutable/versioned evidence;
- external effect có kết quả quan sát được;
- notification/audit được tạo;
- privacy masking và no-enumeration;
- concurrent/retry/error flow.

Constraints chính: nhiều giá trị `[N]/[TBD]/[KC]`, mobile SDK và một số capability ở V1.5, dữ liệu residency Việt Nam, connector MVP phụ thuộc danh sách hệ thống đích.

## 9. Dependencies and Open Decisions

- Chỉ tiêu throughput, RTO/RPO, WCAG, browser support, retention và alert thresholds chưa chốt.
- Danh sách connector đích, Receipt expiry, OTP policy và usage pricing dimensions cần xác nhận.
- Phạm vi tenant/platform administration cần phân biệt rõ Tenant Admin và Platform Admin.
