/**
 * CMS-Auto Design Tokens
 * 
 * These tokens define the visual foundation for UI-DESIGN-001.
 * They are designed to support both Arabic RTL and English LTR layouts
 * via logical CSS properties in the Tailwind config and component stylesheets.
 */

export const designTokens = {
  colors: {
    brand: {
      DEFAULT: 'hsl(var(--color-brand))',
      foreground: 'hsl(var(--color-brand-foreground))',
    },
    neutral: {
      DEFAULT: 'hsl(var(--color-neutral))',
      foreground: 'hsl(var(--color-neutral-foreground))',
    },
    status: {
      success: 'hsl(var(--color-success))',
      warning: 'hsl(var(--color-warning))',
      error: 'hsl(var(--color-error))',
      info: 'hsl(var(--color-info))',
    },
    state: {
      loading: 'hsl(var(--color-loading))',
      empty: 'hsl(var(--color-empty))',
      conflict: 'hsl(var(--color-conflict))',
    },
  },
  typography: {
    fontFamily: 'var(--font-sans)',
  },
  spacing: {
    // Note: Use logical properties (margin-inline, padding-inline)
    // in components, but standard spacing scales here.
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
  },
  shadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },
  focusRing: 'var(--focus-ring)',
} as const;
