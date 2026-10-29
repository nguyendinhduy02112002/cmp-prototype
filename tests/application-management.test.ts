import assert from "node:assert/strict"
import { readApplicationSnapshot, validateApplicationInput, type ApplicationInput } from "../src/lib/application-data"
import { usePlatformStore } from "../src/lib/platform-store"
import { createEmptyTenantWorkspace, hasPermission, useStore } from "../src/lib/store"

const s = () => useStore.getState()
const ok = (r: { ok: boolean; msg: string }) => assert.equal(r.ok, true, r.msg)
const retailTenant = "tenant-retail"
const base: ApplicationInput = { name: "Ứng dụng kiểm thử", code: "QA-APP", type: "WEB", description: "MT-3.1" }

// TC-01: authorized Admin creates an Inactive Application with stable tenant ownership.
ok(s().setPersona("user-admin"))
const platformAuditBefore = usePlatformStore.getState().audit.length
const created = s().createApplication(base, retailTenant)
ok(created); assert.ok(created.applicationId)
const app = s().applications.find((a) => a.id === created.applicationId)!
assert.equal(app.tenantId, retailTenant); assert.equal(app.status, "INACTIVE"); assert.equal(app.createdBy, "user-admin")

// TC-02/03: required fields and same-tenant duplicate code are rejected.
assert.ok(Object.keys(validateApplicationInput({ ...base, name: "", code: "" }, s().applications).errors).length >= 2)
assert.equal(s().createApplication({ ...base, name: "Tên khác" }, retailTenant).ok, false)

// TC-11/12: Tenant Audit contains immutable context; Platform Audit is untouched.
const createAudit = s().audit.find((a) => a.obj === created.applicationId && a.act === "Đăng ký ứng dụng")!
assert.equal(createAudit.tenantId, retailTenant); assert.equal(createAudit.userId, "user-admin"); assert.equal(createAudit.role, "Admin")
assert.equal(usePlatformStore.getState().audit.length, platformAuditBefore)

// TC-10: prototype persistence snapshot contains the created app.
assert.equal(readApplicationSnapshot()[retailTenant].some((a) => a.id === created.applicationId), true)

// TC-04/05/09: same code is valid in another tenant and directories remain isolated through switching.
ok(s().setPersona("user-staff")); ok(s().switchTenant("tenant-finance"))
const financeCreated = s().createApplication({ ...base, name: "Finance QA" }, "tenant-finance")
ok(financeCreated)
assert.equal(s().applications.some((a) => a.id === created.applicationId), false)
assert.equal(s().applications.some((a) => a.id === financeCreated.applicationId), true)

// TC-06/07: Tenant A ID cannot resolve or mutate under Tenant B.
assert.equal(s().applications.find((a) => a.id === created.applicationId), undefined)
assert.equal(s().updateApplication(created.applicationId!, { ...base, name: "Cross tenant" }, "tenant-finance").ok, false)

// TC-17: stale Tenant A dialog context is rejected after switching to Tenant B.
assert.equal(s().createApplication({ ...base, code: "STALE-APP" }, retailTenant).ok, false)

// TC-08: default DPO is view-only; effective-role resolver remains authoritative.
ok(s().switchTenant(retailTenant)); ok(s().setPersona("user-dpo"))
assert.equal(hasPermission(s(), "integ", "view"), true); assert.equal(hasPermission(s(), "integ", "edit"), false)
assert.equal(s().updateApplication(created.applicationId!, { ...base, name: "DPO edit" }, retailTenant).ok, false)

// TC-13: suspended tenant blocks mutation.
ok(s().setPersona("user-admin"))
useStore.setState((state) => ({ tenants: state.tenants.map((t) => t.id === retailTenant ? { ...t, status: "SUSPENDED" } : t) }))
assert.equal(s().createApplication({ ...base, code: "SUSPENDED-APP" }, retailTenant).ok, false)
useStore.setState((state) => ({ tenants: state.tenants.map((t) => t.id === retailTenant ? { ...t, status: "ACTIVE" } : t) }))

// TC-14/15/18: update/status preserve IDs, existing references and historical tenant data.
const relationsBefore = JSON.stringify({ consents: s().consents.map((c) => c.apps), matrix: s().matrix.map((m) => m.app), events: s().events.map((e) => e.app) })
ok(s().updateApplication(created.applicationId!, { ...base, name: "Ứng dụng kiểm thử mới", description: "Đã cập nhật" }, retailTenant))
ok(s().setApplicationStatus(created.applicationId!, "ACTIVE", retailTenant))
ok(s().setApplicationStatus(created.applicationId!, "INACTIVE", retailTenant))
const after = s().applications.find((a) => a.id === created.applicationId)!
assert.equal(after.id, created.applicationId); assert.equal(after.status, "INACTIVE"); assert.ok(after.activatedAt)
assert.equal(JSON.stringify({ consents: s().consents.map((c) => c.apps), matrix: s().matrix.map((m) => m.app), events: s().events.map((e) => e.app) }), relationsBefore)

// TC-16: newly provisioned workspace remains empty.
assert.deepEqual(createEmptyTenantWorkspace().applications, [])

console.log("TC-01..TC-18 Application management checks passed")
