import type { useHabits } from '../data/useHabits'
import type { useCompletions } from '../data/useCompletions'
import { computeDailyStreak, computeWeeklyStreak } from '../logic/streaks'
import { monthProgress } from '../logic/stats'
import { monthDates, daysInMonth, toISODate } from '../logic/dates'

type Props = {
  habitsApi: ReturnType<typeof useHabits>
  completionsApi: ReturnType<typeof useCompletions>
  year: number; month: number
  onMonthChange: (year: number, month: number) => void
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WD = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'] // getDay(): 0=domingo

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
  const cols = dates.map((iso, i) => {
    const d = new Date(iso + 'T00:00:00')
    return { iso, day: i + 1, wd: d.getDay(), weekStart: i > 0 && i % 7 === 0 }
  })

  const habits = habitsApi.habits
  const byHabit = completionsApi.byHabit
  const weeksInMonth = dates.length / 7

  const monthTarget = (h: typeof habits[number]) => h.type === 'daily' ? h.goal : Math.round(h.goal * weeksInMonth)
  const monthCount = (h: typeof habits[number]) =>
    [...(byHabit[h.id] ?? new Set<string>())].filter((d) => d.startsWith(`${year}-${String(month).padStart(2, '0')}-`)).length

  const monthTotal = habits.reduce((n, h) => n + monthCount(h), 0)
  const monthGoal = habits.reduce((a, h) => a + monthTarget(h), 0)
  const restantes = Math.max(0, monthGoal - monthTotal)

  const prevMonth = () => month === 1 ? onMonthChange(year - 1, 12) : onMonthChange(year, month - 1)
  const nextMonth = () => month === 12 ? onMonthChange(year + 1, 1) : onMonthChange(year, month + 1)

  const stickyLeft: React.CSSProperties = { position: 'sticky', left: 0, background: 'var(--card)', zIndex: 1 }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header: month selector + stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={prevMonth} aria-label="Mes anterior"
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, padding: '0 4px' }}>‹</button>
          <strong style={{ fontSize: 18 }}>{MONTHS[month - 1]} {year}</strong>
          <button onClick={nextMonth} aria-label="Mes siguiente"
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, padding: '0 4px' }}>›</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="stat" style={{ padding: '8px 14px', minWidth: 70 }}><div className="stat-value is-accent" style={{ fontSize: 20 }}>{monthTotal}</div><div className="stat-label">Completados</div></div>
          <div className="stat" style={{ padding: '8px 14px', minWidth: 70 }}><div className="stat-value" style={{ fontSize: 20 }}>{restantes}</div><div className="stat-label">Restantes</div></div>
          <div className="stat" style={{ padding: '8px 14px', minWidth: 54 }}><div className="stat-value" style={{ fontSize: 20 }}>{daysInMonth(year, month)}</div><div className="stat-label">Días</div></div>
        </div>
      </div>

      <div style={{ color: 'var(--muted)', fontSize: 12, padding: '10px 16px 12px' }}>
        ↔ Deslizá para ver todo el mes · toca una casilla para marcar
      </div>

      {habits.length === 0
        ? <p style={{ color: 'var(--muted)', padding: '0 16px 16px' }}>Creá tu primer hábito con el botón +.</p>
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: 11, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ ...stickyLeft, textAlign: 'left', padding: '10px 14px', color: 'var(--muted)', minWidth: 150, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>Hábito</th>
                  {cols.map((c) => (
                    <th key={c.iso} style={{
                      padding: '6px 0 8px', minWidth: 28, color: c.iso === today ? 'var(--accent)' : 'var(--muted)',
                      borderLeft: c.weekStart ? '2px solid var(--border)' : 'none',
                      borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', fontWeight: 500,
                    }}>
                      <div style={{ fontSize: 9, opacity: 0.7 }}>{WD[c.wd]}</div>
                      <div>{c.day}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => {
                  const done = byHabit[h.id] ?? new Set<string>()
                  const streak = h.type === 'daily' ? computeDailyStreak(done, today) : computeWeeklyStreak(done, h.goal, today)
                  const pct = Math.round(monthProgress(h, done, year, month) * 100)
                  return (
                    <tr key={h.id}>
                      <td style={{ ...stickyLeft, padding: '10px 14px', borderBottom: '1px solid var(--border-soft)' }}>
                        <div style={{ whiteSpace: 'nowrap', fontSize: 14 }}>{h.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 11, display: 'flex', gap: 8 }}>
                          <span>{monthTarget(h)}/mes</span>
                          <span style={{ color: 'var(--accent)' }}>🔥 {streak}</span>
                          <span>{pct}%</span>
                        </div>
                      </td>
                      {cols.map((c) => {
                        const isDone = done.has(c.iso)
                        return (
                          <td key={c.iso} style={{
                            textAlign: 'center', padding: 3, borderBottom: '1px solid var(--border-soft)',
                            borderLeft: c.weekStart ? '2px solid var(--border)' : 'none',
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
