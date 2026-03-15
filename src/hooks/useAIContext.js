import { db } from '../db'
import { toMonthlyCost } from './useExpenses'

// Recopila todo el contexto del negocio para enviárselo a la IA
export async function buildAIContext(settings) {
  const now = new Date()

  // ── Últimos 30 días de órdenes ──
  const from30 = new Date()
  from30.setDate(from30.getDate() - 30)
  from30.setHours(0, 0, 0, 0)

  const recentOrders = await db.orders
    .where('createdAt').aboveOrEqual(from30.toISOString())
    .toArray()

  const delivered = recentOrders.filter((o) => o.status === 'delivered')
  const cancelled = recentOrders.filter((o) => o.status === 'cancelled')
  const revenue30 = delivered.reduce((s, o) => s + (o.total || 0), 0)

  // ── Platos más vendidos ──
  const allItems = await db.orderItems
    .where('orderId').anyOf(delivered.map((o) => o.id))
    .toArray()

  const recipeCount = {}
  for (const item of allItems) {
    recipeCount[item.recipeId] = (recipeCount[item.recipeId] || 0) + item.quantity
  }
  const topRecipeIds = Object.entries(recipeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => Number(id))

  const topRecipes = await Promise.all(
    topRecipeIds.map(async (id) => {
      const r = await db.recipes.get(id)
      return r ? { name: r.name, qty: recipeCount[id], salePrice: r.salePrice, cost: r.cost } : null
    })
  ).then((rs) => rs.filter(Boolean))

  // ── Hora pico ──
  const hourBuckets = Array(24).fill(0)
  for (const o of delivered) {
    hourBuckets[new Date(o.createdAt).getHours()]++
  }
  const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets))

  // ── Stock bajo ──
  const ingredients = await db.ingredients.toArray()
  const lowStock = ingredients.filter(
    (i) => i.stock !== null && i.lowStockAlert !== null && i.stock <= i.lowStockAlert
  ).map((i) => ({ name: i.name, stock: i.stock, alert: i.lowStockAlert, unit: i.unit }))

  // ── Gastos fijos ──
  const expenses = await db.expenses.toArray()
  const monthlyExpenses = expenses.reduce((s, e) => s + toMonthlyCost(e.amount, e.frequency), 0)
  const expenseList = expenses.map((e) => ({ name: e.name, monthly: toMonthlyCost(e.amount, e.frequency) }))

  // ── Deudas ──
  const debtOrders = await db.orders
    .where('paymentMethod').equals('debt')
    .toArray()
  const totalDebt = debtOrders
    .filter((o) => !o.isPaid && o.status !== 'cancelled')
    .reduce((s, o) => s + (o.total || 0), 0)

  // ── Clientes ──
  const clients = await db.clients.count()

  // ── Margen promedio de recetas activas ──
  const activeRecipes = await db.recipes.filter((r) => r.isActive !== false).toArray()
  const avgMargin = activeRecipes.length > 0
    ? activeRecipes.reduce((s, r) => {
        const margin = r.cost > 0 ? ((r.salePrice - r.cost) / r.salePrice) * 100 : 0
        return s + margin
      }, 0) / activeRecipes.length
    : 0

  // ── Métodos de pago ──
  const paymentBreakdown = {}
  for (const o of delivered) {
    paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] || 0) + 1
  }

  return {
    businessName:   settings.businessName,
    country:        settings.country,
    currency:       settings.currency,
    currencySymbol: settings.currencySymbol,
    period:         '30 días',
    stats: {
      revenue30,
      totalOrders:     recentOrders.length,
      deliveredOrders: delivered.length,
      cancelledOrders: cancelled.length,
      avgOrderValue:   delivered.length > 0 ? revenue30 / delivered.length : 0,
      peakHour:        Math.max(...hourBuckets) > 0 ? peakHour : null,
      totalDebt,
      clients,
      monthlyExpenses,
      realMonthlyProfit: revenue30 - monthlyExpenses,
      avgMarginPercent: avgMargin,
      paymentBreakdown,
    },
    topRecipes,
    lowStockItems: lowStock,
    expenses:      expenseList,
  }
}

// Construye el prompt del sistema para Claude
export function buildSystemPrompt(context) {
  const sym = context.currencySymbol

  return `Sos una asesora de negocios especializada en emprendimientos de comida casera en Latinoamérica. Analizás datos reales del negocio "${context.businessName}" (${context.country}) y generás sugerencias prácticas, concretas y empáticas.

Tu respuesta SIEMPRE es en formato JSON puro (sin markdown, sin backticks). El JSON tiene esta estructura exacta:
{
  "greeting": "string corto y motivador (1 oración)",
  "summary": "análisis breve del estado del negocio en 2-3 oraciones",
  "suggestions": [
    {
      "id": "string único",
      "type": "revenue|cost|stock|marketing|operations",
      "priority": "high|medium|low",
      "icon": "emoji",
      "title": "título corto (max 6 palabras)",
      "body": "explicación concreta con números del negocio (2-3 oraciones)",
      "action": "texto del botón de acción (max 4 palabras)"
    }
  ],
  "alert": null o { "message": "string", "severity": "warning|danger" }
}

Generá entre 3 y 5 sugerencias. Ordenadas por prioridad (high primero). Usá los datos reales para personalizar con números concretos. Sé directa y práctica, sin rodeos.`
}

export function buildUserPrompt(context) {
  const sym = context.currencySymbol
  const s = context.stats

  const lines = [
    `Datos del negocio "${context.businessName}" — últimos ${context.period}:`,
    ``,
    `FINANZAS:`,
    `- Ingresos: ${sym}${s.revenue30.toFixed(2)}`,
    `- Pedidos: ${s.deliveredOrders} entregados de ${s.totalOrders} totales (${s.cancelledOrders} cancelados)`,
    `- Ticket promedio: ${sym}${s.avgOrderValue.toFixed(2)}`,
    `- Gastos fijos mensuales: ${sym}${s.monthlyExpenses.toFixed(2)}`,
    `- Ganancia real estimada: ${sym}${s.realMonthlyProfit.toFixed(2)}`,
    `- Margen promedio de productos: ${s.avgMarginPercent.toFixed(1)}%`,
    `- Deuda pendiente de clientes: ${sym}${s.totalDebt.toFixed(2)}`,
    ``,
    `OPERACIONES:`,
    `- Hora pico: ${s.peakHour !== null ? `${s.peakHour}:00hs` : 'sin datos suficientes'}`,
    `- Clientes registrados: ${s.clients}`,
    `- Métodos de pago: ${JSON.stringify(s.paymentBreakdown)}`,
    ``,
    `PRODUCTOS MÁS VENDIDOS:`,
    ...context.topRecipes.map((r) =>
      `- ${r.name}: ${r.qty} unidades, precio ${sym}${r.salePrice?.toFixed(2)}, costo ${sym}${r.cost?.toFixed(2)}`
    ),
    context.topRecipes.length === 0 ? '- Sin ventas registradas aún' : '',
    ``,
    `STOCK BAJO (ingredientes por debajo del mínimo):`,
    ...context.lowStockItems.map((i) =>
      `- ${i.name}: ${i.stock} ${i.unit} (mínimo: ${i.alert} ${i.unit})`
    ),
    context.lowStockItems.length === 0 ? '- Sin alertas de stock' : '',
    ``,
    `GASTOS FIJOS:`,
    ...context.expenses.map((e) => `- ${e.name}: ${sym}${e.monthly.toFixed(2)}/mes`),
    context.expenses.length === 0 ? '- No hay gastos registrados' : '',
  ].filter((l) => l !== undefined)

  return lines.join('\n')
}
