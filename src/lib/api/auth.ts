// API client — auth (admin + node)
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'

// Auth
export const adminAuthApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  /** Logout — ลบ httpOnly cookie ที่ backend */
  logout: () => api.post('/auth/logout'),
}

// ⭐ Node auth — ใช้ node_token cookie (แยกจาก admin_token)
export const nodeAuthApi = {
  /** Login ด้วย username/password จาก agent_nodes */
  login: (data: { username: string; password: string }) =>
    api.post('/node/auth/login', data),
  /** Logout — ลบ node_token cookie */
  logout: () => api.post('/node/auth/logout'),
}
