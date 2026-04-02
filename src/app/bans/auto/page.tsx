/**
 * Admin — ระบบอั้นเลขอัตโนมัติ (Auto-Ban Settings)
 *
 * แบ่ง tab ตามประเภทหวย — จัดการง่าย:
 * - เลือกประเภทหวย (tab) → เห็นกฎอั้นทั้งหมดของหวยนั้น
 * - เพิ่ม/ลบ/เปิด-ปิดกฎ
 * - ตั้ง threshold, action (อั้นเต็ม/ลดเรท/จำกัดยอด)
 *
 * ⭐ ตอนนี้เป็น UI config — เมื่อ API พร้อมจะเชื่อมจริง
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { lotteryMgmtApi } from '@/lib/api'

/* ── Types ─────────────────────────────────────────────────────────────── */
interface AutoBanRule {
  id: number
  lottery_type_id: number
  lottery_type_name: string
  bet_type: string
  threshold_amount: number
  action: 'full_ban' | 'reduce_rate' | 'max_amount'
  reduce_rate_to?: number
  max_per_person?: number
  status: 'active' | 'inactive'
}

interface LotteryType {
  id: number
  name: string
  code: string
  status: string
}

const BET_TYPES = ['3 ตัวบน', '3 ตัวโต๊ด', '3 ตัวล่าง', '2 ตัวบน', '2 ตัวล่าง', 'วิ่งบน', 'วิ่งล่าง']

const actionConfig: Record<string, { cls: string; label: string; icon: string }> = {
  full_ban:    { cls: 'badge-error',   label: 'อั้นเต็ม',  icon: '🚫' },
  reduce_rate: { cls: 'badge-warning', label: 'ลดเรท',    icon: '📉' },
  max_amount:  { cls: 'badge-info',    label: 'จำกัดยอด',  icon: '📊' },
}

/* ── Default rates ต่อประเภทหวย (ใช้คำนวณ threshold อัตโนมัติ) ──────── */
interface BetTypeRate { betType: string; rate: number }

const DEFAULT_RATES: Record<string, BetTypeRate[]> = {
  THAI:          [{ betType: '3 ตัวบน', rate: 900 }, { betType: '3 ตัวโต๊ด', rate: 150 }, { betType: '3 ตัวล่าง', rate: 650 }, { betType: '2 ตัวบน', rate: 90 }, { betType: '2 ตัวล่าง', rate: 90 }, { betType: 'วิ่งบน', rate: 3.2 }, { betType: 'วิ่งล่าง', rate: 4.2 }],
  LAO:           [{ betType: '3 ตัวบน', rate: 900 }, { betType: '3 ตัวโต๊ด', rate: 150 }, { betType: '3 ตัวล่าง', rate: 650 }, { betType: '2 ตัวบน', rate: 90 }, { betType: '2 ตัวล่าง', rate: 90 }, { betType: 'วิ่งบน', rate: 3.2 }, { betType: 'วิ่งล่าง', rate: 4.2 }],
  YEEKEE:        [{ betType: '3 ตัวบน', rate: 1000 }, { betType: '3 ตัวโต๊ด', rate: 150 }, { betType: '2 ตัวบน', rate: 100 }, { betType: '2 ตัวล่าง', rate: 100 }, { betType: 'วิ่งบน', rate: 4 }, { betType: 'วิ่งล่าง', rate: 5 }],
  STOCK_TH:      [{ betType: '3 ตัวบน', rate: 900 }, { betType: '3 ตัวโต๊ด', rate: 150 }, { betType: '2 ตัวบน', rate: 90 }, { betType: '2 ตัวล่าง', rate: 90 }, { betType: 'วิ่งบน', rate: 3.2 }, { betType: 'วิ่งล่าง', rate: 4.2 }],
  STOCK_FOREIGN: [{ betType: '3 ตัวบน', rate: 900 }, { betType: '3 ตัวโต๊ด', rate: 150 }, { betType: '2 ตัวบน', rate: 90 }, { betType: '2 ตัวล่าง', rate: 90 }, { betType: 'วิ่งบน', rate: 3.2 }, { betType: 'วิ่งล่าง', rate: 4.2 }],
}

