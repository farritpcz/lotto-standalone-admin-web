/**
 * Admin — หน้าตั้งค่า Affiliate / Commission
 *
 * Layout 2 sections:
 *  1. Commission Settings — ตาราง default + per-lottery rates, form แก้ไข/เพิ่ม
 *  2. Commission Report   — สรุปรายได้ค่าคอมของ referrers ทุกคน
 *
 * ความสัมพันธ์:
 *  - เรียก admin-api (#5): GET/POST/DELETE /affiliate/settings, GET /affiliate/report
 *  - settings ที่ตั้งที่นี่ → commission_job (#5) อ่านแล้วคำนวณเมื่อ SubmitResult
 *  - member เห็น rate ที่ตั้งไว้ที่นี่ที่หน้า /referral ใน member-web (#4)
 */
'use client'

import { useEffect, useState } from 'react'
import { affiliateApi, lotteryMgmtApi, type AffiliateSetting, type AffiliateReportRow } from '@/lib/api'

// ===============================================================================
// Types
// ===============================================================================

/** ประเภทหวยสำหรับ dropdown */
interface LotteryType {
  id: number
  name: string
  code: string
}

// ===============================================================================
// Component หลัก
// ===============================================================================

export default function AffiliatePage() {
  // ── State: settings ──────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<AffiliateSetting[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [loadingSettings, setLoadingSettings] = useState(true)

  // ── State: form (upsert setting) ─────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [formLotteryTypeId, setFormLotteryTypeId] = useState<string>('') // '' = default (null)
  const [formRate, setFormRate] = useState('')
  const [formWithdrawMin, setFormWithdrawMin] = useState('1')
  const [formWithdrawNote, setFormWithdrawNote] = useState('ถอนขั้นต่ำ 1 บาท')
  const [formSaving, setFormSaving] = useState(false)
  const [formMsg, setFormMsg] = useState('')
  const [formErr, setFormErr] = useState('')

  // ── State: report ─────────────────────────────────────────────────────────────
  const [report, setReport] = useState<AffiliateReportRow[]>([])
  const [loadingReport, setLoadingReport] = useState(true)

  // ── State: pagination สำหรับตาราง commission report ─────────────────────────
  const PER_PAGE = 20
  const [reportPage, setReportPage] = useState(1)
  const [reportTotal, setReportTotal] = useState(0)

  // ── โหลดข้อมูลตอน mount ───────────────────────────────────────────────────────
  useEffect(() => {
    // โหลด settings + lottery types พร้อมกัน
    Promise.all([
      affiliateApi.getSettings().then(res => setSettings(res.data.data || [])),
      lotteryMgmtApi.list().then(res => setLotteryTypes(res.data.data || [])),
    ]).catch(() => {}).finally(() => setLoadingSettings(false))

    // โหลด commission report ครั้งแรก
    loadReport()
  }, [])

  // ── โหลด commission report — ส่ง page + per_page ไปให้ API ────────────────
  const loadReport = () => {
    setLoadingReport(true)
    affiliateApi.getReport({ page: reportPage, per_page: PER_PAGE })
      .then(res => {
        const data = res.data.data
        if (Array.isArray(data)) {
          setReport(data)
          setReportTotal(data.length)
        } else {
          setReport(data?.items || [])
          setReportTotal(data?.total || 0)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingReport(false))
  }

  /* เมื่อเปลี่ยนหน้า report ให้โหลดใหม่ */
  useEffect(() => { loadReport() }, [reportPage])

  // ── Submit form ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const rate = parseFloat(formRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setFormErr('Commission rate ต้องอยู่ระหว่าง 0-100'); return
    }
    const withdrawMin = parseFloat(formWithdrawMin)
    if (isNaN(withdrawMin) || withdrawMin < 0) {
      setFormErr('ยอดถอนขั้นต่ำต้องเป็นตัวเลขบวก'); return
    }

    setFormErr('')
    setFormSaving(true)
    try {
      await affiliateApi.upsertSetting({
        lottery_type_id: formLotteryTypeId === '' ? null : parseInt(formLotteryTypeId),
        commission_rate: rate,
        withdrawal_min: withdrawMin,
        withdrawal_note: formWithdrawNote,
      })
      setFormMsg('✅ บันทึกสำเร็จ')
      setShowForm(false)
      // reload settings
      affiliateApi.getSettings().then(res => setSettings(res.data.data || []))
      setTimeout(() => setFormMsg(''), 3000)
    } catch {
      setFormErr('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setFormSaving(false)
    }
  }

  // ── ลบ setting ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบ setting นี้?')) return
    await affiliateApi.deleteSetting(id).catch(() => {})
    setSettings(prev => prev.filter(s => s.id !== id))
  }

  // ── เปิด form พร้อม pre-fill ───────────────────────────────────────────────────
  const openEditForm = (s?: AffiliateSetting) => {
    if (s) {
      setFormLotteryTypeId(s.lottery_type_id === null ? '' : String(s.lottery_type_id))
      setFormRate(String(s.commission_rate))
      setFormWithdrawMin(String(s.withdrawal_min))
      setFormWithdrawNote(s.withdrawal_note || '')
    } else {
      // form ใหม่ — reset
      setFormLotteryTypeId('')
      setFormRate('')
      setFormWithdrawMin('1')
      setFormWithdrawNote('ถอนขั้นต่ำ 1 บาท')
    }
    setFormErr('')
    setShowForm(true)
  }

  // ===============================================================================
  // Render
  // ===============================================================================
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ตั้งค่า Affiliate</h1>
          <p className="text-gray-400 text-sm mt-1">
            กำหนด commission rate ที่ผู้แนะนำจะได้รับ (% ของยอดเดิมพัน)
          </p>
        </div>
        <button
          onClick={() => openEditForm()}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + เพิ่ม Setting
        </button>
      </div>

      {/* ── Success message ───────────────────────────────────────────────────── */}
      {formMsg && (
        <div className="bg-green-900/30 text-green-400 px-4 py-2 rounded-lg text-sm">
          {formMsg}
        </div>
      )}

      {/* ── Section 1: Commission Settings ───────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">อัตราค่าคอมมิชชั่น</h2>
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {loadingSettings ? (
            <div className="p-6 text-gray-400 text-sm text-center">กำลังโหลด...</div>
          ) : settings.length === 0 ? (
            <div className="p-6 text-gray-500 text-sm text-center">ยังไม่มี setting — กดปุ่ม "เพิ่ม Setting"</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-700/60">
                <tr>
                  <th className="px-5 py-3 text-left text-gray-300 font-medium">ประเภทหวย</th>
                  <th className="px-5 py-3 text-right text-gray-300 font-medium">Rate (%)</th>
                  <th className="px-5 py-3 text-right text-gray-300 font-medium">ถอนขั้นต่ำ (฿)</th>
                  <th className="px-5 py-3 text-left text-gray-300 font-medium">หมายเหตุ</th>
                  <th className="px-5 py-3 text-center text-gray-300 font-medium">สถานะ</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {settings.map(s => (
                  <tr key={s.id} className="hover:bg-gray-700/30 transition-colors">
                    {/* ประเภทหวย — null = default ใช้กับทุกประเภท */}
                    <td className="px-5 py-3 text-white">
                      {s.lottery_type_id === null ? (
                        <span className="bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                          Default (ทุกประเภท)
                        </span>
                      ) : (
                        s.lottery_type?.name || `ID: ${s.lottery_type_id}`
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-green-400 font-semibold">{s.commission_rate}%</span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-300">
                      ฿{s.withdrawal_min.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">
                      {s.withdrawal_note || '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === 'active'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-gray-700 text-gray-500'
                      }`}>
                        {s.status === 'active' ? 'เปิดใช้' : 'ปิด'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditForm(s)}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Modal: Add/Edit Form ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-white font-semibold text-lg">ตั้งค่า Commission</h3>

            {/* ประเภทหวย */}
            <div>
              <label className="text-gray-400 text-sm block mb-1">ประเภทหวย</label>
              <select
                value={formLotteryTypeId}
                onChange={e => setFormLotteryTypeId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Default (ใช้กับทุกประเภทหวย)</option>
                {lotteryTypes.map(lt => (
                  <option key={lt.id} value={String(lt.id)}>{lt.name}</option>
                ))}
              </select>
              <p className="text-gray-500 text-xs mt-1">
                Rate เฉพาะประเภท จะ override Default rate
              </p>
            </div>

            {/* Commission Rate */}
            <div>
              <label className="text-gray-400 text-sm block mb-1">
                Commission Rate (%) <span className="text-gray-500">เช่น 0.5 = 0.5% ของยอดเดิมพัน</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formRate}
                onChange={e => setFormRate(e.target.value)}
                placeholder="เช่น 0.5"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Withdrawal Min */}
            <div>
              <label className="text-gray-400 text-sm block mb-1">ยอดถอนขั้นต่ำ (฿)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formWithdrawMin}
                onChange={e => setFormWithdrawMin(e.target.value)}
                placeholder="เช่น 1"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Withdrawal Note */}
            <div>
              <label className="text-gray-400 text-sm block mb-1">หมายเหตุเงื่อนไขการถอน</label>
              <textarea
                value={formWithdrawNote}
                onChange={e => setFormWithdrawNote(e.target.value)}
                rows={2}
                placeholder="แสดงให้ member เห็นในหน้า referral"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>

            {formErr && <p className="text-red-400 text-sm">{formErr}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={formSaving}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {formSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2: Commission Report ─────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">รายงาน Commission</h2>
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {loadingReport ? (
            <div className="p-6 text-gray-400 text-sm text-center">กำลังโหลด...</div>
          ) : report.length === 0 ? (
            <div className="p-6 text-gray-500 text-sm text-center">ยังไม่มีข้อมูล commission</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-700/60">
                <tr>
                  <th className="px-5 py-3 text-left text-gray-300 font-medium">ผู้แนะนำ</th>
                  <th className="px-5 py-3 text-right text-gray-300 font-medium">จำนวนที่แนะนำ</th>
                  <th className="px-5 py-3 text-right text-gray-300 font-medium">ค่าคอมรวม (฿)</th>
                  <th className="px-5 py-3 text-right text-gray-300 font-medium">รอจ่าย (฿)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {report.map(row => (
                  <tr key={row.member_id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-white font-medium">{row.username}</div>
                      <div className="text-gray-500 text-xs">ID: {row.member_id}</div>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-300">{row.total_referred} คน</td>
                    <td className="px-5 py-3 text-right text-green-400 font-semibold">
                      ฿{row.total_commission.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right text-yellow-400">
                      ฿{row.pending_commission.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── Pagination — แบ่งหน้าตาราง commission report ──────────────── */}
          {reportTotal > PER_PAGE && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, paddingBottom: 16 }}>
              <button onClick={() => setReportPage(p => Math.max(1, p-1))} disabled={reportPage === 1} className="btn btn-secondary">← ก่อนหน้า</button>
              <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {reportPage} / {Math.ceil(reportTotal / PER_PAGE)}</span>
              <button onClick={() => setReportPage(p => p+1)} disabled={report.length < PER_PAGE} className="btn btn-secondary">ถัดไป →</button>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
