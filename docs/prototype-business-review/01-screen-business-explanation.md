# Giải thích nghiệp vụ các màn hình Prototype CMP

## Phạm vi và cách đọc

Báo cáo nhận diện 22 màn hình/trạng thái điều hướng thực tế từ `src/config/routes.tsx` và `AppLayout`: 20 màn hình nghiệp vụ, màn Không có quyền và màn Không tìm thấy. Dialog/sheet quan trọng được giải thích trong màn hình chủ quản. Source là bằng chứng hiện trạng; SRS CMP v1.3 là căn cứ nghiệp vụ.

## SCR-P01 Dashboard consent

- **Route / module:** `/dashboard` · Tổng quan.
- **SRS:** SRS-FR-038 · SCR-38-01.
- **Actor:** Admin, DPO, Nhân viên có quyền xem dashboard.
- **Mục đích:** Cho người vận hành nhìn nhanh mức độ thu thập, từ chối, rút lại và số chủ thể cần đồng ý lại. Nếu thiếu màn này, người dùng phải tự tổng hợp từ hàng trăm evidence records.
- **Input/actions:** Chọn 7/30/90 ngày, Property; bấm cột consent để sang `/records?consent=...`.
- **Validation/BR:** Không tính Legacy; đóng popup không tính là Reject; ô dưới ngưỡng demo 5 hiển thị `—`.
- **Output:** KPI, trend, acceptance rate theo consent/property.
- **Hiện trạng:** Tính trực tiếp từ store; filter và drill-down hoạt động. Source: `src/app/dashboard.tsx`.
- **UI:** KPI giải thích outcome; AreaChart thể hiện xu hướng; BarChart là điểm vào Records; bảng Property tránh dữ liệu định danh.
- **Ví dụ:** DPO thấy withdrawal tăng ở `member.abcmart.vn`, lọc Property rồi mở Records để xem consent liên quan.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**.

## SCR-P02 Trung tâm thông báo

- **Route / module:** `/notifications` · Tổng quan/Approval/Operations.
- **SRS:** SCR-AP-01, SRS-FR-040; SRS 4.3.4.
- **Actor:** Người gửi đề nghị, người có quyền approve, người nhận alert.
- **Mục đích:** Tập trung công việc cần xử lý thay vì buộc người dùng đi từng module tìm bản chờ duyệt hoặc sự cố.
- **Input/actions:** Lọc Chờ tôi duyệt/Đề nghị của tôi/Kết quả/Cảnh báo; mở Approval Dialog; mở alert, tới đối tượng, nhập ghi chú và resolve.
- **Validation/BR:** Không tự duyệt; return cần lý do; resolve alert cần ghi chú 10–500 ký tự.
- **State/output:** Pending request có thể approved/returned/withdrawn; alert chuyển Đang mở → Đã xử lý; notification có read state.
- **UI:** Chips cho work queue, list theo thời gian, alert dialog, chuông global ở header.
- **Liên kết:** Purpose, Consent, Notice, Banner, Import, Integrations.
- **Hiện trạng:** Tương tác hoạt động trên store. Source: `src/app/notifications.tsx`, `src/components/cmp/notifs.tsx`, `approval.tsx`.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**. BA xác nhận việc gộp alert riêng vào Notification Center.

## SCR-P03 Mục đích và danh mục dữ liệu

- **Route / module:** `/purposes` · Cấu hình.
- **SRS:** SRS-FR-001 · SCR-01-01/02/03.
- **Actor:** Nhân viên/Admin cấu hình; DPO duyệt.
- **Mục đích:** Mô tả doanh nghiệp xử lý dữ liệu để làm gì, loại dữ liệu nào, cơ sở nào và bên nhận nào. Consent phụ thuộc purpose, nên đây là điểm bắt đầu của chuỗi cấu hình CMP.
- **Input:** Mã, tên, mô tả, data items, phạm vi, legal basis, retention, sharing/recipients, child flag.
- **Actions:** Tìm/lọc; tạo, lưu nháp, gửi duyệt; xem sheet; sửa revision; so sánh version; đề nghị ngừng; xóa draft; import catalog mô phỏng.
- **Validation:** Code `[A-Z0-9-]{3,20}`, unique, required fields; sensitive/child warnings; delete bị chặn khi đã active/được tham chiếu.
- **Transitions:** New → Draft → Pending → Active/Returned; Active → Pending stop → Stopped; active revision giữ bản cũ có hiệu lực.
- **Output/next:** Purpose active có thể được chọn ở Consent; activity tạo audit/notification.
- **UI:** KPI giải thích trạng thái; tabs Purpose/Data Catalog; table; detail sheet; form dialog; stop/delete/import dialogs.
- **Hiện trạng:** Luồng chính có đủ tương tác demo. Source: `src/app/purposes.tsx`, `src/lib/store.ts`.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**.

