# LNYQ DEX

A non-custodial spot CLOB exchange built on Solana, in active development toward Phase 1 launch.

## Stack

| Layer       | Technology                                                 |
|-------------|------------------------------------------------------------|
| Frontend    | React 19 · TypeScript · Vite 8 · Tailwind CSS v4          |
| Auth/Wallet | Privy embedded wallet (email login → Solana wallet)        |
| Backend     | Node.js · Express · Prisma · PostgreSQL                    |
| Matching    | Central Limit Order Book (CLOB) — local sim in Phase 1     |
| Bridge      | Squid Router (Phase 3 — cross-chain USDC deposit)         |

## Modules

| Module       | Phase | Status          |
|--------------|-------|-----------------|
| Spot CLOB    | 1     | Active          |
| Launchpad    | 2     | Coming soon     |
| Perpetuals   | 2     | Coming soon     |
| POMM         | 3     | Planned         |
| Cross-chain  | 3     | Planned         |

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL (for the API server)

### Frontend

```bash
cp .env.example .env.local     # fill in VITE_LNYQ_API_URL at minimum
npm install
npm run dev
```

### API server

```bash
cd server
cp .env.example .env
npm install
npm run db:push                # apply schema to your Postgres DB
npm run db:seed                # seed markets and MM bot balances
npm run dev
```

### Environment variables

| Variable                  | Required | Description                              |
|---------------------------|----------|------------------------------------------|
| `VITE_LNYQ_API_URL`       | Yes      | Backend API base URL                     |
| `VITE_LNYQ_WS_URL`        | Yes      | WebSocket URL for real-time data         |
| `VITE_LNYQ_ENV`           | No       | `local-api` / `devnet-api` / `staging` / `production` (default: `local-api`) |
| `VITE_PRIVY_APP_ID`       | No       | Enables Privy embedded wallet (Phase 1)  |
| `VITE_ENABLE_DEPOSITS`    | No       | Show Deposit button (requires wallet)    |
| `VITE_ENABLE_CROSS_CHAIN` | No       | Enable Squid Router tab (Phase 3)        |
| `VITE_ENABLE_PERPS`       | No       | Show Perps markets (Phase 2)             |
| `VITE_SQUID_INTEGRATOR_ID`| No       | Required when CROSS_CHAIN=true           |

## Scripts

```bash
npm run dev              # start Vite dev server
npm run build            # TypeScript check + production build
npm run test             # run unit tests (vitest)
npm run test:types       # TypeScript type-check + no-mock-data check
npm run lint             # oxlint
npm run check:no-mock-data  # verify no mock data in source
```

## Architecture

```
src/
  config/          env.ts, featureFlags.ts — all flags defined here
  contexts/        WalletContext — Privy embedded wallet
  components/
    layout/        Header, AppShell
    trading/       OrderBook, OrderEntry, MarketChartCard, PriceChart
    ui/            DepositModal, Toast, BridgeStatusTracker
  hooks/           useMarketChart, useMarketTicker, useOrderBookTop
  pages/           TradePage, MarketDetails, MarketDetail, Portfolio …
  services/        authService, orderService, marketService, squidService …
  utils/           decimal.ts — price/quantity formatting + submission validation
server/
  src/
    engine.ts      CLOB matching engine (price-time priority, FOK, self-trade prevention)
    routes.ts      REST API
    ws.ts          WebSocket server
    settlement/    Adapter pattern — real settlement wired here when protocol team delivers
```

## Phase 1 scope

Phase 1 is **spot CLOB only**. The following are explicitly not available:

- Real on-chain settlement (simulated locally)
- Perpetuals and funding rates
- Cross-chain deposits
- Leaderboard and rewards (UI shell only)
- On-chain holder data

The `EnvBadge` in the header always shows `CLOB SIM` to make simulation status visible.

## Settlement honesty

The matching engine runs locally. No Solana programs exist yet. The protocol team will wire real settlement before mainnet. The `server/src/settlement/` adapter is the designated integration point.

## Wallet

When `VITE_PRIVY_APP_ID` is set, users sign up with email and receive a non-custodial embedded Solana wallet via Privy. The wallet address is linked to their LNYQ account via `PATCH /auth/wallet`. When the env var is not set, wallet UI is hidden and the app functions without a wallet.

## No mock data policy

All services return `INTEGRATION_UNAVAILABLE` when the backend is not configured. There is no silent fallback to fake data anywhere in the codebase. Run `npm run check:no-mock-data` to verify.
