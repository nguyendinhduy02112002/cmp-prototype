# Đề xuất và lộ trình hoàn thiện Prototype CMP

## 1. Prioritized Recommendations

| ID | Related requirements | Current problem | Proposed improvement | Priority | Dependencies | Acceptance criteria cho prototype |
|---|---|---|---|---|---|---|
| REC-001 | FR-022..026 | Rights chỉ là bảng tĩnh | Dựng form, verify, queue/detail, timeline, assign, SLA, extension, downstream task, close approval | P0 | BA chốt field/status/SLA | Demo được end-to-end submit→verify→process→extend/task→close; state/audit/notif thay đổi |
| REC-002 | FR-006 | App T3 chỉ đọc | CRUD/dialog detail cho origin, property, consent assignment, public key, webhook/test | P0 | BA chốt field và validation | Tạo/sửa app trong store; test result/error simulation; audit observable |
| REC-003 | FR-030..031 | Event/connector chỉ hiển thị | Event detail/retry timeline và connector config/mapping/test/suppression demo | P0 | REC-002 | Withdrawal tạo delivery records; retry/status/mapping xem được |
| REC-004 | FR-033 | Scanner là cookie list tĩnh | Scan run list, create scan, result/classification và essential approval | P0 | Approval framework | Demo scan→classify→approve→catalog update |
| REC-005 | FR-005, BR-AP | Matrix áp dụng ngay | Thêm draft/pending/return/active version workflow | P1 | Existing approval dialog | Active matrix không đổi trước approval; audit/notif đầy đủ |
| REC-006 | FR-008 | Thiếu organization/tenant presentation | Dựng SCR-08-01; quyết định single-tenant demo hoặc tenant switcher | P1 | BA/PO scope decision | Org tree/scope tác động user view; hoặc ghi rõ single-tenant scope |
| REC-007 | FR-040 | Alert/config chưa đủ | Alert list/detail/ack/resolve/reopen và threshold/recipient config | P1 | Alert type catalogue | State transition và config simulation có audit |
| REC-008 | FR-010 | Key chỉ static | Rotate/revoke dialog, effective timeline, impact warning, JWKS preview | P1 | BA security UX | Version/status transitions demo được; ghi rõ cryptography simulated |
| REC-009 | IF-09 | Compare chỉ current-vs-proposed | Version selectors và unified diff cho mọi versioned entity | P1 | Version history shape | Chọn được hai version bất kỳ; add/remove/change rõ |
| REC-010 | FR-043 | Metering static | Filters, chart, drill-down và calculation explanation | P2 | BA chốt dimensions | Chuyển kỳ/app/metric cập nhật mock data nhất quán |
| REC-011 | IF-01 | Console chỉ tiếng Việt | Xác nhận có cần bilingual prototype; nếu có, centralize labels | P2 | BA translation scope | Chuyển locale không mất state; core screens đủ VI/EN |
| REC-012 | IF-08 | Memory routing không deep-link | Chốt artifact-only hay shareable prototype; dùng hash routing nếu cần | P2 | Hosting decision | Refresh/share URL giữ đúng screen |
| REC-013 | Cross-cutting | Security wording dễ gây hiểu nhầm | Gắn badge “Mô phỏng” cho hash/Receipt/WORM/email/SSO/webhook | P1 | None | Mọi external/security effect hiển thị rõ simulated |
| REC-014 | Quality | Không test | Thêm test sau khi PO cho phép development phase | P2 | Stable workflows | Test state transitions/permissions/critical forms |
| REC-015 | Architecture | Store/page concentration | Lập kế hoạch domain split/API adapters, không bắt buộc trong UI prototype | P3 | Backend roadmap | Documented boundaries và migration plan |

## 2. Proposed Implementation Phases

### Phase A — Core prototype completeness

REC-001, REC-002, REC-003, REC-004. Mục tiêu là loại bỏ các trang P3 giữ chỗ quan trọng và trình diễn đầy đủ các khối nghiệp vụ MVP.

### Phase B — Governance and operations

REC-005, REC-006, REC-007, REC-008, REC-009. Mục tiêu là nhất quán approval/versioning và hoàn thiện các màn quản trị/vận hành.

### Phase C — Experience and review quality

REC-010..013. Mục tiêu là giúp BA/UAT review chính xác, tránh nhầm simulation với implementation.

### Phase D — Productization preparation

REC-014..015 và thiết kế API/auth/tenant/backend. Chỉ bắt đầu khi phạm vi chuyển từ prototype sang sản phẩm.

## 3. Dependencies

- Rights: status model, SLA defaults, verification policy và processor task fields.
- Application/integration: application identity, allowed origin, webhook/key fields, connector targets.
- Scanner: scan scope, essential classification approval rule.
- Tenant: single-tenant demo hay multi-tenant platform review.
- Alerts/metering: thresholds, recipients, metric dimensions và pricing relevance.
- Version comparison: canonical snapshots cho từng entity.

## 4. Open Questions for BA/PO

1. Prototype cần bao phủ toàn bộ 38 UC hay chỉ CMP core configuration/collection/evidence?
2. UC-22..26 có nằm trong vòng demo hiện tại không?
3. ABC Retail là tenant duy nhất của prototype hay cần tenant switcher?
4. Admin trong UI là Tenant Admin hay Platform Admin?
5. Application T3, connector và scanner cần editable workflow hay chỉ presentation?
6. Ma trận dependency có bắt buộc demo approval đúng BR-AP trong vòng này?
7. Console có cần song ngữ, hay chỉ subject-facing content song ngữ?
8. Có cần deep link/shareable URL cho BA review?
9. Evidence package chỉ preview hay phải download file mock?
10. Những `[N]/[TBD]/[KC]` nào phải chốt trước vòng nghiệm thu prototype?
11. Có chấp nhận gộp SCR vào tab/dialog như hiện tại hay cần từng screen đúng phụ lục C?
12. Các nhãn WORM/JWS/JWE/KMS/email/SSO có cần badge “Mô phỏng” bắt buộc?

## 5. Next Steps

1. BA/PO xác nhận phạm vi UC cho vòng prototype tiếp theo.
2. Chốt các open questions ảnh hưởng information architecture.
3. Chuyển REC-001..004 thành backlog stories gắn AC nguyên bản của SRS.
4. Thiết kế clickable flow trước khi phát triển chi tiết.
5. Sau mỗi module, cập nhật traceability matrix và chạy build/lint cùng walkthrough theo actor.
