// Component: PaginationBar — reusable pagination (ก่อนหน้า / หน้า X / ถัดไป)
// Parent: src/app/members/[id]/page.tsx (used by TransactionsTable + BetsHistoryTable)

'use client'

interface Props {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export default function PaginationBar({ page, totalPages, onPrev, onNext }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)',
    }}>
      <button className="btn btn-secondary" onClick={onPrev} disabled={page === 1}>
        ก่อนหน้า
      </button>
      <span className="label" style={{ padding: '0 8px' }}>
        หน้า {page} / {totalPages}
      </span>
      <button className="btn btn-secondary" onClick={onNext} disabled={page >= totalPages}>
        ถัดไป
      </button>
    </div>
  )
}
