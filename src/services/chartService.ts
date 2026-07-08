/**
 * chartService — OHLCV candle data for the price chart.
 *
 * All modes hit a real backend. No mock data.
 * getCandles: REST fetch from /markets/:id/candles
 * subscribe: WS via simClient (local-api) or polling (other modes)
 */

import type { Candle, ServiceResult } from '../types'
import { ENV } from '../config/env'
import { apiFetch } from './types'
import { simClient } from './simClient'

export type { Candle }
export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1D'

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
  ): () => void {
    if (ENV.IS_LOCAL_API) {
      return simClient.subscribeCandles(marketId, interval, (msg) => {
        const candle = (msg as { candle?: Candle }).candle
        if (candle) onUpdate(candle)
      })
    }
    // devnet/staging/production — poll every 10s until WS is wired
    const id = setInterval(async () => {
      const res = await chartService.getCandles(marketId, interval, 1)
      if (res.ok && res.data.length > 0) onUpdate(res.data[res.data.length - 1])
    }, 10_000)
    return () => clearInterval(id)
  },
}
