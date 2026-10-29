import * as React from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ApprovalDialog, CompareDialog } from "@/components/cmp/approval"
import { ROUTE_MOD } from "@/config/nav"
import { useCan, useStore } from "@/lib/store"
import Forbidden from "@/app/forbidden"
import { GuidedDemoDock } from "@/components/cmp/guided-demo"

/** Khung trang CMP (rút gọn BaseLayout của template: bỏ theme customizer, footer, nút Upgrade) */
export function AppLayout() {
  const { pathname } = useLocation()
  const can = useCan()
  const role = useStore((s) => s.role)
  const tenantId = useStore((s) => s.currentTenantId)
  const tenantActive = useStore((s) => s.tenants.some((t) => t.id === s.currentTenantId && t.status === "ACTIVE"))
  const mod = ROUTE_MOD.find(([re]) => re.test(pathname))?.[1]
  const allowed = tenantActive && (!mod || can(mod))
  React.useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "3rem", "--header-height": "calc(var(--spacing) * 14)" } as React.CSSProperties}>
      <AppSidebar variant="sidebar" collapsible="icon" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-5 py-5 md:py-6" key={`${tenantId}:${role}${allowed ? "" : "-x"}`}>
          {allowed ? <Outlet /> : <Forbidden />}
        </main>
      </SidebarInset>
      <ApprovalDialog />
      <CompareDialog />
      <GuidedDemoDock />
    </SidebarProvider>
  )
}
