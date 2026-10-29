/** P2: Import kế thừa (UC-09), Người dùng & phân quyền (UC-08), Nhật ký kiểm toán (UC-39) */
import * as React from "react"
import { Upload, UserPlus, Lock, Search } from "lucide-react"
import { PageHeader, Section, StatusBadge, NativeSelect, Note, Mono, Pill, Kpi, FormField, KV } from "@/components/cmp/kit"
import { DataTable, type Col } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DEMO_USERS, useCan, useStore } from "@/lib/store"
import { APPROVABLE, MODULES, ROLES, ROLE_DESC, lockedCell, type Act } from "@/lib/perm"
import type { AuditEntry, ImportBatch, Role, User } from "@/lib/types"
import { fmtDT, fmtN } from "@/lib/fmt"
import { msg, useUi } from "@/components/cmp/approval"
import { cn } from "@/lib/utils"

/* ------------------------------ Import kế thừa ------------------------------ */
export function ImportPage() {
  const imports = useStore((s) => s.imports)
  const can = useCan()
  const create = useStore((s) => s.createImport)
  const [sel, setSel] = React.useState<string | null>(imports.find((b) => b.status === "Chờ duyệt")?.id || null)
  const cur = imports.find((b) => b.id === sel)
  return (
    <>
      <PageHeader title="Import kế thừa" crumbs={[["Vận hành"]]} desc="Nhập consent thu thập trước khi dùng CMP. Bản ghi mang nhãn Legacy, ngày đồng ý gốc; không ghi đè sự kiện mới hơn; không ghi dữ liệu nào trước khi DPO xác nhận lô (BR-UC09-01..05)."
        actions={can("import", "edit") ? <Button onClick={() => { const id = create("consent-zalo-2025.csv"); setSel(id); msg("Đã tải lô và chạy kiểm tra tự động (mô phỏng).") }}><Upload /> Tải lô mới</Button> : undefined} />
      <Section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          {imports.map((b) => (
            <button key={b.id} onClick={() => setSel(b.id)} className={cn("rounded-lg border bg-card p-3 text-left hover:bg-muted/40", sel === b.id && "border-primary ring-2 ring-primary/20")}>
              <div className="flex items-center justify-between"><Mono className="font-semibold">{b.id}</Mono><StatusBadge s={b.status} /></div>
              <div className="mt-1 text-sm">{b.file}</div>
              <div className="text-xs text-muted-foreground">{fmtN(b.rows)} dòng · {b.by} · {fmtDT(b.at)}</div>
            </button>
          ))}
        </div>
        {cur ? <ImportDetail b={cur} /> : <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Chọn một lô để xem kết quả kiểm tra.</CardContent></Card>}
      </Section>
    </>
  )
}
function ImportDetail({ b }: { b: ImportBatch }) {
  const can = useCan()
  const setD = useStore((s) => s.setRiskDecision)
  const submit = useStore((s) => s.submitImport)
  const openAp = useUi((s) => s.openAp)
  const isDpo = can("import", "approve")
  const steps = ["Tải tệp", "Ánh xạ cột", "Kiểm tra", "DPO xác nhận", "Ghi vào hệ thống"]
  const at = { "Nháp": 2, "Bị trả lại": 2, "Đang kiểm tra": 2, "Chờ duyệt": 3, "Đã ghi": 5 }[b.status]
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">{steps.map((s, i) => <div key={s} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", i < at ? "border-success/30 bg-success/10 text-success" : i === at ? "border-primary bg-primary/10 font-semibold text-primary" : "text-muted-foreground")}><span>{i + 1}</span>{s}</div>)}</div>
      {b.retNote && <Note tone="err">Lý do trả lại: {b.retNote}</Note>}
      <div className="grid gap-3 sm:grid-cols-4"><Kpi label="Tổng dòng" value={fmtN(b.rows)} /><Kpi label="Hợp lệ" value={fmtN(b.ok)} tone="ok" /><Kpi label="Lỗi" value={fmtN(b.err)} tone="err" sub="Đưa vào báo cáo, không dừng cả lô" /><Kpi label="Rủi ro" value={fmtN(b.risk)} tone="warn" sub="Thiếu bằng chứng" /></div>
      <Card className="gap-2 py-4">
        <CardHeader><CardTitle className="text-sm">Ánh xạ cột (SCR-09-01)</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">{[["ma_kh", "Mã khách hàng → băm SHA-256 kèm salt (BR-UC09-06)"], ["consent", "consent_code"], ["ngay_dong_y", "Ngày đồng ý gốc (không dùng ngày nạp)"], ["kenh", "Kênh"], ["bang_chung", "Tham chiếu bằng chứng gốc"], ["phien_ban", "Phiên bản thông báo (nếu có)"]].map(([a, c]) => <div key={a} className="flex items-center gap-2"><Mono className="rounded bg-muted px-1.5">{a}</Mono>→<span>{c}</span></div>)}</CardContent>
      </Card>
      <Card className="gap-2 py-4">
        <CardHeader><CardTitle className="text-sm">Dòng rủi ro – DPO quyết định Giữ hoặc Xin lại (BR-UC09-04)</CardTitle><CardDescription>{isDpo ? "Không dòng rủi ro nào được ghi mà chưa có quyết định." : "Chỉ người có quyền Phê duyệt nhóm Import quyết định."}</CardDescription></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Dòng</TableHead><TableHead>Khách hàng</TableHead><TableHead>Consent</TableHead><TableHead>Ngày gốc</TableHead><TableHead>Vấn đề</TableHead><TableHead>Quyết định</TableHead></TableRow></TableHeader>
            <TableBody>{b.riskRows.map((r) => <TableRow key={r.row}><TableCell>{r.row}</TableCell><TableCell><Mono>{r.subject}</Mono></TableCell><TableCell><Mono>{r.consent}</Mono></TableCell><TableCell className="font-mono text-xs">{r.date}</TableCell><TableCell className="text-sm">{r.issue}</TableCell>
              <TableCell>{isDpo && b.status === "Chờ duyệt" ? <NativeSelect label={"Quyết định dòng " + r.row} value={r.decision || ""} onChange={(v) => setD(b.id, r.row, v as "Giữ" | "Xin lại")} options={[["", "— Chọn —"], "Giữ", "Xin lại"]} /> : r.decision ? <Pill tone={r.decision === "Giữ" ? "ok" : "warn"}>{r.decision}</Pill> : <span className="text-xs text-muted-foreground">Chưa quyết định</span>}</TableCell></TableRow>)}
              {!b.riskRows.length && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Không có dòng rủi ro.</TableCell></TableRow>}</TableBody></Table>
          {b.errRows.length > 0 && <div className="mt-3 text-xs text-muted-foreground">Dòng lỗi: {b.errRows.map((e) => `dòng ${e.row} – ${e.issue}`).join("; ")}</div>}
        </CardContent>
      </Card>
      <div className="flex flex-wrap justify-end gap-2">
        {can("import", "edit") && ["Nháp", "Bị trả lại"].includes(b.status) && <Button onClick={() => { submit(b.id); msg(`Đã gửi duyệt lô ${b.id}. DPO sẽ nhận được thông báo. (MSG-C-02)`) }}>Gửi DPO xác nhận ghi lô</Button>}
        {b.status === "Chờ duyệt" && <Button onClick={() => openAp("import:" + b.id)}>Mở đề nghị duyệt</Button>}
      </div>
      <Note>Một số nguồn cho rằng đồng ý hợp lệ theo NĐ 13/2023/NĐ-CP tiếp tục có hiệu lực [KC]; pháp chế xác nhận trước khi xin lại hàng loạt (SRS mục 9.1).</Note>
    </div>
  )
}

