/**
 * 🎯 PAYMENT TEST PAGE - TRIGGERS TABLET INTEGRATION
 * 
 * Simple test page to process payments and trigger A19 tablet
 */

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Create payment intent
      console.log('🎯 Creating payment intent...');
      
      const paymentResponse = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1.15, // $1.15 test order
          currency: 'cad',
          orderData: {
            customer_name: 'Tablet Test Customer',
            customer_phone: '555-TEST-A19',
            restaurant_id: 'A19'
          }
        }),
      });

      const { client_secret, payment_intent_id } = await paymentResponse.json();
      
      console.log('💳 Payment intent created:', payment_intent_id);

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log('🎯 Confirming payment...');
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Tablet Test Customer',
            email: 'tablet-test@menuca.com'
          },
        },
      });

      if (error) {
        console.error('❌ Payment failed:', error);
        setResult({
          success: false,
          error: error.message,
          type: 'payment_error'
        });
      } else if (paymentIntent?.status === 'succeeded') {
        console.log('✅ Payment succeeded!', paymentIntent.id);
        
        setResult({
          success: true,
          payment_intent: paymentIntent.id,
          amount: paymentIntent.amount,
          message: 'Payment successful! Webhook should trigger tablet integration.',
          instructions: [
            '🎯 Payment completed successfully',
            '📡 Webhook should trigger tablet integration',
            '📱 Check A19 tablet for air horn notification',
            '🎵 Order should appear on tablet screen'
          ]
        });
      }
      
    } catch (error) {
      console.error('❌ Payment test error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'system_error'
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">🎯 A19 Tablet Test</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Payment ($1.15 CAD)
          </label>
          <div className="border rounded p-3">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use test card: 4242 4242 4242 4242, any future date, any CVC
          </p>
        </div>

        <button
          type="submit"
          disabled={!stripe || loading}
          className={`w-full py-2 px-4 rounded font-medium ${
            loading 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? '🔄 Processing...' : '🎯 Test A19 Tablet Integration'}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? '✅ Success!' : '❌ Error'}
          </h3>
          
          {result.success ? (
            <div className="text-sm text-green-700 mt-2">
              <p><strong>Payment ID:</strong> {result.payment_intent}</p>
              <p><strong>Amount:</strong> ${(result.amount / 100).toFixed(2)} CAD</p>
              
              <div className="mt-3">
                <p className="font-medium">Next Steps:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {result.instructions?.map((instruction: string, index: number) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-700 mt-2">{result.error}</p>
          )}
        </div>
      )}
      
      <div className="mt-6 text-xs text-gray-500">
        <p><strong>How it works:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-1">
          <li>Complete test payment above</li>
          <li>Stripe webhook triggers our tablet integration</li>
          <li>Order gets sent to tablet.menu.ca</li>
          <li>A19 tablet picks up order and sounds air horn</li>
          <li>Check browser console and tablet for results</li>
        </ol>
      </div>
    </div>
  );
};

export default function TestPaymentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </div>
  );
}