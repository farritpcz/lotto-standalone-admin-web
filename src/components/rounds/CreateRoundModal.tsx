// Modal สร้างรอบหวยใหม่
// Parent: src/app/rounds/page.tsx

'use client'

import LotterySelect from './LotterySelect'
import type { LotteryType, RoundFormData } from './types'

interface Props {
  form: RoundFormData
  setForm: (f: RoundFormData) => void
  lotteryTypes: LotteryType[]
  submitting: boolean
  onClose: () => void
  onSubmit: () => void
}

export default function CreateRoundModal({ form, setForm, lotteryTypes, submitting, onClose, onSubmit }: Props) {
  const isValid = form.lottery_type_id && form.round_number.trim() && form.round_date && form.open_time && form.close_time

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card-surface" style={{ width: '100%', maxWidth: 480, padding: 24, animation: 'fadeSlideUp 0.2s ease' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>สร้างรอบหวยใหม่</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>ประเภทหวย</label>
            <LotterySelect
              value={form.lottery_type_id}
              onChange={v => setForm({ ...form, lottery_type_id: v })}
              lotteryTypes={lotteryTypes}
              placeholder="— เลือกประเภทหวย —"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>เลขรอบ</label>
              <input className="input" style={{ fontFamily: 'var(--font-mono, monospace)' }} placeholder="20260401"
                value={form.round_number} onChange={e => setForm({ ...form, round_number: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>วันที่ออกผล</label>
              <input className="input" type="date" value={form.round_date} onChange={e => setForm({ ...form, round_date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>เวลาเปิดรับ</label>
              <input className="input" type="datetime-local" value={form.open_time} onChange={e => setForm({ ...form, open_time: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>เวลาปิดรับ</label>
              <input className="input" type="datetime-local" value={form.close_time} onChange={e => setForm({ ...form, close_time: e.target.value })} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={onSubmit} disabled={submitting || !isValid}>
            {submitting ? 'กำลังสร้าง...' : 'สร้างรอบหวย'}
          </button>
        </div>
      </div>
    </div>
  )
}
