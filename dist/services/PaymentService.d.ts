import Stripe from 'stripe';
export interface PaymentIntent {
    id: string;
    tenant_id: string;
    user_id: string;
    order_id?: string;
    stripe_payment_intent_id: string;
    amount: number;
    currency: string;
    status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
    client_secret: string;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
}
export interface CreatePaymentIntentRequest {
    amount: number;
    currency?: string;
    orderId?: string;
    metadata?: Record<string, string>;
}
export interface PaymentMethod {
    id: string;
    tenant_id: string;
    user_id: string;
    stripe_payment_method_id: string;
    type: string;
    card_last4?: string;
    card_brand?: string;
    is_default: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare class PaymentService {
    private stripe;
    private pool;
    constructor();
    createPaymentIntent(tenantId: string, userId: string, request: CreatePaymentIntentRequest): Promise<PaymentIntent>;
    getPaymentIntent(tenantId: string, paymentIntentId: string): Promise<PaymentIntent | null>;
    updatePaymentIntentStatus(tenantId: string, paymentIntentId: string, stripePaymentIntent: Stripe.PaymentIntent): Promise<PaymentIntent | null>;
    confirmPaymentIntent(tenantId: string, paymentIntentId: string, paymentMethodId: string): Promise<Stripe.PaymentIntent>;
    savePaymentMethod(tenantId: string, userId: string, stripePaymentMethod: Stripe.PaymentMethod, isDefault?: boolean): Promise<PaymentMethod>;
    getUserPaymentMethods(tenantId: string, userId: string): Promise<PaymentMethod[]>;
    deletePaymentMethod(tenantId: string, userId: string, paymentMethodId: string): Promise<boolean>;
    handleWebhook(payload: string, signature: string): Promise<void>;
    private handlePaymentSucceeded;
    private handlePaymentFailed;
    private handlePaymentMethodAttached;
    private savePaymentIntent;
    private updateOrderPaymentStatus;
    createRefund(tenantId: string, paymentIntentId: string, amount?: number, reason?: string): Promise<Stripe.Refund>;
    private saveRefundRecord;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=PaymentService.d.ts.map