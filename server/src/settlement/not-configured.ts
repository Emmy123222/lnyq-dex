/**
 * NotConfiguredSettlementAdapter
 *
 * Used when no on-chain settlement backend is available.
 * Returns SETTLEMENT_UNAVAILABLE for all settlement operations.
 * The CLOB still matches orders and updates balances in the database —
 * settlement just stays in MATCHED_PENDING_SETTLEMENT state.
 */

import type {
  SettlementAdapter, SettlementConfig,
  CheckAllowanceParams, AllowanceResult,
  LockFundsParams, LockFundsResult,
  SettleTradeParams, SettleResult,
  ReleaseParams, ReleaseResult,
  SettlementStatusResult, NetworkHealthResult,
} from './adapter.js'

export class NotConfiguredSettlementAdapter implements SettlementAdapter {
  async checkAllowance(_params: CheckAllowanceParams): Promise<AllowanceResult> {
    return { sufficient: true, allowance: '0', required: '0' }
  }

  async lockOrVerifyFunds(_params: LockFundsParams): Promise<LockFundsResult> {
    return { locked: false, status: 'SETTLEMENT_UNAVAILABLE' }
  }

  async settleTrade(_params: SettleTradeParams): Promise<SettleResult> {
    return { settled: false, status: 'SETTLEMENT_UNAVAILABLE' }
  }

  async releaseLockedBalance(_params: ReleaseParams): Promise<ReleaseResult> {
    return { released: false, status: 'SETTLEMENT_UNAVAILABLE' }
  }

  async getSettlementStatus(tradeId: string): Promise<SettlementStatusResult> {
    return { tradeId, status: 'SETTLEMENT_UNAVAILABLE' }
  }

  async getNetworkHealth(): Promise<NetworkHealthResult> {
    return { healthy: false, message: 'Settlement not configured' }
  }

  getConfig(): SettlementConfig {
    return { type: 'not-configured' }
  }
}

export const settlementAdapter: SettlementAdapter = new NotConfiguredSettlementAdapter()
