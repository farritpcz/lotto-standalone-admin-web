# Contact Channels UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: src/app/contact-channels/page.tsx

## 🎯 Purpose
CRUD ช่องทางติดต่อ (LINE, Telegram, Facebook, WhatsApp, Phone, Email, Website, Other) ที่จะโชว์บน member-web footer/contact widget

## 📋 Rules
1. **Data flow**: `load()` → `api.get('/contact-channels')` on mount
2. **Platforms**: const `PLATFORMS` (8 ตัว) → ใช้ icon + color จาก Lucide
3. **Actions**:
   - Add: `api.post('/contact-channels', form)`
   - Edit: `api.put('/contact-channels/:id', form)`
   - Delete: `api.delete(...)` — ผ่าน `ConfirmDialog`
4. **Form fields**: platform, name, value, link_url, qr_code_url (optional image upload), sort_order
5. **Validation**: name + value บังคับกรอก → `setMessage({type:'error'})` ถ้าว่าง
6. **Feedback**: toast/message auto-dismiss 3 วิ
7. **Image upload**: ใช้ component `<ImageUpload>` + `resolveImageUrl` (สำหรับ qr_code_url)

## 🎨 UI Spec (หลัก)
- Grid/list cards — แต่ละ channel = card (icon color + platform label + value + edit/delete)
- Modal สำหรับ add/edit

## ⚠️ Edge Cases
- Channel ไม่มี icon_url → fallback Lucide icon จาก PLATFORMS
- is_active = false → แสดง badge-neutral
- Loading → `<Loading>` component

## 🔗 Related
- Backend: lotto-standalone-admin-api/docs/rules/contact_channels.md
- Member-web consumer: lotto-standalone-member-web/src/components/ContactWidget.tsx

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
