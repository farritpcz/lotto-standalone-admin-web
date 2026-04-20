/**
 * Loading Component — ใช้ทั้งระบบ
 *
 * 3 แบบ:
 * 1. <Loading /> — fullpage spinner (กลางจอ)
 * 2. <Loading inline /> — inline spinner (ในกล่อง)
 * 3. <LoadingSkeleton rows={5} /> — skeleton shimmer
 */
'use client'

// ─── Fullpage / Inline Spinner ─────────────────────────────────────
export default function Loading({ inline, text }: { inline?: boolean; text?: string }) {
  if (inline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }}>
        <Spinner size={20} />
        {text && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{text}</span>}
      </div>
    )
  }

  return (
    <div className="page-container" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 16,
    }}>
      <Spinner size={36} />
      <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
        {text || 'กำลังโหลดข้อมูล...'}
      </span>
    </div>
  )
}

// ─── Spinner Circle ────────────────────────────────────────────────
function Spinner({ size = 24 }: { size?: number }) {
  // Conic gradient spinner — premium look (teal → cyan sweep)
  const thickness = Math.max(2, size / 10)
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: 'conic-gradient(from 0deg, transparent 0deg, var(--accent) 300deg, var(--accent-strong) 360deg)',
      mask: `radial-gradient(farthest-side, transparent calc(50% - ${thickness}px), #000 calc(50% - ${thickness}px + 1px))`,
      WebkitMask: `radial-gradient(farthest-side, transparent calc(50% - ${thickness}px), #000 calc(50% - ${thickness}px + 1px))`,
      animation: 'spin 0.9s linear infinite',
      filter: 'drop-shadow(0 0 4px var(--accent-ring))',
    }} />
  )
}

// ─── Skeleton Shimmer ──────────────────────────────────────────────
export function LoadingSkeleton({ rows = 3, style }: { rows?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 4, ...style }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: 14, borderRadius: 6,
          width: `${60 + Math.random() * 40}%`,
          background: 'linear-gradient(90deg, var(--bg-elevated) 0%, var(--bg-raised) 40%, var(--accent-subtle) 50%, var(--bg-raised) 60%, var(--bg-elevated) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.8s ease-in-out infinite',
          animationDelay: `${i * 0.08}s`,
        }} />
      ))}
    </div>
  )
}

// ─── Dashboard Skeleton (full layout) ──────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ height: 20, width: 140, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ height: 32, width: 80, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
      </div>

      {/* Filter bar skeleton */}
      <div className="card-surface" style={{ padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 8 }}>
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} style={{
            height: 30, width: 70 + i * 5, borderRadius: 6,
            background: i === 4 ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
            animation: 'shimmer 1.5s ease-in-out infinite',
            backgroundSize: '200% 100%',
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
          }} />
        ))}
      </div>

      {/* 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="card-surface" style={{ padding: '18px 20px', borderLeft: '3px solid rgba(255,255,255,0.1)' }}>
            <div style={{ height: 11, width: 60, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />
            <div style={{
              height: 28, width: 140, borderRadius: 6,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }} />
            <div style={{ height: 10, width: 100, borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginTop: 12 }} />
          </div>
        ))}
      </div>

      {/* 2 columns: table + chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12, marginBottom: 20 }}>
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ height: 11, width: 150, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ height: 12, width: 80 + i * 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
              </div>
              <div style={{ height: 12, width: 50, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ height: 11, width: 180, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
          <div style={{
            height: 260, borderRadius: 8,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 2s ease-in-out infinite',
          }} />
        </div>
      </div>

      {/* 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[1,2,3].map(i => (
          <div key={i} className="card-surface" style={{ padding: 20 }}>
            <div style={{ height: 11, width: 100, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
            {[1,2,3].map(j => (
              <div key={j} style={{
                height: 12, width: `${50 + j * 15}%`, borderRadius: 4,
                background: 'rgba(255,255,255,0.04)', marginBottom: 10,
              }} />
            ))}
          </div>
        ))}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </div>
  )
}
