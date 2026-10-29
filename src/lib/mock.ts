/**
 * Dữ liệu minh họa cho prototype – tổ chức ABC Retail.
 * Mã đối tượng theo BR-UC01-01 / BR-UC02-01: chữ in hoa, số, dấu gạch ngang.
 * Chủ thể chỉ có mã giả danh KHnnnnnnn (BR-UC36-04).
 */
import type {
  AuditEntry, Banner, BannerCfg, Consent, ConsentEvent, DataCatalogVersion, DataItem, DependencyMatrix,
  ImportBatch, NoticeContent, NoticeVersion, Notice2User, OpsAlert, Purpose, RightsRequest, User,
} from "./types"
import { fakeHash, rng } from "./fmt"

export const ORG = "ABC Retail"
export const PROPERTIES = ["abcmart.vn", "member.abcmart.vn", "Ứng dụng ABC Mart"]
export const APPS = [
  { id: "app_7Q2K9M", name: "Website abcmart.vn", property: "abcmart.vn" },
  { id: "app_3HX81P", name: "Cổng thành viên member.abcmart.vn", property: "member.abcmart.vn" },
  { id: "app_5MB20R", name: "Ứng dụng ABC Mart (iOS/Android)", property: "Ứng dụng ABC Mart" },
]
export const CHANNELS = ["Web", "App", "Form nghiệp vụ", "Ngoại tuyến"]
export const PERSONA: Record<string, string> = { Admin: "Trần Hoàng Long", DPO: "Nguyễn Minh Thu", "Nhân viên": "Lê Quang Huy" }

const ITEMS: DataItem[] = [
  ["D-HOTEN", "Họ và tên", "Cơ bản"], ["D-NGAYSINH", "Ngày sinh", "Cơ bản"], ["D-GIOITINH", "Giới tính", "Cơ bản"],
  ["D-SDT", "Số điện thoại", "Cơ bản"], ["D-EMAIL", "Địa chỉ email", "Cơ bản"], ["D-DIACHI", "Địa chỉ liên hệ", "Cơ bản"],
  ["D-CCCD", "Số định danh cá nhân, CCCD", "Cơ bản"], ["D-MUAHANG", "Lịch sử mua hàng", "Cơ bản"], ["D-DUYETWEB", "Hành vi duyệt web, ứng dụng", "Cơ bản"],
  ["D-COOKIE", "Định danh cookie, thiết bị", "Cơ bản"], ["D-TAIKHOAN", "Tài khoản thành viên", "Cơ bản"],
  ["D-SUCKHOE", "Tình trạng sức khỏe", "Nhạy cảm"], ["D-SINHTRAC", "Dữ liệu sinh trắc học (ảnh khuôn mặt)", "Nhạy cảm"],
  ["D-VITRI", "Vị trí xác định qua dịch vụ định vị", "Nhạy cảm"], ["D-TAICHINH", "Thông tin tài khoản ngân hàng, thẻ", "Nhạy cảm"],
  ["D-CHINHTRI", "Quan điểm chính trị, tôn giáo", "Nhạy cảm"],
].map(([code, name, group]) => ({ code, name, group: group as DataItem["group"] }))

export const DATA_CATALOG: DataCatalogVersion[] = [
  { v: "v2", at: "2026-07-01T03:00:00Z", by: "Nguyễn Minh Thu", basis: "Luật 91/2025/QH15, NĐ 356/2025/NĐ-CP [KC]", items: ITEMS },
  { v: "v1", at: "2026-03-15T03:00:00Z", by: "Nguyễn Minh Thu", basis: "NĐ 13/2023/NĐ-CP", items: ITEMS.filter((i) => i.code !== "D-CHINHTRI") },
]
export const itemByCode = (c: string) => ITEMS.find((i) => i.code === c)

