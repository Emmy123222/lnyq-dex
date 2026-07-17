/**
 * Database seed — run once after `prisma migrate dev`
 *
 *   cd server && npm run db:seed
 *
 * Creates:
 *   - 1000 testnet access codes (LNYQ-TESTNET-0001 … LNYQ-TESTNET-1000)
 *   - 100 alpha codes (ALPHA-0001 … ALPHA-0100)
 *   - 2 spot markets (ACTIVE): LNYQNFT-USDC-SPOT, THEGOOMAN-USDC-SPOT
 *   - 2 perp markets (INACTIVE, Phase 2): LNYQNFT-USDC-PERP, THEGOOMAN-USDC-PERP
 *   - MM bot user with unlimited balances
 *   - Default feature flags
 *
 * NOT seeded here (add manually for local dev only):
 *   - Demo codes (DEMO-ACCESS, LNYQ-DEMO, TEST-0001 … TEST-0003)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database…')

  // ── Access codes ─────────────────────────────────────────────────────────────

  const codes: { code: string }[] = []

  // 1000 testnet codes
  for (let i = 1; i <= 1000; i++) {
    codes.push({ code: `LNYQ-TESTNET-${String(i).padStart(4, '0')}` })
  }
  // 100 alpha codes
  for (let i = 1; i <= 100; i++) {
    codes.push({ code: `ALPHA-${String(i).padStart(4, '0')}` })
  }
  // Note: Demo/test codes (DEMO-ACCESS, LNYQ-DEMO, TEST-0001–0003) are local-only.
  // Do NOT seed them into devnet or staging. Add them manually in local dev only.

  let codesCreated = 0
  for (const c of codes) {
    await prisma.accessCode.upsert({
      where:  { code: c.code },
      update: {},
      create: { code: c.code, status: 'UNUSED' },
    })
    codesCreated++
  }
  console.log(`✓ ${codesCreated} access codes`)

  // ── Collections ───────────────────────────────────────────────────────────────

  const lnyqCollection = await prisma.collection.upsert({
    where:  { symbol: 'LNYQNFT' },
    update: {},
    create: {
      name: 'LNYQ NFT', symbol: 'LNYQNFT',
      supply: 1_000_000, chain: 'solana', whitelistStatus: 'APPROVED',
    },
  })

  const goomanCollection = await prisma.collection.upsert({
    where:  { symbol: 'THEGOOMAN' },
    update: {},
    create: {
      name: 'The Gooman', symbol: 'THEGOOMAN',
      supply: 1_000_000, chain: 'solana', whitelistStatus: 'APPROVED',
    },
  })
  console.log('✓ 2 collections')

  // ── Markets ───────────────────────────────────────────────────────────────────

  await prisma.market.upsert({
    where:  { id: 'LNYQNFT-USDC-SPOT' },
    update: {},
    create: {
      id: 'LNYQNFT-USDC-SPOT',
      symbol: 'LNYQNFT-USDC-SPOT',
      baseAsset: 'LNYQNFT', quoteAsset: 'USDC',
      collectionId: lnyqCollection.id,
      type: 'spot', status: 'ACTIVE', isPhase1: true,
      displayName: 'LNYQ NFT / USDC',
      tickSize: 0.01, minOrderSize: 1,
      makerFeeBps: 5, takerFeeBps: 25,
      referencePrice: 42.50,
    },
  })

  await prisma.market.upsert({
    where:  { id: 'THEGOOMAN-USDC-SPOT' },
    update: {},
    create: {
      id: 'THEGOOMAN-USDC-SPOT',
      symbol: 'THEGOOMAN-USDC-SPOT',
      baseAsset: 'THEGOOMAN', quoteAsset: 'USDC',
      collectionId: goomanCollection.id,
      type: 'spot', status: 'ACTIVE', isPhase1: true,
      displayName: 'The Gooman / USDC',
      tickSize: 0.01, minOrderSize: 1,
      makerFeeBps: 5, takerFeeBps: 25,
      referencePrice: 18.75,
    },
  })

  // Perp markets (Phase 2)
  await prisma.market.upsert({
    where:  { id: 'LNYQNFT-USDC-PERP' },
    update: {},
    create: {
      id: 'LNYQNFT-USDC-PERP',
      symbol: 'LNYQNFT-USDC-PERP',
      baseAsset: 'LNYQNFT', quoteAsset: 'USDC',
      collectionId: lnyqCollection.id,
      type: 'perp', status: 'PAUSED', isPhase1: false,
      displayName: 'LNYQ NFT PERP / USDC',
      tickSize: 0.01, minOrderSize: 1,
      makerFeeBps: 5, takerFeeBps: 25,
      referencePrice: 42.50,
      maxLeverage: 5,
    },
  })

  await prisma.market.upsert({
    where:  { id: 'THEGOOMAN-USDC-PERP' },
    update: {},
    create: {
      id: 'THEGOOMAN-USDC-PERP',
      symbol: 'THEGOOMAN-USDC-PERP',
      baseAsset: 'THEGOOMAN', quoteAsset: 'USDC',
      collectionId: goomanCollection.id,
      type: 'perp', status: 'PAUSED', isPhase1: false,
      displayName: 'The Gooman PERP / USDC',
      tickSize: 0.01, minOrderSize: 1,
      makerFeeBps: 5, takerFeeBps: 25,
      referencePrice: 18.75,
      maxLeverage: 5,
    },
  })

  console.log('✓ 4 markets (2 spot + 2 perp)')

  // ── MM bot user ───────────────────────────────────────────────────────────────

  await prisma.user.upsert({
    where:  { id: 'mm-bot' },
    update: {},
    create: {
      id: 'mm-bot', username: 'mm-bot', email: 'mm@lnyq.internal',
      referralCode: 'MM-BOT', sessionToken: null, isMarketMaker: true,
    },
  })

  // Unlimited balances for all assets (spot + perp both need USDC)
  const mmAssets = ['USDC', 'LNYQNFT', 'THEGOOMAN']
  for (const asset of mmAssets) {
    await prisma.balance.upsert({
      where:  { userId_asset: { userId: 'mm-bot', asset } },
      update: { available: 9_999_999_999 },
      create: { userId: 'mm-bot', asset, available: 9_999_999_999, locked: 0, pending: 0 },
    })
  }
  console.log('✓ MM bot user + balances')

  // Funding rates are seeded by mm.ts when perp markets go ACTIVE (Phase 2).
  // Do not seed them here — perp markets are INACTIVE in Phase 1.

  // ── Feature flags ─────────────────────────────────────────────────────────────

  const flags: { key: string; enabled: boolean }[] = [
    { key: 'ENABLE_SPOT',         enabled: true  },
    { key: 'ENABLE_PERPS',        enabled: false },
    { key: 'ENABLE_CROSS_CHAIN',  enabled: false },
    { key: 'ENABLE_PRESALE',      enabled: false },
    { key: 'ENABLE_ADMIN',        enabled: false },
    { key: 'ENABLE_REFERRALS',    enabled: true  },
    { key: 'ENABLE_DRIP',         enabled: true  },
    { key: 'ENABLE_LEADERBOARD',  enabled: true  },
  ]

  for (const f of flags) {
    await prisma.featureFlag.upsert({
      where:  { key: f.key },
      update: { enabled: f.enabled },
      create: f,
    })
  }
  console.log(`✓ ${flags.length} feature flags`)

  console.log('\nSeed complete. Run: cd server && npm run dev')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
