/**
 * หน้ารายงานเคลียสายงาน — orchestrator
 *
 * หน้าที่:
 *  1. fetch ข้อมูลจาก /downline/report?date_from=&date_to=
 *  2. ส่ง data ให้ child components แต่ละบล็อค
 *
 * Children (components/downline/report/*):
 *  - DateFilterCard      — quick-pick + manual date range
 *  - NodeInfoBar         — แถบข้อมูล node (role, ชื่อ, ถือ%, หัวสาย)
 *  - SettlementCards     — 2 การ์ดหลัก (เคลียใต้สาย + หัวสาย)
 *  - ChildrenTable       — ตารางรายละเอียดใต้สาย
 *  - SummaryBlocks       — บล็อคเว็บตัวเอง + สรุปรวม
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { downlineApi } from '@/lib/api'
import Loading from '@/components/Loading'
import { RefreshCw } from 'lucide-react'

import type { ReportData } from '@/components/downline/report/types'
import DateFilterCard from '@/components/downline/report/DateFilterCard'
import NodeInfoBar from '@/components/downline/report/NodeInfoBar'
import SettlementCards from '@/components/downline/report/SettlementCards'
import ChildrenTable from '@/components/downline/report/ChildrenTable'
import SummaryBlocks from '@/components/downline/report/SummaryBlocks'

export default function DownlineReportPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await downlineApi.getReport({ date_from: dateFrom, date_to: dateTo })
      setData(res.data.data || null)
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [dateFrom, dateTo])

  useEffect(() => { loadData() }, [loadData])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>รายงานเคลียสายงาน</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
            สรุปยอดเคลียกับหัวสาย และ ใต้สาย
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      <DateFilterCard
        dateFrom={dateFrom}
        dateTo={dateTo}
        today={today}
        onChange={(from, to) => { setDateFrom(from); setDateTo(to) }}
      />

      {loading ? (
        <Loading inline text="กำลังโหลดรายงาน..." />
      ) : !data ? (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          ไม่มีข้อมูล
        </div>
      ) : (
        <>
          <NodeInfoBar data={data} />
          <SettlementCards data={data} />
          <ChildrenTable data={data} />
          <SummaryBlocks data={data} />
        </>
      )}
    </div>
  )
}
