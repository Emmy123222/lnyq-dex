import type { OrderBookLevel, Trade, Candle, Pair, Position, LegacyOrder, Trader } from '../types'

export const PAIRS: Pair[] = [
  { base: 'LNYQNFT',   quote: 'USDC', type: 'perp',  lastPrice: 2456.00,  change24h:  5.21, volume24h: 48_200_000, high24h: 2501.00, low24h: 2318.00 },
  { base: 'LNYQNFT',   quote: 'USDC', type: 'spot',  lastPrice: 2452.50,  change24h:  4.08, volume24h: 12_400_000, high24h: 2478.00, low24h: 2344.00 },
  { base: 'THEGOOMAN', quote: 'USDC', type: 'perp',  lastPrice:  948.00,  change24h: -2.28, volume24h:  6_100_000, high24h:  976.00, low24h:  922.00 },
  { base: 'THEGOOMAN', quote: 'USDC', type: 'spot',  lastPrice:  946.20,  change24h: -1.90, volume24h:  2_800_000, high24h:  971.00, low24h:  928.00 },
]

export const ACTIVE_PAIR = PAIRS[0]

export const ASKS: OrderBookLevel[] = [
  { price: 2490.00, size: 12, total: 48 },
  { price: 2483.00, size:  8, total: 36 },
  { price: 2475.00, size: 15, total: 28 },
  { price: 2470.00, size:  5, total: 13 },
  { price: 2467.00, size:  4, total:  8 },
  { price: 2464.50, size:  2, total:  4 },
  { price: 2463.00, size:  1, total:  2 },
  { price: 2461.00, size:  1, total:  1 },
]

export const BIDS: OrderBookLevel[] = [
  { price: 2452.50, size:  7, total: 52 },
  { price: 2448.00, size: 11, total: 45 },
  { price: 2443.00, size:  9, total: 34 },
  { price: 2440.00, size: 14, total: 25 },
  { price: 2436.00, size:  4, total: 11 },
  { price: 2432.00, size:  4, total:  7 },
  { price: 2428.00, size:  2, total:  3 },
  { price: 2424.00, size:  1, total:  1 },
]

export const RECENT_TRADES: Trade[] = [
  { id:  '1', price: 2452.50, size:  3, side: 'buy',  time: '14:32:11' },
  { id:  '2', price: 2451.00, size:  7, side: 'sell', time: '14:32:08' },
  { id:  '3', price: 2453.00, size:  2, side: 'buy',  time: '14:32:04' },
  { id:  '4', price: 2452.50, size:  5, side: 'buy',  time: '14:31:59' },
  { id:  '5', price: 2449.00, size: 10, side: 'sell', time: '14:31:55' },
  { id:  '6', price: 2450.00, size:  4, side: 'buy',  time: '14:31:50' },
  { id:  '7', price: 2448.00, size:  8, side: 'sell', time: '14:31:46' },
  { id:  '8', price: 2452.50, size:  1, side: 'buy',  time: '14:31:41' },
  { id:  '9', price: 2447.00, size:  6, side: 'sell', time: '14:31:37' },
  { id: '10', price: 2450.00, size:  3, side: 'buy',  time: '14:31:33' },
  { id: '11', price: 2446.00, size:  9, side: 'sell', time: '14:31:28' },
  { id: '12', price: 2452.50, size:  2, side: 'buy',  time: '14:31:24' },
]

function makeCandles(): Candle[] {
  const candles: Candle[] = []
  let price = 2300
  const now = Date.now()
  for (let i = 119; i >= 0; i--) {
    const open = price
    const change = (Math.random() - 0.46) * 60
    const close = Math.max(1800, open + change)
    const high = Math.max(open, close) + Math.random() * 20
    const low  = Math.min(open, close) - Math.random() * 20
    candles.push({ time: now - i * 60_000, open, high, low, close, volume: Math.floor(Math.random() * 40 + 10) })
    price = close
  }
  return candles
}
export const CANDLES: Candle[] = makeCandles()

export const POSITIONS: Position[] = [
  {
    pair: PAIRS[0],
    side: 'buy',
    size: 5,
    entryPrice: 2340.00,
    markPrice: 2456.00,
    pnl:  580.00,
    pnlPct: 4.95,
  },
  {
    pair: PAIRS[2],
    side: 'sell',
    size: 8,
    entryPrice: 960.00,
    markPrice:  948.00,
    pnl:   96.00,
    pnlPct: 1.25,
  },
]

export const OPEN_ORDERS: LegacyOrder[] = [
  {
    id: 'o1',
    pair: PAIRS[1],
    side: 'buy',
    type: 'limit',
    status: 'partial',
    price: 2440.00,
    size: 5,
    filled: 2,
    remaining: 3,
    total: 12200.00,
    timeInForce: 'GTC',
    createdAt: '13:58:32',
    updatedAt: '13:58:32',
  },
  {
    id: 'o2',
    pair: PAIRS[1],
    side: 'sell',
    type: 'limit',
    status: 'open',
    price: 2505.00,
    size: 3,
    filled: 0,
    remaining: 3,
    total: 7515.00,
    timeInForce: 'GTC',
    createdAt: '13:41:17',
    updatedAt: '13:41:17',
  },
]

