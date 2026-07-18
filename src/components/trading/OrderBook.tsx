/**
 * OrderBook — industry-standard layout.
 *
 * Columns: Price | Size | Value (USDC) | Cumulative
 * Extras : mid-price spread row, last-trade + arrow, depth bars (shared max),
 *          row flash on size change, price grouping selector, view toggle.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { orderBookService, type BookStatus } from '../../services/orderBookService'
import type { OrderBook as OrderBookData, PriceLevel } from '../../types'

// ── Constants / types ─────────────────────────────────────────────────────────

const GROUPINGS = [0.01, 0.1, 1, 10] as const
type Grouping  = typeof GROUPINGS[number]
type View      = 'both' | 'asks' | 'bids'
type FlashDir  = 'up' | 'down'

// ── Price-level grouping ───────────────────────────────────────────────────────

function groupLevels(raw: PriceLevel[], g: number, side: 'ask' | 'bid'): PriceLevel[] {
  const map = new Map<number, number>()
  for (const lvl of raw) {
    const p      = parseFloat(lvl.price)
    const sz     = parseInt(lvl.size)
    const bucket = side === 'ask'
      ? Math.ceil(p / g) * g
      : Math.floor(p / g) * g
    map.set(bucket, (map.get(bucket) ?? 0) + sz)
  }
  const sorted = [...map.entries()].sort((a, b) =>
    side === 'ask' ? a[0] - b[0] : b[0] - a[0],
  )
  let cum = 0
  return sorted.map(([price, size]) => {
    cum += size
    return { price: price.toFixed(2), size: String(size), total: String(cum) }
  })
}

function fmt2(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Depth bar ─────────────────────────────────────────────────────────────────

function DepthBar({ pct, side }: { pct: number; side: 'ask' | 'bid' }) {
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: `${pct}%`,
      background: side === 'ask' ? 'rgba(246,70,93,0.14)' : 'rgba(46,189,133,0.14)',
      pointerEvents: 'none',
      transition: 'width 200ms ease',
    }} />
  )
}

// ── Price level row ───────────────────────────────────────────────────────────

interface RowProps {
  level:    PriceLevel
  side:     'ask' | 'bid'
  maxDepth: number
  flash:    FlashDir | undefined
  onClick:  (price: number) => void
}

function LevelRow({ level, side, maxDepth, flash, onClick }: RowProps) {
  const price    = parseFloat(level.price)
  const size     = parseInt(level.size)
  const total    = parseInt(level.total)
  const notional = price * size
  const depthPct = Math.min(100, (total / maxDepth) * 100)

  const flashBg = flash === 'up'
    ? 'rgba(46,189,133,0.18)'
    : flash === 'down'
    ? 'rgba(246,70,93,0.18)'
    : undefined

  return (
    <button
      onClick={() => onClick(price)}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 52px 60px 52px',
        alignItems: 'center',
        width: '100%', height: 22,
        padding: '0 10px',
        background: flashBg,
        border: 'none', cursor: 'pointer',
        transition: 'background 350ms ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-raised)' }}
      onMouseLeave={e => { e.currentTarget.style.background = flashBg ?? '' }}
    >
      <DepthBar pct={depthPct} side={side} />

      {/* Price */}
      <span style={{
        position: 'relative', fontSize: 11, fontWeight: 700, textAlign: 'left',
        fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
        color: side === 'ask' ? 'var(--down-500)' : 'var(--up-500)',
      }}>
        {fmt2(price)}
      </span>

      {/* Size */}
      <span style={{
        position: 'relative', fontSize: 11, textAlign: 'right',
        fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
        color: 'var(--text-primary)',
      }}>
        {size}
      </span>

      {/* USDC notional */}
      <span style={{
        position: 'relative', fontSize: 11, textAlign: 'right',
        fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
        color: 'var(--text-secondary)',
      }}>
        {notional >= 1000 ? `${(notional / 1000).toFixed(1)}K` : fmt2(notional)}
      </span>

      {/* Cumulative */}
      <span style={{
        position: 'relative', fontSize: 11, textAlign: 'right',
        fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
        color: 'var(--text-tertiary)',
      }}>
        {total}
      </span>
    </button>
  )
}

