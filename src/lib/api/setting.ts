// API client — settings, agent theme, notifications
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'
import type { NotifyGroup } from './_types'

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
// ⭐ Notifications API — Telegram webhook
// =============================================================================

export const notificationApi = {
  /** ดึงกลุ่มแจ้งเตือนทั้งหมด */
  getGroups: () => api.get('/notifications/config'),

  /** บันทึกกลุ่มทั้งหมด (replace all) */
  saveGroups: (groups: NotifyGroup[]) => api.put('/notifications/config', groups),

  /** ทดสอบส่ง notification ไปกลุ่มเดียว */
  test: (groupId?: string) => api.post('/notifications/test', { group_id: groupId }),

  /** @deprecated ใช้ getGroups แทน */
  getConfig: () => api.get('/notifications/config'),
  /** @deprecated ใช้ saveGroups แทน */
  updateConfig: (data: NotifyGroup) => api.put('/notifications/config', [data]),
}
