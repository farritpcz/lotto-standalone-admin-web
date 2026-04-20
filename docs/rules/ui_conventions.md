# UI Conventions — กฏ UI ทั่วทั้งระบบ

> Last updated: 2026-04-20
> Related code: `src/components/ConfirmDialog.tsx:49`, `src/components/Toast.tsx:221`

## Purpose
กฏสากลของ UI ใน `lotto-standalone-admin-web` — ครอบคลุม confirm/alert,
การใช้ ConfirmDialog/Toast, theme, ปุ่ม, สี status และ typography

## Rules (กฏเงื่อนไข UI/UX)

### 1. ห้ามใช้ browser dialog ทุกรูปแบบ
- ห้าม `alert(...)` — ใช้ `useToast().toast.error/success/warning/info(msg)` แทน
- ห้าม `confirm(...)` — ใช้ `<ConfirmDialog />` (state-driven) แทน
- ห้าม `prompt(...)` — ใช้ input field ใน modal เสมอ
- เหตุผล: browser dialog block thread, ไม่รองรับภาษาไทย, ไม่ match theme

### 2. ConfirmDialog pattern
```tsx
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'

const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)

setDialog({
  title: 'ยกเลิกรอบ',
  message: 'ยืนยันยกเลิกรอบ #5?\nระบบจะคืนเครดิตทุก bet',
  type: 'danger',              // 'warning' | 'danger' | 'info'
  confirmLabel: 'ยืนยัน',
  cancelLabel: 'ยกเลิก',
  onConfirm: () => { doAction(); setDialog(null) },
  onCancel: () => setDialog(null),
})

{dialog && <ConfirmDialog {...dialog} />}
```

### 3. Toast pattern
- ครอบ root ด้วย `<ToastProvider>` (มีอยู่แล้วใน `AdminLayout.tsx:48`)
- ทุก action ที่สำเร็จ/ล้มเหลว ต้องเรียก `toast.success()` หรือ `toast.error()`
- auto-dismiss 3 วินาที (ดู `src/components/Toast.tsx:249`)
- ห้ามใช้ inline error text แทน toast ยกเว้นกรณี form validation

### 4. ภาษา
- UI ภาษาไทยเป็นหลัก — label/button/title/message ไทยล้วน
- ศัพท์เทคนิค (status code, API path) ใช้อังกฤษ
- รหัส (username, email) ไม่แปล

### 5. สถานะ (status colors) — ใช้ CSS var
- success: `var(--status-success)` `#00e5a0`
- error: `var(--status-error)` `#ef4444`
- warning: `#f59e0b`
- info: `#3b82f6`
- ห้าม hardcode hex ในหน้าใหม่ — อ้าง CSS var ใน `src/app/globals.css`

### 6. ปุ่ม
- primary action: `className="btn btn-primary"` (สี accent)
- destructive: `className="btn btn-danger"` (สีแดง) — destructive = ลบ/ยกเลิก/void
- neutral cancel: `className="btn btn-secondary"`
- success confirm: `className="btn btn-success"`
- ทุก destructive ต้องมี `ConfirmDialog` ยืนยันก่อน

### 7. Icon — Lucide เท่านั้น
- import จาก `lucide-react` เสมอ
- size 14-16 สำหรับ inline, 18-20 สำหรับ toolbar, 28+ สำหรับ empty/hero
- ห้าม emoji ในปุ่ม/ตาราง (ยกเว้น ConfirmDialog icon)

## UI Spec
- Layout: grid/flex ด้วย inline style (เพราะใช้ CSS var จาก theme)
- Font: ระบบ default (Prompt/Inter จาก `globals.css`)
- Radius: 6-8px (inputs), 10-12px (cards, modals)
- Spacing: 4/8/12/16/24 (rem/px tokens)

## User Flow (typical destructive action)
1. User click ปุ่ม danger → setDialog(...)
2. ConfirmDialog ขึ้น → user กดยืนยัน
3. onConfirm → call API → toast.success/error
4. onCancel หรือ onConfirm finished → setDialog(null)

## API Calls
ไม่มี — ไฟล์นี้คุม UI layer เท่านั้น

## Edge Cases
- ConfirmDialog ซ้อนกัน: ห้าม — ปิดอันเดิมก่อนเปิดใหม่
- Toast spam: addToast ใน loop ได้ เพราะมี id unique แต่ไม่ควรเกิน 3 พร้อมกัน
- Offline: toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')

## Source of Truth (file:line)
- ConfirmDialog: `src/components/ConfirmDialog.tsx:49`
- Toast Provider: `src/components/Toast.tsx:221`
- useToast hook: `src/components/Toast.tsx:96`
- Layout wrapper: `src/components/AdminLayout.tsx:48`
- Global theme: `src/app/globals.css`
- Memory note: `~/.claude/projects/.../feedback_no_browser_alert.md`

## Change Log
- 2026-04-20: Initial — กฏ no-alert/no-confirm, ConfirmDialog/Toast pattern
