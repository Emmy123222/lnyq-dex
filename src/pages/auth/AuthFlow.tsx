import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowRight, IconCheck } from '@tabler/icons-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import type { AuthStep } from '../../types'

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

/* ──────────────────────────────────────────────────────────────
   Shared auth chrome
────────────────────────────────────────────────────────────── */
function AuthCard({ children, step, showLogo }: { children: React.ReactNode; step: AuthStep; showLogo?: boolean }) {
  const steps: AuthStep[] = ['email', 'verify', 'access-code', 'account-setup', 'initial-funding', 'welcome']
  const current = steps.indexOf(step)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      {/* Card */}
      <div style={{ width: '100%', maxWidth: 392, background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 16, padding: '40px 36px', boxShadow: '0 30px 90px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }}>
        {showLogo && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
            <LogoMark size={52} />
            <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', marginTop: 12, marginBottom: 14 }}>LNYQ</span>
          </div>
        )}
        {children}
      </div>

      {/* Step dots (skip welcome) */}
      {step !== 'welcome' && (
        <div className="flex items-center gap-1.5 mt-6">
          {steps.filter(s => s !== 'welcome').map((s, i) => (
            <div
              key={s}
              style={{
                borderRadius: 999,
                width: i === current ? 16 : 8,
                height: 8,
                background: i <= current ? 'var(--accent)' : '#26262E',
                transition: 'all 150ms',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Steps
────────────────────────────────────────────────────────────── */
function EmailStep({ onNext }: { onNext: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const submit = () => {
    if (!valid) { setError('Enter a valid email address'); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); onNext(email) }, 800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', textAlign: 'center' }}>
        The order book for onchain markets. Market infrastructure for illiquid and speculative onchain assets.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          error={error}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
        />
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit} disabled={!email}>
          Continue
        </Button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        By continuing you agree to the Terms &amp; Privacy Policy.
      </p>
    </div>
  )
}

function VerifyStep({ email, onNext }: { email: string; onNext: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)

  const submit = () => {
    if (code.length < 6) { setError('Enter the 6-digit code from your email'); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); onNext() }, 800)
  }

  const resend = () => { setResent(true); setTimeout(() => setResent(false), 3000) }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Verify your email</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          We sent a 6-digit code to <span className="text-[var(--text-primary)] font-bold">{email}</span>
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <Input
          label="Verification code"
          type="text"
          inputMode="numeric"
          placeholder="000000"
          maxLength={6}
          value={code}
          onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
          error={error}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
          className="tracking-[0.3em] text-center text-lg font-mono"
        />
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit} disabled={code.length < 6}>
          Verify email
        </Button>
      </div>
      <p className="text-xs text-[var(--text-tertiary)] text-center">
        Didn't receive it?{' '}
        <button onClick={resend} className="text-[var(--text-accent)] hover:underline">
          {resent ? 'Sent!' : 'Resend code'}
        </button>
      </p>
    </div>
  )
}

function AccessCodeStep({ onNext }: { onNext: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = () => {
    if (!code.trim()) { setError('Access code is required'); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); onNext() }, 800)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Enter access code</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          LNYQ is in private access. An access code is required to continue.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <Input
          label="Access code"
          type="text"
          placeholder="XXXX-XXXX-XXXX"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          error={error}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
          className="font-mono tracking-wide"
        />
        <p className="text-xs text-[var(--text-tertiary)]">
          Don't have a code?{' '}
          <a href="#" className="text-[var(--text-accent)] hover:underline">Request access</a>
        </p>
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit} disabled={!code.trim()}>
          Continue
          <IconArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}

function AccountSetupStep({ onNext }: { onNext: (username: string) => void }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const valid = /^[a-zA-Z0-9_]{3,20}$/.test(username)

  const submit = () => {
    if (!valid) { setError('3-20 characters, letters, numbers and underscores only'); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); onNext(username) }, 800)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Set up your account</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Choose a username visible on the leaderboard</p>
      </div>
      <div className="flex flex-col gap-4">
        <Input
          label="Username"
          type="text"
          placeholder="trader_alpha"
          value={username}
          onChange={e => { setUsername(e.target.value); setError('') }}
          error={error}
          hint="3-20 characters. Letters, numbers, underscores."
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
        />
        {username && !error && valid && (
          <div className="flex items-center gap-2 text-xs text-[var(--buy)]">
            <IconCheck size={14} />
            Username available
          </div>
        )}
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit} disabled={!username}>
          Continue
          <IconArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}

function InitialFundingStep({ onNext }: { onNext: () => void }) {
  const [loading, setLoading] = useState(false)

  const claim = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); onNext() }, 1200)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Fund your account</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Testnet USDC to start trading</p>
      </div>

      {/* Drip card */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--accent-tint)] border border-[var(--border-accent)] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-accent)]">Testnet allocation</span>
          <span className="text-xs text-[var(--text-tertiary)]">One-time</span>
        </div>
        <div className="text-3xl font-black text-[var(--text-primary)] nums">1,000 USDC</div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Automatically credited to your account</p>
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={claim}>
          Claim testnet USDC
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={onNext}>
          Skip for now
        </Button>
      </div>

      <p className="text-xs text-[var(--text-tertiary)] text-center">
        Testnet USDC has no real value and is provided for testing purposes only.
      </p>
    </div>
  )
}

function WelcomeStep({ username, onDone }: { username: string; onDone: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(46,189,133,0.14)', border: '1px solid #2EBD85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconCheck size={30} color="#2EBD85" strokeWidth={2.5} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 10 }}>Welcome to LNYQ</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your account is ready. Start trading.</div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 }}>
        {[
          { label: 'Balance',  value: '50,000.00 USDC' },
          { label: 'Username', value: username },
          { label: 'Status',   value: 'Verified', green: true },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.label}</span>
            <span style={{ fontSize: r.label === 'Balance' ? 15 : 14, fontWeight: r.label === 'Balance' ? 800 : 700, fontFamily: r.label === 'Balance' ? 'var(--font-mono)' : undefined, color: (r as any).green ? 'var(--up-500)' : '#fff', fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
          </div>
        ))}
      </div>
      <Button variant="primary" size="lg" fullWidth onClick={onDone}>
        Go to Trade
      </Button>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Auth flow orchestrator
────────────────────────────────────────────────────────────── */
export default function AuthFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('trader')

  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <EmailStep
            onNext={e => { setEmail(e); setStep('verify') }}
          />
        )
      case 'verify':
        return <VerifyStep email={email} onNext={() => setStep('access-code')} />
      case 'access-code':
        return <AccessCodeStep onNext={() => setStep('account-setup')} />
      case 'account-setup':
        return (
          <AccountSetupStep
            onNext={u => { setUsername(u); setStep('initial-funding') }}
          />
        )
      case 'initial-funding':
        return <InitialFundingStep onNext={() => setStep('welcome')} />
      case 'welcome':
        return <WelcomeStep username={username} onDone={() => navigate('/trade')} />
    }
  }

  return (
    <AuthCard step={step} showLogo={step === 'email'}>
      {renderStep()}
    </AuthCard>
  )
}
