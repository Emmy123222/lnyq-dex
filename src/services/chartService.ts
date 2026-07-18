/**
 * chartService — OHLCV candle data for the price chart.
 *
 * All modes hit a real backend. No mock data.
 * getCandles: REST fetch from /markets/:id/candles
 * subscribe (local-api): WS push via simClient; status = 'live'
 * subscribe (devnet/staging/prod): REST poll every 10s; status = 'delayed' (Phase 1 decision —
 *   no devnet WS candle endpoint yet; honest Delayed badge shown in ChartHeader)
 */

import type { Candle, ServiceResult } from '../types'
import { ENV } from '../config/env'
import { apiFetch } from './types'
import { simClient, type WsStatus } from './simClient'

export type { Candle }
export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1D'
export type ChartStatus = 'live' | 'delayed' | 'reconnecting' | 'unavailable'

const WS_TO_CHART: Record<WsStatus, ChartStatus> = {
  connecting:   'reconnecting',
  live:         'live',
  reconnecting: 'reconnecting',
  unavailable:  'unavailable',
}

export const chartService = {
  async getCandles(
    marketId: string,
    interval: CandleInterval,
    limit = 200,
  ): Promise<ServiceResult<Candle[]>> {
    return apiFetch<Candle[]>(`/markets/${marketId}/candles?interval=${interval}&limit=${limit}`)
  },

  subscribe(
    marketId: string,
    interval: CandleInterval,
    onUpdate: (candle: Candle) => void,
    onStatus?: (status: ChartStatus) => void,
  ): () => void {
    if (ENV.IS_LOCAL_API) {
      const unsubStatus = simClient.onStatus(s => onStatus?.(WS_TO_CHART[s]))
      const unsubCandles = simClient.subscribeCandles(marketId, interval, (msg) => {
        const candle = (msg as { candle?: Candle }).candle
        if (candle) onUpdate(candle)
      })
      return () => { unsubStatus(); unsubCandles() }
    }
    // devnet/staging/production — poll every 10s; always Delayed
    onStatus?.('delayed')
    const id = setInterval(async () => {
      const res = await chartService.getCandles(marketId, interval, 1)
      if (res.ok && res.data.length > 0) onUpdate(res.data[res.data.length - 1])
      else if (!res.ok) onStatus?.('unavailable')
    }, 10_000)
    return () => clearInterval(id)
  },
}
