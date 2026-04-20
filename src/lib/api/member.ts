// API client — member management (members, levels, credit reports)
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'
import type { MemberLevel, MemberLevelListResp, MemberLevelHistory } from './_types'

// Members
export const memberMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/members', { params }),
  get: (id: number) => api.get(`/members/${id}`),
  update: (id: number, data: Record<string, unknown>) => api.put(`/members/${id}`, data),
  updateStatus: (id: number, status: string) => api.put(`/members/${id}/status`, { status }),
  adjustBalance: (id: number, amount: number, note: string) => api.put(`/members/${id}/balance`, { amount, note }),
}

// =============================================================================
// ⭐ Member Levels API — ระบบ level สมาชิก (Bronze→Platinum)
// =============================================================================

export const memberLevelApi = {
  /** ดึง level ทั้งหมด + จำนวนสมาชิก + unassigned count */
  list: () => api.get<{ data: MemberLevelListResp }>('/member-levels'),

  /** สร้าง level ใหม่ */
  create: (data: Partial<MemberLevel>) => api.post('/member-levels', data),

  /** แก้ไข level */
  update: (id: number, data: Partial<MemberLevel>) => api.put(`/member-levels/${id}`, data),

  /** ลบ level */
  delete: (id: number) => api.delete(`/member-levels/${id}`),

  /** จัดลำดับ levels */
  reorder: (orders: { id: number; sort_order: number }[]) =>
    api.put('/member-levels/reorder', { orders }),

  /** ⭐ admin override — เปลี่ยน level ของสมาชิกคนหนึ่ง + lock (cron ไม่แก้) */
  overrideMember: (memberId: number, levelId: number | null, note?: string) =>
    api.put(`/members/${memberId}/level`, { level_id: levelId, note }),

  /** ⭐ ยกเลิก lock — ครั้งถัดไปที่ cron รัน จะคำนวณ level จาก deposit_30d อัตโนมัติ */
  unlockMember: (memberId: number) =>
    api.delete(`/members/${memberId}/level-lock`),

  /** ⭐ ประวัติการเปลี่ยนระดับของสมาชิก (100 รายการล่าสุด) */
  memberHistory: (memberId: number) =>
    api.get<{ data: MemberLevelHistory[] }>(`/members/${memberId}/level-history`),
}

// =============================================================================
// ⭐ Member Credit Report API — รายงานเครดิตสมาชิก
// =============================================================================

export const memberCreditApi = {
  /** ดึงรายงานเครดิตสมาชิก */
  report: (params: { member_id?: number; q?: string; from?: string; to?: string; page?: number; per_page?: number }) =>
    api.get('/reports/member-credit', { params }),
}
