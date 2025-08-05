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

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?payment=success`,
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
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <div className="mb-4">
        <PaymentElement id="payment-element" options={paymentElementOptions} />
      </div>
      
      {message && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{message}</p>
        </div>
      )}

      <Button
        disabled={isProcessing || !stripe || !elements}
        type="submit"
        className="w-full"
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
    </form>
  );
}