## SCR-P04 Consent Configuration

- **Route / module:** `/consents` · Cấu hình.
- **SRS:** SRS-FR-002 · SCR-02-01/02.
- **Actor:** Nhân viên/Admin cấu hình; DPO duyệt.
- **Mục đích:** Định nghĩa từng lựa chọn đồng ý mà ứng dụng sẽ yêu cầu, gắn với purpose đã active. Nếu thiếu consent configuration, banner/SDK không có mã nghiệp vụ thống nhất để hỏi và ghi quyết định.
- **Input:** `consent_code`, tên, purposes, bắt buộc/tùy chọn, channels, applications, duration.
- **Actions:** Tạo/sửa draft, submit, mở approval, stop, compare versions.
- **Validation:** Code/required fields; ít nhất một active purpose và application; không cho Mandatory khi purpose dựa trên consent; sensitive purpose sinh cảnh báo luồng riêng.
- **Output/next:** Consent active dùng trong Notice, Banner, Simulator và Records.
- **UI:** Table, filters, detail sheet, form dialog, status/history/actions.
- **Hiện trạng:** State mutation và liên kết module hoạt động. `channels` là metadata cấu hình, chưa được store dùng để chặn sai kênh; đây là gap demo rule nhỏ. Source: `src/app/consents.tsx`.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP/IMPROVE** kiểm tra channel trong simulator.

## SCR-P05 Phiên bản thông báo

- **Route / module:** `/notices` · Cấu hình.
- **SRS:** SRS-FR-003/004 · SCR-03-01/02/03.
- **Actor:** Nhân viên soạn; DPO duyệt/xuất bản.
- **Mục đích:** Lưu đúng nội dung pháp lý đã hiển thị khi xin consent và quản lý thay đổi nội dung theo version.
- **Input:** Consent, summary, bốn nhóm nội dung VI/EN, suggested material label, effective time khi approve.
- **Actions:** Tạo từ Published hiện hành, edit, submit; approve/publish hoặc schedule; cancel schedule/delete draft.
- **Validation:** VI đủ bốn nhóm; EN nếu dùng phải đủ; một version đang xử lý; đổi material label cần lý do.
- **Transitions:** Draft → Pending → Scheduled/Published → Expired; Return/Delete/Cancel schedule là nhánh.
- **Output:** Notice Published được Simulator/Evidence dùng; material change tạo `RE_CONSENT` và `VERSION_CHANGED`.
- **Hiện trạng:** Luồng chính có state và cross-module effect. Source: `src/app/notices.tsx`, `store.ts`, `approval.tsx`.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**.

## SCR-P06 Danh sách Banner và Popup

- **Route / module:** `/banners` · Cấu hình.
- **SRS:** Hỗ trợ SRS-FR-007; không thấy Screen ID danh sách riêng trong Phụ lục C.
- **Actor:** Người cấu hình banner.
- **Mục đích:** Là điểm vào quản lý nhiều banner/popup theo loại và Property trước khi mở editor.
- **Actions/UI:** Tabs popup/cookie, table/cards, tạo cấu hình mới, mở editor.
- **Output:** Banner draft mới và navigation tới `/banners/:code`.
- **Hiện trạng:** Có tương tác store. Source: `src/app/banners.tsx`.
- **Necessity / recommendation:** **SUPPORTING SCREEN · KEEP**; hữu ích cho demo dù SRS chỉ định SCR-07-01 editor.

## SCR-P07 Trình tùy biến Banner và Popup

