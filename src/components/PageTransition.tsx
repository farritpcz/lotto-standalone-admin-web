/**
 * PageTransition — Fade/Slide page transition wrapper
 *
 * ครอบ content ของหน้าเพื่อเพิ่ม animation ตอน mount
 * fadeIn + slideUp (translateY 8px -> 0) duration 0.25s
 *
 * Usage:
 *   <PageTransition>
 *     <div>...page content...</div>
 *   </PageTransition>
 */

'use client'

import React from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        style={{
          animation: 'pageTransitionIn 0.25s ease-out forwards',
        }}
      >
        {children}
      </div>

      <style jsx global>{`
        @keyframes pageTransitionIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
