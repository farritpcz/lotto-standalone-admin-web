// Component: AccountFormModal — modal เพิ่ม/แก้ไขบัญชีธนาคาร
// Parent: src/app/settings/bank-accounts/page.tsx

'use client'

import ImageUpload from '@/components/ImageUpload'
import { BANK_OPTIONS, BankAccountForm } from './types'

interface Props {
  editing: boolean
  form: BankAccountForm
  saving: boolean
  setForm: (fn: (f: BankAccountForm) => BankAccountForm) => void
  onClose: () => void
  onSave: () => void
}

export default function AccountFormModal({ editing, form, saving, setForm, onClose, onSave }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '24px', maxWidth: 440, width: '100%',
        animation: 'fadeSlideUp 0.2s ease', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
          {editing ? 'แก้ไขบัญชีธนาคาร' : 'เพิ่มบัญชีธนาคาร'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ธนาคาร */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>ธนาคาร</div>
            <select className="input" value={form.bank_code}
              onChange={e => setForm(f => ({ ...f, bank_code: e.target.value }))}>
              {BANK_OPTIONS.map(b => (
                <option key={b.code} value={b.code}>{b.code} — {b.name}</option>
              ))}
            </select>
          </div>

          {/* เลขบัญชี */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>เลขบัญชี</div>
            <input type="text" className="input" placeholder="เช่น 4081234567"
              value={form.account_number}
              onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} />
          </div>

          {/* ชื่อบัญชี */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>ชื่อบัญชี</div>
            <input type="text" className="input" placeholder="เช่น บจก.ลอตโต้"
              value={form.account_name}
              onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} />
          </div>

          {/* ประเภทบัญชี */}
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
                  <input type="radio" name="account_type" value={opt.value}
                    checked={form.account_type === opt.value}
                    onChange={() => setForm(f => ({ ...f, account_type: opt.value as 'deposit' | 'withdraw' }))}
                    style={{ display: 'none' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: form.account_type === opt.value ? 'var(--accent)' : 'var(--text-primary)' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>

          {/* โหมด */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>โหมดการทำงาน</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'manual', label: 'มือ (Manual)', desc: 'แอดมินตรวจสอบเอง', color: 'var(--accent)' },
                { value: 'auto', label: 'ออโต้ (RKAUTO)', desc: 'ตรวจจับจาก SMS/ยอดเข้า', color: '#f5a623' },
                { value: 'easyslip', label: 'EasySlip', desc: 'ตรวจสลิปอัตโนมัติ', color: '#007AFF' },
              ].map(opt => (
                <label key={opt.value} style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${form.transfer_mode === opt.value ? opt.color : 'var(--border)'}`,
                  background: form.transfer_mode === opt.value ? `${opt.color}0F` : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="transfer_mode" value={opt.value}
                    checked={form.transfer_mode === opt.value}
                    onChange={() => setForm(f => ({ ...f, transfer_mode: opt.value as 'manual' | 'auto' | 'easyslip' }))}
                    style={{ display: 'none' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: form.transfer_mode === opt.value ? opt.color : 'var(--text-primary)' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>

          {/* บัญชีหลัก */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_default}
              onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
              style={{ accentColor: 'var(--accent)' }} />
            ตั้งเป็นบัญชีหลัก (แสดงในหน้าฝากเงิน)
          </label>

          {/* QR Code */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>QR Code (optional)</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              อัพรูป QR พร้อมเพย์ — ถ้ามี สมาชิกจะเห็น QR ตอนฝากเงิน (รองรับสแกนจากมือถือ)
            </div>
            <ImageUpload
              folder="bank"
              currentUrl={form.qr_code_url}
              onUploaded={(url) => setForm(f => ({ ...f, qr_code_url: url }))}
              size="md"
            />
          </div>

          {/* RKAUTO section */}
          {form.transfer_mode === 'auto' && (
            <div style={{ padding: 14, background: 'rgba(245,166,35,0.04)', borderRadius: 8, border: '1px solid rgba(245,166,35,0.2)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f5a623', marginBottom: 12 }}>
                RKAUTO — ตั้งค่าออโต้
              </div>

              <div style={{ marginBottom: 10 }}>
                <div className="label" style={{ marginBottom: 4 }}>ระบบธนาคาร</div>
                <select className="input" value={form.bank_system}
                  onChange={e => setForm(f => ({ ...f, bank_system: e.target.value }))}>
                  <option value="KBIZ">KBIZ — กสิกร K-BIZ</option>
                  <option value="SMS">SMS — SCB/KBANK ผ่าน SMS OTP</option>
                  <option value="BANK">BANK — GSB/TMW login ตรง</option>
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div className="label" style={{ marginBottom: 4 }}>Token 1 (จากการเจน RKAUTO)</div>
                <input type="text" className="input"
                  placeholder="วาง token ตัวที่ 1..."
                  value={form.rkauto_token1}
                  onChange={e => setForm(f => ({ ...f, rkauto_token1: e.target.value }))}
                  maxLength={150}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              </div>

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

          {/* EasySlip section */}
          {form.transfer_mode === 'easyslip' && (
            <div style={{ padding: 14, background: 'rgba(0,122,255,0.04)', borderRadius: 8, border: '1px solid rgba(0,122,255,0.2)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#007AFF', marginBottom: 8 }}>
                EasySlip — ตรวจสลิปอัตโนมัติ
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                สมาชิกอัปโหลดรูปสลิป → ระบบส่งไป EasySlip API ตรวจสอบ → ถ้าถูกต้องอนุมัติทันที
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
                ตั้งค่า API Key และเงื่อนไขได้ที่ส่วน <strong style={{ color: '#007AFF' }}>ตั้งค่า EasySlip</strong> ด้านล่าง
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-secondary" style={{ flex: 1, height: 38 }} onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" style={{ flex: 1, height: 38, fontWeight: 600 }}
            onClick={onSave} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : (editing ? 'บันทึกการแก้ไข' : 'เพิ่มบัญชี')}
          </button>
        </div>
      </div>
    </div>
  )
}
