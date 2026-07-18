import { ENV } from './env'

/**
 * Feature gate helpers.
 *
 * Import these in components/pages to conditionally render Phase 2/3 content.
 * Never gate by checking ENV directly in components — go through these helpers
 * so gates are easy to find, audit, and update.
 */

export const FLAGS = {
  // ── Phase 1 (always on) ───────────────────────────────────────────────────
  SPOT_TRADING:       true,
  ORDER_BOOK:         true,
  RECENT_TRADES:      true,
  OPEN_ORDERS:        true,
  ORDER_HISTORY:      true,
  PORTFOLIO:          true,
  TRANSACTIONS:       true,
  ACCESS_CODE_GATE:   true,
  REFERRAL_DISPLAY:   true,
  USDC_DRIP:          true,
  TESTNET_STATUS:     true,
  LEADERBOARD:        true,

  // ── Phase 2 (gated) ───────────────────────────────────────────────────────
  /** Perpetual markets and leverage controls */
  PERPS:              ENV.ENABLE_PERPS,
  FUNDING_RATES:      ENV.ENABLE_PERPS,
  LIQUIDATIONS:       ENV.ENABLE_PERPS,
  LEVERAGE_CONTROLS:  ENV.ENABLE_PERPS,
  PERP_POSITIONS:     ENV.ENABLE_PERPS,

  // ── Phase 2 wallet ────────────────────────────────────────────────────────
  /** True when VITE_PRIVY_APP_ID is configured — enables wallet UI */
  WALLET_ENABLED:     !!ENV.PRIVY_APP_ID,
  /** True when on-chain deposits are wired (VITE_ENABLE_DEPOSITS=true) */
  DEPOSITS:           ENV.ENABLE_DEPOSITS,

  // ── Phase 3 (gated) ───────────────────────────────────────────────────────
  CROSS_CHAIN:        ENV.ENABLE_CROSS_CHAIN,
  PRESALE:            ENV.ENABLE_PRESALE,

  // ── Squid capabilities (gated, not assumed enabled) ───────────────────────
  SQUID_COLLECT_FEES: ENV.SQUID_ENABLE_COLLECT_FEES,
  /** Coral/Squid Intents — requires integrator enablement */
  SQUID_CORAL:        ENV.SQUID_ENABLE_CORAL,
  /** Solana/BTC deposit-address routing — closed beta */
  SQUID_SOLANA_BTC:   ENV.SQUID_ENABLE_SOLANA_BTC,
} as const

export type FeatureFlag = keyof typeof FLAGS

/** Returns true if the feature is enabled */
export function isEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag]
}

/** Returns a "Coming in Phase X" label for gated features */
export function gateLabel(flag: FeatureFlag): string {
  if (flag === 'PERPS' || flag === 'FUNDING_RATES' || flag === 'LEVERAGE_CONTROLS' || flag === 'LIQUIDATIONS' || flag === 'PERP_POSITIONS') {
    return 'Coming in Phase 2'
  }
  if (flag === 'CROSS_CHAIN' || flag === 'PRESALE' || flag === 'SQUID_SOLANA_BTC') {
    return 'Coming in Phase 3'
  }
  return 'Coming soon'
}
