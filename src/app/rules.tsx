/** SC-13 Quy tắc tái đồng ý (UC-04) và Ma trận phụ thuộc mục đích (UC-05) */
import * as React from "react"
import { History, Lock, Plus, Send, GitCompareArrows } from "lucide-react"
import { PageHeader, Section, NativeSelect, Note, Mono, Pill, FormField, StatusBadge } from "@/components/cmp/kit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCan, useStore } from "@/lib/store"
import type { DependencyMatrix, ReconsentRuleRow, ReconsentRuleVersion } from "@/lib/types"
import { fmtDT } from "@/lib/fmt"
import { msg, useUi } from "@/components/cmp/approval"
import { cn } from "@/lib/utils"
import { BusinessContextHelp, RelationshipNote } from "@/components/cmp/business-context-help"

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value))
const statusTone = (status: string) => status === "Hoạt động" ? "ok" : status === "Chờ duyệt" ? "warn" : status === "Bị trả lại" ? "err" : "mute"

export default function RulesPage() {
  const can = useCan()
  const [tab, setTab] = React.useState("rule")
  return <>
    <PageHeader title="Quy tắc & ma trận" crumbs={[["Cấu hình"]]} desc="Quản lý quy tắc gợi ý khi nào cần xin lại consent và ma trận xác định chức năng nào phụ thuộc từng mục đích. Mọi phiên bản mới phải qua maker-checker trước khi có hiệu lực." />
    <Section className="flex flex-wrap items-center gap-2">
      <BusinessContextHelp title="Quy tắc xin lại và ma trận phụ thuộc" context={{ purpose: "Xác định khi nào cần xin lại consent và chức năng ứng dụng nào phụ thuộc vào từng Purpose.", when: "Khi thay đổi Notice hoặc khi ứng dụng cần biết một quyết định từ chối ảnh hưởng chức năng nào.", actors: "Nhân viên/Admin soạn và gửi; người có quyền Phê duyệt (mặc định DPO) duyệt hoặc trả lại.", inputs: "Loại thay đổi, thời hạn mặc định, application, function và purpose dependency.", outputs: "Bộ rule Hoạt động và matrix hiện hành đã được phê duyệt.", related: ["Notice", "Consent", "Application", "Simulator", "Notifications", "Audit"], example: "Khách hàng từ chối purpose bắt buộc của eKYC thì chỉ chức năng mở ví bị chặn.", srs: "SRS-FR-004/005 · UC-04/05 · BR-AP-01..09" }} />
      <RelationshipNote><b>Hai tab giải quyết hai câu hỏi:</b> “Thay đổi nào cần hỏi lại khách hàng?” và “Nếu khách hàng từ chối thì chức năng nào bị ảnh hưởng?”. Bản đang Hoạt động/Hiện hành tiếp tục có hiệu lực trong khi revision chờ duyệt.</RelationshipNote>
    </Section>
    <Section><Tabs value={tab} onValueChange={(v) => setTab(String(v))}><TabsList><TabsTrigger value="rule">Quy tắc tái đồng ý</TabsTrigger><TabsTrigger value="mx">Ma trận phụ thuộc</TabsTrigger></TabsList><TabsContent value="rule" className="mt-4"><RulesTab ed={can("setup", "edit")} /></TabsContent><TabsContent value="mx" className="mt-4"><MatrixTab ed={can("setup", "edit")} /></TabsContent></Tabs></Section>
  </>
}

