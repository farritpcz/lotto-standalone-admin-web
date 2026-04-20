// Component: TreeView — recursive tree view of downline nodes
// Parent: src/app/downline/page.tsx

'use client'

import { type AgentNode, downlineApi } from '@/lib/api'
import { GitBranch } from 'lucide-react'
import Loading from '@/components/Loading'
import NodeRow from './NodeRow'
import { ROLE_CONFIG } from './types'

interface Props {
  tree: AgentNode[]
  loading: boolean
  expandedNodes: Set<number>
  toggleExpand: (id: number) => void
  onCreate: (parent: AgentNode) => void
  onEdit: (node: AgentNode) => void
  onReload: () => void
}

export default function TreeView({ tree, loading, expandedNodes, toggleExpand, onCreate, onEdit, onReload }: Props) {
  const renderNode = (node: AgentNode, level: number = 0) => {
    const hasChildren = !!(node.children && node.children.length > 0)
    const isExpanded = expandedNodes.has(node.id)

    return (
      <div key={node.id}>
        <NodeRow
          node={node}
          level={level}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggle={() => hasChildren && toggleExpand(node.id)}
          onCreate={() => onCreate(node)}
          onEdit={() => onEdit(node)}
          onToggleStatus={async () => {
            const newStatus = node.status === 'active' ? 'suspended' : 'active'
            try {
              await downlineApi.updateNode(node.id, { status: newStatus })
              onReload()
            } catch {}
          }}
        />

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card-surface" style={{ overflow: 'hidden' }}>
      {loading ? (
        <Loading inline text="กำลังโหลดสายงาน..." />
      ) : tree.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <GitBranch size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>ยังไม่มีเว็บในสายงาน — กดปุ่ม &quot;สร้างสายงาน&quot; เพื่อสร้างเว็บภายใต้ตัวเอง</p>
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {/* Legend */}
          <div style={{ padding: '8px 16px 12px', display: 'flex', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
              <span key={role} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color }} />
                <span style={{ color: 'var(--text-tertiary)' }}>{cfg.label}</span>
              </span>
            ))}
          </div>

          {tree.map(node => renderNode(node, 0))}
        </div>
      )}
    </div>
  )
}
