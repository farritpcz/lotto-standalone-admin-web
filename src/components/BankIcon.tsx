/**
 * BankIcon — แสดงไอคอนธนาคารจาก bank_code
 *
 * ใช้: <BankIcon code="KBANK" size={32} />
 *
 * ไอคอนอยู่ที่: /icons/banks/{code}.png
 * รองรับ: KBANK, SCB, BBL, KTB, BAY, GSB, BAAC, TTB, TBANK, GHB, TISCO,
 *          KKP, IBANK, CIMB, UOB, ICBC, BOC, LHBANK, TRUEWALLET, PROMPTPAY
 */

'use client'

import Image from 'next/image'

// แมป bank_code → ชื่อไฟล์ icon (lowercase)
const BANK_ICON_MAP: Record<string, string> = {
  KBANK: 'kbank',
  SCB: 'scb',
  BBL: 'bbl',
  KTB: 'ktb',
  BAY: 'bay',
  GSB: 'gsb',
  BAAC: 'baac',
  TTB: 'ttb',
  TBANK: 'tbank',
  GHB: 'ghb',
  TISCO: 'tisco',
  KKP: 'kkp',
  IBANK: 'ibank',
  CIMB: 'cimb',
  UOB: 'uob',
  ICBC: 'icbc',
  BOC: 'boc',
  LHBANK: 'lhbank',
  TRUEWALLET: 'truewallet',
  PROMPTPAY: 'promptpay',
}

// ชื่อภาษาไทยของธนาคาร
export const BANK_NAMES: Record<string, string> = {
  KBANK: 'กสิกรไทย',
  SCB: 'ไทยพาณิชย์',
  BBL: 'กรุงเทพ',
  KTB: 'กรุงไทย',
  BAY: 'กรุงศรี',
  GSB: 'ออมสิน',
  BAAC: 'ธ.ก.ส.',
  TTB: 'ทีทีบี',
  TBANK: 'ธนชาต',
  GHB: 'อาคารสงเคราะห์',
  TISCO: 'ทิสโก้',
  KKP: 'เกียรตินาคินภัทร',
  IBANK: 'อิสลาม',
  CIMB: 'ซีไอเอ็มบี',
  UOB: 'ยูโอบี',
  ICBC: 'ไอซีบีซี',
  BOC: 'แห่งประเทศจีน',
  LHBANK: 'แลนด์ แอนด์ เฮ้าส์',
  TRUEWALLET: 'TrueMoney Wallet',
  PROMPTPAY: 'พร้อมเพย์',
}

interface BankIconProps {
  code: string          // bank_code เช่น "KBANK", "SCB"
  size?: number         // ขนาด px (default 28)
  className?: string
  style?: React.CSSProperties
  showName?: boolean    // แสดงชื่อธนาคารด้วย
}

export default function BankIcon({ code, size = 28, className, style, showName }: BankIconProps) {
  const iconFile = BANK_ICON_MAP[code?.toUpperCase()] || code?.toLowerCase()
  const bankName = BANK_NAMES[code?.toUpperCase()] || code

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }} className={className}>
      <Image
        src={`/icons/banks/${iconFile}.png`}
        alt={bankName}
        width={size}
        height={size}
        style={{ borderRadius: size > 24 ? 8 : 6, objectFit: 'cover', flexShrink: 0 }}
        onError={(e) => {
          // fallback: ซ่อน icon ถ้าไม่มีไฟล์
          (e.target as HTMLImageElement).style.display = 'none'
        }}
      />
      {showName && <span>{bankName}</span>}
    </span>
  )
}
