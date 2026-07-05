import { RECENT_TRADES } from '../../data/mock'

export default function RecentTrades() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Trades</span>
      </div>

      {/* Column labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.7fr 1fr', padding: '6px 14px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Price</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>NFTs</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>Time</span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {RECENT_TRADES.map(trade => (
          <div
            key={trade.id}
            style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.7fr 1fr', padding: '3px 14px', height: 22, alignItems: 'center' }}
          >
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: trade.side === 'buy' ? 'var(--up-500)' : 'var(--down-500)' }}>
              {trade.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', textAlign: 'right' }}>
              {trade.size}
            </span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-tertiary)', textAlign: 'right' }}>
              {trade.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
