# API Integration Dependencies

**Date:** 2026-07-14
**Scope:** Phase 1 production requirements

All frontend services call `${VITE_LNYQ_API_URL}` (REST) or `${VITE_LNYQ_WS_URL}` (WebSocket). No mock fallbacks.

---

## Required Environment Variables

```env
VITE_LNYQ_API_URL=http://localhost:3001/api   # local dev
VITE_LNYQ_WS_URL=ws://localhost:3002          # local dev
VITE_LNYQ_CHAIN=solana-devnet
VITE_ENABLE_PERPS=false
VITE_ENABLE_CROSS_CHAIN=false
VITE_ENABLE_PRESALE=false
```

**Not allowed:**
```
VITE_LNYQ_MODE=mock
VITE_ENABLE_MOCK_DATA=true
VITE_USE_DEMO_DATA=true
```

---

## REST Endpoints

### Health

| Endpoint | Method | Used by | Response |
|----------|--------|---------|----------|
| `/health` | GET | `healthService` | `{ ok: true, status: 'ok', mode, chain, uptime, services[] }` |

---

### Markets

| Endpoint | Method | Used by | Response |
|----------|--------|---------|----------|
| `/markets` | GET | `marketService.listMarkets()` | `Market[]` |
| `/markets/:id` | GET | `marketService.getMarket()` | `Market` |
| `/markets/:id/ticker` | GET | `marketService.getTicker()` | `MarketTicker` |
| `/markets/tickers` | GET | `marketService.getAllTickers()` | `MarketTicker[]` |
| `/markets/:id/orderbook` | GET | `orderBookService.getOrderBook()` | `OrderBook` |
| `/markets/:id/trades` | GET | `orderBookService.getRecentTrades()` | `PublicTrade[]` |
| `/markets/:id/candles` | GET | `chartService.getCandles()` | `Candle[]` |
| `/markets/:id/funding` | GET | `perpService.getFundingRate()` | `FundingRateInfo` |
| `/markets/:id/oi` | GET | `perpService.getOpenInterest()` | `OpenInterestInfo` |

**Candles query params:** `?interval=1m&limit=300`

**MarketTicker shape:**
```json
{
  "marketId": "LNYQNFT-USDC-SPOT",
  "lastPrice": "2452.50",
  "change24h": "+5.21",
  "volume24h": "12400000.00",
  "high24h": "2478.00",
  "low24h": "2344.00"
}
```

**OrderBook shape:**
```json
{
  "marketId": "LNYQNFT-USDC-SPOT",
  "asks": [{ "price": "2461.00", "size": "1", "total": "1" }],
  "bids": [{ "price": "2452.50", "size": "7", "total": "7" }],
  "spread": "8.50",
  "spreadPct": "0.347",
  "midpoint": "2456.75",
  "sequenceNumber": 1042,
  "updatedAt": "2026-07-14T12:00:00Z"
}
```

---

### Auth

| Endpoint | Method | Used by | Request | Response |
|----------|--------|---------|---------|----------|
| `/auth/verify-code` | POST | `authService.verifyAccessCode()` | `{ code }` | `{ status: 'VALID'\|'INVALID'\|'ALREADY_USED'\|'EXPIRED' }` |
| `/auth/signup` | POST | `authService.signup()` | `{ email, username, accessCode }` | `{ userId, sessionToken, referralCode, username }` |
| `/auth/session` | GET | `authService.validateSession()` | Bearer token | `{ userId, username, referralCode }` |

---

### Portfolio & Orders

| Endpoint | Method | Used by | Notes |
|----------|--------|---------|-------|
| `/portfolio` | GET | `portfolioService.getPortfolio()` | Bearer token required |
| `/users/:id/balances` | GET | `portfolioService.getPortfolio()` | Fallback |
| `/orders` | POST | `orderService.placeOrder()` | Place limit/market order |
| `/orders/open` | GET | `orderService.getOpenOrders()` | Bearer token |
| `/orders/history` | GET | `orderService.getOrderHistory()` | Bearer token |
| `/orders/:id/cancel` | POST | `orderService.cancelOrder()` | Bearer token |

**PlaceOrder request:**
```json
{
  "marketId": "LNYQNFT-USDC-SPOT",
  "userId": "user-uuid",
  "side": "buy",
  "type": "limit",
  "price": "2440.00",
  "quantity": "5",
  "timeInForce": "GTC"
}
```

