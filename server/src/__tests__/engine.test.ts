/**
 * CLOB engine integration tests — Prisma-backed, runs against lnyq_test DB.
 *
 * These tests exercise the actual engine (placeOrder, cancelOrder) end-to-end
 * through PostgreSQL transactions. Pure-function logic is covered separately in
 * the frontend's clobEngine.test.ts reference spec.
 *
 * DB: postgresql://lnyq:lnyq@localhost:5432/lnyq_test
 * Set via vitest.config.ts test.env; picked up by the Prisma singleton in db.ts.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { PrismaClient }  from '@prisma/client'
import {
  placeOrder, cancelOrder,
  TAKER_FEE_BPS, MAKER_FEE_BPS, BPS_DIV,
} from '../engine.js'

// ── Test DB client ────────────────────────────────────────────────────────────
// Uses DATABASE_URL from vitest.config.ts test.env (lnyq_test).

const prisma = new PrismaClient()

// ── Test fixtures ─────────────────────────────────────────────────────────────

const TEST_MARKET_ID = 'TEST-USDC-SPOT'
const BUYER_ID       = 'test-buyer-1'
const SELLER_ID      = 'test-seller-1'
const MM_ID          = 'mm-bot'
const USDC           = 'USDC'
const BASE           = 'TEST'

async function seedMarket() {
  await prisma.collection.upsert({
    where:  { symbol: 'TEST' },
    update: {},
    create: { name: 'Test Asset', symbol: 'TEST', supply: 1_000_000, chain: 'solana', whitelistStatus: 'APPROVED' },
  })
  await prisma.market.upsert({
    where:  { id: TEST_MARKET_ID },
    update: { status: 'ACTIVE', referencePrice: 100 },
    create: {
      id: TEST_MARKET_ID, symbol: TEST_MARKET_ID,
      baseAsset: BASE, quoteAsset: USDC,
      displayName: 'TEST/USDC', type: 'spot', status: 'ACTIVE',
      referencePrice: 100, minOrderSize: 1, tickSize: '0.01',
    },
  })
}

async function seedUsers() {
  for (const id of [BUYER_ID, SELLER_ID]) {
    await prisma.user.upsert({
      where:  { id },
      update: {},
      create: { id, username: id, email: `${id}@test.com`, sessionToken: id, referralCode: id.slice(0, 8) },
    })
  }
  // MM bot user
  await prisma.user.upsert({
    where:  { id: MM_ID },
    update: {},
    create: { id: MM_ID, username: 'mm-bot', email: 'mm@test.com', sessionToken: 'mm', referralCode: 'mm-ref' },
  })
}

async function setBalance(userId: string, asset: string, available: number) {
  await prisma.balance.upsert({
    where:  { userId_asset: { userId, asset } },
    update: { available, locked: 0 },
    create: { userId, asset, available, locked: 0, pending: 0 },
  })
}

async function getBalance(userId: string, asset: string) {
  const b = await prisma.balance.findUnique({ where: { userId_asset: { userId, asset } } })
  return { available: Number(b?.available ?? 0), locked: Number(b?.locked ?? 0) }
}

async function cleanTestData() {
  await prisma.fill.deleteMany({ where: { marketId: TEST_MARKET_ID } })
  await prisma.trade.deleteMany({ where: { marketId: TEST_MARKET_ID } })
  await prisma.order.deleteMany({ where: { marketId: TEST_MARKET_ID } })
  await prisma.balance.deleteMany({ where: { userId: { in: [BUYER_ID, SELLER_ID] } } })
  await prisma.candle.deleteMany({ where: { marketId: TEST_MARKET_ID } })
  await prisma.market.update({ where: { id: TEST_MARKET_ID }, data: { referencePrice: 100 } })
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await seedMarket()
  await seedUsers()
})

afterEach(async () => {
  await cleanTestData()
})

afterAll(async () => {
  await prisma.market.delete({ where: { id: TEST_MARKET_ID } }).catch(() => {})
  await prisma.collection.delete({ where: { symbol: 'TEST' } }).catch(() => {})
  await prisma.user.deleteMany({ where: { id: { in: [BUYER_ID, SELLER_ID] } } }).catch(() => {})
  await prisma.$disconnect()
})

// ── Helpers ───────────────────────────────────────name──────────────────────────

function buy(qty: number, price?: number, tif: 'GTC'|'IOC'|'FOK' = 'GTC') {
  return placeOrder({ marketId: TEST_MARKET_ID, userId: BUYER_ID, side: 'buy', type: price ? 'limit' : 'market', price, quantity: qty, timeInForce: tif })
}
function sell(qty: number, price?: number, tif: 'GTC'|'IOC'|'FOK' = 'GTC') {
  return placeOrder({ marketId: TEST_MARKET_ID, userId: SELLER_ID, side: 'sell', type: price ? 'limit' : 'market', price, quantity: qty, timeInForce: tif })
}

// ── Input validation ──────────────────────────────────────────────────────────

describe('input validation', () => {
  it('rejects fractional quantity', async () => {
    await setBalance(BUYER_ID, USDC, 10000)
    const r = await placeOrder({ marketId: TEST_MARKET_ID, userId: BUYER_ID, side: 'buy', type: 'limit', price: 100, quantity: 1.5, timeInForce: 'GTC' })
    expect('error' in r).toBe(true)
    if ('error' in r) expect(r.error).toMatch(/integer/)
  })
  it('rejects zero quantity', async () => {
    await setBalance(BUYER_ID, USDC, 10000)
    const r = await placeOrder({ marketId: TEST_MARKET_ID, userId: BUYER_ID, side: 'buy', type: 'limit', price: 100, quantity: 0, timeInForce: 'GTC' })
    expect('error' in r).toBe(true)
  })
  it('rejects limit order with no price', async () => {
    await setBalance(BUYER_ID, USDC, 10000)
    const r = await placeOrder({ marketId: TEST_MARKET_ID, userId: BUYER_ID, side: 'buy', type: 'limit', quantity: 5, timeInForce: 'GTC' })
    expect('error' in r).toBe(true)
    if ('error' in r) expect(r.error).toMatch(/[Pp]rice/)
  })
  it('rejects order on non-existent market', async () => {
    const r = await placeOrder({ marketId: 'NO-SUCH-MARKET', userId: BUYER_ID, side: 'buy', type: 'limit', price: 100, quantity: 5, timeInForce: 'GTC' })
    expect('error' in r).toBe(true)
  })
})

// ── Balance locks ─────────────────────────────────────────────────────────────

describe('balance locks', () => {
  it('locks USDC from buyer on limit buy', async () => {
    await setBalance(BUYER_ID, USDC, 1000)
    const r = await buy(5, 100)
    expect('error' in r).toBe(false)
    const bal = await getBalance(BUYER_ID, USDC)
    // Locked = qty * price + taker fee (though limit orders lock at limit price)
    expect(bal.available).toBeLessThan(1000)
    expect(bal.locked).toBeGreaterThan(0)
  })
  it('locks base asset from seller on limit sell', async () => {
    await setBalance(SELLER_ID, BASE, 100)
    const r = await sell(5, 100)
    expect('error' in r).toBe(false)
    const bal = await getBalance(SELLER_ID, BASE)
    expect(bal.locked).toBe(5)
    expect(bal.available).toBe(95)
  })
  it('rejects buy when USDC balance is insufficient', async () => {
    await setBalance(BUYER_ID, USDC, 10)   // needs 500+ for 5 @ 100
    const r = await buy(5, 100)
    expect('error' in r).toBe(true)
    if ('error' in r) expect(r.error).toMatch(/[Ii]nsufficient|[Bb]alance/)
  })
  it('rejects sell when base balance is insufficient', async () => {
    await setBalance(SELLER_ID, BASE, 2)   // wants to sell 5
    const r = await sell(5, 100)
    expect('error' in r).toBe(true)
  })
  it('does not go negative: balance stays non-negative after rejection', async () => {
    await setBalance(BUYER_ID, USDC, 0)
    await buy(10, 100)
    const bal = await getBalance(BUYER_ID, USDC)
    expect(bal.available).toBeGreaterThanOrEqual(0)
    expect(bal.locked).toBeGreaterThanOrEqual(0)
  })
})

// ── GTC limit order matching ──────────────────────────────────────────────────

describe('GTC limit order matching', () => {
  it('full fill: buyer and seller both end up with correct balances', async () => {
    await setBalance(BUYER_ID,  USDC, 10000)
    await setBalance(SELLER_ID, BASE, 100)

    // Seller posts ask at 100
    const sellR = await sell(10, 100)
    expect('error' in sellR).toBe(false)

    // Buyer crosses ask
    const buyR = await buy(10, 100)
    expect('error' in buyR).toBe(false)
    if ('order' in buyR) expect(buyR.order.status).toMatch(/FILLED/)

    // Buyer should now have 10 TEST, less USDC (cost + taker fee)
    const buyerBase = await getBalance(BUYER_ID, BASE)
    expect(buyerBase.available).toBe(10)

    // Seller should now have more USDC (proceeds - maker fee), 0 locked BASE
    const sellerUsdc = await getBalance(SELLER_ID, USDC)
    expect(sellerUsdc.available).toBeGreaterThan(0)
    const sellerBase = await getBalance(SELLER_ID, BASE)
    expect(sellerBase.locked).toBe(0)
  })

  it('FIFO: earlier ask fills before later ask at same price', async () => {
    await setBalance(SELLER_ID, BASE, 100)
    await setBalance(BUYER_ID,  USDC, 10000)

    // MM posts two asks at 100 (FIFO: first posted fills first)
    const mmUserId = MM_ID
    await setBalance(mmUserId, BASE, 1000)
    const ask1 = await placeOrder({ marketId: TEST_MARKET_ID, userId: mmUserId, side: 'sell', type: 'limit', price: 100, quantity: 3, timeInForce: 'GTC' })
    const ask2 = await placeOrder({ marketId: TEST_MARKET_ID, userId: mmUserId, side: 'sell', type: 'limit', price: 100, quantity: 5, timeInForce: 'GTC' })
    expect('order' in ask1 && 'order' in ask2).toBe(true)

    // Buyer takes 3 units — should match ask1 first (FIFO)
    const buyR = await buy(3, 100)
    expect('error' in buyR).toBe(false)

    if ('order' in ask1) {
      const updated1 = await prisma.order.findUnique({ where: { id: (ask1 as { order: { id: string } }).order.id } })
      expect(updated1?.status).toBe('FILLED')
    }
    if ('order' in ask2) {
      const updated2 = await prisma.order.findUnique({ where: { id: (ask2 as { order: { id: string } }).order.id } })
      expect(updated2?.status).toBe('OPEN')  // ask2 untouched
    }
  })

  it('partial fill: resting order stays PARTIALLY_FILLED with correct remaining qty', async () => {
    await setBalance(BUYER_ID,  USDC, 10000)
    await setBalance(SELLER_ID, BASE, 100)

    // Seller posts 10, buyer takes 3
    const sellR = await sell(10, 100)
    await buy(3, 100)

    if ('order' in sellR) {
      const updated = await prisma.order.findUnique({ where: { id: (sellR as { order: { id: string } }).order.id } })
      expect(updated?.status).toBe('PARTIALLY_FILLED')
      expect(updated?.remainingQuantity).toBe(7)
      expect(updated?.filledQuantity).toBe(3)
    }
  })

  it('no fill when buy price < ask price', async () => {
    await setBalance(BUYER_ID,  USDC, 10000)
    await setBalance(SELLER_ID, BASE, 100)

    await sell(5, 105)          // ask at 105
    const buyR = await buy(5, 100)  // bid at 100 — should not cross

    expect('error' in buyR).toBe(false)
    if ('order' in buyR) {
      expect(buyR.order.status).toBe('OPEN')
    }
  })
})

// ── Market orders ─────────────────────────────────────────────────────────────

describe('market orders', () => {
  it('market buy fills against resting asks', async () => {
    await setBalance(SELLER_ID, BASE, 100)
    await setBalance(BUYER_ID,  USDC, 10000)

    await sell(5, 100)  // post ask

    const r = await buy(5)  // market buy
    expect('error' in r).toBe(false)
    if ('order' in r) expect(r.order.status).toMatch(/FILLED/)
  })

  it('market buy against empty book leaves order OPEN (unfilled)', async () => {
    await setBalance(BUYER_ID, USDC, 10000)
    // No resting asks
    const r = await buy(5)
    expect('error' in r).toBe(false)
    if ('order' in r) {
      // Market order with no liquidity stays open at 0 fill
      expect(r.order.filledQuantity).toBe(0)
    }
  })
})

// ── IOC orders ────────────────────────────────────────────────────────────────

describe('IOC (Immediate-Or-Cancel)', () => {
  it('IOC fills what it can and cancels the rest', async () => {
    await setBalance(SELLER_ID, BASE, 100)
    await setBalance(BUYER_ID,  USDC, 10000)

    await sell(3, 100)  // only 3 units available

    // IOC buy for 5: should fill 3 and cancel remaining 2
    const r = await placeOrder({ marketId: TEST_MARKET_ID, userId: BUYER_ID, side: 'buy', type: 'limit', price: 100, quantity: 5, timeInForce: 'IOC' })
    expect('error' in r).toBe(false)
    if ('order' in r) {
      expect(r.order.filledQuantity).toBe(3)
      expect(r.order.status).toMatch(/CANCELLED|PARTIALLY_FILLED|FILLED/)
    }
  })

  it('IOC with no matching liquidity cancels immediately', async () => {
    await setBalance(BUYER_ID, USDC, 10000)
    // No asks
    const r = await placeOrder({ marketId: TEST_MARKET_ID, userId: BUYER_ID, side: 'buy', type: 'limit', price: 100, quantity: 5, timeInForce: 'IOC' })
    expect('error' in r).toBe(false)
    if ('order' in r) {
      expect(r.order.filledQuantity).toBe(0)
      expect(r.order.status).toBe('CANCELLED')
    }
  })
})

// ── FOK orders ────────────────────────────────────────────────────────────────

describe('FOK (Fill-Or-Kill)', () => {
  it('FOK fills completely when liquidity is sufficient', async () => {
    await setBalance(SELLER_ID, BASE, 100)
    await setBalance(BUYER_ID,  USDC, 10000)

    await sell(10, 100)

    const r = await placeOrder({ marketId: TEST_MARKET_ID, userId: BUYER_ID, side: 'buy', type: 'limit', price: 100, quantity: 5, timeInForce: 'FOK' })
    expect('error' in r).toBe(false)
    if ('order' in r) expect(r.order.status).toBe('FILLED')
  })

  it('FOK is rejected when liquidity is insufficient', async () => {
    await setBalance(SELLER_ID, BASE, 100)
    await setBalance(BUYER_ID,  USDC, 10000)

    await sell(3, 100)  // only 3 available

    const r = await placeOrder({ marketId: TEST_MARKET_ID, userId: BUYER_ID, side: 'buy', type: 'limit', price: 100, quantity: 5, timeInForce: 'FOK' })
    // Either an error or an order with 0 fills and CANCELLED status
    if ('error' in r) {
      expect(r.error).toMatch(/FOK|insufficient/i)
    } else {
      expect(r.order.filledQuantity).toBe(0)
    }
  })
})

// ── Cancel order ──────────────────────────────────────────────────────────────

describe('cancelOrder', () => {
  it('cancels an open order and releases locked balance', async () => {
    await setBalance(SELLER_ID, BASE, 100)

    const sellR = await sell(5, 100)
    expect('order' in sellR).toBe(true)

    const lockedBefore = (await getBalance(SELLER_ID, BASE)).locked
    expect(lockedBefore).toBe(5)

    if ('order' in sellR) {
      await cancelOrder((sellR as { order: { id: string } }).order.id, SELLER_ID)
    }

    const lockedAfter = (await getBalance(SELLER_ID, BASE)).locked
    expect(lockedAfter).toBe(0)

    const availAfter = (await getBalance(SELLER_ID, BASE)).available
    expect(availAfter).toBe(100)  // fully restored
  })

  it('cannot cancel another user\'s order', async () => {
    await setBalance(SELLER_ID, BASE, 100)
    const sellR = await sell(5, 100)
    if ('order' in sellR) {
      const r = await cancelOrder((sellR as { order: { id: string } }).order.id, BUYER_ID)
      expect('error' in r).toBe(true)
    }
  })
})

// ── Fee exactness ─────────────────────────────────────────────────────────────

describe('fee exactness', () => {
  it('taker pays correct fee and net balance is consistent', async () => {
    const price  = 100
    const qty    = 10
    const notional = price * qty       // 1000
    const expectedTakerFee = Math.round(notional * TAKER_FEE_BPS / BPS_DIV * 100) / 100  // 2.50

    await setBalance(BUYER_ID,  USDC, 10000)
    await setBalance(SELLER_ID, BASE, 100)

    await sell(qty, price)
    const usdcBefore = await getBalance(BUYER_ID, USDC)
    await buy(qty, price)
    const usdcAfter = await getBalance(BUYER_ID, USDC)

    const spent = usdcBefore.available + usdcBefore.locked - (usdcAfter.available + usdcAfter.locked)
    // Spent = notional + taker fee
    expect(spent).toBeCloseTo(notional + expectedTakerFee, 2)
  })

  it('maker receives correct proceeds after fee deduction', async () => {
    const price  = 100
    const qty    = 10
    const notional = price * qty
    const expectedMakerFee = Math.round(notional * MAKER_FEE_BPS / BPS_DIV * 100) / 100  // 0.50

    await setBalance(BUYER_ID,  USDC, 10000)
    await setBalance(SELLER_ID, BASE, 100)

    await sell(qty, price)
    await buy(qty, price)

    const sellerUsdc = await getBalance(SELLER_ID, USDC)
    expect(sellerUsdc.available).toBeCloseTo(notional - expectedMakerFee, 2)
  })
})

// ── Self-trade prevention ─────────────────────────────────────────────────────

describe('self-trade prevention', () => {
  it('same user buy and sell at same price do not fill each other', async () => {
    // Give buyer both USDC and BASE so they can post both sides
    await setBalance(BUYER_ID, USDC, 10000)
    await setBalance(BUYER_ID, BASE, 100)

    // Post a sell as the buyer
    const sellR = await placeOrder({ marketId: TEST_MARKET_ID, userId: BUYER_ID, side: 'sell', type: 'limit', price: 100, quantity: 5, timeInForce: 'GTC' })
    expect('order' in sellR).toBe(true)

    // Now post a buy as the same user — should NOT fill against own order
    const buyR = await placeOrder({ marketId: TEST_MARKET_ID, userId: BUYER_ID, side: 'buy', type: 'limit', price: 100, quantity: 5, timeInForce: 'GTC' })
    expect('error' in buyR).toBe(false)

    if ('order' in buyR) {
      // Buy order should remain open, not filled against own sell
      expect(buyR.order.filledQuantity).toBe(0)
    }
  })
})

// ── GTD (Good-Till-Date) ──────────────────────────────────────────────────────

describe('GTD (Good-Till-Date)', () => {
  it('GTD order with future expiry is accepted and stays open', async () => {
    await setBalance(BUYER_ID, USDC, 10000)
    const futureExpiry = new Date(Date.now() + 3_600_000)  // 1 hour from now
    const r = await placeOrder({
      marketId: TEST_MARKET_ID, userId: BUYER_ID,
      side: 'buy', type: 'limit', price: 95, quantity: 5,
      timeInForce: 'GTD', expiresAt: futureExpiry,
    })
    expect('error' in r).toBe(false)
    if ('order' in r) {
      expect(r.order.status).toBe('OPEN')
      expect(r.order.timeInForce).toBe('GTD')
    }
  })
})
