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

function Donut({ pct }: { pct: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const dash = c * Math.min(1, Math.max(0, pct / 100))
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="66" cy="66" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
      <circle cx="66" cy="66" r={r} fill="none" stroke="var(--accent)" strokeWidth="12"
        strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
      <text x="66" y="60" textAnchor="middle" fill="var(--text)" fontSize="26" fontWeight="700"
        transform="rotate(90 66 66)">{pct}%</text>
      <text x="66" y="80" textAnchor="middle" fill="var(--muted)" fontSize="11"
        transform="rotate(90 66 66)">del mes</text>
    </svg>
  )
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
  const weeksInMonth = dates.length / 7
  const monthGoal = habits.reduce((a, h) => a + (h.type === 'daily' ? h.goal : h.goal * weeksInMonth), 0)
  const globalPct = monthGoal ? Math.round((monthTotal / monthGoal) * 100) : 0

  const top = rankHabits(habits, byHabit, year, month).slice(0, 8)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Panel: donut + stat tiles */}
      <div className="card" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'auto 1fr', alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Donut pct={globalPct} />
        </div>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="stat"><div className="stat-value">{habits.length}</div><div className="stat-label">Hábitos</div></div>
          <div className="stat"><div className="stat-value is-accent">{completedToday}</div><div className="stat-label">Hoy</div></div>
          <div className="stat"><div className="stat-value">{monthTotal}</div><div className="stat-label">Completados</div></div>
          <div className="stat"><div className="stat-value is-accent">🔥 {maxStreak}</div><div className="stat-label">Racha máx</div></div>
        </div>
      </div>

      {/* Hoy: quick check */}
      <div className="card">
        <div className="section-title"><span><span className="accent-bar" />Hoy</span><span>{completedToday}/{habits.length}</span></div>
        <div style={{ display: 'grid', gap: 8 }}>
          {habits.length === 0 && <span style={{ color: 'var(--muted)' }}>Creá tu primer hábito con +.</span>}
          {habits.map((h) => {
            const done = (byHabit[h.id] ?? new Set()).has(today)
            return (
              <button key={h.id} onClick={() => completionsApi.toggle(h.id, today, done)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 14px', borderRadius: 10,
                border: `1px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
                background: done ? 'var(--accent-soft)' : 'var(--bg)',
                color: 'var(--text)',
              }}>
                <span>{h.name}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{done ? '✓' : ''}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Progreso del mes */}
      <div className="card">
        <div className="section-title"><span><span className="accent-bar" />Progreso del mes</span></div>
        <ProgressChart labels={labels} values={cumulative} />
      </div>

      {/* Top hábitos */}
      <div className="card">
        <div className="section-title"><span><span className="accent-bar" />Top hábitos del mes</span></div>
        <div style={{ display: 'grid', gap: 12 }}>
          {top.length === 0 && <span style={{ color: 'var(--muted)' }}>Sin datos todavía.</span>}
          {top.map((r) => {
            const pct = Math.round(r.progress * 100)
            return (
              <div key={r.habit.id} style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span>{r.habit.name}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{pct}%</span>
                </div>
                <div className="pbar-track"><div className="pbar-fill" style={{ width: `${pct}%` }} /></div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
