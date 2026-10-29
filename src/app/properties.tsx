import * as React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Copy, Pencil, Play, Plus, Rocket, Search } from "lucide-react"
import { DataTable, type Col } from "@/components/data-table/data-table"
import { Empty, FormField, KV, Mono, NativeSelect, Note, PageHeader, Pill, Section } from "@/components/cmp/kit"
import { msg } from "@/components/cmp/approval"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { fmtDT } from "@/lib/fmt"
import { propertyTechnicalId, type PropertyErrors, type PropertyInput } from "@/lib/property-data"
import { useCan, useStore } from "@/lib/store"
import type { TenantApplication, TenantProperty } from "@/lib/types"

const typeLabel: Record<TenantProperty["type"], string> = { WEB: "Website", ANDROID: "Android", IOS: "iOS" }
const blank = (): PropertyInput => ({ name: "", code: "", type: "WEB", origin: "", packageName: "", bundleId: "", description: "" })
const inputOf = (p: TenantProperty): PropertyInput => ({ name: p.name, code: p.code, type: p.type, origin: p.origin || "", packageName: p.packageName || "", bundleId: p.bundleId || "", description: p.description || "" })

export function ApplicationProperties({ application }: { application: TenantApplication }) {
  const properties = useStore((s) => s.properties)
  const tenantId = useStore((s) => s.currentTenantId) || ""
  const create = useStore((s) => s.createProperty)
  const can = useCan(); const nav = useNavigate()
  const [q, setQ] = React.useState(""); const [type, setType] = React.useState("ALL"); const [status, setStatus] = React.useState("ALL"); const [open, setOpen] = React.useState(false)
  const rows = React.useMemo(() => properties.filter((p) => p.applicationId === application.id && (type === "ALL" || p.type === type) && (status === "ALL" || p.status === status) && (!q || `${p.name} ${p.code} ${propertyTechnicalId(p)}`.toLowerCase().includes(q.toLowerCase()))), [properties, application.id, q, type, status])
  const all = React.useMemo(() => properties.filter((p) => p.applicationId === application.id), [properties, application.id])
  const cols: Col<TenantProperty>[] = [
    { accessorKey: "name", header: "Property", cell: ({ row }) => <div><div className="font-medium">{row.original.name}</div><Mono>{row.original.id}</Mono></div> },
    { accessorKey: "code", header: "Mã", cell: ({ row }) => <Mono>{row.original.code}</Mono> },
    { accessorKey: "type", header: "Loại", cell: ({ row }) => typeLabel[row.original.type] },
    { id: "technical", header: "Định danh kỹ thuật", cell: ({ row }) => <Mono>{propertyTechnicalId(row.original)}</Mono> },
    { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <Pill tone={row.original.status === "ACTIVE" ? "ok" : "mute"}>{row.original.status === "ACTIVE" ? "Active" : "Inactive"}</Pill> },
    { accessorKey: "updatedAt", header: "Cập nhật", cell: ({ row }) => <span className="text-xs">{fmtDT(row.original.updatedAt, true)}</span> },
  ]
  const editable = can("integ", "edit")
  return <Section className="flex flex-col gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Properties</h2><p className="text-sm text-muted-foreground">Các kênh số thuộc riêng Application này.</p></div>{editable && <Button disabled={application.status !== "ACTIVE"} onClick={() => setOpen(true)}><Plus /> Tạo Property</Button>}</div>
    {application.status !== "ACTIVE" && <Note>Application đang Inactive. Có thể xem dữ liệu lịch sử nhưng không thể tạo Property mới.</Note>}
    {all.length ? <><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" /><Input className="h-8 w-72 pl-8" aria-label="Tìm Property" placeholder="Tên, mã hoặc định danh kỹ thuật" value={q} onChange={(e) => setQ(e.target.value)} /></div><NativeSelect label="Lọc loại Property" value={type} onChange={setType} options={[["ALL", "Mọi loại"], ["WEB", "Website"], ["ANDROID", "Android"], ["IOS", "iOS"]]} /><NativeSelect label="Lọc trạng thái Property" value={status} onChange={setStatus} options={[["ALL", "Mọi trạng thái"], ["ACTIVE", "Active"], ["INACTIVE", "Inactive"]]} /></div><DataTable columns={cols} data={rows} pageSize={8} onRowClick={(p) => nav(`/applications/${application.id}/properties/${p.id}`)} /></> : <Empty>Ứng dụng này chưa có Property nào.{editable && application.status === "ACTIVE" && <div className="mt-3"><Button onClick={() => setOpen(true)}><Plus /> Tạo Property</Button></div>}</Empty>}
    <PropertyForm key={open ? "property-create-open" : "property-create-closed"} open={open} title="Tạo Property" initial={blank()} tenantId={tenantId} applicationId={application.id} onClose={() => setOpen(false)} onSubmit={(input, capturedTenant, capturedApp) => { const r = create(application.id, input, capturedTenant, capturedApp); if (r.ok) { setOpen(false); msg(r.msg, "success"); nav(`/applications/${application.id}/properties/${r.propertyId}`) }; return r }} />
  </Section>
}

export function PropertyDetailPage() {
  const { applicationId = "", propertyId = "" } = useParams()
  const application = useStore((s) => s.applications.find((a) => a.id === applicationId))
  const property = useStore((s) => s.properties.find((p) => p.id === propertyId && p.applicationId === applicationId))
  const tenant = useStore((s) => s.getCurrentTenant())
  const tenantId = useStore((s) => s.currentTenantId) || ""
  const update = useStore((s) => s.updateProperty); const setStatus = useStore((s) => s.setPropertyStatus); const can = useCan()
  const [editing, setEditing] = React.useState(false); const [confirm, setConfirm] = React.useState(false)
  if (!application || !property) return <><PageHeader title="Không tìm thấy Property" crumbs={[["Ứng dụng", "/applications"]]} desc="Property không thuộc Application và tenant hiện tại." /><Section><Note tone="err">Không thể mở Property ngoài đúng Tenant → Application.</Note></Section></>
  const available = tenant?.status === "ACTIVE" && application.status === "ACTIVE" && property.status === "ACTIVE"
  return <><PageHeader title={property.name} crumbs={[["Ứng dụng", "/applications"], [application.name, `/applications/${application.id}`]]} desc={<span><Mono>{property.id}</Mono> · <Mono>{property.code}</Mono></span>} actions={can("integ", "edit") ? <><Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Chỉnh sửa</Button><Button variant={property.status === "ACTIVE" ? "destructive" : "default"} onClick={() => setConfirm(true)}>{property.status === "ACTIVE" ? "Chuyển Inactive" : "Kích hoạt"}</Button></> : undefined} />
    <Section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><Card><CardHeader><CardTitle>Tổng quan</CardTitle><CardDescription>Ownership cố định theo Tenant → Application → Property.</CardDescription></CardHeader><CardContent><KV rows={[["Property ID", <Mono>{property.id}</Mono>], ["Tên", property.name], ["Mã", <Mono>{property.code}</Mono>], ["Loại", typeLabel[property.type]], ["Định danh kỹ thuật", <Mono>{propertyTechnicalId(property)}</Mono>], ["Application", application.name], ["Trạng thái", <Pill tone={property.status === "ACTIVE" ? "ok" : "mute"}>{property.status}</Pill>], ["Khả dụng hiệu lực", <Pill tone={available ? "ok" : "warn"}>{available ? "AVAILABLE" : "UNAVAILABLE"}</Pill>], ["Mô tả", property.description || "—"], ["Ngày tạo", fmtDT(property.createdAt, true)], ["Người tạo", <Mono>{property.createdBy}</Mono>], ["Cập nhật", fmtDT(property.updatedAt, true)], ["Người cập nhật", property.updatedBy ? <Mono>{property.updatedBy}</Mono> : "—"]]} /></CardContent></Card>
    <Card>
  <CardHeader>
    <CardTitle>Quy trình triển khai Consent</CardTitle>
    <CardDescription>
      Hoàn thiện cấu hình và mô phỏng tích hợp CMP.
    </CardDescription>
  </CardHeader>

  <CardContent className="flex flex-col gap-3">
    <Note>
      Bước 1: Tạo Consent Configuration và Consent Banner.
    </Note>

    <Note>
      Bước 2: Gửi DPO phê duyệt cấu hình.
    </Note>

    <Note>
      Bước 3: Gán Consent Configuration và Banner
      đã duyệt vào Property này.
    </Note>

    <Note>
      Bước 4: Publish cấu hình mô phỏng.
    </Note>

    <Note>
      Bước 5: Sinh mã tích hợp và kiểm thử
      trong Simulator.
    </Note>

    {property.integration?.status === "PUBLISHED" && (
      <Button
        render={
          <Link
            to={`/applications/${application.id}/properties/${property.id}/integration`}
          />
        }
        nativeButton={false}
      >
        Xem mã tích hợp
      </Button>
    )}
  </CardContent>
</Card></Section>
    <ConsentIntegration key={`${property.id}-${property.integration?.status}-${property.integration?.version}-${property.integration?.consentCode}-${property.integration?.bannerCode}`} application={application} property={property} />
    <PropertyForm key={editing ? `property-edit-${property.id}` : "property-edit-closed"} open={editing} title="Chỉnh sửa Property" initial={inputOf(property)} tenantId={tenantId} applicationId={application.id} onClose={() => setEditing(false)} onSubmit={(input, capturedTenant, capturedApp) => { const r = update(application.id, property.id, input, capturedTenant, capturedApp); if (r.ok) { setEditing(false); msg(r.msg, "success") }; return r }} />
    {confirm && <Dialog open onOpenChange={(o) => !o && setConfirm(false)}><DialogContent><DialogHeader><DialogTitle>Xác nhận đổi trạng thái Property?</DialogTitle><DialogDescription>Không xóa ID, quan hệ, records, evidence hoặc lịch sử audit.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirm(false)}>Hủy</Button><Button variant={property.status === "ACTIVE" ? "destructive" : "default"} onClick={() => { const r = setStatus(application.id, property.id, property.status === "ACTIVE" ? "INACTIVE" : "ACTIVE", tenantId, application.id); setConfirm(false); msg(r.msg, r.ok ? "success" : "error") }}>Xác nhận</Button></DialogFooter></DialogContent></Dialog>}
  </>
}

