/** SC-02 Trung tâm thông báo – SCR-AP-01, UC-40 */
import * as React from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { PageHeader, Section, Chips, Pill, Note, KV } from "@/components/cmp/kit"
import { useNotifs, NKIND_LABEL, type NKind } from "@/components/cmp/notifs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { fmtDT } from "@/lib/fmt"
import { useStore } from "@/lib/store"
import { msg } from "@/components/cmp/approval"

export default function NotificationsPage() {
  const items = useNotifs()
  const [f, setF] = React.useState<"all" | NKind>("all")
  const [sp, setSp] = useSearchParams()
  const alertId = sp.get("alert")
  const alerts = useStore((s) => s.alerts)
  const resolve = useStore((s) => s.resolveAlert)
  const nav = useNavigate()
  const [note, setNote] = React.useState("")
  const al = alerts.find((a) => a.id === alertId)
  const list = items.filter((x) => f === "all" || x.k === f).sort((a, b) => (f === "ap" ? (a.at > b.at ? 1 : -1) : 0))
  const opts: [string, string, number][] = [["all", "Tất cả", items.length], ...(["ap", "mine", "res", "al"] as NKind[]).map((k) => [k, NKIND_LABEL[k], items.filter((x) => x.k === k).length] as [string, string, number])]
  const tone = { info: "info", ok: "ok", err: "err", warn: "warn", mute: "mute" } as const
  return (
    <>
      <PageHeader title="Trung tâm thông báo" crumbs={[["Tổng quan"]]} desc="Mọi việc cần xử lý của bạn: đề nghị chờ duyệt, kết quả đề nghị đã gửi, cảnh báo vận hành. Bấm một dòng để xử lý ngay. Thay cho Hàng chờ phê duyệt và màn Cảnh báo riêng (SRS v1.3)." />
      <Section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Chips value={f} onChange={(v) => setF(v as "all" | NKind)} options={opts} />
          <span className="text-xs text-muted-foreground">{f === "ap" ? "Cũ nhất trước" : "Mới nhất trước"}</span>
        </div>
        <Card className="py-0 gap-0 overflow-hidden">
          {list.map((x) => (
            <button key={x.key} onClick={x.open} className="flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted/50">
              <Pill tone={tone[x.tone]} className="mt-0.5 shrink-0">{NKIND_LABEL[x.k]}</Pill>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{x.title}</div>
                <div className="text-xs text-muted-foreground">{x.sub}</div>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{fmtDT(x.at)}</span>
              <span className="shrink-0 text-xs font-medium text-primary">{x.k === "ap" ? "Duyệt" : "Mở"}</span>
            </button>
          ))}
          {!list.length && <div className="py-10 text-center text-sm text-muted-foreground">Không có thông báo.</div>}
        </Card>
        <Note>Kênh: chuông trong ứng dụng (luôn bật) và email (BR-AP-07). Email, Zalo cảnh báo chỉ chứa mã đối tượng và liên kết, không chứa dữ liệu cá nhân (BR-UC40-06).</Note>
      </Section>
      {al && (
        <Dialog open onOpenChange={(o) => { if (!o) { sp.delete("alert"); setSp(sp); setNote("") } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Cảnh báo {al.id}</DialogTitle><DialogDescription>{al.type}</DialogDescription></DialogHeader>
            <KV rows={[["Mức", <Pill tone={al.sev === "Nghiêm trọng" ? "err" : al.sev === "Cảnh báo" ? "warn" : "info"}>{al.sev}</Pill>], ["Nguồn", al.src], ["Thời điểm", fmtDT(al.at)], ["Người nhận", al.to.join(", ")], ["Trạng thái", al.status]]} />
            {al.status === "Đang mở" ? <Textarea placeholder="Ghi chú xử lý (10–500 ký tự)" value={note} onChange={(e) => setNote(e.target.value)} /> : <div className="text-sm text-muted-foreground">Ghi chú: {al.note}</div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => nav(al.link)}>Đi tới đối tượng</Button>
              {al.status === "Đang mở" && <Button onClick={() => { if (note.trim().length < 10) return msg("Ghi chú xử lý tối thiểu 10 ký tự", "error"); resolve(al.id, note); msg("Đã đánh dấu cảnh báo đã xử lý"); sp.delete("alert"); setSp(sp) }}>Đánh dấu đã xử lý</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
