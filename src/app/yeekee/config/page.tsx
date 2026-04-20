/**
 * Admin — Yeekee Config (ตั้งค่ายี่กี)
 *
 * - แสดง agent ทั้งหมด + สถานะเปิด/ปิดยี่กี
 * - toggle เปิด/ปิดแต่ละ agent (POST /yeekee/config)
 * - API: yeekeeMgmtApi.getConfig(), yeekeeMgmtApi.setConfig()
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { yeekeeMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'

// ── Types ──────────────────────────────────────────────────────────────────────
interface AgentConfig {
  agent_node_id: number
  agent_name: string
  agent_code: string
  enabled: boolean
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function YeekeeConfigPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [lotteryTypeId, setLotteryTypeId] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null) // agent_node_id ที่กำลัง toggle
  const [message, setMessage] = useState('')

  // ── Fetch config ───────────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      const res = await yeekeeMgmtApi.getConfig()
      const data = res.data.data
      setAgents(data?.agents || [])
      setLotteryTypeId(data?.lottery_type_id || 0)
    } catch {
      setMessage('โหลด config ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  // ── Toggle enable/disable ──────────────────────────────────────────────────
  const handleToggle = async (agent: AgentConfig) => {
    setToggling(agent.agent_node_id)
    setMessage('')
    try {
      const res = await yeekeeMgmtApi.setConfig({
        agent_node_id: agent.agent_node_id,
        enabled: !agent.enabled,
      })
      const msg = res.data.data?.message || (!agent.enabled ? 'เปิดยี่กีสำเร็จ' : 'ปิดยี่กีสำเร็จ')
      setMessage(msg)
      // อัพเดท state ทันที (ไม่ต้อง refetch)
      setAgents(prev => prev.map(a =>
        a.agent_node_id === agent.agent_node_id ? { ...a, enabled: !a.enabled } : a
      ))
    } catch {
      setMessage('เกิดข้อผิดพลาด')
    } finally {
      setToggling(null)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const isSuccess = message && !message.includes('ไม่สำเร็จ') && !message.includes('ผิดพลาด')
  const enabledCount = agents.filter(a => a.enabled).length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>ตั้งค่ายี่กี</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            เปิด/ปิดยี่กีแต่ละ Agent — เปิดอยู่ {enabledCount}/{agents.length} Agent
          </div>
        </div>
      </div>

      {/* ── Message ────────────────────────────────────────────────────────── */}
      {message && (
        <div style={{
          background: isSuccess ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: isSuccess ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {isSuccess ? '\u2713 ' : '\u2717 '}{message}
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading ? (
        <Loading inline text="กำลังโหลด config..." />
      ) : agents.length === 0 ? (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          ไม่พบ Agent ในระบบ — ต้องสร้าง Agent ก่อน
        </div>
      ) : (
        <>
          {/* ── Agent Cards ─────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {agents.map(agent => (
              <div
                key={agent.agent_node_id}
                className="card-surface"
                style={{
                  padding: 20,
                  borderColor: agent.enabled ? 'rgba(0,229,160,0.3)' : 'var(--border)',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Header: ชื่อ + code + badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {agent.agent_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {agent.agent_code} (ID: {agent.agent_node_id})
                    </div>
                  </div>
                  <span className={agent.enabled ? 'badge badge-success' : 'badge badge-neutral'}>
                    {agent.enabled ? 'เปิด' : 'ปิด'}
                  </span>
                </div>

                {/* Info */}
                <div style={{
                  background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px',
                  marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)',
                }}>
                  {agent.enabled ? (
                    <>ยี่กีเปิดใช้งาน — ระบบจะสร้างรอบอัตโนมัติและเปิดรับยิงเลข</>
                  ) : (
                    <>ยี่กีปิดอยู่ — จะไม่มีรอบใหม่สำหรับ Agent นี้</>
                  )}
                </div>

                {/* Toggle button */}
                <button
                  onClick={() => handleToggle(agent)}
                  disabled={toggling === agent.agent_node_id}
                  className={agent.enabled ? 'btn btn-secondary' : 'btn btn-primary'}
                  style={{ width: '100%', height: 40, fontSize: 14 }}
                >
                  {toggling === agent.agent_node_id
                    ? 'กำลังบันทึก...'
                    : agent.enabled
                      ? 'ปิดยี่กี'
                      : 'เปิดยี่กี'
                  }
                </button>
              </div>
            ))}
          </div>

          {/* ── Info box ─────────────────────────────────────────────────────── */}
          <div style={{
            marginTop: 24, padding: '14px 18px', borderRadius: 8,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              เกี่ยวกับยี่กี
            </div>
            <div>
              Lottery Type ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{lotteryTypeId}</span>
            </div>
            <div>เมื่อเปิดยี่กี ระบบจะสร้างรอบยี่กีอัตโนมัติตาม cron schedule</div>
            <div>สมาชิกยิงเลข 5 หลัก → รวม sum → mod 100000 = เลขผล → ตัดเป็น top3, top2, bottom2</div>
          </div>
        </>
      )}
    </div>
  )
}
