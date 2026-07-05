import { useState } from 'react'

const NETWORKS = ['Arbitrum One', 'Ethereum', 'Optimism', 'Base']

const TRANSFERS = [
  { type: 'Deposit',  dirColor: '#2EBD85', net: 'Arbitrum One', amount: '+25,000.00', amtColor: 'var(--up-500)',   time: '2026-07-03 14:22', hash: '0x4a2e…88f1', status: 'Completed', statusColor: '#2EBD85' },
  { type: 'Withdraw', dirColor: '#F6465D', net: 'Arbitrum One', amount: '-10,000.00', amtColor: 'var(--down-400)', time: '2026-06-28 09:15', hash: '0x91cb…3d2a', status: 'Completed', statusColor: '#2EBD85' },
  { type: 'Deposit',  dirColor: '#2EBD85', net: 'Arbitrum One', amount: '+50,000.00', amtColor: 'var(--up-500)',   time: '2026-06-15 18:40', hash: '0x7e3f…c119', status: 'Completed', statusColor: '#2EBD85' },
  { type: 'Withdraw', dirColor: '#F6465D', net: 'Arbitrum One', amount: '-5,000.00',  amtColor: 'var(--down-400)', time: '2026-06-10 11:02', hash: '0x2b9a…f881', status: 'Pending',   statusColor: '#F0A500' },
  { type: 'Deposit',  dirColor: '#2EBD85', net: 'Ethereum',     amount: '+20,000.00', amtColor: 'var(--up-500)',   time: '2026-06-01 08:55', hash: '0x5d7c…1a4e', status: 'Completed', statusColor: '#2EBD85' },
  { type: 'Deposit',  dirColor: '#2EBD85', net: 'Arbitrum One', amount: '+30,000.00', amtColor: 'var(--up-500)',   time: '2026-05-20 15:33', hash: '0x8f2d…c090', status: 'Completed', statusColor: '#2EBD85' },
]

const STATS = [
  { label: 'Account Equity',   value: '58,420.00' },
  { label: 'Available to Trade', value: '41,588.00' },
  { label: 'Margin In Use',    value: '16,832.00' },
  { label: 'Unrealized PnL',   value: '+472.00', green: true },
]

const AMOUNT_PRESETS = ['25%', '50%', '75%', 'Max']

export default function Funding() {
  const [mode, setMode]           = useState<'Deposit' | 'Withdraw'>('Deposit')
  const [network, setNetwork]     = useState('Arbitrum One')
  const [amount, setAmount]       = useState('25,000.00')
  const [activePreset, setPreset] = useState('50%')
  const [loading, setLoading]     = useState(false)
  const [netOpen, setNetOpen]     = useState(false)

  const walletBal   = 84_210
  const currentBal  = 41_588
  const amountNum   = parseFloat(amount.replace(/,/g, '')) || 0
  const newBalance  = mode === 'Deposit'
    ? (currentBal + amountNum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (currentBal - amountNum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const submit = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1200)
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Funding</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Deposits credit your cross-margin balance instantly. Withdrawals settle to your wallet.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-tertiary)' }}>
          <span>Portfolio</span><span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Funding</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20, padding: 24, overflow: 'hidden' }}>

        {/* LEFT — Transfer ticket */}
        <div style={{ flex: '0 0 540px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Transfer Funds</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
            {/* Mode toggle */}
            <div style={{ display: 'flex', height: 38, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 3, gap: 3 }}>
              {(['Deposit', 'Withdraw'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1, borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: mode === m ? 'var(--surface-raised)' : 'transparent',
                    color: mode === m ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    border: 'none', transition: 'all 120ms',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* From Network */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>
                {mode === 'Deposit' ? 'From Network' : 'To Network'}
              </span>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setNetOpen(v => !v)}
                  style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}
                >
                  <span>{network}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {netOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setNetOpen(false)} />
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 6, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
                      {NETWORKS.map(n => (
                        <button
                          key={n}
                          onClick={() => { setNetwork(n); setNetOpen(false) }}
                          style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 600, color: n === network ? 'var(--accent)' : 'var(--text-secondary)', background: n === network ? 'var(--accent-tint)' : 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Asset */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Asset</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#2775CA,#1a4f8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff' }}>$</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>USDC</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>USD Coin · the only collateral on LNYQ</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-tertiary)' }}>
                  Wallet · {walletBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Amount</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  {mode === 'Deposit' ? 'Wallet balance' : 'Available'} · {mode === 'Deposit' ? '84,210.00' : '41,588.00'} USDC
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border-accent)', borderRadius: 6, boxShadow: '0 0 0 3px var(--accent-tint)' }}>
                <input
                  type="text"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>USDC</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {AMOUNT_PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    style={{
                      flex: 1, textAlign: 'center', padding: '7px 0', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                      color: activePreset === p ? '#fff' : 'var(--text-tertiary)',
                      background: activePreset === p ? 'var(--accent-tint)' : 'var(--surface-3)',
                      border: `1px solid ${activePreset === p ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Network Fee</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>0.00 USDC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Estimated Arrival</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>~30 sec</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>New Order Book Balance</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{newBalance} USDC</span>
              </div>
            </div>

            {/* You'll receive */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>You'll Receive</span>
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: mode === 'Deposit' ? 'var(--up-500)' : 'var(--text-primary)' }}>
                {mode === 'Deposit' ? '+' : '-'}{amount} USDC
              </span>
            </div>

            {/* Submit */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={submit}
                disabled={loading}
                style={{
                  height: 46, borderRadius: 6, fontSize: 14, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
                  background: 'var(--accent)', color: '#fff', border: 'none', opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Processing...' : `${mode} USDC`}
              </button>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                Funds are held non-custodially in your LNYQ margin account. Withdraw anytime.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT — Stats + History */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats grid */}
          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{s.label}</span>
                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: s.green ? 'var(--up-500)' : '#fff' }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Transfer History */}
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Transfer History</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Last 30 days</span>
            </div>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.1fr 1.2fr 1.1fr 0.9fr', padding: '11px 20px', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
              {['Type', 'Network', 'Amount (USDC)', 'Date', 'Tx Hash', 'Status'].map((h, i) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i > 1 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {TRANSFERS.map((t, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.1fr 1.2fr 1.1fr 0.9fr', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.dirColor, flexShrink: 0 }} />
                    {t.type}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.net}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: t.amtColor }}>{t.amount}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textAlign: 'right' }}>{t.time}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textAlign: 'right' }}>{t.hash}</span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: t.statusColor === '#2EBD85' ? 'rgba(46,189,133,0.14)' : 'rgba(240,165,0,0.14)', color: t.statusColor }}>
                      {t.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
