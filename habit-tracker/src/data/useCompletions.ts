import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Completion } from '../lib/types'
import { daysInMonth } from '../logic/dates'

export function groupByHabit(rows: Completion[]): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {}
  for (const r of rows) {
    ;(out[r.habit_id] ??= new Set()).add(r.date)
  }
  return out
}

export function useCompletions(userId: string) {
  const [rows, setRows] = useState<Completion[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('completions').select('*').eq('user_id', userId)
    setRows((data as Completion[] | null) ?? [])
  }, [userId])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('completions-' + userId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'completions', filter: `user_id=eq.${userId}` },
        () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userId, load])

  const toggle = useCallback(async (habitId: string, date: string, done: boolean) => {
    // optimistic update
    setRows((prev) =>
      done
        ? prev.filter((r) => !(r.habit_id === habitId && r.date === date))
        : [...prev, { id: `optimistic-${habitId}-${date}`, user_id: userId, habit_id: habitId, date, created_at: '' }],
    )
    const { error } = done
      ? await supabase.from('completions').delete().eq('habit_id', habitId).eq('date', date)
      : await supabase.from('completions').upsert(
          { habit_id: habitId, date, user_id: userId },
          { onConflict: 'habit_id,date', ignoreDuplicates: true },
        )
    if (error) console.error('toggle failed', error)
    await load() // reconcile (also makes the app work if Realtime is not enabled)
  }, [userId, load])

  const resetMonth = useCallback(async (year: number, month: number) => {
    const mm = String(month).padStart(2, '0')
    const from = `${year}-${mm}-01`
    const to = `${year}-${mm}-${String(daysInMonth(year, month)).padStart(2, '0')}`
    const { error } = await supabase.from('completions').delete().eq('user_id', userId).gte('date', from).lte('date', to)
    if (error) console.error('resetMonth failed', error)
    await load()
  }, [userId, load])

  return { byHabit: groupByHabit(rows), rows, toggle, resetMonth }
}