const h = (at: string, who: string, act: string, note?: string) => ({ at, who, act, note })
function P(o: Partial<Purpose> & Pick<Purpose, "code" | "name" | "status">): Purpose {
  const at = o.updatedAt || "2026-06-01T03:00:00Z"
  return {
    desc: "", items: [], scope: "", legalBasis: "Đồng ý của chủ thể dữ liệu", retention: "Đến khi rút lại đồng ý", share: false, recipients: [], child: false,
    everActive: ["Hoạt động", "Chờ duyệt ngừng", "Ngừng sử dụng"].includes(o.status), history: [], versions: [], updatedAt: at, ...o,
  } as Purpose
}
export const PURPOSES: Purpose[] = [
  P({ code: "MEMBER-CORE", name: "Quản lý tài khoản thành viên", status: "Hoạt động", legalBasis: "Thực hiện hợp đồng", desc: "Tạo và duy trì tài khoản thành viên, tích điểm, chăm sóc khách hàng.", items: ["D-HOTEN", "D-SDT", "D-EMAIL", "D-NGAYSINH", "D-TAIKHOAN"], scope: "Thu thập, lưu trữ, sử dụng trong hệ thống thành viên", retention: "Trong thời gian là thành viên + 2 năm", updatedAt: "2026-05-20T03:00:00Z", history: [h("2026-05-20T03:00:00Z", "Nguyễn Minh Thu", "Phê duyệt", "Tạo mới")] }),
  P({ code: "MKT-EMAIL", name: "Gửi ưu đãi qua email", status: "Hoạt động", desc: "Gửi thông tin khuyến mãi, ưu đãi thành viên qua email.", items: ["D-HOTEN", "D-EMAIL", "D-MUAHANG"], scope: "Sử dụng để gửi email tiếp thị", updatedAt: "2026-06-10T03:00:00Z", history: [h("2026-06-10T03:00:00Z", "Nguyễn Minh Thu", "Phê duyệt", "Tạo mới")] }),
  P({ code: "MKT-PERSONAL", name: "Gợi ý sản phẩm cá nhân hóa", status: "Hoạt động", desc: "Phân tích lịch sử mua hàng và hành vi duyệt để gợi ý sản phẩm phù hợp.", items: ["D-MUAHANG", "D-DUYETWEB", "D-COOKIE"], scope: "Phân tích, lập hồ sơ sở thích", share: true, recipients: ["Đối tác quảng cáo Meta, TikTok (xử lý thay)"], updatedAt: "2026-08-28T03:00:00Z", history: [h("2026-08-28T03:00:00Z", "Nguyễn Minh Thu", "Phê duyệt", "Thêm bên nhận")] }),
  P({ code: "ANALYTICS", name: "Đo lường truy cập website", status: "Hoạt động", desc: "Thống kê lượt truy cập, hiệu quả trang để cải thiện website.", items: ["D-COOKIE", "D-DUYETWEB"], scope: "Thống kê tổng hợp", share: true, recipients: ["Google Analytics (bên xử lý)"], retention: "13 tháng", updatedAt: "2026-06-12T03:00:00Z" }),
  P({ code: "EKYC", name: "Xác thực danh tính mở ví thành viên", status: "Hoạt động", desc: "Đối chiếu ảnh khuôn mặt với giấy tờ để mở Ví ABC.", items: ["D-HOTEN", "D-CCCD", "D-SINHTRAC"], scope: "Thu thập, đối chiếu một lần; lưu kết quả xác thực", retention: "5 năm theo quy định thanh toán [KC]", updatedAt: "2026-09-02T03:00:00Z" }),
  P({ code: "PARTNER-INS", name: "Chia sẻ đối tác bảo hiểm", status: "Chờ duyệt", desc: "Chia sẻ thông tin liên hệ cho đối tác để tư vấn bảo hiểm sức khỏe.", items: ["D-HOTEN", "D-SDT", "D-NGAYSINH"], scope: "Chia sẻ cho bên thứ ba", share: true, recipients: ["Công ty Bảo hiểm XYZ"], updatedAt: "2026-10-26T02:10:00Z", req: { action: "Tạo mới", by: "Phạm Minh", byRole: "Nhân viên", at: "2026-10-26T02:10:00Z" }, history: [h("2026-10-26T02:10:00Z", "Phạm Minh", "Gửi duyệt")] }),
  P({ code: "NEARBY-STORE", name: "Gợi ý cửa hàng gần bạn", status: "Nháp", desc: "Dùng vị trí để gợi ý cửa hàng gần nhất trên ứng dụng.", items: ["D-VITRI"], scope: "Sử dụng tức thời, không lưu lịch sử vị trí", updatedAt: "2026-10-24T10:45:00Z", history: [h("2026-10-24T10:45:00Z", "Lê Quang Huy", "Lưu nháp")] }),
  P({ code: "HEALTH-ADVICE", name: "Tư vấn sản phẩm chăm sóc sức khỏe", status: "Bị trả lại", desc: "Tư vấn thực phẩm chức năng theo tình trạng sức khỏe khách khai báo.", items: ["D-HOTEN", "D-SUCKHOE"], scope: "Sử dụng để tư vấn", returnNote: "Cần nêu rõ thời hạn xử lý và không chia sẻ cho bên thứ ba.", updatedAt: "2026-10-22T08:00:00Z", history: [h("2026-10-21T04:00:00Z", "Lê Quang Huy", "Gửi duyệt"), h("2026-10-22T08:00:00Z", "Nguyễn Minh Thu", "Trả lại", "Cần nêu rõ thời hạn xử lý và không chia sẻ cho bên thứ ba.")] }),
  P({ code: "MKT-SMS-OLD", name: "Tin nhắn SMS khuyến mãi (chương trình cũ)", status: "Ngừng sử dụng", desc: "Chương trình SMS khuyến mãi 2025.", items: ["D-SDT"], updatedAt: "2026-04-01T03:00:00Z" }),
]
PURPOSES.forEach((p) => { if (p.everActive) p.versions = [{ v: 1, at: p.updatedAt, by: "Nguyễn Minh Thu", snap: snapPurpose(p) }] })
export function snapPurpose(p: Purpose): Record<string, unknown> {
  return { "Tên": p.name, "Mô tả": p.desc, "Loại dữ liệu": p.items.map((c) => itemByCode(c)?.name || c), "Phạm vi xử lý": p.scope, "Cơ sở pháp lý": p.legalBasis, "Thời hạn xử lý": p.retention, "Chia sẻ": p.share ? "Có" : "Không", "Bên nhận": p.recipients, "Trẻ em": p.child ? "Có" : "Không" }
}

