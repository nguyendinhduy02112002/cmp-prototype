# MT-3.2 Property Management Architecture Plan

## 1. Current architecture

MT-1 introduced `TenantProperty` with `id`, `name` and `applicationId`. MT-3.1 added tenant-owned Applications and a legacy `propertyId/property` display pair on Application. This represents a one-to-one seed relationship and cannot support the approved Tenant → Application → many Properties hierarchy.

## 2. Requirement baseline and decision

UC-08 requires Organization → Brand → Property, Admin management, names 1–100 characters unique within the parent, audit, tenant isolation and archival only when no Active Application remains. UC-06 requires an Application to reference a Property. The explicit MT-3.2 PO decision establishes Application as the parent of Property for the prototype. This plan follows that approved hierarchy while preserving all existing IDs and references. Brand remains deferred because no Brand model exists in the approved MT-3 roadmap.

WEB is supported by UC-06 origin semantics. ANDROID and IOS are prototype extensions required by the approved target model and current mobile demo. They use optional platform-specific identifiers and are documented as product design, not SRS requirements.

## 3. Property model

`TenantProperty` is extended with tenant ID, immutable owning Application ID, code, type, technical identifier fields, description, status and audit metadata. Internal ID never derives from a mutable domain, origin, package name or bundle ID.

Existing `property-1..3` IDs and `applicationId` references are migrated deterministically. Existing Banner and Event relationships currently store Property display names; metadata edits therefore preserve the legacy name relationship in this milestone to avoid silently breaking historical records. MT-3.3 should migrate configuration references to Property ID.

## 4. Application migration

Property becomes the ownership source of truth. The legacy Application `propertyId/property` fields remain optional compatibility fields for old persisted data and display fallback. New Applications no longer require or automatically create a Property. Existing Applications keep their IDs and their migrated Properties.

## 5. Validation

- Name required, 1–100 characters, unique inside the owning Application.
- Code required, 1–50 uppercase letters/numbers/hyphens, unique inside the owning Application.
- WEB requires `https://host[:port]` with no path, query, fragment or wildcard.
- ANDROID requires a reverse-domain package name.
- IOS requires a reverse-domain bundle ID.
- Description maximum 500 characters.
- Technical identifiers are unique within the tenant to avoid ambiguous future deployment resolution.

## 6. Ownership and availability

All actions validate active tenant, effective permission, captured tenant/application context, Application ownership and Property ownership. Create is rejected when the parent Application is INACTIVE. Edit/status remain available for historical administration. Effective availability is true only when Tenant, Application and Property are all ACTIVE; no parent status change mutates child status.

## 7. RBAC audit and persistence

Property Management reuses `integ.view/edit`. Admin manages by default; DPO and Staff are read-only. Actions write Tenant Audit and never Platform Audit. A versioned localStorage snapshot keyed by tenant ID persists Property arrays and overlays deterministic seed migration without overwriting user-created Properties.

## 8. UI and routing

Application Detail contains a Properties section with search/filter/table/create. Property Detail uses `/applications/:applicationId/properties/:propertyId`, resolves both owners inside the active tenant, and provides edit/status actions. Future assignment, publishing and SDK areas are clearly marked deferred.

## 9. Regression risks

- Legacy Application→Property display fields becoming stale.
- Banner/Event records refer to Property name rather than ID.
- Persisted MT-3.1 Applications may reference old Property IDs.
- Stale dialogs after tenant or route switching.
- Selectors returning new arrays and causing render loops.

Mitigations are deterministic migration, stable primitive selectors, `useMemo` for filtered lists, captured context guards and preservation of historical display-name relationships.

## 10. Integration readiness and open questions

MT-3.3 should use `property.id` for Consent/Banner assignment and migrate Banner ownership from `site` text. MT-3.4/MT-4 should consume effective availability and technical identifiers but generate separate deployment/config IDs.

Open decisions: whether Brand becomes a first-class object; whether technical identifier changes require deployment invalidation; whether Property archival differs from INACTIVE; and whether tenant-wide uniqueness of origin/package/bundle should become platform-wide uniqueness.
