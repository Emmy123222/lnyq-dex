import { useState } from 'react'
import { LEADERBOARD } from '../data/mock'
import type { Trader } from '../types'

function fmtVol(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n}`
}
function fmtPnl(n: number) {
  const abs = Math.abs(n)
  const s = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(2)}M` : abs >= 1_000 ? `${(abs / 1_000).toFixed(1)}K` : String(abs)
  return `${n >= 0 ? '+' : '-'}$${s}`
}

const RANK_COLORS: Record<number, string> = { 1: '#F0B90B', 2: '#C0C0C0', 3: '#CD7F32' }
const SWATCHES = ['#A051FC','#531C97','#2EBD85','#F0B90B','#F6465D','#26262E','#34343E','#4A4A56','#6B6B78','#9A9AA6','#C9C9D2']

function initials(name: string) { return name.slice(0, 2).toUpperCase() }

function TraderRow({ trader }: { trader: Trader }) {
  const rankColor = RANK_COLORS[trader.rank] ?? 'var(--text-primary)'
  const swatch = SWATCHES[(trader.rank - 1) % SWATCHES.length]
  const pnlUp = trader.pnl >= 0
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 2fr 1.2fr 1.2fr 1fr 1fr', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-mono)', color: rankColor }}>#{trader.rank}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 6, background: swatch, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
          {initials(trader.username)}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{trader.username}</span>
      </div>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtVol(trader.volume)}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: pnlUp ? 'var(--up-500)' : 'var(--down-500)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtPnl(trader.pnl)}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{trader.winRate}%</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{trader.trades.toLocaleString()}</span>
    </div>
  )
}

const PERIODS = ['24H', '7D', '30D', 'All'] as const
const METRICS = ['Volume', 'Realized PnL', 'Win Rate'] as const

export default function Leaderboard() {
  const [period, setPeriod] = useState<typeof PERIODS[number]>('7D')
  const [metric, setMetric] = useState<typeof METRICS[number]>('Volume')

  const me   = LEADERBOARD.find(t => t.isCurrentUser)
  const list = LEADERBOARD.filter(t => !t.isCurrentUser)

  return (
    <div style={{ padding: '26px 24px 32px', overflowY: 'auto', minHeight: 0 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Leaderboard</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Ranked by {period} trading volume across all markets.</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Seg options={PERIODS as unknown as string[]} value={period} onChange={v => setPeriod(v as typeof period)} />
          <Seg options={METRICS as unknown as string[]} value={metric} onChange={v => setMetric(v as typeof metric)} />
        </div>
      </div>

      {/* Your rank */}
      {me && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px', background: 'var(--accent-tint)', border: '1px solid var(--border-accent)', borderRadius: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-accent)', letterSpacing: '0.06em' }}>YOUR RANK</span>
          <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>#{me.rank}</span>
          <span style={{ width: 30, height: 30, borderRadius: 6, background: 'linear-gradient(135deg,#A051FC,#531C97)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>TM</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{me.username}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {[
              { label: '7d Volume',    value: fmtVol(me.volume),       color: '#fff' },
              { label: 'Realized PnL', value: fmtPnl(me.pnl),          color: 'var(--up-500)' },
              { label: 'Win Rate',     value: `${me.winRate}%`,         color: '#fff' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 2fr 1.2fr 1.2fr 1fr 1fr', padding: '11px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          {['Rank', 'Trader', '7d Volume', 'Realized PnL', 'Win Rate', 'Trades'].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i >= 2 ? 'right' : undefined }}>{h}</span>
          ))}
        </div>
        {list.map(t => <TraderRow key={t.rank} trader={t} />)}
      </div>
    </div>
  )
}

function Seg({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 3 }}>
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: value === o ? 'var(--accent)' : 'transparent', color: value === o ? '#fff' : 'var(--text-tertiary)', border: 'none' }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