function Cn(o: Partial<Consent> & Pick<Consent, "code" | "name" | "status" | "purposes" | "kind">): Consent {
  return { channels: ["Web"], apps: ["app_7Q2K9M"], duration: null, everActive: ["Hoạt động", "Chờ duyệt ngừng", "Ngừng sử dụng"].includes(o.status), history: [], versions: [], updatedAt: "2026-06-01T03:00:00Z", ...o } as Consent
}
export const CONSENTS: Consent[] = [
  Cn({ code: "CS-MEMBER-REG", name: "Đăng ký thành viên", status: "Hoạt động", purposes: ["MEMBER-CORE"], kind: "Bắt buộc", channels: ["Web", "App", "Form nghiệp vụ"], apps: ["app_3HX81P", "app_5MB20R"], updatedAt: "2026-05-21T03:00:00Z" }),
  Cn({ code: "CS-MKT-EMAIL", name: "Nhận ưu đãi qua email", status: "Hoạt động", purposes: ["MKT-EMAIL"], kind: "Tùy chọn", channels: ["Web", "App", "Form nghiệp vụ", "Ngoại tuyến"], apps: ["app_3HX81P", "app_5MB20R"], duration: 24, updatedAt: "2026-06-11T03:00:00Z" }),
  Cn({ code: "CS-MKT-PERSONAL", name: "Gợi ý sản phẩm cá nhân hóa", status: "Hoạt động", purposes: ["MKT-PERSONAL"], kind: "Tùy chọn", channels: ["Web", "App"], apps: ["app_7Q2K9M", "app_3HX81P", "app_5MB20R"], duration: 12, updatedAt: "2026-08-29T03:00:00Z" }),
  Cn({ code: "CS-ANALYTICS", name: "Cookie đo lường truy cập", status: "Hoạt động", purposes: ["ANALYTICS"], kind: "Tùy chọn", channels: ["Web"], apps: ["app_7Q2K9M", "app_3HX81P"], duration: 12, updatedAt: "2026-06-12T03:00:00Z" }),
  Cn({ code: "CS-EKYC", name: "Xác thực danh tính mở Ví ABC", status: "Hoạt động", purposes: ["EKYC"], kind: "Tùy chọn", channels: ["Form nghiệp vụ", "App"], apps: ["app_3HX81P", "app_5MB20R"], updatedAt: "2026-09-03T03:00:00Z" }),
  Cn({ code: "CS-MKT-ZALO", name: "Nhận ưu đãi qua Zalo OA", status: "Chờ duyệt", purposes: ["MKT-EMAIL"], kind: "Tùy chọn", channels: ["App"], apps: ["app_5MB20R"], duration: 24, updatedAt: "2026-10-27T03:20:00Z", req: { action: "Tạo mới", by: "Lê Quang Huy", byRole: "Nhân viên", at: "2026-10-27T03:20:00Z" }, history: [h("2026-10-27T03:20:00Z", "Lê Quang Huy", "Gửi duyệt")] }),
  Cn({ code: "CS-NEARBY", name: "Gợi ý cửa hàng gần bạn", status: "Nháp", purposes: [], kind: "Tùy chọn", channels: ["App"], apps: ["app_5MB20R"], updatedAt: "2026-10-24T10:50:00Z" }),
  Cn({ code: "CS-MKT-SMS-OLD", name: "SMS khuyến mãi 2025", status: "Ngừng sử dụng", purposes: ["MKT-SMS-OLD"], kind: "Tùy chọn", channels: ["Ngoại tuyến"], apps: [], updatedAt: "2026-04-01T03:00:00Z" }),
]
export function snapConsent(c: Consent): Record<string, unknown> {
  return { "Tên": c.name, "Mục đích": c.purposes, "Loại": c.kind, "Kênh": c.channels, "Ứng dụng": c.apps.map((a) => APPS.find((x) => x.id === a)?.name || a), "Thời hạn (tháng)": c.duration ?? "Mặc định [N]" }
}
CONSENTS.forEach((c) => { if (c.everActive) c.versions = [{ v: 1, at: c.updatedAt, by: "Nguyễn Minh Thu", snap: snapConsent(c) }] })

export function buildContent(c: Consent, lang: "vi" | "en"): NoticeContent {
  const ps = c.purposes.map((code) => PURPOSES.find((p) => p.code === code)).filter(Boolean) as Purpose[]
  const items = [...new Set(ps.flatMap((p) => p.items))].map((i) => itemByCode(i)?.name || i)
  const rec = [...new Set(ps.flatMap((p) => p.recipients))]
  if (lang === "en")
    return {
      data: `Personal data: ${items.length} data types as listed in the ABC Retail data catalogue.`,
      purpose: ps.map((p) => p.code).join(", ") + " – see purpose descriptions.",
      parties: `Controller: ABC Retail JSC. ${rec.length ? "Recipients: " + rec.join("; ") + "." : "No third-party sharing."}`,
      rights: "You may access, correct, delete, restrict, object and withdraw consent at any time via the Preference Center.",
    }
  return {
    data: `Dữ liệu cá nhân xử lý: ${items.join(", ")}.`,
    purpose: ps.map((p) => `${p.name}: ${p.desc}`).join(" "),
    parties: `Bên kiểm soát: Công ty Cổ phần ABC Retail. ${rec.length ? "Bên nhận: " + rec.join("; ") + "." : "Không chia sẻ cho bên thứ ba."}`,
    rights: "Bạn có quyền được biết, xem, chỉnh sửa, xóa, hạn chế xử lý, phản đối và rút lại sự đồng ý bất cứ lúc nào tại Trang tùy chọn (Preference Center).",
  }
}
function N(consent: string, v: string, status: NoticeVersion["status"], o: Partial<NoticeVersion> = {}): NoticeVersion {
  const c = CONSENTS.find((x) => x.code === consent)!
  const content = { vi: buildContent(c, "vi"), en: buildContent(c, "en") }
  const base: NoticeVersion = { id: `${consent}|${v}`, consent, v, sum: "Phiên bản đầu", content, status, by: "Phạm Minh", at: "2026-06-01T03:00:00Z", everSent: status !== "Nháp", ...o }
  if (["Published", "Expired", "Đã duyệt – chờ hiệu lực"].includes(status) && !base.hash) base.hash = fakeHash(JSON.stringify(base.content) + v)
  return base
}
export const NOTICES: NoticeVersion[] = [
  N("CS-MEMBER-REG", "v1.0", "Expired", { at: "2026-05-21T03:00:00Z", approvedBy: "Nguyễn Minh Thu", effectiveAt: "2026-05-21T03:00:00Z", material: "Có" }),
  N("CS-MEMBER-REG", "v1.1", "Published", { sum: "Bổ sung quyền rút lại đồng ý", at: "2026-07-02T03:00:00Z", approvedBy: "Nguyễn Minh Thu", effectiveAt: "2026-07-03T00:00:00Z", material: "Không" }),
  N("CS-MKT-EMAIL", "v2.0", "Published", { sum: "Thêm lịch sử mua hàng để cá nhân hóa ưu đãi", at: "2026-06-11T03:00:00Z", approvedBy: "Nguyễn Minh Thu", effectiveAt: "2026-06-12T00:00:00Z", material: "Có" }),
  N("CS-MKT-EMAIL", "v2.1", "Chờ duyệt", { sum: "Sửa câu chữ phần quyền của chủ thể, thêm tiếng Anh", by: "Lê Quang Huy", at: "2026-10-26T09:05:00Z", suggested: "Không", req: { action: "Xuất bản", by: "Lê Quang Huy", byRole: "Nhân viên", at: "2026-10-26T09:05:00Z" } }),
  N("CS-MKT-PERSONAL", "v1.0", "Expired", { at: "2026-06-01T03:00:00Z", approvedBy: "Nguyễn Minh Thu", material: "Có" }),
  N("CS-MKT-PERSONAL", "v1.1", "Published", { sum: "Thêm bên nhận Meta, TikTok", at: "2026-08-29T03:00:00Z", approvedBy: "Nguyễn Minh Thu", effectiveAt: "2026-08-30T00:00:00Z", material: "Có" }),
  N("CS-ANALYTICS", "v1.2", "Published", { sum: "Cập nhật thời hạn cookie 13 tháng", at: "2026-06-12T03:00:00Z", approvedBy: "Nguyễn Minh Thu", effectiveAt: "2026-06-12T05:00:00Z", material: "Không" }),
  N("CS-EKYC", "v1.0", "Published", { at: "2026-09-03T03:00:00Z", approvedBy: "Nguyễn Minh Thu", effectiveAt: "2026-09-03T05:00:00Z", material: "Có" }),
  N("CS-MKT-ZALO", "v1.0", "Nháp", { by: "Lê Quang Huy", at: "2026-10-27T03:25:00Z" }),
]

