/**
 * imageUrl.ts — Helper สำหรับแก้ปัญหา URL ของรูปภาพ 2 แบบ:
 *
 * 1. **Absolute URL** (R2 Cloudflare): `https://pub-xxx.r2.dev/folder/file.png`
 *    → ใช้ตรงได้เลย
 *
 * 2. **Relative URL** (legacy local /uploads): `/uploads/folder/file.jpg`
 *    → ต้อง prefix ด้วย API_BASE
 *
 * 3. **Empty / null / undefined** → คืน empty string (ไม่ error)
 *
 * 4. **Data URL** (base64 preview): `data:image/...` → คืนตรงๆ
 *
 * Usage:
 *   import { resolveImageUrl } from '@/lib/imageUrl'
 *   <img src={resolveImageUrl(user.avatar_url)} />
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1'
// แยก /api/v1 ออก → ได้ base URL ของ API server
const API_BASE = API_URL.replace(/\/api\/v1\/?$/, '')

/**
 * resolveImageUrl - คืน URL ของรูปที่พร้อมใส่ <img src>
 *
 * @param url URL จาก DB/API (อาจเป็น absolute/relative/null)
 * @returns URL ที่ browser โหลดได้, หรือ empty string ถ้าไม่มี
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return ''

  // Data URL (base64 preview) → ใช้ตรง
  if (url.startsWith('data:')) return url

  // Blob URL (object URL ของ File upload) → ใช้ตรง
  if (url.startsWith('blob:')) return url

  // Absolute URL (R2 หรือ external) → ใช้ตรง
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  // Relative /uploads/... → prefix ด้วย API_BASE (legacy compat ระหว่าง migration)
  if (url.startsWith('/uploads/')) return API_BASE + url

  // Path อื่นๆ ที่ขึ้นต้นด้วย / → prefix ด้วย API_BASE
  if (url.startsWith('/')) return API_BASE + url

  // fallback: ใช้ตรง (อาจเป็น relative path ที่ไม่ขึ้นต้นด้วย /)
  return url
}

/**
 * isR2Url - เช็คว่า URL เป็นของ R2 หรือไม่ (absolute https + matches public URL)
 * ใช้สำหรับ security check ก่อน submit form
 */
export function isR2Url(url: string): boolean {
  if (!url) return false
  return url.startsWith('https://pub-') && url.includes('.r2.dev')
}
