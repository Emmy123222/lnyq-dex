/**
 * DepositModal — Standard (on-chain) and Cross-chain USDC deposit.
 *
 * Standard tab: direct on-chain deposit (no bridge).
 * Cross-chain tab (Phase 3): routes USDC from Arbitrum/Ethereum/Base/Optimism
 * via Squid Router to Solana devnet. Gated by FLAGS.CROSS_CHAIN.
 *
 * CRITICAL: Cross-chain collectFees is NOT applied on BTC/Solana routes.
 * This is enforced in squidService — DepositModal must not override it.
 */

import { useState } from 'react'
import { FLAGS } from '../../config/featureFlags'
import { squidService, parseSquidBridgeFees } from '../../services/squidService'
import { authService } from '../../services/authService'
import type { SquidRouteResponse } from '../../types'

const SOURCE_CHAINS = ['Arbitrum', 'Ethereum', 'Base', 'Optimism', 'Polygon']

const CHAIN_ID: Record<string, number> = {
  Arbitrum: 42161,
  Ethereum: 1,
  Base:     8453,
  Optimism: 10,
  Polygon:  137,
}

const USDC_ON_CHAIN: Record<string, string> = {
  Arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  Ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  Base:     '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  Optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  Polygon:  '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
}

const SOLANA_CHAIN_ID = 1399811149
const SOLANA_USDC     = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const USDC_DECIMALS   = 6

interface DepositModalProps {
  onClose: () => void
}

type DepositTab = 'standard' | 'cross-chain'

// ── Shared subcomponents ──────────────────────────────────────────────────────

function DropdownSelect({
  label, value, options, onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}
        >
          <span>{value}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 6, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
              {options.map(o => (
                <button key={o} onClick={() => { onChange(o); setOpen(false) }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 600, color: o === value ? 'var(--accent)' : 'var(--text-secondary)', background: o === value ? 'var(--accent-tint)' : 'transparent', border: 'none', cursor: 'pointer' }}>{o}</button>
              ))}
            </div>
          </>
        )}
      </div>
    </label>
  )
}

function AmountField({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Amount</span>
      <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus={autoFocus}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6, flexShrink: 0 }}>USDC</span>
      </div>
    </label>
  )
}

// ── Standard deposit tab ──────────────────────────────────────────────────────

function StandardTab() {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(160,81,252,0.12)', border: '1px solid rgba(160,81,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Deposit integration unavailable</div>
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
        On-chain deposits require wallet integration. This feature will be available once the protocol team wires the wallet adapter.
      </div>
    </div>
  )
}

// ── Cross-chain tab ───────────────────────────────────────────────────────────

