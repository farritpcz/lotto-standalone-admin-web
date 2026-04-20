// API client — shared TypeScript types/interfaces
// Parent barrel: src/lib/api.ts
// Rule: docs/coding_standards.md §4.1
//
// Types แยกไฟล์จาก API functions เพื่อหลีกเลี่ยง circular imports
// (ไฟล์ resource อื่นๆ สามารถ import type จาก './_types' ได้ตรงๆ)

// =============================================================================
// Affiliate types
// =============================================================================

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
// Downline / Node types
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

/** TreeNode — node พร้อม editable flag (จาก /node/tree) */
export interface TreeNodeWithEditable extends AgentNode {
  editable: boolean
  children: TreeNodeWithEditable[]
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

// =============================================================================
// Yeekee types
// =============================================================================

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
// Auto-ban types
// =============================================================================

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
// Member Level types
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

// =============================================================================
// Promotion types
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

// =============================================================================
// CMS types
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

// =============================================================================
// Notification types
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
