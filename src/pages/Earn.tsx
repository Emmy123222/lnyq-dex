import { useState } from 'react'

const EARN_PRODUCTS = [
  {
    name: 'Flexible USDC', tag: 'FLEXIBLE', tagColor: '#2EBD85', tagBg: 'rgba(46,189,133,0.14)',
    desc: 'Withdraw anytime · interest accrues every block',
    apy: '8.2%', tvl: '$42.1M', min: 'None',
    featured: true,
  },
  {
    name: '30-Day Fixed USDC', tag: '30D LOCK', tagColor: '#A051FC', tagBg: 'var(--accent-tint)',
    desc: 'Fixed rate locked at deposit time · no early exit',
    apy: '10.8%', tvl: '$18.6M', min: '1,000 USDC',
    featured: false,
  },
  {
    name: '90-Day Fixed USDC', tag: '90D LOCK', tagColor: '#F0A500', tagBg: 'rgba(240,165,0,0.14)',
    desc: 'Highest fixed rate · 90-day term, paid at maturity',
    apy: '13.4%', tvl: '$23.3M', min: '5,000 USDC',
    featured: false,
  },
]

export default function Earn() {
  const [amount, setAmount] = useState('10,000.00')
  const [loading, setLoading] = useState(false)

  const submit = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Earn</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Put idle USDC to work. Yield is funded by margin interest from the LNYQ order book.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Total Earning</span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: '#fff' }}>38,000.00</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Lifetime Interest</span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)' }}>+2,104.60</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20, padding: 24, overflow: 'hidden' }}>

        {/* LEFT — featured flexible account */}
        <div style={{ flex: 1, minWidth: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 46, height: 46, borderRadius: 11, background: 'linear-gradient(135deg,#2775CA,#1a4f8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>$</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Flexible USDC</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(46,189,133,0.14)', color: '#2EBD85' }}>FLEXIBLE</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Withdraw anytime · interest accrues every block</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Current APY</span>
              <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)' }}>8.2%</span>
            </div>
          </div>

          {/* Chart placeholder */}
          <div style={{ flex: 1, minHeight: 0, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(46,189,133,0.12) 0%, rgba(46,189,133,0) 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Interest accrual chart</span>
            </div>
          </div>

          {/* Balance stats */}
          <div style={{ flexShrink: 0, padding: '0 24px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { label: 'Your Balance', value: '28,000.00', green: false },
              { label: 'Earned Today', value: '+6.29',     green: true },
              { label: 'Total Earned', value: '+1,284.40', green: true },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.label}</span>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: s.green ? 'var(--up-500)' : '#fff' }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Action row */}
          <div style={{ flexShrink: 0, padding: '18px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: 44, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
              <input type="text" value={amount} onChange={e => setAmount(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }} />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6, flexShrink: 0 }}>USDC</span>
            </div>
            <button onClick={submit} disabled={loading} style={{ height: 44, padding: '0 18px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'var(--accent)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Adding...' : 'Add Funds'}
            </button>
            <button style={{ height: 44, padding: '0 18px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Withdraw
            </button>
          </div>
        </div>

        {/* RIGHT — all earn products */}
        <div style={{ flex: '0 0 440px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>All Earn Products</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>3 available</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '8px 0' }}>
            {EARN_PRODUCTS.map((e, i) => (
              <div key={i} style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{e.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: e.tagBg, color: e.tagColor }}>{e.tag}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{e.desc}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)' }}>{e.apy}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>APY</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', gap: 28 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>TVL</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>{e.tvl}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Minimum</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{e.min}</span>
                    </div>
                  </div>
                  <button style={{ height: 30, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Earn
                  </button>
                </div>
              </div>
            ))}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>HOW YIELD IS GENERATED</span>
              <span style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                Deposited USDC is lent to margin traders on the LNYQ order book. Rates float with borrow demand; fixed terms lock a rate for the period. Principal is protected by the insurance fund.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
