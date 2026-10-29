/** SC-06 Banner & popup – UC-07 · SCR-07-01 (danh sách + trình tùy biến có xem trước) */
import * as React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Plus, Monitor, Smartphone, Check, X as XIcon, GitCompare, History } from "lucide-react"
import { PageHeader, Section, StatusBadge, Pill, NativeSelect, Note, Mono, FormField, Empty } from "@/components/cmp/kit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCan, useStore } from "@/lib/store"
import { COOKIES, FONTS, LAYOUTS, LAYOUT_BY_KIND } from "@/lib/mock"
import type { Banner, BannerCfg } from "@/lib/types"
import { contrast, fmtDT } from "@/lib/fmt"
import { msg, useUi } from "@/components/cmp/approval"
import { ConsentPopup, CookieBanner, DeviceFrame, FakeShop, type RenderConsent } from "@/components/cmp/banner-renderer"
import { isSensitive } from "./purposes"
import { cn } from "@/lib/utils"
import { BusinessContextHelp, RelationshipNote, WorkflowNextSteps } from "@/components/cmp/business-context-help"

/** Thông tin consent để hiển thị trên banner/popup */
export function useRenderConsents() {
  const consents = useStore((s) => s.consents)
  const purposes = useStore((s) => s.purposes)
  const notices = useStore((s) => s.notices)
  return React.useCallback((codes: string[]): RenderConsent[] => codes.map((code) => {
    const c = consents.find((x) => x.code === code)
    return {
      code,
      name: c?.name || code,
      kind: c?.kind || "Tùy chọn",
      sensitive: !!c?.purposes.some((p) => isSensitive(purposes.find((x) => x.code === p)?.items || [])),
      notice: notices.find((n) => n.consent === code && n.status === "Published"),
      cookies: COOKIES.filter((cookie) => cookie.grp === code).map((cookie) => ({ name: cookie.name, provider: cookie.prov, duration: cookie.ttl })),
    }
  }), [consents, purposes, notices])
}

/** Danh sách kiểm tra tự động trước khi gửi duyệt (UC-07) */
export function bannerChecks(cfg: BannerCfg, rc: RenderConsent[]): [boolean, string][] {
  const ratio = contrast(cfg.color, cfg.textColor)
  const langMissing = cfg.langs.filter((l) => !cfg.title[l]?.trim() || !cfg.desc[l]?.trim() || !cfg.accept[l]?.trim() || !cfg.reject[l]?.trim() || !cfg.link[l]?.trim())
  return [
    [true, "Nút Chấp nhận và Từ chối cùng lớp, cùng kiểu, kích thước, màu (BR-UC07-02) – khóa cứng trong component"],
    [true, "Không có lựa chọn tick sẵn; đóng banner không tạo consent (BR-UC07-03)"],
    [ratio >= 4.5, ratio >= 4.5 ? `Độ tương phản chữ trên nút ${ratio.toLocaleString("vi-VN")}:1 (≥ 4,5:1)` : `Độ tương phản chữ trên nút là ${ratio.toLocaleString("vi-VN")}:1, cần tối thiểu 4,5:1. (MSG-07-05)`],
    [!langMissing.length, langMissing.length ? `Thiếu bản dịch cho ngôn ngữ ${langMissing.join(", ")}. (MSG-07-03)` : `Đủ nội dung cho ${cfg.langs.join(", ")} (BR-UC07-04)`],
    [rc.length > 0 && rc.every((c) => !!c.notice), rc.length ? (rc.every((c) => c.notice) ? "Mọi consent hiển thị đều có phiên bản Published" : `Consent chưa có phiên bản Published: ${rc.filter((c) => !c.notice).map((c) => c.code).join(", ")}`) : "Chưa chọn consent hiển thị"],
  ]
}

