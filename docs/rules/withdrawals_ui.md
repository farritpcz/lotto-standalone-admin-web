# Withdrawals UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: `src/app/withdrawals/page.tsx`

## 🎯 Purpose
admin ดูรายการถอน, อนุมัติ/ปฏิเสธด้วยมือ, trigger auto-pay (RKAuto), reconcile — คู่กับ `deposits_ui.md`

## 📋 Rules
1. **Route**: `/withdrawals`
2. **Data flow**: `withdrawApi.list()` + polling 15-30s ถ้า RKAuto auto-mode เปิด
3. **Status flow**: pending → approved → paid / rejected / failed
4. **Approve action**:
   - Backend lock wallet (deduct balance) ก่อน trigger payment → ถ้า fail refund
   - Required: admin note (optional), confirm amount
5. **Reject action**: required reason → refund balance (ไม่เคยถูก deduct ถ้า still pending)
6. **Auto-pay (RKAuto)**: flag `auto=true` → webhook update status paid/failed (ดู `rkauto_webhook.md`)
7. **Filter**: status + method + date range + member + amount range
8. **Toast (preference)**: `toast.success()` / `toast.error()` แทน `alert()`
9. **No browser alert** — ใช้ `ConfirmDialog` + `resultAlert`

## 🎨 UI Spec
- page-container + page-header + filter bar (sticky)
- DataTable: member, amount, bank (to), status, method, requested_at
- Row click → detail modal (bank info + history + approve/reject/retry)
- Badges: status color + method icon (🤖 auto / 🏦 manual)
- Running totals (CountUp): pending total, approved today

## ⚠️ Edge Cases
- ธนาคารปลายทางปิด → auto-pay fail → ต้อง retry หรือ pay manual
- Member แก้ bank ระหว่างทาง → ใช้ bank ณ เวลา request (lock)
- Double-click approve → backend idempotency (unique transaction_id)
- Member balance < withdraw amount หลัง race → backend reject + แสดง toast

## 🔗 Related
- Backend: `lotto-standalone-admin-api/docs/rules/deposit_withdraw_admin.md`
- RKAuto: `rkauto_webhook.md`
- Deposits counterpart: `deposits_ui.md`
- Transactions: `transactions_ui.md`

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
