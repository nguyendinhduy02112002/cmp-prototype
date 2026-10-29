import assert from "node:assert/strict"
import { readPropertySnapshot, validatePropertyInput, type PropertyInput } from "../src/lib/property-data"
import { usePlatformStore } from "../src/lib/platform-store"
import { createEmptyTenantWorkspace, hasPermission, useStore } from "../src/lib/store"

const s = () => useStore.getState()
const ok = (r: { ok: boolean; msg: string }) => assert.equal(r.ok, true, r.msg)
const retail = "tenant-retail"
const base: PropertyInput = { name: "Property kiểm thử MT-3.2", code: "QA-PROPERTY", type: "WEB", origin: "https://qa-property.example.com", description: "Synthetic test data" }

// TC-01/03: Admin creates a valid Website Property; required/technical fields are enforced.
ok(s().setPersona("user-admin"))
const app = s().applications.find((a) => a.status === "ACTIVE")!
const secondApp = s().applications.find((a) => a.status === "ACTIVE" && a.id !== app.id)!
const platformAuditBefore = usePlatformStore.getState().audit.length
const created = s().createProperty(app.id, base, retail, app.id)
ok(created); assert.ok(created.propertyId)
const property = s().properties.find((p) => p.id === created.propertyId)!
assert.equal(property.tenantId, retail); assert.equal(property.applicationId, app.id); assert.equal(property.createdBy, "user-admin")
assert.ok(Object.keys(validatePropertyInput({ ...base, name: "", code: "", origin: "http://bad/path" }, s().properties, app.id).errors).length >= 3)

// TC-02: Mobile type and reverse-domain identifier are supported and validated.
const android = s().createProperty(app.id, { name: "Android QA", code: "QA-ANDROID", type: "ANDROID", packageName: "com.example.cmp.qa" }, retail, app.id)
ok(android)
assert.ok(validatePropertyInput({ name: "Bad Android", code: "BAD-ANDROID", type: "ANDROID", packageName: "invalid" }, s().properties, app.id).errors.packageName)

// TC-04/05: code is unique in one Application but reusable in another Application.
assert.equal(s().createProperty(app.id, { ...base, name: "Duplicate" }, retail, app.id).ok, false)
ok(s().createProperty(secondApp.id, { ...base, name: "Same code, other app", origin: "https://qa-property-2.example.com" }, retail, secondApp.id))

// TC-10/11/15: edit/status preserve ID, relationships and persistence.
const relationshipsBefore = JSON.stringify({ consents: s().consents, banners: s().banners, events: s().events, matrix: s().matrix })
ok(s().updateProperty(app.id, property.id, { ...base, name: "Property QA đã cập nhật", description: "Updated" }, retail, app.id))
ok(s().setPropertyStatus(app.id, property.id, "INACTIVE", retail, app.id))
ok(s().setPropertyStatus(app.id, property.id, "ACTIVE", retail, app.id))
const updated = s().properties.find((p) => p.id === property.id)!
assert.equal(updated.id, property.id); assert.equal(updated.status, "ACTIVE"); assert.ok(updated.updatedBy)
assert.equal(readPropertySnapshot()[retail].some((p) => p.id === property.id), true)
assert.equal(JSON.stringify({ consents: s().consents, banners: s().banners, events: s().events, matrix: s().matrix }), relationshipsBefore)

// TC-12: inactive parent makes effective availability false without mutating child status.
ok(s().setApplicationStatus(app.id, "INACTIVE", retail))
assert.equal(s().properties.find((p) => p.id === property.id)!.status, "ACTIVE")
assert.equal(s().applications.find((a) => a.id === app.id)!.status === "ACTIVE" && updated.status === "ACTIVE", false)
assert.equal(s().createProperty(app.id, { ...base, code: "NO-INACTIVE", origin: "https://inactive.example.com" }, retail, app.id).ok, false)
ok(s().setApplicationStatus(app.id, "ACTIVE", retail))

// TC-09: DPO/Staff default read-only behavior is enforced at store level.
ok(s().setPersona("user-dpo")); assert.equal(hasPermission(s(), "integ", "view"), true); assert.equal(hasPermission(s(), "integ", "edit"), false)
assert.equal(s().updateProperty(app.id, property.id, { ...base, name: "DPO edit" }, retail, app.id).ok, false)

// TC-13: suspended tenant rejects mutation and preserves data.
ok(s().setPersona("user-admin"))
useStore.setState((state) => ({ tenants: state.tenants.map((t) => t.id === retail ? { ...t, status: "SUSPENDED" } : t) }))
assert.equal(s().setPropertyStatus(app.id, property.id, "INACTIVE", retail, app.id).ok, false)
assert.equal(s().properties.find((p) => p.id === property.id)!.status, "ACTIVE")
useStore.setState((state) => ({ tenants: state.tenants.map((t) => t.id === retail ? { ...t, status: "ACTIVE" } : t) }))

// TC-06/07/08/14: tenant switch isolates list and rejects cross-tenant, cross-app and stale mutations.
ok(s().setPersona("user-staff")); ok(s().switchTenant("tenant-finance"))
assert.equal(s().properties.some((p) => p.id === property.id), false)
assert.equal(s().updateProperty(app.id, property.id, base, "tenant-finance", app.id).ok, false)
assert.equal(s().createProperty(app.id, { ...base, code: "STALE-PROPERTY" }, retail, app.id).ok, false)
ok(s().switchTenant(retail)); ok(s().setPersona("user-admin"))
assert.equal(s().updateProperty(secondApp.id, property.id, base, retail, secondApp.id).ok, false)

// TC-16/17/18: empty new workspace, tenant audit context and platform audit isolation.
assert.deepEqual(createEmptyTenantWorkspace().properties, [])
const audit = s().audit.find((a) => a.obj === property.id && a.act === "Tạo Property")!
assert.equal(audit.tenantId, retail); assert.equal(audit.userId, "user-admin"); assert.match(audit.det || "", /applicationId=/)
assert.equal(usePlatformStore.getState().audit.length, platformAuditBefore)

// TC-19/20/21: existing links and MT-3.1/CMP data survive Property operations.
const applicationId = app.id
ok(s().updateApplication(applicationId, { name: app.name + " QA", code: app.code, type: app.type, description: "Application regression" }, retail))
assert.equal(s().properties.find((p) => p.id === property.id)!.applicationId, applicationId)
assert.ok(s().purposes.length && s().consents.length && s().notices.length && s().banners.length && s().matrix.length && s().events.length)

// TC-22 is covered by TypeScript/build plus Browser UAT console inspection; data selectors above remain primitive/useMemo-based.
console.log("TC-01..TC-22 Property management checks passed (TC-22 browser runtime verified separately)")
