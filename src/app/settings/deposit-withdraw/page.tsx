/**
 * Admin — ตั้งค่าระบบฝาก/ถอน (Deposit/Withdraw Settings)
 * ⭐ ตั้งค่าได้ครบ: ขั้นต่ำ/สูงสุด, อัตโนมัติ, จำกัดต่อวัน, ช่วงเวลา, ข้อความ
 */
'use client'

import { useEffect, useState } from 'react'
import { settingApi } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import { ArrowDownToLine, ArrowUpFromLine, Clock, Shield, MessageSquare, AlertTriangle } from 'lucide-react'

interface Settings {
  // ฝากเงิน
  min_deposit: string
  max_deposit: string
  max_deposit_per_day: string
  max_deposit_count_per_day: string
  auto_approve_deposit: string
  auto_approve_deposit_max: string
  deposit_open_time: string
  deposit_close_time: string
  deposit_note: string
  // ถอนเงิน
  min_withdraw: string
  max_withdraw: string
  max_withdraw_per_day: string
  max_withdraw_count_per_day: string
  auto_approve_withdraw: string
  auto_approve_withdraw_max: string
  withdraw_open_time: string
  withdraw_close_time: string
  withdraw_fee_percent: string
  withdraw_fee_min: string
  withdraw_hold_minutes: string
  withdraw_note: string
  // ถอน — ตรวจสอบยอดสูง
  withdraw_review_threshold: string
  // ทั่วไป
  maintenance_deposit: string
  maintenance_withdraw: string
  new_member_first_deposit_bonus: string
  new_member_first_deposit_bonus_max: string
  new_member_first_deposit_turnover: string
}

const DEFAULTS: Settings = {
  min_deposit: '100', max_deposit: '0', max_deposit_per_day: '0', max_deposit_count_per_day: '0',
  auto_approve_deposit: 'false', auto_approve_deposit_max: '5000',
  deposit_open_time: '00:00', deposit_close_time: '23:59', deposit_note: '',
  min_withdraw: '300', max_withdraw: '0', max_withdraw_per_day: '50000', max_withdraw_count_per_day: '5',
  auto_approve_withdraw: 'false', auto_approve_withdraw_max: '3000',
  withdraw_open_time: '00:00', withdraw_close_time: '23:59',
  withdraw_fee_percent: '0', withdraw_fee_min: '0', withdraw_hold_minutes: '0', withdraw_note: '',
  withdraw_review_threshold: '10000',
  maintenance_deposit: 'false', maintenance_withdraw: 'false',
  new_member_first_deposit_bonus: '0', new_member_first_deposit_bonus_max: '0',
  new_member_first_deposit_turnover: '1',
}

