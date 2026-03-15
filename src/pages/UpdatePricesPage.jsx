import React, { useState } from 'react'
import { Save, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'
import { useIngredients, updateIngredientPrice } from '../hooks/useIngredients'

export default function UpdatePricesPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const addToast = useAppStore((s) => s.addToast)
  const ingredients = useIngredients()

  // Local editable prices: { [id]: string }
  const [prices, setPrices] = useState({})
  const [saving, setSaving] = useState(false)

  function getPrice(ing) {
    return prices[ing.id] !== undefined
      ? prices[ing.id]
      : ing.pricePerUnit?.toString() || ''
  }

  function setPrice(id, val) {
    setPrices((p) => ({ ...p, [id]: val }))
  }

  function getPriceDiff(ing) {
    const oldP = ing.pricePerUnit || 0
    const newP = Number(prices[ing.id])
    if (!prices[ing.id] || isNaN(newP) || newP === oldP) return null
    return { diff: newP - oldP, pct: oldP > 0 ? ((newP - oldP) / oldP) * 100 : 0 }
  }

  const changedCount = Object.entries(prices).filter(([id, val]) => {
    const ing = ingredients.find((i) => i.id === Number(id))
    return ing && val !== '' && Number(val) !== ing.pricePerUnit
  }).length

  async function handleSaveAll() {
    setSaving(true)
    try {
      const updates = Object.entries(prices).filter(([id, val]) => {
        const ing = ingredients.find((i) => i.id === Number(id))
        return ing && val !== '' && !isNaN(Number(val)) && Number(val) !== ing.pricePerUnit
      })

      await Promise.all(
        updates.map(([id, val]) => updateIngredientPrice(Number(id), Number(val)))
      )

      addToast({
        type: 'success',
        message: `${updates.length} precio(s) actualizado(s) ✓`,
      })
      navigate('/stock')
    } catch (err) {
      addToast({ type: 'error', message: 'Error al guardar: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader
        title="Actualizar precios"
        subtitle="Editá y guardá todo de una vez"
        back
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-32">

        {ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <RefreshCw size={32} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay ingredientes cargados aún.</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 bg-primary-50 border-b border-primary-100">
              <p className="text-xs text-primary-700 font-medium">
                💡 Cambiá los precios directamente y tocá "Guardar todo". El historial de precios se actualiza solo.
              </p>
            </div>

            <div className="px-4 mt-4 space-y-3">
              {ingredients.map((ing) => {
                const diff = getPriceDiff(ing)
                return (
                  <div key={ing.id} className="card">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{ing.name}</p>
                        <p className="text-xs text-gray-500">{ing.category} · por {ing.unit}</p>
                      </div>
                      {diff && (
                        <div className={`flex items-center gap-1 text-xs font-bold ${diff.diff > 0 ? 'text-red-500' : 'text-primary-600'}`}>
                          {diff.diff > 0
                            ? <TrendingUp size={13} />
                            : <TrendingDown size={13} />
                          }
                          {diff.pct > 0 ? '+' : ''}{diff.pct.toFixed(0)}%
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-gray-500 font-semibold text-sm shrink-0">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={getPrice(ing)}
                        onChange={(e) => setPrice(ing.id, e.target.value)}
                        className="input-field py-2.5 text-sm font-semibold"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {diff && (
                      <p className="text-xs mt-1.5 text-gray-500">
                        Anterior: <span className="line-through">{settings.currencySymbol}{ing.pricePerUnit?.toFixed(2)}</span>
                        {' → '}
                        <strong className={diff.diff > 0 ? 'text-red-500' : 'text-primary-600'}>
                          {settings.currencySymbol}{Number(prices[ing.id]).toFixed(2)}
                        </strong>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Save bar */}
      {ingredients.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-surface-200 px-4 py-3 z-30">
          <button
            onClick={handleSaveAll}
            disabled={saving || changedCount === 0}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
          >
            <Save size={18} />
            {saving
              ? 'Guardando...'
              : changedCount > 0
                ? `Guardar ${changedCount} cambio(s)`
                : 'Sin cambios'
            }
          </button>
        </div>
      )}
    </div>
  )
}
