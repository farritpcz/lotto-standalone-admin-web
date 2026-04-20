// Component: ResultEntryForm — round selection + result entry + preview + confirm
// Parent: src/app/results/page.tsx
'use client'

import Loading from '@/components/Loading'
import { ChevronDown, ChevronRight, Trophy, TrendingUp, Users, DollarSign } from 'lucide-react'
import { type Round, type PreviewData, fmtMoney } from './types'

interface Props {
  // round selection
  rounds: Round[]
  loading: boolean
  selectedRound: Round | null
  setSelectedRound: (r: Round | null) => void

  // result entry
  top3: string; setTop3: (v: string) => void
  bottom2: string; setBottom2: (v: string) => void
  front3: string; setFront3: (v: string) => void
  bottom3: string; setBottom3: (v: string) => void
  showExtra: boolean; setShowExtra: (v: boolean) => void

  // preview + submit
  preview: PreviewData | null
  setPreview: (p: PreviewData | null) => void
  previewing: boolean
  submitting: boolean
  onPreview: () => void
  onConfirm: () => void
}

export default function ResultEntryForm(p: Props) {
  return (
    <>
      {/* SECTION 1: เลือกรอบ — Card List */}
      {!p.selectedRound && !p.preview && (
        <div style={{ marginBottom: 24 }}>
          {p.loading ? <Loading inline text="กำลังโหลดรอบ..." /> : p.rounds.length === 0 ? (
            <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              ไม่มีรอบที่รอกรอกผล — ต้องปิดรับแทงก่อน
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {p.rounds.map(r => (
                <div key={r.id} onClick={() => { p.setSelectedRound(r); p.setPreview(null) }}
                  className="card-surface" style={{
                    padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'all 0.15s', borderColor: 'var(--border)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                >
                  <span style={{ fontSize: 28 }}>{r.lottery_type?.icon || '🎲'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.lottery_type?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)', marginTop: 2 }}>
                      #{r.id} &middot; {r.round_number}
                    </div>
                  </div>
                  <span className="badge badge-warning">รอกรอกผล</span>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: กรอกผล — Premium Input */}
      {p.selectedRound && !p.preview && (
        <div className="card-surface" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{p.selectedRound.lottery_type?.icon || '🎲'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{p.selectedRound.lottery_type?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>
                  #{p.selectedRound.id} &middot; {p.selectedRound.round_number}
                </div>
              </div>
            </div>
            {p.rounds.length > 1 && (
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => p.setSelectedRound(null)}>
                เปลี่ยนรอบ
              </button>
            )}
          </div>

          {/* Hero: 3 ตัวบน */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f5a623', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
              3 ตัวบน
            </div>
            <input type="text" value={p.top3}
              onChange={e => { p.setTop3(e.target.value.replace(/\D/g, '').slice(0, 3)); p.setPreview(null) }}
              placeholder="847" maxLength={3}
              className="input" style={{
                textAlign: 'center', fontSize: 56, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
                height: 80, maxWidth: 240, margin: '0 auto', letterSpacing: 12,
                color: '#f5a623', background: 'color-mix(in srgb, #f5a623 5%, var(--bg-secondary))',
                borderColor: 'color-mix(in srgb, #f5a623 20%, var(--border))',
              }}
            />
            {p.top3.length >= 2 && (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8 }}>
                2 ตัวบน: <span style={{ color: '#00e5a0', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', fontSize: 16 }}>{p.top3.slice(-2)}</span>
              </div>
            )}
          </div>

          {/* 2 ตัวล่าง */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
              2 ตัวล่าง
            </div>
            <input type="text" value={p.bottom2}
              onChange={e => { p.setBottom2(e.target.value.replace(/\D/g, '').slice(0, 2)); p.setPreview(null) }}
              placeholder="56" maxLength={2}
              className="input" style={{
                textAlign: 'center', fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
                height: 64, maxWidth: 180, margin: '0 auto', letterSpacing: 12,
                color: '#3b82f6', background: 'color-mix(in srgb, #3b82f6 5%, var(--bg-secondary))',
                borderColor: 'color-mix(in srgb, #3b82f6 20%, var(--border))',
              }}
            />
          </div>

          {/* ผลเพิ่มเติม (collapsible) */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 20 }}>
            <button onClick={() => p.setShowExtra(!p.showExtra)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: 'var(--text-secondary)', padding: 0,
              }}>
              {p.showExtra ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              ผลเพิ่มเติม (3 ตัวหน้า, 3 ตัวล่าง — เฉพาะหวยไทย)
            </button>
            {p.showExtra && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#ec4899', marginBottom: 4, fontWeight: 600 }}>3 ตัวหน้า</div>
                  <input type="text" value={p.front3}
                    onChange={e => { p.setFront3(e.target.value.replace(/\D/g, '').slice(0, 3)); p.setPreview(null) }}
                    placeholder="491" maxLength={3} className="input"
                    style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', height: 48, color: '#ec4899' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#a855f7', marginBottom: 4, fontWeight: 600 }}>3 ตัวล่าง (comma แยก)</div>
                  <input type="text" value={p.bottom3}
                    onChange={e => { p.setBottom3(e.target.value.replace(/[^\d,]/g, '')); p.setPreview(null) }}
                    placeholder="123,456" className="input"
                    style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', height: 48, color: '#a855f7' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Card */}
          {p.top3.length === 3 && p.bottom2.length === 2 && (
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 12, padding: '16px 20px', marginBottom: 20,
              display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap',
            }}>
              {[
                { label: '3 ตัวบน', value: p.top3, color: '#f5a623' },
                { label: '2 ตัวบน', value: p.top3.slice(-2), color: '#00e5a0' },
                { label: '2 ตัวล่าง', value: p.bottom2, color: '#3b82f6' },
                ...(p.front3 ? [{ label: '3 ตัวหน้า', value: p.front3, color: '#ec4899' }] : []),
                ...(p.bottom3 ? [{ label: '3 ตัวล่าง', value: p.bottom3, color: '#a855f7' }] : []),
                ...(p.front3 && p.top3 ? [{ label: '4 ตัวบน', value: (p.front3 + p.top3).slice(-4), color: '#14b8a6' }] : []),
              ].map(r => (
                <div key={r.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 22, fontWeight: 800, color: r.color }}>{r.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* ปุ่ม Preview */}
          <button onClick={p.onPreview} disabled={p.previewing || p.top3.length !== 3 || p.bottom2.length !== 2}
            className="btn btn-primary" style={{ width: '100%', height: 48, fontSize: 16, fontWeight: 700 }}>
            {p.previewing ? 'กำลังคำนวณ...' : 'ดูตัวอย่างผลก่อนยืนยัน'}
          </button>
        </div>
      )}

      {/* SECTION 3: Preview Results */}
      {p.preview && (
        <div className="card-surface" style={{ padding: 24, marginBottom: 24, borderColor: 'rgba(0,229,160,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Trophy size={20} color="var(--accent)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
                ตัวอย่างผล — {p.selectedRound?.lottery_type?.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>#{p.selectedRound?.id} {p.preview.round_number}</div>
            </div>
          </div>

          <div style={{
            textAlign: 'center', padding: '20px 0', marginBottom: 20,
            background: 'var(--bg-elevated)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              {p.preview.profit >= 0 ? 'กำไร' : 'ขาดทุน'}
            </div>
            <div style={{
              fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
              color: p.preview.profit >= 0 ? '#00e5a0' : '#ef4444',
            }}>
              {p.preview.profit >= 0 ? '+' : ''}{fmtMoney(p.preview.profit)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { icon: Users, label: 'Bets', value: String(p.preview.total_bets), color: 'var(--text-primary)' },
              { icon: DollarSign, label: 'ยอดแทง', value: fmtMoney(p.preview.total_amount), color: '#a855f7' },
              { icon: Trophy, label: 'ถูกรางวัล', value: `${p.preview.winner_count} คน`, color: '#fbbf24' },
              { icon: TrendingUp, label: 'ต้องจ่าย', value: fmtMoney(p.preview.total_payout), color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
                <s.icon size={16} color={s.color} style={{ marginBottom: 6 }} />
                <div className="label" style={{ fontSize: 10, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono, monospace)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {p.preview.winners && p.preview.winners.length > 0 ? (
            <>
              <div className="label" style={{ marginBottom: 8 }}>ผู้ถูกรางวัล ({p.preview.winner_count} รายการ)</div>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 20 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>สมาชิก</th><th>เลข</th><th>ประเภท</th>
                      <th style={{ textAlign: 'right' }}>เดิมพัน</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>จ่าย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.preview.winners.map((w, i) => (
                      <tr key={i}>
                        <td><a href={`/members/${w.member_id}`} target="_blank" rel="noopener" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{w.username || `ID:${w.member_id}`}</a></td>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{w.number}</td>
                        <td className="secondary" style={{ fontSize: 12 }}>{w.bet_type}</td>
                        <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(w.amount)}</td>
                        <td className="mono secondary" style={{ textAlign: 'right' }}>x{w.rate}</td>
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{fmtMoney(w.payout)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ padding: '20px 0', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 20, background: 'var(--bg-elevated)', borderRadius: 8 }}>
              ไม่มีใครถูกรางวัล — กำไรเต็มจำนวน {fmtMoney(p.preview.total_amount)}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => p.setPreview(null)} className="btn btn-secondary" style={{ flex: 1, height: 48, fontSize: 15 }}>
              แก้ไขผล
            </button>
            <button onClick={p.onConfirm} disabled={p.submitting}
              className="btn btn-primary" style={{ flex: 2, height: 48, fontSize: 15, fontWeight: 700 }}>
              {p.submitting ? 'กำลังกรอกผล + จ่ายเงิน...' : `ยืนยันกรอกผล (จ่าย ${fmtMoney(p.preview.total_payout)})`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
