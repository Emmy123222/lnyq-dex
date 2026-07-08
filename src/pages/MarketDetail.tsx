import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { chartService } from '../services/chartService'
import { orderBookService } from '../services/orderBookService'
import type { Candle, OrderBook } from '../types'

const TIMEFRAMES = ['1H', '1D', '1W', '1M', 'All']
const TF_INTERVAL: Record<string, '1h' | '1D' | '1D' | '1D' | '1D'> = {
  '1H': '1h', '1D': '1D', '1W': '1D', '1M': '1D', 'All': '1D',
}

const TOP_HOLDERS = [
  { initials: 'AP', name: 'alpha_prime',   nfts: '842',  pct: '12.5%', swatch: 'linear-gradient(135deg,#A051FC,#531C97)' },
  { initials: 'BD', name: 'bookdepth',     nfts: '614',  pct: '9.1%',  swatch: 'linear-gradient(135deg,#3A8DFF,#1456b0)' },
  { initials: 'NM', name: 'nft_macro',     nfts: '521',  pct: '7.7%',  swatch: 'linear-gradient(135deg,#2EBD85,#1a7a55)' },
  { initials: 'CH', name: 'clob_hunter',   nfts: '388',  pct: '5.8%',  swatch: 'linear-gradient(135deg,#F0A500,#8a5e00)' },
  { initials: 'SS', name: 'spreadseller',  nfts: '312',  pct: '4.6%',  swatch: 'linear-gradient(135deg,#F6465D,#8a1a2a)' },
  { initials: 'O9', name: 'orderflow9',    nfts: '289',  pct: '4.3%',  swatch: 'linear-gradient(135deg,#6b3fa0,#34205c)' },
]

const STATS = [
  { label: '24h Volume',    value: '—' },
  { label: 'Market Cap',    value: '—' },
  { label: 'Open Interest', value: '—' },
  { label: 'Funding',       value: '—', green: true },
  { label: 'Holders',       value: '3,184' },
  { label: 'Supply',        value: '6,742' },
  { label: 'All-Time High', value: '—' },
]

function formatPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function MiniChart({ candles }: { candles: Candle[] }) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || candles.length === 0) return
    const { width, height } = container.getBoundingClientRect()
    if (!width || !height) return
    canvas.width  = width  * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width  = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')!
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.clearRect(0, 0, width, height)
    const slice  = candles.slice(-60)
    const prices = slice.flatMap(c => [c.high, c.low])
    const minP = Math.min(...prices) * 0.998
    const maxP = Math.max(...prices) * 1.002
    const range = maxP - minP
    const pad   = { top: 8, bottom: 4, left: 4, right: 44 }
    const cW    = width  - pad.left - pad.right
    const cH    = height - pad.top  - pad.bottom
    const bW    = Math.max(2, (cW / slice.length) - 1.5)
    const toY   = (p: number) => pad.top  + ((maxP - p) / range) * cH
    const toX   = (i: number) => pad.left + i * (cW / slice.length) + (cW / slice.length) / 2

    ctx.setLineDash([2, 4])
    for (let i = 0; i <= 4; i++) {
      const p = minP + (range / 4) * i
      const y = toY(p)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke()
      ctx.fillStyle = '#6B6B78'; ctx.font = '10px IBM Plex Mono,monospace'
      ctx.textAlign = 'right'; ctx.fillText(formatPrice(p), width - 2, y + 3)
    }
    ctx.setLineDash([])
    slice.forEach((c, i) => {
      const x = toX(i); const isUp = c.close >= c.open; const color = isUp ? '#2EBD85' : '#F6465D'
      const bodyTop = toY(Math.max(c.open, c.close)); const bodyBot = toY(Math.min(c.open, c.close))
      const bodyH = Math.max(1, bodyBot - bodyTop)
      ctx.strokeStyle = color; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x, toY(c.high)); ctx.lineTo(x, toY(c.low)); ctx.stroke()
      ctx.fillStyle = color; ctx.fillRect(x - bW / 2, bodyTop, bW, bodyH)
    })
  }, [candles])

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
      {candles.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Loading chart…</span>
        </div>
      )}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  )
}

const MARKET_ID = 'LNYQNFT-USDC-SPOT'

