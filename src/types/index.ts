// ─────────────────────────────────────────────────────────────────────────────
// Core enumerations
// ─────────────────────────────────────────────────────────────────────────────

export type OrderSide       = 'buy' | 'sell'
export type OrderType       = 'limit' | 'market'
export type TimeInForce     = 'GTC' | 'IOC' | 'FOK' | 'GTD'
export type MarketType      = 'spot' | 'perp'

export type OrderStatus =
  | 'PENDING'
  | 'OPEN'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REJECTED'

/** @deprecated use OrderStatus — kept for legacy mock data compatibility */
export type LegacyOrderStatus = 'open' | 'filled' | 'cancelled' | 'partial'

// ─────────────────────────────────────────────────────────────────────────────
// Market / collection types
// ─────────────────────────────────────────────────────────────────────────────

export interface Collection {
  id: string
  slug: string
  name: string
  symbol: string
  /** Blockchain / contract address on the relevant chain */
  contractAddress?: string
  /** On-chain program or mint address on Solana devnet */
  programAddress?: string
  imageUrl?: string
  description?: string
  supply: number
  phase1Enabled: boolean
}

export interface Market {
  id: string
  baseAsset: string          // e.g. "LNYQNFT"
  quoteAsset: string         // always "USDC" in Phase 1
  type: MarketType
  /** Displayed as "LNYQNFT / USDC" (spot) or "LNYQNFT-USDC" (perp) */
  displayName: string
  collection?: Collection
  isActive: boolean
  isPhase1: boolean          // false → gated / "coming soon"
  minOrderSize: number
  tickSize: string           // fixed-point string e.g. "0.01"
  maxLeverage?: number       // perp only — not used in Phase 1
}

/** Thin summary used by market lists / ticker strips */
export interface MarketTicker {
  marketId: string
  lastPrice: string          // fixed-point string
  change24h: string          // e.g. "+5.21"
  volume24h: string          // fixed-point string USDC
  high24h: string
  low24h: string
  openInterest?: string
  fundingRate?: string
}

