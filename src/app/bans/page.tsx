/**
 * Admin — จัดการเลขอั้น
 */
'use client'
import { useEffect, useState } from 'react'
import { banMgmtApi } from '@/lib/api'

interface Ban { id: number; number: string; ban_type: string; reduced_rate: number; lottery_type_id: number; bet_type_id: number }

export default function BansPage() {
  const [bans, setBans] = useState<Ban[]>([])
  const [number, setNumber] = useState('')
  const [message, setMessage] = useState('')

  const load = () => { banMgmtApi.list().then(res => setBans(res.data.data || [])) }
  useEffect(load, [])

  const addBan = async () => {
    if (!number) return
    await banMgmtApi.create({ number, lottery_type_id: 1, bet_type_id: 1, ban_type: 'full_ban' })
    setMessage(`✅ อั้นเลข ${number} แล้ว`)
    setNumber(''); load()
  }
  const removeBan = async (id: number) => { await banMgmtApi.delete(id); load() }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">จัดการเลขอั้น</h1>
      {message && <div className="bg-green-900/30 text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">{message}</div>}

      <div className="bg-gray-800 rounded-xl p-4 mb-6 flex gap-3">
        <input type="text" value={number} onChange={e => setNumber(e.target.value)} placeholder="เลขที่ต้องการอั้น"
          className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2" />
        <button onClick={addBan} className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold">อั้นเลข</button>
      </div>

      <div className="space-y-2">
        {bans.map(ban => (
          <div key={ban.id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="text-white font-mono font-bold text-lg">{ban.number}</span>
              <span className={`ml-3 text-xs px-2 py-0.5 rounded ${ban.ban_type === 'full_ban' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                {ban.ban_type === 'full_ban' ? 'อั้นเต็ม' : `ลด rate → ${ban.reduced_rate}`}
              </span>
            </div>
            <button onClick={() => removeBan(ban.id)} className="text-red-400 text-sm hover:text-red-300">ลบ</button>
          </div>
        ))}
        {bans.length === 0 && <div className="text-gray-500 text-center py-6">ยังไม่มีเลขอั้น</div>}
      </div>
    </div>
  )
}
