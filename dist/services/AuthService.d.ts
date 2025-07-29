import { User, JWTPayload, AuthTokens, LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';
export declare class AuthService {
    private readonly JWT_SECRET;
    private readonly JWT_REFRESH_SECRET;
    private readonly ACCESS_TOKEN_EXPIRY;
    private readonly REFRESH_TOKEN_EXPIRY;
    private readonly REFRESH_TOKEN_PREFIX;
    constructor();
    /**
     * Generate access and refresh tokens for a user
     */
    generateTokens(user: Omit<User, 'password_hash'>): Promise<AuthTokens>;
    /**
     * Verify and decode access token
     */
    verifyAccessToken(token: string): JWTPayload;
    /**
     * Verify and decode refresh token
     */
    verifyRefreshToken(token: string): Promise<JWTPayload>;
    /**
     * Revoke refresh token
     */
    revokeRefreshToken(token: string): Promise<void>;
    /**
     * Hash password using bcrypt
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Verify password against hash
     */
    verifyPassword(password: string, hash: string): Promise<boolean>;
    /**
     * Authenticate user with email and password
     */
    login(loginData: LoginRequest): Promise<AuthResponse>;
    /**
     * Register new user
     */
    register(registerData: RegisterRequest): Promise<AuthResponse>;
    /**
     * Refresh access token using refresh token
     */
    refreshToken(refreshToken: string): Promise<AuthTokens>;
    /**
     * Get user by ID with tenant isolation
     */
    getUserById(userId: string, tenantId: string): Promise<Omit<User, 'password_hash'> | null>;
    /**
     * Remove password hash from user object
     */
    private excludePassword;
}
export declare const authService: AuthService;
//# sourceMappingURL=AuthService.d.ts.map