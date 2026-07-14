export default function ListMarket() {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>List a Market</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(240,165,0,0.12)', color: '#F0A500', border: '1px solid rgba(240,165,0,0.3)' }}>
            Phase 1 · Team Whitelist Only
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Main card */}
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '32px 36px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(160,81,252,0.12)', border: '1px solid rgba(160,81,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Markets are whitelisted by the LNYQ team in Phase 1</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.7, marginBottom: 24 }}>
              During Phase 1, new spot CLOB markets are added manually by the LNYQ team after verifying the collection, configuring tick sizes, and seeding initial liquidity. Self-service listing opens in a future phase.
            </div>
            <a
              href="https://lnyq.xyz/list"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', height: 40, lineHeight: '40px', padding: '0 20px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}
            >
              Apply to list your collection
            </a>
          </div>

          {/* What happens card */}
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '22px 28px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 14, letterSpacing: '0.04em' }}>HOW LISTING WORKS IN PHASE 1</div>
            {[
              { n: '1', title: 'Apply', desc: 'Submit your collection contract address and contact details via the form above.' },
              { n: '2', title: 'Review', desc: 'The LNYQ team verifies the contract, checks oracle availability, and sets market parameters.' },
              { n: '3', title: 'Launch', desc: 'Your collection is listed as a spot CLOB market. Team seeds initial depth. Trading goes live.' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-tint)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: 'var(--accent)' }}>
                  {step.n}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
