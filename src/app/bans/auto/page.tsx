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
import { lotteryMgmtApi, autoBanApi, AutoBanRuleData } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'

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
// ⭐ betType ใช้ CODE (3TOP, 2TOP ฯลฯ) ให้ตรงกับ backend
interface BetTypeRate { betType: string; label: string; rate: number }

// map code → ชื่อไทย สำหรับแสดงผล
const BET_TYPE_LABELS: Record<string, string> = {
  '3TOP': '3 ตัวบน', '3TOD': '3 ตัวโต๊ด', '3BOTTOM': '3 ตัวล่าง',
  '2TOP': '2 ตัวบน', '2BOTTOM': '2 ตัวล่าง',
  'RUN_TOP': 'วิ่งบน', 'RUN_BOT': 'วิ่งล่าง',
}

// ── Default rates — ไม่ hardcode lottery code, ใช้ FALLBACK_RATES เดียวกันหมด ──
// ถ้าต้องการ rate ต่างกันต่อประเภท ควรดึงจาก API แทน

const FALLBACK_RATES: BetTypeRate[] = [
  { betType: '3TOP', label: '3 ตัวบน', rate: 900 }, { betType: '3TOD', label: '3 ตัวโต๊ด', rate: 150 },
  { betType: '2TOP', label: '2 ตัวบน', rate: 90 }, { betType: '2BOTTOM', label: '2 ตัวล่าง', rate: 90 },
  { betType: 'RUN_TOP', label: 'วิ่งบน', rate: 3.2 }, { betType: 'RUN_BOT', label: 'วิ่งล่าง', rate: 4.2 },
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
// แปลง bet type code → ชื่อไทย
const getBetTypeLabel = (code: string) => BET_TYPE_LABELS[code] || code

export default function AutoBanPage() {
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [selectedType, setSelectedType] = useState<LotteryType | null>(null)
  const [dbRules, setDbRules] = useState<AutoBanRuleData[]>([]) // กฎจาก DB
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoBanRuleData | null>(null)
  const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)
  const [nextId, setNextId] = useState(100)
  const [saving, setSaving] = useState(false)

  // ⭐ Auto-calculate state
  const [capital, setCapital] = useState('')
  const [maxLoss, setMaxLoss] = useState('')

  // ⭐ โหลดกฎจาก API
  const loadRules = useCallback(async () => {
    try {
      const params: Record<string, number> = {}
      if (selectedType) params.lottery_type_id = selectedType.id
      const res = await autoBanApi.list(params)
      setDbRules(res.data?.data || [])
    } catch { /* ignore */ }
  }, [selectedType])

  useEffect(() => {
    if (selectedType) loadRules()
  }, [selectedType, loadRules])

  // โหลดทุนจาก localStorage (แค่ UI state ไม่ต้องเก็บ DB)
  useEffect(() => {
    const savedCapital = loadCapitalFromStorage()
    setCapital(savedCapital.capital)
    setMaxLoss(savedCapital.maxLoss)
  }, [])
  const [showPreview, setShowPreview] = useState(false)
  const [previewRules, setPreviewRules] = useState<{ betType: string; rate: number; threshold: number; action: string; reducedRate: number; label: string }[]>([])

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
        // fallback — ไม่มี mock, ให้เรียก API ได้เท่านั้น
        setLotteryTypes([])
        setSelectedType(null)
      })
  }, [])

  // กฎของประเภทหวยที่เลือก (จาก DB)
  const currentRules = dbRules.filter(r => !selectedType || r.lottery_type_id === selectedType.id)

  // ⭐ คำนวณ threshold อัตโนมัติจากทุน + ยอมเสีย
  const handleCalculate = useCallback(() => {
    const maxLossNum = Number(maxLoss)
    if (!selectedType || !maxLossNum || maxLossNum <= 0) return

    const rates = FALLBACK_RATES
    // ⭐ สร้าง 3 ระดับต่อ bet type: จำกัดยอด → ลดเรท → อั้นเต็ม
    const calculated: typeof previewRules = []
    for (const r of rates) {
      const fullThreshold = Math.floor(maxLossNum / r.rate)
      // ⭐ 8 ระดับขั้นบันได — กระจายการลดเรท 6 ขั้น
      // ระดับ 1: จำกัดยอดต่อคน — ที่ 40%
      calculated.push({
        betType: r.betType, rate: r.rate, // code เช่น 3TOP, 2TOP
        threshold: Math.floor(fullThreshold * 0.4),
        action: 'max_amount', reducedRate: 0,
        label: 'จำกัดยอด (40%)',
      })
      // ระดับ 2: ลดเรท 10% — ที่ 50%
      calculated.push({
        betType: r.betType, rate: r.rate, // code เช่น 3TOP, 2TOP
        threshold: Math.floor(fullThreshold * 0.5),
        action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.9),
        label: 'ลดเรท 10% (50%)',
      })
      // ระดับ 3: ลดเรท 20% — ที่ 60%
      calculated.push({
        betType: r.betType, rate: r.rate, // code เช่น 3TOP, 2TOP
        threshold: Math.floor(fullThreshold * 0.6),
        action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.8),
        label: 'ลดเรท 20% (60%)',
      })
      // ระดับ 4: ลดเรท 35% — ที่ 70%
      calculated.push({
        betType: r.betType, rate: r.rate, // code เช่น 3TOP, 2TOP
        threshold: Math.floor(fullThreshold * 0.7),
        action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.65),
        label: 'ลดเรท 35% (70%)',
      })
      // ระดับ 5: ลดเรท 50% — ที่ 80%
      calculated.push({
        betType: r.betType, rate: r.rate, // code เช่น 3TOP, 2TOP
        threshold: Math.floor(fullThreshold * 0.8),
        action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.5),
        label: 'ลดเรท 50% (80%)',
      })
      // ระดับ 6: ลดเรท 65% — ที่ 88%
      calculated.push({
        betType: r.betType, rate: r.rate, // code เช่น 3TOP, 2TOP
        threshold: Math.floor(fullThreshold * 0.88),
        action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.35),
        label: 'ลดเรท 65% (88%)',
      })
      // ระดับ 7: ลดเรท 80% — ที่ 95%
      calculated.push({
        betType: r.betType, rate: r.rate, // code เช่น 3TOP, 2TOP
        threshold: Math.floor(fullThreshold * 0.95),
        action: 'reduce_rate', reducedRate: Math.floor(r.rate * 0.2),
        label: 'ลดเรท 80% (95%)',
      })
      // ระดับ 8: อั้นเต็ม — ที่ 100%
      calculated.push({
        betType: r.betType, rate: r.rate, // code เช่น 3TOP, 2TOP
        threshold: fullThreshold,
        action: 'full_ban', reducedRate: 0,
        label: 'อั้นเต็ม (100%)',
      })
    }

    setPreviewRules(calculated)
    setShowPreview(true)
  }, [selectedType, maxLoss])

  // ⭐ ยืนยัน — สร้างกฎอั้นทั้งหมด ผ่าน API (เก็บ DB)
  const handleApplyCalculated = useCallback(async () => {
    if (!selectedType || previewRules.length === 0) return
    setSaving(true)
    try {
      await autoBanApi.bulkCreate({
        lottery_type_id: selectedType.id,
        capital: Number(capital) || 0,
        max_loss: Number(maxLoss) || 0,
        rules: previewRules.map(pr => ({
          bet_type: pr.betType,
          threshold_amount: pr.threshold,
          action: pr.action,
          rate: pr.rate,
          reduced_rate: pr.reducedRate,
        })),
      })
      setShowPreview(false)
      setPreviewRules([])
      saveCapitalToStorage(capital, maxLoss)
      await loadRules()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }, [selectedType, previewRules, capital, maxLoss, loadRules])

  // เพิ่มกฎ (manual) — ผ่าน API
  const handleAdd = useCallback(async () => {
    if (!selectedType || !form.threshold_amount) return
    try {
      await autoBanApi.create({
        agent_id: 1,
        lottery_type_id: selectedType.id,
        bet_type: form.bet_type,
        threshold_amount: Number(form.threshold_amount),
        action: form.action,
        reduced_rate: form.action === 'reduce_rate' ? Number(form.reduce_rate_to) : 0,
      })
      setShowModal(false)
      setForm({ bet_type: '3 ตัวบน', threshold_amount: '', action: 'full_ban', reduce_rate_to: '', max_per_person: '' })
      await loadRules()
    } catch { /* ignore */ }
  }, [selectedType, form, loadRules])

  // ลบกฎ — ใช้ ConfirmDialog
  const handleDelete = useCallback((ruleId: number) => {
    const rule = currentRules.find(r => r.id === ruleId)
    setDialog({
      title: 'ลบกฎอั้น',
      message: `ลบกฎ ${getBetTypeLabel(rule?.bet_type || '')} (threshold ${fmtMoney(rule?.threshold_amount || 0)})?`,
      type: 'warning',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        setDialog(null)
        try {
          await autoBanApi.delete(ruleId)
          await loadRules()
        } catch { /* ignore */ }
      },
      onCancel: () => setDialog(null),
    })
  }, [currentRules, loadRules])

  // เคลียร์กฎทั้งหมดของประเภทหวยที่เลือก — ใช้ ConfirmDialog
  const handleClearAll = useCallback(() => {
    if (!selectedType || currentRules.length === 0) return
    setDialog({
      title: 'เคลียร์กฎทั้งหมด',
      message: `ลบกฎอั้นอัตโนมัติทั้งหมดของ ${selectedType.name} (${currentRules.length} กฎ)?\n\nสามารถคำนวณใหม่ได้ตลอด`,
      type: 'danger',
      confirmLabel: 'เคลียร์ทั้งหมด',
      onConfirm: async () => {
        setDialog(null)
        try {
          await Promise.all(currentRules.map(r => autoBanApi.delete(r.id)))
          await loadRules()
        } catch { /* ignore */ }
      },
      onCancel: () => setDialog(null),
    })
  }, [selectedType, currentRules, loadRules])

  // แก้ไขกฎ — ผ่าน API
  const handleEdit = useCallback(async () => {
    if (!editingRule) return
    try {
      await autoBanApi.update(editingRule.id, {
        threshold_amount: editingRule.threshold_amount,
        action: editingRule.action,
        reduced_rate: editingRule.reduced_rate,
      })
      setEditingRule(null)
      await loadRules()
    } catch { /* ignore */ }
  }, [editingRule, loadRules])

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
                <button onClick={handleApplyCalculated} disabled={saving} className="btn btn-primary text-xs disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : '✅ ใช้กฎเหล่านี้'}
                </button>
              </div>
            </div>
            {/* จัดกลุ่มตาม bet type */}
            {(() => {
              const grouped: Record<string, typeof previewRules> = {}
              previewRules.forEach(pr => {
                if (!grouped[pr.betType]) grouped[pr.betType] = []
                grouped[pr.betType].push(pr)
              })
              return Object.entries(grouped).map(([betType, levels]) => (
                <div key={betType} className="rounded-lg p-3 mb-2" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">{betType}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">rate x{levels[0]?.rate}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {levels.map((lv, i) => {
                      const ac = actionConfig[lv.action] || actionConfig.full_ban
                      return (
                        <div key={i} className="rounded-md p-2 text-center" style={{ background: 'var(--bg-secondary)' }}>
                          <div className="text-[10px] mb-1">
                            <span className={`badge ${ac.cls}`} style={{ fontSize: '9px', padding: '1px 6px' }}>{ac.icon} {ac.label}</span>
                          </div>
                          <div className="text-sm font-bold text-yellow-400">{fmtMoney(lv.threshold)}</div>
                          {lv.action === 'reduce_rate' && lv.reducedRate > 0 && (
                            <div className="text-[9px] text-[var(--text-tertiary)]">เรท x{lv.reducedRate}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            })()}
            <div className="mt-2 text-[11px] text-[var(--text-tertiary)]">
              💡 8 ระดับขั้นบันได: จำกัดยอด → ลดเรท 10%→20%→35%→50%→65%→80% → อั้นเต็ม (กระจายการลดเรท 6 ขั้น)
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
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-tertiary)]">{currentRules.length} กฎ</span>
              {currentRules.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
                >
                  🗑️ เคลียร์ทั้งหมด
                </button>
              )}
            </div>
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
            /* ⭐ จัดกลุ่มตาม bet type — แสดง 3 ระดับในแถวเดียว อ่านง่าย */
            <div className="divide-y divide-[var(--border-color)]">
              {(() => {
                // จัดกลุ่ม rules ตาม bet_type
                const grouped: Record<string, typeof currentRules> = {}
                currentRules.forEach(r => {
                  if (!grouped[r.bet_type]) grouped[r.bet_type] = []
                  grouped[r.bet_type].push(r)
                })
                // เรียงตาม action: max_amount → reduce_rate → full_ban
                const actionOrder: Record<string, number> = { max_amount: 0, reduce_rate: 1, full_ban: 2 }

                return Object.entries(grouped).map(([betType, rules]) => {
                  const sorted = [...rules].sort((a, b) => a.threshold_amount - b.threshold_amount)
                  const rate = sorted[0]?.rate || 0
                  const maxThreshold = sorted[sorted.length - 1]?.threshold_amount || 1

                  return (
                    <div key={betType} className="p-4">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-bold text-sm">{getBetTypeLabel(betType)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                          rate x{rate}
                        </span>
                        <span className="flex-1" />
                        <span className="text-[10px] text-[var(--text-tertiary)]">{sorted.length} ระดับ</span>
                      </div>

                      {/* ⭐ Progress bar แนวนอน — แสดงขั้นบันได */}
                      <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-tertiary)', height: '48px' }}>
                        {/* แถบสี gradient */}
                        <div className="absolute inset-0 flex">
                          {sorted.map((r, i) => {
                            const width = i === 0
                              ? (r.threshold_amount / maxThreshold) * 100
                              : ((r.threshold_amount - sorted[i - 1].threshold_amount) / maxThreshold) * 100
                            const bgColor = r.action === 'full_ban' ? '#ef4444'
                              : r.action === 'max_amount' ? '#3b82f6'
                              : `rgba(245,166,35,${0.4 + (i / sorted.length) * 0.6})`
                            return (
                              <div
                                key={r.id}
                                className="h-full flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
                                style={{ width: `${width}%`, background: bgColor, minWidth: '30px' }}
                                onClick={() => setEditingRule({ ...r })}
                                title={`${r.action === 'full_ban' ? 'อั้นเต็ม' : r.action === 'max_amount' ? 'จำกัดยอด' : `ลดเรท x${r.reduced_rate}`} — ${fmtMoney(r.threshold_amount)}`}
                              >
                                <span className="text-white text-[9px] font-bold truncate px-1">
                                  {r.action === 'full_ban' ? '🚫' : r.action === 'max_amount' ? '📊' : `x${r.reduced_rate}`}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Labels ด้านล่าง */}
                      <div className="flex mt-1.5">
                        {sorted.map((r, i) => {
                          const width = i === 0
                            ? (r.threshold_amount / maxThreshold) * 100
                            : ((r.threshold_amount - sorted[i - 1].threshold_amount) / maxThreshold) * 100
                          return (
                            <div key={r.id} className="text-center" style={{ width: `${width}%`, minWidth: '30px' }}>
                              <div className="text-[9px] font-mono font-bold text-yellow-400 truncate">
                                {fmtMoney(r.threshold_amount)}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-4 mt-2 text-[9px] text-[var(--text-tertiary)]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#3b82f6' }} /> จำกัดยอด</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#f5a623' }} /> ลดเรท</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#ef4444' }} /> อั้นเต็ม</span>
                        <span className="flex-1" />
                        <span>กดที่แถบเพื่อแก้ไข</span>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>
      )}

      {/* ⭐ คำอธิบายเมื่อมีกฎแล้ว — ตัวอย่างสอดคล้องกับ threshold จริง */}
      {selectedType && currentRules.length > 0 && (() => {
        // ดึง threshold จริงของ 3 ตัวบน (หรือ bet type แรก) มาทำตัวอย่าง
        const exRule = currentRules.find(r => r.bet_type === '3TOP') || currentRules[0]
        const th = Math.floor(exRule.threshold_amount)
        const betTypeName = getBetTypeLabel(exRule.bet_type)
        const rate = exRule.rate || 900

        // หา 3 ระดับของ bet type นี้
        const rulesForType = currentRules.filter(r => r.bet_type === exRule.bet_type)
        // หาระดับต่างๆ เรียงตาม threshold
        const sortedRules = [...rulesForType].sort((a, b) => a.threshold_amount - b.threshold_amount)
        const maxAmountRule = sortedRules.find(r => r.action === 'max_amount')
        const reduceRateRules = sortedRules.filter(r => r.action === 'reduce_rate')
        const fullBanRule = sortedRules.find(r => r.action === 'full_ban')

        const thMax = maxAmountRule?.threshold_amount || Math.floor(th * 0.5)
        const thBan = fullBanRule?.threshold_amount || th

        return (
          <div className="card-surface p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💡</span>
              <h3 className="text-sm font-bold">กฎเหล่านี้ทำงานยังไง?</h3>
            </div>
            <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-3">
              {/* ตัวอย่าง bet type */}
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="font-bold text-[var(--text-primary)] mb-1">📌 สถานการณ์ตัวอย่าง — {betTypeName} (rate x{rate})</div>
                สมมติลูกค้าหลายคนแทง {betTypeName} เลข <span className="font-mono text-yellow-400">847</span> ในรอบเดียวกัน ระบบจะเช็คยอดรวมของเลขนั้น
              </div>

              {/* ระดับ 1: จำกัดยอด */}
              <div className="rounded-lg p-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div className="font-bold mb-1" style={{ color: '#3b82f6' }}>📊 ระดับ 1 — จำกัดยอด (threshold {fmtMoney(thMax)})</div>
                <div className="mt-1">
                  เมื่อยอดรวมต่อเลขถึง <span className="font-bold text-yellow-400">{fmtMoney(thMax)}</span>
                  → <span className="font-bold" style={{ color: '#3b82f6' }}>จำกัดยอดแทงต่อคน</span> ป้องกันไม่ให้คนเดียวแทงเยอะเกินไป
                </div>
              </div>

              {/* ระดับ 2-4: ลดเรทแบบขั้นบันได */}
              <div className="rounded-lg p-3" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)' }}>
                <div className="font-bold mb-1" style={{ color: '#f5a623' }}>📉 ระดับ 2-7 — ลดเรทแบบขั้นบันได (6 ขั้น)</div>
                <div className="mt-1 mb-2">ยังรับแทงอยู่ แต่ค่อยๆ ลดอัตราจ่าย → ลดความเสี่ยงทีละขั้น</div>
                <div className="grid grid-cols-1 gap-1.5">
                  {reduceRateRules.map((rr, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md px-3 py-1.5" style={{ background: 'rgba(245,166,35,0.08)' }}>
                      <span style={{ color: '#f5a623' }}>→</span>
                      <span>ยอดรวมถึง <span className="font-bold text-yellow-400">{fmtMoney(rr.threshold_amount)}</span></span>
                      <span className="flex-1" />
                      <span className="font-bold" style={{ color: '#f5a623' }}>ลดเรทเหลือ x{rr.reduced_rate}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">(จากเดิม x{rate})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ระดับ 5: อั้นเต็ม */}
              <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="font-bold mb-1" style={{ color: '#ef4444' }}>🚫 ระดับ 8 — อั้นเต็ม (threshold {fmtMoney(thBan)})</div>
                <div className="mt-1">
                  เมื่อยอดรวมต่อเลขถึง <span className="font-bold text-yellow-400">{fmtMoney(thBan)}</span>
                  → <span className="font-bold" style={{ color: '#ef4444' }}>ปิดรับเลขนั้นเลย</span> ใครแทงมาจะถูก reject ทันที
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-1">จ่ายสูงสุด {fmtMoney(thBan)} × {rate} = <span className="font-bold text-yellow-400">{fmtMoney(thBan * rate)}</span></div>
                </div>
              </div>

              {/* สรุปขั้นบันได */}
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="font-bold text-[var(--text-primary)] mb-2">🛡️ สรุป — 8 ขั้นบันไดปกป้อง</div>
                <div className="space-y-1">
                  <div>ยอดรวม &lt; {fmtMoney(thMax)} → <span className="text-green-400 font-bold">ปกติ</span> (รับแทงเต็ม rate x{rate})</div>
                  <div>ยอดรวม &gt; {fmtMoney(thMax)} → <span className="font-bold" style={{ color: '#3b82f6' }}>จำกัดยอดต่อคน</span></div>
                  {reduceRateRules.map((rr, i) => (
                    <div key={i}>ยอดรวม &gt; {fmtMoney(rr.threshold_amount)} → <span className="font-bold" style={{ color: '#f5a623' }}>ลดเรท x{rate} → x{rr.reduced_rate}</span></div>
                  ))}
                  <div>ยอดรวม &gt; {fmtMoney(thBan)} → <span className="font-bold" style={{ color: '#ef4444' }}>ปิดรับ!</span></div>
                </div>
                <div className="mt-2 text-[10px] text-[var(--text-tertiary)]">
                  💡 ระบบตรวจอัตโนมัติทุกครั้งที่มีคนแทง ค่อยๆ ลดเรทลง → ไม่ขาดทุนเกินที่ตั้งไว้
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Edit Rule Modal ────────────────────────────────────────────────── */}
      {editingRule && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-6">
          <div className="card-surface p-6 max-w-md w-full rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold">แก้ไขกฎอั้น — {getBetTypeLabel(editingRule.bet_type)}</h3>
              <button onClick={() => setEditingRule(null)} className="btn btn-ghost text-lg">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">Threshold (฿)</label>
                <input
                  type="number"
                  value={editingRule.threshold_amount}
                  onChange={e => setEditingRule({ ...editingRule, threshold_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(actionConfig).filter(([k]) => k !== 'max_amount').map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setEditingRule({ ...editingRule, action: key })}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                        editingRule.action === key ? 'text-white shadow-md' : 'text-[var(--text-secondary)]'
                      }`}
                      style={{ background: editingRule.action === key ? 'var(--accent-primary)' : 'var(--bg-tertiary)' }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {editingRule.action === 'reduce_rate' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">ลดเรทเหลือ (x)</label>
                  <input
                    type="number"
                    value={editingRule.reduced_rate}
                    onChange={e => setEditingRule({ ...editingRule, reduced_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    placeholder="500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingRule(null)} className="btn btn-ghost flex-1">ยกเลิก</button>
              <button onClick={handleEdit} className="btn btn-primary flex-1">บันทึก</button>
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
      {/* ConfirmDialog */}
      {dialog && <ConfirmDialog {...dialog} />}
    </div>
  )
}
