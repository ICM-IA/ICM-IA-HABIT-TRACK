import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useAuth } from './data/useAuth'
import { useHabits } from './data/useHabits'
import { useCompletions } from './data/useCompletions'
import { AuthGate } from './components/AuthGate'
import { TabBar, type Tab } from './components/TabBar'
import { HabitFormModal } from './components/HabitFormModal'
import { SettingsSheet } from './components/SettingsSheet'
import { Dashboard } from './screens/Dashboard'
import { DailyHabits } from './screens/DailyHabits'
import { WeeklyHabits } from './screens/WeeklyHabits'
import { MonthlyView } from './screens/MonthlyView'

export default function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  if (loading) return <div className="app">Cargando…</div>
  if (!user) return <AuthGate onSignIn={signInWithGoogle} />
  return <AuthedApp user={user} onSignOut={signOut} />
}

function AuthedApp({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const habitsApi = useHabits(user.id)
  const completionsApi = useCompletions(user.id)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <div className="app">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <strong style={{ fontSize: 18 }}>ICM-IA</strong>
            <span style={{ letterSpacing: 2, color: 'var(--accent)', fontSize: 11, marginLeft: 6 }}>HABIT TRACKER</span>
          </div>
          <button onClick={() => setShowSettings(true)} aria-label="Ajustes"
            style={{ background: 'none', border: 'none', fontSize: 20 }}>⚙️</button>
        </header>

        {tab === 'dashboard' && <Dashboard habitsApi={habitsApi} completionsApi={completionsApi} year={year} month={month} />}
        {tab === 'daily' && <DailyHabits habitsApi={habitsApi} completionsApi={completionsApi} year={year} month={month} />}
        {tab === 'weekly' && <WeeklyHabits habitsApi={habitsApi} completionsApi={completionsApi} year={year} month={month} />}
        {tab === 'monthly' && <MonthlyView habitsApi={habitsApi} completionsApi={completionsApi} year={year} month={month} onMonthChange={(y, m) => { setYear(y); setMonth(m) }} />}
      </div>

      <button className="btn-accent" onClick={() => setShowForm(true)} aria-label="Nuevo hábito"
        style={{ position: 'fixed', right: 16, bottom: 84, width: 56, height: 56, borderRadius: '50%', fontSize: 28, lineHeight: 1 }}>+</button>

      <TabBar active={tab} onChange={setTab} />

      {showForm && <HabitFormModal onClose={() => setShowForm(false)} onSave={habitsApi.create} />}
      {showSettings && (
        <SettingsSheet
          habits={habitsApi.habits}
          completions={completionsApi.rows}
          year={year} month={month}
          onResetMonth={() => completionsApi.resetMonth(year, month)}
          onSignOut={onSignOut}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  )
}
