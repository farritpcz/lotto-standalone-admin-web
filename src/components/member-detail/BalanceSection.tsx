// Component: BalanceSection — info tab content (balance card, profile, bank, deposit/withdraw, profit/loss)
// Parent: src/app/members/[id]/page.tsx

'use client'

import BankIcon from '@/components/BankIcon'
import { MemberDetail, fmtMoney } from './types'

interface Props {
  member: MemberDetail
  onAddCredit: () => void
  onDeductCredit: () => void
}

/** InfoRow — label + value horizontal (profile rows) */
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{
        fontSize: 13, color: 'var(--text-primary)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>
        {value}
      </span>
    </div>
  )
}

export default function BalanceSection({ member, onAddCredit, onDeductCredit }: Props) {
  const totalBetAmount = member.total_bet_amount || 0
  const totalWinAmount = member.total_win_amount || 0
  const totalDeposit = member.total_deposit || 0
  const totalWithdraw = member.total_withdraw || 0
  // กำไร/ขาดทุน (มุมสมาชิก): บวก=สมาชิกได้กำไร, ลบ=เว็บได้กำไร
  const profitLoss = totalWinAmount - totalBetAmount

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.2s ease' }}>
      {/* ----- Balance Card ----- */}
      <div className="card-surface" style={{
        padding: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <span className="label" style={{ display: 'block', marginBottom: 6 }}>ยอดเงินคงเหลือ</span>
          <span className="metric" style={{ color: 'var(--accent-text)', fontSize: 32 }}>
            {fmtMoney(member.balance)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-success" onClick={onAddCredit}>+ เติมเครดิต</button>
          <button className="btn btn-danger" onClick={onDeductCredit}>- หักเครดิต</button>
        </div>
      </div>

      {/* ----- Profile + Bank ----- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* ข้อมูลส่วนตัว */}
        <div className="card-surface" style={{ padding: 20 }}>
          <p className="label" style={{ marginBottom: 14 }}>ข้อมูลส่วนตัว</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InfoRow label="เบอร์โทร" value={member.phone || '---'} />
            <InfoRow label="อีเมล" value={member.email || '---'} />
            <InfoRow
              label="แนะนำโดย"
              value={
                member.referrer_username
                  ? `${member.referrer_username} (#${member.referred_by})`
                  : '--- ไม่มีผู้แนะนำ ---'
              }
            />
          </div>
        </div>

        {/* ข้อมูลธนาคาร */}
        <div className="card-surface" style={{ padding: 20 }}>
          <p className="label" style={{ marginBottom: 14 }}>ข้อมูลธนาคาร</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>ธนาคาร</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
                {member.bank_code && <BankIcon code={member.bank_code} size={28} />}
                {member.bank_code || '---'}
              </span>
            </div>
            <InfoRow label="เลขบัญชี" value={member.bank_account_number || '---'} mono />
            <InfoRow label="ชื่อบัญชี" value={member.bank_account_name || '---'} />
          </div>
        </div>
      </div>

      {/* ----- Deposit/Withdraw Summary ----- */}
      <div className="card-surface" style={{ padding: 20 }}>
        <p className="label" style={{ marginBottom: 14 }}>สรุปฝาก / ถอน</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div className="stat-card">
            <span className="label" style={{ display: 'block', marginBottom: 4 }}>ยอดฝากรวม</span>
            <span className="metric" style={{ fontSize: 20, color: 'var(--status-success)' }}>
              {fmtMoney(totalDeposit)}
            </span>
          </div>
          <div className="stat-card">
            <span className="label" style={{ display: 'block', marginBottom: 4 }}>ยอดถอนรวม</span>
            <span className="metric" style={{ fontSize: 20, color: 'var(--status-error)' }}>
              {fmtMoney(totalWithdraw)}
            </span>
          </div>
        </div>
      </div>

      {/* ----- Profit/Loss Summary ----- */}
      <div className="card-surface" style={{ padding: 20 }}>
        <p className="label" style={{ marginBottom: 14 }}>สรุปกำไร / ขาดทุน (จากการแทง)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div className="stat-card">
            <span className="label" style={{ display: 'block', marginBottom: 4 }}>ยอดแทงรวม</span>
            <span className="metric" style={{ fontSize: 20, color: 'var(--text-primary)' }}>
              {fmtMoney(totalBetAmount)}
            </span>
          </div>
          <div className="stat-card">
            <span className="label" style={{ display: 'block', marginBottom: 4 }}>ยอดชนะรวม</span>
            <span className="metric" style={{ fontSize: 20, color: 'var(--status-success)' }}>
              {fmtMoney(totalWinAmount)}
            </span>
          </div>
          <div className="stat-card">
            <span className="label" style={{ display: 'block', marginBottom: 4 }}>กำไร/ขาดทุน (สมาชิก)</span>
            <span className="metric" style={{
              fontSize: 20,
              color: profitLoss >= 0 ? 'var(--status-success)' : 'var(--status-error)',
            }}>
              {profitLoss >= 0 ? '+' : ''}{fmtMoney(profitLoss)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
