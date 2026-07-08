/**
 * WebSocket server and broadcast utility.
 *
 * Protocol (JSON over WS):
 *   Client → { type: 'subscribe', channel: 'orderbook'|'trades'|'candles'|'orders'|'portfolio', marketId?, userId?, interval? }
 *   Server → WsMsg (see types.ts)
 *
 * Clients subscribe to specific channels to avoid unnecessary traffic.
 */

import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import type { WsMsg } from './types.js'

interface Client {
  ws: WebSocket
  channels: Set<string>
}

const clients = new Set<Client>()
let wss: WebSocketServer | null = null

export function createWsServer(port: number) {
  wss = new WebSocketServer({ port })

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    const client: Client = { ws, channels: new Set() }
    clients.add(client)

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === 'subscribe') {
          const channel = buildChannelKey(msg)
          if (channel) client.channels.add(channel)
        } else if (msg.type === 'unsubscribe') {
          const channel = buildChannelKey(msg)
          if (channel) client.channels.delete(channel)
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }))
        }
      } catch { /* ignore malformed messages */ }
    })

    ws.on('close', () => clients.delete(client))
    ws.on('error', () => clients.delete(client))

    // Send welcome
    ws.send(JSON.stringify({ type: 'connected', ts: Date.now() }))
  })

  console.log(`[WS] WebSocket server on ws://localhost:${port}`)
  return wss
}

function buildChannelKey(msg: Record<string, string>): string | null {
  const { channel, marketId, userId, interval } = msg
  if (!channel) return null
  if (channel === 'orderbook' && marketId) return `orderbook:${marketId}`
  if (channel === 'trades'    && marketId) return `trades:${marketId}`
  if (channel === 'candles'   && marketId && interval) return `candles:${marketId}:${interval}`
  if (channel === 'orders'    && userId)   return `orders:${userId}`
  if (channel === 'portfolio' && userId)   return `portfolio:${userId}`
  return null
}

function msgToChannel(msg: WsMsg): string {
  switch (msg.type) {
    case 'orderbook':  return `orderbook:${msg.marketId}`
    case 'trade':      return `trades:${msg.marketId}`
    case 'candle':     return `candles:${msg.marketId}:${msg.interval}`
    case 'order':      return `orders:${msg.userId}`
    case 'portfolio':  return `portfolio:${msg.userId}`
  }
}

export function broadcast(msg: WsMsg) {
  const channel = msgToChannel(msg)
  const payload = JSON.stringify(msg)
  for (const client of clients) {
    if (client.channels.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload)
    }
  }
}

/** Send a snapshot to a single client (used on subscribe) */
export function sendTo(ws: WebSocket, msg: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}
