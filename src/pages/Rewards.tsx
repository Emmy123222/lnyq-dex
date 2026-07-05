import { useState } from 'react'

const HERO_STATS = [
  { label: 'Total Earned',      value: '$11,464.30', green: true },
  { label: 'Referred Traders',  value: '47' },
  { label: 'Referred Volume',   value: '$22.9M' },
  { label: 'This Epoch',        value: '+2,140.00', accent: true },
]

const REFERRALS = [
  { initials: 'AP', trader: 'alpha_prime',   joined: '2026-05-12', volume: '$4.28M', earned: '+$428.00',  status: 'Active',    statusColor: '#2EBD85' },
  { initials: 'BD', trader: 'bookdepth',     joined: '2026-05-18', volume: '$3.91M', earned: '+$391.00',  status: 'Active',    statusColor: '#2EBD85' },
  { initials: 'NM', trader: 'nft_macro',     joined: '2026-05-24', volume: '$2.12M', earned: '+$212.00',  status: 'Active',    statusColor: '#2EBD85' },
  { initials: 'CH', trader: 'clob_hunter',   joined: '2026-06-02', volume: '$1.40M', earned: '+$140.00',  status: 'Active',    statusColor: '#2EBD85' },
  { initials: 'SS', trader: 'spreadseller',  joined: '2026-06-10', volume: '$0.89M', earned: '+$89.00',   status: 'Active',    statusColor: '#2EBD85' },
  { initials: 'O9', trader: 'orderflow9',    joined: '2026-06-15', volume: '$0.64M', earned: '+$64.00',   status: 'Inactive',  statusColor: '#6B6B78' },
  { initials: 'LR', trader: 'liquidity_run', joined: '2026-06-22', volume: '$0.21M', earned: '+$21.00',   status: 'Active',    statusColor: '#2EBD85' },
]

const EPOCHS = [
  { label: 'Epoch 8 (Current)', range: 'Jul 1 – Jul 14, 2026',  reward: '+2,140.00',  state: 'Live',    color: '#2EBD85', bg: 'rgba(46,189,133,0.14)' },
  { label: 'Epoch 7',           range: 'Jun 17 – Jun 30, 2026', reward: '+3,880.50',  state: 'Claimable', color: '#A051FC', bg: 'var(--accent-tint)' },
  { label: 'Epoch 6',           range: 'Jun 3 – Jun 16, 2026',  reward: '+2,211.80',  state: 'Paid',    color: '#6B6B78', bg: 'transparent' },
  { label: 'Epoch 5',           range: 'May 20 – Jun 2, 2026',  reward: '+1,948.00',  state: 'Paid',    color: '#6B6B78', bg: 'transparent' },
  { label: 'Epoch 4',           range: 'May 6 – May 19, 2026',  reward: '+1,284.00',  state: 'Paid',    color: '#6B6B78', bg: 'transparent' },
]

export default function Rewards() {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header (no separate page header strip — rewards uses body directly) */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20, padding: 24, overflow: 'hidden' }}>

        {/* LEFT column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Hero stats */}
          <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {HERO_STATS.map(s => (
              <div key={s.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{s.label}</span>
                <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: s.green ? 'var(--up-500)' : s.accent ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Referral link + tier */}
          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Your Referral Link</span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Earn 10% of every referred trader's taker fees, paid in USDC each epoch.</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'var(--accent-tint)', border: '1px solid var(--accent)', color: 'var(--accent)', whiteSpace: 'nowrap' }}>TIER 3 · GOLD</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 16px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>lnyq.xyz/r/tunmise</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>CODE · TUNMISE</span>
              </div>
              <button onClick={copy} style={{ height: 46, padding: '0 18px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button style={{ height: 46, padding: '0 18px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                Share
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Progress to Tier 4 · Platinum <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>(15% fee share)</span>
                </span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>$22.9M / $30.0M</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: 'var(--surface-3)', overflow: 'hidden' }}>
                <div style={{ width: '76%', height: '100%', background: 'linear-gradient(90deg,#6b3fa0,var(--accent))', borderRadius: 5 }} />
              </div>
            </div>
          </div>

          {/* Referred traders */}
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Referred Traders</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>47 total · top earners</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr 1fr 1.1fr 0.9fr', padding: '11px 20px', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
              {[['Trader','left'],['Joined','right'],['Volume','right'],['You Earned','right'],['Status','right']].map(([h, align]) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: align as 'left'|'right' }}>{h}</span>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {REFERRALS.map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr 1fr 1.1fr 0.9fr', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#34343E,#0F0F12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{r.initials}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{r.trader}</span>
                  </span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textAlign: 'right' }}>{r.joined}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', textAlign: 'right' }}>{r.volume}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)', textAlign: 'right' }}>{r.earned}</span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: r.statusColor === '#2EBD85' ? 'rgba(46,189,133,0.14)' : 'var(--surface-3)', color: r.statusColor }}>
                      {r.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>
          {/* Epochs */}
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Reward Epochs</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>14-day cycles</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '8px 0' }}>
              {EPOCHS.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{e.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{e.range}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{e.reward}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: e.bg, color: e.color, border: e.state === 'Claimable' ? `1px solid ${e.color}` : 'none' }}>{e.state}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ flexShrink: 0, padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Claimable Now</span>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)' }}>3,880.50 USDC</span>
              </div>
              <button style={{ height: 38, padding: '0 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>Claim</button>
            </div>
          </div>

          {/* How it works */}
          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>How It Works</span>
            {[
              'Share your link. Anyone who signs up through it is bound to your code permanently.',
              'Earn a share of their taker fees — scaling from 10% to 15% as your referred volume grows.',
              'Claim rewards in USDC at the close of each 14-day epoch. No lockups, no vesting.',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 6, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>{i + 1}</span>
                <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
