import { useState, useEffect } from 'react'
import { marketService } from '../services/marketService'
import { FLAGS } from '../config/featureFlags'
import type { Market } from '../types'

const SPOT_CONDITIONS  = ['Price above', 'Price below']
const PERP_CONDITIONS  = ['Funding above', 'Funding below', 'Liquidation warning']
const CONDITIONS = FLAGS.PERPS ? [...SPOT_CONDITIONS, ...PERP_CONDITIONS] : SPOT_CONDITIONS

export default function Alerts() {
  const [markets,   setMarkets]   = useState<Market[]>([])
  const [market,    setMarket]    = useState('')
  const [condition, setCond]      = useState('Price above')
  const [target,    setTarget]    = useState('')
  const [condOpen,  setCondOpen]  = useState(false)
  const [pairOpen,  setPairOpen]  = useState(false)

  useEffect(() => {
    marketService.listMarkets().then(res => {
      if (res.ok && res.data.length > 0) {
        setMarkets(res.data)
        setMarket(res.data[0].id)
      }
    })
  }, [])

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Alerts &amp; Notifications</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Get notified on price and liquidation events across your watched markets.</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20, padding: 24, overflow: 'hidden' }}>

        {/* LEFT */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Create alert */}
          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Create Alert</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>

              {/* Market select */}
              <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Market</span>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setPairOpen(v => !v)}
                    disabled={markets.length === 0}
                    style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, cursor: markets.length > 0 ? 'pointer' : 'default', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}
                  >
                    <span>{markets.length === 0 ? 'Loading markets…' : (markets.find(m => m.id === market)?.displayName ?? market)}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {pairOpen && markets.length > 0 && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setPairOpen(false)} />
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 6, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
                        {markets.map(m => (
                          <button key={m.id} onClick={() => { setMarket(m.id); setPairOpen(false) }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 600, color: m.id === market ? 'var(--accent)' : 'var(--text-secondary)', background: m.id === market ? 'var(--accent-tint)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                            {m.displayName}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Condition select */}
              <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 7 }}>
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
              <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Target price (USDC)</span>
                <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <input
                    type="number"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    placeholder="0.00"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                  />
                </div>
              </div>

              <button
                disabled={!target || !market}
                style={{ height: 42, padding: '0 18px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: target && market ? 'var(--accent)' : 'var(--surface-3)', color: target && market ? '#fff' : 'var(--text-tertiary)', border: 'none', cursor: target && market ? 'pointer' : 'default', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Add Alert
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              Alert delivery backend not yet connected. Alerts will be saved locally until configured.
            </p>
          </div>

          {/* Active alerts — empty state */}
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Active Alerts</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>0 configured</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No alerts configured. Add one above.</span>
            </div>
          </div>
        </div>

        {/* RIGHT — activity feed empty state */}
        <div style={{ flex: '0 0 420px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Activity Feed</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No recent activity.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
