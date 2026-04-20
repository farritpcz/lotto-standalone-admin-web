# Report Pages — UI + Export + Date Filter

> Last updated: 2026-04-20
> Related code: `src/app/reports/page.tsx:35`, `src/components/charts/`,
> `src/app/downline/report/` (ถ้ามี)

## Purpose
มาตรฐานหน้ารายงานใน admin web — summary cards, charts, date range filter,
export (CSV/Excel), tabs หลายรายงาน

## Rules

### 1. โครงหน้ารายงาน
```
<div class="page-container">
  <div class="page-header"><h1>รายงาน</h1></div>

  <TabSwitcher>          (ถ้ามีหลายรายงาน)

  <DateRangeFilter />    (from + to)

  <StatCardsGrid />      (4-6 KPI cards with CountUp)

  <Charts />             (recharts, ถ้ามี)

  <DetailTable />        (breakdown, ถ้ามี)
</div>
```

### 2. Tabs (multi-report page)
- ใช้กลุ่มปุ่ม `btn btn-primary` / `btn btn-ghost` toggle
- container: `bg-elevated` radius 8 padding 3
- icon Lucide + text ไทย
- ดู pattern ใน `reports/page.tsx:45`

### 3. Date range filter
- 2 `<input type="date">` — from (default 7 วันก่อน) + to (วันนี้)
- ทันทีที่ date เปลี่ยน → refetch (`useEffect` dep)
- ส่ง ISO format `YYYY-MM-DD` ไป backend
- ห้าม default ยาวเกิน 30 วัน (จะทำ backend ช้า)
- ปุ่ม preset (optional): วันนี้ / 7 วัน / 30 วัน / เดือนนี้

### 4. Stat cards
- grid: `repeat(auto-fit, minmax(220px, 1fr))` gap 12
- ใช้ `<CountUp />` แสดงตัวเลข
- accent border-left 3px ตาม metric type
- format เงิน: `fmtMoney(n)` = `฿1,234.56`

### 5. Charts
- library: `recharts` (อยู่ใน `src/components/charts/`)
- responsive: `<ResponsiveContainer>`
- tooltip: custom ภาษาไทย + fmtMoney
- colors: ใช้ CSS var `--accent`, `--status-success`, ...
- ห้ามใช้ chart lib อื่น (chart.js / echarts) ในหน้าใหม่

### 6. Export (ถ้ามี)
- ปุ่มขวาบนของ card: "Export CSV" / "Export Excel"
- CSV: generate client-side (รายการน้อย < 1000) หรือ backend (เยอะ)
- filename: `report-{type}-{from}-{to}.csv`
- Excel: backend generate + return blob

### 7. Detail breakdown table
- ใช้ pattern จาก `data_table_pattern.md`
- มักไม่ pagination (รายงานรวมทั้งช่วง) — ถ้า > 500 row ต้อง pagination
- row ตัวเลข text-align right + format

### 8. Empty / Error
- ช่วงวันที่ไม่มีข้อมูล -> `<EmptyState>` + "ไม่มีข้อมูลในช่วงนี้"
- API fail -> toast.error + keep stat cards เป็น 0

## UI Spec
- date input width: 160px
- stat card padding: 18-20px
- stat number font: 22-28px bold
- chart min-height: 260px
- tab container width: fit-content

## User Flow
1. Mount -> default date range -> fetch summary + chart data
2. เปลี่ยน date -> useEffect -> refetch (both cards + chart)
3. เปลี่ยน tab -> reset fetch สำหรับ tab ใหม่
4. click export -> generate / download file

## API Calls
จาก `src/lib/api.ts`:
- `GET /reports/summary` — `reportApi.summary({ from, to })` (line 152)
- `GET /reports/profit` — `reportApi.profit({ from, to })` (line 153)
- `GET /reports/member-credit` — `memberCreditApi.report(params)` (line 772)
- `GET /downline/report` — `downlineApi.getReport({ date_from, date_to })` (line 477)
- `GET /downline/profits` — `downlineApi.getProfits(params)` (line 468)
- `GET /affiliate/report` — `affiliateApi.getReport(params)` (line 223)

## Edge Cases
- date from > to: block submit + toast.warning
- ช่วงยาวเกิน 90 วัน: เตือน (แต่ไม่ block)
- timezone: ส่ง UTC+7 (ไทย) — backend ต้องระบุ timezone ใน rule
- เงินติดลบ (ขาดทุน): แสดงสีแดง + วงเล็บ `(฿1,234.00)`

## Source of Truth (file:line)
- Reports page (2 tabs): `src/app/reports/page.tsx:35`
- Summary tab: `src/app/reports/page.tsx:71`
- Member credit tab: `src/app/reports/page.tsx` (ช่วงล่าง)
- Charts: `src/components/charts/`
- fmtMoney helper: `src/app/reports/page.tsx:21`
- API contract: `../../../lotto-standalone-admin-api/docs/rules/reports.md`, `downline.md`, `affiliate.md`

## Change Log
- 2026-04-20: Initial — tabs, date filter, stat cards, charts, export
