/**
 * Dashboard types + date filter helpers
 *
 * Rule: data contract จาก /dashboard/v2
 * Related: app/dashboard/page.tsx, components/dashboard/*
 */

export interface DashboardData {
  summary: {
    deposits_this_month: number
    deposits_last_month: number
    withdrawals_this_month: number
    withdrawals_last_month: number
    profit_this_month: number
    profit_last_month: number
    new_members_this_month: number
    new_members_last_month: number
  }
  chart_data: { date: string; deposits: number; withdrawals: number }[]
  top_bettors: {
    member_id: number
    username: string
    total_bet: number
    total_win: number
    profit: number
  }[]
  top_depositors: {
    member_id: number
    username: string
    total_deposit: number
    total_withdraw: number
  }[]
  recent_deposits: {
    id: number
    username: string
    amount: number
    status: string
    created_at: string
  }[]
  recent_withdrawals: {
    id: number
    username: string
    amount: number
    status: string
    bank_code: string
    created_at: string
  }[]
  member_tracking: {
    direct_signups: number
    referral_signups: number
    deposited_today: number
  }
  credit_stats: {
    credit_added: number
    credit_deducted: number
    deposit_count: number
    commission_total: number
    cancelled_deposits: number
    cancelled_withdrawals: number
  }
  bank_accounts: {
    id: number
    bank_code: string
    bank_name: string
    account_number: string
    account_name: string
  }[]
}

export type FilterPreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'first_half'
  | 'second_half'
  | 'custom'

export const PRESETS: { key: FilterPreset; label: string }[] = [
  { key: 'today', label: 'วันนี้' },
  { key: 'yesterday', label: 'เมื่อวาน' },
  { key: 'this_week', label: 'อาทิตย์นี้' },
  { key: 'this_month', label: 'เดือนนี้' },
  { key: 'first_half', label: 'ต้นเดือน' },
  { key: 'second_half', label: 'ท้ายเดือน' },
  { key: 'custom', label: 'กำหนดเอง' },
]

/** คำนวณช่วงวันที่จาก preset key */
export function getPresetRange(
  preset: FilterPreset,
): { from: string; to: string; label: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  const ymd = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`

  const today = ymd(now)
  const yesterday = ymd(new Date(y, m, d - 1))
  const weekStart = new Date(y, m, d - now.getDay()) // อาทิตย์
  const monthFirst = new Date(y, m, 1)
  const monthLast = new Date(y, m + 1, 0)

  switch (preset) {
    case 'today':
      return { from: today, to: today, label: 'วันนี้' }
    case 'yesterday':
      return { from: yesterday, to: yesterday, label: 'เมื่อวาน' }
    case 'this_week':
      return {
        from: ymd(weekStart),
        to: ymd(new Date(weekStart.getTime() + 6 * 86400000)),
        label: 'อาทิตย์นี้',
      }
    case 'this_month':
      return { from: ymd(monthFirst), to: ymd(monthLast), label: 'เดือนนี้' }
    case 'first_half':
      return { from: ymd(monthFirst), to: `${y}-${pad(m + 1)}-15`, label: 'ต้นเดือน (1-15)' }
    case 'second_half':
      return { from: `${y}-${pad(m + 1)}-16`, to: ymd(monthLast), label: 'ท้ายเดือน (16-สิ้นเดือน)' }
    default:
      return { from: ymd(monthFirst), to: ymd(monthLast), label: 'เดือนนี้' }
  }
}

// ─── Formatting helpers ──────────────────────────────────────────────────
export const fmt = (n: number) =>
  `฿${Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const fmtShort = (n: number) =>
  `฿${Math.abs(n).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`

export const pctChange = (curr: number, prev: number) => {
  if (prev === 0) return curr > 0 ? 100 : curr < 0 ? -100 : 0
  return Math.round(((curr - prev) / Math.abs(prev)) * 100)
}

export const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(245,166,35,0.15)', color: '#f5a623', label: 'รอ' },
  approved: { bg: 'rgba(0,229,160,0.15)', color: '#00e5a0', label: 'สำเร็จ' },
  rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'ปฏิเสธ' },
}
