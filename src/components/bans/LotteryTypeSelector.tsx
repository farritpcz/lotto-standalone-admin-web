// Component: LotteryTypeSelector — dropdown จัดกลุ่มตาม category
// Parent: src/app/bans/auto/page.tsx

'use client'

import { LotteryType } from './shared'

interface Props {
  lotteryTypes: LotteryType[]
  selectedId: number | null
  onChange: (lt: LotteryType | null) => void
}

export default function LotteryTypeSelector({ lotteryTypes, selectedId, onChange }: Props) {
  const cats = [
    { key: 'thai', label: 'หวยไทย' }, { key: 'yeekee', label: 'ยี่กี' },
    { key: 'lao', label: 'หวยลาว' }, { key: 'hanoi', label: 'หวยฮานอย' },
    { key: 'malay', label: 'มาเลย์' }, { key: 'stock', label: 'หวยหุ้น' },
  ]

  return (
    <div className="mb-4">
      <label className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-1 block">เลือกประเภทหวย</label>
      <select
        className="input"
        style={{ width: 'auto', minWidth: 260, height: 40, fontSize: 14, fontWeight: 600 }}
        value={selectedId || ''}
        onChange={e => {
          const id = Number(e.target.value)
          onChange(lotteryTypes.find(lt => lt.id === id) || null)
        }}
      >
        {cats.map(cat => {
          const grouped = lotteryTypes.filter(lt => {
            const c = (lt as unknown) as Record<string, unknown>
            return c.category === cat.key || (cat.key === 'stock' && lt.name.includes('หุ้น'))
              || (cat.key === 'thai' && (lt.name.includes('รัฐบาล') || lt.name.includes('ธกส') || lt.name.includes('ออมสิน')))
              || (cat.key === 'yeekee' && lt.name.includes('ยี่กี'))
              || (cat.key === 'lao' && lt.name.includes('ลาว'))
              || (cat.key === 'hanoi' && lt.name.includes('ฮานอย'))
              || (cat.key === 'malay' && lt.name.includes('มาเลย์'))
          })
          if (grouped.length === 0) return null
          return (
            <optgroup key={cat.key} label={`── ${cat.label} ──`}>
              {grouped.map(lt => (
                <option key={lt.id} value={lt.id}>{lt.name}</option>
              ))}
            </optgroup>
          )
        })}
      </select>
    </div>
  )
}
