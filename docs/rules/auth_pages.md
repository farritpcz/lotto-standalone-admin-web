# Auth Pages — Admin / Node Login

> Last updated: 2026-04-20
> Related code: `src/app/(auth)/login/page.tsx:17`, `src/lib/api.ts:67`,
> `src/components/AdminLayout.tsx:25`

## Purpose
หน้า login เดียวรองรับทั้ง admin (ตาราง `admins`) และ node (ตาราง `agent_nodes`)
+ logic redirect ตาม role/permissions หลัง login

## Rules

### 1. Login form
- 2 fields: username, password (text + password type)
- HTML5 `required`
- submit button: disable ขณะ loading + text เปลี่ยน
- error banner สีแดง (ยังไม่มี field-level error เพราะ backend ไม่ส่งแยก)

### 2. API flow
- `POST /api/v1/auth/login` — `adminAuthApi.login({ username, password })`
- Backend ลอง `admins` ก่อน → ไม่เจอ → ลอง `agent_nodes`
- Response: `{ data: { user_type: 'admin' | 'node', admin: {...}, ... } }`

### 3. Response handling
```tsx
const userType = res.data.data?.user_type || 'admin'

if (userType === 'node') {
  // เก็บ localStorage: user_type, node_id, node_role, node_name,
  //   share_percent, admin_role, admin_permissions
  // redirect ตาม role:
  //   owner/admin → /dashboard
  //   operator/viewer → หน้าแรกที่มี permission
} else {
  // admin: user_type='admin', admin_role, admin_permissions
  // redirect → /dashboard
}
```
ดู `src/app/(auth)/login/page.tsx:30-65`

### 4. localStorage keys (ต้องเก็บ/เคลียร์)
- `user_type` — `'admin' | 'node'`
- `admin_role` — `'owner' | 'admin' | 'operator' | 'viewer'`
- `admin_permissions` — JSON string array
- `node_id`, `node_role`, `node_name`, `share_percent` (สำหรับ node)
- `admin_token` — deprecated (ใช้ httpOnly cookie แทน) แต่ลบเมื่อ logout

### 5. Cookie-based auth
- Backend set httpOnly cookie `admin_session` (admin) / `node_token` (node)
- CSRF: อ่าน `admin_csrf_token` cookie → ส่งกลับใน `X-CSRF-Token` header
- axios `withCredentials: true` เสมอ (ดู `src/lib/api.ts:28`)

### 6. Session validation & redirect
- ทุก page mount → `AdminLayout` ยิง API ไหนก็ได้ (deposit count)
- 401 response → interceptor redirect `/login` (ยกเว้น path `/login` / `/node`)
- ดู `src/lib/api.ts:44`

### 7. Logout
- `POST /auth/logout` → backend ลบ cookie
- client ลบ localStorage ทั้งหมด
- redirect `/login`

### 8. Node portal separate
- Node user หลัง login → redirect `/node/portal` (ถ้าเป็น node pure)
- แต่ role=owner/admin ของ node → redirect `/dashboard` (เห็นทุกอย่าง)
- Node ใช้ cookie `node_token` แยกจาก admin — ห้ามผสม

## UI Spec
- background: `bg-gray-900` (Tailwind ยังใช้ได้ในหน้านี้)
- card: max-width 480, radius 16, padding 32
- input: dark gray, focus border-blue-500
- button: blue-600 primary, height 48
- title: "เข้าสู่ระบบ" + subtitle "Lotto — Admin / สายงาน"

## User Flow
1. Landing `/` → redirect `/login` (middleware)
2. User กรอก username/password → submit
3. Success → localStorage + `window.location.href` (ไม่ใช้ router.push
   เพราะต้อง reload เพื่อให้ cookie active)
4. Fail → `setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')`
5. Mount page ใหม่ → AdminLayout validate → ok หรือ redirect login

## API Calls
- `POST /api/v1/auth/login` — `src/lib/api.ts:68`
- `POST /api/v1/auth/logout` — `src/lib/api.ts:71`
- `POST /api/v1/node/auth/login` — `src/lib/api.ts:313` (ใช้เฉพาะ fallback)
- `POST /api/v1/node/auth/logout` — `src/lib/api.ts:316`

## Edge Cases
- user_type=node + role=viewer + no permissions → redirect `/dashboard` anyway
- Cookie หมดอายุ ระหว่างใช้งาน → 401 → auto redirect login
- Concurrent login หลาย tab: cookie share ได้ แต่ localStorage แยก tab
- `/node/*` path → interceptor ไม่ redirect (ใช้ cookie คนละตัว)
- `middleware.ts` ของ Next ที่ root: ตรวจ auth ระดับ route (ดู `src/middleware.ts`)

## Source of Truth (file:line)
- Login page: `src/app/(auth)/login/page.tsx:17`
- handleSubmit: `src/app/(auth)/login/page.tsx:24`
- API auth: `src/lib/api.ts:67`, `:311`
- Interceptor 401: `src/lib/api.ts:41`
- Layout validate: `src/components/AdminLayout.tsx:25`
- Middleware: `src/middleware.ts`
- API contract: `../../../lotto-standalone-admin-api/docs/rules/auth.md`

## Change Log
- 2026-04-20: Initial — admin+node unified login, cookie auth, permission redirect
