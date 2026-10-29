/** SC-01 Dashboard consent – UC-38 · SCR-38-01 (dựa trên SectionCards + ChartAreaInteractive của template) */
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { MessageSquareText, ThumbsUp, Undo2, RefreshCcw } from "lucide-react"
import { PageHeader, Section, Kpi, NativeSelect, Note, Mono } from "@/components/cmp/kit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStore, currentStates } from "@/lib/store"
import { TODAY } from "@/lib/mock"
import { fmtDT, fmtN, pct } from "@/lib/fmt"

const SMALL = 5 // ngưỡng ẩn ô minh họa; giá trị chính thức [N] (BR-UC38-03)
const cfg = { ACCEPTED: { label: "Đồng ý", color: "var(--chart-1)" }, REJECTED: { label: "Từ chối", color: "var(--chart-2)" }, WITHDRAWN: { label: "Rút lại", color: "var(--chart-3)" } } satisfies ChartConfig
const cfgBar = { rate: { label: "Tỷ lệ đồng ý (%)", color: "var(--chart-1)" } } satisfies ChartConfig

export default function DashboardPage() {
  const tenantProperties = useStore((s) => s.properties)
  const properties = tenantProperties.map((p) => p.name)
  const events = useStore((s) => s.events)
  const consents = useStore((s) => s.consents)
  const nav = useNavigate()
  const [days, setDays] = React.useState("30")
  const [prop, setProp] = React.useState("all")
  const ref = React.useMemo(() => Math.max(TODAY.getTime(), ...events.slice(0, 5).map((e) => new Date(e.ts).getTime())), [events])
  const from = ref - +days * 86400000
  const inScope = (e: (typeof events)[number]) => (prop === "all" || e.property === prop) && e.source !== "Legacy"
  const ev = events.filter((e) => inScope(e) && new Date(e.ts).getTime() >= from)
  const prev = events.filter((e) => inScope(e) && new Date(e.ts).getTime() >= from - +days * 86400000 && new Date(e.ts).getTime() < from)
  const asked = (L: typeof ev) => L.filter((e) => e.decision === "ACCEPTED" || e.decision === "REJECTED")
  const acc = (L: typeof ev) => L.filter((e) => e.decision === "ACCEPTED").length
  const rate = pct(acc(ev), asked(ev).length), ratePrev = pct(acc(prev), asked(prev).length)
  const wd = ev.filter((e) => e.decision === "WITHDRAWN").length
  const reNow = currentStates(events).filter((c) => c.decision === "RE_CONSENT" && (prop === "all" || c.last.property === prop)).length
  // xu hướng theo ngày
  const series = (() => {
    const map = new Map<string, { date: string; ACCEPTED: number; REJECTED: number; WITHDRAWN: number }>()
    for (let i = +days - 1; i >= 0; i--) { const d = new Date(ref - i * 86400000 + 7 * 3600000).toISOString().slice(0, 10); map.set(d, { date: d, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 }) }
    ev.forEach((e) => { const d = new Date(new Date(e.ts).getTime() + 7 * 3600000).toISOString().slice(0, 10); const r = map.get(d); if (r && (e.decision === "ACCEPTED" || e.decision === "REJECTED" || e.decision === "WITHDRAWN")) r[e.decision]++ })
    return [...map.values()]
  })()
  const byConsent = consents.filter((c) => c.everActive).map((c) => { const L = ev.filter((e) => e.consent === c.code); const a = asked(L).length; return { code: c.code, name: c.name, asked: a, acc: acc(L), rej: L.filter((e) => e.decision === "REJECTED").length, wd: L.filter((e) => e.decision === "WITHDRAWN").length, rate: a >= SMALL ? pct(acc(L), a) : 0, hidden: a > 0 && a < SMALL } }).filter((x) => x.asked > 0 || x.wd > 0)
  const byProp = properties.map((p) => { const L = ev.filter((e) => e.property === p); const a = asked(L).length; return { p, a, acc: acc(L), rate: pct(acc(L), a), wd: L.filter((e) => e.decision === "WITHDRAWN").length } })
  const delta = Math.round((rate - ratePrev) * 10) / 10
  const fmtDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
  return (
    <>
      <PageHeader title="Dashboard consent" crumbs={[["Tổng quan"]]} desc={<>Số liệu tổng hợp tính từ evidence, nhất quán với màn Bản ghi consent. Cập nhật lúc <Mono>{fmtDT(new Date(ref).toISOString())}</Mono> · độ trễ tối đa [N] phút (BR-UC38-01).</>}
        actions={<><NativeSelect label="Property" value={prop} onChange={setProp} options={[["all", "Mọi property"], ...properties.map((p) => [p, p] as [string, string])]} /><ToggleGroup variant="outline" spacing={0} value={[days]} onValueChange={(v) => v[0] && setDays(v[0])}><ToggleGroupItem value="7">7 ngày</ToggleGroupItem><ToggleGroupItem value="30">30 ngày</ToggleGroupItem><ToggleGroupItem value="90">90 ngày</ToggleGroupItem></ToggleGroup></>} />
      <Section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Lượt hỏi (Đồng ý + Từ chối)" value={fmtN(asked(ev).length)} icon={<MessageSquareText />} sub={`Kỳ trước: ${fmtN(asked(prev).length)} · không tính đóng popup`} />
        <Kpi label="Tỷ lệ đồng ý" value={`${rate.toLocaleString("vi-VN")}%`} icon={<ThumbsUp />} tone="ok" sub={`${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toLocaleString("vi-VN")} điểm so với kỳ trước`} />
        <Kpi label="Lượt rút lại" value={fmtN(wd)} icon={<Undo2 />} tone={wd ? "err" : undefined} sub="Hiệu lực ngay tại T0 (BRL-03)" />
        <Kpi label="Chủ thể cần đồng ý lại" value={fmtN(reNow)} icon={<RefreshCcw />} tone={reNow ? "warn" : undefined} sub="RE_CONSENT sau phiên bản trọng yếu" />
      </Section>
      <Section>
        <Card>
          <CardHeader><CardTitle>Xu hướng quyết định theo ngày</CardTitle><CardDescription>{days} ngày gần nhất · {prop === "all" ? "mọi property" : prop}</CardDescription></CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ChartContainer config={cfg} className="aspect-auto h-[260px] w-full">
              <AreaChart data={series} margin={{ left: 0, right: 8 }}>
                <defs>{(Object.keys(cfg) as (keyof typeof cfg)[]).map((k) => <linearGradient key={k} id={`f${k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.5} /><stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.05} /></linearGradient>)}</defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={fmtDate} />
                <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(v) => fmtDate(String(v))} indicator="dot" />} />
                <Area dataKey="REJECTED" type="monotone" fill="url(#fREJECTED)" stroke="var(--color-REJECTED)" strokeWidth={1.5} animationDuration={500} />
                <Area dataKey="ACCEPTED" type="monotone" fill="url(#fACCEPTED)" stroke="var(--color-ACCEPTED)" strokeWidth={1.5} animationDuration={500} />
                <Area dataKey="WITHDRAWN" type="monotone" fill="url(#fWITHDRAWN)" stroke="var(--color-WITHDRAWN)" strokeWidth={1.5} animationDuration={500} />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </Section>
      <Section className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader><CardTitle>Tỷ lệ đồng ý theo consent</CardTitle><CardDescription>Bấm một cột để mở Bản ghi consent đã lọc</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={cfgBar} className="aspect-auto h-[240px] w-full">
              <BarChart data={byConsent} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} unit="%" />
                <YAxis type="category" dataKey="code" width={128} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="rate" fill="var(--color-rate)" radius={4} animationDuration={500} onClick={(d) => nav(`/records?consent=${(d as unknown as { code: string }).code}`)} className="cursor-pointer" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Theo property</CardTitle><CardAction className="text-xs text-muted-foreground">Không có dữ liệu định danh</CardAction></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Property</TableHead><TableHead className="text-right">Lượt hỏi</TableHead><TableHead className="text-right">Đồng ý</TableHead><TableHead className="text-right">Rút lại</TableHead></TableRow></TableHeader>
              <TableBody>
                {byProp.map((r) => (
                  <TableRow key={r.p}><TableCell className="font-medium">{r.p}</TableCell><TableCell className="text-right tabular-nums">{r.a < SMALL && r.a > 0 ? "—" : fmtN(r.a)}</TableCell><TableCell className="text-right tabular-nums">{r.a < SMALL ? "—" : `${r.rate.toLocaleString("vi-VN")}%`}</TableCell><TableCell className="text-right tabular-nums">{r.wd > 0 && r.wd < SMALL ? "—" : fmtN(r.wd)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Section>
      <Section>
        <Note>Tỷ lệ đồng ý = số quyết định Đồng ý / (Đồng ý + Từ chối) của lần hỏi trong kỳ; đóng popup không tính (BR-UC38-04). Ô có dưới {SMALL} lượt hiển thị “—” để tránh nhận diện cá nhân (ngưỡng minh họa; giá trị chính thức [N], BR-UC38-03). Dashboard không có Xuất CSV (BR-UC38-05). Consent Legacy không tính vào xu hướng.</Note>
      </Section>
    </>
  )
}
