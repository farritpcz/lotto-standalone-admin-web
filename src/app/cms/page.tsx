/**
 * Admin — จัดการหน้าเว็บไซต์ (CMS — Content Management System)
 *
 * ฟีเจอร์:
 * - 3 tabs: แบนเนอร์ / ตัวอักษรวิ่ง / รูปประเภทหวย
 * - แบนเนอร์: list, add/edit/delete (image_url, link_url, sort_order)
 * - ตัวอักษรวิ่ง: textarea + save (ข้อความ marquee)
 * - รูปประเภทหวย: list lottery types + image upload placeholder
 *
 * ความสัมพันธ์:
 * - API อาจยังไม่มี → ใช้ mock data ทั้งหมด
 * - เมื่อ API พร้อม → เปลี่ยน mock เป็นเรียก API จริง
 *
 * Design System: Linear/Vercel dark theme
 * - .page-container, .page-header, .card-surface
 * - .admin-table, .btn-*, .input, .label, .badge-*
 */
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Image, MessageSquareText, FlaskConical, Palette, Plus } from 'lucide-react'
import Loading from '@/components/Loading'
import ImageUpload from '@/components/ImageUpload'
import ThemeTab from '@/components/ThemeTab'

// =============================================================================
// TYPES — โครงสร้างข้อมูล CMS
// =============================================================================

/** Tab ที่เลือกอยู่ */
type TabKey = 'banners' | 'ticker' | 'lottery-images' | 'theme'

/** แบนเนอร์ 1 ชิ้น */
interface Banner {
  id: number
  image_url: string
  link_url: string
  sort_order: number
  is_active: boolean
  status?: string // ⭐ API ส่ง status: "active"/"inactive" — แปลงเป็น is_active ตอนโหลด
}

/** ฟอร์มแบนเนอร์ */
interface BannerForm {
  image_url: string
  link_url: string
  sort_order: number
  is_active: boolean
}

/** รูปประเภทหวย */
interface LotteryImage {
  id: number
  lottery_type_code: string
  lottery_type_name: string
  image_url: string
}

// =============================================================================
// MOCK DATA — ใช้เมื่อ API ยังไม่พร้อม
// =============================================================================
// ⭐ MEMBER_WEB_URL — URL ของ member-web ที่เก็บ static images
const MEMBER_WEB_URL = process.env.NEXT_PUBLIC_MEMBER_WEB_URL || 'http://localhost:3001'

// ⭐ Default banners — รูปพื้นฐานที่ตั้งไว้เลย agent เอามาอัพใหม่ค่อยทับ
const MOCK_BANNERS: Banner[] = [
  { id: 1, image_url: `${MEMBER_WEB_URL}/images/banners/banner-1.svg`, link_url: '/promotions', sort_order: 1, is_active: true },
  { id: 2, image_url: `${MEMBER_WEB_URL}/images/banners/banner-2.svg`, link_url: '/promotions', sort_order: 2, is_active: true },
  { id: 3, image_url: `${MEMBER_WEB_URL}/images/banners/banner-3.svg`, link_url: '', sort_order: 3, is_active: true },
]

const MOCK_TICKER = '🎉 ยินดีต้อนรับสู่ LOTTO · จ่ายจริง ถอนได้จริง · สมัครวันนี้รับโบนัส 100% · หวยรัฐบาลจ่ายบาทละ 900'

// ⭐ Default lottery images — ไม่ hardcode, ดึงจาก API (ltTypes)
// fallback เป็น array ว่าง ถ้า API ยังไม่พร้อม
const MOCK_LOTTERY_IMAGES: LotteryImage[] = []

