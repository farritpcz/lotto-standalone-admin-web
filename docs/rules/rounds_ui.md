# Rounds UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: src/app/rounds/page.tsx

## 🎯 Purpose
จัดการรอบหวย (rounds) — สร้าง/เปิด/ปิด/ยกเลิก รอบ พร้อม quick stats + filter pills ตามสถานะ

## 📋 Rules
1. **Data flow**: `roundMgmtApi.list({ page, per_page: 20, status, lottery_type_id })` + `lotteryMgmtApi.list()` for filter
2. **Status** (STATUS_CONFIG): `upcoming`, `open`, `closed`, `resulted`, `voided` — แต่ละสถานะมี badge + color + bg
3. **Filters**:
   - Status pills ด้านบน พร้อม count
   - Lottery dropdown: optgroup by category
4. **Actions**:
   - Create: modal form (lottery_type_id, round_number, round_date, open_time, close_time) → `roundMgmtApi.create`
   - Manual open: `roundMgmtApi.manualOpen(id)` (Play icon)
   - Manual close: `roundMgmtApi.manualClose(id)` (Square icon)
   - Void: `roundMgmtApi.voidRound(id)` (XCircle icon) → confirm
5. **Relative time**: แสดง "เปิดอีก 2 ชม." / "ปิดไปแล้ว 30 นาที" (helper `fmtShort` + relative logic)
6. **Row coloring**: bg ตาม STATUS_CONFIG[status].bg

## 🎨 UI Spec (หลัก)
- Quick stats bar ด้านบน (count per status)
- Compact action buttons
- Page size = 20

## ⚠️ Edge Cases
- ยี่กี → รอบสร้างอัตโนมัติทุกวัน (ดู agent_rules.md)
- Void หลัง resulted → backend ควรปฏิเสธ
- Manual open รอบที่ลบไปแล้ว → 404

## 🔗 Related
- Backend: lotto-standalone-admin-api/docs/rules/rounds.md
- Depends on: lotteries_ui.md
- Results: results_ui.md (กรอกผลหลังปิดรอบ)

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
