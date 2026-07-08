/**
 * Launchpad — initial distribution for new collections before CLOB listing.
 *
 * Phase 3 feature. Gated by VITE_ENABLE_PRESALE.
 * When PRESALE=false: shows page structure with "Coming in Phase 3" gate.
 * When PRESALE=true: shows live presale listings.
 *
 * Protocol fee: 10–20% of presale proceeds (non-negotiable).
 * Settlement: USDC only.
 *
 * SCOPE: Display and registration only. No onchain settlement here.
 * Actual allocation execution is backend responsibility.
 */

import { useState } from 'react'
import { FLAGS } from '../config/featureFlags'

interface PresaleListing {
  id: string
  collection: string
  symbol: string
  status: 'upcoming' | 'active' | 'ended'
  supply: number
  allocationPrice: string    // USDC per NFT
  raiseTarget: string        // USDC
  raised: string             // USDC raised so far
  allocationRemaining: number // NFTs
  startDate: string
  endDate: string
  description: string
  protocolFee: string        // e.g. "15%"
}

const MOCK_LISTINGS: PresaleListing[] = [
  {
    id: 'lnyqnft-s2',
    collection: 'LNYQ NFT Series 2',
    symbol: 'LNYQNFT2',
    status: 'upcoming',
    supply: 5000,
    allocationPrice: '750.00',
    raiseTarget: '3750000',
    raised: '0',
    allocationRemaining: 5000,
    startDate: '2026-08-01',
    endDate: '2026-08-14',
    description: 'Second series of the LNYQ NFT collection. Allocations are distributed by CLOB trade volume from Phase 1 testnet participation.',
    protocolFee: '15%',
  },
  {
    id: 'thegooman-og',
    collection: 'The Gooman OG',
    symbol: 'TGOOG',
    status: 'upcoming',
    supply: 2222,
    allocationPrice: '1200.00',
    raiseTarget: '2666400',
    raised: '0',
    allocationRemaining: 2222,
    startDate: '2026-08-15',
    endDate: '2026-08-22',
    description: 'OG collection for early Gooman holders. Presale is allocation-based with a fixed price. CLOB listing follows presale close.',
    protocolFee: '12%',
  },
]

function fmt(n: number, dec = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function fmtUsdc(s: string) {
  const n = parseFloat(s)
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(2)}`
}

function ProgressBar({ raised, target }: { raised: string; target: string }) {
  const pct = Math.min(100, (parseFloat(raised) / parseFloat(target)) * 100)
  return (
    <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 400ms ease' }} />
    </div>
  )
}

function StatusBadge({ status }: { status: PresaleListing['status'] }) {
  const map = {
    upcoming: { label: 'Upcoming',  bg: 'rgba(240,165,0,0.12)', color: '#F0A500', border: 'rgba(240,165,0,0.3)' },
    active:   { label: 'Active',    bg: 'rgba(46,189,133,0.12)', color: '#2EBD85', border: 'rgba(46,189,133,0.3)' },
    ended:    { label: 'Ended',     bg: 'var(--surface-2)', color: 'var(--text-tertiary)', border: 'var(--border)' },
  }
  const s = map[status]
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  )
}

function ListingCard({ listing }: { listing: PresaleListing }) {
  const [registered, setRegistered] = useState(false)
  const pct = Math.min(100, (parseFloat(listing.raised) / parseFloat(listing.raiseTarget)) * 100)

  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{listing.collection}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{listing.symbol} · Supply {fmt(listing.supply)} NFTs</div>
          </div>
          <StatusBadge status={listing.status} />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{listing.description}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '14px 20px', gap: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        {[
          { label: 'Allocation price', value: `${listing.allocationPrice} USDC` },
          { label: 'Raise target',     value: fmtUsdc(listing.raiseTarget) },
          { label: 'Remaining',        value: `${fmt(listing.allocationRemaining)} NFTs` },
          { label: 'Protocol fee',     value: listing.protocolFee },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Raised</span>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtUsdc(listing.raised)} / {fmtUsdc(listing.raiseTarget)} ({pct.toFixed(1)}%)
          </span>
        </div>
        <ProgressBar raised={listing.raised} target={listing.raiseTarget} />
      </div>

      {/* Timeline + CTA */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {listing.status === 'upcoming' ? 'Opens' : listing.status === 'active' ? 'Closes' : 'Closed'}&nbsp;
            {listing.status === 'ended' ? listing.endDate : listing.status === 'active' ? listing.endDate : listing.startDate}
          </span>
        </div>
        <button
          onClick={() => setRegistered(true)}
          disabled={listing.status === 'ended' || registered}
          style={{
            height: 36, padding: '0 18px', borderRadius: 6, fontSize: 13, fontWeight: 700,
            background: registered ? 'var(--surface-2)' : 'var(--accent)',
            color: registered ? 'var(--up-500)' : '#fff',
            border: registered ? '1px solid var(--up-500)' : 'none',
            cursor: listing.status === 'ended' || registered ? 'not-allowed' : 'pointer',
            opacity: listing.status === 'ended' ? 0.5 : 1,
          }}
        >
          {registered ? 'Interest registered' : listing.status === 'active' ? 'Participate' : 'Register interest'}
        </button>
      </div>
    </div>
  )
}

const FILTER_TABS = ['All', 'Upcoming', 'Active', 'Ended'] as const
type FilterTab = typeof FILTER_TABS[number]

export default function Launchpad() {
  const [filter, setFilter] = useState<FilterTab>('All')

  const displayed = MOCK_LISTINGS.filter(l =>
    filter === 'All' ? true : l.status === filter.toLowerCase()
  )

  return (
    <div style={{ padding: '26px 24px 40px', overflowY: 'auto', minHeight: 0 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Launchpad</span>
          {!FLAGS.PRESALE && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(240,165,0,0.12)', color: '#F0A500', border: '1px solid rgba(240,165,0,0.3)' }}>
              Coming in Phase 3
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 560, lineHeight: 1.6 }}>
          Initial distributions for new collections before CLOB listing. Fixed allocation price in USDC. Protocol fee: 10–20% of proceeds.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
        {FILTER_TABS.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{ height: 36, padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: filter === t ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: filter === t ? '2px solid var(--accent)' : '2px solid transparent', background: 'transparent', border: 'none' }}
          >
            {t}
          </button>
        ))}
      </div>

      {!FLAGS.PRESALE ? (
        /* Phase 3 gate overlay on listing content */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
          <div style={{ filter: 'blur(3px)', pointerEvents: 'none', opacity: 0.4 }}>
            {MOCK_LISTINGS.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '32px 40px', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(160,81,252,0.12)', border: '1px solid rgba(160,81,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Launchpad opens in Phase 3</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 320, lineHeight: 1.6 }}>
                Presale mechanics go live with cross-chain USDC settlement. Complete Phase 1 testnet trading to qualify for early access.
              </div>
            </div>
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
          No {filter.toLowerCase()} presales at this time.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayed.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  )
}
