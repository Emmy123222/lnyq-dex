/**
 * squidService — Squid Router integration plumbing.
 *
 * Phase 1 status: CROSS-CHAIN GATED (VITE_ENABLE_CROSS_CHAIN=false).
 * This file prepares the integration layer for Phase 3.
 *
 * IMPORTANT CONSTRAINTS:
 * - collectFees is NOT supported on BTC and Solana routes — hard guard.
 * - Coral/Intents is NOT assumed enabled — requires VITE_SQUID_ENABLE_CORAL=true.
 * - Solana/BTC deposit-address flow requires VITE_SQUID_ENABLE_SOLANA_BTC=true.
 * - Never mix Squid service fees with LNYQ trading fees.
 * - Never promise sub-5s completion. Use estimated language only.
 * - Show Refunded and Failed states — never hide them.
 *
 * Squid docs: https://docs.squidrouter.com
 */

import type {
  SquidRouteRequest,
  SquidRouteResponse,
  SquidStatusResponse,
  SquidDepositAddressResponse,
  SquidFeeCost,
  SquidHookValidationResult,
  SquidPreHook,
  SquidPostHook,
  SquidTransactionType,
  ServiceResult,
} from '../types'
import { ENV } from '../config/env'
import { FLAGS } from '../config/featureFlags'
import { serviceError, unavailable } from './types'

// ── Guards ────────────────────────────────────────────────────────────────────

function assertCrossChainEnabled(): ServiceResult<never> | null {
  if (!FLAGS.CROSS_CHAIN) {
    return serviceError('FEATURE_GATED', 'Cross-chain is Coming in Phase 3. Set VITE_ENABLE_CROSS_CHAIN=true to enable.')
  }
  return null
}

function assertIntegratorId(): ServiceResult<never> | null {
  if (!ENV.SQUID_INTEGRATOR_ID) {
    return serviceError('CONFIG_MISSING', 'VITE_SQUID_INTEGRATOR_ID is required for Squid routes.')
  }
  return null
}

/** BTC and Solana routes do NOT support collectFees — hard block */
function isSolanaOrBtcChain(chainId: string | number): boolean {
  const s = String(chainId).toLowerCase()
  return s.includes('solana') || s.includes('bitcoin') || s.includes('btc') || s === '1399811149'
}

// ── Hook validation ───────────────────────────────────────────────────────────

export function validatePreHook(hook: SquidPreHook): SquidHookValidationResult {
  const errors: string[] = []
  if (!hook.calls || hook.calls.length === 0) errors.push('preHook.calls must not be empty')
  if (!hook.chainType) errors.push('preHook.chainType is required')
  hook.calls?.forEach((call, i) => {
    if (!call.target) errors.push(`preHook.calls[${i}].target is required`)
    if (!call.callData) errors.push(`preHook.calls[${i}].callData is required`)
  })
  return { valid: errors.length === 0, errors }
}

export function validatePostHook(hook: SquidPostHook): SquidHookValidationResult {
  const errors: string[] = []
  if (!hook.calls || hook.calls.length === 0) errors.push('postHook.calls must not be empty')
  if (!hook.chainType) errors.push('postHook.chainType is required')
  return { valid: errors.length === 0, errors }
}

// ── Fee parsing helpers ───────────────────────────────────────────────────────

/**
 * Extract LNYQ-relevant fee display from a Squid route.
 * Returns the integrator fee cost if present, else null.
 *
 * IMPORTANT: Show Squid service fees separately from LNYQ trading fees.
 * Never combine them into one line item.
 */
export function parseSquidIntegratorFee(feeCosts: SquidFeeCost[]): SquidFeeCost | null {
  return feeCosts.find(f => f.type === 'IntegratorFee') ?? null
}

export function parseSquidBridgeFees(feeCosts: SquidFeeCost[]): SquidFeeCost[] {
  return feeCosts.filter(f => f.type !== 'IntegratorFee')
}

// ── Squid API helpers ─────────────────────────────────────────────────────────

