// บล็อคสรุป — เว็บตัวเอง + สรุปรวม
// Parent: src/app/downline/report/page.tsx

'use client'

import { User, Wallet } from 'lucide-react'
import type { ReportData } from './types'
import { fmtMoney, fmtAbs } from './types'

export default function SummaryBlocks({ data }: { data: ReportData }) {
  const totalCollected = data.children.reduce((s, c) => s + c.settlement, 0)
  const passUp = totalCollected - data.summary.downline_profit

  return (
    <>
      {/* ── เว็บตัวเอง (ข้อมูลประกอบ) ───────────────────────────────── */}
      <div className="card-surface" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <User size={16} color="#3b82f6" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>เว็บตัวเอง</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            ลูกค้าสมัครตรง {data.direct.member_count} คน • {data.direct.bets} bets
          </span>
        </div>
        {data.direct.bets > 0 ? (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ยอดสุทธิลูกค้า</div>
              <div className="mono" style={{
                fontSize: 18, fontWeight: 700,
                color: data.direct.net_result >= 0 ? 'var(--status-success)' : 'var(--status-error)',
              }}>
                {fmtMoney(data.direct.net_result)} ฿
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>เราถือ ({data.my_node.share_percent}%)</div>
              <div className="mono" style={{
                fontSize: 18, fontWeight: 700,
                color: data.direct.my_profit >= 0 ? 'var(--status-success)' : 'var(--status-error)',
              }}>
                {fmtMoney(data.direct.my_profit)} ฿
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>ไม่มียอดแทงในช่วงนี้</div>
        )}
      </div>

      {/* ── สรุปรวม ─────────────────────────────────────────────────── */}
      <div className="card-surface" style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>สรุป</div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '8px 0',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>กำไร/ขาดทุนเว็บตัวเอง</span>
          <span className="mono" style={{
            fontSize: 14, fontWeight: 600,
            color: data.summary.direct_profit >= 0 ? 'var(--status-success)' : 'var(--status-error)',
          }}>
            {fmtMoney(data.summary.direct_profit)} ฿
          </span>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>เก็บ/จ่ายใต้สาย</div>
            {data.children.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                เก็บมา <span className="mono">{fmtAbs(totalCollected)}</span>
                {' − '}ส่งต่อขึ้นหัว <span className="mono">{fmtAbs(passUp)}</span>
                {' = '}เหลือ <span className="mono">{fmtAbs(data.summary.downline_profit)}</span>
              </div>
            )}
          </div>
          <span className="mono" style={{
            fontSize: 14, fontWeight: 600,
            color: data.summary.downline_profit >= 0 ? 'var(--status-success)' : 'var(--status-error)',
          }}>
            {fmtMoney(data.summary.downline_profit)} ฿
          </span>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '10px 0',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>เราเก็บได้สุทธิ</span>
          <span className="mono" style={{
            fontSize: 20, fontWeight: 700,
            color: data.summary.total_profit >= 0 ? 'var(--status-success)' : 'var(--status-error)',
          }}>
            {fmtMoney(data.summary.total_profit)} ฿
          </span>
        </div>

        {data.is_root && (
          <div style={{
            marginTop: 12, padding: 12, borderRadius: 8,
            background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Wallet size={16} color="var(--status-success)" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>เจ้าของระบบ — ไม่ต้องเคลียกับใคร</span>
          </div>
        )}
      </div>
    </>
  )
}
