/**
 * Command Palette — Cmd+K / Ctrl+K
 * ค้นหาเมนู/หน้าทั้งหมดได้ทันที
 */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Ticket, Clock, CheckCircle, Ban, Zap, DollarSign,
  ArrowDownToLine, ArrowUpFromLine, ClipboardList, Receipt,
  Star, Gift, BarChart3, Link2, UsersRound, Globe, FileText,
  Settings, CreditCard, Bell, Search, type LucideIcon,
} from 'lucide-react'

interface MenuItem {
  label: string
  href: string
  icon: LucideIcon
  keywords: string
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: 'dashboard ภาพรวม หน้าแรก' },
  { label: 'สมาชิก', href: '/members', icon: Users, keywords: 'members สมาชิก ผู้ใช้' },
  { label: 'ประเภทหวย', href: '/lotteries', icon: Ticket, keywords: 'lotteries หวย ประเภท' },
  { label: 'รอบหวย', href: '/rounds', icon: Clock, keywords: 'rounds รอบ' },
  { label: 'กรอกผล', href: '/results', icon: CheckCircle, keywords: 'results ผล กรอก' },
  { label: 'เลขอั้น', href: '/bans', icon: Ban, keywords: 'bans อั้น เลข' },
  { label: 'อั้นอัตโนมัติ', href: '/bans/auto', icon: Zap, keywords: 'auto ban อั้น อัตโนมัติ' },
  { label: 'อัตราจ่าย', href: '/rates', icon: DollarSign, keywords: 'rates อัตรา จ่าย เรท' },
  { label: 'ยี่กี', href: '/yeekee', icon: Zap, keywords: 'yeekee ยี่กี' },
  { label: 'รายการฝาก', href: '/deposits', icon: ArrowDownToLine, keywords: 'deposits ฝาก' },
  { label: 'รายการถอน', href: '/withdrawals', icon: ArrowUpFromLine, keywords: 'withdrawals ถอน' },
  { label: 'รายการแทง', href: '/bets', icon: ClipboardList, keywords: 'bets แทง เดิมพัน' },
  { label: 'ธุรกรรม', href: '/transactions', icon: Receipt, keywords: 'transactions ธุรกรรม' },
  { label: 'Level สมาชิก', href: '/member-levels', icon: Star, keywords: 'level สมาชิก ระดับ' },
  { label: 'โปรโมชั่น', href: '/promotions', icon: Gift, keywords: 'promotions โปรโมชั่น โปร' },
  { label: 'รายงาน', href: '/reports', icon: BarChart3, keywords: 'reports รายงาน' },
  { label: 'Affiliate', href: '/affiliate', icon: Link2, keywords: 'affiliate แนะนำ คอมมิชชั่น' },
  { label: 'พนักงาน', href: '/staff', icon: UsersRound, keywords: 'staff พนักงาน แอดมิน' },
  { label: 'จัดการเว็บ', href: '/cms', icon: Globe, keywords: 'cms เว็บ แบนเนอร์' },
  { label: 'Activity Log', href: '/activity-log', icon: FileText, keywords: 'activity log บันทึก' },
  { label: 'ตั้งค่า', href: '/settings', icon: Settings, keywords: 'settings ตั้งค่า' },
  { label: 'ตั้งค่าฝาก/ถอน', href: '/settings/deposit-withdraw', icon: Settings, keywords: 'deposit withdraw ฝาก ถอน ตั้งค่า' },
  { label: 'บัญชีฝาก/ถอน', href: '/settings/bank-accounts', icon: CreditCard, keywords: 'bank บัญชี ธนาคาร' },
  { label: 'แจ้งเตือน', href: '/settings/notifications', icon: Bell, keywords: 'notifications แจ้งเตือน telegram' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = query
    ? menuItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.keywords.toLowerCase().includes(query.toLowerCase())
      )
    : menuItems.slice(0, 8) // show first 8 when no query

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[selectedIdx]) {
      router.push(filtered[selectedIdx].href)
      setOpen(false)
    }
  }, [filtered, selectedIdx, router])

  useEffect(() => { setSelectedIdx(0) }, [query])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
      onClick={() => setOpen(false)}>
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      {/* Palette */}
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '100%', maxWidth: 520,
        background: '#111', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'fadeSlideUp 0.15s ease',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={18} color="#666" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ค้นหาเมนู... (พิมพ์ชื่อหน้า)"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#ededed', fontSize: 15, fontFamily: 'inherit',
            }}
          />
          <kbd style={{ fontSize: 11, color: '#555', background: '#222', padding: '2px 6px', borderRadius: 4, border: '1px solid #333' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 18px', textAlign: 'center', color: '#555', fontSize: 13 }}>
              ไม่พบเมนูที่ค้นหา
            </div>
          ) : filtered.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={item.href}
                onClick={() => { router.push(item.href); setOpen(false) }}
                onMouseEnter={() => setSelectedIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 18px', cursor: 'pointer',
                  background: i === selectedIdx ? 'rgba(0,229,160,0.08)' : 'transparent',
                  borderLeft: i === selectedIdx ? '2px solid #00e5a0' : '2px solid transparent',
                  transition: 'all 0.1s',
                }}
              >
                <Icon size={16} color={i === selectedIdx ? '#00e5a0' : '#666'} />
                <span style={{ fontSize: 14, color: i === selectedIdx ? '#ededed' : '#aaa', fontWeight: i === selectedIdx ? 500 : 400 }}>
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '8px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 16, fontSize: 11, color: '#444' }}>
          <span>↑↓ เลื่อน</span>
          <span>↵ เปิด</span>
          <span>ESC ปิด</span>
        </div>
      </div>
    </div>
  )
}
