import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const { getSession, onAuthStateChange } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}))
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession, onAuthStateChange, signInWithOAuth: vi.fn(), signOut: vi.fn() } },
}))

import { useAuth } from './useAuth'

describe('useAuth', () => {
  beforeEach(() => vi.clearAllMocks())
  it('starts loading then resolves to the current session user', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user?.id).toBe('u1')
  })
})
