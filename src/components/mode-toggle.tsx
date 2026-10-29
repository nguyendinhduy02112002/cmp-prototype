import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"

/** Chuyển giao diện sáng / tối (bỏ hiệu ứng chuyển vòng tròn của template) */
export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  return (
    <Button variant="ghost" size="icon" aria-label="Đổi giao diện sáng tối" onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}
