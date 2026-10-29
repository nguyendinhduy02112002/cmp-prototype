/**
 * Store dữ liệu dùng chung của prototype (zustand).
 * Mọi màn đọc, ghi cùng một nguồn để thao tác ở màn này hiện ra ở màn khác.
 * Không có backend: dữ liệu nghiệp vụ reset khi tải lại trang; context demo hợp lệ được khôi phục.
 */
import { create } from "zustand"
import * as M from "./mock"
import type {
  AuditEntry, Banner, BannerCfg, Consent, ConsentEvent, Decision, EvidencePackage, ImportBatch, NoticeVersion,
  Notice2User, OpsAlert, PendingRequest, Purpose, Role, Source, User, DependencyMatrix, ReconsentRuleRow, ReconsentRuleVersion,
  Tenant, TenantApplication, TenantMembership, TenantProperty,
} from "./types"
import { canWithEffectiveRole, PERM_DEFAULT, resolveEffectiveRole, type Act, type Mod, type PermMatrix } from "./perm"
import { fakeHash, nowISO, uid } from "./fmt"
import { readPlatformTenants } from "./platform-data"
import { persistTenantApplications, readApplicationSnapshot, validateApplicationInput, type ApplicationErrors, type ApplicationInput } from "./application-data"
import { persistTenantProperties, readPropertySnapshot, validatePropertyInput, type PropertyErrors, type PropertyInput } from "./property-data"
import { demoPasswordDigest, readAuthSnapshot, writeAuthSnapshot, type TenantAccount } from "./auth-data"

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

export interface OutboxEvent { id: string; type: string; consent: string; subject: string; dest: string; status: "DELIVERED" | "RETRY" | "FAILED" | "PENDING"; at: string; tries: number }

export interface TenantWorkspace {
  perm: PermMatrix
  applications: TenantApplication[]
  properties: TenantProperty[]
  purposes: Purpose[]
  consents: Consent[]
  notices: NoticeVersion[]
  banners: Banner[]
  events: ConsentEvent[]
  audit: AuditEntry[]
  nlog: Notice2User[]
  alerts: OpsAlert[]
  imports: ImportBatch[]
  packages: EvidencePackage[]
  ruleSets: ReconsentRuleVersion[]
  matrix: DependencyMatrix[]
  users: User[]
  outbox: OutboxEvent[]
}

export type ApprovalKind = "purpose" | "consent" | "notice" | "banner" | "import" | "rule" | "matrix"
export interface ApprovalItem {
  id: string
  kind: ApprovalKind
  ref: string
  mod: Mod
  type: string
  name: string
  action: PendingRequest["action"]
  by: string
  byRole: Role
  at: string
  rows: [string, string, string][]
  checks: [boolean, string][]
  link: string
}

export interface State {
  tenants: Tenant[]
  memberships: TenantMembership[]
  accounts: TenantAccount[]
  authenticated: boolean
  currentTenantId: string | null
  currentUserId: string | null
  workspaces: Record<string, TenantWorkspace>
  role: Role
  perm: PermMatrix
  applications: TenantApplication[]
  properties: TenantProperty[]
  purposes: Purpose[]
  consents: Consent[]
  notices: NoticeVersion[]
  banners: Banner[]
  events: ConsentEvent[]
  audit: AuditEntry[]
  nlog: Notice2User[]
  alerts: OpsAlert[]
  imports: ImportBatch[]
  packages: EvidencePackage[]
  ruleSets: ReconsentRuleVersion[]
  matrix: DependencyMatrix[]
  users: User[]
  outbox: OutboxEvent[]
  switchTenant: (tenantId: string) => { ok: boolean; msg: string }
  login: (tenantCode: string, email: string, password: string) => { ok: boolean; msg: string }
  logout: () => void
  createTenantUser: (input: { name: string; email: string; password: string; roles: Role[] }) => { ok: boolean; msg: string; errors?: Record<string, string> }
  provisionTenantAdmin: (tenantId: string, input: { name: string; email: string; password: string }) => { ok: boolean; msg: string; userId?: string }
  getCurrentTenant: () => Tenant | undefined
  getCurrentMembership: () => TenantMembership | undefined
  getWorkspace: (tenantId: string) => TenantWorkspace | undefined
  setRole: (r: Role) => { ok: boolean; msg: string }
  setPerm: (r: Role, m: Mod, a: Act, v: boolean) => void
  createApplication: (input: ApplicationInput, expectedTenantId: string) => { ok: boolean; msg: string; applicationId?: string; errors?: ApplicationErrors }
  updateApplication: (applicationId: string, input: ApplicationInput, expectedTenantId: string) => { ok: boolean; msg: string; errors?: ApplicationErrors }
  setApplicationStatus: (applicationId: string, status: TenantApplication["status"], expectedTenantId: string) => { ok: boolean; msg: string }
  createProperty: (applicationId: string, input: PropertyInput, expectedTenantId: string, expectedApplicationId: string) => { ok: boolean; msg: string; propertyId?: string; errors?: PropertyErrors }
  updateProperty: (applicationId: string, propertyId: string, input: PropertyInput, expectedTenantId: string, expectedApplicationId: string) => { ok: boolean; msg: string; errors?: PropertyErrors }
  setPropertyStatus: (applicationId: string, propertyId: string, status: TenantProperty["status"], expectedTenantId: string, expectedApplicationId: string) => { ok: boolean; msg: string }
  assignPropertyIntegration: (applicationId: string, propertyId: string, consentCode: string, bannerCode: string, expectedTenantId: string) => { ok: boolean; msg: string }
  publishPropertyIntegration: (applicationId: string, propertyId: string, expectedTenantId: string) => { ok: boolean; msg: string }
  log: (act: string, obj: string, res?: "ok" | "err", det?: string, before?: string, after?: string) => void
  notify: (to: string, text: string, link?: string, tone?: Notice2User["tone"]) => void
  markRead: (id: string) => void
  resolveAlert: (id: string, note: string) => void
  // cấu hình có phê duyệt (mục đích, consent)
  saveConfig: (kind: "purpose" | "consent", obj: Purpose | Consent, isNew: boolean) => void
  submitConfig: (kind: "purpose" | "consent", code: string) => void
  requestStop: (kind: "purpose" | "consent", code: string, reason: string) => void
  deleteConfig: (kind: "purpose" | "consent", code: string) => void
  // phiên bản thông báo
  createNotice: (consent: string) => string
  saveNotice: (id: string, patch: Partial<NoticeVersion>) => void
  submitNotice: (id: string, suggested: "Có" | "Không") => void
  cancelSchedule: (id: string) => void
  activateScheduled: (id: string) => void
  deleteNotice: (id: string) => void
  // banner
  createBanner: (kind: Banner["kind"], name: string, site: string) => string
  newBannerVersion: (code: string) => void
  saveBannerCfg: (code: string, cfg: BannerCfg, note: string) => void
  submitBanner: (code: string) => void
  // import
  createImport: (file: string) => string
  setRiskDecision: (id: string, row: number, d: "Giữ" | "Xin lại") => void
  submitImport: (id: string) => void
  // phê duyệt dùng chung
  approve: (id: string, note: string, extra?: { material?: "Có" | "Không"; effective?: string; materialReason?: string }) => { ok: boolean; msg: string }
  reject: (id: string, note: string) => { ok: boolean; msg: string }
  withdraw: (id: string) => void
  // thu thập consent
  recordDecision: (o: { subject: string; consent: string; decision: Decision; channel: string; app: string; propertyId?: string; source?: Source; sensitive?: boolean; explicitConfirm?: boolean; linkedFrom?: string }) => ConsentEvent
  addOffline: (e: ConsentEvent) => void
  correctEvent: (id: string, reason: string, consent: string, decision: Decision) => void
  exportPackage: (p: Omit<EvidencePackage, "id" | "at" | "by" | "pdfHash" | "jsonHash">) => EvidencePackage
  createRuleDraft: () => { ok: boolean; msg: string }
  saveRuleDraft: (version: number, rows: ReconsentRuleRow[], defaultMonths: number) => { ok: boolean; msg: string }
  submitRule: (version: number) => { ok: boolean; msg: string }
  createMatrixDraft: (app: string) => { ok: boolean; msg: string }
  saveMatrixDraft: (m: DependencyMatrix) => { ok: boolean; msg: string }
  submitMatrix: (app: string, version: number) => { ok: boolean; msg: string }
}

export const persona = (r: Role) => M.PERSONA[r]

const authSeed = readAuthSnapshot()
export const DEMO_USERS: Record<string, { name: string; email: string }> = Object.fromEntries(authSeed.accounts.map((u) => [u.id, { name: u.name, email: u.email }]))

export const DEMO_TENANTS: Tenant[] = [
  { id: "tenant-retail", code: "ABC-RETAIL", name: "ABC Retail", status: "ACTIVE" },
  { id: "tenant-finance", code: "ABC-FIN", name: "ABC Finance", status: "ACTIVE" },
  { id: "tenant-health", code: "ABC-HEALTH", name: "ABC Health", status: "ACTIVE" },
]

export const DEMO_MEMBERSHIPS: TenantMembership[] = [
  ...authSeed.memberships,
]

const seedOutbox = (): OutboxEvent[] => [
  { id: "evt_77f2a1", type: "CONSENT_WITHDRAWN", consent: "CS-MKT-EMAIL", subject: M.SUBJECTS[7], dest: "Hệ thống gửi email (ESP)", status: "FAILED", at: "2026-10-26T08:10:00Z", tries: 6 },
  { id: "evt_77f2a0", type: "CONSENT_WITHDRAWN", consent: "CS-MKT-EMAIL", subject: M.SUBJECTS[19], dest: "Hệ thống gửi email (ESP)", status: "FAILED", at: "2026-10-26T08:02:00Z", tries: 6 },
  { id: "evt_77f19c", type: "CONSENT_ACCEPTED", consent: "CS-MKT-PERSONAL", subject: M.SUBJECTS[31], dest: "Nền tảng dữ liệu khách hàng (CDP)", status: "RETRY", at: "2026-10-28T01:30:00Z", tries: 2 },
  { id: "evt_77f188", type: "VERSION_CHANGED", consent: "CS-MKT-PERSONAL", subject: M.SUBJECTS[2], dest: "CRM chăm sóc khách hàng", status: "DELIVERED", at: "2026-10-27T09:12:00Z", tries: 1 },
]

