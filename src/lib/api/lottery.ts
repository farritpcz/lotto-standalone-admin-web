// API client — lottery (lotteries, rounds, results)
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'

// Lotteries
export const lotteryMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/lotteries', { params }),
  create: (data: Record<string, unknown>) => api.post('/lotteries', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/lotteries/${id}`, data),
}

// Rounds
export const roundMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/rounds', { params }),
  create: (data: Record<string, unknown>) => api.post('/rounds', data),
  updateStatus: (id: number, status: string) => api.put(`/rounds/${id}/status`, { status }),
  /** เปิดรับแทง manual (upcoming → open) */
  manualOpen: (id: number) => api.put(`/rounds/${id}/open`),
  /** ปิดรับแทง manual (open → closed) */
  manualClose: (id: number) => api.put(`/rounds/${id}/close`),
  /** ยกเลิกรอบ + refund ทุก bet */
  voidRound: (id: number, reason: string) => api.put(`/rounds/${id}/void`, { reason }),
  /** ดูตาราง schedule สร้างรอบอัตโนมัติ */
  getSchedules: () => api.get('/rounds/schedules'),
}

// Results — ⭐ กรอกผล → trigger payout (lotto-core)
// front3/bottom3 = optional (เฉพาะหวยไทยที่มี 3 ตัวหน้า/ล่าง)
export const resultMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/results', { params }),
  submit: (roundId: number, data: Record<string, string>) =>
    api.post(`/results/${roundId}`, data),
  preview: (roundId: number, data: Record<string, string>) =>
    api.post(`/results/${roundId}/preview`, data),
}
