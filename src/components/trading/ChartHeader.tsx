import type { ChartDataStatus } from '../../types/chart'
import type { MarketTicker } from '../../types'
import { ChartStatusBadge } from './ChartStatusBadge'

interface Props {
  baseAsset:   string
  quoteAsset:  string
  marketType?: 'spot' | 'perp'
  status:      ChartDataStatus
  ticker?:     MarketTicker | null
  compact?:    boolean
}

function changeColor(c: string | null) {
  if (!c) return 'var(--text-secondary)'
  if (c.startsWith('+')) return 'var(--chart-up, #00c4b0)'
  if (c.startsWith('-')) return 'var(--chart-down, #ff4666)'
  return 'var(--text-secondary)'
}

export function ChartHeader({
  baseAsset, quoteAsset, marketType = 'spot', status, ticker, compact,
}: Props) {
  const pair = marketType === 'perp'
    ? `${baseAsset} – ${quoteAsset}`
    : `${baseAsset} / ${quoteAsset}`

  const typeBg = marketType === 'perp'
    ? { bg: 'rgba(160,81,252,0.14)', bd: 'rgba(160,81,252,0.32)', fg: '#c180ff' }
    : { bg: 'rgba(0,196,176,0.12)',  bd: 'rgba(0,196,176,0.30)',  fg: '#00c4b0' }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: compact ? '10px 12px' : '11px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      {/* Pair name */}
      <span style={{ fontSize: compact ? 14 : 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1 }}>
        {pair}
      </span>

      {/* Market-type badge */}
      <span style={{
        fontSize: 9, fontWeight: 800, letterSpacing: '0.07em',
        padding: '2px 6px', borderRadius: 3,
        background: typeBg.bg, border: `1px solid ${typeBg.bd}`, color: typeBg.fg,
      }}>
        {marketType.toUpperCase()}
      </span>

      {/* Last price (compact only — on wide header, ticker strip has it) */}
      {compact && ticker && (
        <>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {ticker.lastPrice}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: changeColor(ticker.change24hPct ?? ticker.change24h), fontVariantNumeric: 'tabular-nums' }}>
            {ticker.change24hPct ?? `${ticker.change24h}%`}
          </span>
        </>
      )}

      <div style={{ flex: 1, minWidth: 0 }} />

      <ChartStatusBadge status={status} compact />
    </div>
  )
}
