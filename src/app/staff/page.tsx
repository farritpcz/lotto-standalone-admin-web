/**
 * Admin — ระบบพนักงานละเอียด
 *
 * 4 ส่วน:
 * 1. ตารางพนักงาน — ชื่อ, role badge, สถานะ, login ล่าสุด, IP
 * 2. Modal เพิ่ม/แก้ไข — ข้อมูล + เลือก role + checkbox permissions
 * 3. Login history — ดูประวัติ login (IP, device, เวลา)
 * 4. Activity log — ดูว่าพนักงานคนนี้ทำอะไรบ้าง
 */
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import Loading from '@/components/Loading'
import { Plus, Shield, Eye, UserCog, Crown, Clock, Activity } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────
interface Staff {
  id: number; username: string; name: string
  role: string; permissions: string; status: string
  last_login_at: string | null; last_login_ip: string; created_at: string
}
interface PermGroup {
  group: string; label: string
  perms: { key: string; label: string }[]
}
interface LoginEntry { id: number; ip: string; user_agent: string; success: boolean; created_at: string }
interface ActivityEntry { id: number; method: string; path: string; status_code: number; created_at: string }

const roleBadge: Record<string, { cls: string; label: string; icon: React.ComponentType<{size?:number}> }> = {
  owner:    { cls: 'badge-warning', label: 'Owner', icon: Crown },
  admin:    { cls: 'badge-info',    label: 'Admin', icon: Shield },
  operator: { cls: 'badge-neutral', label: 'Operator', icon: UserCog },
  viewer:   { cls: 'badge-neutral', label: 'Viewer', icon: Eye },
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'operator' })
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [permGroups, setPermGroups] = useState<PermGroup[]>([])
  const [saving, setSaving] = useState(false)

  // Detail panel
  const [detailStaff, setDetailStaff] = useState<Staff | null>(null)
  const [detailTab, setDetailTab] = useState<'login' | 'activity'>('login')
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([])
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])

  const [confirmDlg, setConfirmDlg] = useState<ConfirmDialogProps | null>(null)
  const [message, setMessage] = useState<{ type: 'success'|'error'; text: string } | null>(null)

  useEffect(() => { loadStaff(); loadPermissions() }, [])
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t) } }, [message])

  const loadStaff = async () => {
    setLoading(true)
    try {
      const res = await api.get('/staff')
      setStaffList(res.data.data || [])
    } catch { setStaffList([]) }
    finally { setLoading(false) }
  }

  const loadPermissions = async () => {
    try {
      const res = await api.get('/staff/permissions')
      setPermGroups(res.data.data || [])
    } catch {}
  }

  const filtered = staffList.filter(s =>
    s.username.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  // ─── Modal handlers ───────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null)
    setForm({ username: '', password: '', name: '', role: 'operator' })
    setSelectedPerms([])
    setShowModal(true)
  }

  const openEdit = (s: Staff) => {
    setEditingId(s.id)
    setForm({ username: s.username, password: '', name: s.name, role: s.role })
    try { setSelectedPerms(JSON.parse(s.permissions || '[]')) } catch { setSelectedPerms([]) }
    setShowModal(true)
  }

  const togglePerm = (key: string) => {
    setSelectedPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key])
  }

  const toggleGroupAll = (group: PermGroup) => {
    const allKeys = group.perms.map(p => p.key)
    const allSelected = allKeys.every(k => selectedPerms.includes(k))
    if (allSelected) {
      setSelectedPerms(prev => prev.filter(p => !allKeys.includes(p)))
    } else {
      setSelectedPerms(prev => [...new Set([...prev, ...allKeys])])
    }
  }

  const handleSave = async () => {
    if (!editingId && (!form.username || !form.password)) { setMessage({ type: 'error', text: 'กรุณากรอก username และ password' }); return }
    if (!form.name) { setMessage({ type: 'error', text: 'กรุณากรอกชื่อ' }); return }

    setSaving(true)
    const permsJson = JSON.stringify(selectedPerms)
    try {
      if (editingId) {
        await api.put(`/staff/${editingId}`, { name: form.name, role: form.role, permissions: permsJson, password: form.password || undefined })
      } else {
        await api.post('/staff', { ...form, permissions: permsJson })
      }
      setMessage({ type: 'success', text: editingId ? 'แก้ไขสำเร็จ' : 'เพิ่มพนักงานสำเร็จ' })
      setShowModal(false)
      loadStaff()
    } catch { setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' }) }
    finally { setSaving(false) }
  }

  // ─── Status toggle ────────────────────────────────────────────
  const handleToggle = (s: Staff) => {
    const newStatus = s.status === 'active' ? 'suspended' : 'active'
    const label = newStatus === 'suspended' ? 'ระงับ' : 'เปิดใช้งาน'
    setConfirmDlg({
      title: `${label}พนักงาน`, message: `ยืนยัน${label} "${s.name}"?`,
      type: newStatus === 'suspended' ? 'danger' : 'info', confirmLabel: label,
      onConfirm: async () => {
        setConfirmDlg(null)
        try { await api.put(`/staff/${s.id}/status`, { status: newStatus }); loadStaff() } catch {}
        setMessage({ type: 'success', text: `${label}สำเร็จ` })
      },
      onCancel: () => setConfirmDlg(null),
    })
  }

  // ─── Detail panel ─────────────────────────────────────────────
  const openDetail = async (s: Staff) => {
    setDetailStaff(s)
    setDetailTab('login')
    try {
      const [loginRes, actRes] = await Promise.all([
        api.get(`/staff/${s.id}/login-history`),
        api.get(`/staff/${s.id}/activity`),
      ])
      setLoginHistory(loginRes.data.data || [])
      setActivityLog(actRes.data.data || [])
    } catch {}
  }

  const fmtDate = (d: string | null) => {
    if (!d) return '-'
    try { return new Date(d).toLocaleString('th-TH', { year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' }) }
    catch { return d }
  }

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>พนักงาน</h1>
        <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> เพิ่มพนักงาน
        </button>
      </div>

      {message && (
        <div style={{ background: message.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)', color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-error)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>
          {message.text}
        </div>
      )}

      <input type="text" className="input" placeholder="ค้นหาพนักงาน..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360, marginBottom: 16 }} />

      {/* ── ตารางพนักงาน ──────────────────────────────────────── */}
      <div className="card-surface" style={{ overflow: 'auto' }}>
        {loading ? <Loading inline text="กำลังโหลด..." /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>ไม่พบพนักงาน</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Username</th><th>ชื่อ</th><th>Role</th><th>สิทธิ์</th><th>สถานะ</th><th>Login ล่าสุด</th><th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const rb = roleBadge[s.role] || roleBadge.viewer
                const perms: string[] = (() => { try { return JSON.parse(s.permissions || '[]') } catch { return [] } })()
                return (
                  <tr key={s.id}>
                    <td className="mono secondary">#{s.id}</td>
                    <td className="mono" style={{ fontWeight: 500 }}>{s.username}</td>
                    <td>{s.name}</td>
                    <td><span className={`badge ${rb.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><rb.icon size={11} />{rb.label}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {s.role === 'owner' || s.role === 'admin' ? 'ทุกสิทธิ์' : perms.length > 0 ? `${perms.length} สิทธิ์` : 'ไม่มี'}
                    </td>
                    <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-error'}`}>{s.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</span></td>
                    <td className="secondary" style={{ fontSize: 12 }}>
                      {fmtDate(s.last_login_at)}
                      {s.last_login_ip && <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>IP: {s.last_login_ip}</div>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => openDetail(s)} style={{ height: 28, fontSize: 11, padding: '0 6px' }}>ประวัติ</button>
                        <button className="btn btn-ghost" onClick={() => openEdit(s)} style={{ height: 28, fontSize: 11, padding: '0 6px' }}>แก้ไข</button>
                        <button className={`btn ${s.status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(s)} style={{ height: 28, fontSize: 11, padding: '0 6px' }}>
                          {s.status === 'active' ? 'ระงับ' : 'เปิด'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
        <span>ทั้งหมด {staffList.length}</span>
        <span>ใช้งาน {staffList.filter(s => s.status === 'active').length}</span>
        <span>ระงับ {staffList.filter(s => s.status !== 'active').length}</span>
      </div>

      {/* ══ Modal: เพิ่ม/แก้ไข + Permissions ═══════════════════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto', animation: 'fadeSlideUp 0.2s ease' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {editingId ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>Username</div>
                <input type="text" className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} disabled={!!editingId} style={editingId ? { opacity: 0.5 } : {}} />
              </div>

              {!editingId && (
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Password</div>
                  <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              )}
              {editingId && (
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</div>
                  <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="ไม่เปลี่ยนก็ไม่ต้องกรอก" />
                </div>
              )}

              <div>
                <div className="label" style={{ marginBottom: 4 }}>ชื่อ-นามสกุล</div>
                <input type="text" className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              {/* Role */}
              <div>
                <div className="label" style={{ marginBottom: 4 }}>บทบาท (Role)</div>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="owner">Owner — เจ้าของ (ทุกสิทธิ์)</option>
                  <option value="admin">Admin — แอดมินหลัก (ทุกสิทธิ์)</option>
                  <option value="operator">Operator — ทำได้เฉพาะที่เลือก</option>
                  <option value="viewer">Viewer — ดูได้อย่างเดียว</option>
                </select>
              </div>

              {/* Permissions — แสดงเฉพาะ operator */}
              {form.role === 'operator' && (
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>สิทธิ์การเข้าถึง ({selectedPerms.length} สิทธิ์)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {permGroups.map(g => {
                      const allKeys = g.perms.map(p => p.key)
                      const allChecked = allKeys.every(k => selectedPerms.includes(k))
                      return (
                        <div key={g.group} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                            <input type="checkbox" checked={allChecked} onChange={() => toggleGroupAll(g)} style={{ accentColor: 'var(--accent)' }} />
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{g.label}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>({g.perms.length})</span>
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, paddingLeft: 24 }}>
                            {g.perms.map(p => (
                              <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', padding: '3px 0' }}>
                                <input type="checkbox" checked={selectedPerms.includes(p.key)} onChange={() => togglePerm(p.key)} style={{ accentColor: 'var(--accent)' }} />
                                {p.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1, height: 38 }} onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" style={{ flex: 1, height: 38, fontWeight: 600 }} onClick={handleSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : (editingId ? 'บันทึก' : 'เพิ่มพนักงาน')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Detail Panel: Login History + Activity Log ═════════════ */}
      {detailStaff && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 640, width: '100%', maxHeight: '85vh', overflowY: 'auto', animation: 'fadeSlideUp 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{detailStaff.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{detailStaff.username} · {detailStaff.role}</div>
              </div>
              <button className="btn btn-ghost" onClick={() => setDetailStaff(null)}>ปิด</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
              {[
                { key: 'login' as const, label: 'ประวัติ Login', icon: Clock },
                { key: 'activity' as const, label: 'Activity Log', icon: Activity },
              ].map(tab => (
                <button key={tab.key} onClick={() => setDetailTab(tab.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: detailTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottom: detailTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                }}>
                  <tab.icon size={14} />{tab.label}
                </button>
              ))}
            </div>

            {/* Login History */}
            {detailTab === 'login' && (
              <div style={{ fontSize: 12 }}>
                {loginHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>ยังไม่มีประวัติ login</div>
                ) : loginHistory.map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>IP: {l.ip}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.user_agent}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className={`badge ${l.success ? 'badge-success' : 'badge-error'}`} style={{ fontSize: 10 }}>
                        {l.success ? 'สำเร็จ' : 'ล้มเหลว'}
                      </span>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{fmtDate(l.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Activity Log */}
            {detailTab === 'activity' && (
              <div style={{ fontSize: 12 }}>
                {activityLog.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>ยังไม่มี activity</div>
                ) : activityLog.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${a.method === 'DELETE' ? 'badge-error' : a.method === 'PUT' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                        {a.method}
                      </span>
                      <span className="mono" style={{ color: 'var(--text-secondary)' }}>{a.path}</span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ color: a.status_code >= 400 ? 'var(--status-error)' : 'var(--status-success)', fontWeight: 500 }}>{a.status_code}</span>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{fmtDate(a.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDlg && <ConfirmDialog {...confirmDlg} />}
    </div>
  )
}
