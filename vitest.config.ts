import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    'import.meta.env': JSON.stringify({
      MODE:                    'test',
      VITE_API_URL:            '',
      VITE_WS_URL:             '',
      VITE_PRIVY_APP_ID:       '',
      VITE_APP_MODE:           'local-api',
      VITE_CHAIN:              'solana-devnet',
      VITE_ENABLE_DEPOSITS:    'false',
      VITE_ENABLE_CROSS_CHAIN: 'false',
      VITE_ENABLE_PERPS:       'false',
    }),
  },
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
})
