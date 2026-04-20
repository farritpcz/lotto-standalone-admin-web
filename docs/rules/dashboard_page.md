# Dashboard Page (V2) — admin-web

> Last updated: 2026-04-21 (v1 — created during Tier A refactor)
> Related code:
>   - `src/app/dashboard/page.tsx` (154 LOC — orchestrator)
>   - `src/components/dashboard/types.ts` — DashboardData, FilterPreset, fmt/fmtShort/pctChange, STATUS_BADGE, PRESETS, getPresetRange
>   - `src/components/dashboard/DateFilterBar.tsx` — segmented preset + custom range
>   - `src/components/dashboard/StatCard.tsx` — stat card (variant: brand/violet/warn/danger/info)
>   - `src/components/dashboard/TopBettorsAndChart.tsx` — Row 2
>   - `src/components/dashboard/TransactionsRow.tsx` — Row 3
>   - `src/components/dashboard/TrackingAndCredits.tsx` — Row 4

## 🎯 Purpose
Dashboard V2 แสดงภาพรวมระบบ (สไตล์เจริญดี88): 4 stat cards + chart + tables + credit stats

## 📋 Rules

### 1. Sections (บนลงล่าง)
1. **Header** — title + subtitle + รีเฟรช button
2. **Date filter bar** — preset (วันนี้ / เมื่อวาน / อาทิตย์นี้ / เดือนนี้ / ต้นเดือน / ท้ายเดือน / custom)
3. **Row 1**: 4 Stat cards (ฝาก/ถอน/กำไร/สมาชิกใหม่ — % เทียบเดือนก่อน)
4. **Row 2**: Top 10 bettors (1fr) + 30-day chart (1.5fr)
5. **Row 3**: Bank accounts + Top depositors + Recent tx (ทั้ง 3 คอลัมน์)
6. **Row 4**: Member tracking (1fr) + Credit stats 3×3 grid (2fr)

### 2. Data source
- `GET /dashboard/v2?from=YYYY-MM-DD&to=YYYY-MM-DD`
- response → `DashboardData` (ดู types.ts)

### 3. Date filter
- preset ใหม่ → loadData ทันที
- custom → ต้องกด "ค้นหา" (ไม่ trigger on keypress)
- preset → `getPresetRange(preset)` แปลงเป็น from/to

### 4. Stat card variants
| variant | ใช้กับ        | สีหลัก             |
| ------- | ------------- | ------------------ |
| info    | ยอดฝาก        | #3b82f6 → #22d3ee |
| danger  | ยอดถอน/ยกเลิก | #ef4444 → #f87171 |
| brand   | กำไร          | #00e5a0 → #06b6d4 |
| warn    | สมาชิกใหม่     | #f59e0b → #fbbf24 |
| violet  | สำรอง         | #8b5cf6 → #ec4899 |

### 5. No browser alert
- ใช้ toast / resultAlert — ห้าม `alert()` / `confirm()`

## 🧱 File structure (post-refactor, Tier A)
- `page.tsx` = orchestrator — state (preset/custom/data) + fetch + layout grid
- แต่ละ Row แยก component — หามี state local ให้อยู่ใน component นั้น (เช่น `txTab` ใน `TransactionsRow`)
- Formatting helpers + types รวมใน `types.ts` (ใช้ร่วมกันได้)

> **Rule**: page.tsx ต้อง ≤ 300 LOC. ถ้าเกินให้แตก Row/Card component เพิ่ม

## 🔗 Related
- Sidebar / layout: `dashboard_layout.md`
- Design tokens (--accent-*, --status-*): `ui_conventions.md`

## 📝 Change Log
- 2026-04-21: v1 — created after refactor (501→154 LOC page)
