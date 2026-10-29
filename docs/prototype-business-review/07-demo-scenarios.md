# Kịch bản demo nghiệp vụ CMP

## DS-01 Tạo Purpose và Consent mới

- **Objective:** Giải thích cấu hình CMP bắt đầu từ mục đích xử lý, không bắt đầu từ banner.
- **Actor:** Nhân viên → DPO.
- **Preconditions:** Chọn role Nhân viên; có data catalog.
- **Demo data:** Purpose `LOYALTY-OFFER`, consent `CS-LOYALTY-OFFER`.
- **Steps:**
  1. Mở `/purposes`, tạo purpose, nhập data/legal basis và lưu nháp.
  2. Gửi duyệt; mở Notification Center.
  3. Đổi role DPO, approve.
  4. Đổi lại Nhân viên, mở `/consents`, tạo consent và chọn purpose vừa active.
  5. Chọn Web/App, application, duration; submit.
  6. DPO approve; mở Audit.
- **Expected:** Purpose/Consent Active; notification và audit có record; consent dùng được ở Notice.
- **Screens/SRS:** Purpose, Consent, Notification, Audit; FR-001/002/039.

## DS-02 Soạn Notice và xuất bản thay đổi trọng yếu

- **Objective:** Giải thích versioned disclosure và re-consent.
- **Actor:** Nhân viên, DPO.
- **Preconditions:** Consent active có Published notice và accepted subjects.
- **Steps:** Tạo notice version → sửa purpose/data/recipient → submit → DPO xem diff → chọn Trọng yếu/effective now → approve → xem Records lọc RE_CONSENT.
- **Expected:** Old Published thành Expired, new Published; affected subjects RE_CONSENT; VERSION_CHANGED/outbox/audit xuất hiện.
- **Screens/SRS:** Notices, Approval, Records, Integrations; FR-003/004/016/030.

## DS-03 Tùy biến Banner tuân thủ

- **Objective:** Minh họa doanh nghiệp tùy biến thương hiệu nhưng không tạo dark pattern.
- **Actor:** Người cấu hình, DPO.
- **Preconditions:** Active consent/notice.
- **Steps:** Mở Banner list/editor → tạo version → đổi layout/text/color → bật EN → gắn consent → xem desktop/mobile/layer 2 → cố tạo contrast lỗi → sửa → submit/approve.
- **Expected:** Compliance checklist pass; active version dùng cùng renderer trong Simulator.
- **Screens/SRS:** Banners, Notification, Simulator; FR-007/011, IF-02.

## DS-04 Cookie Accept/Reject và tag blocking

- **Objective:** Giải thích consent ảnh hưởng tracker thế nào.
- **Actor:** Data subject.
- **Preconditions:** Active cookie banner.
- **Steps:** Mở Simulator Cookie → tạo khách mới → xem essential tags → Reject all → xem analytics/marketing blocked → reopen → customize/accept analytics → xem tag state → click login/link identity.
- **Expected:** Anonymous events, current states và tag state thay đổi; linked evidence xuất hiện cho known subject.
- **Screens/SRS:** Simulator, Evidence, Records; FR-011/018/032.

## DS-05 Business Function Accept, Reject và CMP failure

- **Objective:** Giải thích `CMP.require`, mandatory/optional dependency và fail-closed.
- **Actor:** Data subject/T3 frontend.
- **Steps:** Mở Simulator Form → chọn new subject → gọi Membership/eKYC/Marketing functions → Reject một required function và một optional function → quan sát kết quả → Accept → bật CMP unavailable và thử lại → mở Evidence link.
- **Expected:** Required reject chặn đúng function, optional reject cho tiếp tục, accept sinh Receipt metadata, outage trả UNKNOWN/fail-closed.
- **Screens/SRS:** Simulator, Rules Matrix, Evidence; FR-012/013/014/027/028/029.

## DS-06 Preference Center và Withdrawal

