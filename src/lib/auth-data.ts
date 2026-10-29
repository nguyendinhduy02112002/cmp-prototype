import type { TenantMembership } from "./types"

export interface TenantAccount {
  id: string
  tenantId: string
  name: string
  email: string
  /** Demo-only credential digest. This is not production authentication. */
  passwordDigest: string
  roles: TenantMembership["roles"]
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
}

export interface AuthSnapshot {
  accounts: TenantAccount[]
  memberships: TenantMembership[]
}

const AUTH_KEY = "cmp-tenant-accounts-v1"
const digest = (password: string) => `demo:${Array.from(password).reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7).toString(16)}`
const seedAt = "2026-03-15T03:00:00.000Z"

export const seedAuthSnapshot: AuthSnapshot = {
  accounts: [
    ["user-staff", "tenant-retail", "Nguyễn Minh Anh", "staff@demo.cmp", ["Nhân viên"]],
    ["user-dpo", "tenant-retail", "Trần Thu Hà", "dpo@demo.cmp", ["DPO"]],
    ["user-admin", "tenant-retail", "Lê Quốc Bảo", "admin@demo.cmp", ["Admin"]],
    ["user-finance-admin", "tenant-finance", "Phạm Minh Đức", "admin.finance@demo.cmp", ["Admin"]],
    ["user-finance-dpo", "tenant-finance", "Nguyễn Thu Trang", "dpo.finance@demo.cmp", ["DPO"]],
    ["user-health-staff", "tenant-health", "Đặng Hải An", "staff.health@demo.cmp", ["Nhân viên"]],
    ["user-health-admin", "tenant-health", "Vũ Minh Anh", "admin.health@demo.cmp", ["Admin", "DPO"]],
    ["user-health-dpo", "tenant-health", "Bùi Ngọc Lan", "dpo.health@demo.cmp", ["DPO"]],
  ].map(([id, tenantId, name, email, roles]) => ({
    id: id as string, tenantId: tenantId as string, name: name as string, email: email as string,
    roles: roles as TenantMembership["roles"], passwordDigest: digest("Demo123!"), status: "ACTIVE" as const, createdAt: seedAt,
  })),
  memberships: [],
}
seedAuthSnapshot.memberships = seedAuthSnapshot.accounts.map(({ id: userId, tenantId, roles }) => ({ userId, tenantId, roles, status: "ACTIVE" }))

export function readAuthSnapshot(): AuthSnapshot {
  if (typeof window === "undefined") return seedAuthSnapshot
  try {
    const raw = JSON.parse(window.localStorage.getItem(AUTH_KEY) || "null") as Partial<AuthSnapshot> | null
    if (!raw || !Array.isArray(raw.accounts) || !Array.isArray(raw.memberships)) return seedAuthSnapshot
    const accounts = raw.accounts.filter((a): a is TenantAccount => !!a && typeof a.id === "string" && typeof a.tenantId === "string" && typeof a.email === "string" && typeof a.passwordDigest === "string" && Array.isArray(a.roles))
    const memberships = raw.memberships.filter((m): m is TenantMembership => !!m && typeof m.userId === "string" && typeof m.tenantId === "string" && Array.isArray(m.roles) && (m.status === "ACTIVE" || m.status === "INACTIVE"))
    const tenantForUser = new Map<string, string>()
    const validMemberships = memberships.filter((m) => {
      const prior = tenantForUser.get(m.userId)
      if (prior && prior !== m.tenantId) return false
      tenantForUser.set(m.userId, m.tenantId)
      return true
    })
    const validAccounts = accounts.filter((a) => tenantForUser.get(a.id) === a.tenantId)
    return { accounts: validAccounts, memberships: validMemberships.filter((m) => validAccounts.some((a) => a.id === m.userId && a.tenantId === m.tenantId)) }
  } catch { return seedAuthSnapshot }
}

export function writeAuthSnapshot(snapshot: AuthSnapshot) {
  if (typeof window !== "undefined") window.localStorage.setItem(AUTH_KEY, JSON.stringify(snapshot))
}

export function demoPasswordDigest(password: string) { return digest(password) }