export default function BannersPage() {
  const tenantProperties = useStore((s) => s.properties)
  const properties = tenantProperties.map((p) => p.name)
  const banners = useStore((s) => s.banners)
  const can = useCan()
  const nav = useNavigate()
  const create = useStore((s) => s.createBanner)
  const [tab, setTab] = React.useState("consent")
  const [nw, setNw] = React.useState(false)
  const [name, setName] = React.useState("")
  const [site, setSite] = React.useState(properties[0] || "")
  const list = banners.filter((b) => b.kind === tab)
  const rc = useRenderConsents()
  return (
    <>
      <PageHeader title="Banner & popup" crumbs={[["Cấu hình"]]} desc="Tùy biến giao diện xin đồng ý trong rào chắn tuân thủ: chỉ đổi các tham số được khai báo; hai nút Chấp nhận/Từ chối luôn ngang hàng, không tick sẵn. Mỗi cấu hình có phiên bản và cần DPO duyệt trước khi áp dụng cho SDK."
        actions={can("banner", "edit") ? <Button onClick={() => setNw(true)}><Plus /> Tạo {tab === "cookie" ? "banner cookie" : "popup consent"}</Button> : undefined} />
      <Section className="flex flex-wrap items-center gap-2">
        <BusinessContextHelp title="Giao diện thu thập sự đồng ý" context={{ purpose: "Cấu hình cách Consent và Notice được trình bày để khách hàng có thể đưa ra lựa chọn rõ ràng.", when: "Sau khi Consent Hoạt động và Notice đã Published.", actors: "Nhân viên/Admin cấu hình; DPO duyệt version trước khi áp dụng.", inputs: "Layout, nội dung nút, ngôn ngữ, màu sắc, consent và Property.", outputs: "Banner hoặc Popup Hoạt động được Simulator sử dụng khi thu thập quyết định.", related: ["Consent", "Notice", "Banner", "Simulator"], example: "Banner cookie cho phép Chấp nhận tất cả, Từ chối tất cả hoặc chọn từng nhóm.", srs: "UC-07, UC-11..14" }} />
        <RelationshipNote>Banner không thay thế Notice: Banner quyết định <b>cách hiển thị</b>, còn Notice là <b>nội dung có version</b> mà khách hàng được cung cấp.</RelationshipNote>
      </Section>
      <Section>
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <TabsList><TabsTrigger value="consent">Popup consent ({banners.filter((b) => b.kind === "consent").length})</TabsTrigger><TabsTrigger value="cookie">Banner cookie ({banners.filter((b) => b.kind === "cookie").length})</TabsTrigger></TabsList>
          <TabsContent value={tab} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((b) => {
              const v = b.versions[0]; const live = b.versions.find((x) => x.status === "Hoạt động")
              const fails = bannerChecks(v.cfg, rc(v.cfg.consents)).filter((c) => !c[0]).length
              return (
                <Card key={b.code} className="cursor-pointer gap-3 pt-0 transition-shadow hover:shadow-md" onClick={() => nav(`/banners/${b.code}`)}>
                  <div className="relative h-40 overflow-hidden rounded-t-xl border-b bg-[#E9EDF2]">
                    <div className="pointer-events-none absolute inset-0 origin-top-left scale-[0.5]" style={{ width: "200%", height: "200%" }}>
                      <FakeShop device="d" />
                      {b.kind === "cookie" ? <CookieBanner cfg={v.cfg} lang="vi" groups={rc(v.cfg.consents)} interactive={false} /> : <ConsentPopup cfg={{ ...v.cfg, layout: v.cfg.layout === "inline" ? "center" : v.cfg.layout }} lang="vi" consent={rc(v.cfg.consents)[0]} interactive={false} />}
                    </div>
                  </div>
                  <CardHeader className="gap-1">
                    <CardTitle className="flex items-center justify-between gap-2 text-base"><span className="truncate">{b.name}</span><StatusBadge s={v.status} /></CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1"><Mono>{b.code} v{v.v}</Mono><span>·</span><span>{b.site}</span><span>·</span><span>{LAYOUTS[v.cfg.layout]}</span></CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {live ? <span>Đang áp dụng v{live.v}</span> : <span>Chưa có phiên bản áp dụng</span>}
                    {fails > 0 && <Pill tone="err">{fails} lỗi kiểm tra</Pill>}
                    {v.retNote && <Pill tone="err">Bị trả lại</Pill>}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        </Tabs>
      </Section>
      {banners.some((b) => b.versions.some((v) => v.status === "Hoạt động")) && <Section><WorkflowNextSteps links={[{ label: "Tiếp theo: Xem mô phỏng trải nghiệm", to: "/simulator", mod: "sim", description: "Dùng đúng renderer của Banner để Accept/Reject và kiểm tra kết quả" }]} /></Section>}
      {nw && (
        <Dialog open onOpenChange={(o) => !o && setNw(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Tạo {tab === "cookie" ? "banner cookie" : "popup consent"}</DialogTitle><DialogDescription>Cấu hình gắn với một Property, có lịch sử; chỉ một cấu hình áp dụng tại một thời điểm (BR-UC07-05).</DialogDescription></DialogHeader>
            <FormField id="bname" label="Tên" req><Input id="bname" value={name} onChange={(e) => setName(e.target.value)} /></FormField>
            <FormField label="Property" req><NativeSelect label="Property" value={site} onChange={setSite} options={properties} className="w-full" /></FormField>
            <DialogFooter><Button variant="outline" onClick={() => setNw(false)}>Hủy</Button><Button disabled={!name.trim()} onClick={() => { const code = create(tab as Banner["kind"], name, site); nav(`/banners/${code}`) }}>Tạo</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export function BannerEditorPage() {
  const { code } = useParams()
  const b = useStore((s) => s.banners.find((x) => x.code === code))
  if (!b) return <Section><Empty>Không tìm thấy banner {code}. <Link className="underline" to="/banners">Về danh sách</Link></Empty></Section>
  return <BannerEditor key={b.code + b.versions[0].v + b.versions[0].status} b={b} />
}

function BannerEditor({ b }: { b: Banner }) {
  const can = useCan()
  const role = useStore((s) => s.role)
  const consents = useStore((s) => s.consents)
  const save = useStore((s) => s.saveBannerCfg)
  const submit = useStore((s) => s.submitBanner)
  const newVer = useStore((s) => s.newBannerVersion)
  const openAp = useUi((s) => s.openAp)
  const openCmp = useUi((s) => s.openCmp)
  const rcFn = useRenderConsents()
  const v = b.versions[0]
  const editable = can("banner", "edit") && (v.status === "Nháp" || v.status === "Bị trả lại")
  const [cfg, setCfg] = React.useState<BannerCfg>(() => JSON.parse(JSON.stringify(v.cfg)))
  const [note, setNote] = React.useState(v.note)
  const [device, setDevice] = React.useState<"d" | "m">("d")
  const [lang, setLang] = React.useState<"vi" | "en">("vi")
  const [layer, setLayer] = React.useState<1 | 2>(1)
  const [pv, setPv] = React.useState(0)
  const set = <K extends keyof BannerCfg>(k: K, val: BannerCfg[K]) => setCfg((c) => ({ ...c, [k]: val }))
  const setL = (k: "title" | "desc" | "reject" | "custom" | "accept" | "link", l: "vi" | "en", val: string) => setCfg((c) => ({ ...c, [k]: { ...c[k], [l]: val } }))
  const rc = rcFn(cfg.consents)
  const checks = bannerChecks(cfg, rc)
  const ok = checks.every((c) => c[0])
  const dirty = JSON.stringify(cfg) !== JSON.stringify(v.cfg) || note !== v.note
  const pool = consents.filter((c) => c.status === "Hoạt động")
  const snap = (c: BannerCfg) => ({ "Kiểu hiển thị": LAYOUTS[c.layout], "Tiêu đề (vi)": c.title.vi, "Mô tả (vi)": c.desc.vi, "Nút Từ chối": c.reject.vi, "Nút Tùy chỉnh": c.custom.vi, "Nút Chấp nhận": c.accept.vi, "Màu chủ đạo": c.color, "Màu chữ nút": c.textColor, "Bo góc": c.radius, "Phông chữ": c.font, "Consent": c.consents, "Ngôn ngữ": c.langs })
  const L = (k: "title" | "desc" | "reject" | "custom" | "accept" | "link", label: string, area?: boolean) => (
    <FormField id={`${k}-${lang}`} label={`${label} (${lang})`}>
      {area ? <Textarea id={`${k}-${lang}`} rows={3} disabled={!editable} value={cfg[k][lang]} onChange={(e) => setL(k, lang, e.target.value)} /> : <Input id={`${k}-${lang}`} disabled={!editable} value={cfg[k][lang]} onChange={(e) => setL(k, lang, e.target.value)} />}
    </FormField>
  )
  return (
    <>
      <PageHeader title={b.name} crumbs={[["Cấu hình"], ["Banner & popup", "/banners"]]} desc={<span className="flex flex-wrap items-center gap-2"><Mono>{b.code}</Mono> · {b.kind === "cookie" ? "Banner cookie" : "Popup consent"} · {b.site} · phiên bản <Mono>v{v.v}</Mono> <StatusBadge s={v.status} /></span>}
        actions={<>
          <Button variant="outline" onClick={() => openCmp({ title: b.code, list: [...(dirty ? [{ label: "Đang sửa (chưa lưu)", snap: snap(cfg) }] : []), ...b.versions.map((x) => ({ label: `v${x.v} · ${x.status}`, snap: snap(x.cfg) }))] })}><GitCompare /> So sánh</Button>
          {can("banner", "edit") && ["Hoạt động", "Thay thế"].includes(v.status) && <Button onClick={() => { newVer(b.code); msg(`Đã tạo phiên bản v${v.v + 1} ở trạng thái Nháp, sao chép từ bản đang áp dụng.`) }}>Tạo phiên bản mới</Button>}
          {v.status === "Chờ duyệt" && <Button onClick={() => openAp("banner:" + b.code)}>Mở đề nghị duyệt</Button>}
          {editable && <Button variant="secondary" onClick={() => { save(b.code, cfg, note); msg(`Đã lưu nháp ${b.code} v${v.v}.`) }}>Lưu nháp</Button>}
          {editable && <Button disabled={!ok || !note.trim()} title={!ok ? "Còn lỗi trong danh sách kiểm tra" : !note.trim() ? "Nhập ghi chú thay đổi" : ""} onClick={() => { save(b.code, cfg, note); submit(b.code); msg(`Đã gửi duyệt banner ${b.code} v${v.v}. DPO sẽ nhận được thông báo. (MSG-C-02)`) }}>Gửi duyệt</Button>}
        </>} />
      <Section className="flex flex-col gap-3">
        {v.retNote && <Note tone="err">Lý do trả lại: {v.retNote}</Note>}
        {!editable && <Note tone="lock">{!can("banner", "edit") ? `Vai trò ${role} chỉ xem cấu hình banner.` : v.status === "Chờ duyệt" ? "Phiên bản đang chờ duyệt, khóa chỉnh sửa (BR-AP-04)." : "Phiên bản đã duyệt là bất biến. Tạo phiên bản mới để thay đổi."}</Note>}
      </Section>
      <Section className="grid gap-4 xl:grid-cols-[400px_1fr]">
        <Card className="gap-3 self-start">
          <CardContent className="flex flex-col gap-4">
            <Tabs defaultValue="layout">
              <TabsList className="w-full"><TabsTrigger value="layout">Bố cục</TabsTrigger><TabsTrigger value="text">Nội dung</TabsTrigger><TabsTrigger value="look">Giao diện</TabsTrigger><TabsTrigger value="consent">Consent</TabsTrigger></TabsList>
              <TabsContent value="layout" className="mt-3 flex flex-col gap-3">
                <FormField label="Kiểu hiển thị" hint="Chỉ các vị trí được khai báo (BR-UC07-01; danh sách cần chốt – phát hiện F-07)">
                  <div className="grid grid-cols-1 gap-1.5">{LAYOUT_BY_KIND[b.kind].map((l) => <label key={l} className={cn("flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm", cfg.layout === l && "border-primary bg-primary/5")}><input type="radio" name="layout" disabled={!editable} checked={cfg.layout === l} onChange={() => set("layout", l)} />{LAYOUTS[l]}</label>)}</div>
                </FormField>
                <FormField label="Ngôn ngữ bật cho Property" hint="Tiếng Việt bắt buộc">
                  <div className="flex gap-4"><label className="flex items-center gap-2 text-sm"><Checkbox checked disabled />Tiếng Việt</label><label className="flex items-center gap-2 text-sm"><Checkbox disabled={!editable} checked={cfg.langs.includes("en")} onCheckedChange={(x) => set("langs", x ? ["vi", "en"] : ["vi"])} />English</label></div>
                </FormField>
                <FormField id="bnote" label="Ghi chú thay đổi" req><Input id="bnote" disabled={!editable} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Đổi tiêu đề và nhãn nút" /></FormField>
              </TabsContent>
              <TabsContent value="text" className="mt-3 flex flex-col gap-3">
                <NativeSelect label="Ngôn ngữ soạn" value={lang} onChange={(x) => setLang(x as "vi" | "en")} options={[["vi", "Tiếng Việt"], ["en", "English"]]} />
                {L("title", "Lời mời – tiêu đề")}{L("desc", "Mô tả", true)}
                <div className="grid grid-cols-3 gap-2">{L("reject", "Nút Từ chối")}{L("custom", b.kind === "cookie" ? "Nút Tùy chỉnh" : "Nút chi tiết")}{L("accept", "Nút Chấp nhận")}</div>
                {L("link", "Liên kết thông báo")}
              </TabsContent>
              <TabsContent value="look" className="mt-3 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Màu chủ đạo (nút)"><div className="flex gap-2"><input type="color" aria-label="Màu chủ đạo" disabled={!editable} value={cfg.color} onChange={(e) => set("color", e.target.value)} className="h-8 w-10 cursor-pointer rounded border" /><Input disabled={!editable} value={cfg.color} onChange={(e) => set("color", e.target.value)} className="font-mono" /></div></FormField>
                  <FormField label="Màu chữ nút"><div className="flex gap-2"><input type="color" aria-label="Màu chữ nút" disabled={!editable} value={cfg.textColor} onChange={(e) => set("textColor", e.target.value)} className="h-8 w-10 cursor-pointer rounded border" /><Input disabled={!editable} value={cfg.textColor} onChange={(e) => set("textColor", e.target.value)} className="font-mono" /></div></FormField>
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"><span>Độ tương phản chữ trên nút</span><b className={contrast(cfg.color, cfg.textColor) >= 4.5 ? "text-success" : "text-destructive"}>{contrast(cfg.color, cfg.textColor).toLocaleString("vi-VN")}:1</b></div>
                <FormField label={`Bo góc: ${cfg.radius}px`}><input type="range" min={0} max={20} disabled={!editable} value={cfg.radius} onChange={(e) => set("radius", +e.target.value)} aria-label="Bo góc" /></FormField>
                <FormField label="Phông chữ" hint="Chọn trong danh sách"><NativeSelect label="Phông chữ" disabled={!editable} value={cfg.font} onChange={(x) => set("font", x)} options={FONTS} className="w-full" /></FormField>
                <label className="flex items-center justify-between text-sm">Hiển thị logo (PNG, SVG ≤ 200 KB)<Switch disabled={!editable} checked={cfg.logo} onCheckedChange={(x) => set("logo", !!x)} /></label>
                <Note tone="lock">Không chỉnh riêng kiểu, kích thước hay màu của từng nút: hai nút luôn dùng cùng tham số (BR-UC07-02, SRS-IF-02).</Note>
              </TabsContent>
              <TabsContent value="consent" className="mt-3 flex flex-col gap-2">
                <div className="text-sm text-muted-foreground">{b.kind === "cookie" ? "Mỗi nhóm cookie là một consent_code (BR-UC11-04). Nhóm Thiết yếu luôn bật." : "Consent hiển thị trên popup (chỉ consent Hoạt động)."}</div>
                {pool.map((c) => <label key={c.code} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><Checkbox disabled={!editable} checked={cfg.consents.includes(c.code)} onCheckedChange={(x) => set("consents", x ? [...cfg.consents, c.code] : cfg.consents.filter((y) => y !== c.code))} /><Mono>{c.code}</Mono><span className="truncate text-muted-foreground">{c.name}</span></label>)}
              </TabsContent>
            </Tabs>
            <div className="rounded-lg border p-3">
              <div className="mb-1.5 text-sm font-medium">Kiểm tra tự động</div>
              {checks.map(([c, t], i) => <div key={i} className="flex items-start gap-2 py-0.5 text-xs">{c ? <Check className="mt-0.5 size-3.5 shrink-0 text-success" /> : <XIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" />}<span className={c ? "" : "text-destructive"}>{t}</span></div>)}
              {!ok && editable && <div className="mt-1.5 text-xs font-medium text-destructive">Nút Gửi duyệt bị khóa cho tới khi hết lỗi.</div>}
            </div>
          </CardContent>
        </Card>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border p-0.5"><Button size="sm" variant={device === "d" ? "secondary" : "ghost"} onClick={() => setDevice("d")}><Monitor /> Máy tính</Button><Button size="sm" variant={device === "m" ? "secondary" : "ghost"} onClick={() => setDevice("m")}><Smartphone /> Di động</Button></div>
            <NativeSelect label="Ngôn ngữ xem trước" value={lang} onChange={(x) => setLang(x as "vi" | "en")} options={cfg.langs.map((l) => [l, l === "vi" ? "Xem: Tiếng Việt" : "Xem: English"] as [string, string])} />
            {b.kind === "cookie" ? <NativeSelect label="Lớp" value={String(layer)} onChange={(x) => setLayer(+x as 1 | 2)} options={[["1", "Lớp 1"], ["2", "Lớp Tùy chỉnh"]]} /> : rc.length > 1 && <NativeSelect label="Consent xem trước" value={String(pv)} onChange={(x) => setPv(+x)} options={rc.map((c, i) => [String(i), c.code] as [string, string])} />}
            <span className="ml-auto text-xs text-muted-foreground">Xem trước dùng đúng component của Mô phỏng thu thập</span>
          </div>
          <DeviceFrame device={device} url={b.site} page={b.kind === "consent" && cfg.layout === "inline" ? undefined : <FakeShop device={device} />}>
            {b.kind === "cookie"
              ? <CookieBanner key={layer + lang} cfg={cfg} lang={lang} groups={rc} layer={layer} interactive={false} />
              : cfg.layout === "inline"
                ? <div className="h-full overflow-y-auto p-4"><div className="text-sm font-bold">Đăng ký / xác thực</div><div className="my-2 grid gap-2">{["Họ và tên", "Số điện thoại"].map((x) => <div key={x} className="h-8 rounded border border-black/15 px-2 py-1.5 text-xs text-black/40">{x}</div>)}</div><ConsentPopup cfg={cfg} lang={lang} consent={rc[pv]} interactive={false} /></div>
                : <ConsentPopup key={pv + lang} cfg={cfg} lang={lang} consent={rc[pv]} interactive={false} />}
          </DeviceFrame>
          <Card className="gap-2 py-4">
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><History className="size-4" /> Lịch sử phiên bản</CardTitle></CardHeader>
            <CardContent className="flex flex-col divide-y">{b.versions.map((x) => <div key={x.v} className="flex flex-wrap items-center gap-2 py-2 text-sm"><Mono className="w-8 font-semibold">v{x.v}</Mono><StatusBadge s={x.status} /><span className="min-w-0 flex-1 truncate">{x.note || "—"}</span><span className="text-xs text-muted-foreground">{x.by}{x.ap ? ` · duyệt ${x.ap}` : ""} · {fmtDT(x.at)}</span></div>)}</CardContent>
          </Card>
        </div>
      </Section>
      {v.status === "Hoạt động" && <Section><WorkflowNextSteps links={[{ label: "Xem Banner trong mô phỏng", to: "/simulator", mod: "sim" }]} /></Section>}
    </>
  )
}
