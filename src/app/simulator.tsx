/**
 * SC-07 Mô phỏng thu thập consent – UC-11, 12, 13, 14, 16, 18, 19, 20, 21, 27, 28, 32.
 * Cột trái: thiết bị của chủ thể. Cột phải: bên trong CMP (evidence, Receipt, event, Decision API).
 */
import * as React from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Monitor, Smartphone, RotateCcw, LogIn, Cookie, ServerCrash, CircleCheck, CircleX, CircleSlash } from "lucide-react"
import { PageHeader, Section, NativeSelect, Note, Mono, StatusBadge, Pill, JsonBlock, FormField } from "@/components/cmp/kit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore, currentStates } from "@/lib/store"
import { COOKIES, SUBJECTS } from "@/lib/mock"
import type { ConsentEvent, Decision, NoticeContent } from "@/lib/types"
import { fakeHash, fmtDT } from "@/lib/fmt"
import { CookieBanner, ConsentPopup, DeviceFrame, FakeShop } from "@/components/cmp/banner-renderer"
import { useRenderConsents } from "./banners"
import { cn } from "@/lib/utils"
import { BusinessContextHelp, RelationshipNote, SimulationNotice, WorkflowNextSteps } from "@/components/cmp/business-context-help"
import { GuidedDemoPanel } from "@/components/cmp/guided-demo"

type LogLine = { at: string; kind: "ev" | "info" | "warn" | "api"; text: string; ev?: ConsentEvent }
const FNS = [
  { fn: "FN-01", name: "Đăng ký thành viên", consent: "CS-MEMBER-REG", banner: "BN-001" },
  { fn: "FN-02", name: "Mở Ví ABC (eKYC)", consent: "CS-EKYC", banner: "BN-002" },
  { fn: "FN-03", name: "Nhận ưu đãi qua email", consent: "CS-MKT-EMAIL", banner: "BN-001" },
  { fn: "FN-04", name: "Gợi ý sản phẩm trên trang chủ", consent: "CS-MKT-PERSONAL", banner: "BN-001" },
]
const LABEL: Record<keyof NoticeContent, string> = { data: "Loại dữ liệu", purpose: "Mục đích", parties: "Bên nhận", rights: "Quyền" }
const newCk = () => "ck_" + fakeHash(String(Date.now())).slice(0, 4) + "…" + fakeHash(String(Math.random())).slice(0, 2)

