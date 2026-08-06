import { describe, it, expect } from 'vitest'
import { monthCompletionCount, monthProgress, rankHabits } from './stats'
import type { Habit } from '../lib/types'

const habit = (over: Partial<Habit>): Habit => ({
  id: 'h1', user_id: 'u', name: 'H', type: 'daily', goal: 10,
  color: '#e11d2a', sort_order: 0, archived: false, created_at: '', ...over,
})

describe('stats', () => {
  it('counts completions within a given month', () => {
    const done = new Set(['2026-08-01', '2026-08-15', '2026-07-31'])
    expect(monthCompletionCount(done, 2026, 8)).toBe(2)
  })
  it('computes month progress as count/goal capped at 1', () => {
    const done = new Set(['2026-08-01', '2026-08-02'])
    expect(monthProgress(habit({ goal: 4 }), done, 2026, 8)).toBe(0.5)
    const full = new Set(['2026-08-01','2026-08-02','2026-08-03','2026-08-04','2026-08-05'])
    expect(monthProgress(habit({ goal: 4 }), full, 2026, 8)).toBe(1)
  })
  it('ranks habits by month progress descending', () => {
    const habits = [habit({ id: 'a', goal: 4 }), habit({ id: 'b', goal: 4 })]
    const byHabit = {
      a: new Set(['2026-08-01']),
      b: new Set(['2026-08-01','2026-08-02','2026-08-03']),
    }
    const ranked = rankHabits(habits, byHabit, 2026, 8)
    expect(ranked[0].habit.id).toBe('b')
    expect(ranked[1].habit.id).toBe('a')
  })
  it('scales weekly habit progress by weeks in the month', () => {
    const h = habit({ type: 'weekly', goal: 2 }) // ~2/week * (31/7 ≈ 4.43) ≈ 8.86 target in Aug
    const done = new Set(['2026-08-03','2026-08-05','2026-08-10','2026-08-12']) // 4 done
    const p = monthProgress(h, done, 2026, 8)
    expect(p).toBeGreaterThan(0.4)
    expect(p).toBeLessThan(0.5)
  })
})