- **Route / module:** `/banners/:code` · Cấu hình.
- **SRS:** SRS-FR-007, FR-011/012/014 · SCR-07-01, liên quan SCR-11-01/02, 12-01, 14-01.
- **Actor:** Nhân viên/Admin cấu hình; DPO duyệt.
- **Mục đích:** Cho phép doanh nghiệp điều chỉnh presentation trong rào chắn tuân thủ mà không tạo dark pattern.
- **Input:** Layout, languages, text, colors, radius, font, logo flag, assigned consents, change note.
- **Actions:** Edit draft/version, desktop/mobile preview, cookie layer preview, compliance check, submit, create new version.
- **Validation:** Có consent, đủ nội dung ngôn ngữ, contrast, equal Accept/Reject styling, no precheck, note required.
- **Output:** Version Pending/Active; active config được Simulator dùng đúng renderer.
- **Hiện trạng:** Tương tác demo mạnh và liên kết trực tiếp simulator. Source: `src/app/banners.tsx`, `banner-renderer.tsx`.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**.

## SCR-P08 Quy tắc và Ma trận

- **Route / module:** `/rules` · Cấu hình.
- **SRS:** SRS-FR-004/005 · SCR-04-01, SCR-05-01.
- **Actor:** Admin/Nhân viên cấu hình; DPO duyệt theo SRS.
- **Mục đích:** Quyết định thay đổi nào buộc xin lại consent và chức năng ứng dụng nào phụ thuộc purpose nào.
- **UI/actions:** Tab rule cho material suggestions/default duration; tab matrix chọn app, cycle cell, onReject behavior, undo/save.
- **Validation/BR:** Các nhóm thay đổi tối thiểu bị khóa material; optional consent không được đánh mandatory; không block toàn app.
- **Output:** Rule submit hiện chỉ toast/audit; matrix version được lưu và áp dụng ngay cho Simulator.
- **Gap:** Chưa demo trọn approval/return/active version của rule và matrix.
- **Necessity / recommendation:** **REQUIRED BY SRS · IMPROVE**.

## SCR-P09 Bản ghi consent

- **Route / module:** `/records` · Vận hành.
- **SRS:** SRS-FR-036 · SCR-36-01.
- **Actor:** DPO/Admin/Nhân viên theo phạm vi quyền.
- **Mục đích:** Cho biết trạng thái hiện hành của mỗi cặp subject × consent, là câu trả lời vận hành “hiện tại có được xử lý hay không”.
- **Actions:** Search subject; filter identity/consent/status/source/property; sort/page; click row.
- **Rules:** Current state lấy từ event hợp lệ mới nhất; role Nhân viên bị hạn chế ở detail/export.
- **Output:** Điều hướng lịch sử subject; nhận filter từ Dashboard.
- **Hiện trạng:** Derived data và navigation hoạt động. Source: `src/app/records.tsx`.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**.

## SCR-P10 Lịch sử consent theo chủ thể

- **Route / module:** `/records/:subject` · Vận hành.
- **SRS:** SRS-FR-036 · SCR-36-01/02.
- **Actor:** Người tra cứu evidence.
- **Mục đích:** Giải thích vì sao trạng thái hiện tại tồn tại bằng toàn bộ chuỗi accept/reject/withdraw/re-consent/correction.
- **Actions:** Xem timeline, mở evidence detail, xuất package nếu có quyền.
- **Output:** Evidence sheet hoặc Export Dialog.
- **Hiện trạng:** Hoạt động từ store events. Source: `src/app/evidence.tsx` (`SubjectHistoryPage`).
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**.

## SCR-P11 Bằng chứng

- **Route / module:** `/evidence` · Vận hành.
- **SRS:** SRS-FR-036/037 · SCR-36-01/02, SCR-37-01.
- **Actor:** DPO, Admin; Nhân viên xem giới hạn.
- **Mục đích:** Cho phép chứng minh ai đã chọn gì, khi nào, qua phiên bản thông báo nào và nguồn nào.
- **Actions:** Filter/search; mở sheet; tabs Evidence/Receipt/Notice/Related; correction; export package.
- **Validation:** Correction có reason; export có scope và reason; role controls masking/export.
- **Output:** Audit entry, correction event hoặc package record.
- **Hiện trạng:** Đủ tương tác demo; hash/WORM/crypto được mô phỏng theo mục tiêu prototype. Source: `src/app/evidence.tsx`.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**.

## SCR-P12 Gói bằng chứng

