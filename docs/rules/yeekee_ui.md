# Yeekee UI — admin-web

> Last updated: 2026-04-20 (v1 initial — starter rule)
> Related code: `src/app/yeekee/page.tsx`, `src/app/yeekee/[id]/page.tsx`, `src/app/yeekee/config/page.tsx`

## 🎯 Purpose
admin ดู/ตรวจรอบยี่กี + shoots, trigger manual settle, ตั้งค่า yeekee config ต่อ agent — คู่กับ backend `yeekee_admin.md`

## 📋 Rules
1. **Routes**:
   - `/yeekee` — list รอบปัจจุบัน + history (สถานะ open/closed/settled)
   - `/yeekee/[id]` — detail ต่อรอบ (shoots + stats + bets summary)
   - `/yeekee/config` — ตั้งค่า agent (จำนวนรอบ/วัน, ช่วงเวลา, min/max bet)
2. **Auto-open awareness**: รอบสร้างเอง by cron — admin ดูเท่านั้น ไม่สร้างเอง (ดู memory `agent_rules`)
3. **Shoots live view**: รอบ open → polling 5-10s แสดง shoots real-time; รอบ settled → static
4. **Manual settle**:
   - ใช้เมื่อ auto-settle fail (เช่น shoots ไม่ครบ)
   - ต้องยืนยัน 2 step (`ConfirmDialog` + input รอบ ID พิมพ์ยืนยัน)
   - Irreversible — แสดง warning ชัด
5. **Config validation**:
   - time windows ไม่ทับกัน
   - min_bet ≤ max_bet
   - จำนวนรอบ > 0
6. **No browser alert** — ใช้ `ConfirmDialog` + `resultAlert`

## 🎨 UI Spec
- `/yeekee`: list + status badge + countdown (รอบเปิดปิดเมื่อไหร่) + click → detail
- `/yeekee/[id]`: header (รอบ info + countdown) + shoots timeline + stats summary + action (settle/cancel)
- `/yeekee/config`: tabs by agent setting group — form + preview schedule

## ⚠️ Edge Cases
- Round ยัง open อยู่แต่กด settle → reject + แสดง remaining time
- Config เปลี่ยนระหว่างวัน → มีผลกับรอบถัดไป (แสดง note ใน UI)
- Shoots หายบางนาที → แสดง warning icon + option settle ทั้งที่มี

## 🔗 Related
- Backend: `lotto-standalone-admin-api/docs/rules/yeekee_admin.md`
- Lottery types: `lotteries_ui.md`
- Member-side yeekee: `lotto-standalone-member-web/src/app/(member)/yeekee/`
- Rules: memory `agent_rules`, `lottery_types_structure`

## 📝 Change Log
- 2026-04-20: v1 initial skeleton
