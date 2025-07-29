/**
 * Authentication and authorization type definitions
 */
export interface User {
    id: string;
    tenant_id: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    status: UserStatus;
    email_verified: boolean;
    last_login_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export declare enum UserRole {
    CUSTOMER = "customer",
    STAFF = "staff",
    MANAGER = "manager",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING_VERIFICATION = "pending_verification"
}
export interface JWTPayload {
    userId: string;
    tenantId: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface LoginRequest {
    email: string;
    password: string;
    tenantId?: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantId?: string;
}
export interface AuthResponse {
    user: Omit<User, 'password_hash'>;
    tokens: AuthTokens;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
//# sourceMappingURL=auth.d.ts.map