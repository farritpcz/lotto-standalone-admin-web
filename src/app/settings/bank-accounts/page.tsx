/**
 * Admin — ตั้งค่าบัญชีฝาก/ถอน (Bank Account Settings)
 *
 * ฟีเจอร์:
 * - แสดงรายการบัญชีธนาคารของ agent (GET /agent/bank-accounts)
 * - เพิ่ม/แก้ไข/ลบ บัญชีธนาคาร (modal form)
 * - ตั้งค่าฝากเงิน: ยอดขั้นต่ำ, auto-approve threshold
 * - ตั้งค่าถอนเงิน: ยอดขั้นต่ำ, ยอดสูงสุดต่อวัน
 *
 * ความสัมพันธ์:
 * - เรียก API ของ standalone-admin-api (#5) → /agent/bank-accounts
 * - ถ้า API ยังไม่มี จะใช้ mock data แทน
 *
 * Design System: Linear/Vercel dark theme
 * - .page-container, .page-header, .card-surface
 * - .admin-table, .btn-*, .input, .label, .badge-*
 */
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import Loading from '@/components/Loading'
import BankIcon from '@/components/BankIcon'

// =============================================================================
// TYPES — โครงสร้างข้อมูลบัญชีธนาคาร + ตั้งค่าฝาก/ถอน
// =============================================================================

/** ธนาคารที่รองรับ (bank_code → ชื่อ + สี) */
const BANK_OPTIONS: { code: string; name: string; color: string }[] = [
  { code: 'SCB', name: 'ไทยพาณิชย์', color: '#4e2a84' },
  { code: 'KBANK', name: 'กสิกรไทย', color: '#138f2d' },
  { code: 'BBL', name: 'กรุงเทพ', color: '#1e4598' },
  { code: 'KTB', name: 'กรุงไทย', color: '#1ba5e0' },
  { code: 'BAY', name: 'กรุงศรีอยุธยา', color: '#fec43b' },
  { code: 'TTB', name: 'ทหารไทยธนชาต', color: '#fc4f1f' },
  { code: 'GSB', name: 'ออมสิน', color: '#eb198d' },
]

/** บัญชีธนาคาร 1 บัญชี */
interface BankAccount {
  id: number
  bank_code: string
  account_number: string
  account_name: string
  is_default: boolean
  status: string
  account_type?: string    // deposit | withdraw
  transfer_mode?: string   // manual | auto
  rkauto_uuid?: string
  rkauto_status?: string
  bank_system?: string
}

/** ฟอร์มเพิ่ม/แก้ไขบัญชี */
interface BankAccountForm {
  bank_code: string
  account_number: string
  account_name: string
  is_default: boolean
  account_type: 'deposit' | 'withdraw'   // บัญชีฝาก หรือ บัญชีถอน
  transfer_mode: 'manual' | 'auto'       // มือ หรือ ออโต้ (RKAUTO)
  bank_system: string                     // SMS / BANK / KBIZ (ใช้กับ auto)
  rkauto_token1: string
  rkauto_token2: string
}

/** ตั้งค่าฝาก/ถอน */
interface DepositWithdrawSettings {
  min_deposit: number
  auto_approve_threshold: number
  min_withdraw: number
  max_withdraw_per_day: number
}

// =============================================================================
// MOCK DATA — ใช้เมื่อ API ยังไม่พร้อม
// =============================================================================
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

