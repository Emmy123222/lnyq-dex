import { useState } from 'react'

const VAULTS = [
  { initial: 'L', name: 'LNYQ Liquidity Vault',  strat: 'Delta-neutral market making',   apy: '18.4%', tvl: '$24.6M', capPct: 72, capColor: 'var(--accent)',   dep: '12,500.00', depColor: 'var(--text-primary)', swatch: 'linear-gradient(135deg,#A051FC,#531C97)' },
  { initial: 'P', name: 'Perps MM Vault',        strat: 'Perpetuals liquidity provision', apy: '14.2%', tvl: '$18.1M', capPct: 58, capColor: '#6b3fa0',        dep: '8,000.00',  depColor: 'var(--text-primary)', swatch: 'linear-gradient(135deg,#6b3fa0,#3a1870)' },
  { initial: 'S', name: 'Spot Arb Vault',        strat: 'Cross-venue spot arbitrage',     apy: '9.8%',  tvl: '$12.4M', capPct: 45, capColor: 'var(--up-500)',   dep: '—',         depColor: 'var(--text-tertiary)', swatch: 'linear-gradient(135deg,#2EBD85,#1a7a55)' },
  { initial: 'F', name: 'Fixed Yield USDC',      strat: '30-day locked, fixed 7.5%',     apy: '7.5%',  tvl: '$21.8M', capPct: 88, capColor: 'var(--down-400)', dep: '—',         depColor: 'var(--text-tertiary)', swatch: 'linear-gradient(135deg,#3A8DFF,#1456b0)' },
  { initial: 'I', name: 'Insurance Fund',        strat: 'Protocol backstop · 5% APR',    apy: '5.0%',  tvl: '$7.2M',  capPct: 30, capColor: 'var(--up-500)',   dep: '—',         depColor: 'var(--text-tertiary)', swatch: 'linear-gradient(135deg,#F0A500,#8a5e00)' },
]

export default function Vaults() {
  const [vaultMode, setVaultMode] = useState<'Deposit' | 'Withdraw'>('Deposit')
  const [amount, setAmount]       = useState('10,000.00')
  const [loading, setLoading]     = useState(false)

  const submit = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1200)
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Vaults</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Passive exposure to LNYQ's market-making and yield strategies. Withdraw at any epoch.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Total Value Locked</span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: '#fff' }}>$84.1M</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Your Deposits</span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: '#fff' }}>20,500.00</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>30d Earned</span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)' }}>+612.40</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20, padding: 24, overflow: 'hidden' }}>

        {/* LEFT — vault list */}
        <div style={{ flex: 1, minWidth: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>All Vaults</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>5 strategies live</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 0.9fr 1fr 1.4fr 1.1fr 0.9fr', padding: '11px 20px', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
            {[['Vault','left'],['APY','right'],['TVL','right'],['Capacity','right'],['Your Deposit','right'],['','right']].map(([h, align]) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: align as 'left'|'right' }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {VAULTS.map((v, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.4fr 0.9fr 1fr 1.4fr 1.1fr 0.9fr', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: v.swatch, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{v.initial}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.strat}</span>
                  </span>
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)', textAlign: 'right' }}>{v.apy}</span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', textAlign: 'right' }}>{v.tvl}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-tertiary)' }}>{v.capPct}%</span>
                  <span style={{ width: 84, height: 5, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden', display: 'block' }}>
                    <span style={{ display: 'block', width: `${v.capPct}%`, height: '100%', background: v.capColor }} />
                  </span>
                </span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: v.depColor }}>{v.dep}</span>
                <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ height: 30, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Deposit
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — featured vault */}
        <div style={{ flex: '0 0 400px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#A051FC,#531C97)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>L</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>LNYQ Liquidity Vault</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Featured · delta-neutral MM</span>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(46,189,133,0.14)', color: '#2EBD85' }}>LIVE</span>
            </div>
            {/* Placeholder chart area */}
            <div style={{ height: 80, background: 'var(--surface-2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>30d equity curve</span>
            </div>
            <div style={{ display: 'flex', gap: 0 }}>
              {[
                { label: 'APY (30d)',      value: '18.4%', green: true },
                { label: 'TVL',           value: '$24.6M', green: false },
                { label: 'Your Position', value: '12,500', green: false },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: s.green ? 'var(--up-500)' : '#fff' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', height: 38, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 3, gap: 3 }}>
              {(['Deposit', 'Withdraw'] as const).map(m => (
                <button key={m} onClick={() => setVaultMode(m)} style={{ flex: 1, borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: vaultMode === m ? 'var(--surface-raised)' : 'transparent', color: vaultMode === m ? 'var(--text-primary)' : 'var(--text-tertiary)', border: 'none' }}>
                  {m}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Amount</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>Available · 41,588.00</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <input
                  type="text"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>USDC</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              {[
                { label: 'Est. Annual Yield', value: '+1,840.00 USDC', green: true },
                { label: 'Lock-up',           value: 'None · epoch withdrawals', green: false },
                { label: 'Performance Fee',   value: '10%', green: false },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: r.green ? 'var(--up-500)' : 'var(--text-secondary)' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={submit} disabled={loading} style={{ height: 46, borderRadius: 6, fontSize: 14, fontWeight: 900, background: 'var(--accent)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Processing...' : `${vaultMode} to Vault`}
              </button>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>Vault shares are minted to your wallet and accrue value continuously.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
