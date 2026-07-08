/**
 * CLOB matching engine — PostgreSQL-backed, price-time priority.
 *
 * All mutations run inside Prisma transactions for atomicity.
 * Settlement is tagged MATCHED_PENDING_SETTLEMENT — no on-chain state.
 * NOT real settlement. No smart contracts. No Solana programs.
 */

import { prisma } from './db.js'
import { broadcast } from './ws.js'
import type { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

// ── Constants ─────────────────────────────────────────────────────────────────

export const MM_USER_ID    = 'mm-bot'
export const TAKER_FEE_BPS = 25
export const MAKER_FEE_BPS = 5
export const BPS_DIV       = 10_000

export const INTERVAL_MS: Record<string, number> = {
  '1m':  60_000,
  '5m':  300_000,
  '15m': 900_000,
  '1h':  3_600_000,
  '4h':  14_400_000,
  '1D':  86_400_000,
}

export const CANDLE_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1D']

// ── Helpers ───────────────────────────────────────────────────────────────────

const D = (n: number) => n

function calcFee(notional: number, bps: number): number {
  return Math.round((notional * bps / BPS_DIV) * 100) / 100
}

type TX = Prisma.TransactionClient

// ── Balance helpers (within transaction) ─────────────────────────────────────

async function getBalance(tx: TX, userId: string, asset: string) {
  return tx.balance.upsert({
    where: { userId_asset: { userId, asset } },
    update: {},
    create: { userId, asset, available: 0, locked: 0, pending: 0 },
  })
}

async function lockBalance(tx: TX, userId: string, asset: string, amount: number): Promise<boolean> {
  const bal = await getBalance(tx, userId, asset)
  if (Number(bal.available) < amount) return false
  await tx.balance.update({
    where: { userId_asset: { userId, asset } },
    data: {
      available: { decrement: D(amount) },
      locked:    { increment: D(amount) },
    },
  })
  return true
}

async function unlockBalance(tx: TX, userId: string, asset: string, amount: number) {
  await tx.balance.update({
    where: { userId_asset: { userId, asset } },
    data: {
      locked:    { decrement: D(amount) },
      available: { increment: D(amount) },
    },
  })
}

async function debitLocked(tx: TX, userId: string, asset: string, amount: number) {
  await tx.balance.update({
    where: { userId_asset: { userId, asset } },
    data: { locked: { decrement: D(amount) } },
  })
}

async function creditBalance(tx: TX, userId: string, asset: string, amount: number) {
  await tx.balance.upsert({
    where: { userId_asset: { userId, asset } },
    update: { available: { increment: D(amount) } },
    create: { userId, asset, available: D(amount), locked: 0, pending: 0 },
  })
}

// ── Candle update (within transaction) ───────────────────────────────────────

async function updateCandle(
  tx: TX,
  marketId: string,
  interval: string,
  price: number,
  qty: number,
  tradeTime: Date,
): Promise<void> {
  const ms       = INTERVAL_MS[interval] ?? 60_000
  const bucketMs = Math.floor(tradeTime.getTime() / ms) * ms
  const openTime  = new Date(bucketMs)
  const closeTime = new Date(bucketMs + ms - 1)

  await tx.candle.upsert({
    where: { marketId_interval_openTime: { marketId, interval, openTime } },
    update: {
      close:      D(price),
      volume:     { increment: D(price * qty) },
      tradeCount: { increment: 1 },
    },
    create: {
      marketId, interval, openTime, closeTime,
      open: D(price), high: D(price), low: D(price), close: D(price),
      volume: D(price * qty), tradeCount: 1,
    },
  })
  // high/low can't use increment — update via raw SQL
  await tx.$executeRaw`
    UPDATE "Candle"
    SET high = GREATEST(high, ${price}),
        low  = LEAST(low,  ${price})
    WHERE "marketId" = ${marketId}
      AND interval    = ${interval}
      AND "openTime"  = ${openTime}
  `
}

// ── Core order matching ───────────────────────────────────────────────────────

export interface PlaceOrderRequest {
  userId:      string
  marketId:    string
  side:        'buy' | 'sell'
  type:        'limit' | 'market'
  price?:      number
  quantity:    number
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'GTD'
  expiresAt?:  Date
}

export interface OrderResult {
  order: {
    id: string; userId: string; marketId: string
    side: string; type: string; price: string; quantity: number
    filledQuantity: number; remainingQuantity: number
    total: string; status: string; timeInForce: string
    createdAt: string; updatedAt: string
  }
  fills: unknown[]
}

export async function placeOrder(req: PlaceOrderRequest): Promise<OrderResult | { error: string }> {
  try {
    return await prisma.$transaction(async (tx: TX) => {
      const market = await tx.market.findUnique({ where: { id: req.marketId } })
      if (!market)                   return { error: `Market ${req.marketId} not found` }
      if (market.status !== 'ACTIVE') return { error: 'Market is not active' }
      if (req.quantity < 1 || !Number.isInteger(req.quantity)) return { error: 'Quantity must be a positive integer' }
      if (req.type === 'limit' && (!req.price || req.price <= 0)) return { error: 'Price required for limit orders' }

      const price   = req.price ?? Number(market.referencePrice)
      const isMMBot = req.userId === MM_USER_ID

      if (!isMMBot) {
        if (req.side === 'buy') {
          const lockPrice = req.type === 'limit' ? price : Number(market.referencePrice) * 1.05
          const lockAmt   = lockPrice * req.quantity + calcFee(lockPrice * req.quantity, TAKER_FEE_BPS)
          const ok = await lockBalance(tx, req.userId, market.quoteAsset, lockAmt)
          if (!ok) return { error: `Insufficient ${market.quoteAsset} balance` }
        } else {
          const ok = await lockBalance(tx, req.userId, market.baseAsset, req.quantity)
          if (!ok) return { error: `Insufficient ${market.baseAsset} balance` }
        }
      }

      const order = await tx.order.create({
        data: {
          userId:            req.userId,
          marketId:          req.marketId,
          side:              req.side.toUpperCase() as 'BUY' | 'SELL',
          type:              req.type.toUpperCase() as 'LIMIT' | 'MARKET',
          timeInForce:       req.timeInForce as 'GTC' | 'IOC' | 'FOK' | 'GTD',
          price:             D(price),
          quantity:          req.quantity,
          remainingQuantity: req.quantity,
          filledQuantity:    0,
          status:            'OPEN',
          expiresAt:         req.expiresAt,
          isMarketMaker:     isMMBot,
        },
      })

      const opposite = await tx.order.findMany({
        where: {
          marketId: req.marketId,
          side:     req.side === 'buy' ? 'SELL' : 'BUY',
          status:   { in: ['OPEN', 'PARTIALLY_FILLED'] },
          type:     'LIMIT',
          ...(req.side === 'buy'
            ? { price: { lte: D(price) } }
            : { price: { gte: D(price) } }),
        },
        orderBy: [
          { price:     req.side === 'buy' ? 'asc' : 'desc' },
          { createdAt: 'asc' },
        ],
        take: 20,
      })

      let remainingQty = req.quantity
      let filledQty    = 0
      const fills: unknown[] = []

      for (const resting of opposite) {
        if (remainingQty <= 0) break
        if (req.type === 'limit') {
          if (req.side === 'buy'  && Number(resting.price) > price) break
          if (req.side === 'sell' && Number(resting.price) < price) break
        }

        const fillQty   = Math.min(remainingQty, resting.remainingQuantity)
        const fillPrice = Number(resting.price)
        const notional  = fillPrice * fillQty
        const takerFee  = calcFee(notional, TAKER_FEE_BPS)
        const makerFee  = calcFee(notional, MAKER_FEE_BPS)
        const tradeId   = randomUUID()
        const ts        = new Date()

        const buyerId  = req.side === 'buy'  ? req.userId   : resting.userId
        const sellerId = req.side === 'sell' ? req.userId   : resting.userId
        const buyIsNew = req.side === 'buy'

        if (buyerId !== MM_USER_ID) {
          await debitLocked(tx, buyerId,  market.quoteAsset, fillPrice * fillQty + (buyIsNew ? takerFee : makerFee))
          await creditBalance(tx, buyerId, market.baseAsset,  fillQty)
        }
        if (sellerId !== MM_USER_ID) {
          await debitLocked(tx, sellerId,  market.baseAsset,  fillQty)
          await creditBalance(tx, sellerId, market.quoteAsset, fillPrice * fillQty - (buyIsNew ? makerFee : takerFee))
        }

        await tx.trade.create({
          data: {
            id: tradeId, marketId: req.marketId,
            price: D(fillPrice), quantity: fillQty,
            aggressorSide:    req.side.toUpperCase() as 'BUY' | 'SELL',
            makerOrderId:     resting.id,
            takerOrderId:     order.id,
            settlementStatus: 'MATCHED_PENDING_SETTLEMENT',
            createdAt: ts,
          },
        })

        const takerFill = await tx.fill.create({
          data: {
            tradeId, orderId: order.id, counterOrderId: resting.id,
            userId: req.userId, marketId: req.marketId,
            side:          req.side.toUpperCase() as 'BUY' | 'SELL',
            price:         D(fillPrice), quantity: fillQty,
            fee:           D(takerFee), feeAsset: market.quoteAsset,
            liquidityRole: 'TAKER', createdAt: ts,
          },
        })

        await tx.fill.create({
          data: {
            tradeId, orderId: resting.id, counterOrderId: order.id,
            userId: resting.userId, marketId: req.marketId,
            side:          (req.side === 'buy' ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
            price:         D(fillPrice), quantity: fillQty,
            fee:           D(makerFee), feeAsset: market.quoteAsset,
            liquidityRole: 'MAKER', createdAt: ts,
          },
        })

        const newRestingFilled = resting.filledQuantity + fillQty
        const newRestingRemain = resting.remainingQuantity - fillQty
        await tx.order.update({
          where: { id: resting.id },
          data: {
            filledQuantity:    newRestingFilled,
            remainingQuantity: newRestingRemain,
            status:            newRestingRemain === 0 ? 'FILLED' : 'PARTIALLY_FILLED',
            updatedAt:         ts,
          },
        })

        for (const interval of CANDLE_INTERVALS) {
          await updateCandle(tx, req.marketId, interval, fillPrice, fillQty, ts)
        }

        await tx.market.update({
          where: { id: req.marketId },
          data:  { referencePrice: D(fillPrice) },
        })

        fills.push(takerFill)
        remainingQty -= fillQty
        filledQty    += fillQty

        // Broadcast trade — matches Trade interface in types.ts
        broadcast({
          type: 'trade',
          marketId: req.marketId,
          trade: {
            id:          tradeId,
            marketId:    req.marketId,
            price:       fillPrice,
            quantity:    fillQty,
            takerSide:   req.side,
            buyOrderId:  buyIsNew ? order.id   : resting.id,
            sellOrderId: buyIsNew ? resting.id : order.id,
            createdAt:   ts.getTime(),
          },
        })

        if (!resting.isMarketMaker) {
          broadcast({
            type:  'order',
            userId: resting.userId,
            order: prismaOrderToWs({ ...resting, filledQuantity: newRestingFilled, remainingQuantity: newRestingRemain, status: newRestingRemain === 0 ? 'FILLED' : 'PARTIALLY_FILLED' }),
          })
        }
      }

      // Determine final status
      let finalStatus: string
      if (remainingQty === 0) {
        finalStatus = 'FILLED'
      } else if (req.timeInForce === 'IOC') {
        if (!isMMBot) {
          const remainNotional = remainingQty * price
          await unlockBalance(tx, req.userId,
            req.side === 'buy' ? market.quoteAsset : market.baseAsset,
            req.side === 'buy' ? remainNotional + calcFee(remainNotional, TAKER_FEE_BPS) : remainingQty,
          )
        }
        finalStatus  = filledQty > 0 ? 'PARTIALLY_FILLED' : 'CANCELLED'
        remainingQty = 0
      } else if (req.timeInForce === 'FOK') {
        if (filledQty < req.quantity) throw new Error('FOK: insufficient liquidity')
        finalStatus = 'FILLED'
      } else {
        finalStatus = filledQty > 0 && remainingQty > 0 ? 'PARTIALLY_FILLED'
                    : filledQty > 0 ? 'FILLED'
                    : 'OPEN'
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          filledQuantity:    filledQty,
          remainingQuantity: remainingQty,
          status:            finalStatus as 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED',
          updatedAt:         new Date(),
        },
      })

      broadcastBookAsync(req.marketId)

      if (!isMMBot) {
        broadcast({ type: 'order', userId: req.userId, order: prismaOrderToWs(updatedOrder) })
        broadcastPortfolioAsync(req.userId)
      }

      return {
        order: {
          id:                updatedOrder.id,
          userId:            updatedOrder.userId,
          marketId:          updatedOrder.marketId,
          side:              updatedOrder.side.toLowerCase(),
          type:              updatedOrder.type.toLowerCase(),
          price:             Number(updatedOrder.price).toFixed(2),
          quantity:          updatedOrder.quantity,
          filledQuantity:    updatedOrder.filledQuantity,
          remainingQuantity: updatedOrder.remainingQuantity,
          total:             (price * req.quantity).toFixed(2),
          status:            updatedOrder.status,
          timeInForce:       updatedOrder.timeInForce,
          createdAt:         updatedOrder.createdAt.toISOString(),
          updatedAt:         updatedOrder.updatedAt.toISOString(),
        },
        fills,
      }
    }, { timeout: 15_000 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.startsWith('FOK:')) return { error: msg }
    console.error('[engine] placeOrder error:', err)
    return { error: 'Order processing failed' }
  }
}

export async function cancelOrder(orderId: string, userId: string): Promise<unknown | { error: string }> {
  try {
    return await prisma.$transaction(async (tx: TX) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order) return { error: 'Order not found' }
      if (order.userId !== userId && userId !== 'admin') return { error: 'Unauthorized' }
      if (!['OPEN', 'PARTIALLY_FILLED', 'PENDING'].includes(order.status)) {
        return { error: `Cannot cancel order in status ${order.status}` }
      }

      const market = await tx.market.findUnique({ where: { id: order.marketId } })

      if (order.userId !== MM_USER_ID && market) {
        if (order.side === 'BUY') {
          const remainNotional = order.remainingQuantity * Number(order.price)
          await unlockBalance(tx, order.userId, market.quoteAsset,
            remainNotional + calcFee(remainNotional, MAKER_FEE_BPS))
        } else {
          await unlockBalance(tx, order.userId, market.baseAsset, order.remainingQuantity)
        }
      }

      const cancelled = await tx.order.update({
        where: { id: orderId },
        data:  { status: 'CANCELLED', updatedAt: new Date() },
      })

      broadcastBookAsync(order.marketId)

      if (!order.isMarketMaker) {
        broadcast({ type: 'order', userId: order.userId, order: prismaOrderToWs(cancelled) })
        broadcastPortfolioAsync(order.userId)
      }

      return cancelled
    })
  } catch (err) {
    console.error('[engine] cancelOrder error:', err)
    return { error: 'Cancel failed' }
  }
}

