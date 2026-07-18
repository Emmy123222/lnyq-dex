/**
 * OrderEntry — spot order form (Phase 1).
 *
 * Phase 2: leverage controls (1x–5x), liquidation price preview,
 * perp-specific fees (PERP_TAKER/MAKER_FEE_BPS).
 * Phase 3: cross-chain available from parent deposit modal.
 *
 * Fees come from config/fees.ts — never hardcoded here.
 * All order-critical values (price, quantity, expiresAt) are submitted
 * as strings or ISO strings — no parseFloat/parseInt on submission paths.
 */

import { useState, useEffect } from 'react'
import { useToast } from '../ui/Toast'
import { FLAGS } from '../../config/featureFlags'
import { ENV } from '../../config/env'
import { authService } from '../../services/authService'
import { mulDecStr, cmpDecStr } from '../../utils/decimal'
import {
  TAKER_FEE_BPS, MAKER_FEE_BPS,
  PERP_TAKER_FEE_BPS, PERP_MAKER_FEE_BPS,
  PERP_MAX_LEVERAGE,
  BPS_DIVISOR, bpsToPercent, calcLiquidationPrice,
} from '../../config/fees'
import { orderService } from '../../services/orderService'
import { orderBookService } from '../../services/orderBookService'
import type { OrderSide, OrderType, TimeInForce, Pair, OrderBook } from '../../types'

const TIF_OPTIONS: TimeInForce[] = ['GTC', 'IOC', 'FOK', 'GTD']

interface DepthPreview {
  avgPrice: number
  priceImpact: number
  levelsConsumed: number
  insufficient: boolean
}

function simulateFill(book: OrderBook | null, side: OrderSide, qty: number): DepthPreview | null {
  if (!book || qty <= 0) return null
  const levels = side === 'buy' ? book.asks : book.bids
  if (levels.length === 0) return null
  const midpoint = parseFloat(book.midpoint)
  let remaining = qty
  let filledCost = 0
  let levelsConsumed = 0
  for (const level of levels) {
    if (remaining <= 0) break
    const lp = parseFloat(level.price)
    const ls = parseInt(level.size, 10)
    const filled = Math.min(remaining, ls)
    filledCost += filled * lp
    remaining -= filled
    levelsConsumed++
  }
  const insufficient = remaining > 0
  const filledQty = qty - remaining
  const avgPrice = filledQty > 0 ? filledCost / filledQty : 0
  const priceImpact = midpoint > 0 ? Math.abs((avgPrice - midpoint) / midpoint) * 100 : 0
  return { avgPrice, priceImpact, levelsConsumed, insufficient }
}
const LEVERAGE_MARKS = [1, 2, 3, 4, 5]

