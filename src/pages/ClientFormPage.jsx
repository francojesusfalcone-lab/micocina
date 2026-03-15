import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, AlertCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'
import { useClient, saveClient } from '../hooks/useClients'
import clsx from 'clsx'

export default function ClientFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)

  const existing  = useClient(id ? Number(id) : null)
  const isEditing = !!id

  const [form, setForm]     = useState({ name: '', phone: '', address: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setForm({
        name:    existing.name,
        phone:   existing.phone    || '',
        address: existing.address  || '',
        notes:   existing.notes    || '',
      })
    }
  }, [existing])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'El nombre es obligatorio'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSaving(true)
    try {
      const savedId = await saveClient(form, isEditing ? Number(id) : null)
      addToast({ type: 'success', message: isEditing ? 'Cliente actualizado ✓' : 'Cliente guardado ✓' })
      navigate(isEditing ? `/clientes/${id}` : `/clientes/${savedId}`, { replace: true })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader title={isEditing ? 'Editar cliente' : 'Nuevo cliente'} back />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-36 px-4 py-4 space-y-4">

        <div className="card space-y-4">
          {/* Nombre */}
          <div>
            <label className="label">Nombre *</label>
            <input
              type="text"
              placeholder="Ej: María González"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={clsx('input-field', errors.name && 'border-red-300')}
              autoFocus={!isEditing}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />{errors.name}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="label">Teléfono / WhatsApp</label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+54 9 11 1234-5678"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="input-field"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="label">Dirección de entrega</label>
            <input
              type="text"
              placeholder="Calle y número, ciudad..."
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              className="input-field"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="label">Notas internas</label>
            <textarea
              placeholder="Alérgica al gluten, prefiere sin cebolla, paga siempre en efectivo..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="input-field resize-none"
              rows={3}
            />
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-surface-200 px-4 py-3 z-30">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar cliente'}
        </button>
      </div>
    </div>
  )
}
