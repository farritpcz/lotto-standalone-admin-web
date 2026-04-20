// Types: Bets-all shared types
// Parent: src/app/bets/page.tsx

// Bill row — group by batch_id (1 row = 1 บิล)
export interface BillRow {
  batch_id: string; member_id: number; username: string
  lottery_round_id: number; bet_count: number; numbers: string
  total_amount: number; total_win: number
  pending_count: number; won_count: number; lost_count: number; cancelled_count: number
  created_at: string
}

// Individual bet (ใช้ใน bill detail modal)
export interface BetRow {
  id: number; batch_id?: string; member_id: number; number: string; amount: number; rate: number
  status: string; win_amount: number; created_at: string
  settled_at?: string; cancelled_at?: string; cancel_reason?: string
  member?: { id?: number; username: string }
  bet_type?: { name: string; code: string }
  lottery_round?: { id: number; round_number: string; lottery_type?: { name: string } }
}

export interface BillModalData {
  bets: BetRow[]
  totalAmount: number
  totalWin: number
  batchId: string
}

// ─── Bill status helper ─────────────────────────────────────────────
export const getBillStatus = (b: BillRow) => {
  if (b.cancelled_count === b.bet_count) return 'cancelled'
  if (b.pending_count > 0) return 'pending'
  return b.total_win > b.total_amount ? 'won' : 'lost'
}

// ─── Status config ──────────────────────────────────────────────────
export const betStatusMap: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'badge-warning', label: 'รอผล' },
  won:       { cls: 'badge-success', label: 'ถูก' },
  lost:      { cls: 'badge-error',   label: 'ไม่ถูก' },
  cancelled: { cls: 'badge-neutral', label: 'ยกเลิก' },
}

export const billStatusMap: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'badge-warning', label: 'รอผล' },
  won:       { cls: 'badge-success', label: 'ลูกค้าชนะ' },
  lost:      { cls: 'badge-error',   label: 'ลูกค้าแพ้' },
  cancelled: { cls: 'badge-neutral', label: 'ยกเลิก' },
}

// ─── Helpers ────────────────────────────────────────────────────────
export const fmtId = (id: number) => `BET${String(id).padStart(5, '0')}`
export const fmtBillId = (batchId: string) => batchId ? `BILL-${batchId.slice(0, 8).toUpperCase()}` : '—'
export const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const fmtDate = (s: string) => {
  try { return new Date(s).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return s }
}
export const relTime = (s: string) => {
  try {
    const diff = Date.now() - new Date(s).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'เมื่อกี้'
    if (mins < 60) return `${mins} นาทีที่แล้ว`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} ชม.ที่แล้ว`
    return `${Math.floor(hrs / 24)} วันที่แล้ว`
  } catch { return '' }
}
export const getErrMsg = (err: unknown) =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'เกิดข้อผิดพลาด'
