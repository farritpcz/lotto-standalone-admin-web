// API client — node portal + downline (agent tree)
// Parent barrel: src/lib/api.ts
// Rule: docs/rules/downline_system.md + docs/coding_standards.md §4.1
//
// ⭐ Node Portal — ใช้ JWT cookie "node_token" (แยกจาก admin_token)
// ⭐ Downline — hierarchical profit sharing (admin→share_holder→senior→master→agent→agent_downline)

import { api } from './_client'

// =============================================================================
// ⭐ Node Portal API — portal สำหรับ agent node (แยกจาก admin)
//
// ใช้ JWT cookie "node_token" (แยกจาก admin_token)
// กฎสิทธิ์:
//   - เห็นทั้งสาย (ancestors + self + descendants)
//   - แก้ไขได้เฉพาะลูกตรง (parent_id = ตัวเอง)
//   - หลาน/เหลน = read-only
// =============================================================================

export const nodePortalApi = {
  /** ดูข้อมูลตัวเอง */
  getMe: () => api.get('/node/me'),
  /** ดู tree ที่เกี่ยวข้อง (ancestors + self + descendants, พร้อม editable flag) */
  getTree: () => api.get('/node/tree'),
  /** ดูลูกตรง (แก้ไขได้) */
  listChildren: () => api.get('/node/children'),
  /** สร้างลูกตรง */
  createChild: (data: {
    name: string; username: string; password: string; share_percent: number;
    phone?: string; line_id?: string; note?: string
  }) => api.post('/node/children', data),
  /** แก้ไขลูกตรง (403 ถ้าไม่ใช่ลูกตรง) */
  updateChild: (id: number, data: Record<string, unknown>) =>
    api.put(`/node/children/${id}`, data),
  /** ลบลูกตรง (403 ถ้าไม่ใช่ลูกตรง) */
  deleteChild: (id: number) => api.delete(`/node/children/${id}`),
  /** ดูกำไร/ขาดทุน */
  getProfits: (params?: { date_from?: string; date_to?: string; page?: number; per_page?: number }) =>
    api.get('/node/profits', { params }),
}

// =============================================================================
// ⭐ Agent Downline API — ระบบปล่อยสาย (Hierarchical Profit Sharing)
//
// โครงสร้าง: admin(100%) → share_holder → senior → master → agent → agent_downline
// กำไร = ส่วนต่าง % ระหว่างตัวเองกับลูก
//
// Routes (admin-api #5):
//   GET  /downline/tree                      → tree ทั้งหมด
//   CRUD /downline/nodes                     → จัดการ node
//   GET  /downline/nodes/:id/commission      → ดู % แยกหวย
//   PUT  /downline/nodes/:id/commission      → ตั้ง % แยกหวย
//   GET  /downline/profits                   → รายงานกำไรรวม
//   GET  /downline/profits/:nodeId           → รายงานกำไร node
// =============================================================================

export const downlineApi = {
  /** ดึง tree ทั้งหมด (hierarchical, nested children) */
  getTree: (params?: { agent_node_id?: number }) =>
    api.get('/downline/tree', { params }),

  /** ดึง nodes แบบ flat (paginated) */
  listNodes: (params?: { page?: number; per_page?: number; q?: string; role?: string; parent_id?: number; status?: string }) =>
    api.get('/downline/nodes', { params }),

  /** ดึง node detail + children ชั้นเดียว */
  getNode: (id: number) => api.get(`/downline/nodes/${id}`),

  /** สร้าง node ใหม่ (= สร้างเว็บจริง ถ้ามี domain) */
  createNode: (data: {
    parent_id: number | null
    name: string
    username: string
    password: string
    share_percent: number
    role?: string
    phone?: string
    line_id?: string
    note?: string
    // ⭐ ข้อมูลเว็บไซต์ — ผูก domain สำหรับ multi-agent
    code?: string
    domain?: string
    site_name?: string
    theme?: string // ธีมเว็บ เช่น "default"
  }) => api.post('/downline/nodes', data),

  /** แก้ไข node (partial update) */
  updateNode: (id: number, data: Partial<{
    name: string
    share_percent: number
    phone: string
    line_id: string
    note: string
    status: string
    password: string
  }>) => api.put(`/downline/nodes/${id}`, data),

  /** ลบ node (ต้องไม่มีลูก/สมาชิก) */
  deleteNode: (id: number) => api.delete(`/downline/nodes/${id}`),

  /** ดู commission settings (% แยกหวย) */
  getCommission: (nodeId: number) => api.get(`/downline/nodes/${nodeId}/commission`),

  /** ตั้ง commission settings (% แยกหวย) */
  updateCommission: (nodeId: number, settings: { lottery_type: string; share_percent: number }[]) =>
    api.put(`/downline/nodes/${nodeId}/commission`, { settings }),

  /** รายงานกำไรรวมทุก node */
  getProfits: (params?: { date_from?: string; date_to?: string; node_id?: number; page?: number; per_page?: number }) =>
    api.get('/downline/profits', { params }),

  /** รายงานกำไรของ node เดียว */
  getNodeProfits: (nodeId: number, params?: { date_from?: string; date_to?: string; page?: number; per_page?: number }) =>
    api.get(`/downline/profits/${nodeId}`, { params }),

  /** ⭐ รายงานเคลียสายงาน — เว็บตัวเอง + ใต้สาย + สรุป */
  getReport: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/downline/report', { params }),
}
