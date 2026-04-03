/**
 * AdminLayout — Layout wrapper (Linear/Vercel style)
 *
 * - Sidebar (fixed left, 220px)
 * - Main content area (offset by sidebar width)
 * - Fetches pending deposit/withdraw counts สำหรับ badge
 * - Redirect ไป /login ถ้าไม่มี token
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import { ToastProvider } from './Toast'
import CommandPalette from './CommandPalette'
import Breadcrumbs from './Breadcrumbs'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pendingDeposits, setPendingDeposits] = useState(0)
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0)

  useEffect(() => {
    // ข้ามถ้าอยู่ที่ login page
    if (pathname === '/login') return

    // ⭐ httpOnly cookie → ไม่ต้องเช็ค localStorage
    // middleware.ts จัดการ redirect ถ้าไม่มี cookie แล้ว
    // ถ้า API call แรก return 401 → response interceptor จะ redirect ไป login

    // Fetch pending counts สำหรับ sidebar badge
    import('@/lib/api').then(({ api }) => {
      api.get('/deposits?status=pending&per_page=1').then(res => {
        setPendingDeposits(res.data.data?.total || 0)
      }).catch(() => {})
      api.get('/withdrawals?status=pending&per_page=1').then(res => {
        setPendingWithdrawals(res.data.data?.total || 0)
      }).catch(() => {})
    })
  }, [pathname, router])

  // Login page — no sidebar (ยังคงมี toast ให้ใช้)
  if (pathname === '/login') {
    return <ToastProvider>{children}</ToastProvider>
  }

  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <AdminSidebar
          pendingDeposits={pendingDeposits}
          pendingWithdrawals={pendingWithdrawals}
        />
        <div className="admin-main-content" style={{ flex: 1, minHeight: '100vh', overflowY: 'auto' }}>
          <div style={{ padding: '16px 24px 0' }}>
            <Breadcrumbs />
          </div>
          {children}
        </div>
        <CommandPalette />
      </div>
    </ToastProvider>
  )
}
