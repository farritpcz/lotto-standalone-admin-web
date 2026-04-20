# Affiliate UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: `src/app/affiliate/page.tsx`

## 🎯 Purpose
หน้า admin จัดการ affiliate/referral: commission rate ต่อหวย, เงื่อนไขถอน, share templates, manual adjustment — คู่กับ backend `affiliate.md`

## 📋 Rules
1. **Route**: `/affiliate` — tab view (Settings / Report / Share Templates / Adjustments)
2. **Data flow**: fetch ตอน mount → `affiliateApi` (จาก `@/lib/api`)
3. **Commission rate**:
   - แสดงตาราง rate ต่อ lottery_type (rate หน่วยเปอร์เซ็นต์)
   - NULL/blank = default สำหรับทุกประเภท
4. **No browser alert** — ใช้ `ConfirmDialog` + `resultAlert`
5. **Adjustment**: required `reason` (validation client-side + server-side)
6. **Report**: แสดง summary ต่อ member (total paid, pending, count) + export CSV ได้

## 🎨 UI Spec
- page-container + page-header + tabs
- Tab Settings: data table (lottery_type | rate % | เปิด/ปิด) + form แก้ rate
- Tab Report: filter วัน/สมาชิก + table summary + CountUp total
- Tab Templates: card list — เพิ่ม/แก้/ลบ — preview ข้อความก่อนบันทึก
- Tab Adjustments: form (member + amount + reason) + history table

## ⚠️ Edge Cases
- Rate ติดลบ / > 100% → form validation reject
- ลบ setting ที่มี commission pending → backend 409 → แสดง toast error ชัด ๆ
- Empty state: "ยังไม่มีการตั้งค่า" + ปุ่มสร้าง

## 🔗 Related
- Backend: `lotto-standalone-admin-api/docs/rules/affiliate.md`
- Member-side referral: `lotto-standalone-member-web/src/app/(member)/referral/page.tsx`
- Referral system plan: memory `referral_system_plan`

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
