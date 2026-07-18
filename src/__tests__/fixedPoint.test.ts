import { describe, it, expect } from 'vitest'
import { addDecStr, mulDecStr, cmpDecStr } from '../utils/decimal'

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
