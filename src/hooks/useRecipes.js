import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { pushRecord, pushDelete } from '../lib/sync'

export const RECIPE_CATEGORIES = [
  'Pizzas',
  'Empanadas',
  'Hamburguesas',
  'Repostería y tortas',
  'Pan y facturas',
  'Viandas y platos',
  'Ensaladas',
  'Bebidas',
  'Comida fitness',
  'Postres',
  'Salsas y aderezos',
  'Otros',
]

// ─── Hooks de lectura ────────────────────────────────────────────────────────

export function useRecipes() {
  return useLiveQuery(
    () => db.recipes.orderBy('name').toArray(),
    [],
    []
  )
}

export function useRecipe(id) {
  return useLiveQuery(
    () => id ? db.recipes.get(Number(id)) : null,
    [id],
    null
  )
}

// Devuelve los recipeIngredients con el objeto ingredient ya resuelto
export function useRecipeIngredients(recipeId) {
  return useLiveQuery(
    async () => {
      if (!recipeId) return []
      const rows = await db.recipeIngredients
        .where('recipeId').equals(Number(recipeId))
        .toArray()
      const withDetails = await Promise.all(
        rows.map(async (row) => {
          const ingredient = await db.ingredients.get(row.ingredientId)
          return { ...row, ingredient }
        })
      )
      return withDetails.filter((r) => r.ingredient)
    },
    [recipeId],
    []
  )
}

// ─── Cálculo de costo ────────────────────────────────────────────────────────

// Recibe array de { ingredientId, quantity, unit } + el objeto ingredient resuelto
export function calcRecipeCost(items) {
  return items.reduce((total, item) => {
    if (!item.ingredient) return total
    const { pricePerUnit, unit: ingUnit } = item.ingredient
    const qty = Number(item.quantity) || 0
    // Conversiones entre unidades compatibles
    const factor = getConversionFactor(item.unit, ingUnit)
    return total + pricePerUnit * qty * factor
  }, 0)
}

// Convierte la unidad usada en la receta a la unidad del ingrediente
function getConversionFactor(recipeUnit, ingredientUnit) {
  if (recipeUnit === ingredientUnit) return 1
  const conversions = {
    // peso
    'g→kg': 0.001,   'kg→g': 1000,
    // volumen
    'ml→l': 0.001,   'l→ml': 1000,
    // cucharadas / tazas a gramos (aproximado)
    'cdas→g': 15,    'cdita→g': 5,
    'taza→g': 200,   'taza→ml': 240,
    'cdas→ml': 15,   'cdita→ml': 5,
  }
  const key = `${recipeUnit}→${ingredientUnit}`
  return conversions[key] ?? 1
}

export function calcSalePrice(cost, marginPercent) {
  if (!cost || cost <= 0) return 0
  return cost / (1 - marginPercent / 100)
}

// ─── Operaciones CRUD ────────────────────────────────────────────────────────

export async function saveRecipe(recipeData, items, existingId = null) {
  const now = new Date().toISOString()

  let recipeId = existingId

  if (existingId) {
    await db.recipes.update(existingId, { ...recipeData, updatedAt: now })
    await db.recipeIngredients.where('recipeId').equals(existingId).delete()
  } else {
    recipeId = await db.recipes.add({ ...recipeData, createdAt: now, updatedAt: now })
  }
  if (items.length > 0) {
    await db.recipeIngredients.bulkAdd(items.map((item) => ({
      recipeId, ingredientId: item.ingredientId, quantity: Number(item.quantity), unit: item.unit,
    })))
  }
  const saved = await db.recipes.get(recipeId)
  pushRecord('recipes', saved)
  const riRows = await db.recipeIngredients.where('recipeId').equals(recipeId).toArray()
  riRows.forEach(r => pushRecord('recipe_ingredients', r))
  return recipeId
}

export async function deleteRecipe(id) {
  const usedInOrders = await db.orderItems.where('recipeId').equals(id).count()
  if (usedInOrders > 0) throw new Error(`Esta receta tiene ${usedInOrders} pedido(s) registrado(s). No se puede eliminar.`)
  await db.recipeIngredients.where('recipeId').equals(id).delete()
  await db.recipes.delete(id)
  pushDelete('recipes', id)
}

export async function toggleRecipeActive(id, isActive) {
  await db.recipes.update(id, { isActive, updatedAt: new Date().toISOString() })
}

// Recalcula el costo guardado de una receta (útil cuando cambian precios de ingredientes)
export async function recalcRecipeCost(recipeId) {
  const items = await db.recipeIngredients
    .where('recipeId').equals(recipeId)
    .toArray()
  const withIngredients = await Promise.all(
    items.map(async (item) => ({
      ...item,
      ingredient: await db.ingredients.get(item.ingredientId),
    }))
  )
  const cost = calcRecipeCost(withIngredients.filter((i) => i.ingredient))
  await db.recipes.update(recipeId, {
    lastCalculatedCost: cost,
    updatedAt: new Date().toISOString(),
  })
  return cost
}
