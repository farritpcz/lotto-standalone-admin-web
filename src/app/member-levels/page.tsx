/**
 * Admin — ระบบ Level สมาชิก (v3 — 2026-04-20 redesign)
 *
 * Design: **Ladder + Mini Distribution Chart**
 *   - ด้านบน: กราฟแท่งแนวนอน แสดงสัดส่วนสมาชิกแต่ละระดับ (quick insight)
 *   - กลาง: Ladder — เรียงจากสูง → ต่ำ + gap visualizer ระหว่าง tier
 *   - Tier card: ชื่อ + badge + threshold + member count + edit/delete inline
 *   - Modal สร้าง/แก้ไข: ฟอร์มเรียบง่าย (name, color, icon, min_deposit_30d, description)
 *
 * ⭐ v3 Changes:
 *   - ตัด commission/cashback/bonus/max_withdraw/min_bets ออก (ไม่มี logic ผูกจริง)
 *   - ใช้ `min_deposit_30d` เดียว — ระบบคิดจากยอดฝาก rolling 30 วัน
 *   - เพิ่ม help panel อธิบาย rolling window ให้ admin เข้าใจ
 *   - API response เปลี่ยน: `{levels: [...], unassigned: number}`
 *
 * Related:
 *   - admin-api: internal/handler/member_levels.go
 *   - Rule:      docs/rules/member_levels_ui.md
 */
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { memberLevelApi, type MemberLevel } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Plus, Pencil, Trash2, Users, Info, Calendar, TrendingUp } from 'lucide-react'

