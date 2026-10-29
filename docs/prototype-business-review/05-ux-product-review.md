# Đánh giá UX và tính mạch lạc sản phẩm

## 1. Sidebar và information architecture

Bốn nhóm Tổng quan, Cấu hình, Vận hành, Hệ thống bám SRS-IF-08 và nhìn chung hợp lý cho người đã hiểu CMP.

### Điểm tốt

- Chuỗi Cấu hình đi theo Purpose → Consent → Notice → Banner → Rules/Matrix.
- Vận hành gom Records, Evidence, Offline, Import và Rights.
- System tách Users/Audit/Integrations/Settings.
- Menu ẩn theo role và badge approval giúp người dùng tập trung.

### Điểm cần cải thiện

- “Mục đích & dữ liệu” dễ bị hiểu là kho dữ liệu; nên giữ description hiện tại và cân nhắc label “Mục đích xử lý & danh mục dữ liệu”.
- “Consent” là thuật ngữ kỹ thuật; người mới cần subtitle “Loại đồng ý cần thu thập”.
- “Phiên bản thông báo” chưa nói đây là nội dung hiển thị cho chủ thể.
- “Quy tắc & ma trận” chứa hai khái niệm khó; tabs tốt nhưng sidebar label cần tooltip nghiệp vụ.
- “Bản ghi consent” và “Bằng chứng” gần nhau nhưng khác mục tiêu: current state vs immutable event. Description đã tốt, nên thêm cross-link rõ.
- Các tag `P3` là milestone nội bộ, không giúp người mới hiểu; nên giải thích trong demo hoặc đổi sang “Chưa hoàn thiện”.

## 2. Screen clarity

### Dễ hiểu

Dashboard, Purpose, Consent, Notice, Banner, Records, Evidence, Offline và Import đều có PageHeader description giải thích nghiệp vụ. Đây là thay đổi có giá trị so với template gốc.

### Có nguy cơ gây nhầm

- Rules/Matrix: người mới khó hiểu quan hệ giữa material change và function blocking.
- Simulator: bốn persona/context trong một màn; log kỹ thuật có thể lấn át câu chuyện nghiệp vụ.
- Rights: description hứa cả workflow nhưng UI chỉ có list.
- Integrations: bốn domain khác nhau nằm trong tabs và đều ở mức khác nhau.
- Settings: signing key, alert config và metering không có quan hệ thao tác trực tiếp.

## 3. Duplicate and overloaded functionality

- Approval có thể mở từ object screen, Notification Center và bell. Đây là các entry point hợp lý, không phải duplicate xấu.
- Evidence và Subject History cùng dùng Evidence Sheet; reuse tốt.
- Simulator và Banner Editor dùng chung renderer; đảm bảo preview/demo nhất quán.
- Integrations là **SPLIT CANDIDATE** vì App Registration, Event Delivery, Connector và Scanner là bốn jobs-to-be-done.
- Settings là **SPLIT CANDIDATE** nếu demo sâu key/alert/metering; nếu chỉ overview có thể giữ tabs/sections.
- Rights là **SPLIT CANDIDATE** giữa subject portal và operator console.

## 4. Workflow entry and exit points

### Có điểm bắt đầu/kết thúc rõ

- Purpose/Consent/Notice/Banner: Create → Submit → Notification → Approve → Active.
- Offline: Create → Records/Evidence.
- Simulator: Action → shared log/state → Records/Evidence/Dashboard.
- Import: Batch → validation → approval → written.

### Thiếu

- Rights không có điểm bắt đầu hoặc closure.
- Scanner không có “Run scan”.
- T3 Application không có “Register application”.
- Connector không có “Configure/Test”.
- Signing key không có “Rotate key”.
- Usage không có period/filter/drill-down.

## 5. Observable results

- Tốt: Purpose/Consent status, approval, simulator events, offline event, Records, Evidence, Audit.
- Chưa đủ: Invite user chỉ toast; rule submit chỉ toast; event retry chỉ toast; evidence export mở preview nhưng không download; connector/key/scan actions không có.

Đề xuất UX cho prototype là luôn tạo một observable state change, dù chỉ trong memory: thêm row, đổi status, thêm timeline entry hoặc mở result dialog.

## 6. Labels, statuses and actions

- Status badges tương đối nhất quán giữa Draft/Pending/Returned/Active/Stopped.
- Notice sử dụng English statuses (`Published`, `Expired`) xen tiếng Việt; cần BA xác nhận terminology system-wide.
- Button “Lưu phiên bản mới” ở Matrix đồng thời nói “gửi duyệt” nhưng lại áp dụng ngay; label và behavior mâu thuẫn.
- “Mở đề nghị duyệt” phù hợp khi item pending, nhưng user không phải approver vẫn thấy dialog read/withdraw; behavior này hữu ích cần description.
- “Gửi lại” event nên đổi status hoặc tạo log line để chứng minh action.

## 7. Empty states and guidance

- DataTable và Notification có empty state.
- Simulator có empty state log và current state.
- P3 screens chưa có empty/error/success variants do dùng static rows.
- Nên thêm “Demo checklist” hoặc stepper ở Simulator, không cần thay layout lớn.
- Nên thêm inline links: Purpose → create Consent; Consent → create Notice; Notice → configure Banner; Evidence → Audit entry.

## 8. Screen Recommendations

| Screen | Recommendation | Rationale |
|---|---|---|
| Dashboard | KEEP | Entry overview và drill-down tốt |
| Notifications | KEEP + BA CONFIRMATION | Gộp approval/alert hợp lý nhưng lệch danh mục screen riêng |
| Purpose | KEEP | Complete demo workflow |
| Consent | IMPROVE | Minh họa channel/app validation runtime |
| Notices | KEEP | Strong version/re-consent story |
| Banner list | KEEP | Supporting navigation useful |
| Banner editor | KEEP | High-value interactive demo |
| Rules/Matrix | IMPROVE | Approval state và wording |
| Records | KEEP | Clear current-state job |
| Subject History | KEEP | Clear evidence timeline |
| Evidence | KEEP | Strong domain explanation |
| Evidence Package | IMPROVE | Observable export result |
| Offline | KEEP | Complete cross-screen demo |
| Import | KEEP | Complete migration simulation |
| Simulator | KEEP + IMPROVE | Add guided storyline; reduce cognitive load |
| Rights | SPLIT CANDIDATE + IMPROVE | Subject and operator flows absent |
| Users/RBAC | IMPROVE | Invite result and organization |
| Audit | KEEP | Useful accountability endpoint |
| Integrations | SPLIT CANDIDATE + IMPROVE | Four independent domains |
| Settings | SPLIT CANDIDATE + BA CONFIRMATION | Depth depends on demo scope |
| Forbidden | KEEP | Supports RBAC demo |
| Not Found | KEEP | Standard navigation support |

Không đề xuất REMOVE CANDIDATE cho màn nào.

## 9. Ten UX/Product issues with highest impact

1. Rights Management không có workflow demo.
2. App/Connector/Scanner trong Integrations không có action bắt đầu.
3. Rules/Matrix wording không khớp state behavior.
4. Simulator quá dày cho người lần đầu biết CMP.
5. Settings gom ba domain nhưng không có thao tác.
6. Một số labels English/Vietnamese chưa nhất quán.
7. Invite/Retry/Rule Submit chỉ toast, thiếu observable result.
8. Cross-module next-step links chưa đồng đều.
9. Tag `P3` không giải thích giá trị sản phẩm.
10. Các mô tả crypto/WORM có thể khiến người xem quên đây là simulation.
