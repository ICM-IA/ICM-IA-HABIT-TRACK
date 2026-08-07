import { describe, it, expect } from 'vitest'
import { trackingMonths, monthWeeks, WEEK_COLORS } from './tracking'

describe('trackingMonths', () => {
  it('returns 12 months from the start, rolling over the year', () => {
    const ms = trackingMonths(2026, 8)
    expect(ms).toHaveLength(12)
    expect(ms[0]).toEqual({ year: 2026, month: 8 })
    expect(ms[5]).toEqual({ year: 2027, month: 1 })
    expect(ms[11]).toEqual({ year: 2027, month: 7 })
  })
})

describe('monthWeeks', () => {
  it('splits a 31-day month into 5 fixed 7-day blocks', () => {
    const w = monthWeeks(2027, 1) // enero 31 días
    expect(w).toHaveLength(5)
    expect(w[0].days).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(w[4].days).toEqual([29, 30, 31])
    expect(w[0].color).toBe(WEEK_COLORS[0])
    expect(w[4].color).toBe(WEEK_COLORS[4])
  })
  it('handles february (28 days) as 4 blocks', () => {
    const w = monthWeeks(2027, 2)
    expect(w).toHaveLength(4)
    expect(w[3].days).toEqual([22, 23, 24, 25, 26, 27, 28])
  })
})
