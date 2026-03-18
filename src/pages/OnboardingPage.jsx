import React, { useState } from 'react'
import { ChevronRight, ChefHat } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { db } from '../db'

const COUNTRIES = [
  { code: 'AR', name: 'Argentina',       currency: 'ARS', symbol: '$'   },
  { code: 'MX', name: 'Mexico',          currency: 'MXN', symbol: '$'   },
  { code: 'CL', name: 'Chile',           currency: 'CLP', symbol: '$'   },
  { code: 'CO', name: 'Colombia',        currency: 'COP', symbol: '$'   },
  { code: 'PE', name: 'Peru',            currency: 'PEN', symbol: 'S/'  },
  { code: 'UY', name: 'Uruguay',         currency: 'UYU', symbol: '$'   },
  { code: 'PY', name: 'Paraguay',        currency: 'PYG', symbol: 'Gs'  },
  { code: 'BO', name: 'Bolivia',         currency: 'BOB', symbol: 'Bs'  },
  { code: 'EC', name: 'Ecuador',         currency: 'USD', symbol: '$'   },
  { code: 'VE', name: 'Venezuela',       currency: 'VES', symbol: 'Bs.' },
  { code: 'CR', name: 'Costa Rica',      currency: 'CRC', symbol: 'col' },
  { code: 'SV', name: 'El Salvador',     currency: 'USD', symbol: '$'   },
  { code: 'GT', name: 'Guatemala',       currency: 'GTQ', symbol: 'Q'   },
  { code: 'HN', name: 'Honduras',        currency: 'HNL', symbol: 'L'   },
  { code: 'NI', name: 'Nicaragua',       currency: 'NIO', symbol: 'C$'  },
  { code: 'PA', name: 'Panama',          currency: 'USD', symbol: '$'   },
  { code: 'DO', name: 'Rep. Dominicana', currency: 'DOP', symbol: 'RD$' },
  { code: 'CU', name: 'Cuba',            currency: 'CUP', symbol: '$'   },
  { code: 'ES', name: 'Espana',          currency: 'EUR', symbol: 'EUR' },
  { code: 'OTHER', name: 'Otro pais',    currency: 'USD', symbol: '$'   },
]

const STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenida a MiCocina!',
    subtitle: 'Tu app para manejar tu negocio de comida casera. Te ayudamos a saber cuanto ganas de verdad.',
    icon: ChefHat,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  {
    id: 'setup',
    title: 'Contanos sobre tu negocio',
    subtitle: 'Con esto configuramos tu moneda y personalizamos la app.',
    icon: ChefHat,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
]

export default function OnboardingPage() {
  const { updateSettings, setOnboardingDone } = useAppStore()
  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)

  const current = STEPS[step]
  const Icon = current.icon
  const isLastStep = step === STEPS.length - 1
  const canProceed = step === 0 ? true : !!selectedCountry && businessName.trim().length >= 2

  async function handleFinish() {
    const country = selectedCountry || COUNTRIES[0]
    updateSettings({
      businessName: businessName.trim() || 'Mi Cocina',
      country: country.code,
      currency: country.currency,
      currencySymbol: country.symbol,
    })
    await db.settings.bulkPut([
      { key: 'businessName',   value: businessName.trim() || 'Mi Cocina' },
      { key: 'country',        value: country.code },
      { key: 'currency',       value: country.currency },
      { key: 'currencySymbol', value: country.symbol },
      { key: 'onboardingDone', value: true },
    ])
    setOnboardingDone(true)
  }

  function handleNext() {
    if (!isLastStep) {
      setStep(step + 1)
    } else {
      handleFinish()
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary-500 w-6' : 'bg-surface-200 w-2'}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-6 pt-8 pb-6 overflow-y-auto">
        <div className={`w-16 h-16 rounded-2xl ${current.bg} flex items-center justify-center mb-6 self-start shrink-0`}>
          <Icon size={28} className={current.color} />
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-2 leading-tight shrink-0">
          {current.title}
        </h1>
        <p className="text-gray-500 text-base leading-relaxed mb-8 shrink-0">
          {current.subtitle}
        </p>

        {step === 1 && (
          <div className="flex flex-col gap-6">
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
              <p className="text-xs text-gray-400 mt-1">Podes cambiarlo despues en Configuracion.</p>
            </div>
            <div>
              <label className="label mb-2">De que pais sos?</label>
              <div className="grid grid-cols-2 gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCountry(c)}
                    className={`px-3 py-3 rounded-xl text-left border-2 transition-all active:scale-95 ${selectedCountry?.code === c.code ? 'border-primary-500 bg-primary-50' : 'border-surface-200 bg-white hover:border-primary-300'}`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.currency} {c.symbol}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-8 shrink-0">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
        >
          {isLastStep ? 'Empezar!' : 'Continuar'}
          {!isLastStep && <ChevronRight size={18} />}
        </button>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="w-full text-center text-sm text-gray-400 mt-3 py-2">
            Volver
          </button>
        )}
      </div>
    </div>
  )
}
