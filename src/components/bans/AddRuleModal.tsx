// Component: AddRuleModal — เพิ่มกฎอั้น (manual)
// Parent: src/app/bans/auto/page.tsx

'use client'

import { BET_TYPES, actionConfig, LotteryType } from './shared'

export interface AddRuleForm {
  bet_type: string
  threshold_amount: string
  action: string
  reduce_rate_to: string
  max_per_person: string
}

interface Props {
  selectedType: LotteryType | null
  form: AddRuleForm
  setForm: (f: AddRuleForm) => void
  onClose: () => void
  onSubmit: () => void
}

export default function AddRuleModal({ selectedType, form, setForm, onClose, onSubmit }: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-6">
      <div className="card-surface p-6 max-w-md w-full rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold">เพิ่มกฎอั้น — {selectedType?.name}</h3>
          <button onClick={onClose} className="btn btn-ghost text-lg">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">ประเภทแทง</label>
            <select
              value={form.bet_type}
              onChange={e => setForm({ ...form, bet_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              {BET_TYPES.map(bt => <option key={bt}>{bt}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">ยอดรวม Threshold (฿)</label>
            <input
              type="number"
              value={form.threshold_amount}
              onChange={e => setForm({ ...form, threshold_amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              placeholder="50000"
            />
            <div className="text-[11px] text-[var(--text-tertiary)] mt-1">เมื่อยอดรวมทุกคนต่อเลข เกินค่านี้ → trigger</div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">Action</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(actionConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, action: key })}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    form.action === key ? 'text-white shadow-md' : 'text-[var(--text-secondary)]'
                  }`}
                  style={{ background: form.action === key ? 'var(--accent-primary)' : 'var(--bg-tertiary)' }}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {form.action === 'reduce_rate' && (
            <div>
              <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">ลดเรทเหลือ (x)</label>
              <input
                type="number"
                value={form.reduce_rate_to}
                onChange={e => setForm({ ...form, reduce_rate_to: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                placeholder="500"
              />
            </div>
          )}

          {form.action === 'max_amount' && (
            <div>
              <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">จำกัดยอดต่อคน (฿)</label>
              <input
                type="number"
                value={form.max_per_person}
                onChange={e => setForm({ ...form, max_per_person: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                placeholder="100"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-ghost flex-1">ยกเลิก</button>
          <button onClick={onSubmit} className="btn btn-primary flex-1">บันทึก</button>
        </div>
      </div>
    </div>
  )
}
