import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Building2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FormField, Note } from "@/components/cmp/kit"
import { useStore } from "@/lib/store"

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useStore((s) => s.login)
  const authenticated = useStore((s) => s.authenticated)
  const accounts = useStore((s) => s.accounts)
  const tenants = useStore((s) => s.tenants)
  const [tenantCode, setTenantCode] = React.useState("ABC-RETAIL")
  const [email, setEmail] = React.useState("staff@demo.cmp")
  const [password, setPassword] = React.useState("Demo123!")
  const [error, setError] = React.useState("")
  React.useEffect(() => { if (authenticated) navigate("/dashboard", { replace: true }) }, [authenticated, navigate])
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const result = login(tenantCode, email, password)
    if (!result.ok) { setError(result.msg); return }
    setError("")
    navigate("/dashboard", { replace: true })
  }
  const demoUsers = accounts.filter((a) => ["tenant-retail", "tenant-finance", "tenant-health"].includes(a.tenantId))
  const pick = (id: string) => {
    const account = accounts.find((a) => a.id === id)
    const tenant = account && tenants.find((t) => t.id === account.tenantId)
    if (!account || !tenant) return
    setTenantCode(tenant.code); setEmail(account.email); setPassword("Demo123!"); setError("")
  }
  return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
    <div className="grid w-full max-w-4xl gap-6 md:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col justify-center gap-4 p-2 md:p-6">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck /></div>
        <div><h1 className="text-3xl font-bold tracking-tight">Đăng nhập CMP</h1><p className="mt-2 text-muted-foreground">Đăng nhập vào Tenant Workspace bằng tài khoản thuộc đúng một tổ chức.</p></div>
        <Note>Đây là đăng nhập mô phỏng phía trình duyệt, không phải dịch vụ xác thực production. Tài khoản Platform được quản lý riêng.</Note>
      </section>
      <Card className="self-center">
        <CardHeader><CardTitle>Tenant Workspace</CardTitle><CardDescription>Nhập mã tenant, email và mật khẩu.</CardDescription></CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <FormField id="login-tenant" label="Mã tenant" req><Input id="login-tenant" autoComplete="organization" value={tenantCode} onChange={(e) => setTenantCode(e.target.value)} /></FormField>
            <FormField id="login-email" label="Email" req><Input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
            <FormField id="login-password" label="Mật khẩu" req><Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></FormField>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Đăng nhập</Button>
          </form>
          <div className="mt-6 border-t pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Tài khoản demo · mật khẩu chung: Demo123!</p>
            <div className="grid gap-2 sm:grid-cols-2">{demoUsers.map((a) => {
              const tenant = tenants.find((t) => t.id === a.tenantId)
              return <Button key={a.id} type="button" variant="outline" className="h-auto justify-start gap-2 py-2 text-left" onClick={() => pick(a.id)}>
                <Building2 className="size-4 shrink-0" /><span className="min-w-0"><span className="block truncate text-xs">{a.name} · {a.roles.join(", ")}</span><span className="block truncate text-[10px] text-muted-foreground">{tenant?.code} · {a.email}</span></span>
              </Button>
            })}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  </main>
}
