/**
 * PriceChart — lightweight-charts canvas renderer.
 *
 * Accepts processed props from MarketChartCard. Does NOT fetch data.
 * Handles: candles, area, line modes; volume; bid/ask/midpoint overlays; tooltip.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  createChart, CandlestickSeries, AreaSeries, LineSeries, HistogramSeries, CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type LineData,
  type AreaData,
  type IPriceLine,
  type Time,
} from 'lightweight-charts'
import type { Candle } from '../../types'
import type { ChartMode, ChartIndicators, OrderBookTop, ChartDataStatus, ChartTooltipData } from '../../types/chart'
import { ChartTooltip  } from './ChartTooltip'
import { ChartEmptyState } from './ChartEmptyState'
import { ChartErrorState } from './ChartErrorState'

// ── Converters ──────────────────────────────────────────────────────────────────

function toBar(c: Candle): CandlestickData<Time> {
  return { time: Math.floor(c.time / 1000) as Time, open: c.open, high: c.high, low: c.low, close: c.close }
}
function toValue(c: Candle): LineData<Time> {
  return { time: Math.floor(c.time / 1000) as Time, value: c.close }
}
function toAreaValue(c: Candle): AreaData<Time> {
  return { time: Math.floor(c.time / 1000) as Time, value: c.close }
}
function toVol(c: Candle): HistogramData<Time> {
  return {
    time:  Math.floor(c.time / 1000) as Time,
    value: c.volume,
    color: c.close >= c.open ? 'rgba(0,196,176,0.18)' : 'rgba(255,70,102,0.15)',
  }
}

function formatTime(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function sortedCandles(candles: Candle[]) {
  return [...candles].sort((a, b) => a.time - b.time)
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  candles:       Candle[]
  mode:          ChartMode
  indicators:    ChartIndicators
  orderBookTop:  OrderBookTop
  status:        ChartDataStatus
  error:         string | null
  onRetry:       () => void
}

export default function PriceChart({ candles, mode, indicators, orderBookTop, status, error, onRetry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)

  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const areaSeriesRef   = useRef<ISeriesApi<'Area'>         | null>(null)
  const lineSeriesRef   = useRef<ISeriesApi<'Line'>         | null>(null)
  const volSeriesRef    = useRef<ISeriesApi<'Histogram'>    | null>(null)

  const midlineRef = useRef<IPriceLine | null>(null)
  const bidlineRef = useRef<IPriceLine | null>(null)
  const asklineRef = useRef<IPriceLine | null>(null)

  const [tooltip,       setTooltip]       = useState<ChartTooltipData | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [chartReady,    setChartReady]    = useState(false)

  // ── Chart creation (once) ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor:  '#6b6b78',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize:   11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.025)' },
        horzLines: { color: 'rgba(255,255,255,0.025)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(160,81,252,0.45)', labelBackgroundColor: '#1a1a2e', width: 1, style: 2 as const },
        horzLine: { color: 'rgba(160,81,252,0.45)', labelBackgroundColor: '#1a1a2e', width: 1, style: 2 as const },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor:   '#6b6b78',
        scaleMargins: { top: 0.04, bottom: 0.18 },
      },
      timeScale: {
        borderColor:    'rgba(255,255,255,0.06)',
        timeVisible:    true,
        secondsVisible: false,
        rightOffset:    6,
        barSpacing:     6,
        minBarSpacing:  2,
      },
      handleScroll: true,
      handleScale:  true,
    })

    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat:      { type: 'volume' },
      priceScaleId:     'vol',
      lastValueVisible: false,
      priceLineVisible: false,
    })
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.86, bottom: 0 }, visible: false })

    chartRef.current     = chart
    volSeriesRef.current = volSeries

    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect
        chart.resize(width, height)
        setContainerSize({ w: width, h: height })
      }
    })
    obs.observe(containerRef.current)

    chart.subscribeCrosshairMove(param => {
      if (!param.point || !param.time) { setTooltip(null); return }

      // Extract OHLCV from whichever series is active
      const cData = candleSeriesRef.current
        ? (param.seriesData.get(candleSeriesRef.current) as CandlestickData<Time> | undefined)
        : undefined
      const vData = (areaSeriesRef.current
        ? param.seriesData.get(areaSeriesRef.current)
        : lineSeriesRef.current
        ? param.seriesData.get(lineSeriesRef.current)
        : undefined) as unknown as { value: number } | undefined
      const volData = volSeriesRef.current
        ? (param.seriesData.get(volSeriesRef.current) as HistogramData<Time> | undefined)
        : undefined

      const close = cData ? cData.close : vData?.value ?? 0

      setTooltip({
        time:   formatTime(Number(param.time)),
        open:   cData ? cData.open  : close,
        high:   cData ? cData.high  : close,
        low:    cData ? cData.low   : close,
        close,
        volume: volData?.value ?? 0,
        x:      param.point.x,
        y:      param.point.y,
      })
    })

    setChartReady(true)

    return () => {
      obs.disconnect()
      chart.remove()
      chartRef.current        = null
      volSeriesRef.current    = null
      candleSeriesRef.current = null
      areaSeriesRef.current   = null
      lineSeriesRef.current   = null
      setChartReady(false)
      setTooltip(null)
    }
  }, [])

  // ── Series + data (reruns on mode or candles change) ───────────────────────
  const modeRef = useRef<ChartMode | null>(null)

  useEffect(() => {
    if (!chartReady || !chartRef.current) return
    const chart = chartRef.current

    // Recreate price series when mode changes
    if (modeRef.current !== mode) {
      modeRef.current = mode

      if (candleSeriesRef.current) { try { chart.removeSeries(candleSeriesRef.current) } catch { /* removed */ } candleSeriesRef.current = null }
      if (areaSeriesRef.current)   { try { chart.removeSeries(areaSeriesRef.current)   } catch { /* removed */ } areaSeriesRef.current   = null }
      if (lineSeriesRef.current)   { try { chart.removeSeries(lineSeriesRef.current)   } catch { /* removed */ } lineSeriesRef.current   = null }

      midlineRef.current = null
      bidlineRef.current = null
      asklineRef.current = null

      if (mode === 'candles') {
        candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
          upColor:          '#00c4b0',
          downColor:        '#ff4666',
          borderUpColor:    '#00c4b0',
          borderDownColor:  '#ff4666',
          wickUpColor:      '#00c4b0',
          wickDownColor:    '#ff4666',
          priceLineColor:   'rgba(160,81,252,0.6)',
          lastValueVisible: true,
        })
      } else if (mode === 'area') {
        areaSeriesRef.current = chart.addSeries(AreaSeries, {
          lineColor:               '#00c4b0',
          topColor:                'rgba(0,196,176,0.26)',
          bottomColor:             'rgba(0,196,176,0.00)',
          lineWidth:               2,
          priceLineColor:          'rgba(0,196,176,0.6)',
          lastValueVisible:        true,
          crosshairMarkerVisible:  true,
          crosshairMarkerRadius:   4,
          crosshairMarkerBorderColor: '#00c4b0',
          crosshairMarkerBackgroundColor: '#00c4b0',
        })
      } else {
        lineSeriesRef.current = chart.addSeries(LineSeries, {
          color:                   '#00c4b0',
          lineWidth:               2,
          priceLineColor:          'rgba(0,196,176,0.6)',
          lastValueVisible:        true,
          crosshairMarkerVisible:  true,
          crosshairMarkerRadius:   4,
          crosshairMarkerBorderColor: '#00c4b0',
          crosshairMarkerBackgroundColor: '#00c4b0',
        })
      }
    }

    if (candles.length === 0) return

    const sorted = sortedCandles(candles)

    if (candleSeriesRef.current) candleSeriesRef.current.setData(sorted.map(toBar))
    else if (areaSeriesRef.current) areaSeriesRef.current.setData(sorted.map(toAreaValue))
    else if (lineSeriesRef.current) lineSeriesRef.current.setData(sorted.map(toValue))

    if (volSeriesRef.current) {
      volSeriesRef.current.setData(indicators.volume ? sorted.map(toVol) : [])
    }

    chart.timeScale().fitContent()
  }, [chartReady, mode, candles, indicators.volume])

  // ── Overlay: midpoint price line ─────────────────────────────────────────────
  const getActiveSeries = useCallback(() =>
    (candleSeriesRef.current ?? areaSeriesRef.current ?? lineSeriesRef.current) as ISeriesApi<'Candlestick'> | ISeriesApi<'Area'> | ISeriesApi<'Line'> | null,
  [])

  useEffect(() => {
    const series = getActiveSeries()
    if (!series) return

    if (midlineRef.current) {
      try { (series as ISeriesApi<'Candlestick'>).removePriceLine(midlineRef.current) } catch { /* ok */ }
      midlineRef.current = null
    }

    if (indicators.midpoint && orderBookTop.midpoint) {
      const mid = parseFloat(orderBookTop.midpoint)
      if (mid > 0) {
        midlineRef.current = (series as ISeriesApi<'Candlestick'>).createPriceLine({
          price: mid, color: 'rgba(160,81,252,0.7)', lineWidth: 1, lineStyle: 2 as const,
          axisLabelVisible: false, title: 'Mid',
        })
      }
    }
  }, [indicators.midpoint, orderBookTop.midpoint, getActiveSeries])

  // ── Overlay: bid / ask price lines ──────────────────────────────────────────
  useEffect(() => {
    const series = getActiveSeries()
    if (!series) return
    const s = series as ISeriesApi<'Candlestick'>

    if (bidlineRef.current) { try { s.removePriceLine(bidlineRef.current) } catch { /* ok */ } bidlineRef.current = null }
    if (asklineRef.current) { try { s.removePriceLine(asklineRef.current) } catch { /* ok */ } asklineRef.current = null }

    if (indicators.bidAsk) {
      if (orderBookTop.bestBid) {
        const bid = parseFloat(orderBookTop.bestBid)
        if (bid > 0) {
          bidlineRef.current = s.createPriceLine({
            price: bid, color: 'rgba(0,196,176,0.65)', lineWidth: 1, lineStyle: 2 as const,
            axisLabelVisible: false, title: 'Bid',
          })
        }
      }
      if (orderBookTop.bestAsk) {
        const ask = parseFloat(orderBookTop.bestAsk)
        if (ask > 0) {
          asklineRef.current = s.createPriceLine({
            price: ask, color: 'rgba(255,70,102,0.65)', lineWidth: 1, lineStyle: 2 as const,
            axisLabelVisible: false, title: 'Ask',
          })
        }
      }
    }
  }, [indicators.bidAsk, orderBookTop.bestBid, orderBookTop.bestAsk, getActiveSeries])

  // ── Render ───────────────────────────────────────────────────────────────────

  const showOverlay = status === 'empty' || status === 'error' || status === 'unavailable'

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-1)', zIndex: 10,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.08)',
              borderTop: '2px solid var(--chart-up, #00c4b0)',
              animation: 'chartSpin 0.7s linear infinite',
            }} />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Loading chart…</span>
          </div>
        </div>
      )}

      {status === 'empty' && <ChartEmptyState />}

      {(status === 'error' || status === 'unavailable') && (
        <ChartErrorState message={error ?? 'Backend not configured.'} onRetry={onRetry} />
      )}

      {!showOverlay && status !== 'loading' && (
        <ChartTooltip
          data={tooltip}
          containerWidth={containerSize.w}
          containerHeight={containerSize.h}
        />
      )}
    </div>
  )
}
