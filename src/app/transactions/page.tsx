/**
 * Admin — ดูรายการธุรกรรมทั้งหมด
 */
'use client'
import { useEffect, useState } from 'react'
import { txMgmtApi } from '@/lib/api'

interface Tx { id: number; type: string; amount: number; balance_before: number; balance_after: number; created_at: string; member_id: number }

const typeLabels: Record<string, string> = { deposit: 'ฝาก', withdraw: 'ถอน', bet: 'แทง', win: 'ชนะ', refund: 'คืนเงิน' }
const typeColors: Record<string, string> = { deposit: 'text-green-400', withdraw: 'text-red-400', bet: 'text-yellow-400', win: 'text-green-400', refund: 'text-blue-400' }

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Tx[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    txMgmtApi.list({ page, per_page: 30, type: typeFilter || undefined })
      .then(res => { setTxns(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
  }, [page, typeFilter])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">ธุรกรรมทั้งหมด ({total})</h1>
      <div className="flex gap-2 mb-4">
        {['', 'deposit', 'withdraw', 'bet', 'win'].map(t => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
            {t ? typeLabels[t] : 'ทั้งหมด'}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {txns.map(tx => (
          <div key={tx.id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className={`font-semibold text-sm ${typeColors[tx.type]}`}>{typeLabels[tx.type] || tx.type}</span>
              <span className="text-gray-500 text-xs ml-2">Member #{tx.member_id}</span>
              <div className="text-gray-600 text-xs">{new Date(tx.created_at).toLocaleString('th-TH')}</div>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {tx.amount >= 0 ? '+' : ''}฿{Math.abs(tx.amount).toLocaleString()}
              </span>
              <div className="text-gray-500 text-xs">คงเหลือ ฿{tx.balance_after.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
      {total > 30 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50">ก่อนหน้า</button>
          <span className="px-3 py-1 text-gray-400">หน้า {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={txns.length < 30} className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50">ถัดไป</button>
        </div>
      )}
    </div>
  )
}
