import assert from "node:assert/strict"
import { PLATFORM_ACTORS } from "../src/lib/platform-data"
import { usePlatformStore } from "../src/lib/platform-store"
import { defaultTenantSettings, sanitizeTenantSettings } from "../src/lib/tenant-settings-data"
import { useTenantSettingsStore } from "../src/lib/tenant-settings-store"
import { hasPermission, useStore } from "../src/lib/store"

const ts = () => useStore.getState()
const ss = () => useTenantSettingsStore.getState()
const ps = () => usePlatformStore.getState()
const ok = (r: { ok: boolean; msg: string }) => assert.equal(r.ok, true, r.msg)

// TC-01, TC-04, TC-05: Retail Admin can access/edit settings and profile comes from tenant registry.
ok(ts().setPersona("user-admin"))
assert.equal(hasPermission(ts(), "settings", "view"), true)
assert.equal(hasPermission(ts(), "settings", "edit"), true)
assert.equal(ts().getCurrentTenant()?.code, "ABC-RETAIL")
assert.equal("code" in ss().getForTenant("tenant-retail"), false)

const businessBefore = JSON.stringify({ consents: ts().consents, events: ts().events, packages: ts().packages })
const platformAuditBefore = ps().audit.length
const retailInput = { ...defaultTenantSettings("tenant-retail"), defaultLanguage: "vi" as const, timeZone: "Asia/Ho_Chi_Minh" as const, dateFormat: "YYYY-MM-DD" as const, privacyContactName: "Retail Privacy", privacyContactEmail: "privacy@retail.test", privacyContactPhone: "+84 28 1234 5678", privacyContactDepartment: "Pháp chế" }
const { tenantId: _retailId, updatedAt: _retailAt, ...retailEditable } = retailInput
void _retailId; void _retailAt
ok(ss().saveForTenant("tenant-retail", retailEditable))

// TC-06, TC-13, TC-14, TC-17: save works, tenant audit gets field identifiers only, platform audit/business data unchanged.
assert.equal(ss().getForTenant("tenant-retail").dateFormat, "YYYY-MM-DD")
const settingsAudit = ts().audit[0]
assert.equal(settingsAudit.tenantId, "tenant-retail")
assert.equal(settingsAudit.userId, "user-admin")
assert.equal(settingsAudit.role, "Admin")
assert.match(settingsAudit.det || "", /^fields=/)
assert.equal((settingsAudit.det || "").includes("privacy@retail.test"), false)
assert.equal(ps().audit.length, platformAuditBefore)
assert.equal(JSON.stringify({ consents: ts().consents, events: ts().events, packages: ts().packages }), businessBefore)

// TC-02: DPO can view but store-level edit is rejected.
ok(ts().setPersona("user-dpo"))
assert.equal(hasPermission(ts(), "settings", "view"), true)
assert.equal(hasPermission(ts(), "settings", "edit"), false)
assert.equal(ss().saveForTenant("tenant-retail", retailEditable).ok, false)

// TC-03: Platform actor has no tenant membership/settings privilege.
const platformAdmin = PLATFORM_ACTORS.find((a) => a.id === "platform-admin")!
assert.equal(ts().memberships.some((m) => m.userId === platformAdmin.id), false)

// TC-08, TC-09: Finance settings are independent and load with Finance context.
ok(ts().setPersona("user-staff")); ok(ts().switchTenant("tenant-finance"))
const finance = defaultTenantSettings("tenant-finance")
assert.equal(finance.defaultLanguage, "en"); assert.equal(finance.timeZone, "Asia/Singapore")
ok(ss().saveForTenant("tenant-finance", { ...finance, privacyContactDepartment: "Risk Office" }))
assert.equal(ss().getForTenant("tenant-retail").privacyContactDepartment, "Pháp chế")
assert.equal(ss().getForTenant("tenant-finance").privacyContactDepartment, "Risk Office")

// TC-10, TC-18: effective role immediately changes settings permission without changing MT-1 data.
ok(ts().switchTenant("tenant-retail")); ok(ts().setPersona("user-admin")); ok(ts().switchTenant("tenant-health")); ok(ts().setPersona("user-health-admin"))
ok(ts().setRole("Admin")); assert.equal(hasPermission(ts(), "settings", "edit"), true)
ok(ts().setRole("DPO")); assert.equal(hasPermission(ts(), "settings", "view"), true); assert.equal(hasPermission(ts(), "settings", "edit"), false)

// TC-11: invalid persisted-like payload is sanitized deterministically.
const safe = sanitizeTenantSettings("tenant-retail", { defaultLanguage: "xx", timeZone: "Mars/Olympus", dateFormat: "broken", privacyContactEmail: "not-email" })
assert.equal(safe.defaultLanguage, "vi"); assert.equal(safe.timeZone, "Asia/Ho_Chi_Minh"); assert.equal(safe.dateFormat, "DD/MM/YYYY"); assert.equal(safe.privacyContactEmail, "")

// TC-12: platform creation keeps business workspace empty and settings can be deterministically initialized without membership.
ps().setActor("platform-admin")
const created = ps().createTenant({ name: "Settings Test Tenant", code: "SETTINGS-TEST" })
assert.equal(created.ok, true); assert.ok(created.tenantId)
const createdSettings = ss().ensureTenant(created.tenantId!)
assert.deepEqual(createdSettings, defaultTenantSettings(created.tenantId!))
const workspace = ts().getWorkspace(created.tenantId!)!
assert.deepEqual({ purposes: workspace.purposes, consents: workspace.consents, events: workspace.events, audit: workspace.audit }, { purposes: [], consents: [], events: [], audit: [] })
assert.equal(ts().memberships.some((m) => m.tenantId === created.tenantId), false)

// TC-15, TC-16: suspension blocks save/access contract and reactivation preserves settings.
useStore.setState({ currentTenantId: "tenant-retail", currentUserId: "user-admin", role: "Admin", ...ts().workspaces["tenant-retail"] })
ok(ps().setTenantStatus("tenant-retail", "SUSPENDED"))
assert.equal(ss().saveForTenant("tenant-retail", retailEditable).ok, false)
assert.equal(ss().getForTenant("tenant-retail").privacyContactDepartment, "Pháp chế")
ok(ps().setTenantStatus("tenant-retail", "ACTIVE"))
assert.equal(ss().getForTenant("tenant-retail").dateFormat, "YYYY-MM-DD")

console.log("TC-01..TC-18 tenant settings checks passed")
