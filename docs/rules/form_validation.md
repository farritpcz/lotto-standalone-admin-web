# Form Validation — Pattern + Error Display

> Last updated: 2026-04-20
> Related code: `src/app/(auth)/login/page.tsx:24`,
> `src/components/cms/BannerManager.tsx:96`

## Purpose
มาตรฐาน form validation ใน admin web — inline field error + submit error,
การ disable ปุ่มขณะ submit, pattern ต่าง input type (text, number, date, file)

## Rules

### 1. Validation layers (ตามลำดับ)
1. **HTML5 native** — `required`, `type="email"`, `minLength`, `pattern` (fallback)
2. **onSubmit guard** — ตรวจใน handleSubmit ก่อน call API
3. **Server response** — จับ error response แล้ว toast.error / setFieldError
4. ห้ามเขียน library ใหม่ (Formik/react-hook-form) — ใช้ useState ธรรมดา

### 2. State pattern
```tsx
const [form, setForm] = useState({ username: '', password: '' })
const [errors, setErrors] = useState<Record<string, string>>({})
const [submitting, setSubmitting] = useState(false)

const validate = (): boolean => {
  const e: Record<string, string> = {}
  if (!form.username.trim()) e.username = 'กรุณากรอกชื่อผู้ใช้'
  if (form.password.length < 6) e.password = 'รหัสผ่านต้องไม่น้อยกว่า 6 ตัวอักษร'
  setErrors(e)
  return Object.keys(e).length === 0
}

const onSubmit = async (ev: React.FormEvent) => {
  ev.preventDefault()
  if (!validate()) return
  setSubmitting(true)
  try {
    await api.post('/xxx', form)
    toast.success('บันทึกสำเร็จ')
  } catch (err) {
    // field-level error จาก backend (422 response)
    const fieldErrors = err.response?.data?.errors
    if (fieldErrors) setErrors(fieldErrors)
    else toast.error('เกิดข้อผิดพลาด')
  } finally { setSubmitting(false) }
}
```

### 3. Error display
- Inline field error: ใต้ input, สี `var(--status-error)`, font-size 12, mt: 4
- Submit-level error: banner แดงด้านบน form (ดู `login/page.tsx:78`)
- ห้ามใช้ `alert()` แสดง validation error

### 4. Input rules
- Required field: ดาว `*` สีแดงข้าง label
- Number input: `type="number"` + `min`/`max`/`step` — format comma ใน display เท่านั้น
- Date: `type="date"` (native picker) — value = `YYYY-MM-DD`
- File: ใช้ `<ImageUpload />` component (ดู `src/components/ImageUpload.tsx`)
- Password: `type="password"` + optional toggle eye icon

### 5. Submit button
- `disabled={submitting}` เสมอ
- text เปลี่ยนเป็น "กำลังบันทึก..." / "กำลังเข้าสู่ระบบ..."
- ไม่ตั้ง `type="button"` ใน submit (กันคลิก 2 ครั้ง)

### 6. Field types ในระบบ
- จำนวนเงิน: parse `parseFloat`, display `toLocaleString('th-TH')`
- เบอร์โทร: `pattern="[0-9]{9,10}"`
- username: `pattern="[a-zA-Z0-9_]{4,20}"` + lowercase on submit
- ภาษาไทย: ไม่ต้อง pattern (UTF-8 รองรับ)

## UI Spec
- Label: 12-13px, `var(--text-secondary)`, mb: 6
- Input: height 38, radius 6, border `var(--border)`
- Focus: border `var(--accent)` + ring shadow
- Error state: border `var(--status-error)` + inline error text

## User Flow
1. User พิมพ์ → onChange update state
2. Blur → ไม่ validate (เลื่อนไปตอน submit)
3. Submit → validate → call API → handle response
4. Success → toast + ปิด modal / redirect
5. Error → set errors หรือ toast

## API Calls
- ต้อง match contract ใน `../../../lotto-standalone-admin-api/docs/rules/` (แต่ละ module)
- field error response: `{ errors: { field: "ข้อความ" } }` 422

## Edge Cases
- Double submit: ป้องกันด้วย `submitting` state
- XSS input: React escape default — ห้าม `dangerouslySetInnerHTML` จาก user input
- ช่องว่างหน้า/หลัง: `.trim()` ก่อน validate และก่อน submit
- Encoding: UTF-8 ทุกครั้ง (ดู memory `feedback_thai_encoding.md`)

## Source of Truth (file:line)
- Login form pattern: `src/app/(auth)/login/page.tsx:24`
- BannerManager modal (add/edit): `src/components/cms/BannerManager.tsx:96`
- API client (error interceptor): `src/lib/api.ts:41`
- API contract: `../../../lotto-standalone-admin-api/docs/rules/` (ดู auth.md, members.md)

## Change Log
- 2026-04-20: Initial — pattern useState + server field errors