/* ------------------------------ Người dùng & phân quyền ------------------------------ */
export function UsersPage() {
  const memberships = useStore((s) => s.memberships)
  const tenantId = useStore((s) => s.currentTenantId)
  const tenant = useStore((s) => s.tenants.find((t) => t.id === s.currentTenantId))
  const users = React.useMemo<User[]>(() => memberships.filter((m) => m.tenantId === tenantId).map((m, i) => ({ id: i + 1, name: DEMO_USERS[m.userId]?.name || m.userId, email: DEMO_USERS[m.userId]?.email || "—", roles: m.roles, dept: "Demo", scope: tenant?.name || "Tenant", status: m.status === "ACTIVE" ? "Hoạt động" : "Ngừng", last: "2026-10-28T01:05:00Z" })), [memberships, tenantId, tenant])
  const perm = useStore((s) => s.perm)
  const setPerm = useStore((s) => s.setPerm)
  const role = useStore((s) => s.role)
  const can = useCan()
  const [tab, setTab] = React.useState("users")
  const [inv, setInv] = React.useState(false)
  const ed = can("users", "edit")
  const cols: Col<User>[] = [
    { accessorKey: "name", header: "Họ tên", cell: ({ row }) => <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">{row.original.name.split(" ").slice(-2).map((x) => x[0]).join("")}</span><div><div className="font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.email}</div></div></div> },
    { id: "roles", header: "Vai trò", cell: ({ row }) => <div className="flex gap-1">{row.original.roles.map((r) => <Pill key={r} tone={r === "DPO" ? "info" : r === "Admin" ? "dark" : "mute"}>{r}</Pill>)}</div> },
    { accessorKey: "dept", header: "Phòng ban", cell: ({ row }) => <span className="text-sm">{row.original.dept}</span> },
    { accessorKey: "scope", header: "Phạm vi", cell: ({ row }) => <span className="text-sm">{row.original.scope}</span> },
    { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <Pill tone={row.original.status === "Hoạt động" ? "ok" : "warn"}>{row.original.status}</Pill> },
    { accessorKey: "last", header: "Đăng nhập gần nhất", cell: ({ row }) => <span className="font-mono text-xs">{fmtDT(row.original.last)}</span> },
  ]
  return (
    <>
      <PageHeader title="Người dùng & phân quyền" crumbs={[["Hệ thống"]]} desc="Ba vai trò nội bộ, đăng nhập qua SSO có MFA. Một người có thể giữ nhiều vai trò nhưng không bao giờ được phê duyệt đề nghị do chính mình gửi (BR-AP-01)."
        actions={ed && tab === "users" ? <Button onClick={() => setInv(true)}><UserPlus /> Mời người dùng</Button> : undefined} />
      <Section>
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <TabsList><TabsTrigger value="users">Người dùng ({users.length})</TabsTrigger><TabsTrigger value="perm">Ma trận phân quyền</TabsTrigger></TabsList>
          <TabsContent value="users" className="mt-4 flex flex-col gap-3">
            <div className="grid gap-3 md:grid-cols-3">{ROLES.map((r) => <Card key={r} className="gap-1 py-4"><CardHeader><CardTitle className="text-sm">{r} · {users.filter((u) => u.roles.includes(r)).length} người</CardTitle><CardDescription className="text-xs">{ROLE_DESC[r]}</CardDescription></CardHeader></Card>)}</div>
            <DataTable columns={cols} data={users} />
          </TabsContent>
          <TabsContent value="perm" className="mt-4 flex flex-col gap-3">
            {!ed && <Note tone="lock">Vai trò {role} chỉ xem ma trận. Chỉ Admin thay đổi được (UC-08).</Note>}
            <Note>Admin mặc định không có quyền Phê duyệt và được tự bật cho vai trò Admin, hiệu lực ngay (BR-UC08-09). Nhóm quản trị người dùng và phân quyền luôn thuộc Admin. Thử: bật Phê duyệt cho Admin rồi duyệt một đề nghị do chính Admin gửi để thấy quy tắc BR-AP-01.</Note>
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader><TableRow><TableHead rowSpan={2} className="align-bottom">Nhóm chức năng</TableHead>{ROLES.map((r) => <TableHead key={r} colSpan={3} className="border-l text-center">{r}</TableHead>)}</TableRow>
                  <TableRow>{ROLES.flatMap((r) => (["view", "edit", "approve"] as Act[]).map((a) => <TableHead key={r + a} className={cn("text-center text-[11px]", a === "view" && "border-l")}>{{ view: "Xem", edit: "Tạo, sửa", approve: "Phê duyệt" }[a]}</TableHead>))}</TableRow></TableHeader>
                <TableBody>{MODULES.map(([m, label]) => (
                  <TableRow key={m}><TableCell className="max-w-64 text-sm">{label}{lockedCell(m) && <Lock className="ml-1 inline size-3 text-muted-foreground" />}</TableCell>
                    {ROLES.flatMap((r) => (["view", "edit", "approve"] as Act[]).map((a) => {
                      const na = a === "approve" && !APPROVABLE.includes(m)
                      const locked = lockedCell(m) || !ed
                      return <TableCell key={r + a} className={cn("text-center", a === "view" && "border-l")}>{na ? <span className="text-muted-foreground">·</span> : <Checkbox aria-label={`${r} ${label} ${a}`} checked={perm[r as Role][m][a]} disabled={locked} onCheckedChange={(v) => { setPerm(r as Role, m, a, !!v); msg(`Đã ${v ? "bật" : "tắt"} quyền ${a === "approve" ? "Phê duyệt" : a === "edit" ? "Tạo, sửa" : "Xem"} cho ${r} · hiệu lực ngay; đã ghi nhật ký.`) }} />}</TableCell>
                    }))}</TableRow>
                ))}</TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </Section>
      {inv && (
        <Dialog open onOpenChange={(o) => !o && setInv(false)}>
          <DialogContent><DialogHeader><DialogTitle>Mời người dùng</DialogTitle><DialogDescription>Người được mời đăng nhập bằng SSO của tổ chức, bắt buộc MFA.</DialogDescription></DialogHeader>
            <FormField id="ie" label="Email công ty" req><Input id="ie" placeholder="ten@abc-retail.vn" /></FormField>
            <FormField label="Vai trò" req><NativeSelect label="Vai trò" value="Nhân viên" onChange={() => undefined} options={ROLES} className="w-full" /></FormField>
            <DialogFooter><Button variant="outline" onClick={() => setInv(false)}>Hủy</Button><Button onClick={() => { msg("Đã gửi lời mời (mô phỏng).", "info"); setInv(false) }}>Gửi lời mời</Button></DialogFooter></DialogContent>
        </Dialog>
      )}
    </>
  )
}

