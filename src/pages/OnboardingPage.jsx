import React, { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { db } from '../db'

const COUNTRIES = [
  { code: 'AR', name: 'Argentina',    flag: '🇦🇷', currency: 'ARS', symbol: '$'   },
  { code: 'MX', name: 'México',       flag: '🇲🇽', currency: 'MXN', symbol: '$'   },
  { code: 'CL', name: 'Chile',        flag: '🇨🇱', currency: 'CLP', symbol: '$'   },
  { code: 'CO', name: 'Colombia',     flag: '🇨🇴', currency: 'COP', symbol: '$'   },
  { code: 'PE', name: 'Perú',         flag: '🇵🇪', currency: 'PEN', symbol: 'S/'  },
  { code: 'UY', name: 'Uruguay',      flag: '🇺🇾', currency: 'UYU', symbol: '$'   },
  { code: 'PY', name: 'Paraguay',     flag: '🇵🇾', currency: 'PYG', symbol: 'Gs'  },
  { code: 'BO', name: 'Bolivia',      flag: '🇧🇴', currency: 'BOB', symbol: 'Bs'  },
  { code: 'EC', name: 'Ecuador',      flag: '🇪🇨', currency: 'USD', symbol: '$'   },
  { code: 'VE', name: 'Venezuela',    flag: '🇻🇪', currency: 'VES', symbol: 'Bs.' },
  { code: 'CR', name: 'Costa Rica',   flag: '🇨🇷', currency: 'CRC', symbol: 'col' },
  { code: 'ES', name: 'España',       flag: '🇪🇸', currency: 'EUR', symbol: '€'   },
  { code: 'OTHER', name: 'Otro país', flag: '🌍',  currency: 'USD', symbol: '$'   },
]

export default function OnboardingPage() {
  const { updateSettings, setOnboardingDone } = useAppStore()
  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imgError, setImgError] = useState(false)

  const isLastStep = step === 1
  // país requerido, nombre es opcional
  const canProceed = step === 0 ? true : !!selectedCountry

  async function handleFinish() {
    if (saving) return
    setSaving(true)
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

  async function handleNext() {
    if (isLastStep) {
      await handleFinish()
    } else {
      setStep(1)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {[0,1].map(i => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary-500 w-6' : 'bg-surface-200 w-2'}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-6 pt-8 pb-6 overflow-y-auto">
        {/* Logo */}
        <div className="self-start mb-6 shrink-0">
          {!imgError ? (
            <img
              src="/logo-icon.png"
              alt="MiCuchina"
              className="w-20 h-20 object-contain drop-shadow-md"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center">
              <span className="text-4xl">🍳</span>
            </div>
          )}
        </div>

        {step === 0 ? (
          <>
            <h1 className="text-2xl font-display font-bold text-app-primary mb-2">¡Bienvenida a MiCuchina!</h1>
            <p className="text-app-muted text-base leading-relaxed mb-8">Tu app para manejar tu negocio de comida casera.</p>
            <div className="flex flex-col gap-4">
              {[
                { emoji: '💰', text: 'Sabé exactamente cuánto ganás con cada plato' },
                { emoji: '📦', text: 'Controlá tu stock e ingredientes en tiempo real' },
                { emoji: '📋', text: 'Gestioná tus comandas del día fácilmente' },
                { emoji: '📊', text: 'Ve tus estadísticas de ventas y ganancias' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-app rounded-2xl px-4 py-3 border border-app">
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="text-sm font-medium text-app-secondary">{item.text}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-display font-bold text-app-primary mb-2">Contanos sobre tu negocio</h1>
            <p className="text-app-muted text-sm text-app-faint leading-relaxed mb-6">Con esto configuramos tu moneda y personalizamos la app.</p>
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
                <p className="text-xs text-app-faint mt-1">Podés cambiarlo después en Configuración.</p>
              </div>
              <div>
                <label className="label mb-3">¿De qué país sos?</label>
                <div className="grid grid-cols-2 gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setSelectedCountry(c)}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-left border-2 transition-all active:scale-95 ${
                        selectedCountry?.code === c.code
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-app bg-white'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{c.flag}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-app-primary truncate">{c.name}</p>
                        <p className="text-xs text-app-muted">{c.currency} {c.symbol}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="px-6 pb-8 shrink-0">
        <button
          onClick={handleNext}
          disabled={!canProceed || saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isLastStep ? '¡Empezar!' : 'Continuar'}
          {!isLastStep && !saving && <ChevronRight size={18} />}
        </button>
        {step > 0 && (
          <button onClick={() => setStep(0)} className="w-full text-center text-sm text-app-faint mt-3 py-2">
            Volver
          </button>
        )}
      </div>
    </div>
  )
}
