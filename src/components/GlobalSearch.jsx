import { useState, useEffect, useRef } from 'react'
import { Search, X, ShoppingBag, Package, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import { useAppStore, formatCurrency } from '../store/appStore'

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ recipes: [], ingredients: [], orders: [] })
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
    else { setQuery(''); setResults({ recipes: [], ingredients: [], orders: [] }) }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults({ recipes: [], ingredients: [], orders: [] }); return }
    const q = query.toLowerCase()
    const search = async () => {
      const [recipes, ingredients, orders] = await Promise.all([
        db.recipes.filter(r => r.name.toLowerCase().includes(q)).limit(4).toArray(),
        db.ingredients.filter(i => i.name.toLowerCase().includes(q)).limit(4).toArray(),
        db.orders.filter(o => (o.clientName || '').toLowerCase().includes(q)).limit(4).toArray(),
      ])
      setResults({ recipes, ingredients, orders })
    }
    search()
  }, [query])

  const total = results.recipes.length + results.ingredients.length + results.orders.length

  const go = (path) => { setOpen(false); navigate(path) }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 text-app-muted active:scale-95 transition-all"
      >
        <Search size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-app">
            <Search size={18} className="text-app-faint shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar productos, ingredientes, comandas..."
              className="flex-1 text-sm font-medium outline-none text-app-primary placeholder:text-app-faint"
            />
            <button onClick={() => setOpen(false)} className="text-app-faint active:scale-95">
              <X size={20} />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {query && total === 0 && (
              <p className="text-sm text-app-faint text-center py-12">Sin resultados para "{query}"</p>
            )}

            {results.recipes.length > 0 && (
              <section>
                <p className="text-xs font-bold text-app-faint uppercase tracking-wider mb-2">Productos</p>
                <div className="space-y-2">
                  {results.recipes.map(r => (
                    <button key={r.id} onClick={() => go(`/productos/${r.id}`)}
                      className="w-full flex items-center gap-3 p-3 bg-app rounded-xl text-left active:bg-surface-100">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <ShoppingBag size={14} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-app-primary truncate">{r.name}</p>
                      </div>
                      <p className="text-sm font-bold text-gold-600 shrink-0">
                        {formatCurrency(r.salePrice, settings.currencySymbol)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {results.ingredients.length > 0 && (
              <section>
                <p className="text-xs font-bold text-app-faint uppercase tracking-wider mb-2">Ingredientes</p>
                <div className="space-y-2">
                  {results.ingredients.map(i => (
                    <button key={i.id} onClick={() => go(`/stock/${i.id}`)}
                      className="w-full flex items-center gap-3 p-3 bg-app rounded-xl text-left active:bg-surface-100">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Package size={14} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-app-primary truncate">{i.name}</p>
                        <p className="text-xs text-app-faint">Stock: {i.stock} {i.unit}</p>
                      </div>
                      <p className="text-sm font-bold text-app-muted shrink-0">
                        {formatCurrency(i.pricePerUnit, settings.currencySymbol)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {results.orders.length > 0 && (
              <section>
                <p className="text-xs font-bold text-app-faint uppercase tracking-wider mb-2">Comandas</p>
                <div className="space-y-2">
                  {results.orders.map(o => (
                    <button key={o.id} onClick={() => go(`/comandas/${o.id}`)}
                      className="w-full flex items-center gap-3 p-3 bg-app rounded-xl text-left active:bg-surface-100">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <ClipboardList size={14} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-app-primary truncate">{o.clientName || 'Sin nombre'}</p>
                        <p className="text-xs text-app-faint">{new Date(o.createdAt).toLocaleDateString('es-AR')}</p>
                      </div>
                      <p className="text-sm font-bold text-gold-600 shrink-0">
                        {formatCurrency(o.total, settings.currencySymbol)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {!query && (
              <p className="text-sm text-app-faint text-center py-12">Escribí para buscar...</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
