import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, UserPlus } from "lucide-react"
import { PageHeader, FormField, Note } from "@/components/cmp/kit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/cmp/kit"
import { msg } from "@/components/cmp/approval"
import { ROLES } from "@/lib/perm"
import { useCan, useStore } from "@/lib/store"
import type { Role } from "@/lib/types"

export default function TenantUserCreatePage() {
  const navigate = useNavigate()
  const createTenantUser = useStore((s) => s.createTenantUser)
  const tenant = useStore((s) => s.tenants.find((t) => t.id === s.currentTenantId))
  const canEdit = useCan()("users", "edit")
  const [form, setForm] = React.useState({ name: "", email: "", password: "", role: "Nhân viên" as Role })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = createTenantUser({ ...form, roles: [form.role] })
    if (!result.ok) { setErrors(result.errors || {}); msg(result.msg, "error"); return }
    msg(result.msg, "success")
    navigate("/users", { replace: true })
  }
  return <>
    <PageHeader title="Tạo người dùng" crumbs={[["Người dùng & phân quyền", "/users"]]} desc={`Tạo một tài khoản thuộc riêng ${tenant?.name || "tenant hiện tại"}.`} actions={<Button variant="outline" onClick={() => navigate("/users")}><ArrowLeft /> Quay lại danh sách</Button>} />
    <section className="px-4 md:px-6">
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="size-5" /> Tài khoản tenant</CardTitle><CardDescription>Email chỉ được đăng ký ở một tenant. Người dùng không thể chuyển tenant sau khi tạo.</CardDescription></CardHeader>
        <CardContent>
          {!canEdit ? <Note tone="lock">Vai trò hiện tại chỉ được xem thông tin người dùng. Chỉ Admin tenant được tạo tài khoản.</Note> : <form className="grid gap-4" onSubmit={submit}>
            <FormField id="new-user-name" label="Họ tên" req error={errors.name}><Input id="new-user-name" autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
            <FormField id="new-user-email" label="Email đăng nhập" req error={errors.email}><Input id="new-user-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></FormField>
            <FormField id="new-user-password" label="Mật khẩu khởi tạo" req error={errors.password} hint="Tối thiểu 8 ký tự. Chia sẻ thông tin này với người dùng qua kênh an toàn phù hợp."><Input id="new-user-password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></FormField>
            <FormField id="new-user-role" label="Vai trò tenant" req error={errors.roles}><NativeSelect label="Vai trò tenant" value={form.role} onChange={(role) => setForm((f) => ({ ...f, role: role as Role }))} options={ROLES} className="w-full" /></FormField>
            <Note>Đăng nhập prototype cần mã tenant, email và mật khẩu. Tài khoản Platform không được cấp quyền tenant qua thao tác này.</Note>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => navigate("/users")}>Hủy</Button><Button type="submit">Tạo tài khoản</Button></div>
          </form>}
        </CardContent>
      </Card>
    </section>
  </>
}
