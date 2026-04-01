/**
 * Admin — กรอกผลรางวัล
 * ⭐ หน้าที่สำคัญที่สุดของ admin — กรอกผล → trigger payout
 * เรียก API: resultMgmtApi.submit() → standalone-admin-api (#5)
 */
'use client'
import { useEffect, useState } from 'react'
import { resultMgmtApi, roundMgmtApi } from '@/lib/api'

interface Round {
  id: number; lottery_type?: { name: string }; round_number: string;
  round_date: string; status: string; result_top3?: string;
  result_top2?: string; result_bottom2?: string;
}

export default function ResultsPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [top3, setTop3] = useState('')
  const [bottom2, setBottom2] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // ดึงรอบที่ปิดรับแล้ว (closed) — รอกรอกผล
    roundMgmtApi.list({ status: 'closed', per_page: 50 })
      .then(res => setRounds(res.data.data?.items || []))
      .finally(() => setLoading(false))
  }, [message])

  const handleSubmit = async () => {
    if (!selectedRound || top3.length !== 3 || bottom2.length !== 2) {
      setMessage('❌ กรุณากรอก 3 ตัวบน (3 หลัก) และ 2 ตัวล่าง (2 หลัก)'); return
    }
    setSubmitting(true); setMessage('')

    try {
      const top2 = top3.slice(-2) // 2 ตัวท้ายของ 3 ตัวบน
      const res = await resultMgmtApi.submit(selectedRound.id, { top3, top2, bottom2 })
      const data = res.data.data
      setMessage(`✅ กรอกผลสำเร็จ! รอบ ${selectedRound.round_number} — ถูก ${data?.settled || 0} คน, จ่าย ฿${(data?.total_win || 0).toLocaleString()}`)
      setSelectedRound(null); setTop3(''); setBottom2('')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setMessage(`❌ ${e.response?.data?.error || 'เกิดข้อผิดพลาด'}`)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">กรอกผลรางวัล</h1>

      {message && (
        <div className={`rounded-lg px-4 py-3 mb-4 text-sm ${message.includes('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {message}
        </div>
      )}

      {/* ฟอร์มกรอกผล */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">เลือกรอบ + กรอกผล</h2>

        {loading ? <div className="text-gray-400">กำลังโหลด...</div> : rounds.length === 0 ? (
          <div className="text-gray-500">ไม่มีรอบที่รอกรอกผล</div>
        ) : (
          <>
            <select value={selectedRound?.id || ''} onChange={e => setSelectedRound(rounds.find(r => r.id === Number(e.target.value)) || null)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 mb-4">
              <option value="">เลือกรอบ...</option>
              {rounds.map(r => (
                <option key={r.id} value={r.id}>{r.lottery_type?.name} — รอบ {r.round_number}</option>
              ))}
            </select>

            {selectedRound && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">3 ตัวบน</label>
                  <input type="text" value={top3} onChange={e => setTop3(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="847" maxLength={3}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-center text-3xl font-mono font-bold rounded-lg px-4 py-4" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">2 ตัวล่าง</label>
                  <input type="text" value={bottom2} onChange={e => setBottom2(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="56" maxLength={2}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-center text-3xl font-mono font-bold rounded-lg px-4 py-4" />
                </div>
              </div>
            )}

            {selectedRound && top3.length === 3 && (
              <div className="bg-gray-700/50 rounded-lg p-3 mb-4 text-sm text-gray-300">
                <div>3 ตัวบน: <span className="text-yellow-400 font-bold">{top3}</span></div>
                <div>2 ตัวบน: <span className="text-green-400 font-bold">{top3.slice(-2)}</span> (2 ตัวท้ายของ 3 ตัวบน)</div>
                <div>2 ตัวล่าง: <span className="text-blue-400 font-bold">{bottom2 || '??'}</span></div>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || !selectedRound}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-xl transition">
              {submitting ? 'กำลังกรอกผล + คำนวณรางวัล...' : 'ยืนยันกรอกผล'}
            </button>
          </>
        )}
      </div>

      {/* ผลรางวัลล่าสุด */}
      <h2 className="text-white font-semibold mb-3">ผลรางวัลล่าสุด</h2>
      <ResultsList />
    </div>
  )
}

function ResultsList() {
  const [results, setResults] = useState<Round[]>([])
  useEffect(() => {
    resultMgmtApi.list({ per_page: 20 }).then(res => setResults(res.data.data?.items || []))
  }, [])

  return (
    <div className="space-y-2">
      {results.map(r => (
        <div key={r.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-white font-semibold">{r.lottery_type?.name}</span>
            <span className="text-gray-500 text-sm ml-2">รอบ {r.round_number}</span>
          </div>
          <div className="flex gap-3 text-sm font-mono">
            <span className="text-yellow-400">{r.result_top3}</span>
            <span className="text-green-400">{r.result_top2}</span>
            <span className="text-blue-400">{r.result_bottom2}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
