/**
 * Admin — จัดการเลขอั้น (Number Bans) — Redesigned
 *
 * ⭐ Redesign:
 *   - Filter: ประเภทหวย (optgroup) + ประเภทแทง + ค้นหาเลข
 *   - Quick add: กรอกหลายเลขพร้อมกัน (comma/space separated)
 *   - Card-based display จัดกลุ่มตาม ban_type
 *   - ConfirmDialog แทน browser confirm
 *   - Stats summary (จำนวน full_ban / reduce_rate / max_amount)
 *
 * API: banMgmtApi.list(), .create(), .delete()
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { banMgmtApi, lotteryMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Search, Trash2, Plus, Ban, TrendingDown, BarChart3 } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface BanItem {
  id: number; number: string; ban_type: string
  reduced_rate: number; max_amount: number
  lottery_type_id: number; bet_type_id: number
  lottery_type_name?: string
  bet_type?: { name: string; code: string }
}

interface LotteryType { id: number; name: string; code: string; category?: string }

// =============================================================================
// Constants
// =============================================================================

const BET_TYPES = [
  { id: '3TOP', label: '3 ตัวบน' }, { id: '3TOD', label: '3 ตัวโต๊ด' },
  { id: '3FRONT', label: '3 ตัวหน้า' }, { id: '3BOTTOM', label: '3 ตัวล่าง' },
  { id: '2TOP', label: '2 ตัวบน' }, { id: '2BOTTOM', label: '2 ตัวล่าง' },
  { id: 'RUN_TOP', label: 'วิ่งบน' }, { id: 'RUN_BOT', label: 'วิ่งล่าง' },
]
const BET_LABEL: Record<string, string> = Object.fromEntries(BET_TYPES.map(b => [b.id, b.label]))

const BAN_CONFIG: Record<string, { label: string; badge: string; color: string; icon: typeof Ban }> = {
  full_ban:    { label: 'อั้นเต็ม',  badge: 'badge-error',   color: '#ef4444', icon: Ban },
  reduce_rate: { label: 'ลดเรท',    badge: 'badge-warning', color: '#fbbf24', icon: TrendingDown },
  max_amount:  { label: 'จำกัดยอด', badge: 'badge-info',    color: '#60a5fa', icon: BarChart3 },
}

const CATEGORIES = [
  { key: 'thai', label: 'หวยไทย' }, { key: 'yeekee', label: 'ยี่กี' },
  { key: 'lao', label: 'หวยลาว' }, { key: 'hanoi', label: 'หวยฮานอย' },
  { key: 'malay', label: 'มาเลย์' }, { key: 'stock', label: 'หวยหุ้น' },
]

// =============================================================================
// Component
// =============================================================================

export default function BansPage() {
  const [bans, setBans] = useState<BanItem[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterLottery, setFilterLottery] = useState('')
  const [filterBetType, setFilterBetType] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // ── Quick Add state ───────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false)
  const [addLotteryId, setAddLotteryId] = useState(0)
  const [addBetType, setAddBetType] = useState('3TOP')
  const [addNumbers, setAddNumbers] = useState('')
  const [addBanType, setAddBanType] = useState<string>('full_ban')
  const [addReducedRate, setAddReducedRate] = useState('')
  const [addMaxAmount, setAddMaxAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const PER_PAGE = 30

  // ── Load data ─────────────────────────────────────────────────
  const loadBans = useCallback(() => {
    setLoading(true)
    const params: Record<string, unknown> = { page, per_page: PER_PAGE }
    if (filterLottery) params.lottery_type_id = Number(filterLottery)
    banMgmtApi.list(params)
      .then(res => {
        setBans(res.data.data?.items || res.data.data || [])
        setTotal(res.data.data?.total || 0)
      })
      .catch(() => {}).finally(() => setLoading(false))
  }, [page, filterLottery])

  useEffect(() => { loadBans() }, [loadBans])

  useEffect(() => {
    lotteryMgmtApi.list().then(res => {
      const types = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.items || [])
      setLotteryTypes(types)
      if (types.length > 0) setAddLotteryId(types[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t) }
  }, [message])

  // ── Filter ────────────────────────────────────────────────────
  const filtered = bans.filter(b => {
    if (search && !b.number.includes(search)) return false
    if (filterBetType && (b.bet_type?.code || String(b.bet_type_id)) !== filterBetType) return false
    return true
  })

  // ── Stats ─────────────────────────────────────────────────────
  const stats = {
    total: filtered.length,
    full_ban: filtered.filter(b => b.ban_type === 'full_ban').length,
    reduce_rate: filtered.filter(b => b.ban_type === 'reduce_rate').length,
    max_amount: filtered.filter(b => b.ban_type === 'max_amount').length,
  }

  // ── Quick Add: submit หลายเลขพร้อมกัน ─────────────────────────
  const handleQuickAdd = async () => {
    const numbers = addNumbers.split(/[,\s\n]+/).map(n => n.trim()).filter(n => n.length > 0)
    if (numbers.length === 0 || !addLotteryId) return
    setSubmitting(true)
    let success = 0
    for (const num of numbers) {
      try {
        await banMgmtApi.create({
          lottery_type_id: addLotteryId,
          bet_type_id: addBetType,
          number: num,
          ban_type: addBanType,
          ...(addBanType === 'reduce_rate' && { reduced_rate: Number(addReducedRate) }),
          ...(addBanType === 'max_amount' && { max_amount: Number(addMaxAmount) }),
        })
        success++
      } catch { /* skip */ }
    }
    setMessage({ type: 'success', text: `อั้นสำเร็จ ${success}/${numbers.length} เลข` })
    setAddNumbers('')
    setShowAdd(false)
    loadBans()
    setSubmitting(false)
  }

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = (ban: BanItem) => {
    setDialog({
      title: 'ลบเลขอั้น',
      message: `ลบเลขอั้น "${ban.number}" (${BAN_CONFIG[ban.ban_type]?.label || ban.ban_type})?`,
      type: 'warning',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        setDialog(null)
        try { await banMgmtApi.delete(ban.id); setMessage({ type: 'success', text: `ลบ "${ban.number}" แล้ว` }); loadBans() }
        catch { setMessage({ type: 'error', text: 'ลบไม่สำเร็จ' }) }
      },
      onCancel: () => setDialog(null),
    })
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>เลขอั้น</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {total} รายการ
            {stats.full_ban > 0 && <span style={{ marginLeft: 8, color: '#ef4444' }}>อั้นเต็ม {stats.full_ban}</span>}
            {stats.reduce_rate > 0 && <span style={{ marginLeft: 8, color: '#fbbf24' }}>ลดเรท {stats.reduce_rate}</span>}
            {stats.max_amount > 0 && <span style={{ marginLeft: 8, color: '#60a5fa' }}>จำกัดยอด {stats.max_amount}</span>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={14} style={{ marginRight: 4 }} /> อั้นเลข
        </button>
      </div>

      {/* ── Message ─────────────────────────────────────────── */}
      {message && (
        <div style={{
          background: message.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {message.type === 'success' ? '\u2713 ' : '\u2717 '}{message.text}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* ค้นหาเลข */}
        <div style={{ position: 'relative', flex: '0 0 160px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-tertiary)' }} />
          <input className="input" placeholder="ค้นหาเลข..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, height: 36 }} />
        </div>
        {/* ประเภทหวย */}
        <select className="input" style={{ width: 'auto', minWidth: 200, height: 36 }} value={filterLottery}
          onChange={e => { setFilterLottery(e.target.value); setPage(1) }}>
          <option value="">ทุกประเภทหวย</option>
          {CATEGORIES.map(cat => {
            const items = lotteryTypes.filter(lt => lt.category === cat.key)
            if (items.length === 0) return null
            return <optgroup key={cat.key} label={cat.label}>{items.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}</optgroup>
          })}
        </select>
        {/* ประเภทแทง */}
        <select className="input" style={{ width: 'auto', minWidth: 140, height: 36 }} value={filterBetType}
          onChange={e => setFilterBetType(e.target.value)}>
          <option value="">ทุกประเภทแทง</option>
          {BET_TYPES.map(bt => <option key={bt.id} value={bt.id}>{bt.label}</option>)}
        </select>
        {(search || filterLottery || filterBetType) && (
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setSearch(''); setFilterLottery(''); setFilterBetType('') }}>
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? <Loading inline text="กำลังโหลด..." /> : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            {search ? `ไม่พบเลข "${search}"` : 'ยังไม่มีเลขอั้น'}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>เลข</th>
                <th>ประเภทหวย</th>
                <th>ประเภทแทง</th>
                <th>การอั้น</th>
                <th>รายละเอียด</th>
                <th style={{ textAlign: 'right', width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ban => {
                const cfg = BAN_CONFIG[ban.ban_type] || BAN_CONFIG.full_ban
                return (
                  <tr key={ban.id}>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: 16,
                        color: cfg.color, letterSpacing: 1,
                      }}>{ban.number}</span>
                    </td>
                    <td className="secondary" style={{ fontSize: 12 }}>{ban.lottery_type_name || `ID:${ban.lottery_type_id}`}</td>
                    <td className="secondary" style={{ fontSize: 12 }}>{BET_LABEL[ban.bet_type?.code || String(ban.bet_type_id)] || ban.bet_type?.name || ban.bet_type_id}</td>
                    <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                    <td className="mono secondary" style={{ fontSize: 12 }}>
                      {ban.ban_type === 'reduce_rate' && `เรท x${ban.reduced_rate}`}
                      {ban.ban_type === 'max_amount' && `Max ฿${ban.max_amount?.toLocaleString()}`}
                      {ban.ban_type === 'full_ban' && '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost" style={{ padding: '4px 6px', color: 'var(--status-error)' }}
                        onClick={() => handleDelete(ban)} title="ลบ">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>ก่อนหน้า</button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {page}/{totalPages}</span>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}>ถัดไป</button>
          </div>
        )}
      </div>

      {/* ── Quick Add Modal ────────────────────────────────── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div className="card-surface" style={{ width: '100%', maxWidth: 500, padding: 24, animation: 'fadeSlideUp 0.2s ease' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>อั้นเลข</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* ประเภทหวย + ประเภทแทง */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 4 }}>ประเภทหวย</label>
                  <select className="input" value={addLotteryId} onChange={e => setAddLotteryId(Number(e.target.value))}>
                    {CATEGORIES.map(cat => {
                      const items = lotteryTypes.filter(lt => lt.category === cat.key)
                      if (items.length === 0) return null
                      return <optgroup key={cat.key} label={cat.label}>{items.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}</optgroup>
                    })}
                  </select>
                </div>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 4 }}>ประเภทแทง</label>
                  <select className="input" value={addBetType} onChange={e => setAddBetType(e.target.value)}>
                    {BET_TYPES.map(bt => <option key={bt.id} value={bt.id}>{bt.label}</option>)}
                  </select>
                </div>
              </div>

              {/* เลขที่ต้องการอั้น (หลายเลข) */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 4 }}>เลขที่ต้องการอั้น</label>
                <textarea className="input" rows={5} placeholder="กรอกหลายเลข คั่นด้วยช่องว่าง หรือ comma&#10;เช่น: 123 456 789 หรือ 123,456,789&#10;&#10;กรอกเลขทีละบรรทัดก็ได้"
                  value={addNumbers} onChange={e => setAddNumbers(e.target.value)}
                  style={{ resize: 'vertical', fontFamily: 'var(--font-mono, monospace)', fontSize: 18, lineHeight: 1.8, minHeight: 120, letterSpacing: 2 }} />
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {addNumbers.split(/[,\s\n]+/).filter(n => n.trim().length > 0).length} เลข
                </div>
              </div>

              {/* ประเภทการอั้น */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8 }}>ประเภทการอั้น</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Object.entries(BAN_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    const active = addBanType === key
                    return (
                      <button key={key} onClick={() => setAddBanType(key)} style={{
                        flex: 1, padding: '10px 8px', borderRadius: 8, border: `1.5px solid ${active ? cfg.color : 'var(--border)'}`,
                        background: active ? `color-mix(in srgb, ${cfg.color} 10%, var(--bg-surface))` : 'var(--bg-surface)',
                        color: active ? cfg.color : 'var(--text-secondary)', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: active ? 600 : 400,
                        transition: 'all 0.15s',
                      }}>
                        <Icon size={16} />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Conditional fields */}
              {addBanType === 'reduce_rate' && (
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 4 }}>เรทที่ลดเหลือ</label>
                  <input className="input" type="number" placeholder="เช่น 500" value={addReducedRate}
                    onChange={e => setAddReducedRate(e.target.value)} style={{ fontFamily: 'var(--font-mono, monospace)' }} />
                </div>
              )}
              {addBanType === 'max_amount' && (
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 4 }}>จำนวนเงินสูงสุด (฿)</label>
                  <input className="input" type="number" placeholder="เช่น 10000" value={addMaxAmount}
                    onChange={e => setAddMaxAmount(e.target.value)} style={{ fontFamily: 'var(--font-mono, monospace)' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleQuickAdd}
                disabled={submitting || addNumbers.trim().length === 0 || !addLotteryId}>
                {submitting ? 'กำลังอั้น...' : `อั้น ${addNumbers.split(/[,\s\n]+/).filter(n => n.trim().length > 0).length} เลข`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ──────────────────────────────────── */}
      {dialog && <ConfirmDialog {...dialog} />}
    </div>
  )
}
