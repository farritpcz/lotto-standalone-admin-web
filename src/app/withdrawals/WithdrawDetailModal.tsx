/**
 * Withdraw Detail Modal — แสดงรายละเอียด + ปุ่ม approve/reject (เปิด sub-modal)
 */
import { CheckCircle, Copy, Eye, XCircle } from 'lucide-react'
import BankIcon from '@/components/BankIcon'
import DetailField from '@/components/admin/DetailField'
import { statusMap, fmtId, fmtMoney, fmtDate, relTime, type WithdrawRow } from './_config'

interface Props {
  row: WithdrawRow
  onClose: () => void
  onApprove: (row: WithdrawRow) => void
  onReject: (row: WithdrawRow) => void
  onCopyAccount: (text: string) => void
}

export default function WithdrawDetailModal({ row, onClose, onApprove, onReject, onCopyAccount }: Props) {
  const status = statusMap[row.status] || statusMap.pending
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div className="card-surface" style={{ width: '100%', maxWidth: 500, padding: 24 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--status-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Eye size={20} color="var(--status-warning)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-warning)' }}>{fmtId(row.id)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>รายละเอียดรายการถอนเงิน</div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
        </div>

        {/* ข้อมูลทั่วไป */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <DetailField label="สมาชิก" value={row.username || `ID:${row.member_id}`} />
          <DetailField label="จำนวนเงิน" value={fmtMoney(row.amount)} color="var(--status-error)" bold />
          <DetailField label="สถานะ">
            <span className={`badge ${status.cls}`}>{status.label}</span>
            {row.transfer_mode && (
              <span className="badge badge-info" style={{ marginLeft: 6, fontSize: 10 }}>
                {row.transfer_mode === 'auto' ? 'AUTO' : 'MANUAL'}
              </span>
            )}
          </DetailField>
          <DetailField label="วันที่แจ้ง" value={`${fmtDate(row.created_at)} (${relTime(row.created_at)})`} />
          {row.approved_at && <DetailField label="วันที่ดำเนินการ" value={fmtDate(row.approved_at)} />}
          {row.reject_reason && <DetailField label="เหตุผล" value={row.reject_reason} color="var(--status-error)" />}
        </div>

        {/* บัญชีปลายทาง */}
        <div style={{ marginTop: 16, background: 'var(--bg-elevated)', borderRadius: 8, padding: 14 }}>
          <div className="label" style={{ marginBottom: 8 }}>บัญชีปลายทาง</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {row.bank_code && <BankIcon code={row.bank_code} size={24} />}
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{row.bank_code || '—'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, color: 'var(--accent)' }}>
              {row.bank_account_number || '—'}
            </span>
            {row.bank_account_number && (
              <button onClick={() => onCopyAccount(row.bank_account_number)} className="btn btn-ghost" style={{ padding: '2px 6px', height: 24 }} title="คัดลอก">
                <Copy size={13} />
              </button>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{row.bank_account_name || '—'}</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {row.status === 'pending' && (
            <>
              <button onClick={() => { onClose(); onApprove(row) }} className="btn btn-success" style={{ flex: 1, height: 36, gap: 4 }}>
                <CheckCircle size={15} /> อนุมัติ
              </button>
              <button onClick={() => { onClose(); onReject(row) }} className="btn btn-danger" style={{ flex: 1, height: 36, gap: 4 }}>
                <XCircle size={15} /> ปฏิเสธ
              </button>
            </>
          )}
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, height: 36 }}>ปิด</button>
        </div>
      </div>
    </div>
  )
}
