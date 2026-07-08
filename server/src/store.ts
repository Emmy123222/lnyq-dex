/**
 * In-memory store for the LNYQ local simulation server.
 * Single source of truth. Mutated by engine.ts.
 * Optionally persisted to store.json on disk.
 */

import { randomUUID } from 'crypto'
import type { Market, Order, Fill, Trade, Candle, Balance, User, AccessCode, CandleInterval } from './types.js'

// ── Constants ─────────────────────────────────────────────────────────────────

export const MM_USER_ID = 'mm-bot'
export const SIM_PORT   = 3001

// Fee schedule (bps)
export const TAKER_FEE_BPS = 25   // 0.25%
export const MAKER_FEE_BPS = 5    // 0.05%
export const BPS_DIV       = 10_000

// ── Access code generation ────────────────────────────────────────────────────

function generateCodes(): Map<string, AccessCode> {
  const m = new Map<string, AccessCode>()
  // 1000 numbered testnet codes
  for (let i = 1; i <= 1000; i++) {
    const code = `LNYQ-TESTNET-${String(i).padStart(4, '0')}`
    m.set(code, { code, used: false })
  }
  // Alpha batch
  for (let i = 1; i <= 100; i++) {
    const code = `ALPHA-${String(i).padStart(4, '0')}`
    m.set(code, { code, used: false })
  }
  // Demo codes (always available in sim)
  for (const code of ['DEMO-ACCESS', 'LNYQ-DEMO', 'TEST-0001', 'TEST-0002', 'TEST-0003']) {
    m.set(code, { code, used: false })
  }
  return m
}

// ── Store class ───────────────────────────────────────────────────────────────

class Store {
  markets   = new Map<string, Market>()
  users     = new Map<string, User>()            // userId → User
  byEmail   = new Map<string, User>()            // email → User
  bySession = new Map<string, User>()            // sessionToken → User
  byRef     = new Map<string, User>()            // referralCode → User
  codes     = new Map<string, AccessCode>()      // code → AccessCode
  orders    = new Map<string, Order>()           // orderId → Order
  fills     = new Map<string, Fill[]>()          // orderId → Fill[]
  trades    = new Map<string, Trade[]>()         // marketId → Trade[]
  candles   = new Map<string, Candle>()          // `${marketId}:${interval}:${time}` → Candle
  balances  = new Map<string, Balance>()         // `${userId}:${asset}` → Balance

  // Open orders per market per side (sorted, price-time priority)
  bids      = new Map<string, Order[]>()         // marketId → sorted bids (price DESC)
  asks      = new Map<string, Order[]>()         // marketId → sorted asks (price ASC)

  constructor() {
    this.codes = generateCodes()
    this._seedMarkets()
    this._seedMMBot()
  }

  private _seedMarkets() {
    const MARKETS: Market[] = [
      {
        id: 'LNYQNFT-USDC-SPOT',
        baseAsset: 'LNYQNFT',
        quoteAsset: 'USDC',
        type: 'spot',
        displayName: 'LNYQNFT / USDC',
        isActive: true,
        minOrderSize: 1,
        tickSize: 0.01,
        referencePrice: 2452.50,
      },
      {
        id: 'THEGOOMAN-USDC-SPOT',
        baseAsset: 'THEGOOMAN',
        quoteAsset: 'USDC',
        type: 'spot',
        displayName: 'THEGOOMAN / USDC',
        isActive: true,
        minOrderSize: 1,
        tickSize: 0.01,
        referencePrice: 946.20,
      },
    ]
    for (const m of MARKETS) {
      this.markets.set(m.id, m)
      this.bids.set(m.id, [])
      this.asks.set(m.id, [])
      this.trades.set(m.id, [])
    }
  }

  private _seedMMBot() {
    // MM bot has unlimited USDC and NFT balances
    this.setBalance(MM_USER_ID, 'USDC', 999_999_999, 0)
    for (const market of this.markets.values()) {
      if (market.type === 'spot') {
        this.setBalance(MM_USER_ID, market.baseAsset, 999_999, 0)
      }
    }
  }

  // ── Balance helpers ──────────────────────────────────────────────────────────

  balanceKey(userId: string, asset: string) { return `${userId}:${asset}` }

  getBalance(userId: string, asset: string): Balance {
    const key = this.balanceKey(userId, asset)
    if (!this.balances.has(key)) {
      this.balances.set(key, { userId, asset, available: 0, locked: 0 })
    }
    return this.balances.get(key)!
  }

