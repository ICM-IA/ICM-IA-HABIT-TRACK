import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Settings { startYear: number; startMonth: number }

export function useSettings(userId: string) {
  const now = new Date()
  const [settings, setSettings] = useState<Settings>({ startYear: now.getFullYear(), startMonth: now.getMonth() + 1 })
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle()
    if (data) setSettings({ startYear: data.start_year, startMonth: data.start_month })
    setLoaded(true)
  }, [userId])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('settings-' + userId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: `user_id=eq.${userId}` },
        () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userId, load])

  const setStart = useCallback(async (startYear: number, startMonth: number) => {
    setSettings({ startYear, startMonth }) // optimistic
    const { error } = await supabase.from('settings').upsert(
      { user_id: userId, start_year: startYear, start_month: startMonth, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    if (error) console.error('setStart failed', error)
  }, [userId])

  return { settings, loaded, setStart }
}
