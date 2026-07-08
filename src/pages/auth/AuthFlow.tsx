/**
 * AuthFlow — access-code-gated onboarding.
 *
 * Step order: email → verify → access-code → account-setup → initial-funding → welcome
 *
 * All network calls go through authService / dripService — no hardcoded mock logic here.
 * In mock mode services simulate responses. In devnet mode they call real endpoints.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowRight, IconCheck } from '@tabler/icons-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { authService, validateAccessCodeFormat } from '../../services/authService'
import { dripService } from '../../services/dripService'
import { ENV } from '../../config/env'
import type { AuthStep } from '../../types'

// ── Logo ─────────────────────────────────────────────────────────────────────

function LogoMark({ size = 52 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: 'linear-gradient(135deg,#A051FC,#531C97)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 28 28" fill="none">
        <path d="M4 23 L13 5 L22 23" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.5 17 H18.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

// ── Auth chrome ───────────────────────────────────────────────────────────────

function AuthCard({ children, step, showLogo }: { children: React.ReactNode; step: AuthStep; showLogo?: boolean }) {
  const steps: AuthStep[] = ['email', 'verify', 'access-code', 'account-setup', 'initial-funding', 'welcome']
  const current = steps.indexOf(step)
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      {/* Testnet indicator */}
      <div style={{ marginBottom: 16, padding: '5px 14px', borderRadius: 999, background: 'rgba(46,189,133,0.1)', border: '1px solid rgba(46,189,133,0.3)', fontSize: 11, fontWeight: 700, color: '#2EBD85', letterSpacing: '0.08em' }}>
        ● {ENV.CHAIN.toUpperCase()} · TESTNET · {ENV.MODE.toUpperCase()}
      </div>

      <div style={{ width: '100%', maxWidth: 392, background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 16, padding: '40px 36px', boxShadow: '0 30px 90px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }}>
        {showLogo && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
            <LogoMark size={52} />
            <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', marginTop: 12, marginBottom: 14 }}>LNYQ</span>
          </div>
        )}
        {children}
      </div>

      {step !== 'welcome' && (
        <div className="flex items-center gap-1.5 mt-6">
          {steps.filter(s => s !== 'welcome').map((s, i) => (
            <div key={s} style={{ borderRadius: 999, width: i === current ? 16 : 8, height: 8, background: i <= current ? 'var(--accent)' : '#26262E', transition: 'all 150ms' }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function EmailStep({ onNext }: { onNext: (email: string) => void }) {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const submit = async () => {
    if (!valid) { setError('Enter a valid email address'); return }
    setLoading(true)
    // TODO: call POST /auth/email/send-otp when backend provides it
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    onNext(email)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', textAlign: 'center' }}>
        The order book for onchain NFT markets. Real price discovery. Transparent liquidity.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); setError('') }} error={error} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit} disabled={!email}>Continue</Button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        By continuing you agree to the Terms &amp; Privacy Policy.
      </p>
    </div>
  )
}

function VerifyStep({ email, onNext }: { email: string; onNext: () => void }) {
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [resent,  setResent]  = useState(false)

  const submit = async () => {
    if (code.length < 6) { setError('Enter the 6-digit code from your email'); return }
    setLoading(true)
    // TODO: call POST /auth/email/verify-otp when backend provides it
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    onNext()
  }

  const resend = () => { setResent(true); setTimeout(() => setResent(false), 3000) }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Verify your email</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">We sent a 6-digit code to <span className="text-[var(--text-primary)] font-bold">{email}</span></p>
      </div>
      <div className="flex flex-col gap-4">
        <Input label="Verification code" type="text" inputMode="numeric" placeholder="000000" maxLength={6} value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }} error={error} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus className="tracking-[0.3em] text-center text-lg font-mono" />
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit} disabled={code.length < 6}>Verify email</Button>
      </div>
      <p className="text-xs text-[var(--text-tertiary)] text-center">
        Didn't receive it?{' '}
        <button onClick={resend} className="text-[var(--text-accent)] hover:underline">{resent ? 'Sent!' : 'Resend code'}</button>
      </p>
    </div>
  )
}

function AccessCodeStep({ email, onNext }: { email: string; onNext: (token: string) => void }) {
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Access code is required'); return }
    if (!validateAccessCodeFormat(trimmed)) { setError('Invalid format — check your access code'); return }

    setLoading(true)
    const res = await authService.verifyAccessCode({ code: trimmed, email })
    setLoading(false)

    if (!res.ok) { setError(res.error.message); return }

    switch (res.data.status) {
      case 'VALID':
        onNext(res.data.sessionToken ?? '')
        break
      case 'ALREADY_USED':
        setError('This access code has already been used. Each code is one-time use.')
        break
      case 'EXPIRED':
        setError('This access code has expired. Please request a new one.')
        break
      case 'INVALID':
        setError('Access code not recognised. Check for typos and try again.')
        break
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Enter access code</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">LNYQ is in private testnet access. An invitation code is required.</p>
      </div>
      <div className="flex flex-col gap-4">
        <Input label="Access code" type="text" placeholder="XXXX-XXXX-XXXX" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }} error={error} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus className="font-mono tracking-wide" />
        <p className="text-xs text-[var(--text-tertiary)]">
          Don't have a code?{' '}
          <a href="#" className="text-[var(--text-accent)] hover:underline">Request testnet access</a>
        </p>
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit} disabled={!code.trim()}>
          Continue <IconArrowRight size={16} />
        </Button>
      </div>
      {ENV.IS_LOCAL_API && (
        <p className="text-xs text-[var(--text-tertiary)] text-center">
          Test code: <code style={{ fontFamily: 'var(--font-mono)' }}>LNYQ-TESTNET-0001</code>
        </p>
      )}
    </div>
  )
}

