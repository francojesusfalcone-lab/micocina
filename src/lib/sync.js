import { supabase } from './supabase'
import { db } from '../db'

let _userId = null
export function setSyncUserId(id) { _userId = id }

// ─── camelCase ↔ snake_case maps ─────────────────────────────────────────────
const CAMEL_TO_SNAKE = {
  pricePerUnit: 'price_per_unit', minStock: 'min_stock',
  createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at',
  isActive: 'is_active', isPremiumCombo: 'is_premium_combo', comboItems: 'combo_items',
  salePrice: 'sale_price', recipeId: 'recipe_id', ingredientId: 'ingredient_id',
  orderId: 'order_id', clientId: 'client_id', clientName: 'client_name',
  clientPhone: 'client_phone', clientAddress: 'client_address',
  paymentMethod: 'payment_method', deliveryTime: 'delivery_time',
  isPaid: 'is_paid', stockDeducted: 'stock_deducted', unitPrice: 'unit_price',
  isRecurring: 'is_recurring',
}
const SNAKE_TO_CAMEL = Object.fromEntries(Object.entries(CAMEL_TO_SNAKE).map(([k,v]) => [v,k]))

function toSnake(obj) {
  const result = { user_id: _userId }
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'user_id') continue
    result[CAMEL_TO_SNAKE[k] || k] = v
  }
  return result
}

function toCamel(obj) {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'user_id' || k === 'deleted_at') continue
    result[SNAKE_TO_CAMEL[k] || k] = v
  }
  return result
}

// ─── Push: local → Supabase ───────────────────────────────────────────────────
export async function pushRecord(table, record) {
  if (!_userId) return
  try {
    await supabase.from(table).upsert(toSnake(record), { onConflict: 'id' })
  } catch (e) { console.warn('[sync] push error', table, e.message) }
}

export async function pushDelete(table, id) {
  if (!_userId) return
  try {
    await supabase.from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', _userId)
  } catch (e) { console.warn('[sync] delete error', table, e.message) }
}

// ─── Pull: Supabase → local (boot) ───────────────────────────────────────────
export async function syncFromSupabase(userId) {
  if (!userId) return
  _userId = userId

  const tables = [
    { remote: 'ingredients',              local: db.ingredients },
    { remote: 'recipes',                  local: db.recipes },
    { remote: 'recipe_ingredients',       local: db.recipeIngredients },
    { remote: 'orders',                   local: db.orders },
    { remote: 'order_items',              local: db.orderItems },
    { remote: 'clients',                  local: db.clients },
    { remote: 'expenses',                 local: db.expenses },
    { remote: 'ingredient_price_history', local: db.ingredientPriceHistory },
  ]

  for (const { remote, local } of tables) {
    try {
      const { data, error } = await supabase
        .from(remote).select('*')
        .eq('user_id', userId).is('deleted_at', null)
      if (error || !data?.length) continue
      await local.bulkPut(data.map(toCamel))
    } catch (e) { console.warn('[sync] pull error', remote, e.message) }
  }
}
