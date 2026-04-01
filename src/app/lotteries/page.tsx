/**
 * Admin — จัดการประเภทหวย (CRUD)
 */
'use client'
import { useEffect, useState } from 'react'
import { lotteryMgmtApi } from '@/lib/api'

interface LotteryType { id: number; name: string; code: string; category: string; status: string; icon: string }

export default function LotteriesPage() {
  const [types, setTypes] = useState<LotteryType[]>([])
  useEffect(() => { lotteryMgmtApi.list().then(res => setTypes(res.data.data || [])) }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">จัดการประเภทหวย</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map(lt => (
          <div key={lt.id} className="bg-gray-800 rounded-xl p-5">
            <div className="text-3xl mb-2">{lt.icon}</div>
            <h3 className="text-white font-semibold">{lt.name}</h3>
            <div className="text-gray-400 text-sm mt-1">Code: {lt.code} • {lt.category}</div>
            <div className="flex items-center justify-between mt-3">
              <span className={`text-xs px-2 py-1 rounded ${lt.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{lt.status}</span>
              <button className="text-blue-400 text-sm hover:text-blue-300">แก้ไข</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
