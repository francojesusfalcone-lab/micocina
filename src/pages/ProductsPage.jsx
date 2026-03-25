import React, { useState } from 'react'
import { Plus, Search, ShoppingBag, ChevronRight, Flame } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { PremiumBadge } from '../components/PremiumGate'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useRecipes } from '../hooks/useRecipes'
import { FREE_RECIPE_LIMIT } from '../hooks/useOrders'

export default function ProductsPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('recipes')

  const allRecipes = useRecipes()
  const atLimit = !isPremium && allRecipes.length >= FREE_RECIPE_LIMIT

  const filtered = allRecipes
    .filter((r) => tab === 'recipes' ? !r.isSimple : !!r.isSimple)
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col min-h-full bg-app ">
      <PageHeader
        title="Productos"
        subtitle={`${allRecipes.length} producto${allRecipes.length !== 1 ? 's' : ''} cargado${allRecipes.length !== 1 ? 's' : ''}`}
        action={
          <button
            onClick={() => atLimit ? navigate('/premium') : navigate('/productos/nuevo')}
            className={`flex items-center gap-1.5 text-sm py-2 px-4 rounded-2xl font-semibold transition-all active:scale-95 ${atLimit ? 'bg-amber-100 text-amber-700' : 'btn-primary'}`}
          >
            <Plus size={16} />
            Agregar
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24">

        {/* Search */}
        <div className="px-4 py-3 border-b border-app" style={{backgroundColor:'var(--bg-app)'}}>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-faint" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 py-2.5 text-sm"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {[
              { id: 'recipes', label: 'Con receta' },
              { id: 'simple',  label: 'Sin receta' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  tab === id
                    ? 'bg-primary-600 text-white'
                    : 'text-app-muted'
                }`}
                style={tab !== id ? {backgroundColor:'var(--bg-input)'} : {}}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => isPremium ? navigate('/combos') : navigate('/premium')}
              className="px-4 py-1.5 rounded-xl text-sm font-semibold text-app-muted flex items-center gap-1.5"
              style={{backgroundColor:'var(--bg-input)'}}
            >
              Combos
              {!isPremium && <PremiumBadge />}
            </button>
          </div>
        </div>

        {/* Plan limit banner — solo comandas, recetas son ilimitadas */}

        {/* Banner límite free */}
        {!isPremium && (
          <div className={`mx-4 mt-3 px-4 py-3 rounded-2xl border flex items-center gap-2 ${atLimit ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'}`}>
            <ShoppingBag size={16} className={atLimit ? 'text-amber-500 shrink-0' : 'text-blue-500 shrink-0'} />
            <p className={`text-xs font-medium flex-1 ${atLimit ? 'text-amber-700' : 'text-blue-600'}`}>
              Plan Gratis: <strong>{allRecipes.length}/{FREE_RECIPE_LIMIT}</strong> productos.
              {atLimit && ' ¡Límite alcanzado!'}
            </p>
            {atLimit && (
              <button onClick={() => navigate('/premium')} className="text-xs font-bold underline text-amber-700 shrink-0">
                Mejorar
              </button>
            )}
          </div>
        )}

        {/* Quick price generator shortcut */}
        <button
          onClick={() => navigate('/precio-rapido')}
          className="mx-4 mt-3 w-[calc(100%-2rem)] flex items-center justify-between bg-primary-50 border border-primary-200 rounded-2xl px-4 py-3 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
              <Flame size={16} className="text-primary-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-primary-700">Generador de precio rápido</p>
              <p className="text-xs text-primary-500">Sin armar receta completa</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-primary-400" />
        </button>

        {/* Product list */}
        <div className="px-4 mt-4 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Sin productos aún"
              description={
                tab === 'recipes'
                  ? 'Agregá tu primera receta para calcular costos y precios de venta reales.'
                  : 'Los productos simples son bebidas o extras sin receta.'
              }
              action={
                <button
                  onClick={() => navigate('/productos/nuevo')}
                  className="btn-primary text-sm py-2.5 px-6"
                >
                  + Agregar producto
                </button>
              }
              image="/empty-productos.png"
            />
          ) : (
            filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => navigate(`/productos/${recipe.id}`)}
                className="card-hover  w-full flex items-center gap-3 text-left"
              >
                {/* Avatar con inicial del producto */}
                <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center bg-primary-600 text-white font-display font-bold text-xl select-none">
                  {recipe.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-app-primary  truncate">{recipe.name}</p>
                    {!recipe.isActive && (
                      <span className="badge bg-gray-100 text-app-muted text-[10px]">Pausado</span>
                    )}
                  </div>
                  <p className="text-sm text-app-muted dark:text-app-faint mt-0.5">
                    Costo: {formatCurrency(recipe.costPerPortion ?? recipe.lastCalculatedCost, settings.currencySymbol)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gold-600">
                    {formatCurrency(recipe.salePrice, settings.currencySymbol)}
                  </p>
                  <p className="text-xs text-app-faint dark:text-app-muted mt-0.5">precio venta</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
