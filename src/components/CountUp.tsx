/**
 * CountUp — Number count-up animation
 *
 * แสดงตัวเลขนับจาก 0 ถึง value พร้อม format comma + ทศนิยม
 * Duration ~1 วินาที, ease-out easing
 *
 * Usage:
 *   <CountUp value={91622} prefix="฿" decimals={2} />
 *   <CountUp value={1500} />
 *   <CountUp value={99.5} prefix="$" decimals={1} />
 */

'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  /** ค่าเป้าหมาย */
  value: number
  /** prefix เช่น "฿", "$" */
  prefix?: string
  /** suffix เช่น "บาท", "%" */
  suffix?: string
  /** จำนวนทศนิยม (default: 0) */
  decimals?: number
  /** ระยะเวลา animation เป็น ms (default: 1000) */
  duration?: number
}

/* ease-out cubic: เร็วตอนแรก ช้าตอนท้าย */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/* format ตัวเลขด้วย comma + ทศนิยม */
function formatNumber(num: number, decimals: number): string {
  const fixed = num.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart ? `${formatted}.${decPart}` : formatted
}

export default function CountUp({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1000,
}: CountUpProps) {
  const [display, setDisplay] = useState('0')
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    startTimeRef.current = 0

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)
      const current = easedProgress * value

      setDisplay(formatNumber(current, decimals))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, decimals, duration])

  return (
    <span>
      {prefix}{display}{suffix}
    </span>
  )
}
