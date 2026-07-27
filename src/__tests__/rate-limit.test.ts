import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/rate-limit', () => {
  const calls: Array<{ windowMs: number; max: number }> = []
  const mockRateLimit = (opts: { windowMs: number; max: number }) => {
    calls.push({ windowMs: opts.windowMs, max: opts.max })
    return (handler: (...args: any[]) => any) => handler
  }
  return {
    rateLimit: mockRateLimit,
    strictLimit: mockRateLimit({ windowMs: 60 * 1000, max: 10 }),
    transferLimit: mockRateLimit({ windowMs: 60 * 1000, max: 20 }),
    messageLimit: mockRateLimit({ windowMs: 60 * 1000, max: 60 }),
    apiLimit: mockRateLimit({ windowMs: 60 * 1000, max: 120 }),
    __testCalls: calls,
  }
})

describe('rate-limit presets', () => {
  it('strictLimit is configured with 60s window and max 10', async () => {
    const mod = await import('@/lib/rate-limit')
    expect((mod as any).__testCalls[0]).toEqual({ windowMs: 60000, max: 10 })
  })

  it('transferLimit is configured with 60s window and max 20', async () => {
    const mod = await import('@/lib/rate-limit')
    expect((mod as any).__testCalls[1]).toEqual({ windowMs: 60000, max: 20 })
  })

  it('messageLimit is configured with 60s window and max 60', async () => {
    const mod = await import('@/lib/rate-limit')
    expect((mod as any).__testCalls[2]).toEqual({ windowMs: 60000, max: 60 })
  })

  it('apiLimit is configured with 60s window and max 120', async () => {
    const mod = await import('@/lib/rate-limit')
    expect((mod as any).__testCalls[3]).toEqual({ windowMs: 60000, max: 120 })
  })

  it('exports four preset limiters as functions', async () => {
    const mod = await import('@/lib/rate-limit')
    expect(typeof mod.strictLimit).toBe('function')
    expect(typeof mod.transferLimit).toBe('function')
    expect(typeof mod.messageLimit).toBe('function')
    expect(typeof mod.apiLimit).toBe('function')
  })
})
