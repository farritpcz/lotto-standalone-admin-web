/**
 * =============================================================================
 * Admin — จัดการประเภทหวย (Lottery Types)
 * =============================================================================
 *
 * ⭐ Redesign: Card Grid จัดกลุ่มตาม category
 *
 * Layout:
 *   - Search bar + stats summary ด้านบน
 *   - จัดกลุ่มตาม category (หวยไทย, ยี่กี, ลาว, ฮานอย, มาเลย์, หุ้น)
 *   - แต่ละ lottery เป็น compact card (icon + name + code + status toggle)
 *   - Category header collapsible (หุ้น 26 ตัว → ยุบได้)
 *   - Edit คลิกที่ card → modal
 *
 * API: lotteryMgmtApi.list(), .create(), .update()
 * =============================================================================
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { lotteryMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'
import { Search, ChevronDown, ChevronRight, Edit2, Power } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface LotteryType {
  id: number; name: string; code: string; category: string
  status: string; icon: string; description?: string
}

interface LotteryFormData {
  name: string; code: string; category: string; icon: string; description: string
}

// =============================================================================
// Constants
// =============================================================================

/** หมวดหมู่ — ใช้เป็น group headers + label mapping */
const CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: 'thai',   label: 'หวยไทย',      color: '#f5a623' },
  { key: 'yeekee', label: 'หวยยี่กี',    color: '#34d399' },
  { key: 'lao',    label: 'หวยลาว',      color: '#ef4444' },
  { key: 'hanoi',  label: 'หวยฮานอย',    color: '#ec4899' },
  { key: 'malay',  label: 'หวยมาเลย์',   color: '#14b8a6' },
  { key: 'stock',  label: 'หวยหุ้น',     color: '#3b82f6' },
]

const EMPTY_FORM: LotteryFormData = { name: '', code: '', category: 'thai', icon: '🎰', description: '' }

// =============================================================================
// Component
// =============================================================================

