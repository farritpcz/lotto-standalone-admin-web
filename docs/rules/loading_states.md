# Loading States — Loading / Skeleton / Toast / PageTransition / CountUp / EmptyState

> Last updated: 2026-04-20
> Related code: `src/components/Loading.tsx:12`, `src/components/EmptyState.tsx:37`,
> `src/components/CountUp.tsx:43`, `src/components/PageTransition.tsx:17`

## Purpose
มาตรฐาน feedback states ให้ผู้ใช้รู้ว่าระบบกำลังทำอะไร — loading/empty/error/success
และ animation primitives (PageTransition, CountUp)

## Rules

### 1. Loading — 3 แบบ
- **Fullpage spinner** `<Loading />` → ใช้ขณะ fetch ข้อมูลแรกของหน้า (center, 60vh)
- **Inline spinner** `<Loading inline text="กำลังบันทึก..." />` → ภายใน card/section
- **Skeleton** `<LoadingSkeleton rows={5} />` หรือ `<DashboardSkeleton />` → รายละเอียด layout

กฏ:
- หน้าใหม่ทุกหน้าต้องมี loading state (ห้ามแสดง layout ว่างเฉยๆ)
- รอ API > 300ms → แสดง loader
- ห้ามใช้ `<p>Loading...</p>` hardcode

### 2. Toast — feedback หลัง action
- Success action → `toast.success('บันทึกสำเร็จ')`
- Fail action → `toast.error('เกิดข้อผิดพลาด')`
- Warning (ไม่ fatal) → `toast.warning('ยังไม่ได้กรอกข้อมูลครบ')`
- Info (progress) → `toast.info('กำลังประมวลผล...')`
- รายละเอียด: `ui_conventions.md` §3

### 3. PageTransition — fade+slideUp 0.25s
- ครอบ content ของหน้าด้วย `<PageTransition>...</PageTransition>`
- ใช้กับหน้าที่ content น้อย (dashboard, settings) — ข้าม list page ที่มี loader ใหญ่
- ห้ามซ้อน (nested PageTransition) จะ animate ซ้ำไม่สวย

### 4. CountUp — ตัวเลขนับ 0→value
- ใช้กับ stat cards / dashboard KPI เท่านั้น
- `<CountUp value={91622} prefix="฿" decimals={2} />`
- ห้ามใช้กับตัวเลขที่อัพเดททุกวินาที (ยิงอัดใหม่ทำ animation รีเซ็ต)
- ไม่ใช้ในตาราง (rows เยอะ → lag)

### 5. EmptyState — เมื่อ list ว่าง
```tsx
import { FileText } from 'lucide-react'

<EmptyState
  icon={FileText}
  title="ยังไม่มีรายการ"
  description="ยังไม่มีการฝากเงินในช่วงเวลานี้"
  actionLabel="รีเฟรช"    // optional
  onAction={() => reload()}
/>
```
- ทุก list/table ต้องมี empty state (ห้ามแสดง table header ว่างเปล่า)
- title ต้องบอกได้ว่า "ว่างเพราะอะไร" (เช่น "ยังไม่มีสมาชิก" / "ไม่พบข้อมูลตามเงื่อนไข")

### 6. Error state
- ใน list page: ใช้ toast.error + keep old data
- ใน detail page: inline error card (แต่ยังคง header ไว้)
- 401 → redirect /login อัตโนมัติ (interceptor ใน `src/lib/api.ts:44`)

## UI Spec
- Skeleton shimmer: 1.8s ease-in-out infinite
- Spinner: conic gradient + mask, 0.9s linear spin
- Toast slide: from right, bounce easing (`var(--ease-bounce)`)
- EmptyState padding: `60px 24px`

## User Flow
1. Mount → ตั้ง `loading=true` → show `<Loading />`
2. API resolve → `loading=false` + setData
3. data.length===0 → `<EmptyState />`
4. action → button disabled + inline spinner → toast ตามผล

## API Calls
ไม่มี

## Edge Cases
- Slow network: ถ้า > 10s → toast.warning('เครือข่ายช้า กรุณารอ...')
- Stale data: refetch on focus (ยังไม่ implement — ดู Change Log)
- CountUp unmount กลาง animation: cancel RAF ใน cleanup (ทำไว้แล้ว `CountUp.tsx:74`)

## Source of Truth (file:line)
- Loading/Skeleton: `src/components/Loading.tsx:12`
- DashboardSkeleton: `src/components/Loading.tsx:71`
- EmptyState: `src/components/EmptyState.tsx:37`
- CountUp: `src/components/CountUp.tsx:43`
- PageTransition: `src/components/PageTransition.tsx:17`
- Toast: `src/components/Toast.tsx:221`
- Related API rule: `../../../lotto-standalone-admin-api/docs/rules/` (ยังไม่มีไฟล์ตรง)

## Change Log
- 2026-04-20: Initial — 6 feedback states, pattern usage
