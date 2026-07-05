import { useState, useRef, useEffect } from 'react'
import { CANDLES } from '../../data/mock'
import type { Pair } from '../../types'

type TF = '1m' | '5m' | '15m' | '1h' | '4h' | '1D'
const TIMEFRAMES: TF[] = ['1m', '5m', '15m', '1h', '4h', '1D']

function formatPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface PriceChartProps {
  pair: Pair
}

export default function PriceChart({ pair }: PriceChartProps) {
  const [tf, setTf] = useState<TF>('1h')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const last = CANDLES[CANDLES.length - 1]
  const first = CANDLES[0]
  const change = last.close - first.open
  const changePct = (change / first.open) * 100

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')!
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.clearRect(0, 0, width, height)

    const candles = CANDLES.slice(-Math.min(80, CANDLES.length))
    const prices = candles.flatMap(c => [c.high, c.low])
    const minP = Math.min(...prices) * 0.998
    const maxP = Math.max(...prices) * 1.002
    const range = maxP - minP

    const pad = { top: 8, bottom: 24, left: 4, right: 52 }
    const chartW = width - pad.left - pad.right
    const chartH = height - pad.top - pad.bottom
    const candleW = Math.max(2, (chartW / candles.length) - 1.5)

    const toY = (p: number) => pad.top + ((maxP - p) / range) * chartH
    const toX = (i: number) => pad.left + i * (chartW / candles.length) + (chartW / candles.length) / 2

    // Grid lines
    ctx.setLineDash([2, 4])
    for (let i = 0; i <= 5; i++) {
      const p = minP + (range / 5) * i
      const y = toY(p)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(width - pad.right, y)
      ctx.stroke()
      ctx.fillStyle = '#6B6B78'
      ctx.font = '10px IBM Plex Mono, monospace'
      ctx.textAlign = 'right'
      ctx.fillText(formatPrice(p), width - 2, y + 3)
    }
    ctx.setLineDash([])

    // Candles
    candles.forEach((c, i) => {
      const x = toX(i)
      const isUp = c.close >= c.open
      const color = isUp ? '#2EBD85' : '#F6465D'
      const bodyTop = toY(Math.max(c.open, c.close))
      const bodyBot = toY(Math.min(c.open, c.close))
      const bodyH = Math.max(1, bodyBot - bodyTop)

      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, toY(c.high))
      ctx.lineTo(x, toY(c.low))
      ctx.stroke()

      ctx.fillStyle = isUp ? color : color
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH)
    })
  }, [tf, pair])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar — matches design: price info left, timeframes right as pills */}
      <div
        style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatPrice(last.close)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: changePct >= 0 ? 'var(--up-500)' : 'var(--down-500)' }}>
            {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>USDC per NFT</span>
        </div>

        {/* Timeframe pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 3 }}>
          {TIMEFRAMES.map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              style={{
                padding: '4px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: tf === t ? 'var(--accent)' : 'transparent',
                color: tf === t ? '#fff' : 'var(--text-tertiary)',
                border: 'none', transition: 'all 100ms',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', minHeight: 0, padding: '8px 4px 4px' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