const CFG = (kind: "consent" | "cookie", o: Partial<BannerCfg> = {}): BannerCfg => ({
  layout: kind === "cookie" ? "bar" : "center",
  title: kind === "cookie" ? { vi: "Chúng tôi tôn trọng quyền riêng tư của bạn", en: "We respect your privacy" } : { vi: "Đồng ý xử lý dữ liệu cá nhân", en: "Consent to personal data processing" },
  desc: kind === "cookie" ? { vi: "ABC Mart dùng cookie để website hoạt động, đo lượt truy cập và gợi ý sản phẩm phù hợp. Bạn có thể chấp nhận, từ chối hoặc chọn từng nhóm.", en: "ABC Mart uses cookies to run the site, measure traffic and personalise products. You can accept, reject or choose each group." } : { vi: "ABC Mart cần thông tin dưới đây để cung cấp dịch vụ. Các mục tùy chọn bạn có thể đổi ý bất cứ lúc nào.", en: "ABC Mart needs the information below to provide the service. You can change optional items at any time." },
  reject: kind === "cookie" ? { vi: "Từ chối tất cả", en: "Reject all" } : { vi: "Từ chối", en: "Reject" },
  custom: kind === "cookie" ? { vi: "Tùy chỉnh", en: "Customise" } : { vi: "Xem chi tiết", en: "Details" },
  accept: kind === "cookie" ? { vi: "Chấp nhận tất cả", en: "Accept all" } : { vi: "Đồng ý", en: "Accept" },
  link: { vi: "Chính sách quyền riêng tư", en: "Privacy policy" },
  color: "#2457C5", textColor: "#FFFFFF", radius: 8, logo: true, font: "Be Vietnam Pro", consents: [], langs: ["vi", "en"], ...o,
})
export const LAYOUTS: Record<string, string> = { center: "Hộp giữa màn hình", inline: "Nhúng trong form", sheet: "Trượt từ dưới (di động)", bar: "Thanh dưới trang", corner: "Thẻ góc trái dưới" }
export const LAYOUT_BY_KIND = { consent: ["center", "inline", "sheet"], cookie: ["bar", "corner", "center"] }
export const FONTS = ["Be Vietnam Pro", "Roboto", "Noto Sans", "Inter"]
export const BANNERS: Banner[] = [
  { code: "BN-001", name: "Popup đăng ký thành viên", kind: "consent", site: "member.abcmart.vn", versions: [
    { v: 2, status: "Hoạt động", at: "2026-10-02T02:40:00Z", by: "Lê Quang Huy", ap: "Nguyễn Minh Thu", note: "Thêm mục gợi ý cá nhân hóa", cfg: CFG("consent", { consents: ["CS-MEMBER-REG", "CS-MKT-EMAIL", "CS-MKT-PERSONAL"] }) },
    { v: 1, status: "Thay thế", at: "2026-07-01T03:10:00Z", by: "Phạm Minh", ap: "Nguyễn Minh Thu", note: "Tạo mới", cfg: CFG("consent", { consents: ["CS-MEMBER-REG", "CS-MKT-EMAIL"], title: { vi: "Đăng ký thành viên", en: "Membership sign-up" } }) }] },
  { code: "BN-002", name: "Form mở ví thành viên (eKYC)", kind: "consent", site: "member.abcmart.vn", versions: [
    { v: 1, status: "Hoạt động", at: "2026-09-03T04:30:00Z", by: "Phạm Minh", ap: "Nguyễn Minh Thu", note: "Tạo mới", cfg: CFG("consent", { layout: "inline", consents: ["CS-EKYC"], title: { vi: "Xác thực danh tính để mở Ví ABC", en: "Verify your identity to open ABC Wallet" } }) }] },
  { code: "BN-003", name: "Hỏi quyền vị trí trên ứng dụng", kind: "consent", site: "Ứng dụng ABC Mart", versions: [
    { v: 1, status: "Nháp", at: "2026-10-24T10:45:00Z", by: "Lê Quang Huy", note: "Bản nháp", cfg: CFG("consent", { layout: "sheet", consents: [], title: { vi: "Gợi ý cửa hàng gần bạn", en: "Stores near you" } }) }] },
  { code: "BN-004", name: "Popup chia sẻ đối tác bảo hiểm", kind: "consent", site: "abcmart.vn", versions: [
    { v: 1, status: "Bị trả lại", at: "2026-10-22T02:00:00Z", by: "Phạm Minh", ap: "Nguyễn Minh Thu", note: "Tạo mới", retNote: "Nút Từ chối có màu nhạt hơn nút Đồng ý, vi phạm BR-UC07-02.", cfg: CFG("consent", { color: "#7FA3E8", textColor: "#FFFFFF", consents: [] }) }] },
  { code: "CK-001", name: "Banner cookie abcmart.vn", kind: "cookie", site: "abcmart.vn", versions: [
    { v: 5, status: "Chờ duyệt", at: "2026-10-26T02:15:00Z", by: "Lê Quang Huy", note: "Đổi tiêu đề và nhãn nút", cfg: CFG("cookie", { consents: ["CS-ANALYTICS", "CS-MKT-PERSONAL"] }), req: { action: "Xuất bản", by: "Lê Quang Huy", byRole: "Nhân viên", at: "2026-10-26T02:15:00Z" } },
    { v: 4, status: "Hoạt động", at: "2026-08-28T03:02:00Z", by: "Lê Quang Huy", ap: "Nguyễn Minh Thu", note: "Thêm nhóm cá nhân hóa", cfg: CFG("cookie", { consents: ["CS-ANALYTICS", "CS-MKT-PERSONAL"], title: { vi: "Website sử dụng cookie", en: "This website uses cookies" }, custom: { vi: "Cài đặt", en: "Settings" } }) },
    { v: 3, status: "Thay thế", at: "2026-06-12T07:30:00Z", by: "Phạm Minh", ap: "Nguyễn Minh Thu", note: "Tạo mới", cfg: CFG("cookie", { consents: ["CS-ANALYTICS"], title: { vi: "Website sử dụng cookie", en: "This website uses cookies" } }) }] },
  { code: "CK-002", name: "Banner cookie member.abcmart.vn", kind: "cookie", site: "member.abcmart.vn", versions: [
    { v: 1, status: "Hoạt động", at: "2026-09-05T04:00:00Z", by: "Phạm Minh", ap: "Nguyễn Minh Thu", note: "Tạo mới", cfg: CFG("cookie", { layout: "corner", consents: ["CS-ANALYTICS"] }) }] },
]
export const COOKIES = [
  ["cmp_consent_id", "abcmart.vn", "CMP", "12 tháng", "Thiết yếu"], ["session_id", "abcmart.vn", "ABC Mart", "Phiên", "Thiết yếu"],
  ["_ga", ".abcmart.vn", "Google Analytics", "13 tháng", "CS-ANALYTICS"], ["_clck", ".abcmart.vn", "Microsoft Clarity", "12 tháng", "CS-ANALYTICS"],
  ["_fbp", ".abcmart.vn", "Meta Pixel", "3 tháng", "CS-MKT-PERSONAL"], ["_ttp", ".abcmart.vn", "TikTok", "13 tháng", "CS-MKT-PERSONAL"],
].map(([name, dom, prov, ttl, grp]) => ({ name, dom, prov, ttl, grp }))

