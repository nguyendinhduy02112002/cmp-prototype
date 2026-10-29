export type TenantLanguage = "vi" | "en"
export type TenantDateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"
export type TenantTimeZone = "Asia/Ho_Chi_Minh" | "Asia/Singapore" | "UTC"

export interface TenantSettings {
  tenantId: string
  defaultLanguage: TenantLanguage
  timeZone: TenantTimeZone
  dateFormat: TenantDateFormat
  privacyContactName: string
  privacyContactEmail: string
  privacyContactPhone: string
  privacyContactDepartment: string
  updatedAt?: string
}

export const TENANT_SETTINGS_STORAGE_KEY = "cmp-tenant-settings-v1"
export const LANGUAGE_OPTIONS: [TenantLanguage, string][] = [["vi", "Tiếng Việt"], ["en", "English"]]
export const TIME_ZONE_OPTIONS: TenantTimeZone[] = ["Asia/Ho_Chi_Minh", "Asia/Singapore", "UTC"]
export const DATE_FORMAT_OPTIONS: TenantDateFormat[] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]

export const defaultTenantSettings = (tenantId: string): TenantSettings => ({
  tenantId,
  defaultLanguage: tenantId === "tenant-finance" ? "en" : "vi",
  timeZone: tenantId === "tenant-finance" ? "Asia/Singapore" : "Asia/Ho_Chi_Minh",
  dateFormat: "DD/MM/YYYY",
  privacyContactName: "",
  privacyContactEmail: "",
  privacyContactPhone: "",
  privacyContactDepartment: "",
})

export function sanitizeTenantSettings(tenantId: string, value: unknown): TenantSettings {
  const fallback = defaultTenantSettings(tenantId)
  if (!value || typeof value !== "object") return fallback
  const raw = value as Partial<TenantSettings>
  const text = (v: unknown) => typeof v === "string" ? v.slice(0, 200) : ""
  const email = text(raw.privacyContactEmail)
  return {
    tenantId,
    defaultLanguage: raw.defaultLanguage === "vi" || raw.defaultLanguage === "en" ? raw.defaultLanguage : fallback.defaultLanguage,
    timeZone: TIME_ZONE_OPTIONS.includes(raw.timeZone as TenantTimeZone) ? raw.timeZone as TenantTimeZone : fallback.timeZone,
    dateFormat: DATE_FORMAT_OPTIONS.includes(raw.dateFormat as TenantDateFormat) ? raw.dateFormat as TenantDateFormat : fallback.dateFormat,
    privacyContactName: text(raw.privacyContactName),
    privacyContactEmail: !email || /^\S+@\S+\.\S+$/.test(email) ? email : "",
    privacyContactPhone: text(raw.privacyContactPhone),
    privacyContactDepartment: text(raw.privacyContactDepartment),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  }
}

export function readTenantSettingsMap(): Record<string, TenantSettings> {
  if (typeof window === "undefined") return {}
  try {
    const raw = JSON.parse(window.localStorage.getItem(TENANT_SETTINGS_STORAGE_KEY) || "{}") as Record<string, unknown>
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
    return Object.fromEntries(Object.entries(raw).map(([tenantId, value]) => [tenantId, sanitizeTenantSettings(tenantId, value)]))
  } catch { return {} }
}

export function writeTenantSettingsMap(settings: Record<string, TenantSettings>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TENANT_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function initializeTenantSettings(tenantId: string) {
  const all = readTenantSettingsMap()
  if (!all[tenantId]) {
    all[tenantId] = defaultTenantSettings(tenantId)
    writeTenantSettingsMap(all)
  }
  return all[tenantId]
}

export function formatDateForTenant(iso: string | undefined, settings: TenantSettings) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: settings.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value || ""
  const y = get("year"), m = get("month"), day = get("day")
  if (settings.dateFormat === "MM/DD/YYYY") return `${m}/${day}/${y}`
  if (settings.dateFormat === "YYYY-MM-DD") return `${y}-${m}-${day}`
  return `${day}/${m}/${y}`
}
