/** SC-08 Bản ghi consent – trạng thái hiện hành theo chủ thể × consent (UC-36, BRL-08) */
import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search } from "lucide-react"
import { PageHeader, Section, Kpi, StatusBadge, NativeSelect, Note, Mono, Pill } from "@/components/cmp/kit"
import { DataTable, type Col } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Input } from "@/components/ui/input"
import { useStore, currentStates } from "@/lib/store"
import { fmtDT, fmtN } from "@/lib/fmt"
import { BusinessContextHelp, RelationshipNote, WorkflowNextSteps } from "@/components/cmp/business-context-help"

type Row = ReturnType<typeof currentStates>[number]

export default function RecordsPage() {
  const tenantProperties = useStore((s) => s.properties)
  const properties = tenantProperties.map((p) => p.name)
  const events = useStore((s) => s.events)
  const consents = useStore((s) => s.consents)
  const role = useStore((s) => s.role)
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = React.useState("")
  const fc = sp.get("consent") || "all"
  const [fd, setFd] = React.useState("all")
  const [fsrc, setFsrc] = React.useState("all")
  const [fp, setFp] = React.useState("all")
  const [who, setWho] = React.useState("known")
  const all = React.useMemo(() => currentStates(events), [events])
  const data = all.filter((r) => (who === "all" || (who === "known" ? r.subject.startsWith("KH") : r.subject.startsWith("ck_"))) && (fc === "all" || r.consent === fc) && (fd === "all" || r.decision === fd) && (fsrc === "all" || r.last.source === fsrc) && (fp === "all" || r.last.property === fp) && (!q || r.subject.toLowerCase().includes(q.toLowerCase())))
  const n = (d: string) => data.filter((r) => r.decision === d).length
  const cols: Col<Row>[] = [
    { accessorKey: "subject", header: ({ column }) => <DataTableColumnHeader column={column} title="Mã khách hàng" />, cell: ({ row }) => <div><Mono className="font-semibold">{row.original.subject}</Mono>{row.original.subject.startsWith("ck_") && <div className="text-xs text-muted-foreground">Ẩn danh (cookie ID)</div>}</div> },
    { accessorKey: "consent", header: ({ column }) => <DataTableColumnHeader column={column} title="consent_code" />, cell: ({ row }) => <Mono>{row.original.consent}</Mono> },
    { accessorKey: "decision", header: "Trạng thái hiện hành", cell: ({ row }) => <StatusBadge s={row.original.decision} /> },
    { id: "v", header: "Phiên bản", cell: ({ row }) => <Mono>{row.original.last.version}</Mono> },
    { id: "ch", header: "Kênh", cell: ({ row }) => <span className="text-sm">{row.original.last.channel}</span> },
    { id: "src", header: "Nguồn", cell: ({ row }) => <Pill tone={row.original.last.source === "Legacy" ? "dark" : row.original.last.source === "Ngoại tuyến" ? "warn" : "mute"}>{row.original.last.source}{row.original.last.legacyRisk ? " · rủi ro" : ""}</Pill> },
    { id: "ts", accessorFn: (r) => r.last.ts, header: ({ column }) => <DataTableColumnHeader column={column} title="Cập nhật" />, cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs">{fmtDT(row.original.last.ts)}</span> },
    { accessorKey: "count", header: "Số sự kiện", cell: ({ row }) => <span className="tabular-nums">{row.original.count}</span> },
  ]
  return (
    <>
      <PageHeader title="Trạng thái đồng ý hiện tại" crumbs={[["Vận hành"]]} desc="Tra cứu khách hàng hiện đang đồng ý, từ chối, đã rút lại hay cần đồng ý lại đối với từng consent. Chọn một bản ghi để xem toàn bộ lịch sử quyết định liên quan." />
      <Section className="flex flex-wrap items-center gap-2">
        <BusinessContextHelp title="Trạng thái đồng ý hiện tại" context={{ purpose: "Trả lời nhanh một khách hàng hiện có cho phép xử lý theo consent hay không.", when: "Khi vận hành cần kiểm tra current state hoặc đi từ Dashboard tới chi tiết khách hàng.", actors: "DPO, Admin và Nhân viên theo phạm vi quyền.", inputs: "Subject, consent, trạng thái, nguồn và Property.", outputs: "Current state lấy từ event hợp lệ mới nhất và đường dẫn tới history.", related: ["Records", "Evidence", "Dashboard"], example: "KH001 đang WITHDRAWN đối với CS-MKT-EMAIL nên không được gửi email marketing.", srs: "UC-36 · SCR-36-01" }} />
        <RelationshipNote><b>Records khác Evidence:</b> Records cho biết trạng thái <b>hiện tại</b>; Evidence giải thích <b>lịch sử</b> các quyết định tạo nên trạng thái đó.</RelationshipNote>
      </Section>
      <Section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Bản ghi khớp lọc" value={fmtN(data.length)} />
        <Kpi label="Đồng ý" value={fmtN(n("ACCEPTED"))} tone="ok" />
        <Kpi label="Từ chối" value={fmtN(n("REJECTED"))} tone="warn" />
        <Kpi label="Rút lại" value={fmtN(n("WITHDRAWN"))} tone="err" />
        <Kpi label="Cần đồng ý lại" value={fmtN(n("RE_CONSENT"))} />
      </Section>
      <Section><WorkflowNextSteps title="Xem thêm" links={[{ label: "Lịch sử & bằng chứng", to: "/evidence", mod: "records", description: "Tra cứu từng event và nội dung đã hiển thị" }, { label: "Dashboard", to: "/dashboard", mod: "dash" }]} /></Section>
      <Section className="flex flex-col gap-3">
        {role === "Nhân viên" && <Note tone="lock">Vai trò Nhân viên xem ở mức giới hạn (G): che IP, user agent ở chi tiết; không có nút xuất (mục 4.2).</Note>}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative"><Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input className="h-8 w-56 pl-8" placeholder="Mã khách hàng KH…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <NativeSelect label="Đối tượng" value={who} onChange={setWho} options={[["known", "Đã định danh (KH…)"], ["anon", "Ẩn danh (cookie)"], ["all", "Tất cả"]]} />
          <NativeSelect label="Consent" value={fc} onChange={(v) => { if (v === "all") sp.delete("consent"); else sp.set("consent", v); setSp(sp) }} options={[["all", "Mọi consent"], ...consents.filter((c) => c.everActive).map((c) => [c.code, c.code] as [string, string])]} />
          <NativeSelect label="Trạng thái" value={fd} onChange={setFd} options={[["all", "Mọi trạng thái"], ["ACCEPTED", "Đồng ý"], ["REJECTED", "Từ chối"], ["WITHDRAWN", "Rút lại"], ["RE_CONSENT", "Cần đồng ý lại"]]} />
          <NativeSelect label="Nguồn" value={fsrc} onChange={setFsrc} options={[["all", "Mọi nguồn"], "Trực tuyến", "Ngoại tuyến", "Legacy", "Liên kết từ cookie", "Preference Center"]} />
          <NativeSelect label="Property" value={fp} onChange={setFp} options={[["all", "Mọi property"], ...properties.map((p) => [p, p] as [string, string])]} />
        </div>
        <DataTable columns={cols} data={data} onRowClick={(r) => nav(`/records/${r.subject}`)} pageSize={15} empty="Không có sự kiện consent nào khớp với điều kiện tra cứu. (MSG-36-01)" />
      </Section>
    </>
  )
}
