export type OrderSide = 'buy' | 'sell'
export type OrderType = 'limit' | 'market'
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTD'
export type MarketType = 'spot' | 'perp'

export interface OrderBookLevel {
  price: number
  size: number
  total: number
}

export interface Trade {
  id: string
  price: number
  size: number
  side: OrderSide
  time: string
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

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

export interface Order {
  id: string
  pair: Pair
  side: OrderSide
  type: OrderType
  status: 'open' | 'filled' | 'cancelled' | 'partial'
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

export type AuthStep =
  | 'email'
  | 'verify'
  | 'access-code'
  | 'account-setup'
  | 'initial-funding'
  | 'welcome'
