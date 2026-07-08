/**
 * referralService — referral code display, points, apply.
 *
 * All modes hit a real backend. No mock data.
 * local-api: GET /referral, POST /referral/apply
 * devnet-api+: GET /referrals/me, POST /referrals/apply
 */

import type { ReferralInfo, ApplyReferralRequest, ServiceResult } from '../types'
import { ENV } from '../config/env'
import { apiFetch, getSessionToken } from './types'

interface ApiReferralResponse {
  referralCode: string
  totalPoints: number
  referredCount: number
  referredUsers: { username: string; joinedAt: number; hasTraded: boolean; points: number }[]
}

export const referralService = {
  async getMyReferral(sessionToken: string): Promise<ServiceResult<ReferralInfo>> {
    const token = sessionToken || getSessionToken()

    if (ENV.IS_LOCAL_API) {
      const res = await apiFetch<ApiReferralResponse>('/referral', { sessionToken: token })
      if (!res.ok) return res
      return {
        ok: true,
        data: {
          referralCode:   res.data.referralCode,
          referralLink:   `https://lnyq.xyz/r/${res.data.referralCode}`,
          referralCount:  res.data.referredCount,
          referredVolume: '0',
          referralPoints: res.data.totalPoints,
          tier: 1,
          tierName: 'Tier 1',
          nextTierPoints: 500,
          referredUsers: res.data.referredUsers.map(u => ({
            username:     u.username,
            joinedAt:     new Date(u.joinedAt).toISOString().split('T')[0],
            volume:       '0',
            pointsEarned: u.points,
            status:       u.hasTraded ? 'active' : 'inactive',
          })),
        },
      }
    }

    return apiFetch<ReferralInfo>('/referrals/me', { sessionToken: token })
  },

  async applyReferral(req: ApplyReferralRequest, sessionToken: string): Promise<ServiceResult<{ applied: boolean }>> {
    const token = sessionToken || getSessionToken()

    if (ENV.IS_LOCAL_API) {
      return apiFetch<{ applied: boolean }>('/referral/apply', {
        method: 'POST',
        body: { code: req.referralCode },
        sessionToken: token,
      })
    }

    return apiFetch<{ applied: boolean }>('/referrals/apply', { method: 'POST', body: req, sessionToken: token })
  },

  async getLeaderboard(): Promise<ServiceResult<{ username: string; points: number; rank: number }[]>> {
    return apiFetch<{ username: string; points: number; rank: number }[]>('/referrals/leaderboard')
  },
}
