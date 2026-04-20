/**
 * หน้าจัดการสายงาน (Agent Downline Management)
 *
 * แสดง tree view ของสายงาน + modals สร้าง/แก้ไข/ตั้ง commission
 * API: admin-api (#5) /downline/*
 *
 * Page: /downline (admin) — thin orchestrator
 * Subcomponents: src/components/downline/*
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, downlineApi, lotteryMgmtApi, type AgentNode, type NodeCommissionSetting } from '@/lib/api'
import ConfirmDialog, { type ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Plus, Trash2 } from 'lucide-react'
import TreeView from '@/components/downline/TreeView'
import CreateNodeModal from '@/components/downline/CreateNodeModal'
import EditNodeModal from '@/components/downline/EditNodeModal'
import { CreateForm, EditForm, ROLE_CONFIG, ThemeOption } from '@/components/downline/types'

export default function DownlinePage() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [tree, setTree] = useState<AgentNode[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)

  // ⭐ share % ของ user ที่ login
  const [mySharePercent, setMySharePercent] = useState(100)
  useEffect(() => {
    const sp = localStorage.getItem('share_percent')
    if (sp) setMySharePercent(parseFloat(sp))
  }, [])

  // ⭐ Themes
  const [themes, setThemes] = useState<ThemeOption[]>([{ code: 'default', name: 'เขียวเข้ม (Default)' }])
  useEffect(() => {
    api.get('/themes').then(res => {
      const data = res.data?.data
      if (Array.isArray(data) && data.length > 0) setThemes(data)
    }).catch(() => {})
  }, [])

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null)
  const [parentNode, setParentNode] = useState<AgentNode | null>(null)

  // Create form
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: '', username: '', password: '', share_percent: 0,
    phone: '', line_id: '', note: '',
    code: '', domain: '', site_name: '', theme: 'default',
  })

  // Edit form
  const [editForm, setEditForm] = useState<EditForm>({
    name: '', share_percent: 0, phone: '', line_id: '', note: '', status: '', password: '',
    domain: '', site_name: '', theme: 'default',
  })

  // Commission form
  const [commissionSettings, setCommissionSettings] = useState<NodeCommissionSetting[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<{ id: number; name: string; code: string }[]>([])
  const [newCommissionType, setNewCommissionType] = useState('')
  const [newCommissionPercent, setNewCommissionPercent] = useState(0)

  // ─── Load tree ─────────────────────────────────────────────────────────────
  const loadTree = useCallback(async () => {
    setLoading(true)
    try {
      const res = await downlineApi.getTree()
      const data = res.data.data || []
      setTree(data)
      const rootIds = new Set<number>(data.map((n: AgentNode) => n.id))
      setExpandedNodes(prev => new Set<number>([...prev, ...rootIds]))
    } catch {
      setMessage({ type: 'error', text: 'โหลดข้อมูลสายงานไม่สำเร็จ' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTree() }, [loadTree])

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  // ─── Expand/Collapse ──────────────────────────────────────────────────────
  const toggleExpand = (nodeId: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  // ─── Create ───────────────────────────────────────────────────────────────
  const openCreateModal = (parent: AgentNode) => {
    setParentNode(parent)
    setCreateForm({
      name: '', username: '', password: '',
      share_percent: Math.max(parent.share_percent - 1, 1),
      phone: '', line_id: '', note: '',
      code: '', domain: '', site_name: '', theme: 'default',
    })
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    // ⭐ fallback: ใช้ตัวเอง (node_id จาก localStorage) เป็น parent
    const nodeIdStr = typeof window !== 'undefined' ? localStorage.getItem('node_id') : null
    const myNodeId = nodeIdStr ? parseInt(nodeIdStr) : null
    const parentId = parentNode ? parentNode.id : myNodeId

    if (!parentId) {
      setMessage({ type: 'error', text: 'ไม่สามารถระบุ parent ได้' })
      return
    }
    if (!createForm.name || !createForm.username || !createForm.password) {
      setMessage({ type: 'error', text: 'กรุณากรอกชื่อ, username, password' })
      return
    }
    try {
      const res = await downlineApi.createNode({
        parent_id: parentId,
        name: createForm.name,
        username: createForm.username,
        password: createForm.password,
        share_percent: createForm.share_percent,
        phone: createForm.phone,
        line_id: createForm.line_id,
        note: createForm.note,
        code: createForm.code || undefined,
        domain: createForm.domain || undefined,
        site_name: createForm.site_name || undefined,
        theme: createForm.theme || undefined,
      })
      setShowCreateModal(false)
      const deploy = res.data?.data?.deploy
      if (deploy?.success && deploy?.nameservers?.length > 0) {
        const ns = deploy.nameservers.join('\n')
        setMessage({ type: 'success', text: `สร้างเว็บสำเร็จ — เปลี่ยน Nameserver ของ ${createForm.domain} เป็น:\n${ns}` })
      } else if (deploy?.success && deploy?.server_ip) {
        setMessage({ type: 'success', text: `สร้างเว็บสำเร็จ — ชี้ DNS A record ของ ${createForm.domain} ไปที่ ${deploy.server_ip}` })
      } else if (deploy && !deploy.success) {
        setMessage({ type: 'error', text: `สร้าง node สำเร็จ แต่ deploy nginx ไม่ได้: ${deploy.message}` })
      } else {
        setMessage({ type: 'success', text: 'สร้างสายงานสำเร็จ' })
      }
      loadTree()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'สร้างไม่สำเร็จ'
      setMessage({ type: 'error', text: msg })
    }
  }

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const openEditModal = (node: AgentNode) => {
    setSelectedNode(node)
    const nodeAny = node as unknown as Record<string, unknown>
    setEditForm({
      name: node.name,
      share_percent: node.share_percent,
      phone: node.phone || '',
      line_id: node.line_id || '',
      note: node.note || '',
      status: node.status,
      password: '',
      domain: (nodeAny.domain as string) || '',
      site_name: (nodeAny.site_name as string) || '',
      theme: 'default',
    })
    setShowEditModal(true)
  }

  const handleEdit = async () => {
    if (!selectedNode) return
    try {
      const data: Record<string, unknown> = {}
      const nodeAny = selectedNode as unknown as Record<string, unknown>
      if (editForm.name !== selectedNode.name) data.name = editForm.name
      if (editForm.share_percent !== selectedNode.share_percent) data.share_percent = editForm.share_percent
      if (editForm.phone !== (selectedNode.phone || '')) data.phone = editForm.phone
      if (editForm.line_id !== (selectedNode.line_id || '')) data.line_id = editForm.line_id
      if (editForm.note !== (selectedNode.note || '')) data.note = editForm.note
      if (editForm.status !== selectedNode.status) data.status = editForm.status
      if (editForm.password) data.password = editForm.password
      if (editForm.domain !== (nodeAny.domain || '')) data.domain = editForm.domain
      if (editForm.site_name !== (nodeAny.site_name || '')) data.site_name = editForm.site_name
      if (editForm.theme) data.theme = editForm.theme

      if (Object.keys(data).length === 0) {
        setShowEditModal(false)
        return
      }

      await downlineApi.updateNode(selectedNode.id, data)
      setShowEditModal(false)
      setMessage({ type: 'success', text: 'แก้ไขสำเร็จ' })
      loadTree()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'แก้ไขไม่สำเร็จ'
      setMessage({ type: 'error', text: msg })
    }
  }

  // ─── Delete (preserved for compatibility, not currently wired to UI) ──────
  // ใช้ผ่าน dialog ถ้าในอนาคตเพิ่มปุ่มลบใน NodeRow
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleDelete = (node: AgentNode) => {
    setDialog({
      title: 'ลบสายงาน',
      message: `ลบ "${node.name}" (${ROLE_CONFIG[node.role]?.label || node.role})? การดำเนินการนี้ย้อนกลับไม่ได้`,
      type: 'danger',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        try {
          await downlineApi.deleteNode(node.id)
          setDialog(null)
          setMessage({ type: 'success', text: 'ลบสำเร็จ' })
          loadTree()
        } catch (err: unknown) {
          setDialog(null)
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'ลบไม่สำเร็จ'
          setMessage({ type: 'error', text: msg })
        }
      },
      onCancel: () => setDialog(null),
    })
  }

  // ─── Commission (preserved, not currently wired to UI) ────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _openCommissionModal = async (node: AgentNode) => {
    setSelectedNode(node)
    try {
      const [commRes, lotRes] = await Promise.all([
        downlineApi.getCommission(node.id),
        lotteryMgmtApi.list(),
      ])
      setCommissionSettings(commRes.data.data?.lottery_overrides || [])
      setLotteryTypes(lotRes.data.data || [])
      setNewCommissionType('')
      setNewCommissionPercent(0)
      setShowCommissionModal(true)
    } catch {
      setMessage({ type: 'error', text: 'โหลด commission settings ไม่สำเร็จ' })
    }
  }

  const handleSaveCommission = async () => {
    if (!selectedNode) return
    try {
      const settings = commissionSettings.map(s => ({
        lottery_type: s.lottery_type,
        share_percent: s.share_percent,
      }))
      if (newCommissionType && newCommissionPercent > 0) {
        settings.push({ lottery_type: newCommissionType, share_percent: newCommissionPercent })
      }
      await downlineApi.updateCommission(selectedNode.id, settings)
      setShowCommissionModal(false)
      setMessage({ type: 'success', text: 'บันทึก commission สำเร็จ' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'บันทึกไม่สำเร็จ'
      setMessage({ type: 'error', text: msg })
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>จัดการสายงาน</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
            จัดการเว็บในสายงาน — สร้างเว็บภายใต้ตัวเอง กินส่วนต่างกำไรตาม % ที่ถือ
          </p>
        </div>
        {tree.length === 0 && !loading && (
          <button className="btn btn-primary" onClick={() => {
            setParentNode(null)
            setCreateForm({
              name: '', username: '', password: '',
              share_percent: Math.max(mySharePercent - 1, 1),
              phone: '', line_id: '', note: '',
              code: '', domain: '', site_name: '', theme: 'default',
            })
            setShowCreateModal(true)
          }}>
            <Plus size={14} /> สร้างสายงาน
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13,
          background: message.type === 'success' ? 'rgba(0,229,160,0.1)' : 'rgba(239,68,68,0.1)',
          color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
          border: `1px solid ${message.type === 'success' ? 'rgba(0,229,160,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          {message.text}
        </div>
      )}

      {/* Tree */}
      <TreeView
        tree={tree}
        loading={loading}
        expandedNodes={expandedNodes}
        toggleExpand={toggleExpand}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onReload={loadTree}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateNodeModal
          parentNode={parentNode}
          mySharePercent={mySharePercent}
          form={createForm}
          themes={themes}
          setForm={setCreateForm}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedNode && (
        <EditNodeModal
          node={selectedNode}
          mySharePercent={mySharePercent}
          form={editForm}
          themes={themes}
          setForm={setEditForm}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEdit}
        />
      )}

      {/* Commission Modal (preserved inline — small + not currently wired) */}
      {showCommissionModal && selectedNode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowCommissionModal(false) }}>
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
              <button className="btn btn-secondary" onClick={() => setShowCommissionModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSaveCommission}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {dialog && <ConfirmDialog {...dialog} />}
    </div>
  )
}
