# Lotteries UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: src/app/lotteries/page.tsx

## 🎯 Purpose
จัดการประเภทหวย (lottery types) — CRUD ชื่อ/code/category/icon/status ของหวย 39 ประเภท (ดู memory: lottery_types_structure.md)

## 📋 Rules
1. **Data flow**: `lotteryMgmtApi.list()` on mount → setTypes
2. **Categories**: const `CATEGORIES` (thai/yeekee/lao/hanoi/malay/stock) + สีแต่ละกลุ่ม
3. **Layout**: Card Grid grouped by category (ไม่ใช่ table)
   - Category header = collapsible (stock มี 26 ตัว → ยุบได้)
   - Card = icon + name + code + status toggle
4. **Actions**:
   - Search bar กรอง name/code
   - Click card → modal edit (`lotteryMgmtApi.update`)
   - Add new → `lotteryMgmtApi.create` (รองรับ custom icon emoji)
   - Toggle status (Power icon) → active/inactive
5. **Form**: name, code, category (select), icon (emoji), description

## 🎨 UI Spec (หลัก)
- Compact card (เน้นให้ดู 39 ตัวในหน้าเดียว)
- Collapsed state persists ใน component state (ไม่ persist ข้าม session)
- ไอคอน ChevronDown/Right สำหรับ collapse

## ⚠️ Edge Cases
- ลบประเภทหวยที่มีรอบเปิดอยู่ → backend ต้องบล็อก (FK constraint)
- Category ใหม่ที่ไม่ตรงกับ CATEGORIES → fallback group "อื่นๆ"
- Empty API response → `data?.items || []`

## 🔗 Related
- Backend: lotto-standalone-admin-api/docs/rules/lottery_types.md
- Dependent: rates_ui.md, rounds_ui.md (ต้องมี lottery_type ก่อน)
- Memory: lottery_types_structure.md

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