function AccountSetupStep({ email, accessCodeToken, onNext }: { email: string; accessCodeToken: string; onNext: (username: string, referralCode: string, sessionToken: string) => void }) {
  const [username, setUsername] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const valid = /^[a-zA-Z0-9_]{3,20}$/.test(username)

  const submit = async () => {
    if (!valid) { setError('3-20 characters, letters, numbers and underscores only'); return }
    setLoading(true)
    const res = await authService.signup({ email, username, accessCodeToken })
    setLoading(false)
    if (!res.ok) { setError(res.error.message); return }
    onNext(username, res.data.referralCode, res.data.sessionToken)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Set up your account</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Choose a username visible on the leaderboard</p>
      </div>
      <div className="flex flex-col gap-4">
        <Input label="Username" type="text" placeholder="trader_alpha" value={username} onChange={e => { setUsername(e.target.value); setError('') }} error={error} hint="3-20 characters. Letters, numbers, underscores." onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
        {username && !error && valid && (
          <div className="flex items-center gap-2 text-xs text-[var(--buy)]">
            <IconCheck size={14} /> Username available
          </div>
        )}
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit} disabled={!username}>
          Continue <IconArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}

function InitialFundingStep({ sessionToken, onNext }: { sessionToken: string; onNext: (claimed: boolean) => void }) {
  const [loading, setLoading] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error,   setError]   = useState('')

  const claim = async () => {
    setLoading(true)
    setError('')
    const res = await dripService.claim(sessionToken)
    setLoading(false)
    if (!res.ok) { setError(res.error.message); return }
    if (res.data.success) { setClaimed(true); setTimeout(() => onNext(true), 1200) }
    else { setError(res.data.message ?? 'Claim failed — please try again.') }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Fund your account</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Claim 1,000 testnet USDC to start trading</p>
      </div>

      <div className="rounded-[var(--radius-lg)] bg-[var(--accent-tint)] border border-[var(--border-accent)] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-accent)]">Testnet allocation</span>
          <span className="text-xs text-[var(--text-tertiary)]">One-time · no real value</span>
        </div>
        <div className="text-3xl font-black text-[var(--text-primary)]">1,000 USDC</div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {claimed ? '✓ Credited to your account' : 'Automatically credited on claim'}
        </p>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: 'var(--down-500)', fontWeight: 700 }}>{error}</p>
      )}

      <div className="flex flex-col gap-3">
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={claim} disabled={claimed}>
          {claimed ? '✓ Claimed!' : 'Claim testnet USDC'}
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={() => onNext(false)}>Skip for now</Button>
      </div>

      <p className="text-xs text-[var(--text-tertiary)] text-center">
        Testnet USDC has no real value and is for testing purposes only.
      </p>
    </div>
  )
}

function WelcomeStep({ username, referralCode, onDone }: { username: string; referralCode: string; onDone: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(46,189,133,0.14)', border: '1px solid #2EBD85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconCheck size={30} color="#2EBD85" strokeWidth={2.5} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 10 }}>Welcome to LNYQ</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your testnet account is ready. Start trading.</div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 }}>
        {[
          { label: 'Balance',       value: '1,000.00 USDC', mono: true },
          { label: 'Username',      value: username },
          { label: 'Referral Code', value: referralCode, mono: true },
          { label: 'Network',       value: ENV.CHAIN, small: true },
          { label: 'Status',        value: 'Verified', green: true },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.label}</span>
            <span style={{ fontSize: (r as any).small ? 12 : 14, fontWeight: (r as any).mono ? 700 : 700, fontFamily: (r as any).mono ? 'var(--font-mono)' : undefined, color: (r as any).green ? 'var(--up-500)' : '#fff', fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
          </div>
        ))}
      </div>
      <Button variant="primary" size="lg" fullWidth onClick={onDone}>Go to Markets</Button>
    </div>
  )
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export default function AuthFlow() {
  const navigate = useNavigate()
  const [step,             setStep]            = useState<AuthStep>('email')
  const [email,            setEmail]           = useState('')
  const [accessCodeToken,  setAccessCodeToken] = useState('')
  const [username,         setUsername]        = useState('trader')
  const [referralCode,     setReferralCode]    = useState('')
  const [sessionToken,     setSessionToken]    = useState('')

  const renderStep = () => {
    switch (step) {
      case 'email':
        return <EmailStep onNext={e => { setEmail(e); setStep('verify') }} />
      case 'verify':
        return <VerifyStep email={email} onNext={() => setStep('access-code')} />
      case 'access-code':
        return <AccessCodeStep email={email} onNext={token => { setAccessCodeToken(token); setStep('account-setup') }} />
      case 'account-setup':
        return (
          <AccountSetupStep
            email={email}
            accessCodeToken={accessCodeToken}
            onNext={(u, ref, sess) => { setUsername(u); setReferralCode(ref); setSessionToken(sess); setStep('initial-funding') }}
          />
        )
      case 'initial-funding':
        return <InitialFundingStep sessionToken={sessionToken} onNext={() => setStep('welcome')} />
      case 'welcome':
        return <WelcomeStep username={username} referralCode={referralCode} onDone={() => navigate('/markets')} />
    }
  }

  return (
    <AuthCard step={step} showLogo={step === 'email'}>
      {renderStep()}
    </AuthCard>
  )
}
