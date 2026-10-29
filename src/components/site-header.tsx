import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationBell } from "@/components/cmp/notifs"
import { NativeSelect } from "@/components/cmp/kit"
import { currentActor, DEMO_USERS, useStore } from "@/lib/store"
import { msg, useUi } from "@/components/cmp/approval"
import { useGuidedDemo } from "@/components/cmp/guided-demo"
import type { Role } from "@/lib/types"
import { useLocation, useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { defaultTenantSettings } from "@/lib/tenant-settings-data"
import { useTenantSettingsStore } from "@/lib/tenant-settings-store"

/** Header CMP: phạm vi, chuông thông báo, bộ chọn vai trò (thay ô tìm kiếm và liên kết ngoài của template) */
export function SiteHeader() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const role = useStore((s) => s.role)
  const setRole = useStore((s) => s.setRole)
  const setPersona = useStore((s) => s.setPersona)
  const switchTenant = useStore((s) => s.switchTenant)
  const tenants = useStore((s) => s.tenants)
  const memberships = useStore((s) => s.memberships)
  const tenantId = useStore((s) => s.currentTenantId)
  const userId = useStore((s) => s.currentUserId)
  const properties = useStore((s) => s.properties)
  const storedTenantSettings = useTenantSettingsStore((s) => tenantId ? s.byTenant[tenantId] : undefined)
  const tenantSettings = storedTenantSettings || defaultTenantSettings(tenantId || "unknown")
  const name = useStore(currentActor)
  const membership = memberships.find((m) => m.tenantId === tenantId && m.userId === userId && m.status === "ACTIVE")
  const tenantOptions = tenants.filter((t) => t.status === "ACTIVE" && memberships.some((m) => m.tenantId === t.id && m.userId === userId && m.status === "ACTIVE")).map((t) => [t.id, `${t.name} · ${t.code}`] as [string, string])
  const personaOptions = memberships.filter((m) => m.tenantId === tenantId && m.status === "ACTIVE").map((m) => [m.userId, `${DEMO_USERS[m.userId]?.name || m.userId} · ${m.roles.join(", ")}`] as [string, string])
  const safeAfterTenantSwitch = () => {
    useUi.getState().openAp(null); useUi.getState().openCmp(null); useGuidedDemo.getState().exit()
    if (/^\/(banners|records|evidence\/package)\//.test(pathname)) nav(pathname.startsWith("/banners") ? "/banners" : pathname.startsWith("/records") ? "/records" : "/evidence")
  }
  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" aria-label="Thu gọn menu" />
        <Separator orientation="vertical" className="mx-1 data-vertical:h-4 data-vertical:self-center" />
        <NativeSelect label="Tenant" value={tenantId || ""} onChange={(v) => { const r = switchTenant(v); msg(r.msg, r.ok ? "success" : "error", r.ok ? "Đã đóng lựa chọn và hướng dẫn thuộc tenant trước." : undefined); if (r.ok) safeAfterTenantSwitch() }} options={tenantOptions} className="max-w-64" />
        <NativeSelect label="Phạm vi Property" value="all" onChange={() => msg("Bộ lọc Property đang ở mức minh họa", "info")} options={[["all", "Toàn tenant"], ...properties.map((p) => [p.id, p.name] as [string, string])]} className="hidden max-w-52 xl:block" />
        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground xl:inline">{tenantSettings.defaultLanguage.toUpperCase()} · {tenantSettings.timeZone}</span>
          <Link to="/platform" className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-muted">Platform Admin</Link>
          <NotificationBell />
          <label htmlFor="persona" className="hidden text-xs text-muted-foreground lg:block">Persona demo</label>
          <NativeSelect id="persona" label="Persona demo" value={userId || ""} onChange={(v) => { const r = setPersona(v); useUi.getState().openAp(null); msg(r.msg, r.ok ? "info" : "error", "Đây là mô phỏng đổi người dùng, không phải đổi nhãn vai trò.") }} options={personaOptions} />
          {(membership?.roles.length || 0) > 1 && <NativeSelect id="role" label="Vai trò hiệu lực" value={role} onChange={(v) => { const r = setRole(v as Role); msg(r.msg, r.ok ? "info" : "error") }} options={membership!.roles} />}
          <div className="ml-1 hidden items-center gap-2 md:flex">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">{name.split(" ").slice(-2).map((x) => x[0]).join("")}</span>
            <div className="leading-tight"><div className="text-sm font-medium">{name}</div><div className="text-xs text-muted-foreground">{role}</div></div>
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
