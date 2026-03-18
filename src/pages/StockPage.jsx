import React, { useState } from 'react'
import { Plus, Search, Package, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useIngredients } from '../hooks/useIngredients'
import clsx from 'clsx'

export default function StockPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const [search, setSearch] = useState('')

  const allIngredients = useIngredients()

  const filtered = allIngredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = filtered.filter(
    (i) => i.stock !== null && i.lowStockAlert !== null && i.stock <= i.lowStockAlert
  )

  const ingredients = allIngredients // alias for subtitle count

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader
        title="Ingredientes & Stock"
        subtitle={`${ingredients.length} ingredientes`}
        action={
          <button
            onClick={() => navigate('/stock/nuevo')}
            className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4"
          >
            <Plus size={16} />
            Agregar
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24">

        {/* Search */}
        <div className="px-4 py-3 bg-white border-b border-surface-200">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ingrediente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <div className="mx-4 mt-3 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700">Stock bajo</p>
              <p className="text-xs text-amber-600">
                {lowStock.map(i => i.name).join(', ')} {lowStock.length === 1 ? 'está' : 'están'} por agotarse.
              </p>
            </div>
          </div>
        )}

        {/* Ingredients list */}
        <div className="px-4 mt-4 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Sin ingredientes aún"
              description="Cargá tus ingredientes con precios para calcular los costos reales de cada receta."
              action={
                <button
                  onClick={() => navigate('/stock/nuevo')}
                  className="btn-primary text-sm py-2.5 px-6"
                >
                  + Agregar ingrediente
                </button>
              }
            />
          ) : (
            filtered.map((ingredient) => {
              const isLow = ingredient.stock <= ingredient.lowStockAlert
              return (
                <button
                  key={ingredient.id}
                  onClick={() => navigate(`/stock/${ingredient.id}`)}
                  className="card-hover w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      isLow ? 'bg-amber-100' : 'bg-primary-50'
                    )}>
                      <Package size={18} className={isLow ? 'text-amber-600' : 'text-primary-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{ingredient.name}</p>
                        {isLow && (
                          <span className="badge bg-amber-100 text-amber-700">
                            <AlertTriangle size={10} />
                            Stock bajo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Stock: {ingredient.stock} {ingredient.unit}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-800">
                        {formatCurrency(ingredient.pricePerUnit, settings.currencySymbol)}
                      </p>
                      <p className="text-xs text-gray-400">por {ingredient.unit}</p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
