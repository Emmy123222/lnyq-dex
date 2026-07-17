/**
 * walletService — wallet connection adapter.
 *
 * Phase 1 auth uses email + access code only. No wallet is connected or required.
 * All methods return INTEGRATION_UNAVAILABLE until Phase 2 wallet integration ships.
 *
 * Phase 2 plan: integrate @solana/wallet-adapter-react (Phantom / Backpack / Solflare)
 * for Solana devnet wallet signing. Session tokens will be tied to wallet signatures
 * instead of email-only session tokens.
 *
 * Do NOT call any walletService method in Phase 1 flows. Auth state is managed
 * entirely by authService (email + sessionToken in sessionStorage).
 */

import type { WalletInfo, ServiceResult } from '../types'
import { unavailable } from './types'

export const walletService = {
  async connect(): Promise<ServiceResult<WalletInfo>> {
    return unavailable('Wallet connection')
  },

  async disconnect(): Promise<ServiceResult<void>> {
    return unavailable('Wallet disconnect')
  },

  async getConnectedWallet(): Promise<ServiceResult<WalletInfo | null>> {
    return unavailable('Wallet info')
  },

  async signMessage(_message: string): Promise<ServiceResult<{ signature: string }>> {
    return unavailable('Message signing')
  },
}
