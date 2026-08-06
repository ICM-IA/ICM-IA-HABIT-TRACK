import { useAuth } from './data/useAuth'
import { AuthGate } from './components/AuthGate'

export default function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  if (loading) return <div className="app">Cargando…</div>
  if (!user) return <AuthGate onSignIn={signInWithGoogle} />
  return (
    <div className="app">
      <p>Sesión iniciada como {user.email}</p>
      <button onClick={signOut}>Cerrar sesión</button>
    </div>
  )
}
