import type { Habit, Completion } from '../lib/types'

export function SettingsSheet({ habits, completions, year, month, onResetMonth, onSignOut, onClose }: {
  habits: Habit[]; completions: Completion[]
  year: number; month: number
  onResetMonth: () => Promise<void>
  onSignOut: () => void
  onClose: () => void
}) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ habits, completions }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `habitos-${year}-${String(month).padStart(2, '0')}.json`
    a.click(); URL.revokeObjectURL(url)
  }
  const resetMonth = async () => {
    if (confirm(`¿Borrar todas las marcas de ${month}/${year}? Esta acción no se puede deshacer.`)) {
      await onResetMonth()
    }
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      display: 'grid', placeItems: 'end center' }}>
      <div className="card" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 640, borderRadius: '16px 16px 0 0', display: 'grid', gap: 10 }}>
        <h3 style={{ margin: 0 }}>Ajustes</h3>
        <button className="card" onClick={exportJson}>Exportar datos (JSON)</button>
        <button className="card" style={{ color: 'var(--accent)' }} onClick={resetMonth}>Reset del mes</button>
        <button className="card" onClick={onSignOut}>Cerrar sesión</button>
      </div>
    </div>
  )
}
