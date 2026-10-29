# MT-1 Manual UAT Checklist

## Hướng dẫn chung

Chạy `npm.cmd run dev`, mở prototype và không tải lại trang trong khi kiểm thử vì state chỉ tồn tại trong bộ nhớ. Ghi PASS, FAIL hoặc NOT VERIFIED cùng bằng chứng quan sát. Các bước dưới đây không được coi là đã chạy chỉ vì build thành công.

## UAT-01 Tenant data isolation

- [ ] Chọn persona Lê Quang Huy tại ABC Retail.
- [ ] Tạo Purpose nháp có code `MT1-RETAIL-ONLY`.
- [ ] Chuyển sang ABC Finance bằng Tenant Switcher.
- [ ] Xác nhận `MT1-RETAIL-ONLY` không xuất hiện.
- [ ] Chuyển lại ABC Retail; xác nhận bản nháp vẫn tồn tại.
- Kết quả mong đợi: dữ liệu không xuất hiện ở tenant khác và không bị mất sau khi quay lại.

## UAT-02 Same code in different tenants

- [ ] Mở Consent tại ABC Retail, ghi nhận nội dung `CS-MKT-EMAIL`.
- [ ] Mở cùng code tại ABC Finance và sửa bản nháp hoặc revision.
- [ ] Quay lại Retail; xác nhận nội dung Retail không thay đổi.
- Kết quả mong đợi: business code giống nhau nhưng object state độc lập.

## UAT-03 Membership và role isolation

- [ ] Với Lê Quang Huy tại Retail, xác nhận role là Nhân viên.
- [ ] Chuyển sang Finance; xác nhận cùng user có role Admin.
- [ ] Xác nhận menu/action thay đổi theo permission matrix Finance.
- [ ] Tại Retail chọn Trần Hoàng Long, chuyển Health; xác nhận role Nhân viên.
- Kết quả mong đợi: role không được kế thừa giữa tenant.

## UAT-04 Permission matrix isolation

- [ ] Tại Finance với Admin, bật một quyền approve cho Admin.
- [ ] Chuyển Retail bằng user có membership phù hợp.
- [ ] Xác nhận ô permission tương ứng tại Retail vẫn là giá trị cũ.
- [ ] Quay lại Finance; xác nhận thay đổi vẫn còn.

## UAT-05 Approval isolation

- [ ] Staff tại Retail tạo và gửi duyệt Rule revision.
- [ ] Chuyển Finance; mở Notification Center.
- [ ] Xác nhận request Retail không xuất hiện.
- [ ] Quay lại Retail, đổi persona sang DPO và approve.
- [ ] Xác nhận active Rule chỉ thay đổi trong Retail.

## UAT-06 Maker-checker

- [ ] Tạo request bằng persona có nhiều role tại Health.
- [ ] Đổi role hiệu lực nhưng giữ nguyên persona, thử approve.
- [ ] Xác nhận bị từ chối do cùng người gửi.
- [ ] Đổi sang DPO khác trong Health và approve.
- Kết quả mong đợi: role switch không bypass maker-checker.

## UAT-07 Notification và Audit isolation

- [ ] Tạo approval notification và một audit entry tại Retail.
- [ ] Chuyển Finance; xác nhận bell count, Notification Center và Audit không chứa entry Retail.
- [ ] Quay lại Retail; xác nhận dữ liệu còn nguyên.

## UAT-08 Simulator và subject isolation

- [ ] Tại Retail chọn subject `KH0012308` và Accept một consent.
- [ ] Ghi lại event/record/evidence mới.
- [ ] Chuyển Finance; tra cùng `KH0012308`.
- [ ] Xác nhận event vừa tạo tại Retail không xuất hiện.
- [ ] Tạo quyết định khác tại Finance; quay lại Retail và xác nhận hai lịch sử độc lập.

## UAT-09 Cross-tenant stale references

- [ ] Mở Banner detail hoặc Record detail tại Retail.
- [ ] Chuyển tenant từ header.
- [ ] Xác nhận route được đưa về list an toàn.
- [ ] Mở approval dialog tại Retail rồi chuyển tenant.
- [ ] Xác nhận dialog đóng và request cũ không thể approve.
- [ ] Bắt đầu Guided Demo tại Retail rồi chuyển tenant.
- [ ] Xác nhận progress được reset, domain data không bị xóa.

## UAT-10 Application và Property ownership

- [ ] Mở Integrations, Rules/Matrix, Banner và Simulator tại từng tenant.
- [ ] Xác nhận Application/Property hiển thị đúng tên tenant hiện hành.
- [ ] Thử tạo Banner với Property hiện hành.
- [ ] Xác nhận không thể dùng Property không thuộc active workspace qua store action.

## UAT-11 Rule và Matrix regression

- [ ] Staff tạo draft, submit Rule; DPO return với lý do ít nhất 10 ký tự; Staff sửa và resubmit; DPO approve.
- [ ] Lặp lại với Matrix.
- [ ] Trong khi pending, xác nhận active version cũ còn hiệu lực.
- [ ] Xác nhận version history, notification và audit quan sát được trong đúng tenant.

## UAT-12 Prompt 03 regression

- [ ] Chạy lần lượt sáu Guided Demo scenarios trong Retail.
- [ ] Kiểm tra Accept, Reject, Withdraw, Re-consent, Sensitive Consent, CMP Unavailable.
- [ ] Xác nhận Records/Evidence/Dashboard thay đổi từ cùng active workspace.

## Kết quả thực thi hiện tại

| Kiểm tra | Trạng thái | Bằng chứng |
|---|---|---|
| TypeScript và production build | VERIFIED | `npm.cmd run build` thành công ngày 2026-10-28 |
| ESLint | VERIFIED WITH WARNINGS | 0 error, 12 warning Fast Refresh có sẵn |
| Dev server | VERIFIED | HTTP 200 tại `http://127.0.0.1:5173/` |
| Browser walkthrough UAT-01..12 | NOT VERIFIED | Browser automation không khả dụng trong môi trường chạy hiện tại |

