/**
 * walletService — wallet connection adapter.
 *
 * Phase 1 primary chain: Solana Devnet.
 * Integration not yet wired — returns INTEGRATION_UNAVAILABLE.
 *
 * TODO: Integrate @solana/wallet-adapter-react for Solana Devnet.
 * TODO: Wire Privy / Dynamic / RainbowKit if EVM is the auth layer.
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
