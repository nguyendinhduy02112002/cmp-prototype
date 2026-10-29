/* eslint-disable react-refresh/only-export-components -- scenario catalog and UI-only store are shared by the global demo dock */
import * as React from "react"
import { create } from "zustand"
import { useLocation, useNavigate } from "react-router-dom"
import { CheckCircle2, Circle, Compass, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useStore } from "@/lib/store"
import type { Decision } from "@/lib/types"
import { cn } from "@/lib/utils"

type DemoTab = "cookie" | "form" | "pref" | "api"
type Verification =
  | { kind: "manual" }
  | { kind: "event"; decision: Decision; sensitive?: boolean }

interface DemoStep {
  title: string
  explanation: string
  action: string
  expected: string
  route: string
  tab?: DemoTab
  verification: Verification
}

interface DemoScenario {
  id: string
  name: string
  objective: string
  actor: string
  srs: string
  steps: DemoStep[]
}

const step = (title: string, explanation: string, action: string, expected: string, route = "/simulator", tab?: DemoTab, verification: Verification = { kind: "manual" }): DemoStep => ({ title, explanation, action, expected, route, tab, verification })

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "accept", name: "Khách hàng đồng ý", objective: "Minh họa một quyết định Đồng ý được ghi nhận và kiểm tra xuyên hệ thống.", actor: "Khách hàng · Ứng dụng tích hợp", srs: "UC-12, UC-27, UC-28, UC-36, UC-38",
    steps: [
      step("Chuẩn bị khách hàng", "Chọn một mã khách hàng demo và mở Form nghiệp vụ.", "Chọn subject ở đầu màn hình; giữ CMP ở trạng thái hoạt động.", "Subject và trạng thái hiện hành xuất hiện ở cột phải.", "/simulator", "form"),
      step("Gọi chức năng cần consent", "Ứng dụng gọi CMP.require trước khi thực hiện chức năng.", "Bấm một chức năng chưa có consent hợp lệ, ví dụ Nhận ưu đãi qua email.", "Popup hiển thị đúng consent và notice đang Published.", "/simulator", "form"),
      step("Khách hàng chọn Đồng ý", "CMP chỉ ghi quyết định sau hành động rõ ràng của khách hàng.", "Bấm Đồng ý trên popup.", "Có event ACCEPTED mới, Receipt metadata và trạng thái hiện hành được cập nhật.", "/simulator", "form", { kind: "event", decision: "ACCEPTED" }),
      step("Kiểm tra trạng thái", "Records trả lời khách hàng hiện đang đồng ý hay không.", "Mở Bản ghi consent và tìm subject vừa dùng.", "Bản ghi hiển thị ACCEPTED và version mới nhất.", "/records"),
      step("Kiểm tra bằng chứng", "Evidence giải thích quyết định được tạo khi nào và từ đâu.", "Mở Bằng chứng và tìm event mới.", "Có evidence, notice version và Receipt metadata liên quan.", "/evidence"),
      step("Kiểm tra báo cáo", "Dashboard tổng hợp từ cùng nguồn sự kiện.", "Mở Dashboard và quan sát KPI/xu hướng.", "Số liệu được tính lại từ shared store.", "/dashboard"),
    ],
  },
  {
    id: "reject", name: "Khách hàng từ chối", objective: "Minh họa từ chối và tác động của ma trận phụ thuộc tới chức năng.", actor: "Khách hàng · Ứng dụng tích hợp", srs: "UC-13, UC-05, UC-27",
    steps: [
      step("Chọn chức năng", "Mỗi chức năng có thể phụ thuộc một purpose khác nhau.", "Mở Form nghiệp vụ và chọn chức năng chưa có quyết định hợp lệ.", "CMP.require hiển thị popup.", "/simulator", "form"),
      step("Khách hàng chọn Từ chối", "Từ chối phải được ghi nhận rõ như một quyết định.", "Bấm Từ chối.", "Có event REJECTED mới.", "/simulator", "form", { kind: "event", decision: "REJECTED" }),
      step("Quan sát kết quả chức năng", "Ma trận quyết định chức năng bị chặn hay vẫn tiếp tục.", "Đọc thông báo kết quả dưới form và so sánh required/optional.", "Chỉ chức năng phụ thuộc bắt buộc bị chặn.", "/simulator", "form"),
      step("Kiểm tra current state", "Records lưu trạng thái mới nhất của subject × consent.", "Mở Bản ghi consent.", "Trạng thái REJECTED xuất hiện.", "/records"),
    ],
  },
  {
    id: "withdraw", name: "Khách hàng rút lại đồng ý", objective: "Minh họa khách hàng đổi ý và withdrawal có hiệu lực ngay.", actor: "Khách hàng", srs: "UC-19, UC-20, UC-30, UC-31",
    steps: [
      step("Chọn khách hàng đã đồng ý", "Withdrawal cần một consent đang ACCEPTED.", "Chọn subject có trạng thái ACCEPTED; nếu chưa có, hoàn thành scenario Đồng ý trước.", "Có ít nhất một lựa chọn đang bật.", "/simulator", "pref"),
      step("Xác minh mô phỏng", "Preference Center xác minh người truy cập trước khi hiển thị lựa chọn.", "Gửi mã và nhập OTP demo 123456.", "Danh sách Đồng ý của tôi được hiển thị.", "/simulator", "pref"),
      step("Rút lại", "Rút lại không nhiều bước hơn khi đồng ý và có hiệu lực tại T0.", "Tắt một consent đang bật và xác nhận.", "Có event WITHDRAWN mới và current state đổi ngay.", "/simulator", "pref", { kind: "event", decision: "WITHDRAWN" }),
      step("Kiểm tra bằng chứng", "Lịch sử giữ cả lần đồng ý và lần rút lại.", "Mở Evidence.", "Hai quyết định liên quan nằm trong chuỗi sự kiện.", "/evidence"),
      step("Kiểm tra event", "Withdrawal tạo event để hệ thống đích suppression.", "Mở Ứng dụng & tích hợp, tab Lịch sử gửi event.", "CONSENT_WITHDRAWN xuất hiện trong outbox mô phỏng.", "/integrations"),
    ],
  },
  {
    id: "reconsent", name: "Khách hàng đồng ý lại", objective: "Minh họa yêu cầu đồng ý lại khi notice thay đổi trọng yếu.", actor: "DPO · Khách hàng", srs: "UC-03, UC-04, UC-16",
    steps: [
      step("Chuẩn bị subject", "Chọn subject đã từng ACCEPTED một consent.", "Mở Form nghiệp vụ và xem trạng thái hiện hành.", "Có consent ACCEPTED để đưa về RE_CONSENT.", "/simulator", "form"),
      step("Mô phỏng thay đổi trọng yếu", "Trong thực tế DPO publish notice trọng yếu; công cụ demo tạo cùng trạng thái cần xin lại.", "Dùng Công cụ trình diễn để chuyển consent sang RE_CONSENT.", "Có event RE_CONSENT mới.", "/simulator", "form", { kind: "event", decision: "RE_CONSENT" }),
      step("Gọi lại chức năng", "Lần CMP.require tiếp theo phải hiển thị thay đổi thay vì cho phép ngay.", "Bấm lại chức năng tương ứng.", "Popup tái đồng ý và nội dung thay đổi xuất hiện.", "/simulator", "form"),
      step("Ra quyết định mới", "Quyết định mới gắn với notice version hiện hành.", "Chọn Đồng ý hoặc Từ chối trên popup.", "Có decision mới sau RE_CONSENT.", "/simulator", "form", { kind: "event", decision: "ACCEPTED" }),
      step("Kiểm tra version", "Evidence phải chỉ ra version nội dung đã hiển thị.", "Mở Evidence và xem event mới.", "Event có version/hash mới.", "/evidence"),
    ],
  },
  {
    id: "sensitive", name: "Đồng ý dữ liệu nhạy cảm", objective: "Minh họa xác nhận riêng và rõ ràng cho consent chứa dữ liệu nhạy cảm.", actor: "Khách hàng", srs: "UC-14, BR-UC14-04",
    steps: [
      step("Chọn chức năng eKYC", "Consent eKYC dùng purpose có dữ liệu nhạy cảm.", "Mở Form nghiệp vụ và bấm Mở Ví ABC (eKYC).", "Popup nhạy cảm được hiển thị riêng.", "/simulator", "form"),
      step("Đọc và xác nhận rõ ràng", "Quyết định phải là hành động tường minh, không được chọn sẵn.", "Thực hiện xác nhận trên popup rồi bấm Đồng ý.", "Có event ACCEPTED với cờ sensitive và explicit confirmation.", "/simulator", "form", { kind: "event", decision: "ACCEPTED", sensitive: true }),
      step("Kiểm tra evidence", "Evidence cho biết đây là dữ liệu nhạy cảm và đã xác nhận tường minh.", "Mở Evidence và xem event vừa tạo.", "Chi tiết hiển thị cờ nhạy cảm/xác nhận.", "/evidence"),
    ],
  },
  {
    id: "unavailable", name: "CMP không khả dụng", objective: "Minh họa fail-closed khi CMP không trả lời cho mục đích phi thiết yếu.", actor: "Ứng dụng tích hợp · Hệ thống mô phỏng", srs: "SRS-NFR-06, BRL-06, UC-27",
    steps: [
      step("Bật mô phỏng sự cố", "Đây là system simulation control, không phải thao tác của khách hàng.", "Bật công tắc CMP không phản hồi ở đầu Simulator.", "Control chuyển sang trạng thái bật.", "/simulator", "form"),
      step("Gọi chức năng", "Ứng dụng vẫn gọi CMP.require nhưng không nhận được quyết định.", "Bấm một chức năng cần consent.", "Kết quả UNKNOWN được xử lý như DENIED/fail-closed.", "/simulator", "form"),
      step("Đọc kết quả", "Không có consent event giả được tạo khi CMP không phản hồi.", "Kiểm tra thông báo kết quả và session log.", "Có cảnh báo fail-closed, không có decision mới.", "/simulator", "form"),
      step("Kết thúc sự cố", "Trả môi trường demo về trạng thái bình thường.", "Tắt công tắc CMP không phản hồi.", "Có thể tiếp tục các scenario khác.", "/simulator", "form"),
    ],
  },
]

