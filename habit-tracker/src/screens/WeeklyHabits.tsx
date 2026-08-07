import type { useHabits } from '../data/useHabits'
import type { useCompletions } from '../data/useCompletions'
import { HabitCalendar } from '../components/HabitCalendar'
import { computeWeeklyStreak } from '../logic/streaks'
import { toISODate, weekKey } from '../logic/dates'

type Props = {
  habitsApi: ReturnType<typeof useHabits>
  completionsApi: ReturnType<typeof useCompletions>
  year: number
  month: number
}

export function WeeklyHabits({ habitsApi, completionsApi, year, month }: Props) {
  const today = toISODate(new Date())
  const thisWeek = weekKey(today)
  const weekly = habitsApi.habits.filter((h) => h.type === 'weekly')
  if (weekly.length === 0) return <p style={{ color: 'var(--muted)' }}>Creá tu primer hábito semanal con el botón +.</p>
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {weekly.map((h) => {
        const done = completionsApi.byHabit[h.id] ?? new Set<string>()
        const streak = computeWeeklyStreak(done, h.goal, today)
        const thisWeekCount = [...done].filter((d) => weekKey(d) === thisWeek).length
        const pct = h.goal ? Math.min(100, Math.round((thisWeekCount / h.goal) * 100)) : 0
        return (
          <div key={h.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ display: 'flex', alignItems: 'center' }}><span className="accent-bar" />{h.name}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--accent)' }}>🔥 {streak}</span>
                <button onClick={() => { if (confirm(`¿Eliminar "${h.name}"?`)) habitsApi.archive(h.id) }}
                  aria-label="Eliminar hábito"
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16 }}>🗑️</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 13, margin: '10px 0 6px' }}>
              <span>{thisWeekCount}/{h.goal} esta semana</span><span style={{ color: 'var(--accent)' }}>{pct}%</span>
            </div>
            <div className="pbar-track"><div className="pbar-fill" style={{ width: `${pct}%` }} /></div>
            <HabitCalendar year={year} month={month} done={done} color={h.color}
              onToggle={(date, isDone) => completionsApi.toggle(h.id, date, isDone)} />
          </div>
        )
      })}
    </div>
  )
}
