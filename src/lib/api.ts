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
}

// Lotteries
export const lotteryMgmtApi = {
  list: () => api.get('/lotteries'),
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
