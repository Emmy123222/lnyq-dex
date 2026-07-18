/**
 * CLOB engine pure-function tests.
 *
 * The matching engine (engine.ts) is Prisma-dependent, so full integration tests
 * require a live database and belong in a separate server-level test suite.
 * These tests cover exported pure functions and the matching logic extracted
 * here as a reference spec.
 */
import { describe, it, expect } from 'vitest'

// ── Liquidation price formula ─────────────────────────────────────────────────
// Mirrors engine.ts:calcLiquidationPrice (MAINTENANCE_MARGIN_RATE = 0.05)

const MAINTENANCE_MARGIN_RATE = 0.05

function calcLiquidationPrice(side: 'long' | 'short', entry: number, leverage: number): number {
  const lev = Math.min(Math.max(1, leverage), 20)
  return side === 'long'
    ? entry * (1 - 1 / lev + MAINTENANCE_MARGIN_RATE)
    : entry * (1 + 1 / lev - MAINTENANCE_MARGIN_RATE)
}

describe('calcLiquidationPrice', () => {
  it('long 1x position: liq price ≈ 5% above entry (maintenance margin)', () => {
    // lev=1: 1 - 1/1 + 0.05 = 0.05 → liq = entry * 0.05
    expect(calcLiquidationPrice('long', 100, 1)).toBeCloseTo(5)
  })
  it('long 10x position: liq price is just below entry', () => {
    // lev=10: 1 - 1/10 + 0.05 = 0.95 → liq = 95
    expect(calcLiquidationPrice('long', 100, 10)).toBeCloseTo(95)
  })
  it('short 10x position: liq price is just above entry', () => {
    // lev=10: 1 + 1/10 - 0.05 = 1.05 → liq = 105
    expect(calcLiquidationPrice('short', 100, 10)).toBeCloseTo(105)
  })
  it('caps leverage at 20x', () => {
    const at20 = calcLiquidationPrice('long', 100, 20)
    const at50 = calcLiquidationPrice('long', 100, 50)
    expect(at50).toBeCloseTo(at20)
  })
  it('floors leverage at 1x', () => {
    const at1 = calcLiquidationPrice('long', 100, 1)
    const at0 = calcLiquidationPrice('long', 100, 0)
    expect(at0).toBeCloseTo(at1)
  })
  it('long liq price is at or below entry (≤ entry at max leverage 20x)', () => {
    // At lev=20: 1 - 1/20 + 0.05 = 1.0 → liq = entry (edge case: immediate liq)
    for (const lev of [2, 5, 10, 20]) {
      expect(calcLiquidationPrice('long', 100, lev)).toBeLessThanOrEqual(100)
    }
    // Below max leverage: strictly less than entry
    for (const lev of [2, 5, 10]) {
      expect(calcLiquidationPrice('long', 100, lev)).toBeLessThan(100)
    }
  })
  it('short liq price is at or above entry (≥ entry at max leverage 20x)', () => {
    // At lev=20: 1 + 1/20 - 0.05 = 1.0 → liq = entry (edge case)
    for (const lev of [2, 5, 10, 20]) {
      expect(calcLiquidationPrice('short', 100, lev)).toBeGreaterThanOrEqual(100)
    }
    // Below max leverage: strictly greater than entry
    for (const lev of [2, 5, 10]) {
      expect(calcLiquidationPrice('short', 100, lev)).toBeGreaterThan(100)
    }
  })
})

// ── Fee calculation (mirrors engine.ts:calcFee) ───────────────────────────────

const BPS_DIV = 10_000
const TAKER_FEE_BPS = 25  // 0.25%
const MAKER_FEE_BPS = 5   // 0.05%

function calcFee(notional: number, bps: number): number {
  return Math.round((notional * bps / BPS_DIV) * 100) / 100
}

