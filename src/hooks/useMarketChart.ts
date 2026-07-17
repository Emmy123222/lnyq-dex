import { useState, useEffect, useCallback } from 'react'
import { chartService } from '../services/chartService'
import type { Candle } from '../types'
import type { CandleInterval, ChartDataStatus } from '../types/chart'

export function useMarketChart(marketId: string, interval: CandleInterval) {
  const [candles, setCandles]   = useState<Candle[]>([])
  const [status,  setStatus]    = useState<ChartDataStatus>('loading')
  const [error,   setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!marketId) { setStatus('unavailable'); setCandles([]); return }
    setStatus('loading')
    setError(null)

    const res = await chartService.getCandles(marketId, interval, 300)
    if (!res.ok) {
      const msg = res.error.code === 'INTEGRATION_UNAVAILABLE'
        ? 'Backend not configured.'
        : res.error.message
      setError(msg)
      setStatus('error')
      return
    }
    if (res.data.length === 0) {
      setCandles([])
      setStatus('empty')
      return
    }
    setCandles(res.data)
    // live status comes from subscribe callback below
  }, [marketId, interval])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!marketId) return
    return chartService.subscribe(
      marketId,
      interval,
      (candle: Candle) => {
        setCandles(prev => {
          const i = prev.findIndex(c => c.time === candle.time)
          if (i >= 0) {
            const next = [...prev]
            next[i] = candle
            return next
          }
          return [...prev, candle]
        })
      },
      (s) => {
        if      (s === 'live')         setStatus('live')
        else if (s === 'delayed')      setStatus('delayed')
        else if (s === 'reconnecting') setStatus('reconnecting')
        else                           setStatus('unavailable')
      },
    )
  }, [marketId, interval])

  return { candles, status, error, refetch: load }
}
