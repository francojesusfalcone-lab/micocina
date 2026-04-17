import React, { useState } from 'react'
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
  const [businessName, setBusinessName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imgError, setImgError] = useState(false)

  const canProceed = !!selectedCountry

  async function handleStart() {
    if (!canProceed || saving) return
    setSaving(true)
    const country = selectedCountry
    const name = businessName.trim() || 'Mi Cocina'
    updateSettings({
      businessName: name,
      country: country.code,
      currency: country.currency,
      currencySymbol: country.symbol,
    })
    await db.settings.bulkPut([
      { key: 'businessName',   value: name },
      { key: 'country',        value: country.code },
      { key: 'currency',       value: country.currency },
      { key: 'currencySymbol', value: country.symbol },
      { key: 'onboardingDone', value: true },
    ])
    setOnboardingDone(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-4">

        {/* Logo + título */}
        <div className="flex items-center gap-3 mb-6">
          {!imgError ? (
            <img src="/logo-icon.png" alt="MiCuchina" className="w-12 h-12 object-contain" onError={() => setImgError(true)} />
          ) : (
            <span className="text-4xl">🍳</span>
          )}
          <div>
            <h1 className="text-2xl font-display font-bold text-app-primary">¡Bienvenida!</h1>
            <p className="text-sm text-app-muted">Configuremos tu negocio</p>
          </div>
        </div>

        {/* Nombre del negocio */}
        <div className="mb-6">
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
          <p className="text-xs text-primary-500 mt-2 font-medium">💡 No necesitás cargar todo — podés empezar con un solo producto</p>
        </div>

        {/* País */}
        <div className="mb-6">
          <label className="label">¿De qué país sos? *</label>
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

      {/* CTA fijo abajo */}
      <div className="px-6 pb-8 pt-2 shrink-0 border-t border-app bg-white">
        <button
          onClick={handleStart}
          disabled={!canProceed || saving}
          className="btn-primary w-full py-4 text-base disabled:opacity-50"
        >
          {saving ? 'Guardando...' : '¡Empezar!'}
        </button>
      </div>
    </div>
  )
}
