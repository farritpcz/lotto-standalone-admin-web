# Bans UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: src/app/bans/page.tsx, src/app/bans/auto/*

## 🎯 Purpose
จัดการเลขอั้น (ban numbers) และเงื่อนไขอั้นอัตโนมัติ (auto-ban) ต่อประเภทหวย/รอบ เพื่อจำกัดความเสี่ยงของเจ้ามือ

## 📋 Rules
1. **Routes**:
   - `/bans` — ตารางเลขอั้น manual (CRUD)
   - `/bans/auto` — กฎ auto-ban (threshold / amount-based)
2. **Data flow**: fetch ตอน mount ผ่าน `banApi` / `autoBanApi` (ดู `@/lib/api`)
3. **Filter**: เลือกประเภทหวย + round + bet_type ก่อนแสดงเลขอั้น
4. **Actions**:
   - เพิ่มเลขอั้น (number + bet_type + max_amount) → POST
   - ลบเลขอั้น → DELETE (ยืนยันผ่าน ConfirmDialog)
   - toggle กฎ auto (active/inactive)
5. **No browser alert** — ใช้ `ConfirmDialog` + `resultAlert` ตาม feedback_no_browser_alert

## 🎨 UI Spec (หลัก)
- page-container + page-header + filter bar + table
- Badge สี: อั้นเต็ม=error, อั้นบางส่วน=warning

## ⚠️ Edge Cases
- ไม่มีรอบเปิด → disable การเพิ่มเลข
- เลขซ้ำ → backend ตอบ 409, แสดง toast error
- Loading/empty states → ใช้ `<Loading>` + EmptyState

## 🔗 Related
- Backend: lotto-standalone-admin-api/docs/rules/bans.md (ยืนยันว่ามีอยู่)
- Auto-ban logic: lotto-core/services/autoban/*

## 📝 Change Log
- 2026-04-20: v1 initial skeleton (WIP — expand with exact API signatures)