function RulesTab({ ed }: { ed: boolean }) {
  const versions = useStore((s) => s.ruleSets)
  const createDraft = useStore((s) => s.createRuleDraft)
  const saveDraft = useStore((s) => s.saveRuleDraft)
  const submit = useStore((s) => s.submitRule)
  const openAp = useUi((s) => s.openAp)
  const active = versions.find((x) => x.status === "Hoạt động")!
  const proposal = versions.find((x) => ["Nháp", "Chờ duyệt", "Bị trả lại"].includes(x.status))
  const shown = proposal || active
  const editable = !!proposal && ed && ["Nháp", "Bị trả lại"].includes(proposal.status)
  const [rows, setRows] = React.useState<ReconsentRuleRow[]>(copy(shown.rows))
  const [dur, setDur] = React.useState(String(shown.defaultMonths))
  // Đồng bộ editor khi workflow đổi sang một version khác sau submit/return/approve.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setRows(copy(shown.rows)); setDur(String(shown.defaultMonths)) }, [shown])
  const save = () => { if (!proposal) return false; const r = saveDraft(proposal.version, rows, Number(dur)); msg(r.msg, r.ok ? "success" : "error"); return r.ok }
  const send = () => { if (!proposal || !save()) return; const r = submit(proposal.version); msg(r.msg, r.ok ? "success" : "error") }
  return <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
    <Card className="gap-2"><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>Bảng gợi ý nhãn · R{shown.version}</CardTitle><StatusBadge s={shown.status} /></div><CardDescription>Bộ đang áp dụng: R{active.version}, duyệt {fmtDT(active.approvedAt || active.at)} bởi {active.approvedBy}. {proposal && `Revision R${proposal.version} không thay thế R${active.version} trước khi được duyệt.`}</CardDescription></CardHeader><CardContent>
      {shown.returnNote && <Note tone="err">Lý do trả lại: {shown.returnNote}</Note>}
      <Table><TableHeader><TableRow><TableHead>Loại thay đổi</TableHead><TableHead className="w-56">Gợi ý</TableHead></TableRow></TableHeader><TableBody>{rows.map((row, i) => <TableRow key={row.change}><TableCell className="font-medium">{row.change}{row.locked && <Lock className="ml-1.5 inline size-3.5 text-muted-foreground" />}</TableCell><TableCell>{row.locked ? <Pill tone="warn">Trọng yếu (khóa)</Pill> : <NativeSelect label={row.change} disabled={!editable} value={row.material ? "Có" : "Không"} onChange={(value) => setRows(rows.map((r, j) => j === i ? { ...r, material: value === "Có" } : r))} options={[["Không", "Không trọng yếu"], ["Có", "Trọng yếu"]]} />}</TableCell></TableRow>)}</TableBody></Table>
      <div className="mt-2 text-xs text-muted-foreground">Các thay đổi tối thiểu và thêm dữ liệu nhạy cảm luôn là Trọng yếu, không thể hạ xuống (BR-UC04-01, BR-UC04-03).</div>
    </CardContent></Card>
    <div className="flex flex-col gap-4"><Card className="gap-3"><CardHeader><CardTitle>Thời hạn đồng ý mặc định</CardTitle><CardDescription>Áp dụng cho consent không khai báo thời hạn riêng (BR-UC04-05)</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">
      <FormField id="dur" label="Số tháng (1–120)"><Input id="dur" type="number" min={1} max={120} disabled={!editable} value={dur} onChange={(e) => setDur(e.target.value)} /></FormField>
      {!proposal && ed && <Button onClick={() => { const r = createDraft(); msg(r.msg, r.ok ? "success" : "error") }}><Plus /> Đề nghị sửa</Button>}
      {editable && <div className="flex gap-2"><Button variant="outline" onClick={save}>Lưu nháp</Button><Button onClick={send}><Send /> Gửi duyệt</Button></div>}
      {proposal?.status === "Chờ duyệt" && <Button onClick={() => openAp(`rule:${proposal.version}`)}>Mở đề nghị phê duyệt</Button>}
    </CardContent></Card><VersionHistory title="Lịch sử bộ quy tắc" versions={versions} /><Note>Consent ở RE_CONSENT được xử lý như chưa đồng ý; popup xin lại hiện ở lần gọi CMP.require kế tiếp (BR-UC04-06).</Note></div>
  </div>
}

