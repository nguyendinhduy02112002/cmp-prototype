import type { Role, TenantMembership } from "./types"

/** Nhóm chức năng trong ma trận phân quyền (SRS 4.2, SCR-08-03) */
export const MODULES = [
  ["dash", "Dashboard"],
  ["notif", "Chuông, Trung tâm thông báo"],
  ["setup", "Mục đích, consent, phiên bản thông báo, quy tắc, ma trận phụ thuộc"],
  ["banner", "Banner, popup"],
  ["records", "Bản ghi, lịch sử consent, bằng chứng"],
  ["evidence", "Xuất gói bằng chứng"],
  ["offline", "Ghi nhận consent ngoại tuyến"],
  ["import", "Import consent kế thừa"],
  ["sim", "Mô phỏng thu thập consent"],
  ["rights", "Yêu cầu quyền của chủ thể"],
  ["users", "Người dùng, vai trò, phân quyền"],
  ["audit", "Nhật ký kiểm toán"],
  ["integ", "Ứng dụng T3, connector, event"],
  ["settings", "Khóa ký, cảnh báo, lượng dùng"],
] as const
export type Mod = (typeof MODULES)[number][0]
export type Act = "view" | "edit" | "approve"
export type PermMatrix = Record<Role, Record<Mod, Record<Act, boolean>>>
export type EffectivePermissions = PermMatrix[Role]

/** Nhóm cho phép bật quyền Phê duyệt (đối tượng cần DPO duyệt – SRS 4.3.1) */
export const APPROVABLE: Mod[] = ["setup", "banner", "import", "rights"]

const P = (view: 0 | 1, edit: 0 | 1, approve: 0 | 1) => ({ view: !!view, edit: !!edit, approve: !!approve })

/** Ma trận mặc định khi khởi tạo tenant (SRS 4.2). Admin mặc định KHÔNG có quyền Phê duyệt. */
export const PERM_DEFAULT: PermMatrix = {
  Admin: { dash: P(1, 0, 0), notif: P(1, 0, 0), setup: P(1, 1, 0), banner: P(1, 1, 0), records: P(1, 0, 0), evidence: P(0, 0, 0), offline: P(1, 0, 0), import: P(1, 1, 0), sim: P(1, 0, 0), rights: P(1, 0, 0), users: P(1, 1, 0), audit: P(1, 0, 0), integ: P(1, 1, 0), settings: P(1, 1, 0) },
  DPO: { dash: P(1, 0, 0), notif: P(1, 0, 0), setup: P(1, 0, 1), banner: P(1, 0, 1), records: P(1, 0, 0), evidence: P(1, 1, 0), offline: P(1, 0, 0), import: P(1, 0, 1), sim: P(1, 0, 0), rights: P(1, 0, 1), users: P(1, 0, 0), audit: P(1, 0, 0), integ: P(1, 0, 0), settings: P(1, 0, 0) },
  "Nhân viên": { dash: P(1, 0, 0), notif: P(1, 0, 0), setup: P(1, 1, 0), banner: P(1, 1, 0), records: P(1, 0, 0), evidence: P(0, 0, 0), offline: P(1, 1, 0), import: P(1, 1, 0), sim: P(1, 0, 0), rights: P(1, 1, 0), users: P(0, 0, 0), audit: P(0, 0, 0), integ: P(1, 0, 0), settings: P(0, 0, 0) },
}

const DENY = () => ({ view: false, edit: false, approve: false })
const DENY_ALL: EffectivePermissions = Object.fromEntries(MODULES.map(([mod]) => [mod, DENY()])) as EffectivePermissions

/**
 * Resolve exactly one effective role inside the active tenant membership.
 * Invalid, inactive or stale role context always fails closed.
 */
export function resolveEffectivePermissions(
  membership: TenantMembership | undefined,
  effectiveRole: Role,
  matrix: PermMatrix,
): EffectivePermissions {
  if (!membership || membership.status !== "ACTIVE" || !membership.roles.includes(effectiveRole)) return DENY_ALL
  return matrix[effectiveRole] || DENY_ALL
}

/** Preserve a requested role only when the target membership authorizes it. */
export function resolveEffectiveRole(membership: TenantMembership | undefined, requestedRole: Role): Role | null {
  if (!membership || membership.status !== "ACTIVE") return null
  return membership.roles.includes(requestedRole) ? requestedRole : membership.roles[0] || null
}

export function canWithEffectiveRole(
  membership: TenantMembership | undefined,
  effectiveRole: Role,
  matrix: PermMatrix,
  mod: Mod,
  act: Act = "view",
) {
  return resolveEffectivePermissions(membership, effectiveRole, matrix)[mod][act]
}

/** Ô bị khóa trên ma trận: nhóm quản trị người dùng luôn thuộc Admin (SRS 4.2) */
export const lockedCell = (mod: Mod) => mod === "users"

export const ROLES: Role[] = ["Admin", "DPO", "Nhân viên"]
export const ROLE_DESC: Record<Role, string> = {
  Admin: "Quản trị tenant, người dùng, ma trận phân quyền, ứng dụng T3, khóa ký, connector. Mặc định không phê duyệt.",
  DPO: "Phê duyệt hoặc trả lại đề nghị, xuất bản phiên bản thông báo, xuất gói bằng chứng, xem nhật ký kiểm toán.",
  "Nhân viên": "Tạo, sửa, xóa bản nháp và gửi duyệt; ghi nhận ngoại tuyến, import; tra cứu ở mức giới hạn.",
}
