/**
 * OrderEntry — spot and perp order form.
 *
 * Phase 2: leverage controls (1x–5x), liquidation price preview,
 * perp-specific fees (PERP_TAKER/MAKER_FEE_BPS).
 * Phase 3: cross-chain available from parent deposit modal.
 *
 * Fees come from config/fees.ts — never hardcoded here.
 * Liquidation price is DISPLAY ONLY — not used for settlement.
 */

import { useState, useEffect } from 'react'
import { useToast } from '../ui/Toast'
import { FLAGS } from '../../config/featureFlags'
import {
  TAKER_FEE_BPS, MAKER_FEE_BPS,
  PERP_TAKER_FEE_BPS, PERP_MAKER_FEE_BPS,
  PERP_MAX_LEVERAGE,
  BPS_DIVISOR, bpsToPercent, calcLiquidationPrice,
} from '../../config/fees'
import { orderService } from '../../services/orderService'
import type { OrderSide, OrderType, TimeInForce, Pair } from '../../types'

const TIF_OPTIONS: TimeInForce[] = ['GTC', 'IOC', 'FOK', 'GTD']
const LEVERAGE_MARKS = [1, 2, 3, 4, 5]

interface OrderEntryProps {
  isPerp?: boolean
  prefillPrice?: number
  pair: Pair
  availableUsdc?: number
  availableBase?: number
  sessionToken?: string
  userId?: string
}

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function SegControl({
  options, value, onChange, tone,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  tone?: 'buy' | 'sell' | 'neutral'
}) {
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
            style={{ flex: 1, borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: active ? activeBg : 'transparent', color: active ? activeColor : 'var(--text-tertiary)', border: 'none', transition: 'all 120ms' }}
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

function FieldInput({
  value, onChange, suffix,
}: {
  value: string
  onChange: (v: string) => void
  suffix: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 12px', background: 'var(--surface-3)', border: `1px solid ${focused ? 'var(--border-accent)' : 'var(--border)'}`, borderRadius: 6, boxShadow: focused ? '0 0 0 3px var(--accent-tint)' : 'none' }}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
        placeholder="0"
      />
      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>{suffix}</span>
    </div>
  )
}

function LeverageSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FieldLabel>Leverage</FieldLabel>
        <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{value}x</span>
      </div>
      <input
        type="range"
        min={1}
        max={PERP_MAX_LEVERAGE}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: 4 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {LEVERAGE_MARKS.map(m => (
          <button
            key={m}
            onClick={() => onChange(m)}
            style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, cursor: 'pointer', background: value === m ? 'var(--accent-tint)' : 'transparent', border: `1px solid ${value === m ? 'var(--border-accent)' : 'var(--border)'}`, color: value === m ? 'var(--accent)' : 'var(--text-tertiary)' }}
          >
            {m}x
          </button>
        ))}
      </div>
    </div>
  )
}

