// Component: AdjustBalanceModal — modal for adjusting credit (add/deduct)
// Parent: src/app/members/[id]/page.tsx

'use client'

import { fmtMoney } from './types'

interface Props {
  mode: 'add' | 'deduct'
  currentBalance: number
  amount: string
  note: string
  loading: boolean
  setAmount: (v: string) => void
  setNote: (v: string) => void
  onClose: () => void
  onConfirm: () => void
}

export default function AdjustBalanceModal({
  mode,
  currentBalance,
  amount,
  note,
  loading,
  setAmount,
  setNote,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="card-surface"
        style={{
          width: '100%', maxWidth: 400, padding: 24, margin: 16,
          animation: 'fadeSlideUp 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            {mode === 'add' ? 'เติมเครดิต' : 'หักเครดิต'}
          </h2>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ width: 32, height: 32, padding: 0 }}
          >
            &times;
          </button>
        </div>

        {/* ยอดเงินปัจจุบัน */}
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: 8, padding: 12,
          textAlign: 'center', marginBottom: 20,
        }}>
          <span className="label" style={{ display: 'block', marginBottom: 4 }}>ยอดเงินปัจจุบัน</span>
          <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent-text)' }}>
            {fmtMoney(currentBalance)}
          </span>
        </div>

        {/* จำนวนเงิน */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            จำนวนเงิน (บาท)
          </label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
          />
        </div>

        {/* หมายเหตุ */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            หมายเหตุ (ไม่บังคับ)
          </label>
          <input
            className="input"
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="เช่น: โปรโมชั่นสมัครใหม่"
          />
        </div>

        {/* ปุ่ม */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1 }}
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            className={`btn ${mode === 'add' ? 'btn-success' : 'btn-danger'}`}
            onClick={onConfirm}
            style={{ flex: 1, fontWeight: 600 }}
            disabled={loading || !amount}
          >
            {loading
              ? 'กำลังดำเนินการ...'
              : mode === 'add'
                ? 'เติมเครดิต'
                : 'หักเครดิต'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
