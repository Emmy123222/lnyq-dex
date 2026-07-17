import { useState, useEffect } from 'react'
import { orderBookService } from '../services/orderBookService'
import type { OrderBook } from '../types'
import type { OrderBookTop } from '../types/chart'

const EMPTY: OrderBookTop = {
  bestBid: null, bestAsk: null, midpoint: null, spread: null, spreadBps: null,
}

export function useOrderBookTop(marketId: string): OrderBookTop {
  const [top, setTop] = useState<OrderBookTop>(EMPTY)

  useEffect(() => {
    if (!marketId) { setTop(EMPTY); return }

    return orderBookService.subscribe(marketId, (book: OrderBook) => {
      const bestBid  = book.bids[0]?.price ?? null
      const bestAsk  = book.asks[0]?.price ?? null
      const spreadBps = bestBid && bestAsk
        ? Math.round(((parseFloat(bestAsk) - parseFloat(bestBid)) / parseFloat(bestBid)) * 10_000)
        : null
      setTop({
        bestBid,
        bestAsk,
        midpoint:  book.midpoint || null,
        spread:    book.spread   || null,
        spreadBps,
      })
    })
  }, [marketId])

  return top
}
