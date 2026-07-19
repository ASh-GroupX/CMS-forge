import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        brand: {
          DEFAULT: "hsl(var(--color-brand))",
          foreground: "hsl(var(--color-brand-foreground))",
        },
        neutral: {
          DEFAULT: "hsl(var(--color-neutral))",
          foreground: "hsl(var(--color-neutral-foreground))",
        },
        surface: {
          canvas: "hsl(var(--surface-canvas))",
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
          sunken: "hsl(var(--surface-sunken))",
          overlay: "hsl(var(--surface-overlay))",
        },
        content: {
          strong: "hsl(var(--text-strong))",
          muted: "hsl(var(--text-muted))",
          subtle: "hsl(var(--text-subtle))",
        },
        line: {
          subtle: "hsl(var(--line-subtle))",
          strong: "hsl(var(--line-strong))",
        },
        status: {
          success: {
            DEFAULT: "hsl(var(--color-success))",
            bg: "hsl(var(--status-success-bg))",
            border: "hsl(var(--status-success-border))",
          },
          warning: {
            DEFAULT: "hsl(var(--color-warning))",
            bg: "hsl(var(--status-warning-bg))",
            border: "hsl(var(--status-warning-border))",
          },
          error: {
            DEFAULT: "hsl(var(--color-error))",
            bg: "hsl(var(--status-error-bg))",
            border: "hsl(var(--status-error-border))",
          },
          info: {
            DEFAULT: "hsl(var(--color-info))",
            bg: "hsl(var(--status-info-bg))",
            border: "hsl(var(--status-info-border))",
          },
        },
        state: {
          loading: "hsl(var(--color-loading))",
          empty: "hsl(var(--color-empty))",
          conflict: {
            DEFAULT: "hsl(var(--color-conflict))",
            bg: "hsl(var(--state-conflict-bg))",
            border: "hsl(var(--state-conflict-border))",
          },
        },
        board: {
          column: "hsl(var(--board-column-bg))",
          "column-border": "hsl(var(--board-column-border))",
          card: "hsl(var(--board-card-bg))",
          drop: "hsl(var(--board-drop-bg))",
          "drop-ring": "hsl(var(--board-drop-ring))",
        },
        stage: {
          slate: { DEFAULT: "hsl(var(--stage-slate))", bg: "hsl(var(--stage-slate-bg))" },
          blue: { DEFAULT: "hsl(var(--stage-blue))", bg: "hsl(var(--stage-blue-bg))" },
          amber: { DEFAULT: "hsl(var(--stage-amber))", bg: "hsl(var(--stage-amber-bg))" },
          green: { DEFAULT: "hsl(var(--stage-green))", bg: "hsl(var(--stage-green-bg))" },
          red: { DEFAULT: "hsl(var(--stage-red))", bg: "hsl(var(--stage-red-bg))" },
          violet: { DEFAULT: "hsl(var(--stage-violet))", bg: "hsl(var(--stage-violet-bg))" },
        },
      },
      spacing: {
        "density-row": "var(--density-row)",
        "density-field": "var(--density-field)",
        "density-card": "var(--density-card-padding)",
        "portal-card": "var(--portal-card-padding)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        drag: "var(--board-drag-shadow)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      ringColor: {
        DEFAULT: "hsl(var(--focus-ring))",
      },
    },
  },
  plugins: [],
};

export default config;
