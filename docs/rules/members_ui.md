# Members UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: `src/app/members/page.tsx`, `src/app/members/[id]/page.tsx`

## 🎯 Purpose
admin จัดการสมาชิก: รายชื่อ + ค้นหา + filter + หน้า detail (profile, bets, transactions, level, downline, bans) — เป็นหน้าหลักของ support

## 📋 Rules
1. **Routes**:
   - `/members` — list + filter
   - `/members/[id]` — detail (tabs)
2. **Scope per-agent**: เห็นเฉพาะ member ใน `agent_id` เดียวกัน / ใต้สาย (ดู memory `downline_scoping`)
3. **List filters**: search (username/phone), status (active/suspended), level, registered date, last-login
4. **Detail tabs** (suggest):
   - Profile (แก้ได้: display_name, level override, bank, status)
   - Bets (อ้างอิง `bets_ui.md`)
   - Transactions (deposit/withdraw/bet/refund — ดู `transactions_ui.md`)
   - Level (current + history, override lock — ดู `member_levels_ui.md`)
   - Downline position (read-only — ดู `downline_ui.md`)
   - Notes (internal admin comments, ไม่แสดงให้ member)
5. **Level override**: admin ตั้ง level manual ได้ → lock (backend `member_levels.md`)
6. **Status toggle**: active / suspended / banned — ยืนยันด้วย `ConfirmDialog` + reason
7. **No browser alert** — ใช้ `ConfirmDialog` + `resultAlert`

## 🎨 UI Spec
- page-container + page-header + filter bar (sticky)
- List: DataTable + row click → detail
- Detail: 2-column layout (left: avatar + summary card, right: tabs)
- Action menu: toggle status / reset password / send notification / view downline

## ⚠️ Edge Cases
- Member ที่มี bet pending → suspend ได้ แต่ warn ("มี bet ค้างอยู่")
- Reset password → gen temp password + ส่ง noti + บังคับเปลี่ยนหลัง login ครั้งแรก
- Phone duplicate (โอนเบอร์) → backend 409

## 🔗 Related
- Backend: `lotto-standalone-admin-api/docs/rules/member_management.md`, `member_levels.md`
- Transactions UI: `transactions_ui.md`
- Downline scoping: memory `downline_scoping`

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
