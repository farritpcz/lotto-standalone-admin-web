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
 * Page: /members/[id] (admin) — thin orchestrator
 * Subcomponents: src/components/member-detail/*
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { memberMgmtApi, txMgmtApi, betMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import MemberHeader from '@/components/member-detail/MemberHeader'
import BalanceSection from '@/components/member-detail/BalanceSection'
import TransactionsTable from '@/components/member-detail/TransactionsTable'
import BetsHistoryTable from '@/components/member-detail/BetsHistoryTable'
import ManageTab from '@/components/member-detail/ManageTab'
import AdjustBalanceModal from '@/components/member-detail/AdjustBalanceModal'
import { MemberDetail, Transaction, Bet, fmtMoney } from '@/components/member-detail/types'

// ---- Tab config ----
const TABS = [
  { key: 'info', label: 'ข้อมูลสมาชิก' },
  { key: 'credits', label: 'ประวัติเครดิต' },
  { key: 'bets', label: 'ประวัติการแทง' },
  { key: 'manage', label: 'จัดการ' },
] as const

type TabKey = typeof TABS[number]['key']

/** จำนวนต่อหน้าสำหรับ sub-tables */
const PER_PAGE = 20

export default function MemberDetailPage() {
  const params = useParams()
  const memberId = Number(params.id)

  // ----- Member + loading -----
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // ----- Active tab -----
  const [activeTab, setActiveTab] = useState<TabKey>('info')

  // ----- Transactions state -----
  const [txns, setTxns] = useState<Transaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txPage, setTxPage] = useState(1)
  const [txLoading, setTxLoading] = useState(false)

  // ----- Bets state -----
  const [bets, setBets] = useState<Bet[]>([])
  const [betTotal, setBetTotal] = useState(0)
  const [betPage, setBetPage] = useState(1)
  const [betLoading, setBetLoading] = useState(false)

  // ----- Adjust modal -----
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustMode, setAdjustMode] = useState<'add' | 'deduct'>('add')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)

  // ----- Manage form -----
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // ----- ConfirmDialog + Feedback -----
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ===== โหลดข้อมูลสมาชิก =====
  const loadMember = useCallback(async () => {
    if (!memberId || isNaN(memberId)) return
    setLoading(true)
    try {
      const res = await memberMgmtApi.get(memberId)
      const data = res.data.data || res.data
      setMember(data)
      setEditPhone(data.phone || '')
      setEditEmail(data.email || '')
    } catch {
      setMessage({ type: 'error', text: 'โหลดข้อมูลสมาชิกไม่สำเร็จ' })
    } finally {
      setLoading(false)
    }
  }, [memberId])

  // ===== โหลด transactions =====
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

  // ===== โหลด bets =====
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

  useEffect(() => { loadMember() }, [loadMember])

  useEffect(() => {
    if (activeTab === 'credits') loadTransactions()
    if (activeTab === 'bets') loadBets()
  }, [activeTab, loadTransactions, loadBets])

  // auto-hide feedback
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ===== Actions =====
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
      await memberMgmtApi.adjustBalance(
        memberId,
        finalAmount,
        adjustNote || `${adjustMode === 'add' ? 'เติม' : 'หัก'}เครดิตโดย admin`,
      )
      setMessage({
        type: 'success',
        text: `${adjustMode === 'add' ? 'เติม' : 'หัก'}เครดิต ${fmtMoney(rawAmount)} สำเร็จ`,
      })
      setShowAdjustModal(false)
      setAdjustAmount('')
      setAdjustNote('')
      loadMember()
    } catch {
      setMessage({ type: 'error', text: 'ปรับยอดเงินไม่สำเร็จ' })
    } finally {
      setAdjustLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setEditLoading(true)
    try {
      await memberMgmtApi.update(memberId, { phone: editPhone, email: editEmail })
      setMessage({ type: 'success', text: 'บันทึกข้อมูลสมาชิกสำเร็จ' })
      loadMember()
    } catch {
      setMessage({ type: 'error', text: 'บันทึกข้อมูลไม่สำเร็จ' })
    } finally {
      setEditLoading(false)
    }
  }

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
          loadMember()
        } catch {
          setMessage({ type: 'error', text: 'เปลี่ยนสถานะไม่สำเร็จ' })
        }
      },
      onCancel: () => setConfirmDialog(null),
    })
  }

  // Pagination helpers
  const txTotalPages = Math.ceil(txTotal / PER_PAGE)
  const betTotalPages = Math.ceil(betTotal / PER_PAGE)

  if (loading) return <Loading />

  if (!member) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
          ไม่พบสมาชิก #{memberId}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* ===== Feedback Message ===== */}
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

      {/* ===== Header ===== */}
      <MemberHeader member={member} />

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

      {/* ===== Tab Content ===== */}
      {activeTab === 'info' && (
        <BalanceSection
          member={member}
          onAddCredit={() => { setAdjustMode('add'); setShowAdjustModal(true) }}
          onDeductCredit={() => { setAdjustMode('deduct'); setShowAdjustModal(true) }}
        />
      )}

      {activeTab === 'credits' && (
        <TransactionsTable
          txns={txns}
          loading={txLoading}
          page={txPage}
          totalPages={txTotalPages}
          onPrev={() => setTxPage(p => Math.max(1, p - 1))}
          onNext={() => setTxPage(p => p + 1)}
        />
      )}

      {activeTab === 'bets' && (
        <BetsHistoryTable
          bets={bets}
          loading={betLoading}
          page={betPage}
          totalPages={betTotalPages}
          onPrev={() => setBetPage(p => Math.max(1, p - 1))}
          onNext={() => setBetPage(p => p + 1)}
        />
      )}

      {activeTab === 'manage' && (
        <ManageTab
          member={member}
          editPhone={editPhone}
          editEmail={editEmail}
          newPassword={newPassword}
          editLoading={editLoading}
          setEditPhone={setEditPhone}
          setEditEmail={setEditEmail}
          setNewPassword={setNewPassword}
          onSaveProfile={handleSaveProfile}
          onResetPassword={handleResetPassword}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* ===== Adjust Balance Modal ===== */}
      {showAdjustModal && (
        <AdjustBalanceModal
          mode={adjustMode}
          currentBalance={member.balance}
          amount={adjustAmount}
          note={adjustNote}
          loading={adjustLoading}
          setAmount={setAdjustAmount}
          setNote={setAdjustNote}
          onClose={() => setShowAdjustModal(false)}
          onConfirm={handleAdjustBalance}
        />
      )}

      {/* ===== ConfirmDialog ===== */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  )
}
