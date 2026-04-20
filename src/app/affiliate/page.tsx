/**
 * Admin — ตั้งค่า Affiliate / Commission (thin orchestrator)
 *
 * 4 tabs:
 *  1. ตั้งค่า Rate — commission rate (default + per-lottery)
 *  2. รายงาน Commission — per referrer
 *  3. ข้อความแชร์ — share templates
 *  4. ปรับค่าคอม — commission adjustments
 *
 * Subcomponents: src/components/affiliate/*
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  affiliateApi, lotteryMgmtApi,
  type AffiliateSetting, type AffiliateReportRow,
  type ShareTemplate, type CommissionAdjustment,
} from '@/lib/api'
import { useToast } from '@/components/Toast'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Percent, FileText, MessageSquare, Settings } from 'lucide-react'
import SettingsTab from '@/components/affiliate/SettingsTab'
import ReportTab from '@/components/affiliate/ReportTab'
import ShareTemplatesTab from '@/components/affiliate/ShareTemplatesTab'
import CommissionAdjustmentTab, { AdjType } from '@/components/affiliate/CommissionAdjustmentTab'
import RateFormModal from '@/components/affiliate/RateFormModal'
import TemplateFormModal from '@/components/affiliate/TemplateFormModal'

interface LotteryType { id: number; name: string; code: string }

const TABS = [
  { id: 'settings', label: 'ตั้งค่า Rate', icon: Percent },
  { id: 'report', label: 'รายงาน', icon: FileText },
  { id: 'templates', label: 'ข้อความแชร์', icon: MessageSquare },
  { id: 'adjustments', label: 'ปรับค่าคอม', icon: Settings },
] as const
type TabId = typeof TABS[number]['id']

const ADJ_PER_PAGE = 20

export default function AffiliatePage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabId>('settings')
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | null>(null)

  // ── Settings ──
  const [settings, setSettings] = useState<AffiliateSetting[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Rate form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formLotteryTypeId, setFormLotteryTypeId] = useState<string>('')
  const [formRate, setFormRate] = useState('')
  const [formWithdrawMin, setFormWithdrawMin] = useState('1')
  const [formWithdrawNote, setFormWithdrawNote] = useState('ถอนขั้นต่ำ 1 บาท')
  const [formSaving, setFormSaving] = useState(false)

  // ── Report ──
  const [report, setReport] = useState<AffiliateReportRow[]>([])
  const [loadingReport, setLoadingReport] = useState(true)

  // ── Share Templates ──
  const [templates, setTemplates] = useState<ShareTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [tplName, setTplName] = useState('')
  const [tplContent, setTplContent] = useState('')
  const [tplPlatform, setTplPlatform] = useState('all')
  const [tplSortOrder, setTplSortOrder] = useState('0')
  const [tplSaving, setTplSaving] = useState(false)

  // ── Adjustments ──
  const [adjustments, setAdjustments] = useState<CommissionAdjustment[]>([])
  const [loadingAdjustments, setLoadingAdjustments] = useState(true)
  const [adjPage, setAdjPage] = useState(1)
  const [adjTotal, setAdjTotal] = useState(0)
  const [adjMemberId, setAdjMemberId] = useState('')
  const [adjType, setAdjType] = useState<AdjType>('add')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReason, setAdjReason] = useState('')
  const [adjCommissionId, setAdjCommissionId] = useState('')
  const [adjSaving, setAdjSaving] = useState(false)

  // ── Data fetching ──
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

  const fetchTemplates = useCallback(() => {
    setLoadingTemplates(true)
    affiliateApi.getShareTemplates()
      .then(res => setTemplates(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false))
  }, [])

  useEffect(() => {
    if (activeTab !== 'templates') return
    // Defer to next tick so setState inside fetchTemplates doesn't fire synchronously
    const id = setTimeout(() => { void fetchTemplates() }, 0)
    return () => clearTimeout(id)
  }, [activeTab, fetchTemplates])

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
    if (activeTab !== 'adjustments') return
    const id = setTimeout(() => { void fetchAdjustments(adjPage) }, 0)
    return () => clearTimeout(id)
  }, [activeTab, adjPage, fetchAdjustments])

  // ── Rate handlers ──
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

  // ── Template handlers ──
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
        await affiliateApi.updateShareTemplate(editingTemplateId, {
          name: tplName, content: tplContent,
          platform: tplPlatform, sort_order: parseInt(tplSortOrder) || 0,
        })
      } else {
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
  const copyTemplateContent = (content: string) => {
    navigator.clipboard.writeText(content).then(() => toast.success('คัดลอกแล้ว'))
  }

  // ── Adjustment handlers ──
  const handleSubmitAdjustment = async () => {
    const memberId = parseInt(adjMemberId)
    if (!memberId || isNaN(memberId)) { toast.error('กรุณากรอก Member ID'); return }
    const amount = parseFloat(adjAmount)
    if (!amount || isNaN(amount) || amount <= 0) { toast.error('จำนวนเงินต้องมากกว่า 0'); return }
    if (!adjReason.trim()) { toast.error('กรุณากรอกเหตุผล'); return }
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
      setAdjMemberId(''); setAdjAmount(''); setAdjReason(''); setAdjCommissionId('')
      setAdjType('add')
      fetchAdjustments(adjPage)
    } catch { toast.error('ปรับค่าคอมไม่สำเร็จ') }
    setAdjSaving(false)
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

      {/* Tab Navigation */}
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

      {activeTab === 'settings' && (
        <SettingsTab
          settings={settings}
          loading={loadingSettings}
          onAdd={openAddForm}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      )}

      {activeTab === 'report' && (
        <ReportTab report={report} loading={loadingReport} />
      )}

      {activeTab === 'templates' && (
        <ShareTemplatesTab
          templates={templates}
          loading={loadingTemplates}
          onAdd={openAddTemplate}
          onEdit={openEditTemplate}
          onDelete={handleDeleteTemplate}
          onCopy={copyTemplateContent}
        />
      )}

      {activeTab === 'adjustments' && (
        <CommissionAdjustmentTab
          adjustments={adjustments}
          loading={loadingAdjustments}
          page={adjPage}
          totalPages={adjTotalPages}
          onPageChange={setAdjPage}
          memberId={adjMemberId}
          type={adjType}
          amount={adjAmount}
          reason={adjReason}
          commissionId={adjCommissionId}
          saving={adjSaving}
          setMemberId={setAdjMemberId}
          setType={setAdjType}
          setAmount={setAdjAmount}
          setReason={setAdjReason}
          setCommissionId={setAdjCommissionId}
          onSubmit={handleSubmitAdjustment}
        />
      )}

      {/* Rate form modal */}
      {showForm && (
        <RateFormModal
          editing={editingId !== null}
          lotteryTypes={lotteryTypes}
          lotteryTypeId={formLotteryTypeId}
          rate={formRate}
          withdrawMin={formWithdrawMin}
          withdrawNote={formWithdrawNote}
          saving={formSaving}
          setLotteryTypeId={setFormLotteryTypeId}
          setRate={setFormRate}
          setWithdrawMin={setFormWithdrawMin}
          setWithdrawNote={setFormWithdrawNote}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      {/* Template form modal */}
      {showTemplateForm && (
        <TemplateFormModal
          editing={editingTemplateId !== null}
          name={tplName}
          content={tplContent}
          platform={tplPlatform}
          sortOrder={tplSortOrder}
          saving={tplSaving}
          setName={setTplName}
          setContent={setTplContent}
          setPlatform={setTplPlatform}
          setSortOrder={setTplSortOrder}
          onClose={() => setShowTemplateForm(false)}
          onSave={handleSaveTemplate}
        />
      )}

      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  )
}