export default function OrderEntry({
  isPerp = false,
  prefillPrice,
  pair,
  availableUsdc = 0,
  availableBase = 0,
  sessionToken = '',
  userId: _userId = '',
}: OrderEntryProps) {
  const { toast } = useToast()
  const [side,     setSide]     = useState<OrderSide>('buy')
  const [type,     setType]     = useState<OrderType>('limit')
  const [price,    setPrice]    = useState(prefillPrice?.toFixed(2) ?? '')
  const [quantity, setQuantity] = useState('')
  const [tif,      setTif]      = useState<TimeInForce>('GTC')
  const [slippage, setSlippage] = useState('1%')
  const [leverage, setLeverage] = useState(1)
  const [loading,  setLoading]  = useState(false)

  // Whether perp controls are fully unlocked
  const perpEnabled = isPerp && FLAGS.PERPS

  useEffect(() => {
    if (prefillPrice !== undefined) setPrice(prefillPrice.toFixed(2))
  }, [prefillPrice])

  // Reset leverage to 1 when switching to spot
  useEffect(() => {
    if (!isPerp) setLeverage(1)
  }, [isPerp])

  const priceNum = parseFloat(price)  || 0
  const qtyNum   = parseInt(quantity) || 0
  const notional = priceNum * qtyNum

  // Perp: margin deposited = notional / leverage. Spot: full notional.
  const marginRequired = perpEnabled ? notional / leverage : notional

  // Fee schedule: perp has higher fees (1%/0.5%) vs spot (0.25%/0.05%)
  const takerBps = perpEnabled ? PERP_TAKER_FEE_BPS : TAKER_FEE_BPS
  const makerBps = perpEnabled ? PERP_MAKER_FEE_BPS : MAKER_FEE_BPS
  const feeBps   = type === 'market' ? takerBps : makerBps
  const estFee   = (notional * feeBps) / BPS_DIVISOR
  const feeLabel = bpsToPercent(feeBps)
  const feeType  = type === 'market' ? 'taker' : 'maker'

  // Liquidation price (display only, not for settlement)
  const liqPrice = perpEnabled && priceNum > 0
    ? calcLiquidationPrice(side, priceNum, leverage)
    : 0

  const sideLabel    = side === 'buy' ? 'Buy' : 'Sell'
  const receiveLabel = side === 'buy'
    ? `${qtyNum || 0} ${pair.base}`
    : `${fmt(notional - estFee)} USDC`

  // Balance check differs for perp (check margin, not notional)
  const hasSufficientBalance = side === 'buy'
    ? availableUsdc >= marginRequired
    : availableBase >= qtyNum

  const canSubmit = qtyNum > 0 && (type === 'market' || priceNum > 0) && hasSufficientBalance && !loading

  const submit = async () => {
    if (qtyNum <= 0) { toast('error', 'Quantity required', 'Enter a whole number of NFTs'); return }
    if (!/^\d+$/.test(quantity)) { toast('error', 'Whole number only', 'NFT quantity must be a whole number'); return }
    if (type === 'limit' && priceNum <= 0) { toast('error', 'Price required', 'Enter a limit price'); return }
    if (!hasSufficientBalance) {
      const need = side === 'buy'
        ? `Need ${fmt(marginRequired)} USDC${perpEnabled ? ' margin' : ''}`
        : `Not enough ${pair.base}`
      toast('error', 'Insufficient balance', need)
      return
    }

    setLoading(true)
    const res = await orderService.placeOrder(
      {
        marketId:    `${pair.base}-${pair.quote}-${pair.type.toUpperCase()}`,
        side,
        type,
        price:       type === 'limit' ? price : undefined,
        quantity,
        timeInForce: tif,
        slippageBps: type === 'market' ? parseInt(slippage) * 100 : undefined,
      },
      sessionToken,
    )
    setLoading(false)
    if (res.ok) {
      const perpSuffix = perpEnabled ? ` ${leverage}x` : ''
      toast('success', 'Order placed', `${type === 'limit' ? 'Limit' : 'Market'} ${sideLabel.toLowerCase()} ${qtyNum} ${pair.base}${perpSuffix}`)
      setQuantity('')
      setPrice(prefillPrice?.toFixed(2) ?? '')
    } else {
      toast('error', 'Order failed', res.error.message)
    }
  }

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Perp notice when Phase 2 not yet enabled */}
      {isPerp && !perpEnabled && (
        <div style={{ padding: '9px 12px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 6, fontSize: 12, color: '#F0A500', lineHeight: 1.4 }}>
          <strong>Perpetual markets are coming in Phase 2.</strong> Spot orders only for now.
        </div>
      )}

      {/* Order type */}
      <SegControl options={['Limit', 'Market']} value={type === 'limit' ? 'Limit' : 'Market'} onChange={v => setType(v === 'Limit' ? 'limit' : 'market')} />

      {/* Buy / Sell */}
      <SegControl options={['Buy', 'Sell']} value={sideLabel} onChange={v => setSide(v === 'Buy' ? 'buy' : 'sell')} tone={side} />

      {/* Available */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--text-tertiary)' }}>{perpEnabled ? 'Available Margin' : 'Available to Trade'}</span>
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
          {side === 'buy' ? `${fmt(availableUsdc)} USDC` : `${availableBase} ${pair.base}`}
        </span>
      </div>

      {/* Leverage slider — perp only */}
      {perpEnabled && (
        <LeverageSlider value={leverage} onChange={setLeverage} />
      )}

      {/* Price (limit only) */}
      {type === 'limit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Price (USDC)</FieldLabel>
          <FieldInput value={price} onChange={setPrice} suffix="USDC" />
        </div>
      )}

      {/* Quantity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FieldLabel>Quantity (NFTs)</FieldLabel>
        <FieldInput value={quantity} onChange={v => setQuantity(v.replace(/\D/g, ''))} suffix={pair.base} />
      </div>

      {/* TIF (limit only) */}
      {type === 'limit' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0 }}>TIF</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {TIF_OPTIONS.map(t => {
              const active = tif === t
              return (
                <button
                  key={t}
                  onClick={() => setTif(t)}
                  style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', background: active ? 'var(--accent-tint)' : 'transparent', border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border)'}`, color: active ? '#fff' : 'var(--text-tertiary)' }}
                  title={t === 'GTC' ? 'Good Till Cancelled' : t === 'IOC' ? 'Immediate Or Cancel' : t === 'FOK' ? 'Fill Or Kill' : 'Good Till Date'}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Notional</span>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(notional)} USDC
          </span>
        </div>
        {perpEnabled && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Margin required</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: marginRequired > availableUsdc ? 'var(--down-500)' : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(marginRequired)} USDC
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Est. fee · {feeLabel} ({feeType})</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(estFee)} USDC
          </span>
        </div>
        {perpEnabled && liqPrice > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Est. liq. price</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--down-400)', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(liqPrice)} USDC
            </span>
          </div>
        )}
        {!hasSufficientBalance && qtyNum > 0 && (
          <div style={{ fontSize: 11, color: 'var(--down-500)', fontWeight: 700 }}>
            Insufficient {side === 'buy' ? 'USDC' : pair.base} balance
          </div>
        )}
      </div>

      {/* Slippage (market orders only) */}
      {type === 'market' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0 }}>Slippage</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['0.5%', '1%', '2%'].map(s => {
              const active = slippage === s
              return (
                <button key={s} onClick={() => setSlippage(s)} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', background: active ? 'var(--accent-tint)' : 'transparent', border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border)'}`, color: active ? '#fff' : 'var(--text-tertiary)' }}>
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={!canSubmit}
        style={{ height: 46, borderRadius: 6, fontSize: 14, fontWeight: 900, cursor: canSubmit ? 'pointer' : 'not-allowed', background: side === 'buy' ? 'var(--buy)' : 'var(--sell)', color: '#fff', border: 'none', opacity: canSubmit ? 1 : 0.55, transition: 'opacity 120ms' }}
      >
        {loading
          ? 'Placing...'
          : `${sideLabel}${perpEnabled && leverage > 1 ? ` ${leverage}x` : ''} ${qtyNum > 0 ? `${qtyNum} ` : ''}${pair.base}`}
      </button>

      {/* You receive */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>You receive</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {receiveLabel}
        </span>
      </div>

      {/* Perp disclaimer */}
      {perpEnabled && (
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.5, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
          Liquidation price is an estimate for display only. Actual liquidation is determined onchain. Max leverage is {PERP_MAX_LEVERAGE}x. Liquidation fee: 3% of notional.
        </div>
      )}
    </div>
  )
}
