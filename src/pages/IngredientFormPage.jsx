import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Trash2, AlertCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'
import {
  useIngredient,
  saveIngredient,
  deleteIngredient,
  CATEGORIES,
} from '../hooks/useIngredients'

// Unidades reales de compra — sin cucharadas/tazas
const UNITS = [
  { value: 'g',      label: 'Gramos (g)',      type: 'peso' },
  { value: 'kg',     label: 'Kilogramos (kg)', type: 'peso' },
  { value: 'ml',     label: 'Mililitros (ml)', type: 'volumen' },
  { value: 'l',      label: 'Litros (l)',       type: 'volumen' },
  { value: 'u',      label: 'Unidades',         type: 'cantidad' },
  { value: 'docena', label: 'Docena (12u)',      type: 'cantidad' },
  { value: 'paquete',label: 'Paquete',           type: 'cantidad' },
]

const EMPTY_FORM = {
  name: '',
  category: '',
  unit: 'g',
  purchaseQty: '',    // cantidad comprada
  purchasePrice: '',  // precio total pagado
  stock: '',
  lowStockAlert: '',
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (existing) {
      // Al editar reconstruimos purchaseQty=1 y purchasePrice=pricePerUnit
      // para no romper la lógica inversa
      setForm({
        name:          existing.name || '',
        category:      existing.category || '',
        unit:          existing.unit || 'g',
        purchaseQty:   '1',
        purchasePrice: existing.pricePerUnit?.toString() || '',
        stock:         existing.stock?.toString() || '',
        lowStockAlert: existing.lowStockAlert?.toString() || '',
      })
    }
  }, [existing])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  // Precio por unidad calculado automáticamente
  const qty = Number(form.purchaseQty)
  const price = Number(form.purchasePrice)

  // Si la unidad es docena, 1 docena = 12 unidades → precio por unidad
  function calcPricePerUnit() {
    if (!qty || !price || qty <= 0) return null
    if (form.unit === 'docena') return price / (qty * 12)
    return price / qty
  }

  const pricePerUnit = calcPricePerUnit()
  const unitLabel = UNITS.find((u) => u.value === form.unit)?.label || form.unit
  const displayUnit = form.unit === 'docena' ? 'u' : form.unit

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'El nombre es obligatorio'
    if (!form.purchaseQty || qty <= 0) e.purchaseQty = 'Ingresá la cantidad'
    if (!form.purchasePrice || price <= 0) e.purchasePrice = 'Ingresá el precio total'
    if (form.stock !== '' && (isNaN(Number(form.stock)) || Number(form.stock) < 0))
      e.stock = 'Stock inválido'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSaving(true)
    try {
      const ppu = calcPricePerUnit()
      const data = {
        name:          form.name.trim(),
        category:      form.category || 'Otros',
        unit:          form.unit === 'docena' ? 'u' : form.unit,
        pricePerUnit:  ppu,
        stock:         form.stock !== '' ? Number(form.stock) : null,
        lowStockAlert: form.lowStockAlert !== '' ? Number(form.lowStockAlert) : null,
      }
      await saveIngredient(data, isEdit ? Number(id) : null)
      addToast({ type: 'success', message: isEdit ? 'Ingrediente actualizado ✓' : 'Ingrediente agregado ✓' })
      navigate('/stock')
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      await deleteIngredient(Number(id))
      addToast({ type: 'success', message: 'Ingrediente eliminado' })
      navigate('/stock')
    } catch (err) {
      addToast({ type: 'error', message: err.message })
      setConfirmDelete(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader
        title={isEdit ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        back
        action={isEdit && (
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all active:scale-95 ${confirmDelete ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500'}`}
          >
            <Trash2 size={15} />
            {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
          </button>
        )}
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-32 px-4 py-4 space-y-4">

        {/* Nombre y categoría */}
        <div className="card space-y-4">
          <div>
            <label className="label">Nombre del ingrediente *</label>
            <input
              type="text"
              placeholder="Ej: Harina 000, Huevos, Aceite..."
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
              style={{backgroundColor:'var(--bg-input)',color:'var(--text-primary)',colorScheme:'dark'}}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="input-field"
            >
              <option value="">Seleccioná una categoría</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Cómo lo compraste */}
        <div className="card space-y-4">
          <div>
            <p className="text-sm font-bold text-app-secondary">¿Cómo lo compraste?</p>
            <p className="text-xs text-app-muted mt-0.5">La app calcula el precio por unidad automáticamente.</p>
          </div>

          {/* Unidad */}
          <div>
            <label className="label">Unidad de medida *</label>
            <div className="grid grid-cols-2 gap-2">
              {UNITS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('unit', value)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 text-left ${
                    form.unit === value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-app text-app-secondary'
                  }`}
                  style={form.unit !== value ? {backgroundColor:'var(--bg-input)'} : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad + Precio */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Cantidad comprada *</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder={form.unit === 'kg' ? 'Ej: 1' : form.unit === 'g' ? 'Ej: 500' : 'Ej: 1'}
                value={form.purchaseQty}
                onChange={(e) => set('purchaseQty', e.target.value)}
                className="input-field"
                min="0"
                step="0.01"
              />
              {errors.purchaseQty && <p className="text-xs text-red-500 mt-1">{errors.purchaseQty}</p>}
            </div>
            <div className="flex-1">
              <label className="label">Precio total pagado *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted font-semibold text-sm">{settings.currencySymbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.purchasePrice}
                  onChange={(e) => set('purchasePrice', e.target.value)}
                  className="input-field pl-7"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.purchasePrice && <p className="text-xs text-red-500 mt-1">{errors.purchasePrice}</p>}
            </div>
          </div>

          {/* Resultado calculado */}
          {pricePerUnit !== null && pricePerUnit > 0 && (
            <div className="rounded-xl p-3 bg-primary-50 border border-primary-200">
              <p className="text-xs font-bold text-primary-700">Precio calculado automáticamente:</p>
              <p className="text-lg font-display font-bold text-primary-700 mt-0.5">
                {settings.currencySymbol}{pricePerUnit.toFixed(2)} por {displayUnit}
              </p>
              {form.unit === 'docena' && (
                <p className="text-xs text-primary-500 mt-0.5">({qty} docena{qty !== 1 ? 's' : ''} = {qty * 12} unidades)</p>
              )}
            </div>
          )}
        </div>

        {/* Stock */}
        <div className="card space-y-4">
          <div>
            <p className="text-sm font-bold text-app-secondary">Stock actual (opcional)</p>
            <p className="text-xs text-app-muted mt-0.5">La app descuenta automáticamente con cada venta.</p>
          </div>
          <div>
            <label className="label">Cantidad en stock ({form.unit === 'docena' ? 'u' : form.unit})</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ej: 500"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              className="input-field"
              min="0"
              step="0.01"
            />
            {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
          </div>
          <div>
            <label className="label">Alarma de stock bajo ({form.unit === 'docena' ? 'u' : form.unit})</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ej: 100 — te avisamos cuando quede menos"
              value={form.lowStockAlert}
              onChange={(e) => set('lowStockAlert', e.target.value)}
              className="input-field"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-app-faint mt-1">Cuando el stock baje de este número aparece una alerta.</p>
          </div>
        </div>

      </div>

      {/* Botón guardar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto border-t border-app px-4 py-3 z-30"
           style={{backgroundColor:'var(--bg-app)'}}>
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
