import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' })

    const stripe = new Stripe(secretKey, { apiVersion: '2025-07-30.basil' })

    const { items, restaurantId, customerEmail, delivery } = req.body || {}

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`

    const line_items = items.map((it: any) => ({
      price_data: {
        currency: 'cad',
        product_data: { name: String(it.name || 'Menu Item') },
        unit_amount: Math.round(Number(it.price || 0) * 100)
      },
      quantity: Math.max(1, Number(it.quantity || 1))
    }))

    const metadata: Record<string, string> = {
      restaurant_id: String(restaurantId || ''),
      items_count: String(items.length),
      delivery_name: String(delivery?.fullName || ''),
      delivery_phone: String(delivery?.phone || ''),
      delivery_address: String(delivery?.address || ''),
    }

    const ridParam = restaurantId ? `&rid=${encodeURIComponent(String(restaurantId))}` : ''

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: customerEmail || undefined,
      success_url: `${baseUrl}/checkout?step=confirmation${ridParam}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?step=payment${ridParam}`,
      payment_intent_data: { metadata },
      metadata
    })

    return res.status(200).json({ id: session.id, url: session.url })
  } catch (e: any) {
    console.error('Stripe session error:', e)
    return res.status(500).json({ error: 'Failed to create session', details: e?.message || String(e) })
  }
}
