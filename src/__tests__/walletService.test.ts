import { describe, it, expect } from 'vitest'
import { walletService } from '../services/walletService'

describe('walletService.truncateAddress', () => {
  it('truncates a full-length Solana address', () => {
    const addr = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsk'
    expect(walletService.truncateAddress(addr)).toBe('7xKX…gAsk')
  })

  it('returns the original string if shorter than 8 chars', () => {
    expect(walletService.truncateAddress('abc')).toBe('abc')
    expect(walletService.truncateAddress('')).toBe('')
  })

  it('handles exactly 8 char address', () => {
    expect(walletService.truncateAddress('12345678')).toBe('1234…5678')
  })
})
