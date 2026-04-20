# Dashboard Layout — Sidebar + Header + Responsive

> Last updated: 2026-04-20
> Related code: `src/components/AdminLayout.tsx:19`, `src/components/AdminSidebar.tsx:41`,
> `src/components/Breadcrumbs.tsx`, `src/components/CommandPalette.tsx`

## Purpose
โครงสร้าง layout หลักของ admin web — sidebar, breadcrumb, main content,
responsive breakpoints, permission filter

## Rules

### 1. Layout structure
```
<ToastProvider>
  <div flex>
    <AdminSidebar />                    (fixed left, 220 / 60)
    <main class="admin-main-content">
      <Breadcrumbs />
      {children}                        (page content)
    </main>
    <CommandPalette />                  (modal, Cmd+K)
  </div>
</ToastProvider>
```

### 2. Sidebar specs
- width: 220px expanded, 60px collapsed
- state persisted to `localStorage` key `sidebar_collapsed`
- background: `var(--bg-sidebar)` / `#0f0f0f`
- nav item: height 32, radius 6, icon 15px Lucide stroke 1.5
- active state: `var(--accent-subtle)` bg + accent text + 3px left border
- badge: pending deposits/withdrawals (fetched ใน `AdminLayout.tsx:32`)
- ทุก item มี `perm` field — filter ตาม `admin_permissions` จาก localStorage

### 3. Menu groups (ลำดับใน sidebar)
1. Overview — Dashboard, สมาชิก
2. หวย — ประเภทหวย, รอบ, เลขอั้น, อั้นอัตโนมัติ, อัตราจ่าย, ยี่กี
3. การเงิน — ฝาก, ถอน, รายการแทง, ธุรกรรม
4. สมาชิก — Level, โปรโมชั่น
5. สายงาน — จัดการสายงาน, รายงานเคลีย
6. ระบบ — CMS, รายงาน, ตั้งค่า, Staff, Activity Log, Contact Channels

ดู source: `src/components/AdminSidebar.tsx:41`

### 4. Permission filter
- รายละเอียด permission string: `dashboard.view`, `members.view`, `finance.deposits`, etc.
- owner/admin role → เห็นทุกเมนู
- operator/viewer → filter ตาม `JSON.parse(localStorage.admin_permissions)`
- Node user (`user_type === 'node'`) → ข้ามการ fetch pending counts

### 5. Breadcrumbs
- อยู่บนสุดของ main content
- อ่าน path → match กับ `menuGroups` → แสดงชื่อไทย
- คลิก segment → navigate

### 6. CommandPalette (Cmd+K / Ctrl+K)
- Global search เมนู + actions
- อ่าน `menuGroups` จาก `AdminSidebar`
- ไม่แสดงในหน้า `/login`, `/node/*`

### 7. Responsive breakpoints
- Desktop (≥1280px): sidebar 220px expanded
- Tablet (768-1279px): sidebar collapsed 60px, แนะนำ toggle manually
- Mobile (<768px): sidebar ซ่อน, ใช้ hamburger (🚧 ยังไม่ implement เต็ม)

### 8. Theme
- Aurora Dark default (teal accent) — ดู `src/app/globals.css`
- ThemeToggle อยู่ใน sidebar footer (`src/components/ThemeToggle.tsx`)
- Agent theme override ผ่าน `agentThemeApi` (per-agent primary color)

## UI Spec
- Main padding: `16px 24px` บน + `0` รอบตัว children
- Card radius: 10-12px
- Border: `1px solid var(--border)`
- zIndex: sidebar 100, command palette 200, dialog 300, toast 9999

## User Flow
1. Page load → AdminLayout mount → fetch pending counts
2. Cookie invalid (401) → interceptor redirect `/login`
3. User click menu → `<Link>` navigate → Breadcrumbs update
4. Cmd+K → CommandPalette modal → type → select → navigate

## API Calls
- `GET /deposits?status=pending&per_page=1` — badge count (`AdminLayout.tsx:34`)
- `GET /withdrawals?status=pending&per_page=1` — badge count

## Edge Cases
- Login page / `/node/*` → render without sidebar (ดู `AdminLayout.tsx:43`)
- Role=node → ข้าม fetch pending (avoid permission error)
- Collapsed sidebar + tooltip on hover (🚧 partial)
- Mobile hamburger: 🚧 ยังไม่สมบูรณ์

## Source of Truth (file:line)
- Layout: `src/components/AdminLayout.tsx:19`
- Sidebar: `src/components/AdminSidebar.tsx:41` (menuGroups)
- CommandPalette: `src/components/CommandPalette.tsx`
- Breadcrumbs: `src/components/Breadcrumbs.tsx`
- Theme CSS: `src/app/globals.css`
- API contract: `../../../lotto-standalone-admin-api/docs/rules/` (auth.md, deposits.md)

## Change Log
- 2026-04-20: Initial — layout + sidebar + permission filter
