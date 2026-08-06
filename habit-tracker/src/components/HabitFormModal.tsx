import { useState } from 'react'
import type { HabitType } from '../lib/types'
import type { HabitInput } from '../data/useHabits'

const COLORS = ['#e11d2a', '#ff7a00', '#ffd000', '#39d353', '#3aa0ff', '#a259ff']

export function HabitFormModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (input: HabitInput) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<HabitType>('daily')
  const [goal, setGoal] = useState(20)
  const [color, setColor] = useState(COLORS[0])

  const save = async () => {
    if (!name.trim()) return
    await onSave({ name: name.trim(), type, goal, color })
    onClose()
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      display: 'grid', placeItems: 'end center',
    }}>
      <div className="card" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 640, borderRadius: '16px 16px 0 0' }}>
        <h3 style={{ marginTop: 0 }}>Nuevo hábito</h3>
        <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: 12, marginBottom: 12, background: 'var(--bg)',
            color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['daily', 'weekly'] as HabitType[]).map((t) => (
            <button key={t} onClick={() => { setType(t); if (t === 'weekly') setGoal((g) => Math.min(g, 7)) }} style={{
              flex: 1, padding: 10, borderRadius: 10, border: '1px solid var(--border)',
              background: type === t ? 'var(--accent)' : 'var(--bg)',
              color: type === t ? '#fff' : 'var(--text)',
            }}>{t === 'daily' ? 'Diario' : 'Semanal'}</button>
          ))}
        </div>
        <label style={{ color: 'var(--muted)', fontSize: 13 }}>
          Meta ({type === 'daily' ? 'días por mes' : 'días por semana'})
        </label>
        <input type="number" min={1} max={type === 'weekly' ? 7 : 31} value={goal}
          onChange={(e) => setGoal(Math.max(1, Math.min(type === 'weekly' ? 7 : 31, Number(e.target.value))))}
          style={{ width: '100%', padding: 12, margin: '6px 0 12px', background: 'var(--bg)',
            color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={c} style={{
              width: 28, height: 28, borderRadius: '50%', background: c,
              border: color === c ? '2px solid #fff' : '2px solid transparent',
            }} />
          ))}
        </div>
        <button className="btn-accent" style={{ width: '100%' }} onClick={save}>Guardar</button>
      </div>
    </div>
  )
}
