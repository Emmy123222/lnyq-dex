/**
 * BridgeStatusTracker — shows cross-chain USDC bridge progress.
 *
 * Steps map to Squid transaction lifecycle:
 *   Initiated → Source Confirmed → Bridge Processing → Destination Received → Complete
 *
 * Requires a real txHash and squidService.getStatus() to track progress.
 * No mock auto-advance — if the backend is not configured, shows integration unavailable.
 */


export type BridgeStep = 'initiated' | 'source' | 'bridge' | 'destination' | 'complete'

const STEPS: { id: BridgeStep; label: string; detail: string }[] = [
  { id: 'initiated',   label: 'Initiated',               detail: 'Transaction submitted to source chain' },
  { id: 'source',      label: 'Source confirmed',         detail: 'Source chain transaction confirmed' },
  { id: 'bridge',      label: 'Bridge relay',             detail: 'USDC in transit via bridge' },
  { id: 'destination', label: 'Destination received',     detail: 'Arrived on Solana devnet' },
  { id: 'complete',    label: 'Complete',                 detail: 'USDC credited to your account' },
]

const STEP_ORDER: BridgeStep[] = ['initiated', 'source', 'bridge', 'destination', 'complete']

interface Props {
  /** Source chain display name */
  sourceChain: string
  /** USDC amount being bridged */
  amount: string
  /** Real Squid txHash — required for live tracking */
  txHash?: string
  onComplete?: () => void
}

export default function BridgeStatusTracker({ sourceChain, amount, txHash }: Props) {
  // No txHash means squidService hasn't provided a real transaction yet.
  // Hold at 'initiated' — never auto-advance with fake delays.
  const currentStep: BridgeStep = 'initiated'
  const currentIdx = STEP_ORDER.indexOf(currentStep)
  const isComplete = false

  if (!txHash) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          Bridge integration unavailable
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
          Squid Router integration is not yet configured. Real bridge transactions require a
          txHash from squidService. This feature will be available in Phase 3.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
          Bridging {amount} USDC from {sourceChain}
        </div>
        {isComplete
          ? <div style={{ fontSize: 12, color: 'var(--up-500)' }}>USDC credited to your account</div>
          : <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Estimated 2–5 minutes</div>
        }
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STEPS.map((step, idx) => {
          const done    = idx < currentIdx || isComplete
          const active  = idx === currentIdx && !isComplete
          const pending = idx > currentIdx && !isComplete

          return (
            <div key={step.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* Icon column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'var(--up-500)' : active ? 'var(--accent)' : 'var(--surface-3)',
                  border: `2px solid ${done ? 'var(--up-500)' : active ? 'var(--accent)' : 'var(--border)'}`,
                  flexShrink: 0,
                }}>
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : active ? (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1s ease-in-out infinite' }} />
                  ) : null}
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 20, background: done ? 'var(--up-500)' : 'var(--border-subtle)', marginTop: 3, marginBottom: 3 }} />
                )}
              </div>

              {/* Label */}
              <div style={{ paddingBottom: idx < STEPS.length - 1 ? 20 : 0, paddingTop: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: done ? 'var(--up-500)' : active ? '#fff' : pending ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
                  {step.label}
                </div>
                {(done || active) && (
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{step.detail}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
