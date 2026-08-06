import type { useHabits } from '../data/useHabits'
import type { useCompletions } from '../data/useCompletions'
import { ProgressChart } from '../components/ProgressChart'
import { computeDailyStreak, computeWeeklyStreak } from '../logic/streaks'
import { rankHabits } from '../logic/stats'
import { toISODate, monthDates } from '../logic/dates'

type Props = {
  habitsApi: ReturnType<typeof useHabits>
  completionsApi: ReturnType<typeof useCompletions>
  year: number
  month: number
}

export function Dashboard({ habitsApi, completionsApi, year, month }: Props) {
  const today = toISODate(new Date())
  const habits = habitsApi.habits
  const byHabit = completionsApi.byHabit

  const completedToday = habits.filter((h) => (byHabit[h.id] ?? new Set()).has(today)).length
  const maxStreak = habits.reduce((m, h) => {
    const done = byHabit[h.id] ?? new Set<string>()
    const s = h.type === 'daily' ? computeDailyStreak(done, today) : computeWeeklyStreak(done, h.goal, today)
    return Math.max(m, s)
  }, 0)

  const dates = monthDates(year, month)
  const values = dates.map((d) => habits.reduce((n, h) => n + ((byHabit[h.id] ?? new Set()).has(d) ? 1 : 0), 0))
  const cumulative = values.reduce<number[]>((acc, v, i) => [...acc, (acc[i - 1] ?? 0) + v], [])
  const labels = dates.map((d) => d.slice(-2))
  const monthTotal = values.reduce((a, b) => a + b, 0)
  const monthGoal = habits.reduce((a, h) => a + (h.type === 'daily' ? h.goal : 0), 0)

  const top = rankHabits(habits, byHabit, year, month).slice(0, 10)

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="card" style={{ textAlign: 'center', padding: 12 }}>
      <div style={{ fontSize: 22, color: 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <strong>Hoy</strong>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {habits.length === 0 && <span style={{ color: 'var(--muted)' }}>Creá tu primer hábito con +.</span>}
          {habits.map((h) => {
            const done = (byHabit[h.id] ?? new Set()).has(today)
            return (
              <button key={h.id} onClick={() => completionsApi.toggle(h.id, today, done)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                background: done ? h.color : 'var(--bg)', color: done ? '#fff' : 'var(--text)',
              }}>
                <span>{h.name}</span><span>{done ? '✓' : ''}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <Stat label="Hábitos" value={habits.length} />
        <Stat label="Hoy" value={completedToday} />
        <Stat label="Racha máx" value={maxStreak} />
        <Stat label="Mes" value={monthGoal ? `${Math.round((monthTotal / monthGoal) * 100)}%` : '—'} />
      </div>

      <div className="card">
        <strong>Progreso del mes</strong>
        <ProgressChart labels={labels} values={cumulative} />
      </div>

      <div className="card">
        <strong>Top 10 hábitos</strong>
        <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          {top.map((r) => (
            <li key={r.habit.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{r.habit.name}</span>
              <span style={{ color: 'var(--accent)' }}>{Math.round(r.progress * 100)}%</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
