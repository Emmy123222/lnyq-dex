import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { marketService } from '../services/marketService'
import { FLAGS } from '../config/featureFlags'
import type { Pair } from '../types'

type MarketPair = Pair & { marketId: string }

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const EXPLORE_SWATCHES = [
  'linear-gradient(135deg,#A051FC,#531C97)',
  'linear-gradient(135deg,#6b3fa0,#34205c)',
  'linear-gradient(135deg,#3A8DFF,#1456b0)',
  'linear-gradient(135deg,#2EBD85,#1a7a55)',
]

function CollectionCard({ pair, swatch, onTrade, onDetail }: { pair: MarketPair; swatch: string; onTrade: () => void; onDetail: () => void }) {
  return (
    <div
      onClick={onDetail}
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'border-color 150ms' }}
      className="hover:border-[var(--border-strong)]"
    >
      <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ width: 44, height: 44, borderRadius: 11, background: swatch, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
            {pair.base.slice(0, 1)}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pair.base}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{pair.base}/{pair.quote}</span>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: pair.type === 'perp' ? 'rgba(160,81,252,0.14)' : 'rgba(46,189,133,0.14)', color: pair.type === 'perp' ? '#A051FC' : '#2EBD85', flexShrink: 0 }}>
          {pair.type === 'perp' ? 'PERP' : 'SPOT'}
        </span>
      </div>
      <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Last Price</span>
            <span style={{ fontSize: 19, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{pair.lastPrice > 0 ? fmt(pair.lastPrice) : '—'}</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: pair.change24h > 0 ? 'var(--up-500)' : pair.change24h < 0 ? 'var(--down-500)' : 'var(--text-tertiary)' }}>
            {pair.lastPrice > 0 ? `${pair.change24h >= 0 ? '+' : ''}${pair.change24h.toFixed(2)}%` : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>24h Vol</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>{pair.volume24h > 0 ? `$${(pair.volume24h / 1_000_000).toFixed(1)}M` : '—'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Supply</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>—</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onTrade() }}
            style={{ height: 30, padding: '0 12px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Trade
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MarketDetails() {
  const navigate = useNavigate()
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<'All' | 'Perps' | 'Spot'>('All')
  const [view,    setView]    = useState<'table' | 'grid'>('table')
  const [pairs,   setPairs]   = useState<MarketPair[]>([])

  useEffect(() => {
    let cancelled = false
    marketService.listAllMarkets().then(async res => {
      if (cancelled || !res.ok) return
      const built: MarketPair[] = await Promise.all(res.data.map(async m => {
        const ticker = await marketService.getTicker(m.id)
        const lastPrice  = ticker.ok ? parseFloat(ticker.data.lastPrice)  : 0
        const change24h  = ticker.ok ? parseFloat(ticker.data.change24h)  : 0
        const volume24h  = ticker.ok ? parseFloat(ticker.data.volume24h)  : 0
        const high24h    = ticker.ok ? parseFloat(ticker.data.high24h)    : 0
        const low24h     = ticker.ok ? parseFloat(ticker.data.low24h)     : 0
        return { marketId: m.id, base: m.baseAsset, quote: m.quoteAsset, type: m.type, lastPrice, change24h, volume24h, high24h, low24h }
      }))
      if (!cancelled) setPairs(built)
    })
    return () => { cancelled = true }
  }, [])

  // Phase 1: only show spot markets unless perps are enabled
  const visiblePairs = FLAGS.PERPS ? pairs : pairs.filter(p => p.type === 'spot')

  const filtered = visiblePairs.filter(p => {
    const matchFilter = filter === 'All' || (filter === 'Perps' && p.type === 'perp') || (filter === 'Spot' && p.type === 'spot')
    const matchSearch = search === '' || p.base.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div style={{ padding: '26px 24px 32px', overflowY: 'auto', minHeight: 0 }}>
      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', marginBottom: 6 }}>Markets</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Phase 1 spot markets. Trade collection tokens on the local CLOB simulation.</div>
        </div>
        <div style={{ display: 'flex', gap: 34 }}>
          {[
            { label: '24h Volume',    value: visiblePairs.length > 0 ? `$${(visiblePairs.reduce((s, p) => s + p.volume24h, 0) / 1_000_000).toFixed(1)}M` : '—' },
            { label: 'Markets',       value: visiblePairs.length > 0 ? String(visiblePairs.length) : '—' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.label}</span>
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + Search + View toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 3 }}>
          {(['All', 'Spot', ...(FLAGS.PERPS ? ['Perps'] as const : [])] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              style={{ padding: '5px 14px', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: filter === f ? 'var(--accent)' : 'transparent', color: filter === f ? '#fff' : 'var(--text-tertiary)', border: 'none' }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, maxWidth: 360, flex: 1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search collections or tickers"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }}
          />
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 3, marginLeft: 'auto' }}>
          <button
            onClick={() => setView('table')}
            style={{ width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: view === 'table' ? 'var(--accent)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={view === 'table' ? '#fff' : 'var(--text-tertiary)'} strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button
            onClick={() => setView('grid')}
            style={{ width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: view === 'grid' ? 'var(--accent)' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={view === 'grid' ? '#fff' : 'var(--text-tertiary)'} strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
        </div>

        {/* List Market — available in Phase 3 */}
        {FLAGS.PRESALE && (
          <button
            onClick={() => navigate('/markets/new')}
            style={{ height: 38, padding: '0 14px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            + List Market
          </button>
        )}
      </div>

      {view === 'table' ? (
        /* TABLE VIEW */
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 0.8fr', padding: '11px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
            {['Market', 'Last Price', '24h Change', '24h High', '24h Low', '24h Volume', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i >= 1 && i <= 5 ? 'right' : undefined }}>{h}</span>
            ))}
          </div>
          {filtered.map(pair => (
            <MarketRow
              key={`${pair.base}-${pair.type}`}
              pair={pair}
              onTrade={() => navigate('/trade')}
              onDetail={() => navigate(`/markets/${pair.marketId}`)}
            />
          ))}
        </div>
      ) : (
        /* GRID VIEW — Frame 17 Explore */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filtered.map((pair, i) => (
            <CollectionCard
              key={`${pair.base}-${pair.type}`}
              pair={pair}
              swatch={EXPLORE_SWATCHES[i % EXPLORE_SWATCHES.length]}
              onTrade={() => navigate('/trade')}
              onDetail={() => navigate(`/markets/${pair.marketId}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MarketRow({ pair, onTrade, onDetail }: { pair: MarketPair; onTrade: () => void; onDetail: () => void }) {
  const label = pair.type === 'spot' ? `${pair.base} / ${pair.quote}` : `${pair.base} - ${pair.quote}`
  return (
    <div
      onClick={onDetail}
      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 0.8fr', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', cursor: 'pointer' }}
      className="hover:bg-[var(--surface-raised)] transition-colors"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#A051FC,#531C97)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
          {pair.base.slice(0, 2)}
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: pair.type === 'perp' ? 'rgba(160,81,252,0.14)' : 'rgba(46,189,133,0.14)', color: pair.type === 'perp' ? '#A051FC' : '#2EBD85', border: `1px solid ${pair.type === 'perp' ? 'rgba(160,81,252,0.3)' : 'rgba(46,189,133,0.3)'}` }}>
              {pair.type === 'perp' ? 'PERP' : 'SPOT'}
            </span>
          </div>
        </div>
      </div>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pair.lastPrice > 0 ? fmt(pair.lastPrice) : '—'}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: pair.change24h > 0 ? 'var(--up-500)' : pair.change24h < 0 ? 'var(--down-500)' : 'var(--text-tertiary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {pair.lastPrice > 0 ? `${pair.change24h >= 0 ? '+' : ''}${pair.change24h.toFixed(2)}%` : '—'}
      </span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pair.high24h > 0 ? fmt(pair.high24h) : '—'}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pair.low24h > 0 ? fmt(pair.low24h) : '—'}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {pair.volume24h > 0 ? `$${(pair.volume24h / 1_000_000).toFixed(1)}M` : '—'}
      </span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={e => { e.stopPropagation(); onTrade() }}
          style={{ height: 28, padding: '0 12px', background: 'var(--accent)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Trade
        </button>
      </div>
    </div>
  )
}
