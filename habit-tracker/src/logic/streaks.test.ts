import { describe, it, expect } from 'vitest'
import { computeDailyStreak, computeWeeklyStreak } from './streaks'

describe('computeDailyStreak', () => {
  it('counts consecutive days ending today', () => {
    const today = '2026-08-06'
    const done = new Set(['2026-08-06', '2026-08-05', '2026-08-04'])
    expect(computeDailyStreak(done, today)).toBe(3)
  })
  it('is 0 when today not done and yesterday not done', () => {
    expect(computeDailyStreak(new Set(['2026-08-01']), '2026-08-06')).toBe(0)
  })
  it('allows streak that ends yesterday if today not yet marked', () => {
    const done = new Set(['2026-08-05', '2026-08-04'])
    expect(computeDailyStreak(done, '2026-08-06')).toBe(2)
  })
})

describe('computeWeeklyStreak', () => {
  it('counts consecutive weeks meeting the goal', () => {
    const done = new Set([
      '2026-08-04', '2026-08-06',
      '2026-07-28', '2026-07-30',
    ])
    expect(computeWeeklyStreak(done, 2, '2026-08-06')).toBe(2)
  })
  it('stops at the first week that missed the goal', () => {
    const done = new Set(['2026-08-04', '2026-08-06', '2026-07-28'])
    expect(computeWeeklyStreak(done, 2, '2026-08-06')).toBe(1)
  })
})
