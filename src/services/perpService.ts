/**
 * perpService — perpetual market data and position management.
 *
 * Phase 2: funding rates, open interest, positions, close.
 * Gated by VITE_ENABLE_PERPS.
 *
 * CRITICAL: calcLiquidationPrice is for DISPLAY ONLY.
 * Real liquidation is computed by the settlement engine.
 * Never use this value for settlement logic.
 */

import type { ServiceResult } from '../types'
import { apiFetch } from './types'
import { MAINTENANCE_MARGIN_RATE, PERP_MAX_LEVERAGE } from '../config/fees'

export interface FundingRateInfo {
  marketId:       string
  rate8h:         string   // e.g. "+0.0100" (percent)
  rateAnnualized: string   // e.g. "+13.69" (percent)
  markPrice:      string
  paysDirection:  'longs-pay-shorts' | 'shorts-pay-longs' | 'neutral'
  nextFundingMs:  number
}

export interface OpenInterestInfo {
  marketId:  string
  notional:  string
  longPct:   string
  shortPct:  string
}

export interface PerpPosition {
  id:               string
  marketId:         string
  side:             'long' | 'short'
  size:             number
  entryPrice:       string
  markPrice:        string
  liquidationPrice: string
  leverage:         number
  margin:           string
  unrealizedPnl:    string
  unrealizedPnlPct: string
  realizedPnl:      string
  openedAt:         string
}

export const perpService = {
  async getFundingRate(marketId: string): Promise<ServiceResult<FundingRateInfo>> {
    return apiFetch<FundingRateInfo>(`/markets/${marketId}/funding`)
  },

  async getOpenInterest(marketId: string): Promise<ServiceResult<OpenInterestInfo>> {
    return apiFetch<OpenInterestInfo>(`/markets/${marketId}/oi`)
  },

  async getPositions(): Promise<ServiceResult<PerpPosition[]>> {
    return apiFetch<PerpPosition[]>('/positions')
  },

  async closePosition(positionId: string): Promise<ServiceResult<{ closed: boolean; realizedPnl: string }>> {
    return apiFetch<{ closed: boolean; realizedPnl: string }>(`/positions/${positionId}/close`, {
      method: 'POST',
    })
  },

  getMaxLeverage(_marketId: string): number {
    return PERP_MAX_LEVERAGE
  },

  /**
   * Estimated liquidation price for DISPLAY ONLY.
   * Long:  entry × (1 − 1/leverage + maintenanceMarginRate)
   * Short: entry × (1 + 1/leverage − maintenanceMarginRate)
   */
  calcLiquidationPrice(
    side: 'buy' | 'sell',
    entryPrice: number,
    leverage: number,
  ): number {
    const clampedLev = Math.min(Math.max(1, leverage), PERP_MAX_LEVERAGE)
    return side === 'buy'
      ? entryPrice * (1 - 1 / clampedLev + MAINTENANCE_MARGIN_RATE)
      : entryPrice * (1 + 1 / clampedLev - MAINTENANCE_MARGIN_RATE)
  },
}
