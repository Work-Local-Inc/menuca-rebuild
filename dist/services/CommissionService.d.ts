export interface Commission {
    id: string;
    tenant_id: string;
    restaurant_id: string;
    order_id: string;
    transaction_type: 'order_commission' | 'delivery_fee' | 'service_fee' | 'adjustment';
    gross_amount: number;
    commission_rate: number;
    commission_amount: number;
    platform_fee: number;
    net_amount: number;
    currency: string;
    status: 'pending' | 'calculated' | 'paid' | 'disputed' | 'refunded';
    calculation_date: Date;
    payment_due_date: Date;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
}
export interface CommissionSummary {
    restaurant_id: string;
    restaurant_name: string;
    period_start: Date;
    period_end: Date;
    total_orders: number;
    gross_revenue: number;
    total_commission: number;
    total_platform_fees: number;
    net_amount_due: number;
    currency: string;
    status: 'pending' | 'calculated' | 'paid';
}
export interface CommissionCalculationRequest {
    orderId: string;
    restaurantId: string;
    grossAmount: number;
    commissionRate?: number;
    additionalFees?: {
        delivery_fee?: number;
        service_fee?: number;
        processing_fee?: number;
    };
    metadata?: Record<string, any>;
}
export interface CommissionReport {
    summary: {
        total_restaurants: number;
        total_orders: number;
        total_gross_revenue: number;
        total_commissions: number;
        total_net_due: number;
        period_start: Date;
        period_end: Date;
    };
    restaurants: CommissionSummary[];
}
export declare class CommissionService {
    private pool;
    private readonly DEFAULT_COMMISSION_RATE;
    private readonly DEFAULT_PLATFORM_FEE;
    constructor();
    calculateOrderCommission(tenantId: string, request: CommissionCalculationRequest): Promise<Commission>;
    getCommissionsByOrder(tenantId: string, orderId: string): Promise<Commission[]>;
    getCommissionsByRestaurant(tenantId: string, restaurantId: string, startDate?: Date, endDate?: Date, status?: string): Promise<Commission[]>;
    generateCommissionSummary(tenantId: string, restaurantId: string, startDate: Date, endDate: Date): Promise<CommissionSummary>;
    generateTenantCommissionReport(tenantId: string, startDate: Date, endDate: Date): Promise<CommissionReport>;
    updateCommissionStatus(tenantId: string, commissionId: string, status: string, metadata?: Record<string, any>): Promise<Commission | null>;
    markCommissionsPaid(tenantId: string, restaurantId: string, startDate: Date, endDate: Date, paymentReference?: string): Promise<number>;
    private getRestaurantCommissionRate;
    private createCommissionRecord;
    createCommissionAdjustment(tenantId: string, restaurantId: string, amount: number, reason: string, metadata?: Record<string, any>): Promise<Commission>;
}
export declare const commissionService: CommissionService;
//# sourceMappingURL=CommissionService.d.ts.map