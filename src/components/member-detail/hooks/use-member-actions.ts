/**
 * useMemberActions — handlers สำหรับ admin actions (adjust/edit/reset/toggle)
 *
 * Rule: ห่อ API calls + message feedback — UI ไม่ต้องรู้รายละเอียด
 * Related: app/members/[id]/page.tsx, lib/api/member-mgmt.ts
 */
'use client'
import { useState } from 'react'
import { memberMgmtApi } from '@/lib/api'
import type { ConfirmDialogProps } from '@/components/ConfirmDialog'
import type { MemberDetail } from '../types'
import { fmtMoney } from '../types'

type Message = { type: 'success' | 'error'; text: string }

interface Options {
  memberId: number
  member: MemberDetail | null
  reload: () => void
  onMessage: (msg: Message) => void
  onConfirm: (dialog: ConfirmDialogProps | null) => void
}

export function useMemberActions({ memberId, member, reload, onMessage, onConfirm }: Options) {
  // ----- Adjust modal state -----
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

  // เปิด modal — เติม/หัก
  const openAdjust = (mode: 'add' | 'deduct') => {
    setAdjustMode(mode)
    setShowAdjustModal(true)
  }

  const handleAdjustBalance = async () => {
    const rawAmount = parseFloat(adjustAmount)
    if (isNaN(rawAmount) || rawAmount <= 0) {
      onMessage({ type: 'error', text: 'กรุณากรอกจำนวนเงินที่ถูกต้อง (มากกว่า 0)' })
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
      onMessage({
        type: 'success',
        text: `${adjustMode === 'add' ? 'เติม' : 'หัก'}เครดิต ${fmtMoney(rawAmount)} สำเร็จ`,
      })
      setShowAdjustModal(false)
      setAdjustAmount('')
      setAdjustNote('')
      reload()
    } catch {
      onMessage({ type: 'error', text: 'ปรับยอดเงินไม่สำเร็จ' })
    } finally {
      setAdjustLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setEditLoading(true)
    try {
      await memberMgmtApi.update(memberId, { phone: editPhone, email: editEmail })
      onMessage({ type: 'success', text: 'บันทึกข้อมูลสมาชิกสำเร็จ' })
      reload()
    } catch {
      onMessage({ type: 'error', text: 'บันทึกข้อมูลไม่สำเร็จ' })
    } finally {
      setEditLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      onMessage({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
      return
    }
    setEditLoading(true)
    try {
      await memberMgmtApi.update(memberId, { password: newPassword })
      onMessage({ type: 'success', text: 'รีเซ็ตรหัสผ่านสำเร็จ' })
      setNewPassword('')
    } catch {
      onMessage({ type: 'error', text: 'รีเซ็ตรหัสผ่านไม่สำเร็จ (API อาจยังไม่รองรับ)' })
    } finally {
      setEditLoading(false)
    }
  }

  const handleToggleStatus = () => {
    if (!member) return
    const newStatus = member.status === 'active' ? 'suspended' : 'active'
    const actionLabel = newStatus === 'active' ? 'เปิดใช้งาน' : 'ระงับ'

    onConfirm({
      title: `${actionLabel}สมาชิก`,
      message: `ยืนยัน${actionLabel} "${member.username}" (#${member.id})?`,
      type: newStatus === 'active' ? 'info' : 'danger',
      confirmLabel: actionLabel,
      onConfirm: async () => {
        onConfirm(null)
        try {
          await memberMgmtApi.updateStatus(memberId, newStatus)
          onMessage({ type: 'success', text: `${actionLabel}สมาชิก ${member.username} แล้ว` })
          reload()
        } catch {
          onMessage({ type: 'error', text: 'เปลี่ยนสถานะไม่สำเร็จ' })
        }
      },
      onCancel: () => onConfirm(null),
    })
  }

  return {
    // adjust modal
    showAdjustModal,
    setShowAdjustModal,
    adjustMode,
    adjustAmount,
    setAdjustAmount,
    adjustNote,
    setAdjustNote,
    adjustLoading,
    openAdjust,
    handleAdjustBalance,
    // manage form
    editPhone,
    setEditPhone,
    editEmail,
    setEditEmail,
    newPassword,
    setNewPassword,
    editLoading,
    handleSaveProfile,
    handleResetPassword,
    handleToggleStatus,
  }
}
