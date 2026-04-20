// API client — dashboard
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1

import { api } from './_client'

export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
}