/** Legacy shape used by existing UI — kept while we migrate */
export interface Pair {
  base: string
  quote: string
  type: MarketType
  lastPrice: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Order book
// ─────────────────────────────────────────────────────────────────────────────

/** A single aggregated price level — sizes as fixed-point strings */
export interface PriceLevel {
  price: string        // fixed-point
  size: string         // fixed-point
  total: string        // cumulative from top of book, fixed-point
}

export interface OrderBook {
  marketId: string
  asks: PriceLevel[]   // sorted lowest → highest (closest to spread first)
  bids: PriceLevel[]   // sorted highest → lowest (closest to spread first)
  spread: string       // fixed-point
  spreadPct: string    // percentage string e.g. "0.421"
  midpoint: string     // fixed-point
  sequenceNumber: number
  updatedAt: string
}

/** Legacy shape used by existing UI components — kept during migration */
export interface OrderBookLevel {
  price: number
  size: number
  total: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────────────────────

export interface PlaceOrderRequest {
  marketId: string
  side: OrderSide
  type: OrderType
  /** Fixed-point string. Required for limit orders. */
  price?: string
  /** Fixed-point string — whole NFT units for spot */
  quantity: string
  timeInForce: TimeInForce
  /** ISO 8601 — required for GTD */
  expiresAt?: string
  /** Basis points. For market orders only. */
  slippageBps?: number
  clientOrderId?: string
}

export interface CancelOrderRequest {
  orderId: string
  marketId: string
}

export interface Fill {
  fillId: string
  orderId: string
  marketId: string
  side: OrderSide
  price: string
  quantity: string
  /** USDC settled amount */
  quoteQuantity: string
  /** Paid in USDC */
  fee: string
  /** 'maker' | 'taker' */
  liquidity: 'maker' | 'taker'
  tradedAt: string
}

export interface Order {
  id: string
  marketId: string
  /** Convenience — populated client-side */
  pair?: Pair
  side: OrderSide
  type: OrderType
  status: OrderStatus
  /** Fixed-point string */
  price: string
  /** Fixed-point string */
  quantity: string
  /** Fixed-point string */
  filledQuantity: string
  /** fixed-point string */
  remainingQuantity: string
  /** USDC value at limit price */
  total: string
  /** Total USDC fees paid across all fills */
  totalFees: string
  timeInForce: TimeInForce
  expiresAt?: string
  fills: Fill[]
  createdAt: string
  updatedAt: string
  /** Raw error from protocol if status is REJECTED */
  rejectReason?: string
}

/** Pre-submission fee estimate — never used for settlement */
export interface FeeEstimate {
  makerFee: string
  takerFee: string
  /** Estimated fee assuming taker execution */
  estimatedFee: string
  feeBps: number
  feePpm: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Trades (fills visible to all market participants)
// ─────────────────────────────────────────────────────────────────────────────

export interface PublicTrade {
  id: string
  marketId: string
  price: string
  quantity: string
  side: OrderSide
  tradedAt: string
}

/** Legacy shape — kept during migration */
export interface Trade {
  id: string
  price: number
  size: number
  side: OrderSide
  time: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio / balances
// ─────────────────────────────────────────────────────────────────────────────

export interface Balance {
  asset: string
  /** Total holdings */
  total: string
  /** Available (not locked in open orders) */
  available: string
  /** Locked in open orders */
  locked: string
  /** Pending settlement */
  pending: string
  /** USD-equivalent at last price */
  usdValue: string
}

export interface PortfolioPosition {
  marketId: string
  pair?: Pair
  side: OrderSide
  quantity: string
  entryPrice: string
  markPrice: string
  unrealizedPnl: string
  unrealizedPnlPct: string
  realizedPnl: string
  /** Perp only — not used Phase 1 */
  leverage?: number
  liquidationPrice?: string
  margin?: string
}

export interface PortfolioStats {
  equity: string
  availableBalance: string
  marginUsed: string
  unrealizedPnl: string
  realizedPnl: string
  allTimePnl: string
  totalFeePaid: string
  referralPoints: number
}

export interface PortfolioSnapshot {
  userId: string
  balances: Balance[]
  positions: PortfolioPosition[]
  stats: PortfolioStats
  fetchedAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth / access control
// ─────────────────────────────────────────────────────────────────────────────

export type AuthStep =
  | 'email'
  | 'verify'
  | 'access-code'
  | 'account-setup'
  | 'initial-funding'
  | 'welcome'

export type AccessCodeStatus = 'VALID' | 'INVALID' | 'ALREADY_USED' | 'EXPIRED'

export interface AccessCodeVerifyRequest {
  code: string
  email: string
}

export interface AccessCodeVerifyResponse {
  status: AccessCodeStatus
  /** Present only when status === 'VALID' */
  sessionToken?: string
  message?: string
}

export interface SignupRequest {
  email: string
  username: string
  accessCodeToken: string
}

export interface SignupResponse {
  userId: string
  username: string
  email: string
  referralCode: string
  sessionToken: string
  createdAt: string
}

export interface AuthSession {
  userId: string
  username: string
  email: string
  referralCode: string
  sessionToken: string
  isAuthenticated: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Referral
// ─────────────────────────────────────────────────────────────────────────────

export interface ReferralInfo {
  referralCode: string
  referralLink: string
  referralCount: number
  referredVolume: string
  referralPoints: number
  tier: number
  tierName: string
  nextTierPoints?: number
  referredUsers: ReferredUser[]
}

export interface ReferredUser {
  username: string
  joinedAt: string
  volume: string
  pointsEarned: number
  status: 'active' | 'inactive'
}

export interface ApplyReferralRequest {
  referralCode: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Drip (testnet USDC faucet)
// ─────────────────────────────────────────────────────────────────────────────

export type DripStatus =
  | 'ELIGIBLE'
  | 'ALREADY_CLAIMED'
  | 'PROCESSING'
  | 'CLAIMED'
  | 'UNAVAILABLE'

export interface DripStatusResponse {
  status: DripStatus
  amount?: string
  claimedAt?: string
  txSignature?: string
}

export interface DripClaimResponse {
  success: boolean
  status: DripStatus
  amount: string
  txSignature?: string
  message?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet
// ─────────────────────────────────────────────────────────────────────────────

export interface WalletInfo {
  address: string
  chain: string
  connected: boolean
  balance?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────────────────────────────────────

export type HealthStatus = 'ok' | 'degraded' | 'down' | 'unknown'

export interface ServiceHealth {
  name: string
  status: HealthStatus
  latencyMs?: number
  message?: string
}

export interface SystemHealth {
  overall: HealthStatus
  mode: 'local-api' | 'devnet-api' | 'staging' | 'production'
  chain: string
  apiUrl: string
  services: ServiceHealth[]
  checkedAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Squid Router types
// ─────────────────────────────────────────────────────────────────────────────

export interface SquidToken {
  address: string
  chainId: string | number
  decimals: number
  symbol: string
  name: string
  logoURI?: string
  usdPrice?: string
}

export interface SquidFeeCost {
  name: string
  description?: string
  token: SquidToken
  amount: string
  amountUSD?: string
  /** 'GasFee' | 'SwapFee' | 'IntegratorFee' */
  type: string
}

export interface SquidGasCost {
  type: string
  token: SquidToken
  amount: string
  amountUSD?: string
  gasLimit?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
}

export interface SquidHookCall {
  callType: number
  target: string
  value: string
  callData: string
  payload: {
    tokenAddress: string
    inputPos: number
  }
  estimatedGas: string
}

export interface SquidPreHook {
  chainType: string
  fundToken?: string
  fundAmount?: string
  calls: SquidHookCall[]
}

export interface SquidPostHook {
  chainType: string
  calls: SquidHookCall[]
  description?: string
  logoURI?: string
  name?: string
  provider?: string
}

export interface SquidHookValidationResult {
  valid: boolean
  errors: string[]
}

export interface SquidRouteRequest {
  fromAddress: string
  fromChain: string | number
  fromToken: string
  fromAmount: string
  toChain: string | number
  toToken: string
  toAddress: string
  slippageBps?: number
  /** Feature-flagged: VITE_SQUID_ENABLE_CORAL */
  enableBoost?: boolean
  /** Feature-flagged: VITE_SQUID_ENABLE_COLLECT_FEES */
  collectFees?: {
    integratorAddress: string
    integratorFee: string
  }
  preHook?: SquidPreHook
  postHook?: SquidPostHook
}

export type SquidTransactionType =
  | 'evm'
  | 'cosmos'
  | 'solana'
  | 'btc'
  | 'deposit_address'

export interface SquidTransactionRequest {
  type: SquidTransactionType
  target?: string
  data?: string
  value?: string
  gasLimit?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  /** Solana-specific */
  transaction?: string
  /** Deposit-address flow — see SquidDepositAddressResponse */
  depositAddress?: string
}

export interface SquidRouteResponse {
  route: {
    estimate: {
      fromAmount: string
      toAmount: string
      toAmountMin: string
      sendAmount: string
      exchangeRate: string
      estimatedRouteDuration: number
      feeCosts: SquidFeeCost[]
      gasCosts: SquidGasCost[]
    }
    transactionRequest: SquidTransactionRequest
    params: SquidRouteRequest
  }
  /** Present if Coral/Intents route — treat as opaque until needed */
  integratorData?: unknown
  /** Route expiry (Coral). Refresh quote if Date.now() > expiresAt */
  expiresAt?: number
}

export interface SquidDepositAddressResponse {
  depositAddress: string
  /** Chain the user must send from */
  fromChain: string | number
  fromToken: string
  /** Exact amount user must send — warn user to match precisely */
  fromAmount: string
  trackingId: string
  /** Route expiry timestamp (ms) */
  expiresAt?: number
}

export type SquidStatusType =
  | 'NOT_FOUND'
  | 'ONGOING'
  | 'PARTIAL_SUCCESS'
  | 'SUCCESS'
  | 'NEEDS_GAS'
  | 'REFUNDED'
  | 'CALL_BRIDGE_AND_CALL_FAILED'
  | 'EXPRESS_EXECUTED'

export interface SquidStatusResponse {
  id: string
  status: SquidStatusType
  fromChain?: {
    transactionId: string
    blockNumber?: number
  }
  toChain?: {
    transactionId?: string
    blockNumber?: number
    callEventStatus?: string
  }
  squidTransactionStatus?: string
  error?: {
    message: string
    errorType: string
  }
}

// Human-readable status for UI
export type SquidUiStatus =
  | 'idle'
  | 'quoting'
  | 'route_ready'
  | 'awaiting_deposit'
  | 'executing'
  | 'completed'
  | 'refunded'
  | 'failed'
  | 'expired'

// ─────────────────────────────────────────────────────────────────────────────
// API error shape
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  httpStatus?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic service response wrapper
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceResult<T> =
  | { ok: true;  data: T;         error?: never }
  | { ok: false; data?: never;    error: ApiError }

// ─────────────────────────────────────────────────────────────────────────────
// Legacy types kept for UI compatibility during migration
// ─────────────────────────────────────────────────────────────────────────────

export interface Position {
  pair: Pair
  side: OrderSide
  size: number
  entryPrice: number
  markPrice: number
  pnl: number
  pnlPct: number
  leverage?: number
  liquidationPrice?: number
  margin?: number
}

/** Legacy Order shape used by existing UI pages */
export interface LegacyOrder {
  id: string
  pair: Pair
  side: OrderSide
  type: OrderType
  status: LegacyOrderStatus
  price: number
  size: number
  filled: number
  remaining: number
  total: number
  timeInForce: TimeInForce
  createdAt: string
  updatedAt: string
}

export interface Trader {
  rank: number
  username: string
  volume: number
  pnl: number
  pnlPct: number
  winRate: number
  trades: number
  isCurrentUser?: boolean
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}