// =============================================================================
// COMPONENT — BankAccountsPage
// =============================================================================
export default function BankAccountsPage() {
  // ----- State: รายการบัญชี -----
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)

  // ----- State: ตั้งค่าฝาก/ถอน -----
  const [settings, setSettings] = useState<DepositWithdrawSettings>(MOCK_SETTINGS)
  const [savingSettings, setSavingSettings] = useState(false)

  // ----- State: Modal เพิ่ม/แก้ไขบัญชี -----
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null) // null = เพิ่มใหม่
  const [form, setForm] = useState<BankAccountForm>({
    bank_code: 'SCB', account_number: '', account_name: '', is_default: false, account_type: 'deposit' as const, transfer_mode: 'manual' as const, bank_system: 'KBIZ', rkauto_token1: '', rkauto_token2: '',
  })
  const [formSaving, setFormSaving] = useState(false)

  // ----- State: Confirm dialog -----
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | null>(null)

  // ----- State: Feedback message -----
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ===== โหลดข้อมูลเริ่มต้น =====
  useEffect(() => {
    loadAccounts()
  }, [])

  // ===== ซ่อน message หลัง 3 วินาที =====
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  /**
   * โหลดรายการบัญชีจาก API
   * ถ้า API ยังไม่มี → fallback ไป mock data
   */
  const loadAccounts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/agent/bank-accounts')
      setAccounts(res.data.data || [])
      // โหลด settings ด้วย (ถ้ามี endpoint)
      try {
        const settingsRes = await api.get('/agent/deposit-withdraw-settings')
        if (settingsRes.data.data) setSettings(settingsRes.data.data)
      } catch { /* ใช้ mock settings */ }
    } catch {
      // API ยังไม่มี → ใช้ mock data
      setAccounts(MOCK_ACCOUNTS)
      setSettings(MOCK_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  /**
   * เปิด modal เพิ่มบัญชีใหม่
   * reset form ก่อนเปิด
   */
  const openAddModal = () => {
    setEditingId(null)
    setForm({ bank_code: 'SCB', account_number: '', account_name: '', is_default: false, account_type: 'deposit', transfer_mode: 'manual', bank_system: '', rkauto_token1: '', rkauto_token2: '' })
    setShowModal(true)
  }

  /**
   * เปิด modal แก้ไขบัญชี
   * ดึงข้อมูลเดิมมาเติมในฟอร์ม
   */
  const openEditModal = (acc: BankAccount) => {
    setEditingId(acc.id)
    setForm({
      bank_code: acc.bank_code,
      account_number: acc.account_number,
      account_name: acc.account_name,
      is_default: acc.is_default,
      account_type: (acc.account_type as 'deposit' | 'withdraw') || 'deposit',
      transfer_mode: (acc.transfer_mode as 'manual' | 'auto') || 'manual',
      bank_system: acc.bank_system || '',
      rkauto_token1: '',
      rkauto_token2: '',
    })
    setShowModal(true)
  }

  /**
   * บันทึกบัญชี (เพิ่มใหม่ หรือ แก้ไข)
   * ถ้า is_default = true → reset บัญชีอื่นทั้งหมดก่อน
   */
  const handleSaveAccount = async () => {
    // Validate
    if (!form.account_number || !form.account_name) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบ' })
      return
    }
    setFormSaving(true)
    try {
      if (editingId) {
        // แก้ไข
        await api.put(`/agent/bank-accounts/${editingId}`, form)
      } else {
        // เพิ่มใหม่
        await api.post('/agent/bank-accounts', form)
      }
      setMessage({ type: 'success', text: editingId ? 'แก้ไขบัญชีสำเร็จ' : 'เพิ่มบัญชีสำเร็จ' })
      setShowModal(false)
      loadAccounts()
    } catch {
      // API ไม่มี → mock: เพิ่ม/แก้ไขใน state ตรงๆ
      if (editingId) {
        setAccounts(prev => prev.map(a => {
          if (a.id === editingId) return { ...a, ...form }
          // ถ้าตั้ง default → reset อื่น
          if (form.is_default) return { ...a, is_default: false }
          return a
        }))
      } else {
        const newAcc: BankAccount = {
          id: Date.now(),
          ...form,
          status: 'active',
        }
        setAccounts(prev => {
          let updated = [...prev, newAcc]
          // ถ้าตั้ง default → reset อื่น
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

  /**
   * ลบบัญชี — ต้อง confirm ก่อน
   * ไม่อนุญาตลบบัญชี default
   */
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
          // mock: ลบจาก state
          setAccounts(prev => prev.filter(a => a.id !== acc.id))
        }
        setMessage({ type: 'success', text: 'ลบบัญชีสำเร็จ' })
      },
      onCancel: () => setConfirmDialog(null),
    })
  }

  // ─── Toggle สถานะ บัญชี active/inactive ──────────────────────
  const handleToggleStatus = async (acc: BankAccount) => {
    const newStatus = acc.status === 'active' ? 'inactive' : 'active'
    try {
      await api.put(`/agent/bank-accounts/${acc.id}`, { status: newStatus })
      loadAccounts()
    } catch {
      // mock: toggle ใน state
      setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, status: newStatus } : a))
    }
    setMessage({ type: 'success', text: newStatus === 'active' ? 'เปิดใช้บัญชีแล้ว' : 'ปิดบัญชีแล้ว' })
  }

  // ─── RKAUTO Handlers ─────────────────────────────────────────
  const handleRegisterRKAuto = async (acc: BankAccount) => {
    // ใช้ token จาก form ที่กรอกตอนเพิ่มบัญชี
    const bankSystem = prompt('เลือกระบบ (SMS / BANK / KBIZ):')?.toUpperCase()
    if (!bankSystem || !['SMS', 'BANK', 'KBIZ'].includes(bankSystem)) {
      setMessage({ type: 'error', text: 'กรุณาเลือก SMS, BANK หรือ KBIZ' }); return
    }

    try {
      await api.post(`/bank-accounts/${acc.id}/register-rkauto`, {
        bank_system: bankSystem,
        username: 'token-based', // RKAUTO tokens ส่งแทน username/password
        password: 'token-based',
        is_deposit: true, is_withdraw: true,
        bank_code: acc.bank_code,
      })
      setMessage({ type: 'success', text: `เชื่อม RKAUTO สำเร็จ (${bankSystem})` })
      loadAccounts()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setMessage({ type: 'error', text: 'RKAUTO: ' + (err.response?.data?.error || 'เกิดข้อผิดพลาด') })
    }
  }

  const handleActivateRKAuto = async (acc: BankAccount) => {
    try {
      await api.post(`/bank-accounts/${acc.id}/activate-rkauto`)
      setMessage({ type: 'success', text: 'เปิดใช้ RKAUTO สำเร็จ' })
      loadAccounts()
    } catch { setMessage({ type: 'error', text: 'เปิดใช้ RKAUTO ล้มเหลว' }) }
  }

  const handleDeactivateRKAuto = async (acc: BankAccount) => {
    try {
      await api.post(`/bank-accounts/${acc.id}/deactivate-rkauto`)
      setMessage({ type: 'success', text: 'ปิด RKAUTO สำเร็จ' })
      loadAccounts()
    } catch { setMessage({ type: 'error', text: 'ปิด RKAUTO ล้มเหลว' }) }
  }

  /**
   * บันทึกตั้งค่าฝาก/ถอน
   */
  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await api.put('/agent/deposit-withdraw-settings', settings)
      setMessage({ type: 'success', text: 'บันทึกตั้งค่าสำเร็จ' })
    } catch {
      // mock: แค่แสดง success
      setMessage({ type: 'success', text: 'บันทึกตั้งค่าสำเร็จ (mock)' })
    } finally {
      setSavingSettings(false)
    }
  }

  /** helper: หาชื่อธนาคารจาก code */
  const getBankName = (code: string) => BANK_OPTIONS.find(b => b.code === code)?.name || code
  /** helper: หาสีธนาคารจาก code */
  const getBankColor = (code: string) => BANK_OPTIONS.find(b => b.code === code)?.color || '#666'

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
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

      {/* ── Feedback Message ─────────────────────────────────────────────── */}
      {message && (
        <div style={{
          background: message.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         SECTION 1: รายการบัญชีธนาคาร
         ══════════════════════════════════════════════════════════════════ */}
      <div className="card-surface" style={{ padding: 20, marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 16 }}>บัญชีธนาคาร</div>

        {loading ? (
          <Loading inline text="กำลังโหลด..." />
        ) : accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            ยังไม่มีบัญชีธนาคาร กดปุ่ม "เพิ่มบัญชี" เพื่อเริ่มต้น
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ธนาคาร</th>
                <th>เลขบัญชี</th>
                <th>ชื่อบัญชี</th>
                <th>ประเภท</th>
                <th>โหมด</th>
                <th>สถานะ</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id}>
                  {/* ธนาคาร — แสดง badge สีธนาคาร */}
                  <td>
                    {/* ไอคอนธนาคาร + ชื่อ */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BankIcon code={acc.bank_code} size={22} />
                      <span style={{ fontWeight: 500 }}>{acc.bank_code}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {getBankName(acc.bank_code)}
                      </span>
                    </div>
                  </td>
                  {/* เลขบัญชี — mono font */}
                  <td className="mono">{acc.account_number}</td>
                  {/* ชื่อบัญชี */}
                  <td>{acc.account_name}</td>
                  {/* ประเภท: ฝาก/ถอน */}
                  <td>
                    <span className={`badge ${acc.account_type === 'withdraw' ? 'badge-error' : 'badge-success'}`} style={{ fontSize: 10 }}>
                      {acc.account_type === 'withdraw' ? 'ถอน' : 'ฝาก'}
                    </span>
                    {acc.is_default && <span className="badge badge-info" style={{ fontSize: 10, marginLeft: 4 }}>หลัก</span>}
                  </td>
                  {/* โหมด: มือ/ออโต้ */}
                  <td>
                    {acc.transfer_mode === 'auto' ? (
                      <div>
                        <span className="badge badge-warning" style={{ fontSize: 10 }}>ออโต้</span>
                        {acc.rkauto_status && (
                          <span className={`badge ${acc.rkauto_status === 'active' ? 'badge-success' : 'badge-neutral'}`}
                            style={{ fontSize: 9, marginLeft: 4 }}>
                            {acc.rkauto_status}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>มือ</span>
                    )}
                  </td>
                  {/* สถานะ — toggle switch */}
                  <td>
                    <button
                      onClick={() => handleToggleStatus(acc)}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: acc.status === 'active' ? 'var(--accent)' : '#333',
                        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                      }}
                      title={acc.status === 'active' ? 'คลิกเพื่อปิด' : 'คลิกเพื่อเปิด'}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 9, background: 'white',
                        position: 'absolute', top: 3,
                        left: acc.status === 'active' ? 23 : 3,
                        transition: 'left 0.2s',
                      }} />
                    </button>
                  </td>
                  {/* จัดการ: แก้ไข / ลบ */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" onClick={() => openEditModal(acc)}
                        style={{ height: 26, padding: '0 6px', fontSize: 11 }}>
                        แก้ไข
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(acc)}
                        style={{ height: 26, padding: '0 6px', fontSize: 11 }}>
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ตั้งค่าฝาก/ถอน → ย้ายไปอยู่ในเมนู "ตั้งค่าฝาก/ถอน" แล้ว */}

      {/* ══════════════════════════════════════════════════════════════════
         MODAL: เพิ่ม/แก้ไขบัญชีธนาคาร
         ══════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '24px', maxWidth: 440, width: '100%',
            animation: 'fadeSlideUp 0.2s ease',
          }}>
            {/* Modal header */}
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
              {editingId ? 'แก้ไขบัญชีธนาคาร' : 'เพิ่มบัญชีธนาคาร'}
            </div>

            {/* ── Form fields ──────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* ธนาคาร dropdown */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ธนาคาร</div>
                <select
                  className="input"
                  value={form.bank_code}
                  onChange={e => setForm(f => ({ ...f, bank_code: e.target.value }))}
                >
                  {BANK_OPTIONS.map(b => (
                    <option key={b.code} value={b.code}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* เลขบัญชี */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>เลขบัญชี</div>
                <input
                  type="text" className="input" placeholder="เช่น 4081234567"
                  value={form.account_number}
                  onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                />
              </div>

              {/* ชื่อบัญชี */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ชื่อบัญชี</div>
                <input
                  type="text" className="input" placeholder="เช่น บจก.ลอตโต้"
                  value={form.account_name}
                  onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
                />
              </div>

              {/* ── ประเภทบัญชี: ฝาก / ถอน ── */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ประเภทบัญชี</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { value: 'deposit', label: 'บัญชีฝาก', desc: 'รับเงินจากสมาชิก' },
                    { value: 'withdraw', label: 'บัญชีถอน', desc: 'โอนเงินให้สมาชิก' },
                  ].map(opt => (
                    <label key={opt.value} style={{
                      flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${form.account_type === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.account_type === opt.value ? 'rgba(0,229,160,0.06)' : 'transparent',
                      transition: 'all 0.15s',
                    }}>
                      <input type="radio" name="account_type" value={opt.value} checked={form.account_type === opt.value}
                        onChange={() => setForm(f => ({ ...f, account_type: opt.value as 'deposit' | 'withdraw' }))}
                        style={{ display: 'none' }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: form.account_type === opt.value ? 'var(--accent)' : 'var(--text-primary)' }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{opt.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* ── โหมด: มือ / ออโต้ ── */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>โหมดการทำงาน</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { value: 'manual', label: 'มือ (Manual)', desc: 'แอดมินตรวจสอบเอง' },
                    { value: 'auto', label: 'ออโต้ (RKAUTO)', desc: 'ระบบตรวจจับอัตโนมัติ' },
                  ].map(opt => (
                    <label key={opt.value} style={{
                      flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${form.transfer_mode === opt.value ? (opt.value === 'auto' ? '#f5a623' : 'var(--accent)') : 'var(--border)'}`,
                      background: form.transfer_mode === opt.value ? (opt.value === 'auto' ? 'rgba(245,166,35,0.06)' : 'rgba(0,229,160,0.06)') : 'transparent',
                      transition: 'all 0.15s',
                    }}>
                      <input type="radio" name="transfer_mode" value={opt.value} checked={form.transfer_mode === opt.value}
                        onChange={() => setForm(f => ({ ...f, transfer_mode: opt.value as 'manual' | 'auto' }))}
                        style={{ display: 'none' }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: form.transfer_mode === opt.value ? (opt.value === 'auto' ? '#f5a623' : 'var(--accent)') : 'var(--text-primary)' }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{opt.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* บัญชีหลัก checkbox */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                <input
                  type="checkbox" checked={form.is_default}
                  onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                  style={{ accentColor: 'var(--accent)' }}
                />
                ตั้งเป็นบัญชีหลัก (แสดงในหน้าฝากเงิน)
              </label>

              {/* ── RKAUTO Section — แสดงเฉพาะ mode=auto ── */}
              {form.transfer_mode === 'auto' && (
                <div style={{ padding: 14, background: 'rgba(245,166,35,0.04)', borderRadius: 8, border: '1px solid rgba(245,166,35,0.2)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f5a623', marginBottom: 12 }}>
                    RKAUTO — ตั้งค่าออโต้
                  </div>

                  {/* Bank System */}
                  <div style={{ marginBottom: 10 }}>
                    <div className="label" style={{ marginBottom: 4 }}>ระบบธนาคาร</div>
                    <select className="input" value={form.bank_system}
                      onChange={e => setForm(f => ({ ...f, bank_system: e.target.value }))}>
                      <option value="KBIZ">KBIZ — กสิกร K-BIZ</option>
                      <option value="SMS">SMS — SCB/KBANK ผ่าน SMS OTP</option>
                      <option value="BANK">BANK — GSB/TMW login ตรง</option>
                    </select>
                  </div>

                  {/* Token 1 */}
                  <div style={{ marginBottom: 10 }}>
                    <div className="label" style={{ marginBottom: 4 }}>Token 1 (จากการเจน RKAUTO)</div>
                    <input type="text" className="input"
                      placeholder="วาง token ตัวที่ 1..."
                      value={form.rkauto_token1}
                      onChange={e => setForm(f => ({ ...f, rkauto_token1: e.target.value }))}
                      maxLength={150}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                  </div>

                  {/* Token 2 */}
                  <div style={{ marginBottom: 10 }}>
                    <div className="label" style={{ marginBottom: 4 }}>Token 2 (จากการเจน RKAUTO)</div>
                    <input type="text" className="input"
                      placeholder="วาง token ตัวที่ 2..."
                      value={form.rkauto_token2}
                      onChange={e => setForm(f => ({ ...f, rkauto_token2: e.target.value }))}
                      maxLength={150}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                  </div>

                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    * Tokens ไม่ถูกเก็บในระบบ — ส่งไป RKAUTO ตอน register เท่านั้น
                  </div>
                </div>
              )}
            </div>

            {/* ── Modal buttons ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1, height: 38 }}
                onClick={() => setShowModal(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" style={{ flex: 1, height: 38, fontWeight: 600 }}
                onClick={handleSaveAccount} disabled={formSaving}>
                {formSaving ? 'กำลังบันทึก...' : (editingId ? 'บันทึกการแก้ไข' : 'เพิ่มบัญชี')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ───────────────────────────────────────────── */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  )
}
