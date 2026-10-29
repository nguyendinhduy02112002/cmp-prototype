/** Hộp thoại duyệt dùng chung (SCR-AP-01), trình so sánh phiên bản (SRS-IF-09, mục 4.3.5) */
import * as React from "react"
import { create } from "zustand"
import { useNavigate } from "react-router-dom"
import { Check, TriangleAlert } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { currentActor, getApprovals, hasPermission, useStore, type ApprovalItem } from "@/lib/store"
import { fmtDT } from "@/lib/fmt"
import { toast } from "@/components/ui/toast"
import { NativeSelect, Note, Pill } from "./kit"
import { cn } from "@/lib/utils"

interface UiState {
  apId: string | null
  openAp: (id: string | null) => void
  cmp: { title: string; list: { label: string; snap: Record<string, unknown> }[] } | null
  openCmp: (c: UiState["cmp"]) => void
}
export const useUi = create<UiState>((set) => ({ apId: null, openAp: (id) => set({ apId: id }), cmp: null, openCmp: (c) => set({ cmp: c }) }))

export const msg = (title: string, type: "success" | "error" | "info" | "warning" = "success", description?: string) => toast.add({ title, description, type })

/** Danh sách đề nghị chờ duyệt, ổn định giữa các lần render */
export function useApprovals() {
  const applications = useStore((s) => s.applications)
  const purposes = useStore((s) => s.purposes)
  const consents = useStore((s) => s.consents)
  const notices = useStore((s) => s.notices)
  const banners = useStore((s) => s.banners)
  const imports = useStore((s) => s.imports)
  const ruleSets = useStore((s) => s.ruleSets)
  const matrix = useStore((s) => s.matrix)
  return React.useMemo(() => getApprovals({ applications, purposes, consents, notices, banners, imports, ruleSets, matrix }), [applications, purposes, consents, notices, banners, imports, ruleSets, matrix])
}

