export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** month is 1-based (1 = January). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** All ISO dates of a month; month is 1-based. */
export function monthDates(year: number, month: number): string[] {
  const n = daysInMonth(year, month)
  return Array.from({ length: n }, (_, i) => toISODate(new Date(year, month - 1, i + 1)))
}

/** ISO week key "YYYY-Www" with Monday as first day. */
export function weekKey(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const day = (d.getDay() + 6) % 7 // Mon=0..Sun=6
  const monday = new Date(d)
  monday.setDate(d.getDate() - day)
  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${thursday.getFullYear()}-W${String(week).padStart(2, '0')}`
}
