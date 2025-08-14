/**
 * 🎯 STRIPE WEBHOOK - TRIGGERS TABLET INTEGRATION
 * 
 * When payment succeeds → automatically send order to tablet.menu.ca
 * This gives us REAL payment logs to trace!
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
}) : null;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
}

// Import our tablet integration
async function sendOrderToTabletMenuCA(orderData: any, orderId: number) {
  try {
    console.log(`🎯 Sending order ${orderId} to tablet.menu.ca via webhook...`);
    
    // Use our existing inject-tablet-order endpoint internally
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://menuca-rebuild.vercel.app'}/api/inject-tablet-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: {
          id: orderId,
          customer: {
            name: orderData.customer_name || 'Stripe Customer',
            phone: orderData.customer_phone || '555-1234',
            email: orderData.customer_email || 'test@menuca.com'
          },
          items: [
            {
              name: '🎯 STRIPE WEBHOOK TEST ORDER',
              price: (orderData.amount || 115) / 100, // Convert from cents
              quantity: 1,
              special_instructions: 'Order triggered by Stripe payment webhook'
            }
          ],
          totals: {
            total: (orderData.amount || 115) / 100
          },
          delivery_instructions: `Payment ID: ${orderData.payment_intent_id}`,
          restaurant_id: 'A19'
        }
      })
    });
    
    const result = await response.json();
    console.log(`📡 Tablet injection result:`, result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Webhook tablet integration failed:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    if (!endpointSecret) {
      console.log('⚠️ No webhook secret - processing unsigned webhook for testing');
      event = JSON.parse(buf.toString());
    } else {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    }
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  console.log(`🎯 Stripe webhook received: ${event.type}`);

  // Handle payment success
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    console.log('💳 Payment succeeded!', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });
    
    // Extract order data from payment
    const orderData = {
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer_name: paymentIntent.metadata.customer_name || 'Webhook Customer',
      customer_phone: paymentIntent.metadata.customer_phone || '555-WEBHOOK',
      customer_email: paymentIntent.receipt_email || 'webhook@menuca.com'
    };
    
    // Generate order ID from payment intent
    const orderId = parseInt(paymentIntent.id.replace(/\D/g, '').slice(-6)) || Date.now() % 100000;
    
    console.log(`🎯 Triggering tablet integration for order ${orderId}...`);
    
    // Send to tablet!
    const tabletResult = await sendOrderToTabletMenuCA(orderData, orderId);
    
    console.log(`📱 Tablet integration result:`, tabletResult);
    
    // Log the complete flow for debugging
    console.log('🔍 COMPLETE PAYMENT FLOW:', {
      webhook_event: event.type,
      payment_intent: paymentIntent.id,
      order_id: orderId,
      tablet_result: tabletResult,
      timestamp: new Date().toISOString()
    });
  }

  // Handle other webhook events
  switch (event.type) {
    case 'payment_intent.payment_failed':
      console.log('❌ Payment failed:', event.data.object);
      break;
    case 'payment_intent.canceled':
      console.log('🚫 Payment canceled:', event.data.object);
      break;
    default:
      console.log(`🔔 Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}

/**
 * USAGE:
 * 
 * 1. Set up Stripe webhook endpoint pointing to /api/stripe/webhook
 * 2. Configure webhook to listen for 'payment_intent.succeeded' events
 * 3. When customer completes payment, webhook triggers tablet integration
 * 4. Check logs for complete payment → tablet flow
 * 5. A19 tablet should receive order and sound air horn!
 */