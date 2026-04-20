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

import axios, { AxiosInstance } from 'axios'

// ⭐ ใช้ relative URL → Next.js rewrites proxy ไป backend (same-origin สำหรับ httpOnly cookie)
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

// =============================================================================
// Admin API Functions
// =============================================================================

// Auth
export const adminAuthApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  /** Logout — ลบ httpOnly cookie ที่ backend */
  logout: () => api.post('/auth/logout'),
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
  adjustBalance: (id: number, amount: number, note: string) => api.put(`/members/${id}/balance`, { amount, note }),
}

// Lotteries
export const lotteryMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/lotteries', { params }),
  create: (data: Record<string, unknown>) => api.post('/lotteries', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/lotteries/${id}`, data),
}

// Rounds
export const roundMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/rounds', { params }),
  create: (data: Record<string, unknown>) => api.post('/rounds', data),
  updateStatus: (id: number, status: string) => api.put(`/rounds/${id}/status`, { status }),
  /** เปิดรับแทง manual (upcoming → open) */
  manualOpen: (id: number) => api.put(`/rounds/${id}/open`),
  /** ปิดรับแทง manual (open → closed) */
  manualClose: (id: number) => api.put(`/rounds/${id}/close`),
  /** ยกเลิกรอบ + refund ทุก bet */
  voidRound: (id: number, reason: string) => api.put(`/rounds/${id}/void`, { reason }),
  /** ดูตาราง schedule สร้างรอบอัตโนมัติ */
  getSchedules: () => api.get('/rounds/schedules'),
}

// Results — ⭐ กรอกผล → trigger payout (lotto-core)
// front3/bottom3 = optional (เฉพาะหวยไทยที่มี 3 ตัวหน้า/ล่าง)
export const resultMgmtApi = {
  list: (params?: Record<string, unknown>) => api.get('/results', { params }),
  submit: (roundId: number, data: Record<string, string>) =>
    api.post(`/results/${roundId}`, data),
  preview: (roundId: number, data: Record<string, string>) =>
    api.post(`/results/${roundId}/preview`, data),
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
  /** ดึงรายการเดิมพัน (params: page, per_page, status, q, date_from, date_to, lottery_type_id) */
  list: (params?: Record<string, unknown>) => api.get('/bets', { params }),
  /** ดึงทุก bets ในบิลเดียวกัน (batch_id) */
  getBill: (batchId: string) => api.get(`/bets/bill/${batchId}`),
  /** ดึง timeline log ของรายการเดิมพัน */
  getLogs: (id: number) => api.get(`/bets/${id}/logs`),
  /** ยกเลิก/void bet เดี่ยว */
  cancel: (id: number, refund: boolean, reason?: string) => api.put(`/bets/${id}/cancel`, { refund, reason }),
  /** ยกเลิกทั้งบิล — refund=true คืนเครดิต, false=ไม่คืน */
  cancelBill: (batchId: string, refund: boolean, reason?: string) => api.put(`/bets/bill/${batchId}/cancel`, { refund, reason }),
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

// ⭐ Agent Theme — ตั้งค่าสีธีม
export const agentThemeApi = {
  get: () => api.get('/agent/theme'),
  update: (data: Record<string, string>) => api.put('/agent/theme', data),
}

// =============================================================================
// Deposit Requests — อนุมัติ/ปฏิเสธคำขอฝากเงิน
// =============================================================================
export const depositApi = {
  /** ดึงรายการฝาก (params: page, per_page, status, q) */
  list: (params?: Record<string, unknown>) => api.get('/deposits', { params }),
  /** ดึง timeline log ของรายการฝาก */
  getLogs: (id: number) => api.get(`/deposits/${id}/logs`),
  /** อนุมัติฝาก — เพิ่มเงิน + โบนัสฝากครั้งแรก (ถ้ามี) */
  approve: (id: number) => api.put(`/deposits/${id}/approve`),
  /** ปฏิเสธฝาก — ไม่เพิ่มเงิน */
  reject: (id: number, reason?: string) => api.put(`/deposits/${id}/reject`, { reason }),
  /** ยกเลิกฝากที่อนุมัติแล้ว — refund=true หักเครดิตคืน, false=ไม่หัก */
  cancel: (id: number, refund: boolean, reason?: string) => api.put(`/deposits/${id}/cancel`, { refund, reason }),
}

// =============================================================================
// Withdraw Requests — อนุมัติ/ปฏิเสธคำขอถอนเงิน
// =============================================================================
export const withdrawApi = {
  /** ดึงรายการถอน (params: page, per_page, status, q) */
  list: (params?: Record<string, unknown>) => api.get('/withdrawals', { params }),
  /** ดึง timeline log ของรายการถอน */
  getLogs: (id: number) => api.get(`/withdrawals/${id}/logs`),
  /** อนุมัติถอน — mode: "auto" (RKAUTO) หรือ "manual" (โอนเอง) */
  approve: (id: number, mode: 'auto' | 'manual') => api.put(`/withdrawals/${id}/approve`, { mode }),
  /** ปฏิเสธถอน — refund=true คืนเงิน, false=ไม่คืน (กรณีทุจริต) */
  reject: (id: number, refund: boolean, reason?: string) => api.put(`/withdrawals/${id}/reject`, { refund, reason }),
}

// =============================================================================
// Affiliate (Commission) — ตั้งค่า commission rates + ดู commission report
//
// Routes ที่ใช้ (admin-api #5):
//   GET  /affiliate/settings  → ดูทุก setting (default + per-lottery)
//   POST /affiliate/settings  → สร้าง/อัพเดท setting
//   DELETE /affiliate/settings/:id → ปิดใช้ setting
//   GET  /affiliate/report    → รายงาน commission สำหรับ agent
// =============================================================================
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

// TypeScript types สำหรับ affiliate
export interface AffiliateSetting {
  id: number
  agent_node_id: number
  lottery_type_id: number | null | undefined  // null/undefined = default ทุกประเภทหวย
  commission_rate: number             // % เช่น 0.5 = 0.5%
  withdrawal_min: number
  withdrawal_note: string
  status: string
  lottery_type?: { id: number; name: string; code: string }
}

export interface AffiliateReportRow {
  member_id: number
  username: string
  total_referred: number
  total_commission: number
  pending_commission: number
}

// ⭐ Share Template — ข้อความแชร์สำเร็จรูป (line/facebook/telegram)
export interface ShareTemplate {
  id: number
  agent_node_id: number
  name: string
  content: string
  platform: string          // 'all' | 'line' | 'facebook' | 'telegram'
  sort_order: number
  status: string
  created_at: string
  updated_at: string
}

// ⭐ Commission Adjustment — ปรับค่าคอม (เพิ่ม/หัก/ยกเลิก)
export interface CommissionAdjustment {
  id: number
  agent_node_id: number
  member_id: number
  admin_id: number
  type: 'add' | 'deduct' | 'cancel'
  amount: number
  reason: string
  commission_id?: number
  created_at: string
  member?: { id: number; username: string }
  admin?: { id: number; username: string }
}

// =============================================================================
// ⭐ Node Portal API — portal สำหรับ agent node (แยกจาก admin)
//
// ใช้ JWT cookie "node_token" (แยกจาก admin_token)
// กฎสิทธิ์:
//   - เห็นทั้งสาย (ancestors + self + descendants)
//   - แก้ไขได้เฉพาะลูกตรง (parent_id = ตัวเอง)
//   - หลาน/เหลน = read-only
// =============================================================================

/** TreeNode — node พร้อม editable flag (จาก /node/tree) */
export interface TreeNodeWithEditable extends AgentNode {
  editable: boolean
  children: TreeNodeWithEditable[]
}

export const nodeAuthApi = {
  /** Login ด้วย username/password จาก agent_nodes */
  login: (data: { username: string; password: string }) =>
    api.post('/node/auth/login', data),
  /** Logout — ลบ node_token cookie */
  logout: () => api.post('/node/auth/logout'),
}

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

/** AgentNode — 1 node ในสายงาน */
export interface AgentNode {
  id: number
  agent_node_id: number
  parent_id: number | null
  role: 'admin' | 'share_holder' | 'senior' | 'master' | 'agent' | 'agent_downline'
  name: string
  username: string
  depth: number
  path: string
  share_percent: number
  phone: string
  line_id: string
  note: string
  status: string
  created_at: string
  updated_at: string
  // Computed
  children?: AgentNode[]
  member_count: number
  child_count: number
  parent?: AgentNode
}

/** AgentNodeCommissionSetting — override % ต่อประเภทหวย */
export interface NodeCommissionSetting {
  id: number
  agent_node_id: number
  lottery_type: string
  share_percent: number
}

/** AgentProfitTransaction — กำไร/ขาดทุนของ 1 node จาก 1 bet */
export interface AgentProfitTx {
  id: number
  round_id: number
  bet_id: number
  agent_node_id: number
  from_node_id: number | null
  member_id: number
  bet_amount: number
  net_result: number
  my_percent: number
  child_percent: number
  diff_percent: number
  profit_amount: number
  created_at: string
  agent_node?: AgentNode
}

/** ProfitSummary — สรุปกำไรรวมของ 1 node */
export interface ProfitSummaryRow {
  agent_node_id: number
  node_name: string
  node_role: string
  share_percent: number
  total_profit: number
  total_bets: number
}

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

// =============================================================================
// ⭐ Yeekee Management API — ดูรอบ + สถิติยี่กี
// =============================================================================

export const yeekeeMgmtApi = {
  /** รายการรอบยี่กี (paginated + filter) */
  listRounds: (params?: { status?: string; date?: string; page?: number; per_page?: number }) =>
    api.get('/yeekee/rounds', { params }),

  /** ดูรอบเดียว + shoots + bet summary */
  getRound: (id: number) => api.get(`/yeekee/rounds/${id}`),

  /** ดูเลขยิงในรอบ (paginated) */
  getShoots: (id: number, params?: { page?: number; per_page?: number }) =>
    api.get(`/yeekee/rounds/${id}/shoots`, { params }),

  /** ⭐ แอดมินกดออกผลยี่กี manual (เฉพาะรอบ missed) */
  settleRound: (id: number) => api.post(`/yeekee/rounds/${id}/settle`),

  /** สถิติยี่กีวันนี้ */
  getStats: () => api.get('/yeekee/stats'),

  /** ดู config ยี่กี (agent ไหนเปิดอยู่) */
  getConfig: () => api.get('/yeekee/config'),

  /** เปิด/ปิดยี่กี สำหรับ agent */
  setConfig: (data: { agent_node_id: number; enabled: boolean }) =>
    api.post('/yeekee/config', data),
}

// TypeScript types สำหรับ Yeekee
export interface YeekeeRound {
  id: number
  lottery_round_id: number
  round_no: number
  start_time: string
  end_time: string
  status: 'waiting' | 'shooting' | 'calculating' | 'resulted' | 'missed'
  result_number: string
  total_shoots: number
  total_sum: number
  lottery_round?: {
    id: number
    round_number: string
    status: string
    result_top3?: string
    result_top2?: string
    result_bottom2?: string
  }
}

export interface YeekeeShoot {
  id: number
  yeekee_round_id: number
  member_id: number
  number: string
  shot_at: string
  is_bot: boolean
  member?: { id: number; username: string }
}

export interface YeekeeStats {
  total_rounds: number
  waiting_count: number
  shooting_count: number
  resulted_count: number
  missed_count: number
  total_shoots: number
  total_bets: number
  total_bet_amount: number
  total_payout: number
  profit: number
}

// =============================================================================
// ⭐ Auto-Ban Rules API — กฎอั้นเลขอัตโนมัติ
// =============================================================================

export const autoBanApi = {
  /** ดึงกฎทั้งหมด (filter by lottery_type_id) */
  list: (params?: { lottery_type_id?: number }) =>
    api.get('/auto-ban-rules', { params }),

  /** สร้างกฎ 1 กฎ */
  create: (data: Partial<AutoBanRuleData>) =>
    api.post('/auto-ban-rules', data),

  /** สร้างกฎหลายกฎพร้อมกัน (จากคำนวณอัตโนมัติ) */
  bulkCreate: (data: {
    lottery_type_id: number
    capital: number
    max_loss: number
    rules: { bet_type: string; threshold_amount: number; action: string; rate: number; reduced_rate?: number }[]
  }) => api.post('/auto-ban-rules/bulk', data),

  /** แก้ไขกฎ */
  update: (id: number, data: Partial<AutoBanRuleData>) =>
    api.put(`/auto-ban-rules/${id}`, data),

  /** ลบกฎ (soft delete) */
  delete: (id: number) => api.delete(`/auto-ban-rules/${id}`),
}

export interface AutoBanRuleData {
  id: number
  agent_node_id: number
  lottery_type_id: number
  bet_type: string
  threshold_amount: number
  action: string
  reduced_rate: number
  capital: number
  max_loss: number
  rate: number
  status: string
  lottery_type?: { id: number; name: string; code: string }
}

// =============================================================================
// ⭐ Member Levels API — ระบบ level สมาชิก (Bronze→Platinum)
// =============================================================================

// ⭐ v3 (2026-04-20): ตัด commission/cashback/bonus/max_withdraw/min_bets ออก
//   — badge cosmetic อย่างเดียว + เกณฑ์เดียว `min_deposit_30d` (rolling 30 วัน)
export interface MemberLevel {
  id: number
  agent_node_id: number
  name: string
  color: string
  icon: string
  sort_order: number
  min_deposit_30d: number     // ⭐ threshold เดียว — ยอดฝากสะสม 30 วันล่าสุด
  description: string
  status: string
  member_count: number
  created_at: string
  updated_at: string
}

// Response จาก list — มี levels + unassigned count
export interface MemberLevelListResp {
  levels: MemberLevel[]
  unassigned: number           // สมาชิกที่ยังไม่ถูกจัดระดับ (level_id=NULL)
}

// ประวัติการเปลี่ยนระดับ (`member_level_history`)
export interface MemberLevelHistory {
  id: number
  member_id: number
  from_level_id: number | null
  to_level_id: number | null
  reason: 'auto' | 'admin_override' | 'admin_unlock' | 'initial'
  deposit_30d_snapshot: number
  changed_by_admin_id: number | null
  note: string
  created_at: string
}

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
// ⭐ Promotions API — ระบบโปรโมชั่น
// =============================================================================

export interface Promotion {
  id: number
  agent_node_id: number
  name: string
  type: string
  description: string
  image_url: string
  bonus_pct: number
  max_bonus: number
  min_deposit: number
  turnover: number
  max_per_member: number
  max_total: number
  used_count: number
  start_date: string
  end_date: string
  status: string
  created_at: string
  updated_at: string
}

export const promotionApi = {
  /** ดึงโปรโมชั่นทั้งหมด (filter: status, type) */
  list: (params?: { status?: string; type?: string }) =>
    api.get('/promotions', { params }),

  /** สร้างโปรโมชั่น */
  create: (data: Partial<Promotion>) => api.post('/promotions', data),

  /** แก้ไขโปรโมชั่น */
  update: (id: number, data: Partial<Promotion>) => api.put(`/promotions/${id}`, data),

  /** เปลี่ยนสถานะ (active/inactive) */
  updateStatus: (id: number, status: string) =>
    api.put(`/promotions/${id}/status`, { status }),

  /** ลบโปรโมชั่น (soft) */
  delete: (id: number) => api.delete(`/promotions/${id}`),
}

// =============================================================================
// ⭐ CMS API — แบนเนอร์ + ตัวอักษรวิ่ง
// =============================================================================

export interface CmsBanner {
  id: number
  title: string
  image_url: string
  link_url: string
  sort_order: number
  status: string
  created_at: string
}

export const cmsApi = {
  /** ดึงแบนเนอร์ทั้งหมด */
  listBanners: () => api.get('/cms/banners'),

  /** เพิ่มแบนเนอร์ */
  createBanner: (data: Partial<CmsBanner>) => api.post('/cms/banners', data),

  /** แก้ไขแบนเนอร์ */
  updateBanner: (id: number, data: Partial<CmsBanner>) => api.put(`/cms/banners/${id}`, data),

  /** ลบแบนเนอร์ */
  deleteBanner: (id: number) => api.delete(`/cms/banners/${id}`),

  /** จัดลำดับแบนเนอร์ */
  reorderBanners: (orders: { id: number; sort_order: number }[]) =>
    api.put('/cms/banners/reorder', { orders }),

  /** ดึงข้อความ ticker */
  getTicker: () => api.get('/cms/ticker'),

  /** อัพเดทข้อความ ticker */
  updateTicker: (ticker_text: string) => api.put('/cms/ticker', { ticker_text }),
}

// =============================================================================
// ⭐ Notifications API — Telegram webhook
// =============================================================================

// ⭐ NotifyGroup — กลุ่มแจ้งเตือน 1 กลุ่ม (multi-group support)
// แต่ละกลุ่มมี Bot Token + Chat ID + จุดแจ้งเตือนแยกกัน
export interface NotifyGroup {
  id: string
  name: string
  bot_token: string
  chat_id: string
  active: boolean
  on_deposit: boolean
  on_withdraw: boolean
  on_deposit_approve: boolean
  on_withdraw_approve: boolean
  on_new_member: boolean
  on_result: boolean
  on_large_win: boolean
  on_large_bet: boolean
  on_login: boolean
  large_win_min: number
  large_bet_min: number
}

/** @deprecated ใช้ NotifyGroup แทน — เก็บไว้สำหรับ backward compat */
export type NotifyConfig = NotifyGroup

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

// =============================================================================
// ⭐ Member Credit Report API — รายงานเครดิตสมาชิก
// =============================================================================

export const memberCreditApi = {
  /** ดึงรายงานเครดิตสมาชิก */
  report: (params: { member_id?: number; q?: string; from?: string; to?: string; page?: number; per_page?: number }) =>
    api.get('/reports/member-credit', { params }),
}
