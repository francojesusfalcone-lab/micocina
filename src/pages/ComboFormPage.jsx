import React, { useState, useEffect } from 'react'
import { ChevronLeft, Plus, X, Tag, Minus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export default function ComboFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const settings = useAppStore((s) => s.settings)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const allRecipes = useLiveQuery(() =>
    db.recipes.filter(r => !r.isPremiumCombo).toArray()
  , [], [])

  useEffect(() => {
    if (isEdit) {
      db.recipes.get(Number(id)).then(combo => {
        if (combo) {
          setName(combo.name)
          setPrice(String(combo.salePrice || ''))
          setSelectedItems(combo.comboItems || [])
        }
      })
    }
  }, [id, isEdit])

  function addItem(recipe) {
    if (selectedItems.find(i => i.recipeId === recipe.id)) return
    setSelectedItems(prev => [...prev, { recipeId: recipe.id, name: recipe.name, qty: 1 }])
  }

  function removeItem(recipeId) {
    setSelectedItems(prev => prev.filter(i => i.recipeId !== recipeId))
  }

  function changeQty(recipeId, delta) {
    setSelectedItems(prev => prev.map(i => {
      if (i.recipeId !== recipeId) return i
      const newQty = Math.max(1, i.qty + delta)
      return { ...i, qty: newQty }
    }))
  }

  async function handleSave() {
    if (!name.trim()) { setError('Ponele un nombre al combo'); return }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { setError('El precio debe ser mayor a 0'); return }
    if (selectedItems.length < 2) { setError('Un combo necesita al menos 2 productos'); return }

    setSaving(true)
    const data = {
      name: name.trim(),
      salePrice: Number(price),
      isPremiumCombo: 1,
      comboItems: selectedItems,
      isActive: 1,
      updatedAt: new Date().toISOString(),
    }

    if (isEdit) {
      await db.recipes.update(Number(id), data)
    } else {
      await db.recipes.add({ ...data, createdAt: new Date().toISOString() })
    }
    navigate('/combos')
  }

  return (
    <div className="flex flex-col min-h-full bg-app">
      <div className="bg-surface border-b border-app px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-display font-bold text-app-primary">
          {isEdit ? 'Editar combo' : 'Nuevo combo'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none pb-32 px-4 py-4 space-y-4">

        {/* Nombre */}
        <div className="card space-y-3">
          <p className="text-sm font-bold text-app-secondary">Nombre del combo</p>
          <input
            type="text"
            placeholder="Ej: Combo Familiar, Combo Ejecutivo..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-field"
          />
        </div>

        {/* Precio fijo */}
        <div className="card space-y-3">
          <div>
            <p className="text-sm font-bold text-app-secondary">Precio del combo</p>
            <p className="text-xs text-app-muted mt-0.5">Precio especial de oferta — no tiene que tener lógica de margen</p>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-faint font-semibold">{settings.currencySymbol}</span>
            <input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="input-field pl-8"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Productos incluidos */}
        <div className="card space-y-3">
          <p className="text-sm font-bold text-app-secondary">Productos incluidos</p>

          {/* Items ya agregados con selector de cantidad */}
          {selectedItems.length > 0 && (
            <div className="space-y-2">
              {selectedItems.map(item => {
                const recipe = allRecipes?.find(r => r.id === item.recipeId)
                const unitPrice = recipe?.salePrice || 0
                const subtotal = unitPrice * item.qty
                return (
                  <div key={item.recipeId} className="bg-primary-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-primary-600 shrink-0" />
                      <p className="text-sm font-semibold text-primary-700 flex-1 truncate">{item.name}</p>
                      <button onClick={() => removeItem(item.recipeId)} className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <X size={12} className="text-red-500" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => changeQty(item.recipeId, -1)} className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center active:scale-95">
                          <Minus size={11} className="text-primary-700" />
                        </button>
                        <span className="text-sm font-bold text-primary-700 w-5 text-center">{item.qty}</span>
                        <button onClick={() => changeQty(item.recipeId, 1)} className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center active:scale-95">
                          <Plus size={11} className="text-primary-700" />
                        </button>
                        <span className="text-xs text-primary-500 ml-1">{formatCurrency(unitPrice, settings.currencySymbol)} c/u</span>
                      </div>
                      <span className="text-sm font-bold text-primary-700">{formatCurrency(subtotal, settings.currencySymbol)}</span>
                    </div>
                  </div>
                )
              })}

              {/* Total real */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-surface-100 rounded-xl border border-app">
                <p className="text-sm font-bold text-app-secondary">Total precio real</p>
                <p className="text-sm font-bold text-app-primary">
                  {formatCurrency(selectedItems.reduce((sum, item) => {
                    const recipe = allRecipes?.find(r => r.id === item.recipeId)
                    return sum + (recipe?.salePrice || 0) * item.qty
                  }, 0), settings.currencySymbol)}
                </p>
              </div>
            </div>
          )}

          {/* Lista de productos para agregar */}
          {allRecipes?.filter(r => !selectedItems.find(i => i.recipeId === r.id)).length > 0 && (
            <>
              <p className="text-xs text-app-muted font-semibold">Tocá un producto para agregarlo:</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {allRecipes?.filter(r => !selectedItems.find(i => i.recipeId === r.id)).map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => addItem(recipe)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-app bg-white active:bg-app transition-colors text-left"
                  >
                    <Plus size={14} className="text-app-faint shrink-0" />
                    <p className="text-sm font-medium text-app-secondary">{recipe.name}</p>
                    <p className="text-xs text-app-faint ml-auto">{formatCurrency(recipe.salePrice, settings.currencySymbol)}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {allRecipes?.length === 0 && (
            <p className="text-xs text-app-faint text-center py-4">Primero agregá productos en la sección Productos</p>
          )}
        </div>

        {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
      </div>

      {/* Botón guardar — siempre visible */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-app px-4 py-3 z-30">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-4 text-base disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear combo'}
        </button>
      </div>
    </div>
  )
}
