import React, { useState } from 'react'
import {
  Crown, Check, X, ChevronLeft, Zap, Users,
  Wallet, ShoppingBag, BarChart2, Shield,
  Sparkles, AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { db } from '../db'
import { createMPPreference, activatePlanLocally, getPlanPrice } from '../lib/mercadopago'

const FEATURES = [
  { icon: ShoppingBag, label: 'Recetas',                    free: 'Hasta 8',     premium: 'Ilimitadas' },
  { icon: null,        label: 'Comandas por dia',            free: 'Hasta 25',    premium: 'Ilimitadas' },
  { icon: Sparkles,    label: 'Analisis IA de costos',       free: false,         premium: true },
  { icon: BarChart2,   label: 'Sugerencia de precio optimo', free: false,         premium: true },
  { icon: null,        label: 'Reportes semanales/mensuales',free: false,         premium: true },
  { icon: Users,       label: 'CRM de clientes',             free: false,         premium: true },
  { icon: null,        label: 'Historial de costos',         free: false,         premium: true },
  { icon: Wallet,      label: 'Gastos fijos',                free: false,         premium: true },
  { icon: Shield,      label: 'Soporte prioritario',         free: false,         premium: true },
]

function FeatureValue({ val }) {
  if (val === true)  return <Check size={16} className="text-primary-600 mx-auto" />
  if (val === false) return <X     size={16} className="text-gray-300 mx-auto" />
  return <span className="text-sm font-medium text-gray-700">{val}</span>
}

function SuccessScreen({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 text-center gap-5 py-16">
      <div className="w-20 h-20 rounded-3xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center">
        <Crown size={36} className="text-primary-600" />
      </div>
      <h2 className="text-2xl font-display font-bold text-gray-900">¡Bienvenida a Premium! 🎉</h2>
      <p className="text-sm text-gray-500 leading-relaxed">Tu pago fue aprobado. Ya tenés acceso a todas las funciones Premium.</p>
      <button onClick={() => navigate('/', { replace: true })} className="w-full btn-primary py-4 text-base">
        Ir al dashboard
      </button>
    </div>
  )
}

function PendingScreen({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 text-center gap-5 py-16">
      <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
        <AlertCircle size={36} className="text-amber-500" />
      </div>
      <h2 className="text-xl font-display font-bold text-gray-900">Pago pendiente</h2>
      <p className="text-sm text-gray-500 leading-relaxed">Tu pago está siendo procesado. Cuando se confirme, el plan se activa automáticamente.</p>
      <button onClick={() => navigate('/')} className="w-full btn-secondary py-3">Volver al inicio</button>
    </div>
  )
}

export default function PremiumPage() {
  const navigate  = useNavigate()
  const settings  = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())
  const setPlan   = useAppStore((s) => s.setPlan)
  const addToast  = useAppStore((s) => s.addToast)

  const [loading,      setLoading]      = useState(false)
  const [showDevPanel, setShowDevPanel] = useState(false)
  const [mpError,      setMpError]      = useState(null)

  const price = getPlanPrice(settings.country)

  // Retorno desde MP
  const urlParams  = new URLSearchParams(window.location.search)
  const mpStatus   = urlParams.get('status')
  const collection = urlParams.get('collection_status')

  if (mpStatus === 'approved' || collection === 'approved') {
    activatePlanLocally(db).then(() => { setPlan('premium') })
    return (
      <div className="flex flex-col min-h-full bg-white pt-safe">
        <div className="px-4 py-4 border-b border-surface-200"><h1 className="page-title">Premium</h1></div>
        <SuccessScreen navigate={navigate} />
      </div>
    )
  }

  if (mpStatus === 'pending') {
    return (
      <div className="flex flex-col min-h-full bg-white pt-safe">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-200">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center active:scale-95"><ChevronLeft size={20} className="text-gray-600" /></button>
          <h1 className="page-title">Premium</h1>
        </div>
        <PendingScreen navigate={navigate} />
      </div>
    )
  }

  // Ya es premium
  if (isPremium) {
    return (
      <div className="flex flex-col min-h-full bg-surface-50 pt-safe">
        <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-surface-200">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center active:scale-95"><ChevronLeft size={20} className="text-gray-600" /></button>
          <h1 className="page-title">Premium activo</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5 pb-24">
          <div className="w-20 h-20 rounded-3xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center">
            <Crown size={36} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">¡Ya sos Premium! ⭐</h2>
            <p className="text-sm text-gray-500">Tenés acceso a todas las funciones. Gracias por apoyar MiCocina.</p>
          </div>
          <button onClick={() => navigate('/')} className="w-full btn-primary py-4">Ir al dashboard</button>
          <button
            onClick={async () => {
              await db.user.put({ key: 'plan', value: 'free' })
              setPlan('free')
              addToast({ type: 'success', message: 'Plan cambiado a Free (testing)' })
              navigate('/')
            }}
            className="text-xs text-gray-300"
          >
            [dev] Volver a Free
          </button>
        </div>
      </div>
    )
  }

  // Checkout
  async function handleCheckout() {
    setLoading(true)
    setMpError(null)
    try {
      const pref = await createMPPreference(settings)
      const url  = import.meta.env.VITE_MP_ENV === 'production' ? pref.initPoint : pref.sandbox
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No se recibió URL de pago de MercadoPago')
      }
    } catch (err) {
      setMpError(err.message)
      setLoading(false)
    }
  }

  async function handleDevActivate() {
    setLoading(true)
    try {
      await activatePlanLocally(db)
      setPlan('premium')
      addToast({ type: 'success', message: '✅ Premium activado (modo dev)' })
      navigate('/', { replace: true })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white pt-safe pb-safe">

      <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-200">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center active:scale-95 transition-all">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="page-title">Premium</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none pb-8">

        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Crown size={26} className="text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">MiCocina Premium</h2>
          <p className="text-amber-100 text-sm mb-5">Sabe exactamente cuanto ganas con cada plato. La IA te sugiere el precio ideal.</p>
          <div className="bg-white/20 rounded-2xl px-6 py-4 inline-block">
            <div className="flex items-end justify-center gap-2">
              <span className="text-4xl font-display font-bold text-white">USD 5</span>
              <span className="text-amber-100 text-sm mb-1">/mes</span>
            </div>
            <p className="text-amber-200 text-xs mt-1">MercadoPago convierte a tu moneda local · Cancelás cuando querés</p>
          </div>
        </div>

        {/* Features table */}
        <div className="px-4 mt-6">
          <div className="bg-surface-50 rounded-2xl overflow-hidden border border-surface-200">
            <div className="grid grid-cols-3 bg-surface-100">
              <div className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Función</div>
              <div className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Gratis</div>
              <div className="px-3 py-3 text-xs font-bold text-amber-700 uppercase tracking-wide text-center bg-amber-50">Premium</div>
            </div>
            {FEATURES.map((f, i) => (
              <div key={i} className={`grid grid-cols-3 border-t border-surface-200 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}`}>
                <div className="px-3 py-3 text-sm text-gray-700 font-medium flex items-center gap-1.5">
                  {f.icon && <f.icon size={13} className="text-gray-400 shrink-0" />}
                  {f.label}
                </div>
                <div className="px-3 py-3 text-center flex items-center justify-center"><FeatureValue val={f.free} /></div>
                <div className="px-3 py-3 text-center flex items-center justify-center bg-amber-50/30"><FeatureValue val={f.premium} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* MP Error */}
        {mpError && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Error al procesar el pago</p>
              <p className="text-xs text-red-500 mt-1">{mpError}</p>
              <p className="text-xs text-red-400 mt-2">Verificá que las credenciales MP estén en el archivo .env</p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-4 mt-6 space-y-3">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-[#009EE3] text-white font-display font-bold text-lg py-4 rounded-2xl active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {loading ? <span className="animate-pulse">Conectando...</span> : <><span className="text-2xl">💙</span> Pagar con MercadoPago</>}
          </button>
          <div className="flex items-center gap-2 justify-center">
            <Shield size={12} className="text-gray-400" />
            <p className="text-xs text-gray-400">Pago 100% seguro via MercadoPago · USD 5/mes</p>
          </div>
        </div>

        {/* Dev panel */}
        <div className="px-4 mt-8">
          <button onClick={() => setShowDevPanel(!showDevPanel)} className="text-xs text-gray-300 underline w-full text-center">
            [Opciones de desarrollo]
          </button>
          {showDevPanel && (
            <div className="mt-3 p-4 bg-surface-50 rounded-2xl border border-surface-200 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Dev Mode</p>
              <p className="text-xs text-gray-500">Configurá tu archivo <code className="bg-surface-200 px-1 rounded">.env</code>:</p>
              <div className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded-xl leading-relaxed">
                VITE_MP_PUBLIC_KEY=APP_USR-xxx<br/>
                VITE_MP_ACCESS_TOKEN=APP_USR-xxx<br/>
                VITE_MP_ENV=sandbox
              </div>
              <p className="text-xs text-gray-400">
                Credenciales en{' '}
                <a href="https://www.mercadopago.com.ar/developers/panel" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  mercadopago.com/developers
                </a>
              </p>
              <div className="border-t border-surface-200 pt-3">
                <p className="text-xs text-gray-500 mb-2">Activar Premium sin pago (testing):</p>
                <button
                  onClick={handleDevActivate}
                  disabled={loading}
                  className="w-full bg-primary-600 text-white text-sm font-bold py-2.5 rounded-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  ✅ Activar Premium (sin pago real)
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 px-8 leading-relaxed">
          Al suscribirte aceptás los Términos de Servicio. Podés cancelar en cualquier momento desde tu cuenta de MercadoPago.
        </p>

      </div>
    </div>
  )
}
