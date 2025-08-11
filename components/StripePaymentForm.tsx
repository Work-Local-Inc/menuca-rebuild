import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

interface StripePaymentFormProps {
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  totalAmount: number;
}

export default function StripePaymentForm({ 
  onPaymentSuccess, 
  onPaymentError, 
  isProcessing, 
  setIsProcessing,
  totalAmount 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    // Store order details before potential redirect
    // This ensures data is available when Stripe redirects back
    try {
      const cartData = sessionStorage.getItem('checkout_cart');
      if (cartData) {
        const cart = JSON.parse(cartData);
        const subtotal = cart.reduce((total: number, item: any) => {
          const itemPrice = item.finalPrice || item.menuItem.price;
          return total + (itemPrice * item.quantity);
        }, 0);
        
        const completedOrder = {
          items: cart,
          total: totalAmount,
          subtotal: subtotal,
          tax: subtotal * 0.13,
          delivery: 2.99,
          tip: 0,
          timestamp: new Date().toISOString(),
        };
        
        sessionStorage.setItem('completed_order', JSON.stringify(completedOrder));
      }
    } catch (error) {
      console.warn('Could not store order details:', error);
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
        payment_method_data: {
          billing_details: {
            address: {
              country: 'CA', // All customers are Canadian
            },
          },
        },
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || 'An unexpected error occurred.');
        onPaymentError(error.message || 'An unexpected error occurred.');
      } else {
        setMessage('An unexpected error occurred.');
        onPaymentError('An unexpected error occurred.');
      }
    } else {
      onPaymentSuccess();
    }

    setIsProcessing(false);
  };

  const paymentElementOptions = {
    layout: "tabs" as const,
    fields: {
      billingDetails: {
        address: {
          country: 'never' as const,
        },
      },
    },
    // Mobile-optimized appearance
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0F172A',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px',
      },
      rules: {
        '.Tab': {
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px 16px',
        },
        '.Tab:hover': {
          backgroundColor: '#f9fafb',
        },
        '.Tab--selected': {
          backgroundColor: '#f3f4f6',
          borderColor: '#6b7280',
        },
        '.Input': {
          fontSize: '16px', // Prevents zoom on mobile
          padding: '12px 16px',
          borderRadius: '8px',
        },
        '.Label': {
          fontSize: '14px',
          fontWeight: '500',
        },
      },
    },
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-6">
          <PaymentElement 
            id="payment-element" 
            options={paymentElementOptions}
            className="w-full"
          />
        </div>
        
        {message && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
            <p className="text-sm text-red-800">{message}</p>
          </div>
        )}

        <Button
          disabled={isProcessing || !stripe || !elements}
          type="submit"
          className="w-full py-3 text-base font-medium min-h-[48px] touch-manipulation"
          size="lg"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Payment...
            </span>
          ) : (
            `Pay ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(totalAmount)}`
          )}
        </Button>
        
        {/* Mobile security notice */}
        <div className="text-center text-xs text-gray-500 mt-3">
          <p>🔒 Your payment information is encrypted and secure</p>
        </div>
      </form>
    </div>
  );
}