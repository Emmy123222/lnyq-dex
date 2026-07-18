/**
 * TradePage — Phase 1 spot CLOB trading interface.
 *
 * Perps are gated: selector shows them as "Coming in Phase 2."
 * All data comes from services — no direct mock imports.
 */

import { useState, useEffect } from 'react'
import MarketChartCard from '../components/trading/MarketChartCard'
import OrderBook from '../components/trading/OrderBook'
import RecentTrades from '../components/trading/RecentTrades'
import OrderEntry from '../components/trading/OrderEntry'
import FundingRateBar from '../components/trading/FundingRateBar'
import { FLAGS, gateLabel } from '../config/featureFlags'
import { authService } from '../services/authService'
import { marketService } from '../services/marketService'
import { orderService, statusLabel } from '../services/orderService'
import { portfolioService } from '../services/portfolioService'
import { perpService } from '../services/perpService'

function getSession() {
  const s = authService.loadSession()
  return { userId: s?.userId ?? '', token: s?.sessionToken ?? '' }
}
import type { Market, Order, OrderStatus, MarketTicker } from '../types'
import type { OpenInterestInfo, PerpPosition } from '../services/perpService'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function marketToPair(m: Market) {
  return {
    base: m.baseAsset,
    quote: m.quoteAsset,
    type: m.type,
    lastPrice: 0,
    change24h: 0,
    volume24h: 0,
    high24h: 0,
    low24h: 0,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-[3px] shrink-0">
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: muted ? 'var(--text-secondary)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

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

function PositionRow({ pos, onClose }: { pos: PerpPosition; onClose: (id: string) => void }) {
  const marketLabel = pos.marketId.replace('-PERP', '').replace('-SPOT', '').replace(/-/g, ' / ')
  const isLong = pos.side === 'long'
  const pnlUp  = pos.unrealizedPnl.startsWith('+')
  const liqColor = 'var(--down-500)'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.9fr 0.9fr 0.9fr 1.2fr 0.7fr', padding: '11px 14px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{marketLabel}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isLong ? 'var(--up-500)' : 'var(--down-500)' }}>
          {isLong ? 'Long' : 'Short'} {pos.leverage}×
        </div>
      </div>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pos.size}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(pos.entryPrice))}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(pos.markPrice))}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: liqColor, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(pos.liquidationPrice))}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: pnlUp ? 'var(--up-500)' : 'var(--down-500)', fontVariantNumeric: 'tabular-nums' }}>{pos.unrealizedPnl}</span>
        <span style={{ fontSize: 10, color: pnlUp ? 'var(--up-500)' : 'var(--down-500)' }}>{pos.unrealizedPnlPct}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onClose(pos.id)}
          style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--down-400)', background: 'rgba(246,70,93,0.12)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 4, cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

function OpenOrderRow({ order, onCancel }: { order: Order; onCancel: (id: string) => void }) {
  const isBuy = order.side === 'buy'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr 0.7fr', padding: '13px 16px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{order.createdAt.slice(11, 19)}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: isBuy ? 'var(--up-500)' : 'var(--down-500)' }}>{isBuy ? 'Buy' : 'Sell'}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(order.price))}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.quantity}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.filledQuantity} / {order.quantity}</span>
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
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr', padding: '13px 16px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{order.createdAt.slice(0, 16).replace('T', ' ')}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: isBuy ? 'var(--up-500)' : 'var(--down-500)' }}>{isBuy ? 'Buy' : 'Sell'}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(order.price))}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.quantity}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.filledQuantity} / {order.quantity}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(order.total))}</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><StatusBadge status={order.status} /></div>
    </div>
  )
}

const ALL_POS_TABS = ['Positions', 'Open Orders', 'Order History'] as const
type PosTab = typeof ALL_POS_TABS[number]

