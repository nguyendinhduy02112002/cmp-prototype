import assert from "node:assert/strict"
import { readPropertySnapshot } from "../src/lib/property-data"
import { usePlatformStore } from "../src/lib/platform-store"
import { useStore } from "../src/lib/store"

const s = () => useStore.getState()
const ok = (r: { ok: boolean; msg: string }) => assert.equal(r.ok, true, r.msg)
const tenantId = "tenant-retail"
ok(s().setPersona("user-admin"))
const application = s().applications.find((a) => a.status === "ACTIVE")!
const property = s().properties.find((p) => p.applicationId === application.id && p.status === "ACTIVE")!
const consent = s().consents.find((c) => c.status === "Hoạt động")!
const banner = s().banners.find((b) => b.versions.some((v) => v.status === "Hoạt động"))!
const platformAuditBefore = usePlatformStore.getState().audit.length

// Assignment only accepts DPO-approved configurations and keeps stable relationship IDs.
const draftCode = s().createBanner("consent", "Banner chưa duyệt demo", property.name)
assert.ok(draftCode)
assert.equal(s().assignPropertyIntegration(application.id, property.id, consent.code, draftCode, tenantId).ok, false)
ok(s().assignPropertyIntegration(application.id, property.id, consent.code, banner.code, tenantId))
let configured = s().properties.find((p) => p.id === property.id)!
assert.deepEqual({ consent: configured.integration?.consentCode, banner: configured.integration?.bannerCode, status: configured.integration?.status }, { consent: consent.code, banner: banner.code, status: "DRAFT" })

// Mock publish creates a stable deployment ID and increments configuration version.
ok(s().publishPropertyIntegration(application.id, property.id, tenantId))
configured = s().properties.find((p) => p.id === property.id)!
const deploymentId = configured.integration?.deploymentId
assert.ok(deploymentId); assert.equal(configured.integration?.version, 1); assert.equal(configured.integration?.status, "PUBLISHED")
ok(s().publishPropertyIntegration(application.id, property.id, tenantId))
configured = s().properties.find((p) => p.id === property.id)!
assert.equal(configured.integration?.deploymentId, deploymentId); assert.equal(configured.integration?.version, 2)
assert.equal(readPropertySnapshot()[tenantId].find((p) => p.id === property.id)?.integration?.deploymentId, deploymentId)

// Simulator accept and withdraw generate consistent Records/Evidence events for the selected Property.
const subject = "KH-DEMO-FLOW-001"
const accepted = s().recordDecision({ subject, consent: consent.code, decision: "ACCEPTED", channel: `Deployment ${deploymentId}`, app: application.id, propertyId: property.id })
assert.equal(accepted.property, property.name); assert.equal(accepted.app, application.id); assert.equal(accepted.decision, "ACCEPTED")
assert.equal(s().events.find((e) => e.id === accepted.id)?.id, accepted.id)
const withdrawn = s().recordDecision({ subject, consent: consent.code, decision: "WITHDRAWN", channel: "Preference Center", app: application.id, propertyId: property.id, source: "Preference Center" })
assert.equal(withdrawn.property, property.name); assert.equal(withdrawn.decision, "WITHDRAWN")

// Evidence package reuses the same event IDs under DPO permission.
ok(s().setPersona("user-dpo"))
const pkg = s().exportPackage({ reason: "Kiểm toán nội bộ", scope: `Demo ${subject}`, subject, events: [accepted.id, withdrawn.id] })
assert.deepEqual(pkg.events, [accepted.id, withdrawn.id])

// Tenant Audit receives lifecycle and decision actions; Platform Audit remains isolated.
assert.ok(s().audit.some((a) => a.act === "Gán cấu hình consent" && a.obj === property.id))
assert.ok(s().audit.some((a) => a.act === "Publish cấu hình Property" && a.obj === property.id))
assert.ok(s().audit.some((a) => a.act === "Rút lại consent trong Simulator" && a.obj === withdrawn.id))
assert.equal(usePlatformStore.getState().audit.length, platformAuditBefore)

// Tenant switching removes access to the selected Property/deployment.
ok(s().setPersona("user-staff")); ok(s().switchTenant("tenant-finance"))
assert.notEqual(s().properties.find((p) => p.id === property.id)?.integration?.deploymentId, deploymentId)
assert.equal(s().publishPropertyIntegration(application.id, property.id, "tenant-finance").ok, false)

console.log("MT-3 demo flow focused regression passed")
