/**
 * Admin — ดูรายการเดิมพันทั้งหมด
 */
'use client'
import { useEffect, useState } from 'react'
import { betMgmtApi } from '@/lib/api'

interface Bet { id: number; number: string; amount: number; rate: number; status: string; win_amount: number; created_at: string; member?: { username: string }; bet_type?: { name: string }; lottery_round?: { round_number: string } }

const statusColors: Record<string, string> = { pending: 'text-yellow-400', won: 'text-green-400', lost: 'text-red-400' }

export default function BetsPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  useEffect(() => {
    betMgmtApi.list({ page, per_page: 30, status: status || undefined })
      .then(res => { setBets(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
  }, [page, status])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">รายการเดิมพัน ({total})</h1>
      <div className="flex gap-2 mb-4">
        {['', 'pending', 'won', 'lost'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
            {s || 'ทั้งหมด'}
          </button>
        ))}
      </div>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700/50 text-gray-400">
            <tr>
              <th className="px-3 py-3 text-left">สมาชิก</th>
              <th className="px-3 py-3 text-left">เลข</th>
              <th className="px-3 py-3 text-left">ประเภท</th>
              <th className="px-3 py-3 text-right">จำนวน</th>
              <th className="px-3 py-3 text-center">สถานะ</th>
              <th className="px-3 py-3 text-right">รางวัล</th>
              <th className="px-3 py-3 text-right">เวลา</th>
            </tr>
          </thead>
          <tbody>
            {bets.map(b => (
              <tr key={b.id} className="border-t border-gray-700/50">
                <td className="px-3 py-2 text-gray-300">{b.member?.username}</td>
                <td className="px-3 py-2 text-white font-mono font-bold">{b.number}</td>
                <td className="px-3 py-2 text-gray-400 text-xs">{b.bet_type?.name}</td>
                <td className="px-3 py-2 text-right text-white">฿{b.amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-center"><span className={`text-xs ${statusColors[b.status]}`}>{b.status}</span></td>
                <td className="px-3 py-2 text-right text-green-400">{b.win_amount > 0 ? `฿${b.win_amount.toLocaleString()}` : '-'}</td>
                <td className="px-3 py-2 text-right text-gray-500 text-xs">{new Date(b.created_at).toLocaleString('th-TH')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 30 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50">ก่อนหน้า</button>
          <span className="px-3 py-1 text-gray-400">หน้า {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={bets.length < 30} className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50">ถัดไป</button>
        </div>
      )}
    </div>
  )
}
