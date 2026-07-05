import React, { useState } from 'react'
import { ASKS, BIDS } from '../../data/mock'
import type { OrderBookLevel } from '../../types'

function formatPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type View = 'both' | 'asks' | 'bids'

function DepthBar({ pct, side }: { pct: number; side: 'ask' | 'bid' }) {
  return (
    <div
      className="absolute top-0 bottom-0 right-0 opacity-20"
      style={{
        width: `${pct}%`,
        background: side === 'ask' ? 'var(--sell)' : 'var(--buy)',
      }}
    />
  )
}

function OrderRow({
  level,
  side,
  maxTotal,
  onClick,
}: {
  level: OrderBookLevel
  side: 'ask' | 'bid'
  maxTotal: number
  onClick: (price: number) => void
}) {
  const pct = (level.total / maxTotal) * 100

  return (
    <button
      onClick={() => onClick(level.price)}
      className="relative w-full flex items-center px-3 h-[22px] hover:bg-[var(--surface-raised)] transition-colors group"
    >
      <DepthBar pct={pct} side={side} />
      <span
        className={`flex-1 text-left text-xs nums mono font-bold z-10
          ${side === 'ask' ? 'text-[var(--sell)]' : 'text-[var(--buy)]'}`}
      >
        {formatPrice(level.price)}
      </span>
      <span className="w-12 text-right text-xs nums text-[var(--text-primary)] z-10">{level.size}</span>
      <span className="w-14 text-right text-xs nums text-[var(--text-tertiary)] z-10">{level.total}</span>
    </button>
  )
}

interface OrderBookProps {
  onPriceClick?: (price: number) => void
  maxRows?: number
}

export default function OrderBook({ onPriceClick, maxRows = 8 }: OrderBookProps) {
  const [view, setView] = useState<View>('both')

  const asks = ASKS.slice(0, maxRows)
  const bids = BIDS.slice(0, maxRows)
  const maxAsk = Math.max(...asks.map(a => a.total), 1)
  const maxBid = Math.max(...bids.map(b => b.total), 1)

  const spread = ASKS[ASKS.length - 1]?.price - BIDS[0]?.price
  const spreadPct = ((spread / BIDS[0]?.price) * 100).toFixed(3)

  const ViewBtn = ({ v, label }: { v: View; label: React.ReactNode }) => (
    <button
      onClick={() => setView(v)}
      title={String(label)}
      className={[
        'h-6 w-8 flex items-center justify-center rounded text-xs transition-colors',
        view === v ? 'bg-[var(--surface-raised)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Order Book</span>
        <div className="flex items-center gap-0.5">
          <ViewBtn v="both" label={
            <div className="flex flex-col gap-0.5">
              <div className="w-4 h-0.5 bg-[var(--sell)] rounded-full" />
              <div className="w-4 h-0.5 bg-[var(--buy)] rounded-full" />
            </div>
          } />
          <ViewBtn v="asks" label={<div className="w-4 h-1 bg-[var(--sell)] rounded-full" />} />
          <ViewBtn v="bids" label={<div className="w-4 h-1 bg-[var(--buy)] rounded-full" />} />
        </div>
      </div>

      {/* Column labels */}
      <div className="flex items-center px-3 py-1 border-b border-[var(--border-subtle)] shrink-0">
        <span className="flex-1 text-2xs uppercase tracking-widest text-[var(--text-tertiary)]">Price (USDC)</span>
        <span className="w-12 text-right text-2xs uppercase tracking-widest text-[var(--text-tertiary)]">Size</span>
        <span className="w-14 text-right text-2xs uppercase tracking-widest text-[var(--text-tertiary)]">Total</span>
      </div>

      {/* Asks (reversed — highest at top, lowest near spread) */}
      {view !== 'bids' && (
        <div className="flex flex-col-reverse overflow-hidden">
          {asks.map((level, i) => (
            <OrderRow key={i} level={level} side="ask" maxTotal={maxAsk} onClick={p => onPriceClick?.(p)} />
          ))}
        </div>
      )}

      {/* Spread */}
      <div className="flex items-center justify-between px-3 py-1 border-y border-[var(--border-subtle)] shrink-0 bg-[var(--surface-2)]">
        <span className="text-xs font-bold nums text-[var(--text-primary)]">{formatPrice(BIDS[0]?.price)}</span>
        <span className="text-2xs text-[var(--text-tertiary)] nums">Spread {spreadPct}%</span>
      </div>

      {/* Bids */}
      {view !== 'asks' && (
        <div className="flex flex-col overflow-hidden">
          {bids.map((level, i) => (
            <OrderRow key={i} level={level} side="bid" maxTotal={maxBid} onClick={p => onPriceClick?.(p)} />
          ))}
        </div>
      )}
    </div>
  )
}