- **Route / module:** `/evidence/package/:id` · Vận hành.
- **SRS:** SRS-FR-037 · SCR-37-02.
- **Actor:** DPO/người kiểm tra.
- **Mục đích:** Minh họa đầu ra cung cấp cho thanh tra hoặc kiểm toán, gồm scope, events và hashes.
- **Actions/UI:** Xem preview trang đầu, metadata PDF/JSON.
- **Hiện trạng:** Package được tạo trong store và route mở preview; không có download mock. Với demo, preview chứng minh concept nhưng thiếu kết quả tải quan sát được.
- **Necessity / recommendation:** **REQUIRED BY SRS · IMPROVE** bằng nút tải file giả lập hoặc thông báo rõ preview-only.

## SCR-P13 Ghi nhận consent ngoại tuyến

- **Route / module:** `/offline` · Vận hành.
- **SRS:** SRS-FR-017 · SCR-17-01/02.
- **Actor:** Nhân viên nghiệp vụ.
- **Mục đích:** Đưa quyết định thu từ SMS, ghi âm hoặc văn bản vào cùng consent ledger mà không sửa bằng chứng gốc.
- **Input:** Subject, consent, decision, actual time, evidence kind/files, notice version.
- **Actions:** Create, validate, record, view; correction chuyển sang Evidence dialog.
- **Rules:** Tối đa 5 file; version phải Published tại thời điểm; actual/import timestamps tách; correction append-only.
- **Output:** Event xuất hiện ở Records/Evidence/Dashboard.
- **Hiện trạng:** Demo end-to-end bằng metadata file và store. Source: `src/app/offline.tsx`, `evidence.tsx`.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**.

## SCR-P14 Import kế thừa

- **Route / module:** `/import` · Vận hành.
- **SRS:** SRS-FR-009 · SCR-09-01/02.
- **Actor:** Nhân viên/Admin tạo batch; DPO quyết định risk/approve.
- **Mục đích:** Mô phỏng di trú consent cũ có ngày gốc, lỗi và bằng chứng thiếu.
- **Actions:** Tạo mock batch, xem mapping/check results, DPO chọn Giữ/Xin lại, submit/open approval.
- **Validation:** Tất cả risk rows phải có decision trước approve; không overwrite event mới hơn.
- **Output:** Batch state và legacy events khi approved.
- **Hiện trạng:** Đủ trình diễn luồng bằng mock batch. Source: `src/app/admin.tsx`, `store.ts`.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**.

## SCR-P15 Mô phỏng thu thập consent

- **Route / module:** `/simulator` · Vận hành/Demo utility.
- **SRS:** Không có Screen ID riêng; phục vụ FR-011..021, FR-027..029, FR-032 và nhiều SCR subject-facing.
- **Actor:** Người demo/BA/PO, đóng vai data subject và T3 application.
- **Mục đích:** Nối cấu hình CMP với trải nghiệm thực tế và cho team nhìn thấy evidence, receipt, event và state thay đổi.
- **Tabs/actions:** Cookie choices/tag blocking/identity link; form `CMP.require`; re-consent/sensitive flow; Preference Center OTP/change/withdraw; Decision API; CMP-down toggle.
- **Validation/rules:** Fail-closed, no dismissed decision, mandatory matrix, published version, sensitive explicit confirm, withdrawal immediate.
- **Output:** Shared store updates Records/Evidence/Dashboard/Outbox.
- **Hiện trạng:** Là màn demo mạnh nhất nhưng mật độ nghiệp vụ cao.
- **Necessity / recommendation:** **PROTOTYPE DEMO UTILITY · KEEP/IMPROVE** bằng guided scenarios và mô tả persona.

## SCR-P16 Yêu cầu quyền của chủ thể

- **Route / module:** `/rights` · Vận hành.
- **SRS:** SRS-FR-022..026 · SCR-22-01/02, 23-01, 24-01/02, 25-01, 26-01.
- **Actor:** Data subject, Nhân viên xử lý, DPO — nhưng route hiện chỉ thể hiện operator list.
- **Mục đích:** Quản lý yêu cầu xem/sửa/xóa/hạn chế/phản đối/cung cấp dữ liệu với verification và SLA.
- **UI hiện tại:** Read-only table với request ID, subject, type, date, status, owner, due; note P3.
- **Thiếu tương tác:** Submit/lookup/verify/detail/assign/extend/downstream/close.
- **Necessity / recommendation:** **REQUIRED BY SRS · SPLIT CANDIDATE/IMPROVE**; cần ít nhất một guided end-to-end demo flow.

