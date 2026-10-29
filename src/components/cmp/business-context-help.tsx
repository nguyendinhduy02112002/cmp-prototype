import * as React from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CircleHelp, FlaskConical, Network } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { useCan } from "@/lib/store"
import type { Mod } from "@/lib/perm"
import { cn } from "@/lib/utils"

export interface BusinessContext {
  purpose: string
  when: string
  actors: string
  inputs: string
  outputs: string
  related: string[]
  example?: string
  srs?: string
}

export function BusinessContextHelp({ title, context, className }: { title: string; context: BusinessContext; className?: string }) {
  const rows = [
    ["Mục đích nghiệp vụ", context.purpose],
    ["Khi nào sử dụng", context.when],
    ["Vai trò thực hiện", context.actors],
    ["Đầu vào chính", context.inputs],
    ["Kết quả chính", context.outputs],
    ["Module liên quan", context.related.join(" → ")],
    ...(context.example ? [["Ví dụ", context.example]] : []),
  ]
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" className={cn("gap-1.5", className)} />}>
        <CircleHelp /> Hiểu màn hình này
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Giải thích nghiệp vụ dành cho người mới tìm hiểu CMP{context.srs ? ` · ${context.srs}` : ""}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm sm:grid-cols-[150px_1fr]">
          {rows.map(([label, value]) => (
            <React.Fragment key={label}>
              <div className="font-medium text-muted-foreground">{label}</div>
              <div>{value}</div>
            </React.Fragment>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function RelationshipNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-info/25 bg-info/5 px-3 py-2 text-sm", className)}>
      <Network className="mt-0.5 size-4 shrink-0 text-info" />
      <div>{children}</div>
    </div>
  )
}

export function SimulationNotice({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm", className)}>
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
      <div><b>Mô phỏng — chưa tích hợp hệ thống thực tế.</b>{children ? <> {children}</> : null}</div>
    </div>
  )
}

export interface NextStepLink {
  label: string
  to: string
  description?: string
  mod?: Mod
}

export function WorkflowNextSteps({ title = "Bước nghiệp vụ tiếp theo", links, className }: { title?: string; links: NextStepLink[]; className?: string }) {
  const can = useCan()
  const visible = links.filter((link) => !link.mod || can(link.mod))
  if (!visible.length) return null
  return (
    <Card className={cn("gap-2 border-dashed py-3", className)}>
      <CardContent className="flex flex-wrap items-center gap-2 px-4">
        <span className="mr-1 text-sm font-medium">{title}</span>
        {visible.map((link) => (
          <Button key={link.to + link.label} size="sm" variant="outline" title={link.description} render={<Link to={link.to} />}>
            {link.label}<ArrowRight />
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