export default function SimulatorPage() {
  const events = useStore((s) => s.events)
  const [sp] = useSearchParams()
  const [subject, setSubject] = React.useState(SUBJECTS[5])
  const [ck, setCk] = React.useState(newCk)
  const [device, setDevice] = React.useState<"d" | "m">("d")
  const [lang, setLang] = React.useState<"vi" | "en">("vi")
  const [down, setDown] = React.useState(false)
  const [tab, setTab] = React.useState(sp.get("tab") === "pref" ? "pref" : "form")
  const [log, setLog] = React.useState<LogLine[]>([])
  const push = React.useCallback((l: Omit<LogLine, "at">) => setLog((x) => [{ ...l, at: new Date().toISOString() }, ...x].slice(0, 60)), [])
  const subjects = [...SUBJECTS.slice(0, 40), "KH0099001"]
  const states = currentStates(events).filter((c) => c.subject === subject || c.subject === ck)
  return (
    <>
      <PageHeader title="Mô phỏng trải nghiệm khách hàng" crumbs={[["Vận hành"]]} desc="Đóng vai khách hàng để xem cách banner, popup và Preference Center ghi nhận lựa chọn. Kết quả mô phỏng được phản ánh sang Trạng thái đồng ý, Lịch sử & bằng chứng và Dashboard."
        actions={<>
          <BusinessContextHelp title="Mô phỏng trải nghiệm khách hàng" context={{ purpose: "Kết nối cấu hình CMP với trải nghiệm thực tế của khách hàng và hành vi của ứng dụng tích hợp.", when: "Khi cần demo Accept, Reject, Withdraw, Re-consent, dữ liệu nhạy cảm hoặc CMP không khả dụng.", actors: "Người demo đóng vai Khách hàng; cột kết quả thể hiện Ứng dụng tích hợp và Hệ thống mô phỏng.", inputs: "Subject demo, cookie ID, thiết bị, ngôn ngữ, consent và trạng thái CMP.", outputs: "Decision event, trạng thái consent, Receipt/event mô phỏng và dữ liệu cho Records/Evidence/Dashboard.", related: ["Banner", "Consent", "Notice", "Records", "Evidence"], example: "Khách hàng từ chối email marketing; chức năng phụ thuộc bị chặn và evidence REJECTED được tạo.", srs: "UC-11..21, UC-27..29, UC-32" }} />
          <label className="flex items-center gap-2 rounded-lg border px-2.5 py-1 text-sm"><ServerCrash className="size-4 text-destructive" /> CMP không phản hồi <Switch checked={down} onCheckedChange={(v) => { setDown(!!v); push({ kind: "warn", text: v ? "Bật mô phỏng sự cố: CMP Backend không phản hồi → fail-closed (BRL-06)" : "Tắt mô phỏng sự cố" }) }} /></label>
        </>} />
      <Section className="flex flex-col gap-3">
        <SimulationNotice>Receipt, JWS/JWE, webhook và kết quả tích hợp chỉ là dữ liệu minh họa. Mọi quyết định nghiệp vụ vẫn dùng action và state hiện có của prototype.</SimulationNotice>
        <RelationshipNote><b>Phân vai:</b> phần thiết bị là hành động của <b>Khách hàng</b>; các nút chức năng đại diện <b>Ứng dụng tích hợp</b>; công tắc sự cố và nhật ký phiên thuộc <b>Hệ thống mô phỏng</b>, không phải thao tác của khách hàng.</RelationshipNote>
      </Section>
      {sp.get("propertyId") && <PublishedDeploymentScenario propertyId={sp.get("propertyId") || ""} subject={subject} device={device} lang={lang} down={down} push={push} onWithdraw={() => setTab("pref")} />}
      <Section><GuidedDemoPanel onTabChange={(v) => setTab(v)} /></Section>
      <Section className="flex flex-wrap items-end gap-3">
        <FormField label="Chủ thể đã đăng nhập (mã giả danh)"><NativeSelect label="Chủ thể" value={subject} onChange={(v) => { setSubject(v); push({ kind: "info", text: `Đổi chủ thể sang ${v}` }) }} options={subjects.map((s) => [s, s === "KH0099001" ? "KH0099001 (khách mới)" : s] as [string, string])} /></FormField>
        <FormField label="Cookie ID ẩn danh"><div className="flex items-center gap-2"><Mono className="rounded-md border px-2 py-1.5">{ck}</Mono><Button size="sm" variant="outline" onClick={() => { const n = newCk(); setCk(n); push({ kind: "info", text: `Khách mới trên trình duyệt khác: cookie ID ${n}` }) }}><RotateCcw /> Khách mới</Button></div></FormField>
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex rounded-lg border p-0.5"><Button size="sm" variant={device === "d" ? "secondary" : "ghost"} onClick={() => setDevice("d")}><Monitor /> Máy tính</Button><Button size="sm" variant={device === "m" ? "secondary" : "ghost"} onClick={() => setDevice("m")}><Smartphone /> Di động</Button></div>
          <NativeSelect label="Ngôn ngữ" value={lang} onChange={(v) => setLang(v as "vi" | "en")} options={[["vi", "Tiếng Việt"], ["en", "English"]]} />
        </div>
      </Section>
      <Section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
            <TabsList className="flex-wrap"><TabsTrigger value="cookie">Banner cookie</TabsTrigger><TabsTrigger value="form">Form nghiệp vụ</TabsTrigger><TabsTrigger value="pref">Preference Center</TabsTrigger><TabsTrigger value="api">Decision API</TabsTrigger></TabsList>
            <div className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {{ cookie: "Khách hàng chọn nhóm cookie; quan sát tag được chạy hoặc bị chặn.", form: "Ứng dụng gọi CMP.require trước một chức năng; khách hàng Accept hoặc Reject.", pref: "Khách hàng xác minh mô phỏng, xem và thay đổi lựa chọn hiện tại.", api: "Ứng dụng kiểm tra trạng thái consent trước khi xử lý." }[tab]}
            </div>
            <TabsContent value="cookie" className="mt-3"><CookieScenario ck={ck} subject={subject} device={device} lang={lang} down={down} push={push} /></TabsContent>
            <TabsContent value="form" className="mt-3"><FormScenario subject={subject} device={device} lang={lang} down={down} push={push} /></TabsContent>
            <TabsContent value="pref" className="mt-3"><PrefScenario subject={subject} device={device} down={down} push={push} /></TabsContent>
            <TabsContent value="api" className="mt-3"><ApiScenario subject={subject} down={down} push={push} /></TabsContent>
          </Tabs>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="gap-2 py-4">
            <CardHeader><CardTitle className="text-sm">Trạng thái consent hiện hành</CardTitle><CardDescription><Mono>{subject}</Mono> và <Mono>{ck}</Mono></CardDescription></CardHeader>
            <CardContent className="flex flex-col divide-y">
              {states.length ? states.map((s) => <div key={s.subject + s.consent} className="flex items-center justify-between gap-2 py-1.5 text-sm"><span className="min-w-0 truncate"><Mono>{s.consent}</Mono> <span className="text-xs text-muted-foreground">{s.subject.startsWith("ck_") ? "ẩn danh" : ""} {s.last.version}</span></span><StatusBadge s={s.decision} /></div>) : <span className="py-2 text-sm text-muted-foreground">Chưa có quyết định nào.</span>}
            </CardContent>
          </Card>
          <Card className="gap-2 py-4">
            <CardHeader><CardTitle className="text-sm">Bên trong CMP · nhật ký phiên mô phỏng</CardTitle><CardDescription>Evidence chỉ thêm; Receipt ký JWS bọc JWE, CMP chỉ lưu siêu dữ liệu</CardDescription></CardHeader>
            <CardContent className="flex max-h-[560px] flex-col gap-2 overflow-y-auto">
              {log.map((l, i) => (
                <div key={i} className={cn("rounded-md border px-2.5 py-2 text-xs", l.kind === "warn" && "border-warning/40 bg-warning/5", l.kind === "api" && "border-info/30 bg-info/5")}>
                  <div className="flex items-center justify-between gap-2 text-muted-foreground"><span className="font-mono">{fmtDT(l.at, true)}</span>{l.ev && <Link className="font-mono text-primary underline" to={`/evidence?id=${l.ev.id}`}>{l.ev.id}</Link>}</div>
                  <div className="mt-0.5 font-medium">{l.text}</div>
                  {l.ev && <div className="mt-1 grid gap-0.5 font-mono text-[11px] text-muted-foreground">
                    <span>{l.ev.subject} · {l.ev.consent} · {l.ev.version} · <b className="text-foreground">{l.ev.decision}</b> · {l.ev.channel}</span>
                    <span>content_hash {l.ev.hash.slice(0, 16)}… · {l.ev.tx}</span>
                    {l.ev.receipt ? <span>Receipt jti {l.ev.receipt.jti} · kid {l.ev.receipt.kid} · exp {l.ev.receipt.exp}</span> : <span>Không phát Receipt {l.ev.subject.startsWith("ck_") ? "(banner ẩn danh, BR-UC11-05)" : ""}</span>}
                    <span>Event {l.ev.decision === "WITHDRAWN" ? "CONSENT_WITHDRAWN" : l.ev.decision === "ACCEPTED" ? "CONSENT_ACCEPTED" : "CONSENT_REJECTED"} → CRM, CDP (webhook ký HMAC)</span>
                  </div>}
                </div>
              ))}
              {!log.length && <div className="py-6 text-center text-sm text-muted-foreground">Thao tác ở cột trái để xem CMP ghi nhận gì.</div>}
            </CardContent>
          </Card>
        </div>
      </Section>
      <Section>
        <WorkflowNextSteps title="Kiểm tra kết quả mô phỏng" links={[
          { label: "Trạng thái đồng ý", to: "/records", mod: "records", description: "Xem current state theo khách hàng và consent" },
          { label: "Lịch sử & bằng chứng", to: "/evidence", mod: "records", description: "Xem decision event, notice version và Receipt metadata" },
          { label: "Dashboard", to: "/dashboard", mod: "dash", description: "Xem số liệu tổng hợp từ các event" },
          { label: "Ứng dụng & tích hợp", to: "/integrations", mod: "integ", description: "Xem outbox event mô phỏng" },
        ]} />
      </Section>
    </>
  )
}