- **Objective:** Chứng minh data subject có thể đổi ý sau khi consent.
- **Actor:** Data subject.
- **Preconditions:** Subject có accepted marketing consents.
- **Steps:** Preference tab → gửi OTP demo → nhập `123456` → xem choices → withdraw email → confirm → withdraw all marketing → mở Records/Evidence/Integrations.
- **Expected:** WITHDRAWN effective immediately; state/outbox/dashboard update; transactional channel unaffected.
- **Screens/SRS:** Simulator, Records, Evidence, Integrations; FR-019/020/021/030/031.

## DS-07 Ghi nhận ngoại tuyến và hiệu chỉnh

- **Objective:** Cho thấy consent giấy/SMS/ghi âm vẫn có evidence chain.
- **Actor:** Nhân viên.
- **Steps:** Mở Offline → create record với actual time, notice version và file metadata → save → mở row/evidence → chọn hiệu chỉnh → nhập reason và decision mới → mở subject history/audit.
- **Expected:** Original không bị sửa; correction event liên kết bản gốc; current state tính theo rule thời gian.
- **Screens/SRS:** Offline, Evidence, Subject History, Audit; FR-017/036/039.

## DS-08 Import Legacy có dòng rủi ro

- **Objective:** Minh họa migration không ghi thẳng dữ liệu chưa kiểm tra.
- **Actor:** Nhân viên/Admin, DPO.
- **Steps:** Tạo batch → xem mapping/errors/risk → submit → DPO chọn Giữ/Xin lại từng risk row → approve → mở Records/Evidence filter Legacy.
- **Expected:** Batch `Đã ghi`; valid legacy events xuất hiện; error rows bỏ qua; risk flag/decision quan sát được.
- **Screens/SRS:** Import, Notification, Records, Evidence; FR-009.

## DS-09 Approval và RBAC

- **Objective:** Giải thích quyền theo module và maker-checker.
- **Actor:** Admin, Nhân viên, DPO.
- **Steps:** Nhân viên tạo/submit item → thử self-approve và thấy bị chặn → DPO approve → Admin mở permission matrix, bật approve cho Admin → tạo request bằng Admin và thử self-approve → xem Forbidden bằng role không có view.
- **Expected:** Permission thay menu/actions; self-approval luôn bị chặn; audit ghi permission change.
- **Screens/SRS:** Users, Notification, Forbidden, Audit; FR-008, BR-AP-01.

## DS-10 Evidence package và dashboard drill-down

- **Objective:** Nối operational reporting với evidence chi tiết.
- **Actor:** DPO.
- **Steps:** Tạo vài decisions ở Simulator → Dashboard chọn 30 ngày/Property → click consent bar → Records filtered → subject history → export package với reason → xem package preview → mở Audit.
- **Expected:** Cùng dataset xuất hiện nhất quán; package/audit record được tạo.
- **Screens/SRS:** Dashboard, Records, Evidence Package, Audit; FR-036/037/038/039.

## DS-11 Rights workflow target scenario

- **Objective:** Kịch bản cần có để người mới hiểu rights operations.
- **Actor:** Data subject, operator, DPO.
- **Current status:** Không thể thực hiện trên prototype hiện tại.
- **Expected steps sau khi bổ sung:** Submit delete request → verify → queue/assign → create downstream tasks → request extension hoặc complete → DPO approve closure → subject tracks status.
- **Expected result:** Timeline, SLA và downstream completion visible.
- **Screens/SRS:** Rights screens; FR-022..026.

## DS-12 Scanner/Application/Connector target scenario

- **Objective:** Giải thích integration governance từ app registration đến tracker/event delivery.
- **Actor:** Admin/integration operator/DPO.
- **Current status:** Chưa thể demo end-to-end.
- **Expected steps:** Register app → configure origin/key/webhook → assign consent → run cookie scan → classify tracker → approve Essential if needed → trigger withdrawal → observe connector suppression/delivery retry.
- **Screens/SRS:** Integrations, Consent, Notification; FR-006/030/031/033.
