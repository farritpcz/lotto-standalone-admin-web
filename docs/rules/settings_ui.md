# Settings UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: `src/app/settings/page.tsx`, `settings/bank-accounts/page.tsx`, `settings/deposit-withdraw/page.tsx`, `settings/notifications/page.tsx`, `settings/theme/page.tsx`

## 🎯 Purpose
ศูนย์รวมตั้งค่าระบบของ agent: บัญชีธนาคาร, deposit/withdraw rules, notifications, theme/brand, contact channels — ไม่ใช่ system-wide (scoped per-agent)

## 📋 Rules
1. **Routes** ใต้ `/settings`:
   - `/` — landing (nav card ไปหน้าย่อย)
   - `/bank-accounts` — CRUD บัญชีธนาคารสำหรับรับฝาก (ดู `bank_account_settings.md`)
   - `/deposit-withdraw` — min/max, fees, RKAuto toggle, EasySlip toggle
   - `/notifications` — ตั้ง channel (email, LINE, webhook), template
   - `/theme` — สี brand, logo, banner (ดู `cms_banner_ui.md`)
2. **Scope per-agent**: ทุก setting ผูก `agent_id` (multi-tenant — ดู memory `multi_agent_system`)
3. **Permission**: `system.settings` (group) + `system.cms` (theme/contact)
4. **Validation**:
   - Bank account: ธนาคาร + เลขบัญชี + ชื่อ (เทียบ checksum บางธนาคาร)
   - Amounts: min < max, all ≥ 0
5. **Theme preview**: preview ก่อน save (iframe หรือ panel)
6. **No browser alert** — ใช้ `ConfirmDialog` + `resultAlert`

## 🎨 UI Spec
- page-container + page-header + breadcrumb (Settings / Sub-page)
- Form layouts: 2-column, sticky submit bar
- Upload: drag-drop (ดู `upload.md`)
- Sensitive fields (เลขบัญชี) — mask default, คลิก show

## ⚠️ Edge Cases
- ลบ bank account ที่มี pending deposit → reject / warn
- ปิด RKAuto ระหว่างทาง → deposits ค้างต้อง approve manual
- Theme ที่ upload logo ใหญ่เกิน → reject + แนะนำ resize

## 🔗 Related
- Backend: `lotto-standalone-admin-api/docs/rules/bank_account_settings.md`, `system_settings.md`, `notifications.md`
- CMS/theme: `cms_banner_ui.md`, `contact_channels_ui.md`
- Multi-agent: memory `multi_agent_system`

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
