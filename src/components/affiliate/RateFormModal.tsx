// Component: RateFormModal — modal เพิ่ม/แก้ไข Commission Rate
// Parent: src/app/affiliate/page.tsx

'use client'

interface LotteryType { id: number; name: string; code: string }

interface Props {
  editing: boolean
  lotteryTypes: LotteryType[]
  lotteryTypeId: string
  rate: string
  withdrawMin: string
  withdrawNote: string
  saving: boolean
  setLotteryTypeId: (v: string) => void
  setRate: (v: string) => void
  setWithdrawMin: (v: string) => void
  setWithdrawNote: (v: string) => void
  onClose: () => void
  onSave: () => void
}

export default function RateFormModal(props: Props) {
  const {
    editing, lotteryTypes, lotteryTypeId, rate, withdrawMin, withdrawNote, saving,
    setLotteryTypeId, setRate, setWithdrawMin, setWithdrawNote, onClose, onSave,
  } = props

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          {editing ? 'แก้ไข Commission Rate' : 'เพิ่ม Commission Rate'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>ประเภทหวย</div>
            <select className="input" value={lotteryTypeId} onChange={e => setLotteryTypeId(e.target.value)}>
              <option value="">Default (ใช้กับทุกประเภท)</option>
              {lotteryTypes.map(lt => <option key={lt.id} value={String(lt.id)}>{lt.name}</option>)}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Rate เฉพาะประเภท จะ override Default rate
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>Commission Rate (%)</div>
            <input className="input" type="number" min="0" max="100" step="0.1"
              value={rate} onChange={e => setRate(e.target.value)} placeholder="เช่น 0.5" />
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              เช่น 0.5 = สมาชิกแทง 1,000 บาท → ผู้แนะนำได้ 5 บาท
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>ยอดถอนค่าคอมขั้นต่ำ (฿)</div>
            <input className="input" type="number" min="0"
              value={withdrawMin} onChange={e => setWithdrawMin(e.target.value)} />
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>หมายเหตุ (แสดงให้สมาชิกเห็น)</div>
            <input className="input" type="text"
              value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)}
              placeholder="เช่น ถอนขั้นต่ำ 1 บาท" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-secondary" style={{ flex: 1, height: 38 }} onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" style={{ flex: 1, height: 38, fontWeight: 600 }}
            onClick={onSave} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}
