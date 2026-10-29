import { Link } from "react-router-dom"
import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

/** Trang 403 khi vai trò không có quyền xem (SRS-IF-04; dựa trên errors/forbidden của template) */
export default function Forbidden() {
  const role = useStore((s) => s.role)
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <ShieldX className="size-12 text-muted-foreground" />
      <div className="text-5xl font-bold">403</div>
      <h1 className="text-xl font-semibold">Vai trò {role} không có quyền xem màn hình này</h1>
      <p className="text-sm text-muted-foreground">Menu chỉ hiển thị theo ma trận phân quyền; truy cập trái phép được ghi nhật ký truy cập thất bại (mục 4.2).</p>
      <Button render={<Link to="/dashboard" />} nativeButton={false}>Về Dashboard</Button>
    </div>
  )
}
