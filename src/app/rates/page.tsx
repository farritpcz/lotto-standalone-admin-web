/**
 * Admin — จัดการอัตราจ่าย (Pay Rates)
 *
 * Flow:
 *  1. เลือกประเภทหวยจาก dropdown (จัดกลุ่มตาม category)
 *  2. แสดง rates ของหวยนั้น → แก้ไข rate + max bet inline
 *  3. กด "บันทึก" → save ทุก rate ที่แก้ไข
 *
 * ⭐ Redesign: dropdown optgroup + card-based rate editor
 */
'use client'

import { useEffect, useState } from 'react'
import { rateMgmtApi, lotteryMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'

/* ── Types ────────────────────────────────────────────────────────────────── */
interface LotteryType { id: number; name: string; code: string; category?: string }
interface Rate {
  id: number; rate: number; max_bet_per_number: number
  bet_type?: { name: string; code: string }
  lottery_type?: { name: string }
}

const CATEGORIES = [
  { key: 'thai', label: 'หวยไทย' }, { key: 'yeekee', label: 'ยี่กี' },
  { key: 'lao', label: 'หวยลาว' }, { key: 'hanoi', label: 'หวยฮานอย' },
  { key: 'malay', label: 'มาเลย์' }, { key: 'stock', label: 'หวยหุ้น' },
]

export default function RatesPage() {
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [selectedLottery, setSelectedLottery] = useState<number | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [rates, setRates] = useState<Rate[]>([])
  const [editRates, setEditRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // ── โหลดประเภทหวย ─────────────────────────────────────────
  useEffect(() => {
    lotteryMgmtApi.list()
      .then(res => {
        const types = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.items || [])
        setLotteryTypes(types)
        if (types.length > 0) { setSelectedLottery(types[0].id); setSelectedName(types[0].name) }
      })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  // ── โหลด rates เมื่อเปลี่ยนประเภทหวย ─────────────────────
  useEffect(() => {
    if (!selectedLottery) return
    setLoading(true); setMessage('')
    rateMgmtApi.list({ lottery_type_id: selectedLottery, per_page: 50 })
      .then(res => {
        const data = res.data.data
        const items = Array.isArray(data) ? data : (data?.items || [])
        setRates(items)
        setEditRates(JSON.parse(JSON.stringify(items)))
      })
      .catch(() => {}).finally(() => setLoading(false))
  }, [selectedLottery])

  const hasChanges = JSON.stringify(rates) !== JSON.stringify(editRates)

  const handleSave = async () => {
    setSaving(true); setMessage(''); let saved = 0
    for (let i = 0; i < editRates.length; i++) {
      const orig = rates[i]; const edit = editRates[i]
      if (orig && (orig.rate !== edit.rate || orig.max_bet_per_number !== edit.max_bet_per_number)) {
        try { await rateMgmtApi.update(edit.id, { rate: edit.rate, max_bet_per_number: edit.max_bet_per_number }); saved++ }
        catch { /* skip */ }
      }
    }
    setRates(JSON.parse(JSON.stringify(editRates)))
    setMessage(saved > 0 ? `บันทึกสำเร็จ ${saved} รายการ` : 'ไม่มีการเปลี่ยนแปลง')
    setSaving(false); setTimeout(() => setMessage(''), 3000)
  }

  const updateDraft = (id: number, field: 'rate' | 'max_bet_per_number', value: number) => {
    setEditRates(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>อัตราจ่าย</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {selectedName} — {editRates.length} ประเภทแทง
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasChanges && (
            <button onClick={() => { setEditRates(JSON.parse(JSON.stringify(rates))); setMessage('') }}
              className="btn btn-ghost" style={{ fontSize: 12 }}>รีเซ็ต</button>
          )}
          <button onClick={handleSave} disabled={!hasChanges || saving}
            className="btn btn-primary" style={{ opacity: hasChanges ? 1 : 0.4 }}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* ── Message ─────────────────────────────────────────── */}
      {message && (
        <div style={{
          background: message.includes('สำเร็จ') ? 'var(--status-success-bg)' : 'var(--bg-elevated)',
          color: message.includes('สำเร็จ') ? 'var(--status-success)' : 'var(--text-secondary)',
          borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {message.includes('สำเร็จ') ? '\u2713 ' : ''}{message}
        </div>
      )}

      {/* ── เลือกประเภทหวย (dropdown optgroup) ────────────── */}
      <div style={{ marginBottom: 20 }}>
        <select
          className="input"
          style={{ width: 'auto', minWidth: 280, height: 40, fontSize: 14, fontWeight: 600 }}
          value={selectedLottery || ''}
          onChange={e => {
            const id = Number(e.target.value)
            const lt = lotteryTypes.find(t => t.id === id)
            setSelectedLottery(id)
            setSelectedName(lt?.name || '')
          }}
        >
          {CATEGORIES.map(cat => {
            const items = lotteryTypes.filter(lt => lt.category === cat.key)
            if (items.length === 0) return null
            return (
              <optgroup key={cat.key} label={cat.label}>
                {items.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </optgroup>
            )
          })}
        </select>
      </div>

      {/* ── Rate Cards ─────────────────────────────────────── */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? <Loading inline text="กำลังโหลด..." /> : editRates.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ไม่มีอัตราจ่าย</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, background: 'var(--border)' }}>
            {editRates.map((r, idx) => {
              const orig = rates[idx]
              const rateChanged = orig && r.rate !== orig.rate
              const maxChanged = orig && r.max_bet_per_number !== orig.max_bet_per_number
              const changed = rateChanged || maxChanged
              return (
                <div key={r.id} style={{
                  background: changed ? 'color-mix(in srgb, var(--accent) 5%, var(--bg-surface))' : 'var(--bg-surface)',
                  padding: '14px 16px',
                }}>
                  {/* Bet type name + code */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.bet_type?.name || '—'}</div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-tertiary)' }}>{r.bet_type?.code}</div>
                    </div>
                    {changed && <span className="badge badge-warning" style={{ fontSize: 10 }}>แก้ไขแล้ว</span>}
                  </div>
                  {/* Rate + Max bet inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>อัตราจ่าย (x)</label>
                      <input type="number" value={r.rate} onChange={e => updateDraft(r.id, 'rate', Number(e.target.value))}
                        className="input" style={{
                          textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: 16,
                          color: rateChanged ? 'var(--accent)' : 'var(--text-primary)',
                          borderColor: rateChanged ? 'var(--accent)' : undefined,
                          height: 38,
                        }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Max/เลข (฿)</label>
                      <input type="number" value={r.max_bet_per_number} onChange={e => updateDraft(r.id, 'max_bet_per_number', Number(e.target.value))}
                        className="input" placeholder="0 = ไม่จำกัด" style={{
                          textAlign: 'right', fontFamily: 'var(--font-mono, monospace)',
                          color: maxChanged ? 'var(--accent)' : 'var(--text-secondary)',
                          borderColor: maxChanged ? 'var(--accent)' : undefined,
                          height: 38,
                        }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