export const USERS: User[] = [
  { id: 1, name: "Trần Hoàng Long", email: "long.tran@abc-retail.vn", roles: ["Admin"], dept: "Công nghệ", scope: "Toàn tổ chức", status: "Hoạt động", last: "2026-10-28T01:30:00Z" },
  { id: 2, name: "Nguyễn Minh Thu", email: "thu.nguyen@abc-retail.vn", roles: ["DPO"], dept: "Ban Bảo vệ dữ liệu", scope: "Toàn tổ chức", status: "Hoạt động", last: "2026-10-28T01:05:00Z" },
  { id: 3, name: "Lê Quang Huy", email: "huy.le@abc-retail.vn", roles: ["Nhân viên"], dept: "Marketing", scope: "abcmart.vn", status: "Hoạt động", last: "2026-10-27T10:20:00Z" },
  { id: 4, name: "Phạm Minh", email: "minh.pham@abc-retail.vn", roles: ["Nhân viên"], dept: "Sản phẩm số", scope: "member.abcmart.vn", status: "Hoạt động", last: "2026-10-26T04:40:00Z" },
  { id: 5, name: "Phạm Thu Trang", email: "trang.pham@abc-retail.vn", roles: ["Nhân viên", "DPO"], dept: "Chăm sóc khách hàng", scope: "Toàn tổ chức", status: "Hoạt động", last: "2026-10-28T01:15:00Z" },
  { id: 6, name: "Vũ Ngọc Ánh", email: "anh.vu@abc-retail.vn", roles: ["DPO"], dept: "Pháp chế", scope: "Toàn tổ chức", status: "Chờ kích hoạt", last: "" },
]

