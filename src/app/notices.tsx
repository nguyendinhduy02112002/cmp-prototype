/** SC-05 Phiên bản thông báo – UC-03, UC-04 · SCR-03-01..03 (một bảng chung cho mọi consent) */
import * as React from "react"
import { Plus, GitCompare, Check, TriangleAlert } from "lucide-react"
import { PageHeader, Section, StatusBadge, Pill, NativeSelect, Note, Mono, KV, FormField } from "@/components/cmp/kit"
import { DataTable, type Col } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCan, useStore } from "@/lib/store"
import type { NoticeContent, NoticeVersion } from "@/lib/types"
import { fmtDT, shortHash } from "@/lib/fmt"
import { msg, useUi } from "@/components/cmp/approval"
import { BusinessContextHelp, RelationshipNote, WorkflowNextSteps } from "@/components/cmp/business-context-help"
import { NoticeBlock } from "@/components/cmp/banner-renderer"

const GROUPS: [keyof NoticeContent, string][] = [["data", "Loại dữ liệu"], ["purpose", "Mục đích"], ["parties", "Bên kiểm soát, bên xử lý, bên nhận"], ["rights", "Quyền và nghĩa vụ của chủ thể"]]
const OPEN = ["Nháp", "Chờ duyệt", "Bị trả lại", "Đã duyệt – chờ hiệu lực"]
/** Gợi ý nhãn trọng yếu theo bảng quy tắc UC-04: đổi loại dữ liệu, mục đích, bên nhận → Trọng yếu */
export const suggestMaterial = (n: NoticeVersion, pub?: NoticeVersion): "Có" | "Không" => (!pub ? "Có" : (["data", "purpose", "parties"] as const).some((k) => n.content.vi[k].trim() !== pub.content.vi[k].trim()) ? "Có" : "Không")
export const noticeSnap = (n: NoticeVersion) => Object.fromEntries([...GROUPS.map(([k, l]) => [l + " (vi)", n.content.vi[k]]), ...GROUPS.map(([k, l]) => [l + " (en)", n.content.en[k]]), ["Nhãn trọng yếu", n.material || "—"], ["content_hash", n.hash || "—"]])

