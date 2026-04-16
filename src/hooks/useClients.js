import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { pushRecord, pushDelete } from '../lib/sync'

// ─── Hooks de lectura ─────────────────────────────────────────────────────────
export function useClients() {
  return useLiveQuery(
    () => db.clients.orderBy('name').toArray(),
    [],
    []
  )
}

export function useClient(id) {
  return useLiveQuery(
    () => id ? db.clients.get(Number(id)) : null,
    [id],
    null
  )
}

// Historial de pedidos de un cliente con totales
export function useClientOrders(clientId) {
  return useLiveQuery(
    async () => {
      if (!clientId) return []
      const orders = await db.orders
        .where('clientId').equals(Number(clientId))
        .reverse()
        .toArray()
      return orders
    },
    [clientId],
    []
  )
}

// Estadísticas completas de un cliente
export function useClientStats(clientId) {
  return useLiveQuery(
    async () => {
      if (!clientId) return null
      const orders = await db.orders
        .where('clientId').equals(Number(clientId))
        .toArray()

      const delivered  = orders.filter((o) => o.status === 'delivered')
      const totalSpent = delivered.reduce((s, o) => s + (o.total || 0), 0)
      const debtOrders = orders.filter((o) => o.paymentMethod === 'debt' && !o.isPaid && o.status !== 'cancelled')
      const totalDebt  = debtOrders.reduce((s, o) => s + (o.total || 0), 0)
      const avgOrder   = delivered.length > 0 ? totalSpent / delivered.length : 0
      const lastOrder  = orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null

      // Producto favorito
      const allItems = await db.orderItems
        .where('orderId').anyOf(delivered.map((o) => o.id))
        .toArray()
      const recipeCount = {}
      for (const item of allItems) {
        recipeCount[item.recipeId] = (recipeCount[item.recipeId] || 0) + item.quantity
      }
      let topRecipeId = null, topQty = 0
      for (const [rid, qty] of Object.entries(recipeCount)) {
        if (qty > topQty) { topQty = qty; topRecipeId = Number(rid) }
      }
      const favRecipe = topRecipeId ? await db.recipes.get(topRecipeId) : null

      return {
        totalOrders:    orders.length,
        deliveredOrders: delivered.length,
        totalSpent,
        avgOrder,
        totalDebt,
        lastOrder,
        favRecipe,
        favRecipeQty: topQty,
      }
    },
    [clientId],
    null
  )
}

// Buscar cliente por nombre (para autocompletar en OrderForm)
export async function searchClients(query) {
  if (!query || query.length < 2) return []
  const all = await db.clients.toArray()
  const q = query.toLowerCase()
  return all.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
  ).slice(0, 6)
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export async function saveClient(data, id = null) {
  const now = new Date().toISOString()
  const payload = { name: data.name.trim(), phone: data.phone?.trim() || '', address: data.address?.trim() || '', notes: data.notes?.trim() || '', updatedAt: now }
  let clientId
  if (id) { await db.clients.update(id, payload); clientId = id }
  else { clientId = await db.clients.add({ ...payload, createdAt: now }) }
  const saved = await db.clients.get(clientId)
  pushRecord('clients', saved)
  return clientId
}

export async function deleteClient(id) {
  const orders = await db.orders.where('clientId').equals(id).toArray()
  for (const o of orders) await db.orders.update(o.id, { clientId: null })
  await db.clients.delete(id)
  pushDelete('clients', id)
}

// Vincula una orden a un cliente (o actualiza datos de cliente en la orden)
export async function linkOrderToClient(orderId, clientId) {
  const client = await db.clients.get(clientId)
  if (!client) return
  await db.orders.update(orderId, {
    clientId,
    clientName:    client.name,
    clientPhone:   client.phone,
    clientAddress: client.address,
    updatedAt:     new Date().toISOString(),
  })
}

// Crea o actualiza un cliente y lo vincula a la orden
export async function upsertClientFromOrder(orderId, orderData) {
  const now = new Date().toISOString()
  if (!orderData.clientName?.trim()) return null

  let clientId = orderData.clientId || null

  if (!clientId) {
    // Buscar si ya existe un cliente con ese nombre exacto
    const existing = await db.clients
      .filter((c) => c.name.toLowerCase() === orderData.clientName.trim().toLowerCase())
      .first()
    if (existing) {
      clientId = existing.id
    } else {
      clientId = await db.clients.add({
        name:      orderData.clientName.trim(),
        phone:     orderData.clientPhone?.trim() || '',
        address:   orderData.clientAddress?.trim() || '',
        notes:     '',
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // Actualiza la orden con el clientId
  await db.orders.update(orderId, { clientId, updatedAt: now })
  return clientId
}
