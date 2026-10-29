/** Bộ component dùng chung của CMP Console (xây mới trên nền shadcn/ui của template) */
import * as React from "react"
import { Link } from "react-router-dom"
import { Lock, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type Tone = "ok" | "info" | "warn" | "err" | "mute" | "dark" | "violet"
const TONE: Record<Tone, string> = {
  ok: "bg-success/12 text-success border-success/25",
  info: "bg-info/10 text-info border-info/25",
  warn: "bg-warning/12 text-warning border-warning/30",
  err: "bg-destructive/10 text-destructive border-destructive/25",
  mute: "bg-muted text-muted-foreground border-border",
  dark: "bg-foreground/10 text-foreground border-foreground/20",
  violet: "bg-[#7A5AF8]/12 text-[#5B3FD6] dark:text-[#B39DFF] border-[#7A5AF8]/30",
}
export function Pill({ tone = "mute", children, className, title }: { tone?: Tone; children: React.ReactNode; className?: string; title?: string }) {
  return <Badge variant="outline" title={title} className={cn("rounded-md font-medium", TONE[tone], className)}>{children}</Badge>
}

/** Nhãn trạng thái thống nhất (SRS-IF-08) */
const STATUS_TONE: Record<string, Tone> = {
  "Nháp": "mute", "Chờ duyệt": "info", "Bị trả lại": "err", "Hoạt động": "ok", "Chờ duyệt ngừng": "warn", "Ngừng sử dụng": "dark",
  "Đã duyệt – chờ hiệu lực": "info", Published: "ok", Expired: "mute", "Thay thế": "mute",
  ACCEPTED: "ok", REJECTED: "warn", WITHDRAWN: "err", EXPIRED: "mute", RE_CONSENT: "violet", NOT_CONSENTED: "mute",
  "Đang mở": "warn", "Đã xử lý": "ok", "Đã ghi": "ok", DELIVERED: "ok", RETRY: "warn", FAILED: "err", PENDING: "info",
}
const DEC_VI: Record<string, string> = { ACCEPTED: "Đồng ý", REJECTED: "Từ chối", WITHDRAWN: "Rút lại", EXPIRED: "Hết hạn", RE_CONSENT: "Cần đồng ý lại", NOT_CONSENTED: "Chưa đồng ý" }
export function StatusBadge({ s, raw }: { s: string; raw?: boolean }) {
  return <Pill tone={STATUS_TONE[s] || "mute"} title={DEC_VI[s] ? s : undefined}>{!raw && DEC_VI[s] ? DEC_VI[s] : s}</Pill>
}
export const decisionVi = (d: string) => DEC_VI[d] || d

/** Khung đầu trang: breadcrumb, tiêu đề, mô tả, nút thao tác */
export function PageHeader({ title, desc, actions, crumbs }: { title: string; desc?: React.ReactNode; actions?: React.ReactNode; crumbs?: [string, string?][] }) {
  return (
    <div className="flex flex-col gap-3 px-4 lg:px-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {(crumbs || []).map(([l, to], i) => (
            <React.Fragment key={i}>
              {to ? <Link to={to} className="hover:text-foreground hover:underline">{l}</Link> : <span>{l}</span>}
              <span aria-hidden>›</span>
            </React.Fragment>
          ))}
          <Pill tone="warn" className="h-4 px-1.5 text-[10px]">Dữ liệu minh họa</Pill>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {desc && <p className="text-muted-foreground text-sm max-w-3xl">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
export const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cn("px-4 lg:px-6", className)}>{children}</div>

/** Thẻ chỉ số (từ mẫu SectionCards/StatCards của template) */
export function Kpi({ label, value, sub, icon, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode; tone?: Tone }) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "err" && "text-destructive", tone === "ok" && "text-success", tone === "warn" && "text-warning")}>{value}</div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        {icon && <div className="rounded-lg bg-muted p-2.5 text-muted-foreground [&_svg]:size-5">{icon}</div>}
      </CardContent>
    </Card>
  )
}

/** Select gốc của trình duyệt, style theo shadcn (ổn định cho lọc và form) */
export function NativeSelect({ value, onChange, options, className, label, disabled, id }: { value: string; onChange: (v: string) => void; options: (string | [string, string])[]; className?: string; label: string; disabled?: boolean; id?: string }) {
  return (
    <select id={id} aria-label={label} disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)}
      className={cn("h-8 rounded-lg border border-input bg-background px-2.5 pr-7 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 dark:bg-input/30", className)}>
      {options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option> })}
    </select>
  )
}

/** Ghi chú khóa quyền / thông tin */
export function Note({ children, tone = "info", icon }: { children: React.ReactNode; tone?: "info" | "lock" | "warn" | "err"; icon?: React.ReactNode }) {
  const cls = { info: "border-info/25 bg-info/6 text-foreground", lock: "border-border bg-muted/60 text-muted-foreground", warn: "border-warning/30 bg-warning/8 text-foreground", err: "border-destructive/30 bg-destructive/6 text-foreground" }[tone]
  return (
    <div role="note" className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", cls)}>
      <span className="mt-0.5 shrink-0 [&_svg]:size-4">{icon || (tone === "lock" ? <Lock /> : <Info />)}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[0.82em]", className)}>{children}</span>
}
export function KV({ rows, className }: { rows: [React.ReactNode, React.ReactNode][]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-[minmax(110px,34%)_1fr] gap-x-4 gap-y-2 text-sm", className)}>
      {rows.map(([k, v], i) => (
        <React.Fragment key={i}>
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}
export function JsonBlock({ data }: { data: unknown }) {
  return <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed">{JSON.stringify(data, null, 2)}</pre>
}
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">{children}</div>
}
/** Chip lọc dạng nút */
export function Chips({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string, number?][] }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {options.map(([v, l, n]) => (
        <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={cn("h-7 rounded-full border px-3 text-xs font-medium transition-colors", value === v ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>
          {l}{n !== undefined && <span className="ml-1.5 opacity-75">{n}</span>}
        </button>
      ))}
    </div>
  )
}

/** Trường form có nhãn, dấu bắt buộc, lỗi hoặc gợi ý */
export function FormField({ id, label, req, error, hint, children, className }: { id?: string; label: React.ReactNode; req?: boolean; error?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium leading-none">{label}{req && <span className="text-destructive"> *</span>}</label>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}
