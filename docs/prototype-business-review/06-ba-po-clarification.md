# Câu hỏi cần BA và PO xác nhận

| ID | Related SRS | Screen | Current understanding | Ambiguity | Options | Impact |
|---|---|---|---|---|---|---|
| Q-001 | FR-022..026 | Rights | MVP gồm subject và operator flows | Vòng prototype có cần full rights demo? | A Full end-to-end; B Queue/detail only; C Defer | Quyết định P0 scope lớn nhất |
| Q-002 | FR-008 | Users/Header | Prototype chỉ một Organization ABC Retail | Cần demo multi-tenant/org tree không? | A Single tenant note; B Org tree; C Tenant switcher + org | Tác động navigation/data model mock |
| Q-003 | FR-008 | Users | Admin hiện giống Tenant Admin | Có Platform Admin trong prototype không? | A Tenant Admin only; B Add Platform Admin | Tác động permission/persona |
| Q-004 | FR-006 | Integrations | Apps static, consent có app assignment | Mức app registration cần demo? | A CRUD/detail/test; B Detail only; C Static accepted | Tác động WF-12 |
| Q-005 | FR-030/031 | Integrations | Outbox interactive một phần, connector static | Retry/test cần đổi trạng thái tới đâu? | A Full status timeline; B Result dialog; C Toast | Tác động độ thuyết phục integration demo |
| Q-006 | FR-033 | Integrations | Chỉ có cookie result list | Scanner có thuộc demo hiện tại? | A Full scan/classify/approve; B Results/classify; C Defer | Tác động một workflow missing |
| Q-007 | FR-004/005 | Rules | Rule submit toast; matrix áp dụng ngay | Có bắt buộc approval giống SRS? | A Full approval; B Simplified approve dialog; C Demo note | Tác động governance consistency |
| Q-008 | FR-010 | Settings | Key rows static | Có cần rotate/revoke demo? | A Full simulated lifecycle; B Rotate dialog only; C Static | Tác động Settings value |
| Q-009 | FR-040 | Notifications/Settings | Alert resolve có; config static | Alert có màn riêng hay gộp notification? | A Keep merged; B Dedicated list; C Tabs | Tác động SRS screen mapping/navigation |
| Q-010 | FR-043 | Settings | Usage KPI theo property | Metering cần filter/drill-down không? | A Full demo; B KPI only; C Defer | Tác động Settings depth |
| Q-011 | IF-01 | All | Console tiếng Việt; content subject VI/EN | SRS bilingual áp dụng console hay chỉ subject UI? | A Both; B Subject-facing only | Tác động toàn bộ labels |
| Q-012 | IF-09 | Versioned screens | CompareDialog chọn hai version khi list có data | Entity nào bắt buộc có history đủ để compare? | A All listed by IF-09; B Core configs only | Tác động mock histories/UI actions |
| Q-013 | FR-037 | Evidence package | Có preview package, không download | Demo acceptance cần file tải xuống không? | A Mock PDF/JSON download; B Preview sufficient | Tác động observable result |
| Q-014 | FR-002 | Consent | Channels là metadata | Demo có phải chứng minh wrong-channel rejection? | A Add simulator case; B Metadata sufficient | Tác động Consent completion |
| Q-015 | FR-018 | Simulator | Link copies anonymous decisions to known subject | Cách trình bày conflict “restrictive wins” cụ thể? | A Add conflict choice/result; B Text sufficient | Tác động identity-link clarity |
| Q-016 | FR-029 | Simulator | Chỉ demo Receipt verification success | Có cần invalid/expired/tampered cases? | A All three; B One failure; C Success only | Tác động FR-029 status |
| Q-017 | SRS 4.3.4 | Notifications | Page tự ghi thay queue/alert riêng | Đây có phải quyết định BA chính thức? | A Confirm; B Restore separate screens | Tác động information architecture |
| Q-018 | SCR Appendix C | Multiple | Nhiều SRS screens được gộp thành tab/dialog | Review cần đúng số screen hay đúng workflow? | A Workflow-first; B Screen parity | Tác động cấu trúc prototype |
| Q-019 | OI/TBD | Settings/Rules | Nhiều `[N]` hiển thị nguyên trạng | Giá trị nào cần mock concrete để demo? | A Keep TBD; B Provide demo defaults | Tác động comprehension |
| Q-020 | Prototype utility | Simulator | Không có Screen ID riêng nhưng rất hữu ích | Sandbox có giữ trong product sitemap không? | A Keep demo-only; B Product sandbox; C Hide outside demo | Tác động necessity/navigation |
| Q-021 | Terminology | Notice/statuses | Published/Expired xen trạng thái tiếng Việt | Chuẩn thuật ngữ nào? | A All Vietnamese; B Keep domain English; C bilingual labels | Tác động consistency |
| Q-022 | Prototype communication | Evidence/Settings | UI mô tả WORM/JWS/KMS như thật | Có bắt buộc badge “Mô phỏng”? | A Global badge; B Per component; C Footer note sufficient | Tác động tránh hiểu nhầm |

## Các câu hỏi blocking nên chốt trước

Q-001, Q-004, Q-006, Q-007 và Q-018 quyết định trực tiếp phạm vi backlog prototype tiếp theo.
