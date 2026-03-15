import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/onboarding',
      },
    })
    if (error) {
      setError('No se pudo conectar con Google. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white items-center justify-center px-6">

      {/* Logo */}
      <div className="w-20 h-20 rounded-3xl bg-primary-600 flex items-center justify-center mb-6">
        <span className="text-4xl">🍳</span>
      </div>

      <h1 className="text-3xl font-display font-bold text-gray-900 mb-2 text-center">MiCocina</h1>
      <p className="text-gray-500 text-sm text-center mb-12 leading-relaxed">
        Tu app para manejar tu negocio<br />de comida casera
      </p>

      {/* Botón Google */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full max-w-sm flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-700 font-semibold text-base active:scale-95 transition-all shadow-sm hover:border-gray-300 disabled:opacity-60"
      >
        {loading ? (
          <span className="animate-pulse">Conectando...</span>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-2.9-11.3-7.1l-6.6 5.1C9.5 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continuar con Google
          </>
        )}
      </button>

      {error && (
        <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
      )}

      <p className="text-xs text-gray-400 text-center mt-8 px-4 leading-relaxed">
        Al continuar aceptás nuestros Términos de Servicio y Política de Privacidad
      </p>

    </div>
  )
}
