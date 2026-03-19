import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit2, TrendingUp, Package, Clock, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '../components/PageHeader'
import { PremiumBadge } from '../components/PremiumGate'
import { useAppStore, formatCurrency } from '../store/appStore'
import {
  useIngredient,
  useIngredientPriceHistory,
  updateIngredientStock,
  updateIngredientPrice,
} from '../hooks/useIngredients'

export default function IngredientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())
  const addToast = useAppStore((s) => s.addToast)

  const ingredient = useIngredient(Number(id))
  const priceHistory = useIngredientPriceHistory(Number(id))

  const [editStock, setEditStock] = useState(false)
  const [newStock, setNewStock] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [saving, setSaving] = useState(false)

  if (!ingredient) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader title="Ingrediente" back />
        <div className="flex items-center justify-center flex-1">
          <p className="text-app-faint">Cargando...</p>
        </div>
      </div>
    )
  }

  const isLow = ingredient.stock !== null &&
    ingredient.lowStockAlert !== null &&
    ingredient.stock <= ingredient.lowStockAlert

  async function handleSaveStock() {
    if (newStock === '' || isNaN(Number(newStock))) return
    setSaving(true)
    try {
      await updateIngredientStock(Number(id), Number(newStock))
      if (newPrice !== '' && !isNaN(Number(newPrice)) && Number(newPrice) > 0) {
        await updateIngredientPrice(Number(id), Number(newPrice))
      }
      addToast({ type: 'success', message: 'Stock actualizado ✓' })
      setEditStock(false)
      setNewStock('')
      setNewPrice('')
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  const chartData = [...priceHistory].reverse().map((h) => ({
    date: formatDate(h.date),
    precio: h.price,
  }))

  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader
        title={ingredient.name}
        subtitle={ingredient.category}
        back
        action={
          <button
            onClick={() => navigate(`/stock/editar/${id}`)}
            className="flex items-center gap-1.5 bg-surface-100 text-app-secondary text-sm font-semibold px-3 py-2 rounded-xl active:scale-95 transition-all"
          >
            <Edit2 size={15} />
            Editar
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 py-4 space-y-4">

        {/* ── Main info card ── */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-display font-bold text-app-primary">
                {formatCurrency(ingredient.pricePerUnit, settings.currencySymbol)}
              </p>
              <p className="text-sm text-app-muted">por {ingredient.unit}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLow ? 'bg-amber-100' : 'bg-primary-50'}`}>
              <Package size={22} className={isLow ? 'text-amber-600' : 'text-primary-600'} />
            </div>
          </div>
          {isLow && (
            <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                Stock bajo — quedan {ingredient.stock} {ingredient.unit}
              </p>
            </div>
          )}
        </div>

        {/* ── Stock card ── */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-app-secondary">Stock actual</p>
            <button
              onClick={() => {
                setEditStock(!editStock)
                setNewStock(ingredient.stock?.toString() || '0')
                setNewPrice('')
              }}
              className="text-xs font-bold text-primary-600 px-3 py-1.5 bg-primary-50 rounded-xl active:scale-95 transition-all"
            >
              {editStock ? 'Cancelar' : 'Actualizar stock'}
            </button>
          </div>

          {ingredient.stock !== null ? (
            <div className="flex items-end gap-2">
              <p className="text-3xl font-display font-bold text-app-primary">{ingredient.stock}</p>
              <p className="text-app-muted mb-1">{ingredient.unit}</p>
            </div>
          ) : (
            <p className="text-app-faint text-sm">Sin stock registrado</p>
          )}

          {ingredient.lowStockAlert !== null && (
            <p className="text-xs text-app-muted">
              Alarma: cuando baje de <strong>{ingredient.lowStockAlert} {ingredient.unit}</strong>
            </p>
          )}

          {editStock && (
            <div className="space-y-3 pt-2 border-t border-app">
              <div>
                <label className="label">Nuevo stock ({ingredient.unit})</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="input-field"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">
                  Nuevo precio por {ingredient.unit}{' '}
                  <span className="text-app-faint font-normal">(opcional — si cambio el precio)</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={`Precio actual: ${ingredient.pricePerUnit}`}
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                onClick={handleSaveStock}
                disabled={saving}
                className="btn-primary w-full py-3"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        {/* ── Price history (Premium) ── */}
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-app-muted" />
            <p className="text-sm font-bold text-app-secondary">Historial de precios</p>
            {!isPremium && <PremiumBadge />}
          </div>

          {!isPremium ? (
            <p className="text-sm text-app-muted">
              Con Premium ves como fue cambiando el precio de cada ingrediente con grafica.
            </p>
          ) : priceHistory.length < 2 ? (
            <p className="text-sm text-app-faint">Necesitas al menos 2 precios registrados para ver la grafica.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => `${settings.currencySymbol}${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(v, settings.currencySymbol)} />
                  <Line type="monotone" dataKey="precio" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="space-y-2 pt-2 border-t border-surface-100">
                {priceHistory.map((h, i) => (
                  <div key={h.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-app-faint" />
                      <p className="text-sm text-app-muted">{formatDate(h.date)}</p>
                      {i === 0 && <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Actual</span>}
                    </div>
                    <p className="text-sm font-bold text-app-primary">
                      {formatCurrency(h.price, settings.currencySymbol)}
                      <span className="text-app-faint font-normal"> /{ingredient.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-app-faint">
          Ultima actualizacion: {ingredient.updatedAt ? new Date(ingredient.updatedAt).toLocaleDateString('es-AR') : '—'}
        </p>
      </div>
    </div>
  )
}
