import React, { useState, useMemo } from 'react'
import { Zap, Plus, X, Package, Calculator } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import BottomSheet from '../components/BottomSheet'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useIngredients, UNITS } from '../hooks/useIngredients'
import { calcRecipeCost, calcSalePrice } from '../hooks/useRecipes'

const MARGINS = [30, 40, 50, 60, 70, 80, 100, 150]

export default function QuickPricePage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const allIngredients = useIngredients()

  const [items, setItems] = useState([])
  const [margin, setMargin] = useState(50)
  const [extraCost, setExtraCost] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')

  const totalCost = useMemo(() => {
    const ingCost = calcRecipeCost(items.map((i) => ({ ...i, quantity: Number(i.quantity) || 0 })))
    return ingCost + (Number(extraCost) || 0)
  }, [items, extraCost])

  const salePrice = calcSalePrice(totalCost, margin)
  const profit = salePrice - totalCost

  function addIngredient(ing) {
    if (items.find((i) => i.ingredientId === ing.id)) return
    setItems((prev) => [...prev, {
      ingredientId: ing.id,
      quantity: '',
      unit: ing.unit,
      ingredient: ing,
    }])
    setShowPicker(false)
    setSearch('')
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateQty(idx, qty) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
  }

  const filtered = allIngredients.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) &&
           !items.find((it) => it.ingredientId === i.id)
  )

  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader title="Precio rápido" subtitle="Sin guardar receta" back />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 py-4 space-y-4">

        <div className="card bg-primary-50 border-primary-200 flex items-start gap-2">
          <Zap size={16} className="text-primary-600 shrink-0 mt-0.5" />
          <p className="text-xs text-primary-700">
            Calculá el precio de algo puntual sin armar una receta completa.
            Los datos no se guardan.
          </p>
        </div>

        {/* ── Ingredients ── */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-app-secondary">Ingredientes</p>
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1.5 text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl active:scale-95 transition-all"
            >
              <Plus size={15} />
              Agregar
            </button>
          </div>

          {items.length === 0 ? (
            <button
              onClick={() => setShowPicker(true)}
              className="w-full border-2 border-dashed border-surface-300 rounded-xl py-5 flex flex-col items-center gap-1.5 text-app-faint active:bg-app transition-colors"
            >
              <Package size={22} />
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
                      className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-red-400 active:scale-95"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="Cantidad"
                      value={item.quantity}
                      onChange={(e) => updateQty(idx, e.target.value)}
                      className="input-field py-2 text-sm flex-1"
                      min="0"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, unit: e.target.value } : it))}
                      className="input-field py-2 text-sm w-20"
                    >
                      {UNITS.map(({ value }) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Extra costs ── */}
        <div className="card space-y-2">
          <p className="text-sm font-bold text-app-secondary">Costos extra (opcional)</p>
          <p className="text-xs text-app-muted">Packaging, delivery, mano de obra, etc.</p>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted font-semibold">
              {settings.currencySymbol}
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={extraCost}
              onChange={(e) => setExtraCost(e.target.value)}
              className="input-field pl-8"
              min="0"
            />
          </div>
        </div>

        {/* ── Margin ── */}
        <div className="card space-y-3">
          <p className="text-sm font-bold text-app-secondary">Margen de ganancia</p>
          <div className="grid grid-cols-4 gap-2">
            {MARGINS.map((m) => (
              <button
                key={m}
                onClick={() => setMargin(m)}
                className={`py-2 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                  margin === m
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-app text-app-secondary'
                }`}
              >
                {m}%
              </button>
            ))}
          </div>
        </div>

        {/* ── Result ── */}
        {totalCost > 0 && (
          <div className="card bg-primary-600 border-primary-600 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Calculator size={16} className="text-primary-100" />
              <p className="text-sm font-bold text-primary-100">Resultado</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-primary-200">Costo total</span>
              <span className="text-white font-medium">{formatCurrency(totalCost, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-primary-200">Ganancia ({margin}%)</span>
              <span className="text-white font-medium">{formatCurrency(profit, settings.currencySymbol)}</span>
            </div>
            <div className="border-t border-primary-500 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-primary-100 font-bold text-base">Precio sugerido</span>
                <span className="text-white font-display font-bold text-2xl">
                  {formatCurrency(salePrice, settings.currencySymbol)}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/productos/nuevo')}
              className="w-full bg-white text-primary-700 font-bold text-sm py-2.5 rounded-xl active:scale-95 transition-all mt-1"
            >
              Guardar como receta →
            </button>
          </div>
        )}

      </div>

      {/* Ingredient picker */}
      <BottomSheet
        isOpen={showPicker}
        onClose={() => { setShowPicker(false); setSearch('') }}
        title="Elegir ingrediente"
      >
        <div className="px-4 py-3 border-b border-app">
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field py-2.5 text-sm"
            autoFocus
          />
        </div>
        <div className="px-4 py-3 space-y-2 pb-8">
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-app-faint text-sm">
                {allIngredients.length === 0 ? 'No tenés ingredientes cargados aún.' : 'Sin resultados.'}
              </p>
            </div>
          ) : (
            filtered.map((ing) => (
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
                  <p className="text-xs text-app-muted">{ing.unit}</p>
                </div>
                <p className="text-sm font-bold text-app-secondary shrink-0">
                  {formatCurrency(ing.pricePerUnit, settings.currencySymbol)}/{ing.unit}
                </p>
              </button>
            ))
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
