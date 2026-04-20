/**
 * Reject Modal — ยืนยันปฏิเสธถอน, ให้เลือก refund (คืนเครดิต) / ไม่คืน + เหตุผล
 */
import { ArrowUpFromLine, XCircle } from 'lucide-react'
import { fmtId, fmtMoney, type WithdrawRow } from './_config'

interface Props {
  row: WithdrawRow
  reason: string
  onReasonChange: (v: string) => void
  onConfirm: (refund: boolean) => void
  onClose: () => void
}

export default function RejectModal({ row, reason, onReasonChange, onConfirm, onClose }: Props) {
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
          background: 'var(--status-error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <XCircle size={28} color="var(--status-error)" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-error)', marginBottom: 4 }}>ปฏิเสธรายการถอน</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          {fmtId(row.id)} — {fmtMoney(row.amount)}
        </div>

        {/* ⭐ เหตุผลการปฏิเสธ */}
        <div style={{ textAlign: 'left', marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 4 }}>เหตุผล (ไม่บังคับ)</div>
          <textarea
            className="input" rows={2}
            placeholder="เช่น ข้อมูลบัญชีไม่ถูกต้อง..."
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
            style={{ height: 'auto', padding: '8px 12px', resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <button onClick={() => onConfirm(true)} className="btn btn-secondary" style={{ width: '100%', height: 42, gap: 8, justifyContent: 'center' }}>
            <ArrowUpFromLine size={16} style={{ transform: 'rotate(180deg)' }} /> ปฏิเสธ + คืนเครดิตให้สมาชิก
          </button>
          <button onClick={() => onConfirm(false)} className="btn btn-danger" style={{ width: '100%', height: 42, gap: 8, justifyContent: 'center' }}>
            <XCircle size={16} /> ปฏิเสธ + ไม่คืนเครดิต (ทุจริต)
          </button>
        </div>
        <button onClick={onClose} className="btn btn-ghost" style={{ width: '100%' }}>ยกเลิก</button>
      </div>
    </div>
  )
}
