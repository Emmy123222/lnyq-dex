import { useState } from 'react'
import { OPEN_ORDERS, ORDER_HISTORY } from '../data/mock'
import type { Order } from '../types'

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const STATUS_COLOR: Record<string, string> = {
  partial:   'var(--warn)',
  open:      'var(--accent)',
  filled:    'var(--up-500)',
  cancelled: 'var(--text-tertiary)',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? 'var(--text-tertiary)'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `color-mix(in srgb, ${color} 14%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function OrderRow({ order, showCancel }: { order: Order; showCancel?: boolean }) {
  const isBuy = order.side === 'buy'
  const pairLabel = order.pair.type === 'spot' ? `${order.pair.base} / ${order.pair.quote}` : `${order.pair.base} - ${order.pair.quote}`
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.5fr 0.8fr 0.7fr 1fr 0.8fr 0.9fr 1fr 1fr', padding: '13px 16px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{order.createdAt}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{pairLabel}</span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.type.charAt(0).toUpperCase() + order.type.slice(1)}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: isBuy ? 'var(--up-500)' : 'var(--down-500)' }}>{isBuy ? 'Buy' : 'Sell'}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(order.price)}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.size}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.filled}/{order.size}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(order.total)}</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
        <StatusBadge status={order.status} />
        {showCancel && order.status === 'open' || showCancel && order.status === 'partial' ? (
          <button style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--down-400)', background: 'rgba(246,70,93,0.12)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
        ) : null}
      </div>
    </div>
  )
}

const TABS = ['Open Orders', 'Order History'] as const
type Tab = typeof TABS[number]

export default function OrderHistory() {
  const [tab, setTab] = useState<Tab>('Order History')

  const allOrders = tab === 'Open Orders' ? OPEN_ORDERS : ORDER_HISTORY

  return (
    <div style={{ padding: '26px 24px 32px', overflowY: 'auto', minHeight: 0 }}>
      <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 16 }}>Orders</span>

      {/* Tabs */}
      <div style={{ marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', height: 42 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              height: '100%', padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent', border: 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {['All Pairs', 'All Sides', 'All Status', 'All Types'].map(f => (
          <select
            key={f}
            style={{ height: 30, padding: '0 10px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
          >
            <option>{f}</option>
          </select>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}>
          Showing {allOrders.length} orders
        </span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.5fr 0.8fr 0.7fr 1fr 0.8fr 0.9fr 1fr 1fr', padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          {['Time', 'Market', 'Type', 'Side', 'Price', 'Size', 'Filled', 'Value', 'Status'].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i >= 4 && i <= 7 ? 'right' : undefined }}>{h}</span>
          ))}
        </div>

        {allOrders.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            No orders found
          </div>
        ) : (
          allOrders.map(o => <OrderRow key={o.id} order={o} showCancel={tab === 'Open Orders'} />)
        )}
      </div>
    </div>
  )
}
