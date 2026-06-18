import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
