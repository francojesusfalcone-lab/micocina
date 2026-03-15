// ─── Configuración de MercadoPago ────────────────────────────────────────────
// Para producción: reemplazá con tus credenciales reales de MP
// Dashboard: https://www.mercadopago.com.ar/developers/panel

const MP_CONFIG = {
  // PUBLIC_KEY se usa en el frontend (no es secreta)
  PUBLIC_KEY: import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',

  // ACCESS_TOKEN solo debe estar en el BACKEND (server-side)
  // Acá lo usamos temporalmente para demo — en producción mover a un servidor
  ACCESS_TOKEN: import.meta.env.VITE_MP_ACCESS_TOKEN || 'TEST-xxxxxxxx',

  // URLs de retorno después del pago
  SUCCESS_URL: `${window.location.origin}/premium/success`,
  FAILURE_URL: `${window.location.origin}/premium/failure`,
  PENDING_URL: `${window.location.origin}/premium/pending`,
}

// Precio del plan Premium — siempre USD 5
// MercadoPago hace la conversión automática al momento del pago
// No hardcodeamos moneda local para evitar valores desactualizados
export const PLAN_PRICE = {
  amount:   5,
  currency: 'USD',
  label:    'USD 5/mes',
}

export function getPlanPrice(_countryCode) {
  return PLAN_PRICE
}

// ─── Crea una preferencia de pago en MP ──────────────────────────────────────
// En producción esto debe hacerse desde tu backend para proteger el ACCESS_TOKEN
export async function createMPPreference(settings) {
  const preference = {
    items: [
      {
        id:          'micocina-premium-monthly',
        title:       'MiCocina Premium — Suscripción mensual',
        description: 'Comandas ilimitadas, CRM, IA, gastos fijos y más',
        quantity:    1,
        unit_price:  5,
        currency_id: 'USD',
      },
    ],
    payer: {
      name: settings.businessName,
    },
    back_urls: {
      success: MP_CONFIG.SUCCESS_URL,
      failure: MP_CONFIG.FAILURE_URL,
      pending: MP_CONFIG.PENDING_URL,
    },
    auto_return:          'approved',
    statement_descriptor: 'MICOCINA',
    external_reference:   `micocina_${Date.now()}`,
    metadata: {
      businessName: settings.businessName,
      country:      settings.country,
    },
  }

  // ⚠️  En producción: llamar a tu propio backend que llame a MP
  // Por ahora generamos el link directamente desde el frontend (solo para testing)
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${MP_CONFIG.ACCESS_TOKEN}`,
    },
    body: JSON.stringify(preference),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || 'Error al crear preferencia de pago')
  }

  const data = await response.json()
  return {
    id:       data.id,
    initPoint: data.init_point,       // URL de pago producción
    sandbox:   data.sandbox_init_point, // URL de pago sandbox (testing)
  }
}

// ─── Simula activación del plan (para testing sin backend) ───────────────────
// En producción: el backend valida el webhook de MP y activa el plan en DB
export async function activatePlanLocally(db) {
  const now = new Date().toISOString()
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  await db.user.bulkPut([
    { key: 'plan',       value: 'premium' },
    { key: 'planSince',  value: now },
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
