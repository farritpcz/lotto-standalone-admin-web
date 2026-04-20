// Component: TemplateFormModal — modal เพิ่ม/แก้ไข Share Template
// Parent: src/app/affiliate/page.tsx

'use client'

interface Props {
  editing: boolean
  name: string
  content: string
  platform: string
  sortOrder: string
  saving: boolean
  setName: (v: string) => void
  setContent: (v: string) => void
  setPlatform: (v: string) => void
  setSortOrder: (v: string) => void
  onClose: () => void
  onSave: () => void
}

export default function TemplateFormModal(props: Props) {
  const {
    editing, name, content, platform, sortOrder, saving,
    setName, setContent, setPlatform, setSortOrder, onClose, onSave,
  } = props

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          {editing ? 'แก้ไข Template' : 'เพิ่ม Template ใหม่'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>ชื่อ Template</div>
            <input className="input" type="text" placeholder="เช่น ข้อความชวนเพื่อน LINE"
              value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>แพลตฟอร์ม</div>
            <select className="input" value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="all">ทุกแพลตฟอร์ม</option>
              <option value="line">LINE</option>
              <option value="facebook">Facebook</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>เนื้อหา</div>
            <textarea className="input" rows={5}
              placeholder={'มาเล่นหวยด้วยกันเถอะ!\nสมัครผ่านลิงก์นี้: {link}\nใส่รหัส: {code}\nจาก {username}'}
              value={content} onChange={e => setContent(e.target.value)}
              style={{ resize: 'vertical', minHeight: 100, lineHeight: 1.6 }} />
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
              ใช้ {'{link}'} {'{code}'} {'{username}'} เป็นตัวแปรที่จะถูกแทนที่อัตโนมัติ
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>ลำดับการแสดง</div>
            <input className="input" type="number" min="0" placeholder="0"
              value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
              ตัวเลขน้อย = แสดงก่อน
            </div>
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
