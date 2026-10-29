import * as React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowUpDown, Pencil, Plus, Search } from "lucide-react"
import { PageHeader, Section, Empty, FormField, KV, Mono, NativeSelect, Note, Pill } from "@/components/cmp/kit"
import { DataTable, type Col } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { msg } from "@/components/cmp/approval"
import { useCan, useStore } from "@/lib/store"
import type { TenantApplication } from "@/lib/types"
import type { ApplicationErrors, ApplicationInput } from "@/lib/application-data"
import { fmtDT } from "@/lib/fmt"
import { ApplicationProperties } from "@/app/properties"

const typeLabel: Record<TenantApplication["type"], string> = { WEB: "Web", SYSTEM: "Hệ thống", MOBILE: "Mobile" }
const statusLabel = (status: TenantApplication["status"]) => status === "ACTIVE" ? "Active" : "Inactive"
const blank = (): ApplicationInput => ({ name: "", code: "", type: "WEB", description: "" })

export default function ApplicationsPage() {
  const apps = useStore((s) => s.applications); const properties = useStore((s) => s.properties); const tenantId = useStore((s) => s.currentTenantId)
  const create = useStore((s) => s.createApplication); const can = useCan(); const nav = useNavigate()
  const [q, setQ] = React.useState(""); const [type, setType] = React.useState("ALL"); const [status, setStatus] = React.useState("ALL"); const [open, setOpen] = React.useState(false)
  const data = apps.filter((a) => (type === "ALL" || a.type === type) && (status === "ALL" || a.status === status) && (!q || `${a.name} ${a.code} ${a.property}`.toLowerCase().includes(q.toLowerCase())))
  const sortHeader = (label: string) => ({ column }: { column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) => <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>{label}<ArrowUpDown className="size-3" /></button>
  const cols: Col<TenantApplication>[] = [
    { accessorKey: "name", header: sortHeader("Ứng dụng"), cell: ({ row }) => <div><div className="font-medium">{row.original.name}</div><Mono>{row.original.id}</Mono></div> },
    { accessorKey: "code", header: sortHeader("Mã"), cell: ({ row }) => <Mono>{row.original.code}</Mono> },
    { accessorKey: "type", header: "Loại", cell: ({ row }) => typeLabel[row.original.type] },
    { id: "properties", header: "Properties", cell: ({ row }) => properties.filter((p) => p.applicationId === row.original.id).length },
    { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <Pill tone={row.original.status === "ACTIVE" ? "ok" : "mute"}>{statusLabel(row.original.status)}</Pill> },
    { accessorKey: "createdAt", header: sortHeader("Ngày tạo"), cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtDT(row.original.createdAt, true)}</span> },
    { accessorKey: "updatedAt", header: sortHeader("Cập nhật"), cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtDT(row.original.updatedAt, true)}</span> },
  ]
  return <><PageHeader title="Danh mục ứng dụng" crumbs={[["Hệ thống"]]} desc="Đăng ký và quản lý Application thuộc tenant hiện tại. Cấu hình kỹ thuật, assignment và SDK được triển khai ở các mốc MT-3/MT-4 tiếp theo." actions={can("integ", "edit") ? <Button onClick={() => setOpen(true)}><Plus /> Đăng ký ứng dụng</Button> : undefined} />
    <Section className="flex flex-col gap-3"><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" /><Input aria-label="Tìm ứng dụng" className="h-8 w-72 pl-8" placeholder="Tên, mã hoặc Property" value={q} onChange={(e) => setQ(e.target.value)} /></div><NativeSelect label="Lọc loại" value={type} onChange={setType} options={[["ALL", "Mọi loại"], ["WEB", "Web"], ["SYSTEM", "Hệ thống"], ["MOBILE", "Mobile"]]} /><NativeSelect label="Lọc trạng thái" value={status} onChange={setStatus} options={[["ALL", "Mọi trạng thái"], ["ACTIVE", "Active"], ["INACTIVE", "Inactive"]]} /></div>
      {apps.length ? <DataTable columns={cols} data={data} pageSize={8} onRowClick={(a) => nav(`/applications/${a.id}`)} empty="Không có ứng dụng khớp bộ lọc." /> : <Empty>Chưa có ứng dụng nào được đăng ký.{can("integ", "edit") && <div className="mt-3"><Button onClick={() => setOpen(true)}><Plus /> Đăng ký ứng dụng</Button></div>}</Empty>}</Section>
    <ApplicationFormDialog key={open ? "create-open" : "create-closed"} open={open} title="Đăng ký ứng dụng" description="Ứng dụng mới được tạo ở trạng thái Inactive và chưa tự động có Property." initial={blank()} onClose={() => setOpen(false)} onSubmit={(input, capturedTenantId) => {
      const r = create(input, capturedTenantId); if (!r.ok) return r
      setOpen(false); msg(r.msg, "success"); nav(`/applications/${r.applicationId}`); return r
    }} tenantId={tenantId || ""} />
  </>
}