function MatrixTab({ ed }: { ed: boolean }) {
  const applications = useStore((s) => s.applications)
  const matrices = useStore((s) => s.matrix)
  const consents = useStore((s) => s.consents)
  const createDraft = useStore((s) => s.createMatrixDraft)
  const saveDraft = useStore((s) => s.saveMatrixDraft)
  const submit = useStore((s) => s.submitMatrix)
  const openAp = useUi((s) => s.openAp)
  const openCmp = useUi((s) => s.openCmp)
  const apps = [...new Set(matrices.map((x) => x.app))]
  const [app, setApp] = React.useState(apps[0])
  const versions = matrices.filter((x) => x.app === app)
  const active = versions.find((x) => x.status === "Hoạt động")!
  const proposal = versions.find((x) => ["Nháp", "Chờ duyệt", "Bị trả lại"].includes(x.status))
  const shown = proposal || active
  const editable = !!proposal && ed && ["Nháp", "Bị trả lại"].includes(proposal.status)
  const [m, setM] = React.useState<DependencyMatrix>(() => copy(shown))
  // Đồng bộ editor khi đổi application hoặc version workflow.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setM(copy(shown)), [app, shown])
  const appConsents = consents.filter((c) => c.status === "Hoạt động" && c.apps.includes(app))
  const cols = [...new Map(appConsents.flatMap((c) => c.purposes.map((p) => [p, { p, kind: c.kind, cs: c.code }] as const))).values()]
  const optional = new Set(appConsents.filter((c) => c.kind === "Tùy chọn").flatMap((c) => c.purposes))
  const missing = appConsents.filter((c) => c.kind === "Bắt buộc" && !m.rows.some((r) => r.status !== "Ngừng" && c.purposes.some((p) => p in r.purposes)))
  const invalidOptional = m.rows.some((r) => Object.entries(r.purposes).some(([p, required]) => required && optional.has(p)))
  const cycle = (fn: string, p: string) => setM((current) => ({ ...current, rows: current.rows.map((r) => { if (r.fn !== fn) return r; const has = p in r.purposes; const req = r.purposes[p]; const np = { ...r.purposes }; if (!has) np[p] = false; else if (!req && !optional.has(p)) np[p] = true; else delete np[p]; return { ...r, purposes: np } }) }))
  const save = () => { const r = saveDraft(m); msg(r.msg, r.ok ? "success" : "error"); return r.ok }
  const send = () => { if (!proposal || !save()) return; const r = submit(app, proposal.version); msg(r.msg, r.ok ? "success" : "error") }
  const addFunction = () => { const used = new Set(m.rows.map((r) => r.fn)); let n = 1; while (used.has(`FN-${String(n).padStart(2, "0")}`)) n++; setM({ ...m, rows: [...m.rows, { fn: `FN-${String(n).padStart(2, "0")}`, name: "Chức năng mới", purposes: {}, status: "Hoạt động" }] }) }
  const snap = (v: DependencyMatrix) => ({ "Phiên bản": `v${v.version}`, "Trạng thái": v.status, "Hành vi từ chối": v.onReject, "Chức năng": v.rows.map((r) => `${r.fn} ${r.name} [${Object.entries(r.purposes).map(([p, req]) => `${p}:${req ? "Bắt buộc" : "Không bắt buộc"}`).join(", ")}]`).join(" | ") })
  return <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-2"><NativeSelect label="Ứng dụng" value={app} onChange={setApp} options={apps.map((id) => [id, applications.find((a) => a.id === id)?.name || id] as [string, string])} /><span className="text-sm text-muted-foreground">Hiện hành <Mono>v{active.version}</Mono> · duyệt {fmtDT(active.approvedAt || active.at)} bởi {active.approvedBy}</span><StatusBadge s={shown.status} /><NativeSelect label="Hành vi khi từ chối" disabled={!editable} value={m.onReject} onChange={(value) => setM({ ...m, onReject: value as DependencyMatrix["onReject"] })} options={["Chặn chức năng liên quan", "Chặn, cho phép luồng thay thế"]} className="ml-auto" /></div>
    {shown.returnNote && <Note tone="err">Lý do trả lại: {shown.returnNote}</Note>}{proposal && <Note>Đang soạn/xét duyệt v{proposal.version}; Simulator vẫn sử dụng v{active.version} cho tới khi v{proposal.version} được phê duyệt.</Note>}
    <div className="overflow-x-auto rounded-lg border bg-card"><Table><TableHeader><TableRow><TableHead>Chức năng</TableHead>{cols.map((c) => <TableHead key={c.p} className="text-center"><Mono>{c.p}</Mono><div className="text-[10px] font-normal text-muted-foreground">{c.cs} · {c.kind}</div></TableHead>)}{editable && <TableHead className="w-20" />}</TableRow></TableHeader><TableBody>{m.rows.map((r, ri) => <TableRow key={`${r.fn}-${ri}`} className={cn(r.status === "Ngừng" && "opacity-55")}><TableCell><div className="flex min-w-56 gap-2"><Input className="h-8 w-20 font-mono" disabled={!editable} value={r.fn} onChange={(e) => setM({ ...m, rows: m.rows.map((x, i) => i === ri ? { ...x, fn: e.target.value.toUpperCase() } : x) })} /><Input className="h-8" disabled={!editable} value={r.name} onChange={(e) => setM({ ...m, rows: m.rows.map((x, i) => i === ri ? { ...x, name: e.target.value } : x) })} /></div></TableCell>{cols.map((c) => { const has = c.p in r.purposes; const req = r.purposes[c.p]; return <TableCell key={c.p} className="text-center"><button disabled={!editable || r.status === "Ngừng"} onClick={() => cycle(r.fn, c.p)} className={cn("min-w-24 rounded-md border px-2 py-1 text-xs font-medium", !has && "text-muted-foreground", has && !req && "border-info/30 bg-info/10 text-info", req && "border-foreground/30 bg-foreground/10")}>{!has ? "Không liên quan" : req ? "Bắt buộc" : "Không bắt buộc"}</button></TableCell> })}{editable && <TableCell><Button size="xs" variant="ghost" onClick={() => setM({ ...m, rows: m.rows.map((x, i) => i === ri ? { ...x, status: x.status === "Ngừng" ? "Hoạt động" : "Ngừng" } : x) })}>{r.status === "Ngừng" ? "Mở lại" : "Ngừng"}</Button></TableCell>}</TableRow>)}</TableBody></Table></div>
    <div className="grid gap-2 md:grid-cols-2"><Note tone={missing.length ? "warn" : "info"}>{missing.length ? `✕ Consent bắt buộc chưa gắn chức năng: ${missing.map((x) => x.code).join(", ")}` : "✓ Mọi consent Bắt buộc đã gắn với ít nhất một chức năng."}</Note><Note tone={invalidOptional ? "warn" : "info"}>{invalidOptional ? "✕ Có purpose của consent Tùy chọn đang bị đánh Bắt buộc." : "✓ Không có purpose Tùy chọn bị đánh Bắt buộc."}</Note></div>
    <Note>Bấm ô để đổi: Không liên quan → Không bắt buộc → Bắt buộc. Purpose thuộc consent Tùy chọn không có lựa chọn Bắt buộc (BR-UC05-03). Không có lựa chọn chặn toàn bộ ứng dụng (BR-UC05-04).</Note>
    <div className="flex flex-wrap justify-between gap-2"><div className="flex gap-2"><Button variant="outline" onClick={() => openCmp({ title: `Ma trận ${applications.find((a) => a.id === app)?.name || app}`, list: versions.map((v) => ({ label: `v${v.version} · ${v.status}`, snap: snap(v) })) })}><GitCompareArrows /> So sánh phiên bản</Button>{editable && <Button variant="outline" onClick={addFunction}><Plus /> Thêm chức năng</Button>}</div><div className="flex gap-2">{!proposal && ed && <Button onClick={() => { const r = createDraft(app); msg(r.msg, r.ok ? "success" : "error") }}><Plus /> Tạo phiên bản mới</Button>}{editable && <><Button variant="outline" onClick={save}>Lưu nháp</Button><Button disabled={!!missing.length || invalidOptional} onClick={send}><Send /> Gửi duyệt</Button></>}{proposal?.status === "Chờ duyệt" && <Button onClick={() => openAp(`matrix:${app}:${proposal.version}`)}>Mở đề nghị phê duyệt</Button>}</div></div>
    <VersionHistory title="Lịch sử phiên bản ma trận" versions={versions} />
  </div>
}

function VersionHistory({ title, versions }: { title: string; versions: (ReconsentRuleVersion | DependencyMatrix)[] }) {
  return <Card className="gap-2"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><History className="size-4" /> {title}</CardTitle></CardHeader><CardContent className="flex flex-col gap-2">{versions.map((v) => <div key={v.version} className="rounded-md border px-3 py-2 text-xs"><div className="flex items-center justify-between"><b>v{v.version}</b><Pill tone={statusTone(v.status)}>{v.status}</Pill></div><div className="mt-1 text-muted-foreground">{v.approvedBy ? `Duyệt bởi ${v.approvedBy} · ${fmtDT(v.approvedAt || v.at)}` : `${v.by} · ${fmtDT(v.at)}`}</div>{v.history.slice(0, 3).map((h, i) => <div key={i} className="mt-1">{fmtDT(h.at)} · {h.who} · {h.act}{h.note ? ` — ${h.note}` : ""}</div>)}</div>)}</CardContent></Card>
}
