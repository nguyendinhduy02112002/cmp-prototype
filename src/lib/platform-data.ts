import type { Tenant } from "./types"

export type PlatformRole = "Platform Administrator" | "Platform Viewer"
export interface PlatformActor { id: string; name: string; role: PlatformRole | null }
export interface PlatformAuditEvent {
  id: string
  actorId: string
  actorName: string
  role: PlatformRole
  action: "TENANT_CREATED" | "TENANT_UPDATED" | "TENANT_ACTIVATED" | "TENANT_SUSPENDED"
  targetTenantId?: string
  at: string
  metadata: Record<string, string>
}
export interface PlatformSnapshot {
  tenants: Tenant[]
  audit: PlatformAuditEvent[]
  actorId: string
}

export const PLATFORM_STORAGE_KEY = "cmp-platform-state-v1"
export const PLATFORM_ACTORS: PlatformActor[] = [
  { id: "platform-admin", name: "Phạm Gia Bảo", role: "Platform Administrator" },
  { id: "platform-viewer", name: "Hoàng Thanh Mai", role: "Platform Viewer" },
  { id: "tenant-only-admin", name: "Trần Hoàng Long", role: null },
]

export const seedPlatformTenants = (): Tenant[] => {
  const now = "2026-10-01T08:00:00.000Z"
  return [
    { id: "tenant-retail", code: "ABC-RETAIL", name: "ABC Retail", status: "ACTIVE", description: "Khối bán lẻ minh họa", contactEmail: "privacy@abcmart.vn", createdAt: "2026-07-01T03:00:00.000Z", updatedAt: now },
    { id: "tenant-finance", code: "ABC-FIN", name: "ABC Finance", status: "ACTIVE", description: "Khối tài chính minh họa", contactEmail: "privacy@abcfinance.vn", createdAt: "2026-08-15T03:00:00.000Z", updatedAt: now },
    { id: "tenant-health", code: "ABC-HEALTH", name: "ABC Health", status: "ACTIVE", description: "Khối chăm sóc sức khỏe minh họa", contactEmail: "privacy@abchealth.vn", createdAt: "2026-09-20T03:00:00.000Z", updatedAt: now },
  ]
}

const safeTenant = (value: unknown): value is Tenant => {
  if (!value || typeof value !== "object") return false
  const x = value as Partial<Tenant>
  return typeof x.id === "string" && typeof x.code === "string" && typeof x.name === "string" && (x.status === "ACTIVE" || x.status === "SUSPENDED")
}

export function readPlatformSnapshot(): PlatformSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = JSON.parse(window.localStorage.getItem(PLATFORM_STORAGE_KEY) || "null") as Partial<PlatformSnapshot> | null
    if (!raw || !Array.isArray(raw.tenants) || !raw.tenants.every(safeTenant) || !Array.isArray(raw.audit)) return null
    const actorId = PLATFORM_ACTORS.some((a) => a.id === raw.actorId) ? raw.actorId! : "tenant-only-admin"
    return { tenants: raw.tenants, audit: raw.audit as PlatformAuditEvent[], actorId }
  } catch { return null }
}

export const readPlatformTenants = () => readPlatformSnapshot()?.tenants || seedPlatformTenants()

export function writePlatformSnapshot(snapshot: PlatformSnapshot) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PLATFORM_STORAGE_KEY, JSON.stringify(snapshot))
}
