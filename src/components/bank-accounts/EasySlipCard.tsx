// Component: EasySlipCard — ตั้งค่า EasySlip (API key, toggles, test, history trigger, save)
// Parent: src/app/settings/bank-accounts/page.tsx

'use client'

import {
  ScanLine, Shield, CheckCircle, XCircle,
  Wifi, WifiOff, Banknote, Wallet, Eye, EyeOff, TestTube, History,
} from 'lucide-react'

export interface EasySlipState {
  hasConfig: boolean
  apiKey: string
  apiKeyMasked: string
  showKey: boolean
  enabled: boolean
  bankVerify: boolean
  truewallet: boolean
  matchAccount: boolean
  checkDuplicate: boolean
  autoApprove: boolean
  amountTolerance: string
  saving: boolean
  testing: boolean
  testResult: { success: boolean; message: string } | null
}

interface Props {
  state: EasySlipState
  setApiKey: (v: string) => void
  setShowKey: (v: boolean) => void
  setEnabled: (v: boolean) => void
  setBankVerify: (v: boolean) => void
  setTruewallet: (v: boolean) => void
  setMatchAccount: (v: boolean) => void
  setCheckDuplicate: (v: boolean) => void
  setAutoApprove: (v: boolean) => void
  setAmountTolerance: (v: string) => void
  onTest: () => void
  onSave: () => void
  onShowHistory: () => void
}

export default function EasySlipCard({
  state, setApiKey, setShowKey, setEnabled, setBankVerify, setTruewallet,
  setMatchAccount, setCheckDuplicate, setAutoApprove, setAmountTolerance,
  onTest, onSave, onShowHistory,
}: Props) {
  return (
    <div className="card-surface" style={{ padding: 20, marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,122,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScanLine size={16} color="#007AFF" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>ตั้งค่า EasySlip</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ระบบตรวจสลิปอัตโนมัติ — สมาชิกอัปโหลดสลิป → ระบบ verify → auto-approve</div>
          </div>
        </div>
        {state.hasConfig && (
          <button className="btn btn-ghost" onClick={onShowHistory}
            style={{ fontSize: 11, gap: 4, display: 'flex', alignItems: 'center' }}>
            <History size={13} /> ประวัติ
          </button>
        )}
      </div>

      {/* Status badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', borderRadius: 8,
        background: state.hasConfig && state.enabled ? 'rgba(52,199,89,0.06)' : 'rgba(142,142,147,0.06)',
      }}>
        {state.hasConfig && state.enabled ? <Wifi size={14} color="#34C759" /> : <WifiOff size={14} color="#8E8E93" />}
        <span style={{ fontSize: 12, color: state.hasConfig && state.enabled ? '#34C759' : '#8E8E93' }}>
          {state.hasConfig && state.enabled ? 'เปิดใช้งาน' : state.hasConfig ? 'ปิดชั่วคราว' : 'ยังไม่ได้ตั้งค่า'}
        </span>
      </div>

      {/* Form grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* ซ้าย: API Key */}
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            API Key {state.hasConfig && <span style={{ color: '#007AFF', fontSize: 10 }}>({state.apiKeyMasked})</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input type={state.showKey ? 'text' : 'password'} className="input" value={state.apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={state.hasConfig ? 'เว้นว่าง = ใช้ key เดิม' : 'กรอก API Key จาก EasySlip'} />
              <button onClick={() => setShowKey(!state.showKey)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                {state.showKey ? <EyeOff size={13} color="var(--text-tertiary)" /> : <Eye size={13} color="var(--text-tertiary)" />}
              </button>
            </div>
            <button className="btn btn-secondary" onClick={onTest} disabled={state.testing}
              style={{ fontSize: 11, whiteSpace: 'nowrap', gap: 4, display: 'flex', alignItems: 'center' }}>
              <TestTube size={13} /> {state.testing ? 'ทดสอบ...' : 'ทดสอบ'}
            </button>
          </div>
          {state.testResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: state.testResult.success ? '#34C759' : '#FF453A' }}>
              {state.testResult.success ? <CheckCircle size={12} /> : <XCircle size={12} />} {state.testResult.message}
            </div>
          )}

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={state.enabled} onChange={() => setEnabled(!state.enabled)} style={{ accentColor: '#007AFF' }} />
              เปิดใช้งาน EasySlip
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={state.bankVerify} onChange={() => setBankVerify(!state.bankVerify)} style={{ accentColor: '#007AFF' }} />
              <Banknote size={13} /> ตรวจสลิปธนาคาร
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={state.truewallet} onChange={() => setTruewallet(!state.truewallet)} style={{ accentColor: '#007AFF' }} />
              <Wallet size={13} /> ตรวจสลิป TrueMoney Wallet
            </label>
          </div>
        </div>

        {/* ขวา: options + tolerance */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={state.checkDuplicate} onChange={() => setCheckDuplicate(!state.checkDuplicate)} style={{ accentColor: '#007AFF' }} />
              ตรวจสลิปซ้ำ (สลิปซ้ำ → ปฏิเสธทันที)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={state.matchAccount} onChange={() => setMatchAccount(!state.matchAccount)} style={{ accentColor: '#007AFF' }} />
              เทียบบัญชีผู้รับ (ตรงกับบัญชีโหมด EasySlip ในระบบ)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={state.autoApprove} onChange={() => setAutoApprove(!state.autoApprove)} style={{ accentColor: '#007AFF' }} />
              <Shield size={13} /> Auto-approve เมื่อผ่านทุกเงื่อนไข
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="label" style={{ marginBottom: 4 }}>ยอมรับส่วนต่างยอดเงิน (บาท)</div>
            <input type="number" className="input" value={state.amountTolerance}
              onChange={e => setAmountTolerance(e.target.value)} min={0} step={1} />
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>0 = ยอดต้องตรงเป๊ะ</div>
          </div>
        </div>
      </div>

      {/* Save */}
      <button className="btn btn-primary" disabled={state.saving} onClick={onSave}
        style={{ width: '100%', height: 38, fontSize: 13, fontWeight: 600, marginTop: 16 }}>
        {state.saving ? 'กำลังบันทึก...' : state.hasConfig ? 'อัพเดทการตั้งค่า EasySlip' : 'เปิดใช้งาน EasySlip'}
      </button>
    </div>
  )
}