// =============================================================================
// COMPONENT — CMSPage
// =============================================================================
export default function CMSPage() {
  // ----- State: Active tab -----
  const [activeTab, setActiveTab] = useState<TabKey>('banners')

  // ----- State: Banners -----
  const [banners, setBanners] = useState<Banner[]>([])
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null)
  const [bannerForm, setBannerForm] = useState<BannerForm>({
    image_url: '', link_url: '', sort_order: 1, is_active: true,
  })

  // ----- State: Ticker -----
  const [tickerText, setTickerText] = useState('')
  const [tickerSaving, setTickerSaving] = useState(false)

  // ----- State: Lottery images -----
  const [lotteryImages, setLotteryImages] = useState<LotteryImage[]>([])

  // ----- State: Lottery type images (จาก API จริง) -----
  const [ltTypes, setLtTypes] = useState<{id:number;name:string;code:string;image_url:string}[]>([])
  const [editingLtId, setEditingLtId] = useState<number|null>(null)
  const [editUrl, setEditUrl] = useState('')

  // ----- State: Feedback + Confirm -----
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | null>(null)
  const [loading, setLoading] = useState(true)

  // ===== โหลดข้อมูลเริ่มต้น =====
  useEffect(() => { loadAllData() }, [])

  // ===== โหลด lottery types สำหรับ tab รูปหวย =====
  useEffect(() => {
    api.get('/lotteries').then(res => setLtTypes(res.data.data || [])).catch(() => {})
  }, [])

  // ===== ซ่อน message หลัง 3 วินาที =====
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  /**
   * โหลดข้อมูล CMS ทั้งหมด (banners, ticker, lottery images)
   * fallback → mock data
   */
  const loadAllData = async () => {
    setLoading(true)
    try {
      // พยายามเรียก API จริง
      const [bannersRes, tickerRes, imagesRes] = await Promise.allSettled([
        api.get('/cms/banners'),
        api.get('/cms/ticker'),
        api.get('/cms/lottery-images'),
      ])
      // ⭐ API ส่ง status: "active" — แปลงเป็น is_active: boolean สำหรับ UI
      const rawBanners = bannersRes.status === 'fulfilled' ? bannersRes.value.data.data || [] : MOCK_BANNERS
      setBanners(rawBanners.map((b: Banner) => ({ ...b, is_active: b.is_active ?? (b.status === 'active') })))
      setTickerText(tickerRes.status === 'fulfilled' ? (tickerRes.value.data.data?.ticker_text || tickerRes.value.data.data?.text || '') : MOCK_TICKER)
      setLotteryImages(imagesRes.status === 'fulfilled' ? imagesRes.value.data.data || [] : MOCK_LOTTERY_IMAGES)
    } catch {
      // fallback ทั้งหมด
      setBanners(MOCK_BANNERS)
      setTickerText(MOCK_TICKER)
      setLotteryImages(MOCK_LOTTERY_IMAGES)
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BANNER HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  /** เปิด modal เพิ่มแบนเนอร์ */
  const openAddBanner = () => {
    setEditingBannerId(null)
    setBannerForm({ image_url: '', link_url: '', sort_order: banners.length + 1, is_active: true })
    setShowBannerModal(true)
  }

  /** เปิด modal แก้ไขแบนเนอร์ */
  const openEditBanner = (banner: Banner) => {
    setEditingBannerId(banner.id)
    setBannerForm({
      image_url: banner.image_url,
      link_url: banner.link_url,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    })
    setShowBannerModal(true)
  }

  /** บันทึกแบนเนอร์ (เพิ่ม/แก้ไข) */
  const handleSaveBanner = async () => {
    if (!bannerForm.image_url) {
      setMessage({ type: 'error', text: 'กรุณากรอก URL รูปภาพ' })
      return
    }
    try {
      // ⭐ แปลง is_active → status สำหรับ API
      const payload = { ...bannerForm, status: bannerForm.is_active ? 'active' : 'inactive' }
      if (editingBannerId) {
        await api.put(`/cms/banners/${editingBannerId}`, payload)
      } else {
        await api.post('/cms/banners', payload)
      }
      setShowBannerModal(false)
      loadAllData()
    } catch {
      // mock: จัดการ state ตรงๆ
      if (editingBannerId) {
        setBanners(prev => prev.map(b =>
          b.id === editingBannerId ? { ...b, ...bannerForm } : b
        ))
      } else {
        setBanners(prev => [...prev, { id: Date.now(), ...bannerForm }])
      }
      setShowBannerModal(false)
    }
    setMessage({ type: 'success', text: editingBannerId ? 'แก้ไขแบนเนอร์สำเร็จ' : 'เพิ่มแบนเนอร์สำเร็จ' })
  }

  /** ลบแบนเนอร์ — ต้อง confirm */
  const handleDeleteBanner = (banner: Banner) => {
    setConfirmDialog({
      title: 'ลบแบนเนอร์',
      message: `ยืนยันลบแบนเนอร์ #${banner.sort_order}?\n${banner.image_url}`,
      type: 'danger',
      confirmLabel: 'ลบ',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await api.delete(`/cms/banners/${banner.id}`)
          loadAllData()
        } catch {
          setBanners(prev => prev.filter(b => b.id !== banner.id))
        }
        setMessage({ type: 'success', text: 'ลบแบนเนอร์สำเร็จ' })
      },
      onCancel: () => setConfirmDialog(null),
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TICKER HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  /** บันทึกข้อความวิ่ง */
  const handleSaveTicker = async () => {
    setTickerSaving(true)
    try {
      await api.put('/cms/ticker', { ticker_text: tickerText })
    } catch {
      // mock: ไม่ต้องทำอะไร (เก็บ state อยู่แล้ว)
    }
    setMessage({ type: 'success', text: 'บันทึกข้อความวิ่งสำเร็จ' })
    setTickerSaving(false)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB DEFINITION — config สำหรับแต่ละ tab
  // ─────────────────────────────────────────────────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
    { key: 'banners', label: 'แบนเนอร์', icon: Image },
    { key: 'ticker', label: 'ตัวอักษรวิ่ง', icon: MessageSquareText },
    { key: 'lottery-images', label: 'รูปประเภทหวย', icon: FlaskConical },
    { key: 'theme', label: 'ธีมสี', icon: Palette },
  ]

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1>จัดการหน้าเว็บไซต์ (CMS)</h1>
      </div>

      {/* ── Feedback Message ─────────────────────────────────────────────── */}
      {message && (
        <div style={{
          background: message.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         TAB NAVIGATION — สลับระหว่าง 3 sections
         ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 20,
        borderBottom: '1px solid var(--border)', paddingBottom: 0,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 13, fontWeight: 500,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s ease',
              marginBottom: -1, // overlap bottom border
            }}
          >
            <tab.icon size={15} strokeWidth={1.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading inline text="กำลังโหลด..." />
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════
             TAB: แบนเนอร์
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'banners' && (
            <div className="card-surface" style={{ padding: 20 }}>
              {/* Header + Add button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="label">รายการแบนเนอร์ ({banners.length} รายการ)</div>
                <button className="btn btn-primary" onClick={openAddBanner} style={{ height: 30, fontSize: 12 }}>
                  <Plus size={12} strokeWidth={2} />
                  เพิ่มแบนเนอร์
                </button>
              </div>

              {banners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                  ยังไม่มีแบนเนอร์
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ลำดับ</th>
                      <th>รูปภาพ</th>
                      <th>ลิงก์</th>
                      <th>สถานะ</th>
                      <th style={{ textAlign: 'right' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.sort((a, b) => a.sort_order - b.sort_order).map(banner => (
                      <tr key={banner.id}>
                        {/* ลำดับ */}
                        <td className="mono" style={{ width: 60 }}>#{banner.sort_order}</td>
                        {/* Preview รูปภาพ (thumbnail placeholder) */}
                        <td>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                            {/* Image placeholder — จำลองภาพ */}
                            <div style={{
                              width: 80, height: 32, borderRadius: 4,
                              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, color: 'var(--text-tertiary)', overflow: 'hidden',
                            }}>
                              <Image size={14} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {banner.image_url}
                            </span>
                          </div>
                        </td>
                        {/* ลิงก์ */}
                        <td className="secondary" style={{ fontSize: 12 }}>
                          {banner.link_url || '-'}
                        </td>
                        {/* สถานะ */}
                        <td>
                          <span className={`badge ${banner.is_active ? 'badge-success' : 'badge-neutral'}`}>
                            {banner.is_active ? 'แสดง' : 'ซ่อน'}
                          </span>
                        </td>
                        {/* จัดการ */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => openEditBanner(banner)}
                              style={{ height: 28, padding: '0 8px', fontSize: 12 }}>
                              แก้ไข
                            </button>
                            <button className="btn btn-danger" onClick={() => handleDeleteBanner(banner)}
                              style={{ height: 28, padding: '0 8px', fontSize: 12 }}>
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
             TAB: ตัวอักษรวิ่ง (Ticker / Marquee)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'ticker' && (
            <div className="card-surface" style={{ padding: 20 }}>
              <div className="label" style={{ marginBottom: 12 }}>ข้อความวิ่ง (Ticker Text)</div>

              {/* Preview — จำลองข้อความวิ่ง */}
              <div style={{
                background: 'var(--bg-base)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '10px 16px', marginBottom: 16,
                overflow: 'hidden', whiteSpace: 'nowrap',
              }}>
                <div style={{
                  display: 'inline-block',
                  animation: 'tickerScroll 15s linear infinite',
                  fontSize: 13, color: 'var(--accent)',
                }}>
                  {tickerText || '(ไม่มีข้อความ)'}
                </div>
              </div>

              {/* Textarea สำหรับแก้ไข */}
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                ข้อความที่จะแสดงวิ่งบนหน้าเว็บ (คั่นด้วย | สำหรับหลายข้อความ)
              </div>
              <textarea
                className="input"
                value={tickerText}
                onChange={e => setTickerText(e.target.value)}
                placeholder="เช่น ยินดีต้อนรับ | สมัครวันนี้รับโบนัส"
                style={{
                  height: 120, padding: 12, resize: 'vertical',
                  fontFamily: 'inherit', lineHeight: 1.6,
                }}
              />

              <button
                className="btn btn-primary"
                onClick={handleSaveTicker}
                disabled={tickerSaving}
                style={{ width: '100%', height: 38, marginTop: 16, fontSize: 13 }}
              >
                {tickerSaving ? 'กำลังบันทึก...' : 'บันทึกข้อความวิ่ง'}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
             TAB: รูปประเภทหวย (Lottery Type Images)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'lottery-images' && (() => {
            const saveImage = async (ltId: number, url?: string) => {
              const imageUrl = url ?? editUrl
              try {
                await api.put(`/lotteries/${ltId}/image`, { image_url: imageUrl })
                setLtTypes(prev => prev.map(l => l.id === ltId ? { ...l, image_url: imageUrl } : l))
                setEditingLtId(null)
                setMessage({ type: 'success', text: imageUrl ? 'บันทึกรูปสำเร็จ' : 'ลบรูปสำเร็จ' })
              } catch { setMessage({ type: 'error', text: 'บันทึกไม่สำเร็จ' }) }
            }

            // Category-based gradients — ไม่ hardcode lottery code
            const categoryGradients: Record<string,string> = {
              thai:   'linear-gradient(135deg, #f5a623, #d4820a)',
              lao:    'linear-gradient(135deg, #ef4444, #dc2626)',
              hanoi:  'linear-gradient(135deg, #ec4899, #be185d)',
              malay:  'linear-gradient(135deg, #14b8a6, #0d9488)',
              stock:  'linear-gradient(135deg, #3b82f6, #2563eb)',
              yeekee: 'linear-gradient(135deg, #0d6e6e, #34d399)',
            }

            return (
            <div className="card-surface" style={{ padding: 20 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                รูปประเภทหวย ({ltTypes.length} ประเภท)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                รูปภาพแสดงในหน้าเลือกหวยของสมาชิก · <span style={{ color: 'var(--accent)', fontWeight: 500 }}>แนะนำ: 200×200px, PNG/SVG, ไม่เกิน 500KB</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                {ltTypes.map(lt => (
                  <div key={lt.id} style={{
                    background: 'var(--bg-base)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 14,
                  }}>
                    {/* ชื่อ + code */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{lt.name}</div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{lt.code}</div>
                        </div>
                      <span style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                        background: lt.image_url ? 'rgba(0,229,160,0.15)' : 'rgba(255,255,255,0.08)',
                        color: lt.image_url ? 'var(--accent)' : 'var(--text-tertiary)',
                      }}>
                        {lt.image_url ? 'มีรูป' : 'ไม่มีรูป'}
                      </span>
                    </div>
                    {/* Upload / เปลี่ยนรูป */}
                    <ImageUpload
                      folder="lottery"
                      currentUrl={lt.image_url || ''}
                      size="md"
                      onUploaded={async (url) => {
                        await saveImage(lt.id, url)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>)
          })()}

          {/* ══════════════════════════════════════════════════════════════
             TAB: ธีมสี
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'theme' && <ThemeTab />}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         MODAL: เพิ่ม/แก้ไขแบนเนอร์
         ══════════════════════════════════════════════════════════════════ */}
      {showBannerModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '24px', maxWidth: 440, width: '100%',
            animation: 'fadeSlideUp 0.2s ease',
          }}>
            {/* Modal header */}
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
              {editingBannerId ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์ใหม่'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* URL รูปภาพ */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>URL รูปภาพ</div>
                <input
                  type="text" className="input" placeholder="เช่น /banners/promo-01.jpg"
                  value={bannerForm.image_url}
                  onChange={e => setBannerForm(f => ({ ...f, image_url: e.target.value }))}
                />
              </div>

              {/* ลิงก์ปลายทาง */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ลิงก์ (ถ้ามี)</div>
                <input
                  type="text" className="input" placeholder="เช่น /promotions/1 หรือ https://..."
                  value={bannerForm.link_url}
                  onChange={e => setBannerForm(f => ({ ...f, link_url: e.target.value }))}
                />
              </div>

              {/* ลำดับแสดง */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ลำดับแสดง</div>
                <input
                  type="number" className="input" min={1}
                  value={bannerForm.sort_order}
                  onChange={e => setBannerForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                />
              </div>

              {/* เปิด/ปิดแสดง */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                <input
                  type="checkbox" checked={bannerForm.is_active}
                  onChange={e => setBannerForm(f => ({ ...f, is_active: e.target.checked }))}
                  style={{ accentColor: 'var(--accent)' }}
                />
                เปิดแสดงแบนเนอร์
              </label>
            </div>

            {/* Modal buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1, height: 38 }}
                onClick={() => setShowBannerModal(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" style={{ flex: 1, height: 38, fontWeight: 600 }}
                onClick={handleSaveBanner}>
                {editingBannerId ? 'บันทึกการแก้ไข' : 'เพิ่มแบนเนอร์'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ───────────────────────────────────────────── */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}

      {/* ── CSS for ticker animation ─────────────────────────────────── */}
      <style jsx>{`
        @keyframes tickerScroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}

