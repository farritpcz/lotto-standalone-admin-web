// Component: AccountsTable — table of bank accounts (ธนาคาร, เลขบัญชี, สถานะ, จัดการ)
// Parent: src/app/settings/bank-accounts/page.tsx

'use client'

import BankIcon from '@/components/BankIcon'
import Loading from '@/components/Loading'
import { BankAccount, getBankName } from './types'

interface Props {
  accounts: BankAccount[]
  loading: boolean
  onEdit: (acc: BankAccount) => void
  onDelete: (acc: BankAccount) => void
  onToggleStatus: (acc: BankAccount) => void
}

export default function AccountsTable({ accounts, loading, onEdit, onDelete, onToggleStatus }: Props) {
  if (loading) return <Loading inline text="กำลังโหลด..." />

  if (accounts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
        ยังไม่มีบัญชีธนาคาร กดปุ่ม &quot;เพิ่มบัญชี&quot; เพื่อเริ่มต้น
      </div>
    )
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>ธนาคาร</th>
          <th>เลขบัญชี</th>
          <th>ชื่อบัญชี</th>
          <th>ประเภท</th>
          <th>โหมด</th>
          <th>สถานะ</th>
          <th style={{ textAlign: 'right' }}>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {accounts.map(acc => (
          <tr key={acc.id}>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BankIcon code={acc.bank_code} size={22} />
                <span style={{ fontWeight: 500 }}>{acc.bank_code}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  {getBankName(acc.bank_code)}
                </span>
              </div>
            </td>
            <td className="mono">{acc.account_number}</td>
            <td>{acc.account_name}</td>
            <td>
              <span className={`badge ${acc.account_type === 'withdraw' ? 'badge-error' : 'badge-success'}`} style={{ fontSize: 10 }}>
                {acc.account_type === 'withdraw' ? 'ถอน' : 'ฝาก'}
              </span>
              {acc.is_default && <span className="badge badge-info" style={{ fontSize: 10, marginLeft: 4 }}>หลัก</span>}
            </td>
            <td>
              {acc.transfer_mode === 'easyslip' ? (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,122,255,0.12)', color: '#007AFF', fontWeight: 600 }}>EasySlip</span>
              ) : acc.transfer_mode === 'auto' ? (
                <div>
                  <span className="badge badge-warning" style={{ fontSize: 10 }}>ออโต้</span>
                  {acc.rkauto_status && (
                    <span className={`badge ${acc.rkauto_status === 'active' ? 'badge-success' : 'badge-neutral'}`}
                      style={{ fontSize: 9, marginLeft: 4 }}>
                      {acc.rkauto_status}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>มือ</span>
              )}
            </td>
            <td>
              <button
                onClick={() => onToggleStatus(acc)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: acc.status === 'active' ? 'var(--accent)' : '#333',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
                title={acc.status === 'active' ? 'คลิกเพื่อปิด' : 'คลิกเพื่อเปิด'}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 9, background: 'white',
                  position: 'absolute', top: 3,
                  left: acc.status === 'active' ? 23 : 3,
                  transition: 'left 0.2s',
                }} />
              </button>
            </td>
            <td style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => onEdit(acc)}
                  style={{ height: 26, padding: '0 6px', fontSize: 11 }}>
                  แก้ไข
                </button>
                <button className="btn btn-danger" onClick={() => onDelete(acc)}
                  style={{ height: 26, padding: '0 6px', fontSize: 11 }}>
                  ลบ
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