describe('fee calculation', () => {
  it('taker fee on $100 notional: 0.25%', () => {
    expect(calcFee(100, TAKER_FEE_BPS)).toBe(0.25)
  })
  it('maker fee on $100 notional: 0.05%', () => {
    expect(calcFee(100, MAKER_FEE_BPS)).toBe(0.05)
  })
  it('taker fee on $1000 notional: $2.50', () => {
    expect(calcFee(1000, TAKER_FEE_BPS)).toBe(2.5)
  })
  it('rounds to 2 decimal places', () => {
    // 74.95 * 25 / 10000 = 0.186875 → rounds to 0.19
    expect(calcFee(74.95, TAKER_FEE_BPS)).toBe(0.19)
  })
  it('zero notional gives zero fee', () => {
    expect(calcFee(0, TAKER_FEE_BPS)).toBe(0)
  })
})

// ── Order validation guards (mirror engine.ts:placeOrder guards) ──────────────

describe('order input validation', () => {
  function validateOrderInput(quantity: number, type: 'limit' | 'market', price?: number): string | null {
    if (quantity < 1 || !Number.isInteger(quantity)) return 'Quantity must be a positive integer'
    if (type === 'limit' && (!price || price <= 0)) return 'Price required for limit orders'
    return null
  }

  it('accepts valid limit order', () => {
    expect(validateOrderInput(5, 'limit', 74.50)).toBeNull()
  })
  it('accepts valid market order (no price required)', () => {
    expect(validateOrderInput(5, 'market')).toBeNull()
  })
  it('rejects fractional quantity', () => {
    expect(validateOrderInput(1.5, 'limit', 74.50)).toBe('Quantity must be a positive integer')
  })
  it('rejects zero quantity', () => {
    expect(validateOrderInput(0, 'limit', 74.50)).toBe('Quantity must be a positive integer')
  })
  it('rejects negative quantity', () => {
    expect(validateOrderInput(-1, 'limit', 74.50)).toBe('Quantity must be a positive integer')
  })
  it('rejects limit order with zero price', () => {
    expect(validateOrderInput(5, 'limit', 0)).toBe('Price required for limit orders')
  })
  it('rejects limit order with negative price', () => {
    expect(validateOrderInput(5, 'limit', -1)).toBe('Price required for limit orders')
  })
  it('rejects limit order with no price', () => {
    expect(validateOrderInput(5, 'limit', undefined)).toBe('Price required for limit orders')
  })
})

// ── Price-time priority matching (pure matching logic reference) ──────────────
//
// These tests document the expected matching behavior as a spec.
// The actual engine executes inside a Prisma transaction; these tests use
// an in-memory simulation of the same logic.

interface Order {
  id: string
  side: 'buy' | 'sell'
  type: 'limit' | 'market'
  price: number
  quantity: number
  remainingQty: number
  timeInForce: 'GTC' | 'IOC' | 'FOK'
  createdAt: number
}

interface Fill {
  takerOrderId: string
  makerOrderId: string
  price: number
  quantity: number
}

function match(
  incoming: Order,
  restingOrders: Order[],
): { fills: Fill[]; remainingQty: number } {
  const fills: Fill[] = []
  let remaining = incoming.remainingQty

  // Sort resting orders by price-time priority
  const sorted = [...restingOrders].sort((a, b) => {
    if (incoming.side === 'buy') {
      // Taker is buyer: match against lowest ask first
      if (a.price !== b.price) return a.price - b.price
    } else {
      // Taker is seller: match against highest bid first
      if (a.price !== b.price) return b.price - a.price
    }
    return a.createdAt - b.createdAt  // FIFO for same price
  })

  for (const resting of sorted) {
    if (remaining <= 0) break
    // Price check
    if (incoming.type === 'limit') {
      if (incoming.side === 'buy'  && resting.price > incoming.price) break
      if (incoming.side === 'sell' && resting.price < incoming.price) break
    }
    const fillQty = Math.min(remaining, resting.remainingQty)
    fills.push({ takerOrderId: incoming.id, makerOrderId: resting.id, price: resting.price, quantity: fillQty })
    remaining -= fillQty
  }

  return { fills, remainingQty: remaining }
}

