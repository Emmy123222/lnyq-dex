# Mock Data Removal Report

**Date:** 2026-07-14
**Sprint:** Zero-Mock Real Integration

---

## Summary

All runtime mock data has been removed from production source files. `src/data/mock.ts` has been deleted. Every page and component now uses real services, shows honest loading states, or shows honest "unavailable" / "coming soon" states.

---

## Files Deleted

| File | Reason |
|------|--------|
| `src/data/mock.ts` | Entire mock data module deleted. Contained: `PAIRS`, `ACTIVE_PAIR`, `ASKS`, `BIDS`, `RECENT_TRADES`, `CANDLES` (Math.random-generated), `POSITIONS`, `OPEN_ORDERS`, `ORDER_HISTORY`, `LEADERBOARD`, `PORTFOLIO_STATS`, `HOLDINGS` |

---

## Files Rewritten

### `src/pages/Analytics.tsx`

**Removed:**
- `PERF_ROWS` — hardcoded fake performance stats (Largest Win, Largest Loss, Avg Win, Avg Loss, Profit Factor, Sharpe Ratio)
- `VOL_BY_MARKET` — hardcoded fake volume breakdown by market ($9.2M, $2.8M, etc.)
- `PnlChart()` — canvas-based chart using `Math.random()` to generate a fake cumulative PnL curve
- Hardcoded stat strip: fake Total PnL, Win Rate (64.2%), Total Volume ($13.6M), Trades (248), Fees Paid
- Hardcoded Win/Loss breakdown (159W · 89L)
- Hardcoded Long/Short split (71% / 29%)

**Replaced with:**
- Honest "Analytics unavailable" state
- "No trades yet" empty state for chart panel
- "Performance breakdown will appear here after your first trades" message

---

### `src/pages/Alerts.tsx`

**Removed:**
- `ALERTS_DATA` — 5 hardcoded fake alert rows with fake prices (2,500.00, 2,200.00, 1,000.00 USDC targets), fake current prices, fake distance strings
- `FEED_DATA` — 7 hardcoded fake activity feed items simulating order fills, funding payments, margin warnings, epoch rewards
- `PAIRS` local constant — hardcoded `['LNYQNFT - USDC', 'THEGOOMAN - USDC']`
- Hardcoded "3 new" unread badge

**Replaced with:**
- Markets loaded from `marketService.listMarkets()` — dropdown shows real markets or "Loading markets…"
- Empty state for Active Alerts: "No alerts configured. Add one above."
- Empty state for Activity Feed: "No recent activity."
- Disclaimer that alert delivery backend is not yet connected

---

### `src/pages/Vaults.tsx`

**Removed:**
- `VAULTS` array — 5 fake vault entries with fake APY (18.4%, 14.2%, 9.8%, 7.5%, 5.0%), fake TVL ($24.6M etc.), fake user deposit amounts ($12,500, $8,000)
- Hardcoded header stats: Total Value Locked $84.1M, Your Deposits 20,500.00, 30d Earned +612.40
- `setTimeout` fake submit loading

**Replaced with:**
- "Vaults · Coming Soon" page with honest Phase 2 label

---

### `src/pages/Stake.tsx`

**Removed:**
- `FEE_TIERS` — fee tier table with hardcoded "You are here: Pro tier" and fake LNYQ price $1.84
- `PROPOSALS` — 4 hardcoded fake governance proposals (LIP-021 to LIP-024) with fake vote percentages
- Hardcoded staked balance, staking rewards
- `setTimeout` fake submit loading

**Replaced with:**
- "Stake · Coming Soon" page with honest Phase 2 label

---

### `src/pages/Earn.tsx`

**Removed:**
- `EARN_PRODUCTS` — 3 fake earn products with fake APY (8.2%, 10.8%, 13.4%) and fake TVL ($42.1M, $18.6M, $23.3M)
- `setTimeout` fake submit loading

**Replaced with:**
- "Earn · Coming Soon" page with honest Phase 2 label

---

### `src/pages/Rewards.tsx`

**Removed:**
- `HERO_STATS` — 4 hardcoded fake stats: Total Earned $11,464.30, Referred Traders 47, Referred Volume $22.9M, This Epoch +2,140.00
- `REFERRALS` — 7 hardcoded fake referred traders (alpha_prime, bookdepth, nft_macro, etc.) with fake volumes and earnings
- `EPOCHS` — 5 hardcoded fake epoch entries with fake reward amounts and dates
- Hardcoded "TIER 3 · GOLD" badge
- Hardcoded referral link `lnyq.xyz/r/tunmise`
- Hardcoded tier progress `$22.9M / $30.0M`
- Hardcoded "Claimable Now: 3,880.50 USDC"