function seedWorkspace(kind: "retail" | "finance" | "health"): TenantWorkspace {
  const tenantId = `tenant-${kind}`
  const applications = clone(M.APPS) as Pick<TenantApplication, "id" | "name" | "property">[]
  const names = kind === "retail"
    ? ["Website abcmart.vn", "Cổng thành viên member.abcmart.vn", "Ứng dụng ABC Mart (iOS/Android)"]
    : kind === "finance"
      ? ["ABC Finance Website", "Cổng khách hàng ABC Finance", "ABC Finance Mobile"]
      : ["ABC Health Website", "Cổng bệnh nhân ABC Health", "ABC Health Mobile"]
  const sites = kind === "retail" ? ["abcmart.vn", "member.abcmart.vn", "Ứng dụng ABC Mart"] : kind === "finance" ? ["abcfinance.vn", "portal.abcfinance.vn", "ABC Finance Mobile"] : ["abchealth.vn", "patient.abchealth.vn", "ABC Health Mobile"]
  const seededAt = "2026-03-15T03:00:00Z"
  const normalizedApplications: TenantApplication[] = applications.map((a, i) => ({
    ...a, tenantId, name: names[i], property: sites[i], propertyId: `property-${i + 1}`,
    code: kind === "retail" ? ["ABC-WEB", "ABC-MEMBER", "ABC-MOBILE"][i] : `${kind.toUpperCase()}-${["WEB", "PORTAL", "MOBILE"][i]}`,
    type: i === 2 ? "MOBILE" : "WEB", status: "ACTIVE", createdAt: seededAt, updatedAt: seededAt,
    createdBy: "seed", activatedAt: seededAt,
  }))
  const propertyMap = new Map(M.PROPERTIES.map((p, i) => [p, sites[i]]))
  const events = clone(M.EVENTS).slice(0, kind === "retail" ? undefined : 36).map((e: ConsentEvent) => ({ ...e, property: propertyMap.get(e.property) || sites[0] }))
  const purposes = clone(M.PURPOSES)
  if (kind === "finance") purposes[0] = { ...purposes[0], name: "Quản lý hồ sơ khách hàng tài chính" }
  if (kind === "health") purposes[0] = { ...purposes[0], name: "Quản lý hồ sơ chăm sóc sức khỏe" }
  const banners = clone(M.BANNERS).map((b: Banner) => ({ ...b, site: propertyMap.get(b.site) || sites[0] }))
  return {
    perm: clone(PERM_DEFAULT), applications: normalizedApplications,
    properties: normalizedApplications.map((a, i): TenantProperty => ({
      id: `property-${i + 1}`, tenantId, name: a.property,
      code: `${kind.toUpperCase()}-${["WEB", "PORTAL", "MOBILE"][i]}`,
      type: i === 2 ? "ANDROID" : "WEB", applicationId: a.id,
      origin: i < 2 ? `https://${sites[i]}` : undefined,
      packageName: i === 2 ? `vn.abc.${kind}` : undefined,
      status: "ACTIVE", createdAt: seededAt, updatedAt: seededAt, createdBy: "seed", activatedAt: seededAt,
    })),
    purposes, consents: clone(M.CONSENTS), notices: clone(M.NOTICES), banners, events,
    audit: clone(M.AUDIT), nlog: clone(M.NLOG), alerts: clone(M.ALERTS), imports: clone(M.IMPORTS), packages: [],
    ruleSets: clone(M.RECONSENT_RULES), matrix: clone(M.MATRIX), users: clone(M.USERS), outbox: seedOutbox(),
  }
}

const INITIAL_WORKSPACES: Record<string, TenantWorkspace> = {
  "tenant-retail": seedWorkspace("retail"),
  "tenant-finance": seedWorkspace("finance"),
  "tenant-health": seedWorkspace("health"),
}

const persistedApplications = readApplicationSnapshot()
for (const [tenantId, applications] of Object.entries(persistedApplications)) {
  const workspace = INITIAL_WORKSPACES[tenantId]
  if (workspace) workspace.applications = applications
}
const persistedProperties = readPropertySnapshot()
for (const [tenantId, properties] of Object.entries(persistedProperties)) {
  const workspace = INITIAL_WORKSPACES[tenantId]
  if (workspace) workspace.properties = properties.filter((p) => workspace.applications.some((a) => a.id === p.applicationId))
}

export const createEmptyTenantWorkspace = (): TenantWorkspace => ({
  perm: clone(PERM_DEFAULT), applications: [], properties: [], purposes: [], consents: [], notices: [], banners: [], events: [],
  audit: [], nlog: [], alerts: [], imports: [], packages: [], ruleSets: [], matrix: [], users: [], outbox: [],
})

const initialTenantRegistry = readPlatformTenants()
for (const tenant of initialTenantRegistry) {
  if (!INITIAL_WORKSPACES[tenant.id]) INITIAL_WORKSPACES[tenant.id] = createEmptyTenantWorkspace()
}

const DEMO_CONTEXT_KEY = "cmp-demo-context-v1"
const AUTH_SESSION_KEY = "cmp-auth-session-v1"
interface DemoContext { tenantId: string; userId: string; role: Role }

export function resolveDemoContext(value: unknown): DemoContext {
  const fallback: DemoContext = { tenantId: "tenant-retail", userId: "user-staff", role: "Nhân viên" }
  if (!value || typeof value !== "object") return fallback
  const raw = value as Partial<DemoContext>
  const tenant = readPlatformTenants().find((t) => t.id === raw.tenantId && t.status === "ACTIVE")
  if (!tenant || typeof raw.userId !== "string") return fallback
  const membership = authSeed.memberships.find((m) => m.tenantId === tenant.id && m.userId === raw.userId && m.status === "ACTIVE")
  if (!membership) return fallback
  const role = resolveEffectiveRole(membership, raw.role as Role)
  return role ? { tenantId: tenant.id, userId: membership.userId, role } : fallback
}

const loadDemoContext = (): DemoContext => {
  if (typeof window === "undefined") return resolveDemoContext(undefined)
  try {
    const session = JSON.parse(window.localStorage.getItem(AUTH_SESSION_KEY) || "null") as { tenantId?: string; userId?: string } | null
    if (session?.tenantId && session.userId) {
      const tenant = readPlatformTenants().find((t) => t.id === session.tenantId && t.status === "ACTIVE")
      const membership = authSeed.memberships.find((m) => m.tenantId === session.tenantId && m.userId === session.userId && m.status === "ACTIVE")
      const account = authSeed.accounts.find((a) => a.tenantId === session.tenantId && a.id === session.userId && a.status === "ACTIVE")
      if (tenant && account && membership) {
        const requested = JSON.parse(window.localStorage.getItem(DEMO_CONTEXT_KEY) || "null") as Partial<DemoContext> | null
        const role = requested?.tenantId === tenant.id && requested.userId === account.id ? resolveEffectiveRole(membership, requested.role as Role) : membership.roles[0]
        if (role) return { tenantId: tenant.id, userId: account.id, role }
      }
    }
    return resolveDemoContext(JSON.parse(window.localStorage.getItem(DEMO_CONTEXT_KEY) || "null"))
  }
  catch { return resolveDemoContext(undefined) }
}

const loadAuthenticated = () => {
  if (typeof window === "undefined") return false
  try {
    const raw = JSON.parse(window.localStorage.getItem(AUTH_SESSION_KEY) || "null") as { tenantId?: string; userId?: string } | null
    return !!raw && !!authSeed.accounts.find((a) => a.id === raw.userId && a.tenantId === raw.tenantId && a.status === "ACTIVE") && !!authSeed.memberships.find((m) => m.userId === raw.userId && m.tenantId === raw.tenantId && m.status === "ACTIVE") && !!readPlatformTenants().find((t) => t.id === raw.tenantId && t.status === "ACTIVE")
  } catch { return false }
}

const persistDemoContext = (context: DemoContext) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DEMO_CONTEXT_KEY, JSON.stringify(context))
}

const workspaceFields = (s: State): TenantWorkspace => ({
  perm: clone(s.perm), applications: clone(s.applications), properties: clone(s.properties), purposes: clone(s.purposes), consents: clone(s.consents), notices: clone(s.notices), banners: clone(s.banners), events: clone(s.events), audit: clone(s.audit), nlog: clone(s.nlog), alerts: clone(s.alerts), imports: clone(s.imports), packages: clone(s.packages), ruleSets: clone(s.ruleSets), matrix: clone(s.matrix), users: clone(s.users), outbox: clone(s.outbox),
})

export const currentMembership = (s: State) => s.authenticated ? s.memberships.find((m) => m.tenantId === s.currentTenantId && m.userId === s.currentUserId && m.status === "ACTIVE") : undefined
export const currentActor = (s: State) => s.currentUserId ? DEMO_USERS[s.currentUserId]?.name || s.currentUserId : "Chưa chọn người dùng"
export const hasPermission = (s: State, mod: Mod, act: Act = "view") => {
  return canWithEffectiveRole(currentMembership(s), s.role, s.perm, mod, act)
}

const cfgArr = (s: State, kind: "purpose" | "consent") => (kind === "purpose" ? s.purposes : s.consents) as (Purpose | Consent)[]
const label = { purpose: "Mục đích", consent: "Consent" }
const snap = (kind: "purpose" | "consent", o: Purpose | Consent, applications: TenantApplication[] = []) => {
  if (kind === "purpose") return M.snapPurpose(o as Purpose)
  const c = o as Consent
  return { ...M.snapConsent(c), "Ứng dụng": c.apps.map((id) => applications.find((a) => a.id === id)?.name || id) }
}
const show = (v: unknown) => (Array.isArray(v) ? v.join(", ") || "—" : v === undefined || v === null || v === "" ? "—" : String(v))

