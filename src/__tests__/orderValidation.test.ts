import { describe, it, expect } from 'vitest'
import { validatePriceStr, validateQtyStr } from '../utils/decimal'

// ── validateQtyStr — positive decimal validator ───────────────────────────────
//
// validateQtyStr accepts any positive decimal; it is NOT responsible for the
// Phase 1 integer-only rule. That rule is enforced separately in OrderEntry.submit()
// via `!/^\d+$/.test(quantity)` before the order reaches the backend engine.
// (The engine itself rejects non-integers: `!Number.isInteger(req.quantity)`.)

describe('validateQtyStr — positive decimal acceptance', () => {
  it('accepts integer quantity "1"', () => {
    expect(validateQtyStr('1').ok).toBe(true)
  })
  it('accepts integer quantity "100"', () => {
    expect(validateQtyStr('100').ok).toBe(true)
  })
  it('accepts decimal quantity "1.5" (validator is not integer-only)', () => {
    // Integer-only enforcement is in OrderEntry.submit() !/^\d+$/.test(qty)
    expect(validateQtyStr('1.5').ok).toBe(true)
  })
  it('accepts decimal quantity "0.1"', () => {
    expect(validateQtyStr('0.1').ok).toBe(true)
  })
  it('rejects "0" (not positive)', () => {
    expect(validateQtyStr('0').ok).toBe(false)
  })
  it('rejects negative "-1"', () => {
    expect(validateQtyStr('-1').ok).toBe(false)
  })
  it('rejects empty string', () => {
    expect(validateQtyStr('').ok).toBe(false)
  })
  it('rejects non-numeric "abc"', () => {
    expect(validateQtyStr('abc').ok).toBe(false)
  })
  it('respects minOrderSize: rejects below minimum', () => {
    expect(validateQtyStr('1', 5).ok).toBe(false)
  })
  it('respects minOrderSize: accepts at minimum', () => {
    expect(validateQtyStr('5', 5).ok).toBe(true)
  })
  it('respects minOrderSize: accepts above minimum', () => {
    expect(validateQtyStr('10', 5).ok).toBe(true)
  })
})

// ── Phase 1 integer-only gate (mirrors OrderEntry.submit() guard) ─────────────
//
// This is the actual gate used in submit() before an order is sent to the engine.
// `!/^\d+$/.test(qty)` blocks fractional input; the engine also rejects it at
// `!Number.isInteger(req.quantity)` as a second layer.

describe('Phase 1 integer-only gate', () => {
  function isWholeNumberQty(qty: string): boolean {
    return /^\d+$/.test(qty.trim())
  }

  it('passes "1"', ()   => expect(isWholeNumberQty('1')).toBe(true))
  it('passes "100"', () => expect(isWholeNumberQty('100')).toBe(true))
  it('passes "999999"', () => expect(isWholeNumberQty('999999')).toBe(true))
  it('blocks "1.5"', () => expect(isWholeNumberQty('1.5')).toBe(false))
  it('blocks "0.1"', () => expect(isWholeNumberQty('0.1')).toBe(false))
  it('blocks "1e5"', () => expect(isWholeNumberQty('1e5')).toBe(false))
  it('blocks empty string', () => expect(isWholeNumberQty('')).toBe(false))
  it('blocks "abc"', ()  => expect(isWholeNumberQty('abc')).toBe(false))
})

// ── Price: limit order price validation ───────────────────────────────────────

describe('validatePriceStr — limit price rules', () => {
  it('accepts typical limit price', () => {
    expect(validatePriceStr('74.50').ok).toBe(true)
  })
  it('accepts integer price', () => {
    expect(validatePriceStr('100').ok).toBe(true)
  })
  it('rejects zero', () => {
    expect(validatePriceStr('0').ok).toBe(false)
  })
  it('rejects negative price', () => {
    expect(validatePriceStr('-1').ok).toBe(false)
  })
  it('rejects non-numeric', () => {
    expect(validatePriceStr('abc').ok).toBe(false)
  })
  it('rejects price with spaces in the middle', () => {
    expect(validatePriceStr('1 0').ok).toBe(false)
  })
  it('accepts price with leading/trailing whitespace (trimmed)', () => {
    const r = validatePriceStr('  74.50  ')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe('74.50')
  })
  it('rejects price not on tick grid', () => {
    expect(validatePriceStr('74.51', '0.5').ok).toBe(false)
  })
  it('accepts price on tick grid', () => {
    expect(validatePriceStr('74.50', '0.5').ok).toBe(true)
  })
  it('accepts any price when tickSize is 0 (no constraint)', () => {
    expect(validatePriceStr('74.123', '0').ok).toBe(true)
  })
})

