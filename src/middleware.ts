/**
 * Next.js Middleware — Admin Route Guard + Security Headers
 *
 * ป้องกันเข้าหน้า admin โดยไม่ login:
 * - ถ้าไม่มี admin_token cookie → redirect ไป /login
 * - ถ้ามี token แล้วเข้า /login → redirect ไป /
 *
 * ⚠️ เมื่อ migrate เป็น httpOnly cookie → uncomment redirect logic
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return addSecurityHeaders(NextResponse.next())
  }

  const token = request.cookies.get('admin_token')?.value
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  // ถ้ามี token + เข้าหน้า login → redirect ไป dashboard
  if (isPublicPath && token) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL('/', request.url))
    )
  }

  // ⚠️ disabled จนกว่าจะ migrate เป็น httpOnly cookie
  // if (!isPublicPath && !token) {
  //   return addSecurityHeaders(
  //     NextResponse.redirect(new URL('/login', request.url))
  //   )
  // }

  return addSecurityHeaders(NextResponse.next())
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // CSP: อนุญาต unsafe-eval + unsafe-inline สำหรับ Next.js (Turbopack dev)
  // ws:/wss: สำหรับ HMR + WebSocket
  // production ควรใช้ nonce-based CSP แทน unsafe-inline
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http: https:; font-src 'self' data:; connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:* https:; frame-ancestors 'none'"
  )
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
