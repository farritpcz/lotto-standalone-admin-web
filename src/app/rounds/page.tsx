/**
 * Admin — จัดการรอบหวย (สร้าง + เปลี่ยนสถานะ)
 */
'use client'
import { useEffect, useState } from 'react'
import { roundMgmtApi } from '@/lib/api'

interface Round { id: number; round_number: string; round_date: string; status: string; open_time: string; close_time: string; lottery_type?: { name: string } }

const statusColors: Record<string, string> = { upcoming: 'bg-gray-700 text-gray-300', open: 'bg-green-900/30 text-green-400', closed: 'bg-yellow-900/30 text-yellow-400', resulted: 'bg-blue-900/30 text-blue-400' }

export default function RoundsPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const load = () => {
    roundMgmtApi.list({ page, per_page: 20, status: statusFilter || undefined })
      .then(res => { setRounds(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
  }
  useEffect(load, [page, statusFilter])

  const changeStatus = async (id: number, newStatus: string) => {
    await roundMgmtApi.updateStatus(id, newStatus)
    load()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">จัดการรอบหวย</h1>
      <div className="flex gap-2 mb-4">
        {['', 'upcoming', 'open', 'closed', 'resulted'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
            {s || 'ทั้งหมด'}
          </button>
        ))}
      </div>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700/50 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">ประเภท</th>
              <th className="px-4 py-3 text-left">รอบ</th>
              <th className="px-4 py-3 text-center">เปิด</th>
              <th className="px-4 py-3 text-center">ปิด</th>
              <th className="px-4 py-3 text-center">สถานะ</th>
              <th className="px-4 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map(r => (
              <tr key={r.id} className="border-t border-gray-700/50">
                <td className="px-4 py-3 text-white">{r.lottery_type?.name}</td>
                <td className="px-4 py-3 text-gray-300">{r.round_number}</td>
                <td className="px-4 py-3 text-center text-gray-400 text-xs">{new Date(r.open_time).toLocaleString('th-TH')}</td>
                <td className="px-4 py-3 text-center text-gray-400 text-xs">{new Date(r.close_time).toLocaleString('th-TH')}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[r.status] || ''}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {r.status === 'upcoming' && <button onClick={() => changeStatus(r.id, 'open')} className="text-green-400 text-xs px-3 py-1 bg-green-900/20 rounded">เปิดรับ</button>}
                  {r.status === 'open' && <button onClick={() => changeStatus(r.id, 'closed')} className="text-yellow-400 text-xs px-3 py-1 bg-yellow-900/20 rounded">ปิดรับ</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 20 && (
          <div className="flex justify-center gap-2 p-4">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50">ก่อนหน้า</button>
            <span className="px-3 py-1 text-gray-400">หน้า {page}</span>
            <button onClick={() => setPage(p => p+1)} disabled={rounds.length < 20} className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50">ถัดไป</button>
          </div>
        )}
      </div>
    </div>
  )
}
