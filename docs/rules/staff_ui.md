# Staff UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: `src/app/staff/page.tsx`

## 🎯 Purpose
Owner/senior admin จัดการ staff ใต้สาย: สร้าง, ตั้ง permission, ดู login history + activity log — คู่กับ backend `staff.md`

## 📋 Rules
1. **Route**: `/staff`
2. **Data flow**: `staffApi.list()`, `staffApi.getPermissions()`, `staffApi.getLoginHistory(id)`, `staffApi.getActivity(id)`
3. **Display**: list + detail modal/drawer (2-pane or modal)
4. **Create staff**:
   - Required: username, password, display_name, permissions (multi-select)
   - Password field: generate + copy-to-clipboard button
   - Permission catalog มาจาก `GET /staff/permissions` (ไม่ hardcode)
5. **Edit staff**:
   - แก้ permission, display_name, status (active/suspended)
   - ห้าม demote owner (disable in UI + backend reject)
   - แก้ password → แยก flow (ปุ่ม "Reset password" → gen new + แสดง 1 ครั้ง)
6. **Status toggle**: active/suspended → `ConfirmDialog` + reason
7. **Delete**: `ConfirmDialog` + confirm username type-to-delete (anti-misclick)
8. **No browser alert** — ใช้ `ConfirmDialog` + `resultAlert`

## 🎨 UI Spec
- page-container + page-header + create button
- Table: username, display_name, role summary (badge count permissions), status, last_login
- Detail view: tabs (Info / Permissions / Login History / Activity)
- Permission picker: group by category (finance.*, lottery.*, system.*, dashboard.*)
- Activity timeline: time + action + target + IP

## ⚠️ Edge Cases
- Staff ลบตัวเอง → UI disable + backend reject
- Staff offline แต่มี session ค้าง → force logout (cascade) เมื่อ suspend
- ดู activity ของ staff ข้าม agent → 403 (scoping)

## 🔗 Related
- Backend: `lotto-standalone-admin-api/docs/rules/staff.md`, `admin_auth.md`, `audit_log.md`
- Activity log pattern: `activity_log_page.md`

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
