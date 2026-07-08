/**
 * Market Maker — Prisma-backed.
 *
 * Seeds historical candle data and maintains live CLOB liquidity.
 * All state is persisted in PostgreSQL via the engine.
 *
 * NOT real trading. NOT real settlement. No smart contracts.
 */

import { prisma }      from './db.js'
import { placeOrder, cancelOrder, MM_USER_ID, CANDLE_INTERVALS, INTERVAL_MS } from './engine.js'

const SPREAD_PCT  = 0.003   // 0.3% total spread
const LEVEL_PCT   = 0.001   // 0.1% between levels
const LEVELS      = 5
const REQUOTE_MS  = 8_000

async function cancelAllMMOrders(marketId: string) {
  const open = await prisma.order.findMany({
    where: { marketId, userId: MM_USER_ID, status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
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
    const qty      = 2 + i   // 2, 3, 4, 5, 6 NFTs per level

    const bidResult = await placeOrder({
      marketId, userId: MM_USER_ID, side: 'buy', type: 'limit',
      price: bidPrice, quantity: qty, timeInForce: 'GTC',
    })
    if ('error' in bidResult) {
      console.warn(`[MM] bid failed: ${bidResult.error}`)
    }

    const askResult = await placeOrder({
      marketId, userId: MM_USER_ID, side: 'sell', type: 'limit',
      price: askPrice, quantity: qty, timeInForce: 'GTC',
    })
    if ('error' in askResult) {
      console.warn(`[MM] ask failed: ${askResult.error}`)
    }
  }
}

async function seedHistoricalCandles(marketId: string, referencePrice: number) {
  // Check if candles already exist (don't re-seed on restart)
  const existing = await prisma.candle.count({ where: { marketId, interval: '1m' } })
  if (existing > 100) {
    console.log(`[MM] Candles already seeded for ${marketId} (${existing} 1m candles)`)
    return
  }

  const count = 2880  // 48 hours of 1m candles — covers all timeframes
  const now   = Date.now()
  const ms1m  = 60_000

  console.log(`[MM] Seeding ${count} historical candles for ${marketId}…`)

  let price = referencePrice

  for (let i = count; i >= 0; i--) {
    const tradeTime = new Date(now - i * ms1m)
    const drift     = (Math.random() - 0.5) * 2 * referencePrice * 0.001
    price = Math.max(referencePrice * 0.85, Math.min(referencePrice * 1.15, price + drift))

    const tradeCount = 1 + Math.floor(Math.random() * 3)
    for (let t = 0; t < tradeCount; t++) {
      const tradePrice = parseFloat((price + (Math.random() - 0.5) * referencePrice * 0.001).toFixed(2))
      const qty        = 1 + Math.floor(Math.random() * 4)
      const ts         = new Date(tradeTime.getTime() + t * Math.floor(ms1m / tradeCount))

      // Write historical trade
      await prisma.trade.create({
        data: {
          marketId,
          price:            tradePrice,
          quantity:         qty,
          aggressorSide:    Math.random() > 0.5 ? 'BUY' : 'SELL',
          makerOrderId:     'hist',
          takerOrderId:     'hist',
          settlementStatus: 'SETTLEMENT_UNAVAILABLE',
          createdAt:        ts,
        },
      })

      // Update candles for all intervals
      for (const interval of CANDLE_INTERVALS) {
        const ms        = INTERVAL_MS[interval] ?? 60_000
        const bucketMs  = Math.floor(ts.getTime() / ms) * ms
        const openTime  = new Date(bucketMs)
        const closeTime = new Date(bucketMs + ms - 1)

        await prisma.candle.upsert({
          where: { marketId_interval_openTime: { marketId, interval, openTime } },
          update: {
            close:      tradePrice,
            volume:     { increment: tradePrice * qty },
            tradeCount: { increment: 1 },
          },
          create: {
            marketId, interval, openTime, closeTime,
            open: tradePrice, high: tradePrice, low: tradePrice, close: tradePrice,
            volume: tradePrice * qty, tradeCount: 1,
          },
        })
        await prisma.$executeRaw`
          UPDATE "Candle"
          SET high = GREATEST(high, ${tradePrice}),
              low  = LEAST(low, ${tradePrice})
          WHERE "marketId" = ${marketId}
            AND interval    = ${interval}
            AND "openTime"  = ${openTime}
        `
      }
    }
  }

  // Set market reference price to last simulated price
  await prisma.market.update({
    where: { id: marketId },
    data:  { referencePrice: parseFloat(price.toFixed(2)) },
  })

  console.log(`[MM] Historical candles seeded for ${marketId}. Final price: ${price.toFixed(2)}`)
}

async function ensureMMBalances(marketId: string) {
  const market = await prisma.market.findUnique({ where: { id: marketId } })
  if (!market) return

  // Ensure MM user has unlimited balances
  await prisma.balance.upsert({
    where:  { userId_asset: { userId: MM_USER_ID, asset: market.quoteAsset } },
    update: { available: 9_999_999_999 },
    create: { userId: MM_USER_ID, asset: market.quoteAsset, available: 9_999_999_999, locked: 0, pending: 0 },
  })
  await prisma.balance.upsert({
    where:  { userId_asset: { userId: MM_USER_ID, asset: market.baseAsset } },
    update: { available: 9_999_999_999 },
    create: { userId: MM_USER_ID, asset: market.baseAsset, available: 9_999_999_999, locked: 0, pending: 0 },
  })
}

export async function startMM() {
  const markets = await prisma.market.findMany({ where: { status: 'ACTIVE', type: 'spot' } })

  for (const market of markets) {
    // Ensure MM user exists
    await prisma.user.upsert({
      where:  { id: MM_USER_ID },
      update: {},
      create: {
        id: MM_USER_ID, username: 'mm-bot', email: 'mm@lnyq.internal',
        referralCode: 'MM-BOT', sessionToken: null, isMarketMaker: true,
      },
    })

    await ensureMMBalances(market.id)
    await seedHistoricalCandles(market.id, Number(market.referencePrice))

    // Initial quotes
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
  }

  console.log(`[MM] Market maker started for ${markets.length} market(s)`)
}
