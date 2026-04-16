/* global Notification */
import { useEffect, useRef } from 'react'
import { db } from '../db'

// ─── Stock notifications ──────────────────────────────────────────────────────
export function useStockNotifications() {
  const asked = useRef(false)
  useEffect(() => {
    if (asked.current) return
    asked.current = true
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(() => {
        checkAllLowStock()
        scheduleOrderNotifications()
      })
    } else {
      checkAllLowStock()
      scheduleOrderNotifications()
    }
  }, [])
}

async function checkAllLowStock() {
  if (Notification.permission !== 'granted') return
  try {
    const all = await db.ingredients.toArray()
    const low = all.filter(i => i.stock !== null && i.lowStockAlert !== null && i.stock <= i.lowStockAlert)
    if (!low.length) return
    const names = low.map(i => i.name).join(', ')
    const msg = low.length === 1 ? names + ' esta por agotarse.' : names + ' estan por agotarse.'
    new Notification('Stock bajo en MiCuchina', { body: msg, icon: '/icon-192.png', tag: 'low-stock-check' })
  } catch (e) { console.warn('[stockNotif]', e) }
}

export async function notifyIfLowStock(ingredientId) {
  if (Notification.permission !== 'granted') return
  try {
    const i = await db.ingredients.get(ingredientId)
    if (!i || i.stock === null || i.lowStockAlert === null) return
    if (i.stock > i.lowStockAlert) return
    new Notification('Stock bajo: ' + i.name, {
      body: 'Quedan ' + i.stock + ' ' + i.unit + '. Considera reponer pronto.',
      icon: '/icon-192.png',
      tag: 'low-stock-' + ingredientId,
    })
  } catch (e) { console.warn('[stockNotif]', e) }
}

// ─── Order delivery notifications ────────────────────────────────────────────
// Timers activos en memoria (sobreviven mientras la app esté abierta)
const activeTimers = new Map()

export async function scheduleOrderNotifications() {
  if (Notification.permission !== 'granted') return
  try {
    // Solo comandas activas de hoy con hora de entrega
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const orders = await db.orders
      .where('createdAt').aboveOrEqual(start.toISOString())
      .toArray()

    const pending = orders.filter(o =>
      o.deliveryTime &&
      o.status !== 'delivered' &&
      o.status !== 'cancelled' &&
      o.status !== 'cancelled_wasted'
    )

    for (const order of pending) {
      scheduleOneOrder(order)
    }
  } catch (e) { console.warn('[orderNotif]', e) }
}

export function scheduleOneOrder(order) {
  if (!order.deliveryTime || !order.id) return
  if (activeTimers.has(order.id)) return // ya programada

  const [hours, minutes] = order.deliveryTime.split(':').map(Number)
  const deliveryDate = new Date()
  deliveryDate.setHours(hours, minutes, 0, 0)

  // Notificar 15 minutos antes
  const notifyAt = new Date(deliveryDate.getTime() - 15 * 60 * 1000)
  const now = Date.now()
  const msUntil = notifyAt.getTime() - now

  if (msUntil <= 0) return // ya pasó

  const timer = setTimeout(() => {
    if (Notification.permission !== 'granted') return
    const name = order.clientName ? `para ${order.clientName}` : ''
    new Notification('🍽️ Pedido próximo a entregar', {
      body: `El pedido ${name} vence a las ${order.deliveryTime}. ¡Preparate!`,
      icon: '/icon-192.png',
      tag: 'order-notify-' + order.id,
    })
    activeTimers.delete(order.id)
  }, msUntil)

  activeTimers.set(order.id, timer)
}

export function cancelOrderNotification(orderId) {
  if (activeTimers.has(orderId)) {
    clearTimeout(activeTimers.get(orderId))
    activeTimers.delete(orderId)
  }
}
