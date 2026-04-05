/**
 * LogHistoryModal — Timeline modal แสดงประวัติรายการฝาก/ถอน
 *
 * รวมข้อมูลจาก 3 แหล่ง:
 * 1. Request record → "สร้างคำขอ"
 * 2. Activity logs → action ที่แอดมินทำ + ใคร
 * 3. Transactions → ผลกระทบทางการเงิน
 *
 * UI: vertical timeline (dot สี + เส้นเชื่อม + content)
 * สี dot ตาม type: create=gray, approve=green, reject=red, cancel=orange, bonus=purple, refund=green
 */
'use client'

import { useEffect, useState } from 'react'
import { Clock, X, Loader2 } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────
interface LogEntry {
  timestamp: string
  action: string
  description: string
  actor: string
  type: 'create' | 'approve' | 'reject' | 'cancel' | 'bonus' | 'refund'
  amount?: number
}

interface LogHistoryModalProps {
  title: string
  requestId: number
  fetchLogs: (id: number) => Promise<{ data: { data: LogEntry[] } }>
  onClose: () => void
}

// ─── สีตาม type ─────────────────────────────────────────────────────
const typeColors: Record<string, { dot: string; bg: string }> = {
  create:  { dot: 'var(--text-tertiary)',  bg: 'var(--surface-elevated)' },
  approve: { dot: 'var(--status-success)', bg: 'rgba(34,197,94,0.1)' },
  reject:  { dot: 'var(--status-error)',   bg: 'rgba(239,68,68,0.1)' },
  cancel:  { dot: 'var(--status-warning)', bg: 'rgba(245,158,11,0.1)' },
  bonus:   { dot: '#a855f7',               bg: 'rgba(168,85,247,0.1)' },
  refund:  { dot: 'var(--status-success)', bg: 'rgba(34,197,94,0.1)' },
}

// ─── Component ──────────────────────────────────────────────────────
export default function LogHistoryModal({ title, requestId, fetchLogs, onClose }: LogHistoryModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchLogs(requestId)
      .then(res => {
        setLogs(res.data?.data || [])
      })
      .catch(() => setError('ไม่สามารถโหลดประวัติได้'))
      .finally(() => setLoading(false))
  }, [requestId, fetchLogs])

  const fmtDate = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 250,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div className="card-surface" style={{ width: '100%', maxWidth: 480, padding: 0, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={18} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>#{requestId}</div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0, minWidth: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 size={24} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', color: 'var(--status-error)', padding: 24, fontSize: 13 }}>
              {error}
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 24, fontSize: 13 }}>
              ไม่มีประวัติ
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div style={{ position: 'relative' }}>
              {logs.map((log, i) => {
                const colors = typeColors[log.type] || typeColors.create
                const isLast = i === logs.length - 1
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: isLast ? 0 : 20 }}>
                    {/* Dot + Line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: colors.dot, border: '2px solid var(--surface)',
                        boxShadow: `0 0 0 2px ${colors.dot}33`,
                        zIndex: 1,
                      }} />
                      {!isLast && (
                        <div style={{
                          width: 2, flex: 1, minHeight: 20,
                          background: 'var(--border)',
                        }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{
                      flex: 1, background: colors.bg,
                      borderRadius: 10, padding: '10px 14px',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.dot }}>
                          {log.action}
                        </div>
                        {log.actor && (
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                            {log.actor}
                          </div>
                        )}
                      </div>
                      {log.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                          {log.description}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                        {fmtDate(log.timestamp)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ height: 34, fontSize: 13 }}>
            ปิด
          </button>
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
