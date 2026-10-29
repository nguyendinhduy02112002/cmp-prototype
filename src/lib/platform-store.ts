import { create } from "zustand"
import { createEmptyTenantWorkspace, useStore } from "./store"
import { PLATFORM_ACTORS, readPlatformSnapshot, seedPlatformTenants, writePlatformSnapshot, type PlatformActor, type PlatformAuditEvent, type PlatformRole, type PlatformSnapshot } from "./platform-data"
import type { Tenant, TenantStatus } from "./types"
import { initializeTenantSettings } from "./tenant-settings-data"

export type PlatformAction = "dashboard.view" | "tenants.view" | "tenants.create" | "tenants.edit" | "tenants.status" | "audit.view"
const PLATFORM_PERMISSIONS: Record<PlatformRole, PlatformAction[]> = {
  "Platform Administrator": ["dashboard.view", "tenants.view", "tenants.create", "tenants.edit", "tenants.status", "audit.view"],
  "Platform Viewer": ["dashboard.view", "tenants.view"],
}

export const canPlatform = (actor: PlatformActor | undefined, action: PlatformAction) => !!actor?.role && PLATFORM_PERMISSIONS[actor.role].includes(action)
export const TENANT_CODE_RE = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/

interface TenantInput { name: string; code: string; description?: string; contactEmail?: string; initialAdminName: string; initialAdminEmail: string; initialAdminPassword: string }
interface PlatformState extends PlatformSnapshot {
  setActor: (actorId: string) => boolean
  getActor: () => PlatformActor | undefined
  createTenant: (input: TenantInput) => { ok: boolean; msg: string; tenantId?: string; errors?: Partial<Record<keyof TenantInput, string>> }
  updateTenant: (tenantId: string, input: Pick<TenantInput, "name" | "description" | "contactEmail">) => { ok: boolean; msg: string }
  setTenantStatus: (tenantId: string, status: TenantStatus) => { ok: boolean; msg: string }
}

const persisted = readPlatformSnapshot()
const initial: PlatformSnapshot = persisted || { tenants: seedPlatformTenants(), audit: [], actorId: "platform-admin" }

