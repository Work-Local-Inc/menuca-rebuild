// Centralized mapping of UI features to API endpoints (App Router + External services)
export const ApiMap = {
  settings: {
    get: '/api/business-settings',
    save: '/api/business-settings',
  },
  tablet: {
    accept: '/api/tablet/accept',
    reject: '/api/tablet/reject',
    getOrder: '/api/tablet/getOrder',
    addOrder: '/api/tablet/addOrder',
    test: '/api/test-tablet-integration',
  },
  orders: {
    complete: '/api/orders/complete',
  },
  payments: {
    createIntent: '/api/create-payment-intent',
    createTest: '/api/create-test-payment',
    stripeWebhook: '/api/stripe/webhook',
  },
  address: {
    suggest: '/api/address/suggest',
  },
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  printer: {
    queue: '/api/printer/queue',
    testQueue: '/api/printer/test-queue',
    sharedQueue: '/api/printer/shared-queue',
    cloudBridge: '/api/printer/cloud-bridge',
  },
  menuManagement: {
    restaurant: (restaurantId: string) => `/api/menu-management/restaurant/${restaurantId}`,
    menus: (restaurantId: string) => `/api/menu-management/restaurant/${restaurantId}/menus`,
  },
  admin: {
    seedXtreme: '/api/admin/seed-xtreme-pizza',
  },
  // Example structure for order workflows and others
  serverRoutes: {
    // Express server routes mounted under src/server/app.ts
    analytics: '/server/analytics',
    auth: '/server/auth',
    cart: '/server/cart',
    commission: '/server/commission',
    menu: '/server/menu',
    monitoring: '/server/monitoring',
    orders: '/server/orders',
    payment: '/server/payment',
    rbac: '/server/rbac',
    restaurant: '/server/restaurant',
    search: '/server/search',
    chat: '/server/chat',
    mockAnalytics: '/server/mock-analytics'
  },
  // External enterprise backend (proxied via next.config.js rewrites)
  enterprise: {
    base: '/api/v1',
    auth: {
      login: '/api/v1/auth/login',
      refresh: '/api/v1/auth/refresh',
    },
    businesses: {
      get: (id: string) => `/api/v1/businesses/${id}`,
    },
  },
} as const

export type ApiMapType = typeof ApiMap


