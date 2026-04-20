# Downline UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: `src/app/downline/page.tsx`, `src/app/downline/report/page.tsx`

## 🎯 Purpose
admin จัดการปล่อยสาย (downline): ดู tree, ตั้ง share % + commission, เคลียสายงาน (report), profit sharing — คู่ backend `downline.md`

## 📋 Rules
1. **Routes**:
   - `/downline` — ดู tree (agent_nodes) + CRUD node + ตั้ง share/rate
   - `/downline/report` — เคลียสายงาน (รายการยอด diff + commission) ตามสูตร `downline_report_formulas`
2. **Scope**: เห็นเฉพาะใต้สายตัวเอง (ดู memory `downline_scoping`)
3. **Tree display**: indent ตาม depth + badge (level / share % / status)
4. **Edit share %**:
   - Rule: child % ต้อง ≤ parent % (invariant — ดู memory `downline_profit_calc`)
   - Form validation client-side + server-side reject หาก violate
5. **Report formulas**: เก็บใต้สาย = (100 - child%), จ่ายหัว = (100 - my%) — ดู memory `downline_report_formulas`
6. **Diff breakdown**: แสดง 3 ยอด (bet / win / diff) ต่อ node — ตรวจให้ match สูตร
7. **No browser alert** — ใช้ `ConfirmDialog` + `resultAlert`

## 🎨 UI Spec
- page-container + page-header + filter (date range, node)
- Tree view: collapsible rows + badges + inline edit
- Report: summary header (CountUp totals) + breakdown table
- Action menu: Edit share / View sub-tree / View report

## ⚠️ Edge Cases
- ลบ node ที่มี member ใต้ → reject (ต้อง migrate member ก่อน)
- Node ที่ suspend → แสดง badge + disable create-sub-node
- Report ข้าม agent → **ห้าม** (scoping invariant)

## 🔗 Related
- Backend: `lotto-standalone-admin-api/docs/rules/downline.md`
- Scoping: memory `downline_scoping`
- Profit calc: memory `downline_profit_calc`, `downline_report_formulas`
- Multi-agent: memory `multi_agent_system`

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
