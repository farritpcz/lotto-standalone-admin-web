/**
 * Admin — หน้ารายละเอียดสมาชิก (Member Detail Page)
 *
 * เปิดเป็น tab ใหม่จากตารางสมาชิก (คลิก username)
 * URL: /members/[id]
 *
 * ฟีเจอร์ (4 แท็บ):
 * 1. ข้อมูลสมาชิก — header, balance card, profile, profit/loss summary
 * 2. ประวัติเครดิต — ตาราง transactions (deposit, withdraw, bet, win)
 * 3. ประวัติการแทง — ตาราง bets
 * 4. จัดการ — แก้ไข phone/email, reset password, toggle status
 *
 * ความสัมพันธ์:
 * - เรียก memberMgmtApi.get(id) → standalone-admin-api (#5)
 * - เรียก txMgmtApi.list({ member_id }) → ประวัติเครดิต
 * - เรียก betMgmtApi.list({ member_id }) → ประวัติการแทง
 * - เรียก memberMgmtApi.adjustBalance() → เติม/หักเครดิต
 * - เรียก memberMgmtApi.update() → แก้ไขข้อมูล
 * - เรียก memberMgmtApi.updateStatus() → เปลี่ยนสถานะ
 *
 * Design System: Linear/Vercel dark theme
 * - ใช้ .page-container, .card-surface, .stat-card
 * - ใช้ .admin-table, .badge-*, .btn-*, .input, .label, .metric, .mono
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { memberMgmtApi, txMgmtApi, betMgmtApi } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'

// =============================================================================
// TYPES — โครงสร้างข้อมูล
// =============================================================================

/** รายละเอียดสมาชิก — มาจาก memberMgmtApi.get(id) */
interface MemberDetail {
  id: number
  username: string
  phone: string
  email: string
  balance: number
  status: string           // 'active' | 'suspended'
  created_at: string
  bank_code?: string
  bank_account_number?: string
  bank_account_name?: string
  referred_by?: number
  referrer_username?: string
  total_bets?: number
  total_bet_amount?: number
  total_win_amount?: number
  recent_bets_count?: number
}

/** ธุรกรรม — มาจาก txMgmtApi.list() */
interface Transaction {
  id: number
  type: string             // deposit, withdraw, bet, win, refund
  amount: number
  balance_before: number
  balance_after: number
  note?: string
  created_at: string
  member_id: number
}

/** เดิมพัน — มาจาก betMgmtApi.list() */
interface Bet {
  id: number
  member_id?: number
  number: string
  amount: number
  rate: number
  status: string           // pending, won, lost
  win_amount: number
  created_at: string
  member?: { id?: number; username: string }
  bet_type?: { name: string; code: string }
  lottery_round?: { id: number; round_number: string }
}

// =============================================================================
// HELPERS — format เงิน, วันที่, badge mapping
// =============================================================================