**Portfolio response:**
```json
{
  "stats": {
    "equity": "58420.00",
    "availableBalance": "41588.00",
    "marginUsed": "0.00",
    "unrealizedPnl": "0.00",
    "allTimePnl": "0.00",
    "referralPoints": 0
  },
  "balances": [
    { "asset": "USDC", "total": "1000.00", "available": "1000.00", "locked": "0.00", "pending": "0.00", "usdValue": "1000.00" }
  ],
  "positions": []
}
```

---

### Drip (Testnet Faucet)

| Endpoint | Method | Used by | Request | Response |
|----------|--------|---------|---------|----------|
| `/drip/status` | GET | `dripService.getStatus()` | Bearer token | `{ status, amount?, claimedAt? }` |
| `/drip/claim` | POST | `dripService.claim()` | Bearer token | `{ success, status, amount, txSignature? }` |

---

### Referral

| Endpoint | Method | Used by | Notes |
|----------|--------|---------|-------|
| `/referral` | GET | `referralService.getMyReferral()` | Local-api mode |
| `/referrals/me` | GET | `referralService.getMyReferral()` | devnet-api mode |
| `/referral/apply` | POST | `referralService.applyReferral()` | Local-api |
| `/referrals/apply` | POST | `referralService.applyReferral()` | devnet-api |
| `/referrals/leaderboard` | GET | `referralService.getLeaderboard()` | Returns `[{ username, points, rank }]` |

---

### Perps (Phase 2, gated by `VITE_ENABLE_PERPS=true`)

| Endpoint | Method | Used by | Notes |
|----------|--------|---------|-------|
| `/markets/:id/funding` | GET | `perpService.getFundingRate()` | `{ rate8h, rateAnnualized, markPrice, paysDirection, nextFundingMs }` |
| `/markets/:id/oi` | GET | `perpService.getOpenInterest()` | `{ notional, longPct, shortPct }` |
| `/positions` | GET | `perpService.getPositions()` | Bearer token. Open perp positions. |
| `/positions/:id/close` | POST | `perpService.closePosition()` | Market close at mark price |

---

## WebSocket Stream

**URL:** `${VITE_LNYQ_WS_URL}` (e.g. `ws://localhost:3002`)

**Subscribe:** `{ type: 'subscribe', marketId: 'LNYQNFT-USDC-SPOT' }`

**Events:**

```json
{ "type": "orderbook_snapshot", "data": { /* OrderBook */ } }
{ "type": "orderbook_delta", "data": { "asks": [], "bids": [], "sequenceNumber": 1043 } }
{ "type": "trade", "data": { "id": "...", "price": "2452.50", "quantity": "3", "side": "buy", "tradedAt": "..." } }
{ "type": "candle", "data": { "time": 1720000000, "open": 2450, "high": 2460, "low": 2445, "close": 2455, "volume": 12 } }
{ "type": "order_update", "data": { /* Order */ } }
{ "type": "balance_update", "data": { /* Balance[] */ } }
```

**Connection rules:**
1. Fetch fresh snapshot from REST before applying any delta.
2. Apply deltas only after snapshot is received.
3. Ignore deltas with sequenceNumber ≤ last applied.
4. Refetch snapshot if sequence gap detected.
5. Show "Live" badge only when WS is connected and healthy.
6. Show "Delayed" when using REST snapshot without WS.
7. Show "Unavailable" when both REST and WS are unreachable.

---

## Error Handling

All service calls return `ServiceResult<T>`:

```typescript
type ServiceResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: { code: string; message: string; httpStatus?: number } }
```

**Error codes:**
| Code | Meaning | UI behavior |
|------|---------|-------------|
| `NETWORK_ERROR` | fetch() threw (no connectivity) | "Backend unavailable" |
| `HTTP_ERROR` | Non-2xx HTTP response | Show `error.message` |
| `INTEGRATION_UNAVAILABLE` | Feature not wired to backend | "Integration unavailable" |
| `INVALID_SESSION` | Session expired | Redirect to `/auth` |

---

## Not-Yet-Wired Endpoints (Integration Stubs)

These features show "unavailable" or "coming soon" until backend provides real endpoints:

| Feature | Status |
|---------|--------|
| Analytics API (PnL, win rate, volume breakdown) | Not yet available |
| Alert delivery backend | Not yet available |
| Epoch rewards claim | Not yet available |
| Top holders indexer | Not yet available |
| Email OTP (send/verify) | Not yet available |
| On-chain settlement | Not applicable in Phase 1 |
