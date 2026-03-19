import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sliders } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'

const OPTIONS = [1, 2, 5, 10, 15, 20, 30, 50]

export default function EditCapacityPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const addToast = useAppStore((s) => s.addToast)

  const [capacity, setCapacity] = useState(settings.productionCapacity || 10)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateSettings({ productionCapacity: Number(capacity) })
      addToast({ type: 'success', message: 'Capacidad actualizada ✓' })
      navigate('/configuracion')
    } catch (e) {
      addToast({ type: 'error', message: 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col bg-app">
      <PageHeader title="Capacidad de producción" back />
      <div className="px-4 py-6 space-y-4">
        <div className="card space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-surface-100">
            <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center">
              <Sliders size={18} className="text-app-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-app-secondary">¿Cuántos platos podés preparar a la vez?</p>
              <p className="text-xs text-app-faint mt-0.5">Esto ayuda a organizar tus comandas activas.</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setCapacity(opt)}
                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                  capacity === opt
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-app bg-white text-gray-600'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div>
            <label className="label">O ingresá un número personalizado</label>
            <input
              type="text"
              inputMode="numeric"
              min="1"
              max="200"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="input-field"
            />
          </div>

          <div className="bg-app rounded-xl px-3 py-2.5">
            <p className="text-xs text-app-muted">
              Capacidad actual: <strong>{capacity} plato{capacity !== 1 ? 's' : ''} simultáneo{capacity !== 1 ? 's' : ''}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !capacity || capacity < 1}
          className="btn-primary w-full py-4 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar capacidad'}
        </button>
        <p className="text-center text-xs text-gray-300 py-4">Desarrollado por Franco Falcone</p>
      </div>
    </div>
  )
}
