import type { useHabits } from '../data/useHabits'
import type { useCompletions } from '../data/useCompletions'
import { HabitCalendar } from '../components/HabitCalendar'
import { computeDailyStreak } from '../logic/streaks'
import { monthCompletionCount } from '../logic/stats'
import { toISODate } from '../logic/dates'

type Props = {
  habitsApi: ReturnType<typeof useHabits>
  completionsApi: ReturnType<typeof useCompletions>
  year: number
  month: number
}

export function DailyHabits({ habitsApi, completionsApi, year, month }: Props) {
  const today = toISODate(new Date())
  const daily = habitsApi.habits.filter((h) => h.type === 'daily')
  if (daily.length === 0) return <p style={{ color: 'var(--muted)' }}>Creá tu primer hábito diario con el botón +.</p>
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {daily.map((h) => {
        const done = completionsApi.byHabit[h.id] ?? new Set<string>()
        const streak = computeDailyStreak(done, today)
        const count = monthCompletionCount(done, year, month)
        return (
          <div key={h.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{h.name}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--accent)' }}>🔥 {streak}</span>
                <button onClick={() => { if (confirm(`¿Eliminar "${h.name}"?`)) habitsApi.archive(h.id) }}
                  aria-label="Eliminar hábito"
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16 }}>🗑️</button>
              </div>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{count}/{h.goal} este mes</div>
            <HabitCalendar year={year} month={month} done={done} color={h.color}
              onToggle={(date, isDone) => completionsApi.toggle(h.id, date, isDone)} />
          </div>
        )
      })}
    </div>
  )
}
