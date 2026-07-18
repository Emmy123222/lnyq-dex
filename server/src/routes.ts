/**
 * All REST API routes — Prisma-backed.
 * Mounted at /api by index.ts.
 *
 * NOT real settlement. No smart contracts. No Solana programs.
 */

import { Router }     from 'express'
import { randomUUID } from 'crypto'
import { prisma }     from './db.js'
import { placeOrder, cancelOrder, closePosition, CANDLE_INTERVALS } from './engine.js'
import type { CandleInterval } from './types.js'

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function requireSession(authHeader: string | undefined): Promise<{ userId: string; username: string; referralCode: string } | null> {
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  // Auth uses User.sessionToken directly — no separate Session table in schema
  const user = await prisma.user.findUnique({ where: { sessionToken: token } })
  if (!user) return null
  return { userId: user.id, username: user.username, referralCode: user.referralCode }
}

export function buildRouter(): Router {
  const r = Router()

  // ── Health ──────────────────────────────────────────────────────────────────

  r.get('/health', async (_req, res) => {
    try {
      const [marketCount] = await Promise.all([
        prisma.market.count({ where: { status: 'ACTIVE' } }),
      ])
      res.json({ ok: true, mode: 'local-api', ts: Date.now(), markets: marketCount })
    } catch {
      res.status(503).json({ ok: false, error: 'DATABASE_UNAVAILABLE' })
    }
  })

  // ── Auth ────────────────────────────────────────────────────────────────────

  r.post('/auth/verify-code', async (req, res) => {
    const { code } = req.body as { code?: string }
    if (!code) return res.status(400).json({ error: 'Code required' })

    const ac = await prisma.accessCode.findUnique({ where: { code: code.trim().toUpperCase() } })
    if (!ac)               return res.status(400).json({ error: 'INVALID_CODE',   message: 'Access code not recognised.' })
    if (ac.status !== 'UNUSED') return res.status(400).json({ error: 'ALREADY_USED', message: 'This access code has already been used.' })

    res.json({ ok: true, status: 'valid' })
  })

  r.post('/auth/signup', async (req, res) => {
    const { email, username, accessCode, referralCode } = req.body as Record<string, string>
    if (!email || !username || !accessCode) {
      return res.status(400).json({ error: 'email, username, and accessCode are required' })
    }

    const ac = await prisma.accessCode.findUnique({ where: { code: accessCode.trim().toUpperCase() } })
    if (!ac || ac.status !== 'UNUSED') {
      return res.status(400).json({ error: 'INVALID_CODE', message: 'Access code is invalid or already used.' })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) return res.status(400).json({ error: 'EMAIL_TAKEN', message: 'Email already registered.' })

    const userId       = randomUUID()
    const sessionToken = randomUUID()
    const userRefCode  = `REF-${randomUUID().slice(0, 8).toUpperCase()}`

    let referredById: string | undefined
    let referredByCode: string | undefined
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.toUpperCase() } })
      if (referrer) {
        referredById   = referrer.id
        referredByCode = referralCode.toUpperCase()
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId, email: email.toLowerCase(), username,
          referralCode: userRefCode,
          sessionToken,
        },
      })

      await tx.accessCode.update({
        where: { code: ac.code },
        data:  { status: 'USED', usedByUserId: userId, usedAt: new Date() },
      })

      // Phase 1: 1,000 testnet USDC one-time grant on signup
      await tx.balance.create({
        data: { userId, asset: 'USDC', available: 1_000, locked: 0, pending: 0 },
      })
      // Mark as drip-claimed so the /drip/claim endpoint cannot double-fund
      await tx.transaction.create({
        data: {
          userId, type: 'DRIP', status: 'CONFIRMED', asset: 'USDC', amount: 1_000,
          metadata: { amount: '1000', asset: 'USDC', source: 'signup' },
        },
      })

      if (referredById && referredByCode) {
        await tx.referral.create({
          data: {
            referrerUserId: referredById,
            referredUserId: userId,
            referralCode:   referredByCode,
            pointsAwarded:  50,
          },
        })
      }
    })

    res.json({ ok: true, userId, sessionToken, referralCode: userRefCode, username })
  })

  r.get('/auth/me', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })
    res.json({ ok: true, ...ctx })
  })

  // kept for backward-compat with old frontend session check
  r.get('/auth/session', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Session expired' })
    res.json({ ok: true, ...ctx })
  })

  // Returning-user login — looks up account by email, rotates session token
  r.post('/auth/login', async (req, res) => {
    const { email } = req.body as { email?: string }
    if (!email) return res.status(400).json({ error: 'Email required' })

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (!user) return res.status(404).json({ error: 'NO_ACCOUNT', message: 'No account found for this email address.' })
    if (user.isMarketMaker) return res.status(403).json({ error: 'FORBIDDEN', message: 'This account is not a user account.' })

    const sessionToken = randomUUID()
    await prisma.user.update({ where: { id: user.id }, data: { sessionToken } })

    res.json({ ok: true, userId: user.id, username: user.username, referralCode: user.referralCode, sessionToken })
  })

  // Link a Privy wallet address to the current session user
  r.patch('/auth/wallet', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const { walletAddress } = req.body as { walletAddress?: string }
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'walletAddress is required' })
    }
    const trimmed = walletAddress.trim()
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
      return res.status(400).json({ error: 'INVALID_ADDRESS', message: 'walletAddress must be a valid Solana public key.' })
    }

    try {
      await prisma.user.update({
        where: { id: ctx.userId },
        data:  { walletAddress: trimmed },
      })
      res.json({ ok: true, walletAddress: trimmed })
    } catch (err: unknown) {
      const isUnique = (err as { code?: string }).code === 'P2002'
      if (isUnique) {
        return res.status(409).json({ error: 'ADDRESS_TAKEN', message: 'This wallet address is already linked to another account.' })
      }
      throw err
    }
  })

  // ── Markets ─────────────────────────────────────────────────────────────────

  r.get('/markets', async (_req, res) => {
    const markets = await prisma.market.findMany({ where: { status: 'ACTIVE' } })
    res.json({ ok: true, data: markets.map(m => ({
      id: m.id, baseAsset: m.baseAsset, quoteAsset: m.quoteAsset,
      displayName: m.displayName, type: m.type.toLowerCase(),
      isActive: m.status === 'ACTIVE',
      isPhase1: m.isPhase1,
      minOrderSize: Number(m.minOrderSize),
      tickSize: Number(m.tickSize),
      referencePrice: Number(m.referencePrice),
    })) })
  })

  r.get('/markets/tickers', async (_req, res) => {
    const markets = await prisma.market.findMany({ where: { status: 'ACTIVE' } })
    const since24h = new Date(Date.now() - 86_400_000)

    const tickers = await Promise.all(markets.map(async (m) => {
      const trades24h = await prisma.trade.findMany({
        where: { marketId: m.id, createdAt: { gte: since24h } },
        orderBy: { createdAt: 'desc' },
      })
      const lastTrade = trades24h[0]
      const lastPrice  = lastTrade ? Number(lastTrade.price) : Number(m.referencePrice)
      const openPrice  = trades24h.at(-1) ? Number(trades24h.at(-1)!.price) : lastPrice
      const change24h  = lastPrice - openPrice
      const vol24h     = trades24h.reduce((s, t) => s + Number(t.price) * t.quantity, 0)
      const high24h    = trades24h.length ? Math.max(...trades24h.map(t => Number(t.price))) : lastPrice
      const low24h     = trades24h.length ? Math.min(...trades24h.map(t => Number(t.price))) : lastPrice

      const [bidRow] = await prisma.order.findMany({
        where: { marketId: m.id, side: 'BUY',  status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
        orderBy: { price: 'desc' }, take: 1, select: { price: true },
      })
      const [askRow] = await prisma.order.findMany({
        where: { marketId: m.id, side: 'SELL', status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
        orderBy: { price: 'asc'  }, take: 1, select: { price: true },
      })

      const bestBid = bidRow ? Number(bidRow.price) : 0
      const bestAsk = askRow ? Number(askRow.price) : 0

      return {
        marketId:    m.id,
        lastPrice:   lastPrice.toFixed(2),
        bestBid:     bestBid.toFixed(2),
        bestAsk:     bestAsk.toFixed(2),
        spread:      (bestAsk - bestBid).toFixed(2),
        midpoint:    bestBid > 0 && bestAsk > 0 ? ((bestBid + bestAsk) / 2).toFixed(2) : '0.00',
        change24h:   (change24h >= 0 ? '+' : '') + change24h.toFixed(2),
        change24hPct: openPrice > 0
          ? ((change24h >= 0 ? '+' : '') + ((change24h / openPrice) * 100).toFixed(2) + '%')
          : '0.00%',
        volume24h:   vol24h.toFixed(2),
        high24h:     high24h.toFixed(2),
        low24h:      low24h.toFixed(2),
        trades24h:   trades24h.length,
      }
    }))

    res.json({ ok: true, data: tickers })
  })

  r.get('/markets/:id', async (req, res) => {
    const m = await prisma.market.findUnique({ where: { id: req.params.id } })
    if (!m) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true, data: {
      id: m.id, baseAsset: m.baseAsset, quoteAsset: m.quoteAsset,
      displayName: m.displayName, type: m.type.toLowerCase(),
      isActive: m.status === 'ACTIVE',
      minOrderSize: Number(m.minOrderSize), tickSize: Number(m.tickSize),
      referencePrice: Number(m.referencePrice),
    } })
  })

  r.get('/markets/:id/ticker', async (req, res) => {
    const m = await prisma.market.findUnique({ where: { id: req.params.id } })
    if (!m) return res.status(404).json({ error: 'Not found' })

    const since24h  = new Date(Date.now() - 86_400_000)
    const trades24h = await prisma.trade.findMany({
      where: { marketId: m.id, createdAt: { gte: since24h } },
      orderBy: { createdAt: 'desc' },
    })

    const lastPrice = trades24h[0] ? Number(trades24h[0].price) : Number(m.referencePrice)
    const openPrice = trades24h.at(-1) ? Number(trades24h.at(-1)!.price) : lastPrice
    const change24h = lastPrice - openPrice
    const vol24h    = trades24h.reduce((s, t) => s + Number(t.price) * t.quantity, 0)
    const high24h   = trades24h.length ? Math.max(...trades24h.map(t => Number(t.price))) : lastPrice
    const low24h    = trades24h.length ? Math.min(...trades24h.map(t => Number(t.price))) : lastPrice

    const [bidRow] = await prisma.order.findMany({
      where: { marketId: m.id, side: 'BUY',  status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
      orderBy: { price: 'desc' }, take: 1, select: { price: true },
    })
    const [askRow] = await prisma.order.findMany({
      where: { marketId: m.id, side: 'SELL', status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
      orderBy: { price: 'asc'  }, take: 1, select: { price: true },
    })

    const bestBid = bidRow ? Number(bidRow.price) : 0
    const bestAsk = askRow ? Number(askRow.price) : 0

    res.json({ ok: true, data: {
      marketId: m.id,
      lastPrice: lastPrice.toFixed(2),
      bestBid:   bestBid.toFixed(2),
      bestAsk:   bestAsk.toFixed(2),
      spread:    (bestAsk - bestBid).toFixed(2),
      midpoint:  bestBid > 0 && bestAsk > 0 ? ((bestBid + bestAsk) / 2).toFixed(2) : '0.00',
      change24h:  (change24h >= 0 ? '+' : '') + change24h.toFixed(2),
      change24hPct: openPrice > 0
        ? ((change24h >= 0 ? '+' : '') + ((change24h / openPrice) * 100).toFixed(2) + '%')
        : '0.00%',
      volume24h: vol24h.toFixed(2),
      high24h:   high24h.toFixed(2),
      low24h:    low24h.toFixed(2),
      trades24h: trades24h.length,
    } })
  })

  // ── Order book ──────────────────────────────────────────────────────────────

  r.get('/markets/:id/orderbook', async (req, res) => {
    const marketId = req.params.id
    const exists = await prisma.market.count({ where: { id: marketId } })
    if (!exists) return res.status(404).json({ error: 'Not found' })

    const [bidRows, askRows] = await Promise.all([
      prisma.order.findMany({
        where:   { marketId, side: 'BUY',  status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
        orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
        select:  { price: true, remainingQuantity: true },
        take:    50,
      }),
      prisma.order.findMany({
        where:   { marketId, side: 'SELL', status: { in: ['OPEN', 'PARTIALLY_FILLED'] } },
        orderBy: [{ price: 'asc' },  { createdAt: 'asc' }],
        select:  { price: true, remainingQuantity: true },
        take:    50,
      }),
    ])

    const aggregate = (rows: { price: unknown; remainingQuantity: number }[]) => {
      const map = new Map<string, number>()
      for (const r of rows) {
        const p = Number(r.price).toFixed(2)
        map.set(p, (map.get(p) ?? 0) + r.remainingQuantity)
      }
      return [...map.entries()].map(([price, qty]) => ({ price, size: String(qty), total: String(qty) }))
    }

    res.json({ ok: true, data: { bids: aggregate(bidRows), asks: aggregate(askRows) } })
  })

  // ── Trades ──────────────────────────────────────────────────────────────────

  r.get('/markets/:id/trades', async (req, res) => {
    const marketId = req.params.id
    const limit    = Math.min(100, parseInt(String(req.query.limit ?? '50')))
    const trades   = await prisma.trade.findMany({
      where:   { marketId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    })
    res.json({ ok: true, data: trades.map(t => ({
      id:       t.id,
      price:    Number(t.price).toFixed(2),
      quantity: String(t.quantity),
      side:     t.aggressorSide.toLowerCase(),
      time:     t.createdAt.getTime(),
    })) })
  })

  // ── Candles ─────────────────────────────────────────────────────────────────

  r.get('/markets/:id/candles', async (req, res) => {
    const marketId = req.params.id
    const interval = String(req.query.interval ?? '1m') as CandleInterval
    const limit    = Math.min(500, parseInt(String(req.query.limit ?? '200')))

    if (!CANDLE_INTERVALS.includes(interval)) {
      return res.status(400).json({ error: `Invalid interval. Use one of: ${CANDLE_INTERVALS.join(', ')}` })
    }

    const candles = await prisma.candle.findMany({
      where:   { marketId, interval },
      orderBy: { openTime: 'desc' },
      take:    limit,
    })

    res.json({ ok: true, data: candles.map(c => ({
      marketId: c.marketId,
      interval: c.interval,
      time:     c.openTime.getTime(),
      open:     Number(c.open),
      high:     Number(c.high),
      low:      Number(c.low),
      close:    Number(c.close),
      volume:   Number(c.volume),
      trades:   c.tradeCount,
    })).reverse() })
  })

  // ── Orders ──────────────────────────────────────────────────────────────────

  r.post('/orders', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const { marketId, side, type, price, quantity, timeInForce, expiresAt, leverage } =
      req.body as Record<string, unknown>

    if (!marketId || !side || !type || !quantity || !timeInForce) {
      return res.status(400).json({ error: 'marketId, side, type, quantity, timeInForce required' })
    }

    const result = await placeOrder({
      marketId:    String(marketId),
      userId:      ctx.userId,
      side:        side as 'buy' | 'sell',
      type:        type as 'limit' | 'market',
      price:       price !== undefined ? Number(price) : undefined,
      quantity:    Number(quantity),
      timeInForce: timeInForce as 'GTC' | 'IOC' | 'FOK' | 'GTD',
      expiresAt:   expiresAt ? new Date(String(expiresAt)) : undefined,
      leverage:    leverage !== undefined ? Number(leverage) : undefined,
    })

    if ('error' in result) return res.status(400).json({ error: result.error })

    res.json({ ok: true, data: {
      order: result.order,
      fills: (result.fills as unknown[]),
    } })
  })

  r.delete('/orders/:id', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const result = await cancelOrder(req.params.id, ctx.userId)
    if (result && typeof result === 'object' && 'error' in result) {
      return res.status(400).json({ error: (result as { error: string }).error })
    }
    res.json({ ok: true, data: result })
  })

  r.get('/orders/open', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const orders = await prisma.order.findMany({
      where:   { userId: ctx.userId, status: { in: ['OPEN', 'PARTIALLY_FILLED', 'PENDING'] } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ ok: true, data: orders.map(serializeOrder) })
  })

  r.get('/orders/history', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const limit = Math.min(200, parseInt(String(req.query.limit ?? '50')))
    const orders = await prisma.order.findMany({
      where:   { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    })
    res.json({ ok: true, data: orders.map(serializeOrder) })
  })

  // ── Portfolio ────────────────────────────────────────────────────────────────

  r.get('/portfolio', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const [balances, openOrders, fills, markets, positions] = await Promise.all([
      prisma.balance.findMany({ where: { userId: ctx.userId } }),
      prisma.order.findMany({
        where: { userId: ctx.userId, status: { in: ['OPEN', 'PARTIALLY_FILLED', 'PENDING'] } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fill.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.market.findMany({ where: { status: 'ACTIVE' } }),
      (prisma as any).position.findMany({ where: { userId: ctx.userId, status: 'OPEN' } }),
    ])

    const refPrices = new Map(markets.map(m => [m.baseAsset, Number(m.referencePrice)]))
    const markById  = new Map(markets.map(m => [m.id, Number(m.referencePrice)]))
    const totalFees = fills.reduce((s: number, f: any) => s + Number(f.fee), 0)
    const usdcBal   = balances.find(b => b.asset === 'USDC')
    const equity    = balances.reduce((s, b) => {
      const val = Number(b.available) + Number(b.locked)
      return s + (b.asset === 'USDC' ? val : val * (refPrices.get(b.asset) ?? 0))
    }, 0)

    // Aggregate unrealized PnL across open perp positions
    let totalUnrealizedPnl = 0
    let totalMarginUsed    = 0
    for (const p of positions) {
      const mark  = markById.get(p.marketId) ?? Number(p.entryPrice)
      const upnl  = p.side === 'long'
        ? (mark - Number(p.entryPrice)) * p.size
        : (Number(p.entryPrice) - mark) * p.size
      totalUnrealizedPnl += upnl
      totalMarginUsed    += Number(p.margin)
    }

    const history = await prisma.order.findMany({
      where:   { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
      take:    50,
    })

    res.json({ ok: true, data: {
      balances: balances.map(b => {
        const total = Number(b.available) + Number(b.locked)
        return {
          asset:     b.asset,
          total:     total.toFixed(2),
          available: Number(b.available).toFixed(2),
          locked:    Number(b.locked).toFixed(2),
          usdValue:  b.asset === 'USDC'
            ? total.toFixed(2)
            : (total * (refPrices.get(b.asset) ?? 0)).toFixed(2),
        }
      }),
      stats: {
        equity:           equity.toFixed(2),
        availableBalance: Number(usdcBal?.available ?? 0).toFixed(2),
        lockedBalance:    Number(usdcBal?.locked ?? 0).toFixed(2),
        totalFeesPaid:    totalFees.toFixed(2),
        unrealizedPnl:    (totalUnrealizedPnl >= 0 ? '+' : '') + totalUnrealizedPnl.toFixed(2),
        unrealizedPnlPct: equity > 0
          ? (totalUnrealizedPnl >= 0 ? '+' : '') + ((totalUnrealizedPnl / equity) * 100).toFixed(2) + '%'
          : '0.00%',
        allTimePnl:       '0.00',
        allTimePnlPct:    '0.00%',
        marginUsed:       totalMarginUsed.toFixed(2),
        crossMarginRatio: totalMarginUsed > 0 && equity > 0
          ? ((totalMarginUsed / equity) * 100).toFixed(1) + '%'
          : '0.00%',
      },
      openOrders:   openOrders.map(serializeOrder),
      orderHistory: history.map(serializeOrder),
    } })
  })

  // ── Drip ────────────────────────────────────────────────────────────────────

  r.get('/drip/status', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const txn = await prisma.transaction.findFirst({
      where: { userId: ctx.userId, type: 'DRIP' },
    })
    res.json({ ok: true, data: { claimed: !!txn, amount: '1000.00', asset: 'USDC' } })
  })

  r.post('/drip/claim', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const existing = await prisma.transaction.findFirst({
      where: { userId: ctx.userId, type: 'DRIP' },
    })
    if (existing) {
      return res.status(400).json({ error: 'ALREADY_CLAIMED', message: 'Testnet USDC already claimed.' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.balance.upsert({
        where:  { userId_asset: { userId: ctx.userId, asset: 'USDC' } },
        update: { available: { increment: 1_000 } },
        create: { userId: ctx.userId, asset: 'USDC', available: 1_000, locked: 0, pending: 0 },
      })
      await tx.transaction.create({
        data: {
          userId: ctx.userId,
          type:   'DRIP',
          status: 'CONFIRMED',
          asset:  'USDC',
          amount: 1_000,
          metadata: { amount: '1000', asset: 'USDC' },
        },
      })
    })

    res.json({ ok: true, data: {
      claimed: true, amount: '1000.00', asset: 'USDC',
      txId: randomUUID(), claimedAt: Date.now(),
    } })
  })

  // ── Referral ─────────────────────────────────────────────────────────────────

  r.get('/referral', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const user = await prisma.user.findUnique({ where: { id: ctx.userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const referrals = await prisma.referral.findMany({
      where:   { referrerUserId: ctx.userId },
      include: { referred: { select: { id: true, username: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const totalPoints = referrals.reduce((s, r) => s + r.pointsAwarded, 0)

    res.json({ ok: true, data: {
      referralCode:  user.referralCode,
      totalPoints,
      referredCount: referrals.length,
      referredUsers: await Promise.all(referrals.map(async r => ({
        username:  r.referred.username,
        joinedAt:  r.referred.createdAt.getTime(),
        hasTraded: (await prisma.fill.count({ where: { userId: r.referred.id } })) > 0,
        points:    r.pointsAwarded,
      }))),
    } })
  })

  r.post('/referral/apply', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const { code } = req.body as { code?: string }
    if (!code) return res.status(400).json({ error: 'Referral code required' })

    const referrer = await prisma.user.findUnique({ where: { referralCode: code.toUpperCase() } })
    if (!referrer)                    return res.status(400).json({ error: 'Invalid referral code' })
    if (referrer.id === ctx.userId)   return res.status(400).json({ error: 'Cannot use your own referral code' })

    // referredUserId is @unique — one user can only be referred once
    const alreadyReferred = await prisma.referral.findUnique({
      where: { referredUserId: ctx.userId },
    })
    if (alreadyReferred) return res.status(400).json({ error: 'Already used a referral code' })

    await prisma.referral.create({
      data: { referrerUserId: referrer.id, referredUserId: ctx.userId, referralCode: code.toUpperCase(), pointsAwarded: 50 },
    })

    res.json({ ok: true, data: { applied: true, referrerUsername: referrer.username } })
  })

  r.get('/referrals/leaderboard', async (_req, res) => {
    const rows = await prisma.$queryRaw<{ rank: number; username: string; points: number }[]>`
      SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(r."pointsAwarded") DESC) AS rank,
        u.username,
        SUM(r."pointsAwarded")::int AS points
      FROM "Referral" r
      JOIN "User" u ON u.id = r."referrerUserId"
      GROUP BY u.id, u.username
      ORDER BY points DESC
      LIMIT 100
    `
    res.json({ ok: true, data: rows.map(row => ({
      rank:     Number(row.rank),
      username: row.username,
      points:   Number(row.points),
    })) })
  })

  // ── Transactions (for orderService.getTransactions) ──────────────────────────

  r.get('/users/me/transactions', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const limit = Math.min(100, parseInt(String(req.query.limit ?? '50')))
    const txns = await prisma.transaction.findMany({
      where:   { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    })
    res.json({ ok: true, data: txns.map(t => ({
      id:        t.id,
      type:      t.type,
      status:    t.status,
      asset:     t.asset,
      amount:    Number(t.amount).toFixed(2),
      createdAt: t.createdAt.toISOString(),
    })) })
  })

  r.get('/users/:userId/portfolio', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })
    if (ctx.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' })
    // Redirect to the canonical portfolio handler
    res.redirect(307, '/api/portfolio')
  })

  // ── Perpetual: funding rate ───────────────────────────────────────────────────

  r.get('/markets/:id/funding', async (req, res) => {
    const market = await prisma.market.findUnique({ where: { id: req.params.id } })
    if (!market) return res.status(404).json({ error: 'Not found' })

    const latest = await (prisma as any).fundingRate.findFirst({
      where:   { marketId: req.params.id },
      orderBy: { timestamp: 'desc' },
    })

    const rate8h = latest ? Number(latest.rate8h) : 0.0001
    const mark   = latest ? Number(latest.markPrice) : Number(market.referencePrice)

    const rateAnnualized = rate8h * 3 * 365 * 100  // 3 periods/day × 365 × 100%
    const sign8h         = rate8h >= 0 ? '+' : ''
    const signAnn        = rateAnnualized >= 0 ? '+' : ''

    const paysDirection = rate8h > 0.00001  ? 'longs-pay-shorts'
                        : rate8h < -0.00001 ? 'shorts-pay-longs'
                        : 'neutral'

    // Next funding time: 00:00, 08:00, or 16:00 UTC
    const now    = new Date()
    const h      = now.getUTCHours()
    const nextH  = h < 8 ? 8 : h < 16 ? 16 : 24
    const next   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    if (nextH < 24) {
      next.setUTCHours(nextH, 0, 0, 0)
    } else {
      next.setUTCDate(next.getUTCDate() + 1)
      next.setUTCHours(0, 0, 0, 0)
    }

    res.json({ ok: true, data: {
      marketId:       req.params.id,
      rate8h:         `${sign8h}${(rate8h * 100).toFixed(4)}`,
      rateAnnualized: `${signAnn}${rateAnnualized.toFixed(2)}`,
      markPrice:      mark.toFixed(2),
      paysDirection,
      nextFundingMs:  next.getTime(),
    } })
  })

  // ── Perpetual: open interest ──────────────────────────────────────────────────

  r.get('/markets/:id/oi', async (req, res) => {
    const market = await prisma.market.findUnique({ where: { id: req.params.id } })
    if (!market) return res.status(404).json({ error: 'Not found' })

    const positions = await (prisma as any).position.findMany({
      where: { marketId: req.params.id, status: 'OPEN' },
    })

    const markPrice  = Number(market.referencePrice)
    let longNotional = 0
    let shortNotional = 0

    for (const p of positions) {
      const n = p.size * markPrice
      if (p.side === 'long')  longNotional  += n
      else                    shortNotional += n
    }

    const totalNotional = longNotional + shortNotional
    const longPct  = totalNotional > 0 ? ((longNotional  / totalNotional) * 100).toFixed(1) : '50.0'
    const shortPct = totalNotional > 0 ? ((shortNotional / totalNotional) * 100).toFixed(1) : '50.0'

    res.json({ ok: true, data: {
      marketId:  req.params.id,
      notional:  totalNotional.toFixed(2),
      longPct,
      shortPct,
    } })
  })

  // ── Perpetual: positions ──────────────────────────────────────────────────────

  r.get('/positions', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const positions = await (prisma as any).position.findMany({
      where:   { userId: ctx.userId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    })

    const markets = await prisma.market.findMany({ where: { status: 'ACTIVE' } })
    const markMap = new Map(markets.map(m => [m.id, Number(m.referencePrice)]))

    res.json({ ok: true, data: positions.map((p: any) => {
      const mark      = markMap.get(p.marketId) ?? Number(p.entryPrice)
      const entry     = Number(p.entryPrice)
      const size      = p.size
      const upnl      = p.side === 'long'
        ? (mark - entry) * size
        : (entry - mark) * size
      const margin    = Number(p.margin)
      const roe       = margin > 0 ? (upnl / margin) * 100 : 0
      const liqPrice  = Number(p.liquidationPrice)

      return {
        id:              p.id,
        marketId:        p.marketId,
        side:            p.side,
        size:            p.size,
        entryPrice:      entry.toFixed(2),
        markPrice:       mark.toFixed(2),
        liquidationPrice: liqPrice.toFixed(2),
        leverage:        p.leverage,
        margin:          margin.toFixed(2),
        unrealizedPnl:   upnl.toFixed(2),
        unrealizedPnlPct: `${upnl >= 0 ? '+' : ''}${roe.toFixed(2)}%`,
        realizedPnl:     Number(p.realizedPnl).toFixed(2),
        openedAt:        p.openedAt.toISOString(),
      }
    }) })
  })

  r.post('/positions/:id/close', async (req, res) => {
    const ctx = await requireSession(req.headers.authorization)
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' })

    const result = await closePosition(req.params.id, ctx.userId)
    if ('error' in result) return res.status(400).json({ error: result.error })

    res.json({ ok: true, data: {
      closed:       true,
      realizedPnl:  result.realizedPnl.toFixed(2),
    } })
  })

  // ── Feature flags ─────────────────────────────────────────────────────────────

  r.get('/feature-flags', async (_req, res) => {
    const flags = await prisma.featureFlag.findMany()
    const result: Record<string, boolean> = {}
    for (const f of flags) result[f.key] = f.enabled
    res.json({ ok: true, data: result })
  })

  return r
}

// ── Serializers ───────────────────────────────────────────────────────────────

function serializeOrder(o: {
  id: string; marketId: string; userId: string
  side: string; type: string; price: unknown
  quantity: number; filledQuantity: number; remainingQuantity: number
  status: string; timeInForce: string; createdAt: Date; updatedAt: Date
}) {
  const price = Number(o.price)
  return {
    id:                o.id,
    marketId:          o.marketId,
    side:              o.side.toLowerCase(),
    type:              o.type.toLowerCase(),
    price:             price.toFixed(2),
    quantity:          String(o.quantity),
    filledQuantity:    String(o.filledQuantity),
    remainingQuantity: String(o.remainingQuantity),
    total:             (price * o.quantity).toFixed(2),
    status:            o.status,
    timeInForce:       o.timeInForce,
    createdAt:         o.createdAt.toISOString(),
    updatedAt:         o.updatedAt.toISOString(),
  }
}
