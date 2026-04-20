# Members UI — admin-web

> Last updated: 2026-04-21 (v2 — refactor: page = orchestrator only)
> Related code:
>   - `src/app/members/page.tsx` (list, 158 LOC)
>   - `src/app/members/[id]/page.tsx` (detail, 181 LOC)
>   - `src/components/members/*` — MemberTable, MemberDetailModal, types
>   - `src/components/member-detail/*` — header, sections, modal, tabs
>   - `src/components/member-detail/hooks/*` — use-member-detail-data, use-member-actions
>   - `src/components/member-detail/TabNav.tsx` — 4-tab nav

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

## 🧱 File structure (post-refactor, Tier A)
- `page.tsx` = thin orchestrator — state + data-fetching + layout only
- UI blocks → `components/members/` (list) + `components/member-detail/` (detail)
- Action logic → `hooks/use-member-actions.ts` (adjust balance / profile / reset pwd / toggle status)
- Data loading → `hooks/use-member-detail-data.ts` (member + txns + bets + pagination)
- Tab nav → `TabNav.tsx` (source of truth for `TABS` const and `TabKey` type)

> **Rule**: page.tsx ต้อง ≤ 300 LOC. ถ้าเกินให้แตกเพิ่ม component/hook ต่อ — อย่าเติมโค้ด inline

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
- 2026-04-21: v2 refactor — split members/page (517→158), members/[id] (368→181) + extract hooks/tab-nav
