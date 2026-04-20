// Component: EditRuleModal — แก้ไขกฎอั้น
// Parent: src/app/bans/auto/page.tsx

'use client'

import { AutoBanRuleData } from '@/lib/api'
import { actionConfig, getBetTypeLabel } from './shared'

interface Props {
  rule: AutoBanRuleData
  setRule: (r: AutoBanRuleData) => void
  onClose: () => void
  onSubmit: () => void
}

export default function EditRuleModal({ rule, setRule, onClose, onSubmit }: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-6">
      <div className="card-surface p-6 max-w-md w-full rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold">แก้ไขกฎอั้น — {getBetTypeLabel(rule.bet_type)}</h3>
          <button onClick={onClose} className="btn btn-ghost text-lg">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">Threshold (฿)</label>
            <input
              type="number"
              value={rule.threshold_amount}
              onChange={e => setRule({ ...rule, threshold_amount: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">Action</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(actionConfig).filter(([k]) => k !== 'max_amount').map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setRule({ ...rule, action: key })}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    rule.action === key ? 'text-white shadow-md' : 'text-[var(--text-secondary)]'
                  }`}
                  style={{ background: rule.action === key ? 'var(--accent-primary)' : 'var(--bg-tertiary)' }}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {rule.action === 'reduce_rate' && (
            <div>
              <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">ลดเรทเหลือ (x)</label>
              <input
                type="number"
                value={rule.reduced_rate}
                onChange={e => setRule({ ...rule, reduced_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                placeholder="500"
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
