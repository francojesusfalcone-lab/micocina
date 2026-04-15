// ─── Configuración de MercadoPago ────────────────────────────────────────────
// Para producción: reemplazá con tus credenciales reales de MP
// Dashboard: https://www.mercadopago.com.ar/developers/panel

const MP_CONFIG = {
  // PUBLIC_KEY se usa en el frontend (no es secreta)
  PUBLIC_KEY: import.meta.env.VITE_MP_PUBLIC_KEY || '',
}

// Precio del plan Premium — siempre USD 5
// MercadoPago hace la conversión automática al momento del pago
// No hardcodeamos moneda local para evitar valores desactualizados
export const PLAN_PRICE = {
  amount:   9.99,
  currency: 'USD',
  label:    'USD 9.99/mes',
}

export function getPlanPrice(_countryCode) {
  return PLAN_PRICE
}

// ─── Crea una preferencia de pago en MP ──────────────────────────────────────
// En producción esto debe hacerse desde tu backend para proteger el ACCESS_TOKEN
export async function createMPPreference(settings, plan = 'monthly', userId = null) {
  const response = await fetch('/api/create-preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: settings.businessName,
      country:      settings.country,
      plan,
      userId,
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Error al crear preferencia de pago')
  }

  return response.json()
}

// ─── Simula activación del plan (para testing sin backend) ───────────────────
// En producción: el backend valida el webhook de MP y activa el plan en DB
export async function activatePlanLocally(db, plan = 'monthly') {
  const now = new Date().toISOString()
  const expiresAt = new Date()
  if (plan === 'annual') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  }

  await db.user.bulkPut([
    { key: 'plan',        value: 'premium' },
    { key: 'planType',    value: plan },
    { key: 'planSince',   value: now },
    { key: 'planExpires', value: expiresAt.toISOString() },
  ])
}

// Lee el estado del plan desde IndexedDB
export async function loadPlanFromDB(db) {
  const [planRecord, expiresRecord] = await Promise.all([
    db.user.get('plan'),
    db.user.get('planExpires'),
  ])

  const plan    = planRecord?.value || 'free'
  const expires = expiresRecord?.value || null

  // Si el plan premium expiró, degradar a free
  if (plan === 'premium' && expires && new Date(expires) < new Date()) {
    await db.user.put({ key: 'plan', value: 'free' })
    return 'free'
  }

  return plan
}
