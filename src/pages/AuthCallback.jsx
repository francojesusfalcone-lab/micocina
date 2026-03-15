import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase procesa el #access_token del hash automáticamente
    // Escuchamos el evento SIGNED_IN que dispara cuando está listo
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        navigate('/', { replace: true })
      }
    })

    // Timeout de seguridad — si en 5 segundos no hay sesión, volvemos al login
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      navigate('/login', { replace: true })
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 animate-pulse">
        <span className="text-white text-2xl">🍳</span>
      </div>
      <p className="text-primary-600 font-semibold text-sm">Iniciando sesión...</p>
    </div>
  )
}
