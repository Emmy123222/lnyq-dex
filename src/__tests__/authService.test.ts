import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateAccessCodeFormat, authService } from '../services/authService'
import type { AuthSession } from '../types'

// ── sessionStorage mock ───────────────────────────────────────────────────────
// Vitest runs in node environment where sessionStorage is unavailable.
// authService wraps all storage calls in try/catch, so we just need a
// minimal map-backed shim to let the happy-path tests run.
const _store: Map<string, string> = new Map()
const sessionStorageMock = {
  getItem:    (k: string) => _store.get(k) ?? null,
  setItem:    (k: string, v: string) => { _store.set(k, v) },
  removeItem: (k: string) => { _store.delete(k) },
  clear:      () => { _store.clear() },
}
vi.stubGlobal('sessionStorage', sessionStorageMock)

// ── validateAccessCodeFormat ──────────────────────────────────────────────────

describe('validateAccessCodeFormat', () => {
  it('accepts a typical alphanumeric code', () => {
    expect(validateAccessCodeFormat('LNYQ2025')).toBe(true)
  })
  it('accepts a code with hyphens', () => {
    expect(validateAccessCodeFormat('LNYQ-ALPHA-01')).toBe(true)
  })
  it('is case-insensitive (normalises to upper)', () => {
    expect(validateAccessCodeFormat('lnyq2025')).toBe(true)
  })
  it('rejects empty string', () => {
    expect(validateAccessCodeFormat('')).toBe(false)
  })
  it('rejects single character', () => {
    expect(validateAccessCodeFormat('A')).toBe(false)
  })
  it('rejects two characters (min length 4: first + 2 middle + last)', () => {
    expect(validateAccessCodeFormat('AB')).toBe(false)
  })
  it('accepts minimum valid 4-char code', () => {
    expect(validateAccessCodeFormat('AB1C')).toBe(true)
  })
  it('rejects code with special characters', () => {
    expect(validateAccessCodeFormat('LNYQ!23')).toBe(false)
  })
  it('rejects code with leading hyphen', () => {
    expect(validateAccessCodeFormat('-LNYQ23')).toBe(false)
  })
  it('rejects code with trailing hyphen', () => {
    expect(validateAccessCodeFormat('LNYQ23-')).toBe(false)
  })
  it('rejects whitespace-only string', () => {
    expect(validateAccessCodeFormat('   ')).toBe(false)
  })
  it('accepts code with surrounding whitespace (trims before test)', () => {
    expect(validateAccessCodeFormat('  LNYQ2025  ')).toBe(true)
  })
})

// ── authService.saveSession / loadSession / clearSession ──────────────────────

const MOCK_SESSION: AuthSession = {
  sessionToken:    'tok_abc123',
  userId:          'user_xyz',
  username:        'trader1',
  email:           'trader1@example.com',
  referralCode:    'REF001',
  isAuthenticated: true,
}

describe('authService session storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('loadSession returns null when storage is empty', () => {
    expect(authService.loadSession()).toBeNull()
  })

  it('saveSession + loadSession round-trips the session object', () => {
    authService.saveSession(MOCK_SESSION)
    const loaded = authService.loadSession()
    expect(loaded).not.toBeNull()
    expect(loaded?.sessionToken).toBe('tok_abc123')
    expect(loaded?.userId).toBe('user_xyz')
    expect(loaded?.email).toBe('trader1@example.com')
  })

  it('clearSession removes the stored session', () => {
    authService.saveSession(MOCK_SESSION)
    authService.clearSession()
    expect(authService.loadSession()).toBeNull()
  })

  it('loadSession with a wallet address preserves walletAddress', () => {
    const withWallet: AuthSession = { ...MOCK_SESSION, walletAddress: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin' }
    authService.saveSession(withWallet)
    expect(authService.loadSession()?.walletAddress).toBe('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin')
  })

  it('overwriting a session replaces the previous one', () => {
    authService.saveSession(MOCK_SESSION)
    const updated: AuthSession = { ...MOCK_SESSION, username: 'trader2' }
    authService.saveSession(updated)
    expect(authService.loadSession()?.username).toBe('trader2')
  })
})
