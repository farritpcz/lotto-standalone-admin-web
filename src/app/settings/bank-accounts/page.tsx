/**
 * Admin — ตั้งค่าบัญชีฝาก/ถอน (thin orchestrator)
 *
 * ฟีเจอร์:
 * - แสดงรายการบัญชีธนาคาร + เพิ่ม/แก้ไข/ลบ
 * - ตั้งค่า EasySlip (API key, toggles, test, history)
 * - fallback ไป mock data ถ้า API ยังไม่มี
 *
 * Subcomponents: src/components/bank-accounts/*
 */
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import AccountsTable from '@/components/bank-accounts/AccountsTable'
import AccountFormModal from '@/components/bank-accounts/AccountFormModal'
import EasySlipCard, { EasySlipState } from '@/components/bank-accounts/EasySlipCard'
import EasySlipHistoryModal, { Verification } from '@/components/bank-accounts/EasySlipHistoryModal'
import {
  BankAccount, BankAccountForm, DepositWithdrawSettings, getBankName,
} from '@/components/bank-accounts/types'

// Mock data — ใช้เมื่อ API ยังไม่พร้อม
const MOCK_ACCOUNTS: BankAccount[] = [
  { id: 1, bank_code: 'SCB', account_number: '4081234567', account_name: 'บจก.ลอตโต้', is_default: true, status: 'active' },
  { id: 2, bank_code: 'KBANK', account_number: '0621234567', account_name: 'บจก.ลอตโต้', is_default: false, status: 'active' },
  { id: 3, bank_code: 'BBL', account_number: '1234567890', account_name: 'บจก.ลอตโต้', is_default: false, status: 'inactive' },
]

const MOCK_SETTINGS: DepositWithdrawSettings = {
  min_deposit: 100,
  auto_approve_threshold: 5000,
  min_withdraw: 300,
  max_withdraw_per_day: 50000,
}

const EMPTY_FORM: BankAccountForm = {
  bank_code: 'SCB', account_number: '', account_name: '',
  is_default: false, account_type: 'deposit', transfer_mode: 'manual',
  bank_system: 'KBIZ', qr_code_url: '', rkauto_token1: '', rkauto_token2: '',
}

