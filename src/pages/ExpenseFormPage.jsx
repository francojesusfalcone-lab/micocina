import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, AlertCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore, formatCurrency } from '../store/appStore'
import {
  useExpense, saveExpense,
  toMonthlyCost, toDailyCost,
  EXPENSE_CATEGORIES, FREQUENCY_OPTIONS,
} from '../hooks/useExpenses'
import clsx from 'clsx'

export default function ExpenseFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const addToast = useAppStore((s) => s.addToast)

  const existing = useExpense(id ? Number(id) : null)
  const isEditing = !!id

  const [form, setForm] = useState({
    name:      '',
    category:  'other',
    amount:    '',
    frequency: 'monthly',
    notes:     '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Load existing data
  useEffect(() => {
    if (existing) {
      setForm({
        name:      existing.name,
        category:  existing.category,
        amount:    String(existing.amount),
        frequency: existing.frequency,
        notes:     existing.notes || '',
      })
    }
  }, [existing])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'El nombre es obligatorio'
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      e.amount = 'Ingresá un monto válido mayor a 0'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSaving(true)
    try {
      await saveExpense(form, isEditing ? Number(id) : null)
      addToast({ type: 'success', message: isEditing ? 'Gasto actualizado ✓' : 'Gasto guardado ✓' })
      navigate('/gastos', { replace: true })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const sym = settings.currencySymbol
  const amount = parseFloat(form.amount) || 0
  const monthly = toMonthlyCost(amount, form.frequency)
  const daily   = toDailyCost(amount, form.frequency)

  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader
        title={isEditing ? 'Editar gasto' : 'Nuevo gasto fijo'}
        back
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-36 px-4 py-4 space-y-4">

        {/* ── Nombre ── */}
        <div className="card space-y-3">
          <div>
            <label className="label">Nombre del gasto *</label>
            <input
              type="text"
              placeholder="Ej: Gas, Alquiler cocina, Netflix..."
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={clsx('input-field', errors.name && 'border-red-300')}
              autoFocus={!isEditing}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />{errors.name}
              </p>
            )}
          </div>
        </div>

        {/* ── Categoría ── */}
        <div className="card space-y-3">
          <p className="text-sm font-bold text-app-secondary">Categoría</p>
          <div className="grid grid-cols-2 gap-2">
            {EXPENSE_CATEGORIES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => set('category', value)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all active:scale-95',
                  form.category === value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-app bg-white'
                )}
              >
                <span className="text-lg">{icon}</span>
                <span className={clsx('text-xs font-semibold', form.category === value ? 'text-primary-700' : 'text-gray-600')}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Frecuencia ── */}
        <div className="card space-y-3">
          <p className="text-sm font-bold text-app-secondary">¿Con qué frecuencia lo pagás?</p>
          <div className="space-y-2">
            {FREQUENCY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => set('frequency', value)}
                className={clsx(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all active:scale-[0.99]',
                  form.frequency === value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-app bg-white'
                )}
              >
                <span className={clsx('text-sm font-semibold', form.frequency === value ? 'text-primary-700' : 'text-gray-700')}>
                  {label}
                </span>
                {form.frequency === value && (
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Monto ── */}
        <div className="card space-y-3">
          <div>
            <label className="label">
              Monto ({FREQUENCY_OPTIONS.find(f => f.value === form.frequency)?.label?.toLowerCase()}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-faint font-semibold text-sm">
                {sym}
              </span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                className={clsx('input-field pl-8', errors.amount && 'border-red-300')}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />{errors.amount}
              </p>
            )}
          </div>

          {/* Equivalencias */}
          {amount > 0 && form.frequency !== 'one_time' && (
            <div className="p-3 bg-app rounded-xl space-y-1.5">
              <p className="text-xs font-bold text-app-muted uppercase tracking-wide">Equivale a</p>
              {form.frequency !== 'monthly' && (
                <div className="flex justify-between text-sm">
                  <span className="text-app-muted">Por mes</span>
                  <span className="font-bold text-app-secondary">{formatCurrency(monthly, sym)}</span>
                </div>
              )}
              {form.frequency !== 'daily' && (
                <div className="flex justify-between text-sm">
                  <span className="text-app-muted">Por día</span>
                  <span className="font-bold text-app-secondary">{formatCurrency(daily, sym)}</span>
                </div>
              )}
            </div>
          )}
          {form.frequency === 'one_time' && (
            <p className="text-xs text-app-faint italic">
              Los gastos únicos no se suman al costo fijo mensual/diario recurrente.
            </p>
          )}
        </div>

        {/* ── Notas ── */}
        <div className="card">
          <label className="label">Notas (opcional)</label>
          <textarea
            placeholder="Contrato de alquiler vence en junio, revisar..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="input-field resize-none"
            rows={3}
          />
        </div>

      </div>

      {/* ── Fixed footer ── */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-app px-4 py-3 z-30">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar gasto'}
        </button>
      </div>
    </div>
  )
}