// ── Connection status pill ────────────────────────────────────────────────────

const STATUS_LABEL: Record<BookStatus, string> = {
  live:         'Live',
  delayed:      'Delayed',
  reconnecting: 'Reconnecting',
  unavailable:  'Unavailable',
}

const STATUS_COLOR: Record<BookStatus, string> = {
  live:         'var(--up-500)',
  delayed:      '#F0A500',
  reconnecting: '#F0A500',
  unavailable:  'var(--down-500)',
}

function BookStatusPill({ status }: { status: BookStatus }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: STATUS_COLOR[status],
        flexShrink: 0,
        animation: status === 'live' ? 'obPulse 2s infinite' : 'none',
      }} />
      <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLOR[status], letterSpacing: '0.04em' }}>
        {STATUS_LABEL[status]}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface OrderBookProps {
  marketId?:     string
  onPriceClick?: (price: number) => void
  maxRows?:      number
}

export default function OrderBook({
  marketId,
  onPriceClick,
  maxRows = 12,
}: OrderBookProps) {
  const [book,       setBook]      = useState<OrderBookData | null>(null)
  const [loading,    setLoading]   = useState(true)
  const [loadError,  setLoadError] = useState(false)
  const [retryKey,   setRetryKey]  = useState(0)
  const [view,       setView]      = useState<View>('both')
  const [grouping,   setGrouping]  = useState<Grouping>(0.01)
  const [lastTrade,  setLastTrade] = useState<{ price: number; dir: 'up' | 'down' | 'same' } | null>(null)
  const [flashes,    setFlashes]   = useState<Map<string, FlashDir>>(new Map())
  const [bookStatus, setBookStatus] = useState<BookStatus>('reconnecting')
  const [stale,      setStale]     = useState(false)

  // Track previous grouped sizes to compute per-bucket flash direction
  const prevGrouped   = useRef<Map<string, number>>(new Map())
  const lastUpdateRef = useRef<number>(0)

  const triggerFlash = useCallback((key: string, dir: FlashDir) => {
    setFlashes(prev => new Map(prev).set(key, dir))
    setTimeout(() => {
      setFlashes(prev => {
        const next = new Map(prev)
        next.delete(key)
        return next
      })
    }, 400)
  }, [])

  // Book subscription
  useEffect(() => {
    if (!marketId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setLoadError(false)

    // 10s hard timeout — if no snapshot arrives, exit loading with error
    const loadTimeout = setTimeout(() => {
      if (!cancelled) { setLoading(false); setLoadError(true) }
    }, 10_000)

    orderBookService.getOrderBook(marketId).then(res => {
      if (!cancelled) {
        clearTimeout(loadTimeout)
        if (res.ok) { setBook(res.data); setLoadError(false) }
        else setLoadError(true)
        setLoading(false)
      }
    })

    const unsubBook = orderBookService.subscribe(
      marketId,
      updated => {
        if (!cancelled) {
          setBook(updated)
          setLoadError(false)
          lastUpdateRef.current = Date.now()
          setStale(false)
        }
      },
      status => {
        if (!cancelled) {
          setBookStatus(status)
          if (status === 'unavailable') setLoadError(true)
        }
      },
    )

    return () => { cancelled = true; clearTimeout(loadTimeout); unsubBook() }
  }, [marketId, retryKey])

  // Stale data detection — warn after 15s without an update (skip for polling mode)
  useEffect(() => {
    if (!marketId || bookStatus === 'delayed') return
    const id = setInterval(() => {
      if (lastUpdateRef.current > 0 && Date.now() - lastUpdateRef.current > 15_000) {
        setStale(true)
      }
    }, 5_000)
    return () => clearInterval(id)
  }, [marketId, bookStatus])

  // Trade price tracking
  useEffect(() => {
    if (!marketId) return
    let cancelled = false

    orderBookService.getRecentTrades(marketId, 1).then(res => {
      if (!cancelled && res.ok && res.data[0]) {
        setLastTrade({ price: parseFloat(res.data[0].price), dir: 'same' })
      }
    })

    const unsubTrades = orderBookService.subscribeTrades(marketId, trade => {
      if (!cancelled) {
        setLastTrade(prev => ({
          price: parseFloat(trade.price),
          dir:   prev === null ? 'same'
               : parseFloat(trade.price) > prev.price ? 'up'
               : parseFloat(trade.price) < prev.price ? 'down'
               : 'same',
        }))
      }
    })

    return () => { cancelled = true; unsubTrades() }
  }, [marketId])

  // Flash detection — grouping-aware, runs whenever book or grouping changes
  useEffect(() => {
    if (!book) return
    const all = [
      ...groupLevels(book.asks, grouping, 'ask'),
      ...groupLevels(book.bids, grouping, 'bid'),
    ]
    for (const lvl of all) {
      const newSz = parseInt(lvl.size)
      const oldSz = prevGrouped.current.get(lvl.price)
      if (oldSz !== undefined && oldSz !== newSz) {
        triggerFlash(lvl.price, newSz > oldSz ? 'up' : 'down')
      }
      prevGrouped.current.set(lvl.price, newSz)
    }
  }, [book, grouping, triggerFlash])

  // ── Derived ─────────────────────────────────────────────────────────────────

  if (!marketId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No market selected</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Loading order book…</span>
      </div>
    )
  }

  if (loadError || !book) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, height: '100%' }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Order book unavailable</span>
        <button
          onClick={() => setRetryKey(k => k + 1)}
          style={{ height: 30, padding: '0 14px', fontSize: 12, fontWeight: 700, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    )
  }

  const asks      = groupLevels(book.asks, grouping, 'ask').slice(0, maxRows)
  const bids      = groupLevels(book.bids, grouping, 'bid').slice(0, maxRows)
  const maxAskCum = asks.length ? parseInt(asks[asks.length - 1].total) : 1
  const maxBidCum = bids.length ? parseInt(bids[bids.length - 1].total) : 1
  const sharedMax = Math.max(maxAskCum, maxBidCum, 1)
  const midpoint  = parseFloat(book.midpoint || '0')
  const spread    = parseFloat(book.spread || '0')

  const handleClick = (price: number) => onPriceClick?.(price)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', userSelect: 'none' }}>
      <style>{`@keyframes obPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* ── Stale data warning ── */}
      {stale && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', flexShrink: 0,
          background: 'rgba(240,185,11,0.10)',
          borderBottom: '1px solid rgba(240,185,11,0.25)',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F0B90B" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#F0B90B' }}>
            Data may be stale — no update received in 15s
          </span>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {([
            ['both', <BothIcon key="both" />],
            ['asks', <AsksIcon key="asks" />],
            ['bids', <BidsIcon key="bids" />],
          ] as [View, React.ReactNode][]).map(([v, icon]) => (
            <button key={v} onClick={() => setView(v)} style={{
              width: 26, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: view === v ? 'var(--surface-raised)' : 'transparent',
              color: view === v ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}>
              {icon}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookStatusPill status={bookStatus} />
          <select
            value={grouping}
            onChange={e => {
              prevGrouped.current.clear()
              setGrouping(Number(e.target.value) as Grouping)
            }}
            style={{
              fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
              background: 'var(--surface-2)', color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)', borderRadius: 4,
              padding: '2px 4px', cursor: 'pointer', outline: 'none',
            }}
          >
            {GROUPINGS.map(g => (
              <option key={g} value={g}>{g.toFixed(2)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Column headers ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 52px 60px 52px',
        padding: '4px 10px', flexShrink: 0,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {(['Price (USDC)', 'Size', 'Value', 'Total'] as const).map((h, i) => (
          <span key={h} style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
            color: 'var(--text-tertiary)',
            textAlign: i === 0 ? 'left' : 'right',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* ── Asks (lowest ask nearest spread — flex-col-reverse) ── */}
      {view !== 'bids' && (
        <div style={{
          display: 'flex', flexDirection: 'column-reverse',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {asks.map(level => (
            <LevelRow
              key={level.price}
              level={level}
              side="ask"
              maxDepth={sharedMax}
              flash={flashes.get(level.price)}
              onClick={handleClick}
            />
          ))}
        </div>
      )}

      {/* ── Spread / last-trade row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 10px', flexShrink: 0,
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--surface-2)',
      }}>
        {/* Last trade price + direction arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 80 }}>
          {lastTrade ? (
            <>
              <span style={{
                fontSize: 12, fontWeight: 800,
                fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
                color: lastTrade.dir === 'up'   ? 'var(--up-500)'
                     : lastTrade.dir === 'down' ? 'var(--down-500)'
                     : 'var(--text-primary)',
              }}>
                {fmt2(lastTrade.price)}
              </span>
              {lastTrade.dir === 'up'   && <span style={{ fontSize: 9, color: 'var(--up-500)' }}>▲</span>}
              {lastTrade.dir === 'down' && <span style={{ fontSize: 9, color: 'var(--down-500)' }}>▼</span>}
            </>
          ) : (
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>—</span>
          )}
        </div>

        {/* Mid-price */}
        {midpoint > 0 && (
          <span style={{
            fontSize: 10, color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
          }}>
            Mid {fmt2(midpoint)}
          </span>
        )}

        {/* Spread $ + % */}
        <span style={{
          fontSize: 10, color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)', textAlign: 'right',
        }}>
          {spread > 0 ? `${fmt2(spread)} (${book.spreadPct}%)` : '—'}
        </span>
      </div>

      {/* ── Bids ── */}
      {view !== 'asks' && (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
          {bids.map(level => (
            <LevelRow
              key={level.price}
              level={level}
              side="bid"
              maxDepth={sharedMax}
              flash={flashes.get(level.price)}
              onClick={handleClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── View toggle icons ─────────────────────────────────────────────────────────

function BothIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      <rect x="0" y="0"  width="14" height="1.5" rx="0.5" fill="var(--down-500)" opacity="0.85"/>
      <rect x="0" y="3"  width="14" height="1.5" rx="0.5" fill="var(--down-500)" opacity="0.45"/>
      <rect x="0" y="7"  width="14" height="1.5" rx="0.5" fill="var(--up-500)"   opacity="0.45"/>
      <rect x="0" y="10" width="14" height="1.5" rx="0.5" fill="var(--up-500)"   opacity="0.85"/>
    </svg>
  )
}

function AsksIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      <rect x="0" y="0" width="14" height="1.5" rx="0.5" fill="var(--down-500)" opacity="0.85"/>
      <rect x="0" y="3" width="14" height="1.5" rx="0.5" fill="var(--down-500)" opacity="0.55"/>
      <rect x="0" y="6" width="14" height="1.5" rx="0.5" fill="var(--down-500)" opacity="0.30"/>
      <rect x="0" y="9" width="14" height="1.5" rx="0.5" fill="var(--down-500)" opacity="0.12"/>
    </svg>
  )
}

function BidsIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      <rect x="0" y="0" width="14" height="1.5" rx="0.5" fill="var(--up-500)" opacity="0.12"/>
      <rect x="0" y="3" width="14" height="1.5" rx="0.5" fill="var(--up-500)" opacity="0.30"/>
      <rect x="0" y="6" width="14" height="1.5" rx="0.5" fill="var(--up-500)" opacity="0.55"/>
      <rect x="0" y="9" width="14" height="1.5" rx="0.5" fill="var(--up-500)" opacity="0.85"/>
    </svg>
  )
}

