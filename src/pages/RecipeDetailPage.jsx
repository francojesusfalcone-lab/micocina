import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit2, Package, Calculator, ToggleLeft, ToggleRight, Share2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore, formatCurrency } from '../store/appStore'
import {
  useRecipe, useRecipeIngredients,
  toggleRecipeActive, calcRecipeCost,
} from '../hooks/useRecipes'

export default function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const addToast = useAppStore((s) => s.addToast)

  const recipe = useRecipe(Number(id))
  const recipeItems = useRecipeIngredients(Number(id))

  if (!recipe) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader title="Receta" back />
        <div className="flex items-center justify-center flex-1">
          <p className="text-app-faint text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  const costPerPortion = recipe.costPerPortion ?? recipe.lastCalculatedCost ?? 0
  const profit = (recipe.salePrice || 0) - costPerPortion
  const margin = recipe.salePrice > 0 && costPerPortion > 0
    ? ((profit / recipe.salePrice) * 100).toFixed(0)
    : 0

  async function handleToggleActive() {
    try {
      await toggleRecipeActive(Number(id), !recipe.isActive)
      addToast({
        type: 'success',
        message: recipe.isActive ? 'Producto pausado' : 'Producto activado',
      })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    }
  }

  function handleShare() {
    const text =
      `🍽️ *${recipe.name}*\n` +
      `Precio: ${settings.currencySymbol}${recipe.salePrice?.toFixed(2)}\n` +
      (recipe.description ? `\n${recipe.description}` : '')
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
      addToast({ type: 'success', message: 'Copiado al portapapeles' })
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader
        title={recipe.name}
        subtitle={recipe.category}
        back
        action={
          <button
            onClick={() => navigate(`/productos/editar/${id}`)}
            className="flex items-center gap-1.5 bg-surface-100 text-app-secondary text-sm font-semibold px-3 py-2 rounded-xl active:scale-95 transition-all"
          >
            <Edit2 size={15} />
            Editar
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 py-4 space-y-4">

        {/* ── Price & profit card ── */}
        <div className="card space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-display font-bold text-app-primary">
                {formatCurrency(recipe.salePrice, settings.currencySymbol)}
              </p>
              <p className="text-sm text-app-muted mt-0.5">precio de venta</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-100 active:scale-95 transition-all"
              >
                <Share2 size={18} className="text-app-muted" />
              </button>
              <button
                onClick={handleToggleActive}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-100 active:scale-95 transition-all"
              >
                {recipe.isActive
                  ? <ToggleRight size={22} className="text-primary-600" />
                  : <ToggleLeft  size={22} className="text-app-faint" />
                }
              </button>
            </div>
          </div>

          {!recipe.isActive && (
            <div className="px-3 py-2 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-700 font-medium">
                ⚠️ Este producto está pausado y no aparece al crear comandas.
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-surface-100">
            <div className="text-center">
              <p className="text-xs text-app-muted mb-0.5">Costo</p>
              <p className="text-sm font-bold text-app-secondary">
                {formatCurrency(costPerPortion, settings.currencySymbol)}
              </p>
            </div>
            <div className="text-center border-x border-app">
              <p className="text-xs text-app-muted mb-0.5">Ganancia</p>
              <p className={`text-sm font-bold ${profit >= 0 ? 'text-primary-600' : 'text-red-500'}`}>
                {formatCurrency(profit, settings.currencySymbol)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-app-muted mb-0.5">Margen</p>
              <p className={`text-sm font-bold ${Number(margin) >= 30 ? 'text-primary-600' : 'text-amber-600'}`}>
                {margin}%
              </p>
            </div>
          </div>
        </div>

        {/* ── Portions info ── */}
        {recipe.portions > 1 && (
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-bold text-sm">{recipe.portions}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-app-secondary">Rinde {recipe.portions} porciones</p>
              <p className="text-xs text-app-muted">
                Costo total receta: {formatCurrency(recipe.lastCalculatedCost, settings.currencySymbol)}
              </p>
            </div>
          </div>
        )}

        {/* ── Ingredients list ── */}
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-app-muted" />
            <p className="text-sm font-bold text-app-secondary">
              Ingredientes ({recipeItems.length})
            </p>
          </div>

          {recipeItems.length === 0 ? (
            <p className="text-sm text-app-faint">Sin ingredientes cargados.</p>
          ) : (
            <div className="space-y-2">
              {recipeItems.map((item) => {
                const itemCost = item.ingredient
                  ? item.ingredient.pricePerUnit * item.quantity
                  : 0
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Package size={13} className="text-primary-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-app-secondary">{item.ingredient?.name}</p>
                        <p className="text-xs text-app-muted">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-app-secondary">
                      {formatCurrency(itemCost, settings.currencySymbol)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Cost breakdown ── */}
        <div className="card bg-app border-app space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={15} className="text-app-muted" />
            <p className="text-sm font-bold text-app-muted">Desglose de costos</p>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-app-muted">Ingredientes</span>
            <span className="font-medium">{formatCurrency(recipe.lastCalculatedCost, settings.currencySymbol)}</span>
          </div>
          {recipe.portions > 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-app-muted">÷ {recipe.portions} porciones</span>
              <span className="font-medium">{formatCurrency(costPerPortion, settings.currencySymbol)}/u</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-app pt-2">
            <span className="text-app-muted">Precio de venta</span>
            <span className="font-bold text-app-primary">{formatCurrency(recipe.salePrice, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={profit >= 0 ? 'text-primary-600 font-bold' : 'text-red-500 font-bold'}>
              Ganancia neta
            </span>
            <span className={profit >= 0 ? 'text-primary-600 font-bold' : 'text-red-500 font-bold'}>
              {formatCurrency(profit, settings.currencySymbol)} ({margin}%)
            </span>
          </div>
        </div>

        {/* Description */}
        {recipe.description && (
          <div className="card">
            <p className="text-xs font-bold text-app-muted mb-1">Notas</p>
            <p className="text-sm text-app-secondary">{recipe.description}</p>
          </div>
        )}

      </div>
    </div>
  )
}