interface GuidedState {
  scenarioId: string | null
  stepIndex: number
  baselineEventCount: number
  manualDone: Record<number, boolean>
  start: (id: string, eventCount: number) => void
  exit: () => void
  restart: (eventCount: number) => void
  setStep: (index: number) => void
  confirmManual: (index: number, value: boolean) => void
}

export const useGuidedDemo = create<GuidedState>((set, get) => ({
  scenarioId: null,
  stepIndex: 0,
  baselineEventCount: 0,
  manualDone: {},
  start: (scenarioId, baselineEventCount) => set({ scenarioId, stepIndex: 0, baselineEventCount, manualDone: {} }),
  exit: () => set({ scenarioId: null, stepIndex: 0, manualDone: {} }),
  restart: (baselineEventCount) => set({ stepIndex: 0, baselineEventCount, manualDone: {} }),
  setStep: (stepIndex) => set({ stepIndex }),
  confirmManual: (index, value) => set({ manualDone: { ...get().manualDone, [index]: value } }),
}))

function useStepStatus() {
  const events = useStore((s) => s.events)
  const scenarioId = useGuidedDemo((s) => s.scenarioId)
  const stepIndex = useGuidedDemo((s) => s.stepIndex)
  const baseline = useGuidedDemo((s) => s.baselineEventCount)
  const manual = useGuidedDemo((s) => s.manualDone)
  const scenario = DEMO_SCENARIOS.find((x) => x.id === scenarioId)
  const current = scenario?.steps[stepIndex]
  const added = Math.max(0, events.length - baseline)
  const recent = events.slice(0, added)
  let complete = !!manual[stepIndex]
  const verification = current?.verification
  if (verification?.kind === "event") {
    complete = recent.some((e) => e.decision === verification.decision && (!verification.sensitive || (e.sensitive && e.explicitConfirm)))
  }
  return { scenario, current, complete, eventsCount: events.length }
}

