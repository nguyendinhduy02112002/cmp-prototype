/** SC-03 Mục đích & danh mục dữ liệu – UC-01 · SCR-01-01, 01-02, 01-03 */
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Target, ShieldAlert, Clock, CheckCircle2, Upload, GitCompare } from "lucide-react"
import { PageHeader, Section, Kpi, StatusBadge, Pill, NativeSelect, Note, Mono, KV, Empty, FormField } from "@/components/cmp/kit"
import { DataTable, type Col } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useCan, useStore, currentStates } from "@/lib/store"
import { DATA_CATALOG, itemByCode, snapPurpose } from "@/lib/mock"
import { LEGAL_BASES, type Purpose, type LegalBasis } from "@/lib/types"
import { fmtDT, fmtN } from "@/lib/fmt"
import { msg, useUi } from "@/components/cmp/approval"
import { cn } from "@/lib/utils"
import { BusinessContextHelp, RelationshipNote, WorkflowNextSteps } from "@/components/cmp/business-context-help"

const CUR = DATA_CATALOG[0]
export const groupOf = (items: string[]) => {
  const g = new Set(items.map((i) => itemByCode(i)?.group))
  return g.has("Cơ bản") && g.has("Nhạy cảm") ? "Cơ bản + Nhạy cảm" : g.has("Nhạy cảm") ? "Nhạy cảm" : g.has("Cơ bản") ? "Cơ bản" : "—"
}
export const isSensitive = (items: string[]) => items.some((i) => itemByCode(i)?.group === "Nhạy cảm")

/** Phiên bản Published đang tham chiếu mục đích (BR-UC01-06) */
function usePublishedRef() {
  const consents = useStore((s) => s.consents)
  const notices = useStore((s) => s.notices)
  return React.useCallback((code: string) => {
    const cs = consents.filter((c) => c.purposes.includes(code)).map((c) => c.code)
    return notices.find((n) => n.status === "Published" && cs.includes(n.consent))
  }, [consents, notices])
}

