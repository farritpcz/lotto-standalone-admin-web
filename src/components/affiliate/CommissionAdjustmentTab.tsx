// Component: CommissionAdjustmentTab — ปรับค่าคอม (form + history table + pagination)
// Parent: src/app/affiliate/page.tsx

'use client'

import { type CommissionAdjustment } from '@/lib/api'
import { Settings, Plus, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import Loading from '@/components/Loading'

export type AdjType = 'add' | 'deduct' | 'cancel'

interface Props {
  adjustments: CommissionAdjustment[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  // Form state (held in parent page)
  memberId: string
  type: AdjType
  amount: string
  reason: string
  commissionId: string
  saving: boolean
  setMemberId: (v: string) => void
  setType: (v: AdjType) => void
  setAmount: (v: string) => void
  setReason: (v: string) => void
  setCommissionId: (v: string) => void
  onSubmit: () => void
}

/** Adjustment type badge สี */
function adjTypeBadge(type: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    add:    { bg: 'rgba(0,229,160,0.15)', color: 'var(--accent)', label: 'เพิ่ม' },
    deduct: { bg: 'rgba(255,69,58,0.15)', color: '#FF453A', label: 'หัก' },
    cancel: { bg: 'rgba(255,159,10,0.15)', color: '#FF9F0A', label: 'ยกเลิก' },
  }
  const m = map[type] || map.add
  return (
    <span style={{ background: m.bg, color: m.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
      {m.label}
    </span>
  )
}

export default function CommissionAdjustmentTab({
  adjustments, loading, page, totalPages, onPageChange,
  memberId, type, amount, reason, commissionId, saving,
  setMemberId, setType, setAmount, setReason, setCommissionId, onSubmit,
}: Props) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Settings size={16} color="var(--accent)" />
        <span style={{ fontSize: 15, fontWeight: 700 }}>ปรับค่าคอมมิชชั่น</span>
      </div>

      {/* Form */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '18px 20px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
          สร้างรายการปรับค่าคอม
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Member ID</div>
            <input className="input" type="number" placeholder="เช่น 11"
              value={memberId} onChange={e => setMemberId(e.target.value)} />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>ประเภท</div>
            <select className="input" value={type} onChange={e => setType(e.target.value as AdjType)}>
              <option value="add">เพิ่มค่าคอม (add)</option>
              <option value="deduct">หักค่าคอม (deduct)</option>
              <option value="cancel">ยกเลิกรายการ (cancel)</option>
            </select>
          </div>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>จำนวนเงิน (฿)</div>
            <input className="input" type="number" min="0" step="0.01" placeholder="เช่น 100"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          {type === 'cancel' && (
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Commission ID (สำหรับยกเลิก)</div>
              <input className="input" type="number" placeholder="ID รายการ commission ที่ต้องการยกเลิก"
                value={commissionId} onChange={e => setCommissionId(e.target.value)} />
            </div>
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="label" style={{ marginBottom: 6 }}>เหตุผล</div>
          <textarea className="input" rows={2} placeholder="เช่น ปรับค่าคอมโปรโมชั่นพิเศษ"
            value={reason} onChange={e => setReason(e.target.value)}
            style={{ resize: 'vertical', minHeight: 48 }} />
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onSubmit} disabled={saving}
            style={{ height: 36, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? 'กำลังบันทึก...' : (<><Plus size={14} /> ปรับค่าคอม</>)}
          </button>
        </div>
      </div>

      {/* History */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <FileText size={14} color="var(--text-secondary)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>ประวัติการปรับค่าคอม</span>
      </div>

      <div className="card-surface" style={{ padding: 0 }}>
        {loading ? <Loading inline text="กำลังโหลด..." /> : adjustments.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            ยังไม่มีรายการปรับค่าคอม
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>Admin</th>
                <th>สมาชิก</th>
                <th style={{ textAlign: 'center' }}>ประเภท</th>
                <th style={{ textAlign: 'right' }}>จำนวน</th>
                <th>เหตุผล</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map(adj => (
                <tr key={adj.id}>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {adj.created_at ? new Date(adj.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                  </td>
                  <td style={{ fontSize: 12 }}>{adj.admin?.username || `#${adj.admin_id}`}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{adj.member?.username || '-'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>ID: {adj.member_id}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{adjTypeBadge(adj.type)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                    <span style={{ color: adj.type === 'deduct' ? '#FF453A' : adj.type === 'cancel' ? '#FF9F0A' : 'var(--accent)' }}>
                      {adj.type === 'deduct' ? '-' : adj.type === 'add' ? '+' : ''}฿{adj.amount?.toFixed?.(2) || '0.00'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {adj.reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 10px', cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center',
            }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            หน้า {page} / {totalPages}
          </span>
          <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 10px', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center',
            }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </>
  )
}
