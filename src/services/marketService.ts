/**
 * marketService — market list and ticker data.
 *
 * All modes hit a real backend. No mock data.
 * BACKEND DEPENDENCY: GET /markets, GET /markets/:marketId, GET /markets/:marketId/ticker
 */

import type { Market, MarketTicker, ServiceResult } from '../types'
import { ENV } from '../config/env'
import { FLAGS } from '../config/featureFlags'
import { apiFetch } from './types'

export const marketService = {
  async listMarkets(): Promise<ServiceResult<Market[]>> {
    const res = await apiFetch<Market[]>('/markets')
    if (!res.ok) return res
    return { ok: true, data: res.data.filter(m => m.isPhase1) }
  },

  async listAllMarkets(): Promise<ServiceResult<Market[]>> {
    const res = await apiFetch<Market[]>('/markets')
    if (!res.ok) return res
    // Gate perp markets by feature flag
    return {
      ok: true,
      data: res.data.map(m =>
        m.type === 'perp' ? { ...m, isActive: FLAGS.PERPS } : m
      ),
    }
  },

  async getMarket(marketId: string): Promise<ServiceResult<Market>> {
    return apiFetch<Market>(`/markets/${marketId}`)
  },

  async getTicker(marketId: string): Promise<ServiceResult<MarketTicker>> {
    if (ENV.IS_LOCAL_API) {
      const res = await apiFetch<{
        marketId: string; lastPrice: string; change24h: string; change24hPct: string
        volume24h: string; high24h: string; low24h: string; trades24h: number
      }>(`/markets/${marketId}/ticker`)
      if (!res.ok) return res
      // Server change24hPct is "+0.00%" — strip the % for MarketTicker.change24h
      const change24h = res.data.change24hPct.replace('%', '')
      return {
        ok: true,
        data: {
          marketId,
          lastPrice:  res.data.lastPrice,
          change24h,
          volume24h:  res.data.volume24h,
          high24h:    res.data.high24h,
          low24h:     res.data.low24h,
        },
      }
    }
    return apiFetch<MarketTicker>(`/markets/${marketId}/ticker`)
  },

  async getAllTickers(): Promise<ServiceResult<MarketTicker[]>> {
    return apiFetch<MarketTicker[]>('/markets/tickers')
  },
}
