import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const key = (year: number, month: number) => `${year}:${month}`

export function useNotes(userId: string) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const load = useCallback(async () => {
    const { data } = await supabase.from('month_notes').select('year, month, text').eq('user_id', userId)
    const map: Record<string, string> = {}
    for (const r of (data as { year: number; month: number; text: string }[] | null) ?? []) map[key(r.year, r.month)] = r.text
    setNotes(map)
  }, [userId])

  useEffect(() => { load() }, [load])

  const textFor = useCallback((year: number, month: number) => notes[key(year, month)] ?? '', [notes])

  const setText = useCallback((year: number, month: number, text: string) => {
    const k = key(year, month)
    setNotes((prev) => ({ ...prev, [k]: text })) // optimistic
    clearTimeout(timers.current[k])
    timers.current[k] = setTimeout(async () => {
      const { error } = await supabase.from('month_notes').upsert(
        { user_id: userId, year, month, text, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,year,month' },
      )
      if (error) console.error('setText failed', error)
    }, 600) // debounce autosave
  }, [userId])

  return { textFor, setText }
}
