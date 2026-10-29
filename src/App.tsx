import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { routes } from "@/config/routes"

// Router trong bộ nhớ: không đọc, ghi thanh địa chỉ – chạy được trong khung xem artifact, tệp mở trực tiếp và mọi máy chủ tĩnh
const router = createMemoryRouter(routes, { initialEntries: ["/dashboard"] })
// Hook cho kiểm thử tự động (Playwright) điều hướng thẳng tới một màn
;(window as unknown as { __nav?: (to: string) => void }).__nav = (to) => { void router.navigate(to) }

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="cmp-ui-theme">
      <TooltipProvider>
        <Toaster>
          <RouterProvider router={router} />
        </Toaster>
      </TooltipProvider>
    </ThemeProvider>
  )
}
