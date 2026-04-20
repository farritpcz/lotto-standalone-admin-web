// API client — yeekee management
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'

// =============================================================================
// ⭐ Yeekee Management API — ดูรอบ + สถิติยี่กี
// =============================================================================

export const yeekeeMgmtApi = {
  /** รายการรอบยี่กี (paginated + filter) */
  listRounds: (params?: { status?: string; date?: string; page?: number; per_page?: number }) =>
    api.get('/yeekee/rounds', { params }),

  /** ดูรอบเดียว + shoots + bet summary */
  getRound: (id: number) => api.get(`/yeekee/rounds/${id}`),

  /** ดูเลขยิงในรอบ (paginated) */
  getShoots: (id: number, params?: { page?: number; per_page?: number }) =>
    api.get(`/yeekee/rounds/${id}/shoots`, { params }),

  /** ⭐ แอดมินกดออกผลยี่กี manual (เฉพาะรอบ missed) */
  settleRound: (id: number) => api.post(`/yeekee/rounds/${id}/settle`),

  /** สถิติยี่กีวันนี้ */
  getStats: () => api.get('/yeekee/stats'),

  /** ดู config ยี่กี (agent ไหนเปิดอยู่) */
  getConfig: () => api.get('/yeekee/config'),

  /** เปิด/ปิดยี่กี สำหรับ agent */
  setConfig: (data: { agent_node_id: number; enabled: boolean }) =>
    api.post('/yeekee/config', data),
}