export default function LotteriesPage() {
  const [types, setTypes] = useState<LotteryType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<LotteryType | null>(null)
  const [form, setForm] = useState<LotteryFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  // ⭐ collapsible categories — stock ยุบได้ (26 ตัวเยอะมาก)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // ── Data fetching ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await lotteryMgmtApi.list()
      const data = res.data.data
      setTypes(Array.isArray(data) ? data : data?.items || [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Filtered + grouped ────────────────────────────────────────
  const filtered = search
    ? types.filter(t => t.name.includes(search) || t.code.toLowerCase().includes(search.toLowerCase()))
    : types

  // จัดกลุ่มตาม category
  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: filtered.filter(t => t.category === cat.key),
  })).filter(g => g.items.length > 0)

  // ── Stats ─────────────────────────────────────────────────────
  const totalActive = types.filter(t => t.status === 'active').length
  const totalInactive = types.length - totalActive

  // ── Modal handlers ────────────────────────────────────────────
  const openEdit = (lt: LotteryType) => {
    setEditing(lt)
    setForm({ name: lt.name, code: lt.code, category: lt.category, icon: lt.icon, description: lt.description || '' })
    setShowModal(true)
  }
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null) }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) return
    try {
      setSubmitting(true)
      if (editing) await lotteryMgmtApi.update(editing.id, form)
      else await lotteryMgmtApi.create(form)
      closeModal(); await loadData()
    } catch { /* silent */ } finally { setSubmitting(false) }
  }

  const toggleStatus = async (lt: LotteryType) => {
    try {
      await lotteryMgmtApi.update(lt.id, { status: lt.status === 'active' ? 'inactive' : 'active' })
      await loadData()
    } catch { /* silent */ }
  }

  const toggleCollapse = (key: string) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>ประเภทหวย</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {types.length} ประเภท — เปิด {totalActive} / ปิด {totalInactive}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ เพิ่มประเภท</button>
      </div>

      {/* ── Search ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 20, position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-tertiary)' }} />
        <input
          className="input" placeholder="ค้นหาชื่อหรือ code..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 36, height: 38 }}
        />
      </div>

      {/* ── Loading / Empty ─────────────────────────────────── */}
      {loading ? <Loading inline text="กำลังโหลด..." /> : grouped.length === 0 ? (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          {search ? `ไม่พบประเภทหวยที่ตรงกับ "${search}"` : 'ยังไม่มีประเภทหวย'}
        </div>
      ) : (
        /* ── Category Groups ────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {grouped.map(group => {
            const isCollapsed = collapsed[group.key]
            return (
              <div key={group.key} className="card-surface" style={{ overflow: 'hidden' }}>
                {/* ── Category Header (clickable → collapse) ── */}
                <div
                  onClick={() => toggleCollapse(group.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 16px', cursor: 'pointer',
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                    userSelect: 'none',
                  }}
                >
                  {/* สี accent ของ category */}
                  <div style={{
                    width: 4, height: 20, borderRadius: 2,
                    background: group.color, flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{group.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 8 }}>
                    {group.items.length} ประเภท
                  </span>
                  {isCollapsed
                    ? <ChevronRight size={16} color="var(--text-tertiary)" />
                    : <ChevronDown size={16} color="var(--text-tertiary)" />
                  }
                </div>

                {/* ── Cards Grid ───────────────────────────── */}
                {!isCollapsed && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 1,
                    background: 'var(--border)',
                  }}>
                    {group.items.map(lt => (
                      <div key={lt.id} style={{
                        background: 'var(--bg-surface)',
                        padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        transition: 'background 0.1s',
                      }}>
                        {/* Icon */}
                        <span style={{ fontSize: 24, flexShrink: 0, width: 32, textAlign: 'center' }}>
                          {lt.icon}
                        </span>

                        {/* Name + Code */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600,
                            color: lt.status === 'active' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {lt.name}
                          </div>
                          <div style={{
                            fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
                            color: 'var(--text-tertiary)', marginTop: 2,
                          }}>
                            {lt.code}
                          </div>
                        </div>

                        {/* Status dot */}
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: lt.status === 'active' ? '#34d399' : 'var(--text-tertiary)',
                          boxShadow: lt.status === 'active' ? '0 0 6px rgba(52,211,153,0.4)' : 'none',
                        }} title={lt.status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} />

                        {/* Edit button */}
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minWidth: 0 }}
                          onClick={() => openEdit(lt)}
                          title="แก้ไข"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Toggle button */}
                        <button
                          className="btn btn-ghost"
                          style={{
                            padding: '4px 6px', minWidth: 0,
                            color: lt.status === 'active' ? 'var(--status-error)' : 'var(--status-success)',
                          }}
                          onClick={() => toggleStatus(lt)}
                          title={lt.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Edit/Create Modal ───────────────────────────────── */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="card-surface" style={{
            width: '100%', maxWidth: 480, padding: 24,
            animation: 'fadeSlideUp 0.2s ease',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
              {editing ? 'แก้ไขประเภทหวย' : 'เพิ่มประเภทหวยใหม่'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* ชื่อ + Icon (inline) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12 }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>ชื่อประเภทหวย</label>
                  <input className="input" placeholder="เช่น หวยรัฐบาลไทย" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>ไอคอน</label>
                  <input className="input" style={{ textAlign: 'center', fontSize: 20 }} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
                </div>
              </div>

              {/* Code + Category (inline) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>รหัส (CODE)</label>
                  <input className="input" style={{ fontFamily: 'var(--font-mono, monospace)' }} placeholder="THAI_GOV" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>หมวดหมู่</label>
                  <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>รายละเอียด</label>
                <input className="input" placeholder="คำอธิบาย (ไม่บังคับ)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !form.name.trim() || !form.code.trim()}>
                {submitting ? 'กำลังบันทึก...' : editing ? 'บันทึก' : 'สร้าง'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
