/**
 * Admin — ตั้งค่า Affiliate / Commission
 *
 * 3 sections:
 *  1. วิธีการทำงาน — อธิบายให้ admin เข้าใจง่ายๆ
 *  2. ตั้งค่า Commission Rate — default + per-lottery
 *  3. รายงาน Commission — สรุปยอดต่อ referrer
 */
'use client'

import { useEffect, useState } from 'react'
import { affiliateApi, lotteryMgmtApi, type AffiliateSetting, type AffiliateReportRow } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Users, Percent, ArrowDownToLine, FileText, Plus, Pencil, Trash2, Info } from 'lucide-react'

interface LotteryType { id: number; name: string; code: string }

export default function AffiliatePage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<AffiliateSetting[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [report, setReport] = useState<AffiliateReportRow[]>([])
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [loadingReport, setLoadingReport] = useState(true)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formLotteryTypeId, setFormLotteryTypeId] = useState<string>('')
  const [formRate, setFormRate] = useState('')
  const [formWithdrawMin, setFormWithdrawMin] = useState('1')
  const [formWithdrawNote, setFormWithdrawNote] = useState('ถอนขั้นต่ำ 1 บาท')
  const [formSaving, setFormSaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | null>(null)

  useEffect(() => {
    Promise.all([
      affiliateApi.getSettings().then(res => setSettings(res.data.data || [])),
      lotteryMgmtApi.list().then(res => setLotteryTypes(res.data.data || [])),
    ]).catch(() => {}).finally(() => setLoadingSettings(false))

    affiliateApi.getReport()
      .then(res => {
        const data = res.data.data
        setReport(Array.isArray(data) ? data : data?.items || [])
      })
      .catch(() => {})
      .finally(() => setLoadingReport(false))
  }, [])

  // ── Form handlers ──
  const openAddForm = () => {
    setEditingId(null)
    setFormLotteryTypeId(''); setFormRate(''); setFormWithdrawMin('1'); setFormWithdrawNote('ถอนขั้นต่ำ 1 บาท')
    setShowForm(true)
  }

  const openEditForm = (s: AffiliateSetting) => {
    setEditingId(s.id)
    setFormLotteryTypeId(s.lottery_type_id === null ? '' : String(s.lottery_type_id))
    setFormRate(String(s.commission_rate)); setFormWithdrawMin(String(s.withdrawal_min))
    setFormWithdrawNote(s.withdrawal_note || '')
    setShowForm(true)
  }

  const handleSave = async () => {
    const rate = parseFloat(formRate)
    if (isNaN(rate) || rate < 0 || rate > 100) { toast.error('Rate ต้องอยู่ระหว่าง 0-100'); return }
    setFormSaving(true)
    try {
      await affiliateApi.upsertSetting({
        lottery_type_id: formLotteryTypeId === '' ? null : parseInt(formLotteryTypeId),
        commission_rate: rate,
        withdrawal_min: parseFloat(formWithdrawMin) || 1,
        withdrawal_note: formWithdrawNote,
      })
      toast.success('บันทึกสำเร็จ')
      setShowForm(false)
      affiliateApi.getSettings().then(res => setSettings(res.data.data || []))
    } catch { toast.error('บันทึกไม่สำเร็จ') }
    setFormSaving(false)
  }

  const handleDelete = (s: AffiliateSetting) => {
    setConfirmDialog({
      title: 'ลบ Setting',
      message: `ยืนยันลบ rate ${s.commission_rate}% ${s.lottery_type?.name || 'Default'}?`,
      type: 'danger',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        setConfirmDialog(null)
        await affiliateApi.deleteSetting(s.id).catch(() => {})
        setSettings(prev => prev.filter(x => x.id !== s.id))
        toast.success('ลบสำเร็จ')
      },
      onCancel: () => setConfirmDialog(null),
    })
  }

  // ── Helpers ──
  // ⭐ lottery_type_id อาจเป็น null หรือ undefined (Go omitempty ไม่ส่ง field ถ้า nil)
  const defaultSetting = settings.find(s => s.lottery_type_id == null)
  const lotterySettings = settings.filter(s => s.lottery_type_id != null)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ตั้งค่า Affiliate</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          ตั้ง commission rate ที่ผู้แนะนำจะได้รับจากยอดเดิมพันของเพื่อนที่ชวนมา
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         วิธีการทำงาน — อธิบายง่ายๆ
         ══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Info size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>วิธีการทำงาน</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { step: '1', icon: '🔗', title: 'สมาชิกสร้างลิงก์', desc: 'แชร์ลิงก์ชวนเพื่อน' },
            { step: '2', icon: '👤', title: 'เพื่อนสมัคร', desc: 'สมัครผ่านลิงก์' },
            { step: '3', icon: '🎰', title: 'เพื่อนแทงหวย', desc: 'แทง 100 บาท' },
            { step: '4', icon: '💰', title: 'ได้ค่าคอม', desc: `${defaultSetting?.commission_rate || '0.5'}% = ${((defaultSetting?.commission_rate || 0.5) * 100 / 100).toFixed(1)} บาท` },
          ].map(item => (
            <div key={item.step} style={{
              background: 'var(--bg-base)', borderRadius: 10, padding: '12px',
              textAlign: 'center', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.6 }}>
          * ค่าคอมคำนวณจาก <strong>ยอดเดิมพัน</strong> (ไม่ใช่แพ้/ชนะ) · คำนวณอัตโนมัติหลัง admin กรอกผล · สมาชิกถอนค่าคอมเข้า wallet ได้เอง
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         ตั้งค่า Commission Rate
         ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Percent size={16} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 700 }}>อัตราค่าคอมมิชชั่น</span>
        </div>
        <button className="btn btn-primary" onClick={openAddForm} style={{ height: 32, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> เพิ่ม Rate
        </button>
      </div>

      {loadingSettings ? <Loading inline text="กำลังโหลด..." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {/* Default rate card — เด่น */}
          {defaultSetting && (
            <div style={{
              background: 'var(--bg-elevated)', border: '2px solid var(--accent)',
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ background: 'rgba(0,229,160,0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>DEFAULT</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>ทุกประเภทหวย</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  ถอนขั้นต่ำ ฿{defaultSetting.withdrawal_min} · {defaultSetting.withdrawal_note || '-'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{defaultSetting.commission_rate}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>ของยอดเดิมพัน</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEditForm(defaultSetting)} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                    <Pencil size={14} color="var(--text-secondary)" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Per-lottery rates */}
          {lotterySettings.length > 0 && (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Rate เฉพาะประเภท (override default)</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  ถ้าหวยประเภทไหนมี rate เฉพาะ → ใช้ rate นั้น · ถ้าไม่มี → ใช้ Default ({defaultSetting?.commission_rate || 0}%) แทน
                </div>
              </div>
              {lotterySettings.map((s, i) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: i < lotterySettings.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {s.lottery_type?.name || `Lottery #${s.lottery_type_id}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--status-success)' }}>{s.commission_rate}%</span>
                    <button onClick={() => openEditForm(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Pencil size={13} color="var(--text-tertiary)" />
                    </button>
                    <button onClick={() => handleDelete(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={13} color="var(--status-error)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {settings.length === 0 && (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, border: '1px dashed var(--border)' }}>
              ยังไม่มี rate — กดปุ่ม "เพิ่ม Rate" เพื่อเริ่มต้น
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
         รายงาน Commission
         ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <FileText size={16} color="var(--accent)" />
        <span style={{ fontSize: 15, fontWeight: 700 }}>รายงาน Commission</span>
      </div>

      <div className="card-surface" style={{ padding: 0 }}>
        {loadingReport ? <Loading inline text="กำลังโหลด..." /> : report.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            ยังไม่มีข้อมูล commission — ค่าคอมจะเริ่มคำนวณเมื่อ admin กรอกผลหวย
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ผู้แนะนำ</th>
                <th style={{ textAlign: 'center' }}>ชวนได้</th>
                <th style={{ textAlign: 'right' }}>ค่าคอมรวม</th>
                <th style={{ textAlign: 'right' }}>รอถอน</th>
              </tr>
            </thead>
            <tbody>
              {report.map(row => (
                <tr key={row.member_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ID: {row.member_id}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} /> {row.total_referred} คน
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--status-success)' }}>
                    ฿{row.total_commission.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#FF9F0A', fontWeight: 600 }}>
                    ฿{row.pending_commission.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
         Modal: เพิ่ม/แก้ไข Rate
         ══════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {editingId ? 'แก้ไข Commission Rate' : 'เพิ่ม Commission Rate'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* ประเภทหวย */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ประเภทหวย</div>
                <select className="input" value={formLotteryTypeId} onChange={e => setFormLotteryTypeId(e.target.value)}>
                  <option value="">Default (ใช้กับทุกประเภท)</option>
                  {lotteryTypes.map(lt => <option key={lt.id} value={String(lt.id)}>{lt.name}</option>)}
                </select>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Rate เฉพาะประเภท จะ override Default rate
                </div>
              </div>

              {/* Commission Rate */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Commission Rate (%)</div>
                <input className="input" type="number" min="0" max="100" step="0.1" value={formRate} onChange={e => setFormRate(e.target.value)} placeholder="เช่น 0.5" />
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  เช่น 0.5 = สมาชิกแทง 1,000 บาท → ผู้แนะนำได้ 5 บาท
                </div>
              </div>

              {/* ถอนขั้นต่ำ */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ยอดถอนค่าคอมขั้นต่ำ (฿)</div>
                <input className="input" type="number" min="0" value={formWithdrawMin} onChange={e => setFormWithdrawMin(e.target.value)} />
              </div>

              {/* หมายเหตุ */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>หมายเหตุ (แสดงให้สมาชิกเห็น)</div>
                <input className="input" type="text" value={formWithdrawNote} onChange={e => setFormWithdrawNote(e.target.value)} placeholder="เช่น ถอนขั้นต่ำ 1 บาท" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1, height: 38 }} onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button className="btn btn-primary" style={{ flex: 1, height: 38, fontWeight: 600 }} onClick={handleSave} disabled={formSaving}>
                {formSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  )
}
