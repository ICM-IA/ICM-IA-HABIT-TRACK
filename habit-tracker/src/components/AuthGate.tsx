type Props = { onSignIn: () => void }
export function AuthGate({ onSignIn }: Props) {
  return (
    <div className="app" style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 320 }}>
        <h1 style={{ marginTop: 0 }}>ICM-IA</h1>
        <p style={{ margin: '0 0 4px', letterSpacing: 2, color: 'var(--accent)', fontSize: 13 }}>HABIT TRACKER</p>
        <p style={{ color: 'var(--muted)' }}>Seguí tus hábitos, sincronizados en todos tus dispositivos.</p>
        <button className="btn-accent" style={{ width: '100%' }} onClick={onSignIn}>
          Entrar con Google
        </button>
      </div>
    </div>
  )
}
