import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Save, Plus, X, Search, ShoppingBag,
  Clock, AlertCircle, ChevronDown, ChevronUp, Tag
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BottomSheet from '../components/BottomSheet'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useRecipes } from '../hooks/useRecipes'
import { useClients, searchClients, upsertClientFromOrder } from '../hooks/useClients'
import { useLocation } from 'react-router-dom'
import {
  saveOrder, useTodayOrderCount,
  PAYMENT_METHODS, FREE_DAILY_LIMIT,
} from '../hooks/useOrders'

// ─── Product picker ───────────────────────────────────────────────────────────
function ProductPicker({ isOpen, onClose, onSelect }) {
  const [search, setSearch] = useState('')
  const recipes = useRecipes()
  const activeRecipes = recipes.filter((r) => r.isActive !== false && !r.isPremiumCombo)
  const combos = recipes.filter((r) => r.isPremiumCombo === 1)

  const filtered = activeRecipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredCombos = combos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Agregar producto">
      <div className="px-4 py-3 border-b border-app">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-faint" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2.5 text-sm"
            autoFocus
          />
        </div>
      </div>

      {activeRecipes.length === 0 && combos.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-app-muted font-medium">No tenés productos activos.</p>
          <p className="text-xs text-app-faint mt-1">Creá productos en la sección Productos.</p>
        </div>
      ) : filtered.length === 0 && filteredCombos.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-app-faint">No se encontró "{search}"</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-100 pb-6">
          {/* Combos primero */}
          {filteredCombos.length > 0 && (
            <>
              <div className="px-4 py-2 bg-amber-50">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">🎁 Combos</p>
              </div>
              {filteredCombos.map((combo) => (
                <button
                  key={combo.id}
                  onClick={() => { onSelect(combo); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-app transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Tag size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-app-primary truncate">{combo.name}</p>
                    <p className="text-xs text-app-muted">{combo.comboItems?.length || 0} productos · precio especial</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-amber-600">
                      {formatCurrency(combo.salePrice, '$')}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}
          {/* Productos normales */}
          {filtered.length > 0 && (
            <>
              {filteredCombos.length > 0 && (
                <div className="px-4 py-2 bg-app">
                  <p className="text-xs font-bold text-app-muted uppercase tracking-wider">Productos</p>
                </div>
              )}
              {filtered.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => { onSelect(recipe); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-app transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <ShoppingBag size={18} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-app-primary truncate">{recipe.name}</p>
                    <p className="text-xs text-app-muted">{recipe.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary-600">
                      {formatCurrency(recipe.salePrice, '$')}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </BottomSheet>
  )
}

// ─── Order item row ───────────────────────────────────────────────────────────
function OrderItemRow({ item, settings, onQtyChange, onRemove }) {
  const lineTotal = (item.recipe?.salePrice ?? 0) * item.quantity
  const isCombo = !!item.recipe?.isPremiumCombo
  return (
    <div className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isCombo && <span className="text-xs bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-md">Combo</span>}
          <p className="text-sm font-semibold text-app-primary truncate">{item.recipe?.name}</p>
        </div>
        <p className="text-xs text-app-muted">
          {formatCurrency(item.recipe?.salePrice, settings.currencySymbol)} c/u
          {isCombo && ` · ${item.recipe?.comboItems?.length || 0} productos`}
        </p>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onQtyChange(Math.max(1, item.quantity - 1))}
          className="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center text-lg font-bold text-app-muted active:scale-90 transition-all"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-bold text-app-primary">{item.quantity}</span>
        <button
          onClick={() => onQtyChange(item.quantity + 1)}
          className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-lg font-bold text-primary-600 active:scale-90 transition-all"
        >
          +
        </button>
      </div>

      <div className="text-right w-16 shrink-0">
        <p className="text-sm font-bold text-app-secondary">
          {formatCurrency(lineTotal, settings.currencySymbol)}
        </p>
      </div>

      <button
        onClick={onRemove}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 active:scale-90 transition-all shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function OrderFormPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())
  const addToast = useAppStore((s) => s.addToast)

  const location = useLocation()
  const prefillClient = location.state?.prefillClient || null

  const todayCount = useTodayOrderCount()
  const atLimit = !isPremium && todayCount >= FREE_DAILY_LIMIT

  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [errors, setErrors] = useState({})

  // Form state
  const [items, setItems] = useState([])           // { recipe, recipeId, quantity }
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [notes, setNotes] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [clientId, setClientId] = useState(null)
  const [clientSuggestions, setClientSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestTimeout = useRef(null)

  // Prefill client if coming from ClientDetailPage
  useEffect(() => {
    if (prefillClient) {
      setClientName(prefillClient.name || '')
      setClientPhone(prefillClient.phone || '')
      setClientAddress(prefillClient.address || '')
      setClientId(prefillClient.id || null)
    }
  }, [])

  const total = useMemo(
    () => items.reduce((sum, i) => sum + (i.recipe?.salePrice ?? 0) * i.quantity, 0),
    [items]
  )

  async function handleClientNameChange(val) {
    setClientName(val)
    setClientId(null)
    clearTimeout(suggestTimeout.current)
    if (val.length >= 2) {
      suggestTimeout.current = setTimeout(async () => {
        const found = await searchClients(val)
        setClientSuggestions(found)
        setShowSuggestions(found.length > 0)
      }, 250)
    } else {
      setClientSuggestions([])
      setShowSuggestions(false)
    }
  }

  function selectClientSuggestion(client) {
    setClientName(client.name)
    setClientPhone(client.phone || '')
    setClientAddress(client.address || '')
    setClientId(client.id)
    setShowSuggestions(false)
  }

  function addProduct(recipe) {
    setItems((prev) => {
      const existing = prev.find((i) => i.recipeId === recipe.id)
      if (existing) {
        return prev.map((i) =>
          i.recipeId === recipe.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { recipe, recipeId: recipe.id, quantity: 1 }]
    })
    if (errors.items) setErrors((e) => ({ ...e, items: null }))
  }

  function updateQty(recipeId, qty) {
    setItems((prev) => prev.map((i) => i.recipeId === recipeId ? { ...i, quantity: qty } : i))
  }

  function removeItem(recipeId) {
    setItems((prev) => prev.filter((i) => i.recipeId !== recipeId))
  }

  function validate() {
    const e = {}
    if (items.length === 0) e.items = 'Agregá al menos un producto al pedido'
    return e
  }

  async function handleSave() {
    if (atLimit) { navigate('/premium'); return }
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setSaving(true)
    try {
      const orderId = await saveOrder(
        { clientName, clientPhone, clientAddress, paymentMethod, deliveryTime, notes, isPaid, clientId },
        items
      )
      // Auto-create or link client if name provided
      if (clientName.trim()) {
        await upsertClientFromOrder(orderId, { clientName, clientPhone, clientAddress, clientId })
      }
      addToast({ type: 'success', message: '¡Comanda creada! ✓' })
      navigate(`/comandas/${orderId}`, { replace: true })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader title="Nueva comanda" back />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-36 px-4 py-4 space-y-4">

        {/* Limit warning */}
        {!isPremium && todayCount >= FREE_DAILY_LIMIT - 5 && (
          <div
            onClick={() => navigate('/premium')}
            className={`rounded-2xl px-4 py-3 flex items-start gap-2 cursor-pointer active:scale-[0.99] border ${
              atLimit ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            <AlertCircle size={16} className={`shrink-0 mt-0.5 ${atLimit ? 'text-red-500' : 'text-amber-600'}`} />
            <div className="flex-1">
              <p className={`text-sm font-bold ${atLimit ? 'text-red-700' : 'text-amber-700'}`}>
                {atLimit ? 'Limite alcanzado — Plan Gratis' : `Casi en el limite — ${todayCount}/${FREE_DAILY_LIMIT} comandas hoy`}
              </p>
              <p className={`text-xs mt-0.5 ${atLimit ? 'text-red-600' : 'text-amber-600'}`}>
                {atLimit
                  ? 'Con Premium tenes comandas ilimitadas + analisis IA de costos.'
                  : 'Con Premium: ilimitadas + analisis IA + sugerencia de precios.'}
              </p>
              <span className={`mt-1 inline-block text-xs font-bold underline ${atLimit ? 'text-red-700' : 'text-amber-700'}`}>
                Ver Premium →
              </span>
            </div>
          </div>
        )}

        {/* ── Productos ── */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-app-secondary">Productos del pedido</p>
            <button
              onClick={() => setPickerOpen(true)}
              disabled={atLimit}
              className="flex items-center gap-1.5 bg-primary-600 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-40"
            >
              <Plus size={14} />
              Agregar
            </button>
          </div>

          {errors.items && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} />{errors.items}
            </p>
          )}

          {items.length === 0 ? (
            <button
              onClick={() => setPickerOpen(true)}
              disabled={atLimit}
              className="w-full py-8 border-2 border-dashed border-surface-300 rounded-2xl flex flex-col items-center gap-2 text-app-faint active:bg-app transition-colors disabled:opacity-40"
            >
              <ShoppingBag size={24} />
              <p className="text-sm font-medium">Tocá para agregar productos</p>
            </button>
          ) : (
            <>
              {items.map((item) => (
                <OrderItemRow
                  key={item.recipeId}
                  item={item}
                  settings={settings}
                  onQtyChange={(qty) => updateQty(item.recipeId, qty)}
                  onRemove={() => removeItem(item.recipeId)}
                />
              ))}

              <button
                onClick={() => setPickerOpen(true)}
                className="w-full py-2.5 text-sm font-semibold text-primary-600 bg-primary-50 rounded-xl active:bg-primary-100 transition-colors"
              >
                + Agregar otro producto
              </button>
            </>
          )}
        </div>

        {/* ── Cliente ── */}
        <div className="card space-y-3">
          <p className="text-sm font-bold text-app-secondary">Datos del cliente</p>
          <div className="relative">
            <label className="label">Nombre</label>
            <input
              type="text"
              placeholder="Ej: María, Juan García..."
              value={clientName}
              onChange={(e) => handleClientNameChange(e.target.value)}
              onFocus={() => clientSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="input-field"
            />
            {clientId && (
              <div className="mt-1 flex items-center gap-1 text-xs text-primary-600 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                Cliente registrado — historial disponible
              </div>
            )}
            {/* Suggestions dropdown */}
            {showSuggestions && clientSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-app rounded-2xl shadow-lg overflow-hidden">
                {clientSuggestions.map((c) => (
                  <button
                    key={c.id}
                    onMouseDown={() => selectClientSuggestion(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 active:bg-app text-left border-b border-surface-100 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary-700">
                        {c.name.split(' ').slice(0,2).map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-app-primary truncate">{c.name}</p>
                      {c.phone && <p className="text-xs text-app-faint">{c.phone}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Pago y entrega ── */}
        <div className="card space-y-4">
          <p className="text-sm font-bold text-app-secondary">Pago y entrega</p>

          {/* Payment method */}
          <div>
            <label className="label">Método de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setPaymentMethod(value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all active:scale-95 ${
                    paymentMethod === value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-app'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span className={`text-sm font-semibold ${paymentMethod === value ? 'text-primary-700' : 'text-gray-700'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Paid toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-app-secondary">¿Ya pagó?</p>
              <p className="text-xs text-app-faint">
                {paymentMethod === 'debt' ? 'Marcado como debe' : 'Marcá si ya cobró'}
              </p>
            </div>
            <button
              onClick={() => setIsPaid(!isPaid)}
              disabled={paymentMethod === 'debt'}
              className={`w-12 h-6 rounded-full transition-all relative disabled:opacity-40 ${
                isPaid ? 'bg-primary-500' : 'bg-surface-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-all absolute top-0.5 ${
                isPaid ? 'left-6.5' : 'left-0.5'
              }`} style={{ left: isPaid ? '26px' : '2px' }} />
            </button>
          </div>

          {/* Delivery time */}
          <div>
            <label className="label">
              <Clock size={13} className="inline mr-1 mb-0.5" />
              Hora de entrega (opcional)
            </label>
            <input
              type="time"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* ── Extra info (collapsible) ── */}
        <button
          onClick={() => setShowExtra(!showExtra)}
          className="w-full flex items-center justify-between px-4 py-3 bg-card-color rounded-2xl border border-app text-sm text-app-muted active:bg-app transition-colors"
        >
          <span className="font-medium">Teléfono, dirección y notas (opcional)</span>
          {showExtra ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showExtra && (
          <div className="card space-y-3">
            <div>
              <label className="label">Teléfono del cliente</label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="+54 9 11..."
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Dirección de entrega</label>
              <input
                type="text"
                placeholder="Calle y número..."
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Notas internas</label>
              <textarea
                placeholder="Sin sal, sin cebolla, con extra queso..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

      </div>

      {/* ── Fixed footer ── */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto border-t border-app px-4 py-3 z-30" style={{backgroundColor:"var(--bg-app)"}}>
        {items.length > 0 && (
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-sm text-app-muted">{items.length} producto(s)</p>
            <p className="text-lg font-display font-bold text-primary-600">
              {formatCurrency(total, settings.currencySymbol)}
            </p>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving || atLimit}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : 'Confirmar comanda'}
        </button>
      </div>

      <ProductPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addProduct}
      />
    </div>
  )
}
