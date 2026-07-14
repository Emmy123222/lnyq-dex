/**
 * Market Maker — Prisma-backed.
 *
 * Maintains live CLOB liquidity for both spot and perp markets.
 * Also runs the hourly funding rate calculation + position settlement.
 *
 * NOT real trading. NOT real settlement. No smart contracts.
 */

import { prisma }      from './db.js'
import {
  placeOrder, cancelOrder, updatePositionMarkPrices,
  MM_USER_ID, CANDLE_INTERVALS, INTERVAL_MS,
} from './engine.js'

const SPREAD_PCT  = 0.003   // 0.3% total spread
const LEVEL_PCT   = 0.001   // 0.1% between levels
const LEVELS      = 5
const REQUOTE_MS  = 8_000
const FUNDING_INTERVAL_MS = 3_600_000  // 1 hour

// Funding rate bounds per 8h period (±0.075%)
const MAX_FUNDING_RATE = 0.00075
const MIN_FUNDING_RATE = -0.00075

// ── MM helpers ────────────────────────────────────────────────────────────────

async function cancelAllMMOrders(marketId: string) {
  const open = await prisma.order.findMany({
    where:  { marketId, userId: MM_USER_ID, status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
    select: { id: true },
  })
  for (const { id } of open) {
    await cancelOrder(id, 'admin')
  }
}

async function requote(marketId: string) {
  const market = await prisma.market.findUnique({ where: { id: marketId } })
  if (!market || market.status !== 'ACTIVE') return

  await cancelAllMMOrders(marketId)

  const ref  = Number(market.referencePrice)
  const half = ref * SPREAD_PCT / 2

  for (let i = 0; i < LEVELS; i++) {
    const bidPrice = parseFloat((ref - half - i * ref * LEVEL_PCT).toFixed(2))
    const askPrice = parseFloat((ref + half + i * ref * LEVEL_PCT).toFixed(2))
    const qty      = 2 + i  // 2, 3, 4, 5, 6 per level

    const bidResult = await placeOrder({
      marketId, userId: MM_USER_ID, side: 'buy', type: 'limit',
      price: bidPrice, quantity: qty, timeInForce: 'GTC',
    })
    if ('error' in bidResult) console.warn(`[MM] bid failed ${marketId}: ${bidResult.error}`)

    const askResult = await placeOrder({
      marketId, userId: MM_USER_ID, side: 'sell', type: 'limit',
      price: askPrice, quantity: qty, timeInForce: 'GTC',
    })
    if ('error' in askResult) console.warn(`[MM] ask failed ${marketId}: ${askResult.error}`)
  }
}

async function seedHistoricalCandles(marketId: string, referencePrice: number) {
  const existing = await prisma.candle.count({ where: { marketId, interval: '1m' } })
  if (existing > 100) {
    console.log(`[MM] Candles already seeded for ${marketId} (${existing} 1m)`)
    return
  }

  const count = 2880   // 48h of 1m candles
  const now   = Date.now()
  let price   = referencePrice

  console.log(`[MM] Seeding ${count} candles for ${marketId}…`)

  for (let i = count; i >= 0; i--) {
    const tradeTime  = new Date(now - i * 60_000)
    const drift      = (Math.random() - 0.5) * 2 * referencePrice * 0.001
    price = Math.max(referencePrice * 0.85, Math.min(referencePrice * 1.15, price + drift))

    const tradeCount = 1 + Math.floor(Math.random() * 3)
    for (let t = 0; t < tradeCount; t++) {
      const tp  = parseFloat((price + (Math.random() - 0.5) * referencePrice * 0.001).toFixed(2))
      const qty = 1 + Math.floor(Math.random() * 4)
      const ts  = new Date(tradeTime.getTime() + t * Math.floor(60_000 / tradeCount))

      await prisma.trade.create({
        data: {
          marketId, price: tp, quantity: qty,
          aggressorSide:    Math.random() > 0.5 ? 'BUY' : 'SELL',
          makerOrderId:     'hist',
          takerOrderId:     'hist',
          settlementStatus: 'SETTLEMENT_UNAVAILABLE',
          createdAt:        ts,
        },
      })

      for (const interval of CANDLE_INTERVALS) {
        const ms        = INTERVAL_MS[interval] ?? 60_000
        const bucketMs  = Math.floor(ts.getTime() / ms) * ms
        const openTime  = new Date(bucketMs)
        const closeTime = new Date(bucketMs + ms - 1)

        await prisma.candle.upsert({
          where:  { marketId_interval_openTime: { marketId, interval, openTime } },
          update: { close: tp, volume: { increment: tp * qty }, tradeCount: { increment: 1 } },
          create: {
            marketId, interval, openTime, closeTime,
            open: tp, high: tp, low: tp, close: tp,
            volume: tp * qty, tradeCount: 1,
          },
        })
        await prisma.$executeRaw`
          UPDATE "Candle"
          SET high = GREATEST(high, ${tp}),
              low  = LEAST(low,  ${tp})
          WHERE "marketId" = ${marketId}
            AND interval    = ${interval}
            AND "openTime"  = ${openTime}
        `
      }
    }
  }

  await prisma.market.update({
    where: { id: marketId },
    data:  { referencePrice: parseFloat(price.toFixed(2)) },
  })
  console.log(`[MM] Seeded ${marketId}. Final price: ${price.toFixed(2)}`)
}

async function ensureMMBalances(marketId: string) {
  const market = await prisma.market.findUnique({ where: { id: marketId } })
  if (!market) return

  // For both spot and perp: MM needs USDC + base asset
  for (const asset of [market.quoteAsset, market.baseAsset]) {
    await prisma.balance.upsert({
      where:  { userId_asset: { userId: MM_USER_ID, asset } },
      update: { available: 9_999_999_999 },
      create: { userId: MM_USER_ID, asset, available: 9_999_999_999, locked: 0, pending: 0 },
    })
  }
}

// ── Funding rate settlement ───────────────────────────────────────────────────

/**
 * Computes and records the funding rate for a perp market.
 * Then applies it to all open positions: longs pay shorts (or vice versa).
 *
 * Formula: rate8h = clamp((mark - index) / index / 3, ±MAX_FUNDING_RATE)
 * Applied hourly as: payment = position.notional × rate8h / 8
 */
async function settleFunding(marketId: string) {
  const market = await prisma.market.findUnique({ where: { id: marketId } })
  if (!market || market.type !== 'perp') return

  // Mark price = current order book midpoint (fall back to reference price)
  const [bestBidRow] = await prisma.order.findMany({
    where:   { marketId, side: 'BUY',  status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
    orderBy: { price: 'desc' }, take: 1, select: { price: true },
  })
  const [bestAskRow] = await prisma.order.findMany({
    where:   { marketId, side: 'SELL', status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
    orderBy: { price: 'asc'  }, take: 1, select: { price: true },
  })

  const bestBid  = bestBidRow ? Number(bestBidRow.price) : Number(market.referencePrice)
  const bestAsk  = bestAskRow ? Number(bestAskRow.price) : Number(market.referencePrice)
  const markPrice = (bestBid + bestAsk) / 2
  const indexPrice = Number(market.referencePrice)

  // Funding rate for this 8h period
  const rawRate = (markPrice - indexPrice) / indexPrice / 3
  const rate8h  = Math.min(MAX_FUNDING_RATE, Math.max(MIN_FUNDING_RATE, rawRate))

  // Record the funding rate
  await (prisma as any).fundingRate.create({
    data: { marketId, rate8h, markPrice },
  })

  // Hourly payment = rate8h / 8 of position notional
  const hourlyRate = rate8h / 8

  const positions = await (prisma as any).position.findMany({
    where: { marketId, status: 'OPEN' },
  })

  for (const pos of positions) {
    if (pos.userId === MM_USER_ID) continue

    const notional = pos.size * markPrice
    let payment    = notional * Math.abs(hourlyRate)

    if (hourlyRate > 0) {
      // Longs pay shorts
      if (pos.side === 'long') {
        // Deduct from USDC available
        await prisma.balance.upsert({
          where:  { userId_asset: { userId: pos.userId, asset: 'USDC' } },
          update: { available: { decrement: payment } },
          create: { userId: pos.userId, asset: 'USDC', available: 0, locked: 0, pending: 0 },
        })
      } else {
        // Credit to USDC available
        await prisma.balance.upsert({
          where:  { userId_asset: { userId: pos.userId, asset: 'USDC' } },
          update: { available: { increment: payment } },
          create: { userId: pos.userId, asset: 'USDC', available: payment, locked: 0, pending: 0 },
        })
      }
    } else if (hourlyRate < 0) {
      // Shorts pay longs
      if (pos.side === 'short') {
        await prisma.balance.upsert({
          where:  { userId_asset: { userId: pos.userId, asset: 'USDC' } },
          update: { available: { decrement: payment } },
          create: { userId: pos.userId, asset: 'USDC', available: 0, locked: 0, pending: 0 },
        })
      } else {
        await prisma.balance.upsert({
          where:  { userId_asset: { userId: pos.userId, asset: 'USDC' } },
          update: { available: { increment: payment } },
          create: { userId: pos.userId, asset: 'USDC', available: payment, locked: 0, pending: 0 },
        })
      }
    }
  }

  // Update mark prices + unrealized PnL for all positions
  await updatePositionMarkPrices(marketId, markPrice)

  console.log(`[MM] Funding ${marketId}: rate=${(rate8h * 100).toFixed(4)}% mark=${markPrice.toFixed(2)}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function startMM() {
  // Ensure MM user exists
  await prisma.user.upsert({
    where:  { id: MM_USER_ID },
    update: {},
    create: {
      id: MM_USER_ID, username: 'mm-bot', email: 'mm@lnyq.internal',
      referralCode: 'MM-BOT', sessionToken: null, isMarketMaker: true,
    },
  })

  const markets = await prisma.market.findMany({
    where: { status: 'ACTIVE', type: { in: ['spot', 'perp'] } },
  })

  for (const market of markets) {
    await ensureMMBalances(market.id)
    await seedHistoricalCandles(market.id, Number(market.referencePrice))
    await requote(market.id)

    // Requote loop with slight price drift
    setInterval(async () => {
      try {
        const latest = await prisma.market.findUnique({ where: { id: market.id } })
        if (!latest) return
        const ref   = Number(latest.referencePrice)
        const drift = (Math.random() - 0.5) * ref * 0.001
        await prisma.market.update({
          where: { id: market.id },
          data:  { referencePrice: parseFloat((ref + drift).toFixed(2)) },
        })
        await requote(market.id)
      } catch (err) {
        console.error('[MM] requote error:', err)
      }
    }, REQUOTE_MS)

    // Perp: run funding rate settlement every hour
    if (market.type === 'perp') {
      // Run immediately once, then on interval
      setTimeout(() => settleFunding(market.id), 5_000)
      setInterval(() => settleFunding(market.id), FUNDING_INTERVAL_MS)
    }
  }

  const spotCount = markets.filter(m => m.type === 'spot').length
  const perpCount = markets.filter(m => m.type === 'perp').length
  console.log(`[MM] Started: ${spotCount} spot, ${perpCount} perp market(s)`)
}
