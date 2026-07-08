/**
 * Settlement adapter interface.
 *
 * NOT real settlement. No smart contracts. No Solana programs.
 * Settlement adapter is an interface only. The protocol team will
 * provide a real implementation when on-chain settlement is ready.
 *
 * All trade fills in the CLOB engine are tagged MATCHED_PENDING_SETTLEMENT.
 * The adapter is responsible for:
 *   1. Verifying funds are available on-chain (checkAllowance)
 *   2. Locking or verifying funds before order placement (lockOrVerifyFunds)
 *   3. Settling a matched trade on-chain (settleTrade)
 *   4. Releasing locked balance on cancel (releaseLockedBalance)
 *   5. Querying settlement status for a trade (getSettlementStatus)
 *   6. Reporting network health (getNetworkHealth)
 */

export type SettlementStatus =
  | 'MATCHED_PENDING_SETTLEMENT'
  | 'SETTLED'
  | 'SETTLEMENT_FAILED'
  | 'SETTLEMENT_UNAVAILABLE'

export interface CheckAllowanceParams {
  userId: string
  walletAddress: string
  asset: string
  amount: string
}

export interface AllowanceResult {
  sufficient: boolean
  allowance: string
  required: string
}

export interface LockFundsParams {
  userId: string
  walletAddress: string
  asset: string
  amount: string
  orderId: string
}

export interface LockFundsResult {
  locked: boolean
  lockId?: string
  status: SettlementStatus
}

export interface SettleTradeParams {
  tradeId: string
  makerUserId: string
  takerUserId: string
  marketId: string
  price: string
  quantity: number
  makerFee: string
  takerFee: string
}

export interface SettleResult {
  settled: boolean
  txSignature?: string
  status: SettlementStatus
}

export interface ReleaseParams {
  userId: string
  asset: string
  amount: string
  orderId: string
}

export interface ReleaseResult {
  released: boolean
  status: SettlementStatus
}

export interface SettlementStatusResult {
  tradeId: string
  status: SettlementStatus
  txSignature?: string
  settledAt?: Date
}

export interface NetworkHealthResult {
  healthy: boolean
  latencyMs?: number
  blockHeight?: number
  message?: string
}

export interface SettlementConfig {
  type: 'not-configured' | 'api' | 'onchain'
  chainId?: string
  programId?: string
  apiUrl?: string
}

export interface SettlementAdapter {
  checkAllowance(params: CheckAllowanceParams): Promise<AllowanceResult>
  lockOrVerifyFunds(params: LockFundsParams): Promise<LockFundsResult>
  settleTrade(params: SettleTradeParams): Promise<SettleResult>
  releaseLockedBalance(params: ReleaseParams): Promise<ReleaseResult>
  getSettlementStatus(tradeId: string): Promise<SettlementStatusResult>
  getNetworkHealth(): Promise<NetworkHealthResult>
  getConfig(): SettlementConfig
}
