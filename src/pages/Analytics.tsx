import { useState } from 'react'

const PERIODS = ['7D', '30D', '90D', 'All']

function ComingSoonPanel({ title, message }: { title: string; message: string }) {
  return (
    <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 }}>
      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</span>
      <span style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6, maxWidth: 320 }}>{message}</span>
    </div>
  )
}

export default function Analytics() {
  const [period, setPeriod] = useState('30D')

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Analytics</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Your trading performance across all spot markets.</span>
        </div>
        <div style={{ display: 'flex', height: 28, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 3, gap: 3 }}>
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{ padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: period === p ? 'var(--accent)' : 'transparent', color: period === p ? '#fff' : 'var(--text-tertiary)', border: 'none', transition: 'all 100ms' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16, padding: 24, overflow: 'auto' }}>

        {/* Stat strip — unavailable */}
        <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Analytics API unavailable. Performance data will appear here once real order history is accumulated.
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 240, display: 'flex', gap: 16 }}>
          <ComingSoonPanel
            title="Cumulative PnL"
            message="No trades yet. Complete your first trade to see your performance chart."
          />
          <div style={{ flex: '0 0 400px' }}>
            <ComingSoonPanel
              title="Performance Breakdown"
              message="Win rate, volume by market, and long/short split will appear here after your first trades."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