function CrossChainTab() {
  const [chain,       setChain]      = useState('Arbitrum')
  const [amount,      setAmount]     = useState('')
  const [quoting,    setQuoting]    = useState(false)
  const [route,       setRoute]      = useState<SquidRouteResponse | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  if (!FLAGS.CROSS_CHAIN) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Coming in Phase 3</div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Cross-chain USDC deposits will be available in Phase 3 via Squid Router.</div>
      </div>
    )
  }

  const session    = authService.loadSession()
  const toAddress  = session?.walletAddress ?? ''
  const amountNum  = parseFloat(amount) || 0
  const amountBase = String(Math.round(amountNum * 10 ** USDC_DECIMALS))

  const canQuote = amountNum > 0 && !!CHAIN_ID[chain]

  const getQuote = async () => {
    setQuoting(true); setRoute(null); setQuoteError(null)
    const res = await squidService.getRoute({
      fromChain:   CHAIN_ID[chain],
      fromToken:   USDC_ON_CHAIN[chain],
      fromAmount:  amountBase,
      toChain:     SOLANA_CHAIN_ID,
      toToken:     SOLANA_USDC,
      fromAddress: '0x0000000000000000000000000000000000000001',
      toAddress:   toAddress || '11111111111111111111111111111111',
    })
    if (res.ok) setRoute(res.data)
    else setQuoteError(res.error?.message ?? 'Failed to get route from Squid')
    setQuoting(false)
  }

  const bridgeFees  = route ? parseSquidBridgeFees(route.route.estimate.feeCosts) : []
  const totalFeeUsd = bridgeFees.reduce((s, f) => s + parseFloat(f.amountUSD ?? '0'), 0)
  const receiveMin  = route ? (parseFloat(route.route.estimate.toAmountMin) / 10 ** USDC_DECIMALS).toFixed(2) : null
  const duration    = route ? Math.ceil(route.route.estimate.estimatedRouteDuration / 60) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DropdownSelect label="Source Chain" value={chain} options={SOURCE_CHAINS}
        onChange={v => { setChain(v); setRoute(null); setQuoteError(null) }} />

      {/* Arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          USDC via Squid
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Destination</span>
        <div style={{ height: 42, display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Solana Devnet · LNYQ Account</span>
        </div>
      </div>

      <AmountField value={amount} onChange={v => { setAmount(v); setRoute(null); setQuoteError(null) }} autoFocus />

      {/* Real route estimate from Squid */}
      {route && (
        <div style={{ padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>Route from Squid Router</div>
          {[
            { label: 'Bridge fees',   value: totalFeeUsd > 0 ? `~$${totalFeeUsd.toFixed(2)}` : 'Included' },
            { label: 'Est. time',     value: duration != null ? `~${duration} min` : '—' },
            { label: 'You receive ≥', value: receiveMin != null ? `${receiveMin} USDC` : '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{row.label}</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Quote expires. Refresh before executing. Execution requires EVM wallet signing — available in Phase 3.
          </div>
        </div>
      )}

      {/* Error from Squid */}
      {quoteError && (
        <div style={{ padding: '10px 12px', background: 'rgba(246,70,93,0.08)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--down-400)', lineHeight: 1.5 }}>Route unavailable: {quoteError}</div>
        </div>
      )}

      {/* Get Quote */}
      <button
        onClick={getQuote}
        disabled={!canQuote || quoting}
        style={{ width: '100%', height: 46, borderRadius: 6, fontSize: 14, fontWeight: 900, background: route ? 'var(--surface-3)' : 'var(--accent)', color: route ? 'var(--text-secondary)' : '#fff', border: route ? '1px solid var(--border)' : 'none', cursor: !canQuote || quoting ? 'not-allowed' : 'pointer', opacity: !canQuote ? 0.65 : 1 }}
      >
        {quoting ? 'Getting quote…' : route ? 'Refresh quote' : 'Preview route'}
      </button>

      {/* Execute — requires real txHash; execution gated until Phase 3 wallet signing */}
      {route && (
        <button
          disabled
          style={{ width: '100%', height: 46, borderRadius: 6, fontSize: 14, fontWeight: 900, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'not-allowed', opacity: 0.45 }}
          title="EVM wallet signing required — available in Phase 3"
        >
          Execute bridge · Phase 3
        </button>
      )}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function DepositModal({ onClose }: DepositModalProps) {
  const [tab, setTab] = useState<DepositTab>('standard')

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--surface-modal)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 440, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 16, boxShadow: '0 30px 90px rgba(0,0,0,0.6)', overflow: 'hidden', position: 'relative' }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, zIndex: 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Header */}
        <div style={{ padding: '22px 24px 0', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>Deposit USDC</h2>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)' }}>Fund your account to start trading</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', margin: '18px 24px 0', height: 36, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 3 }}>
          {([
            { id: 'standard' as DepositTab,    label: 'Standard' },
            { id: 'cross-chain' as DepositTab, label: `Cross-chain${FLAGS.CROSS_CHAIN ? '' : ' · Phase 3'}` },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ flex: 1, borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: tab === t.id ? 'var(--accent)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-tertiary)', border: 'none', transition: 'all 120ms' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '18px 24px 24px' }}>
          {tab === 'standard'
            ? <StandardTab />
            : <CrossChainTab />
          }
        </div>
      </div>
    </div>
  )
}
