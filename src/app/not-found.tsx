import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <div className="text-5xl font-bold">404</div>
      <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
      <Button render={<Link to="/dashboard" />} nativeButton={false}>Về Dashboard</Button>
    </div>
  )
}
