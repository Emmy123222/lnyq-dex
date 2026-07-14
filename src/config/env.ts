/**
 * Typed access to all VITE_ environment variables.
 *
 * Add new variables here — never read import.meta.env directly elsewhere.
 * Modes: local-api | devnet-api | staging | production
 * There is NO mock mode. All modes hit a real backend.
 */

function get(key: string, fallback = ''): string {
  return ((import.meta.env as Record<string, string | undefined>)[key]) ?? fallback
}

function getBool(key: string, fallback = false): boolean {
  const v = get(key, String(fallback))
  return v === 'true' || v === '1'
}

export type AppMode = 'local-api' | 'devnet-api' | 'staging' | 'production'
export type AppChain =
  | 'solana-devnet'
  | 'arbitrum-sepolia'
  | 'arbitrum-mainnet'

const rawMode = get('VITE_LNYQ_ENV', 'local-api') as AppMode

export const ENV = {
  MODE:  rawMode,
  CHAIN: get('VITE_LNYQ_CHAIN', 'solana-devnet') as AppChain,

  API_URL: get('VITE_LNYQ_API_URL', ''),
  WS_URL:  get('VITE_LNYQ_WS_URL',  ''),
  RPC_URL: get('VITE_LNYQ_RPC_URL', ''),

  SQUID_BASE_URL:           get('VITE_SQUID_BASE_URL', 'https://apiplus.squidrouter.com'),
  SQUID_INTEGRATOR_ID:      get('VITE_SQUID_INTEGRATOR_ID', ''),
  SQUID_ENABLE_CORAL:       getBool('VITE_SQUID_ENABLE_CORAL',        false),
  SQUID_ENABLE_COLLECT_FEES:getBool('VITE_SQUID_ENABLE_COLLECT_FEES', false),
  SQUID_ENABLE_SOLANA_BTC:  getBool('VITE_SQUID_ENABLE_SOLANA_BTC',   false),
  SQUID_ENABLE_HOOKS:       getBool('VITE_SQUID_ENABLE_HOOKS',         false),

  // Product feature flags
  ENABLE_SPOT:        getBool('VITE_ENABLE_SPOT',        true),
  ENABLE_PERPS:       getBool('VITE_ENABLE_PERPS',       false),
  ENABLE_CROSS_CHAIN: getBool('VITE_ENABLE_CROSS_CHAIN', false),
  ENABLE_PRESALE:     getBool('VITE_ENABLE_PRESALE',     false),
  ENABLE_ADMIN:       getBool('VITE_ENABLE_ADMIN',        false),

  // Mode helpers
  IS_LOCAL_API:  rawMode === 'local-api',
  IS_DEVNET_API: rawMode === 'devnet-api',
  IS_STAGING:    rawMode === 'staging',
  IS_PRODUCTION: rawMode === 'production',
} as const
