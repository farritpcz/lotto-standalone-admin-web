// Component: EasySlipHistoryModal — ประวัติตรวจสลิป EasySlip
// Parent: src/app/settings/bank-accounts/page.tsx

'use client'

import { AlertTriangle } from 'lucide-react'

export interface Verification {
  id: number
  member_username: string
  verify_type: string
  slip_amount: number | null
  sender_bank: string | null
  status: string
  is_duplicate: boolean
  created_at: string
}

interface Props {
  verifications: Verification[]
  onClose: () => void
}

export default function EasySlipHistoryModal({ verifications, onClose }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', width: '90%', maxWidth: 860, maxHeight: '75vh', overflow: 'auto', padding: 24 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>ประวัติตรวจสลิป EasySlip</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: 11 }}>ปิด</button>
        </div>
        {verifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)', fontSize: 12 }}>ยังไม่มีรายการ</div>
        ) : (
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr><th>เวลา</th><th>สมาชิก</th><th>ประเภท</th><th>ยอด</th><th>ธนาคาร</th><th>สถานะ</th><th>ซ้ำ</th></tr>
            </thead>
            <tbody>
              {verifications.map(v => (
                <tr key={v.id}>
                  <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{v.created_at?.replace('T', ' ').slice(0, 19)}</td>
                  <td style={{ fontSize: 12 }}>{v.member_username || '-'}</td>
                  <td>
                    <span style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      background: v.verify_type === 'truewallet' ? 'rgba(255,159,10,0.12)' : 'rgba(0,122,255,0.12)',
                      color: v.verify_type === 'truewallet' ? '#FF9F0A' : '#007AFF',
                    }}>{v.verify_type === 'truewallet' ? 'TrueMoney' : 'ธนาคาร'}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>{v.slip_amount != null ? `${v.slip_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}</td>
                  <td style={{ fontSize: 12 }}>{v.sender_bank || '-'}</td>
                  <td>
                    <span style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                      background: v.status === 'verified' ? 'rgba(52,199,89,0.15)' : v.status === 'duplicate' ? 'rgba(255,69,58,0.15)' : v.status === 'mismatch' ? 'rgba(255,159,10,0.15)' : 'rgba(142,142,147,0.15)',
                      color: v.status === 'verified' ? '#34C759' : v.status === 'duplicate' ? '#FF453A' : v.status === 'mismatch' ? '#FF9F0A' : '#8E8E93',
                    }}>{v.status === 'verified' ? 'ผ่าน' : v.status === 'duplicate' ? 'ซ้ำ' : v.status === 'mismatch' ? 'ไม่ตรง' : v.status}</span>
                  </td>
                  <td>{v.is_duplicate ? <AlertTriangle size={13} color="#FF453A" /> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
