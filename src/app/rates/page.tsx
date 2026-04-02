/**
 * Admin — จัดการอัตราจ่าย (Pay Rates)
 * Linear/Vercel dark theme
 *
 * Flow:
 *  1. เลือกประเภทหวยจาก dropdown
 *  2. แสดง rates ของหวยนั้น → แก้ไข rate + max bet ได้
 *  3. กด "บันทึก" → save ทุก rate ที่แก้ไข
 *
 * ⭐ ไม่ auto-save ตอนแก้ input — ต้องกดบันทึกเท่านั้น
 */
'use client'

import { useEffect, useState } from 'react'
import { rateMgmtApi, lotteryMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'

/* ── Types ────────────────────────────────────────────────────────────────── */
interface LotteryType { id: number; name: string; code: string }
interface Rate {
  id: number; rate: number; max_bet_per_number: number
  bet_type?: { name: string; code: string }
  lottery_type?: { name: string }
}

/* จำนวนรายการต่อหน้า */
const PER_PAGE = 20

export default function RatesPage() {
  /* ── State ──────────────────────────────────────────────────────────────── */
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [selectedLottery, setSelectedLottery] = useState<number | null>(null)
  const [rates, setRates] = useState<Rate[]>([])          // ข้อมูลจาก API (original)
  const [editRates, setEditRates] = useState<Rate[]>([])   // ข้อมูลที่แก้ไข (draft)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  /* ── โหลดประเภทหวย ─────────────────────────────────────────────────────── */
  useEffect(() => {
    lotteryMgmtApi.list()
      .then(res => {
        const types = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.items || [])
        setLotteryTypes(types)
        // เลือกอันแรกอัตโนมัติ
        if (types.length > 0) setSelectedLottery(types[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* ── โหลด rates เมื่อเปลี่ยนประเภทหวย ─────────────────────────────────── */
  useEffect(() => {
    if (!selectedLottery) return
    setLoading(true)
    setMessage('')
    rateMgmtApi.list({ lottery_type_id: selectedLottery, page, per_page: PER_PAGE })
      .then(res => {
        const data = res.data.data
        const items = Array.isArray(data) ? data : (data?.items || [])
        setRates(items)
        setEditRates(JSON.parse(JSON.stringify(items))) // deep copy สำหรับ draft
        setTotal(Array.isArray(data) ? data.length : (data?.total || 0))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedLottery, page])

  /* ── เช็คว่ามีการแก้ไขหรือไม่ ──────────────────────────────────────────── */
  const hasChanges = JSON.stringify(rates) !== JSON.stringify(editRates)

  /* ── บันทึกทุก rate ที่แก้ไข ────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    let savedCount = 0

    for (let i = 0; i < editRates.length; i++) {
      const orig = rates[i]
      const edit = editRates[i]
      // เช็คว่า rate นี้ถูกแก้ไข
      if (orig.rate !== edit.rate || orig.max_bet_per_number !== edit.max_bet_per_number) {
        try {
          await rateMgmtApi.update(edit.id, {
            rate: edit.rate,
            max_bet_per_number: edit.max_bet_per_number,
          })
          savedCount++
        } catch { /* skip failed */ }
      }
    }

    // อัพเดท original ให้ตรงกับ draft
    setRates(JSON.parse(JSON.stringify(editRates)))
    setMessage(savedCount > 0 ? `บันทึกสำเร็จ (${savedCount} รายการ)` : 'ไม่มีการเปลี่ยนแปลง')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  /* ── Reset กลับค่าเดิม ─────────────────────────────────────────────────── */
  const handleReset = () => {
    setEditRates(JSON.parse(JSON.stringify(rates)))
    setMessage('')
  }

  /* ── แก้ค่าใน draft ────────────────────────────────────────────────────── */
  const updateDraft = (id: number, field: 'rate' | 'max_bet_per_number', value: number) => {
    setEditRates(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1>จัดการอัตราจ่าย</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* ปุ่ม Reset */}
          {hasChanges && (
            <button onClick={handleReset} className="btn btn-ghost" style={{ fontSize: 12 }}>
              ↩ รีเซ็ต
            </button>
          )}
          {/* ปุ่มบันทึก — แสดงเฉพาะเมื่อมีการแก้ไข */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="btn btn-primary"
            style={{ opacity: hasChanges ? 1 : 0.4 }}
          >
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกการเปลี่ยนแปลง'}
          </button>
        </div>
      </div>

      {/* ── Message ─────────────────────────────────────────────────────── */}
      {message && (
        <div style={{
          background: message.includes('สำเร็จ') ? 'var(--status-success-bg)' : 'var(--bg-elevated)',
          color: message.includes('สำเร็จ') ? 'var(--status-success)' : 'var(--text-secondary)',
          borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {message.includes('สำเร็จ') ? '✓ ' : ''}{message}
        </div>
      )}

      {/* ── เลือกประเภทหวย (Tabs) ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {lotteryTypes.map(lt => (
          <button
            key={lt.id}
            onClick={() => { setSelectedLottery(lt.id); setPage(1) }}
            className={selectedLottery === lt.id ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 12 }}
          >
            {lt.name}
          </button>
        ))}
      </div>

      {/* ── ตาราง rates ────────────────────────────────────────────────── */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading inline text="กำลังโหลด..." />
        ) : editRates.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            {selectedLottery ? 'ไม่มีอัตราจ่ายสำหรับหวยนี้' : 'กรุณาเลือกประเภทหวย'}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ประเภทแทง</th>
                <th>Code</th>
                <th style={{ textAlign: 'right' }}>อัตราจ่าย (x)</th>
                <th style={{ textAlign: 'right' }}>Max/เลข (฿)</th>
                <th style={{ textAlign: 'center' }}>แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {editRates.map((r, idx) => {
                const orig = rates[idx]
                const rateChanged = orig && r.rate !== orig.rate
                const maxChanged = orig && r.max_bet_per_number !== orig.max_bet_per_number
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.bet_type?.name || '—'}</td>
                    <td className="mono secondary" style={{ fontSize: 12 }}>{r.bet_type?.code || '—'}</td>

                    {/* Rate — แก้ไขได้ แต่ไม่ auto-save */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        value={r.rate}
                        onChange={e => updateDraft(r.id, 'rate', Number(e.target.value))}
                        className="input"
                        style={{
                          width: 100, textAlign: 'right',
                          fontFamily: 'var(--font-mono)', fontWeight: 600,
                          color: rateChanged ? 'var(--accent)' : 'var(--text-primary)',
                          borderColor: rateChanged ? 'var(--accent)' : undefined,
                        }}
                      />
                    </td>

                    {/* Max bet per number */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        value={r.max_bet_per_number}
                        onChange={e => updateDraft(r.id, 'max_bet_per_number', Number(e.target.value))}
                        className="input"
                        placeholder="0 = ไม่จำกัด"
                        style={{
                          width: 100, textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: maxChanged ? 'var(--accent)' : 'var(--text-secondary)',
                          borderColor: maxChanged ? 'var(--accent)' : undefined,
                        }}
                      />
                    </td>

                    {/* สถานะแก้ไข */}
                    <td style={{ textAlign: 'center' }}>
                      {(rateChanged || maxChanged) && (
                        <span className="badge badge-warning" style={{ fontSize: 10 }}>แก้ไขแล้ว</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > PER_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, paddingBottom: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn btn-secondary">← ก่อนหน้า</button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {page} / {Math.ceil(total / PER_PAGE)}</span>
            <button onClick={() => setPage(p => p+1)} disabled={editRates.length < PER_PAGE} className="btn btn-secondary">ถัดไป →</button>
          </div>
        )}
      </div>
    </div>
  )
}
