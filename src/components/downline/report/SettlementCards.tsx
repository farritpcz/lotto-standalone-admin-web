// การ์ดสรุปเคลีย — 2 การ์ด: ใต้สาย + หัวสาย
// Parent: src/app/downline/report/page.tsx

'use client'

import { useState } from 'react'
import { ArrowUp, ChevronDown } from 'lucide-react'
import type { ReportData } from './types'
import { fmtMoney, fmtAbs } from './types'

// ที่มาของยอดจ่ายขึ้นหัว — คลิกเปิด/ปิด
function ParentBreakdown({ data }: { data: ReportData }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 11, color: 'var(--text-tertiary)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <ChevronDown size={12} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
        ดูที่มาของยอด
      </button>
      {open && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-tertiary)' }}>
          <div>ยอดสุทธิทั้ง tree: <span className="mono" style={{ color: 'var(--text-secondary)' }}>{fmtMoney(data.summary.total_tree_net)}</span></div>
          <div style={{ marginTop: 2 }}>
            = เว็บตัวเอง (<span className="mono">{fmtMoney(data.direct.net_result)}</span>)
            {data.children.map(c => (
              <span key={c.node_id}> + {c.name} (<span className="mono">{fmtMoney(c.tree_net)}</span>)</span>
            ))}
          </div>
          <div style={{ marginTop: 2 }}>
            คิด {100 - data.my_node.share_percent}% ของ <span className="mono">{fmtMoney(data.summary.total_tree_net)}</span> = <span className="mono" style={{ color: 'var(--text-secondary)' }}>{fmtAbs(data.summary.parent_settlement)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettlementCards({ data }: { data: ReportData }) {
  const total = data.children.reduce((s, c) => s + c.settlement, 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: !data.is_root ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
      {/* ⭐ การ์ด 1: เคลียใต้สาย */}
      <div className="card-surface" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ArrowUp size={18} color="#8b5cf6" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>เคลียใต้สาย</span>
        </div>
        {data.children.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>ไม่มีใต้สาย</div>
        ) : (
          <>
            <div className="mono" style={{
              fontSize: 28, fontWeight: 700,
              color: total > 0 ? 'var(--status-success)' : total < 0 ? 'var(--status-error)' : 'var(--text-tertiary)',
            }}>
              {fmtAbs(total)} ฿
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {total > 0 ? 'เคลียใต้สายได้' : total < 0 ? 'จ่ายใต้สาย (ลูกค้าชนะ)' : 'ไม่มียอดเคลีย'}
              {' • '}{data.children.length} สายล่าง
            </div>
          </>
        )}
      </div>

      {/* ⭐ การ์ด 2: เคลียหัวสาย */}
      {!data.is_root && (
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ArrowUp size={18} color="#f59e0b" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>เคลียหัวสาย</span>
          </div>
          <div className="mono" style={{
            fontSize: 28, fontWeight: 700,
            color: data.summary.parent_settlement > 0 ? '#f59e0b' : data.summary.parent_settlement < 0 ? '#3b82f6' : 'var(--text-tertiary)',
          }}>
            {fmtAbs(data.summary.parent_settlement)} ฿
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
            {data.summary.parent_settlement > 0
              ? `ส่งให้ ${data.parent.name}`
              : data.summary.parent_settlement < 0
                ? `${data.parent.name} จ่ายลงมา`
                : 'ไม่มียอดเคลีย'}
          </div>
          <ParentBreakdown data={data} />
        </div>
      )}
    </div>
  )
}