async function squidFetch<T>(path: string, options: RequestInit = {}): Promise<ServiceResult<T>> {
  const g = assertIntegratorId()
  if (g) return g as ServiceResult<T>

  try {
    const res = await fetch(`${ENV.SQUID_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-integrator-id': ENV.SQUID_INTEGRATOR_ID,
        ...(options.headers ?? {}),
      },
    })
    if (!res.ok) {
      let msg = res.statusText
      try { const j = await res.json(); msg = j?.error ?? j?.message ?? msg } catch { /* noop */ }
      return serviceError('SQUID_HTTP_ERROR', msg, res.status)
    }
    const data: T = await res.json()
    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Squid network error'
    console.error('[squidService]', err)
    return serviceError('SQUID_NETWORK_ERROR', message)
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const squidService = {
  /**
   * Request a route quote from Squid.
   *
   * collectFees: only included when VITE_SQUID_ENABLE_COLLECT_FEES=true
   *              AND the route is not a BTC/Solana route.
   *
   * Coral/Intents: enableBoost only included when VITE_SQUID_ENABLE_CORAL=true.
   */
  async getRoute(req: SquidRouteRequest): Promise<ServiceResult<SquidRouteResponse>> {
    const gate = assertCrossChainEnabled()
    if (gate) return gate

    // Build the actual request — apply feature guards
    const payload: SquidRouteRequest = { ...req }

    // collectFees guard
    if (payload.collectFees) {
      const fromSolBtc = isSolanaOrBtcChain(req.fromChain)
      const toSolBtc   = isSolanaOrBtcChain(req.toChain)
      if (fromSolBtc || toSolBtc) {
        delete payload.collectFees
        console.warn('[squidService] collectFees removed: not supported on BTC/Solana routes')
      }
      if (!FLAGS.SQUID_COLLECT_FEES) {
        delete payload.collectFees
        console.warn('[squidService] collectFees removed: VITE_SQUID_ENABLE_COLLECT_FEES is false')
      }
    }

    // Coral guard
    if (payload.enableBoost && !FLAGS.SQUID_CORAL) {
      delete payload.enableBoost
    }

    // Hook validation
    if (payload.preHook) {
      const v = validatePreHook(payload.preHook)
      if (!v.valid) return serviceError('HOOK_INVALID', `preHook validation failed: ${v.errors.join('; ')}`)
    }
    if (payload.postHook) {
      const v = validatePostHook(payload.postHook)
      if (!v.valid) return serviceError('HOOK_INVALID', `postHook validation failed: ${v.errors.join('; ')}`)
    }

    return squidFetch<SquidRouteResponse>('/v2/route', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Request a deposit-address for BTC/Solana routes.
   * Only available when VITE_SQUID_ENABLE_SOLANA_BTC=true.
   *
   * The user must send EXACTLY the specified fromAmount to the returned depositAddress.
   * Warn the user to not reuse the address.
   */
  async getDepositAddress(req: SquidRouteRequest): Promise<ServiceResult<SquidDepositAddressResponse>> {
    const gate = assertCrossChainEnabled()
    if (gate) return gate
    if (!FLAGS.SQUID_SOLANA_BTC) {
      return serviceError('FEATURE_GATED', 'Solana/BTC routing is Coming in Phase 3. Set VITE_SQUID_ENABLE_SOLANA_BTC=true.')
    }
    return squidFetch<SquidDepositAddressResponse>('/v2/deposit-address', {
      method: 'POST',
      body: JSON.stringify(req),
    })
  },

  /**
   * Poll status for an in-progress route.
   * Call every 5-10 seconds while status is ONGOING.
   */
  async getStatus(txHash: string, fromChainId: string | number, toChainId: string | number): Promise<ServiceResult<SquidStatusResponse>> {
    const gate = assertCrossChainEnabled()
    if (gate) return gate
    const params = new URLSearchParams({
      transactionId: txHash,
      fromChainId: String(fromChainId),
      toChainId: String(toChainId),
    })
    return squidFetch<SquidStatusResponse>(`/v2/status?${params}`)
  },

  /**
   * Detect if a Squid route response requires deposit-address flow.
   * Branch on transactionRequest.type to determine execution path.
   */
  isDepositAddressRoute(txType: SquidTransactionType): boolean {
    return txType === 'deposit_address'
  },

  /**
   * Check if a Coral/Intents route has expired.
   * Refresh quote before execution if expired.
   */
  isRouteExpired(response: SquidRouteResponse): boolean {
    if (!response.expiresAt) return false
    return Date.now() > response.expiresAt
  },

  /**
   * Feature availability check — for UI to show/hide the Squid deposit flow.
   */
  isAvailable(): boolean {
    return FLAGS.CROSS_CHAIN && !!ENV.SQUID_INTEGRATOR_ID
  },

  /** Placeholder — real token list from Squid /v2/sdk-info or /v2/tokens */
  async getSupportedTokens(): Promise<ServiceResult<unknown>> {
    const gate = assertCrossChainEnabled()
    if (gate) return gate
    return unavailable('Squid token list')
  },
}
