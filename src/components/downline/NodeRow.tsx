// Component: NodeRow — single node row in tree (role badge, name, share %, action buttons)
// Parent: src/components/downline/TreeView.tsx

'use client'

import { type AgentNode } from '@/lib/api'
import {
  Plus, ChevronRight, ChevronDown,
  Users, Settings, Eye, EyeOff, GitBranch,
} from 'lucide-react'
import { ROLE_CONFIG } from './types'

interface Props {
  node: AgentNode
  level: number
  hasChildren: boolean
  isExpanded: boolean
  onToggle: () => void
  onCreate: () => void
  onEdit: () => void
  onToggleStatus: () => void
}

export default function NodeRow({
  node, level, hasChildren, isExpanded,
  onToggle, onCreate, onEdit, onToggleStatus,
}: Props) {
  const roleConfig = ROLE_CONFIG[node.role] || ROLE_CONFIG.agent_downline
  const isSuspended = node.status === 'suspended'

  // ⭐ Permission: ตัวเอง/ลูกตรง/admin
  const myNodeId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('node_id') || '0') : 0
  const isMe = myNodeId > 0 && node.id === myNodeId
  const isMyDirectChild = myNodeId > 0 && node.parent_id === myNodeId
  const isAdmin = !myNodeId

  return (
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
      {/* Expand/Collapse */}
      <button
        onClick={onToggle}
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
        <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{node.name}</span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6 }}>@{node.username}</span>
      </div>

      {/* Share % */}
      <span className="mono" style={{
        fontSize: 14, fontWeight: 600, color: 'var(--accent)',
        minWidth: 60, textAlign: 'right',
      }}>
        {node.share_percent}%
      </span>

      {/* Member count */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--text-tertiary)', minWidth: 50 }}>
        <Users size={12} /> {node.member_count || 0}
      </span>

      {/* Child count */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--text-tertiary)', minWidth: 50 }}>
        <GitBranch size={12} /> {node.child_count || 0}
      </span>

      {/* Status */}
      {isSuspended && (
        <span className="badge badge-error" style={{ fontSize: 10 }}>ระงับ</span>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
        {(isMe || isAdmin) && (
          <button className="btn btn-ghost" title="สร้างเว็บภายใต้" onClick={onCreate} style={{ padding: '4px 6px' }}>
            <Plus size={14} />
          </button>
        )}
        {(isMyDirectChild || (isAdmin && !isMe)) && (
          <button className="btn btn-ghost" title="ตั้งค่า" onClick={onEdit} style={{ padding: '4px 6px' }}>
            <Settings size={14} />
          </button>
        )}
        {(isMyDirectChild || (isAdmin && !isMe)) && (
          <button
            className="btn btn-ghost"
            title={node.status === 'active' ? 'ปิดเว็บ' : 'เปิดเว็บ'}
            onClick={onToggleStatus}
            style={{ padding: '4px 6px', color: node.status === 'active' ? 'var(--status-error)' : 'var(--status-success)' }}
          >
            {node.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}
