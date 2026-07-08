// ── Core types shared across the sim server ────────────────────────────────

export type OrderSide = 'buy' | 'sell'
export type OrderType = 'limit' | 'market'
export type TIF = 'GTC' | 'IOC' | 'FOK' | 'GTD'
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'EXPIRED' | 'REJECTED'
export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1D'

export interface Market {
  id: string
  baseAsset: string
  quoteAsset: string
  type: 'spot' | 'perp'
  displayName: string
  isActive: boolean
  minOrderSize: number
  tickSize: number
  referencePrice: number
}

export interface Order {
  id: string
  marketId: string
  userId: string
  side: OrderSide
  type: OrderType
  price: number
  quantity: number
  filledQuantity: number
  remainingQuantity: number
  status: OrderStatus
  timeInForce: TIF
  expiresAt?: number
  createdAt: number
  updatedAt: number
  isMM?: boolean  // true = market maker order, excluded from user portfolio
}

export interface Fill {
  id: string
  tradeId: string
  orderId: string
  counterOrderId: string
  marketId: string
  userId: string
  side: OrderSide
  price: number
  quantity: number
  fee: number
  isTaker: boolean
  createdAt: number
}

export interface Trade {
  id: string
  marketId: string
  price: number
  quantity: number
  takerSide: OrderSide
  buyOrderId: string
  sellOrderId: string
  createdAt: number
}

export interface Candle {
  marketId: string
  interval: CandleInterval
  time: number     // unix ms, floored to interval
  open: number
  high: number
  low: number
  close: number
  volume: number   // USDC notional
  trades: number
}

export interface Balance {
  userId: string
  asset: string
  available: number
  locked: number
}

export interface User {
  id: string
  email: string
  username: string
  passwordHash: string
  referralCode: string
  referredBy?: string
  referralPoints: number
  dripClaimed: boolean
  sessionToken: string
  createdAt: number
}

export interface AccessCode {
  code: string
  used: boolean
  usedBy?: string
  usedAt?: number
}

export interface PlaceOrderRequest {
  marketId: string
  userId: string
  side: OrderSide
  type: OrderType
  price?: number
  quantity: number
  timeInForce: TIF
  expiresAt?: number
}

export interface OrderResult {
  order: Order
  fills: Fill[]
  trades: Trade[]
}

// WebSocket message shapes
export interface WsOrderBookMsg {
  type: 'orderbook'
  marketId: string
  bids: [number, number][]   // [price, totalQty]
  asks: [number, number][]
  spread: number
  midpoint: number
}

export interface WsTradeMsg {
  type: 'trade'
  marketId: string
  trade: Trade
}

export interface WsCandleMsg {
  type: 'candle'
  marketId: string
  interval: CandleInterval
  candle: Candle
}

export interface WsOrderMsg {
  type: 'order'
  userId: string
  order: Order
}

export interface WsPortfolioMsg {
  type: 'portfolio'
  userId: string
  balances: Balance[]
}

export type WsMsg = WsOrderBookMsg | WsTradeMsg | WsCandleMsg | WsOrderMsg | WsPortfolioMsg
