import React, { useState } from 'react'
import { Plus, Wallet, Trash2, ChevronRight, TrendingDown, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import BottomSheet from '../components/BottomSheet'
import { useAppStore, formatCurrency } from '../store/appStore'
import {
  useExpenses, deleteExpense,
  toMonthlyCost, toDailyCost,
  EXPENSE_CATEGORIES, FREQUENCY_OPTIONS,
} from '../hooks/useExpenses'
import clsx from 'clsx'

// ─── Confirm delete sheet ─────────────────────────────────────────────────────
function DeleteSheet({ expense, settings, onClose, onConfirm }) {
  if (!expense) return null
  return (
    <BottomSheet isOpen={!!expense} onClose={onClose} title="Eliminar gasto">
      <div className="px-5 py-5 space-y-4">
        <p className="text-sm text-gray-600">
          ¿Eliminás <strong>{expense.name}</strong>? Esto no afecta el historial de ventas.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary py-3">Cancelar</button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-2xl active:scale-95 transition-all"
          >
            Eliminar
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())
  const addToast = useAppStore((s) => s.addToast)

  const expenses = useExpenses()
  const [toDelete, setToDelete] = useState(null)

  const sym = settings.currencySymbol

  const monthlyTotal = expenses.reduce((s, e) => s + toMonthlyCost(e.amount, e.frequency), 0)
  const dailyTotal   = expenses.reduce((s, e) => s + toDailyCost(e.amount, e.frequency), 0)

  async function handleDelete() {
    await deleteExpense(toDelete.id)
    addToast({ type: 'success', message: `"${toDelete.name}" eliminado` })
    setToDelete(null)
  }

  function getCatIcon(cat) {
    return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.icon ?? '📌'
  }
  function getFreqLabel(freq) {
    return FREQUENCY_OPTIONS.find((f) => f.value === freq)?.label ?? 'Mensual'
  }

  // ── Premium gate ──
  if (!isPremium) {
    return (
      <div className="flex flex-col min-h-full bg-surface-50">
        <PageHeader title="Gastos fijos" back />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
            <Lock size={32} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">
              Función Premium
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Registrá tus gastos fijos (gas, luz, alquiler...) y descubrí tu ganancia real después de costos. Incluido en Premium.
            </p>
          </div>
          <button
            onClick={() => navigate('/premium')}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2"
          >
            <Wallet size={18} />
            Activar Premium — $5/mes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader
        title="Gastos fijos"
        subtitle="Lo que sale aunque no vendas"
        back
        action={
          <button
            onClick={() => navigate('/gastos/nuevo')}
            className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4"
          >
            <Plus size={16} />
            Nuevo
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 py-4 space-y-4">

        {/* ── Totals card ── */}
        {expenses.length > 0 && (
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={18} className="text-red-200" />
              <p className="text-sm font-bold text-red-100">Resumen de costos fijos</p>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-red-200 font-medium">Por mes</p>
                <p className="text-2xl font-display font-bold">
                  {formatCurrency(monthlyTotal, sym)}
                </p>
              </div>
              <div className="w-px bg-red-400" />
              <div className="flex-1">
                <p className="text-xs text-red-200 font-medium">Por día equiv.</p>
                <p className="text-2xl font-display font-bold">
                  {formatCurrency(dailyTotal, sym)}
                </p>
              </div>
            </div>
            <p className="text-xs text-red-200 mt-3 leading-relaxed">
              Este monto se descuenta de tus ganancias para calcular tu ganancia real.
            </p>
          </div>
        )}

        {/* ── Expense list ── */}
        {expenses.length === 0 ? (
          <EmptyState
            icon={Wallet}
            lottieUrl="https://assets5.lottiefiles.com/packages/lf20_vPnn3K.json"
            title="Sin gastos registrados"
            description="Registrá tus costos fijos para saber cuánto ganás realmente."
            action={
              <button
                onClick={() => navigate('/gastos/nuevo')}
                className="btn-primary text-sm py-2.5 px-6"
              >
                + Agregar gasto
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const monthly = toMonthlyCost(expense.amount, expense.frequency)
              return (
                <div key={expense.id} className="card">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0 text-xl">
                      {getCatIcon(expense.category)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{expense.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500">{getFreqLabel(expense.frequency)}</span>
                        {expense.frequency !== 'monthly' && expense.frequency !== 'one_time' && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">
                              ≈ {formatCurrency(monthly, sym)}/mes
                            </span>
                          </>
                        )}
                      </div>
                      {expense.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate italic">{expense.notes}</p>
                      )}
                    </div>

                    {/* Amount + actions */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <p className="text-base font-bold text-red-500">
                        {formatCurrency(expense.amount, sym)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/gastos/editar/${expense.id}`)}
                          className="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center active:scale-90 transition-all"
                        >
                          <ChevronRight size={14} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => setToDelete(expense)}
                          className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center active:scale-90 transition-all"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Tip ── */}
        {expenses.length > 0 && (
          <div className="px-4 py-3 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-xs text-blue-600 leading-relaxed">
              💡 <strong>Tip:</strong> Para saber si ganás de verdad, tus ventas mensuales tienen que superar{' '}
              <strong>{formatCurrency(monthlyTotal, sym)}</strong> solo en gastos fijos, antes de contar ingredientes.
            </p>
          </div>
        )}

      </div>

      <DeleteSheet
        expense={toDelete}
        settings={settings}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