function PublishedDeploymentScenario({ propertyId, subject, device, lang, down, push, onWithdraw }: { propertyId: string; subject: string; device: "d" | "m"; lang: "vi" | "en"; down: boolean; push: (l: Omit<LogLine, "at">) => void; onWithdraw: () => void }) {
  const property = useStore((s) => s.properties.find((p) => p.id === propertyId))
  const application = useStore((s) => s.applications.find((a) => a.id === property?.applicationId))
  const banners = useStore((s) => s.banners); const record = useStore((s) => s.recordDecision); const rc = useRenderConsents()
  const [last, setLast] = React.useState<ConsentEvent | null>(null)
  if (!property || !application || property.integration?.status !== "PUBLISHED") return <Section><Note tone="err">Deployment không tồn tại, không thuộc tenant hoặc chưa Published.</Note></Section>
  const banner = banners.find((b) => b.code === property.integration?.bannerCode)
  const live = banner?.versions.find((v) => v.status === "Hoạt động")
  const consent = rc([property.integration.consentCode])[0]
  if (!live || !consent) return <Section><Note tone="err">Banner hoặc Consent đã gán không còn ở trạng thái Hoạt động.</Note></Section>
  const decide = (decision: Decision) => {
    if (down) return push({ kind: "warn", text: "CMP không phản hồi; deployment mock không ghi quyết định." })
    const event = record({ subject, consent: property.integration!.consentCode, decision, channel: `Deployment ${property.integration!.deploymentId}`, app: application.id, propertyId: property.id })
    setLast(event); push({ kind: "ev", text: `${property.name}: ${decision}`, ev: event })
  }
  return <Section className="flex flex-col gap-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-semibold">Published Deployment Demo</h2><p className="text-sm text-muted-foreground">{application.name} → {property.name} · <Mono>{property.integration.deploymentId}</Mono> · v{property.integration.version}</p></div><Button variant="outline" render={<Link to={`/applications/${application.id}/properties/${property.id}/integration`} />} nativeButton={false}>Integration Code</Button></div>
    <DeviceFrame device={device} url={property.origin || property.packageName || property.bundleId || property.name} page={<FakeShop device={device} />}><ConsentPopup cfg={{ ...live.cfg, layout: live.cfg.layout === "inline" ? "center" : live.cfg.layout }} lang={lang} consent={consent} onAccept={() => decide("ACCEPTED")} onReject={() => decide("REJECTED")} onClose={() => push({ kind: "info", text: "Đóng popup: không tạo decision event." })} /></DeviceFrame>
    {last && <Card><CardContent className="flex flex-wrap items-center gap-2 pt-6"><StatusBadge s={last.decision} /><Mono>{last.id}</Mono><span className="text-sm">Đã tạo Consent Record và Evidence cho {last.subject}.</span><Button size="sm" variant="outline" render={<Link to={`/records/${last.subject}`} />} nativeButton={false}>Xem Consent Record</Button><Button size="sm" variant="outline" render={<Link to={`/evidence?id=${last.id}`} />} nativeButton={false}>Xem Evidence</Button>{last.decision === "ACCEPTED" && <Button size="sm" onClick={onWithdraw}>Tiếp tục đến Withdraw</Button>}</CardContent></Card>}
  </Section>
}

type Ctx = { subject: string; device: "d" | "m"; lang: "vi" | "en"; down: boolean; push: (l: Omit<LogLine, "at">) => void }

