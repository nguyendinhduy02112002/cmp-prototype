import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ArrowUpDown, Building2, CheckCircle2, CirclePause, Plus, Search, ShieldCheck } from "lucide-react"
import { PageHeader, Section, Kpi, Pill, Mono, FormField, NativeSelect, Empty, KV, Note } from "@/components/cmp/kit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { DataTable, type Col } from "@/components/data-table/data-table"
import type { PlatformAuditEvent } from "@/lib/platform-data"
import { usePlatformActor, usePlatformCan, usePlatformStore } from "@/lib/platform-store"
import type { Tenant } from "@/lib/types"
import { fmtDT } from "@/lib/fmt"
import { msg } from "@/components/cmp/approval"

const statusVi = (s: Tenant["status"]) => s === "ACTIVE" ? "Đang hoạt động" : "Tạm ngừng"
const auditVi: Record<PlatformAuditEvent["action"], string> = { TENANT_CREATED: "Tạo tenant", TENANT_UPDATED: "Cập nhật tenant", TENANT_ACTIVATED: "Kích hoạt tenant", TENANT_SUSPENDED: "Tạm ngừng tenant" }

export function PlatformDashboardPage() {
  const tenants = usePlatformStore((s) => s.tenants); const audit = usePlatformStore((s) => s.audit)
  const active = tenants.filter((t) => t.status === "ACTIVE").length; const suspended = tenants.length - active
  const chart = [{ status: "Hoạt động", tenants: active }, { status: "Tạm ngừng", tenants: suspended }]
  const cfg = { tenants: { label: "Tenant", color: "var(--chart-1)" } } satisfies ChartConfig
  const recent = [...tenants].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5)
  return <><PageHeader title="Tổng quan nền tảng" crumbs={[["Platform Administration"]]} desc="Thống kê từ tenant registry. Không hiển thị consent, evidence hoặc dữ liệu cá nhân của tenant." />
    <Section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Tổng tenant" value={tenants.length} icon={<Building2 />} /><Kpi label="Đang hoạt động" value={active} tone="ok" icon={<CheckCircle2 />} /><Kpi label="Tạm ngừng" value={suspended} tone="warn" icon={<CirclePause />} /><Kpi label="Mới tạo gần đây" value={recent.length} sub="Tối đa 5 tenant" icon={<ShieldCheck />} /></Section>
    <Section className="grid gap-4 xl:grid-cols-2"><Card><CardHeader><CardTitle>Phân bố theo trạng thái</CardTitle><CardDescription>Cùng nguồn tenant registry với Directory.</CardDescription></CardHeader><CardContent><ChartContainer config={cfg} className="h-64 w-full"><BarChart data={chart}><CartesianGrid vertical={false} /><XAxis dataKey="status" /><YAxis allowDecimals={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="tenants" fill="var(--color-tenants)" radius={6} /></BarChart></ChartContainer></CardContent></Card>
      <Card><CardHeader><CardTitle>Hoạt động quản trị gần đây</CardTitle><CardDescription>Platform audit tách khỏi tenant audit.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{audit.slice(0, 6).map((e) => <div key={e.id} className="flex items-start justify-between gap-3 border-b pb-2 text-sm last:border-0"><div><div className="font-medium">{auditVi[e.action]}</div><div className="text-xs text-muted-foreground">{e.actorName} · <Mono>{e.targetTenantId || "platform"}</Mono></div></div><span className="whitespace-nowrap text-xs text-muted-foreground">{fmtDT(e.at, true)}</span></div>)}{!audit.length && <Empty>Chưa có hoạt động quản trị nền tảng.</Empty>}</CardContent></Card></Section>
    <Section><Card><CardHeader><CardTitle>Tenant mới tạo</CardTitle></CardHeader><CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{recent.map((t) => <div key={t.id} className="rounded-lg border p-3"><div className="flex justify-between gap-2"><span className="font-medium">{t.name}</span><Pill tone={t.status === "ACTIVE" ? "ok" : "warn"}>{statusVi(t.status)}</Pill></div><Mono>{t.code}</Mono><div className="mt-1 text-xs text-muted-foreground">{t.createdAt ? fmtDT(t.createdAt, true) : "Dữ liệu seed"}</div></div>)}</CardContent></Card></Section></>
}