export function DiffTable({ rows }: { rows: [string, string, string][] }) {
  const changed = rows.filter((r) => r[1] !== r[2]).length
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs text-muted-foreground">{changed} trường thay đổi · nền xanh = giá trị mới, gạch đỏ = giá trị bị bỏ</div>
      <div className="max-h-[42vh] overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted text-xs"><tr><th className="p-2 text-left w-[26%]">Trường</th><th className="p-2 text-left">Giá trị trước</th><th className="p-2 text-left">Giá trị đề nghị</th></tr></thead>
          <tbody>
            {rows.map(([k, a, b]) => {
              const ch = a !== b
              return (
                <tr key={k} className="border-t align-top">
                  <td className="p-2 font-medium">{k}{ch && <Pill tone="info" className="ml-1.5 h-4 text-[10px]">Có thay đổi</Pill>}</td>
                  <td className="p-2"><span className={cn(ch && a !== "—" && "diff-del rounded px-0.5")}>{a}</span></td>
                  <td className="p-2"><span className={cn(ch && "diff-add rounded px-0.5")}>{b}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ApprovalDialog() {
  const apId = useUi((s) => s.apId)
  return apId ? <ApprovalBody key={apId} apId={apId} /> : null
}
function ApprovalBody({ apId }: { apId: string }) {
  const openAp = useUi((s) => s.openAp)
  const list = useApprovals()
  const role = useStore((s) => s.role)
  const state = useStore((s) => s)
  const approve = useStore((s) => s.approve)
  const reject = useStore((s) => s.reject)
  const withdraw = useStore((s) => s.withdraw)
  const nav = useNavigate()
  const [note, setNote] = React.useState("")
  const [material, setMaterial] = React.useState<"Có" | "Không">(() => useStore.getState().notices.find((x) => x.id === apId.replace(/^notice:/, ""))?.suggested || "Không")
  const [mReason, setMReason] = React.useState("")
  const [eff, setEff] = React.useState("now")
  const [effDate, setEffDate] = React.useState("2026-11-01T00:00")
  const item: ApprovalItem | undefined = list.find((x) => x.id === apId)
  const events = useStore((s) => s.events)
  const me = currentActor(state)
  const close = () => openAp(null)
  if (!item) return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent><DialogHeader><DialogTitle>Đề nghị không còn chờ duyệt</DialogTitle><DialogDescription>Đề nghị đã được xử lý hoặc người gửi đã rút lại.</DialogDescription></DialogHeader><DialogFooter><Button onClick={close}>Đóng</Button></DialogFooter></DialogContent>
    </Dialog>
  )
  const canAp = hasPermission(state, item.mod, "approve")
  const self = item.by === me
  const ok = canAp && !self
  const why = self ? "Bạn là người gửi đề nghị này nên không thể tự duyệt (BR-AP-01)." : !canAp ? `Vai trò ${role} chưa có quyền Phê duyệt nhóm này. Admin bật quyền tại Người dùng & phân quyền › Ma trận phân quyền.` : ""
  const isNotice = item.kind === "notice"
  const affected = isNotice ? new Set(events.filter((e) => e.consent === item.ref.split("|")[0] && e.decision === "ACCEPTED").map((e) => e.subject)).size : 0
  const suggested = isNotice ? useStore.getState().notices.find((x) => x.id === item.ref)?.suggested : undefined
  const doApprove = () => {
    if (isNotice && material !== suggested && mReason.trim().length < 10) return msg("Chọn nhãn khác gợi ý cần nhập lý do (BR-UC04-02)", "error")
    const r = approve(item.id, note, isNotice ? { material, materialReason: mReason, effective: eff === "date" ? new Date(effDate).toISOString() : undefined } : undefined)
    msg(r.msg, r.ok ? "success" : "error")
    if (r.ok) close()
  }
  const doReject = () => { const r = reject(item.id, note); msg(r.msg, r.ok ? "success" : "error"); if (r.ok) close() }
  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.type} · {item.name}</DialogTitle>
          <DialogDescription>{item.action} · gửi bởi {item.by} ({item.byRole}) lúc {fmtDT(item.at)}</DialogDescription>
        </DialogHeader>
        <DiffTable rows={item.rows} />
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">Kiểm tra tự động</div>
          {item.checks.map(([c, t], i) => (
            <div key={i} className="flex items-start gap-2 text-sm">{c ? <Check className="mt-0.5 size-4 text-success" /> : <TriangleAlert className="mt-0.5 size-4 text-warning" />}<span>{t}</span></div>
          ))}
          <div className="text-xs text-muted-foreground">Cảnh báo không chặn phê duyệt.</div>
        </div>
        {isNotice && ok && (
          <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Nhãn thay đổi trọng yếu <span className="text-destructive">*</span></Label>
              <NativeSelect label="Nhãn trọng yếu" value={material} onChange={(v) => setMaterial(v as "Có" | "Không")} options={[["Không", "Không trọng yếu – giữ consent"], ["Có", "Trọng yếu – xin lại đồng ý"]]} />
              <span className="text-xs text-muted-foreground">Gợi ý của hệ thống: {suggested === "Có" ? "Trọng yếu" : "Không trọng yếu"}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Thời điểm hiệu lực</Label>
              <NativeSelect label="Hiệu lực" value={eff} onChange={setEff} options={[["now", "Ngay khi duyệt"], ["date", "Chọn thời điểm"]]} />
              {eff === "date" && <Input type="datetime-local" value={effDate} onChange={(e) => setEffDate(e.target.value)} />}
            </div>
            {material !== suggested && <div className="sm:col-span-2 flex flex-col gap-1.5"><Label>Lý do chọn khác gợi ý <span className="text-destructive">*</span></Label><Input value={mReason} onChange={(e) => setMReason(e.target.value)} placeholder="Tối thiểu 10 ký tự" /></div>}
            {material === "Có" && <div className="sm:col-span-2"><Note tone="warn">Khi xuất bản, khoảng <b>{affected.toLocaleString("vi-VN")}</b> chủ thể đang ACCEPTED sẽ chuyển RE_CONSENT và hệ thống phát VERSION_CHANGED (BR-UC03-07).</Note></div>}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="apnote">Ý kiến người duyệt <span className="text-xs font-normal text-muted-foreground">(bắt buộc khi Trả lại, 10–1.000 ký tự)</span></Label>
          <Textarea id="apnote" rows={2} value={note} onChange={(e) => setNote(e.target.value)} disabled={!ok} maxLength={1000} />
        </div>
        {why && <Note tone="lock">{why}</Note>}
        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { close(); nav(item.link) }}>Mở đối tượng</Button>
            {self && <Button variant="outline" onClick={() => { withdraw(item.id); msg("Đã rút lại yêu cầu duyệt."); close() }}>Rút lại yêu cầu</Button>}
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" disabled={!ok} onClick={doReject}>Trả lại</Button>
            <Button disabled={!ok} onClick={doApprove}>{isNotice ? "Duyệt và xuất bản" : "Phê duyệt"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** So sánh hai phiên bản bất kỳ (SRS-IF-09) */
export function CompareDialog() {
  const cmp = useUi((s) => s.cmp)
  return cmp ? <CompareBody key={cmp.title + cmp.list.length} cmp={cmp} /> : null
}
function CompareBody({ cmp }: { cmp: NonNullable<UiState["cmp"]> }) {
  const openCmp = useUi((s) => s.openCmp)
  const [a, setA] = React.useState(cmp.list.length > 1 ? 1 : 0)
  const [b, setB] = React.useState(0)
  const A = cmp.list[a]?.snap || {}, B = cmp.list[b]?.snap || {}
  const show = (v: unknown) => (Array.isArray(v) ? v.join(", ") || "—" : v === undefined || v === null || v === "" ? "—" : String(v))
  const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])]
  const opts = cmp.list.map((x, i) => [String(i), x.label] as [string, string])
  return (
    <Dialog open onOpenChange={(o) => !o && openCmp(null)}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader><DialogTitle>So sánh phiên bản · {cmp.title}</DialogTitle><DialogDescription>Chọn hai phiên bản bất kỳ. Màn hình chỉ đọc (mục 4.3.5).</DialogDescription></DialogHeader>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Phiên bản A</span><NativeSelect label="Phiên bản A" value={String(a)} onChange={(v) => setA(+v)} options={opts} />
          <span>Phiên bản B</span><NativeSelect label="Phiên bản B" value={String(b)} onChange={(v) => setB(+v)} options={opts} />
        </div>
        {a === b ? <Note tone="warn">Vui lòng chọn hai phiên bản khác nhau.</Note> : <DiffTable rows={keys.map((k) => [k, show(A[k]), show(B[k])])} />}
        <DialogFooter><Button variant="outline" onClick={() => openCmp(null)}>Đóng</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
