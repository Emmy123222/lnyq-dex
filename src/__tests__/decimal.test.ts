import { describe, it, expect } from 'vitest'
import {
  fmtPrice,
  fmtQty,
  fmtBalance,
  fmtFee,
  fmtChange,
  validatePriceStr,
  validateQtyStr,
} from '../utils/decimal'

// ── Display formatters ────────────────────────────────────────────────────────

describe('fmtPrice', () => {
  it('formats whole number with 2 decimal places', () => {
    expect(fmtPrice(100)).toBe('100.00')
  })
  it('formats string input', () => {
    expect(fmtPrice('0.000123')).toBe('0.000123')
  })
  it('returns — for non-finite', () => {
    expect(fmtPrice(NaN)).toBe('—')
    expect(fmtPrice(Infinity)).toBe('—')
  })
})

describe('fmtQty', () => {
  it('formats integer quantity without decimals', () => {
    expect(fmtQty(500)).toBe('500')
  })
  it('formats fractional quantity', () => {
    expect(fmtQty('1.5')).toBe('1.5')
  })
  it('returns — for NaN', () => {
    expect(fmtQty(NaN)).toBe('—')
  })
})

describe('fmtBalance', () => {
  it('always shows 2 decimal places', () => {
    expect(fmtBalance(1000)).toBe('1,000.00')
    expect(fmtBalance('50000.1')).toBe('50,000.10')
  })
  it('returns — for non-finite', () => {
    expect(fmtBalance(NaN)).toBe('—')
  })
})

describe('fmtFee', () => {
  it('shows fee with up to 6 decimal places', () => {
    expect(fmtFee(0.000025)).toBe('0.000025')
  })
  it('returns — for NaN', () => {
    expect(fmtFee(NaN)).toBe('—')
  })
})

describe('fmtChange', () => {
  it('formats positive change with + sign', () => {
    expect(fmtChange(5.21)).toBe('+5.21%')
  })
  it('formats negative change', () => {
    expect(fmtChange(-3.5)).toBe('-3.50%')
  })
  it('formats zero', () => {
    expect(fmtChange(0)).toBe('+0.00%')
  })
  it('returns — for NaN', () => {
    expect(fmtChange(NaN)).toBe('—')
  })
})

// ── Submission validators — keep strings, never convert to Number ─────────────

describe('validatePriceStr', () => {
  it('accepts a valid price string', () => {
    const r = validatePriceStr('1.23')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe('1.23')
  })

  it('trims whitespace', () => {
    const r = validatePriceStr('  0.01  ')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe('0.01')
  })

  it('rejects zero', () => {
    const r = validatePriceStr('0')
    expect(r.ok).toBe(false)
  })

  it('rejects negative', () => {
    expect(validatePriceStr('-1').ok).toBe(false)
  })

  it('rejects non-numeric string', () => {
    expect(validatePriceStr('abc').ok).toBe(false)
    expect(validatePriceStr('1e5').ok).toBe(false)
  })

  it('rejects price not on tick grid', () => {
    const r = validatePriceStr('1.005', '0.01')
    expect(r.ok).toBe(false)
  })

  it('accepts price exactly on tick grid', () => {
    expect(validatePriceStr('1.00', '0.01').ok).toBe(true)
    expect(validatePriceStr('10', '1').ok).toBe(true)
  })
})

describe('validateQtyStr', () => {
  it('accepts a valid quantity', () => {
    const r = validateQtyStr('100')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe('100')
  })

  it('trims whitespace', () => {
    const r = validateQtyStr('  50  ')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe('50')
  })

  it('rejects zero', () => {
    expect(validateQtyStr('0').ok).toBe(false)
  })

  it('rejects negative', () => {
    expect(validateQtyStr('-10').ok).toBe(false)
  })

  it('rejects non-numeric', () => {
    expect(validateQtyStr('abc').ok).toBe(false)
  })

  it('rejects below minOrderSize', () => {
    expect(validateQtyStr('0.5', 1).ok).toBe(false)
  })

  it('accepts at or above minOrderSize', () => {
    expect(validateQtyStr('1', 1).ok).toBe(true)
    expect(validateQtyStr('100', 1).ok).toBe(true)
  })
})
