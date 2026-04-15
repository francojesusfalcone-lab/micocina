import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [imgError, setImgError] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://www.micuchina.com/auth/callback',
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="flex flex-col min-h-screen bg-primary-700">
      {/* Círculos decorativos */}
      <div className="fixed top-0 left-0 w-72 h-72 rounded-full bg-primary-600/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed top-0 right-0 w-48 h-48 rounded-full bg-primary-800/30 translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Hero top — logo grande */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 relative">
        {/* Logo muy grande */}
        <div className="w-44 h-44 mb-5">
          {!imgError ? (
            <img
              src="/logo-icon.png"
              alt="MiCuchina"
              className="w-full h-full object-contain drop-shadow-2xl"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-44 h-44 rounded-[2.5rem] bg-primary-600 border-4 border-gold-400/60 flex items-center justify-center shadow-2xl">
              <span className="text-8xl">🍳</span>
            </div>
          )}
        </div>

        {/* Nombre */}
        <h1 className="text-5xl font-display font-bold mb-1">
          <span className="text-white">Mi</span>
          <span className="text-gold-400">Cu</span>
          <span className="text-white">china</span>
        </h1>
        <p className="text-primary-200 text-sm text-center leading-relaxed mt-2">
          Tu cocina, tu negocio 🍳
        </p>

        {/* Stats decorativas */}
        <div className="flex gap-8 mt-10 bg-primary-800/40 rounded-2xl px-8 py-4">
          <div className="text-center">
            <p className="text-gold-400 text-2xl font-display font-bold">💰</p>
            <p className="text-primary-200 text-xs mt-1">Ganancias</p>
          </div>
          <div className="w-px bg-primary-600" />
          <div className="text-center">
            <p className="text-white text-2xl font-display font-bold">📦</p>
            <p className="text-primary-200 text-xs mt-1">Stock</p>
          </div>
          <div className="w-px bg-primary-600" />
          <div className="text-center">
            <p className="text-white text-2xl font-display font-bold">📋</p>
            <p className="text-primary-200 text-xs mt-1">Comandas</p>
          </div>
        </div>
      </div>

      {/* Sección blanca con login */}
      <div className="px-6 py-8 bg-white rounded-t-3xl shadow-2xl">
        <h2 className="text-xl font-display font-bold text-app-primary mb-1">¡Bienvenida! 👋</h2>
        <p className="text-sm text-app-muted mb-6">Ingresá con tu cuenta de Google para continuar</p>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-app rounded-2xl px-6 py-4 text-app-secondary font-semibold text-base active:scale-95 transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <p className="text-xs text-app-faint mt-5 text-center leading-relaxed">
          Al continuar aceptás nuestros Términos de Servicio y Política de Privacidad
        </p>
      </div>
    </div>
  )
}