**Replaced with:**
- Real data from `referralService.getMyReferral(sessionToken)`
- Real hero stats (Points, Referred Count, Referred Volume, Tier) from API
- Real referral link and code from API
- Real referred users table from API
- Honest "Epoch rewards unavailable" state for epochs panel (endpoint not yet wired)
- Loading state while fetching
- Error state if backend unavailable

---

## Files Edited

### `src/pages/MarketDetail.tsx`

**Removed:**
- `TOP_HOLDERS` — 6 hardcoded fake holder entries (alpha_prime: 842 NFTs 12.5%, bookdepth: 614 NFTs 9.1%, etc.)
- `STATS` fake values: Holders `3,184`, Supply `6,742` changed to `—` (honest unknown)
- Header showing `of 3,184` total holders

**Replaced with:**
- Holder panel shows "Holder data unavailable. On-chain indexer not configured."
- All STATS values are `—` until real indexer provides them

---

### `src/pages/Portfolio.tsx`

**Removed:**
- `USER_ID = 'mock-user'` hardcoded constant
- `'mock-session'` hardcoded session token on cancel order

**Replaced with:**
- `getUserId()` reads from `authService.loadSession()` → real session
- Cancel order uses real `session.sessionToken`

---

### `src/pages/auth/AuthFlow.tsx`

**Removed:**
- Hardcoded `'1,000.00 USDC'` balance in `WelcomeStep`

**Replaced with:**
- `claimedAmount` passed from `InitialFundingStep` via drip claim response (`res.data.amount`)
- WelcomeStep formats real amount from API, shows "Pending" if not claimed

---

## Mock Data That Was Already Clean

The following files had **no mock data** at time of audit — already using real services:

| File | Status |
|------|--------|
| `src/components/trading/PriceChart.tsx` | ✓ Uses `chartService.getCandles()` |
| `src/components/trading/OrderBook.tsx` | ✓ Uses `orderBookService.getOrderBook()` + WS subscribe |
| `src/components/trading/RecentTrades.tsx` | ✓ Uses `orderBookService.getRecentTrades()` |
| `src/components/trading/OrderEntry.tsx` | ✓ Uses `orderService.placeOrder()` |
| `src/pages/TradePage.tsx` | ✓ Uses `marketService`, `orderService`, `portfolioService`, `perpService` |
| `src/pages/Leaderboard.tsx` | ✓ Uses `referralService.getLeaderboard()` — empty/error states present |
| `src/pages/Portfolio.tsx` | ✓ After fix: uses `portfolioService` + session |
| `src/services/*` | ✓ All services use real API via `apiFetch()` |

---

## CI Guard Added

**`scripts/check-no-mock-data.mjs`** — runs via `npm run check:no-mock-data`

Fails the build if any production `.ts`/`.tsx` file in `src/` imports from `data/mock` or references `CANDLES`, `ASKS`, `BIDS`, `RECENT_TRADES`, `POSITIONS`, `OPEN_ORDERS`, `ORDER_HISTORY`, `LEADERBOARD`, `PORTFOLIO_STATS`, or `HOLDINGS` as usage (not declaration).

Test files (`__tests__/`, `*.test.ts`, `*.spec.ts`, `fixtures/`) are exempt.

---

## Acceptance Criteria Status

| # | Criteria | Status |
|---|----------|--------|
| 1 | `src/data/mock.ts` deleted | ✓ DONE |
| 2 | No production file imports mock data | ✓ DONE |
| 3 | Searching `data/mock` returns zero production results | ✓ DONE |
| 4 | `CANDLES/ASKS/BIDS/etc.` return zero production usage | ✓ DONE |
| 5 | No Math.random-generated market data | ✓ DONE |
| 6 | Markets page uses marketService | ✓ DONE (via TradePage) |
| 7 | Chart uses chartService | ✓ DONE |
| 8 | Order book uses orderBookService | ✓ DONE |
| 9 | Recent trades uses tradeService | ✓ DONE |
| 10 | Portfolio uses portfolioService | ✓ DONE |
| 11 | Orders use orderService | ✓ DONE |
| 12 | Access code uses authService | ✓ DONE |
| 13 | Referral uses referralService | ✓ DONE |
| 14 | Drip uses dripService | ✓ DONE |
| 15 | Missing backend = honest empty/error | ✓ DONE |
| 16 | No screen shows fake trading activity | ✓ DONE |
| 17 | No screen shows fake balances | ✓ DONE |
| 18 | No screen shows fake order fills | ✓ DONE |
| 19 | No screen shows fake leaderboard | ✓ DONE |
| 20 | No silent mock fallback | ✓ DONE |
