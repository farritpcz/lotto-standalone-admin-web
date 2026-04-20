# Member Levels UI — หน้า `/member-levels` (Admin Web, v3)

> Last updated: 2026-04-20 (v3 redesign — Ladder + Distribution chart)
> Related code: `src/app/member-levels/page.tsx`, `src/lib/api.ts` (`memberLevelApi`)

## 🎯 Purpose
Admin UI สำหรับจัดการระดับสมาชิก v3 — ใช้ Design **Ladder + Mini Distribution Chart**
เน้นภาพ + insight ทางธุรกิจ (distribution) + CRUD ง่าย

## 📋 Rules

### Layout (top → bottom)
1. **Header** — title + ปุ่ม "เพิ่มระดับ"
2. **Info Panel** — อธิบายกฎ rolling 30d + เวลา cron 02:00 (ต้องใส่เสมอ)
3. **Distribution Chart** — bar แนวนอน เรียง sort_order ASC + unassigned (มุมล่าง, dimmed)
4. **Ladder** — tier cards เรียง sort_order DESC (สูง→ต่ำ) + **gap indicator** ระหว่าง tier
5. **Modal** Create/Edit (click-outside-close) — ฟอร์ม 5 field + **Live Preview badge**

### Form Fields (v3 เท่านั้น)
6. `name` *required*, `color` (hex), `icon` (Lucide name — optional), `min_deposit_30d` (บาท), `description`
7. **ห้ามใส่** commission_rate/cashback_rate/bonus_pct/max_withdraw_day/min_bets (v2 เก่า — ลบออกจาก DB แล้ว)
8. **Live preview** ใน modal ต้องอัพเดต real-time ตามที่พิมพ์ → user เห็นก่อน save

### Info Panel copy (บังคับใส่ — consistency กับ member-web)
9. > "ระบบเลื่อนระดับอัตโนมัติ — ตรวจสอบทุกวัน 02:00 น. (Asia/Bangkok) คิดจากยอดฝาก 30 วันล่าสุด
>    สมาชิกเลื่อนขึ้นอัตโนมัติเมื่อยอดฝาก 30 วันถึงเกณฑ์ — และ**ตกลงอัตโนมัติ**หากยอดฝากลดลงต่ำกว่าเกณฑ์
>    (ยกเว้นสมาชิกที่ถูกแอดมินล็อกไว้)"

### Tier Card spec
10. Border-left 4px = `level.color` — visual continuity กับ member-web badge
11. Badge 52×52 แสดงอักษรแรกของชื่อ + box-shadow สี level
12. แสดง: ชื่อ + status badge + `min_deposit_30d` + description + member_count + edit/delete
13. Member count = จาก API `levels[].member_count` (compute ใน backend)

### Gap indicator
14. ระหว่าง tier ใน ladder → แสดงเส้น + pill `↓ gap ฿XX,XXX` = `curr.min_deposit_30d - below.min_deposit_30d`
15. **ไม่แสดงถ้า gap=0** หรือเป็น tier สุดท้าย

### Distribution chart
16. คำนวณ % จาก `totalMembers = SUM(levels[].member_count) + unassigned`
17. แสดง unassigned (สมาชิก level_id=NULL) **ท้าย** + `opacity: 0.65` + สี `#6b7280`
18. Bar แสดง min 2% width ถ้า pct > 0 (ป้องกันแถบหายไปเลย)
19. มี transition `width 400ms ease` ตอนโหลด + รีเฟรช

### Delete safety
20. ถ้ามี member อยู่ใน level นั้น → message: "⚠️ มีสมาชิก X คน — ไม่สามารถลบได้"
21. Confirm dialog ใช้ `ConfirmDialog` component (ห้ามใช้ `confirm()` — ดู `feedback_no_browser_alert.md`)

### API Response handling
22. `memberLevelApi.list()` ตอนนี้คืน `{data: {levels: [...], unassigned: N}}` (v2 คืน array ตรงๆ)
23. Component ต้อง unwrap: `res.data.data.levels` + `res.data.data.unassigned`

## 🎨 UI Spec (เฉพาะส่วนเด่น)
- **Color palette**: ใช้ `level.color` เป็น accent ต่อ tier — Bronze #CD7F32, Silver #C0C0C0, Gold #FFD700, Diamond #B9F2FF
- **Typography**: title 16-20px bold, threshold mono font (`var(--font-mono)`)
- **Spacing**: ladder cards gap 8px + gap indicator 4px padding → แน่นและเป็นระเบียบ
- **Accessibility**: tooltip `title=""` บนปุ่ม edit/delete icon-only

## 🔄 User Flow
1. Admin เข้า `/member-levels` → เห็น distribution chart ทันที → รู้ว่า tier ไหนแน่น/ว่าง
2. กด "เพิ่มระดับ" → modal เปิด → พิมพ์ชื่อ/เลือกสี/ไอคอน/threshold → เห็น preview badge → บันทึก
3. กด icon ปากกา (tier card) → modal พร้อม data เดิม → แก้ → บันทึก
4. กด icon ถัง → confirm dialog (danger) → ลบ (ถ้าไม่มี member)

## ⚠️ Edge Cases
- **ยังไม่มี level**: แสดง empty state "ยังไม่มีระดับสมาชิก — กด 'เพิ่มระดับ' เพื่อเริ่มต้น"
- **API error**: toast.error("โหลดข้อมูล Level ไม่สำเร็จ") — ไม่ crash
- **Color = สีเดียวกับ background**: แม้ไม่มี validation แต่ live preview ช่วยให้ admin เห็นก่อน
- **ชื่อซ้ำใน scope**: backend คืน 400 → toast.error(msg ตรงๆ)
- **Node admin**: API filter agent_node_id อัตโนมัติ → UI ไม่เห็นของ node อื่น (เท่าที่ควร)

## 🔗 Related
- Backend rule: `../../lotto-standalone-admin-api/docs/rules/member_levels.md`
- Member view rule: `../../lotto-standalone-member-web/docs/rules/profile_level.md`
- API types: `src/lib/api.ts` (`MemberLevel`, `MemberLevelListResp`, `MemberLevelHistory`)

## 📝 Change Log
- 2026-04-20: **v3 redesign** — Ladder + Distribution chart, โละฟอร์มเดิม (5 field เก่า), เพิ่ม Info Panel + Live Preview
