# MT-2.1b Browser Regression Report

**Ngày kiểm thử:** 28/10/2026  
**Phạm vi:** MT-1 multi-tenant foundation và MT-2.1 effective-role enforcement  
**Kết luận:** Đạt có điều kiện; không còn lỗi Critical/High đã biết trong các luồng đã thực thi. Hai lỗi Medium được phát hiện, sửa và kiểm thử lại thành công.

## 1. Môi trường và phương pháp

- Windows, Vite development server tại `http://127.0.0.1:5173`.
- Trình duyệt: Codex in-app browser dùng Chromium engine. Công cụ không công bố chuỗi phiên bản Chromium chính xác, vì vậy version cụ thể là **không xác định**.
- Kiểm thử bằng điều khiển trình duyệt thật và DOM/accessibility snapshots; không chỉ dựa vào unit test hoặc đọc mã.
- Repository không có Playwright, Cypress hoặc Puppeteer dependency/config. Không cài thêm dependency; dùng browser automation có sẵn của môi trường Codex.
- Không lưu ảnh PNG ra repository. Bằng chứng phiên chạy gồm DOM snapshots, trạng thái control, browser console và kết quả command trong session.

Lưu ý vai trò: prototype chỉ có `Admin`, `DPO`, `Nhân viên`; không có role tên `Auditor` hoặc `Privacy Officer`. Kịch bản đa vai trò được thực thi với membership Health `Admin + DPO`. DPO là role review/approval gần nhất, nhưng không được báo cáo như một bài test role Auditor chính xác.

## 2. Kết quả browser regression

| ID | Kịch bản đã thực thi | Kết quả | Bằng chứng chính |
|---|---|---|---|
| A-01 | Health, Đặng Hải An, đổi Admin → DPO | PASS (role tương đương) | Effective role hiển thị DPO ngay; permission matrix từ 90 checkbox enabled xuống 0. |
| A-02 | Navigation/action thay đổi theo role | PASS/PARTIAL | DPO mất nút `Mời người dùng` và quyền sửa matrix; Staff mất menu Users/Audit/Settings. Admin và DPO có cùng nhiều quyền `view`, nên sidebar của hai role này không khác ở các module cùng được xem. |
| A-03 | Restricted action không thực thi được | PASS | DPO không có control sửa matrix; Admin có 90 control enabled. Admin không thấy approval queue setup, DPO thấy 5. |
| A-04 | Đổi DPO ↔ Admin cập nhật tức thời | PASS | `Mời người dùng`, matrix edit và approval count thay đổi không cần refresh. |
| A-05 | Đổi lại DPO loại bỏ quyền Admin | PASS | Control edit trở về disabled/ẩn. |
| A-06 | Route guard | PASS/PARTIAL | Đang ở `/users`, đổi sang Staff trả trang 403 và loại menu bị cấm. Deep-link qua address bar không kiểm thử đúng nghĩa vì ứng dụng dùng `MemoryRouter` và URL browser luôn ở `/`. |
| B-01 | Chuyển Retail, Finance, Health | PASS | Header, property list và dashboard data thay đổi theo tenant. Retail có 281 lượt hỏi; Finance/Health 33; property names khác nhau. |
| B-02 | Membership theo tenant | PASS | Trần Hoàng Long là Admin ở Retail nhưng Staff ở Health; Lê Quang Huy là Staff ở Retail nhưng Admin ở Finance. |
| B-03 | Role cũ không hợp lệ được thay | PASS | Health Staff → Retail tự chọn Admin; Retail Staff → Finance tự chọn Admin. |
| B-04 | Không giữ quyền tenant trước | PASS | Route Users đang mở chuyển sang Staff Health lập tức trả 403; không thấy stale Admin permission. |
| B-05 | Tenant data isolation | PASS | Property, dashboard, notification/approval và audit đều chỉ hiện dữ liệu tenant active; audit approval Health không xuất hiện ở Retail. |
| B-06 | Refresh không phục hồi quyền trái phép | PASS sau sửa | Context Health/user-health-admin/DPO được refresh và phục hồi đúng sau validation. |
| C-01 | Role được phép phê duyệt | PASS | DPO Health thấy 5 setup approvals và phê duyệt `CS-MKT-ZALO`; queue giảm còn 4. |
| C-02 | Role không được phép phê duyệt | PASS | Cùng user ở effective Admin thấy `Chờ tôi duyệt = 0`; không có action approve. |
| C-03 | Đổi role cập nhật approval actions | PASS | Admin notification count 2 operational alerts; DPO count 6 gồm 5 approvals trước thao tác. |
| C-04 | Approval scoped theo tenant | PASS | Approval/audit Health không hiển thị ở Retail. |
| D-01..03 | Audit có tenant, user, effective role | PASS | Detail của approval ghi `tenant-health`, `user-health-admin`, `DPO`, action `Phê duyệt`. |
| D-04 | Đổi role không sửa lịch sử | PASS | Sau DPO → Admin, event approval cũ vẫn mang role DPO. |
| D-05 | Audit tenant khác không hiển thị | PASS | `CS-MKT-ZALO` Health có count 0 ở Retail audit. |
| E-01 | Refresh giữ valid workspace context | PASS sau sửa | Trước/sau reload đều `tenant-health`, `user-health-admin`, `DPO`. |
| E-02 | Invalid persisted role bị từ chối | BLOCKED ở browser | Resolver mới validate/fallback tập trung; không thể ghi giá trị giả vào browser storage qua UI/browser harness hiện có. Không tuyên bố browser pass. |
| E-03 | Invalid persisted tenant fail-safe | BLOCKED ở browser | Cùng giới hạn trên. Code path trả fallback Retail/Staff và TypeScript pass, nhưng chưa được browser-injected. |
| E-04 | Không xuất hiện unauthorized navigation sau refresh | PASS | Reload DPO vẫn ở DPO, không phục hồi Admin controls. |
| F-01 | Đổi role/tenant không sửa business data | PASS/PARTIAL | Không quan sát thay đổi ngoài thao tác approval chủ ý; dữ liệu tenant khác vẫn độc lập. Không chạy snapshot browser tự động toàn bộ mọi collection vì không có Playwright suite. |

