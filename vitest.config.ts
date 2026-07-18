import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    'import.meta.env': JSON.stringify({
      MODE:                    'test',
      VITE_LNYQ_API_URL:       '',
      VITE_LNYQ_WS_URL:        '',
      VITE_LNYQ_ENV:           'local-api',
      VITE_LNYQ_CHAIN:         'solana-devnet',
      VITE_LNYQ_RPC_URL:       '',
      VITE_PRIVY_APP_ID:       '',
      VITE_ENABLE_DEPOSITS:    'false',
      VITE_ENABLE_CROSS_CHAIN: 'false',
      VITE_ENABLE_PERPS:       'false',
      VITE_SQUID_BASE_URL:     'https://apiplus.squidrouter.com',
      VITE_SQUID_INTEGRATOR_ID:'',
      VITE_SQUID_ENABLE_CORAL: 'false',
      VITE_SQUID_ENABLE_COLLECT_FEES: 'false',
      VITE_SQUID_ENABLE_SOLANA_BTC:   'false',
      VITE_SQUID_ENABLE_HOOKS:        'false',
    }),
  },
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
})
