import { useState, useEffect } from 'react'
import { useToast } from '../ui/Toast'
import type { OrderSide, OrderType, Pair } from '../../types'

const LEVERAGE_OPTS = [1, 2, 3, 5, 10, 20]

interface OrderEntryProps {
  isPerp?: boolean
  prefillPrice?: number
  pair: Pair
}

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function SegControl({ options, value, onChange, tone }: { options: string[]; value: string; onChange: (v: string) => void; tone?: 'buy' | 'sell' | 'neutral' }) {
  return (
    <div style={{ display: 'flex', height: 36, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 3, gap: 3 }}>
      {options.map(opt => {
        const active = opt === value
        let activeBg = 'var(--surface-raised)'
        let activeColor = 'var(--text-primary)'
        if (active && tone === 'buy')  { activeBg = 'var(--buy)';  activeColor = '#fff' }
        if (active && tone === 'sell') { activeBg = 'var(--sell)'; activeColor = '#fff' }
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex: 1, borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: active ? activeBg : 'transparent',
              color: active ? activeColor : 'var(--text-tertiary)',
              border: 'none', transition: 'all 120ms',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{children}</span>
}

function FieldInput({ value, onChange, suffix, focused }: { value: string; onChange: (v: string) => void; suffix: string; focused?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 40, padding: '0 12px',
      background: 'var(--surface-3)',
      border: `1px solid ${focused ? 'var(--border-accent)' : 'var(--border)'}`,
      borderRadius: 6,
      boxShadow: focused ? '0 0 0 3px var(--accent-tint)' : 'none',
    }}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
        placeholder="0"
      />
      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>{suffix}</span>
    </div>
  )
}

export default function OrderEntry({ isPerp = false, prefillPrice, pair }: OrderEntryProps) {
  const { toast } = useToast()
  const [side, setSide]         = useState<OrderSide>('buy')
  const [type, setType]         = useState<OrderType>('limit')
  const [price, setPrice]       = useState(prefillPrice?.toFixed(2) ?? '')
  const [quantity, setQuantity] = useState('')
  const [leverage, setLeverage] = useState(1)
  const [slippage, setSlippage] = useState('1%')
  const [loading, setLoading]   = useState(false)
  const [qtyFocused] = useState(false)

  useEffect(() => {
    if (prefillPrice !== undefined) setPrice(prefillPrice.toFixed(2))
  }, [prefillPrice])

  const priceNum  = parseFloat(price)  || 0
  const qtyNum    = parseInt(quantity) || 0
  const total     = priceNum * qtyNum
  const estFee    = total * 0.0015
  const available = side === 'buy' ? 50000 : 5

  const sideLabel   = side === 'buy' ? 'Buy' : 'Sell'
  const receiveLabel = side === 'buy'
    ? `${qtyNum || 0} ${pair.base}`
    : `${fmt(total - estFee)} USDC`

  const submit = () => {
    if (qtyNum <= 0) { toast('error', 'Quantity required', 'Enter a whole number of NFTs'); return }
    if (!/^\d+$/.test(quantity)) { toast('error', 'Whole number only', 'NFT quantity must be a whole number'); return }
    if (type === 'limit' && priceNum <= 0) { toast('error', 'Price required', 'Enter a limit price'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast('success', 'Order placed', `${type === 'limit' ? 'Limit' : 'Market'} ${sideLabel.toLowerCase()} ${qtyNum} ${pair.base}`)
      setQuantity('')
    }, 800)
  }

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Order type */}
      <SegControl options={['Limit', 'Market']} value={type === 'limit' ? 'Limit' : 'Market'} onChange={v => setType(v === 'Limit' ? 'limit' : 'market')} />

      {/* Buy / Sell */}
      <SegControl options={['Buy', 'Sell']} value={sideLabel} onChange={v => setSide(v === 'Buy' ? 'buy' : 'sell')} tone={side === 'buy' ? 'buy' : 'sell'} />

      {/* Available to trade */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--text-tertiary)' }}>Available to Trade</span>
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
          {side === 'buy' ? `${fmt(available)} USDC` : `${available} NFTs`}
        </span>
      </div>

      {/* Price field (limit only) */}
      {type === 'limit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Price (USDC)</FieldLabel>
          <FieldInput value={price} onChange={setPrice} suffix="USDC" />
        </div>
      )}

      {/* Quantity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FieldLabel>Quantity</FieldLabel>
        <FieldInput
          value={quantity}
          onChange={v => setQuantity(v.replace(/\D/g, ''))}
          suffix="NFTs"
          focused={qtyFocused}
        />
      </div>

      {/* Leverage (perp only) */}
      {isPerp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Leverage</FieldLabel>
          <div style={{ display: 'flex', gap: 4 }}>
            {LEVERAGE_OPTS.map(l => (
              <button
                key={l}
                onClick={() => setLeverage(l)}
                style={{
                  flex: 1, height: 32, borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: leverage === l ? 'var(--accent-tint)' : 'var(--surface-3)',
                  border: `1px solid ${leverage === l ? 'var(--border-accent)' : 'var(--border)'}`,
                  color: leverage === l ? 'var(--text-accent)' : 'var(--text-tertiary)',
                }}
              >
                {l}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary: total + fee */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Total</span>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(total)} USDC
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Est. fee · 0.15%</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(estFee)} USDC
          </span>
        </div>
      </div>

      {/* Slippage (spot only) */}
      {!isPerp && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0 }}>Slippage</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['0.5%', '1%', '2%'].map(s => {
              const active = slippage === s
              return (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                    background: active ? 'var(--accent-tint)' : 'transparent',
                    border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border)'}`,
                    color: active ? '#fff' : 'var(--text-tertiary)',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={submit}
        disabled={loading}
        style={{
          height: 46, borderRadius: 6, fontSize: 14, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
          background: side === 'buy' ? 'var(--buy)' : 'var(--sell)',
          color: '#fff', border: 'none', opacity: loading ? 0.7 : 1,
          transition: 'opacity 120ms',
        }}
      >
        {loading ? 'Placing...' : `${sideLabel} ${qtyNum > 0 ? `${qtyNum} ` : ''}NFTs${isPerp && leverage > 1 ? ` ${leverage}x` : ''}`}
      </button>

      {/* You receive */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>You receive</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {receiveLabel}
        </span>
      </div>

      {/* Perp account summary */}
      {isPerp && (
        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>ACCOUNT</span>
          {[
            { label: 'Account Equity',      value: '58,420.00',  color: 'var(--text-primary)' },
            { label: 'Cross Margin Ratio',  value: '6.4%',       color: 'var(--up-500)' },
            { label: 'Maintenance Margin',  value: '1,225.00',   color: 'var(--text-secondary)' },
            { label: 'Unrealized PnL',      value: '+472.00',    color: 'var(--up-500)' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{row.label}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
