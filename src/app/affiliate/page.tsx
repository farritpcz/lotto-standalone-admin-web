/**
 * Admin — ตั้งค่า Affiliate / Commission
 *
 * 5 tabs:
 *  1. วิธีการทำงาน + ตั้งค่า Commission Rate — default + per-lottery
 *  2. รายงาน Commission — สรุปยอดต่อ referrer
 *  3. ข้อความแชร์ — share templates สำเร็จรูป (line/facebook/telegram)
 *  4. ปรับค่าคอม — เพิ่ม/หัก/ยกเลิก commission adjustment
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  affiliateApi, lotteryMgmtApi,
  type AffiliateSetting, type AffiliateReportRow,
  type ShareTemplate, type CommissionAdjustment,
} from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import {
  Users, Percent, FileText, Plus, Pencil, Trash2, Info,
  MessageSquare, Settings, Copy, ChevronLeft, ChevronRight,
} from 'lucide-react'

interface LotteryType { id: number; name: string; code: string }

// ⭐ Tab definitions — แต่ละ tab มี id, label, icon
const TABS = [
  { id: 'settings', label: 'ตั้งค่า Rate', icon: Percent },
  { id: 'report', label: 'รายงาน', icon: FileText },
  { id: 'templates', label: 'ข้อความแชร์', icon: MessageSquare },
  { id: 'adjustments', label: 'ปรับค่าคอม', icon: Settings },
] as const
type TabId = typeof TABS[number]['id']

export default function AffiliatePage() {
  const { toast } = useToast()

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<TabId>('settings')

  // ── Commission Settings state (เดิม) ──
  const [settings, setSettings] = useState<AffiliateSetting[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [report, setReport] = useState<AffiliateReportRow[]>([])
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [loadingReport, setLoadingReport] = useState(true)

  // Form state สำหรับ Rate
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formLotteryTypeId, setFormLotteryTypeId] = useState<string>('')
  const [formRate, setFormRate] = useState('')
  const [formWithdrawMin, setFormWithdrawMin] = useState('1')
  const [formWithdrawNote, setFormWithdrawNote] = useState('ถอนขั้นต่ำ 1 บาท')
  const [formSaving, setFormSaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | null>(null)

  // ── Share Templates state ──
  const [templates, setTemplates] = useState<ShareTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [tplName, setTplName] = useState('')
  const [tplContent, setTplContent] = useState('')
  const [tplPlatform, setTplPlatform] = useState('all')
  const [tplSortOrder, setTplSortOrder] = useState('0')
  const [tplSaving, setTplSaving] = useState(false)

  // ── Commission Adjustments state ──
  const [adjustments, setAdjustments] = useState<CommissionAdjustment[]>([])
  const [loadingAdjustments, setLoadingAdjustments] = useState(true)
  const [adjPage, setAdjPage] = useState(1)
  const [adjTotal, setAdjTotal] = useState(0)
  const ADJ_PER_PAGE = 20
  // Form สำหรับ Adjustment
  const [adjMemberId, setAdjMemberId] = useState('')
  const [adjType, setAdjType] = useState<'add' | 'deduct' | 'cancel'>('add')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReason, setAdjReason] = useState('')
  const [adjCommissionId, setAdjCommissionId] = useState('')
  const [adjSaving, setAdjSaving] = useState(false)

  // ══════════════════════════════════════════════════════════════
  // Data fetching
  // ══════════════════════════════════════════════════════════════

  // ⭐ โหลด settings + lotteryTypes + report ตอน mount (เดิม)
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

  // ⭐ โหลด share templates เมื่อเปิด tab templates
  const fetchTemplates = useCallback(() => {
    setLoadingTemplates(true)
    affiliateApi.getShareTemplates()
      .then(res => setTemplates(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false))
  }, [])

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates()
  }, [activeTab, fetchTemplates])

  // ⭐ โหลด adjustments เมื่อเปิด tab adjustments
  const fetchAdjustments = useCallback((page: number) => {
    setLoadingAdjustments(true)
    affiliateApi.getAdjustments({ page, per_page: ADJ_PER_PAGE })
      .then(res => {
        const data = res.data.data
        setAdjustments(Array.isArray(data) ? data : data?.items || [])
        setAdjTotal(res.data.data?.total || res.data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoadingAdjustments(false))
  }, [])

  useEffect(() => {
    if (activeTab === 'adjustments') fetchAdjustments(adjPage)
  }, [activeTab, adjPage, fetchAdjustments])

  // ══════════════════════════════════════════════════════════════
  // Commission Rate handlers (เดิม — ไม่แตะ)
  // ══════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════
  // Share Template handlers
  // ══════════════════════════════════════════════════════════════
  const openAddTemplate = () => {
    setEditingTemplateId(null)
    setTplName(''); setTplContent(''); setTplPlatform('all'); setTplSortOrder('0')
    setShowTemplateForm(true)
  }

  const openEditTemplate = (t: ShareTemplate) => {
    setEditingTemplateId(t.id)
    setTplName(t.name); setTplContent(t.content)
    setTplPlatform(t.platform || 'all'); setTplSortOrder(String(t.sort_order || 0))
    setShowTemplateForm(true)
  }

  const handleSaveTemplate = async () => {
    if (!tplName.trim()) { toast.error('กรุณากรอกชื่อ template'); return }
    if (!tplContent.trim()) { toast.error('กรุณากรอกเนื้อหา'); return }
    setTplSaving(true)
    try {
      if (editingTemplateId) {
        // อัพเดท
        await affiliateApi.updateShareTemplate(editingTemplateId, {
          name: tplName, content: tplContent,
          platform: tplPlatform, sort_order: parseInt(tplSortOrder) || 0,
        })
      } else {
        // สร้างใหม่
        await affiliateApi.createShareTemplate({
          name: tplName, content: tplContent,
          platform: tplPlatform, sort_order: parseInt(tplSortOrder) || 0,
        })
      }
      toast.success('บันทึก template สำเร็จ')
      setShowTemplateForm(false)
      fetchTemplates()
    } catch { toast.error('บันทึก template ไม่สำเร็จ') }
    setTplSaving(false)
  }

  const handleDeleteTemplate = (t: ShareTemplate) => {
    setConfirmDialog({
      title: 'ลบ Template',
      message: `ยืนยันลบ "${t.name}"?`,
      type: 'danger',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        setConfirmDialog(null)
        await affiliateApi.deleteShareTemplate(t.id).catch(() => {})
        setTemplates(prev => prev.filter(x => x.id !== t.id))
        toast.success('ลบ template สำเร็จ')
      },
      onCancel: () => setConfirmDialog(null),
    })
  }

  /** คัดลอก content ไปยัง clipboard */
  const copyTemplateContent = (content: string) => {
    navigator.clipboard.writeText(content).then(() => toast.success('คัดลอกแล้ว'))
  }

  // ══════════════════════════════════════════════════════════════
  // Commission Adjustment handlers
  // ══════════════════════════════════════════════════════════════
  const handleSubmitAdjustment = async () => {
    const memberId = parseInt(adjMemberId)
    if (!memberId || isNaN(memberId)) { toast.error('กรุณากรอก Member ID'); return }
    const amount = parseFloat(adjAmount)
    if (!amount || isNaN(amount) || amount <= 0) { toast.error('จำนวนเงินต้องมากกว่า 0'); return }
    if (!adjReason.trim()) { toast.error('กรุณากรอกเหตุผล'); return }
    // ถ้า type=cancel ต้องมี commission_id
    if (adjType === 'cancel' && !adjCommissionId.trim()) { toast.error('กรุณากรอก Commission ID สำหรับยกเลิก'); return }

    setAdjSaving(true)
    try {
      await affiliateApi.createAdjustment({
        member_id: memberId,
        type: adjType,
        amount,
        reason: adjReason,
        ...(adjType === 'cancel' && adjCommissionId ? { commission_id: parseInt(adjCommissionId) } : {}),
      })
      toast.success('ปรับค่าคอมสำเร็จ')
      // reset form
      setAdjMemberId(''); setAdjAmount(''); setAdjReason(''); setAdjCommissionId('')
      setAdjType('add')
      // reload list
      fetchAdjustments(adjPage)
    } catch { toast.error('ปรับค่าคอมไม่สำเร็จ') }
    setAdjSaving(false)
  }

  // ── Helpers ──
  const defaultSetting = settings.find(s => s.lottery_type_id == null)
  const lotterySettings = settings.filter(s => s.lottery_type_id != null)

  /** Platform badge สี */
  const platformBadge = (platform: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      all:      { bg: 'rgba(0,229,160,0.15)', color: 'var(--accent)', label: 'ทุกแพลตฟอร์ม' },
      line:     { bg: 'rgba(6,199,85,0.15)', color: '#06C755', label: 'LINE' },
      facebook: { bg: 'rgba(24,119,242,0.15)', color: '#1877F2', label: 'Facebook' },
      telegram: { bg: 'rgba(38,166,224,0.15)', color: '#26A6E0', label: 'Telegram' },
    }
    const m = map[platform] || map.all
    return (
      <span style={{ background: m.bg, color: m.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
        {m.label}
      </span>
    )
  }

  /** Adjustment type badge สี */
  const adjTypeBadge = (type: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      add:    { bg: 'rgba(0,229,160,0.15)', color: 'var(--accent)', label: 'เพิ่ม' },
      deduct: { bg: 'rgba(255,69,58,0.15)', color: '#FF453A', label: 'หัก' },
      cancel: { bg: 'rgba(255,159,10,0.15)', color: '#FF9F0A', label: 'ยกเลิก' },
    }
    const m = map[type] || map.add
    return (
      <span style={{ background: m.bg, color: m.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
        {m.label}
      </span>
    )
  }

  const adjTotalPages = Math.ceil(adjTotal / ADJ_PER_PAGE)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ตั้งค่า Affiliate</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          ตั้ง commission rate ที่ผู้แนะนำจะได้รับจากยอดเดิมพันของเพื่อนที่ชวนมา
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         Tab Navigation — แถบเลือก section
         ══════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: 'var(--bg-elevated)', borderRadius: 12, padding: 4,
        border: '1px solid var(--border)',
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
         Tab: ตั้งค่า Rate (เดิม — วิธีการทำงาน + commission rate settings)
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <>
          {/* วิธีการทำงาน */}
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

          {/* ตั้งค่า Commission Rate */}
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
              {/* Default rate card */}
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
                  ยังไม่มี rate — กดปุ่ม &quot;เพิ่ม Rate&quot; เพื่อเริ่มต้น
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         Tab: รายงาน Commission (เดิม)
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'report' && (
        <>
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         Tab: ข้อความแชร์ — Share Templates
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <>
          {/* Header + ปุ่มเพิ่ม */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} color="var(--accent)" />
              <span style={{ fontSize: 15, fontWeight: 700 }}>ข้อความแชร์สำเร็จรูป</span>
            </div>
            <button className="btn btn-primary" onClick={openAddTemplate} style={{ height: 32, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> เพิ่ม Template
            </button>
          </div>

          {/* คำอธิบาย placeholder */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.6,
          }}>
            ตัวแปรที่ใช้ได้ในเนื้อหา: <code style={{ background: 'var(--bg-base)', padding: '1px 4px', borderRadius: 4 }}>{'{link}'}</code> = ลิงก์แนะนำ ·{' '}
            <code style={{ background: 'var(--bg-base)', padding: '1px 4px', borderRadius: 4 }}>{'{code}'}</code> = รหัสแนะนำ ·{' '}
            <code style={{ background: 'var(--bg-base)', padding: '1px 4px', borderRadius: 4 }}>{'{username}'}</code> = ชื่อผู้แนะนำ
          </div>

          {loadingTemplates ? <Loading inline text="กำลังโหลด..." /> : templates.length === 0 ? (
            /* Empty state */
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 12, padding: '40px 20px',
              textAlign: 'center', border: '1px dashed var(--border)',
            }}>
              <MessageSquare size={32} color="var(--text-tertiary)" style={{ marginBottom: 8, opacity: 0.5 }} />
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                ยังไม่มีข้อความแชร์ — กดปุ่ม &quot;เพิ่ม Template&quot; เพื่อสร้าง
              </div>
            </div>
          ) : (
            /* Template list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {templates.map(t => (
                <div key={t.id} style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '14px 18px',
                }}>
                  {/* Header row: ชื่อ + platform badge + actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</span>
                      {platformBadge(t.platform)}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {/* คัดลอก */}
                      <button onClick={() => copyTemplateContent(t.content)} title="คัดลอก" style={{
                        background: 'var(--bg-base)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: 6, cursor: 'pointer',
                      }}>
                        <Copy size={13} color="var(--text-secondary)" />
                      </button>
                      {/* แก้ไข */}
                      <button onClick={() => openEditTemplate(t)} title="แก้ไข" style={{
                        background: 'var(--bg-base)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: 6, cursor: 'pointer',
                      }}>
                        <Pencil size={13} color="var(--text-secondary)" />
                      </button>
                      {/* ลบ */}
                      <button onClick={() => handleDeleteTemplate(t)} title="ลบ" style={{
                        background: 'none', border: '1px solid var(--border)',
                        borderRadius: 8, padding: 6, cursor: 'pointer',
                      }}>
                        <Trash2 size={13} color="var(--status-error)" />
                      </button>
                    </div>
                  </div>
                  {/* Content preview */}
                  <div style={{
                    background: 'var(--bg-base)', borderRadius: 8, padding: '10px 12px',
                    fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    maxHeight: 120, overflow: 'auto',
                  }}>
                    {t.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         Tab: ปรับค่าคอม — Commission Adjustments
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'adjustments' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Settings size={16} color="var(--accent)" />
            <span style={{ fontSize: 15, fontWeight: 700 }}>ปรับค่าคอมมิชชั่น</span>
          </div>

          {/* ── ฟอร์มปรับค่าคอม ── */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 20px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
              สร้างรายการปรับค่าคอม
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Member ID */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Member ID</div>
                <input
                  className="input" type="number" placeholder="เช่น 11"
                  value={adjMemberId} onChange={e => setAdjMemberId(e.target.value)}
                />
              </div>
              {/* ประเภท */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ประเภท</div>
                <select className="input" value={adjType} onChange={e => setAdjType(e.target.value as 'add' | 'deduct' | 'cancel')}>
                  <option value="add">เพิ่มค่าคอม (add)</option>
                  <option value="deduct">หักค่าคอม (deduct)</option>
                  <option value="cancel">ยกเลิกรายการ (cancel)</option>
                </select>
              </div>
              {/* จำนวนเงิน */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>จำนวนเงิน (฿)</div>
                <input
                  className="input" type="number" min="0" step="0.01" placeholder="เช่น 100"
                  value={adjAmount} onChange={e => setAdjAmount(e.target.value)}
                />
              </div>
              {/* Commission ID (เฉพาะ cancel) */}
              {adjType === 'cancel' && (
                <div>
                  <div className="label" style={{ marginBottom: 6 }}>Commission ID (สำหรับยกเลิก)</div>
                  <input
                    className="input" type="number" placeholder="ID รายการ commission ที่ต้องการยกเลิก"
                    value={adjCommissionId} onChange={e => setAdjCommissionId(e.target.value)}
                  />
                </div>
              )}
            </div>
            {/* เหตุผล — full width */}
            <div style={{ marginTop: 12 }}>
              <div className="label" style={{ marginBottom: 6 }}>เหตุผล</div>
              <textarea
                className="input" rows={2} placeholder="เช่น ปรับค่าคอมโปรโมชั่นพิเศษ"
                value={adjReason} onChange={e => setAdjReason(e.target.value)}
                style={{ resize: 'vertical', minHeight: 48 }}
              />
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmitAdjustment}
                disabled={adjSaving}
                style={{ height: 36, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {adjSaving ? 'กำลังบันทึก...' : (
                  <><Plus size={14} /> ปรับค่าคอม</>
                )}
              </button>
            </div>
          </div>

          {/* ── ตารางประวัติ ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileText size={14} color="var(--text-secondary)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>ประวัติการปรับค่าคอม</span>
          </div>

          <div className="card-surface" style={{ padding: 0 }}>
            {loadingAdjustments ? <Loading inline text="กำลังโหลด..." /> : adjustments.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                ยังไม่มีรายการปรับค่าคอม
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>Admin</th>
                    <th>สมาชิก</th>
                    <th style={{ textAlign: 'center' }}>ประเภท</th>
                    <th style={{ textAlign: 'right' }}>จำนวน</th>
                    <th>เหตุผล</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustments.map(adj => (
                    <tr key={adj.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {adj.created_at ? new Date(adj.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      <td style={{ fontSize: 12 }}>{adj.admin?.username || `#${adj.admin_id}`}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{adj.member?.username || '-'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>ID: {adj.member_id}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{adjTypeBadge(adj.type)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                        <span style={{ color: adj.type === 'deduct' ? '#FF453A' : adj.type === 'cancel' ? '#FF9F0A' : 'var(--accent)' }}>
                          {adj.type === 'deduct' ? '-' : adj.type === 'add' ? '+' : ''}฿{adj.amount?.toFixed?.(2) || '0.00'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {adj.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {adjTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button
                onClick={() => setAdjPage(p => Math.max(1, p - 1))}
                disabled={adjPage <= 1}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 10px', cursor: adjPage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: adjPage <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center',
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                หน้า {adjPage} / {adjTotalPages}
              </span>
              <button
                onClick={() => setAdjPage(p => Math.min(adjTotalPages, p + 1))}
                disabled={adjPage >= adjTotalPages}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 10px', cursor: adjPage >= adjTotalPages ? 'not-allowed' : 'pointer',
                  opacity: adjPage >= adjTotalPages ? 0.4 : 1, display: 'flex', alignItems: 'center',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         Modal: เพิ่ม/แก้ไข Commission Rate (เดิม)
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

      {/* ══════════════════════════════════════════════════════════════
         Modal: เพิ่ม/แก้ไข Share Template
         ══════════════════════════════════════════════════════════════ */}
      {showTemplateForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {editingTemplateId ? 'แก้ไข Template' : 'เพิ่ม Template ใหม่'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* ชื่อ template */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ชื่อ Template</div>
                <input
                  className="input" type="text" placeholder="เช่น ข้อความชวนเพื่อน LINE"
                  value={tplName} onChange={e => setTplName(e.target.value)}
                />
              </div>

              {/* แพลตฟอร์ม */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>แพลตฟอร์ม</div>
                <select className="input" value={tplPlatform} onChange={e => setTplPlatform(e.target.value)}>
                  <option value="all">ทุกแพลตฟอร์ม</option>
                  <option value="line">LINE</option>
                  <option value="facebook">Facebook</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>

              {/* เนื้อหา */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>เนื้อหา</div>
                <textarea
                  className="input" rows={5}
                  placeholder={'มาเล่นหวยด้วยกันเถอะ!\nสมัครผ่านลิงก์นี้: {link}\nใส่รหัส: {code}\nจาก {username}'}
                  value={tplContent} onChange={e => setTplContent(e.target.value)}
                  style={{ resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
                />
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  ใช้ {'{link}'} {'{code}'} {'{username}'} เป็นตัวแปรที่จะถูกแทนที่อัตโนมัติ
                </div>
              </div>

              {/* ลำดับ */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ลำดับการแสดง</div>
                <input
                  className="input" type="number" min="0" placeholder="0"
                  value={tplSortOrder} onChange={e => setTplSortOrder(e.target.value)}
                />
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  ตัวเลขน้อย = แสดงก่อน
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1, height: 38 }} onClick={() => setShowTemplateForm(false)}>ยกเลิก</button>
              <button className="btn btn-primary" style={{ flex: 1, height: 38, fontWeight: 600 }} onClick={handleSaveTemplate} disabled={tplSaving}>
                {tplSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ConfirmDialog (ใช้ร่วมกันทุก tab) */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  )
}
