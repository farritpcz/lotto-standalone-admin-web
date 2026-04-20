# API Client — Axios Setup + Interceptor + Error Handling

> Last updated: 2026-04-20
> Related code: `src/lib/api.ts:24`, `src/lib/api.ts:41`, `src/components/AdminLayout.tsx:32`

## Purpose
กฏการใช้ axios client + interceptor (CSRF / 401) + ตั้งค่า base URL / cookie
+ pattern การจัดการ error ใน component

## Rules

### 1. Base configuration
- **baseURL:** `/api/v1` (relative) → Next.js rewrites proxy ไป backend
  (same-origin required สำหรับ httpOnly cookie)
- **timeout:** 30000ms
- **withCredentials:** `true` เสมอ — ส่ง cookie ทุก request
- **Content-Type:** `application/json`

ห้ามสร้าง axios instance ใหม่ในหน้า — import `api` จาก `@/lib/api`

### 2. CSRF interceptor (request)
```ts
// อ่าน cookie admin_csrf_token → ส่งกลับใน X-CSRF-Token header
const csrfToken = getCookie('admin_csrf_token')
if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken
```
- backend set CSRF cookie ตอน login
- ทุก mutation (POST/PUT/DELETE) ต้องมี header นี้ ไม่งั้น 403
- ดู `src/lib/api.ts:33`

### 3. 401 interceptor (response)
- 401 → redirect `/login` (ยกเว้น path `/login`, `/node/*`)
- ลบ `localStorage.admin_token` (legacy cleanup)
- ดู `src/lib/api.ts:44`

### 4. Calling APIs
ใช้ grouped API objects เสมอ (แทน raw `api.get(...)`):
```ts
import { memberMgmtApi, betMgmtApi, reportApi } from '@/lib/api'

const res = await memberMgmtApi.list({ page: 1, per_page: 20 })
const items = res.data.data.items         // Envelope pattern
```

### 5. Response envelope
Backend ตอบเป็น:
```json
{
  "data": { "items": [...], "total": 143, "page": 1, "per_page": 20 },
  "message": "..."
}
```
หรือ:
```json
{ "data": { ...single object... } }
```
Error:
```json
{ "error": "message", "errors": { "field": "..." } }  // status 400/422/500
```

### 6. Error handling pattern
```ts
try {
  const res = await memberMgmtApi.update(id, data)
  toast.success('บันทึกสำเร็จ')
} catch (err: any) {
  // field errors (422) → แสดง inline
  if (err.response?.status === 422 && err.response?.data?.errors) {
    setFieldErrors(err.response.data.errors)
  } else {
    // อื่นๆ → toast
    const msg = err.response?.data?.error || 'เกิดข้อผิดพลาด'
    toast.error(msg)
  }
}
```
- ห้าม `console.log(err)` ใน production (ใช้ structured error ถ้าต้องการ)
- 401 จัดการโดย interceptor — ไม่ต้องเช็คใน component
- 403 → toast.error('ไม่มีสิทธิ์') + ไม่ redirect

### 7. Auth flows
- ใช้ `api.post('/auth/login', ...)` หรือ `adminAuthApi.login(...)`
- `withCredentials: true` ทำให้ cookie ที่ backend set มา → browser เก็บเอง
- ไม่ต้องแนบ `Authorization` header (ใช้ cookie)

### 8. TypeScript types
- Interface ที่ใช้บ่อย อยู่ใน `src/lib/api.ts` (AgentNode, ShareTemplate, CmsBanner, ...)
- ถ้า type ใช้ใน component เท่านั้น → declare ใน component
- ใช้ `Record<string, unknown>` สำหรับ params/data ที่ยัง type loose

### 9. ห้าม
- ❌ fetch() native — ใช้ axios `api` เสมอ
- ❌ axios instance ใหม่ที่ไม่มี interceptor
- ❌ บันทึก JWT ใน localStorage (ใช้ cookie only)
- ❌ ยิง API ไปยัง absolute URL `http://localhost:8081/...` (ข้าม proxy → cookie ไม่ติด)

## UI Spec
ไม่มี — ไฟล์นี้คุม data layer

## User Flow
1. Page mount → component ยิง API group
2. Interceptor แนบ CSRF → ส่ง
3. Response → unwrap `.data.data`
4. Error → interceptor (401) → redirect หรือ reject → component แสดง toast

## API Calls
ดู `src/lib/api.ts` — grouped เป็น:
- `adminAuthApi` line 67
- `memberMgmtApi` line 80
- `lotteryMgmtApi` line 89
- `roundMgmtApi` line 96
- `resultMgmtApi` line 112
- `banMgmtApi` line 121
- `rateMgmtApi` line 128
- `betMgmtApi` line 134
- `txMgmtApi` line 146
- `depositApi` line 171
- `withdrawApi` line 187
- `reportApi` line 151
- `settingApi` line 157
- `agentThemeApi` line 163
- `affiliateApi` line 207
- `nodeAuthApi` line 311
- `nodePortalApi` line 319
- `downlineApi` line 416
- `yeekeeMgmtApi` line 484
- `autoBanApi` line 558
- `memberLevelApi` line 622
- `promotionApi` line 665
- `cmsApi` line 698
- `notificationApi` line 750
- `memberCreditApi` line 770

## Edge Cases
- Cookie ถูก block (3rd party cookie disabled): request ส่งไม่ได้ → UI ต้อง same-origin
- Timeout 30s: แสดง toast.error('เครือข่ายช้า')
- Multiple 401 พร้อมกัน: redirect ครั้งเดียว (browser จะ replace location)
- CSRF token หมดอายุ: backend return 403 → ให้ user reload → login ใหม่

## Source of Truth (file:line)
- Client factory: `src/lib/api.ts:24`
- CSRF interceptor: `src/lib/api.ts:33`
- 401 interceptor: `src/lib/api.ts:44`
- getCookie helper: `src/lib/api.ts:18`
- Next.js rewrites: `next.config.ts`
- API contract: `../../../lotto-standalone-admin-api/docs/rules/` (ทุกไฟล์ module)

## Change Log
- 2026-04-20: Initial — axios setup, CSRF + 401 interceptor, envelope pattern
