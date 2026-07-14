import { FLAGS } from '../config/featureFlags'

export default function Funding() {
  if (!FLAGS.CROSS_CHAIN) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: 420 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(160,81,252,0.12)', border: '1px solid rgba(160,81,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Cross-Chain Funding · Phase 3</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.7, marginBottom: 24 }}>
            Deposits and withdrawals via Squid Router are coming in Phase 3 with cross-chain USDC settlement.
            <br /><br />
            During Phase 1 testnet, USDC is distributed via the drip faucet on signup. No real transfers take place.
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 8, fontSize: 12, color: '#F0A500', lineHeight: 1.6, textAlign: 'left' }}>
            <strong>Phase 1 testnet only.</strong> All balances are simulated. No real USDC is at risk.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
      <div style={{ textAlign: 'center', padding: 24, fontSize: 13, color: 'var(--text-tertiary)' }}>
        Funding integration unavailable. Backend not configured.
      </div>
    </div>
  )
}
