/**
 * healthService — system health check.
 *
 * All modes hit a real backend. No mock responses.
 */

import type { SystemHealth, ServiceHealth, HealthStatus } from '../types'
import { ENV } from '../config/env'
import { apiFetch } from './types'

async function checkApiPing(): Promise<ServiceHealth> {
  if (!ENV.API_URL) {
    return { name: 'API', status: 'unknown', message: 'VITE_LNYQ_API_URL not configured' }
  }
  const t0 = Date.now()
  const res = await apiFetch<{ status: string }>('/health')
  const latencyMs = Date.now() - t0
  if (res.ok) return { name: 'API', status: 'ok', latencyMs }
  return { name: 'API', status: 'down', latencyMs, message: res.error.message }
}

export const healthService = {
  async get(): Promise<SystemHealth> {
    const apiService = await checkApiPing()
    const overall: HealthStatus = apiService.status === 'ok' ? 'ok' : 'down'
    return {
      overall,
      mode: ENV.MODE,
      chain: ENV.CHAIN,
      apiUrl: ENV.API_URL,
      services: [apiService],
      checkedAt: new Date().toISOString(),
    }
  },
}
