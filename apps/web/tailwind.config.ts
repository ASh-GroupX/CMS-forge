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
        status: {
          success: "hsl(var(--color-success))",
          warning: "hsl(var(--color-warning))",
          error: "hsl(var(--color-error))",
          info: "hsl(var(--color-info))",
        },
        state: {
          loading: "hsl(var(--color-loading))",
          empty: "hsl(var(--color-empty))",
          conflict: "hsl(var(--color-conflict))",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
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
