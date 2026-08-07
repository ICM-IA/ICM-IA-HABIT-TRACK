import { daysInMonth } from './dates'

export interface YM { year: number; month: number }

/** 12 meses consecutivos desde la fecha de inicio (inclusive). */
export function trackingMonths(startYear: number, startMonth: number): YM[] {
  const out: YM[] = []
  let y = startYear
  let m = startMonth
  for (let i = 0; i < 12; i++) {
    out.push({ year: y, month: m })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return out
}

/** Colores por bloque de semana (Sem 1..5). */
export const WEEK_COLORS = ['#e11d2a', '#8b5cf6', '#3b82f6', '#f59e0b', '#22c55e']

export interface MonthWeek { index: number; label: string; days: number[]; color: string }

/** Divide el mes en bloques fijos de 7 días: Sem1=1-7, Sem2=8-14, ... Sem5=29-fin. */
export function monthWeeks(year: number, month: number): MonthWeek[] {
  const n = daysInMonth(year, month)
  const weeks: MonthWeek[] = []
  for (let start = 1; start <= n; start += 7) {
    const index = weeks.length
    const days: number[] = []
    for (let d = start; d < start + 7 && d <= n; d++) days.push(d)
    weeks.push({
      index,
      label: `Semana ${index + 1}`,
      days,
      color: WEEK_COLORS[index] ?? WEEK_COLORS[WEEK_COLORS.length - 1],
    })
  }
  return weeks
}
