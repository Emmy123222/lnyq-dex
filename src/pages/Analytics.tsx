import { useState, useRef, useEffect } from 'react'

const PERIODS = ['7D', '30D', '90D', 'All']

const PERF_ROWS = [
  { label: 'Largest Win',    value: '+1,840.00', color: 'var(--up-500)' },
  { label: 'Largest Loss',   value: '-620.00',   color: 'var(--down-400)' },
  { label: 'Avg Win',        value: '+392.40',   color: 'var(--up-500)' },
  { label: 'Avg Loss',       value: '-186.20',   color: 'var(--down-400)' },
  { label: 'Profit Factor',  value: '2.11',      color: 'var(--text-primary)' },
  { label: 'Sharpe Ratio',   value: '1.84',      color: 'var(--text-primary)' },
]

const VOL_BY_MARKET = [
  { name: 'LNYQNFT-USDC PERP',  vol: '$9.2M',  pct: 68, color: 'var(--accent)' },
  { name: 'LNYQNFT-USDC SPOT',  vol: '$2.8M',  pct: 21, color: '#6b3fa0' },
  { name: 'THEGOOMAN-USDC PERP', vol: '$1.1M', pct: 8,  color: '#4a2c70' },
  { name: 'THEGOOMAN-USDC SPOT', vol: '$0.5M', pct: 3,  color: 'var(--surface-raised)' },
]

function PnlChart() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const { width, height } = container.getBoundingClientRect()
    if (!width || !height) return
    canvas.width  = width  * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width  = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')!
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.clearRect(0, 0, width, height)

    // Synthetic cumulative PnL curve (visual only)
    const points: number[] = []
    let cum = 0
    for (let i = 0; i < 60; i++) {
      const drift = (Math.random() - 0.44) * 120
      cum += drift
      points.push(cum)
    }
    const minV = Math.min(...points)
    const maxV = Math.max(...points)
    const range = maxV - minV || 1
    const pad = { top: 16, bottom: 16, left: 8, right: 56 }
    const cW = width - pad.left - pad.right
    const cH = height - pad.top - pad.bottom
    const toX = (i: number) => pad.left + (i / (points.length - 1)) * cW
    const toY = (v: number) => pad.top + ((maxV - v) / range) * cH

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH)
    grad.addColorStop(0, 'rgba(46,189,133,0.25)')
    grad.addColorStop(1, 'rgba(46,189,133,0)')
    ctx.beginPath()
    ctx.moveTo(toX(0), toY(points[0]))
    points.forEach((v, i) => ctx.lineTo(toX(i), toY(v)))
    ctx.lineTo(toX(points.length - 1), pad.top + cH)
    ctx.lineTo(toX(0), pad.top + cH)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.strokeStyle = '#2EBD85'
    ctx.lineWidth = 2
    points.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)))
    ctx.stroke()

    // Y-axis labels
    ctx.setLineDash([2, 4])
    for (let i = 0; i <= 4; i++) {
      const v = minV + (range / 4) * i
      const y = toY(v)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke()
      ctx.fillStyle = '#6B6B78'; ctx.font = '10px IBM Plex Mono,monospace'
      ctx.textAlign = 'right'; ctx.fillText((v >= 0 ? '+' : '') + v.toFixed(0), width - 2, y + 3)
    }
    ctx.setLineDash([])
  }, [])

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  )
}

export default function Analytics() {
  const [period, setPeriod] = useState('30D')

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Analytics</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Your trading performance across all spot and perp markets.</span>
        </div>
        <div style={{ display: 'flex', height: 28, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 3, gap: 3 }}>
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{ padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: period === p ? 'var(--accent)' : 'transparent', color: period === p ? '#fff' : 'var(--text-tertiary)', border: 'none', transition: 'all 100ms' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 20, padding: 24, overflow: 'hidden' }}>
        {/* Stat strip */}
        <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24 }}>
          {[
            { label: 'Total PnL (30d)', value: '+8,420.00', color: 'var(--up-500)' },
            { label: 'Win Rate',        value: '64.2%',     color: 'var(--text-primary)', bordered: true },
            { label: 'Total Volume',    value: '$13.6M',    color: 'var(--text-primary)', bordered: true },
            { label: 'Trades',          value: '248',       color: 'var(--text-primary)', bordered: true },
            { label: 'Fees Paid',       value: '2,180.40',  color: 'var(--text-secondary)', bordered: true },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: (s as any).bordered ? 24 : 0, borderLeft: (s as any).bordered ? '1px solid var(--border-subtle)' : 'none' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{s.label}</span>
              <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20 }}>
          {/* PnL Chart */}
          <div style={{ flex: 1, minWidth: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Cumulative PnL</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)' }}>+8,420.00</span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>USDC</span>
              </div>
            </div>
            <PnlChart />
            <div style={{ flexShrink: 0, padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {PERF_ROWS.map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ flex: '0 0 400px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Breakdown</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 26 }}>
              {/* Win/Loss */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Win / Loss</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>159W · 89L</span>
                </div>
                <div style={{ height: 14, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                  <span style={{ width: '64%', background: 'var(--up-500)' }} />
                  <span style={{ flex: 1, background: 'var(--down-500)' }} />
                </div>
              </div>
              {/* Long/Short */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Long / Short Split</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>71% / 29%</span>
                </div>
                <div style={{ height: 14, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                  <span style={{ width: '71%', background: 'var(--accent)' }} />
                  <span style={{ flex: 1, background: 'var(--surface-raised)' }} />
                </div>
              </div>
              {/* Volume by market */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Volume by Market</span>
                {VOL_BY_MARKET.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>{m.vol}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
