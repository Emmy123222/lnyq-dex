/**
 * WalletContext — Privy embedded-wallet abstraction.
 *
 * When VITE_PRIVY_APP_ID is set: wraps PrivyProvider and exposes real Solana
 * embedded wallet state. When not set: provides no-op stubs.
 *
 * All components call useWalletContext() — never import Privy hooks directly.
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import {
  PrivyProvider,
  usePrivy,
  useWallets,
  useConnectOrCreateWallet,
  useLogout,
} from '@privy-io/react-auth'
import { ENV } from '../config/env'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WalletContextValue {
  /** Solana public key string, null if not connected */
  address:       string | null
  connected:     boolean
  isLoading:     boolean
  /** True when VITE_PRIVY_APP_ID is not configured */
  notConfigured: boolean
  /** Open Privy connect/create wallet modal */
  openConnect:   () => Promise<void>
  /** Disconnect wallet (logs out of Privy) */
  disconnect:    () => Promise<void>
}

const defaultValue: WalletContextValue = {
  address:       null,
  connected:     false,
  isLoading:     false,
  notConfigured: !ENV.PRIVY_APP_ID,
  openConnect:   async () => {},
  disconnect:    async () => {},
}

const WalletCtx = createContext<WalletContextValue>(defaultValue)

export function useWalletContext(): WalletContextValue {
  return useContext(WalletCtx)
}

// ── Privy inner bridge — always called inside PrivyProvider ───────────────────

function PrivyBridge({ children, onAddressChange }: {
  children: ReactNode
  onAddressChange?: (addr: string | null) => void
}) {
  const { ready, authenticated }  = usePrivy()
  const { wallets }               = useWallets()
  const { connectOrCreateWallet } = useConnectOrCreateWallet()
  const { logout }                = useLogout()

  const solanaWallet = wallets.find(w => (w as { chainType?: string }).chainType === 'solana')
  const address      = solanaWallet?.address ?? null

  useEffect(() => { onAddressChange?.(address) }, [address]) // eslint-disable-line

  const value: WalletContextValue = {
    address,
    connected:     authenticated && !!solanaWallet,
    isLoading:     !ready,
    notConfigured: false,
    openConnect:   async () => { await connectOrCreateWallet() },
    disconnect:    async () => { await logout() },
  }

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>
}

// ── Public provider ────────────────────────────────────────────────────────────

const PRIVY_CONFIG = {
  loginMethods: ['email' as const],
  appearance: {
    theme:       'dark'    as const,
    accentColor: '#A051FC' as const,
  },
  embeddedWallets: {
    solana: { createOnLogin: 'users-without-wallets' as const },
  },
}

interface WalletProviderProps {
  children: ReactNode
  /** Called when the connected wallet address changes — use to sync to LNYQ session */
  onAddressChange?: (addr: string | null) => void
}

export function WalletProvider({ children, onAddressChange }: WalletProviderProps) {
  if (!ENV.PRIVY_APP_ID) {
    return <WalletCtx.Provider value={defaultValue}>{children}</WalletCtx.Provider>
  }
  return (
    <PrivyProvider appId={ENV.PRIVY_APP_ID} config={PRIVY_CONFIG}>
      <PrivyBridge onAddressChange={onAddressChange}>{children}</PrivyBridge>
    </PrivyProvider>
  )
}
