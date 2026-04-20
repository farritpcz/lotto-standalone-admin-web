/**
 * TabNav — แถบแท็บ 4 แท็บของหน้า member detail
 *
 * Rule: UI-only
 * Related: app/members/[id]/page.tsx
 */
'use client'

export const TABS = [
  { key: 'info', label: 'ข้อมูลสมาชิก' },
  { key: 'credits', label: 'ประวัติเครดิต' },
  { key: 'bets', label: 'ประวัติการแทง' },
  { key: 'manage', label: 'จัดการ' },
] as const

export type TabKey = (typeof TABS)[number]['key']

interface Props {
  active: TabKey
  onChange: (key: TabKey) => void
}

export default function TabNav({ active, onChange }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
      }}
    >
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: active === tab.key ? 600 : 400,
            color: active === tab.key ? 'var(--accent-text)' : 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            borderBottom:
              active === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