export default function PurposesPage() {
  const purposes = useStore((s) => s.purposes)
  const consents = useStore((s) => s.consents)
  const can = useCan()
  const [tab, setTab] = React.useState("p")
  const [q, setQ] = React.useState("")
  const [fs, setFs] = React.useState("all")
  const [fg, setFg] = React.useState("all")
  const [form, setForm] = React.useState<{ p: Purpose; isNew: boolean } | null>(null)
  const [sel, setSel] = React.useState<string | null>(null)
  const data = purposes.filter((p) => (fs === "all" || p.status === fs) && (fg === "all" || groupOf(p.items).includes(fg)) && (!q || (p.code + p.name).toLowerCase().includes(q.toLowerCase())))
  const used = (code: string) => consents.filter((c) => c.purposes.includes(code))
  const cols: Col<Purpose>[] = [
    { accessorKey: "code", header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />, cell: ({ row }) => <Mono className="font-semibold">{row.original.code}</Mono> },
    { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} title="Tên mục đích" />, cell: ({ row }) => <div className="max-w-72"><div className="font-medium">{row.original.name}</div>{row.original.returnNote && row.original.status !== "Hoạt động" && <div className="text-xs text-destructive">Lý do trả lại: {row.original.returnNote}</div>}{row.original.revision && <div className="text-xs text-info">Có bản sửa đổi {row.original.status === "Chờ duyệt" ? "đang chờ duyệt" : "chưa gửi"}</div>}</div> },
    { id: "group", header: "Nhóm dữ liệu", cell: ({ row }) => { const g = groupOf(row.original.items); return <div className="flex flex-wrap gap-1"><span className="text-sm">{g}</span>{g.includes("Nhạy cảm") && <Pill tone="err">Nhạy cảm</Pill>}{row.original.child && <Pill tone="warn">Trẻ em</Pill>}</div> } },
    { accessorKey: "legalBasis", header: "Cơ sở pháp lý", cell: ({ row }) => <span className="text-sm">{row.original.legalBasis}</span> },
    { id: "used", header: "Consent dùng", cell: ({ row }) => <span className="tabular-nums">{used(row.original.code).length}</span> },
    { accessorKey: "status", header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />, cell: ({ row }) => <StatusBadge s={row.original.status} /> },
    { accessorKey: "updatedAt", header: ({ column }) => <DataTableColumnHeader column={column} title="Cập nhật" />, cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs">{fmtDT(row.original.updatedAt)}</span> },
  ]
  const cnt = (s: string) => purposes.filter((p) => p.status === s).length
  const nextCode = () => { let i = purposes.length + 1; while (purposes.some((p) => p.code === `PUR-${String(i).padStart(3, "0")}`)) i++; return `PUR-${String(i).padStart(3, "0")}` }
  const blank = (): Purpose => ({ code: nextCode(), name: "", desc: "", items: [], scope: "", legalBasis: "Đồng ý của chủ thể dữ liệu", retention: "", share: false, recipients: [], child: false, status: "Nháp", everActive: false, history: [], versions: [], updatedAt: "" })
  return (
    <>
      <PageHeader title="Mục đích & danh mục dữ liệu" crumbs={[["Cấu hình"]]} desc="Danh mục mục đích xử lý dữ liệu cá nhân và nhóm dữ liệu theo Luật 91/2025/QH15, NĐ 356/2025/NĐ-CP [KC]. Mọi thay đổi cần người có quyền Phê duyệt (mặc định DPO) duyệt trước khi có hiệu lực."
        actions={tab === "p" && can("setup", "edit") ? <Button onClick={() => setForm({ p: blank(), isNew: true })}><Plus /> Tạo mục đích</Button> : undefined} />
      <Section className="flex flex-wrap items-center gap-2">
        <BusinessContextHelp title="Mục đích xử lý và danh mục dữ liệu" context={{ purpose: "Định nghĩa doanh nghiệp xử lý dữ liệu để làm gì, dùng loại dữ liệu nào và dựa trên cơ sở nào.", when: "Trước khi tạo một loại Consent hoặc khi mục đích/data catalog thay đổi.", actors: "Nhân viên hoặc Admin tạo; người có quyền phê duyệt (mặc định DPO) duyệt.", inputs: "Mã, mô tả, loại dữ liệu, phạm vi, cơ sở pháp lý, retention và bên nhận.", outputs: "Purpose Hoạt động để Consent có thể tham chiếu.", related: ["Purpose", "Consent", "Notice"], example: "Mục đích Gửi ưu đãi qua email sử dụng email và lịch sử mua hàng.", srs: "UC-01 · SCR-01-01..03" }} />
        <RelationshipNote><b>Purpose khác Consent:</b> Purpose trả lời “xử lý dữ liệu để làm gì”; Consent định nghĩa “lựa chọn đồng ý nào cần hỏi khách hàng” và liên kết tới một hoặc nhiều Purpose.</RelationshipNote>
      </Section>
      <Section>
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <TabsList><TabsTrigger value="p">Mục đích ({purposes.length})</TabsTrigger><TabsTrigger value="d">Danh mục dữ liệu</TabsTrigger></TabsList>
          <TabsContent value="p" className="mt-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi label="Hoạt động" value={cnt("Hoạt động")} icon={<CheckCircle2 />} sub="Dùng được ở consent, phiên bản" />
              <Kpi label="Chờ duyệt" value={cnt("Chờ duyệt") + cnt("Chờ duyệt ngừng")} icon={<Clock />} sub="Gồm đề nghị ngừng" />
              <Kpi label="Nháp, bị trả lại" value={cnt("Nháp") + cnt("Bị trả lại")} icon={<Target />} />
              <Kpi label="Có dữ liệu nhạy cảm" value={purposes.filter((p) => isSensitive(p.items)).length} icon={<ShieldAlert />} sub="Bắt buộc popup riêng UC-14" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative"><Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input className="h-8 w-64 pl-8" placeholder="Tìm theo mã, tên" value={q} onChange={(e) => setQ(e.target.value)} /></div>
              <NativeSelect label="Trạng thái" value={fs} onChange={setFs} options={[["all", "Mọi trạng thái"], "Nháp", "Chờ duyệt", "Bị trả lại", "Hoạt động", "Chờ duyệt ngừng", "Ngừng sử dụng"]} />
              <NativeSelect label="Nhóm" value={fg} onChange={setFg} options={[["all", "Mọi nhóm dữ liệu"], ["Cơ bản", "Có dữ liệu cơ bản"], ["Nhạy cảm", "Có dữ liệu nhạy cảm"]]} />
              {(q || fs !== "all" || fg !== "all") && <Button variant="ghost" size="sm" onClick={() => { setQ(""); setFs("all"); setFg("all") }}>Xóa lọc</Button>}
            </div>
            <DataTable columns={cols} data={data} onRowClick={(p) => setSel(p.code)} />
          </TabsContent>
          <TabsContent value="d" className="mt-4"><CatalogTab /></TabsContent>
        </Tabs>
      </Section>
      {purposes.some((p) => p.status === "Hoạt động") && <Section><WorkflowNextSteps links={[{ label: "Tiếp theo: Cấu hình Consent", to: "/consents", mod: "setup", description: "Dùng Purpose đã được phê duyệt để tạo loại đồng ý" }]} /></Section>}
      {form && <PurposeForm init={form.p} isNew={form.isNew} onClose={() => setForm(null)} />}
      {sel && <PurposeSheet code={sel} onClose={() => setSel(null)} onEdit={(p) => { setSel(null); setForm({ p, isNew: false }) }} />}
    </>
  )
}

