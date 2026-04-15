import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { type, data } = req.body || {}
  if (type !== 'payment') return res.status(200).json({ ok: true })

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data?.id}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    })
    const payment = await mpRes.json()
    if (payment.status !== 'approved') return res.status(200).json({ ok: true })

    const isAnnual = payment.metadata?.plan === 'annual'
    const userId   = payment.metadata?.userId
    if (!userId) return res.status(200).json({ ok: true })

    const expiresAt = new Date()
    isAnnual
      ? expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      : expiresAt.setMonth(expiresAt.getMonth() + 1)

    await supabase.from('profiles').upsert({
      id:           userId,
      plan:         'premium',
      plan_type:    isAnnual ? 'annual' : 'monthly',
      plan_expires: expiresAt.toISOString(),
      updated_at:   new Date().toISOString(),
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