// Fallback สำหรับ lottery type ที่ไม่มีใน DEFAULT_RATES
const FALLBACK_RATES: BetTypeRate[] = [
  { betType: '3 ตัวบน', rate: 900 }, { betType: '3 ตัวโต๊ด', rate: 150 },
  { betType: '2 ตัวบน', rate: 90 }, { betType: '2 ตัวล่าง', rate: 90 },
  { betType: 'วิ่งบน', rate: 3.2 }, { betType: 'วิ่งล่าง', rate: 4.2 },
]

/* ── localStorage key ──────────────────────────────────────────────────── */
const STORAGE_KEY = 'lotto_auto_ban_rules'
const CAPITAL_KEY = 'lotto_auto_ban_capital'

function loadRulesFromStorage(): Record<string, AutoBanRule[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveRulesToStorage(rules: Record<string, AutoBanRule[]>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

function loadCapitalFromStorage(): { capital: string; maxLoss: string } {
  if (typeof window === 'undefined') return { capital: '', maxLoss: '' }
  try {
    const raw = localStorage.getItem(CAPITAL_KEY)
    return raw ? JSON.parse(raw) : { capital: '', maxLoss: '' }
  } catch { return { capital: '', maxLoss: '' } }
}

function saveCapitalToStorage(capital: string, maxLoss: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CAPITAL_KEY, JSON.stringify({ capital, maxLoss }))
}

const fmtMoney = (n: number) => `฿${n.toLocaleString()}`

export default function AutoBanPage() {
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [selectedType, setSelectedType] = useState<LotteryType | null>(null)
  const [rules, setRules] = useState<Record<string, AutoBanRule[]>>({})
  const [showModal, setShowModal] = useState(false)
  const [nextId, setNextId] = useState(100)

  // ⭐ Auto-calculate state
  const [capital, setCapital] = useState('')
  const [maxLoss, setMaxLoss] = useState('')

  // ⭐ โหลดกฎ + ทุน จาก localStorage ตอน mount
  useEffect(() => {
    const savedRules = loadRulesFromStorage()
    setRules(savedRules)
    // หา next ID จากกฎที่มีอยู่
    const allIds = Object.values(savedRules).flat().map(r => r.id)
    if (allIds.length > 0) setNextId(Math.max(...allIds) + 1)

    const savedCapital = loadCapitalFromStorage()
    setCapital(savedCapital.capital)
    setMaxLoss(savedCapital.maxLoss)
  }, [])
  const [showPreview, setShowPreview] = useState(false)
  const [previewRules, setPreviewRules] = useState<{ betType: string; rate: number; threshold: number }[]>([])

  const [form, setForm] = useState({
    bet_type: '3 ตัวบน',
    threshold_amount: '',
    action: 'full_ban' as string,
    reduce_rate_to: '',
    max_per_person: '',
  })

  // โหลดประเภทหวยจาก API
  useEffect(() => {
    lotteryMgmtApi.list()
      .then(res => {
        const types: LotteryType[] = res.data?.data?.items || res.data?.data || []
        setLotteryTypes(types)
        if (types.length > 0) setSelectedType(types[0])
      })
      .catch(() => {
        // fallback mock
        const mock: LotteryType[] = [
          { id: 1, name: 'หวยไทย', code: 'THAI', status: 'active' },
          { id: 2, name: 'หวยลาว', code: 'LAO', status: 'active' },
          { id: 5, name: 'หวยยี่กี', code: 'YEEKEE', status: 'active' },
        ]
        setLotteryTypes(mock)
        setSelectedType(mock[0])
      })
  }, [])

  const currentRules = selectedType ? (rules[selectedType.code] || []) : []

  // ⭐ คำนวณ threshold อัตโนมัติจากทุน + ยอมเสีย
  const handleCalculate = useCallback(() => {
    const maxLossNum = Number(maxLoss)
    if (!selectedType || !maxLossNum || maxLossNum <= 0) return

    const rates = DEFAULT_RATES[selectedType.code] || FALLBACK_RATES
    const calculated = rates.map(r => ({
      betType: r.betType,
      rate: r.rate,
      threshold: Math.floor(maxLossNum / r.rate), // ปัดลง (ป้องกันเกิน)
    }))

    setPreviewRules(calculated)
    setShowPreview(true)
  }, [selectedType, maxLoss])

  // ⭐ ยืนยัน — สร้างกฎอั้นทั้งหมดจาก preview
  const handleApplyCalculated = useCallback(() => {
    if (!selectedType || previewRules.length === 0) return

    const newRules: AutoBanRule[] = previewRules.map((pr, i) => ({
      id: nextId + i,
      lottery_type_id: selectedType.id,
      lottery_type_name: selectedType.name,
      bet_type: pr.betType,
      threshold_amount: pr.threshold,
      action: 'full_ban' as const,
      status: 'active' as const,
    }))

    setRules(prev => {
      const updated = { ...prev, [selectedType.code]: [...(prev[selectedType.code] || []), ...newRules] }
      saveRulesToStorage(updated)
      return updated
    })
    setNextId(prev => prev + previewRules.length)
    setShowPreview(false)
    // บันทึกทุน + ยอมเสีย
    saveCapitalToStorage(capital, maxLoss)
  }, [selectedType, previewRules, nextId])

  // เพิ่มกฎ (manual)
  const handleAdd = useCallback(() => {
    if (!selectedType || !form.threshold_amount) return
    const newRule: AutoBanRule = {
      id: nextId,
      lottery_type_id: selectedType.id,
      lottery_type_name: selectedType.name,
      bet_type: form.bet_type,
      threshold_amount: Number(form.threshold_amount),
      action: form.action as AutoBanRule['action'],
      reduce_rate_to: form.action === 'reduce_rate' ? Number(form.reduce_rate_to) : undefined,
      max_per_person: form.action === 'max_amount' ? Number(form.max_per_person) : undefined,
      status: 'active',
    }
    setRules(prev => {
      const updated = { ...prev, [selectedType.code]: [...(prev[selectedType.code] || []), newRule] }
      saveRulesToStorage(updated)
      return updated
    })
    setNextId(prev => prev + 1)
    setShowModal(false)
    setForm({ bet_type: '3 ตัวบน', threshold_amount: '', action: 'full_ban', reduce_rate_to: '', max_per_person: '' })
  }, [selectedType, form, nextId])

  // ลบกฎ
  const handleDelete = useCallback((ruleId: number) => {
    if (!selectedType) return
    setRules(prev => {
      const updated = { ...prev, [selectedType.code]: (prev[selectedType.code] || []).filter(r => r.id !== ruleId) }
      saveRulesToStorage(updated)
      return updated
    })
  }, [selectedType])

  // toggle สถานะ
  const handleToggle = useCallback((ruleId: number) => {
    if (!selectedType) return
    setRules(prev => {
      const updated = {
        ...prev,
        [selectedType.code]: (prev[selectedType.code] || []).map(r =>
          r.id === ruleId ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r
        ),
      }
      saveRulesToStorage(updated)
      return updated
    })
  }, [selectedType])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">ระบบอั้นเลขอัตโนมัติ</h1>
          <p className="page-subtitle">ตั้ง threshold ยอดรวม → ระบบอั้นเลขให้อัตโนมัติ</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ เพิ่มกฎ</button>
      </div>

      {/* คำอธิบาย */}
      <div className="card-surface p-4 mb-4">
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
          <span className="font-bold text-[var(--text-primary)]">วิธีทำงาน:</span> เมื่อยอดรวมทุกคนต่อเลข ในรอบเดียวกัน ถึง threshold ที่ตั้งไว้<br />
          <span className="inline-flex items-center gap-1 mt-1">🚫 <span className="text-red-400 font-semibold">อั้นเต็ม</span> — ปิดรับเลขนั้น</span>
          <span className="inline-flex items-center gap-1 ml-4">📉 <span className="text-yellow-400 font-semibold">ลดเรท</span> — ลดอัตราจ่าย</span>
          <span className="inline-flex items-center gap-1 ml-4">📊 <span className="text-blue-400 font-semibold">จำกัดยอด</span> — จำกัดต่อคน</span>
        </div>
      </div>

      {/* ⭐ คำนวณกฎอั้นอัตโนมัติ */}
      <div className="card-surface p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧮</span>
          <h3 className="text-sm font-bold">คำนวณกฎอั้นอัตโนมัติ</h3>
          <span className="text-xs text-[var(--text-tertiary)]">— กรอกทุน + ยอมเสียสูงสุด ระบบจะคำนวณ threshold ให้</span>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-1 block">ทุนทั้งหมด (฿)</label>
            <input
              type="number"
              value={capital}
              onChange={e => setCapital(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              placeholder="100,000"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-1 block">ยอมเสียสูงสุดต่อรอบ (฿)</label>
            <input
              type="number"
              value={maxLoss}
              onChange={e => setMaxLoss(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              placeholder="20,000"
            />
          </div>
          <button
            onClick={handleCalculate}
            disabled={!selectedType || !maxLoss || Number(maxLoss) <= 0}
            className="btn btn-primary px-6 py-2 text-sm disabled:opacity-40"
          >
            🧮 คำนวณ
          </button>
        </div>

        {/* Preview ผลคำนวณ */}
        {showPreview && previewRules.length > 0 && (
          <div className="mt-4 border-t border-[var(--border-color)] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold">
                ผลคำนวณ — {selectedType?.name}
                <span className="text-xs text-[var(--text-tertiary)] ml-2">
                  (ทุน {fmtMoney(Number(capital || 0))} | ยอมเสีย {fmtMoney(Number(maxLoss))})
                </span>
              </h4>
              <div className="flex gap-2">
                <button onClick={() => setShowPreview(false)} className="btn btn-ghost text-xs">ยกเลิก</button>
                <button onClick={handleApplyCalculated} className="btn btn-primary text-xs">✅ ใช้กฎเหล่านี้</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {previewRules.map((pr, i) => (
                <div key={i} className="rounded-lg p-3 flex items-center justify-between"
                  style={{ background: 'var(--bg-tertiary)' }}>
                  <div>
                    <div className="text-xs font-semibold">{pr.betType}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">rate x{pr.rate}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-400">{fmtMoney(pr.threshold)}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">threshold</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-[var(--text-tertiary)]">
              💡 สูตร: threshold = ยอมเสีย ÷ rate → ถ้ายอดรวมต่อเลขเกินค่านี้ → อั้นเต็ม
            </div>
          </div>
        )}
      </div>

      {/* ⭐ Tab ประเภทหวย */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {lotteryTypes.map(lt => (
          <button
            key={lt.id}
            onClick={() => setSelectedType(lt)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedType?.id === lt.id
                ? 'bg-[var(--accent-primary)] text-white shadow-md'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {lt.name}
          </button>
        ))}
      </div>

      {/* กฎอั้นของประเภทหวยที่เลือก */}
      {selectedType && (
        <div className="card-surface">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h2 className="text-base font-semibold">กฎอั้นอัตโนมัติ — {selectedType.name}</h2>
            <span className="text-sm text-[var(--text-tertiary)]">{currentRules.length} กฎ</span>
          </div>

          {currentRules.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-tertiary)]">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-sm">ยังไม่มีกฎอั้นสำหรับ {selectedType.name}</div>
              <button onClick={() => setShowModal(true)} className="btn btn-primary mt-4 text-sm">
                + เพิ่มกฎ
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {currentRules.map(r => {
                const ac = actionConfig[r.action] || actionConfig.full_ban
                return (
                  <div key={r.id} className="p-4 flex items-center gap-4 hover:bg-[var(--bg-secondary)] transition-colors">
                    {/* Action icon */}
                    <div className="text-2xl">{ac.icon}</div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{r.bet_type}</span>
                        <span className={`badge ${ac.cls}`}>{ac.label}</span>
                        <span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                          {r.status === 'active' ? 'เปิด' : 'ปิด'}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        Threshold: <span className="font-mono font-bold text-yellow-400">{fmtMoney(r.threshold_amount)}</span>
                        {r.action === 'reduce_rate' && r.reduce_rate_to && (
                          <span className="ml-3">ลดเรทเหลือ x{r.reduce_rate_to}</span>
                        )}
                        {r.action === 'max_amount' && r.max_per_person && (
                          <span className="ml-3">จำกัด {fmtMoney(r.max_per_person)}/คน</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(r.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          r.status === 'active'
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        {r.status === 'active' ? 'เปิดอยู่' : 'ปิดอยู่'}
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ⭐ คำอธิบายเมื่อมีกฎแล้ว — อธิบายการทำงานพร้อมตัวอย่าง */}
      {selectedType && currentRules.length > 0 && (
        <div className="card-surface p-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💡</span>
            <h3 className="text-sm font-bold">กฎเหล่านี้ทำงานยังไง?</h3>
          </div>
          <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-3">
            <div className="rounded-lg p-3" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="font-bold text-[var(--text-primary)] mb-1">📌 สถานการณ์ตัวอย่าง</div>
              คุณตั้ง <span className="text-yellow-400 font-bold">3 ตัวบน</span> threshold{' '}
              <span className="text-yellow-400 font-bold">{fmtMoney(currentRules.find(r => r.bet_type === '3 ตัวบน')?.threshold_amount || 22)}</span>
            </div>

            <div className="rounded-lg p-3" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="font-bold text-[var(--text-primary)] mb-1">📋 เมื่อมีคนแทง</div>
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>ลูกค้า A แทง 3ตัวบน เลข <span className="font-mono text-yellow-400">847</span> = ฿10 → ยอมรับ (ยอดรวม ฿10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>ลูกค้า B แทง 3ตัวบน เลข <span className="font-mono text-yellow-400">847</span> = ฿8 → ยอมรับ (ยอดรวม ฿18)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400">🚫</span>
                  <span>ลูกค้า C แทง 3ตัวบน เลข <span className="font-mono text-yellow-400">847</span> = ฿10 → <span className="text-red-400 font-bold">อั้น!</span> (ยอดรวม ฿28 เกิน threshold)</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-3" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="font-bold text-[var(--text-primary)] mb-1">🛡️ ผลลัพธ์</div>
              ถ้าเลข 847 ถูกจริง คุณจ่ายสูงสุดแค่ threshold × rate<br />
              → <span className="text-green-400 font-bold">ไม่ขาดทุนเกินที่ตั้งไว้</span> ← ระบบปกป้องให้อัตโนมัติ
            </div>

            <div className="text-[10px] text-[var(--text-tertiary)]">
              💡 สูตร: threshold = ยอมเสียสูงสุด ÷ rate → ระบบตรวจยอดรวมต่อเลขในแต่ละรอบ ถ้าเกิน threshold → อั้นเลขนั้นอัตโนมัติ
            </div>
          </div>
        </div>
      )}

      {/* ── Add Rule Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-6">
          <div className="card-surface p-6 max-w-md w-full rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold">
                เพิ่มกฎอั้น — {selectedType?.name}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost text-lg">✕</button>
            </div>

            <div className="space-y-4">
              {/* ประเภทแทง */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">ประเภทแทง</label>
                <select
                  value={form.bet_type}
                  onChange={e => setForm({ ...form, bet_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {BET_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                </select>
              </div>

              {/* Threshold */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">ยอดรวม Threshold (฿)</label>
                <input
                  type="number"
                  value={form.threshold_amount}
                  onChange={e => setForm({ ...form, threshold_amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  placeholder="50000"
                />
                <div className="text-[11px] text-[var(--text-tertiary)] mt-1">เมื่อยอดรวมทุกคนต่อเลข เกินค่านี้ → trigger</div>
              </div>

              {/* Action */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(actionConfig).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, action: key })}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                        form.action === key ? 'text-white shadow-md' : 'text-[var(--text-secondary)]'
                      }`}
                      style={{
                        background: form.action === key ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional fields */}
              {form.action === 'reduce_rate' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">ลดเรทเหลือ (x)</label>
                  <input
                    type="number"
                    value={form.reduce_rate_to}
                    onChange={e => setForm({ ...form, reduce_rate_to: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    placeholder="500"
                  />
                </div>
              )}

              {form.action === 'max_amount' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">จำกัดยอดต่อคน (฿)</label>
                  <input
                    type="number"
                    value={form.max_per_person}
                    onChange={e => setForm({ ...form, max_per_person: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    placeholder="100"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost flex-1">ยกเลิก</button>
              <button onClick={handleAdd} className="btn btn-primary flex-1">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
