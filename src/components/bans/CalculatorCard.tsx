// Component: CalculatorCard — 🧮 คำนวณกฎอั้นอัตโนมัติ + preview
// Parent: src/app/bans/auto/page.tsx

'use client'

import { actionConfig, fmtMoney, LotteryType, PreviewRule } from './shared'

interface Props {
  capital: string
  maxLoss: string
  selectedType: LotteryType | null
  showPreview: boolean
  previewRules: PreviewRule[]
  lotteryTypes: LotteryType[]
  saving: boolean
  setCapital: (v: string) => void
  setMaxLoss: (v: string) => void
  onCalculate: () => void
  onCancel: () => void
  onApply: () => void
}

export default function CalculatorCard({
  capital, maxLoss, selectedType, showPreview, previewRules, lotteryTypes, saving,
  setCapital, setMaxLoss, onCalculate, onCancel, onApply,
}: Props) {
  const activeCount = lotteryTypes.filter(lt => lt.status === 'active').length

  return (
    <div className="card-surface p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🧮</span>
        <h3 className="text-sm font-bold">คำนวณกฎอั้นอัตโนมัติ</h3>
        <span className="text-xs text-[var(--text-tertiary)]">— กรอกทุน + ยอมเสียสูงสุด ระบบจะคำนวณ threshold ให้</span>
      </div>
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <label className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-1 block">ทุนทั้งหมด (฿)</label>
          <input type="number" value={capital} onChange={e => setCapital(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            placeholder="100,000" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-1 block">ยอมเสียสูงสุดต่อรอบ (฿)</label>
          <input type="number" value={maxLoss} onChange={e => setMaxLoss(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border-color)]"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            placeholder="20,000" />
        </div>
        <button onClick={onCalculate}
          disabled={!selectedType || !maxLoss || Number(maxLoss) <= 0}
          className="btn btn-primary px-6 py-2 text-sm disabled:opacity-40">
          🧮 คำนวณ
        </button>
      </div>

      {/* Preview */}
      {showPreview && previewRules.length > 0 && (
        <div className="mt-4 border-t border-[var(--border-color)] pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold">
              ผลคำนวณ — {selectedType?.name}
              <span className="text-xs text-[var(--text-tertiary)] ml-2">
                (ทุน {fmtMoney(Number(capital || 0))} | ยอมเสีย {fmtMoney(Number(maxLoss))})
              </span>
            </h4>
            <div className="flex gap-2">
              <button onClick={onCancel} className="btn btn-ghost text-xs">ยกเลิก</button>
              <button onClick={onApply} disabled={saving} className="btn btn-primary text-xs disabled:opacity-50">
                {saving
                  ? `กำลังบันทึก (${activeCount} ประเภท)...`
                  : `✅ ใช้กฎเหล่านี้กับทุกหวย (${activeCount} ประเภท)`}
              </button>
            </div>
          </div>
          {(() => {
            const grouped: Record<string, PreviewRule[]> = {}
            previewRules.forEach(pr => {
              if (!grouped[pr.betType]) grouped[pr.betType] = []
              grouped[pr.betType].push(pr)
            })
            return Object.entries(grouped).map(([betType, levels]) => (
              <div key={betType} className="rounded-lg p-3 mb-2" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">{betType}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">rate x{levels[0]?.rate}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {levels.map((lv, i) => {
                    const ac = actionConfig[lv.action] || actionConfig.full_ban
                    return (
                      <div key={i} className="rounded-md p-2 text-center" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="text-[10px] mb-1">
                          <span className={`badge ${ac.cls}`} style={{ fontSize: '9px', padding: '1px 6px' }}>{ac.icon} {ac.label}</span>
                        </div>
                        <div className="text-sm font-bold text-yellow-400">{fmtMoney(lv.threshold)}</div>
                        {lv.action === 'reduce_rate' && lv.reducedRate > 0 && (
                          <div className="text-[9px] text-[var(--text-tertiary)]">เรท x{lv.reducedRate}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          })()}
          <div className="mt-2 text-[11px] text-[var(--text-tertiary)]">
            💡 8 ระดับขั้นบันได: จำกัดยอด → ลดเรท 10%→20%→35%→50%→65%→80% → อั้นเต็ม (กระจายการลดเรท 6 ขั้น)
          </div>
        </div>
      )}
    </div>
  )
}
