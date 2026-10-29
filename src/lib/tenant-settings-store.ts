import { create } from "zustand"
import { hasPermission, useStore } from "./store"
import { defaultTenantSettings, readTenantSettingsMap, sanitizeTenantSettings, writeTenantSettingsMap, type TenantSettings } from "./tenant-settings-data"

type EditableSettings = Omit<TenantSettings, "tenantId" | "updatedAt">
interface TenantSettingsState {
  byTenant: Record<string, TenantSettings>
  getForTenant: (tenantId: string) => TenantSettings
  ensureTenant: (tenantId: string) => TenantSettings
  saveForTenant: (tenantId: string, input: EditableSettings) => { ok: boolean; msg: string; errors?: Partial<Record<keyof EditableSettings, string>>; changed?: string[] }
}

export const useTenantSettingsStore = create<TenantSettingsState>((set, get) => ({
  byTenant: readTenantSettingsMap(),
  getForTenant: (tenantId) => get().byTenant[tenantId] || defaultTenantSettings(tenantId),
  ensureTenant: (tenantId) => {
    const existing = get().byTenant[tenantId]
    if (existing) return existing
    const next = defaultTenantSettings(tenantId); const byTenant = { ...get().byTenant, [tenantId]: next }
    set({ byTenant }); writeTenantSettingsMap(byTenant); return next
  },
  saveForTenant: (tenantId, input) => {
    const tenantState = useStore.getState()
    const tenant = tenantState.tenants.find((t) => t.id === tenantId && t.status === "ACTIVE")
    if (!tenant || tenantState.currentTenantId !== tenantId) return { ok: false, msg: "Tenant không hoạt động hoặc không phải workspace hiện tại." }
    if (!hasPermission(tenantState, "settings", "edit")) {
      tenantState.log("Cập nhật cài đặt tenant", "Tenant Settings", "err", "fields=permission_denied")
      return { ok: false, msg: "Vai trò hiệu lực không có quyền sửa cài đặt tenant." }
    }
    const errors: Partial<Record<keyof EditableSettings, string>> = {}
    const email = input.privacyContactEmail.trim()
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.privacyContactEmail = "Email không hợp lệ."
    if (input.privacyContactPhone && !/^[0-9+().\s-]{6,30}$/.test(input.privacyContactPhone)) errors.privacyContactPhone = "Số điện thoại không hợp lệ."
    if (Object.keys(errors).length) return { ok: false, msg: "Vui lòng kiểm tra dữ liệu nhập.", errors }
    const before = get().getForTenant(tenantId)
    const clean = sanitizeTenantSettings(tenantId, { ...input, tenantId, updatedAt: new Date().toISOString() })
    const fields = (Object.keys(input) as (keyof EditableSettings)[]).filter((key) => before[key] !== clean[key])
    if (!fields.length) return { ok: true, msg: "Không có thay đổi để lưu.", changed: [] }
    const byTenant = { ...get().byTenant, [tenantId]: clean }
    set({ byTenant }); writeTenantSettingsMap(byTenant)
    tenantState.log("Cập nhật cài đặt tenant", "Tenant Settings", "ok", `fields=${fields.join(",")}`)
    return { ok: true, msg: "Đã lưu cài đặt tenant.", changed: fields as string[] }
  },
}))

export const useCurrentTenantSettings = () => {
  const tenantId = useStore((s) => s.currentTenantId)
  const stored = useTenantSettingsStore((s) => tenantId ? s.byTenant[tenantId] : undefined)
  return stored || defaultTenantSettings(tenantId || "unknown")
}