/* ------------------------------ Nhật ký kiểm toán ------------------------------ */
export function AuditPage() {
  const audit = useStore((s) => s.audit)
  const log = useStore((s) => s.log)
  const [q, setQ] = React.useState("")
  const [who, setWho] = React.useState("all")
  const [res, setRes] = React.useState("all")
  const [sel, setSel] = React.useState<AuditEntry | null>(null)
  const loggedView = React.useRef(false)
  React.useEffect(() => {
    if (loggedView.current) return
    loggedView.current = true
    log("Xem nhật ký", "Nhật ký kiểm toán")
  }, [log])
  const data = audit.filter((a) => (who === "all" || a.who === who) && (res === "all" || a.res === res) && (!q || (a.act + a.obj).toLowerCase().includes(q.toLowerCase())))
  const cols: Col<AuditEntry>[] = [
    { accessorKey: "at", header: "Thời điểm", cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs">{fmtDT(row.original.at, true)}</span> },
    { accessorKey: "who", header: "Người thực hiện", cell: ({ row }) => <span className="whitespace-nowrap text-sm">{row.original.who}</span> },
    { accessorKey: "role", header: "Vai trò", cell: ({ row }) => <span className="text-sm">{row.original.role}</span> },
    { accessorKey: "act", header: "Hành động", cell: ({ row }) => <span className="whitespace-nowrap text-sm font-medium">{row.original.act}</span> },
    { accessorKey: "obj", header: "Đối tượng", cell: ({ row }) => <span className="text-sm">{row.original.obj}</span> },
    { accessorKey: "res", header: "Kết quả", cell: ({ row }) => <Pill tone={row.original.res === "ok" ? "ok" : "err"}>{row.original.res === "ok" ? "Thành công" : "Thất bại, từ chối"}</Pill> },
  ]
  return (
    <>
      <PageHeader title="Nhật ký kiểm toán" crumbs={[["Hệ thống"]]} desc="Chỉ thêm; không người dùng nào (kể cả Admin) sửa hoặc xóa được; lưu trên kho chống sửa. Ghi cả truy cập thất bại và lượt xem nhật ký này (BR-UC39-01..05). Không lưu định danh thô của chủ thể." />
      <Section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative"><Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input className="h-8 w-60 pl-8" placeholder="Tìm hành động, đối tượng" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <NativeSelect label="Người" value={who} onChange={setWho} options={[["all", "Mọi người"], ...[...new Set(audit.map((a) => a.who))].map((x) => [x, x] as [string, string])]} />
          <NativeSelect label="Kết quả" value={res} onChange={setRes} options={[["all", "Mọi kết quả"], ["ok", "Thành công"], ["err", "Thất bại, từ chối"]]} />
          <span className="text-xs text-muted-foreground">Thời hạn lưu chưa chốt (câu hỏi mở 10) [KC]</span>
        </div>
        <DataTable columns={cols} data={data} pageSize={15} onRowClick={setSel} />
      </Section>
      {sel && (
        <Dialog open onOpenChange={(o) => !o && setSel(null)}>
          <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{sel.act}</DialogTitle><DialogDescription>{fmtDT(sel.at, true)} · {sel.who} ({sel.role})</DialogDescription></DialogHeader>
            <KV rows={[["Tenant ID", sel.tenantId || "Bản ghi lịch sử"], ["User ID", sel.userId || "Bản ghi lịch sử/hệ thống"], ["Đối tượng", sel.obj], ["Kết quả", sel.res === "ok" ? "Thành công" : "Thất bại, từ chối"], ["Chi tiết", sel.det || "—"], ["Giá trị trước", <span className="break-all font-mono text-xs">{sel.before || "—"}</span>], ["Giá trị sau", <span className="break-all font-mono text-xs">{sel.after || "—"}</span>]]} />
            <DialogFooter><Button variant="outline" onClick={() => setSel(null)}>Đóng</Button></DialogFooter></DialogContent>
        </Dialog>
      )}
    </>
  )
}