  setBalance(userId: string, asset: string, available: number, locked: number) {
    const key = this.balanceKey(userId, asset)
    this.balances.set(key, { userId, asset, available, locked })
  }

  lockBalance(userId: string, asset: string, amount: number): boolean {
    const b = this.getBalance(userId, asset)
    if (b.available < amount) return false
    b.available -= amount
    b.locked    += amount
    return true
  }

  unlockBalance(userId: string, asset: string, amount: number) {
    const b = this.getBalance(userId, asset)
    b.locked    = Math.max(0, b.locked - amount)
    b.available += amount
  }

  creditBalance(userId: string, asset: string, amount: number) {
    const b = this.getBalance(userId, asset)
    b.available += amount
  }

  debitLocked(userId: string, asset: string, amount: number) {
    const b = this.getBalance(userId, asset)
    b.locked = Math.max(0, b.locked - amount)
  }

  getBalancesForUser(userId: string): Balance[] {
    return [...this.balances.values()].filter(b => b.userId === userId)
  }

  // ── Order helpers ────────────────────────────────────────────────────────────

  saveOrder(order: Order) {
    this.orders.set(order.id, order)
  }

  getOpenOrdersForUser(userId: string): Order[] {
    return [...this.orders.values()].filter(o =>
      o.userId === userId &&
      !o.isMM &&
      (o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED' || o.status === 'PENDING')
    ).sort((a, b) => b.createdAt - a.createdAt)
  }

  getOrderHistoryForUser(userId: string): Order[] {
    return [...this.orders.values()].filter(o =>
      o.userId === userId &&
      !o.isMM &&
      (o.status === 'FILLED' || o.status === 'CANCELLED' || o.status === 'EXPIRED' || o.status === 'REJECTED')
    ).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  getFillsForUser(userId: string): Fill[] {
    const all: Fill[] = []
    for (const fills of this.fills.values()) {
      for (const f of fills) {
        if (f.userId === userId) all.push(f)
      }
    }
    return all.sort((a, b) => b.createdAt - a.createdAt)
  }

  // ── Trade helpers ────────────────────────────────────────────────────────────

  addTrade(trade: Trade) {
    const list = this.trades.get(trade.marketId) ?? []
    list.unshift(trade)
    if (list.length > 500) list.length = 500  // cap
    this.trades.set(trade.marketId, list)
    // Update reference price on the market
    const market = this.markets.get(trade.marketId)
    if (market) market.referencePrice = trade.price
  }

  getRecentTrades(marketId: string, limit = 50): Trade[] {
    return (this.trades.get(marketId) ?? []).slice(0, limit)
  }

  // ── Candle helpers ───────────────────────────────────────────────────────────

  candleKey(marketId: string, interval: CandleInterval, time: number) {
    return `${marketId}:${interval}:${time}`
  }

  updateCandle(marketId: string, interval: CandleInterval, price: number, qty: number, tradeTime: number): Candle {
    const ms      = INTERVAL_MS[interval]
    const bucketT = Math.floor(tradeTime / ms) * ms
    const key     = this.candleKey(marketId, interval, bucketT)
    let c = this.candles.get(key)
    if (!c) {
      c = { marketId, interval, time: bucketT, open: price, high: price, low: price, close: price, volume: 0, trades: 0 }
    } else {
      c.high  = Math.max(c.high, price)
      c.low   = Math.min(c.low, price)
      c.close = price
    }
    c.volume += price * qty
    c.trades++
    this.candles.set(key, c)
    return c
  }

  getCandles(marketId: string, interval: CandleInterval, limit = 200): Candle[] {
    const result: Candle[] = []
    for (const [key, candle] of this.candles) {
      if (key.startsWith(`${marketId}:${interval}:`)) result.push(candle)
    }
    result.sort((a, b) => a.time - b.time)
    return result.slice(-limit)
  }

  // ── User helpers ─────────────────────────────────────────────────────────────

  newId() { return randomUUID() }

  newReferralCode(): string {
    return 'REF-' + Math.random().toString(36).slice(2, 8).toUpperCase()
  }

  newSessionToken(): string {
    return randomUUID()
  }
}

export const INTERVAL_MS: Record<CandleInterval, number> = {
  '1m':  60_000,
  '5m':  300_000,
  '15m': 900_000,
  '1h':  3_600_000,
  '4h':  14_400_000,
  '1D':  86_400_000,
}

export const CANDLE_INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1D']

export const store = new Store()
