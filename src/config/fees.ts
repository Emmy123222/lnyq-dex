/**
 * LNYQ fee constants — spot and perp.
 *
 * All values in basis points (bps). 1 bps = 0.01%.
 * Never hardcode fee math in UI components — import from here.
 */

// ── Spot fees ─────────────────────────────────────────────────────────────────

/** 0.25% taker fee (spot) */
export const TAKER_FEE_BPS = 25

/** 0.05% maker fee (spot) */
export const MAKER_FEE_BPS = 5

/** Assumed fee rate for pre-submission estimates (taker = worst case) */
export const ESTIMATED_FEE_BPS = TAKER_FEE_BPS

// ── Perp fees ─────────────────────────────────────────────────────────────────

/** 1% taker fee (perp) */
export const PERP_TAKER_FEE_BPS = 100

/** 0.5% maker fee (perp) */
export const PERP_MAKER_FEE_BPS = 50

/** 3% liquidation fee of notional — retained by protocol */
export const PERP_LIQUIDATION_FEE_BPS = 300

/** Max leverage across all perp markets — hard cap */
export const PERP_MAX_LEVERAGE = 5

/** Maintenance margin rate at max leverage (2.5%) */
export const MAINTENANCE_MARGIN_RATE = 0.025

// ── Shared ────────────────────────────────────────────────────────────────────

export const BPS_DIVISOR = 10_000

/** Convert a USDC amount to estimated fee (display only — not for settlement) */
export function estimateFeeDisplay(totalUsdc: number, bps = ESTIMATED_FEE_BPS): number {
  return (totalUsdc * bps) / BPS_DIVISOR
}

/** Format bps as percentage string */
export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`
}

/**
 * Liquidation price for a perp position.
 * Long:  entryPrice × (1 − 1/leverage + maintenanceMarginRate)
 * Short: entryPrice × (1 + 1/leverage − maintenanceMarginRate)
 */
export function calcLiquidationPrice(
  side: 'buy' | 'sell',
  entryPrice: number,
  leverage: number,
): number {
  const m = MAINTENANCE_MARGIN_RATE
  return side === 'buy'
    ? entryPrice * (1 - 1 / leverage + m)
    : entryPrice * (1 + 1 / leverage - m)
}
