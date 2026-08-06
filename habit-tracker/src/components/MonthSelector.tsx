const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
export function MonthSelector({ year, month, onChange }: {
  year: number; month: number; onChange: (year: number, month: number) => void
}) {
  const prev = () => month === 1 ? onChange(year - 1, 12) : onChange(year, month - 1)
  const next = () => month === 12 ? onChange(year + 1, 1) : onChange(year, month + 1)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <button onClick={prev} className="card" style={{ padding: '6px 12px' }}>‹</button>
      <strong>{MONTHS[month - 1]} {year}</strong>
      <button onClick={next} className="card" style={{ padding: '6px 12px' }}>›</button>
    </div>
  )
}
