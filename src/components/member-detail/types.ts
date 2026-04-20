// Types: Member detail — shared interfaces for subcomponents
// Parent: src/app/members/[id]/page.tsx

/** รายละเอียดสมาชิก — มาจาก memberMgmtApi.get(id) */
export interface MemberDetail {
  id: number
  username: string
  phone: string
  email: string
  balance: number
  status: string // 'active' | 'suspended'
  created_at: string
  bank_code?: string
  bank_account_number?: string
  bank_account_name?: string
  referred_by?: number
  referrer_username?: string
  total_bets?: number
  total_bet_amount?: number
  total_win_amount?: number
  total_deposit?: number
  total_withdraw?: number
}

/** ธุรกรรม — มาจาก txMgmtApi.list() */
export interface Transaction {
  id: number
  type: string // deposit, withdraw, bet, win, refund
  amount: number
  balance_before: number
  balance_after: number
  note?: string
  created_at: string
  member_id: number
}

/** เดิมพัน — มาจาก betMgmtApi.list() */
export interface Bet {
  id: number
  member_id?: number
  number: string
  amount: number
  rate: number
  status: string // pending, won, lost
  win_amount: number
  created_at: string
  member?: { id?: number; username: string }
  bet_type?: { name: string; code: string }
  lottery_round?: { id: number; round_number: string }
}

/** Format เงิน — ทุกจำนวนเงินต้องแสดง .00 */
export const fmtMoney = (n: number) =>
  `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Format วันที่ — แสดงแบบไทย */
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })

/** Format วันเวลา — รวมเวลาด้วย */
export const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
