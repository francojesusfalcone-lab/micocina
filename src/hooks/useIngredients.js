import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAppStore } from '../store/appStore'
import { notifyIfLowStock } from './useStockNotifications'

// ─── Unidades disponibles ────────────────────────────────────────────────────
export const UNITS = [
  { value: 'g',    label: 'Gramos (g)' },
  { value: 'kg',   label: 'Kilogramos (kg)' },
  { value: 'ml',   label: 'Mililitros (ml)' },
  { value: 'l',    label: 'Litros (l)' },
  { value: 'u',    label: 'Unidades (u)' },
  { value: 'taza', label: 'Tazas' },
  { value: 'cdas', label: 'Cucharadas' },
  { value: 'cdita',label: 'Cucharaditas' },
]

export const CATEGORIES = [
  'Lácteos',
  'Carnes y fiambres',
  'Harinas y cereales',
  'Verduras y frutas',
  'Aceites y grasas',
  'Condimentos y especias',
  'Huevos',
  'Azúcares y endulzantes',
  'Bebidas',
  'Packaging',
  'Otros',
]

// ─── Hook principal ──────────────────────────────────────────────────────────
export function useIngredients() {
  const ingredients = useLiveQuery(
    () => db.ingredients.orderBy('name').toArray(),
    [],
    []
  )
  return ingredients
}

export function useIngredient(id) {
  return useLiveQuery(
    () => id ? db.ingredients.get(Number(id)) : null,
    [id],
    null
  )
}

export function useIngredientPriceHistory(ingredientId) {
  return useLiveQuery(
    () => ingredientId
      ? db.ingredientPriceHistory
          .where('ingredientId').equals(Number(ingredientId))
          .reverse()
          .limit(10)
          .toArray()
      : [],
    [ingredientId],
    []
  )
}

// ─── Operaciones CRUD ────────────────────────────────────────────────────────
export async function saveIngredient(data, existingId = null) {
  const now = new Date().toISOString()

  if (existingId) {
    // Update
    const old = await db.ingredients.get(existingId)
    await db.ingredients.update(existingId, { ...data, updatedAt: now })

    // Si cambió el precio, guardar en historial
    if (old && old.pricePerUnit !== data.pricePerUnit) {
      await db.ingredientPriceHistory.add({
        ingredientId: existingId,
        price: data.pricePerUnit,
        date: now,
      })
    }
    return existingId
  } else {
    // Create
    const id = await db.ingredients.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    })
    // Guardar precio inicial en historial
    await db.ingredientPriceHistory.add({
      ingredientId: id,
      price: data.pricePerUnit,
      date: now,
    })
    return id
  }
}

export async function deleteIngredient(id) {
  // Verificar si está usado en alguna receta
  const usedIn = await db.recipeIngredients
    .where('ingredientId').equals(id)
    .count()

  if (usedIn > 0) {
    throw new Error(`Este ingrediente está usado en ${usedIn} receta(s). Eliminalo de las recetas primero.`)
  }

  await db.ingredientPriceHistory.where('ingredientId').equals(id).delete()
  await db.ingredients.delete(id)
}

export async function updateIngredientPrice(id, newPrice) {
  const now = new Date().toISOString()
  await db.ingredients.update(id, { pricePerUnit: newPrice, updatedAt: now })
  await db.ingredientPriceHistory.add({
    ingredientId: id,
    price: newPrice,
    date: now,
  })
}

export async function updateIngredientStock(id, newStock) {
  const now = new Date().toISOString()
  await db.ingredients.update(id, { stock: newStock, updatedAt: now })
}

// Descuenta stock al registrar venta (lo llama el módulo de comandas)
export async function deductStock(ingredientId, amount) {
  const ingredient = await db.ingredients.get(ingredientId)
  if (!ingredient) return
  const newStock = Math.max(0, (ingredient.stock || 0) - amount)
  await db.ingredients.update(ingredientId, {
    stock: newStock,
    updatedAt: new Date().toISOString(),
  })
  await notifyIfLowStock(ingredientId)
}
