import type { TenantApplication } from "./types"

export const APPLICATION_STORAGE_KEY = "cmp-tenant-applications-v1"
export const APPLICATION_CODE_RE = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/

let memorySnapshot: Record<string, TenantApplication[]> = {}

const valid = (tenantId: string, value: unknown): value is TenantApplication => {
  if (!value || typeof value !== "object") return false
  const a = value as Partial<TenantApplication>
  return a.tenantId === tenantId && typeof a.id === "string" && !!a.id && typeof a.name === "string" && !!a.name
    && typeof a.code === "string" && APPLICATION_CODE_RE.test(a.code) && ["WEB", "SYSTEM", "MOBILE"].includes(String(a.type))
    && (a.propertyId === undefined || typeof a.propertyId === "string") && typeof a.property === "string" && ["ACTIVE", "INACTIVE"].includes(String(a.status))
    && typeof a.createdAt === "string" && typeof a.updatedAt === "string" && typeof a.createdBy === "string"
}

export function readApplicationSnapshot(): Record<string, TenantApplication[]> {
  let raw: unknown = memorySnapshot
  if (typeof window !== "undefined") {
    try { raw = JSON.parse(window.localStorage.getItem(APPLICATION_STORAGE_KEY) || "{}") }
    catch { raw = {} }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(Object.entries(raw).map(([tenantId, apps]) => [tenantId, Array.isArray(apps) ? apps.filter((a) => valid(tenantId, a)) : []]))
}

export function persistTenantApplications(tenantId: string, applications: TenantApplication[]) {
  const snapshot = { ...readApplicationSnapshot(), [tenantId]: applications.map((a) => ({ ...a })) }
  memorySnapshot = snapshot
  if (typeof window !== "undefined") window.localStorage.setItem(APPLICATION_STORAGE_KEY, JSON.stringify(snapshot))
}

export interface ApplicationInput {
  name: string
  code: string
  type: TenantApplication["type"]
  propertyId?: string
  description?: string
}

export type ApplicationErrors = Partial<Record<keyof ApplicationInput, string>>

export function validateApplicationInput(input: ApplicationInput, applications: TenantApplication[], applicationId?: string): { value: ApplicationInput; errors: ApplicationErrors } {
  const value = { ...input, name: input.name.trim(), code: input.code.trim().toUpperCase(), description: input.description?.trim() || "" }
  const errors: ApplicationErrors = {}
  if (!value.name) errors.name = "Tên ứng dụng là bắt buộc."
  else if (value.name.length > 100) errors.name = "Tên ứng dụng không được vượt quá 100 ký tự."
  if (!value.code) errors.code = "Mã ứng dụng là bắt buộc."
  else if (value.code.length > 50 || !APPLICATION_CODE_RE.test(value.code)) errors.code = "Dùng 1–50 ký tự in hoa, số và dấu gạch ngang; bắt đầu bằng chữ."
  else if (applications.some((a) => a.id !== applicationId && a.code.toUpperCase() === value.code)) errors.code = "Mã ứng dụng đã tồn tại trong tenant này."
  if (applications.some((a) => a.id !== applicationId && a.name.toLowerCase() === value.name.toLowerCase())) errors.name = "Tên ứng dụng đã tồn tại trong tenant này."
  if (!["WEB", "SYSTEM", "MOBILE"].includes(value.type)) errors.type = "Loại ứng dụng không hợp lệ."
  if ((value.description || "").length > 500) errors.description = "Mô tả không được vượt quá 500 ký tự."
  return { value, errors }
}