export const useStore = create<State>((set, get) => {
  const me = () => currentActor(get())
  const upd = (fn: (s: State) => Partial<State>) => set((s) => fn(s))
  const allowed = (mod: Mod, act: Act, action: string, object: string) => {
    const s = get()
    if (hasPermission(s, mod, act)) return true
    set({ audit: [{ tenantId: s.currentTenantId || undefined, userId: s.currentUserId || undefined, at: nowISO(), who: me(), role: s.role, act: action, obj: object, res: "err", det: "403 – vai trò hiệu lực không có quyền trong tenant hiện tại" }, ...s.audit] })
    return false
  }
  const notifyApprovers = (mod: Mod, text: string, link: string) => {
    const s = get()
    // Recipient discovery checks which assigned role the user could activate; it does not
    // grant the current session the union of those roles.
    s.memberships.filter((m) => m.tenantId === s.currentTenantId && m.status === "ACTIVE" && m.roles.some((r) => canWithEffectiveRole(m, r, s.perm, mod, "approve"))).forEach((m) => {
      const name = DEMO_USERS[m.userId]?.name || m.userId
      if (name !== me()) s.notify(name, text, link, "info")
    })
  }
  const initialContext = loadDemoContext()
  const initialWorkspace = clone(INITIAL_WORKSPACES[initialContext.tenantId])
  return {
    tenants: clone(initialTenantRegistry),
    memberships: clone(DEMO_MEMBERSHIPS),
    accounts: clone(authSeed.accounts),
    authenticated: loadAuthenticated(),
    currentTenantId: initialContext.tenantId,
    currentUserId: initialContext.userId,
    workspaces: clone(INITIAL_WORKSPACES),
    role: initialContext.role,
    ...initialWorkspace,

    switchTenant: (tenantId) => {
      const s = get()
      if (tenantId === s.currentTenantId) return { ok: true, msg: "Tenant đã được chọn." }
      const account = s.accounts.find((a) => a.id === s.currentUserId)
      if (account && account.tenantId !== tenantId) return { ok: false, msg: "Tài khoản chỉ thuộc một tenant; hãy đăng xuất và đăng nhập bằng tài khoản của tenant đích." }
      const tenant = s.tenants.find((t) => t.id === tenantId)
      if (!tenant || tenant.status !== "ACTIVE") return { ok: false, msg: "Tenant không khả dụng hoặc đã bị tạm ngừng." }
      const membership = s.memberships.find((m) => m.tenantId === tenantId && m.userId === s.currentUserId && m.status === "ACTIVE")
      if (!membership) return { ok: false, msg: "Người dùng hiện tại không có membership hoạt động trong tenant này." }
      if (s.accounts.some((a) => a.id === s.currentUserId && a.tenantId !== tenantId)) return { ok: false, msg: "Tài khoản chỉ thuộc một tenant; hãy đăng xuất và đăng nhập bằng tài khoản của tenant đích." }
      const target = s.workspaces[tenantId]
      if (!target) return { ok: false, msg: "Không tìm thấy workspace của tenant." }
      const nextWorkspaces = { ...s.workspaces }
      if (s.currentTenantId) nextWorkspaces[s.currentTenantId] = workspaceFields(s)
      const nextRole = resolveEffectiveRole(membership, s.role)
      if (!nextRole) return { ok: false, msg: "Membership không có vai trò hợp lệ trong tenant đích." }
      set({ ...clone(target), workspaces: nextWorkspaces, currentTenantId: tenantId, currentUserId: membership.userId, role: nextRole })
      persistDemoContext({ tenantId, userId: membership.userId, role: nextRole })
      return { ok: true, msg: `Đã chuyển sang ${tenant.name}.` }
    },
    login: (tenantCode, email, password) => {
      const s = get(); const tenant = s.tenants.find((t) => t.code.toLowerCase() === tenantCode.trim().toLowerCase() && t.status === "ACTIVE")
      if (!tenant) return { ok: false, msg: "Không tìm thấy tenant đang hoạt động với mã này." }
      const account = s.accounts.find((a) => a.tenantId === tenant.id && a.email.toLowerCase() === email.trim().toLowerCase() && a.status === "ACTIVE" && a.passwordDigest === demoPasswordDigest(password))
      const membership = account && s.memberships.find((m) => m.userId === account.id && m.tenantId === tenant.id && m.status === "ACTIVE")
      if (!account || !membership || !membership.roles.length) return { ok: false, msg: "Email hoặc mật khẩu không đúng, hoặc tài khoản không còn quyền truy cập." }
      const workspace = s.workspaces[tenant.id]
      if (!workspace) return { ok: false, msg: "Workspace tenant không khả dụng." }
      const nextWorkspaces = { ...s.workspaces }
      if (s.currentTenantId) nextWorkspaces[s.currentTenantId] = workspaceFields(s)
      const role = membership.roles[0]
      set({ ...clone(workspace), workspaces: nextWorkspaces, currentTenantId: tenant.id, currentUserId: account.id, role, authenticated: true })
      persistDemoContext({ tenantId: tenant.id, userId: account.id, role })
      if (typeof window !== "undefined") window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ tenantId: tenant.id, userId: account.id }))
      return { ok: true, msg: `Xin chào ${account.name}.` }
    },
    logout: () => {
      if (typeof window !== "undefined") window.localStorage.removeItem(AUTH_SESSION_KEY)
      set({ authenticated: false })
    },
    createTenantUser: (input) => {
      const s = get()
      if (!s.currentTenantId || !s.tenants.some((t) => t.id === s.currentTenantId && t.status === "ACTIVE")) return { ok: false, msg: "Tenant hiện tại không hoạt động." }
      if (!allowed("users", "edit", "Tạo người dùng tenant", input.email)) return { ok: false, msg: "Bạn không có quyền tạo người dùng trong tenant này." }
      const name = input.name.trim(), email = input.email.trim().toLowerCase()
      const errors: Record<string, string> = {}
      if (!name) errors.name = "Họ tên là bắt buộc."
      if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Email không hợp lệ."
      if (s.accounts.some((a) => a.email.toLowerCase() === email)) errors.email = "Email này đã được gắn với một tài khoản tenant."
      if (input.password.length < 8) errors.password = "Mật khẩu demo cần ít nhất 8 ký tự."
      if (!input.roles.length || input.roles.some((r) => !["Admin", "DPO", "Nhân viên"].includes(r))) errors.roles = "Chọn ít nhất một vai trò hợp lệ."
      if (Object.keys(errors).length) return { ok: false, msg: "Vui lòng kiểm tra thông tin người dùng.", errors }
      const now = nowISO(), id = `user_${fakeHash(`${s.currentTenantId}|${email}|${now}`).slice(0, 12)}`
      const account: TenantAccount = { id, tenantId: s.currentTenantId, name, email, passwordDigest: demoPasswordDigest(input.password), roles: [...new Set(input.roles)], status: "ACTIVE", createdAt: now }
      const accounts = [...s.accounts, account], memberships = [...s.memberships, { userId: id, tenantId: s.currentTenantId, roles: account.roles, status: "ACTIVE" as const }]
      set({ accounts, memberships })
      DEMO_USERS[id] = { name, email }
      writeAuthSnapshot({ accounts, memberships })
      get().log("Tạo người dùng tenant", id, "ok", `roles=${account.roles.join(",")}`)
      return { ok: true, msg: "Đã tạo tài khoản người dùng trong tenant hiện tại." }
    },
    provisionTenantAdmin: (tenantId, input) => {
      const s = get(), name = input.name.trim(), email = input.email.trim().toLowerCase()
      if (!s.tenants.some((t) => t.id === tenantId && t.status === "ACTIVE")) return { ok: false, msg: "Tenant mới chưa sẵn sàng." }
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || input.password.length < 8) return { ok: false, msg: "Thông tin tài khoản quản trị ban đầu không hợp lệ." }
      if (s.accounts.some((a) => a.email.toLowerCase() === email)) return { ok: false, msg: "Email đã được sử dụng trong một tenant khác." }
      const now = nowISO(), id = `user_${fakeHash(`${tenantId}|${email}|${now}`).slice(0, 12)}`
      const account: TenantAccount = { id, tenantId, name, email, passwordDigest: demoPasswordDigest(input.password), roles: ["Admin"], status: "ACTIVE", createdAt: now }
      const accounts = [...s.accounts, account], memberships = [...s.memberships, { userId: id, tenantId, roles: ["Admin"] as Role[], status: "ACTIVE" as const }]
      set({ accounts, memberships })
      DEMO_USERS[id] = { name, email }
      writeAuthSnapshot({ accounts, memberships })
      return { ok: true, msg: "Đã tạo tài khoản quản trị ban đầu.", userId: id }
    },
    getCurrentTenant: () => get().tenants.find((t) => t.id === get().currentTenantId),
    getCurrentMembership: () => currentMembership(get()),
    getWorkspace: (tenantId) => tenantId === get().currentTenantId ? workspaceFields(get()) : get().workspaces[tenantId],

    setRole: (r) => {
      const s = get()
      const role = resolveEffectiveRole(currentMembership(s), r)
      if (role !== r) {
        s.log("Đổi vai trò hiệu lực", String(r), "err", "Vai trò không thuộc membership đang hoạt động trong tenant hiện tại")
        return { ok: false, msg: "Vai trò không được gán cho bạn trong tenant hiện tại." }
      }
      set({ role })
      if (s.currentTenantId && s.currentUserId) persistDemoContext({ tenantId: s.currentTenantId, userId: s.currentUserId, role })
      return { ok: true, msg: `Vai trò hiệu lực: ${role}.` }
    },
    setPerm: (r, m, a, v) => {
      if (!allowed("users", "edit", "Sửa ma trận phân quyền", `Vai trò ${r} · ${m} · ${a}`)) return
      const before = String(get().perm[r][m][a])
      upd((s) => { const p = clone(s.perm); p[r][m][a] = v; return { perm: p } })
      get().log("Sửa ma trận phân quyền", `Vai trò ${r} · ${m} · ${a}`, "ok", undefined, before, String(v))
    },
    createApplication: (input, expectedTenantId) => {
      const s = get()
      if (!s.currentTenantId || s.currentTenantId !== expectedTenantId) return { ok: false, msg: "Ngữ cảnh tenant đã thay đổi. Vui lòng mở lại biểu mẫu." }
      const tenant = s.tenants.find((t) => t.id === s.currentTenantId)
      if (!tenant || tenant.status !== "ACTIVE") return { ok: false, msg: "Tenant không khả dụng hoặc đã bị tạm ngừng." }
      if (!allowed("integ", "edit", "Đăng ký ứng dụng", input.code || input.name)) return { ok: false, msg: "Bạn không có quyền đăng ký ứng dụng trong tenant này." }
      const checked = validateApplicationInput(input, s.applications)
      if (Object.keys(checked.errors).length) return { ok: false, msg: "Vui lòng kiểm tra dữ liệu nhập.", errors: checked.errors }
      const now = nowISO(); const actorId = s.currentUserId || "unknown"
      const application: TenantApplication = {
        id: `app_${fakeHash(`${s.currentTenantId}|${checked.value.code}|${now}`).slice(0, 12)}`,
        tenantId: s.currentTenantId, ...checked.value, propertyId: undefined, description: checked.value.description || undefined,
        property: "Chưa có Property", status: "INACTIVE", createdAt: now, updatedAt: now, createdBy: actorId,
      }
      const applications = [application, ...s.applications]
      set({ applications }); persistTenantApplications(s.currentTenantId, applications)
      get().log("Đăng ký ứng dụng", application.id, "ok", `code=${application.code}; status=INACTIVE`)
      return { ok: true, msg: `Đã đăng ký ứng dụng ${application.name}.`, applicationId: application.id }
    },
    updateApplication: (applicationId, input, expectedTenantId) => {
      const s = get()
      if (!s.currentTenantId || s.currentTenantId !== expectedTenantId) return { ok: false, msg: "Ngữ cảnh tenant đã thay đổi. Thay đổi chưa được lưu." }
      const tenant = s.tenants.find((t) => t.id === s.currentTenantId)
      if (!tenant || tenant.status !== "ACTIVE") return { ok: false, msg: "Tenant không khả dụng hoặc đã bị tạm ngừng." }
      if (!allowed("integ", "edit", "Cập nhật ứng dụng", applicationId)) return { ok: false, msg: "Bạn không có quyền sửa ứng dụng trong tenant này." }
      const current = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId)
      if (!current) { get().log("Cập nhật ứng dụng", applicationId, "err", "Application không thuộc tenant hiện tại"); return { ok: false, msg: "Không tìm thấy ứng dụng trong tenant hiện tại." } }
      const checked = validateApplicationInput(input, s.applications, applicationId)
      if (current.activatedAt && checked.value.type !== current.type) checked.errors.type = "Không thể đổi loại sau khi ứng dụng đã từng Active."
      if (Object.keys(checked.errors).length) return { ok: false, msg: "Vui lòng kiểm tra dữ liệu nhập.", errors: checked.errors }
      const changedFields = (["name", "code", "type", "description"] as const).filter((k) => (current[k] || "") !== (checked.value[k] || ""))
      if (!changedFields.length) return { ok: false, msg: "Không có thay đổi để lưu." }
      const updated: TenantApplication = { ...current, ...checked.value, propertyId: current.propertyId, description: checked.value.description || undefined, property: current.property, updatedAt: nowISO(), updatedBy: s.currentUserId || "unknown" }
      const applications = s.applications.map((a) => a.id === applicationId ? updated : a)
      set({ applications }); persistTenantApplications(s.currentTenantId, applications)
      get().log("Cập nhật ứng dụng", applicationId, "ok", `fields=${changedFields.join(",")}`)
      return { ok: true, msg: "Đã cập nhật ứng dụng." }
    },
    setApplicationStatus: (applicationId, status, expectedTenantId) => {
      const s = get()
      if (!s.currentTenantId || s.currentTenantId !== expectedTenantId) return { ok: false, msg: "Ngữ cảnh tenant đã thay đổi. Thao tác bị hủy." }
      const tenant = s.tenants.find((t) => t.id === s.currentTenantId)
      if (!tenant || tenant.status !== "ACTIVE") return { ok: false, msg: "Tenant không khả dụng hoặc đã bị tạm ngừng." }
      if (!allowed("integ", "edit", status === "ACTIVE" ? "Kích hoạt ứng dụng" : "Ngừng ứng dụng", applicationId)) return { ok: false, msg: "Bạn không có quyền đổi trạng thái ứng dụng." }
      const current = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId)
      if (!current) { get().log("Đổi trạng thái ứng dụng", applicationId, "err", "Application không thuộc tenant hiện tại"); return { ok: false, msg: "Không tìm thấy ứng dụng trong tenant hiện tại." } }
      if (current.status === status) return { ok: true, msg: "Ứng dụng đã ở trạng thái này." }
      const now = nowISO(); const updated = { ...current, status, updatedAt: now, updatedBy: s.currentUserId || "unknown", activatedAt: status === "ACTIVE" ? current.activatedAt || now : current.activatedAt }
      const applications = s.applications.map((a) => a.id === applicationId ? updated : a)
      set({ applications }); persistTenantApplications(s.currentTenantId, applications)
      get().log(status === "ACTIVE" ? "Kích hoạt ứng dụng" : "Ngừng ứng dụng", applicationId, "ok", `status=${status}`)
      return { ok: true, msg: status === "ACTIVE" ? "Đã kích hoạt ứng dụng." : "Đã chuyển ứng dụng sang Inactive; dữ liệu và quan hệ được giữ nguyên." }
    },
    createProperty: (applicationId, input, expectedTenantId, expectedApplicationId) => {
      const s = get()
      if (!s.currentTenantId || s.currentTenantId !== expectedTenantId || applicationId !== expectedApplicationId) return { ok: false, msg: "Ngữ cảnh tenant hoặc Application đã thay đổi. Vui lòng mở lại biểu mẫu." }
      const tenant = s.tenants.find((t) => t.id === s.currentTenantId)
      if (!tenant || tenant.status !== "ACTIVE") return { ok: false, msg: "Tenant không khả dụng hoặc đã bị tạm ngừng." }
      if (!allowed("integ", "edit", "Tạo Property", applicationId)) return { ok: false, msg: "Bạn không có quyền quản lý Property." }
      const application = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId)
      if (!application) return { ok: false, msg: "Application không thuộc tenant hiện tại." }
      if (application.status !== "ACTIVE") return { ok: false, msg: "Chỉ có thể tạo Property dưới Application đang Active." }
      const checked = validatePropertyInput(input, s.properties, applicationId)
      if (Object.keys(checked.errors).length) return { ok: false, msg: "Vui lòng kiểm tra dữ liệu Property.", errors: checked.errors }
      const now = nowISO(); const actorId = s.currentUserId || "unknown"
      const property: TenantProperty = {
        id: `property_${fakeHash(`${s.currentTenantId}|${applicationId}|${checked.value.code}|${now}`).slice(0, 12)}`,
        tenantId: s.currentTenantId, applicationId, name: checked.value.name, code: checked.value.code,
        type: checked.value.type, origin: checked.value.type === "WEB" ? checked.value.origin : undefined,
        packageName: checked.value.type === "ANDROID" ? checked.value.packageName : undefined,
        bundleId: checked.value.type === "IOS" ? checked.value.bundleId : undefined,
        description: checked.value.description || undefined, status: "ACTIVE", createdAt: now, updatedAt: now,
        createdBy: actorId, activatedAt: now,
      }
      const properties = [property, ...s.properties]
      set({ properties }); persistTenantProperties(s.currentTenantId, properties)
      get().log("Tạo Property", property.id, "ok", `applicationId=${applicationId}; propertyId=${property.id}; code=${property.code}`)
      return { ok: true, msg: `Đã tạo Property ${property.name}.`, propertyId: property.id }
    },
    updateProperty: (applicationId, propertyId, input, expectedTenantId, expectedApplicationId) => {
      const s = get()
      if (!s.currentTenantId || s.currentTenantId !== expectedTenantId || applicationId !== expectedApplicationId) return { ok: false, msg: "Ngữ cảnh tenant hoặc Application đã thay đổi. Thay đổi chưa được lưu." }
      const tenant = s.tenants.find((t) => t.id === s.currentTenantId)
      if (!tenant || tenant.status !== "ACTIVE") return { ok: false, msg: "Tenant không khả dụng hoặc đã bị tạm ngừng." }
      if (!allowed("integ", "edit", "Cập nhật Property", propertyId)) return { ok: false, msg: "Bạn không có quyền quản lý Property." }
      const application = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId)
      const current = s.properties.find((p) => p.id === propertyId && p.tenantId === s.currentTenantId && p.applicationId === applicationId)
      if (!application || !current) return { ok: false, msg: "Property không thuộc Application và tenant hiện tại." }
      const checked = validatePropertyInput(input, s.properties, applicationId, propertyId)
      if (Object.keys(checked.errors).length) return { ok: false, msg: "Vui lòng kiểm tra dữ liệu Property.", errors: checked.errors }
      const fields = (["name", "code", "type", "origin", "packageName", "bundleId", "description"] as const).filter((k) => (current[k] || "") !== (checked.value[k] || ""))
      if (!fields.length) return { ok: false, msg: "Không có thay đổi để lưu." }
      const updated: TenantProperty = { ...current, name: checked.value.name, code: checked.value.code, type: checked.value.type,
        origin: checked.value.type === "WEB" ? checked.value.origin : undefined, packageName: checked.value.type === "ANDROID" ? checked.value.packageName : undefined,
        bundleId: checked.value.type === "IOS" ? checked.value.bundleId : undefined, description: checked.value.description || undefined,
        updatedAt: nowISO(), updatedBy: s.currentUserId || "unknown" }
      const properties = s.properties.map((p) => p.id === propertyId ? updated : p)
      set({ properties }); persistTenantProperties(s.currentTenantId, properties)
      get().log("Cập nhật Property", propertyId, "ok", `applicationId=${applicationId}; propertyId=${propertyId}; fields=${fields.join(",")}`)
      return { ok: true, msg: "Đã cập nhật Property." }
    },
    setPropertyStatus: (applicationId, propertyId, status, expectedTenantId, expectedApplicationId) => {
      const s = get()
      if (!s.currentTenantId || s.currentTenantId !== expectedTenantId || applicationId !== expectedApplicationId) return { ok: false, msg: "Ngữ cảnh tenant hoặc Application đã thay đổi. Thao tác bị hủy." }
      const tenant = s.tenants.find((t) => t.id === s.currentTenantId)
      if (!tenant || tenant.status !== "ACTIVE") return { ok: false, msg: "Tenant không khả dụng hoặc đã bị tạm ngừng." }
      if (!allowed("integ", "edit", "Đổi trạng thái Property", propertyId)) return { ok: false, msg: "Bạn không có quyền quản lý Property." }
      const application = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId)
      const current = s.properties.find((p) => p.id === propertyId && p.tenantId === s.currentTenantId && p.applicationId === applicationId)
      if (!application || !current) return { ok: false, msg: "Property không thuộc Application và tenant hiện tại." }
      if (current.status === status) return { ok: true, msg: "Property đã ở trạng thái này." }
      const now = nowISO(); const updated = { ...current, status, updatedAt: now, updatedBy: s.currentUserId || "unknown", activatedAt: status === "ACTIVE" ? current.activatedAt || now : current.activatedAt }
      const properties = s.properties.map((p) => p.id === propertyId ? updated : p)
      set({ properties }); persistTenantProperties(s.currentTenantId, properties)
      get().log(status === "ACTIVE" ? "Kích hoạt Property" : "Ngừng Property", propertyId, "ok", `applicationId=${applicationId}; propertyId=${propertyId}; status=${status}`)
      return { ok: true, msg: status === "ACTIVE" ? "Đã kích hoạt Property." : "Đã chuyển Property sang Inactive; dữ liệu và quan hệ được giữ nguyên." }
    },
    assignPropertyIntegration: (applicationId, propertyId, consentCode, bannerCode, expectedTenantId) => {
      const s = get()
      if (!s.currentTenantId || s.currentTenantId !== expectedTenantId) return { ok: false, msg: "Ngữ cảnh tenant đã thay đổi. Vui lòng thao tác lại." }
      const tenant = s.tenants.find((t) => t.id === s.currentTenantId)
      if (!tenant || tenant.status !== "ACTIVE") return { ok: false, msg: "Tenant không khả dụng hoặc đã bị tạm ngừng." }
      const canAssign =
        hasPermission(s, "integ", "edit") ||
        (
          s.role === "Nhân viên" &&
          hasPermission(s, "banner", "edit")
        )
      if (!canAssign) {
        return {
          ok: false,
          msg: "Bạn không có quyền gán cấu hình cho Property."
        }
      }
      const application = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId)
      const property = s.properties.find((p) => p.id === propertyId && p.applicationId === applicationId && p.tenantId === s.currentTenantId)
      const consent = s.consents.find((c) => c.code === consentCode && c.status === "Hoạt động")
      const banner = s.banners.find((b) => b.code === bannerCode && b.versions.some((v) => v.status === "Hoạt động"))
      if (!application || !property) return { ok: false, msg: "Property không thuộc Application và tenant hiện tại." }
      if (!consent) return { ok: false, msg: "Consent Configuration chưa được DPO phê duyệt hoặc không thuộc tenant." }
      if (!banner) return { ok: false, msg: "Banner chưa được DPO phê duyệt hoặc không thuộc tenant." }
      const integration = { consentCode, bannerCode, status: "DRAFT" as const, version: property.integration?.version || 0, deploymentId: property.integration?.deploymentId }
      const properties = s.properties.map((p) => p.id === propertyId ? { ...p, integration, updatedAt: nowISO(), updatedBy: s.currentUserId || "unknown" } : p)
      set({ properties }); persistTenantProperties(s.currentTenantId, properties)
      get().log("Gán cấu hình consent", propertyId, "ok", `applicationId=${applicationId}; propertyId=${propertyId}; consentCode=${consentCode}; bannerCode=${bannerCode}`)
      return { ok: true, msg: "Đã gán Consent Configuration và Banner. Cần Publish để dùng trong Simulator." }
    },
    publishPropertyIntegration: (applicationId, propertyId, expectedTenantId) => {
      const s = get()
      if (!s.currentTenantId || s.currentTenantId !== expectedTenantId) return { ok: false, msg: "Ngữ cảnh tenant đã thay đổi. Vui lòng thao tác lại." }
      const tenant = s.tenants.find((t) => t.id === s.currentTenantId)
      const application = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId)
      const property = s.properties.find((p) => p.id === propertyId && p.applicationId === applicationId && p.tenantId === s.currentTenantId)
      if (!tenant || tenant.status !== "ACTIVE" || !application || application.status !== "ACTIVE" || !property || property.status !== "ACTIVE") return { ok: false, msg: "Tenant, Application và Property phải ở trạng thái Active." }
      if (!allowed("integ", "edit", "Publish cấu hình Property", propertyId)) return { ok: false, msg: "Bạn không có quyền Publish cấu hình." }
      if (!property.integration) return { ok: false, msg: "Hãy gán Consent Configuration và Banner trước khi Publish." }
      const consent = s.consents.find((c) => c.code === property.integration?.consentCode && c.status === "Hoạt động")
      const banner = s.banners.find((b) => b.code === property.integration?.bannerCode && b.versions.some((v) => v.status === "Hoạt động"))
      if (!consent || !banner) return { ok: false, msg: "Consent hoặc Banner không còn ở trạng thái được phê duyệt." }
      const at = nowISO(); const deploymentId = property.integration.deploymentId || `dep_${fakeHash(`${s.currentTenantId}|${propertyId}`).slice(0, 16)}`
      const integration = { ...property.integration, status: "PUBLISHED" as const, version: property.integration.version + 1, deploymentId, publishedAt: at, publishedBy: s.currentUserId || "unknown" }
      const properties = s.properties.map((p) => p.id === propertyId ? { ...p, integration, updatedAt: at, updatedBy: s.currentUserId || "unknown" } : p)
      set({ properties }); persistTenantProperties(s.currentTenantId, properties)
      get().log("Publish cấu hình Property", propertyId, "ok", `applicationId=${applicationId}; propertyId=${propertyId}; deploymentId=${deploymentId}; version=${integration.version}`)
      return { ok: true, msg: `Đã Publish cấu hình v${integration.version}.` }
    },
    log: (act, obj, res = "ok", det, before, after) => upd((s) => ({ audit: [{ tenantId: s.currentTenantId || undefined, userId: s.currentUserId || undefined, at: nowISO(), who: me(), role: s.role, act, obj, res, det, before, after }, ...s.audit] })),
    notify: (to, text, link, tone = "info") => upd((s) => ({ nlog: [{ id: uid("N"), to, at: nowISO(), text, link, read: false, tone }, ...s.nlog] })),
    markRead: (id) => upd((s) => ({ nlog: s.nlog.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    resolveAlert: (id, note) => {
      upd((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, status: "Đã xử lý", note } : a)) }))
      get().log("Xử lý cảnh báo", id, "ok", note)
    },

    saveConfig: (kind, obj, isNew) => {
      if (!allowed("setup", "edit", "Lưu cấu hình", obj.code)) return
      const s = get()
      if (kind === "consent") {
        const c = obj as Consent
        if (c.purposes.some((code) => !s.purposes.some((p) => p.code === code)) || c.apps.some((id) => !s.applications.some((a) => a.id === id))) {
          s.log("Lưu cấu hình", c.code, "err", "Quan hệ Purpose/Application không thuộc tenant hiện tại")
          return
        }
      }
      const key = kind === "purpose" ? "purposes" : "consents"
      const arr = cfgArr(s, kind)
      const at = nowISO()
      if (isNew) {
        const o = { ...obj, status: "Nháp", everActive: false, history: [{ at, who: me(), act: "Lưu nháp" }], versions: [], updatedAt: at } as Purpose | Consent
        set({ [key]: [o, ...arr] } as Partial<State>)
        s.log("Lưu nháp", `${label[kind]} ${obj.code}`)
        return
      }
      const cur = arr.find((x) => x.code === obj.code)!
      let next: Purpose | Consent
      if (cur.everActive && (cur.status === "Hoạt động" || cur.status === "Bị trả lại")) {
        // BR-AP-05: tạo bản sửa đổi, bản Hoạt động giữ hiệu lực
        next = { ...cur, revision: { ...obj, history: undefined, versions: undefined, revision: undefined }, history: [{ at, who: me(), act: "Lưu bản sửa đổi" }, ...cur.history], updatedAt: at }
      } else {
        next = { ...cur, ...obj, status: cur.status === "Bị trả lại" ? "Bị trả lại" : "Nháp", history: [{ at, who: me(), act: "Lưu nháp" }, ...cur.history], updatedAt: at } as Purpose | Consent
      }
      set({ [key]: arr.map((x) => (x.code === obj.code ? next : x)) } as Partial<State>)
      s.log("Lưu nháp", `${label[kind]} ${obj.code}`, "ok", undefined, JSON.stringify(snap(kind, cur, s.applications)), JSON.stringify(snap(kind, { ...cur, ...obj } as Purpose | Consent, s.applications)))
    },
    submitConfig: (kind, code) => {
      if (!allowed("setup", "edit", "Gửi duyệt", code)) return
      const s = get(); const key = kind === "purpose" ? "purposes" : "consents"; const at = nowISO()
      set({ [key]: cfgArr(s, kind).map((x) => (x.code === code ? { ...x, status: "Chờ duyệt", returnNote: undefined, req: { action: x.everActive ? "Sửa" : "Tạo mới", by: me(), byRole: s.role, at }, history: [{ at, who: me(), act: "Gửi duyệt" }, ...x.history], updatedAt: at } : x)) } as Partial<State>)
      s.log("Gửi duyệt", `${label[kind]} ${code}`)
      notifyApprovers("setup", `${label[kind]} ${code} chờ bạn duyệt`, "/notifications")
    },
    requestStop: (kind, code, reason) => {
      if (!allowed("setup", "edit", "Đề nghị ngừng", code)) return
      const s = get(); const key = kind === "purpose" ? "purposes" : "consents"; const at = nowISO()
      set({ [key]: cfgArr(s, kind).map((x) => (x.code === code ? { ...x, status: "Chờ duyệt ngừng", req: { action: "Ngừng sử dụng", by: me(), byRole: s.role, at, reason }, history: [{ at, who: me(), act: "Đề nghị ngừng sử dụng", note: reason }, ...x.history] } : x)) } as Partial<State>)
      s.log("Đề nghị ngừng", `${label[kind]} ${code}`, "ok", reason)
      notifyApprovers("setup", `Đề nghị ngừng ${label[kind].toLowerCase()} ${code}`, "/notifications")
    },
    deleteConfig: (kind, code) => {
      if (!allowed("setup", "edit", "Xóa cấu hình", code)) return
      const s = get(); const key = kind === "purpose" ? "purposes" : "consents"
      set({ [key]: cfgArr(s, kind).filter((x) => x.code !== code) } as Partial<State>)
      s.log("Xóa", `${label[kind]} ${code}`)
    },

    createNotice: (consent) => {
      if (!allowed("setup", "edit", "Tạo phiên bản thông báo", consent)) return ""
      const s = get()
      const pub = s.notices.find((n) => n.consent === consent && n.status === "Published")
      const c = s.consents.find((x) => x.code === consent)!
      const vs = s.notices.filter((n) => n.consent === consent).map((n) => n.v)
      const last = vs.sort().slice(-1)[0]
      const v = last ? (() => { const [a, b] = last.slice(1).split(".").map(Number); return `v${a}.${b + 1}` })() : "v1.0"
      const id = `${consent}|${v}`
      const tenantName = s.tenants.find((t) => t.id === s.currentTenantId)?.name || "Tenant"
      const content = pub ? clone(pub.content) : JSON.parse(JSON.stringify({ vi: M.buildContent(c, "vi"), en: M.buildContent(c, "en") }).replaceAll("ABC Retail", tenantName))
      const n: NoticeVersion = { id, consent, v, sum: "", content, status: "Nháp", by: me(), at: nowISO() }
      upd((st) => ({ notices: [n, ...st.notices] }))
      s.log("Tạo phiên bản", `Phiên bản thông báo ${consent} ${v}`, "ok", pub ? `Sao chép từ ${pub.v}` : "Tạo mới")
      return id
    },
    saveNotice: (id, patch) => {
      if (!allowed("setup", "edit", "Lưu thông báo", id)) return
      upd((s) => ({ notices: s.notices.map((n) => (n.id === id ? { ...n, ...patch, at: nowISO() } : n)) }))
      get().log("Lưu nháp", `Phiên bản thông báo ${id.replace("|", " ")}`)
    },
    submitNotice: (id, suggested) => {
      if (!allowed("setup", "edit", "Gửi duyệt thông báo", id)) return
      const s = get()
      upd((st) => ({ notices: st.notices.map((n) => (n.id === id ? { ...n, status: "Chờ duyệt", suggested, everSent: true, retNote: undefined, req: { action: "Xuất bản", by: me(), byRole: st.role, at: nowISO() } } : n)) }))
      s.log("Gửi duyệt", `Phiên bản thông báo ${id.replace("|", " ")}`)
      notifyApprovers("setup", `Phiên bản ${id.replace("|", " ")} chờ duyệt xuất bản`, "/notifications")
    },
    cancelSchedule: (id) => {
      if (!allowed("setup", "edit", "Hủy lịch xuất bản", id)) return
      upd((s) => ({ notices: s.notices.map((n) => (n.id === id ? { ...n, status: "Nháp", effectiveAt: undefined } : n)) }))
      get().log("Hủy lịch xuất bản", `Phiên bản thông báo ${id.replace("|", " ")}`)
    },
    activateScheduled: (id) => { if (allowed("setup", "approve", "Kích hoạt lịch xuất bản", id)) publishNotice(id, true) },
    deleteNotice: (id) => {
      if (!allowed("setup", "edit", "Xóa phiên bản thông báo", id)) return
      upd((s) => ({ notices: s.notices.filter((n) => n.id !== id) }))
      get().log("Xóa", `Phiên bản thông báo ${id.replace("|", " ")}`)
    },

    createBanner: (kind, name, site) => {
      if (!allowed("banner", "edit", "Tạo banner", name)) return ""
      const s = get()
      if (!s.properties.some((p) => p.name === site)) { s.log("Tạo banner", name, "err", "Property không thuộc tenant hiện tại"); return "" }
      const pre = kind === "cookie" ? "CK" : "BN"
      const n = s.banners.filter((b) => b.kind === kind).length + 1
      const code = `${pre}-${String(n).padStart(3, "0")}`
      const base = clone(M.BANNERS.find((b) => b.kind === kind)!.versions[0].cfg)
      base.consents = []
      upd((st) => ({ banners: [{ code, name, kind, site, versions: [{ v: 1, status: "Nháp", at: nowISO(), by: me(), note: "Tạo mới", cfg: base }] }, ...st.banners] }))
      s.log("Tạo banner", code)
      return code
    },
    newBannerVersion: (code) => {
      if (!allowed("banner", "edit", "Tạo phiên bản banner", code)) return
      upd((s) => ({ banners: s.banners.map((b) => { if (b.code !== code) return b; const base = b.versions.find((v) => v.status === "Hoạt động") || b.versions[0]; return { ...b, versions: [{ v: b.versions[0].v + 1, status: "Nháp", at: nowISO(), by: me(), note: "", cfg: clone(base.cfg) }, ...b.versions] } }) }))
      get().log("Tạo phiên bản banner", code)
    },
    saveBannerCfg: (code, cfg, note) => {
      if (!allowed("banner", "edit", "Lưu banner", code)) return
      upd((s) => ({ banners: s.banners.map((b) => (b.code !== code ? b : { ...b, versions: b.versions.map((v, i) => (i === 0 ? { ...v, cfg: clone(cfg), note, at: nowISO(), status: v.status === "Bị trả lại" ? "Nháp" : v.status } : v)) })) }))
      get().log("Lưu nháp", `Banner ${code}`)
    },
    submitBanner: (code) => {
      if (!allowed("banner", "edit", "Gửi duyệt banner", code)) return
      const s = get()
      upd((st) => ({ banners: st.banners.map((b) => (b.code !== code ? b : { ...b, versions: b.versions.map((v, i) => (i === 0 ? { ...v, status: "Chờ duyệt", retNote: undefined, req: { action: "Xuất bản", by: me(), byRole: st.role, at: nowISO() } } : v)) })) }))
      s.log("Gửi duyệt", `Banner ${code}`)
      notifyApprovers("banner", `Banner ${code} chờ bạn duyệt`, "/notifications")
    },

    createImport: (file) => {
      if (!allowed("import", "edit", "Tải lô import", file)) return ""
      const id = uid("LOT")
      const s = get()
      const riskRows = [5, 19, 33].map((row, i) => ({ row, subject: M.SUBJECTS[120 + i], consent: "CS-MKT-EMAIL", date: `2025-1${i}-02`, issue: "Thiếu tệp bằng chứng gốc" }))
      upd((st) => ({ imports: [{ id, file, at: nowISO(), by: me(), rows: 128, ok: 122, err: 3, risk: 3, status: "Nháp", riskRows, errRows: [{ row: 7, issue: "Mã khách hàng rỗng" }, { row: 40, issue: "consent_code không tồn tại" }, { row: 88, issue: "Ngày đồng ý ở tương lai" }] }, ...st.imports] }))
      s.log("Tải lô import", file)
      return id
    },
    setRiskDecision: (id, row, d) => { if (allowed("import", "edit", "Đánh giá import", id)) upd((s) => ({ imports: s.imports.map((b) => (b.id !== id ? b : { ...b, riskRows: b.riskRows.map((r) => (r.row === row ? { ...r, decision: d } : r)) })) })) },
    submitImport: (id) => {
      if (!allowed("import", "edit", "Gửi duyệt import", id)) return
      const s = get()
      upd((st) => ({ imports: st.imports.map((b) => (b.id === id ? { ...b, status: "Chờ duyệt", req: { action: "Ghi lô", by: me(), byRole: st.role, at: nowISO() } } : b)) }))
      s.log("Gửi duyệt", `Lô import ${id}`)
      notifyApprovers("import", `Lô import ${id} chờ xác nhận ghi`, "/notifications")
    },

    approve: (id, note, extra) => {
      const s = get()
      const item = getApprovals(s).find((x) => x.id === id)
      if (!item) return { ok: false, msg: "Đề nghị không còn chờ duyệt." }
      if (!hasPermission(s, item.mod, "approve")) { s.log("Phê duyệt", item.name, "err", "403 – không có quyền Phê duyệt trong tenant hiện tại"); return { ok: false, msg: "Membership hiện tại chưa có quyền Phê duyệt nhóm này." } }
      if (item.by === me()) { s.log("Phê duyệt", item.name, "err", "BR-AP-01 – người gửi tự duyệt"); return { ok: false, msg: "Bạn không thể phê duyệt đề nghị do chính mình gửi. (MSG-C-05)" } }
      const at = nowISO()
      if (item.kind === "purpose" || item.kind === "consent") {
        const key = item.kind === "purpose" ? "purposes" : "consents"
        set({ [key]: cfgArr(s, item.kind).map((x) => {
          if (x.code !== item.ref) return x
          const stop = x.status === "Chờ duyệt ngừng"
          const applied = !stop && x.revision ? { ...x, ...x.revision } : x
          const nv = { ...applied, status: stop ? "Ngừng sử dụng" : "Hoạt động", everActive: true, req: undefined, revision: undefined, returnNote: undefined, history: [{ at, who: me(), act: stop ? "Phê duyệt ngừng" : "Phê duyệt", note }, ...x.history], updatedAt: at } as Purpose | Consent
          if (!stop) nv.versions = [{ v: (x.versions[0]?.v || 0) + 1, at, by: me(), snap: snap(item.kind as "purpose", nv, s.applications) }, ...x.versions]
          return nv
        }) } as Partial<State>)
      } else if (item.kind === "notice") {
        const eff = extra?.effective
        upd((st) => ({ notices: st.notices.map((n) => (n.id === item.ref ? { ...n, material: extra?.material || n.suggested, materialReason: extra?.materialReason, approvedBy: me(), req: undefined, hash: fakeHash(JSON.stringify(n.content) + n.v), status: eff ? "Đã duyệt – chờ hiệu lực" : n.status, effectiveAt: eff || n.effectiveAt } : n)) }))
        if (!eff) publishNotice(item.ref, false)
      } else if (item.kind === "banner") {
        upd((st) => ({ banners: st.banners.map((b) => (b.code !== item.ref ? b : { ...b, versions: b.versions.map((v, i) => (i === 0 ? { ...v, status: "Hoạt động", ap: me(), req: undefined } : v.status === "Hoạt động" ? { ...v, status: "Thay thế" } : v)) })) }))
      } else if (item.kind === "rule") {
        const version = Number(item.ref)
        upd((st) => ({ ruleSets: st.ruleSets.map((v) => v.version === version ? { ...v, status: "Hoạt động", approvedBy: me(), approvedAt: at, req: undefined, returnNote: undefined, history: [{ at, who: me(), act: "Phê duyệt", note }, ...v.history] } : v.status === "Hoạt động" ? { ...v, status: "Thay thế" } : v) }))
      } else if (item.kind === "matrix") {
        const [app, rawVersion] = item.ref.split("|"); const version = Number(rawVersion)
        upd((st) => ({ matrix: st.matrix.map((m) => m.app === app && m.version === version ? { ...m, status: "Hoạt động", approvedBy: me(), approvedAt: at, req: undefined, returnNote: undefined, history: [{ at, who: me(), act: "Phê duyệt", note }, ...m.history] } : m.app === app && m.status === "Hoạt động" ? { ...m, status: "Thay thế" } : m) }))
      } else if (item.kind === "import") {
        const b = s.imports.find((x) => x.id === item.ref)!
        if (b.riskRows.some((r) => !r.decision)) return { ok: false, msg: "BR-UC09-04: còn dòng rủi ro chưa có quyết định Giữ hoặc Xin lại." }
        const newEv: ConsentEvent[] = b.riskRows.filter((r) => r.decision === "Giữ").map((r, i) => ({ id: uid("EV"), subject: r.subject, consent: r.consent, version: "Legacy", decision: "ACCEPTED", ts: `${r.date}T03:00:00Z`, channel: "Import", app: "—", property: s.properties[1]?.name || s.properties[0]?.name || "—", source: "Legacy", hash: fakeHash(r.subject + i), tx: "tx_" + fakeHash(r.subject).slice(0, 12), ip: "—", ua: "Import lô " + b.id, legacyBatch: b.id, legacyRisk: true }))
        upd((st) => ({ imports: st.imports.map((x) => (x.id === b.id ? { ...x, status: "Đã ghi", req: undefined } : x)), events: [...newEv, ...st.events] }))
      }
      s.log(item.kind === "notice" ? "Phê duyệt, xuất bản" : "Phê duyệt", item.name, "ok", note, "Chờ duyệt", item.kind === "matrix" ? "Hiện hành" : item.kind === "rule" ? "Hoạt động" : "Đã duyệt")
      s.notify(item.by, `${item.type} ${item.name} đã được duyệt bởi ${me()}`, item.link, "ok")
      return { ok: true, msg: `Đã phê duyệt ${item.type.toLowerCase()} ${item.name}.` }
    },
    reject: (id, note) => {
      const s = get()
      const item = getApprovals(s).find((x) => x.id === id)
      if (!item) return { ok: false, msg: "Đề nghị không còn chờ duyệt." }
      if (!note || note.trim().length < 10) return { ok: false, msg: "Vui lòng nhập lý do trả lại (tối thiểu 10 ký tự). (MSG-C-09)" }
      if (!hasPermission(s, item.mod, "approve") || item.by === me()) return { ok: false, msg: "Không đủ điều kiện trả lại (BR-AP-01)." }
      const at = nowISO()
      if (item.kind === "purpose" || item.kind === "consent") {
        const key = item.kind === "purpose" ? "purposes" : "consents"
        set({ [key]: cfgArr(s, item.kind).map((x) => (x.code !== item.ref ? x : { ...x, status: x.status === "Chờ duyệt ngừng" ? "Hoạt động" : x.everActive ? "Hoạt động" : "Bị trả lại", returnNote: note, req: undefined, history: [{ at, who: me(), act: "Trả lại", note }, ...x.history] })) } as Partial<State>)
      } else if (item.kind === "notice") {
        upd((st) => ({ notices: st.notices.map((n) => (n.id === item.ref ? { ...n, status: "Bị trả lại", retNote: note, req: undefined } : n)) }))
      } else if (item.kind === "banner") {
        upd((st) => ({ banners: st.banners.map((b) => (b.code !== item.ref ? b : { ...b, versions: b.versions.map((v, i) => (i === 0 ? { ...v, status: "Bị trả lại", retNote: note, ap: me(), req: undefined } : v)) })) }))
      } else if (item.kind === "rule") {
        const version = Number(item.ref)
        upd((st) => ({ ruleSets: st.ruleSets.map((v) => v.version === version ? { ...v, status: "Bị trả lại", req: undefined, returnNote: note, history: [{ at, who: me(), act: "Trả lại", note }, ...v.history] } : v) }))
      } else if (item.kind === "matrix") {
        const [app, rawVersion] = item.ref.split("|"); const version = Number(rawVersion)
        upd((st) => ({ matrix: st.matrix.map((m) => m.app === app && m.version === version ? { ...m, status: "Bị trả lại", req: undefined, returnNote: note, history: [{ at, who: me(), act: "Trả lại", note }, ...m.history] } : m) }))
      } else if (item.kind === "import") {
        upd((st) => ({ imports: st.imports.map((x) => (x.id === item.ref ? { ...x, status: "Bị trả lại", retNote: note, req: undefined } : x)) }))
      }
      s.log("Trả lại", item.name, "ok", note, "Chờ duyệt", "Bị trả lại")
      s.notify(item.by, `${item.type} ${item.name} bị trả lại: ${note}`, item.link, "err")
      return { ok: true, msg: `Đã trả lại ${item.type.toLowerCase()} ${item.name} cho người gửi.` }
    },
    withdraw: (id) => {
      const s = get()
      const item = getApprovals(s).find((x) => x.id === id)
      if (!item || item.by !== me()) return
      if (item.kind === "purpose" || item.kind === "consent") {
        const key = item.kind === "purpose" ? "purposes" : "consents"
        set({ [key]: cfgArr(s, item.kind).map((x) => (x.code !== item.ref ? x : { ...x, status: x.everActive ? "Hoạt động" : "Nháp", req: undefined, history: [{ at: nowISO(), who: me(), act: "Rút lại yêu cầu duyệt" }, ...x.history] })) } as Partial<State>)
      } else if (item.kind === "notice") upd((st) => ({ notices: st.notices.map((n) => (n.id === item.ref ? { ...n, status: "Nháp", req: undefined } : n)) }))
      else if (item.kind === "banner") upd((st) => ({ banners: st.banners.map((b) => (b.code !== item.ref ? b : { ...b, versions: b.versions.map((v, i) => (i === 0 ? { ...v, status: "Nháp", req: undefined } : v)) })) }))
      else if (item.kind === "rule") upd((st) => ({ ruleSets: st.ruleSets.map((v) => v.version === Number(item.ref) ? { ...v, status: "Nháp", req: undefined, history: [{ at: nowISO(), who: me(), act: "Rút lại yêu cầu duyệt" }, ...v.history] } : v) }))
      else if (item.kind === "matrix") { const [app, rawVersion] = item.ref.split("|"); upd((st) => ({ matrix: st.matrix.map((m) => m.app === app && m.version === Number(rawVersion) ? { ...m, status: "Nháp", req: undefined, history: [{ at: nowISO(), who: me(), act: "Rút lại yêu cầu duyệt" }, ...m.history] } : m) })) }
      else if (item.kind === "import") upd((st) => ({ imports: st.imports.map((x) => (x.id === item.ref ? { ...x, status: "Nháp", req: undefined } : x)) }))
      s.log("Rút lại yêu cầu duyệt", item.name, "ok", undefined, "Chờ duyệt", "Nháp")
    },

    recordDecision: (o) => {
      const s = get()
      if (!allowed("sim", "view", "Ghi quyết định mô phỏng", o.consent)) throw new Error("Không có quyền sử dụng Simulator trong tenant hiện tại.")
      if (!s.consents.some((c) => c.code === o.consent) || (o.app !== "—" && !s.applications.some((a) => a.id === o.app))) {
        s.log("Ghi quyết định mô phỏng", o.consent, "err", "Consent/Application không thuộc tenant hiện tại")
        throw new Error("Consent hoặc Application không thuộc tenant hiện tại.")
      }
      const pub = s.notices.find((n) => n.consent === o.consent && n.status === "Published")
      const app = s.applications.find((a) => a.id === o.app)
      const property = o.propertyId ? s.properties.find((p) => p.id === o.propertyId && p.applicationId === o.app && p.tenantId === s.currentTenantId) : undefined
      if (o.propertyId && !property) throw new Error("Property không thuộc Application và tenant hiện tại.")
      const id = uid("EV")
      const e: ConsentEvent = {
        id, subject: o.subject, consent: o.consent, version: pub?.v || "—", decision: o.decision, ts: nowISO(), channel: o.channel, app: o.app, property: property?.name || app?.property || "abcmart.vn",
        source: o.source || "Trực tuyến", hash: pub?.hash || fakeHash(o.consent), tx: "tx_" + fakeHash(id).slice(0, 12), ip: "113.161.24.87", ua: "Chrome 130 · Windows 11 (mô phỏng)",
        sensitive: o.sensitive, explicitConfirm: o.explicitConfirm, linkedFrom: o.linkedFrom,
        receipt: (o.decision === "ACCEPTED" || o.decision === "REJECTED") && !o.subject.startsWith("ck_") ? { jti: "rcp_" + fakeHash(id).slice(0, 16), kid: "cmp-2026-07", alg: "ES256", enc: "RSA-OAEP-256 / A256GCM", aud: o.app, exp: "[N] giây (OI-04)", decision: o.decision } : undefined,
      }
      const evType = { ACCEPTED: "CONSENT_ACCEPTED", REJECTED: "CONSENT_REJECTED", WITHDRAWN: "CONSENT_WITHDRAWN", EXPIRED: "CONSENT_EXPIRED", RE_CONSENT: "VERSION_CHANGED", NOT_CONSENTED: "—" }[o.decision]
      const out: OutboxEvent[] = ["CRM chăm sóc khách hàng", "Nền tảng dữ liệu khách hàng (CDP)"].map((dest, i) => ({ id: "evt_" + fakeHash(id + i).slice(0, 6), type: evType, consent: o.consent, subject: o.subject, dest, status: "DELIVERED", at: e.ts, tries: 1 }))
      upd((st) => ({ events: [e, ...st.events], outbox: [...out, ...st.outbox] }))
      get().log(o.decision === "WITHDRAWN" ? "Rút lại consent trong Simulator" : "Ghi quyết định Simulator", e.id, "ok", `applicationId=${o.app}; propertyId=${property?.id || "legacy"}; consentCode=${o.consent}; decision=${o.decision}`)
      return e
    },
    addOffline: (e) => {
      if (!allowed("offline", "edit", "Ghi nhận consent ngoại tuyến", e.consent)) return
      if (!get().consents.some((c) => c.code === e.consent)) { get().log("Ghi nhận consent ngoại tuyến", e.consent, "err", "Consent không thuộc tenant hiện tại"); return }
      upd((s) => ({ events: [e, ...s.events] }))
      get().log("Ghi nhận consent ngoại tuyến", `${e.offline?.id} · ${e.subject} · ${e.consent}`)
    },
    correctEvent: (id, reason, consent, decision) => {
      if (!allowed("offline", "edit", "Hiệu chỉnh evidence", id)) return
      const s = get()
      const orig = s.events.find((x) => x.id === id)
      if (!orig || !s.consents.some((c) => c.code === consent)) { s.log("Hiệu chỉnh evidence", id, "err", "Evidence/Consent không thuộc tenant hiện tại"); return }
      const e: ConsentEvent = { ...orig, id: uid("EV"), ts: nowISO(), consent, decision, correctionOf: id, correctionReason: reason, receipt: undefined, offline: orig.offline ? { ...orig.offline, id: orig.offline.id + "-HC" } : undefined }
      upd((st) => ({ events: [e, ...st.events] }))
      s.log("Hiệu chỉnh evidence", `${id} → ${e.id}`, "ok", reason)
      const dpo = s.memberships.find((m) => m.tenantId === s.currentTenantId && m.status === "ACTIVE" && m.roles.includes("DPO"))
      if (dpo) s.notify(DEMO_USERS[dpo.userId]?.name || dpo.userId, `Có evidence hiệu chỉnh ${e.id} cho ${orig.offline?.id || id}: ${reason}`, "/evidence", "info")
    },
    exportPackage: (p) => {
      if (!allowed("evidence", "edit", "Xuất gói bằng chứng", p.scope)) throw new Error("Không có quyền xuất gói bằng chứng.")
      const s = get()
      if (p.events.some((id) => !s.events.some((e) => e.id === id))) throw new Error("Evidence không thuộc tenant hiện tại.")
      const pkg: EvidencePackage = { ...p, id: "EP-" + new Date().getFullYear() + "-" + String(s.packages.length + 37).padStart(5, "0"), at: nowISO(), by: me(), pdfHash: fakeHash("pdf" + p.events.join()), jsonHash: fakeHash("json" + p.events.join()) }
      upd((st) => ({ packages: [pkg, ...st.packages] }))
      s.log("Xuất gói bằng chứng", pkg.id, "ok", `${p.reason} · ${p.events.length} evidence · SHA-256 PDF ${pkg.pdfHash.slice(0, 12)}…`)
      return pkg
    },
    createRuleDraft: () => {
      if (!allowed("setup", "edit", "Tạo bộ quy tắc", "Re-consent Rules")) return { ok: false, msg: "Không có quyền chỉnh sửa trong tenant hiện tại." }
      const s = get()
      const existing = s.ruleSets.find((x) => x.status === "Nháp" || x.status === "Chờ duyệt" || x.status === "Bị trả lại")
      if (existing) return { ok: false, msg: `Đã có bộ quy tắc R${existing.version} ở trạng thái ${existing.status}.` }
      const active = s.ruleSets.find((x) => x.status === "Hoạt động")
      if (!active) return { ok: false, msg: "Không tìm thấy bộ quy tắc đang Hoạt động." }
      const draft: ReconsentRuleVersion = { ...clone(active), version: active.version + 1, status: "Nháp", at: nowISO(), by: me(), approvedBy: undefined, approvedAt: undefined, req: undefined, returnNote: undefined, history: [{ at: nowISO(), who: me(), act: "Tạo bản nháp", note: `Sao chép từ R${active.version}` }] }
      upd((st) => ({ ruleSets: [active, draft, ...st.ruleSets.filter((x) => x !== active)] }))
      s.log("Tạo bản nháp", `Bộ quy tắc tái đồng ý R${draft.version}`, "ok", `Sao chép từ R${active.version}`)
      return { ok: true, msg: `Đã tạo bản nháp R${draft.version}.` }
    },
    saveRuleDraft: (version, rows, defaultMonths) => {
      if (!allowed("setup", "edit", "Lưu bộ quy tắc", `R${version}`)) return { ok: false, msg: "Không có quyền chỉnh sửa trong tenant hiện tại." }
      const s = get()
      const v = s.ruleSets.find((x) => x.version === version)
      if (!v || !["Nháp", "Bị trả lại"].includes(v.status)) return { ok: false, msg: "Phiên bản không còn cho phép chỉnh sửa." }
      if (!Number.isInteger(defaultMonths) || defaultMonths < 1 || defaultMonths > 120) return { ok: false, msg: "Thời hạn đồng ý mặc định phải từ 1 đến 120 tháng. (MSG-04-03)" }
      if (rows.some((r) => r.locked && !r.material)) return { ok: false, msg: "Các thay đổi tối thiểu và dữ liệu nhạy cảm phải luôn là Trọng yếu." }
      upd((st) => ({ ruleSets: st.ruleSets.map((x) => x.version !== version ? x : { ...x, rows: clone(rows), defaultMonths, status: "Nháp", returnNote: x.returnNote, at: nowISO(), history: [{ at: nowISO(), who: me(), act: "Lưu nháp" }, ...x.history] }) }))
      s.log("Lưu nháp", `Bộ quy tắc tái đồng ý R${version}`, "ok", undefined, undefined, `${defaultMonths} tháng`)
      return { ok: true, msg: `Đã lưu bản nháp R${version}.` }
    },
    submitRule: (version) => {
      if (!allowed("setup", "edit", "Gửi duyệt bộ quy tắc", `R${version}`)) return { ok: false, msg: "Không có quyền chỉnh sửa trong tenant hiện tại." }
      const s = get()
      const v = s.ruleSets.find((x) => x.version === version)
      if (!v || !["Nháp", "Bị trả lại"].includes(v.status)) return { ok: false, msg: "Chỉ bản Nháp hoặc Bị trả lại mới được gửi duyệt." }
      if (!Number.isInteger(v.defaultMonths) || v.defaultMonths < 1 || v.defaultMonths > 120) return { ok: false, msg: "Thời hạn đồng ý mặc định phải từ 1 đến 120 tháng. (MSG-04-03)" }
      const at = nowISO(); const req: PendingRequest = { action: "Cập nhật quy tắc", by: me(), byRole: s.role, at }
      upd((st) => ({ ruleSets: st.ruleSets.map((x) => x.version !== version ? x : { ...x, status: "Chờ duyệt", req, returnNote: undefined, history: [{ at, who: me(), act: "Gửi duyệt" }, ...x.history] }) }))
      s.log("Gửi duyệt", `Bộ quy tắc tái đồng ý R${version}`, "ok", undefined, "Nháp", "Chờ duyệt")
      notifyApprovers("setup", `Bộ quy tắc tái đồng ý R${version} chờ bạn duyệt`, "/notifications")
      return { ok: true, msg: `Đã gửi duyệt bộ quy tắc R${version}.` }
    },
    createMatrixDraft: (app) => {
      if (!allowed("setup", "edit", "Tạo ma trận", app)) return { ok: false, msg: "Không có quyền chỉnh sửa trong tenant hiện tại." }
      const s = get()
      if (!s.applications.some((a) => a.id === app)) return { ok: false, msg: "Ứng dụng không thuộc tenant hiện tại." }
      const existing = s.matrix.find((x) => x.app === app && ["Nháp", "Chờ duyệt", "Bị trả lại"].includes(x.status))
      if (existing) return { ok: false, msg: `Ứng dụng đã có ma trận v${existing.version} ở trạng thái ${existing.status}. (MSG-03-02)` }
      const active = s.matrix.find((x) => x.app === app && x.status === "Hoạt động")
      if (!active) return { ok: false, msg: "Không tìm thấy ma trận hiện hành của ứng dụng." }
      const draft: DependencyMatrix = { ...clone(active), version: active.version + 1, status: "Nháp", at: nowISO(), by: me(), approvedBy: undefined, approvedAt: undefined, req: undefined, returnNote: undefined, history: [{ at: nowISO(), who: me(), act: "Tạo bản nháp", note: `Sao chép từ v${active.version}` }] }
      upd((st) => ({ matrix: [active, draft, ...st.matrix.filter((x) => x !== active)] }))
      s.log("Tạo bản nháp", `Ma trận ${app} v${draft.version}`, "ok", `Sao chép từ v${active.version}`)
      return { ok: true, msg: `Đã tạo bản nháp ma trận v${draft.version}.` }
    },
    saveMatrixDraft: (m) => {
      if (!allowed("setup", "edit", "Lưu ma trận", m.app)) return { ok: false, msg: "Không có quyền chỉnh sửa trong tenant hiện tại." }
      const s = get()
      if (!s.applications.some((a) => a.id === m.app)) return { ok: false, msg: "Ứng dụng không thuộc tenant hiện tại." }
      const current = s.matrix.find((x) => x.app === m.app && x.version === m.version)
      if (!current || !["Nháp", "Bị trả lại"].includes(current.status)) return { ok: false, msg: "Phiên bản ma trận không còn cho phép chỉnh sửa." }
      const codes = m.rows.map((r) => r.fn.trim())
      if (codes.some((x) => !/^FN-\d{2}$/.test(x))) return { ok: false, msg: "Mã chức năng phải có định dạng FN-nn." }
      if (new Set(codes).size !== codes.length) return { ok: false, msg: `Mã chức năng đã tồn tại trong ứng dụng. (MSG-05-01)` }
      upd((st) => ({ matrix: st.matrix.map((x) => x.app === m.app && x.version === m.version ? { ...clone(m), status: "Nháp", at: nowISO(), history: [{ at: nowISO(), who: me(), act: "Lưu nháp" }, ...current.history] } : x) }))
      s.log("Lưu nháp", `Ma trận ${m.app} v${m.version}`)
      return { ok: true, msg: `Đã lưu bản nháp ma trận v${m.version}.` }
    },
    submitMatrix: (app, version) => {
      if (!allowed("setup", "edit", "Gửi duyệt ma trận", app)) return { ok: false, msg: "Không có quyền chỉnh sửa trong tenant hiện tại." }
      const s = get()
      if (!s.applications.some((a) => a.id === app)) return { ok: false, msg: "Ứng dụng không thuộc tenant hiện tại." }
      const m = s.matrix.find((x) => x.app === app && x.version === version)
      if (!m || !["Nháp", "Bị trả lại"].includes(m.status)) return { ok: false, msg: "Chỉ bản Nháp hoặc Bị trả lại mới được gửi duyệt." }
      const appConsents = s.consents.filter((c) => c.status === "Hoạt động" && c.apps.includes(app))
      const optionalPurposes = new Set(appConsents.filter((c) => c.kind === "Tùy chọn").flatMap((c) => c.purposes))
      const invalidOptional = m.rows.flatMap((r) => Object.entries(r.purposes).filter(([p, required]) => required && optionalPurposes.has(p)).map(([p]) => p))[0]
      if (invalidOptional) return { ok: false, msg: `Mục đích ${invalidOptional} thuộc consent tùy chọn nên không được đánh Bắt buộc. (MSG-05-03)` }
      const missing = appConsents.filter((c) => c.kind === "Bắt buộc" && !m.rows.some((r) => r.status !== "Ngừng" && c.purposes.some((p) => p in r.purposes)))
      if (missing.length) return { ok: false, msg: `Consent bắt buộc ${missing[0].code} chưa được gắn với chức năng nào của ứng dụng. (MSG-05-02)` }
      const at = nowISO(); const req: PendingRequest = { action: "Phiên bản ma trận", by: me(), byRole: s.role, at }
      upd((st) => ({ matrix: st.matrix.map((x) => x.app === app && x.version === version ? { ...x, status: "Chờ duyệt", req, returnNote: undefined, history: [{ at, who: me(), act: "Gửi duyệt" }, ...x.history] } : x) }))
      s.log("Gửi duyệt", `Ma trận ${app} v${version}`, "ok", undefined, "Nháp", "Chờ duyệt")
      notifyApprovers("setup", `Ma trận ${app} v${version} chờ bạn duyệt`, "/notifications")
      return { ok: true, msg: `Đã gửi duyệt ma trận v${version}.` }
    },
  }

  function publishNotice(id: string, scheduled: boolean) {
    const s = get()
    const n = s.notices.find((x) => x.id === id)!
    const at = nowISO()
    let reconsent = 0
    upd((st) => ({ notices: st.notices.map((x) => (x.id === id ? { ...x, status: "Published", effectiveAt: scheduled ? at : x.effectiveAt || at } : x.consent === n.consent && x.status === "Published" ? { ...x, status: "Expired" } : x)) }))
    if ((n.material || get().notices.find((x) => x.id === id)?.material) === "Có") {
      // BR-UC03-07: consent ACCEPTED liên quan chuyển RE_CONSENT, phát VERSION_CHANGED
      const cur = currentStates(get().events).filter((c) => c.consent === n.consent && c.decision === "ACCEPTED")
      reconsent = cur.length
      const evs: ConsentEvent[] = cur.map((c) => ({ ...c.last, id: uid("EV"), decision: "RE_CONSENT", ts: at, source: "Trực tuyến", channel: "Hệ thống", receipt: undefined, version: c.last.version, correctionOf: undefined, offline: undefined }))
      upd((st) => ({ events: [...evs, ...st.events] }))
    }
    get().log("Xuất bản phiên bản", `${n.consent} ${n.v}`, "ok", reconsent ? `Trọng yếu: ${reconsent} chủ thể chuyển RE_CONSENT, phát VERSION_CHANGED` : "Không trọng yếu: consent giữ nguyên")
  }
})

