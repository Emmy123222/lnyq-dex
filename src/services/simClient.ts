/**
 * simClient — WebSocket client for local-api mode.
 *
 * Connects to ws://localhost:3002, handles reconnection,
 * and dispatches messages to channel subscribers.
 *
 * Channel keys match the server pattern:
 *   orderbook:<marketId>
 *   trades:<marketId>
 *   candles:<marketId>:<interval>
 *   orders:<userId>
 *   portfolio:<userId>
 */

import { ENV } from '../config/env'

type MsgCallback = (msg: Record<string, unknown>) => void

interface Subscriber {
  channelKey: string
  subscribeMsg: Record<string, string>
  callback: MsgCallback
}

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let pingTimer: ReturnType<typeof setInterval> | null = null
let attempt = 0
const subs = new Set<Subscriber>()

function deriveChannelKey(msg: Record<string, unknown>): string {
  switch (msg.type) {
    case 'orderbook': return `orderbook:${msg.marketId}`
    case 'trade':     return `trades:${msg.marketId}`
    case 'candle':    return `candles:${msg.marketId}:${msg.interval}`
    case 'order':     return `orders:${msg.userId}`
    case 'portfolio': return `portfolio:${msg.userId}`
    default: return String(msg.type ?? '')
  }
}

function sendRaw(msg: Record<string, string>) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function connect() {
  if (!ENV.WS_URL) return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  ws = new WebSocket(ENV.WS_URL)

  ws.onopen = () => {
    attempt = 0
    // Re-subscribe all active subscribers
    for (const sub of subs) {
      sendRaw({ type: 'subscribe', ...sub.subscribeMsg })
    }
    pingTimer = setInterval(() => sendRaw({ type: 'ping' }), 30_000)
    console.log('[simClient] connected to', ENV.WS_URL)
  }

  ws.onmessage = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(String(event.data)) as Record<string, unknown>
      if (msg.type === 'pong' || msg.type === 'connected') return
      const key = deriveChannelKey(msg)
      for (const sub of subs) {
        if (sub.channelKey === key) sub.callback(msg)
      }
    } catch { /* ignore malformed */ }
  }

  ws.onclose = () => {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
    scheduleReconnect()
  }

  ws.onerror = () => { ws?.close() }
}

function scheduleReconnect() {
  if (attempt >= 10 || subs.size === 0) return
  const delay = Math.min(1_000 * 2 ** attempt, 30_000)
  reconnectTimer = setTimeout(() => { attempt++; connect() }, delay)
}

export const simClient = {
  subscribe(
    channelKey: string,
    subscribeMsg: Record<string, string>,
    callback: MsgCallback,
  ): () => void {
    if (!ENV.IS_LOCAL_API) return () => {}

    const sub: Subscriber = { channelKey, subscribeMsg, callback }
    subs.add(sub)

    if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
      connect()
    } else if (ws.readyState === WebSocket.OPEN) {
      sendRaw({ type: 'subscribe', ...subscribeMsg })
    }

    return () => {
      subs.delete(sub)
      sendRaw({ type: 'unsubscribe', ...subscribeMsg })
      if (subs.size === 0 && reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }
  },

  subscribeOrderBook(marketId: string, cb: MsgCallback) {
    return simClient.subscribe(`orderbook:${marketId}`, { channel: 'orderbook', marketId }, cb)
  },

  subscribeCandles(marketId: string, interval: string, cb: MsgCallback) {
    return simClient.subscribe(`candles:${marketId}:${interval}`, { channel: 'candles', marketId, interval }, cb)
  },

  subscribeTrades(marketId: string, cb: MsgCallback) {
    return simClient.subscribe(`trades:${marketId}`, { channel: 'trades', marketId }, cb)
  },

  subscribeOrders(userId: string, cb: MsgCallback) {
    return simClient.subscribe(`orders:${userId}`, { channel: 'orders', userId }, cb)
  },

  subscribePortfolio(userId: string, cb: MsgCallback) {
    return simClient.subscribe(`portfolio:${userId}`, { channel: 'portfolio', userId }, cb)
  },
}
