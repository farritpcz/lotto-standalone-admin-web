// Types: Results shared types
// Parent: src/app/results/page.tsx

export interface Round {
  id: number
  lottery_type?: { name: string; code?: string; icon?: string; category?: string }
  round_number: string
  round_date: string
  status: string
  result_top3?: string
  result_top2?: string
  result_bottom2?: string
  result_front3?: string
  result_bottom3?: string
}

export interface Winner {
  bet_id: number
  member_id: number
  username: string
  number: string
  bet_type: string
  amount: number
  rate: number
  payout: number
}

export interface PreviewData {
  round_number: string
  total_bets: number
  total_amount: number
  winners: Winner[]
  winner_count: number
  total_payout: number
  profit: number
}

export const fmtMoney = (n: number) => `฿${n.toLocaleString()}`
