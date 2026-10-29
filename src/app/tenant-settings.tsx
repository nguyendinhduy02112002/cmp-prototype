import * as React from "react"
import { Building2, Contact, Languages, Save, Undo2 } from "lucide-react"
import { PageHeader, Section, FormField, NativeSelect, Note, Pill, Mono, KV } from "@/components/cmp/kit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCan, useStore } from "@/lib/store"
import { DATE_FORMAT_OPTIONS, defaultTenantSettings, formatDateForTenant, LANGUAGE_OPTIONS, TIME_ZONE_OPTIONS, type TenantSettings } from "@/lib/tenant-settings-data"
import { useTenantSettingsStore } from "@/lib/tenant-settings-store"
import { msg } from "@/components/cmp/approval"

type Form = Omit<TenantSettings, "tenantId" | "updatedAt">
const toForm = (settings: TenantSettings): Form => ({ defaultLanguage: settings.defaultLanguage, timeZone: settings.timeZone, dateFormat: settings.dateFormat, privacyContactName: settings.privacyContactName, privacyContactEmail: settings.privacyContactEmail, privacyContactPhone: settings.privacyContactPhone, privacyContactDepartment: settings.privacyContactDepartment })

export default function TenantSettingsPage() {
  const tenantId = useStore((s) => s.currentTenantId) || ""
  const tenant = useStore((s) => s.tenants.find((t) => t.id === s.currentTenantId))
  const can = useCan(); const editable = can("settings", "edit")
  const storedSettings = useTenantSettingsStore((s) => s.byTenant[tenantId])
  const settings = storedSettings || defaultTenantSettings(tenantId)
  const ensure = useTenantSettingsStore((s) => s.ensureTenant); const save = useTenantSettingsStore((s) => s.saveForTenant)
  const [form, setForm] = React.useState<Form>(() => toForm(settings)); const [errors, setErrors] = React.useState<Partial<Record<keyof Form, string>>>({})
  React.useEffect(() => { if (tenantId) ensure(tenantId) }, [ensure, tenantId])
  const baseline = toForm(settings)
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline)
  const set = <K extends keyof Form>(key: K, value: Form[K]) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })) }
  const cancel = () => { setForm(baseline); setErrors({}); msg("Đã hủy các thay đổi chưa lưu.", "info") }
  const submit = () => {
    const r = save(tenantId, form)
    if (!r.ok) { setErrors(r.errors || {}); msg(r.msg, "error"); return }
    msg(r.msg, "success")
  }
  if (!tenant) return null
  return <><PageHeader title="Cài đặt tenant" crumbs={[["Hệ thống"]]} desc="Cấu hình thuộc riêng tenant hiện tại. Metadata vòng đời do Platform Administration sở hữu và chỉ đọc tại đây." actions={editable ? <><Button variant="outline" disabled={!dirty} onClick={cancel}><Undo2 /> Hủy thay đổi</Button><Button disabled={!dirty} onClick={submit}><Save /> Lưu cài đặt</Button></> : undefined} />
    <Section className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"><div><div className="text-sm font-medium">{dirty ? "Có thay đổi chưa lưu" : "Mọi thay đổi đã được lưu"}</div><div className="text-xs text-muted-foreground">Tenant scope: <Mono>{tenant.id}</Mono></div></div><Pill tone={dirty ? "warn" : "ok"}>{dirty ? "Chưa lưu" : "Đã lưu"}</Pill></div>
      {!editable && <Note tone="lock">Vai trò hiệu lực hiện tại chỉ có quyền xem. Các trường tenant-owned được hiển thị read-only; route và store action cùng enforce permission `settings.edit`.</Note>}
      <Card><CardHeader><div className="flex items-center gap-2"><Building2 className="size-5" /><CardTitle>Hồ sơ tổ chức</CardTitle></div><CardDescription>Nguồn dữ liệu duy nhất là Platform Tenant Registry. Tenant Administrator không thể sửa các trường platform-owned.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <FormField label="Tenant ID" hint="Platform-owned"><Input value={tenant.id} readOnly /></FormField><FormField label="Mã tenant" hint="Platform-owned"><Input value={tenant.code} readOnly /></FormField>
        <FormField label="Tên tổ chức" hint="Platform-owned"><Input value={tenant.name} readOnly /></FormField><FormField label="Trạng thái" hint="Platform-owned"><Input value={tenant.status === "ACTIVE" ? "Đang hoạt động" : "Tạm ngừng"} readOnly /></FormField>
        <FormField label="Mô tả tổ chức" hint="Platform-owned"><Textarea value={tenant.description || ""} readOnly /></FormField><FormField label="Email liên hệ tổ chức" hint="Platform-owned"><Input value={tenant.contactEmail || ""} readOnly /></FormField>
        <div className="md:col-span-2"><KV rows={[["Ngày tạo theo định dạng tenant", formatDateForTenant(tenant.createdAt, settings)], ["Quyền sở hữu", "Tenant ID, code, lifecycle status và organization metadata do Platform Administration quản lý."]]} /></div>
      </CardContent></Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><div className="flex items-center gap-2"><Languages className="size-5" /><CardTitle>Cài đặt chung</CardTitle></div><CardDescription>Áp dụng cho trải nghiệm tenant ở mức prototype; không cài đặt framework i18n đầy đủ.</CardDescription></CardHeader><CardContent className="grid gap-4">
          <FormField label="Ngôn ngữ mặc định"><NativeSelect label="Ngôn ngữ mặc định" disabled={!editable} value={form.defaultLanguage} onChange={(v) => set("defaultLanguage", v as Form["defaultLanguage"])} options={LANGUAGE_OPTIONS} className="w-full" /></FormField>
          <FormField label="Múi giờ"><NativeSelect label="Múi giờ" disabled={!editable} value={form.timeZone} onChange={(v) => set("timeZone", v as Form["timeZone"])} options={TIME_ZONE_OPTIONS} className="w-full" /></FormField>
          <FormField label="Định dạng ngày"><NativeSelect label="Định dạng ngày" disabled={!editable} value={form.dateFormat} onChange={(v) => set("dateFormat", v as Form["dateFormat"])} options={DATE_FORMAT_OPTIONS} className="w-full" /></FormField>
          <Note>Xem trước ngày tạo tổ chức: <b>{formatDateForTenant(tenant.createdAt, { ...settings, ...form })}</b>. Header hiển thị language/time zone đang active.</Note>
        </CardContent></Card>
        <Card><CardHeader><div className="flex items-center gap-2"><Contact className="size-5" /><CardTitle>Liên hệ quyền riêng tư</CardTitle></div><CardDescription>Thông tin liên hệ nghiệp vụ; không phải tuyên bố tuân thủ hoặc bằng chứng bắt buộc bổ nhiệm DPO.</CardDescription></CardHeader><CardContent className="grid gap-4">
          <FormField id="privacy-name" label="Tên người liên hệ"><Input id="privacy-name" disabled={!editable} value={form.privacyContactName} onChange={(e) => set("privacyContactName", e.target.value)} /></FormField>
          <FormField id="privacy-email" label="Email quyền riêng tư" error={errors.privacyContactEmail}><Input id="privacy-email" type="email" disabled={!editable} value={form.privacyContactEmail} onChange={(e) => set("privacyContactEmail", e.target.value)} /></FormField>
          <FormField id="privacy-phone" label="Điện thoại" error={errors.privacyContactPhone}><Input id="privacy-phone" disabled={!editable} value={form.privacyContactPhone} onChange={(e) => set("privacyContactPhone", e.target.value)} /></FormField>
          <FormField id="privacy-dept" label="Bộ phận"><Input id="privacy-dept" disabled={!editable} value={form.privacyContactDepartment} onChange={(e) => set("privacyContactDepartment", e.target.value)} /></FormField>
        </CardContent></Card>
      </div>
    </Section>
  </>
}
