/**
 * TestnetBanner — sticky top strip shown in all non-mainnet modes.
 * Alerts users this is a testnet with no real value assets.
 */

import { useState } from 'react'
import { ENV } from '../../config/env'

export default function TestnetBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || ENV.IS_PRODUCTION) return null

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 32,
        zIndex: 50,
        background: 'linear-gradient(90deg,rgba(160,81,252,0.9),rgba(83,28,151,0.9))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12,
        fontSize: 11, fontWeight: 700, color: '#fff',
        letterSpacing: '0.04em',
      }}
    >
      <span style={{ opacity: 0.6 }}>●</span>
      {`TESTNET (${ENV.CHAIN.toUpperCase()}) — no real assets — for testing only`}
      <button
        onClick={() => setDismissed(true)}
        style={{ marginLeft: 8, opacity: 0.6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, lineHeight: 1 }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
