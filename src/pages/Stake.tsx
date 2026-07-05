import { useState } from 'react'

const FEE_TIERS = [
  { tier: 'Starter',   vol: '< $100K',  stake: '0',          maker: '0.08%', taker: '0.12%', you: false, nameColor: 'var(--text-secondary)', rowBg: 'transparent' },
  { tier: 'Maker',     vol: '> $100K',  stake: '1,000',      maker: '0.05%', taker: '0.10%', you: false, nameColor: 'var(--text-secondary)', rowBg: 'transparent' },
  { tier: 'Builder',   vol: '> $500K',  stake: '10,000',     maker: '0.03%', taker: '0.08%', you: false, nameColor: 'var(--text-secondary)', rowBg: 'transparent' },
  { tier: 'Pro',       vol: '> $2M',    stake: '25,000',     maker: '0.02%', taker: '0.06%', you: true,  nameColor: '#A051FC',              rowBg: 'rgba(160,81,252,0.06)' },
  { tier: 'Architect', vol: '> $10M',   stake: '100,000',    maker: '0.00%', taker: '0.04%', you: false, nameColor: 'var(--text-secondary)', rowBg: 'transparent' },
]

const PROPOSALS = [
  { id: 'LIP-024', title: 'Increase max leverage on blue-chip NFT markets to 30×', status: 'Live',   statusColor: '#2EBD85',  bg: 'rgba(46,189,133,0.14)',  forPct: '72%', ends: 'Ends Jul 8',  forWidth: '72%', barColor: 'var(--up-500)' },
  { id: 'LIP-023', title: 'Reduce taker fee on SPOT markets from 0.10% to 0.08%', status: 'Passed', statusColor: '#A051FC',  bg: 'var(--accent-tint)',     forPct: '88%', ends: 'Passed',      forWidth: '88%', barColor: 'var(--accent)' },
  { id: 'LIP-022', title: 'Allocate 5% of protocol fees to insurance fund monthly', status: 'Passed', statusColor: '#A051FC', bg: 'var(--accent-tint)',     forPct: '91%', ends: 'Passed',      forWidth: '91%', barColor: 'var(--accent)' },
  { id: 'LIP-021', title: 'Add PUDGYPENGUINS-USDC perpetual market (20× leverage)', status: 'Failed', statusColor: '#F6465D', bg: 'rgba(246,70,93,0.12)',   forPct: '38%', ends: 'Failed',      forWidth: '38%', barColor: 'var(--down-500)' },
]

export default function Stake() {
  const [stakeMode, setStakeMode] = useState<'Stake' | 'Unstake'>('Stake')
  const [amount, setAmount]       = useState('32,000')
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
          <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Stake LNYQ</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Staked LNYQ lowers your trading fees and grants one vote per token on protocol proposals.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>LNYQ Price</span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: '#fff' }}>$1.84</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Staking APR</span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)' }}>14.2%</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20, padding: 24, overflow: 'hidden' }}>

        {/* LEFT — stake card + fee tiers */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stake card */}
          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '22px 24px', display: 'flex', gap: 28 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', height: 38, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 3, gap: 3 }}>
                {(['Stake', 'Unstake'] as const).map(m => (
                  <button key={m} onClick={() => setStakeMode(m)} style={{ flex: 1, borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: stakeMode === m ? 'var(--surface-raised)' : 'transparent', color: stakeMode === m ? 'var(--text-primary)' : 'var(--text-tertiary)', border: 'none' }}>
                    {m}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Amount to Stake</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>Balance · 68,400 LNYQ</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <input type="text" value={amount} onChange={e => setAmount(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6, flexShrink: 0 }}>LNYQ</span>
                </div>
              </div>
              <button onClick={submit} disabled={loading} style={{ height: 46, borderRadius: 6, fontSize: 14, fontWeight: 900, background: 'var(--accent)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Processing...' : `${stakeMode} LNYQ`}
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 13, paddingLeft: 28, borderLeft: '1px solid var(--border-subtle)' }}>
              {[
                { label: 'Currently Staked',  value: '28,000 LNYQ',    color: 'var(--text-primary)' },
                { label: 'Voting Power',       value: '28,000 votes',   color: 'var(--text-primary)' },
                { label: 'Pending Rewards',    value: '+412.80 LNYQ',   color: 'var(--up-500)' },
                { label: 'Unstake Cooldown',   value: '7 days',         color: 'var(--text-secondary)' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: r.color }}>{r.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                <button style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Claim 412.80 LNYQ
                </button>
              </div>
            </div>
          </div>

          {/* Fee tiers */}
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Fee Tiers</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Based on staked LNYQ or 30d volume</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.4fr 1fr 1fr', padding: '11px 20px', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
              {[['Tier','left'],['30d Volume','left'],['Staked LNYQ','right'],['Maker','right'],['Taker','right']].map(([h, align]) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: align as 'left'|'right' }}>{h}</span>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {FEE_TIERS.map((t, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.4fr 1fr 1fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', background: t.rowBg }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: t.nameColor }}>
                    {t.tier}
                    {t.you && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-tint)', padding: '2px 7px', borderRadius: 999, letterSpacing: '0.04em' }}>YOU</span>}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.vol}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', textAlign: 'right' }}>{t.stake}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', textAlign: 'right' }}>{t.maker}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', textAlign: 'right' }}>{t.taker}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — governance */}
        <div style={{ flex: '0 0 440px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Governance</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--accent-tint)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>1 LIVE</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '8px 0' }}>
            {PROPOSALS.map((p, i) => (
              <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{p.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>{p.title}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: p.bg, color: p.statusColor, flexShrink: 0 }}>{p.status}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.forPct} For</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.ends}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <div style={{ width: p.forWidth, height: '100%', background: p.barColor, borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flexShrink: 0, padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
            <button style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              View All Proposals
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
