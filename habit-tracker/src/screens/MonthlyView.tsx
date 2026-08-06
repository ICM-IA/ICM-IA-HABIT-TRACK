import type { useHabits } from '../data/useHabits'
import type { useCompletions } from '../data/useCompletions'
import { MonthSelector } from '../components/MonthSelector'
import { monthDates } from '../logic/dates'

type Props = {
  habitsApi: ReturnType<typeof useHabits>
  completionsApi: ReturnType<typeof useCompletions>
  year: number; month: number
  onMonthChange: (year: number, month: number) => void
}

export function MonthlyView({ habitsApi, completionsApi, year, month, onMonthChange }: Props) {
  const dates = monthDates(year, month)
  const days = dates.map((d) => Number(d.slice(-2)))
  return (
    <div>
      <MonthSelector year={year} month={month} onChange={onMonthChange} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--bg)', textAlign: 'left' }}>Hábito</th>
              {days.map((d) => <th key={d} style={{ padding: 2, color: 'var(--muted)' }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {habitsApi.habits.map((h) => {
              const done = completionsApi.byHabit[h.id] ?? new Set<string>()
              return (
                <tr key={h.id}>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--bg)',
                    whiteSpace: 'nowrap', paddingRight: 8 }}>{h.name}</td>
                  {dates.map((iso) => {
                    const isDone = done.has(iso)
                    return (
                      <td key={iso} onClick={() => completionsApi.toggle(h.id, iso, isDone)}
                        style={{ width: 16, height: 16, textAlign: 'center', cursor: 'pointer',
                          background: isDone ? h.color : 'transparent',
                          border: '1px solid var(--border)' }}></td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
