import type { useHabits } from '../data/useHabits'
import type { useCompletions } from '../data/useCompletions'
import type { useGoals } from '../data/useGoals'
import type { useNotes } from '../data/useNotes'
import { computeDailyStreak, longestStreak } from '../logic/streaks'
import { monthProgress, monthCompletionCount } from '../logic/stats'
import { monthDates, daysInMonth, toISODate } from '../logic/dates'
import { WEEK_COLORS } from '../logic/tracking'

type Props = {
  habitsApi: ReturnType<typeof useHabits>
  completionsApi: ReturnType<typeof useCompletions>
  goalsApi: ReturnType<typeof useGoals>
  notesApi: ReturnType<typeof useNotes>
  year: number; month: number
  onMonthChange: (year: number, month: number) => void
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WD = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá']

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M4 12l5 5L20 6" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MonthlyView({ habitsApi, completionsApi, goalsApi, notesApi, year, month, onMonthChange }: Props) {
  const today = toISODate(new Date())
  const dates = monthDates(year, month)
  const nDays = daysInMonth(year, month)
  const cols = dates.map((iso, i) => {
    const d = new Date(iso + 'T00:00:00')
    const weekIdx = Math.floor(i / 7)
    return { iso, day: i + 1, wd: d.getDay(), weekIdx, color: WEEK_COLORS[weekIdx] ?? WEEK_COLORS[4], weekStart: i > 0 && i % 7 === 0 }
  })
  const nWeeks = Math.ceil(nDays / 7)

  const habits = habitsApi.habits
  const daily = habits.filter((h) => h.type === 'daily')
  const weekly = habits.filter((h) => h.type === 'weekly')
  const byHabit = completionsApi.byHabit
  const { targetFor } = goalsApi

  // header tiles (sobre todos los hábitos del mes)
  const terminado = habits.reduce((a, h) => a + monthCompletionCount(byHabit[h.id] ?? new Set(), year, month), 0)
  const objetivo = habits.reduce((a, h) => a + targetFor(h, year, month), 0)
  const restante = Math.max(0, objetivo - terminado)

  const prevMonth = () => month === 1 ? onMonthChange(year - 1, 12) : onMonthChange(year, month - 1)
  const nextMonth = () => month === 12 ? onMonthChange(year + 1, 1) : onMonthChange(year, month + 1)

  const stickyLeft: React.CSSProperties = { position: 'sticky', left: 0, background: 'var(--card)', zIndex: 1 }
  const trailTh: React.CSSProperties = { padding: '6px 8px', color: 'var(--muted)', fontWeight: 500, fontSize: 10, minWidth: 44 }

  // --- weekly habits: contar veces por semana (bloques de 7) ---
  const weekDays = (w: number) => cols.filter((c) => c.weekIdx === w)
  const weekDone = (habitId: string, w: number) => {
    const done = byHabit[habitId] ?? new Set<string>()
    return weekDays(w).filter((c) => done.has(c.iso)).length
  }
  const stepWeek = (habitId: string, w: number, delta: number) => {
    const done = byHabit[habitId] ?? new Set<string>()
    const days = weekDays(w)
    if (delta > 0) {
      const free = days.find((c) => !done.has(c.iso))
      if (free) completionsApi.toggle(habitId, free.iso, false)
    } else {
      const last = [...days].reverse().find((c) => done.has(c.iso))
      if (last) completionsApi.toggle(habitId, last.iso, true)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Header: mes + tiles */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevMonth} aria-label="Mes anterior" style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22 }}>‹</button>
          <strong style={{ fontSize: 18 }}>{MONTHS[month - 1]} {year}</strong>
          <button onClick={nextMonth} aria-label="Mes siguiente" style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22 }}>›</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="stat" style={{ padding: '8px 14px', minWidth: 78 }}><div className="stat-value is-accent" style={{ fontSize: 20 }}>{terminado}</div><div className="stat-label">Completados</div></div>
          <div className="stat" style={{ padding: '8px 14px', minWidth: 78 }}><div className="stat-value" style={{ fontSize: 20 }}>{restante}</div><div className="stat-label">Restantes</div></div>
          <div className="stat" style={{ padding: '8px 14px', minWidth: 54 }}><div className="stat-value" style={{ fontSize: 20 }}>{nDays}</div><div className="stat-label">Días</div></div>
        </div>
      </div>

      {habits.length === 0 && <p style={{ color: 'var(--muted)' }}>Creá tu primer hábito con el botón +.</p>}

      {/* Grilla hábitos diarios */}
      {daily.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="section-title" style={{ padding: '14px 14px 0', margin: 0 }}><span><span className="accent-bar" />Hábitos diarios</span></div>
          <div style={{ color: 'var(--muted)', fontSize: 12, padding: '8px 14px 12px' }}>↔ Deslizá · tocá una casilla para marcar</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: 11, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ ...stickyLeft, textAlign: 'left', padding: '8px 14px', color: 'var(--muted)', minWidth: 140, borderBottom: '1px solid var(--border)' }}>Hábito</th>
                  {cols.map((c) => (
                    <th key={c.iso} style={{
                      padding: '6px 0 8px', minWidth: 28, fontWeight: 500,
                      color: c.iso === today ? '#fff' : c.color,
                      borderLeft: c.weekStart ? `2px solid ${c.color}` : 'none',
                      borderBottom: `2px solid ${c.color}`,
                    }}>
                      <div style={{ fontSize: 9, opacity: 0.8 }}>{WD[c.wd]}</div>
                      <div>{c.day}</div>
                    </th>
                  ))}
                  <th style={trailTh}>META</th>
                  <th style={trailTh}>HECHO</th>
                  <th style={trailTh}>REST</th>
                  <th style={trailTh}>%</th>
                  <th style={trailTh}>🔥</th>
                  <th style={trailTh}>MÁX</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((h) => {
                  const done = byHabit[h.id] ?? new Set<string>()
                  const meta = targetFor(h, year, month)
                  const hecho = monthCompletionCount(done, year, month)
                  const pct = meta ? Math.min(100, Math.round((hecho / meta) * 100)) : 0
                  const streak = computeDailyStreak(done, today)
                  const maxStreak = longestStreak(done)
                  return (
                    <tr key={h.id}>
                      <td style={{ ...stickyLeft, padding: '8px 14px', borderBottom: '1px solid var(--border-soft)', whiteSpace: 'nowrap', fontSize: 13 }}>{h.name}</td>
                      {cols.map((c) => {
                        const isDone = done.has(c.iso)
                        return (
                          <td key={c.iso} style={{ textAlign: 'center', padding: 3, borderBottom: '1px solid var(--border-soft)', borderLeft: c.weekStart ? `2px solid ${c.color}` : 'none' }}>
                            <button onClick={() => completionsApi.toggle(h.id, c.iso, isDone)} aria-label={`${h.name} ${c.day}`}
                              className={`grid-cell${c.iso === today ? ' is-today' : ''}`}
                              style={{ borderColor: isDone ? c.color : '#333', background: isDone ? c.color : 'transparent' }}>
                              {isDone && <Check />}
                            </button>
                          </td>
                        )
                      })}
                      <td style={{ textAlign: 'center', padding: '0 8px', borderBottom: '1px solid var(--border-soft)' }}>{meta}</td>
                      <td style={{ textAlign: 'center', padding: '0 8px', color: 'var(--accent)', borderBottom: '1px solid var(--border-soft)' }}>{hecho}</td>
                      <td style={{ textAlign: 'center', padding: '0 8px', color: 'var(--muted)', borderBottom: '1px solid var(--border-soft)' }}>{Math.max(0, meta - hecho)}</td>
                      <td style={{ textAlign: 'center', padding: '0 8px', borderBottom: '1px solid var(--border-soft)' }}>{pct}%</td>
                      <td style={{ textAlign: 'center', padding: '0 8px', color: 'var(--accent)', borderBottom: '1px solid var(--border-soft)' }}>{streak}</td>
                      <td style={{ textAlign: 'center', padding: '0 8px', color: 'var(--muted)', borderBottom: '1px solid var(--border-soft)' }}>{maxStreak}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hábitos semanales: conteo por semana */}
      {weekly.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="section-title" style={{ padding: '14px 14px 12px', margin: 0 }}><span><span className="accent-bar" />Hábitos semanales</span></div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: 12, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ ...stickyLeft, textAlign: 'left', padding: '8px 14px', color: 'var(--muted)', minWidth: 140, borderBottom: '1px solid var(--border)' }}>Hábito</th>
                  {Array.from({ length: nWeeks }, (_, w) => (
                    <th key={w} style={{ padding: '8px 10px', minWidth: 96, color: WEEK_COLORS[w] ?? WEEK_COLORS[4], borderBottom: `2px solid ${WEEK_COLORS[w] ?? WEEK_COLORS[4]}` }}>Semana {w + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekly.map((h) => (
                  <tr key={h.id}>
                    <td style={{ ...stickyLeft, padding: '10px 14px', borderBottom: '1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                      {h.name}<div style={{ color: 'var(--muted)', fontSize: 10 }}>meta {h.goal}/sem</div>
                    </td>
                    {Array.from({ length: nWeeks }, (_, w) => {
                      const c = weekDone(h.id, w)
                      const ok = c >= h.goal
                      return (
                        <td key={w} style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid var(--border-soft)' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => stepWeek(h.id, w, -1)} aria-label="menos"
                              style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--muted)' }}>−</button>
                            <span style={{ minWidth: 34, color: ok ? WEEK_COLORS[w] : 'var(--text)', fontWeight: 600 }}>{c}/{h.goal}</span>
                            <button onClick={() => stepWeek(h.id, w, 1)} aria-label="más"
                              style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${WEEK_COLORS[w] ?? WEEK_COLORS[4]}`, background: 'transparent', color: WEEK_COLORS[w] ?? WEEK_COLORS[4] }}>+</button>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notas del mes */}
      <div className="card">
        <div className="section-title"><span><span className="accent-bar" />Notas de {MONTHS[month - 1]}</span></div>
        <textarea
          value={notesApi.textFor(year, month)}
          onChange={(e) => notesApi.setText(year, month, e.target.value)}
          placeholder="Escribí tus notas del mes…"
          rows={4}
          style={{ width: '100%', resize: 'vertical', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, font: 'inherit' }}
        />
      </div>
    </div>
  )
}

// referencia usada indirectamente en cálculos por hábito
void monthProgress