export default function BankAccountsPage() {
  // รายการบัญชี
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)

  // ตั้งค่าฝาก/ถอน (ยังไม่มี UI — เก็บไว้เผื่ออนาคต)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_settings, setSettings] = useState<DepositWithdrawSettings>(MOCK_SETTINGS)

  // Modal ฟอร์ม
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<BankAccountForm>(EMPTY_FORM)
  const [formSaving, setFormSaving] = useState(false)

  // ConfirmDialog + message
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // EasySlip config state
  const [esHasConfig, setEsHasConfig] = useState(false)
  const [esApiKey, setEsApiKey] = useState('')
  const [esApiKeyMasked, setEsApiKeyMasked] = useState('')
  const [esShowKey, setEsShowKey] = useState(false)
  const [esEnabled, setEsEnabled] = useState(true)
  const [esBankVerify, setEsBankVerify] = useState(true)
  const [esTruewallet, setEsTruewallet] = useState(false)
  const [esMatchAccount, setEsMatchAccount] = useState(true)
  const [esCheckDuplicate, setEsCheckDuplicate] = useState(true)
  const [esAutoApprove, setEsAutoApprove] = useState(true)
  const [esAmountTolerance, setEsAmountTolerance] = useState('0')
  const [esSaving, setEsSaving] = useState(false)
  const [esTesting, setEsTesting] = useState(false)
  const [esTestResult, setEsTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [esVerifications, setEsVerifications] = useState<Verification[]>([])
  const [esShowHistory, setEsShowHistory] = useState(false)

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => { loadAccounts() }, [])

  // auto-hide message
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/agent/bank-accounts')
      setAccounts(res.data.data || [])
      // โหลด settings (ถ้ามี endpoint)
      try {
        const sr = await api.get('/agent/deposit-withdraw-settings')
        if (sr.data.data) setSettings(sr.data.data)
      } catch { /* ใช้ mock */ }
      // โหลด EasySlip config
      try {
        const esRes = await api.get('/easyslip/config')
        const cfg = esRes.data.data
        if (cfg) {
          setEsHasConfig(true)
          setEsApiKeyMasked(cfg.api_key_masked || '')
          setEsEnabled(cfg.enabled)
          setEsBankVerify(cfg.bank_verify_enabled)
          setEsTruewallet(cfg.truewallet_enabled)
          setEsMatchAccount(cfg.match_account)
          setEsCheckDuplicate(cfg.check_duplicate)
          setEsAutoApprove(cfg.auto_approve_on_match)
          setEsAmountTolerance(String(cfg.amount_tolerance || 0))
        }
      } catch { /* ยังไม่มี config */ }
    } catch {
      setAccounts(MOCK_ACCOUNTS)
      setSettings(MOCK_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  // ── Account handlers ──
  const openAddModal = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, bank_system: '' })
    setShowModal(true)
  }

  const openEditModal = (acc: BankAccount) => {
    setEditingId(acc.id)
    const accRecord = acc as unknown as Record<string, unknown>
    setForm({
      bank_code: acc.bank_code,
      account_number: acc.account_number,
      account_name: acc.account_name,
      is_default: acc.is_default,
      account_type: (acc.account_type as 'deposit' | 'withdraw') || 'deposit',
      transfer_mode: (acc.transfer_mode as 'manual' | 'auto' | 'easyslip') || 'manual',
      bank_system: acc.bank_system || '',
      qr_code_url: (accRecord.qr_code_url as string) || '',
      rkauto_token1: '',
      rkauto_token2: '',
    })
    setShowModal(true)
  }

  const handleSaveAccount = async () => {
    if (!form.account_number || !form.account_name) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบ' })
      return
    }
    setFormSaving(true)
    try {
      if (editingId) {
        await api.put(`/agent/bank-accounts/${editingId}`, form)
      } else {
        await api.post('/agent/bank-accounts', form)
      }
      setMessage({ type: 'success', text: editingId ? 'แก้ไขบัญชีสำเร็จ' : 'เพิ่มบัญชีสำเร็จ' })
      setShowModal(false)
      loadAccounts()
    } catch {
      // Fallback: mock state update
      if (editingId) {
        setAccounts(prev => prev.map(a => {
          if (a.id === editingId) return { ...a, ...form }
          if (form.is_default) return { ...a, is_default: false }
          return a
        }))
      } else {
        const newAcc: BankAccount = { id: Date.now(), ...form, status: 'active' }
        setAccounts(prev => {
          let updated = [...prev, newAcc]
          if (form.is_default) {
            updated = updated.map(a => a.id === newAcc.id ? a : { ...a, is_default: false })
          }
          return updated
        })
      }
      setMessage({ type: 'success', text: editingId ? 'แก้ไขบัญชีสำเร็จ (mock)' : 'เพิ่มบัญชีสำเร็จ (mock)' })
      setShowModal(false)
    } finally {
      setFormSaving(false)
    }
  }

  const handleDelete = (acc: BankAccount) => {
    if (acc.is_default) {
      setMessage({ type: 'error', text: 'ไม่สามารถลบบัญชีหลักได้ กรุณาเปลี่ยนบัญชีหลักก่อน' })
      return
    }
    setConfirmDialog({
      title: 'ลบบัญชีธนาคาร',
      message: `ยืนยันลบบัญชี ${getBankName(acc.bank_code)} ${acc.account_number}?`,
      type: 'danger',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await api.delete(`/agent/bank-accounts/${acc.id}`)
          loadAccounts()
        } catch {
          setAccounts(prev => prev.filter(a => a.id !== acc.id))
        }
        setMessage({ type: 'success', text: 'ลบบัญชีสำเร็จ' })
      },
      onCancel: () => setConfirmDialog(null),
    })
  }

  const handleToggleStatus = async (acc: BankAccount) => {
    const newStatus = acc.status === 'active' ? 'inactive' : 'active'
    try {
      await api.put(`/agent/bank-accounts/${acc.id}`, { status: newStatus })
      loadAccounts()
    } catch {
      setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, status: newStatus } : a))
    }
    setMessage({ type: 'success', text: newStatus === 'active' ? 'เปิดใช้บัญชีแล้ว' : 'ปิดบัญชีแล้ว' })
  }

  // ── EasySlip handlers ──
  const handleEsTest = async () => {
    if (!esApiKey && !esHasConfig) { setMessage({ type: 'error', text: 'กรุณากรอก API Key' }); return }
    setEsTesting(true); setEsTestResult(null)
    try {
      const res = await api.post('/easyslip/test', { api_key: esApiKey || undefined })
      setEsTestResult(res.data)
    } catch { setEsTestResult({ success: false, message: 'เชื่อมต่อไม่ได้' }) }
    setEsTesting(false)
  }

  const handleEsSave = async () => {
    if (!esHasConfig && !esApiKey) { setMessage({ type: 'error', text: 'กรุณากรอก API Key' }); return }
    setEsSaving(true)
    try {
      await api.post('/easyslip/config', {
        api_key: esApiKey || undefined, enabled: esEnabled,
        bank_verify_enabled: esBankVerify, truewallet_enabled: esTruewallet,
        match_account: esMatchAccount, check_duplicate: esCheckDuplicate,
        auto_approve_on_match: esAutoApprove, amount_tolerance: Number(esAmountTolerance) || 0,
      })
      setMessage({ type: 'success', text: 'บันทึกการตั้งค่า EasySlip สำเร็จ' })
      setEsApiKey(''); loadAccounts()
    } catch { setMessage({ type: 'error', text: 'บันทึกไม่สำเร็จ' }) }
    setEsSaving(false)
  }

  const handleShowHistory = async () => {
    setEsShowHistory(true)
    try {
      const res = await api.get('/easyslip/verifications', { params: { per_page: 15 } })
      setEsVerifications(res.data.data?.items || [])
    } catch { /* ignore */ }
  }

  const esState: EasySlipState = {
    hasConfig: esHasConfig,
    apiKey: esApiKey, apiKeyMasked: esApiKeyMasked, showKey: esShowKey,
    enabled: esEnabled, bankVerify: esBankVerify, truewallet: esTruewallet,
    matchAccount: esMatchAccount, checkDuplicate: esCheckDuplicate,
    autoApprove: esAutoApprove, amountTolerance: esAmountTolerance,
    saving: esSaving, testing: esTesting, testResult: esTestResult,
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>ตั้งค่าบัญชีฝาก/ถอน</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            style={{ width: 14, height: 14 }}>
            <path d="M12 5v14m-7-7h14" />
          </svg>
          เพิ่มบัญชี
        </button>
      </div>

      {/* Feedback */}
      {message && (
        <div style={{
          background: message.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      {/* Section 1: รายการบัญชี */}
      <div className="card-surface" style={{ padding: 20, marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 16 }}>บัญชีธนาคาร</div>
        <AccountsTable
          accounts={accounts}
          loading={loading}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Section 2: EasySlip */}
      <EasySlipCard
        state={esState}
        setApiKey={setEsApiKey}
        setShowKey={setEsShowKey}
        setEnabled={setEsEnabled}
        setBankVerify={setEsBankVerify}
        setTruewallet={setEsTruewallet}
        setMatchAccount={setEsMatchAccount}
        setCheckDuplicate={setEsCheckDuplicate}
        setAutoApprove={setEsAutoApprove}
        setAmountTolerance={setEsAmountTolerance}
        onTest={handleEsTest}
        onSave={handleEsSave}
        onShowHistory={handleShowHistory}
      />

      {/* Modals */}
      {esShowHistory && (
        <EasySlipHistoryModal verifications={esVerifications} onClose={() => setEsShowHistory(false)} />
      )}

      {showModal && (
        <AccountFormModal
          editing={editingId !== null}
          form={form}
          saving={formSaving}
          setForm={setForm}
          onClose={() => setShowModal(false)}
          onSave={handleSaveAccount}
        />
      )}

      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  )
}
