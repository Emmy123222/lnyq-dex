
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import AppShell from './components/layout/AppShell'
import AuthFlow from './pages/auth/AuthFlow'
import { authService } from './services/authService'
import { apiFetch } from './services/types'
import { WalletProvider } from './contexts/WalletContext'

function RequireAuth() {
  const session = authService.loadSession()
  if (!session?.sessionToken) return <Navigate to="/auth" replace />
  return <Outlet />
}
import TradePage from './pages/TradePage'
import Portfolio from './pages/Portfolio'
import OrderHistory from './pages/OrderHistory'
import MarketDetails from './pages/MarketDetails'
import MarketDetail from './pages/MarketDetail'
import Leaderboard from './pages/Leaderboard'
import Settings from './pages/Settings'
import Funding from './pages/Funding'
import Rewards from './pages/Rewards'
import Vaults from './pages/Vaults'
import Alerts from './pages/Alerts'
import ListMarket from './pages/ListMarket'
import Analytics from './pages/Analytics'
import Stake from './pages/Stake'
import Earn from './pages/Earn'
import Launchpad from './pages/Launchpad'

function handleWalletChange(address: string | null) {
  const session = authService.loadSession()
  if (!session?.sessionToken) return
  // Persist wallet address in local session
  authService.saveSession({ ...session, walletAddress: address ?? undefined })
  // Sync to backend (fire-and-forget — non-critical path)
  if (address) {
    apiFetch('/auth/wallet', {
      method: 'PATCH',
      body: { walletAddress: address },
      sessionToken: session.sessionToken,
    }).catch(() => { /* best-effort */ })
  }
}

export default function App() {
  return (
    <ToastProvider>
      <WalletProvider onAddressChange={handleWalletChange}>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthFlow />} />
            <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/trade"            element={<TradePage />} />
              <Route path="/portfolio"        element={<Portfolio />} />
              <Route path="/orders"           element={<OrderHistory />} />
              <Route path="/markets"          element={<MarketDetails />} />
              <Route path="/markets/new"      element={<ListMarket />} />
              <Route path="/markets/:marketId" element={<MarketDetail />} />
              <Route path="/leaderboard"      element={<Leaderboard />} />
              <Route path="/settings"         element={<Settings />} />
              <Route path="/funding"          element={<Funding />} />
              <Route path="/rewards"          element={<Rewards />} />
              <Route path="/vaults"           element={<Vaults />} />
              <Route path="/alerts"           element={<Alerts />} />
              <Route path="/analytics"        element={<Analytics />} />
              <Route path="/stake"            element={<Stake />} />
              <Route path="/earn"             element={<Earn />} />
              <Route path="/launchpad"        element={<Launchpad />} />
            </Route>
            </Route>
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </ToastProvider>
  )
}
