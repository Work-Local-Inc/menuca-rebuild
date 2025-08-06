import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Debug logging for environment variables
console.log('Stripe Secret Key exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('Environment:', process.env.NODE_ENV);

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
}) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Payment intent request:', { method: req.method, hasStripe: !!stripe });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', method: req.method });
  }

  if (!stripe) {
    console.error('Stripe not initialized - missing STRIPE_SECRET_KEY');
    return res.status(500).json({ error: 'Payment processor not configured' });
  }

  try {
    const { amount, currency = 'cad', orderData } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        restaurant_id: orderData?.restaurantId || 'unknown',
        order_type: 'delivery',
        customer_address: orderData?.deliveryAddress || '',
        special_instructions: orderData?.specialInstructions || '',
      },
    });

    res.status(200).json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}