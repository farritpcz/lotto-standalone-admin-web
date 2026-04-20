# Rates UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: src/app/rates/page.tsx

## 🎯 Purpose
จัดการอัตราจ่าย (pay rate) + max bet per number ต่อประเภทหวย × bet_type (3ตัวบน, 2ตัวล่าง, วิ่ง, ฯลฯ)

## 📋 Rules
1. **Data flow**:
   - Mount → `lotteryMgmtApi.list()` (populate dropdown + default = first type)
   - เปลี่ยน selectedLottery → `rateMgmtApi.list({ lottery_type_id, per_page: 50 })`
2. **Dropdown**: optgroup by category (thai/yeekee/lao/hanoi/malay/stock)
3. **Edit model**:
   - `rates` = server state, `editRates` = draft (deep clone)
   - `hasChanges` = JSON.stringify diff
4. **Save** (`handleSave`):
   - วนทีละ rate → ถ้า `rate` เปลี่ยน → `rateMgmtApi.update(id, { rate })`
   - แสดง message "บันทึกสำเร็จ N รายการ" (auto-clear 3 วิ)
   - ⚠️ ตอนนี้ update แค่ `rate` — `max_bet_per_number` ยังไม่ส่ง (WIP)
5. **No bulk API** — loop ทีละตัว (ยอมรับเพราะ rate ต่อหวยไม่เยอะ ~10 rows)

## 🎨 UI Spec (หลัก)
- Card-based editor (1 card = 1 bet_type)
- Sticky save bar ด้านล่างเมื่อ hasChanges
- Disable save ถ้า saving=true

## ⚠️ Edge Cases
- ไม่มี lottery types → หน้าว่าง (ยังไม่ handle empty → WIP)
- เปลี่ยน lottery ขณะ hasChanges → ปัจจุบันไม่เตือน (TODO: confirm discard)

## 🔗 Related
- Backend: lotto-standalone-admin-api/docs/rules/rates.md
- Depends on: lotteries_ui.md (ต้องมี lottery type ก่อน)

## 📝 Change Log
- 2026-04-20: v1 initial skeleton (WIP — max_bet_per_number save not wired)
