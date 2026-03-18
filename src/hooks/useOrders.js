import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { deductStock } from './useIngredients'

// ─── Constantes ──────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700',      dot: 'bg-amber-400' },
  preparing: { label: 'Preparando', color: 'bg-blue-100 text-blue-700',        dot: 'bg-blue-400' },
  ready:     { label: 'Listo',      color: 'bg-primary-100 text-primary-700',  dot: 'bg-primary-500' },
  delivered: { label: 'Entregado',  color: 'bg-gray-100 text-gray-500',        dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-100 text-red-500',          dot: 'bg-red-400' },
}

export const STATUS_FLOW = ['pending', 'preparing', 'ready', 'delivered']

export const PAYMENT_METHODS = [
  { value: 'cash',        label: 'Efectivo',       icon: '💵' },
  { value: 'transfer',    label: 'Transferencia',  icon: '🏦' },
  { value: 'mercadopago', label: 'MercadoPago',    icon: '💙' },
  { value: 'debt',        label: 'Debe',           icon: '📋' },
]

export const FREE_DAILY_LIMIT = 20

// ─── Hooks de lectura ─────────────────────────────────────────────────────────
export function useOrders() {
  return useLiveQuery(
    () => db.orders.orderBy('createdAt').reverse().toArray(),
    [],
    []
  )
}

export function useOrder(id) {
  return useLiveQuery(
    () => id ? db.orders.get(Number(id)) : null,
    [id],
    null
  )
}

// Items de una orden con receta resuelta
export function useOrderItems(orderId) {
  return useLiveQuery(
    async () => {
      if (!orderId) return []
      const items = await db.orderItems
        .where('orderId').equals(Number(orderId))
        .toArray()
      return Promise.all(
        items.map(async (item) => ({
          ...item,
          recipe: await db.recipes.get(item.recipeId),
        }))
      )
    },
    [orderId],
    []
  )
}

// Órdenes activas del día (para el dashboard y alarmas)
export function useTodayOrders() {
  return useLiveQuery(
    async () => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const all = await db.orders
        .where('createdAt').aboveOrEqual(start.toISOString())
        .toArray()
      return all
    },
    [],
    []
  )
}

// Contador de órdenes hoy (para límite plan gratis)
export function useTodayOrderCount() {
  return useLiveQuery(
    async () => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      return db.orders
        .where('createdAt').aboveOrEqual(start.toISOString())
        .count()
    },
    [],
    0
  )
}

// ─── CRUD ────────────────────────────────────────────────────────────────────
export async function saveOrder(orderData, items) {
  const now = new Date().toISOString()

  // Calcular total
  const total = items.reduce((sum, item) => {
    return sum + (item.recipe?.salePrice ?? item.unitPrice ?? 0) * item.quantity
  }, 0)

  const orderId = await db.orders.add({
    clientName:    orderData.clientName || '',
    clientId:      orderData.clientId || null,
    clientPhone:   orderData.clientPhone || '',
    clientAddress: orderData.clientAddress || '',
    status:        'pending',
    paymentMethod: orderData.paymentMethod || 'cash',
    deliveryTime:  orderData.deliveryTime || '',
    notes:         orderData.notes || '',
    total,
    isPaid:        orderData.isPaid ?? false,
    stockDeducted: false,
    createdAt:     now,
    updatedAt:     now,
  })

  // Guardar items
  await db.orderItems.bulkAdd(
    items.map((item) => ({
      orderId,
      recipeId:   item.recipeId,
      quantity:   item.quantity,
      unitPrice:  item.recipe?.salePrice ?? item.unitPrice ?? 0,
    }))
  )

  return orderId
}

export async function updateOrderStatus(id, status) {
  const now = new Date().toISOString()
  const order = await db.orders.get(id)
  if (!order) return

  await db.orders.update(id, { status, updatedAt: now })

  // Al marcar como entregado, descontar stock si no se hizo
  if (status === 'delivered' && !order.stockDeducted) {
    const items = await db.orderItems.where('orderId').equals(id).toArray()
    for (const item of items) {
      const recipeItems = await db.recipeIngredients
        .where('recipeId').equals(item.recipeId)
        .toArray()
      for (const ri of recipeItems) {
        await deductStock(ri.ingredientId, ri.quantity * item.quantity)
      }
    }
    await db.orders.update(id, { stockDeducted: true, updatedAt: now })
  }
}

export async function cancelOrder(id, restoreStock) {
  const now = new Date().toISOString()
  const order = await db.orders.get(id)
  if (!order) return

  // Si se pide devolver stock y ya se había descontado
  if (restoreStock && order.stockDeducted) {
    const items = await db.orderItems.where('orderId').equals(id).toArray()
    for (const item of items) {
      const recipeItems = await db.recipeIngredients
        .where('recipeId').equals(item.recipeId)
        .toArray()
      for (const ri of recipeItems) {
        const ing = await db.ingredients.get(ri.ingredientId)
        if (ing) {
          const restored = (ing.stock || 0) + ri.quantity * item.quantity
          await db.ingredients.update(ri.ingredientId, {
            stock: restored,
            updatedAt: now,
          })
        }
      }
    }
  }

  await db.orders.update(id, {
    status: 'cancelled',
    stockDeducted: false,
    updatedAt: now,
  })
}

export async function deleteOrder(id) {
  await db.orderItems.where('orderId').equals(id).delete()
  await db.orders.delete(id)
}

export async function markOrderPaid(id, isPaid) {
  await db.orders.update(id, {
    isPaid,
    updatedAt: new Date().toISOString(),
  })
}

// Recalcula el total de una orden (por si cambian precios)
export async function recalcOrderTotal(id) {
  const items = await db.orderItems.where('orderId').equals(id).toArray()
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  await db.orders.update(id, { total, updatedAt: new Date().toISOString() })
  return total
}

// Formatea comanda para copiar a WhatsApp
export async function buildWhatsAppText(orderId, settings) {
  const order = await db.orders.get(orderId)
  if (!order) return ''

  const items = await db.orderItems.where('orderId').equals(orderId).toArray()
  const itemLines = await Promise.all(
    items.map(async (item) => {
      const recipe = await db.recipes.get(item.recipeId)
      const price = item.unitPrice * item.quantity
      return `  • ${item.quantity}x ${recipe?.name ?? 'Producto'} — ${settings.currencySymbol}${price.toFixed(2)}`
    })
  )

  const payLabel = PAYMENT_METHODS.find((p) => p.value === order.paymentMethod)?.label ?? 'Efectivo'

  const lines = [
    `🍽️ *Pedido confirmado — ${settings.businessName}*`,
    ``,
    order.clientName ? `👤 Cliente: ${order.clientName}` : null,
    order.deliveryTime ? `🕐 Entrega: ${order.deliveryTime}` : null,
    ``,
    `*Detalle:*`,
    ...itemLines,
    ``,
    `💰 Total: *${settings.currencySymbol}${order.total.toFixed(2)}*`,
    `💳 Pago: ${payLabel}`,
    order.notes ? `\n📝 Nota: ${order.notes}` : null,
  ].filter(Boolean).join('\n')

  return lines
}
