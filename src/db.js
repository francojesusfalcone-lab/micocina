import Dexie from 'dexie'

// ─── Base de datos local (funciona offline) ─────────────────────────────────
export const db = new Dexie('MiCocinaDB')

db.version(1).stores({
  // Ingredientes y stock
  ingredients: '++id, name, category, createdAt, updatedAt',
  ingredientPriceHistory: '++id, ingredientId, price, date',

  // Recetas y productos
  recipes: '++id, name, category, isActive, isPremiumCombo, createdAt, updatedAt',
  recipeIngredients: '++id, recipeId, ingredientId',

  // Comandas (pedidos)
  orders: '++id, clientId, status, deliveryTime, paymentMethod, createdAt, updatedAt',
  orderItems: '++id, orderId, recipeId, quantity',

  // Clientes (premium)
  clients: '++id, name, phone, address, createdAt',

  // Gastos fijos
  expenses: '++id, name, category, amount, isRecurring, createdAt',

  // Configuración del negocio
  settings: 'key',

  // Usuario / plan
  user: 'key',
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
