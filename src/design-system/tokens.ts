/**
 * MenuCA Design System - Design Tokens
 * Inspired by best practices from DoorDash, Uber Eats, and Toast
 */

export const designTokens = {
  // ==========================================
  // COLOR SYSTEM - Inspired by DoorDash's clean palette
  // ==========================================
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#fef7ee',   // Light orange tint for backgrounds
      100: '#fdedd3',  // Toast notifications
      200: '#fbd7a5',  // Hover states
      300: '#f9b572',  // Secondary actions
      400: '#f78f3c',  // Default primary
      500: '#f97316',  // Main brand color (Tailwind orange-500)
      600: '#ea580c',  // Primary hover
      700: '#c2410c',  // Primary active
      800: '#9a3412',  // Dark mode primary
      900: '#7c2d12',  // Darkest
    },
    
    // Semantic Colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',  // Success states, order confirmations
      600: '#16a34a',
      700: '#15803d',
    },
    
    error: {
      50: '#fef2f2',
      500: '#ef4444',  // Error states, form validation
      600: '#dc2626',
      700: '#b91c1c',
    },
    
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',  // Warning states, pending orders
      600: '#d97706',
    },
    
    info: {
      50: '#eff6ff',
      500: '#3b82f6',  // Info states, tips
      600: '#2563eb',
    },
    
    // Neutral Grays - Following Uber Eats' sophisticated grays
    neutral: {
      0: '#ffffff',    // Pure white
      50: '#f9fafb',   // Background
      100: '#f3f4f6',  // Light backgrounds
      200: '#e5e7eb',  // Borders, dividers
      300: '#d1d5db',  // Disabled text
      400: '#9ca3af',  // Placeholder text
      500: '#6b7280',  // Secondary text
      600: '#4b5563',  // Primary text
      700: '#374151',  // Headings
      800: '#1f2937',  // Dark text
      900: '#111827',  // Darkest text
      950: '#030712',  // Pure black alternative
    },
    
    // Food Category Colors (inspired by Grubhub's categorization)
    categories: {
      pizza: '#dc2626',      // Red
      burger: '#ea580c',     // Orange  
      asian: '#ca8a04',      // Yellow
      healthy: '#16a34a',    // Green
      dessert: '#c026d3',    // Magenta
      coffee: '#92400e',     // Brown
      mexican: '#dc2626',    // Red
      italian: '#16a34a',    // Green
    },
    
    // Status Colors for Orders
    status: {
      pending: '#f59e0b',     // Amber
      confirmed: '#3b82f6',   // Blue  
      preparing: '#8b5cf6',   // Purple
      ready: '#10b981',       // Emerald
      delivered: '#22c55e',   // Green
      cancelled: '#ef4444',   // Red
    }
  },

  // ==========================================
  // TYPOGRAPHY - Inspired by Toast's clear hierarchy
  // ==========================================
  typography: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },
    
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
      '5xl': ['3rem', { lineHeight: '1' }],           // 48px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },

  // ==========================================
  // SPACING SYSTEM - Following 8pt grid system
  // ==========================================
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
  },

  // ==========================================
  // BORDER RADIUS - Consistent rounded corners
  // ==========================================
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',   // Perfect circles
  },

  // ==========================================
  // SHADOWS - Elevation system like Material Design
  // ==========================================
  boxShadow: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    
    // Custom MenuCA shadows
    card: '0 4px 12px rgb(0 0 0 / 0.08)',
    menu: '0 8px 24px rgb(0 0 0 / 0.12)',
    modal: '0 20px 40px rgb(0 0 0 / 0.16)',
  },

  // ==========================================
  // BREAKPOINTS - Mobile-first responsive design
  // ==========================================
  screens: {
    xs: '375px',   // Small phones
    sm: '640px',   // Large phones
    md: '768px',   // Tablets
    lg: '1024px',  // Laptops
    xl: '1280px',  // Desktops
    '2xl': '1536px', // Large desktops
  },

  // ==========================================
  // ANIMATION & TRANSITIONS
  // ==========================================
  animation: {
    // Micro-interactions
    'fade-in': 'fadeIn 0.15s ease-out',
    'slide-up': 'slideUp 0.2s ease-out',
    'slide-down': 'slideDown 0.2s ease-out',
    'scale-in': 'scaleIn 0.1s ease-out',
    
    // Loading states
    'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    'spin-slow': 'spin 2s linear infinite',
    
    // Cart animations
    'cart-bounce': 'cartBounce 0.6s ease-in-out',
    
    // Success animations
    'success-scale': 'successScale 0.4s ease-out',
  },

  // ==========================================
  // Z-INDEX SYSTEM - Consistent layering
  // ==========================================
  zIndex: {
    0: '0',
    10: '10',      // Dropdown menus
    20: '20',      // Sticky headers
    30: '30',      // Modals backdrop
    40: '40',      // Modals content
    50: '50',      // Tooltips
    60: '60',      // Toast notifications
    70: '70',      // Loading overlays
    9999: '9999',  // Dev tools, extreme cases
  },

  // ==========================================
  // COMPONENT SIZES - Consistent sizing
  // ==========================================
  sizes: {
    // Button sizes
    button: {
      xs: { height: '24px', padding: '0 8px', fontSize: '12px' },
      sm: { height: '32px', padding: '0 12px', fontSize: '14px' },
      md: { height: '40px', padding: '0 16px', fontSize: '16px' },
      lg: { height: '48px', padding: '0 20px', fontSize: '18px' },
      xl: { height: '56px', padding: '0 24px', fontSize: '20px' },
    },
    
    // Input sizes
    input: {
      sm: { height: '32px', padding: '0 8px', fontSize: '14px' },
      md: { height: '40px', padding: '0 12px', fontSize: '16px' },
      lg: { height: '48px', padding: '0 16px', fontSize: '18px' },
    },
    
    // Avatar sizes
    avatar: {
      xs: '24px',
      sm: '32px',
      md: '40px',
      lg: '48px',
      xl: '64px',
      '2xl': '80px',
    },
    
    // Icon sizes
    icon: {
      xs: '12px',
      sm: '16px',
      md: '20px',
      lg: '24px',
      xl: '32px',
    },
  },
} as const;

