/**
 * Admin — หน้ารายละเอียดสมาชิก (Member Detail Page)
 *
 * Rule: thin orchestrator — hooks โหลด data + action, UI แบ่งเป็น subcomponents
 * Related:
 *  - hooks/use-member-detail-data.ts (loader)
 *  - hooks/use-member-actions.ts (admin actions)
 *  - components/member-detail/* (UI)
 *  - URL: /members/[id]
 */
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import MemberHeader from '@/components/member-detail/MemberHeader'
import BalanceSection from '@/components/member-detail/BalanceSection'
import TransactionsTable from '@/components/member-detail/TransactionsTable'
import BetsHistoryTable from '@/components/member-detail/BetsHistoryTable'
import ManageTab from '@/components/member-detail/ManageTab'
import AdjustBalanceModal from '@/components/member-detail/AdjustBalanceModal'
import TabNav, { type TabKey } from '@/components/member-detail/TabNav'
import { useMemberDetailData } from '@/components/member-detail/hooks/use-member-detail-data'
import { useMemberActions } from '@/components/member-detail/hooks/use-member-actions'

type Message = { type: 'success' | 'error'; text: string }

export default function MemberDetailPage() {
  const params = useParams()
  const memberId = Number(params.id)

  const [activeTab, setActiveTab] = useState<TabKey>('info')
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | null>(null)
  const [message, setMessage] = useState<Message | null>(null)

  const data = useMemberDetailData(memberId)
  const actions = useMemberActions({
    memberId,
    member: data.member,
    reload: data.loadMember,
    onMessage: setMessage,
    onConfirm: setConfirmDialog,
  })

  // ===== Sync form fields เมื่อ member โหลดเสร็จ =====
  useEffect(() => {
    if (data.member) {
      actions.setEditPhone(data.member.phone || '')
      actions.setEditEmail(data.member.email || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.member])

  // ===== โหลด tab data ตาม active tab =====
  useEffect(() => {
    if (activeTab === 'credits') data.loadTransactions()
    if (activeTab === 'bets') data.loadBets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, data.txPage, data.betPage])

  // ===== surface load errors ไปที่ toast =====
  useEffect(() => {
    if (data.loadError) {
      setMessage({ type: 'error', text: data.loadError })
      data.clearError()
    }
  }, [data.loadError, data])

  // auto-hide feedback 3 วิ
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [message])

  // Pagination helpers
  const txTotalPages = Math.ceil(data.txTotal / data.PER_PAGE)
  const betTotalPages = Math.ceil(data.betTotal / data.PER_PAGE)

  if (data.loading) return <Loading />

  if (!data.member) {
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
      {/* ===== Feedback Toast ===== */}
      {message && (
        <div
          className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-error'}`}
          style={{
            position: 'fixed',
            top: 16,
            right: 24,
            zIndex: 400,
            padding: '10px 20px',
            fontSize: 13,
            animation: 'fadeSlideUp 0.2s ease',
          }}
        >
          {message.text}
        </div>
      )}

      <MemberHeader member={data.member} />

      <TabNav active={activeTab} onChange={setActiveTab} />

      {/* ===== Tab Content ===== */}
      {activeTab === 'info' && (
        <BalanceSection
          member={data.member}
          onAddCredit={() => actions.openAdjust('add')}
          onDeductCredit={() => actions.openAdjust('deduct')}
        />
      )}

      {activeTab === 'credits' && (
        <TransactionsTable
          txns={data.txns}
          loading={data.txLoading}
          page={data.txPage}
          totalPages={txTotalPages}
          onPrev={() => data.setTxPage(p => Math.max(1, p - 1))}
          onNext={() => data.setTxPage(p => p + 1)}
        />
      )}

      {activeTab === 'bets' && (
        <BetsHistoryTable
          bets={data.bets}
          loading={data.betLoading}
          page={data.betPage}
          totalPages={betTotalPages}
          onPrev={() => data.setBetPage(p => Math.max(1, p - 1))}
          onNext={() => data.setBetPage(p => p + 1)}
        />
      )}

      {activeTab === 'manage' && (
        <ManageTab
          member={data.member}
          editPhone={actions.editPhone}
          editEmail={actions.editEmail}
          newPassword={actions.newPassword}
          editLoading={actions.editLoading}
          setEditPhone={actions.setEditPhone}
          setEditEmail={actions.setEditEmail}
          setNewPassword={actions.setNewPassword}
          onSaveProfile={actions.handleSaveProfile}
          onResetPassword={actions.handleResetPassword}
          onToggleStatus={actions.handleToggleStatus}
        />
      )}

      {actions.showAdjustModal && (
        <AdjustBalanceModal
          mode={actions.adjustMode}
          currentBalance={data.member.balance}
          amount={actions.adjustAmount}
          note={actions.adjustNote}
          loading={actions.adjustLoading}
          setAmount={actions.setAdjustAmount}
          setNote={actions.setAdjustNote}
          onClose={() => actions.setShowAdjustModal(false)}
          onConfirm={actions.handleAdjustBalance}
        />
      )}

      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  )
}