// ── Type converters ───────────────────────────────────────────────────────────

function prismaOrderToWs(o: {
  id: string; marketId: string; userId: string
  side: string; type: string; price: unknown; quantity: number
  filledQuantity: number; remainingQuantity: number
  status: string; timeInForce: string
  expiresAt?: Date | null; createdAt: Date; updatedAt: Date
  isMM?: boolean; isMarketMaker?: boolean
}) {
  return {
    id:                o.id,
    marketId:          o.marketId,
    userId:            o.userId,
    side:              o.side.toLowerCase() as 'buy' | 'sell',
    type:              o.type.toLowerCase() as 'limit' | 'market',
    price:             Number(o.price),
    quantity:          o.quantity,
    filledQuantity:    o.filledQuantity,
    remainingQuantity: o.remainingQuantity,
    status:            o.status as import('./types.js').OrderStatus,
    timeInForce:       o.timeInForce as import('./types.js').TIF,
    expiresAt:         o.expiresAt ? o.expiresAt.getTime() : undefined,
    createdAt:         o.createdAt.getTime(),
    updatedAt:         o.updatedAt.getTime(),
    isMM:              o.isMarketMaker ?? o.isMM ?? false,
  }
}

// ── Async broadcast helpers ───────────────────────────────────────────────────

async function broadcastBookAsync(marketId: string) {
  try {
    const [bidRows, askRows] = await Promise.all([
      prisma.order.findMany({
        where:   { marketId, side: 'BUY',  status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
        orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
        select:  { price: true, remainingQuantity: true },
      }),
      prisma.order.findMany({
        where:   { marketId, side: 'SELL', status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
        orderBy: [{ price: 'asc' },  { createdAt: 'asc' }],
        select:  { price: true, remainingQuantity: true },
      }),
    ])

    const aggregate = (rows: { price: { toNumber?: () => number } | number; remainingQuantity: number }[]): [number, number][] => {
      const map = new Map<number, number>()
      for (const r of rows) {
        const p = typeof r.price === 'object' && r.price !== null && 'toNumber' in r.price
          ? (r.price as { toNumber: () => number }).toNumber()
          : Number(r.price)
        map.set(p, (map.get(p) ?? 0) + r.remainingQuantity)
      }
      return [...map.entries()]
    }

    const bids    = aggregate(bidRows)
    const asks    = aggregate(askRows)
    const bestBid = bids[0]?.[0] ?? 0
    const bestAsk = asks[0]?.[0] ?? 0
    const spread   = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0
    const midpoint = bestAsk > 0 && bestBid > 0 ? (bestBid + bestAsk) / 2 : 0

    broadcast({ type: 'orderbook', marketId, bids, asks, spread, midpoint })
  } catch { /* best-effort */ }
}

async function broadcastPortfolioAsync(userId: string) {
  try {
    const rows = await prisma.balance.findMany({ where: { userId } })
    broadcast({
      type: 'portfolio',
      userId,
      balances: rows.map((b: { userId: string; asset: string; available: unknown; locked: unknown }) => ({
        userId:    b.userId,
        asset:     b.asset,
        available: Number(b.available),
        locked:    Number(b.locked),
      })),
    })
  } catch { /* best-effort */ }
}
