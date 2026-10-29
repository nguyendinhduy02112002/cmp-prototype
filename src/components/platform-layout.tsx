import * as React from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { Building2, LayoutDashboard, ScrollText, ShieldCheck } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import { NativeSelect, Note } from "@/components/cmp/kit"
import { PLATFORM_ACTORS } from "@/lib/platform-data"
import { canPlatform, usePlatformActor, usePlatformStore } from "@/lib/platform-store"
import { msg } from "@/components/cmp/approval"

const ITEMS = [
  { to: "/platform", label: "Tổng quan nền tảng", icon: LayoutDashboard, action: "dashboard.view" as const },
  { to: "/platform/tenants", label: "Danh mục tenant", icon: Building2, action: "tenants.view" as const },
  { to: "/platform/audit", label: "Nhật ký nền tảng", icon: ScrollText, action: "audit.view" as const },
]

function PlatformSidebar() {
  const { pathname } = useLocation(); const actor = usePlatformActor()
  return <Sidebar variant="sidebar" collapsible="icon">
    <SidebarHeader><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" render={<Link to="/platform" />}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><ShieldCheck className="size-5" /></div>
      <div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-semibold text-white">CMP Platform</span><span className="truncate text-xs text-sidebar-foreground/70">Quản trị SaaS</span></div>
    </SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader>
    <SidebarContent><SidebarGroup><SidebarGroupLabel>Nền tảng</SidebarGroupLabel><SidebarMenu>{ITEMS.filter((i) => canPlatform(actor, i.action)).map((i) => <SidebarMenuItem key={i.to}><SidebarMenuButton isActive={i.to === "/platform" ? pathname === i.to : pathname.startsWith(i.to)} tooltip={i.label} render={<Link to={i.to} />}><i.icon /><span>{i.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroup></SidebarContent>
    <SidebarFooter><div className="rounded-lg bg-sidebar-accent/60 px-3 py-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">Không truy cập dữ liệu cá nhân tenant.<br />Frontend prototype</div></SidebarFooter>
  </Sidebar>
}

function PlatformHeader() {
  const actor = usePlatformActor(); const setActor = usePlatformStore((s) => s.setActor)
  return <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center border-b bg-background/95 backdrop-blur"><div className="flex w-full items-center gap-2 px-4 lg:px-6">
    <SidebarTrigger className="-ml-1" aria-label="Thu gọn menu nền tảng" /><Separator orientation="vertical" className="mx-1 data-vertical:h-4" />
    <div><div className="text-sm font-semibold">Platform Administration</div><div className="text-xs text-muted-foreground">Tách biệt với Tenant Workspace</div></div>
    <div className="ml-auto flex items-center gap-2"><NativeSelect label="Platform persona" value={actor?.id || "tenant-only-admin"} onChange={(v) => { setActor(v); msg("Đã đổi platform persona.", "info") }} options={PLATFORM_ACTORS.map((a) => [a.id, `${a.name} · ${a.role || "Không có platform role"}`])} />
      <div className="hidden leading-tight md:block"><div className="text-sm font-medium">{actor?.name}</div><div className="text-xs text-muted-foreground">{actor?.role || "Không có quyền nền tảng"}</div></div>
      <Link className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted" to="/dashboard">Tenant Workspace</Link><ModeToggle /></div>
  </div></header>
}

export function PlatformLayout() {
  const actor = usePlatformActor(); const { pathname } = useLocation()
  const required = pathname.startsWith("/platform/audit") ? "audit.view" : pathname.startsWith("/platform/tenants") ? "tenants.view" : "dashboard.view"
  const allowed = canPlatform(actor, required)
  return <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "3rem", "--header-height": "calc(var(--spacing) * 14)" } as React.CSSProperties}>
    <PlatformSidebar /><SidebarInset><PlatformHeader /><main className="flex flex-1 flex-col gap-5 py-5 md:py-6">{allowed ? <Outlet /> : <div className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-20 text-center"><div className="text-5xl font-bold text-muted-foreground">403</div><h1 className="text-2xl font-bold">Không có quyền quản trị nền tảng</h1><Note tone="lock">Tenant role không cấp platform privilege. Hãy chọn platform persona được gán vai trò phù hợp để tiếp tục mô phỏng.</Note></div>}</main></SidebarInset>
  </SidebarProvider>
}