interface OrderEntryProps {
  marketId: string
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
  marketId,
  isPerp = false,
  prefillPrice,
  pair,
  availableUsdc = 0,
  availableBase = 0,
  sessionToken = '',
  userId: _userId = '',
}: OrderEntryProps) {
  const { toast } = useToast()
  const [side,       setSide]       = useState<OrderSide>('buy')
  const [type,       setType]       = useState<OrderType>('limit')
  const [price,      setPrice]      = useState(prefillPrice?.toFixed(2) ?? '')
  const [quantity,   setQuantity]   = useState('')
  const [tif,        setTif]        = useState<TimeInForce>('GTC')
  const [gtdExpiry,  setGtdExpiry]  = useState('')
  const [slippage,   setSlippage]   = useState('1%')
  const [leverage,   setLeverage]   = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [book,       setBook]       = useState<OrderBook | null>(null)

  const perpEnabled = isPerp && FLAGS.PERPS
  const session = authService.loadSession()
  const hasWallet = ENV.IS_LOCAL_API || !!session?.walletAddress

  useEffect(() => {
    if (prefillPrice !== undefined) setPrice(prefillPrice.toFixed(2))
  }, [prefillPrice])

  useEffect(() => {
    if (!isPerp) setLeverage(1)
  }, [isPerp])

  useEffect(() => {
    if (!marketId) return
    return orderBookService.subscribe(marketId, setBook)
  }, [marketId])

  // priceNum / qtyNum / notional — display and preview only; not sent to backend.
  // Phase 1: quantities are whole integers; prices are decimal strings (e.g. "74.50").
  // The submission path sends string `price` and `quantity` directly — no Number conversion.
  const priceNum    = Number(price)    || 0
  const qtyNum      = Number(quantity) || 0
  const notional    = priceNum * qtyNum

  const marginRequired = perpEnabled ? notional / leverage : notional

  const takerBps = perpEnabled ? PERP_TAKER_FEE_BPS : TAKER_FEE_BPS
  const makerBps = perpEnabled ? PERP_MAKER_FEE_BPS : MAKER_FEE_BPS
  const feeBps   = type === 'market' ? takerBps : makerBps
  const estFee   = (notional * feeBps) / BPS_DIVISOR
  const feeLabel = bpsToPercent(feeBps)
  const feeType  = type === 'market' ? 'taker' : 'maker'

  const liqPrice = perpEnabled && priceNum > 0
    ? calcLiquidationPrice(side, priceNum, leverage)
    : 0

  const depthPreview = type === 'market' && qtyNum > 0 ? simulateFill(book, side, qtyNum) : null

  const sideLabel    = side === 'buy' ? 'Buy' : 'Sell'
  const receiveLabel = side === 'buy'
    ? `${qtyNum || 0} ${pair.base}`
    : `${fmt(notional - estFee)} USDC`

  // Balance check uses fixed-point comparison to avoid IEEE-754 drift.
  // availableUsdc/availableBase are number props; convert to string for cmpDecStr.
  // For perps, margin = notional / leverage (division not in decimal.ts yet → fallback Number).
  const notionalStr   = price && quantity ? mulDecStr(price, quantity) : '0'
  const hasSufficientBalance = side === 'buy'
    ? (perpEnabled
        ? availableUsdc >= marginRequired           // perp leverage division: Number is acceptable for now
        : cmpDecStr(String(availableUsdc), notionalStr) >= 0)
    : cmpDecStr(String(availableBase), quantity || '0') >= 0

  const gtdValid = tif !== 'GTD' || (gtdExpiry !== '' && new Date(gtdExpiry) > new Date())

  const canSubmit = qtyNum > 0
    && (type === 'market' || priceNum > 0)
    && hasSufficientBalance
    && gtdValid
    && !loading
    && !!marketId
    && hasWallet

  const submit = async () => {
    if (!ENV.IS_LOCAL_API && !session?.walletAddress) {
      toast('error', 'Wallet required', 'Link a Solana wallet in Settings to trade on testnet')
      return
    }
    if (!marketId) { toast('error', 'No market', 'No active market selected'); return }
    if (qtyNum <= 0) { toast('error', 'Quantity required', 'Enter a quantity'); return }
    if (!/^\d+$/.test(quantity)) { toast('error', 'Whole number only', 'Quantity must be a whole number'); return }
    if (type === 'limit' && priceNum <= 0) { toast('error', 'Price required', 'Enter a limit price'); return }
    if (tif === 'GTD' && !gtdExpiry) { toast('error', 'Expiry required', 'Set a GTD expiration date and time'); return }
    if (tif === 'GTD' && new Date(gtdExpiry) <= new Date()) { toast('error', 'Expiry in past', 'GTD expiration must be in the future'); return }
    if (!hasSufficientBalance) {
      const need = side === 'buy'
        ? `Need ${fmt(marginRequired)} USDC${perpEnabled ? ' margin' : ''}`
        : `Not enough ${pair.base}`
      toast('error', 'Insufficient balance', need)
      return
    }

    // Slippage: strip the % suffix and convert to basis points
    const slippageBps = Math.round(parseFloat(slippage) * 100)

    setLoading(true)
    const res = await orderService.placeOrder(
      {
        marketId,
        side,
        type,
        price:       type === 'limit' ? price : undefined,
        quantity,
        timeInForce: tif,
        expiresAt:   tif === 'GTD' ? new Date(gtdExpiry).toISOString() : undefined,
        slippageBps: type === 'market' ? slippageBps : undefined,
        leverage:    perpEnabled ? leverage : undefined,
      },
      sessionToken,
    )
    setLoading(false)
    if (res.ok) {
      const perpSuffix = perpEnabled ? ` ${leverage}x` : ''
      toast('success', 'Order placed', `${type === 'limit' ? 'Limit' : 'Market'} ${sideLabel.toLowerCase()} ${qtyNum} ${pair.base}${perpSuffix}`)
      setQuantity('')
      setGtdExpiry('')
      setPrice(prefillPrice?.toFixed(2) ?? '')
    } else {
      toast('error', 'Order failed', res.error.message)
    }
  }

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Wallet required notice */}
      {!hasWallet && (
        <div style={{ padding: '9px 12px', background: 'rgba(255,70,102,0.08)', border: '1px solid rgba(255,70,102,0.3)', borderRadius: 6, fontSize: 12, color: 'var(--sell, #ff4666)', lineHeight: 1.4 }}>
          <strong>Wallet required.</strong> Link a Solana wallet in Settings to trade on testnet.
        </div>
      )}

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
        <FieldLabel>Quantity ({pair.base})</FieldLabel>
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

      {/* GTD expiration datetime */}
      {type === 'limit' && tif === 'GTD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Expires at</FieldLabel>
          <input
            type="datetime-local"
            value={gtdExpiry}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            onChange={e => setGtdExpiry(e.target.value)}
            style={{
              height: 40, padding: '0 12px', background: 'var(--surface-3)',
              border: `1px solid ${gtdExpiry && new Date(gtdExpiry) <= new Date() ? 'var(--down-500)' : 'var(--border)'}`,
              borderRadius: 6, fontSize: 13, color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)', width: '100%', boxSizing: 'border-box',
              colorScheme: 'dark',
            }}
          />
          {gtdExpiry && new Date(gtdExpiry) <= new Date() && (
            <span style={{ fontSize: 11, color: 'var(--down-500)' }}>Expiration must be in the future</span>
          )}
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

      {/* Market order slippage + depth preview */}
      {type === 'market' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

          {/* Depth preview — only when quantity entered and book available */}
          {depthPreview ? (
            <div style={{ padding: '9px 12px', background: 'var(--surface-2)', border: `1px solid ${depthPreview.insufficient || depthPreview.priceImpact >= 1 ? 'rgba(246,70,93,0.35)' : 'var(--border-subtle)'}`, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {depthPreview.insufficient ? (
                <span style={{ fontSize: 11, color: 'var(--down-500)', fontWeight: 700 }}>Insufficient liquidity for this size</span>
              ) : (
                <>
                  {([
                    { label: 'Avg fill price', value: `${fmt(depthPreview.avgPrice)} USDC` },
                    { label: 'Price impact',   value: `${depthPreview.priceImpact.toFixed(3)}%`, warn: depthPreview.priceImpact >= 1 },
                    { label: 'Levels consumed', value: String(depthPreview.levelsConsumed) },
                    { label: `Est. fee (${feeLabel})`, value: `${fmt(depthPreview.avgPrice * qtyNum * feeBps / BPS_DIVISOR)} USDC` },
                  ] as { label: string; value: string; warn?: boolean }[]).map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{row.label}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: row.warn ? 'var(--down-500)' : 'var(--text-secondary)', fontWeight: row.warn ? 700 : 400 }}>{row.value}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              Market orders fill at best available price. Order reverts if price moves beyond slippage tolerance.
            </span>
          )}
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
          Liquidation price is an estimate for display only. Actual liquidation is determined by the protocol team. Max leverage is {PERP_MAX_LEVERAGE}x. Liquidation fee: 3% of notional.
        </div>
      )}
    </div>
  )
}
