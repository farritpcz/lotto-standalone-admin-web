// Shared constants & helpers for auto-ban feature
// Parent: src/app/bans/auto/page.tsx

export interface LotteryType {
  id: number
  name: string
  code: string
  status: string
}

export interface BetTypeRate { betType: string; label: string; rate: number }

export interface PreviewRule {
  betType: string
  rate: number
  threshold: number
  action: string
  reducedRate: number
  label: string
}

// ─── Config ─────────────────────────────────────────
export const BET_TYPES = ['3 ตัวบน', '3 ตัวโต๊ด', '3 ตัวล่าง', '2 ตัวบน', '2 ตัวล่าง', 'วิ่งบน', 'วิ่งล่าง']

export const actionConfig: Record<string, { cls: string; label: string; icon: string }> = {
  full_ban:    { cls: 'badge-error',   label: 'อั้นเต็ม',  icon: '🚫' },
  reduce_rate: { cls: 'badge-warning', label: 'ลดเรท',    icon: '📉' },
  max_amount:  { cls: 'badge-info',    label: 'จำกัดยอด',  icon: '📊' },
}

export const BET_TYPE_LABELS: Record<string, string> = {
  '3TOP': '3 ตัวบน', '3TOD': '3 ตัวโต๊ด', '3BOTTOM': '3 ตัวล่าง',
  '2TOP': '2 ตัวบน', '2BOTTOM': '2 ตัวล่าง',
  'RUN_TOP': 'วิ่งบน', 'RUN_BOT': 'วิ่งล่าง',
}

export const FALLBACK_RATES: BetTypeRate[] = [
  { betType: '3TOP', label: '3 ตัวบน', rate: 900 }, { betType: '3TOD', label: '3 ตัวโต๊ด', rate: 150 },
  { betType: '2TOP', label: '2 ตัวบน', rate: 90 }, { betType: '2BOTTOM', label: '2 ตัวล่าง', rate: 90 },
  { betType: 'RUN_TOP', label: 'วิ่งบน', rate: 3.2 }, { betType: 'RUN_BOT', label: 'วิ่งล่าง', rate: 4.2 },
]

// ─── localStorage ───────────────────────────────────
const CAPITAL_KEY = 'lotto_auto_ban_capital'

export function loadCapitalFromStorage(): { capital: string; maxLoss: string } {
  if (typeof window === 'undefined') return { capital: '', maxLoss: '' }
  try {
    const raw = localStorage.getItem(CAPITAL_KEY)
    return raw ? JSON.parse(raw) : { capital: '', maxLoss: '' }
  } catch { return { capital: '', maxLoss: '' } }
}

export function saveCapitalToStorage(capital: string, maxLoss: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CAPITAL_KEY, JSON.stringify({ capital, maxLoss }))
}

export const fmtMoney = (n: number) => `฿${n.toLocaleString()}`
export const getBetTypeLabel = (code: string) => BET_TYPE_LABELS[code] || code

/**
 * คำนวณ preview rules (8 ระดับขั้นบันได) จาก maxLoss
 * - จำกัดยอดต่อคน (40%)
 * - ลดเรท 10/20/35/50/65/80% (ที่ 50/60/70/80/88/95%)
 * - อั้นเต็ม (100%)
 */
export function computePreviewRules(maxLossNum: number): PreviewRule[] {
  const calculated: PreviewRule[] = []
  for (const r of FALLBACK_RATES) {
    const fullThreshold = Math.floor(maxLossNum / r.rate)
    calculated.push({ betType: r.betType, rate: r.rate, threshold: Math.floor(fullThreshold * 0.4), action: 'max_amount', reducedRate: 0, label: 'จำกัดยอด (40%)' })
    calculated.push({ betType: r.betType, rate: r.rate, threshold: Math.floor(fullThreshold * 0.5), action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.9), label: 'ลดเรท 10% (50%)' })
    calculated.push({ betType: r.betType, rate: r.rate, threshold: Math.floor(fullThreshold * 0.6), action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.8), label: 'ลดเรท 20% (60%)' })
    calculated.push({ betType: r.betType, rate: r.rate, threshold: Math.floor(fullThreshold * 0.7), action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.65), label: 'ลดเรท 35% (70%)' })
    calculated.push({ betType: r.betType, rate: r.rate, threshold: Math.floor(fullThreshold * 0.8), action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.5), label: 'ลดเรท 50% (80%)' })
    calculated.push({ betType: r.betType, rate: r.rate, threshold: Math.floor(fullThreshold * 0.88), action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.35), label: 'ลดเรท 65% (88%)' })
    calculated.push({ betType: r.betType, rate: r.rate, threshold: Math.floor(fullThreshold * 0.95), action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.2), label: 'ลดเรท 80% (95%)' })
    calculated.push({ betType: r.betType, rate: r.rate, threshold: fullThreshold, action: 'full_ban', reducedRate: 0, label: 'อั้นเต็ม (100%)' })
  }
  return calculated
}
