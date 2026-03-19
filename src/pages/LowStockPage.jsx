import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Package, ChevronRight, Bell } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useIngredients, updateIngredientStock } from '../hooks/useIngredients'
import { db } from '../db'

export default function LowStockPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const addToast = useAppStore((s) => s.addToast)
  const allIngredients = useIngredients()
  const [editingId, setEditingId] = useState(null)
  const [newAlert, setNewAlert] = useState('')
  const [saving, setSaving] = useState(false)

  const lowStock = allIngredients.filter(
    i => i.stock !== null && i.lowStockAlert !== null && i.stock <= i.lowStockAlert
  )
  const normal = allIngredients.filter(
    i => i.lowStockAlert !== null && i.stock !== null && i.stock > i.lowStockAlert
  )
  const noAlert = allIngredients.filter(i => i.lowStockAlert === null)

  async function saveAlert(id) {
    if (newAlert === '' || isNaN(Number(newAlert))) return
    setSaving(true)
    try {
      await db.ingredients.update(id, {
        lowStockAlert: Number(newAlert),
        updatedAt: new Date().toISOString(),
      })
      addToast({ type: 'success', message: 'Alarma actualizada ✓' })
      setEditingId(null)
      setNewAlert('')
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  function IngredientRow({ ing, isLow }) {
    const editing = editingId === ing.id
    return (
      <div className={`p-3 rounded-2xl border mb-2 ${isLow ? 'bg-red-950/20 border-red-800' : 'border-app'}`}
           style={!isLow ? {backgroundColor:'var(--bg-card)'} : {}}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isLow ? 'bg-red-900/30' : ''}`}
               style={!isLow ? {backgroundColor:'var(--bg-input)'} : {}}>
            {isLow
              ? <AlertTriangle size={16} className="text-red-500" />
              : <Package size={16} className="text-app-faint" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-app-primary">{ing.name}</p>
            <p className={`text-xs ${isLow ? 'text-red-400 font-semibold' : 'text-app-muted'}`}>
              Stock: {ing.stock} {ing.unit}
              {ing.lowStockAlert !== null && ` / Alarma: ${ing.lowStockAlert} ${ing.unit}`}
            </p>
          </div>
          <button
            onClick={() => navigate(`/stock/${ing.id}`)}
            className="text-xs text-primary-600 font-bold px-2 py-1 bg-primary-50 rounded-lg"
          >
            Ver
          </button>
        </div>

        {/* Editar alarma inline */}
        <button
          onClick={() => { setEditingId(editing ? null : ing.id); setNewAlert(ing.lowStockAlert?.toString() || '') }}
          className="mt-2 flex items-center gap-1 text-xs text-app-faint font-medium"
        >
          <Bell size={11} />
          {editing ? 'Cancelar' : `Editar alarma`}
        </button>

        {editing && (
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              value={newAlert}
              onChange={e => setNewAlert(e.target.value)}
              className="input-field text-sm py-2 flex-1"
              placeholder={`Alarma en ${ing.unit}`}
              min="0"
              autoFocus
            />
            <button
              onClick={() => saveAlert(ing.id)}
              disabled={saving}
              className="btn-primary text-sm px-4 py-2"
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader title="Stock bajo" back />
      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 py-4">

        {lowStock.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-3">
              <Package size={24} className="text-primary-600" />
            </div>
            <p className="text-sm font-semibold text-app-secondary">Todo el stock esta OK</p>
            <p className="text-xs text-app-faint mt-1">No hay ingredientes por debajo de su alarma</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
              {lowStock.length} ingrediente{lowStock.length !== 1 ? 's' : ''} con stock bajo
            </p>
            {lowStock.map(ing => <IngredientRow key={ing.id} ing={ing} isLow={true} />)}
          </>
        )}

        {normal.length > 0 && (
          <>
            <p className="text-xs font-bold text-app-faint uppercase tracking-wide mt-4 mb-2">Stock OK</p>
            {normal.map(ing => <IngredientRow key={ing.id} ing={ing} isLow={false} />)}
          </>
        )}

        {noAlert.length > 0 && (
          <>
            <p className="text-xs font-bold text-app-faint uppercase tracking-wide mt-4 mb-2">Sin alarma configurada</p>
            {noAlert.map(ing => (
              <div key={ing.id} className="p-3 rounded-2xl border border-app mb-2 flex items-center gap-3"
                   style={{backgroundColor:'var(--bg-card)'}}>
                <Package size={16} className="text-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-app-secondary">{ing.name}</p>
                  <p className="text-xs text-app-faint">Stock: {ing.stock ?? '—'} {ing.unit}</p>
                </div>
                <button onClick={() => navigate(`/stock/editar/${ing.id}`)} className="text-xs text-primary-600 font-bold">
                  Configurar
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
