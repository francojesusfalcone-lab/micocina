export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { businessName, country, plan = 'monthly', userId } = req.body || {}

  const isAnnual = plan === 'annual'
  const price    = isAnnual ? 89.99 : 9.99
  const title    = isAnnual
    ? 'MiCuchina Premium — Suscripción anual'
    : 'MiCuchina Premium — Suscripción mensual'

  const preference = {
    items: [
      {
        id:          `micuchina-premium-${plan}`,
        title,
        description: 'Comandas ilimitadas, CRM, IA, gastos fijos y más',
        quantity:    1,
        unit_price:  price,
        currency_id: 'USD',
      },
    ],
    payer: { name: businessName || 'Usuario' },
    back_urls: {
      success: 'https://www.micuchina.com/premium/success',
      failure: 'https://www.micuchina.com/premium/failure',
      pending: 'https://www.micuchina.com/premium/pending',
    },
    auto_return:          'approved',
    statement_descriptor: 'MICUCHINA',
    external_reference:   `micuchina_${plan}_${Date.now()}`,
    metadata: { businessName, country, plan, userId },
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    })

    if (!response.ok) {
      const err = await response.json()
      return res.status(500).json({ error: err.message || 'Error MP' })
    }

    const data = await response.json()
    return res.status(200).json({
      id:        data.id,
      initPoint: data.init_point,
      sandbox:   data.sandbox_init_point,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
