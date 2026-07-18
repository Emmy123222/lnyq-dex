/**
 * walletService — Privy embedded-wallet utilities.
 *
 * Uses @privy-io/react-auth for Solana embedded wallet creation (Phase 1).
 * Wallet state is accessed through useWalletContext() (src/contexts/WalletContext.tsx).
 * This service provides utilities callable outside React component trees.
 *
 * Setup: set VITE_PRIVY_APP_ID in .env.local to enable wallet features.
 * When not set, all wallet UI is hidden gracefully.
 */

import type { ServiceResult } from '../types'
import { ENV } from '../config/env'
import { apiFetch } from './types'

export const walletService = {
  /** True when Privy app ID is configured */
  isConfigured(): boolean {
    return !!ENV.PRIVY_APP_ID
  },

  /**
   * Link a Privy wallet address to the current LNYQ session.
   * Called automatically by App.tsx via WalletProvider.onAddressChange.
   */
  async linkAddress(walletAddress: string, sessionToken: string): Promise<ServiceResult<{ walletAddress: string }>> {
    return apiFetch<{ walletAddress: string }>('/auth/wallet', {
      method: 'PATCH',
      body:   { walletAddress },
      sessionToken,
    })
  },

  /** Shorten a Solana public key for display (first 4 + last 4 chars) */
  truncateAddress(address: string): string {
    if (!address || address.length < 8) return address
    return `${address.slice(0, 4)}…${address.slice(-4)}`
  },
}
