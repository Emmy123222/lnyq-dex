/**
 * orderService — place, cancel, and query orders.
 *
 * All modes hit a real backend. No mock data.
 * local-api: /orders/open, /orders/history, DELETE /orders/:id
 * devnet-api+: /users/:id/orders/open, /users/:id/orders/history, POST /orders/:id/cancel
 */

import type { Order, PlaceOrderRequest, CancelOrderRequest, FeeEstimate, ServiceResult, OrderStatus } from '../types'
import { ENV } from '../config/env'
import { TAKER_FEE_BPS, MAKER_FEE_BPS, BPS_DIVISOR } from '../config/fees'
import { apiFetch, getSessionToken } from './types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(s: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDING: 'Pending', OPEN: 'Open', PARTIALLY_FILLED: 'Partial',
    FILLED: 'Filled', CANCELLED: 'Cancelled', EXPIRED: 'Expired', REJECTED: 'Rejected',
  }
  return map[s] ?? s
}

export { statusLabel }

interface SimOrder {
  id: string; marketId: string; side: string; type: string
  price: string; quantity: string; filledQuantity: string; remainingQuantity: string
  total: string; status: string; timeInForce: string
  createdAt: string; updatedAt: string
}

function fromSimOrder(o: SimOrder): Order {
  return {
    id: o.id, marketId: o.marketId,
    side: o.side as Order['side'],
    type: o.type as Order['type'],
    status: o.status as Order['status'],
    price: o.price, quantity: o.quantity,
    filledQuantity: o.filledQuantity,
    remainingQuantity: o.remainingQuantity,
    total: o.total,
    totalFees: '0.00',
    timeInForce: o.timeInForce as Order['timeInForce'],
    fills: [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const orderService = {
  async getOpenOrders(_userId: string): Promise<ServiceResult<Order[]>> {
    if (ENV.IS_LOCAL_API) {
      const token = getSessionToken()
      const res = await apiFetch<SimOrder[]>('/orders/open', { sessionToken: token })
      if (!res.ok) return res
      return { ok: true, data: res.data.map(fromSimOrder) }
    }
    return apiFetch<Order[]>(`/users/${_userId}/orders/open`)
  },

  async getOrderHistory(_userId: string): Promise<ServiceResult<Order[]>> {
    if (ENV.IS_LOCAL_API) {
      const token = getSessionToken()
      const res = await apiFetch<SimOrder[]>('/orders/history', { sessionToken: token })
      if (!res.ok) return res
      return { ok: true, data: res.data.map(fromSimOrder) }
    }
    return apiFetch<Order[]>(`/users/${_userId}/orders/history`)
  },

  async placeOrder(req: PlaceOrderRequest, sessionToken: string): Promise<ServiceResult<Order>> {
    if (ENV.IS_LOCAL_API) {
      const token = sessionToken || getSessionToken()
      const res = await apiFetch<{ order: SimOrder }>('/orders', {
        method: 'POST',
        body: {
          marketId:    req.marketId,
          side:        req.side,
          type:        req.type,
          price:       req.price ? parseFloat(req.price) : undefined,
          quantity:    parseInt(req.quantity),
          timeInForce: req.timeInForce,
          expiresAt:   req.expiresAt,
          slippageBps: req.slippageBps,
          leverage:    req.leverage,
        },
        sessionToken: token,
      })
      if (!res.ok) return { ok: false, error: res.error }
      return { ok: true, data: fromSimOrder(res.data.order) }
    }

    return apiFetch<Order>('/orders', { method: 'POST', body: req, sessionToken })
  },

  async cancelOrder(req: CancelOrderRequest, sessionToken: string): Promise<ServiceResult<Order>> {
    if (ENV.IS_LOCAL_API) {
      const token = sessionToken || getSessionToken()
      const res = await apiFetch<SimOrder>(`/orders/${req.orderId}`, {
        method: 'DELETE',
        sessionToken: token,
      })
      if (!res.ok) return { ok: false, error: res.error }
      return { ok: true, data: fromSimOrder(res.data) }
    }

    return apiFetch<Order>(`/orders/${req.orderId}/cancel`, { method: 'POST', body: req, sessionToken })
  },

  /** Pre-submission fee estimate. Display only — not used for settlement. */
  estimateFee(priceStr: string, quantityStr: string): FeeEstimate {
    const price = parseFloat(priceStr) || 0
    const qty   = parseInt(quantityStr) || 0
    const total = price * qty
    const takerFee = (total * TAKER_FEE_BPS) / BPS_DIVISOR
    const makerFee = (total * MAKER_FEE_BPS) / BPS_DIVISOR
    return {
      takerFee:     takerFee.toFixed(4),
      makerFee:     makerFee.toFixed(4),
      estimatedFee: takerFee.toFixed(4),
      feeBps:       TAKER_FEE_BPS,
      feePpm:       TAKER_FEE_BPS * 100,
    }
  },

  async getTransactions(_userId: string): Promise<ServiceResult<Order[]>> {
    return apiFetch<Order[]>('/users/me/transactions')
  },
}