/** Format เงิน — ทุกจำนวนเงินต้องแสดง .00 */
const fmtMoney = (n: number) =>
  `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Format วันที่ — แสดงแบบไทย */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })

/** Format วันเวลา — รวมเวลาด้วย */
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

/** Transaction type → badge class + label (Thai) */
const txTypeBadge: Record<string, { cls: string; label: string }> = {
  deposit:  { cls: 'badge-success', label: 'ฝาก' },
  withdraw: { cls: 'badge-error', label: 'ถอน' },
  bet:      { cls: 'badge-warning', label: 'แทง' },
  win:      { cls: 'badge-success', label: 'ชนะ' },
  refund:   { cls: 'badge-info', label: 'คืนเงิน' },
  adjust:   { cls: 'badge-info', label: 'ปรับยอด' },
}

/** Bet status → badge class + label (Thai) */
const betStatusBadge: Record<string, { cls: string; label: string }> = {
  pending: { cls: 'badge-warning', label: 'รอผล' },
  won:     { cls: 'badge-success', label: 'ชนะ' },
  lost:    { cls: 'badge-error', label: 'แพ้' },
}

// =============================================================================
// TAB DEFINITIONS — 4 แท็บหลัก
// =============================================================================
const TABS = [
  { key: 'info', label: 'ข้อมูลสมาชิก' },
  { key: 'credits', label: 'ประวัติเครดิต' },
  { key: 'bets', label: 'ประวัติการแทง' },
  { key: 'manage', label: 'จัดการ' },
] as const

type TabKey = typeof TABS[number]['key']

// =============================================================================
// COMPONENT — MemberDetailPage
// =============================================================================
export default function MemberDetailPage() {
  const params = useParams()
  /** member ID จาก URL params (แปลง string → number) */
  const memberId = Number(params.id)

  // ----- State: ข้อมูลสมาชิก -----
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // ----- State: active tab -----
  const [activeTab, setActiveTab] = useState<TabKey>('info')

  // ----- State: ประวัติเครดิต (transactions) -----
  const [txns, setTxns] = useState<Transaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txPage, setTxPage] = useState(1)
  const [txLoading, setTxLoading] = useState(false)

  // ----- State: ประวัติการแทง (bets) -----
  const [bets, setBets] = useState<Bet[]>([])
  const [betTotal, setBetTotal] = useState(0)
  const [betPage, setBetPage] = useState(1)
  const [betLoading, setBetLoading] = useState(false)

  // ----- State: Modal ปรับยอดเงิน (เติม/หัก) -----
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  /** 'add' = เติมเครดิต, 'deduct' = หักเครดิต */
  const [adjustMode, setAdjustMode] = useState<'add' | 'deduct'>('add')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)

  // ----- State: จัดการ (edit form) -----
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // ----- State: ConfirmDialog -----
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | null>(null)

  // ----- State: Feedback message -----
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  /** จำนวนต่อหน้าสำหรับ table ย่อย */
  const PER_PAGE = 20

  // ===== โหลดข้อมูลสมาชิก (หลัก) =====
  const loadMember = useCallback(async () => {
    if (!memberId || isNaN(memberId)) return
    setLoading(true)
    try {
      const res = await memberMgmtApi.get(memberId)
      const data = res.data.data || res.data
      setMember(data)
      // เซ็ตค่า form จัดการจากข้อมูลปัจจุบัน
      setEditPhone(data.phone || '')
      setEditEmail(data.email || '')
    } catch {
      setMessage({ type: 'error', text: 'โหลดข้อมูลสมาชิกไม่สำเร็จ' })
    } finally {
      setLoading(false)
    }
  }, [memberId])

  // ===== โหลดประวัติเครดิต =====
  const loadTransactions = useCallback(async () => {
    if (!memberId || isNaN(memberId)) return
    setTxLoading(true)
    try {
      const res = await txMgmtApi.list({ member_id: memberId, page: txPage, per_page: PER_PAGE })
      setTxns(res.data.data?.items || [])
      setTxTotal(res.data.data?.total || 0)
    } catch {
      setMessage({ type: 'error', text: 'โหลดประวัติเครดิตไม่สำเร็จ' })
    } finally {
      setTxLoading(false)
    }
  }, [memberId, txPage])

  // ===== โหลดประวัติการแทง =====
  const loadBets = useCallback(async () => {
    if (!memberId || isNaN(memberId)) return
    setBetLoading(true)
    try {
      const res = await betMgmtApi.list({ member_id: memberId, page: betPage, per_page: PER_PAGE })
      setBets(res.data.data?.items || [])
      setBetTotal(res.data.data?.total || 0)
    } catch {
      setMessage({ type: 'error', text: 'โหลดประวัติการแทงไม่สำเร็จ' })
    } finally {
      setBetLoading(false)
    }
  }, [memberId, betPage])

  // ===== Effect: โหลดข้อมูลสมาชิกเมื่อ mount =====
  useEffect(() => { loadMember() }, [loadMember])

  // ===== Effect: โหลด tab data ตาม active tab =====
  useEffect(() => {
    if (activeTab === 'credits') loadTransactions()
    if (activeTab === 'bets') loadBets()
  }, [activeTab, loadTransactions, loadBets])

  // ===== Effect: ซ่อน message หลัง 3 วินาที =====
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ===== Action: ปรับยอดเงิน (เติม/หัก) =====
  const handleAdjustBalance = async () => {
    const rawAmount = parseFloat(adjustAmount)
    if (isNaN(rawAmount) || rawAmount <= 0) {
      setMessage({ type: 'error', text: 'กรุณากรอกจำนวนเงินที่ถูกต้อง (มากกว่า 0)' })
      return
    }

    // เติม = positive, หัก = negative
    const finalAmount = adjustMode === 'deduct' ? -rawAmount : rawAmount

    setAdjustLoading(true)
    try {
      await memberMgmtApi.adjustBalance(memberId, finalAmount, adjustNote || `${adjustMode === 'add' ? 'เติม' : 'หัก'}เครดิตโดย admin`)
      setMessage({
        type: 'success',
        text: `${adjustMode === 'add' ? 'เติม' : 'หัก'}เครดิต ${fmtMoney(rawAmount)} สำเร็จ`,
      })
      setShowAdjustModal(false)
      setAdjustAmount('')
      setAdjustNote('')
      loadMember()  // รีโหลดข้อมูลสมาชิก (ยอดเงินใหม่)
    } catch {
      setMessage({ type: 'error', text: 'ปรับยอดเงินไม่สำเร็จ' })
    } finally {
      setAdjustLoading(false)
    }
  }

  // ===== Action: บันทึกแก้ไขข้อมูล (phone, email) =====
  const handleSaveProfile = async () => {
    setEditLoading(true)
    try {
      await memberMgmtApi.update(memberId, { phone: editPhone, email: editEmail })
      setMessage({ type: 'success', text: 'บันทึกข้อมูลสมาชิกสำเร็จ' })
      loadMember()  // รีโหลดข้อมูล
    } catch {
      setMessage({ type: 'error', text: 'บันทึกข้อมูลไม่สำเร็จ' })
    } finally {
      setEditLoading(false)
    }
  }

  // ===== Action: Reset password (UI only — API อาจยังไม่มี) =====
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
      return
    }
    setEditLoading(true)
    try {
      await memberMgmtApi.update(memberId, { password: newPassword })
      setMessage({ type: 'success', text: 'รีเซ็ตรหัสผ่านสำเร็จ' })
      setNewPassword('')
    } catch {
      setMessage({ type: 'error', text: 'รีเซ็ตรหัสผ่านไม่สำเร็จ (API อาจยังไม่รองรับ)' })
    } finally {
      setEditLoading(false)
    }
  }

  // ===== Action: Toggle status (active ↔ suspended) =====
  const handleToggleStatus = () => {
    if (!member) return
    const newStatus = member.status === 'active' ? 'suspended' : 'active'
    const actionLabel = newStatus === 'active' ? 'เปิดใช้งาน' : 'ระงับ'

    setConfirmDialog({
      title: `${actionLabel}สมาชิก`,
      message: `ยืนยัน${actionLabel} "${member.username}" (#${member.id})?`,
      type: newStatus === 'active' ? 'info' : 'danger',
      confirmLabel: actionLabel,
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await memberMgmtApi.updateStatus(memberId, newStatus)
          setMessage({ type: 'success', text: `${actionLabel}สมาชิก ${member.username} แล้ว` })
          loadMember()  // รีโหลดข้อมูล (status ใหม่)
        } catch {
          setMessage({ type: 'error', text: 'เปลี่ยนสถานะไม่สำเร็จ' })
        }
      },
      onCancel: () => setConfirmDialog(null),
    })
  }

  // ===== คำนวณ Profit/Loss summary =====
  const totalBetAmount = member?.total_bet_amount || 0
  const totalWinAmount = member?.total_win_amount || 0
  const profitLoss = totalWinAmount - totalBetAmount  // บวก = สมาชิกได้กำไร, ลบ = เว็บได้กำไร

  // ===== Pagination helpers =====
  const txTotalPages = Math.ceil(txTotal / PER_PAGE)
  const betTotalPages = Math.ceil(betTotal / PER_PAGE)

  // =========================================================================
  // RENDER — Loading state
  // =========================================================================
  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          กำลังโหลดข้อมูลสมาชิก...
        </div>
      </div>
    )
  }

  // =========================================================================
  // RENDER — Not found
  // =========================================================================
  if (!member) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
          ไม่พบสมาชิก #{memberId}
        </div>
      </div>
    )
  }

  // =========================================================================
  // RENDER — Main content
  // =========================================================================
  return (
    <div className="page-container">

      {/* ===== Feedback Message (toast) ===== */}
      {message && (
        <div
          className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-error'}`}
          style={{
            position: 'fixed', top: 16, right: 24, zIndex: 400,
            padding: '10px 20px', fontSize: 13,
            animation: 'fadeSlideUp 0.2s ease',
          }}
        >
          {message.text}
        </div>
      )}

      {/* ===== Page Header: ID, username, status, join date ===== */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* ปุ่มกลับ */}
          <button
            className="btn btn-ghost"
            onClick={() => window.close()}
            title="ปิดแท็บ"
            style={{ width: 32, height: 32, padding: 0, fontSize: 16 }}
          >
            &larr;
          </button>

          <div>
            {/* Username + ID */}
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              {member.username}
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                #{member.id}
              </span>
              {/* Status badge */}
              <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                {member.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
              </span>
            </h1>

            {/* วันที่สมัคร */}
            <p className="label" style={{ marginTop: 4, fontSize: 12 }}>
              สมัครเมื่อ {fmtDate(member.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Tab Navigation ===== */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--accent-text)' : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB 1: ข้อมูลสมาชิก ===== */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.2s ease' }}>

          {/* ----- Balance Card: ยอดเงินคงเหลือ + ปุ่มเติม/หัก ----- */}
          <div className="card-surface" style={{
            padding: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <span className="label" style={{ display: 'block', marginBottom: 6 }}>ยอดเงินคงเหลือ</span>
              <span className="metric" style={{ color: 'var(--accent-text)', fontSize: 32 }}>
                {fmtMoney(member.balance)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* ปุ่มเติมเครดิต */}
              <button
                className="btn btn-success"
                onClick={() => { setAdjustMode('add'); setShowAdjustModal(true) }}
              >
                + เติมเครดิต
              </button>
              {/* ปุ่มหักเครดิต */}
              <button
                className="btn btn-danger"
                onClick={() => { setAdjustMode('deduct'); setShowAdjustModal(true) }}
              >
                - หักเครดิต
              </button>
            </div>
          </div>

          {/* ----- Profile Section: ข้อมูลส่วนตัว + ธนาคาร + ผู้แนะนำ ----- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

            {/* ข้อมูลส่วนตัว */}
            <div className="card-surface" style={{ padding: 20 }}>
              <p className="label" style={{ marginBottom: 14 }}>ข้อมูลส่วนตัว</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <InfoRow label="เบอร์โทร" value={member.phone || '---'} />
                <InfoRow label="อีเมล" value={member.email || '---'} />
                <InfoRow label="แนะนำโดย" value={
                  member.referrer_username
                    ? `${member.referrer_username} (#${member.referred_by})`
                    : '--- ไม่มีผู้แนะนำ ---'
                } />
              </div>
            </div>

            {/* ข้อมูลธนาคาร */}
            <div className="card-surface" style={{ padding: 20 }}>
              <p className="label" style={{ marginBottom: 14 }}>ข้อมูลธนาคาร</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <InfoRow label="ธนาคาร" value={member.bank_code || '---'} />
                <InfoRow label="เลขบัญชี" value={member.bank_account_number || '---'} mono />
                <InfoRow label="ชื่อบัญชี" value={member.bank_account_name || '---'} />
              </div>
            </div>
          </div>

          {/* ----- Profit/Loss Summary: สรุปกำไร/ขาดทุน ----- */}
          <div className="card-surface" style={{ padding: 20 }}>
            <p className="label" style={{ marginBottom: 14 }}>สรุปกำไร / ขาดทุน</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {/* ยอดแทงรวม */}
              <div className="stat-card">
                <span className="label" style={{ display: 'block', marginBottom: 4 }}>ยอดแทงรวม</span>
                <span className="metric" style={{ fontSize: 20, color: 'var(--text-primary)' }}>
                  {fmtMoney(totalBetAmount)}
                </span>
              </div>
              {/* ยอดชนะรวม */}
              <div className="stat-card">
                <span className="label" style={{ display: 'block', marginBottom: 4 }}>ยอดชนะรวม</span>
                <span className="metric" style={{ fontSize: 20, color: 'var(--status-success)' }}>
                  {fmtMoney(totalWinAmount)}
                </span>
              </div>
              {/* กำไร/ขาดทุน (ของสมาชิก) */}
              <div className="stat-card">
                <span className="label" style={{ display: 'block', marginBottom: 4 }}>กำไร/ขาดทุน (สมาชิก)</span>
                <span className="metric" style={{
                  fontSize: 20,
                  color: profitLoss >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                }}>
                  {profitLoss >= 0 ? '+' : ''}{fmtMoney(profitLoss)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB 2: ประวัติเครดิต (Transactions) ===== */}
      {activeTab === 'credits' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="card-surface" style={{ overflow: 'hidden' }}>
            {txLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                กำลังโหลดประวัติเครดิต...
              </div>
            ) : txns.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                ยังไม่มีรายการธุรกรรม
              </div>
            ) : (
              <>
                {/* ตารางธุรกรรม */}
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>ประเภท</th>
                      <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                      <th style={{ textAlign: 'right' }}>ก่อน</th>
                      <th style={{ textAlign: 'right' }}>หลัง</th>
                      <th>หมายเหตุ</th>
                      <th>วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map(tx => {
                      const badge = txTypeBadge[tx.type] || { cls: 'badge-neutral', label: tx.type }
                      return (
                        <tr key={tx.id}>
                          <td className="secondary mono">{tx.id}</td>
                          <td>
                            <span className={`badge ${badge.cls}`}>{badge.label}</span>
                          </td>
                          {/* จำนวนเงิน — สีเขียว (บวก) / สีแดง (ลบ) */}
                          <td className="mono" style={{
                            textAlign: 'right',
                            color: tx.amount >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                          }}>
                            {tx.amount >= 0 ? '+' : ''}{fmtMoney(tx.amount)}
                          </td>
                          <td className="mono secondary" style={{ textAlign: 'right' }}>
                            {fmtMoney(tx.balance_before)}
                          </td>
                          <td className="mono secondary" style={{ textAlign: 'right' }}>
                            {fmtMoney(tx.balance_after)}
                          </td>
                          <td className="secondary" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.note || '---'}
                          </td>
                          <td className="secondary" style={{ whiteSpace: 'nowrap' }}>
                            {fmtDateTime(tx.created_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination สำหรับ transactions */}
                {txTotalPages > 1 && (
                  <PaginationBar
                    page={txPage}
                    totalPages={txTotalPages}
                    onPrev={() => setTxPage(p => Math.max(1, p - 1))}
                    onNext={() => setTxPage(p => p + 1)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB 3: ประวัติการแทง (Bets) ===== */}
      {activeTab === 'bets' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="card-surface" style={{ overflow: 'hidden' }}>
            {betLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                กำลังโหลดประวัติการแทง...
              </div>
            ) : bets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                ยังไม่มีรายการเดิมพัน
              </div>
            ) : (
              <>
                {/* ตารางเดิมพัน */}
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>งวด</th>
                      <th>ประเภท</th>
                      <th>เลข</th>
                      <th style={{ textAlign: 'right' }}>ยอดแทง</th>
                      <th style={{ textAlign: 'right' }}>อัตราจ่าย</th>
                      <th style={{ textAlign: 'center' }}>สถานะ</th>
                      <th style={{ textAlign: 'right' }}>ยอดชนะ</th>
                      <th>วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bets.map(bet => {
                      const badge = betStatusBadge[bet.status] || { cls: 'badge-neutral', label: bet.status }
                      return (
                        <tr key={bet.id}>
                          <td className="secondary mono">{bet.id}</td>
                          <td className="secondary">
                            {bet.lottery_round?.round_number || '---'}
                          </td>
                          <td>
                            {bet.bet_type?.name || bet.bet_type?.code || '---'}
                          </td>
                          <td className="mono" style={{ fontWeight: 600 }}>
                            {bet.number}
                          </td>
                          <td className="mono" style={{ textAlign: 'right' }}>
                            {fmtMoney(bet.amount)}
                          </td>
                          <td className="mono secondary" style={{ textAlign: 'right' }}>
                            x{bet.rate}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td className="mono" style={{
                            textAlign: 'right',
                            color: bet.win_amount > 0 ? 'var(--status-success)' : 'var(--text-secondary)',
                          }}>
                            {bet.win_amount > 0 ? fmtMoney(bet.win_amount) : '---'}
                          </td>
                          <td className="secondary" style={{ whiteSpace: 'nowrap' }}>
                            {fmtDateTime(bet.created_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination สำหรับ bets */}
                {betTotalPages > 1 && (
                  <PaginationBar
                    page={betPage}
                    totalPages={betTotalPages}
                    onPrev={() => setBetPage(p => Math.max(1, p - 1))}
                    onNext={() => setBetPage(p => p + 1)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB 4: จัดการ (Edit, Reset Password, Toggle Status) ===== */}
      {activeTab === 'manage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.2s ease' }}>

          {/* ----- แก้ไขข้อมูล: phone + email ----- */}
          <div className="card-surface" style={{ padding: 24 }}>
            <p className="label" style={{ marginBottom: 16 }}>แก้ไขข้อมูลส่วนตัว</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {/* เบอร์โทร */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  เบอร์โทร
                </label>
                <input
                  className="input"
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="0812345678"
                />
              </div>
              {/* อีเมล */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  อีเมล
                </label>
                <input
                  className="input"
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveProfile}
                disabled={editLoading}
              >
                {editLoading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>

          {/* ----- รีเซ็ตรหัสผ่าน ----- */}
          <div className="card-surface" style={{ padding: 24 }}>
            <p className="label" style={{ marginBottom: 16 }}>รีเซ็ตรหัสผ่าน</p>
            <div style={{ maxWidth: 360 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                รหัสผ่านใหม่
              </label>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary"
                onClick={handleResetPassword}
                disabled={editLoading || !newPassword}
              >
                {editLoading ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
              * API อาจยังไม่รองรับฟีเจอร์นี้
            </p>
          </div>

          {/* ----- สลับสถานะ: active ↔ suspended ----- */}
          <div className="card-surface" style={{ padding: 24 }}>
            <p className="label" style={{ marginBottom: 16 }}>สถานะสมาชิก</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* แสดงสถานะปัจจุบัน */}
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                สถานะปัจจุบัน:
              </span>
              <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                {member.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
              </span>
              {/* ปุ่ม toggle */}
              <button
                className={`btn ${member.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                onClick={handleToggleStatus}
              >
                {member.status === 'active' ? 'ระงับสมาชิก' : 'เปิดใช้งาน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
       * MODAL: ปรับยอดเงิน (เติม/หักเครดิต)
       * ================================================================= */}
      {showAdjustModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowAdjustModal(false)}
        >
          <div
            className="card-surface"
            style={{
              width: '100%', maxWidth: 400, padding: 24, margin: 16,
              animation: 'fadeSlideUp 0.2s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                {adjustMode === 'add' ? 'เติมเครดิต' : 'หักเครดิต'}
              </h2>
              <button
                className="btn btn-ghost"
                onClick={() => setShowAdjustModal(false)}
                style={{ width: 32, height: 32, padding: 0 }}
              >
                &times;
              </button>
            </div>

            {/* แสดงยอดเงินปัจจุบัน */}
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 8, padding: 12,
              textAlign: 'center', marginBottom: 20,
            }}>
              <span className="label" style={{ display: 'block', marginBottom: 4 }}>ยอดเงินปัจจุบัน</span>
              <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent-text)' }}>
                {fmtMoney(member.balance)}
              </span>
            </div>

            {/* จำนวนเงิน */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                จำนวนเงิน (บาท)
              </label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>

            {/* หมายเหตุ */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                หมายเหตุ (ไม่บังคับ)
              </label>
              <input
                className="input"
                type="text"
                value={adjustNote}
                onChange={e => setAdjustNote(e.target.value)}
                placeholder="เช่น: โปรโมชั่นสมัครใหม่"
              />
            </div>

            {/* ปุ่ม */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAdjustModal(false)}
                style={{ flex: 1 }}
                disabled={adjustLoading}
              >
                ยกเลิก
              </button>
              <button
                className={`btn ${adjustMode === 'add' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleAdjustBalance}
                style={{ flex: 1, fontWeight: 600 }}
                disabled={adjustLoading || !adjustAmount}
              >
                {adjustLoading
                  ? 'กำลังดำเนินการ...'
                  : adjustMode === 'add'
                    ? 'เติมเครดิต'
                    : 'หักเครดิต'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ConfirmDialog (toggle status) ===== */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * InfoRow — แสดง label + value แบบ horizontal (สำหรับ profile section)
 * @param label - ชื่อ field (สีจาง)
 * @param value - ค่าที่แสดง (สีหลัก)
 * @param mono - ใช้ monospace font (สำหรับตัวเลข)
 */
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{
        fontSize: 13, color: 'var(--text-primary)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>
        {value}
      </span>
    </div>
  )
}

/**
 * PaginationBar — แถบ pagination แบบ reusable (ก่อนหน้า / หน้า X / ถัดไป)
 * ใช้สำหรับ tab ประวัติเครดิต + ประวัติการแทง
 */
function PaginationBar({ page, totalPages, onPrev, onNext }: {
  page: number; totalPages: number; onPrev: () => void; onNext: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)',
    }}>
      <button className="btn btn-secondary" onClick={onPrev} disabled={page === 1}>
        ก่อนหน้า
      </button>
      <span className="label" style={{ padding: '0 8px' }}>
        หน้า {page} / {totalPages}
      </span>
      <button className="btn btn-secondary" onClick={onNext} disabled={page >= totalPages}>
        ถัดไป
      </button>
    </div>
  )
}
