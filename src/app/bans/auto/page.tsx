/**
 * Admin — ระบบอั้นเลขอัตโนมัติ (Auto-Ban Settings)
 *
 * แบ่ง section ตามประเภทหวย — จัดการง่าย:
 * - คำนวณกฎอั้นจากทุน + ยอมเสียสูงสุด (8 ระดับขั้นบันได)
 * - เลือกประเภทหวย → เห็นกฎอั้นทั้งหมด
 * - เพิ่ม/แก้ไข/ลบกฎ
 *
 * Page: /bans/auto (admin) — thin orchestrator
 * Subcomponents: src/components/bans/*
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { lotteryMgmtApi, autoBanApi, AutoBanRuleData } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import CalculatorCard from '@/components/bans/CalculatorCard'
import LotteryTypeSelector from '@/components/bans/LotteryTypeSelector'
import AutoRuleList from '@/components/bans/AutoRuleList'
import RuleExplanation from '@/components/bans/RuleExplanation'
import AddRuleModal, { AddRuleForm } from '@/components/bans/AddRuleModal'
import EditRuleModal from '@/components/bans/EditRuleModal'
import {
  LotteryType, PreviewRule, computePreviewRules, fmtMoney, getBetTypeLabel,
  loadCapitalFromStorage, saveCapitalToStorage,
} from '@/components/bans/shared'

const EMPTY_FORM: AddRuleForm = {
  bet_type: '3 ตัวบน', threshold_amount: '',
  action: 'full_ban', reduce_rate_to: '', max_per_person: '',
}

export default function AutoBanPage() {
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [selectedType, setSelectedType] = useState<LotteryType | null>(null)
  const [dbRules, setDbRules] = useState<AutoBanRuleData[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoBanRuleData | null>(null)
  const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)
  const [saving, setSaving] = useState(false)

  // Auto-calculate state
  const [capital, setCapital] = useState('')
  const [maxLoss, setMaxLoss] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [previewRules, setPreviewRules] = useState<PreviewRule[]>([])

  // Add form
  const [form, setForm] = useState<AddRuleForm>(EMPTY_FORM)

  // โหลดกฎจาก API
  const loadRules = useCallback(async () => {
    try {
      const params: Record<string, number> = {}
      if (selectedType) params.lottery_type_id = selectedType.id
      const res = await autoBanApi.list(params)
      setDbRules(res.data?.data || [])
    } catch { /* ignore */ }
  }, [selectedType])

  useEffect(() => {
    if (selectedType) loadRules()
  }, [selectedType, loadRules])

  // โหลดทุนจาก localStorage
  useEffect(() => {
    const saved = loadCapitalFromStorage()
    setCapital(saved.capital)
    setMaxLoss(saved.maxLoss)
  }, [])

  // โหลดประเภทหวย
  useEffect(() => {
    lotteryMgmtApi.list()
      .then(res => {
        const types: LotteryType[] = res.data?.data?.items || res.data?.data || []
        setLotteryTypes(types)
        if (types.length > 0) setSelectedType(types[0])
      })
      .catch(() => {
        setLotteryTypes([])
        setSelectedType(null)
      })
  }, [])

  // กฎของประเภทที่เลือก
  const currentRules = dbRules.filter(r => !selectedType || r.lottery_type_id === selectedType.id)

  // คำนวณ threshold
  const handleCalculate = useCallback(() => {
    const maxLossNum = Number(maxLoss)
    if (!selectedType || !maxLossNum || maxLossNum <= 0) return
    setPreviewRules(computePreviewRules(maxLossNum))
    setShowPreview(true)
  }, [selectedType, maxLoss])

  // ยืนยัน — สร้างกฎให้ทุกประเภทหวย (active)
  const handleApplyCalculated = useCallback(async () => {
    if (previewRules.length === 0 || lotteryTypes.length === 0) return
    setSaving(true)
    const ruleData = previewRules.map(pr => ({
      bet_type: pr.betType,
      threshold_amount: pr.threshold,
      action: pr.action,
      rate: pr.rate,
      reduced_rate: pr.reducedRate,
    }))
    try {
      const activeTypes = lotteryTypes.filter(lt => lt.status === 'active')
      for (const lt of activeTypes) {
        await autoBanApi.bulkCreate({
          lottery_type_id: lt.id,
          capital: Number(capital) || 0,
          max_loss: Number(maxLoss) || 0,
          rules: ruleData,
        })
      }
      setShowPreview(false)
      setPreviewRules([])
      saveCapitalToStorage(capital, maxLoss)
      await loadRules()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }, [previewRules, capital, maxLoss, loadRules, lotteryTypes])

  // เพิ่มกฎ manual
  const handleAdd = useCallback(async () => {
    if (!selectedType || !form.threshold_amount) return
    try {
      await autoBanApi.create({
        agent_node_id: 1,
        lottery_type_id: selectedType.id,
        bet_type: form.bet_type,
        threshold_amount: Number(form.threshold_amount),
        action: form.action,
        reduced_rate: form.action === 'reduce_rate' ? Number(form.reduce_rate_to) : 0,
      })
      setShowModal(false)
      setForm(EMPTY_FORM)
      await loadRules()
    } catch { /* ignore */ }
  }, [selectedType, form, loadRules])

  // ลบกฎ
  const handleDelete = useCallback((ruleId: number) => {
    const rule = currentRules.find(r => r.id === ruleId)
    setDialog({
      title: 'ลบกฎอั้น',
      message: `ลบกฎ ${getBetTypeLabel(rule?.bet_type || '')} (threshold ${fmtMoney(rule?.threshold_amount || 0)})?`,
      type: 'warning',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        setDialog(null)
        try {
          await autoBanApi.delete(ruleId)
          await loadRules()
        } catch { /* ignore */ }
      },
      onCancel: () => setDialog(null),
    })
  }, [currentRules, loadRules])

  // เคลียร์กฎทั้งหมดของประเภทที่เลือก
  const handleClearAll = useCallback(() => {
    if (!selectedType || currentRules.length === 0) return
    setDialog({
      title: 'เคลียร์กฎทั้งหมด',
      message: `ลบกฎอั้นอัตโนมัติทั้งหมดของ ${selectedType.name} (${currentRules.length} กฎ)?\n\nสามารถคำนวณใหม่ได้ตลอด`,
      type: 'danger',
      confirmLabel: 'เคลียร์ทั้งหมด',
      onConfirm: async () => {
        setDialog(null)
        try {
          await Promise.all(currentRules.map(r => autoBanApi.delete(r.id)))
          await loadRules()
        } catch { /* ignore */ }
      },
      onCancel: () => setDialog(null),
    })
  }, [selectedType, currentRules, loadRules])

  // แก้ไขกฎ
  const handleEdit = useCallback(async () => {
    if (!editingRule) return
    try {
      await autoBanApi.update(editingRule.id, {
        threshold_amount: editingRule.threshold_amount,
        action: editingRule.action,
        reduced_rate: editingRule.reduced_rate,
      })
      setEditingRule(null)
      await loadRules()
    } catch { /* ignore */ }
  }, [editingRule, loadRules])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleDeletePreserved = handleDelete // preserved — future UI hook-up

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">ระบบอั้นเลขอัตโนมัติ</h1>
          <p className="page-subtitle">ตั้ง threshold ยอดรวม → ระบบอั้นเลขให้อัตโนมัติ</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ เพิ่มกฎ</button>
      </div>

      {/* คำอธิบาย */}
      <div className="card-surface p-4 mb-4">
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
          <span className="font-bold text-[var(--text-primary)]">วิธีทำงาน:</span> เมื่อยอดรวมทุกคนต่อเลข ในรอบเดียวกัน ถึง threshold ที่ตั้งไว้<br />
          <span className="inline-flex items-center gap-1 mt-1">🚫 <span className="text-red-400 font-semibold">อั้นเต็ม</span> — ปิดรับเลขนั้น</span>
          <span className="inline-flex items-center gap-1 ml-4">📉 <span className="text-yellow-400 font-semibold">ลดเรท</span> — ลดอัตราจ่าย</span>
          <span className="inline-flex items-center gap-1 ml-4">📊 <span className="text-blue-400 font-semibold">จำกัดยอด</span> — จำกัดต่อคน</span>
        </div>
      </div>

      {/* Calculator */}
      <CalculatorCard
        capital={capital}
        maxLoss={maxLoss}
        selectedType={selectedType}
        showPreview={showPreview}
        previewRules={previewRules}
        lotteryTypes={lotteryTypes}
        saving={saving}
        setCapital={setCapital}
        setMaxLoss={setMaxLoss}
        onCalculate={handleCalculate}
        onCancel={() => setShowPreview(false)}
        onApply={handleApplyCalculated}
      />

      {/* Lottery type selector */}
      <LotteryTypeSelector
        lotteryTypes={lotteryTypes}
        selectedId={selectedType?.id || null}
        onChange={setSelectedType}
      />

      {/* Rules list */}
      {selectedType && (
        <AutoRuleList
          selectedType={selectedType}
          rules={currentRules}
          onAdd={() => setShowModal(true)}
          onClearAll={handleClearAll}
          onEdit={(r) => setEditingRule({ ...r })}
        />
      )}

      {/* Rule explanation */}
      {selectedType && <RuleExplanation rules={currentRules} />}

      {/* Modals */}
      {editingRule && (
        <EditRuleModal
          rule={editingRule}
          setRule={setEditingRule}
          onClose={() => setEditingRule(null)}
          onSubmit={handleEdit}
        />
      )}

      {showModal && (
        <AddRuleModal
          selectedType={selectedType}
          form={form}
          setForm={setForm}
          onClose={() => setShowModal(false)}
          onSubmit={handleAdd}
        />
      )}

      {dialog && <ConfirmDialog {...dialog} />}
    </div>
  )
}
