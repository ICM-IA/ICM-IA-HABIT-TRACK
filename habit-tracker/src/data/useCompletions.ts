import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Completion } from '../lib/types'

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
    if (done) {
      await supabase.from('completions').delete().eq('habit_id', habitId).eq('date', date)
    } else {
      await supabase.from('completions').insert({ habit_id: habitId, date, user_id: userId })
    }
  }, [userId])

  const resetMonth = useCallback(async (year: number, month: number) => {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to = `${year}-${String(month).padStart(2, '0')}-31`
    await supabase.from('completions').delete().eq('user_id', userId).gte('date', from).lte('date', to)
  }, [userId])

  return { byHabit: groupByHabit(rows), rows, toggle, resetMonth }
}