export default function NoticesPage() {
  const notices = useStore((s) => s.notices)
  const consents = useStore((s) => s.consents)
  const cancel = useStore((s) => s.cancelSchedule)
  const activate = useStore((s) => s.activateScheduled)
  const del = useStore((s) => s.deleteNotice)
  const createNotice = useStore((s) => s.createNotice)
  const can = useCan()
  const openAp = useUi((s) => s.openAp)
  const [fc, setFc] = React.useState("all")
  const [fs, setFs] = React.useState("all")
  const [fm, setFm] = React.useState("all")
  const [edit, setEdit] = React.useState<string | null>(null)
  const [view, setView] = React.useState<string | null>(null)
  const [pick, setPick] = React.useState(false)
  const ed = can("setup", "edit")
  const data = notices.filter((n) => (fc === "all" || n.consent === fc) && (fs === "all" || n.status === fs) && (fm === "all" || n.material === fm)).sort((a, b) => (a.consent === b.consent ? (a.v < b.v ? 1 : -1) : a.consent < b.consent ? -1 : 1))
  const cols: Col<NoticeVersion>[] = [
    { accessorKey: "consent", header: "consent_code", cell: ({ row }) => <div><Mono className="font-semibold">{row.original.consent}</Mono><div className="text-xs text-muted-foreground">{consents.find((c) => c.code === row.original.consent)?.name}</div></div> },
    { accessorKey: "v", header: "Phiên bản", cell: ({ row }) => <Mono className="font-semibold">{row.original.v}</Mono> },
    { accessorKey: "sum", header: "Tóm tắt thay đổi", cell: ({ row }) => <div className="max-w-64 text-sm">{row.original.sum || "—"}{row.original.retNote && <div className="text-xs text-destructive">Lý do trả lại: {row.original.retNote}</div>}</div> },
    { id: "mat", header: "Trọng yếu", cell: ({ row }) => { const n = row.original; return n.material ? <Pill tone={n.material === "Có" ? "warn" : "info"}>{n.material === "Có" ? "Có · xin lại" : "Không"}</Pill> : n.suggested ? <span className="text-xs text-muted-foreground">Gợi ý: {n.suggested}</span> : "—" } },
    { id: "eff", header: "Hiệu lực", cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs">{fmtDT(row.original.effectiveAt)}</span> },
    { accessorKey: "by", header: "Người soạn", cell: ({ row }) => <span className="text-sm">{row.original.by}</span> },
    { id: "ap", header: "Người duyệt", cell: ({ row }) => <span className="text-sm">{row.original.approvedBy || "—"}</span> },
    { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <StatusBadge s={row.original.status} raw /> },
    { id: "act", header: "", cell: ({ row }) => { const n = row.original; return (
      <div className="flex flex-wrap justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="xs" variant="outline" onClick={() => setView(n.id)}>Xem</Button>
        {ed && ["Nháp", "Bị trả lại"].includes(n.status) && <Button size="xs" onClick={() => setEdit(n.id)}>Soạn</Button>}
        {n.status === "Chờ duyệt" && <Button size="xs" variant="outline" onClick={() => openAp("notice:" + n.id)}>Duyệt</Button>}
        {n.status === "Đã duyệt – chờ hiệu lực" && can("setup", "approve") && <Button size="xs" variant="outline" onClick={() => { cancel(n.id); msg("Đã hủy lịch, phiên bản trở về Nháp.") }}>Hủy lịch</Button>}
        {n.status === "Đã duyệt – chờ hiệu lực" && <Button size="xs" variant="outline" onClick={() => { activate(n.id); msg(`Mô phỏng đến thời điểm hiệu lực: ${n.consent} ${n.v} Published.`) }}>Mô phỏng đến hạn</Button>}
        {ed && n.status === "Nháp" && !n.everSent && <Button size="xs" variant="ghost" className="text-destructive" onClick={() => { del(n.id); msg("Đã xóa bản nháp.") }}>Xóa</Button>}
      </div>) } },
  ]
  return (
    <>
      <PageHeader title="Phiên bản thông báo" crumbs={[["Cấu hình"]]} desc="Nội dung thông báo hiển thị cho chủ thể khi xin đồng ý. Phiên bản Published bất biến; chủ thể đã đồng ý ở phiên bản nào luôn truy xuất lại đúng nội dung đó (BR-12). Phê duyệt của DPO đồng thời là quyết định xuất bản (BR-UC03-05)."
        actions={ed ? <Button onClick={() => setPick(true)}><Plus /> Tạo phiên bản mới</Button> : undefined} />
      <Section className="flex flex-wrap items-center gap-2">
        <BusinessContextHelp title="Nội dung thông báo cho chủ thể dữ liệu" context={{ purpose: "Quản lý chính xác nội dung khách hàng được đọc trước khi quyết định consent.", when: "Khi tạo consent mới hoặc khi dữ liệu, purpose, bên nhận hay quyền của chủ thể thay đổi.", actors: "Nhân viên soạn; DPO quyết định material label, thời điểm hiệu lực và xuất bản.", inputs: "Consent, nội dung Việt/Anh, tóm tắt thay đổi và ngày hiệu lực.", outputs: "Notice Published để Banner/Popup hiển thị và Evidence lưu đúng version.", related: ["Consent", "Notice", "Banner", "Evidence"], example: "Thêm bên nhận dữ liệu tạo version mới và có thể yêu cầu khách hàng đồng ý lại.", srs: "UC-03, UC-04" }} />
        <RelationshipNote><b>Notice khác Banner:</b> Notice quản lý nội dung và version; Banner quản lý cách bố trí, màu sắc và tương tác hiển thị nội dung đó.</RelationshipNote>
      </Section>
      <Section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect label="Consent" value={fc} onChange={setFc} options={[["all", "Mọi consent"], ...[...new Set(notices.map((n) => n.consent))].map((c) => [c, c] as [string, string])]} />
          <NativeSelect label="Trạng thái" value={fs} onChange={setFs} options={[["all", "Mọi trạng thái"], "Nháp", "Chờ duyệt", "Bị trả lại", "Đã duyệt – chờ hiệu lực", "Published", "Expired"]} />
          <NativeSelect label="Nhãn" value={fm} onChange={setFm} options={[["all", "Mọi nhãn"], ["Có", "Trọng yếu"], ["Không", "Không trọng yếu"]]} />
          <span className="text-sm text-muted-foreground">{data.length} phiên bản</span>
        </div>
        <DataTable columns={cols} data={data} onRowClick={(n) => setView(n.id)} pageSize={12} />
        <Note>Vòng đời theo SRS mục 5.2.1: Nháp → Chờ duyệt → Đã duyệt – chờ hiệu lực → Published → Expired; có Bị trả lại, rút lại, hủy lịch. Mỗi consent chỉ có tối đa một phiên bản đang xử lý (BR-UC03-04). (BR-UC03-01 ghi khác, xem phát hiện F-02 ở Bước 1.)</Note>
      </Section>
      {notices.some((n) => n.status === "Published") && <Section><WorkflowNextSteps links={[{ label: "Tiếp theo: Cấu hình giao diện thu thập", to: "/banners", mod: "banner", description: "Đưa Consent và Notice đã Published lên Banner hoặc Popup" }]} /></Section>}
      {pick && (
        <Dialog open onOpenChange={(o) => !o && setPick(false)}>
          <PickConsent onPick={(c) => {
            const open = notices.find((n) => n.consent === c && OPEN.includes(n.status))
            if (open) return msg(`Consent này đang có phiên bản ${open.v} ở trạng thái ${open.status}. Vui lòng hoàn tất phiên bản đó trước. (MSG-03-02)`, "info")
            const id = createNotice(c); setPick(false); setEdit(id)
          }} onClose={() => setPick(false)} />
        </Dialog>
      )}
      {edit && <NoticeEditor id={edit} onClose={() => setEdit(null)} />}
      {view && <NoticeView id={view} onClose={() => setView(null)} />}
    </>
  )
}

function PickConsent({ onPick, onClose }: { onPick: (c: string) => void; onClose: () => void }) {
  const consents = useStore((s) => s.consents).filter((c) => c.status === "Hoạt động" || c.status === "Chờ duyệt")
  const [c, setC] = React.useState(consents[0]?.code || "")
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Tạo phiên bản thông báo mới</DialogTitle><DialogDescription>Phiên bản mới được sao chép từ bản Published hiện hành của consent (BR-UC03-03).</DialogDescription></DialogHeader>
      <FormField label="Consent" req><NativeSelect label="Consent" value={c} onChange={setC} options={consents.map((x) => [x.code, `${x.code} · ${x.name}`] as [string, string])} className="w-full" /></FormField>
      <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={() => onPick(c)}>Tạo và soạn</Button></DialogFooter>
    </DialogContent>
  )
}

function NoticeEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const n0 = useStore((s) => s.notices.find((x) => x.id === id))!
  const pub = useStore((s) => s.notices.find((x) => x.consent === n0.consent && x.status === "Published"))
  const save = useStore((s) => s.saveNotice)
  const submit = useStore((s) => s.submitNotice)
  const [n, setN] = React.useState<NoticeVersion>(() => JSON.parse(JSON.stringify(n0)))
  const [lang, setLang] = React.useState<"vi" | "en">("vi")
  const setC = (l: "vi" | "en", k: keyof NoticeContent, v: string) => setN((x) => ({ ...x, content: { ...x.content, [l]: { ...x.content[l], [k]: v } } }))
  const missing = (l: "vi" | "en") => GROUPS.filter(([k]) => !n.content[l][k].trim()).map(([, lbl]) => lbl)
  const enStarted = GROUPS.some(([k]) => n.content.en[k].trim())
  const sug = suggestMaterial(n, pub)
  const doSubmit = () => {
    const mv = missing("vi"); if (mv.length) return msg(`Phiên bản chưa đủ 4 nhóm thông tin bắt buộc ở tiếng Việt: ${mv.join(", ")}. (MSG-03-01)`, "error")
    if (enStarted && missing("en").length) return msg(`Phiên bản chưa đủ 4 nhóm thông tin bắt buộc ở tiếng Anh: ${missing("en").join(", ")}. (MSG-03-01)`, "error")
    if (!n.sum.trim()) return msg("Vui lòng nhập Tóm tắt thay đổi. (MSG-C-01)", "error")
    save(id, { content: n.content, sum: n.sum }); submit(id, sug); msg(`Đã gửi duyệt phiên bản ${n.consent} ${n.v}. DPO sẽ nhận được thông báo. (MSG-C-02)`); onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Soạn phiên bản · {n.consent} {n.v}</DialogTitle><DialogDescription>{pub ? `Sao chép từ bản Published ${pub.v}. ` : ""}Tiếng Việt bắt buộc, tiếng Anh tùy chọn nhưng nếu đã nhập thì phải đủ 4 nhóm (BR-UC03-02, M1-05).</DialogDescription></DialogHeader>
        {n0.retNote && <Note tone="err">Lý do trả lại: {n0.retNote}</Note>}
        <FormField id="nsum" label="Tóm tắt thay đổi" req><Input id="nsum" value={n.sum} onChange={(e) => setN({ ...n, sum: e.target.value })} placeholder="Ví dụ: Thêm bên nhận Công ty Bảo hiểm XYZ" /></FormField>
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <Tabs value={lang} onValueChange={(v) => setLang(v as "vi" | "en")}>
            <TabsList><TabsTrigger value="vi">Tiếng Việt *</TabsTrigger><TabsTrigger value="en">English</TabsTrigger></TabsList>
            {(["vi", "en"] as const).map((l) => (
              <TabsContent key={l} value={l} className="mt-3 flex flex-col gap-3">
                {GROUPS.map(([k, lbl]) => (
                  <FormField key={k} id={`${l}-${k}`} label={lbl} req={l === "vi"} hint={pub && pub.content[l][k] !== n.content[l][k] ? "Đã thay đổi so với bản Published" : undefined}>
                    <Textarea id={`${l}-${k}`} rows={2} value={n.content[l][k]} onChange={(e) => setC(l, k, e.target.value)} />
                  </FormField>
                ))}
              </TabsContent>
            ))}
          </Tabs>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border p-3">
              <div className="mb-2 text-sm font-medium">Danh sách kiểm tra</div>
              {[[!missing("vi").length, "Đủ 4 nhóm thông tin tiếng Việt"], [!enStarted || !missing("en").length, enStarted ? "Đủ 4 nhóm thông tin tiếng Anh" : "Chưa có bản tiếng Anh (tùy chọn)"], [!!n.sum.trim(), "Có tóm tắt thay đổi"]].map(([ok, t], i) => <div key={i} className="flex items-start gap-2 py-0.5 text-sm">{ok ? <Check className="mt-0.5 size-4 text-success" /> : <TriangleAlert className="mt-0.5 size-4 text-warning" />}{t}</div>)}
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">Gợi ý nhãn (bảng quy tắc UC-04)</div>
              <Pill tone={sug === "Có" ? "warn" : "info"} className="mt-1.5">{sug === "Có" ? "Trọng yếu – sẽ xin lại đồng ý" : "Không trọng yếu"}</Pill>
              <p className="mt-1.5 text-xs text-muted-foreground">Thay đổi loại dữ liệu, mục đích, bên nhận được gợi ý Trọng yếu. DPO quyết định nhãn cuối cùng khi duyệt (BR-UC04-02).</p>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button variant="secondary" onClick={() => { save(id, { content: n.content, sum: n.sum }); msg(`Đã lưu bản nháp ${n.consent} ${n.v}.`); onClose() }}>Lưu nháp</Button><Button onClick={doSubmit}>Gửi duyệt</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NoticeView({ id, onClose }: { id: string; onClose: () => void }) {
  const n = useStore((s) => s.notices.find((x) => x.id === id))
  const all = useStore((s) => s.notices)
  const openCmp = useUi((s) => s.openCmp)
  const [lang, setLang] = React.useState<"vi" | "en">("vi")
  if (!n) return null
  const sibs = all.filter((x) => x.consent === n.consent).sort((a, b) => (a.v < b.v ? 1 : -1))
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2">{n.consent} <Mono>{n.v}</Mono> <StatusBadge s={n.status} raw /></DialogTitle><DialogDescription>{n.sum}</DialogDescription></DialogHeader>
        <KV rows={[["Người soạn", `${n.by} · ${fmtDT(n.at)}`], ["Người duyệt", n.approvedBy || "—"], ["Nhãn trọng yếu", n.material ? `${n.material}${n.materialReason ? " · " + n.materialReason : ""}` : n.suggested ? `Gợi ý: ${n.suggested}` : "—"], ["Hiệu lực", fmtDT(n.effectiveAt)], ["content_hash", <Mono>{shortHash(n.hash)}</Mono>]]} />
        <div className="flex items-center gap-2"><NativeSelect label="Ngôn ngữ" value={lang} onChange={(v) => setLang(v as "vi" | "en")} options={[["vi", "Tiếng Việt"], ["en", "English"]]} />{sibs.length > 1 && <Button size="sm" variant="outline" onClick={() => openCmp({ title: n.consent, list: sibs.map((x) => ({ label: `${x.v} · ${x.status}`, snap: noticeSnap(x) })) })}><GitCompare /> So sánh phiên bản</Button>}</div>
        <div className="rounded-lg border bg-white p-3 text-[#16202E]"><NoticeBlock n={n} lang={lang} open /></div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Đóng</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
