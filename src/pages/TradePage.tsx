import { useState } from 'react'
import PriceChart from '../components/trading/PriceChart'
import OrderBook from '../components/trading/OrderBook'
import RecentTrades from '../components/trading/RecentTrades'
import OrderEntry from '../components/trading/OrderEntry'
import { PAIRS, POSITIONS, OPEN_ORDERS, ORDER_HISTORY } from '../data/mock'
import type { Pair, Position, Order } from '../types'

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function formatPair(p: Pair) {
  return p.type === 'spot' ? `${p.base} / ${p.quote}` : `${p.base} - ${p.quote}`
}

function PriceDelta({ value, pct }: { value: number; pct: number }) {
  const up = pct >= 0
  return (
    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: up ? 'var(--up-500)' : 'var(--down-500)', fontVariantNumeric: 'tabular-nums' }}>
      {up ? '+' : ''}{fmt(value)} ({up ? '+' : ''}{pct.toFixed(2)}%)
    </span>
  )
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-[3px] shrink-0">
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: muted ? 'var(--text-secondary)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  )
}

function SelectorSection({ label, pairs, active, onSelect }: { label: string; pairs: Pair[]; active: Pair; onSelect: (p: Pair) => void }) {
  return (
    <>
      <div style={{ padding: '6px 10px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      {pairs.map(p => {
        const isActive = p === active
        const up = p.change24h >= 0
        return (
          <button
            key={`${p.base}-${p.type}`}
            onClick={() => onSelect(p)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 12px', borderRadius: 6, width: '100%', textAlign: 'left',
              background: isActive ? 'var(--accent-tint)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', border: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? '#fff' : 'var(--text-primary)' }}>
                {formatPair(p)}
              </span>
              {p.type === 'perp' && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  20x
                </span>
              )}
              {p.type === 'spot' && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(46,189,133,0.14)', color: '#2EBD85', border: '1px solid rgba(46,189,133,0.3)' }}>
                  SPOT
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: up ? 'var(--up-500)' : 'var(--down-500)', fontVariantNumeric: 'tabular-nums' }}>
              {p.lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} · {up ? '+' : ''}{p.change24h.toFixed(2)}%
            </span>
          </button>
        )
      })}
    </>
  )
}

const POS_TABS = ['Positions', 'Open Orders', 'Order History'] as const
type PosTab = typeof POS_TABS[number]

