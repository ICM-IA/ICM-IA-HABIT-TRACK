import { describe, it, expect } from 'vitest'
import { groupByHabit } from './useCompletions'
import type { Completion } from '../lib/types'

const c = (habit_id: string, date: string): Completion =>
  ({ id: date + habit_id, user_id: 'u', habit_id, date, created_at: '' })

describe('groupByHabit', () => {
  it('builds a Set of dates per habit id', () => {
    const rows = [c('a', '2026-08-01'), c('a', '2026-08-02'), c('b', '2026-08-01')]
    const g = groupByHabit(rows)
    expect([...g['a']].sort()).toEqual(['2026-08-01', '2026-08-02'])
    expect([...g['b']]).toEqual(['2026-08-01'])
  })
})
