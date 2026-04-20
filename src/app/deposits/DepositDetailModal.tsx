/**
 * Deposit Detail Modal — แสดงรายละเอียด + ปุ่ม approve/reject/cancel
 * Parent ส่ง callbacks: onApprove/onReject/onCancel (cancel = เปิด CancelModal)
 */
import { CheckCircle, Eye, XCircle } from 'lucide-react'
import { statusMap, fmtId, fmtMoney, fmtDate, relTime, type DepositRow } from './_config'
import DetailField from '@/components/admin/DetailField'

interface Props {
  row: DepositRow
  onClose: () => void
  onApprove: (row: DepositRow) => void
  onReject: (row: DepositRow) => void
  onCancel: (row: DepositRow) => void
}

export default function DepositDetailModal({ row, onClose, onApprove, onReject, onCancel }: Props) {
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
      <div className="card-surface" style={{ width: '100%', maxWidth: 480, padding: 24 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Eye size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{fmtId(row.id)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>รายละเอียดรายการฝากเงิน</div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
        </div>

        {/* สลิปโอนเงิน — eslint-disable: ให้คง <img> เดิม (ต่างจาก next/image) */}
        {row.slip_url && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <a href={row.slip_url} target="_blank" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.slip_url}
                alt="slip"
                style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </a>
          </div>
        )}

        {/* รายละเอียด */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <DetailField label="สมาชิก" value={row.username || `ID:${row.member_id}`} />
          <DetailField label="จำนวนเงิน" value={fmtMoney(row.amount)} color="var(--accent)" bold />
          <DetailField label="สถานะ">
            <span className={`badge ${status.cls}`}>{status.label}</span>
            {row.auto_matched && <span className="badge badge-info" style={{ marginLeft: 6, fontSize: 10 }}>AUTO MATCHED</span>}
          </DetailField>
          <DetailField label="วันที่แจ้ง" value={`${fmtDate(row.created_at)} (${relTime(row.created_at)})`} />
          {row.approved_at && <DetailField label="วันที่ดำเนินการ" value={fmtDate(row.approved_at)} />}
          {row.reject_reason && <DetailField label="เหตุผล" value={row.reject_reason} color="var(--status-error)" />}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => { onClose(); onApprove(row) }}
                className="btn btn-success"
                style={{ flex: 1, height: 36, gap: 4 }}
              >
                <CheckCircle size={15} /> อนุมัติ
              </button>
              <button
                onClick={() => { onClose(); onReject(row) }}
                className="btn btn-danger"
                style={{ flex: 1, height: 36, gap: 4 }}
              >
                <XCircle size={15} /> ปฏิเสธ
              </button>
            </>
          )}
          {row.status === 'approved' && (
            <button
              onClick={() => { onClose(); onCancel(row) }}
              className="btn btn-danger"
              style={{ flex: 1, height: 36, gap: 4 }}
            >
              <XCircle size={15} /> ยกเลิกรายการ
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, height: 36 }}>ปิด</button>
        </div>
      </div>
    </div>
  )
}
