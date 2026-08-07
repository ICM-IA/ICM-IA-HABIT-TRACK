import { monthDates, toISODate } from '../logic/dates'

const WD = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

export function HabitCalendar({ year, month, done, onToggle }: {
  year: number; month: number; done: Set<string>; color?: string
  onToggle: (date: string, isDone: boolean) => void
}) {
  const today = toISODate(new Date())
  const dates = monthDates(year, month)
  // leading blanks so the 1st lands on the right weekday column (Monday-first)
  const firstDow = (new Date(dates[0] + 'T00:00:00').getDay() + 6) % 7
  return (
    <div style={{ marginTop: 12, maxWidth: 336 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', gap: 6, marginBottom: 6 }}>
        {WD.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', gap: 6 }}>
        {Array.from({ length: firstDow }, (_, i) => <div key={`b${i}`} />)}
        {dates.map((iso) => {
          const isDone = done.has(iso)
          const day = Number(iso.slice(-2))
          return (
            <button key={iso} onClick={() => onToggle(iso, isDone)} style={{
              width: 40, height: 40, borderRadius: 8, fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${isDone ? 'var(--accent)' : iso === today ? 'var(--accent)' : 'var(--border)'}`,
              background: isDone ? 'var(--accent)' : 'var(--bg)',
              color: isDone ? '#fff' : 'var(--muted)',
            }}>{day}</button>
          )
        })}
      </div>
    </div>
  )
}
