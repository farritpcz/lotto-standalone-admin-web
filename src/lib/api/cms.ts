// API client — CMS (banners + ticker)
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'
import type { CmsBanner } from './_types'

export const cmsApi = {
  /** ดึงแบนเนอร์ทั้งหมด */
  listBanners: () => api.get('/cms/banners'),

  /** เพิ่มแบนเนอร์ */
  createBanner: (data: Partial<CmsBanner>) => api.post('/cms/banners', data),

  /** แก้ไขแบนเนอร์ */
  updateBanner: (id: number, data: Partial<CmsBanner>) => api.put(`/cms/banners/${id}`, data),

  /** ลบแบนเนอร์ */
  deleteBanner: (id: number) => api.delete(`/cms/banners/${id}`),

  /** จัดลำดับแบนเนอร์ */
  reorderBanners: (orders: { id: number; sort_order: number }[]) =>
    api.put('/cms/banners/reorder', { orders }),

  /** ดึงข้อความ ticker */
  getTicker: () => api.get('/cms/ticker'),

  /** อัพเดทข้อความ ticker */
  updateTicker: (ticker_text: string) => api.put('/cms/ticker', { ticker_text }),
}
