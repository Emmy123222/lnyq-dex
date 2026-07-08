/**
 * Shared service infrastructure types.
 * Domain types live in src/types/index.ts.
 *
 * No mock data. If a real endpoint is missing, return INTEGRATION_UNAVAILABLE.
 */

import type { ApiError, ServiceResult } from '../types'
import { ENV } from '../config/env'

export type { ApiError, ServiceResult }

/** Wrap an error in a ServiceResult.error shape */
export function serviceError(code: string, message: string, httpStatus?: number): ServiceResult<never> {
  return { ok: false, error: { code, message, httpStatus } }
}

/** Throws if no API URL is configured */
export function requireApiUrl(): void {
  if (!ENV.API_URL) {
    throw new Error(
      ENV.IS_LOCAL_API
        ? '[LNYQ] VITE_LNYQ_API_URL must be http://localhost:3001/api in local-api mode. Run: npm run dev:api'
        : '[LNYQ] VITE_LNYQ_API_URL is required. Set it in .env.local',
    )
  }
}

/** Read the active session token from sessionStorage (set by authService.saveSession) */
export function getSessionToken(): string {
  try {
    const raw = sessionStorage.getItem('lnyq_session')
    if (!raw) return ''
    const session = JSON.parse(raw) as { sessionToken?: string }
    return session.sessionToken ?? ''
  } catch { return '' }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * Base fetch wrapper for all API calls.
 * Auto-unwraps server envelope `{ ok: true, data: X }` → X.
 */
export async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod
    body?: unknown
    sessionToken?: string
  } = {},
): Promise<ServiceResult<T>> {
  requireApiUrl()
  const { method = 'GET', body, sessionToken } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-request-id': crypto.randomUUID(),
  }
  if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`

  try {
    const res = await fetch(`${ENV.API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      let errorBody: ApiError = { code: 'HTTP_ERROR', message: res.statusText, httpStatus: res.status }
      try {
        const errJson = await res.json() as Record<string, string>
        errorBody = {
          code:       errJson.error ?? errJson.code ?? 'HTTP_ERROR',
          message:    errJson.message ?? res.statusText,
          httpStatus: res.status,
        }
      } catch { /* non-JSON body */ }
      return { ok: false, error: errorBody }
    }
    const json = await res.json()
    // Unwrap server envelope { ok: true, data: X } → X
    const data: T = (json && typeof json === 'object' && 'ok' in json &&
      (json as Record<string, unknown>).ok === true && 'data' in json)
      ? (json as { ok: boolean; data: T }).data
      : (json as T)
    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    console.error(`[LNYQ API] ${method} ${path}:`, err)
    return { ok: false, error: { code: 'NETWORK_ERROR', message } }
  }
}

/**
 * Returns an "integration unavailable" ServiceResult.
 * Use this for features that are gated or not yet wired to a backend endpoint.
 * DO NOT use this as a fallback for failing API calls — return the real error instead.
 */
export function unavailable<T>(feature: string): ServiceResult<T> {
  return serviceError(
    'INTEGRATION_UNAVAILABLE',
    `${feature} is not configured. Check backend documentation.`,
  )
}