function ConsentIntegration({ application, property }: { application: TenantApplication; property: TenantProperty }) {
  const consents = useStore((s) => s.consents); const banners = useStore((s) => s.banners); const tenantId = useStore((s) => s.currentTenantId) || ""
  const assign = useStore((s) => s.assignPropertyIntegration); const publish = useStore((s) => s.publishPropertyIntegration); const can = useCan()
  const approvedConsents = consents.filter((c) => c.status === "Hoạt động")
  const approvedBanners = banners.filter((b) => b.versions.some((v) => v.status === "Hoạt động"))
  const [consentCode, setConsentCode] = React.useState(property.integration?.consentCode || approvedConsents[0]?.code || "")
  const [bannerCode, setBannerCode] = React.useState(property.integration?.bannerCode || approvedBanners[0]?.code || "")
  const editable = can("integ", "edit") || can("banner", "edit")
  return <Section className="flex flex-col gap-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Consent Integration</h2><p className="text-sm text-muted-foreground">Gán cấu hình đã được DPO phê duyệt, Publish bản mock và dùng stable ID trong Simulator.</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" render={<Link to="/purposes" />} nativeButton={false}>Cấu hình Purpose/Consent</Button><Button size="sm" variant="outline" render={<Link to="/banners" />} nativeButton={false}>Tạo và duyệt Banner</Button></div></div>
    <Card><CardContent className="grid gap-4 pt-6 lg:grid-cols-[1fr_1fr_auto]"><FormField label="Consent Configuration" req><NativeSelect label="Consent Configuration" disabled={!editable} value={consentCode} onChange={setConsentCode} options={approvedConsents.map((c) => [c.code, `${c.code} · ${c.name}`])} className="w-full" /></FormField><FormField label="Banner đã duyệt" req><NativeSelect label="Banner đã duyệt" disabled={!editable} value={bannerCode} onChange={setBannerCode} options={approvedBanners.map((b) => [b.code, `${b.code} · ${b.name}`])} className="w-full" /></FormField><div className="flex items-end"><Button variant="outline" disabled={!editable || !consentCode || !bannerCode} onClick={() => { const r = assign(application.id, property.id, consentCode, bannerCode, tenantId); msg(r.msg, r.ok ? "success" : "error") }}>Lưu assignment</Button></div></CardContent></Card>
    {(!approvedConsents.length || !approvedBanners.length) && <Note tone="warn">Cần ít nhất một Consent Configuration và một Banner ở trạng thái Hoạt động sau DPO Approval.</Note>}
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Rocket className="size-4" /> Publish mock</CardTitle><CardDescription>Không gọi CDN/API và không tạo credential thật.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><KV rows={[["Trạng thái", <Pill tone={property.integration?.status === "PUBLISHED" ? "ok" : "warn"}>{property.integration?.status || "NOT_CONFIGURED"}</Pill>], ["Configuration version", property.integration ? `v${property.integration.version}` : "—"], ["Deployment ID", property.integration?.deploymentId ? <Mono>{property.integration.deploymentId}</Mono> : "—"], ["Published at", property.integration?.publishedAt ? fmtDT(property.integration.publishedAt, true) : "—"]]} /><div className="flex flex-wrap gap-2">{can("integ", "edit") && <Button disabled={!property.integration} onClick={() => { const r = publish(application.id, property.id, tenantId); msg(r.msg, r.ok ? "success" : "error") }}><Rocket /> Publish cấu hình</Button>}{property.integration?.status === "PUBLISHED" && <Button variant="outline" render={<Link to={`/applications/${application.id}/properties/${property.id}/integration`} />} nativeButton={false}>Mở Integration Code</Button>}</div></CardContent></Card>
  </Section>
}

