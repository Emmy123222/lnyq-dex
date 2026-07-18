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
