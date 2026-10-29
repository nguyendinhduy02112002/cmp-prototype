import { LayoutDashboard, Bell, Target, FileCheck2, FileText, PanelBottom, GitBranch, Database, ShieldCheck, ClipboardPen, Upload, PlayCircle, UserCheck, Users, ScrollText, Plug, Settings, AppWindow, type LucideIcon } from "lucide-react"
import type { Mod } from "@/lib/perm"

export interface NavItem { title: string; desc: string; url: string; icon: LucideIcon; mod: Mod; count?: "approvals" | "alerts" | "imports"; tag?: string }
/** Thanh bên 4 nhóm theo SRS-IF-08 */
export const NAV: { label: string; items: NavItem[] }[] = [
  { label: "Tổng quan", items: [
    { title: "Dashboard", desc: "Tổng quan quyết định và xu hướng consent", url: "/dashboard", icon: LayoutDashboard, mod: "dash" },
    { title: "Trung tâm thông báo", desc: "Việc chờ duyệt, kết quả và cảnh báo", url: "/notifications", icon: Bell, mod: "notif", count: "approvals" },
  ] },
  { label: "Cấu hình", items: [
    { title: "Mục đích xử lý & dữ liệu", desc: "Doanh nghiệp xử lý dữ liệu để làm gì", url: "/purposes", icon: Target, mod: "setup" },
    { title: "Loại đồng ý (Consent)", desc: "Lựa chọn đồng ý cần thu thập", url: "/consents", icon: FileCheck2, mod: "setup" },
    { title: "Nội dung thông báo", desc: "Nội dung cho chủ thể dữ liệu theo phiên bản", url: "/notices", icon: FileText, mod: "setup" },
    { title: "Giao diện thu thập", desc: "Banner cookie và popup consent", url: "/banners", icon: PanelBottom, mod: "banner" },
    { title: "Quy tắc xin lại & phụ thuộc", desc: "Khi nào xin lại và chức năng nào bị chặn", url: "/rules", icon: GitBranch, mod: "setup" },
  ] },
  { label: "Vận hành", items: [
    { title: "Trạng thái đồng ý", desc: "Trạng thái hiện tại của khách hàng", url: "/records", icon: Database, mod: "records" },
    { title: "Lịch sử & bằng chứng", desc: "Chuỗi quyết định và bằng chứng liên quan", url: "/evidence", icon: ShieldCheck, mod: "records" },
    { title: "Ghi nhận ngoại tuyến", desc: "Consent từ SMS, ghi âm hoặc văn bản", url: "/offline", icon: ClipboardPen, mod: "offline" },
    { title: "Import kế thừa", desc: "Di trú consent được thu trước CMP", url: "/import", icon: Upload, mod: "import", count: "imports" },
    { title: "Mô phỏng trải nghiệm", desc: "Đóng vai khách hàng và ứng dụng tích hợp", url: "/simulator", icon: PlayCircle, mod: "sim" },
    { title: "Yêu cầu quyền", desc: "Yêu cầu xem, sửa, xóa và các quyền khác", url: "/rights", icon: UserCheck, mod: "rights", tag: "Mô phỏng" },
  ] },
  { label: "Hệ thống", items: [
    { title: "Người dùng & phân quyền", desc: "Vai trò và quyền theo nhóm chức năng", url: "/users", icon: Users, mod: "users" },
    { title: "Nhật ký kiểm toán", desc: "Ai đã thực hiện thay đổi nào", url: "/audit", icon: ScrollText, mod: "audit" },
    { title: "Ứng dụng", desc: "Đăng ký và quản lý Application của tenant", url: "/applications", icon: AppWindow, mod: "integ" },
    { title: "Tích hợp & sự kiện", desc: "Event, connector và cookie scan", url: "/integrations", icon: Plug, mod: "integ", tag: "Mô phỏng" },
    { title: "Cài đặt tenant", desc: "Hồ sơ tổ chức, tùy chọn chung và liên hệ quyền riêng tư", url: "/settings", icon: Settings, mod: "settings" },
  ] },
]
export const ROUTE_MOD: [RegExp, Mod][] = NAV.flatMap((g) => g.items.map((i) => [new RegExp("^" + i.url + "(/|$)"), i.mod] as [RegExp, Mod])).concat([[/^\/evidence\/package\//, "evidence"]])
