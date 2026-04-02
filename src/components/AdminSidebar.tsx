/**
 * AdminSidebar — Linear/Vercel style sidebar navigation
 *
 * Design:
 * - width 220px, bg #0f0f0f, border-right
 * - nav items: height 32px, radius 6px
 * - active: accent-subtle bg + accent text + left border
 * - icons: 15px SVG stroke-width 1.5
 * - badge count สำหรับ pending deposits/withdrawals
 *
 * ⭐ comment เยอะ เพื่อให้ไล่ง่าย
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Ticket, Clock, CheckCircle, Ban, Zap, DollarSign,
  ArrowDownToLine, ArrowUpFromLine, ArrowDownUp, ClipboardList, Receipt,
  Star, Gift, BarChart3, Link2, UsersRound, Globe, FileText,
  Settings, CreditCard, Bell, type LucideIcon,
} from 'lucide-react'

// =============================================================================
// เมนู items — แบ่ง group, ใช้ Lucide icons
// =============================================================================
const menuGroups: { label: string; items: { href: string; label: string; icon: LucideIcon; badge?: 'deposits' | 'withdrawals' }[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/members', label: 'สมาชิก', icon: Users },
    ],
  },
  {
    label: 'หวย',
    items: [
      { href: '/lotteries', label: 'ประเภทหวย', icon: Ticket },
      { href: '/rounds', label: 'รอบหวย', icon: Clock },
      { href: '/results', label: 'กรอกผล', icon: CheckCircle },
      { href: '/bans', label: 'เลขอั้น', icon: Ban },
      { href: '/bans/auto', label: 'อั้นอัตโนมัติ', icon: Zap },
      { href: '/rates', label: 'อัตราจ่าย', icon: DollarSign },
      { href: '/yeekee', label: 'ยี่กี', icon: Zap },
    ],
  },
  {
    label: 'การเงิน',
    items: [
      { href: '/deposits', label: 'รายการฝาก', icon: ArrowDownToLine, badge: 'deposits' },
      { href: '/withdrawals', label: 'รายการถอน', icon: ArrowUpFromLine, badge: 'withdrawals' },
      { href: '/bets', label: 'รายการแทง', icon: ClipboardList },
      { href: '/transactions', label: 'ธุรกรรม', icon: Receipt },
    ],
  },
  {
    label: 'สมาชิก',
    items: [
      { href: '/member-levels', label: 'Level สมาชิก', icon: Star },
      { href: '/promotions', label: 'โปรโมชั่น', icon: Gift },
    ],
  },
  {
    label: 'ระบบ',
    items: [
      { href: '/reports', label: 'รายงาน', icon: BarChart3 },
      { href: '/affiliate', label: 'Affiliate', icon: Link2 },
      { href: '/staff', label: 'พนักงาน', icon: UsersRound },
      { href: '/cms', label: 'จัดการเว็บ', icon: Globe },
      { href: '/activity-log', label: 'Activity Log', icon: FileText },
      { href: '/settings', label: 'ตั้งค่า', icon: Settings },
      { href: '/settings/deposit-withdraw', label: 'ตั้งค่าฝาก/ถอน', icon: ArrowDownUp },
      { href: '/settings/bank-accounts', label: 'บัญชีฝาก/ถอน', icon: CreditCard },
      { href: '/settings/notifications', label: 'แจ้งเตือน', icon: Bell },
    ],
  },
]

// =============================================================================
// Component
// =============================================================================
interface AdminSidebarProps {
  pendingDeposits?: number
  pendingWithdrawals?: number
}

export default function AdminSidebar({ pendingDeposits = 0, pendingWithdrawals = 0 }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // ปิด mobile menu เมื่อเปลี่ยนหน้า
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Badge counts
  const badges: Record<string, number> = {
    deposits: pendingDeposits,
    withdrawals: pendingWithdrawals,
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Sidebar content (ใช้ทั้ง desktop + mobile)
  // ────────────────────────────────────────────────────────────────────────────
  const sidebarContent = (
    <div style={{
      width: 'var(--sidebar-width)', height: '100%',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 14px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: 'black', fontSize: 13,
        }}>L</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          LOTTO Admin
        </span>
      </div>

      {/* ── Nav groups ────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '4px 8px' }}>
        {menuGroups.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            {/* Group label */}
            <div style={{
              padding: '4px 8px 6px', fontSize: 11, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--text-tertiary)',
            }}>
              {group.label}
            </div>

            {/* Items */}
            {group.items.map((item, ii) => {
              const isActive = pathname === item.href
              const badgeKey = (item as { badge?: string }).badge
              const badgeCount = badgeKey ? badges[badgeKey] || 0 : 0

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    height: 32, padding: '0 8px',
                    borderRadius: 6, fontSize: 13,
                    textDecoration: 'none',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--accent-subtle)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                    marginBottom: 1,
                    // stagger animation
                    animation: `fadeSlideUp 0.2s ease backwards`,
                    animationDelay: `${(gi * 4 + ii) * 30}ms`,
                  }}
                >
                  {/* Icon (Lucide) */}
                  <item.icon size={15} strokeWidth={1.5} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />

                  <span style={{ flex: 1 }}>{item.label}</span>

                  {/* Badge */}
                  {badgeCount > 0 && (
                    <span style={{
                      background: 'var(--status-error)',
                      color: 'white', fontSize: 10, fontWeight: 700,
                      padding: '1px 6px', borderRadius: 8,
                      minWidth: 18, textAlign: 'center',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer: Logout ──────────────────────────────────────────────── */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{
            width: '100%', justifyContent: 'flex-start', gap: 8,
            color: 'var(--text-tertiary)', fontSize: 13,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </div>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Desktop sidebar (fixed) */}
      <div className="sidebar-desktop" style={{
        display: 'none', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40,
      }}>
        {sidebarContent}
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="sidebar-mobile-btn"
        style={{
          display: 'none', position: 'fixed', top: 10, left: 10, zIndex: 50,
          width: 36, height: 36, borderRadius: 6,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay + sidebar */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 60 }}>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}
