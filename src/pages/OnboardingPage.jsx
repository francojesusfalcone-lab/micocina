import React, { useState } from 'react'
import { ChevronRight, ChefHat, Package, ClipboardList, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { db } from '../db'

const COUNTRIES = [
  { code: 'AR', name: 'Argentina',  currency: 'ARS', symbol: '$' },
  { code: 'MX', name: 'México',     currency: 'MXN', symbol: '$' },
  { code: 'CL', name: 'Chile',      currency: 'CLP', symbol: '$' },
  { code: 'CO', name: 'Colombia',   currency: 'COP', symbol: '$' },
  { code: 'PE', name: 'Perú',       currency: 'PEN', symbol: 'S/' },
  { code: 'UY', name: 'Uruguay',    currency: 'UYU', symbol: '$' },
  { code: 'PY', name: 'Paraguay',   currency: 'PYG', symbol: '₲' },
  { code: 'BO', name: 'Bolivia',    currency: 'BOB', symbol: 'Bs' },
  { code: 'EC', name: 'Ecuador',    currency: 'USD', symbol: '$' },
  { code: 'VE', name: 'Venezuela',  currency: 'VES', symbol: 'Bs.' },
  { code: 'CR', name: 'Costa Rica', currency: 'CRC', symbol: '₡' },
  { code: 'SV', name: 'El Salvador',currency: 'USD', symbol: '$' },
  { code: 'GT', name: 'Guatemala',  currency: 'GTQ', symbol: 'Q' },
  { code: 'HN', name: 'Honduras',   currency: 'HNL', symbol: 'L' },
  { code: 'NI', name: 'Nicaragua',  currency: 'NIO', symbol: 'C$' },
  { code: 'PA', name: 'Panamá',     currency: 'USD', symbol: '$' },
  { code: 'DO', name: 'Rep. Dominicana', currency: 'DOP', symbol: 'RD$' },
  { code: 'CU', name: 'Cuba',       currency: 'CUP', symbol: '$' },
  { code: 'ES', name: 'España',     currency: 'EUR', symbol: '€' },
  { code: 'OTHER', name: 'Otro país', currency: 'USD', symbol: '$' },
]

const STEPS = [
  {
    id: 'welcome',
    title: '¡Bienvenida a MiCocina!',
    subtitle: 'Tu app para manejar tu negocio de comida casera. Te ayudamos a saber cuánto ganás de verdad.',
    icon: ChefHat,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  {
    id: 'country',
    title: '¿De qué país sos?',
    subtitle: 'Así usamos tu moneda local y los precios se muestran como corresponde.',
    icon: Package,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'business',
    title: '¿Cómo se llama tu negocio?',
    subtitle: 'Puede ser tu nombre, el de tu cocina, o el apodo con el que te conocen en el barrio.',
    icon: ChefHat,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    id: 'ready',
    title: '¡Todo listo!',
    subtitle: 'Ya podés empezar. Te sugerimos cargar tus primeros ingredientes y crear tu primera receta.',
    icon: CheckCircle,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { updateSettings, setOnboardingDone } = useAppStore()

  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)

  const current = STEPS[step]
  const Icon = current.icon

  async function handleFinish() {
    const country = selectedCountry || COUNTRIES[0]
    updateSettings({
      businessName: businessName || 'Mi Cocina',
      country: country.code,
      currency: country.currency,
      currencySymbol: country.symbol,
    })

    // Persist to DB
    await db.settings.bulkPut([
      { key: 'businessName',   value: businessName || 'Mi Cocina' },
      { key: 'country',        value: country.code },
      { key: 'currency',       value: country.currency },
      { key: 'currencySymbol', value: country.symbol },
      { key: 'onboardingDone', value: true },
    ])

    setOnboardingDone(true)
    await new Promise(r => setTimeout(r, 300))
    window.location.href = "/"
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      handleFinish()
    }
  }

  const isLastStep = step === STEPS.length - 1
  const canProceed =
    step === 0 ? true :
    step === 1 ? !!selectedCountry :
    step === 2 ? businessName.trim().length >= 2 :
    true

  return (
    <div className="flex flex-col min-h-screen bg-white pt-safe pb-safe">

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= step
                ? 'bg-primary-500 w-6'
                : 'bg-surface-200 w-2'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-8 pb-6">

        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl ${current.bg} flex items-center justify-center mb-6 self-start`}>
          <Icon size={28} className={current.color} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-2 leading-tight">
          {current.title}
        </h1>
        <p className="text-gray-500 text-base leading-relaxed mb-8">
          {current.subtitle}
        </p>

        {/* Step-specific input */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto scrollbar-none -mx-2 px-2">
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setSelectedCountry(c); setTimeout(() => setStep(2), 300) }}
                  className={`px-3 py-3 rounded-xl text-left border-2 transition-all active:scale-95 ${
                    selectedCountry?.code === c.code
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.currency} {c.symbol}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="label">Nombre de tu negocio</label>
            <input
              type="text"
              placeholder="Ej: Las empanadas de Romi"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              maxLength={50}
              autoFocus
              className="input-field text-base"
            />
            <p className="text-xs text-gray-400 mt-2">
              Podés cambiarlo después en Configuración.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            {[
              { icon: Package,       label: 'Cargá tus ingredientes con sus precios' },
              { icon: ChefHat,       label: 'Creá tu primera receta y calculá el costo' },
              { icon: ClipboardList, label: 'Anotá tu primera comanda' },
            ].map(({ icon: I, label }, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <I size={16} className="text-primary-600" />
                </div>
                <p className="text-sm text-gray-700 font-medium">{label}</p>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Footer button */}
      <div className="px-6 pb-8">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
        >
          {isLastStep ? '¡Empezar!' : 'Continuar'}
          {!isLastStep && <ChevronRight size={18} />}
        </button>

        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full text-center text-sm text-gray-400 mt-3 py-2"
          >
            ← Volver
          </button>
        )}
      </div>

    </div>
  )
}
