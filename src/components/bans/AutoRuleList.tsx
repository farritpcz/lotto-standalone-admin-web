// Component: AutoRuleList — list of auto-ban rules with progress bar visualization
// Parent: src/app/bans/auto/page.tsx

'use client'

import { AutoBanRuleData } from '@/lib/api'
import { LotteryType, fmtMoney, getBetTypeLabel } from './shared'

interface Props {
  selectedType: LotteryType
  rules: AutoBanRuleData[]
  onAdd: () => void
  onClearAll: () => void
  onEdit: (rule: AutoBanRuleData) => void
}

export default function AutoRuleList({ selectedType, rules, onAdd, onClearAll, onEdit }: Props) {
  return (
    <div className="card-surface">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
        <h2 className="text-base font-semibold">กฎอั้นอัตโนมัติ — {selectedType.name}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-tertiary)]">{rules.length} กฎ</span>
          {rules.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
            >
              🗑️ เคลียร์ทั้งหมด
            </button>
          )}
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="p-12 text-center text-[var(--text-tertiary)]">
          <div className="text-3xl mb-2">📋</div>
          <div className="text-sm">ยังไม่มีกฎอั้นสำหรับ {selectedType.name}</div>
          <button onClick={onAdd} className="btn btn-primary mt-4 text-sm">+ เพิ่มกฎ</button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-color)]">
          {(() => {
            const grouped: Record<string, AutoBanRuleData[]> = {}
            rules.forEach(r => {
              if (!grouped[r.bet_type]) grouped[r.bet_type] = []
              grouped[r.bet_type].push(r)
            })

            return Object.entries(grouped).map(([betType, groupRules]) => {
              const sorted = [...groupRules].sort((a, b) => a.threshold_amount - b.threshold_amount)
              const rate = sorted[0]?.rate || 0
              const maxThreshold = sorted[sorted.length - 1]?.threshold_amount || 1

              return (
                <div key={betType} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-bold text-sm">{getBetTypeLabel(betType)}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                      rate x{rate}
                    </span>
                    <span className="flex-1" />
                    <span className="text-[10px] text-[var(--text-tertiary)]">{sorted.length} ระดับ</span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-tertiary)', height: '48px' }}>
                    <div className="absolute inset-0 flex">
                      {sorted.map((r, i) => {
                        const width = i === 0
                          ? (r.threshold_amount / maxThreshold) * 100
                          : ((r.threshold_amount - sorted[i - 1].threshold_amount) / maxThreshold) * 100
                        const bgColor = r.action === 'full_ban' ? '#ef4444'
                          : r.action === 'max_amount' ? '#3b82f6'
                          : `rgba(245,166,35,${0.4 + (i / sorted.length) * 0.6})`
                        return (
                          <div
                            key={r.id}
                            className="h-full flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
                            style={{ width: `${width}%`, background: bgColor, minWidth: '30px' }}
                            onClick={() => onEdit({ ...r })}
                            title={`${r.action === 'full_ban' ? 'อั้นเต็ม' : r.action === 'max_amount' ? 'จำกัดยอด' : `ลดเรท x${r.reduced_rate}`} — ${fmtMoney(r.threshold_amount)}`}
                          >
                            <span className="text-white text-[9px] font-bold truncate px-1">
                              {r.action === 'full_ban' ? '🚫' : r.action === 'max_amount' ? '📊' : `x${r.reduced_rate}`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Labels ด้านล่าง */}
                  <div className="flex mt-1.5">
                    {sorted.map((r, i) => {
                      const width = i === 0
                        ? (r.threshold_amount / maxThreshold) * 100
                        : ((r.threshold_amount - sorted[i - 1].threshold_amount) / maxThreshold) * 100
                      return (
                        <div key={r.id} className="text-center" style={{ width: `${width}%`, minWidth: '30px' }}>
                          <div className="text-[9px] font-mono font-bold text-yellow-400 truncate">
                            {fmtMoney(r.threshold_amount)}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-2 text-[9px] text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#3b82f6' }} /> จำกัดยอด</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#f5a623' }} /> ลดเรท</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#ef4444' }} /> อั้นเต็ม</span>
                    <span className="flex-1" />
                    <span>กดที่แถบเพื่อแก้ไข</span>
                  </div>
                </div>
              )
            })
          })()}
        </div>
      )}
    </div>
  )
}
