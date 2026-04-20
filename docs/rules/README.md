# 📋 Rule Files — `lotto-standalone-admin-web`

> **Source of truth** ของกฏ/เงื่อนไขแต่ละฟีเจอร์ใน admin frontend (Next.js)
> ทุกครั้งที่แก้ UI/logic ในไฟล์ที่ rule อ้างถึง → **ต้องอัพเดท rule ในคอมมิตเดียวกัน**
> API contract อยู่ที่ `../../../lotto-standalone-admin-api/docs/rules/`

---

## 📚 Index — Rule Files ทั้งหมด

| Status | File | ครอบคลุม |
|--------|------|---------|
| ✅ | `ui_conventions.md` | กฏ UI: ห้าม alert/confirm, ใช้ ConfirmDialog/resultAlert |
| ✅ | `loading_states.md` | Loading, Toast, PageTransition, CountUp, EmptyState rules |
| ✅ | `form_validation.md` | Form validation pattern, error display |
| ✅ | `dashboard_layout.md` | Sidebar, header, responsive breakpoints |
| ✅ | `data_table_pattern.md` | Table + filter + pagination pattern |
| ✅ | `cms_banner_ui.md` | BannerManager component, drag-drop, aspect ratio |
| ✅ | `report_pages.md` | Report UI, export, date filter |
| ✅ | `auth_pages.md` | Admin login UI |
| ✅ | `api_client.md` | Axios setup, interceptor, error handling |

**Legend:** ✅ done · 🚧 partial · ⏳ not started

---

## ✍️ Template (ทุกไฟล์ต้องมีโครงนี้)

```markdown
# [ชื่อฟีเจอร์/หน้า]

> Last updated: YYYY-MM-DD
> Related code: `src/app/xxx/page.tsx:LINE`, `src/components/xxx.tsx:LINE`

## 🎯 Purpose
[หน้านี้/คอมโพเนนต์นี้ทำอะไร — 1-3 บรรทัด]

## 📋 Rules (กฏเงื่อนไข UI/UX)
1. เงื่อนไขข้อ 1 (ห้ามใช้อะไร, ต้องใช้อะไร)
2. เงื่อนไขข้อ 2

## 🎨 UI Spec
- Layout: [grid / flex / responsive breakpoint]
- Colors: [primary / accent / status]
- Spacing: [rem / px]

## 🔄 User Flow
[click → state change → API → UI update]

## 🌐 API Calls
- `GET /api/v1/xxx` — [purpose + rule file reference]

## ⚠️ Edge Cases
- Empty state: [วิธีแสดง]
- Error state: [toast / inline]
- Loading state: [skeleton / spinner]

## 🔗 Source of Truth (file:line)
- Page: `src/app/xxx/page.tsx:10`
- Component: `src/components/xxx.tsx:20`
- Hook: `src/hooks/useXxx.ts:15`
- API contract: `../../../lotto-standalone-admin-api/docs/rules/xxx.md`

## 📝 Change Log
- YYYY-MM-DD: [สิ่งที่เปลี่ยน] (commit abc123)
```

---

## 🔒 Convention

1. **ภาษา:** ไทยเป็นหลัก, ศัพท์เทคนิค/component/prop ใช้ภาษาอังกฤษ
2. **ความยาว:** ไม่เกิน ~200 บรรทัดต่อไฟล์ — ถ้ายาวเกิน → split
3. **ห้ามใช้ `alert()` / `confirm()`** — ใช้ `ConfirmDialog` / `resultAlert` เสมอ
4. **file:line ต้อง up-to-date** — ถ้าย้ายโค้ด ต้องอัพเดท reference
5. **Change log** — เขียนย่อๆ 1 บรรทัด + commit hash
6. **Next.js version** — อ่าน `AGENTS.md` ก่อน ระบบนี้ใช้ Next.js version ที่ไม่เหมือนใน training
