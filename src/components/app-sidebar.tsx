import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { NAV } from "@/config/nav"
import { currentActor, hasPermission, useCan, useStore } from "@/lib/store"
import { useApprovals } from "@/components/cmp/approval"

/** Thanh bên CMP: 4 nhóm theo SRS-IF-08, ẩn mục không có quyền (SRS-IF-04) */
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  const can = useCan()
  const tenant = useStore((s) => s.tenants.find((t) => t.id === s.currentTenantId))
  const state = useStore((s) => s)
  const imports = useStore((s) => s.imports)
  const approvals = useApprovals()
  const me = currentActor(state)
  const counts = {
    approvals: approvals.filter((a) => hasPermission(state, a.mod, "approve") && a.by !== me).length,
    imports: hasPermission(state, "import", "approve") ? imports.filter((b) => b.status === "Chờ duyệt").length : 0,
    alerts: 0,
  }
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <svg width="20" height="20" viewBox="0 0 36 36" aria-hidden><path d="M11 18.5l4.5 4.5L25 13" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">CMP Console</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{tenant?.name || "Chưa chọn tenant"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((g) => {
          const items = g.items.filter((i) => can(i.mod))
          if (!items.length) return null
          return (
            <SidebarGroup key={g.label}>
              <SidebarGroupLabel className="text-sidebar-foreground/55 uppercase tracking-wide text-[11px]">{g.label}</SidebarGroupLabel>
              <SidebarMenu>
                {items.map((i) => {
                  const active = pathname === i.url || pathname.startsWith(i.url + "/")
                  const n = i.count ? counts[i.count] : 0
                  return (
                    <SidebarMenuItem key={i.url}>
                      <SidebarMenuButton tooltip={`${i.title} — ${i.desc}`} isActive={active} render={<Link to={i.url} />}>
                        <i.icon />
                        <span>{i.title}</span>
                        {i.tag && <span title="Chức năng đang được mô phỏng ở mức giao diện" className="ml-auto rounded bg-sidebar-accent px-1 text-[10px] text-sidebar-foreground/60">{i.tag}</span>}
                      </SidebarMenuButton>
                      {n > 0 && <SidebarMenuBadge className="bg-destructive text-white rounded-full">{n}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-lg bg-sidebar-accent/60 px-3 py-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          Prototype theo <b className="text-sidebar-foreground">SRS CMP v1.3</b><br />Dữ liệu minh họa · không có backend
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
