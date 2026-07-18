import { useState, useEffect } from 'react'
import { portfolioService } from '../services/portfolioService'
import { orderService, statusLabel } from '../services/orderService'
import { authService } from '../services/authService'
import { FLAGS } from '../config/featureFlags'
import type { PortfolioPosition, Order, Balance, PortfolioStats, OrderStatus } from '../types'

function getUserId(): string {
  const session = authService.loadSession()
  return session?.userId ?? ''
}

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const PORT_TABS = FLAGS.PERPS
  ? (['Positions', 'Open Orders', 'Order History'] as const)
  : (['Holdings',  'Open Orders', 'Order History'] as const)
type PortTab = (typeof PORT_TABS)[number]

const PERIODS = ['7D', '30D', 'All'] as const

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING:          'var(--text-tertiary)',
  OPEN:             'var(--accent)',
  PARTIALLY_FILLED: 'var(--warn)',
  FILLED:           'var(--up-500)',
  CANCELLED:        'var(--text-tertiary)',
  EXPIRED:          'var(--text-tertiary)',
  REJECTED:         'var(--down-500)',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const color = STATUS_COLOR[status] ?? 'var(--text-tertiary)'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `color-mix(in srgb, ${color} 14%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>
      {statusLabel(status)}
    </span>
  )
}

function PositionRow({ pos }: { pos: PortfolioPosition }) {
  const label = pos.marketId.replace('-SPOT', '').replace('-PERP', '').replace(/-/g, ' / ')
  const isLong = pos.side === 'buy'
  const pnlUp = pos.unrealizedPnl.startsWith('+')
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1.3fr 1fr 0.8fr', padding: '14px 14px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isLong ? 'var(--up-500)' : 'var(--down-500)' }}>{isLong ? 'Long' : 'Short'}</div>
      </div>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pos.quantity}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(pos.entryPrice))}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(pos.markPrice))}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: pnlUp ? 'var(--up-500)' : 'var(--down-500)', fontVariantNumeric: 'tabular-nums' }}>{pos.unrealizedPnl}</span>
        <span style={{ fontSize: 10, color: pnlUp ? 'var(--up-500)' : 'var(--down-500)' }}>({pos.unrealizedPnlPct})</span>
      </div>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right' }}>—</span>
      {FLAGS.PERPS ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--down-400)', background: 'rgba(246,70,93,0.12)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 4, cursor: 'pointer' }}>Close</button>
        </div>
      ) : <span />}
    </div>
  )
}

function OpenOrderRow({ order, onCancel }: { order: Order; onCancel: (id: string) => void }) {
  const isBuy = order.side === 'buy'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr 0.7fr', padding: '13px 14px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{order.createdAt.slice(0, 16).replace('T', ' ')}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: isBuy ? 'var(--up-500)' : 'var(--down-500)' }}>{isBuy ? 'Buy' : 'Sell'}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(order.price))}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.quantity}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.filledQuantity}/{order.quantity}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(order.total))}</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><StatusBadge status={order.status} /></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => onCancel(order.id)} style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--down-400)', background: 'rgba(246,70,93,0.12)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

function HistoryRow({ order }: { order: Order }) {
  const isBuy = order.side === 'buy'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr', padding: '13px 14px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{order.createdAt.slice(0, 16).replace('T', ' ')}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: isBuy ? 'var(--up-500)' : 'var(--down-500)' }}>{isBuy ? 'Buy' : 'Sell'}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(order.price))}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.quantity}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.filledQuantity}/{order.quantity}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(order.total))}</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><StatusBadge status={order.status} /></div>
    </div>
  )
}

export default function Portfolio() {
  const [tab,          setTab]          = useState<PortTab>(PORT_TABS[0])
  const [period,       setPeriod]       = useState<typeof PERIODS[number]>('30D')
  const [stats,        setStats]        = useState<PortfolioStats | null>(null)
  const [balances,     setBalances]     = useState<Balance[]>([])
  const [positions,    setPositions]    = useState<PortfolioPosition[]>([])
  const [openOrders,   setOpenOrders]   = useState<Order[]>([])
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const userId = getUserId()
    Promise.all([
      portfolioService.getPortfolio(userId),
      orderService.getOpenOrders(userId),
      orderService.getOrderHistory(userId),
    ]).then(([port, open, hist]) => {
      if (port.ok) {
        setStats(port.data.stats)
        setBalances(port.data.balances)
        setPositions(port.data.positions)
      }
      if (open.ok) setOpenOrders(open.data)
      if (hist.ok) setOrderHistory(hist.data)
      setLoading(false)
    })
  }, [])

  const handleCancel = async (orderId: string) => {
    const session = authService.loadSession()
    const order = openOrders.find(o => o.id === orderId)
    const res = await orderService.cancelOrder({ orderId, marketId: order?.marketId ?? '' }, session?.sessionToken ?? '')
    if (res.ok) setOpenOrders(prev => prev.filter(o => o.id !== orderId))
  }

  const equity   = stats ? parseFloat(stats.equity) : 0
  const avail    = stats ? parseFloat(stats.availableBalance) : 0
  const margin   = stats ? parseFloat(stats.marginUsed) : 0
  const uPnl     = stats ? parseFloat(stats.unrealizedPnl) : 0
  const allPnl   = stats ? parseFloat(stats.allTimePnl) : 0

  return (
    <div className="overflow-y-auto" style={{ minHeight: 0, padding: '26px 24px 32px' }}>
      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Portfolio</span>
        {FLAGS.DEPOSITS && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button disabled title="Withdraw unavailable — wallet integration required" style={{ height: 30, padding: '0 12px', borderRadius: 6, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-tertiary)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.5 }}>Withdraw</button>
            <button disabled title="Deposit unavailable — wallet integration required" style={{ height: 30, padding: '0 12px', borderRadius: 6, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.5 }}>Deposit</button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>Loading portfolio…</div>
      ) : (
        <>
          {/* Summary + Chart row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
            <div style={{ flex: '0 0 360px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Account Equity</span>
                <span style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{fmt(equity)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: allPnl >= 0 ? 'var(--up-500)' : 'var(--down-500)' }}>
                    {allPnl >= 0 ? '+' : ''}{fmt(allPnl)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>all-time</span>
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border-subtle)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Available Balance', value: fmt(avail),    color: 'var(--text-primary)' },
                  { label: 'Margin Used',       value: fmt(margin),   color: 'var(--text-primary)' },
                  { label: 'Unrealized PnL',    value: (uPnl >= 0 ? '+' : '') + fmt(uPnl), color: uPnl >= 0 ? 'var(--up-500)' : 'var(--down-500)' },
                  { label: 'Referral Points',   value: `${stats?.referralPoints ?? 0} pts`, color: 'var(--text-secondary)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Account Value · {period}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 3 }}>
                  {PERIODS.map(p => (
                    <button key={p} onClick={() => setPeriod(p)} style={{ padding: '4px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: period === p ? 'var(--accent)' : 'transparent', color: period === p ? '#fff' : 'var(--text-tertiary)', border: 'none' }}>{p}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Account value history</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', opacity: 0.6 }}>Available after Phase 1 launch</span>
              </div>
            </div>
          </div>

          {/* Positions / Orders */}
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', height: 42, padding: '0 4px' }}>
              {PORT_TABS.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ height: '100%', padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', background: 'transparent', border: 'none' }}>{t}</button>
              ))}
            </div>

            {(tab === 'Positions' || tab === 'Holdings') && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1.3fr 1fr 0.8fr', padding: '9px 14px' }}>
                  {['Position', 'Size / Tokens', 'Entry', 'Mark', 'PnL (USDC)', 'Liq. Price', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i > 0 && i < 6 ? 'right' : undefined }}>{h}</span>
                  ))}
                </div>
                {positions.length === 0
                  ? <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>No open positions</div>
                  : positions.map(pos => <PositionRow key={pos.marketId} pos={pos} />)
                }
              </>
            )}

            {tab === 'Open Orders' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr 0.7fr', padding: '9px 14px' }}>
                  {['Time', 'Side', 'Price', 'Size', 'Filled', 'Total', 'Status', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i >= 2 && i <= 5 ? 'right' : undefined }}>{h}</span>
                  ))}
                </div>
                {openOrders.length === 0
                  ? <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>No open orders</div>
                  : openOrders.map(o => <OpenOrderRow key={o.id} order={o} onCancel={handleCancel} />)
                }
              </>
            )}

            {tab === 'Order History' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr', padding: '9px 14px' }}>
                  {['Time', 'Side', 'Price', 'Size', 'Filled', 'Total', 'Status'].map((h, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i >= 2 && i <= 5 ? 'right' : undefined }}>{h}</span>
                  ))}
                </div>
                {orderHistory.length === 0
                  ? <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>No order history</div>
                  : orderHistory.map(o => <HistoryRow key={o.id} order={o} />)
                }
              </>
            )}
          </div>

          {/* Balances */}
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Balances &amp; Holdings</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1.2fr', padding: '9px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Asset', 'Total', 'Available', 'Locked', 'Value (USDC)'].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i > 0 ? 'right' : undefined }}>{h}</span>
              ))}
            </div>
            {balances.map(b => (
              <div key={b.asset} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1.2fr', padding: '13px 16px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: b.asset === 'USDC' ? '#26262E' : b.asset === 'LNYQNFT' ? '#A051FC' : '#531C97', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {b.asset.slice(0, 1)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{b.asset}</span>
                </div>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.total}</span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--up-500)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.available}</span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.locked}</span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(b.usdValue))}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
