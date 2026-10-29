/**
 * Hiển thị banner cookie và popup consent – dùng chung cho Trình tùy biến (UC-07),
 * xem trước và Mô phỏng thu thập (UC-11, 12, 13, 14, 16).
 * Rào chắn tuân thủ cài cứng: hai nút Chấp nhận/Từ chối cùng kiểu, kích thước, màu; không tick sẵn.
 */
import * as React from "react"
import { X, ShieldAlert, ChevronDown } from "lucide-react"
import type { BannerCfg, NoticeVersion } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface RenderCookie { name: string; provider: string; duration: string }
export interface RenderConsent {
  code: string
  name: string
  kind: string
  sensitive?: boolean
  notice?: NoticeVersion
  cookies?: RenderCookie[]
}
type Lang = "vi" | "en"

const T = {
  vi: { essential: "Thiết yếu", essentialDesc: "Cần để website hoạt động. Luôn bật và không được ghi nhận như một lựa chọn consent.", save: "Lưu lựa chọn", cancel: "Hủy", unchanged: "Bạn chưa thao tác thay đổi nên không thể lưu. Bấm Hủy để giữ nguyên hiện trạng.", essentialOff: "Cookie thiết yếu cần được bật để website hoạt động. Vui lòng bật lại trước khi lưu.", version: "Phiên bản", details: "Xem nội dung thông báo", data: "Loại dữ liệu", purpose: "Mục đích", parties: "Bên kiểm soát, bên nhận", rights: "Quyền của bạn", cookies: "Cookie và nhà cung cấp", required: "Bắt buộc", optional: "Tùy chọn", sensitiveTag: "Dữ liệu cá nhân nhạy cảm", confirm: "Tôi đã đọc và hiểu nội dung xử lý dữ liệu nhạy cảm ở trên", changed: "Chính sách đã cập nhật", close: "Đóng" },
  en: { essential: "Essential", essentialDesc: "Needed for the site to work. Always on and not recorded as a consent choice.", save: "Save choices", cancel: "Cancel", unchanged: "You have not made any changes, so there is nothing to save. Select Cancel to keep the current choices.", essentialOff: "Essential cookies must remain enabled for the website to work. Turn them back on before saving.", version: "Version", details: "Read the notice", data: "Personal data", purpose: "Purpose", parties: "Controller, recipients", rights: "Your rights", cookies: "Cookies and providers", required: "Required", optional: "Optional", sensitiveTag: "Sensitive personal data", confirm: "I have read and understood the sensitive data processing above", changed: "Policy updated", close: "Close" },
}

function Btn({ cfg, children, onClick, outline, disabled, testid }: { cfg: BannerCfg; children: React.ReactNode; onClick?: () => void; outline?: boolean; disabled?: boolean; testid?: string }) {
  return (
    <button type="button" data-testid={testid} disabled={disabled} onClick={onClick}
      className="h-9 flex-1 px-3 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={outline ? { borderRadius: cfg.radius, border: `1.5px solid ${cfg.color}`, color: cfg.color, background: "transparent", fontFamily: `"${cfg.font}", system-ui, sans-serif` } : { borderRadius: cfg.radius, background: cfg.color, color: cfg.textColor, border: `1.5px solid ${cfg.color}`, fontFamily: `"${cfg.font}", system-ui, sans-serif` }}>
      {children}
    </button>
  )
}

function Logo() {
  return <div className="flex items-center gap-1.5 text-xs font-bold text-[#C8102E]"><span className="flex size-5 items-center justify-center rounded bg-[#C8102E] text-[10px] text-white">ABC</span>ABC Mart</div>
}

export function NoticeBlock({ n, lang, open: o0 }: { n?: NoticeVersion; lang: Lang; open?: boolean }) {
  const [open, setOpen] = React.useState(!!o0)
  const t = T[lang]
  if (!n) return <div className="text-xs italic text-[#8a4b00]">Chưa có phiên bản Published</div>
  const c = n.content[lang].data ? n.content[lang] : n.content.vi
  return (
    <div className="text-xs">
      <button type="button" className="inline-flex items-center gap-1 font-medium underline underline-offset-2" onClick={() => setOpen(!open)}>{t.details} · {t.version} {n.v}<ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} /></button>
      {open && (
        <dl className="mt-1.5 grid gap-1 rounded-md bg-black/[0.04] p-2 leading-snug">
          {([["data", c.data], ["purpose", c.purpose], ["parties", c.parties], ["rights", c.rights]] as const).map(([k, v]) => <div key={k}><dt className="font-semibold">{t[k]}</dt><dd className="text-black/70">{v}</dd></div>)}
        </dl>
      )}
    </div>
  )
}

