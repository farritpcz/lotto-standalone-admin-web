/**
 * API Client สำหรับ lotto-standalone-admin-web (#6) — Barrel
 *
 * ความสัมพันธ์:
 * - เรียก API ของ: #5 lotto-standalone-admin-api (port 8081)
 * - ใช้ Admin JWT token (แยกจาก member JWT)
 * - provider-backoffice-admin-web (#10) มี api.ts คล้ายกัน
 *   ต่างกันที่: base URL, มีหน้า operators เพิ่ม
 *   TODO: แยก shared admin API functions เป็น @lotto/admin-api
 *
 * ⭐ ไฟล์นี้เป็น barrel — re-export ทั้งหมดจาก ./api/* เพื่อให้ caller เดิม
 * (`import { xxxApi } from '@/lib/api'`) ยังใช้งานได้ตามเดิม
 * ดูโครงสร้างไฟล์แยกที่ src/lib/api/*.ts
 */

// Shared axios instance + interceptors
export * from './api/_client'
// Shared types/interfaces
export * from './api/_types'

// Per-resource APIs
export * from './api/auth'
export * from './api/dashboard'
export * from './api/member'
export * from './api/lottery'
export * from './api/bet'
export * from './api/transaction'
export * from './api/report'
export * from './api/setting'
export * from './api/affiliate'
export * from './api/node'
export * from './api/yeekee'
export * from './api/promotion'
export * from './api/cms'