// ---------------- Sự kiện consent (evidence) ----------------
const UAS = ["Chrome 130 · Windows 11", "Safari 18 · iOS 18", "Chrome 130 · Android 15", "Edge 130 · Windows 11", "ABC Mart App 5.2 · iOS 18", "ABC Mart App 5.2 · Android 15"]
export const TODAY = new Date("2026-10-28T03:00:00Z")
const r = rng(20261028)
const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
let evSeq = 1
const mkReceipt = (decision: "ACCEPTED" | "REJECTED", app: string) => ({ jti: "rcp_" + fakeHash("j" + evSeq).slice(0, 16), kid: "cmp-2026-07", alg: "ES256", enc: "RSA-OAEP-256 / A256GCM", aud: app, exp: "[N] giây (OI-04)", decision })
function ev(o: Partial<ConsentEvent> & Pick<ConsentEvent, "subject" | "consent" | "decision" | "ts">): ConsentEvent {
  const id = `EV-${String(100000 + evSeq++)}`
  const app = o.app || "app_3HX81P"
  const notice = NOTICES.filter((n) => n.consent === o.consent && (n.status === "Published" || n.status === "Expired")).sort((a, b) => (a.effectiveAt || a.at) < (b.effectiveAt || b.at) ? 1 : -1).find((n) => (n.effectiveAt || n.at) <= o.ts) || NOTICES.find((n) => n.consent === o.consent)
  const e: ConsentEvent = {
    id, version: notice?.v || "v1.0", channel: "Web", app, property: APPS.find((a) => a.id === app)?.property || "abcmart.vn", source: "Trực tuyến",
    hash: notice?.hash || fakeHash(o.consent), tx: "tx_" + fakeHash(id).slice(0, 12), ip: `113.161.${Math.floor(r() * 250)}.${Math.floor(r() * 250)}`, ua: pick(UAS), ...o,
  }
  if (!o.receipt && (e.decision === "ACCEPTED" || e.decision === "REJECTED") && e.source !== "Liên kết từ cookie" && e.consent !== "CS-ANALYTICS" && e.source !== "Legacy" && e.source !== "Ngoại tuyến") e.receipt = mkReceipt(e.decision, app)
  return e
}
const iso = (daysAgo: number, hour = 9) => {
  const d = new Date(TODAY.getTime() - daysAgo * 86400000)
  d.setUTCHours(hour - 7 + Math.floor(r() * 9), Math.floor(r() * 60), Math.floor(r() * 60))
  return d.toISOString()
}
export const SUBJECTS: string[] = []
export const EVENTS: ConsentEvent[] = []
for (let i = 0; i < 160; i++) {
  const s = "KH" + String(12301 + i * 7).padStart(7, "0")
  SUBJECTS.push(s)
  const d0 = Math.floor(r() * 88) + 1
  const app = r() < 0.6 ? "app_3HX81P" : "app_5MB20R"
  const ch = app === "app_5MB20R" ? "App" : "Form nghiệp vụ"
  const anon = r() < 0.45 ? "ck_" + fakeHash(s).slice(0, 4) + "…" + fakeHash(s).slice(-2) : undefined
  if (anon) {
    const dA = Math.min(89, d0 + Math.floor(r() * 5) + 1)
    EVENTS.push(ev({ subject: s, consent: "CS-ANALYTICS", decision: r() < 0.62 ? "ACCEPTED" : "REJECTED", ts: iso(dA), app: "app_7Q2K9M", channel: "Web", source: "Liên kết từ cookie", linkedFrom: anon }))
  }
  EVENTS.push(ev({ subject: s, consent: "CS-MEMBER-REG", decision: "ACCEPTED", ts: iso(d0), app, channel: ch }))
  const em = r() < 0.71 ? "ACCEPTED" : "REJECTED"
  EVENTS.push(ev({ subject: s, consent: "CS-MKT-EMAIL", decision: em, ts: iso(d0), app, channel: ch }))
  if (em === "ACCEPTED" && r() < 0.12 && d0 > 3) EVENTS.push(ev({ subject: s, consent: "CS-MKT-EMAIL", decision: "WITHDRAWN", ts: iso(Math.floor(d0 / 2)), app: "app_3HX81P", channel: "Preference Center", source: "Preference Center" }))
  if (r() < 0.8) {
    const dp = r() < 0.15 && d0 > 60 ? d0 : d0
    EVENTS.push(ev({ subject: s, consent: "CS-MKT-PERSONAL", decision: r() < 0.56 ? "ACCEPTED" : "REJECTED", ts: iso(dp), app, channel: ch }))
  }
  if (r() < 0.25 && d0 < 55) EVENTS.push(ev({ subject: s, consent: "CS-EKYC", decision: r() < 0.83 ? "ACCEPTED" : "REJECTED", ts: iso(d0), app, channel: "Form nghiệp vụ", sensitive: true, explicitConfirm: true }))
}
// Cookie banner ẩn danh (không liên kết)
for (let i = 0; i < 220; i++) {
  const ck = "ck_" + fakeHash("anon" + i).slice(0, 4) + "…" + fakeHash("anon" + i).slice(-2)
  EVENTS.push(ev({ subject: ck, consent: "CS-ANALYTICS", decision: r() < 0.6 ? "ACCEPTED" : "REJECTED", ts: iso(Math.floor(r() * 89) + 1), app: "app_7Q2K9M", channel: "Web" }))
}
// Legacy (UC-09) và ngoại tuyến (UC-17)
SUBJECTS.slice(0, 18).forEach((s, i) => {
  EVENTS.push(ev({ subject: s, consent: "CS-MKT-EMAIL", decision: "ACCEPTED", ts: `2025-0${(i % 9) + 1}-1${i % 9}T03:00:00Z`, channel: "Import", app: "—", property: "member.abcmart.vn", source: "Legacy", legacyBatch: "LOT-2026-001", legacyRisk: i % 5 === 0, version: "Legacy", hash: fakeHash("legacy" + s) }))
})
const OFF = [
  { s: SUBJECTS[3], c: "CS-MKT-EMAIL", k: "Văn bản, chữ ký" as const, f: "phieu-dang-ky-cua-hang-Q3.pdf", d: 6 },
  { s: SUBJECTS[11], c: "CS-MKT-EMAIL", k: "Ghi âm" as const, f: "cuoc-goi-CSKH-0912.m4a", d: 4 },
  { s: SUBJECTS[25], c: "CS-MKT-PERSONAL", k: "SMS" as const, f: "sms-cu-phap-DY-PERSONAL.png", d: 2 },
  { s: SUBJECTS[40], c: "CS-MEMBER-REG", k: "Văn bản, chữ ký" as const, f: "phieu-thanh-vien-quay-12.pdf", d: 1 },
]
OFF.forEach((o, i) => {
  const ts = iso(o.d, 15)
  EVENTS.push(ev({ subject: o.s, consent: o.c, decision: "ACCEPTED", ts, channel: "Ngoại tuyến", app: "—", property: "Cửa hàng, tổng đài", source: "Ngoại tuyến", ip: "—", ua: "Nhập tại CMP Console", offline: { id: `OFF-${String(226 + i).padStart(6, "0")}`, kind: o.k, actualDate: new Date(new Date(ts).getTime() - 86400000).toISOString().slice(0, 10), enteredBy: "Phạm Thu Trang", files: [{ name: o.f, size: `${(0.4 + i * 0.7).toFixed(1)} MB`, hash: fakeHash(o.f) }] } }))
})
EVENTS.sort((a, b) => (a.ts < b.ts ? 1 : -1))

