/**
 * Decimal utilities for display formatting and order-submission validation.
 *
 * Display functions accept numbers (safe — only used for rendering).
 * Submission validators accept strings and keep them as strings to avoid
 * IEEE-754 precision loss when values are sent to the matching engine.
 */

// ── Display formatters (JS Number is fine here — rendering only) ──────────────

/** Format a price for display. Up to 6 significant decimal places. */
export function fmtPrice(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (!isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}

/** Format a quantity for display. Up to 8 decimal places. */
export function fmtQty(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (!isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 })
}

/** Format a USDC balance for display. Always 2 decimal places. */
export function fmtBalance(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (!isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Format a fee for display. Up to 6 decimal places. */
export function fmtFee(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (!isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}

/** Format a 24h change percentage for display. Always 2 decimal places with sign. */
export function fmtChange(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (!isFinite(n)) return '—'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

// ── Fixed-point string arithmetic (order-critical paths only) ────────────────
//
// Use these instead of parseFloat/Number when values are sent to the matching
// engine. All functions keep values as strings to avoid IEEE-754 precision loss.

function decParts(s: string): [bigint, number] {
  const clean = s.trim().replace(/^-/, '')
  const neg   = s.trim().startsWith('-')
  const dot   = clean.indexOf('.')
  const decimals = dot === -1 ? 0 : clean.length - dot - 1
  const int   = BigInt(clean.replace('.', ''))
  return [neg ? -int : int, decimals]
}

function formatFixed(int: bigint, decimals: number): string {
  if (decimals === 0) return int.toString()
  const neg = int < 0n
  const abs = neg ? -int : int
  const s   = abs.toString().padStart(decimals + 1, '0')
  const whole = s.slice(0, s.length - decimals) || '0'
  const frac  = s.slice(s.length - decimals).replace(/0+$/, '')
  const result = frac ? `${whole}.${frac}` : whole
  return neg ? `-${result}` : result
}

/**
 * Add two decimal strings without IEEE-754 precision loss.
 * Safe for price/quantity totals in order-submission paths.
 */
export function addDecStr(a: string, b: string): string {
  const [ai, ad] = decParts(a)
  const [bi, bd] = decParts(b)
  const decimals  = Math.max(ad, bd)
  const scale     = (d: number) => 10n ** BigInt(decimals - d)
  return formatFixed(ai * scale(ad) + bi * scale(bd), decimals)
}

/**
 * Multiply two decimal strings without IEEE-754 precision loss.
 * Safe for price × quantity total calculations before order submission.
 */
export function mulDecStr(a: string, b: string): string {
  const [ai, ad] = decParts(a)
  const [bi, bd] = decParts(b)
  return formatFixed(ai * bi, ad + bd)
}

/**
 * Compare two decimal strings.
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 */
export function cmpDecStr(a: string, b: string): -1 | 0 | 1 {
  const [ai, ad] = decParts(a)
  const [bi, bd] = decParts(b)
  const decimals  = Math.max(ad, bd)
  const scale     = (d: number) => 10n ** BigInt(decimals - d)
  const diff      = ai * scale(ad) - bi * scale(bd)
  return diff < 0n ? -1 : diff > 0n ? 1 : 0
}

// ── Submission validators (string → string, no number conversion) ─────────────

/** Regex patterns for price and quantity strings accepted by the matching engine */
const DECIMAL_RE = /^\d+(\.\d+)?$/

/**
 * Validate a price string before order submission.
 * Returns { ok: true, value } on success or { ok: false, error } on failure.
 * The value is the original string — never converted to Number.
 */
export function validatePriceStr(
  raw: string,
  tickSize?: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (!DECIMAL_RE.test(trimmed)) return { ok: false, error: 'Price must be a positive decimal number.' }
  if (parseFloat(trimmed) <= 0)  return { ok: false, error: 'Price must be greater than zero.' }
  if (tickSize) {
    const tick = parseFloat(tickSize)
    if (tick > 0) {
      const remainder = parseFloat(trimmed) % tick
      if (remainder > 1e-9 && Math.abs(remainder - tick) > 1e-9) {
        return { ok: false, error: `Price must be a multiple of ${tickSize}.` }
      }
    }
  }
  return { ok: true, value: trimmed }
}

/**
 * Validate a quantity string before order submission.
 * Returns { ok: true, value } on success or { ok: false, error } on failure.
 * The value is the original string — never converted to Number.
 */
export function validateQtyStr(
  raw: string,
  minOrderSize?: number,
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (!DECIMAL_RE.test(trimmed)) return { ok: false, error: 'Quantity must be a positive decimal number.' }
  const n = parseFloat(trimmed)
  if (n <= 0) return { ok: false, error: 'Quantity must be greater than zero.' }
  if (minOrderSize != null && n < minOrderSize) {
    return { ok: false, error: `Minimum order size is ${minOrderSize}.` }
  }
  return { ok: true, value: trimmed }
}
