/**
 * NetworkStatus — small pill shown in header or footer.
 * Reflects healthService status and current mode/chain.
 */

import { useState, useEffect } from 'react'
import { healthService } from '../../services/healthService'
import type { SystemHealth } from '../../types'

const STATUS_COLOR: Record<string, string> = {
  ok:      '#2EBD85',
  degraded:'#F0A500',
  down:    '#F6465D',
  unknown: '#6B6B78',
}

export default function NetworkStatus() {
  const [health, setHealth] = useState<SystemHealth | null>(null)

  useEffect(() => {
    healthService.get().then(setHealth)
    const id = setInterval(() => healthService.get().then(setHealth), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!health) return null

  const color = STATUS_COLOR[health.overall] ?? '#6B6B78'
  const label = health.chain.replace('solana-', 'SOL ').replace('arbitrum-', 'ARB ').toUpperCase()

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 9px', borderRadius: 999,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        cursor: 'default', userSelect: 'none',
      }}
      title={`${health.overall.toUpperCase()} · API: ${health.apiUrl || 'not configured'} · Checked: ${health.checkedAt}`}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}
