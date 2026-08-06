import { weekKey } from './dates'

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Consecutive completed days ending at today, or at yesterday if today unmarked. */
export function computeDailyStreak(done: Set<string>, today: string): number {
  let cursor = done.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (done.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Consecutive weeks (Mon-start) with at least `goal` completions, ending this week. */
export function computeWeeklyStreak(done: Set<string>, goal: number, today: string): number {
  const counts = new Map<string, number>()
  for (const iso of done) {
    const k = weekKey(iso)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  let cursor = today
  let streak = 0
  for (let i = 0; i < 520; i++) {
    const k = weekKey(cursor)
    if ((counts.get(k) ?? 0) >= goal) {
      streak++
      cursor = addDays(cursor, -7)
    } else {
      break
    }
  }
  return streak
}
