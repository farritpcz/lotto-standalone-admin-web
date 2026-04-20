/**
 * SidebarFooter — theme toggle + collapse + logout
 *
 * Rule: UI-only; parent จัดการ state isCollapsed + toggle/logout handlers
 * Related: AdminSidebar.tsx
 */
'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

interface Props {
  isCollapsed: boolean
  onToggleCollapse: () => void
  onLogout: () => void
}

export default function SidebarFooter({ isCollapsed, onToggleCollapse, onLogout }: Props) {
  return (
    <div
      style={{
        padding: isCollapsed ? '8px 4px' : '8px 14px',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Theme toggle */}
      <div style={{ marginBottom: 4 }}>
        <ThemeToggle compact={isCollapsed} />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="btn btn-ghost"
        title={isCollapsed ? 'ขยาย sidebar' : 'ย่อ sidebar'}
        style={{
          width: '100%',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: 8,
          color: 'var(--text-tertiary)',
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        {isCollapsed ? (
          <ChevronRight size={15} strokeWidth={1.5} />
        ) : (
          <>
            <ChevronLeft size={15} strokeWidth={1.5} />
            <span>ย่อเมนู</span>
          </>
        )}
      </button>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="btn btn-ghost"
        title={isCollapsed ? 'ออกจากระบบ' : undefined}
        style={{
          width: '100%',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: 8,
          color: 'var(--text-tertiary)',
          fontSize: 13,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 15, height: 15, flexShrink: 0 }}
        >
          <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {!isCollapsed && <span>ออกจากระบบ</span>}
      </button>
    </div>
  )
}
