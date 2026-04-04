/**
 * Admin — ระบบ Level สมาชิก
 *
 * - CRUD levels (ชื่อ, สี, เงื่อนไข)
 * - กำหนดผลประโยชน์ต่อ level: ค่าคอม %, โบนัส, cashback %
 * - แสดงจำนวนสมาชิกในแต่ละ level (realtime count จาก API)
 *
 * ⭐ เชื่อม API จริง: GET/POST/PUT/DELETE /api/v1/member-levels
 *
 * ความสัมพันธ์:
 * - api.ts → memberLevelApi
 * - admin-api (#5) → handler/member_levels.go
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { memberLevelApi, type MemberLevel } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Plus, Pencil, Trash2, GripVertical, Users } from 'lucide-react'

// ─── ฟอร์แมตเงิน ────────────────────────────────────────────────────
const fmtMoney = (n: number) =>
  `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ─── Form State เริ่มต้น ──────────────────────────────────────────────
const emptyForm = {
  name: '', color: '#FFD700', icon: '', sort_order: 0,
  min_deposit: 0, min_bets: 0,
  commission_rate: 0, cashback_rate: 0, bonus_pct: 0,
  max_withdraw_day: 0, description: '',
}

export default function MemberLevelsPage() {
  // ─── State ──────────────────────────────────────────────────────────
  const [levels, setLevels] = useState<MemberLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal: null=ปิด, 'create'=เพิ่ม, 'edit'=แก้ไข
  const [mode, setMode] = useState<'create' | 'edit' | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  // Confirm dialog สำหรับลบ
  const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)

  const { toast } = useToast()

  // ─── โหลดข้อมูลจาก API ─────────────────────────────────────────────
  const loadLevels = useCallback(() => {
    setLoading(true)
    memberLevelApi.list()
      .then(res => setLevels(res.data.data || []))
      .catch(() => toast.error('โหลดข้อมูล Level ไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => { loadLevels() }, [loadLevels])

  // ─── เปิด Modal เพิ่ม Level ────────────────────────────────────────
  const openCreate = () => {
    setForm({ ...emptyForm, sort_order: levels.length })
    setEditId(null)
    setMode('create')
  }

  // ─── เปิด Modal แก้ไข Level ───────────────────────────────────────
  const openEdit = (lv: MemberLevel) => {
    setForm({
      name: lv.name, color: lv.color, icon: lv.icon || '',
      sort_order: lv.sort_order, min_deposit: lv.min_deposit,
      min_bets: lv.min_bets, commission_rate: lv.commission_rate,
      cashback_rate: lv.cashback_rate, bonus_pct: lv.bonus_pct,
      max_withdraw_day: lv.max_withdraw_day, description: lv.description || '',
    })
    setEditId(lv.id)
    setMode('edit')
  }

  // ─── บันทึก Level (สร้าง/แก้ไข) ───────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('กรุณากรอกชื่อ Level'); return }
    setSaving(true)
    try {
      if (mode === 'create') {
        await memberLevelApi.create(form)
        toast.success('สร้าง Level สำเร็จ')
      } else if (editId) {
        await memberLevelApi.update(editId, form)
        toast.success('แก้ไข Level สำเร็จ')
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

  // ─── ลบ Level ──────────────────────────────────────────────────────
  const confirmDelete = (lv: MemberLevel) => {
    setDialog({
      title: `ลบ Level "${lv.name}"`,
      message: lv.member_count > 0
        ? `⚠️ มีสมาชิก ${lv.member_count} คนอยู่ใน level นี้ — ไม่สามารถลบได้`
        : `ยืนยันลบ Level "${lv.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      type: 'danger',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        try {
          await memberLevelApi.delete(lv.id)
          toast.success(`ลบ Level "${lv.name}" แล้ว`)
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
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>ระบบ Level สมาชิก</h1>
          <p className="label" style={{ marginTop: 4 }}>กำหนดสิทธิประโยชน์ตาม Level</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ gap: 6 }}>
          <Plus size={16} /> เพิ่ม Level
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <Loading inline text="กำลังโหลด..." />
      ) : levels.length === 0 ? (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          ยังไม่มี Level — กดปุ่ม "เพิ่ม Level" เพื่อเริ่มต้น
        </div>
      ) : (
        /* ── Level Cards ─────────────────────────────────────────────── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {levels.map(lv => (
            <div key={lv.id} className="card-surface" style={{ padding: 20 }}>
              {/* Header: สีวงกลม + ชื่อ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: lv.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: 18,
                }}>
                  {lv.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: lv.color }}>{lv.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    ยอดฝากขั้นต่ำ {fmtMoney(lv.min_deposit)}
                  </div>
                </div>
                <span className={`badge ${lv.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                  {lv.status === 'active' ? 'เปิดใช้' : 'ปิด'}
                </span>
              </div>

              {/* Benefits — ค่าคอม / Cashback / โบนัส */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row label="ค่าคอม Affiliate" value={`${lv.commission_rate}%`} color="var(--accent)" />
                <Row label="Cashback" value={`${lv.cashback_rate}%`} color="#f5a623" />
                <Row label="โบนัสฝาก" value={`${lv.bonus_pct}%`} color="#a855f7" />
                {lv.max_withdraw_day > 0 && (
                  <Row label="ถอนสูงสุด/วัน" value={fmtMoney(lv.max_withdraw_day)} color="var(--text-primary)" />
                )}
                {lv.min_bets > 0 && (
                  <Row label="แทงขั้นต่ำ" value={`${lv.min_bets} ครั้ง`} color="var(--text-primary)" />
                )}
              </div>

              {/* Member count */}
              <div style={{
                marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={14} /> สมาชิก
                </span>
                <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {lv.member_count} คน
                </span>
              </div>

              {/* Actions: แก้ไข / ลบ */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => openEdit(lv)} className="btn btn-ghost" style={{ flex: 1, fontSize: 12, gap: 4 }}>
                  <Pencil size={14} /> แก้ไข
                </button>
                <button onClick={() => confirmDelete(lv)} className="btn btn-danger" style={{ fontSize: 12, gap: 4, padding: '0 10px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: สร้าง/แก้ไข Level ──────────────────────────────────── */}
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
            style={{ padding: 24, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                {mode === 'create' ? 'เพิ่ม Level' : `แก้ไข Level "${form.name}"`}
              </h2>
              <button onClick={() => setMode(null)} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* ชื่อ + สี */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>ชื่อ Level *</div>
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

              {/* เงื่อนไขเลื่อน Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>ยอดฝากขั้นต่ำ (฿)</div>
                  <input type="number" className="input" placeholder="20000" value={form.min_deposit || ''}
                    onChange={e => setForm(f => ({ ...f, min_deposit: Number(e.target.value) }))} />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>แทงขั้นต่ำ (ครั้ง)</div>
                  <input type="number" className="input" placeholder="0" value={form.min_bets || ''}
                    onChange={e => setForm(f => ({ ...f, min_bets: Number(e.target.value) }))} />
                </div>
              </div>

              {/* สิทธิประโยชน์ */}
              <div className="label" style={{ marginTop: 8, color: 'var(--accent)' }}>สิทธิประโยชน์</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>ค่าคอม %</div>
                  <input type="number" className="input" placeholder="0.8" step="0.1" value={form.commission_rate || ''}
                    onChange={e => setForm(f => ({ ...f, commission_rate: Number(e.target.value) }))} />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Cashback %</div>
                  <input type="number" className="input" placeholder="5" step="0.1" value={form.cashback_rate || ''}
                    onChange={e => setForm(f => ({ ...f, cashback_rate: Number(e.target.value) }))} />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>โบนัส %</div>
                  <input type="number" className="input" placeholder="20" step="1" value={form.bonus_pct || ''}
                    onChange={e => setForm(f => ({ ...f, bonus_pct: Number(e.target.value) }))} />
                </div>
              </div>

              {/* ถอนสูงสุด/วัน */}
              <div>
                <div className="label" style={{ marginBottom: 4 }}>ถอนสูงสุด/วัน (฿) — 0 = ไม่จำกัด</div>
                <input type="number" className="input" placeholder="0" value={form.max_withdraw_day || ''}
                  onChange={e => setForm(f => ({ ...f, max_withdraw_day: Number(e.target.value) }))} />
              </div>

              {/* คำอธิบาย */}
              <div>
                <div className="label" style={{ marginBottom: 4 }}>คำอธิบาย</div>
                <textarea className="input" rows={2} placeholder="สิทธิประโยชน์พิเศษ..." value={form.description}
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

      {/* Confirm Dialog */}
      {dialog && <ConfirmDialog {...dialog} />}
    </div>
  )
}

// ─── Helper: row แสดงค่าสิทธิประโยชน์ ─────────────────────────────────
function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="mono" style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  )
}
