/**
 * Evidence Management – UC-36 (SCR-36-01, 36-02), UC-37 (SCR-37-01, 37-02), UC-28 (Receipt), UC-18 (nguồn liên kết)
 * Gồm: Bằng chứng (danh sách + ngăn chi tiết), Lịch sử consent theo chủ thể, Xuất gói và trang Gói bằng chứng.
 */
import * as React from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Search, FileDown, Copy, Link2, ShieldAlert, ArrowLeft } from "lucide-react"
import { PageHeader, Section, Kpi, StatusBadge, NativeSelect, Note, Mono, Pill, KV, JsonBlock, FormField, Empty, decisionVi } from "@/components/cmp/kit"
import { DataTable, type Col } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useCan, useStore, currentStates } from "@/lib/store"
import type { ConsentEvent } from "@/lib/types"
import { fmtDT, fmtN, maskIp, shortHash } from "@/lib/fmt"
import { msg } from "@/components/cmp/approval"
import { BusinessContextHelp, RelationshipNote, SimulationNotice, WorkflowNextSteps } from "@/components/cmp/business-context-help"
import { NoticeBlock } from "@/components/cmp/banner-renderer"
import { cn } from "@/lib/utils"

const REASONS = ["Thanh tra, kiểm tra", "Yêu cầu quyền của chủ thể", "Tranh chấp, khiếu nại", "Kiểm toán nội bộ"]
const SRC_TONE = { "Trực tuyến": "mute", "Ngoại tuyến": "warn", Legacy: "dark", "Liên kết từ cookie": "info", "Preference Center": "violet" } as const
export const SourcePill = ({ e }: { e: ConsentEvent }) => <Pill tone={SRC_TONE[e.source]}>{e.source}{e.legacyRisk ? " · rủi ro" : ""}</Pill>
const copy = (t: string) => { navigator.clipboard?.writeText(t).then(() => msg("Đã sao chép."), () => msg("Trình duyệt không cho sao chép; hãy chọn và sao chép thủ công.", "info")) }

/** Ghi nhật ký lượt tra cứu, xem chi tiết (BR-UC36-03) – một lần cho mỗi đối tượng */
function useViewLog(act: string, obj: string | undefined) {
  const log = useStore((s) => s.log)
  React.useEffect(() => { if (obj) log(act, obj) }, [act, obj, log])
}

