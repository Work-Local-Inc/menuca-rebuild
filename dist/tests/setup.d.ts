export declare const testData: any;
export declare function createAuthContext(): {
    user: {
        id: any;
        tenant_id: any;
        email: any;
        first_name: any;
        last_name: any;
        role: any;
        status: any;
        email_verified: boolean;
        created_at: Date;
        updated_at: Date;
    };
    tenantContext: {
        tenantId: any;
    };
};
export type TestAuthContext = ReturnType<typeof createAuthContext>;
//# sourceMappingURL=setup.d.ts.map