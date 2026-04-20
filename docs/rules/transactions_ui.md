# Transactions UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: src/app/transactions/page.tsx

## 🎯 Purpose
ดูธุรกรรมทั้งหมดของสมาชิก (deposit, withdraw, bet, win, refund) พร้อม balance before/after — อ่านอย่างเดียว

## 📋 Rules
1. **Data flow**: `txMgmtApi.list({ page, per_page: 30, type, q })` — re-fetch เมื่อ page/type/search เปลี่ยน
2. **Type badges** (typeBadge): deposit=success, withdraw=error, bet=warning, win=success, refund=info
3. **Filters**:
   - Type pills: ทั้งหมด / ฝาก / ถอน / แทง / ชนะ
   - Search: member ID (ส่งเป็น `q`)
4. **Pagination**: page state, reset → 1 เมื่อเปลี่ยน filter/search
5. **Columns**: type, member, amount, balance_before, balance_after, date
6. **Read-only** — ไม่มี create/edit/delete

## 🎨 UI Spec (หลัก)
- Linear/Vercel dark theme (ตาม comment top of file)
- Filter bar: btn-primary (active) / btn-ghost (inactive)
- Money format: `fmtMoney` → `฿x,xxx.xx` (ใช้ Math.abs — สีแยก +/- ด้วย badge type)

## ⚠️ Edge Cases
- Loading → `<Loading inline text="กำลังโหลด..." />`
- Empty → ต้องแสดง EmptyState (ตรวจสอบว่ามีใน code — WIP)
- Member ID ไม่พบ → backend คืน items=[] , total=0

## 🔗 Related
- Backend: lotto-standalone-admin-api/docs/rules/transactions.md
- Related pages: member detail (show transactions per-member)
- Report: docs/rules/report_pages.md

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
