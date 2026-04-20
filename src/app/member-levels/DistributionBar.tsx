/**
 * DistributionBar — แท่งแนวนอนสำหรับ distribution chart
 * แสดง: ชื่อ level + bar (% ของทั้งหมด) + count
 */
export default function DistributionBar({ name, color, count, pct, muted }: {
  name: string
  color: string
  count: number
  pct: number
  muted?: boolean
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '100px 1fr 90px',
      alignItems: 'center',
      gap: 10,
      opacity: muted ? 0.65 : 1,
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
        {name}
      </span>
      <div style={{
        height: 18,
        background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
        borderRadius: 9,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
          height: '100%',
          background: color,
          borderRadius: 9,
          transition: 'width 400ms ease',
        }} />
      </div>
      <span className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
        {count.toLocaleString('th-TH')} ({pct.toFixed(1)}%)
      </span>
    </div>
  )
}
