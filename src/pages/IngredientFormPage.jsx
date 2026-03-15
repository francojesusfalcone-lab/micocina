import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Trash2, AlertCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'
import {
  useIngredient,
  saveIngredient,
  deleteIngredient,
  UNITS,
  CATEGORIES,
} from '../hooks/useIngredients'

const EMPTY_FORM = {
  name: '',
  category: '',
  unit: 'g',
  pricePerUnit: '',
  stock: '',
  lowStockAlert: '',
  lowStockAlertPercent: 20,
}

export default function IngredientFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const settings = useAppStore((s) => s.settings)
  const addToast = useAppStore((s) => s.addToast)

  const existing = useIngredient(id ? Number(id) : null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errors, setErrors] = useState({})

  // Load existing data when editing
  useEffect(() => {
    if (existing) {
      setForm({
        name:                existing.name || '',
        category:            existing.category || '',
        unit:                existing.unit || 'g',
        pricePerUnit:        existing.pricePerUnit?.toString() || '',
        stock:               existing.stock?.toString() || '',
        lowStockAlert:       existing.lowStockAlert?.toString() || '',
        lowStockAlertPercent:existing.lowStockAlertPercent || 20,
      })
    }
  }, [existing])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())          e.name = 'El nombre es obligatorio'
    if (!form.pricePerUnit || isNaN(Number(form.pricePerUnit)) || Number(form.pricePerUnit) < 0)
      e.pricePerUnit = 'Ingresá un precio válido'
    if (form.stock !== '' && (isNaN(Number(form.stock)) || Number(form.stock) < 0))
      e.stock = 'Stock inválido'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setSaving(true)
    try {
      const data = {
        name:                form.name.trim(),
        category:            form.category || 'Otros',
        unit:                form.unit,
        pricePerUnit:        Number(form.pricePerUnit),
        stock:               form.stock !== '' ? Number(form.stock) : null,
        lowStockAlert:       form.lowStockAlert !== '' ? Number(form.lowStockAlert) : null,
        lowStockAlertPercent:Number(form.lowStockAlertPercent),
      }

      await saveIngredient(data, isEdit ? Number(id) : null)
      addToast({
        type: 'success',
        message: isEdit ? 'Ingrediente actualizado ✓' : 'Ingrediente agregado ✓',
      })
      navigate('/stock')
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await deleteIngredient(Number(id))
      addToast({ type: 'success', message: 'Ingrediente eliminado' })
      navigate('/stock')
    } catch (err) {
      addToast({ type: 'error', message: err.message })
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Precio por porción helper ────────────────────────────────────────────
  const priceNum = Number(form.pricePerUnit)
  const unitLabel = UNITS.find((u) => u.value === form.unit)?.label || form.unit

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader
        title={isEdit ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        back
        action={
          isEdit && (
            <button
              onClick={handleDelete}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all active:scale-95 ${
                confirmDelete
                  ? 'bg-red-500 text-white'
                  : 'bg-red-50 text-red-500'
              }`}
            >
              <Trash2 size={15} />
              {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-32 px-4 py-4 space-y-4">

        {/* ── Nombre ── */}
        <div className="card space-y-4">
          <div>
            <label className="label">Nombre del ingrediente *</label>
            <input
              type="text"
              placeholder="Ej: Harina 000, Queso mozzarella..."
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="input-field"
              autoFocus={!isEdit}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.name}</p>}
          </div>

          <div>
            <label className="label">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="input-field"
            >
              <option value="">Seleccioná una categoría</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Precio ── */}
        <div className="card space-y-4">
          <p className="text-sm font-bold text-gray-700">Precio y unidad</p>

          <div>
            <label className="label">Unidad de medida *</label>
            <div className="grid grid-cols-4 gap-2">
              {UNITS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('unit', value)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold border-2 transition-all active:scale-95 ${
                    form.unit === value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-200 bg-white text-gray-600'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Seleccionado: <strong>{unitLabel}</strong>
            </p>
          </div>

          <div>
            <label className="label">
              Precio por {form.unit} ({settings.currencySymbol}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                {settings.currencySymbol}
              </span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={form.pricePerUnit}
                onChange={(e) => set('pricePerUnit', e.target.value)}
                className="input-field pl-8"
                min="0"
                step="0.01"
              />
            </div>
            {errors.pricePerUnit && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.pricePerUnit}</p>}

            {/* Helper: precio por porción común */}
            {priceNum > 0 && (
              <div className="mt-3 bg-surface-50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-bold text-gray-500 mb-2">Equivalencias rápidas</p>
                {form.unit === 'kg' && (
                  <>
                    <p className="text-xs text-gray-600">100g → <strong>{settings.currencySymbol}{(priceNum / 10).toFixed(2)}</strong></p>
                    <p className="text-xs text-gray-600">500g → <strong>{settings.currencySymbol}{(priceNum / 2).toFixed(2)}</strong></p>
                  </>
                )}
                {form.unit === 'g' && (
                  <>
                    <p className="text-xs text-gray-600">100g → <strong>{settings.currencySymbol}{(priceNum * 100).toFixed(2)}</strong></p>
                    <p className="text-xs text-gray-600">1kg  → <strong>{settings.currencySymbol}{(priceNum * 1000).toFixed(2)}</strong></p>
                  </>
                )}
                {form.unit === 'l' && (
                  <>
                    <p className="text-xs text-gray-600">100ml → <strong>{settings.currencySymbol}{(priceNum / 10).toFixed(2)}</strong></p>
                    <p className="text-xs text-gray-600">500ml → <strong>{settings.currencySymbol}{(priceNum / 2).toFixed(2)}</strong></p>
                  </>
                )}
                {form.unit === 'u' && (
                  <p className="text-xs text-gray-600">Precio unitario: <strong>{settings.currencySymbol}{priceNum.toFixed(2)}</strong></p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Stock ── */}
        <div className="card space-y-4">
          <p className="text-sm font-bold text-gray-700">Stock actual (opcional)</p>
          <p className="text-xs text-gray-500 -mt-2">
            Si cargás el stock, la app lo descuenta automáticamente con cada venta.
          </p>

          <div>
            <label className="label">
              Cantidad en stock ({form.unit})
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ej: 2.5"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              className="input-field"
              min="0"
              step="0.01"
            />
            {errors.stock && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.stock}</p>}
          </div>

          <div>
            <label className="label">
              Alarma de stock bajo ({form.unit})
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ej: 0.5 — te avisamos cuando quede menos"
              value={form.lowStockAlert}
              onChange={(e) => set('lowStockAlert', e.target.value)}
              className="input-field"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-400 mt-1">
              Cuando el stock baje de este número, aparece una alerta.
            </p>
          </div>
        </div>

      </div>

      {/* ── Save button fixed at bottom ── */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-surface-200 px-4 py-3 z-30">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar ingrediente'}
        </button>
      </div>
    </div>
  )
}
