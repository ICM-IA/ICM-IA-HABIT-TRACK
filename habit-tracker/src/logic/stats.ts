import type { Habit } from '../lib/types'

export function monthCompletionCount(done: Set<string>, year: number, month: number): number {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  let n = 0
  for (const iso of done) if (iso.startsWith(prefix)) n++
  return n
}

export function monthProgress(habit: Habit, done: Set<string>, year: number, month: number): number {
  const count = monthCompletionCount(done, year, month)
  return Math.min(1, count / habit.goal)
}

export interface RankedHabit { habit: Habit; progress: number }

export function rankHabits(
  habits: Habit[],
  byHabit: Record<string, Set<string>>,
  year: number,
  month: number,
): RankedHabit[] {
  return habits
    .map((h) => ({ habit: h, progress: monthProgress(h, byHabit[h.id] ?? new Set(), year, month) }))
    .sort((a, b) => b.progress - a.progress)
}
