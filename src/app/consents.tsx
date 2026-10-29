/** SC-04 Consent – UC-02 · SCR-02-01, 02-02 */
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, GitCompare } from "lucide-react"
import { PageHeader, Section, StatusBadge, Pill, NativeSelect, Note, Mono, KV, FormField } from "@/components/cmp/kit"
import { DataTable, type Col } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useCan, useStore, currentStates } from "@/lib/store"
import { CHANNELS, itemByCode, snapConsent } from "@/lib/mock"
import type { Consent } from "@/lib/types"
import { fmtDT, fmtN } from "@/lib/fmt"
import { msg, useUi } from "@/components/cmp/approval"
import { BusinessContextHelp, RelationshipNote, WorkflowNextSteps } from "@/components/cmp/business-context-help"
import { StopDialog, isSensitive } from "./purposes"
import { cn } from "@/lib/utils"

export default function ConsentsPage() {
  const consents = useStore((s) => s.consents)
  const notices = useStore((s) => s.notices)
  const can = useCan()
  const [q, setQ] = React.useState("")
  const [fs, setFs] = React.useState("all")
  const [fk, setFk] = React.useState("all")
  const [form, setForm] = React.useState<{ c: Consent; isNew: boolean } | null>(null)
  const [sel, setSel] = React.useState<string | null>(null)
  const purposes = useStore((s) => s.purposes)
  const sensOf = (c: Consent) => c.purposes.some((p) => isSensitive(purposes.find((x) => x.code === p)?.items || []))
  const data = consents.filter((c) => (fs === "all" || c.status === fs) && (fk === "all" || c.kind === fk) && (!q || (c.code + c.name).toLowerCase().includes(q.toLowerCase())))
  const cols: Col<Consent>[] = [
    { accessorKey: "code", header: ({ column }) => <DataTableColumnHeader column={column} title="consent_code" />, cell: ({ row }) => <Mono className="font-semibold">{row.original.code}</Mono> },
    { accessorKey: "name", header: "Tên", cell: ({ row }) => <div><div className="font-medium">{row.original.name}</div>{sensOf(row.original) && <Pill tone="err" className="mt-1">Cần popup riêng (UC-14)</Pill>}{row.original.returnNote && row.original.status === "Bị trả lại" && <div className="text-xs text-destructive">Lý do trả lại: {row.original.returnNote}</div>}</div> },
    { id: "purposes", header: "Mục đích", cell: ({ row }) => <div className="flex flex-wrap gap-1">{row.original.purposes.map((p) => <Pill key={p}>{p}</Pill>)}{!row.original.purposes.length && "—"}</div> },
    { accessorKey: "kind", header: "Loại", cell: ({ row }) => <Pill tone={row.original.kind === "Bắt buộc" ? "dark" : "info"}>{row.original.kind}</Pill> },
    { id: "ch", header: "Kênh", cell: ({ row }) => <span className="text-sm">{row.original.channels.join(", ")}</span> },
    { id: "dur", header: "Thời hạn", cell: ({ row }) => <span className="text-sm whitespace-nowrap">{row.original.duration ? `${row.original.duration} tháng` : "Mặc định [N]"}</span> },
    { id: "pub", header: "Phiên bản Published", cell: ({ row }) => { const n = notices.find((x) => x.consent === row.original.code && x.status === "Published"); return n ? <Mono>{n.v}</Mono> : <span className="text-muted-foreground">—</span> } },
    { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <StatusBadge s={row.original.status} /> },
  ]
  const blank = (): Consent => ({ code: "CS-", name: "", purposes: [], kind: "Tùy chọn", channels: ["Web"], apps: [], duration: null, status: "Nháp", everActive: false, history: [], versions: [], updatedAt: "" })
  return (
    <>
      <PageHeader title="Consent" crumbs={[["Cấu hình"]]} desc="consent_code là khóa nghiệp vụ mà hệ thống T3 dùng khi gọi CMP.require. Mỗi consent gồm một hoặc nhiều mục đích đang Hoạt động; loại dữ liệu, phạm vi và bên nhận kế thừa từ mục đích (BR-UC02-02)."
        actions={can("setup", "edit") ? <Button onClick={() => setForm({ c: blank(), isNew: true })}><Plus /> Tạo consent</Button> : undefined} />
      <Section className="flex flex-wrap items-center gap-2">
        <BusinessContextHelp title="Loại đồng ý cần thu thập" context={{ purpose: "Định nghĩa lựa chọn mà khách hàng sẽ Accept hoặc Reject trước một hoạt động xử lý dữ liệu.", when: "Sau khi Purpose đã Hoạt động và trước khi soạn Notice/Banner.", actors: "Nhân viên hoặc Admin cấu hình; DPO duyệt.", inputs: "Purpose, loại bắt buộc/tùy chọn, kênh, ứng dụng và thời hạn.", outputs: "Consent Hoạt động có consent_code để application gọi CMP.require.", related: ["Purpose", "Consent", "Notice", "Banner"], example: "CS-MKT-EMAIL cho phép khách hàng chọn có nhận ưu đãi qua email hay không.", srs: "UC-02 · SCR-02-01/02" }} />
        <RelationshipNote><b>Consent dùng Purpose làm nền:</b> dữ liệu, phạm vi và bên nhận được kế thừa từ Purpose; Consent bổ sung lựa chọn, kênh, ứng dụng và thời hạn cần thu thập.</RelationshipNote>
      </Section>
      <Section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative"><Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input className="h-8 w-64 pl-8" placeholder="Tìm theo consent_code, tên" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <NativeSelect label="Trạng thái" value={fs} onChange={setFs} options={[["all", "Mọi trạng thái"], "Nháp", "Chờ duyệt", "Bị trả lại", "Hoạt động", "Chờ duyệt ngừng", "Ngừng sử dụng"]} />
          <NativeSelect label="Loại" value={fk} onChange={setFk} options={[["all", "Bắt buộc và Tùy chọn"], "Bắt buộc", "Tùy chọn"]} />
        </div>
        <DataTable columns={cols} data={data} onRowClick={(c) => setSel(c.code)} />
      </Section>
      {consents.some((c) => c.status === "Hoạt động") && <Section><WorkflowNextSteps links={[{ label: "Tiếp theo: Tạo nội dung thông báo", to: "/notices", mod: "setup", description: "Soạn nội dung khách hàng sẽ đọc khi được hỏi consent" }]} /></Section>}
      {form && <ConsentForm init={form.c} isNew={form.isNew} onClose={() => setForm(null)} />}
      {sel && <ConsentSheet code={sel} onClose={() => setSel(null)} onEdit={(c) => { setSel(null); setForm({ c, isNew: false }) }} />}
    </>
  )
}