function PositionsPanel({ market }: { market: Market | null }) {
  const [tab,          setTab]         = useState<PosTab>(FLAGS.PERPS ? 'Positions' : 'Open Orders')
  const [positions,    setPositions]   = useState<PerpPosition[]>([])
  const [openOrders,   setOpenOrders]  = useState<Order[]>([])
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [loading,      setLoading]     = useState(true)

  const loadAll = () => {
    const { userId } = getSession()
    Promise.all([
      FLAGS.PERPS ? perpService.getPositions() : Promise.resolve({ ok: true, data: [] } as const),
      orderService.getOpenOrders(userId),
      orderService.getOrderHistory(userId),
    ]).then(([pos, open, hist]) => {
      if (pos.ok)  setPositions(pos.data as PerpPosition[])
      if (open.ok) setOpenOrders(open.data)
      if (hist.ok) setOrderHistory(hist.data)
      setLoading(false)
    })
  }

  useEffect(() => { loadAll() }, []) // eslint-disable-line

  const handleCancel = async (orderId: string) => {
    if (!market) return
    const { token } = getSession()
    const res = await orderService.cancelOrder({ orderId, marketId: market.id }, token)
    if (res.ok) setOpenOrders(prev => prev.filter(o => o.id !== orderId))
  }

  const handleClosePosition = async (positionId: string) => {
    const res = await perpService.closePosition(positionId)
    if (res.ok) setPositions(prev => prev.filter(p => p.id !== positionId))
  }

  if (loading) return <div style={{ padding: 20, fontSize: 12, color: 'var(--text-tertiary)' }}>Loading…</div>

  return (
    <>
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', height: 42, padding: '0 4px', gap: 0 }}>
        {ALL_POS_TABS.filter(t => t !== 'Positions' || FLAGS.PERPS).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ height: '100%', padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', background: 'transparent', border: 'none' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Positions' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.9fr 0.9fr 0.9fr 1.2fr 0.7fr', padding: '9px 14px', flexShrink: 0 }}>
            {['Position', 'Size', 'Entry', 'Mark', 'Liq.', 'PnL (USDC)', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i > 0 && i < 6 ? 'right' : undefined }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {positions.length === 0
              ? <div style={{ padding: '20px 16px', fontSize: 12, color: 'var(--text-tertiary)' }}>No open positions.</div>
              : positions.map(pos => (
                  <PositionRow key={pos.id} pos={pos} onClose={handleClosePosition} />
                ))
            }
          </div>
        </>
      )}

      {tab === 'Open Orders' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr 0.7fr', padding: '9px 16px', flexShrink: 0 }}>
            {['Time', 'Side', 'Price', 'Size', 'Filled', 'Total', 'Status', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i >= 2 && i <= 5 ? 'right' : undefined }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {openOrders.map(o => <OpenOrderRow key={o.id} order={o} onCancel={handleCancel} />)}
          </div>
        </>
      )}

      {tab === 'Order History' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr', padding: '9px 16px', flexShrink: 0 }}>
            {['Time', 'Side', 'Price', 'Size', 'Filled', 'Total', 'Status'].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i >= 2 && i <= 5 ? 'right' : undefined }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {orderHistory.map(o => <HistoryRow key={o.id} order={o} />)}
          </div>
        </>
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type MobileContentTab = 'chart' | 'book' | 'trades'

export default function TradePage() {
  const [markets,          setMarkets]          = useState<Market[]>([])
  const [activeMarket,     setActiveMarket]     = useState<Market | null>(null)
  const [ticker,           setTicker]           = useState<MarketTicker | null>(null)
  const [selectorOpen,     setSelectorOpen]     = useState(false)
  const [clickedPrice,     setClickedPrice]     = useState<number | undefined>()
  const [mobileContentTab, setMobileContentTab] = useState<MobileContentTab>('chart')
  const [orderSheet,       setOrderSheet]       = useState<'buy' | 'sell' | null>(null)
  const [availableUsdc,    setAvailableUsdc]    = useState(0)
  const [availableBase,    setAvailableBase]    = useState(0)
  const [openInterest,     setOpenInterest]     = useState<OpenInterestInfo | null>(null)

  useEffect(() => {
    marketService.listAllMarkets().then(res => {
      if (!res.ok) return
      setMarkets(res.data)
      // Pick first phase1 spot market, then first spot, then first of any type
      const first = res.data.find(m => m.type === 'spot' && m.isPhase1)
        ?? res.data.find(m => m.type === 'spot' && m.isActive)
        ?? res.data[0]
      if (first) setActiveMarket(first)
    })
  }, [])

  // Reload balances when session starts and when active market changes (base asset varies)
  useEffect(() => {
    const { userId } = getSession()
    portfolioService.getBalances(userId).then(res => {
      if (!res.ok) return
      const usdcBal = res.data.find(b => b.asset === 'USDC')
      if (usdcBal) setAvailableUsdc(parseFloat(usdcBal.available))
      if (activeMarket) {
        const baseBal = res.data.find(b => b.asset === activeMarket.baseAsset)
        setAvailableBase(baseBal ? parseInt(baseBal.available) : 0)
      }
    })
  }, [activeMarket])

  // Load ticker for active market
  useEffect(() => {
    if (!activeMarket) return
    setTicker(null)
    marketService.getTicker(activeMarket.id).then(res => {
      if (res.ok) setTicker(res.data)
    })
    // Poll ticker every 5s
    const id = setInterval(() => {
      marketService.getTicker(activeMarket.id).then(res => {
        if (res.ok) setTicker(res.data)
      })
    }, 5_000)
    return () => clearInterval(id)
  }, [activeMarket])

  // Fetch perp-specific data when active market changes
  useEffect(() => {
    if (!activeMarket || activeMarket.type !== 'perp' || !FLAGS.PERPS) {
      setOpenInterest(null)
      return
    }
    perpService.getOpenInterest(activeMarket.id).then(res => {
      if (res.ok) setOpenInterest(res.data)
    })
  }, [activeMarket])

  const pair = activeMarket ? marketToPair(activeMarket) : {
    base: '', quote: 'USDC', type: 'spot' as const,
    lastPrice: 0, change24h: 0, volume24h: 0, high24h: 0, low24h: 0,
  }

  const isPerp  = activeMarket?.type === 'perp'
  const marketId = activeMarket?.id ?? ''

  const spotMarkets = markets.filter(m => m.type === 'spot')
  const perpMarkets = markets.filter(m => m.type === 'perp')

  const mobileContentTabs: { id: MobileContentTab; label: string }[] = [
    { id: 'chart',  label: 'Chart' },
    { id: 'book',   label: 'Order Book' },
    { id: 'trades', label: 'Trades' },
  ]

  const changeStr = ticker?.change24hPct ?? (ticker ? `${ticker.change24h}%` : null)
  const changeUp  = changeStr?.startsWith('+')
  const changeColor = changeUp ? 'var(--up-500)' : changeStr?.startsWith('-') ? 'var(--down-500)' : 'var(--text-tertiary)'

  if (markets.length === 0 && !activeMarket) {
    return (
      <div style={{ height: 'calc(100vh - var(--topbar-h))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No active markets yet</span>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Spot markets will appear here once the protocol team lists them.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - var(--topbar-h))' }}>

      {/* Desktop market header strip */}
      <div style={{ height: 66, background: 'var(--surface-1)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }} className="hidden lg:flex items-center gap-[30px] px-5 overflow-x-auto">
        <button onClick={() => setSelectorOpen(true)} className="flex items-center gap-3 shrink-0" style={{ background: 'none', border: 'none', cursor: 'pointer', paddingRight: 26, borderRight: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            {isPerp ? `${pair.base} - ${pair.quote}` : `${pair.base} / ${pair.quote}`}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          {isPerp
            ? <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(160,81,252,0.18)', color: '#A051FC', border: '1px solid rgba(160,81,252,0.4)' }}>PERP</span>
            : <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(46,189,133,0.18)', color: '#2EBD85', border: '1px solid rgba(46,189,133,0.4)' }}>SPOT</span>
          }
        </button>
        <Stat label="Last Price"  value={ticker?.lastPrice ?? '—'} />
        <div className="flex flex-col gap-[3px] shrink-0">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>24h Change</span>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: changeColor }}>{changeStr ?? '—'}</span>
        </div>
        <Stat label="24h High"   value={ticker?.high24h   ?? '—'} muted />
        <Stat label="24h Low"    value={ticker?.low24h    ?? '—'} muted />
        <Stat label="24h Volume" value={ticker ? `$${(parseFloat(ticker.volume24h) / 1_000).toFixed(1)}K` : '—'} />
        {isPerp && FLAGS.PERPS && (
          <>
            {openInterest && <Stat label="Open Interest" value={`$${fmt(parseFloat(openInterest.notional) / 1_000_000, 2)}M`} />}
            <div style={{ height: 36, width: 1, background: 'var(--border-subtle)', flexShrink: 0 }} />
            <FundingRateBar marketId={marketId} />
          </>
        )}
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex flex-1 min-h-0 gap-3 p-3 overflow-hidden">
        <div className="flex flex-col gap-3 flex-1 min-h-0 min-w-0">
          <div style={{ height: 466, overflow: 'hidden', flexShrink: 0 }}>
            <MarketChartCard
              marketId={marketId}
              baseAsset={activeMarket?.baseAsset ?? ''}
              quoteAsset={activeMarket?.quoteAsset ?? ''}
              marketType={activeMarket?.type}
              tickerOverride={ticker}
            />
          </div>
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <PositionsPanel market={activeMarket} />
          </div>
        </div>

        <div className="flex flex-col gap-3 min-h-0 shrink-0" style={{ width: 296 }}>
          <div style={{ height: 582, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Order Book</span>
              {activeMarket && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{activeMarket.baseAsset}</span>}
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <OrderBook marketId={marketId} onPriceClick={setClickedPrice} />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <RecentTrades marketId={marketId} baseSymbol={activeMarket?.baseAsset} />
          </div>
        </div>

        <div style={{ width: 312, flexShrink: 0, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <OrderEntry
              marketId={marketId}
              isPerp={isPerp}
              prefillPrice={clickedPrice}
              pair={pair}
              availableUsdc={availableUsdc}
              availableBase={availableBase}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile layout ────────────────────────────────────────────────────── */}
      <div className="flex lg:hidden flex-col flex-1 min-h-0">

        {/* Compact market header */}
        <div style={{ height: 56, flexShrink: 0, background: 'var(--surface-1)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
          <button
            onClick={() => setSelectorOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              {isPerp ? `${pair.base}-PERP` : `${pair.base}/${pair.quote}`}
            </span>
            {isPerp
              ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 3, background: 'rgba(160,81,252,0.18)', color: '#A051FC' }}>PERP</span>
              : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 3, background: 'rgba(46,189,133,0.18)', color: '#2EBD85' }}>SPOT</span>
            }
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
              {ticker?.lastPrice ?? '—'}
            </span>
            {changeStr && (
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: changeColor }}>
                {changeStr}
              </span>
            )}
          </div>
        </div>

        {/* Content tabs: Chart / Order Book / Trades */}
        <div style={{ display: 'flex', height: 40, flexShrink: 0, background: 'var(--surface-1)', borderBottom: '1px solid var(--border-subtle)' }}>
          {mobileContentTabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMobileContentTab(id)}
              style={{ flex: 1, height: '100%', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none',
                color: mobileContentTab === id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                borderBottom: mobileContentTab === id ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {mobileContentTab === 'chart'  && <MarketChartCard marketId={marketId} baseAsset={activeMarket?.baseAsset ?? ''} quoteAsset={activeMarket?.quoteAsset ?? ''} marketType={activeMarket?.type} tickerOverride={ticker} />}
          {mobileContentTab === 'book'   && <OrderBook marketId={marketId} onPriceClick={p => { setClickedPrice(p); setOrderSheet('buy') }} />}
          {mobileContentTab === 'trades' && <RecentTrades marketId={marketId} baseSymbol={activeMarket?.baseAsset} />}
        </div>

        {/* Orders panel */}
        <div style={{ height: 196, flexShrink: 0, background: 'var(--surface-1)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <PositionsPanel market={activeMarket} />
        </div>

        {/* Sticky Buy / Sell */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setOrderSheet('buy')}
            style={{ flex: 1, height: 50, borderRadius: 10, fontSize: 15, fontWeight: 900, background: 'var(--up-500)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Buy {pair.base || '—'}
          </button>
          <button
            onClick={() => setOrderSheet('sell')}
            style={{ flex: 1, height: 50, borderRadius: 10, fontSize: 15, fontWeight: 900, background: 'var(--down-500)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Sell {pair.base || '—'}
          </button>
        </div>
      </div>

      {/* Order entry bottom sheet (mobile) */}
      {orderSheet !== null && (
        <div
          className="lg:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setOrderSheet(null)}
        >
          <div
            style={{ width: '100%', maxHeight: '85vh', background: 'var(--surface-1)', borderRadius: '16px 16px 0 0', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, background: 'var(--border-subtle)', borderRadius: 2, margin: '12px auto 0' }} />
            <OrderEntry
              marketId={marketId}
              isPerp={isPerp}
              prefillPrice={clickedPrice}
              pair={pair}
              availableUsdc={availableUsdc}
              availableBase={availableBase}
            />
          </div>
        </div>
      )}

      {/* Market selector modal */}
      {selectorOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={() => setSelectorOpen(false)}>
          <div style={{ width: 540, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 10, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Select Market</span>
              <button onClick={() => setSelectorOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ padding: '0 8px 12px', display: 'flex', flexDirection: 'column' }}>
              {/* Spot markets */}
              {spotMarkets.length > 0 && (
                <>
                  <div style={{ padding: '10px 10px 4px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>SPOT</span>
                  </div>
                  {spotMarkets.map(m => {
                    const isActive = m.id === activeMarket?.id
                    return (
                      <button key={m.id} onClick={() => { setActiveMarket(m); setSelectorOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', borderRadius: 6, width: '100%', textAlign: 'left', background: isActive ? 'var(--accent-tint)' : 'transparent', borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', border: 'none' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? '#fff' : 'var(--text-primary)' }}>{m.displayName}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(46,189,133,0.14)', color: '#2EBD85', border: '1px solid rgba(46,189,133,0.3)' }}>SPOT</span>
                      </button>
                    )
                  })}
                </>
              )}

              {/* Perp markets — gated */}
              {perpMarkets.length > 0 && (
                <>
                  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 4px' }} />
                  <div style={{ padding: '6px 10px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>PERPETUALS</span>
                    {!FLAGS.PERPS && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: 'rgba(240,165,0,0.12)', color: '#F0A500', border: '1px solid rgba(240,165,0,0.3)' }}>
                        {gateLabel('PERPS')}
                      </span>
                    )}
                  </div>
                  {perpMarkets.map(m => {
                    const isActive = m.id === activeMarket?.id
                    return (
                      <button
                        key={m.id}
                        disabled={!FLAGS.PERPS}
                        onClick={() => FLAGS.PERPS ? (setActiveMarket(m), setSelectorOpen(false)) : undefined}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', borderRadius: 6, width: '100%', textAlign: 'left', background: isActive ? 'var(--accent-tint)' : 'transparent', borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent', cursor: FLAGS.PERPS ? 'pointer' : 'not-allowed', border: 'none', opacity: FLAGS.PERPS ? 1 : 0.45 }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? '#fff' : 'var(--text-secondary)' }}>{m.displayName}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(160,81,252,0.14)', color: '#A051FC', border: '1px solid rgba(160,81,252,0.3)' }}>
                          {FLAGS.PERPS ? 'PERP' : 'Phase 2'}
                        </span>
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
