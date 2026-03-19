import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'

export default function EditBusinessNamePage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const addToast = useAppStore((s) => s.addToast)

  const [name, setName] = useState(settings.businessName || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateSettings({ businessName: name.trim() })
      addToast({ type: 'success', message: 'Nombre actualizado ✓' })
      navigate('/configuracion')
    } catch (e) {
      addToast({ type: 'error', message: 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col bg-app">
      <PageHeader title="Nombre del negocio" back />
      <div className="px-4 py-6 space-y-4">
        <div className="card space-y-3">
          <div className="flex items-center gap-3 pb-2 border-b border-surface-100">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <Store size={18} className="text-primary-600" />
            </div>
            <p className="text-sm font-semibold text-app-secondary">¿Cómo se llama tu negocio?</p>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Las Empanadas de María"
            className="input-field"
            autoFocus
            maxLength={50}
          />
          <p className="text-xs text-app-faint">Este nombre aparece en tu dashboard y en tus comandas.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar nombre'}
        </button>
        <p className="text-center text-xs text-gray-300 py-4">Desarrollado por Franco Falcone</p>
      </div>
    </div>
  )
}
