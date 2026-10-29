import assert from "node:assert/strict"
import { PLATFORM_ACTORS } from "../src/lib/platform-data"
import { canPlatform, usePlatformStore } from "../src/lib/platform-store"
import { hasPermission, useStore } from "../src/lib/store"

const ps = () => usePlatformStore.getState()
const ts = () => useStore.getState()
const admin = PLATFORM_ACTORS.find((a) => a.id === "platform-admin")!
const viewer = PLATFORM_ACTORS.find((a) => a.id === "platform-viewer")!
const tenantOnly = PLATFORM_ACTORS.find((a) => a.id === "tenant-only-admin")!

// TC-01, TC-02, TC-03: platform roles are independent and deterministic.
assert.equal(canPlatform(admin, "tenants.create"), true)
assert.equal(canPlatform(viewer, "tenants.view"), true)
assert.equal(canPlatform(viewer, "tenants.create"), false)
assert.equal(canPlatform(viewer, "tenants.edit"), false)
assert.equal(canPlatform(tenantOnly, "dashboard.view"), false)

// TC-04: a platform actor has no tenant membership merely because of platform role.
assert.equal(ts().memberships.some((m) => m.userId === admin.id), false)

// TC-05, TC-06: create an empty isolated tenant and enforce unique code.
ps().setActor(admin.id)
const created = ps().createTenant({ name: "Công ty Kiểm thử", code: "QA-TENANT", description: "Isolated" })
assert.equal(created.ok, true)
assert.ok(created.tenantId)
const newWorkspace = ts().getWorkspace(created.tenantId!)!
assert.deepEqual({ purposes: newWorkspace.purposes, consents: newWorkspace.consents, events: newWorkspace.events, audit: newWorkspace.audit }, { purposes: [], consents: [], events: [], audit: [] })
assert.equal(ts().memberships.some((m) => m.tenantId === created.tenantId), false)
assert.equal(ps().createTenant({ name: "Trùng mã", code: "QA-TENANT" }).ok, false)

// TC-07: metadata update changes the registry used by both platform and tenant stores.
assert.equal(ps().updateTenant(created.tenantId!, { name: "Công ty Kiểm thử Mới", description: "Updated", contactEmail: "privacy@qa.test" }).ok, true)
assert.equal(ps().tenants.find((t) => t.id === created.tenantId)?.name, "Công ty Kiểm thử Mới")
assert.equal(ts().tenants.find((t) => t.id === created.tenantId)?.name, "Công ty Kiểm thử Mới")

// TC-08, TC-09: suspension blocks normal access and preserves tenant workspace data.
newWorkspace.purposes.push({ code: "P-KEEP" } as never)
useStore.setState((s) => ({ workspaces: { ...s.workspaces, [created.tenantId!]: newWorkspace } }))
assert.equal(ps().setTenantStatus(created.tenantId!, "SUSPENDED").ok, true)
assert.equal(ts().switchTenant(created.tenantId!).ok, false)
assert.equal(ts().getWorkspace(created.tenantId!)?.purposes.length, 1)

// TC-10, TC-11: lifecycle actions are platform-audited without contact/personal data.
const actions = new Set(ps().audit.filter((e) => e.targetTenantId === created.tenantId).map((e) => e.action))
assert.equal(actions.has("TENANT_CREATED"), true)
assert.equal(actions.has("TENANT_UPDATED"), true)
assert.equal(actions.has("TENANT_SUSPENDED"), true)
assert.equal(JSON.stringify(ps().audit).includes("privacy@qa.test"), false)

// TC-12: platform role never changes tenant effective permission resolution.
const before = hasPermission(ts(), "setup", "edit")
ps().setActor(viewer.id)
assert.equal(hasPermission(ts(), "setup", "edit"), before)

// TC-13, TC-14: existing tenant isolation/effective-role enforcement remains intact.
useStore.setState({ currentTenantId: "tenant-health", currentUserId: "user-health-admin", role: "DPO", ...ts().workspaces["tenant-health"] })
assert.equal(hasPermission(ts(), "setup", "approve"), true)
assert.equal(hasPermission(ts(), "users", "edit"), false)
assert.notEqual(ts().workspaces["tenant-retail"], ts().workspaces["tenant-health"])

// TC-15: invalid platform actor fails closed.
assert.equal(ps().setActor("invalid-platform-context"), false)
assert.equal(ps().getActor()?.role, null)
assert.equal(canPlatform(ps().getActor(), "dashboard.view"), false)

console.log("TC-01..TC-15 platform administration checks passed")
