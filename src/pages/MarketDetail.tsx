import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { marketService } from '../services/marketService'
import { useMarketTicker } from '../hooks/useMarketTicker'
import MarketChartCard from '../components/trading/MarketChartCard'
import OrderBook from '../components/trading/OrderBook'
import type { Market } from '../types'

export default function MarketDetail() {
  const navigate = useNavigate()
  const { marketId = '' } = useParams<{ marketId: string }>()

  const [market, setMarket]     = useState<Market | null>(null)
  const [marketError, setMarketError] = useState(false)
  const { ticker } = useMarketTicker(marketId)

  useEffect(() => {
    if (!marketId) return
    marketService.getMarket(marketId).then(res => {
      if (res.ok) setMarket(res.data)
      else setMarketError(true)
    })
  }, [marketId])

  if (!marketId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No market specified.</span>
      </div>
    )
  }

  if (marketError) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Market unavailable or not found.</span>
        <button onClick={() => navigate('/markets')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Back to Markets</button>
      </div>
    )
  }

  const baseAsset  = market?.baseAsset  ?? marketId.split('-')[0]
  const quoteAsset = market?.quoteAsset ?? 'USDC'

  const priceDisplay  = ticker?.lastPrice  ?? '—'
  const changeDisplay = ticker?.change24hPct ?? ticker?.change24h ?? null
  const changeNum     = changeDisplay ? parseFloat(changeDisplay) : null
  const changeColor   = changeNum == null ? 'var(--text-tertiary)' : changeNum >= 0 ? 'var(--up-500)' : 'var(--down-500)'

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Asset hero */}
      <div style={{ height: 96, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#A051FC,#531C97)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
            {baseAsset.slice(0, 1)}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                {market?.displayName ?? marketId}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--accent-tint)', color: 'var(--accent)', textTransform: 'uppercase' }}>
                {market?.type ?? 'SPOT'}
              </span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              {baseAsset} / {quoteAsset} · central limit order book
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: '#fff' }}>
              {priceDisplay !== '—' ? parseFloat(priceDisplay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—'}
            </span>
            {changeNum != null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: changeColor }}>
                {changeNum >= 0 ? '+' : ''}{changeNum.toFixed(2)}%
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/trade')} style={{ height: 46, padding: '0 20px', borderRadius: 6, fontSize: 14, fontWeight: 900, background: 'var(--buy)', color: '#fff', border: 'none', cursor: 'pointer' }}>Buy</button>
            <button onClick={() => navigate('/trade')} style={{ height: 46, padding: '0 20px', borderRadius: 6, fontSize: 14, fontWeight: 900, background: 'var(--sell)', color: '#fff', border: 'none', cursor: 'pointer' }}>Sell</button>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-base)', overflowX: 'auto' }}>
        {[
          { label: '24h Volume', value: ticker?.volume24h ? `${parseFloat(ticker.volume24h).toLocaleString('en-US', { maximumFractionDigits: 0 })} USDC` : '—' },
          { label: '24h High',   value: ticker?.high24h   ? parseFloat(ticker.high24h).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—' },
          { label: '24h Low',    value: ticker?.low24h    ? parseFloat(ticker.low24h).toLocaleString('en-US',  { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—' },
          { label: '24h Change', value: changeNum != null ? `${changeNum >= 0 ? '+' : ''}${changeNum.toFixed(2)}%` : '—', colored: changeNum != null, up: (changeNum ?? 0) >= 0 },
          { label: 'Tick Size',  value: market?.tickSize ?? '—' },
          { label: 'Min Order',  value: market?.minOrderSize != null ? String(market.minOrderSize) : '—' },
          { label: 'All-Time High', value: '—' },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: '0 0 auto', minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4, padding: i === 0 ? '0 24px 0 0' : '0 24px', borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{s.label}</span>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: s.colored ? (s.up ? 'var(--up-500)' : 'var(--down-500)') : 'var(--text-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 16, padding: '16px 24px 24px', overflow: 'hidden' }}>

        {/* LEFT — chart + about */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MarketChartCard
              marketId={marketId}
              baseAsset={baseAsset}
              quoteAsset={quoteAsset}
              marketType={market?.type === 'perp' ? 'perp' : 'spot'}
              tickerOverride={ticker}
            />
          </div>

          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '20px 22px', display: 'flex', gap: 36 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>About {baseAsset}</span>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {baseAsset} trades against {quoteAsset} on a central limit order book. In Phase 1, matching is handled by the local CLOB engine. Real on-chain settlement will be wired by the protocol team before mainnet.
              </p>
            </div>
            <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 11, paddingLeft: 36, borderLeft: '1px solid var(--border-subtle)' }}>
              {[
                { label: 'Chain',        value: 'Solana' },
                { label: 'Quote asset',  value: quoteAsset },
                { label: 'Tick size',    value: market?.tickSize ?? '—' },
                { label: 'Listed Since', value: 'Phase 1' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE — order book */}
        <div style={{ flex: '0 0 300px', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <OrderBook marketId={marketId} maxRows={10} />
        </div>

        {/* RIGHT — top holders (unavailable until on-chain indexer provides data) */}
        <div style={{ flex: '0 0 320px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Top Holders</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: '0 20px', lineHeight: 1.6 }}>Holder data unavailable. On-chain indexer not configured.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
