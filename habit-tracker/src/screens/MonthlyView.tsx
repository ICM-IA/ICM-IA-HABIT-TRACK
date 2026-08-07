import type { useHabits } from '../data/useHabits'
import type { useCompletions } from '../data/useCompletions'
import { MonthSelector } from '../components/MonthSelector'
import { computeDailyStreak, computeWeeklyStreak } from '../logic/streaks'
import { monthProgress } from '../logic/stats'
import { monthDates, daysInMonth, toISODate } from '../logic/dates'

type Props = {
  habitsApi: ReturnType<typeof useHabits>
  completionsApi: ReturnType<typeof useCompletions>
  year: number; month: number
  onMonthChange: (year: number, month: number) => void
}

const WD = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M4 12l5 5L20 6" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MonthlyView({ habitsApi, completionsApi, year, month, onMonthChange }: Props) {
  const today = toISODate(new Date())
  const dates = monthDates(year, month)
  const cols = dates.map((iso) => {
    const d = new Date(iso + 'T00:00:00')
    return { iso, day: Number(iso.slice(-2)), wd: d.getDay() }
  })

  const habits = habitsApi.habits
  const byHabit = completionsApi.byHabit

  const monthTotal = habits.reduce((n, h) =>
    n + [...(byHabit[h.id] ?? new Set<string>())].filter((d) => d.startsWith(`${year}-${String(month).padStart(2, '0')}-`)).length, 0)
  const weeksInMonth = dates.length / 7
  const monthGoal = habits.reduce((a, h) => a + (h.type === 'daily' ? h.goal : h.goal * weeksInMonth), 0)
  const restantes = Math.max(0, Math.round(monthGoal - monthTotal))

  const stickyLeft: React.CSSProperties = { position: 'sticky', left: 0, background: 'var(--card)', zIndex: 1 }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ display: 'grid', gap: 14 }}>
        <MonthSelector year={year} month={month} onChange={onMonthChange} />
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat"><div className="stat-value is-accent">{monthTotal}</div><div className="stat-label">Completados</div></div>
          <div className="stat"><div className="stat-value">{restantes}</div><div className="stat-label">Restantes</div></div>
          <div className="stat"><div className="stat-value">{daysInMonth(year, month)}</div><div className="stat-label">Días</div></div>
        </div>
      </div>

      {habits.length === 0
        ? <p style={{ color: 'var(--muted)' }}>Creá tu primer hábito con el botón +.</p>
        : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: 11, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ ...stickyLeft, textAlign: 'left', padding: '12px 14px', color: 'var(--muted)', minWidth: 150 }}>Hábito</th>
                    {cols.map((c) => (
                      <th key={c.iso} style={{
                        padding: '6px 0 8px', minWidth: 26, color: c.iso === today ? 'var(--accent)' : 'var(--muted)',
                        borderLeft: c.wd === 1 ? '1px solid var(--border)' : 'none', fontWeight: 500,
                      }}>
                        <div style={{ fontSize: 9, opacity: 0.7 }}>{WD[c.wd]}</div>
                        <div>{c.day}</div>
                      </th>
                    ))}
                    <th style={{ padding: '6px 14px', color: 'var(--muted)', textAlign: 'right', minWidth: 84 }}>🔥 / %</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((h) => {
                    const done = byHabit[h.id] ?? new Set<string>()
                    const streak = h.type === 'daily' ? computeDailyStreak(done, today) : computeWeeklyStreak(done, h.goal, today)
                    const pct = Math.round(monthProgress(h, done, year, month) * 100)
                    return (
                      <tr key={h.id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                        <td style={{ ...stickyLeft, padding: '8px 14px', borderTop: '1px solid var(--border-soft)' }}>
                          <div style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{h.name}</div>
                          <div style={{ color: 'var(--muted)', fontSize: 10 }}>
                            {h.type === 'daily' ? 'Diario' : 'Semanal'} · meta {h.goal}
                          </div>
                        </td>
                        {cols.map((c) => {
                          const isDone = done.has(c.iso)
                          return (
                            <td key={c.iso} style={{
                              textAlign: 'center', padding: 2,
                              borderLeft: c.wd === 1 ? '1px solid var(--border)' : 'none',
                            }}>
                              <button
                                className={`grid-cell${isDone ? ' is-done' : ''}${c.iso === today ? ' is-today' : ''}`}
                                onClick={() => completionsApi.toggle(h.id, c.iso, isDone)}
                                aria-label={`${h.name} ${c.day}`}>
                                {isDone && <Check />}
                              </button>
                            </td>
                          )
                        })}
                        <td style={{ padding: '8px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--accent)' }}>🔥 {streak}</span>
                          <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{pct}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  )
}
