/**
 * LNYQ API Server — Prisma-backed
 *
 *   REST API  → http://localhost:3001/api
 *   WebSocket → ws://localhost:3002
 *
 * Start: cd server && npm run dev
 *
 * NOT real settlement. NOT connected to Solana. NOT for production.
 */

import express from 'express'
import cors    from 'cors'
import { prisma }         from './db.js'
import { createWsServer } from './ws.js'
import { buildRouter }    from './routes.js'
import { startMM }        from './mm.js'

const REST_PORT = 3001
const WS_PORT   = 3002

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use('/api', buildRouter())

app.get('/', (_req, res) => {
  res.json({
    name: 'lnyq-api',
    mode: 'local-api',
    rest: `http://localhost:${REST_PORT}/api`,
    ws:   `ws://localhost:${WS_PORT}`,
  })
})

app.listen(REST_PORT, async () => {
  console.log(`[API] REST  → http://localhost:${REST_PORT}/api`)

  // Verify DB connection
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('[API] PostgreSQL connected')
  } catch (err) {
    console.error('[API] PostgreSQL connection failed:', err)
    console.error('[API] Set DATABASE_URL in server/.env and run: npm run db:migrate')
    process.exit(1)
  }

  createWsServer(WS_PORT)
  console.log(`[API] WS    → ws://localhost:${WS_PORT}`)

  await startMM()
  console.log('[API] LNYQ local API server ready. Not real settlement.')
})
