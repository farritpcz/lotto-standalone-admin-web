// API client — shared axios instance + interceptors
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1
//
// ⭐ ใช้ relative URL → Next.js rewrites proxy ไป backend (same-origin สำหรับ httpOnly cookie)
// ⭐ CSRF token อ่านจาก admin_csrf_token cookie → ส่งกลับ X-CSRF-Token header
// ⭐ 401 response → redirect /login (ยกเว้นหน้า /login และ /node/*)

import axios, { AxiosInstance } from 'axios'

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
        // ข้าม: หน้า /login (กำลัง login อยู่) + หน้า /node/* (ใช้ node_token แยก)
        const path = window.location.pathname
        if (!path.startsWith('/login') && !path.startsWith('/node')) {
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
