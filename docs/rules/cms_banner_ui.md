# CMS Banner UI — BannerManager + Drag-Drop + Aspect Ratio

> Last updated: 2026-04-20
> Related code: `src/components/cms/BannerManager.tsx:58`, `src/app/cms/page.tsx`,
> `src/components/ImageUpload.tsx`

## Purpose
หน้าจัดการแบนเนอร์หน้าแรก (member-web) — CRUD + จัดลำดับ drag-drop,
live preview 16:5, toggle active inline

## Rules

### 1. Grid layout
- Card grid responsive: `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`
- Card aspect ratio: **16:5** (ตรงกับ banner จริงบน member-web)
- gap: 16px
- hover: lift 2px + shadow

### 2. Drag-drop reorder (@dnd-kit)
- library: `@dnd-kit/core` + `@dnd-kit/sortable`
- sensor: `PointerSensor` with `activationConstraint.distance: 8` (กันคลิกแล้วลาก)
- grip handle: `<GripVertical />` icon มุมบนซ้ายของ card
- onDragEnd → optimistic update → `PUT /cms/banners/reorder`
  → fail → rollback state เดิม + toast.error
- keyboard support: `KeyboardSensor` ด้วย sortableKeyboardCoordinates

### 3. Modal (add/edit)
ฟิลด์:
- `title` (string, optional): ชื่อแบนเนอร์
- `image_url` (string, required): ผ่าน `<ImageUpload />`
- `link_url` (string, optional): URL เมื่อคลิก (validate http/https)
- `is_active` (boolean): toggle

Live preview:
- แสดงรูป 16:5 ใน modal real-time หลังอัพโหลด
- ถ้ายังไม่มีรูป → placeholder "ยังไม่มีรูป"

### 4. ImageUpload component
- ไฟล์ที่รองรับ: jpg, jpeg, png, webp
- max size: 5MB (ฝั่ง client ตรวจ)
- upload ไป `/api/v1/upload` → ได้ `image_url` กลับ
- แสดง progress bar ขณะอัพโหลด
- ใช้ `resolveImageUrl()` จาก `src/lib/imageUrl.ts` ตอน render

### 5. Toggle active inline
- คลิก badge active/inactive บน card → flip + call API
- ไม่ต้อง ConfirmDialog (ย้อนได้ง่าย)

### 6. Delete
- ไอคอน trash มุมบนขวา
- ต้อง `<ConfirmDialog type="danger">` ก่อนลบ
- ลบสำเร็จ → toast + reload list

### 7. Stats bar
- ด้านบน grid: ทั้งหมด {n} | แสดง {active} | ซ่อน {inactive}
- อัพเดท realtime จาก items state

## UI Spec
- Card: radius 10, border `var(--border)`, bg `var(--bg-surface)`
- Image: `object-fit: cover`, aspect 16/5
- Overlay (drag handle + active badge): `rgba(0,0,0,0.5)` gradient
- Modal width: 560px, radius 12

## User Flow
1. Mount → `GET /cms/banners` → items state
2. Click "เพิ่มแบนเนอร์" → openAdd() → modal empty
3. Upload image → preview → fill title/link → Save
4. Drag card → reorder → optimistic → PUT reorder → toast
5. Click trash → ConfirmDialog → DELETE → toast → reload

## API Calls
จาก `src/lib/api.ts:698`:
- `GET /cms/banners` — `cmsApi.listBanners()`
- `POST /cms/banners` — `cmsApi.createBanner(data)`
- `PUT /cms/banners/:id` — `cmsApi.updateBanner(id, data)`
- `DELETE /cms/banners/:id` — `cmsApi.deleteBanner(id)`
- `PUT /cms/banners/reorder` — `cmsApi.reorderBanners(orders)`
- `GET /cms/ticker` / `PUT /cms/ticker` — ticker text แยก

## Edge Cases
- อัพโหลดรูปใหญ่ > 5MB → toast.error ก่อนยิง API
- Drag-drop fail: rollback ใช้ `setItems(banners)` (props เดิม)
- ลบแบนเนอร์ที่กำลังใช้งาน active: เตือนใน ConfirmDialog
- Ticker (ข้อความวิ่ง): text เดียว - ไม่ใช่ list, GET/PUT simple

## Source of Truth (file:line)
- BannerManager: `src/components/cms/BannerManager.tsx:58`
- CMS Page: `src/app/cms/page.tsx`
- ImageUpload: `src/components/ImageUpload.tsx`
- imageUrl resolver: `src/lib/imageUrl.ts`
- API contract: `../../../lotto-standalone-admin-api/docs/rules/cms.md`

## Change Log
- 2026-04-20: Initial — drag-drop + 16:5 aspect + live preview
