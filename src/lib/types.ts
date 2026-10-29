export type Role = "Admin" | "DPO" | "Nhân viên"

export type TenantStatus = "ACTIVE" | "SUSPENDED"
export interface Tenant {
  id: string
  code: string
  name: string
  status: TenantStatus
  description?: string
  contactEmail?: string
  createdAt?: string
  updatedAt?: string
}
export interface TenantMembership {
  userId: string
  tenantId: string
  roles: Role[]
  status: "ACTIVE" | "INACTIVE"
}
export interface TenantApplication {
  id: string
  name: string
  property: string
}
export interface TenantProperty {
  id: string
  name: string
  applicationId: string
}

/** Vòng đời đối tượng cấu hình (SRS 4.3.2) */
export type CfgStatus =
  | "Nháp"
  | "Chờ duyệt"
  | "Bị trả lại"
  | "Hoạt động"
  | "Chờ duyệt ngừng"
  | "Ngừng sử dụng"

/** Vòng đời phiên bản thông báo (SRS 5.2.1) */
export type NoticeStatus =
  | "Nháp"
  | "Chờ duyệt"
  | "Bị trả lại"
  | "Đã duyệt – chờ hiệu lực"
  | "Published"
  | "Expired"

/** Trạng thái consent của chủ thể (SRS 5.2.2) */
export type Decision =
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED"
  | "RE_CONSENT"
  | "NOT_CONSENTED"

export type DataGroup = "Cơ bản" | "Nhạy cảm"
export interface DataItem {
  code: string
  name: string
  group: DataGroup
}
export interface DataCatalogVersion {
  v: string
  at: string
  by: string
  basis: string
  items: DataItem[]
}

export interface HistoryEntry {
  at: string
  who: string
  act: string
  note?: string
}

/** Đề nghị đang chờ duyệt gắn với một đối tượng */
export interface PendingRequest {
  action: "Tạo mới" | "Sửa" | "Ngừng sử dụng" | "Xuất bản" | "Ghi lô" | "Cập nhật quy tắc" | "Phiên bản ma trận"
  by: string
  byRole: Role
  at: string
  reason?: string
}

export interface ConfigMeta {
  status: CfgStatus
  everActive: boolean
  req?: PendingRequest
  returnNote?: string
  history: HistoryEntry[]
  versions: { v: number; at: string; by: string; snap: Record<string, unknown> }[]
  updatedAt: string
  /** Bản sửa đổi của đối tượng đang Hoạt động (BR-AP-05) */
  revision?: Record<string, unknown>
}

export const LEGAL_BASES = [
  "Đồng ý của chủ thể dữ liệu",
  "Thực hiện hợp đồng",
  "Thực hiện nghĩa vụ pháp lý",
  "Bảo vệ tính mạng, sức khỏe",
  "Lợi ích công cộng hoặc nhiệm vụ của cơ quan nhà nước",
  "Khác (nêu rõ)",
] as const
export type LegalBasis = (typeof LEGAL_BASES)[number]

export interface Purpose extends ConfigMeta {
  code: string
  name: string
  desc: string
  items: string[]
  scope: string
  legalBasis: LegalBasis
  retention: string
  share: boolean
  recipients: string[]
  child: boolean
}

export type ConsentKind = "Bắt buộc" | "Tùy chọn"
export interface Consent extends ConfigMeta {
  code: string
  name: string
  purposes: string[]
  kind: ConsentKind
  channels: string[]
  apps: string[]
  duration: number | null
}

export interface NoticeContent {
  data: string
  purpose: string
  parties: string
  rights: string
}
export interface NoticeVersion {
  id: string
  consent: string
  v: string
  sum: string
  content: { vi: NoticeContent; en: NoticeContent }
  material?: "Có" | "Không"
  suggested?: "Có" | "Không"
  materialReason?: string
  effectiveAt?: string
  status: NoticeStatus
  by: string
  at: string
  approvedBy?: string
  hash?: string
  retNote?: string
  everSent?: boolean
  req?: PendingRequest
}

