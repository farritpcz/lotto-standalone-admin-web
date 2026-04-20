# Deposits UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: `src/app/deposits/page.tsx`

## 🎯 Purpose
admin ดูรายการฝาก, ตรวจ deposit slip (EasySlip), อนุมัติ/ปฏิเสธด้วยมือ, reconcile กับธนาคาร — ทั้ง manual + RKAuto auto-deposit

## 📋 Rules
1. **Route**: `/deposits`
2. **Data flow**: `depositApi.list()` + polling 15-30s ถ้า auto-mode เปิด (เห็น auto approval real-time)
3. **Status flow**: pending → approved / rejected (+ auto-approved จาก RKAuto webhook)
4. **Slip verification**:
   - รูป slip upload ผ่าน member → EasySlip API ตรวจ → flag reliability score
   - admin เห็น preview + score + raw response (ดู `easyslip_config.md`)
5. **Approve/Reject**:
   - Required: reason (ถ้า reject), amount (confirm), bank_account_id ที่รับ
   - Action → update wallet balance + insert transaction
6. **Filter**: status + method (manual/rkauto/easyslip) + date range + member
7. **No browser alert** — ใช้ `ConfirmDialog` + `resultAlert`
8. **Toast (preference)**: ใช้ `toast.success()` / `toast.error()` (ห้าม `alert()`)

## 🎨 UI Spec
- page-container + page-header + filter bar (sticky)
- DataTable — row click เปิด modal preview slip (zoomable) + decision buttons
- Status badges + method icons (🏦 manual / 🤖 auto / 📸 slip)
- Running totals (CountUp): approved today, pending count

## ⚠️ Edge Cases
- Slip ซ้ำ (reference duplicate) → backend 409 → โชว์ duplicate warning
- Race: 2 admin approve deposit เดียวกัน → backend lock; loser ได้ toast error
- Amount ในสลิปไม่ตรงกับที่ member request → admin เลือก override ด้วย reason

## 🔗 Related
- Backend: `lotto-standalone-admin-api/docs/rules/deposit_withdraw_admin.md`
- EasySlip: `easyslip_config.md`
- RKAuto: `rkauto_webhook.md`
- Member-side: `lotto-standalone-member-web/src/app/(member)/wallet/deposit/`

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