// ==========================================
// COMPONENT VARIANTS - Behavioral styling
// ==========================================
export const componentVariants = {
  // Button variants inspired by modern design systems
  button: {
    primary: {
      bg: 'bg-primary-500',
      hover: 'hover:bg-primary-600',
      active: 'active:bg-primary-700',
      text: 'text-white',
      border: 'border-transparent',
      focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    },
    secondary: {
      bg: 'bg-white',
      hover: 'hover:bg-neutral-50',
      active: 'active:bg-neutral-100',
      text: 'text-neutral-700',
      border: 'border-neutral-300',
      focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    },
    success: {
      bg: 'bg-success-500',
      hover: 'hover:bg-success-600',
      active: 'active:bg-success-700',
      text: 'text-white',
      border: 'border-transparent',
      focus: 'focus:ring-2 focus:ring-success-500 focus:ring-offset-2',
    },
    danger: {
      bg: 'bg-error-500',
      hover: 'hover:bg-error-600',
      active: 'active:bg-error-700',
      text: 'text-white',
      border: 'border-transparent',
      focus: 'focus:ring-2 focus:ring-error-500 focus:ring-offset-2',
    },
    ghost: {
      bg: 'bg-transparent',
      hover: 'hover:bg-neutral-100',
      active: 'active:bg-neutral-200',
      text: 'text-neutral-700',
      border: 'border-transparent',
      focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    },
  },
  
  // Card variants
  card: {
    default: {
      bg: 'bg-white',
      border: 'border border-neutral-200',
      shadow: 'shadow-card',
      rounded: 'rounded-lg',
    },
    elevated: {
      bg: 'bg-white',
      border: 'border-transparent',
      shadow: 'shadow-menu',
      rounded: 'rounded-xl',
    },
    outlined: {
      bg: 'bg-transparent',
      border: 'border-2 border-neutral-200',
      shadow: 'shadow-none',
      rounded: 'rounded-lg',
    },
  },
  
  // Status badges
  badge: {
    pending: {
      bg: 'bg-warning-100',
      text: 'text-warning-800',
      border: 'border-warning-200',
    },
    confirmed: {
      bg: 'bg-info-100',
      text: 'text-info-800',
      border: 'border-info-200',
    },
    delivered: {
      bg: 'bg-success-100',
      text: 'text-success-800',
      border: 'border-success-200',
    },
    cancelled: {
      bg: 'bg-error-100',
      text: 'text-error-800',
      border: 'border-error-200',
    },
  },
} as const;

export type DesignTokens = typeof designTokens;
export type ComponentVariants = typeof componentVariants;