const STATUS_COLOR: Record<string, string> = {
  partial: 'var(--warn)',
  open:    'var(--accent)',
  filled:  'var(--up-500)',
  cancelled: 'var(--text-tertiary)',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? 'var(--text-tertiary)'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `color-mix(in srgb, ${color} 14%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function PositionRow({ pos }: { pos: Position }) {
  const pairLabel = formatPair(pos.pair)
  const isLong = pos.side === 'buy'
  const pnlUp = pos.pnl >= 0
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1.3fr 1fr 0.8fr', padding: '13px 14px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{pairLabel}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isLong ? 'var(--up-500)' : 'var(--down-500)' }}>{isLong ? 'Long' : 'Short'}</div>
      </div>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pos.size}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(pos.entryPrice)}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(pos.markPrice)}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: pnlUp ? 'var(--up-500)' : 'var(--down-500)', fontVariantNumeric: 'tabular-nums' }}>
          {pnlUp ? '+' : ''}{fmt(pos.pnl)}
        </span>
        <span style={{ fontSize: 10, color: pnlUp ? 'var(--up-500)' : 'var(--down-500)' }}>({pnlUp ? '+' : ''}{pos.pnlPct.toFixed(2)}%)</span>
      </div>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right' }}>—</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--down-400)', background: 'rgba(246,70,93,0.12)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 4, cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  )
}

function OpenOrderRow({ order }: { order: Order }) {
  const isBuy = order.side === 'buy'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr 0.7fr', padding: '13px 16px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{order.createdAt}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: isBuy ? 'var(--up-500)' : 'var(--down-500)' }}>{isBuy ? 'Buy' : 'Sell'}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(order.price)}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.size}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.filled} / {order.size}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(order.total)}</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><StatusBadge status={order.status} /></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--down-400)', background: 'rgba(246,70,93,0.12)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

function HistoryRow({ order }: { order: Order }) {
  const isBuy = order.side === 'buy'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr', padding: '13px 16px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{order.createdAt}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: isBuy ? 'var(--up-500)' : 'var(--down-500)' }}>{isBuy ? 'Buy' : 'Sell'}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(order.price)}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.size}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.filled} / {order.size}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(order.total)}</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><StatusBadge status={order.status} /></div>
    </div>
  )
}

function PositionsPanel() {
  const [tab, setTab] = useState<PosTab>('Positions')
  return (
    <>
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', height: 42, padding: '0 4px', gap: 0 }}>
        {POS_TABS.map(t => (
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
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1.3fr 1fr 0.8fr', padding: '9px 14px', flexShrink: 0 }}>
            {['Position', 'Size / NFTs', 'Entry', 'Mark', 'PnL (USDC)', 'Liq. Price', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i > 0 && i < 6 ? 'right' : undefined }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {POSITIONS.map(pos => <PositionRow key={`${pos.pair.base}-${pos.side}`} pos={pos} />)}
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
            {OPEN_ORDERS.map(o => <OpenOrderRow key={o.id} order={o} />)}
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
            {ORDER_HISTORY.map(o => <HistoryRow key={o.id} order={o} />)}
          </div>
        </>
      )}
    </>
  )
}

type MobileTab = 'chart' | 'book' | 'trades' | 'order'

export default function TradePage() {
  const [pair, setPair]               = useState<Pair>(PAIRS[0])
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [clickedPrice, setClickedPrice] = useState<number | undefined>()
  const [mobileTab, setMobileTab]     = useState<MobileTab>('chart')

  const isPerp = pair.type === 'perp'

  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: 'chart',  label: 'Chart' },
    { id: 'book',   label: 'Book' },
    { id: 'trades', label: 'Trades' },
    { id: 'order',  label: 'Order' },
  ]

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - var(--topbar-h))' }}>

      {/* Market header strip */}
      <div
        style={{ height: 66, background: 'var(--surface-1)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}
        className="flex items-center gap-[30px] px-5 overflow-x-auto"
      >
        <button
          onClick={() => setSelectorOpen(true)}
          className="flex items-center gap-3 shrink-0"
          style={{ paddingRight: 26, borderRight: '1px solid var(--border-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            {formatPair(pair)}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
            background: isPerp ? 'rgba(160,81,252,0.18)' : 'rgba(46,189,133,0.18)',
            color: isPerp ? '#A051FC' : '#2EBD85',
            border: `1px solid ${isPerp ? 'rgba(160,81,252,0.4)' : 'rgba(46,189,133,0.4)'}`,
          }}>
            {isPerp ? 'PERP' : 'SPOT'}
          </span>
          {isPerp && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              20x
            </span>
          )}
        </button>

        {isPerp ? (
          <>
            <Stat label="Mark"          value={fmt(pair.lastPrice)} />
            <Stat label="Oracle"        value={fmt(pair.lastPrice * 0.9996)} muted />
            <div className="flex flex-col gap-[3px] shrink-0">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>24h Change</span>
              <PriceDelta value={pair.lastPrice * pair.change24h / 100} pct={pair.change24h} />
            </div>
            <Stat label="24h Volume"    value={`$${fmt(pair.volume24h / 1_000_000, 1)}M`} />
            <Stat label="Open Interest" value="$12.6M" />
            <div className="flex flex-col gap-[3px] shrink-0">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Funding / Countdown</span>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ color: 'var(--up-500)' }}>+0.0125%</span>
                <span style={{ color: 'var(--text-tertiary)' }}> · 04:32</span>
              </span>
            </div>
          </>
        ) : (
          <>
            <Stat label="Last Price" value={fmt(pair.lastPrice)} />
            <div className="flex flex-col gap-[3px] shrink-0">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>24h Change</span>
              <PriceDelta value={pair.lastPrice * pair.change24h / 100} pct={pair.change24h} />
            </div>
            <Stat label="24h High"   value={fmt(pair.high24h)} muted />
            <Stat label="24h Low"    value={fmt(pair.low24h)}  muted />
            <Stat label="24h Volume" value={`$${fmt(pair.volume24h / 1_000_000, 1)}M`} />
          </>
        )}
      </div>

      {/* Desktop 3-column layout */}
      <div className="hidden lg:flex flex-1 min-h-0 gap-3 p-3 overflow-hidden">

        {/* Col A */}
        <div className="flex flex-col gap-3 flex-1 min-h-0 min-w-0">
          <div style={{ height: 466, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <PriceChart pair={pair} />
          </div>
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <PositionsPanel />
          </div>
        </div>

        {/* Col B */}
        <div className="flex flex-col gap-3 min-h-0 shrink-0" style={{ width: 296 }}>
          <div style={{ height: 582, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Order Book</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>NFTs</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <OrderBook onPriceClick={setClickedPrice} />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <RecentTrades />
          </div>
        </div>

        {/* Col C */}
        <div style={{ width: 312, flexShrink: 0, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <OrderEntry isPerp={isPerp} prefillPrice={clickedPrice} pair={pair} />
          </div>
        </div>
      </div>

      {/* Mobile tabbed layout */}
      <div className="flex lg:hidden flex-col flex-1 min-h-0">
        <div className="flex border-b border-[var(--border-subtle)] shrink-0" style={{ background: 'var(--surface-1)' }}>
          {mobileTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className="flex-1 h-10 transition-colors"
              style={{
                fontSize: 13, fontWeight: 700,
                color: mobileTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                borderBottom: mobileTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'none', border: 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobileTab === 'chart'  && <div className="h-full" style={{ background: 'var(--surface-1)' }}><PriceChart pair={pair} /></div>}
          {mobileTab === 'book'   && <OrderBook onPriceClick={p => { setClickedPrice(p); setMobileTab('order') }} />}
          {mobileTab === 'trades' && <RecentTrades />}
          {mobileTab === 'order'  && <div className="overflow-y-auto h-full"><OrderEntry isPerp={isPerp} prefillPrice={clickedPrice} pair={pair} /></div>}
        </div>
      </div>

      {/* Pair selector modal */}
      {selectorOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.72)' }}
          onClick={() => setSelectorOpen(false)}
        >
          <div
            style={{ width: 540, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 10, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Select Market</span>
              <button onClick={() => setSelectorOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Search collections</span>
              </div>
            </div>
            <div style={{ padding: '0 8px 12px', display: 'flex', flexDirection: 'column' }}>
              <SelectorSection label="PERPETUALS" pairs={PAIRS.filter(p => p.type === 'perp')} active={pair} onSelect={p => { setPair(p); setSelectorOpen(false) }} />
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 4px' }} />
              <SelectorSection label="SPOT" pairs={PAIRS.filter(p => p.type === 'spot')} active={pair} onSelect={p => { setPair(p); setSelectorOpen(false) }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
