/** P3 – trang giữ chỗ chỉ xem: Yêu cầu quyền (UC-22..26), Tích hợp (UC-06, 30, 31, 33), Cài đặt (UC-10, 40, 43) */
import * as React from "react"
import { PageHeader, Section, Mono, Pill, StatusBadge, Kpi } from "@/components/cmp/kit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useCan, useStore, currentStates } from "@/lib/store"
import { CONNECTORS, COOKIES, KEYS, RIGHTS } from "@/lib/mock"
import { fmtDT, fmtN } from "@/lib/fmt"
import { msg } from "@/components/cmp/approval"
import { BusinessContextHelp, RelationshipNote, SimulationNotice } from "@/components/cmp/business-context-help"

const OUT = <SimulationNotice>Chức năng hiện ở mức giao diện đọc dữ liệu minh họa để giữ đúng vị trí trong sitemap. Quy trình tương tác thuộc giai đoạn tiếp theo; không nên hiểu là tích hợp thực tế đã hoàn thành.</SimulationNotice>
const T = ({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) => (
  <div className="overflow-x-auto rounded-lg border bg-card"><Table><TableHeader><TableRow>{head.map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((r, i) => <TableRow key={i}>{r.map((c, j) => <TableCell key={j}>{c}</TableCell>)}</TableRow>)}</TableBody></Table></div>
)

export function RightsPage() {
  return (
    <>
      <PageHeader title="Yêu cầu quyền của chủ thể" crumbs={[["Vận hành"]]} desc="Theo dõi các yêu cầu xem, sửa, xóa, hạn chế hoặc phản đối xử lý dữ liệu. Màn hình hiện minh họa danh sách vận hành; quy trình tiếp nhận và xử lý chi tiết chưa thuộc Prompt 03." />
      <Section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2"><BusinessContextHelp title="Yêu cầu quyền của chủ thể" context={{ purpose: "Theo dõi yêu cầu thực hiện quyền của chủ thể từ tiếp nhận tới đóng hồ sơ.", when: "Khi khách hàng gửi yêu cầu xem, sửa, xóa, hạn chế, phản đối hoặc cung cấp dữ liệu.", actors: "Khách hàng gửi yêu cầu; Nhân viên xử lý; DPO duyệt gia hạn hoặc đóng.", inputs: "Loại quyền, subject, verification, tài liệu và SLA.", outputs: "Request status, timeline, downstream tasks và kết quả phản hồi.", related: ["Rights Portal", "Rights Queue", "DPO Approval", "Audit"], example: "Khách hàng yêu cầu xóa dữ liệu; operator xác minh và theo dõi tác vụ tại các hệ thống xử lý.", srs: "UC-22..26" }} /><RelationshipNote>Màn hiện tại chỉ là <b>hàng đợi minh họa</b>; chưa có form, verification, detail, extension hoặc closure workflow.</RelationshipNote></div>
        {OUT}
        <T head={["Mã yêu cầu", "Khách hàng", "Loại quyền", "Tiếp nhận", "Trạng thái", "Người xử lý", "Hạn"]} rows={RIGHTS.map((r) => [<Mono>{r.id}</Mono>, <Mono>{r.subject}</Mono>, r.type, <span className="font-mono text-xs">{fmtDT(r.at)}</span>, <Pill tone={/Quá hạn/.test(r.status) ? "err" : r.status === "COMPLETED" ? "ok" : "info"}>{r.status}</Pill>, r.owner, r.due])} />
      </Section>
    </>
  )
}

export function IntegrationsPage() {
  const apps = useStore((s) => s.applications)
  const outbox = useStore((s) => s.outbox)
  const consents = useStore((s) => s.consents)
  const can = useCan()
  return (
    <>
      <PageHeader title="Ứng dụng & hệ thống tích hợp" crumbs={[["Hệ thống"]]} desc="Quan sát ứng dụng sử dụng CMP, event consent gửi ra ngoài, connector đích và kết quả quét cookie. Event từ Simulator xuất hiện tại đây; các cấu hình tích hợp còn lại đang ở mức giao diện minh họa." />
      <Section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2"><BusinessContextHelp title="Ứng dụng và hệ thống tích hợp" context={{ purpose: "Giải thích CMP kết nối application, gửi thay đổi consent và kiểm soát cookie/tracker.", when: "Khi cấu hình application hoặc kiểm tra event có được chuyển tới CRM/CDP/ESP hay không.", actors: "Admin và nhân viên tích hợp.", inputs: "Application, origin, key/webhook, event, connector và scan result.", outputs: "Application scope, delivery status, connector status và cookie classification.", related: ["Consent", "Application", "Event", "Connector", "Scanner"], example: "Withdrawal tạo CONSENT_WITHDRAWN để ESP đưa khách hàng vào suppression list.", srs: "UC-06, UC-30, UC-31, UC-33" }} /><RelationshipNote>Tab <b>Lịch sử gửi event</b> nhận dữ liệu từ Simulator; Application, Connector và Scanner hiện chỉ minh họa cấu trúc dữ liệu.</RelationshipNote></div>
        {OUT}
        <Tabs defaultValue="ev">
          <TabsList className="flex-wrap"><TabsTrigger value="ev">Lịch sử gửi event</TabsTrigger><TabsTrigger value="app">Ứng dụng T3</TabsTrigger><TabsTrigger value="cn">Connector</TabsTrigger><TabsTrigger value="scan">Quét cookie</TabsTrigger></TabsList>
          <TabsContent value="ev" className="mt-3 flex flex-col gap-2">
            <div className="text-sm text-muted-foreground">Event sinh từ màn Mô phỏng thu thập hiện ở đây. Giao ít nhất một lần, giữ thứ tự theo seq từng chủ thể; quá số lần thử [N] thì FAILED và cảnh báo NT-08; chỉ Admin gửi lại thủ công (mục 5.2.4).</div>
            <T head={["Event", "Loại", "Consent", "Chủ thể", "Đích", "Trạng thái", "Lần thử", "Thời điểm", ""]} rows={outbox.slice(0, 40).map((o) => [<Mono>{o.id}</Mono>, <Mono>{o.type}</Mono>, <Mono>{o.consent}</Mono>, <Mono>{o.subject}</Mono>, o.dest, <StatusBadge s={o.status} />, o.tries, <span className="font-mono text-xs">{fmtDT(o.at)}</span>, o.status === "FAILED" && can("integ", "edit") ? <Button size="xs" variant="outline" onClick={() => msg(`Đã xếp ${o.id} vào hàng gửi lại (mô phỏng).`, "info")}>Gửi lại</Button> : null])} />
          </TabsContent>
          <TabsContent value="app" className="mt-3"><T head={["Ứng dụng", "client_id", "Property", "Origin", "Consent được gọi"]} rows={apps.map((a) => [a.name, <Mono>{a.id}</Mono>, a.property, <Mono>https://{a.property.includes(".") ? a.property : "app.demo.vn"}</Mono>, consents.filter((c) => c.apps.includes(a.id)).map((c) => c.code).join(", ")])} /></TabsContent>
          <TabsContent value="cn" className="mt-3"><T head={["Connector", "Loại", "Trạng thái", "Đã gửi", "Lỗi", "Gần nhất"]} rows={CONNECTORS.map((c) => [c.name, c.type, <Pill tone={c.st === "Lỗi" ? "err" : c.st === "Cảnh báo" ? "warn" : "ok"}>{c.st}</Pill>, fmtN(c.sent), c.failed, <span className="font-mono text-xs">{fmtDT(c.last)}</span>])} /></TabsContent>
          <TabsContent value="scan" className="mt-3"><T head={["Cookie, tracker", "Domain", "Nhà cung cấp", "Thời hạn", "Nhóm"]} rows={COOKIES.map((c) => [<Mono>{c.name}</Mono>, c.dom, c.prov, c.ttl, <Pill tone={c.grp === "Thiết yếu" ? "dark" : "info"}>{c.grp}</Pill>])} /></TabsContent>
        </Tabs>
      </Section>
    </>
  )
}

export function SettingsPage() {
  const tenantProperties = useStore((s) => s.properties)
  const properties = tenantProperties.map((p) => p.name)
  const events = useStore((s) => s.events)
  const states = currentStates(events)
  return (
    <>
      <PageHeader title="Cài đặt" crumbs={[["Hệ thống"]]} desc="Khóa ký Receipt (UC-10), cấu hình cảnh báo (UC-40) và đo lượng dùng phục vụ tính giá (UC-43)." />
      <Section className="flex flex-col gap-4">{OUT}
        <Card className="gap-2"><CardHeader><CardTitle>Khóa ký CMP</CardTitle><CardDescription>Khóa riêng sinh và nằm trong KMS/HSM, không xuất ra. JWKS công khai tại /.well-known/jwks.json. Khóa Chỉ xác minh vẫn dùng để xác minh Receipt cũ.</CardDescription></CardHeader>
          <CardContent><T head={["kid", "Thuật toán", "Trạng thái", "Tạo", "Hết hạn"]} rows={KEYS.map((k) => [<Mono>{k.kid}</Mono>, k.alg, <Pill tone={k.st === "Đang dùng" ? "ok" : "warn"}>{k.st}</Pill>, k.created, k.exp])} /></CardContent></Card>
        <Card className="gap-2"><CardHeader><CardTitle>Cấu hình cảnh báo</CardTitle><CardDescription>Ngưỡng mặc định [TBD] (BRL-16). Kênh trong ứng dụng luôn bật.</CardDescription></CardHeader>
          <CardContent><T head={["Loại cảnh báo", "Ngưỡng", "Mức", "Người nhận"]} rows={[["Webhook, connector FAILED", "Quá [N] lần thử", "Nghiêm trọng", "Admin"], ["Khóa ký sắp hết hạn", "Trước [N] ngày", "Nghiêm trọng", "Admin"], ["Yêu cầu quyền sắp trễ, quá hạn", "Còn [N] ngày", "Cảnh báo", "Nhân viên được giao, DPO"], ["Mục chờ duyệt quá lâu", "[N] ngày làm việc", "Cảnh báo", "Người có quyền Phê duyệt"], ["Cổng SMS, Zalo lỗi", "Tỷ lệ lỗi > [N]%", "Cảnh báo", "Admin"]]} /></CardContent></Card>
        <div className="grid gap-3 sm:grid-cols-3">{properties.map((p) => <Kpi key={p} label={`Chủ thể có consent · ${p}`} value={fmtN(new Set(states.filter((s) => s.last.property === p).map((s) => s.subject)).size)} sub="Tháng 10/2026 · mô hình giá [TBD]" />)}</div>
      </Section>
    </>
  )
}
