import { useState } from 'react'
import { POSITIONS, OPEN_ORDERS, PORTFOLIO_STATS, HOLDINGS } from '../data/mock'
import type { Position, Order } from '../types'

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const PORT_TABS = ['Positions', 'Open Orders', 'Order History'] as const
type PortTab = typeof PORT_TABS[number]

const PERIODS = ['7D', '30D', 'All'] as const

function PositionRow({ pos }: { pos: Position }) {
  const label = pos.pair.type === 'spot' ? `${pos.pair.base} / ${pos.pair.quote}` : `${pos.pair.base} - ${pos.pair.quote}`
  const isLong = pos.side === 'buy'
  const pnlUp = pos.pnl >= 0
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1.3fr 1fr 0.8fr', padding: '14px 14px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isLong ? 'var(--up-500)' : 'var(--down-500)' }}>{isLong ? 'Long' : 'Short'}</div>
      </div>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pos.size}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(pos.entryPrice)}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(pos.markPrice)}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: pnlUp ? 'var(--up-500)' : 'var(--down-500)', fontVariantNumeric: 'tabular-nums' }}>
          {pnlUp ? '+' : ''}{fmt(pos.pnl)}
        </span>
        <span style={{ fontSize: 10, color: pnlUp ? 'var(--up-500)' : 'var(--down-500)' }}>({pnlUp ? '+' : ''}{pos.pnlPct.toFixed(2)}%)</span>
      </div>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right' }}>—</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--down-400)', background: 'rgba(246,70,93,0.12)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 4, cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  )
}

function OpenOrderRow({ order }: { order: Order }) {
  const isBuy = order.side === 'buy'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr 0.7fr', padding: '13px 14px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{order.createdAt}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: isBuy ? 'var(--up-500)' : 'var(--down-500)' }}>{isBuy ? 'Buy' : 'Sell'}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(order.price)}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.size}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.filled}/{order.size}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(order.total)}</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(160,81,252,0.14)', color: 'var(--accent)', border: '1px solid rgba(160,81,252,0.3)' }}>
          Open
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--down-400)', background: 'rgba(246,70,93,0.12)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

export default function Portfolio() {
  const [tab, setTab] = useState<PortTab>('Positions')
  const [period, setPeriod] = useState<typeof PERIODS[number]>('30D')

  return (
    <div className="overflow-y-auto" style={{ minHeight: 0, padding: '26px 24px 32px' }}>
      {/* Page heading + actions */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Portfolio</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ height: 30, padding: '0 12px', borderRadius: 6, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Withdraw</button>
          <button style={{ height: 30, padding: '0 12px', borderRadius: 6, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Deposit</button>
        </div>
      </div>

      {/* Summary + Chart row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>

        {/* Account Equity card */}
        <div style={{ flex: '0 0 360px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Account Equity</span>
            <span style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
              {fmt(PORTFOLIO_STATS.equity)}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--up-500)' }}>+{fmt(PORTFOLIO_STATS.allTimePnl)} ({PORTFOLIO_STATS.allTimePnlPct.toFixed(2)}%)</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>all-time</span>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Available Balance',  value: fmt(PORTFOLIO_STATS.availableBalance),          color: 'var(--text-primary)' },
              { label: 'Margin Used',        value: fmt(PORTFOLIO_STATS.marginUsed),                color: 'var(--text-primary)' },
              { label: 'Unrealized PnL',     value: `+${fmt(PORTFOLIO_STATS.unrealizedPnl)}`,       color: 'var(--up-500)' },
              { label: 'Cross Margin Ratio', value: `${PORTFOLIO_STATS.crossMarginRatio.toFixed(1)}%`, color: 'var(--up-500)' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equity chart placeholder */}
        <div style={{ flex: 1, minWidth: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Account Value · {period}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 3 }}>
              {PERIODS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '4px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: period === p ? 'var(--accent)' : 'transparent',
                    color: period === p ? '#fff' : 'var(--text-tertiary)',
                    border: 'none',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Chart coming soon</span>
          </div>
        </div>
      </div>

      {/* Positions / Orders panel */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
        {/* Tabs */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', height: 42, padding: '0 4px' }}>
          {PORT_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                height: '100%', padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'transparent', border: 'none',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Positions' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1.3fr 1fr 0.8fr', padding: '9px 14px' }}>
              {['Position', 'Size / NFTs', 'Entry', 'Mark', 'PnL (USDC)', 'Liq. Price', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i > 0 && i < 6 ? 'right' : undefined }}>{h}</span>
              ))}
            </div>
            {POSITIONS.map(pos => <PositionRow key={`${pos.pair.base}-${pos.side}`} pos={pos} />)}
          </>
        )}

        {tab === 'Open Orders' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr 0.7fr', padding: '9px 14px' }}>
              {['Time', 'Side', 'Price', 'Size', 'Filled', 'Total', 'Status', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i >= 2 && i <= 5 ? 'right' : undefined }}>{h}</span>
              ))}
            </div>
            {OPEN_ORDERS.map(o => <OpenOrderRow key={o.id} order={o} />)}
          </>
        )}

        {tab === 'Order History' && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            No recent orders
          </div>
        )}
      </div>

      {/* Balances & Holdings */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Balances &amp; Holdings</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', padding: '9px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          {['Asset', 'Balance', 'Avg. Cost', 'Value (USDC)'].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i > 0 ? 'right' : undefined }}>{h}</span>
          ))}
        </div>
        {HOLDINGS.map(h => (
          <div key={h.asset} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', padding: '13px 16px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: h.swatch, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {h.icon}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{h.asset}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{h.kind}</div>
              </div>
            </div>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{h.qty}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{h.cost}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{h.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
