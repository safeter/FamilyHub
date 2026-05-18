import { useState } from 'react'
import { api } from '../api/client'
import { useStore } from '../store'

export default function Login() {
  const setAuth = useStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post<{ token: string; user: Parameters<typeof setAuth>[0] }>(
        '/auth/login',
        { email, password }
      )
      setAuth(data.user, data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold">FamilyHub</h1>
          <p className="text-white/50 text-sm mt-1">Calendrier familial partagé</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary"
              placeholder="moi@familyhub.app"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-xl py-3 font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs text-white/30 mt-6">
          moi@familyhub.app · conjointe@familyhub.app
          <br />
          Mot de passe : familyhub123
        </p>
      </div>
    </div>
  )
}