export type BannerKind = "consent" | "cookie"
export interface BannerCfg {
  layout: string
  title: { vi: string; en: string }
  desc: { vi: string; en: string }
  reject: { vi: string; en: string }
  custom: { vi: string; en: string }
  accept: { vi: string; en: string }
  link: { vi: string; en: string }
  color: string
  textColor: string
  radius: number
  logo: boolean
  font: string
  consents: string[]
  langs: ("vi" | "en")[]
}
export interface BannerVersion {
  v: number
  status: "Nháp" | "Chờ duyệt" | "Bị trả lại" | "Hoạt động" | "Thay thế"
  at: string
  by: string
  ap?: string
  note: string
  retNote?: string
  cfg: BannerCfg
  req?: PendingRequest
}
export interface Banner {
  code: string
  name: string
  kind: BannerKind
  site: string
  versions: BannerVersion[]
}

export type Source = "Trực tuyến" | "Ngoại tuyến" | "Legacy" | "Liên kết từ cookie" | "Preference Center"
export interface Receipt {
  jti: string
  kid: string
  alg: string
  enc: string
  aud: string
  exp: string
  decision: "ACCEPTED" | "REJECTED"
}
export interface OfflineInfo {
  id: string
  kind: "SMS" | "Ghi âm" | "Văn bản, chữ ký"
  actualDate: string
  enteredBy: string
  files: { name: string; size: string; hash: string }[]
  note?: string
}
export interface ConsentEvent {
  id: string
  subject: string
  consent: string
  version: string
  decision: Decision
  ts: string // ISO, server time UTC
  channel: string
  app: string
  property: string
  source: Source
  hash: string
  tx: string
  ip: string
  ua: string
  receipt?: Receipt
  sensitive?: boolean
  explicitConfirm?: boolean
  correctionOf?: string
  correctionReason?: string
  linkedFrom?: string
  offline?: OfflineInfo
  legacyBatch?: string
  legacyRisk?: boolean
}

export interface User {
  id: number
  name: string
  email: string
  roles: Role[]
  dept: string
  scope: string
  status: "Hoạt động" | "Chờ kích hoạt" | "Ngừng"
  last: string
}

export interface AuditEntry {
  /** Optional on seed/history records created before effective-role enforcement. */
  tenantId?: string
  /** Optional on seed/system history; all new user audit events include it. */
  userId?: string
  at: string
  who: string
  role: string
  act: string
  obj: string
  res: "ok" | "err"
  det?: string
  before?: string
  after?: string
}

export interface Notice2User {
  id: string
  to: string
  at: string
  text: string
  link?: string
  read: boolean
  tone: "ok" | "err" | "info"
}

export interface OpsAlert {
  id: string
  sev: "Nghiêm trọng" | "Cảnh báo" | "Thông tin"
  type: string
  src: string
  at: string
  to: Role[]
  status: "Đang mở" | "Đã xử lý"
  link: string
  note?: string
}

export interface ImportBatch {
  id: string
  file: string
  at: string
  by: string
  rows: number
  ok: number
  err: number
  risk: number
  status: "Đang kiểm tra" | "Chờ duyệt" | "Bị trả lại" | "Đã ghi" | "Nháp"
  riskRows: { row: number; subject: string; consent: string; date: string; issue: string; decision?: "Giữ" | "Xin lại" }[]
  errRows: { row: number; issue: string }[]
  req?: PendingRequest
  retNote?: string
}

export interface EvidencePackage {
  id: string
  at: string
  by: string
  reason: string
  scope: string
  subject?: string
  events: string[]
  pdfHash: string
  jsonHash: string
}

export interface MatrixRow {
  fn: string
  name: string
  purposes: Record<string, boolean>
  status?: "Hoạt động" | "Ngừng"
}
export type VersionApprovalStatus = "Nháp" | "Chờ duyệt" | "Bị trả lại" | "Hoạt động" | "Thay thế"
export interface ReconsentRuleRow {
  change: string
  material: boolean
  locked: boolean
}
export interface ReconsentRuleVersion {
  version: number
  status: VersionApprovalStatus
  defaultMonths: number
  rows: ReconsentRuleRow[]
  at: string
  by: string
  approvedBy?: string
  approvedAt?: string
  req?: PendingRequest
  returnNote?: string
  history: HistoryEntry[]
}
export interface DependencyMatrix {
  app: string
  version: number
  status: VersionApprovalStatus
  approvedBy?: string
  at: string
  by: string
  approvedAt?: string
  req?: PendingRequest
  returnNote?: string
  history: HistoryEntry[]
  onReject: "Chặn chức năng liên quan" | "Chặn, cho phép luồng thay thế"
  rows: MatrixRow[]
}

export interface RightsRequest {
  id: string
  subject: string
  type: string
  at: string
  status: string
  owner: string
  due: string
}
