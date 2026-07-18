/**
 * orderBookService — order book snapshots and streaming.
 *
 * All modes hit a real backend. No mock data.
 * local-api: REST snapshot + WS live updates via simClient
 * devnet-api+: REST from API, poll every 3s (WS not yet wired)
 */

import type { OrderBook, PriceLevel, PublicTrade, ServiceResult } from '../types'
import { ENV } from '../config/env'
import { apiFetch } from './types'
import { simClient, type WsStatus } from './simClient'

export type BookStatus = 'live' | 'delayed' | 'reconnecting' | 'unavailable'

// ── Converters ────────────────────────────────────────────────────────────────

function restLevelsToBook(
  marketId: string,
  bids: PriceLevel[],
  asks: PriceLevel[],
): OrderBook {
  let bidTotal = 0
  const bidsWithTotal = bids
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
    .map(l => { bidTotal += parseInt(l.size); return { ...l, total: String(bidTotal) } })

  let askTotal = 0
  const asksWithTotal = asks
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    .map(l => { askTotal += parseInt(l.size); return { ...l, total: String(askTotal) } })

  const bestBid = parseFloat(bidsWithTotal[0]?.price ?? '0')
  const bestAsk = parseFloat(asksWithTotal[0]?.price ?? '0')
  const mid       = bestAsk > 0 && bestBid > 0 ? (bestBid + bestAsk) / 2 : 0
  const spread    = mid > 0 ? (bestAsk - bestBid).toFixed(2) : '0.00'
  const spreadPct = mid > 0 ? ((bestAsk - bestBid) / mid * 100).toFixed(3) : '0.000'
  const midpoint  = mid > 0 ? mid.toFixed(2) : '0.00'

  return { marketId, bids: bidsWithTotal, asks: asksWithTotal, spread, spreadPct, midpoint, sequenceNumber: 1, updatedAt: new Date().toISOString() }
}

function wsMsgToBook(
  marketId: string,
  wsBids: [number, number][],
  wsAsks: [number, number][],
  spread: number,
  midpoint: number,
): OrderBook {
  let bidTotal = 0
  const bids: PriceLevel[] = wsBids.map(([price, qty]) => {
    bidTotal += qty
    return { price: price.toFixed(2), size: String(qty), total: String(bidTotal) }
  })

  let askTotal = 0
  const asks: PriceLevel[] = wsAsks.map(([price, qty]) => {
    askTotal += qty
    return { price: price.toFixed(2), size: String(qty), total: String(askTotal) }
  })

  const bestBid = parseFloat(bids[0]?.price ?? '0')
  const spreadPct = bestBid > 0 ? ((spread / bestBid) * 100).toFixed(3) : '0.000'

  return {
    marketId, bids, asks,
    spread: spread.toFixed(2),
    spreadPct,
    midpoint: midpoint.toFixed(2),
    sequenceNumber: Date.now(),
    updatedAt: new Date().toISOString(),
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const orderBookService = {
  async getOrderBook(marketId: string): Promise<ServiceResult<OrderBook>> {
    const res = await apiFetch<{ bids: PriceLevel[]; asks: PriceLevel[] }>(
      `/markets/${marketId}/orderbook`,
    )
    if (!res.ok) return res
    return { ok: true, data: restLevelsToBook(marketId, res.data.bids, res.data.asks) }
  },

  async getRecentTrades(marketId: string, limit = 20): Promise<ServiceResult<PublicTrade[]>> {
    const res = await apiFetch<{ id: string; price: string; quantity: string; side: string; time: number }[]>(
      `/markets/${marketId}/trades?limit=${limit}`,
    )
    if (!res.ok) return res
    const trades: PublicTrade[] = res.data.map(t => ({
      id:       t.id,
      marketId,
      price:    t.price,
      quantity: t.quantity,
      side:     t.side as 'buy' | 'sell',
      tradedAt: new Date(t.time).toLocaleTimeString('en-US', { hour12: false }),
    }))
    return { ok: true, data: trades }
  },

  subscribe(
    marketId: string,
    onUpdate: (book: OrderBook) => void,
    onStatus?: (status: BookStatus) => void,
  ): () => void {
    if (ENV.IS_LOCAL_API) {
      const wsStatusMap: Record<WsStatus, BookStatus> = {
        connecting:   'reconnecting',
        live:         'live',
        reconnecting: 'reconnecting',
        unavailable:  'unavailable',
      }
      const unsubStatus = simClient.onStatus(s => onStatus?.(wsStatusMap[s]))

      let lastSeq = -1

      const unsubBook = simClient.subscribeOrderBook(marketId, async (msg) => {
        const m = msg as {
          marketId: string
          bids: [number, number][]
          asks: [number, number][]
          spread: number
          midpoint: number
          seqNum?: number
        }
        const seq = m.seqNum ?? -1

        // Sequence gap: missed a broadcast — fall back to REST snapshot.
        if (seq !== -1 && lastSeq !== -1 && seq > lastSeq + 1) {
          const snap = await orderBookService.getOrderBook(marketId)
          if (snap.ok) onUpdate(snap.data)
        } else {
          onUpdate(wsMsgToBook(m.marketId, m.bids, m.asks, m.spread, m.midpoint))
        }

        if (seq !== -1) lastSeq = seq
      })

      return () => { unsubStatus(); unsubBook() }
    }

    // devnet/staging/production — REST poll (no WS yet); always Delayed
    onStatus?.('delayed')
    const id = setInterval(async () => {
      const res = await orderBookService.getOrderBook(marketId)
      if (res.ok) onUpdate(res.data)
      else onStatus?.('unavailable')
    }, 3000)
    return () => clearInterval(id)
  },

  subscribeTrades(
    marketId: string,
    onTrade: (trade: PublicTrade) => void,
  ): () => void {
    if (!ENV.IS_LOCAL_API) {
      // devnet/staging/production — REST poll every 3s; no push stream yet
      let lastId = ''
      const id = setInterval(async () => {
        const res = await orderBookService.getRecentTrades(marketId, 20)
        if (!res.ok) return
        for (const t of res.data) {
          if (t.id === lastId) break
          onTrade(t)
        }
        if (res.data.length > 0) lastId = res.data[0].id
      }, 3000)
      return () => clearInterval(id)
    }
    return simClient.subscribeTrades(marketId, (msg) => {
      const m = msg as { trade: { id: string; price: number; quantity: number; takerSide: string; createdAt: number } }
      if (!m.trade) return
      onTrade({
        id:       m.trade.id,
        marketId,
        price:    m.trade.price.toFixed(2),
        quantity: String(m.trade.quantity),
        side:     m.trade.takerSide as 'buy' | 'sell',
        tradedAt: new Date(m.trade.createdAt).toLocaleTimeString('en-US', { hour12: false }),
      })
    })
  },
}
