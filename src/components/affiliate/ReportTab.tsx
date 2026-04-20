// Component: ReportTab — รายงาน Commission per referrer
// Parent: src/app/affiliate/page.tsx

'use client'

import { type AffiliateReportRow } from '@/lib/api'
import { FileText, Users } from 'lucide-react'
import Loading from '@/components/Loading'

interface Props {
  report: AffiliateReportRow[]
  loading: boolean
}

export default function ReportTab({ report, loading }: Props) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <FileText size={16} color="var(--accent)" />
        <span style={{ fontSize: 15, fontWeight: 700 }}>รายงาน Commission</span>
      </div>

      <div className="card-surface" style={{ padding: 0 }}>
        {loading ? <Loading inline text="กำลังโหลด..." /> : report.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            ยังไม่มีข้อมูล commission — ค่าคอมจะเริ่มคำนวณเมื่อ admin กรอกผลหวย
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ผู้แนะนำ</th>
                <th style={{ textAlign: 'center' }}>ชวนได้</th>
                <th style={{ textAlign: 'right' }}>ค่าคอมรวม</th>
                <th style={{ textAlign: 'right' }}>รอถอน</th>
              </tr>
            </thead>
            <tbody>
              {report.map(row => (
                <tr key={row.member_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ID: {row.member_id}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} /> {row.total_referred} คน
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--status-success)' }}>
                    ฿{row.total_commission.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#FF9F0A', fontWeight: 600 }}>
                    ฿{row.pending_commission.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
