import type { useHabits } from '../data/useHabits'
import type { useGoals } from '../data/useGoals'
import type { useSettings } from '../data/useSettings'
import { trackingMonths } from '../logic/tracking'
import { daysInMonth } from '../logic/dates'

type Props = {
  habitsApi: ReturnType<typeof useHabits>
  goalsApi: ReturnType<typeof useGoals>
  settingsApi: ReturnType<typeof useSettings>
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_LONG = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function Objetivos({ habitsApi, goalsApi, settingsApi }: Props) {
  const { habits } = habitsApi
  const { targetFor, setTarget } = goalsApi
  const { settings, setStart } = settingsApi
  const months = trackingMonths(settings.startYear, settings.startMonth)
  const endYm = months[11]

  const monthTotal = (i: number) => habits.reduce((a, h) => a + targetFor(h, months[i].year, months[i].month), 0)
  const habitTotal = (h: typeof habits[number]) => months.reduce((a, m) => a + targetFor(h, m.year, m.month), 0)
  const grandTotal = months.reduce((a, _, i) => a + monthTotal(i), 0)
  const maxBar = Math.max(1, ...months.map((_, i) => monthTotal(i)))

  const hasOverGoal = habits.some((h) => h.type === 'daily' &&
    months.some((m) => targetFor(h, m.year, m.month) > daysInMonth(m.year, m.month)))

  const stickyLeft: React.CSSProperties = { position: 'sticky', left: 0, background: 'var(--card)', zIndex: 1 }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Cabecera + fecha de inicio + meta total */}
      <div className="card" style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(200px, 1fr) auto', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{settings.startYear} – {endYm.year}</div>
          <div style={{ letterSpacing: 3, color: 'var(--accent)', fontSize: 12 }}>FOCUS HABIT TRACKER</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Fecha de inicio:</span>
            <select value={settings.startMonth} onChange={(e) => setStart(settings.startYear, Number(e.target.value))}
              className="card" style={{ padding: '6px 8px', color: 'var(--text)' }}>
              {MONTHS_LONG.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={settings.startYear} onChange={(e) => setStart(Number(e.target.value), settings.startMonth)}
              className="card" style={{ padding: '6px 8px', color: 'var(--text)', width: 84 }} />
          </div>
        </div>
        <div className="stat" style={{ minWidth: 150 }}>
          <div className="stat-label">Metas a alcanzar</div>
          <div className="stat-value is-accent">{grandTotal.toLocaleString('es-AR')}</div>
        </div>
      </div>

      {/* Barras por mes */}
      <div className="card">
        <div className="section-title"><span><span className="accent-bar" />Objetivos por mes</span></div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 120, overflowX: 'auto', paddingTop: 8 }}>
          {months.map((m, i) => {
            const t = monthTotal(i)
            return (
              <div key={`${m.year}-${m.month}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 44, flex: 1 }}>
                <span style={{ fontSize: 10, color: t ? 'var(--accent)' : 'var(--muted)' }}>{t}</span>
                <div style={{ width: '70%', height: `${(t / maxBar) * 80}px`, background: 'var(--accent)', borderRadius: '4px 4px 0 0', minHeight: t ? 3 : 0 }} />
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{MONTHS[m.month - 1]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {hasOverGoal && (
        <div className="card" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', fontSize: 13, textAlign: 'center' }}>
          ¡ATENCIÓN! Al menos un hábito tiene más objetivos que días en el mes.
        </div>
      )}

      {/* Grilla editable */}
      {habits.length === 0
        ? <p style={{ color: 'var(--muted)' }}>Creá tu primer hábito con el botón + para cargar objetivos.</p>
        : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: 12, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ ...stickyLeft, textAlign: 'left', padding: '12px 14px', color: 'var(--muted)', minWidth: 150, borderBottom: '1px solid var(--border)' }}>Hábito</th>
                    {months.map((m) => (
                      <th key={`${m.year}-${m.month}`} style={{ padding: '10px 6px', color: 'var(--muted)', minWidth: 56, borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                        {MONTHS[m.month - 1]}<br /><span style={{ fontSize: 9, opacity: 0.6 }}>{m.year}</span>
                      </th>
                    ))}
                    <th style={{ padding: '10px 12px', color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((h) => (
                    <tr key={h.id}>
                      <td style={{ ...stickyLeft, padding: '6px 14px', borderBottom: '1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>{h.name}</td>
                      {months.map((m) => {
                        const v = targetFor(h, m.year, m.month)
                        const over = h.type === 'daily' && v > daysInMonth(m.year, m.month)
                        return (
                          <td key={`${m.year}-${m.month}`} style={{ padding: 3, borderBottom: '1px solid var(--border-soft)', textAlign: 'center' }}>
                            <input type="number" min={0} value={v}
                              onChange={(e) => setTarget(h.id, m.year, m.month, Math.max(0, Number(e.target.value)))}
                              style={{
                                width: 44, textAlign: 'center', padding: '5px 2px', borderRadius: 6,
                                background: 'var(--bg)', color: over ? 'var(--accent)' : 'var(--text)',
                                border: `1px solid ${over ? 'var(--accent)' : 'var(--border)'}`,
                              }} />
                          </td>
                        )
                      })}
                      <td style={{ padding: '6px 12px', textAlign: 'center', color: 'var(--accent)', fontWeight: 700, borderBottom: '1px solid var(--border-soft)' }}>{habitTotal(h)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...stickyLeft, padding: '10px 14px', color: 'var(--muted)', fontWeight: 700 }}>TOTAL</td>
                    {months.map((m, i) => (
                      <td key={`${m.year}-${m.month}`} style={{ padding: '10px 6px', textAlign: 'center', color: 'var(--muted)' }}>{monthTotal(i)}</td>
                    ))}
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--accent)', fontWeight: 700 }}>{grandTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  )
}
