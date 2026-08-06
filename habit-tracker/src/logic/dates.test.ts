import { describe, it, expect } from 'vitest'
import { toISODate, daysInMonth, monthDates, weekKey } from './dates'

describe('dates', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 7, 6))).toBe('2026-08-06') // month is 0-based
  })
  it('counts days in a month (year, month 1-based)', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
  })
  it('lists every ISO date of a month', () => {
    const d = monthDates(2026, 2)
    expect(d[0]).toBe('2026-02-01')
    expect(d.length).toBe(28)
    expect(d[27]).toBe('2026-02-28')
  })
  it('maps a date to its ISO week key (Mon-start)', () => {
    expect(weekKey('2026-08-03')).toBe(weekKey('2026-08-06'))
    expect(weekKey('2026-08-03')).not.toBe(weekKey('2026-08-10'))
  })
})
