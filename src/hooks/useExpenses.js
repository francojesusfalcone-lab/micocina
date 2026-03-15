import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

// ─── Categorías de gastos ────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  { value: 'gas',       label: 'Gas',             icon: '🔥' },
  { value: 'light',     label: 'Luz',              icon: '💡' },
  { value: 'water',     label: 'Agua',             icon: '💧' },
  { value: 'rent',      label: 'Alquiler',         icon: '🏠' },
  { value: 'packaging', label: 'Envases/packaging', icon: '📦' },
  { value: 'transport', label: 'Transporte',       icon: '🚗' },
  { value: 'phone',     label: 'Teléfono/internet', icon: '📱' },
  { value: 'salary',    label: 'Sueldos',          icon: '👩‍💼' },
  { value: 'cleaning',  label: 'Limpieza',         icon: '🧹' },
  { value: 'other',     label: 'Otros',            icon: '📌' },
]

export const FREQUENCY_OPTIONS = [
  { value: 'monthly',   label: 'Mensual' },
  { value: 'weekly',    label: 'Semanal' },
  { value: 'daily',     label: 'Diario' },
  { value: 'annual',    label: 'Anual' },
  { value: 'one_time',  label: 'Único (no recurrente)' },
]

// Normaliza cualquier gasto a un costo mensual equivalente
export function toMonthlyCost(amount, frequency) {
  switch (frequency) {
    case 'daily':    return amount * 30
    case 'weekly':   return amount * 4.33
    case 'monthly':  return amount
    case 'annual':   return amount / 12
    case 'one_time': return 0   // no se suma al mensual recurrente
    default:         return amount
  }
}

// Normaliza a costo diario equivalente
export function toDailyCost(amount, frequency) {
  switch (frequency) {
    case 'daily':    return amount
    case 'weekly':   return amount / 7
    case 'monthly':  return amount / 30
    case 'annual':   return amount / 365
    case 'one_time': return 0
    default:         return amount / 30
  }
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function useExpenses() {
  return useLiveQuery(
    () => db.expenses.orderBy('createdAt').reverse().toArray(),
    [],
    []
  )
}

export function useExpense(id) {
  return useLiveQuery(
    () => id ? db.expenses.get(Number(id)) : null,
    [id],
    null
  )
}

// Costo total mensual de todos los gastos recurrentes
export function useMonthlyExpenseTotal() {
  return useLiveQuery(
    async () => {
      const all = await db.expenses.toArray()
      return all.reduce((sum, e) => sum + toMonthlyCost(e.amount, e.frequency), 0)
    },
    [],
    0
  )
}

// Costo diario equivalente (para el dashboard "hoy")
export function useDailyExpenseTotal() {
  return useLiveQuery(
    async () => {
      const all = await db.expenses.toArray()
      return all.reduce((sum, e) => sum + toDailyCost(e.amount, e.frequency), 0)
    },
    [],
    0
  )
}

// ─── CRUD ────────────────────────────────────────────────────────────────────
export async function saveExpense(data, id = null) {
  const now = new Date().toISOString()
  const payload = {
    name:        data.name.trim(),
    category:    data.category || 'other',
    amount:      parseFloat(data.amount) || 0,
    frequency:   data.frequency || 'monthly',
    isRecurring: data.frequency !== 'one_time',
    notes:       data.notes?.trim() || '',
    updatedAt:   now,
  }
  if (id) {
    await db.expenses.update(id, payload)
    return id
  }
  return db.expenses.add({ ...payload, createdAt: now })
}

export async function deleteExpense(id) {
  await db.expenses.delete(id)
}
