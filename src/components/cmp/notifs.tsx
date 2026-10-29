/** Chuông thông báo và nguồn dữ liệu Trung tâm thông báo (SRS 4.3.4, UC-40) */
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { currentActor, hasPermission, useStore } from "@/lib/store"
import { fmtDT } from "@/lib/fmt"
import { useApprovals, useUi } from "./approval"
import { cn } from "@/lib/utils"

export type NKind = "ap" | "mine" | "res" | "al"
export interface NItem { key: string; k: NKind; at: string; title: string; sub: string; tone: "info" | "ok" | "err" | "warn" | "mute"; open: () => void; read?: boolean }
export const NKIND_LABEL: Record<NKind, string> = { ap: "Chờ tôi duyệt", mine: "Đề nghị của tôi", res: "Kết quả, thông báo", al: "Cảnh báo vận hành" }

export function useNotifs() {
  const role = useStore((s) => s.role)
  const state = useStore((s) => s)
  const nlog = useStore((s) => s.nlog)
  const alerts = useStore((s) => s.alerts)
  const markRead = useStore((s) => s.markRead)
  const approvals = useApprovals()
  const openAp = useUi((s) => s.openAp)
  const nav = useNavigate()
  return React.useMemo(() => {
    const me = currentActor(state)
    const L: NItem[] = []
    approvals.forEach((a) => {
      if (hasPermission(state, a.mod, "approve") && a.by !== me) L.push({ key: a.id, k: "ap", at: a.at, title: `Chờ bạn duyệt · ${a.type} ${a.name}`, sub: `${a.action} · gửi bởi ${a.by}`, tone: "info", open: () => openAp(a.id) })
      else if (a.by === me) L.push({ key: a.id, k: "mine", at: a.at, title: `Đề nghị của bạn đang chờ duyệt · ${a.type} ${a.name}`, sub: a.action, tone: "mute", open: () => openAp(a.id) })
    })
    nlog.filter((n) => n.to === me).forEach((n) => L.push({ key: n.id, k: "res", at: n.at, title: n.text, sub: n.read ? "Đã đọc" : "Chưa đọc", tone: n.tone === "err" ? "err" : n.tone === "ok" ? "ok" : "info", read: n.read, open: () => { markRead(n.id); if (n.link) nav(n.link) } }))
    alerts.filter((a) => a.status === "Đang mở" && a.to.includes(role)).forEach((a) => L.push({ key: a.id, k: "al", at: a.at, title: `${a.sev} · ${a.type}`, sub: a.src, tone: a.sev === "Nghiêm trọng" ? "err" : a.sev === "Cảnh báo" ? "warn" : "info", open: () => nav(`/notifications?alert=${a.id}`) }))
    return L.sort((a, b) => (a.at < b.at ? 1 : -1))
  }, [approvals, state, role, nlog, alerts, openAp, nav, markRead])
}
const dot = { info: "bg-info", ok: "bg-success", err: "bg-destructive", warn: "bg-warning", mute: "bg-muted-foreground/50" }

export function NotificationBell() {
  const items = useNotifs()
  const nav = useNavigate()
  const n = items.filter((x) => x.k === "ap" || x.k === "al" || (x.k === "res" && !x.read)).length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Thông báo, ${n} cần xử lý`} className="relative" />}>
        <Bell />
        {n > 0 && <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] leading-4 font-semibold text-white">{n}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] max-w-[92vw] p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2"><span className="font-semibold text-foreground">Thông báo</span><span className="text-xs font-normal">{n} cần xử lý</span></DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-[420px] overflow-y-auto">
          {items.slice(0, 7).map((x) => (
            <DropdownMenuItem key={x.key} onClick={x.open} className="items-start gap-2.5 rounded-none px-3 py-2.5">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", dot[x.tone])} />
              <div className="min-w-0">
                <div className={cn("text-[13px] leading-snug", x.k !== "res" || !x.read ? "font-medium" : "")}>{x.title}</div>
                <div className="text-xs text-muted-foreground">{x.sub} · {fmtDT(x.at)}</div>
              </div>
            </DropdownMenuItem>
          ))}
          {!items.length && <div className="px-3 py-8 text-center text-sm text-muted-foreground">Không có thông báo.</div>}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <div className="flex justify-end p-2"><Button size="sm" onClick={() => nav("/notifications")}>Xem tất cả</Button></div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
