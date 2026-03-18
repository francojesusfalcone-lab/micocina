import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { PremiumBadge } from '../components/PremiumGate'
import { Crown } from 'lucide-react'

const PERIODS = [
  { id: 'day',   label: 'Hoy' },
  { id: 'week',  label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year',  label: 'Año', premium: true },
]

function startOf(period) {
  const d = new Date()
  if (period === 'day')   { d.setHours(0,0,0,0); return d }
  if (period === 'week')  { const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); d.setHours(0,0,0,0); return d }
  if (period === 'month') { d.setDate(1); d.setHours(0,0,0,0); return d }
  if (period === 'year')  { d.setMonth(0,1); d.setHours(0,0,0,0); return d }
  return d
}

function bucketLabel(date, period) {
  const d = new Date(date)
  if (period === 'day')   return `${d.getHours()}:00`
  if (period === 'week')  return ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'][d.getDay()]
  if (period === 'month') return `${d.getDate()}/${d.getMonth()+1}`
  if (period === 'year')  return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()]
  return ''
}

function bucketKey(date, period) {
  const d = new Date(date)
  if (period === 'day')   return d.getHours()
  if (period === 'week')  return d.getDay()
  if (period === 'month') return d.getDate()
  if (period === 'year')  return d.getMonth()
  return 0
}

export default function StatsPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())
  const [period, setPeriod] = useState('week')

  const data = useLiveQuery(async () => {
    const from = startOf(period)
    const orders = await db.orders
      .where('createdAt').aboveOrEqual(from.toISOString())
      .toArray()
    const expenses = await db.expenses.toArray()

    const delivered = orders.filter(o => o.status === 'delivered')

    // Calcular costo real sumando ingredientes de cada receta
    const buckets = {}

    for (const order of delivered) {
      const key = bucketKey(order.createdAt, period)
      const label = bucketLabel(order.createdAt, period)
      if (!buckets[key]) buckets[key] = { label, ingresos: 0, costos: 0 }
      buckets[key].ingresos += order.total || 0

      // Calcular costo de ingredientes
      const items = await db.orderItems.where('orderId').equals(order.id).toArray()
      for (const item of items) {
        const ri = await db.recipeIngredients.where('recipeId').equals(item.recipeId).toArray()
        for (const r of ri) {
          const ing = await db.ingredients.get(r.ingredientId)
          if (ing) buckets[key].costos += (ing.pricePerUnit || 0) * r.quantity * item.quantity
        }
      }
    }

    // Gastos fijos proporcionales al período
    const totalExpenses = expenses.reduce((s, e) => {
      if (period === 'day')   return s + (e.amount / 30)
      if (period === 'week')  return s + (e.amount / 4)
      if (period === 'month') return s + e.amount
      if (period === 'year')  return s + (e.amount * 12)
      return s
    }, 0)

    const result = Object.values(buckets).map(b => ({
      ...b,
      neto: Math.max(0, b.ingresos - b.costos),
      gastos: Math.round(totalExpenses / Math.max(Object.keys(buckets).length, 1)),
    }))

    const totalIngresos = result.reduce((s, b) => s + b.ingresos, 0)
    const totalNeto = result.reduce((s, b) => s + b.neto, 0)
    const totalGastos = totalExpenses

    return { chart: result, totalIngresos, totalNeto, totalGastos }
  }, [period], null)


  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader title="Estadisticas" />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 py-4 space-y-4">

        {/* Selector de período */}
        <div className="flex gap-2">
          {PERIODS.map(({ id, label, premium }) => {
            const locked = premium && !isPremium
            return (
              <button
                key={id}
                onClick={() => locked ? navigate('/premium') : setPeriod(id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  period === id ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 border border-surface-200'
                } ${locked ? 'opacity-60' : ''}`}
              >
                {label}
                {locked && <Crown size={11} className="text-amber-500" />}
              </button>
            )
          })}
        </div>

        {/* Totales */}
        {data && (
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Ingresos</p>
              <p className="text-base font-display font-bold text-primary-600">{formatCurrency(data.totalIngresos, settings.currencySymbol)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Ganancia neta</p>
              <p className="text-base font-display font-bold text-blue-600">{formatCurrency(data.totalNeto, settings.currencySymbol)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Gastos fijos</p>
              <p className="text-base font-display font-bold text-red-500">{formatCurrency(data.totalGastos, settings.currencySymbol)}</p>
            </div>
          </div>
        )}

        {/* Grafica */}
        <div className="card">
          <p className="text-sm font-bold text-gray-700 mb-4">Evolucion</p>
          {!data || data.chart.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-sm text-gray-400">Sin datos para este periodo</p>
              <p className="text-xs text-gray-400 mt-1">Registra comandas para ver tus estadisticas</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={55} tickFormatter={(v) => `${settings.currencySymbol}${v}`} />
                <Tooltip formatter={(v, name) => [formatCurrency(v, settings.currencySymbol), name]} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="neto" name="Ganancia neta" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="gastos" name="Gastos fijos" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Nota gastos */}
          {!isPremium && (
            <button onClick={() => navigate('/premium')} className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl py-2 font-medium">
              <Crown size={12} className="text-amber-500" />
              Activa Premium para ver Gastos fijos y periodo Anual
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
