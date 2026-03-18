import Dexie from 'dexie'

// ─── Base de datos local (funciona offline) ─────────────────────────────────
export const db = new Dexie('MiCocinaDB')

db.version(1).stores({
  ingredients: '++id, name, category, createdAt, updatedAt',
  ingredientPriceHistory: '++id, ingredientId, price, date',
  recipes: '++id, name, category, isActive, isPremiumCombo, createdAt, updatedAt',
  recipeIngredients: '++id, recipeId, ingredientId',
  orders: '++id, clientId, status, deliveryTime, paymentMethod, createdAt, updatedAt',
  orderItems: '++id, orderId, recipeId, quantity',
  clients: '++id, name, phone, address, createdAt',
  expenses: '++id, name, category, amount, isRecurring, createdAt',
  settings: 'key',
  user: 'key',
})

db.version(2).stores({
  ingredients: '++id, name, category, createdAt, updatedAt',
  ingredientPriceHistory: '++id, ingredientId, price, date',
  recipes: '++id, name, category, isActive, isPremiumCombo, createdAt, updatedAt',
  recipeIngredients: '++id, recipeId, ingredientId',
  orders: '++id, clientId, status, deliveryTime, paymentMethod, createdAt, updatedAt',
  orderItems: '++id, orderId, recipeId, quantity',
  clients: '++id, name, phone, address, createdAt',
  expenses: '++id, name, category, amount, isRecurring, createdAt',
  settings: 'key',
  user: 'key',
  jornada: 'key',
})

// ─── Seeds de configuración inicial ─────────────────────────────────────────
export async function initDB() {
  const existing = await db.settings.get('initialized')
  if (existing) return

  await db.settings.bulkPut([
    { key: 'businessName',     value: 'Mi Cocina' },
    { key: 'country',          value: 'AR' },
    { key: 'currency',         value: 'ARS' },
    { key: 'currencySymbol',   value: '$' },
    { key: 'productionCapacity', value: 10 },
    { key: 'language',         value: 'es' },
    { key: 'onboardingDone',   value: false },
    { key: 'initialized',      value: true },
  ])

  await db.user.put({ key: 'plan', value: 'free' })
}

export default db
