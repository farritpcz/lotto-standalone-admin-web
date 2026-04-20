// API client — promotions
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'
import type { Promotion } from './_types'

export const promotionApi = {
  /** ดึงโปรโมชั่นทั้งหมด (filter: status, type) */
  list: (params?: { status?: string; type?: string }) =>
    api.get('/promotions', { params }),

  /** สร้างโปรโมชั่น */
  create: (data: Partial<Promotion>) => api.post('/promotions', data),

  /** แก้ไขโปรโมชั่น */
  update: (id: number, data: Partial<Promotion>) => api.put(`/promotions/${id}`, data),

  /** เปลี่ยนสถานะ (active/inactive) */
  updateStatus: (id: number, status: string) =>
    api.put(`/promotions/${id}/status`, { status }),

  /** ลบโปรโมชั่น (soft) */
  delete: (id: number) => api.delete(`/promotions/${id}`),
}
