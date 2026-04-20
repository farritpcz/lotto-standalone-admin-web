/**
 * Types สำหรับหน้า จัดการสมาชิก (admin members)
 *
 * Rule: ใช้ร่วมกับ MemberTable + MemberDetailModal
 * Related: app/members/page.tsx, lib/api/member-mgmt.ts
 */

/** สมาชิก 1 คน — มาจาก list API */
export interface Member {
  id: number
  username: string
  phone: string
  email: string
  balance: number
  status: string // 'active' | 'suspended'
  created_at: string
}

/** รายละเอียดสมาชิก — มาจาก get(id) API (มีข้อมูลเพิ่มเติม) */
export interface MemberDetail {
  id: number
  username: string
  phone: string
  email: string
  balance: number
  status: string
  created_at: string
  // ข้อมูลธนาคาร (field names ตรงกับ API response snake_case)
  bank_code?: string
  bank_account_number?: string
  bank_account_name?: string
  // ผู้แนะนำ (referral)
  referred_by?: number
  referrer_username?: string
  // สถิติ
  total_bets?: number
  recent_bets_count?: number
}