## SCR-P17 Người dùng và phân quyền

- **Route / module:** `/users` · Hệ thống.
- **SRS:** SRS-FR-008 · SCR-08-02/03; thiếu SCR-08-01.
- **Actor:** Admin; các role khác xem theo permission.
- **Mục đích:** Minh họa ai được xem/sửa/approve module nào và maker-checker không phụ thuộc tên role cứng.
- **Actions:** Tabs users/permission; edit checkboxes; invite dialog; role cards.
- **Behavior:** Permission changes tác động sidebar/actions ngay và ghi audit; invite chỉ toast, không thêm user.
- **Gap:** Không có organization structure; invite không có kết quả quan sát trong list.
- **Necessity / recommendation:** **REQUIRED BY SRS · IMPROVE**.

## SCR-P18 Nhật ký kiểm toán

- **Route / module:** `/audit` · Hệ thống.
- **SRS:** SRS-FR-039 · SCR-39-01.
- **Actor:** DPO/Admin có quyền.
- **Mục đích:** Giải thích ai thực hiện thay đổi nào và giá trị trước/sau, hỗ trợ điều tra và governance.
- **Actions:** Search, filter actor/result, open detail. Việc mở màn hình tự ghi “Xem nhật ký”.
- **Output:** Read-only list/detail.
- **Hiện trạng:** Đủ demo audit liên module bằng store. Source: `src/app/admin.tsx`.
- **Necessity / recommendation:** **REQUIRED BY SRS · KEEP**.

## SCR-P19 Tích hợp

- **Route / module:** `/integrations` · Hệ thống.
- **SRS:** FR-006/030/031/033 · SCR-06-01/02, 30-01, 31-01, 33-01/02.
- **Actor:** Admin/integration operator.
- **Mục đích:** Cho biết application nào dùng CMP, event được giao ra sao, connector đích và cookie nào được scan.
- **UI/actions:** Tabs Event/App/Connector/Scan; outbox thay đổi theo Simulator; nút retry hiện toast; các tab còn lại chủ yếu static tables.
- **Gap:** Không demo registration/config/test connector/scan/classification; event retry không đổi status.
- **Necessity / recommendation:** **REQUIRED BY SRS · SPLIT CANDIDATE/IMPROVE**.

## SCR-P20 Cài đặt

- **Route / module:** `/settings` · Hệ thống.
- **SRS:** FR-010/040/043 · SCR-10-01, 40-02, 43-01.
- **Actor:** Admin/DPO tùy phần.
- **Mục đích:** Tập hợp key lifecycle, alert thresholds và usage metrics ít dùng hàng ngày.
- **UI hiện tại:** Static keys table, alert configuration table, usage KPI theo Property.
- **Gap:** Không có rotate/revoke, edit alert hoặc usage filters/drill-down.
- **Necessity / recommendation:** **REQUIRED BY SRS · SPLIT CANDIDATE/IMPROVE** nếu các flow này nằm trong demo scope.

## SCR-P21 Không có quyền

- **Route:** Conditional trong `AppLayout`, không có route riêng.
- **SRS:** Hỗ trợ SRS-IF-04 và FR-008.
- **Mục đích:** Giải thích kết quả khi role không có quyền xem route.
- **Hiện trạng:** Hiển thị role hiện tại; người demo có thể đổi role ở header.
- **Necessity / recommendation:** **SUPPORTING SCREEN · KEEP**.

## SCR-P22 Không tìm thấy trang

- **Route:** `*`.
- **SRS:** Không tìm thấy Screen ID trực tiếp.
- **Mục đích:** Tránh blank/error khi điều hướng sai và đưa người dùng về dashboard.
- **Necessity / recommendation:** **SUPPORTING SCREEN · KEEP**; không phải module CMP.

## Tổng hợp screen recommendation

| Nhóm | Screens |
|---|---|
| KEEP | P01, P02, P03, P05, P06, P07, P09, P10, P11, P13, P14, P18, P21, P22 |
| IMPROVE | P04, P08, P12, P15, P16, P17, P19, P20 |
| SPLIT CANDIDATE | P16, P19, P20 |
| REMOVE CANDIDATE | Không có |
| BA CONFIRMATION | P02 (gộp alert), P15 (sandbox trong product), P16/P19/P20 (mức chi tiết demo) |
