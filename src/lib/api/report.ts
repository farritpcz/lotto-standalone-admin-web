// API client — reports
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'

export const reportApi = {
  summary: (params?: Record<string, unknown>) => api.get('/reports/summary', { params }),
  profit: (params?: Record<string, unknown>) => api.get('/reports/profit', { params }),
}
