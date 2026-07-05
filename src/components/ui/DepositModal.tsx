import { useState } from 'react'

const CHAINS = ['Arbitrum', 'Ethereum', 'Optimism', 'Base']
const ASSETS  = ['USDC']

interface DepositModalProps {
  onClose: () => void
}

export default function DepositModal({ onClose }: DepositModalProps) {
  const [chain,   setChain]   = useState('Arbitrum')
  const [asset,   setAsset]   = useState('USDC')
  const [amount,  setAmount]  = useState('')
  const [chainOpen, setChainOpen] = useState(false)
  const [assetOpen, setAssetOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); onClose() }, 1000)
  }

  return (
    /* Scrim */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'var(--surface-modal)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal card */}
      <div
        style={{
          width: 440, background: 'var(--surface-1)',
          border: '1px solid var(--border-strong)',
          borderRadius: 16,
          boxShadow: '0 30px 90px rgba(0,0,0,0.6)',
          padding: 24,
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 22 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <polyline points="19 12 12 19 5 12"/>
            </svg>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>Deposit USDC</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>A 0.2 USDC fee is deducted from the deposit.</p>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Asset */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Asset</span>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setAssetOpen(v => !v)} style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
                <span>{asset}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {assetOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setAssetOpen(false)} />
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 6, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
                    {ASSETS.map(a => (
                      <button key={a} onClick={() => { setAsset(a); setAssetOpen(false) }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 600, color: a === asset ? 'var(--accent)' : 'var(--text-secondary)', background: a === asset ? 'var(--accent-tint)' : 'transparent', border: 'none', cursor: 'pointer' }}>{a}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </label>

          {/* Chain */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Deposit Chain</span>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setChainOpen(v => !v)} style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
                <span>{chain}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {chainOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setChainOpen(false)} />
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 6, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
                    {CHAINS.map(c => (
                      <button key={c} onClick={() => { setChain(c); setChainOpen(false) }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 600, color: c === chain ? 'var(--accent)' : 'var(--text-secondary)', background: c === chain ? 'var(--accent-tint)' : 'transparent', border: 'none', cursor: 'pointer' }}>{c}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </label>

          {/* Amount */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Amount</span>
            <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6, flexShrink: 0 }}>USDC</span>
            </div>
          </label>

          {/* Submit */}
          <div style={{ marginTop: 6 }}>
            <button
              onClick={submit}
              disabled={loading || !amount}
              style={{
                width: '100%', height: 46, borderRadius: 6, fontSize: 14, fontWeight: 900,
                background: 'var(--accent)', color: '#fff', border: 'none',
                cursor: loading || !amount ? 'not-allowed' : 'pointer',
                opacity: loading || !amount ? 0.65 : 1,
              }}
            >
              {loading ? 'Depositing...' : 'Deposit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
