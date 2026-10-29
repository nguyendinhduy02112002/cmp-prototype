# Đánh giá kỹ thuật Prototype CMP

## 1. Architecture Assessment

Kiến trúc phù hợp cho prototype tương tác: một React SPA, shared Zustand store và mock dataset giúp thay đổi ở một màn hình phản ánh sang màn hình khác. Domain components tách khỏi UI primitives và route/navigation được cấu hình tập trung.

Kiến trúc chưa sẵn sàng trực tiếp cho production vì `src/lib/store.ts` đồng thời chứa state, workflow, audit, notification, import, evidence và external-event simulation. Không có API/service boundary, tenant context, query cache, async state hoặc backend authorization.

## 2. Code Quality

### Điểm tốt

- TypeScript types tập trung trong `src/lib/types.ts`.
- Permission model tập trung trong `src/lib/perm.ts`.
- Reusable CMP kit, DataTable, Approval/Compare dialogs.
- Naming route/page tương đối nhất quán.
- Build/type-check thành công; ESLint không có error.
- Business-rule IDs được ghi trong comment/label, hỗ trợ traceability.

### Hạn chế

- `store.ts` là god module khoảng 451 dòng; mutation chứa nhiều side effect chéo.
- Các page lớn: `purposes.tsx`, `simulator.tsx`, `evidence.tsx`, `banners.tsx`.
- Validation phân tán và thủ công dù Zod/React Hook Form đã được cài.
- Dùng `JSON.parse(JSON.stringify())` để clone, không phù hợp type có Date/Map/undefined.
- `fakeHash` và security labels dễ bị hiểu nhầm là implementation thật.
- Helper và component cùng file tạo 12 Fast Refresh warnings.
- Không có automated tests.
- Eager route imports tạo bundle lớn.

## 3. Frontend Readiness

### Có thể tái sử dụng

- App shell, navigation, RBAC presentation.
- Domain type baseline.
- Form/layout conventions.
- Tables, status badges, approval UI.
- Screen information architecture.

### Cần refactor trước khi mở rộng lớn

- Tách store theo domain hoặc service/use-case.
- Tạo API contracts và adapter để thay mock bằng backend.
- Dùng async query/mutation state và error/loading handling.
- Chuẩn hóa form schema.
- Route-level lazy loading.
- Chuyển Memory Router sang cơ chế routing được PO xác nhận.

## 4. Backend Integration Readiness

Mức sẵn sàng: trung bình-thấp. UI và types cung cấp vocabulary tốt, nhưng mutation gọi trực tiếp store và data shapes được tối ưu cho demo, chưa phải API DTO.

Cần boundary tối thiểu:

```text
UI → application hooks/use-cases → API client → backend
                         ↓
                   query cache/state
```

Các concern backend bắt buộc nhưng hiện chưa có: tenant resolution, authentication context, authorization, optimistic version, idempotency, paging/filter contracts, file upload, job status, audit event, external delivery status.

## 5. Security Assessment

| Control | Hiện trạng | Kết luận |
|---|---|---|
| Authentication | Không có; đổi role trực tiếp | Not Implemented |
| Authorization | Ẩn menu/action và route gate client-side | Partially Implemented; không phải security boundary |
| Input validation | Manual UI validation | Partial; có thể bypass store action |
| Sensitive data | Mock identifiers; masking một số field theo role | UI-only privacy simulation |
| Storage | In-memory; theme localStorage | Không persistence nghiệp vụ |
| Receipt crypto | Metadata giả | Not Implemented |
| Webhook security | Text/mock | Not Implemented |
| Audit integrity | Mutable Zustand array | Không phải tamper-resistant audit |
| Tenant isolation | Không có tenant | Not Implemented |

Không có bằng chứng để kết luận đáp ứng security NFR hoặc pháp luật.

## 6. Privacy Assessment

Prototype thể hiện tốt privacy concepts: minimization, pseudonymous subject ID, withdrawal, re-consent, purpose linkage, evidence history, role masking và no-delete correction. Tuy nhiên enforcement nằm trong UI/in-memory logic; không có retention engine, deletion propagation, data residency, processor tracking thực hoặc WORM.

## 7. Technical Risks

| Risk ID | Risk | Severity | Evidence |
|---|---|---|---|
| TR-01 | Stakeholder hiểu mock security/evidence là implementation thật | High | security wording trong `evidence.tsx`, `p3.tsx` |
| TR-02 | Business rule phân tán giữa page và store | High | manual checks trong nhiều `app/*.tsx` |
| TR-03 | Không có test cho approval/state transitions | High | không có test/spec files |
| TR-04 | Permission bypass qua direct store action | High nếu phát triển production | `useCan` chủ yếu ở UI; mutations không guard toàn diện |
| TR-05 | Bundle lớn và all-routes eager load | Medium | build warning 1.34 MB JS |
| TR-06 | Memory router không hỗ trợ deep link | Medium | `src/App.tsx` |
| TR-07 | Installed-but-unused form/validation dependencies tạo kỳ vọng sai | Low | package vs import inspection |
| TR-08 | Single-tenant assumptions lan vào model | Medium | types/store không có tenant context |

## 8. Technical Debt and Validation Evidence

- Build: passed (`tsc -b && vite build`).
- Lint: passed với 12 warnings, 0 errors.
- Tests: không có test được phát hiện, vì vậy không có test command/result nghiệp vụ.
- Runtime/UAT: chưa thực hiện browser walkthrough trong đợt phân tích; các kết luận hành vi dựa trên source inspection và static validation.
- Repository không được thay đổi ngoài tài liệu assessment.
