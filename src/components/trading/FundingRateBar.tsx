/**
 * FundingRateBar — shows current 8h funding rate and countdown for perp markets.
 * Longs pay shorts when rate is positive. Shorts pay longs when negative.
 */

import { useState, useEffect } from 'react'
import { perpService } from '../../services/perpService'
import type { FundingRateInfo } from '../../services/perpService'

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs - Date.now())
  useEffect(() => {
    const id = setInterval(() => setRemaining(targetMs - Date.now()), 1000)
    return () => clearInterval(id)
  }, [targetMs])
  const totalSec = Math.max(0, Math.floor(remaining / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface Props {
  marketId: string
}

export default function FundingRateBar({ marketId }: Props) {
  const [info, setInfo] = useState<FundingRateInfo | null>(null)

  useEffect(() => {
    perpService.getFundingRate(marketId).then(res => {
      if (res.ok) setInfo(res.data)
    })
    const id = setInterval(() => {
      perpService.getFundingRate(marketId).then(res => {
        if (res.ok) setInfo(res.data)
      })
    }, 60_000)
    return () => clearInterval(id)
  }, [marketId])

  const countdown = useCountdown(info?.nextFundingMs ?? Date.now() + 28800000)

  if (!info) return null

  const isPositive = info.rate8h.startsWith('+')
  const isNegative = info.rate8h.startsWith('-')
  const rateColor = isPositive ? 'var(--up-500)' : isNegative ? 'var(--down-500)' : 'var(--text-secondary)'

  const payLabel = info.paysDirection === 'longs-pay-shorts'
    ? 'Longs pay shorts'
    : info.paysDirection === 'shorts-pay-longs'
    ? 'Shorts pay longs'
    : 'Neutral'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>FUNDING / 8H</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: rateColor, fontVariantNumeric: 'tabular-nums' }}>
            {info.rate8h}%
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{payLabel}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>NEXT FUNDING</span>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {countdown}
        </span>
      </div>
    </div>
  )
}
