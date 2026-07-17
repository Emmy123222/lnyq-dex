import type { ChartTooltipData } from '../../types/chart'

interface Props {
  data:            ChartTooltipData | null
  containerWidth:  number
  containerHeight: number
}

function fmtPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtVol(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('en-US')
}

const W = 168
const H = 134
const GAP = 14

export function ChartTooltip({ data, containerWidth, containerHeight }: Props) {
  if (!data) return null

  let left = data.x + GAP
  let top  = data.y - H / 2

  if (left + W > containerWidth)  left = data.x - W - GAP
  if (left < 0)                   left = GAP
  if (top < 4)                    top  = 4
  if (top + H > containerHeight)  top  = containerHeight - H - 4

  const isUp = data.close >= data.open
  const up   = 'var(--chart-up, #00c4b0)'
  const dn   = 'var(--chart-down, #ff4666)'

  const rows: { lbl: string; val: string; clr?: string }[] = [
    { lbl: 'O', val: fmtPrice(data.open),  clr: 'var(--text-secondary)' },
    { lbl: 'H', val: fmtPrice(data.high),  clr: up },
    { lbl: 'L', val: fmtPrice(data.low),   clr: dn },
    { lbl: 'C', val: fmtPrice(data.close), clr: isUp ? up : dn },
  ]

  return (
    <div style={{
      position:   'absolute',
      left, top,
      width:      W,
      zIndex:     20,
      pointerEvents: 'none',
      background: 'rgba(8, 8, 14, 0.94)',
      border:     '1px solid rgba(255,255,255,0.09)',
      borderRadius: 8,
      padding:    '9px 11px',
      backdropFilter: 'blur(14px)',
      boxShadow:  '0 8px 32px rgba(0,0,0,0.55)',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
        {data.time}
      </div>
      {rows.map(r => (
        <div key={r.lbl} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', width: 12, flexShrink: 0 }}>{r.lbl}</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: r.clr, fontVariantNumeric: 'tabular-nums' }}>{r.val}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Vol</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {fmtVol(data.volume)}
        </span>
      </div>
    </div>
  )
}
