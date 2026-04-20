// API client — transactions, deposits, withdrawals
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'

export const txMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/transactions', { params }),
}

// =============================================================================
// Deposit Requests — อนุมัติ/ปฏิเสธคำขอฝากเงิน
// =============================================================================
export const depositApi = {
  /** ดึงรายการฝาก (params: page, per_page, status, q) */
  list: (params?: Record<string, unknown>) => api.get('/deposits', { params }),
  /** ดึง timeline log ของรายการฝาก */
  getLogs: (id: number) => api.get(`/deposits/${id}/logs`),
  /** อนุมัติฝาก — เพิ่มเงิน + โบนัสฝากครั้งแรก (ถ้ามี) */
  approve: (id: number) => api.put(`/deposits/${id}/approve`),
  /** ปฏิเสธฝาก — ไม่เพิ่มเงิน */
  reject: (id: number, reason?: string) => api.put(`/deposits/${id}/reject`, { reason }),
  /** ยกเลิกฝากที่อนุมัติแล้ว — refund=true หักเครดิตคืน, false=ไม่หัก */
  cancel: (id: number, refund: boolean, reason?: string) => api.put(`/deposits/${id}/cancel`, { refund, reason }),
}

// =============================================================================
// Withdraw Requests — อนุมัติ/ปฏิเสธคำขอถอนเงิน
// =============================================================================
export const withdrawApi = {
  /** ดึงรายการถอน (params: page, per_page, status, q) */
  list: (params?: Record<string, unknown>) => api.get('/withdrawals', { params }),
  /** ดึง timeline log ของรายการถอน */
  getLogs: (id: number) => api.get(`/withdrawals/${id}/logs`),
  /** อนุมัติถอน — mode: "auto" (RKAUTO) หรือ "manual" (โอนเอง) */
  approve: (id: number, mode: 'auto' | 'manual') => api.put(`/withdrawals/${id}/approve`, { mode }),
  /** ปฏิเสธถอน — refund=true คืนเงิน, false=ไม่คืน (กรณีทุจริต) */
  reject: (id: number, refund: boolean, reason?: string) => api.put(`/withdrawals/${id}/reject`, { refund, reason }),
}