export default function EvidencePage() {
  const events = useStore((s) => s.events)
  const consents = useStore((s) => s.consents)
  const role = useStore((s) => s.role)
  const can = useCan()
  const [sp, setSp] = useSearchParams()
  const sel = sp.get("id")
  const [q, setQ] = React.useState("")
  const [fc, setFc] = React.useState("all")
  const [fd, setFd] = React.useState("all")
  const [fs, setFs] = React.useState("all")
  const [from, setFrom] = React.useState("2026-08-01")
  const [to, setTo] = React.useState("2026-12-31")
  const [exp, setExp] = React.useState(false)
  const data = events.filter((e) => e.subject.startsWith("KH") && (fc === "all" || e.consent === fc) && (fd === "all" || e.decision === fd) && (fs === "all" || e.source === fs) && (!q || (e.subject + e.id + (e.offline?.id || "")).toLowerCase().includes(q.toLowerCase())) && (fs === "Legacy" || (e.ts.slice(0, 10) >= from && e.ts.slice(0, 10) <= to)))
  useViewLog("Tra cứu evidence", q.length >= 9 ? q : undefined)
  const cols: Col<ConsentEvent>[] = [
    { accessorKey: "id", header: "Mã evidence", cell: ({ row }) => <div><Mono className="font-semibold">{row.original.id}</Mono>{row.original.correctionOf && <div className="text-[11px] text-warning">Hiệu chỉnh {row.original.correctionOf}</div>}</div> },
    { accessorKey: "ts", header: ({ column }) => <DataTableColumnHeader column={column} title="Thời điểm (máy chủ)" />, cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs">{fmtDT(row.original.ts, true)}</span> },
    { accessorKey: "subject", header: "Mã khách hàng", cell: ({ row }) => <Link onClick={(e) => e.stopPropagation()} to={`/records/${row.original.subject}`} className="font-mono text-xs text-primary hover:underline">{row.original.subject}</Link> },
    { accessorKey: "consent", header: "consent_code", cell: ({ row }) => <Mono>{row.original.consent}</Mono> },
    { accessorKey: "version", header: "Phiên bản", cell: ({ row }) => <Mono>{row.original.version}</Mono> },
    { accessorKey: "decision", header: "Quyết định", cell: ({ row }) => <StatusBadge s={row.original.decision} /> },
    { accessorKey: "channel", header: "Kênh", cell: ({ row }) => <span className="text-sm">{row.original.channel}</span> },
    { id: "src", header: "Nguồn", cell: ({ row }) => <SourcePill e={row.original} /> },
    { id: "rc", header: "Receipt", cell: ({ row }) => (row.original.receipt ? <Pill tone="ok">Có</Pill> : <span className="text-xs text-muted-foreground">—</span>) },
  ]
  return (
    <>
      <PageHeader title="Bằng chứng" crumbs={[["Vận hành"]]} desc="Mọi sự kiện consent ghi vào sổ chỉ thêm (append-only, WORM): ai, consent nào, phiên bản nào, quyết định gì, lúc nào, qua ứng dụng nào (BR-UC36-05). Evidence chỉ đọc; sai sót xử lý bằng sự kiện hiệu chỉnh có lý do."
        actions={can("evidence", "edit") ? <Button onClick={() => setExp(true)}><FileDown /> Xuất gói bằng chứng</Button> : undefined} />
      <Section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <BusinessContextHelp title="Lịch sử và bằng chứng đồng ý" context={{ purpose: "Giải thích khách hàng đã quyết định gì, khi nào, qua nguồn nào và dựa trên notice version nào.", when: "Khi cần điều tra lịch sử, hiệu chỉnh sai sót hoặc chuẩn bị gói bằng chứng.", actors: "DPO/Admin; Nhân viên xem giới hạn theo quyền.", inputs: "Subject, consent, decision, source, Property và khoảng thời gian.", outputs: "Evidence detail, Receipt metadata, related events, correction hoặc evidence package.", related: ["Records", "Evidence", "Audit", "Dashboard"], example: "Một lần WITHDRAWN được nối với lần ACCEPTED trước đó và version nội dung đã hiển thị.", srs: "UC-36, UC-37" }} />
          <RelationshipNote>Records tóm tắt current state; Evidence giữ chuỗi sự kiện để giải thích current state và phục vụ kiểm tra.</RelationshipNote>
        </div>
        <SimulationNotice>WORM, SHA-256, Receipt JWS/JWE và chữ ký trong màn hình này là metadata mô phỏng phục vụ review nghiệp vụ.</SimulationNotice>
      </Section>
      <Section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Evidence khớp lọc" value={fmtN(data.length)} />
        <Kpi label="Có Receipt" value={fmtN(data.filter((e) => e.receipt).length)} sub="Ký JWS, mã hóa JWE · chỉ lưu siêu dữ liệu" />
        <Kpi label="Ngoại tuyến" value={fmtN(data.filter((e) => e.source === "Ngoại tuyến").length)} sub="Kèm tệp, hash SHA-256" />
        <Kpi label="Legacy gắn cờ rủi ro" value={fmtN(events.filter((e) => e.legacyRisk).length)} tone="warn" sub="Thiếu bằng chứng gốc (BRL-14)" />
      </Section>
      <Section><WorkflowNextSteps title="Liên kết nghiệp vụ" links={[{ label: "Trạng thái đồng ý", to: "/records", mod: "records" }, { label: "Nhật ký kiểm toán", to: "/audit", mod: "audit", description: "Xem ai đã tra cứu, hiệu chỉnh hoặc xuất gói" }]} /></Section>
      <Section className="flex flex-col gap-3">
        {role === "Nhân viên" && <Note tone="lock">Nhân viên xem giới hạn: IP, user agent bị che; không có nút xuất gói (mục 4.2, BR-UC36-04).</Note>}
        {role === "Admin" && <Note tone="lock">Admin xem được evidence nhưng không xuất gói bằng chứng; chỉ DPO có quyền này (BR-UC37-03).</Note>}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative"><Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input className="h-8 w-60 pl-8" placeholder="Mã khách hàng, EV-…, OFF-…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <NativeSelect label="Consent" value={fc} onChange={setFc} options={[["all", "Mọi consent"], ...consents.filter((c) => c.everActive).map((c) => [c.code, c.code] as [string, string])]} />
          <NativeSelect label="Quyết định" value={fd} onChange={setFd} options={[["all", "Mọi quyết định"], ...["ACCEPTED", "REJECTED", "WITHDRAWN", "RE_CONSENT"].map((d) => [d, decisionVi(d)] as [string, string])]} />
          <NativeSelect label="Nguồn" value={fs} onChange={setFs} options={[["all", "Mọi nguồn"], "Trực tuyến", "Ngoại tuyến", "Legacy", "Liên kết từ cookie", "Preference Center"]} />
          <Input type="date" aria-label="Từ ngày" className="h-8 w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" aria-label="Đến ngày" className="h-8 w-36" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <DataTable columns={cols} data={data} onRowClick={(e) => { sp.set("id", e.id); setSp(sp) }} pageSize={15} empty="Không có sự kiện consent nào khớp với điều kiện tra cứu. (MSG-36-01)" />
      </Section>
      {sel && <EvidenceSheet id={sel} onClose={() => { sp.delete("id"); setSp(sp) }} />}
      {exp && <ExportDialog events={data} scope={`Bộ lọc hiện tại: ${fc === "all" ? "mọi consent" : fc}, ${from} → ${to}${q ? ", tìm " + q : ""}`} onClose={() => setExp(false)} />}
    </>
  )
}

export function EvidenceSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const apps = useStore((s) => s.applications)
  const e = useStore((s) => s.events.find((x) => x.id === id))
  const events = useStore((s) => s.events)
  const notices = useStore((s) => s.notices)
  const role = useStore((s) => s.role)
  const nav = useNavigate()
  const [fix, setFix] = React.useState(false)
  useViewLog("Xem chi tiết evidence", e?.id)
  if (!e) return null
  const limited = role === "Nhân viên"
  const notice = notices.find((n) => n.consent === e.consent && n.v === e.version)
  const related = events.filter((x) => x.correctionOf === e.id || x.id === e.correctionOf || (e.offline && x.offline?.id.startsWith(e.offline.id)) && x.id !== e.id)
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full data-[side=right]:sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2"><Mono>{e.id}</Mono><StatusBadge s={e.decision} /><SourcePill e={e} /></SheetTitle>
          <SheetDescription>Chỉ đọc · không có chức năng sửa hoặc xóa (BR-UC36-02). Lượt xem này đã được ghi nhật ký kiểm toán.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          {e.correctionOf && <Note tone="warn">Sự kiện hiệu chỉnh cho <Mono>{e.correctionOf}</Mono>. Lý do: {e.correctionReason}</Note>}
          {e.legacyRisk && <Note tone="warn" icon={<ShieldAlert />}>Bản ghi Legacy thiếu bằng chứng gốc, gắn cờ rủi ro; giá trị pháp lý cần pháp chế xác nhận trước khi dùng cho tiếp thị [KC] (BR-UC09-07).</Note>}
          <Tabs defaultValue="ev">
            <TabsList><TabsTrigger value="ev">Evidence</TabsTrigger><TabsTrigger value="rc">Receipt</TabsTrigger><TabsTrigger value="nt">Nội dung đã hiển thị</TabsTrigger><TabsTrigger value="rel">Liên quan ({related.length})</TabsTrigger></TabsList>
            <TabsContent value="ev" className="mt-3">
              <KV rows={[
                ["Chủ thể", <Link to={`/records/${e.subject}`} className="font-mono text-primary hover:underline">{e.subject}</Link>],
                ["consent_code", <Mono>{e.consent}</Mono>], ["Phiên bản", <Mono>{e.version}</Mono>], ["Quyết định", `${decisionVi(e.decision)} (${e.decision})`],
                ["Thời điểm máy chủ", <span><Mono>{fmtDT(e.ts, true)}</Mono> <span className="text-xs text-muted-foreground">UTC+7 · lưu UTC {e.ts}</span></span>],
                ["Kênh", e.channel], ["Ứng dụng", apps.find((a) => a.id === e.app)?.name || e.app], ["Property", e.property],
                ["Nguồn", e.source + (e.linkedFrom ? ` · từ cookie ${e.linkedFrom}` : "") + (e.legacyBatch ? ` · lô ${e.legacyBatch}` : "")],
                ["content_hash", <span className="flex items-center gap-1"><Mono>{shortHash(e.hash)}</Mono><Button size="icon-xs" variant="ghost" aria-label="Sao chép hash" onClick={() => copy(e.hash)}><Copy /></Button></span>],
                ["transaction_id", <Mono>{e.tx}</Mono>],
                ["IP", limited ? <Mono>{maskIp(e.ip)}</Mono> : <Mono>{e.ip}</Mono>], ["User agent", limited ? "•••• (che với Nhân viên)" : e.ua],
                ...(e.sensitive ? [["Dữ liệu nhạy cảm", e.explicitConfirm ? "Có · đã tích xác nhận tường minh (BR-UC14-04)" : "Có"] as [string, string]] : []),
              ]} />
              {e.offline && (
                <Card className="mt-4 gap-2 py-4"><CardHeader><CardTitle className="text-sm">Ghi nhận ngoại tuyến <Mono>{e.offline.id}</Mono></CardTitle></CardHeader>
                  <CardContent><KV rows={[["Hình thức", e.offline.kind], ["Ngày đồng ý thực tế", e.offline.actualDate], ["Người nhập", e.offline.enteredBy], ["Tệp bằng chứng", <div className="flex flex-col gap-1">{e.offline.files.map((f) => <span key={f.name} className="text-xs">{f.name} · {f.size} · SHA-256 <Mono>{shortHash(f.hash)}</Mono></span>)}</div>]]} /></CardContent></Card>
              )}
              {e.offline && !e.correctionOf && <Button size="sm" variant="outline" className="mt-3" onClick={() => setFix(true)}>Hiệu chỉnh bằng sự kiện mới</Button>}
            </TabsContent>
            <TabsContent value="rc" className="mt-3 flex flex-col gap-3">
              {e.receipt ? (<>
                <Note>CMP chỉ lưu siêu dữ liệu Receipt, không lưu token (BR-UC28-04). Receipt ký JWS bằng khóa trong KMS/HSM rồi mã hóa JWE bằng khóa công khai của T3; FE chỉ chuyển tiếp (BR-UC12-08).</Note>
                <JsonBlock data={{ header: { alg: e.receipt.alg, kid: e.receipt.kid, enc: e.receipt.enc }, claims: { iss: "https://cmp.abc-retail.vn", aud: e.receipt.aud, sub: e.subject, jti: e.receipt.jti, iat: e.ts, exp: e.receipt.exp, consent: e.consent, version: e.version, decision: e.receipt.decision, transaction_id: e.tx } }} />
                <div className="text-xs text-muted-foreground">BE T3 xác minh chữ ký qua JWKS, aud, sub, exp, jti chưa dùng; sai thì trả 403 CONSENT_INVALID (BRL-15, BRL-20).</div>
              </>) : <Empty>Không phát Receipt cho sự kiện này ({e.subject.startsWith("ck_") ? "banner ẩn danh" : e.source === "Ngoại tuyến" ? "ghi nhận ngoại tuyến" : e.source === "Legacy" ? "consent kế thừa" : e.decision === "WITHDRAWN" ? "rút lại" : "sự kiện hệ thống hoặc liên kết"}).</Empty>}
            </TabsContent>
            <TabsContent value="nt" className="mt-3">
              {notice ? <div className="rounded-lg border bg-white p-3 text-[#16202E]"><div className="mb-1 text-xs text-black/50">Nội dung phiên bản {notice.v} mà chủ thể đã thấy · content_hash khớp {notice.hash === e.hash ? "✓" : "—"}</div><NoticeBlock n={notice} lang="vi" open /></div> : <Empty>Không có phiên bản thông báo tương ứng ({e.version}).</Empty>}
            </TabsContent>
            <TabsContent value="rel" className="mt-3 flex flex-col gap-1.5">
              {related.map((r) => <button key={r.id} onClick={() => nav(`/evidence?id=${r.id}`)} className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/50"><span><Mono>{r.id}</Mono> · {r.consent} · {fmtDT(r.ts)}</span><StatusBadge s={r.decision} /></button>)}
              {!related.length && <Empty>Không có sự kiện hiệu chỉnh liên quan.</Empty>}
            </TabsContent>
          </Tabs>
        </div>
        {fix && <CorrectionDialog e={e} onClose={() => setFix(false)} />}
      </SheetContent>
    </Sheet>
  )
}

export function CorrectionDialog({ e, onClose }: { e: ConsentEvent; onClose: () => void }) {
  const consents = useStore((s) => s.consents)
  const correct = useStore((s) => s.correctEvent)
  const [reason, setReason] = React.useState("")
  const [c, setC] = React.useState(e.consent)
  const [d, setD] = React.useState<string>(e.decision)
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Hiệu chỉnh {e.offline?.id || e.id}</DialogTitle><DialogDescription>Không sửa, không xóa ghi nhận gốc; tạo evidence hiệu chỉnh trỏ về bản gốc. DPO nhận thông báo (BR-UC17-06, 17-07).</DialogDescription></DialogHeader>
        <FormField label="consent_code đúng"><NativeSelect label="consent" value={c} onChange={setC} options={consents.filter((x) => x.status === "Hoạt động").map((x) => x.code)} className="w-full" /></FormField>
        <FormField label="Quyết định"><NativeSelect label="Quyết định" value={d} onChange={setD} options={[["ACCEPTED", "Đồng ý"], ["REJECTED", "Từ chối"]]} className="w-full" /></FormField>
        <FormField id="cr" label="Lý do hiệu chỉnh" req><Input id="cr" value={reason} onChange={(x) => setReason(x.target.value)} placeholder="Ví dụ: nhập nhầm consent khi ghi nhận tại quầy" /></FormField>
        <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button disabled={reason.trim().length < 10} onClick={() => { correct(e.id, reason, c, d as ConsentEvent["decision"]); msg("Đã tạo evidence hiệu chỉnh; bản gốc giữ nguyên."); onClose() }}>Tạo evidence hiệu chỉnh</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ExportDialog({ events, scope, subject, onClose }: { events: ConsentEvent[]; scope: string; subject?: string; onClose: () => void }) {
  const exportPkg = useStore((s) => s.exportPackage)
  const nav = useNavigate()
  const [reason, setReason] = React.useState("")
  const [pdf, setPdf] = React.useState(true)
  const [json, setJson] = React.useState(true)
  const LIMIT = 500 // minh họa cho [N] (MSG-37-02)
  const over = events.length > LIMIT
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Xuất gói bằng chứng</DialogTitle><DialogDescription>Gói gồm evidence, lịch sử trạng thái, phiên bản và nội dung đã hiển thị, nguồn, danh sách tệp và hash (BR-UC37-02). Ký số, dấu thời gian ở V1.5.</DialogDescription></DialogHeader>
        <KV rows={[["Phạm vi", scope], ["Số evidence", fmtN(events.length)], ["Chủ thể", subject || `${new Set(events.map((e) => e.subject)).size} chủ thể`]]} />
        {over && <Note tone="err">Phạm vi có hơn {LIMIT} sự kiện (giá trị minh họa cho [N]). Vui lòng thu hẹp khoảng thời gian hoặc chọn ít consent hơn. (MSG-37-02)</Note>}
        <FormField label="Lý do xuất" req hint="Bắt buộc chọn từ danh mục (BR-UC37-04)"><NativeSelect label="Lý do" value={reason} onChange={setReason} options={[["", "— Chọn lý do —"], ...REASONS]} className="w-full" /></FormField>
        <div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><Checkbox checked={pdf} onCheckedChange={(v) => setPdf(!!v)} />PDF in được</label><label className="flex items-center gap-2"><Checkbox checked={json} onCheckedChange={(v) => setJson(!!v)} />JSON máy đọc</label></div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button disabled={!reason || over || !events.length || (!pdf && !json)} onClick={() => { const p = exportPkg({ reason, scope, subject, events: events.map((e) => e.id) }); msg(`Đã tạo gói bằng chứng ${p.id}. Liên kết tải có hiệu lực đến [thời điểm]. (MSG-37-01)`); nav(`/evidence/package/${p.id}`) }}>Xuất gói</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** SCR-37-02 Mẫu gói bằng chứng */
export function PackagePage() {
  const { id } = useParams()
  const pkg = useStore((s) => s.packages.find((p) => p.id === id))
  const events = useStore((s) => s.events)
  const notices = useStore((s) => s.notices)
  if (!pkg) return <Section><Empty>Không tìm thấy gói {id}. Gói chỉ tồn tại trong phiên mô phỏng hiện tại. <Link className="underline" to="/evidence">Về Bằng chứng</Link></Empty></Section>
  const evs = pkg.events.map((x) => events.find((e) => e.id === x)).filter(Boolean) as ConsentEvent[]
  const vers = [...new Set(evs.map((e) => e.consent + "|" + e.version))].map((k) => notices.find((n) => n.id === k)).filter(Boolean)
  const files = evs.flatMap((e) => e.offline?.files || [])
  const json = { package_id: pkg.id, created_at: pkg.at, created_by: pkg.by, reason: pkg.reason, scope: pkg.scope, events: evs.map((e) => ({ id: e.id, subject: e.subject, consent: e.consent, version: e.version, decision: e.decision, server_ts: e.ts, channel: e.channel, source: e.source, content_hash: e.hash, transaction_id: e.tx, receipt_jti: e.receipt?.jti, legacy_risk: !!e.legacyRisk })), sha256: { pdf: pkg.pdfHash, json: pkg.jsonHash } }
  return (
    <>
      <PageHeader title={`Gói bằng chứng ${pkg.id}`} crumbs={[["Vận hành"], ["Bằng chứng", "/evidence"]]} desc="Bản xem trước trang 1 của PDF và JSON máy đọc (SCR-37-02). Mọi lần xuất đã ghi nhật ký: người xuất, phạm vi, lý do, mã gói, SHA-256 (BR-UC37-05)."
        actions={<><Button variant="outline" render={<Link to="/evidence" />} nativeButton={false}><ArrowLeft /> Bằng chứng</Button><Button variant="outline" onClick={() => copy(JSON.stringify(json, null, 2))}><Copy /> Sao chép JSON</Button></>} />
      <Section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="mx-auto w-full max-w-[820px] rounded-sm border bg-white p-8 text-[#16202E] shadow-sm">
          <div className="flex items-start justify-between border-b border-black/15 pb-3">
            <div><div className="text-xs font-semibold uppercase tracking-wide text-black/50">Gói bằng chứng sự đồng ý</div><div className="text-xl font-bold">Công ty Cổ phần ABC Retail</div><div className="text-xs text-black/60">Theo Luật 91/2025/QH15, NĐ 356/2025/NĐ-CP [KC] · Bản in được</div></div>
            <div className="text-right font-mono text-xs"><div className="font-bold">{pkg.id}</div><div>{fmtDT(pkg.at, true)}</div></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div><b>Người xuất:</b> {pkg.by} (DPO)</div><div><b>Lý do:</b> {pkg.reason}</div>
            <div className="col-span-2"><b>Phạm vi:</b> {pkg.scope}</div>
            <div><b>Số sự kiện:</b> {evs.length}</div><div><b>Chủ thể:</b> {pkg.subject || `${new Set(evs.map((e) => e.subject)).size} chủ thể (mã giả danh)`}</div>
          </div>
          <div className="mt-4 text-sm font-bold">1. Chuỗi sự kiện consent</div>
          <table className="mt-1 w-full border-collapse text-[11px]">
            <thead><tr className="bg-black/[0.05] text-left">{["Thời điểm", "Chủ thể", "Consent · phiên bản", "Quyết định", "Phương thức", "Nguồn"].map((h) => <th key={h} className="border border-black/10 p-1">{h}</th>)}</tr></thead>
            <tbody>{evs.slice(0, 40).map((e) => <tr key={e.id}><td className="border border-black/10 p-1 font-mono">{fmtDT(e.ts, true)}</td><td className="border border-black/10 p-1 font-mono">{e.subject}</td><td className="border border-black/10 p-1 font-mono">{e.consent} · {e.version}</td><td className="border border-black/10 p-1">{decisionVi(e.decision)}</td><td className="border border-black/10 p-1">{e.channel}{e.receipt ? " · Receipt" : ""}</td><td className={cn("border border-black/10 p-1", e.legacyRisk && "font-semibold text-[#A1201A]")}>{e.source}{e.legacyRisk ? " · RỦI RO" : ""}</td></tr>)}</tbody>
          </table>
          {evs.length > 40 && <div className="mt-1 text-[11px] text-black/50">… và {evs.length - 40} sự kiện ở các trang sau</div>}
          <div className="mt-4 text-sm font-bold">2. Nội dung thông báo đã hiển thị</div>
          <div className="mt-1 flex flex-col gap-1 text-[11px]">{vers.map((n) => n && <div key={n.id}><b className="font-mono">{n.consent} {n.v}</b> · content_hash <span className="font-mono">{shortHash(n.hash)}</span> · {n.content.vi.purpose.slice(0, 160)}…</div>)}{evs.some((e) => e.version === "Legacy") && <div><b>Legacy</b> · không có phiên bản thông báo trong CMP</div>}</div>
          <div className="mt-4 text-sm font-bold">3. Tệp bằng chứng</div>
          <div className="mt-1 text-[11px]">{files.length ? files.map((f) => <div key={f.name}>{f.name} · {f.size} · SHA-256 <span className="font-mono">{f.hash}</span></div>) : "Không có tệp đính kèm."}</div>
          <div className="mt-5 border-t border-black/15 pt-2 font-mono text-[10px] text-black/50">SHA-256 PDF {pkg.pdfHash}<br />SHA-256 JSON {pkg.jsonHash}<br />Hash minh họa · ký số và dấu thời gian thuộc V1.5 (BR-UC37-07)</div>
        </div>
        <Card className="gap-3 self-start"><CardHeader><CardTitle className="text-sm">JSON máy đọc</CardTitle><CardDescription>Cùng mã gói, cùng nội dung</CardDescription></CardHeader><CardContent><JsonBlock data={json} /></CardContent></Card>
      </Section>
    </>
  )
}

/** SCR-36-01 Lịch sử consent của một chủ thể */
export function SubjectHistoryPage() {
  const { subject = "" } = useParams()
  const events = useStore((s) => s.events)
  const can = useCan()
  const [sel, setSel] = React.useState<string | null>(null)
  const [exp, setExp] = React.useState(false)
  useViewLog("Tra cứu lịch sử chủ thể", subject)
  const evs = events.filter((e) => e.subject === subject).sort((a, b) => (a.ts < b.ts ? 1 : -1))
  const states = currentStates(evs)
  const cookies = [...new Set(evs.map((e) => e.linkedFrom).filter(Boolean))]
  return (
    <>
      <PageHeader title={`Lịch sử consent · ${subject}`} crumbs={[["Vận hành"], ["Bản ghi consent", "/records"]]} desc="Toàn bộ chuỗi sự kiện của chủ thể theo thứ tự thời gian máy chủ (BR-UC36-01). Họ tên, số điện thoại, email chỉ tra được ở hệ thống gốc."
        actions={can("evidence", "edit") && evs.length ? <Button onClick={() => setExp(true)}><FileDown /> Xuất gói bằng chứng</Button> : undefined} />
      {!evs.length ? <Section><Empty>Không có sự kiện consent nào khớp với điều kiện tra cứu. (MSG-36-01)</Empty></Section> : (
        <Section className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <Card className="gap-2 py-4">
              <CardHeader><CardTitle className="text-sm">Định danh</CardTitle></CardHeader>
              <CardContent><KV rows={[["Mã khách hàng", <Mono>{subject}</Mono>], ["Định danh liên kết", cookies.length ? <div className="flex flex-col gap-0.5">{cookies.map((c) => <span key={c} className="flex items-center gap-1 font-mono text-xs"><Link2 className="size-3" />{c}</span>)}</div> : "—"], ["Số sự kiện", evs.length], ["Sự kiện đầu", fmtDT(evs[evs.length - 1].ts)]]} /></CardContent>
            </Card>
            <Card className="gap-2 py-4">
              <CardHeader><CardTitle className="text-sm">Trạng thái hiện hành</CardTitle></CardHeader>
              <CardContent className="flex flex-col divide-y">{states.map((s) => <div key={s.consent} className="flex items-center justify-between py-1.5 text-sm"><span><Mono>{s.consent}</Mono> <span className="text-xs text-muted-foreground">{s.last.version}</span></span><StatusBadge s={s.decision} /></div>)}</CardContent>
            </Card>
          </div>
          <Card className="gap-2 py-4">
            <CardHeader><CardTitle className="text-sm">Dòng thời gian</CardTitle><CardDescription>Bấm một sự kiện để xem evidence đầy đủ</CardDescription></CardHeader>
            <CardContent>
              <ol className="relative ml-2 border-l">
                {evs.map((e) => (
                  <li key={e.id} className="mb-3 ml-4">
                    <span className={cn("absolute -left-[5px] mt-1.5 size-2.5 rounded-full border-2 border-background", e.decision === "ACCEPTED" ? "bg-success" : e.decision === "WITHDRAWN" ? "bg-destructive" : e.decision === "REJECTED" ? "bg-warning" : "bg-muted-foreground")} />
                    <button onClick={() => setSel(e.id)} className="w-full rounded-md px-2 py-1.5 text-left hover:bg-muted/50">
                      <div className="flex flex-wrap items-center gap-2 text-sm"><Mono className="text-xs text-muted-foreground">{fmtDT(e.ts, true)}</Mono><b>{decisionVi(e.decision)}</b><Mono>{e.consent}</Mono><span className="text-xs text-muted-foreground">{e.version} · {e.channel}</span><SourcePill e={e} />{e.receipt && <Pill tone="ok">Receipt</Pill>}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{e.id}{e.correctionOf ? ` · hiệu chỉnh ${e.correctionOf}` : ""}{e.linkedFrom ? ` · liên kết từ ${e.linkedFrom}` : ""}</div>
                    </button>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </Section>
      )}
      {sel && <EvidenceSheet id={sel} onClose={() => setSel(null)} />}
      {exp && <ExportDialog events={evs} subject={subject} scope={`Toàn bộ sự kiện của ${subject}`} onClose={() => setExp(false)} />}
    </>
  )
}

