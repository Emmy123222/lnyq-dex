import { useState, useEffect } from 'react'
import { marketService } from '../services/marketService'
import type { MarketTicker } from '../types'

export function useMarketTicker(marketId: string) {
  const [ticker,  setTicker]  = useState<MarketTicker | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!marketId) { setLoading(false); return }
    setLoading(true)

    marketService.getTicker(marketId).then(res => {
      if (res.ok) setTicker(res.data)
      setLoading(false)
    })

    const id = setInterval(() => {
      marketService.getTicker(marketId).then(res => {
        if (res.ok) setTicker(res.data)
      })
    }, 5_000)

    return () => clearInterval(id)
  }, [marketId])

  return { ticker, loading }
}
