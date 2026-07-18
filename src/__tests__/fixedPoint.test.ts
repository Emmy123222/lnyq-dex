import { describe, it, expect } from 'vitest'
import {
  addDecStr, mulDecStr, cmpDecStr,
  subDecStr, parseDecimalToUnits, formatUnitsToDecimal,
  calculateFeeBps, validateTickStr,
} from '../utils/decimal'

// ── addDecStr ─────────────────────────────────────────────────────────────────

describe('addDecStr', () => {
  it('adds two integer strings', () => {
    expect(addDecStr('100', '200')).toBe('300')
  })
  it('adds decimals without IEEE-754 drift', () => {
    // 0.1 + 0.2 in float is 0.30000000000000004 — must be exactly 0.3
    expect(addDecStr('0.1', '0.2')).toBe('0.3')
  })
  it('adds mixed decimal places', () => {
    expect(addDecStr('1.5', '2.25')).toBe('3.75')
  })
  it('handles price + fee without drift', () => {
    expect(addDecStr('99.99', '0.01')).toBe('100')
  })
  it('handles large order totals', () => {
    expect(addDecStr('999999.999', '0.001')).toBe('1000000')
  })
  it('adds strings that look like small qty increments', () => {
    expect(addDecStr('0.00000001', '0.00000001')).toBe('0.00000002')
  })
})

// ── mulDecStr ─────────────────────────────────────────────────────────────────

describe('mulDecStr', () => {
  it('multiplies price × quantity to get total', () => {
    expect(mulDecStr('1.5', '100')).toBe('150')
  })
  it('avoids IEEE-754 precision loss on typical order values', () => {
    // 0.1 * 0.1 in float is 0.010000000000000002 — must be exactly 0.01
    expect(mulDecStr('0.1', '0.1')).toBe('0.01')
  })
  it('handles USDC price × integer token quantity', () => {
    expect(mulDecStr('74.95', '50')).toBe('3747.5')
  })
  it('handles small price × large quantity', () => {
    expect(mulDecStr('0.0001', '10000')).toBe('1')
  })
  it('trims trailing zeros', () => {
    expect(mulDecStr('2.50', '4')).toBe('10')
  })
})

// ── cmpDecStr ─────────────────────────────────────────────────────────────────

describe('cmpDecStr', () => {
  it('returns 0 for equal values', () => {
    expect(cmpDecStr('1.00', '1')).toBe(0)
  })
  it('returns -1 when a < b', () => {
    expect(cmpDecStr('0.99', '1.00')).toBe(-1)
  })
  it('returns 1 when a > b', () => {
    expect(cmpDecStr('100.01', '100.00')).toBe(1)
  })
  it('handles different decimal lengths', () => {
    expect(cmpDecStr('1.5', '1.50')).toBe(0)
  })
  it('correctly orders prices that differ only in last decimal', () => {
    expect(cmpDecStr('74.949', '74.950')).toBe(-1)
  })
  it('correctly orders large values', () => {
    expect(cmpDecStr('1000000', '999999.9999')).toBe(1)
  })
})

// ── subDecStr ─────────────────────────────────────────────────────────────────

describe('subDecStr', () => {
  it('subtracts two integers', () => {
    expect(subDecStr('300', '100')).toBe('200')
  })
  it('subtracts without IEEE-754 drift', () => {
    expect(subDecStr('0.3', '0.1')).toBe('0.2')
  })
  it('produces a negative result when a < b', () => {
    expect(subDecStr('1', '1.5')).toBe('-0.5')
  })
  it('handles fee deduction: 100 - 0.25 = 99.75', () => {
    expect(subDecStr('100', '0.25')).toBe('99.75')
  })
  it('returns 0 when values are equal', () => {
    expect(subDecStr('1.00', '1')).toBe('0')
  })
})

// ── parseDecimalToUnits ───────────────────────────────────────────────────────

describe('parseDecimalToUnits', () => {
  it('converts USDC with 6 decimals', () => {
    expect(parseDecimalToUnits('1.5', 6)).toBe(1_500_000n)
  })
  it('handles whole number input', () => {
    expect(parseDecimalToUnits('100', 6)).toBe(100_000_000n)
  })
  it('handles more input decimals than unit decimals (truncates)', () => {
    // 1.5001 with 3 unit decimals = 1500 (truncate, not round)
    expect(parseDecimalToUnits('1.5001', 3)).toBe(1500n)
  })
  it('handles zero', () => {
    expect(parseDecimalToUnits('0', 6)).toBe(0n)
  })
  it('SOL lamports: 1.123456789 SOL → truncates to 1123456789 lamports (9 decimals)', () => {
    expect(parseDecimalToUnits('1.123456789', 9)).toBe(1_123_456_789n)
  })
})

// ── formatUnitsToDecimal ──────────────────────────────────────────────────────

describe('formatUnitsToDecimal', () => {
  it('is the inverse of parseDecimalToUnits for whole amounts', () => {
    expect(formatUnitsToDecimal(100_000_000n, 6)).toBe('100')
  })
  it('formats fractional USDC correctly', () => {
    expect(formatUnitsToDecimal(1_500_000n, 6)).toBe('1.5')
  })
  it('handles sub-unit amounts', () => {
    expect(formatUnitsToDecimal(1n, 6)).toBe('0.000001')
  })
  it('handles zero units', () => {
    expect(formatUnitsToDecimal(0n, 6)).toBe('0')
  })
})

// ── calculateFeeBps ───────────────────────────────────────────────────────────

describe('calculateFeeBps', () => {
  it('calculates 10 bps (0.1%) of 100 = 0.1', () => {
    expect(calculateFeeBps('100', 10)).toBe('0.1')
  })
  it('calculates 30 bps (0.3%) of 74.95', () => {
    // 74.95 * 30 / 10000 = 0.22485 — exact, no IEEE-754 drift
    expect(calculateFeeBps('74.95', 30)).toBe('0.22485')
  })
  it('calculates 0 bps correctly', () => {
    expect(calculateFeeBps('1000', 0)).toBe('0')
  })
  it('calculates 10000 bps (100%) of 1', () => {
    expect(calculateFeeBps('1', 10000)).toBe('1')
  })
})

// ── validateTickStr ───────────────────────────────────────────────────────────

describe('validateTickStr', () => {
  it('passes when price is a valid tick multiple', () => {
    expect(validateTickStr('100.50', '0.5').ok).toBe(true)
  })
  it('fails when price is not a tick multiple', () => {
    const r = validateTickStr('100.3', '0.5')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('0.5')
  })
  it('passes for integer price with integer tick', () => {
    expect(validateTickStr('100', '1').ok).toBe(true)
  })
  it('fails for integer price that is not a multiple of tick', () => {
    expect(validateTickStr('101', '5').ok).toBe(false)
  })
  it('passes when tickSize is 0 (no tick constraint)', () => {
    expect(validateTickStr('74.9999', '0').ok).toBe(true)
  })
  it('avoids float modulo drift: 0.3 is valid multiple of 0.1', () => {
    // In float: 0.3 % 0.1 = 0.09999... ≠ 0 — BigInt path must pass
    expect(validateTickStr('0.3', '0.1').ok).toBe(true)
  })
  it('avoids float modulo drift: 74.95 is not a multiple of 0.1', () => {
    // float: 74.95 % 0.1 = 0.049999... which may round; BigInt must give false
    expect(validateTickStr('74.95', '0.1').ok).toBe(false)
  })
  it('correctly rejects 74.95 against tick 1.0', () => {
    expect(validateTickStr('74.95', '1.0').ok).toBe(false)
  })
})
