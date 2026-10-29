# Gap Analysis theo tiêu chí Demo Prototype

## 1. Nguyên tắc đánh giá

Mock data, Zustand, simulated auth/API/event/receipt được chấp nhận. Gap chỉ được ghi khi người demo không thể thực hiện hoặc quan sát đủ quy trình nghiệp vụ được SRS mô tả.

## 2. Functional Requirement Status

| Status | Count | Requirements |
|---|---:|---|
| DEMO COMPLETE | 21 | FR-001, 002, 003, 007, 009, 011, 012, 013, 014, 016, 017, 018, 019, 020, 021, 027, 028, 032, 036, 038, 039 |
| DEMO PARTIAL | 7 | FR-004, 005, 008, 029, 030, 037, 040 |
| UI ONLY | 7 | FR-006, 010, 022, 024, 031, 033, 043 |
| MISSING | 3 | FR-023, 025, 026 và các interaction chính của FR-022/024 được phản ánh UI Only |

FR-037 được xếp DEMO PARTIAL vì dialog và preview đã có nhưng kết quả tải chưa quan sát được. Phân loại chi tiết dưới đây là nguồn chuẩn.

## 3. Detailed Matrix

| FR | Demo status | Source evidence | Gap theo tiêu chí demo |
|---|---|---|---|
| 001 | DEMO COMPLETE | `purposes.tsx`, `store.ts` | — |
| 002 | DEMO COMPLETE | `consents.tsx` | Nên minh họa reject sai channel nhưng không cản core demo |
| 003 | DEMO COMPLETE | `notices.tsx`, approval/store | — |
| 004 | DEMO PARTIAL | `rules.tsx`, approval | Rule config submit không có lifecycle/result rõ |
| 005 | DEMO PARTIAL | `rules.tsx` | Matrix áp dụng ngay, không approve/return |
| 006 | UI ONLY | `p3.tsx` App tab | Không tạo/sửa/test app |
| 007 | DEMO COMPLETE | `banners.tsx` | — |
| 008 | DEMO PARTIAL | `admin.tsx`, header | Permission works; org missing, invite toast-only |
| 009 | DEMO COMPLETE | `admin.tsx`, store | — |
| 010 | UI ONLY | `p3.tsx` Settings | Không rotate/revoke |
| 011 | DEMO COMPLETE | `simulator.tsx` Cookie | — |
| 012 | DEMO COMPLETE | Simulator Form | — |
| 013 | DEMO COMPLETE | Simulator Form | — |
| 014 | DEMO COMPLETE | Consent + Simulator | — |
| 016 | DEMO COMPLETE | Notice approval + Simulator | — |
| 017 | DEMO COMPLETE | `offline.tsx`, Evidence correction | — |
| 018 | DEMO COMPLETE | Simulator identity link | Conflict outcome có thể giải thích rõ hơn |
| 019 | DEMO COMPLETE | Simulator Preference | — |
| 020 | DEMO COMPLETE | Simulator Preference | — |
| 021 | DEMO COMPLETE | Simulator Preference | — |
| 022 | UI ONLY | `/rights` static list | Không submit/track |
| 023 | MISSING | Không có verification UI | — |
| 024 | UI ONLY | `/rights` rows | Không queue detail/actions |
| 025 | MISSING | Không có extension flow | — |
| 026 | MISSING | Không có downstream task flow | — |
| 027 | DEMO COMPLETE | Simulator API | — |
| 028 | DEMO COMPLETE | Event receipt metadata/Evidence | Mock phù hợp prototype |
| 029 | DEMO PARTIAL | Simulator success wording | Thiếu invalid/expired/tampered branch |
| 030 | DEMO PARTIAL | Outbox tab | Retry không thay state; thiếu detail/timeline |
| 031 | UI ONLY | Connector table | Không configure/test/result |
| 032 | DEMO COMPLETE | Tag status in Cookie tab | — |
| 033 | UI ONLY | Cookie static table | Không scan/classify/approve |
| 036 | DEMO COMPLETE | Records/Evidence | — |
| 037 | DEMO PARTIAL | Export dialog/package preview | Thiếu download/result action quan sát được |
| 038 | DEMO COMPLETE | Dashboard | — |
| 039 | DEMO COMPLETE | Audit | — |
| 040 | DEMO PARTIAL | Alert dialog + static config | Resolve có; config/escalation/reopen không có |
| 043 | UI ONLY | Usage KPI | Không filter/drill-down |

### Correct status totals

- DEMO COMPLETE: **21**.
- DEMO PARTIAL: **7**.
- UI ONLY: **7**.
- MISSING: **3**.
- Tổng: **38**.

## 4. Gaps ưu tiên theo giá trị demo

### P0 — Không trình diễn được workflow SRS

1. Rights Request end-to-end: FR-022..026.
2. Cookie scan/classification/approval: FR-033.
3. Application registration/configuration linked to consent/integration: FR-006.

### P1 — Có flow nhưng điểm chuyển trạng thái chưa thuyết phục

4. Rule/Matrix approval lifecycle: FR-004/005.
5. Event retry/detail and connector delivery result: FR-030/031.
6. Key rotation dialog: FR-010.
7. Evidence export observable completion: FR-037.

### P2 — Tăng khả năng giải thích

8. Rights/Integration/Settings descriptions hiện nói nhiều hơn khả năng thao tác.
9. Guided scenario cho Simulator.
10. Invite user cần thêm row hoặc hiển thị pending invitation.
11. Alert settings và usage filters.
12. Channel validation example trong Simulator.

## 5. Những gì không được coi là gap ở giai đoạn này

- Không có backend/database/API thực.
- Role switcher thay authentication.
- Receipt/hash/signature/webhook là simulated metadata.
- File evidence chỉ dùng metadata.
- State reset khi reload.
- Không có production performance/security infrastructure.

Điều kiện: UI phải ghi rõ đây là mô phỏng để người xem không hiểu sai.

## 6. Not Verified

- Runtime walkthrough trên trình duyệt chưa được dùng làm bằng chứng trong báo cáo; kết luận dựa trên source path và mutation inspection.
- Các AC phụ thuộc timing/concurrency nhiều người như optimistic approval race chưa được kiểm chứng.
- Các `[N]/[TBD]/[KC]` của SRS chưa đủ để xác định kết quả demo cuối cùng.