function ConsentSheet({ code, onClose, onEdit }: { code: string; onClose: () => void; onEdit: (c: Consent) => void }) {
  const apps = useStore((s) => s.applications)
  const c = useStore((s) => s.consents.find((x) => x.code === code))
  const notices = useStore((s) => s.notices)
  const events = useStore((s) => s.events)
  const purposes = useStore((s) => s.purposes)
  const submit = useStore((s) => s.submitConfig)
  const del = useStore((s) => s.deleteConfig)
  const createNotice = useStore((s) => s.createNotice)
  const can = useCan()
  const openCmp = useUi((s) => s.openCmp)
  const openAp = useUi((s) => s.openAp)
  const nav = useNavigate()
  const [stop, setStop] = React.useState(false)
  if (!c) return null
  const ed = can("setup", "edit")
  const view = c.revision ? ({ ...c, ...c.revision } as Consent) : c
  const nRec = events.filter((e) => e.consent === c.code).length
  const accepted = currentStates(events).filter((x) => x.consent === c.code && x.decision === "ACCEPTED").length
  const vers = notices.filter((n) => n.consent === c.code)
  const ps = view.purposes.map((p) => purposes.find((x) => x.code === p)).filter(Boolean) as typeof purposes
  const items = [...new Set(ps.flatMap((p) => p.items))]
  const tryDelete = () => {
    if (c.everActive || nRec) return msg(`Không xóa được ${c.code} vì đã có ${fmtN(nRec)} bản ghi đồng ý. Bạn có thể đề nghị ngừng sử dụng. (MSG-02-06)`, "error")
    del("consent", c.code); msg(`Đã xóa bản nháp ${c.code}.`); onClose()
  }
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full data-[side=right]:sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><Mono>{c.code}</Mono><StatusBadge s={c.status} /></SheetTitle><SheetDescription>{c.name}</SheetDescription></SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          {c.returnNote && <Note tone="err">Lý do trả lại: {c.returnNote}</Note>}
          {(c.status === "Chờ duyệt" || c.status === "Chờ duyệt ngừng") && <Note tone="lock">Đang chờ duyệt, khóa chỉnh sửa (BR-AP-04).</Note>}
          <div className="flex flex-wrap gap-2">
            {ed && ["Nháp", "Bị trả lại"].includes(c.status) && <Button size="sm" onClick={() => onEdit(c)}>Sửa</Button>}
            {ed && c.status === "Hoạt động" && <Button size="sm" onClick={() => onEdit(view)}>Sửa (tạo bản sửa đổi)</Button>}
            {ed && c.status === "Hoạt động" && c.revision && <Button size="sm" onClick={() => { submit("consent", c.code); msg(`Đã gửi duyệt consent ${c.code}. DPO sẽ nhận được thông báo.`) }}>Gửi duyệt bản sửa đổi</Button>}
            {ed && c.status === "Hoạt động" && <Button size="sm" variant="outline" onClick={() => { const open = vers.find((v) => ["Nháp", "Chờ duyệt", "Bị trả lại", "Đã duyệt – chờ hiệu lực"].includes(v.status)); if (open) return msg(`Consent này đang có phiên bản ${open.v} ở trạng thái ${open.status}. Vui lòng hoàn tất phiên bản đó trước. (MSG-03-02)`, "info"); createNotice(c.code); nav("/notices") }}>Tạo phiên bản thông báo mới</Button>}
            {ed && c.status === "Hoạt động" && <Button size="sm" variant="outline" onClick={() => setStop(true)}>Đề nghị ngừng</Button>}
            {ed && c.status !== "Chờ duyệt" && c.status !== "Ngừng sử dụng" && <Button size="sm" variant="ghost" className="text-destructive" onClick={tryDelete}>Xóa</Button>}
            {(c.status === "Chờ duyệt" || c.status === "Chờ duyệt ngừng") && <Button size="sm" variant="outline" onClick={() => openAp("consent:" + c.code)}>Mở đề nghị duyệt</Button>}
            {c.versions.length > 0 && <Button size="sm" variant="outline" onClick={() => openCmp({ title: c.code, list: [...(c.revision ? [{ label: "Bản sửa đổi (đề nghị)", snap: snapConsent(view) }] : []), ...c.versions.map((v) => ({ label: `Phiên bản ${v.v} · ${fmtDT(v.at)}`, snap: v.snap }))] })}><GitCompare /> So sánh</Button>}
          </div>
          <Card className="py-4"><CardContent><KV rows={[
            ["Mục đích", view.purposes.join(", ") || "—"],
            ["Loại", view.kind],
            ["Kênh", view.channels.join(", ")],
            ["Ứng dụng được gọi", view.apps.map((a) => apps.find((x) => x.id === a)?.name).join("; ") || "—"],
            ["Thời hạn đồng ý", view.duration ? `${view.duration} tháng kể từ khi đồng ý` : "Mặc định theo quy tắc UC-04 ([N] tháng)"],
            ["Loại dữ liệu (kế thừa)", items.map((i) => itemByCode(i)?.name).join(", ") || "—"],
            ["Bên nhận (kế thừa)", [...new Set(ps.flatMap((p) => p.recipients))].join("; ") || "Không chia sẻ"],
            ["Bản ghi đồng ý", fmtN(nRec)], ["Chủ thể ACCEPTED", fmtN(accepted)],
          ]} /></CardContent></Card>
          <div><div className="mb-2 text-sm font-medium">Phiên bản thông báo</div>
            <div className="flex flex-col gap-1.5">{vers.map((v) => <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"><span><Mono className="font-semibold">{v.v}</Mono> · {v.sum}</span><StatusBadge s={v.status} /></div>)}{!vers.length && <span className="text-sm text-muted-foreground">Chưa có phiên bản.</span>}</div>
          </div>
          <div><div className="mb-2 text-sm font-medium">Lịch sử</div>{c.history.map((h, i) => <div key={i} className="flex gap-3 text-sm"><span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">{fmtDT(h.at)}</span><span><b>{h.act}</b> · {h.who}{h.note && ` – ${h.note}`}</span></div>)}</div>
        </div>
        {stop && <StopDialog kind="consent" code={c.code} consents={c.apps.map((a) => apps.find((x) => x.id === a)?.name || a)} accepted={accepted} onClose={() => setStop(false)} />}
      </SheetContent>
    </Sheet>
  )
}

function ConsentForm({ init, isNew, onClose }: { init: Consent; isNew: boolean; onClose: () => void }) {
  const apps = useStore((s) => s.applications)
  const consents = useStore((s) => s.consents)
  const purposes = useStore((s) => s.purposes)
  const save = useStore((s) => s.saveConfig)
  const submit = useStore((s) => s.submitConfig)
  const [c, setC] = React.useState<Consent>(() => ({ ...init, purposes: [...init.purposes], channels: [...init.channels], apps: [...init.apps] }))
  const [err, setErr] = React.useState<Record<string, string>>({})
  const set = <K extends keyof Consent>(k: K, v: Consent[K]) => setC((x) => ({ ...x, [k]: v }))
  const active = purposes.filter((p) => p.status === "Hoạt động" || c.purposes.includes(p.code))
  const consentBased = c.purposes.filter((p) => purposes.find((x) => x.code === p)?.legalBasis === "Đồng ý của chủ thể dữ liệu")
  const mandatoryBlocked = consentBased.length > 0
  const sens = c.purposes.some((p) => isSensitive(purposes.find((x) => x.code === p)?.items || []))
  const tog = (k: "purposes" | "channels" | "apps", v: string) => {
    const next = c[k].includes(v) ? c[k].filter((x) => x !== v) : [...c[k], v]
    if (k === "purposes" && next.some((p) => purposes.find((x) => x.code === p)?.legalBasis === "Đồng ý của chủ thể dữ liệu")) setC((x) => ({ ...x, purposes: next, kind: "Tùy chọn" }))
    else set(k, next)
  }
  const check = (full: boolean) => {
    const e: Record<string, string> = {}
    if (!/^[A-Z0-9-]{3,40}$/.test(c.code)) e.code = "consent_code chỉ gồm chữ in hoa, số và dấu gạch ngang, dài 3–40 ký tự. (MSG-02-02)"
    else if (isNew && consents.some((x) => x.code === c.code)) e.code = `consent_code ${c.code} đã tồn tại trong tổ chức. (MSG-02-01)`
    if (!c.name.trim()) e.name = "Vui lòng nhập Tên. (MSG-C-01)"
    if (full) {
      if (!c.purposes.length) e.purposes = "Chọn ít nhất một mục đích Hoạt động (BR-UC02-02)."
      if (c.purposes.some((p) => purposes.find((x) => x.code === p)?.status !== "Hoạt động")) e.purposes = "Chỉ mục đích Hoạt động mới được chọn (BR-UC01-04)."
      if (!c.channels.length) e.channels = "Chọn ít nhất một kênh."
      if (!c.apps.length) e.apps = "Gán ít nhất một ứng dụng (BR-UC02-04)."
      if (c.kind === "Bắt buộc" && mandatoryBlocked) e.kind = `Mục đích ${consentBased[0]} dựa trên sự đồng ý nên consent phải là Tùy chọn. (MSG-02-05)`
    }
    return e
  }
  const go = (full: boolean) => {
    const e = check(full); setErr(e)
    if (Object.keys(e).length) return msg(Object.values(e)[0], "error")
    save("consent", c, isNew)
    if (full) { submit("consent", c.code); msg(`Đã gửi duyệt consent ${c.code}. DPO sẽ nhận được thông báo. (MSG-C-02)`) } else msg(`Đã lưu bản nháp consent ${c.code}.`)
    onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isNew ? "Tạo consent" : `Sửa ${init.code}`}</DialogTitle><DialogDescription>Consent tùy chọn không được làm điều kiện cho chức năng chính (BR-UC02-03, BR-05).</DialogDescription></DialogHeader>
        {init.returnNote && <Note tone="err">Lý do trả lại lần trước: {init.returnNote}</Note>}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="ccode" label="consent_code" req error={err.code} hint={init.everActive ? "Không đổi sau lần duyệt đầu" : "Ví dụ CS-MKT-ZALO"}><Input id="ccode" className="font-mono" value={c.code} disabled={init.everActive} onChange={(e) => set("code", e.target.value.toUpperCase())} /></FormField>
          <FormField id="cname" label="Tên" req error={err.name}><Input id="cname" value={c.name} onChange={(e) => set("name", e.target.value)} /></FormField>
          <FormField label="Mục đích (chỉ mục đích Hoạt động)" req error={err.purposes} className="md:col-span-2">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {active.map((p) => (
                <label key={p.code} className={cn("flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-sm hover:bg-muted/50", c.purposes.includes(p.code) && "border-primary/40 bg-primary/5")}>
                  <Checkbox checked={c.purposes.includes(p.code)} onCheckedChange={() => tog("purposes", p.code)} className="mt-0.5" />
                  <span><Mono className="font-semibold">{p.code}</Mono> · {p.name}<span className="block text-xs text-muted-foreground">{p.legalBasis}{isSensitive(p.items) ? " · nhạy cảm" : ""}{p.status !== "Hoạt động" ? ` · ${p.status}` : ""}</span></span>
                </label>
              ))}
            </div>
          </FormField>
          {sens && <div className="md:col-span-2"><Note tone="warn">Consent chứa mục đích nhạy cảm: tự động yêu cầu luồng đồng ý riêng (UC-14, BR-UC02-06).</Note></div>}
          <FormField label="Loại" req error={err.kind} hint={mandatoryBlocked ? `“Bắt buộc” bị khóa vì ${consentBased.join(", ")} dựa trên sự đồng ý (BR-UC02-09).` : "Bắt buộc chỉ khi mọi mục đích có cơ sở pháp lý khác Đồng ý."}>
            <RadioGroup value={c.kind} onValueChange={(v) => set("kind", v as Consent["kind"])} className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Tùy chọn" />Tùy chọn</label>
              <label className={cn("flex items-center gap-2 text-sm", mandatoryBlocked && "opacity-50")}><RadioGroupItem value="Bắt buộc" disabled={mandatoryBlocked} />Bắt buộc</label>
            </RadioGroup>
          </FormField>
          <FormField id="dur" label="Thời hạn đồng ý (tháng)" hint="Để trống = mặc định theo quy tắc UC-04; thay đổi không hồi tố (BR-UC02-05)"><Input id="dur" type="number" min={1} max={120} value={c.duration ?? ""} onChange={(e) => set("duration", e.target.value ? +e.target.value : null)} /></FormField>
          <FormField label="Kênh" req error={err.channels}>
            <div className="flex flex-wrap gap-3">{CHANNELS.map((ch) => <label key={ch} className="flex items-center gap-2 text-sm"><Checkbox checked={c.channels.includes(ch)} onCheckedChange={() => tog("channels", ch)} />{ch}</label>)}</div>
          </FormField>
          <FormField label="Ứng dụng được gọi consent" req error={err.apps} hint="Ứng dụng chỉ gọi được consent đã gán (BR-UC02-04)">
            <div className="flex flex-col gap-1.5">{apps.map((a) => <label key={a.id} className="flex items-center gap-2 text-sm"><Checkbox checked={c.apps.includes(a.id)} onCheckedChange={() => tog("apps", a.id)} />{a.name}</label>)}</div>
          </FormField>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button variant="secondary" onClick={() => go(false)}>Lưu nháp</Button><Button onClick={() => go(true)}>Gửi duyệt</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
