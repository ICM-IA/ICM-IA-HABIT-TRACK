import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Habit, HabitType } from '../lib/types'

export interface HabitInput { name: string; type: HabitType; goal: number; color: string }

export function useHabits(userId: string) {
  const [habits, setHabits] = useState<Habit[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('habits').select('*').eq('archived', false).order('sort_order')
    setHabits((data as Habit[] | null) ?? [])
  }, [])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('habits-' + userId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
        () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userId, load])

  const create = useCallback(async (input: HabitInput) => {
    const { error } = await supabase.from('habits').insert({ ...input, user_id: userId, sort_order: habits.length })
    if (error) console.error('create habit failed', error)
    await load()
  }, [userId, habits.length, load])

  const archive = useCallback(async (id: string) => {
    const { error } = await supabase.from('habits').update({ archived: true }).eq('id', id)
    if (error) console.error('archive habit failed', error)
    await load()
  }, [load])

  return { habits, create, archive }
}
