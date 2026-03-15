import { useLiveQuery } from 'dexie-react-hooks'
import { toMonthlyCost, toDailyCost } from './useExpenses'
import { db } from '../db'

// ─── Helpers de fecha ────────────────────────────────────────────────────────
function startOf(period) {
  const d = new Date()
  if (period === 'day') {
    d.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    const day = d.getDay() // 0=dom
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    d.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
  }
  return d.toISOString()
}

// ─── Hook principal de métricas ───────────────────────────────────────────────
export function useDashboardStats(period = 'day') {
  return useLiveQuery(
    async () => {
      const from = startOf(period)

      // Órdenes del período
      const orders = await db.orders
        .where('createdAt').aboveOrEqual(from)
        .toArray()

      const delivered = orders.filter((o) => o.status === 'delivered')
      const active    = orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status))
      const cancelled = orders.filter((o) => o.status === 'cancelled')

      // Revenue = suma de órdenes entregadas
      const revenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0)

      // Pedidos pendientes de cobro (entregados pero no pagados)
      const unpaidTotal = delivered
        .filter((o) => !o.isPaid)
        .reduce((sum, o) => sum + (o.total || 0), 0)

      // Promedio por pedido
      const avgOrder = delivered.length > 0 ? revenue / delivered.length : 0

      // ── Plato más vendido del período ──
      const allItems = await db.orderItems
        .where('orderId')
        .anyOf(delivered.map((o) => o.id))
        .toArray()

      const recipeCount = {}
      for (const item of allItems) {
        recipeCount[item.recipeId] = (recipeCount[item.recipeId] || 0) + item.quantity
      }
      let topRecipeId = null
      let topQty = 0
      for (const [rid, qty] of Object.entries(recipeCount)) {
        if (qty > topQty) { topQty = qty; topRecipeId = Number(rid) }
      }
      const topRecipe = topRecipeId ? await db.recipes.get(topRecipeId) : null

      // ── Stock bajo ──
      const allIngredients = await db.ingredients.toArray()
      const lowStock = allIngredients.filter(
        (i) => i.stock !== null && i.lowStockAlert !== null && i.stock <= i.lowStockAlert
      )

      // ── Hora pico ──
      const hourBuckets = Array(24).fill(0)
      for (const o of delivered) {
        const h = new Date(o.createdAt).getHours()
        hourBuckets[h]++
      }
      const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets))
      const hasPeakData = Math.max(...hourBuckets) > 0

      // ── Comparación con período anterior ──
      const prevFrom = startOfPrev(period)
      const prevOrders = await db.orders
        .where('createdAt').between(prevFrom, from)
        .toArray()
      const prevRevenue = prevOrders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.total || 0), 0)

      const revenueChange = prevRevenue > 0
        ? ((revenue - prevRevenue) / prevRevenue) * 100
        : null

      // ── Deudas pendientes (método 'debt') ──
      const allDebtOrders = await db.orders
        .where('paymentMethod').equals('debt')
        .toArray()
      const totalDebt = allDebtOrders
        .filter((o) => o.status !== 'cancelled' && !o.isPaid)
        .reduce((sum, o) => sum + (o.total || 0), 0)

      return {
        // Financiero
        revenue,
        avgOrder,
        unpaidTotal,
        totalDebt,
        revenueChange,
        // Pedidos
        totalOrders:     orders.length,
        deliveredOrders: delivered.length,
        activeOrders:    active.length,
        cancelledOrders: cancelled.length,
        // Estrellas
        topRecipe,
        topRecipeQty: topQty,
        // Stock
        lowStockCount:  lowStock.length,
        lowStockNames:  lowStock.slice(0, 3).map((i) => i.name),
        // Hora pico
        peakHour: hasPeakData ? peakHour : null,
        // Activas (para la lista en dashboard)
        activeOrdersList: active,
      }
    },
    [period],
    null   // null = loading
  )
}

// Devuelve órdenes activas con nombre de cliente (para la lista del dashboard)
export function useActiveOrders() {
  return useLiveQuery(
    () => db.orders
      .where('status').anyOf(['pending', 'preparing', 'ready'])
      .reverse()
      .toArray(),
    [],
    []
  )
}

function startOfPrev(period) {
  const d = new Date()
  if (period === 'day') {
    d.setDate(d.getDate() - 1)
    d.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) - 7)
    d.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    d.setMonth(d.getMonth() - 1)
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
  }
  return d.toISOString()
}

// ─── Ganancia real del período (revenue - gastos proporcionales) ──────────────
export function useRealProfit(period = 'day', revenue = 0) {
  return useLiveQuery(
    async () => {
      const expenses = await db.expenses.toArray()
      let expenseCost = 0
      if (period === 'day') {
        expenseCost = expenses.reduce((s, e) => s + toDailyCost(e.amount, e.frequency), 0)
      } else if (period === 'week') {
        expenseCost = expenses.reduce((s, e) => s + toDailyCost(e.amount, e.frequency) * 7, 0)
      } else if (period === 'month') {
        expenseCost = expenses.reduce((s, e) => s + toMonthlyCost(e.amount, e.frequency), 0)
      }
      return {
        expenseCost,
        realProfit: revenue - expenseCost,
        hasExpenses: expenses.length > 0,
      }
    },
    [period, revenue],
    null
  )
}
