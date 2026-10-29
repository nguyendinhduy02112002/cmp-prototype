/** SC-12 Ghi nhận consent ngoại tuyến – UC-17 · SCR-17-01, 17-02 */
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Upload, FileAudio, FileText, Trash2 } from "lucide-react"
import { PageHeader, Section, StatusBadge, NativeSelect, Note, Mono, FormField, Pill } from "@/components/cmp/kit"
import { DataTable, type Col } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { currentActor, useCan, useStore } from "@/lib/store"
import type { ConsentEvent, OfflineInfo } from "@/lib/types"
import { fakeHash, fmtDT, uid, shortHash } from "@/lib/fmt"
import { msg } from "@/components/cmp/approval"
import { CorrectionDialog } from "./evidence"

const OK_EXT = ["pdf", "jpg", "jpeg", "png", "mp3", "m4a", "wav"]

export default function OfflinePage() {
  const events = useStore((s) => s.events)
  const can = useCan()
  const nav = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [fix, setFix] = React.useState<ConsentEvent | null>(null)
  const data = events.filter((e) => e.offline)
  const cols: Col<ConsentEvent>[] = [
    { id: "off", header: "Mã ghi nhận", cell: ({ row }) => <div><Mono className="font-semibold">{row.original.offline!.id}</Mono>{row.original.correctionOf && <div className="text-[11px] text-warning">Hiệu chỉnh</div>}</div> },
    { accessorKey: "subject", header: "Mã khách hàng", cell: ({ row }) => <Mono>{row.original.subject}</Mono> },
    { accessorKey: "consent", header: "consent_code", cell: ({ row }) => <Mono>{row.original.consent}</Mono> },
    { accessorKey: "decision", header: "Quyết định", cell: ({ row }) => <StatusBadge s={row.original.decision} /> },
    { id: "kind", header: "Hình thức", cell: ({ row }) => <Pill>{row.original.offline!.kind}</Pill> },
    { id: "ad", header: "Ngày đồng ý thực tế", cell: ({ row }) => <span className="font-mono text-xs">{row.original.offline!.actualDate}</span> },
    { accessorKey: "ts", header: "Thời điểm nhập", cell: ({ row }) => <span className="font-mono text-xs whitespace-nowrap">{fmtDT(row.original.ts)}</span> },
    { id: "by", header: "Người nhập", cell: ({ row }) => <span className="text-sm">{row.original.offline!.enteredBy}</span> },
    { id: "files", header: "Tệp", cell: ({ row }) => <span className="text-sm">{row.original.offline!.files.length}</span> },
    { id: "act", header: "", cell: ({ row }) => can("offline", "edit") && !row.original.correctionOf ? <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); setFix(row.original) }}>Hiệu chỉnh</Button> : null },
  ]
  return (
    <>
      <PageHeader title="Ghi nhận ngoại tuyến" crumbs={[["Vận hành"]]} desc="Nhập consent thu ngoài hệ thống (cú pháp SMS, ghi âm cuộc gọi, phiếu giấy có chữ ký) kèm tệp bằng chứng. Hai mốc thời gian lưu tách biệt: ngày đồng ý thực tế và thời điểm nhập (BR-UC17-02). Không cần DPO duyệt."
        actions={can("offline", "edit") ? <Button onClick={() => setOpen(true)}><Plus /> Ghi nhận mới</Button> : undefined} />
      <Section className="flex flex-col gap-3">
        <DataTable columns={cols} data={data} onRowClick={(e) => nav(`/evidence?id=${e.id}`)} />
        <Note>Không sửa, không xóa ghi nhận; sai sót xử lý bằng evidence hiệu chỉnh có lý do và DPO nhận thông báo (BR-UC17-06, 17-07). Ghi nhận chỉ đổi trạng thái hiện hành khi ngày thực tế mới hơn quyết định đang có (BR-UC17-05).</Note>
      </Section>
      {open && <OfflineForm onClose={() => setOpen(false)} />}
      {fix && <CorrectionDialog e={fix} onClose={() => setFix(null)} />}
    </>
  )
}

