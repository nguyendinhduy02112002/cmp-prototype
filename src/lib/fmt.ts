/** Định dạng và tiện ích dùng chung cho prototype */

const pad = (n: number) => String(n).padStart(2, "0")

/** Hiển thị thời điểm theo giờ Việt Nam (UTC+7) từ ISO UTC */
export function fmtDT(iso?: string, withSec = false) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const v = new Date(d.getTime() + 7 * 3600 * 1000)
  const s = `${pad(v.getUTCDate())}/${pad(v.getUTCMonth() + 1)}/${v.getUTCFullYear()} ${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}`
  return withSec ? `${s}:${pad(v.getUTCSeconds())}` : s
}
export function fmtD(iso?: string) {
  if (!iso) return "—"
  return fmtDT(iso).slice(0, 10)
}
export const nowISO = () => new Date().toISOString()
export const fmtN = (n: number) => n.toLocaleString("vi-VN")
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0)

/** Băm mô phỏng 64 ký tự hex (không phải SHA-256 thật – chỉ để minh họa) */
export function fakeHash(input: string) {
  let out = ""
  for (let k = 0; k < 8; k++) {
    let h = 0x811c9dc5 ^ (k * 0x9e3779b1)
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i)
      h = Math.imul(h, 0x01000193)
    }
    out += (h >>> 0).toString(16).padStart(8, "0")
  }
  return out
}
export const shortHash = (h?: string) => (h ? `${h.slice(0, 10)}…${h.slice(-6)}` : "—")

/** Sinh số ngẫu nhiên có hạt giống để dữ liệu mẫu ổn định giữa các lần tải */
export function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let seq = 1000
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36).slice(-4).toUpperCase()}${(seq++).toString(36).toUpperCase()}`

/** Che dữ liệu kỹ thuật với vai trò xem giới hạn (G) */
export const maskIp = (ip: string) => ip.replace(/\.\d+\.\d+$/, ".***.***")

/** Tỷ lệ tương phản WCAG giữa hai màu hex */
export function contrast(hex1: string, hex2: string) {
  const lum = (hex: string) => {
    const h = hex.replace("#", "")
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const [a, b] = [lum(hex1), lum(hex2)].sort((x, y) => y - x)
  return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100
}
