code = """import { useEffect, useRef } from 'react'
import { db } from '../db'

export function useStockNotifications() {
  const asked = useRef(false)
  useEffect(() => {
    if (asked.current) return
    asked.current = true
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') Notification.requestPermission()
    checkAllLowStock()
  }, [])
}

async function checkAllLowStock() {
  if (Notification.permission !== 'granted') return
  try {
    const all = await db.ingredients.toArray()
    const low = all.filter(
      (i) => i.stock !== null && i.lowStockAlert !== null && i.stock <= i.lowStockAlert
    )
    if (!low.length) return
    const names = low.map((i) => i.name).join(', ')
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
"""

with open(r'C:\Users\franc\OneDrive\Escritorio\micocina\src\hooks\useStockNotifications.js', 'w', encoding='utf-8') as f:
    f.write(code)
print('ok')