export default function MarketDetail() {
  const navigate = useNavigate()
  const [tf, setTf]         = useState('1D')
  const [candles, setCandles] = useState<Candle[]>([])
  const [book, setBook]       = useState<OrderBook | null>(null)

  useEffect(() => {
    let cancelled = false
    const interval = (TF_INTERVAL[tf] ?? '1D') as '1m' | '5m' | '15m' | '1h' | '4h' | '1D'
    chartService.getCandles(MARKET_ID, interval, 60).then(res => {
      if (!cancelled && res.ok) setCandles(res.data)
    })
    return () => { cancelled = true }
  }, [tf])

  useEffect(() => {
    orderBookService.getOrderBook(MARKET_ID).then(res => {
      if (res.ok) setBook(res.data)
    })
    return orderBookService.subscribe(MARKET_ID, b => setBook(b))
  }, [])

  const last = candles[candles.length - 1]
  const asks = book?.asks.slice(0, 8) ?? []
  const bids = book?.bids.slice(0, 8) ?? []
  const maxSz = Math.max(
    ...asks.map(l => parseInt(l.size)),
    ...bids.map(l => parseInt(l.size)),
    1,
  )

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Asset hero */}
      <div style={{ height: 96, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#A051FC,#531C97)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', flexShrink: 0 }}>L</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>LNYQNFT/USDC</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--accent-tint)', color: 'var(--accent)' }}>SPOT</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>HIP-3</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>LNYQ Genesis · 6,742 NFTs traded as a fungible book · verified collection</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: '#fff' }}>
              {last ? formatPrice(last.close) : '—'}
            </span>
            {book && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--up-500)' }}>Spread: {book.spread}</span>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/trade')} style={{ height: 46, padding: '0 20px', borderRadius: 6, fontSize: 14, fontWeight: 900, background: 'var(--buy)', color: '#fff', border: 'none', cursor: 'pointer' }}>Buy</button>
            <button onClick={() => navigate('/trade')} style={{ height: 46, padding: '0 20px', borderRadius: 6, fontSize: 14, fontWeight: 900, background: 'var(--sell)', color: '#fff', border: 'none', cursor: 'pointer' }}>Sell</button>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: i === 0 ? '0 24px 0 0' : '0 24px', borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{s.label}</span>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: s.green ? 'var(--up-500)' : 'var(--text-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 16, padding: '16px 24px 24px', overflow: 'hidden' }}>

        {/* LEFT — chart + about */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Price</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>USDC per NFT</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 3 }}>
                {TIMEFRAMES.map(t => (
                  <button key={t} onClick={() => setTf(t)} style={{ padding: '4px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: tf === t ? 'var(--accent)' : 'transparent', color: tf === t ? '#fff' : 'var(--text-tertiary)', border: 'none', transition: 'all 100ms' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 16px 0' }}>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{last ? formatPrice(last.close) : '—'}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>USDC per NFT</span>
            </div>
            <MiniChart candles={candles} />
          </div>

          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '20px 22px', display: 'flex', gap: 36 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>About LNYQNFT</span>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                LNYQ Genesis is a 6,742-piece collection made fungible by the LNYQ order book. Every NFT trades against a deep central limit order book — spot for instant settlement. Floor price discovery is continuous.
              </p>
            </div>
            <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 11, paddingLeft: 36, borderLeft: '1px solid var(--border-subtle)' }}>
              {[
                { label: 'Chain',        value: 'Solana Devnet' },
                { label: 'Royalty',      value: '2.5%' },
                { label: 'Supply',       value: '6,742' },
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
        <div style={{ flex: '0 0 300px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Order Book</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>NFTs</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
            {['Price', 'NFTs', 'Total'].map((h, i) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {!book && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>Loading…</div>}
            {asks.slice().reverse().map((a, i) => (
              <div key={i} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '4px 14px', alignItems: 'center' }}>
                <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, background: 'rgba(246,70,93,0.08)', width: `${(parseInt(a.size) / maxSz) * 100}%` }} />
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--down-500)', position: 'relative' }}>{parseFloat(a.price).toFixed(2)}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', textAlign: 'right', position: 'relative' }}>{a.size}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-tertiary)', textAlign: 'right', position: 'relative' }}>{a.total}</span>
              </div>
            ))}
            {book && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '6px 14px', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>Spread</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>{book.spread}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{book.spreadPct}%</span>
              </div>
            )}
            {bids.map((b, i) => (
              <div key={i} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '4px 14px', alignItems: 'center' }}>
                <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, background: 'rgba(46,189,133,0.08)', width: `${(parseInt(b.size) / maxSz) * 100}%` }} />
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)', position: 'relative' }}>{parseFloat(b.price).toFixed(2)}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', textAlign: 'right', position: 'relative' }}>{b.size}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-tertiary)', textAlign: 'right', position: 'relative' }}>{b.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — top holders */}
        <div style={{ flex: '0 0 320px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Top Holders</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>of 3,184</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.7fr', padding: '9px 16px', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
            {['Wallet', 'NFTs', 'Share'].map((h, i) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {TOP_HOLDERS.map((h, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.7fr', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 6, background: h.swatch, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{h.initials}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                </span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', textAlign: 'right' }}>{h.nfts}</span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-tertiary)', textAlign: 'right' }}>{h.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