/** Trạng thái hiện hành theo cặp chủ thể × consent: sự kiện mới nhất thắng (BRL-08) */
export function currentStates(events: ConsentEvent[]) {
  const map = new Map<string, { subject: string; consent: string; decision: Decision; last: ConsentEvent; count: number }>()
  for (const e of events) {
    const k = e.subject + "|" + e.consent
    const cur = map.get(k)
    if (!cur) map.set(k, { subject: e.subject, consent: e.consent, decision: e.decision, last: e, count: 1 })
    else {
      cur.count++
      if (e.ts > cur.last.ts) { cur.last = e; cur.decision = e.decision }
    }
  }
  return [...map.values()]
}

/** Danh sách đề nghị đang chờ duyệt, gom từ mọi loại đối tượng */
export function getApprovals(s: Pick<State, "applications" | "purposes" | "consents" | "notices" | "banners" | "imports" | "ruleSets" | "matrix">): ApprovalItem[] {
  const L: ApprovalItem[] = []
  const cfg = (kind: "purpose" | "consent", arr: (Purpose | Consent)[]) => arr.filter((x) => (x.status === "Chờ duyệt" || x.status === "Chờ duyệt ngừng") && x.req).forEach((x) => {
    const before = x.everActive ? snap(kind, x, s.applications) : {}
    const after = x.status === "Chờ duyệt ngừng" ? { ...before, "Trạng thái": "Ngừng sử dụng" } : x.revision ? snap(kind, { ...x, ...x.revision } as Purpose, s.applications) : snap(kind, x, s.applications)
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    if (x.status === "Chờ duyệt ngừng") (before as Record<string, unknown>)["Trạng thái"] = "Hoạt động"
    const checks: [boolean, string][] = []
    if (kind === "purpose") {
      const p = (x.revision ? { ...x, ...x.revision } : x) as Purpose
      checks.push([p.items.length > 0, "Có ít nhất một loại dữ liệu trong danh mục hiện hành (BR-UC01-02)"])
      const sens = p.items.some((i) => M.itemByCode(i)?.group === "Nhạy cảm")
      checks.push([!sens, sens ? "Mục đích có dữ liệu nhạy cảm: bắt buộc luồng đồng ý riêng UC-14 (BR-UC01-05)" : "Không có dữ liệu nhạy cảm"])
      checks.push([!p.share || p.recipients.length > 0, "Có chia sẻ thì đã khai báo bên nhận"])
      if (p.child) checks.push([false, "Cờ Trẻ em: luồng người giám hộ thuộc V1.5 (BR-UC01-10)"])
    } else {
      const c = x as Consent
      checks.push([c.purposes.length > 0, "Có ít nhất một mục đích Hoạt động (BR-UC02-02)"])
      checks.push([true, "consent_code đúng định dạng và duy nhất (BR-UC02-01)"])
    }
    L.push({ id: `${kind}:${x.code}`, kind, ref: x.code, mod: "setup", type: label[kind], name: x.code, action: x.req!.action, by: x.req!.by, byRole: x.req!.byRole, at: x.req!.at, rows: keys.map((k) => [k, show((before as Record<string, unknown>)[k]), show((after as Record<string, unknown>)[k])]), checks, link: kind === "purpose" ? "/purposes" : "/consents" })
  })
  cfg("purpose", s.purposes)
  cfg("consent", s.consents)
  s.notices.filter((n) => n.status === "Chờ duyệt" && n.req).forEach((n) => {
    const pub = s.notices.find((x) => x.consent === n.consent && x.status === "Published")
    const f: [string, keyof NoticeVersion["content"]["vi"]][] = [["Loại dữ liệu", "data"], ["Mục đích", "purpose"], ["Bên kiểm soát, xử lý, nhận", "parties"], ["Quyền và nghĩa vụ", "rights"]]
    const rows: [string, string, string][] = f.map(([l, k]) => [l + " (vi)", pub?.content.vi[k] || "—", n.content.vi[k]])
    rows.push(["Bản tiếng Anh", pub ? "Có" : "—", n.content.en.data ? "Có" : "Không"])
    L.push({ id: `notice:${n.id}`, kind: "notice", ref: n.id, mod: "setup", type: "Phiên bản thông báo", name: `${n.consent} ${n.v}`, action: "Xuất bản", by: n.req!.by, byRole: n.req!.byRole, at: n.req!.at, rows,
      checks: [[f.every(([, k]) => n.content.vi[k].trim().length > 0), "Đủ 4 nhóm thông tin tiếng Việt (BR-UC03-02, M1-05)"], [n.suggested !== "Có", `Hệ thống gợi ý nhãn: ${n.suggested === "Có" ? "Trọng yếu – sẽ xin lại đồng ý" : "Không trọng yếu"} (UC-04)`]], link: "/notices" })
  })
  s.banners.forEach((b) => {
    const v = b.versions[0]
    if (v.status !== "Chờ duyệt" || !v.req) return
    const live = b.versions.find((x) => x.status === "Hoạt động")
    const fields: [string, (c: BannerCfg) => string][] = [["Kiểu hiển thị", (c) => M.LAYOUTS[c.layout]], ["Tiêu đề (vi)", (c) => c.title.vi], ["Mô tả (vi)", (c) => c.desc.vi], ["Nút Từ chối", (c) => c.reject.vi], ["Nút Chấp nhận", (c) => c.accept.vi], ["Màu chủ đạo", (c) => c.color], ["Consent hiển thị", (c) => c.consents.join(", ")]]
    L.push({ id: `banner:${b.code}`, kind: "banner", ref: b.code, mod: "banner", type: "Banner", name: `${b.code} v${v.v}`, action: "Xuất bản", by: v.req.by, byRole: v.req.byRole, at: v.req.at, rows: fields.map(([l, fn]) => [l, live ? fn(live.cfg) : "—", fn(v.cfg)]), checks: [[true, "Nút Chấp nhận và Từ chối cùng kiểu, kích thước (BR-UC07-02)"], [true, "Không có lựa chọn tick sẵn (BR-UC07-03)"]], link: `/banners/${b.code}` })
  })
  s.imports.filter((b) => b.status === "Chờ duyệt" && b.req).forEach((b) => {
    L.push({ id: `import:${b.id}`, kind: "import", ref: b.id, mod: "import", type: "Lô import", name: b.id, action: "Ghi lô", by: b.req!.by, byRole: b.req!.byRole, at: b.req!.at, rows: [["Tệp", "—", b.file], ["Số dòng", "—", String(b.rows)], ["Hợp lệ", "—", String(b.ok)], ["Lỗi", "—", String(b.err)], ["Rủi ro (thiếu bằng chứng)", "—", String(b.risk)]], checks: [[b.riskRows.every((r) => r.decision), "Mọi dòng rủi ro đã có quyết định Giữ/Xin lại (BR-UC09-04)"], [true, "Không ghi đè sự kiện mới hơn (BR-UC09-02)"]], link: "/import" })
  })
  s.ruleSets.filter((v) => v.status === "Chờ duyệt" && v.req).forEach((v) => {
    const active = s.ruleSets.find((x) => x.status === "Hoạt động")
    const oldRows = new Map((active?.rows || []).map((r) => [r.change, r.material ? "Trọng yếu" : "Không trọng yếu"]))
    const rows: [string, string, string][] = [["Thời hạn mặc định", active ? `${active.defaultMonths} tháng` : "—", `${v.defaultMonths} tháng`], ...v.rows.map((r) => [r.change, oldRows.get(r.change) || "—", r.material ? "Trọng yếu" : "Không trọng yếu"] as [string, string, string])]
    L.push({ id: `rule:${v.version}`, kind: "rule", ref: String(v.version), mod: "setup", type: "Bộ quy tắc tái đồng ý", name: `R${v.version}`, action: v.req!.action, by: v.req!.by, byRole: v.req!.byRole, at: v.req!.at, rows, checks: [[v.defaultMonths >= 1 && v.defaultMonths <= 120, "Thời hạn mặc định từ 1 đến 120 tháng (BR-UC04-05)"], [v.rows.every((r) => !r.locked || r.material), "Các thay đổi tối thiểu và dữ liệu nhạy cảm luôn là Trọng yếu (BR-UC04-01, 03)"]], link: "/rules" })
  })
  s.matrix.filter((m) => m.status === "Chờ duyệt" && m.req).forEach((m) => {
    const active = s.matrix.find((x) => x.app === m.app && x.status === "Hoạt động")
    const line = (x: DependencyMatrix | undefined) => x ? x.rows.map((r) => `${r.fn} ${r.name}: ${Object.entries(r.purposes).map(([p, req]) => `${p}=${req ? "Bắt buộc" : "Không bắt buộc"}`).join(", ") || "Không liên quan"}`).join(" | ") : "—"
    const appConsents = s.consents.filter((c) => c.status === "Hoạt động" && c.apps.includes(m.app))
    const optional = new Set(appConsents.filter((c) => c.kind === "Tùy chọn").flatMap((c) => c.purposes))
    const noInvalidOptional = !m.rows.some((r) => Object.entries(r.purposes).some(([p, required]) => required && optional.has(p)))
    const allRequiredMapped = appConsents.filter((c) => c.kind === "Bắt buộc").every((c) => m.rows.some((r) => r.status !== "Ngừng" && c.purposes.some((p) => p in r.purposes)))
    L.push({ id: `matrix:${m.app}:${m.version}`, kind: "matrix", ref: `${m.app}|${m.version}`, mod: "setup", type: "Ma trận phụ thuộc", name: `${m.app} v${m.version}`, action: m.req!.action, by: m.req!.by, byRole: m.req!.byRole, at: m.req!.at, rows: [["Phiên bản", active ? `v${active.version}` : "—", `v${m.version}`], ["Hành vi khi từ chối", active?.onReject || "—", m.onReject], ["Chức năng và phụ thuộc", line(active), line(m)]], checks: [[allRequiredMapped, "Mọi consent Bắt buộc đã gắn với ít nhất một chức năng (EX-01)"], [noInvalidOptional, "Không có purpose của consent Tùy chọn bị đánh Bắt buộc (EX-02)"]], link: "/rules" })
  })
  return L.sort((a, b) => (a.at > b.at ? 1 : -1))
}

/** Tiện ích hook: quyền của vai trò đang xem */
export function useCan() {
  const tenantId = useStore((s) => s.currentTenantId)
  const userId = useStore((s) => s.currentUserId)
  const role = useStore((s) => s.role)
  const perm = useStore((s) => s.perm)
  const memberships = useStore((s) => s.memberships)
  const authenticated = useStore((s) => s.authenticated)
  return (m: Mod, a: Act = "view") => {
    if (!authenticated) return false
    const membership = memberships.find((x) => x.tenantId === tenantId && x.userId === userId && x.status === "ACTIVE")
    return canWithEffectiveRole(membership, role, perm, m, a)
  }
}
export const useMe = () => useStore(currentActor)
