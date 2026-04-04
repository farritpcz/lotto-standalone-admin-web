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

import axios, { AxiosInstance } from 'axios'

// ⭐ ใช้ relative URL → Next.js rewrites proxy ไป backend (same-origin สำหรับ httpOnly cookie)
const API_BASE_URL = '/api/v1'

/** อ่าน cookie value จาก document.cookie */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // ⭐ ส่ง httpOnly cookie ทุก request (แทน localStorage token)
    headers: { 'Content-Type': 'application/json' },
  })

  // ⭐ CSRF: อ่าน admin_csrf_token cookie → ส่งกลับใน X-CSRF-Token header
  client.interceptors.request.use((config) => {
    const csrfToken = getCookie('admin_csrf_token')
    if (csrfToken && config.headers) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        // ⭐ Cookie หมดอายุ/invalid → redirect login
        if (!window.location.pathname.startsWith('/login')) {
          // ลบ old localStorage token ที่อาจค้างจากก่อน migration
          try { localStorage.removeItem('admin_token') } catch {}
          window.location.href = '/login'
        }
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
  /** Logout — ลบ httpOnly cookie ที่ backend */
  logout: () => api.post('/auth/logout'),
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

// ⭐ Agent Theme — ตั้งค่าสีธีม
export const agentThemeApi = {
  get: () => api.get('/agent/theme'),
  update: (data: Record<string, string>) => api.put('/agent/theme', data),
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

  // ── Share Templates CRUD — ข้อความแชร์สำเร็จรูป ──
  /** ดึง share template ทั้งหมด */
  getShareTemplates: () => api.get('/affiliate/share-templates'),
  /** สร้าง share template ใหม่ */
  createShareTemplate: (data: { name: string; content: string; platform?: string; sort_order?: number }) =>
    api.post('/affiliate/share-templates', data),
  /** อัพเดท share template (partial update) */
  updateShareTemplate: (id: number, data: Record<string, unknown>) =>
    api.put(`/affiliate/share-templates/${id}`, data),
  /** ลบ share template (soft delete) */
  deleteShareTemplate: (id: number) =>
    api.delete(`/affiliate/share-templates/${id}`),

  // ── Commission Adjustments — ปรับค่าคอมมิชชั่น ──
  /** ดึงรายการปรับค่าคอม (filter by member_id, paginated) */
  getAdjustments: (params?: { member_id?: number; page?: number; per_page?: number }) =>
    api.get('/affiliate/adjustments', { params }),
  /** สร้างรายการปรับค่าคอม (เพิ่ม/หัก/ยกเลิก) */
  createAdjustment: (data: { member_id: number; type: 'add' | 'deduct' | 'cancel'; amount: number; reason: string; commission_id?: number }) =>
    api.post('/affiliate/adjustments', data),
}

// TypeScript types สำหรับ affiliate
export interface AffiliateSetting {
  id: number
  agent_id: number
  lottery_type_id: number | null | undefined  // null/undefined = default ทุกประเภทหวย
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

// ⭐ Share Template — ข้อความแชร์สำเร็จรูป (line/facebook/telegram)
export interface ShareTemplate {
  id: number
  agent_id: number
  name: string
  content: string
  platform: string          // 'all' | 'line' | 'facebook' | 'telegram'
  sort_order: number
  status: string
  created_at: string
  updated_at: string
}

// ⭐ Commission Adjustment — ปรับค่าคอม (เพิ่ม/หัก/ยกเลิก)
export interface CommissionAdjustment {
  id: number
  agent_id: number
  member_id: number
  admin_id: number
  type: 'add' | 'deduct' | 'cancel'
  amount: number
  reason: string
  commission_id?: number
  created_at: string
  member?: { id: number; username: string }
  admin?: { id: number; username: string }
}

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

  /** สถิติยี่กีวันนี้ */
  getStats: () => api.get('/yeekee/stats'),

  /** ดู config ยี่กี (agent ไหนเปิดอยู่) */
  getConfig: () => api.get('/yeekee/config'),

  /** เปิด/ปิดยี่กี สำหรับ agent */
  setConfig: (data: { agent_id: number; enabled: boolean }) =>
    api.post('/yeekee/config', data),
}

// TypeScript types สำหรับ Yeekee
export interface YeekeeRound {
  id: number
  lottery_round_id: number
  round_no: number
  start_time: string
  end_time: string
  status: 'waiting' | 'shooting' | 'calculating' | 'resulted'
  result_number: string
  total_shoots: number
  total_sum: number
  lottery_round?: {
    id: number
    round_number: string
    status: string
    result_top3?: string
    result_top2?: string
    result_bottom2?: string
  }
}

export interface YeekeeShoot {
  id: number
  yeekee_round_id: number
  member_id: number
  number: string
  shot_at: string
  member?: { id: number; username: string }
}

export interface YeekeeStats {
  total_rounds: number
  waiting_count: number
  shooting_count: number
  resulted_count: number
  total_shoots: number
  total_bets: number
  total_bet_amount: number
  total_payout: number
  profit: number
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

export interface AutoBanRuleData {
  id: number
  agent_id: number
  lottery_type_id: number
  bet_type: string
  threshold_amount: number
  action: string
  reduced_rate: number
  capital: number
  max_loss: number
  rate: number
  status: string
  lottery_type?: { id: number; name: string; code: string }
}
