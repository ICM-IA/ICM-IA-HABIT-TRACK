export type Tab = 'dashboard' | 'daily' | 'weekly' | 'monthly'
const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'daily', label: 'Diarios', icon: '📅' },
  { id: 'weekly', label: 'Semanales', icon: '🗓️' },
  { id: 'monthly', label: 'Mensual', icon: '📆' },
]
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
      background: 'var(--card)', borderTop: '1px solid var(--border)',
    }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, background: 'none', border: 'none', padding: '10px 0',
          color: active === t.id ? 'var(--accent)' : 'var(--muted)', fontSize: 12,
        }}>
          <div style={{ fontSize: 20 }}>{t.icon}</div>{t.label}
        </button>
      ))}
    </nav>
  )
}
