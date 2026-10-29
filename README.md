# CMP Console Prototype

Prototype giao diện CMP Console (Consent & Privacy Management Platform) theo **SRS CMP v1.3**,
dựng trên [shadcn-dashboard-landing-template](https://github.com/shadcnstore/shadcn-dashboard-landing-template) (vite-version, MIT).
Dữ liệu minh họa của tổ chức giả định ABC Retail; không có backend.

## Chạy
```bash
pnpm install
pnpm dev                 # http://localhost:5173/#/dashboard
SINGLE=1 pnpm build      # dist/index.html – một tệp để chia sẻ
```

## Cấu trúc
- `src/lib` – kiểu dữ liệu, dữ liệu mẫu, ma trận quyền (SRS 4.2), store zustand (phê duyệt, evidence)
- `src/components/cmp` – component CMP: nhãn trạng thái, hộp thoại duyệt, so sánh phiên bản, chuông thông báo, banner/popup
- `src/app` – 20 màn hình theo sitemap Bước 4 (Tổng quan, Cấu hình, Vận hành, Hệ thống)

Đổi vai trò ở header (Admin, DPO, Nhân viên) để xem phân quyền. Mã OTP minh họa ở Preference Center: 123456.
