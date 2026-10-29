# MT-2.3 Tenant Settings and Organization Configuration Report

**Ngày hoàn thành:** 28/10/2026  
**Trạng thái:** Implemented; TC-01..TC-18 pass; browser UAT chính đã thực thi và pass sau defect fix.

## 1. Implementation summary

MT-2.3 thay màn `/settings` mô phỏng cũ bằng Tenant Settings functional, gồm:

- Organization Profile đọc trực tiếp từ shared tenant registry.
- General Settings: default language, time zone, date format.
- Privacy Contact Configuration.
- Save/cancel, unsaved indicator, validation, toast và read-only UX.
- Persistence theo tenant ID.
- Effective-role enforcement qua module permission `settings` hiện có.
- Tenant audit dùng ledger hiện có; không ghi Platform Audit.
- New-tenant default initialization trong MT-2.2 create flow.
- Suspension enforcement tiếp tục dùng MT-2.2 tenant lifecycle guard.

Không triển khai Tenant membership, Application/Property CRUD, SDK hoặc backend.

## 2. Modified files

- `src/lib/tenant-settings-data.ts`: model, defaults, persistence, sanitation và tenant-aware date formatting.
- `src/lib/tenant-settings-store.ts`: tenant-scoped Zustand store, validation, permission guard và tenant audit integration.
- `src/app/tenant-settings.tsx`: Organization Profile, General Settings và Privacy Contact UI.
- `src/lib/platform-store.ts`: khởi tạo default settings khi tạo tenant.
- `src/config/routes.tsx`: `/settings` dùng functional Tenant Settings page.
- `src/config/nav.ts`: đổi navigation thành `Cài đặt tenant`, bỏ nhãn mô phỏng.
- `src/components/site-header.tsx`: hiển thị language/time zone của tenant active.
- `tests/tenant-settings.test.ts`: automated TC-01..TC-18.
- `docs/prototype-implementation/mt-2-3-tenant-settings-report.md`: báo cáo này.

## 3. Tenant Settings data model

```ts
interface TenantSettings {
  tenantId: string
  defaultLanguage: "vi" | "en"
  timeZone: "Asia/Ho_Chi_Minh" | "Asia/Singapore" | "UTC"
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"
  privacyContactName: string
  privacyContactEmail: string
  privacyContactPhone: string
  privacyContactDepartment: string
  updatedAt?: string
}
```

State là `Record<tenantId, TenantSettings>`, không có settings object global dùng chung.

Defaults deterministic:

- Tenant mới: Vietnamese, `Asia/Ho_Chi_Minh`, `DD/MM/YYYY`, privacy contact rỗng.
- ABC Retail/Health: cùng general defaults trên.
- ABC Finance: English, `Asia/Singapore`, `DD/MM/YYYY` để minh họa isolation.
- Không tạo personal data, membership hoặc business record.

## 4. Field ownership decisions

| Field | Owner | Tenant Settings |
|---|---|---|
| Tenant ID | Platform | Read-only |
| Tenant code | Platform | Read-only |
| Organization name | Platform | Read-only |
| Organization description | Platform | Read-only |
| Organization contact email | Platform | Read-only |
| Tenant lifecycle status | Platform | Read-only |
| Platform role assignments | Platform | Không hiển thị/chỉnh sửa |
| Language/time zone/date format | Tenant | Admin editable |
| Privacy contact fields | Tenant | Admin editable |

Organization metadata không bị copy vào settings store; registry của MT-2.2 vẫn là source of truth duy nhất.

## 5. Permission integration

- Route `/settings` tiếp tục map tới permission module `settings` trong `ROUTE_MOD`.
- Admin default: `settings.view=true`, `settings.edit=true`.
- DPO default: view-only.
- Staff default: không view; direct route trả Forbidden qua `AppLayout`.
- UI dùng `useCan("settings", "edit")` cho controls.
- Store action dùng `hasPermission(state, "settings", "edit")`; UI hiding không phải enforcement duy nhất.
- Effective role switch remount route content và cập nhật controls ngay.
- Platform actor không được đưa vào tenant membership và không nhận Tenant Settings permission.

Đây là client-side prototype enforcement, không phải production authorization.

## 6. Persistence and invalid-state handling

- Storage key: `cmp-tenant-settings-v1`.
- Mọi entry keyed bằng immutable tenant ID.
- `sanitizeTenantSettings` whitelist enum language/time zone/date format, giới hạn string length và loại email persisted sai format.
- Missing/invalid entry nhận deterministic default; existing business workspace không bị sửa hoặc xóa.
- `initializeTenantSettings()` được gọi khi Platform Admin tạo tenant.
- Tenant Settings page cũng `ensureTenant()` để migration/lazy initialization an toàn cho tenant cũ.
- Header đọc settings active để hiển thị `VI/EN · time zone`; Organization Profile dùng date format/time zone để preview ngày tạo.

## 7. Tenant audit integration

Save thành công ghi event `Cập nhật cài đặt tenant` vào tenant audit qua `state.log()` với:

- Tenant ID.
- User ID.
- Effective role.
- Timestamp.
- `fields=` và danh sách field identifiers đã đổi.

Audit không chứa privacy contact values/email/phone. Platform audit count không đổi khi lưu Tenant Settings.

## 8. Test results TC-01 through TC-18

