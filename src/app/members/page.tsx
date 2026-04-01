/**
 * Admin — จัดการสมาชิก
 * CRUD + suspend/activate + search
 * เรียก API: memberMgmtApi → standalone-admin-api (#5)
 * ⭐ provider-backoffice-admin-web (#10) มีหน้าคล้ายกัน (เพิ่ม operator filter)
 */
'use client'
import { useEffect, useState } from 'react'
import { memberMgmtApi } from '@/lib/api'

interface Member {
  id: number; username: string; phone: string; email: string;
  balance: number; status: string; created_at: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    memberMgmtApi.list({ page, per_page: 20, q: search || undefined })
      .then(res => { setMembers(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [page, search])

  const toggleStatus = async (id: number, current: string) => {
    const newStatus = current === 'active' ? 'suspended' : 'active'
    await memberMgmtApi.updateStatus(id, newStatus)
    load()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">จัดการสมาชิก</h1>
        <span className="text-gray-400 text-sm">{total} คน</span>
      </div>

      <input type="text" placeholder="ค้นหา username / เบอร์โทร..." value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 mb-4 focus:border-blue-500 focus:outline-none" />

      {loading ? <div className="text-gray-400 text-center py-10">กำลังโหลด...</div> : (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-700/50 text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">เบอร์โทร</th>
                <th className="px-4 py-3 text-right">ยอดเงิน</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} className="border-t border-gray-700/50">
                  <td className="px-4 py-3 text-gray-500">{m.id}</td>
                  <td className="px-4 py-3 text-white">{m.username}</td>
                  <td className="px-4 py-3 text-gray-300">{m.phone || '-'}</td>
                  <td className="px-4 py-3 text-right text-green-400">฿{m.balance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${m.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleStatus(m.id, m.status)}
                      className={`text-xs px-3 py-1 rounded ${m.status === 'active' ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}`}>
                      {m.status === 'active' ? 'ระงับ' : 'เปิดใช้'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > 20 && (
            <div className="flex justify-center gap-2 p-4">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50">ก่อนหน้า</button>
              <span className="px-3 py-1 text-gray-400">หน้า {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={members.length < 20} className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50">ถัดไป</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
