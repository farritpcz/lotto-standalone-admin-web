/**
 * Admin — ระบบ Level สมาชิก (v3 — 2026-04-20 redesign)
 *
 * Design: **Ladder + Mini Distribution Chart**
 *   - ด้านบน: กราฟแท่งแนวนอน แสดงสัดส่วนสมาชิกแต่ละระดับ (quick insight)
 *   - กลาง: Ladder — เรียงจากสูง → ต่ำ + gap visualizer ระหว่าง tier
 *   - Tier card: ชื่อ + badge + threshold + member count + edit/delete inline
 *   - Modal สร้าง/แก้ไข: ฟอร์มเรียบง่าย (name, color, icon, min_deposit_30d, description)
 *
 * ⭐ v3 Changes: ตัด commission/cashback/bonus/max_withdraw/min_bets ออก (ไม่มี logic ผูกจริง)
 *                ใช้ `min_deposit_30d` เดียว — ระบบคิดจากยอดฝาก rolling 30 วัน
 *
 * Split 2026-04-21: TierCard / DistributionBar / LevelFormModal → separate files
 * Related: admin-api internal/handler/member_levels.go · docs/rules/member_levels_ui.md
 */
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { memberLevelApi, type MemberLevel } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Plus, Info, Calendar, TrendingUp } from 'lucide-react'
import TierCard from './TierCard'
import DistributionBar from './DistributionBar'
import LevelFormModal, { emptyForm, type LevelFormState } from './LevelFormModal'

// ─── Utils ────────────────────────────────────────────────────────────
const fmtMoney = (n: number) =>
  `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function MemberLevelsPage() {
  // ─── State ──────────────────────────────────────────────────────────
  const [levels, setLevels] = useState<MemberLevel[]>([])
  const [unassigned, setUnassigned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [mode, setMode] = useState<'create' | 'edit' | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<LevelFormState>(emptyForm)

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

  // ─── Derived ────────────────────────────────────────────────────────
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
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>การกระจายตัวของสมาชิก</h2>
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
                  <TierCard level={lv} onEdit={() => openEdit(lv)} onDelete={() => confirmDelete(lv)} />

                  {/* Gap indicator ระหว่าง tier */}
                  {below && gap > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '4px 0', position: 'relative',
                    }}>
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
        <LevelFormModal
          mode={mode}
          form={form}
          saving={saving}
          onChange={(patch) => setForm(f => ({ ...f, ...patch }))}
          onSave={handleSave}
          onClose={() => setMode(null)}
        />
      )}

      {dialog && <ConfirmDialog {...dialog} />}
    </div>
  )
}
