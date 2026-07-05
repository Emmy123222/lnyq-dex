import { useState } from 'react'

const ORACLE_OPTS = ['Pyth Network', 'Chainlink', 'Redstone', 'TWAP (on-chain)']
const LEV_OPTS    = ['5x', '10x', '20x', '50x']
const TICK_OPTS   = ['0.10', '0.50', '1.00', '5.00']

const REQUIREMENTS = [
  { done: true,  label: 'Contract verified',   desc: 'PudgyPenguins ERC-721 on Arbitrum One — checksums match.' },
  { done: true,  label: 'Oracle available',    desc: 'Pyth Network has a verified price feed for this collection.' },
  { done: true,  label: 'Seed liquidity set',  desc: '25,000.00 USDC allocated as initial depth.' },
  { done: false, label: 'Listing fee payment', desc: '500.00 USDC required to cover deployment gas and insurance fund.' },
]

export default function ListMarket() {
  const [contract,    setContract]    = useState('0x9c3f7a21Ee04bd9F88...c4A1')
  const [marketType,  setMarketType]  = useState<'Perpetual' | 'Spot'>('Perpetual')
  const [oracle,      setOracle]      = useState('Pyth Network')
  const [maxLev,      setMaxLev]      = useState('20x')
  const [tickSize,    setTickSize]    = useState('0.50')
  const [seedLiq,     setSeedLiq]     = useState('25,000.00')
  const [oiCap,       setOiCap]       = useState(false)
  const [oracleOpen,  setOracleOpen]  = useState(false)
  const [levOpen,     setLevOpen]     = useState(false)
  const [tickOpen,    setTickOpen]    = useState(false)
  const [loading,     setLoading]     = useState(false)

  const deploy = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  function Dropdown({ value, options, open, onOpen, onSelect }: { value: string; options: string[]; open: boolean; onOpen: () => void; onSelect: (v: string) => void }) {
    return (
      <div style={{ position: 'relative' }}>
        <button onClick={onOpen} style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
          <span>{value}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={onOpen} />
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 6, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
              {options.map(o => (
                <button key={o} onClick={() => onSelect(o)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 600, color: o === value ? 'var(--accent)' : 'var(--text-secondary)', background: o === value ? 'var(--accent-tint)' : 'transparent', border: 'none', cursor: 'pointer' }}>{o}</button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>List a Market</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Point LNYQ at any contract and open a central limit order book in minutes.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-tertiary)' }}>
          <span>Markets</span><span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>New Listing</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20, padding: 24, overflow: 'hidden' }}>

        {/* LEFT — form */}
        <div style={{ flex: 1, minWidth: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Market Configuration</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Contract */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Asset Contract</span>
              <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <input
                  type="text"
                  value={contract}
                  onChange={e => setContract(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--up-500)' }}>✓ Verified · PudgyPenguins (PPG) on Arbitrum One</span>
            </div>

            {/* Type + Quote */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Market Type</span>
                <div style={{ display: 'flex', height: 42, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 3, gap: 3 }}>
                  {(['Perpetual', 'Spot'] as const).map(t => (
                    <button key={t} onClick={() => setMarketType(t)} style={{ flex: 1, borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: marketType === t ? 'var(--surface-raised)' : 'transparent', color: marketType === t ? 'var(--text-primary)' : 'var(--text-tertiary)', border: 'none' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Quote Asset</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#2775CA,#1a4f8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>$</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>USDC</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>Fixed</span>
                </div>
              </div>
            </div>

            {/* Oracle + Max Leverage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Oracle Source</span>
                <Dropdown value={oracle} options={ORACLE_OPTS} open={oracleOpen} onOpen={() => setOracleOpen(v => !v)} onSelect={v => { setOracle(v); setOracleOpen(false) }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Max Leverage</span>
                <Dropdown value={maxLev} options={LEV_OPTS} open={levOpen} onOpen={() => setLevOpen(v => !v)} onSelect={v => { setMaxLev(v); setLevOpen(false) }} />
              </div>
            </div>

            {/* Tick + Seed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Tick Size (USDC)</span>
                <Dropdown value={tickSize} options={TICK_OPTS} open={tickOpen} onOpen={() => setTickOpen(v => !v)} onSelect={v => { setTickSize(v); setTickOpen(false) }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>Seed Liquidity</span>
                <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <input type="text" value={seedLiq} onChange={e => setSeedLiq(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6, flexShrink: 0 }}>USDC</span>
                </div>
              </div>
            </div>

            {/* OI Cap toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Open Interest Cap</span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Auto-scales with book depth · enable manual cap</span>
              </div>
              <button
                onClick={() => setOiCap(v => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                  background: oiCap ? 'var(--accent)' : 'var(--surface-3)',
                  transition: 'background 200ms',
                }}
              >
                <span style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 200ms', left: oiCap ? 22 : 2 }} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — preview + checklist */}
        <div style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>
          {/* Preview */}
          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>MARKET PREVIEW</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 48, height: 48, borderRadius: 11, background: 'linear-gradient(135deg,#3A8DFF,#1456b0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>P</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 19, fontWeight: 800, color: '#fff' }}>PPG - USDC</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(160,81,252,0.12)', color: '#A051FC' }}>PERP · {maxLev}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>PudgyPenguins · pixel collection</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
              {[
                { label: 'Oracle',          value: oracle },
                { label: 'Tick Size',       value: `${tickSize} USDC` },
                { label: 'Initial Margin',  value: maxLev === '5x' ? '20.0% (5x)' : maxLev === '10x' ? '10.0% (10x)' : maxLev === '20x' ? '5.0% (20x)' : '2.0% (50x)' },
                { label: 'Listing Fee',     value: '500.00 USDC' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements + deploy */}
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>LISTING REQUIREMENTS</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {REQUIREMENTS.map((req, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {req.done ? (
                    <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', background: 'var(--up-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--up-500)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  ) : (
                    <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', border: '2px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)' }} />
                    </span>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{req.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{req.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={deploy} disabled={loading} style={{ height: 46, borderRadius: 6, fontSize: 14, fontWeight: 900, background: 'var(--accent)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Deploying...' : 'Deploy Market'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>Deploying opens the order book immediately. Parameters are governed on-chain.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