function CookieScenario({ ck, subject, device, lang, down, push }: Ctx & { ck: string }) {
  const banners = useStore((s) => s.banners)
  const events = useStore((s) => s.events)
  const record = useStore((s) => s.recordDecision)
  const rc = useRenderConsents()
  const b = banners.find((x) => x.code === "CK-001")!
  const live = b.versions.find((v) => v.status === "Hoạt động")!
  const groups = rc(live.cfg.consents)
  const mine = currentStates(events).filter((c) => c.subject === ck)
  const decided = mine.length > 0
  const [reopen, setReopen] = React.useState(false)
  const show = !decided || reopen
  const ok = (code: string) => mine.find((m) => m.consent === code)?.decision === "ACCEPTED"
  const currentChoices = Object.fromEntries(groups.map((g) => [g.code, ok(g.code)]))
  const decide = (d: Record<string, boolean>) => {
    if (down) { push({ kind: "warn", text: "Không ghi nhận được quyết định: CMP không phản hồi. SDK giữ chặn tag phi thiết yếu (fail-closed, BRL-06)." }); return }
    Object.entries(d).forEach(([code, v]) => { const e = record({ subject: ck, consent: code, decision: v ? "ACCEPTED" : "REJECTED", channel: "Web", app: "app_7Q2K9M" }); push({ kind: "ev", text: `Banner cookie: ${v ? "Chấp nhận" : "Từ chối"} nhóm ${code}`, ev: e }) })
    setReopen(false)
  }
  const link = () => {
    if (!mine.length) return push({ kind: "info", text: "Chưa có quyết định ẩn danh nào để liên kết." })
    mine.forEach((m) => { const e = record({ subject, consent: m.consent, decision: m.decision, channel: "Web", app: "app_7Q2K9M", source: "Liên kết từ cookie", linkedFrom: ck }); push({ kind: "ev", text: `Liên kết tự động (UC-18): ${ck} → ${subject}, giữ nguyên quyết định ${m.decision}`, ev: e }) })
  }
  return (
    <div className="flex flex-col gap-3">
      <DeviceFrame device={device} url="abcmart.vn" page={<FakeShop device={device} />}>
        {show && <CookieBanner key={ck + String(reopen)} cfg={live.cfg} lang={lang} groups={groups} initialChoices={decided ? currentChoices : undefined} onDecide={decide} />}
        {!show && <button onClick={() => setReopen(true)} className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium shadow-md"><Cookie className="size-3.5" /> Tùy chọn cookie</button>}
      </DeviceFrame>
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="gap-2 py-4">
          <CardHeader><CardTitle className="text-sm">Tag trên trang (UC-32, GTM Consent Mode)</CardTitle><CardDescription>Trước quyết định không tag phi thiết yếu nào chạy (BR-UC11-02)</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-1">{COOKIES.map((c) => { const run = c.grp === "Thiết yếu" || ok(c.grp); return <div key={c.name} className="flex items-center justify-between text-xs"><span><Mono>{c.name}</Mono> · {c.prov}</span>{run ? <span className="flex items-center gap-1 text-success"><CircleCheck className="size-3.5" />Đang chạy</span> : <span className="flex items-center gap-1 text-muted-foreground"><CircleSlash className="size-3.5" />Bị chặn</span>}</div> })}</CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader><CardTitle className="text-sm">Đăng nhập trên trình duyệt này</CardTitle><CardDescription>Liên kết định danh chạy tự động hoàn toàn (SRS v1.3, UC-18)</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs">
            <p>Khi khách đăng nhập với <Mono>{subject}</Mono>, CMP liên kết cookie ID <Mono>{ck}</Mono> và ghi evidence nguồn "Liên kết từ cookie". Liên kết không tạo đồng ý cho định danh doanh nghiệp từ đồng ý ngầm (BR-UC18-06); xung đột áp dụng lựa chọn hạn chế hơn (BRL-08).</p>
            <Button size="sm" variant="outline" onClick={link}><LogIn /> Đăng nhập và liên kết</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FormScenario({ subject, device, lang, down, push }: Ctx) {
  const banners = useStore((s) => s.banners)
  const events = useStore((s) => s.events)
  const notices = useStore((s) => s.notices)
  const matrix = useStore((s) => s.matrix)
  const record = useStore((s) => s.recordDecision)
  const rc = useRenderConsents()
  const [pending, setPending] = React.useState<(typeof FNS)[number] | null>(null)
  const [mode, setMode] = React.useState<"normal" | "sensitive" | "reconsent">("normal")
  const [result, setResult] = React.useState<{ tone: "ok" | "err" | "info"; text: string } | null>(null)
  const state = (code: string) => currentStates(events).find((c) => c.subject === subject && c.consent === code)
  const pub = (code: string) => notices.find((n) => n.consent === code && n.status === "Published")
  const required = (fn: string, code: string) => {
    const m = matrix.find((x) => x.app === "app_3HX81P" && x.status === "Hoạt động")!
    const row = m.rows.find((r) => r.fn === fn)
    const purposes = useStore.getState().consents.find((c) => c.code === code)?.purposes || []
    return !!row && purposes.some((p) => row.purposes[p])
  }
  const require = (f: (typeof FNS)[number]) => {
    setResult(null)
    push({ kind: "api", text: `FE gọi CMP.require("${f.consent}") cho chức năng ${f.fn} ${f.name}` })
    if (down) { setResult({ tone: "err", text: `Hiện chưa thể ghi nhận lựa chọn của bạn. Chức năng ${f.name} tạm thời chưa thực hiện được. (MSG-12-03)` }); push({ kind: "warn", text: "CMP không phản hồi trong thời hạn chờ → UNKNOWN, xử lý như DENIED (fail-closed)" }); return }
    const st = state(f.consent); const p = pub(f.consent)
    if (st?.decision === "ACCEPTED" && st.last.version === p?.v) { setResult({ tone: "ok", text: `${f.name}: thực hiện thành công. Đã có consent hợp lệ cho phiên bản ${p?.v}, không hỏi lại (BRL-01).` }); push({ kind: "api", text: `CMP.require → ALLOWED (đã ACCEPTED ${p?.v})` }); return }
    const rcx = rc([f.consent])[0]
    setMode(st && (st.decision === "RE_CONSENT" || st.decision === "EXPIRED" || (st.decision === "ACCEPTED" && st.last.version !== p?.v)) ? "reconsent" : rcx.sensitive ? "sensitive" : "normal")
    setPending(f)
  }
  const diff = (): [string, string, string][] => {
    if (!pending) return []
    const p = pub(pending.consent)
    const lastAcc = events.filter((e) => e.subject === subject && e.consent === pending.consent && e.decision === "ACCEPTED").sort((a, b) => (a.ts < b.ts ? 1 : -1))[0]
    const old = notices.find((n) => n.consent === pending.consent && n.v === lastAcc?.version)
    if (!old || !p) return []
    return (Object.keys(LABEL) as (keyof NoticeContent)[]).filter((k) => old.content.vi[k] !== p.content.vi[k]).map((k) => [LABEL[k], old.content.vi[k], p.content.vi[k]])
  }
  const decide = (d: Decision) => {
    const f = pending!; setPending(null)
    const e = record({ subject, consent: f.consent, decision: d, channel: "Form nghiệp vụ", app: "app_3HX81P", sensitive: mode === "sensitive" || undefined, explicitConfirm: mode === "sensitive" ? true : undefined })
    push({ kind: "ev", text: `${d === "ACCEPTED" ? "Đồng ý" : "Từ chối"} ${f.consent}${mode === "reconsent" ? " (tái đồng ý, UC-16)" : mode === "sensitive" ? " (dữ liệu nhạy cảm, UC-14)" : ""}`, ev: e })
    if (d === "ACCEPTED") setResult({ tone: "ok", text: `${mode === "sensitive" ? "Đã ghi nhận đồng ý xử lý dữ liệu nhạy cảm" : "Đã ghi nhận lựa chọn Đồng ý"} lúc ${fmtDT(e.ts, true)}. ${f.name}: thực hiện thành công. Receipt chuyển tiếp cho BE T3 xác minh (UC-29).` })
    else if (required(f.fn, f.consent)) setResult({ tone: "err", text: `Bạn đã từ chối xử lý dữ liệu cho mục đích ${f.consent}, nên chúng tôi chưa thể thực hiện ${f.name}. Các chức năng khác vẫn dùng bình thường. (MSG-13-02) Bạn có thể đổi lựa chọn ở Preference Center.` })
    else setResult({ tone: "info", text: `Đã ghi nhận lựa chọn Từ chối lúc ${fmtDT(e.ts, true)}. Bạn vẫn tiếp tục ${f.name} bình thường. (MSG-13-01)` })
  }
  const [showTechnical, setShowTechnical] = React.useState(false)
  const [showPreferences, setShowPreferences] = React.useState(false)
  const optionalFns = FNS.filter((f) => f.fn === "FN-03" || f.fn === "FN-04")
  const [optionalChoices, setOptionalChoices] = React.useState<Record<string, boolean>>({})
  const chooseOptional = (value: boolean) => {
    if (down) {
      push({ kind: "warn", text: "CMP không phản hồi: không ghi nhận được lựa chọn." })
      return
    }
    optionalFns.forEach((f) => {
      const e = record({ subject, consent: f.consent, decision: value ? "ACCEPTED" : "REJECTED", channel: "Form nghiệp vụ", app: "app_3HX81P" })
      push({ kind: "ev", text: `${value ? "Đồng ý" : "Từ chối"} ${f.name}`, ev: e })
    })
    setOptionalChoices(Object.fromEntries(optionalFns.map((f) => [f.consent, value])))
    setShowPreferences(false)
    setResult({ tone: "ok", text: value ? "Đã lưu lựa chọn đồng ý cho các mục đích tùy chọn." : "Đã lưu lựa chọn từ chối các mục đích tùy chọn. Bạn vẫn có thể sử dụng các chức năng khác." })
  }
  const saveOptionalChoices = () => {
    if (down) {
      push({ kind: "warn", text: "CMP không phản hồi: không ghi nhận được lựa chọn." })
      return
    }
    optionalFns.forEach((f) => {
      const accepted = !!optionalChoices[f.consent]
      const e = record({ subject, consent: f.consent, decision: accepted ? "ACCEPTED" : "REJECTED", channel: "Form nghiệp vụ", app: "app_3HX81P" })
      push({ kind: "ev", text: `${accepted ? "Đồng ý" : "Từ chối"} ${f.name}`, ev: e })
    })
    setShowPreferences(false)
    setResult({ tone: "ok", text: "Đã lưu lựa chọn riêng cho từng mục đích." })
  }
  const bannerCfg = (code: string) => banners.find((b) => b.code === code)?.versions.find((v) => v.status === "Hoạt động")?.cfg || banners[0].versions[0].cfg
  const reset = (code: string) => { const e = record({ subject, consent: code, decision: "RE_CONSENT", channel: "Hệ thống", app: "app_3HX81P" }); push({ kind: "ev", text: `Mô phỏng: xuất bản phiên bản trọng yếu → ${code} chuyển RE_CONSENT, phát VERSION_CHANGED`, ev: e }) }
  return (
    <div className="flex flex-col gap-3">
      <DeviceFrame device={device} url="member.abcmart.vn/tai-khoan" page={
        <div className="h-full overflow-y-auto bg-[#F7F9FC] p-4 text-[#16202E] sm:p-6">
          <div className="text-xs font-bold text-[#C8102E]">ABC Mart · Thành viên</div>
          <h2 className="mt-1 text-xl font-bold">Chào mừng bạn quay lại</h2>
          <p className="mt-1 text-xs text-black/60">Quản lý tài khoản và trải nghiệm của bạn.</p>

          <div className="mt-4 rounded-xl border border-[#DCE5F4] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold">Quyền riêng tư của bạn</h3>
                <p className="mt-1 text-xs leading-relaxed text-black/65">Bạn có thể lựa chọn nhận ưu đãi và cá nhân hóa trải nghiệm. Từ chối các mục đích tùy chọn không ảnh hưởng đến việc sử dụng dịch vụ khác.</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#EAF2FF] px-2 py-1 text-[10px] font-medium text-[#2457C5]">Tùy bạn quyết định</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" data-testid="quick-reject" onClick={() => chooseOptional(false)} className="min-h-10 rounded-lg border border-[#2457C5] bg-white px-3 py-2 text-sm font-semibold text-[#2457C5] hover:bg-[#F0F5FF]">Từ chối tùy chọn</button>
              <button type="button" data-testid="quick-accept" onClick={() => chooseOptional(true)} className="min-h-10 rounded-lg bg-[#2457C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1946A7]">Đồng ý tất cả tùy chọn</button>
            </div>
            <button type="button" data-testid="quick-custom" onClick={() => setShowPreferences((v) => !v)} className="mt-3 text-xs font-semibold text-[#2457C5] underline underline-offset-2">{showPreferences ? "Ẩn tùy chỉnh" : "Tùy chỉnh lựa chọn"}</button>
            {showPreferences && <div className="mt-3 space-y-2 border-t border-black/10 pt-3">
              {optionalFns.map((f) => <label key={f.consent} className="flex items-center justify-between gap-3 rounded-lg bg-[#F7F9FC] p-3 text-xs">
                <span className="font-medium">{f.name}</span>
                <input type="checkbox" className="size-4 accent-[#2457C5]" checked={optionalChoices[f.consent] ?? state(f.consent)?.decision === "ACCEPTED"} onChange={(e) => setOptionalChoices((prev) => ({ ...prev, [f.consent]: e.target.checked }))} />
              </label>)}
              <button type="button" data-testid="quick-save" onClick={saveOptionalChoices} className="w-full rounded-lg bg-[#2457C5] px-3 py-2 text-sm font-semibold text-white">Lưu lựa chọn</button>
            </div>}
          </div>

          <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
            <h3 className="text-sm font-bold">Dịch vụ của bạn</h3>
            <p className="mt-1 text-xs text-black/60">Một số dịch vụ có thể cần thông báo và xác nhận riêng khi bạn sử dụng.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {FNS.filter((f) => f.fn === "FN-01" || f.fn === "FN-02").map((f) => <button key={f.fn} data-testid={"fn-" + f.fn} onClick={() => require(f)} className="rounded-lg border border-black/15 p-3 text-left text-sm font-semibold hover:border-[#2457C5] hover:bg-[#F7F9FF]">{f.name}<span className="mt-1 block text-[11px] font-normal text-black/50">Tiếp tục →</span></button>)}
            </div>
          </div>
          <button type="button" onClick={() => setShowTechnical((v) => !v)} className="mt-3 text-[11px] text-black/50 underline">{showTechnical ? "Ẩn công cụ mô phỏng" : "Hiển thị công cụ mô phỏng nâng cao"}</button>
          {showTechnical && <div className="mt-2 grid gap-2 sm:grid-cols-2">{FNS.map((f) => <button key={f.fn} data-testid={"fn-advanced-" + f.fn} onClick={() => require(f)} className="rounded-md border border-black/15 bg-white p-2 text-left text-xs">{f.name}<span className="block font-mono text-[10px] text-black/50">{f.consent} · {state(f.consent)?.decision || "chưa có"}</span></button>)}</div>}
          {result && <div data-testid="fn-result" role="status" className={cn("mt-4 rounded-lg p-3 text-sm", result.tone === "ok" ? "bg-[#E3F4EA] text-[#17663F]" : result.tone === "err" ? "bg-[#FCE7E5] text-[#A1201A]" : "bg-[#E6EEFB] text-[#1D4BAE]")}>{result.text}</div>}
        </div>}>
        {pending && <ConsentPopup key={pending.consent + mode} cfg={{ ...bannerCfg(pending.banner), layout: bannerCfg(pending.banner).layout === "inline" ? "center" : bannerCfg(pending.banner).layout }} lang={lang} consent={rc([pending.consent])[0]} mode={mode} diff={mode === "reconsent" ? diff() : undefined}
          onAccept={() => decide("ACCEPTED")} onReject={() => decide("REJECTED")} onClose={() => { push({ kind: "info", text: `Chủ thể đóng popup ${pending.consent}: DISMISSED – không phải quyết định, không ghi evidence, không tính Từ chối (BR-UC12-09)` }); setPending(null) }} />}
      </DeviceFrame>
      <Card className="gap-2 py-4">
        <CardHeader><CardTitle className="text-sm">Công cụ trình diễn</CardTitle><CardDescription>Đưa consent của chủ thể về trạng thái cần đồng ý lại để thấy popup tái đồng ý (UC-16)</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2">{FNS.map((f) => <Button key={f.fn} size="sm" variant="outline" onClick={() => reset(f.consent)}>RE_CONSENT {f.consent}</Button>)}</CardContent>
      </Card>
    </div>
  )
}

function PrefScenario({ subject, device, down, push }: Omit<Ctx, "lang">) {
  const events = useStore((s) => s.events)
  const consents = useStore((s) => s.consents)
  const record = useStore((s) => s.recordDecision)
  const [step, setStep] = React.useState<"id" | "otp" | "in">("id")
  const [otp, setOtp] = React.useState("")
  const [tries, setTries] = React.useState(5)
  const [ask, setAsk] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState<"p" | "c">("p")
  const mine = currentStates(events).filter((c) => c.subject === subject)
  const list = consents.filter((c) => mine.some((m) => m.consent === c.code))
  const st = (code: string) => mine.find((m) => m.consent === code)?.decision
  const act = (code: string, d: Decision) => {
    if (down) return push({ kind: "warn", text: "Chưa rút lại được do lỗi hệ thống. Vui lòng thử lại. (MSG-20-03)" })
    const e = record({ subject, consent: code, decision: d, channel: "Preference Center", app: "app_3HX81P", source: "Preference Center" })
    push({ kind: "ev", text: d === "WITHDRAWN" ? `Rút lại ${code} tại T0 ${fmtDT(e.ts, true)}: Decision API trả Không từ T0, suppression cập nhật ngay (BR-UC20-04)` : `Đồng ý lại ${code} qua Preference Center`, ev: e })
    setAsk(null)
  }
  const MKT = [["Email", "CS-MKT-EMAIL"], ["Zalo", "CS-MKT-ZALO"], ["SMS", ""], ["Thông báo đẩy", ""]] as const
  return (
    <DeviceFrame device={device} url="member.abcmart.vn/tuy-chon" page={
      <div className="h-full overflow-y-auto p-5 text-[#16202E]">
        <div className="text-xs font-bold text-[#C8102E]">ABC Mart · Trang tùy chọn quyền riêng tư</div>
        {step === "id" && (
          <div className="mt-4 flex max-w-sm flex-col gap-2">
            <div className="text-lg font-bold">Quản lý đồng ý của bạn</div>
            <p className="text-xs text-black/60">Không cần tài khoản: nhập số điện thoại hoặc email đã đăng ký để nhận mã xác thực (UC-19, F-507).</p>
            <input aria-label="Số điện thoại" className="h-9 rounded-md border border-black/20 px-2 text-sm" defaultValue="09•• ••• 482" />
            <button className="h-9 rounded-md bg-[#2457C5] text-sm font-semibold text-white" onClick={() => { setStep("otp"); push({ kind: "info", text: "Gửi OTP qua cổng SMS (UC-31). Thông báo không tiết lộ định danh có tồn tại hay không (MSG-19-01, SRS-NFR-17)" }) }}>Gửi mã</button>
          </div>
        )}
        {step === "otp" && (
          <div className="mt-4 flex max-w-sm flex-col gap-2">
            <div className="rounded-md bg-[#E6EEFB] p-2 text-xs">Nếu thông tin đã được đăng ký, bạn sẽ nhận được mã trong ít phút. (MSG-19-01) · Mã minh họa: <b>123456</b></div>
            <input aria-label="Mã OTP" data-testid="otp" className="h-9 rounded-md border border-black/20 px-2 font-mono text-sm tracking-widest" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6 chữ số" />
            <button className="h-9 rounded-md bg-[#2457C5] text-sm font-semibold text-white" onClick={() => { if (otp === "123456") { setStep("in"); push({ kind: "info", text: `Xác thực OTP thành công, mở Preference Center cho ${subject}` }) } else { const t = tries - 1; setTries(t); push({ kind: "warn", text: t > 0 ? `Mã chưa đúng. Bạn còn ${t} lần thử trước khi bị tạm khóa [N] phút. (MSG-19-02)` : "Bạn đã nhập sai quá số lần cho phép. Vui lòng thử lại sau [N] phút. (MSG-19-03)" }) } }}>Xác nhận</button>
          </div>
        )}
        {step === "in" && (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex gap-1 rounded-lg bg-black/[0.05] p-1 text-sm">{([["p", "Đồng ý của tôi"], ["c", "Kênh liên lạc"]] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cn("flex-1 rounded-md py-1.5", tab === k && "bg-white font-semibold shadow-sm")}>{l}</button>)}</div>
            {tab === "p" && list.map((c) => { const on = st(c.code) === "ACCEPTED"; return (
              <div key={c.code} className="rounded-lg border border-black/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0"><div className="text-sm font-semibold">{c.name}</div><div className="font-mono text-[11px] text-black/50">{c.code} · {c.kind} · {st(c.code)}</div></div>
                  <button role="switch" aria-checked={on} data-testid={"pc-" + c.code} onClick={() => (on ? setAsk(c.code) : act(c.code, "ACCEPTED"))} className={cn("h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors", on ? "bg-[#2457C5]" : "bg-black/20")}><span className={cn("block size-5 rounded-full bg-white transition-transform", on && "translate-x-5")} /></button>
                </div>
                {ask === c.code && (
                  <div className="mt-2 rounded-md bg-[#FFF8EC] p-2 text-xs">
                    {c.kind === "Bắt buộc" ? <p>Mục "{c.name}" là bắt buộc cho Đăng ký thành viên. Nếu rút lại, chức năng này sẽ ngừng hoạt động cho đến khi bạn đồng ý lại. Bạn vẫn muốn rút lại? (MSG-20-02)</p> : <p>Rút lại đồng ý "{c.name}"? Hiệu lực ngay, không ảnh hưởng xử lý trước thời điểm này.</p>}
                    <div className="mt-2 flex gap-2"><button className="rounded border border-black/20 px-2 py-1" onClick={() => setAsk(null)}>Hủy</button><button data-testid="pc-confirm" className="rounded bg-[#B42318] px-2 py-1 font-semibold text-white" onClick={() => act(c.code, "WITHDRAWN")}>Rút lại</button></div>
                  </div>
                )}
              </div>) })}
            {tab === "p" && <p className="text-[11px] text-black/50">Rút lại: một thao tác tắt và một xác nhận, không nhiều bước hơn khi đồng ý (BR-UC20-01).</p>}
            {tab === "c" && (
              <div className="flex flex-col gap-2">
                {MKT.map(([ch, code]) => { const ok = code && consents.find((c) => c.code === code)?.status === "Hoạt động"; const on = ok && st(code) === "ACCEPTED"; return (
                  <div key={ch} className="flex items-center justify-between rounded-lg border border-black/10 p-3 text-sm">
                    <span><b>{ch}</b> <span className="text-xs text-black/50">{ok ? code : "chưa cấu hình consent"}</span></span>
                    {ok ? <button role="switch" aria-checked={!!on} onClick={() => act(code, on ? "WITHDRAWN" : "ACCEPTED")} className={cn("h-6 w-11 rounded-full p-0.5", on ? "bg-[#2457C5]" : "bg-black/20")}><span className={cn("block size-5 rounded-full bg-white transition-transform", on && "translate-x-5")} /></button> : <span className="text-xs text-black/40">—</span>}
                  </div>) })}
                <button className="h-9 rounded-md border border-[#B42318] text-sm font-semibold text-[#B42318]" onClick={() => { MKT.forEach(([, code]) => { if (code && st(code) === "ACCEPTED") act(code, "WITHDRAWN") }); push({ kind: "info", text: "Từ chối toàn bộ tiếp thị trong một thao tác (BR-UC21-02); tin giao dịch, OTP không bị chặn (BR-UC21-04)" }) }}>Từ chối toàn bộ tiếp thị</button>
              </div>
            )}
          </div>
        )}
      </div>} />
  )
}

function ApiScenario({ subject, down, push }: { subject: string; down: boolean; push: Ctx["push"] }) {
  const events = useStore((s) => s.events)
  const notices = useStore((s) => s.notices)
  const consents = useStore((s) => s.consents)
  const [code, setCode] = React.useState("CS-MKT-EMAIL")
  const [res, setRes] = React.useState<Record<string, unknown> | null>(null)
  const call = () => {
    const st = currentStates(events).find((c) => c.subject === subject && c.consent === code)
    const pub = notices.find((n) => n.consent === code && n.status === "Published")
    let result = "DENIED", reason = "NO_CONSENT"
    if (down) { result = "UNKNOWN"; reason = "CMP_UNAVAILABLE" }
    else if (st?.decision === "ACCEPTED" && st.last.version === pub?.v) { result = "ALLOWED"; reason = "CONSENT_VALID" }
    else if (st?.decision === "ACCEPTED") reason = "VERSION_CHANGED"
    else if (st) reason = { REJECTED: "REJECTED", WITHDRAWN: "WITHDRAWN", RE_CONSENT: "RE_CONSENT_REQUIRED", EXPIRED: "EXPIRED", NOT_CONSENTED: "NO_CONSENT", ACCEPTED: "" }[st.decision]
    const r = { request: { subject_ref: subject, consent_code: code, channel: "web" }, response: { result, reason_code: reason + " [TBD]", policy_version: pub?.v || null, evaluated_at: new Date().toISOString(), cache_ttl: "[N] giây" }, ghi_chu: result === "UNKNOWN" ? "UNKNOWN xử lý như DENIED (fail-closed)" : undefined }
    setRes(r); push({ kind: "api", text: `BE T3 gọi Decision API: ${subject} × ${code} → ${result} (${reason})` })
  }
  return (
    <Card className="gap-3">
      <CardHeader><CardTitle>Decision API (UC-27)</CardTitle><CardDescription>Backend T3 hỏi CMP trước khi xử lý: trả ALLOWED, DENIED hoặc UNKNOWN kèm mã lý do. Chỉ ALLOWED khi trạng thái ACCEPTED, đúng phiên bản hiện hành và chưa hết hạn (mục 5.2).</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <FormField label="Chủ thể"><Input value={subject} readOnly className="w-36 font-mono" /></FormField>
          <FormField label="consent_code"><NativeSelect label="consent_code" value={code} onChange={setCode} options={consents.filter((c) => c.status === "Hoạt động").map((c) => c.code)} /></FormField>
          <Button onClick={call}>Gửi yêu cầu</Button>
        </div>
        {res && <div className="flex items-center gap-2 text-sm">{(res.response as { result: string }).result === "ALLOWED" ? <CircleCheck className="size-5 text-success" /> : <CircleX className="size-5 text-destructive" />}<b>{(res.response as { result: string }).result}</b><Pill>{(res.response as { reason_code: string }).reason_code}</Pill></div>}
        {res && <JsonBlock data={res} />}
        <Note>Tên trường, mã lý do chính thức chốt ở tài liệu đặc tả API riêng [TBD] (SRS mục 3.4). Prototype chỉ minh họa logic.</Note>
      </CardContent>
    </Card>
  )
}
