// API client — bets, bans, rates, auto-ban
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'
import type { AutoBanRuleData } from './_types'

// Bets & Transactions
export const betMgmtApi = {
  /** ดึงรายการเดิมพัน (params: page, per_page, status, q, date_from, date_to, lottery_type_id) */
  list: (params?: Record<string, unknown>) => api.get('/bets', { params }),
  /** ดึงทุก bets ในบิลเดียวกัน (batch_id) */
  getBill: (batchId: string) => api.get(`/bets/bill/${batchId}`),
  /** ดึง timeline log ของรายการเดิมพัน */
  getLogs: (id: number) => api.get(`/bets/${id}/logs`),
  /** ยกเลิก/void bet เดี่ยว */
  cancel: (id: number, refund: boolean, reason?: string) => api.put(`/bets/${id}/cancel`, { refund, reason }),
  /** ยกเลิกทั้งบิล — refund=true คืนเครดิต, false=ไม่คืน */
  cancelBill: (batchId: string, refund: boolean, reason?: string) => api.put(`/bets/bill/${batchId}/cancel`, { refund, reason }),
}

// Number Bans
export const banMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/bans', { params }),
  create: (data: Record<string, unknown>) => api.post('/bans', data),
  delete: (id: number) => api.delete(`/bans/${id}`),
}

// Pay Rates
export const rateMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/rates', { params }),
  update: (id: number, data: Record<string, unknown>) => api.put(`/rates/${id}`, data),
}

// =============================================================================
// ⭐ Auto-Ban Rules API — กฎอั้นเลขอัตโนมัติ
// =============================================================================

export const autoBanApi = {
  /** ดึงกฎทั้งหมด (filter by lottery_type_id) */
  list: (params?: { lottery_type_id?: number }) =>
    api.get('/auto-ban-rules', { params }),

  /** สร้างกฎ 1 กฎ */
  create: (data: Partial<AutoBanRuleData>) =>
    api.post('/auto-ban-rules', data),

  /** สร้างกฎหลายกฎพร้อมกัน (จากคำนวณอัตโนมัติ) */
  bulkCreate: (data: {
    lottery_type_id: number
    capital: number
    max_loss: number
    rules: { bet_type: string; threshold_amount: number; action: string; rate: number; reduced_rate?: number }[]
  }) => api.post('/auto-ban-rules/bulk', data),

  /** แก้ไขกฎ */
  update: (id: number, data: Partial<AutoBanRuleData>) =>
    api.put(`/auto-ban-rules/${id}`, data),

  /** ลบกฎ (soft delete) */
  delete: (id: number) => api.delete(`/auto-ban-rules/${id}`),
}