function PurposeSheet({ code, onClose, onEdit }: { code: string; onClose: () => void; onEdit: (p: Purpose) => void }) {
  const p = useStore((s) => s.purposes.find((x) => x.code === code))
  const consents = useStore((s) => s.consents)
  const events = useStore((s) => s.events)
  const submit = useStore((s) => s.submitConfig)
  const del = useStore((s) => s.deleteConfig)
  const can = useCan()
  const pubRef = usePublishedRef()
  const openCmp = useUi((s) => s.openCmp)
  const openAp = useUi((s) => s.openAp)
  const nav = useNavigate()
  const [stop, setStop] = React.useState(false)
  const [delAsk, setDelAsk] = React.useState(false)
  if (!p) return null
  const used = consents.filter((c) => c.purposes.includes(p.code))
  const ref = pubRef(p.code)
  const ed = can("setup", "edit")
  const view = p.revision ? ({ ...p, ...p.revision } as Purpose) : p
  const tryDelete = () => {
    if (p.everActive || used.length) return msg(`Không xóa được ${p.code} vì đang được ${used.length} consent sử dụng: ${used.map((c) => c.code).join(", ") || "—"}. Bạn có thể đề nghị ngừng sử dụng.`, "error")
    setDelAsk(true)
  }
  const accepted = new Set(currentStates(events).filter((c) => used.some((u) => u.code === c.consent) && c.decision === "ACCEPTED").map((c) => c.subject)).size
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full data-[side=right]:sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2"><Mono>{p.code}</Mono> <StatusBadge s={p.status} /></SheetTitle>
          <SheetDescription>{p.name}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          {p.returnNote && <Note tone="err">Lý do trả lại: {p.returnNote}</Note>}
          {ref && p.status === "Hoạt động" && <Note>Mục đích đang được phiên bản thông báo {ref.consent} {ref.v} sử dụng nên không sửa trực tiếp được. Hãy tạo phiên bản thông báo mới. (MSG-01-06)</Note>}
          {p.status === "Chờ duyệt" || p.status === "Chờ duyệt ngừng" ? <Note tone="lock">Đối tượng đang chờ duyệt nên bị khóa chỉnh sửa (BR-AP-04). Người gửi có thể rút lại khi DPO chưa xử lý.</Note> : null}
          <div className="flex flex-wrap gap-2">
            {ed && ["Nháp", "Bị trả lại"].includes(p.status) && <Button size="sm" onClick={() => onEdit(p)}>Sửa</Button>}
            {ed && p.status === "Hoạt động" && !ref && <Button size="sm" onClick={() => onEdit(view)}>Sửa (tạo bản sửa đổi)</Button>}
            {ed && p.status === "Hoạt động" && ref && <Button size="sm" variant="outline" onClick={() => nav("/notices")}>Tạo phiên bản thông báo mới</Button>}
            {ed && p.status === "Hoạt động" && p.revision && <Button size="sm" onClick={() => { submit("purpose", p.code); msg(`Đã gửi duyệt mục đích ${p.code}. DPO sẽ nhận được thông báo.`) }}>Gửi duyệt bản sửa đổi</Button>}
            {ed && p.status === "Hoạt động" && <Button size="sm" variant="outline" onClick={() => setStop(true)}>Đề nghị ngừng sử dụng</Button>}
            {ed && ["Nháp", "Bị trả lại"].includes(p.status) && <Button size="sm" variant="destructive" onClick={tryDelete}>Xóa</Button>}
            {ed && p.status === "Hoạt động" && <Button size="sm" variant="ghost" className="text-destructive" onClick={tryDelete}>Xóa</Button>}
            {(p.status === "Chờ duyệt" || p.status === "Chờ duyệt ngừng") && <Button size="sm" variant="outline" onClick={() => openAp("purpose:" + p.code)}>Mở đề nghị duyệt</Button>}
            {p.versions.length > 0 && <Button size="sm" variant="outline" onClick={() => openCmp({ title: p.code, list: [...(p.revision ? [{ label: "Bản sửa đổi (đề nghị)", snap: snapPurpose(view) }] : []), ...p.versions.map((v) => ({ label: `Phiên bản ${v.v} · ${fmtDT(v.at)}`, snap: v.snap }))] })}><GitCompare /> So sánh phiên bản</Button>}
          </div>
          <Card className="py-4"><CardContent>
            <KV rows={[
              ["Mô tả cho chủ thể", view.desc || "—"],
              ["Loại dữ liệu", <div className="flex flex-wrap gap-1">{view.items.map((i) => <Pill key={i} tone={itemByCode(i)?.group === "Nhạy cảm" ? "err" : "mute"}>{itemByCode(i)?.name || i}</Pill>)}</div>],
              ["Nhóm (tự xác định)", groupOf(view.items)],
              ["Phạm vi xử lý", view.scope || "—"],
              ["Cơ sở pháp lý", view.legalBasis],
              ["Thời hạn xử lý", view.retention || "—"],
              ["Chia sẻ, bên nhận", view.share ? view.recipients.join("; ") : "Không chia sẻ"],
              ["Cờ Trẻ em", view.child ? "Có – luồng người giám hộ ở V1.5" : "Không"],
              ["Consent đang dùng", used.map((c) => c.code).join(", ") || "—"],
              ["Chủ thể ACCEPTED", fmtN(accepted)],
            ]} />
          </CardContent></Card>
          <div>
            <div className="mb-2 text-sm font-medium">Lịch sử</div>
            <div className="flex flex-col gap-2">{p.history.map((h, i) => <div key={i} className="flex gap-3 text-sm"><span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">{fmtDT(h.at)}</span><span><b>{h.act}</b> · {h.who}{h.note && <span className="text-muted-foreground"> – {h.note}</span>}</span></div>)}{!p.history.length && <span className="text-sm text-muted-foreground">Chưa có.</span>}</div>
          </div>
        </div>
        {stop && <StopDialog code={p.code} consents={used.map((c) => c.code)} accepted={accepted} onClose={() => setStop(false)} />}
        {delAsk && (
          <Dialog open onOpenChange={(o) => !o && setDelAsk(false)}>
            <DialogContent><DialogHeader><DialogTitle>Xóa bản nháp {p.code}?</DialogTitle><DialogDescription>Thao tác này không thể hoàn tác. (MSG-01-07)</DialogDescription></DialogHeader>
              <DialogFooter><Button variant="outline" onClick={() => setDelAsk(false)}>Hủy</Button><Button variant="destructive" onClick={() => { del("purpose", p.code); msg(`Đã xóa bản nháp ${p.code}.`); onClose() }}>Xóa</Button></DialogFooter></DialogContent>
          </Dialog>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function StopDialog({ code, consents, accepted, onClose, kind = "purpose" }: { code: string; consents: string[]; accepted: number; onClose: () => void; kind?: "purpose" | "consent" }) {
  const req = useStore((s) => s.requestStop)
  const [reason, setReason] = React.useState("")
  const [ack, setAck] = React.useState(false)
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Đề nghị ngừng sử dụng {code}</DialogTitle><DialogDescription>Ngừng sử dụng không xóa và không thay đổi bằng chứng consent đã có (BR-UC01-07).</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Kpi label={kind === "purpose" ? "Consent tham chiếu" : "Ứng dụng đang gọi"} value={consents.length} sub={consents.join(", ") || "—"} />
          <Kpi label="Chủ thể ACCEPTED" value={fmtN(accepted)} sub="Giữ nguyên trạng thái" />
        </div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="stopr">Lý do <span className="text-destructive">*</span></Label><Textarea id="stopr" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tối thiểu 10 ký tự" /></div>
        <label className="flex items-start gap-2 text-sm"><Checkbox checked={ack} onCheckedChange={(v) => setAck(!!v)} className="mt-0.5" /> Tôi hiểu việc dừng xử lý với chủ thể thực hiện qua phiên bản thông báo mới hoặc ngừng consent.</label>
        <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button disabled={reason.trim().length < 10 || !ack} onClick={() => { req(kind, code, reason); msg(`Đã gửi đề nghị ngừng sử dụng ${code} tới DPO.`); onClose() }}>Gửi đề nghị</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PurposeForm({ init, isNew, onClose }: { init: Purpose; isNew: boolean; onClose: () => void }) {
  const purposes = useStore((s) => s.purposes)
  const save = useStore((s) => s.saveConfig)
  const submit = useStore((s) => s.submitConfig)
  const [p, setP] = React.useState<Purpose>(() => ({ ...init, items: [...init.items], recipients: [...init.recipients] }))
  const [err, setErr] = React.useState<Record<string, string>>({})
  const [rec, setRec] = React.useState("")
  const set = <K extends keyof Purpose>(k: K, v: Purpose[K]) => setP((x) => ({ ...x, [k]: v }))
  const sens = isSensitive(p.items)
  const codeLocked = init.everActive
  const checkBasic = () => {
    const e: Record<string, string> = {}
    if (!/^[A-Z0-9-]{3,20}$/.test(p.code)) e.code = "Mã chỉ gồm chữ in hoa, số và dấu gạch ngang, dài 3–20 ký tự. (MSG-01-03)"
    else if (isNew && purposes.some((x) => x.code === p.code)) e.code = `Mã mục đích ${p.code} đã tồn tại trong tổ chức. Vui lòng chọn mã khác. (MSG-01-02)`
    if (!p.name.trim()) e.name = "Vui lòng nhập Tên mục đích. (MSG-C-01)"
    return e
  }
  const checkFull = () => {
    const e = checkBasic()
    if (!p.desc.trim()) e.desc = "Vui lòng nhập Mô tả cho chủ thể. (MSG-C-01)"
    if (!p.items.length) e.items = "Vui lòng chọn ít nhất một loại dữ liệu (BR-UC01-02)."
    if (!p.scope.trim()) e.scope = "Vui lòng nhập Phạm vi xử lý. (MSG-C-01)"
    if (!p.retention.trim()) e.retention = "Vui lòng nhập Thời hạn xử lý. (MSG-C-01)"
    if (p.share && !p.recipients.length) e.recipients = "Vui lòng thêm ít nhất một bên nhận hoặc chọn \"Không chia sẻ\". (MSG-01-05)"
    return e
  }
  const doSave = (andSubmit: boolean) => {
    const e = andSubmit ? checkFull() : checkBasic()
    setErr(e)
    if (Object.keys(e).length) return msg(Object.values(e)[0], "error")
    save("purpose", p, isNew)
    if (andSubmit) { submit("purpose", p.code); msg(`Đã gửi duyệt mục đích ${p.code}. DPO sẽ nhận được thông báo. (MSG-C-02)`) }
    else msg(init.everActive ? `Đã lưu bản sửa đổi ${p.code}; bản Hoạt động giữ hiệu lực tới khi bản sửa đổi được duyệt (BR-AP-05).` : `Đã lưu bản nháp mục đích ${p.code}. (MSG-01-01)`)
    onClose()
  }
  const toggle = (c: string) => set("items", p.items.includes(c) ? p.items.filter((x) => x !== c) : [...p.items, c])
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Tạo mục đích" : init.everActive ? `Bản sửa đổi ${init.code}` : `Sửa ${init.code}`}</DialogTitle>
          <DialogDescription>"Lưu nháp" chỉ cần Mã và Tên; "Gửi duyệt" cần đủ mọi trường bắt buộc (BR-UC01-03).</DialogDescription>
        </DialogHeader>
        {init.returnNote && <Note tone="err">Lý do trả lại lần trước: {init.returnNote}</Note>}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-3.5">
            <FormField id="code" error={err.code} label="Mã" req hint={codeLocked ? "Mã khóa vĩnh viễn sau lần phê duyệt đầu (BR-UC01-01)" : "Chữ in hoa, số, dấu gạch ngang · 3–20 ký tự"}>
              <Input id="code" value={p.code} disabled={codeLocked} onChange={(e) => set("code", e.target.value.toUpperCase())} className="font-mono" aria-invalid={!!err.code} />
            </FormField>
            <FormField id="name" error={err.name} label="Tên mục đích" req><Input id="name" value={p.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!err.name} /></FormField>
            <FormField id="desc" error={err.desc} label="Mô tả cho chủ thể dữ liệu" req><Textarea id="desc" rows={3} value={p.desc} onChange={(e) => set("desc", e.target.value)} aria-invalid={!!err.desc} /></FormField>
            <FormField id="scope" error={err.scope} label="Phạm vi xử lý" req><Input id="scope" value={p.scope} onChange={(e) => set("scope", e.target.value)} aria-invalid={!!err.scope} /></FormField>
            <FormField id="legal" error={err.legal} label="Cơ sở pháp lý" req hint="Theo Điều 19 Luật 91/2025/QH15 [KC]. Cơ sở khác 'Đồng ý' chỉ thông báo, không xin đồng ý (BR-UC01-11).">
              <NativeSelect id="legal" label="Cơ sở pháp lý" value={p.legalBasis} onChange={(v) => set("legalBasis", v as LegalBasis)} options={[...LEGAL_BASES]} className="w-full" />
            </FormField>
            <FormField id="retention" error={err.retention} label="Thời hạn xử lý" req><Input id="retention" value={p.retention} onChange={(e) => set("retention", e.target.value)} placeholder="Ví dụ: 24 tháng kể từ khi đồng ý" aria-invalid={!!err.retention} /></FormField>
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <label className="flex items-center justify-between gap-2 text-sm font-medium">Chia sẻ cho bên nhận<Switch checked={p.share} onCheckedChange={(v) => set("share", !!v)} /></label>
              {p.share && (
                <>
                  <div className="flex gap-2"><Input value={rec} onChange={(e) => setRec(e.target.value)} placeholder="Tên bên nhận" /><Button variant="outline" onClick={() => { if (rec.trim()) { set("recipients", [...p.recipients, rec.trim()]); setRec("") } }}>Thêm</Button></div>
                  <div className="flex flex-wrap gap-1">{p.recipients.map((r) => <Pill key={r}>{r} <button aria-label={"Bỏ " + r} onClick={() => set("recipients", p.recipients.filter((x) => x !== r))}>×</button></Pill>)}</div>
                </>
              )}
              {err.recipients && <span className="text-xs text-destructive">{err.recipients}</span>}
            </div>
            <label className="flex items-start gap-2 text-sm"><Checkbox checked={p.child} onCheckedChange={(v) => set("child", !!v)} className="mt-0.5" /><span>Có xử lý dữ liệu trẻ em <span className="block text-xs text-muted-foreground">MVP chỉ ghi nhận cờ và cảnh báo DPO; luồng người giám hộ ở V1.5 (BR-UC01-10)</span></span></label>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <Label className="shrink-0">Loại dữ liệu <span className="text-destructive">*</span></Label>
              <span className="text-right text-xs text-muted-foreground">Danh mục {CUR.v} · {CUR.basis}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between rounded-md bg-background px-2 py-1.5 text-xs"><span>Nhóm (tự xác định)</span><b>{groupOf(p.items)}</b></div>
              <label className={cn("flex items-center justify-between rounded-md bg-background px-2 py-1.5 text-xs", sens && "text-destructive")}><span>Cờ Nhạy cảm</span><Switch checked={sens} disabled aria-label="Cờ nhạy cảm tự động" /></label>
            </div>
            {sens && <Note tone="warn">Có dữ liệu nhạy cảm: cờ Nhạy cảm tự bật, không tắt được; mục đích bắt buộc đi kèm luồng xin đồng ý riêng UC-14 (BR-UC01-05).</Note>}
            {(["Cơ bản", "Nhạy cảm"] as const).map((g) => (
              <div key={g} className="flex flex-col gap-1.5">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dữ liệu {g.toLowerCase()}</div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {CUR.items.filter((i) => i.group === g).map((i) => (
                    <label key={i.code} className={cn("flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm hover:bg-muted/50", p.items.includes(i.code) && (g === "Nhạy cảm" ? "border-destructive/40 bg-destructive/5" : "border-primary/40 bg-primary/5"))}>
                      <Checkbox checked={p.items.includes(i.code)} onCheckedChange={() => toggle(i.code)} />{i.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {err.items && <span className="text-xs text-destructive">{err.items}</span>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="secondary" onClick={() => doSave(false)}>Lưu nháp</Button>
          <Button onClick={() => doSave(true)}>Gửi duyệt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CatalogTab() {
  const [v, setV] = React.useState(0)
  const can = useCan()
  const purposes = useStore((s) => s.purposes)
  const [imp, setImp] = React.useState(false)
  const cat = DATA_CATALOG[v]
  const usedBy = (code: string) => purposes.filter((p) => p.items.includes(code) && p.status !== "Ngừng sử dụng").map((p) => p.code)
  const openCmp = useUi((s) => s.openCmp)
  return (
    <div className="flex flex-col gap-4">
      <Note>Danh mục gồm đúng 2 nhóm cố định theo Luật 91/2025/QH15 và NĐ 356/2025/NĐ-CP [KC]. Người dùng không tạo, sửa, xóa từng loại dữ liệu trên giao diện; danh mục chỉ cập nhật bằng import tệp khi văn bản pháp luật thay đổi, mỗi lần tạo một phiên bản có căn cứ (BR-UC01-12).</Note>
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect label="Phiên bản danh mục" value={String(v)} onChange={(x) => setV(+x)} options={DATA_CATALOG.map((c, i) => [String(i), `${c.v} · ${i === 0 ? "Hiện hành" : "Cũ"} · ${fmtDT(c.at).slice(0, 10)}`] as [string, string])} />
        <span className="text-sm text-muted-foreground">Căn cứ: {cat.basis} · duyệt bởi {cat.by}</span>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openCmp({ title: "Danh mục dữ liệu", list: DATA_CATALOG.map((c) => ({ label: c.v, snap: Object.fromEntries(c.items.map((i) => [i.name, i.group])) })) })}><GitCompare /> So sánh phiên bản</Button>
          {can("setup", "edit") && <Button size="sm" onClick={() => setImp(true)}><Upload /> Import phiên bản mới</Button>}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(["Cơ bản", "Nhạy cảm"] as const).map((g) => (
          <Card key={g} className="gap-3">
            <CardHeader><CardTitle className="flex items-center gap-2">Dữ liệu cá nhân {g.toLowerCase()} {g === "Nhạy cảm" && <Pill tone="err">Nhạy cảm</Pill>}</CardTitle><CardDescription>{cat.items.filter((i) => i.group === g).length} loại</CardDescription></CardHeader>
            <CardContent className="flex flex-col divide-y">
              {cat.items.filter((i) => i.group === g).map((i) => (
                <div key={i.code} className="flex items-center justify-between gap-2 py-2 text-sm"><span>{i.name} <Mono className="text-muted-foreground">{i.code}</Mono></span><span className="text-xs text-muted-foreground">{usedBy(i.code).length ? `Dùng bởi ${usedBy(i.code).join(", ")}` : "Chưa dùng"}</span></div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      {imp && (
        <Dialog open onOpenChange={(o) => !o && setImp(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Import phiên bản danh mục dữ liệu</DialogTitle><DialogDescription>Tệp CSV/XLSX gồm mã, tên, nhóm; kèm văn bản căn cứ. Phiên bản mới cần DPO duyệt.</DialogDescription></DialogHeader>
            <Empty>Kéo thả tệp vào đây (mô phỏng) · danh-muc-du-lieu-ND356-sua-doi.xlsx</Empty>
            <Note tone="warn">1 loại dữ liệu không có trong tệp nhưng đang được mục đích sử dụng nên được giữ lại: Số điện thoại. (MSG-01-08, BR-UC01-13)</Note>
            <DialogFooter><Button variant="outline" onClick={() => setImp(false)}>Hủy</Button><Button onClick={() => { msg("Đã tạo danh mục v3 ở trạng thái Chờ duyệt (mô phỏng).", "info"); setImp(false) }}>Kiểm tra và gửi duyệt</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
