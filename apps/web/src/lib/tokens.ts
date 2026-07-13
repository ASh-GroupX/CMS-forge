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
    surface: {
      canvas: 'hsl(var(--surface-canvas))',
      DEFAULT: 'hsl(var(--surface))',
      raised: 'hsl(var(--surface-raised))',
      sunken: 'hsl(var(--surface-sunken))',
      overlay: 'hsl(var(--surface-overlay))',
    },
    content: {
      strong: 'hsl(var(--text-strong))',
      muted: 'hsl(var(--text-muted))',
      subtle: 'hsl(var(--text-subtle))',
    },
    line: {
      subtle: 'hsl(var(--line-subtle))',
      strong: 'hsl(var(--line-strong))',
    },
    status: {
      success: {
        DEFAULT: 'hsl(var(--color-success))',
        bg: 'hsl(var(--status-success-bg))',
        border: 'hsl(var(--status-success-border))',
      },
      warning: {
        DEFAULT: 'hsl(var(--color-warning))',
        bg: 'hsl(var(--status-warning-bg))',
        border: 'hsl(var(--status-warning-border))',
      },
      error: {
        DEFAULT: 'hsl(var(--color-error))',
        bg: 'hsl(var(--status-error-bg))',
        border: 'hsl(var(--status-error-border))',
      },
      info: {
        DEFAULT: 'hsl(var(--color-info))',
        bg: 'hsl(var(--status-info-bg))',
        border: 'hsl(var(--status-info-border))',
      },
    },
    state: {
      loading: 'hsl(var(--color-loading))',
      empty: 'hsl(var(--color-empty))',
      conflict: {
        DEFAULT: 'hsl(var(--color-conflict))',
        bg: 'hsl(var(--state-conflict-bg))',
        border: 'hsl(var(--state-conflict-border))',
      },
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
    densityRow: 'var(--density-row)',
    densityField: 'var(--density-field)',
    densityCard: 'var(--density-card-padding)',
    portalCard: 'var(--portal-card-padding)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
  },
  shadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },
  focusRing: 'var(--focus-ring)',
} as const;