function GuideBody({ compact = false, onTabChange }: { compact?: boolean; onTabChange?: (tab: DemoTab) => void }) {
  const nav = useNavigate()
  const { scenario, current, complete, eventsCount } = useStepStatus()
  const stepIndex = useGuidedDemo((s) => s.stepIndex)
  const setStep = useGuidedDemo((s) => s.setStep)
  const confirm = useGuidedDemo((s) => s.confirmManual)
  const restart = useGuidedDemo((s) => s.restart)
  const exit = useGuidedDemo((s) => s.exit)
  if (!scenario || !current) return null
  const go = () => { nav(current.route); if (current.tab && onTabChange) onTabChange(current.tab) }
  const last = stepIndex === scenario.steps.length - 1
  return (
    <div className={cn("flex flex-col gap-3", compact && "gap-2")}>
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>Bước {stepIndex + 1}/{scenario.steps.length}</span><span>{scenario.srs}</span></div>
        <Progress value={((stepIndex + 1) / scenario.steps.length) * 100} className="mt-1.5 h-1.5" />
      </div>
      <div>
        <div className="font-semibold">{current.title}</div>
        {!compact && <div className="mt-1 text-sm text-muted-foreground">{current.explanation}</div>}
      </div>
      <div className="rounded-md border bg-muted/30 p-2.5 text-sm"><b>Thao tác:</b> {current.action}</div>
      {!compact && <div className="rounded-md border border-success/25 bg-success/5 p-2.5 text-sm"><b>Kết quả mong đợi:</b> {current.expected}</div>}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={go}>Đến màn hình thực hiện</Button>
        {current.verification.kind === "manual" ? (
          <Button size="sm" variant={complete ? "secondary" : "outline"} onClick={() => confirm(stepIndex, !complete)}>{complete ? <CheckCircle2 /> : <Circle />}{complete ? "Đã xác nhận" : "Tôi đã hoàn thành bước này"}</Button>
        ) : <span className={cn("text-xs", complete ? "text-success" : "text-muted-foreground")}>{complete ? "✓ Đã xác minh từ state hiện tại" : "Đang chờ thao tác tạo đúng sự kiện"}</span>}
      </div>
      <div className="flex items-center justify-between gap-2 border-t pt-2">
        <Button size="sm" variant="ghost" disabled={stepIndex === 0} onClick={() => setStep(stepIndex - 1)}>Bước trước</Button>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" title="Bắt đầu lại hướng dẫn; không reset dữ liệu nghiệp vụ" onClick={() => restart(eventsCount)}><RotateCcw /> Làm lại</Button>
          <Button size="sm" variant="ghost" onClick={exit}><X /> Thoát</Button>
          {!last ? <Button size="sm" disabled={!complete} onClick={() => setStep(stepIndex + 1)}>Bước tiếp</Button> : <Button size="sm" disabled={!complete} onClick={exit}>Hoàn tất</Button>}
        </div>
      </div>
    </div>
  )
}

