/**
 * dripService — testnet USDC faucet / drip claim.
 *
 * All modes hit a real backend. No mock data.
 * local-api: GET /drip/status, POST /drip/claim
 * devnet-api+: same endpoints
 */

import type { DripStatusResponse, DripClaimResponse, ServiceResult } from '../types'
import { ENV } from '../config/env'
import { apiFetch, getSessionToken } from './types'

export const dripService = {
  async getStatus(sessionToken: string): Promise<ServiceResult<DripStatusResponse>> {
    const token = sessionToken || getSessionToken()
    if (!token) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }

    if (ENV.IS_LOCAL_API) {
      const res = await apiFetch<{ claimed: boolean; amount: string; asset: string }>(
        '/drip/status', { sessionToken: token },
      )
      if (!res.ok) return res
      return {
        ok: true,
        data: res.data.claimed
          ? { status: 'ALREADY_CLAIMED', amount: res.data.amount, claimedAt: new Date().toISOString() }
          : { status: 'ELIGIBLE', amount: res.data.amount },
      }
    }

    return apiFetch<DripStatusResponse>('/drip/status', { sessionToken: token })
  },

  async claim(sessionToken: string): Promise<ServiceResult<DripClaimResponse>> {
    const token = sessionToken || getSessionToken()
    if (!token) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }

    if (ENV.IS_LOCAL_API) {
      const res = await apiFetch<{ claimed: boolean; amount: string; txId: string }>(
        '/drip/claim', { method: 'POST', sessionToken: token },
      )
      if (!res.ok) return { ok: false, error: res.error }
      return {
        ok: true,
        data: { success: true, status: 'CLAIMED', amount: res.data.amount, txSignature: res.data.txId },
      }
    }

    return apiFetch<DripClaimResponse>('/drip/claim', { method: 'POST', sessionToken: token })
  },
}