export const usePlatformStore = create<PlatformState>((set, get) => {
  const actor = () => PLATFORM_ACTORS.find((a) => a.id === get().actorId)
  const commit = (patch: Partial<PlatformSnapshot>) => {
    const next = { tenants: patch.tenants || get().tenants, audit: patch.audit || get().audit, actorId: patch.actorId || get().actorId }
    set(next)
    writePlatformSnapshot(next)
  }
  const audit = (action: PlatformAuditEvent["action"], tenant: Tenant, metadata: Record<string, string>) => {
    const a = actor()
    if (!a?.role) return
    const event: PlatformAuditEvent = { id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, actorId: a.id, actorName: a.name, role: a.role, action, targetTenantId: tenant.id, at: new Date().toISOString(), metadata }
    commit({ audit: [event, ...get().audit] })
  }
  return {
    ...initial,
    setActor: (actorId) => {
      if (!PLATFORM_ACTORS.some((a) => a.id === actorId)) { commit({ actorId: "tenant-only-admin" }); return false }
      commit({ actorId }); return true
    },
    getActor: actor,
    createTenant: (input) => {
      if (!canPlatform(actor(), "tenants.create")) return { ok: false, msg: "Bạn không có quyền tạo tenant." }
      const name = input.name.trim(); const code = input.code.trim().toUpperCase(); const email = input.contactEmail?.trim() || ""
      const initialAdminName = input.initialAdminName.trim(); const initialAdminEmail = input.initialAdminEmail.trim().toLowerCase()
      const errors: Partial<Record<keyof TenantInput, string>> = {}
      if (!name) errors.name = "Tên tổ chức là bắt buộc."
      if (!code) errors.code = "Mã tenant là bắt buộc."
      else if (!TENANT_CODE_RE.test(code)) errors.code = "Dùng chữ in hoa, số và dấu gạch ngang; bắt đầu bằng chữ."
      else if (get().tenants.some((t) => t.code.toUpperCase() === code)) errors.code = "Mã tenant đã tồn tại."
      if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.contactEmail = "Email không hợp lệ."
      if (!initialAdminName) errors.initialAdminName = "Họ tên quản trị viên ban đầu là bắt buộc."
      if (!/^\S+@\S+\.\S+$/.test(initialAdminEmail)) errors.initialAdminEmail = "Email đăng nhập không hợp lệ."
      else if (useStore.getState().accounts.some((a) => a.email.toLowerCase() === initialAdminEmail)) errors.initialAdminEmail = "Email đã thuộc về một tài khoản tenant khác."
      if (input.initialAdminPassword.length < 8) errors.initialAdminPassword = "Mật khẩu cần ít nhất 8 ký tự."
      if (Object.keys(errors).length) return { ok: false, msg: "Vui lòng kiểm tra dữ liệu nhập.", errors }
      const now = new Date().toISOString()
      const tenant: Tenant = { id: `tenant-${code.toLowerCase()}-${Date.now().toString(36)}`, code, name, status: "ACTIVE", description: input.description?.trim(), contactEmail: email || undefined, createdAt: now, updatedAt: now }
      const tenants = [...get().tenants, tenant]
      commit({ tenants })
      useStore.setState((s) => ({ tenants, workspaces: { ...s.workspaces, [tenant.id]: createEmptyTenantWorkspace() } }))
      const provisioned = useStore.getState().provisionTenantAdmin(tenant.id, { name: initialAdminName, email: initialAdminEmail, password: input.initialAdminPassword })
      if (!provisioned.ok) return { ok: false, msg: provisioned.msg }
      initializeTenantSettings(tenant.id)
      audit("TENANT_CREATED", tenant, { code: tenant.code, organizationName: tenant.name, status: tenant.status, initialAdminCreated: "true" })
      return { ok: true, msg: `Đã tạo tenant ${tenant.name}.`, tenantId: tenant.id }
    },
    updateTenant: (tenantId, input) => {
      if (!canPlatform(actor(), "tenants.edit")) return { ok: false, msg: "Bạn không có quyền sửa tenant." }
      const current = get().tenants.find((t) => t.id === tenantId)
      if (!current) return { ok: false, msg: "Không tìm thấy tenant." }
      const name = input.name.trim(); const email = input.contactEmail?.trim() || ""
      if (!name) return { ok: false, msg: "Tên tổ chức là bắt buộc." }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, msg: "Email không hợp lệ." }
      const next = { ...current, name, description: input.description?.trim(), contactEmail: email || undefined, updatedAt: new Date().toISOString() }
      const tenants = get().tenants.map((t) => t.id === tenantId ? next : t)
      commit({ tenants }); useStore.setState({ tenants })
      audit("TENANT_UPDATED", next, { code: next.code, changedFields: "name,description,contactEmail" })
      return { ok: true, msg: "Đã cập nhật thông tin tenant." }
    },
    setTenantStatus: (tenantId, status) => {
      if (!canPlatform(actor(), "tenants.status")) return { ok: false, msg: "Bạn không có quyền đổi trạng thái tenant." }
      const current = get().tenants.find((t) => t.id === tenantId)
      if (!current) return { ok: false, msg: "Không tìm thấy tenant." }
      if (current.status === status) return { ok: true, msg: "Tenant đã ở trạng thái này." }
      const next = { ...current, status, updatedAt: new Date().toISOString() }
      const tenants = get().tenants.map((t) => t.id === tenantId ? next : t)
      commit({ tenants }); useStore.setState({ tenants })
      audit(status === "ACTIVE" ? "TENANT_ACTIVATED" : "TENANT_SUSPENDED", next, { code: next.code, status })
      return { ok: true, msg: status === "ACTIVE" ? "Đã kích hoạt tenant." : "Đã tạm ngừng tenant; dữ liệu được giữ nguyên." }
    },
  }
})

export const usePlatformActor = () => usePlatformStore((s) => PLATFORM_ACTORS.find((a) => a.id === s.actorId))
export const usePlatformCan = (action: PlatformAction) => usePlatformStore((s) => canPlatform(PLATFORM_ACTORS.find((a) => a.id === s.actorId), action))
