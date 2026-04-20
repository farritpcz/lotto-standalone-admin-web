// Component: RuleExplanation — 💡 กฎเหล่านี้ทำงานยังไง? (สอดคล้องกับ threshold จริง)
// Parent: src/app/bans/auto/page.tsx

'use client'

import { AutoBanRuleData } from '@/lib/api'
import { fmtMoney, getBetTypeLabel } from './shared'

interface Props {
  rules: AutoBanRuleData[]
}

export default function RuleExplanation({ rules }: Props) {
  if (rules.length === 0) return null

  // ดึง threshold จริงของ 3 ตัวบน (หรือ bet type แรก)
  const exRule = rules.find(r => r.bet_type === '3TOP') || rules[0]
  const th = Math.floor(exRule.threshold_amount)
  const betTypeName = getBetTypeLabel(exRule.bet_type)
  const rate = exRule.rate || 900

  // หาระดับต่างๆ ของ bet type นี้
  const rulesForType = rules.filter(r => r.bet_type === exRule.bet_type)
  const sortedRules = [...rulesForType].sort((a, b) => a.threshold_amount - b.threshold_amount)
  const maxAmountRule = sortedRules.find(r => r.action === 'max_amount')
  const reduceRateRules = sortedRules.filter(r => r.action === 'reduce_rate')
  const fullBanRule = sortedRules.find(r => r.action === 'full_ban')

  const thMax = maxAmountRule?.threshold_amount || Math.floor(th * 0.5)
  const thBan = fullBanRule?.threshold_amount || th

  return (
    <div className="card-surface p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💡</span>
        <h3 className="text-sm font-bold">กฎเหล่านี้ทำงานยังไง?</h3>
      </div>
      <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-3">
        <div className="rounded-lg p-3" style={{ background: 'var(--bg-tertiary)' }}>
          <div className="font-bold text-[var(--text-primary)] mb-1">📌 สถานการณ์ตัวอย่าง — {betTypeName} (rate x{rate})</div>
          สมมติลูกค้าหลายคนแทง {betTypeName} เลข <span className="font-mono text-yellow-400">847</span> ในรอบเดียวกัน ระบบจะเช็คยอดรวมของเลขนั้น
        </div>

        <div className="rounded-lg p-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div className="font-bold mb-1" style={{ color: '#3b82f6' }}>📊 ระดับ 1 — จำกัดยอด (threshold {fmtMoney(thMax)})</div>
          <div className="mt-1">
            เมื่อยอดรวมต่อเลขถึง <span className="font-bold text-yellow-400">{fmtMoney(thMax)}</span>
            → <span className="font-bold" style={{ color: '#3b82f6' }}>จำกัดยอดแทงต่อคน</span> ป้องกันไม่ให้คนเดียวแทงเยอะเกินไป
          </div>
        </div>

        <div className="rounded-lg p-3" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)' }}>
          <div className="font-bold mb-1" style={{ color: '#f5a623' }}>📉 ระดับ 2-7 — ลดเรทแบบขั้นบันได (6 ขั้น)</div>
          <div className="mt-1 mb-2">ยังรับแทงอยู่ แต่ค่อยๆ ลดอัตราจ่าย → ลดความเสี่ยงทีละขั้น</div>
          <div className="grid grid-cols-1 gap-1.5">
            {reduceRateRules.map((rr, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md px-3 py-1.5" style={{ background: 'rgba(245,166,35,0.08)' }}>
                <span style={{ color: '#f5a623' }}>→</span>
                <span>ยอดรวมถึง <span className="font-bold text-yellow-400">{fmtMoney(rr.threshold_amount)}</span></span>
                <span className="flex-1" />
                <span className="font-bold" style={{ color: '#f5a623' }}>ลดเรทเหลือ x{rr.reduced_rate}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">(จากเดิม x{rate})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="font-bold mb-1" style={{ color: '#ef4444' }}>🚫 ระดับ 8 — อั้นเต็ม (threshold {fmtMoney(thBan)})</div>
          <div className="mt-1">
            เมื่อยอดรวมต่อเลขถึง <span className="font-bold text-yellow-400">{fmtMoney(thBan)}</span>
            → <span className="font-bold" style={{ color: '#ef4444' }}>ปิดรับเลขนั้นเลย</span> ใครแทงมาจะถูก reject ทันที
            <div className="text-[10px] text-[var(--text-tertiary)] mt-1">จ่ายสูงสุด {fmtMoney(thBan)} × {rate} = <span className="font-bold text-yellow-400">{fmtMoney(thBan * rate)}</span></div>
          </div>
        </div>

        <div className="rounded-lg p-3" style={{ background: 'var(--bg-tertiary)' }}>
          <div className="font-bold text-[var(--text-primary)] mb-2">🛡️ สรุป — 8 ขั้นบันไดปกป้อง</div>
          <div className="space-y-1">
            <div>ยอดรวม &lt; {fmtMoney(thMax)} → <span className="text-green-400 font-bold">ปกติ</span> (รับแทงเต็ม rate x{rate})</div>
            <div>ยอดรวม &gt; {fmtMoney(thMax)} → <span className="font-bold" style={{ color: '#3b82f6' }}>จำกัดยอดต่อคน</span></div>
            {reduceRateRules.map((rr, i) => (
              <div key={i}>ยอดรวม &gt; {fmtMoney(rr.threshold_amount)} → <span className="font-bold" style={{ color: '#f5a623' }}>ลดเรท x{rate} → x{rr.reduced_rate}</span></div>
            ))}
            <div>ยอดรวม &gt; {fmtMoney(thBan)} → <span className="font-bold" style={{ color: '#ef4444' }}>ปิดรับ!</span></div>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-tertiary)]">
            💡 ระบบตรวจอัตโนมัติทุกครั้งที่มีคนแทง ค่อยๆ ลดเรทลง → ไม่ขาดทุนเกินที่ตั้งไว้
          </div>
        </div>
      </div>
    </div>
  )
}