export const ORDER_HISTORY: LegacyOrder[] = [
  {
    id: 'h1',
    pair: PAIRS[0],
    side: 'buy',
    type: 'limit',
    status: 'filled',
    price: 2340.00,
    size: 5,
    filled: 5,
    remaining: 0,
    total: 11700.00,
    timeInForce: 'GTC',
    createdAt: '2026-07-04 09:14:00',
    updatedAt: '2026-07-04 09:14:22',
  },
  {
    id: 'h2',
    pair: PAIRS[2],
    side: 'sell',
    type: 'market',
    status: 'filled',
    price: 962.00,
    size: 3,
    filled: 3,
    remaining: 0,
    total: 2886.00,
    timeInForce: 'IOC',
    createdAt: '2026-07-03 16:42:00',
    updatedAt: '2026-07-03 16:42:01',
  },
  {
    id: 'h3',
    pair: PAIRS[1],
    side: 'buy',
    type: 'limit',
    status: 'cancelled',
    price: 2280.00,
    size: 2,
    filled: 0,
    remaining: 2,
    total: 4560.00,
    timeInForce: 'GTC',
    createdAt: '2026-07-02 11:30:00',
    updatedAt: '2026-07-02 12:00:00',
  },
  {
    id: 'h4',
    pair: PAIRS[0],
    side: 'sell',
    type: 'limit',
    status: 'filled',
    price: 2420.00,
    size: 4,
    filled: 4,
    remaining: 0,
    total: 9680.00,
    timeInForce: 'GTC',
    createdAt: '2026-07-01 14:55:00',
    updatedAt: '2026-07-01 15:02:00',
  },
]

export const LEADERBOARD: Trader[] = [
  { rank:   1, username: 'alpha_prime',   volume: 4_280_000, pnl:  142_600, pnlPct: 18.4, winRate: 71, trades: 284 },
  { rank:   2, username: 'bookdepth',     volume: 3_910_000, pnl:   98_200, pnlPct: 14.1, winRate: 67, trades: 198 },
  { rank:   3, username: 'nft_macro',     volume: 3_540_000, pnl:   87_400, pnlPct: 12.9, winRate: 65, trades: 312 },
  { rank:   4, username: 'clob_hunter',   volume: 2_920_000, pnl:   64_100, pnlPct:  9.8, winRate: 61, trades: 147 },
  { rank:   5, username: 'spreadseller',  volume: 2_710_000, pnl:   55_800, pnlPct:  8.4, winRate: 58, trades: 421 },
  { rank:   6, username: 'orderflow9',    volume: 2_450_000, pnl:   48_300, pnlPct:  7.2, winRate: 60, trades: 189 },
  { rank:   7, username: 'liquidity_run', volume: 2_180_000, pnl:   41_200, pnlPct:  6.6, winRate: 56, trades: 203 },
  { rank:   8, username: 'tapewatch',     volume: 1_960_000, pnl:   36_700, pnlPct:  5.9, winRate: 55, trades: 167 },
  { rank:   9, username: 'vega_trader',   volume: 1_840_000, pnl:   29_500, pnlPct:  4.8, winRate: 53, trades: 298 },
  { rank:  10, username: 'moon_calls',    volume: 1_620_000, pnl:   24_100, pnlPct:  3.9, winRate: 52, trades: 142 },
  { rank:  11, username: 'flipper7',      volume: 1_510_000, pnl:   20_800, pnlPct:  3.4, winRate: 50, trades: 238 },
  { rank: 142, username: 'tunmise',       volume: 1_840_000, pnl:   24_180, pnlPct:  2.1, winRate: 58, trades: 112, isCurrentUser: true },
]

export const PORTFOLIO_STATS = {
  equity:           58_420.00,
  availableBalance: 41_588.00,
  marginUsed:        8_360.00,
  unrealizedPnl:       472.00,
  crossMarginRatio:      6.4,
  allTimePnl:        8_420.00,
  allTimePnlPct:        16.84,
}

export const HOLDINGS = [
  { asset: 'USDC',     kind: 'Stablecoin', qty: '41,588.00', cost: '1.00',    value: '41,588.00', icon: '$',  swatch: '#26262E' },
  { asset: 'LNYQNFT',  kind: 'NFT',        qty: '5',         cost: '2,340.00', value: '12,280.00', icon: 'L',  swatch: '#A051FC' },
  { asset: 'THEGOOMAN',kind: 'NFT',        qty: '8',         cost: '930.00',   value:  '7,569.60', icon: 'T',  swatch: '#531C97' },
]