type TenantForm = { name: string; code: string; description: string; contactEmail: string; initialAdminName: string; initialAdminEmail: string; initialAdminPassword: string }
const emptyForm: TenantForm = { name: "", code: "", description: "", contactEmail: "", initialAdminName: "", initialAdminEmail: "", initialAdminPassword: "" }

export function TenantDirectoryPage() {
  const tenants = usePlatformStore((s) => s.tenants); const createTenant = usePlatformStore((s) => s.createTenant); const updateTenant = usePlatformStore((s) => s.updateTenant); const setStatus = usePlatformStore((s) => s.setTenantStatus)
  const canCreate = usePlatformCan("tenants.create"); const canEdit = usePlatformCan("tenants.edit"); const canStatus = usePlatformCan("tenants.status")
  const [q, setQ] = React.useState(""); const [status, setFilter] = React.useState("ALL"); const [selected, setSelected] = React.useState<Tenant | null>(null); const [creating, setCreating] = React.useState(false); const [editing, setEditing] = React.useState(false); const [confirming, setConfirming] = React.useState(false)
  const [form, setForm] = React.useState<TenantForm>(emptyForm); const [errors, setErrors] = React.useState<Partial<Record<keyof TenantForm, string>>>({}); const [busy, startTransition] = React.useTransition()
  const data = tenants.filter((t) => (status === "ALL" || t.status === status) && (!q || `${t.id} ${t.name} ${t.code}`.toLowerCase().includes(q.toLowerCase())))
  const sortHeader = (label: string) => ({ column }: { column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) => <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>{label}<ArrowUpDown className="size-3" /></button>
  const cols: Col<Tenant>[] = [
    { accessorKey: "id", header: sortHeader("Tenant ID"), cell: ({ row }) => <Mono>{row.original.id}</Mono> },
    { accessorKey: "name", header: sortHeader("Tổ chức"), cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "code", header: sortHeader("Mã tenant"), cell: ({ row }) => <Mono>{row.original.code}</Mono> },
    { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <Pill tone={row.original.status === "ACTIVE" ? "ok" : "warn"}>{statusVi(row.original.status)}</Pill> },
    { accessorKey: "createdAt", header: sortHeader("Ngày tạo"), cell: ({ row }) => <span className="whitespace-nowrap text-xs">{row.original.createdAt ? fmtDT(row.original.createdAt, true) : "—"}</span> },
    { accessorKey: "updatedAt", header: sortHeader("Cập nhật"), cell: ({ row }) => <span className="whitespace-nowrap text-xs">{row.original.updatedAt ? fmtDT(row.original.updatedAt, true) : "—"}</span> },
  ]
  const openCreate = () => { setForm(emptyForm); setErrors({}); setCreating(true) }
  const openEdit = () => { if (!selected) return; setForm({ ...emptyForm, name: selected.name, code: selected.code, description: selected.description || "", contactEmail: selected.contactEmail || "" }); setEditing(true) }
  const submitCreate = () => startTransition(() => { const r = createTenant(form); if (!r.ok) { setErrors(r.errors || {}); msg(r.msg, "error"); return } setCreating(false); setErrors({}); setForm((f) => ({ ...f, initialAdminPassword: "" })); msg(r.msg, "success") })
  const submitEdit = () => selected && startTransition(() => { const r = updateTenant(selected.id, form); if (!r.ok) { msg(r.msg, "error"); return } setEditing(false); setSelected(usePlatformStore.getState().tenants.find((t) => t.id === selected.id) || null); msg(r.msg, "success") })
  const changeStatus = () => selected && startTransition(() => { const next = selected.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"; const r = setStatus(selected.id, next); setConfirming(false); setSelected(usePlatformStore.getState().tenants.find((t) => t.id === selected.id) || null); msg(r.msg, r.ok ? "success" : "error") })
  return <><PageHeader title="Danh mục tổ chức" crumbs={[["Platform Administration", "/platform"]]} desc="Quản lý vòng đời tổ chức SaaS; không truy cập dữ liệu nghiệp vụ tenant." actions={canCreate ? <Button onClick={openCreate}><Plus /> Tạo tenant</Button> : undefined} />
    <Section className="flex flex-col gap-3"><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" /><Input aria-label="Tìm tenant" className="h-8 w-72 pl-8" placeholder="Tên, mã hoặc Tenant ID" value={q} onChange={(e) => setQ(e.target.value)} /></div><NativeSelect label="Lọc trạng thái" value={status} onChange={setFilter} options={[["ALL", "Mọi trạng thái"], ["ACTIVE", "Đang hoạt động"], ["SUSPENDED", "Tạm ngừng"]]} /></div>
      <DataTable columns={cols} data={data} pageSize={8} onRowClick={setSelected} empty="Không có tenant khớp bộ lọc." /></Section>
    <TenantFormDialog title="Tạo tenant" desc="Tạo workspace rỗng và một tài khoản Tenant Admin ban đầu. Tài khoản Platform không được thêm vào Tenant." open={creating} onClose={() => setCreating(false)} form={form} setForm={setForm} errors={errors} busy={busy} submit={submitCreate} showCode />
    <TenantFormDialog title="Chỉnh sửa tenant" desc="Mã tenant là định danh bất biến trong prototype." open={editing} onClose={() => setEditing(false)} form={form} setForm={setForm} errors={{}} busy={busy} submit={submitEdit} />
    {selected && !editing && !confirming && <Dialog open onOpenChange={(o) => !o && setSelected(null)}><DialogContent><DialogHeader><DialogTitle>{selected.name}</DialogTitle><DialogDescription>Thông tin tenant ở platform scope.</DialogDescription></DialogHeader><KV rows={[["Tenant ID", <Mono>{selected.id}</Mono>], ["Mã tenant", <Mono>{selected.code}</Mono>], ["Trạng thái", <Pill tone={selected.status === "ACTIVE" ? "ok" : "warn"}>{statusVi(selected.status)}</Pill>], ["Mô tả", selected.description || "—"], ["Email liên hệ", selected.contactEmail || "—"], ["Ngày tạo", selected.createdAt ? fmtDT(selected.createdAt, true) : "—"], ["Cập nhật", selected.updatedAt ? fmtDT(selected.updatedAt, true) : "—"]]} /><Note>Platform role không cấp membership hoặc quyền xem dữ liệu tenant này.</Note><DialogFooter>{canEdit && <Button variant="outline" onClick={openEdit}>Chỉnh sửa</Button>}{canStatus && <Button variant={selected.status === "ACTIVE" ? "destructive" : "default"} onClick={() => setConfirming(true)}>{selected.status === "ACTIVE" ? "Tạm ngừng" : "Kích hoạt"}</Button>}</DialogFooter></DialogContent></Dialog>}
    {selected && confirming && <Dialog open onOpenChange={(o) => !o && setConfirming(false)}><DialogContent><DialogHeader><DialogTitle>{selected.status === "ACTIVE" ? "Tạm ngừng tenant?" : "Kích hoạt tenant?"}</DialogTitle><DialogDescription>{selected.status === "ACTIVE" ? "Tenant sẽ bị chặn khỏi Tenant Workspace. Mọi dữ liệu hiện có được bảo toàn." : "Membership hợp lệ có thể truy cập lại Tenant Workspace."}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirming(false)}>Hủy</Button><Button variant={selected.status === "ACTIVE" ? "destructive" : "default"} disabled={busy} onClick={changeStatus}>Xác nhận</Button></DialogFooter></DialogContent></Dialog>}
  </>
}

function TenantFormDialog({ title, desc, open, onClose, form, setForm, errors, busy, submit, showCode }: { title: string; desc: string; open: boolean; onClose: () => void; form: TenantForm; setForm: React.Dispatch<React.SetStateAction<TenantForm>>; errors: Partial<Record<keyof TenantForm, string>>; busy: boolean; submit: () => void; showCode?: boolean }) {
  if (!open) return null
  const field = (key: keyof TenantForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{desc}</DialogDescription></DialogHeader><div className="grid gap-4"><FormField id="tenant-name" label="Tên tổ chức" req error={errors.name}><Input id="tenant-name" value={form.name} onChange={field("name")} /></FormField>{showCode && <FormField id="tenant-code" label="Mã tenant" req error={errors.code} hint="Ví dụ: ACME-VN"><Input id="tenant-code" value={form.code} onChange={field("code")} className="uppercase" /></FormField>}<FormField id="tenant-desc" label="Mô tả"><Textarea id="tenant-desc" value={form.description} onChange={field("description")} /></FormField><FormField id="tenant-email" label="Email liên hệ"><Input id="tenant-email" type="email" value={form.contactEmail} onChange={field("contactEmail")} /></FormField>{showCode && <><div className="border-t pt-4 text-sm font-semibold">Tài khoản Tenant Admin đầu tiên</div><FormField id="admin-name" label="Họ tên" req error={errors.initialAdminName}><Input id="admin-name" value={form.initialAdminName} onChange={field("initialAdminName")} /></FormField><FormField id="admin-email" label="Email đăng nhập" req error={errors.initialAdminEmail}><Input id="admin-email" type="email" value={form.initialAdminEmail} onChange={field("initialAdminEmail")} /></FormField><FormField id="admin-password" label="Mật khẩu khởi tạo" req error={errors.initialAdminPassword} hint="Tối thiểu 8 ký tự. Prototype lưu thông tin đăng nhập trong trình duyệt."><Input id="admin-password" type="password" value={form.initialAdminPassword} onChange={field("initialAdminPassword")} /></FormField></>}</div><DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button disabled={busy} onClick={submit}>{busy ? "Đang lưu…" : "Lưu"}</Button></DialogFooter></DialogContent></Dialog>
}

export function PlatformAuditPage() {
  const events = usePlatformStore((s) => s.audit); const actor = usePlatformActor()
  const cols: Col<PlatformAuditEvent>[] = [
    { accessorKey: "at", header: "Thời điểm", cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs">{fmtDT(row.original.at, true)}</span> },
    { accessorKey: "actorName", header: "Người thực hiện", cell: ({ row }) => <div><div>{row.original.actorName}</div><Mono>{row.original.actorId}</Mono></div> },
    { accessorKey: "role", header: "Platform role" }, { accessorKey: "action", header: "Hành động", cell: ({ row }) => auditVi[row.original.action] },
    { accessorKey: "targetTenantId", header: "Tenant đích", cell: ({ row }) => <Mono>{row.original.targetTenantId || "—"}</Mono> },
    { id: "metadata", header: "Metadata", cell: ({ row }) => <span className="text-xs">{Object.entries(row.original.metadata).map(([k, v]) => `${k}=${v}`).join(" · ")}</span> },
  ]
  return <><PageHeader title="Nhật ký nền tảng" crumbs={[["Platform Administration", "/platform"]]} desc="Ledger riêng cho tenant lifecycle; không trộn với tenant audit và không chứa dữ liệu cá nhân của chủ thể consent." /><Section>{events.length ? <DataTable columns={cols} data={events} pageSize={10} /> : <Empty>Chưa có sự kiện platform audit.</Empty>}<div className="mt-3 text-xs text-muted-foreground">Đang xem với {actor?.role}. Platform Viewer không có quyền xem ledger này.</div></Section></>
}