// ─── Utils ────────────────────────────────────────────────────────────
const fmtMoney = (n: number) =>
  `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

// ─── Form State ───────────────────────────────────────────────────────
const emptyForm = {
  name: '', color: '#FFD700', icon: '', sort_order: 0,
  min_deposit_30d: 0, description: '',
}

type FormState = typeof emptyForm

export default function MemberLevelsPage() {
  // ─── State ──────────────────────────────────────────────────────────
  const [levels, setLevels] = useState<MemberLevel[]>([])
  const [unassigned, setUnassigned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [mode, setMode] = useState<'create' | 'edit' | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)
  const { toast } = useToast()

  // ─── Load ───────────────────────────────────────────────────────────
  const loadLevels = useCallback(() => {
    setLoading(true)
    memberLevelApi.list()
      .then(res => {
        // ⭐ v3 response: { data: { levels: [...], unassigned: N } }
        const payload = (res.data as { data?: { levels?: MemberLevel[]; unassigned?: number } })?.data
        setLevels(payload?.levels || [])
        setUnassigned(payload?.unassigned || 0)
      })
      .catch(() => toast.error('โหลดข้อมูล Level ไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => { loadLevels() }, [loadLevels])

  // ─── Derived: sorted ascending + descending ────────────────────────
  // Ladder แสดงจากสูง→ต่ำ (sort_order DESC)
  const ladder = useMemo(
    () => [...levels].sort((a, b) => b.sort_order - a.sort_order),
    [levels]
  )
  // Distribution ใช้ sort_order ASC (ต่ำ→สูง — เริ่มจาก Bronze)
  const sortedAsc = useMemo(
    () => [...levels].sort((a, b) => a.sort_order - b.sort_order),
    [levels]
  )
  // Total members (รวม unassigned) เพื่อคิด %
  const totalMembers = useMemo(
    () => levels.reduce((s, lv) => s + lv.member_count, 0) + unassigned,
    [levels, unassigned]
  )

  // ─── Handlers ───────────────────────────────────────────────────────
  const openCreate = () => {
    setForm({ ...emptyForm, sort_order: levels.length })
    setEditId(null)
    setMode('create')
  }

  const openEdit = (lv: MemberLevel) => {
    setForm({
      name: lv.name,
      color: lv.color,
      icon: lv.icon || '',
      sort_order: lv.sort_order,
      min_deposit_30d: lv.min_deposit_30d,
      description: lv.description || '',
    })
    setEditId(lv.id)
    setMode('edit')
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('กรุณากรอกชื่อ Level'); return }
    setSaving(true)
    try {
      if (mode === 'create') {
        await memberLevelApi.create(form)
        toast.success('สร้างระดับสำเร็จ')
      } else if (editId) {
        await memberLevelApi.update(editId, form)
        toast.success('แก้ไขระดับสำเร็จ')
      }
      setMode(null)
      loadLevels()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'บันทึกไม่สำเร็จ'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (lv: MemberLevel) => {
    setDialog({
      title: `ลบระดับ "${lv.name}"`,
      message: lv.member_count > 0
        ? `⚠️ มีสมาชิก ${lv.member_count} คนอยู่ในระดับนี้ — ไม่สามารถลบได้`
        : `ยืนยันลบระดับ "${lv.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      type: 'danger',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        try {
          await memberLevelApi.delete(lv.id)
          toast.success(`ลบระดับ "${lv.name}" แล้ว`)
          loadLevels()
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'ลบไม่สำเร็จ'
          toast.error(msg)
        }
        setDialog(null)
      },
      onCancel: () => setDialog(null),
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ═══ Header ═══ */}
      <div className="page-header">
        <div>
          <h1>ระบบระดับสมาชิก</h1>
          <p className="label" style={{ marginTop: 4 }}>
            จัดระดับสมาชิกตามยอดฝากสะสม 30 วันล่าสุด (badge/icon)
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ gap: 6 }}>
          <Plus size={16} /> เพิ่มระดับ
        </button>
      </div>

      {/* ═══ Info Panel — อธิบายกฎ rolling 30d ═══ */}
      <div
        className="card-surface"
        style={{
          padding: 16, marginBottom: 16,
          background: 'linear-gradient(135deg, var(--accent-bg), transparent)',
          border: '1px solid var(--accent-border, var(--border))',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Info size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              ระบบเลื่อนระดับอัตโนมัติ
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} /> ตรวจสอบทุกวัน 02:00 น. (Asia/Bangkok)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={14} /> คิดจากยอดฝาก 30 วันล่าสุด
              </span>
            </div>
            <div style={{ marginTop: 6, fontSize: 12 }}>
              สมาชิกเลื่อนขึ้นอัตโนมัติเมื่อยอดฝาก 30 วันถึงเกณฑ์ —
              และ <strong>ตกลงอัตโนมัติ</strong> หากยอดฝากลดลงต่ำกว่าเกณฑ์ของระดับปัจจุบัน
              (ยกเว้นสมาชิกที่ถูกแอดมินล็อกไว้ — ดูในหน้ารายละเอียดสมาชิก)
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading inline text="กำลังโหลด..." />
      ) : levels.length === 0 ? (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          ยังไม่มีระดับสมาชิก — กด &quot;เพิ่มระดับ&quot; เพื่อเริ่มต้น
        </div>
      ) : (
        <>
          {/* ═══ Mini Distribution Chart ═══ */}
          <div className="card-surface" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 14,
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                การกระจายตัวของสมาชิก
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                รวม {totalMembers.toLocaleString('th-TH')} คน
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedAsc.map(lv => {
                const pct = totalMembers > 0 ? (lv.member_count / totalMembers) * 100 : 0
                return (
                  <DistributionBar
                    key={lv.id}
                    name={lv.name}
                    color={lv.color}
                    count={lv.member_count}
                    pct={pct}
                  />
                )
              })}

              {/* Unassigned */}
              {unassigned > 0 && (
                <DistributionBar
                  name="ยังไม่ได้จัดระดับ"
                  color="#6b7280"
                  count={unassigned}
                  pct={totalMembers > 0 ? (unassigned / totalMembers) * 100 : 0}
                  muted
                />
              )}
            </div>
          </div>

          {/* ═══ Ladder — Tier cards (สูง → ต่ำ) ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
            {ladder.map((lv, idx) => {
              // หา tier ล่างถัดไปเพื่อคำนวณ gap
              const below = idx + 1 < ladder.length ? ladder[idx + 1] : null
              const gap = below ? lv.min_deposit_30d - below.min_deposit_30d : 0

              return (
                <div key={lv.id}>
                  {/* Tier card */}
                  <TierCard
                    level={lv}
                    onEdit={() => openEdit(lv)}
                    onDelete={() => confirmDelete(lv)}
                  />

                  {/* Gap indicator ระหว่าง tier */}
                  {below && gap > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 0',
                        position: 'relative',
                      }}
                    >
                      <div style={{
                        width: 2, height: 18,
                        background: 'linear-gradient(to bottom, var(--border), transparent)',
                        position: 'absolute', left: 32, top: 0,
                      }} />
                      <div style={{
                        fontSize: 11, color: 'var(--text-tertiary)',
                        fontFamily: 'var(--font-mono, monospace)',
                        padding: '2px 10px',
                        background: 'var(--bg-secondary, var(--border))',
                        borderRadius: 10,
                        marginLeft: 60,
                      }}>
                        ↓ gap {fmtMoney(gap)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ═══ Modal: Create/Edit ═══ */}
      {mode && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={() => setMode(null)}
        >
          <div
            className="card-surface"
            style={{ padding: 24, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                {mode === 'create' ? 'เพิ่มระดับสมาชิก' : `แก้ไข "${form.name}"`}
              </h2>
              <button onClick={() => setMode(null)} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
            </div>

            {/* Live Preview Badge */}
            <div style={{
              padding: 12, marginBottom: 16,
              background: 'var(--bg-secondary, var(--border))',
              borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: form.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: '#000', fontSize: 20,
                boxShadow: `0 4px 14px ${form.color}66`,
              }}>
                {(form.name[0] || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: form.color }}>
                  {form.name || 'ชื่อระดับ'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  ฝากสะสม 30 วัน ≥ {fmtMoney(form.min_deposit_30d)}
                </div>
              </div>
              <span className="label" style={{ fontSize: 10 }}>PREVIEW</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name + Color */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>ชื่อระดับ *</div>
                  <input className="input" placeholder="Gold" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>สี</div>
                  <input type="color" className="input" value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    style={{ padding: 2, height: 36 }} />
                </div>
              </div>

              {/* Icon (optional — Lucide name) */}
              <div>
                <div className="label" style={{ marginBottom: 4 }}>
                  ไอคอน (Lucide icon name — optional)
                </div>
                <input className="input" placeholder="crown / gem / medal / shield"
                  value={form.icon}
                  onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
              </div>

              {/* ⭐ เกณฑ์เดียว: min_deposit_30d */}
              <div>
                <div className="label" style={{ marginBottom: 4 }}>
                  ยอดฝากขั้นต่ำ (บาท) — สะสม 30 วันล่าสุด
                </div>
                <input type="number" className="input" placeholder="100000"
                  value={form.min_deposit_30d || ''}
                  onChange={e => setForm(f => ({ ...f, min_deposit_30d: Number(e.target.value) }))} />
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  สมาชิกจะเลื่อนเข้าระดับนี้เมื่อยอดฝากรวม 30 วันล่าสุด ≥ ค่านี้
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="label" style={{ marginBottom: 4 }}>คำอธิบาย (optional)</div>
                <textarea className="input" rows={2}
                  placeholder="ระดับพิเศษสำหรับสมาชิก VIP..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ height: 'auto', padding: '8px 12px' }} />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setMode(null)} className="btn btn-secondary" style={{ flex: 1 }} disabled={saving}>
                ยกเลิก
              </button>
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog && <ConfirmDialog {...dialog} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════════

// ─── TierCard — card ใน ladder ─────────────────────────────────────────
function TierCard({
  level, onEdit, onDelete,
}: {
  level: MemberLevel
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="card-surface"
      style={{
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderLeft: `4px solid ${level.color}`,
      }}
    >
      {/* Badge */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: level.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: '#000', fontSize: 22,
        boxShadow: `0 4px 16px ${level.color}55`,
        flexShrink: 0,
      }}>
        {level.name[0]}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: level.color }}>
            {level.name}
          </span>
          <span className={`badge ${level.status === 'active' ? 'badge-success' : 'badge-error'}`}>
            {level.status === 'active' ? 'เปิดใช้' : 'ปิด'}
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          ฝากสะสม 30 วัน ≥ <strong style={{ color: 'var(--text-primary)' }}>
            ฿{level.min_deposit_30d.toLocaleString('th-TH')}
          </strong>
        </div>
        {level.description && (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {level.description}
          </div>
        )}
      </div>

      {/* Member count */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: 4,
        minWidth: 80,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <Users size={12} /> สมาชิก
        </span>
        <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {level.member_count.toLocaleString('th-TH')}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={onEdit} className="btn btn-ghost"
          style={{ width: 36, height: 36, padding: 0 }} title="แก้ไข">
          <Pencil size={15} />
        </button>
        <button onClick={onDelete} className="btn btn-danger"
          style={{ width: 36, height: 36, padding: 0 }} title="ลบ">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── DistributionBar — แท่งแนวนอนสำหรับ distribution chart ─────────────
function DistributionBar({
  name, color, count, pct, muted,
}: {
  name: string
  color: string
  count: number
  pct: number
  muted?: boolean
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '100px 1fr 90px',
      alignItems: 'center',
      gap: 10,
      opacity: muted ? 0.65 : 1,
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
        {name}
      </span>
      <div style={{
        height: 18,
        background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
        borderRadius: 9,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
          height: '100%',
          background: color,
          borderRadius: 9,
          transition: 'width 400ms ease',
        }} />
      </div>
      <span className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
        {count.toLocaleString('th-TH')} ({pct.toFixed(1)}%)
      </span>
    </div>
  )
}
