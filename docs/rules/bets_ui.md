# Bets UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: `src/app/bets/page.tsx`

## 🎯 Purpose
admin ดู bets ทุกราย (filter: member, lottery, round, status, date range), ดู bill-level detail, cancel bill/bet — สำหรับ support + dispute

## 📋 Rules
1. **Route**: `/bets` — table view bill-level (group bets by `bet_batch_id`)
2. **Data flow**: fetch ตอน mount + reload หลังกรอง → `betApi.list()` (ดู `@/lib/api`)
3. **Bill-level display** (preference ใหม่ 2026-04-05, ดู memory `project_current_work`):
   - Row = 1 bill — คลิก expand เพื่อดู bet items
   - แสดง: username, lottery_type, total_amount, item_count, status, time
4. **Cancel**:
   - Cancel bill = cancel ทุก bet ใน batch
   - Cancel bet individual = แถวย่อยใน expanded row
   - ต้องพิมพ์ reason ก่อน submit (ConfirmDialog + textarea)
5. **Date filter**: default = วันนี้ (Asia/Bangkok); มี preset (วันนี้/เมื่อวาน/7 วัน/30 วัน/custom)
6. **No browser alert** — ใช้ `ConfirmDialog` + `resultAlert`

## 🎨 UI Spec
- page-container + page-header + filter bar (sticky)
- DataTable (ดู `data_table_pattern.md`) — row expand + action menu (Cancel bill / View logs)
- Status badge: pending=secondary, won=success, lost=error, cancelled=muted
- Loading skeleton + EmptyState

## ⚠️ Edge Cases
- Settled bet → cancel ปุ่มซ่อน/disabled + tooltip อธิบาย
- Export CSV รายใหญ่ → chunk query + toast progress
- Member ย้าย downline → ยังแสดง bet เดิม (อ้างอิง agent_id ตอน place)

## 🔗 Related
- Backend: `lotto-standalone-admin-api/docs/rules/bets_admin.md`
- Bet history (member-side): `lotto-standalone-member-web/src/app/(member)/history/page.tsx`
- DataTable pattern: `data_table_pattern.md`

## 📝 Change Log
- 2026-04-20: v1 initial skeleton (bill-level view ตาม redesign 2026-04-05)
