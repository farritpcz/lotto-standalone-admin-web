# Promotions UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: src/app/promotions/page.tsx

## 🎯 Purpose
CRUD โปรโมชั่น (สมัครใหม่, ฝากเงิน, คืนยอดเสีย, เครดิตฟรี) พร้อมเงื่อนไข min deposit / max bonus / turnover / ระยะเวลา

## 📋 Rules
1. **Data flow**: `promotionApi.list()` on mount via `loadPromos()`
2. **Types** (typeBadge): `first_deposit`, `deposit`, `cashback`, `free_credit`
3. **Status** (statusBadge): `active`, `inactive`, `expired` (expired = auto เมื่อเกิน end_date)
4. **Actions**:
   - Create: `promotionApi.create` — default start=today, end=+30 วัน
   - Edit: `promotionApi.update`
   - Delete: ผ่าน `ConfirmDialog`
   - Toggle active: ToggleLeft/ToggleRight icon
5. **Form fields**: name, type, description, image_url (ImageUpload), bonus_pct, max_bonus, min_deposit, turnover, max_per_member, max_total, start_date, end_date
6. **Feedback**: `useToast()` — error เวลาโหลด/บันทึกล้มเหลว
7. **Money format**: `fmtMoney` → `฿x,xxx.xx`

## 🎨 UI Spec (หลัก)
- Table แบบ card-surface + modal create/edit
- Badge สี: active=success, inactive=warning, expired=error

## ⚠️ Edge Cases
- end_date < start_date → validate ก่อน submit (TODO ถ้ายังไม่มี)
- max_total = 0 → unlimited
- image_url ว่าง → fallback placeholder

## 🔗 Related
- Backend: lotto-standalone-admin-api/docs/rules/promotions.md
- Member-web redeem flow: lotto-standalone-member-web/src/app/promotions

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
