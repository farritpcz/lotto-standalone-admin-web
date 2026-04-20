// API client — affiliate (commission settings + reports + share templates + adjustments)
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1
//
// Routes ที่ใช้ (admin-api #5):
//   GET  /affiliate/settings  → ดูทุก setting (default + per-lottery)
//   POST /affiliate/settings  → สร้าง/อัพเดท setting
//   DELETE /affiliate/settings/:id → ปิดใช้ setting
//   GET  /affiliate/report    → รายงาน commission สำหรับ agent

import { api } from './_client'

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