describe('price-time priority matching', () => {
  const askOrders: Order[] = [
    { id: 'ask1', side: 'sell', type: 'limit', price: 100, quantity: 5, remainingQty: 5, timeInForce: 'GTC', createdAt: 1 },
    { id: 'ask2', side: 'sell', type: 'limit', price: 101, quantity: 3, remainingQty: 3, timeInForce: 'GTC', createdAt: 2 },
    { id: 'ask3', side: 'sell', type: 'limit', price: 100, quantity: 2, remainingQty: 2, timeInForce: 'GTC', createdAt: 3 },
  ]

  it('limit buy fills at best ask price', () => {
    const { fills } = match(
      { id: 'buy1', side: 'buy', type: 'limit', price: 102, quantity: 3, remainingQty: 3, timeInForce: 'GTC', createdAt: 4 },
      askOrders,
    )
    expect(fills[0].price).toBe(100)  // best ask
    expect(fills[0].quantity).toBe(3)
  })

  it('FIFO for same price: earlier order fills first', () => {
    const { fills } = match(
      { id: 'buy2', side: 'buy', type: 'limit', price: 100, quantity: 6, remainingQty: 6, timeInForce: 'GTC', createdAt: 5 },
      askOrders,
    )
    // ask1 (5 qty) fills first, then ask3 (1 of 2 qty)
    expect(fills[0].makerOrderId).toBe('ask1')
    expect(fills[0].quantity).toBe(5)
    expect(fills[1].makerOrderId).toBe('ask3')
    expect(fills[1].quantity).toBe(1)
  })

  it('limit buy does not cross at price above limit', () => {
    const { fills, remainingQty } = match(
      { id: 'buy3', side: 'buy', type: 'limit', price: 99, quantity: 5, remainingQty: 5, timeInForce: 'GTC', createdAt: 6 },
      askOrders,
    )
    expect(fills).toHaveLength(0)
    expect(remainingQty).toBe(5)
  })

  it('partial fill leaves correct remaining quantity', () => {
    const { fills, remainingQty } = match(
      { id: 'buy4', side: 'buy', type: 'limit', price: 100, quantity: 3, remainingQty: 3, timeInForce: 'GTC', createdAt: 7 },
      askOrders,
    )
    expect(fills[0].quantity).toBe(3)
    expect(remainingQty).toBe(0)
  })

  it('market buy fills regardless of price', () => {
    const { fills } = match(
      { id: 'buy5', side: 'buy', type: 'market', price: 0, quantity: 4, remainingQty: 4, timeInForce: 'GTC', createdAt: 8 },
      askOrders,
    )
    expect(fills.length).toBeGreaterThan(0)
    const totalFilled = fills.reduce((s, f) => s + f.quantity, 0)
    expect(totalFilled).toBe(4)
  })

  it('full fill: remaining quantity is 0 after full match', () => {
    const { fills, remainingQty } = match(
      { id: 'buy6', side: 'buy', type: 'limit', price: 101, quantity: 5, remainingQty: 5, timeInForce: 'GTC', createdAt: 9 },
      [{ id: 'ask4', side: 'sell', type: 'limit', price: 100, quantity: 5, remainingQty: 5, timeInForce: 'GTC', createdAt: 1 }],
    )
    expect(fills).toHaveLength(1)
    expect(fills[0].quantity).toBe(5)
    expect(remainingQty).toBe(0)
  })
})

// ── Sequence gap detection logic ──────────────────────────────────────────────

describe('orderbook sequence gap detection', () => {
  function detectGap(lastSeq: number, incomingSeq: number): boolean {
    if (lastSeq === -1 || incomingSeq === -1) return false
    return incomingSeq > lastSeq + 1
  }

  it('no gap on first message (lastSeq=-1)', () => {
    expect(detectGap(-1, 1)).toBe(false)
  })
  it('no gap on consecutive sequences', () => {
    expect(detectGap(5, 6)).toBe(false)
  })
  it('detects gap when seq jumps by 2', () => {
    expect(detectGap(5, 7)).toBe(true)
  })
  it('detects gap when seq jumps by more than 2', () => {
    expect(detectGap(3, 10)).toBe(true)
  })
  it('no gap when incoming has no seqNum (-1)', () => {
    expect(detectGap(5, -1)).toBe(false)
  })
  it('no gap on retry (same seq received twice)', () => {
    // Same seqNum seen again: not a gap (could be a retransmit)
    expect(detectGap(5, 5)).toBe(false)
  })
})
