/**
 * Services barrel — import all services from here.
 *
 * Usage:
 *   import { marketService, orderService } from '../services'
 */

export { healthService }         from './healthService'
export { marketService }         from './marketService'
export { orderBookService }      from './orderBookService'
export { orderService, statusLabel } from './orderService'
export { tradeService }          from './tradeService'
export { portfolioService }      from './portfolioService'
export { authService, validateAccessCodeFormat } from './authService'
export { referralService }       from './referralService'
export { dripService }           from './dripService'
export { walletService }         from './walletService'
export { squidService, validatePreHook, validatePostHook, parseSquidIntegratorFee, parseSquidBridgeFees } from './squidService'
export { featureFlagService }    from './featureFlagService'
export { perpService }           from './perpService'
export type { FundingRateInfo, OpenInterestInfo } from './perpService'
export { chartService }          from './chartService'
export type { CandleInterval }   from './chartService'
export { simClient }             from './simClient'
