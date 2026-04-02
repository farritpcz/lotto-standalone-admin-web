/**
 * EmptyState — Empty state placeholder (dark theme)
 *
 * แสดงเมื่อ list/table ไม่มีข้อมูล
 * มี icon, title, description, optional action button
 *
 * Usage:
 *   import { FileText } from 'lucide-react'
 *
 *   <EmptyState
 *     icon={FileText}
 *     title="ยังไม่มีข้อมูล"
 *     description="ยังไม่มีรายการในระบบ"
 *     actionLabel="เพิ่มรายการ"
 *     onAction={() => router.push('/create')}
 *   />
 */

'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  /** Lucide icon component */
  icon: LucideIcon
  /** หัวข้อ */
  title: string
  /** คำอธิบายเพิ่มเติม */
  description?: string
  /** ข้อความปุ่ม action (ถ้าไม่ใส่ = ไม่แสดงปุ่ม) */
  actionLabel?: string
  /** callback เมื่อกดปุ่ม action */
  onAction?: () => void
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
      }}
    >
      {/* Icon — วงกลมพื้นหลังจางๆ */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Icon size={28} color="#555" />
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#ededed',
          marginBottom: 6,
        }}
      >
        {title}
      </div>

      {/* Description */}
      {description && (
        <div
          style={{
            fontSize: 13,
            color: '#777',
            maxWidth: 320,
            lineHeight: 1.5,
            marginBottom: actionLabel ? 20 : 0,
          }}
        >
          {description}
        </div>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 600,
            color: '#0a0a0a',
            background: '#00e5a0',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