export function ApplicationDetailPage() {
  const { applicationId = "" } = useParams(); const app = useStore((s) => s.applications.find((a) => a.id === applicationId)); const properties = useStore((s) => s.properties); const tenantId = useStore((s) => s.currentTenantId)
  const update = useStore((s) => s.updateApplication); const setStatus = useStore((s) => s.setApplicationStatus); const can = useCan(); const [editing, setEditing] = React.useState(false); const [confirm, setConfirm] = React.useState(false)
  if (!app) return <><PageHeader title="Không tìm thấy ứng dụng" crumbs={[["Ứng dụng", "/applications"]]} desc="Ứng dụng không tồn tại trong tenant hiện tại hoặc bạn đang dùng ID của tenant khác." /><Section><Note tone="err">Không thể mở Application ngoài active tenant.</Note></Section></>
  const initial: ApplicationInput = { name: app.name, code: app.code, type: app.type, description: app.description || "" }
  const appProperties = properties.filter((p) => p.applicationId === app.id)
  return <><PageHeader title={app.name} crumbs={[["Ứng dụng", "/applications"]]} desc={<span><Mono>{app.id}</Mono> · <Mono>{app.code}</Mono> · {appProperties.length} Property</span>} actions={can("integ", "edit") ? <><Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Chỉnh sửa</Button><Button variant={app.status === "ACTIVE" ? "destructive" : "default"} onClick={() => setConfirm(true)}>{app.status === "ACTIVE" ? "Chuyển Inactive" : "Kích hoạt"}</Button></> : undefined} />
    <Section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><Card><CardHeader><CardTitle>Tổng quan</CardTitle><CardDescription>Danh tính và metadata tenant-scoped của Application.</CardDescription></CardHeader><CardContent><KV rows={[["Application ID", <Mono>{app.id}</Mono>], ["Tên", app.name], ["Mã", <Mono>{app.code}</Mono>], ["Loại", typeLabel[app.type]], ["Số Property", appProperties.length], ["Trạng thái", <Pill tone={app.status === "ACTIVE" ? "ok" : "mute"}>{statusLabel(app.status)}</Pill>], ["Mô tả", app.description || "—"], ["Ngày tạo", fmtDT(app.createdAt, true)], ["Người tạo", <Mono>{app.createdBy}</Mono>], ["Cập nhật", fmtDT(app.updatedAt, true)], ["Người cập nhật", app.updatedBy ? <Mono>{app.updatedBy}</Mono> : "—"]]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Các bước tích hợp tiếp theo</CardTitle><CardDescription>Property Management nằm ngay bên dưới; các chức năng sau vẫn được hoãn.</CardDescription></CardHeader><CardContent className="flex flex-col gap-2 text-sm"><Note>Consent và Banner assignment: MT-3.3</Note><Note>Configuration Publishing: MT-3.4</Note><Note>SDK và cài đặt: MT-4</Note><Link className="text-primary underline underline-offset-2" to="/integrations">Xem event và integration hub hiện có</Link></CardContent></Card></Section>
    <ApplicationProperties application={app} />
    <ApplicationFormDialog key={editing ? `edit-${app.id}-open` : `edit-${app.id}-closed`} open={editing} title="Chỉnh sửa ứng dụng" description="Application ID và tenant ownership không thay đổi." initial={initial} onClose={() => setEditing(false)} onSubmit={(input, capturedTenantId) => { const r = update(app.id, input, capturedTenantId); if (r.ok) { setEditing(false); msg(r.msg, "success") }; return r }} tenantId={tenantId || ""} />
    {confirm && <Dialog open onOpenChange={(o) => !o && setConfirm(false)}><DialogContent><DialogHeader><DialogTitle>{app.status === "ACTIVE" ? "Chuyển ứng dụng sang Inactive?" : "Kích hoạt ứng dụng?"}</DialogTitle><DialogDescription>{app.status === "ACTIVE" ? "Dữ liệu, quan hệ, consent records và audit được giữ nguyên." : "MT-3.1 chỉ cập nhật trạng thái quản trị; kiểm tra cấu hình runtime được hoãn tới MT-3.4/MT-4."}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirm(false)}>Hủy</Button><Button variant={app.status === "ACTIVE" ? "destructive" : "default"} onClick={() => { const r = setStatus(app.id, app.status === "ACTIVE" ? "INACTIVE" : "ACTIVE", tenantId || ""); setConfirm(false); msg(r.msg, r.ok ? "success" : "error") }}>Xác nhận</Button></DialogFooter></DialogContent></Dialog>}
  </>
}

function ApplicationFormDialog({ open, title, description, initial, tenantId, onClose, onSubmit }: { open: boolean; title: string; description: string; initial: ApplicationInput; tenantId: string; onClose: () => void; onSubmit: (input: ApplicationInput, capturedTenantId: string) => { ok: boolean; msg: string; errors?: ApplicationErrors } }) {
  const [form, setForm] = React.useState(initial); const [errors, setErrors] = React.useState<ApplicationErrors>({}); const capturedTenantId = React.useRef(tenantId)
  if (!open) return null
  const submit = () => { const r = onSubmit(form, capturedTenantId.current); if (!r.ok) { setErrors(r.errors || {}); msg(r.msg, "error") } }
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="grid gap-4"><FormField id="app-name" label="Tên ứng dụng" req error={errors.name}><Input id="app-name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField><FormField id="app-code" label="Mã ứng dụng" req error={errors.code} hint="Ví dụ: RETAIL-WEB"><Input id="app-code" maxLength={50} className="uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField><FormField id="app-type" label="Loại" req error={errors.type}><NativeSelect id="app-type" label="Loại ứng dụng" value={form.type} onChange={(v) => setForm({ ...form, type: v as TenantApplication["type"] })} options={[["WEB", "Web"], ["SYSTEM", "Hệ thống"], ["MOBILE", "Mobile"]]} /></FormField><FormField id="app-description" label="Mô tả" error={errors.description} hint={`${(form.description || "").length}/500`}><Textarea id="app-description" maxLength={500} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField></div><DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={submit}>Lưu</Button></DialogFooter></DialogContent></Dialog>
}
