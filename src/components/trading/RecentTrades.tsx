import { useState, useEffect } from 'react'
import { orderBookService } from '../../services/orderBookService'
import type { PublicTrade } from '../../types'

interface RecentTradesProps {
  marketId?: string
  baseSymbol?: string
}

export default function RecentTrades({ marketId, baseSymbol = 'Size' }: RecentTradesProps) {
  const [trades,  setTrades]  = useState<PublicTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  const load = () => {
    if (!marketId) { setLoading(false); return }
    setLoading(true)
    setError(false)
    orderBookService.getRecentTrades(marketId).then(res => {
      if (res.ok) setTrades(res.data)
      else setError(true)
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [marketId]) // eslint-disable-line

  useEffect(() => {
    if (!marketId) return
    return orderBookService.subscribeTrades(marketId, trade => {
      setTrades(prev => [trade, ...prev].slice(0, 50))
    })
  }, [marketId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Trades</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.7fr 1fr', padding: '6px 14px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Price</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>{baseSymbol}</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>Time</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {!marketId && (
          <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text-tertiary)' }}>No market selected</div>
        )}
        {marketId && loading && (
          <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text-tertiary)' }}>Loading…</div>
        )}
        {marketId && !loading && error && (
          <div style={{ padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Trades unavailable</span>
            <button onClick={load} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Retry</button>
          </div>
        )}
        {marketId && !loading && !error && trades.length === 0 && (
          <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text-tertiary)' }}>No trades yet</div>
        )}
        {!loading && !error && trades.map(trade => (
          <div
            key={trade.id}
            style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.7fr 1fr', padding: '3px 14px', height: 22, alignItems: 'center' }}
          >
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: trade.side === 'buy' ? 'var(--up-500)' : 'var(--down-500)' }}>
              {parseFloat(trade.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', textAlign: 'right' }}>
              {trade.quantity}
            </span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-tertiary)', textAlign: 'right' }}>
              {trade.tradedAt}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
