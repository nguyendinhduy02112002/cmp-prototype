import type { TenantProperty } from "./types"

export const PROPERTY_STORAGE_KEY = "cmp-tenant-properties-v1"
export const PROPERTY_CODE_RE = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/
const ORIGIN_RE = /^https:\/\/([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)(?::\d{1,5})?$/i
const MOBILE_ID_RE = /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9_-]*)+$/
let memory: Record<string, TenantProperty[]> = {}

export interface PropertyInput { name: string; code: string; type: TenantProperty["type"]; origin?: string; packageName?: string; bundleId?: string; description?: string }
export type PropertyErrors = Partial<Record<keyof PropertyInput, string>>

const valid = (tenantId: string, p: unknown): p is TenantProperty => {
  if (!p || typeof p !== "object") return false
  const x = p as Partial<TenantProperty>
  return x.tenantId === tenantId && typeof x.id === "string" && typeof x.applicationId === "string" && typeof x.name === "string"
    && typeof x.code === "string" && PROPERTY_CODE_RE.test(x.code) && ["WEB", "ANDROID", "IOS"].includes(String(x.type))
    && ["ACTIVE", "INACTIVE"].includes(String(x.status)) && typeof x.createdAt === "string" && typeof x.updatedAt === "string" && typeof x.createdBy === "string"
}

export function readPropertySnapshot(): Record<string, TenantProperty[]> {
  let raw: unknown = memory
  if (typeof window !== "undefined") { try { raw = JSON.parse(window.localStorage.getItem(PROPERTY_STORAGE_KEY) || "{}") } catch { raw = {} } }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(Object.entries(raw).map(([tenantId, rows]) => [tenantId, Array.isArray(rows) ? rows.filter((p) => valid(tenantId, p)) : []]))
}
export function persistTenantProperties(tenantId: string, properties: TenantProperty[]) {
  const snapshot = { ...readPropertySnapshot(), [tenantId]: properties.map((p) => ({ ...p })) }; memory = snapshot
  if (typeof window !== "undefined") window.localStorage.setItem(PROPERTY_STORAGE_KEY, JSON.stringify(snapshot))
}

export function validatePropertyInput(input: PropertyInput, properties: TenantProperty[], applicationId: string, propertyId?: string) {
  const value = { ...input, name: input.name.trim(), code: input.code.trim().toUpperCase(), origin: input.origin?.trim() || "", packageName: input.packageName?.trim() || "", bundleId: input.bundleId?.trim() || "", description: input.description?.trim() || "" }
  const errors: PropertyErrors = {}
  if (!value.name) errors.name = "Tên Property là bắt buộc."
  else if (value.name.length > 100) errors.name = "Tên Property không được vượt quá 100 ký tự."
  else if (properties.some((p) => p.id !== propertyId && p.applicationId === applicationId && p.name.toLowerCase() === value.name.toLowerCase())) errors.name = "Tên Property đã tồn tại trong Application này."
  if (!value.code) errors.code = "Mã Property là bắt buộc."
  else if (value.code.length > 50 || !PROPERTY_CODE_RE.test(value.code)) errors.code = "Dùng 1–50 ký tự in hoa, số và dấu gạch ngang; bắt đầu bằng chữ."
  else if (properties.some((p) => p.id !== propertyId && p.applicationId === applicationId && p.code === value.code)) errors.code = "Mã Property đã tồn tại trong Application này."
  if (value.type === "WEB") { if (!ORIGIN_RE.test(value.origin)) errors.origin = "Origin phải có dạng https://host[:port], không có đường dẫn hoặc ký tự đại diện." }
  if (value.type === "ANDROID" && !MOBILE_ID_RE.test(value.packageName)) errors.packageName = "Package name không hợp lệ, ví dụ com.example.retail."
  if (value.type === "IOS" && !MOBILE_ID_RE.test(value.bundleId)) errors.bundleId = "Bundle ID không hợp lệ, ví dụ com.example.retail."
  const technical = value.type === "WEB" ? value.origin.toLowerCase() : value.type === "ANDROID" ? value.packageName.toLowerCase() : value.bundleId.toLowerCase()
  if (technical && properties.some((p) => p.id !== propertyId && (p.origin || p.packageName || p.bundleId || "").toLowerCase() === technical)) errors[value.type === "WEB" ? "origin" : value.type === "ANDROID" ? "packageName" : "bundleId"] = "Định danh kỹ thuật đã được dùng bởi Property khác trong tenant."
  if (value.description.length > 500) errors.description = "Mô tả không được vượt quá 500 ký tự."
  return { value, errors }
}

export const propertyTechnicalId = (p: TenantProperty) => p.type === "WEB" ? p.origin || "—" : p.type === "ANDROID" ? p.packageName || "—" : p.bundleId || "—"
