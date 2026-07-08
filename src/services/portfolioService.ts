/**
 * portfolioService — balances, positions, P&L.
 *
 * All modes hit a real backend. No mock data.
 * local-api: GET /portfolio (auth required)
 * devnet-api+: GET /users/:userId/portfolio
 */

import type { PortfolioSnapshot, Balance, PortfolioPosition, PortfolioStats, ServiceResult } from '../types'
import { ENV } from '../config/env'
import { apiFetch, getSessionToken } from './types'

interface ApiBalance {
  asset: string; total: string; available: string; locked: string; usdValue: string
}

interface ApiStats {
  equity: string; availableBalance: string; lockedBalance: string
  totalFeesPaid: string; referralPoints: string
  unrealizedPnl: string; allTimePnl: string; marginUsed: string
}

interface ApiPortfolioResponse {
  balances: ApiBalance[]
  stats: ApiStats
}

export const portfolioService = {
  async getPortfolio(userId: string): Promise<ServiceResult<PortfolioSnapshot>> {
    if (ENV.IS_LOCAL_API) {
      const token = getSessionToken()
      const res = await apiFetch<ApiPortfolioResponse>('/portfolio', { sessionToken: token })
      if (!res.ok) return res

      const { balances: apiBals, stats: apiStats } = res.data

      const balances: Balance[] = apiBals.map(b => ({
        asset: b.asset, total: b.total, available: b.available,
        locked: b.locked, pending: '0.00', usdValue: b.usdValue,
      }))

      const positions: PortfolioPosition[] = balances
        .filter(b => b.asset !== 'USDC' && parseFloat(b.total) > 0)
        .map(b => {
          const qty = parseFloat(b.total)
          const markPrice = qty > 0 ? (parseFloat(b.usdValue) / qty).toFixed(2) : '0.00'
          return {
            marketId: `${b.asset}-USDC-SPOT`,
            side: 'buy' as const,
            quantity: b.total,
            entryPrice: '0.00',
            markPrice,
            unrealizedPnl: '0.00',
            unrealizedPnlPct: '0.00',
            realizedPnl: '0.00',
          }
        })

      const stats: PortfolioStats = {
        equity:           apiStats.equity,
        availableBalance: apiStats.availableBalance,
        marginUsed:       apiStats.marginUsed ?? '0.00',
        unrealizedPnl:    apiStats.unrealizedPnl ?? '0.00',
        realizedPnl:      '0.00',
        allTimePnl:       apiStats.allTimePnl ?? '0.00',
        totalFeePaid:     apiStats.totalFeesPaid,
        referralPoints:   parseInt(apiStats.referralPoints) || 0,
      }

      return {
        ok: true,
        data: { userId, balances, positions, stats, fetchedAt: new Date().toISOString() },
      }
    }

    return apiFetch<PortfolioSnapshot>(`/users/${userId}/portfolio`)
  },

  async getBalances(userId: string): Promise<ServiceResult<Balance[]>> {
    const res = await portfolioService.getPortfolio(userId)
    if (!res.ok) return res
    return { ok: true, data: res.data.balances }
  },

  async getPositions(userId: string): Promise<ServiceResult<PortfolioPosition[]>> {
    const res = await portfolioService.getPortfolio(userId)
    if (!res.ok) return res
    return { ok: true, data: res.data.positions }
  },

  async getStats(userId: string): Promise<ServiceResult<PortfolioStats>> {
    const res = await portfolioService.getPortfolio(userId)
    if (!res.ok) return res
    return { ok: true, data: res.data.stats }
  },
}
