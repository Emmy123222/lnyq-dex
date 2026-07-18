# Phase 1 Readiness Checklist

**Last updated:** 2026-07-18

Phase 1 = spot CLOB on Solana, local simulation + devnet testnet. This document records
explicit product decisions for items that are intentionally incomplete and will be upgraded
in Phase 2.

---

## Streaming: chart and order book

**Product decision: Delayed polling is accepted for Phase 1.**

There is no devnet WebSocket endpoint for candles or order-book deltas yet. That endpoint
will be provided by the protocol team in Phase 2. Until then:

| Mode | Chart | Order book |
|------|-------|------------|
| `local-api` | WebSocket (live, `Sim·Live` badge) | WebSocket + seqNum gap detection (`Live` badge) |
| `devnet` / `staging` / `prod` | REST poll every 10 s (`Delayed` badge) | REST poll every 3 s (`Delayed` badge) |

The `Delayed` badge is shown in amber in the chart header and order-book toolbar whenever
the app is not on `local-api`. This is honest — the user always knows the data is polled,
not streamed.

**This is final for Phase 1. No further action required until the protocol team provides
a devnet WS endpoint.**

---

## Quantity precision: whole units only (Phase 1)

**Product decision: all collection tokens trade in whole integer units in Phase 1.**

This is enforced at three layers:

1. **UI** — `OrderEntry.submit()` rejects non-integer strings via `/^\d+$/.test()`
2. **Backend route** — `Number(quantity)` drops any decimal before the engine
3. **Engine** — `!Number.isInteger(req.quantity)` returns `{ error: 'Quantity must be a positive integer' }`

Rational: Phase 1 collections are low-supply NFT-like assets where fractional ownership
is out of scope. Fractional quantity support (e.g. 0.5 SOL) requires Phase 2:
- Prisma schema change: `quantity: Decimal` (remove integer constraint)
- Engine integer guard removed; step-size validation added instead
- Fill/balance arithmetic updated to use BigInt fixed-point
- UI input updated to allow decimal step matching market `minOrderSize`

---

## Backend accounting: fixed-point safety

`roundMoney(n)` (rounds to 8 decimal places) is applied to every computed monetary amount
before it is written to the database or compared against a stored balance. Covered paths:

- Spot buy: `lockAmt`, settlement debit, IOC unlock
- Spot sell: settlement credit
- Perp: margin lock, margin debit, realized PnL, released margin, weighted-average entry,
  position margin increment/create
- `calcFee()` independently rounds to 2 decimal places (cents)

Any future money computation added to the engine must be wrapped in `roundMoney()` before
passing to `lockBalance`, `debitLocked`, `creditBalance`, or `unlockBalance`.

Phase 2 upgrade path: replace `roundMoney()` + JS Number arithmetic with BigInt fixed-point
throughout the engine, matching the `src/utils/decimal.ts` utilities used on the frontend.

---

## Server tests: CI

Server integration tests run against PostgreSQL and are wired to GitHub Actions:

- **Workflow**: `.github/workflows/server-tests.yml`
- **Trigger**: any push or PR that modifies `server/**`
- **Sidecar**: `postgres:16`, credentials `lnyq/lnyq`, DB `lnyq_test`
- **Steps**: `npm ci` → `prisma db push` → `npm test`

Local setup: see `server/TESTING.md`.

**Requirement: server tests must pass locally before merging any engine change.**

---

## What is NOT in Phase 1

| Feature | Phase |
|---------|-------|
| Fractional quantity trading | Phase 2 |
| Devnet / prod WebSocket streams (candles, order book) | Phase 2 |
| On-chain settlement (Solana program) | Protocol team |
| Perpetuals (perp market type) | Phase 2 |
| Real USDC deposits via Squid / cross-chain bridge | Phase 2 |
| Fractional fixed-point engine arithmetic | Phase 2 |
