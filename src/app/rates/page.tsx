/**
 * Admin — จัดการอัตราจ่าย
 */
'use client'
import { useEffect, useState } from 'react'
import { rateMgmtApi } from '@/lib/api'

interface Rate { id: number; rate: number; max_bet_per_number: number; bet_type?: { name: string; code: string }; lottery_type?: { name: string } }

export default function RatesPage() {
  const [rates, setRates] = useState<Rate[]>([])
  useEffect(() => { rateMgmtApi.list().then(res => setRates(res.data.data || [])) }, [])

  const updateRate = async (id: number, newRate: number) => {
    await rateMgmtApi.update(id, { rate: newRate })
    setRates(prev => prev.map(r => r.id === id ? { ...r, rate: newRate } : r))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">จัดการอัตราจ่าย</h1>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700/50 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">ประเภทหวย</th>
              <th className="px-4 py-3 text-left">ประเภทแทง</th>
              <th className="px-4 py-3 text-right">Rate จ่าย</th>
              <th className="px-4 py-3 text-right">Max/เลข</th>
            </tr>
          </thead>
          <tbody>
            {rates.map(r => (
              <tr key={r.id} className="border-t border-gray-700/50">
                <td className="px-4 py-3 text-white">{r.lottery_type?.name}</td>
                <td className="px-4 py-3 text-gray-300">{r.bet_type?.name} ({r.bet_type?.code})</td>
                <td className="px-4 py-3 text-right">
                  <input type="number" value={r.rate} onChange={e => updateRate(r.id, Number(e.target.value))}
                    className="w-24 bg-gray-700 text-yellow-400 text-right rounded px-2 py-1 border border-gray-600 font-mono" />
                </td>
                <td className="px-4 py-3 text-right text-gray-400">{r.max_bet_per_number || 'ไม่จำกัด'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
