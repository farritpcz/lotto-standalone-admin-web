// Types + helpers สำหรับหน้า downline/report
// Parent: src/app/downline/report/page.tsx

export interface ReportData {
  my_node: { id: number; name: string; username: string; role: string; share_percent: number }
  parent: { name: string; share_percent: number; diff_percent: number }
  is_root: boolean
  direct: { net_result: number; my_profit: number; bets: number; member_count: number }
  children: ChildRow[]
  summary: {
    direct_profit: number; downline_profit: number; total_profit: number
    total_tree_net: number; parent_settlement: number
  }
}

export interface ChildRow {
  node_id: number; name: string; username: string; role: string
  share_percent: number; diff_percent: number
  tree_net: number; settlement: number; bets: number; member_count: number
}

// ฟอร์แมตเงิน พร้อมเครื่องหมาย
export const fmtMoney = (n: number) =>
  `${n >= 0 ? '+' : ''}${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const fmtAbs = (n: number) =>
  Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
