import { NextApiRequest, NextApiResponse } from 'next';
import { paymentService } from '../../src/services/PaymentService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'cad', orderData } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    console.log('🔄 Creating payment intent for amount:', amount, currency);

    // For now, use static tenant and user IDs
    // TODO: Get these from authentication/session
    const tenantId = '11111111-1111-1111-1111-111111111111'; // Xtreme Pizza tenant
    const userId = 'customer-user-id'; // Customer user ID

    // Convert amount to cents for Stripe (CAD)
    const amountInCents = Math.round(amount * 100);

    // Create payment intent using our service
    const paymentIntent = await paymentService.createPaymentIntent(
      tenantId,
      userId,
      {
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: {
          restaurant_id: orderData?.restaurantId || '',
          delivery_address: orderData?.deliveryAddress || '',
          special_instructions: orderData?.specialInstructions || ''
        }
      }
    );

    console.log('✅ Payment intent created successfully:', paymentIntent.id);

    return res.status(200).json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('❌ Failed to create payment intent:', error);
    
    // Return user-friendly error message
    return res.status(500).json({ 
      error: 'Failed to initialize payment',
      message: 'Please check your payment details and try again'
    });
  }
}