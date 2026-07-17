/**
 * authService — access code verification, signup, session management.
 *
 * BACKEND DEPENDENCY:
 *   local-sim: POST /auth/verify-code, POST /auth/signup
 *   devnet:    POST /auth/access-code/verify, POST /auth/signup
 */

import type {
  AccessCodeVerifyRequest,
  AccessCodeVerifyResponse,
  SignupRequest,
  SignupResponse,
  AuthSession,
  ServiceResult,
} from '../types'
import { ENV } from '../config/env'
import { apiFetch, serviceError } from './types'

const SESSION_KEY = 'lnyq_session'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Basic format check — UX only. Backend is source of truth. */
export function validateAccessCodeFormat(code: string): boolean {
  const trimmed = code.trim().toUpperCase()
  return /^[A-Z0-9][A-Z0-9\-]{2,}[A-Z0-9]$/.test(trimmed)
}

// ── Service ───────────────────────────────────────────────────────────────────

export const authService = {
  async verifyAccessCode(req: AccessCodeVerifyRequest): Promise<ServiceResult<AccessCodeVerifyResponse>> {
    if (ENV.IS_LOCAL_API) {
      // sim server path: POST /auth/verify-code
      const res = await apiFetch<{ status: string }>('/auth/verify-code', {
        method: 'POST',
        body: { code: req.code.trim().toUpperCase() },
      })
      if (!res.ok) {
        const isUsed = res.error.code === 'ALREADY_USED'
        return {
          ok: true,
          data: {
            status: isUsed ? 'ALREADY_USED' : 'INVALID',
            message: res.error.message,
          },
        }
      }
      // Pass the raw access code through as the "token" — signup will use it as accessCode
      return { ok: true, data: { status: 'VALID', sessionToken: req.code.trim().toUpperCase() } }
    }

    return apiFetch<AccessCodeVerifyResponse>('/auth/access-code/verify', { method: 'POST', body: req })
  },

  async signup(req: SignupRequest): Promise<ServiceResult<SignupResponse>> {
    if (ENV.IS_LOCAL_API) {
      // sim server signup: send raw accessCode (not a token)
      const simRes = await apiFetch<{
        userId: string; sessionToken: string; referralCode: string; username: string
      }>('/auth/signup', {
        method: 'POST',
        body: {
          email:      req.email,
          username:   req.username,
          password:   '',
          accessCode: req.accessCodeToken,  // pass the code through as accessCode
        },
      })
      if (!simRes.ok) return { ok: false, error: simRes.error }
      return {
        ok: true,
        data: {
          userId:       simRes.data.userId,
          username:     simRes.data.username,
          email:        req.email,
          referralCode: simRes.data.referralCode,
          sessionToken: simRes.data.sessionToken,
          createdAt:    new Date().toISOString(),
        },
      }
    }

    return apiFetch<SignupResponse>('/auth/signup', { method: 'POST', body: req })
  },

  async login(email: string): Promise<ServiceResult<SignupResponse>> {
    if (ENV.IS_LOCAL_API) {
      const res = await apiFetch<{
        userId: string; sessionToken: string; referralCode: string; username: string
      }>('/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() },
      })
      if (!res.ok) return { ok: false, error: res.error }
      return {
        ok: true,
        data: {
          userId:       res.data.userId,
          username:     res.data.username,
          email:        email.trim().toLowerCase(),
          referralCode: res.data.referralCode,
          sessionToken: res.data.sessionToken,
          createdAt:    new Date().toISOString(),
        },
      }
    }
    return apiFetch<SignupResponse>('/auth/login', { method: 'POST', body: { email } })
  },

  /** Persist session to sessionStorage */
  saveSession(session: AuthSession): void {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch { /* storage unavailable */ }
  },

  /** Retrieve persisted session */
  loadSession(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (!raw) return null
      return JSON.parse(raw) as AuthSession
    } catch { return null }
  },

  clearSession(): void {
    try { sessionStorage.removeItem(SESSION_KEY) } catch { /* noop */ }
  },

  /** Validate a still-live session against the backend */
  async validateSession(sessionToken: string): Promise<ServiceResult<AuthSession>> {
    if (ENV.IS_LOCAL_API) {
      const res = await apiFetch<{ userId: string; username: string; referralCode: string }>(
        '/auth/session',
        { sessionToken },
      )
      if (!res.ok) return serviceError('INVALID_SESSION', 'Session expired')
      const saved = authService.loadSession()
      if (saved && saved.sessionToken === sessionToken) return { ok: true, data: saved }
      return serviceError('INVALID_SESSION', 'Session not found locally')
    }

    return apiFetch<AuthSession>('/auth/me', { sessionToken })
  },
}
