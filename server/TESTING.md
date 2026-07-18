# Server tests

Server-level integration tests run the CLOB matching engine against a real PostgreSQL database (`lnyq_test`). They require a local Postgres instance — no mocking.

## One-time setup

```bash
# Create the test database (assumes you already have lnyq_dev or a local postgres user)
psql postgres -c "CREATE DATABASE lnyq_test;"
psql postgres -c "CREATE USER lnyq WITH PASSWORD 'lnyq';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE lnyq_test TO lnyq;"

# Push the Prisma schema to the test DB (no migration history needed)
DATABASE_URL="postgresql://lnyq:lnyq@localhost:5432/lnyq_test" npx prisma db push --skip-generate
```

If your local user already has superuser access, the `CREATE USER` and `GRANT` lines may not be needed.

## Running tests

```bash
cd server
npm test          # run once
npm run test:watch  # watch mode
```

`vitest.config.ts` injects `DATABASE_URL=postgresql://lnyq:lnyq@localhost:5432/lnyq_test` automatically — no `.env` changes required.

## Resetting test data

Tests call `cleanTestData()` in `afterEach` and delete fixtures in `afterAll`, so the DB stays clean between runs. If a test run is interrupted mid-suite, reset manually:

```bash
psql postgresql://lnyq:lnyq@localhost:5432/lnyq_test \
  -c "TRUNCATE fills, trades, orders, balances, candles CASCADE;"
```

## CI decision

Server tests are **not wired to CI (Vercel / GitHub Actions)** in Phase 1 because they need a Postgres sidecar. Options for Phase 2:

- **GitHub Actions**: add a `postgres` service container (`postgres:16`) and run `npm test` in the `server/` directory after `db push`.
- **Vercel**: not suitable — Vercel build runners have no persistent DB. Server tests should stay in a separate CI workflow.

Until CI is wired, run `npm test` locally before merging any engine changes.
