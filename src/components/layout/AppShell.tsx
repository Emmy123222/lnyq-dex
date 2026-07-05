
import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]" style={{ fontFamily: 'var(--font-sans)' }}>
      <Header />
      <main style={{ paddingTop: 'var(--topbar-h)' }}>
        <Outlet />
      </main>
    </div>
  )
}