export const AUDIT: AuditEntry[] = [
  { at: "2026-10-28T01:05:00Z", who: "Nguyễn Minh Thu", role: "DPO", act: "Đăng nhập", obj: "Console", res: "ok", det: "SSO + MFA" },
  { at: "2026-10-27T03:20:00Z", who: "Lê Quang Huy", role: "Nhân viên", act: "Gửi duyệt", obj: "Consent CS-MKT-ZALO", res: "ok" },
  { at: "2026-10-26T09:05:00Z", who: "Lê Quang Huy", role: "Nhân viên", act: "Gửi duyệt", obj: "Phiên bản thông báo CS-MKT-EMAIL v2.1", res: "ok" },
  { at: "2026-10-26T08:10:00Z", who: "Hệ thống", role: "Hệ thống", act: "Gửi event", obj: "Hệ thống gửi email (ESP)", res: "err", det: "401 Unauthorized, quá [N] lần thử" },
  { at: "2026-10-26T02:15:00Z", who: "Lê Quang Huy", role: "Nhân viên", act: "Gửi duyệt", obj: "Banner CK-001 v5", res: "ok" },
  { at: "2026-10-26T02:10:00Z", who: "Phạm Minh", role: "Nhân viên", act: "Gửi duyệt", obj: "Mục đích PARTNER-INS", res: "ok" },
  { at: "2026-10-24T03:02:00Z", who: "Lê Quang Huy", role: "Nhân viên", act: "Sửa ma trận phân quyền", obj: "Vai trò Admin", res: "err", det: "403 – không đủ quyền" },
  { at: "2026-10-22T08:00:00Z", who: "Nguyễn Minh Thu", role: "DPO", act: "Trả lại", obj: "Mục đích HEALTH-ADVICE", res: "ok", det: "Cần nêu rõ thời hạn xử lý…" },
  { at: "2026-07-01T03:00:00Z", who: "Nguyễn Minh Thu", role: "DPO", act: "Phê duyệt", obj: "Danh mục dữ liệu v2", res: "ok" },
]
export const NLOG: Notice2User[] = [
  { id: "N-1", to: "Lê Quang Huy", at: "2026-10-22T08:00:00Z", text: "Mục đích HEALTH-ADVICE bị trả lại: Cần nêu rõ thời hạn xử lý và không chia sẻ cho bên thứ ba.", link: "/purposes", read: false, tone: "err" },
  { id: "N-2", to: "Phạm Minh", at: "2026-10-22T02:30:00Z", text: "Banner BN-004 v1 bị trả lại: nút Từ chối nhạt hơn nút Đồng ý.", link: "/banners/BN-004", read: false, tone: "err" },
]
export const ALERTS: OpsAlert[] = [
  { id: "AL-0412", sev: "Nghiêm trọng", type: "Connector gửi lỗi (NT-08)", src: "Hệ thống gửi email (ESP) · 2 event FAILED", at: "2026-10-26T08:10:00Z", to: ["Admin"], status: "Đang mở", link: "/integrations" },
  { id: "AL-0411", sev: "Nghiêm trọng", type: "Khóa ký sắp hết hạn (NT-09)", src: "kid cmp-2025-01 · hết hạn 30/10/2026", at: "2026-10-25T01:00:00Z", to: ["Admin"], status: "Đang mở", link: "/settings" },
  { id: "AL-0409", sev: "Cảnh báo", type: "Yêu cầu quyền quá hạn (NT-07)", src: "RQ-2026-00405 · Hạn chế xử lý", at: "2026-10-24T01:00:00Z", to: ["Nhân viên", "DPO"], status: "Đang mở", link: "/rights" },
  { id: "AL-0402", sev: "Thông tin", type: "Quét cookie có mục chưa phân loại", src: "abcmart.vn · 2 tracker mới", at: "2026-10-20T02:00:00Z", to: ["Admin"], status: "Đã xử lý", link: "/integrations", note: "Đã chuyển nhóm Thiết yếu cho DPO duyệt" },
]
export const IMPORTS: ImportBatch[] = [
  { id: "LOT-2026-001", file: "consent-email-2025.xlsx", at: "2026-09-10T03:00:00Z", by: "Phạm Minh", rows: 1250, ok: 1218, err: 18, risk: 14, status: "Đã ghi", riskRows: [], errRows: [] },
  { id: "LOT-2026-002", file: "consent-cua-hang-T9.csv", at: "2026-10-25T04:30:00Z", by: "Phạm Thu Trang", rows: 342, ok: 326, err: 9, risk: 7, status: "Chờ duyệt",
    req: { action: "Ghi lô", by: "Phạm Thu Trang", byRole: "Nhân viên", at: "2026-10-25T04:30:00Z" },
    riskRows: [12, 37, 58, 101, 144, 210, 299].map((row, i) => ({ row, subject: SUBJECTS[60 + i], consent: "CS-MKT-EMAIL", date: `2025-0${(i % 8) + 1}-15`, issue: i % 2 ? "Thiếu tệp bằng chứng gốc" : "Không có phiên bản thông báo tương ứng" })),
    errRows: [{ row: 8, issue: "Mã khách hàng rỗng" }, { row: 44, issue: "Ngày đồng ý sai định dạng" }, { row: 90, issue: "consent_code không tồn tại: CS-MKT" }] },
]
export const RECONSENT_RULES = [{
  version: 3,
  status: "Hoạt động" as const,
  defaultMonths: 24,
  at: "2026-09-03T05:00:00Z",
  by: "Lê Quang Huy",
  approvedBy: "Nguyễn Minh Thu",
  approvedAt: "2026-09-03T05:00:00Z",
  history: [{ at: "2026-09-03T05:00:00Z", who: "Nguyễn Minh Thu", act: "Phê duyệt", note: "Kích hoạt bộ quy tắc R3" }],
  rows: [
    ["Thêm mục đích xử lý mới", true, true], ["Thêm bên nhận dữ liệu", true, true], ["Thêm loại dữ liệu", true, true], ["Kéo dài thời hạn lưu trữ", true, true], ["Thêm loại dữ liệu nhạy cảm", true, true],
    ["Sửa câu chữ, lỗi chính tả", false, false], ["Bổ sung bản dịch tiếng Anh", false, false], ["Rút ngắn thời hạn lưu trữ", false, false], ["Đổi thông tin liên hệ của bên kiểm soát", false, false], ["Bỏ bớt bên nhận", false, false],
  ].map(([change, material, locked]) => ({ change: String(change), material: Boolean(material), locked: Boolean(locked) })),
}]
export const MATRIX: DependencyMatrix[] = [
  { app: "app_3HX81P", version: 3, status: "Hoạt động", approvedBy: "Nguyễn Minh Thu", approvedAt: "2026-09-03T05:00:00Z", at: "2026-09-03T05:00:00Z", by: "Lê Quang Huy", history: [{ at: "2026-09-03T05:00:00Z", who: "Nguyễn Minh Thu", act: "Phê duyệt", note: "Kích hoạt ma trận v3" }], onReject: "Chặn chức năng liên quan", rows: [
    { fn: "FN-01", name: "Đăng ký, đăng nhập thành viên", purposes: { "MEMBER-CORE": true } },
    { fn: "FN-02", name: "Mở Ví ABC (eKYC)", purposes: { "MEMBER-CORE": true, EKYC: true } },
    { fn: "FN-03", name: "Nhận ưu đãi qua email", purposes: { "MKT-EMAIL": false } },
    { fn: "FN-04", name: "Gợi ý sản phẩm trên trang chủ", purposes: { "MKT-PERSONAL": false } },
  ] },
  { app: "app_5MB20R", version: 1, status: "Hoạt động", approvedBy: "Nguyễn Minh Thu", approvedAt: "2026-09-05T05:00:00Z", at: "2026-09-05T05:00:00Z", by: "Phạm Minh", history: [{ at: "2026-09-05T05:00:00Z", who: "Nguyễn Minh Thu", act: "Phê duyệt", note: "Kích hoạt ma trận v1" }], onReject: "Chặn, cho phép luồng thay thế", rows: [
    { fn: "FN-01", name: "Đăng nhập ứng dụng", purposes: { "MEMBER-CORE": true } },
    { fn: "FN-05", name: "Tìm cửa hàng gần nhất", purposes: {} },
  ] },
]
export const RIGHTS: RightsRequest[] = [
  ["RQ-2026-00425", "Rút lại đồng ý", "2026-10-22T07:30:00Z", "WAITING_PROCESSOR", "Phạm Thu Trang", "06/11/2026"],
  ["RQ-2026-00421", "Sửa dữ liệu", "2026-10-20T02:20:00Z", "IN_PROGRESS", "Lê Quang Huy", "04/11/2026"],
  ["RQ-2026-00412", "Xóa dữ liệu", "2026-10-12T02:14:00Z", "PENDING_CLOSE", "Phạm Thu Trang", "27/10/2026"],
  ["RQ-2026-00405", "Hạn chế xử lý", "2026-10-08T06:10:00Z", "IN_PROGRESS · Quá hạn", "Lê Quang Huy", "23/10/2026"],
  ["RQ-2026-00398", "Cung cấp dữ liệu", "2026-10-01T08:20:00Z", "COMPLETED", "Phạm Thu Trang", "16/10/2026"],
].map(([id, type, at, status, owner, due], i) => ({ id, type, at, status, owner, due, subject: SUBJECTS[90 + i] }))
export const CONNECTORS = [
  { name: "CRM chăm sóc khách hàng", type: "CRM", st: "Hoạt động", sent: 2204, failed: 0, last: "2026-10-28T01:41:00Z" },
  { name: "Nền tảng dữ liệu khách hàng (CDP)", type: "CDP", st: "Cảnh báo", sent: 6902, failed: 1, last: "2026-10-28T01:30:00Z" },
  { name: "Hệ thống gửi email (ESP)", type: "ESP", st: "Lỗi", sent: 1630, failed: 2, last: "2026-10-26T08:10:00Z" },
  { name: "Cổng SMS Brandname", type: "Cổng gửi tin (OTP, thông báo)", st: "Hoạt động", sent: 812, failed: 0, last: "2026-10-28T01:44:00Z" },
  { name: "Zalo OA", type: "Cổng gửi tin (OTP, thông báo)", st: "Hoạt động", sent: 207, failed: 0, last: "2026-10-28T01:30:00Z" },
]
export const KEYS = [
  { kid: "cmp-2026-07", alg: "ES256", st: "Đang dùng", created: "2026-07-01", exp: "2027-07-01" },
  { kid: "cmp-2025-01", alg: "ES256", st: "Chỉ xác minh", created: "2025-01-01", exp: "2026-10-30" },
]
