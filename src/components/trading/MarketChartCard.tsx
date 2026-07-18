/**
 * MarketChartCard — full chart card system.
 *
 * Composes: ChartHeader + ChartStatsStrip + ChartToolbar + PriceChart canvas.
 * All data fetched internally via hooks. No mock data.
 */

import '../../styles/chart.css'

import { useState } from 'react'
import { useMarketChart }   from '../../hooks/useMarketChart'
import { useMarketTicker }  from '../../hooks/useMarketTicker'
import { useOrderBookTop }  from '../../hooks/useOrderBookTop'
import { useIsMobile }      from '../../hooks/useIsMobile'
import { ChartHeader }      from './ChartHeader'
import { ChartStatsStrip }  from './ChartStatsStrip'
import { ChartToolbar }     from './ChartToolbar'
import PriceChartCanvas     from './PriceChart'
import type { ChartMode, CandleInterval, ChartIndicators } from '../../types/chart'

interface Props {
  marketId:    string
  baseAsset:   string
  quoteAsset:  string
  marketType?: 'spot' | 'perp'
  /** If the parent already fetches ticker, pass it to avoid a duplicate poll. */
  tickerOverride?: import('../../types').MarketTicker | null
}

const DEFAULT_INDICATORS: ChartIndicators = {
  volume:   true,
  midpoint: false,
  bidAsk:   false,
}

export default function MarketChartCard({
  marketId, baseAsset, quoteAsset, marketType = 'spot', tickerOverride,
}: Props) {
  const [mode,       setMode]       = useState<ChartMode>('candles')
  const [interval,   setInterval]   = useState<CandleInterval>('1h')
  const [indicators, setIndicators] = useState<ChartIndicators>(DEFAULT_INDICATORS)

  const { candles, status, error, refetch } = useMarketChart(marketId, interval)
  // Skip fetch if parent already supplies ticker — pass '' to hook so it stays idle
  const { ticker: fetchedTicker } = useMarketTicker(tickerOverride !== undefined ? '' : marketId)
  const ticker = tickerOverride !== undefined ? tickerOverride : fetchedTicker
  const orderBookTop = useOrderBookTop(marketId)

  const handleIndicators = (patch: Partial<ChartIndicators>) =>
    setIndicators(prev => ({ ...prev, ...patch }))

  const isMobile = useIsMobile()

  return (
    <div className="chart-glass" style={{ height: '100%' }}>
      <ChartHeader
        baseAsset={baseAsset}
        quoteAsset={quoteAsset}
        marketType={marketType}
        status={status}
        ticker={isMobile ? ticker : null}
        compact={isMobile}
      />

      {!isMobile && (
        <ChartStatsStrip
          ticker={ticker}
          top={orderBookTop}
          quoteAsset={quoteAsset}
        />
      )}

      <ChartToolbar
        mode={mode}
        interval={interval}
        indicators={indicators}
        onModeChange={setMode}
        onIntervalChange={setInterval}
        onIndicatorsChange={handleIndicators}
        compact={isMobile}
      />

      <PriceChartCanvas
        candles={candles}
        mode={mode}
        indicators={indicators}
        orderBookTop={orderBookTop}
        status={status}
        error={error}
        onRetry={refetch}
      />
    </div>
  )
}