/** Banner cookie lớp 1 + lớp Tùy chỉnh (SCR-11-01, SCR-11-02) */
export function CookieBanner({ cfg, lang, groups, initialChoices, onDecide, onClose, layer: layer0 = 1, interactive = true }: { cfg: BannerCfg; lang: Lang; groups: RenderConsent[]; initialChoices?: Record<string, boolean>; onDecide?: (d: Record<string, boolean>) => void; onClose?: () => void; layer?: 1 | 2; interactive?: boolean }) {
  const [layer, setLayer] = React.useState<1 | 2>(layer0)
  const [sel, setSel] = React.useState<Record<string, boolean>>(() => ({ ...initialChoices }))
  const [essential, setEssential] = React.useState(true)
  const [warning, setWarning] = React.useState("")
  const t = T[lang]
  const all = (v: boolean) => Object.fromEntries(groups.map((g) => [g.code, v]))
  const baseline = { ...all(false), ...initialChoices }
  const changed = groups.some((g) => !!sel[g.code] !== !!baseline[g.code])
  const cancel = () => {
    setSel({ ...initialChoices })
    setEssential(true)
    setWarning("")
    setLayer(1)
  }
  const save = () => {
    if (!essential) return setWarning(t.essentialOff)
    if (!changed) return setWarning(t.unchanged)
    setWarning("")
    if (interactive) onDecide?.({ ...all(false), ...sel })
  }
  const box = cn("pointer-events-auto bg-white text-[#16202E] shadow-[0_10px_40px_rgba(0,0,0,.22)]", cfg.layout === "bar" ? "absolute inset-x-0 bottom-0 p-4" : cfg.layout === "corner" ? "absolute bottom-3 left-3 w-[min(340px,92%)] p-4" : "absolute top-1/2 left-1/2 w-[min(440px,92%)] -translate-x-1/2 -translate-y-1/2 p-5")
  return (
    <div className={cn("absolute inset-0 pointer-events-none", cfg.layout === "center" && "bg-black/35 pointer-events-auto")} style={{ fontFamily: `"${cfg.font}", system-ui, sans-serif` }}>
      <div className={box} style={{ borderRadius: cfg.layout === "bar" ? 0 : cfg.radius + 4 }} role="dialog" aria-label={cfg.title[lang]}>
        {layer === 1 ? (
          <div className={cn("flex gap-3", cfg.layout === "bar" ? "flex-col md:flex-row md:items-center" : "flex-col")}>
            <div className="min-w-0 flex-1">
              {cfg.logo && <Logo />}
              <div className="mt-1 text-[15px] font-bold leading-tight">{cfg.title[lang] || <span className="text-red-600">[thiếu tiêu đề]</span>}</div>
              <p className="mt-1 text-xs leading-relaxed text-black/70">{cfg.desc[lang]} <a className="underline" href="#" onClick={(e) => e.preventDefault()}>{cfg.link[lang]}</a></p>
            </div>
            <div className={cn("flex flex-wrap gap-2", cfg.layout === "bar" && "md:w-[420px]")}>
              <Btn cfg={cfg} testid="ck-custom" onClick={() => setLayer(2)}>{cfg.custom[lang]}</Btn>
              <Btn cfg={cfg} testid="ck-accept" onClick={() => interactive && onDecide?.(all(true))}>{cfg.accept[lang]}</Btn>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="text-[15px] font-bold">{cfg.custom[lang]}</div>
            <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
              <div className="flex items-start justify-between gap-3 rounded-md border border-black/10 p-2.5">
                <div><div className="text-sm font-semibold">{t.essential}</div><div className="text-xs text-black/60">{t.essentialDesc}</div></div>
                <button type="button" role="switch" aria-checked={essential} aria-label={`${t.essential}: ${essential ? "ON" : "OFF"}`} data-testid="ck-essential"
                  onClick={() => { setEssential((current) => !current); setWarning("") }}
                  className={cn("relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2", essential ? "" : "bg-black/20")}
                  style={essential ? { backgroundColor: cfg.color } : undefined}>
                  <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", essential && "translate-x-5")} />
                </button>
              </div>
              {groups.map((g) => {
                const enabled = !!sel[g.code]
                return (
                  <div key={g.code} className="flex items-start justify-between gap-3 rounded-md border border-black/10 p-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{g.name}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-black/45">{g.code}</div>
                      <NoticeBlock n={g.notice} lang={lang} />
                      {!!g.cookies?.length && <div className="mt-1 text-[11px] text-black/60"><span className="font-semibold">{t.cookies}:</span> {g.cookies.map((c) => `${c.name} (${c.provider}, ${c.duration})`).join("; ")}</div>}
                    </div>
                    <button type="button" role="switch" aria-checked={enabled} aria-label={`${g.name}: ${enabled ? "ON" : "OFF"}`} data-testid={"ck-" + g.code}
                      onClick={() => { setSel((current) => ({ ...current, [g.code]: !current[g.code] })); setWarning("") }}
                      className={cn("relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2", enabled ? "" : "bg-black/20")}
                      style={enabled ? { backgroundColor: cfg.color } : undefined}>
                      <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", enabled && "translate-x-5")} />
                    </button>
                  </div>
                )
              })}
            </div>
            {warning && <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">{warning}</div>}
            <div className="flex gap-2">
              <Btn cfg={cfg} outline testid="ck-cancel" onClick={cancel}>{t.cancel}</Btn>
              <Btn cfg={cfg} testid="ck-save" onClick={save}>{t.save}</Btn>
              <Btn cfg={cfg} testid="ck-accept-custom" onClick={() => interactive && onDecide?.(all(true))}>{cfg.accept[lang]}</Btn>
            </div>
          </div>
        )}
        {onClose && <button type="button" aria-label={t.close} onClick={onClose} className="absolute top-2 right-2 rounded p-1 text-black/50 hover:bg-black/5"><X className="size-4" /></button>}
      </div>
    </div>
  )
}

/** Popup consent trong form nghiệp vụ (SCR-12-01), popup nhạy cảm (SCR-14-01), popup tái đồng ý (SCR-16-01) */
export function ConsentPopup({ cfg, lang, consent, mode = "normal", diff, onAccept, onReject, onClose, interactive = true }: { cfg: BannerCfg; lang: Lang; consent?: RenderConsent; mode?: "normal" | "sensitive" | "reconsent"; diff?: [string, string, string][]; onAccept?: () => void; onReject?: () => void; onClose?: () => void; interactive?: boolean }) {
  const [ack, setAck] = React.useState(false)
  const t = T[lang]
  const sensitive = mode === "sensitive" || consent?.sensitive
  const box = cn("bg-white text-[#16202E] shadow-[0_10px_40px_rgba(0,0,0,.25)]", cfg.layout === "sheet" ? "absolute inset-x-0 bottom-0 p-4 max-h-[85%] overflow-y-auto" : cfg.layout === "inline" ? "relative w-full p-4 border border-black/10" : "absolute top-1/2 left-1/2 w-[min(460px,92%)] max-h-[90%] overflow-y-auto -translate-x-1/2 -translate-y-1/2 p-5")
  const body = (
    <div className={box} style={{ borderRadius: cfg.layout === "sheet" ? `${cfg.radius + 8}px ${cfg.radius + 8}px 0 0` : cfg.radius + 4, fontFamily: `"${cfg.font}", system-ui, sans-serif` }} role="dialog" aria-label={cfg.title[lang]}>
      {cfg.layout === "sheet" && <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-black/15" />}
      {cfg.logo && <Logo />}
      {mode === "reconsent" && <span className="mt-1 inline-block rounded bg-[#FDF0DC] px-1.5 py-0.5 text-[10px] font-semibold text-[#8a4b00]">{t.changed}</span>}
      {sensitive && <div className="mt-1 inline-flex items-center gap-1 rounded bg-[#FCE7E5] px-1.5 py-0.5 text-[10px] font-semibold text-[#A1201A]"><ShieldAlert className="size-3" />{t.sensitiveTag}</div>}
      <div className="mt-1 text-[15px] font-bold leading-tight">{sensitive && consent ? consent.name : cfg.title[lang]}</div>
      <p className="mt-1 text-xs leading-relaxed text-black/70">{cfg.desc[lang]}</p>
      {consent && (
        <div className="mt-3 rounded-md border border-black/10 p-2.5">
          <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{consent.name}</span><span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-semibold">{consent.kind === "Bắt buộc" ? t.required : t.optional}</span></div>
          <div className="mt-1"><NoticeBlock n={consent.notice} lang={lang} open={sensitive || mode === "reconsent"} /></div>
        </div>
      )}
      {mode === "reconsent" && diff && diff.length > 0 && (
        <div className="mt-2 rounded-md bg-[#FFF8EC] p-2 text-xs">
          <div className="font-semibold">Điểm thay đổi so với bản bạn đã đồng ý</div>
          {diff.map(([k, a, b]) => <div key={k} className="mt-1"><b>{k}:</b> <s className="text-black/45">{a.slice(0, 80)}</s> → {b.slice(0, 120)}</div>)}
        </div>
      )}
      {sensitive && (
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs"><input type="checkbox" data-testid="sens-ack" className="mt-0.5 size-4" style={{ accentColor: cfg.color }} checked={ack} onChange={(e) => setAck(e.target.checked)} />{t.confirm}</label>
      )}
      <div className="mt-3 flex gap-2">
        <Btn cfg={cfg} testid="pp-reject" onClick={() => interactive && onReject?.()}>{cfg.reject[lang]}</Btn>
        <Btn cfg={cfg} testid="pp-accept" disabled={sensitive && !ack} onClick={() => interactive && onAccept?.()}>{cfg.accept[lang]}</Btn>
      </div>
      <div className="mt-2 text-center text-[11px] text-black/50"><a className="underline" href="#" onClick={(e) => e.preventDefault()}>{cfg.link[lang]}</a></div>
      {onClose && <button type="button" data-testid="pp-close" aria-label={t.close} onClick={onClose} className="absolute top-2 right-2 rounded p-1 text-black/50 hover:bg-black/5"><X className="size-4" /></button>}
    </div>
  )
  if (cfg.layout === "inline") return body
  return <div className="absolute inset-0 bg-black/40">{body}</div>
}

/** Khung thiết bị giả lập cho xem trước và mô phỏng */
export function DeviceFrame({ device, url, children, page }: { device: "d" | "m"; url: string; children?: React.ReactNode; page?: React.ReactNode }) {
  return (
    <div className={cn("mx-auto overflow-hidden rounded-xl border-2 border-foreground/15 bg-[#E9EDF2] shadow-sm", device === "m" ? "w-[360px] max-w-full" : "w-full")}>
      <div className="flex items-center gap-1.5 border-b border-black/10 bg-[#F4F6F9] px-3 py-1.5">
        <span className="size-2.5 rounded-full bg-[#FF5F57]" /><span className="size-2.5 rounded-full bg-[#FEBC2E]" /><span className="size-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-2 truncate rounded bg-white px-2 py-0.5 font-mono text-[11px] text-black/60">https://{url}</span>
      </div>
      <div className={cn("relative bg-white text-[#16202E]", device === "m" ? "h-[600px]" : "h-[460px]")}>
        {page}
        {children}
      </div>
    </div>
  )
}

/** Trang web giả lập phía sau banner */
export function FakeShop({ device }: { device: "d" | "m" }) {
  return (
    <div className="h-full overflow-hidden p-4 text-[#16202E]">
      <div className="flex items-center justify-between"><Logo /><div className="flex gap-3 text-xs text-black/50"><span>Khuyến mãi</span><span>Thành viên</span>{device === "d" && <span>Cửa hàng</span>}</div></div>
      <div className="mt-4 rounded-lg bg-gradient-to-r from-[#FCE7E5] to-[#FFF4E5] p-5"><div className="text-lg font-bold">Tuần lễ thành viên</div><div className="text-xs text-black/60">Giảm đến 30% cho thành viên ABC</div></div>
      <div className={cn("mt-4 grid gap-3", device === "m" ? "grid-cols-2" : "grid-cols-4")}>
        {["Sữa tươi", "Cà phê", "Bánh quy", "Nước giặt", "Rau củ", "Trái cây", "Gạo", "Dầu ăn"].slice(0, device === "m" ? 4 : 8).map((x) => <div key={x} className="rounded-md border border-black/10 p-2"><div className="h-14 rounded bg-black/[0.05]" /><div className="mt-1 text-xs">{x}</div></div>)}
      </div>
    </div>
  )
}
