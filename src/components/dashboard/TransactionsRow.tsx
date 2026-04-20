/**
 * TransactionsRow — Row 3: บัญชีธนาคาร + Top 10 ฝาก/ถอน + ธุรกรรมล่าสุด
 *
 * Rule: UI-only; state ของ txTab อยู่ที่นี่ (local)
 * Related: components/dashboard/types.ts, app/dashboard/page.tsx
 */
'use client'
import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import BankIcon from '@/components/BankIcon'
import { fmtShort, STATUS_BADGE, type DashboardData } from './types'

interface Props {
  data: DashboardData
}

export default function TransactionsRow({ data }: Props) {
  const [txTab, setTxTab] = useState<'deposit' | 'withdraw'>('deposit')
  const txList = txTab === 'deposit' ? data.recent_deposits : data.recent_withdrawals

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
      {/* บัญชีธนาคาร */}
      <div className="card-surface" style={{ padding: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <p className="label">บัญชีธนาคาร</p>
          <span className="badge badge-info">{data.bank_accounts?.length || 0}</span>
        </div>
        {!data.bank_accounts?.length ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)', fontSize: 13 }}>
            <CreditCard size={32} strokeWidth={1} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <div>ไม่พบข้อมูล</div>
          </div>
        ) : (
          data.bank_accounts.map(ba => (
            <div
              key={ba.id}
              style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <BankIcon code={ba.bank_code} size={22} />
                {ba.bank_name || ba.bank_code}
              </div>
              <div className="mono" style={{ color: 'var(--text-secondary)', marginLeft: 30 }}>
                {ba.account_number} · {ba.account_name}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Top 10 ฝาก/ถอน */}
      <div className="card-surface" style={{ padding: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <p className="label">สมาชิก 10 อันดับแรก — ยอดฝากและถอนสูงสุด</p>
          <span className="badge badge-info">{data.top_depositors?.length || 0}</span>
        </div>
        {!data.top_depositors?.length ? (
          <div
            style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)', fontSize: 13 }}
          >
            ไม่พบข้อมูล
          </div>
        ) : (
          <div style={{ fontSize: 12 }}>
            {data.top_depositors.map((d, i) => (
              <div
                key={d.member_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '7px 0',
                  borderBottom:
                    i < data.top_depositors.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span>{d.username || `#${d.member_id}`}</span>
                <div className="mono" style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: '#3b82f6' }}>+{fmtShort(d.total_deposit)}</span>
                  <span style={{ color: '#ef4444' }}>-{fmtShort(d.total_withdraw)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ธุรกรรมล่าสุด */}
      <div className="card-surface" style={{ padding: 20 }}>
        <p className="label" style={{ marginBottom: 10 }}>
          ธุรกรรมล่าสุด
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['deposit', 'withdraw'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTxTab(t)}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background:
                  txTab === t
                    ? t === 'deposit'
                      ? '#3b82f6'
                      : '#ef4444'
                    : 'var(--bg-elevated)',
                color: txTab === t ? 'white' : 'var(--text-secondary)',
              }}
            >
              {t === 'deposit'
                ? `ฝากเงิน ${data.recent_deposits?.length || 0}`
                : `ถอนเงิน ${data.recent_withdrawals?.length || 0}`}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12 }}>
          {txList?.map(tx => {
            const badge = STATUS_BADGE[tx.status] || STATUS_BADGE.pending
            return (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{tx.username || `#${tx.id}`}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {tx.created_at?.slice(0, 16)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {fmtShort(tx.amount)}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      background: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>
            )
          })}
          {!txList?.length && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>
              ไม่มีรายการ
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
