import { Outlet } from 'react-router-dom'
import Header from './Header'
import TestnetBanner from '../ui/TestnetBanner'
import { ENV } from '../../config/env'

// Testnet banner adds 32px above the topbar
const BANNER_H = ENV.IS_PRODUCTION ? 0 : 32

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]" style={{ fontFamily: 'var(--font-sans)' }}>
      <TestnetBanner />
      <div style={{ paddingTop: BANNER_H }}>
        <Header />
        <main style={{ paddingTop: 'var(--topbar-h)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
