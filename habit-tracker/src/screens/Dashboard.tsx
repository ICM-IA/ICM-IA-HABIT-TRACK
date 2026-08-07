import type { useHabits } from '../data/useHabits'
import type { useCompletions } from '../data/useCompletions'
import type { useGoals } from '../data/useGoals'
import type { useSettings } from '../data/useSettings'
import { ProgressChart } from '../components/ProgressChart'
import { monthCompletionCount } from '../logic/stats'
import { trackingMonths } from '../logic/tracking'

type Props = {
  habitsApi: ReturnType<typeof useHabits>
  completionsApi: ReturnType<typeof useCompletions>
  goalsApi: ReturnType<typeof useGoals>
  settingsApi: ReturnType<typeof useSettings>
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function Donut({ pct }: { pct: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const dash = c * Math.min(1, Math.max(0, pct / 100))
  return (
    <svg width="150" height="150" viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="66" cy="66" r={r} fill="none" stroke="var(--border)" strokeWidth="14" />
      <circle cx="66" cy="66" r={r} fill="none" stroke="var(--accent)" strokeWidth="14"
        strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
      <text x="66" y="62" textAnchor="middle" fill="var(--text)" fontSize="24" fontWeight="700"
        transform="rotate(90 66 66)">{pct.toFixed(1)}%</text>
      <text x="66" y="80" textAnchor="middle" fill="var(--muted)" fontSize="10"
        transform="rotate(90 66 66)">global</text>
    </svg>
  )
}

export function Dashboard({ habitsApi, completionsApi, goalsApi, settingsApi }: Props) {
  const habits = habitsApi.habits
  const byHabit = completionsApi.byHabit
  const { targetFor } = goalsApi
  const months = trackingMonths(settingsApi.settings.startYear, settingsApi.settings.startMonth)
  const endYear = months[11].year

  const doneOf = (h: typeof habits[number]) => byHabit[h.id] ?? new Set<string>()

  const terminadoMonth = (i: number) => habits.reduce((a, h) => a + monthCompletionCount(doneOf(h), months[i].year, months[i].month), 0)
  const objetivoMonth = (i: number) => habits.reduce((a, h) => a + targetFor(h, months[i].year, months[i].month), 0)

  const terminadoTotal = months.reduce((a, _, i) => a + terminadoMonth(i), 0)
  const objetivoTotal = months.reduce((a, _, i) => a + objetivoMonth(i), 0)
  const globalPct = objetivoTotal ? (terminadoTotal / objetivoTotal) * 100 : 0

  const monthPct = months.map((_, i) => {
    const o = objetivoMonth(i)
    return o ? Math.round((terminadoMonth(i) / o) * 100) : 0
  })

  // ranking anual por % de cumplimiento
  const ranked = habits.map((h) => {
    const done = months.reduce((a, m) => a + monthCompletionCount(doneOf(h), m.year, m.month), 0)
    const goal = months.reduce((a, m) => a + targetFor(h, m.year, m.month), 0)
    return { h, done, goal, pct: goal ? (done / goal) * 100 : 0 }
  }).sort((a, b) => b.pct - a.pct)
  const top = ranked.slice(0, 10)
  const maxGoal = Math.max(1, ...top.map((r) => r.goal))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Header + donut */}
      <div className="card" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'auto 1fr', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{settingsApi.settings.startYear} – {endYear}</div>
          <div style={{ letterSpacing: 3, color: 'var(--accent)', fontSize: 12, marginBottom: 8 }}>PANEL</div>
          <Donut pct={globalPct} />
        </div>
        <div>
          <div className="section-title"><span><span className="accent-bar" />Progreso mensual</span></div>
          <ProgressChart labels={months.map((m) => MONTHS[m.month - 1])} values={monthPct} />
        </div>
      </div>

      {/* Tiles */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat"><div className="stat-value">{habits.length}</div><div className="stat-label">Hábitos</div></div>
        <div className="stat"><div className="stat-value">{objetivoTotal.toLocaleString('es-AR')}</div><div className="stat-label">Objetivos</div></div>
        <div className="stat"><div className="stat-value is-accent">{terminadoTotal.toLocaleString('es-AR')}</div><div className="stat-label">Terminado</div></div>
      </div>

      {/* Tabla resumen mensual */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="section-title" style={{ padding: '14px 14px 0' }}><span><span className="accent-bar" />Resumen mensual</span></div>
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: 11, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'var(--card)', textAlign: 'left', padding: '8px 14px', color: 'var(--muted)', minWidth: 90 }} />
                {months.map((m) => (
                  <th key={`${m.year}-${m.month}`} style={{ padding: '8px 6px', color: 'var(--muted)', minWidth: 48 }}>
                    {MONTHS[m.month - 1]}<br /><span style={{ fontSize: 9, opacity: 0.6 }}>{m.year}</span>
                  </th>
                ))}
                <th style={{ padding: '8px 12px', color: 'var(--accent)' }}>Global</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['Terminado', (i: number) => terminadoMonth(i), terminadoTotal, 'var(--accent)'],
                ['Objetivo', (i: number) => objetivoMonth(i), objetivoTotal, 'var(--text)'],
                ['Restante', (i: number) => Math.max(0, objetivoMonth(i) - terminadoMonth(i)), Math.max(0, objetivoTotal - terminadoTotal), 'var(--muted)'],
              ] as const).map(([label, fn, total, color]) => (
                <tr key={label} style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--card)', padding: '8px 14px', color: 'var(--muted)' }}>{label}</td>
                  {months.map((m, i) => <td key={`${m.year}-${m.month}`} style={{ textAlign: 'center', padding: '8px 6px', color }}>{fn(i)}</td>)}
                  <td style={{ textAlign: 'center', padding: '8px 12px', color, fontWeight: 700 }}>{total.toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 */}
      <div className="card">
        <div className="section-title"><span><span className="accent-bar" />10 metas más alcanzadas</span></div>
        <div style={{ display: 'grid', gap: 12 }}>
          {top.length === 0 && <span style={{ color: 'var(--muted)' }}>Cargá objetivos y empezá a marcar para ver el ranking.</span>}
          {top.map((r) => (
            <div key={r.h.id} style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{r.h.name}</span>
                <span style={{ color: 'var(--muted)' }}>{r.done}/{r.goal} · <span style={{ color: 'var(--accent)' }}>{Math.round(r.pct)}%</span></span>
              </div>
              <div className="pbar-track" style={{ width: `${(r.goal / maxGoal) * 100}%`, minWidth: 40 }}>
                <div className="pbar-fill" style={{ width: `${Math.min(100, r.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
