/**
 * API Client สำหรับ lotto-standalone-admin-web (#6)
 *
 * ความสัมพันธ์:
 * - เรียก API ของ: #5 lotto-standalone-admin-api (port 8081)
 * - ใช้ Admin JWT token (แยกจาก member JWT)
 * - provider-backoffice-admin-web (#10) มี api.ts คล้ายกัน
 *   ต่างกันที่: base URL, มีหน้า operators เพิ่ม
 *   TODO: แยก shared admin API functions เป็น @lotto/admin-api
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

// ⭐ port 8081 (admin API) ไม่ใช่ 8080 (member API)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1'

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  })

  // Admin JWT token
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('admin_token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return client
}

export const api = createApiClient()

// =============================================================================
// Admin API Functions
// =============================================================================

// Auth
export const adminAuthApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
}

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
}

// Members
export const memberMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/members', { params }),
  get: (id: number) => api.get(`/members/${id}`),
  update: (id: number, data: Record<string, unknown>) => api.put(`/members/${id}`, data),
  updateStatus: (id: number, status: string) => api.put(`/members/${id}/status`, { status }),
  adjustBalance: (id: number, amount: number, note: string) => api.put(`/members/${id}/balance`, { amount, note }),
}

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
}

// Results — ⭐ กรอกผล → trigger payout (lotto-core)
export const resultMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/results', { params }),
  submit: (roundId: number, data: { top3: string; top2: string; bottom2: string }) =>
    api.post(`/results/${roundId}`, data),
  /** preview ก่อนกรอกผล — ใครจะถูก จ่ายเท่าไร */
  preview: (roundId: number, data: { top3: string; top2: string; bottom2: string }) =>
    api.post(`/results/${roundId}/preview`, data),
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

// Bets & Transactions
export const betMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/bets', { params }),
}
export const txMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/transactions', { params }),
}

// Reports
export const reportApi = {
  summary: (params?: Record<string, unknown>) => api.get('/reports/summary', { params }),
  profit: (params?: Record<string, unknown>) => api.get('/reports/profit', { params }),
}

// Settings
export const settingApi = {
  get: () => api.get('/settings'),
  update: (data: Record<string, unknown>) => api.put('/settings', data),
}

// =============================================================================
// Deposit Requests — อนุมัติ/ปฏิเสธคำขอฝากเงิน
// =============================================================================
export const depositApi = {
  list: (params?: Record<string, unknown>) => api.get('/deposits', { params }),
  approve: (id: number) => api.put(`/deposits/${id}/approve`),
  reject: (id: number) => api.put(`/deposits/${id}/reject`),
}

// =============================================================================
// Withdraw Requests — อนุมัติ/ปฏิเสธคำขอถอนเงิน
// =============================================================================
export const withdrawApi = {
  list: (params?: Record<string, unknown>) => api.get('/withdrawals', { params }),
  approve: (id: number) => api.put(`/withdrawals/${id}/approve`),
  reject: (id: number) => api.put(`/withdrawals/${id}/reject`),
}

// =============================================================================
// Affiliate (Commission) — ตั้งค่า commission rates + ดู commission report
//
// Routes ที่ใช้ (admin-api #5):
//   GET  /affiliate/settings  → ดูทุก setting (default + per-lottery)
//   POST /affiliate/settings  → สร้าง/อัพเดท setting
//   DELETE /affiliate/settings/:id → ปิดใช้ setting
//   GET  /affiliate/report    → รายงาน commission สำหรับ agent
// =============================================================================
export const affiliateApi = {
  /** ดึง settings ทั้งหมด (default + per lottery type) */
  getSettings: () => api.get('/affiliate/settings'),

  /** upsert setting: lottery_type_id=null → default, number → per-lottery */
  upsertSetting: (data: {
    lottery_type_id: number | null
    commission_rate: number
    withdrawal_min: number
    withdrawal_note: string
  }) => api.post('/affiliate/settings', data),

  /** ลบ setting (soft-delete → status = inactive) */
  deleteSetting: (id: number) => api.delete(`/affiliate/settings/${id}`),

  /** รายงาน commission: referrer ทุกคน + ยอดรวม + ยอด pending */
  getReport: (params?: Record<string, unknown>) => api.get('/affiliate/report', { params }),
}

// TypeScript types สำหรับ affiliate
export interface AffiliateSetting {
  id: number
  agent_id: number
  lottery_type_id: number | null      // null = default ทุกประเภทหวย
  commission_rate: number             // % เช่น 0.5 = 0.5%
  withdrawal_min: number
  withdrawal_note: string
  status: string
  lottery_type?: { id: number; name: string; code: string }
}

export interface AffiliateReportRow {
  member_id: number
  username: string
  total_referred: number
  total_commission: number
  pending_commission: number
}
