/**
 * Admin — รายงาน (สรุปยอด + กำไร/ขาดทุน)
 */
'use client'
import { useEffect, useState } from 'react'
import { reportApi } from '@/lib/api'

export default function ReportsPage() {
  const [summary, setSummary] = useState({ total_bets: 0, total_amount: 0, total_win: 0, profit: 0 })
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7*86400000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    reportApi.summary({ from: dateFrom, to: dateTo }).then(res => setSummary(res.data.data || {}))
  }, [dateFrom, dateTo])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">รายงาน</h1>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="text-gray-400 text-sm">จาก</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="block bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-gray-400 text-sm">ถึง</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="block bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="จำนวน Bets" value={summary.total_bets.toLocaleString()} color="blue" />
        <StatCard label="ยอดแทงรวม" value={`฿${summary.total_amount.toLocaleString()}`} color="purple" />
        <StatCard label="จ่ายรางวัล" value={`฿${summary.total_win.toLocaleString()}`} color="red" />
        <StatCard label="กำไร" value={`฿${summary.profit.toLocaleString()}`} color={summary.profit >= 0 ? 'green' : 'red'} />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'border-blue-500/30 text-blue-400', green: 'border-green-500/30 text-green-400',
    red: 'border-red-500/30 text-red-400', purple: 'border-purple-500/30 text-purple-400',
  }
  return (
    <div className={`bg-gray-800 border rounded-xl p-4 ${colors[color]}`}>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className={`text-xl font-bold mt-1 ${colors[color]?.split(' ').pop()}`}>{value}</p>
    </div>
  )
}
