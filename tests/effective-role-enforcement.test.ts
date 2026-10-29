import assert from "node:assert/strict"
import { getApprovals, hasPermission, useStore } from "../src/lib/store"
import { PERM_DEFAULT, resolveEffectivePermissions } from "../src/lib/perm"

const state = () => useStore.getState()
const expectOk = (result: { ok: boolean; msg: string }) => assert.equal(result.ok, true, result.msg)

// Reach the multi-role Health membership (Admin + DPO).
expectOk(state().setPersona("user-admin"))
expectOk(state().switchTenant("tenant-health"))
expectOk(state().setPersona("user-health-admin"))

// TC-01: effective DPO gets DPO permissions only (project role equivalent to the Auditor example).
expectOk(state().setRole("DPO"))
assert.equal(hasPermission(state(), "setup", "approve"), true)
assert.equal(hasPermission(state(), "users", "edit"), false)

// TC-02: switching to Admin immediately changes available actions.
expectOk(state().setRole("Admin"))
assert.equal(hasPermission(state(), "users", "edit"), true)
assert.equal(hasPermission(state(), "setup", "approve"), false)

// TC-06: approval action itself enforces the effective role, not the role union.
const request = getApprovals(state()).find((item) => item.mod === "setup" && item.by !== "Đặng Hải An")
assert.ok(request, "Expected a seeded setup approval request")
assert.equal(state().approve(request.id, "Kiểm tra effective role Admin").ok, false)
expectOk(state().setRole("DPO"))
assert.equal(state().approve(request.id, "DPO phê duyệt bằng effective role hợp lệ").ok, true)

// TC-07: new audit events carry tenant, user and selected effective role.
state().log("Kiểm tra effective role", "TC-07")
const audit = state().audit[0]
assert.equal(audit.tenantId, "tenant-health")
assert.equal(audit.userId, "user-health-admin")
assert.equal(audit.role, "DPO")

// TC-10: switching roles never changes tenant business data.
const beforeData = JSON.stringify({ purposes: state().purposes, consents: state().consents, events: state().events })
expectOk(state().setRole("Admin"))
expectOk(state().setRole("DPO"))
assert.equal(JSON.stringify({ purposes: state().purposes, consents: state().consents, events: state().events }), beforeData)

// TC-08: a user without a target membership cannot enter that workspace.
assert.equal(state().switchTenant("tenant-finance").ok, false)
assert.equal(state().currentTenantId, "tenant-health")

// TC-03: a stale role from Tenant A cannot survive switching to Tenant B.
// Simulate restored context for user-admin: Staff in Health, Admin in Retail.
useStore.setState({ currentUserId: "user-admin", role: "DPO" })
expectOk(state().switchTenant("tenant-retail"))
assert.equal(state().role, "Admin")
assert.equal(hasPermission(state(), "setup", "approve"), false)
assert.equal(hasPermission(state(), "users", "edit"), true)

// TC-04: an unassigned role selection is centrally rejected.
const invalid = state().setRole("DPO")
assert.equal(invalid.ok, false)
assert.equal(state().role, "Admin")

// TC-05: stale/invalid role context fails closed before any UI correction.
const adminMembership = state().getCurrentMembership()
const stale = resolveEffectivePermissions(adminMembership, "DPO", PERM_DEFAULT)
assert.equal(stale.setup.approve, false)
assert.equal(stale.users.view, false)

// TC-09: existing single-role users retain their assigned-role permissions.
expectOk(state().setPersona("user-staff"))
assert.equal(state().role, "Nhân viên")
assert.equal(hasPermission(state(), "setup", "edit"), true)
assert.equal(hasPermission(state(), "setup", "approve"), false)
assert.equal(hasPermission(state(), "users", "view"), false)

console.log("TC-01..TC-10 effective-role enforcement checks passed")
