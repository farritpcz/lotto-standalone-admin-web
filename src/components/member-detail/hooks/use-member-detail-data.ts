/**
 * useMemberDetailData — โหลด/จัดการ state ของหน้า member detail
 *
 * Rule: รวม 3 ข้อมูล (member, transactions, bets) + pagination
 * Related: app/members/[id]/page.tsx
 */
'use client'
import { useCallback, useEffect, useState } from 'react'
import { memberMgmtApi, txMgmtApi, betMgmtApi } from '@/lib/api'
import type { MemberDetail, Transaction, Bet } from '../types'

const PER_PAGE = 20

export function useMemberDetailData(memberId: number) {
  // ----- Member -----
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // ----- Transactions -----
  const [txns, setTxns] = useState<Transaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txPage, setTxPage] = useState(1)
  const [txLoading, setTxLoading] = useState(false)

  // ----- Bets -----
  const [bets, setBets] = useState<Bet[]>([])
  const [betTotal, setBetTotal] = useState(0)
  const [betPage, setBetPage] = useState(1)
  const [betLoading, setBetLoading] = useState(false)

  // ----- Error (ให้ page แสดง toast) -----
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadMember = useCallback(async () => {
    if (!memberId || isNaN(memberId)) return
    setLoading(true)
    try {
      const res = await memberMgmtApi.get(memberId)
      const data = res.data.data || res.data
      setMember(data)
    } catch {
      setLoadError('โหลดข้อมูลสมาชิกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [memberId])

  const loadTransactions = useCallback(async () => {
    if (!memberId || isNaN(memberId)) return
    setTxLoading(true)
    try {
      const res = await txMgmtApi.list({ member_id: memberId, page: txPage, per_page: PER_PAGE })
      setTxns(res.data.data?.items || [])
      setTxTotal(res.data.data?.total || 0)
    } catch {
      setLoadError('โหลดประวัติเครดิตไม่สำเร็จ')
    } finally {
      setTxLoading(false)
    }
  }, [memberId, txPage])

  const loadBets = useCallback(async () => {
    if (!memberId || isNaN(memberId)) return
    setBetLoading(true)
    try {
      const res = await betMgmtApi.list({ member_id: memberId, page: betPage, per_page: PER_PAGE })
      setBets(res.data.data?.items || [])
      setBetTotal(res.data.data?.total || 0)
    } catch {
      setLoadError('โหลดประวัติการแทงไม่สำเร็จ')
    } finally {
      setBetLoading(false)
    }
  }, [memberId, betPage])

  useEffect(() => {
    loadMember()
  }, [loadMember])

  return {
    // member
    member,
    setMember,
    loading,
    loadMember,
    // transactions
    txns,
    txTotal,
    txPage,
    setTxPage,
    txLoading,
    loadTransactions,
    // bets
    bets,
    betTotal,
    betPage,
    setBetPage,
    betLoading,
    loadBets,
    // error
    loadError,
    clearError: () => setLoadError(null),
    // constants
    PER_PAGE,
  }
}
