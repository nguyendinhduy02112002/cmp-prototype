import { Navigate, type RouteObject } from "react-router-dom"
import { AppLayout } from "@/components/layouts/base-layout"
import NotFound from "@/app/not-found"
import NotificationsPage from "@/app/notifications"
import DashboardPage from "@/app/dashboard"
import PurposesPage from "@/app/purposes"
import ConsentsPage from "@/app/consents"
import RecordsPage from "@/app/records"
import NoticesPage from "@/app/notices"
import BannersPage, { BannerEditorPage } from "@/app/banners"
import RulesPage from "@/app/rules"
import SimulatorPage from "@/app/simulator"
import EvidencePage, { PackagePage, SubjectHistoryPage } from "@/app/evidence"
import OfflinePage from "@/app/offline"
import { ImportPage, UsersPage, AuditPage } from "@/app/admin"
import { RightsPage, IntegrationsPage } from "@/app/p3"
import TenantSettingsPage from "@/app/tenant-settings"
import { PlatformLayout } from "@/components/platform-layout"
import { PlatformAuditPage, PlatformDashboardPage, TenantDirectoryPage } from "@/app/platform"
import ApplicationsPage, { ApplicationDetailPage } from "@/app/applications"
import { IntegrationCodePage, PropertyDetailPage } from "@/app/properties"
import LoginPage from "@/app/auth"
import TenantUserCreatePage from "@/app/user-create"

/** Định tuyến CMP (hash router để chia sẻ prototype dạng một trang) – sitemap Bước 4 */
export const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  {
    path: "/platform",
    element: <PlatformLayout />,
    children: [
      { index: true, element: <PlatformDashboardPage /> },
      { path: "tenants", element: <TenantDirectoryPage /> },
      { path: "audit", element: <PlatformAuditPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      // Tổng quan
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/notifications", element: <NotificationsPage /> },
      // Cấu hình
      { path: "/purposes", element: <PurposesPage /> },
      { path: "/consents", element: <ConsentsPage /> },
      { path: "/notices", element: <NoticesPage /> },
      { path: "/banners", element: <BannersPage /> },
      { path: "/banners/:code", element: <BannerEditorPage /> },
      { path: "/rules", element: <RulesPage /> },
      // Vận hành
      { path: "/records", element: <RecordsPage /> },
      { path: "/records/:subject", element: <SubjectHistoryPage /> },
      { path: "/evidence", element: <EvidencePage /> },
      { path: "/evidence/package/:id", element: <PackagePage /> },
      { path: "/offline", element: <OfflinePage /> },
      { path: "/import", element: <ImportPage /> },
      { path: "/simulator", element: <SimulatorPage /> },
      { path: "/rights", element: <RightsPage /> },
      // Hệ thống
      { path: "/users", element: <UsersPage /> },
      { path: "/users/create", element: <TenantUserCreatePage /> },
      { path: "/audit", element: <AuditPage /> },
      { path: "/applications", element: <ApplicationsPage /> },
      { path: "/applications/:applicationId", element: <ApplicationDetailPage /> },
      { path: "/applications/:applicationId/properties/:propertyId", element: <PropertyDetailPage /> },
      { path: "/applications/:applicationId/properties/:propertyId/integration", element: <IntegrationCodePage /> },
      { path: "/integrations", element: <IntegrationsPage /> },
      { path: "/settings", element: <TenantSettingsPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]