// ── Squid guard: canQuote logic ───────────────────────────────────────────────
//
// canQuote = amountNum > 0 && !!CHAIN_ID[chain] && !!toAddress && !!fromAddress
// fromAddress is always '' until Phase 3, so canQuote is always false.
// These tests confirm the pure boolean guard logic.

describe('Squid canQuote guard', () => {
  const CHAIN_ID: Record<string, string> = {
    ethereum:  '1',
    arbitrum:  '42161',
    polygon:   '137',
  }

  function canQuote(amount: number, chain: string, toAddress: string, fromAddress: string): boolean {
    return amount > 0 && !!CHAIN_ID[chain] && !!toAddress && !!fromAddress
  }

  it('is false when fromAddress is empty (Phase 3 not yet available)', () => {
    expect(canQuote(100, 'ethereum', '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin', '')).toBe(false)
  })
  it('is false when amount is 0', () => {
    expect(canQuote(0, 'ethereum', '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin', '0xabc')).toBe(false)
  })
  it('is false when chain is unknown', () => {
    expect(canQuote(100, 'unknownchain', '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin', '0xabc')).toBe(false)
  })
  it('is false when toAddress is empty', () => {
    expect(canQuote(100, 'ethereum', '', '0xabc')).toBe(false)
  })
  it('is true only when all fields are present (would require Phase 3)', () => {
    expect(canQuote(100, 'ethereum', '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin', '0xabc')).toBe(true)
  })
})

// ── Wallet gate: canSubmit with wallet enforcement ────────────────────────────
//
// In devnet/staging/prod (!IS_LOCAL_API), canSubmit requires hasWallet = !!walletAddress.
// These tests confirm the pure boolean guard logic.

describe('OrderEntry wallet gate logic', () => {
  function canSubmitGate(opts: {
    qtyNum: number
    priceNum: number
    type: 'limit' | 'market'
    hasSufficientBalance: boolean
    gtdValid: boolean
    loading: boolean
    marketId: string
    hasWallet: boolean
  }): boolean {
    const { qtyNum, priceNum, type, hasSufficientBalance, gtdValid, loading, marketId, hasWallet } = opts
    return (
      qtyNum > 0
      && (type === 'market' || priceNum > 0)
      && hasSufficientBalance
      && gtdValid
      && !loading
      && !!marketId
      && hasWallet
    )
  }

  const base = {
    qtyNum: 5,
    priceNum: 74.50,
    type: 'limit' as const,
    hasSufficientBalance: true,
    gtdValid: true,
    loading: false,
    marketId: 'SOL-USDC',
    hasWallet: true,
  }

  it('returns true when all conditions met with wallet', () => {
    expect(canSubmitGate(base)).toBe(true)
  })
  it('returns false when hasWallet is false (non-local-api mode)', () => {
    expect(canSubmitGate({ ...base, hasWallet: false })).toBe(false)
  })
  it('returns false when loading', () => {
    expect(canSubmitGate({ ...base, loading: true })).toBe(false)
  })
  it('returns false when quantity is 0', () => {
    expect(canSubmitGate({ ...base, qtyNum: 0 })).toBe(false)
  })
  it('returns false when limit order has no price', () => {
    expect(canSubmitGate({ ...base, priceNum: 0, type: 'limit' })).toBe(false)
  })
  it('returns true for market order with no price (price not required)', () => {
    expect(canSubmitGate({ ...base, priceNum: 0, type: 'market' })).toBe(true)
  })
  it('returns false when balance is insufficient', () => {
    expect(canSubmitGate({ ...base, hasSufficientBalance: false })).toBe(false)
  })
  it('returns false when GTD expiry is invalid', () => {
    expect(canSubmitGate({ ...base, gtdValid: false })).toBe(false)
  })
  it('returns false when marketId is empty', () => {
    expect(canSubmitGate({ ...base, marketId: '' })).toBe(false)
  })
})
