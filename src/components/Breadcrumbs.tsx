/**
 * Breadcrumbs — auto-generate จาก pathname
 * Dashboard / สมาชิก / #123
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const pathLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  members: 'สมาชิก',
  lotteries: 'ประเภทหวย',
  rounds: 'รอบหวย',
  results: 'กรอกผล',
  bans: 'เลขอั้น',
  auto: 'อั้นอัตโนมัติ',
  rates: 'อัตราจ่าย',
  yeekee: 'ยี่กี',
  deposits: 'รายการฝาก',
  withdrawals: 'รายการถอน',
  bets: 'รายการแทง',
  transactions: 'ธุรกรรม',
  reports: 'รายงาน',
  affiliate: 'Affiliate',
  staff: 'พนักงาน',
  cms: 'จัดการเว็บ',
  settings: 'ตั้งค่า',
  'activity-log': 'Activity Log',
  'member-levels': 'Level สมาชิก',
  promotions: 'โปรโมชั่น',
  'bank-accounts': 'บัญชีฝาก/ถอน',
  notifications: 'แจ้งเตือน',
  'deposit-withdraw': 'ตั้งค่าฝาก/ถอน',
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  if (!pathname || pathname === '/dashboard' || pathname === '/') return null

  const segments = pathname.split('/').filter(Boolean)

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = pathLabels[seg] || (seg.match(/^\d+$/) ? `#${seg}` : seg)
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12, flexWrap: 'wrap' }}>
      <Link href="/dashboard" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>
        Dashboard
      </Link>
      {crumbs.map(crumb => (
        <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronRight size={12} />
          {crumb.isLast ? (
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{crumb.label}</span>
          ) : (
            <Link href={crumb.href} style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