## 3. Defects

### DEF-01 — Valid workspace context bị mất sau refresh

- **Severity:** Medium.
- **Reproduction:** chọn Retail/Trần Hoàng Long/Admin hoặc Health/Đặng Hải An/DPO; refresh browser.
- **Expected:** tenant, persona và effective role hợp lệ được giữ; mọi giá trị phải được validate lại với membership.
- **Actual trước sửa:** luôn trở về Retail/Lê Quang Huy/Staff.
- **Fix:** chỉ persist `{ tenantId, userId, role }` trong `localStorage`; hydrate qua `resolveDemoContext`, xác minh tenant active, membership active và effective role thuộc membership. Invalid role dùng authorized default; invalid tenant/user dùng safe fallback Retail/Staff. Dữ liệu nghiệp vụ không được persist.
- **Retest:** PASS — Health/Đặng Hải An/DPO giữ nguyên sau reload.

### DEF-02 — Audit “Xem nhật ký” bị ghi hai lần

- **Severity:** Medium.
- **Reproduction:** mở Audit trong development React Strict Mode.
- **Expected:** một lượt mở tạo một event.
- **Actual trước sửa:** hai event cùng timestamp/user/role.
- **Fix:** guard effect bằng `useRef`, giữ append-only semantics nhưng tránh Strict Mode mount effect lặp.
- **Retest:** PASS — một lần mở Audit tạo đúng 1 row `Đặng Hải An · DPO · Xem nhật ký`.

## 4. Files changed

- `src/lib/store.ts`: validated context persistence/hydration; không persist workspace/business data.
- `src/app/admin.tsx`: chống duplicate audit view event.
- `docs/prototype-implementation/mt-2-1b-browser-regression-report.md`: báo cáo này.

Không thêm dependency và không triển khai Platform Administration.

## 5. Static checks và runtime

- `tsc --noEmit`: **PASS**, exit code 0.
- ESLint: **PASS với 0 errors**, còn 12 warnings `react-refresh/only-export-components` đã tồn tại ở các file ngoài thay đổi chính.
- Vite production build: **PASS**, 3.045 modules; còn warning bundle lớn hơn 500 kB.
- Browser console: không có runtime error/warning từ ứng dụng trong lượt chạy cuối; chỉ có Vite connect/HMR debug và React DevTools info.
- Existing TypeScript test file không chạy trực tiếp bằng Node vì ESM extensionless imports và repository không có test runner/`tsx` dependency. Không cài thêm dependency. Các TC-01..TC-10 trước đó vẫn type-check.

## 6. Remaining limitations

1. Không có role `Auditor`; coverage dùng DPO và Staff để chứng minh enforcement, không phải equivalence nghiệp vụ tuyệt đối.
2. `MemoryRouter` không hỗ trợ URL deep-link thực tế; route guard được kiểm chứng bằng context downgrade trên route đang mở. Khi chuyển sang browser history routing ở milestone sau, cần thêm test deep-link `/users`, `/audit`, `/settings`.
3. Không có persisted browser test suite/replay artifact; cần bổ sung Playwright khi dự án chấp nhận dependency/tooling test.
4. Invalid localStorage injection chưa được chạy ở browser; resolver đã fail-safe và compile, nhưng E-02/E-03 vẫn BLOCKED ở cấp browser UAT.
5. Prototype chỉ persist context. Business data, approval mutation và audit mới vẫn reset về mock seed sau full reload; đây là giới hạn frontend-only, không phải production persistence/authorization.
6. Client-side guards chỉ phục vụ demo UX; không phải production-grade authorization.

## 7. Readiness for MT-2.2

**Ready có điều kiện.** Effective-role switching, tenant membership resolution, cross-tenant isolation, approval enforcement, audit context và valid refresh persistence đều đã được browser-verified. Không có blocker Critical/High cho MT-2.2.

Trước khi coi UAT hoàn tất toàn bộ, nên bổ sung browser suite có khả năng seed storage để chạy E-02/E-03 và chuyển sang router hỗ trợ deep-link hoặc định nghĩa rõ đây không phải yêu cầu của prototype.
