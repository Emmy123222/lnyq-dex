import { useState, useRef, useEffect, useCallback } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type Time,
} from 'lightweight-charts'
import { chartService } from '../../services/chartService'
import type { Candle } from '../../types'
import type { CandleInterval } from '../../services/chartService'

const TIMEFRAMES: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1D']

function candleToBar(c: Candle): CandlestickData<Time> {
  return {
    time:  Math.floor(c.time / 1000) as Time,
    open:  c.open,
    high:  c.high,
    low:   c.low,
    close: c.close,
  }
}

function candleToVol(c: Candle): HistogramData<Time> {
  return {
    time:  Math.floor(c.time / 1000) as Time,
    value: c.volume,
    color: c.close >= c.open ? 'rgba(46,189,133,0.28)' : 'rgba(246,70,93,0.22)',
  }
}

function fmt2(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface PriceChartProps {
  marketId: string
}

export default function PriceChart({ marketId }: PriceChartProps) {
  const [tf, setTf]              = useState<CandleInterval>('1h')
  const [loading, setLoading]    = useState(true)
  const [error, setError]        = useState<string | null>(null)
  const [empty, setEmpty]        = useState(false)
  const [lastCandle, setLastCandle] = useState<Candle | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volSeriesRef    = useRef<ISeriesApi<'Histogram'> | null>(null)

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background:  { color: 'transparent' },
        textColor:   '#9B9BAA',
        fontFamily:  '"IBM Plex Mono", monospace',
        fontSize:    11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(160,81,252,0.5)', labelBackgroundColor: '#1A1A2E' },
        horzLine: { color: 'rgba(160,81,252,0.5)', labelBackgroundColor: '#1A1A2E' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        textColor:   '#6B6B78',
      },
      timeScale: {
        borderColor:    'rgba(255,255,255,0.08)',
        timeVisible:    true,
        secondsVisible: false,
        rightOffset:    6,
        barSpacing:     8,
        minBarSpacing:  3,
      },
      handleScroll:  true,
      handleScale:   true,
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:          '#2EBD85',
      downColor:        '#F6465D',
      borderUpColor:    '#2EBD85',
      borderDownColor:  '#F6465D',
      wickUpColor:      '#2EBD85',
      wickDownColor:    '#F6465D',
      priceLineVisible: true,
      priceLineColor:   'rgba(160,81,252,0.7)',
      lastValueVisible: true,
    })

    // Volume pane — 18% height, no price scale overlap
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat:      { type: 'volume' },
      priceScaleId:     'vol',
      lastValueVisible: false,
      priceLineVisible: false,
    })
    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
      visible: false,
    })
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.02, bottom: 0.20 },
    })

    chartRef.current      = chart
    candleSeriesRef.current = candleSeries
    volSeriesRef.current    = volSeries

    const obs = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.resize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      }
    })
    obs.observe(containerRef.current)

    return () => {
      obs.disconnect()
      chart.remove()
      chartRef.current        = null
      candleSeriesRef.current = null
      volSeriesRef.current    = null
    }
  }, [])

  // Load candles on market/interval change
  const loadCandles = useCallback(async () => {
    if (!candleSeriesRef.current || !volSeriesRef.current || !marketId) return
    setLoading(true)
    setError(null)
    setEmpty(false)

    const res = await chartService.getCandles(marketId, tf, 300)
    if (!res.ok) {
      setError(res.error.code === 'INTEGRATION_UNAVAILABLE'
        ? 'Backend not configured.'
        : res.error.message)
      setLoading(false)
      return
    }

    const candles = res.data
    if (candles.length === 0) {
      setEmpty(true)
      setLoading(false)
      return
    }

    candleSeriesRef.current.setData(candles.map(candleToBar))
    volSeriesRef.current.setData(candles.map(candleToVol))
    setLastCandle(candles[candles.length - 1])
    chartRef.current?.timeScale().fitContent()
    setLoading(false)
  }, [marketId, tf])

  useEffect(() => { loadCandles() }, [loadCandles])

  // Subscribe to live updates
  useEffect(() => {
    return chartService.subscribe(marketId, tf, (incoming: Candle) => {
      const bar = candleToBar(incoming)
      const vol = candleToVol(incoming)
      candleSeriesRef.current?.update(bar)
      volSeriesRef.current?.update(vol)
      setLastCandle(incoming)
    })
  }, [marketId, tf])

  // Compute header stats from the last loaded candle vs first
  const changePct = lastCandle ? ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100 : 0
  const isUp = changePct >= 0

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div style={{
        height: 46, flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 14px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          {lastCandle ? (
            <>
              <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt2(lastCandle.close)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: isUp ? 'var(--up-500)' : 'var(--down-500)' }}>
                {isUp ? '+' : ''}{changePct.toFixed(2)}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>USDC</span>
            </>
          ) : (
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>—</span>
          )}
        </div>

        {/* Timeframe pills */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: 'var(--surface-2)', border: '1px solid var(--border-subtle)',
          borderRadius: 6, padding: 3,
        }}>
          {TIMEFRAMES.map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              style={{
                padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', border: 'none', transition: 'all 100ms',
                background: tf === t ? 'var(--accent)' : 'transparent',
                color: tf === t ? '#fff' : 'var(--text-tertiary)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface-1)', zIndex: 10,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2px solid var(--border-subtle)',
                borderTop: '2px solid var(--accent)',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Loading chart…</span>
            </div>
          </div>
        )}

        {empty && !loading && !error && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 10,
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No trades yet</span>
          </div>
        )}

        {error && !loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 10,
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{error}</span>
            <button onClick={loadCandles} style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
