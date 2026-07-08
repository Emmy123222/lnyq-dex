/**
 * featureFlagService — runtime feature flag queries.
 *
 * Currently reads from compile-time env vars (FLAGS object).
 * When backend adds dynamic flags, replace the implementation without changing call sites.
 */

import { FLAGS, type FeatureFlag, gateLabel } from '../config/featureFlags'
import type { ServiceResult } from '../types'

export const featureFlagService = {
  async getAll(): Promise<ServiceResult<Record<FeatureFlag, boolean>>> {
    return { ok: true, data: { ...FLAGS } as Record<FeatureFlag, boolean> }
  },

  async isEnabled(flag: FeatureFlag): Promise<boolean> {
    return FLAGS[flag]
  },

  getGateLabel: gateLabel,
}
