import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationBell } from "@/components/cmp/notifs"
import { NativeSelect } from "@/components/cmp/kit"
import { Button } from "@/components/ui/button"
import { currentActor, useStore } from "@/lib/store"
import { msg } from "@/components/cmp/approval"
import type { Role } from "@/lib/types"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { defaultTenantSettings } from "@/lib/tenant-settings-data"
import { useTenantSettingsStore } from "@/lib/tenant-settings-store"

/** Header CMP: phạm vi, chuông thông báo, bộ chọn vai trò (thay ô tìm kiếm và liên kết ngoài của template) */
export function SiteHeader() {
  const nav = useNavigate()
  const role = useStore((s) => s.role)
  const setRole = useStore((s) => s.setRole)
  const logout = useStore((s) => s.logout)
  const tenants = useStore((s) => s.tenants)
  const memberships = useStore((s) => s.memberships)
  const tenantId = useStore((s) => s.currentTenantId)
  const properties = useStore((s) => s.properties)
  const storedTenantSettings = useTenantSettingsStore((s) => tenantId ? s.byTenant[tenantId] : undefined)
  const tenantSettings = storedTenantSettings || defaultTenantSettings(tenantId || "unknown")
  const name = useStore(currentActor)
  const currentUserId = useStore((s) => s.currentUserId)
  const membership = memberships.find((m) => m.tenantId === tenantId && m.userId === currentUserId && m.status === "ACTIVE")
  const tenant = tenants.find((t) => t.id === tenantId)
  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" aria-label="Thu gọn menu" />
        <Separator orientation="vertical" className="mx-1 data-vertical:h-4 data-vertical:self-center" />
        <div className="max-w-64 truncate rounded-md border px-2.5 py-1.5 text-xs" title="Tài khoản chỉ thuộc một tenant">{tenant?.name || "Tenant"} · {tenant?.code}</div>
        <NativeSelect label="Phạm vi Property" value="all" onChange={() => msg("Bộ lọc Property đang ở mức minh họa", "info")} options={[["all", "Tất cả ứng dụng"], ...properties.map((p) => [p.id, p.name] as [string, string])]} className="hidden max-w-52 xl:block" />
        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground xl:inline">{tenantSettings.defaultLanguage.toUpperCase()} · {tenantSettings.timeZone}</span>
          <Link to="/platform" className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-muted">Platform Admin</Link>
          <NotificationBell />
          {(membership?.roles.length || 0) > 1 && <NativeSelect id="role" label="Vai trò hiệu lực" value={role} onChange={(v) => { const r = setRole(v as Role); msg(r.msg, r.ok ? "info" : "error") }} options={membership!.roles} />}
          <div className="ml-1 hidden items-center gap-2 md:flex">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">{name.split(" ").slice(-2).map((x) => x[0]).join("")}</span>
            <div className="leading-tight"><div className="text-sm font-medium">{name}</div><div className="text-xs text-muted-foreground">{role}</div></div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { logout(); nav("/login", { replace: true }) }}>Đăng xuất</Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
