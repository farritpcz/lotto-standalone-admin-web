/**
 * Admin — ระบบโปรโมชั่น (Promotions)
 *
 * - CRUD โปรโมชั่น: first_deposit, deposit, cashback, free_credit
 * - เงื่อนไข: min deposit, max bonus, turnover
 * - ระยะเวลา: start/end date (หมดอายุอัตโนมัติ)
 * - สถานะ: active/inactive/expired
 *
 * ⭐ เชื่อม API จริง: GET/POST/PUT/DELETE /api/v1/promotions
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { promotionApi, type Promotion } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import ImageUpload from '@/components/ImageUpload'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────
const statusBadge: Record<string, { cls: string; label: string }> = {
  active:   { cls: 'badge-success', label: 'เปิดใช้' },
  inactive: { cls: 'badge-warning', label: 'ปิดใช้' },
  expired:  { cls: 'badge-error', label: 'หมดอายุ' },
}

const typeBadge: Record<string, string> = {
  first_deposit: 'สมัครใหม่',
  deposit: 'ฝากเงิน',
  cashback: 'คืนยอดเสีย',
  free_credit: 'เครดิตฟรี',
}

const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ─── Default Form ────────────────────────────────────────────────────
const emptyForm = {
  name: '', type: 'first_deposit', description: '', image_url: '',
  bonus_pct: 100, max_bonus: 1000, min_deposit: 100, turnover: 5,
  max_per_member: 1, max_total: 0, start_date: '', end_date: '',
}

export default function PromotionsPage() {
  // ─── State ──────────────────────────────────────────────────────────
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit' | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)
  const { toast } = useToast()

  // ─── โหลดข้อมูล ────────────────────────────────────────────────────
  const loadPromos = useCallback(() => {
    setLoading(true)
    promotionApi.list()
      .then(res => setPromos(res.data.data || []))
      .catch(() => toast.error('โหลดโปรโมชั่นไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => { loadPromos() }, [loadPromos])

  // ─── เปิด Modal สร้าง ──────────────────────────────────────────────
  const openCreate = () => {
    const today = new Date().toISOString().split('T')[0]
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    setForm({ ...emptyForm, start_date: today, end_date: nextMonth })
    setEditId(null)
    setMode('create')
  }

  // ─── เปิด Modal แก้ไข ─────────────────────────────────────────────
  const openEdit = (p: Promotion) => {
    setForm({
      name: p.name, type: p.type, description: p.description || '',
      image_url: p.image_url || '', bonus_pct: p.bonus_pct, max_bonus: p.max_bonus,
      min_deposit: p.min_deposit, turnover: p.turnover,
      max_per_member: p.max_per_member, max_total: p.max_total,
      start_date: p.start_date || '', end_date: p.end_date || '',
    })
    setEditId(p.id)
    setMode('edit')
  }

  // ─── บันทึก ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('กรุณากรอกชื่อโปรโมชั่น'); return }
    setSaving(true)
    try {
      if (mode === 'create') {
        await promotionApi.create(form)
        toast.success('สร้างโปรโมชั่นสำเร็จ')
      } else if (editId) {
        await promotionApi.update(editId, form)
        toast.success('แก้ไขโปรโมชั่นสำเร็จ')
      }
      setMode(null)
      loadPromos()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'บันทึกไม่สำเร็จ'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  // ─── เปลี่ยนสถานะ (toggle active/inactive) ────────────────────────
  const toggleStatus = async (p: Promotion) => {
    const newStatus = p.status === 'active' ? 'inactive' : 'active'
    try {
      await promotionApi.updateStatus(p.id, newStatus)
      toast.success(`${newStatus === 'active' ? 'เปิด' : 'ปิด'}โปรโมชั่นแล้ว`)
      loadPromos()
    } catch { toast.error('เปลี่ยนสถานะไม่สำเร็จ') }
  }

  // ─── ลบ ──────────────────────────────────────────────────────────────
  const confirmDelete = (p: Promotion) => {
    setDialog({
      title: 'ลบโปรโมชั่น',
      message: `ยืนยันลบ "${p.name}"?`,
      type: 'danger',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        try {
          await promotionApi.delete(p.id)
          toast.success('ลบโปรโมชั่นแล้ว')
          loadPromos()
        } catch { toast.error('ลบไม่สำเร็จ') }
        setDialog(null)
      },
      onCancel: () => setDialog(null),
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>ระบบโปรโมชั่น</h1>
          <p className="label" style={{ marginTop: 4 }}>ทั้งหมด {promos.length} รายการ</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ gap: 6 }}>
          <Plus size={16} /> เพิ่มโปรโมชั่น
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading inline text="กำลังโหลด..." />
        ) : promos.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            ยังไม่มีโปรโมชั่น
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ชื่อโปรโมชั่น</th>
                <th>ประเภท</th>
                <th style={{ textAlign: 'right' }}>โบนัส</th>
                <th style={{ textAlign: 'right' }}>Max</th>
                <th style={{ textAlign: 'right' }}>Min ฝาก</th>
                <th style={{ textAlign: 'center' }}>Turnover</th>
                <th>ระยะเวลา</th>
                <th style={{ textAlign: 'center' }}>ใช้ไป</th>
                <th>สถานะ</th>
                <th style={{ textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(p => {
                const st = statusBadge[p.status] || statusBadge.inactive
                return (
                  <tr key={p.id}>
                    <td className="mono secondary">#{p.id}</td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td><span className="badge badge-info">{typeBadge[p.type] || p.type}</span></td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{p.bonus_pct}%</td>
                    <td className="mono secondary" style={{ textAlign: 'right' }}>{fmtMoney(p.max_bonus)}</td>
                    <td className="mono secondary" style={{ textAlign: 'right' }}>{fmtMoney(p.min_deposit)}</td>
                    <td className="mono secondary" style={{ textAlign: 'center' }}>x{p.turnover}</td>
                    <td className="secondary" style={{ fontSize: 12 }}>{p.start_date || '—'} ~ {p.end_date || '—'}</td>
                    <td className="mono secondary" style={{ textAlign: 'center' }}>
                      {p.used_count}{p.max_total > 0 ? `/${p.max_total}` : ''}
                    </td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        {/* Toggle active/inactive */}
                        <button onClick={() => toggleStatus(p)} className="btn btn-ghost" title={p.status === 'active' ? 'ปิด' : 'เปิด'}
                          style={{ padding: '0 6px', height: 28 }}>
                          {p.status === 'active' ? <ToggleRight size={16} color="var(--accent)" /> : <ToggleLeft size={16} />}
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEdit(p)} className="btn btn-ghost" style={{ padding: '0 6px', height: 28 }}>
                          <Pencil size={14} />
                        </button>
                        {/* Delete */}
                        <button onClick={() => confirmDelete(p)} className="btn btn-ghost" style={{ padding: '0 6px', height: 28 }}>
                          <Trash2 size={14} color="var(--status-error)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal: สร้าง/แก้ไข ──────────────────────────────────────── */}
      {mode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={() => setMode(null)}>
          <div className="card-surface"
            style={{ padding: 24, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                {mode === 'create' ? 'เพิ่มโปรโมชั่น' : 'แก้ไขโปรโมชั่น'}
              </h2>
              <button onClick={() => setMode(null)} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* ชื่อ */}
              <div>
                <div className="label" style={{ marginBottom: 4 }}>ชื่อโปรโมชั่น *</div>
                <input className="input" placeholder="สมัครใหม่รับโบนัส 100%" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              {/* ประเภท + โบนัส */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>ประเภท</div>
                  <select className="input" value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="first_deposit">สมัครใหม่</option>
                    <option value="deposit">ฝากเงิน</option>
                    <option value="cashback">คืนยอดเสีย</option>
                    <option value="free_credit">เครดิตฟรี</option>
                  </select>
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>โบนัส %</div>
                  <input type="number" className="input" value={form.bonus_pct || ''}
                    onChange={e => setForm(f => ({ ...f, bonus_pct: Number(e.target.value) }))} />
                </div>
              </div>

              {/* Max, Min, Turnover */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Max โบนัส (฿)</div>
                  <input type="number" className="input" value={form.max_bonus || ''}
                    onChange={e => setForm(f => ({ ...f, max_bonus: Number(e.target.value) }))} />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Min ฝาก (฿)</div>
                  <input type="number" className="input" value={form.min_deposit || ''}
                    onChange={e => setForm(f => ({ ...f, min_deposit: Number(e.target.value) }))} />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Turnover (x)</div>
                  <input type="number" className="input" step="0.5" value={form.turnover || ''}
                    onChange={e => setForm(f => ({ ...f, turnover: Number(e.target.value) }))} />
                </div>
              </div>

              {/* จำกัดการใช้ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>ใช้ได้/คน (0=ไม่จำกัด)</div>
                  <input type="number" className="input" value={form.max_per_member || ''}
                    onChange={e => setForm(f => ({ ...f, max_per_member: Number(e.target.value) }))} />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>จำกัดรวม (0=ไม่จำกัด)</div>
                  <input type="number" className="input" value={form.max_total || ''}
                    onChange={e => setForm(f => ({ ...f, max_total: Number(e.target.value) }))} />
                </div>
              </div>

              {/* ระยะเวลา */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>วันเริ่ม</div>
                  <input type="date" className="input" value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>วันสิ้นสุด</div>
                  <input type="date" className="input" value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>

              {/* รายละเอียด */}
              <div>
                <div className="label" style={{ marginBottom: 4 }}>รายละเอียด</div>
                <textarea className="input" rows={2} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ height: 'auto', padding: '8px 12px' }} placeholder="รายละเอียดเพิ่มเติม..." />
              </div>

              {/* ⭐ รูปโปรโมชั่น — แสดงในหน้าโปรโมชั่นของ member */}
              <div>
                <div className="label" style={{ marginBottom: 4 }}>รูปโปรโมชั่น (optional)</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                  อัพรูป banner/cover สำหรับโปรโมชั่น (แสดงในหน้า member)
                </div>
                <ImageUpload
                  folder="promo"
                  currentUrl={form.image_url}
                  onUploaded={(url) => setForm(f => ({ ...f, image_url: url }))}
                  size="lg"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setMode(null)} className="btn btn-secondary" style={{ flex: 1 }} disabled={saving}>ยกเลิก</button>
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
