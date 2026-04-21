// Lottery type dropdown with optgroup (shared between filter bar + create modal)
// Parent: src/components/rounds/{FilterBar,CreateModal}.tsx

'use client'

import { CATEGORY_GROUPS, type LotteryType } from './types'

interface Props {
  value: string
  onChange: (v: string) => void
  lotteryTypes: LotteryType[]
  placeholder?: string
  style?: React.CSSProperties
}

/** select + optgroup ตาม category — ใช้ซ้ำหลายที่ */
export default function LotterySelect({ value, onChange, lotteryTypes, placeholder = 'ทุกประเภทหวย', style }: Props) {
  return (
    <select className="input" value={value} onChange={e => onChange(e.target.value)} style={style}>
      <option value="">{placeholder}</option>
      {CATEGORY_GROUPS.map(cat => {
        const items = lotteryTypes.filter(lt => lt.status === 'active' && (lt.category || '') === cat.key)
        if (items.length === 0) return null
        return (
          <optgroup key={cat.key} label={cat.label}>
            {items.map(lt => (
              <option key={lt.id} value={String(lt.id)}>{lt.icon ? `${lt.icon} ` : ''}{lt.name}</option>
            ))}
          </optgroup>
        )
      })}
    </select>
  )
}
