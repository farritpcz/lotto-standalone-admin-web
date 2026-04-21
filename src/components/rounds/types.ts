// Types + constants + helpers สำหรับหน้า rounds
// Parent: src/app/rounds/page.tsx

export interface Round {
  id: number; round_number: string; round_date: string
  status: string; open_time: string; close_time: string
  lottery_type_id?: number
  lottery_type?: { id: number; name: string; icon?: string; category?: string }
}

export interface LotteryType {
  id: number; name: string; code: string; icon?: string
  status: string; category?: string
}

export interface RoundFormData {
  lottery_type_id: string; round_number: string
  round_date: string; open_time: string; close_time: string
}

/** สถานะ → สี + badge + label */
export const STATUS_CONFIG: Record<string, { badge: string; label: string; color: string; bg: string }> = {
  upcoming: { badge: 'badge-neutral',  label: 'รอเปิด',       color: 'var(--text-secondary)',  bg: 'transparent' },
  open:     { badge: 'badge-success',  label: 'เปิดรับแทง',    color: '#34d399',               bg: 'rgba(52,211,153,0.06)' },
  closed:   { badge: 'badge-warning',  label: 'ปิดรับแทง',    color: '#fbbf24',               bg: 'rgba(251,191,36,0.06)' },
  resulted: { badge: 'badge-info',     label: 'ออกผลแล้ว',    color: '#60a5fa',               bg: 'rgba(96,165,250,0.06)' },
  voided:   { badge: 'badge-error',    label: 'ยกเลิกแล้ว',   color: '#ef4444',               bg: 'rgba(239,68,68,0.06)' },
}

/** Category groups สำหรับ optgroup ใน dropdown */
export const CATEGORY_GROUPS = [
  { key: 'thai',   label: 'หวยไทย' },
  { key: 'yeekee', label: 'ยี่กี' },
  { key: 'lao',    label: 'หวยลาว' },
  { key: 'hanoi',  label: 'หวยฮานอย' },
  { key: 'malay',  label: 'มาเลย์' },
  { key: 'stock',  label: 'หวยหุ้น' },
]

export const EMPTY_FORM: RoundFormData = { lottery_type_id: '', round_number: '', round_date: '', open_time: '', close_time: '' }
export const PER_PAGE = 20

// ─── Format helpers ───────────────────────────────────────────────

/** Format datetime → "16 เม.ย. 14:30" */
export const fmtShort = (s: string) => {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' +
           String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  } catch { return s }
}

/** Format time only → "14:30" */
export const fmtTime = (s: string) => {
  try {
    const d = new Date(s)
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  } catch { return s }
}

/** Format date only → "16 เม.ย. 26" */
export const fmtDateOnly = (s: string) => {
  try { return new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) }
  catch { return s }
}

/** Relative time → "เปิดอีก 2 ชม.", "ปิดไปแล้ว 30 นาที" */
export const relativeTime = (s: string) => {
  try {
    const diff = new Date(s).getTime() - Date.now()
    const absDiff = Math.abs(diff)
    const mins = Math.floor(absDiff / 60000)
    const hrs = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)
    const suffix = diff > 0 ? 'อีก' : 'ที่แล้ว'
    if (days > 0) return `${suffix} ${days} วัน`
    if (hrs > 0) return `${suffix} ${hrs} ชม.`
    return `${suffix} ${mins} นาที`
  } catch { return '' }
}
