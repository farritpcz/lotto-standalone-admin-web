// ⭐ Modal ตั้งค่า commission % แยกตามประเภทหวย
// Parent: src/app/downline/page.tsx
// ยังไม่ wire ไปเมนูหลัก (preserve ไว้ใช้ในอนาคต)

'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { AgentNode, NodeCommissionSetting } from '@/lib/api'

interface Props {
  selectedNode: AgentNode
  commissionSettings: NodeCommissionSetting[]
  setCommissionSettings: (s: NodeCommissionSetting[]) => void
  lotteryTypes: { id: number; name: string; code: string }[]
  newCommissionType: string
  setNewCommissionType: (v: string) => void
  newCommissionPercent: number
  setNewCommissionPercent: (v: number) => void
  onClose: () => void
  onSave: () => void
}

export default function CommissionModal({
  selectedNode, commissionSettings, setCommissionSettings,
  lotteryTypes, newCommissionType, setNewCommissionType,
  newCommissionPercent, setNewCommissionPercent,
  onClose, onSave,
}: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card-surface" style={{ width: '100%', maxWidth: 560, padding: 24, animation: 'fadeSlideUp 0.2s ease', maxHeight: '80vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          ตั้งค่า % แยกตามประเภทหวย
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20 }}>
          {selectedNode.name} — ค่าหลัก: {selectedNode.share_percent}%
          {' '}(ถ้าไม่ตั้งแยก จะใช้ค่าหลัก)
        </p>

        {commissionSettings.length > 0 && (
          <table className="admin-table" style={{ marginBottom: 16 }}>
            <thead>
              <tr>
                <th>ประเภทหวย</th>
                <th style={{ textAlign: 'right' }}>Share %</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {commissionSettings.map((s, i) => (
                <tr key={s.id || i}>
                  <td>{lotteryTypes.find(l => l.code === s.lottery_type)?.name || s.lottery_type}</td>
                  <td style={{ textAlign: 'right' }}>
                    <input className="input" type="number" step="0.01" style={{ width: 80, textAlign: 'right' }}
                      value={s.share_percent}
                      onChange={e => {
                        const updated = [...commissionSettings]
                        updated[i] = { ...updated[i], share_percent: parseFloat(e.target.value) || 0 }
                        setCommissionSettings(updated)
                      }} />
                  </td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => {
                      const updated = [...commissionSettings]
                      updated[i] = { ...updated[i], share_percent: 0 }
                      setCommissionSettings(updated)
                    }} style={{ color: 'var(--status-error)' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{
          padding: 12, borderRadius: 6, background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}>
          <div className="label" style={{ marginBottom: 8 }}>เพิ่ม override ใหม่</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <select className="input" value={newCommissionType}
                onChange={e => setNewCommissionType(e.target.value)}>
                <option value="">-- เลือกประเภทหวย --</option>
                {lotteryTypes
                  .filter(l => !commissionSettings.find(s => s.lottery_type === l.code))
                  .map(l => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
              </select>
            </div>
            <div style={{ width: 100 }}>
              <input className="input" type="number" step="0.01" placeholder="%"
                value={newCommissionPercent || ''}
                onChange={e => setNewCommissionPercent(parseFloat(e.target.value) || 0)} />
            </div>
            <button className="btn btn-secondary" onClick={() => {
              if (!newCommissionType || newCommissionPercent <= 0) return
              setCommissionSettings([...commissionSettings, {
                id: 0, agent_node_id: selectedNode.id,
                lottery_type: newCommissionType,
                share_percent: newCommissionPercent,
              }])
              setNewCommissionType('')
              setNewCommissionPercent(0)
            }}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={onSave}>บันทึก</button>
        </div>
      </div>
    </div>
  )
}
