/**
 * DateFilterBar — segmented control สำหรับเลือกช่วงเวลา + custom range
 *
 * Rule: UI-only; parent เป็น source of truth ของ preset/from/to
 * Related: components/dashboard/types.ts, app/dashboard/page.tsx
 */
'use client'
import { PRESETS, type FilterPreset } from './types'

interface Props {
  activePreset: FilterPreset
  customFrom: string
  customTo: string
  onPresetChange: (preset: FilterPreset) => void
  onCustomFromChange: (v: string) => void
  onCustomToChange: (v: string) => void
  onCustomSearch: () => void
}

export default function DateFilterBar({
  activePreset,
  customFrom,
  customTo,
  onPresetChange,
  onCustomFromChange,
  onCustomToChange,
  onCustomSearch,
}: Props) {
  return (
    <div
      style={{
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <div
        className="segmented"
        style={{
          display: 'inline-flex',
          gap: 2,
          padding: 3,
          flexWrap: 'wrap',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {PRESETS.map(p => {
          const active = activePreset === p.key
          return (
            <button
              key={p.key}
              onClick={() => onPresetChange(p.key)}
              data-active={active}
              style={{
                height: 30,
                padding: '0 14px',
                border: 'none',
                background: active ? 'var(--bg-elevated)' : 'transparent',
                color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                fontSize: 12.5,
                fontWeight: active ? 600 : 500,
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: active
                  ? 'var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : 'none',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {activePreset === 'custom' && (
        <>
          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
          <input
            type="date"
            value={customFrom}
            onChange={e => onCustomFromChange(e.target.value)}
            className="input"
            style={{ height: 30, fontSize: 12, width: 140, padding: '0 8px' }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ถึง</span>
          <input
            type="date"
            value={customTo}
            onChange={e => onCustomToChange(e.target.value)}
            className="input"
            style={{ height: 30, fontSize: 12, width: 140, padding: '0 8px' }}
          />
          <button
            onClick={onCustomSearch}
            className="btn btn-primary"
            style={{ height: 30, fontSize: 12, padding: '0 14px' }}
          >
            ค้นหา
          </button>
        </>
      )}
    </div>
  )
}
