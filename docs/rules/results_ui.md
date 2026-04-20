# Results UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: src/app/results/page.tsx

## 🎯 Purpose
"Lottery Result Studio" — กรอกผลรางวัลรอบหวยที่ปิดแล้ว → preview ผู้ถูก/payout/profit → confirm → settle + จ่ายรางวัล + คอมมิชชั่น

## 📋 Rules
1. **Data flow**:
   - Mount → `roundMgmtApi.list({ status: 'closed', per_page: 50 })` — ⭐ กรองยี่กีออก (ออกผลอัตโนมัติ)
   - เลือกรอบจาก card list (ไม่ใช่ dropdown)
2. **Inputs**:
   - Hero: top3 (3 หลัก) + bottom2 (2 หลัก)
   - Collapsible "ผลเพิ่มเติม": front3, bottom3 (ใช้เฉพาะหวยไทย/ลาว)
3. **Preview**: `resultMgmtApi.preview(roundId, numbers)` → แสดง total_bets, winners, total_payout, profit
4. **Submit**: `resultMgmtApi.submit(...)` → settle + payout + commission (atomic ฝั่ง backend)
5. **History**: `resultMgmtApi.list({ page, per_page: 15 })` + pagination
6. **Detail view**: คลิกรอบที่ออกผลแล้ว → re-fetch preview-like data (winners list)

## 🎨 UI Spec (หลัก)
- Premium 2-column layout: (left) round picker, (right) input + preview
- Lucide icons: Trophy, TrendingUp, Users, DollarSign
- Profit: เขียว=บวก, แดง=ลบ

## ⚠️ Edge Cases
- ยี่กี → กรองออก ไม่แสดงในรายการรอเข้าผล
- กรอกเลขไม่ครบจำนวนหลัก → disable preview button
- Submit ซ้ำ → backend 409 (round ไม่ใช่ status=closed แล้ว)

## 🔗 Related
- Backend: lotto-standalone-admin-api/docs/rules/results.md
- Settle logic: lotto-core (critical path — ดู project_shared_code.md)
- Related: rounds_ui.md

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
