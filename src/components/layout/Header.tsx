import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DepositModal from '../ui/DepositModal'
import NetworkStatus from '../ui/NetworkStatus'
import EnvBadge from '../ui/EnvBadge'

const NAV_PRIMARY = [
  { label: 'Trade',     path: '/trade' },
  { label: 'Markets',   path: '/markets' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Earn',      path: '/earn' },
  { label: 'Vaults',    path: '/vaults' },
  { label: 'Rewards',   path: '/rewards' },
]

const NAV_MORE = [
  { label: 'Launchpad',   path: '/launchpad' },
  { label: 'Stake LNYQ',  path: '/stake' },
  { label: 'Analytics',   path: '/analytics' },
  { label: 'Alerts',      path: '/alerts' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'Funding',     path: '/funding' },
  { label: 'Settings',    path: '/settings' },
]

function LogoMark() {
  return (
    <div
      style={{
        width: 24, height: 24, borderRadius: 5, flexShrink: 0,
        background: 'linear-gradient(135deg, #A051FC 0%, #531C97 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 11.5 L6.5 2.5 L11 11.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.8 8.5 H9.2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

export default function Header() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [moreOpen,    setMoreOpen]    = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/portfolio') return location.pathname === '/portfolio' || location.pathname === '/orders'
    if (path === '/markets')   return location.pathname.startsWith('/markets')
    return location.pathname === path
  }

  const moreActive = NAV_MORE.some(n => location.pathname === n.path)

  return (
    <>
      {depositOpen && <DepositModal onClose={() => setDepositOpen(false)} />}

      <header
        style={{ height: 'var(--topbar-h)', background: 'var(--bg-base)' }}
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-[18px] border-b border-[var(--border-subtle)] shrink-0"
      >
        {/* Left: logo + nav */}
        <div className="flex items-center gap-[22px] h-full">
          <button
            onClick={() => navigate('/trade')}
            className="flex items-center gap-[10px] select-none cursor-pointer"
          >
            <LogoMark />
            <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>LNYQ</span>
          </button>

          <nav className="hidden md:flex items-center gap-0 h-full">
            {NAV_PRIMARY.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center h-full px-3 transition-colors"
                style={{
                  fontSize: 13, fontWeight: 700,
                  color: isActive(item.path) ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  borderBottom: isActive(item.path) ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                {item.label}
              </button>
            ))}

            {/* More dropdown */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setMoreOpen(v => !v)}
                className="flex items-center gap-1 h-full px-3 transition-colors"
                style={{
                  fontSize: 13, fontWeight: 700,
                  color: moreActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  borderBottom: moreActive ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                More
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMoreOpen(false)} />
                  <div
                    className="absolute left-0 top-full z-30 py-1 overflow-hidden"
                    style={{ marginTop: 4, width: 180, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 8, boxShadow: 'var(--shadow-pop)' }}
                  >
                    {NAV_MORE.map(item => (
                      <button
                        key={item.path}
                        onClick={() => { navigate(item.path); setMoreOpen(false) }}
                        className="flex items-center w-full px-3 py-2 transition-colors hover:bg-[var(--surface-raised)]"
                        style={{ fontSize: 13, fontWeight: 700, color: location.pathname === item.path ? 'var(--accent)' : 'var(--text-secondary)', background: location.pathname === item.path ? 'var(--accent-tint)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* Right: balance + actions */}
        <div className="flex items-center gap-3">
          {/* Environment indicator */}
          <div className="hidden lg:block">
            <EnvBadge />
          </div>

          {/* Network status pill */}
          <div className="hidden lg:block">
            <NetworkStatus />
          </div>

          {/* Available balance */}
          <div className="hidden lg:flex flex-col items-end gap-0 mr-[2px]">
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Available</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              50,000.00 USDC
            </span>
          </div>

          {/* Deposit — opens modal */}
          <button
            onClick={() => setDepositOpen(true)}
            style={{
              height: 30, padding: '0 12px', borderRadius: 6,
              background: 'var(--accent)', color: '#fff',
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              border: 'none', cursor: 'pointer',
            }}
            className="transition-opacity hover:opacity-90"
          >
            Deposit
          </button>

          {/* Notification bell */}
          <button
            onClick={() => navigate('/alerts')}
            style={{ width: 34, height: 34, border: '1px solid var(--border)', borderRadius: 6, position: 'relative', flexShrink: 0, cursor: 'pointer', background: 'transparent' }}
            className="hidden md:flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            <span style={{ position: 'absolute', top: 6, right: 7, width: 6, height: 6, borderRadius: '50%', background: 'var(--down-500)' }} />
          </button>

          {/* User block */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 4px 4px', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
            >
              <span style={{ width: 26, height: 26, borderRadius: 5, background: 'linear-gradient(135deg, #A051FC, #531C97)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                TM
              </span>
              <span className="hidden sm:block" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>tunmise</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-30 py-1 overflow-hidden" style={{ width: 160, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 8, boxShadow: 'var(--shadow-pop)' }}>
                  {[
                    { label: 'Funding',  action: () => navigate('/funding') },
                    { label: 'Settings', action: () => navigate('/settings') },
                    { label: 'Sign out', action: () => navigate('/auth'), danger: true },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setMenuOpen(false) }}
                      className="flex items-center w-full px-3 py-2 transition-colors hover:bg-[var(--surface-raised)]"
                      style={{ fontSize: 13, fontWeight: 700, color: (item as any).danger ? 'var(--down-400)' : 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
