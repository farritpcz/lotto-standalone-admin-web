// Types: bank-accounts — shared across subcomponents
// Parent: src/app/settings/bank-accounts/page.tsx

/** ธนาคารที่รองรับ (bank_code → ชื่อ + สี) */
export const BANK_OPTIONS: { code: string; name: string; color: string }[] = [
  { code: 'SCB', name: 'ไทยพาณิชย์', color: '#4e2a84' },
  { code: 'KBANK', name: 'กสิกรไทย', color: '#138f2d' },
  { code: 'BBL', name: 'กรุงเทพ', color: '#1e4598' },
  { code: 'KTB', name: 'กรุงไทย', color: '#1ba5e0' },
  { code: 'BAY', name: 'กรุงศรีอยุธยา', color: '#fec43b' },
  { code: 'TTB', name: 'ทหารไทยธนชาต', color: '#fc4f1f' },
  { code: 'GSB', name: 'ออมสิน', color: '#eb198d' },
]

export interface BankAccount {
  id: number
  bank_code: string
  account_number: string
  account_name: string
  is_default: boolean
  status: string
  account_type?: string
  transfer_mode?: string
  rkauto_uuid?: string
  rkauto_status?: string
  bank_system?: string
}

export interface BankAccountForm {
  bank_code: string
  account_number: string
  account_name: string
  is_default: boolean
  account_type: 'deposit' | 'withdraw'
  transfer_mode: 'manual' | 'auto' | 'easyslip'
  bank_system: string
  qr_code_url: string
  rkauto_token1: string
  rkauto_token2: string
}

export interface DepositWithdrawSettings {
  min_deposit: number
  auto_approve_threshold: number
  min_withdraw: number
  max_withdraw_per_day: number
}

export const getBankName = (code: string) =>
  BANK_OPTIONS.find(b => b.code === code)?.name || code
