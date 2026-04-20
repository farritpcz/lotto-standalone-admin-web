// Component: SettingsTab — ตั้งค่า Commission Rate (default + per-lottery)
// Parent: src/app/affiliate/page.tsx

'use client'

import { type AffiliateSetting } from '@/lib/api'
import { Info, Percent, Plus, Pencil, Trash2 } from 'lucide-react'
import Loading from '@/components/Loading'

interface Props {
  settings: AffiliateSetting[]
  loading: boolean
  onAdd: () => void
  onEdit: (s: AffiliateSetting) => void
  onDelete: (s: AffiliateSetting) => void
}

export default function SettingsTab({ settings, loading, onAdd, onEdit, onDelete }: Props) {
  const defaultSetting = settings.find(s => s.lottery_type_id == null)
  const lotterySettings = settings.filter(s => s.lottery_type_id != null)

  return (
    <>
      {/* วิธีการทำงาน */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Info size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>วิธีการทำงาน</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { step: '1', icon: '🔗', title: 'สมาชิกสร้างลิงก์', desc: 'แชร์ลิงก์ชวนเพื่อน' },
            { step: '2', icon: '👤', title: 'เพื่อนสมัคร', desc: 'สมัครผ่านลิงก์' },
            { step: '3', icon: '🎰', title: 'เพื่อนแทงหวย', desc: 'แทง 100 บาท' },
            { step: '4', icon: '💰', title: 'ได้ค่าคอม', desc: `${defaultSetting?.commission_rate || '0.5'}% = ${((defaultSetting?.commission_rate || 0.5) * 100 / 100).toFixed(1)} บาท` },
          ].map(item => (
            <div key={item.step} style={{
              background: 'var(--bg-base)', borderRadius: 10, padding: '12px',
              textAlign: 'center', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.6 }}>
          * ค่าคอมคำนวณจาก <strong>ยอดเดิมพัน</strong> (ไม่ใช่แพ้/ชนะ) · คำนวณอัตโนมัติหลัง admin กรอกผล · สมาชิกถอนค่าคอมเข้า wallet ได้เอง
        </div>
      </div>

      {/* ตั้งค่า Commission Rate */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Percent size={16} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 700 }}>อัตราค่าคอมมิชชั่น</span>
        </div>
        <button className="btn btn-primary" onClick={onAdd}
          style={{ height: 32, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> เพิ่ม Rate
        </button>
      </div>

      {loading ? <Loading inline text="กำลังโหลด..." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {/* Default rate card */}
          {defaultSetting && (
            <div style={{
              background: 'var(--bg-elevated)', border: '2px solid var(--accent)',
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ background: 'rgba(0,229,160,0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>DEFAULT</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>ทุกประเภทหวย</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  ถอนขั้นต่ำ ฿{defaultSetting.withdrawal_min} · {defaultSetting.withdrawal_note || '-'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{defaultSetting.commission_rate}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>ของยอดเดิมพัน</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => onEdit(defaultSetting)} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                    <Pencil size={14} color="var(--text-secondary)" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Per-lottery rates */}
          {lotterySettings.length > 0 && (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Rate เฉพาะประเภท (override default)</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  ถ้าหวยประเภทไหนมี rate เฉพาะ → ใช้ rate นั้น · ถ้าไม่มี → ใช้ Default ({defaultSetting?.commission_rate || 0}%) แทน
                </div>
              </div>
              {lotterySettings.map((s, i) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: i < lotterySettings.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {s.lottery_type?.name || `Lottery #${s.lottery_type_id}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--status-success)' }}>{s.commission_rate}%</span>
                    <button onClick={() => onEdit(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Pencil size={13} color="var(--text-tertiary)" />
                    </button>
                    <button onClick={() => onDelete(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={13} color="var(--status-error)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {settings.length === 0 && (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, border: '1px dashed var(--border)' }}>
              ยังไม่มี rate — กดปุ่ม &quot;เพิ่ม Rate&quot; เพื่อเริ่มต้น
            </div>
          )}
        </div>
      )}
    </>
  )
}
