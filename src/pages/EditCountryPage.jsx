import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'

const COUNTRIES = [
  { code: 'AR', name: 'Argentina',       currency: 'ARS', symbol: '$' },
  { code: 'MX', name: 'México',          currency: 'MXN', symbol: '$' },
  { code: 'CL', name: 'Chile',           currency: 'CLP', symbol: '$' },
  { code: 'CO', name: 'Colombia',        currency: 'COP', symbol: '$' },
  { code: 'PE', name: 'Perú',            currency: 'PEN', symbol: 'S/' },
  { code: 'UY', name: 'Uruguay',         currency: 'UYU', symbol: '$' },
  { code: 'PY', name: 'Paraguay',        currency: 'PYG', symbol: '₲' },
  { code: 'BO', name: 'Bolivia',         currency: 'BOB', symbol: 'Bs' },
  { code: 'EC', name: 'Ecuador',         currency: 'USD', symbol: '$' },
  { code: 'VE', name: 'Venezuela',       currency: 'VES', symbol: 'Bs.' },
  { code: 'CR', name: 'Costa Rica',      currency: 'CRC', symbol: '₡' },
  { code: 'SV', name: 'El Salvador',     currency: 'USD', symbol: '$' },
  { code: 'GT', name: 'Guatemala',       currency: 'GTQ', symbol: 'Q' },
  { code: 'HN', name: 'Honduras',        currency: 'HNL', symbol: 'L' },
  { code: 'NI', name: 'Nicaragua',       currency: 'NIO', symbol: 'C$' },
  { code: 'PA', name: 'Panamá',          currency: 'USD', symbol: '$' },
  { code: 'DO', name: 'Rep. Dominicana', currency: 'DOP', symbol: 'RD$' },
  { code: 'CU', name: 'Cuba',            currency: 'CUP', symbol: '$' },
  { code: 'ES', name: 'España',          currency: 'EUR', symbol: '€' },
  { code: 'OTHER', name: 'Otro país',    currency: 'USD', symbol: '$' },
]

export default function EditCountryPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const addToast = useAppStore((s) => s.addToast)

  const [selected, setSelected] = useState(settings.country || 'AR')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const country = COUNTRIES.find((c) => c.code === selected)
    if (!country) return
    setSaving(true)
    try {
      await updateSettings({
        country: country.code,
        currency: country.currency,
        currencySymbol: country.symbol,
      })
      addToast({ type: 'success', message: 'País actualizado ✓' })
      navigate('/configuracion')
    } catch (e) {
      addToast({ type: 'error', message: 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col bg-surface-50">
      <PageHeader title="País y moneda" back />
      <div className="px-4 py-4 space-y-4">
        <div className="card p-0 overflow-hidden divide-y divide-surface-100">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelected(c.code)}
              className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${
                selected === c.code ? 'bg-primary-50' : 'bg-white active:bg-surface-50'
              }`}
            >
              <div className="text-left">
                <p className={`text-sm font-semibold ${selected === c.code ? 'text-primary-700' : 'text-gray-900'}`}>
                  {c.name}
                </p>
                <p className="text-xs text-gray-400">{c.currency} · {c.symbol}</p>
              </div>
              {selected === c.code && (
                <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-4 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar país'}
        </button>
        <p className="text-center text-xs text-gray-300 py-4">Desarrollado por Franco Falcone</p>
      </div>
    </div>
  )
}
