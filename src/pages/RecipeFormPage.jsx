import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Save, Trash2, Plus, X, AlertCircle, ChevronDown,
  Calculator, Search, Package
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BottomSheet from '../components/BottomSheet'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useIngredients, UNITS } from '../hooks/useIngredients'
import {
  useRecipe, useRecipeIngredients,
  saveRecipe, deleteRecipe,
  calcRecipeCost, calcSalePrice,
  RECIPE_CATEGORIES,
} from '../hooks/useRecipes'

const MARGINS = [20, 30, 40, 50, 60, 70, 80, 100, 150, 200]

const EMPTY_FORM = {
  name: '',
  category: '',
  description: '',
  salePrice: '',
  marginPercent: 50,
  portions: 1,
  isActive: true,
}

export default function RecipeFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const settings = useAppStore((s) => s.settings)
  const addToast = useAppStore((s) => s.addToast)

  const allIngredients = useIngredients()
  const existingRecipe = useRecipe(id ? Number(id) : null)
  const existingItems  = useRecipeIngredients(id ? Number(id) : null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [items, setItems] = useState([]) // { ingredientId, quantity, unit, ingredient }
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errors, setErrors] = useState({})
  const [showIngPicker, setShowIngPicker] = useState(false)
  const [ingSearch, setIngSearch] = useState('')
  const [priceMode, setPriceMode] = useState('margin') // 'margin' | 'manual'

  // Load existing data when editing
  useEffect(() => {
    if (existingRecipe) {
      setForm({
        name:          existingRecipe.name || '',
        category:      existingRecipe.category || '',
        description:   existingRecipe.description || '',
        salePrice:     existingRecipe.salePrice?.toString() || '',
        marginPercent: existingRecipe.marginPercent || 50,
        portions:      existingRecipe.portions || 1,
        isActive:      existingRecipe.isActive !== false,
      })
      if (existingRecipe.priceMode) setPriceMode(existingRecipe.priceMode)
    }
  }, [existingRecipe])

  useEffect(() => {
    if (existingItems.length > 0) {
      setItems(existingItems.map((ri) => ({
        ingredientId: ri.ingredientId,
        quantity:     ri.quantity?.toString() || '',
        unit:         ri.unit || ri.ingredient?.unit || 'g',
        ingredient:   ri.ingredient,
      })))
    }
  }, [existingItems])

  // ─── Live cost calculation ────────────────────────────────────────────────
  const totalCost = useMemo(() => calcRecipeCost(
    items.map((i) => ({ ...i, quantity: Number(i.quantity) || 0 }))
  ), [items])

  const costPerPortion = form.portions > 1 ? totalCost / Number(form.portions) : totalCost

  const suggestedPrice = priceMode === 'margin'
    ? calcSalePrice(costPerPortion, form.marginPercent)
    : Number(form.salePrice) || 0

  const finalPrice = priceMode === 'manual'
    ? (Number(form.salePrice) || 0)
    : suggestedPrice

  const realMargin = finalPrice > 0 && costPerPortion > 0
    ? ((finalPrice - costPerPortion) / finalPrice) * 100
    : 0

  const profit = finalPrice - costPerPortion

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  function addIngredient(ingredient) {
    if (items.find((i) => i.ingredientId === ingredient.id)) {
      addToast({ type: 'info', message: 'Ese ingrediente ya está en la receta' })
      return
    }
    setItems((prev) => [...prev, {
      ingredientId: ingredient.id,
      quantity: '',
      unit: ingredient.unit,
      ingredient,
    }])
    setShowIngPicker(false)
    setIngSearch('')
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItemQty(idx, qty) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
  }

  function updateItemUnit(idx, unit) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, unit } : item))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'El nombre es obligatorio'
    if (items.length === 0) e.items = 'Agregá al menos un ingrediente'
    const hasEmptyQty = items.some((i) => !i.quantity || Number(i.quantity) <= 0)
    if (hasEmptyQty) e.items = 'Completá las cantidades de todos los ingredientes'
    if (priceMode === 'manual' && (!form.salePrice || Number(form.salePrice) <= 0))
      e.salePrice = 'Ingresá el precio de venta'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setSaving(true)
    try {
      const recipeData = {
        name:               form.name.trim(),
        category:           form.category || 'Otros',
        description:        form.description.trim(),
        portions:           Number(form.portions) || 1,
        isActive:           form.isActive,
        marginPercent:      Number(form.marginPercent),
        priceMode,
        salePrice:          finalPrice,
        lastCalculatedCost: totalCost,
        costPerPortion,
      }

      const itemsToSave = items.map((i) => ({
        ingredientId: i.ingredientId,
        quantity:     Number(i.quantity),
        unit:         i.unit,
      }))

      await saveRecipe(recipeData, itemsToSave, isEdit ? Number(id) : null)
      addToast({
        type: 'success',
        message: isEdit ? 'Receta actualizada ✓' : 'Receta guardada ✓',
      })
      navigate('/productos')
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      await deleteRecipe(Number(id))
      addToast({ type: 'success', message: 'Receta eliminada' })
      navigate('/productos')
    } catch (err) {
      addToast({ type: 'error', message: err.message })
      setConfirmDelete(false)
    }
  }

  const filteredIngredients = allIngredients.filter((ing) =>
    ing.name.toLowerCase().includes(ingSearch.toLowerCase()) &&
    !items.find((i) => i.ingredientId === ing.id)
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader
        title={isEdit ? 'Editar receta' : 'Nueva receta'}
        back
        action={
          isEdit && (
            <button
              onClick={handleDelete}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all active:scale-95 ${
                confirmDelete ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500'
              }`}
            >
              <Trash2 size={15} />
              {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-32 px-4 py-4 space-y-4">

        {/* ── Datos básicos ── */}
        <div className="card space-y-4">
          <div>
            <label className="label">Nombre del producto *</label>
            <input
              type="text"
              placeholder="Ej: Pizza mozzarella, Empanada de carne..."
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="input-field"
              autoFocus={!isEdit}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.name}</p>}
          </div>

          <div>
            <label className="label">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              className="input-field"
              style={{backgroundColor:'var(--bg-input)', color:'var(--text-primary)', colorScheme:'dark'}}
            >
              <option value="">Seleccioná una categoría</option>
              {RECIPE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Descripción (opcional)</label>
            <textarea
              placeholder="Notas, variantes, observaciones..."
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="input-field resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="label">¿Cuántas porciones rinde esta receta?</label>
            <div className="flex gap-2">
              {[1,2,4,6,8,10,12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setField('portions', n)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                    form.portions === n
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-app bg-white text-gray-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {form.portions > 1 && (
              <p className="text-xs text-app-faint mt-1.5">
                El precio y el costo se calculan por porción individual.
              </p>
            )}
          </div>
        </div>

        {/* ── Ingredientes ── */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-app-secondary">
              Ingredientes
              {items.length > 0 && (
                <span className="ml-2 text-xs font-semibold text-app-faint">({items.length})</span>
              )}
            </p>
            <button
              onClick={() => setShowIngPicker(true)}
              className="flex items-center gap-1.5 text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl active:scale-95 transition-all"
            >
              <Plus size={15} />
              Agregar
            </button>
          </div>

          {errors.items && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12}/>{errors.items}
            </p>
          )}

          {items.length === 0 ? (
            <button
              onClick={() => setShowIngPicker(true)}
              className="w-full border-2 border-dashed border-surface-300 rounded-xl py-6 flex flex-col items-center gap-2 text-app-faint active:bg-app transition-colors"
            >
              <Package size={24} />
              <p className="text-sm font-medium">Tocá para agregar ingredientes</p>
            </button>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.ingredientId} className="bg-app rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-app-secondary">{item.ingredient?.name}</p>
                    <button
                      onClick={() => removeItem(idx)}
                      className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-red-400 active:scale-95 transition-all"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="Cantidad"
                        value={item.quantity}
                        onChange={(e) => updateItemQty(idx, e.target.value)}
                        className="input-field py-2 text-sm"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="w-24">
                      <select
                        value={item.unit}
                        onChange={(e) => updateItemUnit(idx, e.target.value)}
                        className="input-field py-2 text-sm"
                      >
                        {UNITS.map(({ value }) => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cost preview per ingredient */}
                  {item.quantity && Number(item.quantity) > 0 && item.ingredient?.pricePerUnit && (
                    <p className="text-xs text-app-muted">
                      Costo: <strong>
                        {formatCurrency(
                          item.ingredient.pricePerUnit * Number(item.quantity),
                          settings.currencySymbol
                        )}
                      </strong>
                      <span className="text-app-faint"> (estimado)</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Cost summary ── */}
        {items.length > 0 && (
          <div className="card bg-primary-50 border-primary-200 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Calculator size={16} className="text-primary-600" />
              <p className="text-sm font-bold text-primary-700">Resumen de costos</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-app-muted">Costo total receta</span>
              <strong className="text-app-primary">{formatCurrency(totalCost, settings.currencySymbol)}</strong>
            </div>
            {form.portions > 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-app-muted">Costo por porción ({form.portions} porciones)</span>
                <strong className="text-primary-700">{formatCurrency(costPerPortion, settings.currencySymbol)}</strong>
              </div>
            )}
          </div>
        )}

        {/* ── Precio de venta ── */}
        <div className="card space-y-4">
          <p className="text-sm font-bold text-app-secondary">Precio de venta</p>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setPriceMode('margin')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                priceMode === 'margin'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-app bg-white text-gray-500'
              }`}
            >
              Por margen %
            </button>
            <button
              onClick={() => setPriceMode('manual')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                priceMode === 'manual'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-app bg-white text-gray-500'
              }`}
            >
              Precio fijo
            </button>
          </div>

          {priceMode === 'margin' ? (
            <div>
              <label className="label">Margen de ganancia</label>
              <div className="grid grid-cols-5 gap-2">
                {MARGINS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setField('marginPercent', m)}
                    className={`py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${
                      form.marginPercent === m
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-app bg-white text-gray-600'
                    }`}
                  >
                    {m}%
                  </button>
                ))}
              </div>
              <p className="text-xs text-app-faint mt-2">
                Con {form.marginPercent}% de margen, el precio sugerido es{' '}
                <strong className="text-primary-600">
                  {formatCurrency(suggestedPrice, settings.currencySymbol)}
                </strong>
              </p>
            </div>
          ) : (
            <div>
              <label className="label">
                Precio de venta ({settings.currencySymbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted font-semibold">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.salePrice}
                  onChange={(e) => setField('salePrice', e.target.value)}
                  className="input-field pl-8"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.salePrice && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12}/>{errors.salePrice}
                </p>
              )}
            </div>
          )}

          {/* Profit summary */}
          {finalPrice > 0 && costPerPortion > 0 && (
            <div className={`rounded-xl p-3 space-y-2 ${profit > 0 ? 'bg-primary-50' : 'bg-red-50'}`}>
              <div className="flex justify-between text-sm">
                <span className="text-app-muted">Precio de venta</span>
                <strong>{formatCurrency(finalPrice, settings.currencySymbol)}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-app-muted">Costo por porción</span>
                <span className="text-app-secondary">- {formatCurrency(costPerPortion, settings.currencySymbol)}</span>
              </div>
              <div className="border-t border-black/10 pt-2 flex justify-between text-sm font-bold">
                <span className={profit > 0 ? 'text-primary-700' : 'text-red-600'}>
                  Ganancia por unidad
                </span>
                <span className={profit > 0 ? 'text-primary-700' : 'text-red-600'}>
                  {formatCurrency(profit, settings.currencySymbol)} ({realMargin.toFixed(0)}%)
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Save button ── */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-app px-4 py-3 z-30">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar receta'}
        </button>
      </div>

      {/* ── Ingredient picker bottom sheet ── */}
      <BottomSheet
        isOpen={showIngPicker}
        onClose={() => { setShowIngPicker(false); setIngSearch('') }}
        title="Elegir ingrediente"
      >
        <div className="px-4 py-3 border-b border-app">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-faint" />
            <input
              type="text"
              placeholder="Buscar ingrediente..."
              value={ingSearch}
              onChange={(e) => setIngSearch(e.target.value)}
              className="input-field pl-8 py-2.5 text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="px-4 py-3 space-y-2 pb-8">
          {filteredIngredients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-app-faint text-sm">
                {allIngredients.length === 0
                  ? 'No tenés ingredientes cargados aún.'
                  : 'No se encontraron ingredientes.'}
              </p>
              {allIngredients.length === 0 && (
                <button
                  onClick={() => navigate('/stock/nuevo')}
                  className="mt-3 text-sm font-bold text-primary-600 underline"
                >
                  Ir a cargar ingredientes →
                </button>
              )}
            </div>
          ) : (
            filteredIngredients.map((ing) => (
              <button
                key={ing.id}
                onClick={() => addIngredient(ing)}
                className="w-full flex items-center gap-3 p-3 bg-app rounded-xl active:bg-surface-100 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <Package size={16} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-app-primary">{ing.name}</p>
                  <p className="text-xs text-app-muted">{ing.category} · {ing.unit}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-app-secondary">
                    {formatCurrency(ing.pricePerUnit, settings.currencySymbol)}
                  </p>
                  <p className="text-xs text-app-faint">por {ing.unit}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
