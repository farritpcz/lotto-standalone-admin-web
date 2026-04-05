/**
 * หน้าจัดการสายงาน (Agent Downline Management)
 *
 * แสดง tree view ของสายงาน:
 *   admin(100%) → share_holder(95%) → senior(94%) → master(93%)
 *     → agent(92%) → agent_downline(91%) → ...
 *
 * Features:
 * - Tree view แบบ collapsible (indent ตาม depth)
 * - เพิ่ม/แก้ไข/ลบ node
 * - ตั้ง share % (ค่าหลัก + แยกตามประเภทหวย)
 * - แสดงจำนวนลูกสาย + จำนวนสมาชิก
 *
 * API: admin-api (#5) /downline/*
 * ดู: handler/downline_handler.go, model/models.go (AgentNode)
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { downlineApi, lotteryMgmtApi, type AgentNode, type NodeCommissionSetting } from '@/lib/api'
import Loading from '@/components/Loading'
import ConfirmDialog, { type ConfirmDialogProps } from '@/components/ConfirmDialog'
import {
  GitBranch, Plus, Edit3, Trash2, ChevronRight, ChevronDown,
  Users, Settings, Eye, EyeOff,
} from 'lucide-react'

// =============================================================================
// Role labels + colors — แสดงยศในภาษาไทย
// =============================================================================
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin:           { label: 'Admin',         color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  share_holder:    { label: 'Share Holder',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  senior:          { label: 'Senior',        color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  master:          { label: 'Master',        color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  agent:           { label: 'Agent',         color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  agent_downline:  { label: 'Downline',      color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
}

export default function DownlinePage() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [tree, setTree] = useState<AgentNode[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)

  // ⭐ share % ของ user ที่ login (ดึงจาก localStorage)
  const [mySharePercent, setMySharePercent] = useState(100)
  useEffect(() => {
    const sp = localStorage.getItem('share_percent')
    if (sp) setMySharePercent(parseFloat(sp))
  }, [])

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null)
  const [parentNode, setParentNode] = useState<AgentNode | null>(null)

  // Create form
  const [createForm, setCreateForm] = useState({
    name: '', username: '', password: '', share_percent: 0,
    phone: '', line_id: '', note: '',
  })

  // Edit form
  const [editForm, setEditForm] = useState({
    name: '', share_percent: 0, phone: '', line_id: '', note: '', status: '', password: '',
  })

  // Commission form
  const [commissionSettings, setCommissionSettings] = useState<NodeCommissionSetting[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<{ id: number; name: string; code: string }[]>([])
  const [newCommissionType, setNewCommissionType] = useState('')
  const [newCommissionPercent, setNewCommissionPercent] = useState(0)

  // ─── Load tree (ดึงจาก API จริง) ─────────────────────────────────────────
  const loadTree = useCallback(async () => {
    setLoading(true)
    try {
      const res = await downlineApi.getTree()
      const data = res.data.data || []
      setTree(data)
      // Auto-expand root nodes
      const rootIds = new Set(data.map((n: AgentNode) => n.id))
      setExpandedNodes(prev => new Set([...prev, ...rootIds]))
    } catch {
      setMessage({ type: 'error', text: 'โหลดข้อมูลสายงานไม่สำเร็จ' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTree() }, [loadTree])

  // Auto-hide message
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  // ─── Toggle expand/collapse ───────────────────────────────────────────────
  const toggleExpand = (nodeId: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  // ─── Create Node ──────────────────────────────────────────────────────────
  const openCreateModal = (parent: AgentNode) => {
    setParentNode(parent)
    // ตั้งค่า default share_percent = parent - 1
    setCreateForm({
      name: '', username: '', password: '',
      share_percent: Math.max(parent.share_percent - 1, 1),
      phone: '', line_id: '', note: '',
    })
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    // ⭐ ถ้าไม่มี parentNode → ใช้ตัวเอง (node_id จาก localStorage) เป็น parent
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
      await downlineApi.createNode({
        parent_id: parentId,
        name: createForm.name,
        username: createForm.username,
        password: createForm.password,
        share_percent: createForm.share_percent,
        phone: createForm.phone,
        line_id: createForm.line_id,
        note: createForm.note,
      })
      setShowCreateModal(false)
      setMessage({ type: 'success', text: 'สร้างสายงานสำเร็จ' })
      loadTree()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'สร้างไม่สำเร็จ'
      setMessage({ type: 'error', text: msg })
    }
  }

  // ─── Edit Node ────────────────────────────────────────────────────────────
  const openEditModal = (node: AgentNode) => {
    setSelectedNode(node)
    setEditForm({
      name: node.name,
      share_percent: node.share_percent,
      phone: node.phone || '',
      line_id: node.line_id || '',
      note: node.note || '',
      status: node.status,
      password: '',
    })
    setShowEditModal(true)
  }

  const handleEdit = async () => {
    if (!selectedNode) return
    try {
      const data: Record<string, unknown> = {}
      if (editForm.name !== selectedNode.name) data.name = editForm.name
      if (editForm.share_percent !== selectedNode.share_percent) data.share_percent = editForm.share_percent
      if (editForm.phone !== (selectedNode.phone || '')) data.phone = editForm.phone
      if (editForm.line_id !== (selectedNode.line_id || '')) data.line_id = editForm.line_id
      if (editForm.note !== (selectedNode.note || '')) data.note = editForm.note
      if (editForm.status !== selectedNode.status) data.status = editForm.status
      if (editForm.password) data.password = editForm.password

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

  // ─── Delete Node ──────────────────────────────────────────────────────────
  const handleDelete = (node: AgentNode) => {
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

  // ─── Commission Settings ──────────────────────────────────────────────────
  const openCommissionModal = async (node: AgentNode) => {
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
      // เพิ่ม setting ใหม่ (ถ้ามี)
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

  // ─── Render Tree Node (recursive) ─────────────────────────────────────────
  const renderNode = (node: AgentNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const roleConfig = ROLE_CONFIG[node.role] || ROLE_CONFIG.agent_downline
    const isSuspended = node.status === 'suspended'

    return (
      <div key={node.id}>
        {/* ── Node row ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', marginLeft: level * 28,
            borderRadius: 6, cursor: 'pointer',
            opacity: isSuspended ? 0.5 : 1,
            borderBottom: '1px solid var(--border)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          {/* Expand/Collapse icon */}
          <button
            onClick={() => hasChildren && toggleExpand(node.id)}
            style={{
              width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: hasChildren ? 'pointer' : 'default',
              color: hasChildren ? 'var(--text-secondary)' : 'transparent', padding: 0,
            }}
          >
            {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </button>

          {/* Role badge */}
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
            color: roleConfig.color, background: roleConfig.bg,
            whiteSpace: 'nowrap',
          }}>
            {roleConfig.label}
          </span>

          {/* Name + username */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>
              {node.name}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6 }}>
              @{node.username}
            </span>
          </div>

          {/* Share % */}
          <span className="mono" style={{
            fontSize: 14, fontWeight: 600,
            color: 'var(--accent)',
            minWidth: 60, textAlign: 'right',
          }}>
            {node.share_percent}%
          </span>

          {/* Member count */}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 12, color: 'var(--text-tertiary)',
            minWidth: 50,
          }}>
            <Users size={12} /> {node.member_count || 0}
          </span>

          {/* Child count */}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 12, color: 'var(--text-tertiary)',
            minWidth: 50,
          }}>
            <GitBranch size={12} /> {node.child_count || 0}
          </span>

          {/* Status */}
          {isSuspended && (
            <span className="badge badge-error" style={{ fontSize: 10 }}>ระงับ</span>
          )}

          {/* Action buttons — ⭐ กฎ:
              - ตัวเอง: ไม่มีปุ่มอะไร (แก้ตัวเองไม่ได้)
              - ลูกตรง: แก้ไข + ตั้ง% + ลบ (ไม่มีปุ่มสร้าง — ให้เค้าไป login สร้างเอง)
              - หลาน+: ไม่มีปุ่มอะไร (read-only)
          */}
          {(() => {
            const myNodeId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('node_id') || '0') : 0
            const isMe = myNodeId > 0 && node.id === myNodeId
            const isMyDirectChild = myNodeId > 0 && node.parent_id === myNodeId
            const isAdmin = !myNodeId // admin (ไม่มี node_id) → เห็นปุ่มทุกอย่าง
            return (
          <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
            {/* สร้างเว็บภายใต้ — เฉพาะตัวเอง หรือ admin */}
            {(isMe || isAdmin) && (
              <button className="btn btn-ghost" title="สร้างเว็บภายใต้" onClick={() => openCreateModal(node)}
                style={{ padding: '4px 6px' }}>
                <Plus size={14} />
              </button>
            )}
            {/* แก้ไข (ชื่อ + รหัสผ่าน + Share %) — เฉพาะลูกตรง หรือ admin */}
            {(isMyDirectChild || (isAdmin && !isMe)) && (
              <button className="btn btn-ghost" title="ตั้งค่า" onClick={() => openEditModal(node)}
                style={{ padding: '4px 6px' }}>
                <Settings size={14} />
              </button>
            )}
            {/* เปิด/ปิดเว็บ — เฉพาะลูกตรง หรือ admin */}
            {(isMyDirectChild || (isAdmin && !isMe)) && (
              <button className="btn btn-ghost"
                title={node.status === 'active' ? 'ปิดเว็บ' : 'เปิดเว็บ'}
                onClick={async () => {
                  const newStatus = node.status === 'active' ? 'suspended' : 'active'
                  try {
                    await downlineApi.updateNode(node.id, { status: newStatus })
                    loadTree()
                  } catch {}
                }}
                style={{ padding: '4px 6px', color: node.status === 'active' ? 'var(--status-error)' : 'var(--status-success)' }}>
                {node.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
            );
          })()}
        </div>

        {/* ── Children (recursive) ─────────────────────────────────── */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
            จัดการสายงาน
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
            จัดการเว็บในสายงาน — สร้างเว็บภายใต้ตัวเอง กินส่วนต่างกำไรตาม % ที่ถือ
          </p>
        </div>
        {tree.length === 0 && !loading && (
          <button className="btn btn-primary" onClick={() => {
            setParentNode(null)
            setCreateForm({ name: '', username: '', password: '', share_percent: Math.max(mySharePercent - 1, 1), phone: '', line_id: '', note: '' })
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

      {/* Tree view */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading inline text="กำลังโหลดสายงาน..." />
        ) : tree.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <GitBranch size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>ยังไม่มีเว็บในสายงาน — กดปุ่ม "สร้างสายงาน" เพื่อสร้างเว็บภายใต้ตัวเอง</p>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {/* Legend */}
            <div style={{ padding: '8px 16px 12px', display: 'flex', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
              {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                <span key={role} style={{
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 2, background: cfg.color,
                  }} />
                  <span style={{ color: 'var(--text-tertiary)' }}>{cfg.label}</span>
                </span>
              ))}
            </div>

            {/* Tree nodes */}
            {tree.map(node => renderNode(node, 0))}
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* Create Modal */}
      {/* ================================================================== */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false) }}>
          <div className="card-surface" style={{ width: '100%', maxWidth: 480, padding: 24, animation: 'fadeSlideUp 0.2s ease' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
              {parentNode ? `สร้างเว็บภายใต้ "${parentNode.name}"` : 'สร้างเว็บใหม่'}
            </h2>
            {/* ⭐ แสดง share % ของเราและ max ที่ตั้งได้ */}
            {(() => {
              const maxPercent = parentNode ? parentNode.share_percent : mySharePercent
              return (
                <div style={{
                  padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 12,
                  background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.15)',
                  color: 'var(--text-secondary)',
                }}>
                  {parentNode
                    ? <>สร้างภายใต้: <strong>{parentNode.name}</strong> ({parentNode.share_percent}%)</>
                    : <>Share % ของคุณ: <strong style={{ color: 'var(--accent)', fontSize: 14 }}>{mySharePercent}%</strong></>
                  }
                  <span style={{ marginLeft: 8 }}>— ต้องตั้ง % น้อยกว่า <strong>{maxPercent}%</strong></span>
                </div>
              )
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">ชื่อ *</label>
                <input className="input" placeholder="ชื่อจริงหรือชื่อเล่น"
                  value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Username *</label>
                  <input className="input" placeholder="สำหรับ login"
                    value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Password *</label>
                  <input className="input" type="password" placeholder="รหัสผ่าน"
                    value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
                </div>
              </div>
              <div>
                {/* ⭐ Share % เป็น select dropdown ห่างกัน 0.5% */}
                {(() => {
                  const maxPct = parentNode ? parentNode.share_percent : mySharePercent
                  // สร้าง options จาก maxPct-0.5 ลงไปจนถึง 0.5
                  const options: number[] = []
                  for (let p = maxPct - 0.5; p >= 0.5; p -= 0.5) {
                    options.push(Math.round(p * 100) / 100)
                  }
                  return (
                    <>
                      <label className="label">Share % *</label>
                      <select className="input" value={createForm.share_percent}
                        onChange={e => setCreateForm({ ...createForm, share_percent: parseFloat(e.target.value) || 0 })}>
                        {options.map(p => (
                          <option key={p} value={p}>{p}%</option>
                        ))}
                      </select>
                    </>
                  )
                })()}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">เบอร์โทร</label>
                  <input className="input" placeholder="0812345678"
                    value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">LINE ID</label>
                  <input className="input" placeholder="line_id"
                    value={createForm.line_id} onChange={e => setCreateForm({ ...createForm, line_id: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">หมายเหตุ</label>
                <input className="input" placeholder="(optional)"
                  value={createForm.note} onChange={e => setCreateForm({ ...createForm, note: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleCreate}>สร้าง</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Edit Modal */}
      {/* ================================================================== */}
      {showEditModal && selectedNode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false) }}>
          <div className="card-surface" style={{ width: '100%', maxWidth: 480, padding: 24, animation: 'fadeSlideUp 0.2s ease' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
              ตั้งค่า: {selectedNode.name}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">ชื่อ</label>
                <input className="input" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                {/* Share % — select dropdown ห่างกัน 0.5% */}
                {(() => {
                  // max = ของเรา (parent)
                  const maxPct = mySharePercent
                  const options: number[] = []
                  for (let p = maxPct - 0.5; p >= 0.5; p -= 0.5) {
                    options.push(Math.round(p * 100) / 100)
                  }
                  return (
                    <>
                      <label className="label">Share % ที่ได้รับ <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(ของคุณ: {mySharePercent}%)</span></label>
                      <select className="input" value={editForm.share_percent}
                        onChange={e => setEditForm({ ...editForm, share_percent: parseFloat(e.target.value) || 0 })}>
                        {options.map(p => (
                          <option key={p} value={p}>{p}%</option>
                        ))}
                      </select>
                    </>
                  )
                })()}
              </div>
              <div>
                <label className="label">เปลี่ยนรหัสผ่าน <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(ไม่กรอก = ไม่เปลี่ยน)</span></label>
                <input className="input" type="password" placeholder="รหัสผ่านใหม่"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
              <div>
                <label className="label">สถานะ</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`btn ${editForm.status === 'active' ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => setEditForm({ ...editForm, status: 'active' })}
                    style={{ flex: 1 }}
                  >
                    <Eye size={14} /> เปิดใช้งาน
                  </button>
                  <button
                    className={`btn ${editForm.status === 'suspended' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => setEditForm({ ...editForm, status: 'suspended' })}
                    style={{ flex: 1 }}
                  >
                    <EyeOff size={14} /> ระงับ
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleEdit}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Commission Settings Modal */}
      {/* ================================================================== */}
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

            {/* ตารางแสดง settings ปัจจุบัน */}
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
                          // ลบ: ตั้ง share_percent = 0 (backend จะลบ)
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

            {/* เพิ่ม override ใหม่ */}
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

      {/* Confirm Dialog */}
      {dialog && <ConfirmDialog {...dialog} />}
    </div>
  )
}