export default function DepositWithdrawSettingsPage() {
  const { toast } = useToast()
  const [s, setS] = useState<Settings>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    settingApi.get().then(res => {
      const all = res.data.data || []
      const mapped = { ...DEFAULTS }
      for (const item of all) {
        if (item.key in mapped) (mapped as Record<string, string>)[item.key] = item.value
      }
      setS(mapped)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingApi.update(s as unknown as Record<string, string>)
      toast.success('บันทึกสำเร็จ')
    } catch { toast.error('บันทึกไม่สำเร็จ') }
    setSaving(false)
  }

  const u = (key: keyof Settings, val: string) => setS(prev => ({ ...prev, [key]: val }))
  const toggle = (key: keyof Settings) => u(key, s[key] === 'true' ? 'false' : 'true')

  if (loading) return <Loading />

  const inputStyle = 'input'
  const labelStyle = { fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 } as const
  const hintStyle = { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 } as const

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ตั้งค่าระบบฝาก/ถอน</h1>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         ปิดปรับปรุง (Maintenance)
         ══════════════════════════════════════════════════════════════ */}
      {(s.maintenance_deposit === 'true' || s.maintenance_withdraw === 'true') && (
        <div style={{ background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} color="#FF9F0A" />
          <span style={{ fontSize: 13, color: '#FF9F0A', fontWeight: 500 }}>
            {s.maintenance_deposit === 'true' && s.maintenance_withdraw === 'true' ? 'ระบบฝากและถอนเงินปิดปรับปรุง' :
             s.maintenance_deposit === 'true' ? 'ระบบฝากเงินปิดปรับปรุง' : 'ระบบถอนเงินปิดปรับปรุง'}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* ════════════════════════════════════════════════
           ฝากเงิน
           ════════════════════════════════════════════════ */}
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownToLine size={16} color="var(--status-success)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>ฝากเงิน</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>กำหนดเงื่อนไขการฝาก</div>
            </div>
          </div>

          {/* ปิดปรับปรุง */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, cursor: 'pointer', color: s.maintenance_deposit === 'true' ? '#FF9F0A' : 'var(--text-secondary)' }}>
            <input type="checkbox" checked={s.maintenance_deposit === 'true'} onChange={() => toggle('maintenance_deposit')} style={{ accentColor: '#FF9F0A' }} />
            ปิดปรับปรุงระบบฝากเงิน
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>ขั้นต่ำ (บาท)</div>
              <input type="number" className={inputStyle} value={s.min_deposit} onChange={e => u('min_deposit', e.target.value)} min={0} />
            </div>
            <div>
              <div style={labelStyle}>สูงสุดต่อครั้ง (บาท)</div>
              <input type="number" className={inputStyle} value={s.max_deposit} onChange={e => u('max_deposit', e.target.value)} min={0} />
              <div style={hintStyle}>0 = ไม่จำกัด</div>
            </div>
            <div>
              <div style={labelStyle}>สูงสุดต่อวัน (บาท)</div>
              <input type="number" className={inputStyle} value={s.max_deposit_per_day} onChange={e => u('max_deposit_per_day', e.target.value)} min={0} />
              <div style={hintStyle}>0 = ไม่จำกัด</div>
            </div>
            <div>
              <div style={labelStyle}>จำนวนครั้งต่อวัน</div>
              <input type="number" className={inputStyle} value={s.max_deposit_count_per_day} onChange={e => u('max_deposit_count_per_day', e.target.value)} min={0} />
              <div style={hintStyle}>0 = ไม่จำกัด</div>
            </div>
          </div>

          {/* อนุมัติอัตโนมัติ */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Shield size={14} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>อนุมัติอัตโนมัติ</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={s.auto_approve_deposit === 'true'} onChange={() => toggle('auto_approve_deposit')} style={{ accentColor: 'var(--accent)' }} />
              เปิดอนุมัติอัตโนมัติ
            </label>
            <div>
              <div style={labelStyle}>อนุมัติอัตโนมัติเฉพาะยอดไม่เกิน (บาท)</div>
              <input type="number" className={inputStyle} value={s.auto_approve_deposit_max} onChange={e => u('auto_approve_deposit_max', e.target.value)} min={0} />
              <div style={hintStyle}>ยอดฝาก ≤ {Number(s.auto_approve_deposit_max).toLocaleString()} บาท → อนุมัติทันที · ยอดเกิน → รอแอดมินตรวจสอบ · 0 = อนุมัติทุกยอด</div>
            </div>
          </div>

          {/* ช่วงเวลา */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Clock size={14} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>ช่วงเวลาเปิดฝาก</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={labelStyle}>เปิด</div>
                <input type="time" className={inputStyle} value={s.deposit_open_time} onChange={e => u('deposit_open_time', e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>ปิด</div>
                <input type="time" className={inputStyle} value={s.deposit_close_time} onChange={e => u('deposit_close_time', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ข้อความแจ้ง */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <MessageSquare size={14} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>ข้อความแจ้งสมาชิก</span>
            </div>
            <textarea className={inputStyle} value={s.deposit_note} onChange={e => u('deposit_note', e.target.value)}
              placeholder="เช่น ฝากขั้นต่ำ 100 บาท ฝากเงินผ่านบัญชีที่ลงทะเบียนเท่านั้น"
              style={{ height: 70, resize: 'vertical' }} />
          </div>
        </div>

        {/* ════════════════════════════════════════════════
           ถอนเงิน
           ════════════════════════════════════════════════ */}
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,59,48,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpFromLine size={16} color="var(--status-error)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>ถอนเงิน</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>กำหนดเงื่อนไขการถอน</div>
            </div>
          </div>

          {/* ปิดปรับปรุง */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, cursor: 'pointer', color: s.maintenance_withdraw === 'true' ? '#FF9F0A' : 'var(--text-secondary)' }}>
            <input type="checkbox" checked={s.maintenance_withdraw === 'true'} onChange={() => toggle('maintenance_withdraw')} style={{ accentColor: '#FF9F0A' }} />
            ปิดปรับปรุงระบบถอนเงิน
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelStyle}>ขั้นต่ำ (บาท)</div>
              <input type="number" className={inputStyle} value={s.min_withdraw} onChange={e => u('min_withdraw', e.target.value)} min={0} />
            </div>
            <div>
              <div style={labelStyle}>สูงสุดต่อครั้ง (บาท)</div>
              <input type="number" className={inputStyle} value={s.max_withdraw} onChange={e => u('max_withdraw', e.target.value)} min={0} />
              <div style={hintStyle}>0 = ไม่จำกัด</div>
            </div>
            <div>
              <div style={labelStyle}>สูงสุดต่อวัน (บาท)</div>
              <input type="number" className={inputStyle} value={s.max_withdraw_per_day} onChange={e => u('max_withdraw_per_day', e.target.value)} min={0} />
            </div>
            <div>
              <div style={labelStyle}>จำนวนครั้งต่อวัน</div>
              <input type="number" className={inputStyle} value={s.max_withdraw_count_per_day} onChange={e => u('max_withdraw_count_per_day', e.target.value)} min={0} />
              <div style={hintStyle}>0 = ไม่จำกัด</div>
            </div>
          </div>

          {/* ตรวจสอบยอดสูง */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <AlertTriangle size={14} color="#FF9F0A" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>ตรวจสอบยอดถอนสูง</span>
            </div>
            <div>
              <div style={labelStyle}>ยอดถอนเกิน (บาท) → เข้ารายการรอตรวจสอบ</div>
              <input type="number" className={inputStyle} value={s.withdraw_review_threshold} onChange={e => u('withdraw_review_threshold', e.target.value)} min={0} />
              <div style={hintStyle}>ยอดถอนที่เกินจำนวนนี้จะไม่อนุมัติอัตโนมัติ ต้องรอแอดมินตรวจสอบก่อน · 0 = ปิดใช้งาน</div>
            </div>
          </div>

          {/* ค่าธรรมเนียม */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>ค่าธรรมเนียมถอน</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={labelStyle}>ค่าธรรมเนียม (%)</div>
                <input type="number" className={inputStyle} value={s.withdraw_fee_percent} onChange={e => u('withdraw_fee_percent', e.target.value)} min={0} step="0.1" />
                <div style={hintStyle}>0 = ไม่เก็บค่าธรรมเนียม</div>
              </div>
              <div>
                <div style={labelStyle}>ค่าธรรมเนียมขั้นต่ำ (บาท)</div>
                <input type="number" className={inputStyle} value={s.withdraw_fee_min} onChange={e => u('withdraw_fee_min', e.target.value)} min={0} />
              </div>
            </div>
          </div>

          {/* อนุมัติอัตโนมัติ */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Shield size={14} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>อนุมัติอัตโนมัติ</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={s.auto_approve_withdraw === 'true'} onChange={() => toggle('auto_approve_withdraw')} style={{ accentColor: 'var(--accent)' }} />
              เปิดอนุมัติอัตโนมัติ
            </label>
            <div>
              <div style={labelStyle}>อนุมัติอัตโนมัติเฉพาะยอดไม่เกิน (บาท)</div>
              <input type="number" className={inputStyle} value={s.auto_approve_withdraw_max} onChange={e => u('auto_approve_withdraw_max', e.target.value)} min={0} />
              <div style={hintStyle}>ยอดถอน ≤ {Number(s.auto_approve_withdraw_max).toLocaleString()} → อนุมัติทันที · ยอดเกิน → รอแอดมินตรวจสอบ · 0 = ทุกยอด</div>
            </div>
          </div>

          {/* ช่วงเวลา */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Clock size={14} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>ช่วงเวลาเปิดถอน</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={labelStyle}>เปิด</div>
                <input type="time" className={inputStyle} value={s.withdraw_open_time} onChange={e => u('withdraw_open_time', e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>ปิด</div>
                <input type="time" className={inputStyle} value={s.withdraw_close_time} onChange={e => u('withdraw_close_time', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ข้อความแจ้ง */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <MessageSquare size={14} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>ข้อความแจ้งสมาชิก</span>
            </div>
            <textarea className={inputStyle} value={s.withdraw_note} onChange={e => u('withdraw_note', e.target.value)}
              placeholder="เช่น ถอนขั้นต่ำ 300 บาท ดำเนินการภายใน 5 นาที"
              style={{ height: 70, resize: 'vertical' }} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         โบนัสสมาชิกใหม่
         ══════════════════════════════════════════════════════════════ */}
      <div className="card-surface" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>โบนัสสมาชิกใหม่ (ฝากครั้งแรก)</div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 14 }}>
          สูตร: เทิร์นโอเวอร์ที่ต้องทำ = (ยอดฝาก + โบนัส) x เทิร์นโอเวอร์
          {s.new_member_first_deposit_bonus !== '0' && (
            <span style={{ color: 'var(--accent)', marginLeft: 8 }}>
              ตัวอย่าง: ฝาก 1,000 + โบนัส {Math.min(Number(s.new_member_first_deposit_bonus) / 100 * 1000, Number(s.new_member_first_deposit_bonus_max) || Infinity).toLocaleString()} = ต้องเทิร์น {((1000 + Math.min(Number(s.new_member_first_deposit_bonus) / 100 * 1000, Number(s.new_member_first_deposit_bonus_max) || Infinity)) * Number(s.new_member_first_deposit_turnover || 1)).toLocaleString()} บาท
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <div style={labelStyle}>โบนัส (%)</div>
            <input type="number" className={inputStyle} value={s.new_member_first_deposit_bonus} onChange={e => u('new_member_first_deposit_bonus', e.target.value)} min={0} />
            <div style={hintStyle}>0 = ไม่มีโบนัส</div>
          </div>
          <div>
            <div style={labelStyle}>โบนัสสูงสุด (บาท)</div>
            <input type="number" className={inputStyle} value={s.new_member_first_deposit_bonus_max} onChange={e => u('new_member_first_deposit_bonus_max', e.target.value)} min={0} />
            <div style={hintStyle}>0 = ไม่จำกัด</div>
          </div>
          <div>
            <div style={labelStyle}>เทิร์นโอเวอร์ (เท่า)</div>
            <input type="number" className={inputStyle} value={s.new_member_first_deposit_turnover} onChange={e => u('new_member_first_deposit_turnover', e.target.value)} min={0} step="0.5" />
            <div style={hintStyle}>เช่น 5 = ต้องแทง 5 เท่า</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         ปุ่มบันทึก
         ══════════════════════════════════════════════════════════════ */}
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}
        style={{ width: '100%', height: 44, fontSize: 14, fontWeight: 600 }}>
        {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
      </button>

      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-tertiary)', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, lineHeight: 1.6 }}>
        หมายเหตุ: ค่า 0 = ไม่จำกัด · อนุมัติอัตโนมัติควรใช้ร่วมกับระบบตรวจสอบ · ช่วงเวลาเปิด 00:00-23:59 = ตลอด 24 ชม.
      </div>
    </div>
  )
}
