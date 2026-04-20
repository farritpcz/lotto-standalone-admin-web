/**
 * Deposits page — config + types + helpers (split from page.tsx 2026-04-21)
 */
import { ArrowDownToLine, CheckCircle, Clock, FileText, XCircle, type LucideIcon } from 'lucide-react'

// ─── Status config ───────────────────────────────────────────────────
export const statusMap: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'badge-warning', label: 'รอดำเนินการ' },
  approved:  { cls: 'badge-success', label: 'อนุมัติแล้ว' },
  rejected:  { cls: 'badge-error',   label: 'ปฏิเสธ' },
  cancelled: { cls: 'badge-neutral', label: 'ยกเลิก' },
  unmatched: { cls: 'badge-warning', label: 'ไม่ตรงยอด' },
  expired:   { cls: 'badge-neutral', label: 'หมดอายุ' },
}

// ─── Filter tabs (ใช้กรอง status) ────────────────────────────────────
export const filterTabs: { key: string; label: string; icon: LucideIcon }[] = [
  { key: '',          label: 'ทั้งหมด',       icon: FileText },
  { key: 'pending',   label: 'รอดำเนินการ',    icon: Clock },
  { key: 'approved',  label: 'อนุมัติแล้ว',     icon: CheckCircle },
  { key: 'rejected',  label: 'ปฏิเสธ',         icon: XCircle },
  { key: 'unmatched', label: 'ไม่ตรงยอด',     icon: ArrowDownToLine },
]

// ─── Types ───────────────────────────────────────────────────────────
export interface DepositRow {
  id: number; member_id: number; username: string
  amount: number; status: string; created_at: string
  approved_at?: string; note?: string; reject_reason?: string
  slip_url?: string | null; auto_matched?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────
export const fmtId = (id: number) => `DPS${String(id).padStart(5, '0')}`
export const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
  } catch { return s }
}
// ⭐ relative time เช่น "2 นาทีที่แล้ว"
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
// ⭐ ดึง error message จาก API response
export const getErrMsg = (err: unknown) =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'เกิดข้อผิดพลาด'

export const PER_PAGE = 20
