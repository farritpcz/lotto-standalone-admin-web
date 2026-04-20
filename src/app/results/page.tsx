// Page: /results (admin) — orchestrator for result entry + history
// Parent: src/app (route entry)
//
// Flow:
//   1. เลือกรอบ (card list)
//   2. กรอกเลข (hero inputs)
//   3. Preview (winners + P/L)
//   4. Confirm (settle + payout + commission)
'use client'

import { useEffect, useState } from 'react'
import { resultMgmtApi, roundMgmtApi } from '@/lib/api'
import ResultEntryForm from '@/components/results/ResultEntryForm'
import ResultsHistory from '@/components/results/ResultsHistory'
import { type Round, type PreviewData } from '@/components/results/types'

const PER_PAGE = 15

export default function ResultsPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [top3, setTop3] = useState('')
  const [bottom2, setBottom2] = useState('')
  const [front3, setFront3] = useState('')
  const [bottom3, setBottom3] = useState('')
  const [showExtra, setShowExtra] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<Round[]>([])
  const [resultPage, setResultPage] = useState(1)
  const [resultTotal, setResultTotal] = useState(0)
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [detailRound, setDetailRound] = useState<Round | null>(null)
  const [detailData, setDetailData] = useState<PreviewData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchRounds = () => {
    roundMgmtApi.list({ status: 'closed', per_page: 50 })
      .then(res => {
        // ⭐ กรองยี่กีออก — ยี่กีออกผลอัตโนมัติ
        const items = (res.data.data?.items || []).filter(
          (r: Round) => r.lottery_type?.category !== 'yeekee' && !r.lottery_type?.code?.startsWith('YEEKEE')
        )
        setRounds(items)
        if (items.length === 1) setSelectedRound(items[0])
      })
      .catch(() => {}).finally(() => setLoading(false))
  }

  const fetchResults = () => {
    resultMgmtApi.list({ page: resultPage, per_page: PER_PAGE })
      .then(res => { setResults(res.data.data?.items || []); setResultTotal(res.data.data?.total || 0) })
      .catch(() => {})
  }

  const openResultDetail = async (round: Round) => {
    if (!round.result_top3) return
    setDetailRound(round); setDetailLoading(true)
    try {
      const res = await resultMgmtApi.preview(round.id, {
        top3: round.result_top3, top2: round.result_top2 || round.result_top3.slice(-2),
        bottom2: round.result_bottom2 || '',
      })
      setDetailData(res.data.data)
    } catch { setDetailData(null) } finally { setDetailLoading(false) }
  }

  useEffect(() => { fetchRounds() }, [])
  useEffect(() => { fetchResults() }, [resultPage])

  const handlePreview = async () => {
    if (!selectedRound || top3.length !== 3 || bottom2.length !== 2) {
      setMessage('กรุณากรอก 3 ตัวบน (3 หลัก) และ 2 ตัวล่าง (2 หลัก)'); return
    }
    setPreviewing(true); setMessage('')
    try {
      const payload: Record<string, string> = { top3, top2: top3.slice(-2), bottom2 }
      if (front3) payload.front3 = front3
      if (bottom3) payload.bottom3 = bottom3
      const res = await resultMgmtApi.preview(selectedRound.id, payload)
      setPreview(res.data.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setMessage(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally { setPreviewing(false) }
  }

  const handleConfirm = async () => {
    if (!selectedRound) return
    setSubmitting(true); setMessage('')
    try {
      const payload: Record<string, string> = { top3, top2: top3.slice(-2), bottom2 }
      if (front3) payload.front3 = front3
      if (bottom3) payload.bottom3 = bottom3
      const res = await resultMgmtApi.submit(selectedRound.id, payload)
      const data = res.data.data
      setMessage(`กรอกผลสำเร็จ! ถูก ${data?.settled || 0} รายการ, จ่าย ฿${(data?.total_win || 0).toLocaleString()}`)
      setPreview(null); setSelectedRound(null); setTop3(''); setBottom2(''); setFront3(''); setBottom3('')
      fetchRounds(); fetchResults()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setMessage(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally { setSubmitting(false) }
  }

  const isSuccess = message && message.includes('สำเร็จ')

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>กรอกผลรางวัล</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {rounds.length} รอบรอกรอกผล
          </div>
        </div>
      </div>

      {message && (
        <div style={{
          background: isSuccess ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: isSuccess ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {isSuccess ? '\u2713 ' : '\u2717 '}{message}
        </div>
      )}

      <ResultEntryForm
        rounds={rounds} loading={loading}
        selectedRound={selectedRound} setSelectedRound={setSelectedRound}
        top3={top3} setTop3={setTop3}
        bottom2={bottom2} setBottom2={setBottom2}
        front3={front3} setFront3={setFront3}
        bottom3={bottom3} setBottom3={setBottom3}
        showExtra={showExtra} setShowExtra={setShowExtra}
        preview={preview} setPreview={setPreview}
        previewing={previewing} submitting={submitting}
        onPreview={handlePreview} onConfirm={handleConfirm}
      />

      <ResultsHistory
        results={results} resultPage={resultPage} resultTotal={resultTotal}
        perPage={PER_PAGE} setResultPage={setResultPage}
        onOpenDetail={openResultDetail}
        detailRound={detailRound} detailData={detailData} detailLoading={detailLoading}
        closeDetail={() => { setDetailRound(null); setDetailData(null) }}
      />
    </div>
  )
}
