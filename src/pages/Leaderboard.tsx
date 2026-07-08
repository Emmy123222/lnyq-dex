import { useState, useEffect } from 'react'
import { referralService } from '../services/referralService'

function fmtPts(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M pts`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K pts`
  return `${n} pts`
}

const RANK_COLORS: Record<number, string> = { 1: '#F0B90B', 2: '#C0C0C0', 3: '#CD7F32' }
const SWATCHES = ['#A051FC','#531C97','#2EBD85','#F0B90B','#F6465D','#26262E','#34343E','#4A4A56','#6B6B78','#9A9AA6','#C9C9D2']

function initials(name: string) { return name.slice(0, 2).toUpperCase() }

interface LeaderEntry { rank: number; username: string; points: number }

function TraderRow({ entry }: { entry: LeaderEntry }) {
  const rankColor = RANK_COLORS[entry.rank] ?? 'var(--text-primary)'
  const swatch = SWATCHES[(entry.rank - 1) % SWATCHES.length]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 2fr 1.5fr', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-mono)', color: rankColor }}>#{entry.rank}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 6, background: swatch, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
          {initials(entry.username)}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{entry.username}</span>
      </div>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtPts(entry.points)}</span>
    </div>
  )
}

const PERIODS = ['24H', '7D', '30D', 'All'] as const

export default function Leaderboard() {
  const [period, setPeriod] = useState<typeof PERIODS[number]>('7D')
  const [entries, setEntries] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    setLoading(true)
    referralService.getLeaderboard().then(res => {
      setLoading(false)
      if (res.ok) {
        setEntries(res.data)
      } else {
        setError(res.error.code === 'INTEGRATION_UNAVAILABLE'
          ? 'Leaderboard backend not configured.'
          : res.error.message)
      }
    })
  }, [period])

  return (
    <div style={{ padding: '26px 24px 32px', overflowY: 'auto', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Leaderboard</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Ranked by referral points — {period} view.</div>
        </div>
        <Seg options={PERIODS as unknown as string[]} value={period} onChange={v => setPeriod(v as typeof period)} />
      </div>

      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 2fr 1.5fr', padding: '11px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          {['Rank', 'Trader', 'Points'].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i >= 2 ? 'right' : undefined }}>{h}</span>
          ))}
        </div>

        {loading && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading…</div>
        )}
        {!loading && error && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            {error}
          </div>
        )}
        {!loading && !error && entries.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No leaderboard data yet.</div>
        )}
        {entries.map(e => <TraderRow key={e.rank} entry={e} />)}
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
