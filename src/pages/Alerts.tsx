import { useState } from 'react'

const CONDITIONS = ['Price above', 'Price below', 'Funding above', 'Funding below', 'Liquidation warning']

const ALERTS_DATA = [
  { pair: 'LNYQNFT-USDC',   cond: 'Price above',  condColor: 'var(--up-500)',   target: '2,500.00', cur: '2,456.00', dist: '+44.00 (1.8%)',  status: 'Watching', statusColor: '#A051FC' },
  { pair: 'LNYQNFT-USDC',   cond: 'Price below',  condColor: 'var(--down-400)', target: '2,200.00', cur: '2,456.00', dist: '-256.00 (10.4%)', status: 'Watching', statusColor: '#A051FC' },
  { pair: 'THEGOOMAN-USDC', cond: 'Price above',  condColor: 'var(--up-500)',   target: '1,000.00', cur: '948.00',  dist: '+52.00 (5.5%)',  status: 'Watching', statusColor: '#A051FC' },
  { pair: 'LNYQNFT-USDC',   cond: 'Funding above', condColor: 'var(--up-500)',  target: '0.05%',   cur: '0.013%', dist: '+0.037%',         status: 'Watching', statusColor: '#A051FC' },
  { pair: 'THEGOOMAN-USDC', cond: 'Price below',  condColor: 'var(--down-400)', target: '900.00',  cur: '948.00', dist: '-48.00 (5.1%)',   status: 'Triggered', statusColor: '#2EBD85' },
]

const FEED_DATA = [
  { title: 'Price Alert Triggered',         desc: 'THEGOOMAN-USDC spot touched 900.00 USDC — your alert was fired.',         time: '2 min ago',  color: '#F6465D', bg: 'rgba(246,70,93,0.12)' },
  { title: 'Order Filled',                  desc: 'Buy limit 5× LNYQNFT @ 2,340.00 — fully filled at avg 2,339.20.',         time: '18 min ago', color: '#2EBD85', bg: 'rgba(46,189,133,0.12)' },
  { title: 'Funding Payment',               desc: 'Received +4.20 USDC funding on LNYQNFT-USDC PERP position.',               time: '1 hr ago',   color: '#A051FC', bg: 'rgba(160,81,252,0.12)' },
  { title: 'New Market Listed',             desc: 'PUDGYPENGUINS-USDC PERP is now live on LNYQ with 20× leverage.',           time: '3 hr ago',   color: '#3A8DFF', bg: 'rgba(58,141,255,0.12)' },
  { title: 'Margin Warning',                desc: 'Cross margin ratio on your account dropped to 6.4% — monitor positions.',  time: '5 hr ago',   color: '#F0A500', bg: 'rgba(240,165,0,0.12)' },
  { title: 'Order Partially Filled',        desc: 'Buy limit 5× LNYQNFT-USDC SPOT @ 2,440.00 — 2 of 5 NFTs filled.',        time: '6 hr ago',   color: '#2EBD85', bg: 'rgba(46,189,133,0.12)' },
  { title: 'Epoch 7 Rewards Claimable',     desc: '3,880.50 USDC from epoch 7 referral rewards is now claimable.',           time: '1 day ago',  color: '#A051FC', bg: 'rgba(160,81,252,0.12)' },
]

const PAIRS = ['LNYQNFT - USDC', 'THEGOOMAN - USDC']

export default function Alerts() {
  const [market, setMarket]     = useState('LNYQNFT - USDC')
  const [condition, setCond]    = useState('Price above')
  const [target, setTarget]     = useState('2,500.00')
  const [condOpen, setCondOpen] = useState(false)
  const [pairOpen, setPairOpen] = useState(false)

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Alerts &amp; Notifications</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Get notified on price, funding and liquidation events across your watched markets.</span>
        </div>
        <button style={{ height: 30, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          Mark All Read
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20, padding: 24, overflow: 'hidden' }}>

        {/* LEFT */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Create alert */}
          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Create Alert</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              {/* Market select */}
              <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Market</span>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setPairOpen(v => !v)} style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                    <span>{market}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {pairOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setPairOpen(false)} />
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 6, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
                        {PAIRS.map(p => (
                          <button key={p} onClick={() => { setMarket(p); setPairOpen(false) }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 600, color: p === market ? 'var(--accent)' : 'var(--text-secondary)', background: p === market ? 'var(--accent-tint)' : 'transparent', border: 'none', cursor: 'pointer' }}>{p}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Condition select */}
              <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Condition</span>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setCondOpen(v => !v)} style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                    <span>{condition}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {condOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setCondOpen(false)} />
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 6, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
                        {CONDITIONS.map(c => (
                          <button key={c} onClick={() => { setCond(c); setCondOpen(false) }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 600, color: c === condition ? 'var(--accent)' : 'var(--text-secondary)', background: c === condition ? 'var(--accent-tint)' : 'transparent', border: 'none', cursor: 'pointer' }}>{c}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Target */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Target</span>
                <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <input type="text" value={target} onChange={e => setTarget(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6, flexShrink: 0 }}>USDC</span>
                </div>
              </div>
              <button style={{ height: 42, padding: '0 18px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Add Alert
              </button>
            </div>
          </div>

          {/* Active alerts */}
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Active Alerts</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{ALERTS_DATA.length} configured</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1fr 1fr 1fr 0.8fr', padding: '11px 20px', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
              {[['Market','left'],['Condition','left'],['Target','right'],['Current','right'],['Distance','right'],['Status','right']].map(([h, align]) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: align as 'left'|'right' }}>{h}</span>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {ALERTS_DATA.map((a, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1fr 1fr 1fr 0.8fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{a.pair}</span>
                  <span style={{ fontSize: 13, color: a.condColor }}>{a.cond}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', textAlign: 'right' }}>{a.target}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', textAlign: 'right' }}>{a.cur}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-tertiary)', textAlign: 'right' }}>{a.dist}</span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${a.statusColor}22`, color: a.statusColor }}>{a.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — activity feed */}
        <div style={{ flex: '0 0 420px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Activity Feed</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-tint)', padding: '2px 8px', borderRadius: 999 }}>3 new</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {FEED_DATA.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 8, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: f.color }} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{f.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f.desc}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{f.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
