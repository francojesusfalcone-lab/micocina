export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const ACCESS_TOKEN = process.env.VITE_MP_ACCESS_TOKEN
  if (!ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: 'MP token no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const origin = req.headers.get('origin') || 'https://micocina-eta.vercel.app'

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
      name: body.businessName || 'Usuario',
    },
    back_urls: {
      success: `${origin}/premium?status=approved`,
      failure: `${origin}/premium?status=failure`,
      pending: `${origin}/premium?status=pending`,
    },
    auto_return:          'approved',
    statement_descriptor: 'MICOCINA',
    external_reference:   `micocina_${Date.now()}`,
    metadata: {
      businessName: body.businessName,
      country:      body.country,
    },
  }

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify(preference),
  })

  const data = await mpRes.json()

  if (!mpRes.ok) {
    return new Response(JSON.stringify({ error: data.message || 'Error MP' }), {
      status: mpRes.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      id:        data.id,
      initPoint: data.init_point,
      sandbox:   data.sandbox_init_point,
    }),
    {
      status: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
