import { useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { orderService, statusLabel } from '../services/orderService'
import type { Order, OrderStatus } from '../types'

function getSession() {
  const s = authService.loadSession()
  return { userId: s?.userId ?? '', token: s?.sessionToken ?? '' }
}

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING:          'var(--text-tertiary)',
  OPEN:             'var(--accent)',
  PARTIALLY_FILLED: 'var(--warn)',
  FILLED:           'var(--up-500)',
  CANCELLED:        'var(--text-tertiary)',
  EXPIRED:          'var(--text-tertiary)',
  REJECTED:         'var(--down-500)',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const color = STATUS_COLOR[status] ?? 'var(--text-tertiary)'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `color-mix(in srgb, ${color} 14%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>
      {statusLabel(status)}
    </span>
  )
}

function OrderRow({ order, onCancel }: { order: Order; onCancel?: (id: string) => void }) {
  const isBuy   = order.side === 'buy'
  const market  = order.marketId.replace('-SPOT', '').replace('-PERP', '').replace(/-/g, ' / ')
  const canCancel = onCancel && (order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED' || order.status === 'PENDING')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 0.8fr 0.8fr 1fr 0.8fr 0.9fr 1fr 1fr', padding: '13px 16px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{order.createdAt.slice(0, 16).replace('T', ' ')}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{market}</span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{order.type}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: isBuy ? 'var(--up-500)' : 'var(--down-500)' }}>{isBuy ? 'Buy' : 'Sell'}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(order.price))}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.quantity}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.filledQuantity}/{order.quantity}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(parseFloat(order.total))}</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
        <StatusBadge status={order.status} />
        {canCancel && (
          <button onClick={() => onCancel!(order.id)} style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--down-400)', background: 'rgba(246,70,93,0.12)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
        )}
      </div>
    </div>
  )
}

const TABS = ['Open Orders', 'Order History'] as const
type Tab = typeof TABS[number]

export default function OrderHistory() {
  const [tab,          setTab]          = useState<Tab>('Order History')
  const [openOrders,   setOpenOrders]   = useState<Order[]>([])
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const { userId } = getSession()
    Promise.all([
      orderService.getOpenOrders(userId),
      orderService.getOrderHistory(userId),
    ]).then(([open, hist]) => {
      if (open.ok)  setOpenOrders(open.data)
      if (hist.ok)  setOrderHistory(hist.data)
      setLoading(false)
    })
  }, [])

  const handleCancel = async (orderId: string) => {
    const { token } = getSession()
    const order = openOrders.find(o => o.id === orderId)
    const res = await orderService.cancelOrder({ orderId, marketId: order?.marketId ?? '' }, token)
    if (res.ok) setOpenOrders(prev => prev.filter(o => o.id !== orderId))
  }

  const displayed = tab === 'Open Orders' ? openOrders : orderHistory

  return (
    <div style={{ padding: '26px 24px 32px', overflowY: 'auto', minHeight: 0 }}>
      <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 16 }}>Orders</span>

      <div style={{ marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', height: 42 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ height: '100%', padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', background: 'transparent', border: 'none' }}>
            {t}
            {t === 'Open Orders' && openOrders.length > 0 && (
              <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 900, background: 'var(--accent)', color: '#fff', padding: '1px 5px', borderRadius: 99 }}>{openOrders.length}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {['All Pairs', 'All Sides', 'All Status', 'All Types'].map(f => (
          <select key={f} style={{ height: 30, padding: '0 10px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
            <option>{f}</option>
          </select>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}>
          {loading ? 'Loading…' : `Showing ${displayed.length} order${displayed.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 0.8fr 0.8fr 1fr 0.8fr 0.9fr 1fr 1fr', padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          {['Time', 'Market', 'Type', 'Side', 'Price', 'Size', 'Filled', 'Value', 'Status'].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i >= 4 && i <= 7 ? 'right' : undefined }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading orders…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No orders found</div>
        ) : (
          displayed.map(o => (
            <OrderRow key={o.id} order={o} onCancel={tab === 'Open Orders' ? handleCancel : undefined} />
          ))
        )}
      </div>
    </div>
  )
}