function OfflineForm({ onClose }: { onClose: () => void }) {
  const consents = useStore((s) => s.consents)
  const notices = useStore((s) => s.notices)
  const add = useStore((s) => s.addOffline)
  const actor = useStore(currentActor)
  const [subject, setSubject] = React.useState("KH0012308")
  const [consent, setConsent] = React.useState("CS-MKT-EMAIL")
  const [decision, setDecision] = React.useState<"ACCEPTED" | "REJECTED">("ACCEPTED")
  const [kind, setKind] = React.useState<OfflineInfo["kind"]>("Văn bản, chữ ký")
  const [date, setDate] = React.useState("2026-10-27")
  const [ver, setVer] = React.useState("")
  const [files, setFiles] = React.useState<OfflineInfo["files"]>([])
  const [note, setNote] = React.useState("")
  const [err, setErr] = React.useState<Record<string, string>>({})
  const today = new Date().toISOString().slice(0, 10)
  const vers = notices.filter((n) => n.consent === consent && (n.status === "Published" || n.status === "Expired"))
  const validAt = (v: string) => { const n = vers.find((x) => x.v === v); if (!n) return false; const start = (n.effectiveAt || n.at).slice(0, 10); const next = vers.filter((x) => (x.effectiveAt || x.at) > (n.effectiveAt || n.at)).sort((a, b) => ((a.effectiveAt || a.at) < (b.effectiveAt || b.at) ? -1 : 1))[0]; return start <= date && (!next || (next.effectiveAt || next.at).slice(0, 10) > date) }
  const onFiles = (list: FileList | null) => {
    if (!list) return
    const next = [...files]
    for (const f of Array.from(list)) {
      const ext = f.name.split(".").pop()?.toLowerCase() || ""
      if (!OK_EXT.includes(ext) || f.size > 20 * 1024 * 1024) { msg(`Tệp ${f.name} không hợp lệ: chỉ nhận PDF, JPG, PNG, MP3, M4A, WAV, tối đa 20 MB. (MSG-17-02)`, "error"); continue }
      if (next.length >= 5) { msg("Tối đa 5 tệp mỗi ghi nhận (BR-UC17-01).", "error"); break }
      next.push({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(2)} MB`, hash: fakeHash(f.name + f.size + f.lastModified) })
    }
    setFiles(next)
  }
  const save = () => {
    const e: Record<string, string> = {}
    if (!/^KH\d{7}$/.test(subject)) e.subject = "Mã khách hàng dạng KH + 7 chữ số (mã giả danh)."
    if (date > today) e.date = "Ngày đồng ý thực tế không được sau ngày hôm nay. (MSG-17-04)"
    if (!ver) e.ver = "Vui lòng chọn phiên bản thông báo đã cung cấp cho khách hàng."
    else if (!validAt(ver)) e.ver = `Phiên bản ${ver} không có hiệu lực vào ngày ${date}. Vui lòng chọn đúng phiên bản đã cung cấp cho khách hàng. (MSG-17-03)`
    if (!files.length) e.files = "Vui lòng đính kèm ít nhất một tệp bằng chứng. (MSG-17-01)"
    setErr(e)
    if (Object.keys(e).length) return msg(Object.values(e)[0], "error")
    const id = uid("OFF")
    const n = vers.find((x) => x.v === ver)!
    const ev: ConsentEvent = { id: uid("EV"), subject, consent, version: ver, decision, ts: new Date().toISOString(), channel: "Ngoại tuyến", app: "—", property: "Cửa hàng, tổng đài", source: "Ngoại tuyến", hash: n.hash || fakeHash(consent), tx: "tx_" + fakeHash(id).slice(0, 12), ip: "—", ua: "Nhập tại CMP Console", offline: { id, kind, actualDate: date, enteredBy: actor, files, note } }
    add(ev); msg(`Đã lưu ghi nhận ${id}. (MSG-17-05)`); onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Ghi nhận consent ngoại tuyến</DialogTitle><DialogDescription>SCR-17-02 · tệp được băm SHA-256 tại máy chủ và lưu kho bất biến WORM (BR-UC17-03; hash ở đây là mô phỏng).</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="osub" label="Mã khách hàng" req error={err.subject}><Input id="osub" className="font-mono" value={subject} onChange={(e) => setSubject(e.target.value.toUpperCase())} /></FormField>
          <FormField label="Consent" req><NativeSelect label="Consent" value={consent} onChange={(v) => { setConsent(v); setVer("") }} options={consents.filter((c) => c.status === "Hoạt động").map((c) => [c.code, `${c.code} · ${c.name}`] as [string, string])} className="w-full" /></FormField>
          <FormField label="Quyết định" req><NativeSelect label="Quyết định" value={decision} onChange={(v) => setDecision(v as "ACCEPTED" | "REJECTED")} options={[["ACCEPTED", "Đồng ý"], ["REJECTED", "Từ chối"]]} className="w-full" /></FormField>
          <FormField label="Hình thức" req><NativeSelect label="Hình thức" value={kind} onChange={(v) => setKind(v as OfflineInfo["kind"])} options={["SMS", "Ghi âm", "Văn bản, chữ ký"]} className="w-full" /></FormField>
          <FormField id="odate" label="Ngày đồng ý thực tế" req error={err.date}><Input id="odate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
          <FormField label="Phiên bản thông báo đã cung cấp" req error={err.ver} hint="Phải là phiên bản Published vào ngày đồng ý thực tế (BR-UC17-04)">
            <NativeSelect label="Phiên bản" value={ver} onChange={setVer} options={[["", "— Chọn phiên bản —"], ...vers.map((n) => [n.v, `${n.v} · hiệu lực ${fmtDT(n.effectiveAt || n.at).slice(0, 10)} · ${n.status}${validAt(n.v) ? " ✓" : ""}`] as [string, string])]} className="w-full" />
          </FormField>
          <FormField label="Tệp bằng chứng" req error={err.files} className="sm:col-span-2" hint="PDF, JPG, PNG, MP3, M4A, WAV · tối đa 20 MB mỗi tệp, 5 tệp">
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground hover:bg-muted/40">
              <Upload className="size-5" />Chọn tệp hoặc kéo thả vào đây
              <input type="file" multiple className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.mp3,.m4a,.wav" onChange={(e) => onFiles(e.target.files)} />
            </label>
            <Button type="button" size="sm" variant="ghost" className="self-start" onClick={() => setFiles([...files, { name: `phieu-dong-y-${files.length + 1}.pdf`, size: "0.84 MB", hash: fakeHash("demo" + files.length) }])}>Thêm tệp mẫu (minh họa)</Button>
            <div className="flex flex-col gap-1">{files.map((f, i) => <div key={i} className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs">{/\.(mp3|m4a|wav)$/.test(f.name) ? <FileAudio className="size-4" /> : <FileText className="size-4" />}<span className="min-w-0 flex-1 truncate">{f.name} · {f.size}</span><Mono className="text-muted-foreground">{shortHash(f.hash)}</Mono><button aria-label={"Bỏ " + f.name} onClick={() => setFiles(files.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></button></div>)}</div>
          </FormField>
          <FormField id="onote" label="Ghi chú" className="sm:col-span-2"><Textarea id="onote" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: khách ký phiếu tại cửa hàng Quận 3" /></FormField>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={save}>Lưu ghi nhận</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
