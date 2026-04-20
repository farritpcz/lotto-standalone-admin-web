/**
 * Sidebar menu data (shared by AdminSidebar + CommandPalette + Breadcrumbs)
 *
 * Rule: pure data only — ไม่มี render / ไม่มี state
 * Related: AdminSidebar.tsx, CommandPalette.tsx, Breadcrumbs.tsx
 */
import {
  LayoutDashboard,
  Users,
  Ticket,
  Clock,
  Ban,
  Zap,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowDownUp,
  ClipboardList,
  Receipt,
  Star,
  Gift,
  BarChart3,
  Link2,
  UsersRound,
  Globe,
  FileText,
  CreditCard,
  Bell,
  GitBranch,
  FileBarChart,
  type LucideIcon,
} from 'lucide-react'

export type BadgeKey = 'deposits' | 'withdrawals'

export interface MenuItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: BadgeKey
  perm?: string | null // null = ทุกคนเห็น
}

export const menuGroups: { label: string; items: MenuItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view' },
      { href: '/members', label: 'สมาชิก', icon: Users, perm: 'members.view' },
    ],
  },
  {
    label: 'หวย',
    items: [
      { href: '/lotteries', label: 'ประเภทหวย', icon: Ticket, perm: 'lottery.view' },
      { href: '/rounds', label: 'รอบหวย', icon: Clock, perm: 'lottery.view' },
      { href: '/bans', label: 'เลขอั้น', icon: Ban, perm: 'lottery.bans' },
      { href: '/bans/auto', label: 'อั้นอัตโนมัติ', icon: Zap, perm: 'lottery.bans' },
      { href: '/rates', label: 'อัตราจ่าย', icon: DollarSign, perm: 'lottery.rates' },
      { href: '/yeekee', label: 'ยี่กี', icon: Zap, perm: 'lottery.view' },
    ],
  },
  {
    label: 'การเงิน',
    items: [
      { href: '/deposits', label: 'รายการฝาก', icon: ArrowDownToLine, badge: 'deposits', perm: 'finance.deposits' },
      { href: '/withdrawals', label: 'รายการถอน', icon: ArrowUpFromLine, badge: 'withdrawals', perm: 'finance.withdrawals' },
      { href: '/bets', label: 'รายการแทง', icon: ClipboardList, perm: 'finance.bets' },
      { href: '/transactions', label: 'ธุรกรรม', icon: Receipt, perm: 'finance.transactions' },
    ],
  },
  {
    label: 'สมาชิก',
    items: [
      { href: '/member-levels', label: 'Level สมาชิก', icon: Star, perm: 'system.cms' },
      { href: '/promotions', label: 'โปรโมชั่น', icon: Gift, perm: 'system.cms' },
    ],
  },
  {
    label: 'สายงาน',
    items: [
      { href: '/downline', label: 'จัดการสายงาน', icon: GitBranch, perm: 'system.affiliate' },
      { href: '/downline/report', label: 'รายงานเคลีย', icon: FileBarChart, perm: 'system.affiliate' },
    ],
  },
  {
    label: 'ระบบ',
    items: [
      { href: '/reports', label: 'รายงาน', icon: BarChart3, perm: 'reports.view' },
      { href: '/affiliate', label: 'Affiliate', icon: Link2, perm: 'system.affiliate' },
      { href: '/staff', label: 'พนักงาน', icon: UsersRound, perm: 'system.staff' },
      { href: '/cms', label: 'จัดการเว็บ', icon: Globe, perm: 'system.cms' },
      { href: '/activity-log', label: 'Activity Log', icon: FileText, perm: 'system.staff' },
      { href: '/settings/deposit-withdraw', label: 'ตั้งค่าฝาก/ถอน', icon: ArrowDownUp, perm: 'system.settings' },
      { href: '/settings/bank-accounts', label: 'บัญชีฝาก/ถอน', icon: CreditCard, perm: 'system.settings' },
      { href: '/contact-channels', label: 'ช่องทางติดต่อ', icon: Bell, perm: 'system.cms' },
      { href: '/settings/notifications', label: 'แจ้งเตือน', icon: Bell, perm: 'system.settings' },
    ],
  },
]

/** Flat list of all menu items (used by CommandPalette) */
export const allMenuItems = menuGroups.flatMap(g => g.items)

/** canAccessMenu — permission check สำหรับ menu item
 *
 * - null perm = ทุกคนเห็น
 * - owner/admin = เห็นทุกเมนู
 * - node user (สายงาน) = เห็นเมนูทั้งหมด (scope ทำที่ backend)
 * - operator/viewer = เช็ค exact match หรือ wildcard (เช่น "members.*")
 */
export function canAccessMenu(
  perm: string | null | undefined,
  userRole: string,
  isNodeUser: boolean,
  userPermissions: string[],
): boolean {
  if (!perm) return true
  if (userRole === 'owner' || userRole === 'admin') return true
  if (isNodeUser) return true
  return userPermissions.some(p => {
    if (p === perm) return true
    if (p.endsWith('.*')) {
      const prefix = p.replace('.*', '.')
      return perm.startsWith(prefix)
    }
    return false
  })
}