export function IntegrationCodePage() {
  const { applicationId = "", propertyId = "" } = useParams()
  const application = useStore((s) => s.applications.find((a) => a.id === applicationId))
  const property = useStore((s) => s.properties.find((p) => p.id === propertyId && p.applicationId === applicationId))
  if (!application || !property) return <Section><Empty>Không tìm thấy deployment trong tenant hiện tại.</Empty></Section>
  if (property.integration?.status !== "PUBLISHED" || !property.integration.deploymentId) return <><PageHeader title="Integration Code" crumbs={[["Ứng dụng", "/applications"], [application.name, `/applications/${application.id}`], [property.name, `/applications/${application.id}/properties/${property.id}`]]} /><Section><Note tone="warn">Property chưa có cấu hình Published.</Note></Section></>
  const deploymentId = property.integration.deploymentId
  const code = property.type === "WEB"
    ? `<script src="https://mock.cmp.local/sdk.js" data-deployment-id="${deploymentId}"></script>\n<script>\n  CMPMock.init({ deploymentId: "${deploymentId}" });\n</script>`
    : property.type === "ANDROID"
      ? `// Mock only — no real dependency\nCMPMock.initialize(context, deploymentId = "${deploymentId}")`
      : `// Mock only — no real SDK\nCMPMock.initialize(deploymentId: "${deploymentId}")`
  return <><PageHeader title="Integration Code" crumbs={[["Ứng dụng", "/applications"], [application.name, `/applications/${application.id}`], [property.name, `/applications/${application.id}/properties/${property.id}`]]} desc="Mã minh họa dành cho prototype; không tải SDK, API hoặc CDN thật." />
    <Section className="grid gap-4 xl:grid-cols-[1fr_.7fr]"><Card><CardHeader><CardTitle>{typeLabel[property.type]} sample code</CardTitle><CardDescription><Mono>{deploymentId}</Mono> · configuration v{property.integration.version}</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100"><code>{code}</code></pre><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(code); msg("Đã sao chép mã tích hợp mock.", "success") }}><Copy /> Copy Code</Button><Button render={<Link to={`/simulator?propertyId=${property.id}&tab=deployment`} />} nativeButton={false}><Play /> Test in Simulator</Button></div></CardContent></Card><Card><CardHeader><CardTitle>Published configuration</CardTitle></CardHeader><CardContent><KV rows={[["Tenant-scoped Property", property.name], ["Application", application.name], ["Consent", <Mono>{property.integration.consentCode}</Mono>], ["Banner", <Mono>{property.integration.bannerCode}</Mono>], ["Deployment ID", <Mono>{deploymentId}</Mono>], ["Version", `v${property.integration.version}`]]} /></CardContent></Card></Section>
  </>
}