Automated tests được Vite SSR bundle và chạy bằng Node, không thêm test dependency. Bundle tạm đã xóa.

| TC | Result | Evidence |
|---|---|---|
| TC-01 Admin access | PASS | Retail Admin có view/edit settings. |
| TC-02 Unauthorized cannot edit | PASS | Retail DPO view-only; store save bị reject. |
| TC-03 Platform Admin no tenant access | PASS | Platform actor không có tenant membership. |
| TC-04 Correct profile | PASS | Profile đọc current tenant registry/code. |
| TC-05 Platform fields read-only | PASS | Không tồn tại trong editable settings model; UI read-only. |
| TC-06 Admin update | PASS | General/privacy settings save thành công. |
| TC-07 Refresh persistence | PASS | Browser reload giữ language, zone, format và privacy contact. |
| TC-08 Retail/Finance isolation | PASS | Retail changes không xuất hiện ở Finance. |
| TC-09 Tenant switch loads settings | PASS | Finance load English/Singapore và blank Retail contact. |
| TC-10 Effective-role switch | PASS | Health Admin editable; cùng persona DPO read-only ngay. |
| TC-11 Invalid persisted settings | PASS | Invalid enum/email sanitize về safe defaults. |
| TC-12 New tenant defaults | PASS | Default settings + empty business workspace + no membership. |
| TC-13 Tenant audit | PASS | Audit chứa tenant/user/Admin và field identifiers. |
| TC-14 No platform audit | PASS | Platform audit count không đổi. |
| TC-15 Suspended access | PASS | Tenant layout chặn Settings khi suspended. |
| TC-16 Reactivation preserves settings | PASS | Retail settings còn nguyên sau activate. |
| TC-17 Business data unchanged | PASS | Consent/events/evidence packages snapshot không đổi. |
| TC-18 MT-1/MT-2.1 behavior | PASS | Workspace isolation và Health effective DPO permissions giữ nguyên. |

```text
TC-01..TC-18 tenant settings checks passed
```

## 9. Browser UAT results

Đã chạy trên Codex in-app Chromium với Vite dev server:

- Admin thấy navigation, Organization Profile đúng Retail metadata: PASS.
- Platform-owned fields hiển thị read-only: PASS.
- Unsaved state và Save/Cancel behavior: PASS.
- Invalid privacy email hiển thị validation error: PASS.
- Save Retail English/Singapore/YYYY-MM-DD/contact: PASS.
- Header cập nhật `EN · Asia/Singapore`: PASS.
- Tenant audit có settings action/role Admin và không lộ email value: PASS.
- Switch Finance load English/Singapore riêng và contact Retail không xuất hiện: PASS.
- Health multi-role Admin → DPO: Save button biến mất, inputs disabled, read-only note xuất hiện: PASS.
- Reload giữ Retail settings và valid tenant context: PASS.
- Suspend Retail chặn Tenant Workspace/Settings: PASS.
- Reactivate Retail giữ date format và privacy contact: PASS.
- Fresh browser tab sau fix: không có application runtime error; chỉ Vite debug và React DevTools info.

### Defect found and fixed during UAT

**DEF-MT23-01 — React maximum update depth**

- Severity: High (page startup failed).
- Cause: Zustand selector tạo default settings object mới ở mỗi snapshot khi entry chưa được persist.
- Fix: selector chỉ subscribe stable stored value; fallback object được resolve ngoài selector.
- Retest: full browser flow trên tab hiện tại và fresh tab đều pass, không còn runtime error.

Không có screenshot file persist trong repository; evidence là DOM/accessibility snapshots và browser logs trong phiên.

## 10. TypeScript, ESLint and build

| Check | Result |
|---|---|
| `tsc --noEmit` | PASS |
| ESLint | PASS, 0 errors |
| Existing ESLint warnings | 12 Fast Refresh warnings, không tăng |
| `npm run build` | PASS |
| Vite modules | 3,052 transformed |
| Build warning | Main bundle ~1.43 MB; code splitting ngoài scope |

## 11. Known limitations

1. `localStorage` không phải durable/secure production storage.
2. Language preference chỉ hiển thị context và không kích hoạt full i18n framework.
3. Time zone/date format được dùng ở Settings header/preview; chưa refactor mọi legacy `fmtDT` consumer.
4. Privacy contact là business contact configuration, không chứng minh compliance hoặc DPO appointment.
5. MemoryRouter reset route về Dashboard sau reload; settings state/context vẫn persist và UAT đã vào lại route để xác minh.
6. Tenant business mutations vẫn in-memory theo prototype; settings persistence độc lập không biến prototype thành database.
7. Suspended tenant sidebar có thể vẫn render từ active projection, nhưng mọi content route bị `AppLayout` chặn fail-closed; switcher loại suspended tenant.
8. Production cần backend tenant authorization, encrypted storage, schema migrations và immutable audit ledger.

## 12. Readiness for MT-2 Final UAT

**Ready.** Tenant Settings functional, tenant isolation, role enforcement, persistence, audit separation, new-tenant defaults và suspension behavior đã automated-tested và browser-verified.

MT-2 Final UAT nên chạy một regression script xuyên suốt Platform create → explicit membership (khi module đó tồn tại) → Tenant Settings → suspend/reactivate, đồng thời kiểm tra lại MT-1 approvals/audit và MT-2.1 effective-role switching.
