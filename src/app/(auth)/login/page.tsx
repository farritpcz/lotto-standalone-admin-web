/**
 * Login Page — รองรับทั้ง Admin และ Node (สายงาน)
 *
 * Flow:
 *  1. ลอง login admin ก่อน (ตาราง admins)
 *  2. ถ้าไม่ได้ → ลอง login node (ตาราง agent_nodes)
 *  3. admin → ไป /dashboard
 *  4. node  → ไป /node/portal
 *
 * เรียก API: adminAuthApi.login() + nodeAuthApi.login()
 */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminAuthApi } from '@/lib/api'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      // ⭐ Login เดียวรองรับทั้ง admin + node (สายงาน)
      // Backend จะลอง admins ก่อน → ไม่เจอ → ลอง agent_nodes
      const res = await adminAuthApi.login({ username, password })
      const userType = res.data.data?.user_type || 'admin'

      if (userType === 'node') {
        // ⭐ Node user → เก็บ flag + redirect ไปหน้าสายงาน
        localStorage.setItem('user_type', 'node')
        localStorage.setItem('node_id', String(res.data.data?.node_id || ''))
        localStorage.setItem('node_role', res.data.data?.node_role || '')
        localStorage.setItem('node_name', res.data.data?.admin?.name || '')
        localStorage.setItem('share_percent', String(res.data.data?.share_percent || ''))
        window.location.href = '/downline'
      } else {
        // ⭐ Admin user → ไป dashboard ปกติ
        localStorage.setItem('user_type', 'admin')
        localStorage.removeItem('node_id')
        window.location.href = '/dashboard'
      }
    } catch {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white text-center mb-2">เข้าสู่ระบบ</h1>
        <p className="text-gray-400 text-center mb-8">Lotto — Admin / สายงาน</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition">
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  )
}