function PropertyForm({ open, title, initial, tenantId, applicationId, onClose, onSubmit }: { open: boolean; title: string; initial: PropertyInput; tenantId: string; applicationId: string; onClose: () => void; onSubmit: (input: PropertyInput, tenantId: string, applicationId: string) => { ok: boolean; msg: string; errors?: PropertyErrors } }) {
  const [form, setForm] = React.useState(initial); const [errors, setErrors] = React.useState<PropertyErrors>({}); const capturedTenant = React.useRef(tenantId); const capturedApplication = React.useRef(applicationId)
  if (!open) return null
  const submit = () => { const r = onSubmit(form, capturedTenant.current, capturedApplication.current); if (!r.ok) { setErrors(r.errors || {}); msg(r.msg, "error") } }
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Application sở hữu được lấy từ ngữ cảnh hiện tại và không thể thay đổi.</DialogDescription></DialogHeader><div className="grid gap-4"><FormField id="property-name" label="Tên Property" req error={errors.name}><Input id="property-name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField><FormField id="property-code" label="Mã Property" req error={errors.code} hint="Ví dụ: RETAIL-WEB"><Input id="property-code" maxLength={50} className="uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField><FormField id="property-type" label="Loại Property" req error={errors.type}><NativeSelect id="property-type" label="Loại Property" value={form.type} onChange={(v) => setForm({ ...form, type: v as TenantProperty["type"] })} options={[["WEB", "Website"], ["ANDROID", "Android"], ["IOS", "iOS"]]} /></FormField>{form.type === "WEB" && <FormField id="property-origin" label="Website origin" req error={errors.origin} hint="https://shop.example.com, không gồm path"><Input id="property-origin" value={form.origin || ""} onChange={(e) => setForm({ ...form, origin: e.target.value })} /></FormField>}{form.type === "ANDROID" && <FormField id="property-package" label="Android package name" req error={errors.packageName}><Input id="property-package" value={form.packageName || ""} onChange={(e) => setForm({ ...form, packageName: e.target.value })} /></FormField>}{form.type === "IOS" && <FormField id="property-bundle" label="iOS bundle ID" req error={errors.bundleId}><Input id="property-bundle" value={form.bundleId || ""} onChange={(e) => setForm({ ...form, bundleId: e.target.value })} /></FormField>}<FormField id="property-description" label="Mô tả" error={errors.description} hint={`${(form.description || "").length}/500`}><Textarea id="property-description" maxLength={500} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField></div><DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={submit}>Lưu</Button></DialogFooter></DialogContent></Dialog>
}
