# Activity Log UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule, WIP)
> Related code: src/app/activity-log/page.tsx

## 🎯 Purpose
แสดง log การกระทำของ admin (login, approve deposit/withdraw, submit result, change status, ban, etc.) เพื่อตรวจสอบย้อนหลัง

## 📋 Rules
1. **Data source**: ⭐ ใช้ mock data (`mockLogs`) — ยังไม่ต่อ API จริง
2. **Filter**: dropdown เลือก action + search box (ค้นใน `detail` หรือ `admin`)
3. **Badge mapping**: กำหนดใน `actionBadge` (login/logout/deposit_approve/withdraw_approve/result_submit/member_status/balance_adjust/round_status/ban_create/ban_delete/setting_update)
4. **Format date**: helper `fmtDate` → `YYYY-MM-DD HH:mm`
5. **Layout**: page-header (title + count) + filter bar + table
6. **No write actions** — หน้านี้อ่านอย่างเดียว

## 🎨 UI Spec (หลัก)
- ใช้ class `page-container`, `page-header`, `input`, `badge-*`
- Filter bar: select 180px + spacer + search 200px (height 32)

## ⚠️ Edge Cases
- Unknown action → fallback ไม่มี badge (ตอนนี้โค้ดไม่ handle — WIP)
- Empty state หลัง filter → ต้องแสดง "ไม่พบ log"

## 🔗 Related
- Backend counterpart (ยังไม่มี): lotto-standalone-admin-api/docs/rules/activity_log.md
- Pattern reference: docs/rules/data_table_pattern.md

## 📝 Change Log
- 2026-04-20: v1 initial skeleton (page still uses mock data — expand when API ready)
