# Data Table Pattern — Table + Filter + Pagination

> Last updated: 2026-04-20
> Related code: `src/components/SortableTable.tsx:16`, `src/app/members/page.tsx`,
> `src/app/bets/page.tsx`, `src/app/deposits/page.tsx`

## Purpose
มาตรฐานตารางรายการ (list page) ใน admin — filter bar, pagination,
sort, row actions, empty/loading/error states

## Rules

### 1. โครงหน้า (standard list page)
```
<div class="page-container">
  <div class="page-header">
    <h1>ชื่อหน้า</h1>
    <div>ปุ่ม action (เพิ่ม, export, etc.)</div>
  </div>

  <FilterBar>   (search + status + date range)

  {loading ? <Loading /> :
   items.length === 0 ? <EmptyState /> :
   <table class="admin-table">...</table>}

  <Pagination />
</div>
```

### 2. Filter bar
- input search: debounce 300ms ก่อน fetch
- status select: `<select>` ธรรมดา (ไม่ใช้ lib)
- date range: 2 `<input type="date">` (from/to)
- reset button: ทุก filter คืนค่า default
- ทุก filter change → reset `page=1` → refetch

### 3. Pagination
- Backend-driven: API ต้อง return `{ total, page, per_page }`
- แสดง: `แสดง 1-20 จาก 143 รายการ`
- ปุ่ม: « < [page input] > »
- per_page default: 20
- ห้าม fetch ทั้งหมดแล้ว slice ใน client

### 4. Sort
- ใช้ hook `useSortableTable(data)` จาก `SortableTable.tsx:16`
- คลิก header → asc → desc → neutral (วนลูป)
- sort เฉพาะ client-side ของ page ปัจจุบัน — ไม่ส่ง order_by ไป backend
  (ยกเว้นระบุไว้ใน API rule)
- ใช้ `<SortIcon />` คู่กับ header

### 5. Table styling
- ใช้ CSS class `admin-table` (ใน `globals.css`)
- hover row: `var(--bg-hover)`
- click row → เปิด detail modal (หรือ navigate `/xxx/[id]`)
- row action buttons: เล็ก 28px, inline-flex gap 4
- ตัวเลข column: `text-align: right`

### 6. Row actions
- edit (pencil icon) → modal
- delete/cancel (trash/x icon) → ConfirmDialog → API → toast → refetch
- view (eye icon) → detail modal หรือ navigate
- ห้ามใส่ dropdown ซ้อนมากเกิน — > 3 action ใช้ "..." menu

### 7. Bulk actions (optional)
- checkbox column ซ้ายสุด
- header checkbox = select all บนหน้านี้
- action bar ลอยขึ้นเมื่อมี selection > 0
- ยังไม่ implement ทั่วระบบ — 🚧

### 8. Status badge
- CSS class `badge badge-success` / `badge-error` / `badge-warning` / `badge-info`
- ป้ายไทย (สำเร็จ, รอ, ยกเลิก, อนุมัติ)

## UI Spec
- table row height: 44px
- th padding: 10-12px
- cell font: 13px
- column divider: 1px `var(--border)` bottom
- sticky header: `position: sticky; top: 0` ถ้า table ยาว

## User Flow
1. Mount → `fetchList({ page: 1, per_page: 20 })` → loading
2. User พิมพ์ search → debounce → refetch page 1
3. Click row → openDetail(id) → modal แสดง / edit
4. Click delete → ConfirmDialog → API → refetch หน้าเดิม
5. Pagination → fetch page ใหม่ (keep filters)

## API Calls
Common query params:
- `page`, `per_page` — pagination
- `q` — search string
- `status` — filter
- `date_from`, `date_to` — ISO date range

ตัวอย่างใน `src/lib/api.ts`:
- `memberMgmtApi.list(params)` line 81
- `betMgmtApi.list(params)` line 136
- `depositApi.list(params)` line 173

## Edge Cases
- Empty filter result: `<EmptyState>` + ข้อความ "ไม่พบข้อมูลตามเงื่อนไข"
- API 500: toast.error + คง data เดิม (ไม่เคลียร์)
- Page out of range หลังลบ: ถ้าลบแถวสุดท้ายของหน้า → ถอยกลับ 1 หน้า
- ค้นหาภาษาไทย: ส่ง raw UTF-8 (axios encode default)

## Source of Truth (file:line)
- Sort hook: `src/components/SortableTable.tsx:16`
- Sort icon: `src/components/SortableTable.tsx:58`
- Members list reference: `src/app/members/page.tsx`
- Bets list reference: `src/app/bets/page.tsx`
- Deposits list reference: `src/app/deposits/page.tsx`
- API contract: `../../../lotto-standalone-admin-api/docs/rules/members.md`, `bets.md`, `deposits.md`

## Change Log
- 2026-04-20: Initial — filter/pagination/sort standard
