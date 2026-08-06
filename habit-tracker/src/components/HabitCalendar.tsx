import { monthDates } from '../logic/dates'

export function HabitCalendar({ year, month, done, color, onToggle }: {
  year: number; month: number; done: Set<string>; color: string
  onToggle: (date: string, isDone: boolean) => void
}) {
  const dates = monthDates(year, month)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 8 }}>
      {dates.map((iso) => {
        const isDone = done.has(iso)
        const day = Number(iso.slice(-2))
        return (
          <button key={iso} onClick={() => onToggle(iso, isDone)} style={{
            aspectRatio: '1', borderRadius: 8, fontSize: 12,
            border: '1px solid var(--border)',
            background: isDone ? color : 'var(--bg)',
            color: isDone ? '#fff' : 'var(--muted)',
          }}>{day}</button>
        )
      })}
    </div>
  )
}
