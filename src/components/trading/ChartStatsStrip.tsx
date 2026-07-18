import type { MarketTicker } from '../../types'
import type { OrderBookTop } from '../../types/chart'

interface StatCardProps {
  label: string
  value: string
  color?: string
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="chart-stat-card">
      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: color ?? 'var(--text-primary)', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}

interface Props {
  ticker?:    MarketTicker | null
  top:        OrderBookTop
  quoteAsset?: string
}

function changeColor(c: string | null) {
  if (!c) return 'var(--text-secondary)'
  if (c.startsWith('+')) return 'var(--chart-up, #00c4b0)'
  if (c.startsWith('-')) return 'var(--chart-down, #ff4666)'
  return 'var(--text-secondary)'
}

function fmtVol(raw: string | undefined) {
  if (!raw) return '—'
  const n = parseFloat(raw)
  if (isNaN(n)) return raw
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

export function ChartStatsStrip({ ticker, top, quoteAsset = 'USDC' }: Props) {
  const stats: StatCardProps[] = [
    {
      label: 'Last',
      value: ticker?.lastPrice ?? '—',
      color: 'var(--text-primary)',
    },
    {
      label: '24h Chg',
      value: ticker ? (ticker.change24hPct ?? `${ticker.change24h}%`) : '—',
      color: changeColor(ticker?.change24hPct ?? ticker?.change24h ?? null),
    },
    {
      label: `Vol (${quoteAsset})`,
      value: fmtVol(ticker?.volume24h),
      color: 'var(--text-secondary)',
    },
    {
      label: '24h High',
      value: ticker?.high24h ?? '—',
      color: 'var(--chart-up, #00c4b0)',
    },
    {
      label: '24h Low',
      value: ticker?.low24h ?? '—',
      color: 'var(--chart-down, #ff4666)',
    },
    {
      label: 'Bid',
      value: top.bestBid ?? '—',
      color: 'var(--chart-bid, rgba(0,196,176,0.9))',
    },
    {
      label: 'Ask',
      value: top.bestAsk ?? '—',
      color: 'var(--chart-ask, rgba(255,70,102,0.9))',
    },
    {
      label: 'Spread',
      value: top.spread ?? '—',
      color: 'var(--text-secondary)',
    },
    {
      label: 'Mid',
      value: top.midpoint ?? '—',
      color: 'var(--text-secondary)',
    },
  ]

  return (
    <div
      className="chart-stats-strip"
      style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}
    >
      {stats.map(s => <StatCard key={s.label} {...s} />)}
    </div>
  )
}
