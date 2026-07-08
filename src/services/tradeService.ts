/**
 * tradeService — user fill history and trade analytics.
 *
 * All modes hit a real backend. No mock data.
 * BACKEND DEPENDENCY: GET /users/:userId/fills, GET /markets/:marketId/fills
 */

import type { Fill, ServiceResult } from '../types'
import { apiFetch } from './types'

export const tradeService = {
  async getUserFills(userId: string, limit = 50): Promise<ServiceResult<Fill[]>> {
    return apiFetch<Fill[]>(`/users/${userId}/fills?limit=${limit}`)
  },

  async getMarketFills(marketId: string, limit = 50): Promise<ServiceResult<Fill[]>> {
    return apiFetch<Fill[]>(`/markets/${marketId}/fills?limit=${limit}`)
  },
}
