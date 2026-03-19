import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PackagePlus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'
import { db } from '../db'

export default function StockReplenishPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const settings = useAppStore((s) => s.settings)
  const addToast = useAppStore((s) => s.addToast)

  const [ingredient, setIngredient] = useState(null)
  const [history, setHistory] = useState([])
  const [quantity, setQuantity] = useState('')
  const [priceMode, setPriceMode] = useState('unit') // 'unit' | 'total'
  const [priceInput, setPriceInput] = useState('')
  const [saving, setSaving] = useState(false)

  const sym = settings.currencySymbol || '$'

  useEffect(() => {
    async function load() {
      const ing = await db.ingredients.get(Number(id))
      setIngredient(ing)
      const hist = await db.stockReplenishments
        .where('ingredientId').equals(Number(id))
        .reverse()
        .sortBy('date')
      setHistory(hist.slice(0, 10))
    }
    load()
  }, [id])

  async function handleSave() {
    if (!quantity || !priceInput) return
    setSaving(true)
    try {
      const qty = parseFloat(quantity)
      const price = parseFloat(priceInput)
      const pricePerUnit = priceMode === 'unit' ? price : price / qty
      const totalPrice = priceMode === 'total' ? price : price * qty
      const now = new Date().toISOString()

      // Guardar reposición
      await db.stockReplenishments.add({
        ingredientId: Number(id),
        date: now,
        quantity: qty,
        totalPrice,
        pricePerUnit,
      })

      // Actualizar stock del ingrediente
      const current = ingredient.stock || 0
      await db.ingredients.update(Number(id), {
        stock: current + qty,
        pricePerUnit,
        updatedAt: now,
      })

      // Guardar en historial de precios
      await db.ingredientPriceHistory.add({
        ingredientId: Number(id),
        price: pricePerUnit,
        date: now,
      })

      addToast({ type: 'success', message: `Stock actualizado ✓ +${qty} ${ingredient.unit}` })
      navigate(`/stock/${id}`)
    } catch (e) {
      addToast({ type: 'error', message: 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  function formatCurrency(n) {
    return `${sym}${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (!ingredient) return null

  const pricePerUnitPreview = priceInput && quantity
    ? priceMode === 'unit'
      ? parseFloat(priceInput)
      : parseFloat(priceInput) / parseFloat(quantity)
    : null

  return (
    <div className="flex flex-col bg-app min-h-screen">
      <PageHeader title={`Reponer ${ingredient.name}`} back />

      <div className="px-4 py-4 space-y-4">

        {/* Formulario */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-surface-100">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <PackagePlus size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-app-secondary">¿Cuánto compraste?</p>
              <p className="text-xs text-app-faint">Stock actual: {ingredient.stock || 0} {ingredient.unit}</p>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="label">Cantidad comprada ({ingredient.unit})</label>
            <input
              type="text"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Ej: 5`}
              className="input-field"
              autoFocus
            />
          </div>

          {/* Modo de precio */}
          <div>
            <label className="label">¿Cómo ingresás el precio?</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPriceMode('unit')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  priceMode === 'unit'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-app bg-white text-gray-500'
                }`}
              >
                Por {ingredient.unit}
              </button>
              <button
                onClick={() => setPriceMode('total')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  priceMode === 'total'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-app bg-white text-gray-500'
                }`}
              >
                Total pagado
              </button>
            </div>
          </div>

          {/* Precio */}
          <div>
            <label className="label">
              {priceMode === 'unit' ? `Precio por ${ingredient.unit} (${sym})` : `Total pagado (${sym})`}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-faint font-medium">{sym}</span>
              <input
                type="text"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0.00"
                className="input-field pl-8"
              />
            </div>
          </div>

          {/* Preview */}
          {pricePerUnitPreview && quantity && (
            <div className="bg-primary-50 rounded-xl px-3 py-2.5 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-app-muted">Precio por {ingredient.unit}</span>
                <span className="font-bold text-primary-700">{formatCurrency(pricePerUnitPreview)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-app-muted">Nuevo stock total</span>
                <span className="font-semibold text-app-secondary">
                  {((ingredient.stock || 0) + parseFloat(quantity)).toFixed(2)} {ingredient.unit}
                </span>
              </div>
              {ingredient.pricePerUnit && Math.abs(pricePerUnitPreview - ingredient.pricePerUnit) > 0.01 && (
                <div className="flex justify-between text-xs pt-1 border-t border-primary-100">
                  <span className="text-app-muted">Precio anterior</span>
                  <span className={`font-semibold ${pricePerUnitPreview > ingredient.pricePerUnit ? 'text-red-500' : 'text-green-600'}`}>
                    {formatCurrency(ingredient.pricePerUnit)} → {formatCurrency(pricePerUnitPreview)}
                    {pricePerUnitPreview > ingredient.pricePerUnit ? ' ↑' : ' ↓'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Historial de reposiciones */}
        {history.length > 0 && (
          <div className="card space-y-2">
            <p className="text-xs font-bold text-app-muted uppercase tracking-wide">Últimas compras</p>
            <div className="divide-y divide-surface-100">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-app-secondary">
                      +{h.quantity} {ingredient.unit}
                    </p>
                    <p className="text-xs text-app-faint">{formatDate(h.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-app-secondary">{formatCurrency(h.pricePerUnit)}<span className="text-xs font-normal text-app-faint"> /{ingredient.unit}</span></p>
                    <p className="text-xs text-app-faint">Total: {formatCurrency(h.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-0 pb-6 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !quantity || !priceInput}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <PackagePlus size={18} />
            {saving ? 'Guardando...' : 'Confirmar reposición'}
          </button>
          <p className="text-center text-xs text-gray-300 py-4">Desarrollado por Franco Falcone</p>
        </div>

      </div>
    </div>
  )
}
