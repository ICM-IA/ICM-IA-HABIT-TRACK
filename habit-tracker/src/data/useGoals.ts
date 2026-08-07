import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Habit } from '../lib/types'

interface GoalRow { habit_id: string; year: number; month: number; target: number }

const key = (habitId: string, year: number, month: number) => `${habitId}:${year}:${month}`

export function useGoals(userId: string) {
  // map "habitId:year:month" -> target override
  const [overrides, setOverrides] = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    const { data } = await supabase.from('habit_goals').select('habit_id, year, month, target').eq('user_id', userId)
    const map: Record<string, number> = {}
    for (const r of (data as GoalRow[] | null) ?? []) map[key(r.habit_id, r.year, r.month)] = r.target
    setOverrides(map)
  }, [userId])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('goals-' + userId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'habit_goals', filter: `user_id=eq.${userId}` },
        () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userId, load])

  /** Meta del hábito para ese mes: override si existe, si no la meta base del hábito. */
  const targetFor = useCallback((habit: Habit, year: number, month: number): number => {
    const o = overrides[key(habit.id, year, month)]
    return o ?? habit.goal
  }, [overrides])

  const setTarget = useCallback(async (habitId: string, year: number, month: number, target: number) => {
    setOverrides((prev) => ({ ...prev, [key(habitId, year, month)]: target })) // optimistic
    const { error } = await supabase.from('habit_goals').upsert(
      { user_id: userId, habit_id: habitId, year, month, target },
      { onConflict: 'habit_id,year,month' },
    )
    if (error) console.error('setTarget failed', error)
  }, [userId])

  return { overrides, targetFor, setTarget }
}
