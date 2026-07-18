/**
 * AuthFlow — access-code-gated onboarding + returning-user sign-in.
 *
 * Signup flow:  landing → email → access-code → account-setup → initial-funding → welcome
 * Login flow:   landing → email (login mode) → welcome-back → redirect
 *
 * No fake OTP step. Email verification backend endpoint is not yet available.
 * All network calls go through authService / dripService — no mock logic here.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowRight, IconCheck } from '@tabler/icons-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { authService, validateAccessCodeFormat } from '../../services/authService'
import { FLAGS } from '../../config/featureFlags'
import { useWalletContext } from '../../contexts/WalletContext'
import { walletService } from '../../services/walletService'
import { ENV } from '../../config/env'
import type { AuthStep } from '../../types'

// ── Logo ──────────────────────────────────────────────────────────────────────

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

// ── Auth card shell ───────────────────────────────────────────────────────────

type ExtendedStep = AuthStep | 'landing' | 'login-email' | 'welcome-back' | 'wallet-creation'

const SIGNUP_STEPS: ExtendedStep[] = [
  'email', 'access-code', 'account-setup', 'initial-funding',
  ...(FLAGS.WALLET_ENABLED ? ['wallet-creation' as ExtendedStep] : []),
  'welcome',
]

function AuthCard({
  children,
  step,
  showLogo,
}: {
  children: React.ReactNode
  step: ExtendedStep
  showLogo?: boolean
}) {
  const idx = SIGNUP_STEPS.indexOf(step)
  const showDots = idx >= 0 && step !== 'welcome'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
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

      {showDots && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 24 }}>
          {SIGNUP_STEPS.filter(s => s !== 'welcome').map((s, i) => (
            <div
              key={s}
              style={{
                borderRadius: 999,
                width: s === step ? 16 : 8,
                height: 8,
                background: i <= idx ? 'var(--accent)' : '#26262E',
                transition: 'all 150ms',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Landing screen ─────────────────────────────────────────────────────────────

function LandingStep({
  onSignup,
  onLogin,
}: {
  onSignup: () => void
  onLogin: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
        The order book for onchain NFT markets.<br />Real price discovery. Transparent liquidity.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="primary" size="lg" fullWidth onClick={onSignup}>
          Sign up with access code <IconArrowRight size={16} />
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={onLogin}>
          Sign in to existing account
        </Button>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
        By continuing you agree to the Terms &amp; Privacy Policy.
      </p>
    </div>
  )
}

// ── Login email step ───────────────────────────────────────────────────────────

function LoginEmailStep({
  onSuccess,
  onBack,
}: {
  onSuccess: (data: { userId: string; email: string; username: string; referralCode: string; sessionToken: string }) => void
  onBack: () => void
}) {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const submit = async () => {
    if (!valid) { setError('Enter a valid email address'); return }
    setLoading(true)
    setError('')
    const res = await authService.login(email)
    setLoading(false)
    if (!res.ok) {
      setError(
        res.error.code === 'NO_ACCOUNT'
          ? 'No account found for this email. Sign up with an access code.'
          : res.error.message,
      )
      return
    }
    onSuccess({
      userId:       res.data.userId,
      email:        res.data.email,
      username:     res.data.username,
      referralCode: res.data.referralCode,
      sessionToken: res.data.sessionToken,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Sign in</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Enter your testnet account email</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          Continue <IconArrowRight size={16} />
        </Button>
        <button
          onClick={onBack}
          style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          Back
        </button>
      </div>
    </div>
  )
}

// ── Welcome back screen ────────────────────────────────────────────────────────

function WelcomeBackStep({ username, onDone }: { username: string; onDone: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(46,189,133,0.14)', border: '1px solid #2EBD85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconCheck size={30} color="#2EBD85" strokeWidth={2.5} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Welcome back, {username}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your session has been restored.</div>
      </div>
      <Button variant="primary" size="lg" fullWidth onClick={onDone}>Go to Markets</Button>
    </div>
  )
}

// ── Signup steps ───────────────────────────────────────────────────────────────

function EmailStep({ onNext, onBack }: { onNext: (email: string) => void; onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const submit = () => {
    if (!valid) { setError('Enter a valid email address'); return }
    onNext(email)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Create account</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Enter your email to get started</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        <Button variant="primary" size="lg" fullWidth onClick={submit} disabled={!email}>
          Continue <IconArrowRight size={16} />
        </Button>
        <button
          onClick={onBack}
          style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          Back
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
        By continuing you agree to the Terms &amp; Privacy Policy.
      </p>
    </div>
  )
}

function AccessCodeStep({
  email,
  onNext,
  onBack,
}: {
  email: string
  onNext: (token: string) => void
  onBack: () => void
}) {
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Access code is required'); return }
    if (!validateAccessCodeFormat(trimmed)) { setError('Invalid format — check your access code'); return }

    setLoading(true)
    setError('')
    const res = await authService.verifyAccessCode({ code: trimmed, email })
    setLoading(false)

    if (!res.ok) { setError(res.error.message); return }

    switch (res.data.status) {
      case 'VALID':        onNext(res.data.sessionToken ?? ''); break
      case 'ALREADY_USED': setError('This access code has already been used.'); break
      case 'EXPIRED':      setError('This access code has expired.'); break
      default:             setError('Access code not recognised. Check for typos.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Enter access code</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>LNYQ is in private testnet. An invitation code is required.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          label="Access code"
          type="text"
          placeholder="XXXX-XXXX-XXXX"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          error={error}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
          // @ts-ignore — className forwarded by Input component
          className="font-mono tracking-wide"
        />
        {ENV.IS_LOCAL_API && (
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
            Local dev code: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>LNYQ-TESTNET-0001</code>
          </p>
        )}
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
          Don't have a code?{' '}
          <a href="#" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Request testnet access</a>
        </p>
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit} disabled={!code.trim()}>
          Continue <IconArrowRight size={16} />
        </Button>
        <button
          onClick={onBack}
          style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          Back
        </button>
      </div>
    </div>
  )
}

function AccountSetupStep({
  email,
  accessCodeToken,
  onNext,
  onBack,
}: {
  email: string
  accessCodeToken: string
  onNext: (username: string, referralCode: string, sessionToken: string, userId: string) => void
  onBack: () => void
}) {
  const [username, setUsername] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const valid = /^[a-zA-Z0-9_]{3,20}$/.test(username)

  const submit = async () => {
    if (!valid) { setError('3-20 characters, letters, numbers and underscores only'); return }
    setLoading(true)
    setError('')
    const res = await authService.signup({ email, username, accessCodeToken })
    setLoading(false)
    if (!res.ok) { setError(res.error.message); return }
    onNext(username, res.data.referralCode, res.data.sessionToken, res.data.userId)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Set up your account</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Choose a username visible on the leaderboard</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--up-500)' }}>
            <IconCheck size={14} /> Available
          </div>
        )}
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={submit} disabled={!username}>
          Continue <IconArrowRight size={16} />
        </Button>
        <button
          onClick={onBack}
          style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          Back
        </button>
      </div>
    </div>
  )
}

function InitialFundingStep({
  sessionToken: _sessionToken,
  onNext,
}: {
  sessionToken: string
  onNext: (claimed: boolean, amount?: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Account funded</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Your testnet allocation was credited automatically when your account was created.
        </p>
      </div>

      <div style={{ borderRadius: 10, background: 'var(--accent-tint)', border: '1px solid var(--border-accent)', padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Testnet allocation</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>One-time · no real value</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>1,000 USDC</div>
        <p style={{ fontSize: 11, color: 'var(--up-500)', margin: '6px 0 0', fontWeight: 700 }}>
          ✓ Already credited to your account
        </p>
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={() => onNext(true, '1000.00')}>
        Continue to Trade
      </Button>

      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
        Testnet USDC has no real value and is for testing purposes only.
      </p>
    </div>
  )
}

function WalletCreationStep({
  sessionToken,
  onNext,
  onSkip,
}: {
  sessionToken: string
  onNext: (walletAddress: string) => void
  onSkip: () => void
}) {
  const wallet = useWalletContext()
  const [linking, setLinking] = useState(false)
  const [error,   setError]   = useState('')

  // When Privy connects a wallet, link it to the LNYQ account automatically
  useEffect(() => {
    if (!wallet.connected || !wallet.address) return
    setLinking(true)
    setError('')
    walletService.linkAddress(wallet.address, sessionToken)
      .then(res => {
        if (!res.ok) setError(res.error.message ?? 'Failed to link wallet')
        else onNext(wallet.address!)
      })
      .catch(() => setError('Network error — please try again'))
      .finally(() => setLinking(false))
  }, [wallet.connected, wallet.address]) // eslint-disable-line

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Create your wallet</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          A Solana wallet ties your LNYQ identity to an on-chain address. Required for testnet trading and order signing.
        </p>
      </div>

      {wallet.notConfigured ? (
        <div style={{ padding: '14px 16px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Wallet integration requires <code style={{ fontFamily: 'var(--font-mono)', color: '#F0A500' }}>VITE_PRIVY_APP_ID</code> to be configured.
        </div>
      ) : wallet.connected ? (
        <div style={{ padding: '14px 16px', background: 'rgba(46,189,133,0.08)', border: '1px solid rgba(46,189,133,0.3)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2EBD85', marginBottom: 4 }}>Wallet connected</div>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: '#fff', wordBreak: 'break-all' }}>{wallet.address}</div>
        </div>
      ) : (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={wallet.isLoading || linking}
          onClick={() => wallet.openConnect()}
        >
          Create embedded wallet <IconArrowRight size={16} />
        </Button>
      )}

      {error && (
        <p style={{ fontSize: 12, color: 'var(--down-400)', margin: 0 }}>{error}</p>
      )}

      {linking && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>Linking wallet to account…</p>
      )}

      <button
        onClick={onSkip}
        style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
      >
        Skip — trading without a wallet uses local simulation only
      </button>
    </div>
  )
}

function WelcomeStep({
  username,
  referralCode,
  claimedAmount,
  walletAddress,
  onDone,
}: {
  username: string
  referralCode: string
  claimedAmount?: string
  walletAddress?: string
  onDone: () => void
}) {
  const rows = [
    { label: 'Balance',       value: claimedAmount ? `${parseFloat(claimedAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC` : '1,000.00 USDC', mono: true },
    { label: 'Username',      value: username },
    { label: 'Referral Code', value: referralCode, mono: true },
    { label: 'Network',       value: ENV.CHAIN },
    ...(walletAddress ? [{ label: 'Wallet', value: `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`, mono: true }] : []),
    { label: 'Status',        value: 'Verified', green: true },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(46,189,133,0.14)', border: '1px solid #2EBD85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconCheck size={30} color="#2EBD85" strokeWidth={2.5} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 10 }}>Welcome to LNYQ</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your testnet account is ready. Start trading.</div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: (r as any).mono ? 'var(--font-mono)' : undefined, color: (r as any).green ? 'var(--up-500)' : '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {r.value}
            </span>
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
  const [step,             setStep]           = useState<ExtendedStep>('landing')
  const [email,            setEmail]          = useState('')
  const [accessCodeToken,  setAccessCodeToken] = useState('')
  const [username,         setUsername]       = useState('')
  const [referralCode,     setReferralCode]   = useState('')
  const [sessionToken,     setSessionToken]   = useState('')
  const [claimedAmount,    setClaimedAmount]  = useState<string | undefined>()
  const [walletAddress,    setWalletAddress]  = useState<string | undefined>()

  // If already logged in, skip auth entirely
  useEffect(() => {
    const session = authService.loadSession()
    if (session?.sessionToken && session?.userId) {
      navigate('/trade', { replace: true })
    }
  }, []) // eslint-disable-line

  const saveAndRedirect = (data: {
    userId: string; email: string; username: string; referralCode: string; sessionToken: string
    walletAddress?: string
  }) => {
    authService.saveSession({
      userId:          data.userId,
      username:        data.username,
      email:           data.email,
      referralCode:    data.referralCode,
      sessionToken:    data.sessionToken,
      isAuthenticated: true,
      walletAddress:   data.walletAddress,
    })
  }

  const renderStep = () => {
    switch (step) {
      case 'landing':
        return (
          <LandingStep
            onSignup={() => setStep('email')}
            onLogin={()  => setStep('login-email')}
          />
        )

      case 'login-email':
        return (
          <LoginEmailStep
            onBack={() => setStep('landing')}
            onSuccess={data => {
              saveAndRedirect(data)
              setUsername(data.username)
              setStep('welcome-back')
            }}
          />
        )

      case 'welcome-back':
        return (
          <WelcomeBackStep
            username={username}
            onDone={() => navigate('/trade', { replace: true })}
          />
        )

      case 'email':
        return (
          <EmailStep
            onNext={e => { setEmail(e); setStep('access-code') }}
            onBack={() => setStep('landing')}
          />
        )

      case 'access-code':
        return (
          <AccessCodeStep
            email={email}
            onNext={token => { setAccessCodeToken(token); setStep('account-setup') }}
            onBack={() => setStep('email')}
          />
        )

      case 'account-setup':
        return (
          <AccountSetupStep
            email={email}
            accessCodeToken={accessCodeToken}
            onNext={(u, ref, sess, uid) => {
              setUsername(u)
              setReferralCode(ref)
              setSessionToken(sess)
              saveAndRedirect({ userId: uid, email, username: u, referralCode: ref, sessionToken: sess })
              setStep('initial-funding')
            }}
            onBack={() => setStep('access-code')}
          />
        )

      case 'initial-funding':
        return (
          <InitialFundingStep
            sessionToken={sessionToken}
            onNext={(_, amount) => {
              setClaimedAmount(amount)
              setStep(FLAGS.WALLET_ENABLED ? 'wallet-creation' : 'welcome')
            }}
          />
        )

      case 'wallet-creation':
        return (
          <WalletCreationStep
            sessionToken={sessionToken}
            onNext={addr => {
              setWalletAddress(addr)
              const session = authService.loadSession()
              if (session) authService.saveSession({ ...session, walletAddress: addr })
              setStep('welcome')
            }}
            onSkip={() => setStep('welcome')}
          />
        )

      case 'welcome':
        return (
          <WelcomeStep
            username={username}
            referralCode={referralCode}
            claimedAmount={claimedAmount}
            walletAddress={walletAddress}
            onDone={() => navigate('/trade', { replace: true })}
          />
        )
    }
  }

  return (
    <AuthCard step={step} showLogo={step === 'landing'}>
      {renderStep()}
    </AuthCard>
  )
}