export function GuidedDemoPanel({ onTabChange }: { onTabChange: (tab: DemoTab) => void }) {
  const eventsCount = useStore((s) => s.events.length)
  const scenarioId = useGuidedDemo((s) => s.scenarioId)
  const stepIndex = useGuidedDemo((s) => s.stepIndex)
  const start = useGuidedDemo((s) => s.start)
  const scenario = DEMO_SCENARIOS.find((x) => x.id === scenarioId)
  React.useEffect(() => {
    const current = scenario?.steps[stepIndex]
    if (current?.tab) onTabChange(current.tab)
  }, [scenario, stepIndex, onTabChange])
  return (
    <Card className="border-primary/25 bg-primary/[0.025]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Compass className="size-5 text-primary" /> Kịch bản demo nghiệp vụ</CardTitle>
        <CardDescription>Chọn một câu chuyện để được hướng dẫn. Hướng dẫn không tự ghi consent hoặc thay đổi dữ liệu; bạn vẫn thao tác trên UI hiện có.</CardDescription>
      </CardHeader>
      <CardContent>
        {scenario ? <GuideBody onTabChange={onTabChange} /> : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {DEMO_SCENARIOS.map((item) => (
              <button key={item.id} className="rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.03]" onClick={() => { start(item.id, eventsCount); const first = item.steps[0]; if (first.tab) onTabChange(first.tab) }}>
                <div className="font-medium">{item.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.objective}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground"><span>{item.actor}</span><span>{item.steps.length} bước · {item.srs}</span></div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function GuidedDemoDock() {
  const scenarioId = useGuidedDemo((s) => s.scenarioId)
  const location = useLocation()
  const [open, setOpen] = React.useState(false)
  const { scenario, current } = useStepStatus()
  if (!scenarioId || !scenario || !current || location.pathname === "/simulator") return null
  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed right-4 bottom-4 z-40 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-primary/30 bg-background p-3 text-left shadow-lg">
        <div className="flex items-center gap-2 text-sm font-semibold"><Compass className="size-4 text-primary" /> {scenario.name}</div>
        <div className="mt-1 text-xs text-muted-foreground">Bước {useGuidedDemo.getState().stepIndex + 1}/{scenario.steps.length} · {current.title}</div>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{scenario.name}</DialogTitle><DialogDescription>Hướng dẫn vẫn được giữ khi bạn kiểm tra kết quả ở màn hình khác.</DialogDescription></DialogHeader>
          <GuideBody />
        </DialogContent>
      </Dialog>
    </>
  )
}
