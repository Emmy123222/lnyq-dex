import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://lnyq:lnyq@localhost:5432/lnyq_test',
      NODE_ENV: 'test',
    },
    include: ['src/__tests__/**/*.test.ts'],
    // Sequential — engine tests mutate DB state; parallelism would corrupt them
    pool: 'forks',
    singleFork: true,
  },
})
