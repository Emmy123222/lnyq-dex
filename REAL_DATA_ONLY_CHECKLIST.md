# Real Data Only Checklist

**Date:** 2026-07-14

This document proves that no runtime mock data remains in production source.

---

## Automated Check

Run at any time:

```bash
npm run check:no-mock-data
```

**Result as of 2026-07-14:** ✓ No mock runtime data found in production source.

The script (`scripts/check-no-mock-data.mjs`) scans all `.ts`/`.tsx` files in `src/` and fails if it finds:
- Imports from `data/mock` or any `*/mock` path
- Usage of `CANDLES`, `ASKS`, `BIDS`, `RECENT_TRADES`, `OPEN_ORDERS`, `ORDER_HISTORY`, `LEADERBOARD`, `PORTFOLIO_STATS`, `HOLDINGS`

---

## Manual Checklist

### `src/data/mock.ts`

- [x] File **deleted** — no longer exists

### Markets Page

- [x] Markets list fetched from `marketService.listMarkets()`
- [x] No fake `PAIRS` imported
- [x] Empty state shown: "No active markets yet."
- [x] Error state shown if backend unavailable

### Chart

- [x] Candles fetched from `chartService.getCandles()`
- [x] No `Math.random()` candle generation
- [x] Empty state shown: "No trades yet." (empty candles array)
- [x] Error state shown: "Backend not configured."
- [x] Timeframe buttons trigger real refetch

### Order Book

- [x] Snapshot from `orderBookService.getOrderBook()`
- [x] WS deltas via `orderBookService.subscribe()`
- [x] No fake `ASKS` or `BIDS` imported
- [x] Empty state: no rows rendered when book is empty
- [x] Loading state while fetching

### Recent Trades

- [x] Trades from `orderBookService.getRecentTrades()`
- [x] No fake `RECENT_TRADES` imported
- [x] Loading state: "Loading…"
- [x] Empty when no trades exist

### Order Entry

- [x] Uses real market metadata from `marketService`
- [x] Submits via `orderService.placeOrder()`
- [x] No fake successful placement
- [x] Uses real balance check from portfolio

### Portfolio

- [x] Stats, balances, positions from `portfolioService.getPortfolio()`
- [x] No fake `PORTFOLIO_STATS` or `HOLDINGS`
- [x] `USER_ID` from real session (`authService.loadSession()`)
- [x] Loading state: "Loading portfolio…"
- [x] Empty state per tab ("No open positions", "No open orders", "No order history")

### Open Orders

- [x] From `orderService.getOpenOrders()`
- [x] No fake `OPEN_ORDERS`
- [x] Cancel order uses real session token

### Order History

- [x] From `orderService.getOrderHistory()`
- [x] No fake `ORDER_HISTORY`

### Access Code Verification

- [x] Calls `authService.verifyAccessCode()`
- [x] No local code approval
- [x] Error state per status: INVALID, ALREADY_USED, EXPIRED

### USDC Drip

- [x] Calls `dripService.claim()`
- [x] No fake balance update
- [x] Error shown if claim fails
- [x] Claimed amount shown from real API response (not hardcoded 1,000)

### Referral

- [x] `referralService.getMyReferral()` — Rewards page
- [x] `referralService.getLeaderboard()` — Leaderboard page
- [x] No fake `HERO_STATS`, `REFERRALS`, `EPOCHS`
- [x] Empty state when no referred users
- [x] "Leaderboard backend not configured" when unavailable

### Leaderboard

- [x] From `referralService.getLeaderboard()`
- [x] No fake `LEADERBOARD`
- [x] Empty state: "No leaderboard data yet."
- [x] Error: "Leaderboard backend not configured."

### Analytics

- [x] No `Math.random()` PnL chart
- [x] No fake `PERF_ROWS` (Largest Win, Sharpe, etc.)
- [x] No fake `VOL_BY_MARKET`
- [x] Shows: "Analytics API unavailable."

### Alerts

- [x] No fake `ALERTS_DATA`
- [x] No fake `FEED_DATA`
- [x] Markets dropdown from `marketService.listMarkets()`
- [x] Empty active alerts state
- [x] Empty activity feed state

### Vaults / Stake / Earn

- [x] No fake APY, TVL, deposit amounts
- [x] No fake governance proposals
- [x] All three show "Coming Soon · Phase 2"

### MarketDetail

- [x] No fake `TOP_HOLDERS`
- [x] No fake Holders count (3,184) or Supply (6,742) — both `—`
- [x] Chart from `chartService.getCandles()`
- [x] Order book from `orderBookService.getOrderBook()`

---

## Data Mode Indicator

The app never labels data as "Mock", "Demo", or "Simulated".

Honest labels used:
- **"Live"** — only when WebSocket is connected and healthy
- **"Delayed"** — when using REST snapshot without WebSocket
- **"Unavailable"** — when endpoint is unreachable
- **"Backend not configured"** — when `INTEGRATION_UNAVAILABLE` error
- **"Coming soon"** — for Phase 2/3 features
- **"No trades yet"** — honest empty state

---

## What Requires a Running Backend

The following features require the LNYQ API server (`npm run sim` in `server/`) to return data:

| Feature | Backend required |
|---------|-----------------|
| Market list | ✓ `GET /markets` |
| Order book | ✓ `GET /markets/:id/orderbook` + WS |
| Recent trades | ✓ `GET /markets/:id/trades` |
| Candles | ✓ `GET /markets/:id/candles` |
| Portfolio | ✓ `GET /portfolio` |
| Order placement | ✓ `POST /orders` |
| Access code | ✓ `POST /auth/verify-code` |
| USDC drip | ✓ `POST /drip/claim` |
| Referral data | ✓ `GET /referral` |
| Leaderboard | ✓ `GET /referrals/leaderboard` |

When backend is offline, every panel shows an honest error or unavailable state. Nothing falls back to fake data.
