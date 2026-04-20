/**
 * Approve Modal — ยืนยันอนุมัติถอน, ให้เลือก auto/manual transfer
 */
import { CheckCircle, Hand, Zap } from 'lucide-react'
import BankIcon from '@/components/BankIcon'
import { fmtId, fmtMoney, type WithdrawRow } from './_config'

interface Props {
  row: WithdrawRow
  onConfirm: (mode: 'auto' | 'manual') => void
  onClose: () => void
}

export default function ApproveModal({ row, onConfirm, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div className="card-surface" style={{ padding: 24, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
          background: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={28} color="var(--status-success)" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-success)', marginBottom: 4 }}>อนุมัติถอนเงิน</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
          {fmtId(row.id)} — <span style={{ fontWeight: 600, color: 'var(--status-error)' }}>{fmtMoney(row.amount)}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {row.bank_code && <BankIcon code={row.bank_code} size={18} />}
          {row.bank_code} {row.bank_account_number}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <button onClick={() => onConfirm('auto')} className="btn btn-primary" style={{ width: '100%', height: 42, gap: 8, justifyContent: 'center' }}>
            <Zap size={16} /> โอนด้วยระบบอัตโนมัติ
          </button>
          <button onClick={() => onConfirm('manual')} className="btn btn-secondary" style={{ width: '100%', height: 42, gap: 8, justifyContent: 'center' }}>
            <Hand size={16} /> โอนด้วยมือ (แอดมินโอนเอง)
          </button>
        </div>
        <button onClick={onClose} className="btn btn-ghost" style={{ width: '100%' }}>ยกเลิก</button>
      </div>
    </div>
  )
}
