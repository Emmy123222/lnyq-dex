import { useState, useEffect } from 'react'
import { referralService } from '../services/referralService'
import { authService } from '../services/authService'
import type { ReferralInfo } from '../types'

const SWATCHES = ['#A051FC','#531C97','#2EBD85','#F0B90B','#F6465D','#26262E','#34343E','#4A4A56']

function initials(name: string) { return name.slice(0, 2).toUpperCase() }

function swatch(name: string) { return SWATCHES[name.charCodeAt(0) % SWATCHES.length] }

export default function Rewards() {
  const [info,    setInfo]    = useState<ReferralInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    const session = authService.loadSession()
    const token = session?.sessionToken ?? ''
    referralService.getMyReferral(token).then(res => {
      setLoading(false)
      if (res.ok) {
        setInfo(res.data)
      } else {
        setError(
          res.error.code === 'INTEGRATION_UNAVAILABLE'
            ? 'Referral data unavailable. Backend not configured.'
            : res.error.message,
        )
      }
    })
  }, [])

  const copy = () => {
    if (info) {
      navigator.clipboard.writeText(info.referralLink).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Loading referral data…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{error}</span>
      </div>
    )
  }

  if (!info) return null

  const fmtPts = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n)

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 20, padding: 24, overflow: 'auto' }}>

        {/* LEFT column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Hero stats */}
          <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            {[
              { label: 'Referral Points',   value: fmtPts(info.referralPoints),             color: 'var(--up-500)' },
              { label: 'Referred Traders',  value: String(info.referralCount),               color: 'var(--text-primary)' },
              { label: 'Referred Volume',   value: `$${parseFloat(info.referredVolume).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'var(--text-primary)' },
              { label: 'Tier',              value: info.tierName,                             color: 'var(--accent)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{s.label}</span>
                <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Referral link */}
          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Your Referral Link</span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Earn referral points for every trader you refer to the testnet.</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'var(--accent-tint)', border: '1px solid var(--accent)', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{info.tierName.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 16px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, gap: 12 }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info.referralLink}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.06em', flexShrink: 0 }}>CODE · {info.referralCode}</span>
              </div>
              <button onClick={copy} style={{ height: 46, padding: '0 18px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            {info.nextTierPoints !== undefined && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Progress to next tier</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>{fmtPts(info.referralPoints)} / {fmtPts(info.nextTierPoints)} pts</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (info.referralPoints / info.nextTierPoints) * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#6b3fa0,var(--accent))', borderRadius: 5 }} />
                </div>
              </div>
            )}
          </div>

          {/* Referred traders */}
          <div style={{ flex: 1, minHeight: 200, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Referred Traders</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{info.referralCount} total</span>
            </div>
            {info.referredUsers.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No referred traders yet. Share your link to get started.</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr 1fr 1.1fr 0.9fr', padding: '11px 20px', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Trader', 'Joined', 'Volume', 'Points Earned', 'Status'].map((h, i) => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: i > 0 ? 'right' : undefined }}>{h}</span>
                  ))}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  {info.referredUsers.map((r, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr 1fr 1.1fr 0.9fr', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 7, background: swatch(r.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{initials(r.username)}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{r.username}</span>
                      </span>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textAlign: 'right' }}>{r.joinedAt}</span>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', textAlign: 'right' }}>
                        {parseFloat(r.volume) > 0 ? `$${parseFloat(r.volume).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
                      </span>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--up-500)', textAlign: 'right' }}>{r.pointsEarned}</span>
                      <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: r.status === 'active' ? 'rgba(46,189,133,0.14)' : 'var(--surface-3)', color: r.status === 'active' ? '#2EBD85' : 'var(--text-tertiary)' }}>
                          {r.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>

          {/* Epochs — unavailable until backend provides endpoint */}
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Reward Epochs</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>14-day cycles</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '0 24px', lineHeight: 1.6 }}>
                Epoch rewards unavailable. Backend not configured.
              </span>
            </div>
          </div>

          {/* How it works */}
          <div style={{ flexShrink: 0, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>How It Works</span>
            {[
              'Share your link. Anyone who signs up through it is bound to your code permanently.',
              'Earn referral points for every trade they make on the testnet.',
              'Points convert to rewards when the protocol team announces the distribution schedule.',
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
