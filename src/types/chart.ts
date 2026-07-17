export type CandleInterval  = '1m' | '5m' | '15m' | '1h' | '4h' | '1D'
export type ChartMode       = 'candles' | 'area' | 'line'

export type ChartDataStatus =
  | 'loading'
  | 'live'
  | 'delayed'
  | 'reconnecting'
  | 'empty'
  | 'unavailable'
  | 'error'

export interface OrderBookTop {
  bestBid:   string | null
  bestAsk:   string | null
  midpoint:  string | null
  spread:    string | null
  spreadBps: number | null
}

export interface ChartIndicators {
  volume:   boolean
  midpoint: boolean
  bidAsk:   boolean
}

export interface ChartTooltipData {
  time:   string
  open:   number
  high:   number
  low:    number
  close:  number
  volume: number
  x:      number
  y:      number
}
